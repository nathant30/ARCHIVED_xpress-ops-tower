# XpressOps Test Execution Guide

**Agent 12 - Integration Verification & Monitoring Specialist**

This guide provides instructions for running all integration tests, E2E tests, and load tests for the XpressOps platform.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Test Suite Overview](#test-suite-overview)
3. [Running Tests](#running-tests)
4. [Test Reports](#test-reports)
5. [Continuous Integration](#continuous-integration)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

1. **Node.js** (v18+)
2. **npm** (v8+)
3. **Playwright** (installed via npm)
4. **k6** (for load testing)

### Installation

```bash
# Install dependencies
cd /Users/nathan/xpress-ops-tower/xpress-ops-tower
npm install

# Install Playwright browsers
npx playwright install chromium

# Install k6 (macOS)
brew install k6

# Install k6 (Linux)
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

### Environment Setup

Create a `.env.local` file in the frontend directory:

```bash
# Frontend URL
BASE_URL=http://localhost:4000

# Backend API URL
BACKEND_API_URL=http://localhost:3001

# Backend WebSocket URL
BACKEND_WS_URL=ws://localhost:3001

# Test user credentials (if different from defaults)
TEST_ADMIN_EMAIL=admin@xpress.ops
TEST_ADMIN_PASSWORD=demo123
```

---

## Test Suite Overview

### 1. Auth Flow E2E Tests

**Location**: `__tests__/e2e/auth-flow.spec.ts`

**Coverage**:
- ✅ Login flow (valid/invalid credentials, validation)
- ✅ Token refresh mechanism (expiry, reconnection)
- ✅ Role-based route guards (5 roles: admin, dispatcher, analyst, safety_monitor, regional_manager)
- ✅ Session management (logout, timeout, multi-device)

**Test Count**: 24 tests
**Estimated Duration**: 5-8 minutes

### 2. Real-Time Pipeline Integration Tests

**Location**: `__tests__/integration/real-time-pipeline.spec.ts`

**Coverage**:
- ✅ Fleet location updates (WebSocket, 275 vehicles, 5-second intervals)
- ✅ KPI metrics updates (10-second intervals)
- ✅ Incident alerts (real-time notifications)
- ✅ WebSocket health monitoring (connection, reconnection, heartbeat)

**Test Count**: 18 tests
**Estimated Duration**: 8-12 minutes

### 3. Map Features Integration Tests

**Location**: `__tests__/integration/map-features.spec.ts`

**Coverage**:
- ✅ Basic map rendering (load, controls, styles)
- ✅ Vehicle markers (275 vehicles, colors by status, popups)
- ✅ Marker clustering (zoom behavior, performance)
- ✅ Demand heatmap (overlay, updates, toggle)
- ✅ Geofence visualization (depot zones, vehicle entry/exit)

**Test Count**: 20 tests
**Estimated Duration**: 10-15 minutes

### 4. Load Tests

**Location**: `__tests__/load/real-time-load-test.js`

**Scenarios**:
- 275 vehicles sending position updates every 5s
- 50 Command Center users watching real-time dashboard
- 10 concurrent incident creation workflows

**Estimated Duration**: 5 minutes (configurable)

---

## Running Tests

### Quick Start

```bash
# Run all E2E tests
npm run test:e2e

# Run all integration tests
npm run test:integration

# Run load tests
k6 run __tests__/load/real-time-load-test.js
```

### Detailed Commands

#### 1. Auth Flow E2E Tests

```bash
# Run all auth tests
npx playwright test __tests__/e2e/auth-flow.spec.ts

# Run with UI (headed mode)
npx playwright test __tests__/e2e/auth-flow.spec.ts --headed

# Run specific test
npx playwright test __tests__/e2e/auth-flow.spec.ts -g "should successfully login"

# Run with debug mode
npx playwright test __tests__/e2e/auth-flow.spec.ts --debug

# Generate HTML report
npx playwright test __tests__/e2e/auth-flow.spec.ts --reporter=html
npx playwright show-report
```

#### 2. Real-Time Pipeline Tests

```bash
# Run all real-time tests
npx playwright test __tests__/integration/real-time-pipeline.spec.ts

# Run with specific timeout
npx playwright test __tests__/integration/real-time-pipeline.spec.ts --timeout=60000

# Run only WebSocket tests
npx playwright test __tests__/integration/real-time-pipeline.spec.ts -g "WebSocket"

# Run with video recording
npx playwright test __tests__/integration/real-time-pipeline.spec.ts --video=on
```

#### 3. Map Features Tests

```bash
# Run all map tests
npx playwright test __tests__/integration/map-features.spec.ts

# Run only marker tests
npx playwright test __tests__/integration/map-features.spec.ts -g "marker"

# Run with screenshots on failure
npx playwright test __tests__/integration/map-features.spec.ts --screenshot=only-on-failure
```

#### 4. Load Tests

```bash
# Basic load test (5 minutes)
k6 run __tests__/load/real-time-load-test.js

# Custom duration and VUs
k6 run --duration 10m --vus 325 __tests__/load/real-time-load-test.js

# Stress test (2x load)
k6 run --duration 10m --vus 650 __tests__/load/real-time-load-test.js

# Output results to file
k6 run --out json=test-results/load-test-results.json __tests__/load/real-time-load-test.js

# Run with environment variables
BASE_URL=https://staging.xpressops.com k6 run __tests__/load/real-time-load-test.js
```

### Run All Tests

```bash
# Sequential execution
npm run test:e2e && npm run test:integration && k6 run __tests__/load/real-time-load-test.js

# Or use the master script (if available)
npm run test:all
```

---

## Test Reports

### Playwright Reports

#### HTML Report (Recommended)

```bash
# Generate report
npx playwright test --reporter=html

# View report
npx playwright show-report

# Report location: playwright-report/index.html
```

#### JSON Report

```bash
# Generate JSON report
npx playwright test --reporter=json

# Report location: test-results/results.json
```

#### JUnit Report (for CI)

```bash
# Generate JUnit XML
npx playwright test --reporter=junit

# Report location: test-results/results.xml
```

### k6 Load Test Reports

#### Console Output

Default k6 output shows:
- Requests per second
- Response time percentiles (p50, p95, p99)
- Error rates
- Custom metrics

#### JSON Output

```bash
k6 run --out json=load-test-results.json __tests__/load/real-time-load-test.js
```

#### HTML Report (using k6-reporter)

```bash
# Install k6-reporter
npm install -g k6-to-junit

# Convert to JUnit
k6 run --out json=results.json __tests__/load/real-time-load-test.js
k6-to-junit results.json > junit.xml
```

#### Cloud Output (k6 Cloud)

```bash
k6 cloud __tests__/load/real-time-load-test.js
```

---

## Continuous Integration

### GitHub Actions Workflow

**File**: `.github/workflows/integration-tests.yml`

```yaml
name: Integration Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install chromium

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/

  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install chromium

      - name: Run integration tests
        run: npm run test:integration

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: integration-test-results
          path: test-results/

  load-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install k6
        run: |
          sudo gpg -k
          sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6

      - name: Run load tests
        run: k6 run --duration 2m --vus 100 __tests__/load/real-time-load-test.js
```

### Test Coverage Requirements

| Test Type | Required Pass Rate | Required Coverage |
|-----------|-------------------|-------------------|
| E2E Tests | 100% | All critical flows |
| Integration Tests | 95% | All real-time features |
| Load Tests | Pass thresholds | 275 vehicles, 50 users |

---

## Troubleshooting

### Common Issues

#### 1. Tests Timeout

**Symptom**: Tests fail with timeout errors

**Solutions**:
```bash
# Increase timeout globally
npx playwright test --timeout=60000

# Or set in playwright.config.ts
timeout: 60 * 1000
```

#### 2. WebSocket Connection Fails

**Symptom**: Real-time tests fail to connect

**Check**:
1. Backend is running:
   ```bash
   curl http://localhost:3001/health
   ```

2. WebSocket endpoint is accessible:
   ```bash
   wscat -c ws://localhost:3001
   ```

3. Firewall/network allows WebSocket connections

#### 3. Load Test Failures

**Symptom**: High error rate in k6 tests

**Check**:
1. Backend can handle the load (check CPU/memory)
2. Database connection pool is not exhausted
3. Rate limiting is not too aggressive

**Solutions**:
- Reduce VUs: `k6 run --vus 100`
- Increase ramp-up time
- Check backend logs for errors

#### 4. Map Tests Fail to Load

**Symptom**: Map features tests timeout

**Check**:
1. Google Maps API key is configured
2. Network allows access to map tiles
3. Map container renders correctly

**Debug**:
```bash
# Run in headed mode to see what's happening
npx playwright test __tests__/integration/map-features.spec.ts --headed --debug
```

#### 5. Test Data Cleanup

**Problem**: Tests fail due to stale data

**Solution**:
```bash
# Clear test database
npm run db:reset-test

# Or manually clean up
psql -d xpressops_test -c "DELETE FROM e2e_test_data;"
```

### Getting Help

- **Documentation**: `/docs/` directory
- **Issues**: Create issue in GitHub
- **Slack**: #testing channel
- **Email**: qa-team@xpressops.com

---

## Best Practices

### Writing Tests

1. **Use descriptive test names**
   ```typescript
   test('should successfully login with valid credentials and redirect to dashboard', ...)
   ```

2. **Add helpful assertions**
   ```typescript
   expect(page.url()).toContain('/dashboard');
   expect(token).toBeTruthy();
   ```

3. **Clean up after tests**
   ```typescript
   test.afterEach(async ({ page }) => {
     await clearTestData(page);
   });
   ```

4. **Use proper waits**
   ```typescript
   await page.waitForURL('**/dashboard', { timeout: 5000 });
   await page.waitForLoadState('networkidle');
   ```

### Running Tests Locally

1. **Start backend first**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start frontend**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Run tests**
   ```bash
   npm run test:e2e
   ```

### Test Maintenance

- Review and update tests monthly
- Remove obsolete tests
- Add tests for new features
- Keep test data fresh

---

**Last Updated**: 2026-02-03
**Maintained By**: Agent 12 - Integration Verification & Monitoring Specialist
