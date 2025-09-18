"use client"

import { useState, useEffect } from "react"
import { Building2, DoorOpen, Plane, TrendingUp } from "lucide-react"
import { formatUtilization } from "@/lib/client-utils"

interface SummaryStat {
  label: string
  value: string
  change: string
  icon: any
  color: string
  bgColor: string
}

interface GateOccupancyData {
  gateID: string
  pier: string
  gateType: string
  scheduledFlights: any[]
  utilization: {
    current: number
    daily: number
    temporalStatus: string
    logical: number
  }
}

interface GateOccupancyResponse {
  gates: GateOccupancyData[]
  summary: {
    totalGates: number
    statusBreakdown: Record<string, number>
    averageUtilization: number
  }
}

export function GatesTerminalsSummary() {
  const [isLoading, setIsLoading] = useState(true)
  const [summaryStats, setSummaryStats] = useState<SummaryStat[]>([])

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Fetch from the temporal-aware gate occupancy API
        const response = await fetch('/api/gate-occupancy')
        if (!response.ok) {
          throw new Error('Failed to fetch gate occupancy data')
        }
        
        const data: GateOccupancyResponse = await response.json()
        const gates = data.gates || []
        
        // Only count gates that are physically occupied (not approaching or departed)
        const activeGates = data.summary.statusBreakdown?.OCCUPIED || 0
        console.log('Gates Terminal Summary - API Response:', data.summary.statusBreakdown)
        console.log('Gates Terminal Summary - Active gates count:', activeGates)
        
        // Get unique piers
        const piers = new Set(gates.map(gate => gate.pier).filter(Boolean))
        
        // Use the total flights from metadata if available, otherwise calculate
        const totalFlightsFromAPI = (data as any).metadata?.flightsAnalyzed || 0
        
        // Calculate flights by Schengen/Non-Schengen
        let schengenFlights = 0
        let nonSchengenFlights = 0
        let totalFlights = totalFlightsFromAPI || 0
        
        // Only calculate if not provided by API
        if (!totalFlightsFromAPI) {
          gates.forEach(gate => {
            const flightCount = gate.utilization.logical || 0
            totalFlights += flightCount
          })
        }
        
        gates.forEach(gate => {
          const flightCount = gate.utilization.logical || 0
          
          // Determine Schengen vs Non-Schengen based on gate classification
          const isSchengenGate = (gateID: string, pier: string) => {
            if (!gateID || !pier) return false
            
            // Pier D has both Schengen and Non-Schengen gates
            if (pier === 'D') {
              const gateNumber = parseInt(gateID.replace(/\D/g, ''))
              // D59-D87 are Schengen (upper level)
              return gateNumber >= 59 && gateNumber <= 87
            }
            
            // Other piers: A, B, C are Schengen; E, F, G, H, M are Non-Schengen
            const schengenPiers = ['A', 'B', 'C']
            return schengenPiers.includes(pier)
          }
          
          if (isSchengenGate(gate.gateID, gate.pier)) {
            schengenFlights += flightCount
          } else {
            nonSchengenFlights += flightCount
          }
        })
        
        // Calculate average utilization from current utilization
        const avgUtilization = Math.round(data.summary.averageUtilization || 0)
        
        // Calculate on-time performance
        const delayedFlightsCount = data.summary.delayedFlights?.totalDelayedFlights || 0
        const totalFlightsForMetrics = (data as any).metadata?.flightsAnalyzed || totalFlights || 371
        const onTimeFlights = totalFlightsForMetrics - delayedFlightsCount
        const onTimePercentage = totalFlightsForMetrics > 0 
          ? Math.round((onTimeFlights / totalFlightsForMetrics) * 100)
          : 100
        
        // Log temporal awareness
        console.log('🕒 Temporal Gate Analysis:')
        console.log('- Total gates:', gates.length)
        console.log('- Occupied gates (physically active):', activeGates)
        console.log('- Gates in DEAD_ZONE:', gates.filter(g => g.utilization.temporalStatus === 'DEAD_ZONE').length)
        console.log('- Current avg utilization:', formatUtilization(avgUtilization) + '%')
        console.log('- Total scheduled flights:', totalFlights)
        console.log('- Schengen flights:', schengenFlights)
        console.log('- Non-Schengen flights:', nonSchengenFlights)
        console.log('- On-time performance:', onTimePercentage + '%', `(${onTimeFlights} on-time out of ${totalFlightsForMetrics})`)

        const summaryStats: SummaryStat[] = [
          {
            label: "On-Time Performance",
            value: `${onTimePercentage}%`,
            change: `${delayedFlightsCount} flights delayed`,
            icon: Building2,
            color: "text-blue-600",
            bgColor: "bg-blue-50",
          },
          {
            label: "Schengen Flights",
            value: schengenFlights.toString(),
            change: `${formatUtilization(avgUtilization)}% current utilization`,
            icon: DoorOpen,
            color: "text-green-600",
            bgColor: "bg-green-50",
          },
          {
            label: "Non-Schengen Flights",
            value: nonSchengenFlights.toString(),
            change: `${gates.length - activeGates} gates idle`,
            icon: TrendingUp,
            color: "text-purple-600",
            bgColor: "bg-purple-50",
          },
          {
            label: "Total Registered Flights Today",
            value: totalFlights.toString(),
            change: `${schengenFlights + nonSchengenFlights} verified`,
            icon: Plane,
            color: "text-orange-600",
            bgColor: "bg-orange-50",
          },
        ]

        setSummaryStats(summaryStats)
      } catch (error) {
        console.error("Error fetching gate occupancy data:", error)
        // Fallback to placeholder data
        const fallbackStats: SummaryStat[] = [
          {
            label: "Active Gates",
            value: "0",
            change: "system error",
            icon: Building2,
            color: "text-blue-600",
            bgColor: "bg-blue-50",
          },
          {
            label: "Schengen Flights",
            value: "n/v",
            change: "system error",
            icon: DoorOpen,
            color: "text-green-600",
            bgColor: "bg-green-50",
          },
          {
            label: "Non-Schengen Flights",
            value: "n/v",
            change: "system error",
            icon: TrendingUp,
            color: "text-purple-600",
            bgColor: "bg-purple-50",
          },
          {
            label: "Total Registered Flights Today",
            value: "n/v",
            change: "system error",
            icon: Plane,
            color: "text-orange-600",
            bgColor: "bg-orange-50",
          },
        ]
        setSummaryStats(fallbackStats)
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
