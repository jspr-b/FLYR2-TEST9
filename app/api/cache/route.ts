import { NextResponse } from 'next/server'
import { getCacheStats, clearCache } from '@/lib/schiphol-api'

export async function GET() {
  try {
    const stats = getCacheStats()
    
    return NextResponse.json({
      cache: stats,
      message: 'Cache statistics retrieved successfully'
    })
  } catch (error) {
    console.error('Error getting cache stats:', error)
    return NextResponse.json(
      { error: 'Failed to get cache statistics' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    const result = clearCache()
    
    return NextResponse.json({
      ...result,
      message: 'Cache cleared successfully'
    })
  } catch (error) {
    console.error('Error clearing cache:', error)
    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    )
  }
} 