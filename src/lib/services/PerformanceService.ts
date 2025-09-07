// =====================================================
// PERFORMANCE SERVICE - Performance scoring and commission tier management
// Handles performance calculations, tier evaluations, and improvement plans
// =====================================================

import {
  OperatorPerformanceScore,
  OperatorPerformanceDetails,
  CommissionTierQualification,
  PerformanceMetricsData,
  ScoringFrequency,
  CommissionTier,
  TierQualificationStatus,
  UpdateCommissionTierRequest,
  IPerformanceService,
  PerformanceMetricConfig
} from '@/types/operators';
import { logger } from '@/lib/security/productionLogger';
import { v4 as uuidv4 } from 'uuid';

export class PerformanceService implements IPerformanceService {

  // =====================================================
  // PERFORMANCE SCORE CALCULATIONS
  // =====================================================

  /**
   * Calculate comprehensive performance score for an operator
   */
  async calculatePerformanceScore(
    operatorId: string, 
    period: string, 
    frequency: ScoringFrequency
  ): Promise<OperatorPerformanceScore> {
    try {
      logger.info('Calculating performance score', { operatorId, period, frequency });

      // Get raw performance data for the period
      const metricsData = await this.gatherPerformanceMetrics(operatorId, period, frequency);
      
      // Get performance configuration
      const metricsConfig = await this.getPerformanceMetricsConfig();
      
      // Calculate individual category scores
      const vehicleUtilizationScore = await this.calculateVehicleUtilizationScore(metricsData, metricsConfig);
      const driverManagementScore = await this.calculateDriverManagementScore(metricsData, metricsConfig);
      const complianceSafetyScore = await this.calculateComplianceSafetyScore(metricsData, metricsConfig);
      const platformContributionScore = await this.calculatePlatformContributionScore(metricsData, metricsConfig);
      
      // Calculate weighted total score
      const totalScore = vehicleUtilizationScore + driverManagementScore + complianceSafetyScore + platformContributionScore;
      
      // Determine commission tier eligibility
      const commissionTier = await this.determineCommissionTier(operatorId, totalScore);
      const tierQualificationStatus = await this.evaluateTierQualificationStatus(operatorId, commissionTier);
      
      // Calculate performance trends
      const improvementTrend = await this.calculateImprovementTrend(operatorId, totalScore, frequency);
      const peerRanking = await this.calculatePeerRanking(operatorId, totalScore);
      const peerPercentile = await this.calculatePeerPercentile(operatorId, totalScore);
      
      const performanceScore: OperatorPerformanceScore = {
        id: uuidv4(),
        operator_id: operatorId,
        scoring_period: period,
        scoring_frequency: frequency,
        
        // Individual category scores
        vehicle_utilization_score: Number(vehicleUtilizationScore.toFixed(2)),
        driver_management_score: Number(driverManagementScore.toFixed(2)),
        compliance_safety_score: Number(complianceSafetyScore.toFixed(2)),
        platform_contribution_score: Number(platformContributionScore.toFixed(2)),
        
        total_score: Number(totalScore.toFixed(2)),
        commission_tier: commissionTier,
        tier_qualification_status: tierQualificationStatus,
        tier_calculation_notes: await this.generateTierCalculationNotes(operatorId, commissionTier, tierQualificationStatus),
        
        metrics_data: metricsData,
        improvement_trend: improvementTrend,
        peer_ranking: peerRanking,
        peer_percentile: peerPercentile,
        
        calculated_at: new Date().toISOString(),
        calculated_by: 'system',
        is_final: true
      };
      
      // Save performance score to database
      await this.savePerformanceScore(performanceScore);
      
      // Save detailed breakdown
      await this.savePerformanceDetails(performanceScore.id, metricsConfig, metricsData);
      
      // Update operator's current performance score
      await this.updateOperatorPerformanceScore(operatorId, totalScore, commissionTier);
      
      // Check for tier changes and trigger events
      await this.checkForTierChanges(operatorId, commissionTier);
      
      logger.info('Performance score calculated successfully', { 
        operatorId, 
        totalScore: totalScore.toFixed(2),
        commissionTier,
        period 
      });
      
      return performanceScore;
      
    } catch (error) {
      logger.error('Failed to calculate performance score', { error, operatorId, period, frequency });
      throw error;
    }
  }

  /**
   * Get performance score history for an operator
   */
  async getPerformanceHistory(operatorId: string, limit: number = 12): Promise<OperatorPerformanceScore[]> {
    try {
      // In production, this would query the database with proper ordering and limit
      const history = await this.queryPerformanceHistory(operatorId, limit);
      
      return history;
      
    } catch (error) {
      logger.error('Failed to get performance history', { error, operatorId, limit });
      throw error;
    }
  }

  // =====================================================
  // COMMISSION TIER MANAGEMENT
  // =====================================================

  /**
   * Evaluate commission tier qualification for an operator
   */
  async evaluateCommissionTier(operatorId: string): Promise<CommissionTierQualification> {
    try {
      logger.info('Evaluating commission tier qualification', { operatorId });

      // Get current operator data
      const operator = await this.getOperatorData(operatorId);
      if (!operator) {
        throw new Error('Operator not found');
      }

      // Get performance requirements for each tier
      const tierRequirements = await this.getCommissionTierRequirements();
      
      // Evaluate qualification for each tier (start from highest)
      const tiers: CommissionTier[] = ['tier_3', 'tier_2', 'tier_1'];
      
      for (const tier of tiers) {
        const qualification = await this.evaluateTierRequirements(operatorId, tier, tierRequirements[tier]);
        
        if (qualification.qualified) {
          // Create or update qualification record
          const tierQualification: CommissionTierQualification = {
            id: uuidv4(),
            operator_id: operatorId,
            target_tier: tier,
            qualification_status: 'qualified',
            
            // Score requirements
            score_requirement: tierRequirements[tier].min_performance_score,
            current_score: operator.performance_score,
            score_qualified: qualification.requirements.score_qualified,
            
            // Tenure requirements  
            tenure_requirement: tierRequirements[tier].min_tenure_months,
            current_tenure: qualification.current_tenure,
            tenure_qualified: qualification.requirements.tenure_qualified,
            
            // Payment consistency
            payment_consistency_requirement: tierRequirements[tier].min_payment_consistency,
            current_payment_consistency: qualification.current_payment_consistency,
            payment_qualified: qualification.requirements.payment_qualified,
            
            // Utilization requirements
            utilization_requirement: tierRequirements[tier].min_utilization_percentile,
            current_utilization_percentile: qualification.current_utilization_percentile,
            utilization_qualified: qualification.requirements.utilization_qualified,
            
            additional_requirements: tierRequirements[tier].additional_requirements,
            requirements_status: qualification.requirements.additional_status,
            
            evaluation_date: new Date().toISOString().split('T')[0],
            qualification_date: new Date().toISOString().split('T')[0],
            next_evaluation_date: this.calculateNextEvaluationDate(),
            
            qualification_notes: qualification.notes,
            disqualification_reasons: [],
            
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          await this.saveTierQualification(tierQualification);
          return tierQualification;
        }
      }
      
      // If no tier qualification found, return tier_1 with disqualification reasons
      const disqualifiedQualification = await this.createDisqualifiedRecord(operatorId, 'tier_1');
      return disqualifiedQualification;
      
    } catch (error) {
      logger.error('Failed to evaluate commission tier', { error, operatorId });
      throw error;
    }
  }

  /**
   * Update operator commission tier
   */
  async updateCommissionTier(request: UpdateCommissionTierRequest): Promise<void> {
    try {
      logger.info('Updating commission tier', { 
        operatorId: request.operator_id, 
        targetTier: request.target_tier 
      });

      // Validate the tier change request
      await this.validateTierChangeRequest(request);
      
      // Get current tier qualification
      const qualification = await this.evaluateCommissionTier(request.operator_id);
      
      // Check if operator qualifies for the requested tier
      if (qualification.target_tier !== request.target_tier) {
        throw new Error(`Operator does not qualify for ${request.target_tier}. Maximum qualified tier: ${qualification.target_tier}`);
      }
      
      // Update operator's commission tier
      await this.updateOperatorCommissionTier(request.operator_id, request.target_tier);
      
      // Create audit trail
      await this.createTierChangeAuditRecord(request);
      
      // Trigger tier change event for real-time updates
      await this.triggerTierChangeEvent(request.operator_id, request.target_tier);
      
      logger.info('Commission tier updated successfully', { 
        operatorId: request.operator_id, 
        newTier: request.target_tier 
      });
      
    } catch (error) {
      logger.error('Failed to update commission tier', { error, request });
      throw error;
    }
  }

  /**
   * Create improvement plan for underperforming operators
   */
  async createImprovementPlan(
    operatorId: string, 
    targetScore: number, 
    timelineDays: number
  ): Promise<void> {
    try {
      logger.info('Creating improvement plan', { operatorId, targetScore, timelineDays });

      // Get current performance data
      const currentScore = await this.getCurrentPerformanceScore(operatorId);
      if (!currentScore) {
        throw new Error('No performance data found for operator');
      }
      
      if (currentScore.total_score >= targetScore) {
        throw new Error('Current performance score already meets or exceeds target');
      }
      
      // Analyze performance gaps
      const performanceGaps = await this.analyzePerformanceGaps(operatorId, currentScore, targetScore);
      
      // Generate action items based on gaps
      const actionItems = await this.generateActionItems(performanceGaps, timelineDays);
      
      // Calculate milestones
      const milestones = await this.calculateMilestones(performanceGaps, timelineDays);
      
      // Create improvement plan
      const improvementPlan = {
        id: uuidv4(),
        operator_id: operatorId,
        plan_name: `Performance Improvement Plan - Target ${targetScore} points`,
        description: `Comprehensive plan to improve performance from ${currentScore.total_score} to ${targetScore} points`,
        priority: this.determinePlanPriority(currentScore.total_score, targetScore),
        
        trigger_score: currentScore.total_score,
        focus_areas: performanceGaps.map(gap => gap.metric_type),
        specific_metrics: performanceGaps.map(gap => gap.metric_name),
        
        target_score: targetScore,
        target_metrics: this.createTargetMetrics(performanceGaps, targetScore),
        timeline_days: timelineDays,
        
        action_items: actionItems,
        assigned_manager: await this.getAssignedAccountManager(operatorId),
        check_in_frequency: this.determineCheckInFrequency(timelineDays),
        
        progress_percentage: 0,
        milestones_completed: 0,
        total_milestones: milestones.length,
        current_score: currentScore.total_score,
        
        status: 'active',
        start_date: new Date().toISOString().split('T')[0],
        target_completion_date: this.calculateTargetCompletionDate(timelineDays),
        
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'system'
      };
      
      // Save improvement plan
      await this.saveImprovementPlan(improvementPlan);
      
      // Notify account manager
      await this.notifyAccountManager(improvementPlan);
      
      logger.info('Improvement plan created successfully', { 
        operatorId, 
        planId: improvementPlan.id,
        targetScore 
      });
      
    } catch (error) {
      logger.error('Failed to create improvement plan', { error, operatorId, targetScore, timelineDays });
      throw error;
    }
  }

  // =====================================================
  // SCORE CALCULATION METHODS
  // =====================================================

  /**
   * Calculate Vehicle Utilization score (30 points max)
   */
  private async calculateVehicleUtilizationScore(
    metricsData: PerformanceMetricsData, 
    config: PerformanceMetricConfig[]
  ): Promise<number> {
    let totalScore = 0;
    
    // Daily Vehicle Utilization (12 points max)
    const utilizationConfig = config.find(c => c.metric_name === 'daily_vehicle_utilization');
    if (utilizationConfig) {
      totalScore += this.calculateMetricScore(
        metricsData.daily_vehicle_utilization, 
        utilizationConfig.threshold_values,
        utilizationConfig.max_points
      );
    }
    
    // Peak Hour Availability (9 points max)
    const peakHourConfig = config.find(c => c.metric_name === 'peak_hour_availability');
    if (peakHourConfig) {
      totalScore += this.calculateMetricScore(
        metricsData.peak_hour_availability,
        peakHourConfig.threshold_values,
        peakHourConfig.max_points
      );
    }
    
    // Fleet Efficiency Ratio (9 points max)
    const efficiencyConfig = config.find(c => c.metric_name === 'fleet_efficiency_ratio');
    if (efficiencyConfig) {
      totalScore += this.calculateMetricScore(
        metricsData.fleet_efficiency_ratio,
        efficiencyConfig.threshold_values,
        efficiencyConfig.max_points
      );
    }
    
    return Math.min(totalScore, 30); // Cap at 30 points
  }

  /**
   * Calculate Driver Management score (25 points max)
   */
  private async calculateDriverManagementScore(
    metricsData: PerformanceMetricsData, 
    config: PerformanceMetricConfig[]
  ): Promise<number> {
    let totalScore = 0;
    
    // Driver Retention Rate (8.75 points max)
    const retentionConfig = config.find(c => c.metric_name === 'driver_retention_rate');
    if (retentionConfig) {
      totalScore += this.calculateMetricScore(
        metricsData.driver_retention_rate,
        retentionConfig.threshold_values,
        retentionConfig.max_points
      );
    }
    
    // Average Driver Performance (8.75 points max)
    const performanceConfig = config.find(c => c.metric_name === 'driver_performance_avg');
    if (performanceConfig) {
      totalScore += this.calculateMetricScore(
        metricsData.driver_performance_avg,
        performanceConfig.threshold_values,
        performanceConfig.max_points
      );
    }
    
    // Training Completion Rate (7.5 points max)
    const trainingConfig = config.find(c => c.metric_name === 'training_completion_rate');
    if (trainingConfig) {
      totalScore += this.calculateMetricScore(
        metricsData.training_completion_rate,
        trainingConfig.threshold_values,
        trainingConfig.max_points
      );
    }
    
    return Math.min(totalScore, 25); // Cap at 25 points
  }

  /**
   * Calculate Compliance & Safety score (25 points max)
   */
  private async calculateComplianceSafetyScore(
    metricsData: PerformanceMetricsData, 
    config: PerformanceMetricConfig[]
  ): Promise<number> {
    let totalScore = 0;
    
    // Safety Incident Rate (10 points max) - inverted score
    const safetyConfig = config.find(c => c.metric_name === 'safety_incident_rate');
    if (safetyConfig) {
      totalScore += this.calculateInvertedMetricScore(
        metricsData.safety_incident_rate,
        safetyConfig.threshold_values,
        safetyConfig.max_points
      );
    }
    
    // Regulatory Compliance (8.75 points max)
    const complianceConfig = config.find(c => c.metric_name === 'regulatory_compliance');
    if (complianceConfig) {
      totalScore += this.calculateMetricScore(
        metricsData.regulatory_compliance,
        complianceConfig.threshold_values,
        complianceConfig.max_points
      );
    }
    
    // Vehicle Maintenance Score (6.25 points max)
    const maintenanceConfig = config.find(c => c.metric_name === 'vehicle_maintenance_score');
    if (maintenanceConfig) {
      totalScore += this.calculateMetricScore(
        metricsData.vehicle_maintenance_score,
        maintenanceConfig.threshold_values,
        maintenanceConfig.max_points
      );
    }
    
    return Math.min(totalScore, 25); // Cap at 25 points
  }

  /**
   * Calculate Platform Contribution score (20 points max)
   */
  private async calculatePlatformContributionScore(
    metricsData: PerformanceMetricsData, 
    config: PerformanceMetricConfig[]
  ): Promise<number> {
    let totalScore = 0;
    
    // Customer Satisfaction (8 points max)
    const satisfactionConfig = config.find(c => c.metric_name === 'customer_satisfaction');
    if (satisfactionConfig) {
      totalScore += this.calculateMetricScore(
        metricsData.customer_satisfaction,
        satisfactionConfig.threshold_values,
        satisfactionConfig.max_points
      );
    }
    
    // Service Area Coverage (6 points max)
    const coverageConfig = config.find(c => c.metric_name === 'service_area_coverage');
    if (coverageConfig) {
      totalScore += this.calculateMetricScore(
        metricsData.service_area_coverage,
        coverageConfig.threshold_values,
        coverageConfig.max_points
      );
    }
    
    // Technology Adoption (6 points max)
    const technologyConfig = config.find(c => c.metric_name === 'technology_adoption');
    if (technologyConfig) {
      totalScore += this.calculateMetricScore(
        metricsData.technology_adoption,
        technologyConfig.threshold_values,
        technologyConfig.max_points
      );
    }
    
    return Math.min(totalScore, 20); // Cap at 20 points
  }

  /**
   * Calculate score for a metric based on thresholds
   */
  private calculateMetricScore(value: number, thresholds: any, maxPoints: number): number {
    const bands = ['excellent', 'good', 'average', 'poor'];
    
    for (const band of bands) {
      if (thresholds[band]) {
        const threshold = thresholds[band];
        if (threshold.min !== undefined && value >= threshold.min) {
          return threshold.points || 0;
        }
        if (threshold.max !== undefined && value <= threshold.max) {
          return threshold.points || 0;
        }
      }
    }
    
    return 0; // No threshold met
  }

  /**
   * Calculate inverted score (for metrics where lower is better)
   */
  private calculateInvertedMetricScore(value: number, thresholds: any, maxPoints: number): number {
    const bands = ['excellent', 'good', 'average', 'poor'];
    
    for (const band of bands) {
      if (thresholds[band]) {
        const threshold = thresholds[band];
        if (threshold.max !== undefined && value <= threshold.max) {
          return threshold.points || 0;
        }
      }
    }
    
    return 0; // No threshold met
  }

  // =====================================================
  // DATABASE INTERFACE METHODS (Mock implementations)
  // =====================================================

  private async gatherPerformanceMetrics(
    operatorId: string, 
    period: string, 
    frequency: ScoringFrequency
  ): Promise<PerformanceMetricsData> {
    // Mock: Complex queries to gather all performance metrics
    logger.debug('Mock: Gathering performance metrics', { operatorId, period, frequency });
    
    return {
      // Vehicle Utilization metrics
      daily_vehicle_utilization: 75.5,
      peak_hour_availability: 88.2,
      fleet_efficiency_ratio: 102.3,
      
      // Driver Management metrics
      driver_retention_rate: 85.7,
      driver_performance_avg: 78.9,
      training_completion_rate: 92.1,
      
      // Compliance & Safety metrics
      safety_incident_rate: 0.8,
      regulatory_compliance: 96.5,
      vehicle_maintenance_score: 89.3,
      
      // Platform Contribution metrics
      customer_satisfaction: 4.6,
      service_area_coverage: 82.4,
      technology_adoption: 76.8
    };
  }

  private async getPerformanceMetricsConfig(): Promise<PerformanceMetricConfig[]> {
    // Mock: Get performance metrics configuration from database
    logger.debug('Mock: Getting performance metrics config');
    return []; // Would return actual config data
  }

  private async determineCommissionTier(operatorId: string, totalScore: number): Promise<CommissionTier> {
    // Mock: Determine commission tier based on score and other factors
    if (totalScore >= 90) return 'tier_3';
    if (totalScore >= 80) return 'tier_2';
    return 'tier_1';
  }

  private async evaluateTierQualificationStatus(
    operatorId: string, 
    commissionTier: CommissionTier
  ): Promise<TierQualificationStatus> {
    // Mock: Evaluate if operator actually qualifies for the tier
    return 'qualified';
  }

  private async savePerformanceScore(score: OperatorPerformanceScore): Promise<void> {
    // Mock: INSERT INTO operator_performance_scores
    logger.debug('Mock: Saving performance score', { scoreId: score.id, operatorId: score.operator_id });
  }

  private async savePerformanceDetails(
    scoreId: string, 
    config: PerformanceMetricConfig[], 
    metricsData: PerformanceMetricsData
  ): Promise<void> {
    // Mock: INSERT INTO operator_performance_details
    logger.debug('Mock: Saving performance details', { scoreId });
  }

  private async updateOperatorPerformanceScore(
    operatorId: string, 
    score: number, 
    tier: CommissionTier
  ): Promise<void> {
    // Mock: UPDATE operators SET performance_score = ?, commission_tier = ?
    logger.debug('Mock: Updating operator performance score', { operatorId, score, tier });
  }

  private async checkForTierChanges(operatorId: string, newTier: CommissionTier): Promise<void> {
    // Mock: Check if tier changed and trigger events
    logger.debug('Mock: Checking for tier changes', { operatorId, newTier });
  }

  private async queryPerformanceHistory(operatorId: string, limit: number): Promise<OperatorPerformanceScore[]> {
    // Mock: SELECT * FROM operator_performance_scores WHERE operator_id = ? ORDER BY scoring_period DESC LIMIT ?
    logger.debug('Mock: Querying performance history', { operatorId, limit });
    return [];
  }

  private async getOperatorData(operatorId: string): Promise<any> {
    // Mock: Get operator data
    return null;
  }

  private async getCommissionTierRequirements(): Promise<Record<CommissionTier, any>> {
    // Mock: Get tier requirements from commission_rate_configs
    return {
      tier_1: { min_performance_score: 70, min_tenure_months: 6, min_payment_consistency: 90 },
      tier_2: { min_performance_score: 80, min_tenure_months: 12, min_payment_consistency: 90, min_utilization_percentile: 50 },
      tier_3: { min_performance_score: 90, min_tenure_months: 18, min_payment_consistency: 95, min_utilization_percentile: 25 }
    };
  }

  private async evaluateTierRequirements(operatorId: string, tier: CommissionTier, requirements: any): Promise<any> {
    // Mock: Evaluate if operator meets tier requirements
    return { qualified: false, requirements: {}, current_tenure: 0, current_payment_consistency: 0, current_utilization_percentile: 0, notes: '' };
  }

  private async saveTierQualification(qualification: CommissionTierQualification): Promise<void> {
    // Mock: INSERT INTO commission_tier_qualifications
    logger.debug('Mock: Saving tier qualification', { qualificationId: qualification.id });
  }

  private async createDisqualifiedRecord(operatorId: string, tier: CommissionTier): Promise<CommissionTierQualification> {
    // Mock: Create disqualified record
    return {} as CommissionTierQualification;
  }

  // Additional helper methods would be implemented here...
  private async calculateImprovementTrend(operatorId: string, currentScore: number, frequency: ScoringFrequency): Promise<number> { return 0; }
  private async calculatePeerRanking(operatorId: string, score: number): Promise<number> { return 1; }
  private async calculatePeerPercentile(operatorId: string, score: number): Promise<number> { return 75; }
  private async generateTierCalculationNotes(operatorId: string, tier: CommissionTier, status: TierQualificationStatus): Promise<string> { return ''; }
  private calculateNextEvaluationDate(): string { return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; }
  private async validateTierChangeRequest(request: UpdateCommissionTierRequest): Promise<void> { }
  private async updateOperatorCommissionTier(operatorId: string, tier: CommissionTier): Promise<void> { }
  private async createTierChangeAuditRecord(request: UpdateCommissionTierRequest): Promise<void> { }
  private async triggerTierChangeEvent(operatorId: string, tier: CommissionTier): Promise<void> { }
  private async getCurrentPerformanceScore(operatorId: string): Promise<OperatorPerformanceScore | null> { return null; }
  private async analyzePerformanceGaps(operatorId: string, currentScore: OperatorPerformanceScore, targetScore: number): Promise<any[]> { return []; }
  private async generateActionItems(gaps: any[], timelineDays: number): Promise<any[]> { return []; }
  private async calculateMilestones(gaps: any[], timelineDays: number): Promise<any[]> { return []; }
  private determinePlanPriority(currentScore: number, targetScore: number): string { return 'medium'; }
  private createTargetMetrics(gaps: any[], targetScore: number): Record<string, any> { return {}; }
  private async getAssignedAccountManager(operatorId: string): Promise<string | undefined> { return undefined; }
  private determineCheckInFrequency(timelineDays: number): string { return 'weekly'; }
  private calculateTargetCompletionDate(timelineDays: number): string { return new Date(Date.now() + timelineDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; }
  private async saveImprovementPlan(plan: any): Promise<void> { }
  private async notifyAccountManager(plan: any): Promise<void> { }
}

export const performanceService = new PerformanceService();