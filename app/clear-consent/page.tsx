"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ClearConsent() {
  const router = useRouter()

  useEffect(() => {
    // Clear consent via API
    fetch('/api/consent-cookie', { method: 'DELETE' })
      .then(() => {
        // Also try to clear any client-side storage
        if (typeof window !== 'undefined') {
          // Clear any localStorage items
          localStorage.clear()
          // Clear any sessionStorage items
          sessionStorage.clear()
          // Force reload to dashboard
          setTimeout(() => {
            window.location.href = '/dashboard'
          }, 1000)
        }
      })
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Clearing consent...</h1>
        <p className="text-gray-600">You will be redirected to the dashboard.</p>
      </div>
    </div>
  )
}