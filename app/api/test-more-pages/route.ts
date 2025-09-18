import { NextResponse } from 'next/server'

export async function GET() {
  const SCHIPHOL_APP_KEY = process.env.SCHIPHOL_APP_KEY || 'bf01b2f53e73e9db0115b8f2093c97b9'
  const SCHIPHOL_APP_ID = process.env.SCHIPHOL_APP_ID || 'cfcad115'
  
  // Test fetching page 25 and beyond
  const results = []
  
  for (let page = 22; page <= 30; page++) {
    const url = `https://api.schiphol.nl/public-flights/flights?flightDirection=D&airline=KL&scheduleDate=2025-09-18&page=${page}`
    
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'app_id': SCHIPHOL_APP_ID,
          'app_key': SCHIPHOL_APP_KEY,
          'ResourceVersion': 'v4'
        }
      })
      
      const data = await response.json()
      const flights = data.flights || []
      
      results.push({
        page,
        count: flights.length,
        sample: flights.slice(0, 3).map(f => ({
          name: f.flightName,
          number: f.flightNumber,
          mainFlight: f.mainFlight
        }))
      })
      
      // Stop if we get an empty page
      if (flights.length === 0) break
    } catch (error) {
      results.push({ page, error: String(error) })
    }
  }
  
  return NextResponse.json({ results })
}