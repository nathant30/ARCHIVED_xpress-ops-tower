// Vehicle Management Types for Xpress Ops Tower
// Supporting 4 ownership models with comprehensive vehicle lifecycle management

export type VehicleOwnershipType = 'xpress_owned' | 'fleet_owned' | 'operator_owned' | 'driver_owned';
export type VehicleStatus = 'active' | 'in_service' | 'maintenance' | 'inspection' | 'inactive' | 'decommissioned' | 'impounded';
export type VehicleCondition = 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
export type MaintenancePriority = 'routine' | 'minor' | 'major' | 'urgent' | 'critical';
export type OBDStatus = 'connected' | 'disconnected' | 'error' | 'not_installed' | 'maintenance';
export type FuelType = 'gasoline' | 'diesel' | 'lpg' | 'electric' | 'hybrid_gas' | 'hybrid_diesel';
export type VehicleCategory = 'sedan' | 'hatchback' | 'suv' | 'mpv' | 'van' | 'motorcycle' | 'tricycle' | 'jeepney' | 'e_jeepney' | 'bus';
export type AssignmentType = 'primary' | 'secondary' | 'temporary';
export type MaintenanceStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'deferred';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'dismissed';
export type ComplianceStatus = 'compliant' | 'warning' | 'non_compliant' | 'suspended';

// Core Vehicle Interface
export interface Vehicle {
  id: string;
  
  // Basic identification
  vehicleCode: string;
  licensePlate: string;
  vin?: string;
  
  // Vehicle specifications
  make: string;
  model: string;
  year: number;
  color: string;
  category: VehicleCategory;
  fuelType: FuelType;
  
  // Engine and capacity
  engineDisplacement?: number;
  seatingCapacity: number;
  cargoCapacityKg?: number;
  
  // Ownership model
  ownershipType: VehicleOwnershipType;
  fleetOwnerName?: string;
  operatorOwnerName?: string;
  
  // Status and condition
  status: VehicleStatus;
  conditionRating: VehicleCondition;
  conditionScore: number;
  
  // Regional assignment
  regionId: string;
  primaryServiceArea?: any; // GeoJSON Polygon
  
  // Financial information
  acquisitionCost?: number;
  currentMarketValue?: number;
  monthlyDepreciation?: number;
  insuranceValue?: number;
  
  // Registration and compliance (Philippines-specific)
  orNumber?: string;
  crNumber?: string;
  registrationExpiry: Date;
  ltfrbFranchiseNumber?: string;
  ltfrbFranchiseExpiry?: Date;
  
  // Insurance
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  insuranceExpiry?: Date;
  insuranceCoverageAmount?: number;
  
  // OBD and telematics
  obdDeviceInstalled: boolean;
  obdDeviceSerial?: string;
  telematicsProvider?: string;
  telematicsPlan?: string;
  
  // Service capabilities
  serviceTypes: string[];
  maxTripDistanceKm: number;
  
  // Maintenance tracking
  lastMaintenanceDate?: Date;
  nextMaintenanceDue?: Date;
  totalMaintenanceCost: number;
  maintenanceAlertsCount: number;
  
  // Performance metrics
  totalDistanceKm: number;
  totalTrips: number;
  averageRating: number;
  fuelEfficiencyKmpl?: number;
  carbonEmissionsKg: number;
  
  // Availability and utilization
  dailyOperatingHours: number;
  utilizationRate: number;
  availabilityScore: number;
  
  // Emergency and safety
  emergencyContacts: any[];
  safetyFeatures: Record<string, any>;
  accidentCount: number;
  
  // Audit fields
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
  isActive: boolean;
}

// Vehicle Driver Assignment
export interface VehicleDriverAssignment {
  id: string;
  vehicleId: string;
  driverId: string;
  
  // Assignment details
  assignmentType: AssignmentType;
  assignedAt: Date;
  assignedBy?: string;
  
  // Validity period
  validFrom: Date;
  validUntil?: Date;
  
  // Assignment terms
  dailyRentalFee?: number;
  fuelResponsibility: 'driver' | 'owner' | 'shared';
  maintenanceResponsibility: 'driver' | 'owner' | 'shared';
  
  // Performance tracking
  totalTripsAssigned: number;
  totalDistanceAssigned: number;
  totalEarningsAssigned: number;
  averageRatingAssigned: number;
  
  // Status and metadata
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Vehicle Maintenance
export interface VehicleMaintenance {
  id: string;
  vehicleId: string;
  maintenanceCode: string;
  workOrderNumber?: string;
  
  // Classification
  maintenanceType: string;
  priority: MaintenancePriority;
  isScheduled: boolean;
  
  // Service provider
  serviceProvider?: string;
  serviceLocation?: string;
  serviceContact?: string;
  
  // Scheduling and timing
  scheduledDate: Date;
  scheduledStartTime?: string;
  actualStartTime?: Date;
  actualCompletionTime?: Date;
  estimatedDurationHours?: number;
  actualDurationHours?: number;
  
  // Vehicle status
  preMaintenanceOdometerKm?: number;
  postMaintenanceOdometerKm?: number;
  preMaintenanceCondition?: VehicleCondition;
  postMaintenanceCondition?: VehicleCondition;
  
  // Details and parts
  description: string;
  workPerformed?: string;
  partsReplaced: any[];
  laborHours: number;
  
  // Cost breakdown
  partsCost: number;
  laborCost: number;
  otherCosts: number;
  totalCost: number;
  
  // Payment and approval
  costApprovedBy?: string;
  paidBy: 'xpress' | 'owner' | 'driver' | 'insurance';
  paymentStatus: 'pending' | 'approved' | 'paid' | 'rejected';
  
  // Quality and follow-up
  qualityRating?: number;
  followUpRequired: boolean;
  followUpDate?: Date;
  followUpNotes?: string;
  
  // Documentation
  photos: string[];
  receipts: string[];
  warrantyInfo: Record<string, any>;
  
  // Next maintenance
  nextMaintenanceType?: string;
  nextMaintenanceDueDate?: Date;
  nextMaintenanceDueKm?: number;
  
  // Compliance and safety
  affectsSafety: boolean;
  affectsCompliance: boolean;
  inspectionPassed?: boolean;
  inspectorNotes?: string;
  
  // Status
  status: MaintenanceStatus;
  cancellationReason?: string;
  
  // Audit
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

// Maintenance Alert
export interface MaintenanceAlert {
  id: string;
  vehicleId: string;
  
  // Alert details
  alertType: string;
  alertSource: 'system' | 'obd' | 'manual' | 'telematics';
  
  // Trigger criteria
  triggerCondition: string;
  triggerValue?: string;
  currentValue?: string;
  thresholdValue?: string;
  
  // Alert messaging
  alertTitle: string;
  alertDescription: string;
  recommendedAction?: string;
  urgencyLevel: MaintenancePriority;
  
  // Recipients and notification
  notifyDriver: boolean;
  notifyOwner: boolean;
  notifyOpsTeam: boolean;
  notificationChannels: string[];
  
  // Alert lifecycle
  status: AlertStatus;
  createdAt: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolvedAt?: Date;
  resolutionNotes?: string;
  
  // Follow-up and escalation
  escalationLevel: number;
  lastEscalationAt?: Date;
  autoDismissAt?: Date;
}

// OBD Device
export interface VehicleOBDDevice {
  id: string;
  deviceSerial: string;
  deviceModel: string;
  manufacturer: string;
  firmwareVersion?: string;
  
  // Vehicle assignment
  vehicleId: string;
  installedDate: Date;
  installedBy?: string;
  
  // Device specifications
  supportedProtocols: string[];
  cellularCarrier?: string;
  dataPlan?: string;
  monthlyDataCost?: number;
  
  // Connection and status
  status: OBDStatus;
  lastConnectionAt?: Date;
  connectionFrequency: number;
  
  // Data collection settings
  collectEngineData: boolean;
  collectGpsData: boolean;
  collectDiagnosticData: boolean;
  collectFuelData: boolean;
  dataRetentionDays: number;
  
  // Performance metrics
  totalDataPoints: number;
  dataAccuracyRate: number;
  uptimePercentage: number;
  
  // Maintenance and support
  lastMaintenanceDate?: Date;
  warrantyExpiryDate?: Date;
  supportContact?: string;
  
  // Audit
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

// Vehicle Telemetry Data
export interface VehicleTelemetryData {
  id: string;
  vehicleId: string;
  deviceId: string;
  driverId?: string;
  
  // Location data
  location?: {
    latitude: number;
    longitude: number;
  };
  speedKmh?: number;
  heading?: number;
  altitudeMeters?: number;
  gpsAccuracyMeters?: number;
  
  // Engine performance
  engineRpm?: number;
  engineLoadPercent?: number;
  throttlePositionPercent?: number;
  engineTemperatureCelsius?: number;
  coolantTemperatureCelsius?: number;
  
  // Fuel and efficiency
  fuelLevelPercent?: number;
  instantaneousFuelConsumptionLph?: number;
  fuelTrimPercent?: number;
  
  // Vehicle diagnostics
  batteryVoltage?: number;
  oilPressureKpa?: number;
  intakeAirTemperatureCelsius?: number;
  massAirFlowGps?: number;
  
  // Driving behavior
  harshAccelerationCount: number;
  harshBrakingCount: number;
  harshCorneringCount: number;
  idleTimeMinutes: number;
  
  // Environmental data
  ambientTemperatureCelsius?: number;
  humidityPercent?: number;
  barometricPressureKpa?: number;
  
  // Diagnostic codes
  activeDtcCodes: string[];
  pendingDtcCodes: string[];
  
  // Data quality
  dataQualityScore: number;
  dataSource: 'obd' | 'mobile' | 'telematics' | 'manual';
  
  // Timing
  recordedAt: Date;
  receivedAt: Date;
  recordedDate: Date;
}

// Vehicle Diagnostic Event
export interface VehicleDiagnosticEvent {
  id: string;
  vehicleId: string;
  deviceId?: string;
  eventCode: string;
  
  // Event details
  eventType: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  eventDescription: string;
  
  // Location and context
  location?: {
    latitude: number;
    longitude: number;
  };
  odometerKm?: number;
  driverId?: string;
  tripId?: string;
  
  // Technical details
  diagnosticData: Record<string, any>;
  recommendedAction?: string;
  affectsSafety: boolean;
  affectsPerformance: boolean;
  
  // Event status
  status: 'active' | 'acknowledged' | 'investigating' | 'resolved' | 'false_positive';
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedBy?: string;
  resolvedAt?: Date;
  resolutionNotes?: string;
  
  // Related maintenance
  maintenanceRequired: boolean;
  relatedMaintenanceId?: string;
  
  // Timestamps
  firstOccurredAt: Date;
  lastOccurredAt: Date;
  occurrenceCount: number;
  createdAt: Date;
}

// Vehicle Performance Daily
export interface VehiclePerformanceDaily {
  id: string;
  vehicleId: string;
  performanceDate: Date;
  driverId?: string;
  
  // Trip and utilization metrics
  totalTrips: number;
  completedTrips: number;
  cancelledTrips: number;
  tripCompletionRate: number;
  
  // Time utilization
  totalOnlineMinutes: number;
  totalDrivingMinutes: number;
  totalIdleMinutes: number;
  utilizationRate: number;
  
  // Distance and efficiency
  totalDistanceKm: number;
  billableDistanceKm: number;
  emptyDistanceKm: number;
  distanceEfficiency: number;
  
  // Fuel consumption
  fuelConsumedLiters: number;
  fuelEfficiencyKmpl: number;
  fuelCostPhp: number;
  
  // Financial performance
  grossRevenuePhp: number;
  netRevenuePhp: number;
  driverEarningsPhp: number;
  vehicleExpensesPhp: number;
  
  // Quality metrics
  averageTripRating?: number;
  customerComplaints: number;
  safetyIncidents: number;
  vehicleIssues: number;
  
  // Environmental metrics
  carbonEmissionsKg: number;
  ecoScore: number;
  
  // Maintenance and reliability
  maintenanceAlertsCount: number;
  diagnosticEventsCount: number;
  breakdownIncidents: number;
  reliabilityScore: number;
  
  // OBD data quality
  obdDataPoints: number;
  obdConnectionUptimePercent: number;
  dataQualityScore: number;
  
  // Regional performance
  regionId?: string;
  topServiceAreas: any[];
  
  // Calculated metrics
  costPerKilometer: number;
  revenuePerKilometer: number;
  profitabilityScore: number;
  
  // Audit
  calculatedAt: Date;
  calculationSource: 'system' | 'manual' | 'imported';
}

// Vehicle Availability Log
export interface VehicleAvailabilityLog {
  id: string;
  vehicleId: string;
  
  // Availability period
  availableFrom: Date;
  availableUntil?: Date;
  totalAvailableMinutes?: number;
  
  // Availability type
  availabilityType: 'active' | 'maintenance' | 'offline' | 'repair' | 'inspection';
  unavailabilityReason?: string;
  
  // Location
  location?: {
    latitude: number;
    longitude: number;
  };
  regionId?: string;
  serviceAreaName?: string;
  
  // Driver assignment
  assignedDriverId?: string;
  
  // Performance during period
  tripsCompleted: number;
  revenueGenerated: number;
  distanceCoveredKm: number;
  
  // System tracking
  createdAt: Date;
  updatedAt: Date;
  loggedBy: 'system' | 'driver' | 'operator' | 'admin';
}

// Carbon Footprint
export interface VehicleCarbonFootprint {
  id: string;
  vehicleId: string;
  
  // Time period
  calculationPeriod: 'daily' | 'weekly' | 'monthly' | 'yearly';
  periodStartDate: Date;
  periodEndDate: Date;
  
  // Carbon emission sources
  fuelCombustionKg: number;
  electricityConsumptionKg: number;
  maintenanceEmissionsKg: number;
  totalEmissionsKg: number;
  
  // Activity data
  totalDistanceKm: number;
  fuelConsumedLiters: number;
  electricityConsumedKwh: number;
  
  // Efficiency metrics
  emissionsPerKm: number;
  emissionsPerTrip?: number;
  
  // Comparative analysis
  industryAverageEmissionsKg?: number;
  emissionsReductionPercentage?: number;
  
  // Carbon offset
  carbonOffsetPurchased: boolean;
  offsetAmountKg: number;
  offsetCostPhp: number;
  offsetProvider?: string;
  
  // Environmental certifications
  environmentalCertifications: string[];
  sustainabilityScore: number;
  
  // Calculation metadata
  calculationMethod: string;
  emissionFactors: Record<string, any>;
  calculatedAt: Date;
  calculatedBy: string;
}

// LTFRB Compliance
export interface LTFRBCompliance {
  id: string;
  vehicleId: string;
  
  // LTFRB franchise
  franchiseNumber: string;
  franchiseType: string;
  franchiseRoute?: string;
  franchiseIssuedDate: Date;
  franchiseExpiryDate: Date;
  franchiseStatus: 'active' | 'suspended' | 'expired' | 'revoked';
  
  // Vehicle registration
  registrationNumber: string;
  registrationType: string;
  registrationExpiryDate: Date;
  orCrExpiryDate: Date;
  
  // Inspection requirements
  lastInspectionDate?: Date;
  lastInspectionResult?: 'passed' | 'failed' | 'conditional';
  nextInspectionDueDate: Date;
  inspectionCenter?: string;
  inspectionCertificateNumber?: string;
  
  // Safety and emissions
  roadworthinessCertificate?: string;
  roadworthinessExpiry?: Date;
  emissionsTestResult?: 'passed' | 'failed' | 'pending';
  emissionsTestDate?: Date;
  emissionsCertificateNumber?: string;
  
  // Insurance compliance
  compulsoryInsurancePolicy?: string;
  compulsoryInsuranceExpiry: Date;
  comprehensiveInsurancePolicy?: string;
  comprehensiveInsuranceExpiry?: Date;
  
  // Driver authorization
  authorizedDrivers: string[];
  driverAuthorizationExpiry?: Date;
  
  // Compliance status
  overallComplianceStatus: ComplianceStatus;
  complianceScore: number;
  
  // Non-compliance issues
  activeViolations: string[];
  violationHistory: any[];
  penaltyPoints: number;
  totalFinesPhp: number;
  
  // Renewal tracking
  renewalReminderSent: boolean;
  renewalReminderDate?: Date;
  autoRenewalEnabled: boolean;
  
  // Authority contact
  ltfrbOffice?: string;
  ltoOffice?: string;
  
  // Document storage
  documents: Record<string, any>;
  
  // Audit
  createdAt: Date;
  updatedAt: Date;
  lastVerifiedAt?: Date;
  verifiedBy?: string;
}

// Compliance Alert
export interface ComplianceAlert {
  id: string;
  vehicleId: string;
  complianceId: string;
  
  // Alert details
  alertType: string;
  alertCategory: 'franchise' | 'registration' | 'inspection' | 'insurance' | 'violation';
  alertPriority: MaintenancePriority;
  
  // Alert content
  alertTitle: string;
  alertMessage: string;
  recommendedAction?: string;
  consequencesIfIgnored?: string;
  
  // Timing and escalation
  daysUntilDue?: number;
  alertLevel: number;
  escalationSchedule: any[];
  
  // Recipients
  notifyDriver: boolean;
  notifyVehicleOwner: boolean;
  notifyFleetManager: boolean;
  notifyComplianceTeam: boolean;
  
  // Alert status
  status: AlertStatus;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolvedAt?: Date;
  resolutionMethod?: string;
  
  // System tracking
  createdAt: Date;
  lastSentAt?: Date;
  sendCount: number;
  autoDismissAt?: Date;
}

// Dashboard View Types
export interface VehicleDashboardItem {
  id: string;
  vehicleCode: string;
  licensePlate: string;
  make: string;
  model: string;
  year: number;
  ownershipType: VehicleOwnershipType;
  status: VehicleStatus;
  conditionRating: VehicleCondition;
  regionId: string;
  regionName: string;
  
  // Current assignment
  currentDriverId?: string;
  currentDriverName?: string;
  assignmentType?: AssignmentType;
  
  // Performance metrics (last 30 days)
  totalTrips30d: number;
  avgUtilization30d: number;
  avgFuelEfficiency30d: number;
  totalRevenue30d: number;
  
  // Maintenance status
  nextMaintenanceDue?: Date;
  maintenanceStatus: 'current' | 'due_soon' | 'overdue';
  
  // Active alerts
  activeMaintenanceAlerts: number;
  activeComplianceAlerts: number;
  
  // OBD status
  obdStatus?: OBDStatus;
  obdLastConnection?: Date;
  
  // Compliance status
  overallComplianceStatus?: ComplianceStatus;
  franchiseExpiryDate?: Date;
  
  // Last activity
  lastUpdated: Date;
}

export interface MaintenanceSummary {
  vehicleId: string;
  vehicleCode: string;
  licensePlate: string;
  make: string;
  model: string;
  
  // Maintenance schedule status
  nextMaintenanceDue?: Date;
  maintenanceStatus: 'current' | 'due_soon' | 'upcoming' | 'overdue';
  
  // Recent maintenance history (last 6 months)
  maintenanceCount6m: number;
  maintenanceCost6m: number;
  avgMaintenanceCost: number;
  
  // Last maintenance details
  lastMaintenanceDate?: Date;
  lastMaintenanceType?: string;
  lastMaintenanceCost?: number;
  
  // Active alerts
  activeAlerts: number;
  highestAlertPriority?: MaintenancePriority;
  
  // Cost analysis
  avgCostPerService: number;
  lifetimeMaintenanceCost: number;
}

// API Request/Response Types
export interface CreateVehicleRequest {
  vehicleCode: string;
  licensePlate: string;
  vin?: string;
  make: string;
  model: string;
  year: number;
  color: string;
  category: VehicleCategory;
  fuelType: FuelType;
  engineDisplacement?: number;
  seatingCapacity: number;
  cargoCapacityKg?: number;
  ownershipType: VehicleOwnershipType;
  fleetOwnerName?: string;
  operatorOwnerName?: string;
  regionId: string;
  serviceTypes: string[];
  registrationExpiry: Date;
  insuranceExpiry?: Date;
  acquisitionCost?: number;
  obdDeviceInstalled?: boolean;
}

export interface UpdateVehicleRequest extends Partial<CreateVehicleRequest> {
  status?: VehicleStatus;
  conditionRating?: VehicleCondition;
  conditionScore?: number;
  nextMaintenanceDue?: Date;
}

export interface VehicleFilterParams {
  ownershipType?: VehicleOwnershipType;
  status?: VehicleStatus;
  regionId?: string;
  category?: VehicleCategory;
  fuelType?: FuelType;
  make?: string;
  search?: string;
  hasActiveAlerts?: boolean;
  maintenanceStatus?: 'current' | 'due_soon' | 'overdue';
  complianceStatus?: ComplianceStatus;
  obdStatus?: OBDStatus;
  assignedDriver?: string;
}

export interface AssignDriverRequest {
  driverId: string;
  assignmentType: AssignmentType;
  validFrom?: Date;
  validUntil?: Date;
  dailyRentalFee?: number;
  fuelResponsibility?: 'driver' | 'owner' | 'shared';
  maintenanceResponsibility?: 'driver' | 'owner' | 'shared';
  notes?: string;
}

export interface BulkAssignDriverRequest {
  assignments: Array<{
    vehicleId: string;
    driverId: string;
    assignmentType: AssignmentType;
    validFrom?: Date;
    validUntil?: Date;
    dailyRentalFee?: number;
  }>;
}

export interface ScheduleMaintenanceRequest {
  maintenanceType: string;
  priority: MaintenancePriority;
  scheduledDate: Date;
  scheduledStartTime?: string;
  description: string;
  serviceProvider?: string;
  serviceLocation?: string;
  estimatedDurationHours?: number;
  estimatedCost?: number;
}

export interface UpdateMaintenanceRequest extends Partial<ScheduleMaintenanceRequest> {
  status?: MaintenanceStatus;
  actualStartTime?: Date;
  actualCompletionTime?: Date;
  workPerformed?: string;
  partsReplaced?: any[];
  partsCost?: number;
  laborCost?: number;
  otherCosts?: number;
  qualityRating?: number;
  inspectionPassed?: boolean;
  inspectorNotes?: string;
}

export interface TelemetryQuery {
  vehicleId?: string;
  driverId?: string;
  startDate: Date;
  endDate: Date;
  dataTypes?: string[];
  includeLocation?: boolean;
  includeDiagnostics?: boolean;
}

export interface PerformanceAnalyticsQuery {
  vehicleIds?: string[];
  regionId?: string;
  startDate: Date;
  endDate: Date;
  metrics?: string[];
  groupBy?: 'vehicle' | 'driver' | 'region' | 'day';
}

export interface ComplianceCheckRequest {
  vehicleId: string;
  checkTypes?: string[];
  generateReport?: boolean;
}

export interface VehicleReportRequest {
  vehicleIds?: string[];
  reportType: 'performance' | 'maintenance' | 'compliance' | 'utilization' | 'carbon_footprint';
  dateRange: {
    start: Date;
    end: Date;
  };
  format?: 'json' | 'csv' | 'pdf';
  includeCharts?: boolean;
}