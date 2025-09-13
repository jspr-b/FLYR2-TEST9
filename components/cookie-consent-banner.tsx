"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, Cookie } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface CookieConsentBannerProps {
  onAccept: () => void
  onReject: () => void
}

export function CookieConsentBanner({ onAccept, onReject }: CookieConsentBannerProps) {
  const [isLoading, setIsLoading] = useState(false)

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
        onAccept()
      } else {
        console.error('Failed to save consent')
        alert('Failed to save consent. Please try again.')
      }
    } catch (error) {
      console.error('Error saving consent:', error)
      alert('Error saving consent. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReject = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/consent-cookie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject'
        })
      })
      
      if (response.ok) {
        onReject()
      }
    } catch (error) {
      console.error('Error rejecting consent:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full animate-in slide-in-from-bottom-5">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Cookie className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Cookie Consent</CardTitle>
          <CardDescription className="text-lg">
            We value your privacy
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="border-blue-200 bg-blue-50">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            <AlertDescription className="text-base">
              This website uses cookies to ensure you get the best experience. We use essential cookies for the website to function and analytics cookies to understand how you use our site.
            </AlertDescription>
          </Alert>

          <div className="text-center space-y-2">
            <p className="text-gray-700 font-medium">
              By clicking "Accept All", you consent to:
            </p>
            <ul className="text-sm text-gray-600 space-y-1 text-left max-w-md mx-auto">
              <li>• Essential cookies for website functionality</li>
              <li>• Analytics cookies to improve our service</li>
              <li>• Storing your preferences for 24 hours</li>
              <li>• Read our <a href="/privacy" target="_blank" className="text-blue-600 underline hover:text-blue-700">Privacy Policy</a></li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button
              onClick={handleAccept}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : "Accept All"}
            </Button>
            <Button
              onClick={handleReject}
              variant="outline"
              className="flex-1"
              size="lg"
              disabled={isLoading}
            >
              Reject Non-Essential
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}