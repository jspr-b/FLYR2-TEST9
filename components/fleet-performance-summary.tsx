"use client"

import { useState, useEffect } from "react"
import { TrendingUp, TrendingDown, Target, Award, Clock, Plane } from "lucide-react"

interface FleetPerformanceData {
  summary: {
    aircraftTypes: string | number
    bestPerformer: string
    bestPerformerDelay: string
    highestDelay: string
    highestDelayValue: string
    fleetAvgDelay: string
  }
  chartData: Array<{
    type: string
    avgDelay: number
    flights: number
    onTimePercentage?: number
    minDelay?: number
    maxDelay?: number
    manufacturer: string
    capacity: string
  }>
}

export function FleetPerformanceSummary() {
  const [isLoading, setIsLoading] = useState(true)
  const [fleetData, setFleetData] = useState<FleetPerformanceData | null>(null)

  useEffect(() => {
    const fetchFleetData = async () => {
      try {
        const response = await fetch('/api/aircraft/performance')
        if (!response.ok) throw new Error('Failed to fetch fleet performance data')
        const data = await response.json()
        setFleetData(data)
      } catch (error) {
        console.error('Error fetching fleet performance data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchFleetData()
  }, [])

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  if (!fleetData) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Fleet Performance Summary</h2>
        <p className="text-gray-600">Unable to load fleet performance data</p>
      </div>
    )
  }

  const { summary, chartData } = fleetData

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

  // Calculate additional fleet metrics
  const totalFlights = chartData.reduce((sum, aircraft) => sum + aircraft.flights, 0)
  const avgOnTimePercentage = chartData.length > 0 
    ? chartData.reduce((sum, aircraft) => sum + (aircraft.onTimePercentage || 0), 0) / chartData.length 
    : 0

  // Parse fleet average delay
  const fleetAvgDelayValue = parseFloat(summary.fleetAvgDelay.replace(' min', '')) || 0

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Plane className="h-6 w-6 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">Fleet Performance Summary</h2>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Fleet Average Delay */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Fleet Avg Delay</span>
          </div>
          <div className="text-2xl font-bold text-blue-900">{summary.fleetAvgDelay}</div>
          <div className="text-xs text-blue-700 mt-1">
            Across {summary.aircraftTypes} aircraft types
          </div>
        </div>

        {/* Best Performer */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <Award className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-800">Best Performer</span>
          </div>
          <div className="text-xl font-bold text-green-900">{summary.bestPerformer}</div>
          <div className="text-xs text-green-700 mt-1">
            {summary.bestPerformerDelay}
          </div>
        </div>

        {/* Total Flights */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-800">Total Flights</span>
          </div>
          <div className="text-2xl font-bold text-purple-900">{totalFlights}</div>
          <div className="text-xs text-purple-700 mt-1">
            Today's departures
          </div>
        </div>

        {/* Average On-Time Rate */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-5 w-5 text-orange-600" />
            <span className="text-sm font-medium text-orange-800">Avg On-Time Rate</span>
          </div>
          <div className="text-2xl font-bold text-orange-900">{avgOnTimePercentage.toFixed(1)}%</div>
          <div className="text-xs text-orange-700 mt-1">
            Fleet average
          </div>
        </div>
      </div>

      {/* Performance Comparison */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="text-md font-semibold text-gray-900 mb-3">Performance Comparison</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Best vs Worst</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-600 font-medium">{getAircraftDisplayName(summary.bestPerformer)}</span>
                <span className="text-sm text-green-600">{summary.bestPerformerDelay}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-red-600 font-medium">{getAircraftDisplayName(summary.highestDelay)}</span>
                <span className="text-sm text-red-600">{summary.highestDelayValue}</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Fleet Overview</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Aircraft Types:</span>
                <span className="text-sm font-medium">{summary.aircraftTypes}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Fleet Avg Delay:</span>
                <span className="text-sm font-medium">{summary.fleetAvgDelay}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Aircraft Type Performance Table */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-md font-semibold text-gray-900 mb-3">Aircraft Type Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 font-medium text-gray-700">Type</th>
                <th className="text-left py-2 font-medium text-gray-700">Avg Delay</th>
                <th className="text-left py-2 font-medium text-gray-700">Flights</th>
                <th className="text-left py-2 font-medium text-gray-700">On-Time %</th>
                <th className="text-left py-2 font-medium text-gray-700">vs Fleet Avg</th>
              </tr>
            </thead>
            <tbody>
              {chartData.slice(0, 5).map((aircraft, index) => {
                const delayDiff = aircraft.avgDelay - fleetAvgDelayValue
                const delayStatus = delayDiff < 0 ? 'better' : delayDiff > 0 ? 'worse' : 'same'
                
                return (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-2 font-medium text-gray-900">{getAircraftDisplayName(aircraft.type)}</td>
                    <td className="py-2 text-gray-600">{aircraft.avgDelay.toFixed(1)}m</td>
                    <td className="py-2 text-gray-600">{aircraft.flights}</td>
                    <td className="py-2 text-gray-600">
                      {aircraft.onTimePercentage ? `${aircraft.onTimePercentage.toFixed(1)}%` : 'n/v'}
                    </td>
                    <td className="py-2">
                      {delayStatus === 'better' && (
                        <span className="text-green-600 flex items-center gap-1">
                          <TrendingDown className="h-3 w-3" />
                          {Math.abs(delayDiff).toFixed(1)}m better
                        </span>
                      )}
                      {delayStatus === 'worse' && (
                        <span className="text-red-600 flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {delayDiff.toFixed(1)}m worse
                        </span>
                      )}
                      {delayStatus === 'same' && (
                        <span className="text-gray-500">Same</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {chartData.length > 5 && (
          <p className="text-xs text-gray-500 mt-2">
            Showing top 5 aircraft types. View full details in the Aircraft Performance section.
          </p>
        )}
      </div>
    </div>
  )
} 