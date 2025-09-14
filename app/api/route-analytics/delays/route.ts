import { NextResponse } from 'next/server'
import { fetchSchipholFlights, transformSchipholFlight, filterFlights, removeDuplicateFlights, removeStaleFlights } from '@/lib/schiphol-api'
import { calculateDelayMinutes } from '@/lib/timezone-utils'
import { getAmsterdamDateString } from '@/lib/amsterdam-time'

// European airport mapping with country information
const europeanAirports: Record<string, { name: string, country: string }> = {
  // UK
  'LHR': { name: 'London Heathrow', country: 'United Kingdom' },
  'LCY': { name: 'London City', country: 'United Kingdom' },
  'LGW': { name: 'London Gatwick', country: 'United Kingdom' },
  'STN': { name: 'London Stansted', country: 'United Kingdom' },
  'MAN': { name: 'Manchester', country: 'United Kingdom' },
  'BHX': { name: 'Birmingham', country: 'United Kingdom' },
  'EDI': { name: 'Edinburgh', country: 'United Kingdom' },
  'BRS': { name: 'Bristol', country: 'United Kingdom' },
  'NCL': { name: 'Newcastle', country: 'United Kingdom' },
  'LPL': { name: 'Liverpool', country: 'United Kingdom' },
  
  // Germany
  'FRA': { name: 'Frankfurt', country: 'Germany' },
  'MUC': { name: 'Munich', country: 'Germany' },
  'BER': { name: 'Berlin Brandenburg', country: 'Germany' },
  'DUS': { name: 'Düsseldorf', country: 'Germany' },
  'HAM': { name: 'Hamburg', country: 'Germany' },
  'CGN': { name: 'Cologne', country: 'Germany' },
  'STR': { name: 'Stuttgart', country: 'Germany' },
  'NUE': { name: 'Nuremberg', country: 'Germany' },
  'LEJ': { name: 'Leipzig', country: 'Germany' },
  'DRS': { name: 'Dresden', country: 'Germany' },
  
  // France
  'CDG': { name: 'Paris Charles de Gaulle', country: 'France' },
  'ORY': { name: 'Paris Orly', country: 'France' },
  'NCE': { name: 'Nice', country: 'France' },
  'LYS': { name: 'Lyon', country: 'France' },
  'MRS': { name: 'Marseille', country: 'France' },
  'TLS': { name: 'Toulouse', country: 'France' },
  'BOD': { name: 'Bordeaux', country: 'France' },
  'NTE': { name: 'Nantes', country: 'France' },
  'LIL': { name: 'Lille', country: 'France' },
  'BSL': { name: 'Basel-Mulhouse', country: 'France' },
  
  // Spain
  'MAD': { name: 'Madrid Barajas', country: 'Spain' },
  'BCN': { name: 'Barcelona', country: 'Spain' },
  'PMI': { name: 'Palma de Mallorca', country: 'Spain' },
  'AGP': { name: 'Malaga', country: 'Spain' },
  'ALC': { name: 'Alicante', country: 'Spain' },
  'IBZ': { name: 'Ibiza', country: 'Spain' },
  'VLC': { name: 'Valencia', country: 'Spain' },
  'BIO': { name: 'Bilbao', country: 'Spain' },
  'SVQ': { name: 'Seville', country: 'Spain' },
  'GRX': { name: 'Granada', country: 'Spain' },
  
  // Italy
  'FCO': { name: 'Rome Fiumicino', country: 'Italy' },
  'MXP': { name: 'Milan Malpensa', country: 'Italy' },
  'LIN': { name: 'Milan Linate', country: 'Italy' },
  'BGY': { name: 'Milan Bergamo', country: 'Italy' },
  'VCE': { name: 'Venice', country: 'Italy' },
  'NAP': { name: 'Naples', country: 'Italy' },
  'PSA': { name: 'Pisa', country: 'Italy' },
  'BLQ': { name: 'Bologna', country: 'Italy' },
  'TRN': { name: 'Turin', country: 'Italy' },
  'CAG': { name: 'Cagliari', country: 'Italy' },
  
  // Netherlands
  'AMS': { name: 'Amsterdam Schiphol', country: 'Netherlands' },
  'EIN': { name: 'Eindhoven', country: 'Netherlands' },
  'RTM': { name: 'Rotterdam', country: 'Netherlands' },
  'GRQ': { name: 'Groningen', country: 'Netherlands' },
  'MST': { name: 'Maastricht', country: 'Netherlands' },
  
  // Switzerland
  'ZRH': { name: 'Zurich', country: 'Switzerland' },
  'GVA': { name: 'Geneva', country: 'Switzerland' },
  'BSL': { name: 'Basel', country: 'Switzerland' },
  'BRN': { name: 'Bern', country: 'Switzerland' },
  'LUG': { name: 'Lugano', country: 'Switzerland' },
  
  // Austria
  'VIE': { name: 'Vienna', country: 'Austria' },
  'SZG': { name: 'Salzburg', country: 'Austria' },
  'INN': { name: 'Innsbruck', country: 'Austria' },
  'GRZ': { name: 'Graz', country: 'Austria' },
  'KLU': { name: 'Klagenfurt', country: 'Austria' },
  
  // Scandinavia
  'CPH': { name: 'Copenhagen', country: 'Denmark' },
  'ARN': { name: 'Stockholm Arlanda', country: 'Sweden' },
  'OSL': { name: 'Oslo', country: 'Norway' },
  'HEL': { name: 'Helsinki', country: 'Finland' },
  'GOT': { name: 'Gothenburg', country: 'Sweden' },
  'BLL': { name: 'Billund', country: 'Denmark' },
  'AAL': { name: 'Aalborg', country: 'Denmark' },
  'TRD': { name: 'Trondheim', country: 'Norway' },
  'BGO': { name: 'Bergen', country: 'Norway' },
  'TOS': { name: 'Tromsø', country: 'Norway' },
  
  // Ireland
  'DUB': { name: 'Dublin', country: 'Ireland' },
  'SNN': { name: 'Shannon', country: 'Ireland' },
  'ORK': { name: 'Cork', country: 'Ireland' },
  'NOC': { name: 'Knock', country: 'Ireland' },
  
  // Belgium
  'BRU': { name: 'Brussels', country: 'Belgium' },
  'CRL': { name: 'Charleroi', country: 'Belgium' },
  'ANR': { name: 'Antwerp', country: 'Belgium' },
  
  // Portugal
  'LIS': { name: 'Lisbon', country: 'Portugal' },
  'OPO': { name: 'Porto', country: 'Portugal' },
  'FAO': { name: 'Faro', country: 'Portugal' },
  'FNC': { name: 'Funchal', country: 'Portugal' },
  
  // Greece
  'ATH': { name: 'Athens', country: 'Greece' },
  'SKG': { name: 'Thessaloniki', country: 'Greece' },
  'HER': { name: 'Heraklion', country: 'Greece' },
  'RHO': { name: 'Rhodes', country: 'Greece' },
  'CHQ': { name: 'Chania', country: 'Greece' },
  
  // Poland
  'WAW': { name: 'Warsaw', country: 'Poland' },
  'KRK': { name: 'Krakow', country: 'Poland' },
  'GDN': { name: 'Gdańsk', country: 'Poland' },
  'WRO': { name: 'Wrocław', country: 'Poland' },
  'POZ': { name: 'Poznań', country: 'Poland' },
  
  // Czech Republic
  'PRG': { name: 'Prague', country: 'Czech Republic' },
  'BRQ': { name: 'Brno', country: 'Czech Republic' },
  'OSR': { name: 'Ostrava', country: 'Czech Republic' },
  
  // Hungary
  'BUD': { name: 'Budapest', country: 'Hungary' },
  'DEB': { name: 'Debrecen', country: 'Hungary' },
  
  // Romania
  'OTP': { name: 'Bucharest', country: 'Romania' },
  'CLJ': { name: 'Cluj-Napoca', country: 'Romania' },
  'IAS': { name: 'Iași', country: 'Romania' },
  
  // Bulgaria
  'SOF': { name: 'Sofia', country: 'Bulgaria' },
  'VAR': { name: 'Varna', country: 'Bulgaria' },
  'BOJ': { name: 'Burgas', country: 'Bulgaria' },
  
  // Croatia
  'ZAG': { name: 'Zagreb', country: 'Croatia' },
  'SPU': { name: 'Split', country: 'Croatia' },
  'DBV': { name: 'Dubrovnik', country: 'Croatia' },
  
  // Slovenia
  'LJU': { name: 'Ljubljana', country: 'Slovenia' },
  'MBX': { name: 'Maribor', country: 'Slovenia' },
  
  // Slovakia
  'BTS': { name: 'Bratislava', country: 'Slovakia' },
  'KSC': { name: 'Košice', country: 'Slovakia' },
  
  // Lithuania
  'VNO': { name: 'Vilnius', country: 'Lithuania' },
  'KUN': { name: 'Kaunas', country: 'Lithuania' },
  
  // Latvia
  'RIX': { name: 'Riga', country: 'Latvia' },
  
  // Estonia
  'TLL': { name: 'Tallinn', country: 'Estonia' },
  
  // Iceland
  'KEF': { name: 'Reykjavik', country: 'Iceland' },
  'AEY': { name: 'Akureyri', country: 'Iceland' },
  
  // Malta
  'MLA': { name: 'Malta', country: 'Malta' },
  
  // Cyprus
  'LCA': { name: 'Larnaca', country: 'Cyprus' },
  'PFO': { name: 'Paphos', country: 'Cyprus' },
  
  // Luxembourg
  'LUX': { name: 'Luxembourg', country: 'Luxembourg' },
  
  // Monaco
  'MCM': { name: 'Monaco', country: 'Monaco' },
  
  // Andorra
  'ALV': { name: 'Andorra', country: 'Andorra' },
  
  // San Marino
  'SAI': { name: 'San Marino', country: 'San Marino' },
  
  // Vatican City
  'VAT': { name: 'Vatican City', country: 'Vatican City' },
  
  // Liechtenstein
  // Note: Liechtenstein uses Zurich airport (ZRH) which is already defined for Switzerland
}

export async function GET() {
  try {
    // Get today's date in Amsterdam timezone (YYYY-MM-DD)
    const today = getAmsterdamDateString()

    // Prepare Schiphol API configuration for KLM departures
    const apiConfig = {
      flightDirection: 'D' as const,
      airline: 'KL',
      scheduleDate: today,
      fetchAllPages: true
    }

    // Fetch flights from Schiphol API (same as /api/flights)
    const schipholData = await fetchSchipholFlights(apiConfig)
    const allFlights = (schipholData.flights || []).map(transformSchipholFlight)

    // Apply the same filters and deduplication as /api/flights
    const filters = {
      flightDirection: 'D' as const,
      scheduleDate: today,
      isOperationalFlight: true,
      prefixicao: 'KL'
    }
    let filteredFlights = filterFlights(allFlights, filters)
    filteredFlights = removeDuplicateFlights(filteredFlights)
    filteredFlights = removeStaleFlights(filteredFlights, 24) // Remove flights older than 24 hours

    // Calculate route delay statistics from flight data (Europe only)
    const routeDelays = calculateRouteDelays(filteredFlights)

    return NextResponse.json(routeDelays)
  } catch (error) {
    console.error('Error fetching route delay data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch route delay data' },
      { status: 500 }
    )
  }
}

// Calculate route delay statistics from flight data (Europe only)
function calculateRouteDelays(flights: any[]) {
  if (flights.length === 0) {
    return {
      routes: []
    }
  }

  // Group flights by destination (Europe only)
  const routeGroups: Record<string, { flights: any[], name: string }> = {}

  flights.forEach(flight => {
    // Extract destination from route.destinations
    const destinations = flight.route?.destinations || []
    if (destinations.length > 0) {
      const destinationCode = destinations[0] // First destination
      
      // Only include European destinations
      if (europeanAirports[destinationCode]) {
        const airportInfo = europeanAirports[destinationCode]
        
        if (!routeGroups[destinationCode]) {
          routeGroups[destinationCode] = {
            flights: [],
            name: airportInfo.name
          }
        }
        
        routeGroups[destinationCode].flights.push(flight)
      }
    }
  })

  // Calculate route delay statistics for each route
  const routes = Object.entries(routeGroups).map(([code, data]) => {
    const totalFlights = data.flights.length

    // Calculate delays and collect extra info for each flight
    const delays = data.flights.map(flight => {
      // Use actual off-block time if available, otherwise estimated time
      const actualTime = flight.actualOffBlockTime || flight.publicEstimatedOffBlockTime || flight.scheduleDateTime
      const delayMinutes = calculateDelayMinutes(
        flight.scheduleDateTime,
        actualTime
      )
      const flightState = flight.publicFlightState?.flightStates?.[0] || 'UNKNOWN'
      return {
        flight,
        delayMinutes,
        isOnTime: delayMinutes <= 0,
        scheduleDateTime: flight.scheduleDateTime,
        flightName: flight.flightName,
        flightState
      }
    })

    // Count departed flights (DEP state)
    const departedFlights = delays.filter(d => d.flightState === 'DEP').length

    // Median delay
    const sortedDelays = delays.map(d => d.delayMinutes).sort((a, b) => a - b)
    let medianDelay = 0
    if (sortedDelays.length > 0) {
      const mid = Math.floor(sortedDelays.length / 2)
      medianDelay = sortedDelays.length % 2 !== 0
        ? sortedDelays[mid]
        : (sortedDelays[mid - 1] + sortedDelays[mid]) / 2
    }

    // % delayed > 15 min
    const delayedOver15 = delays.filter(d => d.delayMinutes > 15).length
    const percentDelayedOver15 = totalFlights > 0 ? Math.round((delayedOver15 / totalFlights) * 1000) / 10 : 0

    // Earliest/latest departure
    const sortedByTime = delays
      .map(d => d.scheduleDateTime)
      .filter(Boolean)
      .sort()
    const earliestDeparture = sortedByTime[0] || null
    const latestDeparture = sortedByTime[sortedByTime.length - 1] || null

    // Flight numbers (return all)
    const flightNumbers = Array.from(new Set(delays.map(d => d.flightName))).filter(Boolean)

    const onTimeFlights = delays.filter(d => d.isOnTime).length
    const delayedFlights = delays.filter(d => !d.isOnTime).length
    const avgDelay = delays.length > 0
      ? delays.reduce((sum, d) => sum + d.delayMinutes, 0) / delays.length
      : 0
    const maxDelay = delays.length > 0
      ? Math.max(...delays.map(d => d.delayMinutes))
      : 0
    const onTimePercentage = totalFlights > 0
      ? (onTimeFlights / totalFlights) * 100
      : 0

    return {
      destination: code,
      destinationName: data.name,
      totalFlights,
      departedFlights, // NEW: Count of flights that have departed
      onTimeFlights,
      delayedFlights,
      avgDelay: Math.round(avgDelay * 10) / 10, // Round to 1 decimal
      maxDelay: Math.round(maxDelay),
      onTimePercentage: Math.round(onTimePercentage * 10) / 10, // Round to 1 decimal
      medianDelay: Math.round(medianDelay * 10) / 10,
      percentDelayedOver15,
      earliestDeparture,
      latestDeparture,
      flightNumbers
    }
  })

  // Sort by total flights (descending)
  routes.sort((a, b) => b.totalFlights - a.totalFlights)

  return {
    routes: routes.slice(0, 15) // Return top 15 routes by flight volume
  }
} 