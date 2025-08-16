'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ArrowRightLeft, Clock, Plane, ArrowRight, Info, MapPin } from 'lucide-react'
import { getCurrentAmsterdamTime } from '@/lib/amsterdam-time'

interface GateChangeEvent {
  flightNumber: string
  flightName: string
  currentGate: string
  pier: string
  destination: string
  aircraftType: string
  scheduleDateTime: string
  timeUntilDeparture: number
  isDelayed: boolean
  delayMinutes: number
  isPriority: boolean
  flightStates: string[]
  flightStatesReadable: string[]
}

interface GateChangesTrackerProps {
  gateChangeEvents: GateChangeEvent[]
}

type ViewMode = 'time' | 'priority' | 'delayed'

export function FlightGateChanges({ gateChangeEvents }: GateChangesTrackerProps) {
  const [showModal, setShowModal] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('time')

  // Filter and sort events based on view mode
  const filteredEvents = useMemo(() => {
    let events = [...gateChangeEvents]

    switch (viewMode) {
      case 'priority':
        events = events.filter(event => event.isPriority)
        break
      case 'delayed':
        events = events.filter(event => event.isDelayed && event.flightStates.includes('GCH'))
        break
      case 'time':
      default:
        // Show all, sorted by time
        break
    }

    // Always sort by time until departure
    return events.sort((a, b) => a.timeUntilDeparture - b.timeUntilDeparture)
  }, [gateChangeEvents, viewMode])

  // Statistics
  const stats = useMemo(() => {
    const total = gateChangeEvents.length
    const urgent = gateChangeEvents.filter(e => e.isPriority).length
    const delayed = gateChangeEvents.filter(e => e.isDelayed).length
    const delayedAndChanged = gateChangeEvents.filter(e => e.isDelayed && e.flightStates.includes('GCH')).length
    
    // Gate distribution
    const gatesByPier = gateChangeEvents.reduce((acc, event) => {
      const pier = event.pier
      if (!acc[pier]) acc[pier] = 0
      acc[pier]++
      return acc
    }, {} as Record<string, number>)
    
    const mostAffectedPier = Object.entries(gatesByPier).sort((a, b) => b[1] - a[1])[0]
    
    return { total, urgent, delayed, delayedAndChanged, gatesByPier, mostAffectedPier }
  }, [gateChangeEvents])

  // Display first 5 events in card
  const displayEvents = filteredEvents.slice(0, 5)

  const formatTime = (minutes: number) => {
    if (minutes < 0) return 'Departed'
    if (minutes < 60) return `in ${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `in ${hours}h ${mins}m`
  }

  const renderEventRow = (event: GateChangeEvent, showInModal = false) => (
    <div key={event.flightNumber} className={showInModal ? "space-y-2 p-3 bg-gray-50 rounded-lg" : "space-y-2"}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <ArrowRightLeft className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{event.flightName}</span>
              {event.isPriority && (
                <span className="px-1.5 py-0.5 text-xs bg-amber-100 text-amber-700 rounded font-medium">SOON</span>
              )}
              {event.isDelayed && (
                <span className="px-1.5 py-0.5 text-xs bg-orange-100 text-orange-700 rounded font-medium">{event.delayMinutes}m late</span>
              )}
            </div>
            <div className="text-xs text-gray-500">
              <MapPin className="w-3 h-3 inline mr-1" />
              Gate {event.currentGate} • Pier {event.pier} • to {event.destination}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-gray-700">{formatTime(event.timeUntilDeparture)}</div>
          <div className="text-xs text-gray-500">until departure</div>
        </div>
      </div>
      {!showInModal && (
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div 
            className={`${event.isPriority ? 'bg-amber-500' : event.isDelayed ? 'bg-orange-500' : 'bg-blue-500'} h-1.5 rounded-full transition-all duration-500`}
            style={{ width: `${Math.max(100 - (Math.max(event.timeUntilDeparture, 0) / 180 * 100), 5)}%` }}
          />
        </div>
      )}
    </div>
  )

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle className="text-base">Flight Gate Changes</CardTitle>
              <p className="text-xs text-gray-600">Flights with GCH status</p>
            </div>
            <Select value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="time">By Time</SelectItem>
                <SelectItem value="priority">Priority Only</SelectItem>
                <SelectItem value="delayed">Delayed + GCH</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-4">
            {displayEvents.length > 0 ? (
              displayEvents.map(event => renderEventRow(event))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <ArrowRightLeft className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  {viewMode === 'priority' && 'No urgent gate changes'}
                  {viewMode === 'delayed' && 'No delayed flights with gate changes'}
                  {viewMode === 'time' && 'No gate changes detected'}
                </p>
              </div>
            )}
          </div>
          
          {/* Summary Statistics and View All button */}
          {displayEvents.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>
                  Showing {displayEvents.length} of {filteredEvents.length} gate changes
                </span>
                {filteredEvents.length > 5 && (
                  <button
                    className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                    onClick={() => setShowModal(true)}
                  >
                    View all
                    <ArrowRight className="inline ml-1 h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          )}
          
          {/* Operational Metrics */}
          {gateChangeEvents.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="text-sm font-medium text-gray-700">Operational Impact:</div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-gray-600">Most Affected Pier</div>
                  <div className="text-lg font-bold">
                    {stats.mostAffectedPier ? `Pier ${stats.mostAffectedPier[0]}` : 'N/A'}
                    <span className="text-xs font-normal text-gray-500 ml-1">
                      ({stats.mostAffectedPier?.[1] || 0} changes)
                    </span>
                  </div>
                </div>
                
                <div>
                  <div className="text-xs text-gray-600">Departing Soon</div>
                  <div className="text-lg font-bold text-amber-600">
                    {stats.urgent}
                    <span className="text-xs font-normal text-gray-500 ml-1">
                      ({Math.round((stats.urgent / stats.total) * 100)}%)
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="text-xs text-gray-500 mt-2">
                Piers affected: {Object.keys(stats.gatesByPier).sort().join(', ')}
              </div>
            </div>
          )}
          
          {/* Status Legend */}
          <div className="mt-4 space-y-3">
            <div className="text-sm font-medium text-gray-700">Status Indicators:</div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 text-xs bg-amber-100 text-amber-700 rounded font-medium">SOON</span>
                <span className="text-xs text-gray-600">Departing within 60 minutes</span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 text-xs bg-orange-100 text-orange-700 rounded font-medium">15m late</span>
                <span className="text-xs text-gray-600">Flight delayed by 15+ minutes</span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <ArrowRightLeft className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-xs text-gray-600">Gate reassignment indicator</span>
              </div>
            </div>
            
            <div className="text-xs text-gray-500 pt-2">
              <div className="font-medium mb-1">Data Notes:</div>
              <ul className="space-y-0.5">
                <li>• Real-time data from Schiphol CISS API</li>
                <li>• KLM-operated flights only (excludes codeshares)</li>
                <li>• Current gate shown (previous gate not available)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal for all gate changes */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Flight Gate Changes - Full Report</DialogTitle>
            <DialogDescription>
              All flights with GCH status sorted by {viewMode === 'priority' ? 'priority' : viewMode === 'delayed' ? 'delay status' : 'departure time'}
            </DialogDescription>
          </DialogHeader>
          
          {/* Modal Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Summary Statistics */}
            <div className="grid grid-cols-4 gap-3 mb-4 sticky top-0 bg-white z-10 pb-2">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-xs text-gray-600">Total Changes</div>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg">
                <div className="text-xl font-bold text-amber-600">{stats.urgent}</div>
                <div className="text-xs text-gray-600">Soon (&lt;1hr)</div>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <div className="text-xl font-bold text-orange-600">{stats.delayed}</div>
                <div className="text-xs text-gray-600">Delayed</div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="text-xl font-bold text-purple-600">{stats.delayedAndChanged}</div>
                <div className="text-xs text-gray-600">Delayed + GCH</div>
              </div>
            </div>

            {/* All Events */}
            <div className="space-y-3">
              {filteredEvents.map(event => renderEventRow(event, true))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}