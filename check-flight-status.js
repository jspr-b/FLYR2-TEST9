// Script to check specific flight statuses

async function checkFlightStatus() {
  try {
    // Fetch dashboard data
    const response = await fetch('http://localhost:3000/api/dashboard-data?includeGateOccupancy=true');
    const data = await response.json();
    
    console.log('\n=== CHECKING SPECIFIC FLIGHTS ===\n');
    
    // Look for specific flights
    const flightsToCheck = ['1559', '1453', 'KL1559', 'KL1453'];
    
    if (data.gateOccupancy && data.gateOccupancy.gates) {
      data.gateOccupancy.gates.forEach(gate => {
        gate.scheduledFlights.forEach(flight => {
          // Check if this is one of our target flights
          const isTargetFlight = flightsToCheck.some(target => 
            flight.flightNumber.includes(target) || 
            flight.flightName.includes(target)
          );
          
          if (isTargetFlight) {
            console.log(`\nFlight: ${flight.flightName}`);
            console.log(`Flight Number: ${flight.flightNumber}`);
            console.log(`Gate: ${gate.gateID} (Pier ${gate.pier})`);
            console.log(`Destination: ${flight.destination}`);
            console.log(`Primary State: ${flight.primaryState} (${flight.primaryStateReadable})`);
            console.log(`All States: ${flight.flightStates.join(', ')}`);
            console.log(`All States Readable: ${flight.flightStatesReadable.join(', ')}`);
            console.log(`Scheduled Time: ${flight.scheduleDateTime}`);
            console.log(`Estimated Time: ${flight.estimatedDateTime || 'Not set'}`);
            console.log(`Is Delayed: ${flight.isDelayed}`);
            console.log(`Delay Minutes: ${flight.delayMinutes}`);
            
            // Calculate if flight should have departed based on time
            const scheduledTime = new Date(flight.scheduleDateTime);
            const currentTime = new Date();
            const timeDiff = currentTime - scheduledTime;
            const minutesPastScheduled = Math.floor(timeDiff / 60000);
            
            console.log(`\nTime Analysis:`);
            console.log(`Current Time: ${currentTime.toISOString()}`);
            console.log(`Minutes Past Scheduled: ${minutesPastScheduled}`);
            
            // Check if gate timeline has ended
            const gateCloseTime = new Date(scheduledTime.getTime() + 10 * 60 * 1000); // 10 min after departure
            const shouldBeComplete = currentTime > gateCloseTime;
            
            console.log(`Gate Close Time: ${gateCloseTime.toISOString()}`);
            console.log(`Should Be Complete: ${shouldBeComplete}`);
            
            if (flight.primaryState === 'GTD' && shouldBeComplete) {
              console.log(`⚠️  WARNING: Flight shows GTD but should likely be DEP based on timeline`);
            }
            
            console.log('-----------------------------------');
          }
        });
      });
    }
    
    // Also check in the main flights array
    console.log('\n=== CHECKING IN MAIN FLIGHTS ARRAY ===\n');
    
    if (data.flights) {
      data.flights.forEach(flight => {
        const isTargetFlight = flightsToCheck.some(target => 
          (flight.flightNumber && flight.flightNumber.includes(target)) || 
          (flight.flightName && flight.flightName.includes(target))
        );
        
        if (isTargetFlight) {
          console.log(`\nFlight: ${flight.flightName}`);
          console.log(`States: ${flight.publicFlightState}`);
          console.log(`Schedule Time: ${flight.scheduleDateTime}`);
          console.log('---');
        }
      });
    }
    
  } catch (error) {
    console.error('Error checking flight status:', error);
  }
}

// Run the check
checkFlightStatus();