"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useClientData } from "@/lib/client-utils"
import { Sidebar } from "@/components/sidebar"
import { GateGanttChart } from "@/components/gate-gantt-chart"
import { Activity, Calendar, Plane, Users, DoorOpen, DoorClosed, Clock, PlaneTakeoff, UserCheck, PauseCircle, Loader2, Info, TrendingUp, ArrowRightLeft, Maximize2 } from "lucide-react"
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
    }>
  }>
}

type GateMetric = 'frequency' | 'recent' | 'patterns'

export default function GateActivityPage() {
  const [lastSuccessfulUpdate, setLastSuccessfulUpdate] = useState<Date | null>(null)
  const [selectedGateMetric, setSelectedGateMetric] = useState<GateMetric>('frequency')
  const [modalGateMetric, setModalGateMetric] = useState<GateMetric>('frequency')
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const fetchGateActivity = async (isBackgroundRefresh = false): Promise<GateActivityData> => {
    try {
      console.log(`🔄 Fetching gate activity data (Background: ${isBackgroundRefresh})`)
      const response = await fetch('/api/gate-occupancy', {
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
      gate: gate.gateID
    }))
  })).filter(gate => gate.flights.length > 0) : []

  // Process data for different chart/card possibilities - only if we have actual gate data
  const processedData = (data && data.gates.length > 0) ? {
    // Gate Status Distribution
    statusBreakdown: data.summary.statusBreakdown,
    
    // Flight States Distribution
    flightStates: data.gates.flatMap(gate => 
      gate.scheduledFlights.map(flight => ({
        state: flight.primaryState,
        readable: flight.primaryStateReadable,
        gate: gate.gateID,
        pier: gate.pier
      }))
    ).reduce((acc, flight) => {
      acc[flight.state] = (acc[flight.state] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    
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
          : 0
        
        // Get the most recent flight time
        const mostRecentFlight = gate.scheduledFlights.reduce((latest, flight) => {
          const flightTime = new Date(flight.scheduleDateTime).getTime()
          return flightTime > latest ? flightTime : latest
        }, 0)
        
        const hoursSinceLastChange = mostRecentFlight 
          ? Math.round((Date.now() - mostRecentFlight) / (1000 * 60 * 60) * 10) / 10
          : 999
        
        return {
          gateID: gate.gateID,
          pier: gate.pier,
          changes: gate.scheduledFlights.length,
          utilization: gate.utilization.daily,
          avgChangeInterval, // Average minutes between gate changes
          minChangeInterval: changeIntervals.length > 0 ? Math.min(...changeIntervals) : 0,
          hoursSinceLastChange,
          flights: gate.scheduledFlights.map(f => ({
            flightNumber: f.flightNumber,
            time: f.scheduleDateTime,
            destination: f.destination
          })),
          temporalStatus: gate.utilization.temporalStatus,
          hoursUntilNext: gate.utilization.hoursUntilNextActivity
        }
      }),
    
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
            <div className="text-center p-8">Loading gate activity data...</div>
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
        <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
          <div className="mb-6 lg:mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Gate Activity Analysis</h1>
              {backgroundLoading && (
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse ml-2" title="Auto-refreshing data..." />
              )}
            </div>
            <p className="text-gray-600 text-sm sm:text-base">
              Real-Time Gate Status • Flight Operations • Activity Monitoring
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

          <div className="grid gap-6">
            {/* Gate Schedule Timeline (Gantt Chart) */}
            <GateGanttChart gateData={ganttData} />

            {/* Status Overview Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              
              {/* Gate Status Breakdown */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Gate Status Distribution</CardTitle>
                  <p className="text-xs text-gray-600">KLM operational footprint at Schiphol</p>
                </CardHeader>
                <CardContent className="pt-0">
                  {/* Operational Context */}
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">KLM Gates Today:</span>
                        <div className="font-semibold text-blue-700">
                          {data?.summary.schipholContext?.klmGatesUsedToday || 99} / {data?.summary.schipholContext?.totalSchipholGates || 223}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Operational Footprint:</span>
                        <div className="font-semibold text-blue-700">
                          {data?.summary.schipholContext?.klmOperationalFootprint || 44}%
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Flights Handled:</span>
                        <div className="font-semibold text-green-700">
                          {data?.summary.schipholContext?.totalFlightsHandled || 356}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Busiest Pier:</span>
                        <div className="font-semibold text-orange-700">
                          {data?.summary.schipholContext?.busiestPier || 'D'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Current Status */}
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-gray-700 mb-2">Current Gate Status:</div>
                    {Object.entries(processedData?.statusBreakdown || {}).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded ${
                            status === 'OCCUPIED' ? 'bg-green-500' :
                            status === 'PREPARING' ? 'bg-blue-500' :
                            status === 'DEPARTED' ? 'bg-gray-500' :
                            status === 'SCHEDULED' ? 'bg-blue-300' :
                            'bg-gray-300'
                          }`} />
                          <span className="text-sm font-medium">
                            {status === 'SCHEDULED' ? 'Scheduled' : 
                             status === 'PREPARING' ? 'Preparing' :
                             status === 'OCCUPIED' ? 'Occupied' :
                             status === 'DEPARTED' ? 'Departed' :
                             status.toLowerCase()}
                          </span>
                        </div>
                        <span className="text-lg font-semibold">{count}</span>
                      </div>
                    ))}
                  </div>

                  {/* Pier Breakdown */}
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <div className="text-sm font-medium text-gray-700 mb-2">Top Piers by Activity:</div>
                    <div className="space-y-2">
                      {data?.summary.schipholContext?.pierUtilization?.slice(0, 4).map((pier, index) => (
                        <div key={pier.pier} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded ${
                              index === 0 ? 'bg-orange-500' :
                              index === 1 ? 'bg-red-500' :
                              index === 2 ? 'bg-blue-500' :
                              'bg-green-500'
                            }`} />
                            <span className={`${
                              pier.pier.includes('D-') ? 'font-medium' : ''
                            }`}>
                              {pier.pier.includes('D-') ? pier.pier : `Pier ${pier.pier}`}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{pier.flights} flights</div>
                            <div className="text-gray-500">{pier.gates} gates</div>
                          </div>
                        </div>
                      )) || []}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Flight States */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Flight States</CardTitle>
                  <p className="text-xs text-gray-600">Current flight phases</p>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {Object.entries(processedData?.flightStates || {})
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 5)
                      .map(([state, count]) => {
                        const total = Object.values(processedData?.flightStates || {}).reduce((sum, val) => sum + val, 0)
                        const percentage = Math.round((count / total) * 100)
                        
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
                          <div key={state} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center`}>
                                  <config.Icon className={`w-5 h-5 ${config.iconColor}`} />
                                </div>
                                <div>
                                  <div className="font-medium text-sm">{config.label}</div>
                                  <div className="text-xs text-gray-500">{config.description}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold">{count}</div>
                                <div className="text-xs text-gray-500">{percentage}%</div>
                              </div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div 
                                className={`${config.color} h-1.5 rounded-full transition-all duration-500`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                  </div>
                  
                  {/* Total flights indicator */}
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Total active flights</span>
                      <span className="font-semibold text-gray-900">
                        {Object.values(processedData?.flightStates || {}).reduce((sum, val) => sum + val, 0)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Gate Changes Analysis */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base">Gate Change Analysis</CardTitle>
                      <p className="text-xs text-gray-600">Gate change frequency and patterns</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
                            <Info className="w-4 h-4 text-gray-500" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <ArrowRightLeft className="w-4 h-4 text-blue-600" />
                              <p className="font-medium text-sm">Understanding Gate Changes</p>
                            </div>
                            <div className="space-y-2 text-xs text-gray-600">
                              <p className="leading-relaxed">
                                This analysis helps identify gate change patterns for better resource planning:
                              </p>
                              <div className="space-y-2 pl-2">
                                <div>
                                  <strong className="text-gray-700">Change Frequency:</strong>
                                  <p>Gates with the most aircraft changes today. High frequency indicates gates that need more ground crew attention.</p>
                                </div>
                                <div>
                                  <strong className="text-gray-700">Recent Changes:</strong>
                                  <p>Gates with the most recent activity. Helps track current operations and identify active zones.</p>
                                </div>
                                <div>
                                  <strong className="text-gray-700">Change Patterns:</strong>
                                  <p>Analysis of time between gate changes. Short intervals may indicate quick turnarounds or potential congestion.</p>
                                </div>
                              </div>
                              <p className="pt-2 text-gray-500 italic">
                                Click the expand icon to see all gates and switch between different analyses.
                              </p>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                        <DialogTrigger asChild>
                          <button 
                            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                            onClick={() => setModalGateMetric(selectedGateMetric)}
                          >
                            <Maximize2 className="w-4 h-4 text-gray-500" />
                          </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                          <DialogHeader>
                            <DialogTitle>Gate Change Analysis - Full Report</DialogTitle>
                            <DialogDescription>
                              Comprehensive gate change patterns and frequency analysis
                            </DialogDescription>
                          </DialogHeader>
                          
                          {/* Modal Content */}
                          <div className="flex-1 overflow-y-auto">
                            {/* Metric Toggle Buttons in Modal */}
                            <div className="flex flex-wrap gap-2 mb-4 sticky top-0 bg-white z-10 pb-2">
                              <button
                                onClick={() => setModalGateMetric('frequency')}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                                  modalGateMetric === 'frequency'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                Change Frequency
                              </button>
                              <button
                                onClick={() => setModalGateMetric('recent')}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                                  modalGateMetric === 'recent'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                Recent Changes
                              </button>
                              <button
                                onClick={() => setModalGateMetric('patterns')}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                                  modalGateMetric === 'patterns'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                Change Patterns
                              </button>
                            </div>

                            {/* All Gates Data */}
                            <div className="space-y-3">
                              {processedData?.gateChanges && processedData.gateChanges.length > 0 ? (
                                (() => {
                                  // Sort ALL gates based on selected metric
                                  const sortedGates = [...processedData.gateChanges].sort((a, b) => {
                                    switch (modalGateMetric) {
                                      case 'recent':
                                        return a.hoursSinceLastChange - b.hoursSinceLastChange
                                      case 'patterns':
                                        return a.avgChangeInterval - b.avgChangeInterval
                                      default: // frequency
                                        return b.changes - a.changes
                                    }
                                  })

                                  const maxValue = Math.max(...sortedGates.map(gate => {
                                    switch (modalGateMetric) {
                                      case 'recent':
                                        return 24 // max 24 hours for recent changes
                                      case 'patterns':
                                        return Math.max(...processedData.gateChanges.map(g => g.avgChangeInterval))
                                      default:
                                        return gate.changes
                                    }
                                  })) || 1

                                  return sortedGates.map((gate, index) => {
                                    const value = modalGateMetric === 'recent' 
                                                  ? gate.hoursSinceLastChange
                                                  : modalGateMetric === 'patterns' 
                                                  ? gate.avgChangeInterval
                                                  : gate.changes
                                    
                                    const percentage = modalGateMetric === 'recent'
                                                      ? Math.max(100 - (gate.hoursSinceLastChange / 24 * 100), 5)
                                                      : Math.round((value / maxValue) * 100)
                                    
                                    const getActivityColor = () => {
                                      if (modalGateMetric === 'recent') {
                                        if (value <= 1) return 'bg-green-500'
                                        if (value <= 3) return 'bg-yellow-500'
                                        if (value <= 6) return 'bg-orange-500'
                                        return 'bg-red-500'
                                      } else if (modalGateMetric === 'patterns') {
                                        if (value <= 60) return 'bg-red-500' // Very frequent changes
                                        if (value <= 120) return 'bg-orange-500'
                                        if (value <= 180) return 'bg-yellow-500'
                                        return 'bg-green-500'
                                      } else { // frequency
                                        if (value >= 8) return 'bg-red-500'
                                        if (value >= 6) return 'bg-orange-500'
                                        if (value >= 4) return 'bg-yellow-500'
                                        if (value >= 2) return 'bg-blue-500'
                                        return 'bg-gray-400'
                                      }
                                    }
                                    
                                    const getActivityBgColor = () => {
                                      if (modalGateMetric === 'recent') {
                                        if (value <= 1) return 'bg-green-100'
                                        if (value <= 3) return 'bg-yellow-100'
                                        if (value <= 6) return 'bg-orange-100'
                                        return 'bg-red-100'
                                      } else if (modalGateMetric === 'patterns') {
                                        if (value <= 60) return 'bg-red-100'
                                        if (value <= 120) return 'bg-orange-100'
                                        if (value <= 180) return 'bg-yellow-100'
                                        return 'bg-green-100'
                                      } else { // frequency
                                        if (value >= 8) return 'bg-red-100'
                                        if (value >= 6) return 'bg-orange-100'
                                        if (value >= 4) return 'bg-yellow-100'
                                        if (value >= 2) return 'bg-blue-100'
                                        return 'bg-gray-100'
                                      }
                                    }
                                    
                                    const getActivityIcon = () => {
                                      if (modalGateMetric === 'recent') {
                                        return value <= 3 ? 'text-green-600' : 'text-orange-600'
                                      } else if (modalGateMetric === 'patterns') {
                                        return value <= 120 ? 'text-red-600' : 'text-green-600'
                                      } else {
                                        if (value >= 8) return 'text-red-600'
                                        if (value >= 6) return 'text-orange-600'
                                        if (value >= 4) return 'text-yellow-600'
                                        if (value >= 2) return 'text-blue-600'
                                        return 'text-gray-600'
                                      }
                                    }

                                    const getIcon = () => {
                                      if (modalGateMetric === 'recent') return Clock
                                      if (modalGateMetric === 'patterns') return TrendingUp
                                      return ArrowRightLeft
                                    }

                                    const getValueLabel = () => {
                                      if (modalGateMetric === 'recent') {
                                        if (value >= 24) return '>24h ago'
                                        if (value < 1) return `${Math.round(value * 60)}min ago`
                                        return `${value.toFixed(1)}h ago`
                                      }
                                      if (modalGateMetric === 'patterns') return `${value}min avg`
                                      return `${value} changes`
                                    }

                                    const getSubLabel = () => {
                                      if (modalGateMetric === 'recent') return 'last change'
                                      if (modalGateMetric === 'patterns') return 'between changes'
                                      return 'today'
                                    }

                                    const Icon = getIcon()
                                    
                                    return (
                                      <div key={gate.gateID} className="space-y-2 p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-3">
                                            <span className="text-xs font-medium text-gray-500 w-8">#{index + 1}</span>
                                            <div className={`w-10 h-10 rounded-lg ${getActivityBgColor()} flex items-center justify-center`}>
                                              <Icon className={`w-5 h-5 ${getActivityIcon()}`} />
                                            </div>
                                            <div>
                                              <div className="font-medium text-sm">{gate.gateID}</div>
                                              <div className="text-xs text-gray-500">
                                                Pier {gate.pier} • {gate.utilization}% utilization
                                                {modalGateMetric === 'recent' && (
                                                  <span> • Next in {gate.hoursUntilNext !== undefined && gate.hoursUntilNext < 24 ? `${gate.hoursUntilNext.toFixed(1)}h` : 'N/A'}</span>
                                                )}
                                                {modalGateMetric === 'patterns' && (
                                                  <span> • Min interval: {gate.minChangeInterval}min</span>
                                                )}
                                                {modalGateMetric === 'frequency' && (
                                                  <span> • {gate.changes} aircraft today</span>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                          <div className="text-right">
                                            <div className="text-lg font-bold">{getValueLabel()}</div>
                                            <div className="text-xs text-gray-500">{getSubLabel()}</div>
                                          </div>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                                          <div 
                                            className={`${getActivityColor()} h-1.5 rounded-full transition-all duration-500`}
                                            style={{ width: `${percentage}%` }}
                                          />
                                        </div>
                                      </div>
                                    )
                                  })
                                })()
                              ) : (
                                <div className="text-center py-8 text-gray-500">
                                  <ArrowRightLeft className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                  <p className="text-sm">No gate data available</p>
                                </div>
                              )}
                            </div>

                            {/* Summary Statistics in Modal */}
                            {processedData?.gateChanges && processedData.gateChanges.length > 0 && (
                              <div className="mt-6 p-4 bg-gray-100 rounded-lg sticky bottom-0">
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <div className="text-gray-600">Total Gates Analyzed</div>
                                    <div className="font-bold text-lg">{processedData.gateChanges.length}</div>
                                  </div>
                                  <div>
                                    <div className="text-gray-600">
                                      {modalGateMetric === 'recent' ? 'Avg Time Since Change' :
                                       modalGateMetric === 'patterns' ? 'Avg Change Interval' :
                                       'Total Gate Changes'}
                                    </div>
                                    <div className="font-bold text-lg">
                                      {modalGateMetric === 'recent' 
                                        ? `${(processedData.gateChanges.reduce((sum, gate) => sum + gate.hoursSinceLastChange, 0) / processedData.gateChanges.length).toFixed(1)}h`
                                        : modalGateMetric === 'patterns' 
                                        ? `${Math.round(processedData.gateChanges.reduce((sum, gate) => sum + gate.avgChangeInterval, 0) / processedData.gateChanges.length)}min`
                                        : processedData.gateChanges.reduce((sum, gate) => sum + gate.changes, 0)}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-gray-600">
                                      {modalGateMetric === 'recent' ? 'Gates Changed <3h' :
                                       modalGateMetric === 'patterns' ? 'Quick Turnaround Gates' :
                                       'Busiest Gates (>6 changes)'}
                                    </div>
                                    <div className="font-bold text-lg">
                                      {modalGateMetric === 'recent' 
                                        ? processedData.gateChanges.filter(g => g.hoursSinceLastChange < 3).length
                                        : modalGateMetric === 'patterns' 
                                        ? processedData.gateChanges.filter(g => g.avgChangeInterval < 120).length
                                        : processedData.gateChanges.filter(g => g.changes >= 6).length}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {/* Metric Toggle Buttons */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <button
                      onClick={() => setSelectedGateMetric('frequency')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                        selectedGateMetric === 'frequency'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Change Frequency
                    </button>
                    <button
                      onClick={() => setSelectedGateMetric('recent')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                        selectedGateMetric === 'recent'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Recent Changes
                    </button>
                    <button
                      onClick={() => setSelectedGateMetric('patterns')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                        selectedGateMetric === 'patterns'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Change Patterns
                    </button>
                  </div>

                  <div className="space-y-4">
                    {processedData?.gateChanges && processedData.gateChanges.length > 0 ? (
                      (() => {
                        // Sort gates based on selected metric
                        const sortedGates = [...processedData.gateChanges].sort((a, b) => {
                          switch (selectedGateMetric) {
                            case 'recent':
                              return a.hoursSinceLastChange - b.hoursSinceLastChange
                            case 'patterns':
                              return a.avgChangeInterval - b.avgChangeInterval
                            default: // frequency
                              return b.changes - a.changes
                          }
                        }).slice(0, 10)

                        const maxValue = Math.max(...sortedGates.map(gate => {
                          switch (selectedGateMetric) {
                            case 'recent':
                              return 24 // max 24 hours
                            case 'patterns':
                              return Math.max(...processedData.gateChanges.map(g => g.avgChangeInterval))
                            default:
                              return gate.changes
                          }
                        })) || 1

                        return sortedGates.map((gate, index) => {
                          const value = selectedGateMetric === 'recent' 
                                        ? gate.hoursSinceLastChange
                                        : selectedGateMetric === 'patterns' 
                                        ? gate.avgChangeInterval
                                        : gate.changes
                          
                          const percentage = selectedGateMetric === 'recent'
                                            ? Math.max(100 - (gate.hoursSinceLastChange / 24 * 100), 5)
                                            : Math.round((value / maxValue) * 100)
                        
                        const getActivityColor = () => {
                          if (selectedGateMetric === 'recent') {
                            if (value <= 1) return 'bg-green-500'
                            if (value <= 3) return 'bg-yellow-500'
                            if (value <= 6) return 'bg-orange-500'
                            return 'bg-red-500'
                          } else if (selectedGateMetric === 'patterns') {
                            if (value <= 60) return 'bg-red-500'
                            if (value <= 120) return 'bg-orange-500'
                            if (value <= 180) return 'bg-yellow-500'
                            return 'bg-green-500'
                          } else { // frequency
                            if (value >= 8) return 'bg-red-500'
                            if (value >= 6) return 'bg-orange-500'
                            if (value >= 4) return 'bg-yellow-500'
                            if (value >= 2) return 'bg-blue-500'
                            return 'bg-gray-400'
                          }
                        }
                        
                        const getActivityBgColor = () => {
                          if (selectedGateMetric === 'recent') {
                            if (value <= 1) return 'bg-green-100'
                            if (value <= 3) return 'bg-yellow-100'
                            if (value <= 6) return 'bg-orange-100'
                            return 'bg-red-100'
                          } else if (selectedGateMetric === 'patterns') {
                            if (value <= 60) return 'bg-red-100'
                            if (value <= 120) return 'bg-orange-100'
                            if (value <= 180) return 'bg-yellow-100'
                            return 'bg-green-100'
                          } else {
                            if (value >= 8) return 'bg-red-100'
                            if (value >= 6) return 'bg-orange-100'
                            if (value >= 4) return 'bg-yellow-100'
                            if (value >= 2) return 'bg-blue-100'
                            return 'bg-gray-100'
                          }
                        }
                        
                        const getActivityIcon = () => {
                          if (selectedGateMetric === 'recent') {
                            return value <= 3 ? 'text-green-600' : 'text-orange-600'
                          } else if (selectedGateMetric === 'patterns') {
                            return value <= 120 ? 'text-red-600' : 'text-green-600'
                          } else {
                            if (value >= 8) return 'text-red-600'
                            if (value >= 6) return 'text-orange-600'
                            if (value >= 4) return 'text-yellow-600'
                            if (value >= 2) return 'text-blue-600'
                            return 'text-gray-600'
                          }
                        }

                        const getIcon = () => {
                          if (selectedGateMetric === 'recent') return Clock
                          if (selectedGateMetric === 'patterns') return TrendingUp
                          return ArrowRightLeft
                        }

                        const getValueLabel = () => {
                          if (selectedGateMetric === 'recent') {
                            if (value >= 24) return '>24h ago'
                            if (value < 1) return `${Math.round(value * 60)}min ago`
                            return `${value.toFixed(1)}h ago`
                          }
                          if (selectedGateMetric === 'patterns') return `${value}min avg`
                          return `${value} changes`
                        }

                        const getSubLabel = () => {
                          if (selectedGateMetric === 'recent') return 'last change'
                          if (selectedGateMetric === 'patterns') return 'between changes'
                          return 'today'
                        }

                        const Icon = getIcon()
                        
                        return (
                          <div key={gate.gateID} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg ${getActivityBgColor()} flex items-center justify-center`}>
                                  <Icon className={`w-5 h-5 ${getActivityIcon()}`} />
                                </div>
                                <div>
                                  <div className="font-medium text-sm">{gate.gateID}</div>
                                  <div className="text-xs text-gray-500">
                                    Pier {gate.pier} • {gate.utilization}% utilization
                                    {selectedGateMetric === 'recent' && (
                                      <span> • Next: {gate.hoursUntilNext < 24 ? `in ${gate.hoursUntilNext.toFixed(1)}h` : 'N/A'}</span>
                                    )}
                                    {selectedGateMetric === 'patterns' && (
                                      <span> • Min: {gate.minChangeInterval}min</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold">{getValueLabel()}</div>
                                <div className="text-xs text-gray-500">{getSubLabel()}</div>
                              </div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div 
                                className={`${getActivityColor()} h-1.5 rounded-full transition-all duration-500`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        )
                        })
                      })()
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <ArrowRightLeft className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No gate data available</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Summary Statistics */}
                  {processedData?.gateChanges && processedData.gateChanges.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>
                          {selectedGateMetric === 'recent' ? 'Most recent change' :
                           selectedGateMetric === 'patterns' ? 'Quickest turnaround' :
                           'Total gate changes today'}
                        </span>
                        <span className="font-semibold text-gray-900">
                          {(() => {
                            if (selectedGateMetric === 'recent') {
                              const mostRecent = [...processedData.gateChanges].sort((a, b) => a.hoursSinceLastChange - b.hoursSinceLastChange)[0]
                              return mostRecent && mostRecent.hoursSinceLastChange < 1 
                                ? `${Math.round(mostRecent.hoursSinceLastChange * 60)}min ago`
                                : mostRecent ? `${mostRecent.hoursSinceLastChange.toFixed(1)}h ago` : 'N/A'
                            } else if (selectedGateMetric === 'patterns') {
                              const quickest = [...processedData.gateChanges].sort((a, b) => a.avgChangeInterval - b.avgChangeInterval)[0]
                              return quickest ? `${quickest.avgChangeInterval}min` : 'N/A'
                            } else {
                              return processedData.gateChanges.reduce((sum, gate) => sum + gate.changes, 0)
                            }
                          })()}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Currently Active Gates */}
            <Card>
              <CardHeader>
                <CardTitle>Currently Active Gates</CardTitle>
                <p className="text-sm text-gray-600">Gates with occupied flights</p>
              </CardHeader>
              <CardContent>
                {processedData?.activeGates && processedData.activeGates.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {processedData.activeGates.map((gate) => (
                      <div key={gate.gateID} className="p-4 border rounded-lg bg-white">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-lg">{gate.gateID}</h4>
                          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            Pier {gate.pier}
                          </span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Flight:</span>
                            <span className="font-medium">{gate.occupiedBy}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Destination:</span>
                            <span className="font-medium">{gate.destination}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Aircraft:</span>
                            <span className="font-medium">{gate.aircraftType}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Status:</span>
                            <span className={`font-medium ${gate.isDelayed ? 'text-red-600' : 'text-green-600'}`}>
                              {gate.flightState}
                            </span>
                          </div>
                          {gate.isDelayed && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Delay:</span>
                              <span className="font-medium text-red-600">{gate.delayMinutes}min</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No gates currently active</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Summary Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Summary Statistics</CardTitle>
                <p className="text-sm text-gray-600">Overall gate activity metrics</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{data?.summary.totalGates}</div>
                    <div className="text-sm text-gray-600">Total Gates</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{data?.summary.activePiers}</div>
                    <div className="text-sm text-gray-600">Active Piers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{data?.summary.averageUtilization}%</div>
                    <div className="text-sm text-gray-600">Avg Utilization</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{data?.summary.delayedFlights.totalDelayedFlights}</div>
                    <div className="text-sm text-gray-600">Delayed Flights</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 