// =====================================================
// OPERATOR CALCULATIONS UTILITY
// Core calculation functions for operators management
// =====================================================

import { 
  CommissionTier, 
  PerformanceMetricsData,
  OperatorPerformanceScore,
  OperatorFinancialSummary,
  FinancialPeriodType 
} from '@/types/operators';

// =====================================================
// PERFORMANCE SCORE CALCULATIONS
// =====================================================

/**
 * Calculate total performance score from individual category scores
 */
export function calculateTotalPerformanceScore(
  vehicleUtilization: number,
  driverManagement: number,
  complianceSafety: number,
  platformContribution: number
): number {
  const total = vehicleUtilization + driverManagement + complianceSafety + platformContribution;
  return Math.min(Math.max(total, 0), 100); // Clamp between 0-100
}

/**
 * Calculate vehicle utilization score (max 30 points)
 */
export function calculateVehicleUtilizationScore(metrics: {
  daily_utilization: number;
  peak_availability: number;
  efficiency_ratio: number;
}): number {
  const scores = {
    daily: calculateMetricScore(metrics.daily_utilization, VEHICLE_UTILIZATION_THRESHOLDS.daily_vehicle_utilization),
    peak: calculateMetricScore(metrics.peak_availability, VEHICLE_UTILIZATION_THRESHOLDS.peak_hour_availability),
    efficiency: calculateMetricScore(metrics.efficiency_ratio, VEHICLE_UTILIZATION_THRESHOLDS.fleet_efficiency_ratio)
  };
  
  return Math.min(scores.daily + scores.peak + scores.efficiency, 30);
}

/**
 * Calculate driver management score (max 25 points)
 */
export function calculateDriverManagementScore(metrics: {
  retention_rate: number;
  performance_avg: number;
  training_completion: number;
}): number {
  const scores = {
    retention: calculateMetricScore(metrics.retention_rate, DRIVER_MANAGEMENT_THRESHOLDS.driver_retention_rate),
    performance: calculateMetricScore(metrics.performance_avg, DRIVER_MANAGEMENT_THRESHOLDS.driver_performance_avg),
    training: calculateMetricScore(metrics.training_completion, DRIVER_MANAGEMENT_THRESHOLDS.training_completion_rate)
  };
  
  return Math.min(scores.retention + scores.performance + scores.training, 25);
}

/**
 * Calculate compliance and safety score (max 25 points)
 */
export function calculateComplianceSafetyScore(metrics: {
  safety_incident_rate: number;
  regulatory_compliance: number;
  maintenance_score: number;
}): number {
  const scores = {
    safety: calculateInvertedMetricScore(metrics.safety_incident_rate, COMPLIANCE_SAFETY_THRESHOLDS.safety_incident_rate),
    compliance: calculateMetricScore(metrics.regulatory_compliance, COMPLIANCE_SAFETY_THRESHOLDS.regulatory_compliance),
    maintenance: calculateMetricScore(metrics.maintenance_score, COMPLIANCE_SAFETY_THRESHOLDS.vehicle_maintenance_score)
  };
  
  return Math.min(scores.safety + scores.compliance + scores.maintenance, 25);
}

/**
 * Calculate platform contribution score (max 20 points)
 */
export function calculatePlatformContributionScore(metrics: {
  customer_satisfaction: number;
  service_coverage: number;
  technology_adoption: number;
}): number {
  const scores = {
    satisfaction: calculateMetricScore(metrics.customer_satisfaction, PLATFORM_CONTRIBUTION_THRESHOLDS.customer_satisfaction),
    coverage: calculateMetricScore(metrics.service_coverage, PLATFORM_CONTRIBUTION_THRESHOLDS.service_area_coverage),
    technology: calculateMetricScore(metrics.technology_adoption, PLATFORM_CONTRIBUTION_THRESHOLDS.technology_adoption)
  };
  
  return Math.min(scores.satisfaction + scores.coverage + scores.technology, 20);
}

// =====================================================
// COMMISSION CALCULATIONS
// =====================================================

/**
 * Get commission rate for a given tier
 */
export function getCommissionRate(tier: CommissionTier): number {
  const rates = {
    tier_1: 1.0,
    tier_2: 2.0,
    tier_3: 3.0
  };
  return rates[tier];
}

/**
 * Calculate commission amount
 */
export function calculateCommissionAmount(
  baseFare: number,
  commissionRate: number,
  bonusMultiplier: number = 1
): number {
  const baseCommission = (baseFare * commissionRate) / 100;
  return baseCommission * bonusMultiplier;
}

/**
 * Calculate performance-based commission bonus
 */
export function calculatePerformanceBonus(
  performanceScore: number,
  baseCommission: number
): number {
  if (performanceScore >= 95) return baseCommission * 0.15; // 15% bonus
  if (performanceScore >= 90) return baseCommission * 0.10; // 10% bonus
  if (performanceScore >= 85) return baseCommission * 0.05; // 5% bonus
  return 0;
}

/**
 * Determine commission tier based on performance score and other criteria
 */
export function determineCommissionTier(
  performanceScore: number,
  tenureMonths: number,
  paymentConsistency: number,
  utilizationPercentile?: number
): CommissionTier {
  // Tier 3 requirements: 90+ score, 18+ months, 95%+ payments, top 25% utilization
  if (
    performanceScore >= 90 &&
    tenureMonths >= 18 &&
    paymentConsistency >= 95 &&
    (utilizationPercentile === undefined || utilizationPercentile <= 25)
  ) {
    return 'tier_3';
  }
  
  // Tier 2 requirements: 80+ score, 12+ months, 90%+ payments, top 50% utilization
  if (
    performanceScore >= 80 &&
    tenureMonths >= 12 &&
    paymentConsistency >= 90 &&
    (utilizationPercentile === undefined || utilizationPercentile <= 50)
  ) {
    return 'tier_2';
  }
  
  // Default to Tier 1
  return 'tier_1';
}

// =====================================================
// FINANCIAL CALCULATIONS
// =====================================================

/**
 * Calculate boundary fee with performance adjustments
 */
export function calculateBoundaryFee(
  baseFee: number,
  performanceScore: number,
  fuelSubsidy: number = 0,
  maintenanceAllowance: number = 0,
  otherAdjustments: number = 0
): {
  performanceAdjustment: number;
  bonus: number;
  totalAmount: number;
} {
  let performanceAdjustment = 0;
  let bonus = 0;
  
  // Performance-based adjustments
  if (performanceScore >= 95) {
    bonus = 100; // ₱100 excellent performance bonus
  } else if (performanceScore >= 90) {
    bonus = 50; // ₱50 high performance bonus
  } else if (performanceScore >= 85) {
    bonus = 25; // ₱25 good performance bonus
  } else if (performanceScore < 60) {
    performanceAdjustment = -50; // ₱50 poor performance penalty
  }
  
  const totalAmount = baseFee + fuelSubsidy + maintenanceAllowance + otherAdjustments + performanceAdjustment + bonus;
  
  return {
    performanceAdjustment,
    bonus,
    totalAmount: Math.max(totalAmount, 0) // Ensure non-negative
  };
}

/**
 * Calculate revenue share amount
 */
export function calculateRevenueShare(
  grossEarnings: number,
  sharePercentage: number
): number {
  return (grossEarnings * sharePercentage) / 100;
}

/**
 * Calculate financial summary metrics
 */
export function calculateFinancialSummary(data: {
  commissions: number;
  boundaryFees: number;
  incentives: number;
  subsidies: number;
  penalties: number;
  refunds: number;
  operationalCosts: number;
  totalTrips: number;
  activeDays: number;
}): Omit<OperatorFinancialSummary, 'id' | 'operator_id' | 'period_start' | 'period_end' | 'period_type' | 'calculated_at' | 'is_final'> {
  const grossRevenue = data.commissions + data.boundaryFees + data.incentives;
  const netRevenue = grossRevenue - data.penalties - data.refunds - data.operationalCosts;
  const profitMargin = grossRevenue > 0 ? ((netRevenue / grossRevenue) * 100) : 0;
  const avgDailyRevenue = data.activeDays > 0 ? (netRevenue / data.activeDays) : 0;
  
  return {
    total_commissions_earned: data.commissions,
    total_boundary_fees_collected: data.boundaryFees,
    total_incentive_bonuses: data.incentives,
    total_subsidies_provided: data.subsidies,
    total_penalties_deducted: data.penalties,
    total_refunds_processed: data.refunds,
    total_operational_costs: data.operationalCosts,
    gross_revenue: grossRevenue,
    net_revenue: netRevenue,
    profit_margin: Number(profitMargin.toFixed(2)),
    total_trips: data.totalTrips,
    total_active_days: data.activeDays,
    average_daily_revenue: Number(avgDailyRevenue.toFixed(2)),
    average_commission_rate: 0, // Would be calculated from actual transactions
    commission_tier_during_period: 'tier_1', // Would be determined from actual data
    performance_score_avg: 0, // Would be calculated from performance records
    payments_on_time: 0, // Would be calculated from payment records
    payments_late: 0, // Would be calculated from payment records
    payment_consistency_rate: 0, // Would be calculated from payment records
    revenue_growth_rate: undefined,
    trip_volume_growth_rate: undefined,
    recalculated_at: undefined
  };
}

// =====================================================
// TREND AND ANALYTICS CALCULATIONS
// =====================================================

/**
 * Calculate performance trend over time
 */
export function calculatePerformanceTrend(
  performanceHistory: OperatorPerformanceScore[]
): {
  direction: 'improving' | 'declining' | 'stable';
  strength: number;
  trendValue: number;
} {
  if (performanceHistory.length < 2) {
    return { direction: 'stable', strength: 0, trendValue: 0 };
  }
  
  // Calculate trend using linear regression
  const scores = performanceHistory.map(p => p.total_score);
  const trendValue = calculateLinearTrend(scores);
  
  const direction = trendValue > 2 ? 'improving' : trendValue < -2 ? 'declining' : 'stable';
  const strength = Math.abs(trendValue);
  
  return { direction, strength, trendValue };
}

/**
 * Calculate growth rate between two values
 */
export function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Calculate utilization efficiency
 */
export function calculateUtilizationEfficiency(
  actualUtilization: number,
  targetUtilization: number = 80
): {
  efficiency: number;
  status: 'excellent' | 'good' | 'fair' | 'poor';
} {
  const efficiency = (actualUtilization / targetUtilization) * 100;
  
  let status: 'excellent' | 'good' | 'fair' | 'poor';
  if (efficiency >= 95) status = 'excellent';
  else if (efficiency >= 85) status = 'good';
  else if (efficiency >= 70) status = 'fair';
  else status = 'poor';
  
  return { efficiency: Number(efficiency.toFixed(2)), status };
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Calculate score for a metric based on thresholds
 */
function calculateMetricScore(value: number, thresholds: any): number {
  const bands = ['excellent', 'good', 'average', 'poor'];
  
  for (const band of bands) {
    if (thresholds[band]) {
      const threshold = thresholds[band];
      if (threshold.min !== undefined && value >= threshold.min) {
        return threshold.points || 0;
      }
    }
  }
  
  return 0;
}

/**
 * Calculate inverted score (for metrics where lower is better)
 */
function calculateInvertedMetricScore(value: number, thresholds: any): number {
  const bands = ['excellent', 'good', 'average', 'poor'];
  
  for (const band of bands) {
    if (thresholds[band]) {
      const threshold = thresholds[band];
      if (threshold.max !== undefined && value <= threshold.max) {
        return threshold.points || 0;
      }
    }
  }
  
  return 0;
}

/**
 * Calculate linear trend from array of values
 */
function calculateLinearTrend(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  
  const x = Array.from({ length: n }, (_, i) => i);
  const sumX = x.reduce((sum, val) => sum + val, 0);
  const sumY = values.reduce((sum, val) => sum + val, 0);
  const sumXY = x.reduce((sum, val, i) => sum + val * values[i], 0);
  const sumXX = x.reduce((sum, val) => sum + val * val, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  return slope;
}

/**
 * Parse period string to date range
 */
export function parsePeriodToDateRange(
  period: string, 
  periodType: FinancialPeriodType
): { start: Date; end: Date } {
  const date = new Date(period);
  let start: Date;
  let end: Date;

  switch (periodType) {
    case 'daily':
      start = new Date(date);
      end = new Date(date);
      end.setHours(23, 59, 59, 999);
      break;
    case 'weekly':
      start = new Date(date);
      start.setDate(date.getDate() - date.getDay()); // Start of week
      end = new Date(start);
      end.setDate(start.getDate() + 6); // End of week
      end.setHours(23, 59, 59, 999);
      break;
    case 'monthly':
      start = new Date(date.getFullYear(), date.getMonth(), 1);
      end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'quarterly':
      const quarter = Math.floor(date.getMonth() / 3);
      start = new Date(date.getFullYear(), quarter * 3, 1);
      end = new Date(date.getFullYear(), quarter * 3 + 3, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'annual':
      start = new Date(date.getFullYear(), 0, 1);
      end = new Date(date.getFullYear(), 11, 31);
      end.setHours(23, 59, 59, 999);
      break;
    default:
      throw new Error(`Unsupported period type: ${periodType}`);
  }

  return { start, end };
}

// =====================================================
// PERFORMANCE THRESHOLDS
// =====================================================

const VEHICLE_UTILIZATION_THRESHOLDS = {
  daily_vehicle_utilization: {
    excellent: { min: 85, points: 12 },
    good: { min: 70, points: 9 },
    average: { min: 50, points: 6 },
    poor: { min: 0, points: 0 }
  },
  peak_hour_availability: {
    excellent: { min: 95, points: 9 },
    good: { min: 85, points: 6.5 },
    average: { min: 70, points: 4 },
    poor: { min: 0, points: 0 }
  },
  fleet_efficiency_ratio: {
    excellent: { min: 120, points: 9 },
    good: { min: 100, points: 6.5 },
    average: { min: 80, points: 4 },
    poor: { min: 0, points: 0 }
  }
};

const DRIVER_MANAGEMENT_THRESHOLDS = {
  driver_retention_rate: {
    excellent: { min: 90, points: 8.75 },
    good: { min: 80, points: 6.5 },
    average: { min: 60, points: 4 },
    poor: { min: 0, points: 0 }
  },
  driver_performance_avg: {
    excellent: { min: 85, points: 8.75 },
    good: { min: 75, points: 6.5 },
    average: { min: 60, points: 4 },
    poor: { min: 0, points: 0 }
  },
  training_completion_rate: {
    excellent: { min: 95, points: 7.5 },
    good: { min: 85, points: 5.5 },
    average: { min: 70, points: 3 },
    poor: { min: 0, points: 0 }
  }
};

const COMPLIANCE_SAFETY_THRESHOLDS = {
  safety_incident_rate: {
    excellent: { max: 0.5, points: 10 },
    good: { max: 1.0, points: 7.5 },
    average: { max: 2.0, points: 5 },
    poor: { max: 999, points: 0 }
  },
  regulatory_compliance: {
    excellent: { min: 98, points: 8.75 },
    good: { min: 95, points: 6.5 },
    average: { min: 90, points: 4 },
    poor: { min: 0, points: 0 }
  },
  vehicle_maintenance_score: {
    excellent: { min: 95, points: 6.25 },
    good: { min: 85, points: 4.5 },
    average: { min: 70, points: 2.5 },
    poor: { min: 0, points: 0 }
  }
};

const PLATFORM_CONTRIBUTION_THRESHOLDS = {
  customer_satisfaction: {
    excellent: { min: 4.8, points: 8 },
    good: { min: 4.5, points: 6 },
    average: { min: 4.0, points: 4 },
    poor: { min: 0, points: 0 }
  },
  service_area_coverage: {
    excellent: { min: 90, points: 6 },
    good: { min: 75, points: 4.5 },
    average: { min: 50, points: 2.5 },
    poor: { min: 0, points: 0 }
  },
  technology_adoption: {
    excellent: { min: 85, points: 6 },
    good: { min: 70, points: 4.5 },
    average: { min: 50, points: 2.5 },
    poor: { min: 0, points: 0 }
  }
};

export {
  VEHICLE_UTILIZATION_THRESHOLDS,
  DRIVER_MANAGEMENT_THRESHOLDS,
  COMPLIANCE_SAFETY_THRESHOLDS,
  PLATFORM_CONTRIBUTION_THRESHOLDS
};