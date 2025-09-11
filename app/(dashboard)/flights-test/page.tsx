'use client'

import { useState, useEffect } from 'react'
import { fetchFlights } from '@/lib/api'
import { FlightResponse } from '@/types/flight'
import { formatLocalTime } from '@/lib/timezone-utils'

export default function FlightsTestPage() {
  const [flightsData, setFlightsData] = useState<FlightResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    flightDirection: 'D',
    scheduleDate: new Date().toISOString().split('T')[0], // Today's date
    isOperationalFlight: true,
    prefixicao: 'KL'
  })

  const loadFlights = async (currentFilters?: any) => {
    try {
      setLoading(true)
      const data = await fetchFlights(currentFilters || filters)
      setFlightsData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch flights')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFlights()
  }, [])

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
  }

  const applyFilters = () => {
    loadFlights(filters)
  }

  const clearFilters = () => {
    const clearedFilters = {
      flightDirection: '',
      scheduleDate: new Date().toISOString().split('T')[0], // Keep today's date
      isOperationalFlight: false,
      prefixicao: ''
    }
    setFilters(clearedFilters)
    loadFlights({})
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading flights data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Error</div>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Flights API Test</h1>
        
        {/* Filter Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Flight Direction
              </label>
              <select
                value={filters.flightDirection}
                onChange={(e) => handleFilterChange('flightDirection', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                <option value="D">Departure</option>
                <option value="A">Arrival</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Schedule Date
              </label>
              <input
                type="date"
                value={filters.scheduleDate}
                onChange={(e) => handleFilterChange('scheduleDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Airline Prefix
              </label>
              <input
                type="text"
                value={filters.prefixicao}
                onChange={(e) => handleFilterChange('prefixicao', e.target.value)}
                placeholder="e.g., KL"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Operational Flight
              </label>
              <select
                value={filters.isOperationalFlight.toString()}
                onChange={(e) => handleFilterChange('isOperationalFlight', e.target.value === 'true')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={applyFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              Apply Filters
            </button>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        </div>
        
        {flightsData && (
          <div className="space-y-6">
            {/* Metadata */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Metadata</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-gray-600">Total Count:</span>
                  <span className="ml-2 font-medium">{flightsData.metadata.totalCount}</span>
                </div>
                <div>
                  <span className="text-gray-600">Last Updated:</span>
                  <span className="ml-2 font-medium">{new Date(flightsData.metadata.lastUpdated).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-600">Date:</span>
                  <span className="ml-2 font-medium">{flightsData.metadata.date}</span>
                </div>
              </div>
            </div>

            {/* Flights */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Flights ({flightsData.flights.length})</h2>
              <div className="space-y-4">
                {flightsData.flights.map((flight, index) => (
                  <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <span className="text-gray-600">Flight:</span>
                        <span className="ml-2 font-medium">{flight.flightName}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Number:</span>
                        <span className="ml-2 font-medium">{flight.flightNumber}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Direction:</span>
                        <span className="ml-2 font-medium">{flight.flightDirection}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Gate:</span>
                        <span className="ml-2 font-medium">{flight.gate}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Aircraft:</span>
                        <span className="ml-2 font-medium">{flight.aircraftType.iataMain}/{flight.aircraftType.iataSub}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Status:</span>
                        <span className="ml-2 font-medium">{flight.publicFlightState.flightStates.join(', ')}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Destinations:</span>
                        <span className="ml-2 font-medium">{flight.route.destinations.join(' → ')}</span>
                      </div>
                                           <div>
                       <span className="text-gray-600">Scheduled (Local):</span>
                       <span className="ml-2 font-medium">
                         {formatLocalTime(flight.scheduleDateTime)}
                       </span>
                     </div>
                     <div>
                       <span className="text-gray-600">Estimated (Local):</span>
                       <span className="ml-2 font-medium">
                         {formatLocalTime(flight.publicEstimatedOffBlockTime)}
                       </span>
                     </div>
                     <div>
                       <span className="text-gray-600">Last Updated (Local):</span>
                       <span className="ml-2 font-medium text-sm">
                         {formatLocalTime(flight.lastUpdatedAt)}
                       </span>
                     </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Raw JSON */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Raw JSON Response</h2>
              <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                {JSON.stringify(flightsData, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 