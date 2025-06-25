"use client"

import Link from "next/link"
import { Plane, Clock, AlertTriangle, TrendingUp, TrendingDown, Building2, Activity, AlertCircle } from "lucide-react"

export function DashboardKPIs() {
  const kpiData = [
    {
      label: "Fleet Avg Delay",
      value: "11.2 min",
      change: "+2.1 min vs yesterday",
      changeType: "negative" as const,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      href: "/delay-trends-by-hour",
      status: "warning",
    },
    {
      label: "Best Performing Aircraft",
      value: "A321neo",
      change: "3.2 min avg delay",
      changeType: "positive" as const,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
      href: "/aircraft-type-delay-performance",
      status: "good",
    },
    {
      label: "Worst Performing Aircraft",
      value: "A330-200",
      change: "19.8 min avg delay",
      changeType: "negative" as const,
      icon: TrendingDown,
      color: "text-red-600",
      bgColor: "bg-red-50",
      href: "/aircraft-type-delay-performance",
      status: "critical",
    },
    {
      label: "Total Flights Today",
      value: "127",
      change: "+8 vs yesterday",
      changeType: "positive" as const,
      icon: Plane,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      href: "/delay-trends-by-hour",
      status: "good",
    },
    {
      label: "Peak Delay Hour",
      value: "08:00-09:00",
      change: "22.4 min avg",
      changeType: "neutral" as const,
      icon: Activity,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      href: "/delay-trends-by-hour",
      status: "warning",
    },
    {
      label: "Active Piers",
      value: "7",
      change: "B, C, D, E, F, G, H&M",
      changeType: "neutral" as const,
      icon: Building2,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      href: "/busiest-gates-and-terminals",
      status: "good",
    },
    {
      label: "High Variance Hours",
      value: "3 hours",
      change: "Flagged for review",
      changeType: "negative" as const,
      icon: AlertTriangle,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      href: "/delay-trends-by-hour",
      status: "warning",
    },
    {
      label: "Critical Alerts",
      value: "2 active",
      change: "Gate F07 + Pier E delays",
      changeType: "negative" as const,
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      href: "/busiest-gates-and-terminals",
      status: "critical",
    },
  ]

  const getChangeIcon = (changeType: "positive" | "negative" | "neutral") => {
    switch (changeType) {
      case "positive":
        return <TrendingUp className="h-3 w-3 text-green-600" />
      case "negative":
        return <TrendingDown className="h-3 w-3 text-red-600" />
      default:
        return null
    }
  }

  const getChangeColor = (changeType: "positive" | "negative" | "neutral") => {
    switch (changeType) {
      case "positive":
        return "text-green-600"
      case "negative":
        return "text-red-600"
      default:
        return "text-gray-500"
    }
  }

  const getStatusIndicator = (status: "good" | "warning" | "critical") => {
    switch (status) {
      case "good":
        return <div className="w-2 h-2 bg-green-500 rounded-full"></div>
      case "warning":
        return <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
      case "critical":
        return <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Real-Time KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {kpiData.map((kpi, index) => (
          <Link
            key={index}
            href={kpi.href}
            className="group bg-white rounded-lg border border-gray-200 p-4 sm:p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-gray-300 hover:-translate-y-1"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {getStatusIndicator(kpi.status)}
                <p className="text-sm font-medium text-gray-600">{kpi.label}</p>
              </div>
              <div
                className={`${kpi.bgColor} ${kpi.color} p-2 rounded-lg group-hover:scale-110 transition-transform duration-200`}
              >
                <kpi.icon className="h-4 w-4" />
              </div>
            </div>

            <div className="mb-2">
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                {kpi.value}
              </p>
            </div>

            <div className="flex items-center gap-1">
              {getChangeIcon(kpi.changeType)}
              <p className={`text-xs sm:text-sm ${getChangeColor(kpi.changeType)}`}>{kpi.change}</p>
            </div>

            {/* Hover indicator */}
            <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="flex items-center gap-1 text-xs text-blue-600">
                <span>View details</span>
                <TrendingUp className="h-3 w-3" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Mini Visuals - Middle Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Hourly Delay Trend Preview */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top Delay Hours</h3>
            <Link
              href="/delay-trends-by-hour"
              className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer font-medium"
            >
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {[
              { hour: "08:00-09:00", delay: 22.4, flights: 14, status: "critical" },
              { hour: "15:00-16:00", delay: 19.2, flights: 13, status: "warning" },
              { hour: "09:00-10:00", delay: 18.7, flights: 12, status: "warning" },
              { hour: "16:00-17:00", delay: 16.4, flights: 12, status: "warning" },
              { hour: "14:00-15:00", delay: 15.8, flights: 11, status: "warning" },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${item.status === "critical" ? "bg-red-500" : "bg-yellow-500"}`}
                  ></div>
                  <span className="text-sm font-medium text-gray-900">{item.hour}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{item.flights} flights</span>
                  <span
                    className={`text-sm font-bold ${
                      item.delay > 20 ? "text-red-600" : item.delay > 15 ? "text-orange-600" : "text-yellow-600"
                    }`}
                  >
                    {item.delay.toFixed(1)}m
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Aircraft Performance Summary */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Aircraft Performance</h3>
            <Link
              href="/aircraft-type-delay-performance"
              className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer font-medium"
            >
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {[
              { type: "A321neo", delay: 3.2, flights: 8, status: "good", category: "Best" },
              { type: "B737-800", delay: 8.4, flights: 31, status: "fair", category: "Average" },
              { type: "A330-200", delay: 19.8, flights: 6, status: "poor", category: "Worst" },
            ].map((aircraft, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      aircraft.status === "good"
                        ? "bg-green-500"
                        : aircraft.status === "fair"
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }`}
                  ></div>
                  <div>
                    <span className="text-sm font-medium text-gray-900">{aircraft.type}</span>
                    <span className="text-xs text-gray-500 ml-2">({aircraft.category})</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{aircraft.flights} flights</span>
                  <span
                    className={`text-sm font-bold ${
                      aircraft.delay > 15 ? "text-red-600" : aircraft.delay > 8 ? "text-orange-600" : "text-green-600"
                    }`}
                  >
                    {aircraft.delay.toFixed(1)}m
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gate Load Snapshot */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Busiest Gates Today</h3>
            <Link
              href="/busiest-gates-and-terminals"
              className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer font-medium"
            >
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {[
              { gate: "F07", pier: "Pier F", flights: 4, utilization: 92, status: "critical" },
              { gate: "D12", pier: "Pier D", flights: 6, utilization: 83, status: "high" },
              { gate: "E18", pier: "Pier E", flights: 3, utilization: 78, status: "high" },
              { gate: "G03", pier: "Pier G", flights: 3, utilization: 75, status: "medium" },
              { gate: "C05", pier: "Pier C", flights: 5, utilization: 67, status: "medium" },
            ].map((gate, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      gate.status === "critical"
                        ? "bg-red-500 animate-pulse"
                        : gate.status === "high"
                          ? "bg-orange-500"
                          : "bg-yellow-500"
                    }`}
                  ></div>
                  <div>
                    <span className="text-sm font-medium text-gray-900">{gate.gate}</span>
                    <span className="text-xs text-gray-500 ml-2">({gate.pier})</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{gate.flights} flights</span>
                  <span
                    className={`text-sm font-bold ${
                      gate.utilization > 90
                        ? "text-red-600"
                        : gate.utilization > 75
                          ? "text-orange-600"
                          : "text-yellow-600"
                    }`}
                  >
                    {gate.utilization}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row - Navigation/Quick Access Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <Link
          href="/aircraft-type-delay-performance"
          className="group bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:from-blue-100 hover:to-blue-200 hover:-translate-y-1"
        >
          <div className="flex items-center gap-4 mb-3">
            <div className="bg-blue-600 text-white p-3 rounded-lg group-hover:scale-110 transition-transform duration-200">
              <Plane className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-700 transition-colors duration-200">
                Explore Full Aircraft Delay Breakdown
              </h3>
              <p className="text-sm text-gray-600">Detailed fleet performance analysis</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-600 font-medium">10 aircraft types • Performance metrics</span>
            <TrendingUp className="h-4 w-4 text-blue-600 group-hover:translate-x-1 transition-transform duration-200" />
          </div>
        </Link>

        <Link
          href="/busiest-gates-and-terminals"
          className="group bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200 p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:from-green-100 hover:to-green-200 hover:-translate-y-1"
        >
          <div className="flex items-center gap-4 mb-3">
            <div className="bg-green-600 text-white p-3 rounded-lg group-hover:scale-110 transition-transform duration-200">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-700 transition-colors duration-200">
                View Detailed Gate Activity
              </h3>
              <p className="text-sm text-gray-600">Real-time pier & gate utilization</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-green-600 font-medium">7 active piers • 47 gates monitored</span>
            <TrendingUp className="h-4 w-4 text-green-600 group-hover:translate-x-1 transition-transform duration-200" />
          </div>
        </Link>

        <Link
          href="/delay-trends-by-hour"
          className="group bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200 p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:from-purple-100 hover:to-purple-200 hover:-translate-y-1"
        >
          <div className="flex items-center gap-4 mb-3">
            <div className="bg-purple-600 text-white p-3 rounded-lg group-hover:scale-110 transition-transform duration-200">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-700 transition-colors duration-200">
                Open Hourly Delay Trends
              </h3>
              <p className="text-sm text-gray-600">Time-based delay pattern analysis</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-purple-600 font-medium">24-hour breakdown • Variance tracking</span>
            <TrendingUp className="h-4 w-4 text-purple-600 group-hover:translate-x-1 transition-transform duration-200" />
          </div>
        </Link>
      </div>
    </div>
  )
}
