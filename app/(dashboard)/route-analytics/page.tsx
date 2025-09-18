"use client"

import { DestinationMap } from "@/components/destination-map"
import { RouteDelayTable } from "@/components/route-delay-table"
import { RouteVolumeChart } from "@/components/route-volume-chart"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Route, BarChart3, Clock } from "lucide-react"
import { PageLoader } from "@/components/ui/page-loader"
import { useState, useEffect } from "react"

export default function RouteAnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="flex">
      <Sidebar />
      <div className="xl:ml-64 flex-1 bg-gray-50 min-h-screen">
        <div className="p-3 xs:p-4 sm:p-6 lg:p-8 pt-14 xs:pt-16 xl:pt-8">
          <div className="mb-3 xs:mb-4 sm:mb-6 lg:mb-8">
            <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-3 mb-1 sm:mb-2">
              <Route className="h-4 xs:h-5 sm:h-6 w-4 xs:w-5 sm:w-6 text-blue-600 flex-shrink-0" />
              <h1 className="text-base xs:text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                <span className="sm:hidden">Route Analytics</span>
                <span className="hidden sm:inline">Route Analytics – KLM</span>
              </h1>
            </div>
            <p className="text-gray-600 text-[10px] xs:text-xs sm:text-sm lg:text-base">
              <span className="2xs:hidden">Routes • Delays</span>
              <span className="hidden 2xs:inline">Route Performance • Destinations • Delays</span>
            </p>
          </div>

          {/* Main Content Grid */}
          {isLoading ? (
            <PageLoader message="Loading route analytics..." submessage="Fetching destination and route data" />
          ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 xs:gap-4 sm:gap-5 lg:gap-6">
            {/* Destination Map Section */}
            <Card className="cursor-default">
              <CardHeader className="p-3 xs:p-4 sm:p-5 lg:p-6">
                <CardTitle className="flex items-center gap-1.5 sm:gap-2 cursor-default text-sm xs:text-base sm:text-lg">
                  <Route className="h-3 xs:h-4 sm:h-5 w-3 xs:w-4 sm:w-5 flex-shrink-0" />
                  <span className="xs:hidden">Destinations</span>
                  <span className="hidden xs:inline">Destination Overview</span>
                </CardTitle>
                <CardDescription className="cursor-default text-[10px] xs:text-xs sm:text-sm">
                  <span className="xs:hidden">Active routes</span>
                  <span className="hidden xs:inline">Active destinations and flight distribution</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 xs:p-4 sm:p-5 lg:p-6 pt-0">
                <DestinationMap />
              </CardContent>
            </Card>

            {/* Route Volume Chart Section */}
            <Card className="cursor-default">
              <CardHeader className="p-3 xs:p-4 sm:p-5 lg:p-6">
                <CardTitle className="flex items-center gap-1.5 sm:gap-2 cursor-default text-sm xs:text-base sm:text-lg">
                  <BarChart3 className="h-3 xs:h-4 sm:h-5 w-3 xs:w-4 sm:w-5 flex-shrink-0" />
                  <span className="xs:hidden">Volume</span>
                  <span className="hidden xs:inline">Route Volume Analysis</span>
                </CardTitle>
                <CardDescription className="cursor-default text-[10px] xs:text-xs sm:text-sm">
                  <span className="xs:hidden">By route</span>
                  <span className="hidden xs:inline">Departure volumes by route</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 xs:p-4 sm:p-5 lg:p-6 pt-0">
                <RouteVolumeChart />
              </CardContent>
            </Card>

            {/* Route Delay Table Section - Full Width */}
            <Card className="xl:col-span-2 cursor-default">
              <CardHeader className="p-3 xs:p-4 sm:p-5 lg:p-6">
                <CardTitle className="flex items-center gap-1.5 sm:gap-2 cursor-default text-sm xs:text-base sm:text-lg">
                  <Clock className="h-3 xs:h-4 sm:h-5 w-3 xs:w-4 sm:w-5 flex-shrink-0" />
                  <span className="xs:hidden">Performance</span>
                  <span className="hidden xs:inline">Route Delay Performance</span>
                </CardTitle>
                <CardDescription className="cursor-default text-[10px] xs:text-xs sm:text-sm">
                  <span className="xs:hidden">On-time stats</span>
                  <span className="hidden xs:inline">On-time performance and delay statistics by destination</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 xs:p-4 sm:p-5 lg:p-6 pt-0">
                <RouteDelayTable />
              </CardContent>
            </Card>
          </div>
          )}

        </div>
      </div>
    </div>
  )
} 