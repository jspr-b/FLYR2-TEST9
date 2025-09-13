import { cookies } from 'next/headers'
import { CONSENT_CONFIG, ConsentData } from './consent-config'

export async function getConsent(): Promise<ConsentData | null> {
  const cookieStore = await cookies()
  const consentCookie = cookieStore.get(CONSENT_CONFIG.cookieName)
  
  if (!consentCookie) {
    return null
  }
  
  try {
    const consent = JSON.parse(consentCookie.value) as ConsentData
    
    // Check if consent is expired (24 hours)
    const now = Date.now()
    const expiryTime = consent.timestamp + (CONSENT_CONFIG.cookieMaxAge * 1000)
    
    if (now > expiryTime) {
      return null
    }
    
    // Check if consent version matches
    if (consent.version !== CONSENT_CONFIG.consentVersion) {
      return null
    }
    
    return consent
  } catch (error) {
    console.error('Error parsing consent cookie:', error)
    return null
  }
}

export async function setConsent(consentData: ConsentData): Promise<void> {
  const cookieStore = await cookies()
  
  cookieStore.set(CONSENT_CONFIG.cookieName, JSON.stringify(consentData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: CONSENT_CONFIG.cookieMaxAge,
    path: '/'
  })
}

export async function clearConsent(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(CONSENT_CONFIG.cookieName, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    expires: new Date(0),
    path: '/'
  })
}