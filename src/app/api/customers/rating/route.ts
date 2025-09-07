import { NextRequest, NextResponse } from 'next/server';
import { 
  createApiResponse, 
  createApiError, 
  validateRequiredFields,
  asyncHandler,
  handleOptionsRequest
} from '@/lib/api-utils';
import { withEnhancedAuth } from '@/lib/auth/enhanced-auth';
import { auditLogger, AuditEventType, SecurityLevel } from '@/lib/security/auditLogger';
import { CustomerService } from '@/lib/services/CustomerService';
import { DatabaseService } from '@/lib/services/DatabaseService';
import { RateRideRequest, RateRideResponse } from '@/types/customer';

const db = new DatabaseService();
const customerService = new CustomerService(db);

// OPTIONS handler
export const OPTIONS = handleOptionsRequest;

// POST /api/customers/rating - Rate a completed ride
const rateRide = withEnhancedAuth({
  requiredPermissions: ['rate_rides'],
  requireMFA: false,
  auditRequired: true
})(async (request: NextRequest, user) => {
  const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
  
  let body: RateRideRequest;
  
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
  const requiredFields = ['ride_id', 'customer_id', 'overall_rating'];
  const validation = validateRequiredFields(body, requiredFields);
  if (!validation.isValid) {
    return createApiError(
      'Missing required fields',
      'VALIDATION_ERROR',
      400,
      { missingFields: validation.missingFields }
    );
  }

  // Verify customer access permissions
  if (user.role === 'customer' && user.customerId !== body.customer_id) {
    return createApiError(
      'Cannot rate rides for other customers',
      'INSUFFICIENT_PERMISSIONS',
      403
    );
  }

  // Validate rating values (1-5 scale)
  const ratingFields = ['overall_rating', 'driver_rating', 'vehicle_rating', 'punctuality_rating', 'cleanliness_rating'];
  for (const field of ratingFields) {
    const value = (body as any)[field];
    if (value !== undefined && (typeof value !== 'number' || value < 1 || value > 5 || !Number.isInteger(value))) {
      return createApiError(
        `${field} must be an integer between 1 and 5`,
        'INVALID_RATING',
        400,
        { field, value }
      );
    }
  }

  // Validate tip amount if provided
  if (body.tip_amount !== undefined) {
    if (typeof body.tip_amount !== 'number' || body.tip_amount < 0) {
      return createApiError(
        'Tip amount must be a non-negative number',
        'INVALID_TIP_AMOUNT',
        400
      );
    }

    if (body.tip_amount > 1000) { // Max PHP 1,000 tip
      return createApiError(
        'Tip amount cannot exceed PHP 1,000',
        'TIP_AMOUNT_TOO_HIGH',
        400
      );
    }
  }

  // Validate compliments and complaints arrays
  if (body.compliments && !Array.isArray(body.compliments)) {
    return createApiError(
      'Compliments must be an array',
      'INVALID_COMPLIMENTS',
      400
    );
  }

  if (body.complaints && !Array.isArray(body.complaints)) {
    return createApiError(
      'Complaints must be an array',
      'INVALID_COMPLAINTS',
      400
    );
  }

  // Validate predefined compliments and complaints
  const validCompliments = [
    'Great driving',
    'Very polite',
    'Clean vehicle',
    'On time',
    'Smooth ride',
    'Good music',
    'Air conditioning',
    'Safe driving',
    'Friendly conversation',
    'Helped with luggage'
  ];

  const validComplaints = [
    'Reckless driving',
    'Rude behavior',
    'Dirty vehicle',
    'Late arrival',
    'Rough ride',
    'Loud music',
    'No air conditioning',
    'Unsafe driving',
    'Inappropriate conversation',
    'Did not help with luggage',
    'Wrong route',
    'Vehicle not as described'
  ];

  if (body.compliments) {
    const invalidCompliments = body.compliments.filter(c => !validCompliments.includes(c));
    if (invalidCompliments.length > 0) {
      return createApiError(
        'Invalid compliments provided',
        'INVALID_COMPLIMENTS',
        400,
        { 
          invalid: invalidCompliments,
          valid: validCompliments 
        }
      );
    }
  }

  if (body.complaints) {
    const invalidComplaints = body.complaints.filter(c => !validComplaints.includes(c));
    if (invalidComplaints.length > 0) {
      return createApiError(
        'Invalid complaints provided',
        'INVALID_COMPLAINTS',
        400,
        { 
          invalid: invalidComplaints,
          valid: validComplaints 
        }
      );
    }
  }

  // Validate feedback length
  if (body.feedback && body.feedback.length > 1000) {
    return createApiError(
      'Feedback cannot exceed 1000 characters',
      'FEEDBACK_TOO_LONG',
      400
    );
  }

  try {
    // Audit rating attempt
    await auditLogger.logEvent(
      AuditEventType.RIDE_RATED,
      SecurityLevel.LOW,
      'INFO',
      {
        ride_id: body.ride_id,
        customer_id: body.customer_id,
        overall_rating: body.overall_rating,
        driver_rating: body.driver_rating,
        has_feedback: !!body.feedback,
        has_tip: !!(body.tip_amount && body.tip_amount > 0),
        compliments_count: body.compliments?.length || 0,
        complaints_count: body.complaints?.length || 0
      },
      {
        userId: user.id,
        resource: 'customer_ride_rating',
        action: 'create',
        ipAddress: clientIP
      }
    );

    // Rate the ride
    const result = await customerService.rateRide({
      ride_id: body.ride_id,
      customer_id: body.customer_id,
      overall_rating: body.overall_rating,
      driver_rating: body.driver_rating,
      vehicle_rating: body.vehicle_rating,
      punctuality_rating: body.punctuality_rating,
      cleanliness_rating: body.cleanliness_rating,
      feedback: body.feedback,
      compliments: body.compliments,
      complaints: body.complaints,
      would_recommend: body.would_recommend,
      tip_amount: body.tip_amount
    });

    // Audit successful rating
    await auditLogger.logEvent(
      AuditEventType.RIDE_RATED,
      SecurityLevel.LOW,
      'SUCCESS',
      {
        rating_id: result.rating_id,
        ride_id: body.ride_id,
        customer_id: body.customer_id,
        overall_rating: body.overall_rating,
        points_earned: result.points_earned,
        driver_notified: result.driver_notified
      },
      {
        userId: user.id,
        resource: 'customer_ride_rating',
        action: 'create',
        ipAddress: clientIP
      }
    );

    // Process tip if provided
    if (body.tip_amount && body.tip_amount > 0) {
      try {
        await processTipPayment(body.ride_id, body.customer_id, body.tip_amount);
        
        await auditLogger.logEvent(
          AuditEventType.TIP_PROCESSED,
          SecurityLevel.MEDIUM,
          'SUCCESS',
          {
            ride_id: body.ride_id,
            customer_id: body.customer_id,
            tip_amount: body.tip_amount,
            rating_id: result.rating_id
          },
          {
            userId: user.id,
            resource: 'tip_payment',
            action: 'process',
            ipAddress: clientIP
          }
        );
      } catch (tipError) {
        console.error('Tip processing failed:', tipError);
        // Don't fail the rating if tip processing fails
      }
    }

    // Handle complaints with automatic escalation
    if (body.complaints && body.complaints.length > 0) {
      await handleRatingComplaints(body.ride_id, body.customer_id, body.complaints, body.feedback);
    }

    const response: RateRideResponse = {
      rating_id: result.rating_id,
      points_earned: result.points_earned,
      thank_you_message: generateThankYouMessage(body.overall_rating, body.compliments?.length || 0),
      driver_notified: result.driver_notified
    };

    return createApiResponse(
      response, 
      'Ride rated successfully',
      201
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to rate ride';

    // Audit failed rating
    await auditLogger.logEvent(
      AuditEventType.RIDE_RATED,
      SecurityLevel.LOW,
      'ERROR',
      {
        ride_id: body.ride_id,
        customer_id: body.customer_id,
        overall_rating: body.overall_rating,
        error: errorMessage
      },
      {
        userId: user.id,
        resource: 'customer_ride_rating',
        action: 'create',
        ipAddress: clientIP
      }
    );

    // Handle specific error cases
    if (errorMessage.includes('Ride not found')) {
      return createApiError(
        'Ride not found or access denied',
        'RIDE_NOT_FOUND',
        404
      );
    }

    if (errorMessage.includes('not completed')) {
      return createApiError(
        'Can only rate completed rides',
        'RIDE_NOT_COMPLETED',
        400
      );
    }

    if (errorMessage.includes('already been rated')) {
      return createApiError(
        'This ride has already been rated',
        'ALREADY_RATED',
        409
      );
    }

    return createApiError(
      'Failed to rate ride',
      'RATING_ERROR',
      500,
      { details: errorMessage }
    );
  }
});

// Helper functions
async function processTipPayment(ride_id: string, customer_id: string, tip_amount: number): Promise<void> {
  // Get ride information
  const rideQuery = `
    SELECT driver_id, id
    FROM rides 
    WHERE id = $1 AND customer_id = $2
  `;
  const rideResult = await db.query(rideQuery, [ride_id, customer_id]);
  
  if (rideResult.rows.length === 0) {
    throw new Error('Ride not found for tip processing');
  }

  const ride = rideResult.rows[0];

  // Create a tip payment transaction
  const tipTransactionQuery = `
    INSERT INTO payment_transactions (
      transaction_id, ride_id, customer_id, driver_id, payment_method_id,
      amount, currency, status, processing_fee, net_amount, metadata
    ) VALUES ($1, $2, $3, $4, 
      (SELECT id FROM payment_methods WHERE type = 'cash' LIMIT 1),
      $5, $6, $7, $8, $9, $10)
    RETURNING id
  `;

  const tip_transaction_id = `tip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  await db.query(tipTransactionQuery, [
    tip_transaction_id,
    ride_id,
    customer_id,
    ride.driver_id,
    tip_amount,
    'PHP',
    'completed',
    0, // No processing fee for tips
    tip_amount,
    JSON.stringify({
      transaction_type: 'tip',
      source: 'ride_rating',
      note: 'Customer tip from ride rating'
    })
  ]);

  // Add tip to driver earnings
  const earningsQuery = `
    UPDATE driver_earnings 
    SET tips = tips + $1, final_earnings = final_earnings + $1, updated_at = CURRENT_TIMESTAMP
    WHERE driver_id = $2 AND earnings_date = CURRENT_DATE
  `;
  
  await db.query(earningsQuery, [tip_amount, ride.driver_id]);
}

async function handleRatingComplaints(
  ride_id: string, 
  customer_id: string, 
  complaints: string[], 
  feedback?: string
): Promise<void> {
  // Auto-create support ticket for serious complaints
  const seriousComplaints = [
    'Reckless driving',
    'Rude behavior', 
    'Unsafe driving',
    'Inappropriate conversation'
  ];

  const hasSeriousComplaints = complaints.some(complaint => seriousComplaints.includes(complaint));

  if (hasSeriousComplaints) {
    const ticketQuery = `
      INSERT INTO customer_support_tickets (
        customer_id, ride_id, category, subcategory, priority,
        subject, description, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;

    await db.query(ticketQuery, [
      customer_id,
      ride_id,
      'Driver Issues',
      'Serious Complaint',
      'high',
      'Automatic complaint from ride rating',
      `Customer reported the following issues during ride rating: ${complaints.join(', ')}\n\nAdditional feedback: ${feedback || 'None provided'}`,
      'open'
    ]);
  }
}

function generateThankYouMessage(rating: number, complimentsCount: number): string {
  if (rating >= 5) {
    return 'Thank you for the excellent rating! We\'re thrilled you had a great experience.';
  } else if (rating >= 4) {
    return 'Thank you for your positive feedback! We appreciate your business.';
  } else if (rating >= 3) {
    return 'Thank you for your rating. We\'ll work to improve your experience next time.';
  } else {
    return 'Thank you for your feedback. We take your concerns seriously and will follow up to improve.';
  }
}

export { rateRide as POST };