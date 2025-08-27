'use client'

import { useState, useEffect } from "react"
import { ArrowUpDown, Plane, Clock, AlertTriangle, Bus, Eye, X, RefreshCw } from "lucide-react"
import { useClientData, normalizeGateData, formatTime, formatValue, formatAircraftTypes, formatUtilization } from "@/lib/client-utils"

// Known bus gates from the provided information
const BUS_GATES = [
  'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8',
  'C21', 'C22', 'C23', 'C24',
  'D6', 'E21', 'G1'
]

interface GateData {
  gate: string
  flights: number
  aircraftTypes: string[]
  status: "Active" | "Inactive" | "Maintenance"
  lastActivity: string | null
  utilization: number
  pier: string
  isBusGate: boolean
  temporalStatus?: string
  physicalActivity?: string
}

const EMPTY_GATE_DATA: GateData[] = []

export function GatesTable() {
  const [showAllGates, setShowAllGates] = useState(false)
  const [sortConfig, setSortConfig] = useState<{
    key: keyof GateData
    direction: 'ascending' | 'descending'
  }>({
    key: 'flights',
    direction: 'descending'
  })

  const fetchGates = async (): Promise<GateData[]> => {
    const response = await fetch('/api/gate-occupancy')
    if (!response.ok) throw new Error('Failed to fetch gate occupancy data')
    
    const data = await response.json()
    const transformedData = data.gates?.map((gate: any) => ({
      gate: gate.gateID,
      flights: gate.utilization.logical,
      aircraftTypes: gate.scheduledFlights?.map((f: any) => f.aircraftType).filter(Boolean) || [],
      status: gate.utilization.temporalStatus === 'DEAD_ZONE' ? 'Inactive' : 
              gate.utilization.temporalStatus === 'ACTIVE' ? 'Active' : 'Inactive',
      lastActivity: gate.scheduledFlights?.length > 0 ? 
        (() => {
          const lastFlight = gate.scheduledFlights[gate.scheduledFlights.length - 1]
          // Use estimated time if flight is delayed, otherwise use scheduled time
          return lastFlight.isDelayed && lastFlight.estimatedDateTime 
            ? lastFlight.estimatedDateTime 
            : lastFlight.scheduleDateTime
        })() : null,
      utilization: gate.utilization.current, // Use current utilization, not daily
      pier: gate.pier,
      isBusGate: BUS_GATES.includes(gate.gateID),
      temporalStatus: gate.utilization.temporalStatus,
      physicalActivity: gate.utilization.physical
    })) || []
    
    return transformedData
  }

  const { data: gateData, loading, backgroundLoading, mounted, refetch } = useClientData(
    fetchGates,
    EMPTY_GATE_DATA,
    [], // No dependencies
    2.5 * 60 * 1000 // Auto-refresh every 2.5 minutes
  )

  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  // Update lastRefresh when data changes
  useEffect(() => {
    if (mounted && !loading) {
      setLastRefresh(new Date())
    }
  }, [gateData, mounted, loading])

  const handleManualRefresh = () => {
    refetch(true) // Show loading state for manual refresh
    setLastRefresh(new Date())
  }

  const handleSort = (key: keyof GateData) => {
    setSortConfig(prevConfig => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === 'ascending'
          ? 'descending'
          : 'ascending'
    }))
  }

  const sortedData = [...gateData].sort((a, b) => {
    if (sortConfig.key === 'flights' || sortConfig.key === 'utilization') {
      const aValue = a[sortConfig.key] || 0
      const bValue = b[sortConfig.key] || 0
      return sortConfig.direction === 'ascending' ? aValue - bValue : bValue - aValue
    }
    
    const aValue = a[sortConfig.key]
    const bValue = b[sortConfig.key]
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortConfig.direction === 'ascending'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    }
    
    return 0
  })

  // Show only top 10 gates by default
  const displayData = showAllGates ? sortedData : sortedData.slice(0, 10)

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800'
      case 'Inactive': return 'bg-gray-100 text-gray-800'
      case 'Maintenance': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const renderGateRow = (gate: GateData, index: number) => {
    // Get unique aircraft types only (no duplicates)
    const uniqueAircraftTypes = [...new Set(gate.aircraftTypes)].filter(Boolean)
    
    return (
      <tr key={`${gate.gate}-${index}`} className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-default">
        <td className="py-2 lg:py-3 px-1.5 lg:px-2">
          <div className="flex items-center gap-1.5 lg:gap-2">
            <span className="font-medium text-xs lg:text-sm text-gray-900">{gate.gate}</span>
            <span className="text-[10px] lg:text-xs text-gray-500 bg-gray-100 px-1.5 lg:px-2 py-0.5 lg:py-1 rounded">
              {gate.pier}
            </span>
          </div>
        </td>
        <td className="py-2 lg:py-3 px-1.5 lg:px-2">
          <span className="font-medium text-xs lg:text-sm text-gray-900">{formatValue(gate.flights)}</span>
        </td>
        <td className="py-2 lg:py-3 px-1.5 lg:px-2">
          <div className="flex flex-wrap gap-1">
            {uniqueAircraftTypes.length > 0 ? (
              <>
                {uniqueAircraftTypes.slice(0, 2).map((type, typeIndex) => (
                  <span
                    key={typeIndex}
                    className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                  >
                    {type}
                  </span>
                ))}
                {uniqueAircraftTypes.length > 2 && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    +{uniqueAircraftTypes.length - 2}
                  </span>
                )}
              </>
            ) : (
              <span className="text-xs text-gray-500">No data</span>
            )}
          </div>
        </td>
        <td className="py-2 lg:py-3 px-1.5 lg:px-2">
          {gate.isBusGate ? (
            <div className="inline-flex items-center gap-0.5 lg:gap-1 text-amber-700 bg-amber-50 px-1 lg:px-1.5 py-0.5 rounded-full text-[10px] lg:text-xs font-medium whitespace-nowrap">
              <Bus className="h-2.5 lg:h-3 w-2.5 lg:w-3" />
              <span className="hidden lg:inline">Bus Gate</span>
              <span className="lg:hidden">Bus</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-0.5 lg:gap-1 text-blue-700 bg-blue-50 px-1 lg:px-1.5 py-0.5 rounded-full text-[10px] lg:text-xs font-medium whitespace-nowrap">
              <Plane className="h-2.5 lg:h-3 w-2.5 lg:w-3" />
              <span className="hidden lg:inline">Departure Gate</span>
              <span className="lg:hidden">Dep.</span>
            </div>
          )}
        </td>
        <td className="py-2 lg:py-3 px-1.5 lg:px-2">
          <div className="flex items-center gap-1 lg:gap-2">
            <div className="w-12 lg:w-16 bg-gray-200 rounded-full h-1.5 lg:h-2">
              <div
                className="bg-blue-500 h-1.5 lg:h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, gate.utilization)}%` }}
              />
            </div>
            <span className="text-[10px] lg:text-xs text-gray-600">{formatUtilization(gate.utilization)}%</span>
          </div>
        </td>
        <td className="py-2 lg:py-3 px-1.5 lg:px-2">
          <span
            className={`inline-flex items-center gap-0.5 lg:gap-1 px-1.5 lg:px-2 py-0.5 lg:py-1 rounded-full text-[10px] lg:text-xs font-medium ${getStatusColor(gate.status)}`}
          >
            {gate.status === "Maintenance" && <AlertTriangle className="h-2.5 lg:h-3 w-2.5 lg:w-3" />}
            {gate.status === "Active" && <Clock className="h-2.5 lg:h-3 w-2.5 lg:w-3" />}
            {gate.status}
          </span>
        </td>
        <td className="py-2 lg:py-3 px-1.5 lg:px-2">
          <span className="text-[10px] lg:text-xs text-gray-600">{formatTime(gate.lastActivity)}</span>
        </td>
      </tr>
    )
  }

  if (!mounted) {
    return null
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <Plane className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Gate Activity</h2>
        </div>
        <div className="flex items-center justify-center h-40">
          <div className="text-gray-500">Loading gate data...</div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <Plane className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Gate Activity</h2>
                {backgroundLoading && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" title="Auto-refreshing data..." />
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleManualRefresh}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                  title="Refresh gate assignments"
                >
                  <RefreshCw className="h-3 w-3" />
                  Refresh
                </button>
                {sortedData.length > 10 && (
                  <button
                    onClick={() => setShowAllGates(true)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <Eye className="h-4 w-4" />
                    View All ({sortedData.filter(gate => gate.gate !== 'Not Assigned Yet').length} gates)
                  </button>
                )}
              </div>
            </div>
                      <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Real-time gate utilization and status {!showAllGates && sortedData.length > 10 && `(showing top 10 of ${sortedData.length})`}
              </p>
              <p className="text-xs text-gray-500">
                Last updated: {lastRefresh.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                  timeZone: 'Europe/Amsterdam'
                })}
              </p>
            </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-2 font-medium text-gray-900">
                  <button
                    onClick={() => handleSort("gate")}
                    className="flex items-center gap-1 hover:text-blue-600 transition-colors cursor-pointer"
                  >
                    Gate
                    <ArrowUpDown className="h-4 w-4" />
                  </button>
                </th>
                <th className="text-left py-3 px-2 font-medium text-gray-900">
                  <button
                    onClick={() => handleSort("flights")}
                    className="flex items-center gap-1 hover:text-blue-600 transition-colors cursor-pointer"
                  >
                    Flights
                    <ArrowUpDown className="h-4 w-4" />
                  </button>
                </th>
                <th className="text-left py-3 px-2 font-medium text-gray-900">
                  Aircraft Types
                </th>
                <th className="text-left py-3 px-2 font-medium text-gray-900">
                  Gate Type
                </th>
                <th className="text-left py-3 px-2 font-medium text-gray-900">
                  <button
                    onClick={() => handleSort("utilization")}
                    className="flex items-center gap-1 hover:text-blue-600 transition-colors cursor-pointer"
                  >
                    Utilization
                    <ArrowUpDown className="h-4 w-4" />
                  </button>
                </th>
                <th className="text-left py-3 px-2 font-medium text-gray-900">Status</th>
                <th className="text-left py-3 px-2 font-medium text-gray-900">Last Activity</th>
              </tr>
            </thead>
            <tbody>
              {displayData.map((gate, index) => renderGateRow(gate, index))}
            </tbody>
          </table>
        </div>

        {displayData.length === 0 && (
          <div className="text-center py-8">
            <Plane className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No gate data available</p>
          </div>
        )}
      </div>

      {/* Modal for all gates */}
      {showAllGates && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
                             <div className="flex items-center gap-3">
                 <Plane className="h-5 w-5 text-blue-600" />
                 <h2 className="text-xl font-semibold text-gray-900">All Gate Activity</h2>
                 <span className="text-sm text-gray-500">({sortedData.filter(gate => gate.gate !== 'Not Assigned Yet').length} gates)</span>
               </div>
              <button
                onClick={() => setShowAllGates(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-white">
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 font-medium text-gray-900">
                        <button
                          onClick={() => handleSort("gate")}
                          className="flex items-center gap-1 hover:text-blue-600 transition-colors cursor-pointer"
                        >
                          Gate
                          <ArrowUpDown className="h-4 w-4" />
                        </button>
                      </th>
                      <th className="text-left py-3 px-2 font-medium text-gray-900">
                        <button
                          onClick={() => handleSort("flights")}
                          className="flex items-center gap-1 hover:text-blue-600 transition-colors cursor-pointer"
                        >
                          Flights
                          <ArrowUpDown className="h-4 w-4" />
                        </button>
                      </th>
                      <th className="text-left py-3 px-2 font-medium text-gray-900">
                        Aircraft Types
                      </th>
                      <th className="text-left py-3 px-2 font-medium text-gray-900">
                        Gate Type
                      </th>
                      <th className="text-left py-3 px-2 font-medium text-gray-900">
                        <button
                          onClick={() => handleSort("utilization")}
                          className="flex items-center gap-1 hover:text-blue-600 transition-colors cursor-pointer"
                        >
                          Utilization
                          <ArrowUpDown className="h-4 w-4" />
                        </button>
                      </th>
                      <th className="text-left py-3 px-2 font-medium text-gray-900">Status</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-900">Last Activity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedData.map((gate, index) => renderGateRow(gate, index))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
