import { FlightResponse } from '@/types/flight'

interface FlightFilters {
  flightDirection?: 'D' | 'A'
  scheduleDate?: string
  isOperationalFlight?: boolean
  prefixicao?: string
}

export async function fetchFlights(filters?: FlightFilters): Promise<FlightResponse> {
  try {
    let url = '/api/flights'
    
    if (filters) {
      const filtersParam = encodeURIComponent(JSON.stringify(filters))
      url += `?filters=${filtersParam}`
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching flights:', error)
    throw error
  }
}

export async function saveFlights(flights: any[]): Promise<any> {
  try {
    const response = await fetch('/api/flights', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ flights }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error saving flights:', error)
    throw error
  }
} 