import Link from "next/link"
import { Plane, BarChart3, Building2, Clock } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-600 text-white p-4 rounded-full">
              <Plane className="h-12 w-12" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
            KLM Operations Dashboard
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Real-time insights into flight operations, delays, and performance metrics at Schiphol Airport
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors duration-200 cursor-pointer"
          >
            <BarChart3 className="h-5 w-5" />
            Open Dashboard
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Real-Time Monitoring</h3>
            </div>
            <p className="text-gray-600">
              Live tracking of flight delays, gate utilization, and operational performance metrics
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-green-100 p-2 rounded-lg">
                <Plane className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Aircraft Performance</h3>
            </div>
            <p className="text-gray-600">
              Detailed analysis of fleet performance, delay patterns, and optimization opportunities
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Building2 className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Gate Analytics</h3>
            </div>
            <p className="text-gray-600">
              Comprehensive view of terminal operations, gate utilization, and capacity planning
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
