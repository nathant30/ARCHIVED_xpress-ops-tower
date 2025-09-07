import { NextRequest, NextResponse } from 'next/server';
import { 
  createApiResponse, 
  createApiError, 
  parseQueryParams,
  validateRequiredFields,
  asyncHandler,
  handleOptionsRequest
} from '@/lib/api-utils';
import { withEnhancedAuth } from '@/lib/auth/enhanced-auth';
import { auditLogger, AuditEventType, SecurityLevel } from '@/lib/security/auditLogger';
import { PaymentService } from '@/lib/services/PaymentService';
import { DatabaseService } from '@/lib/services/DatabaseService';
import { RefundRequest, RefundResponse } from '@/types/payment';

const db = new DatabaseService();
const paymentService = new PaymentService(db);

// OPTIONS handler
export const OPTIONS = handleOptionsRequest;

// POST /api/payment/refund - Process a refund for a transaction
const processRefund = withEnhancedAuth({
  requiredPermissions: ['process_refunds', 'handle_disputes'],
  requireMFA: true, // Refunds require MFA
  auditRequired: true
})(async (request: NextRequest, user) => {
  const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
  
  let body: RefundRequest;
  
  try {
    body = await request.json();
  } catch (error) {
    return createApiError(
      'Invalid JSON in request body',
      'INVALID_JSON',
      400
    );
  }

  // Validate required fields
  const requiredFields = ['transaction_id', 'reason'];
  const validation = validateRequiredFields(body, requiredFields);
  if (!validation.isValid) {
    return createApiError(
      'Missing required fields',
      'VALIDATION_ERROR',
      400,
      { missingFields: validation.missingFields }
    );
  }

  // Validate refund amount if provided
  if (body.amount !== undefined && body.amount <= 0) {
    return createApiError(
      'Refund amount must be greater than 0',
      'INVALID_AMOUNT',
      400
    );
  }

  try {
    // Get original transaction for validation
    const originalTransaction = await paymentService.getTransactionById(body.transaction_id);
    if (!originalTransaction) {
      return createApiError(
        'Original transaction not found',
        'TRANSACTION_NOT_FOUND',
        404
      );
    }

    // Audit the refund attempt
    await auditLogger.logEvent(
      AuditEventType.REFUND_ATTEMPT,
      SecurityLevel.HIGH,
      'INFO',
      {
        original_transaction_id: body.transaction_id,
        original_amount: originalTransaction.amount,
        refund_amount: body.amount || originalTransaction.amount,
        reason: body.reason,
        customer_id: originalTransaction.customer_id
      },
      {
        userId: user.id,
        resource: 'payment_refund',
        action: 'process',
        ipAddress: clientIP
      }
    );

    // Process the refund
    const refund = await paymentService.processRefund({
      transaction_id: body.transaction_id,
      amount: body.amount,
      reason: body.reason,
      requested_by: user.id,
      metadata: {
        ...body.metadata,
        processed_by: user.id,
        ip_address: clientIP,
        user_agent: request.headers.get('user-agent'),
        admin_justification: body.reason
      }
    });

    // Audit successful refund
    await auditLogger.logEvent(
      AuditEventType.REFUND_SUCCESS,
      SecurityLevel.HIGH,
      'SUCCESS',
      {
        refund_id: refund.refund_id,
        original_transaction_id: body.transaction_id,
        amount: refund.amount,
        status: refund.status,
        reason: refund.reason
      },
      {
        userId: user.id,
        resource: 'payment_refund',
        action: 'process',
        ipAddress: clientIP
      }
    );

    const response: RefundResponse = {
      refund_id: refund.refund_id,
      status: refund.status,
      amount: refund.amount,
      currency: refund.currency,
      estimated_completion: refund.status === 'pending' 
        ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days
        : undefined,
      provider_refund_id: refund.provider_refund_id
    };

    return createApiResponse(response, 'Refund processed successfully');

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Refund processing failed';

    // Audit failed refund
    await auditLogger.logEvent(
      AuditEventType.REFUND_FAILURE,
      SecurityLevel.HIGH,
      'ERROR',
      {
        original_transaction_id: body.transaction_id,
        refund_amount: body.amount,
        reason: body.reason,
        error: errorMessage
      },
      {
        userId: user.id,
        resource: 'payment_refund',
        action: 'process',
        ipAddress: clientIP
      }
    );

    // Specific error handling
    if (errorMessage.includes('not completed')) {
      return createApiError(
        'Cannot refund transaction that is not completed',
        'INVALID_TRANSACTION_STATUS',
        400
      );
    }

    if (errorMessage.includes('exceed original')) {
      return createApiError(
        'Refund amount exceeds original transaction amount',
        'REFUND_AMOUNT_TOO_HIGH',
        400
      );
    }

    if (errorMessage.includes('already refunded')) {
      return createApiError(
        'Transaction has already been refunded',
        'ALREADY_REFUNDED',
        409
      );
    }

    return createApiError(
      'Refund processing failed',
      'REFUND_ERROR',
      500,
      { details: errorMessage }
    );
  }
});

export { processRefund as POST };