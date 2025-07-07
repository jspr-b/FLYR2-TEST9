import mongoose from 'mongoose'

const AircraftPerformanceSchema = new mongoose.Schema({
  aircraftType: {
    type: String,
    required: true,
    index: true,
  },
  manufacturer: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['Narrow-body', 'Wide-body', 'Regional'],
    required: true,
  },
  capacity: {
    type: Number,
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
  totalDelayMinutes: {
    type: Number,
    default: 0,
  },
  averageDelay: {
    type: Number,
    default: 0,
  },
  maxDelay: {
    type: Number,
    default: 0,
  },
  onTimeFlights: {
    type: Number,
    default: 0,
  },
  delayedFlights: {
    type: Number,
    default: 0,
  },
  cancelledFlights: {
    type: Number,
    default: 0,
  },
  performance: {
    type: String,
    enum: ['Excellent', 'Good', 'Fair', 'Poor'],
    default: 'Good',
  },
  routes: {
    type: String,
  },
  notes: {
    type: String,
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
AircraftPerformanceSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

// Compound index for aircraft type and date
AircraftPerformanceSchema.index({ aircraftType: 1, date: 1 }, { unique: true })

export default mongoose.models.AircraftPerformance || mongoose.model('AircraftPerformance', AircraftPerformanceSchema) 