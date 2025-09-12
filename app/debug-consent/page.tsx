"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DebugConsentPage() {
  const [localStorage, setLocalStorage] = useState<any>(null)
  const [apiTest, setApiTest] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Check localStorage
    try {
      const data = window.localStorage.getItem('flyr-consent-session')
      setLocalStorage(data ? JSON.parse(data) : 'No data in localStorage')
    } catch (e: any) {
      setLocalStorage(`Error: ${e.message}`)
    }
  }, [])

  const testApi = async () => {
    setLoading(true)
    try {
      // Test GET
      const getRes = await fetch('/api/consent?sessionId=test')
      const getData = await getRes.json()
      
      // Test POST
      const postRes = await fetch('/api/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'agreed' })
      })
      const postData = await postRes.json()
      
      setApiTest({
        get: { status: getRes.status, data: getData },
        post: { status: postRes.status, data: postData }
      })
    } catch (e: any) {
      setApiTest({ error: e.message })
    }
    setLoading(false)
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Consent Debug Page</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>1. LocalStorage Status</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(localStorage, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. API Test</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={testApi} disabled={loading}>
            {loading ? 'Testing...' : 'Test Consent API'}
          </Button>
          {apiTest && (
            <pre className="bg-gray-100 p-4 rounded overflow-auto mt-4">
              {JSON.stringify(apiTest, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Clear & Refresh</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={() => {
              try {
                // Try multiple ways to clear localStorage
                if (typeof window !== 'undefined' && window.localStorage) {
                  window.localStorage.removeItem('flyr-consent-session')
                  console.log('Cleared using window.localStorage.removeItem')
                } else if (typeof localStorage !== 'undefined') {
                  // Try setting to empty
                  localStorage.setItem('flyr-consent-session', '')
                  console.log('Cleared by setting to empty string')
                }
                
                // Also try deleting the property
                try {
                  delete window.localStorage['flyr-consent-session']
                  console.log('Cleared using delete')
                } catch (e) {
                  console.error('Delete failed:', e)
                }
                
                setLocalStorage('Cleared!')
                alert('Consent cleared! Now refresh the page.')
              } catch (error: any) {
                console.error('Error clearing localStorage:', error)
                alert(`Error: ${error.message}\n\nTry opening browser console (F12) and running:\nlocalStorage.clear()`)
              }
            }}
            variant="destructive"
          >
            Clear Consent Data
          </Button>
          <Button 
            onClick={() => window.location.href = '/'}
            variant="outline"
          >
            Go to Home Page
          </Button>
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <p className="text-sm mb-2">If the button doesn't work, open browser console (F12) and run:</p>
            <code className="block bg-gray-200 p-2 rounded">
              localStorage.clear()
            </code>
            <p className="text-sm mt-2">or:</p>
            <code className="block bg-gray-200 p-2 rounded">
              localStorage.removeItem('flyr-consent-session')
            </code>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. Console Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Open browser console (F12) to see detailed logs</p>
          <Button 
            onClick={() => {
              console.log('=== CONSENT DEBUG ===')
              console.log('localStorage:', window.localStorage.getItem('flyr-consent-session'))
              console.log('Current URL:', window.location.href)
              console.log('Cookies:', document.cookie)
            }}
          >
            Log Debug Info to Console
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}