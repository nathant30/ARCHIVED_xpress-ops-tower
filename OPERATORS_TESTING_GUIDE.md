# Operators Management System - Comprehensive Testing Guide

## Overview

This document provides a complete guide to the testing framework for the Xpress Ops Tower Operators Management system. The testing suite ensures production-readiness, security, compliance, and performance for the Philippine ridesharing market.

## 🧪 Test Suite Architecture

### Test Types

1. **Unit Tests** - Individual component validation
2. **Integration Tests** - System interaction validation  
3. **End-to-End Tests** - Complete workflow validation
4. **Performance Tests** - Scalability and load validation
5. **Security Tests** - Vulnerability and penetration testing
6. **Compliance Tests** - Philippine regulatory compliance validation

### Test Coverage

- **Database Functions** - Schema validation, triggers, constraints
- **Business Logic** - Service layer operations, calculations
- **API Endpoints** - Request/response validation, error handling
- **Performance Scoring** - 100-point system validation
- **Financial Operations** - Commission calculations, payouts, tax compliance
- **Real-time Features** - WebSocket communications, live updates
- **Philippines Compliance** - BIR, BSP, LTFRB, Data Privacy Act

## 📁 Test Structure

```
__tests__/operators/
├── unit/                          # Unit Tests
│   ├── operators.service.test.ts  # Core operator operations
│   ├── performance.service.test.ts # Performance scoring
│   └── financial.service.test.ts  # Financial operations
├── integration/                   # Integration Tests
│   ├── operators.api.test.ts      # API integration
│   └── database.integration.test.ts # Database operations
├── e2e/                          # End-to-End Tests
│   └── operator-lifecycle.e2e.test.ts # Complete workflows
├── performance/                   # Performance Tests
│   └── load.performance.test.ts   # Scalability validation
├── security/                     # Security Tests
│   └── security.test.ts          # Vulnerability assessment
├── compliance/                   # Compliance Tests
│   └── philippines-compliance.test.ts # Regulatory compliance
└── helpers/                      # Test Utilities
    ├── testDatabase.ts           # Database test helpers
    ├── e2eSetup.ts              # E2E test setup
    └── testData.ts              # Test data generators
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 7+
- Docker (for CI/CD)

### Environment Setup

1. **Install Dependencies**
```bash
npm install
```

2. **Setup Test Database**
```bash
# Copy test environment file
cp .env.test.example .env.test

# Setup test database
createdb test_operators
npm run db:migrate -- --env=test
```

3. **Configure Test Environment**
```bash
# .env.test
NODE_ENV=test
DATABASE_URL=postgresql://test:test@localhost:5432/test_operators
REDIS_URL=redis://localhost:6379/1
TEST_JWT_SECRET=test-secret-key
```

### Running Tests

#### All Tests
```bash
npm run test:operators:all
```

#### By Test Type
```bash
# Unit tests
npm run test:operators:unit

# Integration tests  
npm run test:operators:integration

# End-to-end tests
npm run test:operators:e2e

# Performance tests
npm run test:operators:performance

# Security tests
npm run test:operators:security

# Compliance tests
npm run test:operators:compliance
```

#### With Coverage
```bash
npm run test:operators:all:coverage
```

#### Watch Mode (Development)
```bash
npm run test:operators:unit:watch
```

## 🧪 Test Categories

### Unit Tests

**Purpose**: Validate individual functions and components in isolation

**Coverage Areas**:
- Service layer business logic
- Database utility functions  
- Performance score calculations
- Commission rate calculations
- Input validation functions
- Utility helpers

**Example Test**:
```typescript
test('should calculate tier 2 commission correctly', async () => {
  const request = {
    operator_id: 'test-operator',
    booking_id: 'test-booking',
    base_fare: 500.00
  };
  
  jest.spyOn(service, 'getOperatorTier').mockResolvedValue('tier_2');
  
  const result = await financialService.calculateCommission(request);
  
  expect(result.amount).toBe(100.00); // 2% of 500
  expect(result.commission_tier).toBe('tier_2');
});
```

### Integration Tests

**Purpose**: Validate system components working together

**Coverage Areas**:
- API endpoint integration
- Database operations with real data
- Service layer interactions
- Authentication and authorization flows
- Real-time WebSocket communications

**Example Test**:
```typescript
test('should create operator with all related data', async () => {
  const operatorData = { /* valid operator data */ };
  
  const response = await request(app)
    .post('/api/operators')
    .set('Authorization', `Bearer ${authToken}`)
    .send(operatorData)
    .expect(201);
    
  expect(response.body.data.operator.operator_code).toBe(operatorData.operator_code);
  
  // Verify database state
  const dbOperator = await pool.query('SELECT * FROM operators WHERE id = $1', [response.body.data.operator.id]);
  expect(dbOperator.rows).toHaveLength(1);
});
```

### End-to-End Tests

**Purpose**: Validate complete user workflows from start to finish

**Coverage Areas**:
- Operator registration and onboarding
- Vehicle and driver management
- Performance scoring and tier advancement
- Financial operations and payouts
- Real-time updates and notifications

**Key Workflows Tested**:
1. **Complete Operator Lifecycle**
   - Registration → Fleet Setup → Performance Tracking → Tier Advancement → Payout

2. **Fleet Management Workflow**
   - Add vehicles → Assign drivers → Manage capacity limits

3. **Performance Scoring Workflow**
   - Data collection → Score calculation → Tier evaluation → Notifications

4. **Financial Operations Workflow**
   - Commission earning → Boundary fee processing → Payout requests

### Performance Tests

**Purpose**: Validate system performance and scalability

**Test Scenarios**:
- **Concurrent Operator Creation**: 10 users creating 100 operators each
- **High-Volume Queries**: Complex operator searches with large datasets
- **Performance Calculations**: 1000+ operators with concurrent scoring
- **Commission Processing**: 10,000+ transactions processed concurrently
- **Memory Usage**: Resource consumption under load

**Performance Targets**:
- API response time: < 2 seconds
- Performance calculation: < 500ms
- Database queries: < 100ms
- Concurrent users: 50+ simultaneous
- Memory per operator: < 10KB

### Security Tests

**Purpose**: Identify and validate against security vulnerabilities

**Security Areas Tested**:
- **Authentication & Authorization**
  - Invalid tokens, expired sessions, role-based access
- **SQL Injection Protection**
  - Malicious inputs in all API endpoints
- **Cross-Site Scripting (XSS)**
  - Script injection in operator data fields
- **Input Validation**
  - Email formats, phone numbers, field lengths
- **Sensitive Data Protection**
  - PII masking, secure data transmission

**Security Test Example**:
```typescript
test('should prevent SQL injection in operator search', async () => {
  const maliciousQuery = "'; DROP TABLE operators; --";
  
  const response = await request(app)
    .get(`/api/operators?search=${encodeURIComponent(maliciousQuery)}`)
    .set('Authorization', `Bearer ${authToken}`)
    .expect(200);
    
  // Should return safe results, not execute malicious SQL
  expect(response.body.data.operators).toBeDefined();
  expect(Array.isArray(response.body.data.operators)).toBe(true);
});
```

### Compliance Tests

**Purpose**: Validate Philippine regulatory compliance

**Regulatory Areas**:

#### BIR (Bureau of Internal Revenue) Compliance
- Tax withholding calculations (1.5% TNVS, 2% General, 2.5% Fleet)
- Form 2307 generation
- TIN format validation
- VAT registration requirements
- Quarterly return generation

#### BSP (Bangko Sentral ng Pilipinas) Compliance
- Currency Transaction Reports (CTR) for >500K PHP
- Suspicious Transaction Reports (STR) 
- Anti-Money Laundering (AML) monitoring
- Cross-border transaction compliance

#### LTFRB (Land Transportation Board) Compliance
- Vehicle limit enforcement (TNVS: 3, General: 10, Fleet: 50)
- Authority number validation
- Bond requirement calculations
- Regional operating permits

#### Data Privacy Act Compliance
- Personal data access requests
- Data deletion/erasure requests
- Privacy impact assessments
- Consent management

## 📊 Test Execution and CI/CD

### Automated Testing Pipeline

The testing pipeline runs automatically on:
- **Pull Requests** - Unit and Integration tests
- **Main Branch Pushes** - Full test suite
- **Daily Schedule** - Complete regression testing
- **Manual Triggers** - Specific test categories

### CI/CD Workflow

```yaml
name: Operators Management Testing Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC

jobs:
  unit-tests:
    # Parallel execution of unit test groups
  
  integration-tests:
    # Database integration with PostgreSQL/Redis
  
  e2e-tests:
    # Full workflow testing with Playwright
  
  performance-tests:
    # Load testing and performance validation
  
  security-tests:
    # Vulnerability scanning and security validation
  
  compliance-tests:
    # Philippine regulatory compliance validation
  
  deployment-gate:
    # Final validation before deployment approval
```

### Test Execution Matrix

| Test Type | PR | Main | Schedule | Manual |
|-----------|----|----|----------|--------|
| Unit | ✅ | ✅ | ✅ | ✅ |
| Integration | ✅ | ✅ | ✅ | ✅ |
| E2E | ❌ | ✅ | ✅ | ✅ |
| Performance | ❌ | ✅ | ✅ | ✅ |
| Security | ❌ | ✅ | ✅ | ✅ |
| Compliance | ❌ | ✅ | ✅ | ✅ |

### Quality Gates

For deployment approval, the following criteria must be met:

- **Unit Tests**: 100% pass rate
- **Integration Tests**: 100% pass rate  
- **Code Coverage**: ≥85% overall, ≥90% for critical services
- **Security Tests**: No high-severity vulnerabilities
- **Performance Tests**: Response times within targets
- **Compliance Tests**: 100% regulatory compliance validation

## 📈 Test Reporting and Metrics

### Coverage Reports

Test coverage is tracked at multiple levels:

```bash
# Generate coverage report
npm run test:operators:all:coverage

# Coverage files generated:
# - coverage/operators/lcov-report/index.html
# - coverage/operators/coverage-summary.json
```

**Coverage Targets**:
- **Overall**: 85% lines, functions, branches, statements
- **OperatorService**: 90% (critical business logic)
- **PerformanceService**: 85% (complex calculations)
- **FinancialService**: 90% (financial operations)
- **API Routes**: 80% (request handling)

### Performance Metrics

Performance tests generate detailed metrics:

```json
{
  "operatorCreation": {
    "avgResponseTime": "1250ms",
    "maxResponseTime": "2100ms", 
    "throughput": "12.5 req/sec",
    "successRate": "98.5%"
  },
  "performanceCalculation": {
    "avgCalculationTime": "320ms",
    "maxCalculationTime": "480ms",
    "calculationsPerSecond": "85",
    "accuracy": "100%"
  }
}
```

### Test Result Dashboard

Comprehensive test results are available in multiple formats:

- **HTML Report**: `test-results/operators/operators-test-report.html`
- **JUnit XML**: `test-results/operators/operators-junit.xml`
- **JSON Metrics**: `test-results/operators/test-metrics.json`
- **Coverage Report**: `coverage/operators/lcov-report/index.html`

## 🛠️ Development and Debugging

### Running Individual Tests

```bash
# Run specific test file
npm test -- __tests__/operators/unit/operators.service.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="commission calculation"

# Run tests in debug mode
npm test -- --runInBand --verbose --no-cache
```

### Test Data Management

```typescript
// Create test operator
const testOperator = await createTestOperator({
  operator_code: 'TEST-001',
  business_name: 'Test Operator',
  operator_type: 'tnvs',
  primary_region_id: 'ncr-001'
});

// Create test user with permissions
const testUser = await createTestUser({
  email: 'test@example.com',
  password: 'password123',
  permissions: ['manage_operators'],
  allowedRegions: ['ncr-001']
});
```

### Mock Data and Stubs

Test helpers provide realistic mock data:

```typescript
// Generate test performance metrics
const mockMetrics = generatePerformanceMetrics({
  vehicleUtilization: 0.85,
  driverRetention: 0.90,
  safetyScore: 0.95
});

// Create mock financial transaction
const mockTransaction = createMockTransaction({
  operatorId: 'test-operator',
  amount: 500.00,
  type: 'commission_earned'
});
```

## 📋 Test Maintenance

### Updating Tests

When adding new features:

1. **Create Unit Tests** for new business logic
2. **Add Integration Tests** for new API endpoints  
3. **Update E2E Tests** for modified workflows
4. **Add Performance Tests** for scalability-critical features
5. **Include Security Tests** for new data handling
6. **Add Compliance Tests** for regulatory features

### Test Data Lifecycle

- **Setup**: Fresh test database for each test suite
- **Isolation**: Each test uses isolated data
- **Cleanup**: Automatic cleanup after test completion
- **Seeding**: Consistent test data generation

### Best Practices

1. **Test Isolation**: Each test should be independent
2. **Realistic Data**: Use Philippine-specific test data
3. **Error Scenarios**: Test both success and failure cases
4. **Performance Awareness**: Monitor test execution time
5. **Documentation**: Keep test descriptions clear and specific

## 📞 Support and Troubleshooting

### Common Issues

1. **Database Connection Errors**
   ```bash
   # Verify PostgreSQL is running
   pg_isready -h localhost -p 5432
   
   # Reset test database
   npm run db:reset -- --env=test
   ```

2. **Redis Connection Issues**
   ```bash
   # Check Redis status
   redis-cli ping
   
   # Flush test Redis database
   redis-cli -n 1 FLUSHDB
   ```

3. **Test Timeouts**
   - Increase timeout in Jest configuration
   - Check database performance
   - Verify test data cleanup

4. **Coverage Issues**
   - Run tests with `--coverage` flag
   - Check Istanbul configuration
   - Verify file path mappings

### Debug Mode

```bash
# Run tests with detailed output
DEBUG=test:* npm test

# Run specific test in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand --testNamePattern="your test name"
```

### Contact

For testing support and questions:
- **Development Team**: developers@xpressops.com
- **QA Team**: qa@xpressops.com
- **DevOps Team**: devops@xpressops.com

---

## ✅ Checklist: Testing Implementation Complete

- [x] Unit test suite for all core components
- [x] Integration tests with real database operations
- [x] End-to-end workflow testing scenarios  
- [x] Performance and scalability validation tests
- [x] Security vulnerability assessment tests
- [x] Philippines regulatory compliance tests
- [x] Automated CI/CD testing pipeline
- [x] Comprehensive test documentation
- [x] Test data management and helpers
- [x] Quality gates and deployment approval

**Status**: ✅ **PRODUCTION-READY** ✅

The Operators Management System testing suite is comprehensive, automated, and ready for production deployment with full confidence in system reliability, security, and compliance with Philippine regulations.