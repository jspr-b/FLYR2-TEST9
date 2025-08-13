import { useEffect, useState, useRef } from 'react'

// Universal hook for handling hydration and data fetching with background refresh
export function useClientData<T>(
  fetchFunction: () => Promise<T>,
  initialData: T,
  deps: any[] = [],
  autoRefreshInterval?: number // in milliseconds
) {
  const [mounted, setMounted] = useState(false)
  const [data, setData] = useState<T>(initialData)
  const [loading, setLoading] = useState(true)
  const [backgroundLoading, setBackgroundLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Request counter to prevent race conditions
  const requestCounterRef = useRef(0)

  useEffect(() => {
    setMounted(true)
  }, [])

  const fetchData = async (isBackgroundRefresh = false) => {
    // Increment request counter for this fetch
    const currentRequestId = ++requestCounterRef.current
    
    try {
      if (!isBackgroundRefresh) {
        setLoading(true)
      } else {
        setBackgroundLoading(true)
      }
      setError(null)
      
      const result = await fetchFunction()
      
      // Only update state if this is still the latest request
      if (currentRequestId === requestCounterRef.current) {
        setData(result)
      } else {
        console.log(`🚫 Discarding stale response (request ${currentRequestId}, latest: ${requestCounterRef.current})`)
      }
    } catch (err) {
      // Only update error state if this is still the latest request
      if (currentRequestId === requestCounterRef.current) {
        console.error('Data fetch error:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      }
    } finally {
      // Only update loading states if this is still the latest request
      if (currentRequestId === requestCounterRef.current) {
        if (!isBackgroundRefresh) {
          setLoading(false)
        } else {
          setBackgroundLoading(false)
        }
      }
    }
  }

  // Initial data fetch
  useEffect(() => {
    if (!mounted) return
    fetchData(false)
  }, [mounted, ...deps])

  // Auto-refresh setup
  useEffect(() => {
    if (!mounted || !autoRefreshInterval) return

    const interval = setInterval(() => {
      // Background refresh - no loading state shown to user
      fetchData(true)
    }, autoRefreshInterval)

    return () => clearInterval(interval)
  }, [mounted, autoRefreshInterval])

  // Debounced refetch to prevent rapid successive calls
  const lastRefetchRef = useRef(0)
  const refetch = (showLoading = false) => {
    if (!mounted) return
    
    const now = Date.now()
    const timeSinceLastRefetch = now - lastRefetchRef.current
    
    // Prevent refetch if called within 1 second of the last one
    if (timeSinceLastRefetch < 1000) {
      console.log(`⏳ Debouncing refetch (${timeSinceLastRefetch}ms since last)`)
      return
    }
    
    lastRefetchRef.current = now
    fetchData(!showLoading)
  }

  return { 
    data, 
    loading, 
    backgroundLoading,
    error, 
    mounted, 
    refetch 
  }
}

// Safe data accessor with fallbacks
export function safeGet<T>(obj: any, path: string, defaultValue: T): T {
  try {
    const keys = path.split('.')
    let result = obj
    for (const key of keys) {
      if (result == null) return defaultValue
      result = result[key]
    }
    return result ?? defaultValue
  } catch {
    return defaultValue
  }
}

// Normalize gate data
export function normalizeGateData(rawData: any) {
  if (!rawData || !Array.isArray(rawData)) return []
  
  return rawData.map((gate: any) => ({
    gate: safeGet(gate, 'gate', 'Unknown'),
    flights: safeGet(gate, 'flights', 0),
    aircraftTypes: safeGet(gate, 'aircraftTypes', []),
    status: safeGet(gate, 'status', 'Active'),
    lastActivity: safeGet(gate, 'lastActivity', null),
    utilization: safeGet(gate, 'utilization', 0),
    pier: safeGet(gate, 'pier', 'Unknown'),
    isBusGate: safeGet(gate, 'isBusGate', false)
  }))
}

// Format time safely
export function formatTime(time: string | null | undefined): string {
  if (!time) return 'n/v'
  try {
    const date = new Date(time)
    // Check if the date is valid
    if (isNaN(date.getTime())) return 'n/v'
    
    // Always format in Amsterdam timezone
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Europe/Amsterdam'
    })
  } catch {
    return 'n/v'
  }
}

// Format value with fallback
export function formatValue(value: number | null | undefined): string {
  return value != null ? value.toString() : 'n/v'
}

// Format utilization percentage with rounding (no decimals)
export function formatUtilization(value: number | null | undefined): string {
  return value != null ? Math.round(value).toString() : 'n/v'
}

// Format aircraft types for display
export function formatAircraftTypes(types: string[]): string[] {
  if (!Array.isArray(types)) return []
  return types.filter(Boolean).slice(0, 5) // Limit to 5 types
} 