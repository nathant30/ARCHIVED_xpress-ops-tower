#!/usr/bin/env node
/**
 * API Security Test Suite
 * Comprehensive security testing for Xpress Ops Tower API endpoints
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

// Configuration
const config = {
  baseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
  testTimeout: 30000,
  maxRetries: 3,
  jwtSecret: process.env.TEST_JWT_SECRET || 'test-secret-for-ci-only',
  verbose: process.env.VERBOSE === 'true'
};

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  errors: [],
  warnings: []
};

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Security-Test-Suite/1.0',
        ...options.headers
      },
      timeout: config.testTimeout
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonData,
            rawData: data
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: null,
            rawData: data
          });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// Generate test JWT token
function generateTestToken(payload = {}) {
  const crypto = require('crypto');
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({
    userId: 'test-user-id',
    permissions: ['view_drivers', 'manage_bookings'],
    exp: Math.floor(Date.now() / 1000) + 3600,
    ...payload
  })).toString('base64url');
  
  const signature = crypto
    .createHmac('sha256', config.jwtSecret)
    .update(`${header}.${body}`)
    .digest('base64url');
  
  return `${header}.${body}.${signature}`;
}

// Test helper functions
function assert(condition, message, severity = 'error') {
  if (condition) {
    results.passed++;
    if (config.verbose) console.log(`✅ ${message}`);
  } else {
    results.failed++;
    const result = { test: message, severity };
    if (severity === 'error') {
      results.errors.push(result);
      console.error(`❌ ${message}`);
    } else {
      results.warnings.push(result);
      console.warn(`⚠️  ${message}`);
    }
  }
}

// Security test suites
async function testAuthenticationSecurity() {
  console.log('\n🔐 Testing Authentication Security...');
  
  try {
    // Test 1: Unauthenticated access should be denied
    const response1 = await makeRequest(`${config.baseUrl}/api/drivers`);
    assert(
      response1.statusCode === 401 || response1.statusCode === 403,
      'Unauthenticated requests to protected endpoints should be denied'
    );

    // Test 2: Invalid JWT should be rejected
    const response2 = await makeRequest(`${config.baseUrl}/api/drivers`, {
      headers: { Authorization: 'Bearer invalid-token' }
    });
    assert(
      response2.statusCode === 401,
      'Invalid JWT tokens should be rejected'
    );

    // Test 3: Expired JWT should be rejected
    const expiredToken = generateTestToken({ exp: Math.floor(Date.now() / 1000) - 3600 });
    const response3 = await makeRequest(`${config.baseUrl}/api/drivers`, {
      headers: { Authorization: `Bearer ${expiredToken}` }
    });
    assert(
      response3.statusCode === 401,
      'Expired JWT tokens should be rejected'
    );

    // Test 4: Valid JWT should allow access
    const validToken = generateTestToken();
    const response4 = await makeRequest(`${config.baseUrl}/api/drivers`, {
      headers: { Authorization: `Bearer ${validToken}` }
    });
    assert(
      response4.statusCode !== 401 && response4.statusCode !== 403,
      'Valid JWT tokens should allow access to authorized endpoints'
    );

  } catch (error) {
    results.errors.push({ test: 'Authentication Security', error: error.message });
    console.error('❌ Authentication security test failed:', error.message);
  }
}

async function testAuthorizationSecurity() {
  console.log('\n🛡️ Testing Authorization Security...');
  
  try {
    // Test 1: User with insufficient permissions should be denied
    const limitedToken = generateTestToken({ permissions: ['view_public_data'] });
    const response1 = await makeRequest(`${config.baseUrl}/api/drivers`, {
      headers: { Authorization: `Bearer ${limitedToken}` }
    });
    assert(
      response1.statusCode === 403,
      'Users with insufficient permissions should be denied access'
    );

    // Test 2: RBAC endpoints should require admin permissions
    const userToken = generateTestToken({ permissions: ['view_drivers'] });
    const response2 = await makeRequest(`${config.baseUrl}/api/rbac/roles`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(
      response2.statusCode === 403,
      'RBAC endpoints should require admin permissions'
    );

    // Test 3: Admin permissions should allow RBAC access
    const adminToken = generateTestToken({ permissions: ['system:admin'] });
    const response3 = await makeRequest(`${config.baseUrl}/api/rbac/roles`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(
      response3.statusCode !== 403,
      'Admin users should have access to RBAC endpoints'
    );

  } catch (error) {
    results.errors.push({ test: 'Authorization Security', error: error.message });
    console.error('❌ Authorization security test failed:', error.message);
  }
}

async function testInputValidation() {
  console.log('\n🔍 Testing Input Validation...');
  
  const validToken = generateTestToken({ permissions: ['manage_drivers'] });
  
  try {
    // Test 1: SQL Injection attempts
    const sqlPayloads = [
      "'; DROP TABLE drivers; --",
      "' OR '1'='1",
      "1; DELETE FROM users WHERE 1=1 --",
      "' UNION SELECT * FROM users --"
    ];

    for (const payload of sqlPayloads) {
      const response = await makeRequest(`${config.baseUrl}/api/drivers?search=${encodeURIComponent(payload)}`, {
        headers: { Authorization: `Bearer ${validToken}` }
      });
      assert(
        response.statusCode !== 500,
        `SQL injection payload should not cause server error: ${payload}`
      );
    }

    // Test 2: XSS attempts
    const xssPayloads = [
      "<script>alert('xss')</script>",
      "javascript:alert('xss')",
      "<img src=x onerror=alert('xss')>",
      "';alert('xss');//"
    ];

    for (const payload of xssPayloads) {
      const response = await makeRequest(`${config.baseUrl}/api/drivers`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${validToken}` },
        body: {
          driverCode: payload,
          firstName: 'Test',
          lastName: 'User',
          phone: '+1234567890',
          address: 'Test Address',
          regionId: 'region1',
          services: ['car'],
          primaryService: 'car'
        }
      });
      
      if (response.data && response.data.driver) {
        assert(
          !response.data.driver.driverCode.includes('<script>'),
          `XSS payload should be sanitized: ${payload}`
        );
      }
    }

    // Test 3: Path traversal attempts
    const pathPayloads = [
      '../../../etc/passwd',
      '..\\..\\..\\windows\\system32\\config\\sam',
      '....//....//....//etc/passwd',
      '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd'
    ];

    for (const payload of pathPayloads) {
      const response = await makeRequest(`${config.baseUrl}/api/drivers/${encodeURIComponent(payload)}`, {
        headers: { Authorization: `Bearer ${validToken}` }
      });
      assert(
        response.statusCode !== 200 || !response.rawData.includes('root:'),
        `Path traversal should not expose system files: ${payload}`
      );
    }

  } catch (error) {
    results.errors.push({ test: 'Input Validation', error: error.message });
    console.error('❌ Input validation test failed:', error.message);
  }
}

async function testSecurityHeaders() {
  console.log('\n🔒 Testing Security Headers...');
  
  try {
    const response = await makeRequest(`${config.baseUrl}/api/health`);
    const headers = response.headers;

    assert(
      headers['x-content-type-options'] === 'nosniff',
      'X-Content-Type-Options header should be set to nosniff'
    );

    assert(
      headers['x-frame-options'] === 'DENY',
      'X-Frame-Options header should be set to DENY'
    );

    assert(
      headers['x-xss-protection'] === '1; mode=block',
      'X-XSS-Protection header should be enabled'
    );

    assert(
      headers['strict-transport-security']?.includes('max-age='),
      'Strict-Transport-Security header should be present',
      'warning'
    );

    assert(
      headers['content-security-policy']?.includes("default-src 'self'"),
      'Content-Security-Policy header should be restrictive',
      'warning'
    );

  } catch (error) {
    results.errors.push({ test: 'Security Headers', error: error.message });
    console.error('❌ Security headers test failed:', error.message);
  }
}

async function testRateLimiting() {
  console.log('\n⏱️ Testing Rate Limiting...');
  
  try {
    const requests = [];
    const endpoint = `${config.baseUrl}/api/health`;
    
    // Send rapid requests to trigger rate limiting
    for (let i = 0; i < 20; i++) {
      requests.push(makeRequest(endpoint));
    }

    const responses = await Promise.all(requests);
    const rateLimited = responses.some(r => r.statusCode === 429);
    
    assert(
      rateLimited,
      'Rate limiting should be enforced for rapid requests',
      'warning'
    );

  } catch (error) {
    results.errors.push({ test: 'Rate Limiting', error: error.message });
    console.error('❌ Rate limiting test failed:', error.message);
  }
}

async function testErrorHandling() {
  console.log('\n🚨 Testing Error Handling...');
  
  try {
    // Test 1: Non-existent endpoint should return 404
    const response1 = await makeRequest(`${config.baseUrl}/api/nonexistent`);
    assert(
      response1.statusCode === 404,
      'Non-existent endpoints should return 404'
    );

    // Test 2: Invalid JSON should not crash the server
    const response2 = await makeRequest(`${config.baseUrl}/api/drivers`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${generateTestToken()}`,
        'Content-Type': 'application/json'
      },
      body: 'invalid-json-content'
    });
    assert(
      response2.statusCode === 400,
      'Invalid JSON should return 400 Bad Request'
    );

    // Test 3: Error responses should not leak sensitive information
    const response3 = await makeRequest(`${config.baseUrl}/api/drivers/invalid-id`, {
      headers: { Authorization: `Bearer ${generateTestToken()}` }
    });
    
    if (response3.rawData) {
      assert(
        !response3.rawData.includes('password') && !response3.rawData.includes('secret'),
        'Error responses should not contain sensitive information'
      );
    }

  } catch (error) {
    results.errors.push({ test: 'Error Handling', error: error.message });
    console.error('❌ Error handling test failed:', error.message);
  }
}

// Main test execution
async function runSecurityTests() {
  console.log('🛡️ Starting API Security Test Suite...');
  console.log(`Base URL: ${config.baseUrl}`);
  console.log('=' * 50);

  try {
    // Health check first
    const healthResponse = await makeRequest(`${config.baseUrl}/api/health`);
    if (healthResponse.statusCode !== 200) {
      console.error('❌ Application is not responding correctly');
      process.exit(1);
    }
    console.log('✅ Application is running');

    // Run all test suites
    await testAuthenticationSecurity();
    await testAuthorizationSecurity();
    await testInputValidation();
    await testSecurityHeaders();
    await testRateLimiting();
    await testErrorHandling();

  } catch (error) {
    console.error('❌ Test suite failed to run:', error.message);
    process.exit(1);
  }

  // Print results
  console.log('\n' + '=' * 50);
  console.log('🛡️ Security Test Results');
  console.log('=' * 50);
  console.log(`✅ Tests Passed: ${results.passed}`);
  console.log(`❌ Tests Failed: ${results.failed}`);
  console.log(`⚠️  Warnings: ${results.warnings.length}`);

  if (results.errors.length > 0) {
    console.log('\n❌ Critical Security Issues Found:');
    results.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.test}: ${error.error || 'Failed'}`);
    });
  }

  if (results.warnings.length > 0) {
    console.log('\n⚠️  Security Warnings:');
    results.warnings.forEach((warning, index) => {
      console.log(`${index + 1}. ${warning.test}`);
    });
  }

  // Exit with appropriate code
  const exitCode = results.failed > 0 ? 1 : 0;
  console.log(`\n🏁 Security tests completed with exit code: ${exitCode}`);
  process.exit(exitCode);
}

// Run tests if this file is executed directly
if (require.main === module) {
  runSecurityTests().catch(error => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { runSecurityTests, makeRequest, generateTestToken };