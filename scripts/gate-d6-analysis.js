const BASE_URL = 'http://localhost:3000'
const TODAY = new Date().toISOString().split('T')[0]

// Non-Schengen bus gates
const NON_SCHENGEN_BUS_GATES = ['D6', 'G1', 'E21']

async function makeRequest(url) {
  try {
    const response = await fetch(url)
    const data = await response.json()
    return { status: response.status, data }
  } catch (error) {
    console.error('Request failed:', error)
    return { status: 500, error: error.message }
  }
}

async function analyzeNonSchengenBusGates() {
  console.log('🔍 NON-SCHENGEN BUS GATES ANALYSIS')
  console.log('=' .repeat(60))
  console.log(`Analysis Date: ${TODAY}`)
  console.log(`API Endpoint: GET /public-flights/flights`)
  console.log(`Focus: KLM mainline flights only\n`)

  try {
    // 1. Get today's flight data
    console.log('📊 1. ANALYZING TODAY\'S FLIGHT DATA')
    console.log('-' .repeat(40))
    
    const filters = encodeURIComponent(JSON.stringify({
      flightDirection: 'D',
      scheduleDate: TODAY,
      isOperationalFlight: true,
      prefixicao: 'KL'
    }))
    
    const flightsResponse = await makeRequest(`${BASE_URL}/api/flights?filters=${filters}`)
    
    if (flightsResponse.status !== 200) {
      console.error('❌ Failed to fetch flight data:', flightsResponse.error)
      return
    }

    const { flights } = flightsResponse.data
    console.log(`Total KLM flights today: ${flights.length}`)

    // 2. Non-Schengen Bus Gates Analysis
    console.log('\n🚌 2. NON-SCHENGEN BUS GATES DETAILS')
    console.log('-' .repeat(40))
    
    // Filter flights by non-Schengen bus gates
    const busGateFlights = flights.filter(f => NON_SCHENGEN_BUS_GATES.includes(f.gate))
    
    // Group flights by gate
    const gateGroups = busGateFlights.reduce((acc, flight) => {
      const gate = flight.gate
      if (!acc[gate]) {
        acc[gate] = []
      }
      acc[gate].push(flight)
      return acc
    }, {})

    // Analyze each gate
    NON_SCHENGEN_BUS_GATES.forEach(gate => {
      const gateFlights = gateGroups[gate] || []
      console.log(`\n${gate} Bus Gate:`)
      console.log(`  • Total flights: ${gateFlights.length}`)
      
      if (gateFlights.length > 0) {
        // Aircraft types
        const aircraftTypes = [...new Set(gateFlights.map(f => f.aircraftType?.iataMain || 'Unknown'))]
        console.log(`  • Aircraft types: ${aircraftTypes.join(', ')}`)
        
        // Destinations
        const destinations = gateFlights.reduce((acc, f) => {
          const dest = f.route?.destinations?.[0] || 'Unknown'
          if (!acc[dest]) acc[dest] = 0
          acc[dest]++
          return acc
        }, {})
        
        console.log('  • Destinations:')
        Object.entries(destinations)
          .sort(([,a], [,b]) => b - a)
          .forEach(([dest, count]) => {
            console.log(`    - ${dest}: ${count} flights`)
          })

        // Time distribution
        const sortedFlights = [...gateFlights].sort((a, b) => 
          new Date(a.scheduleDateTime).getTime() - new Date(b.scheduleDateTime).getTime()
        )
        
        const firstFlight = sortedFlights[0]
        const lastFlight = sortedFlights[sortedFlights.length - 1]
        
        console.log('  • Operating hours:')
        console.log(`    - First: ${new Date(firstFlight.scheduleDateTime).toLocaleTimeString()}`)
        console.log(`    - Last: ${new Date(lastFlight.scheduleDateTime).toLocaleTimeString()}`)
      }
    })

    // 3. Combined Analysis
    console.log('\n📊 3. COMBINED ANALYSIS')
    console.log('-' .repeat(40))
    
    const totalBusGateFlights = busGateFlights.length
    const percentageOfTotal = ((totalBusGateFlights / flights.length) * 100).toFixed(1)
    
    console.log('Overall Statistics:')
    console.log(`  • Total non-Schengen bus gate flights: ${totalBusGateFlights}`)
    console.log(`  • Percentage of all flights: ${percentageOfTotal}%`)
    
    // Aircraft type distribution
    const aircraftTypes = busGateFlights.reduce((acc, flight) => {
      const type = flight.aircraftType?.iataMain || 'Unknown'
      if (!acc[type]) acc[type] = 0
      acc[type]++
      return acc
    }, {})
    
    console.log('\nAircraft Type Distribution:')
    Object.entries(aircraftTypes)
      .sort(([,a], [,b]) => b - a)
      .forEach(([type, count]) => {
        const percentage = ((count / totalBusGateFlights) * 100).toFixed(1)
        console.log(`  • ${type}: ${count} flights (${percentage}%)`)
      })

    // Destination analysis
    const destinations = busGateFlights.reduce((acc, flight) => {
      const dest = flight.route?.destinations?.[0] || 'Unknown'
      if (!acc[dest]) acc[dest] = 0
      acc[dest]++
      return acc
    }, {})
    
    console.log('\nTop Destinations:')
    Object.entries(destinations)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .forEach(([dest, count]) => {
        const percentage = ((count / totalBusGateFlights) * 100).toFixed(1)
        console.log(`  • ${dest}: ${count} flights (${percentage}%)`)
      })

  } catch (error) {
    console.error('❌ Analysis failed:', error)
  }
}

// Run the analysis
analyzeNonSchengenBusGates() 