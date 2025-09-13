import { NextResponse } from 'next/server'
import { clearCache } from '@/lib/schiphol-api'

export async function POST() {
  try {
    const result = clearCache()
    console.log('🧹 Cache cleared:', result)
    return NextResponse.json({ 
      success: true, 
      ...result,
      message: 'Cache cleared successfully. Flight data will be refreshed on next request.'
    })
  } catch (error) {
    console.error('❌ Error clearing cache:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to clear cache' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Use POST method to clear the cache',
    endpoint: '/api/clear-cache'
  })
}