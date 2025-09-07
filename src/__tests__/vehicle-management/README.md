# Vehicle Management Testing Infrastructure

This directory contains comprehensive test coverage for the Vehicle Management section of Xpress Ops Tower platform, specifically designed for the Philippines ridesharing market with LTFRB compliance and multi-ownership model support.

## 🏗️ Test Architecture Overview

### Test Coverage Scope
- **Unit Tests**: Database operations, business logic, service layer
- **Integration Tests**: API endpoints, external service integration, telemetry
- **Component Tests**: React UI components, user interactions
- **Security Tests**: RBAC permissions, data masking, audit logging
- **Performance Tests**: Large fleet handling, concurrent operations
- **E2E Tests**: Complete user workflows, cross-system integration
- **Compliance Tests**: Philippines-specific regulatory requirements

### Ownership Models Tested
- `xpress_owned`: Company-owned vehicles
- `fleet_owned`: Fleet partner vehicles
- `operator_owned`: Independent operator vehicles
- `driver_owned`: Individual driver-owned vehicles

## 📁 Test Files Structure

```
src/__tests__/vehicle-management/
├── README.md                              # This documentation
├── vehicle-service.test.ts                # Unit tests for vehicle services
├── vehicle-api.test.ts                    # API integration tests
├── vehicle-components.test.tsx            # React component tests
├── vehicle-telemetry-integration.test.ts # OBD/telemetry integration
├── vehicle-security.test.ts              # RBAC security tests
├── vehicle-performance.test.ts           # Performance & scalability tests
├── vehicle-e2e.test.ts                   # End-to-end workflow tests
├── philippines-compliance.test.ts        # PH regulatory compliance tests
└── __fixtures__/
    ├── vehicle-test-data.ts               # Comprehensive test data
    ├── setup-tests.ts                     # Global test setup
    ├── setup-env.ts                       # Environment variables
    └── setup-*.ts                         # Specialized setup files
```

## 🚀 Running Tests

### Quick Start
```bash
# Run all vehicle management tests
npm run test:vehicle

# Run with coverage report
npm run test:vehicle:coverage

# Watch mode for development
npm run test:vehicle:watch
```

### Specific Test Suites
```bash
# Unit tests only
npm run test:vehicle:unit

# Integration tests (API + Telemetry)
npm run test:vehicle:integration

# React component tests
npm run test:vehicle:components

# Security and RBAC tests
npm run test:vehicle:security

# Performance tests (takes longer)
npm run test:vehicle:performance

# Philippines compliance tests
npm run test:vehicle:compliance
```

### CI/CD Integration
```bash
# Full CI gate (recommended for PRs)
npm run vehicle:ci-gate

# Quick validation (essential tests only)
npm run vehicle:ci-gate:quick

# Security-only validation
npm run vehicle:ci-gate:security
```

## 🧪 Test Configuration

### Environment Variables
```bash
# Database (automatically set in CI)
DATABASE_URL=postgresql://user:password@localhost:5432/vehicle_test_db
REDIS_URL=redis://localhost:6380

# Philippines APIs (mock mode in tests)
LTFRB_API_MODE=mock
LTO_API_MODE=mock
PHILIPPINES_REGION=NCR

# Test-specific settings
NODE_ENV=test
OBD_SIMULATION_MODE=true
WEBSOCKET_TEST_MODE=true
PERFORMANCE_TEST_MODE=false
SECURITY_TEST_MODE=false
```

### Test Database Setup
The tests use isolated PostgreSQL databases:
- Unit Tests: `vehicle_test_db`
- Integration: `vehicle_integration_db`
- Security: `vehicle_security_db`
- Performance: `vehicle_performance_db`
- Compliance: `vehicle_compliance_db`
- E2E: `vehicle_e2e_db`

## 📊 Test Coverage Requirements

### Coverage Thresholds
- **Global Coverage**: 85% minimum
- **Vehicle Services**: 90% minimum
- **API Endpoints**: 88% minimum
- **React Components**: 85% minimum

### Key Metrics Tracked
- **Total Tests**: ~247 tests across all suites
- **RBAC Permissions**: 48 vehicle-specific permissions tested
- **Philippines Compliance**: 51 regulatory validation tests
- **Performance Benchmarks**: 10,000+ vehicle fleet tested
- **API Endpoints**: 25+ vehicle management endpoints

## 🔒 Security Testing

### RBAC Roles Tested
- `super_admin`: Full vehicle access
- `admin`: Administrative vehicle operations
- `fleet_manager`: Fleet-specific operations
- `driver_manager`: Driver assignment operations
- `dispatcher`: Operational vehicle management
- `analyst`: Read-only analytics access
- `support_agent`: Limited support operations
- `expansion_manager`: New region vehicle setup

### Security Test Coverage
- Role-based access control enforcement
- Data masking for sensitive information
- Audit logging for all operations
- Input validation and sanitization
- SQL injection prevention
- Authentication token validation

## 🇵🇭 Philippines Compliance Testing

### Regulatory Requirements Tested
- **LTFRB (Land Transportation Franchising and Regulatory Board)**
  - Franchise validation and status checking
  - Route authorization verification
  - Operator certification requirements

- **LTO (Land Transportation Office)**
  - Vehicle registration verification
  - Driver's license validation
  - Vehicle inspection certificates

- **Insurance Requirements**
  - Comprehensive coverage validation
  - Third-party liability insurance
  - Passenger accident insurance

- **Number Coding Compliance**
  - Metro Manila coding scheme
  - Provincial coding variations
  - Holiday exemptions

### Compliance Scoring System
Tests validate the compliance scoring algorithm:
- **Green (90-100%)**: Fully compliant, active operations
- **Yellow (70-89%)**: Minor issues, warnings issued
- **Red (0-69%)**: Major compliance issues, operations suspended

## ⚡ Performance Testing

### Performance Benchmarks
- **Fleet Query Response**: < 2 seconds for 10,000+ vehicles
- **Bulk Vehicle Insert**: < 30 seconds for 1,000 vehicles
- **Real-time Updates**: < 500ms WebSocket latency
- **Memory Usage**: < 1GB for large fleet operations
- **Concurrent Users**: Support 100+ simultaneous operations

### Scalability Testing
- Database query optimization under load
- Redis caching effectiveness
- WebSocket connection handling
- Memory leak detection
- Connection pool management

## 🔧 Development Guidelines

### Adding New Tests
1. **Choose the appropriate test file** based on test type
2. **Use existing fixtures** from `__fixtures__/vehicle-test-data.ts`
3. **Follow naming conventions**: `describe('Feature', () => { it('should behavior', () => {})})`
4. **Add proper cleanup** in `afterEach` hooks
5. **Mock external services** appropriately

### Test Data Management
- Use realistic Philippines vehicle data
- Include edge cases and error scenarios
- Maintain data consistency across ownership models
- Update fixtures when adding new features

### Mock Services
All tests use comprehensive mock services:
- `MockVehicleService`: Database operations
- `MockLTFRBService`: Philippines franchise validation
- `MockOBDService`: Vehicle telemetry simulation
- `MockWebSocketService`: Real-time communication

## 🚨 Troubleshooting

### Common Issues

**Test Timeouts**
```bash
# Increase timeout for performance tests
jest --testTimeout=300000
```

**Database Connection Issues**
```bash
# Check PostgreSQL service status
docker-compose -f docker-compose.test.yml ps
```

**Memory Issues with Large Tests**
```bash
# Run tests with increased memory
node --max-old-space-size=4096 $(which jest)
```

**Port Conflicts**
```bash
# Check for conflicting processes
lsof -i :5433  # PostgreSQL test port
lsof -i :6380  # Redis test port
```

### Debug Mode
```bash
# Run tests with debug output
DEBUG=* npm run test:vehicle

# Jest debug mode
node --inspect-brk node_modules/.bin/jest --runInBand
```

## 📈 CI/CD Integration

### GitHub Actions Workflow
The tests are integrated with GitHub Actions in `.github/workflows/vehicle-management-tests.yml`:

- **Triggers**: Push to main/develop, PRs, scheduled runs
- **Parallel Execution**: Different test suites run in parallel
- **Coverage Reports**: Uploaded to Codecov
- **Artifact Storage**: Test reports and videos stored
- **Notifications**: Slack notifications for failures

### Branch Protection
Vehicle management tests are required for:
- Pull requests to `main` branch
- Deployment gates
- Security validation pipelines

### Performance Monitoring
- Test execution time tracking
- Coverage trend analysis
- Performance benchmark regression detection
- Memory usage monitoring

## 🤝 Contributing

### Pull Request Requirements
1. All vehicle tests must pass
2. Coverage thresholds must be met
3. Security tests must validate RBAC changes
4. Compliance tests must pass for PH regulatory changes
5. Performance tests required for scalability changes

### Test Review Checklist
- [ ] Test names are descriptive and clear
- [ ] Edge cases and error scenarios covered
- [ ] Appropriate mocking and cleanup
- [ ] Performance implications considered
- [ ] Security implications validated
- [ ] Philippines compliance maintained

## 📚 Additional Resources

- [Vehicle Management API Documentation](../../app/api/vehicles/README.md)
- [RBAC Permissions Guide](../../../RBAC_PERMISSIONS_SUMMARY.md)
- [Philippines Compliance Requirements](../../../docs/philippines-compliance.md)
- [Performance Benchmarking Guide](../../../docs/performance-testing.md)

---

**Last Updated**: 2025-09-05  
**Test Suite Version**: 1.0.0  
**Total Test Count**: 247 tests  
**Minimum Coverage**: 85%