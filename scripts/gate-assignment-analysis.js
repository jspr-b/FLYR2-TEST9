const { fetchSchipholFlights, transformSchipholFlight, filterFlights, removeDuplicateFlights } = require('../lib/schiphol-api.js')

async function analyzeGateAssignments() {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    console.log(`🔍 Analyzing gate assignments for ${today}`)
    console.log('=' .repeat(60))

    const apiConfig = {
      flightDirection: 'D',
      airline: 'KL',
      scheduleDate: today,
      fetchAllPages: true
    }

    const schipholData = await fetchSchipholFlights(apiConfig)
    const allFlights = (schipholData.flights || []).map(transformSchipholFlight)

    const filters = {
      flightDirection: 'D',
      scheduleDate: today,
      isOperationalFlight: true,
      prefixicao: 'KL'
    }
    let filteredFlights = filterFlights(allFlights, filters)
    filteredFlights = removeDuplicateFlights(filteredFlights)

    console.log(`\n📊 Total KL departure flights today: ${filteredFlights.length}`)

    // Analyze gate assignments
    const flightsWithGates = filteredFlights.filter(f => f.gate && f.gate.trim() !== '')
    const flightsWithoutGates = filteredFlights.filter(f => !f.gate || f.gate.trim() === '')

    console.log(`\n🚪 Gate Assignment Status:`)
    console.log(`  ✅ Flights with gates assigned: ${flightsWithGates.length}`)
    console.log(`  ❌ Flights without gates: ${flightsWithoutGates.length}`)
    console.log(`  📊 Assignment rate: ${((flightsWithGates.length / filteredFlights.length) * 100).toFixed(1)}%`)

    // Analyze timing patterns for unassigned gates
    if (flightsWithoutGates.length > 0) {
      console.log(`\n⏰ Timing Analysis of Unassigned Flights:`)
      
      const currentTime = new Date()
      const currentHour = currentTime.getHours()
      
      const unassignedByTime = flightsWithoutGates.map(flight => {
        const scheduleTime = new Date(flight.scheduleDateTime)
        const hoursDiff = (scheduleTime.getTime() - currentTime.getTime()) / (1000 * 60 * 60)
        return {
          flight: flight.flightName,
          scheduleTime: scheduleTime.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          }),
          destination: flight.route.destinations[0] || 'Unknown',
          hoursUntilDeparture: Math.round(hoursDiff * 10) / 10
        }
      }).sort((a, b) => a.hoursUntilDeparture - b.hoursUntilDeparture)

      console.log(`\n📋 First 10 unassigned flights:`)
      unassignedByTime.slice(0, 10).forEach(flight => {
        const timeStatus = flight.hoursUntilDeparture > 0 ? 
          `in ${flight.hoursUntilDeparture}h` : 
          `${Math.abs(flight.hoursUntilDeparture)}h ago`
        console.log(`  ${flight.flight} → ${flight.destination} at ${flight.scheduleTime} (${timeStatus})`)
      })

      // Analyze by time windows
      const timeWindows = {
        'Next 2 hours': unassignedByTime.filter(f => f.hoursUntilDeparture >= 0 && f.hoursUntilDeparture <= 2).length,
        '2-6 hours': unassignedByTime.filter(f => f.hoursUntilDeparture > 2 && f.hoursUntilDeparture <= 6).length,
        '6-12 hours': unassignedByTime.filter(f => f.hoursUntilDeparture > 6 && f.hoursUntilDeparture <= 12).length,
        'More than 12h': unassignedByTime.filter(f => f.hoursUntilDeparture > 12).length,
        'Already departed': unassignedByTime.filter(f => f.hoursUntilDeparture < 0).length
      }

      console.log(`\n⏱️ Unassigned flights by time window:`)
      Object.entries(timeWindows).forEach(([window, count]) => {
        console.log(`  ${window}: ${count} flights`)
      })
    }

    // Show sample assigned gates for comparison
    console.log(`\n✅ Sample of assigned gates:`)
    const assignedSample = flightsWithGates.slice(0, 10).map(flight => ({
      flight: flight.flightName,
      gate: flight.gate,
      pier: flight.pier,
      time: new Date(flight.scheduleDateTime).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }),
      destination: flight.route.destinations[0] || 'Unknown'
    }))

    assignedSample.forEach(flight => {
      console.log(`  ${flight.flight} → ${flight.destination} at ${flight.time} (Gate ${flight.gate}, Pier ${flight.pier})`)
    })

    console.log('\n' + '=' .repeat(60))
    console.log(`🎯 Key Insights:`)
    console.log(`• Gate assignment rate: ${((flightsWithGates.length / filteredFlights.length) * 100).toFixed(1)}%`)
    console.log(`• Unassigned flights: ${flightsWithoutGates.length}`)
    console.log(`• Current time: ${currentTime.toLocaleTimeString('en-US', { hour12: false })}`)
    
  } catch (error) {
    console.error('❌ Analysis failed:', error)
  }
}

// Only run if called directly
if (require.main === module) {
  analyzeGateAssignments()
}

module.exports = { analyzeGateAssignments } 