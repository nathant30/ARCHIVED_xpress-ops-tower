// /api/vehicles/[id]/assignments - Driver Assignment Management API
// Assign/unassign drivers to vehicles with rental terms and history tracking

import { NextRequest } from 'next/server';
import { 
  createApiResponse, 
  createApiError,
  createValidationError,
  createNotFoundError,
  parseQueryParams,
  validateRequiredFields,
  asyncHandler,
  handleOptionsRequest
} from '@/lib/api-utils';
import { withEnhancedAuth } from '@/lib/auth/enhanced-auth';
import { auditLogger, AuditEventType, SecurityLevel } from '@/lib/security/auditLogger';
import { versionedApiRoute, createVersionedResponse } from '@/middleware/apiVersioning';
import { 
  VehicleDriverAssignment, 
  AssignDriverRequest,
  AssignmentType 
} from '@/types/vehicles';

// Mock data service for driver assignments
class VehicleAssignmentService {
  private static assignments: VehicleDriverAssignment[] = [
    {
      id: 'assign-001',
      vehicleId: 'veh-001',
      driverId: 'driver-001',
      assignmentType: 'primary',
      assignedAt: new Date('2024-11-01'),
      validFrom: new Date('2024-11-01'),
      validUntil: null,
      dailyRentalFee: 0, // Xpress-owned, no rental
      fuelResponsibility: 'driver',
      maintenanceResponsibility: 'owner',
      totalTripsAssigned: 85,
      totalDistanceAssigned: 1200,
      totalEarningsAssigned: 42500,
      averageRatingAssigned: 4.6,
      isActive: true,
      createdAt: new Date('2024-11-01'),
      updatedAt: new Date('2024-11-01')
    }
  ];

  private static drivers = [
    {
      id: 'driver-001',
      driverCode: 'DRV001',
      firstName: 'Juan',
      lastName: 'Cruz',
      phone: '+639171234567',
      status: 'active',
      rating: 4.6,
      totalTrips: 520,
      regionId: 'region-manila'
    },
    {
      id: 'driver-002',
      driverCode: 'DRV002',
      firstName: 'Maria',
      lastName: 'Santos',
      phone: '+639181234567',
      status: 'active',
      rating: 4.8,
      totalTrips: 340,
      regionId: 'region-manila'
    }
  ];

  static getAssignmentsByVehicle(vehicleId: string): VehicleDriverAssignment[] {
    return this.assignments.filter(a => a.vehicleId === vehicleId);
  }

  static getActiveAssignments(vehicleId: string): VehicleDriverAssignment[] {
    const now = new Date();
    return this.assignments.filter(a => 
      a.vehicleId === vehicleId && 
      a.isActive && 
      (!a.validUntil || a.validUntil > now)
    );
  }

  static getAssignmentById(assignmentId: string): VehicleDriverAssignment | null {
    return this.assignments.find(a => a.id === assignmentId) || null;
  }

  static createAssignment(
    vehicleId: string, 
    data: AssignDriverRequest, 
    assignedBy: string
  ): VehicleDriverAssignment {
    // Deactivate existing primary assignment if assigning new primary
    if (data.assignmentType === 'primary') {
      this.assignments.forEach(a => {
        if (a.vehicleId === vehicleId && a.assignmentType === 'primary' && a.isActive) {
          a.isActive = false;
          a.validUntil = new Date();
          a.updatedAt = new Date();
        }
      });
    }

    const assignment: VehicleDriverAssignment = {
      id: `assign-${Date.now()}`,
      vehicleId,
      driverId: data.driverId,
      assignmentType: data.assignmentType,
      assignedAt: new Date(),
      assignedBy,
      validFrom: data.validFrom || new Date(),
      validUntil: data.validUntil,
      dailyRentalFee: data.dailyRentalFee,
      fuelResponsibility: data.fuelResponsibility || 'driver',
      maintenanceResponsibility: data.maintenanceResponsibility || 'owner',
      totalTripsAssigned: 0,
      totalDistanceAssigned: 0,
      totalEarningsAssigned: 0,
      averageRatingAssigned: 5.0,
      isActive: true,
      notes: data.notes,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.assignments.push(assignment);
    return assignment;
  }

  static updateAssignment(
    assignmentId: string, 
    data: Partial<AssignDriverRequest>
  ): VehicleDriverAssignment | null {
    const index = this.assignments.findIndex(a => a.id === assignmentId);
    if (index === -1) return null;

    this.assignments[index] = {
      ...this.assignments[index],
      ...data,
      updatedAt: new Date()
    };

    return this.assignments[index];
  }

  static deactivateAssignment(assignmentId: string): boolean {
    const index = this.assignments.findIndex(a => a.id === assignmentId);
    if (index === -1) return false;

    this.assignments[index].isActive = false;
    this.assignments[index].validUntil = new Date();
    this.assignments[index].updatedAt = new Date();
    
    return true;
  }

  static getDriverById(driverId: string) {
    return this.drivers.find(d => d.id === driverId) || null;
  }

  static getAvailableDrivers(regionId: string) {
    // Mock query - in production would check for drivers without active primary assignments
    return this.drivers.filter(d => 
      d.status === 'active' && 
      d.regionId === regionId &&
      !this.assignments.some(a => 
        a.driverId === d.id && 
        a.assignmentType === 'primary' && 
        a.isActive &&
        (!a.validUntil || a.validUntil > new Date())
      )
    );
  }

  static getAssignmentHistory(vehicleId: string, limit = 50) {
    return this.assignments
      .filter(a => a.vehicleId === vehicleId)
      .sort((a, b) => b.assignedAt.getTime() - a.assignedAt.getTime())
      .slice(0, limit)
      .map(assignment => ({
        ...assignment,
        driver: this.getDriverById(assignment.driverId)
      }));
  }
}

// GET /api/vehicles/[id]/assignments - Get all assignments for a vehicle
const getAssignmentsV1 = withEnhancedAuth({
  requiredPermissions: ['view_driver_assignments', 'assign_driver'],
  dataClass: 'internal'
})(async (request: NextRequest, user, { params }: { params: { id: string } }) => {
  const vehicleId = params.id;
  const queryParams = parseQueryParams(request);
  
  if (!vehicleId) {
    return createApiError(
      'Vehicle ID is required',
      'MISSING_VEHICLE_ID',
      400,
      undefined,
      `/api/vehicles/${vehicleId}/assignments`,
      'GET'
    );
  }

  // Check if requesting active assignments only
  const activeOnly = queryParams.active === true;
  const includeHistory = queryParams.history === true;
  
  let assignments;
  if (activeOnly) {
    assignments = VehicleAssignmentService.getActiveAssignments(vehicleId);
  } else {
    assignments = VehicleAssignmentService.getAssignmentsByVehicle(vehicleId);
  }

  // Include driver details
  const assignmentsWithDrivers = assignments.map(assignment => ({
    ...assignment,
    driver: VehicleAssignmentService.getDriverById(assignment.driverId)
  }));

  const response: any = {
    assignments: assignmentsWithDrivers,
    summary: {
      totalAssignments: assignments.length,
      activeAssignments: assignments.filter(a => a.isActive).length,
      primaryAssignment: assignments.find(a => a.assignmentType === 'primary' && a.isActive),
      secondaryAssignments: assignments.filter(a => a.assignmentType === 'secondary' && a.isActive).length
    }
  };

  // Include assignment history if requested
  if (includeHistory) {
    response.history = VehicleAssignmentService.getAssignmentHistory(vehicleId, 20);
  }

  return createVersionedResponse(response, 'v1');
});

// POST /api/vehicles/[id]/assignments - Create new driver assignment
const postAssignmentV1 = withEnhancedAuth({
  requiredPermissions: ['assign_driver', 'manage_fleet'],
  dataClass: 'internal'
})(async (request: NextRequest, user, { params }: { params: { id: string } }) => {
  const vehicleId = params.id;
  
  if (!vehicleId) {
    return createApiError(
      'Vehicle ID is required',
      'MISSING_VEHICLE_ID',
      400,
      undefined,
      `/api/vehicles/${vehicleId}/assignments`,
      'POST'
    );
  }

  let body: AssignDriverRequest;
  
  try {
    body = await request.json() as AssignDriverRequest;
  } catch (error) {
    return createApiError(
      'Invalid JSON in request body',
      'INVALID_JSON',
      400,
      undefined,
      `/api/vehicles/${vehicleId}/assignments`,
      'POST'
    );
  }

  // Validate required fields
  const requiredFields = ['driverId', 'assignmentType'];
  const validationErrors = validateRequiredFields(body, requiredFields);

  // Additional validation
  if (!['primary', 'secondary', 'temporary'].includes(body.assignmentType)) {
    validationErrors.push({
      field: 'assignmentType',
      message: 'Assignment type must be primary, secondary, or temporary',
      code: 'INVALID_ASSIGNMENT_TYPE',
    });
  }

  if (body.validFrom && body.validUntil && body.validFrom >= body.validUntil) {
    validationErrors.push({
      field: 'validUntil',
      message: 'Valid until date must be after valid from date',
      code: 'INVALID_DATE_RANGE',
    });
  }

  if (body.dailyRentalFee && body.dailyRentalFee < 0) {
    validationErrors.push({
      field: 'dailyRentalFee',
      message: 'Daily rental fee cannot be negative',
      code: 'INVALID_RENTAL_FEE',
    });
  }

  if (validationErrors.length > 0) {
    return createValidationError(validationErrors, `/api/vehicles/${vehicleId}/assignments`, 'POST');
  }

  // Check if driver exists and is available
  const driver = VehicleAssignmentService.getDriverById(body.driverId);
  if (!driver) {
    return createApiError(
      'Driver not found',
      'DRIVER_NOT_FOUND',
      404,
      { driverId: body.driverId },
      `/api/vehicles/${vehicleId}/assignments`,
      'POST'
    );
  }

  if (driver.status !== 'active') {
    return createApiError(
      'Driver is not active',
      'DRIVER_INACTIVE',
      400,
      { driverId: body.driverId, status: driver.status },
      `/api/vehicles/${vehicleId}/assignments`,
      'POST'
    );
  }

  // Check for conflicting primary assignments
  if (body.assignmentType === 'primary') {
    const activeAssignments = VehicleAssignmentService.getActiveAssignments(vehicleId);
    const existingPrimary = activeAssignments.find(a => a.assignmentType === 'primary');
    
    if (existingPrimary) {
      return createApiError(
        'Vehicle already has an active primary driver assignment',
        'EXISTING_PRIMARY_ASSIGNMENT',
        409,
        { 
          existingAssignmentId: existingPrimary.id,
          existingDriverId: existingPrimary.driverId 
        },
        `/api/vehicles/${vehicleId}/assignments`,
        'POST'
      );
    }

    // Check if driver already has a primary assignment
    const driverPrimaryAssignment = VehicleAssignmentService.assignments.find(a => 
      a.driverId === body.driverId && 
      a.assignmentType === 'primary' && 
      a.isActive &&
      (!a.validUntil || a.validUntil > new Date())
    );

    if (driverPrimaryAssignment) {
      return createApiError(
        'Driver already has an active primary vehicle assignment',
        'DRIVER_ALREADY_ASSIGNED',
        409,
        { 
          existingVehicleId: driverPrimaryAssignment.vehicleId,
          existingAssignmentId: driverPrimaryAssignment.id 
        },
        `/api/vehicles/${vehicleId}/assignments`,
        'POST'
      );
    }
  }

  const newAssignment = VehicleAssignmentService.createAssignment(
    vehicleId, 
    body, 
    user.id
  );

  // Audit assignment creation
  await auditLogger.logEvent(
    AuditEventType.RESOURCE_CREATION,
    SecurityLevel.MEDIUM,
    'SUCCESS',
    { 
      resource: 'driver_assignment',
      assignmentId: newAssignment.id,
      vehicleId,
      driverId: body.driverId,
      assignmentType: body.assignmentType
    },
    { 
      userId: user.id,
      resource: 'assignments',
      action: 'create',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
    }
  );

  return createVersionedResponse({ 
    assignment: {
      ...newAssignment,
      driver: VehicleAssignmentService.getDriverById(newAssignment.driverId)
    }
  }, 'v1');
});

// PUT /api/vehicles/[id]/assignments/[assignmentId] - Update assignment
const putAssignmentV1 = withEnhancedAuth({
  requiredPermissions: ['assign_driver', 'manage_fleet'],
  dataClass: 'internal'
})(async (request: NextRequest, user) => {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const vehicleId = pathParts[3];
  const assignmentId = pathParts[5];

  if (!vehicleId || !assignmentId) {
    return createApiError(
      'Vehicle ID and Assignment ID are required',
      'MISSING_IDS',
      400,
      undefined,
      url.pathname,
      'PUT'
    );
  }

  let body: Partial<AssignDriverRequest>;
  
  try {
    body = await request.json() as Partial<AssignDriverRequest>;
  } catch (error) {
    return createApiError(
      'Invalid JSON in request body',
      'INVALID_JSON',
      400,
      undefined,
      url.pathname,
      'PUT'
    );
  }

  // Check if assignment exists
  const existingAssignment = VehicleAssignmentService.getAssignmentById(assignmentId);
  if (!existingAssignment || existingAssignment.vehicleId !== vehicleId) {
    return createNotFoundError(
      'Assignment',
      url.pathname,
      'PUT'
    );
  }

  // Validate updates
  const validationErrors = [];

  if (body.validFrom && body.validUntil && body.validFrom >= body.validUntil) {
    validationErrors.push({
      field: 'validUntil',
      message: 'Valid until date must be after valid from date',
      code: 'INVALID_DATE_RANGE',
    });
  }

  if (body.dailyRentalFee !== undefined && body.dailyRentalFee < 0) {
    validationErrors.push({
      field: 'dailyRentalFee',
      message: 'Daily rental fee cannot be negative',
      code: 'INVALID_RENTAL_FEE',
    });
  }

  if (validationErrors.length > 0) {
    return createValidationError(validationErrors, url.pathname, 'PUT');
  }

  const updatedAssignment = VehicleAssignmentService.updateAssignment(assignmentId, body);

  if (!updatedAssignment) {
    return createApiError(
      'Failed to update assignment',
      'UPDATE_FAILED',
      500,
      undefined,
      url.pathname,
      'PUT'
    );
  }

  // Audit assignment update
  await auditLogger.logEvent(
    AuditEventType.RESOURCE_MODIFICATION,
    SecurityLevel.MEDIUM,
    'SUCCESS',
    { 
      resource: 'driver_assignment',
      assignmentId: updatedAssignment.id,
      vehicleId,
      driverId: updatedAssignment.driverId,
      changes: body
    },
    { 
      userId: user.id,
      resource: 'assignments',
      action: 'update',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
    }
  );

  return createVersionedResponse({ 
    assignment: {
      ...updatedAssignment,
      driver: VehicleAssignmentService.getDriverById(updatedAssignment.driverId)
    }
  }, 'v1');
});

// DELETE /api/vehicles/[id]/assignments/[assignmentId] - Deactivate assignment
const deleteAssignmentV1 = withEnhancedAuth({
  requiredPermissions: ['assign_driver', 'manage_fleet'],
  dataClass: 'internal'
})(async (request: NextRequest, user) => {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const vehicleId = pathParts[3];
  const assignmentId = pathParts[5];

  if (!vehicleId || !assignmentId) {
    return createApiError(
      'Vehicle ID and Assignment ID are required',
      'MISSING_IDS',
      400,
      undefined,
      url.pathname,
      'DELETE'
    );
  }

  // Check if assignment exists
  const existingAssignment = VehicleAssignmentService.getAssignmentById(assignmentId);
  if (!existingAssignment || existingAssignment.vehicleId !== vehicleId) {
    return createNotFoundError(
      'Assignment',
      url.pathname,
      'DELETE'
    );
  }

  if (!existingAssignment.isActive) {
    return createApiError(
      'Assignment is already inactive',
      'ASSIGNMENT_ALREADY_INACTIVE',
      409,
      undefined,
      url.pathname,
      'DELETE'
    );
  }

  const success = VehicleAssignmentService.deactivateAssignment(assignmentId);

  if (!success) {
    return createApiError(
      'Failed to deactivate assignment',
      'DEACTIVATION_FAILED',
      500,
      undefined,
      url.pathname,
      'DELETE'
    );
  }

  // Audit assignment deactivation
  await auditLogger.logEvent(
    AuditEventType.RESOURCE_DELETION,
    SecurityLevel.MEDIUM,
    'SUCCESS',
    { 
      resource: 'driver_assignment',
      assignmentId: existingAssignment.id,
      vehicleId,
      driverId: existingAssignment.driverId,
      assignmentType: existingAssignment.assignmentType
    },
    { 
      userId: user.id,
      resource: 'assignments',
      action: 'deactivate',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
    }
  );

  return createVersionedResponse({ 
    message: 'Assignment successfully deactivated',
    assignmentId,
    deactivatedAt: new Date()
  }, 'v1');
});

export const GET = versionedApiRoute({
  v1: getAssignmentsV1
});

export const POST = versionedApiRoute({
  v1: postAssignmentV1
});

export const PUT = versionedApiRoute({
  v1: putAssignmentV1
});

export const DELETE = versionedApiRoute({
  v1: deleteAssignmentV1
});

// OPTIONS handler for CORS
export const OPTIONS = handleOptionsRequest;