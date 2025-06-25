import { AlertTriangle, Clock, Plane, TrendingUp } from "lucide-react"

export function DelayTrendsSummary() {
  const summaryStats = [
    {
      label: "Total Flights",
      value: "127",
      change: "+8 vs yesterday",
      icon: Plane,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Avg Delay",
      value: "14.2 min",
      change: "+2.1 min vs yesterday",
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      label: "Peak Delay Hour",
      value: "08:00-09:00",
      change: "22.4 min avg",
      icon: TrendingUp,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      label: "High Variance Hours",
      value: "3 hours",
      change: "Flagged for review",
      icon: AlertTriangle,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {summaryStats.map((stat, index) => (
        <div key={index} className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 cursor-default">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.change}</p>
            </div>
            <div className={`${stat.bgColor} ${stat.color} p-3 rounded-lg`}>
              <stat.icon className="h-6 w-6" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
