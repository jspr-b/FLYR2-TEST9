import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Test the main KPIs endpoint
    const response = await fetch('http://localhost:3000/api/dashboard/kpis')
    const data = await response.json()
    
    return NextResponse.json({
      status: 'success',
      message: 'Dashboard KPIs endpoint is working',
      data: data,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Failed to test dashboard KPIs endpoint',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 