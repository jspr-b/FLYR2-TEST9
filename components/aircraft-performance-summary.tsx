import { Plane, Clock, AlertTriangle, TrendingUp } from "lucide-react"

export function AircraftPerformanceSummary() {
  const summaryStats = [
    {
      label: "Aircraft Types",
      value: "10",
      change: "A321neo, A330-200/300, B737-700/800/900, B777-200ER/300ER, B787-9/10",
      icon: Plane,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Best Performer",
      value: "A321neo",
      change: "3.2 min avg delay",
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      label: "Highest Delay",
      value: "A330-200",
      change: "19.8 min avg delay",
      icon: Clock,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      label: "Fleet Avg Delay",
      value: "12.4 min",
      change: "+2.1 min vs yesterday",
      icon: AlertTriangle,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
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
