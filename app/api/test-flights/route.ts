import { NextResponse } from 'next/server'
import { fetchSchipholFlights, transformSchipholFlight } from '@/lib/schiphol-api'
import { getTodayAmsterdam } from '@/lib/amsterdam-time'

export async function GET() {
  try {
    const todayDate = getTodayAmsterdam()
    console.log(`🔍 Testing flight filtering for date: ${todayDate}`)
    
    // Fetch ALL KL flights without client-side filtering
    const rawData = await fetchSchipholFlights({
      flightDirection: 'D',
      airline: 'KL',
      scheduleDate: todayDate,
      fetchAllPages: true,
      maxPagesToFetch: 50
    })

    console.log(`Total raw flights: ${rawData.flights.length}`)
    
    // Transform flights
    const flights = rawData.flights.map(transformSchipholFlight)
    
    // Analyze what we're filtering out
    const analysis = {
      totalRawFlights: flights.length,
      byMainFlight: {
        withMainFlight: 0,
        withoutMainFlight: 0,
        mainFlightNotKL: []
      },
      byFlightName: {
        startsWithKL: 0,
        notStartsWithKL: []
      },
      groundTransport: [],
      cancelled: 0,
      operational: 0
    }
    
    flights.forEach(flight => {
      // Check mainFlight
      if (flight.mainFlight) {
        analysis.byMainFlight.withMainFlight++
        if (!flight.mainFlight.startsWith('KL')) {
          analysis.byMainFlight.mainFlightNotKL.push({
            flightName: flight.flightName,
            mainFlight: flight.mainFlight,
            prefixIATA: flight.prefixIATA,
            prefixICAO: flight.prefixICAO
          })
        }
      } else {
        analysis.byMainFlight.withoutMainFlight++
      }
      
      // Check flightName
      if (flight.flightName.startsWith('KL')) {
        analysis.byFlightName.startsWithKL++
      } else {
        analysis.byFlightName.notStartsWithKL.push(flight.flightName)
      }
      
      // Check ground transport
      if (flight.flightNumber >= 9000 && flight.flightNumber <= 9999) {
        analysis.groundTransport.push(flight.flightName)
      }
      
      // Check cancelled
      if (flight.publicFlightState?.flightStates?.includes('CNX')) {
        analysis.cancelled++
      } else {
        analysis.operational++
      }
    })
    
    // Show summary
    console.log('ANALYSIS:', JSON.stringify(analysis, null, 2))
    
    return NextResponse.json({
      analysis,
      sampleFlights: flights.slice(0, 5).map(f => ({
        flightName: f.flightName,
        flightNumber: f.flightNumber,
        mainFlight: f.mainFlight,
        prefixIATA: f.prefixIATA,
        prefixICAO: f.prefixICAO,
        states: f.publicFlightState?.flightStates
      }))
    })
  } catch (error) {
    console.error('Test error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}