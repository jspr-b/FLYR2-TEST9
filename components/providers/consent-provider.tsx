"use client"

import { ConsentWall } from "@/components/consent-wall-alternative"

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  // Temporarily disable consent wall for debugging
  if (typeof window !== 'undefined' && window.location.pathname === '/debug-consent') {
    return <>{children}</>
  }
  return <ConsentWall>{children}</ConsentWall>
}