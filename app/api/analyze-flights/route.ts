import { NextResponse } from 'next/server'
import { fetchSchipholFlights, transformSchipholFlight, filterFlights, removeDuplicateFlights, removeStaleFlights } from '@/lib/schiphol-api'
import { getTodayAmsterdam } from '@/lib/amsterdam-time'

export async function GET() {
  try {
    const todayDate = getTodayAmsterdam()
    
    // Fetch all KL flights
    const rawData = await fetchSchipholFlights({
      flightDirection: 'D',
      airline: 'KL',
      scheduleDate: todayDate,
      fetchAllPages: true,
      maxPagesToFetch: 50
    })
    
    const flights = rawData.flights.map(transformSchipholFlight)
    
    // Analyze different categories
    const analysis = {
      totalFromAPI: flights.length,
      officialCount: 409,
      difference: flights.length - 409,
      
      byFlightNumber: {
        regular: flights.filter(f => f.flightNumber < 9000).length,
        highRange: flights.filter(f => f.flightNumber >= 9000).length,
        busService9960: flights.filter(f => f.flightNumber === 9960).length,
        other9000Range: flights.filter(f => f.flightNumber >= 9000 && f.flightNumber !== 9960).length
      },
      
      byStatus: {
        cancelled: flights.filter(f => f.publicFlightState?.flightStates?.includes('CNX')).length,
        operational: flights.filter(f => !f.publicFlightState?.flightStates?.includes('CNX')).length
      },
      
      byTime: {
        pastFlights: flights.filter(f => {
          const scheduleTime = new Date(f.scheduleDateTime)
          const now = new Date()
          return scheduleTime < now
        }).length,
        futureFlights: flights.filter(f => {
          const scheduleTime = new Date(f.scheduleDateTime)
          const now = new Date()
          return scheduleTime >= now
        }).length
      },
      
      possibleDuplicates: {
        // Check for flights with same flight number
        flightNumberCounts: {} as Record<string, number>,
        duplicateFlightNumbers: [] as any[]
      },
      
      // Sample high-range flights
      highRangeFlights: flights
        .filter(f => f.flightNumber >= 9000)
        .map(f => ({
          flightName: f.flightName,
          flightNumber: f.flightNumber,
          destination: f.route?.destinations?.[0],
          status: f.publicFlightState?.flightStates,
          scheduleTime: f.scheduleDateTime
        }))
    }
    
    // Count flight numbers
    flights.forEach(flight => {
      const num = flight.flightNumber.toString()
      analysis.possibleDuplicates.flightNumberCounts[num] = 
        (analysis.possibleDuplicates.flightNumberCounts[num] || 0) + 1
    })
    
    // Find duplicates
    Object.entries(analysis.possibleDuplicates.flightNumberCounts)
      .filter(([_, count]) => count > 1)
      .forEach(([flightNum, count]) => {
        const duplicates = flights.filter(f => f.flightNumber.toString() === flightNum)
        analysis.possibleDuplicates.duplicateFlightNumbers.push({
          flightNumber: flightNum,
          count: count,
          flights: duplicates.map(f => ({
            flightName: f.flightName,
            scheduleTime: f.scheduleDateTime,
            destination: f.route?.destinations?.[0],
            status: f.publicFlightState?.flightStates
          }))
        })
      })
    
    // Apply our standard filtering to see what gets removed
    const filtered = filterFlights(flights, {
      flightDirection: 'D' as const,
      scheduleDate: todayDate,
      prefixicao: 'KL'
    })
    
    const deduped = removeDuplicateFlights(filtered)
    const fresh = removeStaleFlights(deduped, 72)
    
    analysis.afterFiltering = {
      afterKLMFilter: filtered.length,
      afterDedup: deduped.length,
      afterStale: fresh.length,
      removedByKLMFilter: flights.length - filtered.length,
      removedByDedup: filtered.length - deduped.length,
      removedByStale: deduped.length - fresh.length
    }
    
    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}