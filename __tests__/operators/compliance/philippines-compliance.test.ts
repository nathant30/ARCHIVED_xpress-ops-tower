// =====================================================
// PHILIPPINES COMPLIANCE TEST SUITE
// Comprehensive testing for Philippine regulatory compliance (BIR, BSP, LTFRB)
// =====================================================

import { test, expect } from '@playwright/test';
import axios from 'axios';
import { setupTestDatabase, cleanupTestDatabase, createTestOperator, createTestUser } from '../helpers/testDatabase';

// Philippines compliance test configuration
const COMPLIANCE_CONFIG = {
  baseURL: process.env.TEST_API_URL || 'http://localhost:4000',
  testRegions: {
    ncr: 'ncr-001',
    region4a: 'region-4a', 
    region7: 'region-7'
  },
  bir: {
    taxRates: {
      tnvs: 0.015, // 1.5%
      general: 0.02, // 2.0%
      fleet: 0.025 // 2.5%
    },
    thresholds: {
      annualGrossReceipts: 3000000, // 3M PHP threshold
      quarterlyWithholding: 250000 // 250K PHP quarterly threshold
    }
  },
  bsp: {
    ctrThreshold: 500000, // 500K PHP for Currency Transaction Reports
    strThreshold: 100000, // 100K PHP for Suspicious Transaction Reports
    amlThreshold: 1000000 // 1M PHP for AML monitoring
  },
  ltfrb: {
    vehicleLimits: {
      tnvs: 3,
      general: 10,
      fleet: 50
    },
    bondRequirements: {
      tnvs: 100000, // 100K PHP per vehicle
      general: 500000, // 500K PHP flat
      fleet: 1000000 // 1M PHP flat
    }
  }
};

describe('Philippines Regulatory Compliance Tests', () => {
  
  let adminToken: string;
  let testOperators: { [key: string]: string } = {};

  test.beforeAll(async () => {
    await setupTestDatabase();
    
    // Create admin user
    const adminUser = await createTestUser({
      email: 'compliance-admin@xpressops.com',
      password: 'ComplianceAdmin123!',
      permissions: ['manage_operators', 'view_operators', 'compliance_reports'],
      role: 'compliance_officer',
      allowedRegions: Object.values(COMPLIANCE_CONFIG.testRegions)
    });
    adminToken = adminUser.authToken;
    
    // Create test operators for different types
    const tnvsOperator = await createTestOperator({
      operator_code: 'TNVS-COMPLIANCE-001',
      business_name: 'TNVS Compliance Test Operator',
      operator_type: 'tnvs',
      primary_region_id: COMPLIANCE_CONFIG.testRegions.ncr,
      tin: '123-456-789-001'
    });
    testOperators.tnvs = tnvsOperator.id;
    
    const generalOperator = await createTestOperator({
      operator_code: 'GENERAL-COMPLIANCE-001',
      business_name: 'General Compliance Test Operator',
      operator_type: 'general',
      primary_region_id: COMPLIANCE_CONFIG.testRegions.region4a,
      tin: '987-654-321-001'
    });
    testOperators.general = generalOperator.id;
    
    const fleetOperator = await createTestOperator({
      operator_code: 'FLEET-COMPLIANCE-001',
      business_name: 'Fleet Compliance Test Operator',
      operator_type: 'fleet',
      primary_region_id: COMPLIANCE_CONFIG.testRegions.region7,
      tin: '555-666-777-001'
    });
    testOperators.fleet = fleetOperator.id;
  });

  test.afterAll(async () => {
    await cleanupTestDatabase();
  });

  // =====================================================
  // BIR (BUREAU OF INTERNAL REVENUE) COMPLIANCE TESTS
  // =====================================================

  test.describe('BIR Tax Compliance', () => {
    
    test('Should calculate withholding tax correctly for TNVS operators', async () => {
      const grossEarnings = 50000.00; // 50K PHP
      const expectedTax = grossEarnings * COMPLIANCE_CONFIG.bir.taxRates.tnvs; // 1.5%
      
      const response = await axios.post(
        `${COMPLIANCE_CONFIG.baseURL}/api/compliance/bir/calculate-withholding`,
        {
          operatorId: testOperators.tnvs,
          grossEarnings: grossEarnings,
          period: '2024-01'
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      
      expect(response.status).toBe(200);
      expect(response.data.data.withholdingTax).toBeCloseTo(expectedTax, 2);
      expect(response.data.data.taxRate).toBe(COMPLIANCE_CONFIG.bir.taxRates.tnvs);
      expect(response.data.data.operatorType).toBe('tnvs');
    });

    test('Should calculate withholding tax correctly for General operators', async () => {
      const grossEarnings = 100000.00; // 100K PHP
      const expectedTax = grossEarnings * COMPLIANCE_CONFIG.bir.taxRates.general; // 2.0%
      
      const response = await axios.post(
        `${COMPLIANCE_CONFIG.baseURL}/api/compliance/bir/calculate-withholding`,
        {
          operatorId: testOperators.general,
          grossEarnings: grossEarnings,
          period: '2024-01'
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      
      expect(response.status).toBe(200);
      expect(response.data.data.withholdingTax).toBeCloseTo(expectedTax, 2);
      expect(response.data.data.taxRate).toBe(COMPLIANCE_CONFIG.bir.taxRates.general);
      expect(response.data.data.operatorType).toBe('general');
    });

    test('Should generate BIR Form 2307 data correctly', async () => {
      const response = await axios.post(
        `${COMPLIANCE_CONFIG.baseURL}/api/compliance/bir/generate-2307`,
        {
          operatorId: testOperators.tnvs,
          period: '2024-01',
          yearEnd: false
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      
      expect(response.status).toBe(200);
      
      const form2307 = response.data.data;
      expect(form2307.payeeTin).toBe('123-456-789-001');
      expect(form2307.payorTin).toBeDefined();
      expect(form2307.incomePayments).toBeDefined();
      expect(form2307.taxesWithheld).toBeDefined();
      expect(form2307.monthFrom).toBe('01');
      expect(form2307.monthTo).toBe('01');
      expect(form2307.year).toBe('2024');
      expect(form2307.sequenceNumber).toBeDefined();
    });

    test('Should generate BIR quarterly returns', async () => {
      const response = await axios.post(
        `${COMPLIANCE_CONFIG.baseURL}/api/compliance/bir/quarterly-return`,
        {
          quarter: 1,
          year: 2024,
          operatorIds: [testOperators.tnvs, testOperators.general]
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      
      expect(response.status).toBe(200);
      
      const quarterlyReturn = response.data.data;
      expect(quarterlyReturn.quarter).toBe(1);
      expect(quarterlyReturn.year).toBe(2024);
      expect(quarterlyReturn.totalWithholding).toBeGreaterThanOrEqual(0);
      expect(quarterlyReturn.totalIncomePayments).toBeGreaterThanOrEqual(0);
      expect(quarterlyReturn.operatorSummaries).toBeDefined();
      expect(Array.isArray(quarterlyReturn.operatorSummaries)).toBe(true);
    });

    test('Should validate TIN format compliance', async () => {
      const invalidTins = [
        '123456789',     // No dashes
        '123-45-678-90', // Wrong format
        '12-456-789-000', // Wrong segment length
        'ABC-456-789-000', // Letters
        '123-456-78-000', // Missing digit
        ''               // Empty
      ];
      
      for (const tin of invalidTins) {
        const operatorData = {
          operator_code: `TIN-TEST-${Math.random().toString(36).substr(2, 9)}`,
          business_name: 'TIN Validation Test',
          legal_name: 'TIN Validation Test Corp',
          operator_type: 'tnvs',
          primary_contact: {
            name: 'Test Contact',
            phone: '+639123456789',
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
          business_registration_number: 'DTI-TIN-TEST-001',
          tin: tin,
          primary_region_id: COMPLIANCE_CONFIG.testRegions.ncr,
          partnership_start_date: '2024-01-01T00:00:00.000Z'
        };
        
        const response = await axios.post(
          `${COMPLIANCE_CONFIG.baseURL}/api/operators`,
          operatorData,
          {
            headers: { Authorization: `Bearer ${adminToken}` },
            validateStatus: () => true
          }
        );
        
        expect(response.status).toBe(400);
        expect(response.data.errors).toContainEqual(
          expect.objectContaining({
            field: 'tin',
            code: 'INVALID_TIN_FORMAT'
          })
        );
      }
    });

    test('Should enforce VAT registration requirements for large operators', async () => {
      const largeOperatorData = {
        operator_code: 'VAT-TEST-001',
        business_name: 'Large VAT Test Operator',
        legal_name: 'Large VAT Test Operator Corp',
        operator_type: 'fleet',
        primary_contact: {
          name: 'VAT Contact',
          phone: '+639123456789',
          email: 'vat@test.com',
          position: 'Manager'
        },
        business_address: {
          street: '1 VAT Street',
          city: 'Makati',
          province: 'Metro Manila',
          region: 'NCR',
          postal_code: '1226',
          country: 'Philippines'
        },
        business_registration_number: 'DTI-VAT-001',
        tin: '999-888-777-000',
        primary_region_id: COMPLIANCE_CONFIG.testRegions.ncr,
        partnership_start_date: '2024-01-01T00:00:00.000Z',
        annual_gross_receipts: 4000000.00 // Above VAT threshold
      };
      
      const response = await axios.post(
        `${COMPLIANCE_CONFIG.baseURL}/api/operators`,
        largeOperatorData,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      
      expect(response.status).toBe(201);
      
      // Check VAT registration requirement
      const vatCheckResponse = await axios.get(
        `${COMPLIANCE_CONFIG.baseURL}/api/compliance/bir/vat-status/${response.data.data.operator.id}`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      
      expect(vatCheckResponse.status).toBe(200);
      expect(vatCheckResponse.data.data.vatRequired).toBe(true);
      expect(vatCheckResponse.data.data.reason).toContain('annual gross receipts');
    });

  });

  // =====================================================
  // BSP (BANGKO SENTRAL NG PILIPINAS) COMPLIANCE TESTS
  // =====================================================

  test.describe('BSP Anti-Money Laundering Compliance', () => {
    
    test('Should flag large cash transactions for CTR reporting', async () => {
      const largeTransaction = {
        operatorId: testOperators.general,
        transactionType: 'payout',
        amount: 600000.00, // Above BSP CTR threshold
        paymentMethod: 'cash',
        transactionDate: '2024-01-15T10:00:00.000Z'
      };
      
      const response = await axios.post(
        `${COMPLIANCE_CONFIG.baseURL}/api/compliance/bsp/check-transaction`,
        largeTransaction,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      
      expect(response.status).toBe(200);
      expect(response.data.data.ctrRequired).toBe(true);
      expect(response.data.data.threshold).toBe(COMPLIANCE_CONFIG.bsp.ctrThreshold);
      expect(response.data.data.reportType).toBe('CTR');
      expect(response.data.data.reason).toContain('cash transaction above threshold');
    });

    test('Should generate Currency Transaction Report (CTR)', async () => {
      const ctrData = {
        operatorId: testOperators.tnvs,
        transactionAmount: 750000.00,
        transactionDate: '2024-01-15T10:00:00.000Z',
        paymentMethod: 'cash',
        purpose: 'operator payout'
      };
      
      const response = await axios.post(
        `${COMPLIANCE_CONFIG.baseURL}/api/compliance/bsp/generate-ctr`,
        ctrData,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      
      expect(response.status).toBe(200);
      
      const ctr = response.data.data;
      expect(ctr.reportingEntity).toBe('Xpress Operations Tower');
      expect(ctr.transactionAmount).toBe(750000.00);
      expect(ctr.transactionType).toBe('cash');
      expect(ctr.customerTin).toBe('123-456-789-001');
      expect(ctr.reportDate).toBeDefined();
      expect(ctr.referenceNumber).toBeDefined();
    });

    test('Should detect suspicious transaction patterns', async () => {
      // Simulate multiple transactions in short timeframe
      const suspiciousTransactions = [
        { amount: 95000, time: '2024-01-15T10:00:00.000Z' },
        { amount: 98000, time: '2024-01-15T10:30:00.000Z' },
        { amount: 97000, time: '2024-01-15T11:00:00.000Z' },
        { amount: 99000, time: '2024-01-15T11:30:00.000Z' }
      ];
      
      const response = await axios.post(
        `${COMPLIANCE_CONFIG.baseURL}/api/compliance/bsp/analyze-transactions`,
        {
          operatorId: testOperators.general,
          transactions: suspiciousTransactions,
          analysisDate: '2024-01-15'
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      
      expect(response.status).toBe(200);
      expect(response.data.data.suspiciousPatterns).toBeDefined();
      expect(response.data.data.suspiciousPatterns.length).toBeGreaterThan(0);
      
      const structuringPattern = response.data.data.suspiciousPatterns.find(
        (pattern: any) => pattern.type === 'structuring'
      );
      expect(structuringPattern).toBeDefined();
      expect(structuringPattern.severity).toBe('high');
      expect(structuringPattern.strRequired).toBe(true);
    });

    test('Should generate Suspicious Transaction Report (STR)', async () => {
      const strData = {
        operatorId: testOperators.fleet,
        suspiciousActivity: 'structuring',
        transactionPattern: 'multiple_high_value_cash',
        totalAmount: 450000.00,
        transactionCount: 5,
        timeframe: '2_hours',
        description: 'Multiple cash transactions just below reporting threshold'
      };
      
      const response = await axios.post(
        `${COMPLIANCE_CONFIG.baseURL}/api/compliance/bsp/generate-str`,
        strData,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      
      expect(response.status).toBe(200);
      
      const str = response.data.data;
      expect(str.reportType).toBe('STR');
      expect(str.suspiciousActivity).toBe('structuring');
      expect(str.totalAmount).toBe(450000.00);
      expect(str.customerTin).toBe('555-666-777-001');
      expect(str.reportingEntity).toBeDefined();
      expect(str.confidential).toBe(true);
    });

    test('Should monitor cross-border transaction compliance', async () => {
      const crossBorderTransaction = {
        operatorId: testOperators.tnvs,
        amount: 800000.00,
        currency: 'USD',
        exchangeRate: 56.50,
        phpAmount: 45200000.00,
        sourceCountry: 'Singapore',
        purpose: 'investment',
        documentationComplete: true
      };
      
      const response = await axios.post(
        `${COMPLIANCE_CONFIG.baseURL}/api/compliance/bsp/cross-border-check`,
        crossBorderTransaction,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      
      expect(response.status).toBe(200);
      expect(response.data.data.complianceRequired).toBe(true);
      expect(response.data.data.requiredReports).toContain('EFTR'); // Electronic Fund Transfer Report
      expect(response.data.data.documentationStatus).toBe('complete');
    });

  });

  // =====================================================
  // LTFRB (LAND TRANSPORTATION FRANCHISING AND REGULATORY BOARD) COMPLIANCE TESTS
  // =====================================================

  test.describe('LTFRB Regulatory Compliance', () => {
    
    test('Should enforce TNVS vehicle limits', async () => {
      const tnvsOperatorId = testOperators.tnvs;
      
      // Add vehicles up to the limit
      for (let i = 1; i <= COMPLIANCE_CONFIG.ltfrb.vehicleLimits.tnvs; i++) {
        const vehicleData = {
          plate_number: `LTFRB-${i}`,
          make: 'Toyota',
          model: 'Vios',
          year: 2023,
          color: 'White',
          service_type: 'TNVS'
        };
        
        const response = await axios.post(
          `${COMPLIANCE_CONFIG.baseURL}/api/operators/${tnvsOperatorId}/vehicles`,
          vehicleData,
          { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        
        expect(response.status).toBe(201);
      }
      
      // Try to add one more vehicle (should fail)
      const excessVehicle = {
        plate_number: 'LTFRB-EXCESS',
        make: 'Honda',
        model: 'City',
        year: 2024,
        color: 'Black',
        service_type: 'TNVS'
      };
      
      const excessResponse = await axios.post(
        `${COMPLIANCE_CONFIG.baseURL}/api/operators/${tnvsOperatorId}/vehicles`,
        excessVehicle,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
          validateStatus: () => true
        }
      );
      
      expect(excessResponse.status).toBe(400);
      expect(excessResponse.data.code).toBe('LTFRB_VEHICLE_LIMIT_EXCEEDED');
      expect(excessResponse.data.message).toContain('TNVS operator vehicle limit');
    });

    test('Should validate LTFRB authority requirements', async () => {
      const operatorData = {
        operator_code: 'LTFRB-AUTH-001',
        business_name: 'LTFRB Authority Test',
        legal_name: 'LTFRB Authority Test Corp',
        operator_type: 'tnvs',
        primary_contact: {
          name: 'Authority Contact',
          phone: '+639123456789',
          email: 'authority@test.com',
          position: 'Manager'
        },
        business_address: {
          street: '1 Authority Street',
          city: 'Makati',
          province: 'Metro Manila',
          region: 'NCR',
          postal_code: '1226',
          country: 'Philippines'
        },
        business_registration_number: 'DTI-AUTH-001',
        tin: '111-222-333-000',
        primary_region_id: COMPLIANCE_CONFIG.testRegions.ncr,
        partnership_start_date: '2024-01-01T00:00:00.000Z'
        // Missing ltfrb_authority_number
      };
      
      const response = await axios.post(
        `${COMPLIANCE_CONFIG.baseURL}/api/operators`,
        operatorData,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
          validateStatus: () => true
        }
      );
      
      // Should require LTFRB authority for TNVS operators
      if (response.status === 400) {
        expect(response.data.errors).toContainEqual(
          expect.objectContaining({
            field: 'ltfrb_authority_number',
            code: 'LTFRB_AUTHORITY_REQUIRED'
          })
        );
      } else if (response.status === 201) {
        // If created, check compliance status
        const complianceResponse = await axios.get(
          `${COMPLIANCE_CONFIG.baseURL}/api/compliance/ltfrb/status/${response.data.data.operator.id}`,
          { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        
        expect(complianceResponse.data.data.authorityStatus).toBe('missing');
        expect(complianceResponse.data.data.compliant).toBe(false);
      }
    });

    test('Should calculate LTFRB bond requirements', async () => {
      const bondResponses = await Promise.all([
        axios.get(
          `${COMPLIANCE_CONFIG.baseURL}/api/compliance/ltfrb/bond-requirement/${testOperators.tnvs}`,
          { headers: { Authorization: `Bearer ${adminToken}` } }
        ),
        axios.get(
          `${COMPLIANCE_CONFIG.baseURL}/api/compliance/ltfrb/bond-requirement/${testOperators.general}`,
          { headers: { Authorization: `Bearer ${adminToken}` } }
        ),
        axios.get(
          `${COMPLIANCE_CONFIG.baseURL}/api/compliance/ltfrb/bond-requirement/${testOperators.fleet}`,
          { headers: { Authorization: `Bearer ${adminToken}` } }
        )
      ]);
      
      // TNVS bond requirement (100K per vehicle)
      expect(bondResponses[0].status).toBe(200);
      const tnvsBond = bondResponses[0].data.data;
      expect(tnvsBond.bondAmount).toBe(COMPLIANCE_CONFIG.ltfrb.bondRequirements.tnvs * 3); // 3 vehicles
      expect(tnvsBond.calculationMethod).toBe('per_vehicle');
      expect(tnvsBond.vehicleCount).toBe(3);
      
      // General operator bond requirement (500K flat)
      expect(bondResponses[1].status).toBe(200);
      const generalBond = bondResponses[1].data.data;
      expect(generalBond.bondAmount).toBe(COMPLIANCE_CONFIG.ltfrb.bondRequirements.general);
      expect(generalBond.calculationMethod).toBe('flat_rate');
      
      // Fleet operator bond requirement (1M flat)
      expect(bondResponses[2].status).toBe(200);
      const fleetBond = bondResponses[2].data.data;
      expect(fleetBond.bondAmount).toBe(COMPLIANCE_CONFIG.ltfrb.bondRequirements.fleet);
      expect(fleetBond.calculationMethod).toBe('flat_rate');
    });

    test('Should validate regional operating authority', async () => {
      const crossRegionOperator = {
        operator_code: 'CROSS-REGION-001',
        business_name: 'Cross Region Test',
        legal_name: 'Cross Region Test Corp',
        operator_type: 'general',
        primary_contact: {
          name: 'Cross Contact',
          phone: '+639123456789',
          email: 'cross@test.com',
          position: 'Manager'
        },
        business_address: {
          street: '1 Cross Street',
          city: 'Cebu City',
          province: 'Cebu',
          region: 'Region VII',
          postal_code: '6000',
          country: 'Philippines'
        },
        business_registration_number: 'DTI-CROSS-001',
        tin: '777-888-999-000',
        primary_region_id: COMPLIANCE_CONFIG.testRegions.region7,
        allowed_regions: [
          COMPLIANCE_CONFIG.testRegions.region7,
          COMPLIANCE_CONFIG.testRegions.ncr, // Cross-region operation
          COMPLIANCE_CONFIG.testRegions.region4a
        ],
        partnership_start_date: '2024-01-01T00:00:00.000Z'
      };
      
      const response = await axios.post(
        `${COMPLIANCE_CONFIG.baseURL}/api/operators`,
        crossRegionOperator,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      
      expect(response.status).toBe(201);
      
      // Check regional authority requirements
      const authorityResponse = await axios.get(
        `${COMPLIANCE_CONFIG.baseURL}/api/compliance/ltfrb/regional-authority/${response.data.data.operator.id}`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      
      expect(authorityResponse.status).toBe(200);
      const authority = authorityResponse.data.data;
      expect(authority.primaryRegion).toBe(COMPLIANCE_CONFIG.testRegions.region7);
      expect(authority.additionalRegions).toHaveLength(2);
      expect(authority.crossRegionalPermitRequired).toBe(true);
      expect(authority.additionalBondRequired).toBe(true);
    });

    test('Should generate LTFRB compliance report', async () => {
      const response = await axios.get(
        `${COMPLIANCE_CONFIG.baseURL}/api/compliance/ltfrb/report`,
        {
          params: {
            period: '2024-01',
            includeAll: true
          },
          headers: { Authorization: `Bearer ${adminToken}` }
        }
      );
      
      expect(response.status).toBe(200);
      
      const report = response.data.data;
      expect(report.reportPeriod).toBe('2024-01');
      expect(report.totalOperators).toBeGreaterThan(0);
      expect(report.operatorsByType).toBeDefined();
      expect(report.operatorsByType.tnvs).toBeGreaterThanOrEqual(1);
      expect(report.operatorsByType.general).toBeGreaterThanOrEqual(1);
      expect(report.operatorsByType.fleet).toBeGreaterThanOrEqual(1);
      
      expect(report.complianceSummary).toBeDefined();
      expect(report.complianceSummary.compliantOperators).toBeGreaterThanOrEqual(0);
      expect(report.complianceSummary.nonCompliantOperators).toBeGreaterThanOrEqual(0);
      
      expect(report.vehicleStatistics).toBeDefined();
      expect(report.bondingSummary).toBeDefined();
    });

  });

  // =====================================================
  // DATA PRIVACY ACT COMPLIANCE TESTS
  // =====================================================

  test.describe('Data Privacy Act Compliance', () => {
    
    test('Should handle personal data access requests', async () => {
      const accessRequest = {
        operatorId: testOperators.tnvs,
        requestType: 'data_portability',
        dataSubject: 'operator_owner',
        requestDate: '2024-01-15T10:00:00.000Z'
      };
      
      const response = await axios.post(
        `${COMPLIANCE_CONFIG.baseURL}/api/compliance/dpa/access-request`,
        accessRequest,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      
      expect(response.status).toBe(200);
      expect(response.data.data.requestId).toBeDefined();
      expect(response.data.data.status).toBe('processing');
      expect(response.data.data.expectedCompletion).toBeDefined();
      expect(response.data.data.dataCategories).toContain('business_information');
      expect(response.data.data.dataCategories).toContain('contact_information');
    });

    test('Should process data deletion requests', async () => {
      const deletionRequest = {
        operatorId: testOperators.general,
        requestType: 'erasure',
        reason: 'operator_terminated_services',
        retentionRequired: false
      };
      
      const response = await axios.post(
        `${COMPLIANCE_CONFIG.baseURL}/api/compliance/dpa/deletion-request`,
        deletionRequest,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      
      expect(response.status).toBe(200);
      expect(response.data.data.requestId).toBeDefined();
      expect(response.data.data.impactedSystems).toBeDefined();
      expect(response.data.data.retentionConflicts).toBeDefined();
      
      // Should identify systems with legal retention requirements
      const retentionConflicts = response.data.data.retentionConflicts;
      expect(retentionConflicts.bir_records).toBeDefined();
      expect(retentionConflicts.bsp_records).toBeDefined();
    });

    test('Should generate privacy impact assessment', async () => {
      const piaRequest = {
        operatorId: testOperators.fleet,
        assessmentType: 'full',
        dataFlowAnalysis: true,
        riskAssessment: true
      };
      
      const response = await axios.post(
        `${COMPLIANCE_CONFIG.baseURL}/api/compliance/dpa/privacy-impact-assessment`,
        piaRequest,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      
      expect(response.status).toBe(200);
      
      const pia = response.data.data;
      expect(pia.assessmentId).toBeDefined();
      expect(pia.personalDataCategories).toBeDefined();
      expect(pia.processingPurposes).toBeDefined();
      expect(pia.legalBases).toBeDefined();
      expect(pia.riskLevel).toMatch(/low|medium|high/);
      expect(pia.mitigationMeasures).toBeDefined();
      expect(pia.retentionPolicies).toBeDefined();
    });

  });

  // =====================================================
  // INTEGRATED COMPLIANCE REPORTING
  // =====================================================

  test.describe('Integrated Compliance Reporting', () => {
    
    test('Should generate comprehensive compliance dashboard', async () => {
      const response = await axios.get(
        `${COMPLIANCE_CONFIG.baseURL}/api/compliance/dashboard`,
        {
          params: { period: '2024-01' },
          headers: { Authorization: `Bearer ${adminToken}` }
        }
      );
      
      expect(response.status).toBe(200);
      
      const dashboard = response.data.data;
      
      // BIR compliance section
      expect(dashboard.bir).toBeDefined();
      expect(dashboard.bir.totalWithholding).toBeGreaterThanOrEqual(0);
      expect(dashboard.bir.operatorsWithValidTin).toBeGreaterThanOrEqual(0);
      expect(dashboard.bir.vatRegistrationRequired).toBeGreaterThanOrEqual(0);
      
      // BSP compliance section
      expect(dashboard.bsp).toBeDefined();
      expect(dashboard.bsp.ctrReportsGenerated).toBeGreaterThanOrEqual(0);
      expect(dashboard.bsp.strReportsGenerated).toBeGreaterThanOrEqual(0);
      expect(dashboard.bsp.suspiciousActivitiesDetected).toBeGreaterThanOrEqual(0);
      
      // LTFRB compliance section
      expect(dashboard.ltfrb).toBeDefined();
      expect(dashboard.ltfrb.operatorsWithAuthority).toBeGreaterThanOrEqual(0);
      expect(dashboard.ltfrb.totalBondRequirement).toBeGreaterThanOrEqual(0);
      expect(dashboard.ltfrb.vehicleLimitCompliance).toBeGreaterThanOrEqual(0);
      
      // DPA compliance section
      expect(dashboard.dpa).toBeDefined();
      expect(dashboard.dpa.activeDataRequests).toBeGreaterThanOrEqual(0);
      expect(dashboard.dpa.privacyIncidentsReported).toBeGreaterThanOrEqual(0);
      expect(dashboard.dpa.consentWithdrawalRequests).toBeGreaterThanOrEqual(0);
    });

    test('Should generate regulatory audit trail', async () => {
      const response = await axios.get(
        `${COMPLIANCE_CONFIG.baseURL}/api/compliance/audit-trail`,
        {
          params: {
            startDate: '2024-01-01',
            endDate: '2024-01-31',
            agencies: 'bir,bsp,ltfrb,dpa'
          },
          headers: { Authorization: `Bearer ${adminToken}` }
        }
      );
      
      expect(response.status).toBe(200);
      
      const auditTrail = response.data.data;
      expect(auditTrail.totalEvents).toBeGreaterThanOrEqual(0);
      expect(auditTrail.eventsByAgency).toBeDefined();
      expect(auditTrail.events).toBeDefined();
      expect(Array.isArray(auditTrail.events)).toBe(true);
      
      // Verify audit event structure
      if (auditTrail.events.length > 0) {
        const event = auditTrail.events[0];
        expect(event.eventId).toBeDefined();
        expect(event.agency).toMatch(/bir|bsp|ltfrb|dpa/);
        expect(event.eventType).toBeDefined();
        expect(event.operatorId).toBeDefined();
        expect(event.timestamp).toBeDefined();
        expect(event.details).toBeDefined();
      }
    });

    test('Should validate cross-agency compliance requirements', async () => {
      const response = await axios.post(
        `${COMPLIANCE_CONFIG.baseURL}/api/compliance/cross-validation`,
        {
          operatorIds: Object.values(testOperators),
          validationType: 'full',
          includeRecommendations: true
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      
      expect(response.status).toBe(200);
      
      const validation = response.data.data;
      expect(validation.operatorsValidated).toBe(Object.values(testOperators).length);
      expect(validation.complianceMatrix).toBeDefined();
      expect(validation.crossAgencyConflicts).toBeDefined();
      expect(validation.recommendations).toBeDefined();
      
      // Check compliance matrix structure
      Object.values(testOperators).forEach(operatorId => {
        const operatorCompliance = validation.complianceMatrix[operatorId as string];
        expect(operatorCompliance).toBeDefined();
        expect(operatorCompliance.bir).toBeDefined();
        expect(operatorCompliance.bsp).toBeDefined();
        expect(operatorCompliance.ltfrb).toBeDefined();
        expect(operatorCompliance.dpa).toBeDefined();
        expect(operatorCompliance.overallScore).toBeGreaterThanOrEqual(0);
        expect(operatorCompliance.overallScore).toBeLessThanOrEqual(100);
      });
    });

  });

  // =====================================================
  // TYPHOON SEASON AND REGIONAL ADJUSTMENTS
  // =====================================================

  test.describe('Philippines Regional and Seasonal Compliance', () => {
    
    test('Should apply typhoon season regulatory adjustments', async () => {
      const typhoonSeasonRequest = {
        region: COMPLIANCE_CONFIG.testRegions.region7,
        typhoonLevel: 'signal_3',
        effectiveDate: '2024-07-15',
        adjustmentType: 'operational_suspension'
      };
      
      const response = await axios.post(
        `${COMPLIANCE_CONFIG.baseURL}/api/compliance/regional/typhoon-adjustment`,
        typhoonSeasonRequest,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      
      expect(response.status).toBe(200);
      
      const adjustment = response.data.data;
      expect(adjustment.adjustmentActive).toBe(true);
      expect(adjustment.affectedOperators).toBeGreaterThan(0);
      expect(adjustment.regulatoryWaivers).toBeDefined();
      expect(adjustment.reportingAdjustments).toBeDefined();
      
      // Should waive certain compliance requirements during typhoons
      expect(adjustment.regulatoryWaivers.ltfrb_operational_hours).toBe(true);
      expect(adjustment.regulatoryWaivers.bir_quarterly_deadlines).toBe(false); // Tax deadlines not waived
    });

    test('Should validate regional banking and remittance compliance', async () => {
      const remittanceRequest = {
        operatorId: testOperators.tnvs,
        amount: 250000.00,
        sourceRegion: COMPLIANCE_CONFIG.testRegions.ncr,
        destinationRegion: COMPLIANCE_CONFIG.testRegions.region7,
        method: 'bank_transfer',
        purpose: 'operational_funding'
      };
      
      const response = await axios.post(
        `${COMPLIANCE_CONFIG.baseURL}/api/compliance/regional/remittance-check`,
        remittanceRequest,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      
      expect(response.status).toBe(200);
      
      const remittanceCheck = response.data.data;
      expect(remittanceCheck.complianceRequired).toBeDefined();
      expect(remittanceCheck.reportingRequirements).toBeDefined();
      expect(remittanceCheck.localBankingRules).toBeDefined();
      
      // Cross-regional transfers may have additional requirements
      if (remittanceCheck.complianceRequired) {
        expect(remittanceCheck.reportingRequirements).toContain('BSP_EFTR');
        expect(remittanceCheck.documentationRequired).toContain('purpose_declaration');
      }
    });

  });

});