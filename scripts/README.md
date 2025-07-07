# Scripts Directory

This directory contains utility scripts for the FLYR dashboard.

## Gates Terminals Data Example

### `gates-terminals-data-example.js`

This script shows real data examples from the API endpoints used by the busiest gates and terminals page.

**Usage:**
```bash
# Make sure your Next.js server is running first
npm run dev

# In another terminal, run the debug script
npm run debug-gates
```

**What it shows:**
1. **Gates-Terminals Summary Endpoint** (`/api/gates-terminals/summary`)
   - Summary statistics (total gates, terminals, flights, utilization)
   - Pier data with flight counts and utilization
   - Gate data with flight counts and status

2. **Raw Flights Endpoint** (`/api/flights`)
   - Sample flight data with all fields
   - Gate and pier analysis
   - Aircraft type distribution
   - Busiest gates ranking

3. **Aircraft Performance Endpoint** (`/api/aircraft/performance`)
   - Aircraft performance summary
   - Detailed aircraft data with delays and utilization

**Example Output:**
```
🚀 BUSIEST GATES & TERMINALS - REAL DATA EXAMPLES
============================================================
Date: 2025-07-07

📊 1. GATES-TERMINALS SUMMARY ENDPOINT
GET /api/gates-terminals/summary

📈 SUMMARY STATISTICS:
{
  "totalGates": "45",
  "totalTerminals": "6",
  "totalFlights": "369",
  "avgUtilization": "45.2%"
}

🏗️  PIER DATA (Top 3):
Pier 1:
{
  "pier": "D",
  "flights": 156,
  "arrivals": 0,
  "departures": 156,
  "utilization": 78.0,
  "status": "Medium",
  "type": "Schengen",
  "purpose": "Mixed operations"
}
...
```

**Data Structure:**
- **Flight Data**: Contains gate, pier, aircraft type, schedule times, flight states
- **Pier Data**: Aggregated statistics per pier (flights, utilization, status)
- **Gate Data**: Individual gate statistics (flights, status, next flight)
- **Aircraft Data**: Performance metrics per aircraft type (delays, utilization)

This script helps understand exactly what data is available and how it's structured for the busiest gates and terminals page. 