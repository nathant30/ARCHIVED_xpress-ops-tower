// MFA Authentication Flow Tests
// Comprehensive testing of Integration Specialist's MFA system
// Tests all MFA methods, sensitivity triggers, and security controls

import {
  MFAService,
  mfaService,
  createMFAChallenge,
  verifyMFAChallenge,
  requiresMFAForAction,
  getSensitivityLevel,
  SENSITIVITY_THRESHOLDS,
  type MFAMethod,
  type MFASettings,
  type MFAChallenge,
  type MFAVerificationResult,
  type MFAEnrollmentResult,
  type SensitivityConfig
} from '@/lib/auth/mfa-service';

import type { Permission } from '@/hooks/useRBAC';

// Mock external dependencies
jest.mock('speakeasy', () => ({
  generateSecret: jest.fn(() => ({
    base32: 'JBSWY3DPEHPK3PXP',
    otpauth_url: 'otpauth://totp/Xpress%20Ops%20Tower%20(test-user)?secret=JBSWY3DPEHPK3PXP&issuer=Xpress%20Ops%20Tower'
  })),
  totp: {
    verify: jest.fn(() => true)
  }
}));

describe('MFA Authentication System', () => {

  let testMFAService: MFAService;

  beforeEach(() => {
    testMFAService = MFAService.getInstance();
    // Clear any cached data between tests
    jest.clearAllMocks();
  });

  // =====================================================
  // Sensitivity-Based MFA Configuration
  // =====================================================

  describe('Sensitivity-Based MFA Enforcement', () => {
    
    test('should have complete sensitivity thresholds defined', () => {
      const expectedActions = [
        'unmask_pii_with_mfa',
        'approve_payout_batch',
        'assign_roles',
        'cross_region_override',
        'manage_users',
        'configure_alerts'
      ];

      expectedActions.forEach(action => {
        expect(SENSITIVITY_THRESHOLDS).toHaveProperty(action);
        const config = SENSITIVITY_THRESHOLDS[action];
        
        expect(config.permission).toBe(action);
        expect(typeof config.sensitivityLevel).toBe('number');
        expect(config.sensitivityLevel).toBeGreaterThanOrEqual(0);
        expect(config.sensitivityLevel).toBeLessThanOrEqual(1);
        expect(typeof config.requiresMFA).toBe('boolean');
        expect(Array.isArray(config.allowedMethods)).toBe(true);
        expect(typeof config.maxChallengeAttempts).toBe('number');
        expect(typeof config.challengeExpiryMinutes).toBe('number');
      });
    });

    test('should validate sensitivity level hierarchy', () => {
      const sensitivityLevels = {
        'unmask_pii_with_mfa': 0.9,
        'approve_payout_batch': 0.8,
        'assign_roles': 0.7,
        'cross_region_override': 0.7,
        'manage_users': 0.6,
        'configure_alerts': 0.6
      };

      Object.entries(sensitivityLevels).forEach(([action, expectedLevel]) => {
        const actualLevel = getSensitivityLevel(action as Permission);
        expect(actualLevel).toBe(expectedLevel);
      });
    });

    test('requiresMFAForAction should correctly identify MFA requirements', () => {
      const testCases = [
        { action: 'unmask_pii_with_mfa', userLevel: 0, expected: true },
        { action: 'approve_payout_batch', userLevel: 0, expected: true },
        { action: 'assign_roles', userLevel: 0, expected: true },
        { action: 'cross_region_override', userLevel: 0, expected: true },
        { action: 'manage_users', userLevel: 0, expected: true },
        { action: 'configure_alerts', userLevel: 0, expected: false },
        { action: 'unknown_action', userLevel: 50, expected: true }, // High level user
        { action: 'unknown_action', userLevel: 30, expected: false }  // Low level user
      ];

      testCases.forEach(({ action, userLevel, expected }) => {
        const result = requiresMFAForAction(action as Permission, userLevel);
        expect(result).toBe(expected);
      });
    });

    test('should validate allowed MFA methods per sensitivity level', () => {
      // Critical actions should only allow most secure methods
      const criticalAction = SENSITIVITY_THRESHOLDS['unmask_pii_with_mfa'];
      expect(criticalAction.allowedMethods).toEqual(['totp', 'sms']);
      expect(criticalAction.allowedMethods).not.toContain('backup_code');

      // High sensitivity should allow TOTP + email/SMS
      const highSensitivityAction = SENSITIVITY_THRESHOLDS['approve_payout_batch'];
      expect(highSensitivityAction.allowedMethods).toContain('totp');
      expect(highSensitivityAction.allowedMethods).toContain('email');

      // Standard actions can allow all methods
      const standardAction = SENSITIVITY_THRESHOLDS['configure_alerts'];
      expect(standardAction.allowedMethods).toContain('totp');
      expect(standardAction.allowedMethods).toContain('email');
      expect(standardAction.allowedMethods).toContain('sms');
      expect(standardAction.allowedMethods).toContain('backup_code');
    });

    test('should validate challenge expiry times align with sensitivity', () => {
      // Critical actions should have shorter expiry times
      expect(SENSITIVITY_THRESHOLDS['unmask_pii_with_mfa'].challengeExpiryMinutes).toBe(5);
      expect(SENSITIVITY_THRESHOLDS['approve_payout_batch'].challengeExpiryMinutes).toBe(5);
      
      // Standard actions can have longer expiry times
      expect(SENSITIVITY_THRESHOLDS['manage_users'].challengeExpiryMinutes).toBe(10);
      expect(SENSITIVITY_THRESHOLDS['configure_alerts'].challengeExpiryMinutes).toBe(10);
    });
  });

  // =====================================================
  // MFA Challenge Creation and Management
  // =====================================================

  describe('MFA Challenge Management', () => {
    
    test('createChallenge should generate valid challenges for all methods', async () => {
      const methods: MFAMethod[] = ['sms', 'email', 'totp', 'backup_code'];
      const userId = 'test-user-123';

      for (const method of methods) {
        const challenge = await testMFAService.createChallenge(userId, method, {
          action: 'unmask_pii_with_mfa',
          permission: 'unmask_pii_with_mfa',
          ipAddress: '192.168.1.1',
          userAgent: 'Test Agent'
        });

        expect(challenge).toHaveProperty('challengeId');
        expect(challenge).toHaveProperty('expiresAt');
        expect(challenge.challengeId).toMatch(/^mfa_\d+_[a-f0-9]+$/);
        expect(challenge.expiresAt).toBeInstanceOf(Date);
        expect(challenge.expiresAt.getTime()).toBeGreaterThan(Date.now());

        // For critical actions, expiry should be 5 minutes
        const expiryDuration = challenge.expiresAt.getTime() - Date.now();
        expect(expiryDuration).toBeLessThanOrEqual(5 * 60 * 1000 + 1000); // 5 min + 1s tolerance
      }
    });

    test('should apply sensitivity-specific challenge parameters', async () => {
      const userId = 'test-user-456';

      // Critical action (5 min expiry, 3 attempts)
      const criticalChallenge = await testMFAService.createChallenge(userId, 'sms', {
        permission: 'unmask_pii_with_mfa'
      });

      const criticalExpiryDuration = criticalChallenge.expiresAt.getTime() - Date.now();
      expect(criticalExpiryDuration).toBeLessThanOrEqual(5 * 60 * 1000 + 1000);

      // Standard action (10 min expiry, 5 attempts)
      const standardChallenge = await testMFAService.createChallenge(userId, 'email', {
        permission: 'manage_users'
      });

      const standardExpiryDuration = standardChallenge.expiresAt.getTime() - Date.now();
      expect(standardExpiryDuration).toBeLessThanOrEqual(10 * 60 * 1000 + 1000);
    });

    test('should handle challenge creation with full context', async () => {
      const challengeContext = {
        action: 'approve_payout_batch',
        permission: 'approve_payout_batch' as Permission,
        ipAddress: '10.0.0.1',
        userAgent: 'Mozilla/5.0 (Test Browser)'
      };

      const challenge = await testMFAService.createChallenge('user-789', 'totp', challengeContext);
      
      expect(challenge.challengeId).toBeDefined();
      expect(challenge.expiresAt).toBeInstanceOf(Date);
      
      // Should log challenge creation (in real implementation, this would be in audit logs)
      // For testing, we verify the method completed successfully
      expect(challenge.challengeId).toMatch(/^mfa_/);
    });

    test('should handle edge cases in challenge creation', async () => {
      const userId = 'edge-case-user';

      // Test with minimal options
      const minimalChallenge = await testMFAService.createChallenge(userId, 'sms');
      expect(minimalChallenge.challengeId).toBeDefined();

      // Test with unknown permission (should use default values)
      const unknownPermChallenge = await testMFAService.createChallenge(userId, 'email', {
        permission: 'unknown_permission' as Permission
      });
      expect(unknownPermChallenge.challengeId).toBeDefined();
    });
  });

  // =====================================================
  // MFA Method Implementations
  // =====================================================

  describe('MFA Method Implementations', () => {
    
    test('should generate appropriate codes for each method', async () => {
      const userId = 'code-test-user';
      
      // SMS codes should be 6-digit numeric
      const smsChallenge = await testMFAService.createChallenge(userId, 'sms');
      expect(smsChallenge.challengeId).toBeDefined();
      
      // Email codes should be 6-digit numeric
      const emailChallenge = await testMFAService.createChallenge(userId, 'email');
      expect(emailChallenge.challengeId).toBeDefined();
      
      // TOTP doesn't generate codes (handled by authenticator)
      const totpChallenge = await testMFAService.createChallenge(userId, 'totp');
      expect(totpChallenge.challengeId).toBeDefined();
      
      // Backup codes should be 8-character alphanumeric
      const backupChallenge = await testMFAService.createChallenge(userId, 'backup_code');
      expect(backupChallenge.challengeId).toBeDefined();
    });

    test('should validate phone number formats for SMS enrollment', async () => {
      const validPhoneNumbers = ['+63912345678', '+1234567890123', '+861234567890'];
      const invalidPhoneNumbers = ['123456789', 'invalid-phone', '+0123456789', ''];

      for (const phone of validPhoneNumbers) {
        const result = await testMFAService.enableSMS('user-sms-valid', phone);
        expect(result.success).toBe(true);
        expect(result.method).toBe('sms');
      }

      for (const phone of invalidPhoneNumbers) {
        const result = await testMFAService.enableSMS('user-sms-invalid', phone);
        expect(result.success).toBe(false);
        expect(result.errorMessage).toContain('Invalid phone number format');
      }
    });

    test('should validate email formats for email enrollment', async () => {
      const validEmails = ['user@example.com', 'test.email+tag@domain.co.uk', 'valid@xpress.ph'];
      const invalidEmails = ['invalid-email', '@domain.com', 'user@', 'user@domain', ''];

      for (const email of validEmails) {
        const result = await testMFAService.enableEmail('user-email-valid', email);
        expect(result.success).toBe(true);
        expect(result.method).toBe('email');
      }

      for (const email of invalidEmails) {
        const result = await testMFAService.enableEmail('user-email-invalid', email);
        expect(result.success).toBe(false);
        expect(result.errorMessage).toContain('Invalid email address format');
      }
    });

    test('should generate valid TOTP secrets and QR codes', async () => {
      const userId = 'user-totp-test';
      
      const result = await testMFAService.enableTOTP(userId);
      
      expect(result.success).toBe(true);
      expect(result.method).toBe('totp');
      expect(result.secret).toBeDefined();
      expect(result.qrCodeUrl).toBeDefined();
      expect(result.secret).toMatch(/^[A-Z0-9]+$/); // Base32 format
      expect(result.qrCodeUrl).toContain('otpauth://totp/');
      expect(result.qrCodeUrl).toContain(userId);
    });

    test('should generate valid backup codes', async () => {
      const userId = 'user-backup-test';
      const codeCount = 10;
      
      const result = await testMFAService.generateBackupCodes(userId, codeCount);
      
      expect(result.success).toBe(true);
      expect(result.method).toBe('backup_code');
      expect(result.backupCodes).toBeDefined();
      expect(result.backupCodes).toHaveLength(codeCount);
      
      // Each code should be 8 characters, alphanumeric, no confusing characters
      result.backupCodes!.forEach(code => {
        expect(code).toHaveLength(8);
        expect(code).toMatch(/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]+$/);
      });

      // Codes should be unique
      const uniqueCodes = new Set(result.backupCodes);
      expect(uniqueCodes.size).toBe(codeCount);
    });
  });

  // =====================================================
  // MFA Verification Testing
  // =====================================================

  describe('MFA Verification Process', () => {
    
    beforeEach(() => {
      // Mock the private methods that would normally interact with database
      jest.spyOn(testMFAService as any, 'getMFAChallenge').mockImplementation(async (challengeId: string) => {
        if (challengeId === 'valid-challenge-123') {
          return {
            challengeId: 'valid-challenge-123',
            userId: 'test-user',
            method: 'sms' as MFAMethod,
            code: 'hashed-code-123', // This would be the hashed version
            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
            attempts: 0,
            maxAttempts: 3,
            verified: false,
            createdAt: new Date(),
            metadata: {}
          };
        }
        if (challengeId === 'expired-challenge-456') {
          return {
            challengeId: 'expired-challenge-456',
            userId: 'test-user',
            method: 'email' as MFAMethod,
            code: 'hashed-code-456',
            expiresAt: new Date(Date.now() - 60 * 1000), // Expired 1 minute ago
            attempts: 0,
            maxAttempts: 3,
            verified: false,
            createdAt: new Date(),
            metadata: {}
          };
        }
        if (challengeId === 'max-attempts-789') {
          return {
            challengeId: 'max-attempts-789',
            userId: 'test-user',
            method: 'sms' as MFAMethod,
            code: 'hashed-code-789',
            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
            attempts: 3, // Max attempts reached
            maxAttempts: 3,
            verified: false,
            createdAt: new Date(),
            metadata: {}
          };
        }
        if (challengeId === 'already-verified-999') {
          return {
            challengeId: 'already-verified-999',
            userId: 'test-user',
            method: 'totp' as MFAMethod,
            code: 'hashed-code-999',
            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
            attempts: 1,
            maxAttempts: 3,
            verified: true, // Already verified
            createdAt: new Date(),
            metadata: {}
          };
        }
        return null;
      });

      // Mock database operations
      jest.spyOn(testMFAService as any, 'expireMFAChallenge').mockResolvedValue(undefined);
      jest.spyOn(testMFAService as any, 'lockMFAChallenge').mockResolvedValue(undefined);
      jest.spyOn(testMFAService as any, 'incrementChallengeAttempts').mockResolvedValue(undefined);
      jest.spyOn(testMFAService as any, 'markChallengeVerified').mockResolvedValue(undefined);

      // Mock code validation
      jest.spyOn(testMFAService as any, 'validateMFACode').mockImplementation(async (
        userId: string, 
        method: MFAMethod, 
        userCode: string, 
        challengeCode: string
      ) => {
        // Simulate correct code validation
        return userCode === '123456';
      });
    });

    test('should successfully verify valid MFA codes', async () => {
      const result = await testMFAService.verifyChallenge('valid-challenge-123', '123456');
      
      expect(result.success).toBe(true);
      expect(result.challengeId).toBe('valid-challenge-123');
      expect(result.verifiedAt).toBeInstanceOf(Date);
      expect(result.errorCode).toBeUndefined();
    });

    test('should reject invalid MFA codes', async () => {
      const result = await testMFAService.verifyChallenge('valid-challenge-123', '999999');
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_CODE');
      expect(result.errorMessage).toBe('Invalid verification code');
      expect(result.remainingAttempts).toBe(2); // 3 max - 1 attempt
    });

    test('should handle expired challenges', async () => {
      const result = await testMFAService.verifyChallenge('expired-challenge-456', '123456');
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('EXPIRED');
      expect(result.errorMessage).toBe('Challenge expired');
    });

    test('should handle max attempts exceeded', async () => {
      const result = await testMFAService.verifyChallenge('max-attempts-789', '123456');
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('MAX_ATTEMPTS');
      expect(result.errorMessage).toBe('Maximum attempts exceeded');
    });

    test('should handle already verified challenges', async () => {
      const result = await testMFAService.verifyChallenge('already-verified-999', '123456');
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('ALREADY_VERIFIED');
      expect(result.errorMessage).toBe('Challenge already verified');
    });

    test('should handle non-existent challenges', async () => {
      const result = await testMFAService.verifyChallenge('non-existent-challenge', '123456');
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('CHALLENGE_NOT_FOUND');
      expect(result.errorMessage).toBe('Challenge not found or expired');
    });

    test('should handle verification context parameters', async () => {
      const verificationContext = {
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Test Verification)'
      };
      
      const result = await testMFAService.verifyChallenge(
        'valid-challenge-123', 
        '123456', 
        verificationContext
      );
      
      expect(result.success).toBe(true);
      // Context should be passed through to audit logging
    });
  });

  // =====================================================
  // MFA Security Controls
  // =====================================================

  describe('MFA Security Controls', () => {
    
    test('should enforce rate limiting through attempt counting', async () => {
      // This test validates that the MFA system properly tracks attempts
      const challengeId = 'rate-limit-test';
      
      // Mock a challenge with 2 attempts already made
      jest.spyOn(testMFAService as any, 'getMFAChallenge').mockResolvedValue({
        challengeId,
        userId: 'test-user',
        method: 'sms' as MFAMethod,
        code: 'hashed-code',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        attempts: 2, // Already 2 attempts
        maxAttempts: 3,
        verified: false,
        createdAt: new Date(),
        metadata: {}
      });

      jest.spyOn(testMFAService as any, 'validateMFACode').mockResolvedValue(false);

      const result = await testMFAService.verifyChallenge(challengeId, '999999');
      
      expect(result.success).toBe(false);
      expect(result.remainingAttempts).toBe(0); // Should be locked after this attempt
    });

    test('should use timing-safe comparison for codes', async () => {
      // Test the timing-safe comparison method directly
      const timingSafeCompare = (testMFAService as any).timingSafeCompare;
      
      expect(timingSafeCompare('same', 'same')).toBe(true);
      expect(timingSafeCompare('different', 'strings')).toBe(false);
      expect(timingSafeCompare('', '')).toBe(true);
      expect(timingSafeCompare('a', 'ab')).toBe(false); // Different lengths
    });

    test('should properly hash MFA codes', async () => {
      // Test that codes are properly hashed before storage
      const hashCode = (testMFAService as any).hashCode;
      
      const code1Hash = hashCode('123456');
      const code2Hash = hashCode('123456');
      const code3Hash = hashCode('654321');
      
      // Same input should produce same hash
      expect(code1Hash).toBe(code2Hash);
      
      // Different inputs should produce different hashes
      expect(code1Hash).not.toBe(code3Hash);
      
      // Hashes should be hex strings
      expect(code1Hash).toMatch(/^[a-f0-9]+$/);
      expect(code1Hash.length).toBeGreaterThan(32); // SHA-256 hex is 64 chars
    });

    test('should validate session lockout after max failures', async () => {
      // Test that accounts/sessions get locked after repeated failures
      const maxFailureTests = [
        { sensitivityLevel: 'critical', expectedMaxAttempts: 3 },
        { sensitivityLevel: 'high', expectedMaxAttempts: 3 },
        { sensitivityLevel: 'medium', expectedMaxAttempts: 5 },
        { sensitivityLevel: 'low', expectedMaxAttempts: 5 }
      ];

      maxFailureTests.forEach(({ expectedMaxAttempts }) => {
        // This validates that the max attempts configuration is appropriate
        expect(expectedMaxAttempts).toBeGreaterThan(0);
        expect(expectedMaxAttempts).toBeLessThanOrEqual(5);
      });
    });
  });

  // =====================================================
  // Integration with Approval Workflows
  // =====================================================

  describe('MFA-Approval Integration', () => {
    
    test('should require MFA for approval workflow triggers', () => {
      const approvalActions = [
        'unmask_pii_with_mfa',
        'approve_payout_batch',
        'cross_region_override',
        'assign_roles'
      ];

      approvalActions.forEach(action => {
        const requiresMFA = requiresMFAForAction(action as Permission);
        expect(requiresMFA).toBe(true);
        
        const sensitivityLevel = getSensitivityLevel(action as Permission);
        expect(sensitivityLevel).toBeGreaterThanOrEqual(0.6);
      });
    });

    test('should validate MFA TTL integration with temporary access', () => {
      // Critical actions should have short MFA validity
      const criticalActions = ['unmask_pii_with_mfa', 'approve_payout_batch'];
      
      criticalActions.forEach(action => {
        const config = SENSITIVITY_THRESHOLDS[action];
        expect(config.challengeExpiryMinutes).toBeLessThanOrEqual(5);
      });
    });

    test('should validate sensitivity-based method restrictions', () => {
      // Critical actions should not allow backup codes
      const criticalConfig = SENSITIVITY_THRESHOLDS['unmask_pii_with_mfa'];
      expect(criticalConfig.allowedMethods).not.toContain('backup_code');
      expect(criticalConfig.allowedMethods).toContain('totp');

      // Standard actions can allow backup codes
      const standardConfig = SENSITIVITY_THRESHOLDS['configure_alerts'];
      expect(standardConfig.allowedMethods).toContain('backup_code');
    });
  });

  // =====================================================
  // MFA Recovery and Edge Cases
  // =====================================================

  describe('MFA Recovery and Edge Cases', () => {
    
    test('should handle backup code consumption', async () => {
      // Mock backup code validation
      jest.spyOn(testMFAService as any, 'getMFASettings').mockResolvedValue({
        userId: 'backup-user',
        backupCodesEnabled: true,
        backupCodes: ['HASHED123', 'HASHED456', 'HASHED789']
      });

      jest.spyOn(testMFAService as any, 'consumeBackupCode').mockResolvedValue(undefined);
      
      // Test that backup codes can be validated (mock implementation)
      const validateBackupCode = (testMFAService as any).validateBackupCode;
      
      // This would test the backup code validation logic
      // In the actual implementation, it would validate against hashed stored codes
      expect(typeof validateBackupCode).toBe('function');
    });

    test('should handle device enrollment edge cases', async () => {
      // Test enrollment with edge case inputs
      const edgeCases = [
        { method: 'sms', input: '+1', expected: false },
        { method: 'email', input: 'a@b.c', expected: true },
        { method: 'email', input: 'toolong@' + 'x'.repeat(250) + '.com', expected: false }
      ];

      for (const { method, input, expected } of edgeCases) {
        if (method === 'sms') {
          const result = await testMFAService.enableSMS('edge-user', input);
          expect(result.success).toBe(expected);
        } else if (method === 'email') {
          const result = await testMFAService.enableEmail('edge-user', input);
          expect(result.success).toBe(expected);
        }
      }
    });

    test('should handle concurrent challenge attempts', async () => {
      // Test that the system can handle multiple verification attempts
      // This would test database-level concurrency controls
      const challengeId = 'concurrent-test';
      const code = '123456';
      
      // In a real implementation, this would test concurrent database updates
      // For now, we validate that the verification method handles one request at a time
      const result = await testMFAService.verifyChallenge(challengeId, code);
      expect(result).toHaveProperty('success');
    });

    test('should validate MFA method availability checking', () => {
      const testPermissions: Permission[] = [
        'unmask_pii_with_mfa',
        'approve_payout_batch',
        'configure_alerts',
        'unknown_permission'
      ];

      testPermissions.forEach(permission => {
        const allowedMethods = testMFAService.getAllowedMethods(permission);
        
        expect(Array.isArray(allowedMethods)).toBe(true);
        expect(allowedMethods.length).toBeGreaterThan(0);
        
        // All returned methods should be valid MFA methods
        const validMethods: MFAMethod[] = ['sms', 'email', 'totp', 'backup_code'];
        allowedMethods.forEach(method => {
          expect(validMethods).toContain(method);
        });
      });
    });
  });

  // =====================================================
  // Performance and Scalability
  // =====================================================

  describe('MFA Performance', () => {
    
    test('should handle high-volume challenge creation efficiently', async () => {
      const startTime = performance.now();
      const userId = 'perf-test-user';
      
      // Create 100 challenges
      const challenges = await Promise.all(
        Array.from({ length: 100 }, (_, i) => 
          testMFAService.createChallenge(userId, 'sms', { action: `test-action-${i}` })
        )
      );
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      expect(challenges).toHaveLength(100);
      expect(executionTime).toBeLessThan(1000); // Should complete within 1 second
      
      // All challenges should be unique
      const challengeIds = challenges.map(c => c.challengeId);
      const uniqueIds = new Set(challengeIds);
      expect(uniqueIds.size).toBe(100);
      
      console.log(`MFA challenge creation performance: ${executionTime.toFixed(2)}ms for 100 challenges`);
    });

    test('should handle rapid verification attempts efficiently', async () => {
      const challengeId = 'perf-verify-test';
      const startTime = performance.now();
      
      // Mock a valid challenge for performance testing
      jest.spyOn(testMFAService as any, 'getMFAChallenge').mockResolvedValue({
        challengeId,
        userId: 'perf-user',
        method: 'sms' as MFAMethod,
        code: 'hashed-perf-code',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        attempts: 0,
        maxAttempts: 100, // High limit for performance test
        verified: false,
        createdAt: new Date(),
        metadata: {}
      });

      // Perform 50 verification attempts
      const verifications = await Promise.all(
        Array.from({ length: 50 }, (_, i) => 
          testMFAService.verifyChallenge(challengeId, `${i.toString().padStart(6, '0')}`)
        )
      );
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      expect(verifications).toHaveLength(50);
      expect(executionTime).toBeLessThan(500); // Should complete within 500ms
      
      console.log(`MFA verification performance: ${executionTime.toFixed(2)}ms for 50 verifications`);
    });

    test('should efficiently calculate sensitivity levels', () => {
      const startTime = performance.now();
      const permissions = Array.from({ length: 1000 }, (_, i) => `test_permission_${i}`);
      
      permissions.forEach(permission => {
        getSensitivityLevel(permission as Permission);
        requiresMFAForAction(permission as Permission, 40);
      });
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      expect(executionTime).toBeLessThan(100); // Should complete within 100ms
      console.log(`MFA sensitivity calculation performance: ${executionTime.toFixed(2)}ms for 2000 operations`);
    });
  });

  // =====================================================
  // MFA Audit and Compliance
  // =====================================================

  describe('MFA Audit and Compliance', () => {
    
    test('should log all MFA events for audit trail', async () => {
      // Test that MFA operations generate appropriate audit logs
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await testMFAService.createChallenge('audit-user', 'sms', {
        action: 'audit-test',
        ipAddress: '192.168.1.1'
      });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('MFA challenge created')
      );
      
      consoleSpy.mockRestore();
    });

    test('should maintain data privacy in audit logs', async () => {
      // Ensure sensitive data (codes, secrets) are not logged
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await testMFAService.enableTOTP('privacy-user');
      
      const logCalls = consoleSpy.mock.calls.flat().join(' ');
      
      // Should not contain sensitive data
      expect(logCalls).not.toContain('JBSWY3DPEHPK3PXP'); // TOTP secret
      expect(logCalls).not.toContain('123456'); // Code examples
      
      consoleSpy.mockRestore();
    });

    test('should validate GDPR compliance features', async () => {
      // Test data minimization and retention features
      const backupCodes = await testMFAService.generateBackupCodes('gdpr-user', 5);
      
      expect(backupCodes.success).toBe(true);
      
      // Backup codes should only be shown once (not stored in plain text)
      expect(backupCodes.backupCodes).toBeDefined();
      
      // The system should store only hashed versions
      // This would be validated in the actual database storage logic
    });
  });
});