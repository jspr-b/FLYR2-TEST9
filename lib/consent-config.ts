export const CONSENT_CONFIG = {
  cookieName: 'flyr-consent',
  cookieMaxAge: 24 * 60 * 60, // 24 hours in seconds
  consentVersion: '1.0.0',
  consentTypes: {
    essential: 'Essential cookies for basic functionality',
    analytics: 'Analytics cookies for understanding usage'
  }
}

export interface ConsentData {
  essential: boolean
  analytics: boolean
  consentGiven: boolean
  timestamp: number
  version: string
  sessionId?: string
}