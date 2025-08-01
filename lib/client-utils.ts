import { useEffect, useState } from 'react'

// Universal hook for handling hydration and data fetching
export function useClientData<T>(
  fetchFunction: () => Promise<T>,
  initialData: T,
  deps: any[] = []
) {
  const [mounted, setMounted] = useState(false)
  const [data, setData] = useState<T>(initialData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await fetchFunction()
      setData(result)
    } catch (err) {
      console.error('Data fetch error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!mounted) return
    fetchData()
  }, [mounted, ...deps])

  const refetch = () => {
    if (mounted) {
      fetchData()
    }
  }

  return { data, loading, error, mounted, refetch }
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
    
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  } catch {
    return 'n/v'
  }
}

// Format value with fallback
export function formatValue(value: number | null | undefined): string {
  return value != null ? value.toString() : 'n/v'
}

// Format aircraft types for display
export function formatAircraftTypes(types: string[]): string[] {
  if (!Array.isArray(types)) return []
  return types.filter(Boolean).slice(0, 5) // Limit to 5 types
} 