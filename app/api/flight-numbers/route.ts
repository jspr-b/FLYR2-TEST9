import { NextResponse } from 'next/server'

export async function GET() {
  const SCHIPHOL_APP_KEY = process.env.SCHIPHOL_APP_KEY || 'bf01b2f53e73e9db0115b8f2093c97b9'
  const SCHIPHOL_APP_ID = process.env.SCHIPHOL_APP_ID || 'cfcad115'
  
  // Fetch one page to test
  const url = `https://api.schiphol.nl/public-flights/flights?flightDirection=D&airline=KL&scheduleDate=2025-09-18&page=21`
  
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'app_id': SCHIPHOL_APP_ID,
      'app_key': SCHIPHOL_APP_KEY,
      'ResourceVersion': 'v4'
    }
  })
  
  const data = await response.json()
  
  // Show the last page flights (high numbers)
  const flights = data.flights || []
  const flightNumbers = flights.map(f => ({
    number: f.flightNumber,
    name: f.flightName,
    destination: f.route?.destinations?.[0] || 'Unknown'
  })).sort((a, b) => a.number - b.number)
  
  return NextResponse.json({
    page: 21,
    count: flights.length,
    flightNumbers,
    highNumbers: flightNumbers.filter(f => f.number >= 9000)
  })
}