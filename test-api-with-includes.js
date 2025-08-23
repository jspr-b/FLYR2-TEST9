const https = require('https');

const SCHIPHOL_APP_KEY = process.env.SCHIPHOL_APP_KEY || 'bf01b2f53e73e9db0115b8f2093c97b9';
const SCHIPHOL_APP_ID = process.env.SCHIPHOL_APP_ID || 'cfcad115';

// Get today's date in Amsterdam timezone
const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Amsterdam' });

// Try different API parameters to get gate information
const testRequests = [
  {
    name: 'With includedelays parameter',
    path: `/public-flights/flights?flightDirection=D&scheduleDate=${today}&includedelays=true&page=0`
  },
  {
    name: 'KLM flights only',
    path: `/public-flights/flights?flightDirection=D&scheduleDate=${today}&airline=KL&page=0`
  },
  {
    name: 'Different resource version (v3)',
    path: `/public-flights/flights?flightDirection=D&scheduleDate=${today}&page=0`,
    resourceVersion: 'v3'
  }
];

function makeRequest(testConfig) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.schiphol.nl',
      path: testConfig.path,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'app_id': SCHIPHOL_APP_ID,
        'app_key': SCHIPHOL_APP_KEY,
        'ResourceVersion': testConfig.resourceVersion || 'v4'
      }
    };

    console.log(`\n=== Testing: ${testConfig.name} ===`);
    console.log('URL:', `https://${options.hostname}${options.path}`);

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
            const flight = jsonData.flights[0];
            console.log('\nFirst flight sample:');
            console.log('- flightName:', flight.flightName);
            console.log('- gate:', flight.gate || 'NOT PROVIDED');
            console.log('- pier:', flight.pier || 'NOT PROVIDED');
            console.log('- terminal:', flight.terminal || 'NOT PROVIDED');
            console.log('- baggageClaim:', flight.baggageClaim || 'NOT PROVIDED');
            console.log('- checkinAllocations:', flight.checkinAllocations || 'NOT PROVIDED');
            console.log('- transferPositions:', JSON.stringify(flight.transferPositions) || 'NOT PROVIDED');
            console.log('- publicFlightState:', JSON.stringify(flight.publicFlightState));
            
            // Check all fields
            console.log('\nAll fields in response:');
            console.log(Object.keys(flight).sort().join(', '));
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

// Run all tests sequentially
async function runTests() {
  for (const test of testRequests) {
    await makeRequest(test);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between requests
  }
}

runTests();