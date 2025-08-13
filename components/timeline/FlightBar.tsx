import React from 'react'

interface FlightBarProps {
  flight: any
  style: React.CSSProperties
  timeline: any
  onMouseEnter: (flight: any, event: React.MouseEvent) => void
  onMouseLeave: () => void
  onMouseMove: (event: React.MouseEvent) => void
  getStatusColor: (flight: any) => string
}

export function FlightBar({ 
  flight, 
  style, 
  timeline, 
  onMouseEnter, 
  onMouseLeave, 
  onMouseMove, 
  getStatusColor 
}: FlightBarProps) {
  // Calculate positions for both scheduled and actual departure times
  const barDuration = timeline.endTime.getTime() - timeline.startTime.getTime()
  const scheduledDepartureOffset = timeline.scheduledTime.getTime() - timeline.startTime.getTime()
  const scheduledDeparturePercent = (scheduledDepartureOffset / barDuration) * 100
  const actualDepartureOffset = timeline.actualDepartureTime.getTime() - timeline.startTime.getTime()
  const actualDeparturePercent = (actualDepartureOffset / barDuration) * 100

  return (
    <div
      className={`absolute rounded border cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-md ${getStatusColor(flight)}`}
      style={style}
      onMouseEnter={(e) => onMouseEnter(flight, e)}
      onMouseLeave={onMouseLeave}
      onMouseMove={onMouseMove}
    >
      <div className="h-full flex items-center justify-center text-white text-sm font-medium px-3 truncate">
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
}