import { NextRequest, NextResponse } from 'next/server'
import { getCacheStats } from '@/lib/schiphol-api'
import { cacheManager } from '@/lib/cache-manager'

export async function GET(request: NextRequest) {
  try {
    const cacheStats = getCacheStats()
    const refreshStatus = cacheManager.getRefreshStatus()
    
    // Register the gate-changes task if not already registered
    if (refreshStatus.length === 0) {
      const { getTodayAmsterdam } = await import('@/lib/amsterdam-time')
      const { ensureCacheWarmed } = await import('@/lib/cache-manager')
      
      const todayDate = getTodayAmsterdam()
      const apiConfig = {
        flightDirection: 'D' as const,
        airline: 'KL',
        scheduleDate: todayDate,
        fetchAllPages: true
      }
      
      await ensureCacheWarmed('gate-changes-kl-departures', apiConfig)
    }
    
    return NextResponse.json({
      cache: cacheStats,
      backgroundRefresh: cacheManager.getRefreshStatus(),
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error getting cache status:', error)
    return NextResponse.json(
      { error: 'Failed to get cache status' },
      { status: 500 }
    )
  }
}