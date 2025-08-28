// Test script to get D6 gate flights from API

async function fetchGateD6Flights() {
  try {
    console.log('Fetching gate occupancy data to find D6 flights...\n');
    
    // Simulate the API call that the app makes
    const response = await fetch('http://localhost:3000/api/gate-occupancy');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Find gate D6 data
    const gateD6 = data.gates?.find(gate => gate.gateID === 'D6');
    
    if (gateD6) {
      console.log('=== GATE D6 DATA ===\n');
      console.log(JSON.stringify(gateD6, null, 2));
      
      console.log('\n=== SAMPLE FLIGHTS AT GATE D6 ===\n');
      if (gateD6.scheduledFlights && gateD6.scheduledFlights.length > 0) {
        // Show first 3 flights as examples
        gateD6.scheduledFlights.slice(0, 3).forEach((flight, index) => {
          console.log(`\nFlight ${index + 1}:`);
          console.log(JSON.stringify(flight, null, 2));
        });
      }
    } else {
      console.log('No gate D6 found in the response');
      
      // Show all gate IDs to see what's available
      const allGates = data.gates?.map(g => g.gateID).filter(Boolean).sort();
      console.log('\nAll gates found:', allGates);
    }
    
    // Also show the raw Schiphol API structure from one flight
    console.log('\n=== RAW SCHIPHOL API FLIGHT STRUCTURE ===');
    console.log('(This is what comes from the Schiphol API before processing)\n');
    
    const sampleFlight = data.gates?.find(g => g.scheduledFlights?.length > 0)?.scheduledFlights?.[0];
    if (sampleFlight) {
      console.log(JSON.stringify({
        flightName: sampleFlight.flightName,
        flightNumber: sampleFlight.flightNumber,
        scheduleDateTime: sampleFlight.scheduleDateTime,
        estimatedDateTime: sampleFlight.estimatedDateTime,
        gate: sampleFlight.gate,
        pier: sampleFlight.pier,
        publicFlightState: sampleFlight.publicFlightState,
        flightDirection: sampleFlight.flightDirection,
        route: sampleFlight.route,
        lastUpdatedAt: sampleFlight.lastUpdatedAt
      }, null, 2));
    }
    
  } catch (error) {
    console.error('Error fetching data:', error.message);
    console.log('\nMake sure the development server is running (npm run dev)');
  }
}

fetchGateD6Flights();