import { NextRequest, NextResponse } from 'next/server'
import { fetchSchipholFlights, transformSchipholFlight, filterFlights, removeDuplicateFlights, removeStaleFlights } from '@/lib/schiphol-api'
import { getCurrentAmsterdamTime, getTodayAmsterdam } from '@/lib/amsterdam-time'

// Gate occupancy status definitions
type GateOccupancyStatus = 
  | 'SCHEDULED'      // Gate has flights scheduled (SCH, DEL, GCH states)
  | 'OCCUPIED'       // Flight currently at gate (BRD, GTO, GCL, GTD, WIL states)
  | 'DEPARTED'       // Flight recently departed (DEP state within 60 min)
  | 'CONFLICT'       // Multiple flights assigned overlapping times
  | 'MAINTENANCE'   // Gate closed for maintenance
  | 'UNKNOWN'       // Status cannot be determined

// Flight state mappings to occupancy status
const FLIGHT_STATE_MAPPING = {
  // Currently occupying gate
  'BRD': 'OCCUPIED',    // Boarding
  'GTO': 'OCCUPIED',    // Gate Open
  'GCL': 'OCCUPIED',    // Gate Closing
  'GTD': 'OCCUPIED',    // Gate Closed
  'WIL': 'OCCUPIED',    // Wait in Lounge
  
  // Recently departed
  'DEP': 'DEPARTED',    // Departed
  
  // Scheduled flights
  'SCH': 'SCHEDULED', // Flight Scheduled
  'DEL': 'SCHEDULED', // Delayed (still scheduled, just delayed)
  'GCH': 'SCHEDULED', // Gate Change (still a scheduled flight)
  
  // Special states
  'CNX': 'AVAILABLE',   // Cancelled
  'TOM': 'AVAILABLE',   // Tomorrow
  
  // Legacy mappings for compatibility
  'BOARDING': 'OCCUPIED',
  'ON_TIME': 'OCCUPIED', 
  'DELAYED': 'OCCUPIED',
  'DEPARTED': 'DEPARTED',
  'CANCELLED': 'AVAILABLE',
  'AIR': 'AVAILABLE',
  'EXP': 'AVAILABLE'
} as const

// Human-readable flight state descriptions
const FLIGHT_STATE_DESCRIPTIONS = {
  'SCH': 'Flight Scheduled',
  'DEL': 'Delayed',
  'WIL': 'Wait in Lounge',
  'GTO': 'Gate Open',
  'BRD': 'Boarding',
  'GCL': 'Gate Closing',
  'GTD': 'Gate Closed',
  'DEP': 'Departed',
  'CNX': 'Cancelled',
  'GCH': 'Gate Change',
  'TOM': 'Tomorrow'
}

interface GateOccupancyData {
  gateID: string
  status: GateOccupancyStatus
  occupiedBy: string | null
  utilizationPercent: number
  scheduledFlights: Array<{
    flightName: string
    flightNumber: string
    scheduleDateTime: string
    aircraftType: string
    destination: string
    gate: string
    pier: string
    flightStates: string[]
    flightStatesReadable: string[]
    primaryState: string
    primaryStateReadable: string
    delayMinutes: number
    delayFormatted: string
    isDelayed: boolean
    lastUpdated: string
  }>
  conflicts: Array<any>
  physicalStatus: string
  pier: string
  gateType: string
  lastUpdated: string
}

// B. TEMPORAL-AWARE UTILIZATION STRUCTURE
interface EnhancedGateUtilization {
  current: number                    // 0-2 hour window, active states only
  daily: number                     // Total scheduled flights for day  
  physical: 'NONE' | 'BOARDING' | 'DEPARTING' | 'TURNAROUND' | 'OCCUPIED'
  logical: number                   // Future flight count
  temporalStatus: 'DEAD_ZONE' | 'PRE_OPERATIONAL' | 'ACTIVE' | 'POST_OPERATIONAL'
  hoursUntilNextActivity: number
}

interface TemporalContext {
  analysisTime: string
  operationalWindow: 'DEAD_ZONE' | 'PRE_OPERATIONAL' | 'ACTIVE' | 'POST_OPERATIONAL'
  hoursUntilActivity: number
  nextFlightReady: boolean
  currentHour: number
}

interface EnhancedGateOccupancyData extends Omit<GateOccupancyData, 'utilizationPercent'> {
  utilization: EnhancedGateUtilization
  temporalContext: TemporalContext
}

// Known bus gates configuration
const BUS_GATES = [
  'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8',
  'C21', 'C22', 'C23', 'C24',
  'D6', 'E21', 'G1'
]

// Gate type classification based on Schiphol layout
function classifyGateType(gate: string, pier: string): 'SCHENGEN' | 'NON_SCHENGEN' | 'UNKNOWN' {
  if (!gate || !pier) return 'UNKNOWN'
  
  // Pier D has both Schengen and Non-Schengen
  if (pier === 'D') {
    const gateNumber = parseInt(gate.replace(/\D/g, ''))
    if (gateNumber >= 59 && gateNumber <= 87) return 'SCHENGEN'
    if (gateNumber >= 1 && gateNumber <= 58) return 'NON_SCHENGEN'
  }
  
  // Standard pier classifications
  const schengenPiers = ['A', 'B', 'C']
  const nonSchengenPiers = ['E', 'F', 'G', 'H', 'M']
  
  if (schengenPiers.includes(pier)) return 'SCHENGEN'
  if (nonSchengenPiers.includes(pier)) return 'NON_SCHENGEN'
  
  return 'UNKNOWN'
}

// Determine current gate status based on flight states and timing
// Enhanced logic: Checks ALL flight states, not just primary state
// Priority order: Active gate states > Departed > Gate changes > Primary state mapping
// 
// Examples:
// - Flight with SCH (primary), GTO → Returns OCCUPIED (gate is open)
// - Flight with SCH (primary) only → Returns SCHEDULED
// - Flight with DEL (primary), BRD → Returns OCCUPIED (boarding active)
function determineGateStatus(flights: any[], currentTime: Date): GateOccupancyStatus {
  if (flights.length === 0) return 'SCHEDULED'
  
  // Sort by schedule time to get current/next flight
  const sortedFlights = flights.sort((a, b) => 
    new Date(a.scheduleDateTime).getTime() - new Date(b.scheduleDateTime).getTime()
  )
  
  // Check current flight status - hub gates can handle multiple flights
  for (const flight of sortedFlights) {
    const scheduleTime = new Date(flight.scheduleDateTime)
    const timeDiffMinutes = (scheduleTime.getTime() - currentTime.getTime()) / (1000 * 60)
    
    // Get all flight states, not just primary
    const flightStates = flight.publicFlightState?.flightStates || []
    const primaryState = flightStates[0]
    if (!primaryState) continue
    
    // Enhanced logic: Check for active gate states regardless of primary state
    // Priority: Active gate states > Gate changes > Primary state mapping
    
    // First, check for any active gate states (these override everything)
    const occupiedStates = ['BRD', 'GTO', 'GCL', 'GTD', 'WIL']
    for (const state of occupiedStates) {
      if (flightStates.includes(state)) {
        return 'OCCUPIED' // Active gate state found
      }
    }
    
    // Check for departed state
    if (flightStates.includes('DEP') && timeDiffMinutes > -60) {
      return 'DEPARTED' // Recently departed
    }
    
    // Fall back to standard mapping for primary state
    const mappedStatus = FLIGHT_STATE_MAPPING[primaryState as keyof typeof FLIGHT_STATE_MAPPING]
    
    if (mappedStatus === 'OCCUPIED') return 'OCCUPIED'
    if (mappedStatus === 'DEPARTED' && timeDiffMinutes > -60) return 'DEPARTED' // Recently departed
    if (mappedStatus === 'SCHEDULED') return 'SCHEDULED' // All scheduled flights (SCH, DEL, GCH)
  }
  
  return 'SCHEDULED'
}

// Hub gates like D6, E21, G1 have subgates and can handle multiple flights simultaneously
// No conflict detection needed for these operational hub gates

// Calculate delay time in minutes between scheduled and estimated times
function calculateDelayMinutes(scheduledTime: string, estimatedTime: string): number {
  const scheduled = new Date(scheduledTime)
  const estimated = new Date(estimatedTime)
  const delayMs = estimated.getTime() - scheduled.getTime()
  return Math.round(delayMs / (1000 * 60)) // Convert to minutes
}

// Identify delayed flights across all gates
function analyzeDelayedFlights(filteredFlights: any[]): any {
  const delayedFlights = []
  let totalDelayMinutes = 0
  let maxDelay = 0
  let maxDelayFlight = null

  for (const flight of filteredFlights) {
    const scheduledTime = flight.scheduleDateTime
    const estimatedTime = flight.publicEstimatedOffBlockTime || flight.scheduleDateTime
    const delayMinutes = calculateDelayMinutes(scheduledTime, estimatedTime)
    
    // Consider flights delayed if they have DEL state or are delayed by more than 15 minutes
    const primaryState = flight.publicFlightState?.flightStates?.[0]
    const isDelayed = primaryState === 'DEL' || delayMinutes > 15
    
    if (isDelayed && delayMinutes > 0) {
      const delayedFlight = {
        flightName: flight.flightName,
        flightNumber: flight.flightNumber,
        gate: flight.gate || 'UNASSIGNED',
        pier: flight.pier || 'UNKNOWN',
        destination: flight.route?.destinations?.[0] || 'UNKNOWN',
        aircraftType: flight.aircraftType?.iataMain || flight.aircraftType?.iataSub || 'UNKNOWN',
        scheduledTime: scheduledTime,
        estimatedTime: estimatedTime,
        delayMinutes: delayMinutes,
        delayFormatted: `${Math.floor(delayMinutes / 60)}h ${delayMinutes % 60}m`,
        flightStates: flight.publicFlightState?.flightStates || [],
        primaryState: primaryState || 'UNKNOWN',
        lastUpdated: flight.lastUpdatedAt
      }
      
      delayedFlights.push(delayedFlight)
      totalDelayMinutes += delayMinutes
      
      if (delayMinutes > maxDelay) {
        maxDelay = delayMinutes
        maxDelayFlight = delayedFlight
      }
    }
  }

  // Sort by delay time (highest first)
  delayedFlights.sort((a, b) => b.delayMinutes - a.delayMinutes)

  return {
    flights: delayedFlights,
    summary: {
      totalDelayedFlights: delayedFlights.length,
      averageDelayMinutes: delayedFlights.length > 0 ? Math.round(totalDelayMinutes / delayedFlights.length) : 0,
      totalDelayMinutes: totalDelayMinutes,
      maxDelay: {
        minutes: maxDelay,
        formatted: maxDelay > 0 ? `${Math.floor(maxDelay / 60)}h ${maxDelay % 60}m` : '0m',
        flight: maxDelayFlight
      }
    }
  }
}

// Calculate gate utilization percentage
function calculateUtilization(flights: any[]): number {
  if (flights.length === 0) return 0
  
  const OPERATIONAL_HOURS_PER_DAY = 16
  const AVERAGE_FLIGHT_DURATION_HOURS = 1 // Including turnaround
  
  const utilizationPercent = Math.min(100, (flights.length * AVERAGE_FLIGHT_DURATION_HOURS / OPERATIONAL_HOURS_PER_DAY) * 100)
  return Math.round(utilizationPercent)
}

// A. CORRECTED UTILIZATION FORMULA - Temporal-aware calculation
function calculateCurrentUtilization(flights: any[], currentTime: Date): number {
  const OPERATIONAL_WINDOW_HOURS = 2 // Only count flights within 2 hours
  const now = currentTime.getTime()
  
  const activeFlights = flights.filter(flight => {
    const flightTime = new Date(flight.scheduleDateTime).getTime()
    const timeDiffHours = Math.abs(flightTime - now) / (1000 * 60 * 60)
    return timeDiffHours <= OPERATIONAL_WINDOW_HOURS
  })
  
  const physicallyActiveFlights = activeFlights.filter(flight => {
    const flightStates = flight.publicFlightState?.flightStates || []
    
    // Check for any physically active states regardless of primary state
    const physicalStates = ['BRD', 'GTO', 'GCL', 'GTD', 'DEP']
    return physicalStates.some((state: string) => flightStates.includes(state))
  })
  
  return physicallyActiveFlights.length > 0 ? 
    Math.min(100, (physicallyActiveFlights.length / 3) * 100) : 0
}

function calculateDailyCapacity(flights: any[]): number {
  if (flights.length === 0) return 0
  
  const OPERATIONAL_HOURS_PER_DAY = 16
  const AVERAGE_FLIGHT_DURATION_HOURS = 1
  
  const utilizationPercent = Math.min(100, (flights.length * AVERAGE_FLIGHT_DURATION_HOURS / OPERATIONAL_HOURS_PER_DAY) * 100)
  return Math.round(utilizationPercent)
}

function determinePhysicalActivity(flights: any[]): 'NONE' | 'BOARDING' | 'DEPARTING' | 'TURNAROUND' | 'OCCUPIED' {
  const activeFlights = flights.filter(flight => {
    const flightStates = flight.publicFlightState?.flightStates || []
    
    // Check for any active states regardless of primary state
    const activeStates = ['BRD', 'GTO', 'GCL', 'GTD', 'DEP']
    return activeStates.some(state => flightStates.includes(state))
  })
  
  if (activeFlights.length === 0) return 'NONE'
  
  // Collect all active states from active flights
  const allStates = activeFlights.flatMap(flight => {
    const flightStates = flight.publicFlightState?.flightStates || []
    
    // Return all active states found in this flight
    return flightStates.filter((state: string) => ['BRD', 'GTO', 'GCL', 'GTD', 'DEP'].includes(state))
  })
  
  if (allStates.includes('BRD') || allStates.includes('GTO')) return 'BOARDING'
  if (allStates.includes('DEP')) return 'DEPARTING'
  if (allStates.includes('GCL') || allStates.includes('GTD')) return 'OCCUPIED'
  
  return 'TURNAROUND'
}

function determineTemporalStatus(currentTime: Date, flights: any[]): 'DEAD_ZONE' | 'PRE_OPERATIONAL' | 'ACTIVE' | 'POST_OPERATIONAL' {
  // Check for active flights first
  const activeFlights = flights.filter(flight => {
    const flightStates = flight.publicFlightState?.flightStates || []
    
    // Check for any active states regardless of primary state
    const activeStates = ['BRD', 'GTO', 'GCL', 'GTD', 'DEP']
    return activeStates.some((state: string) => flightStates.includes(state))
  })
  
  if (activeFlights.length > 0) return 'ACTIVE'
  
  // Calculate hours until next flight
  const hoursUntilNext = calculateHoursUntilNextActivity(currentTime, flights)
  
  // More than 1.5 hours before departure = DEAD_ZONE
  if (hoursUntilNext > 1.5) return 'DEAD_ZONE'
  
  // Within 1.5 hours of departure = PRE_OPERATIONAL
  if (hoursUntilNext <= 1.5 && hoursUntilNext > 0) return 'PRE_OPERATIONAL'
  
  // No future flights
  if (hoursUntilNext === 999) return 'POST_OPERATIONAL'
  
  return 'ACTIVE'
}

function calculateHoursUntilNextActivity(currentTime: Date, flights: any[]): number {
  if (flights.length === 0) return 999
  
  const now = currentTime.getTime()
  const futureFlights = flights.filter(flight => {
    const flightTime = new Date(flight.scheduleDateTime).getTime()
    return flightTime > now
  })
  
  if (futureFlights.length === 0) return 999
  
  const nextFlight = futureFlights.reduce((earliest, flight) => {
    const flightTime = new Date(flight.scheduleDateTime).getTime()
    const earliestTime = new Date(earliest.scheduleDateTime).getTime()
    return flightTime < earliestTime ? flight : earliest
  })
  
  const nextFlightTime = new Date(nextFlight.scheduleDateTime).getTime()
  const hoursUntil = (nextFlightTime - now) / (1000 * 60 * 60)
  
  return Math.max(0, hoursUntil)
}

function createEnhancedUtilization(flights: any[], currentTime: Date): EnhancedGateUtilization {
  return {
    current: calculateCurrentUtilization(flights, currentTime),
    daily: calculateDailyCapacity(flights),
    physical: determinePhysicalActivity(flights),
    logical: flights.length,
    temporalStatus: determineTemporalStatus(currentTime, flights),
    hoursUntilNextActivity: calculateHoursUntilNextActivity(currentTime, flights)
  }
}

function createTemporalContext(currentTime: Date, flights: any[]): TemporalContext {
  const hoursUntilActivity = calculateHoursUntilNextActivity(currentTime, flights)
  
  return {
    analysisTime: currentTime.toISOString(),
    operationalWindow: determineTemporalStatus(currentTime, flights),
    hoursUntilActivity: hoursUntilActivity,
    nextFlightReady: hoursUntilActivity <= 2,
    currentHour: currentTime.getHours()
  }
}

// Hub gates operate continuously - no specific "next available" slot calculation needed

export async function GET(request: NextRequest) {
  try {
    // Use Amsterdam time for all calculations to match Schiphol API data
    const currentTime = getCurrentAmsterdamTime()
    const today = getTodayAmsterdam()
    
    // Check if this is a background refresh
    const isBackgroundRefresh = request.headers.get('X-Background-Refresh') === 'true'
    
    // Refresh Strategy:
    // - Initial load: Fetch up to 20 pages to get comprehensive data
    // - Background refresh (every 10 min): Only fetch 5 pages for recent updates
    // - This prevents timeouts and reduces server load while keeping data fresh
    
    console.log(`🔍 GATE OCCUPANCY ANALYSIS for ${today} (Background: ${isBackgroundRefresh})`)
    console.log('=' .repeat(60))

    // Fetch today's flights
    const apiConfig = {
      flightDirection: 'D' as const,
      airline: 'KL',
      scheduleDate: today,
      fetchAllPages: true,
      isBackgroundRefresh,
      // For background refresh, only fetch first 5 pages to get recent updates
      // This reduces load and prevents timeouts during automatic refresh
      maxPagesToFetch: isBackgroundRefresh ? 5 : 20
    }

    const schipholData = await fetchSchipholFlights(apiConfig)
    const allFlights = (schipholData.flights || []).map(transformSchipholFlight)

    const filters = {
      flightDirection: 'D' as const,
      scheduleDate: today,
      isOperationalFlight: true,
      prefixicao: 'KL'
    }
    
    let filteredFlights = filterFlights(allFlights, filters)
    filteredFlights = removeDuplicateFlights(filteredFlights)
    filteredFlights = removeStaleFlights(filteredFlights, 24) // Remove flights older than 24 hours

    console.log(`📊 Processing ${filteredFlights.length} flights for gate occupancy analysis`)

    // Group flights by gate
    const gateFlightsMap = new Map<string, any[]>()
    
    filteredFlights.forEach(flight => {
      const gate = flight.gate || 'UNASSIGNED'
      if (!gateFlightsMap.has(gate)) {
        gateFlightsMap.set(gate, [])
      }
      gateFlightsMap.get(gate)!.push(flight)
    })

    // Process each gate
    const gateOccupancyData: EnhancedGateOccupancyData[] = []
    
    for (const [gateID, gateFlights] of Array.from(gateFlightsMap.entries())) {
      if (gateID === 'UNASSIGNED') continue // Skip unassigned flights for gate analysis
      
      const scheduledFlights = gateFlights.map(flight => {
        // Determine the best estimated departure time first
        let estimatedDateTime = flight.publicEstimatedOffBlockTime
        
        // Check if flight has delay state
        const flightStates = flight.publicFlightState?.flightStates || []
        const hasDelayState = flightStates.includes('DEL')
        
        // If flight is marked as delayed but no estimated time from API, we need to calculate it
        if (hasDelayState && !estimatedDateTime) {
          // Check if there's any delay information in the flight data
          const delayInfo = flight.delay || flight.delayMinutes || flight.publicFlightState?.delay
          let estimatedDelayMinutes = 0
          
          if (delayInfo && typeof delayInfo === 'number') {
            estimatedDelayMinutes = delayInfo
          } else if (delayInfo && typeof delayInfo === 'string') {
            // Try to parse delay from string format like "26min" or "1h 30m"
            const delayMatch = delayInfo.match(/(\d+)/)
            estimatedDelayMinutes = delayMatch ? parseInt(delayMatch[1]) : 30 // Default 30min
          } else {
            // Default delay for flights marked as delayed but no specific info
            estimatedDelayMinutes = 30
          }
          
          const scheduled = new Date(flight.scheduleDateTime)
          estimatedDateTime = new Date(scheduled.getTime() + estimatedDelayMinutes * 60 * 1000).toISOString()
        }
        
        // Calculate actual delay minutes for display purposes
        const delayMinutes = calculateDelayMinutes(flight.scheduleDateTime, estimatedDateTime || flight.scheduleDateTime)
        
        return {
          flightName: flight.flightName,
          flightNumber: flight.flightNumber,
          scheduleDateTime: flight.scheduleDateTime,
          estimatedDateTime: estimatedDateTime || null,
          actualDateTime: flight.actualOffBlockTime || null,
        aircraftType: flight.aircraftType?.iataMain || flight.aircraftType?.iataSub || 'UNKNOWN',
        destination: flight.route?.destinations?.[0] || 'UNKNOWN',
        gate: flight.gate || gateID,
        pier: flight.pier || 'UNKNOWN',
        flightStates: flight.publicFlightState?.flightStates || [],
        flightStatesReadable: flight.publicFlightState?.flightStates?.map((state: keyof typeof FLIGHT_STATE_DESCRIPTIONS) => 
          FLIGHT_STATE_DESCRIPTIONS[state] || state) || [],
        primaryState: flight.publicFlightState?.flightStates?.[0] || 'UNKNOWN',
        primaryStateReadable: FLIGHT_STATE_DESCRIPTIONS[flight.publicFlightState?.flightStates?.[0] as keyof typeof FLIGHT_STATE_DESCRIPTIONS] || 'Unknown',
          delayMinutes: calculateDelayMinutes(flight.scheduleDateTime, estimatedDateTime || flight.scheduleDateTime),
          delayFormatted: (() => {
            const delay = calculateDelayMinutes(flight.scheduleDateTime, estimatedDateTime || flight.scheduleDateTime);
            return delay > 0 ? `${Math.floor(delay / 60)}h ${delay % 60}m` : '0m';
          })(),
          delayReason: flight.publicFlightState?.delayReason || 'Reason not specified',
          isDelayed: flight.publicFlightState?.flightStates?.[0] === 'DEL' || calculateDelayMinutes(flight.scheduleDateTime, estimatedDateTime || flight.scheduleDateTime) > 15,
          lastUpdated: flight.lastUpdatedAt
        }
      })
      
      const status = determineGateStatus(gateFlights, currentTime)
      const occupyingFlight = gateFlights.find(flight => {
        const flightStates = flight.publicFlightState?.flightStates || []
        
        // Check for any active gate states regardless of primary state
        const occupiedStates = ['BRD', 'GTO', 'GCL', 'GTD', 'WIL']
        return occupiedStates.some(state => flightStates.includes(state))
      })
      const pier = gateFlights[0]?.pier || 'UNKNOWN'
      const gateType = classifyGateType(gateID, pier)
      const utilization = createEnhancedUtilization(gateFlights, currentTime)
      const temporalContext = createTemporalContext(currentTime, gateFlights)
      
      const gateData: EnhancedGateOccupancyData = {
        gateID,
        status,
        occupiedBy: occupyingFlight?.flightName,
        scheduledFlights,
        conflicts: [], // Hub gates don't have conflicts - they have subgates
        utilization,
        temporalContext,
        physicalStatus: 'SYSTEM_DERIVED', // All data from Schiphol API
        pier,
        gateType,
        lastUpdated: currentTime.toISOString()
      }
      
      gateOccupancyData.push(gateData)
    }

    // Sort by gate ID for consistent ordering
    gateOccupancyData.sort((a, b) => a.gateID.localeCompare(b.gateID))

    // Analyze delayed flights
    const delayedFlightsAnalysis = analyzeDelayedFlights(filteredFlights)

    // Calculate summary statistics
    const statusCounts = gateOccupancyData.reduce((acc, gate) => {
      acc[gate.status] = (acc[gate.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Calculate active piers (piers that have at least one OCCUPIED gate)
    const activePiers = new Set<string>()
    const allPiers = new Set<string>()
    
    gateOccupancyData.forEach(gate => {
      allPiers.add(gate.pier)
      if (gate.status === 'OCCUPIED') {
        activePiers.add(gate.pier)
      }
    })

    // Calculate KLM operational footprint vs total Schiphol
    const TOTAL_SCHIPHOL_GATES = 223 // Based on Schiphol documentation
    const TOTAL_SCHIPHOL_PIERS = 8 // B, C, D, E, F, G, H, M
    const klmOperationalFootprint = Math.round((gateOccupancyData.length / TOTAL_SCHIPHOL_GATES) * 100)
    
    // Calculate pier utilization with Pier D split by Schengen/Non-Schengen
    const pierUtilization = Array.from(allPiers).flatMap(pier => {
      const pierGates = gateOccupancyData.filter(gate => gate.pier === pier)
      
      if (pier === 'D') {
        // Split Pier D into Schengen and Non-Schengen zones
        const nonSchengenGates = pierGates.filter(gate => {
          const gateNum = parseInt(gate.gateID.replace('D', ''))
          return gateNum <= 57
        })
        const schengenGates = pierGates.filter(gate => {
          const gateNum = parseInt(gate.gateID.replace('D', ''))
          return gateNum > 57
        })
        
        return [
          {
            pier: 'D-Non-Schengen',
            gates: nonSchengenGates.length,
            flights: nonSchengenGates.reduce((sum, gate) => sum + gate.utilization.logical, 0),
            avgUtilization: nonSchengenGates.length > 0 ? 
              Math.round(nonSchengenGates.reduce((sum, gate) => sum + gate.utilization.current, 0) / nonSchengenGates.length) : 0
          },
          {
            pier: 'D-Schengen',
            gates: schengenGates.length,
            flights: schengenGates.reduce((sum, gate) => sum + gate.utilization.logical, 0),
            avgUtilization: schengenGates.length > 0 ? 
              Math.round(schengenGates.reduce((sum, gate) => sum + gate.utilization.current, 0) / schengenGates.length) : 0
          }
        ]
      } else {
        // Other piers remain unchanged
        const pierFlights = pierGates.reduce((sum, gate) => sum + gate.utilization.logical, 0)
        return [{
          pier,
          gates: pierGates.length,
          flights: pierFlights,
          avgUtilization: pierGates.length > 0 ? 
            Math.round(pierGates.reduce((sum, gate) => sum + gate.utilization.current, 0) / pierGates.length) : 0
        }]
      }
    }).sort((a, b) => b.flights - a.flights)

    const summary = {
      // Existing metrics
      totalGates: gateOccupancyData.length,
      totalPiers: allPiers.size,
      activePiers: activePiers.size,
      activePiersList: Array.from(activePiers).sort(),
      statusBreakdown: statusCounts,
      averageUtilization: Math.round(
        gateOccupancyData.reduce((sum, gate) => sum + gate.utilization.current, 0) / gateOccupancyData.length
      ),
      delayedFlights: delayedFlightsAnalysis.summary,
      
      // Enhanced context metrics
      schipholContext: {
        totalSchipholGates: TOTAL_SCHIPHOL_GATES,
        totalSchipholPiers: TOTAL_SCHIPHOL_PIERS,
        klmOperationalFootprint: klmOperationalFootprint,
        klmGatesUsedToday: gateOccupancyData.length,
        unusedSchipholGates: TOTAL_SCHIPHOL_GATES - gateOccupancyData.length,
        pierUtilization: pierUtilization,
        busiestPier: pierUtilization[0]?.pier || 'N/A',
        totalFlightsHandled: filteredFlights.length
      },
      
      lastAnalyzed: currentTime.toISOString(),
      dataSource: 'SCHIPHOL_API_SYSTEM_DERIVED'
    }

    console.log('\n📊 GATE OCCUPANCY SUMMARY:')
    console.log(`  • Total Gates Analyzed: ${summary.totalGates}`)
    console.log(`  • Total Piers: ${summary.totalPiers}`)
    console.log(`  • Active Piers: ${summary.activePiers} (${summary.activePiersList.join(', ')})`)
    console.log(`  • Status Breakdown:`, statusCounts)
    console.log(`  • Average Utilization: ${summary.averageUtilization}%`)
    console.log(`  • Delayed Flights: ${delayedFlightsAnalysis.summary.totalDelayedFlights}`)
    console.log(`  • Average Delay: ${delayedFlightsAnalysis.summary.averageDelayMinutes} minutes`)
    console.log(`  • Max Delay: ${delayedFlightsAnalysis.summary.maxDelay.formatted}`)
    console.log(`  • Hub Gates (D6, E21, G1) operate with subgates - no conflicts tracked`)

    const responseData = {
      gates: gateOccupancyData,
      delayedFlights: delayedFlightsAnalysis.flights,
      summary,
      metadata: {
        analysisTime: currentTime.toISOString(),
        dataSource: 'Schiphol Public API',
        flightsAnalyzed: filteredFlights.length,
        gatesAnalyzed: gateOccupancyData.length,
        delayedFlightsAnalyzed: delayedFlightsAnalysis.summary.totalDelayedFlights,
        lastUpdated: currentTime.toISOString(),
        note: 'Hub gates (D6, E21, G1) operate with subgates for multiple simultaneous flights'
      }
    }

    return NextResponse.json(responseData)
    
  } catch (error) {
    console.error('❌ GATE OCCUPANCY API ERROR:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('Is background refresh:', isBackgroundRefresh)
    
    // Provide more specific error messages
    let errorMessage = 'Failed to analyze gate occupancy'
    let details = 'Unknown error'
    
    if (error instanceof Error) {
      details = error.message
      if (error.message.includes('HTTP')) {
        errorMessage = 'Schiphol API returned an error'
      } else if (error.message.includes('timeout') || error.message.includes('aborted')) {
        errorMessage = 'Request timed out - API may be slow'
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Network connection error'
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage, 
        details: details,
        timestamp: new Date().toISOString(),
        isBackgroundRefresh: isBackgroundRefresh
      },
      { status: 500 }
    )
  }
}

// ===============================================
// FUTURE GATE CHANGE METRICS PLANNING STUBS
// ===============================================

// Data model interfaces for gate change tracking
interface GateChangeEvent {
  flightId: string
  flightName: string
  previousGate: string | null
  newGate: string
  changeTime: string
  changeReason: 'SCHEDULE_UPDATE' | 'OPERATIONAL_REQUIREMENT' | 'AIRCRAFT_CHANGE' | 'DELAY_MANAGEMENT' | 'MANUAL_OVERRIDE'
  changeSource: 'SYSTEM_AUTOMATIC' | 'DISPATCHER_MANUAL' | 'AIRLINE_REQUEST'
  changeDurationMinutes: number
  lastUpdated: string
}

interface GateChangeSummary {
  gateId: string
  totalChangesToday: number
  lastChange: string | null
  frequentlyReassignedFlights: string[]
  instabilityScore: number // 0-100, higher = more unstable
  peakChangeHours: string[]
}

interface FlightChangeHistory {
  flightId: string
  flightName: string
  gateAssignmentHistory: Array<{
    gate: string
    assignedAt: string
    reassignedAt: string | null
    durationMinutes: number
  }>
  totalChanges: number
  finalGate: string
  isStableAssignment: boolean
}

// Future endpoint structure planning
interface GateChangeMetricsResponse {
  gateChanges: GateChangeEvent[]
  gateSummaries: GateChangeSummary[]
  flightHistories: FlightChangeHistory[]
  summary: {
    totalChangesToday: number
    mostChangedGate: string
    mostChangedFlight: string
    averageChangesPerGate: number
    lastMinuteChanges: number // Changes within 2 hours of departure
    stabilityIndex: number // Overall airport gate stability 0-100
  }
  metadata: {
    analysisTime: string
    dataSource: string
    trackingPeriod: string
  }
}

// Supervisor dashboard view planning
interface SupervisorGateChangeView {
  highChangeFlights: Array<{
    flightName: string
    totalChanges: number
    currentGate: string
    lastChangeTime: string
    timeUntilDeparture: string
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  }>
  unstableGates: Array<{
    gateId: string
    changesCount: number
    affectedFlights: string[]
    lastChangeTime: string
    operationalImpact: string
  }>
  lastMinuteSwitches: Array<{
    flightName: string
    fromGate: string
    toGate: string
    changeTime: string
    minutesBeforeDeparture: number
    reason: string
  }>
  gateTimeline: Array<{
    gateId: string
    timeline: Array<{
      time: string
      event: 'ASSIGNED' | 'REASSIGNED' | 'CLEARED'
      flightName: string
      reason?: string
    }>
  }>
}

// Planned API endpoints:
// GET /api/gate-changes - Main gate change metrics
// GET /api/gate-changes/supervisor - Supervisor dashboard view
// GET /api/gate-changes/gate/{gateId} - Individual gate change history
// GET /api/gate-changes/flight/{flightId} - Individual flight gate history
// POST /api/gate-changes/report - Report a new gate change event 