import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Skip middleware for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next()
  }
  
  // Skip middleware for static assets
  if (request.nextUrl.pathname.startsWith('/_next/') || 
      request.nextUrl.pathname.includes('.')) {
    return NextResponse.next()
  }
  
  // Allow all other routes to proceed normally
  return NextResponse.next()
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
}