// =====================================================
// PHILIPPINES PERFORMANCE ADJUSTMENT SERVICE - Localized Performance Management
// Philippines-specific adjustments for performance scoring, seasonal factors, and regional considerations
// =====================================================

import {
  OperatorPerformanceScore,
  PerformanceMetricsData,
  CommissionTier,
  ScoringFrequency
} from '@/types/operators';
import { logger } from '@/lib/security/productionLogger';
import { Redis } from 'ioredis';

export interface PhilippinesAdjustmentFactors {
  typhoon_season_adjustments: TyphoonSeasonAdjustment[];
  holiday_surge_bonuses: HolidaySurgeBonus[];
  regional_economic_factors: RegionalEconomicFactor[];
  jeepney_competition_analysis: JeepneyCompetitionAnalysis[];
  lgu_regulation_compliance: LGURegulationCompliance[];
  cultural_performance_factors: CulturalPerformanceFactor[];
  infrastructure_impact_adjustments: InfrastructureImpactAdjustment[];
  socioeconomic_adjustments: SocioeconomicAdjustment[];
}

export interface TyphoonSeasonAdjustment {
  adjustment_id: string;
  season_period: {
    start_month: number;
    end_month: number;
    peak_months: number[];
  };
  affected_metrics: {
    safety_incident_rate: {
      tolerance_increase: number; // percentage increase in acceptable rate
      weight_adjustment: number; // adjustment to metric weight
    };
    daily_vehicle_utilization: {
      threshold_reduction: number; // percentage reduction in expected utilization
      bonus_for_maintaining: number; // bonus points for maintaining service
    };
    driver_availability: {
      flexibility_bonus: number; // bonus for driver flexibility during storms
      retention_adjustment: number; // adjusted retention expectations
    };
  };
  severity_levels: {
    signal_1_2: TyphoonSeverityAdjustment;
    signal_3_4: TyphoonSeverityAdjustment;
    signal_5: TyphoonSeverityAdjustment;
  };
  regional_variations: { [region: string]: RegionalTyphoonAdjustment };
  is_active: boolean;
  created_at: string;
}

export interface TyphoonSeverityAdjustment {
  safety_grace_period: number; // days of grace period post-typhoon
  utilization_adjustment: number; // percentage adjustment
  compliance_flexibility: number; // additional flexibility in compliance requirements
  recovery_bonus: number; // bonus points for quick recovery
}

export interface RegionalTyphoonAdjustment {
  region_name: string;
  risk_level: 'low' | 'medium' | 'high' | 'extreme';
  additional_adjustment: number;
  specific_considerations: string[];
}

export interface HolidaySurgeBonus {
  bonus_id: string;
  holiday_name: string;
  holiday_type: 'national' | 'regional' | 'religious' | 'cultural';
  holiday_dates: string[]; // multiple dates for recurring holidays
  surge_multipliers: {
    customer_satisfaction: number;
    service_availability: number;
    platform_contribution: number;
    driver_participation: number;
  };
  bonus_conditions: {
    minimum_availability: number; // percentage
    service_quality_threshold: number;
    participation_rate_threshold: number;
  };
  regional_applicability: string[];
  cultural_significance: number; // 1-10 scale
  is_active: boolean;
}

export interface RegionalEconomicFactor {
  factor_id: string;
  region: string;
  economic_indicators: {
    gdp_per_capita_index: number; // relative to national average
    unemployment_rate: number;
    inflation_rate: number;
    fuel_price_index: number;
    minimum_wage_ratio: number;
  };
  adjustment_multipliers: {
    fleet_efficiency_expectation: number;
    revenue_targets: number;
    cost_structure_adjustment: number;
    competition_intensity: number;
  };
  socioeconomic_adjustments: {
    low_income_areas: number;
    middle_income_areas: number;
    high_income_areas: number;
    mixed_income_areas: number;
  };
  last_updated: string;
}

export interface JeepneyCompetitionAnalysis {
  analysis_id: string;
  route_id: string;
  route_name: string;
  jeepney_density: number; // jeepneys per km
  competition_intensity: 'low' | 'medium' | 'high' | 'extreme';
  impact_on_metrics: {
    service_area_coverage: {
      adjustment_factor: number;
      compensation_bonus: number;
    };
    customer_acquisition: {
      difficulty_multiplier: number;
      success_bonus: number;
    };
    utilization_expectations: {
      realistic_targets: number;
      achievement_bonus: number;
    };
  };
  competitive_advantages: {
    technology_edge: number;
    service_quality: number;
    pricing_flexibility: number;
    convenience_factor: number;
  };
  mitigation_strategies: string[];
  performance_compensation: number; // additional points for competing in high-jeepney areas
}

export interface LGURegulationCompliance {
  compliance_id: string;
  lgu_name: string;
  region: string;
  regulation_updates: LGURegulationUpdate[];
  compliance_requirements: {
    permits_required: string[];
    inspection_frequency: string;
    fee_structure: any;
    operational_restrictions: string[];
  };
  compliance_scoring_adjustments: {
    new_regulation_grace_period: number; // days
    complexity_bonus: number; // bonus for navigating complex regulations
    proactive_compliance_bonus: number;
    multi_lgu_operation_bonus: number;
  };
  penalty_adjustments: {
    minor_violations_tolerance: number;
    major_violations_impact: number;
    repeat_violations_escalation: number;
  };
  support_programs: string[];
}

export interface LGURegulationUpdate {
  update_id: string;
  update_date: string;
  regulation_type: 'permit' | 'operational' | 'safety' | 'environmental' | 'taxation';
  description: string;
  effective_date: string;
  grace_period: number; // days
  impact_level: 'low' | 'medium' | 'high' | 'critical';
  affected_operators: string[];
  compliance_actions: string[];
}

export interface CulturalPerformanceFactor {
  factor_id: string;
  cultural_element: 'bayanihan' | 'pakikipagkapwa' | 'utang_na_loob' | 'family_values' | 'religious_observance';
  description: string;
  performance_impact: {
    driver_relationships: number;
    customer_service: number;
    community_integration: number;
    conflict_resolution: number;
  };
  measurement_indicators: string[];
  adjustment_mechanism: {
    positive_reinforcement: number;
    cultural_sensitivity_bonus: number;
    community_engagement_multiplier: number;
  };
  regional_variations: { [region: string]: number };
}

export interface InfrastructureImpactAdjustment {
  adjustment_id: string;
  infrastructure_type: 'roads' | 'bridges' | 'flood_control' | 'traffic_systems' | 'telecommunications';
  condition_assessment: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  affected_regions: string[];
  performance_impact: {
    safety_incidents: number; // adjustment factor
    vehicle_maintenance: number;
    fuel_efficiency: number;
    service_reliability: number;
    driver_satisfaction: number;
  };
  adjustment_calculations: {
    base_adjustment: number;
    severity_multiplier: number;
    duration_factor: number;
    recovery_bonus: number;
  };
  monitoring_indicators: string[];
  improvement_timeline: string;
}

export interface SocioeconomicAdjustment {
  adjustment_id: string;
  socioeconomic_indicator: 'poverty_rate' | 'education_level' | 'technology_adoption' | 'financial_inclusion';
  regional_data: { [region: string]: number };
  adjustment_factors: {
    driver_training_expectations: number;
    technology_adoption_pace: number;
    financial_service_usage: number;
    communication_preferences: number;
  };
  support_program_multipliers: {
    training_programs: number;
    technology_assistance: number;
    financial_literacy: number;
    mentorship_programs: number;
  };
}

export interface PhilippinesPerformanceContext {
  operator_id: string;
  region: string;
  assessment_date: string;
  applicable_adjustments: {
    typhoon_season: boolean;
    active_holidays: string[];
    economic_factors: RegionalEconomicFactor;
    jeepney_competition: JeepneyCompetitionAnalysis[];
    lgu_regulations: LGURegulationCompliance[];
    cultural_factors: CulturalPerformanceFactor[];
    infrastructure_issues: InfrastructureImpactAdjustment[];
    socioeconomic_considerations: SocioeconomicAdjustment[];
  };
  total_adjustment_score: number;
  adjustment_breakdown: { [category: string]: number };
}

export class PhilippinesPerformanceAdjustmentService {
  private redis: Redis;
  private adjustmentFactors: PhilippinesAdjustmentFactors;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    });
    
    this.initializeAdjustmentFactors();
  }

  // =====================================================
  // CORE ADJUSTMENT ENGINE
  // =====================================================

  /**
   * Apply comprehensive Philippines-specific adjustments to performance metrics
   */
  async applyPhilippinesAdjustments(
    operatorId: string,
    originalMetrics: PerformanceMetricsData,
    scoringPeriod: string,
    region: string
  ): Promise<{
    adjustedMetrics: PerformanceMetricsData;
    adjustmentContext: PhilippinesPerformanceContext;
    adjustmentSummary: string;
  }> {
    try {
      logger.info('Applying Philippines-specific adjustments', { operatorId, region, scoringPeriod });

      const assessmentDate = new Date(scoringPeriod);
      const adjustedMetrics = { ...originalMetrics };

      // Get applicable adjustment context
      const context = await this.getPerformanceContext(operatorId, region, assessmentDate);

      // Apply typhoon season adjustments
      if (context.applicable_adjustments.typhoon_season) {
        await this.applyTyphoonSeasonAdjustments(adjustedMetrics, assessmentDate, region);
      }

      // Apply holiday surge bonuses
      for (const holiday of context.applicable_adjustments.active_holidays) {
        await this.applyHolidaySurgeBonuses(adjustedMetrics, holiday, region);
      }

      // Apply regional economic adjustments
      await this.applyRegionalEconomicAdjustments(
        adjustedMetrics,
        context.applicable_adjustments.economic_factors
      );

      // Apply jeepney competition adjustments
      for (const competition of context.applicable_adjustments.jeepney_competition) {
        await this.applyJeepneyCompetitionAdjustments(adjustedMetrics, competition);
      }

      // Apply LGU regulation compliance adjustments
      for (const regulation of context.applicable_adjustments.lgu_regulations) {
        await this.applyLGURegulationAdjustments(adjustedMetrics, regulation, assessmentDate);
      }

      // Apply cultural performance factors
      for (const cultural of context.applicable_adjustments.cultural_factors) {
        await this.applyCulturalPerformanceAdjustments(adjustedMetrics, cultural, region);
      }

      // Apply infrastructure impact adjustments
      for (const infrastructure of context.applicable_adjustments.infrastructure_issues) {
        await this.applyInfrastructureImpactAdjustments(adjustedMetrics, infrastructure);
      }

      // Apply socioeconomic adjustments
      for (const socioeconomic of context.applicable_adjustments.socioeconomic_considerations) {
        await this.applySocioeconomicAdjustments(adjustedMetrics, socioeconomic, region);
      }

      // Calculate total adjustment impact
      const adjustmentSummary = this.generateAdjustmentSummary(
        originalMetrics,
        adjustedMetrics,
        context
      );

      // Cache the adjustments
      await this.cacheAdjustments(operatorId, assessmentDate, context);

      logger.info('Philippines adjustments applied', {
        operatorId,
        totalAdjustments: context.total_adjustment_score,
        majorAdjustments: Object.keys(context.adjustment_breakdown).length
      });

      return {
        adjustedMetrics,
        adjustmentContext: context,
        adjustmentSummary
      };

    } catch (error) {
      logger.error('Failed to apply Philippines adjustments', { error, operatorId });
      throw error;
    }
  }

  // =====================================================
  // TYPHOON SEASON ADJUSTMENTS
  // =====================================================

  /**
   * Apply typhoon season performance adjustments
   */
  private async applyTyphoonSeasonAdjustments(
    metrics: PerformanceMetricsData,
    assessmentDate: Date,
    region: string
  ): Promise<void> {
    const month = assessmentDate.getMonth() + 1;
    const typhoonAdjustment = this.adjustmentFactors.typhoon_season_adjustments[0];

    if (!typhoonAdjustment || !this.isInTyphoonSeason(month)) {
      return;
    }

    // Get current typhoon severity
    const currentSeverity = await this.getCurrentTyphoonSeverity(region, assessmentDate);
    const severityAdjustment = typhoonAdjustment.severity_levels[currentSeverity];

    // Adjust safety incident rate tolerance
    if (metrics.safety_incident_rate && severityAdjustment) {
      const originalRate = metrics.safety_incident_rate;
      const adjustedTolerance = originalRate * (1 + severityAdjustment.utilization_adjustment / 100);
      
      // If within adjusted tolerance, apply grace
      if (originalRate <= adjustedTolerance) {
        metrics.safety_incident_rate = Math.max(0, originalRate - severityAdjustment.recovery_bonus);
      }
    }

    // Adjust vehicle utilization expectations
    if (metrics.daily_vehicle_utilization && severityAdjustment) {
      const utilizationBonus = typhoonAdjustment.affected_metrics.daily_vehicle_utilization.bonus_for_maintaining;
      
      // If operator maintained good service during typhoon season, apply bonus
      if (metrics.daily_vehicle_utilization >= 70) { // 70% threshold during typhoon
        metrics.daily_vehicle_utilization += utilizationBonus;
      }
    }

    // Regional variations
    const regionalAdjustment = typhoonAdjustment.regional_variations[region];
    if (regionalAdjustment) {
      this.applyRegionalTyphoonAdjustments(metrics, regionalAdjustment);
    }

    logger.info('Typhoon season adjustments applied', {
      region,
      severity: currentSeverity,
      month,
      adjustmentsApplied: true
    });
  }

  /**
   * Apply holiday surge bonuses
   */
  private async applyHolidaySurgeBonuses(
    metrics: PerformanceMetricsData,
    holidayName: string,
    region: string
  ): Promise<void> {
    const holidayBonus = this.adjustmentFactors.holiday_surge_bonuses.find(
      h => h.holiday_name === holidayName && h.regional_applicability.includes(region)
    );

    if (!holidayBonus) return;

    // Check if operator meets bonus conditions
    const meetsConditions = this.checkHolidayBonusConditions(metrics, holidayBonus);
    
    if (meetsConditions) {
      // Apply surge multipliers
      if (metrics.customer_satisfaction) {
        metrics.customer_satisfaction *= holidayBonus.surge_multipliers.customer_satisfaction;
        metrics.customer_satisfaction = Math.min(5.0, metrics.customer_satisfaction); // Cap at 5.0
      }

      if (metrics.service_area_coverage) {
        metrics.service_area_coverage *= holidayBonus.surge_multipliers.service_availability;
      }

      if (metrics.technology_adoption) {
        metrics.technology_adoption *= holidayBonus.surge_multipliers.platform_contribution;
      }

      logger.info('Holiday surge bonus applied', {
        holiday: holidayName,
        region,
        culturalSignificance: holidayBonus.cultural_significance
      });
    }
  }

  // =====================================================
  // REGIONAL ECONOMIC ADJUSTMENTS
  // =====================================================

  /**
   * Apply regional economic factor adjustments
   */
  private async applyRegionalEconomicAdjustments(
    metrics: PerformanceMetricsData,
    economicFactors: RegionalEconomicFactor
  ): Promise<void> {
    // Adjust fleet efficiency expectations based on regional economics
    if (metrics.fleet_efficiency_ratio) {
      const adjustment = economicFactors.adjustment_multipliers.fleet_efficiency_expectation;
      metrics.fleet_efficiency_ratio *= adjustment;
    }

    // Adjust for fuel price impacts
    if (economicFactors.economic_indicators.fuel_price_index > 1.1) { // 10% above average
      // Higher fuel prices reduce efficiency expectations
      if (metrics.vehicle_maintenance_score) {
        metrics.vehicle_maintenance_score += 2; // Bonus for maintaining service despite high fuel costs
      }
    }

    // Adjust for regional unemployment impact on driver availability
    if (economicFactors.economic_indicators.unemployment_rate > 0.08) { // Above 8%
      // Higher unemployment might improve driver availability
      if (metrics.driver_retention_rate) {
        metrics.driver_retention_rate *= 1.05; // 5% bonus
      }
    }

    // Apply socioeconomic area adjustments
    const avgSocioeconomicAdjustment = Object.values(economicFactors.socioeconomic_adjustments)
      .reduce((sum, val) => sum + val, 0) / 4;

    if (avgSocioeconomicAdjustment < 0.9) { // Serving lower-income areas
      // Bonus for serving underserved communities
      if (metrics.customer_satisfaction) {
        metrics.customer_satisfaction += 0.1; // Bonus for community service
      }
    }

    logger.info('Regional economic adjustments applied', {
      region: economicFactors.region,
      gdpIndex: economicFactors.economic_indicators.gdp_per_capita_index,
      adjustmentApplied: true
    });
  }

  // =====================================================
  // JEEPNEY COMPETITION ADJUSTMENTS
  // =====================================================

  /**
   * Apply jeepney competition adjustments
   */
  private async applyJeepneyCompetitionAdjustments(
    metrics: PerformanceMetricsData,
    competition: JeepneyCompetitionAnalysis
  ): Promise<void> {
    // Adjust service area coverage expectations
    if (metrics.service_area_coverage && competition.competition_intensity !== 'low') {
      const coverageAdjustment = competition.impact_on_metrics.service_area_coverage.adjustment_factor;
      const compensationBonus = competition.impact_on_metrics.service_area_coverage.compensation_bonus;
      
      // Adjust expectations downward and add compensation
      metrics.service_area_coverage = (metrics.service_area_coverage * coverageAdjustment) + compensationBonus;
    }

    // Adjust utilization expectations in high-competition areas
    if (metrics.daily_vehicle_utilization && competition.competition_intensity === 'high') {
      const realisticTarget = competition.impact_on_metrics.utilization_expectations.realistic_targets;
      const achievementBonus = competition.impact_on_metrics.utilization_expectations.achievement_bonus;
      
      // If operator achieves good utilization despite competition, apply bonus
      if (metrics.daily_vehicle_utilization >= realisticTarget) {
        metrics.daily_vehicle_utilization += achievementBonus;
      }
    }

    // Technology advantage bonus
    if (competition.competitive_advantages.technology_edge > 0.7) {
      if (metrics.technology_adoption) {
        metrics.technology_adoption *= 1.1; // 10% bonus for tech advantage
      }
    }

    // Overall performance compensation for operating in challenging areas
    if (competition.competition_intensity === 'extreme') {
      // Add general compensation points
      const compensationPoints = competition.performance_compensation;
      // This would be added at the total score level, not individual metrics
    }

    logger.info('Jeepney competition adjustments applied', {
      route: competition.route_name,
      intensity: competition.competition_intensity,
      compensationApplied: competition.performance_compensation
    });
  }

  // =====================================================
  // LGU REGULATION COMPLIANCE ADJUSTMENTS
  // =====================================================

  /**
   * Apply LGU regulation compliance adjustments
   */
  private async applyLGURegulationAdjustments(
    metrics: PerformanceMetricsData,
    regulation: LGURegulationCompliance,
    assessmentDate: Date
  ): Promise<void> {
    // Check for recent regulation updates
    const recentUpdates = regulation.regulation_updates.filter(update => {
      const updateDate = new Date(update.effective_date);
      const daysSinceUpdate = Math.floor((assessmentDate.getTime() - updateDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceUpdate <= update.grace_period;
    });

    // Apply grace period adjustments for new regulations
    if (recentUpdates.length > 0 && metrics.regulatory_compliance) {
      const gracePeriodBonus = regulation.compliance_scoring_adjustments.new_regulation_grace_period;
      
      // Reduce penalty for compliance issues during grace periods
      if (metrics.regulatory_compliance < 95) {
        const adjustmentFactor = Math.min(5, gracePeriodBonus / recentUpdates.length);
        metrics.regulatory_compliance += adjustmentFactor;
      }
    }

    // Multi-LGU operation complexity bonus
    if (regulation.compliance_scoring_adjustments.multi_lgu_operation_bonus > 0) {
      const complexityBonus = regulation.compliance_scoring_adjustments.multi_lgu_operation_bonus;
      if (metrics.regulatory_compliance) {
        metrics.regulatory_compliance += complexityBonus;
      }
    }

    // Proactive compliance bonus
    if (metrics.regulatory_compliance && metrics.regulatory_compliance >= 98) {
      const proactiveBonus = regulation.compliance_scoring_adjustments.proactive_compliance_bonus;
      metrics.regulatory_compliance = Math.min(100, metrics.regulatory_compliance + proactiveBonus);
    }

    logger.info('LGU regulation adjustments applied', {
      lgu: regulation.lgu_name,
      recentUpdates: recentUpdates.length,
      adjustmentsApplied: true
    });
  }

  // =====================================================
  // CULTURAL PERFORMANCE ADJUSTMENTS
  // =====================================================

  /**
   * Apply cultural performance factor adjustments
   */
  private async applyCulturalPerformanceAdjustments(
    metrics: PerformanceMetricsData,
    cultural: CulturalPerformanceFactor,
    region: string
  ): Promise<void> {
    const regionalVariation = cultural.regional_variations[region] || 1.0;

    // Apply cultural impact to driver relationships
    if (cultural.performance_impact.driver_relationships > 0 && metrics.driver_retention_rate) {
      const impact = cultural.performance_impact.driver_relationships * regionalVariation;
      const bonus = cultural.adjustment_mechanism.positive_reinforcement * impact;
      metrics.driver_retention_rate += bonus;
    }

    // Apply cultural impact to customer service
    if (cultural.performance_impact.customer_service > 0 && metrics.customer_satisfaction) {
      const impact = cultural.performance_impact.customer_service * regionalVariation;
      const bonus = cultural.adjustment_mechanism.cultural_sensitivity_bonus * impact;
      metrics.customer_satisfaction += bonus;
    }

    // Apply community integration impact
    if (cultural.performance_impact.community_integration > 0 && metrics.service_area_coverage) {
      const impact = cultural.performance_impact.community_integration * regionalVariation;
      const multiplier = 1 + (cultural.adjustment_mechanism.community_engagement_multiplier * impact);
      metrics.service_area_coverage *= multiplier;
    }

    logger.info('Cultural performance adjustments applied', {
      culturalElement: cultural.cultural_element,
      region,
      regionalVariation,
      adjustmentsApplied: true
    });
  }

  // =====================================================
  // INFRASTRUCTURE AND SOCIOECONOMIC ADJUSTMENTS
  // =====================================================

  /**
   * Apply infrastructure impact adjustments
   */
  private async applyInfrastructureImpactAdjustments(
    metrics: PerformanceMetricsData,
    infrastructure: InfrastructureImpactAdjustment
  ): Promise<void> {
    const baseAdjustment = infrastructure.adjustment_calculations.base_adjustment;
    const severityMultiplier = infrastructure.adjustment_calculations.severity_multiplier;
    const totalAdjustment = baseAdjustment * severityMultiplier;

    // Adjust safety incidents based on infrastructure condition
    if (infrastructure.performance_impact.safety_incidents !== 1.0 && metrics.safety_incident_rate) {
      // Poor infrastructure increases expected incident tolerance
      const adjustmentFactor = infrastructure.performance_impact.safety_incidents;
      metrics.safety_incident_rate *= adjustmentFactor;
    }

    // Adjust vehicle maintenance expectations
    if (infrastructure.performance_impact.vehicle_maintenance !== 1.0 && metrics.vehicle_maintenance_score) {
      const adjustmentFactor = infrastructure.performance_impact.vehicle_maintenance;
      if (adjustmentFactor > 1.0) {
        // Poor infrastructure makes maintenance more challenging
        metrics.vehicle_maintenance_score += totalAdjustment; // Bonus for maintaining despite challenges
      }
    }

    // Adjust service reliability expectations
    if (infrastructure.performance_impact.service_reliability !== 1.0) {
      // This would affect overall reliability scoring
      const reliabilityBonus = totalAdjustment * infrastructure.performance_impact.service_reliability;
      // Applied at the scoring level
    }

    logger.info('Infrastructure impact adjustments applied', {
      infrastructureType: infrastructure.infrastructure_type,
      condition: infrastructure.condition_assessment,
      adjustmentApplied: totalAdjustment
    });
  }

  /**
   * Apply socioeconomic adjustments
   */
  private async applySocioeconomicAdjustments(
    metrics: PerformanceMetricsData,
    socioeconomic: SocioeconomicAdjustment,
    region: string
  ): Promise<void> {
    const regionalData = socioeconomic.regional_data[region];
    if (!regionalData) return;

    // Adjust driver training expectations based on education levels
    if (socioeconomic.socioeconomic_indicator === 'education_level' && metrics.training_completion_rate) {
      const trainingAdjustment = socioeconomic.adjustment_factors.driver_training_expectations;
      
      if (regionalData < 0.7) { // Lower education levels
        // More lenient training completion expectations
        metrics.training_completion_rate *= (1 + trainingAdjustment);
        
        // Bonus for overcoming educational challenges
        const supportBonus = socioeconomic.support_program_multipliers.training_programs;
        metrics.training_completion_rate += supportBonus;
      }
    }

    // Adjust technology adoption expectations
    if (socioeconomic.socioeconomic_indicator === 'technology_adoption' && metrics.technology_adoption) {
      const techAdjustment = socioeconomic.adjustment_factors.technology_adoption_pace;
      
      if (regionalData < 0.6) { // Lower tech adoption
        // Adjust expectations and provide bonus for progress
        const supportBonus = socioeconomic.support_program_multipliers.technology_assistance;
        metrics.technology_adoption = (metrics.technology_adoption * techAdjustment) + supportBonus;
      }
    }

    // Financial inclusion adjustments
    if (socioeconomic.socioeconomic_indicator === 'financial_inclusion' && regionalData < 0.5) {
      // Bonus for serving underbanked communities
      const inclusionBonus = socioeconomic.support_program_multipliers.financial_literacy;
      
      // Apply bonus to platform contribution for financial inclusion efforts
      if (metrics.service_area_coverage) {
        metrics.service_area_coverage += inclusionBonus;
      }
    }

    logger.info('Socioeconomic adjustments applied', {
      indicator: socioeconomic.socioeconomic_indicator,
      region,
      regionalValue: regionalData,
      adjustmentsApplied: true
    });
  }

  // =====================================================
  // HELPER AND UTILITY METHODS
  // =====================================================

  private async getPerformanceContext(
    operatorId: string,
    region: string,
    assessmentDate: Date
  ): Promise<PhilippinesPerformanceContext> {
    const context: PhilippinesPerformanceContext = {
      operator_id: operatorId,
      region: region,
      assessment_date: assessmentDate.toISOString(),
      applicable_adjustments: {
        typhoon_season: this.isInTyphoonSeason(assessmentDate.getMonth() + 1),
        active_holidays: await this.getActiveHolidays(assessmentDate, region),
        economic_factors: await this.getRegionalEconomicFactors(region),
        jeepney_competition: await this.getJeepneyCompetitionAnalysis(region),
        lgu_regulations: await this.getLGURegulations(region),
        cultural_factors: this.getCulturalFactors(region),
        infrastructure_issues: await this.getInfrastructureIssues(region),
        socioeconomic_considerations: await this.getSocioeconomicFactors(region)
      },
      total_adjustment_score: 0,
      adjustment_breakdown: {}
    };

    // Calculate total adjustment score
    context.total_adjustment_score = this.calculateTotalAdjustmentScore(context);
    context.adjustment_breakdown = this.calculateAdjustmentBreakdown(context);

    return context;
  }

  private isInTyphoonSeason(month: number): boolean {
    return month >= 6 && month <= 12; // June to December
  }

  private async getCurrentTyphoonSeverity(
    region: string,
    date: Date
  ): Promise<'signal_1_2' | 'signal_3_4' | 'signal_5'> {
    // Mock implementation - would integrate with weather APIs
    return 'signal_1_2';
  }

  private checkHolidayBonusConditions(
    metrics: PerformanceMetricsData,
    bonus: HolidaySurgeBonus
  ): boolean {
    const availability = metrics.daily_vehicle_utilization || 0;
    const quality = metrics.customer_satisfaction || 0;
    
    return (
      availability >= bonus.bonus_conditions.minimum_availability &&
      quality >= bonus.bonus_conditions.service_quality_threshold
    );
  }

  private applyRegionalTyphoonAdjustments(
    metrics: PerformanceMetricsData,
    regionalAdjustment: RegionalTyphoonAdjustment
  ): void {
    const additionalAdjustment = regionalAdjustment.additional_adjustment;
    
    // Apply region-specific adjustments based on risk level
    if (regionalAdjustment.risk_level === 'extreme') {
      // More lenient adjustments for extreme risk areas
      if (metrics.safety_incident_rate) {
        metrics.safety_incident_rate *= (1 - additionalAdjustment);
      }
    }
  }

  private generateAdjustmentSummary(
    original: PerformanceMetricsData,
    adjusted: PerformanceMetricsData,
    context: PhilippinesPerformanceContext
  ): string {
    const adjustments = [];
    
    if (context.applicable_adjustments.typhoon_season) {
      adjustments.push('Typhoon season adjustments applied');
    }
    
    if (context.applicable_adjustments.active_holidays.length > 0) {
      adjustments.push(`Holiday bonuses for: ${context.applicable_adjustments.active_holidays.join(', ')}`);
    }
    
    if (context.applicable_adjustments.jeepney_competition.length > 0) {
      adjustments.push('Jeepney competition adjustments applied');
    }

    return adjustments.join('; ') || 'No Philippines-specific adjustments required';
  }

  private calculateTotalAdjustmentScore(context: PhilippinesPerformanceContext): number {
    let total = 0;
    
    if (context.applicable_adjustments.typhoon_season) total += 5;
    total += context.applicable_adjustments.active_holidays.length * 3;
    total += context.applicable_adjustments.jeepney_competition.length * 2;
    total += context.applicable_adjustments.lgu_regulations.length * 1;
    total += context.applicable_adjustments.cultural_factors.length * 2;
    total += context.applicable_adjustments.infrastructure_issues.length * 3;
    total += context.applicable_adjustments.socioeconomic_considerations.length * 2;
    
    return total;
  }

  private calculateAdjustmentBreakdown(context: PhilippinesPerformanceContext): { [category: string]: number } {
    const breakdown: { [category: string]: number } = {};
    
    if (context.applicable_adjustments.typhoon_season) breakdown['typhoon_season'] = 5;
    if (context.applicable_adjustments.active_holidays.length > 0) {
      breakdown['holidays'] = context.applicable_adjustments.active_holidays.length * 3;
    }
    if (context.applicable_adjustments.jeepney_competition.length > 0) {
      breakdown['jeepney_competition'] = context.applicable_adjustments.jeepney_competition.length * 2;
    }
    
    return breakdown;
  }

  private async cacheAdjustments(
    operatorId: string,
    date: Date,
    context: PhilippinesPerformanceContext
  ): Promise<void> {
    const key = `ph_adjustments:${operatorId}:${date.toISOString().split('T')[0]}`;
    await this.redis.setex(key, 86400, JSON.stringify(context)); // 24 hours
  }

  // Initialize default adjustment factors
  private initializeAdjustmentFactors(): void {
    this.adjustmentFactors = {
      typhoon_season_adjustments: [
        {
          adjustment_id: 'typhoon_2024',
          season_period: {
            start_month: 6,
            end_month: 12,
            peak_months: [8, 9, 10]
          },
          affected_metrics: {
            safety_incident_rate: {
              tolerance_increase: 20, // 20% increase in tolerance
              weight_adjustment: 0.8 // Reduce weight by 20%
            },
            daily_vehicle_utilization: {
              threshold_reduction: 15, // 15% reduction in expected utilization
              bonus_for_maintaining: 5 // 5 points bonus for maintaining service
            },
            driver_availability: {
              flexibility_bonus: 3,
              retention_adjustment: 0.9
            }
          },
          severity_levels: {
            signal_1_2: {
              safety_grace_period: 2,
              utilization_adjustment: 10,
              compliance_flexibility: 5,
              recovery_bonus: 2
            },
            signal_3_4: {
              safety_grace_period: 5,
              utilization_adjustment: 25,
              compliance_flexibility: 10,
              recovery_bonus: 5
            },
            signal_5: {
              safety_grace_period: 10,
              utilization_adjustment: 40,
              compliance_flexibility: 20,
              recovery_bonus: 10
            }
          },
          regional_variations: {
            'Luzon': {
              region_name: 'Luzon',
              risk_level: 'high',
              additional_adjustment: 0.1,
              specific_considerations: ['Metro Manila flood zones', 'Mountain province landslides']
            },
            'Visayas': {
              region_name: 'Visayas',
              risk_level: 'extreme',
              additional_adjustment: 0.15,
              specific_considerations: ['Island connectivity', 'Storm surge vulnerability']
            },
            'Mindanao': {
              region_name: 'Mindanao',
              risk_level: 'medium',
              additional_adjustment: 0.05,
              specific_considerations: ['Southern regions less affected']
            }
          },
          is_active: true,
          created_at: new Date().toISOString()
        }
      ],
      holiday_surge_bonuses: [],
      regional_economic_factors: [],
      jeepney_competition_analysis: [],
      lgu_regulation_compliance: [],
      cultural_performance_factors: [],
      infrastructure_impact_adjustments: [],
      socioeconomic_adjustments: []
    };
  }

  // Data retrieval methods (mock implementations)
  private async getActiveHolidays(date: Date, region: string): Promise<string[]> {
    const holidays = ['Christmas', 'New Year', 'Eid al-Fitr', 'Independence Day'];
    // Mock: Return holidays active around the date
    return [];
  }

  private async getRegionalEconomicFactors(region: string): Promise<RegionalEconomicFactor> {
    return {
      factor_id: crypto.randomUUID(),
      region: region,
      economic_indicators: {
        gdp_per_capita_index: 1.0,
        unemployment_rate: 0.07,
        inflation_rate: 0.04,
        fuel_price_index: 1.1,
        minimum_wage_ratio: 1.0
      },
      adjustment_multipliers: {
        fleet_efficiency_expectation: 1.0,
        revenue_targets: 1.0,
        cost_structure_adjustment: 1.0,
        competition_intensity: 1.0
      },
      socioeconomic_adjustments: {
        low_income_areas: 0.8,
        middle_income_areas: 1.0,
        high_income_areas: 1.2,
        mixed_income_areas: 1.0
      },
      last_updated: new Date().toISOString()
    };
  }

  private async getJeepneyCompetitionAnalysis(region: string): Promise<JeepneyCompetitionAnalysis[]> { return []; }
  private async getLGURegulations(region: string): Promise<LGURegulationCompliance[]> { return []; }
  private getCulturalFactors(region: string): CulturalPerformanceFactor[] { return []; }
  private async getInfrastructureIssues(region: string): Promise<InfrastructureImpactAdjustment[]> { return []; }
  private async getSocioeconomicFactors(region: string): Promise<SocioeconomicAdjustment[]> { return []; }
}

export const philippinesPerformanceAdjustmentService = new PhilippinesPerformanceAdjustmentService();