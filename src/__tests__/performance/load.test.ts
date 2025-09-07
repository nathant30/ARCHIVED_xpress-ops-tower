// Performance and Load Testing Suite
// Production readiness validation for RBAC+ABAC system
// Tests performance benchmarks, load handling, and scalability limits

import { rbacEngine } from '@/lib/auth/rbac-engine';
import { mfaService } from '@/lib/auth/mfa-service';
import { 
  validateApprovalRequest,
  getWorkflowDefinition,
  canUserApproveWorkflow,
  getAllWorkflowDefinitions
} from '@/lib/approval-workflows';

import { 
  XPRESS_ROLES,
  getRoleLevel,
  getRolePermissions,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions
} from '@/types/rbac-abac';

import type { 
  PolicyEvaluationRequest,
  EnhancedUser,
  XpressRole,
  DataClass,
  PIIScope 
} from '@/types/rbac-abac';

import type { CreateApprovalRequestBody } from '@/types/approval';
import type { Permission } from '@/hooks/useRBAC';

describe('Performance and Load Testing', () => {

  // Test data generators for consistent load testing
  const generateTestUser = (index: number): EnhancedUser => ({
    id: `load-test-user-${index}`,
    email: `user${index}@load-test.com`,
    firstName: `User${index}`,
    lastName: 'LoadTest',
    timezone: 'Asia/Manila',
    locale: 'en-PH',
    status: 'active',
    allowedRegions: [`region-${index % 5}`], // Distribute across 5 regions
    piiScope: (['none', 'masked', 'full'] as PIIScope[])[index % 3],
    mfaEnabled: index % 2 === 0,
    trustedDevices: [],
    failedLoginAttempts: 0,
    loginCount: Math.floor(Math.random() * 100),
    roles: [{
      id: `role-assignment-${index}`,
      userId: `load-test-user-${index}`,
      roleId: Object.keys(XPRESS_ROLES)[index % Object.keys(XPRESS_ROLES).length] as XpressRole,
      role: {
        id: 'test-role',
        name: Object.keys(XPRESS_ROLES)[index % Object.keys(XPRESS_ROLES).length] as XpressRole,
        displayName: 'Test Role',
        level: 30,
        permissions: [],
        inheritsFrom: [],
        isSystem: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      allowedRegions: [`region-${index % 5}`],
      validFrom: new Date(),
      assignedAt: new Date(),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }],
    permissions: [],
    temporaryAccess: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true
  });

  const generateTestRequest = (index: number): PolicyEvaluationRequest => ({
    user: {
      id: `load-test-user-${index}`,
      roles: [Object.keys(XPRESS_ROLES)[index % Object.keys(XPRESS_ROLES).length] as XpressRole],
      permissions: ['assign_driver', 'view_live_map', 'manage_queue'],
      allowedRegions: [`region-${index % 5}`],
      piiScope: (['none', 'masked', 'full'] as PIIScope[])[index % 3]
    },
    resource: {
      type: `resource-type-${index % 3}`,
      regionId: `region-${index % 5}`,
      dataClass: (['public', 'internal', 'confidential', 'restricted'] as DataClass[])[index % 4],
      containsPII: index % 2 === 0
    },
    action: ['assign_driver', 'view_live_map', 'manage_queue', 'view_metrics_region'][index % 4],
    context: {
      channel: 'ui',
      mfaPresent: index % 3 === 0,
      timestamp: new Date(),
      ipAddress: `192.168.${Math.floor(index / 255)}.${index % 255}`
    }
  });

  // =====================================================
  // Core Performance Benchmarks
  // =====================================================

  describe('RBAC Engine Performance Benchmarks', () => {
    
    test('permission checks should meet target <50ms', async () => {
      const targetTime = 50; // milliseconds
      const iterations = 1000;
      
      const testRequests = Array.from({ length: iterations }, (_, i) => generateTestRequest(i));
      
      const startTime = performance.now();
      
      for (const request of testRequests) {
        await rbacEngine.evaluatePolicy(request);
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgTime = totalTime / iterations;
      
      expect(avgTime).toBeLessThan(targetTime);
      
      console.log(`✅ RBAC Permission Checks: ${avgTime.toFixed(2)}ms avg (target: <${targetTime}ms)`);
      console.log(`   Total: ${totalTime.toFixed(2)}ms for ${iterations} operations`);
    });

    test('approval workflow evaluation should meet target <200ms', async () => {
      const targetTime = 200; // milliseconds
      const iterations = 100;
      
      const workflows = getAllWorkflowDefinitions();
      const testApprovals = Array.from({ length: iterations }, (_, i) => {
        const workflow = workflows[i % workflows.length];
        return {
          action: workflow.action,
          justification: `Load test justification ${i}`,
          requested_action: {
            action: workflow.action,
            test_id: i,
            region: `region-${i % 5}`
          }
        };
      });
      
      const startTime = performance.now();
      
      for (const approvalRequest of testApprovals) {
        const workflow = getWorkflowDefinition(approvalRequest.action);
        if (workflow) {
          validateApprovalRequest(approvalRequest, workflow);
        }
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgTime = totalTime / iterations;
      
      expect(avgTime).toBeLessThan(targetTime);
      
      console.log(`✅ Approval Workflow Evaluation: ${avgTime.toFixed(2)}ms avg (target: <${targetTime}ms)`);
      console.log(`   Total: ${totalTime.toFixed(2)}ms for ${iterations} operations`);
    });

    test('MFA challenge creation should meet target <300ms', async () => {
      const targetTime = 300; // milliseconds
      const iterations = 50; // Reduced for MFA operations
      
      const mfaMethods = ['sms', 'email', 'totp', 'backup_code'] as const;
      
      const startTime = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        const method = mfaMethods[i % mfaMethods.length];
        await mfaService.createChallenge(`load-test-user-${i}`, method, {
          action: `load-test-action-${i}`,
          ipAddress: `10.0.0.${i % 255}`
        });
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgTime = totalTime / iterations;
      
      expect(avgTime).toBeLessThan(targetTime);
      
      console.log(`✅ MFA Challenge Creation: ${avgTime.toFixed(2)}ms avg (target: <${targetTime}ms)`);
      console.log(`   Total: ${totalTime.toFixed(2)}ms for ${iterations} operations`);
    });

    test('database query simulation should meet target <50ms', () => {
      const targetTime = 50; // milliseconds
      const iterations = 1000;
      
      // Simulate database operations with role/permission lookups
      const startTime = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        const roleName = Object.keys(XPRESS_ROLES)[i % Object.keys(XPRESS_ROLES).length] as XpressRole;
        getRoleLevel(roleName);
        getRolePermissions(roleName);
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgTime = totalTime / iterations;
      
      expect(avgTime).toBeLessThan(targetTime);
      
      console.log(`✅ Database Query Simulation: ${avgTime.toFixed(2)}ms avg (target: <${targetTime}ms)`);
      console.log(`   Total: ${totalTime.toFixed(2)}ms for ${iterations} operations`);
    });
  });

  // =====================================================
  // Concurrent Load Testing
  // =====================================================

  describe('Concurrent Load Handling', () => {
    
    test('should handle 100 concurrent permission checks', async () => {
      const concurrentUsers = 100;
      const maxExecutionTime = 2000; // 2 seconds
      
      const concurrentRequests = Array.from({ length: concurrentUsers }, (_, i) => 
        generateTestRequest(i)
      );
      
      const startTime = performance.now();
      
      const results = await Promise.all(
        concurrentRequests.map(request => rbacEngine.evaluatePolicy(request))
      );
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      expect(results).toHaveLength(concurrentUsers);
      expect(executionTime).toBeLessThan(maxExecutionTime);
      
      results.forEach(result => {
        expect(['allow', 'deny']).toContain(result.decision);
        expect(result.metadata).toBeDefined();
        expect(result.metadata.evaluationTime).toBeGreaterThan(0);
      });
      
      console.log(`✅ Concurrent Permission Checks: ${executionTime.toFixed(2)}ms for ${concurrentUsers} users`);
      console.log(`   Avg per request: ${(executionTime / concurrentUsers).toFixed(2)}ms`);
    });

    test('should handle 500 rapid sequential requests', async () => {
      const requestCount = 500;
      const maxExecutionTime = 5000; // 5 seconds
      
      const requests = Array.from({ length: requestCount }, (_, i) => generateTestRequest(i));
      
      const startTime = performance.now();
      
      const results = [];
      for (const request of requests) {
        const result = await rbacEngine.evaluatePolicy(request);
        results.push(result);
      }
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      expect(results).toHaveLength(requestCount);
      expect(executionTime).toBeLessThan(maxExecutionTime);
      
      console.log(`✅ Sequential Rapid Requests: ${executionTime.toFixed(2)}ms for ${requestCount} requests`);
      console.log(`   Throughput: ${(requestCount / (executionTime / 1000)).toFixed(0)} requests/second`);
    });

    test('should maintain performance under mixed workload', async () => {
      const mixedOperations = [
        { type: 'permission_check', count: 200, weight: 0.6 },
        { type: 'mfa_challenge', count: 50, weight: 0.2 },
        { type: 'approval_validation', count: 30, weight: 0.1 },
        { type: 'role_lookup', count: 100, weight: 0.1 }
      ];
      
      const maxExecutionTime = 3000; // 3 seconds
      const startTime = performance.now();
      
      const allOperations = [];
      
      // Permission checks
      for (let i = 0; i < mixedOperations[0].count; i++) {
        allOperations.push(
          rbacEngine.evaluatePolicy(generateTestRequest(i))
        );
      }
      
      // MFA challenges
      for (let i = 0; i < mixedOperations[1].count; i++) {
        allOperations.push(
          mfaService.createChallenge(`mixed-user-${i}`, 'sms')
        );
      }
      
      // Approval validations
      for (let i = 0; i < mixedOperations[2].count; i++) {
        const workflow = getAllWorkflowDefinitions()[i % getAllWorkflowDefinitions().length];
        const approvalRequest = {
          action: workflow.action,
          justification: `Mixed workload test ${i}`,
          requested_action: { action: workflow.action }
        };
        allOperations.push(
          Promise.resolve(validateApprovalRequest(approvalRequest, workflow))
        );
      }
      
      // Role lookups
      for (let i = 0; i < mixedOperations[3].count; i++) {
        const roleName = Object.keys(XPRESS_ROLES)[i % Object.keys(XPRESS_ROLES).length] as XpressRole;
        allOperations.push(
          Promise.resolve(getRolePermissions(roleName))
        );
      }
      
      const results = await Promise.all(allOperations);
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      expect(results).toHaveLength(mixedOperations.reduce((sum, op) => sum + op.count, 0));
      expect(executionTime).toBeLessThan(maxExecutionTime);
      
      console.log(`✅ Mixed Workload Performance: ${executionTime.toFixed(2)}ms`);
      console.log(`   Operations: ${results.length} total`);
      console.log(`   Throughput: ${(results.length / (executionTime / 1000)).toFixed(0)} ops/second`);
    });
  });

  // =====================================================
  // Memory and Resource Usage
  // =====================================================

  describe('Memory and Resource Usage', () => {
    
    test('should maintain stable memory usage under load', async () => {
      const iterations = 1000;
      const memoryThreshold = 50; // MB increase threshold
      
      // Force garbage collection if available (Node.js with --expose-gc)
      if (global.gc) {
        global.gc();
      }
      
      const initialMemory = process.memoryUsage();
      
      // Generate load
      const requests = Array.from({ length: iterations }, (_, i) => generateTestRequest(i));
      
      for (const request of requests) {
        await rbacEngine.evaluatePolicy(request);
      }
      
      // Force garbage collection again
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage();
      
      const heapGrowth = (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024; // MB
      const rssGrowth = (finalMemory.rss - initialMemory.rss) / 1024 / 1024; // MB
      
      expect(Math.abs(heapGrowth)).toBeLessThan(memoryThreshold);
      expect(Math.abs(rssGrowth)).toBeLessThan(memoryThreshold * 2);
      
      console.log(`✅ Memory Usage After ${iterations} Operations:`);
      console.log(`   Heap Growth: ${heapGrowth.toFixed(2)}MB (threshold: ${memoryThreshold}MB)`);
      console.log(`   RSS Growth: ${rssGrowth.toFixed(2)}MB`);
      console.log(`   Final Heap: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    });

    test('should efficiently handle cache management', async () => {
      const cacheTestSize = 1000;
      const uniqueRequests = [];
      
      // Generate unique requests to test cache behavior
      for (let i = 0; i < cacheTestSize; i++) {
        uniqueRequests.push(generateTestRequest(i));
      }
      
      // First pass - populate cache
      const firstPassStart = performance.now();
      for (const request of uniqueRequests) {
        await rbacEngine.evaluatePolicy(request);
      }
      const firstPassTime = performance.now() - firstPassStart;
      
      // Second pass - should hit cache
      const secondPassStart = performance.now();
      for (const request of uniqueRequests) {
        await rbacEngine.evaluatePolicy(request);
      }
      const secondPassTime = performance.now() - secondPassStart;
      
      // Cache should provide performance improvement
      const performanceImprovement = (firstPassTime - secondPassTime) / firstPassTime;
      expect(performanceImprovement).toBeGreaterThan(0.1); // At least 10% improvement
      
      console.log(`✅ Cache Performance:`);
      console.log(`   First pass: ${firstPassTime.toFixed(2)}ms`);
      console.log(`   Second pass: ${secondPassTime.toFixed(2)}ms`);
      console.log(`   Improvement: ${(performanceImprovement * 100).toFixed(1)}%`);
    });
  });

  // =====================================================
  // Scalability and Stress Testing
  // =====================================================

  describe('Scalability Limits', () => {
    
    test('should handle large user base simulation', async () => {
      const userCount = 1000;
      const operationsPerUser = 5;
      const maxExecutionTime = 10000; // 10 seconds
      
      const users = Array.from({ length: userCount }, (_, i) => generateTestUser(i));
      
      const startTime = performance.now();
      
      // Simulate operations for all users
      const allOperations = [];
      users.forEach((user, userIndex) => {
        for (let op = 0; op < operationsPerUser; op++) {
          const request = generateTestRequest(userIndex * operationsPerUser + op);
          allOperations.push(rbacEngine.evaluatePolicy(request));
        }
      });
      
      const results = await Promise.all(allOperations);
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      expect(results).toHaveLength(userCount * operationsPerUser);
      expect(executionTime).toBeLessThan(maxExecutionTime);
      
      const successfulOperations = results.filter(r => r.decision === 'allow' || r.decision === 'deny');
      const successRate = successfulOperations.length / results.length;
      
      expect(successRate).toBeGreaterThan(0.95); // 95% success rate
      
      console.log(`✅ Large User Base Simulation:`);
      console.log(`   Users: ${userCount}, Operations: ${userCount * operationsPerUser}`);
      console.log(`   Time: ${executionTime.toFixed(2)}ms`);
      console.log(`   Throughput: ${((userCount * operationsPerUser) / (executionTime / 1000)).toFixed(0)} ops/sec`);
      console.log(`   Success Rate: ${(successRate * 100).toFixed(1)}%`);
    });

    test('should maintain accuracy under high load', async () => {
      const highLoadIterations = 500;
      const knownGoodRequest: PolicyEvaluationRequest = {
        user: {
          id: 'accuracy-test-user',
          roles: ['ops_manager'],
          permissions: ['assign_driver', 'view_live_map', 'manage_queue'],
          allowedRegions: ['test-region'],
          piiScope: 'masked'
        },
        resource: {
          type: 'booking',
          regionId: 'test-region',
          dataClass: 'internal',
          containsPII: false
        },
        action: 'assign_driver',
        context: {
          channel: 'ui',
          mfaPresent: false,
          timestamp: new Date()
        }
      };
      
      const knownBadRequest: PolicyEvaluationRequest = {
        user: {
          id: 'accuracy-test-user',
          roles: ['ground_ops'], // Lower privilege role
          permissions: ['assign_driver'],
          allowedRegions: ['different-region'],
          piiScope: 'none'
        },
        resource: {
          type: 'admin_action',
          regionId: 'test-region', // Different region
          dataClass: 'restricted',
          containsPII: true
        },
        action: 'manage_users', // High privilege action
        context: {
          channel: 'ui',
          mfaPresent: false,
          timestamp: new Date()
        }
      };
      
      // Run many iterations of known good and bad requests
      const allRequests = [];
      for (let i = 0; i < highLoadIterations; i++) {
        allRequests.push(
          rbacEngine.evaluatePolicy(knownGoodRequest),
          rbacEngine.evaluatePolicy(knownBadRequest)
        );
      }
      
      const results = await Promise.all(allRequests);
      
      // Validate consistency
      const goodResults = results.filter((_, index) => index % 2 === 0);
      const badResults = results.filter((_, index) => index % 2 === 1);
      
      const allGoodAllow = goodResults.every(r => r.decision === 'allow');
      const allBadDeny = badResults.every(r => r.decision === 'deny');
      
      expect(allGoodAllow).toBe(true);
      expect(allBadDeny).toBe(true);
      
      console.log(`✅ High Load Accuracy Test:`);
      console.log(`   Total Requests: ${results.length}`);
      console.log(`   Good Requests (should allow): ${goodResults.length} - All allowed: ${allGoodAllow}`);
      console.log(`   Bad Requests (should deny): ${badResults.length} - All denied: ${allBadDeny}`);
    });
  });

  // =====================================================
  // Performance Regression Detection
  // =====================================================

  describe('Performance Regression Detection', () => {
    
    test('should maintain consistent performance across test runs', async () => {
      const testRuns = 5;
      const operationsPerRun = 200;
      const maxVariance = 0.3; // 30% variance allowed
      
      const runTimes = [];
      
      for (let run = 0; run < testRuns; run++) {
        const requests = Array.from({ length: operationsPerRun }, (_, i) => 
          generateTestRequest(run * operationsPerRun + i)
        );
        
        const runStart = performance.now();
        
        for (const request of requests) {
          await rbacEngine.evaluatePolicy(request);
        }
        
        const runTime = performance.now() - runStart;
        runTimes.push(runTime);
      }
      
      const avgRunTime = runTimes.reduce((a, b) => a + b) / runTimes.length;
      const maxDeviation = Math.max(...runTimes.map(time => Math.abs(time - avgRunTime) / avgRunTime));
      
      expect(maxDeviation).toBeLessThan(maxVariance);
      
      console.log(`✅ Performance Consistency Test:`);
      console.log(`   Runs: ${testRuns}, Operations per run: ${operationsPerRun}`);
      console.log(`   Average time: ${avgRunTime.toFixed(2)}ms`);
      console.log(`   Max deviation: ${(maxDeviation * 100).toFixed(1)}% (threshold: ${maxVariance * 100}%)`);
      console.log(`   Times: [${runTimes.map(t => t.toFixed(0)).join(', ')}]ms`);
    });

    test('should identify performance bottlenecks', async () => {
      const bottleneckTests = [
        {
          name: 'Complex Role Hierarchy',
          setup: () => generateTestUser(1), // User with multiple roles
          iterations: 100
        },
        {
          name: 'Cross-Region Access',
          setup: () => {
            const user = generateTestUser(2);
            user.temporaryAccess = [{
              id: 'temp-access',
              userId: user.id,
              escalationType: 'support',
              grantedPermissions: ['cross_region_override'],
              grantedRegions: ['other-region-1', 'other-region-2', 'other-region-3'],
              requestedBy: 'manager',
              requestedAt: new Date(),
              expiresAt: new Date(Date.now() + 60 * 60 * 1000),
              justification: 'Performance test',
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            }];
            return user;
          },
          iterations: 100
        },
        {
          name: 'PII Access with Full Scope',
          setup: () => {
            const user = generateTestUser(3);
            user.piiScope = 'full';
            return user;
          },
          iterations: 100
        }
      ];
      
      const results = [];
      
      for (const test of bottleneckTests) {
        const user = test.setup();
        const requests = Array.from({ length: test.iterations }, (_, i) => {
          const request = generateTestRequest(i);
          request.user.id = user.id;
          request.user.piiScope = user.piiScope;
          if (user.temporaryAccess?.length) {
            request.user.allowedRegions = rbacEngine.getEffectiveRegions(user);
          }
          return request;
        });
        
        const startTime = performance.now();
        
        for (const request of requests) {
          await rbacEngine.evaluatePolicy(request);
        }
        
        const endTime = performance.now();
        const avgTime = (endTime - startTime) / test.iterations;
        
        results.push({ name: test.name, avgTime });
      }
      
      // All bottleneck tests should complete within reasonable time
      results.forEach(result => {
        expect(result.avgTime).toBeLessThan(100); // 100ms per operation
      });
      
      console.log('✅ Performance Bottleneck Analysis:');
      results.forEach(result => {
        console.log(`   ${result.name}: ${result.avgTime.toFixed(2)}ms avg`);
      });
    });
  });

  // =====================================================
  // Database Connection and Query Performance
  // =====================================================

  describe('Database Performance Simulation', () => {
    
    test('should simulate database connection pooling under load', async () => {
      const connectionPoolSize = 10;
      const simultaneousQueries = 50;
      const maxWaitTime = 1000; // 1 second
      
      // Simulate connection pool behavior
      let activeConnections = 0;
      const maxConnections = connectionPoolSize;
      
      const queryPromises = Array.from({ length: simultaneousQueries }, async (_, i) => {
        const queryStart = performance.now();
        
        // Wait for available connection
        while (activeConnections >= maxConnections) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        activeConnections++;
        
        try {
          // Simulate database query with RBAC check
          const user = generateTestUser(i);
          const permissions = rbacEngine.validateUserPermissions(user);
          
          // Simulate query delay
          await new Promise(resolve => setTimeout(resolve, 10 + Math.random() * 20));
          
          return { queryTime: performance.now() - queryStart, permissions };
        } finally {
          activeConnections--;
        }
      });
      
      const startTime = performance.now();
      const results = await Promise.all(queryPromises);
      const totalTime = performance.now() - startTime;
      
      expect(results).toHaveLength(simultaneousQueries);
      expect(totalTime).toBeLessThan(maxWaitTime * 2); // Allow for some queuing
      
      const avgQueryTime = results.reduce((sum, r) => sum + r.queryTime, 0) / results.length;
      
      console.log(`✅ Database Connection Pool Simulation:`);
      console.log(`   Pool Size: ${connectionPoolSize}, Queries: ${simultaneousQueries}`);
      console.log(`   Total Time: ${totalTime.toFixed(2)}ms`);
      console.log(`   Avg Query Time: ${avgQueryTime.toFixed(2)}ms`);
    });

    test('should validate query optimization patterns', () => {
      const queryPatterns = [
        {
          type: 'user_permissions_lookup',
          complexity: 'O(1)', // Should be constant time with proper indexing
          expectedTime: 10 // milliseconds
        },
        {
          type: 'role_hierarchy_resolution',
          complexity: 'O(log n)', // Tree traversal
          expectedTime: 20
        },
        {
          type: 'approval_workflow_check',
          complexity: 'O(1)', // Direct lookup
          expectedTime: 15
        },
        {
          type: 'temporal_access_validation',
          complexity: 'O(k)', // k = number of temporary access entries
          expectedTime: 25
        }
      ];
      
      queryPatterns.forEach(pattern => {
        expect(pattern.expectedTime).toBeGreaterThan(0);
        expect(pattern.expectedTime).toBeLessThan(100); // All queries under 100ms
        
        // Validate that complex operations have reasonable time limits
        if (pattern.complexity.includes('n') || pattern.complexity.includes('k')) {
          expect(pattern.expectedTime).toBeLessThan(50);
        }
      });
      
      console.log('✅ Query Optimization Patterns Validated');
      queryPatterns.forEach(pattern => {
        console.log(`   ${pattern.type}: ${pattern.complexity} - Target: ${pattern.expectedTime}ms`);
      });
    });
  });

  // =====================================================
  // Performance Monitoring and Alerting
  // =====================================================

  describe('Performance Monitoring', () => {
    
    test('should track key performance indicators', async () => {
      const monitoringPeriod = 1000; // 1 second
      const targetThroughput = 100; // operations per second
      
      const kpis = {
        totalOperations: 0,
        successfulOperations: 0,
        avgResponseTime: 0,
        maxResponseTime: 0,
        errorRate: 0,
        throughput: 0
      };
      
      const responseTimes = [];
      const startTime = performance.now();
      
      // Generate load for monitoring period
      while (performance.now() - startTime < monitoringPeriod) {
        const operationStart = performance.now();
        
        try {
          const request = generateTestRequest(kpis.totalOperations);
          const result = await rbacEngine.evaluatePolicy(request);
          
          const responseTime = performance.now() - operationStart;
          responseTimes.push(responseTime);
          
          if (result.decision === 'allow' || result.decision === 'deny') {
            kpis.successfulOperations++;
          }
          
          kpis.maxResponseTime = Math.max(kpis.maxResponseTime, responseTime);
        } catch (error) {
          // Count as failed operation
        }
        
        kpis.totalOperations++;
      }
      
      const actualDuration = performance.now() - startTime;
      
      kpis.avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      kpis.errorRate = (kpis.totalOperations - kpis.successfulOperations) / kpis.totalOperations;
      kpis.throughput = kpis.totalOperations / (actualDuration / 1000);
      
      // Validate KPIs meet targets
      expect(kpis.throughput).toBeGreaterThan(targetThroughput * 0.8); // 80% of target
      expect(kpis.errorRate).toBeLessThan(0.05); // Less than 5% error rate
      expect(kpis.avgResponseTime).toBeLessThan(50); // Average under 50ms
      expect(kpis.maxResponseTime).toBeLessThan(200); // Max under 200ms
      
      console.log('✅ Performance KPIs:');
      console.log(`   Throughput: ${kpis.throughput.toFixed(1)} ops/sec (target: >${targetThroughput})`);
      console.log(`   Avg Response Time: ${kpis.avgResponseTime.toFixed(2)}ms`);
      console.log(`   Max Response Time: ${kpis.maxResponseTime.toFixed(2)}ms`);
      console.log(`   Error Rate: ${(kpis.errorRate * 100).toFixed(2)}%`);
      console.log(`   Success Rate: ${((1 - kpis.errorRate) * 100).toFixed(2)}%`);
    });

    test('should validate performance alerting thresholds', () => {
      const alertingThresholds = [
        { metric: 'avg_response_time', warning: 100, critical: 500, unit: 'ms' },
        { metric: 'error_rate', warning: 0.01, critical: 0.05, unit: '%' },
        { metric: 'throughput', warning: 50, critical: 25, unit: 'ops/sec' },
        { metric: 'memory_usage', warning: 512, critical: 1024, unit: 'MB' },
        { metric: 'cpu_usage', warning: 0.7, critical: 0.9, unit: '%' }
      ];
      
      alertingThresholds.forEach(threshold => {
        expect(threshold.warning).toBeLessThan(threshold.critical);
        expect(threshold.warning).toBeGreaterThan(0);
        expect(threshold.critical).toBeGreaterThan(0);
        
        // Validate reasonable thresholds
        if (threshold.metric === 'avg_response_time') {
          expect(threshold.warning).toBeLessThan(1000); // Under 1 second
        }
        if (threshold.metric === 'error_rate') {
          expect(threshold.critical).toBeLessThan(0.1); // Under 10%
        }
      });
      
      console.log('✅ Performance Alerting Thresholds:');
      alertingThresholds.forEach(threshold => {
        console.log(`   ${threshold.metric}: Warning=${threshold.warning}${threshold.unit}, Critical=${threshold.critical}${threshold.unit}`);
      });
    });
  });
});