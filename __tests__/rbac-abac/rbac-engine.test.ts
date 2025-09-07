// RBAC + ABAC Engine Tests
// Comprehensive testing of policy evaluation engine

import { rbacEngine } from '@/lib/auth/rbac-engine';
import { 
  PolicyEvaluationRequest, 
  PolicyEvaluationResponse,
  ABACContext,
  EnhancedUser 
} from '@/types/rbac-abac';

describe('RBAC Engine', () => {
  beforeEach(() => {
    // Clear engine cache between tests
    rbacEngine['cache'].clear();
  });

  describe('Policy Evaluation', () => {
    it('should allow access for valid role and action', async () => {
      const request: PolicyEvaluationRequest = {
        user: {
          id: 'user-1',
          roles: ['ops_manager'],
          permissions: ['assign_driver', 'view_live_map'],
          allowedRegions: ['ncr-manila'],
          piiScope: 'masked'
        },
        resource: {
          type: 'booking',
          regionId: 'ncr-manila',
          dataClass: 'internal',
          containsPII: false
        },
        action: 'assign_driver',
        context: {
          channel: 'ui',
          mfaPresent: false,
          timestamp: new Date()
        }
      };

      const result = await rbacEngine.evaluatePolicy(request);

      expect(result.decision).toBe('allow');
      expect(result.reasons).toContain(expect.stringContaining('assign_driver'));
      expect(result.metadata.cacheHit).toBe(false);
    });

    it('should deny access for insufficient role permissions', async () => {
      const request: PolicyEvaluationRequest = {
        user: {
          id: 'user-2',
          roles: ['ops_monitor'],
          permissions: ['view_live_map'],
          allowedRegions: ['ncr-manila'],
          piiScope: 'none'
        },
        resource: {
          type: 'booking',
          regionId: 'ncr-manila',
          dataClass: 'internal',
          containsPII: false
        },
        action: 'assign_driver', // ops_monitor cannot assign drivers
        context: {
          channel: 'ui',
          mfaPresent: false,
          timestamp: new Date()
        }
      };

      const result = await rbacEngine.evaluatePolicy(request);

      expect(result.decision).toBe('deny');
      expect(result.reasons[0]).toContain('not permitted');
    });

    it('should deny access for wrong region', async () => {
      const request: PolicyEvaluationRequest = {
        user: {
          id: 'user-3',
          roles: ['ops_manager'],
          permissions: ['assign_driver', 'view_live_map'],
          allowedRegions: ['cebu'], // User only has access to Cebu
          piiScope: 'masked'
        },
        resource: {
          type: 'booking',
          regionId: 'ncr-manila', // Trying to access Manila
          dataClass: 'internal',
          containsPII: false
        },
        action: 'assign_driver',
        context: {
          channel: 'ui',
          mfaPresent: false,
          timestamp: new Date()
        }
      };

      const result = await rbacEngine.evaluatePolicy(request);

      expect(result.decision).toBe('deny');
      expect(result.reasons[0]).toContain('region ncr-manila');
    });

    it('should require MFA for restricted PII access', async () => {
      const request: PolicyEvaluationRequest = {
        user: {
          id: 'user-4',
          roles: ['risk_investigator'],
          permissions: ['unmask_pii_with_mfa'],
          allowedRegions: [],
          piiScope: 'full'
        },
        resource: {
          type: 'user_profile',
          dataClass: 'restricted',
          containsPII: true
        },
        action: 'unmask_pii_with_mfa',
        context: {
          channel: 'ui',
          mfaPresent: false, // No MFA present
          timestamp: new Date()
        }
      };

      const result = await rbacEngine.evaluatePolicy(request);

      expect(result.decision).toBe('deny');
      expect(result.obligations?.requireMFA).toBe(true);
    });

    it('should allow restricted PII access with MFA', async () => {
      const request: PolicyEvaluationRequest = {
        user: {
          id: 'user-5',
          roles: ['risk_investigator'],
          permissions: ['unmask_pii_with_mfa'],
          allowedRegions: [],
          piiScope: 'full'
        },
        resource: {
          type: 'user_profile',
          dataClass: 'restricted',
          containsPII: true
        },
        action: 'unmask_pii_with_mfa',
        context: {
          channel: 'ui',
          mfaPresent: true, // MFA verified
          timestamp: new Date()
        }
      };

      const result = await rbacEngine.evaluatePolicy(request);

      expect(result.decision).toBe('allow');
      expect(result.obligations?.requireMFA).toBe(true);
      expect(result.obligations?.auditLevel).toBe('enhanced');
    });

    it('should apply PII masking for masked scope', async () => {
      const request: PolicyEvaluationRequest = {
        user: {
          id: 'user-6',
          roles: ['support'],
          permissions: ['view_masked_profiles'],
          allowedRegions: [],
          piiScope: 'masked'
        },
        resource: {
          type: 'user_profile',
          dataClass: 'confidential',
          containsPII: true
        },
        action: 'view_masked_profiles',
        context: {
          channel: 'ui',
          mfaPresent: false,
          timestamp: new Date()
        }
      };

      const result = await rbacEngine.evaluatePolicy(request);

      expect(result.decision).toBe('allow');
      expect(result.obligations?.maskFields).toBeDefined();
      expect(result.obligations?.maskFields).toContain('phone');
      expect(result.obligations?.maskFields).toContain('email');
    });

    it('should use cache for repeated requests', async () => {
      const request: PolicyEvaluationRequest = {
        user: {
          id: 'user-7',
          roles: ['ops_manager'],
          permissions: ['assign_driver'],
          allowedRegions: ['ncr-manila'],
          piiScope: 'masked'
        },
        resource: {
          type: 'booking',
          regionId: 'ncr-manila',
          dataClass: 'internal',
          containsPII: false
        },
        action: 'assign_driver',
        context: {
          channel: 'ui',
          mfaPresent: false,
          timestamp: new Date()
        }
      };

      // First request
      const result1 = await rbacEngine.evaluatePolicy(request);
      expect(result1.metadata.cacheHit).toBe(false);

      // Second identical request should use cache
      const result2 = await rbacEngine.evaluatePolicy(request);
      expect(result2.metadata.cacheHit).toBe(true);
      expect(result2.decision).toBe(result1.decision);
    });
  });

  describe('Cross-Region Override Path', () => {
    it('should allow support role cross-region access with valid case', async () => {
      const request: PolicyEvaluationRequest = {
        user: {
          id: 'user-8',
          roles: ['support'],
          permissions: ['case_open', 'escalate_to_risk'],
          allowedRegions: ['cebu'],
          piiScope: 'masked',
          escalation: {
            caseId: 'CASE-2025-001',
            expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000) // 4 hours from now
          }
        },
        resource: {
          type: 'user_profile',
          regionId: 'ncr-manila', // Different region
          dataClass: 'internal',
          containsPII: true
        },
        action: 'case_open',
        context: {
          channel: 'ui',
          mfaPresent: true, // Override requires MFA
          timestamp: new Date()
        }
      };

      const result = await rbacEngine.evaluatePolicy(request);

      expect(result.decision).toBe('allow');
      expect(result.reasons[0]).toContain('Cross-region override granted');
      expect(result.obligations?.requireMFA).toBe(true);
      expect(result.obligations?.auditLevel).toBe('enhanced');
    });

    it('should deny cross-region access without valid escalation', async () => {
      const request: PolicyEvaluationRequest = {
        user: {
          id: 'user-9',
          roles: ['support'],
          permissions: ['case_open'],
          allowedRegions: ['cebu'],
          piiScope: 'masked'
          // No escalation context
        },
        resource: {
          type: 'user_profile',
          regionId: 'ncr-manila',
          dataClass: 'internal',
          containsPII: true
        },
        action: 'case_open',
        context: {
          channel: 'ui',
          mfaPresent: false,
          timestamp: new Date()
        }
      };

      const result = await rbacEngine.evaluatePolicy(request);

      expect(result.decision).toBe('deny');
      expect(result.reasons[0]).toContain('region ncr-manila');
    });
  });

  describe('User Permission Validation', () => {
    it('should correctly aggregate permissions from multiple roles', () => {
      const user: EnhancedUser = {
        id: 'user-10',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        timezone: 'Asia/Manila',
        locale: 'en-PH',
        status: 'active',
        allowedRegions: ['ncr-manila'],
        piiScope: 'masked',
        mfaEnabled: true,
        trustedDevices: [],
        failedLoginAttempts: 0,
        loginCount: 1,
        roles: [
          {
            id: 'assignment-1',
            userId: 'user-10',
            roleId: 'ops-manager',
            role: {
              id: 'ops-manager',
              name: 'ops_manager',
              displayName: 'Operations Manager',
              level: 30,
              permissions: ['assign_driver', 'view_live_map', 'manage_queue'],
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
            id: 'assignment-2',
            userId: 'user-10',
            roleId: 'support',
            role: {
              id: 'support',
              name: 'support',
              displayName: 'Customer Support',
              level: 25,
              permissions: ['case_open', 'case_close', 'view_ticket_history'],
              inheritsFrom: [],
              isSystem: true,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            allowedRegions: [],
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

      const permissions = rbacEngine.validateUserPermissions(user);

      expect(permissions).toContain('assign_driver');
      expect(permissions).toContain('view_live_map');
      expect(permissions).toContain('manage_queue');
      expect(permissions).toContain('case_open');
      expect(permissions).toContain('case_close');
      expect(permissions).toContain('view_ticket_history');
    });

    it('should include temporary access permissions', () => {
      const user: EnhancedUser = {
        id: 'user-11',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        timezone: 'Asia/Manila',
        locale: 'en-PH',
        status: 'active',
        allowedRegions: ['cebu'],
        piiScope: 'masked',
        mfaEnabled: true,
        trustedDevices: [],
        failedLoginAttempts: 0,
        loginCount: 1,
        roles: [
          {
            id: 'assignment-1',
            userId: 'user-11',
            roleId: 'support',
            role: {
              id: 'support',
              name: 'support',
              displayName: 'Customer Support',
              level: 25,
              permissions: ['case_open', 'case_close'],
              inheritsFrom: [],
              isSystem: true,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            allowedRegions: ['cebu'],
            validFrom: new Date(),
            assignedAt: new Date(),
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        permissions: [],
        temporaryAccess: [
          {
            id: 'temp-1',
            userId: 'user-11',
            escalationType: 'support',
            grantedPermissions: ['unmask_pii_with_mfa'],
            grantedRegions: ['ncr-manila'],
            requestedBy: 'manager-1',
            requestedAt: new Date(),
            expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours
            justification: 'Emergency case investigation',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      };

      const permissions = rbacEngine.validateUserPermissions(user);
      const regions = rbacEngine.getEffectiveRegions(user);

      expect(permissions).toContain('case_open');
      expect(permissions).toContain('unmask_pii_with_mfa'); // From temporary access
      expect(regions).toContain('cebu');
      expect(regions).toContain('ncr-manila'); // From temporary access
    });

    it('should ignore expired temporary access', () => {
      const user: EnhancedUser = {
        id: 'user-12',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        timezone: 'Asia/Manila',
        locale: 'en-PH',
        status: 'active',
        allowedRegions: ['cebu'],
        piiScope: 'masked',
        mfaEnabled: true,
        trustedDevices: [],
        failedLoginAttempts: 0,
        loginCount: 1,
        roles: [
          {
            id: 'assignment-1',
            userId: 'user-12',
            roleId: 'support',
            role: {
              id: 'support',
              name: 'support',
              displayName: 'Customer Support',
              level: 25,
              permissions: ['case_open'],
              inheritsFrom: [],
              isSystem: true,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            allowedRegions: ['cebu'],
            validFrom: new Date(),
            assignedAt: new Date(),
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        permissions: [],
        temporaryAccess: [
          {
            id: 'temp-2',
            userId: 'user-12',
            escalationType: 'support',
            grantedPermissions: ['unmask_pii_with_mfa'],
            grantedRegions: ['ncr-manila'],
            requestedBy: 'manager-1',
            requestedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
            expiresAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // Expired 2 hours ago
            justification: 'Expired case investigation',
            isActive: false,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      };

      const permissions = rbacEngine.validateUserPermissions(user);
      const regions = rbacEngine.getEffectiveRegions(user);

      expect(permissions).toContain('case_open');
      expect(permissions).not.toContain('unmask_pii_with_mfa'); // Expired
      expect(regions).toContain('cebu');
      expect(regions).not.toContain('ncr-manila'); // Expired
    });
  });

  describe('PII Scope Elevation', () => {
    it('should return highest PII scope from temporary access', () => {
      const user: EnhancedUser = {
        id: 'user-13',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        timezone: 'Asia/Manila',
        locale: 'en-PH',
        status: 'active',
        allowedRegions: ['cebu'],
        piiScope: 'masked', // Base PII scope
        mfaEnabled: true,
        trustedDevices: [],
        failedLoginAttempts: 0,
        loginCount: 1,
        roles: [],
        permissions: [],
        temporaryAccess: [
          {
            id: 'temp-3',
            userId: 'user-13',
            escalationType: 'risk_investigator',
            grantedPermissions: ['unmask_pii_with_mfa'],
            grantedRegions: [],
            piiScopeOverride: 'full', // Elevated to full
            requestedBy: 'manager-1',
            requestedAt: new Date(),
            expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
            justification: 'Fraud investigation',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      };

      const effectivePIIScope = rbacEngine.getEffectivePIIScope(user);

      expect(effectivePIIScope).toBe('full'); // Elevated from 'masked' to 'full'
    });
  });
});