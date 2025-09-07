import { NextRequest, NextResponse } from 'next/server';
import { 
  createApiResponse, 
  createApiError, 
  parseQueryParams,
  parsePaginationParams,
  asyncHandler,
  handleOptionsRequest
} from '@/lib/api-utils';
import { withEnhancedAuth } from '@/lib/auth/enhanced-auth';
import { auditLogger, AuditEventType, SecurityLevel } from '@/lib/security/auditLogger';
import { CustomerService } from '@/lib/services/CustomerService';
import { DatabaseService } from '@/lib/services/DatabaseService';
import { CustomerRideHistoryResponse } from '@/types/customer';

const db = new DatabaseService();
const customerService = new CustomerService(db);

// OPTIONS handler
export const OPTIONS = handleOptionsRequest;

// GET /api/customers/ride-history - Get customer's ride history with filtering and pagination
const getCustomerRideHistory = withEnhancedAuth({
  requiredPermissions: ['view_ride_history'],
  requireMFA: false,
  auditRequired: false // Too frequent to audit every history view
})(async (request: NextRequest, user) => {
  const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
  const queryParams = parseQueryParams(request);
  const paginationParams = parsePaginationParams(request);

  // Get customer ID - can be from query param (for admin) or from authenticated user
  let customer_id: string;
  
  if (queryParams.customer_id) {
    customer_id = queryParams.customer_id as string;
    
    // Verify user has permission to view other customers' ride history
    if (user.role === 'customer' && user.customerId !== customer_id) {
      return createApiError(
        'Cannot access other customers\' ride history',
        'INSUFFICIENT_PERMISSIONS',
        403
      );
    }

    if (!user.permissions.includes('view_all_ride_history') && user.customerId !== customer_id) {
      return createApiError(
        'Insufficient permissions to view other customers\' ride history',
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

  // Build filters from query parameters
  const filters: any = {
    page: paginationParams.page,
    limit: paginationParams.limit
  };

  // Status filter
  if (queryParams.status) {
    const validStatuses = ['pending', 'accepted', 'en_route', 'arrived', 'in_progress', 'completed', 'cancelled'];
    const status = queryParams.status as string;
    if (!validStatuses.includes(status)) {
      return createApiError(
        'Invalid status filter',
        'INVALID_STATUS',
        400,
        { validStatuses }
      );
    }
    filters.status = status;
  }

  // Date range filters
  if (queryParams.start_date) {
    const startDate = new Date(queryParams.start_date as string);
    if (isNaN(startDate.getTime())) {
      return createApiError(
        'Invalid start_date format. Use YYYY-MM-DD',
        'INVALID_DATE',
        400
      );
    }
    filters.start_date = startDate.toISOString();
  }

  if (queryParams.end_date) {
    const endDate = new Date(queryParams.end_date as string);
    if (isNaN(endDate.getTime())) {
      return createApiError(
        'Invalid end_date format. Use YYYY-MM-DD',
        'INVALID_DATE',
        400
      );
    }
    filters.end_date = endDate.toISOString();
  }

  // Validate date range
  if (filters.start_date && filters.end_date) {
    if (new Date(filters.start_date) > new Date(filters.end_date)) {
      return createApiError(
        'Start date must be before or equal to end date',
        'INVALID_DATE_RANGE',
        400
      );
    }

    // Limit to maximum 1 year range for performance
    const oneYear = 365 * 24 * 60 * 60 * 1000;
    if (new Date(filters.end_date).getTime() - new Date(filters.start_date).getTime() > oneYear) {
      return createApiError(
        'Date range cannot exceed 1 year',
        'DATE_RANGE_TOO_LARGE',
        400
      );
    }
  }

  // Search filter for pickup/destination addresses
  if (queryParams.search) {
    filters.search = queryParams.search as string;
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

    // Get ride history
    const result = await customerService.getCustomerRideHistory(customer_id, filters);

    // Audit bulk data access for admin users or large requests
    if (user.customerId !== customer_id || result.pagination.total > 100) {
      await auditLogger.logEvent(
        AuditEventType.DATA_ACCESS,
        SecurityLevel.LOW,
        'INFO',
        {
          customer_id,
          total_rides: result.pagination.total,
          returned_rides: result.rides.length,
          filters: filters,
          access_type: user.customerId === customer_id ? 'self' : 'admin',
          date_range: filters.start_date && filters.end_date 
            ? `${filters.start_date} to ${filters.end_date}` 
            : 'all_time'
        },
        {
          userId: user.id,
          resource: 'customer_ride_history',
          action: 'bulk_view',
          ipAddress: clientIP
        }
      );
    }

    // Build response
    const response: CustomerRideHistoryResponse = {
      rides: result.rides,
      pagination: result.pagination,
      summary: result.summary
    };

    // Add additional context for different user types
    if (user.permissions.includes('view_detailed_ride_analytics')) {
      response.summary = {
        ...response.summary,
        date_range: {
          start: filters.start_date || result.rides[result.rides.length - 1]?.date,
          end: filters.end_date || result.rides[0]?.date
        },
        filters_applied: Object.keys(filters).filter(key => 
          key !== 'page' && key !== 'limit' && filters[key] !== undefined
        ).length,
        export_available: true
      };
    }

    return createApiResponse(
      response, 
      'Ride history retrieved successfully'
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve ride history';

    // Audit failed access
    await auditLogger.logEvent(
      AuditEventType.DATA_ACCESS,
      SecurityLevel.LOW,
      'ERROR',
      {
        customer_id,
        filters: filters,
        error: errorMessage
      },
      {
        userId: user.id,
        resource: 'customer_ride_history',
        action: 'view_failed',
        ipAddress: clientIP
      }
    );

    return createApiError(
      'Failed to retrieve ride history',
      'RIDE_HISTORY_ERROR',
      500,
      { details: errorMessage }
    );
  }
});

export { getCustomerRideHistory as GET };