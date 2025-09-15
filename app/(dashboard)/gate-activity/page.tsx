"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useClientData } from "@/lib/client-utils"
import { Sidebar } from "@/components/sidebar"
import { GateGanttChart } from "@/components/gate-gantt-chart"
import { GateChangesDashboard } from "@/components/gate-changes-dashboard"
import { GateTypeDistribution } from "@/components/gate-type-distribution"
import { Activity, Calendar, Plane, Users, DoorOpen, DoorClosed, Clock, PlaneTakeoff, UserCheck, PauseCircle, Loader2, Info, TrendingUp, ArrowRightLeft, Maximize2, XCircle } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface GateActivityData {
  summary: {
    totalGates: number
    totalPiers: number
    activePiers: number
    activePiersList: string[]
    statusBreakdown: Record<string, number>
    averageUtilization: number
    delayedFlights: {
      totalDelayedFlights: number
      averageDelayMinutes: number
      totalDelayMinutes: number
      maxDelay: {
        minutes: number
        formatted: string
        flight: any
      }
    }
    schipholContext?: {
      totalSchipholGates: number
      totalSchipholPiers: number
      klmOperationalFootprint: number
      klmGatesUsedToday: number
      unusedSchipholGates: number
      pierUtilization: Array<{
        pier: string
        gates: number
        flights: number
        avgUtilization: number
      }>
      busiestPier: string
      totalFlightsHandled: number
    }
  }
  gates: Array<{
    gateID: string
    status: string
    pier: string
    occupiedBy: string | null
    utilization: {
      current: number
      daily: number
      physical: string
      logical: number
      temporalStatus: string
      hoursUntilNextActivity: number
    }
    scheduledFlights: Array<{
      flightName: string
      flightNumber: string
      aircraftType: string
      destination: string
      primaryState: string
      primaryStateReadable: string
      flightStates: string[]
      flightStatesReadable: string[]
      delayMinutes: number
      delayFormatted: string
      delayReason: string
      isDelayed: boolean
      scheduleDateTime: string
      estimatedDateTime: string | null
      expectedTimeBoarding: string | null
    }>
  }>
}

export default function GateActivityPage() {
  const [lastSuccessfulUpdate, setLastSuccessfulUpdate] = useState<Date | null>(null)
  const [gateChangesData, setGateChangesData] = useState<any>(null)
  const [totalFlights, setTotalFlights] = useState<number>(0)
  const [gateStatistics, setGateStatistics] = useState<any>(null)
  
  const fetchGateActivity = async (isBackgroundRefresh = false): Promise<GateActivityData> => {
    try {
      console.log(`🔄 Fetching gate activity data (Background: ${isBackgroundRefresh})`)
      const response = await fetch('/api/dashboard-data?includeGateOccupancy=true&includeGateChanges=true&includeCancelled=true', {
        headers: {
          'X-Background-Refresh': isBackgroundRefresh ? 'true' : 'false'
        }
      })
      
      if (!response.ok) {
        // Try to get error details from response
        let errorMessage = 'Failed to fetch gate activity data'
        let errorDetails = null
        try {
          const errorData = await response.json()
          console.error('API Error response:', errorData)
          if (errorData.error) errorMessage = errorData.error
          if (errorData.details) {
            errorDetails = errorData.details
            errorMessage += `: ${errorData.details}`
          }
        } catch {
          // If parsing JSON fails, use status text
          errorMessage += ` (${response.status} ${response.statusText})`
        }
        console.error(`❌ Gate activity fetch failed (Background: ${isBackgroundRefresh}):`, errorMessage)
        throw new Error(errorMessage)
      }
      
      const result = await response.json()
      console.log(`✅ Gate activity fetch successful (Background: ${isBackgroundRefresh})`)
      setLastSuccessfulUpdate(new Date())
      
      // Extract gate occupancy data from combined response
      if (result.gateOccupancy && result.gateChanges) {
        // Store gate changes data for the dashboard component
        setGateChangesData(result.gateChanges)
        // Store total flights and gate statistics from metadata
        if (result.metadata?.totalFlights) {
          setTotalFlights(result.metadata.totalFlights)
        }
        if (result.metadata?.gateStatistics) {
          setGateStatistics(result.metadata.gateStatistics)
        }
        return result.gateOccupancy
      }
      
      // Fallback for backward compatibility
      return result
    } catch (error) {
      console.error(`❌ Gate activity fetch error (Background: ${isBackgroundRefresh}):`, error)
      // Add more context to network errors
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Network connection error. Please check your internet connection.')
      }
      throw error
    }
  }

  const { data, loading, backgroundLoading, error, backgroundError, refetch } = useClientData(
    fetchGateActivity,
    { summary: { totalGates: 0, totalPiers: 0, activePiers: 0, activePiersList: [], statusBreakdown: {}, averageUtilization: 0, delayedFlights: { totalDelayedFlights: 0, averageDelayMinutes: 0, totalDelayMinutes: 0, maxDelay: { minutes: 0, formatted: '', flight: null } } }, gates: [] } as GateActivityData,
    [],
    10 * 60 * 1000 // Auto-refresh every 10 minutes (background refresh fetches fewer pages for efficiency)
  )


  // Transform data for Gantt chart - only if we have actual gate data (not just loading state)
  const ganttData = (data && data.gates.length > 0) ? data.gates.map(gate => ({
    gateID: gate.gateID,
    pier: gate.pier,
    flights: gate.scheduledFlights.map(flight => ({
      flightName: flight.flightName,
      flightNumber: flight.flightNumber,
      scheduleDateTime: flight.scheduleDateTime,
      estimatedDateTime: flight.estimatedDateTime,
      actualDateTime: flight.actualDateTime,
      actualOffBlockTime: flight.actualOffBlockTime || flight.actualDateTime,
      aircraftType: flight.aircraftType,
      destination: flight.destination,
      primaryState: flight.primaryState,
      primaryStateReadable: flight.primaryStateReadable,
      flightStates: flight.flightStates,
      flightStatesReadable: flight.flightStatesReadable,
      isDelayed: flight.isDelayed,
      delayMinutes: flight.delayMinutes,
      delayFormatted: flight.delayFormatted,
      delayReason: flight.delayReason,
      gate: gate.gateID,
      expectedTimeBoarding: flight.expectedTimeBoarding
    }))
  })).filter(gate => gate.flights.length > 0) : []

  // Process data for different chart/card possibilities - only if we have actual gate data
  // Calculate total flights for debugging
  const totalFlightsInGates = data?.gates.reduce((sum, gate) => sum + (gate.scheduledFlights?.length || 0), 0) || 0
  console.log(`🔍 Gate Activity - Total flights in gates: ${totalFlightsInGates}`)
  console.log(`🔍 Gate Activity - Number of gates: ${data?.gates.length || 0}`)

  const processedData = (data && data.gates.length > 0) ? {
    // Gate Status Distribution
    statusBreakdown: data.summary.statusBreakdown,
    
    // Flight States Distribution
    flightStates: (() => {
      // First get flights from all gates (including NO_GATE)
      const allFlightStates = data.gates.flatMap(gate => 
        gate.scheduledFlights.map(flight => ({
          state: flight.primaryState === 'GCH' ? 'SCH' : flight.primaryState, // Count GCH as SCH
          readable: flight.primaryState === 'GCH' ? 'Scheduled' : flight.primaryStateReadable,
          gate: gate.gateID,
          pier: gate.pier
        }))
      )
      
      console.log(`🔍 Total flight states before filtering: ${allFlightStates.length}`)
      
      const validStates = allFlightStates.filter(flight => flight.state && flight.state !== 'UNKNOWN')
      console.log(`🔍 Valid flight states after filtering: ${validStates.length}`)
      
      // Check if NO_GATE is included
      const noGateFlights = validStates.filter(f => f.gate === 'NO_GATE')
      if (noGateFlights.length > 0) {
        console.log(`🔍 Found ${noGateFlights.length} flights in NO_GATE (including cancelled)`)
        const operationalNoGate = noGateFlights.filter(f => f.state !== 'CNX').length
        console.log(`🔍 Of which ${operationalNoGate} are operational`)
      }
      
      const stateCount = validStates.reduce((acc, flight) => {
        acc[flight.state] = (acc[flight.state] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      return stateCount
    })(),
    
    // Gate Changes Analysis - enhanced with time-based analysis
    gateChanges: data.gates
      .filter(gate => gate.scheduledFlights.length > 0)
      .map(gate => {
        // Calculate time between changes (in minutes)
        const flightTimes = gate.scheduledFlights
          .map(f => new Date(f.scheduleDateTime).getTime())
          .sort((a, b) => a - b)
        
        const changeIntervals = []
        for (let i = 1; i < flightTimes.length; i++) {
          changeIntervals.push((flightTimes[i] - flightTimes[i-1]) / (1000 * 60)) // Convert to minutes
        }
        
        const avgChangeInterval = changeIntervals.length > 0 
          ? Math.round(changeIntervals.reduce((sum, interval) => sum + interval, 0) / changeIntervals.length)
          : 999 // Set high value if no intervals
        
        // Get the most recent flight time
        const mostRecentFlight = gate.scheduledFlights.reduce((latest, flight) => {
          const flightTime = new Date(flight.scheduleDateTime).getTime()
          return flightTime > latest ? flightTime : latest
        }, 0)
        
        const hoursSinceLastChange = mostRecentFlight 
          ? Math.round((Date.now() - mostRecentFlight) / (1000 * 60 * 60) * 10) / 10
          : 999
        
        // Determine operational priority
        const isRecentlyActive = hoursSinceLastChange < 2 // Active in last 2 hours
        const isHighFrequency = gate.scheduledFlights.length >= 6
        const hasQuickTurnaround = changeIntervals.some(interval => interval < 45) // Less than 45 min turnaround
        
        return {
          gateID: gate.gateID,
          pier: gate.pier,
          changes: gate.scheduledFlights.length,
          utilization: gate.utilization.daily,
          avgChangeInterval, // Average minutes between gate changes
          minChangeInterval: changeIntervals.length > 0 ? Math.min(...changeIntervals) : 999,
          hoursSinceLastChange,
          isRecentlyActive,
          isHighFrequency,
          hasQuickTurnaround,
          flights: gate.scheduledFlights.map(f => ({
            flightNumber: f.flightNumber,
            time: f.scheduleDateTime,
            destination: f.destination
          })),
          temporalStatus: gate.utilization.temporalStatus,
          hoursUntilNext: gate.utilization.hoursUntilNextActivity,
          currentStatus: gate.status,
          occupiedBy: gate.occupiedBy
        }
      })
      // Filter out gates with no recent activity for operational relevance
      .filter(gate => gate.hoursSinceLastChange < 24), // Only show gates with activity in last 24 hours
    
    // Temporal Status Distribution
    temporalStatuses: data.gates.reduce((acc, gate) => {
      acc[gate.utilization.temporalStatus] = (acc[gate.utilization.temporalStatus] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    
    // Active Gates Details
    activeGates: data.gates.filter(gate => gate.status === 'OCCUPIED').map(gate => ({
      gateID: gate.gateID,
      pier: gate.pier,
      occupiedBy: gate.occupiedBy,
      flightState: gate.scheduledFlights[0]?.primaryStateReadable || 'Unknown',
      aircraftType: gate.scheduledFlights[0]?.aircraftType || 'Unknown',
      destination: gate.scheduledFlights[0]?.destination || 'Unknown',
      isDelayed: gate.scheduledFlights[0]?.isDelayed || false,
      delayMinutes: gate.scheduledFlights[0]?.delayMinutes || 0
    }))
  } : null

  if (loading) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="lg:ml-64 flex-1 bg-gray-50 min-h-screen">
          <div className="p-3 xs:p-4 sm:p-6 lg:p-8 pt-14 xs:pt-16 lg:pt-8">
            <div className="mb-3 xs:mb-4 sm:mb-6 lg:mb-8">
              <div className="flex items-center gap-2 xs:gap-3 mb-1 xs:mb-2">
                <Activity className="h-4 xs:h-5 sm:h-6 w-4 xs:w-5 sm:w-6 text-blue-600" />
                <h1 className="text-base xs:text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                  <span className="sm:hidden">Gate Activity</span>
                  <span className="hidden sm:inline">Gate Activity Analysis</span>
                </h1>
              </div>
              <p className="text-gray-600 text-[10px] xs:text-xs sm:text-sm lg:text-base">
                <span className="xs:hidden">Real-Time Status</span>
                <span className="hidden xs:inline">Real-Time Gate Status • Flight Operations • Activity Monitoring</span>
              </p>
            </div>
            <div className="text-center p-6 xs:p-8 text-xs xs:text-sm">Loading gate activity data...</div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="lg:ml-64 flex-1 bg-gray-50 min-h-screen">
          <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
            <div className="mb-6 lg:mb-8">
              <div className="flex items-center gap-3 mb-2">
                <Activity className="h-6 w-6 text-blue-600" />
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Gate Activity Analysis</h1>
              </div>
              <p className="text-gray-600 text-sm sm:text-base">
                Real-Time Gate Status • Flight Operations • Activity Monitoring
              </p>
            </div>
            <div className="max-w-md mx-auto mt-8">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Unable to load gate activity data</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>We're having trouble connecting to the flight information system. This could be due to:</p>
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>Temporary network connectivity issues</li>
                        <li>High system load</li>
                        <li>Scheduled maintenance</li>
                      </ul>
                      <p className="mt-3">Please refresh the page to try again.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex">
      <Sidebar />
      <div className="lg:ml-64 flex-1 bg-gray-50 min-h-screen">
        <div className="p-3 xs:p-4 sm:p-6 lg:p-8 pt-14 xs:pt-16 lg:pt-8">
          <div className="mb-3 xs:mb-4 sm:mb-6 lg:mb-8">
            <div className="flex items-center gap-2 xs:gap-3 mb-1 xs:mb-2">
              <Activity className="h-4 xs:h-5 sm:h-6 w-4 xs:w-5 sm:w-6 text-blue-600" />
              <h1 className="text-base xs:text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                <span className="sm:hidden">Gate Activity</span>
                <span className="hidden sm:inline">Gate Activity Analysis</span>
              </h1>
              {backgroundLoading && (
                <div className="w-1.5 xs:w-2 h-1.5 xs:h-2 bg-blue-500 rounded-full animate-pulse ml-1.5 xs:ml-2" title="Auto-refreshing data..." />
              )}
            </div>
            <p className="text-gray-600 text-[10px] xs:text-xs sm:text-sm lg:text-base">
              <span className="xs:hidden">Real-Time Status</span>
              <span className="hidden xs:inline">Real-Time Gate Status • Flight Operations • Activity Monitoring</span>
            </p>
            {backgroundError && (
              <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
                <div className="flex items-start gap-2">
                  <svg className="h-4 w-4 text-amber-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm text-amber-800 font-medium">Unable to refresh data</p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Showing last successful update{lastSuccessfulUpdate && ` from ${lastSuccessfulUpdate.toLocaleTimeString()}`}. Data will continue to auto-refresh.
                    </p>
                  </div>
                  <button
                    onClick={() => refetch(false)}
                    className="text-xs text-amber-700 hover:text-amber-900 underline hover:no-underline"
                  >
                    Retry now
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-3 xs:gap-4 sm:gap-6">
            {/* Gate Schedule Timeline (Gantt Chart) */}
            <GateGanttChart gateData={ganttData} />

            {/* Status Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 xs:gap-3 sm:gap-4">
              {/* Gate Type Distribution - Enhanced with merged metrics */}
              <div className="xl:col-span-1">
                <GateTypeDistribution />
              </div>

              {/* Flight States */}
              <Card className="h-[400px] xs:h-[500px] sm:h-[600px] flex flex-col">
                <CardHeader className="pb-3 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Flight States</CardTitle>
                      <p className="text-xs text-gray-600">Current flight phases</p>
                    </div>
                    <button
                      onClick={() => refetch(false)}
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      title="Refresh data"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Refresh
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 flex-1 overflow-hidden flex flex-col">
                  {/* Flight State Distribution */}
                  <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                    {(() => {
                      // Define all possible flight states excluding GCH (gate change is not an operational state)
                      const allFlightStates = ['SCH', 'BRD', 'GTO', 'GCL', 'GTD', 'DEP', 'DEL', 'CNX'];
                      const currentStates = processedData?.flightStates || {};
                      
                      // Create entries for all states, defaulting to 0 if not present
                      const stateEntries = allFlightStates.map(state => [
                        state,
                        currentStates[state] || 0
                      ]);
                      
                      // Sort by count (descending) but keep all states
                      return stateEntries
                        .sort(([, a], [, b]) => b - a)
                        .map(([state, count]) => {
                        const total = Object.values(processedData?.flightStates || {}).reduce((sum, val) => sum + val, 0)
                        const percentage = total > 0 ? Math.round((count / total) * 100) : 0
                        
                        const stateConfig = {
                          SCH: { 
                            label: 'Scheduled', 
                            color: 'bg-purple-500', 
                            bgColor: 'bg-purple-100',
                            iconColor: 'text-purple-600',
                            Icon: Calendar,
                            description: 'Awaiting departure'
                          },
                          DEP: { 
                            label: 'Departed', 
                            color: 'bg-gray-500', 
                            bgColor: 'bg-gray-100',
                            iconColor: 'text-gray-600',
                            Icon: Plane,
                            description: 'Left the gate'
                          },
                          BRD: { 
                            label: 'Boarding', 
                            color: 'bg-green-500', 
                            bgColor: 'bg-green-100',
                            iconColor: 'text-green-600',
                            Icon: Users,
                            description: 'passengers boarding'
                          },
                          GCL: { 
                            label: 'Gate Closing', 
                            color: 'bg-orange-500', 
                            bgColor: 'bg-orange-100',
                            iconColor: 'text-orange-600',
                            Icon: DoorClosed,
                            description: 'Gate closing'
                          },
                          GTD: { 
                            label: 'Gate Closed', 
                            color: 'bg-red-500', 
                            bgColor: 'bg-red-100',
                            iconColor: 'text-red-600',
                            Icon: DoorClosed,
                            description: 'Gate closed'
                          },
                          GTO: { 
                            label: 'Gate Open', 
                            color: 'bg-blue-500', 
                            bgColor: 'bg-blue-100',
                            iconColor: 'text-blue-600',
                            Icon: DoorOpen,
                            description: 'Gate is open'
                          },
                          DEL: { 
                            label: 'Delayed', 
                            color: 'bg-red-500', 
                            bgColor: 'bg-red-100',
                            iconColor: 'text-red-600',
                            Icon: Clock,
                            description: 'Flight delayed'
                          },
                          CNX: {
                            label: 'Cancelled',
                            color: 'bg-red-600',
                            bgColor: 'bg-red-100', 
                            iconColor: 'text-red-700',
                            Icon: XCircle,
                            description: 'Flight cancelled'
                          }
                        }
                        
                        const config = stateConfig[state] || {
                          label: state,
                          color: 'bg-gray-400',
                          bgColor: 'bg-gray-100',
                          iconColor: 'text-gray-600',
                          Icon: Activity,
                          description: state
                        }
                        
                        return (
                          <div key={state} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <div className={`w-7 h-7 rounded-md ${config.bgColor} flex items-center justify-center flex-shrink-0`}>
                                  <config.Icon className={`w-3.5 h-3.5 ${config.iconColor}`} />
                                </div>
                                <div>
                                  <div className="font-medium text-sm">{config.label}</div>
                                  <div className="text-[11px] text-gray-500">
                                    {config.description}
                                    {state === 'CNX' && (() => {
                                      // Check if any cancelled flights have gate assignments
                                      const cancelledWithGates = data?.gates.flatMap(g => 
                                        g.scheduledFlights.filter(f => 
                                          f.flightStates.includes('CNX') && g.gateID && g.gateID !== 'TBD'
                                        )
                                      ) || [];
                                      return cancelledWithGates.length > 0 ? ' (had gate assignments)' : '';
                                    })()}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-base font-bold">{count}</div>
                                <div className="text-[10px] text-gray-500">{percentage}%</div>
                              </div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-0.5">
                              <div 
                                className={`${config.color} h-0.5 rounded-full transition-all duration-500`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        )
                      })
                    })()}
                  </div>
                  
                  {/* Operational Impact Section */}
                  <div className="mt-2 pt-2 border-t border-gray-200 flex-shrink-0">
                    <div className="text-xs font-medium text-gray-700 mb-1.5">Operational Impact:</div>
                    
                    <div className="grid grid-cols-2 gap-1.5">
                      <div>
                        <div className="text-[11px] text-gray-600">Delayed Departures</div>
                        <div className={`text-base font-bold ${
                          (() => {
                            const departedFlights = data?.gates.flatMap(g => 
                              g.scheduledFlights.filter(f => f.flightStates.includes('DEP'))
                            ) || [];
                            const delayedDepartures = departedFlights.filter(f => f.delayMinutes > 0);
                            const percentage = departedFlights.length > 0
                              ? Math.round((delayedDepartures.length / departedFlights.length) * 100)
                              : 0;
                            return percentage > 20 ? 'text-red-600' : percentage > 10 ? 'text-amber-600' : 'text-green-600';
                          })()
                        }`}>
                          {(() => {
                            // Count DEPARTED flights with actual delay time > 0
                            const departedFlights = data?.gates.flatMap(g => 
                              g.scheduledFlights.filter(f => f.flightStates.includes('DEP'))
                            ) || [];
                            const delayedDepartures = departedFlights.filter(f => f.delayMinutes > 0);
                            const percentage = departedFlights.length > 0
                              ? Math.round((delayedDepartures.length / departedFlights.length) * 100)
                              : 0;
                            
                            console.log(`🔍 Delayed departures:`, {
                              totalDeparted: departedFlights.length,
                              delayedDeparted: delayedDepartures.length,
                              percentage: percentage
                            });
                            
                            return (
                              <>
                                {percentage}%
                                <span className="text-[10px] font-normal text-gray-500 ml-0.5">
                                  ({delayedDepartures.length}/{departedFlights.length})
                                </span>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-[11px] text-gray-600">Median Departure Delay</div>
                        <div className={`text-base font-bold ${
                          (() => {
                            // Get DEPARTED flights with actual delay time > 0
                            const delayedDepartures = data?.gates.flatMap(g => 
                              g.scheduledFlights.filter(f => f.flightStates.includes('DEP') && f.delayMinutes > 0)
                            ) || [];
                            
                            if (delayedDepartures.length === 0) return 'text-green-600';
                            
                            // Calculate median
                            const delays = delayedDepartures.map(f => f.delayMinutes).sort((a, b) => a - b);
                            const median = delays.length % 2 === 0
                              ? (delays[delays.length / 2 - 1] + delays[delays.length / 2]) / 2
                              : delays[Math.floor(delays.length / 2)];
                            
                            return median > 30 ? 'text-red-600' : median > 15 ? 'text-amber-600' : 'text-blue-600';
                          })()
                        }`}>
                          {(() => {
                            const delayedDepartures = data?.gates.flatMap(g => 
                              g.scheduledFlights.filter(f => f.flightStates.includes('DEP') && f.delayMinutes > 0)
                            ) || [];
                            
                            if (delayedDepartures.length === 0) return '0 min';
                            
                            const delays = delayedDepartures.map(f => f.delayMinutes).sort((a, b) => a - b);
                            const median = delays.length % 2 === 0
                              ? (delays[delays.length / 2 - 1] + delays[delays.length / 2]) / 2
                              : delays[Math.floor(delays.length / 2)];
                            
                            console.log(`📊 Departure delay statistics:`, {
                              delayedDepartures: delayedDepartures.length,
                              delays: delays.slice(0, 10),
                              median: Math.round(median),
                              average: data?.summary.delayedFlights.averageDelayMinutes
                            });
                            
                            return `${Math.round(median)} min`;
                          })()}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-xs text-gray-600">Punctual Departures</div>
                        <div className={`text-lg font-bold ${
                          (() => {
                            // Calculate percentage of DEPARTED flights with NO delay
                            const departedFlights = data?.gates.flatMap(g => 
                              g.scheduledFlights.filter(f => f.flightStates.includes('DEP'))
                            ) || [];
                            const punctualDepartures = departedFlights.filter(f => f.delayMinutes === 0);
                            const punctualRate = departedFlights.length > 0 
                              ? Math.round((punctualDepartures.length / departedFlights.length) * 100)
                              : 0;
                            
                            return punctualRate > 80 ? 'text-green-600' : 
                                   punctualRate > 60 ? 'text-blue-600' : 'text-amber-600';
                          })()
                        }`}>
                          {(() => {
                            const departedFlights = data?.gates.flatMap(g => 
                              g.scheduledFlights.filter(f => f.flightStates.includes('DEP'))
                            ) || [];
                            const punctualDepartures = departedFlights.filter(f => f.delayMinutes === 0);
                            const punctualRate = departedFlights.length > 0 
                              ? Math.round((punctualDepartures.length / departedFlights.length) * 100)
                              : 0;
                            
                            console.log(`📊 Punctual Departures:`, {
                              departedFlights: departedFlights.length,
                              punctualDepartures: punctualDepartures.length,
                              delayedDepartures: departedFlights.filter(f => f.delayMinutes > 0).length,
                              punctualRate: punctualRate
                            });
                            
                            return (
                              <>
                                {punctualRate}%
                                <span className="text-[10px] font-normal text-gray-500 ml-0.5">
                                  ({punctualDepartures.length}/{departedFlights.length})
                                </span>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-[11px] text-gray-600">Critical Delays</div>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className={`inline-flex items-center gap-1 text-base font-bold hover:bg-red-50 px-1 -mx-1 py-0.5 rounded transition-colors cursor-pointer ${
                              (() => {
                                const criticalDelays = data?.gates.flatMap(g => 
                                  g.scheduledFlights.filter(f => f.delayMinutes >= 60)
                                ) || [];
                                return criticalDelays.length > 0 ? 'text-red-600' : 'text-green-600';
                              })()
                            }`}>
                              {(() => {
                                const criticalDelays = data?.gates.flatMap(g => 
                                  g.scheduledFlights.filter(f => f.delayMinutes >= 60)
                                ) || [];
                                
                                console.log(`🚨 Critical delays (≥60min):`, criticalDelays.map(f => ({
                                  flight: f.flightNumber,
                                  delay: f.delayMinutes,
                                  formatted: f.delayFormatted,
                                  states: f.flightStates
                                })));
                                
                                return (
                                  <>
                                    {criticalDelays.length}
                                    <span className="text-[10px] font-normal text-gray-500 ml-0.5">
                                      (≥60min)
                                    </span>
                                    {criticalDelays.length > 0 && (
                                      <svg className="w-3 h-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                      </svg>
                                    )}
                                  </>
                                );
                              })()}
                            </button>
                          </PopoverTrigger>
                          {(() => {
                            const criticalDelays = data?.gates.flatMap(g => 
                              g.scheduledFlights.filter(f => f.delayMinutes >= 60)
                            ) || [];
                            
                            if (criticalDelays.length === 0) return null;
                            
                            return (
                              <PopoverContent className="w-64" align="start">
                                <div className="space-y-2">
                                  <div className="text-sm font-semibold text-red-700">Critical Delay Flights</div>
                                  {criticalDelays
                                    .sort((a, b) => b.delayMinutes - a.delayMinutes)
                                    .map((flight) => (
                                      <div key={flight.flightNumber} className="flex items-center justify-between text-sm py-1 border-b border-gray-100 last:border-0">
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium">KL{flight.flightNumber}</span>
                                          <span className="text-gray-400">→</span>
                                          <span className="text-gray-600">{flight.destination}</span>
                                        </div>
                                        <span className="font-bold text-red-600">{flight.delayFormatted}</span>
                                      </div>
                                    ))}
                                </div>
                              </PopoverContent>
                            );
                          })()}
                        </Popover>
                      </div>
                    </div>
                    
                    <div className="text-[11px] text-gray-500 mt-1.5">
                      Impact analysis based on combined flight states and operational data
                    </div>
                  </div>
                  
                  {/* Total flights indicator */}
                  <div className="mt-2 pt-2 border-t border-gray-200 flex-shrink-0">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>Total Active Flights (Operational)</span>
                        <span className="font-semibold text-gray-900">
                          {(() => {
                            // Use API metadata for canonical counts
                            const total = totalFlights; // This is 372 from metadata
                            const cancelled = processedData?.flightStates?.CNX || 0; // This is 25
                            const activeFlights = total - cancelled; // 372 - 25 = 347
                            
                            console.log('Flight calculation (using metadata):', {
                              totalFlights,
                              cancelled,
                              activeFlights
                            });
                            
                            return activeFlights;
                          })()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Cancelled Flights</span>
                        <span className="font-medium">
                          {processedData?.flightStates?.CNX || 0}
                        </span>
                      </div>
                      {/* Note about operational flights without gates */}
                      <div className="text-[10px] text-gray-400 mt-1">
                        * Includes operational flights awaiting gate assignment
                      </div>
                    </div>
                    {lastSuccessfulUpdate && (
                      <div className="text-xs text-gray-500 mt-1">
                        Last updated: {lastSuccessfulUpdate.toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Real Gate Changes (GCH) */}
              <div className="xl:col-span-1">
                <GateChangesDashboard 
                  data={gateChangesData}
                  loading={loading}
                  error={error ? 'Failed to load gate changes' : null}
                />
              </div>
            </div>


          </div>
        </div>
      </div>
    </div>
  )
} 