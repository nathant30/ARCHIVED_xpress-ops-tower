// MFA Enforcement Testing
// Validates Multi-Factor Authentication requirements for sensitive operations
// Tests TOTP, backup codes, and temporal MFA session management

import { rbacEngine } from '@/lib/auth/rbac-engine';
import { TEST_USERS, TEST_REGIONS, TEST_CASES } from '../setup/test-users-data';
import { getTestEnvironmentConfig, TEST_JWT_CLAIMS } from '../setup/environment-config';

describe('MFA Enforcement Validation', () => {
  const testConfig = getTestEnvironmentConfig();

  beforeAll(() => {
    // SECURITY NOTE: This is a test environment JWT secret from test config
    // Not a real production secret - safe for testing purposes
    process.env.JWT_SECRET = testConfig.jwt.secret;
    process.env.NODE_ENV = 'test';
  });

  describe('MFA-Required Operation Enforcement', () => {
    it('should enforce MFA for PII unmasking operations', async () => {
      const riskInvestigator = TEST_USERS.find(u => u.id === 'usr-risk-investigator-001')!;
      
      expect(riskInvestigator.mfaEnabled).toBe(true);
      
      // Should allow PII unmasking with MFA
      const withMfaResult = await rbacEngine.evaluatePolicy({
        user: riskInvestigator,
        resource: { 
          regionId: TEST_REGIONS.CEBU, 
          dataClass: 'restricted', 
          containsPII: true 
        },
        action: 'unmask_pii_with_mfa',
        context: { 
          channel: 'ui', 
          mfaPresent: true,
          mfaMethod: 'totp',
          mfaTimestamp: Math.floor(Date.now() / 1000)
        }
      });
      
      expect(withMfaResult.decision).toBe('allow');
      expect(withMfaResult.obligations?.auditLevel).toBe('enhanced');
      expect(withMfaResult.obligations?.requireMFA).toBeUndefined(); // Already satisfied
      
      // Should deny PII unmasking without MFA
      const withoutMfaResult = await rbacEngine.evaluatePolicy({
        user: riskInvestigator,
        resource: { 
          regionId: TEST_REGIONS.CEBU, 
          dataClass: 'restricted', 
          containsPII: true 
        },
        action: 'unmask_pii_with_mfa',
        context: { 
          channel: 'ui', 
          mfaPresent: false
        }
      });
      
      expect(withoutMfaResult.decision).toBe('deny');
      expect(withoutMfaResult.reasons).toContain('MFA required for PII unmasking');
      expect(withoutMfaResult.obligations?.requireMFA).toBe(true);
      expect(withoutMfaResult.obligations?.mfaChallenge).toBe('totp_or_backup');
    });

    it('should enforce MFA for user management operations', async () => {
      const iamAdmin = TEST_USERS.find(u => u.id === 'usr-iam-admin-001')!;
      
      expect(iamAdmin.mfaEnabled).toBe(true);
      
      // High-privilege operations requiring MFA
      const sensitiveOperations = [
        'manage_users',
        'assign_roles',
        'set_allowed_regions',
        'set_pii_scope'
      ];
      
      for (const operation of sensitiveOperations) {
        // Should allow with MFA
        const withMfaResult = await rbacEngine.evaluatePolicy({
          user: iamAdmin,
          resource: { 
            regionId: TEST_REGIONS.NCR_MANILA, 
            dataClass: 'confidential', 
            containsPII: true 
          },
          action: operation,
          context: { 
            channel: 'ui', 
            mfaPresent: true,
            mfaMethod: 'totp'
          }
        });
        
        expect(withMfaResult.decision).toBe('allow');
        
        // Should deny without MFA
        const withoutMfaResult = await rbacEngine.evaluatePolicy({
          user: iamAdmin,
          resource: { 
            regionId: TEST_REGIONS.NCR_MANILA, 
            dataClass: 'confidential', 
            containsPII: true 
          },
          action: operation,
          context: { 
            channel: 'ui', 
            mfaPresent: false
          }
        });
        
        expect(withoutMfaResult.decision).toBe('deny');
        expect(withoutMfaResult.obligations?.requireMFA).toBe(true);
      }
    });

    it('should enforce MFA for temporary access approval', async () => {
      const regionalManager = TEST_USERS.find(u => u.id === 'usr-regional-manager-001')!;
      
      expect(regionalManager.mfaEnabled).toBe(true);
      
      // Should allow temporary access approval with MFA
      const approveWithMfaResult = await rbacEngine.evaluatePolicy({
        user: regionalManager,
        resource: { 
          regionId: TEST_REGIONS.NCR_MANILA, 
          dataClass: 'confidential', 
          containsPII: false 
        },
        action: 'approve_temp_access_region',
        context: { 
          channel: 'ui', 
          mfaPresent: true,
          requestingUser: 'usr-support-001',
          caseId: TEST_CASES.SUPPORT_MANILA_001,
          justification: 'Customer complaint investigation'
        }
      });
      
      expect(approveWithMfaResult.decision).toBe('allow');
      expect(approveWithMfaResult.obligations?.auditLevel).toBe('enhanced');
      
      // Should deny temporary access approval without MFA
      const approveWithoutMfaResult = await rbacEngine.evaluatePolicy({
        user: regionalManager,
        resource: { 
          regionId: TEST_REGIONS.NCR_MANILA, 
          dataClass: 'confidential', 
          containsPII: false 
        },
        action: 'approve_temp_access_region',
        context: { 
          channel: 'ui', 
          mfaPresent: false,
          requestingUser: 'usr-support-001',
          caseId: TEST_CASES.SUPPORT_MANILA_001
        }
      });
      
      expect(approveWithoutMfaResult.decision).toBe('deny');
      expect(approveWithoutMfaResult.obligations?.requireMFA).toBe(true);
    });

    it('should allow non-sensitive operations without MFA', async () => {
      const groundOpsUser = TEST_USERS.find(u => u.id === 'usr-ground-ops-001')!;
      
      expect(groundOpsUser.mfaEnabled).toBe(false);
      
      // Non-sensitive operations should not require MFA
      const regularOperations = [
        'assign_driver',
        'view_live_map',
        'manage_queue',
        'cancel_trip_ops'
      ];
      
      for (const operation of regularOperations) {
        const noMfaRequiredResult = await rbacEngine.evaluatePolicy({
          user: groundOpsUser,
          resource: { 
            regionId: TEST_REGIONS.NCR_MANILA, 
            dataClass: 'internal', 
            containsPII: false 
          },
          action: operation,
          context: { 
            channel: 'ui', 
            mfaPresent: false
          }
        });
        
        expect(noMfaRequiredResult.decision).toBe('allow');
        expect(noMfaRequiredResult.obligations?.requireMFA).toBeUndefined();
      }
    });
  });

  describe('MFA Session Management', () => {
    it('should validate MFA session timeout', async () => {
      const riskInvestigator = TEST_USERS.find(u => u.id === 'usr-risk-investigator-001')!;
      
      // Fresh MFA verification (within timeout window)
      const freshMfaResult = await rbacEngine.evaluatePolicy({
        user: riskInvestigator,
        resource: { 
          regionId: TEST_REGIONS.CEBU, 
          dataClass: 'restricted', 
          containsPII: true 
        },
        action: 'unmask_pii_with_mfa',
        context: { 
          channel: 'ui', 
          mfaPresent: true,
          mfaTimestamp: Math.floor(Date.now() / 1000) - 300, // 5 minutes ago
          mfaTimeoutMinutes: 30
        }
      });
      
      expect(freshMfaResult.decision).toBe('allow');
      
      // Expired MFA verification (beyond timeout window)
      const expiredMfaResult = await rbacEngine.evaluatePolicy({
        user: riskInvestigator,
        resource: { 
          regionId: TEST_REGIONS.CEBU, 
          dataClass: 'restricted', 
          containsPII: true 
        },
        action: 'unmask_pii_with_mfa',
        context: { 
          channel: 'ui', 
          mfaPresent: true,
          mfaTimestamp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
          mfaTimeoutMinutes: 30
        }
      });
      
      expect(expiredMfaResult.decision).toBe('deny');
      expect(expiredMfaResult.reasons).toContain('MFA verification expired');
      expect(expiredMfaResult.obligations?.requireMFA).toBe(true);
      expect(expiredMfaResult.obligations?.mfaReason).toBe('session_timeout');
    });

    it('should validate MFA step-up authentication for elevated operations', async () => {
      const regionalManager = TEST_USERS.find(u => u.id === 'usr-regional-manager-001')!;
      
      // Regular operation with existing MFA session
      const regularOpResult = await rbacEngine.evaluatePolicy({
        user: regionalManager,
        resource: { 
          regionId: TEST_REGIONS.NCR_MANILA, 
          dataClass: 'internal', 
          containsPII: false 
        },
        action: 'manage_shift',
        context: { 
          channel: 'ui', 
          mfaPresent: true,
          mfaTimestamp: Math.floor(Date.now() / 1000) - 600, // 10 minutes ago
          mfaTimeoutMinutes: 30
        }
      });
      
      expect(regularOpResult.decision).toBe('allow');
      
      // Elevated operation requiring fresh MFA (step-up)
      const elevatedOpResult = await rbacEngine.evaluatePolicy({
        user: regionalManager,
        resource: { 
          regionId: TEST_REGIONS.NCR_MANILA, 
          dataClass: 'confidential', 
          containsPII: true 
        },
        action: 'approve_temp_access_region',
        context: { 
          channel: 'ui', 
          mfaPresent: true,
          mfaTimestamp: Math.floor(Date.now() / 1000) - 600, // 10 minutes ago - too old for elevated op
          mfaTimeoutMinutes: 30,
          elevatedOperation: true,
          stepUpTimeoutMinutes: 5
        }
      });
      
      expect(elevatedOpResult.decision).toBe('deny');
      expect(elevatedOpResult.reasons).toContain('Fresh MFA required for elevated operation');
      expect(elevatedOpResult.obligations?.requireMFA).toBe(true);
      expect(elevatedOpResult.obligations?.mfaReason).toBe('step_up_required');
    });

    it('should handle concurrent MFA sessions across devices', async () => {
      const iamAdmin = TEST_USERS.find(u => u.id === 'usr-iam-admin-001')!;
      
      // Multiple device sessions with different MFA states
      const deviceSessions = [
        {
          deviceId: 'device-desktop-001',
          mfaTimestamp: Math.floor(Date.now() / 1000) - 300, // 5 minutes ago
          userAgent: 'Desktop Browser'
        },
        {
          deviceId: 'device-mobile-002', 
          mfaTimestamp: Math.floor(Date.now() / 1000) - 1200, // 20 minutes ago
          userAgent: 'Mobile App'
        },
        {
          deviceId: 'device-tablet-003',
          mfaTimestamp: Math.floor(Date.now() / 1000) - 2400, // 40 minutes ago (expired)
          userAgent: 'Tablet Browser'
        }
      ];
      
      for (let i = 0; i < deviceSessions.length; i++) {
        const session = deviceSessions[i];
        const isExpired = (Math.floor(Date.now() / 1000) - session.mfaTimestamp) > 1800; // 30 min timeout
        
        const deviceMfaResult = await rbacEngine.evaluatePolicy({
          user: iamAdmin,
          resource: { 
            regionId: TEST_REGIONS.NCR_MANILA, 
            dataClass: 'confidential', 
            containsPII: true 
          },
          action: 'manage_users',
          context: { 
            channel: 'ui', 
            mfaPresent: !isExpired,
            mfaTimestamp: session.mfaTimestamp,
            deviceId: session.deviceId,
            userAgent: session.userAgent,
            mfaTimeoutMinutes: 30
          }
        });
        
        if (isExpired) {
          expect(deviceMfaResult.decision).toBe('deny');
          expect(deviceMfaResult.reasons).toContain('MFA verification expired');
        } else {
          expect(deviceMfaResult.decision).toBe('allow');
        }
      }
    });
  });

  describe('MFA Method Validation', () => {
    it('should validate TOTP-based MFA', async () => {
      const riskInvestigator = TEST_USERS.find(u => u.id === 'usr-risk-investigator-001')!;
      
      const totpMfaResult = await rbacEngine.evaluatePolicy({
        user: riskInvestigator,
        resource: { 
          regionId: TEST_REGIONS.CEBU, 
          dataClass: 'restricted', 
          containsPII: true 
        },
        action: 'unmask_pii_with_mfa',
        context: { 
          channel: 'ui', 
          mfaPresent: true,
          mfaMethod: 'totp',
          mfaCode: '123456',
          mfaTimestamp: Math.floor(Date.now() / 1000)
        }
      });
      
      expect(totpMfaResult.decision).toBe('allow');
      expect(totpMfaResult.metadata.mfaMethod).toBe('totp');
      expect(totpMfaResult.obligations?.auditMFA).toBe(true);
    });

    it('should validate backup code MFA', async () => {
      const iamAdmin = TEST_USERS.find(u => u.id === 'usr-iam-admin-001')!;
      
      const backupCodeMfaResult = await rbacEngine.evaluatePolicy({
        user: iamAdmin,
        resource: { 
          regionId: TEST_REGIONS.NCR_MANILA, 
          dataClass: 'confidential', 
          containsPII: true 
        },
        action: 'manage_users',
        context: { 
          channel: 'ui', 
          mfaPresent: true,
          mfaMethod: 'backup_code',
          mfaCode: '123456',
          mfaTimestamp: Math.floor(Date.now() / 1000)
        }
      });
      
      expect(backupCodeMfaResult.decision).toBe('allow');
      expect(backupCodeMfaResult.metadata.mfaMethod).toBe('backup_code');
      expect(backupCodeMfaResult.obligations?.auditMFA).toBe(true);
      expect(backupCodeMfaResult.obligations?.flagBackupCodeUsage).toBe(true);
    });

    it('should enforce hardware key MFA for highest privilege operations', async () => {
      const appAdmin = TEST_USERS.find(u => u.id === 'usr-app-admin-001')!;
      
      // System configuration changes should accept hardware key MFA
      const hardwareKeyMfaResult = await rbacEngine.evaluatePolicy({
        user: appAdmin,
        resource: { 
          regionId: TEST_REGIONS.NCR_MANILA, 
          dataClass: 'internal', 
          containsPII: false 
        },
        action: 'manage_feature_flags',
        context: { 
          channel: 'ui', 
          mfaPresent: true,
          mfaMethod: 'hardware_key',
          mfaDevice: 'yubikey_5_nfc',
          mfaTimestamp: Math.floor(Date.now() / 1000)
        }
      });
      
      expect(hardwareKeyMfaResult.decision).toBe('allow');
      expect(hardwareKeyMfaResult.metadata.mfaMethod).toBe('hardware_key');
      expect(hardwareKeyMfaResult.obligations?.auditMFA).toBe(true);
    });

    it('should reject invalid or weak MFA methods', async () => {
      const riskInvestigator = TEST_USERS.find(u => u.id === 'usr-risk-investigator-001')!;
      
      // Test invalid MFA methods
      const invalidMfaMethods = [
        'sms', // Considered weak
        'email', // Considered weak
        'security_questions', // Not supported
        'push_notification', // Not configured
        'invalid_method'
      ];
      
      for (const invalidMethod of invalidMfaMethods) {
        const invalidMfaResult = await rbacEngine.evaluatePolicy({
          user: riskInvestigator,
          resource: { 
            regionId: TEST_REGIONS.CEBU, 
            dataClass: 'restricted', 
            containsPII: true 
          },
          action: 'unmask_pii_with_mfa',
          context: { 
            channel: 'ui', 
            mfaPresent: true,
            mfaMethod: invalidMethod,
            mfaTimestamp: Math.floor(Date.now() / 1000)
          }
        });
        
        expect(invalidMfaResult.decision).toBe('deny');
        expect(invalidMfaResult.reasons).toContain('Invalid or unsupported MFA method');
        expect(invalidMfaResult.obligations?.requireMFA).toBe(true);
        expect(invalidMfaResult.obligations?.mfaChallenge).toBe('totp_or_backup');
      }
    });
  });

  describe('MFA Bypass Prevention', () => {
    it('should prevent MFA bypass through token manipulation', async () => {
      const riskInvestigator = TEST_USERS.find(u => u.id === 'usr-risk-investigator-001')!;
      
      // Simulate token manipulation attempt
      const manipulatedUser = {
        ...riskInvestigator,
        mfaEnabled: false // Manipulated to false
      };
      
      // System should still enforce MFA based on operation requirements, not user flags
      const bypassAttemptResult = await rbacEngine.evaluatePolicy({
        user: manipulatedUser,
        resource: { 
          regionId: TEST_REGIONS.CEBU, 
          dataClass: 'restricted', 
          containsPII: true 
        },
        action: 'unmask_pii_with_mfa',
        context: { 
          channel: 'ui', 
          mfaPresent: false
        }
      });
      
      expect(bypassAttemptResult.decision).toBe('deny');
      expect(bypassAttemptResult.reasons).toContain('MFA required for PII unmasking');
      expect(bypassAttemptResult.obligations?.requireMFA).toBe(true);
    });

    it('should prevent MFA bypass through API channel', async () => {
      const iamAdmin = TEST_USERS.find(u => u.id === 'usr-iam-admin-001')!;
      
      // API calls should still enforce MFA for sensitive operations
      const apiBypassAttemptResult = await rbacEngine.evaluatePolicy({
        user: iamAdmin,
        resource: { 
          regionId: TEST_REGIONS.NCR_MANILA, 
          dataClass: 'confidential', 
          containsPII: true 
        },
        action: 'manage_users',
        context: { 
          channel: 'api', // API channel
          mfaPresent: false,
          apiKey: 'api-key-bypass-attempt',
          automation: true
        }
      });
      
      expect(apiBypassAttemptResult.decision).toBe('deny');
      expect(apiBypassAttemptResult.reasons).toContain('MFA required for sensitive operations');
      expect(apiBypassAttemptResult.obligations?.requireMFA).toBe(true);
      expect(apiBypassAttemptResult.metadata.securityFlag).toBe('api_mfa_bypass_attempt');
    });

    it('should prevent MFA bypass through batch operations', async () => {
      const regionalManager = TEST_USERS.find(u => u.id === 'usr-regional-manager-001')!;
      
      // Batch operations containing sensitive data should still require MFA
      const batchBypassAttemptResult = await rbacEngine.evaluatePolicy({
        user: regionalManager,
        resource: { 
          regionId: TEST_REGIONS.NCR_MANILA, 
          dataClass: 'confidential', 
          containsPII: true 
        },
        action: 'batch_user_update',
        context: { 
          channel: 'batch',
          mfaPresent: false,
          recordCount: 500,
          automation: true
        }
      });
      
      expect(batchBypassAttemptResult.decision).toBe('deny');
      expect(batchBypassAttemptResult.reasons).toContain('MFA required for batch PII operations');
      expect(batchBypassAttemptResult.obligations?.requireMFA).toBe(true);
    });
  });

  describe('MFA Audit Trail', () => {
    it('should generate comprehensive MFA audit logs', async () => {
      const riskInvestigator = TEST_USERS.find(u => u.id === 'usr-risk-investigator-001')!;
      
      const mfaAuditResult = await rbacEngine.evaluatePolicy({
        user: riskInvestigator,
        resource: { 
          regionId: TEST_REGIONS.CEBU, 
          dataClass: 'restricted', 
          containsPII: true 
        },
        action: 'unmask_pii_with_mfa',
        context: { 
          channel: 'ui', 
          mfaPresent: true,
          mfaMethod: 'totp',
          mfaCode: '123456',
          mfaTimestamp: Math.floor(Date.now() / 1000),
          deviceId: 'device-desktop-001',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Desktop)'
        }
      });
      
      expect(mfaAuditResult.decision).toBe('allow');
      expect(mfaAuditResult.obligations?.auditMFA).toBe(true);
      expect(mfaAuditResult.metadata.auditFields).toEqual(
        expect.objectContaining({
          mfaMethod: 'totp',
          mfaTimestamp: expect.any(Number),
          deviceId: 'device-desktop-001',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Desktop)'
        })
      );
    });

    it('should flag suspicious MFA patterns', async () => {
      const iamAdmin = TEST_USERS.find(u => u.id === 'usr-iam-admin-001')!;
      
      // Simulate rapid MFA attempts from different locations
      const suspiciousMfaResult = await rbacEngine.evaluatePolicy({
        user: iamAdmin,
        resource: { 
          regionId: TEST_REGIONS.NCR_MANILA, 
          dataClass: 'confidential', 
          containsPII: true 
        },
        action: 'manage_users',
        context: { 
          channel: 'ui', 
          mfaPresent: true,
          mfaMethod: 'totp',
          mfaTimestamp: Math.floor(Date.now() / 1000),
          ipAddress: '203.177.1.1', // Philippines IP
          previousIpAddress: '8.8.8.8', // US IP 5 minutes ago
          ipGeoDistance: 17000, // 17,000 km apart
          rapidLocationChange: true
        }
      });
      
      expect(suspiciousMfaResult.decision).toBe('allow'); // Allow but flag
      expect(suspiciousMfaResult.obligations?.securityFlags).toContain('suspicious_location_change');
      expect(suspiciousMfaResult.obligations?.requireSecurityReview).toBe(true);
      expect(suspiciousMfaResult.obligations?.notifySecurityTeam).toBe(true);
    });

    it('should track MFA failure patterns', async () => {
      const regionalManager = TEST_USERS.find(u => u.id === 'usr-regional-manager-001')!;
      
      // Simulate multiple failed MFA attempts
      const failedMfaResult = await rbacEngine.evaluatePolicy({
        user: regionalManager,
        resource: { 
          regionId: TEST_REGIONS.NCR_MANILA, 
          dataClass: 'confidential', 
          containsPII: false 
        },
        action: 'approve_temp_access_region',
        context: { 
          channel: 'ui', 
          mfaPresent: false, // Failed MFA
          mfaAttempts: 3,
          mfaFailureCount: 2,
          lastMfaFailure: Math.floor(Date.now() / 1000) - 60 // 1 minute ago
        }
      });
      
      expect(failedMfaResult.decision).toBe('deny');
      expect(failedMfaResult.reasons).toContain('MFA required for temporary access approval');
      expect(failedMfaResult.obligations?.requireMFA).toBe(true);
      expect(failedMfaResult.obligations?.securityFlags).toContain('repeated_mfa_failures');
      expect(failedMfaResult.metadata.riskScore).toBeGreaterThan(5);
    });
  });
});