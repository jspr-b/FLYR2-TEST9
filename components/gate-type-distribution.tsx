'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useClientData, safeGet } from "@/lib/client-utils"
import { useEffect, useState } from "react"
import { Info } from "lucide-react"
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

export function GateTypeDistribution() {
  const [gatesData, setGatesData] = useState<any>(null)
  const [operationalData, setOperationalData] = useState<any>(null)
  const [schipholContext, setSchipholContext] = useState<any>(null)
  const [gateStatusMetrics, setGateStatusMetrics] = useState<any>(null)
  const [unknownGateFlights, setUnknownGateFlights] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const fetchData = async () => {
      try {
        // Fetch from the dashboard API which includes gate occupancy data
        const response = await fetch('/api/dashboard-data?includeGateOccupancy=true')
        const data = await response.json()
        
        // console.log('Gate Type Distribution - API Response:', data)
        // console.log('Gate Type Distribution - data.flights exists?', !!data.flights)
        // console.log('Gate Type Distribution - data.gateOccupancy exists?', !!data.gateOccupancy)
        
        if (data.gateOccupancy && data.gateOccupancy.gates && data.gateOccupancy.gates.length > 0) {
          const gates = data.gateOccupancy.gates
          
          // Store Schiphol context data
          if (data.gateOccupancy.summary && data.gateOccupancy.summary.schipholContext) {
            setSchipholContext(data.gateOccupancy.summary.schipholContext)
          }
          
          // Calculate TBD and no gate metrics from raw flights data
          if (data.flights) {
            const tbdFlights = data.flights.filter((f: any) => f.gate === 'TBD').length
            const noGateFlights = data.flights.filter((f: any) => !f.gate).length
            const assignedGateFlights = data.flights.filter((f: any) => f.gate && f.gate !== 'TBD').length
            
            // Find departed flights without gates (these are "unknown" gate type)
            const departedNoGate = data.flights.filter((f: any) => 
              !f.gate && 
              f.publicFlightState?.flightStates?.includes('DEP')
            );
            
            setUnknownGateFlights(departedNoGate);
            
            setGateStatusMetrics({
              tbdFlights,
              noGateFlights,
              assignedGateFlights,
              totalFlights: data.flights.length,
              tbdPercentage: Math.round((tbdFlights / data.flights.length) * 100),
              noGatePercentage: Math.round((noGateFlights / data.flights.length) * 100),
              assignedPercentage: Math.round((assignedGateFlights / data.flights.length) * 100)
            })
          }
          
          // Calculate operational metrics for bus gates vs jet bridges
          // Use the flights data directly instead of gate.scheduledFlights
          console.log('Total gates:', gates.length)
          console.log('Total flights for gate analysis:', data.flights?.length)
          
          // Verify unique gates calculation
          const uniqueGatesFromFlights = new Set(data.flights?.filter((f: any) => f.gate && f.gate !== 'TBD').map((f: any) => f.gate))
          console.log('Unique gates from flights:', uniqueGatesFromFlights.size)
          console.log('Gates in gateOccupancyData:', gates.length)
          console.log('KLM Gates Today from API:', schipholContext?.klmGatesUsedToday)
          
          // Calculate from flights that have gates assigned
          if (!data.flights) {
            console.error('Gate Type Distribution - No flights data in response!')
            setLoading(false)
            return
          }
          
          const flightsWithGates = data.flights.filter((f: any) => f.gate && f.gate !== 'TBD')
          console.log('Gate Type Distribution - Flights with gates:', flightsWithGates.length)
          
          const busGateFlights = flightsWithGates.filter((flight: any) => BUS_GATES.includes(flight.gate))
          const jetBridgeFlights = flightsWithGates.filter((flight: any) => !BUS_GATES.includes(flight.gate))
          
          console.log('Flights at bus gates:', busGateFlights.length)
          console.log('Flights at jet bridges:', jetBridgeFlights.length)
          
          // Calculate delay metrics
          // For flights, we need to calculate delays from schedule vs actual times
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
          
          // Transform data to match expected structure
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
          
          // Store operational metrics
          // console.log('Gate Type Distribution - Bus gate flights:', busGateFlights.length)
          // console.log('Gate Type Distribution - Jet bridge flights:', jetBridgeFlights.length)
          // console.log('Gate Type Distribution - Unknown gate flights:', unknownGateFlights.length)
          
          setOperationalData({
            busGateFlights: busGateFlights.length,
            jetBridgeFlights: jetBridgeFlights.length,
            unknownGateFlights: unknownGateFlights.length,
            busGateDelayRate: busGateFlights.length > 0
              ? Math.round((busGateDelays.length / busGateFlights.length) * 100)
              : 0,
            jetBridgeDelayRate: jetBridgeFlights.length > 0
              ? Math.round((jetBridgeDelays.length / jetBridgeFlights.length) * 100)
              : 0,
            avgBusGateDelay,
            avgJetBridgeDelay,
            busGateUtilization: Math.round(
              gates.filter((g: any) => BUS_GATES.includes(g.gateID))
                .reduce((sum: number, g: any) => sum + g.utilization.current, 0) /
              Math.max(1, gates.filter((g: any) => BUS_GATES.includes(g.gateID)).length)
            ),
            jetBridgeUtilization: Math.round(
              gates.filter((g: any) => !BUS_GATES.includes(g.gateID))
                .reduce((sum: number, g: any) => sum + g.utilization.current, 0) /
              Math.max(1, gates.filter((g: any) => !BUS_GATES.includes(g.gateID)).length)
            ),
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
          })
          
          setGatesData(transformedData)
        }
      } catch (error) {
        console.error('Error fetching gate data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (!mounted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gate Type Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[100px]">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gate Type Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[100px]">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Gate Type Distribution</CardTitle>
        <p className="text-xs text-gray-600">Bus gates vs jet bridge operations</p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Bus Gates ({operationalData?.busGateFlights || 0} flights)</span>
              <span>{(() => {
                const total = (operationalData?.busGateFlights || 0) + (operationalData?.jetBridgeFlights || 0) + unknownGateFlights.length;
                return total > 0 ? ((operationalData?.busGateFlights || 0) / total * 100).toFixed(1) : '0';
              })()}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                style={{ width: `${(() => {
                  const total = (operationalData?.busGateFlights || 0) + (operationalData?.jetBridgeFlights || 0) + unknownGateFlights.length;
                  return total > 0 ? ((operationalData?.busGateFlights || 0) / total * 100) : 0;
                })()}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Jet Bridges ({operationalData?.jetBridgeFlights || 0} flights)</span>
              <span>{(() => {
                const total = (operationalData?.busGateFlights || 0) + (operationalData?.jetBridgeFlights || 0) + unknownGateFlights.length;
                return total > 0 ? ((operationalData?.jetBridgeFlights || 0) / total * 100).toFixed(1) : '0';
              })()}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
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
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="flex items-center gap-1 hover:bg-gray-50 px-1 -mx-1 rounded transition-colors cursor-pointer">
                      <span>Gate Type Unknown ({unknownGateFlights.length} flight{unknownGateFlights.length > 1 ? 's' : ''})</span>
                      <Info className="w-3 h-3 text-gray-400" />
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
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gray-400 rounded-full transition-all duration-500" 
                  style={{ width: `${((unknownGateFlights.length / (operationalData?.busGateFlights + operationalData?.jetBridgeFlights + unknownGateFlights.length || 1)) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Operational Impact Section */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="text-sm font-medium text-gray-700 mb-3">Operational Impact:</div>
            
            {/* KLM Operational Context - Always show */}
            <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">KLM Gates Today:</span>
                  <div className="font-semibold text-blue-700">
                    {schipholContext?.klmGatesUsedToday || 99} / {schipholContext?.totalSchipholGates || 223}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Operational Footprint:</span>
                  <div className="font-semibold text-blue-700">
                    {schipholContext?.klmOperationalFootprint || 44}%
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Gates TBD:</span>
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
                  <div className={`font-semibold ${
                    gateStatusMetrics?.noGatePercentage > 15 ? 'text-red-700' : 
                    gateStatusMetrics?.noGatePercentage > 5 ? 'text-amber-700' : 'text-green-700'
                  }`}>
                    {gateStatusMetrics?.noGateFlights || 0}
                    <span className="text-xs font-normal text-gray-500 ml-1">
                      ({gateStatusMetrics?.noGatePercentage || 0}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {operationalData && (
              <>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-gray-600">Bus Gate Delays</div>
                  <div className={`text-lg font-bold ${
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
                  <div className="text-xs text-gray-600">Jet Bridge Delays</div>
                  <div className={`text-lg font-bold ${
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
                  <div className="text-xs text-gray-600">Bus Gate Utilization</div>
                  <div className={`text-lg font-bold ${
                    operationalData.busGateUtilization > 80 ? 'text-red-600' : 
                    operationalData.busGateUtilization > 60 ? 'text-amber-600' : 'text-blue-600'
                  }`}>
                    {operationalData.busGateUtilization}%
                  </div>
                </div>
                
                <div>
                  <div className="text-xs text-gray-600">Jet Bridge Utilization</div>
                  <div className={`text-lg font-bold ${
                    operationalData.jetBridgeUtilization > 80 ? 'text-red-600' : 
                    operationalData.jetBridgeUtilization > 60 ? 'text-amber-600' : 'text-blue-600'
                  }`}>
                    {operationalData.jetBridgeUtilization}%
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-600">Bus Gate Critical</div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className={`inline-flex items-center gap-1 text-lg font-bold hover:bg-red-50 px-2 -mx-2 py-0.5 rounded transition-colors cursor-pointer ${
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
                                  <span className="text-gray-600">{flight.destination}</span>
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
                  <div className="text-xs text-gray-600">Jet Bridge Critical</div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className={`inline-flex items-center gap-1 text-lg font-bold hover:bg-red-50 px-2 -mx-2 py-0.5 rounded transition-colors cursor-pointer ${
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
                                  <span className="text-gray-600">{flight.destination}</span>
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
              
              <div className="text-xs text-gray-500 mt-2">
                Impact analysis comparing bus gate vs jet bridge operations
              </div>
              </>
            )}
          </div>

          <div className="pt-4 border-t">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-600 text-xs">Total Flights</div>
                <div className="text-2xl font-bold">
                  {(operationalData?.busGateFlights || 0) + (operationalData?.jetBridgeFlights || 0) + unknownGateFlights.length}
                </div>
              </div>
              <div>
                <div className="text-gray-600 text-xs">Bus Gate Usage</div>
                <div className="text-2xl font-bold">
                  {(() => {
                    const total = (operationalData?.busGateFlights || 0) + (operationalData?.jetBridgeFlights || 0) + unknownGateFlights.length;
                    return total > 0 ? ((operationalData?.busGateFlights || 0) / total * 100).toFixed(1) : '0';
                  })()}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 