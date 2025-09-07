// =====================================================
// OPERATOR COMMISSION TIER API - Commission tier management
// POST /api/operators/[id]/commission-tier - Update operator commission tier
// =====================================================

import { NextRequest } from 'next/server';
import { 
  createApiError, 
  createNotFoundError,
  createValidationError,
  validateRequiredFields,
  handleOptionsRequest
} from '@/lib/api-utils';
import { withEnhancedAuth } from '@/lib/auth/enhanced-auth';
import { operatorService } from '@/lib/services/OperatorService';
import { performanceService } from '@/lib/services/PerformanceService';
import { CommissionTier, UpdateCommissionTierRequest } from '@/types/operators';
import { versionedApiRoute, createVersionedResponse } from '@/middleware/apiVersioning';

// =====================================================
// UPDATE COMMISSION TIER
// =====================================================

const updateCommissionTierV1 = withEnhancedAuth({
  requiredPermissions: ['manage_operators', 'update_commission_tier'],
  dataClass: 'internal',
  requireMFA: true // Require MFA for commission tier changes
})(async (request: NextRequest, user, { params }: { params: { id: string } }) => {
  const { id } = params;
  
  try {
    // Verify operator exists and user has access
    const operator = await operatorService.getOperator(id);
    if (!operator) {
      return createNotFoundError('Operator', '/api/operators/' + id + '/commission-tier', 'POST');
    }
    
    // Regional access check
    const userRegions = user.allowedRegions || [];
    if (userRegions.length > 0 && !userRegions.includes(operator.primary_region_id)) {
      return createApiError(
        'You do not have access to update commission tiers for operators in this region',
        'REGION_ACCESS_DENIED',
        403,
        { regionId: operator.primary_region_id, allowedRegions: userRegions },
        '/api/operators/' + id + '/commission-tier',
        'POST'
      );
    }
    
    // Additional permission check - only senior roles can change commission tiers
    if (!user.permissions.includes('update_commission_tier_unrestricted')) {
      return createApiError(
        'Insufficient permissions to update commission tiers',
        'INSUFFICIENT_PERMISSIONS',
        403,
        { requiredPermission: 'update_commission_tier_unrestricted' },
        '/api/operators/' + id + '/commission-tier',
        'POST'
      );
    }
    
    const body = await request.json();
    
    // Validate required fields
    const validationErrors = validateRequiredFields(body, ['target_tier']);
    
    // Validate commission tier value
    if (body.target_tier && !['tier_1', 'tier_2', 'tier_3'].includes(body.target_tier)) {
      validationErrors.push({
        field: 'target_tier',
        message: 'Target tier must be one of: tier_1, tier_2, tier_3',
        code: 'INVALID_COMMISSION_TIER',
      });
    }
    
    if (validationErrors.length > 0) {
      return createValidationError(validationErrors, '/api/operators/' + id + '/commission-tier', 'POST');
    }
    
    const updateRequest: UpdateCommissionTierRequest = {
      operator_id: id,
      target_tier: body.target_tier as CommissionTier,
      notes: body.notes || `Commission tier updated by ${user.firstName} ${user.lastName}`
    };
    
    // Check if the tier change is valid
    if (operator.commission_tier === updateRequest.target_tier) {
      return createApiError(
        'Operator is already at the requested commission tier',
        'NO_TIER_CHANGE_NEEDED',
        400,
        { currentTier: operator.commission_tier, targetTier: updateRequest.target_tier },
        '/api/operators/' + id + '/commission-tier',
        'POST'
      );
    }
    
    // Evaluate if operator qualifies for the requested tier
    let tierQualification;
    try {
      tierQualification = await performanceService.evaluateCommissionTier(id);
    } catch (error) {
      return createApiError(
        'Failed to evaluate tier qualification',
        'TIER_EVALUATION_ERROR',
        500,
        { error: error instanceof Error ? error.message : 'Unknown error' },
        '/api/operators/' + id + '/commission-tier',
        'POST'
      );
    }
    
    // Check if operator meets the requirements for the requested tier
    const tierHierarchy = ['tier_1', 'tier_2', 'tier_3'];
    const currentTierIndex = tierHierarchy.indexOf(operator.commission_tier);
    const targetTierIndex = tierHierarchy.indexOf(updateRequest.target_tier);
    const maxQualifiedTierIndex = tierHierarchy.indexOf(tierQualification.target_tier);
    
    // Allow downgrading without qualification check
    const isDowngrade = targetTierIndex < currentTierIndex;
    
    // For upgrades, check qualification
    if (!isDowngrade && targetTierIndex > maxQualifiedTierIndex) {
      return createApiError(
        `Operator does not qualify for ${updateRequest.target_tier}. Maximum qualified tier: ${tierQualification.target_tier}`,
        'TIER_QUALIFICATION_FAILED',
        400,
        { 
          currentTier: operator.commission_tier,
          requestedTier: updateRequest.target_tier,
          maxQualifiedTier: tierQualification.target_tier,
          qualificationStatus: tierQualification.qualification_status,
          requirements: {
            score_qualified: tierQualification.score_qualified,
            tenure_qualified: tierQualification.tenure_qualified,
            payment_qualified: tierQualification.payment_qualified,
            utilization_qualified: tierQualification.utilization_qualified
          }
        },
        '/api/operators/' + id + '/commission-tier',
        'POST'
      );
    }
    
    // Calculate financial impact of tier change
    const financialImpact = await calculateTierChangeImpact(
      operator,
      operator.commission_tier,
      updateRequest.target_tier
    );
    
    // Update the commission tier
    await performanceService.updateCommissionTier(updateRequest);
    
    // Get updated operator data
    const updatedOperator = await operatorService.getOperator(id);
    
    const response = {
      operator_id: id,
      tier_change: {
        previous_tier: operator.commission_tier,
        new_tier: updateRequest.target_tier,
        change_type: isDowngrade ? 'downgrade' : 'upgrade',
        effective_date: new Date().toISOString().split('T')[0],
        changed_by: `${user.firstName} ${user.lastName}`,
        notes: updateRequest.notes
      },
      qualification_details: tierQualification,
      financial_impact: financialImpact,
      operator: updatedOperator,
      next_evaluation_date: tierQualification.next_evaluation_date,
      requirements_for_next_tier: getNextTierRequirements(updateRequest.target_tier)
    };
    
    return createVersionedResponse(response, 'v1');
    
  } catch (error) {
    // Handle specific business logic errors
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return createNotFoundError('Operator', '/api/operators/' + id + '/commission-tier', 'POST');
      }
      
      if (error.message.includes('does not qualify')) {
        return createApiError(
          error.message,
          'TIER_QUALIFICATION_FAILED',
          400,
          { operatorId: id },
          '/api/operators/' + id + '/commission-tier',
          'POST'
        );
      }
    }
    
    return createApiError(
      error instanceof Error ? error.message : 'Failed to update commission tier',
      'COMMISSION_TIER_UPDATE_ERROR',
      500,
      { operatorId: id, error: error instanceof Error ? error.message : 'Unknown error' },
      '/api/operators/' + id + '/commission-tier',
      'POST'
    );
  }
});

// =====================================================
// HELPER FUNCTIONS
// =====================================================

async function calculateTierChangeImpact(
  operator: any,
  fromTier: CommissionTier,
  toTier: CommissionTier
): Promise<any> {
  // Mock calculation - in production this would analyze historical earnings
  const tierRates = {
    tier_1: 1.0,
    tier_2: 2.0,
    tier_3: 3.0
  };
  
  const fromRate = tierRates[fromTier];
  const toRate = tierRates[toTier];
  const rateChange = toRate - fromRate;
  
  // Estimate based on average monthly commissions
  const estimatedMonthlyCommissionBase = 50000; // ₱50,000 average monthly bookings
  const monthlyImpact = (estimatedMonthlyCommissionBase * rateChange) / 100;
  const annualImpact = monthlyImpact * 12;
  
  return {
    commission_rate_change: {
      from_rate: fromRate,
      to_rate: toRate,
      percentage_change: rateChange
    },
    estimated_impact: {
      monthly_change: Number(monthlyImpact.toFixed(2)),
      annual_change: Number(annualImpact.toFixed(2)),
      impact_type: monthlyImpact > 0 ? 'increase' : 'decrease'
    },
    calculation_notes: [
      `Commission rate ${rateChange > 0 ? 'increased' : 'decreased'} from ${fromRate}% to ${toRate}%`,
      `Estimated monthly impact: ₱${monthlyImpact.toFixed(2)}`,
      `Based on average commission base of ₱${estimatedMonthlyCommissionBase.toLocaleString()}`
    ]
  };
}

function getNextTierRequirements(currentTier: CommissionTier): any {
  switch (currentTier) {
    case 'tier_1':
      return {
        next_tier: 'tier_2',
        requirements: {
          min_performance_score: 80,
          min_tenure_months: 12,
          min_payment_consistency: 90,
          min_utilization_percentile: 50
        }
      };
    case 'tier_2':
      return {
        next_tier: 'tier_3',
        requirements: {
          min_performance_score: 90,
          min_tenure_months: 18,
          min_payment_consistency: 95,
          min_utilization_percentile: 25
        }
      };
    case 'tier_3':
      return {
        next_tier: null,
        message: 'Already at highest commission tier'
      };
    default:
      return null;
  }
}

// =====================================================
// ROUTE EXPORTS
// =====================================================

export const POST = versionedApiRoute({
  v1: (request: NextRequest, context: any) => updateCommissionTierV1(request, context.user, context)
});

export const OPTIONS = handleOptionsRequest;