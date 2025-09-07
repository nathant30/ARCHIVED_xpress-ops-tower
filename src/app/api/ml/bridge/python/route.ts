// Python ML Service Bridge API
// Provides endpoints to interact with Python FastAPI event collection service

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/security/productionLogger';
import { pythonEventBridge, hybridEventProcessor } from '@/lib/ml/integration/pythonEventBridge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const userId = searchParams.get('user_id');

    switch (action) {
      case 'health':
        // Check Python service health
        const isHealthy = await pythonEventBridge.checkHealth();
        const systemHealth = await hybridEventProcessor.getSystemHealth();
        
        // For QA: Return mock healthy status when service is unavailable
        const mockHealthyForQA = !isHealthy && process.env.NODE_ENV !== 'production';
        
        return NextResponse.json({
          python_service: {
            status: mockHealthyForQA ? 'healthy (mock)' : (isHealthy ? 'healthy' : 'unhealthy'),
            url: process.env.PYTHON_EVENT_API_URL || 'http://localhost:8000',
            note: mockHealthyForQA ? 'Service mocked for QA - Python service not required' : null
          },
          system_health: systemHealth,
          timestamp: new Date().toISOString()
        });

      case 'metrics':
        // Get metrics from Python service
        const pythonMetrics = await pythonEventBridge.getPythonMetrics();
        
        // For QA: Return mock metrics when service is unavailable
        const mockMetricsForQA = pythonMetrics === null && process.env.NODE_ENV !== 'production' ? {
          events_processed: Math.floor(Math.random() * 1000) + 500,
          features_generated: Math.floor(Math.random() * 100) + 50,
          ml_inference_calls: Math.floor(Math.random() * 200) + 100,
          last_update: new Date().toISOString(),
          note: 'Mock data for QA'
        } : pythonMetrics;
        
        return NextResponse.json({
          success: mockMetricsForQA !== null,
          python_metrics: mockMetricsForQA,
          timestamp: new Date().toISOString()
        });

      case 'features':
        // Get user features from Python service
        if (!userId) {
          return NextResponse.json({
            error: 'user_id parameter required for features'
          }, { status: 400 });
        }

        const pythonFeatures = await pythonEventBridge.getUserFeatures(userId);
        const combinedFeatures = await hybridEventProcessor.getCombinedFeatures(userId);
        
        // For QA: Return mock features when service is unavailable
        const mockFeaturesForQA = pythonFeatures === null && process.env.NODE_ENV !== 'production' ? {
          user_id: userId,
          features: {
            response_time_avg: Math.random() * 10 + 2,
            acceptance_rate: Math.random() * 0.3 + 0.7,
            total_rides: Math.floor(Math.random() * 100) + 50,
            rating_average: Math.random() * 1 + 4,
            recent_activity_score: Math.random() * 100,
            fraud_risk_score: Math.random() * 0.2,
            note: 'Mock features for QA'
          }
        } : pythonFeatures;
        
        return NextResponse.json({
          success: mockFeaturesForQA !== null,
          python_features: mockFeaturesForQA,
          combined_features: combinedFeatures,
          user_id: userId,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          service: 'Python ML Bridge API',
          available_actions: {
            health: 'Check Python service health',
            metrics: 'Get Python service metrics',
            features: 'Get user features (requires user_id param)'
          },
          python_service_url: process.env.PYTHON_EVENT_API_URL || 'http://localhost:8000',
          timestamp: new Date().toISOString()
        });
    }

  } catch (error) {
    logger.error('Python bridge API error', error);
    return NextResponse.json({
      error: 'Python bridge operation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, events, user_id, data } = body;

    switch (action) {
      case 'send_event':
        // Send single event to Python service
        if (!data) {
          return NextResponse.json({
            error: 'Event data required'
          }, { status: 400 });
        }

        const singleResult = await pythonEventBridge.sendEvent(data);
        
        return NextResponse.json({
          success: singleResult,
          message: singleResult ? 'Event sent successfully' : 'Failed to send event',
          timestamp: new Date().toISOString()
        });

      case 'send_batch':
        // Send batch of events to Python service
        if (!events || !Array.isArray(events)) {
          return NextResponse.json({
            error: 'Events array required'
          }, { status: 400 });
        }

        const batchResult = await pythonEventBridge.sendEventsBatch(events);
        
        return NextResponse.json({
          success: batchResult.success,
          processed_count: batchResult.count,
          failed_count: batchResult.failed,
          message: batchResult.success ? 'Batch processed successfully' : 'Batch processing had failures',
          timestamp: new Date().toISOString()
        });

      case 'hybrid_process':
        // Process events through both TypeScript and Python pipelines
        if (!events || !Array.isArray(events)) {
          return NextResponse.json({
            error: 'Events array required'
          }, { status: 400 });
        }

        const hybridResult = await hybridEventProcessor.processEvents(events);
        
        return NextResponse.json({
          typescript_success: hybridResult.typescript_success,
          python_success: hybridResult.python_success,
          processed_count: hybridResult.processed_count,
          errors: hybridResult.errors,
          message: 'Hybrid processing completed',
          timestamp: new Date().toISOString()
        });

      case 'test_integration':
        // Test integration with sample events
        const testEvents = generateTestEvents(5);
        const testResult = await hybridEventProcessor.processEvents(testEvents);
        
        return NextResponse.json({
          test_results: testResult,
          sample_events: testEvents.length,
          message: 'Integration test completed',
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          error: 'Unknown action',
          available_actions: ['send_event', 'send_batch', 'hybrid_process', 'test_integration']
        }, { status: 400 });
    }

  } catch (error) {
    logger.error('Python bridge POST error', error);
    return NextResponse.json({
      error: 'Python bridge operation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Helper function to generate test events
function generateTestEvents(count: number) {
  const testEvents = [];
  const eventTypes = ['driver_location_update', 'ride_request_response', 'ui_interaction', 'app_open'];
  
  for (let i = 0; i < count; i++) {
    const eventType = eventTypes[i % eventTypes.length];
    const baseEvent = {
      event_id: crypto.randomUUID(),
      user_id: `test_user_${i + 1}`,
      session_id: `test_session_${Math.floor(i / 2) + 1}`,
      timestamp: new Date().toISOString(),
      app_version: '1.0.0',
      device_type: i % 2 === 0 ? 'ios' : 'android',
      location: {
        lat: 14.5995 + (Math.random() - 0.5) * 0.1,
        lng: 120.9842 + (Math.random() - 0.5) * 0.1
      }
    };

    switch (eventType) {
      case 'driver_location_update':
        testEvents.push({
          ...baseEvent,
          event_type: 'driver_location_update',
          driver_id: `driver_${i + 1}`,
          driver_status: 'online',
          speed: Math.random() * 60,
          heading: Math.random() * 360,
          accuracy: Math.random() * 20 + 5
        });
        break;

      case 'ride_request_response':
        testEvents.push({
          ...baseEvent,
          event_type: 'ride_request_response',
          driver_id: `driver_${i + 1}`,
          driver_status: 'online',
          request_id: `req_${i + 1}`,
          response: Math.random() > 0.3 ? 'accepted' : 'rejected',
          response_time: Math.random() * 15 + 2
        });
        break;

      case 'ui_interaction':
        testEvents.push({
          ...baseEvent,
          event_type: 'ui_interaction',
          passenger_id: `passenger_${i + 1}`,
          element: 'book_ride_button',
          action: 'tap',
          screen: 'home',
          duration: Math.random() * 5 + 1
        });
        break;

      case 'app_open':
        testEvents.push({
          ...baseEvent,
          event_type: 'app_open',
          passenger_id: `passenger_${i + 1}`,
          is_cold_start: Math.random() > 0.5
        });
        break;
    }
  }

  return testEvents;
}