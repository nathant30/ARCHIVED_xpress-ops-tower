// Python Event API Bridge
// Connects TypeScript ML infrastructure with Python FastAPI event collection service

import { MLEvent } from '@/lib/ml/events/eventSchemas';
import { logger } from '@/lib/security/productionLogger';
import axios, { AxiosInstance } from 'axios';

export interface PythonEventData {
  event_type: string;
  user_id: string;
  session_id: string;
  timestamp: string;
  app_version: string;
  device_type: string;
  location?: { [key: string]: number };
  data: { [key: string]: any };
}

export interface PythonBatchEvents {
  events: PythonEventData[];
}

export interface PythonFeatures {
  user_id: string;
  features: { [key: string]: any };
}

export interface PythonMetrics {
  metrics: { [key: string]: number };
  timestamp: string;
}

export class PythonEventBridge {
  private pythonAPI: AxiosInstance;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private isHealthy: boolean = false;

  constructor(
    private pythonServiceUrl: string = process.env.PYTHON_EVENT_API_URL || 'http://localhost:8000'
  ) {
    this.pythonAPI = axios.create({
      baseURL: pythonServiceUrl,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.startHealthCheck();
  }

  // Convert TypeScript ML events to Python format
  public convertTSEventToPython(event: MLEvent): PythonEventData {
    return {
      event_type: event.event_type,
      user_id: event.user_id,
      session_id: event.session_id,
      timestamp: event.timestamp,
      app_version: event.app_version,
      device_type: event.device_type,
      location: event.location || undefined,
      data: this.extractEventData(event)
    };
  }

  // Send single event to Python service
  public async sendEvent(event: MLEvent): Promise<boolean> {
    if (!this.isHealthy) {
      logger.warn('Python service not healthy, skipping event send');
      return false;
    }

    try {
      const pythonEvent = this.convertTSEventToPython(event);
      const response = await this.pythonAPI.post('/events', pythonEvent);
      
      logger.debug('Event sent to Python service', {
        event_id: response.data.event_id,
        event_type: event.event_type
      });

      return response.status === 200;
    } catch (error) {
      logger.error('Failed to send event to Python service', {
        error: error instanceof Error ? error.message : error,
        event_type: event.event_type
      });
      return false;
    }
  }

  // Send batch of events to Python service
  public async sendEventsBatch(events: MLEvent[]): Promise<{
    success: boolean;
    count: number;
    failed: number;
  }> {
    if (!this.isHealthy) {
      logger.warn('Python service not healthy, skipping batch send');
      return { success: false, count: 0, failed: events.length };
    }

    try {
      const pythonEvents = events.map(event => this.convertTSEventToPython(event));
      const batchData: PythonBatchEvents = { events: pythonEvents };
      
      const response = await this.pythonAPI.post('/events/batch', batchData);
      
      logger.info('Event batch sent to Python service', {
        count: response.data.count,
        total_events: events.length
      });

      return {
        success: response.status === 200,
        count: response.data.count,
        failed: 0
      };
    } catch (error) {
      logger.error('Failed to send event batch to Python service', {
        error: error instanceof Error ? error.message : error,
        batch_size: events.length
      });
      
      return {
        success: false,
        count: 0,
        failed: events.length
      };
    }
  }

  // Get user features from Python service
  public async getUserFeatures(userId: string): Promise<PythonFeatures | null> {
    if (!this.isHealthy) {
      logger.warn('Python service not healthy, skipping feature fetch');
      return null;
    }

    try {
      const response = await this.pythonAPI.get(`/features/${userId}`);
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch user features from Python service', {
        error: error instanceof Error ? error.message : error,
        user_id: userId
      });
      return null;
    }
  }

  // Get metrics from Python service
  public async getPythonMetrics(): Promise<PythonMetrics | null> {
    if (!this.isHealthy) {
      return null;
    }

    try {
      const response = await this.pythonAPI.get('/metrics');
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch metrics from Python service', error);
      return null;
    }
  }

  // Check if Python service is healthy
  public async checkHealth(): Promise<boolean> {
    try {
      const response = await this.pythonAPI.get('/health');
      this.isHealthy = response.data.status === 'healthy';
      return this.isHealthy;
    } catch (error) {
      this.isHealthy = false;
      logger.debug('Python service health check failed', error);
      return false;
    }
  }

  // Get service health status
  public isServiceHealthy(): boolean {
    return this.isHealthy;
  }

  // Start continuous health monitoring
  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.checkHealth();
    }, 30000); // Check every 30 seconds

    // Initial health check
    this.checkHealth();
  }

  // Stop health monitoring
  public stopHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  // Extract event-specific data based on event type
  private extractEventData(event: MLEvent): { [key: string]: any } {
    const data: { [key: string]: any } = {};

    switch (event.event_type) {
      case 'ride_request_received':
        if ('pickup_location' in event) {
          data.pickup_location = event.pickup_location;
          data.dropoff_location = event.dropoff_location;
          data.estimated_duration = event.estimated_duration;
          data.estimated_distance = event.estimated_distance;
          data.surge_multiplier = event.surge_multiplier;
          data.request_id = event.request_id;
        }
        break;

      case 'ride_request_response':
        if ('response' in event) {
          data.response = event.response;
          data.response_time = event.response_time;
          data.request_id = event.request_id;
          if (event.rejection_reason) {
            data.rejection_reason = event.rejection_reason;
          }
        }
        break;

      case 'driver_location_update':
        if ('speed' in event) {
          data.speed = event.speed;
          data.heading = event.heading;
          data.accuracy = event.accuracy;
          data.driver_status = event.driver_status;
          if (event.vehicle_id) {
            data.vehicle_id = event.vehicle_id;
          }
        }
        break;

      case 'ui_interaction':
        if ('element' in event) {
          data.element = event.element;
          data.action = event.action;
          data.screen = event.screen;
          data.duration = event.duration;
        }
        break;

      case 'search_location':
        if ('query' in event) {
          data.query = event.query;
          data.search_type = event.search_type;
          data.results_count = event.results_count;
          if (event.selected_result_index !== undefined) {
            data.selected_result_index = event.selected_result_index;
          }
        }
        break;

      case 'ride_booking_started':
        if ('pickup_location' in event) {
          data.pickup_location = event.pickup_location;
          data.dropoff_location = event.dropoff_location;
        }
        break;

      case 'app_open':
        if ('is_cold_start' in event) {
          data.is_cold_start = event.is_cold_start;
        }
        break;

      case 'matching_event':
        if ('match_score' in event) {
          data.match_score = event.match_score;
          data.match_factors = event.match_factors;
          data.request_id = event.request_id;
          data.driver_id = event.driver_id;
          data.passenger_id = event.passenger_id;
        }
        break;

      default:
        // For any custom event types, include all non-standard properties
        Object.keys(event).forEach(key => {
          if (!['event_id', 'user_id', 'session_id', 'timestamp', 'app_version', 'device_type', 'location', 'event_type'].includes(key)) {
            data[key] = (event as any)[key];
          }
        });
    }

    return data;
  }
}

// Hybrid Event Processor - uses both TS and Python processing
export class HybridEventProcessor {
  private pythonBridge: PythonEventBridge;

  constructor(pythonServiceUrl?: string) {
    this.pythonBridge = new PythonEventBridge(pythonServiceUrl);
  }

  // Process events through both TypeScript and Python pipelines
  public async processEvents(events: MLEvent[]): Promise<{
    typescript_success: boolean;
    python_success: boolean;
    processed_count: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let typescriptSuccess = true;
    let pythonSuccess = true;

    try {
      // Process through TypeScript pipeline (existing infrastructure)
      logger.info('Processing events through TypeScript pipeline', { count: events.length });
      
      // This would call your existing TypeScript processing
      // const tsResult = await this.processWithTypeScript(events);
      
    } catch (error) {
      typescriptSuccess = false;
      errors.push(`TypeScript processing failed: ${error instanceof Error ? error.message : error}`);
    }

    try {
      // Process through Python pipeline
      if (this.pythonBridge.isServiceHealthy()) {
        logger.info('Processing events through Python pipeline', { count: events.length });
        
        const pythonResult = await this.pythonBridge.sendEventsBatch(events);
        pythonSuccess = pythonResult.success;
        
        if (!pythonResult.success) {
          errors.push(`Python processing failed: ${pythonResult.failed} events failed`);
        }
      } else {
        pythonSuccess = false;
        errors.push('Python service is not healthy');
      }
    } catch (error) {
      pythonSuccess = false;
      errors.push(`Python processing error: ${error instanceof Error ? error.message : error}`);
    }

    return {
      typescript_success: typescriptSuccess,
      python_success: pythonSuccess,
      processed_count: events.length,
      errors
    };
  }

  // Get combined features from both systems
  public async getCombinedFeatures(userId: string): Promise<{
    python_features?: any;
    typescript_features?: any;
    combined: any;
  }> {
    const result: any = { combined: {} };

    // Get Python features
    try {
      const pythonFeatures = await this.pythonBridge.getUserFeatures(userId);
      if (pythonFeatures) {
        result.python_features = pythonFeatures.features;
        Object.assign(result.combined, pythonFeatures.features);
      }
    } catch (error) {
      logger.warn('Failed to get Python features', { userId, error });
    }

    // Get TypeScript features (would integrate with your FeatureStore)
    try {
      // const tsFeatures = await this.getTypeScriptFeatures(userId);
      // result.typescript_features = tsFeatures;
      // Object.assign(result.combined, tsFeatures);
    } catch (error) {
      logger.warn('Failed to get TypeScript features', { userId, error });
    }

    return result;
  }

  // Get health status of both systems
  public async getSystemHealth(): Promise<{
    python_service: boolean;
    typescript_pipeline: boolean;
    overall_health: 'healthy' | 'partial' | 'unhealthy';
  }> {
    const pythonHealth = this.pythonBridge.isServiceHealthy();
    const typescriptHealth = true; // Would check your TS infrastructure health

    let overallHealth: 'healthy' | 'partial' | 'unhealthy';
    if (pythonHealth && typescriptHealth) {
      overallHealth = 'healthy';
    } else if (pythonHealth || typescriptHealth) {
      overallHealth = 'partial';
    } else {
      overallHealth = 'unhealthy';
    }

    return {
      python_service: pythonHealth,
      typescript_pipeline: typescriptHealth,
      overall_health: overallHealth
    };
  }

  // Cleanup resources
  public destroy(): void {
    this.pythonBridge.stopHealthCheck();
  }
}

// Export singleton instances
export const pythonEventBridge = new PythonEventBridge();
export const hybridEventProcessor = new HybridEventProcessor();