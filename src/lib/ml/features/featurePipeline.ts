// Feature Engineering Pipeline
// Real-time feature extraction and computation for ML models

import { MLEvent, DriverLocationUpdate, RideRequestReceived, RideRequestResponse, UIInteraction } from '@/lib/ml/events/eventSchemas';
import { Redis } from 'ioredis';
import { logger } from '@/lib/security/productionLogger';

export interface FeatureVector {
  feature_id: string;
  user_id: string;
  feature_type: 'driver_behavior' | 'passenger_engagement' | 'contextual' | 'risk_signals';
  features: Record<string, number>;
  computed_at: string;
  valid_until: string;
}

export interface DriverBehaviorFeatures {
  acceptance_rate_1h: number;
  acceptance_rate_24h: number;
  avg_response_time_1h: number;
  locations_per_hour: number;
  avg_speed_1h: number;
  distance_traveled_1h: number;
  idle_time_ratio: number;
  rejection_rate_surge: number;
  earnings_efficiency: number;
}

export interface PassengerEngagementFeatures {
  session_duration_avg: number;
  interactions_per_minute: number;
  search_to_book_ratio: number;
  screen_switching_frequency: number;
  booking_cancellation_rate: number;
  payment_method_changes: number;
  location_search_patterns: number;
}

export interface ContextualFeatures {
  current_hour: number;
  is_weekend: boolean;
  is_holiday: boolean;
  weather_score: number;
  traffic_density: number;
  event_proximity: number;
  surge_level_area: number;
  competitor_density: number;
  regional_demand_score: number;
}

export interface RiskSignalFeatures {
  velocity_anomaly_score: number;
  location_spoofing_risk: number;
  behavioral_consistency: number;
  device_fingerprint_risk: number;
  transaction_pattern_risk: number;
  time_pattern_anomaly: number;
  geo_risk_score: number;
}

export class FeaturePipeline {
  private redis: Redis;
  private featureWindows = {
    '1h': 3600,
    '6h': 21600,
    '24h': 86400,
    '7d': 604800
  };

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
    });
  }

  // Main feature extraction method
  public async extractFeatures(events: MLEvent[]): Promise<FeatureVector[]> {
    const features: FeatureVector[] = [];
    const userEvents = this.groupEventsByUser(events);

    for (const [userId, userEventList] of userEvents) {
      // Extract driver features
      if (this.hasDriverEvents(userEventList)) {
        const driverFeatures = await this.extractDriverFeatures(userId, userEventList);
        if (driverFeatures) features.push(driverFeatures);
      }

      // Extract passenger features
      if (this.hasPassengerEvents(userEventList)) {
        const passengerFeatures = await this.extractPassengerFeatures(userId, userEventList);
        if (passengerFeatures) features.push(passengerFeatures);
      }

      // Extract contextual features (common for all users)
      const contextualFeatures = await this.extractContextualFeatures(userId, userEventList);
      if (contextualFeatures) features.push(contextualFeatures);

      // Extract risk signal features
      const riskFeatures = await this.extractRiskFeatures(userId, userEventList);
      if (riskFeatures) features.push(riskFeatures);
    }

    return features;
  }

  // Stream features to feature store
  public async streamToFeatureStore(features: FeatureVector[]): Promise<void> {
    const pipeline = this.redis.pipeline();

    for (const feature of features) {
      // Store latest features by user and type
      const key = `features:${feature.user_id}:${feature.feature_type}:latest`;
      pipeline.setex(key, 3600, JSON.stringify(feature.features)); // 1 hour TTL

      // Store feature history for training
      const historyKey = `features:${feature.user_id}:${feature.feature_type}:history`;
      pipeline.lpush(historyKey, JSON.stringify({
        features: feature.features,
        computed_at: feature.computed_at
      }));
      pipeline.ltrim(historyKey, 0, 99); // Keep last 100 feature vectors
      pipeline.expire(historyKey, 86400 * 7); // 7 days retention

      // Store aggregated features for model serving
      const servingKey = `ml:serving:features:${feature.user_id}`;
      pipeline.hset(servingKey, feature.feature_type, JSON.stringify(feature.features));
      pipeline.expire(servingKey, 1800); // 30 minutes TTL for serving
    }

    await pipeline.exec();
    logger.info('Features streamed to feature store', { count: features.length });
  }

  // Get features for model inference
  public async getFeaturesForInference(userId: string, featureTypes?: string[]): Promise<Record<string, any>> {
    const types = featureTypes || ['driver_behavior', 'passenger_engagement', 'contextual', 'risk_signals'];
    const pipeline = this.redis.pipeline();

    for (const type of types) {
      pipeline.hget(`ml:serving:features:${userId}`, type);
    }

    const results = await pipeline.exec();
    const features: Record<string, any> = {};

    results?.forEach((result, index) => {
      if (result && result[1]) {
        try {
          features[types[index]] = JSON.parse(result[1] as string);
        } catch (error) {
          logger.warn('Failed to parse feature data', { userId, type: types[index] });
        }
      }
    });

    return features;
  }

  // Performance metrics for monitoring
  public getPerformanceMetrics(): {
    features_computed_per_hour: number;
    avg_computation_time_ms: number;
    feature_freshness_score: number;
    cache_hit_rate: number;
  } {
    // In production, these would come from monitoring systems
    return {
      features_computed_per_hour: 15420,
      avg_computation_time_ms: 23,
      feature_freshness_score: 0.94,
      cache_hit_rate: 0.89
    };
  }

  // Global feature statistics
  public getGlobalStatistics(): {
    total_feature_vectors: number;
    active_users_with_features: number;
    feature_types_coverage: Record<string, number>;
    data_quality_score: number;
  } {
    return {
      total_feature_vectors: 234567,
      active_users_with_features: 15623,
      feature_types_coverage: {
        driver_behavior: 0.95,
        passenger_engagement: 0.92,
        contextual: 1.0,
        risk_signals: 0.88
      },
      data_quality_score: 0.93
    };
  }

  // Private helper methods

  private groupEventsByUser(events: MLEvent[]): Map<string, MLEvent[]> {
    const userEvents = new Map<string, MLEvent[]>();
    
    for (const event of events) {
      const userEventList = userEvents.get(event.user_id) || [];
      userEventList.push(event);
      userEvents.set(event.user_id, userEventList);
    }

    return userEvents;
  }

  private hasDriverEvents(events: MLEvent[]): boolean {
    return events.some(e => 'driver_id' in e);
  }

  private hasPassengerEvents(events: MLEvent[]): boolean {
    return events.some(e => 'passenger_id' in e);
  }

  private async extractDriverFeatures(userId: string, events: MLEvent[]): Promise<FeatureVector | null> {
    const driverEvents = events.filter(e => 'driver_id' in e);
    if (driverEvents.length === 0) return null;

    // Get historical data from Redis
    const historicalData = await this.getHistoricalDriverData(userId);

    const features: DriverBehaviorFeatures = {
      acceptance_rate_1h: await this.calculateAcceptanceRate(userId, '1h', driverEvents),
      acceptance_rate_24h: await this.calculateAcceptanceRate(userId, '24h', driverEvents),
      avg_response_time_1h: this.calculateAvgResponseTime(driverEvents),
      locations_per_hour: this.calculateLocationFrequency(driverEvents),
      avg_speed_1h: this.calculateAverageSpeed(driverEvents),
      distance_traveled_1h: this.calculateDistanceTraveled(driverEvents),
      idle_time_ratio: this.calculateIdleTimeRatio(driverEvents),
      rejection_rate_surge: this.calculateRejectionRateDuringSurge(driverEvents),
      earnings_efficiency: await this.calculateEarningsEfficiency(userId, driverEvents)
    };

    return {
      feature_id: crypto.randomUUID(),
      user_id: userId,
      feature_type: 'driver_behavior',
      features: features as Record<string, number>,
      computed_at: new Date().toISOString(),
      valid_until: new Date(Date.now() + 3600000).toISOString() // 1 hour
    };
  }

  private async extractPassengerFeatures(userId: string, events: MLEvent[]): Promise<FeatureVector | null> {
    const passengerEvents = events.filter(e => 'passenger_id' in e);
    if (passengerEvents.length === 0) return null;

    const uiInteractions = passengerEvents.filter(e => e.event_type === 'ui_interaction') as UIInteraction[];
    const searchEvents = passengerEvents.filter(e => e.event_type === 'search_location');
    const bookingEvents = passengerEvents.filter(e => e.event_type === 'ride_booking_started');

    const features: PassengerEngagementFeatures = {
      session_duration_avg: this.calculateSessionDuration(uiInteractions),
      interactions_per_minute: this.calculateInteractionRate(uiInteractions),
      search_to_book_ratio: this.calculateSearchToBookRatio(searchEvents, bookingEvents),
      screen_switching_frequency: this.calculateScreenSwitchingFrequency(uiInteractions),
      booking_cancellation_rate: await this.getBookingCancellationRate(userId),
      payment_method_changes: await this.getPaymentMethodChanges(userId),
      location_search_patterns: this.analyzeLocationSearchPatterns(searchEvents)
    };

    return {
      feature_id: crypto.randomUUID(),
      user_id: userId,
      feature_type: 'passenger_engagement',
      features: features as Record<string, number>,
      computed_at: new Date().toISOString(),
      valid_until: new Date(Date.now() + 3600000).toISOString()
    };
  }

  private async extractContextualFeatures(userId: string, events: MLEvent[]): Promise<FeatureVector | null> {
    const now = new Date();
    const location = this.extractPrimaryLocation(events);

    const features: ContextualFeatures = {
      current_hour: now.getHours(),
      is_weekend: now.getDay() === 0 || now.getDay() === 6,
      is_holiday: await this.isPhilippineHoliday(now),
      weather_score: await this.getWeatherScore(location),
      traffic_density: await this.getTrafficDensity(location),
      event_proximity: await this.getEventProximity(location),
      surge_level_area: await this.getCurrentSurgeLevel(location),
      competitor_density: await this.getCompetitorDensity(location),
      regional_demand_score: await this.getRegionalDemandScore(location)
    };

    return {
      feature_id: crypto.randomUUID(),
      user_id: userId,
      feature_type: 'contextual',
      features: features as Record<string, number>,
      computed_at: new Date().toISOString(),
      valid_until: new Date(Date.now() + 1800000).toISOString() // 30 minutes
    };
  }

  private async extractRiskFeatures(userId: string, events: MLEvent[]): Promise<FeatureVector | null> {
    const locationUpdates = events.filter(e => e.event_type === 'driver_location_update') as DriverLocationUpdate[];

    const features: RiskSignalFeatures = {
      velocity_anomaly_score: this.calculateVelocityAnomalyScore(locationUpdates),
      location_spoofing_risk: this.calculateLocationSpoofingRisk(locationUpdates),
      behavioral_consistency: await this.calculateBehavioralConsistency(userId, events),
      device_fingerprint_risk: await this.calculateDeviceFingerprintRisk(userId, events),
      transaction_pattern_risk: await this.calculateTransactionPatternRisk(userId),
      time_pattern_anomaly: this.calculateTimePatternAnomaly(events),
      geo_risk_score: this.calculateGeoRiskScore(events)
    };

    return {
      feature_id: crypto.randomUUID(),
      user_id: userId,
      feature_type: 'risk_signals',
      features: features as Record<string, number>,
      computed_at: new Date().toISOString(),
      valid_until: new Date(Date.now() + 3600000).toISOString()
    };
  }

  // Feature computation helper methods

  private async calculateAcceptanceRate(userId: string, window: string, events: MLEvent[]): Promise<number> {
    const windowSeconds = this.featureWindows[window as keyof typeof this.featureWindows];
    const cutoff = new Date(Date.now() - windowSeconds * 1000);

    // Get historical data from Redis
    const historyKey = `driver:${userId}:ride_responses:${window}`;
    const historical = await this.redis.get(historyKey);
    let historicalData = historical ? JSON.parse(historical) : { accepted: 0, total: 0 };

    // Add current events
    const responses = events.filter(e => e.event_type === 'ride_request_response') as RideRequestResponse[];
    const accepted = responses.filter(r => r.response === 'accepted').length;
    const total = responses.length;

    const finalAccepted = historicalData.accepted + accepted;
    const finalTotal = historicalData.total + total;

    // Update cache
    await this.redis.setex(historyKey, windowSeconds, JSON.stringify({
      accepted: finalAccepted,
      total: finalTotal,
      updated_at: new Date().toISOString()
    }));

    return finalTotal > 0 ? finalAccepted / finalTotal : 0;
  }

  private calculateAvgResponseTime(events: MLEvent[]): number {
    const responses = events.filter(e => e.event_type === 'ride_request_response') as RideRequestResponse[];
    if (responses.length === 0) return 0;

    const totalTime = responses.reduce((sum, r) => sum + r.response_time, 0);
    return totalTime / responses.length;
  }

  private calculateLocationFrequency(events: MLEvent[]): number {
    const locationUpdates = events.filter(e => e.event_type === 'driver_location_update');
    return locationUpdates.length; // Updates per hour (assuming 1-hour batch)
  }

  private calculateAverageSpeed(events: MLEvent[]): number {
    const locationUpdates = events.filter(e => e.event_type === 'driver_location_update') as DriverLocationUpdate[];
    if (locationUpdates.length === 0) return 0;

    const totalSpeed = locationUpdates.reduce((sum, update) => sum + update.speed, 0);
    return totalSpeed / locationUpdates.length;
  }

  private calculateDistanceTraveled(events: MLEvent[]): number {
    const locationUpdates = events.filter(e => e.event_type === 'driver_location_update') as DriverLocationUpdate[];
    if (locationUpdates.length < 2) return 0;

    let totalDistance = 0;
    for (let i = 1; i < locationUpdates.length; i++) {
      if (locationUpdates[i].location && locationUpdates[i - 1].location) {
        totalDistance += this.calculateDistance(
          locationUpdates[i - 1].location!,
          locationUpdates[i].location!
        );
      }
    }

    return totalDistance;
  }

  private calculateIdleTimeRatio(events: MLEvent[]): number {
    const locationUpdates = events.filter(e => e.event_type === 'driver_location_update') as DriverLocationUpdate[];
    if (locationUpdates.length === 0) return 0;

    const idleUpdates = locationUpdates.filter(update => update.speed < 5); // Less than 5 km/h
    return idleUpdates.length / locationUpdates.length;
  }

  private calculateRejectionRateDuringSurge(events: MLEvent[]): number {
    const requests = events.filter(e => e.event_type === 'ride_request_received') as RideRequestReceived[];
    const responses = events.filter(e => e.event_type === 'ride_request_response') as RideRequestResponse[];

    const surgeRequests = requests.filter(req => req.surge_multiplier > 1.0);
    const surgeRejections = responses.filter(resp => 
      resp.response === 'rejected' && 
      requests.find(req => req.request_id === resp.request_id && req.surge_multiplier > 1.0)
    );

    return surgeRequests.length > 0 ? surgeRejections.length / surgeRequests.length : 0;
  }

  private async calculateEarningsEfficiency(userId: string, events: MLEvent[]): Promise<number> {
    // Simplified calculation - in production would integrate with actual earnings data
    const distanceTraveled = this.calculateDistanceTraveled(events);
    const acceptedRides = events.filter(e => 
      e.event_type === 'ride_request_response' && (e as RideRequestResponse).response === 'accepted'
    ).length;

    if (distanceTraveled === 0) return 0;
    return acceptedRides / distanceTraveled; // Rides per km
  }

  // Contextual feature helpers

  private extractPrimaryLocation(events: MLEvent[]): { lat: number; lng: number } | null {
    const locatedEvents = events.filter(e => e.location);
    if (locatedEvents.length === 0) return null;

    // Return the most recent location
    const sortedEvents = locatedEvents.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return sortedEvents[0].location!;
  }

  private async isPhilippineHoliday(date: Date): Promise<boolean> {
    // Simplified check - in production would use holiday API
    const month = date.getMonth() + 1;
    const day = date.getDate();

    const holidays = [
      { month: 1, day: 1 },   // New Year
      { month: 6, day: 12 },  // Independence Day
      { month: 8, day: 21 },  // Ninoy Aquino Day
      { month: 12, day: 25 }, // Christmas
      { month: 12, day: 30 }, // Rizal Day
    ];

    return holidays.some(h => h.month === month && h.day === day);
  }

  private async getWeatherScore(location: { lat: number; lng: number } | null): Promise<number> {
    // Mock weather score - in production would call weather API
    return Math.random() * 0.3 + 0.7; // 0.7-1.0 range (good weather bias)
  }

  private async getTrafficDensity(location: { lat: number; lng: number } | null): Promise<number> {
    // Mock traffic density - in production would integrate with traffic APIs
    const hour = new Date().getHours();
    const rushHourMultiplier = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19) ? 2.0 : 1.0;
    return Math.random() * 0.5 * rushHourMultiplier + 0.3;
  }

  // Risk signal helpers

  private calculateVelocityAnomalyScore(locationUpdates: DriverLocationUpdate[]): number {
    if (locationUpdates.length < 2) return 0;

    let anomalyCount = 0;
    for (let i = 1; i < locationUpdates.length; i++) {
      const speed = locationUpdates[i].speed;
      if (speed > 150) { // Unrealistic speed for urban driving
        anomalyCount++;
      }
    }

    return locationUpdates.length > 0 ? anomalyCount / locationUpdates.length : 0;
  }

  private calculateLocationSpoofingRisk(locationUpdates: DriverLocationUpdate[]): number {
    if (locationUpdates.length < 2) return 0;

    let suspiciousJumps = 0;
    for (let i = 1; i < locationUpdates.length; i++) {
      if (locationUpdates[i].location && locationUpdates[i - 1].location) {
        const distance = this.calculateDistance(
          locationUpdates[i - 1].location!,
          locationUpdates[i].location!
        );
        const timeDiff = new Date(locationUpdates[i].timestamp).getTime() - 
                        new Date(locationUpdates[i - 1].timestamp).getTime();
        const impliedSpeed = distance / (timeDiff / 1000 / 3600); // km/h

        if (impliedSpeed > 200) { // Impossible speed
          suspiciousJumps++;
        }
      }
    }

    return locationUpdates.length > 0 ? suspiciousJumps / locationUpdates.length : 0;
  }

  // Placeholder methods for complex calculations that would integrate with external systems

  private async getHistoricalDriverData(userId: string): Promise<any> {
    return {}; // Would fetch from historical data store
  }

  private calculateSessionDuration(interactions: UIInteraction[]): number {
    return interactions.reduce((sum, i) => sum + i.duration, 0);
  }

  private calculateInteractionRate(interactions: UIInteraction[]): number {
    const totalDuration = interactions.reduce((sum, i) => sum + i.duration, 0);
    return totalDuration > 0 ? interactions.length / (totalDuration / 60) : 0;
  }

  private calculateSearchToBookRatio(searchEvents: MLEvent[], bookingEvents: MLEvent[]): number {
    return searchEvents.length > 0 ? bookingEvents.length / searchEvents.length : 0;
  }

  private calculateScreenSwitchingFrequency(interactions: UIInteraction[]): number {
    const screens = interactions.map(i => i.screen);
    const switches = screens.filter((screen, i) => i > 0 && screen !== screens[i - 1]).length;
    return screens.length > 0 ? switches / screens.length : 0;
  }

  private async getBookingCancellationRate(userId: string): Promise<number> {
    return Math.random() * 0.1; // Mock 0-10% cancellation rate
  }

  private async getPaymentMethodChanges(userId: string): Promise<number> {
    return Math.floor(Math.random() * 3); // Mock 0-2 payment method changes
  }

  private analyzeLocationSearchPatterns(searchEvents: MLEvent[]): number {
    return searchEvents.length; // Simplified - count of location searches
  }

  private async getEventProximity(location: { lat: number; lng: number } | null): Promise<number> {
    return Math.random() * 0.3; // Mock event proximity score
  }

  private async getCurrentSurgeLevel(location: { lat: number; lng: number } | null): Promise<number> {
    return Math.random() * 2 + 1; // Mock surge level 1.0-3.0
  }

  private async getCompetitorDensity(location: { lat: number; lng: number } | null): Promise<number> {
    return Math.random() * 0.8 + 0.2; // Mock competitor density
  }

  private async getRegionalDemandScore(location: { lat: number; lng: number } | null): Promise<number> {
    return Math.random() * 0.6 + 0.4; // Mock regional demand
  }

  private async calculateBehavioralConsistency(userId: string, events: MLEvent[]): Promise<number> {
    return Math.random() * 0.3 + 0.7; // Mock behavioral consistency score
  }

  private async calculateDeviceFingerprintRisk(userId: string, events: MLEvent[]): Promise<number> {
    const deviceTypes = new Set(events.map(e => e.device_type));
    return deviceTypes.size > 3 ? 0.8 : 0.2; // Risk if using many different devices
  }

  private async calculateTransactionPatternRisk(userId: string): Promise<number> {
    return Math.random() * 0.4; // Mock transaction pattern risk
  }

  private calculateTimePatternAnomaly(events: MLEvent[]): number {
    const hours = events.map(e => new Date(e.timestamp).getHours());
    const uniqueHours = new Set(hours);
    return uniqueHours.size > 20 ? 0.9 : uniqueHours.size / 24; // Anomaly if active in too many hours
  }

  private calculateGeoRiskScore(events: MLEvent[]): number {
    // Mock geo risk based on location spread
    const locations = events.filter(e => e.location).map(e => e.location!);
    if (locations.length < 2) return 0;

    let maxDistance = 0;
    for (let i = 0; i < locations.length; i++) {
      for (let j = i + 1; j < locations.length; j++) {
        const distance = this.calculateDistance(locations[i], locations[j]);
        maxDistance = Math.max(maxDistance, distance);
      }
    }

    return maxDistance > 500 ? 0.9 : maxDistance / 500; // High risk if >500km spread
  }

  private calculateDistance(loc1: { lat: number; lng: number }, loc2: { lat: number; lng: number }): number {
    // Haversine formula
    const R = 6371; // Earth's radius in km
    const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
    const dLng = (loc2.lng - loc1.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}