"use client"

import { useState } from "react"
import { Building2, Info } from "lucide-react"

const pierData = [
  {
    pier: "Pier B",
    flights: 8,
    arrivals: 4,
    departures: 4,
    utilization: 67,
    status: "Medium",
    type: "Schengen",
    purpose: "Short-haul European",
  },
  {
    pier: "Pier C",
    flights: 12,
    arrivals: 6,
    departures: 6,
    utilization: 75,
    status: "High",
    type: "Schengen",
    purpose: "European (Schengen)",
  },
  {
    pier: "Pier D (Schengen)",
    flights: 15,
    arrivals: 8,
    departures: 7,
    utilization: 83,
    status: "High",
    type: "Schengen",
    purpose: "European gates",
  },
  {
    pier: "Pier D (Non-Schengen)",
    flights: 9,
    arrivals: 4,
    departures: 5,
    utilization: 60,
    status: "Medium",
    type: "Non-Schengen",
    purpose: "Mixed-use",
  },
  {
    pier: "Pier E",
    flights: 18,
    arrivals: 9,
    departures: 9,
    utilization: 90,
    status: "High",
    type: "Non-Schengen",
    purpose: "Intercontinental",
  },
  {
    pier: "Pier F",
    flights: 22,
    arrivals: 11,
    departures: 11,
    utilization: 92,
    status: "High",
    type: "Non-Schengen",
    purpose: "Long-haul KLM",
  },
  {
    pier: "Pier G",
    flights: 14,
    arrivals: 7,
    departures: 7,
    utilization: 78,
    status: "High",
    type: "Non-Schengen",
    purpose: "SkyTeam/KLM long-haul",
  },
  {
    pier: "Pier H&M",
    flights: 7,
    arrivals: 3,
    departures: 4,
    utilization: 58,
    status: "Medium",
    type: "Schengen",
    purpose: "Low-cost carriers",
  },
]

export function TerminalsChart() {
  const [selectedPier, setSelectedPier] = useState<string | null>(null)

  const maxFlights = Math.max(...pierData.map((d) => d.flights))

  const getBarHeight = (flights: number) => {
    return Math.max((flights / maxFlights) * 200, 8)
  }

  const getUtilizationColor = (utilization: number, status: string, type: string) => {
    const baseColor = type === "Schengen" ? "blue" : "purple"
    if (status === "High" || utilization > 80) return `bg-red-500 hover:bg-red-600`
    if (utilization > 60) return `bg-yellow-500 hover:bg-yellow-600`
    return `bg-${baseColor}-500 hover:bg-${baseColor}-600`
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

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 min-h-[500px] lg:min-h-[600px]">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Building2 className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Pier Usage Overview</h2>
        </div>
        <p className="text-sm text-gray-600">Click bars for detailed breakdown</p>
      </div>

      <div className="relative mb-8">
        {/* Chart Area - Responsive for all screen sizes */}
        <div className="relative overflow-x-auto">
          <div className="flex items-end justify-center min-w-[600px] sm:min-w-0 gap-3 sm:gap-4 md:gap-6 lg:gap-8 h-80 lg:h-96 mb-8 px-2">
            {pierData.map((data, index) => {
              const isSelected = selectedPier === data.pier
              const height = getBarHeight(data.flights)
              const colorClass = getUtilizationColor(data.utilization, data.status, data.type)

              return (
                <div key={index} className="flex flex-col items-center group cursor-pointer">
                  <div className="text-center mb-2">
                    <span className="text-xs sm:text-sm font-medium text-gray-900">{data.flights}</span>
                    <span className="text-xs text-gray-500 block">flights</span>
                  </div>
                  <div
                    className={`w-12 sm:w-16 md:w-20 rounded-t transition-all duration-200 ${colorClass} ${
                      isSelected ? "ring-2 ring-blue-500 ring-offset-2" : ""
                    }`}
                    style={{ height: `${height}px` }}
                    onClick={() => setSelectedPier(isSelected ? null : data.pier)}
                    title={`${data.pier}: ${data.flights} flights (${data.utilization}% utilization)`}
                  />
                  <div className="mt-3 text-center">
                    <span className="text-xs sm:text-sm font-medium text-gray-900 block">
                      {data.pier === "Pier D (Schengen)"
                        ? "D-Sch"
                        : data.pier === "Pier D (Non-Schengen)"
                          ? "D-Non"
                          : data.pier.replace("Pier ", "")}
                    </span>
                    <span
                      className={`inline-block px-1.5 sm:px-2 py-1 rounded-full text-xs font-medium mt-1 ${getStatusColor(data.status)}`}
                    >
                      {data.utilization}%
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

      {/* Selected Terminal Details */}
      {selectedPier && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-blue-900 mb-2">{selectedPier} Details</h3>
              {(() => {
                const data = pierData.find((d) => d.pier === selectedPier)
                if (!data) return null
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700 font-medium">Total Flights:</span>
                      <p className="text-blue-900">{data.flights}</p>
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">Arrivals:</span>
                      <p className="text-blue-900">{data.arrivals}</p>
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">Departures:</span>
                      <p className="text-blue-900">{data.departures}</p>
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">Utilization:</span>
                      <p
                        className={`font-medium ${
                          data.utilization > 80
                            ? "text-red-600"
                            : data.utilization > 60
                              ? "text-yellow-600"
                              : "text-green-600"
                        }`}
                      >
                        {data.utilization}%
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
          <span className="text-gray-600">Low Utilization (&lt;60%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-500 rounded"></div>
          <span className="text-gray-600">Medium Utilization (60-80%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span className="text-gray-600">High Utilization (&gt;80%)</span>
        </div>
      </div>
    </div>
  )
}
