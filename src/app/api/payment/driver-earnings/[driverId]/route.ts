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
import { PaymentService } from '@/lib/services/PaymentService';
import { DatabaseService } from '@/lib/services/DatabaseService';
import { DriverEarningsResponse } from '@/types/payment';

const db = new DatabaseService();
const paymentService = new PaymentService(db);

// OPTIONS handler
export const OPTIONS = handleOptionsRequest;

// GET /api/payment/driver-earnings/[driverId] - Get driver earnings breakdown
const getDriverEarnings = withEnhancedAuth({
  requiredPermissions: ['view_driver_earnings'],
  requireMFA: false,
  auditRequired: true
})(async (request: NextRequest, user, { params }: { params: { driverId: string } }) => {
  const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
  const queryParams = parseQueryParams(request);
  const { driverId } = params;

  if (!driverId) {
    return createApiError(
      'Driver ID is required',
      'MISSING_DRIVER_ID',
      400
    );
  }

  // Permission check - drivers can only view their own earnings
  if (user.role === 'driver' && user.driverId !== driverId) {
    await auditLogger.logEvent(
      AuditEventType.UNAUTHORIZED_ACCESS,
      SecurityLevel.HIGH,
      'WARNING',
      {
        attempted_driver_id: driverId,
        actual_driver_id: user.driverId,
        resource: 'driver_earnings'
      },
      {
        userId: user.id,
        resource: 'driver_earnings',
        action: 'unauthorized_view',
        ipAddress: clientIP
      }
    );

    return createApiError(
      'Insufficient permissions to view this driver\'s earnings',
      'INSUFFICIENT_PERMISSIONS',
      403
    );
  }

  // Parse date parameters
  let period_start: string;
  let period_end: string;

  if (queryParams.period_start && queryParams.period_end) {
    period_start = queryParams.period_start as string;
    period_end = queryParams.period_end as string;
    
    // Validate date format
    const startDate = new Date(period_start);
    const endDate = new Date(period_end);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return createApiError(
        'Invalid date format. Use YYYY-MM-DD',
        'INVALID_DATE_FORMAT',
        400
      );
    }

    if (startDate > endDate) {
      return createApiError(
        'Start date must be before end date',
        'INVALID_DATE_RANGE',
        400
      );
    }

    // Limit to maximum 1 year range
    const oneYear = 365 * 24 * 60 * 60 * 1000;
    if (endDate.getTime() - startDate.getTime() > oneYear) {
      return createApiError(
        'Date range cannot exceed 1 year',
        'DATE_RANGE_TOO_LARGE',
        400
      );
    }
  } else {
    // Default to current week
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
    endOfWeek.setHours(23, 59, 59, 999);
    
    period_start = startOfWeek.toISOString().split('T')[0];
    period_end = endOfWeek.toISOString().split('T')[0];
  }

  try {
    // Get driver earnings for the specified period
    const earnings = await paymentService.getDriverEarnings(driverId, period_start, period_end);

    // Get additional driver information if user has permissions
    let driver_info = null;
    if (user.permissions.includes('view_driver_details')) {
      driver_info = await getDriverBasicInfo(driverId);
    }

    // Audit earnings access
    await auditLogger.logEvent(
      AuditEventType.DATA_ACCESS,
      SecurityLevel.MEDIUM,
      'INFO',
      {
        driver_id: driverId,
        period_start,
        period_end,
        total_earnings: earnings.total_earnings,
        total_rides: earnings.total_rides,
        accessed_by: user.id,
        access_type: user.role === 'driver' && user.driverId === driverId ? 'self' : 'admin'
      },
      {
        userId: user.id,
        resource: 'driver_earnings',
        action: 'view',
        ipAddress: clientIP
      }
    );

    const response: DriverEarningsResponse = {
      ...earnings,
      driver_info,
      query_parameters: {
        period_start,
        period_end,
        requested_by: user.id,
        generated_at: new Date().toISOString()
      }
    };

    return createApiResponse(response, 'Driver earnings retrieved successfully');

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve driver earnings';

    // Audit failed access
    await auditLogger.logEvent(
      AuditEventType.DATA_ACCESS,
      SecurityLevel.MEDIUM,
      'ERROR',
      {
        driver_id: driverId,
        period_start,
        period_end,
        error: errorMessage
      },
      {
        userId: user.id,
        resource: 'driver_earnings',
        action: 'view_failed',
        ipAddress: clientIP
      }
    );

    return createApiError(
      'Failed to retrieve driver earnings',
      'QUERY_ERROR',
      500,
      { details: errorMessage }
    );
  }
});

// Helper function to get basic driver information
async function getDriverBasicInfo(driverId: string) {
  try {
    const query = `
      SELECT 
        d.id,
        d.name,
        d.status,
        d.created_at,
        COUNT(r.id) as total_lifetime_rides,
        AVG(CASE WHEN r.status = 'completed' THEN r.rating END) as average_rating
      FROM drivers d
      LEFT JOIN rides r ON d.id = r.driver_id
      WHERE d.id = $1
      GROUP BY d.id, d.name, d.status, d.created_at
    `;

    const result = await db.query(query, [driverId]);
    const driver = result.rows[0];

    if (!driver) {
      return null;
    }

    return {
      driver_id: driver.id,
      name: driver.name,
      status: driver.status,
      member_since: driver.created_at,
      lifetime_stats: {
        total_rides: parseInt(driver.total_lifetime_rides) || 0,
        average_rating: parseFloat(driver.average_rating) || 0
      }
    };
  } catch (error) {
    return null;
  }
}

export { getDriverEarnings as GET };