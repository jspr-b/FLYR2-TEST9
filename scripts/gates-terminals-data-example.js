#!/usr/bin/env node

/**
 * Example script showing real data from the busiest gates and terminals API endpoints
 * Run with: node scripts/gates-terminals-data-example.js
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = 'http://localhost:3000';
const TODAY = new Date().toISOString().split('T')[0];

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    client.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (error) {
          reject(new Error(`Failed to parse JSON: ${error.message}`));
        }
      });
    }).on('error', reject);
  });
}

async function showDataExamples() {
  console.log('🚀 BUSIEST GATES & TERMINALS - REAL DATA EXAMPLES');
  console.log('=' .repeat(60));
  console.log(`Date: ${TODAY}\n`);

  try {
    // 1. Gates-Terminals Summary Endpoint
    console.log('📊 1. GATES-TERMINALS SUMMARY ENDPOINT');
    console.log('GET /api/gates-terminals/summary\n');
    
    const summaryResponse = await makeRequest(`${BASE_URL}/api/gates-terminals/summary`);
    
    if (summaryResponse.status === 200) {
      const { summary, pierData, gateData } = summaryResponse.data;
      
      console.log('📈 SUMMARY STATISTICS:');
      console.log(JSON.stringify(summary, null, 2));
      
      console.log('\n🏗️  PIER DATA (Top 3):');
      pierData.slice(0, 3).forEach((pier, index) => {
        console.log(`\nPier ${index + 1}:`);
        console.log(JSON.stringify(pier, null, 2));
      });
      
      console.log('\n🚪 GATE DATA (Top 3):');
      gateData.slice(0, 3).forEach((gate, index) => {
        console.log(`\nGate ${index + 1}:`);
        console.log(JSON.stringify(gate, null, 2));
      });
    } else {
      console.log('❌ Error:', summaryResponse.data);
    }

    console.log('\n' + '='.repeat(60));

    // 2. Raw Flights Endpoint
    console.log('\n✈️  2. RAW FLIGHTS ENDPOINT');
    const filters = encodeURIComponent(JSON.stringify({
      flightDirection: 'D',
      scheduleDate: TODAY,
      isOperationalFlight: true,
      prefixicao: 'KL'
    }));
    
    console.log(`GET /api/flights?filters=${filters}\n`);
    
    const flightsResponse = await makeRequest(`${BASE_URL}/api/flights?filters=${filters}`);
    
    if (flightsResponse.status === 200) {
      const { flights } = flightsResponse.data;
      
      console.log(`📊 TOTAL FLIGHTS: ${flights.length}\n`);
      
      console.log('✈️  SAMPLE FLIGHT DATA (First 2 flights):');
      flights.slice(0, 2).forEach((flight, index) => {
        console.log(`\nFlight ${index + 1}:`);
        console.log(JSON.stringify(flight, null, 2));
      });
      
      // Gate and Pier Analysis
      const gates = new Set(flights.filter(f => f.gate).map(f => f.gate));
      const piers = new Set(flights.filter(f => f.pier).map(f => f.pier));
      
      console.log('\n📊 GATE & PIER ANALYSIS:');
      console.log(`Unique Gates: ${gates.size}`);
      console.log(`Unique Piers: ${piers.size}`);
      
      // Count flights per pier
      const pierCounts = flights.reduce((acc, flight) => {
        if (flight.pier) {
          acc[flight.pier] = (acc[flight.pier] || 0) + 1;
        }
        return acc;
      }, {});
      
      console.log('\n🏗️  FLIGHTS PER PIER:');
      Object.entries(pierCounts)
        .sort(([,a], [,b]) => b - a)
        .forEach(([pier, count]) => {
          console.log(`  ${pier}: ${count} flights`);
        });
      
      // Count flights per gate
      const gateCounts = flights.reduce((acc, flight) => {
        if (flight.gate) {
          acc[flight.gate] = (acc[flight.gate] || 0) + 1;
        }
        return acc;
      }, {});
      
      console.log('\n🚪 TOP 5 BUSIEST GATES:');
      Object.entries(gateCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .forEach(([gate, count]) => {
          console.log(`  ${gate}: ${count} flights`);
        });
      
      // Aircraft types
      const aircraftCounts = flights.reduce((acc, flight) => {
        const type = flight.aircraftType?.iataMain || flight.aircraftType?.iataSub || 'Unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});
      
      console.log('\n🛩️  AIRCRAFT TYPES:');
      Object.entries(aircraftCounts)
        .sort(([,a], [,b]) => b - a)
        .forEach(([type, count]) => {
          console.log(`  ${type}: ${count} flights`);
        });
        
    } else {
      console.log('❌ Error:', flightsResponse.data);
    }

    console.log('\n' + '='.repeat(60));

    // 3. Aircraft Performance Endpoint
    console.log('\n📊 3. AIRCRAFT PERFORMANCE ENDPOINT');
    console.log('GET /api/aircraft/performance\n');
    
    const aircraftResponse = await makeRequest(`${BASE_URL}/api/aircraft/performance`);
    
    if (aircraftResponse.status === 200) {
      const { summary, chartData } = aircraftResponse.data;
      
      console.log('📈 AIRCRAFT PERFORMANCE SUMMARY:');
      console.log(JSON.stringify(summary, null, 2));
      
      console.log('\n🛩️  AIRCRAFT PERFORMANCE DETAILS (Top 2):');
      chartData.slice(0, 2).forEach((aircraft, index) => {
        console.log(`\nAircraft ${index + 1}:`);
        console.log(JSON.stringify(aircraft, null, 2));
      });
      
    } else {
      console.log('❌ Error:', aircraftResponse.data);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ All endpoints tested successfully!');

  } catch (error) {
    console.error('❌ Script error:', error.message);
    console.log('\n💡 Make sure your Next.js server is running on localhost:3000');
    console.log('   Run: npm run dev');
  }
}

// Run the script
if (require.main === module) {
  showDataExamples();
}

module.exports = { showDataExamples }; 