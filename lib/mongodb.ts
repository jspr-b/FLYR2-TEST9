import mongoose from 'mongoose'

// Use environment variable with fallback for development
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://jasper:pindakaas@fly.83cukhh.mongodb.net/flyr-dashboard?retryWrites=true&w=majority&appName=fly'

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local or Vercel environment variables')
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

let cached: MongooseCache = (global as any).mongoose

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null }
}

async function dbConnect(): Promise<MongooseCache> {
  if (cached.conn) {
    return cached
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 10000, // Increased from 5s to 10s
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4 // Use IPv4, skip trying IPv6
    }
    
    console.log('Connecting to MongoDB...')
    cached.promise = mongoose.connect(MONGODB_URI, opts).then(mongoose => {
      console.log('MongoDB connected successfully')
      return mongoose
    }).catch(error => {
      console.error('MongoDB connection error:', error)
      cached.promise = null
      throw error
    })
  }

  try {
    cached.conn = await cached.promise
  } catch (e) {
    cached.promise = null
    throw e
  }

  return cached
}

export default dbConnect 