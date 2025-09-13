"use client"

import { useState } from "react"
import { CookieConsentBanner } from "./cookie-consent-banner"
import { useRouter } from "next/navigation"

export function CookieConsentClient() {
  const [showBanner, setShowBanner] = useState(true)
  const router = useRouter()

  const handleAccept = () => {
    setShowBanner(false)
    // Refresh the page to update the server component
    router.refresh()
  }

  const handleReject = () => {
    // Redirect to Schiphol website
    window.location.href = "https://www.schiphol.nl/en/departures/"
  }

  if (!showBanner) {
    return null
  }

  return <CookieConsentBanner onAccept={handleAccept} onReject={handleReject} />
}