// Using built-in fetch (Node.js 18+)

async function getCancelledFlightsToday() {
  try {
    console.log('🔍 Fetching cancelled flights for today...\n');
    
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    console.log(`📅 Date: ${today}\n`);
    
    // Fetch data including cancelled flights
    const response = await fetch('http://127.0.0.1:3000/api/dashboard-data?includeCancelled=true&includeGateOccupancy=true');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Filter for cancelled flights (those with CNX state)
    const cancelledFlights = data.flights.filter(flight => 
      flight.publicFlightState?.flightStates?.includes('CNX')
    );
    
    console.log(`❌ CANCELLED FLIGHTS TODAY (${today}):`);
    console.log(`Total cancelled flights: ${cancelledFlights.length}\n`);
    
    if (cancelledFlights.length === 0) {
      console.log('✅ No flights were cancelled today!');
      return;
    }
    
    // Sort by scheduled departure time
    cancelledFlights.sort((a, b) => 
      new Date(a.scheduleDateTime).getTime() - new Date(b.scheduleDateTime).getTime()
    );
    
    // Display cancelled flights
    cancelledFlights.forEach((flight, index) => {
      const scheduledTime = new Date(flight.scheduleDateTime);
      const timeStr = scheduledTime.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
      
      console.log(`${index + 1}. Flight ${flight.flightName} (${flight.flightNumber})`);
      console.log(`   ✈️  Aircraft: ${flight.aircraftType?.iataMain || 'Unknown'}`);
      console.log(`   📍 Destination: ${flight.route?.destinations?.[0] || 'Unknown'}`);
      console.log(`   🕐 Scheduled: ${timeStr}`);
      console.log(`   🚪 Original Gate: ${flight.originalGate || flight.gate || 'No gate assigned'}`);
      console.log(`   ❌ Status: CANCELLED`);
      console.log('');
    });
    
    // Summary by destination
    console.log('\n📊 CANCELLATIONS BY DESTINATION:');
    const destinationCount = {};
    cancelledFlights.forEach(flight => {
      const dest = flight.route?.destinations?.[0] || 'Unknown';
      destinationCount[dest] = (destinationCount[dest] || 0) + 1;
    });
    
    Object.entries(destinationCount)
      .sort((a, b) => b[1] - a[1])
      .forEach(([dest, count]) => {
        console.log(`   ${dest}: ${count} flight${count > 1 ? 's' : ''}`);
      });
    
  } catch (error) {
    console.error('❌ Error fetching cancelled flights:', error.message);
    console.log('\n💡 Make sure the development server is running (npm run dev)');
  }
}

// Run the check
getCancelledFlightsToday();