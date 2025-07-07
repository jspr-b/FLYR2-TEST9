"use client"

import { useState, useEffect } from "react"
import { Info, BarChart3, TrendingUp } from "lucide-react"
import { fetchFlights } from "@/lib/api"
import { FlightResponse } from "@/types/flight"
import { calculateDelayMinutes } from "@/lib/timezone-utils"

interface AircraftData {
  type: string
  avgDelay: number | null
  flights: number | null
  departures: number | null
  manufacturer: string
  capacity: string
  routes: string
  // Enhanced metrics
  minDelay?: number
  maxDelay?: number
  onTimePercentage?: number
  onTimeFlights?: number
  delayedFlights?: number
  delayDistribution?: {
    onTime: number
    slight: number
    moderate: number
    significant: number
  }
  gates?: string[]
  piers?: string[]
  flightStates?: string[]
  lastUpdated?: string
}

export function AircraftPerformanceChart() {
  const [selectedAircraft, setSelectedAircraft] = useState<string | null>(null)
  const [viewType, setViewType] = useState<"delay" | "flights">("delay")
  const [isLoading, setIsLoading] = useState(true)
  const [aircraftData, setAircraftData] = useState<AircraftData[]>([])
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return
    
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
          const initialAircraftData: AircraftData[] = [
            {
              type: "No flights",
              avgDelay: null,
              flights: 0,
              departures: 0,
              manufacturer: "No data",
              capacity: "No flights today",
              routes: "No flights scheduled",
            }
          ]
          setAircraftData(initialAircraftData)
          return
        }
        
        // Calculate aircraft performance from flight data
        const aircraftCounts = flights.reduce((acc, flight) => {
          const type = flight.aircraftType.iataSub
          
          // Safety check: ensure type is a string
          const safeType = typeof type === 'string' ? type : 'Unknown'
          acc[safeType] = (acc[safeType] || 0) + 1
          return acc
        }, {} as Record<string, number>)
        
        // Calculate performance metrics for each aircraft type
        const aircraftPerformance = Object.entries(aircraftCounts).map(([type, count]) => {
          const typeFlights = flights.filter(f => {
            const flightType = f.aircraftType.iataSub
            const safeFlightType = typeof flightType === 'string' ? flightType : 'Unknown'
            return safeFlightType === type
          })
          const typeDelays = typeFlights.map(flight => 
            calculateDelayMinutes(flight.scheduleDateTime, flight.publicEstimatedOffBlockTime)
          )
          const avgDelay = typeDelays.length > 0 ? typeDelays.reduce((a, b) => a + b, 0) / typeDelays.length : 0
          
          // Get unique routes for this aircraft type
          const routes = [...new Set(typeFlights.map(f => f.route.destinations.join(', ')))].slice(0, 3).join('; ')
          
          // Determine aircraft properties
          const manufacturer = getAircraftManufacturer(type)
          const capacity = getAircraftCapacity(type)
          
          return {
            type,
            avgDelay,
            flights: count,
            departures: count, // All flights are departures in our filter
            manufacturer,
            capacity,
            routes
          }
        }).sort((a, b) => (a.avgDelay || 0) - (b.avgDelay || 0)) // Sort by delay ascending
        
        setAircraftData(aircraftPerformance)
      } catch (error) {
        console.error("Error fetching aircraft performance data:", error)
        // Fallback to placeholder data on error
        const errorData: AircraftData[] = [
          {
            type: "Error loading data",
            avgDelay: null,
            flights: null,
            departures: null,
            manufacturer: "Error",
            capacity: "Error loading data",
            routes: "Please try again",
          }
        ]
        setAircraftData(errorData)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [isClient])

  const getAircraftManufacturer = (type: string): string => {
    if (type === 'Unknown') return "Unknown"
    if (type.includes('737') || type.includes('777') || type.includes('787')) return "Boeing"
    if (type.includes('A320') || type.includes('A321') || type.includes('A330') || type.includes('A350')) return "Airbus"
    return "Unknown"
  }

  const getAircraftCapacity = (type: string): string => {
    if (type === 'Unknown') return 'Unknown capacity'
    
    // KLM-specific aircraft capacity data
    const capacityMap: Record<string, string> = {
      // Airbus Aircraft
      '332': '268 seats', // Airbus A330-200
      '333': '292 seats', // Airbus A330-300
      '32N': '180 seats', // Airbus A320neo
      '32Q': '232 seats', // Airbus A321neo
      
      // Boeing Aircraft
      '772': '314 seats', // Boeing 777-200ER
      '773': '408 seats', // Boeing 777-300ER
      '77W': '408 seats', // Boeing 777-300ER (alternative code)
      '789': '290 seats', // Boeing 787-9
      '78W': '335 seats', // Boeing 787-10
      '781': '335 seats', // Boeing 787-10 (alternative code)
      '73H': '126 seats', // Boeing 737-700
      '738': '162 seats', // Boeing 737-800
      '73W': '178 seats', // Boeing 737-900
      '73J': '178 seats', // Boeing 737-900 (alternative code)
      '295': '178 seats', // Boeing 737-900 (alternative code)
      
      // Embraer Aircraft (KLM Cityhopper)
      'E70': '76 seats',  // Embraer 170
      'E75': '82 seats',  // Embraer 175
      'E90': '96 seats',  // Embraer 190
      'E7W': '120 seats', // Embraer 195-E2
    }
    return capacityMap[type] || 'Unknown capacity'
  }

  const getAircraftRoutes = (type: string): string => {
    const routeMap: Record<string, string> = {
      'B737-700': 'Short-haul routes',
      'B737-800': 'Primary intra-Europe',
      'B737-900': 'Medium-haul routes',
      'B777-200ER': 'Long-haul routes',
      'B777-300ER': 'High-capacity long-haul',
      'B787-9': 'Dreamliner efficiency',
      'B787-10': 'Biggest Dreamliner variant',
      'A320': 'Short to medium-haul',
      'A321': 'New, fuel-efficient',
      'A330-200': 'Medium-haul workhorse',
      'A330-300': 'Medium-haul operations',
    }
    return routeMap[type] || 'Various routes'
  }

  const maxDelay = Math.max(...aircraftData.map((d) => d.avgDelay || 0))
  const maxFlights = Math.max(...aircraftData.map((d) => d.flights || 0))

  const getBarHeight = (value: number | null, max: number) => {
    if (!value || max === 0) return 8
    return Math.max((value / max) * 200, 8)
  }

  const getDelayColor = (delay: number | null) => {
    if (!delay) return "bg-gray-300 hover:bg-gray-400"
    if (delay > 15) return "bg-red-500 hover:bg-red-600"
    if (delay > 10) return "bg-orange-500 hover:bg-orange-600"
    if (delay > 5) return "bg-yellow-500 hover:bg-yellow-600"
    return "bg-green-500 hover:bg-green-600"
  }

  const getFlightColor = (flights: number | null) => {
    if (!flights) return "bg-gray-300 hover:bg-gray-400"
    if (flights > 25) return "bg-blue-600 hover:bg-blue-700"
    if (flights > 15) return "bg-blue-500 hover:bg-blue-600"
    if (flights > 10) return "bg-blue-400 hover:bg-blue-500"
    return "bg-blue-300 hover:bg-blue-400"
  }

  const formatValue = (value: number | null) => {
    return value !== null ? value.toString() : "n/v"
  }

  const formatDelay = (delay: number | null) => {
    return delay !== null ? `${delay.toFixed(1)}m` : "n/v"
  }

  // Aircraft type display name mapping (copied from dashboard-kpis.tsx)
  function getAircraftDisplayName(type: string): string {
    const aircraftMap: Record<string, string> = {
      // Airbus Aircraft
      '332': 'Airbus A330-200',
      '333': 'Airbus A330-300',
      '32N': 'Airbus A320neo',
      '32Q': 'Airbus A321neo',
      'A332': 'Airbus A330-200',
      'A333': 'Airbus A330-300',
      'A32N': 'Airbus A320neo',
      'A32Q': 'Airbus A321neo',
      // Boeing Aircraft
      '772': 'Boeing 777-200ER',
      '773': 'Boeing 777-300ER',
      '77W': 'Boeing 777-300ER',
      '789': 'Boeing 787-9',
      '78W': 'Boeing 787-10',
      '781': 'Boeing 787-10',
      '73H': 'Boeing 737-700',
      '738': 'Boeing 737-800',
      '73W': 'Boeing 737-900',
      '73J': 'Boeing 737-900',
      'B772': 'Boeing 777-200ER',
      'B773': 'Boeing 777-300ER',
      'B789': 'Boeing 787-9',
      'B738': 'Boeing 737-800',
      // Embraer Aircraft (KLM Cityhopper)
      'E70': 'Embraer E170',
      'E75': 'Embraer E175',
      'E90': 'Embraer E190',
      'E7W': 'Embraer E195-E2',
      'E195': 'Embraer E195',
      'E170': 'Embraer E170',
      'E175': 'Embraer E175',
      'E190': 'Embraer E190',
      '295': 'Embraer E195-E2',
    }
    return aircraftMap[type] || type
  }

  if (!isClient || isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded mb-4"></div>
        <div className="h-4 bg-gray-200 rounded mb-6"></div>
        <div className="flex items-end justify-center gap-4 h-80">
          {[...Array(10)].map((_, index) => (
            <div key={index} className="w-12 bg-gray-200 rounded-t" style={{ height: `${(index + 1) * 20}px` }}></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Aircraft Type Performance</h2>
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
          <div className="flex items-end justify-center min-w-[800px] sm:min-w-0 gap-2 sm:gap-3 md:gap-4 lg:gap-6 h-80 mb-6 px-2">
            {aircraftData.map((data, index) => {
              const isSelected = selectedAircraft === data.type
              const value = viewType === "delay" ? data.avgDelay : data.flights
              const maxValue = viewType === "delay" ? maxDelay : maxFlights
              const height = getBarHeight(value, maxValue)
              const colorClass =
                viewType === "delay" ? getDelayColor(data.avgDelay) : getFlightColor(data.flights)

              return (
                <div key={index} className="flex flex-col items-center group cursor-pointer">
                  <div className="text-center mb-2">
                    <span className="text-xs sm:text-sm font-medium text-gray-900">
                      {viewType === "delay" 
                        ? formatDelay(data.avgDelay)
                        : formatValue(data.flights)
                      }
                    </span>
                  </div>
                  <div
                    className={`w-8 sm:w-10 md:w-12 lg:w-14 rounded-t transition-all duration-200 ${colorClass} ${
                      isSelected ? "ring-2 ring-blue-500 ring-offset-2" : ""
                    }`}
                    style={{ height: `${height}px` }}
                    onClick={() => setSelectedAircraft(isSelected ? null : data.type)}
                    title={`${getAircraftDisplayName(data.type)}: ${viewType === "delay" 
                      ? formatDelay(data.avgDelay)
                      : `${formatValue(data.flights)} flights`
                    } | Routes: ${data.routes || 'No route data'}`}
                  />
                  <div className="mt-3 text-center">
                    <span className="text-xs sm:text-sm font-medium text-gray-900 block">
                      {getAircraftDisplayName(data.type)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Y-axis labels */}
        <div className="absolute left-2 top-0 h-64 flex flex-col justify-between text-xs text-gray-500"></div>
      </div>

      {/* Selected Aircraft Details */}
      {selectedAircraft && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="w-full">
              <h3 className="font-medium text-blue-900 mb-3">{getAircraftDisplayName(selectedAircraft)} Performance Details</h3>
              {(() => {
                const data = aircraftData.find((d) => d.type === selectedAircraft)
                if (!data) return null
                return (
                  <div className="space-y-4">
                    {/* Basic Metrics */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-blue-700 font-medium">Average Delay:</span>
                        <p className="text-blue-900">{formatDelay(data.avgDelay)}</p>
                      </div>
                      <div>
                        <span className="text-blue-700 font-medium">Total Flights:</span>
                        <p className="text-blue-900">{formatValue(data.flights)}</p>
                      </div>
                      <div>
                        <span className="text-blue-700 font-medium">Manufacturer:</span>
                        <p className="text-blue-900">{data.manufacturer}</p>
                      </div>
                      <div>
                        <span className="text-blue-700 font-medium">Capacity:</span>
                        <p className="text-blue-900">{data.capacity}</p>
                      </div>
                    </div>

                    {/* Delay Statistics */}
                    {data.minDelay !== undefined && data.maxDelay !== undefined && (
                      <div className="border-t border-blue-200 pt-3">
                        <h4 className="text-blue-800 font-medium mb-2">Delay Statistics</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-blue-700 font-medium">Delay Range:</span>
                            <p className="text-blue-900">{data.minDelay.toFixed(1)} - {data.maxDelay.toFixed(1)} min</p>
                          </div>
                          <div>
                            <span className="text-blue-700 font-medium">On-Time Rate:</span>
                            <p className="text-blue-900">{data.onTimePercentage?.toFixed(1)}%</p>
                          </div>
                          <div>
                            <span className="text-blue-700 font-medium">On-Time Flights:</span>
                            <p className="text-blue-900">{data.onTimeFlights || 0}</p>
                          </div>
                          <div>
                            <span className="text-blue-700 font-medium">Delayed Flights:</span>
                            <p className="text-blue-900">{data.delayedFlights || 0}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Delay Distribution */}
                    {data.delayDistribution && (
                      <div className="border-t border-blue-200 pt-3">
                        <h4 className="text-blue-800 font-medium mb-2">Delay Distribution</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                          <div className="bg-green-100 p-2 rounded">
                            <span className="text-green-700 font-medium">On Time:</span>
                            <p className="text-green-900">{data.delayDistribution.onTime}</p>
                          </div>
                          <div className="bg-yellow-100 p-2 rounded">
                            <span className="text-yellow-700 font-medium">Slight (1-15min):</span>
                            <p className="text-yellow-900">{data.delayDistribution.slight}</p>
                          </div>
                          <div className="bg-orange-100 p-2 rounded">
                            <span className="text-orange-700 font-medium">Moderate (16-30min):</span>
                            <p className="text-orange-900">{data.delayDistribution.moderate}</p>
                          </div>
                          <div className="bg-red-100 p-2 rounded">
                            <span className="text-red-700 font-medium">Significant (30+min):</span>
                            <p className="text-red-900">{data.delayDistribution.significant}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Operational Details */}
                    {(data.gates?.length || data.piers?.length) && (
                      <div className="border-t border-blue-200 pt-3">
                        <h4 className="text-blue-800 font-medium mb-2">Operational Details</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          {data.gates && data.gates.length > 0 && (
                            <div>
                              <span className="text-blue-700 font-medium">Gates:</span>
                              <p className="text-blue-900">{data.gates.join(', ')}</p>
                            </div>
                          )}
                          {data.piers && data.piers.length > 0 && (
                            <div>
                              <span className="text-blue-700 font-medium">Piers:</span>
                              <p className="text-blue-900">{data.piers.join(', ')}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Flight States */}
                    {data.flightStates && data.flightStates.length > 0 && (
                      <div className="border-t border-blue-200 pt-3">
                        <h4 className="text-blue-800 font-medium mb-2">Flight States</h4>
                        <div className="text-sm">
                          <span className="text-blue-700 font-medium">Current States:</span>
                          <p className="text-blue-900">{data.flightStates.join(', ')}</p>
                        </div>
                      </div>
                    )}

                    {/* Routes */}
                    <div className="border-t border-blue-200 pt-3">
                      <h4 className="text-blue-800 font-medium mb-2">Routes</h4>
                      <div className="text-sm">
                        <span className="text-blue-700 font-medium">Destinations:</span>
                        <p className="text-blue-900">{data.routes || 'No route data'}</p>
                      </div>
                    </div>

                    {/* Last Updated */}
                    {data.lastUpdated && (
                      <div className="border-t border-blue-200 pt-3 text-sm">
                        <span className="text-blue-700 font-medium">Last Updated:</span>
                        <p className="text-blue-900">{new Date(data.lastUpdated).toLocaleString()}</p>
                      </div>
                    )}
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
          <span className="text-gray-600">Low Delay (&lt;5 min)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-500 rounded"></div>
          <span className="text-gray-600">Medium Delay (5-10 min)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-orange-500 rounded"></div>
          <span className="text-gray-600">High Delay (10-15 min)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span className="text-gray-600">Critical Delay (&gt;15 min)</span>
        </div>
      </div>
    </div>
  )
}
