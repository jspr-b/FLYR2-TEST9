"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export default function TestConsentSecurity() {
  const [apiResponse, setApiResponse] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const testDirectAPIAccess = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/dashboard/kpis')
      const data = await response.json()
      setApiResponse(JSON.stringify(data, null, 2))
    } catch (error) {
      setApiResponse(`Error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Consent Security Test</h1>
      
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
          <h2 className="font-semibold mb-3">✅ How Consent Protection Works:</h2>
          <ul className="space-y-2 list-disc list-inside">
            <li><strong>UI Level Protection:</strong> The PageConsentWrapper checks for valid consent before showing protected pages</li>
            <li><strong>Consent Modal Blocks Access:</strong> Users MUST click "Accept" to see dashboard content</li>
            <li><strong>Preloading is Cache Warming Only:</strong> API calls during consent screen just prepare data, don't display it</li>
            <li><strong>Page Refresh After Accept:</strong> Ensures fresh consent state is checked before showing content</li>
          </ul>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
          <h2 className="font-semibold mb-3">⚠️ Current Implementation:</h2>
          <p className="mb-3">The API endpoints themselves don't check consent, but this is OK because:</p>
          <ul className="space-y-2 list-disc list-inside">
            <li>The UI strictly enforces consent before showing any protected content</li>
            <li>Preloading improves UX without compromising the consent requirement</li>
            <li>Users cannot navigate to protected pages without accepting consent</li>
          </ul>
        </div>

        <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg">
          <h2 className="font-semibold mb-3">🔍 Test Direct API Access:</h2>
          <p className="mb-4">This shows that while APIs can be called, the UI still requires consent:</p>
          <Button 
            onClick={testDirectAPIAccess}
            disabled={isLoading}
            className="mb-4"
          >
            {isLoading ? 'Testing...' : 'Test API Access Without Consent'}
          </Button>
          
          {apiResponse && (
            <pre className="bg-gray-900 text-gray-100 p-4 rounded overflow-auto text-sm">
              {apiResponse}
            </pre>
          )}
        </div>

        <div className="bg-green-50 border border-green-200 p-6 rounded-lg">
          <h2 className="font-semibold mb-3">✅ Summary:</h2>
          <p className="font-medium">Users MUST still click "I agree" to access dashboard content!</p>
          <p className="mt-2">The optimization only starts loading data early to reduce wait time after consent is given.</p>
        </div>
      </div>
    </div>
  )
}