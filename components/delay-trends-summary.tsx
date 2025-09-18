"use client"

import { useState, useEffect } from "react"
import { AlertTriangle, Clock, Plane, TrendingUp } from "lucide-react"

interface SummaryStat {
  label: string
  value: string
  change: string
  icon: any
  color: string
  bgColor: string
}

export function DelayTrendsSummary() {
  const [isLoading, setIsLoading] = useState(true)
  const [summaryStats, setSummaryStats] = useState<SummaryStat[]>([])

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Fetch data from the dedicated delay trends API
        const response = await fetch('/api/delay-trends/hourly')
        if (!response.ok) throw new Error('Failed to fetch delay trends')
        
        const data = await response.json()
        
        // Use the summary data from the API
        const summary = data.summary || {
          totalFlights: '0',
          avgDelay: '0.0 min',
          peakDelayHour: 'n/v',
          highVarianceHours: '0'
        }
        
        // Parse values for display
        const totalFlights = parseInt(summary.totalFlights) || 0
        const avgDelayValue = parseFloat(summary.avgDelay) || 0
        const peakHour = summary.peakDelayHour || 'n/v'
        const highVarianceHours = parseInt(summary.highVarianceHours) || 0
        
        // Create summary stats
        const stats: SummaryStat[] = [
          {
            label: "Total Flights",
            value: totalFlights.toString(),
            change: `${totalFlights} KLM departures today`,
            icon: Plane,
            color: "text-blue-600",
            bgColor: "bg-blue-50",
          },
          {
            label: "Avg Delay",
            value: summary.avgDelay,
            change: avgDelayValue > 10 ? "Above normal" : "Within normal range",
            icon: Clock,
            color: "text-orange-600",
            bgColor: "bg-orange-50",
          },
          {
            label: "Peak Delay Hour",
            value: peakHour,
            change: peakHour !== 'n/v' ? "Highest average delay" : "No delays detected",
            icon: TrendingUp,
            color: "text-red-600",
            bgColor: "bg-red-50",
          },
          {
            label: "High Variance Hours",
            value: highVarianceHours.toString(),
            change: highVarianceHours > 0 ? `${highVarianceHours} hours with high delays` : "Consistent performance",
            icon: AlertTriangle,
            color: "text-yellow-600",
            bgColor: "bg-yellow-50",
          },
        ]
        
        setSummaryStats(stats)
      } catch (error) {
        console.error("Error fetching delay trends summary:", error)
        // Fallback to error state
        const errorStats: SummaryStat[] = [
          {
            label: "Total Flights",
            value: "n/v",
            change: "Error loading data",
            icon: Plane,
            color: "text-blue-600",
            bgColor: "bg-blue-50",
          },
          {
            label: "Avg Delay",
            value: "n/v",
            change: "Error loading data",
            icon: Clock,
            color: "text-orange-600",
            bgColor: "bg-orange-50",
          },
          {
            label: "Peak Delay Hour",
            value: "n/v",
            change: "Error loading data",
            icon: TrendingUp,
            color: "text-red-600",
            bgColor: "bg-red-50",
          },
          {
            label: "High Variance Hours",
            value: "n/v",
            change: "Error loading data",
            icon: AlertTriangle,
            color: "text-yellow-600",
            bgColor: "bg-yellow-50",
          },
        ]
        setSummaryStats(errorStats)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-2 xs:gap-3 sm:gap-4 mb-3 xs:mb-4 sm:mb-6">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-3 xs:p-4 sm:p-6 animate-pulse">
            <div className="h-3 xs:h-4 bg-gray-200 rounded mb-2 sm:mb-3"></div>
            <div className="h-6 xs:h-8 bg-gray-200 rounded mb-1 sm:mb-2"></div>
            <div className="h-2 xs:h-3 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-2 xs:gap-3 sm:gap-4 mb-3 xs:mb-4 sm:mb-6">
      {summaryStats.map((stat, index) => (
        <div key={index} className="bg-white rounded-lg border border-gray-200 p-3 xs:p-4 sm:p-5 lg:p-6 cursor-default">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] xs:text-xs sm:text-sm font-medium text-gray-600 mb-0.5 sm:mb-1 truncate">{stat.label}</p>
              <p className="text-lg xs:text-xl sm:text-2xl font-bold text-gray-900 mb-0.5 sm:mb-1">{stat.value}</p>
              <p className="text-[9px] xs:text-[10px] sm:text-xs text-gray-500 truncate">{stat.change}</p>
            </div>
            <div className={`${stat.bgColor} ${stat.color} p-2 xs:p-2.5 sm:p-3 rounded-md sm:rounded-lg mt-2 sm:mt-0 sm:ml-3 self-start sm:self-auto`}>
              <stat.icon className="h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}