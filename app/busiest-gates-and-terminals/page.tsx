import { Sidebar } from "@/components/sidebar"
import { GatesTerminalsSummary } from "@/components/gates-terminals-summary"
import { TerminalsChart } from "@/components/terminals-chart"
import { GatesTable } from "@/components/gates-table"
import { Building2 } from "lucide-react"

export default function BusiestGatesAndTerminals() {
  return (
    <div className="flex">
      <Sidebar />
      <div className="lg:ml-64 flex-1 bg-gray-50 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
          <div className="mb-6 lg:mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Busiest Piers & Gates – KLM</h1>
            </div>
            <p className="text-gray-600 text-sm sm:text-base">
              Current Day Analysis • Schiphol Airport • Schengen/Non-Schengen Operations
            </p>
          </div>

          <GatesTerminalsSummary />

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
            <div>
              <TerminalsChart />
            </div>
            <div>
              <GatesTable />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
