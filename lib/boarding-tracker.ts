/**
 * Boarding Time Tracker
 * Tracks when flights first enter boarding state to calculate early/on-time boarding rates
 */

interface BoardingRecord {
  flightNumber: string
  firstBoardingTime: string // ISO timestamp when we first saw BRD state
  expectedTimeBoarding: string | null
  boardingStatus: 'early' | 'on-time' | 'late'
  minutesDifference: number // negative = early, positive = late
}

class BoardingTracker {
  private static instance: BoardingTracker
  private boardingCache: Map<string, BoardingRecord> = new Map()
  private readonly ON_TIME_THRESHOLD_MINUTES = 5 // ±5 minutes is considered on-time

  private constructor() {}

  static getInstance(): BoardingTracker {
    if (!BoardingTracker.instance) {
      BoardingTracker.instance = new BoardingTracker()
    }
    return BoardingTracker.instance
  }

  /**
   * Track a flight's boarding status
   */
  trackFlight(flight: {
    flightNumber: string
    flightStates: string[]
    expectedTimeBoarding?: string | null
  }): BoardingRecord | null {
    const key = flight.flightNumber
    
    // Check if flight is in boarding state
    const isBoarding = flight.flightStates.includes('BRD')
    
    if (!isBoarding) {
      return this.boardingCache.get(key) || null
    }

    // If we've already tracked this flight, return existing record
    if (this.boardingCache.has(key)) {
      return this.boardingCache.get(key)!
    }

    // First time seeing this flight in boarding state
    const now = new Date().toISOString()
    const record: BoardingRecord = {
      flightNumber: flight.flightNumber,
      firstBoardingTime: now,
      expectedTimeBoarding: flight.expectedTimeBoarding || null,
      boardingStatus: 'on-time',
      minutesDifference: 0
    }

    // Calculate difference if we have expected boarding time
    if (flight.expectedTimeBoarding) {
      const expected = new Date(flight.expectedTimeBoarding).getTime()
      const actual = new Date(now).getTime()
      const diffMinutes = Math.round((actual - expected) / (1000 * 60))
      
      record.minutesDifference = diffMinutes
      
      if (diffMinutes < -this.ON_TIME_THRESHOLD_MINUTES) {
        record.boardingStatus = 'early'
      } else if (diffMinutes > this.ON_TIME_THRESHOLD_MINUTES) {
        record.boardingStatus = 'late'
      } else {
        record.boardingStatus = 'on-time'
      }
    }

    this.boardingCache.set(key, record)
    return record
  }

  /**
   * Get boarding statistics for departed flights
   */
  getBoardingStats(departedFlightNumbers: string[]): {
    total: number
    early: number
    onTime: number
    late: number
    earlyBoardingRate: number
    onTimeBoardingRate: number
  } {
    const relevantRecords = departedFlightNumbers
      .map(num => this.boardingCache.get(num))
      .filter((record): record is BoardingRecord => 
        record !== undefined && record.expectedTimeBoarding !== null
      )

    const stats = {
      total: relevantRecords.length,
      early: relevantRecords.filter(r => r.boardingStatus === 'early').length,
      onTime: relevantRecords.filter(r => r.boardingStatus === 'on-time').length,
      late: relevantRecords.filter(r => r.boardingStatus === 'late').length,
      earlyBoardingRate: 0,
      onTimeBoardingRate: 0
    }

    if (stats.total > 0) {
      stats.earlyBoardingRate = Math.round((stats.early / stats.total) * 100)
      stats.onTimeBoardingRate = Math.round(((stats.early + stats.onTime) / stats.total) * 100)
    }

    return stats
  }

  /**
   * Clear old records (flights older than 24 hours)
   */
  cleanupOldRecords() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    
    for (const [key, record] of this.boardingCache.entries()) {
      if (record.firstBoardingTime < oneDayAgo) {
        this.boardingCache.delete(key)
      }
    }
  }
}

export const boardingTracker = BoardingTracker.getInstance()
export type { BoardingRecord }