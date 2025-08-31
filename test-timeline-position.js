// Test script to check timeline position calculation

// Simulate the timeline calculation
function testTimelinePosition() {
  // Current time (around 15:25)
  const now = new Date('2025-08-30T15:25:00+02:00');
  
  // Timeline start (15:00)
  const startTime = new Date('2025-08-30T15:00:00+02:00');
  
  // Timeline end (21:00) 
  const endTime = new Date('2025-08-30T21:00:00+02:00');
  
  const totalDuration = endTime.getTime() - startTime.getTime();
  const currentOffset = now.getTime() - startTime.getTime();
  
  const position = (currentOffset / totalDuration) * 100;
  
  console.log('Timeline Position Calculation:');
  console.log('Current Time:', now.toLocaleTimeString('en-US', { hour12: false }));
  console.log('Start Time:', startTime.toLocaleTimeString('en-US', { hour12: false }));
  console.log('End Time:', endTime.toLocaleTimeString('en-US', { hour12: false }));
  console.log('Total Duration (hours):', totalDuration / (1000 * 60 * 60));
  console.log('Current Offset (minutes):', currentOffset / (1000 * 60));
  console.log('Position:', position + '%');
  console.log('\nExpected: ~6.94% (25 minutes into a 6-hour timeline)');
  
  // Check what happens if we accidentally use wrong timezone
  const wrongNow = new Date('2025-08-30T15:25:00'); // No timezone = UTC
  const wrongOffset = wrongNow.getTime() - startTime.getTime();
  const wrongPosition = (wrongOffset / totalDuration) * 100;
  
  console.log('\nIf timezone is wrong:');
  console.log('Wrong offset (minutes):', wrongOffset / (1000 * 60));
  console.log('Wrong position:', wrongPosition + '%');
}

testTimelinePosition();