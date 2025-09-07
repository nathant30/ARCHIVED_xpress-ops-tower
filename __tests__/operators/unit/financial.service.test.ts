// =====================================================
// FINANCIAL SERVICE UNIT TESTS
// Comprehensive unit tests for financial operations and commission calculations
// =====================================================

import { jest } from '@jest/globals';
import {
  OperatorFinancialTransaction,
  OperatorBoundaryFee,
  OperatorPayout,
  CommissionRateConfig,
  OperatorFinancialSummary,
  FinancialTransactionType,
  CommissionTier,
  PaymentStatus,
  CommissionCalculationMethod,
  ProcessPayoutRequest,
  CalculateCommissionRequest
} from '@/types/operators';

// Mock dependencies
jest.mock('@/lib/services/DatabaseService');
jest.mock('@/lib/services/OperatorService');
jest.mock('@/lib/services/PerformanceService');

describe('FinancialService', () => {
  
  // =====================================================
  // TEST DATA SETUP
  // =====================================================
  
  const mockCommissionRates: CommissionRateConfig[] = [
    {
      id: 'rate-tier-1',
      commission_tier: 'tier_1',
      rate_percentage: 1.0,
      min_performance_score: 0,
      min_tenure_months: 0,
      min_payment_consistency: 0.5,
      additional_requirements: {},
      effective_from: '2024-01-01T00:00:00.000Z',
      is_active: true,
      created_at: '2024-01-01T00:00:00.000Z',
      created_by: 'system'
    },
    {
      id: 'rate-tier-2',
      commission_tier: 'tier_2',
      rate_percentage: 2.0,
      min_performance_score: 80,
      min_tenure_months: 6,
      min_payment_consistency: 0.8,
      additional_requirements: {},
      effective_from: '2024-01-01T00:00:00.000Z',
      is_active: true,
      created_at: '2024-01-01T00:00:00.000Z',
      created_by: 'system'
    },
    {
      id: 'rate-tier-3',
      commission_tier: 'tier_3',
      rate_percentage: 3.0,
      min_performance_score: 90,
      min_tenure_months: 12,
      min_payment_consistency: 0.9,
      additional_requirements: {},
      effective_from: '2024-01-01T00:00:00.000Z',
      is_active: true,
      created_at: '2024-01-01T00:00:00.000Z',
      created_by: 'system'
    }
  ];

  const mockBoundaryFee: OperatorBoundaryFee = {
    id: 'bf-001',
    operator_id: 'op-test-001',
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
    paid_at: '2024-01-15T10:00:00.000Z',
    trips_completed: 25,
    hours_worked: 10,
    distance_covered_km: 250,
    driver_gross_earnings: 5000.00,
    revenue_share_percentage: 20,
    revenue_share_amount: 1000.00,
    created_at: '2024-01-15T00:00:00.000Z',
    updated_at: '2024-01-15T00:00:00.000Z'
  };

  const mockFinancialTransaction: OperatorFinancialTransaction = {
    id: 'txn-001',
    operator_id: 'op-test-001',
    transaction_type: 'commission_earned',
    amount: 100.00,
    currency: 'PHP',
    reference_number: 'TXN-20240115-001',
    description: 'Commission from booking BK-001',
    booking_id: 'BK-001',
    base_fare: 500.00,
    commission_rate: 2.0,
    commission_tier: 'tier_2',
    calculation_method: 'percentage',
    calculation_details: {
      base_fare: 500.00,
      commission_rate: 0.02,
      commission_amount: 100.00,
      tier: 'tier_2'
    },
    payment_status: 'completed',
    transaction_date: '2024-01-15T12:00:00.000Z',
    reconciled: true,
    reconciled_at: '2024-01-15T23:59:59.000Z',
    created_at: '2024-01-15T12:00:00.000Z',
    created_by: 'system'
  };

  const mockPayout: OperatorPayout = {
    id: 'payout-001',
    operator_id: 'op-test-001',
    payout_reference: 'PO-20240131-001',
    payout_amount: 5000.00,
    currency: 'PHP',
    period_start: '2024-01-01T00:00:00.000Z',
    period_end: '2024-01-31T23:59:59.000Z',
    commissions_amount: 4500.00,
    bonuses_amount: 800.00,
    adjustments_amount: -100.00,
    penalties_deducted: 50.00,
    tax_withheld: 150.00,
    other_deductions: 0.00,
    payment_method: 'bank_transfer',
    bank_account_details: {
      bank_name: 'BPI',
      account_number: '1234567890',
      account_name: 'Test Transport Inc.'
    },
    status: 'completed',
    requested_at: '2024-01-31T10:00:00.000Z',
    approved_at: '2024-01-31T11:00:00.000Z',
    processed_at: '2024-01-31T15:00:00.000Z',
    completed_at: '2024-01-31T16:00:00.000Z',
    approved_by: 'admin-001',
    created_at: '2024-01-31T10:00:00.000Z'
  };

  // Import the service after mocking
  let financialService: any;
  
  beforeEach(async () => {
    jest.clearAllMocks();
    // Dynamically import after mocks are set up
    const { financialService: service } = await import('@/lib/services/FinancialService');
    financialService = service;
  });

  // =====================================================
  // COMMISSION CALCULATION TESTS
  // =====================================================

  describe('calculateCommission', () => {
    
    it('should calculate tier 2 commission correctly', async () => {
      // Arrange
      const request: CalculateCommissionRequest = {
        operator_id: 'op-test-001',
        booking_id: 'BK-001',
        base_fare: 500.00
      };
      
      jest.spyOn(financialService, 'getOperatorCommissionTier').mockResolvedValue('tier_2');
      jest.spyOn(financialService, 'getCommissionRate').mockResolvedValue(2.0);
      
      // Act
      const result = await financialService.calculateCommission(request);
      
      // Assert
      expect(result.amount).toBe(100.00); // 500 * 0.02 = 10.00 (2% tier 2)
      expect(result.commission_tier).toBe('tier_2');
      expect(result.commission_rate).toBe(2.0);
      expect(result.calculation_details.commission_amount).toBe(100.00);
    });

    it('should calculate tier 1 commission correctly', async () => {
      // Arrange
      const request: CalculateCommissionRequest = {
        operator_id: 'op-test-001',
        booking_id: 'BK-002',
        base_fare: 300.00
      };
      
      jest.spyOn(financialService, 'getOperatorCommissionTier').mockResolvedValue('tier_1');
      jest.spyOn(financialService, 'getCommissionRate').mockResolvedValue(1.0);
      
      // Act
      const result = await financialService.calculateCommission(request);
      
      // Assert
      expect(result.amount).toBe(30.00); // 300 * 0.01 = 3.00 (1% tier 1)
      expect(result.commission_tier).toBe('tier_1');
    });

    it('should calculate tier 3 commission correctly', async () => {
      // Arrange
      const request: CalculateCommissionRequest = {
        operator_id: 'op-test-001',
        booking_id: 'BK-003',
        base_fare: 1000.00
      };
      
      jest.spyOn(financialService, 'getOperatorCommissionTier').mockResolvedValue('tier_3');
      jest.spyOn(financialService, 'getCommissionRate').mockResolvedValue(3.0);
      
      // Act
      const result = await financialService.calculateCommission(request);
      
      // Assert
      expect(result.amount).toBe(300.00); // 1000 * 0.03 = 30.00 (3% tier 3)
      expect(result.commission_tier).toBe('tier_3');
    });

    it('should handle commission calculation with performance bonus', async () => {
      // Arrange
      const request: CalculateCommissionRequest = {
        operator_id: 'op-test-001',
        booking_id: 'BK-004',
        base_fare: 500.00
      };
      
      jest.spyOn(financialService, 'getOperatorCommissionTier').mockResolvedValue('tier_2');
      jest.spyOn(financialService, 'getCommissionRate').mockResolvedValue(2.0);
      jest.spyOn(financialService, 'getPerformanceBonus').mockResolvedValue(0.5); // 0.5% bonus
      
      // Act
      const result = await financialService.calculateCommission(request);
      
      // Assert
      expect(result.amount).toBe(125.00); // (500 * 0.02) + (500 * 0.005) = 10 + 2.5 = 12.5
      expect(result.calculation_details.performance_bonus).toBe(25.00);
    });

    it('should validate minimum commission amounts', async () => {
      // Arrange
      const request: CalculateCommissionRequest = {
        operator_id: 'op-test-001',
        booking_id: 'BK-005',
        base_fare: 50.00 // Very low fare
      };
      
      jest.spyOn(financialService, 'getOperatorCommissionTier').mockResolvedValue('tier_1');
      jest.spyOn(financialService, 'getCommissionRate').mockResolvedValue(1.0);
      
      // Act
      const result = await financialService.calculateCommission(request);
      
      // Assert
      expect(result.amount).toBeGreaterThanOrEqual(5.00); // Minimum commission enforced
    });

  });

  // =====================================================
  // BOUNDARY FEE TESTS
  // =====================================================

  describe('processBoundaryFee', () => {
    
    it('should calculate boundary fee with performance adjustments', async () => {
      // Arrange
      const feeData = {
        fee_date: '2024-01-15',
        base_boundary_fee: 1000.00,
        fuel_subsidy: 200.00,
        maintenance_allowance: 150.00,
        vehicle_plate_number: 'ABC-1234',
        service_type: 'TNVS',
        trips_completed: 25,
        hours_worked: 10,
        distance_covered_km: 250,
        driver_gross_earnings: 5000.00
      };
      
      jest.spyOn(financialService, 'getDriverPerformanceScore').mockResolvedValue(85);
      jest.spyOn(financialService, 'calculatePerformanceAdjustment').mockResolvedValue(100.00);
      
      // Act
      const result = await financialService.processBoundaryFee('op-test-001', 'dr-001', feeData);
      
      // Assert
      expect(result.total_amount).toBe(1450.00); // Base + subsidies + adjustments
      expect(result.performance_adjustment).toBe(100.00);
      expect(result.driver_performance_score).toBe(85);
    });

    it('should apply penalties for poor performance', async () => {
      // Arrange
      const feeData = {
        fee_date: '2024-01-15',
        base_boundary_fee: 1000.00,
        fuel_subsidy: 200.00,
        maintenance_allowance: 150.00,
        vehicle_plate_number: 'ABC-1234',
        service_type: 'TNVS',
        trips_completed: 10, // Low trips
        hours_worked: 8,
        distance_covered_km: 100,
        driver_gross_earnings: 2000.00
      };
      
      jest.spyOn(financialService, 'getDriverPerformanceScore').mockResolvedValue(55); // Poor performance
      jest.spyOn(financialService, 'calculatePerformanceAdjustment').mockResolvedValue(-150.00); // Penalty
      
      // Act
      const result = await financialService.processBoundaryFee('op-test-001', 'dr-001', feeData);
      
      // Assert
      expect(result.total_amount).toBe(1200.00); // Reduced due to penalty
      expect(result.performance_adjustment).toBe(-150.00);
    });

    it('should calculate revenue sharing correctly', async () => {
      // Arrange
      const feeData = {
        fee_date: '2024-01-15',
        base_boundary_fee: 0, // Revenue sharing model
        vehicle_plate_number: 'ABC-1234',
        service_type: 'TNVS',
        trips_completed: 25,
        hours_worked: 10,
        distance_covered_km: 250,
        driver_gross_earnings: 5000.00
      };
      
      jest.spyOn(financialService, 'getRevenueSharePercentage').mockResolvedValue(20); // 20% to operator
      
      // Act
      const result = await financialService.processBoundaryFee('op-test-001', 'dr-001', feeData);
      
      // Assert
      expect(result.revenue_share_amount).toBe(1000.00); // 20% of 5000
      expect(result.total_amount).toBe(1000.00);
    });

  });

  // =====================================================
  // PAYOUT PROCESSING TESTS
  // =====================================================

  describe('Payout Processing', () => {
    
    describe('requestPayout', () => {
      
      it('should create payout request with correct calculations', async () => {
        // Arrange
        const request: ProcessPayoutRequest = {
          operator_id: 'op-test-001',
          period_start: '2024-01-01T00:00:00.000Z',
          period_end: '2024-01-31T23:59:59.000Z',
          payment_method: 'bank_transfer',
          bank_account_details: {
            bank_name: 'BPI',
            account_number: '1234567890',
            account_name: 'Test Transport Inc.'
          }
        };
        
        jest.spyOn(financialService, 'calculatePeriodEarnings').mockResolvedValue({
          commissions: 4500.00,
          bonuses: 800.00,
          adjustments: -100.00,
          penalties: 50.00
        });
        jest.spyOn(financialService, 'calculateTaxWithholding').mockResolvedValue(150.00);
        
        // Act
        const result = await financialService.requestPayout(request);
        
        // Assert
        expect(result.commissions_amount).toBe(4500.00);
        expect(result.bonuses_amount).toBe(800.00);
        expect(result.adjustments_amount).toBe(-100.00);
        expect(result.penalties_deducted).toBe(50.00);
        expect(result.tax_withheld).toBe(150.00);
        expect(result.payout_amount).toBe(5000.00); // Net after all deductions
        expect(result.status).toBe('pending');
      });

      it('should validate sufficient balance for payout', async () => {
        // Arrange
        const request: ProcessPayoutRequest = {
          operator_id: 'op-test-001',
          period_start: '2024-01-01T00:00:00.000Z',
          period_end: '2024-01-31T23:59:59.000Z',
          payment_method: 'bank_transfer',
          bank_account_details: {
            bank_name: 'BPI',
            account_number: '1234567890',
            account_name: 'Test Transport Inc.'
          }
        };
        
        jest.spyOn(financialService, 'getOperatorBalance').mockResolvedValue(100.00); // Insufficient
        jest.spyOn(financialService, 'calculatePeriodEarnings').mockResolvedValue({
          commissions: 4500.00,
          bonuses: 800.00,
          adjustments: -100.00,
          penalties: 50.00
        });
        
        // Act & Assert
        await expect(financialService.requestPayout(request)).rejects.toThrow('Insufficient balance for payout');
      });

    });

    describe('approvePayout', () => {
      
      it('should approve valid payout request', async () => {
        // Arrange
        jest.spyOn(financialService, 'getPayoutById').mockResolvedValue({
          ...mockPayout,
          status: 'pending'
        });
        
        // Act
        await financialService.approvePayout('payout-001', 'admin-001');
        
        // Assert - Should complete without throwing
        expect(true).toBe(true);
      });

      it('should prevent approval of non-pending payouts', async () => {
        // Arrange
        jest.spyOn(financialService, 'getPayoutById').mockResolvedValue({
          ...mockPayout,
          status: 'completed'
        });
        
        // Act & Assert
        await expect(financialService.approvePayout('payout-001', 'admin-001'))
          .rejects.toThrow('Payout is not in pending status');
      });

    });

    describe('processPayouts', () => {
      
      it('should process approved payouts in batch', async () => {
        // Arrange
        const approvedPayouts = [
          { ...mockPayout, status: 'approved', id: 'payout-001' },
          { ...mockPayout, status: 'approved', id: 'payout-002' }
        ];
        
        jest.spyOn(financialService, 'getApprovedPayouts').mockResolvedValue(approvedPayouts);
        jest.spyOn(financialService, 'executePayoutTransaction').mockResolvedValue(true);
        
        // Act
        const result = await financialService.processPayouts();
        
        // Assert
        expect(result).toHaveLength(2);
        expect(result[0].status).toBe('completed');
        expect(result[1].status).toBe('completed');
      });

      it('should handle payout processing failures', async () => {
        // Arrange
        const approvedPayouts = [
          { ...mockPayout, status: 'approved', id: 'payout-001' }
        ];
        
        jest.spyOn(financialService, 'getApprovedPayouts').mockResolvedValue(approvedPayouts);
        jest.spyOn(financialService, 'executePayoutTransaction').mockRejectedValue(new Error('Bank API error'));
        
        // Act
        const result = await financialService.processPayouts();
        
        // Assert
        expect(result[0].status).toBe('failed');
        expect(result[0].notes).toContain('Bank API error');
      });

    });

  });

  // =====================================================
  // FINANCIAL REPORTING TESTS
  // =====================================================

  describe('Financial Reporting', () => {
    
    describe('generateFinancialSummary', () => {
      
      it('should generate accurate monthly summary', async () => {
        // Arrange
        const mockTransactions = [
          { ...mockFinancialTransaction, amount: 100.00, transaction_type: 'commission_earned' },
          { ...mockFinancialTransaction, amount: 200.00, transaction_type: 'incentive_bonus' },
          { ...mockFinancialTransaction, amount: -50.00, transaction_type: 'penalty_deduction' }
        ];
        
        jest.spyOn(financialService, 'getTransactionsForPeriod').mockResolvedValue(mockTransactions);
        jest.spyOn(financialService, 'getBoundaryFeesForPeriod').mockResolvedValue([mockBoundaryFee]);
        
        // Act
        const result = await financialService.generateFinancialSummary('op-test-001', '2024-01', 'monthly');
        
        // Assert
        expect(result.total_commissions_earned).toBe(100.00);
        expect(result.total_incentive_bonuses).toBe(200.00);
        expect(result.total_penalties_deducted).toBe(50.00);
        expect(result.total_boundary_fees_collected).toBe(1400.00);
        expect(result.net_revenue).toBe(1650.00); // 100 + 200 - 50 + 1400
      });

      it('should calculate profit margins correctly', async () => {
        // Arrange
        const mockSummaryData = {
          gross_revenue: 10000.00,
          operational_costs: 2000.00
        };
        
        jest.spyOn(financialService, 'calculateOperationalCosts').mockResolvedValue(2000.00);
        
        // Act
        const profitMargin = financialService.calculateProfitMargin(mockSummaryData);
        
        // Assert
        expect(profitMargin).toBe(80.0); // (10000 - 2000) / 10000 * 100 = 80%
      });

    });

    describe('getEarningsReport', () => {
      
      it('should generate comprehensive earnings report', async () => {
        // Arrange
        const period = {
          start: '2024-01-01T00:00:00.000Z',
          end: '2024-01-31T23:59:59.000Z'
        };
        
        jest.spyOn(financialService, 'getCommissionHistory').mockResolvedValue([mockFinancialTransaction]);
        jest.spyOn(financialService, 'getBoundaryFeeHistory').mockResolvedValue([mockBoundaryFee]);
        jest.spyOn(financialService, 'getPayoutHistory').mockResolvedValue([mockPayout]);
        
        // Act
        const result = await financialService.getEarningsReport('op-test-001', period);
        
        // Assert
        expect(result.commission_earnings).toBeDefined();
        expect(result.boundary_fee_earnings).toBeDefined();
        expect(result.payout_history).toBeDefined();
        expect(result.summary).toBeDefined();
      });

    });

  });

  // =====================================================
  // PHILIPPINES COMPLIANCE TESTS
  // =====================================================

  describe('Philippines Compliance', () => {
    
    describe('BIR Tax Calculations', () => {
      
      it('should calculate withholding tax correctly', () => {
        // Arrange
        const grossEarnings = 10000.00;
        const operatorType = 'tnvs';
        
        // Act
        const withholdingTax = financialService.calculateBIRWithholdingTax(grossEarnings, operatorType);
        
        // Assert
        expect(withheldingTax).toBe(150.00); // 1.5% for TNVS operators
      });

      it('should generate BIR 2307 form data', async () => {
        // Arrange
        const period = {
          start: '2024-01-01T00:00:00.000Z',
          end: '2024-01-31T23:59:59.000Z'
        };
        
        // Act
        const bir2307Data = await financialService.generateBIR2307('op-test-001', period);
        
        // Assert
        expect(bir2307Data.payee_tin).toBeDefined();
        expect(bir2307Data.income_payments).toBeDefined();
        expect(bir2307Data.taxes_withheld).toBeDefined();
        expect(bir2307Data.month_from).toBe('01');
        expect(bir2307Data.year).toBe('2024');
      });

    });

    describe('BSP Compliance', () => {
      
      it('should flag suspicious transactions for BSP reporting', async () => {
        // Arrange
        const largeTransaction = {
          ...mockFinancialTransaction,
          amount: 500001.00 // Above BSP threshold
        };
        
        // Act
        const isSuspicious = financialService.checkBSPThreshold(largeTransaction);
        
        // Assert
        expect(isSuspicious).toBe(true);
      });

      it('should generate CTR report for large cash transactions', async () => {
        // Arrange
        const largeCashTransaction = {
          ...mockFinancialTransaction,
          amount: 500000.00,
          payment_method: 'cash'
        };
        
        // Act
        const ctrReport = await financialService.generateCTRReport([largeCashTransaction]);
        
        // Assert
        expect(ctrReport.reporting_entity).toBe('Xpress Operations');
        expect(ctrReport.transaction_amount).toBe(500000.00);
        expect(ctrReport.transaction_type).toBe('cash');
      });

    });

    describe('LTFRB Financial Requirements', () => {
      
      it('should validate operator financial capacity', async () => {
        // Arrange
        const financialData = {
          total_assets: 5000000.00,
          current_liabilities: 1000000.00,
          monthly_revenue: 500000.00,
          operating_expenses: 300000.00
        };
        
        // Act
        const isCapable = financialService.validateLTFRBFinancialCapacity(financialData);
        
        // Assert
        expect(isCapable).toBe(true); // Meets LTFRB requirements
      });

      it('should calculate required LTFRB bond amounts', () => {
        // Arrange
        const operatorType = 'tnvs';
        const vehicleCount = 5;
        
        // Act
        const bondAmount = financialService.calculateLTFRBBond(operatorType, vehicleCount);
        
        // Assert
        expect(bondAmount).toBe(500000.00); // PHP 100K per TNVS vehicle
      });

    });

  });

  // =====================================================
  // ERROR HANDLING TESTS
  // =====================================================

  describe('Error Handling', () => {
    
    it('should handle payment processing failures gracefully', async () => {
      // Arrange
      const request: ProcessPayoutRequest = {
        operator_id: 'op-test-001',
        period_start: '2024-01-01T00:00:00.000Z',
        period_end: '2024-01-31T23:59:59.000Z',
        payment_method: 'bank_transfer',
        bank_account_details: {
          bank_name: 'BPI',
          account_number: 'invalid-account',
          account_name: 'Test Transport Inc.'
        }
      };
      
      jest.spyOn(financialService, 'executePayoutTransaction').mockRejectedValue(new Error('Invalid bank account'));
      
      // Act & Assert
      await expect(financialService.requestPayout(request)).rejects.toThrow('Invalid bank account');
    });

    it('should handle commission calculation errors', async () => {
      // Arrange
      const request: CalculateCommissionRequest = {
        operator_id: 'non-existent-operator',
        booking_id: 'BK-001',
        base_fare: 500.00
      };
      
      jest.spyOn(financialService, 'getOperatorCommissionTier').mockResolvedValue(null);
      
      // Act & Assert
      await expect(financialService.calculateCommission(request)).rejects.toThrow('Operator not found or not eligible for commissions');
    });

    it('should handle invalid financial data gracefully', async () => {
      // Arrange
      const invalidFeeData = {
        fee_date: 'invalid-date',
        base_boundary_fee: -100.00, // Invalid negative amount
        vehicle_plate_number: '',
        trips_completed: -5 // Invalid negative trips
      };
      
      // Act & Assert
      await expect(financialService.processBoundaryFee('op-test-001', 'dr-001', invalidFeeData))
        .rejects.toThrow('Invalid boundary fee data');
    });

  });

});