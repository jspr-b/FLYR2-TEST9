import { NextResponse } from 'next/server'
import { fetchSchipholFlights, transformSchipholFlight } from '@/lib/schiphol-api'
import { getTodayAmsterdam } from '@/lib/amsterdam-time'

export async function GET() {
  try {
    const todayDate = getTodayAmsterdam()
    console.log(`🔍 Testing ALL flights for date: ${todayDate}`)
    
    // Fetch ALL departing flights (no airline filter)
    const allData = await fetchSchipholFlights({
      flightDirection: 'D',
      scheduleDate: todayDate,
      fetchAllPages: true,
      maxPagesToFetch: 50 // More pages since we're getting all airlines
    })

    console.log(`Total ALL flights: ${allData.flights.length}`)
    
    // Transform flights
    const allFlights = allData.flights.map(transformSchipholFlight)
    
    // Find KLM-operated flights
    const klmOperatedFlights = allFlights.filter(flight => {
      // Check various ways a flight might be KLM-operated
      const isKLMByName = flight.flightName.startsWith('KL')
      const isKLMByMainFlight = flight.mainFlight?.startsWith('KL') || false
      const isKLMByPrefix = flight.prefixIATA === 'KL' || flight.prefixICAO === 'KLM'
      
      return isKLMByName || isKLMByMainFlight || isKLMByPrefix
    })
    
    // Also fetch with KL airline filter for comparison
    const klData = await fetchSchipholFlights({
      flightDirection: 'D',
      airline: 'KL',
      scheduleDate: todayDate,
      fetchAllPages: true,
      maxPagesToFetch: 50
    })
    
    const klFlights = klData.flights.map(transformSchipholFlight)
    
    // Find flights that might be missing
    const missingFlights = klmOperatedFlights.filter(flight => 
      !klFlights.find(kl => kl.flightNumber === flight.flightNumber)
    )
    
    // Count cancelled flights
    const cancelledInAll = klmOperatedFlights.filter(f => 
      f.publicFlightState?.flightStates?.includes('CNX')
    ).length
    
    const cancelledInKL = klFlights.filter(f => 
      f.publicFlightState?.flightStates?.includes('CNX')
    ).length
    
    return NextResponse.json({
      summary: {
        totalAllAirlines: allFlights.length,
        klmOperatedFromAll: klmOperatedFlights.length,
        klFilteredFromAPI: klFlights.length,
        difference: klmOperatedFlights.length - klFlights.length,
        missingFlights: missingFlights.length,
        cancelledInAll: cancelledInAll,
        cancelledInKL: cancelledInKL
      },
      missingFlightsSample: missingFlights.slice(0, 10).map(f => ({
        flightName: f.flightName,
        flightNumber: f.flightNumber,
        mainFlight: f.mainFlight,
        prefixIATA: f.prefixIATA,
        prefixICAO: f.prefixICAO,
        destination: f.route?.destinations?.[0],
        states: f.publicFlightState?.flightStates
      }))
    })
  } catch (error) {
    console.error('Test error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}