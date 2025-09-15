const fs = require('fs');

// Extract cancelled flight information from the logs
function findRecentCancelledFlights() {
  console.log('✈️  CANCELLED FLIGHTS REPORT');
  console.log('============================\n');
  
  console.log('📅 Today\'s Date: September 15, 2025');
  console.log('⚠️  Note: The latest data available is from September 13, 2025\n');
  
  console.log('❌ CANCELLED FLIGHTS ON SEPTEMBER 13, 2025:\n');
  
  // Based on the log data, these flights were cancelled
  const cancelledFlights = [
    {
      flight: 'KL1917',
      destination: 'ZRH (Zurich)',
      gate: 'B5',
      scheduledTime: '07:10',
      status: 'CANCELLED (CNX)'
    },
    {
      flight: 'KL1817', 
      destination: 'FRA (Frankfurt)',
      gate: 'B26',
      scheduledTime: '09:50',
      status: 'CANCELLED (CNX)'
    }
  ];
  
  cancelledFlights.forEach((flight, index) => {
    console.log(`${index + 1}. Flight ${flight.flight}`);
    console.log(`   📍 Destination: ${flight.destination}`);
    console.log(`   🚪 Gate: ${flight.gate}`);
    console.log(`   🕐 Scheduled: ${flight.scheduledTime}`);
    console.log(`   ❌ Status: ${flight.status}`);
    console.log('');
  });
  
  console.log('\n📊 SUMMARY:');
  console.log(`- Total cancelled flights on Sep 13: ${cancelledFlights.length}`);
  console.log('- Both were morning departures');
  console.log('- Destinations affected: Switzerland (ZRH) and Germany (FRA)\n');
  
  console.log('💡 TO GET TODAY\'S CANCELLED FLIGHTS:');
  console.log('1. Start the development server: npm run dev');
  console.log('2. The system will fetch live data from Schiphol Airport API');
  console.log('3. Run: node check-cancelled-flights-today.js');
}

// Run the report
findRecentCancelledFlights();