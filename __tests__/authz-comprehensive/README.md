# Xpress Ops Tower AuthZ Testing Implementation

## Overview
Comprehensive testing suite for the RBAC+ABAC authorization system, covering validation, abuse scenarios, and compliance checks for the Philippines market.

## Test Structure

```
__tests__/authz-comprehensive/
├── README.md
├── setup/
│   ├── test-database-setup.sql
│   ├── test-users-data.ts
│   └── environment-config.ts
├── unit/
│   ├── rbac-permission-matrix.test.ts
│   ├── regional-access-control.test.ts
│   ├── pii-masking-validation.test.ts
│   └── mfa-enforcement.test.ts
├── integration/
│   ├── cross-region-override.test.ts
│   ├── dual-control-workflow.test.ts
│   └── temporal-access.test.ts
├── security/
│   ├── exploit-scenarios.test.ts
│   ├── token-replay-attacks.test.ts
│   ├── privilege-escalation.test.ts
│   └── pii-leak-prevention.test.ts
├── sql/
│   ├── rls-validation.sql
│   ├── ddm-validation.sql
│   └── session-context.sql
├── api-collections/
│   ├── authz-testing.postman_collection.json
│   └── environment.postman_environment.json
├── monitoring/
│   ├── kql-detection-queries.kql
│   └── compliance-metrics.kql
└── compliance/
    ├── npc-philippines-compliance.md
    ├── data-retention-policy.md
    └── break-glass-procedure.md
```

## Quick Start

### Prerequisites
- Node.js 18+
- Jest testing framework
- PostgreSQL/MS SQL Server access
- Postman (for API testing)
- Azure Sentinel (for KQL queries)

### Setup
```bash
# Install dependencies
npm install

# Setup test database
npm run test:db:setup

# Run comprehensive test suite
npm run test:authz:all

# Run specific test categories
npm run test:authz:security
npm run test:authz:compliance
npm run test:authz:integration
```

### Environment Configuration
```bash
# Copy example environment
cp .env.authz.example .env.authz

# Configure test environment variables
AUTHZ_TEST_DATABASE_URL=postgresql://localhost:5432/xpress_test
AUTHZ_TEST_JWT_SECRET=test-secret-key
AUTHZ_TEST_API_BASE_URL=http://localhost:4000/api
AUTHZ_TEST_ADMIN_TOKEN=your-admin-token
```

## Test Categories

### 1. Unit Tests
- **RBAC Permission Matrix**: Validates 13 roles × 50+ permissions
- **Regional Access Control**: Tests NCR-Manila, Cebu, Davao boundaries
- **PII Masking**: Validates none/masked/full scoping
- **MFA Enforcement**: Tests sensitive operation protection

### 2. Integration Tests
- **Cross-Region Override**: Tests support/risk escalation paths
- **Dual Control Workflow**: Validates multi-approver scenarios
- **Temporal Access**: Tests time-bounded escalation

### 3. Security Tests
- **Token Replay Attacks**: Prevents cross-region token reuse
- **Privilege Escalation**: Tests role capability isolation
- **PII Leak Prevention**: Validates data export masking
- **Case Spoofing**: Tests invalid case_id rejection

### 4. Compliance Tests
- **NPC Philippines**: Data Processing System validation
- **Audit Trail**: 7-year retention compliance
- **Break-Glass**: Emergency access procedures

## Service Level Objectives (SLOs)

- **Policy Evaluation Latency**: <50ms (Target: 95th percentile)
- **Policy Sync Parity**: 99.9% (Cross-region consistency)
- **PII-Unmask Traceability**: 100% (All events logged)
- **Export PII Prevention**: Zero incidents (Masked data only)

## Golden Test Cases

### High-Priority Security Scenarios
1. **Cross-Region Support Override**: Manila support accessing Cebu with case
2. **PII Unmask with MFA**: Risk investigator unmasking with 2FA
3. **Temporal Escalation**: Regional manager granting 4-hour access
4. **Dual Control Fraud**: Two-person approval for account suspension
5. **Export Masking**: Analyst exporting masked driver data only

### Compliance Edge Cases
6. **Invalid Case Override**: Reject cross-region without valid case
7. **Expired Escalation**: Auto-revoke after time boundary
8. **MFA Bypass Attempt**: Block PII access without 2FA
9. **Role Union Attack**: Prevent combining role permissions
10. **Debug Route Block**: Deny access to hidden admin endpoints

## Execution

### Run All Tests
```bash
npm run test:authz:comprehensive
```

### Run by Category
```bash
npm run test:authz:unit
npm run test:authz:integration
npm run test:authz:security
npm run test:authz:compliance
```

### Generate Reports
```bash
npm run test:authz:report
npm run test:authz:coverage
npm run test:authz:compliance-export
```

## Monitoring and Alerts

### Real-time Detection
- Cross-region overrides without cases
- PII unmask attempts without MFA
- Unusual role escalation patterns
- Export containing unmasked PII

### Compliance Metrics
- Audit log completeness (100%)
- Break-glass event documentation
- Data retention policy adherence
- NPC registration compliance

## Support

For test execution issues or compliance questions:
- Review setup documentation
- Check environment configuration
- Validate database connectivity
- Verify test data initialization

## Contributing

When adding new tests:
1. Follow existing naming conventions
2. Include both positive and negative scenarios
3. Add appropriate security tags
4. Update compliance documentation
5. Ensure proper cleanup in teardown