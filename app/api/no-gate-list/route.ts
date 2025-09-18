import { NextResponse } from 'next/server'
import { fetchSchipholFlights, transformSchipholFlight, filterFlights, removeDuplicateFlights, removeStaleFlights } from '@/lib/schiphol-api'
import { getTodayAmsterdam } from '@/lib/amsterdam-time'

export async function GET() {
  try {
    const todayDate = getTodayAmsterdam()
    
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
    
    // Create a simple list
    const noGateFlights = filteredFlights.filter(flight => 
      !flight.gate || flight.gate === '' || flight.gate === 'TBD' || flight.gate === null
    )
    
    // Sort by flight number
    noGateFlights.sort((a, b) => a.flightNumber - b.flightNumber)
    
    // Create simple text output
    let output = `FLIGHTS WITHOUT GATE ASSIGNMENTS - ${todayDate}\n`
    output += `========================================\n\n`
    output += `Total flights: ${filteredFlights.length}\n`
    output += `Flights without gates: ${noGateFlights.length}\n\n`
    
    if (noGateFlights.length === 0) {
      output += `All flights have gate assignments!\n`
    } else {
      output += `Flight Number | Flight Name | Destination | Scheduled Time | Status\n`
      output += `----------------------------------------------------------------\n`
      
      noGateFlights.forEach(flight => {
        const scheduleTime = new Date(flight.scheduleDateTime).toLocaleString('nl-NL', {
          timeZone: 'Europe/Amsterdam',
          hour: '2-digit',
          minute: '2-digit'
        })
        const destination = flight.route?.destinations?.[0] || 'Unknown'
        const status = flight.publicFlightState?.flightStates?.join(', ') || 'N/A'
        
        output += `KL${String(flight.flightNumber).padEnd(10)} | ${flight.flightName.padEnd(11)} | ${destination.padEnd(11)} | ${scheduleTime.padEnd(14)} | ${status}\n`
      })
    }
    
    // Also return JSON for debugging
    return NextResponse.json({
      text: output,
      data: {
        total: filteredFlights.length,
        withoutGates: noGateFlights.length,
        flights: noGateFlights.map(f => ({
          flightNumber: f.flightNumber,
          flightName: f.flightName,
          gate: f.gate,
          destination: f.route?.destinations?.[0] || 'Unknown',
          scheduleTime: f.scheduleDateTime,
          status: f.publicFlightState?.flightStates || []
        }))
      }
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}