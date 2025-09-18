import { NextResponse } from 'next/server'
import { getTodayAmsterdam } from '@/lib/amsterdam-time'

export async function GET() {
  try {
    const todayDate = getTodayAmsterdam()
    console.log(`🔍 Testing RAW flight count for date: ${todayDate}`)
    
    const SCHIPHOL_APP_KEY = process.env.SCHIPHOL_APP_KEY || 'bf01b2f53e73e9db0115b8f2093c97b9'
    const SCHIPHOL_APP_ID = process.env.SCHIPHOL_APP_ID || 'cfcad115'
    
    // Fetch directly from API with minimal processing
    const allFlights = []
    let page = 0
    let hasMore = true
    
    while (hasMore && page < 50) {
      const url = `https://api.schiphol.nl/public-flights/flights?flightDirection=D&airline=KL&scheduleDate=${todayDate}&page=${page}`
      console.log(`Fetching page ${page}...`)
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'app_id': SCHIPHOL_APP_ID,
          'app_key': SCHIPHOL_APP_KEY,
          'ResourceVersion': 'v4'
        }
      })
      
      if (!response.ok) {
        console.error(`Error on page ${page}: ${response.status}`)
        break
      }
      
      const text = await response.text()
      if (!text.trim()) {
        console.log(`Empty page ${page}, stopping`)
        hasMore = false
        break
      }
      
      const data = JSON.parse(text)
      const flights = data.flights || []
      
      console.log(`Page ${page}: ${flights.length} flights`)
      
      if (flights.length === 0) {
        hasMore = false
      } else {
        allFlights.push(...flights)
        page++
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    // Analyze the flights
    const analysis = {
      totalRawCount: allFlights.length,
      byFlightName: {
        KL: allFlights.filter(f => f.flightName?.startsWith('KL')).length,
        other: allFlights.filter(f => !f.flightName?.startsWith('KL')).length
      },
      byMainFlight: {
        withMainFlight: allFlights.filter(f => f.mainFlight).length,
        mainFlightKL: allFlights.filter(f => f.mainFlight?.startsWith('KL')).length,
        mainFlightOther: allFlights.filter(f => f.mainFlight && !f.mainFlight.startsWith('KL')).length
      },
      cancelled: allFlights.filter(f => f.publicFlightState?.flightStates?.includes('CNX')).length,
      groundTransport: allFlights.filter(f => f.flightNumber >= 9000 && f.flightNumber <= 9999).length,
      uniqueFlightNumbers: new Set(allFlights.map(f => f.flightNumber)).size,
      pagesRetrieved: page
    }
    
    // Check for specific flight number ranges that might be missing
    const flightNumberRanges = {
      '0-999': allFlights.filter(f => f.flightNumber < 1000).length,
      '1000-1999': allFlights.filter(f => f.flightNumber >= 1000 && f.flightNumber < 2000).length,
      '2000-2999': allFlights.filter(f => f.flightNumber >= 2000 && f.flightNumber < 3000).length,
      '3000-3999': allFlights.filter(f => f.flightNumber >= 3000 && f.flightNumber < 4000).length,
      '4000-4999': allFlights.filter(f => f.flightNumber >= 4000 && f.flightNumber < 5000).length,
      '5000-5999': allFlights.filter(f => f.flightNumber >= 5000 && f.flightNumber < 6000).length,
      '6000-6999': allFlights.filter(f => f.flightNumber >= 6000 && f.flightNumber < 7000).length,
      '7000-7999': allFlights.filter(f => f.flightNumber >= 7000 && f.flightNumber < 8000).length,
      '8000-8999': allFlights.filter(f => f.flightNumber >= 8000 && f.flightNumber < 9000).length,
      '9000-9999': allFlights.filter(f => f.flightNumber >= 9000 && f.flightNumber < 10000).length,
    }
    
    // Sample some non-KL mainFlights
    const nonKLMainFlights = allFlights
      .filter(f => f.mainFlight && !f.mainFlight.startsWith('KL'))
      .slice(0, 10)
      .map(f => ({
        flightName: f.flightName,
        mainFlight: f.mainFlight,
        flightNumber: f.flightNumber
      }))
    
    return NextResponse.json({
      analysis,
      flightNumberRanges,
      nonKLMainFlights,
      expectedVsActual: {
        expected: 408,
        actual: allFlights.length,
        difference: 408 - allFlights.length
      }
    })
  } catch (error) {
    console.error('Test error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}