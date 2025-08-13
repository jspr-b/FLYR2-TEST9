"use client"

import { useState, useEffect } from "react"
import { Info, BarChart3, TrendingUp } from "lucide-react"
import { fetchFlights } from "@/lib/api"
import { FlightResponse } from "@/types/flight"
import { calculateDelayMinutes, extractLocalHour } from "@/lib/timezone-utils"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"

interface HourlyDelayData {
  hour: string
  avgDelay: number | null
  flights: number | null
  variance: "Low" | "Medium" | "High"
}

export function DelayTrendsChart() {
  const [selectedHour, setSelectedHour] = useState<string | null>(null)
  const [viewType, setViewType] = useState<"delay" | "flights">("delay")
  const [isLoading, setIsLoading] = useState(true)
  const [hourlyDelayData, setHourlyDelayData] = useState<HourlyDelayData[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Fetch real flight data with KLM filter
        const flightsResponse = await fetchFlights({
          flightDirection: "D",
          scheduleDate: new Date().toISOString().split('T')[0],
          isOperationalFlight: true,
          prefixicao: "KL"
        })
        
        const flights = flightsResponse.flights
        
        // Handle empty data gracefully
        if (!flights || flights.length === 0) {
          const initialHourlyDelayData: HourlyDelayData[] = [
            { hour: "No flights", avgDelay: null, flights: 0, variance: "Low" }
          ]
          setHourlyDelayData(initialHourlyDelayData)
          return
        }
        
        // Calculate hourly delay data from flight data
        const hourGroups = flights.reduce((acc, flight) => {
          // Extract hour using corrected timezone utility
          const scheduleHourLocal = extractLocalHour(flight.scheduleDateTime)
          const hourKey = `${scheduleHourLocal.toString().padStart(2, '0')}:00`
          
          if (!acc[hourKey]) {
            acc[hourKey] = { flights: [], delays: [] }
          }
          
          acc[hourKey].flights.push(flight)
          // Calculate delay using timezone utility
          const delayMinutes = calculateDelayMinutes(flight.scheduleDateTime, flight.publicEstimatedOffBlockTime)
          acc[hourKey].delays.push(delayMinutes)
          
          return acc
        }, {} as Record<string, { flights: any[], delays: number[] }>)
        
        // Transform to chart data format
        const hourlyData: HourlyDelayData[] = Object.entries(hourGroups).map(([hour, data]) => {
          const avgDelay = data.delays.length > 0 ? data.delays.reduce((a, b) => a + b, 0) / data.delays.length : 0
          
          // Determine variance based on delay
          let variance: "Low" | "Medium" | "High" = "Low"
          if (avgDelay > 15) variance = "High"
          else if (avgDelay > 5) variance = "Medium"
          
          return {
            hour,
            avgDelay: avgDelay > 0 ? avgDelay : null,
            flights: data.flights.length,
            variance
          }
        }).sort((a, b) => {
          // Sort by hour (extract hour number for sorting)
          const hourA = parseInt(a.hour.split(':')[0])
          const hourB = parseInt(b.hour.split(':')[0])
          return hourA - hourB
        })
        
        setHourlyDelayData(hourlyData)
      } catch (error) {
        console.error("Error fetching hourly delay data:", error)
        // Fallback to placeholder data on error
        const errorData: HourlyDelayData[] = [
          { hour: "Error loading data", avgDelay: null, flights: null, variance: "Low" }
        ]
        setHourlyDelayData(errorData)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const maxDelay = Math.max(...hourlyDelayData.map((d) => d.avgDelay || 0))
  const maxFlights = Math.max(...hourlyDelayData.map((d) => d.flights || 0))

  const getBarHeight = (value: number | null, max: number) => {
    if (!value || max === 0) return 4
    return Math.max((value / max) * 200, 4) // Minimum 4px height
  }

  const getDelayColor = (delay: number | null, variance: string) => {
    if (!delay) return "bg-gray-300 hover:bg-gray-400"
    if (variance === "High") return "bg-red-500 hover:bg-red-600"
    if (delay > 15) return "bg-orange-500 hover:bg-orange-600"
    if (delay > 8) return "bg-yellow-500 hover:bg-yellow-600"
    return "bg-green-500 hover:bg-green-600"
  }

  const getFlightColor = (flights: number | null) => {
    if (!flights) return "bg-gray-300 hover:bg-gray-400"
    if (flights > 12) return "bg-blue-600 hover:bg-blue-700"
    if (flights > 8) return "bg-blue-500 hover:bg-blue-600"
    if (flights > 5) return "bg-blue-400 hover:bg-blue-500"
    return "bg-blue-300 hover:bg-blue-400"
  }

  const formatValue = (value: number | null) => {
    return value !== null ? value.toString() : "n/v"
  }

  if (!mounted || isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded mb-4"></div>
        <div className="h-4 bg-gray-200 rounded mb-6"></div>
        <div className="flex items-end justify-center gap-4 h-64">
          {[...Array(17)].map((_, index) => {
            // Use deterministic heights to avoid hydration mismatch
            const heights = [80, 120, 60, 140, 100, 160, 90, 200, 70, 130, 110, 180, 150, 40, 170, 50, 190]
            return (
              <div key={index} className="w-8 bg-gray-200 rounded-t" style={{ height: `${heights[index] || 80}px` }}></div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Hourly Delay Patterns</h2>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center cursor-pointer ml-1">
                    <Info className="w-4 h-4 text-muted-foreground" aria-label="Delay info" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs text-sm">
                  <b>How delays are shown:</b>
                  <br />
                  Delays in this chart include both <b>scheduled delays</b> (known and published in advance) and <b>real-time/operational delays</b> (due to unforeseen events). If you see a delay for a future flight, it may be a scheduled delay, not a last-minute operational issue.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-sm text-gray-600">Click bars for detailed breakdown</p>
        </div>
        <div className="flex items-center gap-2 mt-4 sm:mt-0">
          <button
            onClick={() => setViewType("delay")}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors ${
              viewType === "delay" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            Delays
          </button>
          <button
            onClick={() => setViewType("flights")}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors ${
              viewType === "flights"
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            Volume
          </button>
        </div>
      </div>

      <div className="relative">
        {/* Chart Area - Responsive for all screen sizes */}
        <div className="relative overflow-x-auto">
          <div className="flex items-end justify-center min-w-[800px] sm:min-w-0 h-64 mb-4 px-2 gap-2 sm:gap-3 md:gap-4">
            {hourlyDelayData.map((data, index) => {
              const isSelected = selectedHour === data.hour
              const value = viewType === "delay" ? data.avgDelay : data.flights
              const maxValue = viewType === "delay" ? maxDelay : maxFlights
              const height = getBarHeight(value, maxValue)
              const colorClass =
                viewType === "delay" ? getDelayColor(data.avgDelay, data.variance) : getFlightColor(data.flights)

              return (
                <div key={index} className="flex flex-col items-center group cursor-pointer">
                  <div className="text-center mb-2">
                    <span className="text-xs sm:text-sm font-medium text-gray-900">
                      {viewType === "delay" 
                        ? (data.avgDelay ? `${data.avgDelay.toFixed(1)}m` : "n/v")
                        : formatValue(data.flights)
                      }
                    </span>
                  </div>
                  <div
                    className={`w-6 sm:w-8 md:w-10 rounded-t transition-all duration-200 ${colorClass} ${
                      isSelected ? "ring-2 ring-blue-500 ring-offset-2" : ""
                    }`}
                    style={{ height: `${height}px` }}
                    onClick={() => setSelectedHour(isSelected ? null : data.hour)}
                    title={`${data.hour}: ${viewType === "delay" 
                      ? (data.avgDelay ? `${data.avgDelay.toFixed(1)} min avg delay` : "n/v")
                      : `${formatValue(data.flights)} flights`
                    }`}
                  />
                  <span className="text-xs text-gray-600 mt-2 transform -rotate-45 origin-center whitespace-nowrap">
                    {data.hour}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Y-axis labels */}
        <div className="absolute left-2 top-0 h-64 flex flex-col justify-between text-xs text-gray-500"></div>
      </div>

      {/* Selected Hour Details */}
      {selectedHour && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-blue-900 mb-2">{selectedHour} Hour Details</h3>
              {(() => {
                const data = hourlyDelayData.find((d) => d.hour === selectedHour)
                if (!data) return null
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700 font-medium">Average Delay:</span>
                      <p className="text-blue-900">{data.avgDelay ? `${data.avgDelay.toFixed(1)} minutes` : "n/v"}</p>
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">Total Flights:</span>
                      <p className="text-blue-900">{formatValue(data.flights)} departures</p>
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">Variance Level:</span>
                      <p
                        className={`font-medium ${
                          data.variance === "High"
                            ? "text-red-600"
                            : data.variance === "Medium"
                              ? "text-yellow-600"
                              : "text-green-600"
                        }`}
                      >
                        {data.variance}
                      </p>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span className="text-gray-600">Low Delay (&lt;8 min)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-500 rounded"></div>
          <span className="text-gray-600">Medium Delay (8-15 min)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-orange-500 rounded"></div>
          <span className="text-gray-600">High Delay (&gt;15 min)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span className="text-gray-600">High Variance</span>
        </div>
      </div>
    </div>
  )
}
