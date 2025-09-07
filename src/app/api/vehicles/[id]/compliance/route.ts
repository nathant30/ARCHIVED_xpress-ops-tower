// /api/vehicles/[id]/compliance - LTFRB Compliance Management API
// Philippines-specific regulatory compliance tracking and reporting

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
import { LTFRBComplianceCalendar, PhilippinesHolidayCalendar } from '@/lib/philippines-holidays';
import { 
  LTFRBCompliance,
  ComplianceAlert,
  ComplianceCheckRequest,
  ComplianceStatus 
} from '@/types/vehicles';

// Mock data service for compliance management
class VehicleComplianceService {
  private static complianceRecords: LTFRBCompliance[] = [
    {
      id: 'comp-001',
      vehicleId: 'veh-001',
      franchiseNumber: 'TNVS-MMD-2024-001',
      franchiseType: 'TNVS',
      franchiseRoute: 'Metro Manila Coverage',
      franchiseIssuedDate: new Date('2024-01-15'),
      franchiseExpiryDate: new Date('2025-01-15'),
      franchiseStatus: 'active',
      registrationNumber: 'ABC123-2024',
      registrationType: 'Commercial',
      registrationExpiryDate: new Date('2025-12-31'),
      orCrExpiryDate: new Date('2025-12-31'),
      lastInspectionDate: new Date('2024-06-15'),
      lastInspectionResult: 'passed',
      nextInspectionDueDate: new Date('2025-06-15'),
      inspectionCenter: 'DOTr Authorized Center - Makati',
      inspectionCertificateNumber: 'INS-2024-001',
      roadworthinessCertificate: 'RWC-2024-001',
      roadworthinessExpiry: new Date('2025-06-15'),
      emissionsTestResult: 'passed',
      emissionsTestDate: new Date('2024-06-15'),
      emissionsCertificateNumber: 'EMI-2024-001',
      compulsoryInsurancePolicy: 'CTPL-2024-001',
      compulsoryInsuranceExpiry: new Date('2025-03-31'),
      comprehensiveInsurancePolicy: 'COMP-2024-001',
      comprehensiveInsuranceExpiry: new Date('2025-08-15'),
      authorizedDrivers: ['driver-001'],
      driverAuthorizationExpiry: new Date('2025-01-15'),
      overallComplianceStatus: 'compliant',
      complianceScore: 95.5,
      activeViolations: [],
      violationHistory: [],
      penaltyPoints: 0,
      totalFinesPhp: 0,
      renewalReminderSent: false,
      autoRenewalEnabled: true,
      ltfrbOffice: 'LTFRB-NCR',
      ltoOffice: 'LTO-Makati',
      documents: {
        franchise: 'doc-franchise-001.pdf',
        registration: 'doc-registration-001.pdf',
        insurance: 'doc-insurance-001.pdf'
      },
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-12-01')
    }
  ];

  private static complianceAlerts: ComplianceAlert[] = [
    {
      id: 'comp-alert-001',
      vehicleId: 'veh-001',
      complianceId: 'comp-001',
      alertType: 'franchise_expiry_reminder',
      alertCategory: 'franchise',
      alertPriority: 'minor',
      alertTitle: 'Franchise Renewal Reminder',
      alertMessage: 'TNVS franchise for vehicle XOT-001 expires in 45 days. Start renewal process now.',
      recommendedAction: 'Submit franchise renewal application to LTFRB-NCR office',
      consequencesIfIgnored: 'Vehicle cannot operate legally after franchise expiry',
      daysUntilDue: 45,
      alertLevel: 1,
      escalationSchedule: [
        { days: 30, method: 'email' },
        { days: 14, method: 'sms' },
        { days: 7, method: 'call' }
      ],
      notifyDriver: true,
      notifyVehicleOwner: true,
      notifyFleetManager: false,
      notifyComplianceTeam: true,
      status: 'active',
      createdAt: new Date('2024-11-30'),
      sendCount: 1,
      lastSentAt: new Date('2024-11-30')
    }
  ];

  static getComplianceByVehicle(vehicleId: string): LTFRBCompliance | null {
    return this.complianceRecords.find(c => c.vehicleId === vehicleId) || null;
  }

  static getComplianceAlerts(vehicleId: string, status?: string): ComplianceAlert[] {
    let alerts = this.complianceAlerts.filter(a => a.vehicleId === vehicleId);
    
    if (status) {
      alerts = alerts.filter(a => a.status === status);
    }
    
    return alerts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  static updateCompliance(
    vehicleId: string, 
    updates: Partial<LTFRBCompliance>, 
    updatedBy: string
  ): LTFRBCompliance | null {
    const index = this.complianceRecords.findIndex(c => c.vehicleId === vehicleId);
    if (index === -1) return null;

    // Recalculate compliance score
    const updatedRecord = {
      ...this.complianceRecords[index],
      ...updates,
      updatedAt: new Date(),
      verifiedBy: updatedBy
    };

    updatedRecord.complianceScore = this.calculateComplianceScore(updatedRecord);
    updatedRecord.overallComplianceStatus = this.determineComplianceStatus(updatedRecord);

    this.complianceRecords[index] = updatedRecord;
    return updatedRecord;
  }

  static performComplianceCheck(vehicleId: string): {
    compliance: LTFRBCompliance | null;
    issues: Array<{ type: string; severity: string; description: string; daysUntilDue: number }>;
    score: number;
    status: ComplianceStatus;
  } {
    const compliance = this.getComplianceByVehicle(vehicleId);
    if (!compliance) {
      return {
        compliance: null,
        issues: [{ type: 'no_compliance_record', severity: 'critical', description: 'No compliance record found', daysUntilDue: 0 }],
        score: 0,
        status: 'non_compliant'
      };
    }

    const issues = [];
    const today = new Date();

    // Check franchise expiry (using business days calculation)
    const franchiseDays = LTFRBComplianceCalendar.getWorkingDaysUntilDeadline(compliance.franchiseExpiryDate);
    if (franchiseDays <= 0) {
      issues.push({ 
        type: 'franchise_expired', 
        severity: 'critical', 
        description: 'LTFRB franchise has expired',
        daysUntilDue: franchiseDays
      });
    } else if (franchiseDays <= 20) { // 20 business days = ~30 calendar days
      const renewalDeadline = LTFRBComplianceCalendar.calculateRenewalDeadline(compliance.franchiseExpiryDate, 30);
      const daysToRenewalDeadline = LTFRBComplianceCalendar.getWorkingDaysUntilDeadline(renewalDeadline);
      
      if (daysToRenewalDeadline <= 0) {
        issues.push({ 
          type: 'franchise_renewal_overdue', 
          severity: 'critical', 
          description: 'LTFRB franchise renewal deadline has passed',
          daysUntilDue: daysToRenewalDeadline
        });
      } else {
        issues.push({ 
          type: 'franchise_expiring', 
          severity: 'warning', 
          description: `LTFRB franchise expires in ${franchiseDays} working days (renewal deadline: ${daysToRenewalDeadline} working days)`,
          daysUntilDue: daysToRenewalDeadline
        });
      }
    }

    // Check registration expiry
    const registrationDays = Math.ceil((compliance.registrationExpiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (registrationDays <= 0) {
      issues.push({ 
        type: 'registration_expired', 
        severity: 'critical', 
        description: 'Vehicle registration has expired',
        daysUntilDue: registrationDays
      });
    } else if (registrationDays <= 30) {
      issues.push({ 
        type: 'registration_expiring', 
        severity: 'warning', 
        description: `Vehicle registration expires in ${registrationDays} days`,
        daysUntilDue: registrationDays
      });
    }

    // Check inspection due date (using business days and LTFRB hours)
    const inspectionDays = LTFRBComplianceCalendar.getWorkingDaysUntilDeadline(compliance.nextInspectionDueDate);
    if (inspectionDays <= 0) {
      issues.push({ 
        type: 'inspection_overdue', 
        severity: 'critical', 
        description: 'Vehicle inspection is overdue',
        daysUntilDue: inspectionDays
      });
    } else if (inspectionDays <= 10) { // 10 working days = ~14 calendar days
      const isLTFRBBusinessHours = LTFRBComplianceCalendar.isLTFRBBusinessHours();
      const warningMessage = isLTFRBBusinessHours 
        ? `Vehicle inspection due in ${inspectionDays} working days`
        : `Vehicle inspection due in ${inspectionDays} working days (LTFRB offices currently closed)`;
        
      issues.push({ 
        type: 'inspection_due', 
        severity: 'warning', 
        description: warningMessage,
        daysUntilDue: inspectionDays
      });
    }

    // Check insurance expiry
    const insuranceDays = Math.ceil((compliance.compulsoryInsuranceExpiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (insuranceDays <= 0) {
      issues.push({ 
        type: 'insurance_expired', 
        severity: 'critical', 
        description: 'Compulsory insurance has expired',
        daysUntilDue: insuranceDays
      });
    } else if (insuranceDays <= 30) {
      issues.push({ 
        type: 'insurance_expiring', 
        severity: 'warning', 
        description: `Compulsory insurance expires in ${insuranceDays} days`,
        daysUntilDue: insuranceDays
      });
    }

    const score = this.calculateComplianceScore(compliance);
    const status = this.determineComplianceStatus(compliance);

    return {
      compliance,
      issues,
      score,
      status
    };
  }

  private static calculateComplianceScore(compliance: LTFRBCompliance): number {
    let score = 100;
    const today = new Date();

    // Franchise status (25 points)
    if (compliance.franchiseStatus !== 'active') {
      score -= 25;
    } else if (compliance.franchiseExpiryDate <= today) {
      score -= 25;
    } else if (compliance.franchiseExpiryDate <= new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)) {
      score -= 10; // Expiring within 30 days
    }

    // Registration status (25 points)
    if (compliance.registrationExpiryDate <= today) {
      score -= 25;
    } else if (compliance.registrationExpiryDate <= new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)) {
      score -= 10;
    }

    // Inspection status (25 points)
    if (compliance.nextInspectionDueDate <= today) {
      score -= 25;
    } else if (compliance.nextInspectionDueDate <= new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000)) {
      score -= 10;
    }

    // Insurance status (25 points)
    if (compliance.compulsoryInsuranceExpiry <= today) {
      score -= 25;
    } else if (compliance.compulsoryInsuranceExpiry <= new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)) {
      score -= 10;
    }

    // Violations and penalties
    score -= compliance.penaltyPoints * 2;
    score -= Math.min(20, compliance.activeViolations.length * 5);

    return Math.max(0, Math.round(score * 10) / 10);
  }

  private static determineComplianceStatus(compliance: LTFRBCompliance): ComplianceStatus {
    const score = this.calculateComplianceScore(compliance);
    const today = new Date();

    // Critical non-compliance
    if (
      compliance.franchiseStatus !== 'active' ||
      compliance.franchiseExpiryDate <= today ||
      compliance.registrationExpiryDate <= today ||
      compliance.nextInspectionDueDate <= today ||
      compliance.compulsoryInsuranceExpiry <= today ||
      compliance.activeViolations.length > 0
    ) {
      return 'non_compliant';
    }

    // Warning status
    if (score < 90) {
      return 'warning';
    }

    // Suspended status
    if (compliance.franchiseStatus === 'suspended') {
      return 'suspended';
    }

    return 'compliant';
  }

  static generateComplianceReport(vehicleId: string) {
    const compliance = this.getComplianceByVehicle(vehicleId);
    const alerts = this.getComplianceAlerts(vehicleId);
    const complianceCheck = this.performComplianceCheck(vehicleId);

    if (!compliance) {
      return null;
    }

    const today = new Date();
    
    return {
      vehicleId,
      reportGeneratedAt: today,
      complianceScore: complianceCheck.score,
      overallStatus: complianceCheck.status,
      
      // Document status
      documents: {
        franchise: {
          number: compliance.franchiseNumber,
          type: compliance.franchiseType,
          status: compliance.franchiseStatus,
          issueDate: compliance.franchiseIssuedDate,
          expiryDate: compliance.franchiseExpiryDate,
          daysUntilExpiry: Math.ceil((compliance.franchiseExpiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        },
        registration: {
          number: compliance.registrationNumber,
          type: compliance.registrationType,
          expiryDate: compliance.registrationExpiryDate,
          orCrExpiry: compliance.orCrExpiryDate,
          daysUntilExpiry: Math.ceil((compliance.registrationExpiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        },
        inspection: {
          lastDate: compliance.lastInspectionDate,
          lastResult: compliance.lastInspectionResult,
          nextDue: compliance.nextInspectionDueDate,
          certificateNumber: compliance.inspectionCertificateNumber,
          center: compliance.inspectionCenter,
          daysUntilDue: Math.ceil((compliance.nextInspectionDueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        },
        insurance: {
          compulsory: {
            policy: compliance.compulsoryInsurancePolicy,
            expiry: compliance.compulsoryInsuranceExpiry,
            daysUntilExpiry: Math.ceil((compliance.compulsoryInsuranceExpiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          },
          comprehensive: {
            policy: compliance.comprehensiveInsurancePolicy,
            expiry: compliance.comprehensiveInsuranceExpiry,
            daysUntilExpiry: compliance.comprehensiveInsuranceExpiry ? 
              Math.ceil((compliance.comprehensiveInsuranceExpiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null
          }
        }
      },

      // Issues and alerts
      activeIssues: complianceCheck.issues,
      activeAlerts: alerts.filter(a => a.status === 'active'),
      
      // Compliance history
      violations: {
        active: compliance.activeViolations,
        history: compliance.violationHistory,
        penaltyPoints: compliance.penaltyPoints,
        totalFines: compliance.totalFinesPhp
      },

      // Recommendations
      recommendations: this.generateRecommendations(compliance, complianceCheck.issues),
      
      // Renewal schedule
      renewalSchedule: this.generateRenewalSchedule(compliance),

      // Upcoming holidays that might affect compliance processing
      upcomingHolidays: this.getUpcomingComplianceHolidays(),

      // Business day information
      businessDayInfo: {
        isCurrentlyLTFRBBusinessHours: LTFRBComplianceCalendar.isLTFRBBusinessHours(),
        nextBusinessDay: PhilippinesHolidayCalendar.getNextBusinessDay(new Date()),
        workingDaysRemainingThisMonth: PhilippinesHolidayCalendar.getBusinessDaysBetween(
          new Date(),
          new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
        )
      }
    };
  }

  private static generateRecommendations(
    compliance: LTFRBCompliance, 
    issues: Array<{ type: string; severity: string; description: string; daysUntilDue: number }>
  ): string[] {
    const recommendations = [];

    for (const issue of issues) {
      switch (issue.type) {
        case 'franchise_expired':
        case 'franchise_expiring':
          recommendations.push(`Contact ${compliance.ltfrbOffice} to process franchise renewal`);
          break;
        case 'registration_expired':
        case 'registration_expiring':
          recommendations.push(`Visit ${compliance.ltoOffice} for vehicle registration renewal`);
          break;
        case 'inspection_overdue':
        case 'inspection_due':
          recommendations.push(`Schedule inspection at ${compliance.inspectionCenter}`);
          break;
        case 'insurance_expired':
        case 'insurance_expiring':
          recommendations.push('Renew CTPL insurance policy immediately');
          break;
      }
    }

    if (compliance.complianceScore < 95) {
      recommendations.push('Review all compliance requirements to improve overall score');
    }

    return [...new Set(recommendations)]; // Remove duplicates
  }

  private static generateRenewalSchedule(compliance: LTFRBCompliance) {
    const today = new Date();
    const schedule = [];

    const renewalItems = [
      { name: 'Franchise', date: compliance.franchiseExpiryDate, type: 'franchise', requiresLTFRB: true },
      { name: 'Registration', date: compliance.registrationExpiryDate, type: 'registration', requiresLTFRB: false },
      { name: 'Inspection', date: compliance.nextInspectionDueDate, type: 'inspection', requiresLTFRB: true },
      { name: 'CTPL Insurance', date: compliance.compulsoryInsuranceExpiry, type: 'insurance', requiresLTFRB: false }
    ];

    if (compliance.comprehensiveInsuranceExpiry) {
      renewalItems.push({ 
        name: 'Comprehensive Insurance', 
        date: compliance.comprehensiveInsuranceExpiry, 
        type: 'insurance',
        requiresLTFRB: false
      });
    }

    for (const item of renewalItems) {
      const workingDaysUntilDue = item.requiresLTFRB 
        ? LTFRBComplianceCalendar.getWorkingDaysUntilDeadline(item.date)
        : PhilippinesHolidayCalendar.getBusinessDaysBetween(today, item.date);
        
      const calendarDaysUntilDue = Math.ceil((item.date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      // Calculate renewal deadline for LTFRB-related items
      let renewalDeadline = null;
      let workingDaysToRenewalDeadline = null;
      
      if (item.requiresLTFRB) {
        renewalDeadline = LTFRBComplianceCalendar.calculateRenewalDeadline(item.date, 30);
        workingDaysToRenewalDeadline = LTFRBComplianceCalendar.getWorkingDaysUntilDeadline(renewalDeadline);
      }
      
      const status = workingDaysUntilDue <= 0 ? 'overdue' : 
                    workingDaysUntilDue <= 20 ? 'due_soon' : 'current';
      
      schedule.push({
        item: item.name,
        type: item.type,
        dueDate: item.date,
        daysUntilDue: calendarDaysUntilDue,
        workingDaysUntilDue,
        renewalDeadline,
        workingDaysToRenewalDeadline,
        requiresLTFRBProcessing: item.requiresLTFRB,
        status,
        priority: status === 'overdue' ? 'critical' : status === 'due_soon' ? 'high' : 'normal'
      });
    }

    return schedule.sort((a, b) => (a.workingDaysToRenewalDeadline || a.workingDaysUntilDue) - (b.workingDaysToRenewalDeadline || b.workingDaysUntilDue));
  }

  // Add method to get upcoming holidays that might affect compliance processing
  private static getUpcomingComplianceHolidays() {
    return LTFRBComplianceCalendar.getUpcomingLTFRBOperationalHolidays(90);
  }
}

// GET /api/vehicles/[id]/compliance - Get compliance status and requirements
const getComplianceV1 = withEnhancedAuth({
  requiredPermissions: ['view_vehicle_compliance'],
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
      `/api/vehicles/${vehicleId}/compliance`,
      'GET'
    );
  }

  const compliance = VehicleComplianceService.getComplianceByVehicle(vehicleId);
  if (!compliance) {
    return createNotFoundError(
      'Compliance record',
      `/api/vehicles/${vehicleId}/compliance`,
      'GET'
    );
  }

  const complianceCheck = VehicleComplianceService.performComplianceCheck(vehicleId);
  const alerts = VehicleComplianceService.getComplianceAlerts(vehicleId);

  const response: any = {
    compliance,
    complianceCheck,
    activeAlerts: alerts.filter(a => a.status === 'active')
  };

  // Include detailed report if requested
  if (queryParams.includeReport) {
    response.detailedReport = VehicleComplianceService.generateComplianceReport(vehicleId);
  }

  return createVersionedResponse(response, 'v1');
});

// POST /api/vehicles/[id]/compliance/check - Perform compliance check
const postComplianceCheckV1 = withEnhancedAuth({
  requiredPermissions: ['check_vehicle_compliance'],
  dataClass: 'internal'
})(async (request: NextRequest, user, { params }: { params: { id: string } }) => {
  const vehicleId = params.id;

  if (!vehicleId) {
    return createApiError(
      'Vehicle ID is required',
      'MISSING_VEHICLE_ID',
      400,
      undefined,
      `/api/vehicles/${vehicleId}/compliance/check`,
      'POST'
    );
  }

  let body: ComplianceCheckRequest = { vehicleId };
  
  try {
    const requestBody = await request.json();
    body = { ...body, ...requestBody };
  } catch (error) {
    // Use default values if no body provided
  }

  // Perform comprehensive compliance check
  const complianceCheck = VehicleComplianceService.performComplianceCheck(vehicleId);
  const alerts = VehicleComplianceService.getComplianceAlerts(vehicleId, 'active');

  // Generate report if requested
  let report = null;
  if (body.generateReport) {
    report = VehicleComplianceService.generateComplianceReport(vehicleId);
  }

  // Audit compliance check
  await auditLogger.logEvent(
    AuditEventType.COMPLIANCE_CHECK,
    SecurityLevel.MEDIUM,
    'SUCCESS',
    { 
      vehicleId,
      complianceScore: complianceCheck.score,
      complianceStatus: complianceCheck.status,
      issuesFound: complianceCheck.issues.length,
      checkTypes: body.checkTypes || ['all']
    },
    { 
      userId: user.id,
      resource: 'compliance',
      action: 'check',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
    }
  );

  const response: any = {
    checkPerformedAt: new Date(),
    complianceCheck,
    activeAlerts: alerts,
    summary: {
      overallScore: complianceCheck.score,
      status: complianceCheck.status,
      totalIssues: complianceCheck.issues.length,
      criticalIssues: complianceCheck.issues.filter(i => i.severity === 'critical').length,
      warningIssues: complianceCheck.issues.filter(i => i.severity === 'warning').length
    }
  };

  if (report) {
    response.detailedReport = report;
  }

  return createVersionedResponse(response, 'v1');
});

// PUT /api/vehicles/[id]/compliance - Update compliance information
const putComplianceV1 = withEnhancedAuth({
  requiredPermissions: ['update_vehicle_compliance', 'manage_fleet'],
  dataClass: 'internal'
})(async (request: NextRequest, user, { params }: { params: { id: string } }) => {
  const vehicleId = params.id;

  if (!vehicleId) {
    return createApiError(
      'Vehicle ID is required',
      'MISSING_VEHICLE_ID',
      400,
      undefined,
      `/api/vehicles/${vehicleId}/compliance`,
      'PUT'
    );
  }

  let body: Partial<LTFRBCompliance>;
  
  try {
    body = await request.json() as Partial<LTFRBCompliance>;
  } catch (error) {
    return createApiError(
      'Invalid JSON in request body',
      'INVALID_JSON',
      400,
      undefined,
      `/api/vehicles/${vehicleId}/compliance`,
      'PUT'
    );
  }

  // Validate dates
  const validationErrors = [];
  const dateFields = [
    'franchiseExpiryDate', 'registrationExpiryDate', 'orCrExpiryDate',
    'nextInspectionDueDate', 'compulsoryInsuranceExpiry', 'comprehensiveInsuranceExpiry'
  ];

  for (const field of dateFields) {
    const value = body[field as keyof typeof body];
    if (value && !(value instanceof Date) && isNaN(new Date(value as string).getTime())) {
      validationErrors.push({
        field,
        message: `Invalid date format for ${field}`,
        code: 'INVALID_DATE'
      });
    }
  }

  if (validationErrors.length > 0) {
    return createValidationError(validationErrors, `/api/vehicles/${vehicleId}/compliance`, 'PUT');
  }

  const updatedCompliance = VehicleComplianceService.updateCompliance(vehicleId, body, user.id);

  if (!updatedCompliance) {
    return createNotFoundError(
      'Compliance record',
      `/api/vehicles/${vehicleId}/compliance`,
      'PUT'
    );
  }

  // Audit compliance update
  await auditLogger.logEvent(
    AuditEventType.RESOURCE_MODIFICATION,
    SecurityLevel.MEDIUM,
    'SUCCESS',
    { 
      resource: 'vehicle_compliance',
      vehicleId,
      changes: Object.keys(body),
      newComplianceScore: updatedCompliance.complianceScore,
      newStatus: updatedCompliance.overallComplianceStatus
    },
    { 
      userId: user.id,
      resource: 'compliance',
      action: 'update',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
    }
  );

  return createVersionedResponse({
    compliance: updatedCompliance,
    complianceCheck: VehicleComplianceService.performComplianceCheck(vehicleId)
  }, 'v1');
});

// GET /api/vehicles/[id]/compliance/report - Generate detailed compliance report
const getComplianceReportV1 = withEnhancedAuth({
  requiredPermissions: ['view_vehicle_compliance', 'generate_reports'],
  dataClass: 'internal'
})(async (request: NextRequest, user, { params }: { params: { id: string } }) => {
  const vehicleId = params.id;

  if (!vehicleId) {
    return createApiError(
      'Vehicle ID is required',
      'MISSING_VEHICLE_ID',
      400,
      undefined,
      `/api/vehicles/${vehicleId}/compliance/report`,
      'GET'
    );
  }

  const report = VehicleComplianceService.generateComplianceReport(vehicleId);
  
  if (!report) {
    return createNotFoundError(
      'Compliance record',
      `/api/vehicles/${vehicleId}/compliance/report`,
      'GET'
    );
  }

  // Audit report generation
  await auditLogger.logEvent(
    AuditEventType.REPORT_GENERATION,
    SecurityLevel.LOW,
    'SUCCESS',
    { 
      reportType: 'compliance_report',
      vehicleId,
      complianceScore: report.complianceScore,
      activeIssues: report.activeIssues.length
    },
    { 
      userId: user.id,
      resource: 'compliance',
      action: 'generate_report',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
    }
  );

  return createVersionedResponse({ report }, 'v1');
});

export const GET = versionedApiRoute({
  v1: async (request: NextRequest, context) => {
    const url = new URL(request.url);
    if (url.pathname.endsWith('/report')) {
      return getComplianceReportV1(request, context);
    }
    return getComplianceV1(request, context);
  }
});

export const POST = versionedApiRoute({
  v1: postComplianceCheckV1
});

export const PUT = versionedApiRoute({
  v1: putComplianceV1
});

// OPTIONS handler for CORS
export const OPTIONS = handleOptionsRequest;