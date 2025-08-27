"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Plane, Globe, Star } from "lucide-react"

interface DestinationData {
  code: string
  name: string
  country: string
  flights: number
  status: string
}

interface DestinationSummary {
  activeDestinations: number
  totalFlights: number
  topCountry: string
  avgFlightsPerDestination: number
  busiestRoute: string
}

interface ApiResponse {
  summary: DestinationSummary
  destinations: DestinationData[]
}

export function DestinationMap() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDestinationData = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/route-analytics/destinations')
        if (!response.ok) {
          throw new Error('Failed to fetch destination data')
        }
        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchDestinationData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Card className="cursor-default">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold cursor-default">...</p>
                  <p className="text-xs text-muted-foreground cursor-default">Active European Destinations</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-default">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Plane className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-2xl font-bold cursor-default">...</p>
                  <p className="text-xs text-muted-foreground cursor-default">Total European Flights</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card className="cursor-default">
            <CardContent className="p-3 flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-lg font-semibold cursor-default">...</p>
                <p className="text-xs text-muted-foreground cursor-default">Top Country</p>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-default">
            <CardContent className="p-3 flex items-center gap-2">
              <Plane className="h-4 w-4 text-blue-400" />
              <div>
                <p className="text-lg font-semibold cursor-default">...</p>
                <p className="text-xs text-muted-foreground cursor-default">Avg Euro Destination</p>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-default">
            <CardContent className="p-3 flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-lg font-semibold cursor-default">...</p>
                <p className="text-xs text-muted-foreground cursor-default">Busiest Route</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-lg border bg-card animate-pulse"
            >
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <div>
                  <p className="font-medium text-sm cursor-default">...</p>
                  <p className="text-xs text-muted-foreground cursor-default">...</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-sm cursor-default">...</p>
                <p className="text-xs text-muted-foreground cursor-default">flights</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="text-center p-4">
          <p className="text-red-600">Error loading destination data: {error}</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <div className="text-center p-4">
          <p className="text-gray-600">No destination data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-1.5 xs:gap-2 sm:gap-3 md:gap-4">
        <Card className="cursor-default">
          <CardContent className="p-2 xs:p-3 sm:p-4">
            <div className="flex flex-col min-[400px]:flex-row min-[400px]:items-center min-[400px]:space-x-2">
              <MapPin className="h-3 w-3 xs:h-4 xs:w-4 text-blue-600 flex-shrink-0 mb-0.5 min-[400px]:mb-0" />
              <div className="flex flex-col min-w-0 items-start justify-center">
                <p className="text-base xs:text-lg sm:text-xl md:text-2xl font-bold cursor-default">{data.summary.activeDestinations}</p>
                <p className="text-[10px] xs:text-xs text-muted-foreground cursor-default">
                  <span className="min-[400px]:hidden">Active</span>
                  <span className="hidden min-[400px]:inline">Active EU Destinations</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-default">
          <CardContent className="p-2 xs:p-3 sm:p-4">
            <div className="flex flex-col min-[400px]:flex-row min-[400px]:items-center min-[400px]:space-x-2">
              <Plane className="h-3 w-3 xs:h-4 xs:w-4 text-green-600 flex-shrink-0 mb-0.5 min-[400px]:mb-0" />
              <div className="flex flex-col min-w-0 items-start justify-center">
                <p className="text-base xs:text-lg sm:text-xl md:text-2xl font-bold cursor-default">{data.summary.totalFlights}</p>
                <p className="text-[10px] xs:text-xs text-muted-foreground cursor-default">
                  <span className="min-[400px]:hidden">Flights</span>
                  <span className="hidden min-[400px]:inline">Total EU Flights</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
        <Card className="cursor-default">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-base sm:text-lg md:text-xl font-semibold cursor-default">{data.summary.topCountry}</p>
                <p className="text-xs md:text-sm text-muted-foreground cursor-default">Top Country</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-default">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2">
              <Plane className="h-4 w-4 text-blue-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-base sm:text-lg md:text-xl font-semibold cursor-default">{data.summary.avgFlightsPerDestination}</p>
                <p className="text-xs md:text-sm text-muted-foreground cursor-default">Avg per Route</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-default sm:col-span-2 md:col-span-1">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-base sm:text-lg md:text-xl font-semibold cursor-default truncate">{data.summary.busiestRoute}</p>
                <p className="text-xs md:text-sm text-muted-foreground cursor-default">Busiest Route</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Destination List - Top 5 only */}
      <div className="space-y-2">
        {data.destinations.map((destination) => (
          <div
            key={destination.code}
            className="flex items-center justify-between p-2 sm:p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-default"
          >
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
              <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
              <div className="min-w-0">
                <p className="font-medium text-sm cursor-default">{destination.code}</p>
                <p className="text-xs text-muted-foreground cursor-default truncate">
                  {destination.name}, {destination.country}
                </p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-semibold text-sm cursor-default">{destination.flights}</p>
              <p className="text-xs text-muted-foreground cursor-default">flights</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 