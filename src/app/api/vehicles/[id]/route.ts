// /api/vehicles/[id] - Individual Vehicle Management API
// GET, PUT, DELETE operations for specific vehicles

import { NextRequest } from 'next/server';
import { 
  createApiResponse, 
  createApiError,
  createValidationError,
  createNotFoundError,
  validateRequiredFields,
  asyncHandler,
  handleOptionsRequest
} from '@/lib/api-utils';
import { withEnhancedAuth } from '@/lib/auth/enhanced-auth';
import { auditLogger, AuditEventType, SecurityLevel } from '@/lib/security/auditLogger';
import { versionedApiRoute, createVersionedResponse } from '@/middleware/apiVersioning';
import { UpdateVehicleRequest } from '@/types/vehicles';

// Import the VehicleService from the main route (in production, this would be in a separate service file)
class VehicleService {
  private static vehicles = [
    // Mock data - in production this would be database queries
    {
      id: 'veh-001',
      vehicleCode: 'XOT-001',
      licensePlate: 'ABC123',
      make: 'Toyota',
      model: 'Vios',
      year: 2020,
      color: 'White',
      category: 'sedan',
      fuelType: 'gasoline',
      seatingCapacity: 4,
      ownershipType: 'xpress_owned',
      status: 'active',
      conditionRating: 'good',
      conditionScore: 85.0,
      regionId: 'region-manila',
      serviceTypes: ['ride_4w'],
      maxTripDistanceKm: 100,
      registrationExpiry: new Date('2025-12-31'),
      totalMaintenanceCost: 25000,
      maintenanceAlertsCount: 0,
      totalDistanceKm: 15000,
      totalTrips: 850,
      averageRating: 4.5,
      fuelEfficiencyKmpl: 14.5,
      carbonEmissionsKg: 2400,
      dailyOperatingHours: 12,
      utilizationRate: 75.0,
      availabilityScore: 92.0,
      emergencyContacts: [],
      safetyFeatures: {},
      accidentCount: 0,
      obdDeviceInstalled: true,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-12-01'),
      isActive: true
    }
  ];

  static getVehicleById(id: string) {
    return this.vehicles.find(v => v.id === id && v.isActive) || null;
  }

  static updateVehicle(id: string, data: UpdateVehicleRequest, updatedBy: string) {
    const index = this.vehicles.findIndex(v => v.id === id && v.isActive);
    if (index === -1) return null;

    this.vehicles[index] = {
      ...this.vehicles[index],
      ...data,
      updatedAt: new Date(),
      updatedBy
    };

    return this.vehicles[index];
  }

  static deleteVehicle(id: string): boolean {
    const index = this.vehicles.findIndex(v => v.id === id && v.isActive);
    if (index === -1) return false;

    // Soft delete - mark as inactive and decommissioned
    this.vehicles[index].isActive = false;
    this.vehicles[index].status = 'decommissioned';
    this.vehicles[index].updatedAt = new Date();
    
    return true;
  }

  static getVehicleWithDetails(id: string) {
    const vehicle = this.getVehicleById(id);
    if (!vehicle) return null;

    // In production, this would include joins to related tables
    return {
      ...vehicle,
      currentAssignment: {
        driverId: 'driver-001',
        driverName: 'Juan Cruz',
        assignmentType: 'primary',
        validFrom: new Date('2024-11-01'),
        validUntil: null,
        isActive: true
      },
      recentMaintenanceHistory: [
        {
          id: 'maint-001',
          maintenanceType: 'oil_change',
          completedDate: new Date('2024-10-15'),
          totalCost: 2500,
          serviceProvider: 'AutoServe Manila'
        }
      ],
      activeAlerts: [
        {
          id: 'alert-001',
          alertType: 'maintenance_due',
          alertTitle: 'Scheduled Maintenance Due',
          urgencyLevel: 'minor',
          createdAt: new Date('2024-11-25')
        }
      ],
      complianceStatus: {
        overallStatus: 'compliant',
        franchiseExpiry: new Date('2025-06-30'),
        registrationExpiry: new Date('2025-12-31'),
        insuranceExpiry: new Date('2025-08-15'),
        nextInspectionDue: new Date('2025-03-15')
      },
      obdStatus: vehicle.obdDeviceInstalled ? {
        status: 'connected',
        lastConnection: new Date('2024-12-01T10:30:00Z'),
        dataQuality: 98.5,
        deviceSerial: 'OBD-XOT-001-2024'
      } : null
    };
  }
}

// GET /api/vehicles/[id] - Get specific vehicle with detailed information
const getVehicleByIdV1 = withEnhancedAuth({
  requiredPermissions: ['view_vehicles'],
  dataClass: 'internal'
})(async (request: NextRequest, user, { params }: { params: { id: string } }) => {
  const vehicleId = params.id;
  
  if (!vehicleId) {
    return createApiError(
      'Vehicle ID is required',
      'MISSING_VEHICLE_ID',
      400,
      undefined,
      `/api/vehicles/${vehicleId}`,
      'GET'
    );
  }

  const vehicle = VehicleService.getVehicleWithDetails(vehicleId);
  
  if (!vehicle) {
    return createNotFoundError(
      'Vehicle',
      `/api/vehicles/${vehicleId}`,
      'GET'
    );
  }

  // Check regional access
  const userRegions = user.allowedRegions || [];
  if (userRegions.length > 0 && userRegions[0] !== '*' && !userRegions.includes(vehicle.regionId)) {
    return createApiError(
      'Access denied to vehicle in this region',
      'REGION_ACCESS_DENIED',
      403,
      { regionId: vehicle.regionId },
      `/api/vehicles/${vehicleId}`,
      'GET'
    );
  }

  // Audit vehicle access
  await auditLogger.logEvent(
    AuditEventType.DATA_ACCESS,
    SecurityLevel.LOW,
    'SUCCESS',
    { 
      resource: 'vehicle',
      vehicleId: vehicle.id,
      vehicleCode: vehicle.vehicleCode,
      action: 'view_details'
    },
    { 
      userId: user.id,
      resource: 'vehicles',
      action: 'view',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
    }
  );

  return createVersionedResponse({ vehicle }, 'v1');
});

// PUT /api/vehicles/[id] - Update specific vehicle
const putVehicleByIdV1 = withEnhancedAuth({
  requiredPermissions: ['update_vehicles', 'manage_fleet'],
  dataClass: 'internal'
})(async (request: NextRequest, user, { params }: { params: { id: string } }) => {
  const vehicleId = params.id;
  
  if (!vehicleId) {
    return createApiError(
      'Vehicle ID is required',
      'MISSING_VEHICLE_ID',
      400,
      undefined,
      `/api/vehicles/${vehicleId}`,
      'PUT'
    );
  }

  let body: UpdateVehicleRequest;
  
  try {
    body = await request.json() as UpdateVehicleRequest;
  } catch (error) {
    return createApiError(
      'Invalid JSON in request body',
      'INVALID_JSON',
      400,
      undefined,
      `/api/vehicles/${vehicleId}`,
      'PUT'
    );
  }

  // Check if vehicle exists
  const existingVehicle = VehicleService.getVehicleById(vehicleId);
  if (!existingVehicle) {
    return createNotFoundError(
      'Vehicle',
      `/api/vehicles/${vehicleId}`,
      'PUT'
    );
  }

  // Check regional access
  const userRegions = user.allowedRegions || [];
  if (userRegions.length > 0 && userRegions[0] !== '*' && !userRegions.includes(existingVehicle.regionId)) {
    return createApiError(
      'Access denied to vehicle in this region',
      'REGION_ACCESS_DENIED',
      403,
      { regionId: existingVehicle.regionId },
      `/api/vehicles/${vehicleId}`,
      'PUT'
    );
  }

  // Validate update data
  const validationErrors = [];
  
  if (body.year && (body.year < 1990 || body.year > new Date().getFullYear() + 2)) {
    validationErrors.push({
      field: 'year',
      message: 'Year must be between 1990 and ' + (new Date().getFullYear() + 2),
      code: 'INVALID_YEAR_RANGE',
    });
  }
  
  if (body.seatingCapacity && (body.seatingCapacity < 1 || body.seatingCapacity > 50)) {
    validationErrors.push({
      field: 'seatingCapacity',
      message: 'Seating capacity must be between 1 and 50',
      code: 'INVALID_SEATING_CAPACITY',
    });
  }

  if (body.conditionScore && (body.conditionScore < 0 || body.conditionScore > 100)) {
    validationErrors.push({
      field: 'conditionScore',
      message: 'Condition score must be between 0 and 100',
      code: 'INVALID_CONDITION_SCORE',
    });
  }

  // Check for ownership-specific requirements
  if (body.ownershipType === 'fleet_owned' && existingVehicle.ownershipType !== 'fleet_owned' && !body.fleetOwnerName) {
    validationErrors.push({
      field: 'fleetOwnerName',
      message: 'Fleet owner name is required when changing to fleet-owned',
      code: 'REQUIRED_FOR_FLEET_OWNED',
    });
  }

  if (body.ownershipType === 'operator_owned' && existingVehicle.ownershipType !== 'operator_owned' && !body.operatorOwnerName) {
    validationErrors.push({
      field: 'operatorOwnerName',
      message: 'Operator owner name is required when changing to operator-owned',
      code: 'REQUIRED_FOR_OPERATOR_OWNED',
    });
  }

  if (validationErrors.length > 0) {
    return createValidationError(validationErrors, `/api/vehicles/${vehicleId}`, 'PUT');
  }

  // Check if license plate is being changed and is unique
  if (body.licensePlate && body.licensePlate !== existingVehicle.licensePlate) {
    // In production, this would be a database query
    const plateExists = false; // Mock check
    if (plateExists) {
      return createApiError(
        'License plate already exists',
        'DUPLICATE_LICENSE_PLATE',
        409,
        { licensePlate: body.licensePlate },
        `/api/vehicles/${vehicleId}`,
        'PUT'
      );
    }
  }

  // Validate region change
  if (body.regionId && body.regionId !== existingVehicle.regionId) {
    if (userRegions.length > 0 && userRegions[0] !== '*' && !userRegions.includes(body.regionId)) {
      return createApiError(
        'Access denied to target region',
        'REGION_ACCESS_DENIED',
        403,
        { regionId: body.regionId },
        `/api/vehicles/${vehicleId}`,
        'PUT'
      );
    }
  }

  const updatedVehicle = VehicleService.updateVehicle(vehicleId, body, user.id);

  if (!updatedVehicle) {
    return createApiError(
      'Failed to update vehicle',
      'UPDATE_FAILED',
      500,
      undefined,
      `/api/vehicles/${vehicleId}`,
      'PUT'
    );
  }

  // Audit vehicle update
  await auditLogger.logEvent(
    AuditEventType.RESOURCE_MODIFICATION,
    SecurityLevel.MEDIUM,
    'SUCCESS',
    { 
      resource: 'vehicle',
      vehicleId: updatedVehicle.id,
      vehicleCode: updatedVehicle.vehicleCode,
      changes: body,
      previousStatus: existingVehicle.status,
      newStatus: updatedVehicle.status
    },
    { 
      userId: user.id,
      resource: 'vehicles',
      action: 'update',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
    }
  );

  return createVersionedResponse({ vehicle: updatedVehicle }, 'v1');
});

// DELETE /api/vehicles/[id] - Deactivate/delete specific vehicle
const deleteVehicleByIdV1 = withEnhancedAuth({
  requiredPermissions: ['delete_vehicles', 'manage_fleet'],
  dataClass: 'internal',
  requireMFA: true // Require MFA for deletion operations
})(async (request: NextRequest, user, { params }: { params: { id: string } }) => {
  const vehicleId = params.id;
  
  if (!vehicleId) {
    return createApiError(
      'Vehicle ID is required',
      'MISSING_VEHICLE_ID',
      400,
      undefined,
      `/api/vehicles/${vehicleId}`,
      'DELETE'
    );
  }

  // Check if vehicle exists
  const existingVehicle = VehicleService.getVehicleById(vehicleId);
  if (!existingVehicle) {
    return createNotFoundError(
      'Vehicle',
      `/api/vehicles/${vehicleId}`,
      'DELETE'
    );
  }

  // Check regional access
  const userRegions = user.allowedRegions || [];
  if (userRegions.length > 0 && userRegions[0] !== '*' && !userRegions.includes(existingVehicle.regionId)) {
    return createApiError(
      'Access denied to vehicle in this region',
      'REGION_ACCESS_DENIED',
      403,
      { regionId: existingVehicle.regionId },
      `/api/vehicles/${vehicleId}`,
      'DELETE'
    );
  }

  // Safety checks before deletion
  if (existingVehicle.status === 'in_service') {
    return createApiError(
      'Cannot delete vehicle currently in service',
      'VEHICLE_IN_SERVICE',
      409,
      { vehicleStatus: existingVehicle.status },
      `/api/vehicles/${vehicleId}`,
      'DELETE'
    );
  }

  // Check for active trips (in production, this would be a database query)
  const hasActiveTrips = false; // Mock check
  if (hasActiveTrips) {
    return createApiError(
      'Cannot delete vehicle with active trips',
      'VEHICLE_HAS_ACTIVE_TRIPS',
      409,
      undefined,
      `/api/vehicles/${vehicleId}`,
      'DELETE'
    );
  }

  // Check for outstanding maintenance (in production, this would be a database query)
  const hasOutstandingMaintenance = existingVehicle.status === 'maintenance';
  if (hasOutstandingMaintenance) {
    return createApiError(
      'Cannot delete vehicle with outstanding maintenance',
      'VEHICLE_HAS_OUTSTANDING_MAINTENANCE',
      409,
      { vehicleStatus: existingVehicle.status },
      `/api/vehicles/${vehicleId}`,
      'DELETE'
    );
  }

  const success = VehicleService.deleteVehicle(vehicleId);

  if (!success) {
    return createApiError(
      'Failed to delete vehicle',
      'DELETE_FAILED',
      500,
      undefined,
      `/api/vehicles/${vehicleId}`,
      'DELETE'
    );
  }

  // Audit vehicle deletion
  await auditLogger.logEvent(
    AuditEventType.RESOURCE_DELETION,
    SecurityLevel.HIGH,
    'SUCCESS',
    { 
      resource: 'vehicle',
      vehicleId: existingVehicle.id,
      vehicleCode: existingVehicle.vehicleCode,
      ownershipType: existingVehicle.ownershipType,
      previousStatus: existingVehicle.status
    },
    { 
      userId: user.id,
      resource: 'vehicles',
      action: 'delete',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
    }
  );

  return createVersionedResponse({ 
    message: 'Vehicle successfully deactivated',
    vehicleId: vehicleId,
    deactivatedAt: new Date()
  }, 'v1');
});

export const GET = versionedApiRoute({
  v1: getVehicleByIdV1
});

export const PUT = versionedApiRoute({
  v1: putVehicleByIdV1
});

export const DELETE = versionedApiRoute({
  v1: deleteVehicleByIdV1
});

// OPTIONS handler for CORS
export const OPTIONS = handleOptionsRequest;