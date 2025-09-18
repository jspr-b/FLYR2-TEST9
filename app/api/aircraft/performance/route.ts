import { NextRequest, NextResponse } from 'next/server'
import { fetchSchipholFlights, transformSchipholFlight, filterFlights, removeDuplicateFlights, removeStaleFlights } from '@/lib/schiphol-api'
import { calculateDelayMinutes } from '@/lib/timezone-utils'
import { getAmsterdamDateString } from '@/lib/amsterdam-time'

export async function GET(request: NextRequest) {
  try {
    // Get today's date in Amsterdam timezone (YYYY-MM-DD)
    const today = getAmsterdamDateString()
    
    // Prepare Schiphol API configuration for KLM flights
    const apiConfig = {
      flightDirection: 'D' as const,
      airline: 'KL',
      scheduleDate: today,
      fetchAllPages: true,
      maxPagesToFetch: 50
    }

    // Fetch flights from Schiphol API
    const schipholData = await fetchSchipholFlights(apiConfig)
    
    // Transform and filter flights
    const allFlights = (schipholData.flights || []).map(transformSchipholFlight)
    
    // Apply filters for KLM-operated flights only
    const filters = {
      flightDirection: 'D' as const,
      scheduleDate: today,
      isOperationalFlight: false, // Include cancelled flights for complete data
      prefixicao: 'KL'
    }
    
    let filteredFlights = filterFlights(allFlights, filters)
    filteredFlights = removeDuplicateFlights(filteredFlights)
    filteredFlights = removeStaleFlights(filteredFlights, 72) // Remove flights older than 72 hours

    // If no flights, return empty structure
    if (filteredFlights.length === 0) {
      return NextResponse.json({
        summary: {
          aircraftTypes: 'n/v',
          bestPerformer: 'n/v',
          highestDelay: 'n/v',
          fleetAvgDelay: 'n/v'
        },
        chartData: [],
        tableData: []
      })
    }

    // Calculate aircraft performance from flight data
    const aircraftCounts = filteredFlights.reduce((acc, flight) => {
      // Use iataSub for specific aircraft variant identification (e.g., 332 vs 333)
      const type = flight.aircraftType.iataSub || flight.aircraftType.iataMain
      const safeType = typeof type === 'string' && type.trim() !== '' ? type : 'Unknown'
      acc[safeType] = (acc[safeType] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Debug: Log all found aircraft types
    console.log('All aircraft types found:', Object.keys(aircraftCounts))
    console.log('Total aircraft types before filtering:', Object.keys(aircraftCounts).length)

    // Calculate performance metrics for each aircraft type
    const aircraftPerformance = Object.entries(aircraftCounts).map(([type, count]) => {
      const typeFlights = filteredFlights.filter(f => {
        const flightType = f.aircraftType.iataSub || f.aircraftType.iataMain
        const safeFlightType = typeof flightType === 'string' && flightType.trim() !== '' ? flightType : 'Unknown'
        return safeFlightType === type
      })
      
      // Calculate delays and filter out invalid data
      const typeDelays = typeFlights.map(flight => {
        // Use actual off-block time if available, otherwise estimated time
        const actualTime = flight.actualOffBlockTime || flight.publicEstimatedOffBlockTime || flight.scheduleDateTime
        const delay = calculateDelayMinutes(flight.scheduleDateTime, actualTime)
        return delay
      }).filter(delay => !isNaN(delay) && delay >= 0) // Filter out invalid delays
      
      const avgDelay = typeDelays.length > 0 ? typeDelays.reduce((a, b) => a + b, 0) / typeDelays.length : 0
      
      // Calculate enhanced delay statistics
      const minDelay = typeDelays.length > 0 ? Math.min(...typeDelays) : 0
      const maxDelay = typeDelays.length > 0 ? Math.max(...typeDelays) : 0
      const onTimeFlights = typeDelays.filter(delay => delay === 0).length
      const onTimePercentage = typeDelays.length > 0 ? (onTimeFlights / typeDelays.length) * 100 : 0
      const delayedFlights = typeDelays.length - onTimeFlights
      
      // Calculate delay distribution
      const delayDistribution = {
        onTime: onTimeFlights,
        slight: typeDelays.filter(delay => delay > 0 && delay <= 15).length,
        moderate: typeDelays.filter(delay => delay > 15 && delay <= 30).length,
        significant: typeDelays.filter(delay => delay > 30).length
      }
      
      // Get gate and pier information
      const gates = [...new Set(typeFlights.map(f => f.gate).filter(gate => gate && gate.trim() !== ''))]
      const piers = [...new Set(typeFlights.map(f => f.pier).filter(pier => pier && pier.trim() !== ''))]
      
      // Get flight states
      const flightStates = [...new Set(typeFlights.map(f => f.publicFlightState?.flightStates?.[0] || 'Unknown'))]
      
      // Get last updated timestamp
      const lastUpdated = typeFlights.length > 0 ? 
        new Date(Math.max(...typeFlights.map(f => new Date(f.lastUpdatedAt).getTime()))).toISOString() : 
        new Date().toISOString()
      
      // Debug logging for aircraft performance with more detail
      console.log(`Aircraft type ${type}: ${count} flights, ${typeDelays.length} valid delays, avg delay: ${avgDelay.toFixed(1)} min, on-time: ${onTimePercentage.toFixed(1)}%`)
      if (typeDelays.length > 0) {
        console.log(`  Delay range: ${minDelay.toFixed(1)} - ${maxDelay.toFixed(1)} min`)
      }
      
      // Get unique routes for this aircraft type
      const routes = [...new Set(typeFlights.map(f => f.route.destinations.join(', ')))].slice(0, 3).join('; ')
      
      // Determine aircraft properties
      const manufacturer = getAircraftManufacturer(type)
      const capacity = getAircraftCapacity(type)
      const performance = getPerformanceRating(avgDelay)
      
      return {
        type,
        manufacturer,
        avgDelay,
        flights: count,
        departures: count,
        capacity,
        routes,
        performance,
        // Enhanced metrics
        minDelay,
        maxDelay,
        onTimePercentage,
        onTimeFlights,
        delayedFlights,
        delayDistribution,
        gates: gates.slice(0, 5), // Limit to top 5 gates
        piers: piers.slice(0, 5), // Limit to top 5 piers
        flightStates,
        lastUpdated
      }
    })

    // Debug: Log aircraft types before and after filtering
    console.log('Aircraft types before delay filter:', aircraftPerformance.map(ac => `${ac.type} (avg delay: ${ac.avgDelay.toFixed(1)} min)`))
    
    // Filter out aircraft types with no delays (optional - comment out to include all types)
    // const filteredAircraftPerformance = aircraftPerformance.filter(ac => ac.avgDelay > 0)
    const filteredAircraftPerformance = aircraftPerformance // Include all aircraft types for now
    
    console.log('Aircraft types after delay filter:', filteredAircraftPerformance.map(ac => `${ac.type} (avg delay: ${ac.avgDelay.toFixed(1)} min)`))
    console.log('Total aircraft types after filtering:', filteredAircraftPerformance.length)

    // Calculate summary statistics
    const aircraftTypes = filteredAircraftPerformance.length
    const bestPerformer = filteredAircraftPerformance.length > 0 ? filteredAircraftPerformance.reduce((best, current) => 
      current.avgDelay < best.avgDelay ? current : best
    ) : null
    const highestDelay = filteredAircraftPerformance.length > 0 ? filteredAircraftPerformance.reduce((worst, current) => 
      current.avgDelay > worst.avgDelay ? current : worst
    ) : null
    
    // Debug logging for summary
    console.log(`Best performer: ${bestPerformer?.type} (${bestPerformer?.avgDelay.toFixed(1)} min)`)
    console.log(`Highest delay: ${highestDelay?.type} (${highestDelay?.avgDelay.toFixed(1)} min)`)
    
    // Calculate fleet average delay
    const allDelays = filteredFlights.map(flight => {
      const actualTime = flight.actualOffBlockTime || flight.publicEstimatedOffBlockTime || flight.scheduleDateTime
      return calculateDelayMinutes(flight.scheduleDateTime, actualTime)
    })
    const fleetAvgDelay = allDelays.length > 0 ? allDelays.reduce((a, b) => a + b, 0) / allDelays.length : 0

    const summary = {
      aircraftTypes: aircraftTypes || 'n/v',
      bestPerformer: bestPerformer ? bestPerformer.type : 'n/v',
      bestPerformerDelay: bestPerformer ? `${bestPerformer.avgDelay.toFixed(1)} min avg delay` : 'n/v',
      highestDelay: highestDelay ? highestDelay.type : 'n/v',
      highestDelayValue: highestDelay ? `${highestDelay.avgDelay.toFixed(1)} min avg delay` : 'n/v',
      fleetAvgDelay: fleetAvgDelay ? `${fleetAvgDelay.toFixed(1)} min` : 'n/v'
    }

    // Transform data for charts and table
    const chartData = filteredAircraftPerformance.map(ac => ({
      type: ac.type,
      avgDelay: ac.avgDelay,
      flights: ac.flights,
      departures: ac.departures,
      manufacturer: ac.manufacturer,
      capacity: ac.capacity,
      routes: ac.routes,
      // Enhanced metrics for charts
      minDelay: ac.minDelay,
      maxDelay: ac.maxDelay,
      onTimePercentage: ac.onTimePercentage,
      onTimeFlights: ac.onTimeFlights,
      delayedFlights: ac.delayedFlights,
      delayDistribution: ac.delayDistribution,
      gates: ac.gates,
      piers: ac.piers,
      flightStates: ac.flightStates,
      lastUpdated: ac.lastUpdated
    }))

    const tableData = filteredAircraftPerformance.map(ac => ({
      type: ac.type,
      manufacturer: ac.manufacturer,
      avgDelay: ac.avgDelay,
      flights: ac.flights,
      departures: ac.departures,
      capacity: ac.capacity,
      routes: ac.routes,
      performance: ac.performance,
      // Enhanced metrics for table
      minDelay: ac.minDelay,
      maxDelay: ac.maxDelay,
      onTimePercentage: ac.onTimePercentage,
      onTimeFlights: ac.onTimeFlights,
      delayedFlights: ac.delayedFlights,
      delayDistribution: ac.delayDistribution,
      gates: ac.gates,
      piers: ac.piers,
      flightStates: ac.flightStates,
      lastUpdated: ac.lastUpdated
    }))

    return NextResponse.json({
      summary,
      chartData,
      tableData
    })
  } catch (error) {
    console.error('Error fetching aircraft performance data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch aircraft performance data' },
      { status: 500 }
    )
  }
}

function getAircraftManufacturer(type: string): string {
  if (type === 'Unknown') return "Unknown"
  
  // KLM-specific aircraft manufacturer mapping
  const manufacturerMap: Record<string, string> = {
    // Airbus Aircraft
    '332': 'Airbus', // A330-200
    '333': 'Airbus', // A330-300
    '32N': 'Airbus', // A320neo
    '32Q': 'Airbus', // A321neo
    'A332': 'Airbus', // A330-200 (alternative)
    'A333': 'Airbus', // A330-300 (alternative)
    'A32N': 'Airbus', // A320neo (alternative)
    'A32Q': 'Airbus', // A321neo (alternative)
    
    // Boeing Aircraft
    '772': 'Boeing', // 777-200ER
    '773': 'Boeing', // 777-300ER
    '77W': 'Boeing', // 777-300ER (alternative code)
    '789': 'Boeing', // 787-9
    '78W': 'Boeing', // 787-10
    '781': 'Boeing', // 787-10 (alternative code)
    '73H': 'Boeing', // 737-700
    '738': 'Boeing', // 737-800
    '73W': 'Boeing', // 737-900
    '73J': 'Boeing', // 737-900 (alternative code)
    '295': 'Boeing', // 737-900 (alternative code)
    'B772': 'Boeing', // 777-200ER (alternative)
    'B773': 'Boeing', // 777-300ER (alternative)
    'B789': 'Boeing', // 787-9 (alternative)
    'B738': 'Boeing', // 737-800 (alternative)
    
    // Embraer Aircraft (KLM Cityhopper)
    'E70': 'Embraer', // E170
    'E75': 'Embraer', // E175
    'E90': 'Embraer', // E190
    'E7W': 'Embraer', // E195-E2
    'E195': 'Embraer', // E195 (alternative)
    'E170': 'Embraer', // E170 (alternative)
    'E175': 'Embraer', // E175 (alternative)
    'E190': 'Embraer', // E190 (alternative)
  }
  
  return manufacturerMap[type] || "Unknown"
}

function getAircraftCapacity(type: string): number | null {
  // KLM-specific aircraft capacity data
  const capacityMap: Record<string, number> = {
    // Airbus Aircraft
    '332': 268, // Airbus A330-200
    '333': 292, // Airbus A330-300
    '32N': 180, // Airbus A320neo
    '32Q': 232, // Airbus A321neo
    'A332': 268, // Airbus A330-200 (alternative)
    'A333': 292, // Airbus A330-300 (alternative)
    'A32N': 180, // Airbus A320neo (alternative)
    'A32Q': 232, // Airbus A321neo (alternative)
    
    // Boeing Aircraft
    '772': 314, // Boeing 777-200ER
    '773': 408, // Boeing 777-300ER
    '77W': 408, // Boeing 777-300ER (alternative code)
    '789': 290, // Boeing 787-9
    '78W': 335, // Boeing 787-10
    '781': 335, // Boeing 787-10 (alternative code)
    '73H': 126, // Boeing 737-700
    '738': 162, // Boeing 737-800 (2-class)
    '73W': 178, // Boeing 737-900
    '73J': 178, // Boeing 737-900 (alternative code)
    '295': 178, // Boeing 737-900 (alternative code)
    'B772': 314, // Boeing 777-200ER (alternative)
    'B773': 408, // Boeing 777-300ER (alternative)
    'B789': 290, // Boeing 787-9 (alternative)
    'B738': 162, // Boeing 737-800 (alternative)
    
    // Embraer Aircraft (KLM Cityhopper)
    'E70': 76,  // Embraer 170
    'E75': 82,  // Embraer 175 (average of 76-88)
    'E90': 96,  // Embraer 190 (dual-class)
    'E7W': 120, // Embraer 195-E2
    'E195': 120, // Embraer 195 (alternative)
    'E170': 76,  // Embraer 170 (alternative)
    'E175': 82,  // Embraer 175 (alternative)
    'E190': 96,  // Embraer 190 (alternative)
  }
  return capacityMap[type] || null
}

function getPerformanceRating(avgDelay: number): "Excellent" | "Good" | "Fair" | "Poor" {
  if (avgDelay < 5) return "Excellent"
  if (avgDelay < 10) return "Good"
  if (avgDelay < 15) return "Fair"
  return "Poor"
} 