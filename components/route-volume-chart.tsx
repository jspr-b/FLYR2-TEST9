"use client"

import { useState, useEffect } from "react"
import { Info, BarChart3 } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface RouteData {
  route: string
  departures: number
  name: string
  country: string
}

interface ApiResponse {
  routes: RouteData[]
}

export function RouteVolumeChart() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null)

  useEffect(() => {
    const fetchRouteVolumeData = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/route-analytics/volumes')
        if (!response.ok) {
          throw new Error('Failed to fetch route volume data')
        }
        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchRouteVolumeData()
  }, [])

  const getBarColor = (departures: number) => {
    if (departures < 12) return "bg-blue-300"
    if (departures < 15) return "bg-blue-400"
    if (departures < 18) return "bg-blue-500"
    return "bg-blue-600"
  }

  const getBarHeight = (departures: number, maxDepartures: number) => {
    if (!departures || maxDepartures === 0) return 100
    return Math.max((departures / maxDepartures) * 200, 100) // Min height of 100px
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">European Route Volume Analysis</h2>
            <span className="inline-flex items-center cursor-pointer ml-1">
              <Info className="w-4 h-4 text-muted-foreground" aria-label="Volume info" />
            </span>
          </div>
          <p className="text-sm text-gray-600">Loading route volume data...</p>
        </div>
        <div className="relative mb-8">
          <div className="relative overflow-x-auto">
            <div className="flex items-end justify-center min-w-[600px] sm:min-w-0 gap-3 sm:gap-4 md:gap-6 lg:gap-8 h-80 lg:h-96 mb-8 px-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="flex flex-col items-center group">
                  <div className="text-center mb-2">
                    <span className="text-xs sm:text-sm font-medium text-gray-900">...</span>
                    <span className="text-xs text-gray-500 block">departures</span>
                  </div>
                  <div className="w-12 sm:w-16 md:w-20 rounded-t transition-all duration-200 bg-gray-300 animate-pulse" style={{ height: "100px" }}></div>
                  <div className="mt-3 text-center">
                    <span className="text-xs sm:text-sm font-medium text-gray-900 block">...</span>
                    <span className="text-xs text-gray-500 block">...</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <div className="text-center p-4">
          <p className="text-red-600">Error loading route volume data: {error}</p>
        </div>
      </div>
    )
  }

  if (!data || data.routes.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <div className="text-center p-4">
          <p className="text-gray-600">No route volume data available</p>
        </div>
      </div>
    )
  }

  const maxDepartures = Math.max(...data.routes.map(r => r.departures))

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">European Route Volume Analysis</h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center cursor-pointer ml-1">
                  <Info className="w-4 h-4 text-muted-foreground" aria-label="Volume info" />
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Click bars for detailed breakdown</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <p className="text-sm text-gray-600">Click bars for detailed breakdown</p>
      </div>

      <div className="relative mb-8">
        <div className="relative overflow-x-auto">
          <div className="flex items-end justify-center min-w-[600px] sm:min-w-0 gap-3 sm:gap-4 md:gap-6 lg:gap-8 h-80 lg:h-96 mb-8 px-2">
            {data.routes.map((route) => (
              <div
                key={route.route}
                className="flex flex-col items-center group cursor-pointer"
                onClick={() => setSelectedRoute(selectedRoute === route.route ? null : route.route)}
              >
                <div className="text-center mb-2">
                  <span className="text-xs sm:text-sm font-medium text-gray-900">{route.departures}</span>
                  <span className="text-xs text-gray-500 block">departures</span>
                </div>
                <div
                  className={`w-12 sm:w-16 md:w-20 rounded-t transition-all duration-200 ${getBarColor(route.departures)} hover:bg-blue-600 ${
                    selectedRoute === route.route ? "ring-2 ring-blue-400 ring-offset-2" : ""
                  }`}
                  style={{ height: `${getBarHeight(route.departures, maxDepartures)}px` }}
                  title={`${route.route}: ${route.departures} departures to ${route.name}`}
                ></div>
                <div className="mt-3 text-center">
                  <span className="text-xs sm:text-sm font-medium text-gray-900 block">{route.route}</span>
                  <span className="text-xs text-gray-500 block">{route.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-300 rounded"></div>
          <span className="text-gray-600">Low Volume (&lt;12 departures)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-400 rounded"></div>
          <span className="text-gray-600">Medium Volume (12-15 departures)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span className="text-gray-600">High Volume (15-18 departures)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-600 rounded"></div>
          <span className="text-gray-600">Very High Volume (&gt;18 departures)</span>
        </div>
      </div>
    </div>
  )
} 