const { fetchSchipholFlights, transformSchipholFlight } = require('./lib/schiphol-api.ts');

async function checkFlightKL641() {
  try {
    // Get today's date in Amsterdam timezone
    const today = new Date();
    const options = { timeZone: 'Europe/Amsterdam' };
    const scheduleDate = today.toLocaleDateString('sv-SE', options); // Format: YYYY-MM-DD
    
    console.log(`Checking KL641 for today (${scheduleDate})...`);
    
    // Fetch all KLM flights for today
    const response = await fetchSchipholFlights({
      airline: 'KLM',
      scheduleDate: scheduleDate,
      fetchAllPages: true
    });
    
    // Find KL641
    const kl641Flights = response.flights.filter(flight => 
      flight.flightName === 'KL641' || flight.flightName === 'KL 641' || 
      (flight.flightNumber === 641 && flight.prefixIATA === 'KL')
    );
    
    if (kl641Flights.length === 0) {
      console.log('\nNo KL641 flight found for today.');
      return;
    }
    
    // Display flight information
    kl641Flights.forEach(flight => {
      console.log('\n=== KL641 Flight Information ===');
      console.log(`Flight: ${flight.flightName}`);
      console.log(`Direction: ${flight.flightDirection === 'D' ? 'Departure' : 'Arrival'}`);
      console.log(`Scheduled Time: ${flight.scheduleDateTime}`);
      console.log(`Destinations: ${flight.route?.destinations?.join(', ') || 'N/A'}`);
      console.log(`Gate: ${flight.gate || 'Not assigned'}`);
      console.log(`Terminal/Pier: ${flight.pier || 'N/A'}`);
      console.log(`Aircraft Type: ${flight.aircraftType?.iataMain || 'N/A'}`);
      console.log(`Status: ${flight.publicFlightState?.flightStates?.join(', ') || 'Unknown'}`);
      
      if (flight.publicEstimatedOffBlockTime) {
        console.log(`Estimated Departure: ${flight.publicEstimatedOffBlockTime}`);
      }
      if (flight.expectedTimeBoarding) {
        console.log(`Expected Boarding: ${flight.expectedTimeBoarding}`);
      }
      if (flight.actualOffBlockTime) {
        console.log(`Actual Departure: ${flight.actualOffBlockTime}`);
      }
      
      console.log(`Last Updated: ${flight.lastUpdatedAt}`);
    });
    
  } catch (error) {
    console.error('Error checking KL641:', error);
  }
}

// Run the check
checkFlightKL641();