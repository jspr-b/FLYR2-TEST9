'use client'

import { useState } from 'react'
import { Info } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function Legend() {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div 
      className="border-t p-4 bg-gray-50 transition-all duration-200 hover:bg-gray-100"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <h4 
        className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2 cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        Flight Status Legend
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className={`w-4 h-4 transition-colors ${isHovered ? 'text-gray-600' : 'text-gray-400'} cursor-help`} />
            </TooltipTrigger>
            <TooltipContent>
              <p>Click the title to expand/collapse the legend</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <span className="ml-auto text-xs text-gray-500">
          {isExpanded ? '−' : '+'}
        </span>
      </h4>
      {isExpanded && (
        <div className="space-y-3 animate-in fade-in-0 slide-in-from-top-1 duration-200">
        {/* Flight States */}
        <div>
          <h5 className="text-xs font-medium text-gray-700 mb-2">Flight States</h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="flex items-center gap-2 p-1 rounded hover:bg-gray-200 transition-colors cursor-pointer">
              <div className="w-3 h-3 bg-green-500 border border-green-700 rounded"></div>
              <span>Boarding (BRD)</span>
            </div>
            <div className="flex items-center gap-2 p-1 rounded hover:bg-gray-200 transition-colors cursor-pointer">
              <div className="w-3 h-3 bg-blue-500 border border-blue-700 rounded"></div>
              <span>Gate Open (GTO)</span>
            </div>
            <div className="flex items-center gap-2 p-1 rounded hover:bg-gray-200 transition-colors cursor-pointer">
              <div className="w-3 h-3 bg-yellow-500 border border-yellow-700 rounded"></div>
              <span>Gate Closing (GCL)</span>
            </div>
            <div className="flex items-center gap-2 p-1 rounded hover:bg-gray-200 transition-colors cursor-pointer">
              <div className="w-3 h-3 bg-orange-500 border border-orange-700 rounded"></div>
              <span>Gate Closed (GTD)</span>
            </div>
            <div className="flex items-center gap-2 p-1 rounded hover:bg-gray-200 transition-colors cursor-pointer">
              <div className="w-3 h-3 bg-purple-500 border border-purple-700 rounded"></div>
              <span>Scheduled (SCH)</span>
            </div>
            <div className="flex items-center gap-2 p-1 rounded hover:bg-gray-200 transition-colors cursor-pointer">
              <div className="w-3 h-3 bg-red-400 border border-red-600 rounded"></div>
              <span>Delayed (DEL)</span>
            </div>
            <div className="flex items-center gap-2 p-1 rounded hover:bg-gray-200 transition-colors cursor-pointer">
              <div className="w-3 h-3 bg-gray-500 border border-gray-700 rounded"></div>
              <span>Departed (DEP)</span>
            </div>
            <div className="flex items-center gap-2 p-1 rounded hover:bg-gray-200 transition-colors cursor-pointer">
              <div className="w-3 h-3 bg-[#222E50] border border-[#1a2340] rounded"></div>
              <span>Gate Change (GCH)</span>
            </div>
            <div className="flex items-center gap-2 p-1 rounded hover:bg-gray-200 transition-colors cursor-pointer">
              <div className="w-3 h-3 bg-[#BD2F0F] border border-[#8B2209] rounded"></div>
              <span>Cancelled (CNX)</span>
            </div>
          </div>
        </div>
        
        {/* Timeline Indicators */}
        <div>
          <h5 className="text-xs font-medium text-gray-700 mb-2">Timeline Indicators</h5>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            <div className="flex items-center gap-2 p-1 rounded hover:bg-gray-200 transition-colors cursor-pointer">
              <div className="w-6 h-0.5 bg-red-500"></div>
              <span>Current Time</span>
            </div>
            <div className="flex items-center gap-2 p-1 rounded hover:bg-gray-200 transition-colors cursor-pointer">
              <div className="w-6 h-0.5 bg-gray-400"></div>
              <span>Departure Time</span>
            </div>
            <div className="flex items-center gap-2 p-1 rounded hover:bg-gray-200 transition-colors cursor-pointer">
              <div className="w-6 h-0.5 border-t-2 border-dashed border-gray-400"></div>
              <span>Original Time (if delayed)</span>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  )
}