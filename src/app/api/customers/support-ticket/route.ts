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
import { CreateSupportTicketRequest, CreateSupportTicketResponse } from '@/types/customer';

const db = new DatabaseService();
const customerService = new CustomerService(db);

// OPTIONS handler
export const OPTIONS = handleOptionsRequest;

// POST /api/customers/support-ticket - Create a customer support ticket
const createSupportTicket = withEnhancedAuth({
  requiredPermissions: ['create_support_ticket'],
  requireMFA: false,
  auditRequired: true
})(async (request: NextRequest, user) => {
  const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
  
  let body: CreateSupportTicketRequest;
  
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
  const requiredFields = ['customer_id', 'category', 'subject', 'description'];
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
      'Cannot create support ticket for other customers',
      'INSUFFICIENT_PERMISSIONS',
      403
    );
  }

  // Validate ticket category
  const validCategories = [
    'Payment Issues',
    'Driver Issues', 
    'Vehicle Issues',
    'App Issues',
    'Booking Problems',
    'Safety Concerns',
    'Account Issues',
    'Refund Request',
    'Complaint',
    'General Inquiry',
    'Technical Support'
  ];

  if (!validCategories.includes(body.category)) {
    return createApiError(
      'Invalid support ticket category',
      'INVALID_CATEGORY',
      400,
      { validCategories }
    );
  }

  // Validate priority if provided
  if (body.priority) {
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (!validPriorities.includes(body.priority)) {
      return createApiError(
        'Invalid priority level',
        'INVALID_PRIORITY',
        400,
        { validPriorities }
      );
    }
  }

  // Validate ride_id if provided
  if (body.ride_id) {
    try {
      // Verify the ride belongs to the customer
      const rideQuery = `
        SELECT id, customer_id, status, created_at 
        FROM rides 
        WHERE id = $1
      `;
      const rideResult = await db.query(rideQuery, [body.ride_id]);

      if (rideResult.rows.length === 0) {
        return createApiError(
          'Ride not found',
          'RIDE_NOT_FOUND',
          404
        );
      }

      const ride = rideResult.rows[0];
      if (ride.customer_id !== body.customer_id) {
        return createApiError(
          'Ride does not belong to this customer',
          'RIDE_ACCESS_DENIED',
          403
        );
      }
    } catch (error) {
      return createApiError(
        'Failed to validate ride information',
        'RIDE_VALIDATION_ERROR',
        500
      );
    }
  }

  // Validate attachments if provided
  if (body.attachments && body.attachments.length > 0) {
    if (body.attachments.length > 5) {
      return createApiError(
        'Maximum 5 attachments allowed per ticket',
        'TOO_MANY_ATTACHMENTS',
        400
      );
    }

    for (const attachment of body.attachments) {
      if (!attachment.filename || !attachment.url) {
        return createApiError(
          'Invalid attachment format. Required: filename and url',
          'INVALID_ATTACHMENT',
          400
        );
      }

      // Validate file size (assuming it's provided in metadata)
      if (attachment.size && attachment.size > 10 * 1024 * 1024) { // 10MB limit
        return createApiError(
          'Attachment file size cannot exceed 10MB',
          'FILE_TOO_LARGE',
          400,
          { filename: attachment.filename }
        );
      }
    }
  }

  try {
    // Check for spam/duplicate tickets (same customer, category, and subject within 1 hour)
    const duplicateCheckQuery = `
      SELECT COUNT(*) as count
      FROM customer_support_tickets 
      WHERE customer_id = $1 
        AND category = $2 
        AND subject = $3 
        AND created_at > CURRENT_TIMESTAMP - INTERVAL '1 hour'
        AND status NOT IN ('closed', 'resolved')
    `;

    const duplicateResult = await db.query(duplicateCheckQuery, [
      body.customer_id,
      body.category,
      body.subject
    ]);

    const duplicateCount = parseInt(duplicateResult.rows[0]?.count) || 0;
    if (duplicateCount > 0) {
      return createApiError(
        'A similar support ticket was already created recently. Please check your existing tickets or wait before creating another.',
        'DUPLICATE_TICKET',
        409
      );
    }

    // Auto-escalate priority based on category
    let priority = body.priority || 'medium';
    if (body.category === 'Safety Concerns') {
      priority = 'urgent';
    } else if (['Payment Issues', 'Refund Request'].includes(body.category)) {
      priority = 'high';
    }

    // Audit ticket creation attempt
    await auditLogger.logEvent(
      AuditEventType.SUPPORT_TICKET_CREATED,
      SecurityLevel.MEDIUM,
      'INFO',
      {
        customer_id: body.customer_id,
        category: body.category,
        subcategory: body.subcategory,
        priority: priority,
        ride_id: body.ride_id,
        has_attachments: !!(body.attachments && body.attachments.length > 0),
        created_by_user: user.id
      },
      {
        userId: user.id,
        resource: 'customer_support_ticket',
        action: 'create',
        ipAddress: clientIP
      }
    );

    // Create the support ticket
    const ticket = await customerService.createSupportTicket({
      customer_id: body.customer_id,
      ride_id: body.ride_id,
      category: body.category,
      subcategory: body.subcategory,
      priority: priority,
      subject: body.subject,
      description: body.description,
      attachments: body.attachments
    });

    // Calculate estimated resolution time based on priority
    const estimatedResolutionHours = getEstimatedResolutionTime(priority);
    const estimatedResolutionTime = new Date(
      Date.now() + estimatedResolutionHours * 60 * 60 * 1000
    ).toISOString();

    // Audit successful ticket creation
    await auditLogger.logEvent(
      AuditEventType.SUPPORT_TICKET_CREATED,
      SecurityLevel.MEDIUM,
      'SUCCESS',
      {
        ticket_id: ticket.id,
        ticket_number: ticket.ticket_number,
        customer_id: body.customer_id,
        category: ticket.category,
        priority: ticket.priority,
        estimated_resolution: estimatedResolutionTime
      },
      {
        userId: user.id,
        resource: 'customer_support_ticket',
        action: 'create',
        ipAddress: clientIP
      }
    );

    const response: CreateSupportTicketResponse = {
      ticket_id: ticket.id,
      ticket_number: ticket.ticket_number,
      status: ticket.status,
      estimated_resolution_time: estimatedResolutionTime,
      support_channels: {
        chat_available: priority === 'urgent' || priority === 'high',
        phone_available: priority === 'urgent',
        email_response_time: getEmailResponseTime(priority)
      }
    };

    // Send notifications (would integrate with notification service)
    await sendTicketNotifications(ticket, body.customer_id);

    return createApiResponse(
      response, 
      'Support ticket created successfully',
      201
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create support ticket';

    // Audit failed ticket creation
    await auditLogger.logEvent(
      AuditEventType.SUPPORT_TICKET_CREATED,
      SecurityLevel.MEDIUM,
      'ERROR',
      {
        customer_id: body.customer_id,
        category: body.category,
        error: errorMessage
      },
      {
        userId: user.id,
        resource: 'customer_support_ticket',
        action: 'create',
        ipAddress: clientIP
      }
    );

    if (errorMessage.includes('Customer not found')) {
      return createApiError(
        'Customer not found',
        'CUSTOMER_NOT_FOUND',
        404
      );
    }

    return createApiError(
      'Failed to create support ticket',
      'TICKET_CREATION_ERROR',
      500,
      { details: errorMessage }
    );
  }
});

// Helper functions
function getEstimatedResolutionTime(priority: string): number {
  switch (priority) {
    case 'urgent': return 2;    // 2 hours
    case 'high': return 8;      // 8 hours
    case 'medium': return 24;   // 24 hours
    case 'low': return 72;      // 72 hours
    default: return 24;
  }
}

function getEmailResponseTime(priority: string): string {
  switch (priority) {
    case 'urgent': return '15 minutes';
    case 'high': return '2 hours';
    case 'medium': return '6 hours';
    case 'low': return '24 hours';
    default: return '6 hours';
  }
}

async function sendTicketNotifications(ticket: any, customer_id: string): Promise<void> {
  try {
    // Get customer contact information
    const customerQuery = `
      SELECT first_name, last_name, email, phone 
      FROM customers 
      WHERE id = $1
    `;
    const customerResult = await db.query(customerQuery, [customer_id]);
    
    if (customerResult.rows.length === 0) {
      return;
    }

    const customer = customerResult.rows[0];

    // TODO: Integrate with notification service
    // This would send:
    // 1. Email confirmation to customer
    // 2. SMS notification for urgent tickets
    // 3. Internal notification to support team
    // 4. Slack/Teams notification for high priority tickets

    console.log(`Notifications would be sent for ticket ${ticket.ticket_number}:`, {
      customer_email: customer.email,
      customer_phone: customer.phone,
      priority: ticket.priority,
      category: ticket.category
    });

  } catch (error) {
    console.error('Failed to send ticket notifications:', error);
    // Don't fail the ticket creation if notifications fail
  }
}

export { createSupportTicket as POST };