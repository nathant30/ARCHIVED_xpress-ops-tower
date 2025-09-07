// Vehicle RBAC Engine Tests
// Comprehensive test suite for vehicle-specific RBAC operations

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { VehicleRBACEngine, vehicleRBACEngine } from '@/lib/auth/vehicle-rbac-engine';
import {
  VehiclePermission,
  VehicleDataClass,
  VehicleRBACContext,
  VehicleRBACDecision
} from '@/types/vehicle-rbac';
import { VehicleOwnershipType } from '@/types/vehicles';
import type { EnhancedUser } from '@/types/rbac-abac';

// Mock data and utilities
const createMockUser = (overrides: Partial<EnhancedUser> = {}): EnhancedUser => ({
  id: 'user-123',
  email: 'test@example.com',
  roles: [{
    role: { name: 'ops_manager' },
    isActive: true,
    assignedAt: new Date(),
    validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000)
  }],
  allowedRegions: ['region-manila'],
  piiScope: 'masked',
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

describe('Vehicle RBAC Engine', () => {
  let engine: VehicleRBACEngine;

  beforeEach(() => {
    engine = new VehicleRBACEngine();
    // Clear any cached decisions
    (engine as any).cache.clear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Permission Evaluation', () => {
    it('should allow ops_manager to view basic vehicle information', async () => {
      const user = createMockUser({ 
        roles: [{ role: { name: 'ops_manager' }, isActive: true, assignedAt: new Date() }]
      });
      const context = createVehicleContext();

      const decision = await engine.evaluateVehicleAccess(
        user, 
        context, 
        'view_vehicles_basic'
      );

      expect(decision.allowed).toBe(true);
      expect(decision.ownershipAccessLevel).toBe('basic');
      expect(decision.requiresMFA).toBe(false);
    });

    it('should deny ground_ops access to detailed vehicle information', async () => {
      const user = createMockUser({ 
        roles: [{ role: { name: 'ground_ops' }, isActive: true, assignedAt: new Date() }]
      });
      const context = createVehicleContext();

      const decision = await engine.evaluateVehicleAccess(
        user, 
        context, 
        'view_vehicles_detailed'
      );

      expect(decision.allowed).toBe(false);
      expect(decision.ownershipAccessLevel).toBe('none');
    });

    it('should allow executive full access to all vehicle operations', async () => {
      const user = createMockUser({ 
        roles: [{ role: { name: 'executive' }, isActive: true, assignedAt: new Date() }],
        allowedRegions: ['*'],
        piiScope: 'full'
      });
      const context = createVehicleContext({ dataClass: 'restricted', containsPII: true });

      const decision = await engine.evaluateVehicleAccess(
        user, 
        context, 
        'approve_strategic_vehicle_investments'
      );

      expect(decision.allowed).toBe(true);
      expect(decision.ownershipAccessLevel).toBe('full');
    });
  });

  describe('Regional Access Control', () => {
    it('should allow access to vehicles in user\'s assigned region', async () => {
      const user = createMockUser({ allowedRegions: ['region-manila'] });
      const context = createVehicleContext({ regionId: 'region-manila' });

      const decision = await engine.evaluateVehicleAccess(
        user, 
        context, 
        'view_vehicles_basic'
      );

      expect(decision.allowed).toBe(true);
    });

    it('should deny access to vehicles outside user\'s assigned region', async () => {
      const user = createMockUser({ allowedRegions: ['region-manila'] });
      const context = createVehicleContext({ regionId: 'region-cebu' });

      const decision = await engine.evaluateVehicleAccess(
        user, 
        context, 
        'view_vehicles_basic'
      );

      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain('region');
    });

    it('should allow cross-region override for support with case ID', async () => {
      const user = createMockUser({ 
        roles: [{ role: { name: 'support' }, isActive: true, assignedAt: new Date() }],
        allowedRegions: ['region-manila']
      });
      const context = createVehicleContext({ 
        regionId: 'region-cebu',
        caseId: 'case-123'
      });

      const decision = await engine.evaluateVehicleAccess(
        user, 
        context, 
        'view_vehicles_support'
      );

      expect(decision.allowed).toBe(true);
      expect(decision.reason).toContain('Cross-region override');
    });

    it('should deny cross-region access for support without case ID', async () => {
      const user = createMockUser({ 
        roles: [{ role: { name: 'support' }, isActive: true, assignedAt: new Date() }],
        allowedRegions: ['region-manila']
      });
      const context = createVehicleContext({ regionId: 'region-cebu' });

      const decision = await engine.evaluateVehicleAccess(
        user, 
        context, 
        'view_vehicles_support'
      );

      expect(decision.allowed).toBe(false);
    });
  });

  describe('Ownership-Based Access Control', () => {
    it('should allow different access levels based on ownership type', async () => {
      const user = createMockUser({ 
        roles: [{ role: { name: 'ops_manager' }, isActive: true, assignedAt: new Date() }]
      });

      // Xpress-owned vehicle - should have detailed access
      const xpressContext = createVehicleContext({ ownershipType: 'xpress_owned' });
      const xpressDecision = await engine.evaluateVehicleAccess(
        user, 
        xpressContext, 
        'view_vehicles_detailed'
      );

      expect(xpressDecision.allowed).toBe(true);
      expect(xpressDecision.ownershipAccessLevel).toBe('detailed');

      // Driver-owned vehicle - should have limited access
      const driverContext = createVehicleContext({ ownershipType: 'driver_owned' });
      const driverDecision = await engine.evaluateVehicleAccess(
        user, 
        driverContext, 
        'view_vehicles_detailed'
      );

      expect(driverDecision.allowed).toBe(false);
    });

    it('should require higher role for financial operations on fleet-owned vehicles', async () => {
      const opsManager = createMockUser({ 
        roles: [{ role: { name: 'ops_manager' }, isActive: true, assignedAt: new Date() }]
      });
      const financeOps = createMockUser({ 
        roles: [{ role: { name: 'finance_ops' }, isActive: true, assignedAt: new Date() }]
      });
      const context = createVehicleContext({ 
        ownershipType: 'fleet_owned',
        dataClass: 'confidential'
      });

      // Ops manager should not have financial access
      const opsDecision = await engine.evaluateVehicleAccess(
        opsManager, 
        context, 
        'approve_vehicle_purchases'
      );
      expect(opsDecision.allowed).toBe(false);

      // Finance ops should have financial access
      const financeDecision = await engine.evaluateVehicleAccess(
        financeOps, 
        context, 
        'approve_vehicle_purchases'
      );
      expect(financeDecision.allowed).toBe(true);
    });
  });

  describe('Data Classification and PII Handling', () => {
    it('should mask fields for users without full PII scope', async () => {
      const user = createMockUser({ piiScope: 'masked' });
      const context = createVehicleContext({ 
        dataClass: 'confidential',
        containsPII: true
      });

      const decision = await engine.evaluateVehicleAccess(
        user, 
        context, 
        'view_vehicles_detailed'
      );

      expect(decision.allowed).toBe(true);
      expect(decision.maskedFields).toBeDefined();
      expect(decision.maskedFields!.length).toBeGreaterThan(0);
    });

    it('should deny access to PII for users with no PII scope', async () => {
      const user = createMockUser({ piiScope: 'none' });
      const context = createVehicleContext({ 
        dataClass: 'confidential',
        containsPII: true
      });

      const decision = await engine.evaluateVehicleAccess(
        user, 
        context, 
        'view_vehicles_detailed'
      );

      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain('PII');
    });

    it('should require MFA for restricted data access', async () => {
      const user = createMockUser({ 
        piiScope: 'full',
        roles: [{ role: { name: 'regional_manager' }, isActive: true, assignedAt: new Date() }]
      });
      const context = createVehicleContext({ 
        dataClass: 'restricted',
        containsPII: true
      });

      const decision = await engine.evaluateVehicleAccess(
        user, 
        context, 
        'view_vehicles_detailed'
      );

      expect(decision.allowed).toBe(true);
      expect(decision.requiresMFA).toBe(true);
    });
  });

  describe('MFA Requirements', () => {
    it('should require MFA for financial operations', async () => {
      const user = createMockUser({ 
        roles: [{ role: { name: 'finance_ops' }, isActive: true, assignedAt: new Date() }]
      });
      const context = createVehicleContext({ dataClass: 'confidential' });

      const decision = await engine.evaluateVehicleAccess(
        user, 
        context, 
        'approve_vehicle_purchases'
      );

      expect(decision.allowed).toBe(true);
      expect(decision.requiresMFA).toBe(true);
    });

    it('should require MFA for vehicle decommissioning', async () => {
      const user = createMockUser({ 
        roles: [{ role: { name: 'regional_manager' }, isActive: true, assignedAt: new Date() }]
      });
      const context = createVehicleContext();

      const decision = await engine.evaluateVehicleAccess(
        user, 
        context, 
        'approve_vehicle_decommissioning'
      );

      expect(decision.requiresMFA).toBe(true);
    });

    it('should require MFA for cross-region overrides', async () => {
      const user = createMockUser({ 
        roles: [{ role: { name: 'support' }, isActive: true, assignedAt: new Date() }],
        allowedRegions: ['region-manila']
      });
      const context = createVehicleContext({ 
        regionId: 'region-cebu',
        caseId: 'case-123'
      });

      const decision = await engine.evaluateVehicleAccess(
        user, 
        context, 
        'investigate_vehicle_incidents'
      );

      expect(decision.requiresMFA).toBe(true);
    });
  });

  describe('Audit Requirements', () => {
    it('should require audit for all vehicle operations', async () => {
      const user = createMockUser();
      const context = createVehicleContext();

      const decision = await engine.evaluateVehicleAccess(
        user, 
        context, 
        'view_vehicles_basic'
      );

      expect(decision.auditRequired).toBe(true);
    });

    it('should require enhanced audit for sensitive operations', async () => {
      const user = createMockUser({ 
        roles: [{ role: { name: 'risk_investigator' }, isActive: true, assignedAt: new Date() }]
      });
      const context = createVehicleContext({ dataClass: 'restricted' });

      const decision = await engine.evaluateVehicleAccess(
        user, 
        context, 
        'investigate_vehicle_incidents'
      );

      expect(decision.auditRequired).toBe(true);
    });
  });

  describe('Caching and Performance', () => {
    it('should cache permission decisions', async () => {
      const user = createMockUser();
      const context = createVehicleContext();
      
      // First call
      const start1 = Date.now();
      const decision1 = await engine.evaluateVehicleAccess(
        user, 
        context, 
        'view_vehicles_basic'
      );
      const time1 = Date.now() - start1;

      // Second call (should be from cache)
      const start2 = Date.now();
      const decision2 = await engine.evaluateVehicleAccess(
        user, 
        context, 
        'view_vehicles_basic'
      );
      const time2 = Date.now() - start2;

      expect(decision1.allowed).toBe(decision2.allowed);
      expect(time2).toBeLessThan(time1); // Cached call should be faster
    });

    it('should invalidate cache after TTL', async () => {
      const user = createMockUser();
      const context = createVehicleContext();
      
      // Set short TTL for testing
      (engine as any).CACHE_TTL = 100; // 100ms
      
      // First call
      await engine.evaluateVehicleAccess(user, context, 'view_vehicles_basic');
      expect((engine as any).cache.size).toBe(1);
      
      // Wait for TTL expiry
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Trigger cleanup
      (engine as any).cleanupCache();
      expect((engine as any).cache.size).toBe(0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle user with no roles', async () => {
      const user = createMockUser({ roles: [] });
      const context = createVehicleContext();

      const decision = await engine.evaluateVehicleAccess(
        user, 
        context, 
        'view_vehicles_basic'
      );

      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain('no assigned roles');
    });

    it('should handle invalid ownership type', async () => {
      const user = createMockUser();
      const context = createVehicleContext({ 
        ownershipType: 'invalid_type' as VehicleOwnershipType
      });

      const decision = await engine.evaluateVehicleAccess(
        user, 
        context, 
        'view_vehicles_basic'
      );

      expect(decision.allowed).toBe(false);
    });

    it('should handle missing vehicle context', async () => {
      const user = createMockUser();
      const context = createVehicleContext({ vehicleId: undefined, regionId: 'unknown' });

      const decision = await engine.evaluateVehicleAccess(
        user, 
        context, 
        'view_vehicles_basic'
      );

      // Should still work with partial context
      expect(typeof decision.allowed).toBe('boolean');
    });
  });

  describe('Permission Validation Utilities', () => {
    it('should validate user permissions correctly', async () => {
      const user = createMockUser({ 
        roles: [{ role: { name: 'ops_manager' }, isActive: true, assignedAt: new Date() }]
      });
      
      const validation = await engine.validateVehiclePermissions(user, [
        'view_vehicles_basic',
        'view_vehicles_detailed',
        'approve_strategic_vehicle_investments' // Should fail
      ]);

      expect(validation.valid).toBe(false);
      expect(validation.missingPermissions).toContain('approve_strategic_vehicle_investments');
    });

    it('should get effective permissions for a user', () => {
      const user = createMockUser({ 
        roles: [{ role: { name: 'ops_manager' }, isActive: true, assignedAt: new Date() }]
      });
      
      const permissions = engine.getEffectiveVehiclePermissions(user);
      
      expect(permissions).toBeInstanceOf(Array);
      expect(permissions.length).toBeGreaterThan(0);
      expect(permissions).toContain('view_vehicles_detailed');
    });

    it('should return empty permissions for user with no role', () => {
      const user = createMockUser({ roles: [] });
      
      const permissions = engine.getEffectiveVehiclePermissions(user);
      
      expect(permissions).toEqual([]);
    });
  });
});

describe('Vehicle RBAC Integration Tests', () => {
  describe('Role-Based Scenarios', () => {
    const testCases = [
      {
        role: 'ground_ops',
        permissions: ['view_vehicles_basic', 'assign_driver_to_vehicle'],
        forbidden: ['view_vehicles_detailed', 'create_vehicles'],
        expectedAccessLevel: 'basic'
      },
      {
        role: 'ops_manager',
        permissions: ['view_vehicles_detailed', 'schedule_vehicle_maintenance'],
        forbidden: ['approve_strategic_vehicle_investments'],
        expectedAccessLevel: 'detailed'
      },
      {
        role: 'regional_manager',
        permissions: ['manage_regional_vehicles', 'approve_vehicle_registrations'],
        forbidden: ['approve_strategic_vehicle_investments'],
        expectedAccessLevel: 'financial'
      },
      {
        role: 'executive',
        permissions: ['approve_strategic_vehicle_investments', 'view_global_fleet_analytics'],
        forbidden: [],
        expectedAccessLevel: 'full'
      }
    ];

    testCases.forEach(({ role, permissions, forbidden, expectedAccessLevel }) => {
      describe(`${role} role`, () => {
        it(`should have access to ${role}-specific permissions`, async () => {
          const user = createMockUser({ 
            roles: [{ role: { name: role }, isActive: true, assignedAt: new Date() }]
          });
          const context = createVehicleContext();

          for (const permission of permissions) {
            const decision = await vehicleRBACEngine.evaluateVehicleAccess(
              user, 
              context, 
              permission as VehiclePermission
            );
            expect(decision.allowed).toBe(true);
          }
        });

        it(`should not have access to forbidden permissions`, async () => {
          const user = createMockUser({ 
            roles: [{ role: { name: role }, isActive: true, assignedAt: new Date() }]
          });
          const context = createVehicleContext();

          for (const permission of forbidden) {
            const decision = await vehicleRBACEngine.evaluateVehicleAccess(
              user, 
              context, 
              permission as VehiclePermission
            );
            expect(decision.allowed).toBe(false);
          }
        });

        it(`should have ${expectedAccessLevel} access level`, async () => {
          const user = createMockUser({ 
            roles: [{ role: { name: role }, isActive: true, assignedAt: new Date() }]
          });
          const context = createVehicleContext();

          const decision = await vehicleRBACEngine.evaluateVehicleAccess(
            user, 
            context, 
            'view_vehicles_basic'
          );
          
          if (decision.allowed) {
            expect(decision.ownershipAccessLevel).toBe(expectedAccessLevel);
          }
        });
      });
    });
  });

  describe('Data Classification Scenarios', () => {
    const classifications: VehicleDataClass[] = ['public', 'internal', 'confidential', 'restricted'];
    const roles = ['ground_ops', 'ops_manager', 'finance_ops', 'executive'];

    classifications.forEach(dataClass => {
      roles.forEach(role => {
        it(`should handle ${dataClass} data access for ${role}`, async () => {
          const user = createMockUser({ 
            roles: [{ role: { name: role }, isActive: true, assignedAt: new Date() }],
            piiScope: dataClass === 'restricted' ? 'full' : 'masked'
          });
          const context = createVehicleContext({ 
            dataClass,
            containsPII: dataClass === 'confidential' || dataClass === 'restricted'
          });

          const decision = await vehicleRBACEngine.evaluateVehicleAccess(
            user, 
            context, 
            'view_vehicles_detailed'
          );

          // Executive should always have access
          // Others depend on data classification and role permissions
          if (role === 'executive') {
            expect(decision.allowed).toBe(true);
          }
          
          // Restricted data should always require MFA
          if (dataClass === 'restricted' && decision.allowed) {
            expect(decision.requiresMFA).toBe(true);
          }
        });
      });
    });
  });
});