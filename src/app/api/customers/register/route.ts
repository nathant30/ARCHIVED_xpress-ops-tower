import { NextRequest, NextResponse } from 'next/server';
import { 
  createApiResponse, 
  createApiError, 
  validateRequiredFields,
  asyncHandler,
  handleOptionsRequest
} from '@/lib/api-utils';
import { auditLogger, AuditEventType, SecurityLevel } from '@/lib/security/auditLogger';
import { CustomerService } from '@/lib/services/CustomerService';
import { DatabaseService } from '@/lib/services/DatabaseService';
import { RegisterCustomerRequest, RegisterCustomerResponse } from '@/types/customer';

const db = new DatabaseService();
const customerService = new CustomerService(db);

// OPTIONS handler
export const OPTIONS = handleOptionsRequest;

// POST /api/customers/register - Register a new customer
const registerCustomer = asyncHandler(async (request: NextRequest) => {
  const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
  
  let body: RegisterCustomerRequest;
  
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
  const requiredFields = ['first_name', 'last_name', 'email', 'password'];
  const validation = validateRequiredFields(body, requiredFields);
  if (!validation.isValid) {
    return createApiError(
      'Missing required fields',
      'VALIDATION_ERROR',
      400,
      { missingFields: validation.missingFields }
    );
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(body.email)) {
    return createApiError(
      'Invalid email format',
      'INVALID_EMAIL',
      400
    );
  }

  // Validate password strength
  if (body.password.length < 8) {
    return createApiError(
      'Password must be at least 8 characters long',
      'WEAK_PASSWORD',
      400
    );
  }

  // Validate phone format if provided
  if (body.phone) {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(body.phone)) {
      return createApiError(
        'Invalid phone number format',
        'INVALID_PHONE',
        400
      );
    }
  }

  // Validate date of birth if provided
  if (body.date_of_birth) {
    const dob = new Date(body.date_of_birth);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    
    if (isNaN(dob.getTime())) {
      return createApiError(
        'Invalid date of birth format',
        'INVALID_DATE',
        400
      );
    }

    if (age < 13) {
      return createApiError(
        'Must be at least 13 years old to register',
        'AGE_REQUIREMENT',
        400
      );
    }

    if (age > 120) {
      return createApiError(
        'Invalid date of birth',
        'INVALID_DATE',
        400
      );
    }
  }

  // Validate emergency contact if provided
  if (body.emergency_contact) {
    const requiredContactFields = ['name', 'phone', 'relationship'];
    const contactValidation = validateRequiredFields(body.emergency_contact, requiredContactFields);
    if (!contactValidation.isValid) {
      return createApiError(
        'Emergency contact missing required fields',
        'INVALID_EMERGENCY_CONTACT',
        400,
        { missingFields: contactValidation.missingFields }
      );
    }
  }

  try {
    // Audit registration attempt
    await auditLogger.logEvent(
      AuditEventType.USER_REGISTRATION,
      SecurityLevel.MEDIUM,
      'INFO',
      {
        email: body.email,
        phone: body.phone,
        registration_type: 'customer',
        referral_used: !!body.referral_code,
        ip_address: clientIP
      },
      {
        userId: 'anonymous',
        resource: 'customer_registration',
        action: 'register',
        ipAddress: clientIP
      }
    );

    // Register customer
    const result = await customerService.registerCustomer({
      first_name: body.first_name,
      last_name: body.last_name,
      email: body.email.toLowerCase(), // Normalize email
      phone: body.phone,
      password: body.password,
      date_of_birth: body.date_of_birth,
      gender: body.gender,
      preferred_language: body.preferred_language || 'en',
      emergency_contact: body.emergency_contact,
      referral_code: body.referral_code
    });

    // Audit successful registration
    await auditLogger.logEvent(
      AuditEventType.USER_REGISTRATION,
      SecurityLevel.MEDIUM,
      'SUCCESS',
      {
        customer_id: result.customer.id,
        customer_number: result.customer.customer_number,
        user_id: result.user_id,
        email: result.customer.email,
        referral_processed: !!body.referral_code,
        welcome_promotion_created: !!result.welcome_promotion
      },
      {
        userId: result.user_id,
        resource: 'customer_registration',
        action: 'register',
        ipAddress: clientIP
      }
    );

    const response: RegisterCustomerResponse = {
      customer_id: result.customer.id,
      customer_number: result.customer.customer_number,
      user_id: result.user_id,
      status: result.customer.status,
      verification_required: result.customer.verification_status === 'unverified',
      welcome_promotion: result.welcome_promotion
    };

    return createApiResponse(
      response,
      'Customer registration successful',
      201
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Registration failed';

    // Audit failed registration
    await auditLogger.logEvent(
      AuditEventType.USER_REGISTRATION,
      SecurityLevel.MEDIUM,
      'ERROR',
      {
        email: body.email,
        error: errorMessage,
        ip_address: clientIP
      },
      {
        userId: 'anonymous',
        resource: 'customer_registration',
        action: 'register',
        ipAddress: clientIP
      }
    );

    // Handle specific error cases
    if (errorMessage.includes('Email already registered')) {
      return createApiError(
        'An account with this email address already exists',
        'EMAIL_EXISTS',
        409
      );
    }

    if (errorMessage.includes('Invalid referral code')) {
      return createApiError(
        'Invalid or expired referral code',
        'INVALID_REFERRAL',
        400
      );
    }

    if (errorMessage.includes('Phone already registered')) {
      return createApiError(
        'An account with this phone number already exists',
        'PHONE_EXISTS',
        409
      );
    }

    return createApiError(
      'Registration failed',
      'REGISTRATION_ERROR',
      500,
      { details: errorMessage }
    );
  }
});

export { registerCustomer as POST };