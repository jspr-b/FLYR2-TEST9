"use client"

import { Sidebar } from "@/components/sidebar"
import { GatesTerminalsSummary } from "@/components/gates-terminals-summary"
import { TerminalsChart } from "@/components/terminals-chart"
import { GatesTable } from "@/components/gates-table"
import { Building2 } from "lucide-react"
import { PageLoader } from "@/components/ui/page-loader"
import { useState, useEffect } from "react"

export default function BusiestGatesAndTerminals() {
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
              <Building2 className="h-4 xs:h-5 sm:h-6 w-4 xs:w-5 sm:w-6 text-blue-600 flex-shrink-0" />
              <h1 className="text-base xs:text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                <span className="sm:hidden">Gates & Terminals</span>
                <span className="hidden sm:inline">Busiest Piers & Gates – KLM</span>
              </h1>
            </div>
            <p className="text-gray-600 text-[10px] xs:text-xs sm:text-sm lg:text-base">
              <span className="2xs:hidden">Today • Schiphol</span>
              <span className="hidden 2xs:inline">Current Day Analysis • Schiphol Airport • Schengen/Non-Schengen Operations</span>
            </p>
          </div>

          {isLoading ? (
            <PageLoader message="Loading gates and terminals..." submessage="Analyzing pier and gate activity" />
          ) : (
            <>
          <GatesTerminalsSummary />

          <div className="grid grid-cols-1 2xl:grid-cols-2 gap-3 xs:gap-4 sm:gap-5 lg:gap-6 mb-3 sm:mb-6">
            <div>
              <TerminalsChart />
            </div>
            <div>
              <GatesTable />
            </div>
          </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
