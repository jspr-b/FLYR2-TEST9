import { getConsent } from '@/lib/consent-cookies'
import { CookieConsentClient } from './cookie-consent-client'

export async function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const consent = await getConsent()
  const hasConsent = consent !== null && consent.consentGiven
  
  return (
    <>
      {children}
      {!hasConsent && <CookieConsentClient />}
    </>
  )
}