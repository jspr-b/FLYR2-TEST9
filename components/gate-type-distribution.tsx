'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useClientData, safeGet } from "@/lib/client-utils"
import { useEffect, useState } from "react"
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
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const fetchData = async () => {
      try {
        // Fetch from the dashboard API which includes gate occupancy data
        const response = await fetch('/api/dashboard-data?includeGateOccupancy=true')
        const data = await response.json()
        
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
          const busGateFlights = gates.filter((gate: any) => BUS_GATES.includes(gate.gateID))
            .flatMap((gate: any) => gate.scheduledFlights)
          
          const jetBridgeFlights = gates.filter((gate: any) => !BUS_GATES.includes(gate.gateID))
            .flatMap((gate: any) => gate.scheduledFlights)
          
          // Calculate delay metrics
          const busGateDelays = busGateFlights.filter((f: any) => f.delayMinutes > 0)
          const jetBridgeDelays = jetBridgeFlights.filter((f: any) => f.delayMinutes > 0)
          
          // Calculate average delays
          const avgBusGateDelay = busGateDelays.length > 0
            ? Math.round(busGateDelays.reduce((sum: number, f: any) => sum + f.delayMinutes, 0) / busGateDelays.length)
            : 0
          
          const avgJetBridgeDelay = jetBridgeDelays.length > 0
            ? Math.round(jetBridgeDelays.reduce((sum: number, f: any) => sum + f.delayMinutes, 0) / jetBridgeDelays.length)
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
          setOperationalData({
            busGateFlights: busGateFlights.length,
            jetBridgeFlights: jetBridgeFlights.length,
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
            criticalBusGateDelays: busGateFlights.filter((f: any) => f.delayMinutes >= 60),
            criticalJetBridgeDelays: jetBridgeFlights.filter((f: any) => f.delayMinutes >= 60)
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
              <span>{gatesData?.gateData.length > 0 ? ((gatesData.gateData.filter((gate: any) => gate.isBusGate).reduce((sum: number, gate: any) => sum + gate.flights, 0) / gatesData.gateData.reduce((sum: number, gate: any) => sum + gate.flights, 0)) * 100).toFixed(1) : 0}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                style={{ width: `${gatesData?.gateData.length > 0 ? ((gatesData.gateData.filter((gate: any) => gate.isBusGate).reduce((sum: number, gate: any) => sum + gate.flights, 0) / gatesData.gateData.reduce((sum: number, gate: any) => sum + gate.flights, 0)) * 100) : 0}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Jet Bridges ({operationalData?.jetBridgeFlights || 0} flights)</span>
              <span>{gatesData?.gateData.length > 0 ? ((gatesData.gateData.filter((gate: any) => !gate.isBusGate).reduce((sum: number, gate: any) => sum + gate.flights, 0) / gatesData.gateData.reduce((sum: number, gate: any) => sum + gate.flights, 0)) * 100).toFixed(1) : 0}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                style={{ width: `${gatesData?.gateData.length > 0 ? ((gatesData.gateData.filter((gate: any) => !gate.isBusGate).reduce((sum: number, gate: any) => sum + gate.flights, 0) / gatesData.gateData.reduce((sum: number, gate: any) => sum + gate.flights, 0)) * 100) : 0}%` }}
              />
            </div>
          </div>

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
                <div className="text-2xl font-bold">{gatesData?.gateData.reduce((sum: number, gate: any) => sum + gate.flights, 0) || 0}</div>
              </div>
              <div>
                <div className="text-gray-600 text-xs">Bus Gate Usage</div>
                <div className="text-2xl font-bold">{gatesData?.gateData.length > 0 ? ((gatesData.gateData.filter((gate: any) => gate.isBusGate).reduce((sum: number, gate: any) => sum + gate.flights, 0) / gatesData.gateData.reduce((sum: number, gate: any) => sum + gate.flights, 0)) * 100).toFixed(1) : 0}%</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 