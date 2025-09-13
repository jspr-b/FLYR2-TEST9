import { NextRequest, NextResponse } from 'next/server'
import { setConsent, getConsent, clearConsent } from '@/lib/consent-cookies'
import { CONSENT_CONFIG, ConsentData } from '@/lib/consent-config'
import dbConnect from '@/lib/mongodb'
import Consent from '@/models/Consent'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, essential = true, analytics = false } = body
    
    if (action === 'accept') {
      // Generate session ID
      const sessionId = crypto.randomBytes(32).toString('hex')
      
      // Create consent data
      const consentData: ConsentData = {
        essential,
        analytics,
        consentGiven: true,
        timestamp: Date.now(),
        version: CONSENT_CONFIG.consentVersion,
        sessionId
      }
      
      // Set cookie
      await setConsent(consentData)
      
      // Also save to database for legal compliance
      try {
        await dbConnect()
        
        const consent = new Consent({
          sessionId,
          ipAddress: request.headers.get('x-forwarded-for') || 'Unknown',
          userAgent: request.headers.get('user-agent') || 'Unknown',
          termsVersion: CONSENT_CONFIG.consentVersion,
          action: 'agreed',
          timestamp: new Date(),
          expiresAt: new Date(Date.now() + CONSENT_CONFIG.cookieMaxAge * 1000),
          metadata: {
            essential,
            analytics
          }
        })
        
        await consent.save()
      } catch (dbError) {
        console.error('Database save error:', dbError)
        // Continue even if DB save fails
      }
      
      return NextResponse.json({
        success: true,
        sessionId,
        message: 'Consent recorded'
      })
    } else if (action === 'reject') {
      // Clear any existing consent
      await clearConsent()
      
      // Record rejection in database
      try {
        await dbConnect()
        
        const consent = new Consent({
          sessionId: crypto.randomBytes(32).toString('hex'),
          ipAddress: request.headers.get('x-forwarded-for') || 'Unknown',
          userAgent: request.headers.get('user-agent') || 'Unknown',
          termsVersion: CONSENT_CONFIG.consentVersion,
          action: 'declined',
          timestamp: new Date(),
          expiresAt: new Date(Date.now() + CONSENT_CONFIG.cookieMaxAge * 1000),
          metadata: {}
        })
        
        await consent.save()
      } catch (dbError) {
        console.error('Database save error:', dbError)
      }
      
      return NextResponse.json({
        success: true,
        message: 'Consent rejected'
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Consent cookie error:', error)
    return NextResponse.json(
      { error: 'Failed to process consent' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const consent = await getConsent()
    
    return NextResponse.json({
      hasConsent: consent !== null && consent.consentGiven,
      consent
    })
  } catch (error) {
    console.error('Get consent error:', error)
    return NextResponse.json(
      { error: 'Failed to get consent' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    // Clear the consent cookie
    await clearConsent()
    
    return NextResponse.json({
      success: true,
      message: 'Consent cleared'
    })
  } catch (error) {
    console.error('Clear consent error:', error)
    return NextResponse.json(
      { error: 'Failed to clear consent' },
      { status: 500 }
    )
  }
}