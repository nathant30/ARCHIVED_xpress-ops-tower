// End-to-End User Journey Tests
// Comprehensive testing of complete user workflows through the RBAC+ABAC system
// Tests critical user journeys from login to action completion

import { rbacEngine } from '@/lib/auth/rbac-engine';
import { mfaService, type MFAMethod } from '@/lib/auth/mfa-service';
import { 
  getWorkflowDefinition,
  validateApprovalRequest,
  canUserApproveWorkflow 
} from '@/lib/approval-workflows';

import type { 
  EnhancedUser, 
  PolicyEvaluationRequest,
  DataClass,
  PIIScope,
  XpressRole 
} from '@/types/rbac-abac';

import type { 
  CreateApprovalRequestBody,
  ApprovalDecisionBody 
} from '@/types/approval';

import type { Permission } from '@/hooks/useRBAC';

describe('End-to-End User Journey Tests', () => {

  // =====================================================
  // Test Data Setup
  // =====================================================

  const createTestUser = (
    role: XpressRole, 
    regions: string[] = [], 
    piiScope: PIIScope = 'none',
    mfaEnabled = false
  ): EnhancedUser => ({
    id: `user-${role}-${Math.random()}`,
    email: `${role}@xpress.ph`,
    firstName: role.charAt(0).toUpperCase() + role.slice(1),
    lastName: 'User',
    timezone: 'Asia/Manila',
    locale: 'en-PH',
    status: 'active',
    allowedRegions: regions,
    piiScope,
    mfaEnabled,
    trustedDevices: [],
    failedLoginAttempts: 0,
    loginCount: 1,
    roles: [{
      id: `assignment-${role}`,
      userId: `user-${role}`,
      roleId: role,
      role: {
        id: role,
        name: role,
        displayName: role.replace('_', ' ').toUpperCase(),
        level: 30,
        permissions: [],
        inheritsFrom: [],
        isSystem: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      allowedRegions: regions,
      validFrom: new Date(),
      assignedAt: new Date(),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }],
    permissions: [],
    temporaryAccess: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true
  });

  const simulateUserSession = (user: EnhancedUser) => ({
    sessionId: `session-${user.id}`,
    ipAddress: '192.168.1.100',
    userAgent: 'Test Browser/1.0',
    mfaVerified: false,
    mfaVerifiedAt: null as Date | null,
    loginAt: new Date(),
    expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000) // 8 hours
  });

  // =====================================================
  // Journey 1: Ground Ops User → Alert Acknowledgment
  // =====================================================

  describe('Journey 1: Ground Ops Alert Acknowledgment', () => {
    
    test('should complete ground ops alert acknowledgment workflow', async () => {
      // Step 1: User Login
      const groundOpsUser = createTestUser('ground_ops', ['ncr-manila']);
      const session = simulateUserSession(groundOpsUser);
      
      expect(groundOpsUser.status).toBe('active');
      expect(groundOpsUser.allowedRegions).toContain('ncr-manila');
      
      // Step 2: Attempt to acknowledge alert (restricted action)
      const alertAcknowledgmentRequest: PolicyEvaluationRequest = {
        user: {
          id: groundOpsUser.id,
          roles: ['ground_ops'],
          permissions: rbacEngine.validateUserPermissions(groundOpsUser),
          allowedRegions: groundOpsUser.allowedRegions,
          piiScope: groundOpsUser.piiScope
        },
        resource: {
          type: 'alert',
          regionId: 'ncr-manila',
          dataClass: 'internal',
          containsPII: false
        },
        action: 'configure_alerts', // Restricted action requiring approval
        context: {
          channel: 'ui',
          mfaPresent: session.mfaVerified,
          timestamp: new Date()
        }
      };

      // Should be denied initially due to insufficient permissions
      const initialDecision = await rbacEngine.evaluatePolicy(alertAcknowledgmentRequest);
      expect(initialDecision.decision).toBe('deny');
      expect(initialDecision.reasons[0]).toContain('not permitted');

      // Step 3: Request approval for alert configuration
      const approvalRequest: CreateApprovalRequestBody = {
        action: 'configure_alerts',
        justification: 'Need to adjust alert thresholds due to high traffic in NCR Manila during rush hour',
        requested_action: {
          action: 'configure_alerts',
          region: 'ncr-manila',
          alert_types: ['high_demand', 'driver_shortage', 'eta_delays']
        },
        ttl_hours: 1
      };

      const workflow = getWorkflowDefinition('configure_alerts');
      expect(workflow).toBeDefined();
      
      const validationResult = validateApprovalRequest(approvalRequest, workflow!);
      expect(validationResult.valid).toBe(true);

      // Step 4: Manager approves the request
      const managerUser = createTestUser('ops_manager', ['ncr-manila'], 'masked');
      const canApprove = canUserApproveWorkflow(
        30, // ops_manager level
        'ops_manager',
        ['approve_requests'] as Permission[],
        'configure_alerts'
      );
      expect(canApprove).toBe(true);

      // Step 5: Temporary access granted - user can now perform action
      const userWithTempAccess = {
        ...groundOpsUser,
        temporaryAccess: [{
          id: 'temp-access-1',
          userId: groundOpsUser.id,
          escalationType: 'support' as const,
          grantedPermissions: ['configure_alerts'],
          grantedRegions: ['ncr-manila'],
          requestedBy: managerUser.id,
          requestedAt: new Date(),
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
          justification: 'Approved alert configuration for traffic management',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }]
      };

      // Step 6: Retry action with temporary access
      const tempAccessRequest: PolicyEvaluationRequest = {
        ...alertAcknowledgmentRequest,
        user: {
          ...alertAcknowledgmentRequest.user,
          permissions: rbacEngine.validateUserPermissions(userWithTempAccess)
        }
      };

      const finalDecision = await rbacEngine.evaluatePolicy(tempAccessRequest);
      expect(finalDecision.decision).toBe('allow');
      expect(finalDecision.obligations?.auditLevel).toBe('enhanced');

      console.log('✅ Ground Ops Alert Acknowledgment Journey Completed');
    });
  });

  // =====================================================
  // Journey 2: Regional Manager → Cross-Region Access
  // =====================================================

  describe('Journey 2: Regional Manager Cross-Region Access', () => {
    
    test('should complete cross-region access workflow with executive approval', async () => {
      // Step 1: Regional Manager login
      const regionalManager = createTestUser('regional_manager', ['cebu'], 'masked', true);
      const session = simulateUserSession(regionalManager);
      
      // Step 2: Attempt cross-region operation (NCR Manila from Cebu manager)
      const crossRegionRequest: PolicyEvaluationRequest = {
        user: {
          id: regionalManager.id,
          roles: ['regional_manager'],
          permissions: rbacEngine.validateUserPermissions(regionalManager),
          allowedRegions: regionalManager.allowedRegions,
          piiScope: regionalManager.piiScope
        },
        resource: {
          type: 'operation',
          regionId: 'ncr-manila', // Different region
          dataClass: 'internal',
          containsPII: false
        },
        action: 'manage_queue',
        context: {
          channel: 'ui',
          mfaPresent: session.mfaVerified,
          timestamp: new Date()
        }
      };

      // Should be denied due to regional restrictions
      const initialDecision = await rbacEngine.evaluatePolicy(crossRegionRequest);
      expect(initialDecision.decision).toBe('deny');
      expect(initialDecision.reasons[0]).toContain('region ncr-manila');

      // Step 3: Request cross-region override
      const overrideRequest: CreateApprovalRequestBody = {
        action: 'cross_region_override',
        justification: 'Emergency support needed for NCR Manila operations due to typhoon affecting Cebu staff availability',
        requested_action: {
          action: 'cross_region_override',
          source_region: 'cebu',
          target_region: 'ncr-manila',
          duration_hours: 4,
          emergency_level: 'high'
        },
        ttl_hours: 4
      };

      const overrideWorkflow = getWorkflowDefinition('cross_region_override');
      expect(overrideWorkflow).toBeDefined();
      expect(overrideWorkflow!.sensitivity_level).toBe('high');
      expect(overrideWorkflow!.mfa_required_for_approval).toBe(true);

      // Step 4: Executive approval required
      const executive = createTestUser('executive', [], 'masked', true);
      const canExecutiveApprove = canUserApproveWorkflow(
        60, // executive level
        'executive',
        ['approve_requests'] as Permission[],
        'cross_region_override'
      );
      expect(canExecutiveApprove).toBe(true);

      // Step 5: MFA challenge for executive approval
      const mfaChallenge = await mfaService.createChallenge(executive.id, 'totp', {
        action: 'cross_region_override',
        permission: 'approve_requests',
        ipAddress: '10.0.0.1'
      });
      
      expect(mfaChallenge.challengeId).toBeDefined();
      expect(mfaChallenge.expiresAt.getTime()).toBeGreaterThan(Date.now());

      // Step 6: MFA verification (simulated)
      // In real implementation, executive would enter TOTP code
      // For testing, we simulate successful MFA
      session.mfaVerified = true;
      session.mfaVerifiedAt = new Date();

      // Step 7: Cross-region temporary access granted
      const managerWithCrossRegionAccess = {
        ...regionalManager,
        temporaryAccess: [{
          id: 'cross-region-temp',
          userId: regionalManager.id,
          escalationType: 'support' as const,
          grantedPermissions: ['cross_region_override', 'manage_queue'],
          grantedRegions: ['ncr-manila'],
          requestedBy: executive.id,
          requestedAt: new Date(),
          expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours
          justification: 'Emergency cross-region access approved',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }]
      };

      // Step 8: Retry cross-region operation
      const finalCrossRegionRequest: PolicyEvaluationRequest = {
        ...crossRegionRequest,
        user: {
          ...crossRegionRequest.user,
          permissions: rbacEngine.validateUserPermissions(managerWithCrossRegionAccess),
          allowedRegions: rbacEngine.getEffectiveRegions(managerWithCrossRegionAccess)
        },
        context: {
          ...crossRegionRequest.context,
          mfaPresent: session.mfaVerified
        }
      };

      const finalDecision = await rbacEngine.evaluatePolicy(finalCrossRegionRequest);
      expect(finalDecision.decision).toBe('allow');
      expect(finalDecision.obligations?.auditLevel).toBe('enhanced');
      expect(finalDecision.obligations?.requireMFA).toBe(true);

      console.log('✅ Cross-Region Access Journey Completed');
    });
  });

  // =====================================================
  // Journey 3: Support User → PII Unmasking
  // =====================================================

  describe('Journey 3: Support User PII Unmasking', () => {
    
    test('should complete PII unmasking workflow with dual approval', async () => {
      // Step 1: Support user login
      const supportUser = createTestUser('support', ['ncr-manila'], 'masked', true);
      const session = simulateUserSession(supportUser);

      // Step 2: Attempt to access unmasked PII
      const piiAccessRequest: PolicyEvaluationRequest = {
        user: {
          id: supportUser.id,
          roles: ['support'],
          permissions: rbacEngine.validateUserPermissions(supportUser),
          allowedRegions: supportUser.allowedRegions,
          piiScope: supportUser.piiScope
        },
        resource: {
          type: 'user_profile',
          regionId: 'ncr-manila',
          dataClass: 'restricted',
          containsPII: true
        },
        action: 'unmask_pii_with_mfa',
        context: {
          channel: 'ui',
          mfaPresent: session.mfaVerified,
          timestamp: new Date()
        }
      };

      // Should be denied - support cannot unmask PII
      const initialDecision = await rbacEngine.evaluatePolicy(piiAccessRequest);
      expect(initialDecision.decision).toBe('deny');

      // Step 3: Request PII unmasking approval
      const piiRequest: CreateApprovalRequestBody = {
        action: 'unmask_pii_with_mfa',
        justification: 'Investigation of fraud case FRAUD-2025-0831-001 requires access to full customer PII to verify identity and payment information',
        requested_action: {
          action: 'unmask_pii_with_mfa',
          user_ids: ['customer-123', 'customer-456'],
          investigation_case: 'FRAUD-2025-0831-001',
          data_retention_days: 30
        }
      };

      const piiWorkflow = getWorkflowDefinition('unmask_pii_with_mfa');
      expect(piiWorkflow).toBeDefined();
      expect(piiWorkflow!.sensitivity_level).toBe('critical');
      expect(piiWorkflow!.dual_approval_required).toBe(true);
      expect(piiWorkflow!.mfa_required_for_approval).toBe(true);

      // Step 4: First approval - Risk Investigator
      const riskInvestigator = createTestUser('risk_investigator', [], 'full', true);
      const canRiskApprove = canUserApproveWorkflow(
        35, // risk_investigator level
        'risk_investigator',
        ['approve_requests'] as Permission[],
        'unmask_pii_with_mfa'
      );
      expect(canRiskApprove).toBe(true);

      // Step 5: MFA for first approval
      const riskMfaChallenge = await mfaService.createChallenge(riskInvestigator.id, 'sms', {
        action: 'unmask_pii_with_mfa',
        permission: 'approve_requests'
      });
      expect(riskMfaChallenge.challengeId).toBeDefined();

      // Step 6: Second approval - Executive (dual approval requirement)
      const executive = createTestUser('executive', [], 'full', true);
      const canExecutiveApprove = canUserApproveWorkflow(
        60, // executive level
        'executive', 
        ['approve_requests'] as Permission[],
        'unmask_pii_with_mfa'
      );
      expect(canExecutiveApprove).toBe(true);

      // Step 7: MFA for second approval
      const execMfaChallenge = await mfaService.createChallenge(executive.id, 'totp', {
        action: 'unmask_pii_with_mfa',
        permission: 'approve_requests'
      });
      expect(execMfaChallenge.challengeId).toBeDefined();

      // Step 8: PII access granted with elevated scope
      const supportUserWithPIIAccess = {
        ...supportUser,
        temporaryAccess: [{
          id: 'pii-temp-access',
          userId: supportUser.id,
          escalationType: 'risk_investigator' as const,
          grantedPermissions: ['unmask_pii_with_mfa', 'view_audit_logs'],
          grantedRegions: ['ncr-manila'],
          piiScopeOverride: 'full' as PIIScope,
          requestedBy: riskInvestigator.id,
          approvedBy: executive.id,
          requestedAt: new Date(),
          approvedAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes only
          justification: 'Fraud investigation PII access',
          approvalNotes: 'Dual approval granted for case FRAUD-2025-0831-001',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }]
      };

      // Step 9: User completes MFA challenge
      session.mfaVerified = true;
      session.mfaVerifiedAt = new Date();

      // Step 10: Access PII with temporary elevated permissions
      const elevatedPIIRequest: PolicyEvaluationRequest = {
        ...piiAccessRequest,
        user: {
          ...piiAccessRequest.user,
          permissions: rbacEngine.validateUserPermissions(supportUserWithPIIAccess),
          piiScope: rbacEngine.getEffectivePIIScope(supportUserWithPIIAccess)
        },
        context: {
          ...piiAccessRequest.context,
          mfaPresent: session.mfaVerified
        }
      };

      const finalPIIDecision = await rbacEngine.evaluatePolicy(elevatedPIIRequest);
      expect(finalPIIDecision.decision).toBe('allow');
      expect(finalPIIDecision.obligations?.auditLevel).toBe('enhanced');
      expect(finalPIIDecision.obligations?.requireMFA).toBe(true);
      expect(finalPIIDecision.obligations?.maskFields).toEqual([]); // No masking with full scope + MFA

      console.log('✅ PII Unmasking Journey Completed');
    });
  });

  // =====================================================
  // Journey 4: Operations Manager → System Administration
  // =====================================================

  describe('Journey 4: Operations Manager System Administration', () => {
    
    test('should complete user management workflow', async () => {
      // Step 1: Operations Manager login
      const opsManager = createTestUser('ops_manager', ['cebu'], 'masked', false);
      const session = simulateUserSession(opsManager);

      // Step 2: Attempt user management (restricted to IAM admin)
      const userMgmtRequest: PolicyEvaluationRequest = {
        user: {
          id: opsManager.id,
          roles: ['ops_manager'],
          permissions: rbacEngine.validateUserPermissions(opsManager),
          allowedRegions: opsManager.allowedRegions,
          piiScope: opsManager.piiScope
        },
        resource: {
          type: 'user_account',
          regionId: 'cebu',
          dataClass: 'confidential',
          containsPII: true
        },
        action: 'manage_users',
        context: {
          channel: 'ui',
          mfaPresent: session.mfaVerified,
          timestamp: new Date()
        }
      };

      // Should be denied - ops_manager cannot manage users directly
      const initialDecision = await rbacEngine.evaluatePolicy(userMgmtRequest);
      expect(initialDecision.decision).toBe('deny');

      // Step 3: Request user management approval
      const userMgmtApprovalRequest: CreateApprovalRequestBody = {
        action: 'manage_users',
        justification: 'Need to create new ground ops user accounts for Cebu expansion team - 5 new drivers starting Monday',
        requested_action: {
          action: 'manage_users',
          operation: 'create_users',
          region: 'cebu',
          user_count: 5,
          roles: ['ground_ops'],
          department: 'operations'
        },
        ttl_hours: 2
      };

      const userMgmtWorkflow = getWorkflowDefinition('manage_users');
      expect(userMgmtWorkflow).toBeDefined();
      expect(userMgmtWorkflow!.sensitivity_level).toBe('medium');

      // Step 4: Regional Manager approval
      const regionalManager = createTestUser('regional_manager', ['cebu'], 'masked', false);
      const canRegionalApprove = canUserApproveWorkflow(
        40, // regional_manager level
        'regional_manager',
        ['approve_requests'] as Permission[],
        'manage_users'
      );
      expect(canRegionalApprove).toBe(true);

      // Step 5: Grant temporary user management access
      const opsManagerWithUserMgmt = {
        ...opsManager,
        temporaryAccess: [{
          id: 'user-mgmt-temp',
          userId: opsManager.id,
          escalationType: 'support' as const,
          grantedPermissions: ['manage_users', 'view_audit_logs'],
          grantedRegions: ['cebu'],
          requestedBy: regionalManager.id,
          requestedAt: new Date(),
          expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
          justification: 'Temporary user management for team expansion',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }]
      };

      // Step 6: Perform user management with temporary access
      const tempUserMgmtRequest: PolicyEvaluationRequest = {
        ...userMgmtRequest,
        user: {
          ...userMgmtRequest.user,
          permissions: rbacEngine.validateUserPermissions(opsManagerWithUserMgmt)
        }
      };

      const finalUserMgmtDecision = await rbacEngine.evaluatePolicy(tempUserMgmtRequest);
      expect(finalUserMgmtDecision.decision).toBe('allow');
      expect(finalUserMgmtDecision.obligations?.auditLevel).toBe('enhanced');

      console.log('✅ User Management Journey Completed');
    });
  });

  // =====================================================
  // Journey 5: Failed Journey - Insufficient Permissions
  // =====================================================

  describe('Journey 5: Failed Journey - Security Boundary Enforcement', () => {
    
    test('should properly deny unauthorized access attempts', async () => {
      // Step 1: Ground Ops user attempts high-privilege action
      const groundOpsUser = createTestUser('ground_ops', ['ncr-manila'], 'none', false);
      const session = simulateUserSession(groundOpsUser);

      // Step 2: Attempt to approve payout batch (executive/finance only)
      const payoutRequest: PolicyEvaluationRequest = {
        user: {
          id: groundOpsUser.id,
          roles: ['ground_ops'],
          permissions: rbacEngine.validateUserPermissions(groundOpsUser),
          allowedRegions: groundOpsUser.allowedRegions,
          piiScope: groundOpsUser.piiScope
        },
        resource: {
          type: 'payout_batch',
          regionId: 'ncr-manila',
          dataClass: 'restricted',
          containsPII: true
        },
        action: 'approve_payout_batch',
        context: {
          channel: 'ui',
          mfaPresent: session.mfaVerified,
          timestamp: new Date()
        }
      };

      // Should be denied
      const payoutDecision = await rbacEngine.evaluatePolicy(payoutRequest);
      expect(payoutDecision.decision).toBe('deny');
      expect(payoutDecision.reasons[0]).toContain('not permitted');

      // Step 3: Attempt approval request (should also fail - insufficient level)
      const payoutApprovalRequest: CreateApprovalRequestBody = {
        action: 'approve_payout_batch',
        justification: 'Weekly payout processing',
        requested_action: {
          action: 'approve_payout_batch',
          batch_id: 'BATCH-123',
          amount: 50000
        }
      };

      const payoutWorkflow = getWorkflowDefinition('approve_payout_batch');
      expect(payoutWorkflow).toBeDefined();

      // Ground ops cannot request this type of approval
      const canGroundOpsRequest = canUserApproveWorkflow(
        10, // ground_ops level
        'ground_ops',
        [] as Permission[],
        'approve_payout_batch'
      );
      expect(canGroundOpsRequest).toBe(false);

      // Step 4: Attempt cross-region access without justification
      const unauthorizedRegionRequest: PolicyEvaluationRequest = {
        user: {
          id: groundOpsUser.id,
          roles: ['ground_ops'],
          permissions: rbacEngine.validateUserPermissions(groundOpsUser),
          allowedRegions: groundOpsUser.allowedRegions, // Only NCR Manila
          piiScope: groundOpsUser.piiScope
        },
        resource: {
          type: 'operation',
          regionId: 'cebu', // Different region
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

      const crossRegionDecision = await rbacEngine.evaluatePolicy(unauthorizedRegionRequest);
      expect(crossRegionDecision.decision).toBe('deny');
      expect(crossRegionDecision.reasons[0]).toContain('region cebu');

      // Step 5: Attempt PII access with insufficient scope
      const unauthorizedPIIRequest: PolicyEvaluationRequest = {
        user: {
          id: groundOpsUser.id,
          roles: ['ground_ops'],
          permissions: rbacEngine.validateUserPermissions(groundOpsUser),
          allowedRegions: groundOpsUser.allowedRegions,
          piiScope: 'none' // No PII access
        },
        resource: {
          type: 'user_profile',
          regionId: 'ncr-manila',
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

      const piiDecision = await rbacEngine.evaluatePolicy(unauthorizedPIIRequest);
      expect(piiDecision.decision).toBe('deny');
      
      // All security boundaries properly enforced
      console.log('✅ Security Boundary Enforcement Verified');
    });
  });

  // =====================================================
  // Journey 6: Emergency Access Scenario
  // =====================================================

  describe('Journey 6: Emergency Access Scenario', () => {
    
    test('should handle emergency escalation workflow', async () => {
      // Step 1: Emergency scenario - risk investigator needs immediate cross-region access
      const riskInvestigator = createTestUser('risk_investigator', ['davao'], 'full', true);
      const session = simulateUserSession(riskInvestigator);

      // Step 2: Emergency case escalation
      const emergencyUser = {
        ...riskInvestigator,
        temporaryAccess: [{
          id: 'emergency-escalation',
          userId: riskInvestigator.id,
          caseId: 'EMERGENCY-2025-0831-001',
          escalationType: 'risk_investigator' as const,
          grantedPermissions: ['cross_region_override', 'unmask_pii_with_mfa', 'device_check'],
          grantedRegions: ['ncr-manila', 'cebu', 'davao'],
          piiScopeOverride: 'full' as PIIScope,
          requestedBy: 'system-auto',
          requestedAt: new Date(),
          expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2-hour emergency window
          justification: 'Emergency fraud investigation - immediate cross-region access required',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }]
      };

      // Step 3: Access any region during emergency
      const emergencyRequest: PolicyEvaluationRequest = {
        user: {
          id: emergencyUser.id,
          roles: ['risk_investigator'],
          permissions: rbacEngine.validateUserPermissions(emergencyUser),
          allowedRegions: rbacEngine.getEffectiveRegions(emergencyUser),
          piiScope: rbacEngine.getEffectivePIIScope(emergencyUser),
          escalation: {
            caseId: 'EMERGENCY-2025-0831-001',
            expiresAt: emergencyUser.temporaryAccess[0].expiresAt
          }
        },
        resource: {
          type: 'investigation',
          regionId: 'ncr-manila', // Different from user's base region
          dataClass: 'restricted',
          containsPII: true
        },
        action: 'unmask_pii_with_mfa',
        context: {
          channel: 'api',
          mfaPresent: true, // Emergency MFA bypass
          timestamp: new Date()
        }
      };

      const emergencyDecision = await rbacEngine.evaluatePolicy(emergencyRequest);
      expect(emergencyDecision.decision).toBe('allow');
      expect(emergencyDecision.obligations?.auditLevel).toBe('enhanced');
      expect(emergencyDecision.reasons[0]).toContain('Cross-region override granted');

      // Step 4: Verify audit trail
      expect(emergencyDecision.metadata.policyVersion).toBeDefined();
      expect(emergencyDecision.metadata.evaluationTime).toBeLessThan(1000);

      console.log('✅ Emergency Access Journey Completed');
    });
  });

  // =====================================================
  // Journey Performance and Scalability
  // =====================================================

  describe('Journey Performance Validation', () => {
    
    test('should complete user journeys within performance thresholds', async () => {
      const performanceTests = [
        {
          name: 'Simple RBAC Decision',
          target: 50, // 50ms
          test: async () => {
            const user = createTestUser('ops_manager', ['ncr-manila']);
            const request: PolicyEvaluationRequest = {
              user: {
                id: user.id,
                roles: ['ops_manager'],
                permissions: rbacEngine.validateUserPermissions(user),
                allowedRegions: user.allowedRegions,
                piiScope: user.piiScope
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
            await rbacEngine.evaluatePolicy(request);
          }
        },
        {
          name: 'Complex Multi-Rule Decision',
          target: 200, // 200ms
          test: async () => {
            const user = createTestUser('risk_investigator', [], 'full', true);
            const request: PolicyEvaluationRequest = {
              user: {
                id: user.id,
                roles: ['risk_investigator'],
                permissions: rbacEngine.validateUserPermissions(user),
                allowedRegions: user.allowedRegions,
                piiScope: user.piiScope
              },
              resource: {
                type: 'investigation',
                regionId: 'ncr-manila',
                dataClass: 'restricted',
                containsPII: true
              },
              action: 'unmask_pii_with_mfa',
              context: {
                channel: 'ui',
                mfaPresent: true,
                timestamp: new Date()
              }
            };
            await rbacEngine.evaluatePolicy(request);
          }
        },
        {
          name: 'MFA Challenge Creation',
          target: 300, // 300ms
          test: async () => {
            await mfaService.createChallenge('perf-test-user', 'sms', {
              action: 'unmask_pii_with_mfa',
              permission: 'unmask_pii_with_mfa'
            });
          }
        }
      ];

      for (const { name, target, test } of performanceTests) {
        const startTime = performance.now();
        await test();
        const executionTime = performance.now() - startTime;
        
        expect(executionTime).toBeLessThan(target);
        console.log(`${name}: ${executionTime.toFixed(2)}ms (target: ${target}ms)`);
      }
    });

    test('should handle concurrent user journeys', async () => {
      const concurrentUsers = Array.from({ length: 10 }, (_, i) => 
        createTestUser('ops_manager', ['test-region'], 'masked')
      );

      const startTime = performance.now();
      
      const concurrentRequests = concurrentUsers.map(async user => {
        const request: PolicyEvaluationRequest = {
          user: {
            id: user.id,
            roles: ['ops_manager'],
            permissions: rbacEngine.validateUserPermissions(user),
            allowedRegions: user.allowedRegions,
            piiScope: user.piiScope
          },
          resource: {
            type: 'operation',
            regionId: 'test-region',
            dataClass: 'internal',
            containsPII: false
          },
          action: 'manage_queue',
          context: {
            channel: 'ui',
            mfaPresent: false,
            timestamp: new Date()
          }
        };
        return rbacEngine.evaluatePolicy(request);
      });

      const results = await Promise.all(concurrentRequests);
      const executionTime = performance.now() - startTime;
      
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result.decision).toBe('allow');
      });
      
      expect(executionTime).toBeLessThan(1000); // Should handle 10 concurrent requests in under 1 second
      console.log(`Concurrent requests performance: ${executionTime.toFixed(2)}ms for 10 users`);
    });
  });

  // =====================================================
  // Journey Error Handling and Edge Cases
  // =====================================================

  describe('Journey Error Handling', () => {
    
    test('should gracefully handle malformed requests', async () => {
      const malformedRequests = [
        {
          name: 'Missing user context',
          request: {
            resource: {
              type: 'test',
              dataClass: 'internal' as DataClass,
              containsPII: false
            },
            action: 'test_action',
            context: {
              channel: 'ui' as const,
              mfaPresent: false,
              timestamp: new Date()
            }
          } as any
        },
        {
          name: 'Invalid region ID',
          request: {
            user: {
              id: 'test-user',
              roles: ['ops_manager'],
              permissions: [],
              allowedRegions: ['valid-region'],
              piiScope: 'none' as PIIScope
            },
            resource: {
              type: 'test',
              regionId: null,
              dataClass: 'internal' as DataClass,
              containsPII: false
            },
            action: 'test_action',
            context: {
              channel: 'ui' as const,
              mfaPresent: false,
              timestamp: new Date()
            }
          } as any
        }
      ];

      for (const { name, request } of malformedRequests) {
        try {
          const result = await rbacEngine.evaluatePolicy(request);
          expect(result.decision).toBe('deny'); // Should deny malformed requests
          console.log(`${name}: Handled gracefully`);
        } catch (error) {
          // Should not throw unhandled errors
          expect(error).toBeDefined();
          console.log(`${name}: Caught error (${error})`);
        }
      }
    });

    test('should handle expired temporary access gracefully', async () => {
      const userWithExpiredAccess = createTestUser('support', ['ncr-manila'], 'none');
      userWithExpiredAccess.temporaryAccess = [{
        id: 'expired-access',
        userId: userWithExpiredAccess.id,
        escalationType: 'support',
        grantedPermissions: ['unmask_pii_with_mfa'],
        grantedRegions: ['ncr-manila'],
        requestedBy: 'manager-id',
        requestedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        expiresAt: new Date(Date.now() - 60 * 60 * 1000), // Expired 1 hour ago
        justification: 'Expired temporary access',
        isActive: true, // Still marked active but expired
        createdAt: new Date(),
        updatedAt: new Date()
      }];

      const permissions = rbacEngine.validateUserPermissions(userWithExpiredAccess);
      expect(permissions).not.toContain('unmask_pii_with_mfa');

      const effectiveRegions = rbacEngine.getEffectiveRegions(userWithExpiredAccess);
      expect(effectiveRegions).toEqual(['ncr-manila']); // Should fall back to base regions

      console.log('✅ Expired Access Handling Verified');
    });
  });
});