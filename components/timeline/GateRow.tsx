import React from 'react'
import { FlightBar } from './FlightBar'

interface GateRowProps {
  gate: any
  timeSlots: Date[]
  getFlightTimeline: (flight: any) => any
  getFlightBarStyle: (flight: any) => React.CSSProperties
  getStatusColor: (flight: any) => string
  getCurrentTimePosition: () => number
  onFlightHover: (flight: any, event: React.MouseEvent) => void
  onFlightLeave: () => void
  setHoveredPosition: (pos: { x: number; y: number }) => void
}

export function GateRow({ 
  gate, 
  timeSlots, 
  getFlightTimeline, 
  getFlightBarStyle, 
  getStatusColor, 
  getCurrentTimePosition,
  onFlightHover, 
  onFlightLeave, 
  setHoveredPosition 
}: GateRowProps) {
  return (
    <div className="relative">
      {/* Gate Label */}
      <div className="flex items-center mb-2">
        <div className="w-16 text-sm font-medium text-gray-900">
          {gate.gateID === 'NO_GATE' ? 'No Gate' : gate.gateID}
        </div>
        <div className="text-xs text-gray-500">
          {gate.gateID === 'NO_GATE' 
            ? `Unassigned • ${gate.flights.length} flight${gate.flights.length !== 1 ? 's' : ''}`
            : `Pier ${gate.pier} • ${gate.flights.length} flight${gate.flights.length !== 1 ? 's' : ''}`
          }
        </div>
      </div>
      
      {/* Timeline Bar - Dynamic Height Based on Stacks */}
      <div 
        className={`relative rounded border ${gate.gateID === 'NO_GATE' ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50'}`}
        style={{ height: `${Math.max(48, ((gate as any).maxConcurrentFlights || 1) * 36 + 12)}px` }}
      >
        {/* Grid lines */}
        <div className="absolute inset-0 flex">
          {timeSlots.map((_, index) => (
            <div key={index} className="flex-1 border-l border-gray-200" />
          ))}
        </div>
        
        {/* Flight Stacks */}
        {((gate as any).flightStacks || []).map((stack: any[], stackIndex: number) => (
          <React.Fragment key={stackIndex}>
            {stack.map((flight, flightIndex) => {
              const timeline = getFlightTimeline(flight)
              
              // Calculate vertical position based on stack index
              const barHeight = 32
              const barTop = 6 + (stackIndex * 36)
              
              return (
                <FlightBar
                  key={`${stackIndex}-${flightIndex}`}
                  flight={flight}
                  style={{
                    ...getFlightBarStyle(flight),
                    top: `${barTop}px`,
                    height: `${barHeight}px`
                  }}
                  timeline={timeline}
                  onMouseEnter={onFlightHover}
                  onMouseLeave={onFlightLeave}
                  onMouseMove={(e) => setHoveredPosition({ x: e.clientX, y: e.clientY })}
                  getStatusColor={getStatusColor}
                />
              )
            })}
          </React.Fragment>
        ))}
        
        {/* Current Time Indicator */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
          style={{ left: `${getCurrentTimePosition()}%` }}
        >
          <div className="absolute -top-2 -left-1 w-2 h-2 bg-red-500 rounded-full" />
        </div>
      </div>
    </div>
  )
}