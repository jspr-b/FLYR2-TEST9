import { NextResponse } from 'next/server'
import { fetchSchipholFlights, transformSchipholFlight, filterFlights, removeDuplicateFlights, removeStaleFlights } from '@/lib/schiphol-api'
import { getTodayAmsterdam } from '@/lib/amsterdam-time'

export async function GET() {
  try {
    const todayDate = getTodayAmsterdam()
    
    const apiConfig = {
      flightDirection: 'D' as const,
      airline: 'KL',
      scheduleDate: todayDate,
      fetchAllPages: true,
      maxPagesToFetch: 50
    }
    
    const schipholData = await fetchSchipholFlights(apiConfig)
    const allFlights = (schipholData.flights || []).map(transformSchipholFlight)
    
    // First get all flights without KLM filter for comparison
    let allKLFlights = filterFlights(allFlights, {
      flightDirection: 'D' as const,
      scheduleDate: todayDate
    })
    allKLFlights = removeDuplicateFlights(allKLFlights)
    allKLFlights = removeStaleFlights(allKLFlights, 72)
    
    // Then apply our standard filtering WITH KLM filter
    let filteredFlights = filterFlights(allFlights, {
      flightDirection: 'D' as const,
      scheduleDate: todayDate,
      prefixicao: 'KL'
    })
    
    // Check counts before and after stale filter
    const beforeStale = filteredFlights.length
    filteredFlights = removeDuplicateFlights(filteredFlights)
    filteredFlights = removeStaleFlights(filteredFlights, 72)
    const afterStale = filteredFlights.length
    console.log(`Stale filter impact: ${beforeStale} → ${afterStale} (removed ${beforeStale - afterStale})`)
    
    // Sort by flight number
    filteredFlights.sort((a, b) => a.flightNumber - b.flightNumber)
    
    // Group by flight number ranges to identify patterns
    const flightRanges = {
      '0-999': [],
      '1000-1999': [],
      '2000-2999': [],
      '3000-3999': [],
      '4000-4999': [],
      '5000-5999': [],
      '6000-6999': [],
      '7000-7999': [],
      '8000-8999': [],
      '9000-9999': []
    }
    
    // Create detailed list
    const flightList = filteredFlights.map(flight => {
      const info = {
        flightNumber: flight.flightNumber,
        flightName: flight.flightName,
        destination: flight.route?.destinations?.[0] || 'Unknown',
        scheduleTime: new Date(flight.scheduleDateTime).toLocaleString('nl-NL', {
          timeZone: 'Europe/Amsterdam',
          hour: '2-digit',
          minute: '2-digit'
        }),
        gate: flight.gate || 'NO GATE',
        status: flight.publicFlightState?.flightStates || [],
        isCancelled: flight.publicFlightState?.flightStates?.includes('CNX') || false,
        aircraftType: flight.aircraftType?.iataMain || 'Unknown',
        mainFlight: flight.mainFlight || flight.flightName,
        lastUpdated: flight.lastUpdatedAt
      }
      
      // Categorize by range
      if (flight.flightNumber < 1000) flightRanges['0-999'].push(info)
      else if (flight.flightNumber < 2000) flightRanges['1000-1999'].push(info)
      else if (flight.flightNumber < 3000) flightRanges['2000-2999'].push(info)
      else if (flight.flightNumber < 4000) flightRanges['3000-3999'].push(info)
      else if (flight.flightNumber < 5000) flightRanges['4000-4999'].push(info)
      else if (flight.flightNumber < 6000) flightRanges['5000-5999'].push(info)
      else if (flight.flightNumber < 7000) flightRanges['6000-6999'].push(info)
      else if (flight.flightNumber < 8000) flightRanges['7000-7999'].push(info)
      else if (flight.flightNumber < 9000) flightRanges['8000-8999'].push(info)
      else flightRanges['9000-9999'].push(info)
      
      return info
    })
    
    // Find excluded flights
    const excludedFlights = allKLFlights.filter(flight => 
      !filteredFlights.find(f => f.flightNumber === flight.flightNumber)
    )
    
    // Create text summary
    let textSummary = `KLM FLIGHTS ANALYSIS - ${todayDate}\n`
    textSummary += `=====================================\n\n`
    textSummary += `Total KL flights from API: ${allKLFlights.length}\n`
    textSummary += `KLM-operated flights only: ${filteredFlights.length}\n`
    textSummary += `Excluded (codeshare/ground): ${excludedFlights.length}\n`
    textSummary += `Official Schiphol count: 409\n`
    textSummary += `Difference from official: ${filteredFlights.length - 409}\n\n`
    
    textSummary += `FLIGHTS BY NUMBER RANGE:\n`
    textSummary += `-----------------------\n`
    Object.entries(flightRanges).forEach(([range, flights]) => {
      if (flights.length > 0) {
        textSummary += `${range}: ${flights.length} flights\n`
      }
    })
    
    textSummary += `\nEXCLUDED FLIGHTS (CODESHARE/GROUND):\n`
    textSummary += `------------------------------------\n`
    
    // List all excluded flights
    excludedFlights.sort((a, b) => a.flightNumber - b.flightNumber)
    excludedFlights.forEach(flight => {
      textSummary += `${flight.flightName} → ${flight.route?.destinations?.[0] || 'Unknown'} (operated by ${flight.mainFlight || 'N/A'})\n`
    })
    
    textSummary += `\nBREAKDOWN OF EXCLUDED:\n`
    textSummary += `---------------------\n`
    
    // Count by operating carrier
    const operatingCarriers: Record<string, number> = {}
    excludedFlights.forEach(flight => {
      if (flight.mainFlight) {
        const carrier = flight.mainFlight.substring(0, 2)
        operatingCarriers[carrier] = (operatingCarriers[carrier] || 0) + 1
      }
    })
    
    Object.entries(operatingCarriers).forEach(([carrier, count]) => {
      textSummary += `${carrier}: ${count} flights\n`
    })
    
    // List ground transport (9000-9999 range)
    const groundTransport = flightRanges['9000-9999']
    if (groundTransport.length > 0) {
      textSummary += `\nGround Transport (${groundTransport.length} flights):\n`
      groundTransport.forEach(f => {
        textSummary += `  ${f.flightName} to ${f.destination} at ${f.scheduleTime}\n`
      })
    }
    
    // List cancelled flights
    const cancelledFlights = flightList.filter(f => f.isCancelled)
    textSummary += `\nCancelled Flights (${cancelledFlights.length} flights):\n`
    if (cancelledFlights.length > 0) {
      cancelledFlights.forEach(f => {
        textSummary += `  ${f.flightName} to ${f.destination}\n`
      })
    } else {
      textSummary += `  None\n`
    }
    
    textSummary += `\nCOMPLETE FLIGHT LIST:\n`
    textSummary += `--------------------\n`
    textSummary += `Flight   | Destination | Time  | Gate | Status\n`
    textSummary += `---------|-------------|-------|------|-------\n`
    
    flightList.forEach(f => {
      textSummary += `${f.flightName.padEnd(8)} | ${f.destination.substring(0, 11).padEnd(11)} | ${f.scheduleTime} | ${f.gate.substring(0, 4).padEnd(4)} | ${f.status.join(',').substring(0, 10)}\n`
    })
    
    return NextResponse.json({
      summary: {
        totalFromAPI: allKLFlights.length,
        klmOperatedOnly: filteredFlights.length,
        excludedCount: excludedFlights.length,
        officialCount: 409,
        difference: filteredFlights.length - 409,
        byRange: Object.entries(flightRanges).reduce((acc, [range, flights]) => {
          if (flights.length > 0) acc[range] = flights.length
          return acc
        }, {}),
        groundTransportCount: flightRanges['9000-9999'].length,
        cancelledCount: cancelledFlights.length,
        excludedByCarrier: operatingCarriers
      },
      textSummary,
      flightList,
      excludedFlights: excludedFlights.map(f => ({
        flightNumber: f.flightNumber,
        flightName: f.flightName,
        mainFlight: f.mainFlight,
        destination: f.route?.destinations?.[0] || 'Unknown'
      }))
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}