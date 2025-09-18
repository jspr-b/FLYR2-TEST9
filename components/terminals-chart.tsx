"use client"

import { useState, useEffect } from "react"
import { Building2, Info, Database, Calendar, Activity, TrendingUp, BarChart, Clock } from "lucide-react"
import { formatValue, formatUtilization } from "@/lib/client-utils"

interface PierData {
  pier: string
  flights: number | null
  arrivals: number | null
  departures: number | null
  utilization: number | null
  status: "High" | "Medium" | "Low"
  type: "Schengen" | "Non-Schengen"
  purpose: string
  currentlyActive: number | null
  totalScheduled: number | null
}

interface GateOccupancyData {
  gateID: string
  pier: string
  gateType: string
  scheduledFlights: FlightData[]
  utilization: {
    current: number
    daily: number
    temporalStatus: string
    logical: number
  }
}

interface FlightData {
  flightName: string
  flightNumber: string
  scheduleDateTime: string
  flightDirection?: 'D' | 'A'
  primaryState: string
  gate?: string
}

interface HourlyDensity {
  hour: string
  flights: number
  intensity: number // 0-1 for color intensity
}

export function TerminalsChart() {
  const [selectedPier, setSelectedPier] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [pierData, setPierData] = useState<PierData[]>([])
  const [hourlyDensity, setHourlyDensity] = useState<Record<string, HourlyDensity[]>>({})
  const [showHourlyView, setShowHourlyView] = useState(false)
  const [showCurrentActivity, setShowCurrentActivity] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Fetch from temporal-aware gate occupancy API
        const response = await fetch('/api/gate-occupancy')
        if (!response.ok) {
          throw new Error('Failed to fetch gate occupancy data')
        }
        
        const data = await response.json()
        const gates: GateOccupancyData[] = data.gates || []
        
        // Calculate pier statistics from gate occupancy data
        const pierStats = gates.reduce((acc, gate) => {
          let pierKey = gate.pier
          let type: "Schengen" | "Non-Schengen" = "Schengen"

          // Special handling for D pier
          if (gate.pier === "D" && gate.gateID) {
            const gateNumber = parseInt(gate.gateID.replace(/\D/g, ""))
            if (gateNumber >= 59 && gateNumber <= 87) {
              pierKey = "D-Schengen"
              type = "Schengen"
            } else if (gateNumber >= 1 && gateNumber <= 57) {
              pierKey = "D-Non-Schengen"
              type = "Non-Schengen"
            } else {
              // If gate number is not in range, keep as D
              pierKey = "D"
              type = "Schengen"
            }
          } else {
            // Determine type based on pier (simplified mapping)
            const schengenPiers = ["A", "B", "C"]
            type = schengenPiers.includes(gate.pier) ? "Schengen" : "Non-Schengen"
          }

          if (pierKey) {
            if (!acc[pierKey]) {
              acc[pierKey] = {
                pier: pierKey,
                flights: 0,
                arrivals: 0,
                departures: 0,
                utilization: 0,
                status: "Low" as const,
                type,
                purpose: "Mixed operations",
                currentlyActive: 0,
                totalScheduled: 0
              }
            }

            // Count scheduled flights
            const scheduledFlights = gate.scheduledFlights || []
            const activeFlights = scheduledFlights.filter(flight => 
              ['BRD', 'GTO', 'GCL', 'GTD', 'DEP'].includes(flight.primaryState)
            )

            // Count actual flights directly to avoid double counting
            const flightCount = scheduledFlights.length
            acc[pierKey].flights += flightCount
            acc[pierKey].totalScheduled += flightCount
            acc[pierKey].currentlyActive += activeFlights.length

            // Count departures (assuming we're looking at departures primarily)
            acc[pierKey].departures += flightCount
          }
          return acc
        }, {} as Record<string, PierData>)
        
        // Calculate utilization and status for each pier
        const transformedPierData: PierData[] = Object.values(pierStats).map(pier => {
          // Use current or total flights based on toggle
          const relevantFlights = showCurrentActivity ? pier.currentlyActive : pier.flights
          const totalFlights = showCurrentActivity ? 
            Object.values(pierStats).reduce((sum, p) => sum + (p.currentlyActive || 0), 0) :
            Object.values(pierStats).reduce((sum, p) => sum + (p.flights || 0), 0)
          
          const utilization = totalFlights > 0 ? Math.round(((relevantFlights || 0) / totalFlights) * 100) : 0
          
          // Determine status based on utilization
          let status: "High" | "Medium" | "Low" = "Low"
          if (utilization > 20) status = "High"
          else if (utilization > 10) status = "Medium"
          
          return {
            ...pier,
            flights: relevantFlights, // Show either current or scheduled based on toggle
            utilization,
            status,
            type: pier.type
          }
        }).sort((a, b) => (b.flights || 0) - (a.flights || 0))

        // Calculate hourly density for each pier (using scheduled flights)
        const hourlyDensityData: Record<string, HourlyDensity[]> = {}
        
        Object.keys(pierStats).forEach(pierKey => {
          const pierGates = gates.filter(gate => {
            let gatePierKey = gate.pier
            if (gate.pier === "D" && gate.gateID) {
              const gateNumber = parseInt(gate.gateID.replace(/\D/g, ""))
              if (gateNumber >= 59 && gateNumber <= 87) {
                gatePierKey = "D-Schengen"
              } else if (gateNumber >= 1 && gateNumber <= 57) {
                gatePierKey = "D-Non-Schengen"
              }
            }
            return gatePierKey === pierKey
          })

          const allPierFlights = pierGates.flatMap(gate => gate.scheduledFlights || [])

          // Group flights by hour
          const hourlyCounts: Record<string, number> = {}
          for (let hour = 6; hour <= 23; hour++) {
            const hourStr = hour.toString().padStart(2, '0')
            hourlyCounts[hourStr] = 0
          }

          allPierFlights.forEach(flight => {
            try {
              const flightHour = new Date(flight.scheduleDateTime).getHours()
              const hourStr = flightHour.toString().padStart(2, '0')
              if (hourlyCounts[hourStr] !== undefined) {
                hourlyCounts[hourStr]++
              }
            } catch (error) {
              console.warn('Invalid date format:', flight.scheduleDateTime)
            }
          })

          // Convert to HourlyDensity format
          const maxFlightsInHour = Math.max(...Object.values(hourlyCounts))
          hourlyDensityData[pierKey] = Object.entries(hourlyCounts).map(([hour, count]) => ({
            hour: `${hour}:00`,
            flights: count,
            intensity: maxFlightsInHour > 0 ? count / maxFlightsInHour : 0
          }))
        })

        // Log temporal context
        console.log('🏗️ Pier Usage Analysis:')
        console.log('- Show current activity:', showCurrentActivity)
        Object.values(pierStats).forEach(pier => {
          console.log(`- Pier ${pier.pier}: ${pier.currentlyActive} currently active, ${pier.totalScheduled} total scheduled, ${pier.flights} flights shown`)
        })
        
        // Debug D pier splitting
        const dGates = gates.filter(g => g.pier === 'D')
        console.log(`- D pier gates: ${dGates.length}`)
        console.log(`- D pier total flights: ${dGates.reduce((sum, g) => sum + (g.scheduledFlights?.length || 0), 0)}`)

        setPierData(transformedPierData)
        setHourlyDensity(hourlyDensityData)
        // Always select the first pier if none is selected
        if (!selectedPier && transformedPierData.length > 0) {
          setSelectedPier(transformedPierData[0].pier)
        }
      } catch (error) {
        console.error("Error fetching pier data:", error)
        // Fallback to placeholder data
        const fallbackPierData: PierData[] = [
          {
            pier: "D",
            flights: null,
            arrivals: null,
            departures: null,
            utilization: null,
            status: "Medium",
            type: "Schengen",
            purpose: "Mixed operations",
            currentlyActive: null,
            totalScheduled: null,
          },
          {
            pier: "B",
            flights: null,
            arrivals: null,
            departures: null,
            utilization: null,
            status: "Low",
            type: "Schengen",
            purpose: "Mixed operations",
            currentlyActive: null,
            totalScheduled: null,
          },
          {
            pier: "E",
            flights: null,
            arrivals: null,
            departures: null,
            utilization: null,
            status: "High",
            type: "Non-Schengen",
            purpose: "Long-haul operations",
            currentlyActive: null,
            totalScheduled: null,
          },
        ]
        setPierData(fallbackPierData)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [selectedPier, showCurrentActivity])

  // Auto-refresh every 2.5 minutes in background
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        // Background refresh - don't change loading state
        const response = await fetch('/api/gate-occupancy')
        if (response.ok) {
          const data = await response.json()
          const gates: GateOccupancyData[] = data.gates || []
          
          // Process data silently (same logic as main fetchData)
          // For brevity, just trigger the main fetchData which will update state
          // In a production app, you'd want to avoid the loading state during background refresh
          fetchData()
          console.log('🔄 Background refresh completed for terminals chart')
        }
      } catch (error) {
        console.error('Background refresh failed for terminals chart:', error)
      }
    }, 2.5 * 60 * 1000) // 2.5 minutes

    return () => clearInterval(interval)
  }, []) // No dependencies, runs independently of other state changes

  const maxFlights = Math.max(...pierData.map((d) => d.flights || 0))

  const getBarHeight = (flights: number | null) => {
    if (!flights || maxFlights === 0) return 8
    return Math.max((flights / maxFlights) * 160, 8)
  }

  const getUtilizationColor = (utilization: number | null, status: string, type: string) => {
    if (!utilization) return "bg-gray-300 hover:bg-gray-400"
    if (utilization > 20) return "bg-red-500 hover:bg-red-600"
    if (utilization > 10) return "bg-yellow-500 hover:bg-yellow-600"
    return "bg-green-500 hover:bg-green-600"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "High":
        return "text-red-600 bg-red-50"
      case "Medium":
        return "text-yellow-600 bg-yellow-50"
      case "Low":
        return "text-green-600 bg-green-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  const formatValue = (value: number | null) => {
    return value !== null ? value.toString() : "n/v"
  }

  const getIntensityColor = (intensity: number) => {
    if (intensity === 0) return 'bg-gray-100'
    if (intensity < 0.3) return 'bg-green-200'
    if (intensity < 0.6) return 'bg-yellow-300'
    if (intensity < 0.8) return 'bg-orange-400'
    return 'bg-red-500'
  }

  const getIntensityTextColor = (intensity: number) => {
    if (intensity === 0) return 'text-gray-400'
    if (intensity < 0.3) return 'text-green-800'
    if (intensity < 0.6) return 'text-yellow-800'
    if (intensity < 0.8) return 'text-orange-800'
    return 'text-white'
  }

  // Add this function to map intensity to a blue color class
  const getBlueBarColor = (intensity: number) => {
    if (intensity === 0) return 'bg-blue-100';
    if (intensity < 0.2) return 'bg-blue-200';
    if (intensity < 0.4) return 'bg-blue-300';
    if (intensity < 0.6) return 'bg-blue-400';
    if (intensity < 0.8) return 'bg-blue-500';
    if (intensity < 0.95) return 'bg-blue-700';
    return 'bg-blue-900';
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-3 xs:p-4 sm:p-5 lg:p-6 min-h-[400px] sm:min-h-[500px] lg:min-h-[600px] animate-pulse">
        <div className="h-5 xs:h-6 bg-gray-200 rounded mb-3 xs:mb-4"></div>
        <div className="h-3 xs:h-4 bg-gray-200 rounded mb-4 xs:mb-6"></div>
        <div className="flex items-end justify-center gap-2 xs:gap-3 sm:gap-4 h-60 xs:h-72 sm:h-80">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="w-10 xs:w-12 sm:w-16 bg-gray-200 rounded-t" style={{ height: `${Math.random() * 200 + 8}px` }}></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 xs:p-4 sm:p-5 lg:p-6 min-h-[400px] xs:min-h-[450px] sm:min-h-[500px] lg:min-h-[600px]">
      <div className="mb-3 xs:mb-4 sm:mb-6">
        <div className="flex items-center justify-between mb-3 xs:mb-4">
          <div className="flex items-center gap-2 xs:gap-3">
            <Building2 className="h-4 xs:h-5 w-4 xs:w-5 text-blue-600" />
            <h2 className="text-sm xs:text-base sm:text-lg font-semibold text-gray-900">
              <span className="sm:hidden">Pier Usage</span>
              <span className="hidden sm:inline">Pier Usage Overview</span>
            </h2>
          </div>
        </div>

        {/* Enhanced Control Panel */}
        <div className="bg-gray-50 rounded-lg p-2 xs:p-3 sm:p-4 mb-3 xs:mb-4 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 xs:gap-4">
            
            {/* Data Mode Selection */}
            <div className="space-y-1.5 xs:space-y-2">
              <label className="flex items-center gap-1.5 xs:gap-2 text-xs xs:text-sm font-medium text-gray-700">
                <Database className="h-3 xs:h-4 w-3 xs:w-4" />
                <span className="2xs:hidden">Source</span>
                <span className="hidden 2xs:inline">Data Source</span>
              </label>
              <div className="flex gap-1.5 xs:gap-2">
                <button
                  onClick={() => setShowCurrentActivity(false)}
                  className={`flex-1 flex items-center justify-center gap-1 xs:gap-1.5 sm:gap-2 px-2 xs:px-3 sm:px-4 py-1.5 xs:py-2 text-[10px] xs:text-xs sm:text-sm font-medium rounded-md xs:rounded-lg transition-all duration-200 ${
                    !showCurrentActivity 
                      ? 'bg-green-600 text-white shadow-md ring-1 xs:ring-2 ring-green-200' 
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  <Calendar className="h-3 xs:h-3.5 sm:h-4 w-3 xs:w-3.5 sm:w-4" />
                  <span className="2xs:hidden">All</span>
                  <span className="hidden 2xs:inline sm:hidden">Scheduled</span>
                  <span className="hidden sm:inline">All Scheduled</span>
                </button>
                <button
                  onClick={() => setShowCurrentActivity(true)}
                  className={`flex-1 flex items-center justify-center gap-1 xs:gap-1.5 sm:gap-2 px-2 xs:px-3 sm:px-4 py-1.5 xs:py-2 text-[10px] xs:text-xs sm:text-sm font-medium rounded-md xs:rounded-lg transition-all duration-200 ${
                    showCurrentActivity 
                      ? 'bg-blue-600 text-white shadow-md ring-1 xs:ring-2 ring-blue-200' 
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  <Activity className="h-3 xs:h-3.5 sm:h-4 w-3 xs:w-3.5 sm:w-4" />
                  <span className="2xs:hidden">Live</span>
                  <span className="hidden 2xs:inline sm:hidden">Activity</span>
                  <span className="hidden sm:inline">Live Activity</span>
                </button>
              </div>
              <p className="text-[9px] xs:text-[10px] sm:text-xs text-gray-500 hidden xs:block">
                {showCurrentActivity 
                  ? 'Active operations only' 
                  : 'All scheduled flights'
                }
              </p>
            </div>

            {/* View Mode Selection */}
            <div className="space-y-1.5 xs:space-y-2">
              <label className="flex items-center gap-1.5 xs:gap-2 text-xs xs:text-sm font-medium text-gray-700">
                <TrendingUp className="h-3 xs:h-4 w-3 xs:w-4" />
                <span className="2xs:hidden">View</span>
                <span className="hidden 2xs:inline">View Type</span>
              </label>
              <div className="flex gap-1.5 xs:gap-2">
                <button
                  onClick={() => setShowHourlyView(false)}
                  className={`flex-1 flex items-center justify-center gap-1 xs:gap-1.5 sm:gap-2 px-2 xs:px-3 sm:px-4 py-1.5 xs:py-2 text-[10px] xs:text-xs sm:text-sm font-medium rounded-md xs:rounded-lg transition-all duration-200 ${
                    !showHourlyView 
                      ? 'bg-purple-600 text-white shadow-md ring-1 xs:ring-2 ring-purple-200' 
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  <BarChart className="h-3 xs:h-3.5 sm:h-4 w-3 xs:w-3.5 sm:w-4" />
                  <span className="2xs:hidden">Piers</span>
                  <span className="hidden 2xs:inline sm:hidden">Summary</span>
                  <span className="hidden sm:inline">Pier Summary</span>
                </button>
                <button
                  onClick={() => setShowHourlyView(true)}
                  className={`flex-1 flex items-center justify-center gap-1 xs:gap-1.5 sm:gap-2 px-2 xs:px-3 sm:px-4 py-1.5 xs:py-2 text-[10px] xs:text-xs sm:text-sm font-medium rounded-md xs:rounded-lg transition-all duration-200 ${
                    showHourlyView 
                      ? 'bg-purple-600 text-white shadow-md ring-1 xs:ring-2 ring-purple-200' 
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  <Clock className="h-3 xs:h-3.5 sm:h-4 w-3 xs:w-3.5 sm:w-4" />
                  <span className="2xs:hidden">Hourly</span>
                  <span className="hidden 2xs:inline sm:hidden">Timeline</span>
                  <span className="hidden sm:inline">Hourly Timeline</span>
                </button>
              </div>
              <p className="text-[9px] xs:text-[10px] sm:text-xs text-gray-500 hidden xs:block">
                {showHourlyView 
                  ? 'Hourly distribution' 
                  : 'Total per pier'
                }
              </p>
            </div>
          </div>

          {/* Current Selection Summary */}
          <div className="mt-2 xs:mt-3 pt-2 xs:pt-3 border-t border-gray-200 hidden sm:block">
            <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 xs:gap-4">
              <div className="flex flex-wrap items-center gap-2 xs:gap-4">
                <span className="text-xs xs:text-sm text-gray-600">
                  <span className="sm:hidden">View:</span>
                  <span className="hidden sm:inline">Currently viewing:</span>
                  <span className="font-medium text-gray-900 ml-1">
                    {showCurrentActivity ? 'Live' : 'All'} • {showHourlyView ? 'Hourly' : 'Summary'}
                  </span>
                </span>
                {showHourlyView && selectedPier && (
                  <span className="text-[10px] xs:text-xs text-gray-500 px-1.5 xs:px-2 py-0.5 xs:py-1 bg-gray-100 rounded-md">
                    Pier {selectedPier}
                  </span>
                )}
              </div>
              {!showHourlyView && (
                <div className="flex items-center gap-1.5 xs:gap-2 text-[10px] xs:text-xs text-blue-600 bg-blue-50 px-2 xs:px-3 py-1 xs:py-1.5 rounded-md border border-blue-200 shrink-0">
                  <Info className="h-2.5 xs:h-3 w-2.5 xs:w-3 flex-shrink-0" />
                  <span>Tap bars</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {!showHourlyView ? (
        <div className="relative mb-4 xs:mb-6 sm:mb-8">
          {/* Chart Area - Responsive for all screen sizes */}
          <div className="relative">
            <div className="flex items-end justify-center gap-3 xs:gap-4 sm:gap-5 md:gap-6 lg:gap-8 h-56 xs:h-72 sm:h-80 lg:h-96 mb-4 xs:mb-6 sm:mb-8 pt-8 px-4">
              {pierData.map((data, index) => {
                const isSelected = selectedPier === data.pier
                const height = getBarHeight(data.flights)
                const colorClass = getUtilizationColor(data.utilization, data.status, data.type)

                return (
                  <div key={index} className="flex flex-col items-center group cursor-pointer">
                    <div className="text-center mb-2 xs:mb-3">
                      <span className="text-[10px] xs:text-xs sm:text-sm font-medium text-gray-900 block">{formatValue(data.flights)}</span>
                      <span className="text-[9px] xs:text-[10px] sm:text-xs text-gray-500 hidden xs:block">flights</span>
                    </div>
                    <div
                      className={`w-8 xs:w-9 sm:w-10 md:w-12 lg:w-16 rounded-t transition-all duration-200 ${colorClass} ${
                        isSelected ? "ring-1 xs:ring-2 ring-blue-500 ring-offset-1 xs:ring-offset-2" : ""
                      }`}
                      style={{ height: `${height}px` }}
                      onClick={() => setSelectedPier(isSelected ? null : data.pier)}
                      title={`${data.pier}: ${formatValue(data.flights)} flights (${formatUtilization(data.utilization)}% utilization)`}
                    />
                    <div className="mt-2 xs:mt-3 text-center max-w-[60px] xs:max-w-[70px] sm:max-w-[80px]">
                      <span className="text-[8px] xs:text-[9px] sm:text-[10px] font-medium text-gray-900 block whitespace-nowrap">
                        {data.pier}
                      </span>
                      <span
                        className={`inline-block px-1 xs:px-1.5 sm:px-2 py-0.5 xs:py-1 rounded-full text-[9px] xs:text-[10px] sm:text-xs font-medium mt-0.5 xs:mt-1 ${getStatusColor(data.status)}`}
                      >
                        {formatUtilization(data.utilization)}%
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
      ) : (
        <div className="mb-4 xs:mb-6 sm:mb-8">
          {/* Hourly Density Bar Chart */}
          <div className="relative overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <div className="flex items-end justify-start min-w-max gap-0.5 xs:gap-1 sm:gap-2 md:gap-3 lg:gap-4 h-48 xs:h-64 sm:h-80 lg:h-96 mb-4 xs:mb-6 sm:mb-8 px-4">
              {Array.from({ length: 18 }, (_, i) => i + 6).map(hour => {
                const hourStr = hour.toString().padStart(2, '0')
                // Always show only the selected pier's data
                let flights = 0
                let intensity = 0
                const selectedPierData = selectedPier ? hourlyDensity[selectedPier] || [] : []
                const hourData = selectedPierData.find(h => h.hour === `${hourStr}:00`)
                flights = hourData?.flights || 0
                intensity = hourData?.intensity || 0
                // Calculate height based on flights (similar to daily view)
                const maxFlightsInHour = Math.max(...Object.values(hourlyDensity).flatMap(pierData => 
                  pierData.map(h => h.flights)
                ))
                const height = maxFlightsInHour > 0 ? Math.max((flights / maxFlightsInHour) * 200, 8) : 8
                return (
                  <div key={hour} className="flex flex-col items-center group cursor-pointer">
                    <div className="text-center mb-1 xs:mb-2">
                      <span className="text-[9px] xs:text-[10px] sm:text-xs lg:text-sm font-medium text-gray-900">{flights || ''}</span>
                    </div>
                    <div
                      className={`w-4 xs:w-6 sm:w-8 md:w-10 lg:w-14 rounded-t transition-all duration-200 ${getBlueBarColor(intensity)} ${
                        selectedPier ? "ring-1 xs:ring-2 ring-blue-300 ring-offset-1 xs:ring-offset-2" : ""
                      }`}
                      style={{ height: `${height}px` }}
                      title={`${hourStr}:00 - ${flights} flights${selectedPier ? ` at ${selectedPier}` : ''}`}
                    />
                    <div className="mt-1.5 xs:mt-2 sm:mt-3 text-center">
                      <span className="text-[9px] xs:text-[10px] sm:text-xs lg:text-sm font-medium text-gray-900 block">
                        {hourStr}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          
          {/* Hourly Summary */}
          <div className="text-center mb-3 xs:mb-4">
            <h3 className="text-xs xs:text-sm font-medium text-gray-900 mb-1 xs:mb-2">
              {selectedPier && (
                <>
                  <span className="sm:hidden">Pier {selectedPier} Hourly</span>
                  <span className="hidden sm:inline">Hourly Flight Distribution - Pier {selectedPier}</span>
                </>
              )}
            </h3>
            <div className="flex justify-center gap-3 xs:gap-4 text-[10px] xs:text-xs text-gray-600">
              <span>Peak Hour: {(() => {
                const pierData = selectedPier ? hourlyDensity[selectedPier] || [] : []
                const peakHour = pierData.reduce((max, current) => 
                  current.flights > max.flights ? current : max, 
                  { hour: '00:00', flights: 0, intensity: 0 }
                )
                return peakHour.hour
              })()}</span>
              <span>Total Flights: {(() => {
                const pierData = selectedPier ? hourlyDensity[selectedPier] || [] : []
                return pierData.reduce((sum, hour) => sum + hour.flights, 0)
              })()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Selected Terminal Details */}
      {selectedPier && (
        <div className="mt-3 xs:mt-4 sm:mt-6 p-2 xs:p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-2 xs:gap-3">
            <Info className="h-4 xs:h-5 w-4 xs:w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-blue-900 text-xs xs:text-sm sm:text-base mb-1 xs:mb-2">Pier {selectedPier} Details</h3>
              {(() => {
                const data = pierData.find((d) => d.pier === selectedPier)
                if (!data) return null
                return (
                  <div className="grid grid-cols-2 xs:grid-cols-3 gap-2 xs:gap-3 sm:gap-4 text-[10px] xs:text-xs sm:text-sm">
                    <div>
                      <span className="text-blue-700 font-medium block">
                        <span className="sm:hidden">{showCurrentActivity ? 'Current:' : 'Total:'}</span>
                        <span className="hidden sm:inline">{showCurrentActivity ? 'Current Flights:' : 'Total Flights:'}</span>
                      </span>
                      <p className="text-blue-900">{formatValue(data.flights)}</p>
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium block">
                        <span className="xs:hidden">Dep:</span>
                        <span className="hidden xs:inline">Departures:</span>
                      </span>
                      <p className="text-blue-900">{formatValue(data.departures)}</p>
                    </div>
                    <div className="col-span-2 xs:col-span-1">
                      <span className="text-blue-700 font-medium block">
                        <span className="xs:hidden">Util:</span>
                        <span className="hidden xs:inline">Utilization:</span>
                      </span>
                      <p className="text-blue-900">{formatUtilization(data.utilization)}%</p>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-3 xs:mt-4 flex flex-wrap gap-2 xs:gap-3 sm:gap-4 text-[9px] xs:text-[10px] sm:text-xs">
        {!showHourlyView ? (
          <>
            <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2">
              <div className="w-2 xs:w-2.5 sm:w-3 h-2 xs:h-2.5 sm:h-3 bg-green-500 rounded-sm xs:rounded"></div>
              <span className="text-gray-600">
                <span className="sm:hidden">Low</span>
                <span className="hidden sm:inline">Low Utilization (&lt;10%)</span>
              </span>
            </div>
            <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2">
              <div className="w-2 xs:w-2.5 sm:w-3 h-2 xs:h-2.5 sm:h-3 bg-yellow-500 rounded-sm xs:rounded"></div>
              <span className="text-gray-600">
                <span className="sm:hidden">Med</span>
                <span className="hidden sm:inline">Medium Utilization (10-20%)</span>
              </span>
            </div>
            <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2">
              <div className="w-2 xs:w-2.5 sm:w-3 h-2 xs:h-2.5 sm:h-3 bg-red-500 rounded-sm xs:rounded"></div>
              <span className="text-gray-600">
                <span className="sm:hidden">High</span>
                <span className="hidden sm:inline">High Utilization (&gt;20%)</span>
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2">
              <div className="w-2 xs:w-2.5 sm:w-3 h-2 xs:h-2.5 sm:h-3 bg-blue-500 rounded-sm xs:rounded"></div>
              <span className="text-gray-600">
                <span className="xs:hidden">Count</span>
                <span className="hidden xs:inline">Hourly flight count</span>
              </span>
            </div>
            <div className="hidden xs:flex items-center gap-1.5 sm:gap-2">
              <div className="w-2.5 sm:w-3 h-2.5 sm:h-3 bg-blue-600 rounded"></div>
              <span className="text-gray-600">Hover state</span>
            </div>
            <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2">
              <div className="w-2 xs:w-2.5 sm:w-3 h-2 xs:h-2.5 sm:h-3 bg-blue-300 rounded-sm xs:rounded ring-1 xs:ring-2 ring-blue-300 ring-offset-1 xs:ring-offset-2"></div>
              <span className="text-gray-600">
                <span className="xs:hidden">Selected</span>
                <span className="hidden xs:inline">Selected pier</span>
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
