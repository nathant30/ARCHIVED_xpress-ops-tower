#!/usr/bin/env node

/**
 * Comprehensive API Security Testing Suite for Xpress Ops Tower
 * Tests authentication, authorization, input validation, and security controls
 */

const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class APISecurityTester {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.results = {
      timestamp: new Date().toISOString(),
      total_tests: 0,
      passed: 0,
      failed: 0,
      vulnerabilities: [],
      summary: {}
    };
    
    // Test user credentials (should be configured for test environment)
    this.testUsers = {
      admin: { email: 'admin@test.com', password: 'AdminTest123!' },
      driver: { email: 'driver@test.com', password: 'DriverTest123!' },
      passenger: { email: 'passenger@test.com', password: 'PassengerTest123!' },
      unauthorized: { email: 'fake@test.com', password: 'wrong' }
    };
    
    this.tokens = {};
    this.testSuites = [];
    
    this.setupTestSuites();
  }

  setupTestSuites() {
    this.testSuites = [
      {
        name: 'Authentication Security',
        category: 'auth',
        tests: [
          this.testUnauthenticatedAccess.bind(this),
          this.testWeakPasswordHandling.bind(this),
          this.testBruteForceProtection.bind(this),
          this.testSessionSecurity.bind(this),
          this.testPasswordResetSecurity.bind(this),
          this.testMFASecurity.bind(this)
        ]
      },
      {
        name: 'Authorization Security',
        category: 'authz',
        tests: [
          this.testRoleBasedAccess.bind(this),
          this.testPrivilegeEscalation.bind(this),
          this.testResourceAccessControl.bind(this),
          this.testCrossUserDataAccess.bind(this)
        ]
      },
      {
        name: 'Input Validation',
        category: 'input',
        tests: [
          this.testSQLInjection.bind(this),
          this.testXSSProtection.bind(this),
          this.testNoSQLInjection.bind(this),
          this.testCommandInjection.bind(this),
          this.testPathTraversal.bind(this),
          this.testXXEProtection.bind(this)
        ]
      },
      {
        name: 'Emergency System Security',
        category: 'emergency',
        tests: [
          this.testEmergencyEndpointSecurity.bind(this),
          this.testSOSDataValidation.bind(this),
          this.testEmergencyRateLimiting.bind(this),
          this.testEmergencyDataIntegrity.bind(this)
        ]
      },
      {
        name: 'Data Protection',
        category: 'data',
        tests: [
          this.testPIIProtection.bind(this),
          this.testDataLeakage.bind(this),
          this.testLocationDataSecurity.bind(this),
          this.testPaymentDataSecurity.bind(this)
        ]
      },
      {
        name: 'Infrastructure Security',
        category: 'infrastructure',
        tests: [
          this.testSecurityHeaders.bind(this),
          this.testCORSConfiguration.bind(this),
          this.testHTTPSRedirection.bind(this),
          this.testErrorHandling.bind(this),
          this.testRateLimiting.bind(this)
        ]
      }
    ];
  }

  async runAllTests() {
    console.log('🔒 Starting API Security Test Suite...');
    console.log(`Base URL: ${this.baseUrl}`);
    
    const startTime = Date.now();
    
    try {
      // Setup test environment
      await this.setupTestEnvironment();
      
      // Run all test suites
      for (const suite of this.testSuites) {
        console.log(`\n📋 Running ${suite.name} tests...`);
        
        for (const test of suite.tests) {
          try {
            this.results.total_tests++;
            const result = await test();
            
            if (result.passed) {
              this.results.passed++;
            } else {
              this.results.failed++;
              this.results.vulnerabilities.push({
                category: suite.category,
                test: test.name,
                severity: result.severity || 'medium',
                description: result.description,
                recommendation: result.recommendation,
                technical_details: result.technical_details,
                timestamp: new Date().toISOString()
              });
            }
          } catch (error) {
            this.results.failed++;
            this.results.vulnerabilities.push({
              category: suite.category,
              test: test.name || 'Unknown Test',
              severity: 'high',
              description: `Test execution failed: ${error.message}`,
              recommendation: 'Review test implementation and fix underlying issues',
              technical_details: error.stack,
              timestamp: new Date().toISOString()
            });
          }
        }
      }
      
      // Calculate results
      this.results.duration_ms = Date.now() - startTime;
      this.results.success_rate = Math.round((this.results.passed / this.results.total_tests) * 100);
      this.calculateRiskLevel();
      
      // Generate report
      await this.generateSecurityReport();
      
      console.log('\n🔒 API Security Test Suite Completed');
      console.log(`📊 Results: ${this.results.passed}/${this.results.total_tests} tests passed`);
      console.log(`⚠️  Vulnerabilities: ${this.results.vulnerabilities.length}`);
      console.log(`📈 Success Rate: ${this.results.success_rate}%`);
      
      // Exit with error if critical vulnerabilities found
      const criticalVulns = this.results.vulnerabilities.filter(v => v.severity === 'critical').length;
      if (criticalVulns > 0) {
        console.log(`❌ ${criticalVulns} critical vulnerabilities found - failing pipeline`);
        process.exit(1);
      }
      
      return this.results;
      
    } catch (error) {
      console.error('Security test suite failed:', error);
      process.exit(1);
    }
  }

  async setupTestEnvironment() {
    console.log('🔧 Setting up test environment...');
    
    // Authenticate test users
    for (const [role, credentials] of Object.entries(this.testUsers)) {
      if (role === 'unauthorized') continue;
      
      try {
        const response = await this.makeRequest('POST', '/api/auth/login', {
          body: credentials,
          timeout: 10000
        });
        
        if (response.data && response.data.token) {
          this.tokens[role] = response.data.token;
        }
      } catch (error) {
        console.warn(`Failed to authenticate ${role} user:`, error.message);
      }
    }
    
    console.log(`✅ Authenticated ${Object.keys(this.tokens).length} test users`);
  }

  // ==========================================
  // AUTHENTICATION SECURITY TESTS
  // ==========================================

  async testUnauthenticatedAccess() {
    const protectedEndpoints = [
      '/api/drivers',
      '/api/passengers', 
      '/api/bookings',
      '/api/analytics',
      '/api/admin/users',
      '/api/emergency/responses'
    ];
    
    for (const endpoint of protectedEndpoints) {
      try {
        const response = await this.makeRequest('GET', endpoint);
        
        if (response.status === 200) {
          return {
            passed: false,
            severity: 'high',
            description: `Protected endpoint ${endpoint} accessible without authentication`,
            recommendation: 'Ensure all protected endpoints require authentication',
            technical_details: `HTTP ${response.status} - ${endpoint} returned data without token`
          };
        }
      } catch (error) {
        // 401/403 responses are expected for protected endpoints
        if (!error.response || ![401, 403].includes(error.response.status)) {
          return {
            passed: false,
            severity: 'medium',
            description: `Unexpected response from protected endpoint ${endpoint}`,
            recommendation: 'Review endpoint security implementation',
            technical_details: error.message
          };
        }
      }
    }
    
    return { passed: true };
  }

  async testWeakPasswordHandling() {
    const weakPasswords = [
      'password',
      '123456',
      'admin',
      'test',
      'qwerty',
      '12345678'
    ];
    
    for (const password of weakPasswords) {
      try {
        const response = await this.makeRequest('POST', '/api/auth/register', {
          body: {
            email: `test${Date.now()}@example.com`,
            password: password,
            name: 'Test User'
          }
        });
        
        if (response.status === 200 || response.status === 201) {
          return {
            passed: false,
            severity: 'medium',
            description: 'Weak password accepted during registration',
            recommendation: 'Implement strong password policy validation',
            technical_details: `Weak password "${password}" was accepted`
          };
        }
      } catch (error) {
        // Password rejection is expected
      }
    }
    
    return { passed: true };
  }

  async testBruteForceProtection() {
    const attempts = 6; // Should trigger rate limiting
    let successCount = 0;
    
    for (let i = 0; i < attempts; i++) {
      try {
        const response = await this.makeRequest('POST', '/api/auth/login', {
          body: {
            email: 'nonexistent@test.com',
            password: 'wrongpassword'
          }
        });
        
        if (response.status !== 429) {
          successCount++;
        }
      } catch (error) {
        if (error.response && error.response.status === 429) {
          // Rate limiting working
          return { passed: true };
        }
      }
    }
    
    if (successCount >= attempts - 1) {
      return {
        passed: false,
        severity: 'high',
        description: 'No brute force protection detected on login endpoint',
        recommendation: 'Implement rate limiting and account lockout mechanisms',
        technical_details: `${successCount} login attempts succeeded without rate limiting`
      };
    }
    
    return { passed: true };
  }

  async testSessionSecurity() {
    if (!this.tokens.driver) {
      return { passed: false, description: 'No test token available' };
    }
    
    // Test session invalidation
    try {
      await this.makeRequest('POST', '/api/auth/logout', {
        headers: { 'Authorization': `Bearer ${this.tokens.driver}` }
      });
      
      // Try to use invalidated token
      const response = await this.makeRequest('GET', '/api/drivers/profile', {
        headers: { 'Authorization': `Bearer ${this.tokens.driver}` }
      });
      
      if (response.status === 200) {
        return {
          passed: false,
          severity: 'high',
          description: 'Session not properly invalidated after logout',
          recommendation: 'Implement proper session invalidation on logout',
          technical_details: 'Token still valid after logout'
        };
      }
    } catch (error) {
      // Token rejection expected after logout
    }
    
    return { passed: true };
  }

  async testPasswordResetSecurity() {
    // Test password reset without proper verification
    try {
      const response = await this.makeRequest('POST', '/api/auth/password-reset', {
        body: { email: 'admin@test.com' }
      });
      
      // Should not reveal if email exists
      if (response.data && response.data.message && 
          response.data.message.toLowerCase().includes('not found')) {
        return {
          passed: false,
          severity: 'low',
          description: 'Password reset reveals user existence',
          recommendation: 'Use consistent messaging regardless of email existence',
          technical_details: 'Password reset response varies based on email existence'
        };
      }
    } catch (error) {
      // Some error is expected
    }
    
    return { passed: true };
  }

  async testMFASecurity() {
    // Test MFA bypass attempts
    if (!this.tokens.admin) {
      return { passed: true }; // Skip if no admin token
    }
    
    try {
      const response = await this.makeRequest('POST', '/api/admin/critical-action', {
        headers: { 'Authorization': `Bearer ${this.tokens.admin}` },
        body: { action: 'delete_all_data' }
      });
      
      if (response.status === 200 && !response.data.mfa_required) {
        return {
          passed: false,
          severity: 'critical',
          description: 'Critical admin actions do not require MFA',
          recommendation: 'Implement MFA for all critical administrative actions',
          technical_details: 'Admin action completed without MFA verification'
        };
      }
    } catch (error) {
      // MFA requirement expected
    }
    
    return { passed: true };
  }

  // ==========================================
  // AUTHORIZATION SECURITY TESTS
  // ==========================================

  async testRoleBasedAccess() {
    const testCases = [
      {
        endpoint: '/api/admin/users',
        role: 'driver',
        shouldFail: true
      },
      {
        endpoint: '/api/admin/system-config',
        role: 'passenger',
        shouldFail: true
      },
      {
        endpoint: '/api/drivers/earnings',
        role: 'passenger',
        shouldFail: true
      }
    ];
    
    for (const testCase of testCases) {
      if (!this.tokens[testCase.role]) continue;
      
      try {
        const response = await this.makeRequest('GET', testCase.endpoint, {
          headers: { 'Authorization': `Bearer ${this.tokens[testCase.role]}` }
        });
        
        if (testCase.shouldFail && response.status === 200) {
          return {
            passed: false,
            severity: 'high',
            description: `Role-based access control failure: ${testCase.role} can access ${testCase.endpoint}`,
            recommendation: 'Implement proper role-based authorization checks',
            technical_details: `${testCase.role} accessed ${testCase.endpoint} (HTTP ${response.status})`
          };
        }
      } catch (error) {
        // Access denial expected for unauthorized roles
      }
    }
    
    return { passed: true };
  }

  async testPrivilegeEscalation() {
    if (!this.tokens.driver) {
      return { passed: true };
    }
    
    // Try to escalate privileges
    const escalationAttempts = [
      {
        endpoint: '/api/users/role',
        body: { role: 'admin' }
      },
      {
        endpoint: '/api/drivers/permissions',
        body: { permissions: ['admin', 'super_user'] }
      }
    ];
    
    for (const attempt of escalationAttempts) {
      try {
        const response = await this.makeRequest('POST', attempt.endpoint, {
          headers: { 'Authorization': `Bearer ${this.tokens.driver}` },
          body: attempt.body
        });
        
        if (response.status === 200) {
          return {
            passed: false,
            severity: 'critical',
            description: 'Privilege escalation vulnerability detected',
            recommendation: 'Implement proper privilege escalation prevention',
            technical_details: `Driver user able to escalate privileges via ${attempt.endpoint}`
          };
        }
      } catch (error) {
        // Privilege escalation should be prevented
      }
    }
    
    return { passed: true };
  }

  async testResourceAccessControl() {
    // Test accessing other users' resources
    if (!this.tokens.driver || !this.tokens.passenger) {
      return { passed: true };
    }
    
    const resourceTests = [
      '/api/drivers/123/profile', // Different driver ID
      '/api/bookings/456', // Different user's booking
      '/api/payments/789' // Different user's payment
    ];
    
    for (const resource of resourceTests) {
      try {
        const response = await this.makeRequest('GET', resource, {
          headers: { 'Authorization': `Bearer ${this.tokens.passenger}` }
        });
        
        if (response.status === 200) {
          return {
            passed: false,
            severity: 'high',
            description: 'Inadequate resource access control',
            recommendation: 'Implement proper resource ownership validation',
            technical_details: `User able to access other user's resource: ${resource}`
          };
        }
      } catch (error) {
        // Access denial expected
      }
    }
    
    return { passed: true };
  }

  async testCrossUserDataAccess() {
    // Test IDOR (Insecure Direct Object Reference) vulnerabilities
    if (!this.tokens.driver) {
      return { passed: true };
    }
    
    const idorTests = [
      '/api/users/1',
      '/api/users/2', 
      '/api/drivers/1',
      '/api/passengers/1'
    ];
    
    for (const endpoint of idorTests) {
      try {
        const response = await this.makeRequest('GET', endpoint, {
          headers: { 'Authorization': `Bearer ${this.tokens.driver}` }
        });
        
        if (response.status === 200 && response.data) {
          return {
            passed: false,
            severity: 'high',
            description: 'Insecure Direct Object Reference (IDOR) vulnerability',
            recommendation: 'Implement proper authorization checks for object access',
            technical_details: `User able to access other user's data via ${endpoint}`
          };
        }
      } catch (error) {
        // Access denial expected
      }
    }
    
    return { passed: true };
  }

  // ==========================================
  // INPUT VALIDATION TESTS
  // ==========================================

  async testSQLInjection() {
    const sqlPayloads = [
      "1' OR '1'='1",
      "1'; DROP TABLE users; --",
      "1' UNION SELECT * FROM drivers --",
      "' OR 1=1 --",
      "admin'--",
      "admin' /*",
      "' OR 1=1#"
    ];
    
    const endpoints = [
      '/api/users/search',
      '/api/drivers/search',
      '/api/bookings/search'
    ];
    
    for (const endpoint of endpoints) {
      for (const payload of sqlPayloads) {
        try {
          const response = await this.makeRequest('GET', `${endpoint}?q=${encodeURIComponent(payload)}`);
          
          // Check for SQL error messages or unexpected data
          if (response.data && typeof response.data === 'string') {
            if (response.data.includes('SQL') || 
                response.data.includes('syntax error') ||
                response.data.includes('mysql_') ||
                response.data.includes('postgres')) {
              return {
                passed: false,
                severity: 'critical',
                description: 'SQL injection vulnerability detected',
                recommendation: 'Use parameterized queries and input sanitization',
                technical_details: `SQL injection payload successful: ${payload} on ${endpoint}`
              };
            }
          }
        } catch (error) {
          // Errors are expected for malicious input
        }
      }
    }
    
    return { passed: true };
  }

  async testXSSProtection() {
    const xssPayloads = [
      '<script>alert("xss")</script>',
      '<img src=x onerror=alert("xss")>',
      'javascript:alert("xss")',
      '<svg onload=alert("xss")>',
      '"><script>alert("xss")</script>',
      "'; alert('xss'); //",
      '<iframe src="javascript:alert(`xss`)"></iframe>'
    ];
    
    for (const payload of xssPayloads) {
      try {
        const response = await this.makeRequest('POST', '/api/feedback', {
          body: { message: payload },
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.status === 200) {
          const responseText = JSON.stringify(response.data);
          if (responseText.includes('<script>') || 
              responseText.includes('onerror=') ||
              responseText.includes('javascript:')) {
            return {
              passed: false,
              severity: 'high',
              description: 'XSS vulnerability: Unescaped user input in response',
              recommendation: 'Implement proper output encoding and Content Security Policy',
              technical_details: `XSS payload reflected: ${payload}`
            };
          }
        }
      } catch (error) {
        // Input validation working if request fails
      }
    }
    
    return { passed: true };
  }

  async testNoSQLInjection() {
    const noSQLPayloads = [
      { "$ne": null },
      { "$gt": "" },
      { "$regex": ".*" },
      { "$where": "function() { return true; }" },
      { "user": { "$ne": null }, "password": { "$ne": null } }
    ];
    
    for (const payload of noSQLPayloads) {
      try {
        const response = await this.makeRequest('POST', '/api/auth/login', {
          body: payload
        });
        
        if (response.status === 200) {
          return {
            passed: false,
            severity: 'critical',
            description: 'NoSQL injection vulnerability detected',
            recommendation: 'Validate and sanitize all input data, use proper query builders',
            technical_details: `NoSQL injection successful with payload: ${JSON.stringify(payload)}`
          };
        }
      } catch (error) {
        // Injection prevention working
      }
    }
    
    return { passed: true };
  }

  async testCommandInjection() {
    const cmdPayloads = [
      '; cat /etc/passwd',
      '& dir',
      '| whoami',
      '`id`',
      '$(ls -la)',
      '; rm -rf /',
      '&& netstat -an'
    ];
    
    for (const payload of cmdPayloads) {
      try {
        const response = await this.makeRequest('POST', '/api/system/backup', {
          body: { filename: payload }
        });
        
        if (response.status === 200 && response.data) {
          const responseText = JSON.stringify(response.data);
          if (responseText.includes('root:') ||
              responseText.includes('passwd') ||
              responseText.includes('bin/bash') ||
              responseText.includes('LISTEN')) {
            return {
              passed: false,
              severity: 'critical',
              description: 'Command injection vulnerability detected',
              recommendation: 'Never execute user input as system commands, use safe alternatives',
              technical_details: `Command injection successful: ${payload}`
            };
          }
        }
      } catch (error) {
        // Command injection prevention working
      }
    }
    
    return { passed: true };
  }

  async testPathTraversal() {
    const pathPayloads = [
      '../../../etc/passwd',
      '..\\..\\..\\windows\\system32\\drivers\\etc\\hosts',
      '....//....//....//etc/passwd',
      '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
      '..%252f..%252f..%252fetc%252fpasswd'
    ];
    
    for (const payload of pathPayloads) {
      try {
        const response = await this.makeRequest('GET', `/api/files/${encodeURIComponent(payload)}`);
        
        if (response.status === 200 && response.data) {
          const responseText = JSON.stringify(response.data);
          if (responseText.includes('root:') || responseText.includes('localhost')) {
            return {
              passed: false,
              severity: 'high',
              description: 'Path traversal vulnerability detected',
              recommendation: 'Validate file paths and restrict file access to allowed directories',
              technical_details: `Path traversal successful: ${payload}`
            };
          }
        }
      } catch (error) {
        // Path traversal prevention working
      }
    }
    
    return { passed: true };
  }

  async testXXEProtection() {
    const xxePayload = `<?xml version="1.0"?>
    <!DOCTYPE root [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>
    <root>&xxe;</root>`;
    
    try {
      const response = await this.makeRequest('POST', '/api/import/xml', {
        body: xxePayload,
        headers: { 'Content-Type': 'application/xml' }
      });
      
      if (response.status === 200 && response.data) {
        const responseText = JSON.stringify(response.data);
        if (responseText.includes('root:') || responseText.includes('passwd')) {
          return {
            passed: false,
            severity: 'high',
            description: 'XML External Entity (XXE) vulnerability detected',
            recommendation: 'Disable external entity processing in XML parsers',
            technical_details: 'XXE attack successfully read system files'
          };
        }
      }
    } catch (error) {
      // XXE prevention working or endpoint doesn't exist
    }
    
    return { passed: true };
  }

  // ==========================================
  // EMERGENCY SYSTEM TESTS
  // ==========================================

  async testEmergencyEndpointSecurity() {
    const emergencyEndpoints = [
      '/api/emergency/sos',
      '/api/emergency/panic-button',
      '/api/emergency/medical-alert'
    ];
    
    for (const endpoint of emergencyEndpoints) {
      try {
        // Test without authentication
        const response = await this.makeRequest('POST', endpoint, {
          body: { emergency: true, location: { lat: 0, lng: 0 } }
        });
        
        if (response.status === 200) {
          // Emergency endpoints might allow some access for safety
          // But should still validate input
          continue;
        }
      } catch (error) {
        // Some form of protection should exist
        if (error.response && error.response.status === 500) {
          return {
            passed: false,
            severity: 'high',
            description: 'Emergency endpoint has insufficient error handling',
            recommendation: 'Implement proper error handling for emergency systems',
            technical_details: `Emergency endpoint ${endpoint} returned server error`
          };
        }
      }
    }
    
    return { passed: true };
  }

  async testSOSDataValidation() {
    const invalidSOSData = [
      { reporterId: null, location: null },
      { location: { latitude: 200, longitude: 300 } }, // Invalid coordinates
      { emergencyType: '<script>alert("xss")</script>' },
      { description: 'A'.repeat(10000) }, // Extremely long description
      { location: "'; DROP TABLE emergency_reports; --" }
    ];
    
    for (const invalidData of invalidSOSData) {
      try {
        const response = await this.makeRequest('POST', '/api/emergency/sos', {
          body: invalidData
        });
        
        if (response.status === 200) {
          return {
            passed: false,
            severity: 'high',
            description: 'SOS data validation insufficient',
            recommendation: 'Implement strict validation for all emergency data fields',
            technical_details: `Invalid SOS data accepted: ${JSON.stringify(invalidData)}`
          };
        }
      } catch (error) {
        // Validation working if invalid data rejected
      }
    }
    
    return { passed: true };
  }

  async testEmergencyRateLimiting() {
    const attempts = 20; // High number of emergency requests
    let successCount = 0;
    
    for (let i = 0; i < attempts; i++) {
      try {
        const response = await this.makeRequest('POST', '/api/emergency/sos', {
          body: {
            emergencyType: 'medical',
            location: { latitude: 14.5995, longitude: 120.9842 }
          }
        });
        
        if (response.status === 200 || response.status === 201) {
          successCount++;
        }
      } catch (error) {
        if (error.response && error.response.status === 429) {
          // Rate limiting in place - but should be careful with emergencies
          break;
        }
      }
    }
    
    // Emergency systems should have some rate limiting but be more permissive
    if (successCount === attempts) {
      return {
        passed: false,
        severity: 'medium',
        description: 'No rate limiting on emergency endpoints',
        recommendation: 'Implement intelligent rate limiting for emergency systems',
        technical_details: 'All emergency requests succeeded without rate limiting'
      };
    }
    
    return { passed: true };
  }

  async testEmergencyDataIntegrity() {
    // Test emergency data encryption and integrity
    try {
      const response = await this.makeRequest('POST', '/api/emergency/sos', {
        body: {
          emergencyType: 'security',
          location: { latitude: 14.5995, longitude: 120.9842 },
          sensitiveData: 'This should be encrypted'
        }
      });
      
      if (response.data && typeof response.data === 'string') {
        if (response.data.includes('This should be encrypted')) {
          return {
            passed: false,
            severity: 'high',
            description: 'Emergency data not properly encrypted',
            recommendation: 'Encrypt sensitive emergency data in transit and at rest',
            technical_details: 'Sensitive emergency data visible in response'
          };
        }
      }
    } catch (error) {
      // Some level of protection expected
    }
    
    return { passed: true };
  }

  // ==========================================
  // DATA PROTECTION TESTS
  // ==========================================

  async testPIIProtection() {
    if (!this.tokens.driver) {
      return { passed: true };
    }
    
    try {
      const response = await this.makeRequest('GET', '/api/drivers/profile', {
        headers: { 'Authorization': `Bearer ${this.tokens.driver}` }
      });
      
      if (response.data) {
        const responseText = JSON.stringify(response.data);
        
        // Check for exposed sensitive data patterns
        const sensitivePatterns = [
          /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Credit card
          /\b\d{3}-\d{2}-\d{4}\b/, // SSN
          /password/i,
          /secret/i,
          /private.*key/i
        ];
        
        for (const pattern of sensitivePatterns) {
          if (pattern.test(responseText)) {
            return {
              passed: false,
              severity: 'high',
              description: 'Potentially sensitive data exposed in API response',
              recommendation: 'Filter out sensitive data from API responses',
              technical_details: 'Sensitive data pattern detected in response'
            };
          }
        }
      }
    } catch (error) {
      // API protection working
    }
    
    return { passed: true };
  }

  async testDataLeakage() {
    // Test for information disclosure in error messages
    try {
      const response = await this.makeRequest('GET', '/api/nonexistent-endpoint-test');
      
      if (response.data && typeof response.data === 'string') {
        const responseText = response.data.toLowerCase();
        
        if (responseText.includes('database') || 
            responseText.includes('server error') ||
            responseText.includes('stack trace') ||
            responseText.includes('mysql') ||
            responseText.includes('postgres')) {
          return {
            passed: false,
            severity: 'medium',
            description: 'Information disclosure in error messages',
            recommendation: 'Use generic error messages for client-facing responses',
            technical_details: 'Technical details exposed in error response'
          };
        }
      }
    } catch (error) {
      // Error handling working
    }
    
    return { passed: true };
  }

  async testLocationDataSecurity() {
    // Test location data handling
    if (!this.tokens.driver) {
      return { passed: true };
    }
    
    try {
      const response = await this.makeRequest('POST', '/api/drivers/location', {
        headers: { 'Authorization': `Bearer ${this.tokens.driver}` },
        body: {
          latitude: 14.5995,
          longitude: 120.9842,
          accuracy: 10
        }
      });
      
      // Location data should be handled securely
      if (response.status === 200) {
        // Check if location is stored without encryption markers
        const responseText = JSON.stringify(response.data || {});
        if (responseText.includes('14.5995') && responseText.includes('120.9842')) {
          return {
            passed: false,
            severity: 'medium',
            description: 'Location data may not be properly encrypted',
            recommendation: 'Encrypt location data and implement proper access controls',
            technical_details: 'Raw location coordinates visible in response'
          };
        }
      }
    } catch (error) {
      // Location protection working
    }
    
    return { passed: true };
  }

  async testPaymentDataSecurity() {
    // Test payment data handling
    const paymentData = {
      cardNumber: '4111111111111111',
      expiryDate: '12/25',
      cvv: '123'
    };
    
    try {
      const response = await this.makeRequest('POST', '/api/payments/card', {
        body: paymentData
      });
      
      if (response.status === 200 && response.data) {
        const responseText = JSON.stringify(response.data);
        
        if (responseText.includes('4111111111111111') || 
            responseText.includes('123')) {
          return {
            passed: false,
            severity: 'critical',
            description: 'Payment data not properly masked or encrypted',
            recommendation: 'Never store or return full payment card details',
            technical_details: 'Full payment card details visible in response'
          };
        }
      }
    } catch (error) {
      // Payment validation working
    }
    
    return { passed: true };
  }

  // ==========================================
  // INFRASTRUCTURE SECURITY TESTS
  // ==========================================

  async testSecurityHeaders() {
    try {
      const response = await this.makeRequest('GET', '/');
      const headers = response.headers || {};
      
      const requiredHeaders = {
        'strict-transport-security': 'HSTS not configured',
        'x-content-type-options': 'Content type sniffing protection missing',
        'x-frame-options': 'Clickjacking protection missing',
        'x-xss-protection': 'XSS protection header missing',
        'content-security-policy': 'Content Security Policy missing'
      };
      
      for (const [header, description] of Object.entries(requiredHeaders)) {
        if (!headers[header] && !headers[header.toLowerCase()]) {
          return {
            passed: false,
            severity: 'medium',
            description: description,
            recommendation: 'Configure all recommended security headers',
            technical_details: `Missing header: ${header}`
          };
        }
      }
    } catch (error) {
      return {
        passed: false,
        severity: 'low',
        description: 'Unable to check security headers',
        recommendation: 'Ensure application is accessible for security testing',
        technical_details: error.message
      };
    }
    
    return { passed: true };
  }

  async testCORSConfiguration() {
    try {
      const response = await this.makeRequest('OPTIONS', '/api/drivers', {
        headers: {
          'Origin': 'https://malicious-site.com',
          'Access-Control-Request-Method': 'POST'
        }
      });
      
      const corsHeaders = response.headers || {};
      const allowOrigin = corsHeaders['access-control-allow-origin'];
      
      if (allowOrigin === '*') {
        return {
          passed: false,
          severity: 'medium',
          description: 'CORS policy too permissive',
          recommendation: 'Configure CORS to allow only trusted origins',
          technical_details: 'Access-Control-Allow-Origin: * allows any origin'
        };
      }
    } catch (error) {
      // CORS restrictions working
    }
    
    return { passed: true };
  }

  async testHTTPSRedirection() {
    // This would need to test actual HTTPS configuration
    // For now, check if running on HTTP in production-like environment
    if (this.baseUrl.startsWith('http://') && !this.baseUrl.includes('localhost')) {
      return {
        passed: false,
        severity: 'high',
        description: 'HTTPS not enforced',
        recommendation: 'Use HTTPS for all communications, especially for emergency systems',
        technical_details: 'Application accessible via HTTP instead of HTTPS'
      };
    }
    
    return { passed: true };
  }

  async testErrorHandling() {
    const errorTriggers = [
      '/api/drivers/undefined',
      '/api/bookings/null',
      '/api/emergency/malformed-request',
      '/api/users/{"invalid":"json"}'
    ];
    
    for (const trigger of errorTriggers) {
      try {
        const response = await this.makeRequest('GET', trigger);
        
        if (response.data && typeof response.data === 'string') {
          const responseText = response.data.toLowerCase();
          
          if (responseText.includes('stack trace') || 
              responseText.includes('internal server error') ||
              responseText.includes('database connection') ||
              responseText.includes('file not found')) {
            return {
              passed: false,
              severity: 'low',
              description: 'Verbose error messages expose system details',
              recommendation: 'Use generic error messages for external responses',
              technical_details: `Verbose error in response to ${trigger}`
            };
          }
        }
      } catch (error) {
        // Proper error handling working
      }
    }
    
    return { passed: true };
  }

  async testRateLimiting() {
    const attempts = 15; // Should trigger rate limiting
    let blockedCount = 0;
    
    for (let i = 0; i < attempts; i++) {
      try {
        const response = await this.makeRequest('GET', '/api/public/status');
        
        if (response.status === 429) {
          blockedCount++;
        }
      } catch (error) {
        if (error.response && error.response.status === 429) {
          blockedCount++;
        }
      }
    }
    
    if (blockedCount === 0) {
      return {
        passed: false,
        severity: 'medium',
        description: 'No rate limiting detected',
        recommendation: 'Implement rate limiting to prevent abuse',
        technical_details: `${attempts} requests succeeded without rate limiting`
      };
    }
    
    return { passed: true };
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  async makeRequest(method, path, options = {}) {
    const url = `${this.baseUrl}${path}`;
    const config = {
      method,
      url,
      timeout: options.timeout || 10000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SecurityTester/1.0',
        ...(options.headers || {})
      },
      validateStatus: () => true // Don't throw on HTTP error codes
    };
    
    if (options.body) {
      if (options.headers && options.headers['Content-Type'] === 'application/xml') {
        config.data = options.body;
      } else {
        config.data = options.body;
      }
    }
    
    return await axios(config);
  }

  calculateRiskLevel() {
    let score = 0;
    
    this.results.vulnerabilities.forEach(vuln => {
      switch (vuln.severity) {
        case 'critical': score += 10; break;
        case 'high': score += 7; break;
        case 'medium': score += 4; break;
        case 'low': score += 1; break;
      }
    });
    
    if (score === 0) {
      this.results.risk_level = 'low';
    } else if (score < 10) {
      this.results.risk_level = 'medium';
    } else if (score < 25) {
      this.results.risk_level = 'high';
    } else {
      this.results.risk_level = 'critical';
    }
    
    this.results.risk_score = score;
  }

  async generateSecurityReport() {
    const reportPath = path.join(process.cwd(), 'security-test-results.json');
    
    const report = {
      test_info: {
        timestamp: this.results.timestamp,
        duration_ms: this.results.duration_ms,
        base_url: this.baseUrl,
        tester_version: '1.0.0'
      },
      summary: {
        total_tests: this.results.total_tests,
        passed: this.results.passed,
        failed: this.results.failed,
        success_rate: this.results.success_rate,
        risk_level: this.results.risk_level,
        risk_score: this.results.risk_score
      },
      vulnerabilities: this.results.vulnerabilities,
      recommendations: this.generateRecommendations()
    };
    
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📄 Security test report saved: ${reportPath}`);
    return reportPath;
  }

  generateRecommendations() {
    const recommendations = [];
    const criticalCount = this.results.vulnerabilities.filter(v => v.severity === 'critical').length;
    const highCount = this.results.vulnerabilities.filter(v => v.severity === 'high').length;
    
    if (criticalCount > 0) {
      recommendations.push({
        priority: 'critical',
        action: 'Address all critical vulnerabilities immediately',
        description: 'Critical vulnerabilities pose immediate security risks and should be fixed before deployment',
        timeline: 'Immediate (0-24 hours)'
      });
    }
    
    if (highCount > 0) {
      recommendations.push({
        priority: 'high',
        action: 'Fix high-severity vulnerabilities within 48 hours',
        description: 'High-severity issues should be addressed as soon as possible after critical issues',
        timeline: '24-48 hours'
      });
    }
    
    recommendations.push({
      priority: 'medium',
      action: 'Implement comprehensive security testing in CI/CD pipeline',
      description: 'Regular automated security testing helps catch vulnerabilities early',
      timeline: '1-2 weeks'
    });
    
    return recommendations;
  }
}

// CLI interface
if (require.main === module) {
  const baseUrl = process.argv[2] || 'http://localhost:3000';
  const tester = new APISecurityTester(baseUrl);
  
  tester.runAllTests()
    .then(results => {
      console.log('\n🔒 API Security Test Suite completed successfully');
      
      if (results.vulnerabilities.length > 0) {
        console.log(`❌ Found ${results.vulnerabilities.length} vulnerabilities`);
        
        const criticalCount = results.vulnerabilities.filter(v => v.severity === 'critical').length;
        if (criticalCount > 0) {
          console.log(`🚨 ${criticalCount} CRITICAL vulnerabilities require immediate attention`);
          process.exit(1);
        }
      } else {
        console.log('✅ No vulnerabilities detected');
      }
    })
    .catch(error => {
      console.error('Security testing failed:', error);
      process.exit(1);
    });
}

module.exports = APISecurityTester;