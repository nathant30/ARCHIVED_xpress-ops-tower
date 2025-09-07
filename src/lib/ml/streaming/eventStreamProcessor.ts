// Event Stream Processor
// High-performance real-time event processing for ML pipeline

import { MLEvent, DriverLocationUpdate, RideRequestReceived, UIInteraction } from '@/lib/ml/events/eventSchemas';
import { logger } from '@/lib/security/productionLogger';

export interface StreamAggregation {
  type: string;
  window: string;
  dimension: string;
  value: number;
  ttl: number;
}

export interface EventPattern {
  pattern_id: string;
  user_id: string;
  pattern_type: 'suspicious_behavior' | 'demand_signal' | 'performance_issue';
  confidence: number;
  events: string[]; // event_ids
  detected_at: string;
}

export interface DriverBehaviorMetrics {
  driver_id: string;
  window: string;
  metrics: {
    requests_received: number;
    requests_accepted: number;
    acceptance_rate: number;
    avg_response_time: number;
    total_distance: number;
    avg_speed: number;
    location_updates: number;
  };
}

export interface PassengerEngagementMetrics {
  passenger_id: string;
  window: string;
  metrics: {
    session_duration: number;
    interactions_count: number;
    screens_visited: string[];
    search_queries: number;
    booking_attempts: number;
    booking_success_rate: number;
  };
}

export class EventStreamProcessor {
  private patterns: Map<string, EventPattern[]> = new Map();
  private driverMetrics: Map<string, DriverBehaviorMetrics> = new Map();
  private passengerMetrics: Map<string, PassengerEngagementMetrics> = new Map();

  constructor() {
    // Initialize pattern detection
    this.initializePatternDetection();
  }

  // Main processing entry point
  public processEventStream(events: MLEvent[]): {
    aggregations: StreamAggregation[];
    patterns: EventPattern[];
    driverMetrics: DriverBehaviorMetrics[];
    passengerMetrics: PassengerEngagementMetrics[];
  } {
    const aggregations = this.generateAggregations(events);
    const patterns = this.detectPatterns(events);
    const driverMetrics = this.processDriverBehavior(events);
    const passengerMetrics = this.processPassengerEngagement(events);

    return {
      aggregations,
      patterns,
      driverMetrics,
      passengerMetrics
    };
  }

  // Real-time aggregations for dashboard
  public generateAggregations(events: MLEvent[]): StreamAggregation[] {
    const aggregations: StreamAggregation[] = [];
    const now = new Date();
    const hourWindow = now.toISOString().slice(0, 13); // YYYY-MM-DDTHH
    const dayWindow = now.toISOString().slice(0, 10);  // YYYY-MM-DD

    // Event type counters
    const eventTypeCounts = new Map<string, number>();
    const regionCounts = new Map<string, number>();
    const deviceCounts = new Map<string, number>();

    for (const event of events) {
      // Count by event type
      const currentCount = eventTypeCounts.get(event.event_type) || 0;
      eventTypeCounts.set(event.event_type, currentCount + 1);

      // Count by device type
      const deviceCount = deviceCounts.get(event.device_type) || 0;
      deviceCounts.set(event.device_type, deviceCount + 1);

      // Estimate region based on location (simplified)
      if (event.location) {
        const region = this.getRegionFromLocation(event.location);
        const regionCount = regionCounts.get(region) || 0;
        regionCounts.set(region, regionCount + 1);
      }
    }

    // Generate hourly aggregations
    for (const [eventType, count] of eventTypeCounts) {
      aggregations.push({
        type: 'event_type_count',
        window: hourWindow,
        dimension: eventType,
        value: count,
        ttl: 86400 // 24 hours
      });
    }

    // Generate daily aggregations
    for (const [region, count] of regionCounts) {
      aggregations.push({
        type: 'regional_activity',
        window: dayWindow,
        dimension: region,
        value: count,
        ttl: 86400 * 7 // 7 days
      });
    }

    // Device type aggregations
    for (const [deviceType, count] of deviceCounts) {
      aggregations.push({
        type: 'device_usage',
        window: hourWindow,
        dimension: deviceType,
        value: count,
        ttl: 86400
      });
    }

    // Special aggregations for ML features
    this.generateMLAggregations(events, aggregations, hourWindow);

    return aggregations;
  }

  // Pattern detection for anomalies and insights
  public detectPatterns(events: MLEvent[]): EventPattern[] {
    const detectedPatterns: EventPattern[] = [];
    const userEvents = new Map<string, MLEvent[]>();

    // Group events by user
    for (const event of events) {
      const userEventList = userEvents.get(event.user_id) || [];
      userEventList.push(event);
      userEvents.set(event.user_id, userEventList);
    }

    // Detect patterns for each user
    for (const [userId, userEventList] of userEvents) {
      // Suspicious behavior patterns
      const suspiciousPatterns = this.detectSuspiciousBehavior(userId, userEventList);
      detectedPatterns.push(...suspiciousPatterns);

      // Demand signal patterns
      const demandPatterns = this.detectDemandSignals(userId, userEventList);
      detectedPatterns.push(...demandPatterns);

      // Performance issue patterns
      const performancePatterns = this.detectPerformanceIssues(userId, userEventList);
      detectedPatterns.push(...performancePatterns);
    }

    return detectedPatterns;
  }

  // Process driver behavior metrics
  public processDriverBehavior(events: MLEvent[]): DriverBehaviorMetrics[] {
    const driverEvents = new Map<string, MLEvent[]>();
    const now = new Date();
    const hourWindow = now.toISOString().slice(0, 13);

    // Group events by driver
    for (const event of events) {
      if ('driver_id' in event) {
        const driverEventList = driverEvents.get(event.driver_id) || [];
        driverEventList.push(event);
        driverEvents.set(event.driver_id, driverEventList);
      }
    }

    const driverMetrics: DriverBehaviorMetrics[] = [];

    for (const [driverId, driverEventList] of driverEvents) {
      const metrics = this.calculateDriverMetrics(driverId, driverEventList, hourWindow);
      if (metrics) {
        driverMetrics.push(metrics);
      }
    }

    return driverMetrics;
  }

  // Process passenger engagement metrics
  public processPassengerEngagement(events: MLEvent[]): PassengerEngagementMetrics[] {
    const passengerEvents = new Map<string, MLEvent[]>();
    const now = new Date();
    const hourWindow = now.toISOString().slice(0, 13);

    // Group events by passenger
    for (const event of events) {
      if ('passenger_id' in event) {
        const passengerEventList = passengerEvents.get(event.passenger_id) || [];
        passengerEventList.push(event);
        passengerEvents.set(event.passenger_id, passengerEventList);
      }
    }

    const passengerMetrics: PassengerEngagementMetrics[] = [];

    for (const [passengerId, passengerEventList] of passengerEvents) {
      const metrics = this.calculatePassengerMetrics(passengerId, passengerEventList, hourWindow);
      if (metrics) {
        passengerMetrics.push(metrics);
      }
    }

    return passengerMetrics;
  }

  // Private helper methods

  private initializePatternDetection(): void {
    // Initialize pattern detection rules
    logger.info('Event Stream Processor initialized with pattern detection');
  }

  private generateMLAggregations(events: MLEvent[], aggregations: StreamAggregation[], window: string): void {
    // Surge pricing signals
    const rideRequests = events.filter(e => e.event_type === 'ride_request_received') as RideRequestReceived[];
    if (rideRequests.length > 0) {
      const avgSurge = rideRequests.reduce((sum, req) => sum + req.surge_multiplier, 0) / rideRequests.length;
      aggregations.push({
        type: 'avg_surge_multiplier',
        window,
        dimension: 'all_regions',
        value: avgSurge,
        ttl: 86400
      });
    }

    // Location update frequency (driver activity)
    const locationUpdates = events.filter(e => e.event_type === 'driver_location_update') as DriverLocationUpdate[];
    if (locationUpdates.length > 0) {
      aggregations.push({
        type: 'driver_activity_level',
        window,
        dimension: 'location_updates',
        value: locationUpdates.length,
        ttl: 86400
      });
    }

    // UI engagement level
    const uiInteractions = events.filter(e => e.event_type === 'ui_interaction') as UIInteraction[];
    if (uiInteractions.length > 0) {
      const avgDuration = uiInteractions.reduce((sum, ui) => sum + ui.duration, 0) / uiInteractions.length;
      aggregations.push({
        type: 'avg_ui_engagement',
        window,
        dimension: 'interaction_duration',
        value: avgDuration,
        ttl: 86400
      });
    }
  }

  private detectSuspiciousBehavior(userId: string, events: MLEvent[]): EventPattern[] {
    const patterns: EventPattern[] = [];

    // Pattern 1: Rapid successive ride requests without acceptance
    const rideRequests = events.filter(e => e.event_type === 'ride_request_received');
    const rideResponses = events.filter(e => e.event_type === 'ride_request_response');

    if (rideRequests.length >= 5 && rideResponses.length === 0) {
      patterns.push({
        pattern_id: crypto.randomUUID(),
        user_id: userId,
        pattern_type: 'suspicious_behavior',
        confidence: 0.8,
        events: rideRequests.map(e => e.event_id),
        detected_at: new Date().toISOString()
      });
    }

    // Pattern 2: Location spoofing detection (sudden large distance jumps)
    const locationUpdates = events.filter(e => e.event_type === 'driver_location_update') as DriverLocationUpdate[];
    if (locationUpdates.length >= 2) {
      let suspiciousJumps = 0;
      for (let i = 1; i < locationUpdates.length; i++) {
        const distance = this.calculateDistance(
          locationUpdates[i - 1].location!,
          locationUpdates[i].location!
        );
        const timeDiff = new Date(locationUpdates[i].timestamp).getTime() - 
                        new Date(locationUpdates[i - 1].timestamp).getTime();
        const speed = distance / (timeDiff / 1000 / 3600); // km/h

        if (speed > 200) { // Impossible speed
          suspiciousJumps++;
        }
      }

      if (suspiciousJumps >= 2) {
        patterns.push({
          pattern_id: crypto.randomUUID(),
          user_id: userId,
          pattern_type: 'suspicious_behavior',
          confidence: 0.9,
          events: locationUpdates.map(e => e.event_id),
          detected_at: new Date().toISOString()
        });
      }
    }

    return patterns;
  }

  private detectDemandSignals(userId: string, events: MLEvent[]): EventPattern[] {
    const patterns: EventPattern[] = [];

    // High booking activity in specific area
    const bookingEvents = events.filter(e => e.event_type === 'ride_booking_started');
    if (bookingEvents.length >= 3) {
      patterns.push({
        pattern_id: crypto.randomUUID(),
        user_id: userId,
        pattern_type: 'demand_signal',
        confidence: 0.7,
        events: bookingEvents.map(e => e.event_id),
        detected_at: new Date().toISOString()
      });
    }

    return patterns;
  }

  private detectPerformanceIssues(userId: string, events: MLEvent[]): EventPattern[] {
    const patterns: EventPattern[] = [];

    // Slow response times
    const responseEvents = events.filter(e => e.event_type === 'ride_request_response') as any[];
    const slowResponses = responseEvents.filter(e => e.response_time > 30); // 30+ seconds

    if (slowResponses.length >= 3) {
      patterns.push({
        pattern_id: crypto.randomUUID(),
        user_id: userId,
        pattern_type: 'performance_issue',
        confidence: 0.8,
        events: slowResponses.map(e => e.event_id),
        detected_at: new Date().toISOString()
      });
    }

    return patterns;
  }

  private calculateDriverMetrics(driverId: string, events: MLEvent[], window: string): DriverBehaviorMetrics | null {
    const requestsReceived = events.filter(e => e.event_type === 'ride_request_received').length;
    const responses = events.filter(e => e.event_type === 'ride_request_response') as any[];
    const accepted = responses.filter(r => r.response === 'accepted').length;
    const locationUpdates = events.filter(e => e.event_type === 'driver_location_update') as DriverLocationUpdate[];

    if (events.length === 0) return null;

    const avgResponseTime = responses.length > 0 
      ? responses.reduce((sum, r) => sum + r.response_time, 0) / responses.length 
      : 0;

    let totalDistance = 0;
    let totalSpeed = 0;

    for (let i = 1; i < locationUpdates.length; i++) {
      totalDistance += this.calculateDistance(
        locationUpdates[i - 1].location!,
        locationUpdates[i].location!
      );
      totalSpeed += locationUpdates[i].speed;
    }

    const avgSpeed = locationUpdates.length > 0 ? totalSpeed / locationUpdates.length : 0;

    return {
      driver_id: driverId,
      window,
      metrics: {
        requests_received: requestsReceived,
        requests_accepted: accepted,
        acceptance_rate: requestsReceived > 0 ? accepted / requestsReceived : 0,
        avg_response_time: avgResponseTime,
        total_distance: totalDistance,
        avg_speed: avgSpeed,
        location_updates: locationUpdates.length
      }
    };
  }

  private calculatePassengerMetrics(passengerId: string, events: MLEvent[], window: string): PassengerEngagementMetrics | null {
    const uiInteractions = events.filter(e => e.event_type === 'ui_interaction') as UIInteraction[];
    const searchEvents = events.filter(e => e.event_type === 'search_location');
    const bookingEvents = events.filter(e => e.event_type === 'ride_booking_started');

    if (events.length === 0) return null;

    const sessionDuration = uiInteractions.reduce((sum, ui) => sum + ui.duration, 0);
    const screensVisited = [...new Set(uiInteractions.map(ui => ui.screen))];

    return {
      passenger_id: passengerId,
      window,
      metrics: {
        session_duration: sessionDuration,
        interactions_count: uiInteractions.length,
        screens_visited: screensVisited,
        search_queries: searchEvents.length,
        booking_attempts: bookingEvents.length,
        booking_success_rate: 1.0 // Would need trip completion events to calculate accurately
      }
    };
  }

  private getRegionFromLocation(location: { lat: number; lng: number }): string {
    // Simplified region detection for Philippines
    if (location.lat >= 14.0 && location.lat <= 15.0 && location.lng >= 120.5 && location.lng <= 121.5) {
      return 'metro_manila';
    } else if (location.lat >= 10.0 && location.lat <= 11.0 && location.lng >= 123.5 && location.lng <= 124.0) {
      return 'cebu';
    } else if (location.lat >= 7.0 && location.lat <= 8.0 && location.lng >= 125.0 && location.lng <= 126.0) {
      return 'davao';
    }
    return 'other';
  }

  private calculateDistance(loc1: { lat: number; lng: number }, loc2: { lat: number; lng: number }): number {
    // Haversine formula for distance calculation
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