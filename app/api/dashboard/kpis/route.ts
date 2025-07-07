import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Flight from '@/models/Flight'
import HourlyDelay from '@/models/HourlyDelay'
import { getTodayLocalRange, calculateDelayMinutes, extractLocalHour } from '@/lib/timezone-utils'
import { fetchSchipholFlights, transformSchipholFlight, filterFlights, removeDuplicateFlights } from '@/lib/schiphol-api'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()

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

    // Get hourly delay data for today from DB (for delay stats)
    const { start: startOfDay, end: endOfDay } = getTodayLocalRange()
    const hourlyDelays = await HourlyDelay.find({
      date: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    }).sort({ hour: 1 })

    // Calculate KPIs from filtered flights and hourlyDelays
    return await calculateKPIsFromFlights(filteredFlights, hourlyDelays)
  } catch (error) {
    console.error('Error fetching dashboard KPIs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}

// Calculate KPIs from flights and hourly delay data
async function calculateKPIsFromFlights(flights: any[], hourlyDelays: any[]) {
  const totalFlights = flights.length
  const delays = flights.map(flight =>
    calculateDelayMinutes(flight.scheduleDateTime, flight.publicEstimatedOffBlockTime)
  )
  const delayedFlights = delays.filter(delay => delay > 0).length
  const totalDelayMinutes = delays.reduce((sum, delay) => sum + delay, 0)
  const averageDelay = totalFlights > 0 ? totalDelayMinutes / totalFlights : 0
  const flightsOver30Min = delays.filter(delay => delay > 30).length
  const flightsOver60Min = delays.filter(delay => delay > 60).length

  // Calculate peak delay hour from real flight data
  const hourGroups: Record<number, { flights: any[], delays: number[] }> = {}
  
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

  return NextResponse.json(kpis)
} 