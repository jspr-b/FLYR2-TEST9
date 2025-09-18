"use client"

import { DashboardKPIs } from "@/components/dashboard-kpis"
import { Sidebar } from "@/components/sidebar"
import { LayoutDashboard } from "lucide-react"
import { PageLoader } from "@/components/ui/page-loader"
import { useClientData } from "@/lib/client-utils"
import { useState, useEffect } from "react"

export default function Dashboard() {
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
      <div className="lg:ml-64 flex-1 bg-gray-50 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
          <div className="mb-6 lg:mb-8">
            <div className="flex items-center gap-3 mb-2">
              <LayoutDashboard className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Operations Dashboard – KLM</h1>
            </div>
            <p className="text-gray-600 text-sm sm:text-base">
              Live Operations Snapshot • Schiphol Airport • Real-Time KPIs
            </p>
          </div>

          {isLoading ? (
            <PageLoader message="Loading dashboard..." submessage="Fetching live operations data" />
          ) : (
            <div className="grid gap-6">
              <DashboardKPIs />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
