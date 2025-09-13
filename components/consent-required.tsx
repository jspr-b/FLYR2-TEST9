"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, Database, Lock, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface ConsentRequiredProps {
  children: React.ReactNode
}

export function ConsentRequired({ children }: ConsentRequiredProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleAccept = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/consent-cookie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'accept',
          essential: true,
          analytics: true
        })
      })
      
      if (response.ok) {
        // Refresh the page to show content
        router.refresh()
      } else {
        alert('Failed to save consent. Please try again.')
      }
    } catch (error) {
      console.error('Error saving consent:', error)
      alert('Error saving consent. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDecline = () => {
    // Redirect to home page
    router.push('/')
  }

  return (
    <div className="relative min-h-screen">
      {/* Blurred background content */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="blur-xl scale-105 opacity-50">
          {children}
        </div>
      </div>
      
      {/* Dark overlay for better contrast */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      
      {/* Consent Modal */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <Card className={cn(
          "max-w-2xl w-full",
          "bg-white/95 dark:bg-gray-900/95",
          "backdrop-blur-md",
          "shadow-2xl",
          "border-white/20",
          "animate-in fade-in-0 slide-in-from-bottom-4 duration-700"
        )}>
          <CardHeader className="text-center space-y-6 pb-8">
            <div className="mx-auto relative">
              <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-20 scale-150" />
              <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg">
                <Shield className="h-10 w-10 text-white" />
              </div>
            </div>
            
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                Access Flight Data
              </CardTitle>
              <CardDescription className="text-lg text-gray-600 dark:text-gray-400">
                This page contains real-time Schiphol flight data
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-8 pb-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 rounded-xl bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                <Database className="h-6 w-6 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    Live Flight Information
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Access real-time departures, delays, and gate information from Schiphol Airport
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50/50 dark:bg-gray-800/20 border border-gray-200 dark:border-gray-700">
                <Lock className="h-6 w-6 text-gray-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    Terms & Conditions Apply
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    By accessing this data, you agree not to use it for competitive analysis or EU261 claims
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800 p-6 border border-blue-100 dark:border-gray-700">
              <p className="text-center text-sm text-gray-700 dark:text-gray-300 mb-3">
                By continuing, you agree to:
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-blue-500" />
                  <span>Use data for personal travel purposes only</span>
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-blue-500" />
                  <span>Not perform competitive analysis of airlines</span>
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-blue-500" />
                  <span>Accept our cookie policy for 24 hours</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={handleAccept}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  "Accept & View Data"
                )}
              </Button>
              
              <Button
                onClick={handleDecline}
                variant="outline"
                className="flex-1 border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
                size="lg"
                disabled={isLoading}
              >
                Return to Home
              </Button>
            </div>
            
            <p className="text-center text-xs text-gray-500 dark:text-gray-400">
              View our <a href="/privacy" className="underline hover:text-gray-700">Privacy Policy</a> and <a href="/terms" className="underline hover:text-gray-700">Terms of Service</a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}