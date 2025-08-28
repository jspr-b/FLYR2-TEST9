"use client"

import { useState, useEffect } from "react"
import { ChevronUp, ChevronDown, Plane, Clock, Users } from "lucide-react"

interface AircraftTableData {
  type: string
  manufacturer: string
  avgDelay: number | null
  flights: number | null
  departures: number | null
  capacity: number | null
  routes: string
  performance: "Excellent" | "Good" | "Fair" | "Poor"
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

type SortField = "type" | "manufacturer" | "avgDelay" | "flights" | "capacity" | "onTimePercentage"
type SortDirection = "asc" | "desc"

export function AircraftPerformanceTable() {
  const [sortField, setSortField] = useState<SortField>("avgDelay")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [isLoading, setIsLoading] = useState(true)
  const [aircraftTableData, setAircraftTableData] = useState<AircraftTableData[]>([])

  const manufacturers = ["All", "Airbus", "Boeing"]

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Fetch aircraft performance data from the dedicated API endpoint
        const response = await fetch('/api/aircraft/performance')
        const data = await response.json()
        
        if (!response.ok) {
          throw new Error('Failed to fetch aircraft performance data')
        }
        
        // Handle empty data gracefully
        if (!data.tableData || data.tableData.length === 0) {
          const initialAircraftTableData: AircraftTableData[] = [
            {
              type: "No flights",
              manufacturer: "No data",
              avgDelay: null,
              flights: 0,
              departures: 0,
              capacity: null,
              routes: "No flights today",
              performance: "Good",
            }
          ]
          setAircraftTableData(initialAircraftTableData)
          return
        }
        
        // Transform API data to component format
        const aircraftPerformance = data.tableData.map((item: any) => ({
          type: item.type,
          manufacturer: item.manufacturer,
          avgDelay: item.avgDelay,
          flights: item.flights,
          departures: item.departures,
          capacity: item.capacity,
          routes: item.routes,
          performance: item.performance,
          onTimePercentage: item.onTimePercentage,
          onTimeFlights: item.onTimeFlights,
          delayedFlights: item.delayedFlights,
          minDelay: item.minDelay,
          maxDelay: item.maxDelay,
          delayDistribution: item.delayDistribution,
          gates: item.gates,
          piers: item.piers,
          flightStates: item.flightStates,
          lastUpdated: item.lastUpdated
        }))
        
        setAircraftTableData(aircraftPerformance)
      } catch (error) {
        console.error("Error fetching aircraft performance table data:", error)
        // Fallback to placeholder data on error
        const errorData: AircraftTableData[] = [
          {
            type: "Error loading data",
            manufacturer: "Error",
            avgDelay: null,
            flights: null,
            departures: null,
            capacity: null,
            routes: "Please try again",
            performance: "Good",
            onTimePercentage: 0,
            onTimeFlights: 0,
            delayedFlights: 0,
          }
        ]
        setAircraftTableData(errorData)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const getAircraftManufacturer = (type: string): string => {
    if (type === 'Unknown') return "Unknown"
    const manufacturerMap: Record<string, string> = {
      // Boeing Aircraft
      'B737-700': 'Boeing',
      'B737-800': 'Boeing',
      'B737-900': 'Boeing',
      'B737-900ER': 'Boeing',
      'B737-MAX8': 'Boeing',
      'B737-MAX9': 'Boeing',
      'B777-200': 'Boeing',
      'B777-200ER': 'Boeing',
      'B777-300': 'Boeing',
      'B777-300ER': 'Boeing',
      'B787-8': 'Boeing',
      'B787-9': 'Boeing',
      'B787-10': 'Boeing',
      
      // Airbus Aircraft
      'A318': 'Airbus',
      'A319': 'Airbus',
      'A320': 'Airbus',
      'A320neo': 'Airbus',
      'A321': 'Airbus',
      'A321neo': 'Airbus',
      'A321LR': 'Airbus',
      'A321XLR': 'Airbus',
      'A330-200': 'Airbus',
      'A330-300': 'Airbus',
      'A330-800': 'Airbus',
      'A330-900': 'Airbus',
      'A350-900': 'Airbus',
      'A350-1000': 'Airbus',
      'A380': 'Airbus',
      
      // Regional Jets
      'CRJ-700': 'Bombardier',
      'CRJ-900': 'Bombardier',
      'CRJ-1000': 'Bombardier',
      'E170': 'Embraer',
      'E175': 'Embraer',
      'E190': 'Embraer',
      'E195': 'Embraer',
      'ATR-72': 'ATR',
      'Dash-8': 'Bombardier',
      'ERJ-135': 'Embraer',
      'ERJ-145': 'Embraer',
      'ERJ-170': 'Embraer',
      'ERJ-175': 'Embraer',
      'ERJ-190': 'Embraer',
      'ERJ-195': 'Embraer',
      
      // ICAO Codes
      '73J': 'Boeing', // Boeing 737-900
      '73H': 'Boeing', // Boeing 737-700
      '73W': 'Boeing', // Boeing 737-800
      '73K': 'Boeing', // Boeing 737-900
      '295': 'Boeing', // Boeing 737-900 (alternative code)
      '32N': 'Airbus', // Airbus A320neo
      '32Q': 'Airbus', // Airbus A321neo
      '332': 'Airbus', // Airbus A330-200
      '333': 'Airbus', // Airbus A330-300
      '772': 'Boeing', // Boeing 777-200ER
      '773': 'Boeing', // Boeing 777-300ER
      '77W': 'Boeing', // Boeing 777-300ER (alternative code)
      '788': 'Boeing', // Boeing 787-8
      '789': 'Boeing', // Boeing 787-9
      '78W': 'Boeing', // Boeing 787-10
      '781': 'Boeing', // Boeing 787-10 (alternative code)
      '78X': 'Boeing', // Boeing 787-10 (alternative code)
      '77L': 'Boeing', // Boeing 777-200LR
      '359': 'Airbus', // Airbus A350-900
      '35K': 'Airbus', // Airbus A350-1000
      '388': 'Airbus', // Airbus A380-800
      'E70': 'Embraer', // Embraer 170
      'E75': 'Embraer', // Embraer 175
      'E90': 'Embraer', // Embraer 190
      'E7W': 'Embraer', // Embraer 195-E2
    }
    
    // Check exact match first
    if (manufacturerMap[type]) {
      return manufacturerMap[type]
    }
    
    // Fallback to pattern matching for unknown types
    if (type.includes('737') || type.includes('777') || type.includes('787') || type.includes('73') || type.includes('77') || type.includes('78')) {
      return 'Boeing'
    }
    if (type.includes('A320') || type.includes('A321') || type.includes('A330') || type.includes('A350') || type.includes('A380') || type.includes('32') || type.includes('35') || type.includes('38')) {
      return 'Airbus'
    }
    if (type.includes('CRJ') || type.includes('Dash')) {
      return 'Bombardier'
    }
    if (type.includes('ERJ') || type.includes('E17') || type.includes('E19')) {
      return 'Embraer'
    }
    if (type.includes('ATR')) {
      return 'ATR'
    }
    
    return 'n/v'
  }

  const getAircraftCapacity = (type: string): number | null => {
    // KLM-specific aircraft capacity data
    const capacityMap: Record<string, number> = {
      // Airbus Aircraft
      '332': 268, // Airbus A330-200
      '333': 292, // Airbus A330-300
      '32N': 180, // Airbus A320neo
      '32Q': 232, // Airbus A321neo
      
      // Boeing Aircraft
      '772': 314, // Boeing 777-200ER
      '773': 408, // Boeing 777-300ER
      '77W': 408, // Boeing 777-300ER (alternative code)
      '789': 290, // Boeing 787-9
      '78W': 335, // Boeing 787-10
      '781': 335, // Boeing 787-10 (alternative code)
      '73H': 126, // Boeing 737-700
      '738': 162, // Boeing 737-800
      '73W': 178, // Boeing 737-900
      '73J': 178, // Boeing 737-900 (alternative code)
      '295': 178, // Boeing 737-900 (alternative code)
      
      // Embraer Aircraft (KLM Cityhopper)
      'E70': 76,  // Embraer 170
      'E75': 82,  // Embraer 175 (average of 76-88)
      'E90': 96,  // Embraer 190 (dual-class)
      'E7W': 120, // Embraer 195-E2
    }
    return capacityMap[type] || null
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

  const getPerformanceRating = (avgDelay: number): "Excellent" | "Good" | "Fair" | "Poor" => {
    if (avgDelay < 5) return "Excellent"
    if (avgDelay < 10) return "Good"
    if (avgDelay < 15) return "Fair"
    return "Poor"
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection(field === "avgDelay" ? "asc" : "desc")
    }
  }

  const filteredData = aircraftTableData

  const sortedData = [...filteredData].sort((a, b) => {
    let aVal: any = a[sortField]
    let bVal: any = b[sortField]

    if (sortField === "avgDelay" || sortField === "flights" || sortField === "capacity" || sortField === "onTimePercentage") {
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
    if (sortField !== field) return null
    return sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
  }

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case "Excellent":
        return "text-green-600 bg-green-50"
      case "Good":
        return "text-blue-600 bg-blue-50"
      case "Fair":
        return "text-yellow-600 bg-yellow-50"
      case "Poor":
        return "text-red-600 bg-red-50"
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

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded mb-4"></div>
        <div className="h-4 bg-gray-200 rounded mb-6"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Aircraft Fleet Details</h2>
        <p className="text-sm text-gray-600">Comprehensive aircraft performance data</p>
      </div>

      {/* Sort Controls */}
      <div className="flex flex-wrap gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
        <span className="text-sm font-medium text-gray-700 mr-2">Sort by:</span>
        <button
          onClick={() => handleSort("type")}
          className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium cursor-pointer transition-colors ${
            sortField === "type" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:text-gray-900 hover:bg-white"
          }`}
        >
          Type <SortIcon field="type" />
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
          onClick={() => handleSort("capacity")}
          className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium cursor-pointer transition-colors ${
            sortField === "capacity" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:text-gray-900 hover:bg-white"
          }`}
        >
          Capacity <SortIcon field="capacity" />
        </button>
        <button
          onClick={() => handleSort("onTimePercentage")}
          className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium cursor-pointer transition-colors ${
            sortField === "onTimePercentage" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:text-gray-900 hover:bg-white"
          }`}
        >
          On-Time % <SortIcon field="onTimePercentage" />
        </button>
      </div>

      {/* Responsive Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-1 2xl:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
        {sortedData.map((aircraft, index) => (
          <div
            key={index}
            className="border rounded-lg p-4 cursor-default transition-all duration-200 hover:shadow-md hover:border-gray-300 bg-white hover:bg-gray-50"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Plane className="h-4 w-4 text-gray-600" />
                <span className="font-bold text-gray-900 text-lg">{getAircraftDisplayName(aircraft.type)}</span>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPerformanceColor(aircraft.performance)}`}>
                {aircraft.performance}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Avg Delay</p>
                  <p className={`text-sm ${getDelayColor(aircraft.avgDelay)}`}>
                    {formatDelay(aircraft.avgDelay)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Flights</p>
                  <p className="text-sm text-gray-600">{formatValue(aircraft.flights)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 text-gray-500 flex items-center justify-center">
                  <span className="text-xs font-bold">C</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Capacity</p>
                  <p className="text-sm text-gray-600">{formatValue(aircraft.capacity)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 text-gray-500 flex items-center justify-center">
                  <span className="text-xs font-bold">✓</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">On-Time %</p>
                  <p className="text-sm text-gray-600">
                    {aircraft.onTimePercentage !== undefined ? `${aircraft.onTimePercentage.toFixed(1)}%` : 'n/v'}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500">Manufacturer:</span>
                <span className="text-xs text-gray-900">{aircraft.manufacturer}</span>
              </div>

              {aircraft.minDelay !== undefined && aircraft.maxDelay !== undefined && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500">Delay Range:</span>
                  <span className="text-xs text-gray-900">
                    {aircraft.minDelay.toFixed(1)} - {aircraft.maxDelay.toFixed(1)} min
                  </span>
                </div>
              )}

              <div className="flex items-start gap-2">
                <span className="text-xs font-medium text-gray-500">Routes:</span>
                <span className="text-xs text-gray-900 flex-1">{aircraft.routes || 'No route data'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-xs text-gray-500 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <span>Showing {sortedData.length} of {aircraftTableData.length} aircraft types</span>
        <span className="hidden sm:inline">•</span>
        <span>Data source: Schiphol Public Flight API v4.2</span>
      </div>
    </div>
  )
}
