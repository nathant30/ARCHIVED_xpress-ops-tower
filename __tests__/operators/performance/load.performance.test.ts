// =====================================================
// PERFORMANCE LOAD TESTS
// Scalability and performance validation for operators management system
// =====================================================

import { test, expect } from '@playwright/test';
import { performance } from 'perf_hooks';
import axios from 'axios';

// Test configuration
const LOAD_TEST_CONFIG = {
  // Operator creation load test
  CREATE_OPERATORS: {
    concurrentUsers: 10,
    operatorsPerUser: 100,
    maxResponseTime: 2000 // 2 seconds
  },
  
  // Performance calculation load test
  PERFORMANCE_CALCULATION: {
    operatorCount: 1000,
    concurrentCalculations: 50,
    maxCalculationTime: 500 // 500ms per calculation
  },
  
  // Commission processing load test
  COMMISSION_PROCESSING: {
    transactionCount: 10000,
    concurrentRequests: 100,
    maxProcessingTime: 1000 // 1 second
  },
  
  // Database query performance
  DATABASE_QUERIES: {
    operatorCount: 5000,
    maxQueryTime: 100 // 100ms for complex queries
  }
};

// Performance metrics tracking
interface PerformanceMetrics {
  avgResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  successRate: number;
  throughput: number;
  errorRate: number;
}

class PerformanceTracker {
  private metrics: number[] = [];
  private errors: number = 0;
  private startTime: number = 0;
  
  start() {
    this.startTime = performance.now();
  }
  
  recordResponse(responseTime: number, success: boolean = true) {
    this.metrics.push(responseTime);
    if (!success) this.errors++;
  }
  
  getMetrics(): PerformanceMetrics {
    if (this.metrics.length === 0) {
      return {
        avgResponseTime: 0,
        maxResponseTime: 0,
        minResponseTime: 0,
        successRate: 0,
        throughput: 0,
        errorRate: 0
      };
    }
    
    const totalTime = performance.now() - this.startTime;
    const totalRequests = this.metrics.length;
    
    return {
      avgResponseTime: this.metrics.reduce((a, b) => a + b, 0) / totalRequests,
      maxResponseTime: Math.max(...this.metrics),
      minResponseTime: Math.min(...this.metrics),
      successRate: ((totalRequests - this.errors) / totalRequests) * 100,
      throughput: (totalRequests / totalTime) * 1000, // requests per second
      errorRate: (this.errors / totalRequests) * 100
    };
  }
}

test.describe('Operators Management Performance Tests', () => {
  
  let authToken: string;
  let baseURL: string;

  test.beforeAll(async () => {
    baseURL = process.env.TEST_API_URL || 'http://localhost:4000';
    
    // Get authentication token
    const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      email: 'performance@xpressops.com',
      password: 'perf123'
    });
    
    authToken = loginResponse.data.token;
  });

  // =====================================================
  // OPERATOR CREATION PERFORMANCE TESTS
  // =====================================================

  test('Load test: Concurrent operator creation', async () => {
    const { concurrentUsers, operatorsPerUser, maxResponseTime } = LOAD_TEST_CONFIG.CREATE_OPERATORS;
    const tracker = new PerformanceTracker();
    
    tracker.start();
    
    // Create multiple concurrent users creating operators
    const userTasks = Array.from({ length: concurrentUsers }, (_, userIndex) => {
      return Promise.all(
        Array.from({ length: operatorsPerUser }, async (_, operatorIndex) => {
          const operatorData = {
            operator_code: `PERF-${userIndex}-${operatorIndex}`,
            business_name: `Performance Test Operator ${userIndex}-${operatorIndex}`,
            legal_name: `Performance Test Operator ${userIndex}-${operatorIndex} Corp`,
            operator_type: 'tnvs',
            primary_contact: {
              name: `Test Contact ${userIndex}-${operatorIndex}`,
              phone: '+639123456789',
              email: `test${userIndex}${operatorIndex}@perftest.com`,
              position: 'Manager'
            },
            business_address: {
              street: `${operatorIndex} Performance Street`,
              city: 'Makati',
              province: 'Metro Manila',
              region: 'NCR',
              postal_code: '1226',
              country: 'Philippines'
            },
            business_registration_number: `DTI-PERF-${userIndex}-${operatorIndex}`,
            tin: `${userIndex}${operatorIndex}${userIndex}-456-789-000`,
            primary_region_id: 'ncr-001',
            partnership_start_date: '2024-01-01T00:00:00.000Z'
          };
          
          const startTime = performance.now();
          
          try {
            const response = await axios.post(
              `${baseURL}/api/operators`,
              operatorData,
              {
                headers: { Authorization: `Bearer ${authToken}` },
                timeout: maxResponseTime
              }
            );
            
            const responseTime = performance.now() - startTime;
            tracker.recordResponse(responseTime, response.status === 201);
            
            return { success: true, responseTime, operatorId: response.data.data.operator.id };
            
          } catch (error) {
            const responseTime = performance.now() - startTime;
            tracker.recordResponse(responseTime, false);
            
            return { success: false, responseTime, error: error.message };
          }
        })
      );
    });
    
    // Wait for all operator creation tasks to complete
    const results = await Promise.all(userTasks);
    const metrics = tracker.getMetrics();
    
    // Performance assertions
    expect(metrics.successRate).toBeGreaterThan(95); // 95% success rate
    expect(metrics.avgResponseTime).toBeLessThan(maxResponseTime);
    expect(metrics.errorRate).toBeLessThan(5); // Less than 5% error rate
    expect(metrics.throughput).toBeGreaterThan(10); // At least 10 requests per second
    
    console.log(`Operator Creation Performance Metrics:`, {
      totalOperators: concurrentUsers * operatorsPerUser,
      avgResponseTime: `${metrics.avgResponseTime.toFixed(2)}ms`,
      maxResponseTime: `${metrics.maxResponseTime.toFixed(2)}ms`,
      successRate: `${metrics.successRate.toFixed(2)}%`,
      throughput: `${metrics.throughput.toFixed(2)} req/sec`,
      errorRate: `${metrics.errorRate.toFixed(2)}%`
    });
  });

  // =====================================================
  // OPERATOR QUERY PERFORMANCE TESTS
  // =====================================================

  test('Load test: Operator list queries with filtering', async () => {
    const { operatorCount, maxQueryTime } = LOAD_TEST_CONFIG.DATABASE_QUERIES;
    
    // First create test data
    console.log(`Creating ${operatorCount} test operators...`);
    const createTasks = Array.from({ length: operatorCount }, async (_, index) => {
      const operatorData = {
        operator_code: `QUERY-${index}`,
        business_name: `Query Test Operator ${index}`,
        legal_name: `Query Test Operator ${index} Corp`,
        operator_type: index % 2 === 0 ? 'tnvs' : 'general',
        primary_contact: {
          name: `Query Contact ${index}`,
          phone: '+639123456789',
          email: `query${index}@perftest.com`,
          position: 'Manager'
        },
        business_address: {
          street: `${index} Query Street`,
          city: index % 2 === 0 ? 'Makati' : 'Manila',
          province: 'Metro Manila',
          region: 'NCR',
          postal_code: '1226',
          country: 'Philippines'
        },
        business_registration_number: `DTI-QUERY-${index}`,
        tin: `${index}-456-789-000`,
        primary_region_id: 'ncr-001',
        partnership_start_date: '2024-01-01T00:00:00.000Z'
      };
      
      try {
        await axios.post(
          `${baseURL}/api/operators`,
          operatorData,
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
      } catch (error) {
        // Ignore creation errors for performance test
      }
    });
    
    // Create operators in batches to avoid overwhelming the system
    const batchSize = 100;
    for (let i = 0; i < createTasks.length; i += batchSize) {
      const batch = createTasks.slice(i, i + batchSize);
      await Promise.all(batch);
    }
    
    console.log('Test data created. Starting query performance tests...');
    
    // Test various query patterns
    const queryTests = [
      // Basic list query
      {
        name: 'Basic list query',
        url: `${baseURL}/api/operators?page=1&limit=20`
      },
      // Filtered by operator type
      {
        name: 'Filter by operator type',
        url: `${baseURL}/api/operators?operator_type=tnvs&page=1&limit=50`
      },
      // Filtered by status
      {
        name: 'Filter by status',
        url: `${baseURL}/api/operators?status=active&page=1&limit=50`
      },
      // Search by business name
      {
        name: 'Search by business name',
        url: `${baseURL}/api/operators?search=Query Test&page=1&limit=50`
      },
      // Complex filter combination
      {
        name: 'Complex filters',
        url: `${baseURL}/api/operators?operator_type=tnvs&status=active&search=Query&page=1&limit=20`
      },
      // Large page size
      {
        name: 'Large page size',
        url: `${baseURL}/api/operators?page=1&limit=100`
      }
    ];
    
    const queryTracker = new PerformanceTracker();
    queryTracker.start();
    
    // Run each query test multiple times concurrently
    for (const queryTest of queryTests) {
      const concurrentQueries = Array.from({ length: 20 }, async () => {
        const startTime = performance.now();
        
        try {
          const response = await axios.get(queryTest.url, {
            headers: { Authorization: `Bearer ${authToken}` },
            timeout: maxQueryTime * 2
          });
          
          const responseTime = performance.now() - startTime;
          queryTracker.recordResponse(responseTime, response.status === 200);
          
          return { success: true, responseTime, resultCount: response.data.data.operators.length };
          
        } catch (error) {
          const responseTime = performance.now() - startTime;
          queryTracker.recordResponse(responseTime, false);
          
          return { success: false, responseTime, error: error.message };
        }
      });
      
      const queryResults = await Promise.all(concurrentQueries);
      const successfulQueries = queryResults.filter(r => r.success);
      
      console.log(`${queryTest.name}:`, {
        avgResponseTime: `${(successfulQueries.reduce((sum, r) => sum + r.responseTime, 0) / successfulQueries.length).toFixed(2)}ms`,
        successRate: `${(successfulQueries.length / queryResults.length * 100).toFixed(2)}%`
      });
    }
    
    const metrics = queryTracker.getMetrics();
    
    // Query performance assertions
    expect(metrics.successRate).toBeGreaterThan(98); // 98% success rate for queries
    expect(metrics.avgResponseTime).toBeLessThan(maxQueryTime);
    expect(metrics.maxResponseTime).toBeLessThan(maxQueryTime * 2);
    
    console.log(`Query Performance Summary:`, {
      avgResponseTime: `${metrics.avgResponseTime.toFixed(2)}ms`,
      maxResponseTime: `${metrics.maxResponseTime.toFixed(2)}ms`,
      successRate: `${metrics.successRate.toFixed(2)}%`,
      throughput: `${metrics.throughput.toFixed(2)} req/sec`
    });
  });

  // =====================================================
  // PERFORMANCE CALCULATION STRESS TESTS
  // =====================================================

  test('Load test: Performance score calculations', async () => {
    const { operatorCount, concurrentCalculations, maxCalculationTime } = LOAD_TEST_CONFIG.PERFORMANCE_CALCULATION;
    
    // Create test operators with varying performance data
    console.log(`Setting up ${operatorCount} operators for performance calculation tests...`);
    const operatorIds: string[] = [];
    
    // Create operators in smaller batches
    const batchSize = 50;
    for (let batch = 0; batch < operatorCount / batchSize; batch++) {
      const batchTasks = Array.from({ length: batchSize }, async (_, index) => {
        const globalIndex = batch * batchSize + index;
        const operatorData = {
          operator_code: `PERF-CALC-${globalIndex}`,
          business_name: `Performance Calc Test ${globalIndex}`,
          legal_name: `Performance Calc Test ${globalIndex} Corp`,
          operator_type: 'tnvs',
          primary_contact: {
            name: `Perf Contact ${globalIndex}`,
            phone: '+639123456789',
            email: `perfcalc${globalIndex}@perftest.com`,
            position: 'Manager'
          },
          business_address: {
            street: `${globalIndex} Perf Street`,
            city: 'Makati',
            province: 'Metro Manila',
            region: 'NCR',
            postal_code: '1226',
            country: 'Philippines'
          },
          business_registration_number: `DTI-PERF-${globalIndex}`,
          tin: `${globalIndex}-456-789-000`,
          primary_region_id: 'ncr-001',
          partnership_start_date: '2024-01-01T00:00:00.000Z'
        };
        
        try {
          const response = await axios.post(
            `${baseURL}/api/operators`,
            operatorData,
            { headers: { Authorization: `Bearer ${authToken}` } }
          );
          
          return response.data.data.operator.id;
        } catch (error) {
          return null;
        }
      });
      
      const batchResults = await Promise.all(batchTasks);
      operatorIds.push(...batchResults.filter(id => id !== null));
      
      // Small delay between batches to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`Created ${operatorIds.length} operators. Starting performance calculation tests...`);
    
    const calcTracker = new PerformanceTracker();
    calcTracker.start();
    
    // Run concurrent performance calculations
    const calculationBatches = [];
    for (let i = 0; i < operatorIds.length; i += concurrentCalculations) {
      const batch = operatorIds.slice(i, i + concurrentCalculations);
      
      const batchCalculations = batch.map(async (operatorId) => {
        // First, simulate performance data
        const performanceData = {
          operatorId,
          performanceMetrics: {
            daily_vehicle_utilization: Math.random() * 0.3 + 0.7, // 0.7-1.0
            peak_hour_availability: Math.random() * 0.3 + 0.7,
            fleet_efficiency_ratio: Math.random() * 0.4 + 0.6,
            driver_retention_rate: Math.random() * 0.3 + 0.7,
            driver_performance_avg: Math.random() * 0.3 + 0.7,
            training_completion_rate: Math.random() * 0.2 + 0.8,
            safety_incident_rate: Math.random() * 0.05, // 0-0.05
            regulatory_compliance: Math.random() * 0.1 + 0.9,
            vehicle_maintenance_score: Math.random() * 0.2 + 0.8,
            customer_satisfaction: Math.random() * 1.5 + 3.5, // 3.5-5.0
            service_area_coverage: Math.random() * 0.4 + 0.6,
            technology_adoption: Math.random() * 0.3 + 0.7
          }
        };
        
        const startTime = performance.now();
        
        try {
          // Simulate performance data creation
          await axios.post(
            `${baseURL}/api/test/simulate-performance-data`,
            performanceData,
            { headers: { Authorization: `Bearer ${authToken}` } }
          );
          
          // Calculate performance score
          const calcResponse = await axios.post(
            `${baseURL}/api/operators/${operatorId}/performance/recalculate`,
            { period: '2024-01', frequency: 'monthly' },
            {
              headers: { Authorization: `Bearer ${authToken}` },
              timeout: maxCalculationTime * 2
            }
          );
          
          const responseTime = performance.now() - startTime;
          calcTracker.recordResponse(responseTime, calcResponse.status === 200);
          
          return { 
            success: true, 
            responseTime, 
            operatorId,
            performanceScore: calcResponse.data.data.performance_score.total_score
          };
          
        } catch (error) {
          const responseTime = performance.now() - startTime;
          calcTracker.recordResponse(responseTime, false);
          
          return { success: false, responseTime, operatorId, error: error.message };
        }
      });
      
      calculationBatches.push(batchCalculations);
    }
    
    // Execute all calculation batches with some delay between them
    for (const batchCalculations of calculationBatches) {
      await Promise.all(batchCalculations);
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    const metrics = calcTracker.getMetrics();
    
    // Performance calculation assertions
    expect(metrics.successRate).toBeGreaterThan(90); // 90% success rate
    expect(metrics.avgResponseTime).toBeLessThan(maxCalculationTime);
    
    console.log(`Performance Calculation Metrics:`, {
      totalCalculations: operatorIds.length,
      avgResponseTime: `${metrics.avgResponseTime.toFixed(2)}ms`,
      maxResponseTime: `${metrics.maxResponseTime.toFixed(2)}ms`,
      successRate: `${metrics.successRate.toFixed(2)}%`,
      throughput: `${metrics.throughput.toFixed(2)} calculations/sec`,
      errorRate: `${metrics.errorRate.toFixed(2)}%`
    });
  });

  // =====================================================
  // COMMISSION PROCESSING PERFORMANCE TESTS
  // =====================================================

  test('Load test: Commission transaction processing', async () => {
    const { transactionCount, concurrentRequests, maxProcessingTime } = LOAD_TEST_CONFIG.COMMISSION_PROCESSING;
    
    // Create a test operator for commission testing
    const operatorData = {
      operator_code: 'COMMISSION-PERF-001',
      business_name: 'Commission Performance Test Operator',
      legal_name: 'Commission Performance Test Operator Corp',
      operator_type: 'tnvs',
      primary_contact: {
        name: 'Commission Test Contact',
        phone: '+639123456789',
        email: 'commission@perftest.com',
        position: 'Manager'
      },
      business_address: {
        street: '1 Commission Street',
        city: 'Makati',
        province: 'Metro Manila',
        region: 'NCR',
        postal_code: '1226',
        country: 'Philippines'
      },
      business_registration_number: 'DTI-COMMISSION-001',
      tin: '999-456-789-000',
      primary_region_id: 'ncr-001',
      partnership_start_date: '2024-01-01T00:00:00.000Z'
    };
    
    const operatorResponse = await axios.post(
      `${baseURL}/api/operators`,
      operatorData,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    const operatorId = operatorResponse.data.data.operator.id;
    
    console.log(`Starting commission processing test with ${transactionCount} transactions...`);
    
    const commissionTracker = new PerformanceTracker();
    commissionTracker.start();
    
    // Create transaction processing tasks
    const transactionTasks = Array.from({ length: transactionCount }, (_, index) => ({
      operatorId,
      bookingId: `BK-PERF-${index}`,
      baseFare: Math.floor(Math.random() * 500) + 100 // 100-600 PHP
    }));
    
    // Process transactions in concurrent batches
    const batchSize = concurrentRequests;
    for (let i = 0; i < transactionTasks.length; i += batchSize) {
      const batch = transactionTasks.slice(i, i + batchSize);
      
      const batchProcessing = batch.map(async (transaction) => {
        const startTime = performance.now();
        
        try {
          const response = await axios.post(
            `${baseURL}/api/test/simulate-commission`,
            transaction,
            {
              headers: { Authorization: `Bearer ${authToken}` },
              timeout: maxProcessingTime * 2
            }
          );
          
          const responseTime = performance.now() - startTime;
          commissionTracker.recordResponse(responseTime, response.status === 200);
          
          return { 
            success: true, 
            responseTime, 
            bookingId: transaction.bookingId,
            commissionAmount: response.data.data.commission_amount
          };
          
        } catch (error) {
          const responseTime = performance.now() - startTime;
          commissionTracker.recordResponse(responseTime, false);
          
          return { 
            success: false, 
            responseTime, 
            bookingId: transaction.bookingId, 
            error: error.message 
          };
        }
      });
      
      await Promise.all(batchProcessing);
      
      // Progress logging every 1000 transactions
      if ((i + batchSize) % 1000 === 0 || i + batchSize >= transactionTasks.length) {
        console.log(`Processed ${Math.min(i + batchSize, transactionTasks.length)} / ${transactionTasks.length} commission transactions`);
      }
    }
    
    const metrics = commissionTracker.getMetrics();
    
    // Commission processing assertions
    expect(metrics.successRate).toBeGreaterThan(95); // 95% success rate
    expect(metrics.avgResponseTime).toBeLessThan(maxProcessingTime);
    expect(metrics.throughput).toBeGreaterThan(50); // At least 50 transactions per second
    
    console.log(`Commission Processing Performance Metrics:`, {
      totalTransactions: transactionCount,
      avgResponseTime: `${metrics.avgResponseTime.toFixed(2)}ms`,
      maxResponseTime: `${metrics.maxResponseTime.toFixed(2)}ms`,
      successRate: `${metrics.successRate.toFixed(2)}%`,
      throughput: `${metrics.throughput.toFixed(2)} transactions/sec`,
      errorRate: `${metrics.errorRate.toFixed(2)}%`
    });
  });

  // =====================================================
  // MEMORY AND RESOURCE USAGE TESTS
  // =====================================================

  test('Memory usage and resource consumption', async () => {
    const initialMemoryUsage = process.memoryUsage();
    
    console.log('Initial memory usage:', {
      rss: `${(initialMemoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
      heapUsed: `${(initialMemoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
      heapTotal: `${(initialMemoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
      external: `${(initialMemoryUsage.external / 1024 / 1024).toFixed(2)} MB`
    });
    
    // Create a large number of operators to test memory usage
    const operatorCount = 500;
    const operatorIds: string[] = [];
    
    for (let i = 0; i < operatorCount; i++) {
      const operatorData = {
        operator_code: `MEMORY-${i}`,
        business_name: `Memory Test Operator ${i}`,
        legal_name: `Memory Test Operator ${i} Corp`,
        operator_type: 'tnvs',
        primary_contact: {
          name: `Memory Contact ${i}`,
          phone: '+639123456789',
          email: `memory${i}@perftest.com`,
          position: 'Manager'
        },
        business_address: {
          street: `${i} Memory Street`,
          city: 'Makati',
          province: 'Metro Manila',
          region: 'NCR',
          postal_code: '1226',
          country: 'Philippines'
        },
        business_registration_number: `DTI-MEMORY-${i}`,
        tin: `${i}-456-789-000`,
        primary_region_id: 'ncr-001',
        partnership_start_date: '2024-01-01T00:00:00.000Z'
      };
      
      try {
        const response = await axios.post(
          `${baseURL}/api/operators`,
          operatorData,
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        
        operatorIds.push(response.data.data.operator.id);
        
        // Check memory usage periodically
        if (i % 100 === 0) {
          const currentMemoryUsage = process.memoryUsage();
          const memoryIncrease = currentMemoryUsage.heapUsed - initialMemoryUsage.heapUsed;
          
          console.log(`After creating ${i + 1} operators - Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`);
        }
      } catch (error) {
        console.warn(`Failed to create operator ${i}:`, error.message);
      }
    }
    
    const finalMemoryUsage = process.memoryUsage();
    const totalMemoryIncrease = finalMemoryUsage.heapUsed - initialMemoryUsage.heapUsed;
    
    console.log('Final memory usage:', {
      rss: `${(finalMemoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
      heapUsed: `${(finalMemoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
      heapTotal: `${(finalMemoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
      external: `${(finalMemoryUsage.external / 1024 / 1024).toFixed(2)} MB`,
      increase: `${(totalMemoryIncrease / 1024 / 1024).toFixed(2)} MB`
    });
    
    // Memory usage assertions
    const memoryIncreasePerOperator = totalMemoryIncrease / operatorIds.length;
    
    expect(memoryIncreasePerOperator).toBeLessThan(1024 * 10); // Less than 10KB per operator
    expect(totalMemoryIncrease).toBeLessThan(1024 * 1024 * 100); // Less than 100MB total increase
    
    console.log(`Memory efficiency: ${(memoryIncreasePerOperator / 1024).toFixed(2)} KB per operator`);
  });

  // =====================================================
  // CONCURRENT USER SIMULATION
  // =====================================================

  test('Concurrent user simulation', async () => {
    const concurrentUsers = 25;
    const actionsPerUser = 20;
    
    console.log(`Simulating ${concurrentUsers} concurrent users with ${actionsPerUser} actions each...`);
    
    const userTracker = new PerformanceTracker();
    userTracker.start();
    
    // Define user actions (weighted by frequency)
    const userActions = [
      { name: 'List operators', weight: 40, action: () => axios.get(`${baseURL}/api/operators?page=1&limit=20`, { headers: { Authorization: `Bearer ${authToken}` } }) },
      { name: 'View operator details', weight: 20, action: (operatorId: string) => axios.get(`${baseURL}/api/operators/${operatorId}`, { headers: { Authorization: `Bearer ${authToken}` } }) },
      { name: 'Create operator', weight: 10, action: (userIndex: number, actionIndex: number) => {
        const operatorData = {
          operator_code: `CONCURRENT-${userIndex}-${actionIndex}`,
          business_name: `Concurrent Test ${userIndex}-${actionIndex}`,
          legal_name: `Concurrent Test ${userIndex}-${actionIndex} Corp`,
          operator_type: 'tnvs',
          primary_contact: {
            name: `Concurrent Contact ${userIndex}-${actionIndex}`,
            phone: '+639123456789',
            email: `concurrent${userIndex}${actionIndex}@perftest.com`,
            position: 'Manager'
          },
          business_address: {
            street: `${actionIndex} Concurrent Street`,
            city: 'Makati',
            province: 'Metro Manila',
            region: 'NCR',
            postal_code: '1226',
            country: 'Philippines'
          },
          business_registration_number: `DTI-CONCURRENT-${userIndex}-${actionIndex}`,
          tin: `${userIndex}${actionIndex}-456-789-000`,
          primary_region_id: 'ncr-001',
          partnership_start_date: '2024-01-01T00:00:00.000Z'
        };
        return axios.post(`${baseURL}/api/operators`, operatorData, { headers: { Authorization: `Bearer ${authToken}` } });
      }},
      { name: 'Search operators', weight: 15, action: (userIndex: number) => axios.get(`${baseURL}/api/operators?search=Test${userIndex}`, { headers: { Authorization: `Bearer ${authToken}` } }) },
      { name: 'Filter operators', weight: 10, action: () => axios.get(`${baseURL}/api/operators?operator_type=tnvs&status=active`, { headers: { Authorization: `Bearer ${authToken}` } }) },
      { name: 'Get analytics', weight: 5, action: () => axios.get(`${baseURL}/api/operators/analytics`, { headers: { Authorization: `Bearer ${authToken}` } }) }
    ];
    
    // Simulate concurrent users
    const userTasks = Array.from({ length: concurrentUsers }, async (_, userIndex) => {
      const userOperatorIds: string[] = [];
      
      for (let actionIndex = 0; actionIndex < actionsPerUser; actionIndex++) {
        // Select action based on weights
        const totalWeight = userActions.reduce((sum, action) => sum + action.weight, 0);
        const randomWeight = Math.random() * totalWeight;
        let cumulativeWeight = 0;
        
        const selectedAction = userActions.find(action => {
          cumulativeWeight += action.weight;
          return randomWeight <= cumulativeWeight;
        }) || userActions[0];
        
        const startTime = performance.now();
        
        try {
          let response;
          
          if (selectedAction.name === 'Create operator') {
            response = await selectedAction.action(userIndex, actionIndex);
            if (response.data.data?.operator?.id) {
              userOperatorIds.push(response.data.data.operator.id);
            }
          } else if (selectedAction.name === 'View operator details' && userOperatorIds.length > 0) {
            const randomOperatorId = userOperatorIds[Math.floor(Math.random() * userOperatorIds.length)];
            response = await selectedAction.action(randomOperatorId);
          } else if (selectedAction.name === 'Search operators') {
            response = await selectedAction.action(userIndex);
          } else {
            response = await selectedAction.action();
          }
          
          const responseTime = performance.now() - startTime;
          userTracker.recordResponse(responseTime, response.status < 400);
          
        } catch (error) {
          const responseTime = performance.now() - startTime;
          userTracker.recordResponse(responseTime, false);
        }
        
        // Random delay between actions (100ms to 1s)
        await new Promise(resolve => setTimeout(resolve, Math.random() * 900 + 100));
      }
    });
    
    await Promise.all(userTasks);
    
    const metrics = userTracker.getMetrics();
    
    // Concurrent user performance assertions
    expect(metrics.successRate).toBeGreaterThan(90); // 90% success rate under load
    expect(metrics.avgResponseTime).toBeLessThan(3000); // Average response time under 3s
    
    console.log(`Concurrent User Simulation Results:`, {
      totalUsers: concurrentUsers,
      actionsPerUser,
      totalActions: concurrentUsers * actionsPerUser,
      avgResponseTime: `${metrics.avgResponseTime.toFixed(2)}ms`,
      maxResponseTime: `${metrics.maxResponseTime.toFixed(2)}ms`,
      successRate: `${metrics.successRate.toFixed(2)}%`,
      throughput: `${metrics.throughput.toFixed(2)} actions/sec`,
      errorRate: `${metrics.errorRate.toFixed(2)}%`
    });
  });

});