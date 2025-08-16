import { NextRequest, NextResponse } from 'next/server'
import { fetchSchipholFlights, transformSchipholFlight, filterFlights, removeDuplicateFlights, removeStaleFlights } from '@/lib/schiphol-api'
import { getCurrentAmsterdamTime, getTodayAmsterdam } from '@/lib/amsterdam-time'
import { ensureCacheWarmed } from '@/lib/cache-manager'

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
      isOperationalFlight: true,
      prefixicao: 'KL'
    })
    
    // Remove stale and duplicate flights
    const freshFlights = removeStaleFlights(filteredFlights)
    const uniqueFlights = removeDuplicateFlights(freshFlights)

    console.log(`🔍 Processing ${uniqueFlights.length} unique operational flights`)

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
 * Process flights for gate occupancy analysis
 */
function processGateOccupancy(flights: any[], currentTime: Date) {
  // Group flights by gate
  const gateMap = new Map<string, any[]>()
  
  flights.forEach(flight => {
    if (flight.gate) {
      if (!gateMap.has(flight.gate)) {
        gateMap.set(flight.gate, [])
      }
      gateMap.get(flight.gate)!.push(flight)
    }
  })

  // Analyze gate status
  const gates = Array.from(gateMap.entries()).map(([gateID, gateFlights]) => {
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
      scheduledFlights: gateFlights.length,
      flights: gateFlights
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

  return {
    summary: {
      totalGates: gates.length,
      totalPiers: pierSet.size,
      activePiers: uniqueActivePiers.length,
      activePiersList: uniqueActivePiers,
      statusBreakdown,
      averageUtilization: Math.round((gates.filter(g => g.status === 'OCCUPIED').length / gates.length) * 100)
    },
    gates: gates.slice(0, 100) // Limit to 100 gates for performance
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