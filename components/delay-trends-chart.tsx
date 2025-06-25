"use client"

import { useState } from "react"
import { BarChart3, LineChart, Info } from "lucide-react"

// Mock data representing realistic KLM delay patterns throughout the day
const hourlyDelayData = [
  { hour: "05:00", avgDelay: 3.2, flights: 4, variance: "Low" },
  { hour: "06:00", avgDelay: 5.1, flights: 8, variance: "Low" },
  { hour: "07:00", avgDelay: 12.3, flights: 10, variance: "Medium" },
  { hour: "08:00", avgDelay: 22.4, flights: 14, variance: "High" },
  { hour: "09:00", avgDelay: 18.7, flights: 12, variance: "High" },
  { hour: "10:00", avgDelay: 8.9, flights: 9, variance: "Medium" },
  { hour: "11:00", avgDelay: 6.2, flights: 7, variance: "Low" },
  { hour: "12:00", avgDelay: 9.1, flights: 8, variance: "Medium" },
  { hour: "13:00", avgDelay: 11.5, flights: 10, variance: "Medium" },
  { hour: "14:00", avgDelay: 15.8, flights: 11, variance: "Medium" },
  { hour: "15:00", avgDelay: 19.2, flights: 13, variance: "High" },
  { hour: "16:00", avgDelay: 16.4, flights: 12, variance: "Medium" },
  { hour: "17:00", avgDelay: 13.7, flights: 9, variance: "Medium" },
  { hour: "18:00", avgDelay: 10.3, flights: 8, variance: "Low" },
  { hour: "19:00", avgDelay: 7.8, flights: 6, variance: "Low" },
  { hour: "20:00", avgDelay: 4.5, flights: 4, variance: "Low" },
  { hour: "21:00", avgDelay: 2.1, flights: 2, variance: "Low" },
]

export function DelayTrendsChart() {
  const [selectedHour, setSelectedHour] = useState<string | null>(null)
  const [viewType, setViewType] = useState<"delay" | "flights">("delay")

  const maxDelay = Math.max(...hourlyDelayData.map((d) => d.avgDelay))
  const maxFlights = Math.max(...hourlyDelayData.map((d) => d.flights))

  const getBarHeight = (value: number, max: number) => {
    return Math.max((value / max) * 200, 4) // Minimum 4px height
  }

  const getDelayColor = (delay: number, variance: string) => {
    if (variance === "High") return "bg-red-500 hover:bg-red-600"
    if (delay > 15) return "bg-orange-500 hover:bg-orange-600"
    if (delay > 8) return "bg-yellow-500 hover:bg-yellow-600"
    return "bg-green-500 hover:bg-green-600"
  }

  const getFlightColor = (flights: number) => {
    if (flights > 12) return "bg-blue-600 hover:bg-blue-700"
    if (flights > 8) return "bg-blue-500 hover:bg-blue-600"
    if (flights > 5) return "bg-blue-400 hover:bg-blue-500"
    return "bg-blue-300 hover:bg-blue-400"
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Hourly Delay Patterns</h2>
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
            <LineChart className="h-4 w-4" />
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
                      {viewType === "delay" ? `${data.avgDelay.toFixed(1)}m` : data.flights}
                    </span>
                  </div>
                  <div
                    className={`w-6 sm:w-8 md:w-10 rounded-t transition-all duration-200 ${colorClass} ${
                      isSelected ? "ring-2 ring-blue-500 ring-offset-2" : ""
                    }`}
                    style={{ height: `${height}px` }}
                    onClick={() => setSelectedHour(isSelected ? null : data.hour)}
                    title={`${data.hour}: ${viewType === "delay" ? `${data.avgDelay.toFixed(1)} min avg delay` : `${data.flights} flights`}`}
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
                      <p className="text-blue-900">{data.avgDelay.toFixed(1)} minutes</p>
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">Total Flights:</span>
                      <p className="text-blue-900">{data.flights} departures</p>
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
