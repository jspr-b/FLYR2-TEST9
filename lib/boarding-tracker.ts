/**
 * Boarding Time Tracker
 * Tracks when flights first enter boarding state to calculate early/on-time boarding rates
 */

interface BoardingRecord {
  flightNumber: string
  firstBoardingTime: string // ISO timestamp when we first saw BRD state
  expectedTimeBoarding: string | null // Expected boarding time from API
  boardingStatus: 'early' | 'on-time' | 'late'
  minutesDifference: number // negative = early, positive = late
}

class BoardingTracker {
  private static instance: BoardingTracker
  private boardingCache: Map<string, BoardingRecord> = new Map()
  private readonly ON_TIME_THRESHOLD_MINUTES = 2.5 // ±2.5 minutes is considered on-time

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
    expectedTimeBoarding: string | null
    scheduleDateTime?: string
  }): BoardingRecord | null {
    const key = flight.flightNumber
    
    // Check if flight is in boarding state OR has departed (assuming it went through boarding)
    const isBoarding = flight.flightStates.includes('BRD')
    const hasDeparted = flight.flightStates.includes('DEP')
    
    // If not boarding and hasn't departed, skip
    if (!isBoarding && !hasDeparted) {
      return this.boardingCache.get(key) || null
    }

    // If we've already tracked this flight, return existing record
    if (this.boardingCache.has(key)) {
      return this.boardingCache.get(key)!
    }

    // First time seeing this flight
    const now = new Date().toISOString()
    
    // For departed flights without BRD state, estimate boarding happened on schedule
    const actualBoardingTime = hasDeparted && !isBoarding && flight.scheduleDateTime
      ? new Date(new Date(flight.scheduleDateTime).getTime() - 30 * 60 * 1000).toISOString() // Assume boarding 30 min before departure
      : now
    
    console.log(`🛫 Tracking flight ${flight.flightNumber}`)
    console.log(`   States: ${flight.flightStates.join(', ')}`)
    console.log(`   Boarding time: ${actualBoardingTime} ${hasDeparted && !isBoarding ? '(estimated for departed flight)' : '(actual)'}`)
    
    // If no expected boarding time from API, calculate it as schedule - 45 minutes
    let expectedBoardingTime = flight.expectedTimeBoarding
    if (!expectedBoardingTime && flight.scheduleDateTime) {
      const scheduledDeparture = new Date(flight.scheduleDateTime)
      const calculatedExpected = new Date(scheduledDeparture.getTime() - 45 * 60 * 1000)
      expectedBoardingTime = calculatedExpected.toISOString()
      console.log(`   📊 No API boarding time, using calculated: ${expectedBoardingTime} (schedule - 45min)`)
    }
    
    if (!expectedBoardingTime) {
      console.log(`   ⚠️ Cannot determine expected boarding time`)
      return null
    }
    
    const record: BoardingRecord = {
      flightNumber: flight.flightNumber,
      firstBoardingTime: actualBoardingTime,
      expectedTimeBoarding: expectedBoardingTime,
      boardingStatus: 'on-time',
      minutesDifference: 0
    }

    // Calculate difference between actual and expected boarding
    const actual = new Date(actualBoardingTime).getTime()
    const expected = new Date(expectedBoardingTime).getTime()
    const diffMinutes = (actual - expected) / (1000 * 60) // Keep decimals for precision
    
    record.minutesDifference = Math.round(diffMinutes)
    
    if (diffMinutes < -this.ON_TIME_THRESHOLD_MINUTES) {
      record.boardingStatus = 'early'
      console.log(`   ✅ Flight ${flight.flightNumber} is boarding EARLY by ${Math.abs(Math.round(diffMinutes))} minutes`)
    } else if (diffMinutes > this.ON_TIME_THRESHOLD_MINUTES) {
      record.boardingStatus = 'late'
      console.log(`   ⚠️ Flight ${flight.flightNumber} is boarding LATE by ${Math.round(diffMinutes)} minutes`)
    } else {
      record.boardingStatus = 'on-time'
      console.log(`   ✅ Flight ${flight.flightNumber} is boarding ON TIME (within ±${this.ON_TIME_THRESHOLD_MINUTES} min)`)
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
      .filter((record): record is BoardingRecord => record !== undefined)

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
   * Get all tracked flights (for debugging)
   */
  getAllTrackedFlights(): BoardingRecord[] {
    return Array.from(this.boardingCache.values())
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.boardingCache.size
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