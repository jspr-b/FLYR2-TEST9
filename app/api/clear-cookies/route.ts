import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  const cookieStore = await cookies()
  
  // Clear all cookies
  const allCookies = cookieStore.getAll()
  for (const cookie of allCookies) {
    cookieStore.delete(cookie.name)
  }
  
  // Redirect back to home
  return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'))
}