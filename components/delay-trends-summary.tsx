"use client"

import { useState, useEffect } from "react"
import { AlertTriangle, Clock, Plane, TrendingUp } from "lucide-react"
import { fetchFlights } from "@/lib/api"
import { FlightResponse } from "@/types/flight"
import { calculateDelayMinutes, extractLocalHour } from "@/lib/timezone-utils"

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
              label: "Total Flights",
              value: "0",
              change: "No flights today",
              icon: Plane,
              color: "text-blue-600",
              bgColor: "bg-blue-50",
            },
            {
              label: "Avg Delay",
              value: "n/v",
              change: "No data available",
              icon: Clock,
              color: "text-orange-600",
              bgColor: "bg-orange-50",
            },
            {
              label: "Peak Delay Hour",
              value: "n/v",
              change: "No flights scheduled",
              icon: TrendingUp,
              color: "text-red-600",
              bgColor: "bg-red-50",
            },
            {
              label: "Worst Delay Spike",
              value: "n/v",
              change: "No spike detected",
              icon: AlertTriangle,
              color: "text-yellow-600",
              bgColor: "bg-yellow-50",
            },
          ]
          setSummaryStats(initialStats)
          return
        }
        
        // Calculate total flights
        const totalFlights = flights.length
        
        // Calculate delays using timezone utility
        const delays = flights.map(flight => 
          calculateDelayMinutes(flight.scheduleDateTime, flight.publicEstimatedOffBlockTime)
        )
        const avgDelay = delays.length > 0 ? delays.reduce((a, b) => a + b, 0) / delays.length : 0
        
        // Calculate hourly delay data from raw flights for on-time calculation
        const hourGroups = flights.reduce((acc, flight) => {
          // Extract hour in local timezone
          const scheduleHourLocal = extractLocalHour(flight.scheduleDateTime)
          const hourKey = `${scheduleHourLocal.toString().padStart(2, '0')}:00-${(scheduleHourLocal + 1).toString().padStart(2, '0')}:00`
          if (!acc[hourKey]) {
            acc[hourKey] = { flights: [], delays: [] }
          }
          acc[hourKey].flights.push(flight)
          const delayMinutes = calculateDelayMinutes(flight.scheduleDateTime, flight.publicEstimatedOffBlockTime)
          acc[hourKey].delays.push(delayMinutes)
          return acc
        }, {} as Record<string, { flights: any[], delays: number[] }>)

        // Compose hourly data for both delay and on-time calculations
        const hourlyData = Object.entries(hourGroups).map(([hour, data]) => {
          const avgDelay = data.delays.length > 0 ? data.delays.reduce((a, b) => a + b, 0) / data.delays.length : 0
          const onTimeCount = data.delays.filter(d => d < 5).length
          const onTimePct = data.delays.length > 0 ? (onTimeCount / data.delays.length) * 100 : 0
          return {
            hour,
            avgDelay,
            flights: data.flights.length,
            delays: data.delays,
            onTimeCount,
            onTimePct
          }
        })
        
        // Find peak delay hour
        const peakHour = hourlyData.length > 0 ? hourlyData.reduce((max, current) => 
          current.avgDelay > max.avgDelay ? current : max
        ) : null
        
        // Calculate worst delay spike (largest jump in avg delay compared to previous hour)
        let worstSpike = null
        let worstSpikeValue = -Infinity
        for (let i = 1; i < hourlyData.length; i++) {
          const prev = hourlyData[i - 1]
          const curr = hourlyData[i]
          const spike = curr.avgDelay - prev.avgDelay
          if (spike > worstSpikeValue) {
            worstSpikeValue = spike
            worstSpike = {
              hour: curr.hour,
              spike
            }
          }
        }
        
        // Get current local hour
        const now = new Date();
        const currentHour = now.getHours();

        // Only consider hours fully in the past for best on-time hour
        const pastHourlyData = hourlyData.filter(h => {
          const hourNum = parseInt(h.hour.split(':')[0], 10);
          return hourNum < currentHour;
        });

        let bestOnTimeHour = null;
        let bestOnTimePct = -1;
        let bestOnTimeIndex = -1;
        for (let i = 0; i < pastHourlyData.length; i++) {
          if (pastHourlyData[i].onTimePct > bestOnTimePct) {
            bestOnTimePct = pastHourlyData[i].onTimePct;
            bestOnTimeHour = pastHourlyData[i];
            bestOnTimeIndex = i;
          }
        }
        let onTimeDelta = null;
        if (bestOnTimeIndex > 0) {
          onTimeDelta = bestOnTimeHour.onTimePct - pastHourlyData[bestOnTimeIndex - 1].onTimePct;
        }
        
        const stats: SummaryStat[] = [
          {
            label: "Total Flights",
            value: totalFlights.toString(),
            change: `${flights.length} KLM departures`,
            icon: Plane,
            color: "text-blue-600",
            bgColor: "bg-blue-50",
          },
          {
            label: "Avg Delay",
            value: avgDelay ? `${avgDelay.toFixed(1)} min` : "n/v",
            change: `${flights.length} flights analyzed`,
            icon: Clock,
            color: "text-orange-600",
            bgColor: "bg-orange-50",
          },
          {
            label: "Best On-Time Hour",
            value: bestOnTimeHour ? bestOnTimeHour.hour : "n/v",
            change: bestOnTimeHour ? `${bestOnTimeHour.onTimePct.toFixed(0)}% on time` + (onTimeDelta !== null ? ` (${onTimeDelta >= 0 ? "+" : ""}${onTimeDelta.toFixed(0)}% vs. previous hour)` : " (first hour)") : "No data",
            icon: TrendingUp,
            color: "text-green-600",
            bgColor: "bg-green-50",
          },
          {
            label: "Worst Delay Spike",
            value: worstSpike && worstSpike.spike > 0 ? worstSpike.hour : "n/v",
            change: worstSpike && worstSpike.spike > 0 ? `+${worstSpike.spike.toFixed(1)} min vs. previous hour` : "No spike detected",
            icon: AlertTriangle,
            color: "text-yellow-600",
            bgColor: "bg-yellow-50",
          },
        ]

        setSummaryStats(stats)
      } catch (error) {
        console.error("Error fetching delay trends summary data:", error)
        // Fallback to placeholder data on error
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
            label: "Worst Delay Spike",
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
