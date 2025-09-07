/**
 * LTO (Land Transportation Office) Compliance Tracking System
 * 
 * Comprehensive system for LTO compliance management:
 * - Vehicle registration (OR/CR) tracking
 * - Driver's license validation and monitoring
 * - TNVS authorization management
 * - Vehicle inspection scheduling
 * - Emissions testing compliance
 * - Medical certificate tracking
 * - Drug test monitoring
 * - Violation management and reporting
 * - Automated renewal notifications
 */

import {
  LTORegistration,
  DriverLicenseCompliance,
  LTOViolation,
  LTOComplianceStatus,
  PhilippinesRegion,
  ComplianceAlert,
  ComplianceAlertPriority,
  ComplianceMonitoringRule,
  COMPLIANCE_CONSTANTS
} from '../../types/philippines-compliance';

import { Vehicle } from '../../types/vehicles';

// =====================================================
// LTO COMPLIANCE SERVICE
// =====================================================

export class LTOComplianceService {
  private registrationCache = new Map<string, LTORegistration>();
  private licenseCache = new Map<string, DriverLicenseCompliance>();
  private violationCache = new Map<string, LTOViolation[]>();
  private monitoringRules: ComplianceMonitoringRule[] = [];

  constructor() {
    this.initializeMonitoringRules();
    this.startComplianceMonitoring();
  }

  // =====================================================
  // VEHICLE REGISTRATION MANAGEMENT
  // =====================================================

  async createVehicleRegistration(registrationData: Partial<LTORegistration>): Promise<LTORegistration> {
    const registration: LTORegistration = {
      id: this.generateId(),
      vehicleId: registrationData.vehicleId!,
      orNumber: registrationData.orNumber!,
      crNumber: registrationData.crNumber!,
      plateNumber: registrationData.plateNumber!,
      registrationDate: registrationData.registrationDate || new Date(),
      expiryDate: registrationData.expiryDate || this.calculateRegistrationExpiry(new Date()),
      status: 'compliant',
      vehicleType: registrationData.vehicleType || 'Private Car',
      bodyType: registrationData.bodyType || 'Sedan',
      fuelType: registrationData.fuelType || 'Gasoline',
      engineNumber: registrationData.engineNumber!,
      chassisNumber: registrationData.chassisNumber!,
      pistonDisplacement: registrationData.pistonDisplacement!,
      grossWeight: registrationData.grossWeight || 1500,
      netWeight: registrationData.netWeight || 1200,
      registeredOwnerName: registrationData.registeredOwnerName!,
      registeredOwnerAddress: registrationData.registeredOwnerAddress!,
      registeredOwnerTIN: registrationData.registeredOwnerTIN,
      registeredLTOOffice: registrationData.registeredLTOOffice!,
      regionCode: registrationData.regionCode || 'NCR',
      renewalFee: this.calculateRegistrationRenewalFee(registrationData.vehicleType || 'Private Car'),
      renewalNotificationSent: false,
      lastInspectionDate: registrationData.lastInspectionDate,
      nextInspectionDue: registrationData.nextInspectionDue || this.calculateNextInspectionDate(),
      inspectionCenter: registrationData.inspectionCenter,
      inspectionCertificate: registrationData.inspectionCertificate,
      emissionsTestResult: registrationData.emissionsTestResult,
      emissionsTestDate: registrationData.emissionsTestDate,
      emissionsCertificate: registrationData.emissionsCertificate,
      orCopyUrl: registrationData.orCopyUrl,
      crCopyUrl: registrationData.crCopyUrl,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    };

    // Store in cache and database
    this.registrationCache.set(registration.vehicleId, registration);
    await this.saveRegistration(registration);

    // Schedule compliance monitoring
    await this.scheduleRegistrationCheck(registration);

    return registration;
  }

  async getVehicleRegistration(vehicleId: string): Promise<LTORegistration | null> {
    // Check cache first
    if (this.registrationCache.has(vehicleId)) {
      return this.registrationCache.get(vehicleId)!;
    }

    // Load from database
    const registration = await this.loadRegistrationFromDatabase(vehicleId);
    if (registration) {
      this.registrationCache.set(vehicleId, registration);
    }

    return registration;
  }

  async updateRegistrationStatus(
    vehicleId: string,
    status: LTOComplianceStatus,
    reason?: string
  ): Promise<LTORegistration> {
    const registration = await this.getVehicleRegistration(vehicleId);
    if (!registration) {
      throw new Error(`Registration not found for vehicle ${vehicleId}`);
    }

    const previousStatus = registration.status;
    registration.status = status;
    registration.updatedAt = new Date();

    // Handle status changes
    await this.handleRegistrationStatusChange(registration, previousStatus, status, reason);

    // Update cache and database
    this.registrationCache.set(vehicleId, registration);
    await this.saveRegistration(registration);

    return registration;
  }

  async renewVehicleRegistration(vehicleId: string): Promise<LTORegistration> {
    const registration = await this.getVehicleRegistration(vehicleId);
    if (!registration) {
      throw new Error(`Registration not found for vehicle ${vehicleId}`);
    }

    // Check renewal eligibility
    const renewalCheck = await this.checkRegistrationRenewalEligibility(registration);
    if (!renewalCheck.eligible) {
      throw new Error(`Registration renewal not allowed: ${renewalCheck.reason}`);
    }

    // Update registration with new expiry date
    registration.expiryDate = this.calculateRegistrationExpiry(registration.expiryDate);
    registration.lastRenewalDate = new Date();
    registration.status = 'compliant';
    registration.renewalNotificationSent = false;
    registration.updatedAt = new Date();

    // Update cache and database
    this.registrationCache.set(vehicleId, registration);
    await this.saveRegistration(registration);

    // Log renewal event
    await this.logComplianceEvent('registration_renewed', {
      vehicleId,
      orNumber: registration.orNumber,
      newExpiryDate: registration.expiryDate,
    });

    return registration;
  }

  // =====================================================
  // DRIVER LICENSE MANAGEMENT
  // =====================================================

  async createDriverLicenseRecord(licenseData: Partial<DriverLicenseCompliance>): Promise<DriverLicenseCompliance> {
    const license: DriverLicenseCompliance = {
      id: this.generateId(),
      driverId: licenseData.driverId!,
      licenseNumber: licenseData.licenseNumber!,
      licenseType: licenseData.licenseType || 'Professional',
      restrictions: licenseData.restrictions || [],
      conditions: licenseData.conditions || [],
      issuedDate: licenseData.issuedDate || new Date(),
      expiryDate: licenseData.expiryDate || this.calculateLicenseExpiry(new Date()),
      status: 'compliant',
      tnvsAuthorizationNumber: licenseData.tnvsAuthorizationNumber,
      tnvsAuthorizationExpiry: licenseData.tnvsAuthorizationExpiry,
      tnvsTrainingCertificate: licenseData.tnvsTrainingCertificate,
      medicalCertificateNumber: licenseData.medicalCertificateNumber,
      medicalCertificateExpiry: licenseData.medicalCertificateExpiry,
      medicalRestrictions: licenseData.medicalRestrictions || [],
      drugTestResult: licenseData.drugTestResult,
      drugTestDate: licenseData.drugTestDate,
      drugTestCertificate: licenseData.drugTestCertificate,
      violationHistory: [],
      totalViolationPoints: 0,
      renewalNotificationSent: false,
      renewalFee: this.calculateLicenseRenewalFee(licenseData.licenseType || 'Professional'),
      licenseCopyUrl: licenseData.licenseCopyUrl,
      tnvsIdUrl: licenseData.tnvsIdUrl,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    };

    // Store in cache and database
    this.licenseCache.set(license.driverId, license);
    await this.saveLicense(license);

    // Schedule compliance monitoring
    await this.scheduleLicenseCheck(license);

    return license;
  }

  async getDriverLicense(driverId: string): Promise<DriverLicenseCompliance | null> {
    // Check cache first
    if (this.licenseCache.has(driverId)) {
      return this.licenseCache.get(driverId)!;
    }

    // Load from database
    const license = await this.loadLicenseFromDatabase(driverId);
    if (license) {
      this.licenseCache.set(driverId, license);
    }

    return license;
  }

  async updateLicenseStatus(
    driverId: string,
    status: LTOComplianceStatus,
    reason?: string
  ): Promise<DriverLicenseCompliance> {
    const license = await this.getDriverLicense(driverId);
    if (!license) {
      throw new Error(`License not found for driver ${driverId}`);
    }

    const previousStatus = license.status;
    license.status = status;
    license.updatedAt = new Date();

    // Handle status changes
    await this.handleLicenseStatusChange(license, previousStatus, status, reason);

    // Update cache and database
    this.licenseCache.set(driverId, license);
    await this.saveLicense(license);

    return license;
  }

  async renewDriverLicense(driverId: string): Promise<DriverLicenseCompliance> {
    const license = await this.getDriverLicense(driverId);
    if (!license) {
      throw new Error(`License not found for driver ${driverId}`);
    }

    // Check renewal eligibility
    const renewalCheck = await this.checkLicenseRenewalEligibility(license);
    if (!renewalCheck.eligible) {
      throw new Error(`License renewal not allowed: ${renewalCheck.reason}`);
    }

    // Update license with new expiry date
    license.expiryDate = this.calculateLicenseExpiry(license.expiryDate);
    license.status = 'compliant';
    license.renewalNotificationSent = false;
    license.updatedAt = new Date();

    // Reset violation points if applicable
    if (license.totalViolationPoints < 10) {
      license.totalViolationPoints = Math.max(0, license.totalViolationPoints - 2);
    }

    // Update cache and database
    this.licenseCache.set(driverId, license);
    await this.saveLicense(license);

    // Log renewal event
    await this.logComplianceEvent('license_renewed', {
      driverId,
      licenseNumber: license.licenseNumber,
      newExpiryDate: license.expiryDate,
    });

    return license;
  }

  // =====================================================
  // VIOLATION MANAGEMENT
  // =====================================================

  async recordLTOViolation(violationData: Partial<LTOViolation>): Promise<LTOViolation> {
    const violation: LTOViolation = {
      id: this.generateId(),
      driverId: violationData.driverId,
      vehicleId: violationData.vehicleId,
      violationCode: violationData.violationCode!,
      violationType: violationData.violationType!,
      description: violationData.description!,
      violationDate: violationData.violationDate || new Date(),
      location: violationData.location!,
      ticketNumber: violationData.ticketNumber!,
      enforcingOfficer: violationData.enforcingOfficer!,
      fineAmount: violationData.fineAmount || this.calculateLTOFineAmount(violationData.violationType!),
      penaltyPoints: violationData.penaltyPoints || this.calculateLTOPenaltyPoints(violationData.violationType!),
      status: 'unpaid',
      dueDate: violationData.dueDate || this.calculateViolationDueDate(),
      affectsLicenseRenewal: this.determineRenewalImpact(violationData.violationType!),
      requiresCourtAppearance: this.requiresCourtAppearance(violationData.violationType!),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Store violation
    await this.saveViolation(violation);

    // Update driver license with violation
    if (violation.driverId) {
      const license = await this.getDriverLicense(violation.driverId);
      if (license) {
        license.violationHistory.push(violation);
        license.totalViolationPoints += violation.penaltyPoints;
        license.updatedAt = new Date();

        // Check if license should be suspended
        if (license.totalViolationPoints >= 10) {
          license.status = 'suspended';
          await this.createLicenseSuspensionAlert(license, violation);
        }

        await this.saveLicense(license);
      }
    }

    // Create compliance alert
    await this.createViolationAlert(violation);

    return violation;
  }

  async updateViolationStatus(
    violationId: string,
    status: LTOViolation['status'],
    paymentDetails?: any
  ): Promise<LTOViolation> {
    const violation = await this.loadViolationById(violationId);
    if (!violation) {
      throw new Error(`Violation not found: ${violationId}`);
    }

    violation.status = status;
    violation.updatedAt = new Date();

    if (status === 'paid') {
      violation.paidDate = new Date();
    }

    await this.saveViolation(violation);

    // Update driver license violation history
    if (violation.driverId) {
      const license = await this.getDriverLicense(violation.driverId);
      if (license) {
        const violationIndex = license.violationHistory.findIndex(v => v.id === violationId);
        if (violationIndex !== -1) {
          license.violationHistory[violationIndex] = violation;
          license.updatedAt = new Date();
          await this.saveLicense(license);
        }
      }
    }

    return violation;
  }

  // =====================================================
  // VEHICLE INSPECTION MANAGEMENT
  // =====================================================

  async scheduleVehicleInspection(
    vehicleId: string,
    inspectionDate: Date,
    inspectionCenter: string
  ): Promise<void> {
    const registration = await this.getVehicleRegistration(vehicleId);
    if (!registration) {
      throw new Error(`Registration not found for vehicle ${vehicleId}`);
    }

    // Update inspection schedule
    registration.nextInspectionDue = inspectionDate;
    registration.inspectionCenter = inspectionCenter;
    registration.updatedAt = new Date();

    await this.saveRegistration(registration);

    // Create inspection reminder
    await this.createInspectionReminder(registration, inspectionDate);

    // Log scheduling event
    await this.logComplianceEvent('inspection_scheduled', {
      vehicleId,
      inspectionDate,
      inspectionCenter,
    });
  }

  async recordInspectionResult(
    vehicleId: string,
    inspectionDate: Date,
    result: 'passed' | 'failed',
    certificateNumber?: string,
    issues?: string[]
  ): Promise<void> {
    const registration = await this.getVehicleRegistration(vehicleId);
    if (!registration) {
      throw new Error(`Registration not found for vehicle ${vehicleId}`);
    }

    // Update inspection record
    registration.lastInspectionDate = inspectionDate;
    registration.inspectionCertificate = certificateNumber;
    registration.nextInspectionDue = this.calculateNextInspectionDate(inspectionDate);
    registration.updatedAt = new Date();

    if (result === 'failed') {
      registration.status = 'pending_renewal';
      await this.createInspectionFailureAlert(registration, issues || []);
    }

    await this.saveRegistration(registration);

    // Log inspection result
    await this.logComplianceEvent('inspection_completed', {
      vehicleId,
      result,
      certificateNumber,
      issues,
    });
  }

  // =====================================================
  // EMISSIONS TESTING
  // =====================================================

  async recordEmissionsTest(
    vehicleId: string,
    testDate: Date,
    result: 'pass' | 'fail',
    certificateNumber?: string,
    emissionLevels?: Record<string, number>
  ): Promise<void> {
    const registration = await this.getVehicleRegistration(vehicleId);
    if (!registration) {
      throw new Error(`Registration not found for vehicle ${vehicleId}`);
    }

    // Update emissions record
    registration.emissionsTestResult = result;
    registration.emissionsTestDate = testDate;
    registration.emissionsCertificate = certificateNumber;
    registration.updatedAt = new Date();

    if (result === 'fail') {
      registration.status = 'pending_renewal';
      await this.createEmissionsFailureAlert(registration);
    }

    await this.saveRegistration(registration);

    // Log emissions test
    await this.logComplianceEvent('emissions_test_completed', {
      vehicleId,
      result,
      certificateNumber,
      emissionLevels,
    });
  }

  // =====================================================
  // MEDICAL CERTIFICATE MANAGEMENT
  // =====================================================

  async updateMedicalCertificate(
    driverId: string,
    certificateNumber: string,
    expiryDate: Date,
    restrictions?: string[]
  ): Promise<void> {
    const license = await this.getDriverLicense(driverId);
    if (!license) {
      throw new Error(`License not found for driver ${driverId}`);
    }

    license.medicalCertificateNumber = certificateNumber;
    license.medicalCertificateExpiry = expiryDate;
    license.medicalRestrictions = restrictions || [];
    license.updatedAt = new Date();

    await this.saveLicense(license);

    // Schedule expiry notification
    await this.scheduleMedicalCertificateExpiry(license);

    // Log update
    await this.logComplianceEvent('medical_certificate_updated', {
      driverId,
      certificateNumber,
      expiryDate,
    });
  }

  async recordDrugTest(
    driverId: string,
    testDate: Date,
    result: 'negative' | 'positive',
    certificateNumber?: string
  ): Promise<void> {
    const license = await this.getDriverLicense(driverId);
    if (!license) {
      throw new Error(`License not found for driver ${driverId}`);
    }

    license.drugTestResult = result;
    license.drugTestDate = testDate;
    license.drugTestCertificate = certificateNumber;
    license.updatedAt = new Date();

    if (result === 'positive') {
      license.status = 'suspended';
      await this.createDrugTestFailureAlert(license);
    }

    await this.saveLicense(license);

    // Log drug test
    await this.logComplianceEvent('drug_test_completed', {
      driverId,
      result,
      certificateNumber,
    });
  }

  // =====================================================
  // COMPLIANCE MONITORING
  // =====================================================

  private initializeMonitoringRules(): void {
    this.monitoringRules = [
      {
        id: 'lto-registration-expiry',
        name: 'LTO Registration Expiry Monitoring',
        description: 'Monitor vehicle registration expiry dates',
        complianceType: 'lto',
        triggerCondition: 'expiry_approaching',
        checkFrequency: 'daily',
        advanceNotificationDays: COMPLIANCE_CONSTANTS.LTO.RENEWAL_ADVANCE_DAYS,
        applicableRegions: ['ncr', 'calabarzon', 'central_visayas', 'davao', 'northern_mindanao'],
        applicableOwnershipTypes: ['xpress_owned', 'fleet_owned', 'operator_owned', 'driver_owned'],
        applicableServiceTypes: ['premium', 'standard', 'economy'],
        automaticNotifications: true,
        escalationLevels: [
          {
            level: 1,
            daysFromExpiry: 60,
            actions: [
              { type: 'email_notification', configuration: { template: 'registration_expiry_60_days' }, isActive: true }
            ],
            recipients: ['vehicle_owner', 'compliance_team']
          },
          {
            level: 2,
            daysFromExpiry: 30,
            actions: [
              { type: 'email_notification', configuration: { template: 'registration_expiry_30_days' }, isActive: true },
              { type: 'sms_alert', configuration: { template: 'registration_expiry_sms' }, isActive: true }
            ],
            recipients: ['vehicle_owner', 'driver', 'compliance_team']
          },
          {
            level: 3,
            daysFromExpiry: 7,
            actions: [
              { type: 'email_notification', configuration: { template: 'registration_expiry_critical' }, isActive: true },
              { type: 'in_app_notification', configuration: { priority: 'critical' }, isActive: true }
            ],
            recipients: ['vehicle_owner', 'driver', 'compliance_team', 'operations_manager']
          }
        ],
        warningThreshold: 60,
        criticalThreshold: 7,
        governmentAPIIntegration: true,
        thirdPartyValidation: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        nextRunDate: new Date(),
      },
      {
        id: 'lto-license-expiry',
        name: 'Driver License Expiry Monitoring',
        description: 'Monitor driver license expiry dates and TNVS authorization',
        complianceType: 'lto',
        triggerCondition: 'expiry_approaching',
        checkFrequency: 'daily',
        advanceNotificationDays: COMPLIANCE_CONSTANTS.LTO.RENEWAL_ADVANCE_DAYS,
        applicableRegions: ['ncr', 'calabarzon', 'central_visayas', 'davao', 'northern_mindanao'],
        applicableOwnershipTypes: ['xpress_owned', 'fleet_owned', 'operator_owned', 'driver_owned'],
        applicableServiceTypes: ['premium', 'standard', 'economy'],
        automaticNotifications: true,
        escalationLevels: [
          {
            level: 1,
            daysFromExpiry: 30,
            actions: [
              { type: 'email_notification', configuration: { template: 'license_expiry_30_days' }, isActive: true }
            ],
            recipients: ['driver', 'compliance_team']
          },
          {
            level: 2,
            daysFromExpiry: 14,
            actions: [
              { type: 'email_notification', configuration: { template: 'license_expiry_14_days' }, isActive: true },
              { type: 'sms_alert', configuration: { template: 'license_expiry_sms' }, isActive: true }
            ],
            recipients: ['driver', 'compliance_team', 'operations_manager']
          },
          {
            level: 3,
            daysFromExpiry: -1, // 1 day past expiry
            actions: [
              { type: 'suspend_driver', configuration: { reason: 'license_expired' }, isActive: true },
              { type: 'email_notification', configuration: { template: 'license_expired' }, isActive: true }
            ],
            recipients: ['driver', 'compliance_team', 'operations_manager']
          }
        ],
        warningThreshold: 30,
        criticalThreshold: 7,
        governmentAPIIntegration: true,
        thirdPartyValidation: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        nextRunDate: new Date(),
      }
    ];
  }

  private async startComplianceMonitoring(): Promise<void> {
    // Run monitoring every hour
    setInterval(async () => {
      for (const rule of this.monitoringRules) {
        if (rule.isActive && this.shouldRunRule(rule)) {
          await this.executeMonitoringRule(rule);
          rule.lastRunDate = new Date();
          rule.nextRunDate = this.calculateNextRunDate(rule);
        }
      }
    }, 60 * 60 * 1000); // 1 hour

    // Initial run
    setTimeout(() => this.runAllMonitoringRules(), 10000);
  }

  private async executeMonitoringRule(rule: ComplianceMonitoringRule): Promise<void> {
    try {
      console.log(`Executing LTO monitoring rule: ${rule.name}`);

      if (rule.complianceType === 'lto' && rule.name.includes('Registration')) {
        await this.executeRegistrationMonitoringRule(rule);
      } else if (rule.complianceType === 'lto' && rule.name.includes('License')) {
        await this.executeLicenseMonitoringRule(rule);
      }

      console.log(`Completed LTO monitoring rule: ${rule.name}`);
    } catch (error) {
      console.error(`Error executing LTO monitoring rule ${rule.name}:`, error);
      await this.logComplianceEvent('monitoring_error', {
        ruleName: rule.name,
        error: error.message,
      });
    }
  }

  private async executeRegistrationMonitoringRule(rule: ComplianceMonitoringRule): Promise<void> {
    const registrations = await this.getRegistrationsForRule(rule);

    for (const registration of registrations) {
      const daysUntilExpiry = this.calculateDaysUntilExpiry(registration.expiryDate);
      
      for (const escalationLevel of rule.escalationLevels) {
        if (this.shouldTriggerEscalationLevel(daysUntilExpiry, escalationLevel)) {
          await this.executeEscalationActions(registration, escalationLevel, 'registration');
        }
      }

      // Update status based on expiry
      const newStatus = this.determineComplianceStatus(daysUntilExpiry);
      if (newStatus !== registration.status) {
        await this.updateRegistrationStatus(registration.vehicleId, newStatus, `Status updated by monitoring rule: ${rule.name}`);
      }
    }
  }

  private async executeLicenseMonitoringRule(rule: ComplianceMonitoringRule): Promise<void> {
    const licenses = await this.getLicensesForRule(rule);

    for (const license of licenses) {
      const daysUntilExpiry = this.calculateDaysUntilExpiry(license.expiryDate);
      
      for (const escalationLevel of rule.escalationLevels) {
        if (this.shouldTriggerEscalationLevel(daysUntilExpiry, escalationLevel)) {
          await this.executeEscalationActions(license, escalationLevel, 'license');
        }
      }

      // Update status based on expiry
      const newStatus = this.determineComplianceStatus(daysUntilExpiry);
      if (newStatus !== license.status) {
        await this.updateLicenseStatus(license.driverId, newStatus, `Status updated by monitoring rule: ${rule.name}`);
      }
    }
  }

  // =====================================================
  // REAL-TIME COMPLIANCE CHECKING
  // =====================================================

  async performComprehensiveComplianceCheck(vehicleId: string, driverId?: string): Promise<{
    vehicleCompliance: ComplianceCheckResult;
    driverCompliance?: ComplianceCheckResult;
    overallCompliant: boolean;
    criticalIssues: ComplianceIssue[];
    recommendations: string[];
  }> {
    // Check vehicle registration compliance
    const vehicleCompliance = await this.checkVehicleCompliance(vehicleId);
    
    // Check driver license compliance if driver provided
    let driverCompliance: ComplianceCheckResult | undefined;
    if (driverId) {
      driverCompliance = await this.checkDriverCompliance(driverId);
    }

    // Determine overall compliance
    const overallCompliant = vehicleCompliance.compliant && (driverCompliance?.compliant ?? true);
    
    // Collect all critical issues
    const criticalIssues = [
      ...vehicleCompliance.issues.filter(i => i.severity === 'critical'),
      ...(driverCompliance?.issues.filter(i => i.severity === 'critical') ?? [])
    ];

    // Generate recommendations
    const recommendations = [
      ...vehicleCompliance.recommendations,
      ...(driverCompliance?.recommendations ?? [])
    ];

    return {
      vehicleCompliance,
      driverCompliance,
      overallCompliant,
      criticalIssues,
      recommendations: [...new Set(recommendations)] // Remove duplicates
    };
  }

  private async checkVehicleCompliance(vehicleId: string): Promise<ComplianceCheckResult> {
    const registration = await this.getVehicleRegistration(vehicleId);
    const issues: ComplianceIssue[] = [];
    const recommendations: string[] = [];

    if (!registration) {
      issues.push({
        type: 'missing_registration',
        severity: 'critical',
        description: 'No LTO registration found for this vehicle',
        resolution: 'Register vehicle with LTO immediately'
      });
      return { compliant: false, issues, recommendations };
    }

    // Check registration validity
    const daysUntilExpiry = this.calculateDaysUntilExpiry(registration.expiryDate);
    
    if (daysUntilExpiry < 0) {
      issues.push({
        type: 'registration_expired',
        severity: 'critical',
        description: `Vehicle registration expired ${Math.abs(daysUntilExpiry)} days ago`,
        resolution: 'Renew vehicle registration immediately'
      });
    } else if (daysUntilExpiry <= 30) {
      issues.push({
        type: 'registration_expiring_soon',
        severity: 'high',
        description: `Vehicle registration expires in ${daysUntilExpiry} days`,
        resolution: 'Schedule registration renewal appointment'
      });
      recommendations.push('Prepare required documents for registration renewal');
    }

    // Check inspection status
    if (registration.nextInspectionDue && registration.nextInspectionDue <= new Date()) {
      issues.push({
        type: 'inspection_overdue',
        severity: 'high',
        description: 'Vehicle inspection is overdue',
        resolution: 'Schedule vehicle inspection immediately'
      });
    }

    // Check emissions testing
    if (registration.emissionsTestResult === 'fail') {
      issues.push({
        type: 'emissions_test_failed',
        severity: 'high',
        description: 'Vehicle failed emissions testing',
        resolution: 'Repair vehicle and retest emissions'
      });
    }

    const compliant = issues.filter(i => i.severity === 'critical').length === 0;

    return { compliant, issues, recommendations };
  }

  private async checkDriverCompliance(driverId: string): Promise<ComplianceCheckResult> {
    const license = await this.getDriverLicense(driverId);
    const issues: ComplianceIssue[] = [];
    const recommendations: string[] = [];

    if (!license) {
      issues.push({
        type: 'missing_license',
        severity: 'critical',
        description: 'No driver license record found',
        resolution: 'Verify driver license with LTO'
      });
      return { compliant: false, issues, recommendations };
    }

    // Check license validity
    const daysUntilExpiry = this.calculateDaysUntilExpiry(license.expiryDate);
    
    if (daysUntilExpiry < 0) {
      issues.push({
        type: 'license_expired',
        severity: 'critical',
        description: `Driver license expired ${Math.abs(daysUntilExpiry)} days ago`,
        resolution: 'Renew driver license immediately'
      });
    } else if (daysUntilExpiry <= 30) {
      issues.push({
        type: 'license_expiring_soon',
        severity: 'medium',
        description: `Driver license expires in ${daysUntilExpiry} days`,
        resolution: 'Schedule license renewal appointment'
      });
    }

    // Check TNVS authorization
    if (license.tnvsAuthorizationExpiry) {
      const tnvsDaysUntilExpiry = this.calculateDaysUntilExpiry(license.tnvsAuthorizationExpiry);
      if (tnvsDaysUntilExpiry < 0) {
        issues.push({
          type: 'tnvs_authorization_expired',
          severity: 'critical',
          description: 'TNVS authorization has expired',
          resolution: 'Renew TNVS authorization'
        });
      }
    }

    // Check medical certificate
    if (license.medicalCertificateExpiry) {
      const medicalDaysUntilExpiry = this.calculateDaysUntilExpiry(license.medicalCertificateExpiry);
      if (medicalDaysUntilExpiry < 0) {
        issues.push({
          type: 'medical_certificate_expired',
          severity: 'high',
          description: 'Medical certificate has expired',
          resolution: 'Undergo medical examination and update certificate'
        });
      }
    }

    // Check drug test
    if (license.drugTestResult === 'positive' || !license.drugTestDate) {
      issues.push({
        type: 'drug_test_issue',
        severity: 'critical',
        description: 'Drug test failed or missing',
        resolution: 'Complete drug test with negative result'
      });
    }

    // Check violation points
    if (license.totalViolationPoints >= 10) {
      issues.push({
        type: 'license_suspended_points',
        severity: 'critical',
        description: 'License suspended due to accumulated violation points',
        resolution: 'Complete penalty reduction program'
      });
    }

    const compliant = issues.filter(i => i.severity === 'critical').length === 0;

    return { compliant, issues, recommendations };
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  private generateId(): string {
    return 'lto_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private calculateRegistrationExpiry(fromDate: Date): Date {
    const expiryDate = new Date(fromDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + COMPLIANCE_CONSTANTS.LTO.REGISTRATION_VALIDITY_YEARS);
    return expiryDate;
  }

  private calculateLicenseExpiry(fromDate: Date): Date {
    const expiryDate = new Date(fromDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + COMPLIANCE_CONSTANTS.LTO.LICENSE_VALIDITY_YEARS);
    return expiryDate;
  }

  private calculateNextInspectionDate(fromDate?: Date): Date {
    const baseDate = fromDate || new Date();
    const nextInspection = new Date(baseDate);
    nextInspection.setMonth(nextInspection.getMonth() + COMPLIANCE_CONSTANTS.LTFRB.INSPECTION_FREQUENCY_MONTHS);
    return nextInspection;
  }

  private calculateRegistrationRenewalFee(vehicleType: string): number {
    const baseFees: Record<string, number> = {
      'Private Car': 1500,
      'Motorcycle': 500,
      'Truck': 2500,
      'Bus': 3000,
      'Van': 2000,
    };
    return baseFees[vehicleType] || 1500;
  }

  private calculateLicenseRenewalFee(licenseType: string): number {
    const baseFees: Record<string, number> = {
      'Professional': 800,
      'Non-Professional': 600,
    };
    return baseFees[licenseType] || 600;
  }

  private calculateLTOFineAmount(violationType: string): number {
    const fineSchedule: Record<string, number> = {
      'speeding': 2000,
      'reckless_driving': 5000,
      'no_license': 3000,
      'expired_registration': 2500,
      'no_helmet': 1000,
      'illegal_parking': 500,
      'beating_red_light': 5000,
      'drunk_driving': 15000,
    };
    return fineSchedule[violationType] || 1000;
  }

  private calculateLTOPenaltyPoints(violationType: string): number {
    const pointSchedule: Record<string, number> = {
      'speeding': 2,
      'reckless_driving': 5,
      'no_license': 3,
      'expired_registration': 1,
      'no_helmet': 1,
      'illegal_parking': 1,
      'beating_red_light': 3,
      'drunk_driving': 10,
    };
    return pointSchedule[violationType] || 1;
  }

  private calculateViolationDueDate(): Date {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 15); // 15 days to pay
    return dueDate;
  }

  private calculateDaysUntilExpiry(expiryDate: Date): number {
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private determineComplianceStatus(daysUntilExpiry: number): LTOComplianceStatus {
    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 30) return 'expiring_soon';
    return 'compliant';
  }

  private determineRenewalImpact(violationType: string): boolean {
    const renewalAffectingViolations = [
      'reckless_driving',
      'drunk_driving',
      'no_license',
      'multiple_violations'
    ];
    return renewalAffectingViolations.includes(violationType);
  }

  private requiresCourtAppearance(violationType: string): boolean {
    const courtRequiredViolations = [
      'reckless_driving',
      'drunk_driving',
      'vehicular_homicide',
      'hit_and_run'
    ];
    return courtRequiredViolations.includes(violationType);
  }

  private shouldRunRule(rule: ComplianceMonitoringRule): boolean {
    if (!rule.nextRunDate || !rule.lastRunDate) return true;
    
    const now = new Date();
    return now >= rule.nextRunDate;
  }

  private calculateNextRunDate(rule: ComplianceMonitoringRule): Date {
    const now = new Date();
    const nextRun = new Date(now);

    switch (rule.checkFrequency) {
      case 'daily':
        nextRun.setDate(nextRun.getDate() + 1);
        break;
      case 'weekly':
        nextRun.setDate(nextRun.getDate() + 7);
        break;
      case 'monthly':
        nextRun.setMonth(nextRun.getMonth() + 1);
        break;
      case 'quarterly':
        nextRun.setMonth(nextRun.getMonth() + 3);
        break;
    }

    return nextRun;
  }

  private shouldTriggerEscalationLevel(daysUntilExpiry: number, level: any): boolean {
    return daysUntilExpiry <= level.daysFromExpiry;
  }

  // =====================================================
  // PLACEHOLDER METHODS (TO BE IMPLEMENTED WITH DATABASE)
  // =====================================================

  private async saveRegistration(registration: LTORegistration): Promise<void> {
    console.log('Saving LTO registration:', registration.orNumber);
  }

  private async loadRegistrationFromDatabase(vehicleId: string): Promise<LTORegistration | null> {
    return null;
  }

  private async saveLicense(license: DriverLicenseCompliance): Promise<void> {
    console.log('Saving driver license:', license.licenseNumber);
  }

  private async loadLicenseFromDatabase(driverId: string): Promise<DriverLicenseCompliance | null> {
    return null;
  }

  private async saveViolation(violation: LTOViolation): Promise<void> {
    console.log('Saving LTO violation:', violation.ticketNumber);
  }

  private async loadViolationById(violationId: string): Promise<LTOViolation | null> {
    return null;
  }

  private async logComplianceEvent(eventType: string, data: any): Promise<void> {
    console.log(`LTO Compliance Event: ${eventType}`, data);
  }

  private async scheduleRegistrationCheck(registration: LTORegistration): Promise<void> {
    console.log('Scheduling registration compliance check:', registration.orNumber);
  }

  private async scheduleLicenseCheck(license: DriverLicenseCompliance): Promise<void> {
    console.log('Scheduling license compliance check:', license.licenseNumber);
  }

  private async handleRegistrationStatusChange(
    registration: LTORegistration,
    previousStatus: LTOComplianceStatus,
    newStatus: LTOComplianceStatus,
    reason?: string
  ): Promise<void> {
    console.log(`Registration status change: ${previousStatus} -> ${newStatus} for ${registration.orNumber}`);
  }

  private async handleLicenseStatusChange(
    license: DriverLicenseCompliance,
    previousStatus: LTOComplianceStatus,
    newStatus: LTOComplianceStatus,
    reason?: string
  ): Promise<void> {
    console.log(`License status change: ${previousStatus} -> ${newStatus} for ${license.licenseNumber}`);
  }

  private async checkRegistrationRenewalEligibility(registration: LTORegistration): Promise<{
    eligible: boolean;
    reason?: string;
  }> {
    return { eligible: true };
  }

  private async checkLicenseRenewalEligibility(license: DriverLicenseCompliance): Promise<{
    eligible: boolean;
    reason?: string;
  }> {
    return { eligible: true };
  }

  private async createViolationAlert(violation: LTOViolation): Promise<void> {
    console.log('Creating violation alert:', violation.ticketNumber);
  }

  private async createLicenseSuspensionAlert(license: DriverLicenseCompliance, violation: LTOViolation): Promise<void> {
    console.log('Creating license suspension alert:', license.licenseNumber);
  }

  private async createInspectionReminder(registration: LTORegistration, inspectionDate: Date): Promise<void> {
    console.log('Creating inspection reminder:', registration.orNumber);
  }

  private async createInspectionFailureAlert(registration: LTORegistration, issues: string[]): Promise<void> {
    console.log('Creating inspection failure alert:', registration.orNumber);
  }

  private async createEmissionsFailureAlert(registration: LTORegistration): Promise<void> {
    console.log('Creating emissions failure alert:', registration.orNumber);
  }

  private async scheduleMedicalCertificateExpiry(license: DriverLicenseCompliance): Promise<void> {
    console.log('Scheduling medical certificate expiry:', license.licenseNumber);
  }

  private async createDrugTestFailureAlert(license: DriverLicenseCompliance): Promise<void> {
    console.log('Creating drug test failure alert:', license.licenseNumber);
  }

  private async runAllMonitoringRules(): Promise<void> {
    for (const rule of this.monitoringRules) {
      if (rule.isActive) {
        await this.executeMonitoringRule(rule);
      }
    }
  }

  private async getRegistrationsForRule(rule: ComplianceMonitoringRule): Promise<LTORegistration[]> {
    return [];
  }

  private async getLicensesForRule(rule: ComplianceMonitoringRule): Promise<DriverLicenseCompliance[]> {
    return [];
  }

  private async executeEscalationActions(item: any, level: any, type: string): Promise<void> {
    console.log(`Executing escalation level ${level.level} for ${type}`);
  }
}

// =====================================================
// SUPPORTING INTERFACES
// =====================================================

interface ComplianceIssue {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  resolution: string;
}

interface ComplianceCheckResult {
  compliant: boolean;
  issues: ComplianceIssue[];
  recommendations: string[];
}

export default LTOComplianceService;