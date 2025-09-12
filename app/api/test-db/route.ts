import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'

export async function GET() {
  try {
    console.log('Testing database connection...')
    console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI)
    
    const result = await dbConnect()
    console.log('Database connected successfully')
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      mongoUri: process.env.MONGODB_URI ? 'URI is set' : 'URI is missing'
    })
  } catch (error: any) {
    console.error('Database connection error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      mongoUri: process.env.MONGODB_URI ? 'URI is set' : 'URI is missing'
    }, { status: 500 })
  }
}