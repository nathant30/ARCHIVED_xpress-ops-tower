// Environment Configuration for AuthZ Testing
// Provides isolated testing environment with proper security boundaries

export interface TestEnvironmentConfig {
  database: {
    url: string;
    testSchema: string;
    useTransactions: boolean;
    rollbackAfterTest: boolean;
  };
  api: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
  };
  jwt: {
    secret: string;
    refreshSecret: string;
    issuer: string;
    audience: string;
    accessTokenExpiry: string;
    refreshTokenExpiry: string;
  };
  mfa: {
    testSecret: string;
    testBackupCodes: string[];
    simulateDelay: boolean;
  };
  security: {
    rateLimitBypass: boolean;
    allowTestTokens: boolean;
    logSecurityEvents: boolean;
  };
  compliance: {
    auditLogLevel: 'minimal' | 'standard' | 'enhanced';
    retentionSimulation: boolean;
    npcComplianceMode: boolean;
  };
}

export const getTestEnvironmentConfig = (): TestEnvironmentConfig => {
  const isCI = process.env.CI === 'true';
  const testEnv = process.env.AUTHZ_TEST_ENV || 'local';

  const baseConfig: TestEnvironmentConfig = {
    database: {
      url: process.env.AUTHZ_TEST_DATABASE_URL || 'postgresql://localhost:5432/xpress_authz_test',
      testSchema: 'authz_test',
      useTransactions: true,
      rollbackAfterTest: true
    },
    api: {
      baseUrl: process.env.AUTHZ_TEST_API_BASE_URL || 'http://localhost:4000/api',
      timeout: 10000,
      retryAttempts: 3
    },
    jwt: {
      secret: process.env.AUTHZ_TEST_JWT_SECRET || 'test-jwt-secret-256bit-key-authz-testing',
      refreshSecret: process.env.AUTHZ_TEST_JWT_REFRESH_SECRET || 'test-refresh-secret-256bit-key-authz',
      issuer: 'xpress-ops-tower-test',
      audience: 'xpress-operations-test',
      accessTokenExpiry: '1h',
      refreshTokenExpiry: '24h'
    },
    mfa: {
      testSecret: 'JBSWY3DPEHPK3PXP', // Test TOTP secret
      testBackupCodes: ['123456', '234567', '345678', '456789', '567890'],
      simulateDelay: !isCI // Skip MFA delays in CI
    },
    security: {
      rateLimitBypass: true, // Allow rapid testing
      allowTestTokens: true,
      logSecurityEvents: true
    },
    compliance: {
      auditLogLevel: 'enhanced',
      retentionSimulation: true,
      npcComplianceMode: true
    }
  };

  // Environment-specific overrides
  switch (testEnv) {
    case 'ci':
      return {
        ...baseConfig,
        api: {
          ...baseConfig.api,
          timeout: 30000,
          retryAttempts: 5
        },
        mfa: {
          ...baseConfig.mfa,
          simulateDelay: false
        }
      };

    case 'staging':
      return {
        ...baseConfig,
        database: {
          ...baseConfig.database,
          url: process.env.AUTHZ_STAGING_DATABASE_URL || baseConfig.database.url
        },
        api: {
          ...baseConfig.api,
          baseUrl: process.env.AUTHZ_STAGING_API_URL || 'https://staging-api.xpress.test/api'
        },
        security: {
          ...baseConfig.security,
          rateLimitBypass: false,
          logSecurityEvents: true
        }
      };

    default:
      return baseConfig;
  }
};

export const TEST_JWT_CLAIMS = {
  BASIC_CLAIMS: {
    iss: 'xpress-ops-tower-test',
    aud: 'xpress-operations-test',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  },
  
  REGIONAL_CLAIMS: {
    'allowed_regions': ['reg-ncr-manila-001'],
    'x-region-id': 'reg-ncr-manila-001'
  },

  PII_CLAIMS: {
    'pii_scope': 'masked',
    'x-pii-mask': 'true'
  },

  MFA_CLAIMS: {
    'mfa_verified': true,
    'mfa_timestamp': Math.floor(Date.now() / 1000)
  },

  ESCALATION_CLAIMS: {
    'case_id': 'CASE-SUPPORT-MNL-001',
    'escalation_type': 'support',
    'escalation_expires': Math.floor(Date.now() / 1000) + 14400 // 4 hours
  }
};

export const SECURITY_TEST_VECTORS = {
  MALFORMED_TOKENS: [
    '', // Empty token
    'invalid-token', // Invalid format
    'Bearer invalid-token', // Malformed Bearer
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid-payload', // Invalid payload
    'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.' // None algorithm
  ],

  REGION_INJECTION_ATTEMPTS: [
    '*', // Wildcard injection
    'reg-*-001', // Pattern injection
    'reg-ncr-manila-001; DROP TABLE users;', // SQL injection
    '../reg-admin', // Path traversal
    'reg-ncr-manila-001\x00admin' // Null byte injection
  ],

  CASE_ID_ATTACKS: [
    'CASE-ADMIN-*', // Admin privilege escalation
    'CASE-DEBUG-001', // Debug route access
    'CASE-' + 'A'.repeat(1000), // Buffer overflow attempt
    'CASE-SUPPORT-MNL-001\'; DROP TABLE audit_logs; --', // SQL injection
    'javascript:alert(1)', // XSS injection
  ],

  PERMISSION_ESCALATION: [
    ['ground_ops', 'manage_users'], // Role -> Admin permission
    ['ops_monitor', 'unmask_pii_with_mfa'], // Monitor -> PII access
    ['support', 'manage_feature_flags'], // Support -> System config
    ['analyst', 'assign_roles'], // Analyst -> IAM functions
  ]
};

export const COMPLIANCE_VALIDATION_RULES = {
  NPC_PHILIPPINES: {
    dataCategories: [
      'personal_identifiable_information',
      'sensitive_personal_information',
      'employee_records',
      'financial_transactions',
      'location_tracking'
    ],
    processingBases: [
      'legitimate_interest',
      'contract_performance',
      'legal_obligation',
      'consent'
    ],
    retentionPeriods: {
      'audit_logs': '7years',
      'investigation_records': 'legal_guidance',
      'employee_records': '10years_post_employment',
      'financial_records': '7years',
      'operational_logs': '3years'
    },
    dataSubjectRights: [
      'access',
      'rectification',
      'erasure',
      'portability',
      'objection'
    ]
  },

  AUDIT_REQUIREMENTS: {
    mandatoryEvents: [
      'authentication_attempt',
      'authorization_decision',
      'pii_access',
      'cross_region_access',
      'role_assignment',
      'emergency_access',
      'data_export',
      'policy_violation'
    ],
    auditFields: [
      'timestamp',
      'user_id',
      'session_id',
      'action',
      'resource',
      'result',
      'reason',
      'ip_address',
      'user_agent',
      'mfa_status',
      'risk_score'
    ],
    retentionPolicy: {
      'security_events': '10years',
      'access_logs': '7years',
      'error_logs': '3years',
      'performance_metrics': '1year'
    }
  },

  BREAK_GLASS_PROCEDURE: {
    triggerConditions: [
      'system_outage',
      'security_incident',
      'regulatory_investigation',
      'emergency_operations'
    ],
    approvalWorkflow: {
      'requester': 'authenticated_user',
      'approver': 'regional_manager_or_higher',
      'witness': 'independent_third_party',
      'documentation': 'mandatory_justification'
    },
    auditTrail: {
      'pre_access_log': 'emergency_justification',
      'access_log': 'detailed_activity_tracking',
      'post_access_review': 'mandatory_within_24h'
    },
    autoReporting: {
      'internal_notification': 'immediate',
      'compliance_report': 'within_24h',
      'external_notification': 'if_required_by_regulation'
    }
  }
};

export const SLO_THRESHOLDS = {
  POLICY_EVALUATION_LATENCY: {
    target: 50, // milliseconds
    warning: 40,
    critical: 100
  },
  POLICY_SYNC_PARITY: {
    target: 99.9, // percentage
    warning: 99.5,
    critical: 99.0
  },
  PII_UNMASK_TRACEABILITY: {
    target: 100, // percentage
    warning: 99.9,
    critical: 99.5
  },
  EXPORT_PII_PREVENTION: {
    target: 0, // incidents
    warning: 0,
    critical: 1
  }
};

export default {
  getTestEnvironmentConfig,
  TEST_JWT_CLAIMS,
  SECURITY_TEST_VECTORS,
  COMPLIANCE_VALIDATION_RULES,
  SLO_THRESHOLDS
};