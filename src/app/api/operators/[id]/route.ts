// =====================================================
// OPERATOR DETAIL API - Individual operator CRUD operations
// GET /api/operators/[id] - Get operator by ID
// PUT /api/operators/[id] - Update operator
// DELETE /api/operators/[id] - Delete operator (soft delete)
// =====================================================

import { NextRequest } from 'next/server';
import { 
  createApiResponse, 
  createApiError, 
  createValidationError,
  createNotFoundError,
  validateRequiredFields,
  handleOptionsRequest
} from '@/lib/api-utils';
import { withEnhancedAuth } from '@/lib/auth/enhanced-auth';
import { operatorService } from '@/lib/services/OperatorService';
import { UpdateOperatorRequest } from '@/types/operators';
import { versionedApiRoute, createVersionedResponse } from '@/middleware/apiVersioning';

// =====================================================
// GET OPERATOR BY ID
// =====================================================

const getOperatorV1 = withEnhancedAuth({
  requiredPermissions: ['view_operators', 'manage_operators'],
  dataClass: 'internal'
})(async (request: NextRequest, user, { params }: { params: { id: string } }) => {
  const { id } = params;
  
  try {
    const operator = await operatorService.getOperator(id);
    
    if (!operator) {
      return createNotFoundError('Operator', '/api/operators/' + id, 'GET');
    }
    
    // Regional access check - user can only view operators in allowed regions
    const userRegions = user.allowedRegions || [];
    if (userRegions.length > 0 && !userRegions.includes(operator.primary_region_id)) {
      return createApiError(
        'You do not have access to view operators in this region',
        'REGION_ACCESS_DENIED',
        403,
        { regionId: operator.primary_region_id, allowedRegions: userRegions },
        '/api/operators/' + id,
        'GET'
      );
    }
    
    return createVersionedResponse(
      { operator },
      'v1'
    );
    
  } catch (error) {
    return createApiError(
      error instanceof Error ? error.message : 'Failed to retrieve operator',
      'OPERATOR_FETCH_ERROR',
      500,
      { operatorId: id, error: error instanceof Error ? error.message : 'Unknown error' },
      '/api/operators/' + id,
      'GET'
    );
  }
});

// =====================================================
// UPDATE OPERATOR
// =====================================================

const updateOperatorV1 = withEnhancedAuth({
  requiredPermissions: ['manage_operators', 'update_operator'],
  dataClass: 'internal'
})(async (request: NextRequest, user, { params }: { params: { id: string } }) => {
  const { id } = params;
  
  try {
    // Check if operator exists and user has access
    const existingOperator = await operatorService.getOperator(id);
    if (!existingOperator) {
      return createNotFoundError('Operator', '/api/operators/' + id, 'PUT');
    }
    
    // Regional access check
    const userRegions = user.allowedRegions || [];
    if (userRegions.length > 0 && !userRegions.includes(existingOperator.primary_region_id)) {
      return createApiError(
        'You do not have access to update operators in this region',
        'REGION_ACCESS_DENIED',
        403,
        { regionId: existingOperator.primary_region_id, allowedRegions: userRegions },
        '/api/operators/' + id,
        'PUT'
      );
    }
    
    const body = await request.json() as UpdateOperatorRequest;
    const validationErrors = [];
    
    // Validate email format if provided
    if (body.primary_contact?.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.primary_contact.email)) {
      validationErrors.push({
        field: 'primary_contact.email',
        message: 'Invalid email format',
        code: 'INVALID_EMAIL',
      });
    }
    
    // Validate phone format if provided
    if (body.primary_contact?.phone && !/^(\+63|0)[0-9]{10}$/.test(body.primary_contact.phone.replace(/\s|-/g, ''))) {
      validationErrors.push({
        field: 'primary_contact.phone',
        message: 'Invalid Philippine phone number format',
        code: 'INVALID_PHONE',
      });
    }
    
    // Validate operator type if provided
    if (body.operator_type && !['tnvs', 'general', 'fleet'].includes(body.operator_type)) {
      validationErrors.push({
        field: 'operator_type',
        message: 'Operator type must be one of: tnvs, general, fleet',
        code: 'INVALID_OPERATOR_TYPE',
      });
    }
    
    // Validate dates if provided
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
    
    // Regional access validation for region changes
    if (body.primary_region_id && userRegions.length > 0 && !userRegions.includes(body.primary_region_id)) {
      validationErrors.push({
        field: 'primary_region_id',
        message: 'You do not have access to move operators to this region',
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
      return createValidationError(validationErrors, '/api/operators/' + id, 'PUT');
    }
    
    const updatedOperator = await operatorService.updateOperator(id, body);
    
    return createVersionedResponse(
      { 
        operator: updatedOperator,
        message: 'Operator updated successfully'
      },
      'v1'
    );
    
  } catch (error) {
    // Handle specific business logic errors
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return createNotFoundError('Operator', '/api/operators/' + id, 'PUT');
      }
      
      if (error.message.includes('vehicle count')) {
        return createApiError(
          error.message,
          'VEHICLE_COUNT_CONSTRAINT',
          400,
          { operatorId: id },
          '/api/operators/' + id,
          'PUT'
        );
      }
      
      if (error.message.includes('already exists')) {
        return createApiError(
          error.message,
          'OPERATOR_CODE_EXISTS',
          409,
          { operatorId: id },
          '/api/operators/' + id,
          'PUT'
        );
      }
    }
    
    return createApiError(
      error instanceof Error ? error.message : 'Failed to update operator',
      'OPERATOR_UPDATE_ERROR',
      500,
      { operatorId: id, error: error instanceof Error ? error.message : 'Unknown error' },
      '/api/operators/' + id,
      'PUT'
    );
  }
});

// =====================================================
// DELETE OPERATOR
// =====================================================

const deleteOperatorV1 = withEnhancedAuth({
  requiredPermissions: ['manage_operators', 'delete_operator'],
  dataClass: 'internal'
})(async (request: NextRequest, user, { params }: { params: { id: string } }) => {
  const { id } = params;
  
  try {
    // Check if operator exists and user has access
    const existingOperator = await operatorService.getOperator(id);
    if (!existingOperator) {
      return createNotFoundError('Operator', '/api/operators/' + id, 'DELETE');
    }
    
    // Regional access check
    const userRegions = user.allowedRegions || [];
    if (userRegions.length > 0 && !userRegions.includes(existingOperator.primary_region_id)) {
      return createApiError(
        'You do not have access to delete operators in this region',
        'REGION_ACCESS_DENIED',
        403,
        { regionId: existingOperator.primary_region_id, allowedRegions: userRegions },
        '/api/operators/' + id,
        'DELETE'
      );
    }
    
    // Additional authorization check - only senior managers can delete operators
    if (!user.permissions.includes('delete_operator_unrestricted')) {
      return createApiError(
        'Insufficient permissions to delete operators',
        'INSUFFICIENT_PERMISSIONS',
        403,
        { requiredPermission: 'delete_operator_unrestricted' },
        '/api/operators/' + id,
        'DELETE'
      );
    }
    
    await operatorService.deleteOperator(id);
    
    return createVersionedResponse(
      { 
        message: 'Operator deleted successfully',
        operatorId: id
      },
      'v1'
    );
    
  } catch (error) {
    // Handle specific business logic errors
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return createNotFoundError('Operator', '/api/operators/' + id, 'DELETE');
      }
      
      if (error.message.includes('active vehicles') || error.message.includes('active drivers')) {
        return createApiError(
          error.message,
          'OPERATOR_HAS_ACTIVE_RESOURCES',
          409,
          { operatorId: id },
          '/api/operators/' + id,
          'DELETE'
        );
      }
    }
    
    return createApiError(
      error instanceof Error ? error.message : 'Failed to delete operator',
      'OPERATOR_DELETE_ERROR',
      500,
      { operatorId: id, error: error instanceof Error ? error.message : 'Unknown error' },
      '/api/operators/' + id,
      'DELETE'
    );
  }
});

// =====================================================
// ROUTE EXPORTS
// =====================================================

export const GET = versionedApiRoute({
  v1: (request: NextRequest, context: any) => getOperatorV1(request, context.user, context)
});

export const PUT = versionedApiRoute({
  v1: (request: NextRequest, context: any) => updateOperatorV1(request, context.user, context)
});

export const DELETE = versionedApiRoute({
  v1: (request: NextRequest, context: any) => deleteOperatorV1(request, context.user, context)
});

export const OPTIONS = handleOptionsRequest;