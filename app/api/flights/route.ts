import { NextResponse } from 'next/server'
import { 
  fetchSchipholFlights, 
  transformSchipholFlight, 
  filterFlights, 
  removeDuplicateFlights,
  removeStaleFlights,
  getCacheStats,
  type SchipholApiConfig 
} from '@/lib/schiphol-api'
import { getAmsterdamDateString } from '@/lib/amsterdam-time'

export async function GET(request: Request) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const filtersParam = searchParams.get('filters')
    
    let filters = {}
    if (filtersParam) {
      try {
        filters = JSON.parse(filtersParam)
      } catch (e) {
        return NextResponse.json(
          { error: 'Invalid filters parameter' },
          { status: 400 }
        )
      }
    }

    // Prepare Schiphol API configuration
    const apiConfig: SchipholApiConfig = {
      flightDirection: (filters as any).flightDirection,
      airline: (filters as any).prefixicao,
      scheduleDate: (filters as any).scheduleDate,
      fetchAllPages: true // Fetch all pages to get complete data
    }

    // Fetch flights from Schiphol API
    const schipholData = await fetchSchipholFlights(apiConfig)

    // Transform Schiphol API data to our format
    const allFlights = (schipholData.flights || []).map(transformSchipholFlight)

    // Apply additional filters and remove duplicates
    console.log(`Before filtering: ${allFlights.length} flights`)
    console.log(`Filters applied:`, filters)
    
    let filteredFlights = filterFlights(allFlights, filters)
    console.log(`After filtering: ${filteredFlights.length} flights`)
    
    filteredFlights = removeDuplicateFlights(filteredFlights)
    filteredFlights = removeStaleFlights(filteredFlights, 24) // Remove flights older than 24 hours
    console.log(`After deduplication: ${filteredFlights.length} flights`)

    // Summary of data flow
    console.log(`📊 DATA FLOW SUMMARY:`)
    console.log(`  • API fetched: ${allFlights.length} flights`)
    console.log(`  • After filtering: ${filteredFlights.length} flights`)
    console.log(`  • Total removed: ${allFlights.length - filteredFlights.length} flights`)
    console.log(`  • Final result: ${filteredFlights.length} flights`)

    const responseData = {
      flights: filteredFlights,
      metadata: {
        totalCount: filteredFlights.length,
        lastUpdated: new Date().toISOString(),
        date: (filters as any).scheduleDate || getAmsterdamDateString(),
        cache: getCacheStats(),
        debug: {
          originalFlightCount: allFlights.length,
          filtersApplied: filters,
          dateFilter: (filters as any).scheduleDate
        }
      }
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('❌ FLIGHTS API ERROR:', error)
    return NextResponse.json(
      { error: 'Failed to fetch flights', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Handle cache clear request
    if (body.clearCache) {
      const { clearCache } = await import('@/lib/schiphol-api')
      const result = clearCache()
      return NextResponse.json(result)
    }
    
    // Return error for flight saving (no database in production)
    return NextResponse.json(
      { error: 'Flight saving not available in production mode' },
      { status: 400 }
    )
  } catch (error) {
    console.error('❌ FLIGHTS POST ERROR:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
} 