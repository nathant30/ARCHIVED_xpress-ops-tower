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
import { PayoutRequest, PayoutResponse } from '@/types/payment';

const db = new DatabaseService();
const paymentService = new PaymentService(db);

// OPTIONS handler
export const OPTIONS = handleOptionsRequest;

// POST /api/payment/payout - Process driver payout
const processDriverPayout = withEnhancedAuth({
  requiredPermissions: ['process_payouts', 'manage_driver_finances'],
  requireMFA: true, // Payouts require MFA
  auditRequired: true
})(async (request: NextRequest, user) => {
  const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
  
  let body: PayoutRequest;
  
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
  const requiredFields = ['driver_id', 'amount', 'payout_method', 'earnings_period_start', 'earnings_period_end'];
  const validation = validateRequiredFields(body, requiredFields);
  if (!validation.isValid) {
    return createApiError(
      'Missing required fields',
      'VALIDATION_ERROR',
      400,
      { missingFields: validation.missingFields }
    );
  }

  // Validate payout amount
  if (body.amount <= 0) {
    return createApiError(
      'Payout amount must be greater than 0',
      'INVALID_AMOUNT',
      400
    );
  }

  if (body.amount > 100000) { // Max PHP 100,000 per payout
    return createApiError(
      'Payout amount exceeds maximum limit of PHP 100,000',
      'AMOUNT_TOO_HIGH',
      400
    );
  }

  // Validate payout method
  const validMethods = ['bank_transfer', 'gcash', 'maya', 'cash'];
  if (!validMethods.includes(body.payout_method)) {
    return createApiError(
      'Invalid payout method',
      'INVALID_PAYOUT_METHOD',
      400,
      { validMethods }
    );
  }

  // Validate bank account details for bank transfers
  if (body.payout_method === 'bank_transfer') {
    if (!body.bank_account_details || !body.bank_account_details.account_number || !body.bank_account_details.bank_name) {
      return createApiError(
        'Bank account details required for bank transfer',
        'MISSING_BANK_DETAILS',
        400
      );
    }
  }

  // Validate date range
  const startDate = new Date(body.earnings_period_start);
  const endDate = new Date(body.earnings_period_end);
  
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return createApiError(
      'Invalid date format for earnings period',
      'INVALID_DATE_FORMAT',
      400
    );
  }

  if (startDate > endDate) {
    return createApiError(
      'Earnings period start date must be before end date',
      'INVALID_DATE_RANGE',
      400
    );
  }

  try {
    // Check if driver exists and is active
    const driverCheck = await db.query(
      'SELECT id, name, status FROM drivers WHERE id = $1',
      [body.driver_id]
    );

    if (driverCheck.rows.length === 0) {
      return createApiError(
        'Driver not found',
        'DRIVER_NOT_FOUND',
        404
      );
    }

    const driver = driverCheck.rows[0];
    if (driver.status !== 'active') {
      return createApiError(
        'Cannot process payout for inactive driver',
        'DRIVER_INACTIVE',
        400
      );
    }

    // Check for existing payout in the same period
    const existingPayoutCheck = await db.query(`
      SELECT id, status FROM driver_payouts 
      WHERE driver_id = $1 
        AND earnings_period_start = $2 
        AND earnings_period_end = $3
        AND status IN ('pending', 'processing', 'completed')
    `, [body.driver_id, body.earnings_period_start, body.earnings_period_end]);

    if (existingPayoutCheck.rows.length > 0) {
      const existing = existingPayoutCheck.rows[0];
      return createApiError(
        `Payout already exists for this period with status: ${existing.status}`,
        'DUPLICATE_PAYOUT',
        409,
        { existing_payout_id: existing.id }
      );
    }

    // Verify earnings for the period
    const earningsCheck = await db.query(`
      SELECT 
        COUNT(*) as ride_count,
        SUM(final_earnings) as total_earnings,
        SUM(CASE WHEN status = 'confirmed' THEN final_earnings ELSE 0 END) as confirmed_earnings
      FROM driver_earnings 
      WHERE driver_id = $1 
        AND earnings_date >= $2 
        AND earnings_date <= $3
    `, [body.driver_id, body.earnings_period_start, body.earnings_period_end]);

    const earningsData = earningsCheck.rows[0];
    const confirmedEarnings = parseFloat(earningsData.confirmed_earnings) || 0;

    if (confirmedEarnings === 0) {
      return createApiError(
        'No confirmed earnings found for the specified period',
        'NO_EARNINGS_FOUND',
        400
      );
    }

    if (body.amount > confirmedEarnings) {
      return createApiError(
        'Payout amount exceeds confirmed earnings for the period',
        'AMOUNT_EXCEEDS_EARNINGS',
        400,
        { 
          confirmed_earnings: confirmedEarnings,
          requested_amount: body.amount 
        }
      );
    }

    // Audit payout attempt
    await auditLogger.logEvent(
      AuditEventType.PAYOUT_ATTEMPT,
      SecurityLevel.HIGH,
      'INFO',
      {
        driver_id: body.driver_id,
        driver_name: driver.name,
        amount: body.amount,
        payout_method: body.payout_method,
        earnings_period_start: body.earnings_period_start,
        earnings_period_end: body.earnings_period_end,
        confirmed_earnings: confirmedEarnings,
        total_rides: parseInt(earningsData.ride_count)
      },
      {
        userId: user.id,
        resource: 'driver_payout',
        action: 'process',
        ipAddress: clientIP
      }
    );

    // Generate payout ID
    const payout_id = `payout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create payout record
    const insertQuery = `
      INSERT INTO driver_payouts (
        payout_id, driver_id, amount, currency, payout_method,
        bank_account_details, status, earnings_period_start,
        earnings_period_end, total_rides, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const insertValues = [
      payout_id,
      body.driver_id,
      body.amount,
      'PHP',
      body.payout_method,
      body.bank_account_details ? JSON.stringify(body.bank_account_details) : null,
      'pending',
      body.earnings_period_start,
      body.earnings_period_end,
      parseInt(earningsData.ride_count),
      JSON.stringify({
        ...body.metadata,
        processed_by: user.id,
        ip_address: clientIP,
        user_agent: request.headers.get('user-agent')
      })
    ];

    const result = await db.query(insertQuery, insertValues);
    const payout = result.rows[0];

    // Process with payout provider (mock implementation)
    try {
      const provider_result = await processPayoutWithProvider(payout);
      
      // Update payout with provider response
      await db.query(`
        UPDATE driver_payouts 
        SET status = $2, provider_payout_id = $3, provider_response = $4,
            processed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [
        payout.id,
        provider_result.status,
        provider_result.provider_payout_id,
        JSON.stringify(provider_result.provider_response)
      ]);

      // Update driver earnings status to 'paid'
      if (provider_result.status === 'completed') {
        await db.query(`
          UPDATE driver_earnings 
          SET status = 'paid', updated_at = CURRENT_TIMESTAMP
          WHERE driver_id = $1 
            AND earnings_date >= $2 
            AND earnings_date <= $3
            AND status = 'confirmed'
        `, [body.driver_id, body.earnings_period_start, body.earnings_period_end]);
      }

      // Audit successful payout
      await auditLogger.logEvent(
        AuditEventType.PAYOUT_SUCCESS,
        SecurityLevel.HIGH,
        'SUCCESS',
        {
          payout_id: payout.payout_id,
          driver_id: body.driver_id,
          amount: body.amount,
          status: provider_result.status,
          provider_payout_id: provider_result.provider_payout_id
        },
        {
          userId: user.id,
          resource: 'driver_payout',
          action: 'process',
          ipAddress: clientIP
        }
      );

      const response: PayoutResponse = {
        payout_id: payout.payout_id,
        status: provider_result.status,
        amount: payout.amount,
        currency: payout.currency,
        estimated_completion: provider_result.status === 'pending' 
          ? getEstimatedCompletion(body.payout_method)
          : undefined,
        provider_payout_id: provider_result.provider_payout_id
      };

      return createApiResponse(response, 'Driver payout processed successfully');

    } catch (providerError) {
      // Update payout status to failed
      await db.query(`
        UPDATE driver_payouts 
        SET status = 'failed', failure_reason = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [payout.id, (providerError as Error).message]);

      throw providerError;
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Payout processing failed';

    // Audit failed payout
    await auditLogger.logEvent(
      AuditEventType.PAYOUT_FAILURE,
      SecurityLevel.HIGH,
      'ERROR',
      {
        driver_id: body.driver_id,
        amount: body.amount,
        payout_method: body.payout_method,
        error: errorMessage
      },
      {
        userId: user.id,
        resource: 'driver_payout',
        action: 'process',
        ipAddress: clientIP
      }
    );

    return createApiError(
      'Payout processing failed',
      'PAYOUT_ERROR',
      500,
      { details: errorMessage }
    );
  }
});

// Mock payout provider integration
async function processPayoutWithProvider(payout: any) {
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay

  const success_rate = 0.96; // 96% success rate for payouts
  const is_successful = Math.random() < success_rate;

  if (is_successful) {
    let provider_payout_id: string;
    let status: string;

    switch (payout.payout_method) {
      case 'bank_transfer':
        provider_payout_id = `bank_${Date.now()}`;
        status = 'processing'; // Bank transfers take time
        break;
      case 'gcash':
        provider_payout_id = `gcash_payout_${Date.now()}`;
        status = 'completed'; // GCash is instant
        break;
      case 'maya':
        provider_payout_id = `maya_payout_${Date.now()}`;
        status = 'completed'; // Maya is instant
        break;
      case 'cash':
        provider_payout_id = `cash_${Date.now()}`;
        status = 'pending'; // Cash needs pickup
        break;
      default:
        throw new Error(`Unsupported payout method: ${payout.payout_method}`);
    }

    return {
      status,
      provider_payout_id,
      provider_response: {
        reference_number: provider_payout_id,
        status: status.toUpperCase(),
        message: 'Payout processed successfully'
      }
    };
  } else {
    throw new Error('Payout provider temporarily unavailable');
  }
}

// Get estimated completion time based on payout method
function getEstimatedCompletion(method: string): string {
  const now = new Date();
  let hoursToAdd: number;

  switch (method) {
    case 'gcash':
    case 'maya':
      hoursToAdd = 0; // Instant
      break;
    case 'bank_transfer':
      hoursToAdd = 24; // 1 business day
      break;
    case 'cash':
      hoursToAdd = 2; // 2 hours for pickup arrangement
      break;
    default:
      hoursToAdd = 24;
  }

  return new Date(now.getTime() + hoursToAdd * 60 * 60 * 1000).toISOString();
}

export { processDriverPayout as POST };