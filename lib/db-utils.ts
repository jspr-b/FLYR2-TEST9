import dbConnect from './mongodb'
import Flight from '@/models/Flight'
import HourlyDelay from '@/models/HourlyDelay'
import AircraftPerformance from '@/models/AircraftPerformance'
import GateTerminal from '@/models/GateTerminal'
import { getTodayLocalRange, getDateRangeLocal, calculateDelayMinutes } from './timezone-utils'

export interface DateRange {
  start: Date
  end: Date
}

export function getTodayRange(): DateRange {
  return getTodayLocalRange()
}

export function getDateRange(days: number): DateRange {
  return getDateRangeLocal(days)
}

export async function getFlightStats(dateRange: DateRange) {
  await dbConnect()
  
  const flights = await Flight.find({
    scheduleDateTime: {
      $gte: dateRange.start,
      $lt: dateRange.end
    }
  })
  
  // Calculate delays using timezone conversion
  const delays = flights.map(flight => 
    calculateDelayMinutes(flight.scheduleDateTime, flight.publicEstimatedOffBlockTime)
  )
  
  const totalFlights = flights.length
  const delayedFlights = delays.filter(delay => delay > 0).length
  const totalDelayMinutes = delays.reduce((sum, delay) => sum + delay, 0)
  const averageDelay = totalFlights > 0 ? totalDelayMinutes / totalFlights : 0
  
  return {
    totalFlights,
    delayedFlights,
    totalDelayMinutes,
    averageDelay
  }
}

export async function getHourlyDelayStats(dateRange: DateRange) {
  await dbConnect()
  
  return await HourlyDelay.find({
    date: {
      $gte: dateRange.start,
      $lt: dateRange.end
    }
  }).sort({ hour: 1 })
}

export async function getAircraftPerformanceStats(dateRange: DateRange) {
  await dbConnect()
  
  return await AircraftPerformance.find({
    date: {
      $gte: dateRange.start,
      $lt: dateRange.end
    }
  }).sort({ averageDelay: 1 })
}

export async function getGateTerminalStats(dateRange: DateRange) {
  await dbConnect()
  
  return await GateTerminal.find({
    date: {
      $gte: dateRange.start,
      $lt: dateRange.end
    }
  }).sort({ utilization: -1 })
}

export function formatDelayTime(minutes: number): string {
  if (minutes === 0) return 'On Time'
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
}

export function getDelayStatus(minutes: number): 'On Time' | 'Minor' | 'Moderate' | 'Major' {
  if (minutes === 0) return 'On Time'
  if (minutes <= 15) return 'Minor'
  if (minutes <= 60) return 'Moderate'
  return 'Major'
}

export function getUtilizationStatus(percentage: number): 'Low' | 'Medium' | 'High' {
  if (percentage < 50) return 'Low'
  if (percentage < 80) return 'Medium'
  return 'High'
} 