import { getConsent } from '@/lib/consent-cookies'
import { ConsentChecker } from './consent-checker'

export async function SelectiveConsentProvider({ children }: { children: React.ReactNode }) {
  // Check consent status server-side
  const consent = await getConsent()
  const hasValidConsent = consent !== null && consent.consentGiven
  
  console.log('SelectiveConsentProvider - Server side consent check:', {
    consent,
    hasValidConsent,
    timestamp: new Date().toISOString()
  })
  
  return (
    <ConsentChecker hasConsent={hasValidConsent}>
      {children}
    </ConsentChecker>
  )
}