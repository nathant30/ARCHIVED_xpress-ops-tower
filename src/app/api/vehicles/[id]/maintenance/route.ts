// /api/vehicles/[id]/maintenance - Vehicle Maintenance Management API
// Schedule, track, and manage vehicle maintenance with cost analysis and quality control

import { NextRequest } from 'next/server';
import { 
  createApiResponse, 
  createApiError,
  createValidationError,
  createNotFoundError,
  parseQueryParams,
  parsePaginationParams,
  applyPagination,
  validateRequiredFields,
  asyncHandler,
  handleOptionsRequest
} from '@/lib/api-utils';
import { withEnhancedAuth } from '@/lib/auth/enhanced-auth';
import { auditLogger, AuditEventType, SecurityLevel } from '@/lib/security/auditLogger';
import { versionedApiRoute, createVersionedResponse } from '@/middleware/apiVersioning';
import { 
  VehicleMaintenance, 
  MaintenanceAlert,
  ScheduleMaintenanceRequest,
  UpdateMaintenanceRequest,
  MaintenanceStatus,
  MaintenancePriority 
} from '@/types/vehicles';

// Mock data service for maintenance operations
class VehicleMaintenanceService {
  private static maintenanceRecords: VehicleMaintenance[] = [
    {
      id: 'maint-001',
      vehicleId: 'veh-001',
      maintenanceCode: 'MNT-001-2024',
      maintenanceType: 'oil_change',
      priority: 'routine',
      isScheduled: true,
      scheduledDate: new Date('2024-12-15'),
      scheduledStartTime: '09:00',
      description: 'Scheduled oil change and filter replacement',
      serviceProvider: 'AutoServe Manila',
      serviceLocation: 'Makati Service Center',
      serviceContact: '+632-8555-1234',
      estimatedDurationHours: 1.5,
      laborHours: 1.0,
      partsCost: 1500,
      laborCost: 800,
      otherCosts: 200,
      totalCost: 2500,
      paidBy: 'xpress',
      paymentStatus: 'paid',
      followUpRequired: false,
      affectsSafety: false,
      affectsCompliance: false,
      status: 'scheduled',
      photos: [],
      receipts: [],
      warrantyInfo: {},
      partsReplaced: [
        {
          partName: 'Engine Oil',
          partNumber: 'OIL-5W30-4L',
          quantity: 1,
          cost: 1200
        },
        {
          partName: 'Oil Filter',
          partNumber: 'FILTER-001',
          quantity: 1,
          cost: 300
        }
      ],
      createdAt: new Date('2024-12-01'),
      updatedAt: new Date('2024-12-01'),
      createdBy: 'user-001'
    }
  ];

  private static alerts: MaintenanceAlert[] = [
    {
      id: 'alert-001',
      vehicleId: 'veh-001',
      alertType: 'maintenance_due',
      alertSource: 'system',
      triggerCondition: 'days_since_last_maintenance',
      triggerValue: '85',
      currentValue: '85',
      thresholdValue: '90',
      alertTitle: 'Routine Maintenance Due Soon',
      alertDescription: 'Vehicle XOT-001 is approaching its 90-day maintenance interval. Current: 85 days since last service.',
      recommendedAction: 'Schedule routine maintenance within the next week',
      urgencyLevel: 'minor',
      notifyDriver: true,
      notifyOwner: true,
      notifyOpsTeam: false,
      notificationChannels: ['app', 'sms'],
      status: 'active',
      escalationLevel: 0,
      createdAt: new Date('2024-11-30')
    }
  ];

  static getMaintenanceByVehicle(vehicleId: string, filters: any = {}): VehicleMaintenance[] {
    let records = this.maintenanceRecords.filter(m => m.vehicleId === vehicleId);

    // Apply filters
    if (filters.status) {
      records = records.filter(m => m.status === filters.status);
    }
    if (filters.priority) {
      records = records.filter(m => m.priority === filters.priority);
    }
    if (filters.maintenanceType) {
      records = records.filter(m => m.maintenanceType === filters.maintenanceType);
    }
    if (filters.dateFrom) {
      records = records.filter(m => m.scheduledDate >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      records = records.filter(m => m.scheduledDate <= new Date(filters.dateTo));
    }

    return records.sort((a, b) => b.scheduledDate.getTime() - a.scheduledDate.getTime());
  }

  static getMaintenanceById(maintenanceId: string): VehicleMaintenance | null {
    return this.maintenanceRecords.find(m => m.id === maintenanceId) || null;
  }

  static createMaintenance(
    vehicleId: string, 
    data: ScheduleMaintenanceRequest, 
    createdBy: string
  ): VehicleMaintenance {
    const maintenance: VehicleMaintenance = {
      id: `maint-${Date.now()}`,
      vehicleId,
      maintenanceCode: `MNT-${Date.now().toString().slice(-6)}`,
      ...data,
      laborHours: 0,
      partsCost: 0,
      laborCost: 0,
      otherCosts: 0,
      totalCost: 0,
      paidBy: 'owner',
      paymentStatus: 'pending',
      followUpRequired: false,
      affectsSafety: false,
      affectsCompliance: false,
      status: 'scheduled',
      photos: [],
      receipts: [],
      warrantyInfo: {},
      partsReplaced: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy
    };

    this.maintenanceRecords.push(maintenance);
    return maintenance;
  }

  static updateMaintenance(
    maintenanceId: string, 
    data: UpdateMaintenanceRequest, 
    updatedBy: string
  ): VehicleMaintenance | null {
    const index = this.maintenanceRecords.findIndex(m => m.id === maintenanceId);
    if (index === -1) return null;

    // Recalculate total cost if cost components are updated
    const updatedRecord = {
      ...this.maintenanceRecords[index],
      ...data,
      updatedAt: new Date(),
      updatedBy
    };

    if (data.partsCost !== undefined || data.laborCost !== undefined || data.otherCosts !== undefined) {
      updatedRecord.totalCost = (updatedRecord.partsCost || 0) + 
                               (updatedRecord.laborCost || 0) + 
                               (updatedRecord.otherCosts || 0);
    }

    this.maintenanceRecords[index] = updatedRecord;
    return updatedRecord;
  }

  static deleteMaintenance(maintenanceId: string): boolean {
    const index = this.maintenanceRecords.findIndex(m => m.id === maintenanceId);
    if (index === -1) return false;

    // Can only delete scheduled maintenance
    if (this.maintenanceRecords[index].status !== 'scheduled') {
      return false;
    }

    this.maintenanceRecords.splice(index, 1);
    return true;
  }

  static getMaintenanceAlerts(vehicleId: string): MaintenanceAlert[] {
    return this.alerts.filter(a => a.vehicleId === vehicleId && a.status === 'active');
  }

  static getMaintenanceSummary(vehicleId: string) {
    const records = this.getMaintenanceByVehicle(vehicleId);
    const alerts = this.getMaintenanceAlerts(vehicleId);

    const last6Months = records.filter(m => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      return m.actualCompletionTime && m.actualCompletionTime >= sixMonthsAgo;
    });

    const lastCompleted = records.find(m => m.status === 'completed');
    const upcoming = records.filter(m => 
      m.status === 'scheduled' && 
      m.scheduledDate >= new Date()
    );

    return {
      totalRecords: records.length,
      completedLast6Months: last6Months.length,
      totalCostLast6Months: last6Months.reduce((sum, m) => sum + m.totalCost, 0),
      averageCostPerService: last6Months.length > 0 ? 
        last6Months.reduce((sum, m) => sum + m.totalCost, 0) / last6Months.length : 0,
      lastCompletedMaintenance: lastCompleted ? {
        id: lastCompleted.id,
        maintenanceType: lastCompleted.maintenanceType,
        completedDate: lastCompleted.actualCompletionTime,
        cost: lastCompleted.totalCost,
        serviceProvider: lastCompleted.serviceProvider
      } : null,
      upcomingMaintenance: upcoming.map(m => ({
        id: m.id,
        maintenanceType: m.maintenanceType,
        scheduledDate: m.scheduledDate,
        priority: m.priority,
        estimatedCost: m.totalCost || 0
      })),
      activeAlerts: alerts.length,
      highestAlertPriority: alerts.length > 0 ? 
        alerts.reduce((highest, alert) => {
          const priorities = { routine: 1, minor: 2, major: 3, urgent: 4, critical: 5 };
          return priorities[alert.urgencyLevel as keyof typeof priorities] > 
                 priorities[highest.urgencyLevel as keyof typeof priorities] ? alert : highest;
        }).urgencyLevel : null
    };
  }

  static generateMaintenanceReport(vehicleId: string, dateFrom: Date, dateTo: Date) {
    const records = this.getMaintenanceByVehicle(vehicleId).filter(m => 
      m.scheduledDate >= dateFrom && m.scheduledDate <= dateTo
    );

    const completed = records.filter(m => m.status === 'completed');
    const scheduled = records.filter(m => m.status === 'scheduled');
    const inProgress = records.filter(m => m.status === 'in_progress');
    const cancelled = records.filter(m => m.status === 'cancelled');

    const totalCost = completed.reduce((sum, m) => sum + m.totalCost, 0);
    const partsCost = completed.reduce((sum, m) => sum + m.partsCost, 0);
    const laborCost = completed.reduce((sum, m) => sum + m.laborCost, 0);
    
    const typeBreakdown = completed.reduce((breakdown: any, m) => {
      breakdown[m.maintenanceType] = (breakdown[m.maintenanceType] || 0) + 1;
      return breakdown;
    }, {});

    return {
      period: { from: dateFrom, to: dateTo },
      summary: {
        totalRecords: records.length,
        completed: completed.length,
        scheduled: scheduled.length,
        inProgress: inProgress.length,
        cancelled: cancelled.length,
        totalCost,
        partsCost,
        laborCost,
        averageCostPerService: completed.length > 0 ? totalCost / completed.length : 0
      },
      typeBreakdown,
      records: records.map(m => ({
        id: m.id,
        maintenanceCode: m.maintenanceCode,
        type: m.maintenanceType,
        scheduledDate: m.scheduledDate,
        status: m.status,
        cost: m.totalCost,
        serviceProvider: m.serviceProvider,
        priority: m.priority
      }))
    };
  }
}

// GET /api/vehicles/[id]/maintenance - List maintenance records for vehicle
const getMaintenanceV1 = withEnhancedAuth({
  requiredPermissions: ['view_vehicle_maintenance'],
  dataClass: 'internal'
})(async (request: NextRequest, user, { params }: { params: { id: string } }) => {
  const vehicleId = params.id;
  const queryParams = parseQueryParams(request);
  const paginationParams = parsePaginationParams(request);

  if (!vehicleId) {
    return createApiError(
      'Vehicle ID is required',
      'MISSING_VEHICLE_ID',
      400,
      undefined,
      `/api/vehicles/${vehicleId}/maintenance`,
      'GET'
    );
  }

  // Get maintenance records with filters
  const maintenanceRecords = VehicleMaintenanceService.getMaintenanceByVehicle(vehicleId, queryParams);
  
  // Apply pagination
  const paginatedResult = applyPagination(
    maintenanceRecords,
    paginationParams.page,
    paginationParams.limit
  );

  // Get summary data
  const summary = VehicleMaintenanceService.getMaintenanceSummary(vehicleId);
  const alerts = VehicleMaintenanceService.getMaintenanceAlerts(vehicleId);

  return createVersionedResponse({
    maintenance: paginatedResult.data,
    pagination: paginatedResult.pagination,
    summary,
    activeAlerts: alerts
  }, 'v1');
});

// POST /api/vehicles/[id]/maintenance - Schedule new maintenance
const postMaintenanceV1 = withEnhancedAuth({
  requiredPermissions: ['schedule_maintenance', 'manage_fleet'],
  dataClass: 'internal'
})(async (request: NextRequest, user, { params }: { params: { id: string } }) => {
  const vehicleId = params.id;

  if (!vehicleId) {
    return createApiError(
      'Vehicle ID is required',
      'MISSING_VEHICLE_ID',
      400,
      undefined,
      `/api/vehicles/${vehicleId}/maintenance`,
      'POST'
    );
  }

  let body: ScheduleMaintenanceRequest;
  
  try {
    body = await request.json() as ScheduleMaintenanceRequest;
  } catch (error) {
    return createApiError(
      'Invalid JSON in request body',
      'INVALID_JSON',
      400,
      undefined,
      `/api/vehicles/${vehicleId}/maintenance`,
      'POST'
    );
  }

  // Validate required fields
  const requiredFields = ['maintenanceType', 'priority', 'scheduledDate', 'description'];
  const validationErrors = validateRequiredFields(body, requiredFields);

  // Additional validation
  if (!['routine', 'minor', 'major', 'urgent', 'critical'].includes(body.priority)) {
    validationErrors.push({
      field: 'priority',
      message: 'Priority must be one of: routine, minor, major, urgent, critical',
      code: 'INVALID_PRIORITY',
    });
  }

  const scheduledDate = new Date(body.scheduledDate);
  if (isNaN(scheduledDate.getTime())) {
    validationErrors.push({
      field: 'scheduledDate',
      message: 'Invalid scheduled date',
      code: 'INVALID_DATE',
    });
  } else if (scheduledDate < new Date()) {
    validationErrors.push({
      field: 'scheduledDate',
      message: 'Scheduled date cannot be in the past',
      code: 'PAST_DATE',
    });
  }

  if (body.estimatedDurationHours && (body.estimatedDurationHours <= 0 || body.estimatedDurationHours > 24)) {
    validationErrors.push({
      field: 'estimatedDurationHours',
      message: 'Estimated duration must be between 0 and 24 hours',
      code: 'INVALID_DURATION',
    });
  }

  if (body.estimatedCost && body.estimatedCost < 0) {
    validationErrors.push({
      field: 'estimatedCost',
      message: 'Estimated cost cannot be negative',
      code: 'INVALID_COST',
    });
  }

  if (validationErrors.length > 0) {
    return createValidationError(validationErrors, `/api/vehicles/${vehicleId}/maintenance`, 'POST');
  }

  // Check for conflicting maintenance on the same date
  const existingMaintenance = VehicleMaintenanceService.getMaintenanceByVehicle(vehicleId)
    .find(m => 
      m.status === 'scheduled' && 
      m.scheduledDate.toDateString() === scheduledDate.toDateString()
    );

  if (existingMaintenance) {
    return createApiError(
      'Vehicle already has maintenance scheduled for this date',
      'CONFLICTING_MAINTENANCE_SCHEDULE',
      409,
      { existingMaintenanceId: existingMaintenance.id },
      `/api/vehicles/${vehicleId}/maintenance`,
      'POST'
    );
  }

  const newMaintenance = VehicleMaintenanceService.createMaintenance(vehicleId, body, user.id);

  // Audit maintenance scheduling
  await auditLogger.logEvent(
    AuditEventType.RESOURCE_CREATION,
    SecurityLevel.MEDIUM,
    'SUCCESS',
    { 
      resource: 'vehicle_maintenance',
      maintenanceId: newMaintenance.id,
      vehicleId,
      maintenanceType: newMaintenance.maintenanceType,
      priority: newMaintenance.priority,
      scheduledDate: newMaintenance.scheduledDate
    },
    { 
      userId: user.id,
      resource: 'maintenance',
      action: 'schedule',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
    }
  );

  return createVersionedResponse({ maintenance: newMaintenance }, 'v1');
});

// GET /api/vehicles/[id]/maintenance/summary - Get maintenance summary and analytics
const getMaintenanceSummaryV1 = withEnhancedAuth({
  requiredPermissions: ['view_vehicle_maintenance'],
  dataClass: 'internal'
})(async (request: NextRequest, user, { params }: { params: { id: string } }) => {
  const vehicleId = params.id;

  if (!vehicleId) {
    return createApiError(
      'Vehicle ID is required',
      'MISSING_VEHICLE_ID',
      400,
      undefined,
      `/api/vehicles/${vehicleId}/maintenance/summary`,
      'GET'
    );
  }

  const summary = VehicleMaintenanceService.getMaintenanceSummary(vehicleId);
  const alerts = VehicleMaintenanceService.getMaintenanceAlerts(vehicleId);

  return createVersionedResponse({
    summary,
    alerts,
    recommendations: {
      nextMaintenanceEstimate: summary.lastCompletedMaintenance ? 
        new Date(new Date(summary.lastCompletedMaintenance.completedDate!).getTime() + 90 * 24 * 60 * 60 * 1000) : 
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      budgetForecast: summary.averageCostPerService * 4, // Quarterly estimate
      priorityActions: alerts.filter(a => ['urgent', 'critical'].includes(a.urgencyLevel))
    }
  }, 'v1');
});

// GET /api/vehicles/[id]/maintenance/report - Generate maintenance report
const getMaintenanceReportV1 = withEnhancedAuth({
  requiredPermissions: ['view_vehicle_maintenance', 'generate_reports'],
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
      `/api/vehicles/${vehicleId}/maintenance/report`,
      'GET'
    );
  }

  // Parse date range (default to last 6 months)
  const dateTo = queryParams.dateTo ? new Date(queryParams.dateTo as string) : new Date();
  const dateFrom = queryParams.dateFrom ? 
    new Date(queryParams.dateFrom as string) : 
    new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000);

  if (isNaN(dateFrom.getTime()) || isNaN(dateTo.getTime())) {
    return createApiError(
      'Invalid date range',
      'INVALID_DATE_RANGE',
      400,
      undefined,
      `/api/vehicles/${vehicleId}/maintenance/report`,
      'GET'
    );
  }

  if (dateFrom >= dateTo) {
    return createApiError(
      'Start date must be before end date',
      'INVALID_DATE_RANGE',
      400,
      undefined,
      `/api/vehicles/${vehicleId}/maintenance/report`,
      'GET'
    );
  }

  const report = VehicleMaintenanceService.generateMaintenanceReport(vehicleId, dateFrom, dateTo);

  // Audit report generation
  await auditLogger.logEvent(
    AuditEventType.REPORT_GENERATION,
    SecurityLevel.LOW,
    'SUCCESS',
    { 
      reportType: 'maintenance_report',
      vehicleId,
      dateRange: { from: dateFrom, to: dateTo },
      recordCount: report.summary.totalRecords
    },
    { 
      userId: user.id,
      resource: 'maintenance',
      action: 'generate_report',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
    }
  );

  return createVersionedResponse({ report }, 'v1');
});

export const GET = versionedApiRoute({
  v1: async (request: NextRequest, context) => {
    const url = new URL(request.url);
    if (url.pathname.endsWith('/summary')) {
      return getMaintenanceSummaryV1(request, context);
    } else if (url.pathname.endsWith('/report')) {
      return getMaintenanceReportV1(request, context);
    }
    return getMaintenanceV1(request, context);
  }
});

export const POST = versionedApiRoute({
  v1: postMaintenanceV1
});

// OPTIONS handler for CORS
export const OPTIONS = handleOptionsRequest;