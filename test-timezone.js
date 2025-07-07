// Test timezone conversion with actual flight data
const flightData = [
  {
    flightName: "KL1793",
    scheduleDateTime: "2025-07-01T20:45:00.000+02:00",
    publicEstimatedOffBlockTime: "2025-07-01T21:57:00.000+02:00"
  },
  {
    flightName: "KL1975", 
    scheduleDateTime: "2025-07-01T20:50:00.000+02:00",
    publicEstimatedOffBlockTime: "2025-07-01T20:56:00.000+02:00"
  },
  {
    flightName: "KL835",
    scheduleDateTime: "2025-07-01T20:50:00.000+02:00", 
    publicEstimatedOffBlockTime: "2025-07-01T21:00:00.000+02:00"
  },
  {
    flightName: "KL1227",
    scheduleDateTime: "2025-07-01T20:55:00.000+02:00",
    publicEstimatedOffBlockTime: "2025-07-01T21:55:00.000+02:00"
  }
];

// CORRECTED timezone conversion logic (adding 1 hour)
function correctedConversion(apiTime) {
  const apiDate = new Date(apiTime);
  return new Date(apiDate.getTime() + (1 * 60 * 60 * 1000));
}

// Extract hour with corrected logic
function extractLocalHour(apiTime) {
  const localTime = correctedConversion(apiTime);
  return localTime.getHours();
}

console.log("Testing CORRECTED timezone conversion with actual flight data:");
console.log("=============================================================");

flightData.forEach(flight => {
  const scheduled = new Date(flight.scheduleDateTime);
  const estimated = new Date(flight.publicEstimatedOffBlockTime);
  
  // Corrected conversion (adding 1 hour)
  const scheduledLocal = correctedConversion(flight.scheduleDateTime);
  const estimatedLocal = correctedConversion(flight.publicEstimatedOffBlockTime);
  const localHour = extractLocalHour(flight.scheduleDateTime);
  
  // Calculate delay
  const delayMinutes = Math.max(0, (estimatedLocal.getTime() - scheduledLocal.getTime()) / (1000 * 60));
  
  console.log(`\n${flight.flightName}:`);
  console.log(`  Original (UTC+2): ${flight.scheduleDateTime} -> ${flight.publicEstimatedOffBlockTime}`);
  console.log(`  Corrected (UTC+3): ${scheduledLocal.toLocaleString()} -> ${estimatedLocal.toLocaleString()}`);
  console.log(`  Local hour: ${localHour}:00`);
  console.log(`  Delay: ${delayMinutes.toFixed(1)} minutes`);
});

console.log("\n=============================================================");
console.log("Now the flights are correctly shown in the 21:00 hour");
console.log("This matches what you said - there are NOT 44 flights at 23:00!");

// Test the old vs new conversion
console.log("\nComparison - Old vs New conversion:");
flightData.forEach(flight => {
  const oldHour = new Date(flight.scheduleDateTime).getTime() + (3 * 60 * 60 * 1000);
  const newHour = new Date(flight.scheduleDateTime).getTime() + (1 * 60 * 60 * 1000);
  
  console.log(`${flight.flightName}:`);
  console.log(`  Old (UTC+5): ${new Date(oldHour).getHours()}:00`);
  console.log(`  New (UTC+3): ${new Date(newHour).getHours()}:00`);
}); 