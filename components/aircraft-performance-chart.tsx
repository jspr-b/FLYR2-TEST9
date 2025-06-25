"use client"

import { useState } from "react"
import { Info, BarChart3, TrendingUp } from "lucide-react"

const aircraftData = [
  {
    type: "A321neo",
    avgDelay: 3.2,
    flights: 8,
    arrivals: 4,
    departures: 4,
    category: "Narrow-body",
    manufacturer: "Airbus",
    capacity: "220 seats",
    routes: "New, fuel-efficient",
  },
  {
    type: "B737-800",
    avgDelay: 8.4,
    flights: 31,
    arrivals: 16,
    departures: 15,
    category: "Narrow-body",
    manufacturer: "Boeing",
    capacity: "186 seats",
    routes: "Primary intra-Europe",
  },
  {
    type: "B787-9",
    avgDelay: 11.7,
    flights: 13,
    arrivals: 7,
    departures: 6,
    category: "Wide-body",
    manufacturer: "Boeing",
    capacity: "294 seats",
    routes: "Dreamliner",
  },
  {
    type: "B787-10",
    avgDelay: 12.3,
    flights: 11,
    arrivals: 5,
    departures: 6,
    category: "Wide-body",
    manufacturer: "Boeing",
    capacity: "344 seats",
    routes: "Biggest Dreamliner variant",
  },
  {
    type: "B777-300ER",
    avgDelay: 14.2,
    flights: 16,
    arrivals: 8,
    departures: 8,
    category: "Wide-body",
    manufacturer: "Boeing",
    capacity: "408 seats",
    routes: "High-capacity long-haul",
  },
  {
    type: "B777-200ER",
    avgDelay: 15.8,
    flights: 15,
    arrivals: 7,
    departures: 8,
    category: "Wide-body",
    manufacturer: "Boeing",
    capacity: "318 seats",
    routes: "Long-haul, being replaced",
  },
  {
    type: "B737-700",
    avgDelay: 16.4,
    flights: 6,
    arrivals: 3,
    departures: 3,
    category: "Narrow-body",
    manufacturer: "Boeing",
    capacity: "149 seats",
    routes: "Older generation",
  },
  {
    type: "B737-900",
    avgDelay: 17.1,
    flights: 5,
    arrivals: 2,
    departures: 3,
    category: "Narrow-body",
    manufacturer: "Boeing",
    capacity: "189 seats",
    routes: "Larger narrowbody",
  },
  {
    type: "A330-300",
    avgDelay: 18.6,
    flights: 5,
    arrivals: 2,
    departures: 3,
    category: "Wide-body",
    manufacturer: "Airbus",
    capacity: "292 seats",
    routes: "Medium-haul workhorse",
  },
  {
    type: "A330-200",
    avgDelay: 19.8,
    flights: 6,
    arrivals: 3,
    departures: 3,
    category: "Wide-body",
    manufacturer: "Airbus",
    capacity: "243 seats",
    routes: "Due for retirement",
  },
]

export function AircraftPerformanceChart() {
  const [selectedAircraft, setSelectedAircraft] = useState<string | null>(
    aircraftData.reduce((best, current) => (current.avgDelay < best.avgDelay ? current : best)).type,
  )
  const [viewType, setViewType] = useState<"delay" | "flights">("delay")

  const maxDelay = Math.max(...aircraftData.map((d) => d.avgDelay))
  const maxFlights = Math.max(...aircraftData.map((d) => d.flights))

  const getBarHeight = (value: number, max: number) => {
    return Math.max((value / max) * 200, 8)
  }

  const getDelayColor = (delay: number, category: string) => {
    if (delay > 15) return "bg-red-500 hover:bg-red-600"
    if (delay > 10) return "bg-orange-500 hover:bg-orange-600"
    if (delay > 5) return "bg-yellow-500 hover:bg-yellow-600"
    return "bg-green-500 hover:bg-green-600"
  }

  const getFlightColor = (flights: number) => {
    if (flights > 25) return "bg-blue-600 hover:bg-blue-700"
    if (flights > 15) return "bg-blue-500 hover:bg-blue-600"
    if (flights > 10) return "bg-blue-400 hover:bg-blue-500"
    return "bg-blue-300 hover:bg-blue-400"
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
                viewType === "delay" ? getDelayColor(data.avgDelay, data.category) : getFlightColor(data.flights)

              return (
                <div key={index} className="flex flex-col items-center group cursor-pointer">
                  <div className="text-center mb-2">
                    <span className="text-xs sm:text-sm font-medium text-gray-900">
                      {viewType === "delay" ? `${data.avgDelay.toFixed(1)}m` : data.flights}
                    </span>
                  </div>
                  <div
                    className={`w-8 sm:w-10 md:w-12 lg:w-16 rounded-t transition-all duration-200 ${colorClass} ${
                      isSelected ? "ring-2 ring-blue-500 ring-offset-2" : ""
                    }`}
                    style={{ height: `${height}px` }}
                    onClick={() => setSelectedAircraft(data.type)}
                    title={`${data.type}: ${viewType === "delay" ? `${data.avgDelay.toFixed(1)} min avg delay` : `${data.flights} flights`}`}
                  />
                  <div className="mt-3 text-center">
                    <span className="text-xs sm:text-sm font-bold text-gray-900 block">{data.type}</span>
                    <span
                      className={`inline-block px-1.5 sm:px-2 py-1 rounded-full text-xs font-medium mt-1 ${getCategoryColor(data.category)}`}
                    >
                      {data.category}
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
            <div>
              <h3 className="font-medium text-blue-900 mb-2">{selectedAircraft} Details</h3>
              {(() => {
                const data = aircraftData.find((d) => d.type === selectedAircraft)
                if (!data) return null
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700 font-medium">Average Delay:</span>
                      <p className="text-blue-900">{data.avgDelay.toFixed(1)} minutes</p>
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">Total Flights:</span>
                      <p className="text-blue-900">{data.flights}</p>
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">Manufacturer:</span>
                      <p className="text-blue-900">{data.manufacturer}</p>
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">Avg Capacity:</span>
                      <p className="text-blue-900">{data.capacity}</p>
                    </div>
                    <div className="sm:col-span-2 lg:col-span-4">
                      <span className="text-blue-700 font-medium">Fleet Notes:</span>
                      <p className="text-blue-900">{data.routes}</p>
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
          <span className="text-gray-600">Very High Delay (&gt;15 min)</span>
        </div>
      </div>
    </div>
  )
}
