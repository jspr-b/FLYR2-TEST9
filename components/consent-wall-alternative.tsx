"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, ExternalLink } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ConsentWallProps {
  children: React.ReactNode
}

// Alternative storage methods when localStorage is not available
const storage = {
  get: () => {
    try {
      // Try localStorage first
      if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.getItem === 'function') {
        return window.localStorage.getItem('flyr-consent-session')
      }
    } catch (e) {
      console.log('localStorage not available:', e)
    }
    
    try {
      // Fallback to sessionStorage
      if (typeof window !== 'undefined' && window.sessionStorage) {
        return window.sessionStorage.getItem('flyr-consent-session')
      }
    } catch (e) {
      console.log('sessionStorage not available:', e)
    }
    
    // Fallback to cookies
    if (typeof document !== 'undefined') {
      const match = document.cookie.match(/flyr-consent-session=([^;]+)/)
      return match ? decodeURIComponent(match[1]) : null
    }
    
    return null
  },
  
  set: (value: string) => {
    try {
      // Try localStorage first
      if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.setItem === 'function') {
        window.localStorage.setItem('flyr-consent-session', value)
        return true
      }
    } catch (e) {
      console.log('localStorage.setItem failed:', e)
    }
    
    try {
      // Fallback to sessionStorage
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem('flyr-consent-session', value)
        return true
      }
    } catch (e) {
      console.log('sessionStorage.setItem failed:', e)
    }
    
    // Fallback to cookies
    if (typeof document !== 'undefined') {
      const expires = new Date()
      expires.setTime(expires.getTime() + 24 * 60 * 60 * 1000) // 24 hours
      document.cookie = `flyr-consent-session=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/`
      return true
    }
    
    return false
  },
  
  remove: () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.removeItem === 'function') {
        window.localStorage.removeItem('flyr-consent-session')
      }
    } catch (e) {
      console.log('localStorage.removeItem failed:', e)
    }
    
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.removeItem('flyr-consent-session')
      }
    } catch (e) {
      console.log('sessionStorage.removeItem failed:', e)
    }
    
    // Clear cookie
    if (typeof document !== 'undefined') {
      document.cookie = 'flyr-consent-session=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
    }
  }
}

export function ConsentWall({ children }: ConsentWallProps) {
  const [hasConsent, setHasConsent] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    checkConsentStatus()
  }, [])

  const checkConsentStatus = () => {
    console.log("[ConsentWall] Checking consent status...")
    
    try {
      const storedData = storage.get()
      console.log("[ConsentWall] Storage data:", storedData)
      
      if (!storedData) {
        console.log("[ConsentWall] No consent data found")
        setHasConsent(false)
        return
      }
      
      const parsed = JSON.parse(storedData)
      const { sessionId, expiresAt } = parsed
      
      if (!sessionId || !expiresAt) {
        console.error("[ConsentWall] Invalid consent data structure:", parsed)
        storage.remove()
        setHasConsent(false)
        return
      }
      
      // Check if expired
      const expiryDate = new Date(expiresAt)
      const now = new Date()
      
      if (expiryDate <= now) {
        console.log("[ConsentWall] Consent expired", { expiryDate, now })
        storage.remove()
        setHasConsent(false)
        return
      }
      
      console.log("[ConsentWall] Valid consent found", { sessionId, expiresAt })
      setHasConsent(true)
      
    } catch (error) {
      console.error("[ConsentWall] Error checking consent:", error)
      storage.remove()
      setHasConsent(false)
    }
  }

  const handleAgree = async () => {
    setIsLoading(true)
    
    try {
      // Record consent in database
      const response = await fetch("/api/consent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "agreed"
        }),
      })
      
      if (!response.ok) {
        throw new Error(`Failed to record consent: ${response.status}`)
      }
      
      const data = await response.json()
      
      // Store session info using fallback storage
      const consentData = JSON.stringify({
        sessionId: data.sessionId,
        expiresAt: data.expiresAt,
        timestamp: new Date().toISOString()
      })
      
      const stored = storage.set(consentData)
      if (!stored) {
        throw new Error("Failed to store consent data")
      }
      
      console.log("[ConsentWall] Consent saved successfully")
      setHasConsent(true)
    } catch (error: any) {
      console.error("Error recording consent:", error)
      alert("Failed to record consent. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisagree = async () => {
    setIsLoading(true)
    
    try {
      // Record decline in database for audit purposes
      await fetch("/api/consent", {
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
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
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