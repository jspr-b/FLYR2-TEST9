'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useClientData, safeGet } from "@/lib/client-utils"
import { useEffect, useState } from "react"
// Info icon removed - using arrow SVG instead
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

// Known bus gates from the provided information
const BUS_GATES = [
  'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8',
  'C21', 'C22', 'C23', 'C24',
  'D6', 'E21', 'G1'
]

interface GateStats {
  totalFlights: number
  busGateFlights: number
  jetBridgeFlights: number
  busGatePercentage: number
  jetBridgePercentage: number
}

const INITIAL_STATS: GateStats = {
  totalFlights: 0,
  busGateFlights: 0,
  jetBridgeFlights: 0,
  busGatePercentage: 0,
  jetBridgePercentage: 0
}

interface ProcessedGateData {
  gatesData: any
  operationalData: any
  schipholContext: any
  gateStatusMetrics: any
  unknownGateFlights: any[]
}

export function GateTypeDistribution() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const fetchGateTypeData = async (isBackgroundRefresh = false): Promise<ProcessedGateData> => {
    try {
      // Fetch from the dashboard API which includes gate occupancy data and cancelled flights
      const response = await fetch('/api/dashboard-data?includeGateOccupancy=true&includeCancelled=true', {
        headers: {
          'X-Background-Refresh': isBackgroundRefresh ? 'true' : 'false'
        }
      })
      const data = await response.json()
      
      console.log('=== GATE TYPE DISTRIBUTION RAW DATA ===')
      console.log('Response has gateOccupancy?', !!data.gateOccupancy)
      console.log('Response has flights?', !!data.flights)
      console.log('Number of flights in response:', data.flights?.length)
      
      let processedData: ProcessedGateData = {
        gatesData: null,
        operationalData: null,
        schipholContext: null,
        gateStatusMetrics: null,
        unknownGateFlights: []
      }
      
      // Process gate occupancy data if available
      if (data.gateOccupancy && data.gateOccupancy.gates && data.gateOccupancy.gates.length > 0) {
          const gates = data.gateOccupancy.gates
          
          // Store Schiphol context data
          if (data.gateOccupancy.summary && data.gateOccupancy.summary.schipholContext) {
            processedData.schipholContext = data.gateOccupancy.summary.schipholContext
          }
          
          // Transform gate data for display
          const transformedData = {
            gateData: gates.map((gate: any) => ({
              gate: gate.gateID,
              pier: gate.pier,
              flights: gate.utilization.logical,
              utilization: gate.utilization.current,
              isBusGate: BUS_GATES.includes(gate.gateID),
              status: gate.utilization.temporalStatus === 'DEAD_ZONE' ? 'Available' : 
                     gate.utilization.temporalStatus === 'ACTIVE' ? 'Busy' : 'Moderate',
              temporalStatus: gate.utilization.temporalStatus,
              scheduledFlights: gate.scheduledFlights
            }))
          }
          
          processedData.gatesData = transformedData
          
          console.log('Gate occupancy gates:', gates.length)
      }
      
      // Process flight data separately - this is the main data we need
      if (data.flights && data.flights.length > 0) {
          // Calculate TBD and no gate metrics from raw flights data
          const tbdFlights = data.flights.filter((f: any) => f.gate === 'TBD').length
          const noGateFlightsList = data.flights.filter((f: any) => !f.gate)
          const noGateFlights = noGateFlightsList.length
          const assignedGateFlights = data.flights.filter((f: any) => f.gate && f.gate !== 'TBD').length
          
          // Find departed flights without gates (these are "unknown" gate type)
          const departedNoGate = data.flights.filter((f: any) => 
            !f.gate && 
            f.publicFlightState?.flightStates?.includes('DEP')
          );
          
          processedData.unknownGateFlights = departedNoGate;
          
          processedData.gateStatusMetrics = {
            tbdFlights,
            noGateFlights,
            noGateFlightsList, // Add the actual list of flights
            assignedGateFlights,
            totalFlights: data.flights.length,
            tbdPercentage: Math.round((tbdFlights / data.flights.length) * 100),
            noGatePercentage: Math.round((noGateFlights / data.flights.length) * 100),
            assignedPercentage: Math.round((assignedGateFlights / data.flights.length) * 100)
          }
          
          // Calculate operational metrics for bus gates vs jet bridges
          console.log('=== GATE TYPE DISTRIBUTION DATA FLOW ===')
          console.log('1. PRE-JOIN COUNTS:')
          console.log('   - Total flights from API:', data.flights.length)
          console.log('   - Flights breakdown:')
          console.log('     * With gates assigned:', assignedGateFlights)
          console.log('     * TBD gates:', tbdFlights)
          console.log('     * No gate:', noGateFlights)
          
          // Verify unique gates calculation
          const uniqueGatesFromFlights = new Set(data.flights.filter((f: any) => f.gate && f.gate !== 'TBD').map((f: any) => f.gate))
          console.log('   - Unique gates from flights:', uniqueGatesFromFlights.size)
          console.log('   - Sample gates:', Array.from(uniqueGatesFromFlights).slice(0, 10))
          
          const flightsWithGates = data.flights.filter((f: any) => f.gate && f.gate !== 'TBD')
          console.log('\n2. POST-FILTER COUNTS:')
          console.log('   - Flights with gates (excluding TBD):', flightsWithGates.length)
          
          const busGateFlights = flightsWithGates.filter((flight: any) => BUS_GATES.includes(flight.gate))
          const jetBridgeFlights = flightsWithGates.filter((flight: any) => !BUS_GATES.includes(flight.gate))
          
          console.log('\n3. BUS/JET SPLIT:')
          console.log('   - Flights at bus gates:', busGateFlights.length)
          console.log('   - Flights at jet bridges:', jetBridgeFlights.length)
          console.log('   - Total (bus + jet):', busGateFlights.length + jetBridgeFlights.length)
          console.log('   - Sample bus gates used:', [...new Set(busGateFlights.map((f: any) => f.gate))].slice(0, 10))
          console.log('   - Sample jet bridge gates used:', [...new Set(jetBridgeFlights.map((f: any) => f.gate))].slice(0, 10))
          console.log('\n4. VERIFICATION:')
          console.log('   - Bus + Jet =', busGateFlights.length + jetBridgeFlights.length)
          console.log('   - Should equal flights with gates =', flightsWithGates.length)
          console.log('   - Match?', busGateFlights.length + jetBridgeFlights.length === flightsWithGates.length)
          
          // Calculate delay metrics
          const calculateDelay = (flight: any) => {
            if (!flight.publicEstimatedOffBlockTime || !flight.scheduleDateTime) return 0
            const scheduled = new Date(flight.scheduleDateTime)
            const estimated = new Date(flight.publicEstimatedOffBlockTime)
            return Math.max(0, Math.round((estimated.getTime() - scheduled.getTime()) / (1000 * 60)))
          }
          
          const busGateDelays = busGateFlights.filter((f: any) => {
            const delay = calculateDelay(f)
            return delay > 0
          })
          
          const jetBridgeDelays = jetBridgeFlights.filter((f: any) => {
            const delay = calculateDelay(f)
            return delay > 0
          })
          
          // Calculate average delays
          const avgBusGateDelay = busGateDelays.length > 0
            ? Math.round(busGateDelays.reduce((sum: number, f: any) => sum + calculateDelay(f), 0) / busGateDelays.length)
            : 0
          
          const avgJetBridgeDelay = jetBridgeDelays.length > 0
            ? Math.round(jetBridgeDelays.reduce((sum: number, f: any) => sum + calculateDelay(f), 0) / jetBridgeDelays.length)
            : 0
          
          // Calculate gate utilization from gateOccupancy data if available
          let busGateUtilization = 0
          let jetBridgeUtilization = 0
          
          if (data.gateOccupancy && data.gateOccupancy.gates) {
            const gates = data.gateOccupancy.gates
            busGateUtilization = Math.round(
              gates.filter((g: any) => BUS_GATES.includes(g.gateID))
                .reduce((sum: number, g: any) => sum + g.utilization.current, 0) /
              Math.max(1, gates.filter((g: any) => BUS_GATES.includes(g.gateID)).length)
            )
            jetBridgeUtilization = Math.round(
              gates.filter((g: any) => !BUS_GATES.includes(g.gateID))
                .reduce((sum: number, g: any) => sum + g.utilization.current, 0) /
              Math.max(1, gates.filter((g: any) => !BUS_GATES.includes(g.gateID)).length)
            )
          }
          
          // Store operational metrics
          processedData.operationalData = {
            busGateFlights: busGateFlights.length,
            jetBridgeFlights: jetBridgeFlights.length,
            unknownGateFlights: departedNoGate.length,
            busGateDelayRate: busGateFlights.length > 0
              ? Math.round((busGateDelays.length / busGateFlights.length) * 100)
              : 0,
            jetBridgeDelayRate: jetBridgeFlights.length > 0
              ? Math.round((jetBridgeDelays.length / jetBridgeFlights.length) * 100)
              : 0,
            avgBusGateDelay,
            avgJetBridgeDelay,
            busGateUtilization,
            jetBridgeUtilization,
            criticalBusGateDelays: busGateFlights.filter((f: any) => calculateDelay(f) >= 60).map((f: any) => ({
              ...f,
              delayMinutes: calculateDelay(f),
              delayFormatted: `${calculateDelay(f)} min`
            })),
            criticalJetBridgeDelays: jetBridgeFlights.filter((f: any) => calculateDelay(f) >= 60).map((f: any) => ({
              ...f,
              delayMinutes: calculateDelay(f),
              delayFormatted: `${calculateDelay(f)} min`
            }))
          }
      }
      
      console.log('=== FINAL PROCESSED DATA ===')
      console.log('processedData:', processedData)
      console.log('operationalData bus flights:', processedData.operationalData?.busGateFlights)
      console.log('operationalData jet flights:', processedData.operationalData?.jetBridgeFlights)
      
      return processedData
    } catch (error) {
      console.error('Error fetching gate data:', error)
      throw error
    }
  }

  // Use the useClientData hook for auto-refresh capability
  const { data, loading, backgroundLoading, error, backgroundError, refetch } = useClientData(
    fetchGateTypeData,
    {
      gatesData: null,
      operationalData: null,
      schipholContext: null,
      gateStatusMetrics: null,
      unknownGateFlights: []
    } as ProcessedGateData,
    [],
    10 * 60 * 1000 // Auto-refresh every 10 minutes
  )

  if (!mounted) {
    return (
      <Card className="h-[600px] flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle>Gate Type Distribution</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className="h-[600px] flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle>Gate Type Distribution</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="h-[600px] flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle>Gate Type Distribution</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-red-500">Error loading data: {error.message}</div>
        </CardContent>
      </Card>
    )
  }

  // Extract data from the hook response
  const { gatesData, operationalData, schipholContext, gateStatusMetrics, unknownGateFlights = [] } = data || {}

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="text-base">Gate Type Distribution</CardTitle>
        <p className="text-xs text-gray-600">Bus gates vs jet bridge operations</p>
        {backgroundLoading && (
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse ml-2 inline-block" title="Auto-refreshing data..." />
        )}
      </CardHeader>
      <CardContent className="pt-0 flex-1 overflow-hidden flex flex-col">
        <div className="space-y-3 flex-1 overflow-y-auto pr-1">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span>Bus Gates ({operationalData?.busGateFlights || 0} flights)</span>
              <span>{(() => {
                const total = (operationalData?.busGateFlights || 0) + (operationalData?.jetBridgeFlights || 0) + unknownGateFlights.length;
                return total > 0 ? ((operationalData?.busGateFlights || 0) / total * 100).toFixed(1) : '0';
              })()}%</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                style={{ width: `${(() => {
                  const total = (operationalData?.busGateFlights || 0) + (operationalData?.jetBridgeFlights || 0) + unknownGateFlights.length;
                  return total > 0 ? ((operationalData?.busGateFlights || 0) / total * 100) : 0;
                })()}%` }}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span>Jet Bridges ({operationalData?.jetBridgeFlights || 0} flights)</span>
              <span>{(() => {
                const total = (operationalData?.busGateFlights || 0) + (operationalData?.jetBridgeFlights || 0) + unknownGateFlights.length;
                return total > 0 ? ((operationalData?.jetBridgeFlights || 0) / total * 100).toFixed(1) : '0';
              })()}%</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                style={{ width: `${(() => {
                  const total = (operationalData?.busGateFlights || 0) + (operationalData?.jetBridgeFlights || 0) + unknownGateFlights.length;
                  return total > 0 ? ((operationalData?.jetBridgeFlights || 0) / total * 100) : 0;
                })()}%` }}
              />
            </div>
          </div>

          {/* Unknown Gate Type - Departed flights without gate data */}
          {unknownGateFlights.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="flex items-center gap-1 hover:bg-gray-50 px-1 -mx-1 rounded transition-colors cursor-pointer">
                      <span>Gate Type Unknown ({unknownGateFlights.length} flight{unknownGateFlights.length > 1 ? 's' : ''})</span>
                      <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="start">
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm font-semibold text-gray-900 mb-1">Departed Flights - Gate Unknown</div>
                        <p className="text-xs text-gray-600">These flights have departed but their gate assignment was not preserved in the system.</p>
                      </div>
                      <div className="space-y-2">
                        {unknownGateFlights.map((flight: any) => (
                          <div key={flight.flightNumber} className="text-sm border-b border-gray-100 pb-2 last:border-0">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{flight.flightName}</span>
                              <span className="text-xs text-gray-500">
                                {new Date(flight.scheduleDateTime).toLocaleTimeString('nl-NL', { 
                                  hour: '2-digit', 
                                  minute: '2-digit',
                                  timeZone: 'Europe/Amsterdam'
                                })}
                              </span>
                            </div>
                            <div className="text-xs text-gray-600 mt-0.5">
                              To {flight.route?.destinations?.[0] || 'Unknown'} • Status: Departed
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                <span>{((unknownGateFlights.length / (operationalData?.busGateFlights + operationalData?.jetBridgeFlights + unknownGateFlights.length || 1)) * 100).toFixed(1)}%</span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gray-400 rounded-full transition-all duration-500" 
                  style={{ width: `${((unknownGateFlights.length / (operationalData?.busGateFlights + operationalData?.jetBridgeFlights + unknownGateFlights.length || 1)) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Operational Impact Section */}
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="text-xs font-medium text-gray-700 mb-1.5">Operational Impact:</div>
            
            {/* KLM Operational Context - Always show */}
            <div className="mb-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-600">KLM Gates Today:</span>
                  <div className="font-semibold text-blue-700">
                    {schipholContext?.klmGatesUsedToday || gateStatusMetrics?.assignedGateFlights ? Math.round(gateStatusMetrics?.assignedGateFlights / 3.8) : 97} / {schipholContext?.totalSchipholGates || 223}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Operational Footprint:</span>
                  <div className="font-semibold text-blue-700">
                    {schipholContext?.klmOperationalFootprint || (gateStatusMetrics?.assignedGateFlights ? Math.round((Math.round(gateStatusMetrics?.assignedGateFlights / 3.8) / 223) * 100) : 43)}%
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Gates To Be Determined:</span>
                  <div className={`font-semibold ${
                    gateStatusMetrics?.tbdPercentage > 20 ? 'text-amber-700' : 
                    gateStatusMetrics?.tbdPercentage > 10 ? 'text-yellow-700' : 'text-green-700'
                  }`}>
                    {gateStatusMetrics?.tbdFlights || 0}
                    <span className="text-xs font-normal text-gray-500 ml-1">
                      ({gateStatusMetrics?.tbdPercentage || 0}%)
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">No Gate Assigned:</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className={`block w-full text-left ${
                        gateStatusMetrics?.noGateFlights > 0 ? 'hover:bg-gray-50 px-1 -mx-1 py-0.5 rounded transition-colors cursor-pointer' : ''
                      }`}>
                        <div className={`font-semibold inline-flex items-center gap-1 ${
                          gateStatusMetrics?.noGatePercentage > 15 ? 'text-red-700' : 
                          gateStatusMetrics?.noGatePercentage > 5 ? 'text-amber-700' : 'text-green-700'
                        }`}>
                          {gateStatusMetrics?.noGateFlights || 0}
                          <span className="text-[10px] font-normal text-gray-500 ml-0.5">
                            ({gateStatusMetrics?.noGatePercentage || 0}%)
                          </span>
                          {gateStatusMetrics?.noGateFlights > 0 && (
                            <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          )}
                        </div>
                      </button>
                    </PopoverTrigger>
                    {gateStatusMetrics?.noGateFlightsList && gateStatusMetrics.noGateFlightsList.length > 0 && (
                      <PopoverContent className="w-80" align="start">
                        <div className="space-y-3">
                          <div>
                            <div className="text-sm font-semibold text-gray-900 mb-1">Flights Without Gate Assignment</div>
                            <p className="text-xs text-gray-600">These flights are pending gate allocation or have special handling requirements.</p>
                          </div>
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {gateStatusMetrics.noGateFlightsList.map((flight: any) => (
                              <div key={flight.flightNumber} className="text-sm border-b border-gray-100 pb-2 last:border-0">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">{flight.flightName}</span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(flight.scheduleDateTime).toLocaleTimeString('nl-NL', { 
                                      hour: '2-digit', 
                                      minute: '2-digit',
                                      timeZone: 'Europe/Amsterdam'
                                    })}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-600 mt-0.5">
                                  To {flight.route?.destinations?.[0] || 'Unknown'} • 
                                  {flight.publicFlightState?.flightStates?.includes('CNX') ? ' Status: Cancelled' : 
                                   flight.publicFlightState?.flightStates?.includes('DEP') ? ' Status: Departed' : 
                                   ' Status: Scheduled'}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </PopoverContent>
                    )}
                  </Popover>
                </div>
              </div>
            </div>
            
            {operationalData && (
              <>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[11px] text-gray-600">Bus Gate Delays</div>
                  <div className={`text-base font-bold ${
                    operationalData.busGateDelayRate > 30 ? 'text-red-600' : 
                    operationalData.busGateDelayRate > 20 ? 'text-amber-600' : 'text-green-600'
                  }`}>
                    {operationalData.busGateDelayRate}%
                    <span className="text-xs font-normal text-gray-500 ml-1">
                      (avg {operationalData.avgBusGateDelay}min)
                    </span>
                  </div>
                </div>
                
                <div>
                  <div className="text-[11px] text-gray-600">Jet Bridge Delays</div>
                  <div className={`text-base font-bold ${
                    operationalData.jetBridgeDelayRate > 30 ? 'text-red-600' : 
                    operationalData.jetBridgeDelayRate > 20 ? 'text-amber-600' : 'text-green-600'
                  }`}>
                    {operationalData.jetBridgeDelayRate}%
                    <span className="text-xs font-normal text-gray-500 ml-1">
                      (avg {operationalData.avgJetBridgeDelay}min)
                    </span>
                  </div>
                </div>
                
                <div>
                  <div className="text-[11px] text-gray-600">Bus Gate Utilization</div>
                  <div className={`text-base font-bold ${
                    operationalData.busGateUtilization > 80 ? 'text-red-600' : 
                    operationalData.busGateUtilization > 60 ? 'text-amber-600' : 'text-blue-600'
                  }`}>
                    {operationalData.busGateUtilization}%
                  </div>
                </div>
                
                <div>
                  <div className="text-[11px] text-gray-600">Jet Bridge Utilization</div>
                  <div className={`text-base font-bold ${
                    operationalData.jetBridgeUtilization > 80 ? 'text-red-600' : 
                    operationalData.jetBridgeUtilization > 60 ? 'text-amber-600' : 'text-blue-600'
                  }`}>
                    {operationalData.jetBridgeUtilization}%
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-gray-600">Bus Gate Critical</div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className={`inline-flex items-center gap-1 text-base font-bold hover:bg-red-50 px-1 -mx-1 py-0.5 rounded transition-colors cursor-pointer ${
                        operationalData.criticalBusGateDelays.length > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {operationalData.criticalBusGateDelays.length}
                        <span className="text-xs font-normal text-gray-500 ml-1">
                          (≥60min)
                        </span>
                        {operationalData.criticalBusGateDelays.length > 0 && (
                          <svg className="w-3 h-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        )}
                      </button>
                    </PopoverTrigger>
                    {operationalData.criticalBusGateDelays.length > 0 && (
                      <PopoverContent className="w-64" align="start">
                        <div className="space-y-2">
                          <div className="text-sm font-semibold text-red-700">Critical Bus Gate Delays</div>
                          {operationalData.criticalBusGateDelays
                            .sort((a: any, b: any) => b.delayMinutes - a.delayMinutes)
                            .slice(0, 5)
                            .map((flight: any) => (
                              <div key={flight.flightNumber} className="flex items-center justify-between text-sm py-1 border-b border-gray-100 last:border-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">KL{flight.flightNumber}</span>
                                  <span className="text-gray-400">→</span>
                                  <span className="text-gray-600">{flight.route?.destinations?.[0] || 'Unknown'}</span>
                                </div>
                                <span className="font-bold text-red-600">{flight.delayFormatted}</span>
                              </div>
                            ))}
                        </div>
                      </PopoverContent>
                    )}
                  </Popover>
                </div>

                <div>
                  <div className="text-[11px] text-gray-600">Jet Bridge Critical</div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className={`inline-flex items-center gap-1 text-base font-bold hover:bg-red-50 px-1 -mx-1 py-0.5 rounded transition-colors cursor-pointer ${
                        operationalData.criticalJetBridgeDelays.length > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {operationalData.criticalJetBridgeDelays.length}
                        <span className="text-xs font-normal text-gray-500 ml-1">
                          (≥60min)
                        </span>
                        {operationalData.criticalJetBridgeDelays.length > 0 && (
                          <svg className="w-3 h-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        )}
                      </button>
                    </PopoverTrigger>
                    {operationalData.criticalJetBridgeDelays.length > 0 && (
                      <PopoverContent className="w-64" align="start">
                        <div className="space-y-2">
                          <div className="text-sm font-semibold text-red-700">Critical Jet Bridge Delays</div>
                          {operationalData.criticalJetBridgeDelays
                            .sort((a: any, b: any) => b.delayMinutes - a.delayMinutes)
                            .slice(0, 5)
                            .map((flight: any) => (
                              <div key={flight.flightNumber} className="flex items-center justify-between text-sm py-1 border-b border-gray-100 last:border-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">KL{flight.flightNumber}</span>
                                  <span className="text-gray-400">→</span>
                                  <span className="text-gray-600">{flight.route?.destinations?.[0] || 'Unknown'}</span>
                                </div>
                                <span className="font-bold text-red-600">{flight.delayFormatted}</span>
                              </div>
                            ))}
                        </div>
                      </PopoverContent>
                    )}
                  </Popover>
                </div>
              </div>
              
              <div className="text-[11px] text-gray-500 mt-1.5">
                Impact analysis comparing bus gate vs jet bridge operations
              </div>
              </>
            )}
          </div>
        </div>

        <div className="pt-3 border-t flex-shrink-0">
          <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-gray-600 text-[11px]">Total Active Flights</div>
                <div className="text-xl font-bold">
                  {(operationalData?.busGateFlights || 0) + (operationalData?.jetBridgeFlights || 0) + unknownGateFlights.length}
                </div>
              </div>
              <div>
                <div className="text-gray-600 text-[11px]">Bus Gate Usage</div>
                <div className="text-xl font-bold">
                  {(() => {
                    const total = (operationalData?.busGateFlights || 0) + (operationalData?.jetBridgeFlights || 0) + unknownGateFlights.length;
                    return total > 0 ? ((operationalData?.busGateFlights || 0) / total * 100).toFixed(1) : '0';
                  })()}%
                </div>
              </div>
            </div>
          </div>
      </CardContent>
    </Card>
  )
}