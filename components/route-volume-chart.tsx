"use client"

import { useState, useEffect } from "react"
import { Info, BarChart3, Clock, AlertTriangle } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useClientData } from "@/lib/client-utils"

interface RouteDelayData {
  destination: string
  destinationName: string
  totalFlights: number
  departedFlights: number
  onTimeFlights: number
  delayedFlights: number
  avgDelay: number
  maxDelay: number
  onTimePercentage: number
  medianDelay: number
  percentDelayedOver15: number
  earliestDeparture: string | null
  latestDeparture: string | null
  flightNumbers: string[]
  totalDelayMinutes?: number
}

interface ApiResponse {
  routes: RouteDelayData[]
}

type DelayMetric = 'totalDelay' | 'avgDelay' | 'percentDelayed'

export function RouteVolumeChart() {
  const [selectedMetric, setSelectedMetric] = useState<DelayMetric>('totalDelay')

  const fetchRouteDelayData = async (): Promise<ApiResponse> => {
    const response = await fetch('/api/route-analytics/delays')
    if (!response.ok) {
      throw new Error('Failed to fetch route delay data')
    }
    const result = await response.json()
    
    // Calculate total delay minutes for each route
    const routesWithTotalDelay = result.routes.map((route: RouteDelayData) => ({
      ...route,
      totalDelayMinutes: Math.round(route.avgDelay * route.totalFlights)
    }))
    
    return { routes: routesWithTotalDelay }
  }

  const { data, loading, backgroundLoading, error } = useClientData(
    fetchRouteDelayData,
    { routes: [] } as ApiResponse,
    [], // No dependencies
    2.5 * 60 * 1000 // Auto-refresh every 2.5 minutes
  )

  const getDelayColor = (route: RouteDelayData) => {
    switch (selectedMetric) {
      case 'avgDelay':
        if (route.avgDelay < 5) return "bg-green-500"
        if (route.avgDelay <= 15) return "bg-yellow-500"
        return "bg-red-500"
      case 'percentDelayed':
        if (route.percentDelayedOver15 < 10) return "bg-green-500"
        if (route.percentDelayedOver15 <= 25) return "bg-yellow-500"
        return "bg-red-500"
      default: // totalDelay
        if ((route.totalDelayMinutes || 0) < 50) return "bg-green-500"
        if ((route.totalDelayMinutes || 0) <= 150) return "bg-yellow-500"
        return "bg-red-500"
    }
  }

  const getMetricValue = (route: RouteDelayData) => {
    switch (selectedMetric) {
      case 'avgDelay':
        return route.avgDelay
      case 'percentDelayed':
        return route.percentDelayedOver15
      default:
        return route.totalDelayMinutes || 0
    }
  }

  const getMetricLabel = (route: RouteDelayData) => {
    switch (selectedMetric) {
      case 'avgDelay':
        return `${route.avgDelay}min avg`
      case 'percentDelayed':
        return `${route.percentDelayedOver15}%`
      default:
        return `${route.totalDelayMinutes}min total`
    }
  }

  const getSortedRoutes = () => {
    if (!data) return []
    return [...data.routes].sort((a, b) => getMetricValue(b) - getMetricValue(a)).slice(0, 10)
  }

  const getMaxValue = () => {
    const routes = getSortedRoutes()
    return Math.max(...routes.map(route => getMetricValue(route))) || 1
  }

  const getBarWidth = (route: RouteDelayData) => {
    const value = getMetricValue(route)
    const maxValue = getMaxValue()
    return Math.max((value / maxValue) * 100, 5) // Minimum 5% width
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Route Delay Bar Chart</h2>
            <span className="inline-flex items-center cursor-pointer ml-1">
              <Info className="w-4 h-4 text-muted-foreground" aria-label="Delay info" />
            </span>
          </div>
          <p className="text-sm text-gray-600">Loading delay analysis data...</p>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className="flex items-center gap-4 animate-pulse">
              <div className="w-12 h-4 bg-gray-300 rounded"></div>
              <div className="flex-1 h-8 bg-gray-300 rounded"></div>
              <div className="w-16 h-4 bg-gray-300 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <div className="text-center p-4">
          <p className="text-red-600">Error loading delay data: {error}</p>
        </div>
      </div>
    )
  }

  if (!data || data.routes.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <div className="text-center p-4">
          <p className="text-gray-600">No delay data available</p>
        </div>
      </div>
    )
  }

  const sortedRoutes = getSortedRoutes()

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-5 h-5 text-red-500" />
          <h2 className="text-lg font-semibold text-gray-900">Route Delay Bar Chart</h2>
          {backgroundLoading && (
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse ml-2" title="Updating data..." />
          )}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center cursor-pointer ml-1">
                  <Info className="w-4 h-4 text-muted-foreground" aria-label="Delay info" />
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Top delayed destinations by aggregate delay impact</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <p className="text-sm text-gray-600 mb-4">Top delayed destinations by aggregate delay impact (auto-refreshes every 2.5min)</p>
        
        {/* Metric Toggle Buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setSelectedMetric('totalDelay')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              selectedMetric === 'totalDelay'
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Total Delay Minutes
          </button>
          <button
            onClick={() => setSelectedMetric('avgDelay')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              selectedMetric === 'avgDelay'
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Average Delay
          </button>
          <button
            onClick={() => setSelectedMetric('percentDelayed')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              selectedMetric === 'percentDelayed'
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            % Delayed ≥15min
          </button>
        </div>
      </div>

      {/* Horizontal Bar Chart */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {sortedRoutes.map((route, index) => (
          <div key={route.destination} className="flex items-center gap-4">
            {/* Rank */}
            <div className="w-6 text-xs font-medium text-gray-500 text-right">
              #{index + 1}
            </div>
            
            {/* Destination Code */}
            <div className="w-12 text-xs font-bold text-gray-900">
              {route.destination}
            </div>
            
            {/* Destination Name */}
            <div className="w-32 text-xs text-gray-700 truncate" title={route.destinationName}>
              {route.destinationName}
            </div>
            
            {/* Bar */}
            <div className="flex-1 relative">
              <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${getDelayColor(route)} flex items-center justify-end pr-2`}
                  style={{ width: `${getBarWidth(route)}%` }}
                >
                  <span className="text-xs font-medium text-white">
                    {getMetricLabel(route)}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Flight Count */}
            <div className="w-16 text-xs text-gray-500 text-right">
              {route.totalFlights} flights
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span className="text-gray-600">
            {selectedMetric === 'avgDelay' ? 'Low (< 5min avg)' : 
             selectedMetric === 'percentDelayed' ? 'Low (< 10%)' : 
             'Low (< 50min total)'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-500 rounded"></div>
          <span className="text-gray-600">
            {selectedMetric === 'avgDelay' ? 'Medium (5-15min)' : 
             selectedMetric === 'percentDelayed' ? 'Medium (10-25%)' : 
             'Medium (50-150min)'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span className="text-gray-600">
            {selectedMetric === 'avgDelay' ? 'High (> 15min)' : 
             selectedMetric === 'percentDelayed' ? 'High (> 25%)' : 
             'High (> 150min)'}
          </span>
        </div>
      </div>
      
      {/* Usage Note */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-800">
            <strong>Use Case:</strong> Identifies operationally unstable routes for dispatch planning, 
            crew prioritization, and delay root cause investigations.
          </div>
        </div>
      </div>
    </div>
  )
} 