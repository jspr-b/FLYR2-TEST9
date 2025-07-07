"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Database, Wifi, WifiOff } from "lucide-react"

// API endpoints that would be needed for route analytics
const apiEndpoints = [
  {
    name: "Destination Data",
    endpoint: "/api/route-analytics/destinations",
    description: "Active destinations and flight counts",
    status: "N/A",
    method: "GET"
  },
  {
    name: "Route Delay Statistics",
    endpoint: "/api/route-analytics/delays",
    description: "On-time performance by route",
    status: "N/A",
    method: "GET"
  },
  {
    name: "Route Volume Metrics",
    endpoint: "/api/route-analytics/volumes",
    description: "Departure volumes by route (arrivals not implemented)",
    status: "N/A",
    method: "GET"
  },
  {
    name: "Route Performance Summary",
    endpoint: "/api/route-analytics/summary",
    description: "Overall route performance metrics",
    status: "N/A",
    method: "GET"
  },
  {
    name: "Route Filtering",
    endpoint: "/api/route-analytics/filter",
    description: "Filter routes by date, airline, etc.",
    status: "N/A",
    method: "POST"
  },
  {
    name: "Route Comparison",
    endpoint: "/api/route-analytics/compare",
    description: "Compare multiple routes",
    status: "N/A",
    method: "POST"
  }
]

export function ApiIntegrationStatus() {
  return (
    <Card className="cursor-default">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 cursor-default">
          <Database className="h-5 w-5" />
          API Integration Status
        </CardTitle>
        <CardDescription className="cursor-default">
          Backend endpoints for route analytics functionality
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {apiEndpoints.map((endpoint) => (
            <div
              key={endpoint.name}
              className="flex items-center justify-between p-4 rounded-lg border bg-muted/50 cursor-default"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm cursor-default">{endpoint.name}</span>
                  <Badge variant="outline" className="text-xs cursor-default">
                    {endpoint.method}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground cursor-default mb-1">
                  {endpoint.endpoint}
                </p>
                <p className="text-xs text-muted-foreground cursor-default">
                  {endpoint.description}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <WifiOff className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground cursor-default">{endpoint.status}</span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <Wifi className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-sm text-blue-900 cursor-default">Integration Ready</h4>
              <p className="text-xs text-blue-700 mt-1 cursor-default">
                All components are prepared for API integration. Replace mock data with real endpoints when backend is ready.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 