import { NextResponse } from 'next/server'
import { initializeBackgroundProcessing } from '@/lib/gate-metrics-service'

// This route initializes background processing
// It should be called once when the application starts

let initialized = false

export async function GET() {
  if (!initialized) {
    console.log('🚀 Initializing background gate metrics processing...')
    initializeBackgroundProcessing()
    initialized = true
    
    return NextResponse.json({
      message: 'Background processing initialized',
      status: 'success'
    })
  }
  
  return NextResponse.json({
    message: 'Background processing already initialized',
    status: 'success'
  })
}