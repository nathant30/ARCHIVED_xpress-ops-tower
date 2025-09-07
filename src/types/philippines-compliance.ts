/**
 * Philippines Regulatory Compliance Types for Vehicle Management
 * 
 * Comprehensive type definitions for Philippines ridesharing compliance:
 * - LTFRB (Land Transportation Franchising and Regulatory Board)
 * - LTO (Land Transportation Office)  
 * - BIR (Bureau of Internal Revenue)
 * - BSP (Bangko Sentral ng Pilipinas)
 * - Number Coding Enforcement
 * - Environmental Compliance
 * - Insurance Requirements
 */

import { VehicleOwnershipType } from './vehicles';

// =====================================================
// CORE COMPLIANCE ENUMS
// =====================================================

export type PhilippinesRegion = 'ncr' | 'calabarzon' | 'central_visayas' | 'davao' | 'northern_mindanao';

export type LTFRBComplianceStatus = 'compliant' | 'expiring_soon' | 'expired' | 'suspended' | 'revoked' | 'pending_renewal';

export type LTOComplianceStatus = 'compliant' | 'expiring_soon' | 'expired' | 'pending_renewal' | 'suspended';

export type InsuranceComplianceStatus = 'compliant' | 'expiring_soon' | 'expired' | 'pending_renewal' | 'insufficient_coverage';

export type ComplianceViolationType = 'franchise_expired' | 'registration_expired' | 'insurance_expired' | 'coding_violation' | 'emissions_failed' | 'inspection_overdue' | 'driver_unauthorized' | 'route_violation';

export type ComplianceAlertPriority = 'critical' | 'high' | 'medium' | 'low';

export type DocumentType = 'franchise_certificate' | 'or_cr' | 'driver_license' | 'tnvs_id' | 'insurance_policy' | 'emissions_certificate' | 'vehicle_inspection' | 'special_permit';

export type TNVSServiceType = 'premium' | 'standard' | 'economy' | 'luxury' | 'motorcycle' | 'delivery';

// Number Coding Scheme Types
export type CodingScheme = 'metro_manila' | 'provincial' | 'city_specific' | 'none';

export type CodingDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export type CodingExemption = 'medical_emergency' | 'government_official' | 'diplomatic' | 'military' | 'public_utility' | 'delivery_essential' | 'none';

// =====================================================
// LTFRB COMPLIANCE INTERFACES
// =====================================================

export interface LTFRBFranchise {
  id: string;
  vehicleId: string;
  
  // Franchise Details
  franchiseNumber: string;
  franchiseType: TNVSServiceType;
  serviceCategory: 'ride_hailing' | 'delivery' | 'logistics';
  
  // Validity and Status
  issuedDate: Date;
  effectiveDate: Date;
  expiryDate: Date;
  status: LTFRBComplianceStatus;
  
  // Geographic Coverage
  authorizedRegions: PhilippinesRegion[];
  specificRoutes?: string[];
  operatingAreas: any[]; // GeoJSON polygons
  
  // Service Parameters
  maxPassengerCapacity: number;
  authorizedServiceTypes: TNVSServiceType[];
  fareStructure?: any;
  
  // Vehicle Specifications
  minimumVehicleAge?: number;
  maxVehicleAge: number;
  engineDisplacementRequirement?: string;
  
  // Renewal Information
  renewalNotificationSent: boolean;
  renewalApplicationDate?: Date;
  renewalFee: number;
  lastRenewalDate?: Date;
  
  // Compliance History
  violationHistory: LTFRBViolation[];
  suspensionHistory: LTFRBSuspension[];
  
  // Documents
  franchiseCertificateUrl?: string;
  digitalCertificateHash?: string;
  
  // Audit Fields
  createdAt: Date;
  updatedAt: Date;
  lastVerifiedAt?: Date;
  verifiedBy?: string;
  isActive: boolean;
}

export interface LTFRBViolation {
  id: string;
  franchiseId: string;
  vehicleId: string;
  
  // Violation Details
  violationType: string;
  violationCode: string;
  description: string;
  
  // Location and Time
  violationDate: Date;
  location?: string;
  region: PhilippinesRegion;
  
  // Penalties
  fineAmount: number;
  penaltyPoints: number;
  
  // Status
  status: 'pending' | 'paid' | 'contested' | 'dismissed' | 'overdue';
  dueDate: Date;
  paidDate?: Date;
  
  // Resolution
  resolutionNotes?: string;
  appealDate?: Date;
  appealStatus?: 'pending' | 'approved' | 'denied';
  
  // Audit
  reportedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LTFRBSuspension {
  id: string;
  franchiseId: string;
  vehicleId: string;
  
  // Suspension Details
  suspensionReason: string;
  suspensionDate: Date;
  suspensionDuration: number; // days
  expectedReinstateDate: Date;
  
  // Status
  status: 'active' | 'lifted' | 'extended';
  actualReinstateDate?: Date;
  
  // Requirements for Reinstatement
  reinstatementRequirements: string[];
  requirementsFulfilled: string[];
  
  // Audit
  createdAt: Date;
  updatedAt: Date;
}

// =====================================================
// LTO COMPLIANCE INTERFACES
// =====================================================

export interface LTORegistration {
  id: string;
  vehicleId: string;
  
  // Registration Documents
  orNumber: string; // Official Receipt
  crNumber: string; // Certificate of Registration
  plateNumber: string;
  
  // Registration Details
  registrationDate: Date;
  expiryDate: Date;
  status: LTOComplianceStatus;
  
  // Vehicle Classification
  vehicleType: string;
  bodyType: string;
  fuelType: string;
  
  // Technical Specifications
  engineNumber: string;
  chassisNumber: string;
  pistonDisplacement: string;
  grossWeight: number;
  netWeight: number;
  
  // Registered Owner Information
  registeredOwnerName: string;
  registeredOwnerAddress: string;
  registeredOwnerTIN?: string;
  
  // LTO Office
  registeredLTOOffice: string;
  regionCode: string;
  
  // Renewal Information
  renewalFee: number;
  renewalNotificationSent: boolean;
  lastRenewalDate?: Date;
  
  // Inspection Requirements
  lastInspectionDate?: Date;
  nextInspectionDue: Date;
  inspectionCenter?: string;
  inspectionCertificate?: string;
  
  // Emissions Testing
  emissionsTestResult?: 'pass' | 'fail' | 'pending';
  emissionsTestDate?: Date;
  emissionsCertificate?: string;
  
  // Documents
  orCopyUrl?: string;
  crCopyUrl?: string;
  
  // Audit Fields
  createdAt: Date;
  updatedAt: Date;
  lastVerifiedAt?: Date;
  isActive: boolean;
}

export interface DriverLicenseCompliance {
  id: string;
  driverId: string;
  
  // License Details
  licenseNumber: string;
  licenseType: string; // Professional, Non-Professional
  restrictions: string[];
  conditions: string[];
  
  // Validity
  issuedDate: Date;
  expiryDate: Date;
  status: LTOComplianceStatus;
  
  // TNVS Authorization
  tnvsAuthorizationNumber?: string;
  tnvsAuthorizationExpiry?: Date;
  tnvsTrainingCertificate?: string;
  
  // Medical Certificate
  medicalCertificateNumber?: string;
  medicalCertificateExpiry?: Date;
  medicalRestrictions?: string[];
  
  // Drug Test
  drugTestResult?: 'negative' | 'positive' | 'pending';
  drugTestDate?: Date;
  drugTestCertificate?: string;
  
  // Violation History
  violationHistory: LTOViolation[];
  totalViolationPoints: number;
  
  // Renewal Information
  renewalNotificationSent: boolean;
  renewalFee: number;
  
  // Documents
  licenseCopyUrl?: string;
  tnvsIdUrl?: string;
  
  // Audit Fields
  createdAt: Date;
  updatedAt: Date;
  lastVerifiedAt?: Date;
  isActive: boolean;
}

export interface LTOViolation {
  id: string;
  driverId?: string;
  vehicleId?: string;
  
  // Violation Details
  violationCode: string;
  violationType: string;
  description: string;
  
  // Incident Information
  violationDate: Date;
  location: string;
  ticketNumber: string;
  enforcingOfficer: string;
  
  // Penalties
  fineAmount: number;
  penaltyPoints: number;
  
  // Status
  status: 'unpaid' | 'paid' | 'contested' | 'dismissed';
  dueDate: Date;
  paidDate?: Date;
  
  // License Impact
  affectsLicenseRenewal: boolean;
  requiresCourtAppearance: boolean;
  
  // Audit
  createdAt: Date;
  updatedAt: Date;
}

// =====================================================
// INSURANCE COMPLIANCE INTERFACES
// =====================================================

export interface VehicleInsuranceCompliance {
  id: string;
  vehicleId: string;
  
  // CTPL Insurance (Compulsory Third Party Liability)
  ctplProvider: string;
  ctplPolicyNumber: string;
  ctplEffectiveDate: Date;
  ctplExpiryDate: Date;
  ctplCoverageAmount: number;
  ctplStatus: InsuranceComplianceStatus;
  
  // Comprehensive Insurance
  comprehensiveProvider?: string;
  comprehensivePolicyNumber?: string;
  comprehensiveEffectiveDate?: Date;
  comprehensiveExpiryDate?: Date;
  comprehensiveCoverageAmount?: number;
  comprehensiveStatus?: InsuranceComplianceStatus;
  
  // Additional Coverage
  passengerAccidentInsurance?: InsuranceCoverage;
  cargoInsurance?: InsuranceCoverage;
  rideshareCommercialInsurance?: InsuranceCoverage;
  
  // Premium Information
  totalAnnualPremium: number;
  paymentSchedule: 'annual' | 'semi_annual' | 'quarterly' | 'monthly';
  nextPremiumDue: Date;
  
  // Claims History
  claimsHistory: InsuranceClaim[];
  totalClaimsValue: number;
  
  // Renewal Information
  renewalNotificationSent: boolean;
  autoRenewalEnabled: boolean;
  
  // Documents
  ctplCertificateUrl?: string;
  comprehensivePolicyUrl?: string;
  
  // Audit Fields
  createdAt: Date;
  updatedAt: Date;
  lastVerifiedAt?: Date;
  isActive: boolean;
}

export interface InsuranceCoverage {
  provider: string;
  policyNumber: string;
  effectiveDate: Date;
  expiryDate: Date;
  coverageAmount: number;
  status: InsuranceComplianceStatus;
}

export interface InsuranceClaim {
  id: string;
  insuranceId: string;
  
  // Claim Details
  claimNumber: string;
  claimType: string;
  claimAmount: number;
  approvedAmount?: number;
  
  // Incident Information
  incidentDate: Date;
  incidentLocation: string;
  incidentDescription: string;
  
  // Status
  status: 'pending' | 'approved' | 'denied' | 'paid' | 'closed';
  filedDate: Date;
  resolvedDate?: Date;
  
  // Documents
  claimDocuments: string[];
  
  // Audit
  createdAt: Date;
  updatedAt: Date;
}

// =====================================================
// NUMBER CODING ENFORCEMENT
// =====================================================

export interface NumberCodingRule {
  id: string;
  regionId: string;
  
  // Coding Scheme
  schemeName: string;
  schemeType: CodingScheme;
  
  // Schedule
  codingHours: {
    start: string; // HH:MM format
    end: string;   // HH:MM format
  };
  codingDays: CodingDay[];
  
  // Plate Number Rules
  bannedDigits: number[]; // Last digit of plate number
  exemptPlatePatterns?: string[]; // Regex patterns for exempt plates
  
  // Geographic Coverage
  coverageArea: any; // GeoJSON polygon
  exemptedAreas?: any[]; // GeoJSON polygons for exempt areas
  
  // Penalties
  firstOffenseFine: number;
  subsequentOffenseFine: number;
  
  // Validity
  effectiveDate: Date;
  expiryDate?: Date;
  isActive: boolean;
  
  // Special Provisions
  holidayExemptions: Date[];
  emergencyExemptions: CodingExemption[];
  
  // Audit
  createdAt: Date;
  updatedAt: Date;
}

export interface NumberCodingViolation {
  id: string;
  vehicleId: string;
  driverId?: string;
  
  // Violation Details
  violationDate: Date;
  violationTime: string;
  location: string;
  codingRuleId: string;
  
  // Vehicle Information
  plateNumber: string;
  lastDigit: number;
  
  // Detection Method
  detectionMethod: 'traffic_enforcer' | 'anpr_camera' | 'citizen_report' | 'routine_checkpoint';
  enforcingOfficer?: string;
  ticketNumber?: string;
  
  // Penalty
  fineAmount: number;
  penaltyPoints?: number;
  
  // Status
  status: 'pending' | 'paid' | 'contested' | 'dismissed' | 'overdue';
  dueDate: Date;
  paidDate?: Date;
  
  // Evidence
  evidencePhotos?: string[];
  videoEvidence?: string;
  
  // Resolution
  contestedDate?: Date;
  contestReason?: string;
  contestDecision?: 'upheld' | 'dismissed' | 'reduced';
  
  // Audit
  createdAt: Date;
  updatedAt: Date;
}

export interface CodingExemptionRequest {
  id: string;
  vehicleId: string;
  driverId: string;
  
  // Request Details
  exemptionType: CodingExemption;
  requestDate: Date;
  exemptionPeriodStart: Date;
  exemptionPeriodEnd: Date;
  
  // Justification
  reason: string;
  supportingDocuments: string[];
  
  // Status
  status: 'pending' | 'approved' | 'denied' | 'expired';
  reviewedBy?: string;
  reviewedDate?: Date;
  reviewNotes?: string;
  
  // Approval
  approvalNumber?: string;
  approvalDocumentUrl?: string;
  
  // Usage Tracking
  timesUsed: number;
  lastUsedDate?: Date;
  
  // Audit
  createdAt: Date;
  updatedAt: Date;
}

// =====================================================
// ENVIRONMENTAL COMPLIANCE
// =====================================================

export interface EnvironmentalCompliance {
  id: string;
  vehicleId: string;
  
  // Emissions Testing
  emissionsTestResult: 'pass' | 'fail' | 'pending' | 'not_required';
  emissionsTestDate?: Date;
  nextEmissionsTestDue: Date;
  emissionsCertificateNumber?: string;
  testingCenter?: string;
  
  // Emissions Data
  co2EmissionLevel?: number; // g/km
  noxEmissionLevel?: number; // g/km
  pmEmissionLevel?: number;  // g/km
  hcEmissionLevel?: number;  // g/km
  
  // Environmental Rating
  environmentalRating: 'A' | 'B' | 'C' | 'D' | 'F';
  carbonFootprintScore: number;
  ecoFriendlyFeatures: string[];
  
  // Electric Vehicle Incentives
  isElectricVehicle: boolean;
  evIncentivePrograms: string[];
  evTaxBenefits: number;
  
  // Carbon Offset Programs
  carbonOffsetProgram?: string;
  offsetCredits: number;
  offsetCertificates: string[];
  
  // Compliance Status
  status: 'compliant' | 'non_compliant' | 'pending_test' | 'exempt';
  exemptionReason?: string;
  
  // Renewal Information
  renewalNotificationSent: boolean;
  nextRenewalDate: Date;
  
  // Audit
  createdAt: Date;
  updatedAt: Date;
  lastVerifiedAt?: Date;
  isActive: boolean;
}

// =====================================================
// COMPLIANCE MONITORING & AUTOMATION
// =====================================================

export interface ComplianceMonitoringRule {
  id: string;
  name: string;
  description: string;
  
  // Rule Configuration
  complianceType: 'ltfrb' | 'lto' | 'insurance' | 'coding' | 'environmental';
  triggerCondition: 'expiry_approaching' | 'expired' | 'violation_detected' | 'manual_check' | 'periodic_review';
  
  // Timing
  checkFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  advanceNotificationDays: number;
  
  // Scope
  applicableRegions: PhilippinesRegion[];
  applicableOwnershipTypes: VehicleOwnershipType[];
  applicableServiceTypes: TNVSServiceType[];
  
  // Actions
  automaticNotifications: boolean;
  escalationLevels: ComplianceEscalationLevel[];
  
  // Thresholds
  warningThreshold: number; // days before expiry
  criticalThreshold: number; // days before/after expiry
  
  // Integration
  governmentAPIIntegration: boolean;
  thirdPartyValidation: boolean;
  
  // Status
  isActive: boolean;
  
  // Audit
  createdAt: Date;
  updatedAt: Date;
  lastRunDate?: Date;
  nextRunDate: Date;
}

export interface ComplianceEscalationLevel {
  level: number;
  daysFromExpiry: number;
  actions: ComplianceAction[];
  recipients: string[];
}

export interface ComplianceAction {
  type: 'email_notification' | 'sms_alert' | 'in_app_notification' | 'disable_vehicle' | 'suspend_driver' | 'generate_report' | 'api_call';
  configuration: Record<string, any>;
  isActive: boolean;
}

export interface ComplianceAlert {
  id: string;
  vehicleId: string;
  driverId?: string;
  
  // Alert Details
  alertType: ComplianceViolationType;
  priority: ComplianceAlertPriority;
  title: string;
  message: string;
  
  // Compliance Context
  complianceType: 'ltfrb' | 'lto' | 'insurance' | 'coding' | 'environmental';
  relatedDocumentId?: string;
  expiryDate?: Date;
  violationDate?: Date;
  
  // Status
  status: 'active' | 'acknowledged' | 'resolved' | 'dismissed';
  createdDate: Date;
  acknowledgedDate?: Date;
  resolvedDate?: Date;
  
  // Actions Required
  requiredActions: string[];
  actionTaken?: string;
  
  // Recipients
  assignedTo?: string;
  notificationsSent: string[]; // email, sms, in-app
  
  // Escalation
  escalationLevel: number;
  escalatedAt?: Date;
  autoEscalationDate?: Date;
  
  // Resolution
  resolutionNotes?: string;
  followUpRequired: boolean;
  followUpDate?: Date;
  
  // Metadata
  metadata: Record<string, any>;
  
  // Audit
  createdAt: Date;
  updatedAt: Date;
}

// =====================================================
// AUTOMATED REPORTING
// =====================================================

export interface ComplianceReport {
  id: string;
  
  // Report Configuration
  reportType: 'monthly_ltfrb' | 'quarterly_summary' | 'annual_filing' | 'violation_report' | 'compliance_status' | 'custom';
  reportPeriodStart: Date;
  reportPeriodEnd: Date;
  
  // Scope
  regionScope: PhilippinesRegion[];
  vehicleScope?: string[]; // vehicle IDs
  ownershipTypeScope?: VehicleOwnershipType[];
  
  // Report Data
  summary: ComplianceReportSummary;
  details: ComplianceReportDetail[];
  
  // Generation
  generatedAt: Date;
  generatedBy: string;
  generationMethod: 'automated' | 'manual';
  
  // Status
  status: 'generating' | 'completed' | 'failed' | 'sent';
  
  // Distribution
  recipients: ReportRecipient[];
  sentAt?: Date;
  
  // Files
  reportFileUrl?: string;
  attachments: string[];
  
  // Submission
  submittedToGovernment: boolean;
  submissionDate?: Date;
  submissionReference?: string;
  
  // Audit
  createdAt: Date;
  updatedAt: Date;
}

export interface ComplianceReportSummary {
  totalVehicles: number;
  compliantVehicles: number;
  nonCompliantVehicles: number;
  complianceRate: number;
  
  // By Compliance Type
  ltfrbCompliance: ComplianceTypeSummary;
  ltoCompliance: ComplianceTypeSummary;
  insuranceCompliance: ComplianceTypeSummary;
  environmentalCompliance: ComplianceTypeSummary;
  
  // Violations
  totalViolations: number;
  violationsByType: Record<ComplianceViolationType, number>;
  totalFines: number;
  
  // Trends
  complianceImprovement: number; // percentage change from previous period
  
  // Regional Breakdown
  regionalCompliance: Record<PhilippinesRegion, ComplianceTypeSummary>;
}

export interface ComplianceTypeSummary {
  compliant: number;
  expiringSoon: number;
  expired: number;
  suspended: number;
  complianceRate: number;
}

export interface ComplianceReportDetail {
  vehicleId: string;
  vehicleCode: string;
  licensePlate: string;
  ownershipType: VehicleOwnershipType;
  region: PhilippinesRegion;
  
  complianceStatus: Record<string, any>;
  violations: ComplianceViolation[];
  
  recommendations: string[];
}

export interface ReportRecipient {
  type: 'government_agency' | 'internal_team' | 'vehicle_owner' | 'external_auditor';
  name: string;
  email?: string;
  department?: string;
  deliveryMethod: 'email' | 'api' | 'portal_upload' | 'manual';
}

export interface ComplianceViolation {
  type: ComplianceViolationType;
  date: Date;
  description: string;
  fineAmount?: number;
  status: string;
  resolutionDate?: Date;
}

// =====================================================
// GOVERNMENT API INTEGRATION
// =====================================================

export interface GovernmentAPIConfig {
  id: string;
  
  // API Details
  agency: 'ltfrb' | 'lto' | 'bir' | 'bsp' | 'mmda' | 'dilg';
  serviceName: string;
  baseUrl: string;
  
  // Authentication
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  certificateFile?: string;
  
  // Rate Limiting
  rateLimit: number; // requests per minute
  quotaLimit: number; // requests per day
  
  // Endpoints
  endpoints: APIEndpointConfig[];
  
  // Status
  isActive: boolean;
  lastHealthCheck?: Date;
  connectionStatus: 'connected' | 'disconnected' | 'error' | 'maintenance';
  
  // Audit
  createdAt: Date;
  updatedAt: Date;
}

export interface APIEndpointConfig {
  name: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  purpose: string;
  inputSchema: Record<string, any>;
  outputSchema: Record<string, any>;
  isActive: boolean;
}

export interface APICallLog {
  id: string;
  
  // Request Details
  configId: string;
  endpointName: string;
  requestMethod: string;
  requestUrl: string;
  requestPayload?: Record<string, any>;
  
  // Response Details
  responseStatus: number;
  responseBody?: Record<string, any>;
  responseTime: number; // milliseconds
  
  // Context
  vehicleId?: string;
  driverId?: string;
  purpose: string;
  
  // Status
  success: boolean;
  errorMessage?: string;
  
  // Timing
  requestedAt: Date;
  completedAt: Date;
  
  // Audit
  requestedBy: string;
  sessionId?: string;
}

// =====================================================
// DASHBOARD AND ANALYTICS TYPES
// =====================================================

export interface ComplianceDashboardData {
  timestamp: Date;
  region?: PhilippinesRegion;
  
  // Overall Compliance
  overallComplianceRate: number;
  totalVehiclesMonitored: number;
  activeAlerts: number;
  criticalIssues: number;
  
  // By Compliance Type
  complianceByType: Record<string, ComplianceMetric>;
  
  // Trends
  complianceTrends: ComplianceTrendData[];
  
  // Regional Performance
  regionalCompliance: RegionalComplianceData[];
  
  // Upcoming Expirations
  upcomingExpirations: ExpirationAlert[];
  
  // Recent Activity
  recentViolations: ComplianceViolation[];
  recentResolutions: ComplianceResolution[];
  
  // Government Integration Status
  apiIntegrationStatus: APIIntegrationStatus[];
}

export interface ComplianceMetric {
  compliant: number;
  nonCompliant: number;
  expiringSoon: number;
  complianceRate: number;
  trendDirection: 'improving' | 'declining' | 'stable';
}

export interface ComplianceTrendData {
  date: Date;
  complianceRate: number;
  totalViolations: number;
  resolvedViolations: number;
}

export interface RegionalComplianceData {
  region: PhilippinesRegion;
  complianceRate: number;
  totalVehicles: number;
  activeViolations: number;
  trend: 'improving' | 'declining' | 'stable';
}

export interface ExpirationAlert {
  vehicleId: string;
  vehicleCode: string;
  documentType: DocumentType;
  expiryDate: Date;
  daysUntilExpiry: number;
  priority: ComplianceAlertPriority;
}

export interface ComplianceResolution {
  id: string;
  vehicleId: string;
  violationType: ComplianceViolationType;
  resolvedDate: Date;
  resolutionMethod: string;
  timeToResolution: number; // hours
}

export interface APIIntegrationStatus {
  agency: string;
  status: 'operational' | 'degraded' | 'down';
  lastSuccessfulCall?: Date;
  dailyQuotaUsed: number;
  dailyQuotaLimit: number;
}

// =====================================================
// REQUEST/RESPONSE TYPES
// =====================================================

export interface CreateComplianceRecordRequest {
  vehicleId: string;
  complianceType: 'ltfrb' | 'lto' | 'insurance' | 'environmental';
  documentData: Record<string, any>;
  expiryDate?: Date;
  attachments?: string[];
}

export interface UpdateComplianceStatusRequest {
  status: LTFRBComplianceStatus | LTOComplianceStatus | InsuranceComplianceStatus;
  notes?: string;
  attachments?: string[];
}

export interface ComplianceCheckRequest {
  vehicleIds?: string[];
  complianceTypes?: string[];
  region?: PhilippinesRegion;
  forceRefresh?: boolean;
}

export interface ComplianceCheckResponse {
  vehicleId: string;
  complianceStatus: Record<string, any>;
  alerts: ComplianceAlert[];
  recommendations: string[];
  lastChecked: Date;
}

export interface BulkComplianceUpdateRequest {
  updates: Array<{
    vehicleId: string;
    complianceType: string;
    documentId: string;
    newExpiryDate?: Date;
    newStatus?: string;
  }>;
  reason: string;
  updatedBy: string;
}

export interface GenerateReportRequest {
  reportType: string;
  periodStart: Date;
  periodEnd: Date;
  scope: {
    regions?: PhilippinesRegion[];
    vehicleIds?: string[];
    ownershipTypes?: VehicleOwnershipType[];
  };
  format: 'pdf' | 'excel' | 'csv' | 'json';
  recipients?: ReportRecipient[];
  scheduleSubmission?: boolean;
}

// =====================================================
// CONFIGURATION CONSTANTS
// =====================================================

export const COMPLIANCE_CONSTANTS = {
  LTFRB: {
    FRANCHISE_VALIDITY_YEARS: 5,
    RENEWAL_ADVANCE_DAYS: 60,
    MAX_VEHICLE_AGE: 15,
    INSPECTION_FREQUENCY_MONTHS: 6,
  },
  LTO: {
    REGISTRATION_VALIDITY_YEARS: 3,
    LICENSE_VALIDITY_YEARS: 5,
    TNVS_TRAINING_VALIDITY_YEARS: 2,
    RENEWAL_ADVANCE_DAYS: 30,
  },
  INSURANCE: {
    CTPL_VALIDITY_YEARS: 3,
    MINIMUM_CTPL_COVERAGE: 100000,
    RENEWAL_ADVANCE_DAYS: 45,
  },
  ENVIRONMENTAL: {
    EMISSIONS_TEST_VALIDITY_YEARS: 1,
    TEST_ADVANCE_DAYS: 30,
  },
  CODING: {
    STANDARD_HOURS: { start: '07:00', end: '19:00' },
    WEEKEND_EXEMPTION: true,
    HOLIDAY_EXEMPTION: true,
  },
} as const;

export const PHILIPPINES_REGIONS: Record<PhilippinesRegion, string> = {
  ncr: 'National Capital Region',
  calabarzon: 'CALABARZON',
  central_visayas: 'Central Visayas (Region VII)',
  davao: 'Davao Region (Region XI)',
  northern_mindanao: 'Northern Mindanao (Region X)',
} as const;