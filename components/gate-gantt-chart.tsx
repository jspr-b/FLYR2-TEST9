"use client"

import React, { useState, useEffect, useMemo, useRef, Fragment } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, Plane, Calendar, Maximize2, X, Eye } from "lucide-react"
import { TimeHeader } from './timeline/TimeHeader'
import { GateRow } from './timeline/GateRow'
import { Legend } from './timeline/Legend'
import { getCurrentAmsterdamTime, toAmsterdamTime } from '@/lib/amsterdam-time'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface GateGanttData {
  gateID: string
  pier: string
  flights: Array<{
    flightName: string
    flightNumber: string
    scheduleDateTime: string
    aircraftType: string
    destination: string
    primaryState: string
    primaryStateReadable: string
    isDelayed: boolean
    delayMinutes: number
    gate: string
  }>
}

interface GateGanttChartProps {
  gateData: GateGanttData[]
}

export function GateGanttChart({ gateData }: GateGanttChartProps) {
  // Use centralized Amsterdam time utility with periodic updates
  const [currentTime, setCurrentTime] = useState(() => getCurrentAmsterdamTime())
  const [showAllGates, setShowAllGates] = useState(false)
  const [hoveredFlight, setHoveredFlight] = useState<any>(null)
  const [hoveredPosition, setHoveredPosition] = useState<{ x: number; y: number } | null>(null)
  const [mounted, setMounted] = useState(false)
  const [selectedFlight, setSelectedFlight] = useState<any>(null) // For dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isFullScreenOpen, setIsFullScreenOpen] = useState(false)
  
  // Synchronized scrolling refs
  const headerScrollRef = useRef<HTMLDivElement>(null)
  const contentScrollRef = useRef<HTMLDivElement>(null)
  
  // Modal-specific ref for full-screen unified scrolling
  const modalContentScrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
    
    // Update current time every 30 seconds for better responsiveness
    const interval = setInterval(() => {
      setCurrentTime(getCurrentAmsterdamTime())
    }, 30000) // Update every 30 seconds
    
    return () => clearInterval(interval)
  }, [])

  // Synchronized scrolling effect for main view
  useEffect(() => {
    const headerEl = headerScrollRef.current
    const contentEl = contentScrollRef.current

    if (!headerEl || !contentEl) return

    const syncScroll = (source: HTMLDivElement, target: HTMLDivElement) => {
      return () => {
        target.scrollLeft = source.scrollLeft
      }
    }

    const headerToContent = syncScroll(headerEl, contentEl)
    const contentToHeader = syncScroll(contentEl, headerEl)

    headerEl.addEventListener('scroll', headerToContent)
    contentEl.addEventListener('scroll', contentToHeader)

    return () => {
      headerEl.removeEventListener('scroll', headerToContent)
      contentEl.removeEventListener('scroll', contentToHeader)
    }
  }, [mounted])

  // Modal uses unified scrolling - no separate synchronization needed

  // Determine if flight is Intra-European (Schengen/EU) vs Intercontinental
  const isIntraEuropean = (destination: string): boolean => {
    const europeanCountries = [
      // EU + Schengen countries (common airport codes)
      'AMS', 'BRU', 'CDG', 'FRA', 'MAD', 'BCN', 'FCO', 'MXP', 'VIE', 'ZUR', 'ZRH',
      'MUC', 'DUS', 'HAM', 'STR', 'CGN', 'LEJ', 'NUE', 'SXF', 'TXL', 'HAJ',
      'BER', 'LHR', 'LGW', 'STN', 'LTN', 'LCY', 'NWI', 'MAN', 'EDI', 'GLA', 'BHX', 'LBA',
      'ARN', 'CPH', 'OSL', 'BGO', 'TRD', 'SVG', 'HEL', 'TLL', 'RIX', 'VNO', 'WAW',
      'KRK', 'GDN', 'WRO', 'PRG', 'BTS', 'BUD', 'SOF', 'OTP', 'LJU', 'ZAG',
      'ATH', 'SKG', 'HER', 'CFU', 'LIS', 'OPO', 'DUB', 'ORK', 'REY', 'KEF',
      'MME', 'GOT', 'LPI', 'SPU', 'LUX', 'MRS', 'TRN', 'BLQ', 'GVA', 'BSL',
      'LIN', 'MIL', 'BRE', 'SZG', 'INN', 'GRZ', 'VCE', 'TSF', 'BLQ', 'NAP',
      'CTA', 'PMO', 'CAG', 'ALC', 'AGP', 'LEI', 'BIO', 'SDR', 'VGO', 'LCG',
      'TLS', 'BOD', 'NCE', 'LYS', 'MPL', 'NTE', 'RNS', 'BIQ', 'EXT', 'LIG'
    ]
    return europeanCountries.includes(destination)
  }

  // Calculate flight timeline based on destination type and delays
  const getFlightTimeline = (flight: any) => {
    // API data is already in Amsterdam timezone, no conversion needed for flight times
    const scheduledTime = new Date(flight.scheduleDateTime)
    const currentTime = getCurrentAmsterdamTime()
    
    // Use estimated time if delayed, otherwise use scheduled time
    // API data is already in Amsterdam timezone, no conversion needed
    const actualDepartureTime = flight.estimatedDateTime 
      ? new Date(flight.estimatedDateTime)
      : scheduledTime
    
    // Different gate occupation times based on flight type
    const isEuropean = isIntraEuropean(flight.destination)
    const gateOpenMinutes = isEuropean ? 45 : 60  // EU: 45min, Intercontinental: 60min
    
    // Calculate original and new gate open times
    const originalGateOpenTime = new Date(scheduledTime.getTime() - gateOpenMinutes * 60 * 1000)
    const newGateOpenTime = new Date(actualDepartureTime.getTime() - gateOpenMinutes * 60 * 1000)
    
    let gateOpenTime, gateCloseTime
    
    if (flight.isDelayed && flight.estimatedDateTime) {
      // Delayed flight logic
      if (currentTime >= originalGateOpenTime) {
        // Gate already open - extend the card but keep original start
        gateOpenTime = originalGateOpenTime
        gateCloseTime = new Date(actualDepartureTime.getTime() + 10 * 60 * 1000)
      } else {
        // Gate not yet open - shift entire timeline to new departure time
        gateOpenTime = newGateOpenTime
        gateCloseTime = new Date(actualDepartureTime.getTime() + 10 * 60 * 1000)
      }
    } else {
      // Normal flight - use scheduled time
      gateOpenTime = originalGateOpenTime
      gateCloseTime = new Date(actualDepartureTime.getTime() + 10 * 60 * 1000)
    }
    
    return {
      startTime: gateOpenTime,
      endTime: gateCloseTime,
      scheduledTime: scheduledTime,
      actualDepartureTime: actualDepartureTime,
      originalGateOpenTime: originalGateOpenTime,
      newGateOpenTime: newGateOpenTime,
      currentPhase: flight.primaryState,
      isTimelineShifted: flight.isDelayed && flight.estimatedDateTime,
      isExtended: flight.isDelayed && currentTime >= originalGateOpenTime,
      flightType: isEuropean ? 'European' : 'Intercontinental',
      gateOpenMinutes: gateOpenMinutes
    }
  }

  // Calculate dynamic time range based on actual flight data
  // Note: Flight data from API is already in Amsterdam timezone
  const { dynamicStartTime, dynamicEndTime } = useMemo(() => {
    if (!mounted || !gateData || gateData.length === 0) {
      // Fallback to current time-based range if no data
      // Use Amsterdam time for comparison with flight data
      const now = getCurrentAmsterdamTime()
      const start = new Date(now.getTime() - (2 * 60 * 60 * 1000)) // 2 hours before now
      const end = new Date(now.getTime() + (4 * 60 * 60 * 1000)) // 4 hours after now
      start.setMinutes(0, 0, 0)
      end.setMinutes(0, 0, 0)
      return { dynamicStartTime: start, dynamicEndTime: end }
    }

    // Get all flight timelines - these are already in Amsterdam time
    const allFlightTimelines = gateData.flatMap(gate => 
      gate.flights.map(flight => getFlightTimeline(flight))
    )

    if (allFlightTimelines.length === 0) {
      // Fallback if no flights - use current Amsterdam time
      const now = getCurrentAmsterdamTime()
      const start = new Date(now.getTime() - (1 * 60 * 60 * 1000)) // 1 hour before now
      const end = new Date(now.getTime() + (3 * 60 * 60 * 1000)) // 3 hours after now
      start.setMinutes(0, 0, 0)
      end.setMinutes(0, 0, 0)
      return { dynamicStartTime: start, dynamicEndTime: end }
    }

    // Find earliest start and latest end times
    const earliestStart = allFlightTimelines.reduce((earliest, timeline) => 
      timeline.startTime < earliest ? timeline.startTime : earliest, 
      allFlightTimelines[0].startTime
    )
    const latestEnd = allFlightTimelines.reduce((latest, timeline) => 
      timeline.endTime > latest ? timeline.endTime : latest, 
      allFlightTimelines[0].endTime
    )

    // Tighter padding: 15 minutes before first flight, 15 minutes after last flight
    const startTime = new Date(earliestStart.getTime() - (15 * 60 * 1000))
    const endTime = new Date(latestEnd.getTime() + (15 * 60 * 1000))
    
    // Round to nearest 30 minutes for more compact display
    const startMinutes = startTime.getMinutes()
    const roundedStartMinutes = startMinutes < 30 ? 0 : 30
    startTime.setMinutes(roundedStartMinutes, 0, 0)
    
    const endMinutes = endTime.getMinutes()
    const roundedEndMinutes = endMinutes <= 30 ? 30 : 60
    if (roundedEndMinutes === 60) {
      endTime.setTime(endTime.getTime() + (60 * 60 * 1000))
      endTime.setMinutes(0, 0, 0)
    } else {
      endTime.setMinutes(roundedEndMinutes, 0, 0)
    }

    return { dynamicStartTime: startTime, dynamicEndTime: endTime }
  }, [mounted, gateData, currentTime])

  // Generate time slots based on dynamic range - 30 minute intervals for better granularity
  // Since flight data is already in Amsterdam time, we need to ensure slots are also in Amsterdam context
  const timeSlots = useMemo(() => {
    const slots = []
    const totalMinutes = Math.ceil((dynamicEndTime.getTime() - dynamicStartTime.getTime()) / (60 * 1000))
    const intervalMinutes = 30 // 30-minute intervals
    
    for (let i = 0; i <= totalMinutes; i += intervalMinutes) {
      const slotTime = new Date(dynamicStartTime.getTime() + (i * 60 * 1000))
      slots.push(slotTime)
    }
    return slots
  }, [mounted, dynamicStartTime, dynamicEndTime])

  // Function to detect overlapping flights and create stacking layout
  const createFlightStacks = (flights: any[]) => {
    try {
      if (flights.length === 0) return []
      
      // Get timelines for all flights
      const flightsWithTimelines = flights.map(flight => ({
        ...flight,
        timeline: getFlightTimeline(flight)
      }))
      
      // Sort by start time
      flightsWithTimelines.sort((a, b) => a.timeline.startTime.getTime() - b.timeline.startTime.getTime())
      
      const stacks: any[][] = []
      
      flightsWithTimelines.forEach(flight => {
        // Find the first stack where this flight doesn't overlap with the last flight
        let assignedToStack = false
        
        for (let i = 0; i < stacks.length; i++) {
          const lastFlightInStack = stacks[i][stacks[i].length - 1]
          
          // Check if current flight starts after the last flight in this stack ends
          if (flight.timeline.startTime >= lastFlightInStack.timeline.endTime) {
            stacks[i].push(flight)
            assignedToStack = true
            break
          }
        }
        
        // If no suitable stack found, create a new one
        if (!assignedToStack) {
          stacks.push([flight])
        }
      })
      
      return stacks
    } catch (error) {
      console.error('Error creating flight stacks:', error)
      // Return simple flat layout as fallback
      return flights.map(flight => [flight])
    }
  }

  // Filter and process gate data for the dynamic time range
  const processedGateData = useMemo(() => {
    try {
      const viewStartTime = dynamicStartTime
      const viewEndTime = dynamicEndTime
      
      const filteredData = gateData
        .map(gate => {
          try {
            // Filter flights that are visible in current time window
            const visibleFlights = gate.flights.filter(flight => {
              try {
                // Get the full gate timeline for this flight
                const timeline = getFlightTimeline(flight)
                
                // Show flight if any part of its gate timeline overlaps with view window
                return timeline.endTime >= viewStartTime && timeline.startTime <= viewEndTime
              } catch (error) {
                console.error('Error processing flight timeline:', error, flight)
                return false
              }
            })
            
            // Create stacking layout for this gate's flights
            const flightStacks = createFlightStacks(visibleFlights)
            
            return {
              ...gate,
              flights: visibleFlights,
              flightStacks: flightStacks,
              maxConcurrentFlights: Math.max(1, flightStacks.length) // Use number of stacks, not total flights
            }
          } catch (error) {
            console.error('Error processing gate:', error, gate)
            return {
              ...gate,
              flights: [],
              flightStacks: [],
              maxConcurrentFlights: 0
            }
          }
        })
      
      // Show all gates or only gates with flights based on toggle
      const finalData = showAllGates 
        ? filteredData
        : filteredData.filter(gate => gate.flights.length > 0)
      
      return finalData.sort((a, b) => a.gateID.localeCompare(b.gateID))
    } catch (error) {
      console.error('Error processing gate data:', error)
      return []
    }
  }, [mounted, gateData, dynamicStartTime, dynamicEndTime, showAllGates])

  // Early return for loading state - prevent processing empty data
  if (!gateData) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Gate Schedule Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  // Prevent hydration mismatch by showing loading until mounted
  if (!mounted) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Gate Schedule Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">Initializing timeline...</div>
        </CardContent>
      </Card>
    )
  }

  // Get status color for flight (trust API completely)
  const getStatusColor = (flight: any) => {
    // Use API status directly - no overrides
    const displayStatus = flight.primaryState
    
    switch (displayStatus) {
      case 'BRD': return 'bg-green-500 border-green-700'     // Boarding - GREEN
      case 'GTO': return 'bg-blue-500 border-blue-700'      // Gate Open - BLUE
      case 'GCL': return 'bg-yellow-500 border-yellow-700'  // Gate Closing - YELLOW
      case 'GTD': return 'bg-orange-500 border-orange-700'  // Gate Closed - ORANGE
      case 'DEP': return 'bg-gray-500 border-gray-700'      // Departed - GRAY
      case 'SCH': return 'bg-purple-500 border-purple-700'  // Scheduled - PURPLE
      case 'DEL': return 'bg-red-400 border-red-600'        // Delayed state - RED
      case 'CNX': return 'bg-gray-400 border-gray-600'      // Cancelled - GRAY
      default: return 'bg-gray-400 border-gray-600'         // Unknown - GRAY
    }
  }

  // Calculate position and width for flight bar based on real timeline
  const getFlightBarStyle = (flight: any) => {
    const timeline = getFlightTimeline(flight)
    const viewStartTime = timeSlots[0]
    const viewEndTime = timeSlots[timeSlots.length - 1]
    
    const totalViewDuration = viewEndTime.getTime() - viewStartTime.getTime()
    
    // Flight starts when gate opens, ends at departure + 10min
    const flightStartOffset = timeline.startTime.getTime() - viewStartTime.getTime()
    const flightEndOffset = timeline.endTime.getTime() - viewStartTime.getTime()
    
    const leftPercent = Math.max(0, (flightStartOffset / totalViewDuration) * 100)
    const rightPercent = Math.min(100, (flightEndOffset / totalViewDuration) * 100)
    const widthPercent = rightPercent - leftPercent
    
    return {
      left: `${leftPercent}%`,
      width: `${Math.max(widthPercent, 3)}%`, // Minimum 3% for better visibility
      minWidth: '80px' // Ensure better readability
    }
  }

  // Calculate current time position with enhanced precision
  const getCurrentTimePosition = () => {
    const now = currentTime // Use the state that updates every 30 seconds
    const startTime = timeSlots[0]
    const endTime = timeSlots[timeSlots.length - 1]
    
    if (!startTime || !endTime) return { position: 0, isVisible: false }
    
    const totalDuration = endTime.getTime() - startTime.getTime()
    const currentOffset = now.getTime() - startTime.getTime()
    
    // Check if current time is within the visible timeline
    const isVisible = currentOffset >= 0 && currentOffset <= totalDuration
    const position = Math.max(0, Math.min(100, (currentOffset / totalDuration) * 100))
    
    return { position, isVisible }
  }

  const handleFlightHover = (flight: any, event: React.MouseEvent) => {
    setHoveredFlight(flight)
    setHoveredPosition({ x: event.clientX, y: event.clientY })
  }

  const handleFlightLeave = () => {
    setHoveredFlight(null)
    setHoveredPosition(null)
  }

  const handleFlightClick = (flight: any, gate?: any) => {
    // Enhance flight data with gate information including pier
    const enhancedFlight = {
      ...flight,
      pier: gate?.pier || flight.pier || 'N/A'
    }
    setSelectedFlight(enhancedFlight)
    setIsDialogOpen(true)
  }

  // Render Gantt chart content - reusable for both normal and full screen views
  const renderGanttContent = (isFullScreen = false) => {
    if (isFullScreen) {
      // Modal version - unified scrolling
      return (
        <div className="w-full h-full overflow-auto" ref={modalContentScrollRef}>
          <div className="min-w-fit">
            {/* Time Header - Part of scrollable content */}
            <div className="sticky top-0 bg-white z-10 border-b border-gray-200">
              <div className="flex min-w-fit">
                {timeSlots.map((slot, index) => (
                  <div 
                    key={index} 
                    className="flex flex-col items-center justify-center border-l border-gray-200 py-3 bg-gray-50 flex-shrink-0"
                    style={{ width: '100px', minWidth: '100px', maxWidth: '100px' }}
                  >
                    <span className="font-medium text-xs whitespace-nowrap">
                      {slot.toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        hour12: false,
                        timeZone: 'Europe/Amsterdam'
                      })}
                    </span>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      AMS {slot.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Gates Content */}
            <div className="min-w-fit">{processedGateData.map((gate) => (
              <div key={gate.gateID} className="border-b border-gray-100 last:border-b-0">
                {/* Gate Label Row - Sticky Left */}
                <div className="flex items-center py-2 px-3 bg-gray-50 border-b border-gray-200 sticky left-0 z-10 shadow-sm">
                  <div className="w-16 text-sm font-medium text-gray-900 flex-shrink-0">
                    {gate.gateID}
                  </div>
                  <div className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                    Pier {gate.pier} • {gate.flights.length} flight{gate.flights.length !== 1 ? 's' : ''}
                  </div>
                </div>
                
                {/* Timeline Bar - Responsive Height Based on Stacks */}
                <div 
                  className="relative bg-white flex border-b border-gray-100"
                  style={{ 
                    height: `${Math.max(48, ((gate as any).flightStacks?.length || 0) * 36 + 12)}px`
                  }}
                >
                  {/* Grid lines - Responsive Width */}
                  {timeSlots.map((_, index) => (
                    <div 
                      key={index} 
                      className="border-l border-gray-200 flex-shrink-0 relative" 
                      style={{ width: '100px', minWidth: '100px', maxWidth: '100px' }}
                    />
                  ))}
                  
                  {/* Flight Stacks - Positioned Absolutely */}
                  <div className="absolute inset-0">
                    {((gate as any).flightStacks || []).map((stack: any[], stackIndex: number) => (
                      <React.Fragment key={stackIndex}>
                      {stack.map((flight, flightIndex) => {
                        const timeline = getFlightTimeline(flight)
                        const barDuration = timeline.endTime.getTime() - timeline.startTime.getTime()
                        
                        // Calculate positions for both scheduled and actual departure times
                        const scheduledDepartureOffset = timeline.scheduledTime.getTime() - timeline.startTime.getTime()
                        const scheduledDeparturePercent = (scheduledDepartureOffset / barDuration) * 100
                        
                        const actualDepartureOffset = timeline.actualDepartureTime.getTime() - timeline.startTime.getTime()
                        const actualDeparturePercent = (actualDepartureOffset / barDuration) * 100
                        
                        // Calculate vertical position based on stack index
                        const barHeight = 30 // Reduced from 32 to leave 6px gap between stacks
                        const barTop = 6 + (stackIndex * 36)
                        
                        return (
                          <div
                            key={`${stackIndex}-${flightIndex}`}
                            className={`absolute rounded border cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-md hover:z-10 ${getStatusColor(flight)}`}
                            style={{
                              ...getFlightBarStyle(flight),
                              top: `${barTop}px`,
                              height: `${barHeight}px`
                            }}
                            onMouseEnter={(e) => handleFlightHover(flight, e)}
                            onMouseLeave={handleFlightLeave}
                            onMouseMove={(e) => setHoveredPosition({ x: e.clientX, y: e.clientY })}
                            onClick={() => handleFlightClick(flight, gate)}
                          >
                            <div className="h-full flex items-center justify-center text-white text-xs font-medium px-2 truncate">
                              {flight.flightName}
                            </div>
                            
                            {/* Departure Time Indicators */}
                            {timeline.isTimelineShifted ? (
                              <>
                                {/* Original scheduled time (dashed) */}
                                <div 
                                  className="absolute top-1 bottom-1 w-0.5 bg-gray-300/60 border-l-2 border-dashed border-gray-400"
                                  style={{ left: `${Math.max(0, Math.min(100, scheduledDeparturePercent))}%` }}
                                  title={`Original: ${timeline.scheduledTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Amsterdam' })}`}
                                />
                                {/* New estimated time (solid) */}
                                <div 
                                  className="absolute top-0 bottom-0 w-0.5 bg-white/90 shadow-sm"
                                  style={{ left: `${Math.max(0, Math.min(100, actualDeparturePercent))}%` }}
                                  title={`New Time: ${timeline.actualDepartureTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Amsterdam' })}`}
                                />
                              </>
                            ) : (
                              /* Normal flight - use actual departure time (which equals scheduled for non-delayed) */
                              <div 
                                className="absolute top-0 bottom-0 w-0.5 bg-white/80 shadow-sm"
                                style={{ left: `${Math.max(0, Math.min(100, actualDeparturePercent))}%` }}
                                title={`Departure: ${timeline.actualDepartureTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Amsterdam' })}`}
                              />
                            )}
                          </div>
                        )
                      })}
                    </React.Fragment>
                  ))}
                  
                    {/* Current Time Indicator - Simple Line */}
                    {(() => {
                      const { position, isVisible } = getCurrentTimePosition()
                      
                      if (!isVisible) return null
                      
                      return (
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20"
                          style={{ left: `${position}%`, transform: 'translateX(-0.5px)' }}
                        />
                      )
                    })()}
                  </div>
                </div>
              </div>
            ))}

            {/* No Data State */}
            {processedGateData.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Plane className="w-8 h-8 mx-auto mb-2 opacity-50" />
                {showAllGates ? (
                  <div>
                    <p>No gates available</p>
                    <p className="text-xs">No gate data found</p>
                  </div>
                ) : (
                  <div>
                    <p>No gates with upcoming flights in the selected time range</p>
                    <p className="text-xs">Try selecting a longer time range or toggle "Show all gates"</p>
                  </div>
                )}
              </div>
            )}</div>
          </div>
        </div>
      )
    }

    // Main component version - synchronized scrolling
    const containerClass = "w-full"
    const headerClass = "sticky top-0 bg-white z-10 border-b border-gray-200"
    const contentClass = "max-h-96 overflow-auto border-t-0"

    return (
      <div className={containerClass}>
        {/* Time Header - Synchronized with content */}
        <div className={headerClass}>
          <div 
            ref={headerScrollRef}
            className="overflow-x-auto scrollbar-hide"
          >
            <div className="flex min-w-fit">
              {timeSlots.map((slot, index) => (
                <div 
                  key={index} 
                  className="flex flex-col items-center justify-center border-l border-gray-200 py-3 bg-gray-50 flex-shrink-0"
                  style={{ width: '100px', minWidth: '100px', maxWidth: '100px' }}
                >
                  <span className="font-medium text-xs whitespace-nowrap">
                    {slot.toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: false,
                      timeZone: 'Europe/Amsterdam'
                    })}
                  </span>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    AMS {slot.toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Gates Content - Synchronized with header */}
        <div 
          ref={contentScrollRef}
          className={contentClass}
        >
          <div className="min-w-fit">
            {processedGateData.map((gate) => (
              <div key={gate.gateID} className="border-b border-gray-100 last:border-b-0">
                {/* Gate Label Row - Sticky Left */}
                <div className="flex items-center py-2 px-3 bg-gray-50 border-b border-gray-200 sticky left-0 z-10 shadow-sm">
                  <div className="w-16 text-sm font-medium text-gray-900 flex-shrink-0">
                    {gate.gateID}
                  </div>
                  <div className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                    Pier {gate.pier} • {gate.flights.length} flight{gate.flights.length !== 1 ? 's' : ''}
                  </div>
                </div>
                
                {/* Timeline Bar - Responsive Height Based on Stacks */}
                <div 
                  className="relative bg-white flex border-b border-gray-100"
                  style={{ 
                    height: `${Math.max(48, ((gate as any).flightStacks?.length || 0) * 36 + 12)}px`
                  }}
                >
                  {/* Grid lines - Responsive Width */}
                  {timeSlots.map((_, index) => (
                    <div 
                      key={index} 
                      className="border-l border-gray-200 flex-shrink-0 relative" 
                      style={{ width: '100px', minWidth: '100px', maxWidth: '100px' }}
                    />
                  ))}
                  
                  {/* Flight Stacks - Positioned Absolutely */}
                  <div className="absolute inset-0">
                    {((gate as any).flightStacks || []).map((stack: any[], stackIndex: number) => (
                      <React.Fragment key={stackIndex}>
                      {stack.map((flight, flightIndex) => {
                        const timeline = getFlightTimeline(flight)
                        const barDuration = timeline.endTime.getTime() - timeline.startTime.getTime()
                        
                        // Calculate positions for both scheduled and actual departure times
                        const scheduledDepartureOffset = timeline.scheduledTime.getTime() - timeline.startTime.getTime()
                        const scheduledDeparturePercent = (scheduledDepartureOffset / barDuration) * 100
                        
                        const actualDepartureOffset = timeline.actualDepartureTime.getTime() - timeline.startTime.getTime()
                        const actualDeparturePercent = (actualDepartureOffset / barDuration) * 100
                        
                        // Calculate vertical position based on stack index
                        const barHeight = 30 // Reduced from 32 to leave 6px gap between stacks
                        const barTop = 6 + (stackIndex * 36)
                        
                        return (
                          <div
                            key={`${stackIndex}-${flightIndex}`}
                            className={`absolute rounded border cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-md hover:z-10 ${getStatusColor(flight)}`}
                            style={{
                              ...getFlightBarStyle(flight),
                              top: `${barTop}px`,
                              height: `${barHeight}px`
                            }}
                            onMouseEnter={(e) => handleFlightHover(flight, e)}
                            onMouseLeave={handleFlightLeave}
                            onMouseMove={(e) => setHoveredPosition({ x: e.clientX, y: e.clientY })}
                            onClick={() => handleFlightClick(flight, gate)}
                          >
                            <div className="h-full flex items-center justify-center text-white text-xs font-medium px-2 truncate">
                              {flight.flightName}
                            </div>
                            
                            {/* Departure Time Indicators */}
                            {timeline.isTimelineShifted ? (
                              <>
                                {/* Original scheduled time (dashed) */}
                                <div 
                                  className="absolute top-1 bottom-1 w-0.5 bg-gray-300/60 border-l-2 border-dashed border-gray-400"
                                  style={{ left: `${Math.max(0, Math.min(100, scheduledDeparturePercent))}%` }}
                                  title={`Original: ${timeline.scheduledTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Amsterdam' })}`}
                                />
                                {/* New estimated time (solid) */}
                                <div 
                                  className="absolute top-0 bottom-0 w-0.5 bg-white/90 shadow-sm"
                                  style={{ left: `${Math.max(0, Math.min(100, actualDeparturePercent))}%` }}
                                  title={`New Time: ${timeline.actualDepartureTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Amsterdam' })}`}
                                />
                              </>
                            ) : (
                              /* Normal flight - use actual departure time (which equals scheduled for non-delayed) */
                              <div 
                                className="absolute top-0 bottom-0 w-0.5 bg-white/80 shadow-sm"
                                style={{ left: `${Math.max(0, Math.min(100, actualDeparturePercent))}%` }}
                                title={`Departure: ${timeline.actualDepartureTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Amsterdam' })}`}
                              />
                            )}
                          </div>
                        )
                      })}
                    </React.Fragment>
                  ))}
                  
                    {/* Current Time Indicator - Simple Line */}
                    {(() => {
                      const { position, isVisible } = getCurrentTimePosition()
                      
                      if (!isVisible) return null
                      
                      return (
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20"
                          style={{ left: `${position}%`, transform: 'translateX(-0.5px)' }}
                        />
                      )
                    })()}
                  </div>
                </div>
              </div>
            ))}

            {/* No Data State */}
            {processedGateData.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Plane className="w-8 h-8 mx-auto mb-2 opacity-50" />
                {showAllGates ? (
                  <div>
                    <p>No gates available</p>
                    <p className="text-xs">No gate data found</p>
                  </div>
                ) : (
                  <div>
                    <p>No gates with upcoming flights in the selected time range</p>
                    <p className="text-xs">Try selecting a longer time range or toggle "Show all gates"</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <Fragment>
    <Card className="w-full max-w-full overflow-hidden">
      <CardHeader className="pb-2 px-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <CardTitle className="text-base sm:text-lg">Gate Schedule Timeline</CardTitle>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
            {/* All Gates Toggle */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-700 whitespace-nowrap">Show all gates</label>
              <button
                onClick={() => setShowAllGates(!showAllGates)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                  showAllGates ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                    showAllGates ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            
            {/* Full Screen Toggle */}
            <button
              onClick={() => setIsFullScreenOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
            >
              <Eye className="h-4 w-4" />
              View All
            </button>
            
            {/* Dynamic Time Range Display */}
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span>Timeline:</span>
              <span className="font-medium">
                {dynamicStartTime.toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: false,
                  timeZone: 'Europe/Amsterdam'
                })} - {dynamicEndTime.toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: false,
                  timeZone: 'Europe/Amsterdam'
                })} (AMS)
              </span>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-600">
          {showAllGates 
            ? `All gates • ${processedGateData.length} gates displayed • ${processedGateData.filter(g => g.flights.length > 0).length} with flights • Amsterdam Time (UTC+2)`
            : `Gates with flights only • ${processedGateData.length} active gates • Amsterdam Time (UTC+2)`
          }
        </p>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Synchronized Gantt Chart Container */}
        {renderGanttContent(false)}

        {/* Legend - Responsive */}
        <div className="border-t pt-4 mt-4 px-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Flight Status Legend</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 border border-green-700 rounded flex-shrink-0"></div>
              <span className="whitespace-nowrap">Boarding</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 border border-blue-700 rounded flex-shrink-0"></div>
              <span className="whitespace-nowrap">Gate Open</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 border border-yellow-700 rounded flex-shrink-0"></div>
              <span className="whitespace-nowrap">Gate Closing</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 border border-orange-700 rounded flex-shrink-0"></div>
              <span className="whitespace-nowrap">Gate Closed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 border border-purple-700 rounded flex-shrink-0"></div>
              <span className="whitespace-nowrap">Scheduled</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-400 border border-red-600 rounded flex-shrink-0"></div>
              <span className="whitespace-nowrap">Delayed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-500 border border-gray-700 rounded flex-shrink-0"></div>
              <span className="whitespace-nowrap">Departed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-0.5 h-3 bg-red-500 flex-shrink-0"></div>
              <span className="whitespace-nowrap">Current Time</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-0.5 h-3 bg-white border border-gray-400 flex-shrink-0"></div>
              <span className="whitespace-nowrap">Departure</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-0.5 h-3 bg-gray-400 border-l border-dashed border-gray-500 flex-shrink-0"></div>
              <span className="whitespace-nowrap">Original Time</span>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <span>ℹ️</span>
              <span>Smart delay handling: timeline shifts or extends based on gate status</span>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Hover Tooltip */}
      {hoveredFlight && hoveredPosition && (() => {
        const timeline = getFlightTimeline(hoveredFlight)
        return (
          <div
            className="fixed z-50 bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-xs max-w-xs pointer-events-none"
            style={{
              left: `${hoveredPosition.x + 10}px`,
              top: `${hoveredPosition.y - 10}px`,
              transform: 'translateY(-100%)'
            }}
          >
            <div className="font-medium">{hoveredFlight.flightName}</div>
            <div className="text-gray-300">
              {hoveredFlight.destination} • {hoveredFlight.aircraftType}
            </div>
            
            {/* Enhanced Departure Times with Timeline Info */}
            <div className="border-t border-gray-600 pt-1 mt-1">
              <div className="text-gray-400 text-xs">Flight Times:</div>
              
              {/* Original Scheduled Time */}
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-xs">Original Scheduled:</span>
                <span className="text-gray-300">
                  {timeline.scheduledTime.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                    timeZone: 'Europe/Amsterdam'
                  })}
                </span>
              </div>
              
              {/* Actual/Estimated Departure Time */}
              <div className="flex justify-between items-center">
                <span className="text-yellow-300 text-xs">Actual Departure:</span>
                <span className="text-yellow-300 font-medium">
                  {timeline.actualDepartureTime.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                    timeZone: 'Europe/Amsterdam'
                  })}
                </span>
              </div>
              
              {/* Show delay if exists */}
              {hoveredFlight.isDelayed && hoveredFlight.delayMinutes > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-red-300 text-xs">Delay:</span>
                  <span className="text-red-300 font-medium">
                    +{hoveredFlight.delayMinutes}min
                  </span>
                </div>
              )}
              
              {/* Gate Timeline Info */}
              <div className="border-t border-gray-700 pt-1 mt-1">
                <div className="text-gray-400 text-xs">Gate Timeline:</div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-300 text-xs">Gate Opens:</span>
                  <span className="text-blue-300">
                    {timeline.startTime.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false,
                      timeZone: 'Europe/Amsterdam'
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-300 text-xs">Gate Closes:</span>
                  <span className="text-blue-300">
                    {timeline.endTime.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false,
                      timeZone: 'Europe/Amsterdam'
                    })}
                  </span>
                </div>
              </div>
            </div>
          
            
            {/* Status */}
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-xs">Status:</span>
              <span className={`text-xs ${hoveredFlight.isDelayed ? 'text-red-300' : 'text-green-300'}`}>
                {hoveredFlight.primaryStateReadable}
              </span>
            </div>
            
            {/* Click hint */}
            <div className="border-t border-gray-600 pt-1 mt-1 text-center">
              <span className="text-gray-400 text-xs italic">Click for details</span>
            </div>
          </div>
        )
      })()}
    </Card>
      )}

      {/* Full Screen Modal */}
      {isFullScreenOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full h-full max-w-none max-h-none flex flex-col">
            <div className="flex items-center justify-between p-6 border-b bg-white">
              <div className="flex items-center gap-3">
                <Calendar className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Gate Schedule Timeline - Full View</h2>
                <span className="text-sm text-gray-500">
                  ({processedGateData.length} gates • {processedGateData.filter(g => g.flights.length > 0).length} with flights)
                </span>
              </div>
              <div className="flex items-center gap-4">
                {/* Controls in full screen */}
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-gray-700 whitespace-nowrap">Show all gates</label>
                  <button
                    onClick={() => setShowAllGates(!showAllGates)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                      showAllGates ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        showAllGates ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span>Timeline:</span>
                  <span className="font-medium">
                    {dynamicStartTime.toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: false,
                      timeZone: 'Europe/Amsterdam'
                    })} - {dynamicEndTime.toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: false,
                      timeZone: 'Europe/Amsterdam'
                    })} (AMS)
                  </span>
                </div>
                
                <button
                  onClick={() => setIsFullScreenOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-hidden">
              {renderGanttContent(true)}
            </div>
            
            {/* Legend in full screen */}
            <div className="border-t pt-4 pb-4 px-6 bg-gray-50">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Flight Status Legend</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 border border-green-700 rounded flex-shrink-0"></div>
                  <span className="whitespace-nowrap">Boarding</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 border border-blue-700 rounded flex-shrink-0"></div>
                  <span className="whitespace-nowrap">Gate Open</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 border border-yellow-700 rounded flex-shrink-0"></div>
                  <span className="whitespace-nowrap">Gate Closing</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 border border-orange-700 rounded flex-shrink-0"></div>
                  <span className="whitespace-nowrap">Gate Closed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-500 border border-purple-700 rounded flex-shrink-0"></div>
                  <span className="whitespace-nowrap">Scheduled</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-400 border border-red-600 rounded flex-shrink-0"></div>
                  <span className="whitespace-nowrap">Delayed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-500 border border-gray-700 rounded flex-shrink-0"></div>
                  <span className="whitespace-nowrap">Departed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-0.5 h-3 bg-red-500 flex-shrink-0"></div>
                  <span className="whitespace-nowrap">Current Time</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-0.5 h-3 bg-white border border-gray-400 flex-shrink-0"></div>
                  <span className="whitespace-nowrap">Departure</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-0.5 h-3 bg-gray-400 border-l border-dashed border-gray-500 flex-shrink-0"></div>
                  <span className="whitespace-nowrap">Original Time</span>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <span>ℹ️</span>
                  <span>Smart delay handling: timeline shifts or extends based on gate status</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Flight Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Flight {selectedFlight?.flightName} Details
            </DialogTitle>
            <DialogDescription>
              {selectedFlight?.destination} • {selectedFlight?.aircraftType}
            </DialogDescription>
          </DialogHeader>
          
          {selectedFlight && (() => {
            const timeline = getFlightTimeline(selectedFlight)
            const delayMinutes = selectedFlight.delayMinutes || 0
            
            return (
              <div className="space-y-6">
                {/* Flight Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-sm text-gray-600 mb-2">Flight Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Flight Number:</span>
                        <span className="font-medium">{selectedFlight.flightName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Destination:</span>
                        <span className="font-medium">{selectedFlight.destination}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Aircraft Type:</span>
                        <span className="font-medium">{selectedFlight.aircraftType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Gate:</span>
                        <span className="font-medium">{selectedFlight.gate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Pier:</span>
                        <span className="font-medium">{selectedFlight.pier}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-sm text-gray-600 mb-2">Status Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Status:</span>
                        <span className={`font-medium ${selectedFlight.isDelayed ? 'text-red-600' : 'text-green-600'}`}>
                          {selectedFlight.primaryStateReadable}
                        </span>
                      </div>
                      {selectedFlight.isDelayed && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Delay:</span>
                          <span className="font-medium text-red-600">
                            {delayMinutes > 60 
                              ? `${Math.floor(delayMinutes / 60)}h ${delayMinutes % 60}m`
                              : `${delayMinutes}min`
                            }
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-500">Flight Type:</span>
                        <span className="font-medium">
                          {isIntraEuropean(selectedFlight.destination) ? 'Intra-European' : 'Intercontinental'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Timeline Information */}
                <div>
                  <h3 className="font-semibold text-sm text-gray-600 mb-2">Timeline Details</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 block mb-1">Scheduled Departure:</span>
                        <span className="font-medium">
                          {timeline.scheduledTime.toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                            timeZone: 'Europe/Amsterdam'
                          })} AMS
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block mb-1">
                          {selectedFlight.isDelayed ? 'Estimated Departure:' : 'Actual Departure:'}
                        </span>
                        <span className={`font-medium ${selectedFlight.isDelayed ? 'text-red-600' : ''}`}>
                          {timeline.actualDepartureTime.toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                            timeZone: 'Europe/Amsterdam'
                          })} AMS
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 block mb-1">Gate Opens:</span>
                        <span className="font-medium">
                          {timeline.startTime.toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                            timeZone: 'Europe/Amsterdam'
                          })} AMS
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block mb-1">Gate Closes:</span>
                        <span className="font-medium">
                          {timeline.endTime.toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                            timeZone: 'Europe/Amsterdam'
                          })} AMS
                        </span>
                      </div>
                    </div>
                    
                    {/* Visual Timeline */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`absolute h-full ${getStatusColor(selectedFlight)}`}
                          style={{
                            left: '0%',
                            width: '100%'
                          }}
                        />
                        {timeline.isTimelineShifted && (
                          <>
                            <div 
                              className="absolute top-1 bottom-1 w-0.5 bg-gray-600 border-l-2 border-dashed"
                              style={{ 
                                left: `${((timeline.scheduledTime.getTime() - timeline.startTime.getTime()) / 
                                  (timeline.endTime.getTime() - timeline.startTime.getTime())) * 100}%` 
                              }}
                            />
                            <div 
                              className="absolute top-0 bottom-0 w-1 bg-white shadow-sm"
                              style={{ 
                                left: `${((timeline.actualDepartureTime.getTime() - timeline.startTime.getTime()) / 
                                  (timeline.endTime.getTime() - timeline.startTime.getTime())) * 100}%` 
                              }}
                            />
                          </>
                        )}
                        {/* Current Time Indicator */}
                        {(() => {
                          const currentTimeOffset = currentTime.getTime() - timeline.startTime.getTime()
                          const totalDuration = timeline.endTime.getTime() - timeline.startTime.getTime()
                          const currentTimePercent = (currentTimeOffset / totalDuration) * 100
                          
                          // Debug logging
                          console.log('Dialog Timeline Debug:', {
                            currentTime: currentTime.toISOString(),
                            startTime: timeline.startTime.toISOString(),
                            endTime: timeline.endTime.toISOString(),
                            currentTimePercent,
                            flight: selectedFlight?.flightName
                          })
                          
                          // Show indicator if current time is within a reasonable range (extend beyond exact bounds)
                          if (currentTimePercent >= -10 && currentTimePercent <= 110) {
                            return (
                              <div 
                                className="absolute top-0 bottom-0 w-1 bg-red-500 z-30 shadow-lg"
                                style={{ left: `${Math.max(0, Math.min(100, currentTimePercent))}%` }}
                                title={`Current Time: ${currentTime.toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: false,
                                  timeZone: 'Europe/Amsterdam'
                                })} AMS (${currentTimePercent.toFixed(1)}%)`}
                              />
                            )
                          }
                          return null
                        })()}
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Gate Opens</span>
                        <span>Departure</span>
                        <span>Gate Closes</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Additional Notes */}
                {selectedFlight.flightStates && selectedFlight.flightStates.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-sm text-gray-600 mb-2">Flight States</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedFlight.flightStates.map((state: string, index: number) => (
                        <span 
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                        >
                          {state}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>
    </Fragment>
  )
} 