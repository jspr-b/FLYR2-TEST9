import { NextRequest, NextResponse } from 'next/server'
import { getTodayLocalRange, calculateDelayMinutes, extractLocalHour } from '@/lib/timezone-utils'
import { fetchSchipholFlights, transformSchipholFlight, filterFlights, removeDuplicateFlights } from '@/lib/schiphol-api'

export async function GET(request: NextRequest) {
  try {
    // Get today's date in YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0]

    // Prepare Schiphol API configuration for KLM departures
    const apiConfig = {
      flightDirection: 'D' as const,
      airline: 'KL',
      scheduleDate: today,
      fetchAllPages: true
    }

    // Fetch flights from Schiphol API (same as /api/flights)
    const schipholData = await fetchSchipholFlights(apiConfig)
    const allFlights = (schipholData.flights || []).map(transformSchipholFlight)

    // Apply the same filters and deduplication as /api/flights
    const filters = {
      flightDirection: 'D' as const,
      scheduleDate: today,
      isOperationalFlight: true,
      prefixicao: 'KL'
    }
    let filteredFlights = filterFlights(allFlights, filters)
    filteredFlights = removeDuplicateFlights(filteredFlights)

    console.log(`📊 DELAY TRENDS: Processing ${filteredFlights.length} flights`)

    // Calculate hourly delays from real flight data
    const hourlyDelays = calculateHourlyDelaysFromFlights(filteredFlights)

    // If no flights available, return empty structure
    if (filteredFlights.length === 0) {
      const emptyHourlyData = Array.from({ length: 24 }, (_, i) => ({
        hour: `${i.toString().padStart(2, '0')}:00`,
        avgDelay: null,
        flights: null,
        variance: 'Low' as const
      }))

      return NextResponse.json({
        summary: {
          totalFlights: '0',
          avgDelay: '0.0 min',
          peakDelayHour: 'n/v',
          highVarianceHours: '0'
        },
        hourlyData: emptyHourlyData,
        tableData: emptyHourlyData.map((data, index) => ({
          hour: `${data.hour}-${(index + 1).toString().padStart(2, '0')}:00`,
          avgDelay: null,
          flights: null,
          variance: data.variance,
          flagged: false
        }))
      })
    }

    // Transform data for the frontend
    const hourlyData = hourlyDelays.map(delay => ({
      hour: `${delay.hour.toString().padStart(2, '0')}:00`,
      avgDelay: delay.averageDelay,
      flights: delay.totalFlights,
      variance: delay.variance
    }))

    const tableData = hourlyDelays.map(delay => ({
      hour: `${delay.hour.toString().padStart(2, '0')}:00-${(delay.hour + 1).toString().padStart(2, '0')}:00`,
      avgDelay: delay.averageDelay,
      flights: delay.totalFlights,
      variance: delay.variance,
      flagged: delay.variance === 'High'
    }))

    // Calculate summary statistics
    const totalFlights = hourlyDelays.reduce((sum, h) => sum + h.totalFlights, 0)
    const totalDelayMinutes = hourlyDelays.reduce((sum, h) => sum + h.totalDelayMinutes, 0)
    const averageDelay = totalFlights > 0 ? totalDelayMinutes / totalFlights : 0
    
    const peakHour = hourlyDelays.reduce((max, current) => 
      current.averageDelay > max.averageDelay ? current : max
    )
    const peakDelayHour = `${peakHour.hour.toString().padStart(2, '0')}:00-${(peakHour.hour + 1).toString().padStart(2, '0')}:00`
    
    const highVarianceHours = hourlyDelays.filter(h => h.variance === 'High').length

    const summary = {
      totalFlights: totalFlights || '0',
      avgDelay: averageDelay ? `${averageDelay.toFixed(1)} min` : '0.0 min',
      peakDelayHour: peakDelayHour,
      highVarianceHours: highVarianceHours || '0'
    }

    console.log(`✅ DELAY TRENDS: Successfully processed data`)
    return NextResponse.json({
      summary,
      hourlyData,
      tableData
    })
  } catch (error) {
    console.error('❌ DELAY TRENDS ERROR:', error)
    return NextResponse.json(
      { error: 'Failed to fetch delay trends data' },
      { status: 500 }
    )
  }
}

// Calculate hourly delays from flight data
function calculateHourlyDelaysFromFlights(flights: any[]) {
  const hourGroups: Record<number, { flights: any[], delays: number[] }> = {}

  // Group flights by hour and calculate delays
  flights.forEach(flight => {
    // Use extractLocalHour to properly convert UTC+2 API time to local timezone
    const scheduleHour = extractLocalHour(flight.scheduleDateTime)
    const delayMinutes = calculateDelayMinutes(flight.scheduleDateTime, flight.publicEstimatedOffBlockTime)
    
    if (!hourGroups[scheduleHour]) {
      hourGroups[scheduleHour] = { flights: [], delays: [] }
    }
    
    hourGroups[scheduleHour].flights.push(flight)
    hourGroups[scheduleHour].delays.push(delayMinutes)
  })

  // Convert to hourly delay format
  const hourlyDelays = Object.entries(hourGroups).map(([hour, data]) => {
    const hourNum = parseInt(hour)
    const totalFlights = data.flights.length
    const totalDelayMinutes = data.delays.reduce((sum, delay) => sum + delay, 0)
    const averageDelay = totalFlights > 0 ? totalDelayMinutes / totalFlights : 0
    
    // Determine variance based on average delay
    let variance: 'Low' | 'Medium' | 'High' = 'Low'
    if (averageDelay > 15) variance = 'High'
    else if (averageDelay > 5) variance = 'Medium'

    return {
      hour: hourNum,
      totalFlights,
      totalDelayMinutes,
      averageDelay,
      variance
    }
  })

  // Sort by hour and fill missing hours with zero data
  const sortedDelays = hourlyDelays.sort((a, b) => a.hour - b.hour)
  
  // Fill missing hours with zero data
  const completeDelays = []
  for (let hour = 0; hour < 24; hour++) {
    const existingDelay = sortedDelays.find(d => d.hour === hour)
    if (existingDelay) {
      completeDelays.push(existingDelay)
    } else {
      completeDelays.push({
        hour,
        totalFlights: 0,
        totalDelayMinutes: 0,
        averageDelay: 0,
        variance: 'Low' as const
      })
    }
  }

  return completeDelays
} 