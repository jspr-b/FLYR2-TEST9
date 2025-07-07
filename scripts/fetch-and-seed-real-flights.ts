import dbConnect from '../lib/mongodb'
import Flight from '../models/Flight'
import fetch from 'node-fetch'

require('dotenv').config()

async function fetchSchipholFlights() {
  const today = new Date()
  const yyyy = today.getFullYear()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')
  const dateStr = `${yyyy}-${mm}-${dd}`

  let allFlights: any[] = []
  let page = 0
  let hasMore = true

  while (hasMore) {
    const url = `https://api.schiphol.nl/public-flights/flights?flightDirection=D&airline=KL&scheduleDate=${dateStr}&page=${page}`
    const response = await fetch(url, {
      headers: {
        'app_id': process.env.SCHIPHOL_APP_ID || '',
        'app_key': process.env.SCHIPHOL_APP_KEY || '',
        'ResourceVersion': 'v4',
        'Accept': 'application/json',
      },
    })
    if (!response.ok) break
    const data = await response.json()
    if (!data.flights || data.flights.length === 0) break
    allFlights = allFlights.concat(data.flights)
    page++
    if (data.flights.length < 20) hasMore = false
  }
  return allFlights
}

function transformSchipholFlight(f: any) {
  return {
    flightName: f.flightName || '',
    flightNumber: parseInt(f.flightNumber) || 0,
    flightDirection: f.flightDirection || 'D',
    scheduleDateTime: f.scheduleDateTime ? new Date(f.scheduleDateTime) : new Date(),
    publicEstimatedOffBlockTime: f.publicEstimatedOffBlockTime ? new Date(f.publicEstimatedOffBlockTime) : new Date(),
    publicFlightState: {
      flightStates: f.publicFlightState && f.publicFlightState.flightStates ? f.publicFlightState.flightStates : [],
    },
    aircraftType: {
      iataMain: f.aircraftType ? f.aircraftType.iataMain || '' : '',
      iataSub: f.aircraftType ? f.aircraftType.iataSub || '' : '',
    },
    gate: f.gate || '',
    pier: f.pier || '',
    route: {
      destinations: f.route && f.route.destinations ? f.route.destinations : [],
    },
    lastUpdatedAt: new Date(),
  }
}

async function main() {
  await dbConnect()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  // Remove existing flights for today
  await Flight.deleteMany({
    scheduleDateTime: {
      $gte: today,
      $lt: tomorrow,
    },
  })

  console.log('Fetching real KLM departures from Schiphol API...')
  const flights = await fetchSchipholFlights()
  console.log(`Fetched ${flights.length} flights.`)

  const transformed = flights.map(transformSchipholFlight)
  await Flight.insertMany(transformed)
  console.log('Inserted flights into MongoDB.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
}) 