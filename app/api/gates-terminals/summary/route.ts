import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import GateTerminal from '@/models/GateTerminal'
import { getTodayLocalRange } from '@/lib/timezone-utils'
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

    // Calculate gate and terminal statistics from real flight data
    const { gateData, pierData, summary } = calculateGateTerminalStats(filteredFlights)

    return NextResponse.json({
      summary,
      pierData,
      gateData
    })
  } catch (error) {
    console.error('Error fetching gates and terminals data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch gates and terminals data' },
      { status: 500 }
    )
  }
}

// Calculate gate and terminal statistics from flight data
function calculateGateTerminalStats(flights: any[]) {
  // Group flights by gate
  const gateMap = new Map<string, any[]>()
  const pierMap = new Map<string, any[]>()
  
  flights.forEach(flight => {
    const gate = flight.gate || 'Unknown'
    const pier = flight.pier || 'Unknown'
    
    if (!gateMap.has(gate)) {
      gateMap.set(gate, [])
    }
    gateMap.get(gate)!.push(flight)
    
    if (!pierMap.has(pier)) {
      pierMap.set(pier, [])
    }
    pierMap.get(pier)!.push(flight)
  })

  // Calculate gate data
  const gateData = Array.from(gateMap.entries()).map(([gate, gateFlights]) => {
    const totalFlights = gateFlights.length
    const departures = gateFlights.length // All flights are departures in this case
    const arrivals = 0 // No arrivals for departure-only data
    
    // Calculate average turnaround (simplified - would need more complex logic for real data)
    const avgTurnaround = 45 // Default 45 minutes
    
    // Determine status based on flight count
    let status = 'Available'
    if (totalFlights > 10) status = 'Busy'
    else if (totalFlights > 5) status = 'Moderate'
    
    // Get next flight (first flight in the hour)
    const nextFlight = gateFlights
      .sort((a, b) => new Date(a.scheduleDateTime).getTime() - new Date(b.scheduleDateTime).getTime())[0]
    
    return {
      gate,
      pier: gateFlights[0]?.pier || 'Unknown',
      flights: totalFlights,
      arrivals,
      departures,
      avgTurnaround,
      status,
      nextFlight: nextFlight ? `${nextFlight.flightName} (${new Date(nextFlight.scheduleDateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })})` : 'None',
      type: 'Schengen' as const,
      purpose: 'Mixed operations'
    }
  }).sort((a, b) => b.flights - a.flights) // Sort by flight count in descending order (busiest first)

  // Calculate pier data
  const pierData = Array.from(pierMap.entries()).map(([pier, pierFlights]) => {
    const totalFlights = pierFlights.length
    const departures = pierFlights.length
    const arrivals = 0
    
    // Calculate utilization (simplified - would need gate capacity data for real calculation)
    const utilization = Math.min(100, (totalFlights / 20) * 100) // Assume 20 flights = 100% utilization
    
    let status = 'Low'
    if (utilization > 80) status = 'High'
    else if (utilization > 60) status = 'Medium'
    
    return {
      pier,
      flights: totalFlights,
      arrivals,
      departures,
      utilization,
      status,
      type: 'Schengen' as const,
      purpose: 'Mixed operations'
    }
  }).sort((a, b) => b.flights - a.flights) // Sort by flight count in descending order (busiest first)

  // Calculate summary statistics
  const totalGates = gateMap.size
  const totalTerminals = new Set(pierMap.keys()).size
  const totalFlights = flights.length
  const avgUtilization = pierData.length > 0 
    ? pierData.reduce((sum, pier) => sum + pier.utilization, 0) / pierData.length 
    : 0

  const summary = {
    totalGates: totalGates || '0',
    totalTerminals: totalTerminals || '0',
    totalFlights: totalFlights || '0',
    avgUtilization: avgUtilization ? `${avgUtilization.toFixed(1)}%` : '0.0%'
  }

  return { gateData, pierData, summary }
} 