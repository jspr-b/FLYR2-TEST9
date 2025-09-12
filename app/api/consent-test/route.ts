import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // Just return a simple JSON response to test
  return NextResponse.json({
    success: true,
    message: "This is a test response",
    timestamp: new Date().toISOString()
  })
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "GET request successful",
    timestamp: new Date().toISOString()
  })
}