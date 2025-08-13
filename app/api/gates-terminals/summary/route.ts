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
    // Fetch data from the gate occupancy API instead of duplicating logic
    const response = await fetch('http://localhost:3000/api/gate-occupancy')
    if (!response.ok) throw new Error('Failed to fetch gate occupancy data')
    
    const data = await response.json()
    
    // Calculate bus gate statistics from the new API structure
    const gateData = data.gates?.map((gate: any) => ({
      gate: gate.gateID,
      pier: gate.pier,
      flights: gate.utilization.logical,
      aircraftTypes: gate.scheduledFlights?.map((f: any) => f.aircraftType).filter(Boolean) || [],
      lastActivity: gate.scheduledFlights?.length > 0 ? 
        gate.scheduledFlights[gate.scheduledFlights.length - 1].scheduleDateTime : null,
      utilization: gate.utilization.current,
      isBusGate: BUS_GATES.includes(gate.gateID),
      status: gate.utilization.temporalStatus === 'DEAD_ZONE' ? 'Available' : 
              gate.utilization.temporalStatus === 'ACTIVE' ? 'Busy' : 'Moderate',
      nextFlight: gate.scheduledFlights?.length > 0 ? gate.scheduledFlights[0].flightName : 'None'
    })).sort((a: any, b: any) => b.flights - a.flights) || []

    // Calculate pier statistics
    const pierMap = new Map<string, any>()
    gateData.forEach((gate: any) => {
      if (!pierMap.has(gate.pier)) {
        pierMap.set(gate.pier, { pier: gate.pier, flights: 0, utilization: 0 })
      }
      const pierData = pierMap.get(gate.pier)!
      pierData.flights += gate.flights
      pierData.utilization = Math.min(100, (pierData.flights / 20) * 100)
    })

    const pierData = Array.from(pierMap.values()).sort((a, b) => b.flights - a.flights)

    // Calculate summary statistics
    const totalFlights = data.gates?.reduce((sum: number, gate: any) => 
      sum + (gate.utilization.logical || 0), 0) || 0
    
    const busGateFlights = gateData
      .filter((g: any) => g.isBusGate)
      .reduce((sum: number, g: any) => sum + g.flights, 0)

    console.log('\n🔍 Gate Distribution Analysis:')
    console.log('=' .repeat(50))
    console.log('\nBus Gate Distribution:')
    gateData
      .filter((g: any) => g.isBusGate)
      .forEach((g: any) => {
        console.log(`${g.gate}: ${g.flights} flights, last activity: ${g.lastActivity ? new Date(g.lastActivity).toLocaleTimeString() : 'none'}`)
      })
    
    console.log('\nSummary:')
    console.log(`Total Flights: ${totalFlights}`)
    console.log(`Bus Gate Flights: ${busGateFlights}`)
    console.log(`Bus Gate Percentage: ${totalFlights > 0 ? ((busGateFlights / totalFlights) * 100).toFixed(1) : 0}%`)
    console.log('=' .repeat(50))

    return NextResponse.json({
      summary: {
        totalGates: data.summary.totalGates || 0,
        totalPiers: data.summary.totalPiers || 0,
        activePiers: data.summary.activePiers || 0,
        activePiersList: data.summary.activePiersList || [],
        activeGates: data.summary.statusBreakdown?.OCCUPIED || 0,
        totalFlights,
        busGateFlights,
        busGatePercentage: totalFlights > 0 ? (busGateFlights / totalFlights) * 100 : 0
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