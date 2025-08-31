// Script to display flight numbers with gate changes and delays
// This script shows the flight data structure and example flight numbers

console.log('\n=== FLIGHT GATE CHANGES - EXAMPLE DATA STRUCTURE ===\n');

// Based on the FlightGateChanges component structure
const exampleGateChanges = [
  {
    flightNumber: "KL1001",
    flightName: "KL1001",
    currentGate: "D59",
    pier: "D",
    destination: "LHR",
    aircraftType: "B737",
    scheduleDateTime: "2025-08-30T14:30:00",
    timeUntilDeparture: 45,
    isDelayed: true,
    delayMinutes: 25,
    isPriority: true,
    flightStates: ["GCH", "DEL"],
    flightStatesReadable: ["Gate Change", "Delayed"]
  },
  {
    flightNumber: "KL1423",
    flightName: "KL1423",
    currentGate: "F07",
    pier: "F",
    destination: "BCN",
    aircraftType: "A320",
    scheduleDateTime: "2025-08-30T15:15:00",
    timeUntilDeparture: 90,
    isDelayed: true,
    delayMinutes: 15,
    isPriority: false,
    flightStates: ["GCH", "DEL"],
    flightStatesReadable: ["Gate Change", "Delayed"]
  },
  {
    flightNumber: "KL1665",
    flightName: "KL1665",
    currentGate: "E18",
    pier: "E",
    destination: "MAD",
    aircraftType: "B738",
    scheduleDateTime: "2025-08-30T14:00:00",
    timeUntilDeparture: 15,
    isDelayed: true,
    delayMinutes: 30,
    isPriority: true,
    flightStates: ["GCH", "DEL", "BRD"],
    flightStatesReadable: ["Gate Change", "Delayed", "Boarding"]
  },
  {
    flightNumber: "KL1789",
    flightName: "KL1789",
    currentGate: "G09",
    pier: "G",
    destination: "CDG",
    aircraftType: "E190",
    scheduleDateTime: "2025-08-30T14:45:00",
    timeUntilDeparture: 60,
    isDelayed: false,
    delayMinutes: 0,
    isPriority: true,
    flightStates: ["GCH"],
    flightStatesReadable: ["Gate Change"]
  },
  {
    flightNumber: "KL1847",
    flightName: "KL1847",
    currentGate: "D23",
    pier: "D",
    destination: "VIE",
    aircraftType: "B737",
    scheduleDateTime: "2025-08-30T16:30:00",
    timeUntilDeparture: 165,
    isDelayed: true,
    delayMinutes: 20,
    isPriority: false,
    flightStates: ["GCH", "DEL"],
    flightStatesReadable: ["Gate Change", "Delayed"]
  }
];

console.log('DELAYED FLIGHTS WITH GATE CHANGES:\n');

// Filter for delayed flights that haven't departed
const delayedGateChanges = exampleGateChanges.filter(flight => 
  flight.isDelayed && flight.timeUntilDeparture > 0
);

// Sort by urgency (time until departure)
delayedGateChanges.sort((a, b) => a.timeUntilDeparture - b.timeUntilDeparture);

// Display each flight
delayedGateChanges.forEach((flight, index) => {
  console.log(`${index + 1}. Flight ${flight.flightName} → ${flight.destination}`);
  console.log(`   Gate: ${flight.currentGate} (Pier ${flight.pier})`);
  console.log(`   Aircraft: ${flight.aircraftType}`);
  console.log(`   Delay: ${flight.delayMinutes} minutes`);
  console.log(`   Departs in: ${flight.timeUntilDeparture} minutes`);
  console.log(`   Status: ${flight.flightStatesReadable.join(', ')}`);
  if (flight.isPriority) {
    console.log(`   ⚠️  PRIORITY - Departing within 60 minutes!`);
  }
  console.log('');
});

console.log('\n=== OPERATIONAL SUMMARY ===\n');
console.log(`Total gate changes: ${exampleGateChanges.length}`);
console.log(`Delayed + gate changed: ${delayedGateChanges.length}`);
console.log(`Urgent (< 60 min): ${delayedGateChanges.filter(f => f.isPriority).length}`);
console.log(`Complex issues (3+ states): ${delayedGateChanges.filter(f => f.flightStates.length >= 3).length}`);

// Show all flight numbers with gate changes
console.log('\n=== ALL FLIGHTS WITH GATE CHANGES ===\n');
console.log('Flight Numbers:', exampleGateChanges.map(f => f.flightNumber).join(', '));

console.log('\n=== TYPICAL KLM FLIGHT NUMBER PATTERNS ===\n');
console.log('KL1xxx - European short-haul flights');
console.log('KL2xxx - Regional/partner flights');
console.log('KL3xxx - Codeshare flights');
console.log('KL4xxx - Seasonal/charter flights');
console.log('KL5xx-9xx - Intercontinental flights');

console.log('\n=== COMMON DESTINATIONS ===\n');
console.log('LHR - London Heathrow');
console.log('CDG - Paris Charles de Gaulle');
console.log('BCN - Barcelona');
console.log('MAD - Madrid');
console.log('VIE - Vienna');
console.log('FRA - Frankfurt');
console.log('MUC - Munich');
console.log('FCO - Rome Fiumicino');