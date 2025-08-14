// Test script to debug delay trends API

async function testAPIs() {
  console.log('Testing APIs...\n');
  
  // Test regular flights API
  try {
    const flightsResponse = await fetch('http://localhost:3000/api/flights');
    const flightsData = await flightsResponse.json();
    console.log('=== FLIGHTS API ===');
    console.log(`Total flights: ${flightsData.flights?.length || 0}`);
    console.log(`Date: ${flightsData.metadata?.date}`);
    console.log(`Debug info:`, flightsData.metadata?.debug);
    
    if (flightsData.flights?.length > 0) {
      console.log(`\nFirst flight example:`);
      const firstFlight = flightsData.flights[0];
      console.log(`- Flight: ${firstFlight.flightName}`);
      console.log(`- Schedule: ${firstFlight.scheduleDateTime}`);
      console.log(`- State: ${firstFlight.publicFlightState?.flightStates}`);
    }
  } catch (error) {
    console.error('Flights API error:', error);
  }
  
  console.log('\n---\n');
  
  // Test delay trends API
  try {
    const delayResponse = await fetch('http://localhost:3000/api/delay-trends/hourly');
    const delayData = await delayResponse.json();
    console.log('=== DELAY TRENDS API ===');
    console.log('Summary:', delayData.summary);
    
    const hoursWithFlights = delayData.hourlyData?.filter(h => h.flights > 0) || [];
    console.log(`\nHours with flights: ${hoursWithFlights.length}`);
    
    if (hoursWithFlights.length > 0) {
      console.log('\nHours with flights:');
      hoursWithFlights.forEach(hour => {
        console.log(`- ${hour.hour}: ${hour.flights} flights, avg delay: ${hour.avgDelay || 0} min`);
      });
    }
  } catch (error) {
    console.error('Delay trends API error:', error);
  }
}

testAPIs();