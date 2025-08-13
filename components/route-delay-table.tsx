"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react"
import { useClientData } from "@/lib/client-utils"
import React from "react"

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
}

interface ApiResponse {
  routes: RouteDelayData[]
}

export function RouteDelayTable() {
  const fetchRouteDelayData = async (): Promise<ApiResponse> => {
    const response = await fetch('/api/route-analytics/delays')
    if (!response.ok) {
      throw new Error('Failed to fetch route delay data')
    }
    return await response.json()
  }

  const { data, loading, backgroundLoading, error } = useClientData(
    fetchRouteDelayData,
    { routes: [] } as ApiResponse,
    [], // No dependencies
    2.5 * 60 * 1000 // Auto-refresh every 2.5 minutes
  )

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600"
    if (percentage >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getPerformanceIcon = (percentage: number) => {
    if (percentage >= 80) return <CheckCircle className="w-4 h-4 text-green-600" />
    if (percentage >= 60) return <TrendingUp className="w-4 h-4 text-yellow-600" />
    return <AlertTriangle className="w-4 h-4 text-red-600" />
  }

  const getDelaySeverity = (avgDelay: number) => {
    if (avgDelay <= 5) return { color: "bg-green-100 text-green-800", label: "Low" }
    if (avgDelay <= 15) return { color: "bg-yellow-100 text-yellow-800", label: "Medium" }
    return { color: "bg-red-100 text-red-800", label: "High" }
  }

  if (loading) {
    return (
      <Card className="cursor-default">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="w-5 h-5" />
            Route Delay Performance
          </CardTitle>
          <p className="text-sm text-muted-foreground">Loading route delay data...</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 15 }).map((_, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-center p-3 border rounded-lg animate-pulse">
                <div className="flex items-center space-x-2 col-span-3">
                  <div className="w-8 h-8 bg-gray-300 rounded"></div>
                  <div>
                    <p className="font-medium text-sm cursor-default">...</p>
                    <p className="text-xs text-muted-foreground cursor-default">...</p>
                  </div>
                </div>
                <div className="text-center">...</div>
                <div className="text-center">...</div>
                <div className="text-center">...</div>
                <div className="text-center">...</div>
                <div className="text-center">...</div>
                <div className="text-center">...</div>
                <div className="text-center">...</div>
                <div className="text-center">...</div>
                <div className="col-span-2 text-center">...</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="cursor-default">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="w-5 h-5" />
            Route Delay Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-4">
            <p className="text-red-600">Error loading route delay data: {error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.routes.length === 0) {
    return (
      <Card className="cursor-default">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="w-5 h-5" />
            Route Delay Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-4">
            <p className="text-gray-600">No route delay data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="cursor-default">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="w-5 h-5" />
          Route Delay Performance
          {backgroundLoading && (
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse ml-2" title="Updating data..." />
          )}
        </CardTitle>
        <p className="text-sm text-muted-foreground">Top 15 routes by flight volume (auto-refreshes every 2.5min)</p>
      </CardHeader>
      <CardContent>
        {/* Desktop grid */}
        <div className="hidden md:grid grid-cols-12 gap-2 px-2 mb-2 text-xs font-semibold text-muted-foreground">
          <div className="col-span-3">Destination</div>
          <div className="text-center">On Time</div>
          <div className="text-center">Delayed</div>
          <div className="text-center">Departed</div>
          <div className="text-center">Avg Delay</div>
          <div className="text-center">Median</div>
          <div className="text-center">% {'>'}15m</div>
          <div className="text-center">Earliest</div>
          <div className="text-center">Latest</div>
          <div className="col-span-2 text-center">Flights</div>
        </div>
        {/* Card list, scrollable */}
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {data.routes.map((route) => {
            const delaySeverity = getDelaySeverity(route.avgDelay)
            return (
              <React.Fragment key={route.destination}>
                {/* Desktop grid row */}
                <div
                  key={route.destination + '-desktop'}
                  className="hidden md:grid grid-cols-12 gap-2 items-center p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-default"
                >
                  {/* Destination info */}
                  <div className="flex items-center space-x-3 col-span-3 min-w-0">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                      <span className="text-sm font-semibold text-blue-600 cursor-default">
                        {route.destination}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm cursor-default break-words" title={route.destinationName}>
                        {route.destinationName}
                      </p>
                      <p className="text-xs text-muted-foreground cursor-default">
                        {route.totalFlights} flights
                      </p>
                    </div>
                  </div>
                  {/* On Time */}
                  <div className="text-center min-w-0">
                    <span className="text-green-600 font-semibold">{route.onTimeFlights}</span>
                    <span className="text-xs text-muted-foreground">/{route.totalFlights}</span>
                  </div>
                  {/* Delayed */}
                  <div className="text-center min-w-0">
                    <span className="text-red-600 font-semibold">{route.delayedFlights}</span>
                  </div>
                  {/* Departed */}
                  <div className="text-center min-w-0">
                    <span className="text-blue-600 font-semibold">{route.departedFlights}</span>
                  </div>
                  {/* Avg Delay */}
                  <div className="text-center min-w-0">
                    <span className="font-semibold">{route.avgDelay}min</span>
                    <span className="block text-xs text-muted-foreground">max {route.maxDelay}min</span>
                  </div>
                  {/* Median Delay */}
                  <div className="text-center min-w-0">
                    <span className="font-semibold">{route.medianDelay}min</span>
                  </div>
                  {/* % Delayed >15min */}
                  <div className="text-center min-w-0">
                    <span className="font-semibold">{route.percentDelayedOver15}%</span>
                  </div>
                  {/* Earliest Departure */}
                  <div className="text-center min-w-0">
                    <span className="font-mono text-xs">{route.earliestDeparture ? route.earliestDeparture.slice(11, 16) : '-'}</span>
                  </div>
                  {/* Latest Departure */}
                  <div className="text-center min-w-0">
                    <span className="font-mono text-xs">{route.latestDeparture ? route.latestDeparture.slice(11, 16) : '-'}</span>
                  </div>
                  {/* Flight Numbers - Show ALL flights with more space */}
                  <div className="col-span-2 min-w-0 px-2">
                    {route.flightNumbers.length > 0 ? (
                      <div
                        title={route.flightNumbers.join(', ')}
                        className="text-xs font-mono text-left break-words leading-relaxed"
                        aria-label={`Flight numbers: ${route.flightNumbers.join(', ')}`}
                      >
                        {route.flightNumbers.join(', ')}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </div>
                </div>
                {/* Mobile card */}
                <div
                  key={route.destination + '-mobile'}
                  className="md:hidden flex flex-col gap-2 p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-default"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                      <span className="text-sm font-semibold text-blue-600 cursor-default">
                        {route.destination}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm cursor-default break-words" title={route.destinationName}>
                        {route.destinationName}
                      </p>
                      <p className="text-xs text-muted-foreground cursor-default">
                        {route.totalFlights} flights
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <div><span className="text-green-600 font-semibold">On Time: {route.onTimeFlights}</span> <span className="text-muted-foreground">/{route.totalFlights}</span></div>
                    <div><span className="text-red-600 font-semibold">Delayed: {route.delayedFlights}</span></div>
                    <div><span className="text-blue-600 font-semibold">Departed: {route.departedFlights}</span></div>
                    <div><span className="font-semibold">Avg: {route.avgDelay}min</span> <span className="text-muted-foreground">max {route.maxDelay}min</span></div>
                    <div><span className="font-semibold">Median: {route.medianDelay}min</span></div>
                    <div><span className="font-semibold">% {'>'}15m: {route.percentDelayedOver15}%</span></div>
                    <div><span className="font-mono">Earliest: {route.earliestDeparture ? route.earliestDeparture.slice(11, 16) : '-'}</span></div>
                    <div><span className="font-mono">Latest: {route.latestDeparture ? route.latestDeparture.slice(11, 16) : '-'}</span></div>
                  </div>
                  <div className="text-xs font-mono text-left break-words" title={route.flightNumbers.join(', ')} aria-label={`Flight numbers: ${route.flightNumbers.join(', ')}`}>
                    <strong>Flights:</strong> {route.flightNumbers.join(', ')}
                  </div>
                </div>
              </React.Fragment>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
} 