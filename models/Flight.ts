import mongoose from 'mongoose'

const FlightSchema = new mongoose.Schema({
  flightName: {
    type: String,
    required: true,
    index: true,
  },
  flightNumber: {
    type: Number,
    required: true,
    index: true,
  },
  flightDirection: {
    type: String,
    required: true,
    enum: ['D', 'A'], // D for Departure, A for Arrival
  },
  scheduleDateTime: {
    type: Date,
    required: true,
  },
  publicEstimatedOffBlockTime: {
    type: Date,
    required: true,
  },
  publicFlightState: {
    flightStates: [{
      type: String,
      enum: ['DELAYED', 'BOARDING', 'ON_TIME', 'CANCELLED', 'DEPARTED', 'ARRIVED'],
    }],
  },
  aircraftType: {
    iataMain: {
      type: String,
      required: true,
    },
    iataSub: {
      type: String,
      required: true,
    },
  },
  gate: {
    type: String,
  },
  pier: {
    type: String,
  },
  route: {
    destinations: [{
      type: String,
      required: true,
    }],
  },
  lastUpdatedAt: {
    type: Date,
    default: Date.now,
  },
})

// Indexes for better query performance
FlightSchema.index({ scheduleDateTime: 1 })
FlightSchema.index({ flightDirection: 1 })
FlightSchema.index({ gate: 1 })
FlightSchema.index({ pier: 1 })
FlightSchema.index({ 'aircraftType.iataMain': 1 })
FlightSchema.index({ 'publicFlightState.flightStates': 1 })

export default mongoose.models.Flight || mongoose.model('Flight', FlightSchema) 