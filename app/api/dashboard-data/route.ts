import { NextRequest, NextResponse } from 'next/server'
import { fetchSchipholFlights, transformSchipholFlight, filterFlights, removeDuplicateFlights, removeStaleFlights } from '@/lib/schiphol-api'
import { getCurrentAmsterdamTime, getTodayAmsterdam } from '@/lib/amsterdam-time'
import { ensureCacheWarmed } from '@/lib/cache-manager'
import { getMostSignificantState } from '@/lib/flight-state-priority'

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
      fetchAllPages: true
    }
    
    // Ensure cache is warmed and register for background refresh
    await ensureCacheWarmed('dashboard-combined-data', apiConfig)
    
    // Create a timeout promise that rejects after 25 seconds
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout - data fetch taking too long')), 25000)
    })
    
    // Race between data fetch and timeout
    const rawData = await Promise.race([
      fetchSchipholFlights(apiConfig),
      timeoutPromise
    ])

    if (!rawData.flights) {
      console.error('❌ No flights data received from Schiphol API')
      return NextResponse.json({ error: 'No data received from API' }, { status: 500 })
    }

    console.log(`✅ Received ${rawData.flights.length} raw flights from API`)

    // Transform and filter flights
    const transformedFlights = rawData.flights.map(transformSchipholFlight)
    const filteredFlights = filterFlights(transformedFlights, {
      flightDirection: 'D',
      scheduleDate: todayDate,
      isOperationalFlight: !includeCancelled, // If includeCancelled is true, don't filter by operational status
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

    // Count gates - only exclude cancelled flights WITH gates from metrics
    const tbdGates = uniqueFlights.filter(f => f.gate === 'TBD').length
    const assignedGates = uniqueFlights.filter(f => f.gate && f.gate !== 'TBD').length
    // No gates includes operational flights + cancelled flights without gates
    const noGates = uniqueFlights.filter(f => !f.gate).length
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
        todayDate
      }
    }

    // Add gate occupancy data if requested
    if (includeGateOccupancy) {
      const gateOccupancyData = processGateOccupancy(uniqueFlights, currentTime)
      response.gateOccupancy = gateOccupancyData
      // Also add raw flights data for gate status metrics
      response.flights = uniqueFlights
    }

    // Add gate changes data if requested
    if (includeGateChanges) {
      const gateChangesData = processGateChanges(uniqueFlights, currentTime)
      response.gateChanges = gateChangesData
    }

    console.log('✅ Dashboard data compiled successfully')
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('❌ Error in dashboard data endpoint:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * Helper function to get readable flight state
 */
function getFlightStateReadable(state: string): string {
  const stateMap: Record<string, string> = {
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
  return stateMap[state] || state
}

/**
 * Calculate delay in minutes
 */
function calculateDelay(flight: any): number {
  if (flight.scheduleDateTime) {
    const scheduled = new Date(flight.scheduleDateTime)
    // Use actual off-block time if available (departed flights), otherwise estimated time
    const actualTime = flight.actualOffBlockTime || flight.publicEstimatedOffBlockTime
    if (actualTime) {
      const actual = new Date(actualTime)
      return Math.max(0, Math.round((actual.getTime() - scheduled.getTime()) / (1000 * 60)))
    }
  }
  return 0
}

/**
 * Format delay for display
 */
function formatDelay(minutes: number): string {
  if (minutes === 0) return ''
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

/**
 * Process flights for gate occupancy analysis
 */
function processGateOccupancy(flights: any[], currentTime: Date) {
  // Group flights by gate
  const gateMap = new Map<string, any[]>()
  
  flights.forEach(flight => {
    // Handle cancelled flights with original gates
    if (flight.isCancelled && flight.originalGate) {
      console.log(`📍 Adding cancelled flight ${flight.flightName} to gate ${flight.originalGate} for display`)
      // Add cancelled flights to their original gate for Gantt display
      const gate = flight.originalGate
      if (!gateMap.has(gate)) {
        gateMap.set(gate, [])
      }
      // Restore the gate for display purposes
      gateMap.get(gate)!.push({
        ...flight,
        gate: gate,
        isCancelled: true
      })
    } else if (flight.gate) {
      // Normal flight processing
      if (!gateMap.has(flight.gate)) {
        gateMap.set(flight.gate, [])
      }
      gateMap.get(flight.gate)!.push(flight)
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
    .filter(([gateID]) => gateID !== 'NO_GATE') // Exclude NO_GATE from gates list
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
      pier: gateID.charAt(0),
      status,
      occupiedBy,
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
        delayReason: calculateDelay(flight) > 0 ? 'Operational' : '',
        isDelayed: flight.publicFlightState?.flightStates?.includes('DEL') || calculateDelay(flight) > 15,
        scheduleDateTime: flight.scheduleDateTime,
        estimatedDateTime: flight.publicEstimatedOffBlockTime || null,
        actualDateTime: flight.actualOffBlockTime || null,
        actualOffBlockTime: flight.actualOffBlockTime || null,
        expectedTimeBoarding: flight.expectedTimeBoarding || null
      }))
    }
  })

  // Calculate summary statistics
  const statusBreakdown = gates.reduce((acc, gate) => {
    acc[gate.status] = (acc[gate.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const pierSet = new Set(gates.map(g => g.pier))
  const activePiers = gates.filter(g => g.status !== 'AVAILABLE').map(g => g.pier)
  const uniqueActivePiers = [...new Set(activePiers)]

  // Calculate delay statistics
  const delayedFlights = flights.filter(f => calculateDelay(f) > 0)
  const totalDelayMinutes = delayedFlights.reduce((sum, f) => sum + calculateDelay(f), 0)
  const averageDelayMinutes = delayedFlights.length > 0 ? Math.round(totalDelayMinutes / delayedFlights.length) : 0
  
  const maxDelayFlight = delayedFlights.reduce((max, f) => {
    const delay = calculateDelay(f)
    return delay > calculateDelay(max) ? f : max
  }, delayedFlights[0] || null)

  // Count total scheduled flights
  const totalScheduledFlights = gates.reduce((sum, gate) => sum + gate.scheduledFlights.length, 0)
  console.log(`📊 Total scheduled flights across all gates: ${totalScheduledFlights}`)
  
  return {
    summary: {
      totalGates: gates.length,
      totalPiers: pierSet.size,
      activePiers: uniqueActivePiers.length,
      activePiersList: uniqueActivePiers,
      statusBreakdown,
      averageUtilization: Math.round((gates.filter(g => g.status === 'OCCUPIED').length / gates.length) * 100),
      delayedFlights: {
        totalDelayedFlights: delayedFlights.length,
        averageDelayMinutes,
        totalDelayMinutes,
        maxDelay: maxDelayFlight ? {
          minutes: calculateDelay(maxDelayFlight),
          formatted: formatDelay(calculateDelay(maxDelayFlight)),
          flight: maxDelayFlight
        } : {
          minutes: 0,
          formatted: '',
          flight: null
        }
      },
      schipholContext: {
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
      displayNoGateCount: flights.filter(f => !f.gate).length
    },
    gates: gates // Return all gates
  }
}

/**
 * Process flights for gate changes (GCH state)
 */
function processGateChanges(flights: any[], currentTime: Date) {
  const gateChangeEvents = flights
    .filter(flight => {
      // Check if flight has GCH in its states
      return flight.publicFlightState?.flightStates?.includes('GCH') && flight.gate
    })
    .map(flight => {
      const scheduleTime = new Date(flight.scheduleDateTime)
      const timeUntilDeparture = Math.round((scheduleTime.getTime() - currentTime.getTime()) / (1000 * 60))
      
      // Calculate delay
      let delayMinutes = 0
      if (flight.publicEstimatedOffBlockTime && flight.scheduleDateTime) {
        const scheduled = new Date(flight.scheduleDateTime)
        const estimated = new Date(flight.publicEstimatedOffBlockTime)
        delayMinutes = Math.round((estimated.getTime() - scheduled.getTime()) / (1000 * 60))
      }

      return {
        flightNumber: flight.flightNumber.toString(),
        flightName: flight.flightName,
        currentGate: flight.gate,
        pier: flight.pier || 'Unknown',
        destination: flight.route.destinations[0] || 'Unknown',
        aircraftType: flight.aircraftType.iataMain || flight.aircraftType.iataSub || 'Unknown',
        scheduleDateTime: flight.scheduleDateTime,
        timeUntilDeparture,
        isDelayed: flight.publicFlightState?.flightStates?.includes('DEL') || delayMinutes > 15,
        delayMinutes: Math.max(0, delayMinutes),
        isPriority: timeUntilDeparture < 60 && timeUntilDeparture > 0,
        flightStates: flight.publicFlightState?.flightStates || []
      }
    })
    .sort((a, b) => a.timeUntilDeparture - b.timeUntilDeparture)

  return {
    gateChangeEvents,
    metadata: {
      total: gateChangeEvents.length,
      urgent: gateChangeEvents.filter(e => e.isPriority).length,
      delayed: gateChangeEvents.filter(e => e.isDelayed).length
    }
  }
}