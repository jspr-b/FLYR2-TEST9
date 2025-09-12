"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestConsentPage() {
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testConsent = async () => {
    setLoading(true)
    setResult(null)
    setError(null)

    try {
      console.log("Making consent request...")
      
      const response = await fetch("/api/consent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "agreed"
        }),
      })

      console.log("Response status:", response.status)
      console.log("Response headers:", response.headers)
      
      const responseText = await response.text()
      console.log("Raw response:", responseText)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${responseText}`)
      }

      const data = JSON.parse(responseText)
      setResult(data)
    } catch (err: any) {
      console.error("Full error:", err)
      setError({
        message: err.message,
        stack: err.stack,
        name: err.name
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Test Consent API</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testConsent} disabled={loading}>
            {loading ? "Testing..." : "Test Consent API"}
          </Button>

          {result && (
            <div className="p-4 bg-green-50 rounded">
              <h3 className="font-bold text-green-800 mb-2">Success!</h3>
              <pre className="text-sm">{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 rounded">
              <h3 className="font-bold text-red-800 mb-2">Error!</h3>
              <p className="text-red-700">{error.message}</p>
              <pre className="text-xs mt-2">{error.stack}</pre>
            </div>
          )}

          <div className="text-sm text-gray-600">
            Open browser console (F12) for detailed logs
          </div>
        </CardContent>
      </Card>
    </div>
  )
}