// =====================================================
// OPERATORS INTEGRATION COMPREHENSIVE TEST SUITE
// Tests all integration points between operators system and existing components
// =====================================================

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { operatorsIntegrationService } from '@/lib/integration/operators-integration-service';
import { operatorAuthService } from '@/lib/integration/operators-auth-integration';
import { operatorsFraudIntegrationService } from '@/lib/integration/operators-fraud-integration';
import { database } from '@/lib/database';
import { authManager } from '@/lib/auth';

// Test data
const TEST_OPERATOR_ID = 'test-operator-123';
const TEST_USER_EMAIL = 'test@testoperator.com';
const TEST_BUSINESS_REG = 'BRN123456789';

describe('Operators Integration Test Suite', () => {
  
  beforeAll(async () => {
    // Initialize database connection
    await database.initialize();
    
    // Create test data
    await setupTestData();
  });
  
  afterAll(async () => {
    // Clean up test data
    await cleanupTestData();
    
    // Close database connection
    await database.close();
  });
  
  describe('Authentication & Authorization Integration', () => {
    
    test('should authenticate operator with valid credentials', async () => {
      const loginRequest = {
        email: TEST_USER_EMAIL,
        password: 'TestPassword123!',
        businessRegistrationNumber: TEST_BUSINESS_REG
      };
      
      const result = await operatorAuthService.authenticateOperator(loginRequest);
      
      expect(result.success).toBe(true);
      expect(result.operator).toBeDefined();
      expect(result.authContext).toBeDefined();
      expect(result.tokens).toBeDefined();
      expect(result.operator?.id).toBe(TEST_OPERATOR_ID);
    });
    
    test('should reject invalid business registration', async () => {
      const loginRequest = {
        email: TEST_USER_EMAIL,
        password: 'TestPassword123!',
        businessRegistrationNumber: 'INVALID123'
      };
      
      const result = await operatorAuthService.authenticateOperator(loginRequest);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
    });
    
    test('should check operator permissions correctly', async () => {
      // First authenticate
      const authResult = await operatorAuthService.authenticateOperator({
        email: TEST_USER_EMAIL,
        password: 'TestPassword123!',
        businessRegistrationNumber: TEST_BUSINESS_REG
      });
      
      expect(authResult.success).toBe(true);
      expect(authResult.authContext).toBeDefined();
      
      if (authResult.authContext) {
        // Test permission checking
        const hasFinancialRead = await operatorAuthService.hasPermission(
          authResult.authContext, 
          'financials:read'
        );
        expect(hasFinancialRead).toBe(true);
        
        const hasSystemAdmin = await operatorAuthService.hasPermission(
          authResult.authContext, 
          'system:admin'
        );
        expect(hasSystemAdmin).toBe(false);
      }
    });
    
    test('should validate regional access', async () => {
      const authResult = await operatorAuthService.authenticateOperator({
        email: TEST_USER_EMAIL,
        password: 'TestPassword123!',
        businessRegistrationNumber: TEST_BUSINESS_REG
      });
      
      if (authResult.authContext) {
        const hasRegionAccess = await operatorAuthService.hasRegionalAccess(
          authResult.authContext,
          'region-ncr-001'
        );
        expect(hasRegionAccess).toBe(true);
        
        const hasUnauthorizedAccess = await operatorAuthService.hasRegionalAccess(
          authResult.authContext,
          'region-cebu-001'
        );
        expect(hasUnauthorizedAccess).toBe(false);
      }
    });
    
    test('should handle MFA requirements', async () => {
      // Enable MFA for test user
      await enableMFAForTestUser();
      
      const loginRequest = {
        email: TEST_USER_EMAIL,
        password: 'TestPassword123!',
        businessRegistrationNumber: TEST_BUSINESS_REG
      };
      
      const result = await operatorAuthService.authenticateOperator(loginRequest);
      
      expect(result.success).toBe(false);
      expect(result.mfaRequired).toBe(true);
      
      // Test with MFA code
      const resultWithMFA = await operatorAuthService.authenticateOperator({
        ...loginRequest,
        mfaCode: '123456'
      });
      
      expect(resultWithMFA.success).toBe(true);
      
      // Disable MFA for cleanup
      await disableMFAForTestUser();
    });
  });
  
  describe('Fraud Detection Integration', () => {
    
    test('should generate operator fraud profile', async () => {
      const profile = await operatorsFraudIntegrationService.generateOperatorFraudProfile(TEST_OPERATOR_ID);
      
      expect(profile).toBeDefined();
      expect(profile.operatorId).toBe(TEST_OPERATOR_ID);
      expect(profile.riskScore).toBeGreaterThanOrEqual(0);
      expect(profile.riskScore).toBeLessThanOrEqual(100);
      expect(profile.riskLevel).toMatch(/^(low|medium|high|critical)$/);
      expect(Array.isArray(profile.transactionPatterns)).toBe(true);
      expect(Array.isArray(profile.temporalPatterns)).toBe(true);
    });
    
    test('should detect commission fraud patterns', async () => {
      // Create some test transactions first
      await createTestTransactions(TEST_OPERATOR_ID);
      
      const commissionFraud = await operatorsFraudIntegrationService.detectCommissionFraud(TEST_OPERATOR_ID);
      
      expect(commissionFraud).toBeDefined();
      expect(commissionFraud.operatorId).toBe(TEST_OPERATOR_ID);
      expect(commissionFraud.riskScore).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(commissionFraud.suspiciousPatterns)).toBe(true);
      expect(Array.isArray(commissionFraud.recommendedActions)).toBe(true);
    });
    
    test('should monitor transaction for fraud in real-time', async () => {
      const testTransaction = {
        id: 'test-transaction-001',
        operator_id: TEST_OPERATOR_ID,
        transaction_type: 'commission_earned',
        amount: 1500,
        currency: 'PHP',
        reference_number: 'REF001',
        description: 'Test commission',
        commission_rate: 15,
        commission_tier: 'tier_2',
        calculation_method: 'percentage',
        calculation_details: {},
        payment_status: 'completed',
        transaction_date: new Date().toISOString(),
        reconciled: false,
        created_at: new Date().toISOString(),
        created_by: 'test-system'
      };
      
      const screeningResult = await operatorsFraudIntegrationService.monitorOperatorTransaction(
        TEST_OPERATOR_ID,
        testTransaction
      );
      
      expect(screeningResult).toBeDefined();
      expect(screeningResult.operator_id).toBe(TEST_OPERATOR_ID);
      expect(screeningResult.fraud_risk_score).toBeGreaterThanOrEqual(0);
      expect(screeningResult.fraud_risk_score).toBeLessThanOrEqual(100);
      expect(screeningResult.screening_decision).toMatch(/^(approve|review|deny)$/);
    });
    
    test('should detect identity fraud indicators', async () => {
      const identityFraud = await operatorsFraudIntegrationService.detectIdentityFraud(TEST_OPERATOR_ID);
      
      expect(identityFraud).toBeDefined();
      expect(identityFraud.operatorId).toBe(TEST_OPERATOR_ID);
      expect(identityFraud.riskScore).toBeGreaterThanOrEqual(0);
      expect(identityFraud.confidence).toBeGreaterThanOrEqual(0);
      expect(identityFraud.documentFraud).toBeDefined();
      expect(identityFraud.identityTheft).toBeDefined();
      expect(identityFraud.businessFraud).toBeDefined();
    });
    
    test('should integrate with existing fraud detection systems', async () => {
      // Test the integration method
      await expect(
        operatorsFraudIntegrationService.integrateWithExistingFraudSystems(TEST_OPERATOR_ID)
      ).resolves.not.toThrow();
      
      // Verify integration was successful by checking logs or database entries
      // In a real test, you would verify actual system integrations
    });
  });
  
  describe('Payment System Integration', () => {
    
    test('should process operator commission correctly', async () => {
      const commissionData = {
        tripId: 'test-trip-001',
        baseFare: 500,
        commissionRate: 15,
        commissionTier: 'tier_2' as const,
        timestamp: new Date()
      };
      
      const transaction = await operatorsIntegrationService.processOperatorCommission(
        TEST_OPERATOR_ID, 
        commissionData
      );
      
      expect(transaction).toBeDefined();
      expect(transaction.operator_id).toBe(TEST_OPERATOR_ID);
      expect(transaction.transaction_type).toBe('commission_earned');
      expect(transaction.amount).toBe(75); // 15% of 500
      expect(transaction.base_fare).toBe(500);
      expect(transaction.commission_rate).toBe(15);
    });
    
    test('should process boundary fee payment', async () => {
      const paymentData = {
        driverId: 'test-driver-001',
        vehicleId: 'test-vehicle-001',
        feeAmount: 800,
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'wallet'
      };
      
      // First ensure operator has sufficient balance
      await updateOperatorBalance(TEST_OPERATOR_ID, 1000);
      
      const result = await operatorsIntegrationService.processBoundaryFeePayment(
        TEST_OPERATOR_ID,
        paymentData
      );
      
      expect(result).toBeDefined();
      expect(result.status).toBe('completed');
      expect(result.amount).toBe(800);
      expect(result.paymentId).toBeDefined();
    });
    
    test('should initiate operator payout', async () => {
      const payoutRequest = {
        amount: 5000,
        payoutMethod: 'bank_transfer' as const,
        destination: {
          type: 'bank_transfer',
          accountId: 'test-bank-account',
          accountDetails: { bankName: 'Test Bank', accountNumber: '123456789' }
        },
        priority: 'standard' as const,
        notes: 'Test payout'
      };
      
      const result = await operatorsIntegrationService.initiateOperatorPayout(
        TEST_OPERATOR_ID,
        payoutRequest
      );
      
      expect(result).toBeDefined();
      expect(result.payoutId).toBeDefined();
      expect(result.amount).toBeLessThanOrEqual(payoutRequest.amount); // After deductions
      expect(result.estimatedCompletion).toBeDefined();
    });
    
    test('should handle insufficient balance for boundary fees', async () => {
      const paymentData = {
        driverId: 'test-driver-001',
        vehicleId: 'test-vehicle-001',
        feeAmount: 10000, // More than available balance
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'wallet'
      };
      
      await expect(
        operatorsIntegrationService.processBoundaryFeePayment(TEST_OPERATOR_ID, paymentData)
      ).rejects.toThrow('Insufficient balance');
    });
  });
  
  describe('Vehicle & Driver Management Integration', () => {
    
    test('should link operator to vehicle', async () => {
      const testVehicleId = 'test-vehicle-002';
      await createTestVehicle(testVehicleId);
      
      const result = await operatorsIntegrationService.linkOperatorToVehicle(
        TEST_OPERATOR_ID, 
        testVehicleId
      );
      
      expect(result).toBeDefined();
      expect(result.operatorId).toBe(TEST_OPERATOR_ID);
      expect(result.vehicleId).toBe(testVehicleId);
      expect(result.status).toBe('active');
      expect(result.linkId).toBeDefined();
    });
    
    test('should assign driver to operator', async () => {
      const testDriverId = 'test-driver-002';
      await createTestDriver(testDriverId);
      
      const assignmentData = {
        assignmentType: 'permanent' as const,
        startDate: new Date().toISOString().split('T')[0],
        terms: { commissionRate: 85, benefits: ['fuel_allowance'] }
      };
      
      const result = await operatorsIntegrationService.assignDriverToOperator(
        TEST_OPERATOR_ID,
        testDriverId,
        assignmentData
      );
      
      expect(result).toBeDefined();
      expect(result.operatorId).toBe(TEST_OPERATOR_ID);
      expect(result.driverId).toBe(testDriverId);
      expect(result.status).toBe('active');
      expect(result.assignmentId).toBeDefined();
    });
    
    test('should update vehicle-operator association', async () => {
      const testVehicleId = 'test-vehicle-003';
      await createTestVehicle(testVehicleId);
      
      await expect(
        operatorsIntegrationService.updateVehicleOperatorAssociation(testVehicleId, TEST_OPERATOR_ID)
      ).resolves.not.toThrow();
      
      // Verify the association was updated
      const vehicleResult = await database.query(
        'SELECT operator_id FROM vehicles WHERE id = $1',
        [testVehicleId]
      );
      
      expect(vehicleResult.rows[0]?.operator_id).toBe(TEST_OPERATOR_ID);
    });
  });
  
  describe('Trip System Integration', () => {
    
    test('should calculate commission from trip', async () => {
      const testTripId = 'test-trip-002';
      await createTestTrip(testTripId, 600); // 600 PHP trip
      
      const result = await operatorsIntegrationService.calculateCommissionFromTrip(
        testTripId,
        TEST_OPERATOR_ID
      );
      
      expect(result).toBeDefined();
      expect(result.operatorId).toBe(TEST_OPERATOR_ID);
      expect(result.tripId).toBe(testTripId);
      expect(result.grossFare).toBe(600);
      expect(result.commissionAmount).toBeGreaterThan(0);
      expect(result.netToDriver).toBe(result.grossFare - result.commissionAmount);
      expect(result.calculationId).toBeDefined();
    });
    
    test('should update operator performance from trip', async () => {
      const testTripId = 'test-trip-003';
      await createTestTrip(testTripId, 450);
      
      await expect(
        operatorsIntegrationService.updateOperatorPerformanceFromTrip(testTripId, TEST_OPERATOR_ID)
      ).resolves.not.toThrow();
      
      // Verify performance was updated
      const operatorResult = await database.query(
        'SELECT earnings_today FROM operators WHERE id = $1',
        [TEST_OPERATOR_ID]
      );
      
      expect(parseFloat(operatorResult.rows[0]?.earnings_today || '0')).toBeGreaterThan(0);
    });
    
    test('should track operator trip metrics', async () => {
      const period = new Date().toISOString().substring(0, 7); // Current month YYYY-MM
      
      const metrics = await operatorsIntegrationService.trackOperatorTripMetrics(
        TEST_OPERATOR_ID,
        period
      );
      
      expect(metrics).toBeDefined();
      expect(metrics.operatorId).toBe(TEST_OPERATOR_ID);
      expect(metrics.period).toBe(period);
      expect(metrics.totalTrips).toBeGreaterThanOrEqual(0);
      expect(metrics.totalRevenue).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(metrics.topRoutes)).toBe(true);
      expect(Array.isArray(metrics.driverPerformance)).toBe(true);
    });
  });
  
  describe('Compliance & Regulatory Integration', () => {
    
    test('should validate operator compliance', async () => {
      const result = await operatorsIntegrationService.validateOperatorCompliance(TEST_OPERATOR_ID);
      
      expect(result).toBeDefined();
      expect(result.operatorId).toBe(TEST_OPERATOR_ID);
      expect(typeof result.overallCompliance).toBe('boolean');
      expect(result.complianceScore).toBeGreaterThanOrEqual(0);
      expect(result.complianceScore).toBeLessThanOrEqual(100);
      expect(typeof result.ltfrbCompliance).toBe('boolean');
      expect(typeof result.birCompliance).toBe('boolean');
      expect(typeof result.bspCompliance).toBe('boolean');
      expect(Array.isArray(result.violations)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
    });
    
    test('should report operator to regulators', async () => {
      const reportData = {
        reportType: 'ltfrb' as const,
        reportPeriod: '2024-09',
        data: {
          totalTrips: 500,
          totalRevenue: 250000,
          safetyIncidents: 0,
          complianceScore: 95
        },
        requiredBy: '2024-10-15'
      };
      
      const result = await operatorsIntegrationService.reportOperatorToRegulators(
        TEST_OPERATOR_ID,
        reportData
      );
      
      expect(result).toBeDefined();
      expect(result.reportId).toBeDefined();
      expect(result.submissionDate).toBeDefined();
      expect(result.status).toBe('submitted');
      expect(result.acknowledgmentNumber).toBeDefined();
    });
    
    test('should update operator regulatory status', async () => {
      const status = {
        ltfrbStatus: 'compliant' as const,
        birStatus: 'compliant' as const,
        bspStatus: 'compliant' as const,
        lastUpdated: new Date().toISOString()
      };
      
      await expect(
        operatorsIntegrationService.updateOperatorRegulatoryStatus(TEST_OPERATOR_ID, status)
      ).resolves.not.toThrow();
      
      // Verify status was updated
      const operatorResult = await database.query(
        'SELECT regulatory_status FROM operators WHERE id = $1',
        [TEST_OPERATOR_ID]
      );
      
      const storedStatus = operatorResult.rows[0]?.regulatory_status;
      expect(storedStatus).toBeDefined();
      expect(JSON.parse(storedStatus).ltfrbStatus).toBe('compliant');
    });
  });
  
  describe('Notification System Integration', () => {
    
    test('should send operator notification', async () => {
      const notification = {
        type: 'tier_change' as const,
        title: 'Commission Tier Updated',
        message: 'Your commission tier has been upgraded to Tier 2!',
        priority: 'medium' as const,
        channels: ['email', 'in_app'] as const,
        actionRequired: false
      };
      
      const result = await operatorsIntegrationService.sendOperatorNotification(
        TEST_OPERATOR_ID,
        notification
      );
      
      expect(result).toBeDefined();
      expect(result.operatorId).toBe(TEST_OPERATOR_ID);
      expect(result.notificationId).toBeDefined();
      expect(['sent', 'delivered', 'failed']).toContain(result.status);
      expect(result.channels).toBeDefined();
    });
    
    test('should subscribe operator to notifications', async () => {
      const channels = ['email', 'sms', 'push', 'in_app'] as const;
      
      await expect(
        operatorsIntegrationService.subscribeOperatorToNotifications(TEST_OPERATOR_ID, channels)
      ).resolves.not.toThrow();
      
      // Verify subscription was stored
      const result = await database.query(
        'SELECT channels FROM operator_notification_preferences WHERE operator_id = $1',
        [TEST_OPERATOR_ID]
      );
      
      expect(result.rows.length).toBeGreaterThan(0);
    });
  });
  
  describe('Real-time WebSocket Integration', () => {
    
    test('should broadcast operator update event', async () => {
      const event = {
        type: 'performance_update' as const,
        operator_id: TEST_OPERATOR_ID,
        old_score: 75,
        new_score: 82,
        old_tier: 'tier_2' as const,
        new_tier: 'tier_2' as const,
        timestamp: new Date().toISOString()
      };
      
      await expect(
        operatorsIntegrationService.broadcastOperatorUpdate(TEST_OPERATOR_ID, event)
      ).resolves.not.toThrow();
      
      // Verify event was stored
      const result = await database.query(
        'SELECT * FROM operator_events WHERE operator_id = $1 ORDER BY created_at DESC LIMIT 1',
        [TEST_OPERATOR_ID]
      );
      
      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.rows[0].event_type).toBe('performance_update');
    });
    
    test('should subscribe to operator events', async () => {
      const eventTypes = ['performance_update', 'commission_earned', 'tier_qualification'];
      
      await expect(
        operatorsIntegrationService.subscribeToOperatorEvents(TEST_OPERATOR_ID, eventTypes)
      ).resolves.not.toThrow();
      
      // Verify subscription was stored
      const result = await database.query(
        'SELECT event_types FROM operator_event_subscriptions WHERE operator_id = $1',
        [TEST_OPERATOR_ID]
      );
      
      expect(result.rows.length).toBeGreaterThan(0);
    });
  });
  
  describe('Monitoring & Analytics Integration', () => {
    
    test('should generate operator analytics', async () => {
      const period = '2024-09';
      
      const analytics = await operatorsIntegrationService.generateOperatorAnalytics(
        TEST_OPERATOR_ID,
        period
      );
      
      expect(analytics).toBeDefined();
      expect(analytics.operatorId).toBe(TEST_OPERATOR_ID);
      expect(analytics.reportPeriod).toBe(period);
      expect(analytics.generatedAt).toBeDefined();
      expect(analytics.totalRevenue).toBeGreaterThanOrEqual(0);
      expect(analytics.performanceScore).toBeGreaterThanOrEqual(0);
      expect(analytics.activeVehicles).toBeGreaterThanOrEqual(0);
      expect(analytics.complianceScore).toBeGreaterThanOrEqual(0);
    });
    
    test('should track operator KPIs', async () => {
      const kpiData = await operatorsIntegrationService.trackOperatorKPIs(TEST_OPERATOR_ID);
      
      expect(kpiData).toBeDefined();
      expect(kpiData.operatorId).toBe(TEST_OPERATOR_ID);
      expect(kpiData.measurementDate).toBeDefined();
      expect(kpiData.kpis).toBeDefined();
      expect(kpiData.kpis.monthlyRevenue).toBeGreaterThanOrEqual(0);
      expect(kpiData.kpis.customerSatisfaction).toBeGreaterThanOrEqual(0);
      expect(kpiData.kpis.safetyScore).toBeGreaterThanOrEqual(0);
    });
    
    test('should monitor operator system health', async () => {
      const healthStatus = await operatorsIntegrationService.monitorOperatorSystemHealth(TEST_OPERATOR_ID);
      
      expect(healthStatus).toBeDefined();
      expect(healthStatus.operatorId).toBe(TEST_OPERATOR_ID);
      expect(healthStatus.healthScore).toBeGreaterThanOrEqual(0);
      expect(healthStatus.healthScore).toBeLessThanOrEqual(100);
      expect(['healthy', 'warning', 'critical', 'maintenance']).toContain(healthStatus.status);
      expect(healthStatus.healthMetrics).toBeDefined();
      expect(Array.isArray(healthStatus.alerts)).toBe(true);
      expect(Array.isArray(healthStatus.recommendations)).toBe(true);
    });
  });
  
  describe('End-to-End Integration Scenarios', () => {
    
    test('should handle complete operator onboarding flow', async () => {
      const newOperatorId = 'test-operator-new-001';
      
      // 1. Create operator user account
      const userData = {
        operatorId: newOperatorId,
        email: 'newoperator@test.com',
        firstName: 'New',
        lastName: 'Operator',
        role: 'dispatcher' as const,
        regionId: 'region-ncr-001',
        permissions: ['vehicles:read', 'drivers:read', 'trips:read'],
        businessInfo: {
          businessName: 'New Test Operator',
          registrationNumber: 'BRN987654321',
          taxId: 'TIN987654321',
          address: {
            street: '123 Test St',
            city: 'Quezon City',
            province: 'Metro Manila',
            region: 'NCR',
            postalCode: '1100'
          },
          contactInfo: {
            phone: '+639123456789',
            email: 'contact@newoperator.com'
          }
        }
      };
      
      // Create the user first (this would be part of operator creation in real flow)
      await createTestOperatorUser(newOperatorId, userData);
      
      const user = await operatorsIntegrationService.createOperatorUser(userData);
      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
      
      // 2. Authenticate the new operator
      const authResult = await operatorAuthService.authenticateOperator({
        email: userData.email,
        password: 'temporaryPassword123!',
        businessRegistrationNumber: userData.businessInfo.registrationNumber
      });
      
      expect(authResult.success).toBe(true);
      
      // 3. Generate initial fraud profile
      const fraudProfile = await operatorsFraudIntegrationService.generateOperatorFraudProfile(newOperatorId);
      expect(fraudProfile.operatorId).toBe(newOperatorId);
      
      // 4. Validate initial compliance
      const compliance = await operatorsIntegrationService.validateOperatorCompliance(newOperatorId);
      expect(compliance.operatorId).toBe(newOperatorId);
      
      // 5. Set up notifications
      await operatorsIntegrationService.subscribeOperatorToNotifications(
        newOperatorId, 
        ['email', 'in_app']
      );
      
      // Cleanup
      await cleanupTestOperator(newOperatorId);
    });
    
    test('should handle operator performance tier upgrade scenario', async () => {
      // 1. Generate commission to improve performance
      const commissionData = {
        tripId: 'test-trip-upgrade-001',
        baseFare: 1000,
        commissionRate: 15,
        commissionTier: 'tier_2' as const,
        timestamp: new Date()
      };
      
      const transaction = await operatorsIntegrationService.processOperatorCommission(
        TEST_OPERATOR_ID,
        commissionData
      );
      
      expect(transaction.amount).toBe(150); // 15% of 1000
      
      // 2. Update performance metrics (simulate trip completion)
      await operatorsIntegrationService.updateOperatorPerformanceFromTrip(
        commissionData.tripId,
        TEST_OPERATOR_ID
      );
      
      // 3. Check if performance qualifies for tier upgrade
      const compliance = await operatorsIntegrationService.validateOperatorCompliance(TEST_OPERATOR_ID);
      expect(compliance.complianceScore).toBeGreaterThanOrEqual(0);
      
      // 4. Send tier upgrade notification
      const notification = {
        type: 'tier_change' as const,
        title: 'Performance Tier Updated',
        message: 'Your performance qualifies for a higher commission tier!',
        priority: 'medium' as const,
        channels: ['email', 'in_app'] as const,
        actionRequired: false
      };
      
      const notificationResult = await operatorsIntegrationService.sendOperatorNotification(
        TEST_OPERATOR_ID,
        notification
      );
      
      expect(notificationResult.status).toMatch(/^(sent|delivered)$/);
    });
    
    test('should handle fraud detection and response scenario', async () => {
      // 1. Create suspicious transaction pattern
      const suspiciousTransaction = {
        id: 'test-suspicious-001',
        operator_id: TEST_OPERATOR_ID,
        transaction_type: 'commission_earned',
        amount: 50000, // Unusually high amount
        currency: 'PHP',
        reference_number: 'SUSP001',
        description: 'Suspicious large commission',
        commission_rate: 15,
        commission_tier: 'tier_2',
        calculation_method: 'percentage',
        calculation_details: {},
        payment_status: 'pending',
        transaction_date: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
        reconciled: false,
        created_at: new Date().toISOString(),
        created_by: 'test-system'
      };
      
      // 2. Monitor transaction for fraud
      const screeningResult = await operatorsFraudIntegrationService.monitorOperatorTransaction(
        TEST_OPERATOR_ID,
        suspiciousTransaction
      );
      
      expect(screeningResult.fraud_risk_score).toBeGreaterThan(20); // Should be flagged as risky
      
      // 3. If high risk, generate fraud alert
      if (screeningResult.fraud_risk_score >= 60) {
        expect(screeningResult.screening_decision).toMatch(/^(review|deny)$/);
        
        // 4. Send fraud alert notification
        const alertNotification = {
          type: 'performance_alert' as const,
          title: 'Fraud Alert',
          message: 'Suspicious transaction detected and is under review.',
          priority: 'high' as const,
          channels: ['email', 'in_app'] as const,
          actionRequired: true
        };
        
        const alertResult = await operatorsIntegrationService.sendOperatorNotification(
          TEST_OPERATOR_ID,
          alertNotification
        );
        
        expect(alertResult.status).toBeDefined();
      }
      
      // 5. Check fraud profile was updated
      const fraudProfile = await operatorsFraudIntegrationService.generateOperatorFraudProfile(TEST_OPERATOR_ID);
      expect(fraudProfile.riskScore).toBeGreaterThanOrEqual(screeningResult.fraud_risk_score * 0.5);
    });
  });
  
  // =====================================================
  // TEST HELPER FUNCTIONS
  // =====================================================
  
  async function setupTestData() {
    // Create test region
    await database.query(`
      INSERT INTO regions (id, name, code, country, timezone) 
      VALUES ('region-ncr-001', 'National Capital Region', 'NCR', 'Philippines', 'Asia/Manila')
      ON CONFLICT (id) DO NOTHING
    `);
    
    // Create test user
    const passwordHash = await authManager.hashPassword('TestPassword123!');
    await database.query(`
      INSERT INTO users (id, email, username, first_name, last_name, password_hash, status, role)
      VALUES ('test-user-001', '${TEST_USER_EMAIL}', 'testoperator', 'Test', 'Operator', '${passwordHash}', 'active', 'dispatcher')
      ON CONFLICT (email) DO UPDATE SET password_hash = '${passwordHash}'
    `);
    
    // Create test operator
    await database.query(`
      INSERT INTO operators (
        id, operator_code, business_name, legal_name, operator_type, status,
        primary_contact, business_address, business_registration_number, 
        primary_region_id, allowed_regions, user_id, is_active
      ) VALUES (
        '${TEST_OPERATOR_ID}', 'TOP001', 'Test Operator Co.', 'Test Operator Legal Inc.', 
        'tnvs', 'active', 
        '{"name": "Test Contact", "phone": "+639123456789", "email": "${TEST_USER_EMAIL}", "position": "Manager"}',
        '{"street": "123 Test St", "city": "Quezon City", "province": "Metro Manila", "region": "NCR", "postal_code": "1100", "country": "Philippines"}',
        '${TEST_BUSINESS_REG}', 'region-ncr-001', '["region-ncr-001"]', 'test-user-001', true
      ) ON CONFLICT (id) DO UPDATE SET 
        business_registration_number = '${TEST_BUSINESS_REG}',
        user_id = 'test-user-001'
    `);
  }
  
  async function cleanupTestData() {
    // Clean up in reverse order of dependencies
    await database.query('DELETE FROM operator_events WHERE operator_id = $1', [TEST_OPERATOR_ID]);
    await database.query('DELETE FROM operator_financial_transactions WHERE operator_id = $1', [TEST_OPERATOR_ID]);
    await database.query('DELETE FROM fraud_screening_results WHERE operator_id = $1', [TEST_OPERATOR_ID]);
    await database.query('DELETE FROM fraud_alerts WHERE operator_id = $1', [TEST_OPERATOR_ID]);
    await database.query('DELETE FROM operator_notifications WHERE operator_id = $1', [TEST_OPERATOR_ID]);
    await database.query('DELETE FROM operator_drivers WHERE operator_id = $1', [TEST_OPERATOR_ID]);
    await database.query('DELETE FROM operator_vehicles WHERE operator_id = $1', [TEST_OPERATOR_ID]);
    await database.query('DELETE FROM commission_calculations WHERE operator_id = $1', [TEST_OPERATOR_ID]);
    await database.query('DELETE FROM operators WHERE id = $1', [TEST_OPERATOR_ID]);
    await database.query('DELETE FROM users WHERE email = $1', [TEST_USER_EMAIL]);
    
    // Clean up test vehicles and drivers
    await database.query('DELETE FROM vehicles WHERE id LIKE $1', ['test-vehicle-%']);
    await database.query('DELETE FROM drivers WHERE id LIKE $1', ['test-driver-%']);
    await database.query('DELETE FROM trips WHERE id LIKE $1', ['test-trip-%']);
  }
  
  async function enableMFAForTestUser() {
    await database.query(
      'UPDATE users SET mfa_enabled = true WHERE email = $1',
      [TEST_USER_EMAIL]
    );
  }
  
  async function disableMFAForTestUser() {
    await database.query(
      'UPDATE users SET mfa_enabled = false WHERE email = $1',
      [TEST_USER_EMAIL]
    );
  }
  
  async function createTestTransactions(operatorId: string) {
    const transactions = [
      { type: 'commission_earned', amount: 1000 },
      { type: 'commission_earned', amount: 1200 },
      { type: 'commission_earned', amount: 800 },
      { type: 'boundary_fee', amount: 500 },
      { type: 'withdrawal', amount: 2000 }
    ];
    
    for (const transaction of transactions) {
      await database.query(`
        INSERT INTO operator_financial_transactions (
          id, operator_id, transaction_type, amount, currency, reference_number,
          description, payment_status, transaction_date, created_at, created_by
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, 'PHP', 'REF' || gen_random_uuid()::text,
          'Test transaction', 'completed', NOW(), NOW(), 'test-system'
        )
      `, [operatorId, transaction.type, transaction.amount]);
    }
  }
  
  async function updateOperatorBalance(operatorId: string, balance: number) {
    await database.query(
      'UPDATE operators SET wallet_balance = $1 WHERE id = $2',
      [balance, operatorId]
    );
  }
  
  async function createTestVehicle(vehicleId: string) {
    await database.query(`
      INSERT INTO vehicles (id, plate_number, make, model, year, status, created_at)
      VALUES ($1, 'TEST-' || $1, 'Toyota', 'Vios', 2020, 'active', NOW())
      ON CONFLICT (id) DO NOTHING
    `, [vehicleId]);
  }
  
  async function createTestDriver(driverId: string) {
    await database.query(`
      INSERT INTO drivers (id, license_number, first_name, last_name, phone, status, created_at)
      VALUES ($1, 'TEST-LIC-' || $1, 'Test', 'Driver', '+639123456789', 'active', NOW())
      ON CONFLICT (id) DO NOTHING
    `, [driverId]);
  }
  
  async function createTestTrip(tripId: string, fare: number) {
    await database.query(`
      INSERT INTO trips (
        id, operator_id, total_fare, status, pickup_address, dropoff_address,
        created_at, started_at, completed_at
      ) VALUES (
        $1, $2, $3, 'completed', 'Test Pickup', 'Test Dropoff',
        NOW(), NOW() - INTERVAL '1 hour', NOW() - INTERVAL '30 minutes'
      ) ON CONFLICT (id) DO NOTHING
    `, [tripId, TEST_OPERATOR_ID, fare]);
  }
  
  async function createTestOperatorUser(operatorId: string, userData: any) {
    await database.query(`
      INSERT INTO operators (
        id, operator_code, business_name, legal_name, operator_type, status,
        primary_contact, business_address, business_registration_number,
        primary_region_id, allowed_regions, is_active
      ) VALUES (
        $1, 'NEW001', $2, $3, 'tnvs', 'active',
        '{"name": "New Contact", "phone": "+639123456789", "email": "contact@newoperator.com", "position": "Manager"}',
        '{"street": "123 New St", "city": "Quezon City", "province": "Metro Manila", "region": "NCR", "postal_code": "1100", "country": "Philippines"}',
        $4, 'region-ncr-001', '["region-ncr-001"]', true
      ) ON CONFLICT (id) DO NOTHING
    `, [
      operatorId, 
      userData.businessInfo.businessName, 
      userData.businessInfo.businessName + ' Legal',
      userData.businessInfo.registrationNumber
    ]);
  }
  
  async function cleanupTestOperator(operatorId: string) {
    await database.query('DELETE FROM operators WHERE id = $1', [operatorId]);
    await database.query('DELETE FROM users WHERE email = $1', ['newoperator@test.com']);
  }
});