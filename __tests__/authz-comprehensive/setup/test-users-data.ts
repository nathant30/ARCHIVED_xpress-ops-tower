// Test Users Data for RBAC+ABAC Validation
// Comprehensive test scenarios covering all roles and permission combinations

import { EnhancedUser, XpressRole, PIIScope, TemporaryAccess } from '@/types/rbac-abac';

export interface TestUser extends EnhancedUser {
  testScenario: string;
  expectedPermissions: string[];
  testPassword: string;
}

export const TEST_REGIONS = {
  NCR_MANILA: 'reg-ncr-manila-001',
  CEBU: 'reg-cebu-002',
  DAVAO: 'reg-davao-003',
  GLOBAL: '*'
};

export const TEST_CASES = {
  SUPPORT_MANILA_001: 'CASE-SUPPORT-MNL-001',
  FRAUD_CEBU_002: 'CASE-FRAUD-CEB-002',
  RISK_DAVAO_003: 'CASE-RISK-DAV-003',
  INVALID_CASE: 'INVALID-CASE-999'
};

// Test user definitions covering all 13 Xpress roles
export const TEST_USERS: TestUser[] = [
  // Ground Operations (Level 10)
  {
    id: 'usr-ground-ops-001',
    email: 'ground.ops.manila@xpress.test',
    firstName: 'Maria',
    lastName: 'Santos',
    testPassword: 'GroundOps123!',
    testScenario: 'Basic ground operations in Manila',
    roles: [{
      id: 'role-ground-ops',
      role: {
        id: 'role-ground-ops',
        name: 'ground_ops',
        displayName: 'Ground Operations',
        level: 10,
        permissions: ['assign_driver', 'contact_driver_masked', 'cancel_trip_ops', 'view_live_map', 'manage_queue', 'view_metrics_region']
      },
      assignedAt: new Date('2025-01-01'),
      isActive: true,
      allowedRegions: [TEST_REGIONS.NCR_MANILA]
    }],
    permissions: ['assign_driver', 'contact_driver_masked', 'cancel_trip_ops', 'view_live_map', 'manage_queue', 'view_metrics_region'],
    expectedPermissions: ['assign_driver', 'contact_driver_masked', 'cancel_trip_ops', 'view_live_map', 'manage_queue', 'view_metrics_region'],
    allowedRegions: [TEST_REGIONS.NCR_MANILA],
    piiScope: 'none',
    mfaEnabled: false,
    status: 'active',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  },

  // Operations Monitor (Level 20)
  {
    id: 'usr-ops-monitor-001',
    email: 'ops.monitor.cebu@xpress.test',
    firstName: 'Juan',
    lastName: 'Cruz',
    testPassword: 'OpsMonitor123!',
    testScenario: 'View-only operations monitoring in Cebu',
    roles: [{
      id: 'role-ops-monitor',
      role: {
        id: 'role-ops-monitor',
        name: 'ops_monitor',
        displayName: 'Operations Monitor',
        level: 20,
        permissions: ['view_live_map', 'view_metrics_region']
      },
      assignedAt: new Date('2025-01-01'),
      isActive: true,
      allowedRegions: [TEST_REGIONS.CEBU]
    }],
    permissions: ['view_live_map', 'view_metrics_region'],
    expectedPermissions: ['view_live_map', 'view_metrics_region'],
    allowedRegions: [TEST_REGIONS.CEBU],
    piiScope: 'none',
    mfaEnabled: false,
    status: 'active',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  },

  // Operations Manager (Level 30)
  {
    id: 'usr-ops-manager-001',
    email: 'ops.manager.davao@xpress.test',
    firstName: 'Ana',
    lastName: 'Reyes',
    testPassword: 'OpsManager123!',
    testScenario: 'Full operations management in Davao',
    roles: [{
      id: 'role-ops-manager',
      role: {
        id: 'role-ops-manager',
        name: 'ops_manager',
        displayName: 'Operations Manager',
        level: 30,
        permissions: ['assign_driver', 'contact_driver_masked', 'cancel_trip_ops', 'view_live_map', 'manage_queue', 'view_metrics_region', 'manage_shift', 'throttle_promos_region', 'view_driver_files_masked']
      },
      assignedAt: new Date('2025-01-01'),
      isActive: true,
      allowedRegions: [TEST_REGIONS.DAVAO]
    }],
    permissions: ['assign_driver', 'contact_driver_masked', 'cancel_trip_ops', 'view_live_map', 'manage_queue', 'view_metrics_region', 'manage_shift', 'throttle_promos_region', 'view_driver_files_masked'],
    expectedPermissions: ['assign_driver', 'contact_driver_masked', 'cancel_trip_ops', 'view_live_map', 'manage_queue', 'view_metrics_region', 'manage_shift', 'throttle_promos_region', 'view_driver_files_masked'],
    allowedRegions: [TEST_REGIONS.DAVAO],
    piiScope: 'masked',
    mfaEnabled: false,
    status: 'active',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  },

  // Regional Manager (Level 40) - Can approve temporary access
  {
    id: 'usr-regional-manager-001',
    email: 'regional.manager.manila@xpress.test',
    firstName: 'Roberto',
    lastName: 'Dela Cruz',
    testPassword: 'RegionalMgr123!',
    testScenario: 'Regional oversight with temporary access approval',
    roles: [{
      id: 'role-regional-manager',
      role: {
        id: 'role-regional-manager',
        name: 'regional_manager',
        displayName: 'Regional Manager',
        level: 40,
        permissions: ['assign_driver', 'contact_driver_masked', 'cancel_trip_ops', 'view_live_map', 'manage_queue', 'view_metrics_region', 'manage_shift', 'throttle_promos_region', 'view_driver_files_masked', 'approve_temp_access_region']
      },
      assignedAt: new Date('2025-01-01'),
      isActive: true,
      allowedRegions: [TEST_REGIONS.NCR_MANILA]
    }],
    permissions: ['assign_driver', 'contact_driver_masked', 'cancel_trip_ops', 'view_live_map', 'manage_queue', 'view_metrics_region', 'manage_shift', 'throttle_promos_region', 'view_driver_files_masked', 'approve_temp_access_region'],
    expectedPermissions: ['assign_driver', 'contact_driver_masked', 'cancel_trip_ops', 'view_live_map', 'manage_queue', 'view_metrics_region', 'manage_shift', 'throttle_promos_region', 'view_driver_files_masked', 'approve_temp_access_region'],
    allowedRegions: [TEST_REGIONS.NCR_MANILA],
    piiScope: 'masked',
    mfaEnabled: true,
    status: 'active',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  },

  // Support (Level 25) - Cross-region capable with escalation
  {
    id: 'usr-support-001',
    email: 'support.crossregion@xpress.test',
    firstName: 'Sofia',
    lastName: 'Garcia',
    testPassword: 'Support123!',
    testScenario: 'Customer support with cross-region escalation capability',
    roles: [{
      id: 'role-support',
      role: {
        id: 'role-support',
        name: 'support',
        displayName: 'Customer Support',
        level: 25,
        permissions: ['case_open', 'case_close', 'trip_replay_masked', 'initiate_refund_request', 'escalate_to_risk', 'view_ticket_history', 'view_masked_profiles']
      },
      assignedAt: new Date('2025-01-01'),
      isActive: true,
      allowedRegions: [TEST_REGIONS.CEBU]
    }],
    permissions: ['case_open', 'case_close', 'trip_replay_masked', 'initiate_refund_request', 'escalate_to_risk', 'view_ticket_history', 'view_masked_profiles'],
    expectedPermissions: ['case_open', 'case_close', 'trip_replay_masked', 'initiate_refund_request', 'escalate_to_risk', 'view_ticket_history', 'view_masked_profiles'],
    allowedRegions: [TEST_REGIONS.CEBU],
    piiScope: 'masked',
    domain: 'compliance',
    mfaEnabled: true,
    status: 'active',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    // Temporary access for cross-region case
    temporaryAccess: [{
      id: 'temp-access-001',
      grantedPermissions: ['case_open', 'view_masked_profiles'],
      grantedRegions: [TEST_REGIONS.NCR_MANILA],
      piiScopeOverride: 'masked',
      caseId: TEST_CASES.SUPPORT_MANILA_001,
      escalationType: 'support',
      justification: 'Customer complaint investigation cross-region',
      expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours
      isActive: true,
      requestedBy: 'usr-support-001',
      approvedBy: 'usr-regional-manager-001',
      createdAt: new Date(),
      updatedAt: new Date()
    }]
  },

  // Risk Investigator (Level 35) - PII unmasking with MFA
  {
    id: 'usr-risk-investigator-001',
    email: 'risk.investigator@xpress.test',
    firstName: 'Miguel',
    lastName: 'Torres',
    testPassword: 'RiskInvestigator123!',
    testScenario: 'Fraud investigation with PII unmasking capability',
    roles: [{
      id: 'role-risk-investigator',
      role: {
        id: 'role-risk-investigator',
        name: 'risk_investigator',
        displayName: 'Risk Investigator',
        level: 35,
        permissions: ['case_open', 'case_close', 'trip_replay_unmasked', 'view_evidence', 'unmask_pii_with_mfa', 'device_check', 'apply_account_hold', 'close_investigation']
      },
      assignedAt: new Date('2025-01-01'),
      isActive: true,
      allowedRegions: [TEST_REGIONS.CEBU, TEST_REGIONS.DAVAO]
    }],
    permissions: ['case_open', 'case_close', 'trip_replay_unmasked', 'view_evidence', 'unmask_pii_with_mfa', 'device_check', 'apply_account_hold', 'close_investigation'],
    expectedPermissions: ['case_open', 'case_close', 'trip_replay_unmasked', 'view_evidence', 'unmask_pii_with_mfa', 'device_check', 'apply_account_hold', 'close_investigation'],
    allowedRegions: [TEST_REGIONS.CEBU, TEST_REGIONS.DAVAO],
    piiScope: 'full',
    domain: 'fraud',
    mfaEnabled: true,
    status: 'active',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  },

  // IAM Admin (Level 80) - User management
  {
    id: 'usr-iam-admin-001',
    email: 'iam.admin@xpress.test',
    firstName: 'Carmen',
    lastName: 'Villanueva',
    testPassword: 'IamAdmin123!',
    testScenario: 'Identity and access management administration',
    roles: [{
      id: 'role-iam-admin',
      role: {
        id: 'role-iam-admin',
        name: 'iam_admin',
        displayName: 'IAM Administrator',
        level: 80,
        permissions: ['manage_users', 'assign_roles', 'set_allowed_regions', 'set_pii_scope']
      },
      assignedAt: new Date('2025-01-01'),
      isActive: true,
      allowedRegions: [] // Global access
    }],
    permissions: ['manage_users', 'assign_roles', 'set_allowed_regions', 'set_pii_scope'],
    expectedPermissions: ['manage_users', 'assign_roles', 'set_allowed_regions', 'set_pii_scope'],
    allowedRegions: [], // Global access
    piiScope: 'full',
    mfaEnabled: true,
    status: 'active',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  },

  // App Admin (Level 90) - System configuration
  {
    id: 'usr-app-admin-001',
    email: 'app.admin@xpress.test',
    firstName: 'Ricardo',
    lastName: 'Mendoza',
    testPassword: 'AppAdmin123!',
    testScenario: 'Application configuration and feature management',
    roles: [{
      id: 'role-app-admin',
      role: {
        id: 'role-app-admin',
        name: 'app_admin',
        displayName: 'Application Administrator',
        level: 90,
        permissions: ['manage_feature_flags', 'manage_service_configs', 'set_service_limits']
      },
      assignedAt: new Date('2025-01-01'),
      isActive: true,
      allowedRegions: [] // Global access
    }],
    permissions: ['manage_feature_flags', 'manage_service_configs', 'set_service_limits'],
    expectedPermissions: ['manage_feature_flags', 'manage_service_configs', 'set_service_limits'],
    allowedRegions: [], // Global access
    piiScope: 'none',
    mfaEnabled: true,
    status: 'active',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  },

  // Analyst (Level 25) - Data analysis and export
  {
    id: 'usr-analyst-001',
    email: 'analyst.reports@xpress.test',
    firstName: 'Elena',
    lastName: 'Ramos',
    testPassword: 'Analyst123!',
    testScenario: 'Data analysis with masked export capabilities',
    roles: [{
      id: 'role-analyst',
      role: {
        id: 'role-analyst',
        name: 'analyst',
        displayName: 'Data Analyst',
        level: 25,
        permissions: ['query_curated_views', 'export_reports']
      },
      assignedAt: new Date('2025-01-01'),
      isActive: true,
      allowedRegions: [TEST_REGIONS.NCR_MANILA, TEST_REGIONS.CEBU]
    }],
    permissions: ['query_curated_views', 'export_reports'],
    expectedPermissions: ['query_curated_views', 'export_reports'],
    allowedRegions: [TEST_REGIONS.NCR_MANILA, TEST_REGIONS.CEBU],
    piiScope: 'masked',
    mfaEnabled: false,
    status: 'active',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  },

  // Auditor (Level 50) - System auditing
  {
    id: 'usr-auditor-001',
    email: 'auditor.compliance@xpress.test',
    firstName: 'Benjamin',
    lastName: 'Aquino',
    testPassword: 'Auditor123!',
    testScenario: 'System auditing and compliance review',
    roles: [{
      id: 'role-auditor',
      role: {
        id: 'role-auditor',
        name: 'auditor',
        displayName: 'System Auditor',
        level: 50,
        permissions: ['read_all_configs', 'read_all_audit_logs', 'read_only_everything']
      },
      assignedAt: new Date('2025-01-01'),
      isActive: true,
      allowedRegions: [] // Global access for auditing
    }],
    permissions: ['read_all_configs', 'read_all_audit_logs', 'read_only_everything'],
    expectedPermissions: ['read_all_configs', 'read_all_audit_logs', 'read_only_everything'],
    allowedRegions: [], // Global access for auditing
    piiScope: 'masked',
    mfaEnabled: true,
    status: 'active',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  }
];

// Test scenarios for security validation
export const EXPLOIT_TEST_SCENARIOS = [
  {
    name: 'Token Replay Attack',
    description: 'Attempt to use Manila token in Cebu region',
    user: 'usr-ground-ops-001',
    targetRegion: TEST_REGIONS.CEBU,
    expectedResult: 'DENY',
    expectedReason: 'Regional access violation'
  },
  {
    name: 'Privilege Escalation',
    description: 'Ground ops attempting admin functions',
    user: 'usr-ground-ops-001',
    targetPermission: 'manage_users',
    expectedResult: 'DENY',
    expectedReason: 'Insufficient permissions'
  },
  {
    name: 'PII Leak Prevention',
    description: 'Export attempt with unmasked data',
    user: 'usr-analyst-001',
    targetAction: 'export_unmasked',
    expectedResult: 'DENY',
    expectedReason: 'PII scope violation'
  },
  {
    name: 'Invalid Case Override',
    description: 'Cross-region access without valid case',
    user: 'usr-support-001',
    targetRegion: TEST_REGIONS.NCR_MANILA,
    caseId: TEST_CASES.INVALID_CASE,
    expectedResult: 'DENY',
    expectedReason: 'Invalid case ID for override'
  },
  {
    name: 'MFA Bypass Attempt',
    description: 'PII unmask without MFA verification',
    user: 'usr-risk-investigator-001',
    targetAction: 'unmask_pii_with_mfa',
    mfaVerified: false,
    expectedResult: 'DENY',
    expectedReason: 'MFA required for PII unmasking'
  }
];

export const COMPLIANCE_TEST_CASES = [
  {
    name: 'NPC DPS Registration',
    description: 'Validate separate data processing registrations',
    categories: ['employee_hr', 'investigation_artifacts', 'operational_logs'],
    requirements: ['separate_registration', 'data_controller_mapping']
  },
  {
    name: 'Audit Log Retention',
    description: '7-year retention for finance-related logs',
    logTypes: ['financial_transactions', 'payout_approvals', 'dispute_resolutions'],
    retentionPeriod: '7years',
    autoArchiving: true
  },
  {
    name: 'Break-Glass Procedure',
    description: 'Emergency access with separate approver',
    emergencyRoles: ['regional_manager', 'iam_admin'],
    approverHierarchy: true,
    mandatoryReporting: true,
    auditTrailRequired: true
  }
];

export default {
  TEST_USERS,
  TEST_REGIONS,
  TEST_CASES,
  EXPLOIT_TEST_SCENARIOS,
  COMPLIANCE_TEST_CASES
};