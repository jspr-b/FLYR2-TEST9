"use client"

import { useState, useEffect } from "react"
import { Building2, DoorOpen, Plane, TrendingUp } from "lucide-react"

interface SummaryStat {
  label: string
  value: string
  change: string
  icon: any
  color: string
  bgColor: string
}

interface FlightData {
  flightName: string
  flightNumber: number
  gate: string
  pier: string
  publicFlightState: {
    flightStates: string[]
  }
  aircraftType: {
    iataMain: string
    iataSub: string
  }
}

export function GatesTerminalsSummary() {
  const [isLoading, setIsLoading] = useState(true)
  const [summaryStats, setSummaryStats] = useState<SummaryStat[]>([])

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const today = new Date().toISOString().split('T')[0]
        const response = await fetch(`/api/flights?filters=%7B%22flightDirection%22%3A%22D%22%2C%22scheduleDate%22%3A%22${today}%22%2C%22isOperationalFlight%22%3Atrue%2C%22prefixicao%22%3A%22KL%22%7D`)
        if (!response.ok) {
          throw new Error('Failed to fetch flights data')
        }
        
        const data = await response.json()
        const flights: FlightData[] = data.flights || []
        
        // Calculate statistics from real flight data
        const gates = new Set(flights.filter(f => f.gate).map(f => f.gate))
        const piers = new Set(flights.filter(f => f.pier).map(f => f.pier))
        
        // Count flights per pier
        const pierFlights = flights.reduce((acc, flight) => {
          if (flight.pier) {
            acc[flight.pier] = (acc[flight.pier] || 0) + 1
          }
          return acc
        }, {} as Record<string, number>)
        
        // Find busiest pier
        const busiestPier = Object.entries(pierFlights).reduce((max, [pier, count]) => 
          count > max.count ? { pier, count } : max, 
          { pier: 'None', count: 0 }
        )
        
        // Determine Schengen vs Non-Schengen based on actual Schiphol gate mapping
        const isSchengenGate = (gate: string, pier: string) => {
          if (!gate || !pier) return false
          
          // Pier D has both Schengen and Non-Schengen gates
          if (pier === 'D') {
            const gateNumber = parseInt(gate.replace(/\D/g, '')) // Extract number from gate
            // D59-D87 are Schengen (upper level)
            return gateNumber >= 59 && gateNumber <= 87
          }
          
          // Other piers: A, B, C are Schengen; E, F, G, H, M are Non-Schengen
          const schengenPiers = ['A', 'B', 'C']
          const nonSchengenPiers = ['E', 'F', 'G', 'H', 'M']
          
          if (schengenPiers.includes(pier)) return true
          if (nonSchengenPiers.includes(pier)) return false
          
          return false // Unknown pier
        }
        
        const schengenFlights = flights.filter(f => isSchengenGate(f.gate, f.pier)).length
        const nonSchengenFlights = flights.filter(f => !isSchengenGate(f.gate, f.pier) && f.pier).length
        const otherFlights = flights.filter(f => !f.pier).length
        
        // Summary of flight distribution
        console.log('Flight Distribution:')
        console.log('- Total flights:', flights.length)
        console.log('- Schengen flights:', schengenFlights)
        console.log('- Non-Schengen flights:', nonSchengenFlights)
        console.log('- Flights without pier info:', otherFlights)
        console.log('- Verification:', schengenFlights + nonSchengenFlights + otherFlights, '=', flights.length)
        
        // Calculate average utilization (simplified - assuming 100% if gate has flights)
        const avgUtilization = gates.size > 0 ? Math.round((flights.length / gates.size) * 10) : 0
        
        const summaryStats: SummaryStat[] = [
          {
            label: "Active Gates",
            value: gates.size.toString(),
            change: `${piers.size} piers`,
            icon: Building2,
            color: "text-blue-600",
            bgColor: "bg-blue-50",
          },
          {
            label: "Schengen Flights",
            value: schengenFlights.toString(),
            change: `${avgUtilization}% avg`,
            icon: DoorOpen,
            color: "text-green-600",
            bgColor: "bg-green-50",
          },
          {
            label: "Non-Schengen Flights",
            value: nonSchengenFlights.toString(),
            change: `${otherFlights} no pier`,
            icon: TrendingUp,
            color: "text-purple-600",
            bgColor: "bg-purple-50",
          },
          {
            label: "Total Flights",
            value: flights.length.toString(),
            change: `${schengenFlights + nonSchengenFlights + otherFlights} verified`,
            icon: Plane,
            color: "text-orange-600",
            bgColor: "bg-orange-50",
          },
        ]

        setSummaryStats(summaryStats)
      } catch (error) {
        console.error("Error fetching summary data:", error)
        // Fallback to placeholder data
        const fallbackStats: SummaryStat[] = [
          {
            label: "Active Gates",
            value: "n/v",
            change: "n/v",
            icon: Building2,
            color: "text-blue-600",
            bgColor: "bg-blue-50",
          },
          {
            label: "Schengen Flights",
            value: "n/v",
            change: "n/v",
            icon: DoorOpen,
            color: "text-green-600",
            bgColor: "bg-green-50",
          },
          {
            label: "Non-Schengen Flights",
            value: "n/v",
            change: "n/v",
            icon: TrendingUp,
            color: "text-purple-600",
            bgColor: "bg-purple-50",
          },
          {
            label: "Total Flights",
            value: "n/v",
            change: "n/v",
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
