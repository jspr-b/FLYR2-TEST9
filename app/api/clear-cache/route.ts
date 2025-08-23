import { NextRequest, NextResponse } from 'next/server'
import { clearCache } from '@/lib/schiphol-api'

export async function POST(request: NextRequest) {
  try {
    const result = clearCache()
    console.log('🧹 Cache cleared:', result)
    
    return NextResponse.json({
      ...result,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error clearing cache:', error)
    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    )
  }
}