/**
 * Gate Metrics Background Service
 * Pre-calculates and caches complex gate occupancy metrics
 */

import { fetchSchipholFlights, transformSchipholFlight, filterFlights, removeDuplicateFlights, removeStaleFlights } from './schiphol-api'
import { getCurrentAmsterdamTime, getTodayAmsterdam } from './amsterdam-time'

// In-memory cache for pre-computed metrics
interface CachedGateMetrics {
  data: any
  timestamp: number
  processingTime: number
}

// Global cache instance
let metricsCache: CachedGateMetrics | null = null
let isProcessing = false
let lastProcessingError: string | null = null

// Cache validity duration (2 minutes)
const CACHE_VALIDITY = 2 * 60 * 1000

/**
 * Check if cache is still valid
 */
export function isCacheValid(): boolean {
  if (!metricsCache) return false
  return Date.now() - metricsCache.timestamp < CACHE_VALIDITY
}

/**
 * Get cached metrics if available
 */
export function getCachedMetrics(): CachedGateMetrics | null {
  if (isCacheValid()) {
    return metricsCache
  }
  return null
}

/**
 * Get processing status
 */
export function getProcessingStatus() {
  return {
    isProcessing,
    lastError: lastProcessingError,
    lastUpdate: metricsCache?.timestamp || null,
    cacheValid: isCacheValid()
  }
}

/**
 * Process gate metrics in background
 * This function does all heavy calculations once and caches the result
 */
export async function processGateMetrics(): Promise<any> {
  // Prevent concurrent processing
  if (isProcessing) {
    console.log('⏳ Gate metrics already being processed, skipping...')
    return getCachedMetrics()?.data || null
  }

  try {
    isProcessing = true
    lastProcessingError = null
    const startTime = Date.now()

    console.log('🔄 Starting background gate metrics processing...')

    // Use Amsterdam time
    const currentTime = getCurrentAmsterdamTime()
    const today = getTodayAmsterdam()

    // Fetch flights from Schiphol API
    const apiConfig = {
      flightDirection: 'D' as const,
      airline: 'KL',
      scheduleDate: today,
      fetchAllPages: true
    }

    const schipholData = await fetchSchipholFlights(apiConfig)
    const allFlights = (schipholData.flights || []).map(transformSchipholFlight)

    // Filter flights
    const filters = {
      flightDirection: 'D' as const,
      scheduleDate: today,
      isOperationalFlight: true,
      prefixicao: 'KL'
    }
    
    let filteredFlights = filterFlights(allFlights, filters)
    filteredFlights = removeDuplicateFlights(filteredFlights)
    filteredFlights = removeStaleFlights(filteredFlights, 24)

    // Pre-compute all expensive operations
    const gateFlightsMap = new Map<string, any[]>()
    
    // Group flights by gate
    filteredFlights.forEach(flight => {
      const gate = flight.gate || 'UNASSIGNED'
      if (!gateFlightsMap.has(gate)) {
        gateFlightsMap.set(gate, [])
      }
      gateFlightsMap.get(gate)!.push(flight)
    })

    // Pre-compute gate occupancy data
    const precomputedGates: any[] = []
    
    for (const [gateID, gateFlights] of Array.from(gateFlightsMap.entries())) {
      if (gateID === 'UNASSIGNED') continue

      // Pre-calculate all flight timelines and states
      const processedFlights = gateFlights.map(flight => {
        const flightStates = flight.publicFlightState?.flightStates || []
        const estimatedDateTime = flight.publicEstimatedOffBlockTime || 
          (flightStates.includes('DEL') ? calculateDelayedTime(flight) : null)
        
        return {
          flightName: flight.flightName,
          flightNumber: flight.flightNumber,
          scheduleDateTime: flight.scheduleDateTime,
          estimatedDateTime,
          aircraftType: flight.aircraftType?.iataMain || flight.aircraftType?.iataSub || 'UNKNOWN',
          destination: flight.route?.destinations?.[0] || 'UNKNOWN',
          gate: gateID,
          pier: flight.pier || 'UNKNOWN',
          flightStates: flightStates,
          primaryState: flightStates[0] || 'UNKNOWN',
          isDelayed: flightStates.includes('DEL') || hasSignificantDelay(flight),
          delayMinutes: calculateDelayMinutes(flight.scheduleDateTime, estimatedDateTime || flight.scheduleDateTime)
        }
      })

      // Pre-calculate gate status
      const gateStatus = determineGateStatus(processedFlights, currentTime)
      const utilization = calculateUtilization(processedFlights, currentTime)
      
      precomputedGates.push({
        gateID,
        status: gateStatus,
        flights: processedFlights,
        utilization,
        pier: gateFlights[0]?.pier || 'UNKNOWN',
        flightCount: processedFlights.length
      })
    }

    // Pre-calculate delayed flights analysis
    const delayedFlights = filteredFlights.filter(flight => {
      const states = flight.publicFlightState?.flightStates || []
      const isDelayed = states.includes('DEL') || hasSignificantDelay(flight)
      return isDelayed
    })

    const totalDelayMinutes = delayedFlights.reduce((sum, flight) => {
      const delay = calculateDelayMinutes(
        flight.scheduleDateTime,
        flight.publicEstimatedOffBlockTime || flight.scheduleDateTime
      )
      return sum + Math.max(0, delay)
    }, 0)

    const maxDelayFlight = delayedFlights.reduce((max, flight) => {
      const delay = calculateDelayMinutes(
        flight.scheduleDateTime,
        flight.publicEstimatedOffBlockTime || flight.scheduleDateTime
      )
      return delay > (max?.delay || 0) ? { ...flight, delay } : max
    }, null as any)

    // Pre-calculate summary statistics
    const summary = {
      totalGates: precomputedGates.length,
      totalPiers: [...new Set(precomputedGates.map(g => g.pier))].length,
      activePiers: [...new Set(precomputedGates.filter(g => g.status === 'OCCUPIED').map(g => g.pier))].length,
      activePiersList: [...new Set(precomputedGates.filter(g => g.status === 'OCCUPIED').map(g => g.pier))],
      statusBreakdown: precomputedGates.reduce((acc, gate) => {
        acc[gate.status] = (acc[gate.status] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      averageUtilization: Math.round(
        precomputedGates.reduce((sum, gate) => sum + gate.utilization, 0) / Math.max(1, precomputedGates.length)
      ),
      delayedFlights: {
        totalDelayedFlights: delayedFlights.length,
        averageDelayMinutes: delayedFlights.length > 0 
          ? Math.round(totalDelayMinutes / delayedFlights.length) 
          : 0,
        totalDelayMinutes: totalDelayMinutes,
        maxDelay: {
          minutes: maxDelayFlight?.delay || 0,
          formatted: maxDelayFlight 
            ? `${Math.floor(maxDelayFlight.delay / 60)}h ${maxDelayFlight.delay % 60}m`
            : '0m',
          flight: maxDelayFlight
        }
      },
      schipholContext: {
        totalSchipholGates: 223,
        totalSchipholPiers: 8,
        klmOperationalFootprint: Math.round((precomputedGates.length / 223) * 100),
        klmGatesUsedToday: precomputedGates.length,
        unusedSchipholGates: 223 - precomputedGates.length,
        pierUtilization: [],
        busiestPier: precomputedGates.length > 0 ? precomputedGates[0].pier : 'N/A',
        totalFlightsHandled: filteredFlights.length
      }
    }

    const processingTime = Date.now() - startTime
    console.log(`✅ Gate metrics processing completed in ${processingTime}ms`)

    // Cache the result
    const result = {
      gates: precomputedGates,
      summary,
      metadata: {
        processedAt: currentTime.toISOString(),
        processingTime,
        flightCount: filteredFlights.length,
        gateCount: precomputedGates.length
      }
    }

    metricsCache = {
      data: result,
      timestamp: Date.now(),
      processingTime
    }

    return result

  } catch (error) {
    lastProcessingError = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ Gate metrics processing error:', error)
    throw error
  } finally {
    isProcessing = false
  }
}

// Helper functions (simplified versions)
function calculateDelayedTime(flight: any): string {
  const scheduled = new Date(flight.scheduleDateTime)
  const defaultDelay = 30 // 30 minutes default
  return new Date(scheduled.getTime() + defaultDelay * 60 * 1000).toISOString()
}

function hasSignificantDelay(flight: any): boolean {
  if (!flight.publicEstimatedOffBlockTime) return false
  const delayMinutes = calculateDelayMinutes(flight.scheduleDateTime, flight.publicEstimatedOffBlockTime)
  return delayMinutes > 15
}

function calculateDelayMinutes(scheduled: string, estimated: string): number {
  const scheduledTime = new Date(scheduled)
  const estimatedTime = new Date(estimated)
  const delayMs = estimatedTime.getTime() - scheduledTime.getTime()
  return Math.round(delayMs / (1000 * 60))
}

function determineGateStatus(flights: any[], currentTime: Date): string {
  if (flights.length === 0) return 'AVAILABLE'
  
  // Check for active flights
  const activeFlights = flights.filter(flight => {
    const states = flight.flightStates || []
    return states.some((state: string) => ['BRD', 'GTO', 'GCL', 'GTD', 'WIL'].includes(state))
  })
  
  if (activeFlights.length > 0) return 'OCCUPIED'
  
  // Check for preparing flights (scheduled within next 2 hours)
  const preparingFlights = flights.filter(flight => {
    const scheduleTime = new Date(flight.scheduleDateTime)
    const timeDiff = (scheduleTime.getTime() - currentTime.getTime()) / (1000 * 60)
    return timeDiff > 0 && timeDiff <= 120
  })
  
  if (preparingFlights.length > 0) return 'PREPARING'
  
  return 'SCHEDULED'
}

function calculateUtilization(flights: any[], currentTime: Date): number {
  const activeWindow = 2 * 60 * 60 * 1000 // 2 hours
  const now = currentTime.getTime()
  
  const activeFlights = flights.filter(flight => {
    const flightTime = new Date(flight.scheduleDateTime).getTime()
    return Math.abs(flightTime - now) <= activeWindow
  })
  
  return Math.min(100, (activeFlights.length / 3) * 100)
}

/**
 * Initialize background processing
 * Sets up periodic updates every 2 minutes
 */
export function initializeBackgroundProcessing() {
  // Initial processing
  processGateMetrics().catch(console.error)
  
  // Set up periodic updates
  setInterval(() => {
    if (!isProcessing) {
      processGateMetrics().catch(console.error)
    }
  }, 2 * 60 * 1000) // Every 2 minutes
}