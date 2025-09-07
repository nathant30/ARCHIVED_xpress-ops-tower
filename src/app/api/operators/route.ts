// =====================================================
// OPERATORS API - Core operator management endpoints
// GET /api/operators - List operators with filtering and pagination
// POST /api/operators - Create new operator
// =====================================================

import { NextRequest } from 'next/server';
import { 
  createApiResponse, 
  createApiError, 
  createValidationError,
  parseQueryParams,
  parsePaginationParams,
  validateRequiredFields,
  handleOptionsRequest
} from '@/lib/api-utils';
import { withEnhancedAuth } from '@/lib/auth/enhanced-auth';
import { operatorService } from '@/lib/services/OperatorService';
import { 
  CreateOperatorRequest, 
  OperatorFilters,
  OperatorType 
} from '@/types/operators';
import { versionedApiRoute, createVersionedResponse } from '@/middleware/apiVersioning';

// =====================================================
// GET OPERATORS
// =====================================================

const getOperatorsV1 = withEnhancedAuth({
  requiredPermissions: ['manage_operators', 'view_operators'],
  dataClass: 'internal'
})(async (request: NextRequest, user) => {
  const queryParams = parseQueryParams(request);
  const paginationParams = parsePaginationParams(request);
  
  // Apply regional filtering for users with regional restrictions
  let regionFilter = queryParams.region;
  const userRegions = user.allowedRegions || [];
  if (userRegions.length > 0 && !userRegions.includes(regionFilter)) {
    regionFilter = userRegions[0]; // Use first allowed region
  }
  
  // Build filters
  const filters: OperatorFilters = {
    operator_type: queryParams.operator_type as OperatorType,
    status: queryParams.status,
    region_id: regionFilter,
    commission_tier: queryParams.commission_tier,
    search: queryParams.search as string,
    performance_score_min: queryParams.performance_score_min as number,
    performance_score_max: queryParams.performance_score_max as number,
    created_from: queryParams.created_from as string,
    created_to: queryParams.created_to as string,
    account_manager: queryParams.account_manager as string
  };

  // Remove undefined filters
  Object.keys(filters).forEach(key => {
    if (filters[key as keyof OperatorFilters] === undefined || filters[key as keyof OperatorFilters] === '') {
      delete filters[key as keyof OperatorFilters];
    }
  });
  
  try {
    const result = await operatorService.listOperators(filters, paginationParams);
    
    return createVersionedResponse(
      {
        operators: result.data,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          pages: Math.ceil(result.total / result.limit),
          hasNext: result.page < Math.ceil(result.total / result.limit),
          hasPrev: result.page > 1
        },
        filters: filters
      },
      'v1'
    );
    
  } catch (error) {
    return createApiError(
      error instanceof Error ? error.message : 'Failed to retrieve operators',
      'OPERATORS_FETCH_ERROR',
      500,
      { error: error instanceof Error ? error.message : 'Unknown error' },
      '/api/operators',
      'GET'
    );
  }
});

// =====================================================
// CREATE OPERATOR
// =====================================================

const postOperatorsV1 = withEnhancedAuth({
  requiredPermissions: ['manage_operators', 'create_operator'],
  dataClass: 'internal'
})(async (request: NextRequest, user) => {
  try {
    const body = await request.json() as CreateOperatorRequest;
    
    // Validate required fields
    const requiredFields = [
      'operator_code',
      'business_name', 
      'legal_name',
      'operator_type',
      'primary_contact',
      'business_address',
      'business_registration_number',
      'primary_region_id',
      'partnership_start_date'
    ];
    
    const validationErrors = validateRequiredFields(body, requiredFields);
    
    // Additional validation for nested objects
    if (body.primary_contact) {
      const contactRequiredFields = ['name', 'phone', 'email', 'position'];
      contactRequiredFields.forEach(field => {
        if (!body.primary_contact[field as keyof typeof body.primary_contact]) {
          validationErrors.push({
            field: `primary_contact.${field}`,
            message: `Primary contact ${field} is required`,
            code: 'REQUIRED_FIELD_MISSING',
          });
        }
      });
    }
    
    if (body.business_address) {
      const addressRequiredFields = ['street', 'city', 'province', 'region', 'country'];
      addressRequiredFields.forEach(field => {
        if (!body.business_address[field as keyof typeof body.business_address]) {
          validationErrors.push({
            field: `business_address.${field}`,
            message: `Business address ${field} is required`,
            code: 'REQUIRED_FIELD_MISSING',
          });
        }
      });
    }
    
    // Validate operator type
    if (body.operator_type && !['tnvs', 'general', 'fleet'].includes(body.operator_type)) {
      validationErrors.push({
        field: 'operator_type',
        message: 'Operator type must be one of: tnvs, general, fleet',
        code: 'INVALID_OPERATOR_TYPE',
      });
    }
    
    // Validate email format
    if (body.primary_contact?.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.primary_contact.email)) {
      validationErrors.push({
        field: 'primary_contact.email',
        message: 'Invalid email format',
        code: 'INVALID_EMAIL',
      });
    }
    
    // Validate phone format (Philippine format)
    if (body.primary_contact?.phone && !/^(\+63|0)[0-9]{10}$/.test(body.primary_contact.phone.replace(/\s|-/g, ''))) {
      validationErrors.push({
        field: 'primary_contact.phone',
        message: 'Invalid Philippine phone number format',
        code: 'INVALID_PHONE',
      });
    }
    
    // Validate dates
    if (body.partnership_start_date && isNaN(Date.parse(body.partnership_start_date))) {
      validationErrors.push({
        field: 'partnership_start_date',
        message: 'Invalid partnership start date format',
        code: 'INVALID_DATE',
      });
    }
    
    if (body.partnership_end_date && body.partnership_start_date) {
      if (new Date(body.partnership_end_date) <= new Date(body.partnership_start_date)) {
        validationErrors.push({
          field: 'partnership_end_date',
          message: 'Partnership end date must be after start date',
          code: 'INVALID_DATE_RANGE',
        });
      }
    }
    
    // Regional access validation - user can only create operators in allowed regions
    const userRegions = user.allowedRegions || [];
    if (userRegions.length > 0 && !userRegions.includes(body.primary_region_id)) {
      validationErrors.push({
        field: 'primary_region_id',
        message: 'You do not have access to create operators in this region',
        code: 'REGION_ACCESS_DENIED',
      });
    }
    
    if (body.allowed_regions?.length) {
      const invalidRegions = body.allowed_regions.filter(region => !userRegions.includes(region));
      if (userRegions.length > 0 && invalidRegions.length > 0) {
        validationErrors.push({
          field: 'allowed_regions',
          message: `You do not have access to regions: ${invalidRegions.join(', ')}`,
          code: 'REGION_ACCESS_DENIED',
        });
      }
    }
    
    if (validationErrors.length > 0) {
      return createValidationError(validationErrors, '/api/operators', 'POST');
    }
    
    // Set created_by to current user
    const operatorData = {
      ...body,
      created_by: user.id
    };
    
    const newOperator = await operatorService.createOperator(operatorData);
    
    return createVersionedResponse(
      { 
        operator: newOperator,
        message: 'Operator created successfully'
      },
      'v1'
    );
    
  } catch (error) {
    // Handle specific business logic errors
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return createApiError(
          error.message,
          'OPERATOR_CODE_EXISTS',
          409,
          undefined,
          '/api/operators',
          'POST'
        );
      }
      
      if (error.message.includes('vehicle limit')) {
        return createApiError(
          error.message,
          'VEHICLE_LIMIT_EXCEEDED',
          400,
          undefined,
          '/api/operators',
          'POST'
        );
      }
    }
    
    return createApiError(
      error instanceof Error ? error.message : 'Failed to create operator',
      'OPERATOR_CREATION_ERROR',
      500,
      { error: error instanceof Error ? error.message : 'Unknown error' },
      '/api/operators',
      'POST'
    );
  }
});

// =====================================================
// ROUTE EXPORTS
// =====================================================

export const GET = versionedApiRoute({
  v1: getOperatorsV1
});

export const POST = versionedApiRoute({
  v1: postOperatorsV1
});

export const OPTIONS = handleOptionsRequest;