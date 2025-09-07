// =====================================================
// OPERATORS ANALYTICS API - Dashboard analytics and reporting
// GET /api/operators/analytics - Get comprehensive operator analytics
// =====================================================

import { NextRequest } from 'next/server';
import { 
  createApiError, 
  parseQueryParams,
  handleOptionsRequest
} from '@/lib/api-utils';
import { withEnhancedAuth } from '@/lib/auth/enhanced-auth';
import { operatorService } from '@/lib/services/OperatorService';
import { OperatorFilters } from '@/types/operators';
import { versionedApiRoute, createVersionedResponse } from '@/middleware/apiVersioning';

// =====================================================
// GET OPERATOR ANALYTICS
// =====================================================

const getAnalyticsV1 = withEnhancedAuth({
  requiredPermissions: ['view_operators', 'view_analytics'],
  dataClass: 'internal'
})(async (request: NextRequest, user) => {
  const queryParams = parseQueryParams(request);
  
  try {
    // Apply regional filtering for users with regional restrictions
    let regionFilter = queryParams.region;
    const userRegions = user.allowedRegions || [];
    if (userRegions.length > 0 && regionFilter && !userRegions.includes(regionFilter)) {
      regionFilter = undefined; // Clear invalid region filter
    }
    
    // Build filters from query parameters
    const filters: OperatorFilters = {
      operator_type: queryParams.operator_type,
      status: queryParams.status,
      region_id: regionFilter,
      commission_tier: queryParams.commission_tier,
      performance_score_min: queryParams.performance_score_min as number,
      performance_score_max: queryParams.performance_score_max as number,
      created_from: queryParams.created_from as string,
      created_to: queryParams.created_to as string,
      account_manager: queryParams.account_manager as string
    };
    
    // Remove undefined filters
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof OperatorFilters] === undefined || filters[key as keyof OperatorFilters] === '') {
        delete filters[key as keyof OperatorFilters];
      }
    });
    
    // Apply regional restrictions to filters if user has limitations
    if (userRegions.length > 0) {
      // If no specific region requested, include all allowed regions
      if (!filters.region_id) {
        // For analytics, we'll aggregate across all allowed regions
        // The service will handle the regional filtering internally
      }
    }
    
    // Get comprehensive analytics
    const analytics = await operatorService.getAnalytics(filters);
    
    // Filter regional stats based on user permissions
    if (userRegions.length > 0) {
      analytics.regional_stats = analytics.regional_stats.filter(stat => 
        userRegions.includes(stat.region_id)
      );
    }
    
    // Calculate additional insights
    const insights = calculateAnalyticsInsights(analytics);
    
    // Build comprehensive response
    const response = {
      analytics: analytics,
      insights: insights,
      filters_applied: filters,
      regional_access: {
        has_restrictions: userRegions.length > 0,
        allowed_regions: userRegions,
        total_regions_analyzed: analytics.regional_stats.length
      },
      time_range: {
        generated_at: new Date().toISOString(),
        data_as_of: new Date().toISOString(),
        refresh_frequency: 'hourly'
      },
      key_metrics: {
        total_operators: analytics.total_operators,
        growth_rate: analytics.operator_growth_rate,
        avg_performance: analytics.avg_performance_score,
        revenue_metrics: {
          total_commissions: analytics.total_commissions_paid,
          total_boundary_fees: analytics.total_boundary_fees,
          avg_monthly_revenue: analytics.avg_monthly_revenue_per_operator
        }
      }
    };
    
    return createVersionedResponse(response, 'v1');
    
  } catch (error) {
    return createApiError(
      error instanceof Error ? error.message : 'Failed to retrieve operator analytics',
      'ANALYTICS_FETCH_ERROR',
      500,
      { error: error instanceof Error ? error.message : 'Unknown error', filters },
      '/api/operators/analytics',
      'GET'
    );
  }
});

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function calculateAnalyticsInsights(analytics: any): any {
  const insights = {
    operator_distribution: {
      type_balance: calculateTypeBalance(analytics.type_distribution),
      tier_concentration: calculateTierConcentration(analytics.tier_distribution),
      regional_spread: calculateRegionalSpread(analytics.regional_stats)
    },
    performance_insights: {
      performance_distribution: categorizePerformanceDistribution(analytics.avg_performance_score),
      tier_progression_potential: calculateTierProgression(analytics.tier_distribution),
      improvement_opportunities: identifyImprovementOpportunities(analytics)
    },
    financial_insights: {
      revenue_concentration: calculateRevenueConcentration(analytics),
      commission_efficiency: calculateCommissionEfficiency(analytics),
      growth_trajectory: categorizeGrowthTrajectory(analytics.operator_growth_rate)
    },
    operational_insights: {
      capacity_utilization: calculateCapacityUtilization(analytics),
      market_penetration: calculateMarketPenetration(analytics.regional_stats),
      scalability_indicators: assessScalabilityIndicators(analytics)
    }
  };
  
  return insights;
}

function calculateTypeBalance(typeDistribution: any): any {
  const total = typeDistribution.tnvs + typeDistribution.general + typeDistribution.fleet;
  if (total === 0) return { balance: 'no_data', analysis: 'No operators found' };
  
  const percentages = {
    tnvs: (typeDistribution.tnvs / total) * 100,
    general: (typeDistribution.general / total) * 100,
    fleet: (typeDistribution.fleet / total) * 100
  };
  
  const dominantType = Object.entries(percentages)
    .reduce((a, b) => percentages[a[0] as keyof typeof percentages] > percentages[b[0] as keyof typeof percentages] ? a : b)[0];
  
  let balance: string;
  if (percentages[dominantType as keyof typeof percentages] > 60) {
    balance = 'heavily_skewed';
  } else if (percentages[dominantType as keyof typeof percentages] > 45) {
    balance = 'moderately_skewed';
  } else {
    balance = 'well_balanced';
  }
  
  return {
    balance,
    percentages,
    dominant_type: dominantType,
    analysis: `${dominantType.toUpperCase()} operators represent ${percentages[dominantType as keyof typeof percentages].toFixed(1)}% of the fleet`
  };
}

function calculateTierConcentration(tierDistribution: any): any {
  const total = tierDistribution.tier_1 + tierDistribution.tier_2 + tierDistribution.tier_3;
  if (total === 0) return { concentration: 'no_data', analysis: 'No tier data available' };
  
  const percentages = {
    tier_1: (tierDistribution.tier_1 / total) * 100,
    tier_2: (tierDistribution.tier_2 / total) * 100,
    tier_3: (tierDistribution.tier_3 / total) * 100
  };
  
  let concentration: string;
  if (percentages.tier_1 > 70) {
    concentration = 'entry_heavy';
  } else if (percentages.tier_3 > 30) {
    concentration = 'premium_strong';
  } else if (percentages.tier_2 > 40) {
    concentration = 'intermediate_focused';
  } else {
    concentration = 'balanced';
  }
  
  return {
    concentration,
    percentages,
    tier_progression_rate: calculateTierProgressionRate(percentages),
    analysis: `${percentages.tier_1.toFixed(1)}% Tier 1, ${percentages.tier_2.toFixed(1)}% Tier 2, ${percentages.tier_3.toFixed(1)}% Tier 3`
  };
}

function calculateRegionalSpread(regionalStats: any[]): any {
  if (regionalStats.length === 0) {
    return { spread: 'no_data', analysis: 'No regional data available' };
  }
  
  const totalOperators = regionalStats.reduce((sum, region) => sum + region.operator_count, 0);
  const avgOperatorsPerRegion = totalOperators / regionalStats.length;
  
  const topRegion = regionalStats.reduce((max, region) => 
    region.operator_count > max.operator_count ? region : max
  );
  
  const concentrationRatio = (topRegion.operator_count / totalOperators) * 100;
  
  let spread: string;
  if (concentrationRatio > 50) {
    spread = 'highly_concentrated';
  } else if (concentrationRatio > 30) {
    spread = 'moderately_concentrated';
  } else {
    spread = 'well_distributed';
  }
  
  return {
    spread,
    total_regions: regionalStats.length,
    concentration_ratio: Number(concentrationRatio.toFixed(1)),
    top_region: {
      name: topRegion.region_name,
      operator_count: topRegion.operator_count,
      percentage: Number(concentrationRatio.toFixed(1))
    },
    avg_operators_per_region: Number(avgOperatorsPerRegion.toFixed(1)),
    analysis: `${topRegion.region_name} has ${concentrationRatio.toFixed(1)}% of all operators`
  };
}

function categorizePerformanceDistribution(avgScore: number): any {
  let category: string;
  let health: string;
  
  if (avgScore >= 85) {
    category = 'high_performing';
    health = 'excellent';
  } else if (avgScore >= 75) {
    category = 'good_performing';
    health = 'good';
  } else if (avgScore >= 65) {
    category = 'average_performing';
    health = 'needs_improvement';
  } else {
    category = 'underperforming';
    health = 'critical';
  }
  
  return {
    category,
    health,
    average_score: avgScore,
    analysis: `Average performance score of ${avgScore} indicates ${category.replace('_', ' ')} operator base`
  };
}

function calculateTierProgression(tierDistribution: any): any {
  const total = tierDistribution.tier_1 + tierDistribution.tier_2 + tierDistribution.tier_3;
  if (total === 0) return { potential: 'no_data' };
  
  const progressionPotential = {
    tier_1_to_tier_2: Math.floor(tierDistribution.tier_1 * 0.3), // Assume 30% could progress
    tier_2_to_tier_3: Math.floor(tierDistribution.tier_2 * 0.2)  // Assume 20% could progress
  };
  
  const totalProgression = progressionPotential.tier_1_to_tier_2 + progressionPotential.tier_2_to_tier_3;
  const progressionRate = (totalProgression / total) * 100;
  
  return {
    potential: progressionRate > 15 ? 'high' : progressionRate > 8 ? 'moderate' : 'low',
    progression_opportunities: progressionPotential,
    estimated_progression_rate: Number(progressionRate.toFixed(1)),
    analysis: `${totalProgression} operators (${progressionRate.toFixed(1)}%) have tier progression potential`
  };
}

function identifyImprovementOpportunities(analytics: any): string[] {
  const opportunities = [];
  
  if (analytics.avg_performance_score < 75) {
    opportunities.push('Implement performance improvement programs');
  }
  
  if (analytics.tier_distribution.tier_1 / analytics.total_operators > 0.7) {
    opportunities.push('Focus on tier advancement training and support');
  }
  
  if (analytics.operator_growth_rate < 5) {
    opportunities.push('Enhance operator acquisition and onboarding');
  }
  
  if (analytics.vehicle_utilization_avg < 70) {
    opportunities.push('Optimize vehicle utilization strategies');
  }
  
  return opportunities;
}

function calculateRevenueConcentration(analytics: any): any {
  // Mock calculation - in production this would analyze actual revenue distribution
  const estimatedTotalRevenue = analytics.total_commissions_paid + analytics.total_boundary_fees;
  const revenuePerOperator = analytics.total_operators > 0 
    ? estimatedTotalRevenue / analytics.total_operators 
    : 0;
  
  return {
    total_revenue: estimatedTotalRevenue,
    revenue_per_operator: Number(revenuePerOperator.toFixed(2)),
    concentration: revenuePerOperator > 100000 ? 'high_value' : 'standard',
    analysis: `Average revenue per operator: ₱${revenuePerOperator.toLocaleString()}`
  };
}

function calculateCommissionEfficiency(analytics: any): any {
  const commissionRate = analytics.total_operators > 0
    ? (analytics.total_commissions_paid / (analytics.total_commissions_paid + analytics.total_boundary_fees)) * 100
    : 0;
  
  return {
    commission_percentage: Number(commissionRate.toFixed(2)),
    efficiency: commissionRate > 15 ? 'high' : commissionRate > 8 ? 'moderate' : 'low',
    analysis: `Commission represents ${commissionRate.toFixed(1)}% of total operator revenue`
  };
}

function categorizeGrowthTrajectory(growthRate: number): any {
  let trajectory: string;
  let outlook: string;
  
  if (growthRate > 20) {
    trajectory = 'rapid_growth';
    outlook = 'excellent';
  } else if (growthRate > 10) {
    trajectory = 'strong_growth';
    outlook = 'good';
  } else if (growthRate > 0) {
    trajectory = 'steady_growth';
    outlook = 'stable';
  } else if (growthRate > -10) {
    trajectory = 'slight_decline';
    outlook = 'concerning';
  } else {
    trajectory = 'significant_decline';
    outlook = 'critical';
  }
  
  return {
    trajectory,
    outlook,
    growth_rate: growthRate,
    analysis: `${growthRate > 0 ? 'Growing' : 'Declining'} at ${Math.abs(growthRate).toFixed(1)}% rate`
  };
}

function calculateCapacityUtilization(analytics: any): any {
  // Mock calculation based on average utilization
  const utilizationRate = analytics.vehicle_utilization_avg || 0;
  
  let efficiency: string;
  if (utilizationRate > 85) {
    efficiency = 'highly_efficient';
  } else if (utilizationRate > 70) {
    efficiency = 'efficient';
  } else if (utilizationRate > 50) {
    efficiency = 'moderate';
  } else {
    efficiency = 'inefficient';
  }
  
  return {
    utilization_rate: utilizationRate,
    efficiency,
    capacity_headroom: 100 - utilizationRate,
    analysis: `${utilizationRate.toFixed(1)}% average vehicle utilization indicates ${efficiency} operations`
  };
}

function calculateMarketPenetration(regionalStats: any[]): any {
  if (regionalStats.length === 0) return { penetration: 'unknown' };
  
  const totalVehicles = regionalStats.reduce((sum, region) => sum + region.total_vehicles, 0);
  const avgVehiclesPerRegion = totalVehicles / regionalStats.length;
  
  return {
    total_vehicles: totalVehicles,
    avg_vehicles_per_region: Number(avgVehiclesPerRegion.toFixed(1)),
    regional_coverage: regionalStats.length,
    analysis: `Operating ${totalVehicles} vehicles across ${regionalStats.length} regions`
  };
}

function assessScalabilityIndicators(analytics: any): any {
  const indicators = {
    growth_momentum: analytics.operator_growth_rate > 5,
    performance_quality: analytics.avg_performance_score > 75,
    tier_diversity: analytics.tier_distribution.tier_3 > 0,
    regional_presence: analytics.regional_stats?.length > 3
  };
  
  const scalabilityScore = Object.values(indicators).filter(Boolean).length;
  
  let scalability: string;
  if (scalabilityScore >= 3) {
    scalability = 'high_scalability';
  } else if (scalabilityScore >= 2) {
    scalability = 'moderate_scalability';
  } else {
    scalability = 'limited_scalability';
  }
  
  return {
    scalability,
    scalability_score: scalabilityScore,
    indicators,
    analysis: `${scalabilityScore}/4 scalability indicators met`
  };
}

function calculateTierProgressionRate(percentages: any): number {
  // Calculate the rate at which operators might progress through tiers
  // This is a simplified calculation - in production it would analyze historical data
  const progressionPotential = (percentages.tier_1 * 0.1) + (percentages.tier_2 * 0.05);
  return Number(progressionPotential.toFixed(2));
}

// =====================================================
// ROUTE EXPORTS
// =====================================================

export const GET = versionedApiRoute({
  v1: getAnalyticsV1
});

export const OPTIONS = handleOptionsRequest;