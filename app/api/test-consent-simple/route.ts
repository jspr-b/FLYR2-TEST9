import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  console.log("Simple consent test - starting")
  
  try {
    // Test 1: Can we parse the body?
    const body = await request.json()
    console.log("Body parsed:", body)
    
    // Test 2: Can we import the model?
    const Consent = (await import('@/models/Consent')).default
    console.log("Model imported successfully")
    
    // Test 3: Can we connect to DB?
    const dbConnect = (await import('@/lib/mongodb')).default
    await dbConnect()
    console.log("DB connected")
    
    // Test 4: Can we create a simple document?
    const testConsent = new Consent({
      sessionId: "test-session-" + Date.now(),
      ipAddress: "127.0.0.1",
      userAgent: "Test Agent",
      termsVersion: "1.0.0",
      action: "agreed",
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      metadata: {}
    })
    
    console.log("Document created, attempting to save...")
    await testConsent.save()
    console.log("Document saved successfully!")
    
    return NextResponse.json({
      success: true,
      id: testConsent._id,
      message: "Test consent saved"
    })
    
  } catch (error: any) {
    console.error("Error in simple test:", error)
    console.error("Error name:", error.name)
    console.error("Error message:", error.message)
    console.error("Error stack:", error.stack)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      errorName: error.name,
      errorStack: error.stack
    }, { status: 500 })
  }
}