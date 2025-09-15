const fs = require('fs');
const path = require('path');

// Function to search for cancelled flights in log files
function searchForCancelledFlights() {
  console.log('🔍 Searching for cancelled flights in the system...\n');
  
  // Check dev.log if it exists
  const devLogPath = path.join(__dirname, 'dev.log');
  if (fs.existsSync(devLogPath)) {
    console.log('📄 Checking dev.log...');
    const logContent = fs.readFileSync(devLogPath, 'utf8');
    
    // Search for CNX state (cancelled) or related patterns
    const lines = logContent.split('\n');
    const cancelledPatterns = ['CNX', 'Cancelled', 'cancelled', 'CANCELLED'];
    const foundCancellations = [];
    
    lines.forEach((line, index) => {
      cancelledPatterns.forEach(pattern => {
        if (line.includes(pattern) && line.includes('flight')) {
          foundCancellations.push({
            lineNumber: index + 1,
            content: line.trim(),
            pattern: pattern
          });
        }
      });
    });
    
    if (foundCancellations.length > 0) {
      console.log(`\n❌ Found ${foundCancellations.length} references to cancelled flights:\n`);
      foundCancellations.forEach(item => {
        console.log(`Line ${item.lineNumber}: ${item.content.substring(0, 150)}...`);
      });
    } else {
      console.log('✅ No cancelled flights found in dev.log');
    }
  } else {
    console.log('⚠️  dev.log file not found');
  }
  
  // Check for any JSON data files
  console.log('\n📁 Checking for data files...');
  const dataFiles = fs.readdirSync(__dirname).filter(file => 
    file.endsWith('.json') || file.includes('data')
  );
  
  if (dataFiles.length > 0) {
    console.log(`Found ${dataFiles.length} potential data files:`, dataFiles);
  }
  
  // Summary
  console.log('\n📊 SUMMARY:');
  console.log('To get real-time cancelled flight data, you need to:');
  console.log('1. Start the development server: npm run dev');
  console.log('2. The API will fetch live data from Schiphol Airport');
  console.log('3. Run: node check-cancelled-flights-today.js');
  console.log('\nThe API endpoint filters flights with CNX (cancelled) status.');
}

// Run the search
searchForCancelledFlights();