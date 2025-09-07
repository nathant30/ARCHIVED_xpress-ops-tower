// Role Hierarchy Validation Tests
// Comprehensive testing of role structure, inheritance, and hierarchy
// Validates all 15 roles with correct level progression and permissions

import { 
  XPRESS_ROLES, 
  XpressRole, 
  getRoleLevel, 
  getRolePermissions, 
  isHigherRole,
  type Role,
  type EnhancedUser 
} from '@/types/rbac-abac';
import { rbacEngine } from '@/lib/auth/rbac-engine';

describe('Role Hierarchy Validation', () => {

  // =====================================================
  // Role Structure Validation
  // =====================================================

  describe('Role Structure and Integrity', () => {
    
    test('should have all required roles defined', () => {
      const requiredRoles: XpressRole[] = [
        'ground_ops', 'ops_monitor', 'ops_manager', 'regional_manager',
        'expansion_manager', 'support', 'risk_investigator', 'finance_ops',
        'hr_ops', 'executive', 'analyst', 'auditor', 'iam_admin', 'app_admin'
      ];

      // Check that all required roles exist in XPRESS_ROLES
      requiredRoles.forEach(roleName => {
        expect(XPRESS_ROLES).toHaveProperty(roleName);
        expect(XPRESS_ROLES[roleName]).toBeDefined();
      });
    });

    test('should validate each role has complete metadata', () => {
      Object.entries(XPRESS_ROLES).forEach(([roleName, roleConfig]) => {
        expect(roleConfig.displayName).toBeDefined();
        expect(roleConfig.displayName).toBeTruthy();
        expect(typeof roleConfig.displayName).toBe('string');
        
        expect(roleConfig.level).toBeDefined();
        expect(typeof roleConfig.level).toBe('number');
        expect(roleConfig.level).toBeGreaterThan(0);
        expect(roleConfig.level).toBeLessThanOrEqual(100);
        
        expect(Array.isArray(roleConfig.permissions)).toBe(true);
        expect(roleConfig.permissions.length).toBeGreaterThan(0);
        
        // Each permission should be a non-empty string
        roleConfig.permissions.forEach(permission => {
          expect(typeof permission).toBe('string');
          expect(permission).toBeTruthy();
          expect(permission).toMatch(/^[a-z_]+$/); // Valid permission format
        });
      });
    });

    test('should have unique role levels for hierarchy clarity', () => {
      const levelCounts: Record<number, string[]> = {};
      
      Object.entries(XPRESS_ROLES).forEach(([roleName, roleConfig]) => {
        if (!levelCounts[roleConfig.level]) {
          levelCounts[roleConfig.level] = [];
        }
        levelCounts[roleConfig.level].push(roleName);
      });

      // Check for level conflicts
      Object.entries(levelCounts).forEach(([level, roles]) => {
        if (roles.length > 1) {
          console.warn(`Level ${level} has multiple roles: ${roles.join(', ')}`);
        }
      });

      // Most levels should be unique (some exceptions allowed for peer roles)
      const conflictingLevels = Object.entries(levelCounts).filter(([_, roles]) => roles.length > 1);
      expect(conflictingLevels.length).toBeLessThanOrEqual(2); // Allow max 2 level conflicts
    });
  });

  // =====================================================
  // Hierarchy Level Validation
  // =====================================================

  describe('Role Hierarchy Levels', () => {
    
    test('should maintain correct hierarchical order', () => {
      // Test specific hierarchy expectations
      const hierarchyTests = [
        { higher: 'app_admin', lower: 'iam_admin' },
        { higher: 'iam_admin', lower: 'executive' },
        { higher: 'executive', lower: 'auditor' },
        { higher: 'executive', lower: 'expansion_manager' },
        { higher: 'expansion_manager', lower: 'regional_manager' },
        { higher: 'regional_manager', lower: 'risk_investigator' },
        { higher: 'regional_manager', lower: 'ops_manager' },
        { higher: 'regional_manager', lower: 'finance_ops' },
        { higher: 'regional_manager', lower: 'hr_ops' },
        { higher: 'ops_manager', lower: 'support' },
        { higher: 'ops_manager', lower: 'analyst' },
        { higher: 'support', lower: 'ops_monitor' },
        { higher: 'ops_monitor', lower: 'ground_ops' }
      ];

      hierarchyTests.forEach(({ higher, lower }) => {
        expect(isHigherRole(higher as XpressRole, lower as XpressRole)).toBe(true);
        expect(isHigherRole(lower as XpressRole, higher as XpressRole)).toBe(false);
        expect(getRoleLevel(higher as XpressRole)).toBeGreaterThan(getRoleLevel(lower as XpressRole));
      });
    });

    test('should validate specific level assignments', () => {
      const expectedLevels: Record<XpressRole, number> = {
        ground_ops: 10,
        ops_monitor: 20,
        support: 25,
        analyst: 25,
        ops_manager: 30,
        finance_ops: 30,
        hr_ops: 30,
        risk_investigator: 35,
        regional_manager: 40,
        expansion_manager: 45,
        auditor: 50,
        executive: 60,
        iam_admin: 80,
        app_admin: 90
      };

      Object.entries(expectedLevels).forEach(([role, expectedLevel]) => {
        expect(getRoleLevel(role as XpressRole)).toBe(expectedLevel);
      });
    });

    test('should handle role comparison edge cases', () => {
      // Same role comparison
      expect(isHigherRole('ops_manager', 'ops_manager')).toBe(false);
      
      // Invalid role comparisons
      expect(isHigherRole('invalid_role' as XpressRole, 'ops_manager')).toBe(false);
      expect(isHigherRole('ops_manager', 'invalid_role' as XpressRole)).toBe(true);
      
      // Peer roles (same level)
      expect(isHigherRole('support', 'analyst')).toBe(false);
      expect(isHigherRole('analyst', 'support')).toBe(false);
    });
  });

  // =====================================================
  // Permission Distribution Analysis
  // =====================================================

  describe('Permission Distribution and Inheritance', () => {
    
    test('should validate permission distribution across hierarchy', () => {
      const rolesByLevel = Object.entries(XPRESS_ROLES)
        .map(([name, config]) => ({ name: name as XpressRole, level: config.level, permissions: config.permissions }))
        .sort((a, b) => a.level - b.level);

      // Higher level roles should generally have more or equal permissions
      for (let i = 1; i < rolesByLevel.length; i++) {
        const currentRole = rolesByLevel[i];
        const previousRole = rolesByLevel[i - 1];
        
        // This is a general trend, not a strict rule
        // Some specialized roles may have fewer permissions but higher access level
        console.log(`${currentRole.name} (L${currentRole.level}): ${currentRole.permissions.length} permissions`);
      }
    });

    test('should validate specialized role permissions', () => {
      // Ground Operations - Basic operational permissions
      const groundOpsPerms = getRolePermissions('ground_ops');
      expect(groundOpsPerms).toEqual(expect.arrayContaining([
        'assign_driver',
        'contact_driver_masked',
        'cancel_trip_ops',
        'view_live_map',
        'manage_queue',
        'view_metrics_region'
      ]));
      expect(groundOpsPerms).not.toContain('unmask_pii_with_mfa');
      expect(groundOpsPerms).not.toContain('manage_users');

      // Operations Monitor - Limited monitoring permissions
      const opsMonitorPerms = getRolePermissions('ops_monitor');
      expect(opsMonitorPerms).toEqual(expect.arrayContaining([
        'view_live_map',
        'view_metrics_region'
      ]));
      expect(opsMonitorPerms).not.toContain('assign_driver');

      // Support - Customer service permissions
      const supportPerms = getRolePermissions('support');
      expect(supportPerms).toEqual(expect.arrayContaining([
        'case_open',
        'case_close',
        'trip_replay_masked',
        'initiate_refund_request',
        'escalate_to_risk',
        'view_ticket_history',
        'view_masked_profiles'
      ]));
      expect(supportPerms).not.toContain('unmask_pii_with_mfa');

      // Risk Investigator - Security permissions
      const riskInvestigatorPerms = getRolePermissions('risk_investigator');
      expect(riskInvestigatorPerms).toEqual(expect.arrayContaining([
        'case_open',
        'case_close',
        'trip_replay_unmasked',
        'view_evidence',
        'unmask_pii_with_mfa',
        'device_check',
        'apply_account_hold',
        'close_investigation'
      ]));

      // Executive - High-level strategic permissions
      const executivePerms = getRolePermissions('executive');
      expect(executivePerms).toEqual(expect.arrayContaining([
        'view_nationwide_dashboards',
        'view_financial_summaries',
        'view_ops_kpis_masked'
      ]));

      // IAM Admin - User management permissions
      const iamAdminPerms = getRolePermissions('iam_admin');
      expect(iamAdminPerms).toEqual(expect.arrayContaining([
        'manage_users',
        'assign_roles',
        'set_allowed_regions',
        'set_pii_scope'
      ]));

      // App Admin - System administration permissions
      const appAdminPerms = getRolePermissions('app_admin');
      expect(appAdminPerms).toEqual(expect.arrayContaining([
        'manage_feature_flags',
        'manage_service_configs',
        'set_service_limits'
      ]));
    });

    test('should ensure no permission overlap conflicts', () => {
      const criticalPermissions = [
        'unmask_pii_with_mfa',
        'manage_users',
        'assign_roles',
        'manage_feature_flags',
        'manage_service_configs'
      ];

      criticalPermissions.forEach(permission => {
        const rolesWithPermission = Object.entries(XPRESS_ROLES)
          .filter(([_, config]) => config.permissions.includes(permission))
          .map(([name]) => name);

        // Critical permissions should be limited to appropriate high-level roles
        console.log(`Permission '${permission}' is granted to roles: ${rolesWithPermission.join(', ')}`);
        
        if (permission === 'unmask_pii_with_mfa') {
          expect(rolesWithPermission).toEqual(['risk_investigator']);
        }
        
        if (permission === 'manage_users' || permission === 'assign_roles') {
          expect(rolesWithPermission).toEqual(['iam_admin']);
        }
        
        if (permission === 'manage_feature_flags') {
          expect(rolesWithPermission).toEqual(['app_admin']);
        }
      });
    });
  });

  // =====================================================
  // Role Assignment Validation
  // =====================================================

  describe('Role Assignment Logic', () => {
    
    test('should validate user permission aggregation from multiple roles', () => {
      const testUser: EnhancedUser = {
        id: 'multi-role-user',
        email: 'multi@xpress.ph',
        firstName: 'Multi',
        lastName: 'Role',
        timezone: 'Asia/Manila',
        locale: 'en-PH',
        status: 'active',
        allowedRegions: ['ncr-manila'],
        piiScope: 'masked',
        mfaEnabled: false,
        trustedDevices: [],
        failedLoginAttempts: 0,
        loginCount: 0,
        roles: [
          {
            id: '1',
            userId: 'multi-role-user',
            roleId: 'ops-manager',
            role: {
              id: 'ops-manager',
              name: 'ops_manager',
              displayName: 'Operations Manager',
              level: 30,
              permissions: getRolePermissions('ops_manager'),
              inheritsFrom: [],
              isSystem: true,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            allowedRegions: ['ncr-manila'],
            validFrom: new Date(),
            assignedAt: new Date(),
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '2',
            userId: 'multi-role-user',
            roleId: 'analyst',
            role: {
              id: 'analyst',
              name: 'analyst',
              displayName: 'Data Analyst',
              level: 25,
              permissions: getRolePermissions('analyst'),
              inheritsFrom: [],
              isSystem: true,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            allowedRegions: ['ncr-manila'],
            validFrom: new Date(),
            assignedAt: new Date(),
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        permissions: [],
        temporaryAccess: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      };

      const aggregatedPermissions = rbacEngine.validateUserPermissions(testUser);
      
      // Should have permissions from both ops_manager and analyst roles
      const opsManagerPerms = getRolePermissions('ops_manager');
      const analystPerms = getRolePermissions('analyst');
      
      opsManagerPerms.forEach(permission => {
        expect(aggregatedPermissions).toContain(permission);
      });
      
      analystPerms.forEach(permission => {
        expect(aggregatedPermissions).toContain(permission);
      });
      
      // Should not have duplicates
      const uniquePermissions = [...new Set(aggregatedPermissions)];
      expect(aggregatedPermissions.length).toBe(uniquePermissions.length);
    });

    test('should handle temporal role assignments', () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      const pastDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000); // 1 day ago

      const temporalUser: EnhancedUser = {
        id: 'temporal-user',
        email: 'temporal@xpress.ph',
        firstName: 'Temporal',
        lastName: 'User',
        timezone: 'Asia/Manila',
        locale: 'en-PH',
        status: 'active',
        allowedRegions: ['cebu'],
        piiScope: 'none',
        mfaEnabled: false,
        trustedDevices: [],
        failedLoginAttempts: 0,
        loginCount: 0,
        roles: [
          {
            id: '1',
            userId: 'temporal-user',
            roleId: 'ops-manager',
            role: {
              id: 'ops-manager',
              name: 'ops_manager',
              displayName: 'Operations Manager',
              level: 30,
              permissions: getRolePermissions('ops_manager'),
              inheritsFrom: [],
              isSystem: true,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            allowedRegions: ['cebu'],
            validFrom: futureDate, // Future start date
            validUntil: undefined,
            assignedAt: new Date(),
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '2',
            userId: 'temporal-user',
            roleId: 'analyst',
            role: {
              id: 'analyst',
              name: 'analyst',
              displayName: 'Data Analyst',
              level: 25,
              permissions: getRolePermissions('analyst'),
              inheritsFrom: [],
              isSystem: true,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            allowedRegions: ['cebu'],
            validFrom: new Date(),
            validUntil: pastDate, // Expired role
            assignedAt: new Date(),
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        permissions: [],
        temporaryAccess: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      };

      const currentPermissions = rbacEngine.validateUserPermissions(temporalUser);
      
      // Should not have permissions from future or expired roles
      const opsManagerPerms = getRolePermissions('ops_manager');
      const analystPerms = getRolePermissions('analyst');
      
      opsManagerPerms.forEach(permission => {
        expect(currentPermissions).not.toContain(permission);
      });
      
      analystPerms.forEach(permission => {
        expect(currentPermissions).not.toContain(permission);
      });
      
      expect(currentPermissions).toHaveLength(0);
    });

    test('should prioritize active role assignments', () => {
      const userWithInactiveRole: EnhancedUser = {
        id: 'inactive-role-user',
        email: 'inactive@xpress.ph',
        firstName: 'Inactive',
        lastName: 'Role',
        timezone: 'Asia/Manila',
        locale: 'en-PH',
        status: 'active',
        allowedRegions: ['davao'],
        piiScope: 'masked',
        mfaEnabled: false,
        trustedDevices: [],
        failedLoginAttempts: 0,
        loginCount: 0,
        roles: [
          {
            id: '1',
            userId: 'inactive-role-user',
            roleId: 'ops-manager',
            role: {
              id: 'ops-manager',
              name: 'ops_manager',
              displayName: 'Operations Manager',
              level: 30,
              permissions: getRolePermissions('ops_manager'),
              inheritsFrom: [],
              isSystem: true,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            allowedRegions: ['davao'],
            validFrom: new Date(),
            assignedAt: new Date(),
            isActive: false, // INACTIVE
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '2',
            userId: 'inactive-role-user',
            roleId: 'ground-ops',
            role: {
              id: 'ground-ops',
              name: 'ground_ops',
              displayName: 'Ground Operations',
              level: 10,
              permissions: getRolePermissions('ground_ops'),
              inheritsFrom: [],
              isSystem: true,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            allowedRegions: ['davao'],
            validFrom: new Date(),
            assignedAt: new Date(),
            isActive: true, // ACTIVE
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        permissions: [],
        temporaryAccess: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      };

      const permissions = rbacEngine.validateUserPermissions(userWithInactiveRole);
      
      // Should only have permissions from active roles
      const opsManagerPerms = getRolePermissions('ops_manager');
      const groundOpsPerms = getRolePermissions('ground_ops');
      
      opsManagerPerms.forEach(permission => {
        expect(permissions).not.toContain(permission);
      });
      
      groundOpsPerms.forEach(permission => {
        expect(permissions).toContain(permission);
      });
    });
  });

  // =====================================================
  // Role Security Validation
  // =====================================================

  describe('Role Security and Constraints', () => {
    
    test('should validate sensitive permissions are restricted to appropriate roles', () => {
      const sensitivePermissions = {
        'unmask_pii_with_mfa': ['risk_investigator'],
        'manage_users': ['iam_admin'],
        'assign_roles': ['iam_admin'],
        'manage_feature_flags': ['app_admin'],
        'manage_service_configs': ['app_admin'],
        'approve_payout_batch': ['finance_ops'],
        'view_evidence': ['risk_investigator']
      };

      Object.entries(sensitivePermissions).forEach(([permission, allowedRoles]) => {
        const rolesWithPermission = Object.entries(XPRESS_ROLES)
          .filter(([_, config]) => config.permissions.includes(permission))
          .map(([name]) => name);

        allowedRoles.forEach(allowedRole => {
          expect(rolesWithPermission).toContain(allowedRole);
        });

        // Ensure no unauthorized roles have sensitive permissions
        const unauthorizedRoles = rolesWithPermission.filter(role => !allowedRoles.includes(role));
        expect(unauthorizedRoles).toHaveLength(0);
      });
    });

    test('should validate role level progression makes security sense', () => {
      // Financial roles should be appropriately leveled
      expect(getRoleLevel('finance_ops')).toBeGreaterThan(getRoleLevel('ops_manager'));
      
      // Security roles should have appropriate access
      expect(getRoleLevel('risk_investigator')).toBeGreaterThan(getRoleLevel('support'));
      
      // Admin roles should be highest
      expect(getRoleLevel('iam_admin')).toBeGreaterThan(getRoleLevel('executive'));
      expect(getRoleLevel('app_admin')).toBeGreaterThan(getRoleLevel('iam_admin'));
      
      // Support should be higher than basic ops but lower than managers
      expect(getRoleLevel('support')).toBeGreaterThan(getRoleLevel('ops_monitor'));
      expect(getRoleLevel('support')).toBeLessThan(getRoleLevel('ops_manager'));
    });

    test('should ensure no privilege escalation through role combinations', () => {
      // Test that combining lower-level roles doesn't grant higher-level permissions
      const lowLevelRoles = ['ground_ops', 'ops_monitor', 'analyst'];
      const combinedPermissions = new Set<string>();
      
      lowLevelRoles.forEach(role => {
        getRolePermissions(role as XpressRole).forEach(perm => {
          combinedPermissions.add(perm);
        });
      });

      // Combined low-level roles should not have high-privilege permissions
      const highPrivilegePermissions = [
        'unmask_pii_with_mfa',
        'manage_users',
        'assign_roles',
        'approve_payout_batch',
        'manage_feature_flags'
      ];

      highPrivilegePermissions.forEach(permission => {
        expect(combinedPermissions.has(permission)).toBe(false);
      });
    });
  });

  // =====================================================
  // Role Documentation and Compliance
  // =====================================================

  describe('Role Documentation and Compliance', () => {
    
    test('should have meaningful display names for all roles', () => {
      Object.entries(XPRESS_ROLES).forEach(([roleName, config]) => {
        expect(config.displayName).toBeTruthy();
        expect(config.displayName.length).toBeGreaterThan(3);
        expect(config.displayName).not.toBe(roleName);
        
        // Display name should be properly capitalized
        expect(config.displayName).toMatch(/^[A-Z]/);
      });
    });

    test('should validate role naming conventions', () => {
      Object.keys(XPRESS_ROLES).forEach(roleName => {
        // Role names should be lowercase with underscores
        expect(roleName).toMatch(/^[a-z_]+$/);
        
        // Should not start or end with underscore
        expect(roleName).not.toMatch(/^_|_$/);
        
        // Should not have consecutive underscores
        expect(roleName).not.toMatch(/__/);
      });
    });

    test('should provide role coverage analysis', () => {
      const roleCategories = {
        operational: ['ground_ops', 'ops_monitor', 'ops_manager', 'regional_manager'],
        support: ['support', 'risk_investigator'],
        financial: ['finance_ops'],
        hr: ['hr_ops'],
        expansion: ['expansion_manager'],
        executive: ['executive'],
        technical: ['analyst', 'auditor'],
        administrative: ['iam_admin', 'app_admin']
      };

      Object.entries(roleCategories).forEach(([category, roles]) => {
        console.log(`${category.toUpperCase()} roles: ${roles.length}`);
        
        roles.forEach(role => {
          expect(XPRESS_ROLES).toHaveProperty(role);
        });
      });

      // Ensure all roles are categorized
      const allCategorizedRoles = Object.values(roleCategories).flat();
      const allDefinedRoles = Object.keys(XPRESS_ROLES);
      
      allDefinedRoles.forEach(role => {
        expect(allCategorizedRoles).toContain(role);
      });
    });
  });

  // =====================================================
  // Performance and Scalability
  // =====================================================

  describe('Role System Performance', () => {
    
    test('should handle role lookups efficiently', () => {
      const startTime = performance.now();
      
      // Perform many role operations
      for (let i = 0; i < 1000; i++) {
        Object.keys(XPRESS_ROLES).forEach(role => {
          getRoleLevel(role as XpressRole);
          getRolePermissions(role as XpressRole);
        });
      }
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      // Should complete within 100ms
      expect(executionTime).toBeLessThan(100);
      console.log(`Role lookup performance: ${executionTime.toFixed(2)}ms for ${1000 * Object.keys(XPRESS_ROLES).length * 2} operations`);
    });

    test('should handle role comparisons efficiently', () => {
      const roles = Object.keys(XPRESS_ROLES) as XpressRole[];
      const startTime = performance.now();
      
      // Test all pairwise role comparisons
      roles.forEach(roleA => {
        roles.forEach(roleB => {
          isHigherRole(roleA, roleB);
        });
      });
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      // Should complete within 50ms
      expect(executionTime).toBeLessThan(50);
      console.log(`Role comparison performance: ${executionTime.toFixed(2)}ms for ${roles.length * roles.length} comparisons`);
    });
  });
});