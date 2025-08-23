const https = require('https');

const SCHIPHOL_APP_KEY = process.env.SCHIPHOL_APP_KEY || 'bf01b2f53e73e9db0115b8f2093c97b9';
const SCHIPHOL_APP_ID = process.env.SCHIPHOL_APP_ID || 'cfcad115';

// Get today's date in Amsterdam timezone
const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Amsterdam' });

const options = {
  hostname: 'api.schiphol.nl',
  path: `/public-flights/flights?flightDirection=D&scheduleDate=${today}&page=0`,
  method: 'GET',
  headers: {
    'Accept': 'application/json',
    'app_id': SCHIPHOL_APP_ID,
    'app_key': SCHIPHOL_APP_KEY,
    'ResourceVersion': 'v4'
  }
};

console.log('Making request to Schiphol API...');
console.log('URL:', `https://${options.hostname}${options.path}`);

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const jsonData = JSON.parse(data);
      console.log('\nAPI Response Status:', res.statusCode);
      console.log('Total flights returned:', jsonData.flights?.length || 0);
      
      if (jsonData.flights && jsonData.flights.length > 0) {
        console.log('\n=== FIRST FLIGHT FULL STRUCTURE ===');
        console.log(JSON.stringify(jsonData.flights[0], null, 2));
        
        console.log('\n=== CHECKING FOR GATE-RELATED FIELDS ===');
        const flight = jsonData.flights[0];
        console.log('flightName:', flight.flightName);
        console.log('gate:', flight.gate);
        console.log('pier:', flight.pier);
        console.log('terminal:', flight.terminal);
        console.log('publicFlightState:', JSON.stringify(flight.publicFlightState));
        console.log('flightStates:', flight.flightStates);
        
        // Check for any field containing 'gate' or 'change'
        console.log('\n=== SEARCHING FOR GATE/CHANGE FIELDS ===');
        Object.keys(flight).forEach(key => {
          if (key.toLowerCase().includes('gate') || key.toLowerCase().includes('change')) {
            console.log(`${key}:`, flight[key]);
          }
        });
        
        // Look for flights with multiple states or specific patterns
        console.log('\n=== FLIGHT STATES ANALYSIS ===');
        const statePatterns = new Map();
        jsonData.flights.forEach(f => {
          const states = f.publicFlightState?.flightStates || [];
          const pattern = states.join(',');
          if (!statePatterns.has(pattern)) {
            statePatterns.set(pattern, 0);
          }
          statePatterns.set(pattern, statePatterns.get(pattern) + 1);
        });
        
        console.log('Unique state patterns found:');
        statePatterns.forEach((count, pattern) => {
          console.log(`  "${pattern}": ${count} flights`);
        });
      }
      
    } catch (e) {
      console.error('Error parsing response:', e);
      console.log('Raw response:', data.substring(0, 500));
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error);
});

req.end();