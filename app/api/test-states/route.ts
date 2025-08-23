import { NextRequest, NextResponse } from 'next/server'
import { fetchSchipholFlights, transformSchipholFlight } from '@/lib/schiphol-api'
import { getTodayAmsterdam } from '@/lib/amsterdam-time'

export async function GET(request: NextRequest) {
  try {
    const todayDate = getTodayAmsterdam()
    
    // Fetch flights
    const rawData = await fetchSchipholFlights({
      flightDirection: 'D',
      scheduleDate: todayDate,
      fetchAllPages: false // Just one page for testing
    })
    
    // Transform flights
    const flights = rawData.flights.map(transformSchipholFlight)
    
    // Collect all unique states
    const allStates = new Set<string>()
    const stateExamples = new Map<string, any>()
    
    flights.forEach(flight => {
      const states = flight.publicFlightState?.flightStates || []
      states.forEach(state => {
        allStates.add(state)
        if (!stateExamples.has(state)) {
          stateExamples.set(state, {
            flight: flight.flightName,
            destination: flight.route.destinations[0],
            allStates: states
          })
        }
      })
    })
    
    // Check raw data structure
    const rawFlightSample = rawData.flights[0]
    
    return NextResponse.json({
      totalFlights: flights.length,
      uniqueStates: Array.from(allStates).sort(),
      stateExamples: Object.fromEntries(stateExamples),
      rawDataSample: {
        flightName: rawFlightSample?.flightName,
        publicFlightState: rawFlightSample?.publicFlightState,
        flightStates: rawFlightSample?.flightStates,
        // Check other possible fields
        gateChange: rawFlightSample?.gateChange,
        gate: rawFlightSample?.gate,
        actualOffBlockTime: rawFlightSample?.actualOffBlockTime,
        publicEstimatedOffBlockTime: rawFlightSample?.publicEstimatedOffBlockTime
      }
    })
    
  } catch (error) {
    console.error('Error testing states:', error)
    return NextResponse.json({ error: 'Failed to test states' }, { status: 500 })
  }
}