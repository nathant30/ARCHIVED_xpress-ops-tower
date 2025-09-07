/**
 * Express Ops Tower - Simulation and Analytics Engine
 * Monte Carlo pricing simulations and revenue optimization
 * Based on PRD v1.0 - September 2025
 */

import { z } from 'zod';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface SimulationRequest {
  simulation_type: SimulationType;
  scenario_name: string;
  parameters: SimulationParameters;
  time_horizon_days: number;
  iterations: number;
  confidence_level: number; // 0.90, 0.95, 0.99
}

export interface SimulationParameters {
  // Pricing changes
  base_fare_change_pct?: number;
  surge_cap_change?: number;
  booking_fee_change?: number;
  
  // Market conditions
  demand_elasticity?: number;
  competitor_response_probability?: number;
  seasonal_adjustment?: number;
  
  // External factors
  weather_impact_days?: number;
  event_impact_multiplier?: number;
  supply_availability_pct?: number;
  
  // Geographic scope
  geographic_scope?: {
    type: 'city' | 'region' | 'zone';
    areas: string[];
  };
  
  // Service types affected
  service_types?: string[];
}

export interface SimulationResult {
  simulation_id: string;
  request: SimulationRequest;
  status: 'running' | 'completed' | 'failed';
  progress_pct: number;
  results?: SimulationOutcome;
  error_message?: string;
  started_at: Date;
  completed_at?: Date;
  execution_time_ms?: number;
}

export interface SimulationOutcome {
  // Revenue projections
  baseline_revenue: number;
  projected_revenue: RevenueProjection;
  revenue_impact: {
    absolute_change: number;
    percentage_change: number;
    confidence_interval: [number, number];
  };
  
  // Trip volume projections
  baseline_trips: number;
  projected_trips: TripProjection;
  trip_impact: {
    absolute_change: number;
    percentage_change: number;
    confidence_interval: [number, number];
  };
  
  // Market share analysis
  market_share_impact: {
    current_share: number;
    projected_share: number;
    competitor_response_scenarios: CompetitorResponse[];
  };
  
  // Customer behavior
  customer_impact: CustomerImpactAnalysis;
  
  // Driver economics
  driver_impact: DriverImpactAnalysis;
  
  // Risk assessment
  risk_factors: RiskFactor[];
  
  // Recommendations
  recommendations: Recommendation[];
  
  // Detailed breakdown by time period
  daily_projections: DailyProjection[];
}

export type SimulationType = 
  | 'pricing_change' 
  | 'surge_optimization' 
  | 'competitor_response' 
  | 'market_expansion' 
  | 'seasonal_adjustment'
  | 'regulatory_compliance'
  | 'emergency_scenario';

interface RevenueProjection {
  mean: number;
  median: number;
  std_dev: number;
  percentiles: {
    p10: number;
    p25: number;
    p75: number;
    p90: number;
    p95: number;
    p99: number;
  };
}

interface TripProjection {
  mean: number;
  median: number;
  std_dev: number;
  by_service_type: Record<string, number>;
}

interface CompetitorResponse {
  competitor: string;
  response_type: 'price_match' | 'promotional' | 'service_enhancement' | 'no_response';
  probability: number;
  impact_on_market_share: number;
}

interface CustomerImpactAnalysis {
  satisfaction_score_change: number;
  churn_probability_change: number;
  price_sensitivity_by_segment: Record<string, number>;
  complaints_projection: number;
}

interface DriverImpactAnalysis {
  avg_earnings_change: number;
  supply_response: number; // Expected change in driver availability
  satisfaction_impact: number;
  utilization_rate_change: number;
}

interface RiskFactor {
  factor_type: 'regulatory' | 'competitive' | 'operational' | 'financial';
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  probability: number;
  potential_impact: number;
  mitigation_strategies: string[];
}

interface Recommendation {
  recommendation_type: 'pricing' | 'operational' | 'strategic' | 'risk_mitigation';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  expected_benefit: string;
  implementation_complexity: 'low' | 'medium' | 'high';
  timeline: string;
}

interface DailyProjection {
  date: string;
  revenue: number;
  trips: number;
  avg_fare: number;
  surge_hours: number;
  market_conditions: {
    demand_level: number;
    supply_level: number;
    external_factors: string[];
  };
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const SimulationRequestSchema = z.object({
  simulation_type: z.enum(['pricing_change', 'surge_optimization', 'competitor_response', 'market_expansion', 'seasonal_adjustment', 'regulatory_compliance', 'emergency_scenario']),
  scenario_name: z.string().min(5).max(100),
  parameters: z.object({
    base_fare_change_pct: z.number().min(-50).max(100).optional(),
    surge_cap_change: z.number().min(1.0).max(10.0).optional(),
    booking_fee_change: z.number().min(-100).max(200).optional(),
    demand_elasticity: z.number().min(-3.0).max(0.0).optional(),
    competitor_response_probability: z.number().min(0).max(1).optional(),
    seasonal_adjustment: z.number().min(0.5).max(2.0).optional(),
    weather_impact_days: z.number().min(0).max(30).optional(),
    event_impact_multiplier: z.number().min(1.0).max(3.0).optional(),
    supply_availability_pct: z.number().min(0.5).max(1.5).optional(),
    geographic_scope: z.object({
      type: z.enum(['city', 'region', 'zone']),
      areas: z.array(z.string())
    }).optional(),
    service_types: z.array(z.string()).optional()
  }),
  time_horizon_days: z.number().min(1).max(365),
  iterations: z.number().min(1000).max(100000),
  confidence_level: z.enum([0.90, 0.95, 0.99])
});

// ============================================================================
// SIMULATION ENGINE CLASS
// ============================================================================

export class SimulationEngine {
  private readonly MAX_CONCURRENT_SIMULATIONS = 5;
  private readonly activeSimulations = new Map<string, SimulationResult>();
  
  // Historical data for baseline calculations (in production, from database)
  private readonly historicalMetrics = {
    daily_avg_revenue: 2500000, // ₱2.5M daily average
    daily_avg_trips: 8750,
    avg_fare: 285.71,
    market_share: 0.35, // 35% market share
    customer_satisfaction: 4.2,
    driver_satisfaction: 3.8,
    demand_elasticity: -0.8, // 1% price increase = 0.8% demand decrease
    seasonal_patterns: {
      peak_months: [11, 12, 1], // Holiday season
      low_months: [2, 3, 4], // Post-holiday
      weather_impact: 0.15 // 15% revenue increase during typhoons
    }
  };

  /**
   * Start a new pricing simulation
   */
  async startSimulation(request: SimulationRequest): Promise<SimulationResult> {
    // Validate request
    const validatedRequest = SimulationRequestSchema.parse(request);
    
    // Check concurrent simulation limit
    if (this.activeSimulations.size >= this.MAX_CONCURRENT_SIMULATIONS) {
      throw new Error('Maximum concurrent simulations reached. Please wait for existing simulations to complete.');
    }
    
    // Create simulation result
    const simulation: SimulationResult = {
      simulation_id: this.generateSimulationId(),
      request: validatedRequest,
      status: 'running',
      progress_pct: 0,
      started_at: new Date()
    };
    
    this.activeSimulations.set(simulation.simulation_id, simulation);
    
    // Start simulation asynchronously
    this.runSimulation(simulation);
    
    return simulation;
  }
  
  /**
   * Get simulation status and results
   */
  async getSimulationResult(simulationId: string): Promise<SimulationResult | null> {
    return this.activeSimulations.get(simulationId) || null;
  }
  
  /**
   * List all simulations
   */
  async listSimulations(): Promise<SimulationResult[]> {
    return Array.from(this.activeSimulations.values());
  }
  
  /**
   * Cancel a running simulation
   */
  async cancelSimulation(simulationId: string): Promise<boolean> {
    const simulation = this.activeSimulations.get(simulationId);
    if (simulation && simulation.status === 'running') {
      simulation.status = 'failed';
      simulation.error_message = 'Simulation cancelled by user';
      simulation.completed_at = new Date();
      return true;
    }
    return false;
  }
  
  /**
   * Run quick pricing impact analysis (simplified)
   */
  async quickImpactAnalysis(
    priceChangePct: number,
    affectedServiceTypes: string[] = ['all']
  ): Promise<{
    estimated_revenue_impact: number;
    estimated_trip_impact: number;
    customer_satisfaction_risk: 'low' | 'medium' | 'high';
    competitor_response_risk: 'low' | 'medium' | 'high';
  }> {
    // Simplified impact calculation using elasticity
    const elasticity = this.historicalMetrics.demand_elasticity;
    const tripImpactPct = elasticity * priceChangePct;
    const revenueImpactPct = priceChangePct + tripImpactPct;
    
    const estimatedRevenueImpact = this.historicalMetrics.daily_avg_revenue * (revenueImpactPct / 100) * 30; // 30-day impact
    const estimatedTripImpact = this.historicalMetrics.daily_avg_trips * (tripImpactPct / 100) * 30;
    
    // Risk assessment
    const customerSatisfactionRisk = Math.abs(priceChangePct) > 20 ? 'high' : Math.abs(priceChangePct) > 10 ? 'medium' : 'low';
    const competitorResponseRisk = Math.abs(priceChangePct) > 15 ? 'high' : Math.abs(priceChangePct) > 7 ? 'medium' : 'low';
    
    return {
      estimated_revenue_impact: estimatedRevenueImpact,
      estimated_trip_impact: estimatedTripImpact,
      customer_satisfaction_risk: customerSatisfactionRisk,
      competitor_response_risk: competitorResponseRisk
    };
  }
  
  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================
  
  private async runSimulation(simulation: SimulationResult): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Update progress
      simulation.progress_pct = 10;
      
      // Initialize baseline metrics
      const baselineRevenue = this.calculateBaselineRevenue(simulation.request);
      const baselineTrips = this.calculateBaselineTrips(simulation.request);
      
      simulation.progress_pct = 25;
      
      // Run Monte Carlo simulation
      const monteCarloResults = await this.runMonteCarloSimulation(simulation.request);
      
      simulation.progress_pct = 60;
      
      // Analyze market impact
      const marketImpact = await this.analyzeMarketImpact(simulation.request, monteCarloResults);
      
      simulation.progress_pct = 80;
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(simulation.request, monteCarloResults, marketImpact);
      
      // Calculate risk factors
      const riskFactors = this.assessRiskFactors(simulation.request, monteCarloResults);
      
      simulation.progress_pct = 95;
      
      // Compile final results
      const outcome: SimulationOutcome = {
        baseline_revenue: baselineRevenue,
        projected_revenue: monteCarloResults.revenue,
        revenue_impact: {
          absolute_change: monteCarloResults.revenue.mean - baselineRevenue,
          percentage_change: ((monteCarloResults.revenue.mean - baselineRevenue) / baselineRevenue) * 100,
          confidence_interval: [monteCarloResults.revenue.percentiles.p10, monteCarloResults.revenue.percentiles.p90]
        },
        baseline_trips: baselineTrips,
        projected_trips: monteCarloResults.trips,
        trip_impact: {
          absolute_change: monteCarloResults.trips.mean - baselineTrips,
          percentage_change: ((monteCarloResults.trips.mean - baselineTrips) / baselineTrips) * 100,
          confidence_interval: [monteCarloResults.trips.mean - monteCarloResults.trips.std_dev, monteCarloResults.trips.mean + monteCarloResults.trips.std_dev]
        },
        market_share_impact: marketImpact.market_share,
        customer_impact: marketImpact.customer_impact,
        driver_impact: marketImpact.driver_impact,
        risk_factors: riskFactors,
        recommendations: recommendations,
        daily_projections: this.generateDailyProjections(simulation.request, monteCarloResults)
      };
      
      simulation.results = outcome;
      simulation.status = 'completed';
      simulation.progress_pct = 100;
      simulation.completed_at = new Date();
      simulation.execution_time_ms = Date.now() - startTime;
      
    } catch (error) {
      simulation.status = 'failed';
      simulation.error_message = error instanceof Error ? error.message : 'Unknown error';
      simulation.completed_at = new Date();
      simulation.execution_time_ms = Date.now() - startTime;
    }
    
    // Clean up completed simulation after 1 hour
    setTimeout(() => {
      this.activeSimulations.delete(simulation.simulation_id);
    }, 60 * 60 * 1000);
  }
  
  private calculateBaselineRevenue(request: SimulationRequest): number {
    const timeHorizon = request.time_horizon_days;
    return this.historicalMetrics.daily_avg_revenue * timeHorizon;
  }
  
  private calculateBaselineTrips(request: SimulationRequest): number {
    const timeHorizon = request.time_horizon_days;
    return this.historicalMetrics.daily_avg_trips * timeHorizon;
  }
  
  private async runMonteCarloSimulation(request: SimulationRequest): Promise<{
    revenue: RevenueProjection;
    trips: TripProjection;
  }> {
    const iterations = request.iterations;
    const revenueResults: number[] = [];
    const tripResults: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      // Generate random variations for each iteration
      const demandVariation = this.generateRandomNormal(1.0, 0.1); // 10% std dev
      const seasonalFactor = this.getSeasonalFactor();
      const competitorFactor = this.generateCompetitorResponseFactor(request);
      const externalFactor = this.generateExternalFactor(request);
      
      // Calculate price impact
      const priceChange = request.parameters.base_fare_change_pct || 0;
      const elasticity = this.historicalMetrics.demand_elasticity;
      const demandImpact = 1 + (elasticity * priceChange / 100);
      
      // Calculate iteration results
      const baseRevenue = this.historicalMetrics.daily_avg_revenue * request.time_horizon_days;
      const baseTrips = this.historicalMetrics.daily_avg_trips * request.time_horizon_days;
      
      const iterationRevenue = baseRevenue * 
        (1 + priceChange / 100) * // Price effect
        demandImpact * // Elasticity effect
        demandVariation * // Random variation
        seasonalFactor * // Seasonal adjustment
        competitorFactor * // Competitor response
        externalFactor; // External factors
      
      const iterationTrips = baseTrips * 
        demandImpact * 
        demandVariation * 
        seasonalFactor * 
        competitorFactor * 
        externalFactor;
      
      revenueResults.push(iterationRevenue);
      tripResults.push(iterationTrips);
    }
    
    // Calculate statistical measures
    const revenue = this.calculateStatistics(revenueResults);
    const trips = {
      mean: this.mean(tripResults),
      median: this.median(tripResults),
      std_dev: this.stdDev(tripResults),
      by_service_type: {
        'tnvs_standard': this.mean(tripResults) * 0.4,
        'tnvs_premium': this.mean(tripResults) * 0.2,
        'taxi_regular': this.mean(tripResults) * 0.25,
        'taxi_premium': this.mean(tripResults) * 0.1,
        'mc_taxi': this.mean(tripResults) * 0.05
      }
    };
    
    return { revenue, trips };
  }
  
  private async analyzeMarketImpact(
    request: SimulationRequest, 
    monteCarloResults: any
  ): Promise<{
    market_share: any;
    customer_impact: CustomerImpactAnalysis;
    driver_impact: DriverImpactAnalysis;
  }> {
    const priceChange = request.parameters.base_fare_change_pct || 0;
    
    // Market share analysis
    const currentShare = this.historicalMetrics.market_share;
    const shareImpact = -priceChange * 0.005; // Simplified: 1% price increase = 0.5% share loss
    const projectedShare = Math.max(0.1, Math.min(0.9, currentShare + shareImpact));
    
    const competitor_responses: CompetitorResponse[] = [
      {
        competitor: 'Grab',
        response_type: Math.abs(priceChange) > 10 ? 'price_match' : 'no_response',
        probability: Math.abs(priceChange) > 10 ? 0.8 : 0.2,
        impact_on_market_share: Math.abs(priceChange) > 10 ? -0.05 : 0
      }
    ];
    
    // Customer impact
    const customer_impact: CustomerImpactAnalysis = {
      satisfaction_score_change: -Math.abs(priceChange) * 0.02, // Price increases reduce satisfaction
      churn_probability_change: Math.abs(priceChange) > 15 ? 0.1 : Math.abs(priceChange) * 0.003,
      price_sensitivity_by_segment: {
        'premium_users': 0.3,
        'regular_users': 0.8,
        'price_sensitive': 1.5
      },
      complaints_projection: Math.abs(priceChange) * 10
    };
    
    // Driver impact
    const driver_impact: DriverImpactAnalysis = {
      avg_earnings_change: priceChange * 0.7, // Drivers get ~70% of price increases
      supply_response: priceChange > 0 ? 0.05 : -0.03, // Positive prices attract drivers
      satisfaction_impact: priceChange * 0.01,
      utilization_rate_change: -Math.abs(priceChange) * 0.002 // Higher prices might reduce demand
    };
    
    return {
      market_share: {
        current_share: currentShare,
        projected_share: projectedShare,
        competitor_response_scenarios: competitor_responses
      },
      customer_impact,
      driver_impact
    };
  }
  
  private generateRecommendations(
    request: SimulationRequest,
    monteCarloResults: any,
    marketImpact: any
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const priceChange = request.parameters.base_fare_change_pct || 0;
    const revenueImpact = monteCarloResults.revenue.mean;
    
    // Pricing recommendations
    if (Math.abs(priceChange) > 20) {
      recommendations.push({
        recommendation_type: 'pricing',
        priority: 'high',
        title: 'Consider Gradual Price Implementation',
        description: 'Large price changes can shock customers. Consider implementing the change in 2-3 phases over 4-6 weeks.',
        expected_benefit: 'Reduced customer churn and complaints',
        implementation_complexity: 'medium',
        timeline: '4-6 weeks'
      });
    }
    
    // Competitive strategy
    if (marketImpact.market_share.projected_share < marketImpact.market_share.current_share * 0.95) {
      recommendations.push({
        recommendation_type: 'strategic',
        priority: 'high',
        title: 'Prepare Competitive Response Plan',
        description: 'Market share risk detected. Prepare promotional campaigns and service enhancements.',
        expected_benefit: 'Maintain market position',
        implementation_complexity: 'high',
        timeline: '2-4 weeks'
      });
    }
    
    // Customer retention
    if (marketImpact.customer_impact.satisfaction_score_change < -0.2) {
      recommendations.push({
        recommendation_type: 'operational',
        priority: 'medium',
        title: 'Enhance Customer Communication',
        description: 'Proactively communicate value proposition and service improvements to offset price sensitivity.',
        expected_benefit: 'Improved customer acceptance',
        implementation_complexity: 'low',
        timeline: '1-2 weeks'
      });
    }
    
    // Revenue optimization
    if (revenueImpact > 0) {
      recommendations.push({
        recommendation_type: 'pricing',
        priority: 'low',
        title: 'Monitor Revenue Realization',
        description: 'Track actual vs. projected revenue closely in first 2 weeks of implementation.',
        expected_benefit: 'Early detection of deviations',
        implementation_complexity: 'low',
        timeline: 'Ongoing'
      });
    }
    
    return recommendations;
  }
  
  private assessRiskFactors(request: SimulationRequest, monteCarloResults: any): RiskFactor[] {
    const riskFactors: RiskFactor[] = [];
    const priceChange = request.parameters.base_fare_change_pct || 0;
    
    // Regulatory risk
    if (Math.abs(priceChange) > 25) {
      riskFactors.push({
        factor_type: 'regulatory',
        risk_level: 'high',
        description: 'Large fare changes may trigger LTFRB review',
        probability: 0.7,
        potential_impact: 0.3,
        mitigation_strategies: [
          'Pre-file fare change with LTFRB',
          'Prepare regulatory justification',
          'Engage with regulatory affairs team'
        ]
      });
    }
    
    // Competitive risk
    if (priceChange > 15) {
      riskFactors.push({
        factor_type: 'competitive',
        risk_level: 'medium',
        description: 'Competitors may respond with promotional pricing',
        probability: 0.6,
        potential_impact: 0.15,
        mitigation_strategies: [
          'Monitor competitor pricing closely',
          'Prepare counter-promotional offers',
          'Emphasize service quality differentiation'
        ]
      });
    }
    
    // Customer satisfaction risk
    if (Math.abs(priceChange) > 10) {
      riskFactors.push({
        factor_type: 'operational',
        risk_level: 'medium',
        description: 'Customer satisfaction may decline',
        probability: 0.8,
        potential_impact: 0.1,
        mitigation_strategies: [
          'Enhance customer service training',
          'Implement customer feedback monitoring',
          'Prepare retention campaigns'
        ]
      });
    }
    
    return riskFactors;
  }
  
  private generateDailyProjections(request: SimulationRequest, monteCarloResults: any): DailyProjection[] {
    const projections: DailyProjection[] = [];
    const dailyRevenue = monteCarloResults.revenue.mean / request.time_horizon_days;
    const dailyTrips = monteCarloResults.trips.mean / request.time_horizon_days;
    
    for (let i = 0; i < Math.min(30, request.time_horizon_days); i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      // Add some daily variation
      const variation = this.generateRandomNormal(1.0, 0.05);
      
      projections.push({
        date: date.toISOString().split('T')[0],
        revenue: dailyRevenue * variation,
        trips: Math.round(dailyTrips * variation),
        avg_fare: (dailyRevenue * variation) / (dailyTrips * variation),
        surge_hours: Math.floor(Math.random() * 6) + 2, // 2-8 hours
        market_conditions: {
          demand_level: Math.random() * 0.4 + 0.8, // 0.8-1.2
          supply_level: Math.random() * 0.3 + 0.85, // 0.85-1.15
          external_factors: []
        }
      });
    }
    
    return projections;
  }
  
  // ============================================================================
  // UTILITY METHODS
  // ============================================================================
  
  private generateSimulationId(): string {
    return `sim_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private generateRandomNormal(mean: number, stdDev: number): number {
    // Box-Muller transformation for normal distribution
    let u = 0, v = 0;
    while(u === 0) u = Math.random();
    while(v === 0) v = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return z * stdDev + mean;
  }
  
  private getSeasonalFactor(): number {
    const month = new Date().getMonth() + 1;
    if (this.historicalMetrics.seasonal_patterns.peak_months.includes(month)) {
      return 1.15; // 15% increase during peak
    } else if (this.historicalMetrics.seasonal_patterns.low_months.includes(month)) {
      return 0.90; // 10% decrease during low season
    }
    return 1.0;
  }
  
  private generateCompetitorResponseFactor(request: SimulationRequest): number {
    const responseProb = request.parameters.competitor_response_probability || 0.3;
    if (Math.random() < responseProb) {
      return 0.95; // 5% negative impact if competitors respond
    }
    return 1.0;
  }
  
  private generateExternalFactor(request: SimulationRequest): number {
    let factor = 1.0;
    
    // Weather impact
    if (request.parameters.weather_impact_days && request.parameters.weather_impact_days > 0) {
      factor *= (1 + this.historicalMetrics.seasonal_patterns.weather_impact);
    }
    
    // Event impact
    if (request.parameters.event_impact_multiplier) {
      factor *= request.parameters.event_impact_multiplier;
    }
    
    return factor;
  }
  
  private calculateStatistics(data: number[]): RevenueProjection {
    const sorted = [...data].sort((a, b) => a - b);
    const mean = this.mean(data);
    const stdDev = this.stdDev(data);
    
    return {
      mean,
      median: this.median(data),
      std_dev: stdDev,
      percentiles: {
        p10: this.percentile(sorted, 0.10),
        p25: this.percentile(sorted, 0.25),
        p75: this.percentile(sorted, 0.75),
        p90: this.percentile(sorted, 0.90),
        p95: this.percentile(sorted, 0.95),
        p99: this.percentile(sorted, 0.99)
      }
    };
  }
  
  private mean(data: number[]): number {
    return data.reduce((sum, val) => sum + val, 0) / data.length;
  }
  
  private median(data: number[]): number {
    const sorted = [...data].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }
  
  private stdDev(data: number[]): number {
    const mean = this.mean(data);
    const squaredDiffs = data.map(value => Math.pow(value - mean, 2));
    return Math.sqrt(this.mean(squaredDiffs));
  }
  
  private percentile(sortedData: number[], p: number): number {
    const index = p * (sortedData.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    
    if (lower === upper) {
      return sortedData[lower];
    }
    
    const weight = index - lower;
    return sortedData[lower] * (1 - weight) + sortedData[upper] * weight;
  }
}

// ============================================================================
// EXPORT DEFAULT INSTANCE
// ============================================================================

export const simulationEngine = new SimulationEngine();