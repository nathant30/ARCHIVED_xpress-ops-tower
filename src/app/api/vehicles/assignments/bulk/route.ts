// /api/vehicles/assignments/bulk - Bulk Driver Assignment Operations
// Efficiently assign multiple drivers to multiple vehicles

import { NextRequest } from 'next/server';
import { 
  createApiResponse, 
  createApiError,
  createValidationError,
  validateRequiredFields,
  asyncHandler,
  handleOptionsRequest
} from '@/lib/api-utils';
import { withEnhancedAuth } from '@/lib/auth/enhanced-auth';
import { auditLogger, AuditEventType, SecurityLevel } from '@/lib/security/auditLogger';
import { versionedApiRoute, createVersionedResponse } from '@/middleware/apiVersioning';
import { BulkAssignDriverRequest } from '@/types/vehicles';

interface BulkOperationResult {
  successful: Array<{
    vehicleId: string;
    driverId: string;
    assignmentId: string;
    assignmentType: string;
  }>;
  failed: Array<{
    vehicleId: string;
    driverId: string;
    error: string;
    errorCode: string;
  }>;
  summary: {
    totalRequested: number;
    successful: number;
    failed: number;
    executionTimeMs: number;
  };
}

// Mock service for bulk operations
class BulkAssignmentService {
  static async processBulkAssignment(
    assignments: BulkAssignDriverRequest['assignments'],
    assignedBy: string
  ): Promise<BulkOperationResult> {
    const startTime = Date.now();
    const result: BulkOperationResult = {
      successful: [],
      failed: [],
      summary: {
        totalRequested: assignments.length,
        successful: 0,
        failed: 0,
        executionTimeMs: 0
      }
    };

    for (const assignment of assignments) {
      try {
        // Validate individual assignment
        const validationResult = this.validateAssignment(assignment);
        if (!validationResult.valid) {
          result.failed.push({
            vehicleId: assignment.vehicleId,
            driverId: assignment.driverId,
            error: validationResult.error!,
            errorCode: validationResult.errorCode!
          });
          continue;
        }

        // Check for conflicts
        const conflictCheck = this.checkConflicts(assignment);
        if (!conflictCheck.valid) {
          result.failed.push({
            vehicleId: assignment.vehicleId,
            driverId: assignment.driverId,
            error: conflictCheck.error!,
            errorCode: conflictCheck.errorCode!
          });
          continue;
        }

        // Create assignment (mock)
        const assignmentId = `bulk-assign-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        
        result.successful.push({
          vehicleId: assignment.vehicleId,
          driverId: assignment.driverId,
          assignmentId,
          assignmentType: assignment.assignmentType
        });

        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 50));

      } catch (error) {
        result.failed.push({
          vehicleId: assignment.vehicleId,
          driverId: assignment.driverId,
          error: 'Unexpected error during assignment processing',
          errorCode: 'PROCESSING_ERROR'
        });
      }
    }

    const endTime = Date.now();
    result.summary.successful = result.successful.length;
    result.summary.failed = result.failed.length;
    result.summary.executionTimeMs = endTime - startTime;

    return result;
  }

  private static validateAssignment(assignment: any): { valid: boolean; error?: string; errorCode?: string } {
    if (!assignment.vehicleId) {
      return { valid: false, error: 'Vehicle ID is required', errorCode: 'MISSING_VEHICLE_ID' };
    }
    if (!assignment.driverId) {
      return { valid: false, error: 'Driver ID is required', errorCode: 'MISSING_DRIVER_ID' };
    }
    if (!['primary', 'secondary', 'temporary'].includes(assignment.assignmentType)) {
      return { valid: false, error: 'Invalid assignment type', errorCode: 'INVALID_ASSIGNMENT_TYPE' };
    }
    if (assignment.dailyRentalFee && assignment.dailyRentalFee < 0) {
      return { valid: false, error: 'Daily rental fee cannot be negative', errorCode: 'INVALID_RENTAL_FEE' };
    }
    if (assignment.validFrom && assignment.validUntil && assignment.validFrom >= assignment.validUntil) {
      return { valid: false, error: 'Invalid date range', errorCode: 'INVALID_DATE_RANGE' };
    }

    return { valid: true };
  }

  private static checkConflicts(assignment: any): { valid: boolean; error?: string; errorCode?: string } {
    // Mock conflict checking - in production would check database
    
    // Simulate vehicle not found
    if (assignment.vehicleId === 'veh-nonexistent') {
      return { valid: false, error: 'Vehicle not found', errorCode: 'VEHICLE_NOT_FOUND' };
    }

    // Simulate driver not found
    if (assignment.driverId === 'driver-nonexistent') {
      return { valid: false, error: 'Driver not found', errorCode: 'DRIVER_NOT_FOUND' };
    }

    // Simulate existing primary assignment conflict
    if (assignment.assignmentType === 'primary' && assignment.vehicleId === 'veh-002') {
      return { 
        valid: false, 
        error: 'Vehicle already has an active primary assignment', 
        errorCode: 'EXISTING_PRIMARY_ASSIGNMENT' 
      };
    }

    // Simulate driver already assigned
    if (assignment.assignmentType === 'primary' && assignment.driverId === 'driver-003') {
      return { 
        valid: false, 
        error: 'Driver already has an active primary assignment', 
        errorCode: 'DRIVER_ALREADY_ASSIGNED' 
      };
    }

    return { valid: true };
  }

  static async getAvailableDriversForBulkAssignment(regionIds: string[]) {
    // Mock available drivers - in production would query database
    return [
      {
        id: 'driver-001',
        driverCode: 'DRV001',
        firstName: 'Juan',
        lastName: 'Cruz',
        regionId: 'region-manila',
        status: 'active',
        rating: 4.6,
        hasActiveAssignment: false
      },
      {
        id: 'driver-002',
        driverCode: 'DRV002',
        firstName: 'Maria',
        lastName: 'Santos',
        regionId: 'region-cebu',
        status: 'active',
        rating: 4.8,
        hasActiveAssignment: false
      }
    ].filter(driver => regionIds.includes(driver.regionId));
  }

  static async getUnassignedVehicles(regionIds: string[]) {
    // Mock unassigned vehicles - in production would query database
    return [
      {
        id: 'veh-003',
        vehicleCode: 'XOT-003',
        licensePlate: 'GHI789',
        make: 'Suzuki',
        model: 'Ertiga',
        regionId: 'region-manila',
        status: 'active',
        hasActiveAssignment: false
      },
      {
        id: 'veh-004',
        vehicleCode: 'XOT-004',
        licensePlate: 'JKL012',
        make: 'Toyota',
        model: 'Innova',
        regionId: 'region-cebu',
        status: 'active',
        hasActiveAssignment: false
      }
    ].filter(vehicle => regionIds.includes(vehicle.regionId));
  }
}

// POST /api/vehicles/assignments/bulk - Bulk assign drivers to vehicles
const postBulkAssignmentV1 = withEnhancedAuth({
  requiredPermissions: ['assign_driver', 'manage_fleet', 'bulk_operations'],
  dataClass: 'internal'
})(async (request: NextRequest, user) => {
  let body: BulkAssignDriverRequest;
  
  try {
    body = await request.json() as BulkAssignDriverRequest;
  } catch (error) {
    return createApiError(
      'Invalid JSON in request body',
      'INVALID_JSON',
      400,
      undefined,
      '/api/vehicles/assignments/bulk',
      'POST'
    );
  }

  // Validate request structure
  if (!body.assignments || !Array.isArray(body.assignments)) {
    return createValidationError(
      [{ field: 'assignments', message: 'Assignments array is required', code: 'REQUIRED_FIELD_MISSING' }],
      '/api/vehicles/assignments/bulk',
      'POST'
    );
  }

  if (body.assignments.length === 0) {
    return createApiError(
      'At least one assignment is required',
      'EMPTY_ASSIGNMENTS_ARRAY',
      400,
      undefined,
      '/api/vehicles/assignments/bulk',
      'POST'
    );
  }

  if (body.assignments.length > 100) {
    return createApiError(
      'Maximum 100 assignments per bulk operation',
      'BULK_LIMIT_EXCEEDED',
      400,
      { maxAllowed: 100, requested: body.assignments.length },
      '/api/vehicles/assignments/bulk',
      'POST'
    );
  }

  // Validate each assignment has required fields
  const validationErrors = [];
  for (let i = 0; i < body.assignments.length; i++) {
    const assignment = body.assignments[i];
    const requiredFields = ['vehicleId', 'driverId', 'assignmentType'];
    
    for (const field of requiredFields) {
      if (!assignment[field as keyof typeof assignment]) {
        validationErrors.push({
          field: `assignments[${i}].${field}`,
          message: `${field} is required`,
          code: 'REQUIRED_FIELD_MISSING'
        });
      }
    }
  }

  if (validationErrors.length > 0) {
    return createValidationError(validationErrors, '/api/vehicles/assignments/bulk', 'POST');
  }

  // Check for duplicate assignments in the request
  const seen = new Set();
  const duplicates = [];
  for (let i = 0; i < body.assignments.length; i++) {
    const assignment = body.assignments[i];
    const key = `${assignment.vehicleId}-${assignment.assignmentType}`;
    if (seen.has(key)) {
      duplicates.push(`Vehicle ${assignment.vehicleId} has duplicate ${assignment.assignmentType} assignment`);
    }
    seen.add(key);
  }

  if (duplicates.length > 0) {
    return createApiError(
      'Duplicate assignments detected in request',
      'DUPLICATE_ASSIGNMENTS',
      400,
      { duplicates },
      '/api/vehicles/assignments/bulk',
      'POST'
    );
  }

  // Process bulk assignment
  const result = await BulkAssignmentService.processBulkAssignment(
    body.assignments,
    user.id
  );

  // Audit bulk assignment operation
  await auditLogger.logEvent(
    AuditEventType.BULK_OPERATION,
    SecurityLevel.MEDIUM,
    'SUCCESS',
    { 
      operation: 'bulk_driver_assignment',
      totalRequested: result.summary.totalRequested,
      successful: result.summary.successful,
      failed: result.summary.failed,
      executionTimeMs: result.summary.executionTimeMs
    },
    { 
      userId: user.id,
      resource: 'assignments',
      action: 'bulk_create',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
    }
  );

  // Log individual failures for investigation
  if (result.failed.length > 0) {
    await auditLogger.logEvent(
      AuditEventType.BULK_OPERATION_FAILURES,
      SecurityLevel.LOW,
      'WARNING',
      { 
        operation: 'bulk_driver_assignment',
        failures: result.failed
      },
      { 
        userId: user.id,
        resource: 'assignments',
        action: 'bulk_create_failures',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
      }
    );
  }

  const responseStatus = result.summary.failed > 0 ? 207 : 200; // 207 Multi-Status for partial success

  return createVersionedResponse(result, 'v1');
});

// GET /api/vehicles/assignments/bulk/available - Get available drivers and vehicles for bulk assignment
const getAvailableForBulkV1 = withEnhancedAuth({
  requiredPermissions: ['assign_driver', 'view_driver_assignments'],
  dataClass: 'internal'
})(async (request: NextRequest, user) => {
  const url = new URL(request.url);
  const regionIds = url.searchParams.get('regions')?.split(',') || [];
  
  // Apply regional filtering for users with regional restrictions
  const userRegions = user.allowedRegions || [];
  let allowedRegions = regionIds;
  
  if (userRegions.length > 0 && userRegions[0] !== '*') {
    allowedRegions = regionIds.filter(region => userRegions.includes(region));
    if (allowedRegions.length === 0) {
      allowedRegions = userRegions.slice(0, 1); // Use first allowed region
    }
  }

  const [availableDrivers, unassignedVehicles] = await Promise.all([
    BulkAssignmentService.getAvailableDriversForBulkAssignment(allowedRegions),
    BulkAssignmentService.getUnassignedVehicles(allowedRegions)
  ]);

  return createVersionedResponse({
    availableDrivers,
    unassignedVehicles,
    summary: {
      availableDriversCount: availableDrivers.length,
      unassignedVehiclesCount: unassignedVehicles.length,
      regionsIncluded: allowedRegions,
      maxBulkSize: 100
    }
  }, 'v1');
});

// POST /api/vehicles/assignments/bulk/validate - Validate bulk assignment before execution
const postBulkValidateV1 = withEnhancedAuth({
  requiredPermissions: ['assign_driver', 'view_driver_assignments'],
  dataClass: 'internal'
})(async (request: NextRequest, user) => {
  let body: BulkAssignDriverRequest;
  
  try {
    body = await request.json() as BulkAssignDriverRequest;
  } catch (error) {
    return createApiError(
      'Invalid JSON in request body',
      'INVALID_JSON',
      400,
      undefined,
      '/api/vehicles/assignments/bulk/validate',
      'POST'
    );
  }

  if (!body.assignments || !Array.isArray(body.assignments) || body.assignments.length === 0) {
    return createValidationError(
      [{ field: 'assignments', message: 'Assignments array is required', code: 'REQUIRED_FIELD_MISSING' }],
      '/api/vehicles/assignments/bulk/validate',
      'POST'
    );
  }

  // Perform validation without actually creating assignments
  const validationResults = {
    valid: [],
    invalid: [],
    warnings: []
  };

  for (let i = 0; i < body.assignments.length; i++) {
    const assignment = body.assignments[i];
    const index = i;

    // Basic validation
    const basicValidation = BulkAssignmentService['validateAssignment'](assignment);
    if (!basicValidation.valid) {
      validationResults.invalid.push({
        index,
        vehicleId: assignment.vehicleId,
        driverId: assignment.driverId,
        error: basicValidation.error,
        errorCode: basicValidation.errorCode
      });
      continue;
    }

    // Conflict checking
    const conflictCheck = BulkAssignmentService['checkConflicts'](assignment);
    if (!conflictCheck.valid) {
      validationResults.invalid.push({
        index,
        vehicleId: assignment.vehicleId,
        driverId: assignment.driverId,
        error: conflictCheck.error,
        errorCode: conflictCheck.errorCode
      });
      continue;
    }

    // Check for potential issues that don't prevent assignment
    const warnings = [];
    if (assignment.assignmentType === 'temporary' && !assignment.validUntil) {
      warnings.push('Temporary assignment without end date');
    }
    if (assignment.dailyRentalFee && assignment.dailyRentalFee > 1000) {
      warnings.push('High daily rental fee (over ₱1000)');
    }

    if (warnings.length > 0) {
      validationResults.warnings.push({
        index,
        vehicleId: assignment.vehicleId,
        driverId: assignment.driverId,
        warnings
      });
    }

    validationResults.valid.push({
      index,
      vehicleId: assignment.vehicleId,
      driverId: assignment.driverId,
      assignmentType: assignment.assignmentType
    });
  }

  return createVersionedResponse({
    validation: validationResults,
    summary: {
      totalRequested: body.assignments.length,
      valid: validationResults.valid.length,
      invalid: validationResults.invalid.length,
      warnings: validationResults.warnings.length,
      canProceed: validationResults.invalid.length === 0
    }
  }, 'v1');
});

export const GET = versionedApiRoute({
  v1: async (request: NextRequest) => {
    const url = new URL(request.url);
    if (url.pathname.endsWith('/available')) {
      return getAvailableForBulkV1(request);
    }
    // Default GET behavior could list recent bulk operations
    return createApiError('Method not supported for this endpoint', 'METHOD_NOT_SUPPORTED', 405);
  }
});

export const POST = versionedApiRoute({
  v1: async (request: NextRequest) => {
    const url = new URL(request.url);
    if (url.pathname.endsWith('/validate')) {
      return postBulkValidateV1(request);
    }
    return postBulkAssignmentV1(request);
  }
});

// OPTIONS handler for CORS
export const OPTIONS = handleOptionsRequest;