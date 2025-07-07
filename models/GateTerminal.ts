import mongoose from 'mongoose'

const GateTerminalSchema = new mongoose.Schema({
  gate: {
    type: String,
    required: true,
    index: true,
  },
  pier: {
    type: String,
    required: true,
  },
  terminal: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
    index: true,
  },
  totalFlights: {
    type: Number,
    default: 0,
  },
  arrivals: {
    type: Number,
    default: 0,
  },
  departures: {
    type: Number,
    default: 0,
  },
  averageTurnaround: {
    type: Number, // in minutes
    default: 0,
  },
  totalDelayMinutes: {
    type: Number,
    default: 0,
  },
  averageDelay: {
    type: Number,
    default: 0,
  },
  utilization: {
    type: Number, // percentage
    default: 0,
  },
  status: {
    type: String,
    enum: ['Busy', 'Active', 'Normal', 'Quiet'],
    default: 'Normal',
  },
  type: {
    type: String,
    enum: ['Schengen', 'Non-Schengen'],
    required: true,
  },
  purpose: {
    type: String,
  },
  nextFlight: {
    type: String,
  },
  nextFlightTime: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

// Update the updatedAt field on save
GateTerminalSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

// Compound index for gate and date
GateTerminalSchema.index({ gate: 1, date: 1 }, { unique: true })
GateTerminalSchema.index({ pier: 1, date: 1 })
GateTerminalSchema.index({ terminal: 1, date: 1 })

export default mongoose.models.GateTerminal || mongoose.model('GateTerminal', GateTerminalSchema) 