const { fetchSchipholFlights, transformSchipholFlight } = require('./lib/schiphol-api');

async function testGCHFlights() {
  try {
    console.log('Fetching all flights for today...');
    
    // Get today's date in Amsterdam timezone
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Amsterdam' });
    
    const rawData = await fetchSchipholFlights({
      flightDirection: 'D',
      scheduleDate: today,
      fetchAllPages: true
    });

    console.log(`Total raw flights: ${rawData.flights.length}`);
    
    // Transform flights
    const flights = rawData.flights.map(transformSchipholFlight);
    
    // Find all flights with GCH state
    const gchFlights = flights.filter(flight => {
      const states = flight.publicFlightState?.flightStates || [];
      return states.includes('GCH');
    });
    
    console.log(`\nFlights with GCH state: ${gchFlights.length}`);
    
    // Show details of GCH flights
    gchFlights.forEach(flight => {
      console.log(`\n${flight.flightName} to ${flight.route.destinations[0]}`);
      console.log(`  Flight Number: ${flight.flightNumber}`);
      console.log(`  Gate: ${flight.gate || 'NO GATE'}`);
      console.log(`  Pier: ${flight.pier || 'NO PIER'}`);
      console.log(`  States: ${flight.publicFlightState?.flightStates?.join(', ')}`);
      console.log(`  Schedule: ${flight.scheduleDateTime}`);
      console.log(`  Main Flight: ${flight.mainFlight || 'N/A'}`);
      console.log(`  Prefix IATA: ${flight.prefixIATA || 'N/A'}`);
    });
    
    // Also check for any patterns in flight states
    console.log('\n\nAll unique flight state combinations:');
    const statePatterns = new Map();
    flights.forEach(flight => {
      const states = flight.publicFlightState?.flightStates || [];
      const pattern = states.join(',');
      if (!statePatterns.has(pattern)) {
        statePatterns.set(pattern, []);
      }
      statePatterns.get(pattern).push(flight.flightName);
    });
    
    // Show patterns that include GCH
    for (const [pattern, flightNames] of statePatterns) {
      if (pattern.includes('GCH')) {
        console.log(`\nPattern: ${pattern}`);
        console.log(`Flights: ${flightNames.slice(0, 5).join(', ')}${flightNames.length > 5 ? '...' : ''} (${flightNames.length} total)`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testGCHFlights();