// =====================================================
// OPERATOR PERFORMANCE API - Performance metrics and scoring
// GET /api/operators/[id]/performance - Get performance metrics
// POST /api/operators/[id]/performance/calculate - Calculate performance score
// =====================================================

import { NextRequest } from 'next/server';
import { 
  createApiResponse, 
  createApiError, 
  createNotFoundError,
  parseQueryParams,
  handleOptionsRequest
} from '@/lib/api-utils';
import { withEnhancedAuth } from '@/lib/auth/enhanced-auth';
import { operatorService } from '@/lib/services/OperatorService';
import { performanceService } from '@/lib/services/PerformanceService';
import { ScoringFrequency } from '@/types/operators';
import { versionedApiRoute, createVersionedResponse } from '@/middleware/apiVersioning';

// =====================================================
// GET PERFORMANCE METRICS
// =====================================================

const getPerformanceV1 = withEnhancedAuth({
  requiredPermissions: ['view_operators', 'view_performance_metrics'],
  dataClass: 'internal'
})(async (request: NextRequest, user, { params }: { params: { id: string } }) => {
  const { id } = params;
  const queryParams = parseQueryParams(request);
  
  try {
    // Verify operator exists and user has access
    const operator = await operatorService.getOperator(id);
    if (!operator) {
      return createNotFoundError('Operator', '/api/operators/' + id + '/performance', 'GET');
    }
    
    // Regional access check
    const userRegions = user.allowedRegions || [];
    if (userRegions.length > 0 && !userRegions.includes(operator.primary_region_id)) {
      return createApiError(
        'You do not have access to view performance metrics for operators in this region',
        'REGION_ACCESS_DENIED',
        403,
        { regionId: operator.primary_region_id, allowedRegions: userRegions },
        '/api/operators/' + id + '/performance',
        'GET'
      );
    }
    
    // Get performance history
    const limit = Math.min(Number(queryParams.limit) || 12, 50); // Max 50 records
    const performanceHistory = await performanceService.getPerformanceHistory(id, limit);
    
    // Get current performance score details
    const currentPerformance = performanceHistory[0] || null;
    
    // Get commission tier qualification status
    let tierQualification = null;
    try {
      tierQualification = await performanceService.evaluateCommissionTier(id);
    } catch (error) {
      // Log but don't fail - tier qualification might not be available
      console.warn('Failed to get tier qualification:', error);
    }
    
    // Calculate performance trends
    const trends = calculatePerformanceTrends(performanceHistory);
    
    // Build response
    const response = {
      operator_id: id,
      current_performance: currentPerformance,
      performance_history: performanceHistory,
      tier_qualification: tierQualification,
      trends: trends,
      summary: {
        current_score: operator.performance_score,
        current_tier: operator.commission_tier,
        tier_qualification_date: operator.tier_qualification_date,
        total_scoring_periods: performanceHistory.length,
        avg_score_last_12_periods: calculateAverageScore(performanceHistory, 12),
        best_score: getBestScore(performanceHistory),
        improvement_needed: Math.max(0, getNextTierMinimum(operator.commission_tier) - operator.performance_score)
      }
    };
    
    return createVersionedResponse(response, 'v1');
    
  } catch (error) {
    return createApiError(
      error instanceof Error ? error.message : 'Failed to retrieve performance metrics',
      'PERFORMANCE_FETCH_ERROR',
      500,
      { operatorId: id, error: error instanceof Error ? error.message : 'Unknown error' },
      '/api/operators/' + id + '/performance',
      'GET'
    );
  }
});

// =====================================================
// CALCULATE PERFORMANCE SCORE
// =====================================================

const calculatePerformanceV1 = withEnhancedAuth({
  requiredPermissions: ['manage_operators', 'calculate_performance'],
  dataClass: 'internal'
})(async (request: NextRequest, user, { params }: { params: { id: string } }) => {
  const { id } = params;
  
  try {
    // Verify operator exists and user has access
    const operator = await operatorService.getOperator(id);
    if (!operator) {
      return createNotFoundError('Operator', '/api/operators/' + id + '/performance', 'POST');
    }
    
    // Regional access check
    const userRegions = user.allowedRegions || [];
    if (userRegions.length > 0 && !userRegions.includes(operator.primary_region_id)) {
      return createApiError(
        'You do not have access to calculate performance for operators in this region',
        'REGION_ACCESS_DENIED',
        403,
        { regionId: operator.primary_region_id, allowedRegions: userRegions },
        '/api/operators/' + id + '/performance',
        'POST'
      );
    }
    
    const body = await request.json();
    
    // Validate request parameters
    const period = body.period || new Date().toISOString().split('T')[0]; // Default to today
    const frequency: ScoringFrequency = body.frequency || 'daily';
    
    if (!['daily', 'weekly', 'monthly', 'quarterly'].includes(frequency)) {
      return createApiError(
        'Invalid frequency. Must be one of: daily, weekly, monthly, quarterly',
        'INVALID_FREQUENCY',
        400,
        { providedFrequency: frequency },
        '/api/operators/' + id + '/performance',
        'POST'
      );
    }
    
    // Validate period format
    if (isNaN(Date.parse(period))) {
      return createApiError(
        'Invalid period format. Expected YYYY-MM-DD',
        'INVALID_PERIOD',
        400,
        { providedPeriod: period },
        '/api/operators/' + id + '/performance',
        'POST'
      );
    }
    
    // Calculate performance score
    const performanceScore = await performanceService.calculatePerformanceScore(id, period, frequency);
    
    // Check if this calculation triggered a tier change
    const tierChanged = operator.commission_tier !== performanceScore.commission_tier;
    
    // Get updated tier qualification if tier changed
    let newTierQualification = null;
    if (tierChanged) {
      try {
        newTierQualification = await performanceService.evaluateCommissionTier(id);
      } catch (error) {
        // Log but don't fail
        console.warn('Failed to evaluate new tier qualification:', error);
      }
    }
    
    const response = {
      performance_score: performanceScore,
      tier_changed: tierChanged,
      previous_tier: tierChanged ? operator.commission_tier : null,
      new_tier_qualification: newTierQualification,
      calculation_notes: [
        `Performance score calculated for period ${period} (${frequency} frequency)`,
        `Total score: ${performanceScore.total_score}/100`,
        `Commission tier: ${performanceScore.commission_tier}`,
        tierChanged ? `Tier changed from ${operator.commission_tier} to ${performanceScore.commission_tier}` : 'No tier change'
      ],
      breakdown: {
        vehicle_utilization: {
          score: performanceScore.vehicle_utilization_score,
          max_points: 30,
          percentage: (performanceScore.vehicle_utilization_score / 30) * 100
        },
        driver_management: {
          score: performanceScore.driver_management_score,
          max_points: 25,
          percentage: (performanceScore.driver_management_score / 25) * 100
        },
        compliance_safety: {
          score: performanceScore.compliance_safety_score,
          max_points: 25,
          percentage: (performanceScore.compliance_safety_score / 25) * 100
        },
        platform_contribution: {
          score: performanceScore.platform_contribution_score,
          max_points: 20,
          percentage: (performanceScore.platform_contribution_score / 20) * 100
        }
      }
    };
    
    return createVersionedResponse(response, 'v1');
    
  } catch (error) {
    return createApiError(
      error instanceof Error ? error.message : 'Failed to calculate performance score',
      'PERFORMANCE_CALCULATION_ERROR',
      500,
      { operatorId: id, error: error instanceof Error ? error.message : 'Unknown error' },
      '/api/operators/' + id + '/performance',
      'POST'
    );
  }
});

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function calculatePerformanceTrends(history: any[]): any {
  if (history.length < 2) {
    return {
      trend_direction: 'insufficient_data',
      trend_strength: 0,
      periods_analyzed: history.length
    };
  }
  
  const recentScores = history.slice(0, 6).map(h => h.total_score); // Last 6 periods
  const olderScores = history.slice(6, 12).map(h => h.total_score); // Previous 6 periods
  
  const recentAvg = recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length;
  const olderAvg = olderScores.length > 0 
    ? olderScores.reduce((sum, score) => sum + score, 0) / olderScores.length 
    : recentAvg;
  
  const trendValue = recentAvg - olderAvg;
  
  return {
    trend_direction: trendValue > 2 ? 'improving' : trendValue < -2 ? 'declining' : 'stable',
    trend_strength: Math.abs(trendValue),
    recent_average: Number(recentAvg.toFixed(2)),
    previous_average: Number(olderAvg.toFixed(2)),
    change_points: Number(trendValue.toFixed(2)),
    periods_analyzed: history.length
  };
}

function calculateAverageScore(history: any[], periods: number): number {
  if (history.length === 0) return 0;
  
  const relevantHistory = history.slice(0, periods);
  const sum = relevantHistory.reduce((acc, score) => acc + score.total_score, 0);
  return Number((sum / relevantHistory.length).toFixed(2));
}

function getBestScore(history: any[]): any {
  if (history.length === 0) return null;
  
  const bestScore = history.reduce((best, current) => 
    current.total_score > best.total_score ? current : best
  );
  
  return {
    score: bestScore.total_score,
    period: bestScore.scoring_period,
    tier: bestScore.commission_tier
  };
}

function getNextTierMinimum(currentTier: string): number {
  switch (currentTier) {
    case 'tier_1': return 80; // Minimum for tier_2
    case 'tier_2': return 90; // Minimum for tier_3
    case 'tier_3': return 100; // Already at highest tier
    default: return 70; // Minimum for tier_1
  }
}

// =====================================================
// ROUTE EXPORTS
// =====================================================

export const GET = versionedApiRoute({
  v1: (request: NextRequest, context: any) => getPerformanceV1(request, context.user, context)
});

export const POST = versionedApiRoute({
  v1: (request: NextRequest, context: any) => calculatePerformanceV1(request, context.user, context)
});

export const OPTIONS = handleOptionsRequest;