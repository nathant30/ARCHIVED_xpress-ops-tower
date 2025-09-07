// PII Masking Validation Testing
// Comprehensive testing of three-tier PII scope system: none/masked/full
// Validates NPC Philippines compliance and sensitive data protection

import { rbacEngine } from '@/lib/auth/rbac-engine';
import { TEST_USERS, TEST_REGIONS } from '../setup/test-users-data';
import { getTestEnvironmentConfig } from '../setup/environment-config';

describe('PII Masking Validation', () => {
  const testConfig = getTestEnvironmentConfig();

  beforeAll(() => {
    process.env.JWT_SECRET = testConfig.jwt.secret;
    process.env.NODE_ENV = 'test';
  });

  describe('PII Scope Level Validation', () => {
    it('should enforce "none" PII scope for ground operations', async () => {
      const groundOpsUser = TEST_USERS.find(u => u.id === 'usr-ground-ops-001')!; // PII scope: none
      
      expect(groundOpsUser.piiScope).toBe('none');
      
      // Should deny access to any PII-containing resources
      const piiAccessResult = await rbacEngine.evaluatePolicy({
        user: groundOpsUser,
        resource: { 
          regionId: TEST_REGIONS.NCR_MANILA, 
          dataClass: 'internal', 
          containsPII: true 
        },
        action: 'contact_driver_masked',
        context: { channel: 'ui', mfaPresent: false }
      });
      
      expect(piiAccessResult.decision).toBe('deny');
      expect(piiAccessResult.reasons).toContain('PII access denied - insufficient scope');
      expect(piiAccessResult.obligations?.maskPII).toBe(true);
    });

    it('should enforce "masked" PII scope for operations manager', async () => {
      const opsManager = TEST_USERS.find(u => u.id === 'usr-ops-manager-001')!; // PII scope: masked
      
      expect(opsManager.piiScope).toBe('masked');
      
      // Should allow access to internal PII with masking obligation
      const maskedPiiResult = await rbacEngine.evaluatePolicy({
        user: opsManager,
        resource: { 
          regionId: TEST_REGIONS.DAVAO, 
          dataClass: 'internal', 
          containsPII: true 
        },
        action: 'view_driver_files_masked',
        context: { channel: 'ui', mfaPresent: false }
      });
      
      expect(maskedPiiResult.decision).toBe('allow');
      expect(maskedPiiResult.obligations?.maskPII).toBe(true);
      expect(maskedPiiResult.obligations?.piiScope).toBe('masked');
      
      // Should deny access to restricted PII even with masking
      const restrictedPiiResult = await rbacEngine.evaluatePolicy({
        user: opsManager,
        resource: { 
          regionId: TEST_REGIONS.DAVAO, 
          dataClass: 'restricted', 
          containsPII: true 
        },
        action: 'view_driver_files_masked',
        context: { channel: 'ui', mfaPresent: false }
      });
      
      expect(restrictedPiiResult.decision).toBe('deny');
      expect(restrictedPiiResult.reasons).toContain('Restricted PII requires full scope with MFA');
    });

    it('should enforce "full" PII scope for risk investigator', async () => {
      const riskInvestigator = TEST_USERS.find(u => u.id === 'usr-risk-investigator-001')!; // PII scope: full
      
      expect(riskInvestigator.piiScope).toBe('full');
      expect(riskInvestigator.mfaEnabled).toBe(true);
      
      // Should allow unmasked PII access with MFA
      const fullPiiResult = await rbacEngine.evaluatePolicy({
        user: riskInvestigator,
        resource: { 
          regionId: TEST_REGIONS.CEBU, 
          dataClass: 'restricted', 
          containsPII: true 
        },
        action: 'unmask_pii_with_mfa',
        context: { channel: 'ui', mfaPresent: true }
      });
      
      expect(fullPiiResult.decision).toBe('allow');
      expect(fullPiiResult.obligations?.maskPII).toBe(false);
      expect(fullPiiResult.obligations?.piiScope).toBe('full');
      expect(fullPiiResult.obligations?.auditLevel).toBe('enhanced');
      
      // Should deny unmasked PII access without MFA
      const noMfaResult = await rbacEngine.evaluatePolicy({
        user: riskInvestigator,
        resource: { 
          regionId: TEST_REGIONS.CEBU, 
          dataClass: 'restricted', 
          containsPII: true 
        },
        action: 'unmask_pii_with_mfa',
        context: { channel: 'ui', mfaPresent: false }
      });
      
      expect(noMfaResult.decision).toBe('deny');
      expect(noMfaResult.reasons).toContain('MFA required for PII unmasking');
      expect(noMfaResult.obligations?.requireMFA).toBe(true);
    });

    it('should validate global full PII scope for IAM admin', async () => {
      const iamAdmin = TEST_USERS.find(u => u.id === 'usr-iam-admin-001')!; // PII scope: full, global
      
      expect(iamAdmin.piiScope).toBe('full');
      expect(iamAdmin.allowedRegions).toEqual([]); // Global access
      
      // Should allow full PII access across all regions with MFA
      const regions = [TEST_REGIONS.NCR_MANILA, TEST_REGIONS.CEBU, TEST_REGIONS.DAVAO];
      
      for (const regionId of regions) {
        const globalPiiResult = await rbacEngine.evaluatePolicy({
          user: iamAdmin,
          resource: { 
            regionId, 
            dataClass: 'confidential', 
            containsPII: true 
          },
          action: 'manage_users',
          context: { channel: 'ui', mfaPresent: true }
        });
        
        expect(globalPiiResult.decision).toBe('allow');
        expect(globalPiiResult.obligations?.piiScope).toBe('full');
      }
    });

    it('should validate no PII access for app admin', async () => {
      const appAdmin = TEST_USERS.find(u => u.id === 'usr-app-admin-001')!; // PII scope: none
      
      expect(appAdmin.piiScope).toBe('none');
      
      // System admin should not need PII access for configuration tasks
      const systemConfigResult = await rbacEngine.evaluatePolicy({
        user: appAdmin,
        resource: { 
          regionId: TEST_REGIONS.NCR_MANILA, 
          dataClass: 'internal', 
          containsPII: false 
        },
        action: 'manage_feature_flags',
        context: { channel: 'ui', mfaPresent: true }
      });
      
      expect(systemConfigResult.decision).toBe('allow');
      
      // Should deny any PII access attempts
      const piiAttemptResult = await rbacEngine.evaluatePolicy({
        user: appAdmin,
        resource: { 
          regionId: TEST_REGIONS.NCR_MANILA, 
          dataClass: 'internal', 
          containsPII: true 
        },
        action: 'view_user_profile',
        context: { channel: 'ui', mfaPresent: true }
      });
      
      expect(piiAttemptResult.decision).toBe('deny');
      expect(piiAttemptResult.reasons).toContain('PII access denied - insufficient scope');
    });
  });

  describe('Data Export PII Protection', () => {
    it('should enforce masked exports for analyst role', async () => {
      const analyst = TEST_USERS.find(u => u.id === 'usr-analyst-001')!; // PII scope: masked
      
      // Should allow masked data export
      const maskedExportResult = await rbacEngine.evaluatePolicy({
        user: analyst,
        resource: { 
          regionId: TEST_REGIONS.NCR_MANILA, 
          dataClass: 'internal', 
          containsPII: true 
        },
        action: 'export_reports',
        context: { 
          channel: 'api', 
          mfaPresent: false,
          exportFormat: 'csv',
          includesPII: true
        }
      });
      
      expect(maskedExportResult.decision).toBe('allow');
      expect(maskedExportResult.obligations?.maskPII).toBe(true);
      expect(maskedExportResult.obligations?.exportRestrictions).toContain('mask_personal_data');
      expect(maskedExportResult.obligations?.auditLevel).toBe('enhanced');
      
      // Should deny unmasked data export requests
      const unmaskedExportResult = await rbacEngine.evaluatePolicy({
        user: analyst,
        resource: { 
          regionId: TEST_REGIONS.NCR_MANILA, 
          dataClass: 'restricted', 
          containsPII: true 
        },
        action: 'export_unmasked',
        context: { 
          channel: 'api', 
          mfaPresent: false,
          exportFormat: 'csv'
        }
      });
      
      expect(unmaskedExportResult.decision).toBe('deny');
      expect(unmaskedExportResult.reasons).toContain('Unmasked export requires full PII scope');
    });

    it('should prevent PII leak in batch operations', async () => {
      const opsMonitor = TEST_USERS.find(u => u.id === 'usr-ops-monitor-001')!; // PII scope: none
      
      // Should deny bulk data operations that might contain PII
      const bulkOperationResult = await rbacEngine.evaluatePolicy({
        user: opsMonitor,
        resource: { 
          regionId: TEST_REGIONS.CEBU, 
          dataClass: 'internal', 
          containsPII: true 
        },
        action: 'batch_driver_update',
        context: { 
          channel: 'batch', 
          mfaPresent: false,
          recordCount: 1000
        }
      });
      
      expect(bulkOperationResult.decision).toBe('deny');
      expect(bulkOperationResult.reasons).toContain('Batch PII operations require elevated scope');
      expect(bulkOperationResult.obligations?.preventPIILeak).toBe(true);
    });

    it('should validate CSV export PII masking obligations', async () => {
      const regionalManager = TEST_USERS.find(u => u.id === 'usr-regional-manager-001')!; // PII scope: masked
      
      const csvExportResult = await rbacEngine.evaluatePolicy({
        user: regionalManager,
        resource: { 
          regionId: TEST_REGIONS.NCR_MANILA, 
          dataClass: 'confidential', 
          containsPII: true 
        },
        action: 'export_driver_report',
        context: { 
          channel: 'ui', 
          mfaPresent: true,
          exportFormat: 'csv',
          fields: ['name', 'phone', 'email', 'license_number'],
          includesPII: true
        }
      });
      
      expect(csvExportResult.decision).toBe('allow');
      expect(csvExportResult.obligations?.maskPII).toBe(true);
      expect(csvExportResult.obligations?.exportRestrictions).toEqual([
        'mask_personal_data',
        'redact_sensitive_fields',
        'audit_export_access'
      ]);
      expect(csvExportResult.obligations?.maskedFields).toEqual([
        'phone', 'email', 'license_number'
      ]);
    });
  });

  describe('PII Scope Elevation through Temporary Access', () => {
    it('should allow PII scope elevation for support with case', async () => {
      const supportUser = TEST_USERS.find(u => u.id === 'usr-support-001')!; // Base PII scope: masked
      
      expect(supportUser.piiScope).toBe('masked');
      expect(supportUser.temporaryAccess![0].piiScopeOverride).toBe('masked');
      
      // With temporary access, should maintain masked scope but get regional override
      const tempAccessResult = await rbacEngine.evaluatePolicy({
        user: supportUser,
        resource: { 
          regionId: TEST_REGIONS.NCR_MANILA, // Cross-region via temp access
          dataClass: 'internal', 
          containsPII: true 
        },
        action: 'view_masked_profiles',
        context: { 
          channel: 'ui', 
          mfaPresent: false,
          caseId: 'CASE-SUPPORT-MNL-001'
        }
      });
      
      expect(tempAccessResult.decision).toBe('allow');
      expect(tempAccessResult.obligations?.piiScope).toBe('masked');
      expect(tempAccessResult.reasons).toContain('Cross-region override granted');
    });

    it('should validate temporary PII scope elevation for risk investigator', async () => {
      const riskInvestigator = TEST_USERS.find(u => u.id === 'usr-risk-investigator-001')!;
      
      // Create temporary access with PII scope elevation for specific case
      const elevatedUser = {
        ...riskInvestigator,
        temporaryAccess: [{
          id: 'temp-pii-elevation-001',
          grantedPermissions: ['unmask_pii_with_mfa'],
          grantedRegions: [TEST_REGIONS.NCR_MANILA], // Cross-region
          piiScopeOverride: 'full',
          caseId: 'CASE-FRAUD-MNL-HIGH-001',
          escalationType: 'fraud',
          justification: 'High-priority fraud investigation requiring full PII access',
          expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours
          isActive: true,
          requestedBy: 'usr-risk-investigator-001',
          approvedBy: 'usr-regional-manager-001',
          createdAt: new Date(),
          updatedAt: new Date()
        }]
      };
      
      const elevatedPiiResult = await rbacEngine.evaluatePolicy({
        user: elevatedUser,
        resource: { 
          regionId: TEST_REGIONS.NCR_MANILA, // Cross-region access
          dataClass: 'restricted', 
          containsPII: true 
        },
        action: 'unmask_pii_with_mfa',
        context: { 
          channel: 'ui', 
          mfaPresent: true,
          caseId: 'CASE-FRAUD-MNL-HIGH-001'
        }
      });
      
      expect(elevatedPiiResult.decision).toBe('allow');
      expect(elevatedPiiResult.obligations?.piiScope).toBe('full');
      expect(elevatedPiiResult.obligations?.auditLevel).toBe('enhanced');
      expect(elevatedPiiResult.metadata.overridePath).toBe('temporary_escalation');
    });

    it('should deny PII scope elevation without valid temporary access', async () => {
      const supportUser = TEST_USERS.find(u => u.id === 'usr-support-001')!;
      
      // Create user without temporary access
      const noTempAccessUser = {
        ...supportUser,
        temporaryAccess: []
      };
      
      const deniedElevationResult = await rbacEngine.evaluatePolicy({
        user: noTempAccessUser,
        resource: { 
          regionId: TEST_REGIONS.NCR_MANILA, 
          dataClass: 'confidential', 
          containsPII: true 
        },
        action: 'view_masked_profiles',
        context: { 
          channel: 'ui', 
          mfaPresent: false,
          caseId: 'CASE-SUPPORT-MNL-001'
        }
      });
      
      expect(deniedElevationResult.decision).toBe('deny');
      expect(deniedElevationResult.reasons).toContain('Regional access denied');
    });
  });

  describe('MFA-Gated PII Access', () => {
    it('should enforce MFA for sensitive PII operations', async () => {
      const riskInvestigator = TEST_USERS.find(u => u.id === 'usr-risk-investigator-001')!;
      
      // Operations requiring MFA for PII access
      const sensitiveOperations = [
        'unmask_pii_with_mfa',
        'export_full_profile',
        'view_investigation_details',
        'access_restricted_evidence'
      ];
      
      for (const operation of sensitiveOperations) {
        // Should allow with MFA
        const withMfaResult = await rbacEngine.evaluatePolicy({
          user: riskInvestigator,
          resource: { 
            regionId: TEST_REGIONS.CEBU, 
            dataClass: 'restricted', 
            containsPII: true 
          },
          action: operation,
          context: { channel: 'ui', mfaPresent: true }
        });
        
        expect(withMfaResult.decision).toBe('allow');
        expect(withMfaResult.obligations?.requireMFA).toBe(undefined); // Already satisfied
        
        // Should deny without MFA
        const withoutMfaResult = await rbacEngine.evaluatePolicy({
          user: riskInvestigator,
          resource: { 
            regionId: TEST_REGIONS.CEBU, 
            dataClass: 'restricted', 
            containsPII: true 
          },
          action: operation,
          context: { channel: 'ui', mfaPresent: false }
        });
        
        expect(withoutMfaResult.decision).toBe('deny');
        expect(withoutMfaResult.obligations?.requireMFA).toBe(true);
      }
    });

    it('should validate MFA timeout for extended PII sessions', async () => {
      const riskInvestigator = TEST_USERS.find(u => u.id === 'usr-risk-investigator-001')!;
      
      // Simulate MFA timeout scenario (MFA verified but expired)
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
          mfaTimeout: 1800 // 30 minutes timeout
        }
      });
      
      expect(expiredMfaResult.decision).toBe('deny');
      expect(expiredMfaResult.reasons).toContain('MFA verification expired');
      expect(expiredMfaResult.obligations?.requireMFA).toBe(true);
    });
  });

  describe('NPC Philippines Compliance', () => {
    it('should validate Data Privacy Act 2012 compliance', async () => {
      const analyst = TEST_USERS.find(u => u.id === 'usr-analyst-001')!;
      
      // Validate DPA-compliant data handling
      const dpaComplianceResult = await rbacEngine.evaluatePolicy({
        user: analyst,
        resource: { 
          regionId: TEST_REGIONS.NCR_MANILA, 
          dataClass: 'internal', 
          containsPII: true,
          dataCategory: 'personal_identifiable_information'
        },
        action: 'process_personal_data',
        context: { 
          channel: 'ui', 
          mfaPresent: false,
          processingBasis: 'legitimate_interest',
          dataSubjectConsent: false
        }
      });
      
      expect(dpaComplianceResult.decision).toBe('allow');
      expect(dpaComplianceResult.obligations?.maskPII).toBe(true);
      expect(dpaComplianceResult.obligations?.complianceFlags).toContain('dpa_2012');
      expect(dpaComplianceResult.obligations?.auditLevel).toBe('enhanced');
    });

    it('should enforce sensitive personal information protection', async () => {
      const riskInvestigator = TEST_USERS.find(u => u.id === 'usr-risk-investigator-001')!;
      
      // Sensitive personal information requires highest protection
      const spiProtectionResult = await rbacEngine.evaluatePolicy({
        user: riskInvestigator,
        resource: { 
          regionId: TEST_REGIONS.CEBU, 
          dataClass: 'restricted', 
          containsPII: true,
          dataCategory: 'sensitive_personal_information',
          sensitiveTypes: ['race', 'religion', 'political_opinion', 'health_data']
        },
        action: 'access_sensitive_data',
        context: { 
          channel: 'ui', 
          mfaPresent: true,
          legalBasis: 'criminal_investigation',
          courtOrder: true
        }
      });
      
      expect(spiProtectionResult.decision).toBe('allow');
      expect(spiProtectionResult.obligations?.auditLevel).toBe('maximum');
      expect(spiProtectionResult.obligations?.complianceFlags).toContain('spi_protection');
      expect(spiProtectionResult.obligations?.notifyDPO).toBe(true);
      
      // Should deny without proper legal basis
      const noLegalBasisResult = await rbacEngine.evaluatePolicy({
        user: riskInvestigator,
        resource: { 
          regionId: TEST_REGIONS.CEBU, 
          dataClass: 'restricted', 
          containsPII: true,
          dataCategory: 'sensitive_personal_information'
        },
        action: 'access_sensitive_data',
        context: { 
          channel: 'ui', 
          mfaPresent: true
          // No legal basis provided
        }
      });
      
      expect(noLegalBasisResult.decision).toBe('deny');
      expect(noLegalBasisResult.reasons).toContain('Legal basis required for sensitive personal information');
    });

    it('should validate data retention compliance', async () => {
      const auditor = TEST_USERS.find(u => u.id === 'usr-auditor-001')!;
      
      // Validate retention policy compliance
      const retentionCheckResult = await rbacEngine.evaluatePolicy({
        user: auditor,
        resource: { 
          regionId: TEST_REGIONS.NCR_MANILA, 
          dataClass: 'confidential', 
          containsPII: true,
          dataAge: '5years',
          retentionPeriod: '7years'
        },
        action: 'audit_data_retention',
        context: { 
          channel: 'ui', 
          mfaPresent: true,
          auditPurpose: 'compliance_review'
        }
      });
      
      expect(retentionCheckResult.decision).toBe('allow');
      expect(retentionCheckResult.obligations?.complianceFlags).toContain('retention_compliant');
      
      // Should flag expired data for review
      const expiredDataResult = await rbacEngine.evaluatePolicy({
        user: auditor,
        resource: { 
          regionId: TEST_REGIONS.NCR_MANILA, 
          dataClass: 'confidential', 
          containsPII: true,
          dataAge: '8years',
          retentionPeriod: '7years'
        },
        action: 'audit_data_retention',
        context: { 
          channel: 'ui', 
          mfaPresent: true,
          auditPurpose: 'compliance_review'
        }
      });
      
      expect(expiredDataResult.decision).toBe('allow');
      expect(expiredDataResult.obligations?.complianceFlags).toContain('retention_expired');
      expect(expiredDataResult.obligations?.requireReview).toBe(true);
    });
  });
});