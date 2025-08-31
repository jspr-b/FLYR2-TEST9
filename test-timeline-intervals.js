// Test script to verify timeline interval calculations

function testTimelineIntervals() {
  // Simulate the rounding functions
  const roundDown30 = (date) => {
    const d = new Date(date)
    const minutes = d.getMinutes()
    
    // Reset seconds and milliseconds
    d.setSeconds(0, 0)
    
    // Round minutes down to 0 or 30
    if (minutes < 30) {
      d.setMinutes(0)
    } else {
      d.setMinutes(30)
    }
    
    return d
  }
  
  const roundUp30 = (date) => {
    const d = new Date(date)
    const minutes = d.getMinutes()
    
    // Reset seconds and milliseconds
    d.setSeconds(0, 0)
    
    // Round minutes up to 0 or 30
    if (minutes === 0) {
      // Already on the hour
      return d
    } else if (minutes <= 30) {
      d.setMinutes(30)
    } else {
      // Go to next hour
      d.setHours(d.getHours() + 1)
      d.setMinutes(0)
    }
    
    return d
  }
  
  // Test with current time around 17:09
  const testTime = new Date('2025-08-30T17:09:36+02:00')
  console.log('Test time:', testTime.toISOString())
  console.log('Test time local:', testTime.toLocaleString())
  
  // Create a timeline range
  const effectiveStart = new Date(testTime.getTime() - (2 * 60 * 60 * 1000)) // 2 hours before
  const effectiveEnd = new Date(testTime.getTime() + (4 * 60 * 60 * 1000)) // 4 hours after
  
  console.log('\nBefore rounding:')
  console.log('Start:', effectiveStart.toLocaleTimeString())
  console.log('End:', effectiveEnd.toLocaleTimeString())
  
  const startTime = roundDown30(effectiveStart)
  const endTime = roundUp30(effectiveEnd)
  
  console.log('\nAfter rounding:')
  console.log('Start:', startTime.toLocaleTimeString(), `(minutes: ${startTime.getMinutes()})`)
  console.log('End:', endTime.toLocaleTimeString(), `(minutes: ${endTime.getMinutes()})`)
  
  // Generate time slots
  const slots = []
  const totalMinutes = Math.ceil((endTime.getTime() - startTime.getTime()) / (60 * 1000))
  const intervalMinutes = 30
  const totalIntervals = Math.ceil(totalMinutes / intervalMinutes)
  
  console.log('\nSlot generation:')
  console.log('Total minutes:', totalMinutes)
  console.log('Total intervals:', totalIntervals)
  
  for (let i = 0; i <= totalIntervals; i++) {
    const slotTime = new Date(startTime.getTime() + (i * intervalMinutes * 60 * 1000))
    slots.push(slotTime)
  }
  
  console.log('\nGenerated time slots:')
  slots.forEach((slot, i) => {
    if (i < 10 || i >= slots.length - 3) {
      console.log(`Slot ${i}: ${slot.toLocaleTimeString()} (minutes: ${slot.getMinutes()})`)
    } else if (i === 10) {
      console.log('...')
    }
  })
  
  // Check if all slots are on 00 or 30 minute marks
  const invalidSlots = slots.filter(s => s.getMinutes() !== 0 && s.getMinutes() !== 30)
  if (invalidSlots.length > 0) {
    console.log('\n❌ INVALID SLOTS FOUND:')
    invalidSlots.forEach(s => console.log(s.toLocaleTimeString()))
  } else {
    console.log('\n✅ All slots are on 00 or 30 minute marks')
  }
}

testTimelineIntervals()