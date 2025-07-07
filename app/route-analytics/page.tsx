import { DestinationMap } from "@/components/destination-map"
import { RouteDelayTable } from "@/components/route-delay-table"
import { RouteVolumeChart } from "@/components/route-volume-chart"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Route, BarChart3, Clock } from "lucide-react"

export default function RouteAnalyticsPage() {
  return (
    <div className="flex">
      <Sidebar />
      <div className="lg:ml-64 flex-1 bg-gray-50 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
          <div className="mb-6 lg:mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Route className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Route Analytics – KLM</h1>
            </div>
            <p className="text-gray-600 text-sm sm:text-base">
              Route Performance Analysis • Destination Insights • Delay Patterns
            </p>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Destination Map Section */}
            <Card className="cursor-default">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 cursor-default">
                  <Route className="h-5 w-5" />
                  Destination Overview
                </CardTitle>
                <CardDescription className="cursor-default">
                  Active destinations and flight distribution
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DestinationMap />
              </CardContent>
            </Card>

            {/* Route Volume Chart Section */}
            <Card className="cursor-default">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 cursor-default">
                  <BarChart3 className="h-5 w-5" />
                  Route Volume Analysis
                </CardTitle>
                <CardDescription className="cursor-default">
                  Departure volumes by route
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RouteVolumeChart />
              </CardContent>
            </Card>

            {/* Route Delay Table Section - Full Width */}
            <Card className="lg:col-span-2 cursor-default">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 cursor-default">
                  <Clock className="h-5 w-5" />
                  Route Delay Performance
                </CardTitle>
                <CardDescription className="cursor-default">
                  On-time performance and delay statistics by destination
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RouteDelayTable />
              </CardContent>
            </Card>
          </div>


        </div>
      </div>
    </div>
  )
} 