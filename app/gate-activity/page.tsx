"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useClientData } from "@/lib/client-utils"
import { Sidebar } from "@/components/sidebar"
import { GateGanttChart } from "@/components/gate-gantt-chart"
import { Activity } from "lucide-react"

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

export default function GateActivityPage() {
  const fetchGateActivity = async (): Promise<GateActivityData> => {
    const response = await fetch('/api/gate-occupancy')
    if (!response.ok) throw new Error('Failed to fetch gate activity data')
    return await response.json()
  }

  const { data, loading, backgroundLoading, error } = useClientData(
    fetchGateActivity,
    { summary: { totalGates: 0, totalPiers: 0, activePiers: 0, activePiersList: [], statusBreakdown: {}, averageUtilization: 0, delayedFlights: { totalDelayedFlights: 0, averageDelayMinutes: 0, totalDelayMinutes: 0, maxDelay: { minutes: 0, formatted: '', flight: null } } }, gates: [] } as GateActivityData,
    [],
    2.5 * 60 * 1000 // Auto-refresh every 2.5 minutes
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
    
    // Physical Activities Distribution
    physicalActivities: data.gates.reduce((acc, gate) => {
      acc[gate.utilization.physical] = (acc[gate.utilization.physical] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    
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
      physicalActivity: gate.utilization.physical,
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
            <div className="text-center p-8 text-red-600">Error: {error}</div>
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
                            status === 'APPROACHING' ? 'bg-blue-500' :
                            status === 'DEPARTED' ? 'bg-gray-500' :
                            status === 'DAY_USE_ACCESS' ? 'bg-blue-300' :
                            'bg-gray-300'
                          }`} />
                          <span className="text-sm font-medium">
                            {status === 'DAY_USE_ACCESS' ? 'Day-use access gates' : status}
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
                  <div className="space-y-3">
                    {Object.entries(processedData?.flightStates || {}).slice(0, 5).map(([state, count]) => (
                      <div key={state} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded border ${
                            state === 'BRD' ? 'bg-green-500 border-green-700' :
                            state === 'GTO' ? 'bg-blue-500 border-blue-700' :
                            state === 'DEP' ? 'bg-gray-500 border-gray-700' :
                            state === 'SCH' ? 'bg-purple-500 border-purple-700' :
                            state === 'DEL' ? 'bg-red-400 border-red-600' :
                            'bg-gray-400 border-gray-600'
                          }`} />
                          <span className="text-sm font-medium">{state}</span>
                        </div>
                        <span className="text-lg font-semibold">{count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Physical Activities */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Physical Activities</CardTitle>
                  <p className="text-xs text-gray-600">Gate operations</p>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {Object.entries(processedData?.physicalActivities || {}).map(([activity, count]) => (
                      <div key={activity} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded ${
                            activity === 'DEPARTING' ? 'bg-orange-500' :
                            activity === 'BOARDING' ? 'bg-green-500' :
                            activity === 'NONE' ? 'bg-gray-300' :
                            'bg-gray-400'
                          }`} />
                          <span className="text-sm font-medium">{activity}</span>
                        </div>
                        <span className="text-lg font-semibold">{count}</span>
                      </div>
                    ))}
                  </div>
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