export const CONSENT_CONFIG = {
  cookieName: 'flyr-consent',
  cookieMaxAge: 365 * 24 * 60 * 60, // 1 year in seconds
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