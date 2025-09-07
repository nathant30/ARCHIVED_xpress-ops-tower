/**
 * Express Ops Tower - Dynamic Pricing Engine
 * Core pricing algorithm with real-time surge calculation
 * Based on PRD v1.0 - September 2025
 */

import { latLngToCell } from 'h3-js';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface PricingRequest {
  service_type: 'tnvs_standard' | 'tnvs_premium' | 'taxi_regular' | 'taxi_premium' | 'mc_taxi';
  pickup_lat: number;
  pickup_lng: number;
  dropoff_lat: number;
  dropoff_lng: number;
  estimated_distance_km: number;
  estimated_duration_min: number;
  timestamp: string;
  user_id?: string;
  driver_id?: string;
}

export interface PricingResponse {
  quote_id: string;
  base_fare: number;
  distance_fare: number;
  time_fare: number;
  surge_multiplier: number;
  surge_amount: number;
  total_fare: number;
  currency: string;
  expires_at: string;
  fare_breakdown: FareBreakdown;
  regulatory_compliance: RegulatoryCompliance;
  factors: PricingFactors;
}

export interface FareBreakdown {
  base: number;
  distance: number;
  time: number;
  surge_amount: number;
  booking_fee?: number;
  tolls?: number;
  other_surcharges?: number;
}

export interface RegulatoryCompliance {
  ltfrb_compliant: boolean;
  max_allowed_fare: number;
  regulation_version: string;
  violations?: string[];
}

export interface PricingFactors {
  weather_impact: number;
  traffic_impact: number;
  event_impact: number;
  poi_impact: number;
  supply_demand_ratio: number;
  time_of_day_factor: number;
}

export interface SurgeState {
  h3_cell_id: string;
  service_type: string;
  current_multiplier: number;
  supply_count: number;
  demand_count: number;
  supply_demand_ratio: number;
  active_trips: number;
  factors: PricingFactors;
  timestamp: Date;
  expires_at: Date;
}

export interface PricingRule {
  id: string;
  service_type: string;
  base_fare: number;
  per_km_rate: number;
  per_minute_rate: number;
  surge_cap: number;
  ltfrb_approved: boolean;
  geographic_scope: any;
  effective_date: Date;
  expiry_date?: Date;
}

// ============================================================================
// DYNAMIC PRICING ENGINE CLASS
// ============================================================================

export class DynamicPricingEngine {
  private readonly QUOTE_EXPIRY_MINUTES = 5;
  private readonly H3_RESOLUTION = 8;
  private readonly MAX_PROCESSING_TIME_MS = 100;
  
  /**
   * Main pricing calculation method
   * Processes pricing request and returns real-time pricing
   */
  async calculatePrice(request: PricingRequest): Promise<PricingResponse> {
    const startTime = Date.now();
    
    try {
      // Generate unique quote ID
      const quote_id = this.generateQuoteId();
      
      // Get H3 cell for pickup location
      const pickup_h3 = latLngToCell(request.pickup_lat, request.pickup_lng, this.H3_RESOLUTION);
      
      // Parallel data fetching for performance
      const [
        basePricingRule,
        surgeState,
        externalFactors,
        regulatoryLimits,
        activeOverrides
      ] = await Promise.all([
        this.getPricingRule(request.service_type),
        this.getSurgeState(pickup_h3, request.service_type),
        this.getExternalFactors(request),
        this.getRegulatoryLimits(request.service_type),
        this.getActiveOverrides(pickup_h3, request.service_type)
      ]);
      
      // Calculate base fare components
      const baseFare = basePricingRule.base_fare;
      const distanceFare = request.estimated_distance_km * basePricingRule.per_km_rate;
      const timeFare = request.estimated_duration_min * basePricingRule.per_minute_rate;
      const subtotal = baseFare + distanceFare + timeFare;
      
      // Calculate surge multiplier
      const surgeMulitplier = this.calculateSurgeMultiplier(
        surgeState,
        externalFactors,
        basePricingRule.surge_cap,
        activeOverrides
      );
      
      // Apply surge to calculate total
      const surgeAmount = subtotal * (surgeMulitplier - 1);
      const totalFare = subtotal + surgeAmount;
      
      // Regulatory compliance check
      const compliance = this.checkRegulatoryCompliance(
        totalFare,
        request.service_type,
        regulatoryLimits
      );
      
      // Apply regulatory caps if necessary
      const finalFare = compliance.ltfrb_compliant ? totalFare : compliance.max_allowed_fare;
      const adjustedSurgeAmount = finalFare - subtotal;
      const adjustedSurgeMultiplier = subtotal > 0 ? finalFare / subtotal : 1.0;
      
      // Build response
      const response: PricingResponse = {
        quote_id,
        base_fare: baseFare,
        distance_fare: distanceFare,
        time_fare: timeFare,
        surge_multiplier: Math.round(adjustedSurgeMultiplier * 100) / 100,
        surge_amount: adjustedSurgeAmount,
        total_fare: finalFare,
        currency: 'PHP',
        expires_at: new Date(Date.now() + this.QUOTE_EXPIRY_MINUTES * 60000).toISOString(),
        fare_breakdown: {
          base: baseFare,
          distance: distanceFare,
          time: timeFare,
          surge_amount: adjustedSurgeAmount
        },
        regulatory_compliance: compliance,
        factors: externalFactors
      };
      
      // Log pricing decision for audit and analytics
      await this.logPricingDecision(request, response, {
        processing_time_ms: Date.now() - startTime,
        h3_cell: pickup_h3,
        original_surge: surgeMulitplier,
        regulatory_adjusted: !compliance.ltfrb_compliant
      });
      
      return response;
      
    } catch (error) {
      console.error('Pricing engine error:', error);
      
      // Fallback to base pricing on error
      const fallbackRule = await this.getPricingRule(request.service_type);
      return this.generateFallbackPricing(request, fallbackRule);
    }
  }
  
  /**
   * Calculate surge multiplier based on multiple factors
   */
  private calculateSurgeMultiplier(
    surgeState: SurgeState,
    factors: PricingFactors,
    surgeCap: number,
    overrides: any[]
  ): number {
    // Check for executive overrides first
    const surgeOverride = overrides.find(o => o.override_type === 'surge_disable');
    if (surgeOverride) {
      return 1.0; // Surge disabled by executive
    }
    
    const capOverride = overrides.find(o => o.override_type === 'surge_cap');
    const effectiveSurgeCap = capOverride ? capOverride.parameters.surge_cap : surgeCap;
    
    // Base surge from supply/demand
    let surgeMultiplier = 1.0;
    
    if (factors.supply_demand_ratio > 0) {
      // Demand exceeds supply
      if (factors.supply_demand_ratio >= 3.0) {
        surgeMultiplier = 2.5; // High demand
      } else if (factors.supply_demand_ratio >= 2.0) {
        surgeMultiplier = 2.0; // Medium-high demand
      } else if (factors.supply_demand_ratio >= 1.5) {
        surgeMultiplier = 1.5; // Medium demand
      } else if (factors.supply_demand_ratio >= 1.2) {
        surgeMultiplier = 1.2; // Low-medium demand
      }
    }
    
    // Apply external factors
    surgeMultiplier *= factors.weather_impact;
    surgeMultiplier *= factors.traffic_impact;
    surgeMultiplier *= factors.event_impact;
    surgeMultiplier *= factors.poi_impact;
    surgeMultiplier *= factors.time_of_day_factor;
    
    // Apply surge cap
    surgeMultiplier = Math.min(surgeMultiplier, effectiveSurgeCap);
    
    // Round to 2 decimal places
    return Math.round(surgeMultiplier * 100) / 100;
  }
  
  /**
   * Get external factors affecting pricing
   */
  private async getExternalFactors(request: PricingRequest): Promise<PricingFactors> {
    const pickup_h3 = latLngToCell(request.pickup_lat, request.pickup_lng, this.H3_RESOLUTION);
    
    // Parallel fetching of external data
    const [weatherData, trafficData, eventData, poiData, surgeMetrics] = await Promise.all([
      this.getWeatherImpact(request.pickup_lat, request.pickup_lng),
      this.getTrafficImpact(request.pickup_lat, request.pickup_lng),
      this.getEventImpact(request.pickup_lat, request.pickup_lng, new Date(request.timestamp)),
      this.getPOIImpact(request.pickup_lat, request.pickup_lng),
      this.getSupplyDemandMetrics(pickup_h3, request.service_type)
    ]);
    
    return {
      weather_impact: weatherData.multiplier,
      traffic_impact: trafficData.multiplier,
      event_impact: eventData.multiplier,
      poi_impact: poiData.multiplier,
      supply_demand_ratio: surgeMetrics.ratio,
      time_of_day_factor: this.getTimeOfDayFactor(new Date(request.timestamp))
    };
  }
  
  /**
   * Weather impact calculation
   */
  private async getWeatherImpact(lat: number, lng: number): Promise<{multiplier: number, condition: string}> {
    try {
      // In production, this would fetch from weather service
      // For now, return simulated weather data
      const conditions = ['sunny', 'cloudy', 'light_rain', 'heavy_rain', 'storm'];
      const multipliers = [1.0, 1.0, 1.2, 1.5, 2.0];
      
      const randomIndex = Math.floor(Math.random() * conditions.length);
      return {
        multiplier: multipliers[randomIndex],
        condition: conditions[randomIndex]
      };
    } catch (error) {
      return { multiplier: 1.0, condition: 'unknown' };
    }
  }
  
  /**
   * Traffic impact calculation
   */
  private async getTrafficImpact(lat: number, lng: number): Promise<{multiplier: number, level: string}> {
    try {
      // Simulate traffic levels: light, moderate, heavy, severe
      const levels = ['light', 'moderate', 'heavy', 'severe'];
      const multipliers = [1.0, 1.1, 1.3, 1.6];
      
      const randomIndex = Math.floor(Math.random() * levels.length);
      return {
        multiplier: multipliers[randomIndex],
        level: levels[randomIndex]
      };
    } catch (error) {
      return { multiplier: 1.0, level: 'unknown' };
    }
  }
  
  /**
   * Event impact calculation
   */
  private async getEventImpact(lat: number, lng: number, timestamp: Date): Promise<{multiplier: number, events: string[]}> {
    try {
      // Check for nearby events affecting demand
      // This would query the events table in production
      const nearbyEvents: string[] = [];
      let multiplier = 1.0;
      
      // Simulate event detection
      if (Math.random() < 0.2) { // 20% chance of nearby event
        nearbyEvents.push('Concert at Mall of Asia');
        multiplier = 1.4;
      }
      
      return { multiplier, events: nearbyEvents };
    } catch (error) {
      return { multiplier: 1.0, events: [] };
    }
  }
  
  /**
   * Point of Interest impact calculation
   */
  private async getPOIImpact(lat: number, lng: number): Promise<{multiplier: number, pois: string[]}> {
    try {
      // Check for high-demand POIs nearby
      const nearbyPOIs: string[] = [];
      let multiplier = 1.0;
      
      // Simulate POI detection (airports, malls, business districts)
      const poiTypes = ['airport', 'mall', 'business_district', 'hospital', 'university'];
      const poiMultipliers = [1.8, 1.3, 1.4, 1.2, 1.1];
      
      if (Math.random() < 0.3) { // 30% chance of being near a POI
        const poiIndex = Math.floor(Math.random() * poiTypes.length);
        nearbyPOIs.push(poiTypes[poiIndex]);
        multiplier = poiMultipliers[poiIndex];
      }
      
      return { multiplier, pois: nearbyPOIs };
    } catch (error) {
      return { multiplier: 1.0, pois: [] };
    }
  }
  
  /**
   * Time of day impact factor
   */
  private getTimeOfDayFactor(timestamp: Date): number {
    const hour = timestamp.getHours();
    
    // Peak hours: 7-9 AM, 5-8 PM
    if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 20)) {
      return 1.3; // Peak hours
    }
    
    // Late night: 10 PM - 5 AM
    if (hour >= 22 || hour <= 5) {
      return 1.2; // Late night premium
    }
    
    return 1.0; // Normal hours
  }
  
  /**
   * Get current supply/demand metrics for an area
   */
  private async getSupplyDemandMetrics(h3_cell: string, service_type: string): Promise<{ratio: number, supply: number, demand: number}> {
    try {
      // Simulate supply/demand calculation
      // In production, this would query real-time driver and trip data
      const supply = Math.floor(Math.random() * 20) + 5; // 5-25 available drivers
      const demand = Math.floor(Math.random() * 15) + 3; // 3-18 trip requests
      
      const ratio = demand / Math.max(supply, 1);
      
      return { ratio, supply, demand };
    } catch (error) {
      return { ratio: 1.0, supply: 10, demand: 10 };
    }
  }
  
  /**
   * Get base pricing rule for service type
   */
  private async getPricingRule(service_type: string): Promise<PricingRule> {
    // Default pricing rules per service type (as per PRD)
    const defaultRules: Record<string, Omit<PricingRule, 'id' | 'geographic_scope' | 'effective_date'>> = {
      tnvs_standard: {
        service_type: 'tnvs_standard',
        base_fare: 50.00,
        per_km_rate: 12.00,
        per_minute_rate: 2.00,
        surge_cap: 5.0,
        ltfrb_approved: true
      },
      tnvs_premium: {
        service_type: 'tnvs_premium',
        base_fare: 100.00,
        per_km_rate: 25.00,
        per_minute_rate: 4.50,
        surge_cap: 3.0,
        ltfrb_approved: true
      },
      taxi_regular: {
        service_type: 'taxi_regular',
        base_fare: 40.00,
        per_km_rate: 13.50,
        per_minute_rate: 2.50,
        surge_cap: 2.0,
        ltfrb_approved: true
      },
      taxi_premium: {
        service_type: 'taxi_premium',
        base_fare: 70.00,
        per_km_rate: 16.00,
        per_minute_rate: 3.00,
        surge_cap: 2.5,
        ltfrb_approved: true
      },
      mc_taxi: {
        service_type: 'mc_taxi',
        base_fare: 30.00,
        per_km_rate: 10.00,
        per_minute_rate: 2.00,
        surge_cap: 4.0,
        ltfrb_approved: true
      }
    };
    
    const rule = defaultRules[service_type];
    if (!rule) {
      throw new Error(`Unknown service type: ${service_type}`);
    }
    
    return {
      id: `rule_${service_type}`,
      geographic_scope: { type: 'city', city: 'Metro Manila' },
      effective_date: new Date(),
      ...rule
    };
  }
  
  /**
   * Get current surge state for a location and service
   */
  private async getSurgeState(h3_cell: string, service_type: string): Promise<SurgeState> {
    // Simulate current surge state
    return {
      h3_cell_id: h3_cell,
      service_type,
      current_multiplier: 1.0,
      supply_count: 15,
      demand_count: 12,
      supply_demand_ratio: 0.8,
      active_trips: 8,
      factors: {
        weather_impact: 1.0,
        traffic_impact: 1.0,
        event_impact: 1.0,
        poi_impact: 1.0,
        supply_demand_ratio: 0.8,
        time_of_day_factor: 1.0
      },
      timestamp: new Date(),
      expires_at: new Date(Date.now() + 300000) // 5 minutes
    };
  }
  
  /**
   * Check regulatory compliance
   */
  private checkRegulatoryCompliance(
    calculatedFare: number,
    service_type: string,
    limits: any
  ): RegulatoryCompliance {
    // LTFRB maximum fare limits (simulated)
    const maxFares: Record<string, number> = {
      tnvs_standard: 1000.00,
      tnvs_premium: 2000.00,
      taxi_regular: 800.00,
      taxi_premium: 1200.00,
      mc_taxi: 500.00
    };
    
    const maxAllowed = maxFares[service_type] || 1000.00;
    const isCompliant = calculatedFare <= maxAllowed;
    
    return {
      ltfrb_compliant: isCompliant,
      max_allowed_fare: maxAllowed,
      regulation_version: '2025-01',
      violations: isCompliant ? undefined : ['Exceeds maximum fare limit']
    };
  }
  
  /**
   * Get active executive overrides
   */
  private async getActiveOverrides(h3_cell: string, service_type: string): Promise<any[]> {
    // Simulate checking for active overrides
    // In production, this would query the executive_overrides table
    return [];
  }
  
  /**
   * Get regulatory limits
   */
  private async getRegulatoryLimits(service_type: string): Promise<any> {
    return {
      max_surge_multiplier: service_type.startsWith('taxi') ? 2.0 : 5.0,
      max_base_fare: 200.00
    };
  }
  
  /**
   * Log pricing decision for audit trail
   */
  private async logPricingDecision(
    request: PricingRequest,
    response: PricingResponse,
    metadata: any
  ): Promise<void> {
    try {
      // In production, this would insert into pricing_decisions table
      console.log('Pricing decision logged:', {
        quote_id: response.quote_id,
        service_type: request.service_type,
        total_fare: response.total_fare,
        surge_multiplier: response.surge_multiplier,
        processing_time: metadata.processing_time_ms,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to log pricing decision:', error);
      // Don't fail the pricing request due to logging error
    }
  }
  
  /**
   * Generate fallback pricing on system error
   */
  private generateFallbackPricing(request: PricingRequest, rule: PricingRule): PricingResponse {
    const baseFare = rule.base_fare;
    const distanceFare = request.estimated_distance_km * rule.per_km_rate;
    const timeFare = request.estimated_duration_min * rule.per_minute_rate;
    const totalFare = baseFare + distanceFare + timeFare;
    
    return {
      quote_id: this.generateQuoteId(),
      base_fare: baseFare,
      distance_fare: distanceFare,
      time_fare: timeFare,
      surge_multiplier: 1.0,
      surge_amount: 0,
      total_fare: totalFare,
      currency: 'PHP',
      expires_at: new Date(Date.now() + this.QUOTE_EXPIRY_MINUTES * 60000).toISOString(),
      fare_breakdown: {
        base: baseFare,
        distance: distanceFare,
        time: timeFare,
        surge_amount: 0
      },
      regulatory_compliance: {
        ltfrb_compliant: true,
        max_allowed_fare: totalFare * 2,
        regulation_version: '2025-01'
      },
      factors: {
        weather_impact: 1.0,
        traffic_impact: 1.0,
        event_impact: 1.0,
        poi_impact: 1.0,
        supply_demand_ratio: 1.0,
        time_of_day_factor: 1.0
      }
    };
  }
  
  /**
   * Generate unique quote ID
   */
  private generateQuoteId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `quote_${timestamp}_${random}`;
  }
}

// ============================================================================
// SURGE CALCULATION SERVICE
// ============================================================================

export class SurgeCalculationService {
  private readonly UPDATE_INTERVAL_MS = 30000; // 30 seconds
  private readonly H3_RESOLUTION = 8;
  
  /**
   * Continuous surge calculation process
   */
  async startSurgeCalculation(): Promise<void> {
    console.log('Starting surge calculation service...');
    
    setInterval(async () => {
      try {
        await this.calculateSurgeForAllZones();
      } catch (error) {
        console.error('Surge calculation error:', error);
      }
    }, this.UPDATE_INTERVAL_MS);
  }
  
  /**
   * Calculate surge for all active zones
   */
  private async calculateSurgeForAllZones(): Promise<void> {
    // Get all active zones from database
    const activeZones = await this.getActiveZones();
    
    // Calculate surge for each zone in parallel
    const surgePromises = activeZones.map(zone => this.calculateZoneSurge(zone));
    await Promise.all(surgePromises);
  }
  
  /**
   * Calculate surge for a specific zone
   */
  private async calculateZoneSurge(zone: any): Promise<void> {
    const serviceTypes = ['tnvs_standard', 'tnvs_premium', 'taxi_regular', 'taxi_premium', 'mc_taxi'];
    
    for (const serviceType of serviceTypes) {
      const surgeState = await this.computeSurgeState(zone.h3_cell_id, serviceType);
      await this.updateSurgeState(surgeState);
    }
  }
  
  /**
   * Compute surge state for a zone and service type
   */
  private async computeSurgeState(h3CellId: string, serviceType: string): Promise<SurgeState> {
    // Get real-time metrics
    const [supplyCount, demandCount, activeTrips] = await Promise.all([
      this.getSupplyCount(h3CellId, serviceType),
      this.getDemandCount(h3CellId, serviceType),
      this.getActiveTripsCount(h3CellId, serviceType)
    ]);
    
    const supplyDemandRatio = demandCount / Math.max(supplyCount, 1);
    
    // Get external factors
    const factors = await this.getExternalFactorsForZone(h3CellId);
    
    // Calculate surge multiplier
    const currentMultiplier = this.calculateSurgeMultiplier(supplyDemandRatio, factors);
    
    return {
      h3_cell_id: h3CellId,
      service_type: serviceType,
      current_multiplier: currentMultiplier,
      supply_count: supplyCount,
      demand_count: demandCount,
      supply_demand_ratio: supplyDemandRatio,
      active_trips: activeTrips,
      factors,
      timestamp: new Date(),
      expires_at: new Date(Date.now() + 300000) // 5 minutes
    };
  }
  
  private calculateSurgeMultiplier(supplyDemandRatio: number, factors: PricingFactors): number {
    let multiplier = 1.0;
    
    // Base surge from supply/demand
    if (supplyDemandRatio >= 3.0) multiplier = 2.5;
    else if (supplyDemandRatio >= 2.0) multiplier = 2.0;
    else if (supplyDemandRatio >= 1.5) multiplier = 1.5;
    else if (supplyDemandRatio >= 1.2) multiplier = 1.2;
    
    // Apply external factors
    multiplier *= factors.weather_impact;
    multiplier *= factors.traffic_impact;
    multiplier *= factors.event_impact;
    multiplier *= factors.poi_impact;
    
    return Math.min(Math.round(multiplier * 100) / 100, 5.0); // Cap at 5.0x
  }
  
  // Mock methods for simulation
  private async getActiveZones(): Promise<any[]> {
    // Return mock zones for Metro Manila
    return [
      { h3_cell_id: '881f1a4a8bfffff', name: 'Makati CBD' },
      { h3_cell_id: '881f1a4a87fffff', name: 'BGC' },
      { h3_cell_id: '881f1a4a83fffff', name: 'Ortigas' },
      { h3_cell_id: '881f1a4a8ffffff', name: 'Quezon City' }
    ];
  }
  
  private async getSupplyCount(h3CellId: string, serviceType: string): Promise<number> {
    return Math.floor(Math.random() * 20) + 5;
  }
  
  private async getDemandCount(h3CellId: string, serviceType: string): Promise<number> {
    return Math.floor(Math.random() * 15) + 3;
  }
  
  private async getActiveTripsCount(h3CellId: string, serviceType: string): Promise<number> {
    return Math.floor(Math.random() * 10) + 2;
  }
  
  private async getExternalFactorsForZone(h3CellId: string): Promise<PricingFactors> {
    return {
      weather_impact: 1.0 + (Math.random() * 0.5),
      traffic_impact: 1.0 + (Math.random() * 0.6),
      event_impact: Math.random() > 0.8 ? 1.4 : 1.0,
      poi_impact: 1.0 + (Math.random() * 0.3),
      supply_demand_ratio: Math.random() * 3,
      time_of_day_factor: 1.0 + (Math.random() * 0.3)
    };
  }
  
  private async updateSurgeState(surgeState: SurgeState): Promise<void> {
    // In production, this would update the surge_state table
    console.log(`Surge updated for ${surgeState.h3_cell_id}/${surgeState.service_type}: ${surgeState.current_multiplier}x`);
  }
}

// ============================================================================
// EXPORT DEFAULT INSTANCE
// ============================================================================

export const dynamicPricingEngine = new DynamicPricingEngine();
export const surgeCalculationService = new SurgeCalculationService();