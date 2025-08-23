const https = require('https');

const SCHIPHOL_APP_KEY = process.env.SCHIPHOL_APP_KEY || 'bf01b2f53e73e9db0115b8f2093c97b9';
const SCHIPHOL_APP_ID = process.env.SCHIPHOL_APP_ID || 'cfcad115';

// Get today's date in Amsterdam timezone
const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Amsterdam' });

// Search for KL3576
function searchFlight(direction) {
  const options = {
    hostname: 'api.schiphol.nl',
    path: `/public-flights/flights?flightDirection=${direction}&airline=KL&scheduleDate=${today}&page=0`,
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'app_id': SCHIPHOL_APP_ID,
      'app_key': SCHIPHOL_APP_KEY,
      'ResourceVersion': 'v4'
    }
  };

  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          console.log(`\n=== Searching ${direction} flights ===`);
          
          if (jsonData.flights) {
            // Search for flights in 3500-3600 range
            const flights3500Range = jsonData.flights.filter(f => 
              f.flightNumber >= 3500 && f.flightNumber <= 3600
            );
            
            console.log(`Found ${flights3500Range.length} flights in KL3500-3600 range:`);
            flights3500Range.forEach(f => {
              console.log(`  ${f.flightName} (${f.flightNumber}) - Main: ${f.mainFlight || 'N/A'} - To: ${f.route?.destinations?.[0] || 'N/A'}`);
            });
            
            // Specifically look for 3576
            const flight3576 = jsonData.flights.find(f => f.flightNumber === 3576);
            if (flight3576) {
              console.log('\n🎯 FOUND KL3576:');
              console.log(JSON.stringify(flight3576, null, 2));
            } else {
              console.log('\n❌ KL3576 not found in this direction');
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

// Search without airline filter
function searchAllFlights() {
  const options = {
    hostname: 'api.schiphol.nl',
    path: `/public-flights/flights?flightDirection=D&scheduleDate=${today}&page=15`, // Check later pages
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'app_id': SCHIPHOL_APP_ID,
      'app_key': SCHIPHOL_APP_KEY,
      'ResourceVersion': 'v4'
    }
  };

  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          console.log('\n=== Searching ALL airlines (page 15) ===');
          
          if (jsonData.flights) {
            const kl3576 = jsonData.flights.find(f => f.flightName === 'KL3576' || f.flightNumber === 3576);
            if (kl3576) {
              console.log('\n🎯 FOUND in all flights:');
              console.log(JSON.stringify(kl3576, null, 2));
            } else {
              const klFlights = jsonData.flights.filter(f => f.flightName && f.flightName.startsWith('KL'));
              console.log(`\nKL flights on this page: ${klFlights.map(f => f.flightName).join(', ')}`);
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

// Run searches
async function investigate() {
  console.log(`Investigating KL3576 for date: ${today}`);
  
  // Search departures with KL filter
  await searchFlight('D');
  
  // Search arrivals with KL filter
  await searchFlight('A');
  
  // Search all airlines
  await searchAllFlights();
}

investigate();