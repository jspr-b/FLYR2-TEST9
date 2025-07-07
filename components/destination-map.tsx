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
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="cursor-default">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <div className="flex flex-col min-w-0 items-start justify-center">
                <p className="text-2xl font-bold cursor-default truncate max-w-[8ch] sm:max-w-[12ch] md:max-w-[16ch]">{data.summary.activeDestinations}</p>
                <p className="text-xs text-muted-foreground cursor-default truncate max-w-[16ch] sm:max-w-[24ch] md:max-w-[32ch]">Active European Destinations</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-default">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Plane className="h-4 w-4 text-green-600 flex-shrink-0" />
              <div className="flex flex-col min-w-0 items-start justify-center">
                <p className="text-2xl font-bold cursor-default truncate max-w-[8ch] sm:max-w-[12ch] md:max-w-[16ch]">{data.summary.totalFlights}</p>
                <p className="text-xs text-muted-foreground cursor-default truncate max-w-[16ch] sm:max-w-[24ch] md:max-w-[32ch]">Total European Flights</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="cursor-default">
          <CardContent className="p-3 flex items-center gap-2">
            <Globe className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-lg font-semibold cursor-default">{data.summary.topCountry}</p>
              <p className="text-xs text-muted-foreground cursor-default">Top Country</p>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-default">
          <CardContent className="p-3 flex items-center gap-2">
            <Plane className="h-4 w-4 text-blue-400" />
            <div>
              <p className="text-lg font-semibold cursor-default">{data.summary.avgFlightsPerDestination}</p>
              <p className="text-xs text-muted-foreground cursor-default">Avg Euro Destination</p>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-default">
          <CardContent className="p-3 flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500" />
            <div>
              <p className="text-lg font-semibold cursor-default">{data.summary.busiestRoute}</p>
              <p className="text-xs text-muted-foreground cursor-default">Busiest Route</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Destination List - Top 5 only */}
      <div className="space-y-2">
        {data.destinations.map((destination) => (
          <div
            key={destination.code}
            className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-default"
          >
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div>
                <p className="font-medium text-sm cursor-default">{destination.code}</p>
                <p className="text-xs text-muted-foreground cursor-default">
                  {destination.name}, {destination.country}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-sm cursor-default">{destination.flights}</p>
              <p className="text-xs text-muted-foreground cursor-default">flights</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 