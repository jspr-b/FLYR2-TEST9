/**
 * Background cache refresh manager for Schiphol API data
 */

import { fetchSchipholFlights, SchipholApiConfig } from './schiphol-api'
import { getTodayAmsterdam } from './amsterdam-time'

interface RefreshTask {
  id: string
  config: SchipholApiConfig
  lastRefresh: number
  nextRefresh: number
  isRefreshing: boolean
}

class CacheManager {
  private static instance: CacheManager
  private refreshTasks: Map<string, RefreshTask> = new Map()
  private refreshInterval: NodeJS.Timeout | null = null
  private readonly REFRESH_INTERVAL = 30 * 1000 // Check every 30 seconds
  private readonly CACHE_REFRESH_LEAD_TIME = 60 * 1000 // Refresh 1 minute before expiry
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  private constructor() {
    // Delay starting the refresh cycle to avoid startup timeouts
    if (process.env.NODE_ENV === 'development') {
      setTimeout(() => {
        this.startRefreshCycle()
      }, 5000) // 5 second delay in development
    } else {
      this.startRefreshCycle()
    }
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager()
    }
    return CacheManager.instance
  }

  /**
   * Register a configuration for background refresh
   */
  registerRefreshTask(id: string, config: SchipholApiConfig) {
    const now = Date.now()
    this.refreshTasks.set(id, {
      id,
      config: {
        ...config,
        isBackgroundRefresh: true,
        maxPagesToFetch: 10 // Limit background refreshes to 10 pages for faster execution
      },
      lastRefresh: now,
      nextRefresh: now + this.CACHE_DURATION - this.CACHE_REFRESH_LEAD_TIME,
      isRefreshing: false
    })
    
    console.log(`🔄 Registered cache refresh task: ${id}, next refresh in ${Math.round((this.CACHE_DURATION - this.CACHE_REFRESH_LEAD_TIME) / 1000)}s`)
  }

  /**
   * Start the background refresh cycle
   */
  private startRefreshCycle() {
    if (this.refreshInterval) {
      return
    }

    this.refreshInterval = setInterval(() => {
      this.checkAndRefreshCaches()
    }, this.REFRESH_INTERVAL)

    console.log('🏃 Background cache refresh cycle started')
  }

  /**
   * Check and refresh caches that are about to expire
   */
  private async checkAndRefreshCaches() {
    const now = Date.now()
    const tasksToRefresh = Array.from(this.refreshTasks.values())
      .filter(task => !task.isRefreshing && now >= task.nextRefresh)

    if (tasksToRefresh.length === 0) {
      return
    }

    console.log(`🔍 Found ${tasksToRefresh.length} caches to refresh`)

    // Refresh caches in parallel with limited concurrency
    const refreshPromises = tasksToRefresh.map(async (task) => {
      try {
        task.isRefreshing = true
        console.log(`🔄 Starting background refresh for: ${task.id}`)
        
        const startTime = Date.now()
        await fetchSchipholFlights(task.config)
        const duration = Date.now() - startTime
        
        task.lastRefresh = Date.now()
        task.nextRefresh = task.lastRefresh + this.CACHE_DURATION - this.CACHE_REFRESH_LEAD_TIME
        
        console.log(`✅ Background refresh completed for: ${task.id} (took ${Math.round(duration / 1000)}s)`)
      } catch (error) {
        console.error(`❌ Background refresh failed for: ${task.id}`, error)
        // Retry in 1 minute
        task.nextRefresh = Date.now() + 60 * 1000
      } finally {
        task.isRefreshing = false
      }
    })

    await Promise.allSettled(refreshPromises)
  }

  /**
   * Stop the refresh cycle (for cleanup)
   */
  stopRefreshCycle() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
      this.refreshInterval = null
      console.log('🛑 Background cache refresh cycle stopped')
    }
  }

  /**
   * Get refresh status for monitoring
   */
  getRefreshStatus() {
    const now = Date.now()
    return Array.from(this.refreshTasks.values()).map(task => ({
      id: task.id,
      lastRefresh: new Date(task.lastRefresh).toISOString(),
      nextRefresh: new Date(task.nextRefresh).toISOString(),
      secondsUntilRefresh: Math.max(0, Math.round((task.nextRefresh - now) / 1000)),
      isRefreshing: task.isRefreshing
    }))
  }
}

// Export singleton instance methods
export const cacheManager = CacheManager.getInstance()

/**
 * Ensure cache is warmed for a specific configuration
 */
export async function ensureCacheWarmed(taskId: string, config: SchipholApiConfig): Promise<void> {
  // Register the task for background refresh
  cacheManager.registerRefreshTask(taskId, config)
  
  // In development, skip initial fetch to prevent startup timeouts
  if (process.env.NODE_ENV === 'development') {
    console.log(`📌 Skipping initial cache warm for ${taskId} in development mode`)
    // Schedule the initial fetch after a delay
    setTimeout(async () => {
      try {
        console.log(`🔥 Warming cache for ${taskId}...`)
        await fetchSchipholFlights(config)
      } catch (error) {
        console.error(`Failed to warm cache for ${taskId}:`, error)
      }
    }, 10000) // 10 second delay
    return
  }
  
  // Fetch initial data if not already cached
  try {
    await fetchSchipholFlights(config)
  } catch (error) {
    console.error(`Failed to warm cache for ${taskId}:`, error)
  }
}