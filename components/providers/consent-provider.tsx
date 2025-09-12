"use client"

import { ConsentWall } from "@/components/consent-wall-alternative"

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  // Temporarily disable consent wall for debugging and testing
  if (typeof window !== 'undefined' && 
      (window.location.pathname === '/debug-consent' || 
       window.location.pathname === '/test-everything')) {
    return <>{children}</>
  }
  return <ConsentWall>{children}</ConsentWall>
}