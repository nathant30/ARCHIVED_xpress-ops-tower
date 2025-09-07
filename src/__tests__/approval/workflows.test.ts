// Approval Workflow System Tests
// Comprehensive testing of Backend Developer's approval system integration
// Tests multi-level approvals, workflow logic, and RBAC integration

import {
  WORKFLOW_DEFINITIONS,
  getWorkflowDefinition,
  getAllWorkflowDefinitions,
  canUserApproveWorkflow,
  getUserApprovableWorkflows,
  validateApprovalRequest,
  generateApprovalRequestTemplate,
  getEstimatedApprovalTime,
  getWorkflowRiskAssessment,
  getWorkflowNotificationSettings
} from '@/lib/approval-workflows';

import type {
  WorkflowDefinition,
  ApprovalRequest,
  ApprovalResponse,
  TemporaryAccessToken,
  CreateApprovalRequestBody,
  ApprovalDecisionBody
} from '@/types/approval';

import type { Permission } from '@/hooks/useRBAC';

describe('Approval Workflow System', () => {

  // =====================================================
  // Workflow Definition Validation
  // =====================================================

  describe('Workflow Definitions', () => {
    
    test('should have all required workflow definitions', () => {
      const requiredWorkflows = [
        'configure_alerts',
        'unmask_pii_with_mfa',
        'cross_region_override',
        'approve_payout_batch',
        'manage_users',
        'assign_roles',
        'revoke_access',
        'manage_api_keys',
        'export_audit_data',
        'access_raw_location_data',
        'configure_prelaunch_pricing_flagged',
        'promote_region_stage'
      ];

      requiredWorkflows.forEach(workflowAction => {
        expect(WORKFLOW_DEFINITIONS).toHaveProperty(workflowAction);
        const workflow = WORKFLOW_DEFINITIONS[workflowAction];
        expect(workflow).toBeDefined();
      });

      expect(Object.keys(WORKFLOW_DEFINITIONS)).toHaveLength(12);
    });

    test('should validate workflow definition structure', () => {
      Object.entries(WORKFLOW_DEFINITIONS).forEach(([action, workflow]) => {
        expect(workflow.action).toBe(action);
        expect(workflow.display_name).toBeTruthy();
        expect(workflow.description).toBeTruthy();
        expect(Array.isArray(workflow.required_roles)).toBe(true);
        expect(Array.isArray(workflow.required_permissions)).toBe(true);
        expect(Array.isArray(workflow.auto_grant_permissions)).toBe(true);
        expect(typeof workflow.required_level).toBe('number');
        expect(typeof workflow.default_ttl_seconds).toBe('number');
        expect(typeof workflow.max_ttl_seconds).toBe('number');
        expect(['low', 'medium', 'high', 'critical']).toContain(workflow.sensitivity_level);
        expect(typeof workflow.dual_approval_required).toBe('boolean');
        expect(typeof workflow.mfa_required_for_approval).toBe('boolean');
        
        // TTL validation
        expect(workflow.default_ttl_seconds).toBeGreaterThan(0);
        expect(workflow.max_ttl_seconds).toBeGreaterThanOrEqual(workflow.default_ttl_seconds);
        expect(workflow.required_level).toBeGreaterThan(0);
      });
    });

    test('should validate workflow sensitivity levels are appropriate', () => {
      const criticalWorkflows = ['unmask_pii_with_mfa', 'approve_payout_batch', 'access_raw_location_data'];
      const highSensitivityWorkflows = ['cross_region_override', 'assign_roles', 'export_audit_data', 'promote_region_stage'];
      const mediumSensitivityWorkflows = ['manage_users', 'configure_prelaunch_pricing_flagged'];
      const lowSensitivityWorkflows = ['configure_alerts'];

      criticalWorkflows.forEach(action => {
        expect(WORKFLOW_DEFINITIONS[action].sensitivity_level).toBe('critical');
      });

      highSensitivityWorkflows.forEach(action => {
        expect(WORKFLOW_DEFINITIONS[action].sensitivity_level).toBe('high');
      });

      mediumSensitivityWorkflows.forEach(action => {
        expect(WORKFLOW_DEFINITIONS[action].sensitivity_level).toBe('medium');
      });

      lowSensitivityWorkflows.forEach(action => {
        expect(WORKFLOW_DEFINITIONS[action].sensitivity_level).toBe('low');
      });
    });

    test('should validate dual approval requirements for critical workflows', () => {
      const dualApprovalRequired = ['unmask_pii_with_mfa', 'approve_payout_batch', 'access_raw_location_data'];
      const singleApprovalOK = ['configure_alerts', 'manage_users', 'cross_region_override'];

      dualApprovalRequired.forEach(action => {
        expect(WORKFLOW_DEFINITIONS[action].dual_approval_required).toBe(true);
      });

      singleApprovalOK.forEach(action => {
        expect(WORKFLOW_DEFINITIONS[action].dual_approval_required).toBe(false);
      });
    });

    test('should validate MFA requirements align with sensitivity', () => {
      // Critical and high sensitivity workflows should require MFA for approval
      Object.entries(WORKFLOW_DEFINITIONS).forEach(([action, workflow]) => {
        if (workflow.sensitivity_level === 'critical' || workflow.sensitivity_level === 'high') {
          if (action !== 'manage_users' && action !== 'configure_prelaunch_pricing_flagged') {
            expect(workflow.mfa_required_for_approval).toBe(true);
          }
        }
      });
    });
  });

  // =====================================================
  // Workflow Authorization Logic
  // =====================================================

  describe('Workflow Authorization', () => {
    
    test('canUserApproveWorkflow should validate user eligibility', () => {
      const testCases = [
        {
          userLevel: 60,
          userRole: 'executive',
          userPermissions: ['approve_requests'] as Permission[],
          workflow: 'unmask_pii_with_mfa',
          expected: true
        },
        {
          userLevel: 30,
          userRole: 'ops_manager',
          userPermissions: ['approve_requests'] as Permission[],
          workflow: 'unmask_pii_with_mfa',
          expected: false // Insufficient level
        },
        {
          userLevel: 40,
          userRole: 'regional_manager',
          userPermissions: ['approve_requests'] as Permission[],
          workflow: 'manage_users',
          expected: true
        },
        {
          userLevel: 25,
          userRole: 'support',
          userPermissions: [] as Permission[],
          workflow: 'configure_alerts',
          expected: false // Insufficient permissions
        },
        {
          userLevel: 80,
          userRole: 'iam_admin',
          userPermissions: ['approve_requests'] as Permission[],
          workflow: 'assign_roles',
          expected: false // Wrong role (should be executive/regional_manager)
        }
      ];

      testCases.forEach(({ userLevel, userRole, userPermissions, workflow, expected }) => {
        const result = canUserApproveWorkflow(userLevel, userRole, userPermissions, workflow);
        expect(result).toBe(expected);
      });
    });

    test('getUserApprovableWorkflows should return correct workflows', () => {
      const executiveUser = {
        userLevel: 60,
        userRole: 'executive',
        userPermissions: ['approve_requests'] as Permission[]
      };

      const approvableWorkflows = getUserApprovableWorkflows(
        executiveUser.userLevel,
        executiveUser.userRole,
        executiveUser.userPermissions
      );

      // Executive should be able to approve most workflows
      const expectedWorkflows = [
        'unmask_pii_with_mfa',
        'cross_region_override',
        'manage_api_keys',
        'export_audit_data',
        'access_raw_location_data',
        'promote_region_stage',
        'configure_prelaunch_pricing_flagged'
      ];

      expectedWorkflows.forEach(workflow => {
        expect(approvableWorkflows.some(w => w.action === workflow)).toBe(true);
      });
    });

    test('should handle edge cases in workflow authorization', () => {
      // User with no permissions
      expect(canUserApproveWorkflow(100, 'executive', [], 'configure_alerts')).toBe(false);
      
      // Invalid workflow
      expect(canUserApproveWorkflow(100, 'executive', ['approve_requests'] as Permission[], 'invalid_workflow')).toBe(false);
      
      // User with wildcard permissions
      expect(canUserApproveWorkflow(60, 'executive', ['*'] as Permission[], 'unmask_pii_with_mfa')).toBe(true);
    });
  });

  // =====================================================
  // Approval Request Validation
  // =====================================================

  describe('Approval Request Validation', () => {
    
    test('validateApprovalRequest should validate request structure', () => {
      const validRequest: CreateApprovalRequestBody = {
        action: 'configure_alerts',
        justification: 'Need to adjust alert thresholds for high traffic period',
        requested_action: {
          action: 'configure_alerts',
          region: 'ncr-manila',
          alert_types: ['high_demand', 'driver_shortage']
        },
        ttl_hours: 2
      };

      const workflow = getWorkflowDefinition('configure_alerts')!;
      const result = validateApprovalRequest(validRequest, workflow);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should validate TTL constraints', () => {
      const invalidTTLRequest: CreateApprovalRequestBody = {
        action: 'configure_alerts',
        justification: 'Valid justification here',
        requested_action: { action: 'configure_alerts' },
        ttl_hours: 10 // Exceeds max_ttl_seconds (7200 = 2 hours)
      };

      const workflow = getWorkflowDefinition('configure_alerts')!;
      const result = validateApprovalRequest(invalidTTLRequest, workflow);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(expect.stringContaining('TTL cannot exceed'));
    });

    test('should validate justification requirements', () => {
      const invalidJustificationCases = [
        { justification: '', expectedError: 'at least 10 characters' },
        { justification: 'short', expectedError: 'at least 10 characters' },
        { justification: 'a'.repeat(1001), expectedError: 'cannot exceed 1000 characters' }
      ];

      const workflow = getWorkflowDefinition('configure_alerts')!;

      invalidJustificationCases.forEach(({ justification, expectedError }) => {
        const request: CreateApprovalRequestBody = {
          action: 'configure_alerts',
          justification,
          requested_action: { action: 'configure_alerts' }
        };

        const result = validateApprovalRequest(request, workflow);
        expect(result.valid).toBe(false);
        expect(result.errors.some(error => error.includes(expectedError))).toBe(true);
      });
    });

    test('should validate workflow-specific request fields', () => {
      // PII unmasking workflow validation
      const piiRequest: CreateApprovalRequestBody = {
        action: 'unmask_pii_with_mfa',
        justification: 'Investigation of fraud case CASE-2025-001 requires PII access',
        requested_action: {
          action: 'unmask_pii_with_mfa',
          user_ids: ['user-123', 'user-456'],
          investigation_case: 'CASE-2025-001'
        }
      };

      const piiWorkflow = getWorkflowDefinition('unmask_pii_with_mfa')!;
      const piiResult = validateApprovalRequest(piiRequest, piiWorkflow);
      expect(piiResult.valid).toBe(true);

      // Invalid PII request (missing required fields)
      const invalidPiiRequest: CreateApprovalRequestBody = {
        action: 'unmask_pii_with_mfa',
        justification: 'Need PII access',
        requested_action: {
          action: 'unmask_pii_with_mfa'
          // Missing user_ids and investigation_case
        }
      };

      const invalidPiiResult = validateApprovalRequest(invalidPiiRequest, piiWorkflow);
      expect(invalidPiiResult.valid).toBe(false);
      expect(invalidPiiResult.errors).toContain('user_ids array is required for PII unmasking requests');
      expect(invalidPiiResult.errors).toContain('investigation_case is required for PII unmasking requests');

      // Payout batch approval validation
      const payoutRequest: CreateApprovalRequestBody = {
        action: 'approve_payout_batch',
        justification: 'Weekly driver payout batch for Manila region',
        requested_action: {
          action: 'approve_payout_batch',
          batch_id: 'BATCH-2025-08-001',
          amount: 150000,
          region: 'ncr-manila'
        }
      };

      const payoutWorkflow = getWorkflowDefinition('approve_payout_batch')!;
      const payoutResult = validateApprovalRequest(payoutRequest, payoutWorkflow);
      expect(payoutResult.valid).toBe(true);
    });
  });

  // =====================================================
  // Workflow Template Generation
  // =====================================================

  describe('Request Template Generation', () => {
    
    test('generateApprovalRequestTemplate should create valid templates', () => {
      const workflowActions = Object.keys(WORKFLOW_DEFINITIONS);
      
      workflowActions.forEach(action => {
        const template = generateApprovalRequestTemplate(action);
        expect(template).toBeDefined();
        expect(template!.action).toBe(action);
        expect(template!.justification).toBeTruthy();
        expect(template!.requested_action).toBeDefined();
        expect(template!.requested_action.action).toBe(action);
      });
    });

    test('should generate workflow-specific templates', () => {
      // Test PII unmasking template
      const piiTemplate = generateApprovalRequestTemplate('unmask_pii_with_mfa');
      expect(piiTemplate!.requested_action.user_ids).toBeDefined();
      expect(piiTemplate!.requested_action.investigation_case).toBeDefined();
      
      // Test cross-region override template
      const crossRegionTemplate = generateApprovalRequestTemplate('cross_region_override');
      expect(crossRegionTemplate!.requested_action.source_region).toBeDefined();
      expect(crossRegionTemplate!.requested_action.target_region).toBeDefined();
      
      // Test payout batch template
      const payoutTemplate = generateApprovalRequestTemplate('approve_payout_batch');
      expect(payoutTemplate!.requested_action.batch_id).toBeDefined();
      expect(payoutTemplate!.requested_action.amount).toBeDefined();
    });

    test('should handle invalid workflow actions', () => {
      const template = generateApprovalRequestTemplate('invalid_action');
      expect(template).toBeNull();
    });
  });

  // =====================================================
  // Multi-Level Approval Logic
  // =====================================================

  describe('Multi-Level Approval Logic', () => {
    
    test('should correctly identify dual approval requirements', () => {
      const dualApprovalWorkflows = Object.entries(WORKFLOW_DEFINITIONS)
        .filter(([_, workflow]) => workflow.dual_approval_required)
        .map(([action]) => action);

      expect(dualApprovalWorkflows).toContain('unmask_pii_with_mfa');
      expect(dualApprovalWorkflows).toContain('approve_payout_batch');
      expect(dualApprovalWorkflows).toContain('access_raw_location_data');
    });

    test('should calculate correct estimated approval times', () => {
      const testCases = [
        { action: 'unmask_pii_with_mfa', expectedRange: '8-12 hours' }, // Critical + dual approval
        { action: 'cross_region_override', expectedRange: '2-4 hours' }, // High + single approval
        { action: 'manage_users', expectedRange: '1-3 hours' }, // Medium + single approval
        { action: 'configure_alerts', expectedRange: '1-2 hours' } // Low + single approval
      ];

      testCases.forEach(({ action, expectedRange }) => {
        const workflow = getWorkflowDefinition(action)!;
        const estimatedTime = getEstimatedApprovalTime(workflow);
        expect(estimatedTime).toBe(expectedRange);
      });
    });

    test('should validate approval role requirements', () => {
      // Critical workflows should require executive or risk_investigator approval
      const criticalWorkflows = ['unmask_pii_with_mfa', 'approve_payout_batch', 'access_raw_location_data'];
      
      criticalWorkflows.forEach(action => {
        const workflow = getWorkflowDefinition(action)!;
        const hasHighLevelRoles = workflow.required_roles.some(role => 
          ['executive', 'risk_investigator'].includes(role)
        );
        expect(hasHighLevelRoles).toBe(true);
      });
    });
  });

  // =====================================================
  // Risk Assessment and Security
  // =====================================================

  describe('Risk Assessment', () => {
    
    test('getWorkflowRiskAssessment should provide comprehensive risk analysis', () => {
      const highRiskWorkflows = ['unmask_pii_with_mfa', 'approve_payout_batch', 'access_raw_location_data'];
      
      highRiskWorkflows.forEach(action => {
        const riskAssessment = getWorkflowRiskAssessment(action);
        
        expect(riskAssessment.risk_level).toBe('critical');
        expect(Array.isArray(riskAssessment.risk_factors)).toBe(true);
        expect(riskAssessment.risk_factors.length).toBeGreaterThan(0);
        expect(Array.isArray(riskAssessment.mitigation_measures)).toBe(true);
        expect(riskAssessment.mitigation_measures.length).toBeGreaterThan(0);
        
        // Critical workflows should have specific mitigation measures
        if (action === 'unmask_pii_with_mfa') {
          expect(riskAssessment.mitigation_measures).toContain('Dual approval required');
          expect(riskAssessment.mitigation_measures).toContain('MFA verification mandatory');
        }
      });
    });

    test('should handle unknown workflows gracefully', () => {
      const riskAssessment = getWorkflowRiskAssessment('unknown_workflow');
      
      expect(riskAssessment.risk_level).toBe('medium');
      expect(riskAssessment.risk_factors).toContain('Unknown workflow');
      expect(riskAssessment.mitigation_measures).toContain('Verify workflow definition');
    });
  });

  // =====================================================
  // Notification Configuration
  // =====================================================

  describe('Notification Settings', () => {
    
    test('getWorkflowNotificationSettings should provide appropriate notification config', () => {
      const criticalWorkflow = 'unmask_pii_with_mfa';
      const criticalSettings = getWorkflowNotificationSettings(criticalWorkflow);
      
      expect(criticalSettings.notify_on_request).toBe(true);
      expect(criticalSettings.notify_on_approval).toBe(true);
      expect(criticalSettings.notify_on_rejection).toBe(true);
      expect(criticalSettings.escalation_hours).toBe(2); // Fast escalation for critical
      expect(criticalSettings.notification_channels).toContain('email');
      expect(criticalSettings.notification_channels).toContain('sms');
      expect(criticalSettings.notification_channels).toContain('slack');
      
      const lowSensitivityWorkflow = 'configure_alerts';
      const lowSettings = getWorkflowNotificationSettings(lowSensitivityWorkflow);
      
      expect(lowSettings.escalation_hours).toBe(8); // Slower escalation for low sensitivity
      expect(lowSettings.notification_channels).toEqual(['email']); // Email only
      expect(lowSettings.notify_on_rejection).toBe(false); // No rejection notifications for low sensitivity
    });

    test('should handle unknown workflows with default settings', () => {
      const defaultSettings = getWorkflowNotificationSettings('unknown_workflow');
      
      expect(defaultSettings.notify_on_request).toBe(true);
      expect(defaultSettings.notify_on_approval).toBe(true);
      expect(defaultSettings.notify_on_rejection).toBe(true);
      expect(defaultSettings.escalation_hours).toBe(4);
      expect(defaultSettings.notification_channels).toEqual(['email']);
    });
  });

  // =====================================================
  // Workflow Integration Tests
  // =====================================================

  describe('RBAC Integration', () => {
    
    test('should validate approval triggers integrate with sensitivity levels', () => {
      // High sensitivity actions should require approval
      const highSensitivityActions = ['unmask_pii_with_mfa', 'approve_payout_batch', 'manage_users'];
      
      highSensitivityActions.forEach(action => {
        const workflow = getWorkflowDefinition(action);
        expect(workflow).toBeDefined();
        expect(['high', 'critical'].includes(workflow!.sensitivity_level)).toBe(true);
      });
    });

    test('should validate temporary access token generation parameters', () => {
      Object.entries(WORKFLOW_DEFINITIONS).forEach(([action, workflow]) => {
        // Auto-grant permissions should be meaningful
        expect(workflow.auto_grant_permissions.length).toBeGreaterThan(0);
        expect(workflow.auto_grant_permissions).toContain(action as Permission);
        
        // TTL should be reasonable for the action type
        if (workflow.sensitivity_level === 'critical') {
          expect(workflow.default_ttl_seconds).toBeLessThanOrEqual(1800); // Max 30 minutes for critical
        }
        
        if (workflow.action === 'access_raw_location_data') {
          expect(workflow.default_ttl_seconds).toBe(600); // 10 minutes for location data
        }
      });
    });
  });

  // =====================================================
  // Edge Cases and Error Handling
  // =====================================================

  describe('Edge Cases and Error Handling', () => {
    
    test('should handle malformed approval requests', () => {
      const malformedRequests = [
        {
          action: 'configure_alerts',
          justification: 'Valid justification',
          requested_action: null
        },
        {
          action: 'configure_alerts',
          justification: 'Valid justification',
          requested_action: 'string instead of object'
        },
        {
          action: 'configure_alerts',
          justification: 'Valid justification',
          requested_action: {}
        }
      ];

      const workflow = getWorkflowDefinition('configure_alerts')!;
      
      malformedRequests.forEach(request => {
        const result = validateApprovalRequest(request as any, workflow);
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    test('should validate boundary conditions', () => {
      // Test minimum TTL
      const minTTLRequest: CreateApprovalRequestBody = {
        action: 'configure_alerts',
        justification: 'Valid justification for testing',
        requested_action: { action: 'configure_alerts' },
        ttl_hours: 0.01 // Very small TTL
      };

      const workflow = getWorkflowDefinition('configure_alerts')!;
      const result = validateApprovalRequest(minTTLRequest, workflow);
      expect(result.valid).toBe(true); // Should allow small positive TTL

      // Test exact max TTL
      const maxTTLRequest: CreateApprovalRequestBody = {
        action: 'configure_alerts',
        justification: 'Valid justification for testing',
        requested_action: { action: 'configure_alerts' },
        ttl_hours: workflow.max_ttl_seconds / 3600 // Exact maximum
      };

      const maxResult = validateApprovalRequest(maxTTLRequest, workflow);
      expect(maxResult.valid).toBe(true);
    });

    test('should handle concurrent approval scenarios', () => {
      // This would test database-level constraints and concurrent approval handling
      // In a real implementation, this would test:
      // - Multiple approvers trying to approve the same request
      // - Request expiration during approval process
      // - Role changes during approval workflow
      
      // For now, we validate the workflow definitions support concurrent approvals
      const dualApprovalWorkflows = Object.entries(WORKFLOW_DEFINITIONS)
        .filter(([_, workflow]) => workflow.dual_approval_required);
      
      expect(dualApprovalWorkflows.length).toBeGreaterThan(0);
      
      dualApprovalWorkflows.forEach(([action, workflow]) => {
        expect(workflow.required_roles.length).toBeGreaterThan(0);
        console.log(`Dual approval workflow ${action} can be approved by: ${workflow.required_roles.join(', ')}`);
      });
    });
  });

  // =====================================================
  // Performance Tests
  // =====================================================

  describe('Performance Validation', () => {
    
    test('workflow lookup operations should be performant', () => {
      const startTime = performance.now();
      
      // Perform many workflow operations
      for (let i = 0; i < 1000; i++) {
        Object.keys(WORKFLOW_DEFINITIONS).forEach(action => {
          getWorkflowDefinition(action);
          getWorkflowRiskAssessment(action);
          getWorkflowNotificationSettings(action);
        });
      }
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      // Should complete within 200ms
      expect(executionTime).toBeLessThan(200);
      console.log(`Workflow operations performance: ${executionTime.toFixed(2)}ms for ${1000 * Object.keys(WORKFLOW_DEFINITIONS).length * 3} operations`);
    });

    test('approval validation should be efficient', () => {
      const testRequests = Array.from({ length: 100 }, (_, i) => ({
        action: 'configure_alerts',
        justification: `Test justification number ${i}`,
        requested_action: { action: 'configure_alerts', test_id: i }
      }));

      const workflow = getWorkflowDefinition('configure_alerts')!;
      const startTime = performance.now();
      
      testRequests.forEach(request => {
        validateApprovalRequest(request, workflow);
      });
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      // Should complete within 100ms for 100 validations
      expect(executionTime).toBeLessThan(100);
      console.log(`Approval validation performance: ${executionTime.toFixed(2)}ms for 100 validations`);
    });
  });
});