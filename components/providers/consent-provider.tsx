"use client"

import { ConsentWall } from "@/components/consent-wall"

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  return <ConsentWall>{children}</ConsentWall>
}