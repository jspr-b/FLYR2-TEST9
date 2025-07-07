export interface FlightState {
  flightStates: string[]
}

export interface AircraftType {
  iataMain: string
  iataSub: string
}

export interface Route {
  destinations: string[]
}

export interface Carrier {
  iataCode: string
  icaoCode: string
}

export interface Flight {
  flightName: string
  flightNumber: number
  flightDirection: 'D' | 'A'
  scheduleDateTime: string
  publicEstimatedOffBlockTime: string
  publicFlightState: FlightState
  aircraftType: AircraftType
  gate: string
  pier: string
  route: Route
  lastUpdatedAt: string
  // Operating carrier information
  mainFlight?: string
  prefixIATA?: string
  prefixICAO?: string
}

export interface FlightMetadata {
  totalCount: number
  lastUpdated: string
  date: string
}

export interface FlightResponse {
  flights: Flight[]
  metadata: FlightMetadata
} 