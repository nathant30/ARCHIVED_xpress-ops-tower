// Regional Access Control Testing
// Validates Philippines market regional boundaries and cross-region override policies
// Tests NCR-Manila, Cebu, Davao region isolation and emergency access paths

import { rbacEngine } from '@/lib/auth/rbac-engine';
import { TEST_USERS, TEST_REGIONS, TEST_CASES } from '../setup/test-users-data';
import { getTestEnvironmentConfig, SECURITY_TEST_VECTORS } from '../setup/environment-config';

describe('Regional Access Control Validation', () => {
  const testConfig = getTestEnvironmentConfig();

  beforeAll(() => {
    process.env.JWT_SECRET = testConfig.jwt.secret;
    process.env.NODE_ENV = 'test';
  });

  describe('Regional Boundary Enforcement', () => {
    it('should enforce strict Manila region boundaries', async () => {
      const manilaUser = TEST_USERS.find(u => u.id === 'usr-ground-ops-001')!; // Manila only
      
      // Should allow access to Manila resources
      const manilaAccessResult = await rbacEngine.evaluatePolicy({
        user: manilaUser,
        resource: { 
          regionId: TEST_REGIONS.NCR_MANILA, 
          dataClass: 'internal', 
          containsPII: false 
        },
        action: 'assign_driver',
        context: { channel: 'ui', mfaPresent: false }
      });
      
      expect(manilaAccessResult.decision).toBe('allow');
      expect(manilaAccessResult.reasons).toContain('RBAC permission granted');
      
      // Should deny access to Cebu resources
      const cebuAccessResult = await rbacEngine.evaluatePolicy({
        user: manilaUser,
        resource: { 
          regionId: TEST_REGIONS.CEBU, 
          dataClass: 'internal', 
          containsPII: false 
        },
        action: 'assign_driver',
        context: { channel: 'ui', mfaPresent: false }
      });
      
      expect(cebuAccessResult.decision).toBe('deny');
      expect(cebuAccessResult.reasons).toContain('Regional access denied');
      
      // Should deny access to Davao resources
      const davaoAccessResult = await rbacEngine.evaluatePolicy({
        user: manilaUser,
        resource: { 
          regionId: TEST_REGIONS.DAVAO, 
          dataClass: 'internal', 
          containsPII: false 
        },
        action: 'assign_driver',
        context: { channel: 'ui', mfaPresent: false }
      });
      
      expect(davaoAccessResult.decision).toBe('deny');
      expect(davaoAccessResult.reasons).toContain('Regional access denied');
    });

    it('should enforce strict Cebu region boundaries', async () => {
      const cebuUser = TEST_USERS.find(u => u.id === 'usr-ops-monitor-001')!; // Cebu only
      
      // Should allow access to Cebu resources
      const cebuAccessResult = await rbacEngine.evaluatePolicy({
        user: cebuUser,
        resource: { 
          regionId: TEST_REGIONS.CEBU, 
          dataClass: 'internal', 
          containsPII: false 
        },
        action: 'view_live_map',
        context: { channel: 'ui', mfaPresent: false }
      });
      
      expect(cebuAccessResult.decision).toBe('allow');
      
      // Should deny access to Manila resources
      const manilaAccessResult = await rbacEngine.evaluatePolicy({
        user: cebuUser,
        resource: { 
          regionId: TEST_REGIONS.NCR_MANILA, 
          dataClass: 'internal', 
          containsPII: false 
        },
        action: 'view_live_map',
        context: { channel: 'ui', mfaPresent: false }
      });
      
      expect(manilaAccessResult.decision).toBe('deny');
      expect(manilaAccessResult.reasons).toContain('Regional access denied');
    });

    it('should validate multi-region access for risk investigator', async () => {
      const riskUser = TEST_USERS.find(u => u.id === 'usr-risk-investigator-001')!; // Cebu + Davao
      
      // Should allow access to both assigned regions
      const cebuAccessResult = await rbacEngine.evaluatePolicy({
        user: riskUser,
        resource: { 
          regionId: TEST_REGIONS.CEBU, 
          dataClass: 'confidential', 
          containsPII: true 
        },
        action: 'case_open',
        context: { channel: 'ui', mfaPresent: true }
      });
      
      const davaoAccessResult = await rbacEngine.evaluatePolicy({
        user: riskUser,
        resource: { 
          regionId: TEST_REGIONS.DAVAO, 
          dataClass: 'confidential', 
          containsPII: true 
        },
        action: 'case_open',
        context: { channel: 'ui', mfaPresent: true }
      });
      
      expect(cebuAccessResult.decision).toBe('allow');
      expect(davaoAccessResult.decision).toBe('allow');
      
      // Should deny access to unassigned region (Manila)
      const manilaAccessResult = await rbacEngine.evaluatePolicy({
        user: riskUser,
        resource: { 
          regionId: TEST_REGIONS.NCR_MANILA, 
          dataClass: 'confidential', 
          containsPII: true 
        },
        action: 'case_open',
        context: { channel: 'ui', mfaPresent: true }
      });
      
      expect(manilaAccessResult.decision).toBe('deny');
      expect(manilaAccessResult.reasons).toContain('Regional access denied');
    });

    it('should validate global access for IAM admin', async () => {
      const iamAdmin = TEST_USERS.find(u => u.id === 'usr-iam-admin-001')!; // Global access
      
      // Should allow access to all regions
      const regions = [TEST_REGIONS.NCR_MANILA, TEST_REGIONS.CEBU, TEST_REGIONS.DAVAO];
      
      for (const regionId of regions) {
        const accessResult = await rbacEngine.evaluatePolicy({
          user: iamAdmin,
          resource: { 
            regionId, 
            dataClass: 'confidential', 
            containsPII: true 
          },
          action: 'manage_users',
          context: { channel: 'ui', mfaPresent: true }
        });
        
        expect(accessResult.decision).toBe('allow');
        expect(accessResult.reasons).toContain('RBAC permission granted');
      }
    });
  });

  describe('Cross-Region Override Paths', () => {
    it('should allow support cross-region access with valid case', async () => {
      const supportUser = TEST_USERS.find(u => u.id === 'usr-support-001')!; // Cebu-based with Manila temp access
      
      // Validate temporary access exists
      expect(supportUser.temporaryAccess).toBeDefined();
      expect(supportUser.temporaryAccess![0].caseId).toBe(TEST_CASES.SUPPORT_MANILA_001);
      expect(supportUser.temporaryAccess![0].grantedRegions).toContain(TEST_REGIONS.NCR_MANILA);
      
      // Should allow cross-region access with valid case
      const crossRegionResult = await rbacEngine.evaluatePolicy({
        user: supportUser,
        resource: { 
          regionId: TEST_REGIONS.NCR_MANILA, 
          dataClass: 'internal', 
          containsPII: false 
        },
        action: 'case_open',
        context: { 
          channel: 'ui', 
          mfaPresent: false,
          caseId: TEST_CASES.SUPPORT_MANILA_001
        }
      });
      
      expect(crossRegionResult.decision).toBe('allow');
      expect(crossRegionResult.reasons).toContain('Cross-region override granted');
      expect(crossRegionResult.obligations?.auditLevel).toBe('enhanced');
      expect(crossRegionResult.metadata.overridePath).toBe('support_escalation');
    });

    it('should deny cross-region access with invalid case', async () => {
      const supportUser = TEST_USERS.find(u => u.id === 'usr-support-001')!;
      
      // Should deny access with invalid case ID
      const invalidCaseResult = await rbacEngine.evaluatePolicy({
        user: supportUser,
        resource: { 
          regionId: TEST_REGIONS.NCR_MANILA, 
          dataClass: 'internal', 
          containsPII: false 
        },
        action: 'case_open',
        context: { 
          channel: 'ui', 
          mfaPresent: false,
          caseId: TEST_CASES.INVALID_CASE
        }
      });
      
      expect(invalidCaseResult.decision).toBe('deny');
      expect(invalidCaseResult.reasons).toContain('Invalid case ID for cross-region override');
    });

    it('should deny cross-region access without case ID', async () => {
      const supportUser = TEST_USERS.find(u => u.id === 'usr-support-001')!;
      
      // Should deny access without case ID
      const noCaseResult = await rbacEngine.evaluatePolicy({
        user: supportUser,
        resource: { 
          regionId: TEST_REGIONS.NCR_MANILA, 
          dataClass: 'internal', 
          containsPII: false 
        },
        action: 'case_open',
        context: { 
          channel: 'ui', 
          mfaPresent: false
          // No caseId provided
        }
      });
      
      expect(noCaseResult.decision).toBe('deny');
      expect(noCaseResult.reasons).toContain('Cross-region access requires valid case ID');
    });

    it('should enforce temporal boundaries for temporary access', async () => {
      const supportUser = TEST_USERS.find(u => u.id === 'usr-support-001')!;
      
      // Create user with expired temporary access
      const expiredTempAccessUser = {
        ...supportUser,
        temporaryAccess: [{
          ...supportUser.temporaryAccess![0],
          expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
          isActive: false
        }]
      };
      
      const expiredAccessResult = await rbacEngine.evaluatePolicy({
        user: expiredTempAccessUser,
        resource: { 
          regionId: TEST_REGIONS.NCR_MANILA, 
          dataClass: 'internal', 
          containsPII: false 
        },
        action: 'case_open',
        context: { 
          channel: 'ui', 
          mfaPresent: false,
          caseId: TEST_CASES.SUPPORT_MANILA_001
        }
      });
      
      expect(expiredAccessResult.decision).toBe('deny');
      expect(expiredAccessResult.reasons).toContain('Temporary access expired');
    });
  });

  describe('Regional Security Attack Prevention', () => {
    it('should prevent region wildcard injection attacks', async () => {
      const groundOpsUser = TEST_USERS.find(u => u.id === 'usr-ground-ops-001')!;
      
      // Test all wildcard injection attempts
      for (const maliciousRegion of SECURITY_TEST_VECTORS.REGION_INJECTION_ATTEMPTS) {
        const injectionResult = await rbacEngine.evaluatePolicy({
          user: groundOpsUser,
          resource: { 
            regionId: maliciousRegion, 
            dataClass: 'internal', 
            containsPII: false 
          },
          action: 'assign_driver',
          context: { channel: 'ui', mfaPresent: false }
        });
        
        expect(injectionResult.decision).toBe('deny');
        expect(injectionResult.reasons).toContain('Invalid region identifier');
      }
    });

    it('should prevent N+1 region access attacks', async () => {
      const multiRegionUser = TEST_USERS.find(u => u.id === 'usr-risk-investigator-001')!; // Cebu + Davao
      
      // Create multiple rapid requests to different regions
      const regions = [
        TEST_REGIONS.CEBU,
        TEST_REGIONS.DAVAO,
        TEST_REGIONS.NCR_MANILA, // Should be denied
        'reg-invalid-001', // Should be denied
        'reg-admin-999' // Should be denied
      ];
      
      const results = await Promise.all(
        regions.map(regionId => 
          rbacEngine.evaluatePolicy({
            user: multiRegionUser,
            resource: { regionId, dataClass: 'internal', containsPII: false },
            action: 'case_open',
            context: { channel: 'ui', mfaPresent: false }
          })
        )
      );
      
      // Only first 2 should be allowed (user's assigned regions)
      expect(results[0].decision).toBe('allow'); // Cebu
      expect(results[1].decision).toBe('allow'); // Davao
      expect(results[2].decision).toBe('deny');  // Manila
      expect(results[3].decision).toBe('deny');  // Invalid region
      expect(results[4].decision).toBe('deny');  // Admin region
      
      // Verify proper error reasons
      expect(results[2].reasons).toContain('Regional access denied');
      expect(results[3].reasons).toContain('Invalid region identifier');
    });

    it('should prevent token replay across regions', async () => {
      const manilaUser = TEST_USERS.find(u => u.id === 'usr-ground-ops-001')!;
      
      // Simulate token replay attack - using Manila token in Cebu
      // This test validates that the policy engine checks region context
      const replayAttackResult = await rbacEngine.evaluatePolicy({
        user: manilaUser, // User authorized for Manila only
        resource: { 
          regionId: TEST_REGIONS.CEBU, // Attempting Cebu access
          dataClass: 'internal', 
          containsPII: false 
        },
        action: 'assign_driver',
        context: { 
          channel: 'ui', 
          mfaPresent: false,
          // Simulating replayed token headers
          originalRegion: TEST_REGIONS.NCR_MANILA
        }
      });
      
      expect(replayAttackResult.decision).toBe('deny');
      expect(replayAttackResult.reasons).toContain('Regional access denied');
      expect(replayAttackResult.metadata.securityFlag).toBe('token_replay_attempt');
    });
  });

  describe('Regional Data Classification', () => {
    it('should enforce region-specific data class restrictions', async () => {
      const cebuOpsMonitor = TEST_USERS.find(u => u.id === 'usr-ops-monitor-001')!; // Cebu, view-only
      
      // Should allow internal data access
      const internalDataResult = await rbacEngine.evaluatePolicy({
        user: cebuOpsMonitor,
        resource: { 
          regionId: TEST_REGIONS.CEBU, 
          dataClass: 'internal', 
          containsPII: false 
        },
        action: 'view_live_map',
        context: { channel: 'ui', mfaPresent: false }
      });
      
      expect(internalDataResult.decision).toBe('allow');
      
      // Should deny confidential data access (insufficient role level)
      const confidentialDataResult = await rbacEngine.evaluatePolicy({
        user: cebuOpsMonitor,
        resource: { 
          regionId: TEST_REGIONS.CEBU, 
          dataClass: 'confidential', 
          containsPII: true 
        },
        action: 'view_live_map',
        context: { channel: 'ui', mfaPresent: false }
      });
      
      expect(confidentialDataResult.decision).toBe('deny');
      expect(confidentialDataResult.reasons).toContain('Insufficient access level for data class');
      
      // Should deny restricted data access
      const restrictedDataResult = await rbacEngine.evaluatePolicy({
        user: cebuOpsMonitor,
        resource: { 
          regionId: TEST_REGIONS.CEBU, 
          dataClass: 'restricted', 
          containsPII: true 
        },
        action: 'view_live_map',
        context: { channel: 'ui', mfaPresent: true }
      });
      
      expect(restrictedDataResult.decision).toBe('deny');
      expect(restrictedDataResult.reasons).toContain('Restricted data requires specialized access');
    });

    it('should validate cross-region data sharing restrictions', async () => {
      const manilaRegionalManager = TEST_USERS.find(u => u.id === 'usr-regional-manager-001')!;
      
      // Regional manager can access confidential data in their region
      const ownRegionResult = await rbacEngine.evaluatePolicy({
        user: manilaRegionalManager,
        resource: { 
          regionId: TEST_REGIONS.NCR_MANILA, 
          dataClass: 'confidential', 
          containsPII: true 
        },
        action: 'view_driver_files_masked',
        context: { channel: 'ui', mfaPresent: true }
      });
      
      expect(ownRegionResult.decision).toBe('allow');
      
      // But cannot access confidential data from other regions without override
      const otherRegionResult = await rbacEngine.evaluatePolicy({
        user: manilaRegionalManager,
        resource: { 
          regionId: TEST_REGIONS.CEBU, 
          dataClass: 'confidential', 
          containsPII: true 
        },
        action: 'view_driver_files_masked',
        context: { channel: 'ui', mfaPresent: true }
      });
      
      expect(otherRegionResult.decision).toBe('deny');
      expect(otherRegionResult.reasons).toContain('Cross-region confidential data access denied');
    });
  });

  describe('Regional Emergency Access', () => {
    it('should validate break-glass regional override', async () => {
      const regionalManager = TEST_USERS.find(u => u.id === 'usr-regional-manager-001')!;
      
      // Simulate emergency scenario requiring cross-region access
      const emergencyAccessResult = await rbacEngine.evaluatePolicy({
        user: regionalManager,
        resource: { 
          regionId: TEST_REGIONS.CEBU, 
          dataClass: 'internal', 
          containsPII: false 
        },
        action: 'emergency_access',
        context: { 
          channel: 'ui', 
          mfaPresent: true,
          emergencyJustification: 'System outage requiring immediate intervention',
          approverSignature: 'usr-app-admin-001'
        }
      });
      
      // Emergency access should be allowed with enhanced auditing
      expect(emergencyAccessResult.decision).toBe('allow');
      expect(emergencyAccessResult.reasons).toContain('Emergency access granted');
      expect(emergencyAccessResult.obligations?.auditLevel).toBe('emergency');
      expect(emergencyAccessResult.obligations?.requireReview).toBe(true);
      expect(emergencyAccessResult.obligations?.notifyCompliance).toBe(true);
    });

    it('should deny emergency access without proper justification', async () => {
      const regionalManager = TEST_USERS.find(u => u.id === 'usr-regional-manager-001')!;
      
      const invalidEmergencyResult = await rbacEngine.evaluatePolicy({
        user: regionalManager,
        resource: { 
          regionId: TEST_REGIONS.CEBU, 
          dataClass: 'internal', 
          containsPII: false 
        },
        action: 'emergency_access',
        context: { 
          channel: 'ui', 
          mfaPresent: true
          // Missing emergency justification and approver signature
        }
      });
      
      expect(invalidEmergencyResult.decision).toBe('deny');
      expect(invalidEmergencyResult.reasons).toContain('Emergency access requires proper justification and approval');
    });
  });
});