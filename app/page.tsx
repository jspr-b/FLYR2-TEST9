import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Plane,
  Clock,
  BarChart3,
  MapPin,
  Shield,
  Smartphone,
  Bell,
  TrendingUp,
  Users,
  Zap,
  CheckCircle,
  ArrowRight,
  Activity,
  Globe,
  Timer,
} from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[#00A1DE] rounded-lg flex items-center justify-center">
                <Plane className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">KLM Operations</span>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/dashboard" className="text-gray-600 hover:text-[#00A1DE] transition-colors">
                Dashboard
              </Link>
              <Link href="/gate-activity" className="text-gray-600 hover:text-[#00A1DE] transition-colors">
                Gate Activity
              </Link>
              <Link href="/analytics" className="text-gray-600 hover:text-[#00A1DE] transition-colors">
                Analytics
              </Link>
              <Button asChild className="bg-[#00A1DE] hover:bg-blue-600">
                <Link href="/dashboard">Access Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#00A1DE]/10 to-blue-600/10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <Badge className="mb-4 bg-[#E5F4FA] text-[#00A1DE] border-[#00A1DE]/20">
                <Activity className="w-4 h-4 mr-1" />
                Live Operations Center
              </Badge>
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 text-balance">
                Transform KLM Operations with <span className="text-[#00A1DE]">Real-Time Intelligence</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 text-pretty">
                Your command center for Schiphol operations. Monitor 300+ daily flights, optimize gate utilization, and
                make data-driven decisions in seconds, not minutes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button asChild size="lg" className="bg-[#00A1DE] hover:bg-blue-600 text-lg px-8">
                  <Link href="/dashboard">
                    Open Dashboard
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="mt-12 grid grid-cols-3 gap-6 text-center lg:text-left">
                <div>
                  <div className="text-2xl font-bold text-[#00A1DE]">99.9%</div>
                  <div className="text-sm text-gray-600">Uptime</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#00A1DE]">10s</div>
                  <div className="text-sm text-gray-600">Data Refresh</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#00A1DE]">200+</div>
                  <div className="text-sm text-gray-600">Airports</div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-6 border border-blue-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Live Operations</h3>
                  <Badge className="bg-green-100 text-green-800">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                    Live
                  </Badge>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Plane className="w-5 h-5 text-[#00A1DE]" />
                      <div>
                        <div className="font-medium">KL1001 → LHR</div>
                        <div className="text-sm text-gray-600">Gate D6 </div>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">On Time</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Plane className="w-5 h-5 text-[#00A1DE]" />
                      <div>
                        <div className="font-medium">KL1401 → CDG</div>
                        <div className="text-sm text-gray-600">Gate B7</div>
                      </div>
                    </div>
                    <Badge className="bg-orange-100 text-orange-800">Delayed 15m</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Plane className="w-5 h-5 text-[#00A1DE]" />
                      <div>
                        <div className="font-medium">KL1601 → FCO</div>
                        <div className="text-sm text-gray-600">Gate C15</div>
                      </div>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">Boarding</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 text-balance">
              Complete Operational Visibility
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto text-pretty">
              From gate to sky - monitor every aspect of your operations with real-time intelligence
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-blue-100 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-[#E5F4FA] rounded-lg flex items-center justify-center mb-4">
                  <Activity className="w-6 h-6 text-[#00A1DE]" />
                </div>
                <CardTitle>Real-Time Monitoring</CardTitle>
                <CardDescription>
                  Live tracking of all KLM departures with auto-refreshing data every 10 minutes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Flight states & delays
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Critical delay alerts (≥60min)
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Gate change monitoring
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-blue-100 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-[#E5F4FA] rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-[#00A1DE]" />
                </div>
                <CardTitle>Predictive Analytics</CardTitle>
                <CardDescription>Advanced analytics for delay patterns and performance trends</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Hourly delay trends
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Route performance analysis
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Fleet efficiency metrics
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-blue-100 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-[#E5F4FA] rounded-lg flex items-center justify-center mb-4">
                  <MapPin className="w-6 h-6 text-[#00A1DE]" />
                </div>
                <CardTitle>Gate Optimization</CardTitle>
                <CardDescription>Interactive Gantt timeline with real-time gate occupancy tracking</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Pier-level analytics (A-H)
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Pier-level analytics (b-g)
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Utilization statistics
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-blue-100 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-[#E5F4FA] rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-[#00A1DE]" />
                </div>
                <CardTitle>Fleet Performance</CardTitle>
                <CardDescription>Aircraft type performance comparison and route-based analytics</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Aircraft efficiency tracking
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    On-time performance
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    European coverage (200+ airports)
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-blue-100 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-[#E5F4FA] rounded-lg flex items-center justify-center mb-4">
                  <Smartphone className="w-6 h-6 text-[#00A1DE]" />
                </div>
                <CardTitle>Mobile Access</CardTitle>
                <CardDescription>Full functionality on any device with responsive design</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Touch-optimized interface
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    All window size capability
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Fast loading (&lt;3s)
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-blue-100 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-[#E5F4FA] rounded-lg flex items-center justify-center mb-4">
                  <Bell className="w-6 h-6 text-[#00A1DE]" />
                </div>
                <CardTitle>Smart Alerts</CardTitle>
                <CardDescription>Automated notifications for critical operational events</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Delay alerts
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Gatechange alerts
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Custom thresholds
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Value Proposition Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-r from-[#00A1DE]/5 to-blue-600/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 text-balance">
              Minimize Delays, Maximize Efficiency
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto text-pretty">
              Data-driven insights that transform your operational performance
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="text-center p-4 sm:p-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <TrendingUp className="w-7 h-7 sm:w-8 sm:h-8 text-green-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-2">25%</div>
              <div className="text-sm sm:text-base text-gray-600 leading-relaxed">Reduction in operational delays</div>
            </div>

            <div className="text-center p-4 sm:p-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <MapPin className="w-7 h-7 sm:w-8 sm:h-8 text-[#00A1DE]" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-[#00A1DE] mb-2">15%</div>
              <div className="text-sm sm:text-base text-gray-600 leading-relaxed">Improved gate utilization</div>
            </div>

            <div className="text-center p-4 sm:p-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Clock className="w-7 h-7 sm:w-8 sm:h-8 text-orange-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-orange-600 mb-2">90%</div>
              <div className="text-sm sm:text-base text-gray-600 leading-relaxed">On-time performance target</div>
            </div>

            <div className="text-center p-4 sm:p-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Users className="w-7 h-7 sm:w-8 sm:h-8 text-purple-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-purple-600 mb-2">100%</div>
              <div className="text-sm sm:text-base text-gray-600 leading-relaxed">Team visibility and coordination</div>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Showcase */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6 text-balance">
                Enterprise-Grade Technology
              </h2>
              <p className="text-xl text-gray-600 mb-8 text-pretty">
                Built for mission-critical operations with the reliability and performance you need
              </p>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-[#E5F4FA] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-[#00A1DE]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Auto-Refreshing Data</h3>
                    <p className="text-gray-600">
                      Real-time updates every 10 minutes with 5-minute caching for optimal performance
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-[#E5F4FA] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Globe className="w-5 h-5 text-[#00A1DE]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Schiphol Integration</h3>
                    <p className="text-gray-600">
                      Direct integration with Schiphol Airport APIs for accurate, up-to-date information
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-[#E5F4FA] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-[#00A1DE]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Secure Access</h3>
                    <p className="text-gray-600">
                      Enterprise-grade security with role-based access controls and audit trails
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-[#E5F4FA] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Timer className="w-5 h-5 text-[#00A1DE]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">High Performance</h3>
                    <p className="text-gray-600">
                      Optimized for fast loading with 99.9% uptime and sub-3-second page loads
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-2xl p-6 text-green-400 font-mono text-sm">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-400 ml-2">KLM Operations Terminal</span>
              </div>
              <div className="space-y-2">
                <div>$ klm-ops status</div>
                <div className="text-gray-400">✓ Schiphol API: Connected</div>
                <div className="text-gray-400">✓ Flight Data: Synced (10s ago)</div>
                <div className="text-gray-400">✓ Gate Status: Live</div>
                <div className="text-gray-400">✓ Alerts: Active (3 critical)</div>
                <div className="mt-4">$ klm-ops metrics</div>
                <div className="text-gray-400">Flights Tracked: 547</div>
                <div className="text-gray-400">Gates Monitored: 89</div>
                <div className="text-gray-400">On-Time Rate: 87.3%</div>
                <div className="text-gray-400">Avg Delay: 12.4 min</div>
                <div className="mt-4 animate-pulse">$ monitoring operations...</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-[#00A1DE] to-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6 text-balance">Ready to Transform Your Operations?</h2>
          <p className="text-xl mb-8 text-blue-100 text-pretty">
            Join the operations teams already using our platform to optimize their daily workflows
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-white text-[#00A1DE] hover:bg-gray-100 text-lg px-8">
              <Link href="/dashboard">
                Access Dashboard
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </div>

          <div className="mt-12 text-center"></div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-[#00A1DE] rounded-lg flex items-center justify-center">
                  <Plane className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">KLM Operations</span>
              </div>
              <p className="text-gray-400">Real-time operational intelligence for Schiphol Airport operations.</p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Dashboard</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/dashboard" className="hover:text-white transition-colors">
                    Main Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/gate-activity" className="hover:text-white transition-colors">
                    Gate Activity Analysis
                  </Link>
                </li>
                <li>
                  <Link href="/aircraft-type-delay-performance" className="hover:text-white transition-colors">
                    Aircraft Type Performance
                  </Link>
                </li>
                <li>
                  <Link href="/route-analytics" className="hover:text-white transition-colors">
                    Route Analytics
                  </Link>
                </li>
                <li>
                  <Link href="/delay-trends-by-hour" className="hover:text-white transition-colors">
                    Delay Trends by Hour
                  </Link>
                </li>
                <li>
                  <Link href="/busiest-gates-and-terminals" className="hover:text-white transition-colors">
                    Busiest Gates & Terminals
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Analytics</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/delay-trends-by-hour" className="hover:text-white transition-colors">
                    Delay Trends
                  </Link>
                </li>
                <li>
                  <Link href="/busiest-gates-and-terminals" className="hover:text-white transition-colors">
                    Terminal Stats
                  </Link>
                </li>
                <li>
                  <Link href="/aircraft-type-delay-performance" className="hover:text-white transition-colors">
                    Performance Reports
                  </Link>
                </li>
                <li>
                  <Link href="/route-analytics" className="hover:text-white transition-colors">
                    Operational Insights
                  </Link>
                </li>
              </ul>
            </div>

            
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400">© 2025 KLM Operations Dashboard. All rights reserved to Praevion.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
                Terms
              </Link>
              <Link href="/security" className="text-gray-400 hover:text-white transition-colors">
                Security
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}