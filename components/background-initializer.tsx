"use client"

import { useEffect } from 'react'

export function BackgroundInitializer() {
  useEffect(() => {
    // Initialize background processing on app start
    fetch('/api/init')
      .then(res => res.json())
      .then(data => console.log('Background processing:', data.message))
      .catch(err => console.error('Failed to initialize background processing:', err))
  }, [])

  return null // This component doesn't render anything
}