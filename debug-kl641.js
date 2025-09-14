const fetch = require('node-fetch');

async function debugKL641() {
  try {
    // Fetch dashboard data
    const response = await fetch('http://localhost:3000/api/dashboard-data?includeGateOccupancy=true&includeCancelled=true');
    const data = await response.json();
    
    // Find KL0641 in the gate data
    for (const gate of data.gates) {
      for (const flight of gate.scheduledFlights) {
        if (flight.flightName === 'KL0641' || flight.flightName === 'KL641') {
          console.log('\n=== KL0641 Debug Info ===');
          console.log('Flight Name:', flight.flightName);
          console.log('Schedule Time:', flight.scheduleDateTime);
          console.log('Estimated Time:', flight.estimatedDateTime);
          console.log('Actual Time:', flight.actualDateTime);
          console.log('Actual Off Block Time:', flight.actualOffBlockTime);
          console.log('Delay Minutes:', flight.delayMinutes);
          console.log('Delay Formatted:', flight.delayFormatted);
          console.log('Is Delayed:', flight.isDelayed);
          console.log('Primary State:', flight.primaryState);
          console.log('Flight States:', flight.flightStates);
          console.log('\n--- Full flight object ---');
          console.log(JSON.stringify(flight, null, 2));
          return;
        }
      }
    }
    
    console.log('KL0641 not found in gate data');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

debugKL641();