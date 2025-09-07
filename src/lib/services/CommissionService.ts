// =====================================================
// COMMISSION SERVICE - Commission calculation and tier management
// Handles commission calculations, rate management, and commission-based operations
// =====================================================

import {
  OperatorFinancialTransaction,
  CommissionRateConfig,
  CommissionTier,
  CommissionCalculationMethod,
  FinancialTransactionType,
  PaymentStatus,
  CalculateCommissionRequest,
  ICommissionService
} from '@/types/operators';
import { logger } from '@/lib/security/productionLogger';
import { v4 as uuidv4 } from 'uuid';

export class CommissionService implements ICommissionService {

  // =====================================================
  // COMMISSION CALCULATIONS
  // =====================================================

  /**
   * Calculate commission for a completed trip/booking
   */
  async calculateCommission(request: CalculateCommissionRequest): Promise<OperatorFinancialTransaction> {
    try {
      logger.info('Calculating commission', { 
        operatorId: request.operator_id, 
        bookingId: request.booking_id,
        baseFare: request.base_fare 
      });

      // Get operator data including current commission tier
      const operator = await this.getOperatorData(request.operator_id);
      if (!operator) {
        throw new Error('Operator not found');
      }

      // Get current commission rate configuration
      const rateConfig = await this.getActiveCommissionRate(operator.commission_tier, operator.primary_region_id);
      if (!rateConfig) {
        throw new Error(`No active commission rate found for tier ${operator.commission_tier}`);
      }

      // Get booking/trip details
      const bookingDetails = await this.getBookingDetails(request.booking_id);
      if (!bookingDetails) {
        throw new Error('Booking not found');
      }

      // Validate operator is eligible for commission
      await this.validateCommissionEligibility(request.operator_id, request.booking_id);

      // Calculate commission amount
      const commissionCalculation = await this.performCommissionCalculation(
        request.base_fare,
        rateConfig,
        operator,
        bookingDetails
      );

      // Create financial transaction record
      const transaction: OperatorFinancialTransaction = {
        id: uuidv4(),
        operator_id: request.operator_id,
        
        transaction_type: 'commission_earned',
        amount: commissionCalculation.commission_amount,
        currency: 'PHP',
        
        reference_number: await this.generateTransactionReference('COMM'),
        description: `Commission from booking ${request.booking_id} - ${rateConfig.rate_percentage}% of ₱${request.base_fare}`,
        external_reference: bookingDetails.external_reference,
        
        booking_id: request.booking_id,
        driver_id: bookingDetails.driver_id,
        region_id: operator.primary_region_id,
        
        // Commission details
        base_fare: request.base_fare,
        commission_rate: rateConfig.rate_percentage,
        commission_tier: operator.commission_tier,
        calculation_method: commissionCalculation.method,
        calculation_details: {
          rate_config_id: rateConfig.id,
          calculation_breakdown: commissionCalculation.breakdown,
          applied_bonuses: commissionCalculation.bonuses,
          applied_penalties: commissionCalculation.penalties,
          gross_commission: commissionCalculation.gross_commission,
          net_commission: commissionCalculation.commission_amount
        },
        
        payment_status: 'completed', // Commission is automatically earned
        payment_method: 'automatic',
        payment_processor: 'system',
        
        transaction_date: new Date().toISOString().split('T')[0],
        processed_at: new Date().toISOString(),
        settlement_date: new Date().toISOString().split('T')[0],
        
        reconciled: false,
        batch_id: await this.getCurrentBatchId(),
        
        created_at: new Date().toISOString(),
        created_by: 'system',
        notes: commissionCalculation.notes
      };

      // Save transaction to database
      await this.saveFinancialTransaction(transaction);

      // Update operator earnings
      await this.updateOperatorEarnings(request.operator_id, transaction.amount);

      // Create audit trail
      await this.createCommissionAuditRecord(transaction);

      // Trigger real-time event for commission earned
      await this.triggerCommissionEarnedEvent(transaction);

      logger.info('Commission calculated and recorded successfully', { 
        transactionId: transaction.id,
        operatorId: request.operator_id,
        commissionAmount: transaction.amount,
        commissionRate: transaction.commission_rate
      });

      return transaction;

    } catch (error) {
      logger.error('Failed to calculate commission', { error, request });
      throw error;
    }
  }

  /**
   * Get commission history for an operator
   */
  async getCommissionHistory(
    operatorId: string, 
    period?: { start: string; end: string }
  ): Promise<OperatorFinancialTransaction[]> {
    try {
      const filters = {
        operator_id: operatorId,
        transaction_type: 'commission_earned' as FinancialTransactionType,
        period_start: period?.start,
        period_end: period?.end
      };

      // In production, this would query the database with proper filtering
      const transactions = await this.queryCommissionTransactions(filters);

      return transactions;

    } catch (error) {
      logger.error('Failed to get commission history', { error, operatorId, period });
      throw error;
    }
  }

  // =====================================================
  // COMMISSION RATE MANAGEMENT
  // =====================================================

  /**
   * Update commission rates for a tier
   */
  async updateCommissionRates(tier: CommissionTier, newRate: number): Promise<void> {
    try {
      logger.info('Updating commission rates', { tier, newRate });

      // Validate rate range
      if (newRate <= 0 || newRate > 10) { // Max 10% commission
        throw new Error('Commission rate must be between 0.01% and 10%');
      }

      // Get current active rate configuration
      const currentConfig = await this.getCurrentRateConfig(tier);
      
      // End current configuration
      if (currentConfig) {
        await this.endRateConfiguration(currentConfig.id);
      }

      // Create new rate configuration
      const newRateConfig: CommissionRateConfig = {
        id: uuidv4(),
        commission_tier: tier,
        rate_percentage: newRate,
        
        // Copy requirements from current config or use defaults
        min_performance_score: currentConfig?.min_performance_score || this.getDefaultScoreRequirement(tier),
        min_tenure_months: currentConfig?.min_tenure_months || this.getDefaultTenureRequirement(tier),
        min_payment_consistency: currentConfig?.min_payment_consistency || this.getDefaultPaymentConsistencyRequirement(tier),
        min_utilization_percentile: currentConfig?.min_utilization_percentile,
        
        additional_requirements: currentConfig?.additional_requirements || {},
        
        effective_from: new Date().toISOString().split('T')[0],
        effective_until: undefined, // Open-ended
        
        region_id: undefined, // Global rate
        operator_type_override: undefined, // All operator types
        
        created_at: new Date().toISOString(),
        created_by: 'system', // Would be actual user ID
        notes: `Commission rate updated to ${newRate}% for ${tier}`,
        is_active: true
      };

      // Save new rate configuration
      await this.saveRateConfiguration(newRateConfig);

      // Update all operators with this tier to use new rate
      await this.propagateRateChangeToOperators(tier, newRate);

      // Create audit trail for rate change
      await this.createRateChangeAuditRecord(tier, currentConfig?.rate_percentage || 0, newRate);

      logger.info('Commission rates updated successfully', { tier, newRate });

    } catch (error) {
      logger.error('Failed to update commission rates', { error, tier, newRate });
      throw error;
    }
  }

  /**
   * Get all active commission rates
   */
  async getActiveRates(): Promise<CommissionRateConfig[]> {
    try {
      // In production, this would query the database
      const activeRates = await this.queryActiveRateConfigs();
      
      return activeRates;

    } catch (error) {
      logger.error('Failed to get active commission rates', { error });
      throw error;
    }
  }

  // =====================================================
  // COMMISSION CALCULATION LOGIC
  // =====================================================

  /**
   * Perform the actual commission calculation
   */
  private async performCommissionCalculation(
    baseFare: number,
    rateConfig: CommissionRateConfig,
    operator: any,
    bookingDetails: any
  ): Promise<{
    commission_amount: number;
    gross_commission: number;
    method: CommissionCalculationMethod;
    breakdown: any;
    bonuses: any[];
    penalties: any[];
    notes: string;
  }> {
    let calculation = {
      commission_amount: 0,
      gross_commission: 0,
      method: 'percentage' as CommissionCalculationMethod,
      breakdown: {},
      bonuses: [] as any[],
      penalties: [] as any[],
      notes: ''
    };

    // Base commission calculation
    const baseCommission = (baseFare * rateConfig.rate_percentage) / 100;
    calculation.gross_commission = baseCommission;
    calculation.commission_amount = baseCommission;

    // Check for performance-based bonuses
    const performanceBonuses = await this.calculatePerformanceBonuses(operator, baseFare, baseCommission);
    calculation.bonuses = performanceBonuses;
    calculation.commission_amount += performanceBonuses.reduce((sum, bonus) => sum + bonus.amount, 0);

    // Check for penalties or deductions
    const penalties = await this.calculateCommissionPenalties(operator, bookingDetails);
    calculation.penalties = penalties;
    calculation.commission_amount -= penalties.reduce((sum, penalty) => sum + penalty.amount, 0);

    // Ensure commission is not negative
    calculation.commission_amount = Math.max(0, calculation.commission_amount);

    // Build calculation breakdown
    calculation.breakdown = {
      base_fare: baseFare,
      commission_rate: rateConfig.rate_percentage,
      base_commission: baseCommission,
      total_bonuses: performanceBonuses.reduce((sum, bonus) => sum + bonus.amount, 0),
      total_penalties: penalties.reduce((sum, penalty) => sum + penalty.amount, 0),
      final_commission: calculation.commission_amount
    };

    // Generate calculation notes
    const notes = [];
    notes.push(`Base commission: ${rateConfig.rate_percentage}% of ₱${baseFare} = ₱${baseCommission.toFixed(2)}`);
    
    if (performanceBonuses.length > 0) {
      notes.push(`Performance bonuses: ₱${performanceBonuses.reduce((sum, bonus) => sum + bonus.amount, 0).toFixed(2)}`);
    }
    
    if (penalties.length > 0) {
      notes.push(`Penalties/Deductions: ₱${penalties.reduce((sum, penalty) => sum + penalty.amount, 0).toFixed(2)}`);
    }
    
    calculation.notes = notes.join('; ');

    return calculation;
  }

  /**
   * Calculate performance-based bonuses
   */
  private async calculatePerformanceBonuses(
    operator: any, 
    baseFare: number, 
    baseCommission: number
  ): Promise<any[]> {
    const bonuses = [];

    // High performance score bonus
    if (operator.performance_score >= 95) {
      bonuses.push({
        type: 'high_performance',
        amount: baseCommission * 0.1, // 10% bonus on commission
        description: 'High performance score (95+) bonus'
      });
    }

    // Tier 3 excellence bonus
    if (operator.commission_tier === 'tier_3') {
      bonuses.push({
        type: 'tier_3_excellence',
        amount: baseFare * 0.005, // Additional 0.5% of base fare
        description: 'Tier 3 excellence bonus'
      });
    }

    // Volume bonus (based on monthly trip count)
    const monthlyTrips = await this.getMonthlyTripCount(operator.id);
    if (monthlyTrips >= 1000) {
      bonuses.push({
        type: 'volume_bonus',
        amount: baseCommission * 0.05, // 5% bonus on commission
        description: `High volume bonus (${monthlyTrips} trips this month)`
      });
    }

    return bonuses;
  }

  /**
   * Calculate commission penalties or deductions
   */
  private async calculateCommissionPenalties(operator: any, bookingDetails: any): Promise<any[]> {
    const penalties = [];

    // Late payment penalty
    const hasLatePayments = await this.checkLatePayments(operator.id);
    if (hasLatePayments) {
      penalties.push({
        type: 'late_payment_penalty',
        amount: 0, // Warning only for now
        description: 'Late payment history detected'
      });
    }

    // Safety incident penalty
    const recentIncidents = await this.getRecentSafetyIncidents(operator.id);
    if (recentIncidents > 0) {
      penalties.push({
        type: 'safety_incident_penalty',
        amount: recentIncidents * 5, // ₱5 per incident
        description: `Safety incident penalty (${recentIncidents} recent incidents)`
      });
    }

    return penalties;
  }

  // =====================================================
  // DATABASE INTERFACE METHODS (Mock implementations)
  // =====================================================

  private async getOperatorData(operatorId: string): Promise<any> {
    // Mock: Get operator data from database
    logger.debug('Mock: Getting operator data', { operatorId });
    return {
      id: operatorId,
      commission_tier: 'tier_2',
      performance_score: 85.5,
      primary_region_id: 'region-1'
    };
  }

  private async getActiveCommissionRate(
    tier: CommissionTier, 
    regionId?: string
  ): Promise<CommissionRateConfig | null> {
    // Mock: Get active commission rate configuration
    logger.debug('Mock: Getting active commission rate', { tier, regionId });
    
    const mockRates: Record<CommissionTier, number> = {
      tier_1: 1.0,
      tier_2: 2.0,
      tier_3: 3.0
    };

    return {
      id: uuidv4(),
      commission_tier: tier,
      rate_percentage: mockRates[tier],
      min_performance_score: 70,
      min_tenure_months: 6,
      min_payment_consistency: 90,
      additional_requirements: {},
      effective_from: '2024-01-01',
      created_at: new Date().toISOString(),
      is_active: true
    } as CommissionRateConfig;
  }

  private async getBookingDetails(bookingId: string): Promise<any> {
    // Mock: Get booking details from database
    logger.debug('Mock: Getting booking details', { bookingId });
    return {
      id: bookingId,
      driver_id: 'driver-123',
      external_reference: 'EXT-' + bookingId,
      status: 'completed'
    };
  }

  private async validateCommissionEligibility(operatorId: string, bookingId: string): Promise<void> {
    // Mock: Validate that operator is eligible for commission on this booking
    logger.debug('Mock: Validating commission eligibility', { operatorId, bookingId });
  }

  private async generateTransactionReference(prefix: string): Promise<string> {
    // Mock: Generate unique transaction reference
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  private async getCurrentBatchId(): Promise<string> {
    // Mock: Get current batch ID for reconciliation
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    return `BATCH-${today}`;
  }

  private async saveFinancialTransaction(transaction: OperatorFinancialTransaction): Promise<void> {
    // Mock: INSERT INTO operator_financial_transactions
    logger.debug('Mock: Saving financial transaction', { 
      transactionId: transaction.id,
      operatorId: transaction.operator_id,
      amount: transaction.amount
    });
  }

  private async updateOperatorEarnings(operatorId: string, amount: number): Promise<void> {
    // Mock: UPDATE operators SET earnings_today = earnings_today + ?, total_commissions_earned = total_commissions_earned + ?
    logger.debug('Mock: Updating operator earnings', { operatorId, amount });
  }

  private async createCommissionAuditRecord(transaction: OperatorFinancialTransaction): Promise<void> {
    // Mock: INSERT INTO operator_financial_audit
    logger.debug('Mock: Creating commission audit record', { transactionId: transaction.id });
  }

  private async triggerCommissionEarnedEvent(transaction: OperatorFinancialTransaction): Promise<void> {
    // Mock: Trigger real-time WebSocket event
    logger.debug('Mock: Triggering commission earned event', { 
      operatorId: transaction.operator_id,
      amount: transaction.amount
    });
  }

  private async queryCommissionTransactions(filters: any): Promise<OperatorFinancialTransaction[]> {
    // Mock: Query commission transactions from database
    logger.debug('Mock: Querying commission transactions', { filters });
    return [];
  }

  private async getCurrentRateConfig(tier: CommissionTier): Promise<CommissionRateConfig | null> {
    // Mock: Get current rate configuration for tier
    logger.debug('Mock: Getting current rate config', { tier });
    return null;
  }

  private async endRateConfiguration(configId: string): Promise<void> {
    // Mock: Set effective_until date to end current rate config
    logger.debug('Mock: Ending rate configuration', { configId });
  }

  private async saveRateConfiguration(config: CommissionRateConfig): Promise<void> {
    // Mock: INSERT INTO commission_rate_configs
    logger.debug('Mock: Saving rate configuration', { configId: config.id, tier: config.commission_tier });
  }

  private async propagateRateChangeToOperators(tier: CommissionTier, newRate: number): Promise<void> {
    // Mock: Update all operators with this tier to use new rate
    logger.debug('Mock: Propagating rate change to operators', { tier, newRate });
  }

  private async createRateChangeAuditRecord(
    tier: CommissionTier, 
    oldRate: number, 
    newRate: number
  ): Promise<void> {
    // Mock: Create audit record for rate change
    logger.debug('Mock: Creating rate change audit record', { tier, oldRate, newRate });
  }

  private async queryActiveRateConfigs(): Promise<CommissionRateConfig[]> {
    // Mock: Query active rate configurations
    logger.debug('Mock: Querying active rate configs');
    return [];
  }

  private async getMonthlyTripCount(operatorId: string): Promise<number> {
    // Mock: Get monthly trip count for operator
    return 500;
  }

  private async checkLatePayments(operatorId: string): Promise<boolean> {
    // Mock: Check for late payment history
    return false;
  }

  private async getRecentSafetyIncidents(operatorId: string): Promise<number> {
    // Mock: Get recent safety incidents count
    return 0;
  }

  // Helper methods for default requirements
  private getDefaultScoreRequirement(tier: CommissionTier): number {
    const requirements = { tier_1: 70, tier_2: 80, tier_3: 90 };
    return requirements[tier];
  }

  private getDefaultTenureRequirement(tier: CommissionTier): number {
    const requirements = { tier_1: 6, tier_2: 12, tier_3: 18 };
    return requirements[tier];
  }

  private getDefaultPaymentConsistencyRequirement(tier: CommissionTier): number {
    const requirements = { tier_1: 90, tier_2: 90, tier_3: 95 };
    return requirements[tier];
  }
}

export const commissionService = new CommissionService();