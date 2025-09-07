import { NextRequest, NextResponse } from 'next/server';
import { 
  createApiResponse, 
  createApiError, 
  parseQueryParams,
  asyncHandler,
  handleOptionsRequest
} from '@/lib/api-utils';
import { withEnhancedAuth } from '@/lib/auth/enhanced-auth';
import { CustomerService } from '@/lib/services/CustomerService';
import { DatabaseService } from '@/lib/services/DatabaseService';
import { CustomerPromotionsResponse } from '@/types/customer';

const db = new DatabaseService();
const customerService = new CustomerService(db);

// OPTIONS handler
export const OPTIONS = handleOptionsRequest;

// GET /api/customers/promotions - Get customer promotions and referral rewards
const getCustomerPromotions = withEnhancedAuth({
  requiredPermissions: ['view_promotions'],
  requireMFA: false,
  auditRequired: false
})(async (request: NextRequest, user) => {
  const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
  const queryParams = parseQueryParams(request);

  // Get customer ID - can be from query param (for admin) or from authenticated user
  let customer_id: string;
  
  if (queryParams.customer_id) {
    customer_id = queryParams.customer_id as string;
    
    // Verify user has permission to view other customers' promotions
    if (user.role === 'customer' && user.customerId !== customer_id) {
      return createApiError(
        'Cannot access other customers\' promotions',
        'INSUFFICIENT_PERMISSIONS',
        403
      );
    }

    if (!user.permissions.includes('view_all_promotions') && user.customerId !== customer_id) {
      return createApiError(
        'Insufficient permissions to view other customers\' promotions',
        'INSUFFICIENT_PERMISSIONS',
        403
      );
    }
  } else {
    // Default to authenticated user's customer profile
    if (!user.customerId) {
      return createApiError(
        'Customer profile not found for this user',
        'NO_CUSTOMER_PROFILE',
        404
      );
    }
    customer_id = user.customerId;
  }

  // Optional filter by status
  const status_filter = queryParams.status as string;
  if (status_filter && !['active', 'expired', 'used', 'cancelled'].includes(status_filter)) {
    return createApiError(
      'Invalid status filter',
      'INVALID_STATUS',
      400,
      { validStatuses: ['active', 'expired', 'used', 'cancelled'] }
    );
  }

  try {
    // Verify customer exists
    const customerCheck = await db.query(
      'SELECT id, status FROM customers WHERE id = $1',
      [customer_id]
    );

    if (customerCheck.rows.length === 0) {
      return createApiError(
        'Customer not found',
        'CUSTOMER_NOT_FOUND',
        404
      );
    }

    // Get customer promotions
    const result = await customerService.getCustomerPromotions(customer_id);

    // Build response based on requested data
    let response: CustomerPromotionsResponse = {
      active_promotions: result.active_promotions,
      expired_promotions: result.expired_promotions,
      used_promotions: result.used_promotions,
      available_referral_rewards: result.available_referral_rewards
    };

    // Filter by status if requested
    if (status_filter) {
      switch (status_filter) {
        case 'active':
          response = {
            active_promotions: result.active_promotions,
            expired_promotions: [],
            used_promotions: [],
            available_referral_rewards: result.available_referral_rewards
          };
          break;
        case 'expired':
          response = {
            active_promotions: [],
            expired_promotions: result.expired_promotions,
            used_promotions: [],
            available_referral_rewards: result.available_referral_rewards
          };
          break;
        case 'used':
          response = {
            active_promotions: [],
            expired_promotions: [],
            used_promotions: result.used_promotions,
            available_referral_rewards: result.available_referral_rewards
          };
          break;
      }
    }

    // Add metadata for different user types
    const metadata = {
      total_promotions: result.active_promotions.length + result.expired_promotions.length + result.used_promotions.length,
      total_savings: calculateTotalSavings(result.used_promotions),
      loyalty_tier: await getLoyaltyTier(customer_id),
      next_reward_milestone: await getNextRewardMilestone(customer_id)
    };

    // Add admin-specific data
    if (user.permissions.includes('view_promotion_analytics')) {
      metadata.promotion_analytics = await getPromotionAnalytics(customer_id);
    }

    return createApiResponse(
      {
        ...response,
        metadata
      }, 
      'Customer promotions retrieved successfully'
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve promotions';

    return createApiError(
      'Failed to retrieve customer promotions',
      'PROMOTIONS_ERROR',
      500,
      { details: errorMessage }
    );
  }
});

// Helper functions
function calculateTotalSavings(usedPromotions: any[]): number {
  return usedPromotions.reduce((total, promo) => {
    return total + (promo.discount_value * promo.used_count);
  }, 0);
}

async function getLoyaltyTier(customer_id: string): Promise<string> {
  try {
    // Get customer's total lifetime spending
    const query = `
      SELECT 
        SUM(pt.amount) as lifetime_spending,
        COUNT(r.id) as total_rides
      FROM customers c
      LEFT JOIN rides r ON c.id = r.customer_id AND r.status = 'completed'
      LEFT JOIN payment_transactions pt ON r.id = pt.ride_id AND pt.status = 'completed'
      WHERE c.id = $1
      GROUP BY c.id
    `;
    
    const result = await db.query(query, [customer_id]);
    
    if (result.rows.length === 0) {
      return 'new';
    }
    
    const { lifetime_spending, total_rides } = result.rows[0];
    const spending = parseFloat(lifetime_spending) || 0;
    const rides = parseInt(total_rides) || 0;

    // Tier calculation based on spending and ride count
    if (spending >= 50000 || rides >= 200) return 'platinum';
    if (spending >= 20000 || rides >= 100) return 'gold';
    if (spending >= 5000 || rides >= 50) return 'silver';
    if (spending >= 1000 || rides >= 10) return 'bronze';
    return 'new';
    
  } catch (error) {
    return 'new';
  }
}

async function getNextRewardMilestone(customer_id: string): Promise<any> {
  try {
    const currentTier = await getLoyaltyTier(customer_id);
    
    // Get current stats
    const query = `
      SELECT 
        SUM(pt.amount) as lifetime_spending,
        COUNT(r.id) as total_rides
      FROM customers c
      LEFT JOIN rides r ON c.id = r.customer_id AND r.status = 'completed'
      LEFT JOIN payment_transactions pt ON r.id = pt.ride_id AND pt.status = 'completed'
      WHERE c.id = $1
      GROUP BY c.id
    `;
    
    const result = await db.query(query, [customer_id]);
    const stats = result.rows[0] || { lifetime_spending: 0, total_rides: 0 };
    const currentSpending = parseFloat(stats.lifetime_spending) || 0;
    const currentRides = parseInt(stats.total_rides) || 0;

    // Define tier requirements
    const tiers = {
      bronze: { spending: 1000, rides: 10 },
      silver: { spending: 5000, rides: 50 },
      gold: { spending: 20000, rides: 100 },
      platinum: { spending: 50000, rides: 200 }
    };

    // Find next tier
    const tierOrder = ['bronze', 'silver', 'gold', 'platinum'];
    const currentTierIndex = tierOrder.indexOf(currentTier);
    const nextTier = tierOrder[currentTierIndex + 1];

    if (!nextTier) {
      return {
        tier: 'max',
        message: 'You\'ve reached the highest tier!',
        spending_needed: 0,
        rides_needed: 0
      };
    }

    const nextTierReq = tiers[nextTier];
    
    return {
      tier: nextTier,
      spending_needed: Math.max(0, nextTierReq.spending - currentSpending),
      rides_needed: Math.max(0, nextTierReq.rides - currentRides),
      current_progress: {
        spending: currentSpending,
        rides: currentRides
      },
      rewards: getTierRewards(nextTier)
    };
    
  } catch (error) {
    return null;
  }
}

function getTierRewards(tier: string): string[] {
  const rewards = {
    bronze: ['10% off every 10th ride', 'Birthday discount'],
    silver: ['15% off every 8th ride', 'Priority support', 'Exclusive promotions'],
    gold: ['20% off every 5th ride', 'Free ride monthly', 'Premium support', 'Airport discounts'],
    platinum: ['25% off every 3rd ride', 'Free rides weekly', 'VIP support', 'All premium features']
  };
  
  return rewards[tier] || [];
}

async function getPromotionAnalytics(customer_id: string): Promise<any> {
  try {
    const query = `
      SELECT 
        COUNT(*) as total_promotions_offered,
        COUNT(CASE WHEN used_count > 0 THEN 1 END) as promotions_used,
        SUM(discount_value * used_count) as total_discount_value,
        AVG(CASE WHEN used_count > 0 THEN EXTRACT(EPOCH FROM (updated_at - created_at))/86400 END) as avg_days_to_use,
        COUNT(CASE WHEN status = 'expired' AND used_count = 0 THEN 1 END) as expired_unused
      FROM customer_promotions 
      WHERE customer_id = $1
    `;
    
    const result = await db.query(query, [customer_id]);
    const stats = result.rows[0];
    
    return {
      total_promotions_offered: parseInt(stats.total_promotions_offered) || 0,
      promotions_used: parseInt(stats.promotions_used) || 0,
      usage_rate: stats.total_promotions_offered > 0 
        ? ((parseInt(stats.promotions_used) / parseInt(stats.total_promotions_offered)) * 100).toFixed(1)
        : 0,
      total_discount_value: parseFloat(stats.total_discount_value) || 0,
      avg_days_to_use: parseFloat(stats.avg_days_to_use) || 0,
      expired_unused: parseInt(stats.expired_unused) || 0
    };
    
  } catch (error) {
    return null;
  }
}

export { getCustomerPromotions as GET };