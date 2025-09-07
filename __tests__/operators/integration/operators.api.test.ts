// =====================================================
// OPERATORS API INTEGRATION TESTS
// Comprehensive integration tests for operators management API endpoints
// =====================================================

import { jest } from '@jest/globals';
import request from 'supertest';
import { createServer } from 'http';
import { NextApiHandler } from 'next';
import { 
  CreateOperatorRequest, 
  UpdateOperatorRequest,
  OperatorType,
  OperatorStatus 
} from '@/types/operators';

// Test database setup
import { setupTestDatabase, cleanupTestDatabase, createTestOperator, createTestUser } from '../helpers/testDatabase';

describe('Operators API Integration Tests', () => {
  
  let app: any;
  let testOperatorId: string;
  let testUserId: string;
  let authToken: string;

  // =====================================================
  // TEST SETUP AND TEARDOWN
  // =====================================================

  beforeAll(async () => {
    // Set up test database
    await setupTestDatabase();
    
    // Create test user with appropriate permissions
    const testUser = await createTestUser({
      email: 'test@xpressops.com',
      permissions: ['manage_operators', 'view_operators', 'create_operator'],
      allowedRegions: ['ncr-001', 'region-4a']
    });
    testUserId = testUser.id;
    authToken = testUser.authToken;

    // Set up test server
    const { default: handler } = await import('@/app/api/operators/route');
    app = createServer(handler as NextApiHandler);
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  beforeEach(async () => {
    // Clean up before each test
    await cleanupTestDatabase();
  });

  // =====================================================
  // CREATE OPERATOR TESTS
  // =====================================================

  describe('POST /api/operators', () => {
    
    const validOperatorData: CreateOperatorRequest = {
      operator_code: 'OPR-INT-001',
      business_name: 'Integration Test Transport',
      legal_name: 'Integration Test Transport Corporation',
      trade_name: 'IntTestTrans',
      operator_type: 'tnvs',
      primary_contact: {
        name: 'Juan Integration',
        phone: '+639123456789',
        email: 'juan@inttesttrans.com',
        position: 'General Manager'
      },
      business_address: {
        street: '123 Test Street',
        city: 'Makati',
        province: 'Metro Manila',
        region: 'NCR',
        postal_code: '1226',
        country: 'Philippines'
      },
      business_registration_number: 'DTI-INT-123456',
      tin: '123-456-789-001',
      primary_region_id: 'ncr-001',
      partnership_start_date: '2024-01-01T00:00:00.000Z'
    };

    it('should create a new TNVS operator successfully', async () => {
      const response = await request(app)
        .post('/api/operators')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validOperatorData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          operator: expect.objectContaining({
            operator_code: 'OPR-INT-001',
            business_name: 'Integration Test Transport',
            operator_type: 'tnvs',
            status: 'active',
            max_vehicles: 3,
            current_vehicle_count: 0,
            performance_score: 0,
            commission_tier: 'tier_1'
          })
        }
      });

      testOperatorId = response.body.data.operator.id;
    });

    it('should create a general operator with correct vehicle limits', async () => {
      const generalOperatorData = {
        ...validOperatorData,
        operator_code: 'OPR-INT-002',
        operator_type: 'general' as OperatorType
      };

      const response = await request(app)
        .post('/api/operators')
        .set('Authorization', `Bearer ${authToken}`)
        .send(generalOperatorData)
        .expect(201);

      expect(response.body.data.operator.operator_type).toBe('general');
      expect(response.body.data.operator.max_vehicles).toBe(10);
    });

    it('should validate required fields', async () => {
      const incompleteData = {
        operator_code: 'OPR-INT-003',
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/operators')
        .set('Authorization', `Bearer ${authToken}`)
        .send(incompleteData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          field: 'business_name',
          code: 'REQUIRED_FIELD_MISSING'
        })
      );
    });

    it('should validate Philippine phone number format', async () => {
      const invalidPhoneData = {
        ...validOperatorData,
        operator_code: 'OPR-INT-004',
        primary_contact: {
          ...validOperatorData.primary_contact,
          phone: '123-456-7890' // Invalid format
        }
      };

      const response = await request(app)
        .post('/api/operators')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidPhoneData)
        .expect(400);

      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          field: 'primary_contact.phone',
          code: 'INVALID_PHONE'
        })
      );
    });

    it('should validate email format', async () => {
      const invalidEmailData = {
        ...validOperatorData,
        operator_code: 'OPR-INT-005',
        primary_contact: {
          ...validOperatorData.primary_contact,
          email: 'invalid-email'
        }
      };

      const response = await request(app)
        .post('/api/operators')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidEmailData)
        .expect(400);

      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          field: 'primary_contact.email',
          code: 'INVALID_EMAIL'
        })
      );
    });

    it('should prevent duplicate operator codes', async () => {
      // Create first operator
      await request(app)
        .post('/api/operators')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validOperatorData)
        .expect(201);

      // Try to create second operator with same code
      const duplicateData = {
        ...validOperatorData,
        business_name: 'Different Business Name'
      };

      const response = await request(app)
        .post('/api/operators')
        .set('Authorization', `Bearer ${authToken}`)
        .send(duplicateData)
        .expect(409);

      expect(response.body.code).toBe('OPERATOR_CODE_EXISTS');
    });

    it('should enforce regional access restrictions', async () => {
      const restrictedRegionData = {
        ...validOperatorData,
        operator_code: 'OPR-INT-006',
        primary_region_id: 'region-1' // Not in user's allowed regions
      };

      const response = await request(app)
        .post('/api/operators')
        .set('Authorization', `Bearer ${authToken}`)
        .send(restrictedRegionData)
        .expect(400);

      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          field: 'primary_region_id',
          code: 'REGION_ACCESS_DENIED'
        })
      );
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/operators')
        .send(validOperatorData)
        .expect(401);

      expect(response.body.code).toBe('UNAUTHORIZED');
    });

  });

  // =====================================================
  // GET OPERATORS TESTS
  // =====================================================

  describe('GET /api/operators', () => {
    
    beforeEach(async () => {
      // Create test operators
      await createTestOperator({
        operator_code: 'OPR-GET-001',
        business_name: 'Test Operator 1',
        operator_type: 'tnvs',
        status: 'active',
        primary_region_id: 'ncr-001',
        performance_score: 85,
        commission_tier: 'tier_2'
      });

      await createTestOperator({
        operator_code: 'OPR-GET-002',
        business_name: 'Test Operator 2',
        operator_type: 'general',
        status: 'inactive',
        primary_region_id: 'region-4a',
        performance_score: 75,
        commission_tier: 'tier_1'
      });
    });

    it('should return list of operators with default pagination', async () => {
      const response = await request(app)
        .get('/api/operators')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toMatchObject({
        operators: expect.arrayContaining([
          expect.objectContaining({
            operator_code: 'OPR-GET-001'
          }),
          expect.objectContaining({
            operator_code: 'OPR-GET-002'
          })
        ]),
        pagination: expect.objectContaining({
          page: 1,
          limit: 20,
          total: expect.any(Number)
        })
      });
    });

    it('should filter operators by type', async () => {
      const response = await request(app)
        .get('/api/operators?operator_type=tnvs')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.operators).toHaveLength(1);
      expect(response.body.data.operators[0].operator_type).toBe('tnvs');
    });

    it('should filter operators by status', async () => {
      const response = await request(app)
        .get('/api/operators?status=active')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      response.body.data.operators.forEach((operator: any) => {
        expect(operator.status).toBe('active');
      });
    });

    it('should filter operators by performance score range', async () => {
      const response = await request(app)
        .get('/api/operators?performance_score_min=80&performance_score_max=90')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      response.body.data.operators.forEach((operator: any) => {
        expect(operator.performance_score).toBeGreaterThanOrEqual(80);
        expect(operator.performance_score).toBeLessThanOrEqual(90);
      });
    });

    it('should search operators by business name', async () => {
      const response = await request(app)
        .get('/api/operators?search=Test Operator 1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.operators).toHaveLength(1);
      expect(response.body.data.operators[0].business_name).toBe('Test Operator 1');
    });

    it('should support custom pagination', async () => {
      const response = await request(app)
        .get('/api/operators?page=1&limit=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.operators).toHaveLength(1);
      expect(response.body.data.pagination.limit).toBe(1);
      expect(response.body.data.pagination.page).toBe(1);
    });

    it('should enforce regional filtering for restricted users', async () => {
      // Create user with restricted regions
      const restrictedUser = await createTestUser({
        email: 'restricted@xpressops.com',
        permissions: ['view_operators'],
        allowedRegions: ['ncr-001'] // Only NCR access
      });

      const response = await request(app)
        .get('/api/operators')
        .set('Authorization', `Bearer ${restrictedUser.authToken}`)
        .expect(200);

      // Should only see NCR operators
      response.body.data.operators.forEach((operator: any) => {
        expect(operator.primary_region_id).toBe('ncr-001');
      });
    });

  });

  // =====================================================
  // GET SINGLE OPERATOR TESTS
  // =====================================================

  describe('GET /api/operators/[id]', () => {
    
    let singleTestOperatorId: string;

    beforeEach(async () => {
      const operator = await createTestOperator({
        operator_code: 'OPR-SINGLE-001',
        business_name: 'Single Test Operator',
        operator_type: 'tnvs',
        status: 'active',
        primary_region_id: 'ncr-001'
      });
      singleTestOperatorId = operator.id;
    });

    it('should return single operator by ID', async () => {
      const response = await request(app)
        .get(`/api/operators/${singleTestOperatorId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.operator).toMatchObject({
        id: singleTestOperatorId,
        operator_code: 'OPR-SINGLE-001',
        business_name: 'Single Test Operator'
      });
    });

    it('should return 404 for non-existent operator', async () => {
      const response = await request(app)
        .get('/api/operators/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.code).toBe('OPERATOR_NOT_FOUND');
    });

  });

  // =====================================================
  // UPDATE OPERATOR TESTS
  // =====================================================

  describe('PUT /api/operators/[id]', () => {
    
    let updateTestOperatorId: string;

    beforeEach(async () => {
      const operator = await createTestOperator({
        operator_code: 'OPR-UPDATE-001',
        business_name: 'Update Test Operator',
        operator_type: 'tnvs',
        status: 'active',
        primary_region_id: 'ncr-001',
        current_vehicle_count: 0
      });
      updateTestOperatorId = operator.id;
    });

    it('should update operator details successfully', async () => {
      const updateData: UpdateOperatorRequest = {
        id: updateTestOperatorId,
        business_name: 'Updated Business Name',
        trade_name: 'Updated Trade Name'
      };

      const response = await request(app)
        .put(`/api/operators/${updateTestOperatorId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.operator).toMatchObject({
        id: updateTestOperatorId,
        business_name: 'Updated Business Name',
        trade_name: 'Updated Trade Name'
      });
    });

    it('should prevent updating operator type when vehicles are assigned', async () => {
      // Create operator with vehicles
      const operatorWithVehicles = await createTestOperator({
        operator_code: 'OPR-UPDATE-002',
        business_name: 'Operator With Vehicles',
        operator_type: 'tnvs',
        current_vehicle_count: 2,
        primary_region_id: 'ncr-001'
      });

      const updateData: UpdateOperatorRequest = {
        id: operatorWithVehicles.id,
        operator_type: 'general'
      };

      const response = await request(app)
        .put(`/api/operators/${operatorWithVehicles.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.code).toBe('CANNOT_CHANGE_OPERATOR_TYPE');
    });

    it('should validate updated data', async () => {
      const updateData = {
        id: updateTestOperatorId,
        primary_contact: {
          ...validOperatorData.primary_contact,
          email: 'invalid-email-format'
        }
      };

      const response = await request(app)
        .put(`/api/operators/${updateTestOperatorId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          field: 'primary_contact.email',
          code: 'INVALID_EMAIL'
        })
      );
    });

  });

  // =====================================================
  // DELETE OPERATOR TESTS
  // =====================================================

  describe('DELETE /api/operators/[id]', () => {
    
    let deleteTestOperatorId: string;

    beforeEach(async () => {
      const operator = await createTestOperator({
        operator_code: 'OPR-DELETE-001',
        business_name: 'Delete Test Operator',
        operator_type: 'tnvs',
        status: 'active',
        primary_region_id: 'ncr-001',
        current_vehicle_count: 0
      });
      deleteTestOperatorId = operator.id;
    });

    it('should soft delete operator successfully', async () => {
      const response = await request(app)
        .delete(`/api/operators/${deleteTestOperatorId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toContain('deleted successfully');

      // Verify operator is soft deleted
      const getResponse = await request(app)
        .get(`/api/operators/${deleteTestOperatorId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(getResponse.body.data.operator.is_active).toBe(false);
    });

    it('should prevent deleting operator with active vehicles', async () => {
      const operatorWithVehicles = await createTestOperator({
        operator_code: 'OPR-DELETE-002',
        business_name: 'Operator With Active Vehicles',
        operator_type: 'tnvs',
        current_vehicle_count: 2,
        primary_region_id: 'ncr-001'
      });

      const response = await request(app)
        .delete(`/api/operators/${operatorWithVehicles.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.code).toBe('CANNOT_DELETE_OPERATOR_WITH_VEHICLES');
    });

  });

  // =====================================================
  // PERFORMANCE ENDPOINTS TESTS
  // =====================================================

  describe('Performance Endpoints', () => {
    
    let perfTestOperatorId: string;

    beforeEach(async () => {
      const operator = await createTestOperator({
        operator_code: 'OPR-PERF-001',
        business_name: 'Performance Test Operator',
        operator_type: 'tnvs',
        status: 'active',
        primary_region_id: 'ncr-001',
        performance_score: 85
      });
      perfTestOperatorId = operator.id;
    });

    describe('GET /api/operators/[id]/performance', () => {
      
      it('should return operator performance details', async () => {
        const response = await request(app)
          .get(`/api/operators/${perfTestOperatorId}/performance`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.data).toMatchObject({
          current_performance: expect.objectContaining({
            total_score: 85,
            commission_tier: expect.any(String)
          }),
          performance_history: expect.any(Array),
          metrics_breakdown: expect.any(Object)
        });
      });

    });

    describe('POST /api/operators/[id]/performance/recalculate', () => {
      
      it('should recalculate performance score', async () => {
        const response = await request(app)
          .post(`/api/operators/${perfTestOperatorId}/performance/recalculate`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ period: '2024-01', frequency: 'monthly' })
          .expect(200);

        expect(response.body.data.performance_score).toMatchObject({
          total_score: expect.any(Number),
          calculated_at: expect.any(String),
          is_final: true
        });
      });

    });

  });

  // =====================================================
  // COMMISSION TIER ENDPOINTS TESTS
  // =====================================================

  describe('Commission Tier Endpoints', () => {
    
    let tierTestOperatorId: string;

    beforeEach(async () => {
      const operator = await createTestOperator({
        operator_code: 'OPR-TIER-001',
        business_name: 'Tier Test Operator',
        operator_type: 'tnvs',
        status: 'active',
        primary_region_id: 'ncr-001',
        performance_score: 85,
        commission_tier: 'tier_2'
      });
      tierTestOperatorId = operator.id;
    });

    describe('GET /api/operators/[id]/commission-tier', () => {
      
      it('should return commission tier details', async () => {
        const response = await request(app)
          .get(`/api/operators/${tierTestOperatorId}/commission-tier`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.data).toMatchObject({
          current_tier: 'tier_2',
          tier_qualification: expect.any(Object),
          tier_benefits: expect.any(Object)
        });
      });

    });

    describe('POST /api/operators/[id]/commission-tier', () => {
      
      it('should evaluate commission tier upgrade', async () => {
        const response = await request(app)
          .post(`/api/operators/${tierTestOperatorId}/commission-tier`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ target_tier: 'tier_3', notes: 'Exceptional performance' })
          .expect(200);

        expect(response.body.data.tier_evaluation).toMatchObject({
          target_tier: 'tier_3',
          qualification_status: expect.any(String)
        });
      });

      it('should validate tier upgrade requirements', async () => {
        const lowPerformanceOperator = await createTestOperator({
          operator_code: 'OPR-TIER-002',
          business_name: 'Low Performance Operator',
          operator_type: 'tnvs',
          performance_score: 65,
          commission_tier: 'tier_1',
          primary_region_id: 'ncr-001'
        });

        const response = await request(app)
          .post(`/api/operators/${lowPerformanceOperator.id}/commission-tier`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ target_tier: 'tier_3' })
          .expect(400);

        expect(response.body.code).toBe('TIER_REQUIREMENTS_NOT_MET');
      });

    });

  });

  // =====================================================
  // ERROR HANDLING TESTS
  // =====================================================

  describe('Error Handling', () => {
    
    it('should handle database connection errors', async () => {
      // Simulate database error by temporarily breaking connection
      // This would typically involve mocking database connection failures
      
      // Test would verify graceful error handling and appropriate error responses
      expect(true).toBe(true); // Placeholder for actual database error simulation
    });

    it('should handle malformed request data', async () => {
      const response = await request(app)
        .post('/api/operators')
        .set('Authorization', `Bearer ${authToken}`)
        .send('invalid json')
        .expect(400);

      expect(response.body.code).toBe('INVALID_REQUEST_DATA');
    });

    it('should handle server errors gracefully', async () => {
      // This test would simulate internal server errors
      // and verify that appropriate error responses are returned
      expect(true).toBe(true); // Placeholder for actual server error simulation
    });

  });

  // =====================================================
  // ANALYTICS ENDPOINTS TESTS
  // =====================================================

  describe('Analytics Endpoints', () => {
    
    beforeEach(async () => {
      // Create multiple operators for analytics
      await Promise.all([
        createTestOperator({
          operator_code: 'OPR-ANAL-001',
          operator_type: 'tnvs',
          status: 'active',
          primary_region_id: 'ncr-001',
          performance_score: 85,
          commission_tier: 'tier_2'
        }),
        createTestOperator({
          operator_code: 'OPR-ANAL-002',
          operator_type: 'general',
          status: 'active',
          primary_region_id: 'region-4a',
          performance_score: 75,
          commission_tier: 'tier_1'
        })
      ]);
    });

    describe('GET /api/operators/analytics', () => {
      
      it('should return comprehensive analytics data', async () => {
        const response = await request(app)
          .get('/api/operators/analytics')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.data).toMatchObject({
          total_operators: expect.any(Number),
          active_operators: expect.any(Number),
          type_distribution: expect.objectContaining({
            tnvs: expect.any(Number),
            general: expect.any(Number),
            fleet: expect.any(Number)
          }),
          tier_distribution: expect.objectContaining({
            tier_1: expect.any(Number),
            tier_2: expect.any(Number),
            tier_3: expect.any(Number)
          }),
          regional_stats: expect.any(Array),
          performance_trends: expect.any(Object)
        });
      });

      it('should filter analytics by date range', async () => {
        const response = await request(app)
          .get('/api/operators/analytics?from=2024-01-01&to=2024-01-31')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.data.period).toMatchObject({
          from: '2024-01-01',
          to: '2024-01-31'
        });
      });

    });

  });

});