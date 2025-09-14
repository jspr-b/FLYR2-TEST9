import { NextRequest, NextResponse } from 'next/server'
import { fetchSchipholFlights, transformSchipholFlight, filterFlights, removeDuplicateFlights, removeStaleFlights } from '@/lib/schiphol-api'
import { getAmsterdamDateString } from '@/lib/amsterdam-time'

export async function GET(request: NextRequest) {
  try {
    // Get today's date in Amsterdam timezone (YYYY-MM-DD)
    const today = getAmsterdamDateString()
    console.log(`📊 DELAY TRENDS: Querying flights for date: ${today}`)

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
    
    console.log(`📊 DELAY TRENDS: Fetched ${allFlights.length} total flights for date ${today}`)

    // Apply the same filters and deduplication as /api/flights
    const filters = {
      flightDirection: 'D' as const,
      scheduleDate: today,
      isOperationalFlight: true,
      prefixicao: 'KL'
    }
    let filteredFlights = filterFlights(allFlights, filters)
    console.log(`📊 DELAY TRENDS: After filtering: ${filteredFlights.length} flights`)
    
    filteredFlights = removeDuplicateFlights(filteredFlights)
    console.log(`📊 DELAY TRENDS: After deduplication: ${filteredFlights.length} flights`)
    
    filteredFlights = removeStaleFlights(filteredFlights, 24) // Remove flights older than 24 hours
    console.log(`📊 DELAY TRENDS: After removing stale: ${filteredFlights.length} flights`)

    // Calculate hourly delays from real flight data
    const hourlyDelays = calculateHourlyDelaysFromFlights(filteredFlights)
    console.log(`📊 DELAY TRENDS: Calculated ${hourlyDelays.filter(h => h.totalFlights > 0).length} hours with flights`)

    // If no flights available, return structure with zeros instead of nulls
    if (filteredFlights.length === 0) {
      console.log('⚠️ DELAY TRENDS: No flights found after filtering')
      const emptyHourlyData = Array.from({ length: 24 }, (_, i) => ({
        hour: `${i.toString().padStart(2, '0')}:00`,
        avgDelay: 0,
        flights: 0,
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
      avgDelay: delay.totalFlights > 0 ? delay.averageDelay : 0,
      flights: delay.totalFlights,
      variance: delay.variance
    }))

    const tableData = hourlyDelays.map(delay => ({
      hour: `${delay.hour.toString().padStart(2, '0')}:00-${(delay.hour + 1).toString().padStart(2, '0')}:00`,
      avgDelay: delay.totalFlights > 0 ? delay.averageDelay : 0,
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
    // Extract hour in Amsterdam timezone
    const scheduleDate = new Date(flight.scheduleDateTime)
    // Format in Amsterdam timezone to get the correct hour
    const amsterdamHour = parseInt(
      scheduleDate.toLocaleString('en-US', { 
        hour: '2-digit', 
        hour12: false,
        timeZone: 'Europe/Amsterdam' 
      })
    )
    
    // Calculate delay in minutes (same as gate metrics service)
    let delayMinutes = 0
    const scheduledTime = new Date(flight.scheduleDateTime)
    // Use actual off-block time if available, otherwise estimated time
    const actualTime = flight.actualOffBlockTime || flight.publicEstimatedOffBlockTime
    if (actualTime) {
      const actualTimeDate = new Date(actualTime)
      const delayMs = actualTimeDate.getTime() - scheduledTime.getTime()
      delayMinutes = Math.round(delayMs / (1000 * 60))
    }
    
    if (!hourGroups[amsterdamHour]) {
      hourGroups[amsterdamHour] = { flights: [], delays: [] }
    }
    
    hourGroups[amsterdamHour].flights.push(flight)
    hourGroups[amsterdamHour].delays.push(Math.max(0, delayMinutes)) // Only positive delays
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