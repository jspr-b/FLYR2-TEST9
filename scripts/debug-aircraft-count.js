const fetch = require('node-fetch');

async function debugAircraftCount() {
  try {
    console.log('🔍 Debugging aircraft count...\n');
    
    // Test the aircraft performance API
    const response = await fetch('http://localhost:3000/api/aircraft/performance');
    const data = await response.json();
    
    console.log('📊 API Response Summary:');
    console.log(`- Aircraft Types Count: ${data.summary.aircraftTypes}`);
    console.log(`- Chart Data Length: ${data.chartData.length}`);
    console.log(`- Table Data Length: ${data.tableData.length}`);
    
    console.log('\n📋 All Aircraft Types in Chart Data:');
    data.chartData.forEach((aircraft, index) => {
      console.log(`${index + 1}. ${aircraft.type} - ${aircraft.avgDelay.toFixed(1)}min avg delay, ${aircraft.flights} flights`);
    });
    
    console.log('\n🏆 Best Performer:');
    console.log(`- Type: ${data.summary.bestPerformer}`);
    console.log(`- Delay: ${data.summary.bestPerformerDelay}`);
    
    console.log('\n⚠️  Highest Delay:');
    console.log(`- Type: ${data.summary.highestDelay}`);
    console.log(`- Delay: ${data.summary.highestDelayValue}`);
    
    console.log('\n📈 Fleet Average Delay:');
    console.log(`- ${data.summary.fleetAvgDelay}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugAircraftCount(); 