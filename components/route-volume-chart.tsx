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

  const getTextColor = (route: RouteDelayData) => {
    // Use a medium-dark grey that works well on all backgrounds
    return "#374151" // gray-700 equivalent
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
        return `${route.avgDelay}m`
      case 'percentDelayed':
        return `${route.percentDelayedOver15}%`
      default:
        return `${route.totalDelayMinutes}m`
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
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0" />
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Route Delay Bar Chart</h2>
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
        <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">Top delayed destinations by aggregate delay impact (auto-refreshes every 2.5min)</p>
        
        {/* Metric Toggle Buttons */}
        <div className="flex flex-wrap gap-1 sm:gap-2 mb-4">
          <button
            onClick={() => setSelectedMetric('totalDelay')}
            className={`px-2 sm:px-3 md:px-4 py-1.5 text-xs md:text-sm font-medium rounded-lg transition-all ${
              selectedMetric === 'totalDelay'
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="sm:hidden">Total</span>
            <span className="hidden sm:inline md:hidden">Total Delay</span>
            <span className="hidden md:inline">Total Delay Minutes</span>
          </button>
          <button
            onClick={() => setSelectedMetric('avgDelay')}
            className={`px-2 sm:px-3 md:px-4 py-1.5 text-xs md:text-sm font-medium rounded-lg transition-all ${
              selectedMetric === 'avgDelay'
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="sm:hidden">Average</span>
            <span className="hidden sm:inline md:hidden">Avg Delay</span>
            <span className="hidden md:inline">Average Delay</span>
          </button>
          <button
            onClick={() => setSelectedMetric('percentDelayed')}
            className={`px-2 sm:px-3 md:px-4 py-1.5 text-xs md:text-sm font-medium rounded-lg transition-all ${
              selectedMetric === 'percentDelayed'
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="sm:hidden">% ≥15m</span>
            <span className="hidden sm:inline md:hidden">% Delayed 15m+</span>
            <span className="hidden md:inline">% Delayed ≥15min</span>
          </button>
        </div>
      </div>

      {/* Horizontal Bar Chart */}
      <div className="space-y-2 sm:space-y-3 max-h-[300px] sm:max-h-[400px] overflow-y-auto">
        {sortedRoutes.map((route, index) => (
          <div key={route.destination} className="flex items-center gap-1 xs:gap-2 sm:gap-3 md:gap-4">
            {/* Rank */}
            <div className="w-5 xs:w-6 text-[10px] xs:text-xs font-medium text-gray-500 text-right">
              #{index + 1}
            </div>
            
            {/* Destination Code */}
            <div className="w-8 xs:w-10 sm:w-12 text-[10px] xs:text-xs font-bold text-gray-900">
              {route.destination}
            </div>
            
            {/* Destination Name - only show on larger screens */}
            <div className="hidden min-[480px]:block w-16 xs:w-20 sm:w-24 md:w-32 lg:w-40 text-[10px] xs:text-xs text-gray-700 truncate" title={route.destinationName}>
              {route.destinationName}
            </div>
            
            {/* Bar */}
            <div className="flex-1 relative min-w-0">
              <div className="h-6 xs:h-7 sm:h-8 bg-gray-100 rounded-md sm:rounded-lg overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${getDelayColor(route)} flex items-center justify-end pr-1 sm:pr-2`}
                  style={{ width: `${getBarWidth(route)}%` }}
                >
                  <span className="text-[10px] xs:text-xs font-medium whitespace-nowrap" style={{ color: getTextColor(route) }}>
                    {getMetricLabel(route)}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Flight Count */}
            <div className="w-8 xs:w-10 sm:w-12 md:w-14 lg:w-16 text-[10px] xs:text-xs text-gray-500 text-right whitespace-nowrap">
              <span className="min-[480px]:hidden">{route.totalFlights}</span>
              <span className="hidden min-[480px]:inline sm:hidden">{route.totalFlights}f</span>
              <span className="hidden sm:inline md:hidden">{route.totalFlights} fl</span>
              <span className="hidden md:inline">{route.totalFlights} flights</span>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 sm:mt-6 flex flex-wrap gap-2 xs:gap-3 sm:gap-4 text-[10px] xs:text-xs">
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="w-2 h-2 xs:w-3 xs:h-3 bg-green-500 rounded"></div>
          <span className="text-gray-600">
            <span className="sm:hidden">Low</span>
            <span className="hidden sm:inline">
              {selectedMetric === 'avgDelay' ? 'Low (< 5min avg)' : 
               selectedMetric === 'percentDelayed' ? 'Low (< 10%)' : 
               'Low (< 50min total)'}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="w-2 h-2 xs:w-3 xs:h-3 bg-yellow-500 rounded"></div>
          <span className="text-gray-600">
            <span className="sm:hidden">Med</span>
            <span className="hidden sm:inline">
              {selectedMetric === 'avgDelay' ? 'Medium (5-15min)' : 
               selectedMetric === 'percentDelayed' ? 'Medium (10-25%)' : 
               'Medium (50-150min)'}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="w-2 h-2 xs:w-3 xs:h-3 bg-red-500 rounded"></div>
          <span className="text-gray-600">
            <span className="sm:hidden">High</span>
            <span className="hidden sm:inline">
              {selectedMetric === 'avgDelay' ? 'High (> 15min)' : 
               selectedMetric === 'percentDelayed' ? 'High (> 25%)' : 
               'High (> 150min)'}
            </span>
          </span>
        </div>
      </div>
      
      {/* Usage Note */}
      <div className="mt-4 p-2 xs:p-3 bg-blue-50 rounded-md sm:rounded-lg">
        <div className="flex items-start gap-1.5 sm:gap-2">
          <AlertTriangle className="w-3 h-3 xs:w-4 xs:h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-[10px] xs:text-xs text-blue-800">
            <strong className="sm:hidden">Use:</strong>
            <strong className="hidden sm:inline">Use Case:</strong>
            <span className="sm:hidden"> Route instability tracking</span>
            <span className="hidden sm:inline"> Identifies operationally unstable routes for dispatch planning, 
            crew prioritization, and delay root cause investigations.</span>
          </div>
        </div>
      </div>
    </div>
  )
} 