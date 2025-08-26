/**
 * Determine the most operationally significant state from an array of states
 * Higher priority states override lower priority ones
 */

// Flight state priority (higher number = higher priority)
const FLIGHT_STATE_PRIORITY: Record<string, number> = {
  'DEP': 9,  // Departed - highest priority, final state
  'GTD': 8,  // Gate Closed
  'GCL': 7,  // Gate Closing
  'BRD': 6,  // Boarding
  'GTO': 5,  // Gate Open
  'GCH': 4.5,  // Gate Change - higher than DEL to show gate changes prominently
  'DEL': 4,  // Delayed - important but doesn't override active states
  'WIL': 2,  // Wait in Lounge
  'FIR': 1.5, // First Time Information
  'SCH': 1,  // Scheduled - default state
  'STD': 0.5, // State Time Deviation
  'TOM': 0.5, // Tomorrow
  'CNX': 10, // Cancelled - special case, always highest
}

/**
 * Get the most operationally significant state from an array of states
 * @param states Array of flight states
 * @returns The most significant state
 */
export function getMostSignificantState(states: string[]): string {
  if (!states || states.length === 0) {
    return 'SCH' // Default to scheduled
  }

  // Find the state with highest priority
  let mostSignificant = states[0]
  let highestPriority = FLIGHT_STATE_PRIORITY[states[0]] || 0

  for (const state of states) {
    const priority = FLIGHT_STATE_PRIORITY[state] || 0
    if (priority > highestPriority) {
      highestPriority = priority
      mostSignificant = state
    }
  }

  return mostSignificant
}

/**
 * Check if a flight should be considered delayed
 * A flight is delayed if it has DEL state AND no active operational states
 */
export function isEffectivelyDelayed(states: string[]): boolean {
  if (!states.includes('DEL')) {
    return false
  }

  // If flight has active operational states, it's not just "delayed"
  const activeStates = ['BRD', 'GTO', 'GCL', 'GTD', 'DEP']
  return !states.some(state => activeStates.includes(state))
}