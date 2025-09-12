"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, ExternalLink } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ConsentWallProps {
  children: React.ReactNode
}

export function ConsentWall({ children }: ConsentWallProps) {
  const [hasConsent, setHasConsent] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    checkConsentStatus()
  }, [])

  const checkConsentStatus = async () => {
    // First check localStorage for session ID and basic info
    const storedData = localStorage.getItem("flyr-consent-session")
    
    if (storedData) {
      try {
        const { sessionId, expiresAt } = JSON.parse(storedData)
        
        // Quick check if expired locally
        if (new Date(expiresAt) < new Date()) {
          localStorage.removeItem("flyr-consent-session")
          setHasConsent(false)
          return
        }
        
        // Verify with backend
        const response = await fetch(`/api/consent-v2?sessionId=${sessionId}`)
        const data = await response.json()
        
        if (data.hasConsent) {
          setHasConsent(true)
        } else {
          localStorage.removeItem("flyr-consent-session")
          setHasConsent(false)
        }
      } catch (error) {
        console.error("Error checking consent:", error)
        localStorage.removeItem("flyr-consent-session")
        setHasConsent(false)
      }
    } else {
      setHasConsent(false)
    }
  }

  const handleAgree = async () => {
    setIsLoading(true)
    
    try {
      // Get existing session ID if available
      const storedData = localStorage.getItem("flyr-consent-session")
      const sessionId = storedData ? JSON.parse(storedData).sessionId : undefined
      
      // First test with simple endpoint
      console.log("Testing with simple endpoint first...")
      const testResponse = await fetch("/api/consent-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ test: true })
      })
      console.log("Test response:", await testResponse.json())
      
      // Record consent in database
      console.log("Now calling actual consent endpoint...")
      const response = await fetch("/api/consent-v2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "agreed",
          sessionId
        }),
      })
      
      console.log("Consent response status:", response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error("Response error:", errorText)
        throw new Error(`Failed to record consent: ${response.status}`)
      }
      
      let data;
      try {
        const responseText = await response.text()
        console.log("Raw response text:", responseText)
        data = JSON.parse(responseText)
        console.log("Parsed response data:", data)
      } catch (parseError) {
        console.error("Failed to parse response:", parseError)
        throw new Error("Invalid response from server")
      }
      
      // Store session info locally for quick checks
      localStorage.setItem("flyr-consent-session", JSON.stringify({
        sessionId: data.sessionId,
        expiresAt: data.expiresAt,
        timestamp: new Date().toISOString()
      }))
      
      setHasConsent(true)
    } catch (error: any) {
      console.error("Error recording consent:", error)
      console.error("Error details:", error.message)
      console.error("Error type:", error.constructor.name)
      console.error("Full error object:", error)
      alert(`Failed to record consent: ${error.message}. Please check the console for details.`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisagree = async () => {
    setIsLoading(true)
    
    try {
      // Record decline in database for audit purposes
      await fetch("/api/consent-v2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "declined"
        }),
      })
    } catch (error) {
      console.error("Error recording decline:", error)
    }
    
    // Redirect regardless of API success
    window.location.href = "https://www.schiphol.nl/en/departures/"
  }

  if (hasConsent === null) {
    return null
  }

  if (hasConsent) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Important Notice</CardTitle>
          <CardDescription className="text-lg">
            Please read before accessing flight data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="border-blue-200 bg-blue-50">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            <AlertDescription className="text-base">
              <strong className="block mb-2">Disclaimer</strong>
              This data is for educational purposes only. While we strive for accuracy, please always double-check with the official Schiphol/KLM website for the most up-to-date flight information.
            </AlertDescription>
          </Alert>

          <div className="text-center space-y-2">
            <p className="text-gray-700 font-medium">
              By continuing, you acknowledge that:
            </p>
            <ul className="text-sm text-gray-600 space-y-1 text-left max-w-md mx-auto">
              <li>• This is not an official KLM or Schiphol service</li>
              <li>• Flight data should be verified through official channels</li>
              <li>• The information is provided for educational use only</li>
              <li>• You agree to our <a href="/terms" target="_blank" className="text-blue-600 underline hover:text-blue-700">Terms & Conditions</a></li>
              <li>• Your consent is valid for 24 hours</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button
              onClick={handleAgree}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : "I Understand & Agree"}
            </Button>
            <Button
              onClick={handleDisagree}
              variant="outline"
              className="flex-1"
              size="lg"
              disabled={isLoading}
            >
              Go to Official Schiphol Site
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}