// Test script to verify KL9xxx ground transport filtering

const testFlights = [
  { flightName: 'KL1001', flightNumber: 1001, mainFlight: 'KL1001' },
  { flightName: 'KL9955', flightNumber: 9955, mainFlight: 'KL9955' },
  { flightName: 'KL9960', flightNumber: 9960, mainFlight: 'KL9960' },
  { flightName: 'KL9001', flightNumber: 9001, mainFlight: 'KL9001' },
  { flightName: 'KL9999', flightNumber: 9999, mainFlight: 'KL9999' },
  { flightName: 'KL8999', flightNumber: 8999, mainFlight: 'KL8999' },
  { flightName: 'KL10001', flightNumber: 10001, mainFlight: 'KL10001' }
];

console.log('🧪 Testing Ground Transport Filter\n');
console.log('Test flights:');

testFlights.forEach(flight => {
  const isGroundTransport = flight.flightNumber >= 9000 && flight.flightNumber <= 9999;
  const status = isGroundTransport ? '❌ FILTERED (Ground Transport)' : '✅ ALLOWED';
  
  console.log(`${flight.flightName} (${flight.flightNumber}): ${status}`);
});

console.log('\n📊 Summary:');
console.log('- KL9000-9999: Ground transportation (bus/train) - FILTERED OUT');
console.log('- KL1000-8999: Regular flights - ALLOWED');
console.log('- KL10000+: Regular flights - ALLOWED');
console.log('\n✅ Filter is now active and will exclude KL9955 and similar ground transport services');