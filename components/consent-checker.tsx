"use client"

import { usePathname } from 'next/navigation'
import { ConsentRequired } from './consent-required'

// Pages that require consent (contain API data)
const PROTECTED_PATHS = [
  '/dashboard',
  '/aircraft-type-delay-performance',
  '/delay-trends-by-hour',
  '/busiest-gates-and-terminals',
  '/route-analytics',
  '/gate-activity'
]

interface ConsentCheckerProps {
  children: React.ReactNode
  hasConsent: boolean
}

export function ConsentChecker({ children, hasConsent }: ConsentCheckerProps) {
  const pathname = usePathname()
  
  // Check if this page requires consent
  const requiresConsent = PROTECTED_PATHS.some(path => pathname.startsWith(path))
  
  console.log('ConsentChecker debug:', {
    pathname,
    requiresConsent,
    hasConsent,
    willShowConsent: requiresConsent && !hasConsent
  })
  
  // Show consent if page requires it and user doesn't have consent
  if (requiresConsent && !hasConsent) {
    return <ConsentRequired>{children}</ConsentRequired>
  }
  
  return <>{children}</>
}