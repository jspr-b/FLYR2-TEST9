"use client"

import { useState, useEffect } from "react"
import { FlightGateChanges } from "./flight-gate-changes"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, AlertCircle } from "lucide-react"

interface GateChangeEvent {
  flightNumber: string
  flightName: string
  currentGate: string
  pier: string
  destination: string
  aircraftType: string
  scheduleDateTime: string
  timeUntilDeparture: number
  isDelayed: boolean
  delayMinutes: number
  isPriority: boolean
  flightStates: string[]
  flightStatesReadable: string[]
}

interface GateChangesResponse {
  gateChangeEvents: GateChangeEvent[]
  metadata: {
    total: number
    urgent: number
    delayed: number
    timestamp: string
    amsterdamTime: string
  }
}

interface GateChangesDashboardProps {
  data?: GateChangesResponse | null
  loading?: boolean
  error?: string | null
}

export function GateChangesDashboard({ data: propData, loading: propLoading, error: propError }: GateChangesDashboardProps = {}) {
  const [data, setData] = useState<GateChangesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Use prop data if provided, otherwise fetch independently
  const usePropsData = propData !== undefined

  useEffect(() => {
    if (usePropsData) {
      setData(propData || null)
      setLoading(propLoading || false)
      setError(propError || null)
    } else {
      fetchGateChanges()
      const interval = setInterval(fetchGateChanges, 10 * 60 * 1000) // Refresh every 10 minutes
      return () => clearInterval(interval)
    }
  }, [propData, propLoading, propError, usePropsData])

  async function fetchGateChanges() {
    try {
      const response = await fetch('/api/gate-changes')
      if (!response.ok) {
        throw new Error(`Failed to fetch gate changes: ${response.statusText}`)
      }
      const data = await response.json()
      setData(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch gate changes')
      console.error('Error fetching gate changes:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="bg-white dark:bg-gray-900 h-[600px] flex flex-col">
        <CardContent className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-white dark:bg-gray-900 h-[600px] flex flex-col">
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.gateChangeEvents.length === 0) {
    return (
      <Card className="bg-white dark:bg-gray-900 h-[600px] flex flex-col">
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400">No gate changes detected</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              Last checked: {data?.metadata.amsterdamTime || 'Unknown'}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return <FlightGateChanges gateChangeEvents={data.gateChangeEvents} />
}