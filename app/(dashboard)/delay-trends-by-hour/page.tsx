import { Sidebar } from "@/components/sidebar"
import { DelayTrendsChart } from "@/components/delay-trends-chart"
import { DelayTrendsTable } from "@/components/delay-trends-table"
import { DelayTrendsSummary } from "@/components/delay-trends-summary"
import { BarChart3 } from "lucide-react"

export default function DelayTrendsByHour() {
  return (
    <div className="flex">
      <Sidebar />
      <div className="lg:ml-64 flex-1 bg-gray-50 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-6 pt-16 lg:pt-8">
          <div className="mb-6 lg:mb-8">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Delay Trends by Hour – KLM</h1>
            </div>
            <p className="text-gray-600 text-sm sm:text-base">Current Day Analysis • Schiphol Airport</p>
          </div>

          <DelayTrendsSummary />

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
            <div className="xl:col-span-2">
              <DelayTrendsChart />
            </div>
            <div className="xl:col-span-1">
              <DelayTrendsTable />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
