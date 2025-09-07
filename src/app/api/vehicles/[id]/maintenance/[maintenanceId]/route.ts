// /api/vehicles/[id]/maintenance/[maintenanceId] - Individual Maintenance Record Management
// GET, PUT, DELETE operations for specific maintenance records

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
import { UpdateMaintenanceRequest } from '@/types/vehicles';

// Mock service for individual maintenance operations
class MaintenanceRecordService {
  private static maintenanceRecords = [
    {
      id: 'maint-001',
      vehicleId: 'veh-001',
      maintenanceCode: 'MNT-001-2024',
      workOrderNumber: 'WO-2024-001',
      maintenanceType: 'oil_change',
      priority: 'routine',
      isScheduled: true,
      scheduledDate: new Date('2024-12-15'),
      scheduledStartTime: '09:00',
      actualStartTime: null,
      actualCompletionTime: null,
      estimatedDurationHours: 1.5,
      actualDurationHours: null,
      description: 'Scheduled oil change and filter replacement',
      workPerformed: null,
      serviceProvider: 'AutoServe Manila',
      serviceLocation: 'Makati Service Center',
      serviceContact: '+632-8555-1234',
      preMaintenanceOdometerKm: null,
      postMaintenanceOdometerKm: null,
      preMaintenanceCondition: null,
      postMaintenanceCondition: null,
      laborHours: 0,
      partsCost: 0,
      laborCost: 0,
      otherCosts: 0,
      totalCost: 0,
      costApprovedBy: null,
      paidBy: 'xpress',
      paymentStatus: 'pending',
      qualityRating: null,
      followUpRequired: false,
      followUpDate: null,
      followUpNotes: null,
      affectsSafety: false,
      affectsCompliance: false,
      inspectionPassed: null,
      inspectorNotes: null,
      status: 'scheduled',
      cancellationReason: null,
      photos: [],
      receipts: [],
      warrantyInfo: {},
      partsReplaced: [],
      nextMaintenanceType: null,
      nextMaintenanceDueDate: null,
      nextMaintenanceDueKm: null,
      createdAt: new Date('2024-12-01'),
      updatedAt: new Date('2024-12-01'),
      createdBy: 'user-001',
      updatedBy: null
    }
  ];

  static getMaintenanceById(maintenanceId: string, vehicleId?: string) {
    const record = this.maintenanceRecords.find(m => m.id === maintenanceId);
    if (!record) return null;
    
    if (vehicleId && record.vehicleId !== vehicleId) return null;
    
    return record;
  }

  static updateMaintenance(maintenanceId: string, data: UpdateMaintenanceRequest, updatedBy: string) {
    const index = this.maintenanceRecords.findIndex(m => m.id === maintenanceId);
    if (index === -1) return null;

    // Calculate total cost if components are updated
    const currentRecord = this.maintenanceRecords[index];
    const partsCost = data.partsCost !== undefined ? data.partsCost : currentRecord.partsCost;
    const laborCost = data.laborCost !== undefined ? data.laborCost : currentRecord.laborCost;
    const otherCosts = data.otherCosts !== undefined ? data.otherCosts : currentRecord.otherCosts;

    const updatedRecord = {
      ...currentRecord,
      ...data,
      totalCost: partsCost + laborCost + otherCosts,
      updatedAt: new Date(),
      updatedBy
    };

    this.maintenanceRecords[index] = updatedRecord;
    return updatedRecord;
  }

  static deleteMaintenance(maintenanceId: string): boolean {
    const index = this.maintenanceRecords.findIndex(m => m.id === maintenanceId);
    if (index === -1) return false;

    const record = this.maintenanceRecords[index];
    
    // Can only delete scheduled maintenance
    if (record.status !== 'scheduled') {
      return false;
    }

    this.maintenanceRecords.splice(index, 1);
    return true;
  }

  static getMaintenanceWithDetails(maintenanceId: string) {
    const maintenance = this.getMaintenanceById(maintenanceId);
    if (!maintenance) return null;

    // In production, this would include additional related data
    return {
      ...maintenance,
      vehicle: {
        id: maintenance.vehicleId,
        vehicleCode: 'XOT-001',
        licensePlate: 'ABC123',
        make: 'Toyota',
        model: 'Vios'
      },
      serviceHistory: [
        {
          date: new Date('2024-09-15'),
          type: 'oil_change',
          cost: 2200,
          serviceProvider: 'AutoServe Manila'
        }
      ],
      relatedAlerts: [
        {
          id: 'alert-001',
          alertType: 'maintenance_due',
          status: 'acknowledged',
          acknowledgedAt: new Date('2024-12-02')
        }
      ],
      costBreakdown: {
        parts: maintenance.partsCost,
        labor: maintenance.laborCost,
        other: maintenance.otherCosts,
        total: maintenance.totalCost,
        currency: 'PHP'
      }
    };
  }

  static canModifyMaintenance(maintenanceId: string, requestedChanges: any): { allowed: boolean; reason?: string } {
    const record = this.getMaintenanceById(maintenanceId);
    if (!record) {
      return { allowed: false, reason: 'Maintenance record not found' };
    }

    // Completed maintenance has restrictions
    if (record.status === 'completed') {
      const allowedFields = ['qualityRating', 'followUpNotes', 'nextMaintenanceType', 'nextMaintenanceDueDate'];
      const requestedFields = Object.keys(requestedChanges);
      const hasRestrictedChanges = requestedFields.some(field => !allowedFields.includes(field));
      
      if (hasRestrictedChanges) {
        return { 
          allowed: false, 
          reason: 'Completed maintenance can only be updated with quality rating, follow-up notes, or next maintenance info' 
        };
      }
    }

    // Cancelled maintenance cannot be modified
    if (record.status === 'cancelled') {
      return { allowed: false, reason: 'Cancelled maintenance cannot be modified' };
    }

    return { allowed: true };
  }
}

// GET /api/vehicles/[id]/maintenance/[maintenanceId] - Get specific maintenance record
const getMaintenanceByIdV1 = withEnhancedAuth({
  requiredPermissions: ['view_vehicle_maintenance'],
  dataClass: 'internal'
})(async (request: NextRequest, user, { params }: { params: { id: string; maintenanceId: string } }) => {
  const { id: vehicleId, maintenanceId } = params;
  
  if (!vehicleId || !maintenanceId) {
    return createApiError(
      'Vehicle ID and Maintenance ID are required',
      'MISSING_IDS',
      400,
      undefined,
      `/api/vehicles/${vehicleId}/maintenance/${maintenanceId}`,
      'GET'
    );
  }

  const maintenance = MaintenanceRecordService.getMaintenanceWithDetails(maintenanceId);
  
  if (!maintenance || maintenance.vehicleId !== vehicleId) {
    return createNotFoundError(
      'Maintenance record',
      `/api/vehicles/${vehicleId}/maintenance/${maintenanceId}`,
      'GET'
    );
  }

  // Audit maintenance record access
  await auditLogger.logEvent(
    AuditEventType.DATA_ACCESS,
    SecurityLevel.LOW,
    'SUCCESS',
    { 
      resource: 'maintenance_record',
      maintenanceId: maintenance.id,
      vehicleId: maintenance.vehicleId,
      maintenanceType: maintenance.maintenanceType,
      action: 'view_details'
    },
    { 
      userId: user.id,
      resource: 'maintenance',
      action: 'view',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
    }
  );

  return createVersionedResponse({ maintenance }, 'v1');
});

// PUT /api/vehicles/[id]/maintenance/[maintenanceId] - Update specific maintenance record
const putMaintenanceByIdV1 = withEnhancedAuth({
  requiredPermissions: ['update_vehicle_maintenance', 'manage_fleet'],
  dataClass: 'internal'
})(async (request: NextRequest, user, { params }: { params: { id: string; maintenanceId: string } }) => {
  const { id: vehicleId, maintenanceId } = params;
  
  if (!vehicleId || !maintenanceId) {
    return createApiError(
      'Vehicle ID and Maintenance ID are required',
      'MISSING_IDS',
      400,
      undefined,
      `/api/vehicles/${vehicleId}/maintenance/${maintenanceId}`,
      'PUT'
    );
  }

  let body: UpdateMaintenanceRequest;
  
  try {
    body = await request.json() as UpdateMaintenanceRequest;
  } catch (error) {
    return createApiError(
      'Invalid JSON in request body',
      'INVALID_JSON',
      400,
      undefined,
      `/api/vehicles/${vehicleId}/maintenance/${maintenanceId}`,
      'PUT'
    );
  }

  // Check if maintenance exists
  const existingMaintenance = MaintenanceRecordService.getMaintenanceById(maintenanceId, vehicleId);
  if (!existingMaintenance) {
    return createNotFoundError(
      'Maintenance record',
      `/api/vehicles/${vehicleId}/maintenance/${maintenanceId}`,
      'PUT'
    );
  }

  // Check if modifications are allowed
  const modificationCheck = MaintenanceRecordService.canModifyMaintenance(maintenanceId, body);
  if (!modificationCheck.allowed) {
    return createApiError(
      modificationCheck.reason!,
      'MODIFICATION_NOT_ALLOWED',
      403,
      undefined,
      `/api/vehicles/${vehicleId}/maintenance/${maintenanceId}`,
      'PUT'
    );
  }

  // Validate update data
  const validationErrors = [];
  
  if (body.priority && !['routine', 'minor', 'major', 'urgent', 'critical'].includes(body.priority)) {
    validationErrors.push({
      field: 'priority',
      message: 'Priority must be one of: routine, minor, major, urgent, critical',
      code: 'INVALID_PRIORITY',
    });
  }

  if (body.status && !['scheduled', 'in_progress', 'completed', 'cancelled', 'deferred'].includes(body.status)) {
    validationErrors.push({
      field: 'status',
      message: 'Status must be one of: scheduled, in_progress, completed, cancelled, deferred',
      code: 'INVALID_STATUS',
    });
  }

  if (body.partsCost !== undefined && body.partsCost < 0) {
    validationErrors.push({
      field: 'partsCost',
      message: 'Parts cost cannot be negative',
      code: 'INVALID_COST',
    });
  }

  if (body.laborCost !== undefined && body.laborCost < 0) {
    validationErrors.push({
      field: 'laborCost',
      message: 'Labor cost cannot be negative',
      code: 'INVALID_COST',
    });
  }

  if (body.otherCosts !== undefined && body.otherCosts < 0) {
    validationErrors.push({
      field: 'otherCosts',
      message: 'Other costs cannot be negative',
      code: 'INVALID_COST',
    });
  }

  if (body.qualityRating && (body.qualityRating < 1 || body.qualityRating > 5)) {
    validationErrors.push({
      field: 'qualityRating',
      message: 'Quality rating must be between 1 and 5',
      code: 'INVALID_RATING',
    });
  }

  if (body.laborHours && body.laborHours < 0) {
    validationErrors.push({
      field: 'laborHours',
      message: 'Labor hours cannot be negative',
      code: 'INVALID_HOURS',
    });
  }

  // Validate status transitions
  if (body.status && body.status !== existingMaintenance.status) {
    const validTransitions: Record<string, string[]> = {
      'scheduled': ['in_progress', 'cancelled', 'deferred'],
      'in_progress': ['completed', 'cancelled', 'deferred'],
      'deferred': ['scheduled', 'cancelled'],
      'completed': [], // Cannot transition from completed
      'cancelled': []  // Cannot transition from cancelled
    };

    if (!validTransitions[existingMaintenance.status]?.includes(body.status)) {
      validationErrors.push({
        field: 'status',
        message: `Cannot transition from ${existingMaintenance.status} to ${body.status}`,
        code: 'INVALID_STATUS_TRANSITION',
      });
    }
  }

  // Validate completion requirements
  if (body.status === 'completed') {
    if (!body.actualCompletionTime && !existingMaintenance.actualCompletionTime) {
      validationErrors.push({
        field: 'actualCompletionTime',
        message: 'Actual completion time is required when marking as completed',
        code: 'REQUIRED_FOR_COMPLETION',
      });
    }

    if (!body.workPerformed && !existingMaintenance.workPerformed) {
      validationErrors.push({
        field: 'workPerformed',
        message: 'Work performed description is required when marking as completed',
        code: 'REQUIRED_FOR_COMPLETION',
      });
    }
  }

  if (validationErrors.length > 0) {
    return createValidationError(validationErrors, `/api/vehicles/${vehicleId}/maintenance/${maintenanceId}`, 'PUT');
  }

  // Auto-complete some fields based on status change
  if (body.status === 'in_progress' && !body.actualStartTime && !existingMaintenance.actualStartTime) {
    body.actualStartTime = new Date();
  }

  if (body.status === 'completed' && !body.actualCompletionTime && !existingMaintenance.actualCompletionTime) {
    body.actualCompletionTime = new Date();
  }

  const updatedMaintenance = MaintenanceRecordService.updateMaintenance(maintenanceId, body, user.id);

  if (!updatedMaintenance) {
    return createApiError(
      'Failed to update maintenance record',
      'UPDATE_FAILED',
      500,
      undefined,
      `/api/vehicles/${vehicleId}/maintenance/${maintenanceId}`,
      'PUT'
    );
  }

  // Audit maintenance update
  await auditLogger.logEvent(
    AuditEventType.RESOURCE_MODIFICATION,
    SecurityLevel.MEDIUM,
    'SUCCESS',
    { 
      resource: 'maintenance_record',
      maintenanceId: updatedMaintenance.id,
      vehicleId: updatedMaintenance.vehicleId,
      changes: body,
      previousStatus: existingMaintenance.status,
      newStatus: updatedMaintenance.status,
      costImpact: updatedMaintenance.totalCost - existingMaintenance.totalCost
    },
    { 
      userId: user.id,
      resource: 'maintenance',
      action: 'update',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
    }
  );

  return createVersionedResponse({ maintenance: updatedMaintenance }, 'v1');
});

// DELETE /api/vehicles/[id]/maintenance/[maintenanceId] - Delete/cancel maintenance record
const deleteMaintenanceByIdV1 = withEnhancedAuth({
  requiredPermissions: ['delete_vehicle_maintenance', 'manage_fleet'],
  dataClass: 'internal',
  requireMFA: true // Require MFA for deletion
})(async (request: NextRequest, user, { params }: { params: { id: string; maintenanceId: string } }) => {
  const { id: vehicleId, maintenanceId } = params;
  
  if (!vehicleId || !maintenanceId) {
    return createApiError(
      'Vehicle ID and Maintenance ID are required',
      'MISSING_IDS',
      400,
      undefined,
      `/api/vehicles/${vehicleId}/maintenance/${maintenanceId}`,
      'DELETE'
    );
  }

  // Check if maintenance exists
  const existingMaintenance = MaintenanceRecordService.getMaintenanceById(maintenanceId, vehicleId);
  if (!existingMaintenance) {
    return createNotFoundError(
      'Maintenance record',
      `/api/vehicles/${vehicleId}/maintenance/${maintenanceId}`,
      'DELETE'
    );
  }

  // Safety checks before deletion
  if (existingMaintenance.status === 'completed') {
    return createApiError(
      'Cannot delete completed maintenance records',
      'CANNOT_DELETE_COMPLETED',
      409,
      { status: existingMaintenance.status },
      `/api/vehicles/${vehicleId}/maintenance/${maintenanceId}`,
      'DELETE'
    );
  }

  if (existingMaintenance.status === 'in_progress') {
    return createApiError(
      'Cannot delete maintenance currently in progress',
      'CANNOT_DELETE_IN_PROGRESS',
      409,
      { status: existingMaintenance.status },
      `/api/vehicles/${vehicleId}/maintenance/${maintenanceId}`,
      'DELETE'
    );
  }

  if (existingMaintenance.totalCost > 0 && existingMaintenance.paymentStatus === 'paid') {
    return createApiError(
      'Cannot delete maintenance with paid expenses',
      'CANNOT_DELETE_PAID_MAINTENANCE',
      409,
      { totalCost: existingMaintenance.totalCost, paymentStatus: existingMaintenance.paymentStatus },
      `/api/vehicles/${vehicleId}/maintenance/${maintenanceId}`,
      'DELETE'
    );
  }

  const success = MaintenanceRecordService.deleteMaintenance(maintenanceId);

  if (!success) {
    return createApiError(
      'Failed to delete maintenance record',
      'DELETE_FAILED',
      500,
      undefined,
      `/api/vehicles/${vehicleId}/maintenance/${maintenanceId}`,
      'DELETE'
    );
  }

  // Audit maintenance deletion
  await auditLogger.logEvent(
    AuditEventType.RESOURCE_DELETION,
    SecurityLevel.HIGH,
    'SUCCESS',
    { 
      resource: 'maintenance_record',
      maintenanceId: existingMaintenance.id,
      vehicleId: existingMaintenance.vehicleId,
      maintenanceType: existingMaintenance.maintenanceType,
      scheduledDate: existingMaintenance.scheduledDate,
      totalCost: existingMaintenance.totalCost,
      previousStatus: existingMaintenance.status
    },
    { 
      userId: user.id,
      resource: 'maintenance',
      action: 'delete',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
    }
  );

  return createVersionedResponse({ 
    message: 'Maintenance record successfully deleted',
    maintenanceId: maintenanceId,
    deletedAt: new Date()
  }, 'v1');
});

export const GET = versionedApiRoute({
  v1: getMaintenanceByIdV1
});

export const PUT = versionedApiRoute({
  v1: putMaintenanceByIdV1
});

export const DELETE = versionedApiRoute({
  v1: deleteMaintenanceByIdV1
});

// OPTIONS handler for CORS
export const OPTIONS = handleOptionsRequest;