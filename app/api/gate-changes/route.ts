import { NextRequest, NextResponse } from 'next/server'
import { fetchSchipholFlights, transformSchipholFlight, filterFlights, removeDuplicateFlights, removeStaleFlights } from '@/lib/schiphol-api'
import { getCurrentAmsterdamTime, getTodayAmsterdam } from '@/lib/amsterdam-time'
import { ensureCacheWarmed } from '@/lib/cache-manager'

export async function GET(request: NextRequest) {
  try {
    console.log('📍 Gate Changes API: Starting request')
    
    // Fetch all pages of flight data for today
    const todayDate = getTodayAmsterdam()
    console.log(`📅 Fetching gate changes for date: ${todayDate}`)
    
    const apiConfig = {
      flightDirection: 'D' as const, // Departures only
      airline: 'KL', // Need to specify airline to get gate data from API
      scheduleDate: todayDate,
      fetchAllPages: true,
      maxPagesToFetch: 50
    }
    
    // Ensure cache is warmed and register for background refresh
    await ensureCacheWarmed('gate-changes-kl-departures', apiConfig)
    
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
      isOperationalFlight: false, // Include cancelled flights for complete data
      prefixicao: 'KL' // Include all KL flights (including codeshares)
    })
    
    // Remove stale and duplicate flights
    const freshFlights = removeStaleFlights(filteredFlights, 72)
    const uniqueFlights = removeDuplicateFlights(freshFlights)

    console.log(`🔍 Processing ${uniqueFlights.length} unique operational flights`)

    // Get current Amsterdam time
    const currentTime = getCurrentAmsterdamTime()

    // Extract gate change events (flights with GCH state)
    const gateChangeEvents = uniqueFlights
      .filter(flight => {
        // Check if flight has GCH in its states
        const hasGateChange = flight.publicFlightState?.flightStates?.includes('GCH') || false
        
        if (hasGateChange) {
          console.log(`✅ Found GCH flight: ${flight.flightName} to ${flight.route.destinations[0]}, states: ${flight.publicFlightState?.flightStates?.join(', ')}`)
        }
        
        // Include all KL-prefixed flights with gate changes (including codeshares)
        // This matches the behavior of other APIs like gate-occupancy
        if (hasGateChange && flight.mainFlight && !flight.mainFlight.startsWith('KL')) {
          console.log(`ℹ️ Including KL codeshare: ${flight.flightName} (operated by ${flight.mainFlight}) to ${flight.route.destinations[0]}`)
        }
        
        return hasGateChange && flight.gate // Must have gate change and gate assigned
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
          flightStates: flight.publicFlightState?.flightStates || [],
          flightStatesReadable: flight.publicFlightState?.flightStates?.map(state => {
            const stateDescriptions: Record<string, string> = {
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
            return stateDescriptions[state] || state
          }) || []
        }
      })
      .sort((a, b) => a.timeUntilDeparture - b.timeUntilDeparture)

    console.log(`🚨 Found ${gateChangeEvents.length} gate change events`)

    // Return the data in the expected format
    return NextResponse.json({
      gateChangeEvents,
      metadata: {
        total: gateChangeEvents.length,
        urgent: gateChangeEvents.filter(e => e.isPriority).length,
        delayed: gateChangeEvents.filter(e => e.isDelayed).length,
        timestamp: currentTime.toISOString(),
        amsterdamTime: currentTime.toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' })
      }
    })
    
  } catch (error) {
    console.error('❌ Error in gate changes endpoint:', error)
    return NextResponse.json(
      { error: 'Failed to fetch gate changes', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}