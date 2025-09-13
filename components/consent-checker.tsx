"use client"

import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { ConsentRequired } from './consent-required'

// Pages that require consent (contain API data)
const PROTECTED_PATHS = [
  '/dashboard',
  '/aircraft-performance', 
  '/delay-trends',
  '/gates-terminals',
  '/route-analytics',
  '/gate-occupancy'
]

interface ConsentCheckerProps {
  children: React.ReactNode
  hasConsent: boolean
}

export function ConsentChecker({ children, hasConsent }: ConsentCheckerProps) {
  const pathname = usePathname()
  const [showConsent, setShowConsent] = useState(false)
  
  useEffect(() => {
    // Check if this page requires consent
    const requiresConsent = PROTECTED_PATHS.some(path => pathname.startsWith(path))
    
    console.log('ConsentChecker debug:', {
      pathname,
      requiresConsent,
      hasConsent,
      willShowConsent: requiresConsent && !hasConsent
    })
    
    // Show consent if page requires it and user doesn't have consent
    setShowConsent(requiresConsent && !hasConsent)
  }, [pathname, hasConsent])
  
  if (showConsent) {
    return <ConsentRequired>{children}</ConsentRequired>
  }
  
  return <>{children}</>
}