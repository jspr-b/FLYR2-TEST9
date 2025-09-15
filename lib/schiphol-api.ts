/**
 * Schiphol API integration utilities
 */

// Schiphol API credentials - prefer environment variables, fallback to provided values
const SCHIPHOL_APP_KEY = process.env.SCHIPHOL_APP_KEY || 'bf01b2f53e73e9db0115b8f2093c97b9'
const SCHIPHOL_APP_ID = process.env.SCHIPHOL_APP_ID || 'cfcad115'

// Schiphol API base URL
const SCHIPHOL_API_BASE = 'https://api.schiphol.nl/public-flights'

// Production timeout settings - configurable based on request type
const DEFAULT_API_TIMEOUT = 30000 // 30 seconds for better reliability
const BACKGROUND_API_TIMEOUT = 45000 // 45 seconds for background refreshes
const MAX_RETRIES = 2 // Reduced from 3
const RETRY_DELAY = 500 // Reduced from 1000ms

// Cache for API responses
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes in milliseconds
const apiCache = new Map<string, { data: any; timestamp: number }>()

// Track pending requests to prevent race conditions
const pendingRequests = new Map<string, Promise<SchipholApiResponse>>()

// Concurrent page fetching for better performance
const CONCURRENT_PAGES = 3 // Fetch 3 pages at once
const PAGE_DELAY = 50 // Reduced delay between pages

export interface SchipholApiConfig {
  flightDirection?: 'D' | 'A'
  airline?: string
  scheduleDate?: string
  fetchAllPages?: boolean
  isBackgroundRefresh?: boolean // Added to determine timeout duration
  maxPagesToFetch?: number // Limit pages for background refresh
}

export interface SchipholFlight {
  flightName: string
  flightNumber: number
  flightDirection: 'D' | 'A'
  scheduleDateTime: string
  scheduleDate?: string
  publicEstimatedOffBlockTime: string
  publicFlightState: {
    flightStates: string[]
  }
  aircraftType: {
    iataMain: string
    iataSub: string
  }
  gate: string
  pier: string
  route: {
    destinations: string[]
  }
  lastUpdatedAt: string
  expectedTimeBoarding?: string
  actualOffBlockTime?: string
  // Operating carrier information
  mainFlight?: string
  prefixIATA?: string
  prefixICAO?: string
}

export interface SchipholApiResponse {
  flights: SchipholFlight[]
  meta?: {
    totalCount?: number
    page?: number
    limit?: number
  }
}

/**
 * Generate cache key for API requests
 */
function generateCacheKey(config: SchipholApiConfig): string {
  // Use a shared cache key for all dashboard data to avoid redundant API calls
  // All dashboard endpoints fetch the same base flight data, just process it differently
  if (config.fetchAllPages) {
    const dateSuffix = config.scheduleDate ? `-${config.scheduleDate}` : ''
    return `dashboard-shared-all-pages${dateSuffix}`
  }
  return 'dashboard-shared-single-page'
}

/**
 * Check if cached data is still valid
 */
function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_DURATION
}

/**
 * Fetch flights from Schiphol API with 2.5-minute caching and race condition prevention
 */
export async function fetchSchipholFlights(config: SchipholApiConfig): Promise<SchipholApiResponse> {
  const cacheKey = generateCacheKey(config)
  
  // Check cache first - but skip cache for background refresh
  if (!config.isBackgroundRefresh) {
    const cached = apiCache.get(cacheKey)
    if (cached && isCacheValid(cached.timestamp)) {
      console.log('Using cached Schiphol API data for:', cacheKey)
      return cached.data
    }
  }

  // Check if there's already a pending request for this cache key
  // But skip this check for background refresh to ensure fresh data
  if (!config.isBackgroundRefresh) {
    const pendingRequest = pendingRequests.get(cacheKey)
    if (pendingRequest) {
      console.log('🔄 Waiting for pending request for:', cacheKey)
      return await pendingRequest
    }
  }

  // Create the request promise
  const requestPromise = (async () => {
    try {
      // If fetchAllPages is true, fetch all pages
      if (config.fetchAllPages) {
        const result = await fetchAllPages(config)
        
        // Cache the result
        apiCache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        })
        
        return result
      }

      // Single page fetch (existing logic continues...)
      const params = new URLSearchParams()
      
      // Only use supported parameters
      if (config.flightDirection) {
        params.append('flightDirection', config.flightDirection)
      }
      
      if (config.airline) {
        params.append('airline', config.airline)
      }

      if (config.scheduleDate) {
        params.append('scheduleDate', config.scheduleDate)
      }

      const apiUrl = `${SCHIPHOL_API_BASE}/flights?${params.toString()}`
      
      console.log('Calling Schiphol API (not cached):', apiUrl)
      
      // Create AbortController for timeout - use longer timeout for background refresh
      const timeout = config.isBackgroundRefresh ? BACKGROUND_API_TIMEOUT : DEFAULT_API_TIMEOUT
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)
      
      let response
      try {
        response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'app_id': SCHIPHOL_APP_ID,
            'app_key': SCHIPHOL_APP_KEY,
            'ResourceVersion': 'v4'
          },
          signal: controller.signal
        })
      } finally {
        clearTimeout(timeoutId)
      }

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Schiphol API error:', response.status, response.statusText, errorText)
        
        // Handle specific error cases
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.')
        }
        
        if (response.status === 401) {
          throw new Error('Invalid API credentials. Check SCHIPHOL_APP_KEY and SCHIPHOL_APP_ID environment variables.')
        }
        
        if (response.status === 403) {
          throw new Error('Access forbidden. Check API permissions.')
        }
        
        if (response.status === 408 || response.status === 504) {
          throw new Error('Request timeout. The API is taking too long to respond.')
        }
        
        throw new Error(`Schiphol API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log('Schiphol API response received:', {
        flightCount: data.flights?.length || 0,
        meta: data.meta
      })

      // Cache the response
      apiCache.set(cacheKey, {
        data,
        timestamp: Date.now()
      })

      // Clean up old cache entries (older than 15 minutes)
      const cleanupTime = Date.now() - (15 * 60 * 1000)
      for (const [key, value] of apiCache.entries()) {
        if (value.timestamp < cleanupTime) {
          apiCache.delete(key)
        }
      }

      return data
    } catch (error) {
      console.error('Error fetching Schiphol flights:', error)
      throw error
    } finally {
      // Always clean up the pending request when done (success or failure)
      // But only if it was added (non-background refresh)
      if (!config.isBackgroundRefresh) {
        pendingRequests.delete(cacheKey)
      }
    }
  })()

  // Add the request promise to the pending requests map
  // But only for non-background refresh requests
  if (!config.isBackgroundRefresh) {
    pendingRequests.set(cacheKey, requestPromise)
  }

  // Return the promise, which will resolve when the request completes
  return requestPromise
}

/**
 * Fetch all pages of flights from Schiphol API with retry logic
 */
async function fetchAllPages(config: SchipholApiConfig): Promise<SchipholApiResponse> {
  const allFlights: any[] = []
  let page = 0
  // Use custom max pages if provided (for background refresh), otherwise default
  const maxPages = config.maxPagesToFetch || 25
  let consecutiveEmptyPages = 0
  const maxEmptyPages = 2 // Stop after 2 consecutive empty pages
  
  console.log(`Fetching ${config.isBackgroundRefresh ? 'background refresh' : 'all'} pages of Schiphol API data (max: ${maxPages})...`)
  
  // Fetch first few pages concurrently for faster initial load
  if (!config.isBackgroundRefresh && page === 0) {
    const concurrentPages = Math.min(3, maxPages)
    const pagePromises = []
    
    for (let i = 0; i < concurrentPages; i++) {
      pagePromises.push(fetchSinglePage(config, i))
    }
    
    try {
      const results = await Promise.all(pagePromises)
      for (const result of results) {
        if (result && result.flights && result.flights.length > 0) {
          allFlights.push(...result.flights)
          consecutiveEmptyPages = 0
        } else {
          consecutiveEmptyPages++
        }
      }
      page = concurrentPages
      
      console.log(`✈️ Concurrent fetch complete: ${allFlights.length} flights from first ${concurrentPages} pages`)
      
      // If we got empty pages early, stop
      if (consecutiveEmptyPages >= maxEmptyPages) {
        console.log(`🛑 Stopping early: ${consecutiveEmptyPages} consecutive empty pages`)
        return createResponse(allFlights, page)
      }
    } catch (error) {
      console.error('Concurrent fetch failed, falling back to sequential:', error)
      page = 0
      allFlights.length = 0
    }
  }
  
  while (page < maxPages && consecutiveEmptyPages < maxEmptyPages) {
    const params = new URLSearchParams()
    
    if (config.flightDirection) {
      params.append('flightDirection', config.flightDirection)
    }
    
    if (config.airline) {
      params.append('airline', config.airline)
    }
    
    if (config.scheduleDate) {
      params.append('scheduleDate', config.scheduleDate)
    }
    
    params.append('page', page.toString())

    const apiUrl = `${SCHIPHOL_API_BASE}/flights?${params.toString()}`
    
    console.log(`Fetching page ${page}:`, apiUrl)
    
    // Retry logic for each page
    let response: Response | undefined
    let retries = 0
    
    while (retries < MAX_RETRIES) {
      try {
        // Create AbortController for timeout - use longer timeout for background refresh
        const timeout = config.isBackgroundRefresh ? BACKGROUND_API_TIMEOUT : DEFAULT_API_TIMEOUT
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)
        
        try {
          response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'app_id': SCHIPHOL_APP_ID,
              'app_key': SCHIPHOL_APP_KEY,
              'ResourceVersion': 'v4'
            },
            signal: controller.signal
          })
        } finally {
          clearTimeout(timeoutId)
        }
        
        break // Success, exit retry loop
      } catch (error) {
        retries++
        console.warn(`Page ${page} attempt ${retries} failed:`, error)
        
        if (retries >= MAX_RETRIES) {
          console.error(`Failed to fetch page ${page} after ${MAX_RETRIES} attempts`)
          // If we've already fetched some data and this isn't the first page, 
          // return what we have instead of failing completely
          if (page > 0 && allFlights.length > 0) {
            console.warn(`Continuing with ${allFlights.length} flights from ${page} pages (failed on page ${page})`)
            response = undefined // Force exit from page loop
            break // Exit the retry loop
          }
          // Only throw if this is the first page or we have no data
          throw error
        }
        
        // Faster retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * Math.pow(2, retries - 1)))
      }
    }

    if (!response) {
      console.error(`No response received for page ${page}`)
      break
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Schiphol API error on page ${page}:`, response.status, response.statusText, errorText)
      // If we have some data and this isn't the first page, return what we have
      if (page > 0 && allFlights.length > 0) {
        console.warn(`HTTP error on page ${page}, continuing with ${allFlights.length} flights from ${page} pages`)
        break
      }
      // Only throw if this is the first page or we have no data
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    let data: any = {}
    try {
      const text = await response.text()
      if (!text.trim()) {
        console.log(`Empty response on page ${page}, ending pagination`)
        break
      }
      data = JSON.parse(text)
    } catch (err) {
      console.error(`Failed to parse JSON on page ${page}:`, err)
      // If this is the first page, throw the error. Otherwise, just break.
      if (page === 0) {
        throw err
      }
      break
    }
    
    const flights = data.flights || []
    
    console.log(`Page ${page}: ${flights.length} flights`)
    
    // Track empty pages
    if (flights.length === 0) {
      consecutiveEmptyPages++
      console.log(`📭 Empty page detected (${consecutiveEmptyPages}/${maxEmptyPages})`)
    } else {
      consecutiveEmptyPages = 0
      allFlights.push(...flights)
    }
    
    page++
    
    // Stop if we've seen enough empty pages
    if (consecutiveEmptyPages >= maxEmptyPages) {
      console.log(`🛑 Stopping: ${consecutiveEmptyPages} consecutive empty pages`)
      break
    }
    
    // Reduced delay for faster performance
    if (page < maxPages && flights.length > 0) {
      await new Promise(resolve => setTimeout(resolve, PAGE_DELAY))
    }
  }
  
  console.log(`Total flights fetched: ${allFlights.length} from ${page} pages`)
  
  // Only warn if we hit max pages without empty pages
  if (page >= maxPages && consecutiveEmptyPages < maxEmptyPages) {
    console.warn(`⚠️ Reached maximum page limit (${maxPages}). There might be more flights available.`)
  }
  
  const result = createResponse(allFlights, page)
  
  // Cache the complete result
  const cacheKey = generateCacheKey(config)
  apiCache.set(cacheKey, {
    data: result,
    timestamp: Date.now()
  })
  
  return result
}

/**
 * Helper function to create API response
 */
function createResponse(flights: any[], pagesFetched: number): SchipholApiResponse {
  return {
    flights,
    meta: {
      totalCount: flights.length,
      pages: pagesFetched
    }
  }
}

/**
 * Fetch a single page of data
 */
async function fetchSinglePage(config: SchipholApiConfig, pageNumber: number): Promise<{ flights: any[] } | null> {
  const params = new URLSearchParams()
  
  if (config.flightDirection) {
    params.append('flightDirection', config.flightDirection)
  }
  
  if (config.airline) {
    params.append('airline', config.airline)
  }
  
  if (config.scheduleDate) {
    params.append('scheduleDate', config.scheduleDate)
  }
  
  params.append('page', pageNumber.toString())
  
  const apiUrl = `${SCHIPHOL_API_BASE}/flights?${params.toString()}`
  
  // Create AbortController for timeout
  const timeout = config.isBackgroundRefresh ? BACKGROUND_API_TIMEOUT : DEFAULT_API_TIMEOUT
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'app_id': SCHIPHOL_APP_ID,
        'app_key': SCHIPHOL_APP_KEY,
        'ResourceVersion': 'v4'
      },
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      console.error(`Page ${pageNumber} failed with status ${response.status}`)
      return null
    }
    
    const text = await response.text()
    if (!text.trim()) {
      return { flights: [] }
    }
    
    const data = JSON.parse(text)
    return { flights: data.flights || [] }
  } catch (error) {
    console.error(`Failed to fetch page ${pageNumber}:`, error)
    return null
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Transform Schiphol API flight data to our internal format
 */
export function transformSchipholFlight(flight: any): SchipholFlight {
  return {
    flightName: flight.flightName || '',
    flightNumber: flight.flightNumber || 0,
    flightDirection: flight.flightDirection || 'D',
    scheduleDateTime: flight.scheduleDateTime || flight.scheduleDate || '',
    scheduleDate: flight.scheduleDate || flight.scheduleDateTime?.split('T')[0] || '',
    publicEstimatedOffBlockTime: flight.publicEstimatedOffBlockTime || flight.estimatedOffBlockTime || flight.scheduleDateTime || '',
    publicFlightState: {
      flightStates: flight.publicFlightState?.flightStates || flight.flightStates || []
    },
    aircraftType: {
      iataMain: flight.aircraftType?.iataMain || (typeof flight.aircraftType === 'string' ? flight.aircraftType : '') || '',
      iataSub: flight.aircraftType?.iataSub || (typeof flight.aircraftType === 'string' ? flight.aircraftType : '') || ''
    },
    gate: flight.gate || '',
    pier: flight.pier || '',
    route: {
      destinations: flight.route?.destinations || flight.destinations || []
    },
    lastUpdatedAt: flight.lastUpdatedAt || flight.updatedAt || new Date().toISOString(),
    expectedTimeBoarding: flight.expectedTimeBoarding || undefined,
    // Operating carrier information
    mainFlight: flight.mainFlight || undefined,
    prefixIATA: flight.prefixIATA || undefined,
    prefixICAO: flight.prefixICAO || undefined
  }
}

/**
 * Check if a flight is operational based on its state
 */
export function isOperationalFlight(flight: SchipholFlight): boolean {
  const operationalStates = ['SCHEDULED', 'BOARDING', 'ON_TIME', 'DELAYED', 'DEPARTED', 'SCH', 'DEP']
  const cancelledStates = ['CNX', 'CANCELLED']
  
  // If flight is cancelled, it's not operational
  if (flight.publicFlightState?.flightStates?.some(state => 
    cancelledStates.includes(state)
  )) {
    return false
  }
  
  // Check for operational states
  return flight.publicFlightState?.flightStates?.some(state => 
    operationalStates.includes(state)
  ) || true // Default to true if no state info
}

/**
 * Filter flights by various criteria
 */
export function filterFlights(
  flights: SchipholFlight[], 
  filters: {
    flightDirection?: 'D' | 'A'
    scheduleDate?: string
    prefixicao?: string
    isOperationalFlight?: boolean
  }
): SchipholFlight[] {
  let filtered = flights
  const initialCount = flights.length

  // Note: flightDirection and airline are already filtered by the API
  // We only need to filter by date and operational status on the client side

  // Filter for KLM-operated flights only (not codeshares)
  if (filters.prefixicao === 'KL') {
    const beforeKLMFilter = filtered.length
    filtered = filtered.filter(flight => {
      // Check if this is a true KLM-operated flight (not a codeshare)
      const mainFlight = flight.mainFlight || flight.flightName || ''
      
      // Only include flights where the mainFlight (operating carrier) starts with 'KL'
      // This excludes codeshares operated by other airlines (like HV, Transavia)
      if (!mainFlight.startsWith('KL')) {
        return false
      }
      
      // Exclude ground transportation services (KL9xxx range: 9000-9999)
      // These are typically bus/train services that don't update frequently
      const flightNumber = flight.flightNumber
      if (flightNumber >= 9000 && flightNumber <= 9999) {
        console.log(`🚌 Filtering ground transport: ${flight.flightName} (flight number ${flightNumber})`)
        return false
      }
      
      return true
    })
    const afterKLMFilter = filtered.length
    console.log(`KLM filter: ${beforeKLMFilter} → ${afterKLMFilter} flights (removed ${beforeKLMFilter - afterKLMFilter} codeshares/ground transport)`)
  }

  if (filters.scheduleDate) {
    const targetDate = new Date(filters.scheduleDate).toISOString().split('T')[0]
    console.log(`Filtering by date: ${targetDate}`)
    
    const beforeDateFilter = filtered.length
    filtered = filtered.filter(flight => {
      // Try multiple ways to extract the flight date
      let flightDate = null
      
      if (flight.scheduleDateTime) {
        try {
          flightDate = new Date(flight.scheduleDateTime).toISOString().split('T')[0]
        } catch (e) {
          flightDate = flight.scheduleDateTime.split('T')[0]
        }
      } else if (flight.scheduleDate) {
        flightDate = flight.scheduleDate
      }
      
      // Debug logging for first few flights
      if (filtered.length < 5) {
        console.log(`Flight ${flight.flightName}: scheduleDateTime=${flight.scheduleDateTime}, scheduleDate=${flight.scheduleDate}, extracted=${flightDate}, target=${targetDate}`)
      }
      
      return flightDate === targetDate
    })
    
    const afterDateFilter = filtered.length
    console.log(`Date filter: ${beforeDateFilter} → ${afterDateFilter} flights (removed ${beforeDateFilter - afterDateFilter} date mismatches)`)
  }

  if (filters.isOperationalFlight !== undefined) {
    const beforeOperationalFilter = filtered.length
    const removedFlights: SchipholFlight[] = []
    
    filtered = filtered.filter(flight => {
      if (filters.isOperationalFlight === true) {
        const isOp = isOperationalFlight(flight)
        if (!isOp) {
          removedFlights.push(flight)
          return false
        }
        return true
      }
      return true
    })
    const afterOperationalFilter = filtered.length
    console.log(`Operational filter: ${beforeOperationalFilter} → ${afterOperationalFilter} flights (removed ${beforeOperationalFilter - afterOperationalFilter} non-operational)`)
    
    // Log details of removed non-operational flights
    if (removedFlights.length > 0) {
      removedFlights.forEach(flight => {
        console.log(`🚫 Cancelled/Non-operational flight: ${flight.flightName} to ${flight.route?.destinations?.[0] || 'UNKNOWN'} at gate ${flight.gate || 'NO GATE'} scheduled ${flight.scheduleTime || flight.scheduleDateTime} (states: ${flight.publicFlightState?.flightStates?.join(', ') || 'NO STATES'})`)
      })
    }
  }

  console.log(`Total filtering: ${initialCount} → ${filtered.length} flights (removed ${initialCount - filtered.length} total)`)
  return filtered
}

/**
 * Filter out flights with stale lastUpdatedAt timestamps
 * Removes flights updated more than specified hours ago to prevent ghost flights
 */
export function removeStaleFlights(flights: SchipholFlight[], maxStaleHours: number = 24): SchipholFlight[] {
  const cutoffTime = new Date(Date.now() - maxStaleHours * 60 * 60 * 1000)
  const initialCount = flights.length
  
  const fresh = flights.filter(flight => {
    if (!flight.lastUpdatedAt) return true // Keep flights without timestamp
    
    const lastUpdated = new Date(flight.lastUpdatedAt)
    const isStale = lastUpdated < cutoffTime
    
    if (isStale) {
      console.log(`🗑️ Filtering stale flight: ${flight.flightName} (updated ${lastUpdated.toISOString()})`)
    }
    
    return !isStale
  })
  
  console.log(`Stale data filter: ${initialCount} → ${fresh.length} flights (removed ${initialCount - fresh.length} stale)`)
  return fresh
}

/**
 * Remove duplicate flights, keeping the most recent one for each flight number
 */
export function removeDuplicateFlights(flights: SchipholFlight[]): SchipholFlight[] {
  const flightMap = new Map<number, SchipholFlight>()
  const initialCount = flights.length
  
  flights.forEach(flight => {
    const flightNumber = flight.flightNumber
    const existingFlight = flightMap.get(flightNumber)
    
    if (!existingFlight || new Date(flight.lastUpdatedAt) > new Date(existingFlight.lastUpdatedAt)) {
      flightMap.set(flightNumber, flight)
    }
  })
  
  const finalCount = flightMap.size
  console.log(`Deduplication: ${initialCount} → ${finalCount} flights (removed ${initialCount - finalCount} duplicates)`)
  
  return Array.from(flightMap.values())
}

/**
 * Get cache statistics for monitoring
 */
export function getCacheStats() {
  const now = Date.now()
  const validEntries = Array.from(apiCache.values()).filter(entry => isCacheValid(entry.timestamp))
  
  return {
    totalEntries: apiCache.size,
    validEntries: validEntries.length,
    cacheDuration: CACHE_DURATION / 1000 / 60, // in minutes
    oldestEntry: apiCache.size > 0 ? Math.floor((now - Math.min(...Array.from(apiCache.values()).map(e => e.timestamp))) / 1000 / 60) : 0
  }
}

/**
 * Clear all cached data
 */
export function clearCache() {
  const clearedCount = apiCache.size
  apiCache.clear()
  return {
    message: 'Cache cleared successfully',
    clearedEntries: clearedCount
  }
} 