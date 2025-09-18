"use client"

import { Sidebar } from "@/components/sidebar"
import { FleetPerformanceSummary } from "@/components/fleet-performance-summary"
import { AircraftPerformanceChart } from "@/components/aircraft-performance-chart"
import { AircraftPerformanceTable } from "@/components/aircraft-performance-table"
import { TrendingUp } from "lucide-react"
import { PageLoader } from "@/components/ui/page-loader"
import { useState, useEffect } from "react"

export default function AircraftTypeDelayPerformance() {
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
        <div className="p-4 sm:p-6 lg:p-8 pt-16 xl:pt-8">
          <div className="mb-6 lg:mb-8">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Aircraft Type Delay Performance – KLM</h1>
            </div>
            <p className="text-gray-600 text-sm sm:text-base">
              Current Day Analysis • Schiphol Airport • Fleet Performance Overview
            </p>
          </div>

          {isLoading ? (
            <PageLoader message="Loading aircraft performance..." submessage="Analyzing fleet delay metrics" />
          ) : (
            <>
          <div className="mb-6">
            <FleetPerformanceSummary />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
            <div className="xl:col-span-2">
              <AircraftPerformanceChart />
            </div>
            <div className="xl:col-span-1">
              <AircraftPerformanceTable />
            </div>
          </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
