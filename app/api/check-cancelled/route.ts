import { NextResponse } from 'next/server'
import { fetchSchipholFlights, transformSchipholFlight } from '@/lib/schiphol-api'
import { getTodayAmsterdam } from '@/lib/amsterdam-time'

export async function GET() {
  try {
    const todayDate = getTodayAmsterdam()
    
    // Fetch all KL flights for today
    const apiConfig = {
      flightDirection: 'D' as const,
      airline: 'KL',
      scheduleDate: todayDate,
      fetchAllPages: true,
      maxPagesToFetch: 50
    }
    
    const schipholData = await fetchSchipholFlights(apiConfig)
    const allFlights = (schipholData.flights || []).map(transformSchipholFlight)
    
    // Find flights with CNX state
    const cancelledFlights = allFlights.filter(flight => 
      flight.publicFlightState?.flightStates?.includes('CNX')
    )
    
    // Find flights without mainFlight
    const withoutMainFlight = allFlights.filter(flight => !flight.mainFlight)
    
    // Find KLM-operated flights (mainFlight starts with KL or no mainFlight)
    const klmOperated = allFlights.filter(flight => 
      !flight.mainFlight || flight.mainFlight.startsWith('KL')
    )
    
    // Summary
    const summary = {
      totalFromAPI: allFlights.length,
      cancelled: cancelledFlights.length,
      withoutMainFlight: withoutMainFlight.length,
      klmOperated: klmOperated.length,
      codeshares: allFlights.length - klmOperated.length
    }
    
    // Sample data
    const samples = {
      cancelledSample: cancelledFlights.slice(0, 5).map(f => ({
        flightName: f.flightName,
        destination: f.route?.destinations?.[0] || 'Unknown',
        mainFlight: f.mainFlight || 'N/A',
        states: f.publicFlightState?.flightStates || []
      })),
      withoutMainFlightSample: withoutMainFlight.slice(0, 10).map(f => ({
        flightName: f.flightName,
        destination: f.route?.destinations?.[0] || 'Unknown',
        flightNumber: f.flightNumber
      }))
    }
    
    return NextResponse.json({
      summary,
      samples,
      message: `Found ${cancelledFlights.length} cancelled flights and ${withoutMainFlight.length} flights without mainFlight field`
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}