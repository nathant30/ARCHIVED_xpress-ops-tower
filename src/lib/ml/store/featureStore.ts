// Feature Store
// Centralized feature management for ML pipeline with offline/online serving

import { Redis } from 'ioredis';
import { logger } from '@/lib/security/productionLogger';
import { FeatureVector } from '@/lib/ml/features/featurePipeline';

export interface FeatureGroup {
  name: string;
  description: string;
  features: string[];
  entity_key: string; // user_id, driver_id, etc.
  refresh_interval: number; // seconds
  retention_days: number;
  tags: string[];
}

export interface FeatureService {
  name: string;
  feature_groups: string[];
  model_name: string;
  version: string;
  serving_endpoint: string;
  freshness_sla: number; // maximum staleness in seconds
}

export interface FeatureRequest {
  entities: string[]; // list of entity IDs
  features: string[]; // list of feature names
  point_in_time?: string; // for historical point-in-time lookups
}

export interface FeatureResponse {
  entity_id: string;
  features: Record<string, number | string | boolean>;
  feature_timestamp: Record<string, string>;
  freshness_score: number;
}

export interface FeatureStoreConfig {
  redis_url: string;
  postgres_url?: string; // for offline store
  enable_monitoring: boolean;
  cache_ttl: number;
  batch_size: number;
}

export class FeatureStore {
  private redis: Redis;
  private featureGroups: Map<string, FeatureGroup> = new Map();
  private featureServices: Map<string, FeatureService> = new Map();
  private config: FeatureStoreConfig;

  constructor(config: FeatureStoreConfig) {
    this.config = config;
    this.redis = new Redis(config.redis_url);
    this.initializeFeatureGroups();
  }

  // Feature group management
  public registerFeatureGroup(group: FeatureGroup): void {
    this.featureGroups.set(group.name, group);
    logger.info('Feature group registered', { 
      name: group.name, 
      features: group.features.length 
    });
  }

  public registerFeatureService(service: FeatureService): void {
    this.featureServices.set(service.name, service);
    logger.info('Feature service registered', { 
      name: service.name, 
      model: service.model_name 
    });
  }

  // Online serving (real-time)
  public async getOnlineFeatures(request: FeatureRequest): Promise<FeatureResponse[]> {
    const responses: FeatureResponse[] = [];
    const pipeline = this.redis.pipeline();

    // Build Redis keys for each entity
    const redisKeys: string[] = [];
    for (const entityId of request.entities) {
      for (const featureName of request.features) {
        const key = this.buildFeatureKey(featureName, entityId);
        redisKeys.push(key);
        pipeline.hgetall(key);
      }
    }

    const results = await pipeline.exec();
    
    // Process results for each entity
    for (let i = 0; i < request.entities.length; i++) {
      const entityId = request.entities[i];
      const entityFeatures: Record<string, any> = {};
      const featureTimestamps: Record<string, string> = {};
      let freshnessScore = 1.0;

      // Extract features for this entity
      const startIndex = i * request.features.length;
      for (let j = 0; j < request.features.length; j++) {
        const resultIndex = startIndex + j;
        const result = results?.[resultIndex];
        
        if (result && result[1]) {
          const featureData = result[1] as Record<string, string>;
          const featureName = request.features[j];
          
          if (featureData.value !== undefined) {
            entityFeatures[featureName] = this.parseFeatureValue(featureData.value);
            featureTimestamps[featureName] = featureData.timestamp || new Date().toISOString();
            
            // Calculate freshness
            const featureAge = Date.now() - new Date(featureTimestamps[featureName]).getTime();
            const staleness = featureAge / 1000; // seconds
            freshnessScore = Math.min(freshnessScore, Math.max(0, 1 - (staleness / 3600))); // Decay over 1 hour
          }
        }
      }

      responses.push({
        entity_id: entityId,
        features: entityFeatures,
        feature_timestamp: featureTimestamps,
        freshness_score: freshnessScore
      });
    }

    return responses;
  }

  // Batch writing features
  public async writeFeatures(features: FeatureVector[]): Promise<void> {
    const pipeline = this.redis.pipeline();
    const now = new Date().toISOString();

    for (const feature of features) {
      const entityId = feature.user_id;
      
      // Write individual features
      for (const [featureName, featureValue] of Object.entries(feature.features)) {
        const key = this.buildFeatureKey(featureName, entityId);
        
        pipeline.hmset(key, {
          value: featureValue.toString(),
          timestamp: feature.computed_at,
          feature_type: feature.feature_type,
          valid_until: feature.valid_until
        });

        // Set expiration based on feature group configuration
        const featureGroup = this.findFeatureGroup(featureName);
        if (featureGroup) {
          pipeline.expire(key, featureGroup.retention_days * 86400);
        } else {
          pipeline.expire(key, 86400 * 7); // Default 7 days
        }
      }

      // Update feature group metadata
      const groupKey = `feature_group:${feature.feature_type}:${entityId}`;
      pipeline.hmset(groupKey, {
        last_update: feature.computed_at,
        feature_count: Object.keys(feature.features).length,
        entity_id: entityId
      });
      pipeline.expire(groupKey, 86400 * 30);
    }

    await pipeline.exec();
    
    // Update monitoring metrics
    await this.updateWriteMetrics(features.length);
    
    logger.info('Features written to store', { 
      count: features.length,
      unique_entities: new Set(features.map(f => f.user_id)).size
    });
  }

  // Feature discovery and metadata
  public async getFeatureGroupMetadata(groupName: string): Promise<FeatureGroup | null> {
    return this.featureGroups.get(groupName) || null;
  }

  public async listFeatureGroups(): Promise<FeatureGroup[]> {
    return Array.from(this.featureGroups.values());
  }

  public async getFeatureStatistics(featureName: string, entityCount: number = 1000): Promise<{
    mean: number;
    std: number;
    min: number;
    max: number;
    missing_rate: number;
    sample_count: number;
  }> {
    // Sample entities to calculate statistics
    const sampleKeys = await this.redis.randomkey();
    const pipeline = this.redis.pipeline();
    
    // Get sample of feature values
    for (let i = 0; i < Math.min(entityCount, 1000); i++) {
      const randomEntity = `sample_${i}`;
      const key = this.buildFeatureKey(featureName, randomEntity);
      pipeline.hget(key, 'value');
    }

    const results = await pipeline.exec();
    const values: number[] = [];
    
    results?.forEach(result => {
      if (result && result[1] && typeof result[1] === 'string') {
        const value = parseFloat(result[1]);
        if (!isNaN(value)) {
          values.push(value);
        }
      }
    });

    if (values.length === 0) {
      return {
        mean: 0, std: 0, min: 0, max: 0, 
        missing_rate: 1, sample_count: 0
      };
    }

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const std = Math.sqrt(variance);

    return {
      mean,
      std,
      min: Math.min(...values),
      max: Math.max(...values),
      missing_rate: 1 - (values.length / entityCount),
      sample_count: values.length
    };
  }

  // Real-time feature monitoring
  public async getFeatureFreshness(featureName: string, entityId: string): Promise<{
    age_seconds: number;
    is_stale: boolean;
    last_updated: string;
  }> {
    const key = this.buildFeatureKey(featureName, entityId);
    const timestamp = await this.redis.hget(key, 'timestamp');
    
    if (!timestamp) {
      return {
        age_seconds: Infinity,
        is_stale: true,
        last_updated: 'never'
      };
    }

    const ageMs = Date.now() - new Date(timestamp).getTime();
    const ageSeconds = ageMs / 1000;
    const featureGroup = this.findFeatureGroup(featureName);
    const maxAge = featureGroup ? featureGroup.refresh_interval : 3600;

    return {
      age_seconds: ageSeconds,
      is_stale: ageSeconds > maxAge,
      last_updated: timestamp
    };
  }

  // Feature lineage and versioning
  public async getFeatureLineage(featureName: string): Promise<{
    upstream_features: string[];
    downstream_models: string[];
    computation_graph: any;
  }> {
    // In production, this would track feature dependencies
    return {
      upstream_features: [],
      downstream_models: this.getModelsUsingFeature(featureName),
      computation_graph: {}
    };
  }

  // A/B testing support
  public async getFeatureVariant(featureName: string, entityId: string, experimentId?: string): Promise<{
    variant: string;
    feature_value: any;
    experiment_context: any;
  }> {
    if (!experimentId) {
      // Return standard feature
      const response = await this.getOnlineFeatures({
        entities: [entityId],
        features: [featureName]
      });
      
      return {
        variant: 'control',
        feature_value: response[0]?.features[featureName],
        experiment_context: null
      };
    }

    // Check experiment assignment
    const assignmentKey = `experiment:${experimentId}:${entityId}`;
    const assignment = await this.redis.get(assignmentKey);
    
    return {
      variant: assignment || 'control',
      feature_value: null, // Would fetch variant-specific feature
      experiment_context: { experiment_id: experimentId }
    };
  }

  // Performance and monitoring
  public async getStoreMetrics(): Promise<{
    feature_groups_count: number;
    active_entities: number;
    features_served_per_hour: number;
    average_serving_latency_ms: number;
    cache_hit_rate: number;
    storage_size_gb: number;
  }> {
    // Get basic counts
    const groupsCount = this.featureGroups.size;
    const activeEntities = await this.redis.get('metrics:active_entities') || '0';
    const featuresServed = await this.redis.get('metrics:features_served_hour') || '0';
    
    return {
      feature_groups_count: groupsCount,
      active_entities: parseInt(activeEntities),
      features_served_per_hour: parseInt(featuresServed),
      average_serving_latency_ms: 15, // Mock value
      cache_hit_rate: 0.94, // Mock value
      storage_size_gb: 12.5 // Mock value
    };
  }

  // Data quality monitoring
  public async validateFeatureQuality(featureName: string): Promise<{
    quality_score: number;
    issues: string[];
    recommendations: string[];
  }> {
    const stats = await this.getFeatureStatistics(featureName);
    const freshness = await this.getFeatureFreshness(featureName, 'sample_entity');
    
    let qualityScore = 1.0;
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check missing values
    if (stats.missing_rate > 0.1) {
      qualityScore -= 0.3;
      issues.push(`High missing rate: ${(stats.missing_rate * 100).toFixed(1)}%`);
      recommendations.push('Investigate data pipeline for missing values');
    }

    // Check staleness
    if (freshness.is_stale) {
      qualityScore -= 0.4;
      issues.push(`Stale data: last updated ${freshness.age_seconds} seconds ago`);
      recommendations.push('Check feature computation pipeline');
    }

    // Check for outliers (simplified)
    if (stats.std > stats.mean * 3) {
      qualityScore -= 0.2;
      issues.push('High variance detected - possible outliers');
      recommendations.push('Review feature engineering logic');
    }

    return {
      quality_score: Math.max(0, qualityScore),
      issues,
      recommendations
    };
  }

  // Private helper methods

  private initializeFeatureGroups(): void {
    // Register core feature groups
    this.registerFeatureGroup({
      name: 'driver_behavior',
      description: 'Real-time driver behavior metrics',
      features: [
        'acceptance_rate_1h', 'acceptance_rate_24h', 'avg_response_time_1h',
        'locations_per_hour', 'avg_speed_1h', 'distance_traveled_1h',
        'idle_time_ratio', 'rejection_rate_surge', 'earnings_efficiency'
      ],
      entity_key: 'driver_id',
      refresh_interval: 300, // 5 minutes
      retention_days: 30,
      tags: ['driver', 'behavior', 'real_time']
    });

    this.registerFeatureGroup({
      name: 'passenger_engagement',
      description: 'Passenger app usage and engagement patterns',
      features: [
        'session_duration_avg', 'interactions_per_minute', 'search_to_book_ratio',
        'screen_switching_frequency', 'booking_cancellation_rate',
        'payment_method_changes', 'location_search_patterns'
      ],
      entity_key: 'passenger_id',
      refresh_interval: 600, // 10 minutes
      retention_days: 30,
      tags: ['passenger', 'engagement', 'ux']
    });

    this.registerFeatureGroup({
      name: 'contextual',
      description: 'Environmental and contextual features',
      features: [
        'current_hour', 'is_weekend', 'is_holiday', 'weather_score',
        'traffic_density', 'event_proximity', 'surge_level_area',
        'competitor_density', 'regional_demand_score'
      ],
      entity_key: 'location',
      refresh_interval: 900, // 15 minutes
      retention_days: 7,
      tags: ['context', 'environment', 'external']
    });

    this.registerFeatureGroup({
      name: 'risk_signals',
      description: 'Fraud and risk detection features',
      features: [
        'velocity_anomaly_score', 'location_spoofing_risk', 'behavioral_consistency',
        'device_fingerprint_risk', 'transaction_pattern_risk', 
        'time_pattern_anomaly', 'geo_risk_score'
      ],
      entity_key: 'user_id',
      refresh_interval: 180, // 3 minutes
      retention_days: 90,
      tags: ['risk', 'fraud', 'security']
    });

    // Register feature services
    this.registerFeatureService({
      name: 'fraud_detection',
      feature_groups: ['driver_behavior', 'risk_signals', 'contextual'],
      model_name: 'fraud_detection_v2',
      version: '2.1.0',
      serving_endpoint: '/api/ml/inference/fraud',
      freshness_sla: 300 // 5 minutes max staleness
    });

    this.registerFeatureService({
      name: 'demand_prediction',
      feature_groups: ['contextual', 'passenger_engagement'],
      model_name: 'demand_prediction_v1',
      version: '1.3.0',
      serving_endpoint: '/api/ml/inference/demand',
      freshness_sla: 900 // 15 minutes max staleness
    });
  }

  private buildFeatureKey(featureName: string, entityId: string): string {
    return `feature:${featureName}:${entityId}`;
  }

  private findFeatureGroup(featureName: string): FeatureGroup | undefined {
    for (const group of this.featureGroups.values()) {
      if (group.features.includes(featureName)) {
        return group;
      }
    }
    return undefined;
  }

  private parseFeatureValue(value: string): number | string | boolean {
    // Try to parse as number
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      return numValue;
    }

    // Try to parse as boolean
    if (value === 'true') return true;
    if (value === 'false') return false;

    // Return as string
    return value;
  }

  private getModelsUsingFeature(featureName: string): string[] {
    const models: string[] = [];
    for (const service of this.featureServices.values()) {
      for (const groupName of service.feature_groups) {
        const group = this.featureGroups.get(groupName);
        if (group?.features.includes(featureName)) {
          models.push(service.model_name);
          break;
        }
      }
    }
    return models;
  }

  private async updateWriteMetrics(count: number): Promise<void> {
    const hour = new Date().toISOString().slice(0, 13);
    await this.redis.incrby(`metrics:features_written:${hour}`, count);
    await this.redis.expire(`metrics:features_written:${hour}`, 86400);
  }
}