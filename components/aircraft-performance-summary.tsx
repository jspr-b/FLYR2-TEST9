"use client"

import { useState, useEffect } from "react"
import { Plane, Clock, AlertTriangle, TrendingUp } from "lucide-react"
import { fetchFlights } from "@/lib/api"
import { FlightResponse } from "@/types/flight"
import { calculateDelayMinutes } from "@/lib/timezone-utils"

interface SummaryStat {
  label: string
  value: string
  change: string
  icon: any
  color: string
  bgColor: string
}

export function AircraftPerformanceSummary() {
  const [isLoading, setIsLoading] = useState(true)
  const [summaryStats, setSummaryStats] = useState<SummaryStat[]>([])

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Fetch real flight data with KLM filter
        const flightsResponse = await fetchFlights({
          flightDirection: "D",
          scheduleDate: new Date().toISOString().split('T')[0],
          isOperationalFlight: true,
          prefixicao: "KL"
        })
        
        const flights = flightsResponse.flights
        
        // Handle empty data gracefully
        if (!flights || flights.length === 0) {
          const initialStats: SummaryStat[] = [
            {
              label: "Aircraft Types",
              value: "0",
              change: "No flights today",
              icon: Plane,
              color: "text-blue-600",
              bgColor: "bg-blue-50",
            },
            {
              label: "Best Performer",
              value: "n/v",
              change: "No data available",
              icon: TrendingUp,
              color: "text-green-600",
              bgColor: "bg-green-50",
            },
            {
              label: "Highest Delay",
              value: "n/v",
              change: "No data available",
              icon: Clock,
              color: "text-red-600",
              bgColor: "bg-red-50",
            },
            {
              label: "Fleet Avg Delay",
              value: "n/v",
              change: "No flights today",
              icon: AlertTriangle,
              color: "text-orange-600",
              bgColor: "bg-orange-50",
            },
          ]
          setSummaryStats(initialStats)
          return
        }
        
        // Calculate aircraft performance from flight data
        const aircraftCounts = flights.reduce((acc, flight) => {
          const type = flight.aircraftType.iataSub
          
          // Safety check: ensure type is a string
          const safeType = typeof type === 'string' ? type : 'Unknown'
          acc[safeType] = (acc[safeType] || 0) + 1
          return acc
        }, {} as Record<string, number>)
        
        // Calculate delays for each aircraft type
        const aircraftPerformance = Object.entries(aircraftCounts).map(([type, count]) => {
          const typeFlights = flights.filter(f => {
            const flightType = f.aircraftType.iataSub
            const safeFlightType = typeof flightType === 'string' ? flightType : 'Unknown'
            return safeFlightType === type
          })
          const typeDelays = typeFlights.map(flight => 
            calculateDelayMinutes(flight.scheduleDateTime, flight.publicEstimatedOffBlockTime)
          )
          const avgDelay = typeDelays.length > 0 ? typeDelays.reduce((a, b) => a + b, 0) / typeDelays.length : 0
          
          // Get unique routes for this aircraft type
          const routes = [...new Set(typeFlights.map(f => f.route.destinations.join(', ')))].slice(0, 3).join('; ')
          
          return {
            type,
            count,
            avgDelay,
            routes
          }
        })
        
        // Find best and worst performers
        const bestPerformer = aircraftPerformance.length > 0 ? aircraftPerformance.reduce((best, current) => 
          current.avgDelay < best.avgDelay ? current : best
        ) : null
        
        const worstPerformer = aircraftPerformance.length > 0 ? aircraftPerformance.reduce((worst, current) => 
          current.avgDelay > worst.avgDelay ? current : worst
        ) : null
        
        // Calculate fleet average delay
        const allDelays = flights.map(flight => 
          calculateDelayMinutes(flight.scheduleDateTime, flight.publicEstimatedOffBlockTime)
        )
        const fleetAvgDelay = allDelays.length > 0 ? allDelays.reduce((a, b) => a + b, 0) / allDelays.length : 0
        
        const stats: SummaryStat[] = [
          {
            label: "Aircraft Types",
            value: Object.keys(aircraftCounts).length.toString(),
            change: `${flights.length} total flights`,
            icon: Plane,
            color: "text-blue-600",
            bgColor: "bg-blue-50",
          },
          {
            label: "Best Performer",
            value: bestPerformer ? bestPerformer.type : "n/v",
            change: bestPerformer ? `${bestPerformer.avgDelay.toFixed(1)} min avg delay | ${bestPerformer.routes || 'No routes'}` : "No data",
            icon: TrendingUp,
            color: "text-green-600",
            bgColor: "bg-green-50",
          },
          {
            label: "Highest Delay",
            value: worstPerformer ? worstPerformer.type : "n/v",
            change: worstPerformer ? `${worstPerformer.avgDelay.toFixed(1)} min avg delay | ${worstPerformer.routes || 'No routes'}` : "No data",
            icon: Clock,
            color: "text-red-600",
            bgColor: "bg-red-50",
          },
          {
            label: "Fleet Avg Delay",
            value: fleetAvgDelay ? `${fleetAvgDelay.toFixed(1)} min` : "n/v",
            change: `${flights.length} flights analyzed`,
            icon: AlertTriangle,
            color: "text-orange-600",
            bgColor: "bg-orange-50",
          },
        ]

        setSummaryStats(stats)
      } catch (error) {
        console.error("Error fetching aircraft performance summary data:", error)
        // Fallback to placeholder data on error
        const errorStats: SummaryStat[] = [
          {
            label: "Aircraft Types",
            value: "n/v",
            change: "Error loading data",
            icon: Plane,
            color: "text-blue-600",
            bgColor: "bg-blue-50",
          },
          {
            label: "Best Performer",
            value: "n/v",
            change: "Error loading data",
            icon: TrendingUp,
            color: "text-green-600",
            bgColor: "bg-green-50",
          },
          {
            label: "Highest Delay",
            value: "n/v",
            change: "Error loading data",
            icon: Clock,
            color: "text-red-600",
            bgColor: "bg-red-50",
          },
          {
            label: "Fleet Avg Delay",
            value: "n/v",
            change: "Error loading data",
            icon: AlertTriangle,
            color: "text-orange-600",
            bgColor: "bg-orange-50",
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-3"></div>
            <div className="h-8 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {summaryStats.map((stat, index) => (
        <div key={index} className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 cursor-default">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.change}</p>
            </div>
            <div className={`${stat.bgColor} ${stat.color} p-3 rounded-lg`}>
              <stat.icon className="h-6 w-6" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
