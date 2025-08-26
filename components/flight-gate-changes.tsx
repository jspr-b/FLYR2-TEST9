'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
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
        events = events.filter(event => {
          const hasMultipleStates = event.flightStates.length > 1
          const hasDelay = event.isDelayed || event.flightStates.includes('DEL')
          return hasMultipleStates && hasDelay
        })
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
    // Calculate flights with multiple operational issues (GCH + DEL or other states)
    const multipleIssues = gateChangeEvents.filter(e => {
      // Count flights that have gate change PLUS other operational states
      const hasMultipleStates = e.flightStates.length > 1 // GCH + other states
      const hasDelay = e.isDelayed || e.flightStates.includes('DEL')
      return hasMultipleStates && hasDelay
    }).length
    
    // Gate distribution
    const gatesByPier = gateChangeEvents.reduce((acc, event) => {
      const pier = event.pier
      if (!acc[pier]) acc[pier] = 0
      acc[pier]++
      return acc
    }, {} as Record<string, number>)
    
    const mostAffectedPier = Object.entries(gatesByPier).sort((a, b) => b[1] - a[1])[0]
    
    return { total, urgent, delayed, multipleIssues, gatesByPier, mostAffectedPier }
  }, [gateChangeEvents])

  // Display first 8 events in card (more space with compact design)
  const displayEvents = filteredEvents.slice(0, 8)

  const formatTime = (minutes: number) => {
    if (minutes < 0) return 'Departed'
    if (minutes < 60) return `in ${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `in ${hours}h ${mins}m`
  }

  const renderEventRow = (event: GateChangeEvent, showInModal = false) => (
    <div key={event.flightNumber} className={showInModal ? "space-y-1.5 p-3 bg-gray-50 rounded-lg" : "space-y-1.5"}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <ArrowRightLeft className="w-4 h-4 text-blue-600" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-sm">{event.flightName}</span>
              {event.isPriority && (
                <span className="px-1 py-0.5 text-xs bg-amber-100 text-amber-700 rounded font-medium">SOON</span>
              )}
              {event.isDelayed && (
                <span className="px-1 py-0.5 text-xs bg-orange-100 text-orange-700 rounded font-medium">{event.delayMinutes}m</span>
              )}
            </div>
            <div className="text-xs text-gray-500 truncate">
              Gate {event.currentGate} • Pier {event.pier} • {event.destination}
            </div>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-base font-bold text-gray-700">{formatTime(event.timeUntilDeparture)}</div>
          <div className="text-xs text-gray-500">to depart</div>
        </div>
      </div>
      {!showInModal && (
        <div className="w-full bg-gray-200 rounded-full h-1">
          <div 
            className={`${event.isPriority ? 'bg-amber-500' : event.isDelayed ? 'bg-orange-500' : 'bg-blue-500'} h-1 rounded-full transition-all duration-500`}
            style={{ width: `${Math.max(100 - (Math.max(event.timeUntilDeparture, 0) / 180 * 100), 5)}%` }}
          />
        </div>
      )}
    </div>
  )

  return (
    <>
      <Card className="h-[600px] flex flex-col">
        <CardHeader className="pb-3 flex-shrink-0">
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
                <SelectItem value="delayed">Complex Issues</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="pt-0 flex-1 overflow-hidden flex flex-col">
          <div className="space-y-3 flex-1 overflow-y-auto pr-2">
            {displayEvents.length > 0 ? (
              displayEvents.map(event => renderEventRow(event))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <ArrowRightLeft className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  {viewMode === 'priority' && 'No urgent gate changes'}
                  {viewMode === 'delayed' && 'No flights with multiple operational issues'}
                  {viewMode === 'time' && 'No gate changes detected'}
                </p>
              </div>
            )}
          </div>
          
          {/* Summary Statistics and View All button */}
          {displayEvents.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>
                  Showing {displayEvents.length} of {filteredEvents.length} gate changes
                </span>
                {filteredEvents.length > 8 && (
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
          
          {/* Operational Metrics - Always show */}
          <div className="mt-4 space-y-2 flex-shrink-0">
            <div className="text-sm font-medium text-gray-700">Operational Impact:</div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-gray-600">Most Affected Pier</div>
                <div className="text-lg font-bold">
                  {stats.mostAffectedPier ? `Pier ${stats.mostAffectedPier[0]}` : 'None'}
                  <span className="text-xs font-normal text-gray-500 ml-1">
                    ({stats.mostAffectedPier?.[1] || 0} changes)
                  </span>
                </div>
              </div>
              
              <div>
                <div className="text-xs text-gray-600">Departing Soon</div>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className={`inline-flex items-center gap-1 text-lg font-bold hover:bg-amber-50 px-2 -mx-2 py-0.5 rounded transition-colors cursor-pointer ${
                      stats.urgent > 0 ? 'text-amber-600' : 'text-gray-600'
                    }`}>
                      {stats.urgent}
                      <span className="text-xs font-normal text-gray-500 ml-1">
                        ({stats.total > 0 ? Math.round((stats.urgent / stats.total) * 100) : 0}%)
                      </span>
                      {stats.urgent > 0 && (
                        <svg className="w-3 h-3 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </button>
                  </PopoverTrigger>
                  {stats.urgent > 0 && (
                    <PopoverContent className="w-80" align="start">
                      <div className="space-y-3">
                        <div>
                          <div className="text-sm font-semibold text-amber-700 mb-1">Departing Soon (Next Hour)</div>
                          <p className="text-xs text-gray-600">Gate changes for flights departing within 60 minutes</p>
                        </div>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {gateChangeEvents
                            .filter(e => e.isPriority)
                            .sort((a, b) => a.timeUntilDeparture - b.timeUntilDeparture)
                            .map((flight) => (
                              <div key={flight.flightNumber} className="text-sm border-b border-gray-100 pb-2 last:border-0">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <span className="font-medium">{flight.flightName}</span>
                                    {flight.flightStates.includes('BRD') && (
                                      <span className="text-xs ml-2 px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">BRD</span>
                                    )}
                                  </div>
                                  <span className="text-xs text-amber-600 font-semibold">{formatTime(flight.timeUntilDeparture)}</span>
                                </div>
                                <div className="text-xs text-gray-600 mt-0.5">
                                  Gate {flight.currentGate} → {flight.destination}
                                  {flight.isDelayed && <span className="ml-2 text-orange-600">Delayed {flight.delayMinutes}m</span>}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </PopoverContent>
                  )}
                </Popover>
              </div>
              
              <div>
                <div className="text-xs text-gray-600">Multiple Issues</div>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className={`inline-flex items-center gap-1 text-lg font-bold hover:bg-purple-50 px-2 -mx-2 py-0.5 rounded transition-colors cursor-pointer ${
                      stats.multipleIssues > 0 ? 'text-purple-600' : 'text-gray-600'
                    }`}>
                      {stats.multipleIssues}
                      <span className="text-xs font-normal text-gray-500 ml-1">
                        ({stats.total > 0 ? Math.round((stats.multipleIssues / stats.total) * 100) : 0}%)
                      </span>
                      {stats.multipleIssues > 0 && (
                        <svg className="w-3 h-3 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </button>
                  </PopoverTrigger>
                  {stats.multipleIssues > 0 && (
                    <PopoverContent className="w-80" align="start">
                      <div className="space-y-3">
                        <div>
                          <div className="text-sm font-semibold text-purple-700 mb-1">Complex Operational Issues</div>
                          <p className="text-xs text-gray-600">Flights with gate changes AND delays or multiple operational states</p>
                        </div>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {gateChangeEvents
                            .filter(e => {
                              const hasMultipleStates = e.flightStates.length > 1
                              const hasDelay = e.isDelayed || e.flightStates.includes('DEL')
                              return hasMultipleStates && hasDelay
                            })
                            .sort((a, b) => a.timeUntilDeparture - b.timeUntilDeparture)
                            .map((flight) => (
                              <div key={flight.flightNumber} className="text-sm border-b border-gray-100 pb-2 last:border-0">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <span className="font-medium">{flight.flightName}</span>
                                    <div className="inline-flex gap-1 ml-2">
                                      {flight.flightStates.map((state: string) => (
                                        <span key={state} className="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">
                                          {state}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                  <span className="text-xs text-gray-500">{formatTime(flight.timeUntilDeparture)}</span>
                                </div>
                                <div className="text-xs text-gray-600 mt-0.5">
                                  Gate {flight.currentGate} → {flight.destination}
                                  {flight.isDelayed && <span className="ml-2 text-orange-600">Delayed {flight.delayMinutes}m</span>}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </PopoverContent>
                  )}
                </Popover>
              </div>
              
              <div>
                <div className="text-xs text-gray-600">Total Changes</div>
                <div className="text-lg font-bold">
                  {stats.total}
                </div>
              </div>
            </div>
            
            <div className="text-xs text-gray-500 mt-2">
              Piers affected: {Object.keys(stats.gatesByPier).length > 0 ? Object.keys(stats.gatesByPier).sort().join(', ') : 'None'}
            </div>
          </div>
          
          {/* Status Legend - Horizontal */}
          <div className="mt-4 pt-3 border-t flex-shrink-0">
            <div className="text-sm font-medium text-gray-700 mb-2">Status Indicators:</div>
            
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 text-xs bg-amber-100 text-amber-700 rounded font-medium">SOON</span>
                <span className="text-xs text-gray-600">&lt;60min</span>
              </div>
              
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 text-xs bg-orange-100 text-orange-700 rounded font-medium">15m</span>
                <span className="text-xs text-gray-600">Delayed</span>
              </div>
              
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center">
                  <ArrowRightLeft className="w-3 h-3 text-blue-600" />
                </div>
                <span className="text-xs text-gray-600">Gate change</span>
              </div>
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
              All flights with GCH status sorted by {viewMode === 'priority' ? 'priority' : viewMode === 'delayed' ? 'complexity' : 'departure time'}
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
                <div className="text-xl font-bold text-purple-600">{stats.multipleIssues}</div>
                <div className="text-xs text-gray-600">Multiple Issues</div>
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