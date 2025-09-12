import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Consent from '@/models/Consent'

// Simple authentication - in production, use proper auth
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'your-admin-secret-key'

export async function GET(request: NextRequest) {
  try {
    // Check authorization
    const authHeader = request.headers.get('authorization')
    if (!authHeader || authHeader !== `Bearer ${ADMIN_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await dbConnect()
    
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const action = searchParams.get('action') // 'agreed', 'declined', or null for all
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const ipAddress = searchParams.get('ipAddress')
    const sessionId = searchParams.get('sessionId')
    
    // Build query
    const query: any = {}
    
    if (action) {
      query.action = action
    }
    
    if (ipAddress) {
      query.ipAddress = ipAddress
    }
    
    if (sessionId) {
      query.sessionId = sessionId
    }
    
    if (startDate || endDate) {
      query.timestamp = {}
      if (startDate) {
        query.timestamp.$gte = new Date(startDate)
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate)
      }
    }
    
    // Get total count
    const totalCount = await Consent.countDocuments(query)
    
    // Get paginated results
    const consents = await Consent.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .lean()
    
    // Get statistics
    const stats = await Consent.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 }
        }
      }
    ])
    
    const statistics = {
      total: totalCount,
      agreed: stats.find(s => s._id === 'agreed')?.count || 0,
      declined: stats.find(s => s._id === 'declined')?.count || 0
    }
    
    return NextResponse.json({
      success: true,
      data: consents,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      },
      statistics
    })
    
  } catch (error) {
    console.error('Error fetching consent logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch consent logs' },
      { status: 500 }
    )
  }
}

// Export consent data as CSV
export async function POST(request: NextRequest) {
  try {
    // Check authorization
    const authHeader = request.headers.get('authorization')
    if (!authHeader || authHeader !== `Bearer ${ADMIN_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await dbConnect()
    
    const body = await request.json()
    const { startDate, endDate } = body
    
    const query: any = {}
    if (startDate || endDate) {
      query.timestamp = {}
      if (startDate) {
        query.timestamp.$gte = new Date(startDate)
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate)
      }
    }
    
    const consents = await Consent.find(query)
      .sort({ timestamp: -1 })
      .lean()
    
    // Convert to CSV
    const headers = [
      'Session ID',
      'IP Address',
      'Action',
      'Timestamp',
      'Terms Version',
      'Browser',
      'OS',
      'Device',
      'User Agent'
    ]
    
    const rows = consents.map(consent => [
      consent.sessionId,
      consent.ipAddress,
      consent.action,
      consent.timestamp.toISOString(),
      consent.termsVersion,
      consent.metadata?.browser || '',
      consent.metadata?.os || '',
      consent.metadata?.device || '',
      consent.userAgent
    ])
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="consent-logs-${new Date().toISOString()}.csv"`
      }
    })
    
  } catch (error) {
    console.error('Error exporting consent logs:', error)
    return NextResponse.json(
      { error: 'Failed to export consent logs' },
      { status: 500 }
    )
  }
}