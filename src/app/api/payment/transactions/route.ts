import { NextRequest, NextResponse } from 'next/server';
import { 
  createApiResponse, 
  createApiError, 
  parseQueryParams,
  parsePaginationParams,
  applyPagination,
  asyncHandler,
  handleOptionsRequest
} from '@/lib/api-utils';
import { withEnhancedAuth } from '@/lib/auth/enhanced-auth';
import { auditLogger, AuditEventType, SecurityLevel } from '@/lib/security/auditLogger';
import { PaymentService } from '@/lib/services/PaymentService';
import { DatabaseService } from '@/lib/services/DatabaseService';

const db = new DatabaseService();
const paymentService = new PaymentService(db);

// OPTIONS handler
export const OPTIONS = handleOptionsRequest;

// GET /api/payment/transactions - Get payment transactions with filtering
const getTransactions = withEnhancedAuth({
  requiredPermissions: ['view_transactions'],
  requireMFA: false,
  auditRequired: false // Too frequent to audit every view
})(async (request: NextRequest, user) => {
  const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
  const queryParams = parseQueryParams(request);
  const paginationParams = parsePaginationParams(request);

  // Build filters
  const filters: any = {
    page: paginationParams.page,
    limit: paginationParams.limit
  };

  // Add filtering options
  if (queryParams.customer_id) {
    filters.customer_id = queryParams.customer_id as string;
  }

  if (queryParams.driver_id) {
    filters.driver_id = queryParams.driver_id as string;
  }

  if (queryParams.status) {
    // Validate status values
    const validStatuses = ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'];
    const status = queryParams.status as string;
    if (!validStatuses.includes(status)) {
      return createApiError(
        'Invalid status value',
        'INVALID_STATUS',
        400,
        { validStatuses }
      );
    }
    filters.status = status;
  }

  // Date range filtering
  if (queryParams.start_date) {
    const startDate = new Date(queryParams.start_date as string);
    if (isNaN(startDate.getTime())) {
      return createApiError(
        'Invalid start_date format',
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
        'Invalid end_date format',
        'INVALID_DATE',
        400
      );
    }
    filters.end_date = endDate.toISOString();
  }

  // Amount range filtering
  if (queryParams.min_amount) {
    const minAmount = parseFloat(queryParams.min_amount as string);
    if (isNaN(minAmount) || minAmount < 0) {
      return createApiError(
        'Invalid min_amount value',
        'INVALID_AMOUNT',
        400
      );
    }
    filters.min_amount = minAmount;
  }

  if (queryParams.max_amount) {
    const maxAmount = parseFloat(queryParams.max_amount as string);
    if (isNaN(maxAmount) || maxAmount < 0) {
      return createApiError(
        'Invalid max_amount value',
        'INVALID_AMOUNT',
        400
      );
    }
    filters.max_amount = maxAmount;
  }

  try {
    // Check permissions for viewing specific customer/driver data
    if (filters.customer_id || filters.driver_id) {
      if (!user.permissions.includes('view_sensitive_data')) {
        // Audit unauthorized access attempt
        await auditLogger.logEvent(
          AuditEventType.UNAUTHORIZED_ACCESS,
          SecurityLevel.HIGH,
          'WARNING',
          {
            attempted_access: 'sensitive_transaction_data',
            customer_id: filters.customer_id,
            driver_id: filters.driver_id
          },
          {
            userId: user.id,
            resource: 'payment_transactions',
            action: 'view_sensitive',
            ipAddress: clientIP
          }
        );

        return createApiError(
          'Insufficient permissions to view sensitive transaction data',
          'INSUFFICIENT_PERMISSIONS',
          403
        );
      }
    }

    // Get transactions
    const result = await paymentService.getTransactions(filters);

    // Build response with metadata
    const response = {
      transactions: result.transactions,
      pagination: {
        page: paginationParams.page,
        limit: paginationParams.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / paginationParams.limit),
        hasNext: paginationParams.page < Math.ceil(result.total / paginationParams.limit),
        hasPrev: paginationParams.page > 1
      },
      filters: filters,
      summary: {
        total_transactions: result.total,
        filters_applied: Object.keys(filters).filter(key => 
          key !== 'page' && key !== 'limit' && filters[key] !== undefined
        ).length
      }
    };

    // Audit bulk data access if viewing large amounts
    if (result.total > 1000 || filters.customer_id || filters.driver_id) {
      await auditLogger.logEvent(
        AuditEventType.DATA_EXPORT,
        SecurityLevel.MEDIUM,
        'INFO',
        {
          transaction_count: result.transactions.length,
          total_available: result.total,
          filters: filters,
          sensitive_data_accessed: !!(filters.customer_id || filters.driver_id)
        },
        {
          userId: user.id,
          resource: 'payment_transactions',
          action: 'bulk_view',
          ipAddress: clientIP
        }
      );
    }

    return createApiResponse(response, 'Transactions retrieved successfully');

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve transactions';

    return createApiError(
      'Failed to retrieve transactions',
      'QUERY_ERROR',
      500,
      { details: errorMessage }
    );
  }
});

export { getTransactions as GET };