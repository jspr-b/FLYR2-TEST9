import { NextRequest, NextResponse } from 'next/server'
import { getTodayLocalRange, calculateDelayMinutes, extractLocalHour } from '@/lib/timezone-utils'
import { fetchSchipholFlights, transformSchipholFlight, filterFlights, removeDuplicateFlights, removeStaleFlights } from '@/lib/schiphol-api'
import { getAmsterdamDateString } from '@/lib/amsterdam-time'

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const includeCancelled = searchParams.get('includeCancelled') === 'true'
    
    // Get today's date in Amsterdam timezone (YYYY-MM-DD)
    const today = getAmsterdamDateString()

    // Prepare Schiphol API configuration for KLM departures
    const apiConfig = {
      flightDirection: 'D' as const,
      airline: 'KL',
      scheduleDate: today,
      fetchAllPages: true,
      maxPagesToFetch: 25 // Match other endpoints to get all flights
    }

    // Fetch flights from Schiphol API (same as /api/flights)
    const schipholData = await fetchSchipholFlights(apiConfig)
    const allFlights = (schipholData.flights || []).map(transformSchipholFlight)

    // Apply the same filters and deduplication as /api/flights
    const filters = {
      flightDirection: 'D' as const,
      scheduleDate: today,
      isOperationalFlight: !includeCancelled, // Include cancelled if requested
      prefixicao: 'KL'
    }
    let filteredFlights = filterFlights(allFlights, filters)
    filteredFlights = removeDuplicateFlights(filteredFlights)
    filteredFlights = removeStaleFlights(filteredFlights, 24) // Remove flights older than 24 hours

    console.log(`📊 DASHBOARD KPIS: Processing ${filteredFlights.length} flights${includeCancelled ? ' (including cancelled)' : ''}`)

    // Calculate KPIs from filtered flights
    return await calculateKPIsFromFlights(filteredFlights)
  } catch (error) {
    console.error('❌ DASHBOARD KPIS ERROR:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}

// Calculate KPIs from flights data
async function calculateKPIsFromFlights(flights: any[]) {
  const totalFlights = flights.length
  const delays = flights.map(flight => {
    const actualTime = flight.actualOffBlockTime || flight.publicEstimatedOffBlockTime || flight.scheduleDateTime
    return calculateDelayMinutes(flight.scheduleDateTime, actualTime)
  }).filter(delay => delay !== null) as number[]
  
  const delayedFlights = delays.filter(delay => delay > 0).length
  const totalDelayMinutes = delays.reduce((sum, delay) => sum + delay, 0)
  const averageDelay = delays.length > 0 ? totalDelayMinutes / delays.length : 0
  const flightsOver30Min = delays.filter(delay => delay > 30).length
  const flightsOver60Min = delays.filter(delay => delay > 60).length

  // Calculate peak delay hour from real flight data
  const hourGroups: Record<number, { flights: any[], delays: number[] }> = {}
  
  flights.forEach(flight => {
    // Use extractLocalHour to properly convert UTC+2 API time to local timezone
    const scheduleHour = extractLocalHour(flight.scheduleDateTime)
    const actualTime = flight.actualOffBlockTime || flight.publicEstimatedOffBlockTime || flight.scheduleDateTime
    const delayMinutes = calculateDelayMinutes(flight.scheduleDateTime, actualTime)
    
    if (delayMinutes !== null) {
      if (!hourGroups[scheduleHour]) {
        hourGroups[scheduleHour] = { flights: [], delays: [] }
      }
      
      hourGroups[scheduleHour].flights.push(flight)
      hourGroups[scheduleHour].delays.push(delayMinutes)
    }
  })

  // Find peak delay hour
  let peakDelayHour = 'n/v'
  let peakDelayValue = 0
  
  if (Object.keys(hourGroups).length > 0) {
    const peakHour = Object.entries(hourGroups).reduce((max, [hour, data]) => {
      const avgDelay = data.delays.length > 0 ? data.delays.reduce((a, b) => a + b, 0) / data.delays.length : 0
      return avgDelay > max.avgDelay ? { hour: parseInt(hour), avgDelay } : max
    }, { hour: 0, avgDelay: 0 })
    
    peakDelayHour = `${peakHour.hour.toString().padStart(2, '0')}:00-${(peakHour.hour + 1).toString().padStart(2, '0')}:00`
    peakDelayValue = peakHour.avgDelay
  }

  // Count high variance hours (hours with average delay > 15 minutes)
  const highVarianceHours = Object.values(hourGroups).filter(data => {
    const avgDelay = data.delays.length > 0 ? data.delays.reduce((a, b) => a + b, 0) / data.delays.length : 0
    return avgDelay > 15
  }).length

  const kpis = {
    totalFlights: totalFlights || 'n/v',
    delayedFlights: delayedFlights || 'n/v',
    totalDelayMinutes: totalDelayMinutes || 'n/v',
    averageDelay: averageDelay ? `${averageDelay.toFixed(1)} min` : 'n/v',
    flightsOver30Min: flightsOver30Min || 'n/v',
    flightsOver60Min: flightsOver60Min || 'n/v',
    peakDelayHour: peakDelayHour,
    peakDelayValue: peakDelayValue ? `${peakDelayValue.toFixed(1)} min avg` : 'n/v',
    highVarianceHours: highVarianceHours || 'n/v',
    lastUpdated: new Date().toISOString(),
    dataSource: 'schiphol-api'
  }

  console.log(`✅ DASHBOARD KPIS: Successfully calculated KPIs`)
  return NextResponse.json(kpis)
} 