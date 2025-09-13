import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Clone the request headers
  const requestHeaders = new Headers(request.headers)
  
  // Add the pathname to headers so we can access it in server components
  requestHeaders.set('x-pathname', request.nextUrl.pathname)
  
  // Skip middleware for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }
  
  // Skip middleware for static assets
  if (request.nextUrl.pathname.startsWith('/_next/') || 
      request.nextUrl.pathname.includes('.')) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }
  
  // Pass through with pathname header
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
}