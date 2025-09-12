import mongoose, { Schema, Document } from 'mongoose'

export interface IConsent extends Document {
  sessionId: string
  ipAddress: string
  userAgent: string
  termsVersion: string
  action: 'agreed' | 'declined'
  timestamp: Date
  expiresAt: Date
  metadata: {
    browser?: string
    os?: string
    device?: string
    referrer?: string
    language?: string
  }
}

const ConsentSchema = new Schema<IConsent>({
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  ipAddress: {
    type: String,
    required: true,
    index: true
  },
  userAgent: {
    type: String,
    required: true
  },
  termsVersion: {
    type: String,
    required: true,
    default: '1.0.0' // Update this when terms change
  },
  action: {
    type: String,
    enum: ['agreed', 'declined'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  metadata: {
    browser: String,
    os: String,
    device: String,
    referrer: String,
    language: String
  }
}, {
  timestamps: true
})

// Create TTL index to automatically delete expired consents after 30 days
ConsentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 2592000 }) // 30 days

// Compound index for efficient lookups
ConsentSchema.index({ sessionId: 1, termsVersion: 1, timestamp: -1 })

export default mongoose.models.Consent || mongoose.model<IConsent>('Consent', ConsentSchema)