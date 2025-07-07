"use client"

import { useState, useEffect } from "react"
import { ChevronUp, ChevronDown, Clock, Plane, AlertTriangle } from "lucide-react"
import { fetchFlights } from "@/lib/api"
import { FlightResponse } from "@/types/flight"
import { calculateDelayMinutes, extractLocalHour } from "@/lib/timezone-utils"

interface TableData {
  hour: string
  avgDelay: number | null
  flights: number | null
  variance: "Low" | "Medium" | "High"
  flagged: boolean
}

type SortField = "hour" | "avgDelay" | "flights" | "variance"
type SortDirection = "asc" | "desc"

export function DelayTrendsTable() {
  const [sortField, setSortField] = useState<SortField>("hour")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [filterVariance, setFilterVariance] = useState<string>("All")
  const [isLoading, setIsLoading] = useState(true)
  const [tableData, setTableData] = useState<TableData[]>([])

  const varianceOptions = ["All", "Low", "Medium", "High"]

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
          const initialTableData: TableData[] = [
            {
              hour: "No flights",
              avgDelay: null,
              flights: 0,
              variance: "Low",
              flagged: false
            }
          ]
          setTableData(initialTableData)
          return
        }
        
        // Calculate hourly delay data from flight data
        const hourGroups = flights.reduce((acc, flight) => {
          // Extract hour in local timezone
          const scheduleHourLocal = extractLocalHour(flight.scheduleDateTime)
          const hourKey = `${scheduleHourLocal.toString().padStart(2, '0')}:00-${(scheduleHourLocal + 1).toString().padStart(2, '0')}:00`
          
          if (!acc[hourKey]) {
            acc[hourKey] = { flights: [], delays: [] }
          }
          
          acc[hourKey].flights.push(flight)
          // Calculate delay using timezone utility
          const delayMinutes = calculateDelayMinutes(flight.scheduleDateTime, flight.publicEstimatedOffBlockTime)
          acc[hourKey].delays.push(delayMinutes)
          
          return acc
        }, {} as Record<string, { flights: any[], delays: number[] }>)
        
        // Transform to table data format
        const tableDataArray: TableData[] = Object.entries(hourGroups).map(([hour, data]) => {
          const avgDelay = data.delays.length > 0 ? data.delays.reduce((a, b) => a + b, 0) / data.delays.length : 0
          
          // Determine variance based on delay
          let variance: "Low" | "Medium" | "High" = "Low"
          if (avgDelay > 15) variance = "High"
          else if (avgDelay > 5) variance = "Medium"
          
          return {
            hour,
            avgDelay: avgDelay > 0 ? avgDelay : null,
            flights: data.flights.length,
            variance,
            flagged: variance === "High"
          }
        }).sort((a, b) => {
          // Sort by hour (extract hour number for sorting)
          const hourA = parseInt(a.hour.split(':')[0])
          const hourB = parseInt(b.hour.split(':')[0])
          return hourA - hourB
        })
        
        setTableData(tableDataArray)
      } catch (error) {
        console.error("Error fetching delay trends table data:", error)
        // Fallback to placeholder data on error
        const errorData: TableData[] = [
          {
            hour: "Error loading data",
            avgDelay: null,
            flights: null,
            variance: "Low",
            flagged: false
          }
        ]
        setTableData(errorData)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection(field === "hour" ? "asc" : "desc")
    }
  }

  const filteredData = tableData.filter(
    (data) => filterVariance === "All" || data.variance === filterVariance,
  )

  const sortedData = [...filteredData].sort((a, b) => {
    let aVal: any = a[sortField]
    let bVal: any = b[sortField]

    if (sortField === "avgDelay" || sortField === "flights") {
      aVal = Number(aVal) || 0
      bVal = Number(bVal) || 0
    }

    if (sortDirection === "asc") {
      return aVal > bVal ? 1 : -1
    } else {
      return aVal < bVal ? 1 : -1
    }
  })

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronUp className="h-4 w-4 text-gray-400" />
    return sortDirection === "asc" ? (
      <ChevronUp className="h-4 w-4 text-blue-600" />
    ) : (
      <ChevronDown className="h-4 w-4 text-blue-600" />
    )
  }

  const getVarianceColor = (variance: string) => {
    switch (variance) {
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

  const getDelayColor = (avgDelay: number | null) => {
    if (!avgDelay) return "text-gray-500"
    if (avgDelay > 15) return "text-red-600"
    if (avgDelay > 10) return "text-orange-600"
    if (avgDelay > 5) return "text-yellow-600"
    return "text-green-600"
  }

  const formatValue = (value: number | null) => {
    return value !== null ? value.toString() : "n/v"
  }

  const formatDelay = (delay: number | null) => {
    return delay !== null ? `${delay.toFixed(1)}m` : "n/v"
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded mb-4"></div>
        <div className="h-4 bg-gray-200 rounded mb-6"></div>
        <div className="space-y-3">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Hourly Statistics</h2>
        <p className="text-sm text-gray-600">Detailed breakdown by time period</p>
      </div>

      {/* Sort Controls - Now visible on all screen sizes */}
      <div className="flex flex-wrap gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
        <span className="text-sm font-medium text-gray-700 mr-2">Sort by:</span>
        <button
          onClick={() => handleSort("hour")}
          className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium cursor-pointer transition-colors ${
            sortField === "hour" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:text-gray-900 hover:bg-white"
          }`}
        >
          Hour <SortIcon field="hour" />
        </button>
        <button
          onClick={() => handleSort("avgDelay")}
          className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium cursor-pointer transition-colors ${
            sortField === "avgDelay" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:text-gray-900 hover:bg-white"
          }`}
        >
          Delay <SortIcon field="avgDelay" />
        </button>
        <button
          onClick={() => handleSort("flights")}
          className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium cursor-pointer transition-colors ${
            sortField === "flights" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:text-gray-900 hover:bg-white"
          }`}
        >
          Flights <SortIcon field="flights" />
        </button>
        <button
          onClick={() => handleSort("variance")}
          className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium cursor-pointer transition-colors ${
            sortField === "variance" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:text-gray-900 hover:bg-white"
          }`}
        >
          Variance <SortIcon field="variance" />
        </button>
      </div>

      {/* Responsive Card Grid - Works on all screen sizes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-1 2xl:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
        {sortedData.map((row, index) => (
          <div
            key={index}
            className={`border rounded-lg p-4 cursor-default transition-all duration-200 hover:shadow-md hover:border-gray-300 ${
              row.flagged ? "border-red-200 bg-red-25 hover:bg-red-50" : "border-gray-200 bg-white hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {row.flagged && (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                )}
                <span className="font-semibold text-gray-900 text-sm lg:text-base">{row.hour}</span>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getVarianceColor(row.variance)}`}>
                {row.variance}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-gray-500 block mb-1">Average Delay</span>
                <span className={`text-lg lg:text-xl font-bold ${getDelayColor(row.avgDelay)}`}>
                  {formatDelay(row.avgDelay)}
                </span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block mb-1">Total Flights</span>
                <span className="text-lg lg:text-xl font-bold text-gray-900">{formatValue(row.flights)}</span>
              </div>
            </div>

            {/* Additional info for larger cards */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500">
                <span>
                  {row.avgDelay && row.avgDelay > 15
                    ? "High delay period"
                    : row.avgDelay && row.avgDelay > 8
                      ? "Moderate delays"
                      : "On-time performance"}
                </span>
                <span>{row.flights ? `${((row.flights / 130) * 100).toFixed(1)}% of daily flights` : "n/v"}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-xs text-gray-500 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3 text-red-500" />
          <span>Flagged for operational review</span>
        </div>
        <span className="hidden sm:inline">•</span>
        <span>Data source: Schiphol Public Flight API v4.2</span>
      </div>
    </div>
  )
}
