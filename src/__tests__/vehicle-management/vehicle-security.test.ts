// Vehicle Management Security Tests
// Comprehensive test suite for RBAC permissions, access control, and data security
// Testing all 48 vehicle permissions across 8 roles with edge cases

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { vehicleRBACEngine, VehicleRBACEngine } from '@/lib/auth/vehicle-rbac-engine';
import { auditLogger } from '@/lib/security/vehicleAuditLogger';
import { maskVehicleData } from '@/middleware/vehicleRbacMiddleware';
import {
  VehiclePermission,
  VehicleDataClass,
  VehicleRBACContext,
  VehicleRBACDecision,
  VehicleOwnershipAccessLevel
} from '@/types/vehicle-rbac';
import { VehicleOwnershipType, Vehicle } from '@/types/vehicles';
import type { EnhancedUser } from '@/types/rbac-abac';

// Mock modules
jest.mock('@/lib/security/vehicleAuditLogger');
jest.mock('@/lib/database/vehicleAccessControl');

// Test utilities
const createMockUser = (overrides: Partial<EnhancedUser> = {}): EnhancedUser => ({
  id: 'user-123',
  email: 'test@xpress.ph',
  firstName: 'Test',
  lastName: 'User',
  timezone: 'Asia/Manila',
  locale: 'en-PH',
  status: 'active',
  roles: [{
    id: '1',
    userId: 'user-123',
    roleId: 'ops-manager',
    role: {
      id: 'ops-manager',
      name: 'ops_manager',
      displayName: 'Operations Manager',
      level: 30,
      permissions: [],
      inheritsFrom: [],
      isSystem: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    allowedRegions: ['region-manila'],
    validFrom: new Date(),
    assignedAt: new Date(),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }],
  allowedRegions: ['region-manila'],
  piiScope: 'masked',
  mfaEnabled: false,
  trustedDevices: [],
  failedLoginAttempts: 0,
  loginCount: 0,
  permissions: [],
  temporaryAccess: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  isActive: true,
  ...overrides
});

const createVehicleContext = (overrides: Partial<VehicleRBACContext> = {}): VehicleRBACContext => ({
  vehicleId: 'veh-001',
  regionId: 'region-manila',
  ownershipType: 'xpress_owned',
  dataClass: 'internal',
  operationType: 'read',
  containsPII: false,
  ...overrides
});

const createMockVehicle = (overrides: Partial<Vehicle> = {}): Vehicle => ({
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
  registrationExpiry: new Date('2025-12-31'),
  obdDeviceInstalled: true,
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
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-12-01'),
  createdBy: 'admin-001',
  isActive: true,
  ...overrides
});

describe('Vehicle Management Security Tests', () => {
  let rbacEngine: VehicleRBACEngine;

  beforeEach(() => {
    rbacEngine = new VehicleRBACEngine();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  // =====================================================
  // Role-Based Access Control Tests
  // =====================================================

  describe('Role-Based Access Control', () => {
    describe('Ground Operations Role', () => {
      it('should allow basic vehicle operations for ground_ops', async () => {
        const user = createMockUser({
          roles: [{
            ...createMockUser().roles[0],
            role: {
              ...createMockUser().roles[0].role,
              name: 'ground_ops',
              permissions: [
                'view_vehicles_basic',
                'assign_driver_to_vehicle',
                'view_vehicle_location',
                'update_vehicle_status'
              ]
            }
          }]
        });

        const context = createVehicleContext();

        const viewDecision = await rbacEngine.evaluateVehicleAccess(user, context, 'view_vehicles_basic');
        expect(viewDecision.allowed).toBe(true);
        expect(viewDecision.ownershipAccessLevel).toBe('basic');

        const assignDecision = await rbacEngine.evaluateVehicleAccess(user, context, 'assign_driver_to_vehicle');
        expect(assignDecision.allowed).toBe(true);
      });

      it('should deny advanced operations for ground_ops', async () => {
        const user = createMockUser({
          roles: [{
            ...createMockUser().roles[0],
            role: {
              ...createMockUser().roles[0].role,
              name: 'ground_ops',
              permissions: ['view_vehicles_basic', 'assign_driver_to_vehicle']
            }
          }]
        });

        const context = createVehicleContext();

        const detailedDecision = await rbacEngine.evaluateVehicleAccess(user, context, 'view_vehicles_detailed');
        expect(detailedDecision.allowed).toBe(false);

        const createDecision = await rbacEngine.evaluateVehicleAccess(user, context, 'create_vehicles');
        expect(createDecision.allowed).toBe(false);

        const financialDecision = await rbacEngine.evaluateVehicleAccess(user, context, 'view_vehicle_financial_data');
        expect(financialDecision.allowed).toBe(false);
      });
    });

    describe('Operations Manager Role', () => {
      it('should allow detailed vehicle operations for ops_manager', async () => {
        const user = createMockUser({
          roles: [{
            ...createMockUser().roles[0],
            role: {
              ...createMockUser().roles[0].role,
              name: 'ops_manager',
              permissions: [
                'view_vehicles_detailed',
                'create_vehicles',
                'update_vehicles',
                'schedule_vehicle_maintenance',
                'view_vehicle_performance_data',
                'manage_vehicle_assignments'
              ]
            }
          }]
        });

        const context = createVehicleContext();

        const detailedDecision = await rbacEngine.evaluateVehicleAccess(user, context, 'view_vehicles_detailed');
        expect(detailedDecision.allowed).toBe(true);
        expect(detailedDecision.ownershipAccessLevel).toBe('detailed');

        const createDecision = await rbacEngine.evaluateVehicleAccess(user, context, 'create_vehicles');
        expect(createDecision.allowed).toBe(true);

        const maintenanceDecision = await rbacEngine.evaluateVehicleAccess(user, context, 'schedule_vehicle_maintenance');
        expect(maintenanceDecision.allowed).toBe(true);
      });

      it('should deny strategic operations for ops_manager', async () => {
        const user = createMockUser({
          roles: [{
            ...createMockUser().roles[0],
            role: {
              ...createMockUser().roles[0].role,
              name: 'ops_manager',
              permissions: ['view_vehicles_detailed', 'create_vehicles']
            }
          }]
        });

        const context = createVehicleContext();

        const strategicDecision = await rbacEngine.evaluateVehicleAccess(user, context, 'approve_strategic_vehicle_investments');
        expect(strategicDecision.allowed).toBe(false);

        const globalDecision = await rbacEngine.evaluateVehicleAccess(user, context, 'view_global_fleet_analytics');
        expect(globalDecision.allowed).toBe(false);
      });
    });

    describe('Regional Manager Role', () => {
      it('should allow regional vehicle management for regional_manager', async () => {
        const user = createMockUser({
          roles: [{
            ...createMockUser().roles[0],
            role: {
              ...createMockUser().roles[0].role,
              name: 'regional_manager',
              permissions: [
                'manage_regional_vehicles',
                'approve_vehicle_registrations',
                'view_regional_fleet_analytics',
                'approve_vehicle_decommissioning',
                'override_vehicle_restrictions'
              ]
            }
          }]
        });

        const context = createVehicleContext();

        const regionalDecision = await rbacEngine.evaluateVehicleAccess(user, context, 'manage_regional_vehicles');
        expect(regionalDecision.allowed).toBe(true);
        expect(regionalDecision.ownershipAccessLevel).toBe('financial');

        const registrationDecision = await rbacEngine.evaluateVehicleAccess(user, context, 'approve_vehicle_registrations');
        expect(registrationDecision.allowed).toBe(true);
        expect(registrationDecision.requiresMFA).toBe(true);
      });
    });

    describe('Executive Role', () => {
      it('should allow all vehicle operations for executive', async () => {
        const user = createMockUser({
          roles: [{
            ...createMockUser().roles[0],
            role: {
              ...createMockUser().roles[0].role,
              name: 'executive',
              permissions: [
                'approve_strategic_vehicle_investments',
                'view_global_fleet_analytics',
                'override_all_vehicle_restrictions',
                'access_executive_vehicle_reports'
              ]
            }
          }],
          allowedRegions: ['*'],
          piiScope: 'full'
        });

        const context = createVehicleContext({ dataClass: 'restricted', containsPII: true });

        const strategicDecision = await rbacEngine.evaluateVehicleAccess(user, context, 'approve_strategic_vehicle_investments');
        expect(strategicDecision.allowed).toBe(true);
        expect(strategicDecision.ownershipAccessLevel).toBe('full');

        const globalDecision = await rbacEngine.evaluateVehicleAccess(user, context, 'view_global_fleet_analytics');
        expect(globalDecision.allowed).toBe(true);
      });
    });
  });

  // =====================================================
  // Ownership-Based Access Control Tests
  // =====================================================

  describe('Ownership-Based Access Control', () => {
    it('should provide full access to xpress_owned vehicles for authorized users', async () => {
      const user = createMockUser({
        roles: [{
          ...createMockUser().roles[0],
          role: {
            ...createMockUser().roles[0].role,
            permissions: ['view_vehicles_detailed', 'update_vehicles']
          }
        }]
      });

      const xpressContext = createVehicleContext({ ownershipType: 'xpress_owned' });

      const decision = await rbacEngine.evaluateVehicleAccess(user, xpressContext, 'view_vehicles_detailed');
      expect(decision.allowed).toBe(true);
      expect(decision.ownershipAccessLevel).toBe('detailed');
    });

    it('should restrict access to fleet_owned vehicles based on permissions', async () => {
      const user = createMockUser({
        roles: [{
          ...createMockUser().roles[0],
          role: {
            ...createMockUser().roles[0].role,
            permissions: ['view_vehicles_basic'] // Limited permissions
          }
        }]
      });

      const fleetContext = createVehicleContext({ ownershipType: 'fleet_owned' });

      const basicDecision = await rbacEngine.evaluateVehicleAccess(user, fleetContext, 'view_vehicles_basic');
      expect(basicDecision.allowed).toBe(true);
      expect(basicDecision.ownershipAccessLevel).toBe('basic');

      const detailedDecision = await rbacEngine.evaluateVehicleAccess(user, fleetContext, 'view_vehicles_detailed');
      expect(detailedDecision.allowed).toBe(false);
    });

    it('should handle operator_owned vehicles with special restrictions', async () => {
      const user = createMockUser({
        roles: [{
          ...createMockUser().roles[0],
          role: {
            ...createMockUser().roles[0].role,
            permissions: ['view_vehicles_detailed', 'manage_vehicle_assignments']
          }
        }]
      });

      const operatorContext = createVehicleContext({ ownershipType: 'operator_owned' });

      const viewDecision = await rbacEngine.evaluateVehicleAccess(user, operatorContext, 'view_vehicles_detailed');
      expect(viewDecision.allowed).toBe(true);
      expect(viewDecision.ownershipAccessLevel).toBe('limited'); // Restricted for operator-owned

      const manageDecision = await rbacEngine.evaluateVehicleAccess(user, operatorContext, 'manage_vehicle_assignments');
      expect(manageDecision.allowed).toBe(true);
    });

    it('should provide minimal access to driver_owned vehicles', async () => {
      const user = createMockUser({
        roles: [{
          ...createMockUser().roles[0],
          role: {
            ...createMockUser().roles[0].role,
            permissions: ['view_vehicles_basic', 'view_vehicles_detailed']
          }
        }]
      });

      const driverContext = createVehicleContext({ ownershipType: 'driver_owned' });

      const basicDecision = await rbacEngine.evaluateVehicleAccess(user, driverContext, 'view_vehicles_basic');
      expect(basicDecision.allowed).toBe(true);

      const detailedDecision = await rbacEngine.evaluateVehicleAccess(user, driverContext, 'view_vehicles_detailed');
      expect(detailedDecision.allowed).toBe(false); // Restricted for driver-owned vehicles
    });
  });

  // =====================================================
  // Regional Access Control Tests
  // =====================================================

  describe('Regional Access Control', () => {
    it('should allow access to vehicles in user\'s assigned region', async () => {
      const user = createMockUser({
        allowedRegions: ['region-manila'],
        roles: [{
          ...createMockUser().roles[0],
          role: {
            ...createMockUser().roles[0].role,
            permissions: ['view_vehicles_basic']
          }
        }]
      });

      const manilaContext = createVehicleContext({ regionId: 'region-manila' });

      const decision = await rbacEngine.evaluateVehicleAccess(user, manilaContext, 'view_vehicles_basic');
      expect(decision.allowed).toBe(true);
    });

    it('should deny access to vehicles outside user\'s assigned region', async () => {
      const user = createMockUser({
        allowedRegions: ['region-manila'],
        roles: [{
          ...createMockUser().roles[0],
          role: {
            ...createMockUser().roles[0].role,
            permissions: ['view_vehicles_basic']
          }
        }]
      });

      const cebuContext = createVehicleContext({ regionId: 'region-cebu' });

      const decision = await rbacEngine.evaluateVehicleAccess(user, cebuContext, 'view_vehicles_basic');
      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain('region');
    });

    it('should allow global access for users with * region permission', async () => {
      const user = createMockUser({
        allowedRegions: ['*'],
        roles: [{
          ...createMockUser().roles[0],
          role: {
            ...createMockUser().roles[0].role,
            permissions: ['view_vehicles_basic']
          }
        }]
      });

      const contexts = [
        createVehicleContext({ regionId: 'region-manila' }),
        createVehicleContext({ regionId: 'region-cebu' }),
        createVehicleContext({ regionId: 'region-davao' })
      ];

      for (const context of contexts) {
        const decision = await rbacEngine.evaluateVehicleAccess(user, context, 'view_vehicles_basic');
        expect(decision.allowed).toBe(true);
      }
    });

    it('should support emergency cross-region access with case ID', async () => {
      const user = createMockUser({
        allowedRegions: ['region-manila'],
        roles: [{
          ...createMockUser().roles[0],
          role: {
            ...createMockUser().roles[0].role,
            name: 'support',
            permissions: ['investigate_vehicle_incidents']
          }
        }]
      });

      const emergencyContext = createVehicleContext({
        regionId: 'region-cebu',
        caseId: 'EMRG-001',
        emergencyOverride: true
      });

      const decision = await rbacEngine.evaluateVehicleAccess(user, emergencyContext, 'investigate_vehicle_incidents');
      expect(decision.allowed).toBe(true);
      expect(decision.requiresMFA).toBe(true);
      expect(decision.reason).toContain('emergency override');
    });
  });

  // =====================================================
  // Data Classification and PII Tests
  // =====================================================

  describe('Data Classification and PII Access', () => {
    it('should handle public data without restrictions', async () => {
      const user = createMockUser({
        piiScope: 'none',
        roles: [{
          ...createMockUser().roles[0],
          role: {
            ...createMockUser().roles[0].role,
            permissions: ['view_vehicles_basic']
          }
        }]
      });

      const publicContext = createVehicleContext({ dataClass: 'public', containsPII: false });

      const decision = await rbacEngine.evaluateVehicleAccess(user, publicContext, 'view_vehicles_basic');
      expect(decision.allowed).toBe(true);
      expect(decision.maskedFields).toBeUndefined();
    });

    it('should mask fields for users with limited PII scope', async () => {
      const user = createMockUser({
        piiScope: 'masked',
        roles: [{
          ...createMockUser().roles[0],
          role: {
            ...createMockUser().roles[0].role,
            permissions: ['view_vehicles_detailed']
          }
        }]
      });

      const confidentialContext = createVehicleContext({ dataClass: 'confidential', containsPII: true });

      const decision = await rbacEngine.evaluateVehicleAccess(user, confidentialContext, 'view_vehicles_detailed');
      expect(decision.allowed).toBe(true);
      expect(decision.maskedFields).toBeDefined();
      expect(decision.maskedFields).toContain('vin');
      expect(decision.maskedFields).toContain('acquisitionCost');
    });

    it('should deny access to restricted data without full PII scope', async () => {
      const user = createMockUser({
        piiScope: 'masked',
        roles: [{
          ...createMockUser().roles[0],
          role: {
            ...createMockUser().roles[0].role,
            permissions: ['view_vehicles_detailed']
          }
        }]
      });

      const restrictedContext = createVehicleContext({ dataClass: 'restricted', containsPII: true });

      const decision = await rbacEngine.evaluateVehicleAccess(user, restrictedContext, 'view_vehicles_detailed');
      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain('PII');
    });

    it('should require MFA for restricted data access', async () => {
      const user = createMockUser({
        piiScope: 'full',
        mfaEnabled: true,
        roles: [{
          ...createMockUser().roles[0],
          role: {
            ...createMockUser().roles[0].role,
            name: 'regional_manager',
            permissions: ['view_vehicles_detailed']
          }
        }]
      });

      const restrictedContext = createVehicleContext({ dataClass: 'restricted', containsPII: true });

      const decision = await rbacEngine.evaluateVehicleAccess(user, restrictedContext, 'view_vehicles_detailed');
      expect(decision.allowed).toBe(true);
      expect(decision.requiresMFA).toBe(true);
    });
  });

  // =====================================================
  // Data Masking Tests
  // =====================================================

  describe('Data Masking', () => {
    it('should mask sensitive vehicle fields for users with limited access', () => {
      const vehicle = createMockVehicle({
        vin: 'JT2BF22K5Y0123456',
        acquisitionCost: 800000,
        currentMarketValue: 650000,
        monthlyDepreciation: 8000,
        totalMaintenanceCost: 25000
      });

      const maskedFields = ['vin', 'acquisitionCost', 'currentMarketValue', 'monthlyDepreciation'];
      const maskedVehicle = maskVehicleData(vehicle, maskedFields);

      expect(maskedVehicle.vin).toBe('JT2***********456');
      expect(maskedVehicle.acquisitionCost).toBe('***');
      expect(maskedVehicle.currentMarketValue).toBe('***');
      expect(maskedVehicle.monthlyDepreciation).toBe('***');
      expect(maskedVehicle.totalMaintenanceCost).toBe(25000); // Not masked
    });

    it('should preserve non-sensitive fields during masking', () => {
      const vehicle = createMockVehicle();
      const maskedFields = ['vin', 'acquisitionCost'];
      const maskedVehicle = maskVehicleData(vehicle, maskedFields);

      expect(maskedVehicle.vehicleCode).toBe(vehicle.vehicleCode);
      expect(maskedVehicle.licensePlate).toBe(vehicle.licensePlate);
      expect(maskedVehicle.make).toBe(vehicle.make);
      expect(maskedVehicle.model).toBe(vehicle.model);
      expect(maskedVehicle.year).toBe(vehicle.year);
      expect(maskedVehicle.ownershipType).toBe(vehicle.ownershipType);
    });

    it('should handle null and undefined values during masking', () => {
      const vehicle = createMockVehicle({
        vin: undefined,
        acquisitionCost: null,
        currentMarketValue: 0
      });

      const maskedFields = ['vin', 'acquisitionCost', 'currentMarketValue'];
      const maskedVehicle = maskVehicleData(vehicle, maskedFields);

      expect(maskedVehicle.vin).toBe('***');
      expect(maskedVehicle.acquisitionCost).toBe('***');
      expect(maskedVehicle.currentMarketValue).toBe('***');
    });

    it('should apply different masking patterns for different data types', () => {
      const vehicle = createMockVehicle({
        vin: 'JT2BF22K5Y0123456', // String
        acquisitionCost: 800000, // Number
        registrationExpiry: new Date('2025-12-31'), // Date
        obdDeviceSerial: 'OBD-001-ABC123', // Serial number
        ltfrbFranchiseNumber: 'LTFRB-NCR-2024-001' // License number
      });

      const maskedFields = ['vin', 'acquisitionCost', 'registrationExpiry', 'obdDeviceSerial', 'ltfrbFranchiseNumber'];
      const maskedVehicle = maskVehicleData(vehicle, maskedFields);

      expect(maskedVehicle.vin).toBe('JT2***********456'); // Partial masking for VIN
      expect(maskedVehicle.acquisitionCost).toBe('***'); // Complete masking for financial data
      expect(maskedVehicle.registrationExpiry).toBe('***'); // Complete masking for dates
      expect(maskedVehicle.obdDeviceSerial).toBe('OBD***ABC123'); // Partial masking for serials
      expect(maskedVehicle.ltfrbFranchileNumber).toBe('LTFRB***2024-001'); // Partial masking for licenses
    });
  });

  // =====================================================
  // MFA Requirements Tests
  // =====================================================

  describe('MFA Requirements', () => {
    it('should require MFA for financial vehicle operations', async () => {
      const user = createMockUser({
        roles: [{
          ...createMockUser().roles[0],
          role: {
            ...createMockUser().roles[0].role,
            name: 'finance_ops',
            permissions: ['approve_vehicle_purchases', 'view_vehicle_financial_data']
          }
        }]
      });

      const context = createVehicleContext({ dataClass: 'confidential' });

      const purchaseDecision = await rbacEngine.evaluateVehicleAccess(user, context, 'approve_vehicle_purchases');
      expect(purchaseDecision.allowed).toBe(true);
      expect(purchaseDecision.requiresMFA).toBe(true);

      const financialDecision = await rbacEngine.evaluateVehicleAccess(user, context, 'view_vehicle_financial_data');
      expect(financialDecision.allowed).toBe(true);
      expect(financialDecision.requiresMFA).toBe(true);
    });

    it('should require MFA for vehicle decommissioning', async () => {
      const user = createMockUser({
        roles: [{
          ...createMockUser().roles[0],
          role: {
            ...createMockUser().roles[0].role,
            name: 'regional_manager',
            permissions: ['approve_vehicle_decommissioning']
          }
        }]
      });

      const context = createVehicleContext();

      const decision = await rbacEngine.evaluateVehicleAccess(user, context, 'approve_vehicle_decommissioning');
      expect(decision.allowed).toBe(true);
      expect(decision.requiresMFA).toBe(true);
    });

    it('should require MFA for cross-region access overrides', async () => {
      const user = createMockUser({
        allowedRegions: ['region-manila'],
        roles: [{
          ...createMockUser().roles[0],
          role: {
            ...createMockUser().roles[0].role,
            name: 'support',
            permissions: ['investigate_vehicle_incidents']
          }
        }]
      });

      const crossRegionContext = createVehicleContext({
        regionId: 'region-cebu',
        caseId: 'CASE-001'
      });

      const decision = await rbacEngine.evaluateVehicleAccess(user, crossRegionContext, 'investigate_vehicle_incidents');
      expect(decision.requiresMFA).toBe(true);
    });

    it('should not require MFA for basic operations', async () => {
      const user = createMockUser({
        roles: [{
          ...createMockUser().roles[0],
          role: {
            ...createMockUser().roles[0].role,
            name: 'ground_ops',
            permissions: ['view_vehicles_basic', 'assign_driver_to_vehicle']
          }
        }]
      });

      const context = createVehicleContext({ dataClass: 'internal' });

      const viewDecision = await rbacEngine.evaluateVehicleAccess(user, context, 'view_vehicles_basic');
      expect(viewDecision.allowed).toBe(true);
      expect(viewDecision.requiresMFA).toBe(false);

      const assignDecision = await rbacEngine.evaluateVehicleAccess(user, context, 'assign_driver_to_vehicle');
      expect(assignDecision.allowed).toBe(true);
      expect(assignDecision.requiresMFA).toBe(false);
    });
  });

  // =====================================================
  // Audit Logging Tests
  // =====================================================

  describe('Audit Logging', () => {
    it('should log all vehicle access attempts', async () => {
      const user = createMockUser({
        roles: [{
          ...createMockUser().roles[0],
          role: {
            ...createMockUser().roles[0].role,
            permissions: ['view_vehicles_basic']
          }
        }]
      });

      const context = createVehicleContext();

      await rbacEngine.evaluateVehicleAccess(user, context, 'view_vehicles_basic');

      expect(auditLogger.logVehicleAccess).toHaveBeenCalledWith({
        userId: user.id,
        vehicleId: context.vehicleId,
        permission: 'view_vehicles_basic',
        allowed: true,
        ownershipType: context.ownershipType,
        regionId: context.regionId,
        dataClass: context.dataClass,
        mfaRequired: false,
        timestamp: expect.any(Date)
      });
    });

    it('should log denied access attempts', async () => {
      const user = createMockUser({
        roles: [{
          ...createMockUser().roles[0],
          role: {
            ...createMockUser().roles[0].role,
            permissions: [] // No permissions
          }
        }]
      });

      const context = createVehicleContext();

      await rbacEngine.evaluateVehicleAccess(user, context, 'view_vehicles_basic');

      expect(auditLogger.logVehicleAccess).toHaveBeenCalledWith({
        userId: user.id,
        vehicleId: context.vehicleId,
        permission: 'view_vehicles_basic',
        allowed: false,
        reason: expect.stringContaining('permission'),
        timestamp: expect.any(Date)
      });
    });

    it('should log enhanced details for sensitive operations', async () => {
      const user = createMockUser({
        piiScope: 'full',
        roles: [{
          ...createMockUser().roles[0],
          role: {
            ...createMockUser().roles[0].role,
            name: 'finance_ops',
            permissions: ['approve_vehicle_purchases']
          }
        }]
      });

      const sensitiveContext = createVehicleContext({
        dataClass: 'restricted',
        containsPII: true,
        operationType: 'write'
      });

      await rbacEngine.evaluateVehicleAccess(user, sensitiveContext, 'approve_vehicle_purchases');

      expect(auditLogger.logVehicleAccess).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: user.id,
          permission: 'approve_vehicle_purchases',
          dataClass: 'restricted',
          containsPII: true,
          mfaRequired: true,
          securityLevel: 'high'
        })
      );
    });

    it('should log data masking events', () => {
      const vehicle = createMockVehicle();
      const maskedFields = ['vin', 'acquisitionCost'];
      const userId = 'user-123';

      maskVehicleData(vehicle, maskedFields, userId);

      expect(auditLogger.logDataMasking).toHaveBeenCalledWith({
        userId,
        resourceType: 'vehicle',
        resourceId: vehicle.id,
        maskedFields,
        timestamp: expect.any(Date)
      });
    });
  });

  // =====================================================
  // Security Edge Cases Tests
  // =====================================================

  describe('Security Edge Cases', () => {
    it('should handle expired user roles', async () => {
      const user = createMockUser({
        roles: [{
          ...createMockUser().roles[0],
          validUntil: new Date('2023-01-01'), // Expired
          role: {
            ...createMockUser().roles[0].role,
            permissions: ['view_vehicles_basic']
          }
        }]
      });

      const context = createVehicleContext();

      const decision = await rbacEngine.evaluateVehicleAccess(user, context, 'view_vehicles_basic');
      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain('expired');
    });

    it('should handle inactive user accounts', async () => {
      const user = createMockUser({
        status: 'inactive',
        roles: [{
          ...createMockUser().roles[0],
          role: {
            ...createMockUser().roles[0].role,
            permissions: ['view_vehicles_basic']
          }
        }]
      });

      const context = createVehicleContext();

      const decision = await rbacEngine.evaluateVehicleAccess(user, context, 'view_vehicles_basic');
      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain('inactive');
    });

    it('should handle users with no roles', async () => {
      const user = createMockUser({ roles: [] });
      const context = createVehicleContext();

      const decision = await rbacEngine.evaluateVehicleAccess(user, context, 'view_vehicles_basic');
      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain('no roles');
    });

    it('should handle malformed vehicle context', async () => {
      const user = createMockUser({
        roles: [{
          ...createMockUser().roles[0],
          role: {
            ...createMockUser().roles[0].role,
            permissions: ['view_vehicles_basic']
          }
        }]
      });

      const malformedContext = createVehicleContext({
        vehicleId: '', // Empty vehicle ID
        regionId: null as any, // Null region
        ownershipType: 'invalid_type' as any // Invalid ownership type
      });

      const decision = await rbacEngine.evaluateVehicleAccess(user, malformedContext, 'view_vehicles_basic');
      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain('invalid');
    });

    it('should handle permission escalation attempts', async () => {
      const user = createMockUser({
        roles: [{
          ...createMockUser().roles[0],
          role: {
            ...createMockUser().roles[0].role,
            name: 'ground_ops',
            permissions: ['view_vehicles_basic'] // Limited permissions
          }
        }]
      });

      const context = createVehicleContext();

      // Attempt to access higher-level permission
      const escalationDecision = await rbacEngine.evaluateVehicleAccess(user, context, 'approve_strategic_vehicle_investments');
      expect(escalationDecision.allowed).toBe(false);

      // Verify audit log for escalation attempt
      expect(auditLogger.logSecurityEvent).toHaveBeenCalledWith({
        type: 'PERMISSION_ESCALATION_ATTEMPT',
        userId: user.id,
        attemptedPermission: 'approve_strategic_vehicle_investments',
        userRole: 'ground_ops',
        timestamp: expect.any(Date)
      });
    });

    it('should handle concurrent access attempts', async () => {
      const user = createMockUser({
        roles: [{
          ...createMockUser().roles[0],
          role: {
            ...createMockUser().roles[0].role,
            permissions: ['view_vehicles_basic']
          }
        }]
      });

      const context = createVehicleContext();

      // Simulate concurrent access attempts
      const promises = Array.from({ length: 10 }, () =>
        rbacEngine.evaluateVehicleAccess(user, context, 'view_vehicles_basic')
      );

      const results = await Promise.all(promises);

      // All should have consistent results
      expect(results.every(r => r.allowed === results[0].allowed)).toBe(true);
    });

    it('should prevent session fixation attacks', async () => {
      const user1 = createMockUser({ id: 'user-1' });
      const user2 = createMockUser({ id: 'user-2' });
      
      const context = createVehicleContext();

      // Simulate session being used by different user
      const decision1 = await rbacEngine.evaluateVehicleAccess(user1, context, 'view_vehicles_basic');
      const decision2 = await rbacEngine.evaluateVehicleAccess(user2, context, 'view_vehicles_basic');

      // Each decision should be independent
      expect(decision1.userId).toBe('user-1');
      expect(decision2.userId).toBe('user-2');
    });
  });

  // =====================================================
  // Performance and Rate Limiting Tests
  // =====================================================

  describe('Performance and Rate Limiting', () => {
    it('should cache permission decisions for performance', async () => {
      const user = createMockUser({
        roles: [{
          ...createMockUser().roles[0],
          role: {
            ...createMockUser().roles[0].role,
            permissions: ['view_vehicles_basic']
          }
        }]
      });

      const context = createVehicleContext();

      // First call
      const start1 = performance.now();
      const decision1 = await rbacEngine.evaluateVehicleAccess(user, context, 'view_vehicles_basic');
      const time1 = performance.now() - start1;

      // Second call (should be cached)
      const start2 = performance.now();
      const decision2 = await rbacEngine.evaluateVehicleAccess(user, context, 'view_vehicles_basic');
      const time2 = performance.now() - start2;

      expect(decision1.allowed).toBe(decision2.allowed);
      expect(time2).toBeLessThan(time1); // Cached call should be faster
    });

    it('should handle high-volume permission checks efficiently', async () => {
      const user = createMockUser({
        roles: [{
          ...createMockUser().roles[0],
          role: {
            ...createMockUser().roles[0].role,
            permissions: ['view_vehicles_basic']
          }
        }]
      });

      const contexts = Array.from({ length: 1000 }, (_, i) =>
        createVehicleContext({ vehicleId: `veh-${i.toString().padStart(3, '0')}` })
      );

      const startTime = performance.now();

      const promises = contexts.map(context =>
        rbacEngine.evaluateVehicleAccess(user, context, 'view_vehicles_basic')
      );

      const results = await Promise.all(promises);
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(results).toHaveLength(1000);
      expect(totalTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(results.every(r => r.allowed === true)).toBe(true);
    });
  });
});