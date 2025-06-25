"use client"

import { useState } from "react"
import { ChevronUp, ChevronDown, DoorOpen, Plane, Clock } from "lucide-react"

const gateData = [
  {
    gate: "F07",
    pier: "Pier F",
    flights: 4,
    arrivals: 2,
    departures: 2,
    avgTurnaround: 120,
    status: "Busy",
    nextFlight: "14:30",
    type: "Non-Schengen",
    purpose: "Long-haul KLM",
  },
  {
    gate: "E18",
    pier: "Pier E",
    flights: 3,
    arrivals: 1,
    departures: 2,
    avgTurnaround: 135,
    status: "Active",
    nextFlight: "15:15",
    type: "Non-Schengen",
    purpose: "Intercontinental",
  },
  {
    gate: "G03",
    pier: "Pier G",
    flights: 3,
    arrivals: 2,
    departures: 1,
    avgTurnaround: 125,
    status: "Active",
    nextFlight: "16:00",
    type: "Non-Schengen",
    purpose: "SkyTeam/KLM long-haul",
  },
  {
    gate: "D12",
    pier: "Pier D (Schengen)",
    flights: 6,
    arrivals: 3,
    departures: 3,
    avgTurnaround: 45,
    status: "Busy",
    nextFlight: "14:45",
    type: "Schengen",
    purpose: "European gates",
  },
  {
    gate: "C05",
    pier: "Pier C",
    flights: 5,
    arrivals: 3,
    departures: 2,
    avgTurnaround: 38,
    status: "Active",
    nextFlight: "17:20",
    type: "Schengen",
    purpose: "European (Schengen)",
  },
  {
    gate: "B23",
    pier: "Pier B",
    flights: 4,
    arrivals: 2,
    departures: 2,
    avgTurnaround: 35,
    status: "Normal",
    nextFlight: "15:30",
    type: "Schengen",
    purpose: "Short-haul European",
  },
  {
    gate: "D67",
    pier: "Pier D (Non-Schengen)",
    flights: 3,
    arrivals: 1,
    departures: 2,
    avgTurnaround: 85,
    status: "Normal",
    nextFlight: "16:45",
    type: "Non-Schengen",
    purpose: "Mixed-use",
  },
  {
    gate: "H04",
    pier: "Pier H&M",
    flights: 5,
    arrivals: 2,
    departures: 3,
    avgTurnaround: 32,
    status: "Active",
    nextFlight: "18:00",
    type: "Schengen",
    purpose: "Low-cost carriers",
  },
  {
    gate: "F12",
    pier: "Pier F",
    flights: 3,
    arrivals: 1,
    departures: 2,
    avgTurnaround: 110,
    status: "Normal",
    nextFlight: "19:15",
    type: "Non-Schengen",
    purpose: "Long-haul KLM",
  },
]

type SortField = "gate" | "pier" | "flights" | "avgTurnaround" | "status"
type SortDirection = "asc" | "desc"

export function GatesTable() {
  const [sortField, setSortField] = useState<SortField>("flights")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [filterTerminal, setFilterTerminal] = useState<string>("All")

  const piers = [
    "All",
    "Pier B",
    "Pier C",
    "Pier D (Schengen)",
    "Pier D (Non-Schengen)",
    "Pier E",
    "Pier F",
    "Pier G",
    "Pier H&M",
  ]
  const types = ["All", "Schengen", "Non-Schengen"]

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const filteredData = gateData.filter((gate) => filterTerminal === "All" || gate.pier === filterTerminal)

  const sortedData = [...filteredData].sort((a, b) => {
    let aVal: any = a[sortField]
    let bVal: any = b[sortField]

    if (sortField === "flights" || sortField === "avgTurnaround") {
      aVal = Number(aVal)
      bVal = Number(bVal)
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Busy":
        return "text-red-600 bg-red-50"
      case "Active":
        return "text-yellow-600 bg-yellow-50"
      case "Normal":
        return "text-green-600 bg-green-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  const getFlightColor = (flights: number) => {
    if (flights >= 7) return "text-red-600"
    if (flights >= 5) return "text-yellow-600"
    return "text-green-600"
  }

  const getTerminalColor = (terminal: string) => {
    switch (terminal) {
      case "Pier B":
        return "text-blue-600 bg-blue-50"
      case "Pier C":
        return "text-purple-600 bg-purple-50"
      case "Pier D (Schengen)":
        return "text-green-600 bg-green-50"
      case "Pier D (Non-Schengen)":
        return "text-orange-600 bg-orange-50"
      case "Pier E":
        return "text-pink-600 bg-pink-50"
      case "Pier F":
        return "text-teal-600 bg-teal-50"
      case "Pier G":
        return "text-lime-600 bg-lime-50"
      case "Pier H&M":
        return "text-indigo-600 bg-indigo-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-2">
          <DoorOpen className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Gate Activity by Pier</h2>
        </div>
        <p className="text-sm text-gray-600">Real-time gate utilization and scheduling</p>
      </div>

      {/* Filters and Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Filter:</span>
          <select
            value={filterTerminal}
            onChange={(e) => setFilterTerminal(e.target.value)}
            className="px-3 py-1.5 rounded border border-gray-300 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {piers.map((terminal) => (
              <option key={terminal} value={terminal}>
                {terminal}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-medium text-gray-700 mr-2">Sort by:</span>
          <button
            onClick={() => handleSort("gate")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium cursor-pointer transition-colors ${
              sortField === "gate" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:text-gray-900 hover:bg-white"
            }`}
          >
            Gate <SortIcon field="gate" />
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
            onClick={() => handleSort("avgTurnaround")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium cursor-pointer transition-colors ${
              sortField === "avgTurnaround"
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:text-gray-900 hover:bg-white"
            }`}
          >
            Turnaround <SortIcon field="avgTurnaround" />
          </button>
          <button
            onClick={() => handleSort("status")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium cursor-pointer transition-colors ${
              sortField === "status" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:text-gray-900 hover:bg-white"
            }`}
          >
            Status <SortIcon field="status" />
          </button>
        </div>
      </div>

      {/* Responsive Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
        {sortedData.map((gate, index) => (
          <div
            key={index}
            className="border rounded-lg p-4 cursor-default transition-all duration-200 hover:shadow-md hover:border-gray-300 bg-white hover:bg-gray-50"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <DoorOpen className="h-4 w-4 text-gray-600" />
                <span className="font-bold text-gray-900 text-lg">{gate.gate}</span>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(gate.status)}`}>
                {gate.status}
              </span>
            </div>

            <div className="mb-3">
              <span
                className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getTerminalColor(gate.pier)}`}
              >
                {gate.pier}
              </span>
            </div>

            <div className="mb-3">
              <span className="text-xs text-gray-500 block mb-1">Type</span>
              <span className="text-sm font-medium text-gray-900">{gate.type}</span>
            </div>

            <div className="mb-3">
              <span className="text-xs text-gray-500 block mb-1">Purpose</span>
              <span className="text-sm font-medium text-gray-900">{gate.purpose}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <span className="text-xs text-gray-500 block mb-1">Total Flights</span>
                <span className={`text-lg font-bold ${getFlightColor(gate.flights)}`}>{gate.flights}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block mb-1">Avg Turnaround</span>
                <span className="text-lg font-bold text-gray-900">{gate.avgTurnaround}m</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <span className="text-xs text-gray-500 block mb-1">Arrivals</span>
                <div className="flex items-center gap-1">
                  <Plane className="h-3 w-3 text-blue-600 transform rotate-180" />
                  <span className="text-sm font-medium text-gray-900">{gate.arrivals}</span>
                </div>
              </div>
              <div>
                <span className="text-xs text-gray-500 block mb-1">Departures</span>
                <div className="flex items-center gap-1">
                  <Plane className="h-3 w-3 text-green-600" />
                  <span className="text-sm font-medium text-gray-900">{gate.departures}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>Next: {gate.nextFlight}</span>
                </div>
                <span>{((gate.flights / 51) * 100).toFixed(1)}% of daily gates</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-xs text-gray-500 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <span>
          Showing {sortedData.length} of {gateData.length} active gates
        </span>
        <span className="hidden sm:inline">•</span>
        <span>Data source: Schiphol Public Flight API v4.2</span>
      </div>
    </div>
  )
}
