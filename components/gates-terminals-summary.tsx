import { Building2, DoorOpen, Plane, TrendingUp } from "lucide-react"

export function GatesTerminalsSummary() {
  const summaryStats = [
    {
      label: "Active Piers",
      value: "7",
      change: "B, C, D, E, F, G, H&M",
      icon: Building2,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Schengen Gates",
      value: "28",
      change: "Piers B, C, D (Schengen), H&M",
      icon: DoorOpen,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      label: "Non-Schengen Gates",
      value: "19",
      change: "Piers D (Non-Schengen), E, F, G",
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      label: "Busiest Pier",
      value: "Pier F",
      change: "12 KLM long-haul flights",
      icon: Plane,
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
