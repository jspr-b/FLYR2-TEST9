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
    
    let filteredFlights = filterFlights(allFlights, {
      flightDirection: 'D' as const,
      scheduleDate: todayDate,
      prefixicao: 'KL'
    })
    
    filteredFlights = removeDuplicateFlights(filteredFlights)
    filteredFlights = removeStaleFlights(filteredFlights, 72)
    
    // Analyze gate assignments
    const analysis = {
      total: filteredFlights.length,
      byGateStatus: {
        withGate: filteredFlights.filter(f => f.gate && f.gate !== '' && f.gate !== null).length,
        noGate: filteredFlights.filter(f => !f.gate || f.gate === '' || f.gate === null).length,
        tbdGate: filteredFlights.filter(f => f.gate === 'TBD').length
      },
      cancelled: filteredFlights.filter(f => f.publicFlightState?.flightStates?.includes('CNX')).length,
      gateValues: {
        nullGates: filteredFlights.filter(f => f.gate === null).length,
        undefinedGates: filteredFlights.filter(f => f.gate === undefined).length,
        emptyStringGates: filteredFlights.filter(f => f.gate === '').length,
        falseGates: filteredFlights.filter(f => !f.gate).length
      },
      sampleNoGates: filteredFlights
        .filter(f => !f.gate || f.gate === '' || f.gate === null)
        .slice(0, 10)
        .map(f => ({
          flightNumber: f.flightNumber,
          flightName: f.flightName,
          gate: f.gate,
          gateType: typeof f.gate,
          gateValue: String(f.gate),
          isCancelled: f.publicFlightState?.flightStates?.includes('CNX') || false,
          states: f.publicFlightState?.flightStates || []
        }))
    }
    
    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}