// =====================================================
// PERFORMANCE SERVICE UNIT TESTS
// Comprehensive unit tests for performance scoring system
// =====================================================

import { jest } from '@jest/globals';
import {
  OperatorPerformanceScore,
  PerformanceMetricConfig,
  CommissionTier,
  ScoringFrequency,
  PerformanceMetricsData,
  CommissionTierQualification,
  TierQualificationStatus
} from '@/types/operators';

// Mock dependencies
jest.mock('@/lib/services/DatabaseService');
jest.mock('@/lib/services/OperatorService');

describe('PerformanceService', () => {
  
  // =====================================================
  // TEST DATA SETUP
  // =====================================================
  
  const mockPerformanceMetrics: PerformanceMetricsData = {
    // Vehicle Utilization (30 points max)
    daily_vehicle_utilization: 0.85,
    peak_hour_availability: 0.90,
    fleet_efficiency_ratio: 0.80,
    
    // Driver Management (25 points max)
    driver_retention_rate: 0.95,
    driver_performance_avg: 0.88,
    training_completion_rate: 1.0,
    
    // Compliance & Safety (25 points max)
    safety_incident_rate: 0.02, // Lower is better
    regulatory_compliance: 1.0,
    vehicle_maintenance_score: 0.92,
    
    // Platform Contribution (20 points max)
    customer_satisfaction: 4.5, // Out of 5
    service_area_coverage: 0.75,
    technology_adoption: 0.85
  };

  const mockPerformanceScore: OperatorPerformanceScore = {
    id: 'perf-001',
    operator_id: 'op-test-001',
    scoring_period: '2024-01',
    scoring_frequency: 'monthly',
    vehicle_utilization_score: 25.5,
    driver_management_score: 22.0,
    compliance_safety_score: 23.0,
    platform_contribution_score: 17.0,
    total_score: 87.5,
    commission_tier: 'tier_2',
    tier_qualification_status: 'qualified',
    metrics_data: mockPerformanceMetrics,
    calculated_at: '2024-01-31T23:59:59.000Z',
    calculated_by: 'system',
    is_final: true
  };

  const mockMetricConfigs: PerformanceMetricConfig[] = [
    {
      id: 'metric-001',
      metric_name: 'daily_vehicle_utilization',
      display_name: 'Daily Vehicle Utilization',
      description: 'Percentage of vehicles active during operating hours',
      metric_type: 'vehicle_utilization',
      category_weight: 30,
      max_points: 12,
      calculation_formula: 'utilization_rate * max_points',
      threshold_values: {
        excellent: 0.9,
        good: 0.8,
        fair: 0.7,
        poor: 0.6
      },
      is_percentage: true,
      is_active: true,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z'
    },
    {
      id: 'metric-002',
      metric_name: 'driver_retention_rate',
      display_name: 'Driver Retention Rate',
      description: 'Percentage of drivers retained over the period',
      metric_type: 'driver_management',
      category_weight: 25,
      max_points: 10,
      calculation_formula: 'retention_rate * max_points',
      threshold_values: {
        excellent: 0.95,
        good: 0.85,
        fair: 0.75,
        poor: 0.65
      },
      is_percentage: true,
      is_active: true,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z'
    }
  ];

  // Import the service after mocking
  let performanceService: any;
  
  beforeEach(async () => {
    jest.clearAllMocks();
    // Dynamically import after mocks are set up
    const { performanceService: service } = await import('@/lib/services/PerformanceService');
    performanceService = service;
  });

  // =====================================================
  // PERFORMANCE SCORE CALCULATION TESTS
  // =====================================================

  describe('calculatePerformanceScore', () => {
    
    it('should calculate vehicle utilization score correctly', () => {
      // Arrange
      const utilization = 0.85;
      const peakAvailability = 0.90;
      const efficiency = 0.80;
      
      // Act
      const score = performanceService.calculateVehicleUtilizationScore({
        daily_vehicle_utilization: utilization,
        peak_hour_availability: peakAvailability,
        fleet_efficiency_ratio: efficiency
      });
      
      // Assert
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(30); // Max points for vehicle utilization
      expect(score).toBeCloseTo(25.5, 1); // Expected calculation
    });

    it('should calculate driver management score correctly', () => {
      // Arrange
      const retention = 0.95;
      const performance = 0.88;
      const training = 1.0;
      
      // Act
      const score = performanceService.calculateDriverManagementScore({
        driver_retention_rate: retention,
        driver_performance_avg: performance,
        training_completion_rate: training
      });
      
      // Assert
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(25); // Max points for driver management
      expect(score).toBeCloseTo(22.0, 1);
    });

    it('should calculate compliance and safety score correctly', () => {
      // Arrange
      const incidentRate = 0.02; // Lower is better
      const compliance = 1.0;
      const maintenance = 0.92;
      
      // Act
      const score = performanceService.calculateComplianceSafetyScore({
        safety_incident_rate: incidentRate,
        regulatory_compliance: compliance,
        vehicle_maintenance_score: maintenance
      });
      
      // Assert
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(25); // Max points for compliance
      expect(score).toBeCloseTo(23.0, 1);
    });

    it('should calculate platform contribution score correctly', () => {
      // Arrange
      const satisfaction = 4.5; // Out of 5
      const coverage = 0.75;
      const adoption = 0.85;
      
      // Act
      const score = performanceService.calculatePlatformContributionScore({
        customer_satisfaction: satisfaction,
        service_area_coverage: coverage,
        technology_adoption: adoption
      });
      
      // Assert
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(20); // Max points for platform contribution
      expect(score).toBeCloseTo(17.0, 1);
    });

    it('should calculate total performance score correctly', async () => {
      // Arrange
      jest.spyOn(performanceService, 'getPerformanceMetrics').mockResolvedValue(mockPerformanceMetrics);
      
      // Act
      const result = await performanceService.calculatePerformanceScore('op-test-001', '2024-01', 'monthly');
      
      // Assert
      expect(result.total_score).toBeCloseTo(87.5, 1);
      expect(result.commission_tier).toBe('tier_2'); // 87.5 falls in tier 2 range (80-89)
      expect(result.vehicle_utilization_score).toBeCloseTo(25.5, 1);
      expect(result.driver_management_score).toBeCloseTo(22.0, 1);
      expect(result.compliance_safety_score).toBeCloseTo(23.0, 1);
      expect(result.platform_contribution_score).toBeCloseTo(17.0, 1);
    });

    it('should handle edge case - perfect performance', async () => {
      // Arrange
      const perfectMetrics: PerformanceMetricsData = {
        daily_vehicle_utilization: 1.0,
        peak_hour_availability: 1.0,
        fleet_efficiency_ratio: 1.0,
        driver_retention_rate: 1.0,
        driver_performance_avg: 1.0,
        training_completion_rate: 1.0,
        safety_incident_rate: 0.0,
        regulatory_compliance: 1.0,
        vehicle_maintenance_score: 1.0,
        customer_satisfaction: 5.0,
        service_area_coverage: 1.0,
        technology_adoption: 1.0
      };
      
      jest.spyOn(performanceService, 'getPerformanceMetrics').mockResolvedValue(perfectMetrics);
      
      // Act
      const result = await performanceService.calculatePerformanceScore('op-test-001', '2024-01', 'monthly');
      
      // Assert
      expect(result.total_score).toBeCloseTo(100, 1);
      expect(result.commission_tier).toBe('tier_3'); // Perfect score = tier 3
    });

    it('should handle edge case - minimum performance', async () => {
      // Arrange
      const minMetrics: PerformanceMetricsData = {
        daily_vehicle_utilization: 0.0,
        peak_hour_availability: 0.0,
        fleet_efficiency_ratio: 0.0,
        driver_retention_rate: 0.0,
        driver_performance_avg: 0.0,
        training_completion_rate: 0.0,
        safety_incident_rate: 1.0, // High incident rate
        regulatory_compliance: 0.0,
        vehicle_maintenance_score: 0.0,
        customer_satisfaction: 1.0,
        service_area_coverage: 0.0,
        technology_adoption: 0.0
      };
      
      jest.spyOn(performanceService, 'getPerformanceMetrics').mockResolvedValue(minMetrics);
      
      // Act
      const result = await performanceService.calculatePerformanceScore('op-test-001', '2024-01', 'monthly');
      
      // Assert
      expect(result.total_score).toBeGreaterThanOrEqual(0);
      expect(result.total_score).toBeLessThan(70); // Below tier 1 threshold
      expect(result.commission_tier).toBe('tier_1'); // Minimum tier
    });

  });

  // =====================================================
  // COMMISSION TIER EVALUATION TESTS
  // =====================================================

  describe('evaluateCommissionTier', () => {
    
    it('should qualify operator for tier 2 with adequate performance', async () => {
      // Arrange
      const mockQualification: CommissionTierQualification = {
        id: 'qual-001',
        operator_id: 'op-test-001',
        target_tier: 'tier_2',
        qualification_status: 'qualified',
        score_requirement: 80,
        current_score: 87.5,
        score_qualified: true,
        tenure_requirement: 6,
        current_tenure: 12,
        tenure_qualified: true,
        payment_consistency_requirement: 0.9,
        current_payment_consistency: 0.95,
        payment_qualified: true,
        utilization_requirement: 0.8,
        current_utilization_percentile: 0.85,
        utilization_qualified: true,
        additional_requirements: {},
        requirements_status: {},
        evaluation_date: '2024-01-31T00:00:00.000Z',
        qualification_date: '2024-01-31T00:00:00.000Z',
        created_at: '2024-01-31T00:00:00.000Z',
        updated_at: '2024-01-31T00:00:00.000Z'
      };
      
      jest.spyOn(performanceService, 'getLatestPerformanceScore').mockResolvedValue(mockPerformanceScore);
      jest.spyOn(performanceService, 'getOperatorTenure').mockResolvedValue(12);
      jest.spyOn(performanceService, 'getPaymentConsistency').mockResolvedValue(0.95);
      jest.spyOn(performanceService, 'getUtilizationPercentile').mockResolvedValue(0.85);
      
      // Act
      const result = await performanceService.evaluateCommissionTier('op-test-001');
      
      // Assert
      expect(result.qualification_status).toBe('qualified');
      expect(result.target_tier).toBe('tier_2');
      expect(result.score_qualified).toBe(true);
      expect(result.tenure_qualified).toBe(true);
      expect(result.payment_qualified).toBe(true);
      expect(result.utilization_qualified).toBe(true);
    });

    it('should put operator under review with borderline performance', async () => {
      // Arrange
      const borderlineScore = { ...mockPerformanceScore, total_score: 79.5 }; // Just below tier 2
      
      jest.spyOn(performanceService, 'getLatestPerformanceScore').mockResolvedValue(borderlineScore);
      jest.spyOn(performanceService, 'getOperatorTenure').mockResolvedValue(12);
      jest.spyOn(performanceService, 'getPaymentConsistency').mockResolvedValue(0.95);
      jest.spyOn(performanceService, 'getUtilizationPercentile').mockResolvedValue(0.75);
      
      // Act
      const result = await performanceService.evaluateCommissionTier('op-test-001');
      
      // Assert
      expect(result.qualification_status).toBe('under_review');
      expect(result.target_tier).toBe('tier_1'); // Falls back to tier 1
    });

    it('should disqualify operator with poor performance history', async () => {
      // Arrange
      const poorScore = { ...mockPerformanceScore, total_score: 65 };
      
      jest.spyOn(performanceService, 'getLatestPerformanceScore').mockResolvedValue(poorScore);
      jest.spyOn(performanceService, 'getOperatorTenure').mockResolvedValue(3); // Below requirement
      jest.spyOn(performanceService, 'getPaymentConsistency').mockResolvedValue(0.75); // Below requirement
      jest.spyOn(performanceService, 'getUtilizationPercentile').mockResolvedValue(0.60);
      
      // Act
      const result = await performanceService.evaluateCommissionTier('op-test-001');
      
      // Assert
      expect(result.qualification_status).toBe('disqualified');
      expect(result.score_qualified).toBe(false);
      expect(result.tenure_qualified).toBe(false);
      expect(result.payment_qualified).toBe(false);
    });

    it('should set probationary status for operators with recent issues', async () => {
      // Arrange
      const recentViolation = {
        violation_date: '2024-01-15T00:00:00.000Z',
        violation_type: 'safety_incident',
        severity: 'medium'
      };
      
      jest.spyOn(performanceService, 'getLatestPerformanceScore').mockResolvedValue(mockPerformanceScore);
      jest.spyOn(performanceService, 'getRecentViolations').mockResolvedValue([recentViolation]);
      jest.spyOn(performanceService, 'getOperatorTenure').mockResolvedValue(12);
      jest.spyOn(performanceService, 'getPaymentConsistency').mockResolvedValue(0.95);
      jest.spyOn(performanceService, 'getUtilizationPercentile').mockResolvedValue(0.85);
      
      // Act
      const result = await performanceService.evaluateCommissionTier('op-test-001');
      
      // Assert
      expect(result.qualification_status).toBe('probationary');
      expect(result.probation_end_date).toBeDefined();
    });

  });

  // =====================================================
  // PERFORMANCE HISTORY TESTS
  // =====================================================

  describe('getPerformanceHistory', () => {
    
    it('should return performance history in chronological order', async () => {
      // Arrange
      const historicalScores = [
        { ...mockPerformanceScore, scoring_period: '2024-01', total_score: 85 },
        { ...mockPerformanceScore, scoring_period: '2023-12', total_score: 82 },
        { ...mockPerformanceScore, scoring_period: '2023-11', total_score: 78 }
      ];
      
      jest.spyOn(performanceService, 'getPerformanceScoresByOperator').mockResolvedValue(historicalScores);
      
      // Act
      const result = await performanceService.getPerformanceHistory('op-test-001');
      
      // Assert
      expect(result).toHaveLength(3);
      expect(result[0].scoring_period).toBe('2024-01'); // Most recent first
      expect(result[2].scoring_period).toBe('2023-11'); // Oldest last
    });

    it('should limit results when specified', async () => {
      // Arrange
      const historicalScores = Array.from({ length: 10 }, (_, i) => ({
        ...mockPerformanceScore,
        scoring_period: `2023-${String(i + 1).padStart(2, '0')}`,
        total_score: 85 - i
      }));
      
      jest.spyOn(performanceService, 'getPerformanceScoresByOperator').mockResolvedValue(historicalScores);
      
      // Act
      const result = await performanceService.getPerformanceHistory('op-test-001', 5);
      
      // Assert
      expect(result).toHaveLength(5);
    });

    it('should calculate performance trends', async () => {
      // Arrange
      const trendingScores = [
        { ...mockPerformanceScore, scoring_period: '2024-01', total_score: 85 },
        { ...mockPerformanceScore, scoring_period: '2023-12', total_score: 82 },
        { ...mockPerformanceScore, scoring_period: '2023-11', total_score: 78 },
        { ...mockPerformanceScore, scoring_period: '2023-10', total_score: 75 }
      ];
      
      jest.spyOn(performanceService, 'getPerformanceScoresByOperator').mockResolvedValue(trendingScores);
      
      // Act
      const result = await performanceService.getPerformanceHistory('op-test-001');
      
      // Assert
      expect(result[0].improvement_trend).toBeGreaterThan(0); // Positive trend
    });

  });

  // =====================================================
  // METRIC VALIDATION TESTS
  // =====================================================

  describe('Performance Metric Validation', () => {
    
    it('should validate metric values are within expected ranges', () => {
      // Arrange
      const validMetrics = mockPerformanceMetrics;
      const invalidMetrics = {
        ...mockPerformanceMetrics,
        daily_vehicle_utilization: 1.5, // Invalid - over 100%
        safety_incident_rate: -0.1, // Invalid - negative
        customer_satisfaction: 6.0 // Invalid - over 5
      };
      
      // Act & Assert
      expect(performanceService.validateMetricsData(validMetrics)).toBe(true);
      expect(performanceService.validateMetricsData(invalidMetrics)).toBe(false);
    });

    it('should handle missing metric values gracefully', () => {
      // Arrange
      const incompleteMetrics = {
        daily_vehicle_utilization: 0.85,
        // Missing other required metrics
      };
      
      // Act & Assert
      expect(() => performanceService.validateMetricsData(incompleteMetrics)).not.toThrow();
      expect(performanceService.validateMetricsData(incompleteMetrics)).toBe(false);
    });

  });

  // =====================================================
  // SCORING FREQUENCY TESTS
  // =====================================================

  describe('Scoring Frequency', () => {
    
    it('should calculate daily scores correctly', async () => {
      // Arrange
      jest.spyOn(performanceService, 'getPerformanceMetrics').mockResolvedValue(mockPerformanceMetrics);
      
      // Act
      const result = await performanceService.calculatePerformanceScore('op-test-001', '2024-01-15', 'daily');
      
      // Assert
      expect(result.scoring_frequency).toBe('daily');
      expect(result.scoring_period).toBe('2024-01-15');
    });

    it('should calculate weekly scores correctly', async () => {
      // Arrange
      jest.spyOn(performanceService, 'getPerformanceMetrics').mockResolvedValue(mockPerformanceMetrics);
      
      // Act
      const result = await performanceService.calculatePerformanceScore('op-test-001', '2024-W03', 'weekly');
      
      // Assert
      expect(result.scoring_frequency).toBe('weekly');
      expect(result.scoring_period).toBe('2024-W03');
    });

    it('should calculate monthly scores correctly', async () => {
      // Arrange
      jest.spyOn(performanceService, 'getPerformanceMetrics').mockResolvedValue(mockPerformanceMetrics);
      
      // Act
      const result = await performanceService.calculatePerformanceScore('op-test-001', '2024-01', 'monthly');
      
      // Assert
      expect(result.scoring_frequency).toBe('monthly');
      expect(result.scoring_period).toBe('2024-01');
    });

  });

  // =====================================================
  // ERROR HANDLING TESTS
  // =====================================================

  describe('Error Handling', () => {
    
    it('should handle missing performance data gracefully', async () => {
      // Arrange
      jest.spyOn(performanceService, 'getPerformanceMetrics').mockResolvedValue(null);
      
      // Act & Assert
      await expect(performanceService.calculatePerformanceScore('op-test-001', '2024-01', 'monthly'))
        .rejects.toThrow('Performance metrics not available for the specified period');
    });

    it('should handle invalid operator ID', async () => {
      // Act & Assert
      await expect(performanceService.calculatePerformanceScore('invalid-id', '2024-01', 'monthly'))
        .rejects.toThrow('Invalid operator ID');
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      jest.spyOn(performanceService, 'getPerformanceMetrics').mockRejectedValue(new Error('Database connection failed'));
      
      // Act & Assert
      await expect(performanceService.calculatePerformanceScore('op-test-001', '2024-01', 'monthly'))
        .rejects.toThrow('Database connection failed');
    });

  });

  // =====================================================
  // PHILIPPINES SPECIFIC TESTS
  // =====================================================

  describe('Philippines Specific Features', () => {
    
    it('should consider typhoon season adjustments', async () => {
      // Arrange - Typhoon season period
      const typhoonPeriod = '2024-07'; // July is typhoon season
      const adjustedMetrics = {
        ...mockPerformanceMetrics,
        daily_vehicle_utilization: 0.60, // Lower due to weather
        peak_hour_availability: 0.70
      };
      
      jest.spyOn(performanceService, 'getPerformanceMetrics').mockResolvedValue(adjustedMetrics);
      jest.spyOn(performanceService, 'isTyphoonSeason').mockReturnValue(true);
      
      // Act
      const result = await performanceService.calculatePerformanceScore('op-test-001', typhoonPeriod, 'monthly');
      
      // Assert - Score should be adjusted for weather conditions
      expect(result.total_score).toBeGreaterThan(60); // Adjusted upward
      expect(result.tier_calculation_notes).toContain('typhoon season adjustment');
    });

    it('should apply regional performance variations', async () => {
      // Arrange - Rural region with different expectations
      const ruralMetrics = {
        ...mockPerformanceMetrics,
        service_area_coverage: 0.90, // Higher coverage in rural areas valued more
        technology_adoption: 0.70 // Lower tech adoption acceptable
      };
      
      jest.spyOn(performanceService, 'getPerformanceMetrics').mockResolvedValue(ruralMetrics);
      jest.spyOn(performanceService, 'getRegionalAdjustments').mockResolvedValue({
        region_type: 'rural',
        coverage_weight_multiplier: 1.2,
        tech_adoption_threshold_adjustment: -0.1
      });
      
      // Act
      const result = await performanceService.calculatePerformanceScore('op-test-001', '2024-01', 'monthly');
      
      // Assert
      expect(result.platform_contribution_score).toBeGreaterThan(17); // Boosted by coverage
    });

    it('should validate compliance with Philippine regulations', async () => {
      // Arrange
      const complianceData = {
        ltfrb_permit_status: 'active',
        lto_registration_status: 'valid',
        bir_tax_compliance: 'current',
        insurance_coverage: 'adequate',
        driver_licensing: 'professional'
      };
      
      jest.spyOn(performanceService, 'getComplianceData').mockResolvedValue(complianceData);
      
      // Act
      const complianceScore = performanceService.calculateComplianceScore(complianceData);
      
      // Assert
      expect(complianceScore).toBeCloseTo(25, 1); // Perfect compliance score
    });

  });

});