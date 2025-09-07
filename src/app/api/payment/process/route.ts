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
import { ProcessPaymentRequest, ProcessPaymentResponse } from '@/types/payment';

const db = new DatabaseService();
const paymentService = new PaymentService(db);

// OPTIONS handler
export const OPTIONS = handleOptionsRequest;

// POST /api/payment/process - Process a payment for a ride
const processPayment = withEnhancedAuth({
  requiredPermissions: ['process_payments'],
  requireMFA: false,
  auditRequired: true
})(async (request: NextRequest, user) => {
  const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
  
  let body: ProcessPaymentRequest;
  
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
  const requiredFields = ['customer_id', 'payment_method_id', 'amount'];
  const validation = validateRequiredFields(body, requiredFields);
  if (!validation.isValid) {
    return createApiError(
      'Missing required fields',
      'VALIDATION_ERROR',
      400,
      { missingFields: validation.missingFields }
    );
  }

  // Validate amount
  if (body.amount <= 0) {
    return createApiError(
      'Amount must be greater than 0',
      'INVALID_AMOUNT',
      400
    );
  }

  if (body.amount > 50000) { // Max PHP 50,000
    return createApiError(
      'Amount exceeds maximum limit',
      'AMOUNT_TOO_HIGH',
      400
    );
  }

  try {
    // Audit the payment attempt
    await auditLogger.logEvent(
      AuditEventType.PAYMENT_ATTEMPT,
      SecurityLevel.HIGH,
      'INFO',
      {
        customer_id: body.customer_id,
        driver_id: body.driver_id,
        ride_id: body.ride_id,
        amount: body.amount,
        currency: body.currency || 'PHP',
        payment_method_id: body.payment_method_id
      },
      {
        userId: user.id,
        resource: 'payment',
        action: 'process',
        ipAddress: clientIP
      }
    );

    // Process the payment
    const transaction = await paymentService.processPayment({
      ride_id: body.ride_id,
      customer_id: body.customer_id,
      driver_id: body.driver_id,
      payment_method_id: body.payment_method_id,
      amount: body.amount,
      currency: body.currency || 'PHP',
      metadata: {
        ...body.metadata,
        processed_by: user.id,
        ip_address: clientIP,
        user_agent: request.headers.get('user-agent')
      }
    });

    // Audit successful payment
    await auditLogger.logEvent(
      AuditEventType.PAYMENT_SUCCESS,
      SecurityLevel.HIGH,
      'SUCCESS',
      {
        transaction_id: transaction.transaction_id,
        amount: transaction.amount,
        status: transaction.status,
        processing_fee: transaction.processing_fee,
        net_amount: transaction.net_amount
      },
      {
        userId: user.id,
        resource: 'payment',
        action: 'process',
        ipAddress: clientIP
      }
    );

    const response: ProcessPaymentResponse = {
      transaction_id: transaction.transaction_id,
      status: transaction.status,
      amount: transaction.amount,
      currency: transaction.currency,
      payment_intent_id: transaction.payment_intent_id,
      provider_response: transaction.provider_response,
      processing_fee: transaction.processing_fee,
      net_amount: transaction.net_amount,
      estimated_completion: transaction.status === 'pending' 
        ? new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
        : undefined
    };

    return createApiResponse(response, 'Payment processed successfully');

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Payment processing failed';

    // Audit failed payment
    await auditLogger.logEvent(
      AuditEventType.PAYMENT_FAILURE,
      SecurityLevel.HIGH,
      'ERROR',
      {
        customer_id: body.customer_id,
        amount: body.amount,
        error: errorMessage
      },
      {
        userId: user.id,
        resource: 'payment',
        action: 'process',
        ipAddress: clientIP
      }
    );

    // Specific error handling
    if (errorMessage.includes('Insufficient balance') || errorMessage.includes('Card declined')) {
      return createApiError(
        'Payment failed: ' + errorMessage,
        'PAYMENT_DECLINED',
        402 // Payment Required
      );
    }

    if (errorMessage.includes('Payment method not found')) {
      return createApiError(
        'Invalid payment method',
        'INVALID_PAYMENT_METHOD',
        400
      );
    }

    return createApiError(
      'Payment processing failed',
      'PAYMENT_ERROR',
      500,
      { details: errorMessage }
    );
  }
});

export { processPayment as POST };