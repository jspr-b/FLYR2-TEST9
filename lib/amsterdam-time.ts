/**
 * Amsterdam timezone utilities for consistent time handling across the application
 * 
 * The Schiphol API returns flight data in Amsterdam local time (UTC+2 during DST, UTC+1 standard time).
 * This utility ensures all time calculations are done in Amsterdam timezone regardless of server location.
 */

/**
 * Get current time as a proper Date object for Amsterdam timezone calculations
 * This returns the current moment in time - the same universal timestamp
 * The key insight: Date objects represent moments in time, not local times
 */
export function toAmsterdamTime(date: Date = new Date()): Date {
  // Simply return the same moment in time
  // When we need Amsterdam-specific formatting, we use timeZone in toLocaleString
  return new Date(date.getTime());
}

/**
 * Get current Amsterdam time
 */
export function getCurrentAmsterdamTime(): Date {
  return toAmsterdamTime()
}

/**
 * Format time in Amsterdam timezone
 */
export function formatAmsterdamTime(date: Date | string | null | undefined): string {
  if (!date) return 'n/v'
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    if (isNaN(dateObj.getTime())) return 'n/v'
    
    return dateObj.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Europe/Amsterdam'
    })
  } catch {
    return 'n/v'
  }
}

/**
 * Format date and time in Amsterdam timezone
 */
export function formatAmsterdamDateTime(date: Date | string | null | undefined): string {
  if (!date) return 'n/v'
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    if (isNaN(dateObj.getTime())) return 'n/v'
    
    return dateObj.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Europe/Amsterdam'
    })
  } catch {
    return 'n/v'
  }
}

/**
 * Get Amsterdam date string in YYYY-MM-DD format
 */
export function getAmsterdamDateString(date: Date = new Date()): string {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Europe/Amsterdam'
  }
  
  const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(date)
  const year = parts.find(p => p.type === 'year')?.value
  const month = parts.find(p => p.type === 'month')?.value
  const day = parts.find(p => p.type === 'day')?.value
  
  return `${year}-${month}-${day}`
}

/**
 * Get today's date string in Amsterdam timezone (YYYY-MM-DD format)
 */
export function getTodayAmsterdam(): string {
  const now = new Date();
  return now.toLocaleDateString('en-CA', { timeZone: 'Europe/Amsterdam' }); // en-CA gives YYYY-MM-DD format
}

/**
 * Check if a flight time (already in Amsterdam timezone from API) is in the past relative to Amsterdam time
 */
export function isFlightInPast(flightDateTime: string): boolean {
  const flightTime = new Date(flightDateTime).getTime()
  const currentAmsterdamTime = getCurrentAmsterdamTime().getTime()
  return flightTime < currentAmsterdamTime
}

/**
 * Calculate time difference in minutes between two Amsterdam timezone dates
 */
export function getTimeDifferenceMinutes(dateTime1: string, dateTime2: string = getCurrentAmsterdamTime().toISOString()): number {
  const time1 = new Date(dateTime1).getTime()
  const time2 = new Date(dateTime2).getTime()
  return Math.round((time1 - time2) / (1000 * 60))
}