import { NextRequest, NextResponse } from 'next/server'
import { fetchSchipholFlights, transformSchipholFlight, filterFlights, removeDuplicateFlights, removeStaleFlights } from '@/lib/schiphol-api'
import { getCurrentAmsterdamTime, getTodayAmsterdam } from '@/lib/amsterdam-time'
import { ensureCacheWarmed } from '@/lib/cache-manager'
import { getMostSignificantState } from '@/lib/flight-state-priority'

// Extend Vercel function timeout to 60 seconds
export const maxDuration = 60

/**
 * Combined endpoint that fetches flight data once and provides all dashboard information
 * This reduces multiple API calls to a single efficient request
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📊 Dashboard Data API: Starting combined data fetch')
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const includeGateOccupancy = searchParams.get('includeGateOccupancy') !== 'false'
    const includeGateChanges = searchParams.get('includeGateChanges') !== 'false'
    // When true, includes ALL cancelled flights scheduled for today
    // This shows the complete operational picture for today, including flights cancelled yesterday
    const includeCancelled = searchParams.get('includeCancelled') === 'true'
    
    // Fetch all pages of flight data for today
    const todayDate = getTodayAmsterdam()
    console.log(`📅 Fetching dashboard data for date: ${todayDate}`)
    
    const apiConfig = {
      flightDirection: 'D' as const, // Departures only
      airline: 'KL',
      scheduleDate: todayDate,
      fetchAllPages: true,
      isBackgroundRefresh: false
    }
    
    // Register cache warming task BEFORE fetching data
    // This ensures that even if this request times out, background refresh will maintain fresh data
    ensureCacheWarmed('dashboard-combined-data', async () => {
      console.log('🔄 Background cache refresh triggered for dashboard data')
      const backgroundConfig = {
        ...apiConfig,
        isBackgroundRefresh: true,
        maxPagesToFetch: 25 // Limit pages for background refresh to avoid timeout
      }
      return await fetchSchipholFlights(backgroundConfig)
    }, 4 * 60 * 1000) // 4 minutes - more frequent than UI refresh to ensure fresh data
    
    // Fetch the flight data - this will use cache if available
    const apiResponse = await fetchSchipholFlights(apiConfig)
    
    if (!apiResponse.flights || apiResponse.flights.length === 0) {
      console.warn('⚠️ No flights returned from Schiphol API')
      return NextResponse.json({ 
        flights: [],
        metadata: {
          totalFlights: 0,
          timestamp: getCurrentAmsterdamTime().toISOString(),
          amsterdamTime: getCurrentAmsterdamTime().toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' }),
          todayDate
        }
      })
    }
    
    console.log(`✅ Received ${apiResponse.flights.length} raw flights from API`)
    
    // Apply KLM filtering to remove codeshares
    let filteredFlights = filterFlights(apiResponse.flights, {
      scheduleDate: todayDate,
      prefixicao: 'KL'
    })
    
    if (includeCancelled) {
      console.log('📌 Including cancelled flights in the response')
    }
    
    // Remove stale and duplicate flights
    // When includeCancelled is true, we keep ALL cancelled flights scheduled for today
    // regardless of when they were cancelled, as they still impact today's operations
    let freshFlights = filteredFlights
    if (includeCancelled) {
      // Separate cancelled and non-cancelled flights
      const cancelledFlights = filteredFlights.filter(f => 
        f.publicFlightState?.flightStates?.includes('CNX')
      )
      const nonCancelledFlights = filteredFlights.filter(f => 
        !f.publicFlightState?.flightStates?.includes('CNX')
      )
      
      // Apply stale filter only to non-cancelled flights
      const freshNonCancelled = removeStaleFlights(nonCancelledFlights)
      
      // Combine fresh non-cancelled with ALL cancelled flights
      freshFlights = [...freshNonCancelled, ...cancelledFlights]
      
      console.log(`📊 Keeping ALL ${cancelledFlights.length} cancelled flights scheduled for today (regardless of cancellation date)`)
    } else {
      // Normal stale filtering when not including cancelled
      freshFlights = removeStaleFlights(filteredFlights)
    }
    
    let uniqueFlights = removeDuplicateFlights(freshFlights)

    // Process cancelled flights - move their gate assignment to originalGate and set gate to null
    uniqueFlights = uniqueFlights.map(flight => {
      if (flight.publicFlightState?.flightStates?.includes('CNX')) {
        console.log(`🚫 Processing cancelled flight: ${flight.flightName} - Moving gate ${flight.gate || 'NO GATE'} to originalGate`)
        // Store original gate for display purposes
        return {
          ...flight,
          originalGate: flight.gate, // Preserve original gate for Gantt chart
          gate: null, // Move to "no gate assigned"
          isCancelled: true
        }
      }
      return flight
    })

    // Count gates - need to account for cancelled flights properly
    const tbdGates = uniqueFlights.filter(f => f.gate === 'TBD').length
    // For assigned gates, also include cancelled flights with originalGate
    const assignedGates = uniqueFlights.filter(f => (f.gate && f.gate !== 'TBD') || (f.isCancelled && f.originalGate && f.originalGate !== 'TBD')).length
    // No gates only includes flights that never had a gate (not cancelled flights that had gates)
    const noGates = uniqueFlights.filter(f => !f.gate && !f.originalGate).length
    const cancelledWithGates = uniqueFlights.filter(f => f.isCancelled && f.originalGate).length
    const cancelledNoGates = uniqueFlights.filter(f => f.isCancelled && !f.originalGate).length
    
    console.log(`🔍 Processing ${uniqueFlights.length} total flights`)
    console.log(`📊 Gate Status: ${assignedGates} assigned, ${tbdGates} TBD, ${noGates} no gate`)
    console.log(`🚫 Cancelled breakdown: ${cancelledWithGates} with gates (excluded from no-gate), ${cancelledNoGates} without gates (included in no-gate)`)

    // Get current Amsterdam time
    const currentTime = getCurrentAmsterdamTime()

    // Prepare response object
    const response: any = {
      metadata: {
        totalFlights: uniqueFlights.length,
        timestamp: currentTime.toISOString(),
        amsterdamTime: currentTime.toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' }),
        todayDate,
        // Add gate statistics for consistency
        gateStatistics: {
          assignedGates,
          tbdGates,
          noGates,
          cancelledWithGates,
          cancelledNoGates,
          // Calculate unique gates used (including cancelled flights' original gates)
          uniqueGatesUsed: new Set(uniqueFlights
            .map(f => f.gate || f.originalGate)
            .filter(g => g && g !== 'TBD')).size
        }
      }
    }

    // Add gate occupancy data if requested
    if (includeGateOccupancy) {
      const gateOccupancyData = processGateOccupancy(uniqueFlights, currentTime)
      response.gateOccupancy = gateOccupancyData
      // Also add raw flights data for gate status metrics
      response.flights = uniqueFlights
    } else if (includeGateChanges) {
      // Only return flights for gate changes view
      response.flights = uniqueFlights
    } else {
      // Return all flight data by default
      response.flights = uniqueFlights
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('❌ Dashboard Data API Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch dashboard data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Extract flight states readable format
 */
function getFlightStateReadable(state: string): string {
  const stateMap: Record<string, string> = {
    'SCH': 'Scheduled',
    'AIR': 'Airborne',
    'EXP': 'Expected Landing',
    'FLB': 'Flight Plan Activated',
    'LND': 'Landed',
    'FIR': 'Flight In Dutch Airspace',
    'ARR': 'Arrived At Gate',
    'BRD': 'Boarding',
    'GTO': 'Gate Open', 
    'GCL': 'Gate Closing',
    'GTD': 'Gate Closed',
    'DEP': 'Departed',
    'CNX': 'Cancelled',
    'TOM': 'Tomorrow',
    'DLY': 'Delayed',
    'GCH': 'Gate Changed',
    'WIL': 'Wait In Lounge'
  }
  return stateMap[state] || state
}

/**
 * Calculate flight delay in minutes
 */
function calculateDelay(flight: any): number {
  if (!flight.publicEstimatedOffBlockTime || !flight.scheduleDateTime) {
    return 0
  }
  
  const scheduled = new Date(flight.scheduleDateTime)
  const estimated = new Date(flight.publicEstimatedOffBlockTime)
  const delayMs = estimated.getTime() - scheduled.getTime()
  
  return Math.round(delayMs / (1000 * 60)) // Convert to minutes
}

/**
 * Format delay for display
 */
function formatDelay(minutes: number): string {
  if (minutes <= 0) return 'On time'
  if (minutes < 60) return `${minutes}m delay`
  
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins}m delay`
}

/**
 * Process gate occupancy data with improved structure
 */
function processGateOccupancy(flights: any[], currentTime: Date) {
  // Group flights by gate
  const gateMap = new Map<string, any[]>()
  
  flights.forEach(flight => {
    // Handle cancelled flights differently - use originalGate if available
    const gateID = flight.isCancelled && flight.originalGate ? flight.originalGate : flight.gate
    
    if (gateID) {
      if (!gateMap.has(gateID)) {
        gateMap.set(gateID, [])
      }
      gateMap.get(gateID)!.push(flight)
    } else {
      // Flights with no gate (including cancelled flights with no original gate)
      const noGateKey = 'NO_GATE'
      if (!gateMap.has(noGateKey)) {
        gateMap.set(noGateKey, [])
      }
      gateMap.get(noGateKey)!.push(flight)
      console.log(`📍 Adding flight ${flight.flightName} to NO_GATE category${flight.isCancelled ? ' (cancelled)' : ''}`)
    }
  })

  // Analyze gate status
  console.log(`📊 Processing ${gateMap.size} gates with flights`)
  const gates = Array.from(gateMap.entries())
    .map(([gateID, gateFlights]) => {
    // Sort flights by schedule time
    gateFlights.sort((a, b) => 
      new Date(a.scheduleDateTime).getTime() - new Date(b.scheduleDateTime).getTime()
    )

    // Determine current gate status
    const currentTimestamp = currentTime.getTime()
    let status = 'AVAILABLE'
    let occupiedBy = null
    
    for (const flight of gateFlights) {
      const scheduleTime = new Date(flight.scheduleDateTime).getTime()
      const timeDiff = scheduleTime - currentTimestamp
      
      if (flight.publicFlightState?.flightStates?.includes('DEP')) {
        continue // Skip departed flights
      }
      
      if (Math.abs(timeDiff) < 2 * 60 * 60 * 1000) { // Within 2 hours
        if (flight.publicFlightState?.flightStates?.includes('BRD')) {
          status = 'OCCUPIED'
          occupiedBy = flight.flightName
        } else if (flight.publicFlightState?.flightStates?.includes('GTO')) {
          status = 'OCCUPIED'
          occupiedBy = flight.flightName
        } else if (flight.publicFlightState?.flightStates?.includes('GCL')) {
          status = 'OCCUPIED'
          occupiedBy = flight.flightName
        } else if (flight.publicFlightState?.flightStates?.includes('GTD')) {
          status = 'OCCUPIED'
          occupiedBy = flight.flightName
        } else if (timeDiff < 60 * 60 * 1000 && timeDiff > 0) { // Next hour
          status = 'PREPARING'
          occupiedBy = flight.flightName
        } else {
          status = 'SCHEDULED'
        }
        break
      }
    }

    return {
      gateID,
      pier: gateID === 'NO_GATE' ? 'NO_GATE' : gateID.charAt(0),
      status: gateID === 'NO_GATE' ? 'PENDING' : status,
      occupiedBy: gateID === 'NO_GATE' ? null : occupiedBy,
      utilization: {
        current: status === 'OCCUPIED' ? 100 : 0,
        daily: Math.round((gateFlights.length / 20) * 100), // Estimate based on typical daily flights
        physical: status,
        logical: gateFlights.length,
        temporalStatus: status === 'OCCUPIED' ? 'ACTIVE' : 'IDLE',
        hoursUntilNextActivity: 0
      },
      scheduledFlights: gateFlights.map(flight => ({
        flightName: flight.flightName,
        flightNumber: flight.flightNumber.toString(),
        aircraftType: flight.aircraftType?.iataMain || flight.aircraftType?.iataSub || 'Unknown',
        destination: flight.route?.destinations?.[0] || 'Unknown',
        primaryState: getMostSignificantState(flight.publicFlightState?.flightStates || []),
        primaryStateReadable: getFlightStateReadable(getMostSignificantState(flight.publicFlightState?.flightStates || [])),
        flightStates: flight.publicFlightState?.flightStates || [],
        flightStatesReadable: (flight.publicFlightState?.flightStates || []).map(getFlightStateReadable),
        delayMinutes: calculateDelay(flight),
        delayFormatted: formatDelay(calculateDelay(flight)),
        scheduleDateTime: flight.scheduleDateTime,
        estimatedDateTime: flight.publicEstimatedOffBlockTime || flight.scheduleDateTime,
        isDelayed: calculateDelay(flight) > 0,
        isCancelled: flight.isCancelled || false,
        originalGate: flight.originalGate || null
      }))
    }
  })

  // Sort gates by ID
  gates.sort((a, b) => {
    if (a.gateID === 'NO_GATE') return 1
    if (b.gateID === 'NO_GATE') return -1
    return a.gateID.localeCompare(b.gateID)
  })

  // Calculate summary statistics
  const statusBreakdown = gates.reduce((acc, gate) => {
    acc[gate.status] = (acc[gate.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const averageUtilization = gates.length > 0
    ? gates.reduce((sum, gate) => sum + gate.utilization.current, 0) / gates.length
    : 0

  // Calculate additional metrics
  const delayedFlights = flights.filter(f => calculateDelay(f) > 0)
  const averageDelay = delayedFlights.length > 0
    ? delayedFlights.reduce((sum, f) => sum + calculateDelay(f), 0) / delayedFlights.length
    : 0
  const maxDelay = delayedFlights.length > 0
    ? Math.max(...delayedFlights.map(f => calculateDelay(f)))
    : 0

  // Add metadata for analysis
  const activePiers = new Set(gates
    .filter(g => g.status === 'OCCUPIED' && g.pier !== 'NO_GATE')
    .map(g => g.pier))

  return {
    metadata: {
      timestamp: currentTime.toISOString(),
      amsterdamTime: currentTime.toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' }),
      flightsAnalyzed: flights.length,
      schipholInfrastructure: {
        totalSchipholGates: 223,
        totalSchipholPiers: 8,
        klmOperationalFootprint: Math.round((gates.length / 223) * 100),
        klmGatesUsedToday: gates.length,
        unusedSchipholGates: 223 - gates.length,
        pierUtilization: [],
        busiestPier: gates.length > 0 ? gates[0].pier : 'N/A',
        totalFlightsHandled: flights.length
      },
      // Add no-gate counts for the UI
      operationalNoGateCount: flights.filter(f => !f.gate && !f.isCancelled).length,
      // Total no-gate for display (operational + cancelled without gates)
      displayNoGateCount: flights.filter(f => !f.gate).length,
      // Add counts that properly account for cancelled flights
      actualTotalGatesUsed: new Set(flights.map(f => f.gate || f.originalGate).filter(g => g && g !== 'TBD')).size,
      actualFlightsWithGates: flights.filter(f => (f.gate && f.gate !== 'TBD') || (f.originalGate && f.originalGate !== 'TBD')).length
    },
    gates: gates // Return all gates
  }
}

/**
 * Process flights for gate changes (GCH state)
 */
function processGateChanges(flights: any[], currentTime: Date) {
  // Filter flights with gate changes
  const gateChangedFlights = flights.filter(flight => 
    flight.publicFlightState?.flightStates?.includes('GCH')
  )

  // Sort by scheduled departure time
  gateChangedFlights.sort((a, b) => 
    new Date(a.scheduleDateTime).getTime() - new Date(b.scheduleDateTime).getTime()
  )

  console.log(`🔄 Found ${gateChangedFlights.length} flights with gate changes`)

  return {
    metadata: {
      timestamp: currentTime.toISOString(),
      amsterdamTime: currentTime.toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' }),
      totalGateChanges: gateChangedFlights.length
    },
    flights: gateChangedFlights.map(flight => ({
      ...flight,
      gateChangeInfo: {
        currentGate: flight.gate || 'TBD',
        hasGateChange: true,
        flightStates: flight.publicFlightState?.flightStates || []
      }
    }))
  }
}