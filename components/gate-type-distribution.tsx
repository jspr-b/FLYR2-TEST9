'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useClientData, safeGet } from "@/lib/client-utils"
import { useEffect, useState } from "react"

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
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const fetchData = async () => {
      try {
        const response = await fetch('/api/gate-occupancy')
        const data = await response.json()
        
        // Known bus gates from the provided information
        const BUS_GATES = [
          'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8',
          'C21', 'C22', 'C23', 'C24',
          'D6', 'E21', 'G1'
        ]
        
        if (data.gates && data.gates.length > 0) {
          // Transform data to match expected structure
          const transformedData = {
            gateData: data.gates.map((gate: any) => ({
              gate: gate.gateID,
              pier: gate.pier,
              flights: gate.utilization.logical,
              utilization: gate.utilization.current, // Use current utilization
              isBusGate: BUS_GATES.includes(gate.gateID),
              status: gate.utilization.temporalStatus === 'DEAD_ZONE' ? 'Available' : 
                     gate.utilization.temporalStatus === 'ACTIVE' ? 'Busy' : 'Moderate',
              temporalStatus: gate.utilization.temporalStatus
            }))
          }
          
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
      <CardHeader>
        <CardTitle>Gate Type Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Bus Gates ({gatesData?.gateData.filter((gate: any) => gate.isBusGate).reduce((sum: number, gate: any) => sum + gate.flights, 0)} flights)</span>
              <span>{gatesData?.gateData.length > 0 ? ((gatesData.gateData.filter((gate: any) => gate.isBusGate).reduce((sum: number, gate: any) => sum + gate.flights, 0) / gatesData.gateData.reduce((sum: number, gate: any) => sum + gate.flights, 0)) * 100).toFixed(1) : 0}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-amber-500 rounded-full" 
                style={{ width: `${gatesData?.gateData.length > 0 ? ((gatesData.gateData.filter((gate: any) => gate.isBusGate).reduce((sum: number, gate: any) => sum + gate.flights, 0) / gatesData.gateData.reduce((sum: number, gate: any) => sum + gate.flights, 0)) * 100) : 0}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Jet Bridges ({gatesData?.gateData.filter((gate: any) => !gate.isBusGate).reduce((sum: number, gate: any) => sum + gate.flights, 0)} flights)</span>
              <span>{gatesData?.gateData.length > 0 ? ((gatesData.gateData.filter((gate: any) => !gate.isBusGate).reduce((sum: number, gate: any) => sum + gate.flights, 0) / gatesData.gateData.reduce((sum: number, gate: any) => sum + gate.flights, 0)) * 100).toFixed(1) : 0}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full" 
                style={{ width: `${gatesData?.gateData.length > 0 ? ((gatesData.gateData.filter((gate: any) => !gate.isBusGate).reduce((sum: number, gate: any) => sum + gate.flights, 0) / gatesData.gateData.reduce((sum: number, gate: any) => sum + gate.flights, 0)) * 100) : 0}%` }}
              />
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Total Flights</div>
                <div className="text-2xl font-bold">{gatesData?.gateData.reduce((sum: number, gate: any) => sum + gate.flights, 0)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Bus Gate Usage</div>
                <div className="text-2xl font-bold">{gatesData?.gateData.length > 0 ? ((gatesData.gateData.filter((gate: any) => gate.isBusGate).reduce((sum: number, gate: any) => sum + gate.flights, 0) / gatesData.gateData.reduce((sum: number, gate: any) => sum + gate.flights, 0)) * 100).toFixed(1) : 0}%</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 