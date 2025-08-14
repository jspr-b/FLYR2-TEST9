import { NextRequest, NextResponse } from 'next/server'
import { getCachedMetrics, processGateMetrics, getProcessingStatus } from '@/lib/gate-metrics-service'

/**
 * Lightweight cached gate occupancy endpoint
 * Returns pre-computed metrics instantly or triggers background processing
 */
export async function GET(request: NextRequest) {
  try {
    // Check processing status
    const status = getProcessingStatus()
    
    // Try to get cached data first
    const cached = getCachedMetrics()
    
    if (cached) {
      console.log(`📦 Serving cached gate metrics (age: ${Date.now() - cached.timestamp}ms)`)
      
      return NextResponse.json({
        ...cached.data,
        _cache: {
          cached: true,
          age: Date.now() - cached.timestamp,
          processingTime: cached.processingTime
        }
      })
    }
    
    // If no cache and not processing, trigger background processing
    if (!status.isProcessing) {
      console.log('🔄 No cache available, triggering background processing...')
      
      // Start processing in background (non-blocking)
      processGateMetrics().catch(console.error)
      
      // Return a loading response with complete structure
      return NextResponse.json({
        gates: [],
        summary: {
          totalGates: 0,
          totalPiers: 0,
          activePiers: 0,
          activePiersList: [],
          statusBreakdown: {},
          averageUtilization: 0,
          delayedFlights: {
            totalDelayedFlights: 0,
            averageDelayMinutes: 0,
            totalDelayMinutes: 0,
            maxDelay: {
              minutes: 0,
              formatted: '0m',
              flight: null
            }
          },
          schipholContext: {
            totalSchipholGates: 223,
            totalSchipholPiers: 8,
            klmOperationalFootprint: 0,
            klmGatesUsedToday: 0,
            unusedSchipholGates: 223,
            pierUtilization: [],
            busiestPier: 'N/A',
            totalFlightsHandled: 0
          }
        },
        metadata: {
          status: 'processing',
          message: 'Gate metrics are being calculated. Please refresh in a few seconds.',
          lastUpdate: status.lastUpdate
        },
        _cache: {
          cached: false,
          processing: true
        }
      })
    }
    
    // If already processing, return status
    return NextResponse.json({
      gates: [],
      summary: {
        totalGates: 0,
        totalPiers: 0,
        activePiers: 0,
        activePiersList: [],
        statusBreakdown: {},
        averageUtilization: 0,
        delayedFlights: {
          totalDelayedFlights: 0,
          averageDelayMinutes: 0,
          totalDelayMinutes: 0,
          maxDelay: {
            minutes: 0,
            formatted: '0m',
            flight: null
          }
        },
        schipholContext: {
          totalSchipholGates: 223,
          totalSchipholPiers: 8,
          klmOperationalFootprint: 0,
          klmGatesUsedToday: 0,
          unusedSchipholGates: 223,
          pierUtilization: [],
          busiestPier: 'N/A',
          totalFlightsHandled: 0
        }
      },
      metadata: {
        status: 'processing',
        message: 'Gate metrics calculation in progress. Please wait...',
        lastUpdate: status.lastUpdate,
        lastError: status.lastError
      },
      _cache: {
        cached: false,
        processing: true
      }
    })
    
  } catch (error) {
    console.error('❌ Cached gate occupancy API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to retrieve gate metrics', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}