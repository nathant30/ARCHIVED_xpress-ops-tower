import { 
  GeocodeRequest, 
  GeocodeResponse, 
  ReverseGeocodeRequest,
  RouteOptimizationRequest,
  RouteOptimizationResponse,
  ETACalculationRequest,
  ETACalculationResponse,
  TrafficDataRequest,
  TrafficDataResponse
} from '@/types/mapping';
import { DatabaseService } from './DatabaseService';
import { createHash } from 'crypto';

export class MappingService {
  private db: DatabaseService;
  private googleMapsApiKey: string;
  private hereMapsApiKey: string;
  private defaultProvider: 'google' | 'here' | 'mapbox';

  constructor(db: DatabaseService) {
    this.db = db;
    this.googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY || '';
    this.hereMapsApiKey = process.env.HERE_MAPS_API_KEY || '';
    this.defaultProvider = (process.env.DEFAULT_MAP_PROVIDER as any) || 'google';
  }

  // Geocoding - Convert address to coordinates
  async geocode(request: GeocodeRequest, provider?: string): Promise<GeocodeResponse> {
    const cacheKey = this.generateCacheKey('geocode', request);
    
    // Check cache first
    const cachedResult = await this.getFromCache(cacheKey);
    if (cachedResult) {
      await this.updateCacheUsage(cacheKey);
      return cachedResult.response_data;
    }

    const selectedProvider = provider || this.defaultProvider;
    let response: GeocodeResponse;

    try {
      switch (selectedProvider) {
        case 'google':
          response = await this.googleGeocode(request);
          break;
        case 'here':
          response = await this.hereGeocode(request);
          break;
        default:
          response = await this.googleGeocode(request);
      }

      // Cache the response
      await this.saveToCache(cacheKey, 'geocode', request, response, selectedProvider, 24 * 60 * 60); // 24 hours

      return response;
    } catch (error) {
      console.error(`Geocoding failed with ${selectedProvider}:`, error);
      
      // Fallback to different provider
      if (selectedProvider !== 'google' && this.googleMapsApiKey) {
        console.log('Falling back to Google Maps...');
        return await this.googleGeocode(request);
      }
      
      throw error;
    }
  }

  // Reverse Geocoding - Convert coordinates to address
  async reverseGeocode(request: ReverseGeocodeRequest, provider?: string): Promise<GeocodeResponse> {
    const cacheKey = this.generateCacheKey('reverse_geocode', request);
    
    // Check cache first
    const cachedResult = await this.getFromCache(cacheKey);
    if (cachedResult) {
      await this.updateCacheUsage(cacheKey);
      return cachedResult.response_data;
    }

    const selectedProvider = provider || this.defaultProvider;
    let response: GeocodeResponse;

    try {
      switch (selectedProvider) {
        case 'google':
          response = await this.googleReverseGeocode(request);
          break;
        case 'here':
          response = await this.hereReverseGeocode(request);
          break;
        default:
          response = await this.googleReverseGeocode(request);
      }

      // Cache the response
      await this.saveToCache(cacheKey, 'reverse_geocode', request, response, selectedProvider, 24 * 60 * 60);

      return response;
    } catch (error) {
      console.error(`Reverse geocoding failed with ${selectedProvider}:`, error);
      throw error;
    }
  }

  // Route Optimization
  async optimizeRoute(request: RouteOptimizationRequest, provider?: string): Promise<RouteOptimizationResponse> {
    const cacheKey = this.generateCacheKey('route', request);
    
    // Check cache first (shorter TTL for routes due to traffic changes)
    const cachedResult = await this.getFromCache(cacheKey);
    if (cachedResult && this.isCacheValid(cachedResult, 30 * 60)) { // 30 minutes for routes
      await this.updateCacheUsage(cacheKey);
      return cachedResult.response_data;
    }

    const selectedProvider = provider || this.defaultProvider;
    let response: RouteOptimizationResponse;

    try {
      switch (selectedProvider) {
        case 'google':
          response = await this.googleDirections(request);
          break;
        case 'here':
          response = await this.hereRouting(request);
          break;
        default:
          response = await this.googleDirections(request);
      }

      // Cache the response
      await this.saveToCache(cacheKey, 'route', request, response, selectedProvider, 30 * 60);

      // Save route optimization metrics
      await this.saveRouteOptimization(request, response, selectedProvider);

      return response;
    } catch (error) {
      console.error(`Route optimization failed with ${selectedProvider}:`, error);
      throw error;
    }
  }

  // ETA Calculation
  async calculateETA(request: ETACalculationRequest, provider?: string): Promise<ETACalculationResponse> {
    const cacheKey = this.generateCacheKey('eta', request);
    
    // Check cache first (very short TTL for ETA due to traffic changes)
    const cachedResult = await this.getFromCache(cacheKey);
    if (cachedResult && this.isCacheValid(cachedResult, 5 * 60)) { // 5 minutes for ETA
      await this.updateCacheUsage(cacheKey);
      return cachedResult.response_data;
    }

    const selectedProvider = provider || this.defaultProvider;
    let response: ETACalculationResponse;

    try {
      switch (selectedProvider) {
        case 'google':
          response = await this.googleDistanceMatrix(request);
          break;
        case 'here':
          response = await this.hereMatrix(request);
          break;
        default:
          response = await this.googleDistanceMatrix(request);
      }

      // Cache the response
      await this.saveToCache(cacheKey, 'eta', request, response, selectedProvider, 5 * 60);

      return response;
    } catch (error) {
      console.error(`ETA calculation failed with ${selectedProvider}:`, error);
      throw error;
    }
  }

  // Traffic Data
  async getTrafficData(request: TrafficDataRequest, provider?: string): Promise<TrafficDataResponse> {
    const cacheKey = this.generateCacheKey('traffic', request);
    
    // Check cache first (very short TTL for traffic data)
    const cachedResult = await this.getFromCache(cacheKey);
    if (cachedResult && this.isCacheValid(cachedResult, 2 * 60)) { // 2 minutes for traffic
      await this.updateCacheUsage(cacheKey);
      return cachedResult.response_data;
    }

    const selectedProvider = provider || this.defaultProvider;
    let response: TrafficDataResponse;

    try {
      switch (selectedProvider) {
        case 'google':
          response = await this.googleTrafficData(request);
          break;
        case 'here':
          response = await this.hereTrafficData(request);
          break;
        default:
          response = await this.mockTrafficData(request); // Fallback to mock data
      }

      // Cache the response
      await this.saveToCache(cacheKey, 'traffic', request, response, selectedProvider, 2 * 60);

      // Save traffic data to database
      await this.saveTrafficData(response);

      return response;
    } catch (error) {
      console.error(`Traffic data retrieval failed with ${selectedProvider}:`, error);
      
      // Return mock data as fallback
      return await this.mockTrafficData(request);
    }
  }

  // Google Maps API implementations
  private async googleGeocode(request: GeocodeRequest): Promise<GeocodeResponse> {
    if (!this.googleMapsApiKey) {
      throw new Error('Google Maps API key not configured');
    }

    const params = new URLSearchParams({
      address: request.address,
      key: this.googleMapsApiKey
    });

    if (request.region) params.append('region', request.region);
    if (request.bounds) {
      params.append('bounds', `${request.bounds.south},${request.bounds.west}|${request.bounds.north},${request.bounds.east}`);
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?${params}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Google Geocoding API error: ${response.status}`);
    }

    return await response.json();
  }

  private async googleReverseGeocode(request: ReverseGeocodeRequest): Promise<GeocodeResponse> {
    if (!this.googleMapsApiKey) {
      throw new Error('Google Maps API key not configured');
    }

    const params = new URLSearchParams({
      latlng: `${request.latitude},${request.longitude}`,
      key: this.googleMapsApiKey
    });

    if (request.result_type) {
      params.append('result_type', request.result_type.join('|'));
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?${params}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Google Reverse Geocoding API error: ${response.status}`);
    }

    return await response.json();
  }

  private async googleDirections(request: RouteOptimizationRequest): Promise<RouteOptimizationResponse> {
    if (!this.googleMapsApiKey) {
      throw new Error('Google Maps API key not configured');
    }

    const params = new URLSearchParams({
      origin: `${request.origin.latitude},${request.origin.longitude}`,
      destination: `${request.destination.latitude},${request.destination.longitude}`,
      key: this.googleMapsApiKey
    });

    if (request.waypoints && request.waypoints.length > 0) {
      const waypoints = request.waypoints.map(wp => `${wp.latitude},${wp.longitude}`).join('|');
      params.append('waypoints', `${request.optimize_waypoints ? 'optimize:true|' : ''}${waypoints}`);
    }

    if (request.avoid) params.append('avoid', request.avoid.join('|'));
    if (request.travel_mode) params.append('mode', request.travel_mode.toLowerCase());
    if (request.departure_time) params.append('departure_time', request.departure_time);
    if (request.alternatives) params.append('alternatives', 'true');

    params.append('traffic_model', request.traffic_model || 'best_guess');

    const url = `https://maps.googleapis.com/maps/api/directions/json?${params}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Google Directions API error: ${response.status}`);
    }

    return await response.json();
  }

  private async googleDistanceMatrix(request: ETACalculationRequest): Promise<ETACalculationResponse> {
    if (!this.googleMapsApiKey) {
      throw new Error('Google Maps API key not configured');
    }

    const origins = request.origins.map(o => `${o.latitude},${o.longitude}`).join('|');
    const destinations = request.destinations.map(d => `${d.latitude},${d.longitude}`).join('|');

    const params = new URLSearchParams({
      origins,
      destinations,
      key: this.googleMapsApiKey
    });

    if (request.travel_mode) params.append('mode', request.travel_mode);
    if (request.avoid) params.append('avoid', request.avoid.join('|'));
    if (request.departure_time) params.append('departure_time', request.departure_time);
    
    params.append('traffic_model', request.traffic_model || 'best_guess');

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?${params}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Google Distance Matrix API error: ${response.status}`);
    }

    return await response.json();
  }

  private async googleTrafficData(request: TrafficDataRequest): Promise<TrafficDataResponse> {
    // Google doesn't have a direct traffic API, so we'll use Roads API + mock data
    // In production, you'd integrate with Google Traffic API or other traffic providers
    return this.mockTrafficData(request);
  }

  // HERE Maps API implementations (mock for now)
  private async hereGeocode(request: GeocodeRequest): Promise<GeocodeResponse> {
    // HERE Maps geocoding implementation
    // For now, return mock data matching Google's format
    throw new Error('HERE Maps integration not yet implemented');
  }

  private async hereReverseGeocode(request: ReverseGeocodeRequest): Promise<GeocodeResponse> {
    throw new Error('HERE Maps reverse geocoding not yet implemented');
  }

  private async hereRouting(request: RouteOptimizationRequest): Promise<RouteOptimizationResponse> {
    throw new Error('HERE Maps routing not yet implemented');
  }

  private async hereMatrix(request: ETACalculationRequest): Promise<ETACalculationResponse> {
    throw new Error('HERE Maps matrix not yet implemented');
  }

  private async hereTrafficData(request: TrafficDataRequest): Promise<TrafficDataResponse> {
    throw new Error('HERE Maps traffic data not yet implemented');
  }

  // Mock implementations for fallback
  private async mockTrafficData(request: TrafficDataRequest): Promise<TrafficDataResponse> {
    const trafficLevels = ['free_flow', 'light', 'moderate', 'heavy', 'stop_and_go'] as const;
    
    return {
      traffic_data: request.locations.map(location => ({
        location: {
          latitude: location.latitude,
          longitude: location.longitude
        },
        traffic_level: trafficLevels[Math.floor(Math.random() * trafficLevels.length)],
        speed_kmh: Math.floor(Math.random() * 80) + 20, // 20-100 km/h
        delay_seconds: Math.floor(Math.random() * 300), // 0-5 minutes delay
        incidents: [],
        flow_data: {
          current_speed: Math.floor(Math.random() * 60) + 20,
          free_flow_speed: 60,
          congestion_ratio: Math.random()
        }
      })),
      timestamp: new Date().toISOString(),
      provider: 'mock',
      coverage_area: {
        northeast: { lat: 14.7, lng: 121.2 },
        southwest: { lat: 14.4, lng: 120.9 }
      }
    };
  }

  // Cache management
  private generateCacheKey(type: string, request: any): string {
    const requestString = JSON.stringify(request);
    return `${type}_${createHash('sha256').update(requestString).digest('hex').substring(0, 16)}`;
  }

  private async getFromCache(cacheKey: string): Promise<any> {
    try {
      const query = `
        SELECT response_data, created_at, expires_at
        FROM mapping_cache 
        WHERE cache_key = $1 
          AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
      `;
      const result = await this.db.query(query, [cacheKey]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Cache retrieval error:', error);
      return null;
    }
  }

  private async saveToCache(
    cacheKey: string, 
    cacheType: string, 
    request: any, 
    response: any, 
    provider: string, 
    ttlSeconds: number
  ): Promise<void> {
    try {
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
      
      const query = `
        INSERT INTO mapping_cache (
          cache_key, cache_type, request_data, response_data, 
          provider, expires_at, usage_count
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (cache_key) 
        DO UPDATE SET
          response_data = EXCLUDED.response_data,
          expires_at = EXCLUDED.expires_at,
          last_used = CURRENT_TIMESTAMP,
          usage_count = mapping_cache.usage_count + 1
      `;

      await this.db.query(query, [
        cacheKey,
        cacheType,
        JSON.stringify(request),
        JSON.stringify(response),
        provider,
        expiresAt.toISOString(),
        1
      ]);
    } catch (error) {
      console.error('Cache save error:', error);
      // Don't throw error to avoid breaking the main functionality
    }
  }

  private async updateCacheUsage(cacheKey: string): Promise<void> {
    try {
      await this.db.query(
        'UPDATE mapping_cache SET usage_count = usage_count + 1, last_used = CURRENT_TIMESTAMP WHERE cache_key = $1',
        [cacheKey]
      );
    } catch (error) {
      console.error('Cache usage update error:', error);
    }
  }

  private isCacheValid(cachedResult: any, maxAgeSeconds: number): boolean {
    const cacheAge = (Date.now() - new Date(cachedResult.created_at).getTime()) / 1000;
    return cacheAge < maxAgeSeconds;
  }

  private async saveRouteOptimization(
    request: RouteOptimizationRequest,
    response: RouteOptimizationResponse,
    provider: string
  ): Promise<void> {
    try {
      if (response.routes.length === 0) return;

      const route = response.routes[0];
      const totalDistance = route.legs.reduce((sum, leg) => sum + leg.distance.value, 0);
      const totalTime = route.legs.reduce((sum, leg) => sum + leg.duration.value, 0);

      const optimizationId = `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const query = `
        INSERT INTO route_optimizations (
          optimization_id, origin_location, destination_location, waypoints,
          vehicle_type, provider, optimized_route, distance_optimized_meters,
          time_optimized_seconds, cost_estimate
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `;

      await this.db.query(query, [
        optimizationId,
        JSON.stringify(request.origin),
        JSON.stringify(request.destination),
        JSON.stringify(request.waypoints || []),
        request.travel_mode || 'DRIVING',
        provider,
        JSON.stringify(route),
        totalDistance,
        totalTime,
        this.estimateRouteCost(totalDistance, totalTime)
      ]);
    } catch (error) {
      console.error('Route optimization save error:', error);
    }
  }

  private async saveTrafficData(response: TrafficDataResponse): Promise<void> {
    try {
      for (const trafficPoint of response.traffic_data) {
        const query = `
          INSERT INTO traffic_data (
            location_point, traffic_level, speed_kmh, delay_seconds,
            provider, confidence_score, valid_from, valid_until
          ) VALUES (
            ST_Point($1, $2), $3, $4, $5, $6, $7, $8, $9
          )
        `;

        const validUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes validity

        await this.db.query(query, [
          trafficPoint.location.longitude,
          trafficPoint.location.latitude,
          trafficPoint.traffic_level,
          trafficPoint.speed_kmh || 0,
          trafficPoint.delay_seconds || 0,
          response.provider,
          1.0,
          response.timestamp,
          validUntil.toISOString()
        ]);
      }
    } catch (error) {
      console.error('Traffic data save error:', error);
    }
  }

  private estimateRouteCost(distanceMeters: number, timeSeconds: number): number {
    // Simple cost estimation based on distance and time
    // In production, this would consider fuel, wear, driver wages, etc.
    const baseCost = 50; // PHP 50 base
    const costPerKm = 12; // PHP 12 per km
    const costPerMinute = 2; // PHP 2 per minute
    
    const distanceKm = distanceMeters / 1000;
    const timeMinutes = timeSeconds / 60;
    
    return baseCost + (distanceKm * costPerKm) + (timeMinutes * costPerMinute);
  }

  // Cleanup expired cache entries
  async cleanupExpiredCache(): Promise<number> {
    try {
      const result = await this.db.query(
        'DELETE FROM mapping_cache WHERE expires_at < CURRENT_TIMESTAMP'
      );
      return result.rowCount || 0;
    } catch (error) {
      console.error('Cache cleanup error:', error);
      return 0;
    }
  }

  // Get cache statistics
  async getCacheStats(): Promise<any> {
    try {
      const query = `
        SELECT 
          cache_type,
          COUNT(*) as total_entries,
          SUM(usage_count) as total_usage,
          AVG(usage_count) as avg_usage_per_entry,
          MAX(last_used) as most_recent_use,
          COUNT(CASE WHEN expires_at > CURRENT_TIMESTAMP THEN 1 END) as active_entries
        FROM mapping_cache
        GROUP BY cache_type
      `;
      
      const result = await this.db.query(query);
      return result.rows;
    } catch (error) {
      console.error('Cache stats error:', error);
      return [];
    }
  }
}