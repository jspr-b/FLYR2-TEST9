const fetch = require('node-fetch');

async function analyzeAircraftTypes() {
  try {
    console.log('🔍 Analyzing aircraft types directly from flight data...\n');
    
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    
    // Fetch flight data directly
    const response = await fetch(`http://localhost:3000/api/flights?flightDirection=D&scheduleDate=${today}&isOperationalFlight=true&prefixicao=KL`);
    const data = await response.json();
    
    if (!data.flights || data.flights.length === 0) {
      console.log('❌ No flights found');
      return;
    }
    
    console.log(`📊 Total flights found: ${data.flights.length}\n`);
    
    // Count aircraft types using iataSub (specific variant)
    const aircraftCountsIataSub = {};
    const aircraftCountsIataMain = {};
    
    data.flights.forEach(flight => {
      const iataSub = flight.aircraftType.iataSub;
      const iataMain = flight.aircraftType.iataMain;
      
      if (iataSub) {
        aircraftCountsIataSub[iataSub] = (aircraftCountsIataSub[iataSub] || 0) + 1;
      }
      
      if (iataMain) {
        aircraftCountsIataMain[iataMain] = (aircraftCountsIataMain[iataMain] || 0) + 1;
      }
    });
    
    console.log('📋 Aircraft Types by iataSub (specific variant):');
    console.log(`Total unique types: ${Object.keys(aircraftCountsIataSub).length}`);
    Object.entries(aircraftCountsIataSub)
      .sort(([,a], [,b]) => b - a)
      .forEach(([type, count]) => {
        console.log(`  ${type}: ${count} flights`);
      });
    
    console.log('\n📋 Aircraft Types by iataMain (general type):');
    console.log(`Total unique types: ${Object.keys(aircraftCountsIataMain).length}`);
    Object.entries(aircraftCountsIataMain)
      .sort(([,a], [,b]) => b - a)
      .forEach(([type, count]) => {
        console.log(`  ${type}: ${count} flights`);
      });
    
    // Check for aircraft types with no delays
    console.log('\n🔍 Analyzing delays by aircraft type...');
    const delayAnalysis = {};
    
    data.flights.forEach(flight => {
      const type = flight.aircraftType.iataSub || flight.aircraftType.iataMain;
      if (!type) return;
      
      if (!delayAnalysis[type]) {
        delayAnalysis[type] = {
          flights: 0,
          delays: [],
          avgDelay: 0
        };
      }
      
      delayAnalysis[type].flights++;
      
      // Calculate delay (simplified - you might need the actual delay calculation)
      const scheduled = new Date(flight.scheduleDateTime);
      const estimated = new Date(flight.publicEstimatedOffBlockTime);
      const delayMinutes = (estimated - scheduled) / (1000 * 60);
      
      if (!isNaN(delayMinutes)) {
        delayAnalysis[type].delays.push(delayMinutes);
      }
    });
    
    // Calculate average delays
    Object.keys(delayAnalysis).forEach(type => {
      const delays = delayAnalysis[type].delays;
      if (delays.length > 0) {
        delayAnalysis[type].avgDelay = delays.reduce((a, b) => a + b, 0) / delays.length;
      }
    });
    
    console.log('\n📊 Delay Analysis by Aircraft Type:');
    Object.entries(delayAnalysis)
      .sort(([,a], [,b]) => a.avgDelay - b.avgDelay)
      .forEach(([type, data]) => {
        const status = data.avgDelay === 0 ? '🟢' : data.avgDelay > 0 ? '🟡' : '🔴';
        console.log(`${status} ${type}: ${data.avgDelay.toFixed(1)}min avg delay (${data.flights} flights)`);
      });
    
    // Count aircraft types with zero delays
    const zeroDelayTypes = Object.entries(delayAnalysis).filter(([, data]) => data.avgDelay === 0);
    console.log(`\n🟢 Aircraft types with zero average delay: ${zeroDelayTypes.length}`);
    zeroDelayTypes.forEach(([type]) => console.log(`  - ${type}`));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

analyzeAircraftTypes(); 