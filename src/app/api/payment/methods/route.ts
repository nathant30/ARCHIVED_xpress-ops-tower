import { NextRequest, NextResponse } from 'next/server';
import { 
  createApiResponse, 
  createApiError, 
  parseQueryParams,
  asyncHandler,
  handleOptionsRequest
} from '@/lib/api-utils';
import { withEnhancedAuth } from '@/lib/auth/enhanced-auth';
import { PaymentService } from '@/lib/services/PaymentService';
import { DatabaseService } from '@/lib/services/DatabaseService';

const db = new DatabaseService();
const paymentService = new PaymentService(db);

// OPTIONS handler
export const OPTIONS = handleOptionsRequest;

// GET /api/payment/methods - Get available payment methods
const getPaymentMethods = withEnhancedAuth({
  requiredPermissions: ['view_payment_methods'],
  requireMFA: false,
  auditRequired: false
})(async (request: NextRequest, user) => {
  const queryParams = parseQueryParams(request);

  // Parse query parameters
  const active_only = queryParams.active_only !== 'false'; // Default true
  const customer_id = queryParams.customer_id as string;

  try {
    let response: any = {};

    // Get available payment methods
    const available_methods = await paymentService.getPaymentMethods(active_only);

    // Get customer-specific payment methods if requested
    let customer_methods = null;
    if (customer_id) {
      // Verify user has permission to view this customer's data
      if (customer_id !== user.id && !user.permissions.includes('view_all_customers')) {
        return createApiError(
          'Insufficient permissions to view customer payment methods',
          'INSUFFICIENT_PERMISSIONS',
          403
        );
      }

      customer_methods = await paymentService.getCustomerPaymentMethods(customer_id);
    }

    // Build response
    response = {
      available_methods: available_methods.map(method => ({
        id: method.id,
        name: method.name,
        type: method.type,
        provider: method.provider,
        supported_currencies: method.supported_currencies,
        processing_fees: {
          percentage: method.processing_fee_percentage,
          fixed: method.processing_fee_fixed
        },
        is_active: method.is_active,
        // Don't expose provider_config for security
        features: {
          instant: method.type === 'gcash' || method.type === 'maya',
          refundable: method.type !== 'cash',
          requires_verification: method.type === 'card'
        }
      })),
      total_methods: available_methods.length
    };

    if (customer_methods) {
      response.customer_methods = customer_methods.map(method => ({
        id: method.id,
        payment_method_id: method.payment_method_id,
        display_name: method.display_name || method.name,
        type: method.type,
        provider: method.provider,
        is_default: method.is_default,
        is_active: method.is_active,
        created_at: method.created_at
      }));
      response.customer_default_method = customer_methods.find(method => method.is_default) || null;
    }

    // Add payment method statistics for admin users
    if (user.permissions.includes('view_payment_analytics')) {
      const stats = await getPaymentMethodStats();
      response.statistics = stats;
    }

    return createApiResponse(response, 'Payment methods retrieved successfully');

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve payment methods';

    return createApiError(
      'Failed to retrieve payment methods',
      'QUERY_ERROR',
      500,
      { details: errorMessage }
    );
  }
});

// Helper function to get payment method usage statistics
async function getPaymentMethodStats() {
  try {
    const query = `
      SELECT 
        pm.name,
        pm.type,
        COUNT(pt.id) as transaction_count,
        SUM(pt.amount) as total_volume,
        AVG(pt.amount) as average_amount,
        COUNT(CASE WHEN pt.status = 'completed' THEN 1 END) as successful_transactions,
        COUNT(CASE WHEN pt.status = 'failed' THEN 1 END) as failed_transactions,
        (COUNT(CASE WHEN pt.status = 'completed' THEN 1 END)::float / NULLIF(COUNT(pt.id), 0) * 100) as success_rate
      FROM payment_methods pm
      LEFT JOIN payment_transactions pt ON pm.id = pt.payment_method_id
      WHERE pm.is_active = true
        AND pt.created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY pm.id, pm.name, pm.type
      ORDER BY transaction_count DESC
    `;

    const result = await db.query(query);
    
    return result.rows.map(row => ({
      method_name: row.name,
      method_type: row.type,
      last_30_days: {
        transaction_count: parseInt(row.transaction_count) || 0,
        total_volume: parseFloat(row.total_volume) || 0,
        average_amount: parseFloat(row.average_amount) || 0,
        successful_transactions: parseInt(row.successful_transactions) || 0,
        failed_transactions: parseInt(row.failed_transactions) || 0,
        success_rate: parseFloat(row.success_rate) || 0
      }
    }));
  } catch (error) {
    // Return empty stats if query fails
    return [];
  }
}

export { getPaymentMethods as GET };