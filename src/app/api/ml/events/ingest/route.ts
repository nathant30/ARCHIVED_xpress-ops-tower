// ML Event Ingestion API
// High-throughput event streaming endpoint for real-time ML pipeline

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/security/productionLogger';
import { MLEvent, isValidEvent, EventFactory } from '@/lib/ml/events/eventSchemas';
import { EventStreamProcessor } from '@/lib/ml/streaming/eventStreamProcessor';
import { FeaturePipeline } from '@/lib/ml/features/featurePipeline';
import { pythonEventBridge, hybridEventProcessor } from '@/lib/ml/integration/pythonEventBridge';
import { Redis } from 'ioredis';

// Initialize Redis for event queue
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
});

const eventProcessor = new EventStreamProcessor();
const featurePipeline = new FeaturePipeline();

interface BatchEventRequest {
  events: MLEvent[];
  source: string;
  batch_id?: string;
}

interface EventMetrics {
  ingested: number;
  processed: number;
  failed: number;
  latency_ms: number;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let metrics: EventMetrics = {
    ingested: 0,
    processed: 0,
    failed: 0,
    latency_ms: 0
  };

  try {
    const body = await request.json();
    const { events, source, batch_id } = body as BatchEventRequest;

    if (!events || !Array.isArray(events)) {
      return NextResponse.json({
        error: 'Invalid request: events array required',
        metrics
      }, { status: 400 });
    }

    if (events.length === 0) {
      return NextResponse.json({
        error: 'Invalid request: events array cannot be empty',
        metrics
      }, { status: 400 });
    }

    if (events.length > 1000) {
      return NextResponse.json({
        error: 'Invalid request: batch size cannot exceed 1000 events',
        metrics
      }, { status: 400 });
    }

    metrics.ingested = events.length;

    // Validate and process events
    const validEvents: MLEvent[] = [];
    const invalidEvents: any[] = [];

    for (const event of events) {
      if (isValidEvent(event)) {
        // Ensure event has required fields
        const processedEvent = {
          ...event,
          event_id: event.event_id || crypto.randomUUID(),
          timestamp: event.timestamp || new Date().toISOString(),
          source: source || 'unknown',
          batch_id: batch_id || crypto.randomUUID(),
          ingested_at: new Date().toISOString()
        };
        validEvents.push(processedEvent);
      } else {
        invalidEvents.push({
          event: event,
          reason: 'Invalid event schema'
        });
      }
    }

    if (validEvents.length === 0) {
      return NextResponse.json({
        error: 'No valid events in batch',
        invalid_events: invalidEvents,
        metrics
      }, { status: 400 });
    }

    // Process events in parallel streams
    const processingPromises = [
      // Stream 1: Real-time feature extraction
      processFeatureExtraction(validEvents),
      // Stream 2: Event storage and indexing  
      processEventStorage(validEvents),
      // Stream 3: Real-time aggregations
      processRealtimeAggregations(validEvents),
      // Stream 4: ML model inference (fraud detection, demand prediction)
      processMLInference(validEvents),
      // Stream 5: Python FastAPI bridge (hybrid processing)
      processPythonBridge(validEvents)
    ];

    const results = await Promise.allSettled(processingPromises);
    
    // Count successful processing
    metrics.processed = results.filter(r => r.status === 'fulfilled').length * validEvents.length;
    metrics.failed = results.filter(r => r.status === 'rejected').length * validEvents.length;
    metrics.latency_ms = Date.now() - startTime;

    // Log processing results
    logger.info('ML Events Processed', {
      batch_size: validEvents.length,
      source: source,
      processing_time_ms: metrics.latency_ms,
      successful_streams: results.filter(r => r.status === 'fulfilled').length,
      failed_streams: results.filter(r => r.status === 'rejected').length
    });

    // Return processing results
    return NextResponse.json({
      success: true,
      message: `Processed ${validEvents.length} events successfully`,
      metrics: {
        ...metrics,
        events_per_second: Math.round((validEvents.length / metrics.latency_ms) * 1000)
      },
      batch_info: {
        batch_id: batch_id || crypto.randomUUID(),
        valid_events: validEvents.length,
        invalid_events: invalidEvents.length,
        processing_streams: results.length
      },
      invalid_events: invalidEvents.length > 0 ? invalidEvents : undefined
    });

  } catch (error) {
    metrics.latency_ms = Date.now() - startTime;
    logger.error('ML Event Ingestion Error', {
      error: error instanceof Error ? error.message : error,
      metrics
    });

    return NextResponse.json({
      error: 'Failed to process events',
      details: error instanceof Error ? error.message : 'Unknown error',
      metrics
    }, { status: 500 });
  }
}

// Stream 1: Feature Extraction Pipeline
async function processFeatureExtraction(events: MLEvent[]): Promise<void> {
  const features = await featurePipeline.extractFeatures(events);
  
  // Store features in Redis for real-time access
  const pipeline = redis.pipeline();
  
  for (const feature of features) {
    const key = `ml:features:${feature.user_id}:${feature.feature_type}`;
    pipeline.setex(key, 3600, JSON.stringify(feature)); // 1 hour TTL
  }
  
  await pipeline.exec();
  
  // Also stream to feature store
  await featurePipeline.streamToFeatureStore(features);
}

// Stream 2: Event Storage and Indexing
async function processEventStorage(events: MLEvent[]): Promise<void> {
  // Store raw events for replay and audit
  const pipeline = redis.pipeline();
  
  for (const event of events) {
    // Store in time-series format for efficient querying
    const timeKey = new Date(event.timestamp).toISOString().slice(0, 13); // Hour precision
    const eventKey = `ml:events:${event.event_type}:${timeKey}`;
    
    pipeline.lpush(eventKey, JSON.stringify(event));
    pipeline.expire(eventKey, 86400 * 7); // 7 days retention
    
    // Index by user for quick lookup
    const userKey = `ml:events:user:${event.user_id}`;
    pipeline.lpush(userKey, JSON.stringify({ 
      event_id: event.event_id, 
      event_type: event.event_type, 
      timestamp: event.timestamp 
    }));
    pipeline.expire(userKey, 86400 * 30); // 30 days retention
  }
  
  await pipeline.exec();
}

// Stream 3: Real-time Aggregations
async function processRealtimeAggregations(events: MLEvent[]): Promise<void> {
  const aggregations = eventProcessor.generateAggregations(events);
  
  // Update real-time counters
  const pipeline = redis.pipeline();
  
  for (const agg of aggregations) {
    const key = `ml:agg:${agg.type}:${agg.window}`;
    pipeline.hincrby(key, agg.dimension, agg.value);
    pipeline.expire(key, agg.ttl);
  }
  
  await pipeline.exec();
  
  // Publish aggregation updates for dashboard
  await redis.publish('ml:aggregations', JSON.stringify({
    timestamp: new Date().toISOString(),
    aggregations: aggregations
  }));
}

// Stream 4: ML Model Inference
async function processMLInference(events: MLEvent[]): Promise<void> {
  // Extract events that need ML inference
  const inferenceEvents = events.filter(event => 
    event.event_type === 'ride_request_received' ||
    event.event_type === 'ride_request_response' ||
    event.event_type === 'ui_interaction'
  );

  if (inferenceEvents.length === 0) return;

  // Queue for ML inference
  const pipeline = redis.pipeline();
  
  for (const event of inferenceEvents) {
    pipeline.lpush('ml:inference:queue', JSON.stringify({
      event_id: event.event_id,
      event_type: event.event_type,
      user_id: event.user_id,
      timestamp: event.timestamp,
      payload: event,
      queued_at: new Date().toISOString()
    }));
  }
  
  await pipeline.exec();
  
  // Notify inference workers
  await redis.publish('ml:inference:new_batch', JSON.stringify({
    batch_size: inferenceEvents.length,
    timestamp: new Date().toISOString()
  }));
}

// Health check endpoint
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const check = searchParams.get('check');

    if (check === 'health') {
      // Check Redis connectivity
      const redisOk = await redis.ping() === 'PONG';
      
      // Check queue lengths
      const queueLengths = await Promise.all([
        redis.llen('ml:inference:queue'),
        redis.llen('ml:features:queue'),
        redis.llen('ml:aggregations:queue')
      ]);

      const status = {
        status: redisOk ? 'healthy' : 'unhealthy',
        components: {
          redis: redisOk ? 'ok' : 'error',
          inference_queue: queueLengths[0],
          features_queue: queueLengths[1],
          aggregations_queue: queueLengths[2]
        },
        timestamp: new Date().toISOString()
      };

      return NextResponse.json(status, { 
        status: redisOk ? 200 : 503 
      });
    }

    if (check === 'metrics') {
      // Get processing metrics from Redis
      const metrics = await getProcessingMetrics();
      return NextResponse.json(metrics);
    }

    return NextResponse.json({
      service: 'ML Event Ingestion API',
      status: 'running',
      endpoints: {
        'POST /': 'Ingest ML events',
        'GET /?check=health': 'Health check',
        'GET /?check=metrics': 'Processing metrics'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Health check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function getProcessingMetrics() {
  const now = new Date();
  const hourKey = now.toISOString().slice(0, 13);
  const dayKey = now.toISOString().slice(0, 10);

  const [hourlyEvents, dailyEvents, queueLengths] = await Promise.all([
    redis.get(`ml:metrics:hourly:${hourKey}`),
    redis.get(`ml:metrics:daily:${dayKey}`),
    Promise.all([
      redis.llen('ml:inference:queue'),
      redis.llen('ml:features:queue'),
      redis.llen('ml:aggregations:queue')
    ])
  ]);

  return {
    processing: {
      events_this_hour: parseInt(hourlyEvents || '0'),
      events_today: parseInt(dailyEvents || '0'),
      queue_lengths: {
        inference: queueLengths[0],
        features: queueLengths[1],
        aggregations: queueLengths[2]
      }
    },
    timestamp: new Date().toISOString()
  };
}

// Stream 5: Python FastAPI Bridge
async function processPythonBridge(events: MLEvent[]): Promise<void> {
  try {
    // Send events to Python FastAPI service for additional processing
    const result = await pythonEventBridge.sendEventsBatch(events);
    
    if (result.success) {
      logger.info('Events sent to Python service', { 
        count: result.count,
        total: events.length 
      });
    } else {
      logger.warn('Python service processing failed', { 
        failed_count: result.failed,
        total: events.length 
      });
    }
  } catch (error) {
    logger.error('Python bridge processing error', error);
    // Don't throw - this is a secondary processing stream
  }
}