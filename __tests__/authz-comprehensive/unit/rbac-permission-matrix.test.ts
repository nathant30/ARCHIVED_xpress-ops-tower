// RBAC Permission Matrix Testing
// Comprehensive validation of 13 Xpress roles × 50+ permissions
// Ensures strict role hierarchy and permission boundaries

import { rbacEngine } from '@/lib/auth/rbac-engine';
import { TEST_USERS, TEST_REGIONS } from '../setup/test-users-data';
import { getTestEnvironmentConfig, SLO_THRESHOLDS } from '../setup/environment-config';
import { XPRESS_ROLES } from '@/types/rbac-abac';

describe('RBAC Permission Matrix Validation', () => {
  const testConfig = getTestEnvironmentConfig();
  let performanceMetrics: { operation: string; latency: number }[] = [];

  beforeAll(() => {
    // Initialize test environment
    process.env.JWT_SECRET = testConfig.jwt.secret;
    process.env.NODE_ENV = 'test';
  });

  beforeEach(() => {
    performanceMetrics = [];
  });

  afterEach(() => {
    // Validate SLO compliance
    const avgLatency = performanceMetrics.reduce((sum, m) => sum + m.latency, 0) / performanceMetrics.length;
    if (avgLatency > SLO_THRESHOLDS.POLICY_EVALUATION_LATENCY.critical) {
      console.warn(`Policy evaluation exceeded critical latency: ${avgLatency}ms`);
    }
  });

  describe('Role Hierarchy Validation', () => {
    it('should enforce strict role level hierarchy', () => {
      const roles = Object.entries(XPRESS_ROLES);
      
      // Verify level progression
      const sortedRoles = roles.sort((a, b) => a[1].level - b[1].level);
      
      expect(sortedRoles[0][1].level).toBe(10); // ground_ops
      expect(sortedRoles[sortedRoles.length - 1][1].level).toBe(90); // app_admin
      
      // Verify no duplicate levels except where intended
      const levels = sortedRoles.map(r => r[1].level);
      const levelCounts = levels.reduce((acc, level) => {
        acc[level] = (acc[level] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);
      
      // Only support(25) and analyst(25) should share a level
      expect(levelCounts[25]).toBe(2);
      Object.entries(levelCounts).forEach(([level, count]) => {
        if (parseInt(level) !== 25) {
          expect(count).toBe(1);
        }
      });
    });

    it('should validate role inheritance patterns', () => {
      // Higher level roles should not inherit from lower levels
      // (This system uses explicit permission lists, not inheritance)
      const groundOpsPerms = XPRESS_ROLES.ground_ops.permissions;
      const adminPerms = XPRESS_ROLES.app_admin.permissions;
      
      // Admin permissions should not include ground operations
      expect(adminPerms.includes('assign_driver')).toBe(false);
      expect(adminPerms.includes('manage_queue')).toBe(false);
      
      // Ground ops should not have admin permissions
      expect(groundOpsPerms.includes('manage_feature_flags')).toBe(false);
      expect(groundOpsPerms.includes('manage_users')).toBe(false);
    });
  });

  describe('Permission Boundary Testing', () => {
    it('should validate ground_ops permissions (Level 10)', async () => {
      const user = TEST_USERS.find(u => u.id === 'usr-ground-ops-001')!;
      
      // Allowed permissions
      const allowedTests = [
        { permission: 'assign_driver', resource: { regionId: TEST_REGIONS.NCR_MANILA } },
        { permission: 'contact_driver_masked', resource: { regionId: TEST_REGIONS.NCR_MANILA } },
        { permission: 'view_live_map', resource: { regionId: TEST_REGIONS.NCR_MANILA } }
      ];
      
      for (const test of allowedTests) {
        const startTime = Date.now();
        const result = await rbacEngine.evaluatePolicy({
          user,
          resource: { ...test.resource, dataClass: 'internal', containsPII: false },
          action: test.permission,
          context: { channel: 'ui', mfaPresent: false }
        });
        performanceMetrics.push({ operation: test.permission, latency: Date.now() - startTime });
        
        expect(result.decision).toBe('allow');
        expect(result.reasons[0]).toContain('RBAC permission granted');
      }
      
      // Denied permissions
      const deniedTests = [
        { permission: 'manage_users', expectedReason: 'Missing required permission' },
        { permission: 'unmask_pii_with_mfa', expectedReason: 'Missing required permission' },
        { permission: 'approve_temp_access_region', expectedReason: 'Missing required permission' }
      ];
      
      for (const test of deniedTests) {
        const result = await rbacEngine.evaluatePolicy({
          user,
          resource: { regionId: TEST_REGIONS.NCR_MANILA, dataClass: 'internal', containsPII: false },
          action: test.permission,
          context: { channel: 'ui', mfaPresent: false }
        });
        
        expect(result.decision).toBe('deny');
        expect(result.reasons.some(r => r.includes('Missing required permission'))).toBe(true);
      }
    });

    it('should validate regional_manager permissions (Level 40)', async () => {
      const user = TEST_USERS.find(u => u.id === 'usr-regional-manager-001')!;
      
      // Can approve temporary access in their region
      const tempAccessResult = await rbacEngine.evaluatePolicy({
        user,
        resource: { regionId: TEST_REGIONS.NCR_MANILA, dataClass: 'confidential', containsPII: false },
        action: 'approve_temp_access_region',
        context: { channel: 'ui', mfaPresent: true }
      });
      
      expect(tempAccessResult.decision).toBe('allow');
      expect(user.permissions).toContain('approve_temp_access_region');
      
      // Cannot manage users (IAM function)
      const iamResult = await rbacEngine.evaluatePolicy({
        user,
        resource: { regionId: TEST_REGIONS.NCR_MANILA, dataClass: 'confidential', containsPII: false },
        action: 'manage_users',
        context: { channel: 'ui', mfaPresent: true }
      });
      
      expect(iamResult.decision).toBe('deny');
    });

    it('should validate risk_investigator PII permissions (Level 35)', async () => {
      const user = TEST_USERS.find(u => u.id === 'usr-risk-investigator-001')!;
      
      // Can unmask PII with MFA
      const piiUnmaskResult = await rbacEngine.evaluatePolicy({
        user,
        resource: { 
          regionId: TEST_REGIONS.CEBU, 
          dataClass: 'restricted', 
          containsPII: true 
        },
        action: 'unmask_pii_with_mfa',
        context: { channel: 'ui', mfaPresent: true }
      });
      
      expect(piiUnmaskResult.decision).toBe('allow');
      expect(user.piiScope).toBe('full');
      
      // Cannot unmask PII without MFA
      const noMfaResult = await rbacEngine.evaluatePolicy({
        user,
        resource: { 
          regionId: TEST_REGIONS.CEBU, 
          dataClass: 'restricted', 
          containsPII: true 
        },
        action: 'unmask_pii_with_mfa',
        context: { channel: 'ui', mfaPresent: false }
      });
      
      expect(noMfaResult.decision).toBe('deny');
      expect(noMfaResult.obligations?.requireMFA).toBe(true);
    });

    it('should validate iam_admin global permissions (Level 80)', async () => {
      const user = TEST_USERS.find(u => u.id === 'usr-iam-admin-001')!;
      
      // Can manage users globally
      const userMgmtResult = await rbacEngine.evaluatePolicy({
        user,
        resource: { regionId: TEST_REGIONS.CEBU, dataClass: 'confidential', containsPII: true },
        action: 'manage_users',
        context: { channel: 'ui', mfaPresent: true }
      });
      
      expect(userMgmtResult.decision).toBe('allow');
      expect(user.allowedRegions).toEqual([]); // Global access
      
      // Cannot manage system configuration (app_admin function)
      const systemConfigResult = await rbacEngine.evaluatePolicy({
        user,
        resource: { regionId: TEST_REGIONS.CEBU, dataClass: 'internal', containsPII: false },
        action: 'manage_feature_flags',
        context: { channel: 'ui', mfaPresent: true }
      });
      
      expect(systemConfigResult.decision).toBe('deny');
    });

    it('should validate app_admin system permissions (Level 90)', async () => {
      const user = TEST_USERS.find(u => u.id === 'usr-app-admin-001')!;
      
      // Can manage system configuration
      const featureFlagResult = await rbacEngine.evaluatePolicy({
        user,
        resource: { regionId: TEST_REGIONS.NCR_MANILA, dataClass: 'internal', containsPII: false },
        action: 'manage_feature_flags',
        context: { channel: 'ui', mfaPresent: true }
      });
      
      expect(featureFlagResult.decision).toBe('allow');
      
      // Cannot manage users (separation of concerns)
      const userMgmtResult = await rbacEngine.evaluatePolicy({
        user,
        resource: { regionId: TEST_REGIONS.NCR_MANILA, dataClass: 'confidential', containsPII: false },
        action: 'manage_users',
        context: { channel: 'ui', mfaPresent: true }
      });
      
      expect(userMgmtResult.decision).toBe('deny');
      expect(user.piiScope).toBe('none'); // System admin doesn't need PII access
    });
  });

  describe('Permission Combination Validation', () => {
    it('should prevent role capability union attacks', async () => {
      // Simulate an attack where user tries to combine permissions from multiple roles
      const groundOpsUser = TEST_USERS.find(u => u.id === 'usr-ground-ops-001')!;
      
      // Ground ops should not gain admin permissions even if token is manipulated
      const manipulatedUser = {
        ...groundOpsUser,
        permissions: [...groundOpsUser.permissions, 'manage_users', 'unmask_pii_with_mfa']
      };
      
      // The system should validate against the role definition, not the token
      expect(XPRESS_ROLES.ground_ops.permissions).not.toContain('manage_users');
      expect(XPRESS_ROLES.ground_ops.permissions).not.toContain('unmask_pii_with_mfa');
      
      // Policy evaluation should reject invalid permission combinations
      const result = await rbacEngine.evaluatePolicy({
        user: manipulatedUser,
        resource: { regionId: TEST_REGIONS.NCR_MANILA, dataClass: 'confidential', containsPII: true },
        action: 'manage_users',
        context: { channel: 'ui', mfaPresent: false }
      });
      
      expect(result.decision).toBe('deny');
    });

    it('should validate multi-role users have correct permissions', async () => {
      // Create a test user with multiple roles (analyst + support)
      const multiRoleUser = {
        ...TEST_USERS.find(u => u.id === 'usr-analyst-001')!,
        roles: [
          ...TEST_USERS.find(u => u.id === 'usr-analyst-001')!.roles,
          ...TEST_USERS.find(u => u.id === 'usr-support-001')!.roles
        ]
      };
      
      // Should have permissions from both roles
      const analystPermission = await rbacEngine.evaluatePolicy({
        user: multiRoleUser,
        resource: { regionId: TEST_REGIONS.NCR_MANILA, dataClass: 'internal', containsPII: false },
        action: 'query_curated_views',
        context: { channel: 'ui', mfaPresent: false }
      });
      
      const supportPermission = await rbacEngine.evaluatePolicy({
        user: multiRoleUser,
        resource: { regionId: TEST_REGIONS.CEBU, dataClass: 'internal', containsPII: false },
        action: 'case_open',
        context: { channel: 'ui', mfaPresent: false }
      });
      
      expect(analystPermission.decision).toBe('allow');
      expect(supportPermission.decision).toBe('allow');
      
      // Should not have permissions outside both roles
      const adminPermission = await rbacEngine.evaluatePolicy({
        user: multiRoleUser,
        resource: { regionId: TEST_REGIONS.NCR_MANILA, dataClass: 'confidential', containsPII: false },
        action: 'manage_users',
        context: { channel: 'ui', mfaPresent: true }
      });
      
      expect(adminPermission.decision).toBe('deny');
    });
  });

  describe('Performance and SLO Validation', () => {
    it('should meet policy evaluation latency SLO', async () => {
      const user = TEST_USERS.find(u => u.id === 'usr-ops-manager-001')!;
      const iterations = 100;
      const latencies: number[] = [];
      
      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        await rbacEngine.evaluatePolicy({
          user,
          resource: { regionId: TEST_REGIONS.DAVAO, dataClass: 'internal', containsPII: false },
          action: 'assign_driver',
          context: { channel: 'ui', mfaPresent: false }
        });
        latencies.push(Date.now() - startTime);
      }
      
      const p95Latency = latencies.sort((a, b) => a - b)[Math.floor(iterations * 0.95)];
      const avgLatency = latencies.reduce((a, b) => a + b, 0) / iterations;
      
      expect(p95Latency).toBeLessThan(SLO_THRESHOLDS.POLICY_EVALUATION_LATENCY.target);
      expect(avgLatency).toBeLessThan(SLO_THRESHOLDS.POLICY_EVALUATION_LATENCY.warning);
      
      console.log(`Policy evaluation performance: avg=${avgLatency}ms, p95=${p95Latency}ms`);
    });

    it('should maintain policy cache consistency', async () => {
      const user = TEST_USERS.find(u => u.id === 'usr-ground-ops-001')!;
      const testPolicy = {
        user,
        resource: { regionId: TEST_REGIONS.NCR_MANILA, dataClass: 'internal', containsPII: false },
        action: 'assign_driver',
        context: { channel: 'ui', mfaPresent: false }
      };
      
      // First evaluation (cache miss)
      const result1 = await rbacEngine.evaluatePolicy(testPolicy);
      expect(result1.metadata.cacheHit).toBe(false);
      
      // Second evaluation (cache hit)
      const result2 = await rbacEngine.evaluatePolicy(testPolicy);
      expect(result2.metadata.cacheHit).toBe(true);
      expect(result2.decision).toBe(result1.decision);
      
      // Cache consistency check
      expect(result1.reasons).toEqual(result2.reasons);
    });
  });

  describe('Edge Case Validation', () => {
    it('should handle inactive roles correctly', async () => {
      const user = {
        ...TEST_USERS.find(u => u.id === 'usr-ground-ops-001')!,
        roles: [{
          ...TEST_USERS.find(u => u.id === 'usr-ground-ops-001')!.roles[0],
          isActive: false // Inactive role
        }]
      };
      
      const result = await rbacEngine.evaluatePolicy({
        user,
        resource: { regionId: TEST_REGIONS.NCR_MANILA, dataClass: 'internal', containsPII: false },
        action: 'assign_driver',
        context: { channel: 'ui', mfaPresent: false }
      });
      
      expect(result.decision).toBe('deny');
      expect(result.reasons).toContain('No active roles found');
    });

    it('should handle empty permission arrays', async () => {
      const user = {
        ...TEST_USERS.find(u => u.id === 'usr-ground-ops-001')!,
        permissions: [] // Empty permissions
      };
      
      const result = await rbacEngine.evaluatePolicy({
        user,
        resource: { regionId: TEST_REGIONS.NCR_MANILA, dataClass: 'internal', containsPII: false },
        action: 'assign_driver',
        context: { channel: 'ui', mfaPresent: false }
      });
      
      expect(result.decision).toBe('deny');
    });

    it('should validate malformed role data', async () => {
      const userWithMalformedRole = {
        ...TEST_USERS.find(u => u.id === 'usr-ground-ops-001')!,
        roles: [{
          id: 'invalid-role',
          role: null, // Malformed role reference
          assignedAt: new Date(),
          isActive: true,
          allowedRegions: []
        }]
      };
      
      const result = await rbacEngine.evaluatePolicy({
        user: userWithMalformedRole,
        resource: { regionId: TEST_REGIONS.NCR_MANILA, dataClass: 'internal', containsPII: false },
        action: 'assign_driver',
        context: { channel: 'ui', mfaPresent: false }
      });
      
      expect(result.decision).toBe('deny');
      expect(result.reasons).toContain('Invalid role configuration');
    });
  });
});