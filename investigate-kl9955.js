console.log('🔍 Investigating KL9955 Flight\n');
console.log('Based on the codebase analysis:\n');

console.log('1. STALE FLIGHT DETECTION:');
console.log('   - KL9960 was filtered as "stale" (updated 2025-07-25, removed due to old timestamp)');
console.log('   - The system removes flights not updated within 24 hours');
console.log('   - KL9955 is likely in the same situation\n');

console.log('2. KL 9XXX FLIGHT NUMBERS:');
console.log('   - Flight numbers in the 9000+ range are often used for:');
console.log('     • Bus services between airports');
console.log('     • Train connections (like Amsterdam-Brussels high-speed rail)');
console.log('     • Special charter or positioning flights');
console.log('     • Code-share flights with other carriers\n');

console.log('3. WHY IT APPEARS STALE:');
console.log('   - These special services may not update as frequently');
console.log('   - They might have different data update patterns than regular flights');
console.log('   - The Schiphol API might not refresh them as often\n');

console.log('4. RECOMMENDATION:');
console.log('   - KL9955 is likely a special transportation service (bus/train)');
console.log('   - It\'s being filtered out due to infrequent updates');
console.log('   - To include it, you would need to:');
console.log('     a) Increase the stale threshold in removeStaleFlights()');
console.log('     b) Add special handling for 9xxx flight numbers');
console.log('     c) Check the serviceType field from the API\n');

console.log('📝 CONCLUSION:');
console.log('KL9955 is most likely a bus or train service that appears "stale"');
console.log('because these ground transportation services don\'t update their');
console.log('status as frequently as regular flights.');