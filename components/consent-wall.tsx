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

  useEffect(() => {
    const consentData = localStorage.getItem("flyr-consent-data")
    
    if (consentData) {
      try {
        const { agreed, timestamp } = JSON.parse(consentData)
        const twentyFourHours = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
        const now = Date.now()
        
        // Check if consent is still valid (less than 24 hours old)
        if (agreed && timestamp && (now - timestamp) < twentyFourHours) {
          setHasConsent(true)
        } else {
          // Consent has expired
          localStorage.removeItem("flyr-consent-data")
          setHasConsent(false)
        }
      } catch {
        // Invalid data, reset
        localStorage.removeItem("flyr-consent-data")
        setHasConsent(false)
      }
    } else {
      setHasConsent(false)
    }
  }, [])

  const handleAgree = () => {
    const consentData = {
      agreed: true,
      timestamp: Date.now()
    }
    localStorage.setItem("flyr-consent-data", JSON.stringify(consentData))
    setHasConsent(true)
  }

  const handleDisagree = () => {
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
            >
              I Understand & Agree
            </Button>
            <Button
              onClick={handleDisagree}
              variant="outline"
              className="flex-1"
              size="lg"
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