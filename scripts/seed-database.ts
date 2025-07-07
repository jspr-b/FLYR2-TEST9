import { config } from 'dotenv'
import path from 'path'
config({ path: path.resolve(process.cwd(), '.env') })

// Set the MongoDB URI directly for seeding
process.env.MONGODB_URI = "mongodb+srv://jasper:pindakaas@fly.83cukhh.mongodb.net/flyr-dashboard?retryWrites=true&w=majority&appName=fly"

import dbConnect from '../lib/mongodb'
import Flight from '../models/Flight'
import HourlyDelay from '../models/HourlyDelay'
import AircraftPerformance from '../models/AircraftPerformance'
import GateTerminal from '../models/GateTerminal'

async function seedDatabase() {
  try {
    await dbConnect()
    console.log('Connected to MongoDB')

    // Clear existing data
    await Flight.deleteMany({})
    await HourlyDelay.deleteMany({})
    await AircraftPerformance.deleteMany({})
    await GateTerminal.deleteMany({})
    console.log('Cleared existing data')

    // Always use today (local time, midnight) for all seeded data
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)

    // Sample flight data
    const sampleFlights = [
      {
        flightName: 'KL1234',
        flightNumber: 1234,
        flightDirection: 'D',
        scheduleDateTime: new Date(today.getTime() + 8 * 60 * 60 * 1000), // 08:00
        publicEstimatedOffBlockTime: new Date(today.getTime() + 8 * 60 * 60 * 1000 + 15 * 60 * 1000), // 15 min delay
        publicFlightState: {
          flightStates: ['DELAYED']
        },
        aircraftType: {
          iataMain: 'B737',
          iataSub: 'B737-800'
        },
        gate: 'F07',
        pier: 'F',
        route: {
          destinations: ['London']
        },
        lastUpdatedAt: new Date()
      },
      {
        flightName: 'KL5678',
        flightNumber: 5678,
        flightDirection: 'D',
        scheduleDateTime: new Date(today.getTime() + 9 * 60 * 60 * 1000), // 09:00
        publicEstimatedOffBlockTime: new Date(today.getTime() + 9 * 60 * 60 * 1000 + 5 * 60 * 1000), // 5 min delay
        publicFlightState: {
          flightStates: ['DELAYED']
        },
        aircraftType: {
          iataMain: 'A321',
          iataSub: 'A321neo'
        },
        gate: 'D12',
        pier: 'D',
        route: {
          destinations: ['Paris']
        },
        lastUpdatedAt: new Date()
      },
      {
        flightName: 'KL9012',
        flightNumber: 9012,
        flightDirection: 'D',
        scheduleDateTime: new Date(today.getTime() + 10 * 60 * 60 * 1000), // 10:00
        publicEstimatedOffBlockTime: new Date(today.getTime() + 10 * 60 * 60 * 1000 + 45 * 60 * 1000), // 45 min delay
        publicFlightState: {
          flightStates: ['DELAYED']
        },
        aircraftType: {
          iataMain: 'B787',
          iataSub: 'B787-9'
        },
        gate: 'E18',
        pier: 'E',
        route: {
          destinations: ['New York']
        },
        lastUpdatedAt: new Date()
      }
    ]

    await Flight.insertMany(sampleFlights)
    console.log('Inserted sample flights')

    // Sample hourly delay data
    const sampleHourlyDelays = [
      {
        date: today,
        hour: 8,
        totalFlights: 4,
        delayedFlights: 2,
        totalDelayMinutes: 45,
        averageDelay: 11.25,
        maxDelay: 25,
        variance: 'Medium'
      },
      {
        date: today,
        hour: 9,
        totalFlights: 6,
        delayedFlights: 3,
        totalDelayMinutes: 67,
        averageDelay: 11.17,
        maxDelay: 30,
        variance: 'Medium'
      },
      {
        date: today,
        hour: 10,
        totalFlights: 8,
        delayedFlights: 5,
        totalDelayMinutes: 156,
        averageDelay: 19.5,
        maxDelay: 45,
        variance: 'High'
      }
    ]

    await HourlyDelay.insertMany(sampleHourlyDelays)
    console.log('Inserted sample hourly delays')

    // Sample aircraft performance data
    const sampleAircraftPerformance = [
      {
        aircraftType: 'B737-800',
        manufacturer: 'Boeing',
        category: 'Narrow-body',
        capacity: 186,
        date: today,
        totalFlights: 12,
        arrivals: 6,
        departures: 6,
        totalDelayMinutes: 180,
        averageDelay: 15.0,
        maxDelay: 45,
        onTimeFlights: 8,
        delayedFlights: 4,
        cancelledFlights: 0,
        performance: 'Fair',
        routes: 'Primary intra-Europe'
      },
      {
        aircraftType: 'A321neo',
        manufacturer: 'Airbus',
        category: 'Narrow-body',
        capacity: 220,
        date: today,
        totalFlights: 8,
        arrivals: 4,
        departures: 4,
        totalDelayMinutes: 40,
        averageDelay: 5.0,
        maxDelay: 15,
        onTimeFlights: 7,
        delayedFlights: 1,
        cancelledFlights: 0,
        performance: 'Excellent',
        routes: 'New, fuel-efficient'
      },
      {
        aircraftType: 'B787-9',
        manufacturer: 'Boeing',
        category: 'Wide-body',
        capacity: 294,
        date: today,
        totalFlights: 6,
        arrivals: 3,
        departures: 3,
        totalDelayMinutes: 180,
        averageDelay: 30.0,
        maxDelay: 45,
        onTimeFlights: 2,
        delayedFlights: 4,
        cancelledFlights: 0,
        performance: 'Poor',
        routes: 'Dreamliner'
      }
    ]

    await AircraftPerformance.insertMany(sampleAircraftPerformance)
    console.log('Inserted sample aircraft performance')

    // Sample gate and terminal data
    const sampleGateTerminals = [
      {
        gate: 'F07',
        pier: 'F',
        terminal: 'Terminal 1',
        date: today,
        totalFlights: 8,
        arrivals: 4,
        departures: 4,
        averageTurnaround: 45,
        totalDelayMinutes: 120,
        averageDelay: 15.0,
        utilization: 75,
        status: 'Active',
        type: 'Schengen',
        purpose: 'Mixed operations',
        nextFlight: 'KL2345',
        nextFlightTime: new Date(today.getTime() + 12 * 60 * 60 * 1000)
      },
      {
        gate: 'D12',
        pier: 'D',
        terminal: 'Terminal 1',
        date: today,
        totalFlights: 6,
        arrivals: 3,
        departures: 3,
        averageTurnaround: 40,
        totalDelayMinutes: 30,
        averageDelay: 5.0,
        utilization: 60,
        status: 'Normal',
        type: 'Schengen',
        purpose: 'Mixed operations',
        nextFlight: 'KL3456',
        nextFlightTime: new Date(today.getTime() + 11 * 60 * 60 * 1000)
      },
      {
        gate: 'E18',
        pier: 'E',
        terminal: 'Terminal 2',
        date: today,
        totalFlights: 4,
        arrivals: 2,
        departures: 2,
        averageTurnaround: 90,
        totalDelayMinutes: 180,
        averageDelay: 45.0,
        utilization: 85,
        status: 'Busy',
        type: 'Non-Schengen',
        purpose: 'Long-haul operations',
        nextFlight: 'KL4567',
        nextFlightTime: new Date(today.getTime() + 14 * 60 * 60 * 1000)
      }
    ]

    await GateTerminal.insertMany(sampleGateTerminals)
    console.log('Inserted sample gate and terminal data')

    console.log('Database seeding completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('Error seeding database:', error)
    process.exit(1)
  }
}

seedDatabase() 