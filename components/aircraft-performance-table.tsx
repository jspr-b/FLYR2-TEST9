"use client"

import { useState } from "react"
import { ChevronUp, ChevronDown, Plane, Clock, Users } from "lucide-react"

const aircraftTableData = [
  {
    type: "A321neo",
    manufacturer: "Airbus",
    category: "Narrow-body",
    avgDelay: 3.2,
    flights: 8,
    arrivals: 4,
    departures: 4,
    capacity: 220,
    routes: "New, fuel-efficient",
    performance: "Excellent",
  },
  {
    type: "B737-800",
    manufacturer: "Boeing",
    category: "Narrow-body",
    avgDelay: 8.4,
    flights: 31,
    arrivals: 16,
    departures: 15,
    capacity: 186,
    routes: "Primary intra-Europe",
    performance: "Good",
  },
  {
    type: "B787-9",
    manufacturer: "Boeing",
    category: "Wide-body",
    avgDelay: 11.7,
    flights: 13,
    arrivals: 7,
    departures: 6,
    capacity: 294,
    routes: "Dreamliner",
    performance: "Fair",
  },
  {
    type: "B787-10",
    manufacturer: "Boeing",
    category: "Wide-body",
    avgDelay: 12.3,
    flights: 11,
    arrivals: 5,
    departures: 6,
    capacity: 344,
    routes: "Biggest Dreamliner variant",
    performance: "Fair",
  },
  {
    type: "B777-300ER",
    manufacturer: "Boeing",
    category: "Wide-body",
    avgDelay: 14.2,
    flights: 16,
    arrivals: 8,
    departures: 8,
    capacity: 408,
    routes: "High-capacity long-haul",
    performance: "Fair",
  },
  {
    type: "B777-200ER",
    manufacturer: "Boeing",
    category: "Wide-body",
    avgDelay: 15.8,
    flights: 15,
    arrivals: 7,
    departures: 8,
    capacity: 318,
    routes: "Long-haul, being replaced",
    performance: "Poor",
  },
  {
    type: "B737-700",
    manufacturer: "Boeing",
    category: "Narrow-body",
    avgDelay: 16.4,
    flights: 6,
    arrivals: 3,
    departures: 3,
    capacity: 149,
    routes: "Older generation",
    performance: "Poor",
  },
  {
    type: "B737-900",
    manufacturer: "Boeing",
    category: "Narrow-body",
    avgDelay: 17.1,
    flights: 5,
    arrivals: 2,
    departures: 3,
    capacity: 189,
    routes: "Larger narrowbody",
    performance: "Poor",
  },
  {
    type: "A330-300",
    manufacturer: "Airbus",
    category: "Wide-body",
    avgDelay: 18.6,
    flights: 5,
    arrivals: 2,
    departures: 3,
    capacity: 292,
    routes: "Medium-haul workhorse",
    performance: "Poor",
  },
  {
    type: "A330-200",
    manufacturer: "Airbus",
    category: "Wide-body",
    avgDelay: 19.8,
    flights: 6,
    arrivals: 3,
    departures: 3,
    capacity: 243,
    routes: "Due for retirement",
    performance: "Poor",
  },
]

type SortField = "type" | "manufacturer" | "category" | "avgDelay" | "flights" | "capacity"
type SortDirection = "asc" | "desc"

export function AircraftPerformanceTable() {
  const [sortField, setSortField] = useState<SortField>("avgDelay")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [filterCategory, setFilterCategory] = useState<string>("All")

  const categories = ["All", "Narrow-body", "Wide-body"]
  const manufacturers = ["All", "Airbus", "Boeing"]

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection(field === "avgDelay" ? "asc" : "desc")
    }
  }

  const filteredData = aircraftTableData.filter(
    (aircraft) => filterCategory === "All" || aircraft.category === filterCategory,
  )

  const sortedData = [...filteredData].sort((a, b) => {
    let aVal: any = a[sortField]
    let bVal: any = b[sortField]

    if (sortField === "avgDelay" || sortField === "flights" || sortField === "capacity") {
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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Regional":
        return "text-green-600 bg-green-50"
      case "Narrow-body":
        return "text-blue-600 bg-blue-50"
      case "Wide-body":
        return "text-purple-600 bg-purple-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  const getDelayColor = (avgDelay: number) => {
    if (avgDelay > 15) return "text-red-600"
    if (avgDelay > 10) return "text-orange-600"
    if (avgDelay > 5) return "text-yellow-600"
    return "text-green-600"
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Aircraft Fleet Performance</h2>
        <p className="text-sm text-gray-600">Detailed breakdown by aircraft type and specifications</p>
      </div>

      {/* Filters and Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Filter:</span>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-1.5 rounded border border-gray-300 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
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
              sortField === "avgDelay"
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:text-gray-900 hover:bg-white"
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
              sortField === "capacity"
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:text-gray-900 hover:bg-white"
            }`}
          >
            Capacity <SortIcon field="capacity" />
          </button>
        </div>
      </div>

      {/* Responsive Card Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
        {sortedData.map((aircraft, index) => (
          <div
            key={index}
            className="border rounded-lg p-4 cursor-default transition-all duration-200 hover:shadow-md hover:border-gray-300 bg-white hover:bg-gray-50"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Plane className="h-4 w-4 text-gray-600" />
                <span className="font-bold text-gray-900 text-lg">{aircraft.type}</span>
              </div>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getPerformanceColor(aircraft.performance)}`}
              >
                {aircraft.performance}
              </span>
            </div>

            <div className="mb-3">
              <span
                className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(aircraft.category)}`}
              >
                {aircraft.category}
              </span>
            </div>

            <div className="mb-3">
              <span className="text-xs text-gray-500 block mb-1">Manufacturer</span>
              <span className="text-sm font-medium text-gray-900">{aircraft.manufacturer}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <span className="text-xs text-gray-500 block mb-1">Avg Delay</span>
                <span className={`text-lg font-bold ${getDelayColor(aircraft.avgDelay)}`}>
                  {aircraft.avgDelay.toFixed(1)}m
                </span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block mb-1">Total Flights</span>
                <span className="text-lg font-bold text-gray-900">{aircraft.flights}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <span className="text-xs text-gray-500 block mb-1">Arrivals</span>
                <div className="flex items-center gap-1">
                  <Plane className="h-3 w-3 text-blue-600 transform rotate-180" />
                  <span className="text-sm font-medium text-gray-900">{aircraft.arrivals}</span>
                </div>
              </div>
              <div>
                <span className="text-xs text-gray-500 block mb-1">Departures</span>
                <div className="flex items-center gap-1">
                  <Plane className="h-3 w-3 text-green-600" />
                  <span className="text-sm font-medium text-gray-900">{aircraft.departures}</span>
                </div>
              </div>
            </div>

            <div className="mb-3">
              <span className="text-xs text-gray-500 block mb-1">Capacity</span>
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">{aircraft.capacity} seats</span>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100">
              <div className="text-xs text-gray-500">
                <div className="flex items-center gap-1 mb-1">
                  <Clock className="h-3 w-3" />
                  <span>Fleet Notes: {aircraft.routes}</span>
                </div>
                <span>{((aircraft.flights / 116) * 100).toFixed(1)}% of daily fleet operations</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-xs text-gray-500 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <span>
          Showing {sortedData.length} of {aircraftTableData.length} aircraft types
        </span>
        <span className="hidden sm:inline">•</span>
        <span>Data source: KLM Fleet Management System</span>
      </div>
    </div>
  )
}
