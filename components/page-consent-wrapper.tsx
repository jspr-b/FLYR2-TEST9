import { getConsent } from '@/lib/consent-cookies'
import { ConsentRequiredOptimized } from './consent-required-optimized'

// Pages that require consent (contain API data)
const PROTECTED_PATHS = [
  '/dashboard',
  '/aircraft-performance', 
  '/delay-trends',
  '/gates-terminals',
  '/route-analytics',
  '/gate-occupancy'
]

interface PageConsentWrapperProps {
  children: React.ReactNode
  pathname: string
}

export async function PageConsentWrapper({ children, pathname }: PageConsentWrapperProps) {
  // Check if this page requires consent
  const requiresConsent = PROTECTED_PATHS.some(path => pathname.startsWith(path))
  
  if (!requiresConsent) {
    // Landing page and other public pages - no consent needed
    return <>{children}</>
  }
  
  // Check if user has valid consent
  const consent = await getConsent()
  const hasValidConsent = consent !== null && consent.consentGiven
  
  if (hasValidConsent) {
    // User has consent - show the page
    return <>{children}</>
  }
  
  // User needs to give consent - show blurred page with consent modal
  // The optimized version preloads data while showing the consent screen
  return <ConsentRequiredOptimized>{children}</ConsentRequiredOptimized>
}