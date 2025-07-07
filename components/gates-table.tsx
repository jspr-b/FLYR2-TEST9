"use client"

import { useState, useEffect } from "react"
import { ArrowUpDown, Plane, Clock, AlertTriangle } from "lucide-react"

interface GateData {
  gate: string
  flights: number | null
  aircraftTypes: string[]
  status: "Active" | "Inactive" | "Maintenance"
  lastActivity: string
  utilization: number | null
  pier: string
}

interface FlightData {
  flightName: string
  flightNumber: number
  gate: string
  pier: string
  publicFlightState: {
    flightStates: string[]
  }
  aircraftType: {
    iataMain: string
    iataSub: string
  }
  scheduleDateTime: string
}

export function GatesTable() {
  const [isLoading, setIsLoading] = useState(true)
  const [gateData, setGateData] = useState<GateData[]>([])
  const [sortField, setSortField] = useState<keyof GateData>("flights")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const today = new Date().toISOString().split('T')[0]
        const response = await fetch(`/api/flights?filters=%7B%22flightDirection%22%3A%22D%22%2C%22scheduleDate%22%3A%22${today}%22%2C%22isOperationalFlight%22%3Atrue%2C%22prefixicao%22%3A%22KL%22%7D`)
        if (!response.ok) {
          throw new Error('Failed to fetch flights data')
        }
        
        const data = await response.json()
        const flights: FlightData[] = data.flights || []
        
        // Calculate gate statistics from real flight data
        const gateStats = flights.reduce((acc, flight) => {
          if (flight.gate) {
            if (!acc[flight.gate]) {
              acc[flight.gate] = {
                gate: flight.gate,
                flights: 0,
                aircraftTypes: [],
                status: "Active" as const,
                lastActivity: "",
                utilization: 0,
                pier: flight.pier || "Unknown"
              }
            }
            
            acc[flight.gate].flights += 1
            
            // Add aircraft type if not already present
            const aircraftType = flight.aircraftType?.iataSub || flight.aircraftType?.iataMain || "Unknown"
            if (!acc[flight.gate].aircraftTypes.includes(aircraftType)) {
              acc[flight.gate].aircraftTypes.push(aircraftType)
            }
            
            // Update last activity (most recent schedule time)
            const scheduleTime = new Date(flight.scheduleDateTime)
            if (!acc[flight.gate].lastActivity || scheduleTime > new Date(acc[flight.gate].lastActivity)) {
              acc[flight.gate].lastActivity = scheduleTime.toISOString()
            }
          }
          return acc
        }, {} as Record<string, GateData>)
        
        // Calculate utilization and determine status for each gate
        const transformedGateData: GateData[] = Object.values(gateStats).map(gate => {
          // Simplified utilization calculation (flights per gate as percentage of total)
          const totalFlights = flights.length
          const utilization = totalFlights > 0 ? Math.round((gate.flights / totalFlights) * 100) : 0
          
          // Determine status based on flights and utilization
          let status: "Active" | "Inactive" | "Maintenance" = "Active"
          if (gate.flights === 0) status = "Inactive"
          else if (utilization > 15) status = "Maintenance" // High utilization might indicate maintenance needed
          
          return {
            ...gate,
            utilization,
            status
          }
        }).sort((a, b) => (b.flights || 0) - (a.flights || 0))
        .slice(0, 10) // Only show top 10 gates

        setGateData(transformedGateData)
      } catch (error) {
        console.error("Error fetching gate data:", error)
        // Fallback to placeholder data
        const fallbackGateData: GateData[] = [
          {
            gate: "D1",
            flights: null,
            aircraftTypes: [],
            status: "Active",
            lastActivity: "",
            utilization: null,
            pier: "D"
          },
          {
            gate: "B2",
            flights: null,
            aircraftTypes: [],
            status: "Inactive",
            lastActivity: "",
            utilization: null,
            pier: "B"
          },
          {
            gate: "E3",
            flights: null,
            aircraftTypes: [],
            status: "Maintenance",
            lastActivity: "",
            utilization: null,
            pier: "E"
          }
        ]
        setGateData(fallbackGateData)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleSort = (field: keyof GateData) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const sortedData = [...gateData].sort((a, b) => {
    const aValue = a[sortField]
    const bValue = b[sortField]
    
    if (aValue === null && bValue === null) return 0
    if (aValue === null) return 1
    if (bValue === null) return -1
    
    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue
    }
    
    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc" 
        ? aValue.localeCompare(bValue) 
        : bValue.localeCompare(aValue)
    }
    
    return 0
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "text-green-600 bg-green-50"
      case "Inactive":
        return "text-gray-600 bg-gray-50"
      case "Maintenance":
        return "text-red-600 bg-red-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  const formatTime = (isoString: string) => {
    if (!isoString) return "n/v"
    try {
      const date = new Date(isoString)
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      })
    } catch {
      return "n/v"
    }
  }

  const formatValue = (value: number | null) => {
    return value !== null ? value.toString() : "n/v"
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded mb-4"></div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {[...Array(6)].map((_, index) => (
                  <th key={index} className="h-4 bg-gray-200 rounded mb-2"></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, rowIndex) => (
                <tr key={rowIndex}>
                  {[...Array(6)].map((_, colIndex) => (
                    <td key={colIndex} className="h-4 bg-gray-200 rounded mb-2"></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Plane className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Gate Activity</h2>
        </div>
        <p className="text-sm text-gray-600">Real-time gate utilization and status</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-2 font-medium text-gray-900">
                <button
                  onClick={() => handleSort("gate")}
                  className="flex items-center gap-1 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  Gate
                  <ArrowUpDown className="h-4 w-4" />
                </button>
              </th>
              <th className="text-left py-3 px-2 font-medium text-gray-900">
                <button
                  onClick={() => handleSort("flights")}
                  className="flex items-center gap-1 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  Flights
                  <ArrowUpDown className="h-4 w-4" />
                </button>
              </th>
              <th className="text-left py-3 px-2 font-medium text-gray-900">
                Aircraft Types
              </th>
              <th className="text-left py-3 px-2 font-medium text-gray-900">
                <button
                  onClick={() => handleSort("utilization")}
                  className="flex items-center gap-1 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  Utilization
                  <ArrowUpDown className="h-4 w-4" />
                </button>
              </th>
              <th className="text-left py-3 px-2 font-medium text-gray-900">
                <button
                  onClick={() => handleSort("status")}
                  className="flex items-center gap-1 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  Status
                  <ArrowUpDown className="h-4 w-4" />
                </button>
              </th>
              <th className="text-left py-3 px-2 font-medium text-gray-900">
                <button
                  onClick={() => handleSort("lastActivity")}
                  className="flex items-center gap-1 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  Last Activity
                  <ArrowUpDown className="h-4 w-4" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((gate, index) => (
              <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-default">
                <td className="py-3 px-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{gate.gate}</span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {gate.pier}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-2">
                  <span className="font-medium text-gray-900">{formatValue(gate.flights)}</span>
                </td>
                <td className="py-3 px-2">
                  <div className="flex flex-wrap gap-1">
                    {gate.aircraftTypes.length > 0 ? (
                      gate.aircraftTypes.slice(0, 3).map((type, typeIndex) => (
                        <span
                          key={typeIndex}
                          className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                        >
                          {type}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400 text-sm">n/v</span>
                    )}
                    {gate.aircraftTypes.length > 3 && (
                      <span className="text-xs text-gray-500">+{gate.aircraftTypes.length - 3}</span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-2">
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${gate.utilization || 0}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600">{formatValue(gate.utilization)}%</span>
                  </div>
                </td>
                <td className="py-3 px-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(gate.status)}`}
                  >
                    {gate.status === "Maintenance" && <AlertTriangle className="h-3 w-3" />}
                    {gate.status === "Active" && <Clock className="h-3 w-3" />}
                    {gate.status}
                  </span>
                </td>
                <td className="py-3 px-2">
                  <span className="text-sm text-gray-600">{formatTime(gate.lastActivity)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sortedData.length === 0 && (
        <div className="text-center py-8">
          <Plane className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No gate data available</p>
        </div>
      )}
    </div>
  )
}
