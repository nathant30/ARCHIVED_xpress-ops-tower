import { NextRequest, NextResponse } from 'next/server';
import { 
  createApiResponse, 
  createApiError, 
  asyncHandler,
  handleOptionsRequest
} from '@/lib/api-utils';
import { auditLogger, AuditEventType, SecurityLevel } from '@/lib/security/auditLogger';
import { DatabaseService } from '@/lib/services/DatabaseService';
import { PaymentWebhookPayload } from '@/types/payment';
import crypto from 'crypto';

const db = new DatabaseService();

// OPTIONS handler
export const OPTIONS = handleOptionsRequest;

// POST /api/payment/webhook - Handle payment provider webhooks
const handlePaymentWebhook = asyncHandler(async (request: NextRequest) => {
  const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
  const provider = request.headers.get('x-provider') || 'unknown';
  const signature = request.headers.get('x-signature') || request.headers.get('stripe-signature') || '';
  
  let payload: any;
  let rawBody: string;
  
  try {
    rawBody = await request.text();
    payload = JSON.parse(rawBody);
  } catch (error) {
    return createApiError(
      'Invalid webhook payload',
      'INVALID_PAYLOAD',
      400
    );
  }

  // Generate webhook ID for tracking
  const webhook_id = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    // Store webhook for processing
    const webhookRecord = await storeWebhook(webhook_id, provider, payload, signature);

    // Verify webhook signature
    const isValidSignature = await verifyWebhookSignature(provider, rawBody, signature);
    if (!isValidSignature) {
      await auditLogger.logEvent(
        AuditEventType.WEBHOOK_SECURITY_VIOLATION,
        SecurityLevel.HIGH,
        'ERROR',
        {
          webhook_id,
          provider,
          signature_invalid: true,
          ip_address: clientIP
        },
        {
          userId: 'system',
          resource: 'payment_webhook',
          action: 'signature_verification_failed',
          ipAddress: clientIP
        }
      );

      return createApiError(
        'Invalid webhook signature',
        'INVALID_SIGNATURE',
        401
      );
    }

    // Process webhook based on event type
    const result = await processWebhookEvent(payload, provider);

    // Update webhook processing status
    await updateWebhookStatus(webhookRecord.id, true, null);

    // Audit successful webhook processing
    await auditLogger.logEvent(
      AuditEventType.WEBHOOK_PROCESSED,
      SecurityLevel.MEDIUM,
      'SUCCESS',
      {
        webhook_id,
        provider,
        event_type: payload.event_type || payload.type,
        processing_result: result
      },
      {
        userId: 'system',
        resource: 'payment_webhook',
        action: 'process',
        ipAddress: clientIP
      }
    );

    return createApiResponse(
      { 
        webhook_id,
        status: 'processed',
        event_type: payload.event_type || payload.type,
        result
      }, 
      'Webhook processed successfully'
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Webhook processing failed';

    // Update webhook with error
    try {
      await updateWebhookStatus(webhook_id, false, errorMessage);
    } catch (updateError) {
      // Log but don't fail the response
      console.error('Failed to update webhook status:', updateError);
    }

    // Audit failed webhook processing
    await auditLogger.logEvent(
      AuditEventType.WEBHOOK_FAILURE,
      SecurityLevel.HIGH,
      'ERROR',
      {
        webhook_id,
        provider,
        error: errorMessage,
        payload_preview: JSON.stringify(payload).substring(0, 500)
      },
      {
        userId: 'system',
        resource: 'payment_webhook',
        action: 'process',
        ipAddress: clientIP
      }
    );

    return createApiError(
      'Webhook processing failed',
      'WEBHOOK_ERROR',
      500,
      { details: errorMessage }
    );
  }
});

// Store webhook in database
async function storeWebhook(webhook_id: string, provider: string, payload: any, signature: string) {
  const query = `
    INSERT INTO payment_webhooks (
      webhook_id, provider, event_type, payload, signature, processed, processing_attempts
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;

  const values = [
    webhook_id,
    provider,
    payload.event_type || payload.type || 'unknown',
    JSON.stringify(payload),
    signature,
    false,
    0
  ];

  const result = await db.query(query, values);
  return result.rows[0];
}

// Update webhook processing status
async function updateWebhookStatus(webhook_id: string, processed: boolean, error_message: string | null) {
  const query = `
    UPDATE payment_webhooks 
    SET processed = $2, 
        processing_attempts = processing_attempts + 1,
        last_processing_attempt = CURRENT_TIMESTAMP,
        error_message = $3
    WHERE webhook_id = $1
  `;

  await db.query(query, [webhook_id, processed, error_message]);
}

// Verify webhook signature based on provider
async function verifyWebhookSignature(provider: string, payload: string, signature: string): Promise<boolean> {
  try {
    switch (provider.toLowerCase()) {
      case 'stripe':
        return verifyStripeSignature(payload, signature);
      case 'gcash':
        return verifyGCashSignature(payload, signature);
      case 'maya':
        return verifyMayaSignature(payload, signature);
      default:
        // For unknown providers, we'll accept for now but log
        console.warn(`Unknown webhook provider: ${provider}`);
        return true;
    }
  } catch (error) {
    console.error(`Signature verification failed for ${provider}:`, error);
    return false;
  }
}

// Stripe signature verification
function verifyStripeSignature(payload: string, signature: string): boolean {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return false;
  }

  try {
    const elements = signature.split(',');
    const signatureElements: { [key: string]: string } = {};
    
    for (const element of elements) {
      const [key, value] = element.split('=');
      signatureElements[key] = value;
    }

    if (!signatureElements.v1) {
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${signatureElements.t}.${payload}`, 'utf8')
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signatureElements.v1, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    return false;
  }
}

// GCash signature verification (mock implementation)
function verifyGCashSignature(payload: string, signature: string): boolean {
  const secret = process.env.GCASH_WEBHOOK_SECRET || 'gcash_test_secret';
  
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    return false;
  }
}

// Maya signature verification (mock implementation)
function verifyMayaSignature(payload: string, signature: string): boolean {
  const secret = process.env.MAYA_WEBHOOK_SECRET || 'maya_test_secret';
  
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    return false;
  }
}

// Process webhook event based on provider and event type
async function processWebhookEvent(payload: any, provider: string) {
  const event_type = payload.event_type || payload.type;
  
  switch (event_type) {
    case 'payment.succeeded':
    case 'payment_intent.succeeded':
      return await handlePaymentSuccess(payload, provider);
    
    case 'payment.failed':
    case 'payment_intent.payment_failed':
      return await handlePaymentFailure(payload, provider);
    
    case 'payout.paid':
    case 'payout.completed':
      return await handlePayoutSuccess(payload, provider);
    
    case 'payout.failed':
      return await handlePayoutFailure(payload, provider);
    
    case 'refund.succeeded':
      return await handleRefundSuccess(payload, provider);
    
    default:
      console.log(`Unhandled webhook event: ${event_type} from ${provider}`);
      return { status: 'ignored', reason: 'unhandled_event_type' };
  }
}

// Handle payment success webhook
async function handlePaymentSuccess(payload: any, provider: string) {
  const transaction_id = extractTransactionId(payload, provider);
  if (!transaction_id) {
    throw new Error('Transaction ID not found in webhook payload');
  }

  // Update transaction status
  const updateQuery = `
    UPDATE payment_transactions 
    SET status = 'completed',
        provider_response = $2,
        processed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE provider_transaction_id = $1 OR transaction_id = $1
    RETURNING *
  `;

  const result = await db.query(updateQuery, [transaction_id, JSON.stringify(payload)]);
  
  if (result.rows.length === 0) {
    throw new Error(`Transaction not found: ${transaction_id}`);
  }

  return { 
    status: 'updated',
    transaction_id,
    new_status: 'completed'
  };
}

// Handle payment failure webhook
async function handlePaymentFailure(payload: any, provider: string) {
  const transaction_id = extractTransactionId(payload, provider);
  if (!transaction_id) {
    throw new Error('Transaction ID not found in webhook payload');
  }

  const failure_reason = extractFailureReason(payload, provider);

  const updateQuery = `
    UPDATE payment_transactions 
    SET status = 'failed',
        failure_reason = $2,
        provider_response = $3,
        processed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE provider_transaction_id = $1 OR transaction_id = $1
    RETURNING *
  `;

  const result = await db.query(updateQuery, [transaction_id, failure_reason, JSON.stringify(payload)]);
  
  if (result.rows.length === 0) {
    throw new Error(`Transaction not found: ${transaction_id}`);
  }

  return { 
    status: 'updated',
    transaction_id,
    new_status: 'failed',
    failure_reason
  };
}

// Handle payout success webhook
async function handlePayoutSuccess(payload: any, provider: string) {
  const payout_id = extractPayoutId(payload, provider);
  if (!payout_id) {
    throw new Error('Payout ID not found in webhook payload');
  }

  const updateQuery = `
    UPDATE driver_payouts 
    SET status = 'completed',
        provider_response = $2,
        processed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE provider_payout_id = $1 OR payout_id = $1
    RETURNING *
  `;

  const result = await db.query(updateQuery, [payout_id, JSON.stringify(payload)]);
  
  if (result.rows.length === 0) {
    throw new Error(`Payout not found: ${payout_id}`);
  }

  return { 
    status: 'updated',
    payout_id,
    new_status: 'completed'
  };
}

// Handle payout failure webhook
async function handlePayoutFailure(payload: any, provider: string) {
  const payout_id = extractPayoutId(payload, provider);
  if (!payout_id) {
    throw new Error('Payout ID not found in webhook payload');
  }

  const failure_reason = extractFailureReason(payload, provider);

  const updateQuery = `
    UPDATE driver_payouts 
    SET status = 'failed',
        failure_reason = $2,
        provider_response = $3,
        updated_at = CURRENT_TIMESTAMP
    WHERE provider_payout_id = $1 OR payout_id = $1
    RETURNING *
  `;

  const result = await db.query(updateQuery, [payout_id, failure_reason, JSON.stringify(payload)]);
  
  if (result.rows.length === 0) {
    throw new Error(`Payout not found: ${payout_id}`);
  }

  return { 
    status: 'updated',
    payout_id,
    new_status: 'failed',
    failure_reason
  };
}

// Handle refund success webhook
async function handleRefundSuccess(payload: any, provider: string) {
  const refund_id = extractRefundId(payload, provider);
  if (!refund_id) {
    throw new Error('Refund ID not found in webhook payload');
  }

  const updateQuery = `
    UPDATE payment_refunds 
    SET status = 'completed',
        provider_response = $2,
        processed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE provider_refund_id = $1 OR refund_id = $1
    RETURNING *
  `;

  const result = await db.query(updateQuery, [refund_id, JSON.stringify(payload)]);
  
  if (result.rows.length === 0) {
    throw new Error(`Refund not found: ${refund_id}`);
  }

  return { 
    status: 'updated',
    refund_id,
    new_status: 'completed'
  };
}

// Helper functions to extract IDs from different provider payloads
function extractTransactionId(payload: any, provider: string): string | null {
  switch (provider.toLowerCase()) {
    case 'stripe':
      return payload.data?.object?.id || payload.data?.object?.payment_intent;
    case 'gcash':
      return payload.reference_number || payload.transaction_id;
    case 'maya':
      return payload.payment_id || payload.id;
    default:
      return payload.transaction_id || payload.id;
  }
}

function extractPayoutId(payload: any, provider: string): string | null {
  switch (provider.toLowerCase()) {
    case 'stripe':
      return payload.data?.object?.id;
    case 'gcash':
    case 'maya':
      return payload.payout_id || payload.id;
    default:
      return payload.payout_id || payload.id;
  }
}

function extractRefundId(payload: any, provider: string): string | null {
  switch (provider.toLowerCase()) {
    case 'stripe':
      return payload.data?.object?.id;
    case 'gcash':
    case 'maya':
      return payload.refund_id || payload.id;
    default:
      return payload.refund_id || payload.id;
  }
}

function extractFailureReason(payload: any, provider: string): string {
  switch (provider.toLowerCase()) {
    case 'stripe':
      return payload.data?.object?.last_payment_error?.message || 'Payment failed';
    case 'gcash':
      return payload.error_message || payload.message || 'Payment failed';
    case 'maya':
      return payload.failure_reason || payload.message || 'Payment failed';
    default:
      return payload.error_message || payload.message || 'Payment failed';
  }
}

export { handlePaymentWebhook as POST };