import { NextResponse } from 'next/server'
import { fetchSchipholFlights, transformSchipholFlight, filterFlights, removeDuplicateFlights, removeStaleFlights } from '@/lib/schiphol-api'
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
  'ZRH': { name: 'Zurich', country: 'Liechtenstein' }, // Uses Zurich airport
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

    // Calculate destination statistics from flight data (Europe only)
    const destinationStats = calculateDestinationStats(filteredFlights)

    return NextResponse.json(destinationStats)
  } catch (error) {
    console.error('Error fetching destination data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch destination data' },
      { status: 500 }
    )
  }
}

// Calculate destination statistics from flight data (Europe only)
function calculateDestinationStats(flights: any[]) {
  if (flights.length === 0) {
    return {
      summary: {
        activeDestinations: 0,
        totalFlights: 0,
        topCountry: 'N/A',
        avgFlightsPerDestination: 0,
        busiestRoute: 'N/A'
      },
      destinations: []
    }
  }

  // Group flights by destination (Europe only)
  const destinationGroups: Record<string, { flights: any[], name: string, country: string }> = {}

  flights.forEach(flight => {
    // Extract destination from route.destinations
    const destinations = flight.route?.destinations || []
    if (destinations.length > 0) {
      const destinationCode = destinations[0] // First destination
      
      // Only include European destinations
      if (europeanAirports[destinationCode]) {
        const airportInfo = europeanAirports[destinationCode]
        
        if (!destinationGroups[destinationCode]) {
          destinationGroups[destinationCode] = {
            flights: [],
            name: airportInfo.name,
            country: airportInfo.country
          }
        }
        
        destinationGroups[destinationCode].flights.push(flight)
      }
    }
  })

  // Convert to destination format
  const destinations = Object.entries(destinationGroups).map(([code, data]) => ({
    code,
    name: data.name,
    country: data.country,
    flights: data.flights.length,
    status: 'active'
  }))

  // Sort by flight count (descending)
  destinations.sort((a, b) => b.flights - a.flights)

  // Calculate summary statistics
  const totalDestinations = destinations.length
  const totalFlights = destinations.reduce((sum, dest) => sum + dest.flights, 0)
  const avgFlightsPerDestination = totalDestinations > 0 ? Math.round(totalFlights / totalDestinations) : 0
  
  // Find top country (most destinations)
  const countryCounts: Record<string, number> = {}
  destinations.forEach(dest => {
    countryCounts[dest.country] = (countryCounts[dest.country] || 0) + 1
  })
  const topCountry = Object.entries(countryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'
  
  // Find busiest route
  const busiestRoute = destinations.length > 0 ? destinations[0].code : 'N/A'

  return {
    summary: {
      activeDestinations: totalDestinations,
      totalFlights,
      topCountry,
      avgFlightsPerDestination,
      busiestRoute
    },
    destinations: destinations.slice(0, 5) // Return top 5 destinations
  }
} 