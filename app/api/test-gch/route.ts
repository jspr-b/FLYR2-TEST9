import { NextRequest, NextResponse } from 'next/server'
import { fetchSchipholFlights, transformSchipholFlight } from '@/lib/schiphol-api'
import { getTodayAmsterdam } from '@/lib/amsterdam-time'

export async function GET(request: NextRequest) {
  try {
    const todayDate = getTodayAmsterdam()
    console.log(`Testing GCH flights for date: ${todayDate}`)
    
    // Fetch ALL flights without any filtering
    const rawData = await fetchSchipholFlights({
      flightDirection: 'D',
      scheduleDate: todayDate,
      fetchAllPages: true
    })

    console.log(`Total raw flights: ${rawData.flights.length}`)
    
    // Transform flights
    const flights = rawData.flights.map(transformSchipholFlight)
    
    // Find all flights with GCH state
    const gchFlights = flights.filter(flight => {
      const states = flight.publicFlightState?.flightStates || []
      return states.includes('GCH')
    })
    
    console.log(`Flights with GCH state: ${gchFlights.length}`)
    
    // Log details of first few GCH flights
    gchFlights.slice(0, 10).forEach(flight => {
      console.log(`${flight.flightName} to ${flight.route.destinations[0]} - Gate: ${flight.gate || 'NO GATE'}, States: ${flight.publicFlightState?.flightStates?.join(', ')}`)
    })
    
    // Get unique state patterns with GCH
    const statePatterns = new Map<string, number>()
    flights.forEach(flight => {
      const states = flight.publicFlightState?.flightStates || []
      if (states.includes('GCH')) {
        const pattern = states.join(',')
        statePatterns.set(pattern, (statePatterns.get(pattern) || 0) + 1)
      }
    })
    
    return NextResponse.json({
      totalFlights: flights.length,
      gchFlights: gchFlights.length,
      gchPatterns: Array.from(statePatterns.entries()).map(([pattern, count]) => ({ pattern, count })),
      sampleGchFlights: gchFlights.slice(0, 10).map(f => ({
        flight: f.flightName,
        number: f.flightNumber,
        destination: f.route.destinations[0],
        gate: f.gate,
        pier: f.pier,
        states: f.publicFlightState?.flightStates,
        mainFlight: f.mainFlight,
        prefixIATA: f.prefixIATA
      }))
    })
    
  } catch (error) {
    console.error('Error testing GCH:', error)
    return NextResponse.json({ error: 'Failed to test GCH flights' }, { status: 500 })
  }
}