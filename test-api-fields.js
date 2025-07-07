const SCHIPHOL_API_BASE = 'https://api.schiphol.nl/public-flights'
const SCHIPHOL_APP_ID = 'cfcad115'
const SCHIPHOL_APP_KEY = 'bf01b2f53e73e9db0115b8f2093c97b9'

async function testSchipholAPI() {
  try {
    const params = new URLSearchParams()
    params.append('airline', 'KL')
    params.append('page', '0')
    
    const apiUrl = `${SCHIPHOL_API_BASE}/flights?${params.toString()}`
    console.log('Fetching from:', apiUrl)
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'app_id': SCHIPHOL_APP_ID,
        'app_key': SCHIPHOL_APP_KEY,
        'ResourceVersion': 'v4'
      }
    })

    if (!response.ok) {
      console.error('API Error:', response.status, response.statusText)
      return
    }

    const data = await response.json()
    const flights = data.flights || []
    
    console.log(`Found ${flights.length} flights`)
    
    if (flights.length > 0) {
      console.log('\n=== FIRST FLIGHT FIELDS ===')
      console.log('All keys:', Object.keys(flights[0]))
      
      console.log('\n=== FIRST FLIGHT DATA ===')
      console.log(JSON.stringify(flights[0], null, 2))
      
      console.log('\n=== CARRIER-RELATED FIELDS ===')
      const flight = flights[0]
      Object.keys(flight).forEach(key => {
        if (key.toLowerCase().includes('carrier') || 
            key.toLowerCase().includes('airline') || 
            key.toLowerCase().includes('operator')) {
          console.log(`${key}:`, flight[key])
        }
      })
      
      console.log('\n=== FLIGHT NAME ANALYSIS ===')
      console.log('flightName:', flight.flightName)
      console.log('flightNumber:', flight.flightNumber)
      
      // Check for any nested objects that might contain carrier info
      console.log('\n=== NESTED OBJECTS ===')
      Object.keys(flight).forEach(key => {
        if (typeof flight[key] === 'object' && flight[key] !== null) {
          console.log(`${key}:`, JSON.stringify(flight[key], null, 2))
        }
      })
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
}

testSchipholAPI() 