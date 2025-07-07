import mongoose from 'mongoose'

const HourlyDelaySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    index: true,
  },
  hour: {
    type: Number,
    required: true,
    min: 0,
    max: 23,
  },
  totalFlights: {
    type: Number,
    default: 0,
  },
  delayedFlights: {
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
  variance: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Low',
  },
  weatherConditions: {
    type: String,
  },
  specialEvents: {
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
HourlyDelaySchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

// Compound index for date and hour
HourlyDelaySchema.index({ date: 1, hour: 1 }, { unique: true })

export default mongoose.models.HourlyDelay || mongoose.model('HourlyDelay', HourlyDelaySchema) 