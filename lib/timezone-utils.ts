/**
 * Timezone utilities for handling Schiphol API data
 * API times are provided in local timezone already
 * No conversion needed - use times as provided
 */

const LOCAL_TIMEZONE_OFFSET_HOURS = 0 // No conversion needed

/**
 * Convert API time (UTC+2) to local timezone (UTC+3)
 */
export function gmtToLocal(gmtTime: string | Date): Date {
  const gmtDate = new Date(gmtTime)
  return new Date(gmtDate.getTime() + (LOCAL_TIMEZONE_OFFSET_HOURS * 60 * 60 * 1000))
}

/**
 * Convert local timezone (UTC+3) to API time (UTC+2)
 */
export function localToGmt(localTime: string | Date): Date {
  const localDate = new Date(localTime)
  return new Date(localDate.getTime() - (LOCAL_TIMEZONE_OFFSET_HOURS * 60 * 60 * 1000))
}

/**
 * Calculate delay in minutes between scheduled and estimated times
 * Both times are in UTC+2 format from the API
 */
export function calculateDelayMinutes(scheduledGMT: string | Date, estimatedGMT: string | Date): number {
  const scheduledLocal = gmtToLocal(scheduledGMT)
  const estimatedLocal = gmtToLocal(estimatedGMT)
  
  return Math.max(0, (estimatedLocal.getTime() - scheduledLocal.getTime()) / (1000 * 60))
}

/**
 * Extract hour from API time (UTC+2) for local timezone grouping (UTC+3)
 */
export function extractLocalHour(gmtTime: string | Date): number {
  const localTime = gmtToLocal(gmtTime)
  return localTime.getHours()
}

/**
 * Format time for display in local timezone
 */
export function formatLocalTime(gmtTime: string | Date): string {
  const localTime = gmtToLocal(gmtTime)
  return localTime.toLocaleString()
}

/**
 * Get today's date range in local timezone for database queries
 * This ensures we query for the correct day in the local timezone
 */
export function getTodayLocalRange(): { start: Date; end: Date } {
  const now = new Date()
  const localOffset = now.getTimezoneOffset() * 60 * 1000 // Convert to milliseconds
  const utcTime = now.getTime() + localOffset
  
  // Create start of day in local timezone
  const start = new Date(utcTime)
  start.setHours(0, 0, 0, 0)
  
  // Create end of day in local timezone
  const end = new Date(utcTime)
  end.setHours(23, 59, 59, 999)
  
  return { start, end }
}

/**
 * Get date range for a specific number of days in local timezone
 */
export function getDateRangeLocal(days: number): { start: Date; end: Date } {
  const now = new Date()
  const localOffset = now.getTimezoneOffset() * 60 * 1000
  
  const end = new Date(now.getTime() + localOffset)
  end.setHours(23, 59, 59, 999)
  
  const start = new Date(now.getTime() + localOffset)
  start.setDate(start.getDate() - days)
  start.setHours(0, 0, 0, 0)
  
  return { start, end }
} 