import { NextRequest, NextResponse } from 'next/server';
import { 
  createApiResponse, 
  createApiError, 
  parseQueryParams,
  asyncHandler,
  handleOptionsRequest
} from '@/lib/api-utils';
import { withEnhancedAuth } from '@/lib/auth/enhanced-auth';
import { auditLogger, AuditEventType, SecurityLevel } from '@/lib/security/auditLogger';
import { CustomerService } from '@/lib/services/CustomerService';
import { DatabaseService } from '@/lib/services/DatabaseService';
import { CustomerProfileResponse } from '@/types/customer';

const db = new DatabaseService();
const customerService = new CustomerService(db);

// OPTIONS handler
export const OPTIONS = handleOptionsRequest;

// GET /api/customers/profile - Get customer profile with all related data
const getCustomerProfile = withEnhancedAuth({
  requiredPermissions: ['view_customer_profile'],
  requireMFA: false,
  auditRequired: false // Too frequent to audit every profile view
})(async (request: NextRequest, user) => {
  const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
  const queryParams = parseQueryParams(request);

  // Get customer ID - can be from query param (for admin) or from authenticated user
  let customer_id: string;
  
  if (queryParams.customer_id) {
    customer_id = queryParams.customer_id as string;
    
    // Verify user has permission to view other customers
    if (user.role === 'customer' && user.customerId !== customer_id) {
      return createApiError(
        'Insufficient permissions to view this customer profile',
        'INSUFFICIENT_PERMISSIONS',
        403
      );
    }

    if (!user.permissions.includes('view_all_customers') && user.customerId !== customer_id) {
      return createApiError(
        'Insufficient permissions to view other customer profiles',
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

  try {
    // Get comprehensive customer profile
    const profileData = await customerService.getCustomerProfile(customer_id);

    // Audit sensitive data access for admin users viewing other profiles
    if (user.customerId !== customer_id) {
      await auditLogger.logEvent(
        AuditEventType.DATA_ACCESS,
        SecurityLevel.MEDIUM,
        'INFO',
        {
          viewed_customer_id: customer_id,
          viewed_customer_email: profileData.customer.email,
          viewer_role: user.role,
          access_type: 'customer_profile_admin'
        },
        {
          userId: user.id,
          resource: 'customer_profile',
          action: 'admin_view',
          ipAddress: clientIP
        }
      );
    }

    // Build response with appropriate data masking for different user roles
    let response: CustomerProfileResponse = {
      customer: profileData.customer,
      addresses: profileData.addresses,
      loyalty_points: profileData.loyalty_points,
      ride_stats: profileData.ride_stats,
      active_promotions: profileData.active_promotions,
      verification_status: profileData.verification_status
    };

    // Mask sensitive data based on user permissions
    if (!user.permissions.includes('view_sensitive_customer_data')) {
      // Remove sensitive fields for non-admin users
      response.customer = {
        ...response.customer,
        date_of_birth: undefined,
        emergency_contact: undefined,
        verification_documents: {},
        metadata: {}
      };
    }

    // Add additional admin-only data
    if (user.permissions.includes('view_customer_analytics')) {
      const additionalStats = await getCustomerAnalytics(customer_id);
      response.ride_stats = {
        ...response.ride_stats,
        ...additionalStats
      };
    }

    return createApiResponse(response, 'Customer profile retrieved successfully');

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve customer profile';

    if (errorMessage.includes('Customer not found')) {
      return createApiError(
        'Customer not found',
        'CUSTOMER_NOT_FOUND',
        404
      );
    }

    return createApiError(
      'Failed to retrieve customer profile',
      'PROFILE_ERROR',
      500,
      { details: errorMessage }
    );
  }
});

// Helper function to get additional analytics for admin users
async function getCustomerAnalytics(customer_id: string): Promise<any> {
  try {
    const query = `
      SELECT 
        COUNT(CASE WHEN r.status = 'completed' THEN 1 END) as completed_rides,
        COUNT(CASE WHEN r.status = 'cancelled' THEN 1 END) as cancelled_rides,
        AVG(CASE WHEN r.status = 'completed' THEN EXTRACT(EPOCH FROM (r.ended_at - r.started_at))/60 END) as avg_ride_duration_minutes,
        COUNT(CASE WHEN cst.priority = 'high' OR cst.priority = 'urgent' THEN 1 END) as high_priority_tickets,
        MAX(r.created_at) as last_ride_date,
        COUNT(CASE WHEN r.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as rides_last_30_days,
        SUM(CASE WHEN pt.status = 'completed' THEN pt.amount ELSE 0 END) as total_lifetime_spending
      FROM customers c
      LEFT JOIN rides r ON c.id = r.customer_id
      LEFT JOIN customer_support_tickets cst ON c.id = cst.customer_id
      LEFT JOIN payment_transactions pt ON r.id = pt.ride_id
      WHERE c.id = $1
      GROUP BY c.id
    `;

    const result = await db.query(query, [customer_id]);
    const stats = result.rows[0];

    if (!stats) return {};

    return {
      completed_rides: parseInt(stats.completed_rides) || 0,
      cancelled_rides: parseInt(stats.cancelled_rides) || 0,
      cancellation_rate: stats.completed_rides > 0 
        ? ((parseInt(stats.cancelled_rides) / (parseInt(stats.completed_rides) + parseInt(stats.cancelled_rides))) * 100).toFixed(1)
        : 0,
      avg_ride_duration_minutes: parseFloat(stats.avg_ride_duration_minutes) || 0,
      high_priority_support_tickets: parseInt(stats.high_priority_tickets) || 0,
      last_ride_date: stats.last_ride_date,
      rides_last_30_days: parseInt(stats.rides_last_30_days) || 0,
      activity_level: calculateActivityLevel(parseInt(stats.rides_last_30_days)),
      total_lifetime_spending: parseFloat(stats.total_lifetime_spending) || 0,
      customer_value_tier: calculateValueTier(parseFloat(stats.total_lifetime_spending))
    };
  } catch (error) {
    console.error('Failed to get customer analytics:', error);
    return {};
  }
}

function calculateActivityLevel(rides_last_30_days: number): string {
  if (rides_last_30_days >= 20) return 'very_high';
  if (rides_last_30_days >= 10) return 'high';
  if (rides_last_30_days >= 5) return 'medium';
  if (rides_last_30_days >= 1) return 'low';
  return 'inactive';
}

function calculateValueTier(lifetime_spending: number): string {
  if (lifetime_spending >= 50000) return 'platinum'; // PHP 50,000+
  if (lifetime_spending >= 20000) return 'gold';     // PHP 20,000+
  if (lifetime_spending >= 5000) return 'silver';    // PHP 5,000+
  if (lifetime_spending >= 1000) return 'bronze';    // PHP 1,000+
  return 'new';
}

export { getCustomerProfile as GET };