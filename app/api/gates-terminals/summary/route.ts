import { NextRequest, NextResponse } from 'next/server'
import { getTodayLocalRange } from '@/lib/timezone-utils'
import { fetchSchipholFlights, transformSchipholFlight, filterFlights, removeDuplicateFlights } from '@/lib/schiphol-api'

// Known bus gates
const BUS_GATES = [
  'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8',
  'C21', 'C22', 'C23', 'C24',
  'D6', 'E21', 'G1'
]

export async function GET(request: NextRequest) {
  try {
    const today = new Date().toISOString().split('T')[0]

    const apiConfig = {
      flightDirection: 'D' as const,
      airline: 'KL',
      scheduleDate: today,
      fetchAllPages: true
    }

    const schipholData = await fetchSchipholFlights(apiConfig)
    const allFlights = (schipholData.flights || []).map(transformSchipholFlight)

    const filters = {
      flightDirection: 'D' as const,
      scheduleDate: today,
      isOperationalFlight: true,
      prefixicao: 'KL'
    }
    let filteredFlights = filterFlights(allFlights, filters)
    filteredFlights = removeDuplicateFlights(filteredFlights)

    console.log(`📊 GATES/TERMINALS: Processing ${filteredFlights.length} flights`)

    // Group flights by gate
    const gateMap = new Map<string, any[]>()
    const pierMap = new Map<string, any[]>()
    
    filteredFlights.forEach(flight => {
      const gate = flight.gate || 'Not Assigned Yet'
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

    // Calculate gate data with proper last activity
    const gateData = Array.from(gateMap.entries()).map(([gate, gateFlights]) => {
      const totalFlights = gateFlights.length
      const isBusGate = BUS_GATES.some(busGate => gate.startsWith(busGate))
      
      // Calculate last activity as the most recent flight departure time
      const sortedFlights = gateFlights.sort((a, b) => 
        new Date(b.scheduleDateTime).getTime() - new Date(a.scheduleDateTime).getTime()
      )
      const lastFlight = sortedFlights[0]
      const lastActivity = lastFlight ? lastFlight.scheduleDateTime : null
      
      // Get aircraft types from all flights at this gate
      const aircraftTypes = [...new Set(
        gateFlights
          .map(f => f.aircraftType?.iataSub || f.aircraftType?.iataMain)
          .filter(Boolean)
      )]
      
      // Calculate utilization (flights per hour over 16-hour operational day)
      const utilization = Math.min(100, (totalFlights / 16) * 100)
      
      return {
        gate,
        pier: gateFlights[0]?.pier || 'Unknown',
        flights: totalFlights,
        aircraftTypes,
        lastActivity,
        utilization: Math.round(utilization),
        isBusGate,
        status: totalFlights > 10 ? 'Busy' : totalFlights > 5 ? 'Moderate' : 'Available',
        nextFlight: lastFlight?.flightName || 'None'
      }
    }).sort((a, b) => b.flights - a.flights)

    // Calculate pier data
    const pierData = Array.from(pierMap.entries()).map(([pier, pierFlights]) => ({
      pier,
      flights: pierFlights.length,
      utilization: Math.min(100, (pierFlights.length / 20) * 100)
    })).sort((a, b) => b.flights - a.flights)

    // Calculate summary statistics
    const totalFlights = filteredFlights.length
    const busGateFlights = gateData
      .filter(g => g.isBusGate)
      .reduce((sum, g) => sum + g.flights, 0)

    console.log('\n🔍 Gate Distribution Analysis:')
    console.log('=' .repeat(50))
    
    // Log bus gate details
    console.log('\nBus Gate Distribution:')
    gateData
      .filter(g => g.isBusGate)
      .forEach(g => {
        console.log(`${g.gate}: ${g.flights} flights, last activity: ${g.lastActivity ? new Date(g.lastActivity).toLocaleTimeString() : 'none'}`)
      })
    
    console.log('\nSummary:')
    console.log(`Total Flights: ${totalFlights}`)
    console.log(`Bus Gate Flights: ${busGateFlights}`)
    console.log(`Bus Gate Percentage: ${((busGateFlights / totalFlights) * 100).toFixed(1)}%`)
    console.log('=' .repeat(50))

    return NextResponse.json({
      summary: {
        totalFlights,
        busGateFlights,
        busGatePercentage: (busGateFlights / totalFlights) * 100
      },
      pierData,
      gateData
    })
  } catch (error) {
    console.error('❌ GATES/TERMINALS ERROR:', error)
    return NextResponse.json(
      { error: 'Failed to fetch gates and terminals data' },
      { status: 500 }
    )
  }
} 