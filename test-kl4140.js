const https = require('https');

const SCHIPHOL_APP_KEY = process.env.SCHIPHOL_APP_KEY || 'bf01b2f53e73e9db0115b8f2093c97b9';
const SCHIPHOL_APP_ID = process.env.SCHIPHOL_APP_ID || 'cfcad115';

// Get today's date in Amsterdam timezone
const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Amsterdam' });

function searchForKL4140() {
  const options = {
    hostname: 'api.schiphol.nl',
    path: `/public-flights/flights?flightDirection=D&airline=KL&scheduleDate=${today}&page=0`,
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'app_id': SCHIPHOL_APP_ID,
      'app_key': SCHIPHOL_APP_KEY,
      'ResourceVersion': 'v4'
    }
  };

  console.log(`Searching for KL4140 on ${today}...`);

  // Check multiple pages
  for (let page = 0; page < 20; page++) {
    options.path = `/public-flights/flights?flightDirection=D&airline=KL&scheduleDate=${today}&page=${page}`;
    
    https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          
          if (jsonData.flights) {
            // Look for flights in 4100-4200 range
            const flights4000Range = jsonData.flights.filter(f => 
              f.flightNumber >= 4100 && f.flightNumber <= 4200
            );
            
            if (flights4000Range.length > 0) {
              console.log(`\n=== Page ${page}: Found ${flights4000Range.length} flights in KL4100-4200 range ===`);
              flights4000Range.forEach(f => {
                console.log(`\n${f.flightName}:`);
                console.log(`  Number: ${f.flightNumber}`);
                console.log(`  Main Flight: ${f.mainFlight || 'N/A'}`);
                console.log(`  Destination: ${f.route?.destinations?.[0] || 'N/A'}`);
                console.log(`  Gate: ${f.gate || 'NO GATE'}`);
                console.log(`  States: ${f.publicFlightState?.flightStates?.join(', ') || 'NO STATES'}`);
                console.log(`  Has GCH: ${f.publicFlightState?.flightStates?.includes('GCH') ? '✅ YES' : '❌ NO'}`);
              });
            }
            
            // Specifically check for 4140
            const kl4140 = jsonData.flights.find(f => f.flightNumber === 4140);
            if (kl4140) {
              console.log('\n🎯 FOUND KL4140 on page', page);
              console.log(JSON.stringify(kl4140, null, 2));
            }
          }
        } catch (e) {
          // Silent error handling for concurrent requests
        }
      });
    }).end();
  }
}

searchForKL4140();