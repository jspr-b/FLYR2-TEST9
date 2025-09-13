"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function ClearConsentButton() {
  const [isClearing, setIsClearing] = useState(false)
  const router = useRouter()

  const handleClearConsent = async () => {
    setIsClearing(true)
    try {
      const response = await fetch('/api/consent-cookie', {
        method: 'DELETE'
      })
      
      if (response.ok) {
        // Refresh the page to show consent modal
        router.refresh()
      }
    } catch (error) {
      console.error('Error clearing consent:', error)
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <Button
      onClick={handleClearConsent}
      disabled={isClearing}
      variant="outline"
      size="sm"
      className="text-xs"
    >
      {isClearing ? 'Clearing...' : 'Clear Consent'}
    </Button>
  )
}