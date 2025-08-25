import { Info } from 'lucide-react'

export function Legend() {
  return (
    <div className="border-t p-4 bg-gray-50">
      <h4 className="text-sm font-medium text-gray-900 mb-3">Flight Status Legend</h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 border border-green-700 rounded"></div>
          <span>Boarding</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 border border-blue-700 rounded"></div>
          <span>Gate Open</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-500 border border-yellow-700 rounded"></div>
          <span>Gate Closing</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-orange-500 border border-orange-700 rounded"></div>
          <span>Gate Closed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-purple-500 border border-purple-700 rounded"></div>
          <span>Scheduled</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-400 border border-red-600 rounded"></div>
          <span>Delayed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-500 border border-gray-700 rounded"></div>
          <span>Departed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-0.5 h-3 bg-red-500"></div>
          <span>Current Time</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-0.5 h-3 bg-white border border-gray-400"></div>
          <span>Departure</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-0.5 h-3 bg-gray-400 border-l-2 border-dashed border-gray-500"></div>
          <span>Original Time</span>
        </div>
      </div>
    </div>
  )
}