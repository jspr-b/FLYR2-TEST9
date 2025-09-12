"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, AlertCircle } from "lucide-react"

export default function TestEverythingPage() {
  const [results, setResults] = useState<any>({})
  const [loading, setLoading] = useState(false)

  const runAllTests = async () => {
    setLoading(true)
    const testResults: any = {}

    // Test 1: Check localStorage availability
    try {
      localStorage.setItem('test', 'test')
      localStorage.removeItem('test')
      testResults.localStorage = { status: 'pass', message: 'localStorage is working' }
    } catch (e: any) {
      testResults.localStorage = { status: 'fail', message: `localStorage error: ${e.message}` }
    }

    // Test 2: Check sessionStorage
    try {
      sessionStorage.setItem('test', 'test')
      sessionStorage.removeItem('test')
      testResults.sessionStorage = { status: 'pass', message: 'sessionStorage is working' }
    } catch (e: any) {
      testResults.sessionStorage = { status: 'fail', message: `sessionStorage error: ${e.message}` }
    }

    // Test 3: Check cookies
    try {
      document.cookie = 'test=test; path=/'
      const hasCookie = document.cookie.includes('test=test')
      document.cookie = 'test=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
      testResults.cookies = { 
        status: hasCookie ? 'pass' : 'fail', 
        message: hasCookie ? 'Cookies are working' : 'Cookies are blocked' 
      }
    } catch (e: any) {
      testResults.cookies = { status: 'fail', message: `Cookie error: ${e.message}` }
    }

    // Test 4: Check consent API - POST
    try {
      const response = await fetch('/api/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'agreed' })
      })
      const data = await response.json()
      
      // Save the consent data to storage (like the consent wall should)
      if (data.success && data.sessionId) {
        const consentData = JSON.stringify({
          sessionId: data.sessionId,
          expiresAt: data.expiresAt,
          timestamp: new Date().toISOString()
        })
        
        try {
          localStorage.setItem('flyr-consent-session', consentData)
        } catch (e) {
          try {
            sessionStorage.setItem('flyr-consent-session', consentData)
          } catch (e2) {
            document.cookie = `flyr-consent-session=${encodeURIComponent(consentData)}; path=/`
          }
        }
      }
      
      testResults.consentPost = { 
        status: response.ok && data.success ? 'pass' : 'fail', 
        message: `Status: ${response.status}, SessionId: ${data.sessionId?.substring(0, 10)}...`,
        data
      }
    } catch (e: any) {
      testResults.consentPost = { status: 'fail', message: `API error: ${e.message}` }
    }

    // Test 5: Check consent API - GET
    try {
      const sessionId = testResults.consentPost?.data?.sessionId || 'test'
      const response = await fetch(`/api/consent?sessionId=${sessionId}`)
      const data = await response.json()
      testResults.consentGet = { 
        status: response.ok ? 'pass' : 'fail', 
        message: `Has consent: ${data.hasConsent}`,
        data
      }
    } catch (e: any) {
      testResults.consentGet = { status: 'fail', message: `API error: ${e.message}` }
    }

    // Test 6: Check MongoDB connection
    try {
      const response = await fetch('/api/admin/consent-logs', {
        headers: { 'Authorization': 'Bearer flyr-admin-secret-2025-secure-key' }
      })
      testResults.mongodb = { 
        status: response.status === 200 ? 'pass' : 'warn', 
        message: response.status === 200 ? 'MongoDB connected' : `Status: ${response.status} (auth may be required)`
      }
    } catch (e: any) {
      testResults.mongodb = { status: 'fail', message: `MongoDB error: ${e.message}` }
    }

    // Test 7: Check current consent status
    try {
      let consentData = null
      // Try localStorage
      try {
        consentData = localStorage.getItem('flyr-consent-session')
      } catch (e) {
        // Try sessionStorage
        try {
          consentData = sessionStorage.getItem('flyr-consent-session')
        } catch (e2) {
          // Try cookies
          const match = document.cookie.match(/flyr-consent-session=([^;]+)/)
          consentData = match ? decodeURIComponent(match[1]) : null
        }
      }
      
      if (consentData) {
        const parsed = JSON.parse(consentData)
        const expiresAt = new Date(parsed.expiresAt)
        const now = new Date()
        testResults.currentConsent = { 
          status: expiresAt > now ? 'pass' : 'warn', 
          message: expiresAt > now ? `Valid until ${expiresAt.toLocaleString()}` : 'Expired consent found',
          data: parsed
        }
      } else {
        testResults.currentConsent = { 
          status: 'info', 
          message: 'No consent data found' 
        }
      }
    } catch (e: any) {
      testResults.currentConsent = { status: 'fail', message: `Error: ${e.message}` }
    }

    setResults(testResults)
    setLoading(false)
  }

  const getIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'fail': return <XCircle className="h-5 w-5 text-red-600" />
      case 'warn': return <AlertCircle className="h-5 w-5 text-yellow-600" />
      default: return <AlertCircle className="h-5 w-5 text-blue-600" />
    }
  }

  const getColor = (status: string) => {
    switch (status) {
      case 'pass': return 'bg-green-50 border-green-200'
      case 'fail': return 'bg-red-50 border-red-200'
      case 'warn': return 'bg-yellow-50 border-yellow-200'
      default: return 'bg-blue-50 border-blue-200'
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Consent System Test Suite</CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={runAllTests} 
            disabled={loading}
            className="mb-6"
          >
            {loading ? 'Running Tests...' : 'Run All Tests'}
          </Button>

          {Object.entries(results).length > 0 && (
            <div className="space-y-4">
              {Object.entries(results).map(([test, result]: [string, any]) => (
                <div 
                  key={test} 
                  className={`p-4 rounded-lg border ${getColor(result.status)}`}
                >
                  <div className="flex items-start gap-3">
                    {getIcon(result.status)}
                    <div className="flex-1">
                      <h3 className="font-semibold capitalize">
                        {test.replace(/([A-Z])/g, ' $1').trim()}
                      </h3>
                      <p className="text-sm mt-1">{result.message}</p>
                      {result.data && (
                        <details className="mt-2">
                          <summary className="text-sm text-gray-600 cursor-pointer">
                            View details
                          </summary>
                          <pre className="text-xs mt-2 p-2 bg-gray-100 rounded overflow-auto">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 p-4 bg-gray-100 rounded">
            <h3 className="font-semibold mb-2">Quick Actions:</h3>
            <div className="space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.href = '/'}
              >
                Go Home
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.href = '/debug-consent'}
              >
                Debug Console
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  try {
                    localStorage.removeItem('flyr-consent-session')
                    sessionStorage.removeItem('flyr-consent-session')
                    document.cookie = 'flyr-consent-session=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
                    alert('Consent cleared!')
                    runAllTests()
                  } catch (e) {
                    alert('Error clearing consent')
                  }
                }}
              >
                Clear Consent
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={async () => {
                  try {
                    // Create consent via API
                    const response = await fetch('/api/consent', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ action: 'agreed' })
                    })
                    const data = await response.json()
                    
                    if (data.success) {
                      // Save to storage
                      const consentData = JSON.stringify({
                        sessionId: data.sessionId,
                        expiresAt: data.expiresAt,
                        timestamp: new Date().toISOString()
                      })
                      localStorage.setItem('flyr-consent-session', consentData)
                      alert('Consent created and saved!')
                      window.location.href = '/'
                    }
                  } catch (e) {
                    alert('Error creating consent')
                  }
                }}
              >
                Quick Consent & Go Home
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}