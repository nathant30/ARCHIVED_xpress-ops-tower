/**
 * Vehicle Management Regional Access Control - Edge Case Testing Suite
 * 
 * Comprehensive test coverage for cross-region access scenarios, boundary conditions,
 * and security edge cases that could lead to unauthorized data access.
 * 
 * Edge Cases Covered:
 * - Multi-region user access with conflicting permissions
 * - Region hierarchy and inheritance edge cases  
 * - Temporary access expiration boundaries
 * - Vehicle ownership transfers between regions
 * - Emergency access override scenarios
 * - Region deactivation while users have active sessions
 * - Circular region dependencies
 * - Concurrent access from multiple regions
 * - Region-specific data masking edge cases
 * - MFA bypass attempts for cross-region access
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { vehicleRBACEngine } from '@/lib/auth/vehicle-rbac-engine';
import { maskVehicleData } from '@/middleware/vehicleRbacMiddleware';
import {
  VehiclePermission,
  VehicleDataClass,
  VehicleRBACContext,
  VehicleRBACDecision
} from '@/types/vehicle-rbac';
import { VehicleOwnershipType, Vehicle } from '@/types/vehicles';
import type { EnhancedUser } from '@/types/rbac-abac';

// Test fixtures for edge case scenarios
const regions = {
  MANILA: 'region-manila',
  CEBU: 'region-cebu', 
  DAVAO: 'region-davao',
  BAGUIO: 'region-baguio',
  INACTIVE: 'region-inactive',
  NONEXISTENT: 'region-nonexistent'
};

const createTestVehicle = (regionId: string, ownershipType: VehicleOwnershipType = 'xpress_owned'): Vehicle => ({
  id: 'vehicle-test-123',
  vehicleCode: 'TEST-001',
  licensePlate: 'ABC123',
  make: 'Toyota',
  model: 'Vios',
  year: 2023,
  color: 'White',
  category: 'sedan',
  fuelType: 'gasoline',
  seatingCapacity: 4,
  ownershipType,
  regionId,
  status: 'active',
  conditionRating: 'good',
  conditionScore: 85,
  serviceTypes: ['ride_4w'],
  registrationExpiry: new Date('2025-12-31'),
  obdDeviceInstalled: false,
  totalTrips: 100,
  averageRating: 4.5,
  utilizationRate: 75,
  availabilityScore: 90,
  totalDistanceKm: 5000,
  totalMaintenanceCost: 25000,
  maintenanceAlertsCount: 0,
  carbonEmissionsKg: 1200,
  dailyOperatingHours: 10,
  accidentCount: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'system',
  isActive: true
});

const createMultiRegionUser = (allowedRegions: string[], roleName: string = 'ops_manager'): EnhancedUser => ({
  id: 'user-multiregion',
  email: 'multiregion@xpress.ph',
  firstName: 'Multi',
  lastName: 'Region',
  timezone: 'Asia/Manila',
  locale: 'en-PH',
  status: 'active',
  roles: [{
    id: '1',
    userId: 'user-multiregion',
    roleId: roleName,
    role: {
      id: roleName,
      name: roleName,
      displayName: roleName.replace('_', ' ').toUpperCase(),
      level: 30,
      permissions: [],
      inheritsFrom: [],
      isSystem: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    allowedRegions,
    validFrom: new Date(),
    assignedAt: new Date(),
    validUntil: undefined,
    isActive: true,
    metadata: { multiRegion: true }
  }],
  allowedRegions,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastLoginAt: new Date(),
  isActive: true
});

describe('Vehicle Management - Regional Access Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Multi-Region User Access Conflicts', () => {
    it('should resolve conflicting permissions when user has access to multiple regions', async () => {
      const user = createMultiRegionUser([regions.MANILA, regions.CEBU]);
      const manilaVehicle = createTestVehicle(regions.MANILA);
      const cebuVehicle = createTestVehicle(regions.CEBU);

      const manilaDecision = await vehicleRBACEngine.evaluateAccess(
        user,
        VehiclePermission.VIEW_VEHICLES_DETAILED,
        { vehicleId: manilaVehicle.id, regionId: regions.MANILA }
      );

      const cebuDecision = await vehicleRBACEngine.evaluateAccess(
        user,
        VehiclePermission.VIEW_VEHICLES_DETAILED,
        { vehicleId: cebuVehicle.id, regionId: regions.CEBU }
      );

      expect(manilaDecision.allowed).toBe(true);
      expect(cebuDecision.allowed).toBe(true);
      expect(manilaDecision.appliedPolicies).toContain('multi_region_access');
      expect(cebuDecision.appliedPolicies).toContain('multi_region_access');
    });

    it('should deny access when user requests region not in their allowed list', async () => {
      const user = createMultiRegionUser([regions.MANILA]);
      const cebuVehicle = createTestVehicle(regions.CEBU);

      const decision = await vehicleRBACEngine.evaluateAccess(
        user,
        VehiclePermission.VIEW_VEHICLES_DETAILED,
        { vehicleId: cebuVehicle.id, regionId: regions.CEBU }
      );

      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain('region_access_denied');
    });

    it('should handle wildcard region access correctly', async () => {
      const user = createMultiRegionUser(['*']); // Access to all regions
      const anyRegionVehicle = createTestVehicle(regions.DAVAO);

      const decision = await vehicleRBACEngine.evaluateAccess(
        user,
        VehiclePermission.VIEW_VEHICLES_DETAILED,
        { vehicleId: anyRegionVehicle.id, regionId: regions.DAVAO }
      );

      expect(decision.allowed).toBe(true);
      expect(decision.appliedPolicies).toContain('wildcard_region_access');
    });
  });

  describe('Temporary Access Expiration Edge Cases', () => {
    it('should deny access when temporary region access expires exactly at request time', async () => {
      const expiredTime = new Date();
      const user = createMultiRegionUser([regions.MANILA]);
      // Set role to expire exactly now
      user.roles[0].validUntil = expiredTime;

      const vehicle = createTestVehicle(regions.MANILA);

      const decision = await vehicleRBACEngine.evaluateAccess(
        user,
        VehiclePermission.VIEW_VEHICLES_DETAILED,
        { vehicleId: vehicle.id, regionId: regions.MANILA }
      );

      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain('role_expired');
    });

    it('should handle timezone-based expiration edge cases', async () => {
      const user = createMultiRegionUser([regions.MANILA]);
      user.timezone = 'Asia/Manila'; // GMT+8
      
      // Set expiration to midnight UTC (8 AM Manila time)
      const midnightUTC = new Date();
      midnightUTC.setUTCHours(0, 0, 0, 0);
      user.roles[0].validUntil = midnightUTC;

      const vehicle = createTestVehicle(regions.MANILA);

      // Mock current time to be just before expiration in Manila timezone
      const manilaTime = new Date(midnightUTC.getTime() - 60000); // 1 minute before
      jest.useFakeTimers();
      jest.setSystemTime(manilaTime);

      const decision = await vehicleRBACEngine.evaluateAccess(
        user,
        VehiclePermission.VIEW_VEHICLES_DETAILED,
        { vehicleId: vehicle.id, regionId: regions.MANILA }
      );

      expect(decision.allowed).toBe(true);
      expect(decision.appliedPolicies).toContain('timezone_adjusted_access');

      jest.useRealTimers();
    });
  });

  describe('Vehicle Ownership Transfer Edge Cases', () => {
    it('should handle vehicle moved between regions during active session', async () => {
      const user = createMultiRegionUser([regions.MANILA, regions.CEBU]);
      const vehicle = createTestVehicle(regions.MANILA);

      // Initial access in Manila
      const initialDecision = await vehicleRBACEngine.evaluateAccess(
        user,
        VehiclePermission.VIEW_VEHICLES_DETAILED,
        { vehicleId: vehicle.id, regionId: regions.MANILA }
      );
      expect(initialDecision.allowed).toBe(true);

      // Simulate vehicle transfer to Cebu
      vehicle.regionId = regions.CEBU;

      // Access should still work as user has access to both regions
      const transferDecision = await vehicleRBACEngine.evaluateAccess(
        user,
        VehiclePermission.VIEW_VEHICLES_DETAILED,
        { vehicleId: vehicle.id, regionId: regions.CEBU }
      );
      expect(transferDecision.allowed).toBe(true);
      expect(transferDecision.appliedPolicies).toContain('cross_region_vehicle_transfer');
    });

    it('should deny access to vehicle transferred to unauthorized region', async () => {
      const user = createMultiRegionUser([regions.MANILA]); // Only Manila access
      const vehicle = createTestVehicle(regions.MANILA);

      // Simulate vehicle transfer to unauthorized region
      vehicle.regionId = regions.DAVAO;

      const decision = await vehicleRBACEngine.evaluateAccess(
        user,
        VehiclePermission.VIEW_VEHICLES_DETAILED,
        { vehicleId: vehicle.id, regionId: regions.DAVAO }
      );

      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain('vehicle_transferred_unauthorized_region');
    });

    it('should handle ownership type changes affecting regional permissions', async () => {
      const user = createMultiRegionUser([regions.MANILA], 'fleet_supervisor');
      const vehicle = createTestVehicle(regions.MANILA, 'xpress_owned');

      // Initial access to Xpress-owned vehicle
      const xpressOwnedDecision = await vehicleRBACEngine.evaluateAccess(
        user,
        VehiclePermission.UPDATE_VEHICLE_DETAILS,
        { 
          vehicleId: vehicle.id, 
          regionId: regions.MANILA, 
          ownershipType: 'xpress_owned' 
        }
      );
      expect(xpressOwnedDecision.allowed).toBe(true);

      // Change to driver-owned (may have different permissions)
      vehicle.ownershipType = 'driver_owned';

      const driverOwnedDecision = await vehicleRBACEngine.evaluateAccess(
        user,
        VehiclePermission.UPDATE_VEHICLE_DETAILS,
        { 
          vehicleId: vehicle.id, 
          regionId: regions.MANILA, 
          ownershipType: 'driver_owned' 
        }
      );

      // Fleet supervisor might not have update permissions for driver-owned vehicles
      expect(driverOwnedDecision.allowed).toBe(false);
      expect(driverOwnedDecision.reason).toContain('ownership_type_permission_mismatch');
    });
  });

  describe('Emergency Access Override Edge Cases', () => {
    it('should validate emergency case ID format and existence', async () => {
      const user = createMultiRegionUser([regions.MANILA]);
      const emergencyVehicle = createTestVehicle(regions.CEBU);

      // Invalid emergency case ID format
      const invalidCaseDecision = await vehicleRBACEngine.evaluateAccess(
        user,
        VehiclePermission.VIEW_VEHICLES_DETAILED,
        { 
          vehicleId: emergencyVehicle.id, 
          regionId: regions.CEBU,
          emergencyOverride: true,
          emergencyCaseId: 'invalid-case-123' // Wrong format
        }
      );

      expect(invalidCaseDecision.allowed).toBe(false);
      expect(invalidCaseDecision.reason).toContain('invalid_emergency_case_format');

      // Valid emergency case ID
      const validCaseDecision = await vehicleRBACEngine.evaluateAccess(
        user,
        VehiclePermission.VIEW_VEHICLES_DETAILED,
        { 
          vehicleId: emergencyVehicle.id, 
          regionId: regions.CEBU,
          emergencyOverride: true,
          emergencyCaseId: 'EMRG-2024-001-URGENT'
        }
      );

      expect(validCaseDecision.allowed).toBe(true);
      expect(validCaseDecision.appliedPolicies).toContain('emergency_override_validated');
    });

    it('should enforce emergency access time limits', async () => {
      const user = createMultiRegionUser([regions.MANILA]);
      const emergencyVehicle = createTestVehicle(regions.CEBU);

      // Mock emergency access granted 25 hours ago (past 24-hour limit)
      const expiredEmergencyTime = new Date();
      expiredEmergencyTime.setHours(expiredEmergencyTime.getHours() - 25);

      const decision = await vehicleRBACEngine.evaluateAccess(
        user,
        VehiclePermission.VIEW_VEHICLES_DETAILED,
        { 
          vehicleId: emergencyVehicle.id, 
          regionId: regions.CEBU,
          emergencyOverride: true,
          emergencyCaseId: 'EMRG-2024-001-URGENT',
          emergencyGrantedAt: expiredEmergencyTime
        }
      );

      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain('emergency_access_expired');
    });
  });

  describe('Region Deactivation Edge Cases', () => {
    it('should handle access attempts to deactivated regions gracefully', async () => {
      const user = createMultiRegionUser([regions.INACTIVE]);
      const inactiveRegionVehicle = createTestVehicle(regions.INACTIVE);

      const decision = await vehicleRBACEngine.evaluateAccess(
        user,
        VehiclePermission.VIEW_VEHICLES_DETAILED,
        { vehicleId: inactiveRegionVehicle.id, regionId: regions.INACTIVE }
      );

      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain('region_deactivated');
    });

    it('should handle nonexistent region access attempts', async () => {
      const user = createMultiRegionUser([regions.NONEXISTENT]);
      const vehicle = createTestVehicle(regions.NONEXISTENT);

      const decision = await vehicleRBACEngine.evaluateAccess(
        user,
        VehiclePermission.VIEW_VEHICLES_DETAILED,
        { vehicleId: vehicle.id, regionId: regions.NONEXISTENT }
      );

      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain('region_not_found');
    });
  });

  describe('Concurrent Access Edge Cases', () => {
    it('should handle concurrent access requests from multiple regions', async () => {
      const user = createMultiRegionUser([regions.MANILA, regions.CEBU, regions.DAVAO]);
      const vehicle = createTestVehicle(regions.MANILA);

      // Simulate concurrent access requests
      const concurrentPromises = [
        vehicleRBACEngine.evaluateAccess(user, VehiclePermission.VIEW_VEHICLES_DETAILED, 
          { vehicleId: vehicle.id, regionId: regions.MANILA }),
        vehicleRBACEngine.evaluateAccess(user, VehiclePermission.VIEW_VEHICLES_DETAILED, 
          { vehicleId: vehicle.id, regionId: regions.MANILA }),
        vehicleRBACEngine.evaluateAccess(user, VehiclePermission.VIEW_VEHICLES_DETAILED, 
          { vehicleId: vehicle.id, regionId: regions.MANILA })
      ];

      const results = await Promise.all(concurrentPromises);

      // All should succeed
      results.forEach(decision => {
        expect(decision.allowed).toBe(true);
      });

      // Should have consistent decision IDs for auditing
      expect(results[0].decisionId).toBeDefined();
      expect(results[1].decisionId).toBeDefined();
      expect(results[2].decisionId).toBeDefined();
    });

    it('should handle race condition when region permissions change during evaluation', async () => {
      const user = createMultiRegionUser([regions.MANILA]);
      const vehicle = createTestVehicle(regions.MANILA);

      // Start access evaluation
      const accessPromise = vehicleRBACEngine.evaluateAccess(
        user,
        VehiclePermission.VIEW_VEHICLES_DETAILED,
        { vehicleId: vehicle.id, regionId: regions.MANILA }
      );

      // Simulate permission change during evaluation
      setTimeout(() => {
        user.allowedRegions = []; // Remove all region access
      }, 10);

      const decision = await accessPromise;

      // Decision should be based on permissions at start of evaluation
      expect(decision.allowed).toBe(true);
      expect(decision.appliedPolicies).toContain('snapshot_permissions');
    });
  });

  describe('Data Masking Edge Cases', () => {
    it('should apply correct masking for cross-region sensitive data', async () => {
      const user = createMultiRegionUser([regions.CEBU], 'region_viewer'); // Limited role
      const manilaVehicle = createTestVehicle(regions.MANILA);
      
      // Add sensitive data
      const sensitiveVehicle = {
        ...manilaVehicle,
        acquisitionCost: 800000,
        currentMarketValue: 650000,
        insuranceValue: 700000,
        fleetOwnerName: 'Sensitive Fleet Owner',
        vin: 'SENSITIVE123456789'
      };

      // Should mask financial data for limited role accessing cross-region data
      const maskedData = maskVehicleData(sensitiveVehicle, [
        'acquisitionCost', 
        'currentMarketValue', 
        'insuranceValue',
        'fleetOwnerName',
        'vin'
      ]);

      expect(maskedData.acquisitionCost).toBe('[RESTRICTED]');
      expect(maskedData.currentMarketValue).toBe('[RESTRICTED]');
      expect(maskedData.insuranceValue).toBe('[RESTRICTED]');
      expect(maskedData.fleetOwnerName).toBe('[RESTRICTED]');
      expect(maskedData.vin).toBe('[RESTRICTED]');
    });

    it('should handle masking conflicts when user has different permissions per region', async () => {
      // User has financial access in Manila but not in Cebu
      const user = createMultiRegionUser([regions.MANILA, regions.CEBU]);
      user.roles[0].metadata = { 
        regionPermissions: {
          [regions.MANILA]: ['view_financial_data'],
          [regions.CEBU]: ['view_basic_data']
        }
      };

      const manilaVehicle = createTestVehicle(regions.MANILA);
      const cebuVehicle = createTestVehicle(regions.CEBU);

      // Manila vehicle - should not mask financial data
      const manilaDecision = await vehicleRBACEngine.evaluateAccess(
        user,
        VehiclePermission.VIEW_VEHICLES_FINANCIAL,
        { vehicleId: manilaVehicle.id, regionId: regions.MANILA }
      );
      expect(manilaDecision.allowed).toBe(true);

      // Cebu vehicle - should mask financial data
      const cebuDecision = await vehicleRBACEngine.evaluateAccess(
        user,
        VehiclePermission.VIEW_VEHICLES_FINANCIAL,
        { vehicleId: cebuVehicle.id, regionId: regions.CEBU }
      );
      expect(cebuDecision.allowed).toBe(false);
    });
  });

  describe('MFA Bypass Edge Cases', () => {
    it('should detect and prevent MFA bypass attempts for cross-region access', async () => {
      const user = createMultiRegionUser([regions.MANILA]);
      const cebuVehicle = createTestVehicle(regions.CEBU);

      // Attempt to bypass MFA requirement for cross-region access
      const bypassAttempt = await vehicleRBACEngine.evaluateAccess(
        user,
        VehiclePermission.UPDATE_VEHICLE_DETAILS,
        { 
          vehicleId: cebuVehicle.id, 
          regionId: regions.CEBU,
          skipMFA: true, // Attempting to bypass
          requestedDataClass: VehicleDataClass.CONFIDENTIAL
        }
      );

      expect(bypassAttempt.allowed).toBe(false);
      expect(bypassAttempt.reason).toContain('mfa_bypass_attempt_detected');
    });

    it('should enforce MFA even for emergency overrides beyond time limit', async () => {
      const user = createMultiRegionUser([regions.MANILA]);
      const cebuVehicle = createTestVehicle(regions.CEBU);

      // Emergency access that requires MFA after initial grace period
      const emergencyMFADecision = await vehicleRBACEngine.evaluateAccess(
        user,
        VehiclePermission.DELETE_VEHICLES,
        { 
          vehicleId: cebuVehicle.id, 
          regionId: regions.CEBU,
          emergencyOverride: true,
          emergencyCaseId: 'EMRG-2024-001-URGENT',
          emergencyAccessDuration: 'extended' // Beyond grace period
        }
      );

      expect(emergencyMFADecision.requiresMFA).toBe(true);
      expect(emergencyMFADecision.mfaReason).toContain('emergency_extended_access');
    });
  });

  describe('Region Hierarchy Edge Cases', () => {
    it('should handle circular region hierarchy dependencies', async () => {
      // Mock circular dependency: Manila -> Cebu -> Davao -> Manila
      const user = createMultiRegionUser([regions.MANILA]);
      const vehicle = createTestVehicle(regions.CEBU);

      const decision = await vehicleRBACEngine.evaluateAccess(
        user,
        VehiclePermission.VIEW_VEHICLES_DETAILED,
        { 
          vehicleId: vehicle.id, 
          regionId: regions.CEBU,
          regionHierarchy: {
            [regions.MANILA]: [regions.CEBU],
            [regions.CEBU]: [regions.DAVAO], 
            [regions.DAVAO]: [regions.MANILA] // Circular!
          }
        }
      );

      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain('circular_region_hierarchy_detected');
    });

    it('should respect region inheritance depth limits', async () => {
      const user = createMultiRegionUser([regions.MANILA]);
      const deepRegionVehicle = createTestVehicle('region-deep-level-6');

      const decision = await vehicleRBACEngine.evaluateAccess(
        user,
        VehiclePermission.VIEW_VEHICLES_DETAILED,
        { 
          vehicleId: deepRegionVehicle.id, 
          regionId: 'region-deep-level-6',
          regionInheritanceDepth: 6 // Beyond max allowed depth of 5
        }
      );

      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain('region_inheritance_depth_exceeded');
    });
  });
});