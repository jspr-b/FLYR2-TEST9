"use client"

import { useState } from "react"
import { ChevronUp, ChevronDown, AlertTriangle } from "lucide-react"

const tableData = [
  { hour: "05:00-06:00", avgDelay: 3.2, flights: 4, variance: "Low", flagged: false },
  { hour: "06:00-07:00", avgDelay: 5.1, flights: 8, variance: "Low", flagged: false },
  { hour: "07:00-08:00", avgDelay: 12.3, flights: 10, variance: "Medium", flagged: false },
  { hour: "08:00-09:00", avgDelay: 22.4, flights: 14, variance: "High", flagged: true },
  { hour: "09:00-10:00", avgDelay: 18.7, flights: 12, variance: "High", flagged: true },
  { hour: "10:00-11:00", avgDelay: 8.9, flights: 9, variance: "Medium", flagged: false },
  { hour: "11:00-12:00", avgDelay: 6.2, flights: 7, variance: "Low", flagged: false },
  { hour: "12:00-13:00", avgDelay: 9.1, flights: 8, variance: "Medium", flagged: false },
  { hour: "13:00-14:00", avgDelay: 11.5, flights: 10, variance: "Medium", flagged: false },
  { hour: "14:00-15:00", avgDelay: 15.8, flights: 11, variance: "Medium", flagged: false },
  { hour: "15:00-16:00", avgDelay: 19.2, flights: 13, variance: "High", flagged: true },
  { hour: "16:00-17:00", avgDelay: 16.4, flights: 12, variance: "Medium", flagged: false },
  { hour: "17:00-18:00", avgDelay: 13.7, flights: 9, variance: "Medium", flagged: false },
  { hour: "18:00-19:00", avgDelay: 10.3, flights: 8, variance: "Low", flagged: false },
  { hour: "19:00-20:00", avgDelay: 7.8, flights: 6, variance: "Low", flagged: false },
  { hour: "20:00-21:00", avgDelay: 4.5, flights: 4, variance: "Low", flagged: false },
  { hour: "21:00-22:00", avgDelay: 2.1, flights: 2, variance: "Low", flagged: false },
  { hour: "22:00-23:00", avgDelay: 1.8, flights: 3, variance: "Low", flagged: false },
]

type SortField = "hour" | "avgDelay" | "flights" | "variance"
type SortDirection = "asc" | "desc"

export function DelayTrendsTable() {
  const [sortField, setSortField] = useState<SortField>("avgDelay")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const sortedData = [...tableData].sort((a, b) => {
    let aVal: any = a[sortField]
    let bVal: any = b[sortField]

    if (sortField === "avgDelay" || sortField === "flights") {
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

  const getDelayColor = (avgDelay: number) => {
    if (avgDelay > 15) return "text-red-600"
    if (avgDelay > 8) return "text-yellow-600"
    return "text-green-600"
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
                  <AlertTriangle className="h-4 w-4 text-red-500" title="High variance flagged for review" />
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
                  {row.avgDelay.toFixed(1)}m
                </span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block mb-1">Total Flights</span>
                <span className="text-lg lg:text-xl font-bold text-gray-900">{row.flights}</span>
              </div>
            </div>

            {/* Additional info for larger cards */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500">
                <span>
                  {row.avgDelay > 15
                    ? "High delay period"
                    : row.avgDelay > 8
                      ? "Moderate delays"
                      : "On-time performance"}
                </span>
                <span>{((row.flights / 130) * 100).toFixed(1)}% of daily flights</span>
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
