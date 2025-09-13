"use client"

import { useEffect, useState } from 'react'

export default function TestConsent() {
  const [consentStatus, setConsentStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/consent-cookie')
      .then(res => res.json())
      .then(data => {
        setConsentStatus(data)
        setLoading(false)
      })
  }, [])

  const clearConsent = async () => {
    const res = await fetch('/api/consent-cookie', { method: 'DELETE' })
    const data = await res.json()
    alert('Consent cleared: ' + JSON.stringify(data))
    window.location.reload()
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Consent Page</h1>
      <div className="mb-4">
        <pre className="bg-gray-100 p-4 rounded">
          {JSON.stringify(consentStatus, null, 2)}
        </pre>
      </div>
      <button 
        onClick={clearConsent}
        className="bg-red-500 text-white px-4 py-2 rounded"
      >
        Clear Consent
      </button>
      <div className="mt-4">
        <a href="/dashboard" className="text-blue-500 underline">
          Go to Dashboard (protected page)
        </a>
      </div>
    </div>
  )
}