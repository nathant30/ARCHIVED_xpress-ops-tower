// =====================================================
// DATABASE INTEGRATION TESTS
// Comprehensive integration tests for operators database operations
// =====================================================

import { jest } from '@jest/globals';
import { Pool } from 'pg';
import {
  Operator,
  OperatorPerformanceScore,
  OperatorFinancialTransaction,
  OperatorBoundaryFee,
  OperatorPayout,
  CreateOperatorRequest
} from '@/types/operators';

// Test database configuration
import { setupTestDatabase, cleanupTestDatabase, getTestPool } from '../helpers/testDatabase';

describe('Database Integration Tests', () => {
  
  let testPool: Pool;
  let testOperatorId: string;

  // =====================================================
  // TEST SETUP AND TEARDOWN
  // =====================================================

  beforeAll(async () => {
    testPool = await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  beforeEach(async () => {
    // Clean up test data before each test
    await testPool.query('BEGIN');
    await testPool.query('DELETE FROM operator_payouts');
    await testPool.query('DELETE FROM operator_boundary_fees');
    await testPool.query('DELETE FROM operator_financial_transactions');
    await testPool.query('DELETE FROM operator_performance_details');
    await testPool.query('DELETE FROM operator_performance_scores');
    await testPool.query('DELETE FROM commission_tier_qualifications');
    await testPool.query('DELETE FROM operator_vehicles');
    await testPool.query('DELETE FROM operator_drivers');
    await testPool.query('DELETE FROM operator_locations');
    await testPool.query('DELETE FROM operators');
    await testPool.query('COMMIT');
  });

  // =====================================================
  // OPERATOR CRUD OPERATIONS
  // =====================================================

  describe('Operators Table Operations', () => {
    
    const testOperatorData: CreateOperatorRequest = {
      operator_code: 'OPR-DB-001',
      business_name: 'Database Test Transport',
      legal_name: 'Database Test Transport Corporation',
      trade_name: 'DBTestTrans',
      operator_type: 'tnvs',
      primary_contact: {
        name: 'Juan Database',
        phone: '+639123456789',
        email: 'juan@dbtesttrans.com',
        position: 'General Manager'
      },
      business_address: {
        street: '123 Database Street',
        city: 'Makati',
        province: 'Metro Manila',
        region: 'NCR',
        postal_code: '1226',
        country: 'Philippines'
      },
      business_registration_number: 'DTI-DB-123456',
      tin: '123-456-789-002',
      primary_region_id: 'ncr-001',
      partnership_start_date: '2024-01-01T00:00:00.000Z'
    };

    it('should create operator with all related data', async () => {
      const insertQuery = `
        INSERT INTO operators (
          operator_code, business_name, legal_name, trade_name, operator_type,
          primary_contact, business_address, business_registration_number, tin,
          primary_region_id, allowed_regions, max_vehicles, current_vehicle_count,
          performance_score, commission_tier, wallet_balance, earnings_today,
          earnings_week, earnings_month, total_commissions_earned,
          insurance_details, certifications, compliance_documents,
          operational_hours, service_areas, special_permissions,
          partnership_start_date, is_active, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30
        ) RETURNING *
      `;

      const values = [
        testOperatorData.operator_code,
        testOperatorData.business_name,
        testOperatorData.legal_name,
        testOperatorData.trade_name,
        testOperatorData.operator_type,
        JSON.stringify(testOperatorData.primary_contact),
        JSON.stringify(testOperatorData.business_address),
        testOperatorData.business_registration_number,
        testOperatorData.tin,
        testOperatorData.primary_region_id,
        JSON.stringify([testOperatorData.primary_region_id]),
        testOperatorData.operator_type === 'tnvs' ? 3 : 10,
        0, // current_vehicle_count
        0, // performance_score
        'tier_1', // commission_tier
        0, // wallet_balance
        0, // earnings_today
        0, // earnings_week
        0, // earnings_month
        0, // total_commissions_earned
        JSON.stringify({}), // insurance_details
        JSON.stringify([]), // certifications
        JSON.stringify({}), // compliance_documents
        JSON.stringify({ start: '06:00', end: '22:00' }), // operational_hours
        JSON.stringify([]), // service_areas
        JSON.stringify({}), // special_permissions
        testOperatorData.partnership_start_date,
        true, // is_active
        new Date().toISOString(),
        new Date().toISOString()
      ];

      const result = await testPool.query(insertQuery, values);
      
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toMatchObject({
        operator_code: testOperatorData.operator_code,
        business_name: testOperatorData.business_name,
        operator_type: testOperatorData.operator_type,
        max_vehicles: 3 // TNVS limit
      });

      testOperatorId = result.rows[0].id;
    });

    it('should enforce unique operator code constraint', async () => {
      // Insert first operator
      await testPool.query(`
        INSERT INTO operators (operator_code, business_name, legal_name, operator_type, primary_contact, business_address, business_registration_number, primary_region_id, partnership_start_date, is_active, created_at, updated_at)
        VALUES ('UNIQUE-001', 'First Operator', 'First Operator Corp', 'tnvs', '{}', '{}', 'DTI-001', 'ncr-001', NOW(), true, NOW(), NOW())
      `);

      // Try to insert second operator with same code
      await expect(testPool.query(`
        INSERT INTO operators (operator_code, business_name, legal_name, operator_type, primary_contact, business_address, business_registration_number, primary_region_id, partnership_start_date, is_active, created_at, updated_at)
        VALUES ('UNIQUE-001', 'Second Operator', 'Second Operator Corp', 'general', '{}', '{}', 'DTI-002', 'ncr-001', NOW(), true, NOW(), NOW())
      `)).rejects.toThrow();
    });

    it('should update operator performance score correctly', async () => {
      // First create an operator
      const operatorResult = await testPool.query(`
        INSERT INTO operators (operator_code, business_name, legal_name, operator_type, primary_contact, business_address, business_registration_number, primary_region_id, partnership_start_date, performance_score, commission_tier, is_active, created_at, updated_at)
        VALUES ('OPR-UPDATE-001', 'Update Test', 'Update Test Corp', 'tnvs', '{}', '{}', 'DTI-UPDATE-001', 'ncr-001', NOW(), 75, 'tier_1', true, NOW(), NOW())
        RETURNING id
      `);

      const operatorId = operatorResult.rows[0].id;

      // Update performance score
      await testPool.query(`
        UPDATE operators 
        SET performance_score = 85, commission_tier = 'tier_2', updated_at = NOW()
        WHERE id = $1
      `, [operatorId]);

      // Verify update
      const result = await testPool.query(`
        SELECT performance_score, commission_tier 
        FROM operators 
        WHERE id = $1
      `, [operatorId]);

      expect(result.rows[0]).toMatchObject({
        performance_score: 85,
        commission_tier: 'tier_2'
      });
    });

    it('should soft delete operator', async () => {
      // Create operator
      const operatorResult = await testPool.query(`
        INSERT INTO operators (operator_code, business_name, legal_name, operator_type, primary_contact, business_address, business_registration_number, primary_region_id, partnership_start_date, is_active, created_at, updated_at)
        VALUES ('OPR-DELETE-001', 'Delete Test', 'Delete Test Corp', 'tnvs', '{}', '{}', 'DTI-DELETE-001', 'ncr-001', NOW(), true, NOW(), NOW())
        RETURNING id
      `);

      const operatorId = operatorResult.rows[0].id;

      // Soft delete
      await testPool.query(`
        UPDATE operators 
        SET is_active = false, updated_at = NOW()
        WHERE id = $1
      `, [operatorId]);

      // Verify soft delete
      const result = await testPool.query(`
        SELECT is_active FROM operators WHERE id = $1
      `, [operatorId]);

      expect(result.rows[0].is_active).toBe(false);
    });

  });

  // =====================================================
  // PERFORMANCE SCORING OPERATIONS
  // =====================================================

  describe('Performance Scoring Operations', () => {
    
    beforeEach(async () => {
      // Create test operator
      const operatorResult = await testPool.query(`
        INSERT INTO operators (operator_code, business_name, legal_name, operator_type, primary_contact, business_address, business_registration_number, primary_region_id, partnership_start_date, is_active, created_at, updated_at)
        VALUES ('OPR-PERF-001', 'Performance Test', 'Performance Test Corp', 'tnvs', '{}', '{}', 'DTI-PERF-001', 'ncr-001', NOW(), true, NOW(), NOW())
        RETURNING id
      `);
      testOperatorId = operatorResult.rows[0].id;
    });

    it('should insert performance score with detailed metrics', async () => {
      const performanceData = {
        operator_id: testOperatorId,
        scoring_period: '2024-01',
        scoring_frequency: 'monthly',
        vehicle_utilization_score: 25.5,
        driver_management_score: 22.0,
        compliance_safety_score: 23.0,
        platform_contribution_score: 17.0,
        total_score: 87.5,
        commission_tier: 'tier_2',
        tier_qualification_status: 'qualified',
        metrics_data: JSON.stringify({
          daily_vehicle_utilization: 0.85,
          peak_hour_availability: 0.90,
          fleet_efficiency_ratio: 0.80,
          driver_retention_rate: 0.95,
          driver_performance_avg: 0.88,
          training_completion_rate: 1.0,
          safety_incident_rate: 0.02,
          regulatory_compliance: 1.0,
          vehicle_maintenance_score: 0.92,
          customer_satisfaction: 4.5,
          service_area_coverage: 0.75,
          technology_adoption: 0.85
        }),
        calculated_at: new Date().toISOString(),
        calculated_by: 'system',
        is_final: true
      };

      const insertQuery = `
        INSERT INTO operator_performance_scores (
          operator_id, scoring_period, scoring_frequency,
          vehicle_utilization_score, driver_management_score,
          compliance_safety_score, platform_contribution_score,
          total_score, commission_tier, tier_qualification_status,
          metrics_data, calculated_at, calculated_by, is_final
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
        ) RETURNING *
      `;

      const values = Object.values(performanceData);
      const result = await testPool.query(insertQuery, values);

      expect(result.rows[0]).toMatchObject({
        operator_id: testOperatorId,
        total_score: 87.5,
        commission_tier: 'tier_2',
        tier_qualification_status: 'qualified'
      });
    });

    it('should retrieve performance history in chronological order', async () => {
      // Insert multiple performance scores
      const scores = [
        { period: '2024-01', score: 87.5, tier: 'tier_2' },
        { period: '2023-12', score: 82.0, tier: 'tier_2' },
        { period: '2023-11', score: 78.0, tier: 'tier_1' }
      ];

      for (const score of scores) {
        await testPool.query(`
          INSERT INTO operator_performance_scores (
            operator_id, scoring_period, scoring_frequency,
            vehicle_utilization_score, driver_management_score,
            compliance_safety_score, platform_contribution_score,
            total_score, commission_tier, tier_qualification_status,
            metrics_data, calculated_at, calculated_by, is_final
          ) VALUES (
            $1, $2, 'monthly', 20, 20, 20, 15, $3, $4, 'qualified',
            '{}', NOW(), 'system', true
          )
        `, [testOperatorId, score.period, score.score, score.tier]);
      }

      // Retrieve in chronological order
      const result = await testPool.query(`
        SELECT scoring_period, total_score, commission_tier
        FROM operator_performance_scores
        WHERE operator_id = $1
        ORDER BY scoring_period DESC
      `, [testOperatorId]);

      expect(result.rows).toHaveLength(3);
      expect(result.rows[0].scoring_period).toBe('2024-01'); // Most recent first
      expect(result.rows[2].scoring_period).toBe('2023-11'); // Oldest last
    });

  });

  // =====================================================
  // FINANCIAL OPERATIONS
  // =====================================================

  describe('Financial Operations', () => {
    
    beforeEach(async () => {
      // Create test operator
      const operatorResult = await testPool.query(`
        INSERT INTO operators (operator_code, business_name, legal_name, operator_type, primary_contact, business_address, business_registration_number, primary_region_id, partnership_start_date, wallet_balance, is_active, created_at, updated_at)
        VALUES ('OPR-FIN-001', 'Financial Test', 'Financial Test Corp', 'tnvs', '{}', '{}', 'DTI-FIN-001', 'ncr-001', NOW(), 5000.00, true, NOW(), NOW())
        RETURNING id
      `);
      testOperatorId = operatorResult.rows[0].id;
    });

    it('should record commission transaction', async () => {
      const transactionData = {
        operator_id: testOperatorId,
        transaction_type: 'commission_earned',
        amount: 100.00,
        currency: 'PHP',
        reference_number: 'TXN-DB-001',
        description: 'Commission from booking BK-001',
        booking_id: 'BK-001',
        base_fare: 500.00,
        commission_rate: 2.0,
        commission_tier: 'tier_2',
        calculation_method: 'percentage',
        calculation_details: JSON.stringify({
          base_fare: 500.00,
          commission_rate: 0.02,
          commission_amount: 100.00,
          tier: 'tier_2'
        }),
        payment_status: 'completed',
        transaction_date: new Date().toISOString(),
        reconciled: true,
        created_at: new Date().toISOString(),
        created_by: 'system'
      };

      const insertQuery = `
        INSERT INTO operator_financial_transactions (
          operator_id, transaction_type, amount, currency, reference_number,
          description, booking_id, base_fare, commission_rate, commission_tier,
          calculation_method, calculation_details, payment_status,
          transaction_date, reconciled, created_at, created_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
        ) RETURNING *
      `;

      const values = Object.values(transactionData);
      const result = await testPool.query(insertQuery, values);

      expect(result.rows[0]).toMatchObject({
        operator_id: testOperatorId,
        transaction_type: 'commission_earned',
        amount: '100.00',
        commission_tier: 'tier_2'
      });

      // Verify wallet balance is updated (would normally be done by trigger)
      await testPool.query(`
        UPDATE operators 
        SET wallet_balance = wallet_balance + $1 
        WHERE id = $2
      `, [100.00, testOperatorId]);

      const balanceResult = await testPool.query(`
        SELECT wallet_balance FROM operators WHERE id = $1
      `, [testOperatorId]);

      expect(parseFloat(balanceResult.rows[0].wallet_balance)).toBe(5100.00);
    });

    it('should process boundary fee with performance adjustments', async () => {
      const boundaryFeeData = {
        operator_id: testOperatorId,
        driver_id: 'dr-001',
        fee_date: '2024-01-15',
        base_boundary_fee: 1000.00,
        fuel_subsidy: 200.00,
        maintenance_allowance: 150.00,
        other_adjustments: 50.00,
        total_amount: 1400.00,
        vehicle_plate_number: 'ABC-1234',
        service_type: 'TNVS',
        driver_performance_score: 85,
        performance_adjustment: 100.00,
        bonus_earned: 50.00,
        payment_status: 'completed',
        payment_method: 'bank_transfer',
        paid_at: new Date().toISOString(),
        trips_completed: 25,
        hours_worked: 10,
        distance_covered_km: 250,
        driver_gross_earnings: 5000.00,
        revenue_share_percentage: 20,
        revenue_share_amount: 1000.00,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const insertQuery = `
        INSERT INTO operator_boundary_fees (
          operator_id, driver_id, fee_date, base_boundary_fee, fuel_subsidy,
          maintenance_allowance, other_adjustments, total_amount,
          vehicle_plate_number, service_type, driver_performance_score,
          performance_adjustment, bonus_earned, payment_status, payment_method,
          paid_at, trips_completed, hours_worked, distance_covered_km,
          driver_gross_earnings, revenue_share_percentage, revenue_share_amount,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20, $21, $22, $23, $24
        ) RETURNING *
      `;

      const values = Object.values(boundaryFeeData);
      const result = await testPool.query(insertQuery, values);

      expect(result.rows[0]).toMatchObject({
        operator_id: testOperatorId,
        total_amount: '1400.00',
        driver_performance_score: 85,
        performance_adjustment: '100.00'
      });
    });

    it('should create and process payout', async () => {
      const payoutData = {
        operator_id: testOperatorId,
        payout_reference: 'PO-DB-001',
        payout_amount: 4500.00,
        currency: 'PHP',
        period_start: '2024-01-01T00:00:00.000Z',
        period_end: '2024-01-31T23:59:59.000Z',
        commissions_amount: 4000.00,
        bonuses_amount: 800.00,
        adjustments_amount: -100.00,
        penalties_deducted: 50.00,
        tax_withheld: 150.00,
        other_deductions: 0.00,
        payment_method: 'bank_transfer',
        bank_account_details: JSON.stringify({
          bank_name: 'BPI',
          account_number: '1234567890',
          account_name: 'Financial Test Corp'
        }),
        status: 'pending',
        requested_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      };

      const insertQuery = `
        INSERT INTO operator_payouts (
          operator_id, payout_reference, payout_amount, currency,
          period_start, period_end, commissions_amount, bonuses_amount,
          adjustments_amount, penalties_deducted, tax_withheld,
          other_deductions, payment_method, bank_account_details,
          status, requested_at, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
        ) RETURNING *
      `;

      const values = Object.values(payoutData);
      const result = await testPool.query(insertQuery, values);

      expect(result.rows[0]).toMatchObject({
        operator_id: testOperatorId,
        payout_amount: '4500.00',
        status: 'pending'
      });

      // Simulate payout approval and processing
      const payoutId = result.rows[0].id;
      
      await testPool.query(`
        UPDATE operator_payouts 
        SET status = 'approved', approved_at = NOW(), approved_by = 'admin-001'
        WHERE id = $1
      `, [payoutId]);

      await testPool.query(`
        UPDATE operator_payouts 
        SET status = 'completed', processed_at = NOW(), completed_at = NOW()
        WHERE id = $1
      `, [payoutId]);

      const finalResult = await testPool.query(`
        SELECT status, approved_at, completed_at 
        FROM operator_payouts 
        WHERE id = $1
      `, [payoutId]);

      expect(finalResult.rows[0].status).toBe('completed');
      expect(finalResult.rows[0].approved_at).not.toBeNull();
      expect(finalResult.rows[0].completed_at).not.toBeNull();
    });

  });

  // =====================================================
  // COMPLEX QUERIES AND JOINS
  // =====================================================

  describe('Complex Queries and Joins', () => {
    
    beforeEach(async () => {
      // Create test data for complex queries
      const operatorResult = await testPool.query(`
        INSERT INTO operators (operator_code, business_name, legal_name, operator_type, primary_contact, business_address, business_registration_number, primary_region_id, partnership_start_date, performance_score, commission_tier, is_active, created_at, updated_at)
        VALUES ('OPR-COMPLEX-001', 'Complex Query Test', 'Complex Query Test Corp', 'tnvs', '{}', '{}', 'DTI-COMPLEX-001', 'ncr-001', NOW(), 85, 'tier_2', true, NOW(), NOW())
        RETURNING id
      `);
      testOperatorId = operatorResult.rows[0].id;

      // Create performance score
      await testPool.query(`
        INSERT INTO operator_performance_scores (
          operator_id, scoring_period, scoring_frequency,
          vehicle_utilization_score, driver_management_score,
          compliance_safety_score, platform_contribution_score,
          total_score, commission_tier, tier_qualification_status,
          metrics_data, calculated_at, calculated_by, is_final
        ) VALUES (
          $1, '2024-01', 'monthly', 25, 20, 22, 18, 85, 'tier_2', 'qualified',
          '{}', NOW(), 'system', true
        )
      `, [testOperatorId]);

      // Create financial transactions
      await testPool.query(`
        INSERT INTO operator_financial_transactions (
          operator_id, transaction_type, amount, currency, reference_number,
          description, commission_tier, payment_status, transaction_date,
          created_at, created_by
        ) VALUES 
        ($1, 'commission_earned', 100.00, 'PHP', 'TXN-COMPLEX-001', 'Commission 1', 'tier_2', 'completed', NOW(), NOW(), 'system'),
        ($1, 'commission_earned', 150.00, 'PHP', 'TXN-COMPLEX-002', 'Commission 2', 'tier_2', 'completed', NOW(), NOW(), 'system'),
        ($1, 'incentive_bonus', 50.00, 'PHP', 'TXN-COMPLEX-003', 'Performance bonus', 'tier_2', 'completed', NOW(), NOW(), 'system')
      `, [testOperatorId, testOperatorId, testOperatorId]);
    });

    it('should retrieve operator with performance and financial summary', async () => {
      const query = `
        SELECT 
          o.*,
          ops.total_score as current_performance_score,
          ops.commission_tier as current_tier,
          COALESCE(SUM(oft.amount), 0) as total_earnings,
          COUNT(oft.id) as total_transactions
        FROM operators o
        LEFT JOIN operator_performance_scores ops ON o.id = ops.operator_id 
          AND ops.scoring_period = '2024-01'
        LEFT JOIN operator_financial_transactions oft ON o.id = oft.operator_id
          AND oft.payment_status = 'completed'
        WHERE o.id = $1
        GROUP BY o.id, ops.total_score, ops.commission_tier
      `;

      const result = await testPool.query(query, [testOperatorId]);

      expect(result.rows[0]).toMatchObject({
        operator_code: 'OPR-COMPLEX-001',
        current_performance_score: 85,
        current_tier: 'tier_2',
        total_earnings: '300.00', // 100 + 150 + 50
        total_transactions: '3'
      });
    });

    it('should generate operator analytics with aggregations', async () => {
      // Create additional test operators for analytics
      await testPool.query(`
        INSERT INTO operators (operator_code, business_name, legal_name, operator_type, primary_contact, business_address, business_registration_number, primary_region_id, partnership_start_date, performance_score, commission_tier, is_active, created_at, updated_at)
        VALUES 
        ('OPR-ANALYTICS-001', 'Analytics Test 1', 'Analytics Test 1 Corp', 'general', '{}', '{}', 'DTI-ANALYTICS-001', 'ncr-001', NOW(), 75, 'tier_1', true, NOW(), NOW()),
        ('OPR-ANALYTICS-002', 'Analytics Test 2', 'Analytics Test 2 Corp', 'tnvs', '{}', '{}', 'DTI-ANALYTICS-002', 'region-4a', NOW(), 92, 'tier_3', true, NOW(), NOW())
      `);

      const analyticsQuery = `
        SELECT 
          COUNT(*) as total_operators,
          COUNT(CASE WHEN is_active = true THEN 1 END) as active_operators,
          COUNT(CASE WHEN operator_type = 'tnvs' THEN 1 END) as tnvs_operators,
          COUNT(CASE WHEN operator_type = 'general' THEN 1 END) as general_operators,
          COUNT(CASE WHEN commission_tier = 'tier_1' THEN 1 END) as tier_1_operators,
          COUNT(CASE WHEN commission_tier = 'tier_2' THEN 1 END) as tier_2_operators,
          COUNT(CASE WHEN commission_tier = 'tier_3' THEN 1 END) as tier_3_operators,
          AVG(performance_score) as avg_performance_score,
          primary_region_id,
          COUNT(*) as operators_per_region
        FROM operators
        WHERE is_active = true
        GROUP BY primary_region_id
        ORDER BY operators_per_region DESC
      `;

      const result = await testPool.query(analyticsQuery);

      expect(result.rows).toHaveLength(2); // Two regions: ncr-001 and region-4a
      
      const ncrStats = result.rows.find(row => row.primary_region_id === 'ncr-001');
      expect(ncrStats).toMatchObject({
        operators_per_region: '2', // OPR-COMPLEX-001 and OPR-ANALYTICS-001
        tnvs_operators: '1',
        general_operators: '1'
      });
    });

    it('should calculate monthly earnings summary with date grouping', async () => {
      // Create transactions across different dates
      await testPool.query(`
        INSERT INTO operator_financial_transactions (
          operator_id, transaction_type, amount, currency, reference_number,
          description, payment_status, transaction_date, created_at, created_by
        ) VALUES 
        ($1, 'commission_earned', 200.00, 'PHP', 'TXN-DATE-001', 'January earnings', 'completed', '2024-01-15', NOW(), 'system'),
        ($1, 'commission_earned', 300.00, 'PHP', 'TXN-DATE-002', 'February earnings', 'completed', '2024-02-15', NOW(), 'system')
      `, [testOperatorId, testOperatorId]);

      const summaryQuery = `
        SELECT 
          DATE_TRUNC('month', transaction_date) as month,
          SUM(amount) as monthly_earnings,
          COUNT(*) as transaction_count,
          AVG(amount) as avg_transaction_amount
        FROM operator_financial_transactions
        WHERE operator_id = $1 AND payment_status = 'completed'
        GROUP BY DATE_TRUNC('month', transaction_date)
        ORDER BY month DESC
      `;

      const result = await testPool.query(summaryQuery, [testOperatorId]);

      expect(result.rows).toHaveLength(3); // Current month + Jan + Feb
      expect(result.rows.find(row => 
        row.month.toISOString().startsWith('2024-01')
      )).toMatchObject({
        monthly_earnings: '200.00',
        transaction_count: '1'
      });
    });

  });

  // =====================================================
  // DATABASE CONSTRAINTS AND TRIGGERS
  // =====================================================

  describe('Database Constraints and Triggers', () => {
    
    it('should enforce foreign key constraints', async () => {
      // Try to create performance score for non-existent operator
      await expect(testPool.query(`
        INSERT INTO operator_performance_scores (
          operator_id, scoring_period, scoring_frequency,
          vehicle_utilization_score, driver_management_score,
          compliance_safety_score, platform_contribution_score,
          total_score, commission_tier, tier_qualification_status,
          calculated_at, calculated_by, is_final
        ) VALUES (
          'non-existent-id', '2024-01', 'monthly', 20, 20, 20, 15, 75, 'tier_1', 'qualified',
          NOW(), 'system', true
        )
      `)).rejects.toThrow();
    });

    it('should enforce check constraints on performance scores', async () => {
      // Create test operator first
      const operatorResult = await testPool.query(`
        INSERT INTO operators (operator_code, business_name, legal_name, operator_type, primary_contact, business_address, business_registration_number, primary_region_id, partnership_start_date, is_active, created_at, updated_at)
        VALUES ('OPR-CONSTRAINT-001', 'Constraint Test', 'Constraint Test Corp', 'tnvs', '{}', '{}', 'DTI-CONSTRAINT-001', 'ncr-001', NOW(), true, NOW(), NOW())
        RETURNING id
      `);
      
      const operatorId = operatorResult.rows[0].id;

      // Try to insert performance score with invalid total (over 100)
      await expect(testPool.query(`
        INSERT INTO operator_performance_scores (
          operator_id, scoring_period, scoring_frequency,
          vehicle_utilization_score, driver_management_score,
          compliance_safety_score, platform_contribution_score,
          total_score, commission_tier, tier_qualification_status,
          calculated_at, calculated_by, is_final
        ) VALUES (
          $1, '2024-01', 'monthly', 30, 30, 30, 30, 120, 'tier_3', 'qualified',
          NOW(), 'system', true
        )
      `, [operatorId])).rejects.toThrow();
    });

    it('should enforce non-negative amount constraints', async () => {
      // Create test operator first
      const operatorResult = await testPool.query(`
        INSERT INTO operators (operator_code, business_name, legal_name, operator_type, primary_contact, business_address, business_registration_number, primary_region_id, partnership_start_date, is_active, created_at, updated_at)
        VALUES ('OPR-AMOUNT-001', 'Amount Test', 'Amount Test Corp', 'tnvs', '{}', '{}', 'DTI-AMOUNT-001', 'ncr-001', NOW(), true, NOW(), NOW())
        RETURNING id
      `);
      
      const operatorId = operatorResult.rows[0].id;

      // Try to insert transaction with negative amount (should fail for commission_earned)
      await expect(testPool.query(`
        INSERT INTO operator_financial_transactions (
          operator_id, transaction_type, amount, currency, reference_number,
          description, payment_status, transaction_date, created_at, created_by
        ) VALUES (
          $1, 'commission_earned', -100.00, 'PHP', 'TXN-NEGATIVE', 'Invalid negative commission',
          'completed', NOW(), NOW(), 'system'
        )
      `, [operatorId])).rejects.toThrow();
    });

  });

  // =====================================================
  // TRANSACTION ROLLBACK TESTS
  // =====================================================

  describe('Database Transactions', () => {
    
    it('should rollback failed operator creation', async () => {
      const client = await testPool.connect();
      
      try {
        await client.query('BEGIN');
        
        // Create operator
        const operatorResult = await client.query(`
          INSERT INTO operators (operator_code, business_name, legal_name, operator_type, primary_contact, business_address, business_registration_number, primary_region_id, partnership_start_date, is_active, created_at, updated_at)
          VALUES ('OPR-ROLLBACK-001', 'Rollback Test', 'Rollback Test Corp', 'tnvs', '{}', '{}', 'DTI-ROLLBACK-001', 'ncr-001', NOW(), true, NOW(), NOW())
          RETURNING id
        `);
        
        const operatorId = operatorResult.rows[0].id;
        
        // Create performance score (this will succeed)
        await client.query(`
          INSERT INTO operator_performance_scores (
            operator_id, scoring_period, scoring_frequency,
            vehicle_utilization_score, driver_management_score,
            compliance_safety_score, platform_contribution_score,
            total_score, commission_tier, tier_qualification_status,
            calculated_at, calculated_by, is_final
          ) VALUES (
            $1, '2024-01', 'monthly', 20, 20, 20, 15, 75, 'tier_1', 'qualified',
            NOW(), 'system', true
          )
        `, [operatorId]);
        
        // Intentionally fail with invalid transaction
        await client.query(`
          INSERT INTO operator_financial_transactions (
            operator_id, transaction_type, amount, currency, reference_number,
            description, payment_status, transaction_date, created_at, created_by
          ) VALUES (
            'invalid-operator-id', 'commission_earned', 100.00, 'PHP', 'TXN-FAIL',
            'This should fail', 'completed', NOW(), NOW(), 'system'
          )
        `);
        
        // This should not be reached
        await client.query('COMMIT');
        
      } catch (error) {
        await client.query('ROLLBACK');
        
        // Verify rollback - operator should not exist
        const checkResult = await testPool.query(`
          SELECT id FROM operators WHERE operator_code = 'OPR-ROLLBACK-001'
        `);
        
        expect(checkResult.rows).toHaveLength(0);
        
      } finally {
        client.release();
      }
    });

  });

});