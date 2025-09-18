"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Plane, Clock, TrendingUp, LayoutDashboard, Menu, X, Route, Building2, Activity, BarChart3, FileText } from "lucide-react"
import { useState } from "react"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Route Analytics", href: "/route-analytics", icon: Route },
  { name: "Delay Trends by Hour", href: "/delay-trends-by-hour", icon: Clock },
  { name: "Busiest Gates & Terminals", href: "/busiest-gates-and-terminals", icon: Plane },
  { name: "Gate Activity Analysis", href: "/gate-activity", icon: Activity },
  { name: "Aircraft Type Performance", href: "/aircraft-type-delay-performance", icon: TrendingUp },
]

export function Sidebar() {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <>
      {/* Mobile slide button */}
      <div className="xl:hidden fixed bottom-6 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-blue-600 text-white p-4 rounded-full shadow-lg cursor-pointer hover:bg-blue-700 transition-all duration-200 hover:scale-105"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="xl:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={`
        w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 z-40 transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        xl:translate-x-0
      `}
      >
        <div className="p-6">
          <h1 className="text-xl font-bold text-gray-800">FLYR</h1>
          <p className="text-sm text-gray-500 mt-1">Aviation Intelligence System</p>
          <p className="text-xs text-gray-400 mt-2">Built by <a href="https://praevion.eu/" target="_blank" rel="noopener noreferrer" className="text-blue-600/100 dark:text-sky-400/100 hover:underline">Praevion</a></p>
        </div>

        <nav className="mt-8">
          <div className="px-3">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md mb-1 cursor-pointer transition-colors whitespace-nowrap ${
                    isActive
                      ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <item.icon className="mr-3 h-4 w-4 flex-shrink-0" />
                  {item.name}
                </Link>
              )
            })}
          </div>
        </nav>

        <div className="absolute bottom-16 left-0 right-0 px-3">
          <div className="border-t border-gray-200 pt-4">
            <Link
              href="/terms"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md mb-1 cursor-pointer transition-colors whitespace-nowrap"
            >
              <FileText className="mr-3 h-4 w-4 flex-shrink-0" />
              Terms & Conditions
            </Link>
          </div>
        </div>

        <div className="absolute bottom-4 left-4 text-xs text-gray-400">
          © 2025 FLYR
        </div>
      </div>
    </>
  )
}
