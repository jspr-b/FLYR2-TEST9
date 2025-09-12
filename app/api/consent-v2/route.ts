import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Consent from '@/models/Consent'
import crypto from 'crypto'

// Parse user agent to extract browser, OS, and device info
function parseUserAgent(userAgent: string) {
  const metadata: any = {}
  
  // Browser detection
  if (userAgent.includes('Chrome')) metadata.browser = 'Chrome'
  else if (userAgent.includes('Firefox')) metadata.browser = 'Firefox'
  else if (userAgent.includes('Safari')) metadata.browser = 'Safari'
  else if (userAgent.includes('Edge')) metadata.browser = 'Edge'
  else metadata.browser = 'Other'
  
  // OS detection
  if (userAgent.includes('Windows')) metadata.os = 'Windows'
  else if (userAgent.includes('Mac')) metadata.os = 'macOS'
  else if (userAgent.includes('Linux')) metadata.os = 'Linux'
  else if (userAgent.includes('Android')) metadata.os = 'Android'
  else if (userAgent.includes('iOS')) metadata.os = 'iOS'
  else metadata.os = 'Other'
  
  // Device detection
  if (userAgent.includes('Mobile')) metadata.device = 'Mobile'
  else if (userAgent.includes('Tablet')) metadata.device = 'Tablet'
  else metadata.device = 'Desktop'
  
  return metadata
}

// Generate a unique session ID
function generateSessionId(): string {
  return crypto.randomBytes(32).toString('hex')
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    
    const body = await request.json()
    const { action, sessionId: clientSessionId } = body
    
    if (!action || !['agreed', 'declined'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "agreed" or "declined"' },
        { status: 400 }
      )
    }
    
    // Get headers directly from request
    const userAgent = request.headers.get('user-agent') || 'Unknown'
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const cfConnectingIp = request.headers.get('cf-connecting-ip')
    
    // Get IP address (handle various proxy headers)
    const ipAddress = cfConnectingIp || forwardedFor?.split(',')[0] || realIp || 'Unknown'
    
    // Get additional metadata
    const referer = request.headers.get('referer') || undefined
    const language = request.headers.get('accept-language')?.split(',')[0] || undefined
    
    // Use provided sessionId or generate new one
    const sessionId = clientSessionId || generateSessionId()
    
    // Create consent record
    const consent = new Consent({
      sessionId,
      ipAddress,
      userAgent,
      termsVersion: '1.0.0', // Update this when terms change
      action,
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      metadata: {
        ...parseUserAgent(userAgent),
        referrer: referer,
        language
      }
    })
    
    await consent.save()
    
    return NextResponse.json({
      success: true,
      sessionId,
      expiresAt: consent.expiresAt,
      message: `Consent ${action} recorded successfully`
    })
    
  } catch (error: any) {
    console.error('Error recording consent:', error)
    return NextResponse.json(
      { error: 'Failed to record consent', details: error.message },
      { status: 500 }
    )
  }
}

// GET endpoint to check consent status
export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    
    const searchParams = request.nextUrl.searchParams
    const sessionId = searchParams.get('sessionId')
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }
    
    // Find most recent consent for this session
    const consent = await Consent.findOne({
      sessionId,
      action: 'agreed',
      expiresAt: { $gt: new Date() }
    }).sort({ timestamp: -1 })
    
    if (!consent) {
      return NextResponse.json({
        hasConsent: false,
        message: 'No valid consent found'
      })
    }
    
    return NextResponse.json({
      hasConsent: true,
      expiresAt: consent.expiresAt,
      termsVersion: consent.termsVersion,
      timestamp: consent.timestamp
    })
    
  } catch (error) {
    console.error('Error checking consent:', error)
    return NextResponse.json(
      { error: 'Failed to check consent' },
      { status: 500 }
    )
  }
}