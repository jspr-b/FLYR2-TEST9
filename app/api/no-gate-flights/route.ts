import { NextResponse } from 'next/server'
import { fetchSchipholFlights, transformSchipholFlight, filterFlights, removeDuplicateFlights, removeStaleFlights } from '@/lib/schiphol-api'
import { getTodayAmsterdam, getCurrentAmsterdamTime } from '@/lib/amsterdam-time'

export async function GET() {
  try {
    const todayDate = getTodayAmsterdam()
    console.log(`🔍 Fetching flights without gate assignments for: ${todayDate}`)
    
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
    
    // Apply standard filtering
    let filteredFlights = filterFlights(allFlights, {
      flightDirection: 'D' as const,
      scheduleDate: todayDate,
      prefixicao: 'KL'
    })
    
    filteredFlights = removeDuplicateFlights(filteredFlights)
    filteredFlights = removeStaleFlights(filteredFlights, 72)
    
    // Find flights without gates
    const noGateFlights = filteredFlights.filter(flight => !flight.gate || flight.gate === 'TBD')
    
    // Sort by scheduled departure time
    noGateFlights.sort((a, b) => 
      new Date(a.scheduleDateTime).getTime() - new Date(b.scheduleDateTime).getTime()
    )
    
    // Group by time periods
    const currentTime = getCurrentAmsterdamTime()
    const groups = {
      urgent: [] as any[], // Next 2 hours
      today: [] as any[],  // Rest of today
      cancelled: [] as any[] // Cancelled flights
    }
    
    noGateFlights.forEach(flight => {
      const scheduleTime = new Date(flight.scheduleDateTime)
      const timeDiff = scheduleTime.getTime() - currentTime.getTime()
      const hoursUntilDeparture = timeDiff / (1000 * 60 * 60)
      
      const flightInfo = {
        flightNumber: flight.flightNumber,
        flightName: flight.flightName,
        destination: flight.route?.destinations?.[0] || 'Unknown',
        scheduleTime: flight.scheduleDateTime,
        scheduleTimeFormatted: scheduleTime.toLocaleString('nl-NL', { 
          timeZone: 'Europe/Amsterdam',
          hour: '2-digit',
          minute: '2-digit'
        }),
        hoursUntilDeparture: Math.round(hoursUntilDeparture * 10) / 10,
        aircraftType: flight.aircraftType?.iataMain || flight.aircraftType?.iataSub || 'Unknown',
        status: flight.publicFlightState?.flightStates || [],
        isCancelled: flight.publicFlightState?.flightStates?.includes('CNX') || false,
        gate: flight.gate || 'NO GATE'
      }
      
      if (flightInfo.isCancelled) {
        groups.cancelled.push(flightInfo)
      } else if (hoursUntilDeparture <= 2 && hoursUntilDeparture > 0) {
        groups.urgent.push(flightInfo)
      } else {
        groups.today.push(flightInfo)
      }
    })
    
    const summary = {
      total: noGateFlights.length,
      urgent: groups.urgent.length,
      today: groups.today.length,
      cancelled: groups.cancelled.length,
      timestamp: currentTime.toISOString(),
      amsterdamTime: currentTime.toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' })
    }
    
    return NextResponse.json({
      summary,
      flights: groups,
      totalProcessed: filteredFlights.length,
      withGates: filteredFlights.length - noGateFlights.length
    })
  } catch (error) {
    console.error('Error fetching no-gate flights:', error)
    return NextResponse.json(
      { error: 'Failed to fetch flights without gates' },
      { status: 500 }
    )
  }
}