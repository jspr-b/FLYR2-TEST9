require('dotenv').config();
const https = require('https');

const SCHIPHOL_API_BASE = 'https://api.schiphol.nl/public-flights';
const SCHIPHOL_APP_KEY = process.env.SCHIPHOL_APP_KEY || 'bf01b2f53e73e9db0115b8f2093c97b9';
const SCHIPHOL_APP_ID = process.env.SCHIPHOL_APP_ID || 'cfcad115';

async function fetchFlights(page = 0) {
  return new Promise((resolve, reject) => {
    const today = new Date().toISOString().split('T')[0];
    const url = `${SCHIPHOL_API_BASE}/flights?flightDirection=D&airline=KL&scheduleDate=${today}&page=${page}`;
    
    const options = {
      headers: {
        'Accept': 'application/json',
        'app_id': SCHIPHOL_APP_ID,
        'app_key': SCHIPHOL_APP_KEY,
        'ResourceVersion': 'v4'
      }
    };

    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function checkAllFlights() {
  console.log('Checking for late evening flights...\n');
  
  let allFlights = [];
  let page = 0;
  const maxPages = 25; // Check more pages
  
  while (page < maxPages) {
    try {
      const data = await fetchFlights(page);
      if (!data.flights || data.flights.length === 0) {
        console.log(`No more flights after page ${page}`);
        break;
      }
      
      allFlights.push(...data.flights);
      console.log(`Page ${page}: ${data.flights.length} flights`);
      page++;
    } catch (error) {
      console.error(`Error on page ${page}:`, error.message);
      break;
    }
  }
  
  console.log(`\nTotal flights fetched: ${allFlights.length}`);
  
  // Sort by scheduled time
  allFlights.sort((a, b) => new Date(a.scheduleDateTime) - new Date(b.scheduleDateTime));
  
  // Find late evening flights (after 21:00)
  const lateFlights = allFlights.filter(f => {
    const time = new Date(f.scheduleDateTime);
    const hours = time.getHours();
    return hours >= 21;
  });
  
  console.log(`\nLate evening flights (after 21:00): ${lateFlights.length}`);
  console.log('\nLast 10 flights of the day:');
  
  const last10 = allFlights.slice(-10);
  last10.forEach(f => {
    const time = new Date(f.scheduleDateTime);
    const timeStr = time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' });
    const dest = f.route?.destinations?.[0] || 'Unknown';
    console.log(`${timeStr} - ${f.flightName} to ${dest} - Gate: ${f.gate || 'Not assigned'}`);
  });
  
  // Check for specific destinations
  console.log('\nChecking for Norwich, Leeds, Bradford flights:');
  const targetDests = ['NWI', 'LBA', 'LBA']; // Norwich, Leeds Bradford
  const targetFlights = allFlights.filter(f => {
    const dest = f.route?.destinations?.[0];
    return targetDests.includes(dest);
  });
  
  targetFlights.forEach(f => {
    const time = new Date(f.scheduleDateTime);
    const timeStr = time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' });
    const dest = f.route?.destinations?.[0] || 'Unknown';
    console.log(`${timeStr} - ${f.flightName} to ${dest} - Gate: ${f.gate || 'Not assigned'}`);
  });
}

checkAllFlights();