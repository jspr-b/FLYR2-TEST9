// Script to find delayed flights with gate changes that need to depart

async function findDelayedGateChanges() {
  try {
    // Fetch the dashboard data with gate changes
    const response = await fetch('http://localhost:3000/api/dashboard-data?includeGateChanges=true');
    const data = await response.json();
    
    console.log('\n=== DELAYED FLIGHTS WITH GATE CHANGES (GCH) ===\n');
    
    if (!data.gateChanges || data.gateChanges.length === 0) {
      console.log('No gate changes found in the current data.');
      return;
    }
    
    // Filter for delayed flights with gate changes that haven't departed yet
    const delayedGateChanges = data.gateChanges.filter(flight => {
      return flight.isDelayed && flight.timeUntilDeparture > 0;
    });
    
    console.log(`Found ${delayedGateChanges.length} delayed flights with gate changes:\n`);
    
    // Sort by time until departure (most urgent first)
    delayedGateChanges.sort((a, b) => a.timeUntilDeparture - b.timeUntilDeparture);
    
    // Display each flight
    delayedGateChanges.forEach((flight, index) => {
      console.log(`${index + 1}. Flight ${flight.flightName} to ${flight.destination}`);
      console.log(`   Current Gate: ${flight.currentGate} (Pier ${flight.pier})`);
      console.log(`   Delay: ${flight.delayMinutes} minutes`);
      console.log(`   Time until departure: ${formatTime(flight.timeUntilDeparture)}`);
      console.log(`   Status: ${flight.flightStatesReadable.join(', ')}`);
      if (flight.isPriority) {
        console.log(`   ⚠️  PRIORITY - Departing within 60 minutes!`);
      }
      console.log('');
    });
    
    // Summary statistics
    console.log('\n=== OPERATIONAL IMPACT SUMMARY ===\n');
    console.log(`Total gate changes: ${data.gateChanges.length}`);
    console.log(`Delayed + gate changed: ${delayedGateChanges.length}`);
    console.log(`Urgent (< 60 min): ${delayedGateChanges.filter(f => f.isPriority).length}`);
    console.log(`Complex issues (multiple states): ${delayedGateChanges.filter(f => f.flightStates.length > 1).length}`);
    
    // Pier distribution
    const pierStats = {};
    delayedGateChanges.forEach(flight => {
      if (!pierStats[flight.pier]) pierStats[flight.pier] = 0;
      pierStats[flight.pier]++;
    });
    
    console.log('\nAffected piers:');
    Object.entries(pierStats).forEach(([pier, count]) => {
      console.log(`  Pier ${pier}: ${count} flights`);
    });
    
    // Point system explanation
    console.log('\n=== POINT SYSTEM / PRIORITIZATION ===\n');
    console.log('Flights are prioritized based on:');
    console.log('1. Time until departure (< 60 minutes = PRIORITY/SOON tag)');
    console.log('2. Delay status (shows delay in minutes)');
    console.log('3. Operational complexity (multiple states like GCH + DEL)');
    console.log('\nVisual indicators:');
    console.log('- SOON tag (amber): Flight departing within 60 minutes');
    console.log('- Delay tag (orange): Shows actual delay in minutes');
    console.log('- Progress bar: Visual countdown to departure');
    console.log('- Multiple Issues: Flights with gate change + delays or other states');
    
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

function formatTime(minutes) {
  if (minutes < 0) return 'Departed';
  if (minutes < 60) return `${minutes} minutes`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

// Run the query
findDelayedGateChanges();