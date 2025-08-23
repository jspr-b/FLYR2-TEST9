const https = require('https');

const SCHIPHOL_APP_KEY = process.env.SCHIPHOL_APP_KEY || 'bf01b2f53e73e9db0115b8f2093c97b9';
const SCHIPHOL_APP_ID = process.env.SCHIPHOL_APP_ID || 'cfcad115';

// Get today's date in Amsterdam timezone
const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Amsterdam' });

function makeRequest(airline) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.schiphol.nl',
      path: `/public-flights/flights?flightDirection=D&scheduleDate=${today}&airline=${airline}&page=0`,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'app_id': SCHIPHOL_APP_ID,
        'app_key': SCHIPHOL_APP_KEY,
        'ResourceVersion': 'v4'
      }
    };

    console.log(`\n=== Fetching ${airline} flights ===`);

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          console.log('Status:', res.statusCode);
          console.log('Flights returned:', jsonData.flights?.length || 0);
          
          if (jsonData.flights && jsonData.flights.length > 0) {
            // Look for KL-numbered flights that might be operated by others
            const suspiciousFlights = jsonData.flights.filter(f => {
              const flightNum = f.flightNumber?.toString() || '';
              return (flightNum >= '2500' && flightNum <= '2999') || 
                     (flightNum >= '3200' && flightNum <= '3299');
            });

            console.log('\nChecking operating carrier fields:');
            const sampleFlight = jsonData.flights[0];
            console.log('Sample flight:', sampleFlight.flightName);
            console.log('- mainFlight:', sampleFlight.mainFlight || 'NOT PROVIDED');
            console.log('- prefixIATA:', sampleFlight.prefixIATA || 'NOT PROVIDED');
            console.log('- prefixICAO:', sampleFlight.prefixICAO || 'NOT PROVIDED');
            console.log('- airlineCode:', sampleFlight.airlineCode || 'NOT PROVIDED');
            console.log('- codeshares:', JSON.stringify(sampleFlight.codeshares) || 'NOT PROVIDED');
            
            if (suspiciousFlights.length > 0) {
              console.log('\nPotential codeshare flights found:');
              suspiciousFlights.slice(0, 3).forEach(f => {
                console.log(`\n${f.flightName} to ${f.route?.destinations?.[0]}:`);
                console.log('  mainFlight:', f.mainFlight);
                console.log('  prefixIATA:', f.prefixIATA);
                console.log('  codeshares:', JSON.stringify(f.codeshares));
                console.log('  gate:', f.gate || 'NO GATE');
                console.log('  states:', f.publicFlightState?.flightStates?.join(', ') || 'NO STATES');
              });
            }
          }
          
          resolve();
        } catch (e) {
          console.error('Error:', e.message);
          resolve();
        }
      });
    });

    req.on('error', (error) => {
      console.error('Request error:', error);
      resolve();
    });

    req.end();
  });
}

// Test both KL and HV airlines
async function runTests() {
  await makeRequest('KL');
  await new Promise(resolve => setTimeout(resolve, 1000));
  await makeRequest('HV');
}

runTests();