// Vehicle Management Test Fixtures and Mock Data
// Comprehensive test data for all vehicle management testing scenarios
// Supporting all ownership models, regions, and edge cases

import {
  Vehicle,
  VehicleDriverAssignment,
  VehicleMaintenance,
  MaintenanceAlert,
  VehicleOBDDevice,
  VehicleTelemetryData,
  VehicleDiagnosticEvent,
  VehiclePerformanceDaily,
  LTFRBCompliance,
  ComplianceAlert,
  VehicleCarbonFootprint,
  VehicleAvailabilityLog,
  VehicleDashboardItem,
  MaintenanceSummary,
  CreateVehicleRequest,
  UpdateVehicleRequest,
  AssignDriverRequest,
  ScheduleMaintenanceRequest,
  VehicleOwnershipType,
  VehicleStatus,
  VehicleCondition,
  VehicleCategory,
  FuelType,
  MaintenancePriority,
  OBDStatus,
  MaintenanceStatus,
  AlertStatus,
  ComplianceStatus
} from '@/types/vehicles';

import { EnhancedUser } from '@/types/rbac-abac';
import { VehicleRBACContext, VehiclePermission } from '@/types/vehicle-rbac';

// =====================================================
// Base Vehicle Test Data
// =====================================================

export const mockVehicles: Vehicle[] = [
  // Xpress-owned vehicle - Manila
  {
    id: 'veh-001',
    vehicleCode: 'XOT-001',
    licensePlate: 'ABC123',
    vin: 'JT2BF22K5Y0123456',
    make: 'Toyota',
    model: 'Vios',
    year: 2020,
    color: 'White',
    category: 'sedan',
    fuelType: 'gasoline',
    engineDisplacement: 1300,
    seatingCapacity: 4,
    cargoCapacityKg: 300,
    ownershipType: 'xpress_owned',
    status: 'active',
    conditionRating: 'good',
    conditionScore: 85.0,
    regionId: 'region-manila',
    serviceTypes: ['ride_4w'],
    maxTripDistanceKm: 100,
    acquisitionCost: 800000,
    currentMarketValue: 650000,
    monthlyDepreciation: 8000,
    insuranceValue: 700000,
    registrationExpiry: new Date('2025-12-31'),
    ltfrbFranchiseNumber: 'LTFRB-NCR-2024-001',
    ltfrbFranchiseExpiry: new Date('2026-06-30'),
    orNumber: 'OR-123456789',
    crNumber: 'CR-987654321',
    insuranceProvider: 'PhilCare Insurance',
    insurancePolicyNumber: 'PC-2024-001',
    insuranceExpiry: new Date('2025-03-15'),
    insuranceCoverageAmount: 1000000,
    obdDeviceInstalled: true,
    obdDeviceSerial: 'OBD-001-ABC',
    telematicsProvider: 'FleetTrack',
    telematicsPlan: 'Premium',
    lastMaintenanceDate: new Date('2024-10-15'),
    nextMaintenanceDue: new Date('2025-01-15'),
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
    emergencyContacts: [
      { name: 'Operations Center', phone: '+639171234567', relation: 'operations' }
    ],
    safetyFeatures: {
      abs: true,
      airbags: true,
      gps: true,
      dashcam: true,
      panicButton: true
    },
    accidentCount: 0,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-12-01'),
    createdBy: 'admin-001',
    updatedBy: 'ops-001',
    isActive: true
  },

  // Fleet-owned vehicle - Cebu
  {
    id: 'veh-002',
    vehicleCode: 'XOT-002',
    licensePlate: 'DEF456',
    vin: 'MHFM5BJ3AK123456',
    make: 'Honda',
    model: 'City',
    year: 2021,
    color: 'Silver',
    category: 'sedan',
    fuelType: 'gasoline',
    engineDisplacement: 1500,
    seatingCapacity: 4,
    cargoCapacityKg: 350,
    ownershipType: 'fleet_owned',
    fleetOwnerName: 'Metro Fleet Services',
    status: 'active',
    conditionRating: 'excellent',
    conditionScore: 95.0,
    regionId: 'region-cebu',
    serviceTypes: ['ride_4w'],
    maxTripDistanceKm: 120,
    acquisitionCost: 950000,
    currentMarketValue: 820000,
    monthlyDepreciation: 6000,
    registrationExpiry: new Date('2025-11-30'),
    obdDeviceInstalled: false,
    totalMaintenanceCost: 18000,
    maintenanceAlertsCount: 1,
    totalDistanceKm: 12000,
    totalTrips: 600,
    averageRating: 4.7,
    fuelEfficiencyKmpl: 16.2,
    carbonEmissionsKg: 1800,
    dailyOperatingHours: 10,
    utilizationRate: 68.0,
    availabilityScore: 88.0,
    emergencyContacts: [
      { name: 'Fleet Manager', phone: '+639321234567', relation: 'fleet_manager' }
    ],
    safetyFeatures: {
      abs: true,
      airbags: true
    },
    accidentCount: 0,
    createdAt: new Date('2024-03-20'),
    updatedAt: new Date('2024-12-01'),
    createdBy: 'fleet-admin-001',
    isActive: true
  },

  // Driver-owned vehicle - Manila (High mileage, needs maintenance)
  {
    id: 'veh-003',
    vehicleCode: 'XOT-003',
    licensePlate: 'GHI789',
    vin: 'NM4AL33E8JR123456',
    make: 'Nissan',
    model: 'Almera',
    year: 2019,
    color: 'Black',
    category: 'sedan',
    fuelType: 'gasoline',
    engineDisplacement: 1500,
    seatingCapacity: 4,
    ownershipType: 'driver_owned',
    status: 'maintenance',
    conditionRating: 'fair',
    conditionScore: 70.0,
    regionId: 'region-manila',
    serviceTypes: ['ride_4w'],
    maxTripDistanceKm: 80,
    registrationExpiry: new Date('2025-08-15'),
    obdDeviceInstalled: true,
    obdDeviceSerial: 'OBD-003-XYZ',
    totalMaintenanceCost: 42000,
    maintenanceAlertsCount: 3,
    totalDistanceKm: 45000,
    totalTrips: 1200,
    averageRating: 4.2,
    fuelEfficiencyKmpl: 13.8,
    carbonEmissionsKg: 6200,
    dailyOperatingHours: 14,
    utilizationRate: 82.0,
    availabilityScore: 75.0,
    emergencyContacts: [
      { name: 'Driver', phone: '+639181234567', relation: 'owner' }
    ],
    safetyFeatures: {
      abs: false,
      airbags: true
    },
    accidentCount: 1,
    createdAt: new Date('2023-09-10'),
    updatedAt: new Date('2024-12-01'),
    createdBy: 'driver-001',
    isActive: true
  },

  // Operator-owned vehicle - Davao
  {
    id: 'veh-004',
    vehicleCode: 'XOT-004',
    licensePlate: 'JKL012',
    vin: 'KMHLN4A54KA123456',
    make: 'Hyundai',
    model: 'Accent',
    year: 2022,
    color: 'Red',
    category: 'sedan',
    fuelType: 'gasoline',
    engineDisplacement: 1400,
    seatingCapacity: 4,
    ownershipType: 'operator_owned',
    operatorOwnerName: 'Davao Transport Co-op',
    status: 'in_service',
    conditionRating: 'good',
    conditionScore: 88.0,
    regionId: 'region-davao',
    serviceTypes: ['ride_4w'],
    maxTripDistanceKm: 90,
    registrationExpiry: new Date('2025-10-31'),
    obdDeviceInstalled: true,
    totalMaintenanceCost: 15000,
    maintenanceAlertsCount: 0,
    totalDistanceKm: 8000,
    totalTrips: 400,
    averageRating: 4.8,
    fuelEfficiencyKmpl: 15.5,
    carbonEmissionsKg: 1200,
    dailyOperatingHours: 8,
    utilizationRate: 65.0,
    availabilityScore: 95.0,
    emergencyContacts: [],
    safetyFeatures: {
      abs: true,
      airbags: true,
      gps: true
    },
    accidentCount: 0,
    createdAt: new Date('2024-06-01'),
    updatedAt: new Date('2024-12-01'),
    createdBy: 'operator-001',
    isActive: true
  },

  // Electric vehicle - Manila (Future-ready testing)
  {
    id: 'veh-005',
    vehicleCode: 'XOT-005',
    licensePlate: 'EV001',
    vin: '1FMHJ1F88LGA12345',
    make: 'BYD',
    model: 'e6',
    year: 2023,
    color: 'Blue',
    category: 'sedan',
    fuelType: 'electric',
    seatingCapacity: 4,
    ownershipType: 'xpress_owned',
    status: 'active',
    conditionRating: 'excellent',
    conditionScore: 98.0,
    regionId: 'region-manila',
    serviceTypes: ['ride_4w', 'premium'],
    maxTripDistanceKm: 150,
    acquisitionCost: 1200000,
    currentMarketValue: 1100000,
    monthlyDepreciation: 12000,
    registrationExpiry: new Date('2026-12-31'),
    obdDeviceInstalled: true,
    obdDeviceSerial: 'OBD-EV-001',
    totalMaintenanceCost: 5000,
    maintenanceAlertsCount: 0,
    totalDistanceKm: 3000,
    totalTrips: 150,
    averageRating: 4.9,
    carbonEmissionsKg: 0, // Electric vehicle
    dailyOperatingHours: 10,
    utilizationRate: 60.0,
    availabilityScore: 98.0,
    emergencyContacts: [],
    safetyFeatures: {
      abs: true,
      airbags: true,
      gps: true,
      autopilot: true,
      emergencyBraking: true
    },
    accidentCount: 0,
    createdAt: new Date('2024-11-01'),
    updatedAt: new Date('2024-12-01'),
    createdBy: 'admin-001',
    isActive: true
  }
];

// =====================================================
// Vehicle Driver Assignments
// =====================================================

export const mockVehicleAssignments: VehicleDriverAssignment[] = [
  {
    id: 'assign-001',
    vehicleId: 'veh-001',
    driverId: 'driver-001',
    assignmentType: 'primary',
    assignedAt: new Date('2024-11-01'),
    assignedBy: 'ops-001',
    validFrom: new Date('2024-11-01'),
    validUntil: new Date('2025-11-01'),
    dailyRentalFee: 500,
    fuelResponsibility: 'driver',
    maintenanceResponsibility: 'owner',
    totalTripsAssigned: 100,
    totalDistanceAssigned: 2500,
    totalEarningsAssigned: 50000,
    averageRatingAssigned: 4.6,
    isActive: true,
    notes: 'Primary driver assignment for peak hours',
    createdAt: new Date('2024-11-01'),
    updatedAt: new Date('2024-12-01')
  },
  {
    id: 'assign-002',
    vehicleId: 'veh-002',
    driverId: 'driver-002',
    assignmentType: 'secondary',
    assignedAt: new Date('2024-10-15'),
    assignedBy: 'fleet-admin-001',
    validFrom: new Date('2024-10-15'),
    dailyRentalFee: 600,
    fuelResponsibility: 'shared',
    maintenanceResponsibility: 'owner',
    totalTripsAssigned: 150,
    totalDistanceAssigned: 3200,
    totalEarningsAssigned: 75000,
    averageRatingAssigned: 4.8,
    isActive: true,
    createdAt: new Date('2024-10-15'),
    updatedAt: new Date('2024-12-01')
  }
];

// =====================================================
// Vehicle Maintenance Data
// =====================================================

export const mockMaintenanceHistory: VehicleMaintenance[] = [
  {
    id: 'maint-001',
    vehicleId: 'veh-001',
    maintenanceCode: 'PM-001',
    workOrderNumber: 'WO-2024-001',
    maintenanceType: 'Preventive Maintenance',
    priority: 'routine',
    isScheduled: true,
    serviceProvider: 'Toyota Service Center',
    serviceLocation: 'Makati City',
    serviceContact: '+639171234567',
    scheduledDate: new Date('2024-10-15'),
    scheduledStartTime: '09:00',
    actualStartTime: new Date('2024-10-15T09:00:00Z'),
    actualCompletionTime: new Date('2024-10-15T11:30:00Z'),
    estimatedDurationHours: 2.5,
    actualDurationHours: 2.5,
    preMaintenanceOdometerKm: 14500,
    postMaintenanceOdometerKm: 14500,
    preMaintenanceCondition: 'good',
    postMaintenanceCondition: 'good',
    description: 'Regular oil change and filter replacement',
    workPerformed: 'Changed engine oil, replaced oil filter, air filter, checked fluid levels',
    partsReplaced: [
      { part: 'Engine Oil', quantity: 4, unitCost: 300 },
      { part: 'Oil Filter', quantity: 1, unitCost: 250 },
      { part: 'Air Filter', quantity: 1, unitCost: 400 }
    ],
    laborHours: 2.5,
    partsCost: 2500,
    laborCost: 1500,
    otherCosts: 0,
    totalCost: 4000,
    costApprovedBy: 'ops-manager-001',
    paidBy: 'xpress',
    paymentStatus: 'paid',
    qualityRating: 5,
    followUpRequired: false,
    photos: ['maintenance-001-before.jpg', 'maintenance-001-after.jpg'],
    receipts: ['receipt-001.pdf'],
    warrantyInfo: { warranty: '3 months', parts: ['Oil Filter'] },
    nextMaintenanceType: 'Preventive Maintenance',
    nextMaintenanceDueDate: new Date('2025-01-15'),
    nextMaintenanceDueKm: 17500,
    affectsSafety: false,
    affectsCompliance: false,
    inspectionPassed: true,
    status: 'completed',
    createdAt: new Date('2024-10-01'),
    updatedAt: new Date('2024-10-15'),
    createdBy: 'ops-001',
    updatedBy: 'mechanic-001'
  },
  {
    id: 'maint-002',
    vehicleId: 'veh-003',
    maintenanceCode: 'RM-001',
    maintenanceType: 'Repair Maintenance',
    priority: 'urgent',
    isScheduled: false,
    scheduledDate: new Date('2024-12-05'),
    description: 'Engine overheating issue',
    workPerformed: 'Replaced radiator, flushed cooling system',
    laborHours: 4,
    partsCost: 5500,
    laborCost: 3000,
    otherCosts: 500,
    totalCost: 9000,
    paidBy: 'driver',
    paymentStatus: 'pending',
    affectsSafety: true,
    affectsCompliance: false,
    status: 'in_progress',
    createdAt: new Date('2024-12-03'),
    updatedAt: new Date('2024-12-05')
  }
];

export const mockMaintenanceAlerts: MaintenanceAlert[] = [
  {
    id: 'alert-001',
    vehicleId: 'veh-003',
    alertType: 'scheduled_maintenance_due',
    alertSource: 'system',
    triggerCondition: 'mileage_based',
    triggerValue: '45000',
    currentValue: '45000',
    thresholdValue: '45000',
    alertTitle: 'Scheduled Maintenance Due',
    alertDescription: 'Vehicle has reached scheduled maintenance mileage of 45,000 km',
    recommendedAction: 'Schedule comprehensive maintenance check',
    urgencyLevel: 'major',
    notifyDriver: true,
    notifyOwner: true,
    notifyOpsTeam: true,
    notificationChannels: ['email', 'sms', 'push'],
    status: 'active',
    createdAt: new Date('2024-12-01'),
    escalationLevel: 1,
    lastEscalationAt: new Date('2024-12-01')
  },
  {
    id: 'alert-002',
    vehicleId: 'veh-002',
    alertType: 'registration_expiry_warning',
    alertSource: 'system',
    triggerCondition: 'date_based',
    alertTitle: 'Registration Expiry Warning',
    alertDescription: 'Vehicle registration expires in 30 days',
    recommendedAction: 'Renew vehicle registration before expiry',
    urgencyLevel: 'minor',
    notifyDriver: false,
    notifyOwner: true,
    notifyOpsTeam: true,
    notificationChannels: ['email'],
    status: 'acknowledged',
    createdAt: new Date('2024-11-01'),
    acknowledgedAt: new Date('2024-11-02'),
    acknowledgedBy: 'fleet-admin-001',
    escalationLevel: 0
  }
];

// =====================================================
// OBD Device and Telemetry Data
// =====================================================

export const mockOBDDevices: VehicleOBDDevice[] = [
  {
    id: 'obd-001',
    deviceSerial: 'OBD-001-ABC',
    deviceModel: 'OBDLink MX+',
    manufacturer: 'OBDLink',
    firmwareVersion: '1.2.3',
    vehicleId: 'veh-001',
    installedDate: new Date('2024-01-15'),
    installedBy: 'tech-001',
    supportedProtocols: ['CAN', 'ISO9141', 'KWP2000'],
    cellularCarrier: 'Smart Communications',
    dataPlan: 'IoT 1GB',
    monthlyDataCost: 500,
    status: 'connected',
    lastConnectionAt: new Date('2024-12-05T10:30:00Z'),
    connectionFrequency: 30,
    collectEngineData: true,
    collectGpsData: true,
    collectDiagnosticData: true,
    collectFuelData: true,
    dataRetentionDays: 90,
    totalDataPoints: 45000,
    dataAccuracyRate: 98.5,
    uptimePercentage: 99.2,
    lastMaintenanceDate: new Date('2024-10-01'),
    warrantyExpiryDate: new Date('2026-01-15'),
    supportContact: '+639171234567',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-12-05'),
    isActive: true
  },
  {
    id: 'obd-003',
    deviceSerial: 'OBD-003-XYZ',
    deviceModel: 'Verizon GX440',
    manufacturer: 'Verizon',
    firmwareVersion: '2.1.0',
    vehicleId: 'veh-003',
    installedDate: new Date('2023-09-10'),
    supportedProtocols: ['CAN'],
    cellularCarrier: 'Globe Telecom',
    dataPlan: 'IoT 2GB',
    monthlyDataCost: 800,
    status: 'error',
    lastConnectionAt: new Date('2024-12-03T14:20:00Z'),
    connectionFrequency: 60,
    collectEngineData: true,
    collectGpsData: true,
    collectDiagnosticData: true,
    collectFuelData: false,
    dataRetentionDays: 60,
    totalDataPoints: 28000,
    dataAccuracyRate: 85.2,
    uptimePercentage: 87.5,
    createdAt: new Date('2023-09-10'),
    updatedAt: new Date('2024-12-03'),
    isActive: true
  }
];

export const mockTelemetryData: VehicleTelemetryData[] = [
  {
    id: 'tel-001',
    vehicleId: 'veh-001',
    deviceId: 'obd-001',
    driverId: 'driver-001',
    location: {
      latitude: 14.5995,
      longitude: 120.9842
    },
    speedKmh: 45,
    heading: 90,
    altitudeMeters: 25,
    gpsAccuracyMeters: 3.2,
    engineRpm: 2500,
    engineLoadPercent: 35.5,
    throttlePositionPercent: 15.2,
    engineTemperatureCelsius: 88,
    coolantTemperatureCelsius: 85,
    fuelLevelPercent: 65,
    instantaneousFuelConsumptionLph: 8.5,
    fuelTrimPercent: 2.1,
    batteryVoltage: 12.6,
    oilPressureKpa: 350,
    intakeAirTemperatureCelsius: 32,
    massAirFlowGps: 25.8,
    harshAccelerationCount: 0,
    harshBrakingCount: 0,
    harshCorneringCount: 0,
    idleTimeMinutes: 5,
    ambientTemperatureCelsius: 28,
    humidityPercent: 75,
    barometricPressureKpa: 101.3,
    activeDtcCodes: [],
    pendingDtcCodes: [],
    dataQualityScore: 95.8,
    dataSource: 'obd',
    recordedAt: new Date('2024-12-05T10:30:00Z'),
    receivedAt: new Date('2024-12-05T10:30:05Z'),
    recordedDate: new Date('2024-12-05')
  },
  {
    id: 'tel-002',
    vehicleId: 'veh-003',
    deviceId: 'obd-003',
    driverId: 'driver-003',
    location: {
      latitude: 14.6042,
      longitude: 120.9822
    },
    speedKmh: 0,
    engineRpm: 800,
    engineTemperatureCelsius: 105, // High temperature
    fuelLevelPercent: 25,
    harshAccelerationCount: 2,
    harshBrakingCount: 3,
    harshCorneringCount: 1,
    idleTimeMinutes: 15,
    activeDtcCodes: ['P0420', 'P0171'],
    pendingDtcCodes: ['P0301'],
    dataQualityScore: 78.5,
    dataSource: 'obd',
    recordedAt: new Date('2024-12-05T14:20:00Z'),
    receivedAt: new Date('2024-12-05T14:22:15Z'),
    recordedDate: new Date('2024-12-05')
  }
];

export const mockDiagnosticEvents: VehicleDiagnosticEvent[] = [
  {
    id: 'diag-001',
    vehicleId: 'veh-003',
    deviceId: 'obd-003',
    eventCode: 'P0420',
    eventType: 'emissions',
    severity: 'warning',
    eventDescription: 'Catalyst System Efficiency Below Threshold (Bank 1)',
    location: {
      latitude: 14.6042,
      longitude: 120.9822
    },
    odometerKm: 45000,
    driverId: 'driver-003',
    diagnosticData: {
      dtcCode: 'P0420',
      freeFrameData: '01 02 03 04',
      testResults: {
        o2Sensor: 'low_efficiency',
        catalyst: 'degraded'
      }
    },
    recommendedAction: 'Replace catalytic converter',
    affectsSafety: false,
    affectsPerformance: true,
    status: 'active',
    maintenanceRequired: true,
    firstOccurredAt: new Date('2024-12-03T14:20:00Z'),
    lastOccurredAt: new Date('2024-12-05T14:20:00Z'),
    occurrenceCount: 3,
    createdAt: new Date('2024-12-03T14:20:00Z')
  }
];

// =====================================================
// Performance and Analytics Data
// =====================================================

export const mockPerformanceData: VehiclePerformanceDaily[] = [
  {
    id: 'perf-001',
    vehicleId: 'veh-001',
    performanceDate: new Date('2024-12-04'),
    driverId: 'driver-001',
    totalTrips: 15,
    completedTrips: 14,
    cancelledTrips: 1,
    tripCompletionRate: 93.3,
    totalOnlineMinutes: 480,
    totalDrivingMinutes: 320,
    totalIdleMinutes: 45,
    utilizationRate: 75.5,
    totalDistanceKm: 180,
    billableDistanceKm: 165,
    emptyDistanceKm: 15,
    distanceEfficiency: 91.7,
    fuelConsumedLiters: 12.5,
    fuelEfficiencyKmpl: 14.4,
    fuelCostPhp: 750,
    grossRevenuePhp: 2800,
    netRevenuePhp: 2200,
    driverEarningsPhp: 1600,
    vehicleExpensesPhp: 350,
    averageTripRating: 4.6,
    customerComplaints: 0,
    safetyIncidents: 0,
    vehicleIssues: 0,
    carbonEmissionsKg: 29.5,
    ecoScore: 85,
    maintenanceAlertsCount: 0,
    diagnosticEventsCount: 0,
    breakdownIncidents: 0,
    reliabilityScore: 98,
    obdDataPoints: 960,
    obdConnectionUptimePercent: 99.5,
    dataQualityScore: 96.2,
    regionId: 'region-manila',
    topServiceAreas: [
      { area: 'Makati', trips: 5 },
      { area: 'BGC', trips: 4 },
      { area: 'Ortigas', trips: 3 }
    ],
    costPerKilometer: 6.8,
    revenuePerKilometer: 15.6,
    profitabilityScore: 89,
    calculatedAt: new Date('2024-12-05T02:00:00Z'),
    calculationSource: 'system'
  }
];

// =====================================================
// Compliance Data
// =====================================================

export const mockComplianceData: LTFRBCompliance[] = [
  {
    id: 'comp-001',
    vehicleId: 'veh-001',
    franchiseNumber: 'LTFRB-NCR-2024-001',
    franchiseType: 'TNC',
    franchiseRoute: 'Metro Manila',
    franchiseIssuedDate: new Date('2024-01-15'),
    franchiseExpiryDate: new Date('2026-06-30'),
    franchiseStatus: 'active',
    registrationNumber: 'REG-NCR-001',
    registrationType: 'Private',
    registrationExpiryDate: new Date('2025-12-31'),
    orCrExpiryDate: new Date('2025-12-31'),
    lastInspectionDate: new Date('2024-06-15'),
    lastInspectionResult: 'passed',
    nextInspectionDueDate: new Date('2025-06-15'),
    inspectionCenter: 'LTO-NCR East',
    inspectionCertificateNumber: 'INSP-2024-001',
    roadworthinessCertificate: 'RW-2024-001',
    roadworthinessExpiry: new Date('2025-06-15'),
    emissionsTestResult: 'passed',
    emissionsTestDate: new Date('2024-06-15'),
    emissionsCertificateNumber: 'EMI-2024-001',
    compulsoryInsurancePolicy: 'CTPL-2024-001',
    compulsoryInsuranceExpiry: new Date('2025-03-15'),
    comprehensiveInsurancePolicy: 'COMP-2024-001',
    comprehensiveInsuranceExpiry: new Date('2025-03-15'),
    authorizedDrivers: ['driver-001'],
    driverAuthorizationExpiry: new Date('2025-12-31'),
    overallComplianceStatus: 'compliant',
    complianceScore: 95,
    activeViolations: [],
    violationHistory: [],
    penaltyPoints: 0,
    totalFinesPhp: 0,
    renewalReminderSent: false,
    autoRenewalEnabled: true,
    ltfrbOffice: 'LTFRB-NCR',
    ltoOffice: 'LTO-NCR East',
    documents: {
      or: 'or-001.pdf',
      cr: 'cr-001.pdf',
      franchise: 'franchise-001.pdf',
      insurance: 'insurance-001.pdf'
    },
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-12-01'),
    lastVerifiedAt: new Date('2024-12-01'),
    verifiedBy: 'compliance-001'
  }
];

// =====================================================
// User Test Data for RBAC Testing
// =====================================================

export const mockUsers: Record<string, EnhancedUser> = {
  ground_ops: {
    id: 'user-ground-001',
    email: 'ground.ops@xpress.ph',
    firstName: 'Ground',
    lastName: 'Operator',
    timezone: 'Asia/Manila',
    locale: 'en-PH',
    status: 'active',
    roles: [{
      id: 'role-ground-001',
      userId: 'user-ground-001',
      roleId: 'ground-ops',
      role: {
        id: 'ground-ops',
        name: 'ground_ops',
        displayName: 'Ground Operations',
        level: 10,
        permissions: [
          'view_vehicles_basic',
          'assign_driver_to_vehicle',
          'view_vehicle_location',
          'update_vehicle_status'
        ],
        inheritsFrom: [],
        isSystem: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      allowedRegions: ['region-manila'],
      validFrom: new Date('2024-01-01'),
      assignedAt: new Date('2024-01-01'),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }],
    allowedRegions: ['region-manila'],
    piiScope: 'none',
    mfaEnabled: false,
    trustedDevices: [],
    failedLoginAttempts: 0,
    loginCount: 250,
    permissions: [],
    temporaryAccess: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
    isActive: true
  },

  ops_manager: {
    id: 'user-ops-001',
    email: 'ops.manager@xpress.ph',
    firstName: 'Operations',
    lastName: 'Manager',
    timezone: 'Asia/Manila',
    locale: 'en-PH',
    status: 'active',
    roles: [{
      id: 'role-ops-001',
      userId: 'user-ops-001',
      roleId: 'ops-manager',
      role: {
        id: 'ops-manager',
        name: 'ops_manager',
        displayName: 'Operations Manager',
        level: 30,
        permissions: [
          'view_vehicles_detailed',
          'create_vehicles',
          'update_vehicles',
          'schedule_vehicle_maintenance',
          'view_vehicle_performance_data',
          'manage_vehicle_assignments'
        ],
        inheritsFrom: [],
        isSystem: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      allowedRegions: ['region-manila', 'region-cebu'],
      validFrom: new Date('2024-01-01'),
      assignedAt: new Date('2024-01-01'),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }],
    allowedRegions: ['region-manila', 'region-cebu'],
    piiScope: 'masked',
    mfaEnabled: true,
    trustedDevices: [],
    failedLoginAttempts: 0,
    loginCount: 180,
    permissions: [],
    temporaryAccess: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
    isActive: true
  },

  regional_manager: {
    id: 'user-regional-001',
    email: 'regional.manager@xpress.ph',
    firstName: 'Regional',
    lastName: 'Manager',
    timezone: 'Asia/Manila',
    locale: 'en-PH',
    status: 'active',
    roles: [{
      id: 'role-regional-001',
      userId: 'user-regional-001',
      roleId: 'regional-manager',
      role: {
        id: 'regional-manager',
        name: 'regional_manager',
        displayName: 'Regional Manager',
        level: 40,
        permissions: [
          'manage_regional_vehicles',
          'approve_vehicle_registrations',
          'view_regional_fleet_analytics',
          'approve_vehicle_decommissioning',
          'override_vehicle_restrictions'
        ],
        inheritsFrom: [],
        isSystem: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      allowedRegions: ['region-manila', 'region-cebu'],
      validFrom: new Date('2024-01-01'),
      assignedAt: new Date('2024-01-01'),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }],
    allowedRegions: ['region-manila', 'region-cebu'],
    piiScope: 'full',
    mfaEnabled: true,
    trustedDevices: [],
    failedLoginAttempts: 0,
    loginCount: 120,
    permissions: [],
    temporaryAccess: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
    isActive: true
  },

  executive: {
    id: 'user-exec-001',
    email: 'executive@xpress.ph',
    firstName: 'Executive',
    lastName: 'Officer',
    timezone: 'Asia/Manila',
    locale: 'en-PH',
    status: 'active',
    roles: [{
      id: 'role-exec-001',
      userId: 'user-exec-001',
      roleId: 'executive',
      role: {
        id: 'executive',
        name: 'executive',
        displayName: 'Executive',
        level: 60,
        permissions: [
          'approve_strategic_vehicle_investments',
          'view_global_fleet_analytics',
          'override_all_vehicle_restrictions',
          'access_executive_vehicle_reports'
        ],
        inheritsFrom: [],
        isSystem: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      allowedRegions: ['*'],
      validFrom: new Date('2024-01-01'),
      assignedAt: new Date('2024-01-01'),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }],
    allowedRegions: ['*'],
    piiScope: 'full',
    mfaEnabled: true,
    trustedDevices: [],
    failedLoginAttempts: 0,
    loginCount: 45,
    permissions: [],
    temporaryAccess: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
    isActive: true
  }
};

// =====================================================
// RBAC Context Test Data
// =====================================================

export const mockRBACContexts: Record<string, VehicleRBACContext> = {
  xpress_owned_manila: {
    vehicleId: 'veh-001',
    regionId: 'region-manila',
    ownershipType: 'xpress_owned',
    dataClass: 'internal',
    operationType: 'read',
    containsPII: false
  },
  fleet_owned_cebu: {
    vehicleId: 'veh-002',
    regionId: 'region-cebu',
    ownershipType: 'fleet_owned',
    dataClass: 'confidential',
    operationType: 'read',
    containsPII: true
  },
  driver_owned_maintenance: {
    vehicleId: 'veh-003',
    regionId: 'region-manila',
    ownershipType: 'driver_owned',
    dataClass: 'internal',
    operationType: 'write',
    containsPII: false
  },
  restricted_cross_region: {
    vehicleId: 'veh-004',
    regionId: 'region-davao',
    ownershipType: 'operator_owned',
    dataClass: 'restricted',
    operationType: 'read',
    containsPII: true,
    caseId: 'CASE-001',
    emergencyOverride: true
  }
};

// =====================================================
// Request/Response Test Data
// =====================================================

export const mockCreateVehicleRequests: Record<string, CreateVehicleRequest> = {
  valid_xpress_owned: {
    vehicleCode: 'XOT-TEST-001',
    licensePlate: 'TEST123',
    make: 'Toyota',
    model: 'Vios',
    year: 2023,
    color: 'White',
    category: 'sedan',
    fuelType: 'gasoline',
    seatingCapacity: 4,
    ownershipType: 'xpress_owned',
    regionId: 'region-manila',
    serviceTypes: ['ride_4w'],
    registrationExpiry: new Date('2025-12-31'),
    acquisitionCost: 800000,
    obdDeviceInstalled: true
  },
  valid_fleet_owned: {
    vehicleCode: 'XOT-TEST-002',
    licensePlate: 'FLEET01',
    make: 'Honda',
    model: 'City',
    year: 2022,
    color: 'Silver',
    category: 'sedan',
    fuelType: 'gasoline',
    seatingCapacity: 4,
    ownershipType: 'fleet_owned',
    fleetOwnerName: 'Test Fleet Services',
    regionId: 'region-cebu',
    serviceTypes: ['ride_4w'],
    registrationExpiry: new Date('2025-10-31')
  },
  invalid_missing_fields: {
    vehicleCode: 'XOT-INVALID',
    licensePlate: 'INVALID'
    // Missing required fields
  } as CreateVehicleRequest,
  invalid_year_range: {
    vehicleCode: 'XOT-YEAR-INVALID',
    licensePlate: 'YEAR01',
    make: 'Toyota',
    model: 'Vios',
    year: 1980, // Too old
    color: 'White',
    category: 'sedan',
    fuelType: 'gasoline',
    seatingCapacity: 4,
    ownershipType: 'xpress_owned',
    regionId: 'region-manila',
    serviceTypes: ['ride_4w'],
    registrationExpiry: new Date('2025-12-31')
  }
};

// =====================================================
// Dashboard and Summary Test Data
// =====================================================

export const mockDashboardData: VehicleDashboardItem[] = mockVehicles.map(vehicle => ({
  id: vehicle.id,
  vehicleCode: vehicle.vehicleCode,
  licensePlate: vehicle.licensePlate,
  make: vehicle.make,
  model: vehicle.model,
  year: vehicle.year,
  ownershipType: vehicle.ownershipType,
  status: vehicle.status,
  conditionRating: vehicle.conditionRating,
  regionId: vehicle.regionId,
  regionName: vehicle.regionId === 'region-manila' ? 'Metro Manila' : 
              vehicle.regionId === 'region-cebu' ? 'Cebu' : 'Davao',
  currentDriverId: mockVehicleAssignments.find(a => a.vehicleId === vehicle.id)?.driverId,
  currentDriverName: mockVehicleAssignments.find(a => a.vehicleId === vehicle.id)?.driverId === 'driver-001' ? 'Juan Dela Cruz' : 'Maria Santos',
  assignmentType: mockVehicleAssignments.find(a => a.vehicleId === vehicle.id)?.assignmentType,
  totalTrips30d: Math.floor(vehicle.totalTrips / 10),
  avgUtilization30d: vehicle.utilizationRate,
  avgFuelEfficiency30d: vehicle.fuelEfficiencyKmpl || 0,
  totalRevenue30d: vehicle.totalTrips * 250,
  nextMaintenanceDue: vehicle.nextMaintenanceDue,
  maintenanceStatus: vehicle.nextMaintenanceDue && vehicle.nextMaintenanceDue < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) 
    ? 'due_soon' : 'current',
  activeMaintenanceAlerts: vehicle.maintenanceAlertsCount,
  activeComplianceAlerts: 0,
  obdStatus: vehicle.obdDeviceInstalled ? 'connected' : undefined,
  obdLastConnection: vehicle.obdDeviceInstalled ? new Date() : undefined,
  overallComplianceStatus: 'compliant',
  franchiseExpiryDate: vehicle.ltfrbFranchiseExpiry,
  lastUpdated: vehicle.updatedAt
}));

// =====================================================
// Error Test Data
// =====================================================

export const mockErrorScenarios = {
  network_timeout: {
    type: 'network',
    message: 'Request timeout',
    code: 'TIMEOUT',
    statusCode: 408
  },
  database_connection: {
    type: 'database',
    message: 'Database connection failed',
    code: 'DB_CONNECTION_ERROR',
    statusCode: 503
  },
  validation_error: {
    type: 'validation',
    message: 'Invalid input data',
    code: 'VALIDATION_ERROR',
    statusCode: 400,
    details: [
      { field: 'year', message: 'Year must be between 1990 and 2024' },
      { field: 'seatingCapacity', message: 'Seating capacity must be greater than 0' }
    ]
  },
  permission_denied: {
    type: 'authorization',
    message: 'Access denied',
    code: 'ACCESS_DENIED',
    statusCode: 403
  },
  rate_limit_exceeded: {
    type: 'rate_limit',
    message: 'Rate limit exceeded',
    code: 'RATE_LIMIT_EXCEEDED',
    statusCode: 429,
    resetTime: Date.now() + 60000
  }
};

// =====================================================
// Philippines-Specific Test Data
// =====================================================

export const philippinesTestData = {
  regions: [
    { id: 'region-manila', name: 'Metro Manila', provinces: ['Manila', 'Makati', 'Quezon City', 'Pasig'] },
    { id: 'region-cebu', name: 'Cebu', provinces: ['Cebu City', 'Mandaue', 'Lapu-Lapu'] },
    { id: 'region-davao', name: 'Davao', provinces: ['Davao City', 'Tagum', 'Digos'] },
    { id: 'region-baguio', name: 'Baguio', provinces: ['Baguio City', 'La Trinidad'] }
  ],
  ltfrbOffices: [
    { region: 'region-manila', office: 'LTFRB-NCR', address: 'East Avenue, Quezon City' },
    { region: 'region-cebu', office: 'LTFRB-VII', address: 'N. Bacalso Avenue, Cebu City' },
    { region: 'region-davao', office: 'LTFRB-XI', address: 'Bangoy Street, Davao City' }
  ],
  plateNumberFormats: [
    { region: 'region-manila', format: '[A-Z]{3}[0-9]{3,4}' },
    { region: 'region-cebu', format: '[A-Z]{3}[0-9]{3,4}' },
    { region: 'region-davao', format: '[A-Z]{3}[0-9]{3,4}' }
  ],
  numberCodingSchemes: [
    { region: 'region-manila', scheme: 'unified_vehicular_volume_reduction_program' },
    { region: 'region-cebu', scheme: 'no_coding' },
    { region: 'region-davao', scheme: 'modified_coding' }
  ]
};

// Export all test data
export default {
  mockVehicles,
  mockVehicleAssignments,
  mockMaintenanceHistory,
  mockMaintenanceAlerts,
  mockOBDDevices,
  mockTelemetryData,
  mockDiagnosticEvents,
  mockPerformanceData,
  mockComplianceData,
  mockUsers,
  mockRBACContexts,
  mockCreateVehicleRequests,
  mockDashboardData,
  mockErrorScenarios,
  philippinesTestData
};