import { PaymentMethod, PaymentTransaction, DriverEarnings, DriverPayout, PaymentRefund } from '@/types/payment';
import { DatabaseService } from './DatabaseService';

export class PaymentService {
  private db: DatabaseService;

  constructor(db: DatabaseService) {
    this.db = db;
  }

  // Payment Methods
  async getPaymentMethods(active_only: boolean = true): Promise<PaymentMethod[]> {
    const query = `
      SELECT * FROM payment_methods 
      WHERE ($1 = false OR is_active = true)
      ORDER BY name ASC
    `;
    const result = await this.db.query(query, [active_only]);
    return result.rows;
  }

  async getCustomerPaymentMethods(customer_id: string): Promise<any[]> {
    const query = `
      SELECT cpm.*, pm.name, pm.type, pm.provider 
      FROM customer_payment_methods cpm
      JOIN payment_methods pm ON cpm.payment_method_id = pm.id
      WHERE cpm.customer_id = $1 AND cpm.is_active = true
      ORDER BY cpm.is_default DESC, cpm.created_at DESC
    `;
    const result = await this.db.query(query, [customer_id]);
    return result.rows;
  }

  // Process Payment
  async processPayment(data: {
    ride_id?: string;
    customer_id: string;
    driver_id?: string;
    payment_method_id: string;
    amount: number;
    currency?: string;
    metadata?: Record<string, any>;
  }): Promise<PaymentTransaction> {
    const transaction_id = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Get payment method details
    const payment_method = await this.getPaymentMethodById(data.payment_method_id);
    if (!payment_method) {
      throw new Error('Payment method not found');
    }

    // Calculate fees
    const processing_fee = this.calculateProcessingFee(data.amount, payment_method);
    const net_amount = data.amount - processing_fee;

    const query = `
      INSERT INTO payment_transactions (
        transaction_id, ride_id, customer_id, driver_id, payment_method_id,
        amount, currency, status, processing_fee, net_amount, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const values = [
      transaction_id,
      data.ride_id || null,
      data.customer_id,
      data.driver_id || null,
      data.payment_method_id,
      data.amount,
      data.currency || 'PHP',
      'pending',
      processing_fee,
      net_amount,
      JSON.stringify(data.metadata || {})
    ];

    const result = await this.db.query(query, values);
    const transaction = result.rows[0];

    // Process with payment provider (mock implementation)
    try {
      const provider_result = await this.processWithProvider(transaction, payment_method);
      
      // Update transaction with provider response
      await this.updateTransactionStatus(
        transaction.id,
        provider_result.status,
        provider_result.provider_transaction_id,
        provider_result.provider_response
      );

      // If successful and has driver, calculate earnings
      if (provider_result.status === 'completed' && data.driver_id) {
        await this.calculateDriverEarnings(transaction.id, data.driver_id, net_amount);
      }

      return { ...transaction, ...provider_result };
    } catch (error) {
      await this.updateTransactionStatus(
        transaction.id,
        'failed',
        null,
        null,
        (error as Error).message
      );
      throw error;
    }
  }

  // Payment Provider Integration (Mock)
  private async processWithProvider(transaction: any, payment_method: PaymentMethod): Promise<{
    status: string;
    provider_transaction_id?: string;
    provider_response?: Record<string, any>;
  }> {
    // Mock payment processing based on method type
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay

    switch (payment_method.type) {
      case 'gcash':
        return this.processGCashPayment(transaction);
      case 'maya':
        return this.processMayaPayment(transaction);
      case 'card':
        return this.processCardPayment(transaction);
      case 'cash':
        return { status: 'completed' }; // Cash payments are immediately completed
      default:
        throw new Error(`Unsupported payment method: ${payment_method.type}`);
    }
  }

  private async processGCashPayment(transaction: any) {
    // Mock GCash API integration
    const success_rate = 0.95; // 95% success rate
    const is_successful = Math.random() < success_rate;

    if (is_successful) {
      return {
        status: 'completed',
        provider_transaction_id: `gcash_${Date.now()}`,
        provider_response: {
          reference_number: `GCash${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
          status: 'SUCCESS',
          message: 'Payment successful'
        }
      };
    } else {
      throw new Error('GCash payment failed: Insufficient balance');
    }
  }

  private async processMayaPayment(transaction: any) {
    // Mock Maya API integration
    const success_rate = 0.93; // 93% success rate
    const is_successful = Math.random() < success_rate;

    if (is_successful) {
      return {
        status: 'completed',
        provider_transaction_id: `maya_${Date.now()}`,
        provider_response: {
          payment_id: `pm_${Math.random().toString(36).substr(2, 10)}`,
          status: 'PAYMENT_SUCCESS',
          receipt_number: Math.random().toString(36).substr(2, 12).toUpperCase()
        }
      };
    } else {
      throw new Error('Maya payment failed: Card declined');
    }
  }

  private async processCardPayment(transaction: any) {
    // Mock Stripe integration
    const success_rate = 0.97; // 97% success rate
    const is_successful = Math.random() < success_rate;

    if (is_successful) {
      return {
        status: 'completed',
        provider_transaction_id: `pi_${Math.random().toString(36).substr(2, 24)}`,
        provider_response: {
          payment_intent: `pi_${Math.random().toString(36).substr(2, 24)}`,
          status: 'succeeded',
          charges: {
            id: `ch_${Math.random().toString(36).substr(2, 24)}`,
            receipt_url: `https://pay.stripe.com/receipts/${Math.random().toString(36).substr(2, 24)}`
          }
        }
      };
    } else {
      throw new Error('Card payment failed: Your card was declined');
    }
  }

  // Helper Methods
  private async getPaymentMethodById(id: string): Promise<PaymentMethod | null> {
    const query = 'SELECT * FROM payment_methods WHERE id = $1';
    const result = await this.db.query(query, [id]);
    return result.rows[0] || null;
  }

  private calculateProcessingFee(amount: number, payment_method: PaymentMethod): number {
    const percentage_fee = amount * payment_method.processing_fee_percentage;
    const total_fee = percentage_fee + payment_method.processing_fee_fixed;
    return Math.round(total_fee * 100) / 100; // Round to 2 decimal places
  }

  private async updateTransactionStatus(
    transaction_id: string,
    status: string,
    provider_transaction_id?: string | null,
    provider_response?: Record<string, any> | null,
    failure_reason?: string
  ): Promise<void> {
    const query = `
      UPDATE payment_transactions 
      SET status = $2, provider_transaction_id = $3, provider_response = $4, 
          failure_reason = $5, processed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;

    await this.db.query(query, [
      transaction_id,
      status,
      provider_transaction_id,
      provider_response ? JSON.stringify(provider_response) : null,
      failure_reason
    ]);
  }

  // Driver Earnings
  private async calculateDriverEarnings(transaction_id: string, driver_id: string, gross_amount: number): Promise<void> {
    // Get commission rates (mock - should come from driver/operator settings)
    const platform_commission_rate = 0.20; // 20%
    const operator_commission_rate = 0.05; // 5%

    const platform_commission = gross_amount * platform_commission_rate;
    const operator_commission = gross_amount * operator_commission_rate;
    const net_earnings = gross_amount - platform_commission - operator_commission;
    
    const query = `
      INSERT INTO driver_earnings (
        driver_id, transaction_id, gross_amount, platform_commission_rate,
        platform_commission, operator_commission_rate, operator_commission,
        net_earnings, final_earnings, earnings_date, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_DATE, 'confirmed')
    `;

    await this.db.query(query, [
      driver_id,
      transaction_id,
      gross_amount,
      platform_commission_rate,
      platform_commission,
      operator_commission_rate,
      operator_commission,
      net_earnings,
      net_earnings, // final_earnings = net_earnings (before incentives/tips)
    ]);
  }

  async getDriverEarnings(driver_id: string, period_start: string, period_end: string): Promise<any> {
    const earnings_query = `
      SELECT 
        SUM(gross_amount) as total_gross,
        SUM(platform_commission) as total_platform_commission,
        SUM(operator_commission) as total_operator_commission,
        SUM(net_earnings) as total_net_earnings,
        SUM(incentives) as total_incentives,
        SUM(surge_bonus) as total_surge_bonus,
        SUM(tips) as total_tips,
        SUM(adjustments) as total_adjustments,
        SUM(final_earnings) as total_final_earnings,
        COUNT(*) as total_rides
      FROM driver_earnings 
      WHERE driver_id = $1 
        AND earnings_date >= $2 
        AND earnings_date <= $3
        AND status != 'pending'
    `;

    const daily_query = `
      SELECT 
        earnings_date as date,
        COUNT(*) as rides,
        SUM(final_earnings) as earnings
      FROM driver_earnings 
      WHERE driver_id = $1 
        AND earnings_date >= $2 
        AND earnings_date <= $3
        AND status != 'pending'
      GROUP BY earnings_date
      ORDER BY earnings_date DESC
    `;

    const [earnings_result, daily_result] = await Promise.all([
      this.db.query(earnings_query, [driver_id, period_start, period_end]),
      this.db.query(daily_query, [driver_id, period_start, period_end])
    ]);

    const summary = earnings_result.rows[0];
    const daily_breakdown = daily_result.rows;

    return {
      driver_id,
      period_start,
      period_end,
      total_earnings: parseFloat(summary.total_final_earnings) || 0,
      total_rides: parseInt(summary.total_rides) || 0,
      average_earnings_per_ride: summary.total_rides > 0 
        ? parseFloat(summary.total_final_earnings) / parseInt(summary.total_rides) 
        : 0,
      earnings_breakdown: {
        gross_amount: parseFloat(summary.total_gross) || 0,
        platform_commission: parseFloat(summary.total_platform_commission) || 0,
        operator_commission: parseFloat(summary.total_operator_commission) || 0,
        net_earnings: parseFloat(summary.total_net_earnings) || 0,
        incentives: parseFloat(summary.total_incentives) || 0,
        surge_bonus: parseFloat(summary.total_surge_bonus) || 0,
        tips: parseFloat(summary.total_tips) || 0,
        adjustments: parseFloat(summary.total_adjustments) || 0,
        final_earnings: parseFloat(summary.total_final_earnings) || 0
      },
      daily_breakdown: daily_breakdown.map(day => ({
        date: day.date,
        rides: parseInt(day.rides),
        earnings: parseFloat(day.earnings)
      })),
      payout_status: 'pending', // TODO: Check actual payout status
      next_payout_date: null // TODO: Calculate next payout date
    };
  }

  // Refunds
  async processRefund(data: {
    transaction_id: string;
    amount?: number;
    reason: string;
    requested_by: string;
    metadata?: Record<string, any>;
  }): Promise<PaymentRefund> {
    // Get original transaction
    const transaction = await this.getTransactionById(data.transaction_id);
    if (!transaction) {
      throw new Error('Original transaction not found');
    }

    if (transaction.status !== 'completed') {
      throw new Error('Cannot refund transaction that is not completed');
    }

    const refund_amount = data.amount || transaction.amount;
    if (refund_amount > transaction.amount) {
      throw new Error('Refund amount cannot exceed original transaction amount');
    }

    const refund_id = `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const query = `
      INSERT INTO payment_refunds (
        refund_id, original_transaction_id, amount, currency, reason,
        status, requested_by, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      refund_id,
      data.transaction_id,
      refund_amount,
      transaction.currency,
      data.reason,
      'pending',
      data.requested_by,
      JSON.stringify(data.metadata || {})
    ];

    const result = await this.db.query(query, values);
    const refund = result.rows[0];

    // Process refund with provider (mock)
    try {
      const provider_result = await this.processRefundWithProvider(transaction, refund);
      
      await this.updateRefundStatus(
        refund.id,
        provider_result.status,
        provider_result.provider_refund_id,
        provider_result.provider_response
      );

      return { ...refund, ...provider_result };
    } catch (error) {
      await this.updateRefundStatus(
        refund.id,
        'failed',
        null,
        null,
        (error as Error).message
      );
      throw error;
    }
  }

  private async processRefundWithProvider(transaction: any, refund: any) {
    // Mock refund processing
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const success_rate = 0.98; // 98% success rate for refunds
    const is_successful = Math.random() < success_rate;

    if (is_successful) {
      return {
        status: 'completed',
        provider_refund_id: `ref_${Date.now()}`,
        provider_response: {
          refund_id: `ref_${Math.random().toString(36).substr(2, 10)}`,
          status: 'succeeded'
        }
      };
    } else {
      throw new Error('Refund processing failed');
    }
  }

  private async updateRefundStatus(
    refund_id: string,
    status: string,
    provider_refund_id?: string | null,
    provider_response?: Record<string, any> | null,
    failure_reason?: string
  ): Promise<void> {
    const query = `
      UPDATE payment_refunds 
      SET status = $2, provider_refund_id = $3, provider_response = $4,
          processed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;

    await this.db.query(query, [
      refund_id,
      status,
      provider_refund_id,
      provider_response ? JSON.stringify(provider_response) : null
    ]);
  }

  // Utility Methods
  async getTransactionById(id: string): Promise<PaymentTransaction | null> {
    const query = 'SELECT * FROM payment_transactions WHERE id = $1 OR transaction_id = $1';
    const result = await this.db.query(query, [id]);
    return result.rows[0] || null;
  }

  async getTransactions(filters: {
    customer_id?: string;
    driver_id?: string;
    status?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ transactions: PaymentTransaction[]; total: number }> {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramCount = 0;

    if (filters.customer_id) {
      conditions.push(`customer_id = $${++paramCount}`);
      values.push(filters.customer_id);
    }

    if (filters.driver_id) {
      conditions.push(`driver_id = $${++paramCount}`);
      values.push(filters.driver_id);
    }

    if (filters.status) {
      conditions.push(`status = $${++paramCount}`);
      values.push(filters.status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // Get total count
    const countQuery = `SELECT COUNT(*) FROM payment_transactions ${whereClause}`;
    const countResult = await this.db.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    const dataQuery = `
      SELECT * FROM payment_transactions 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${++paramCount} OFFSET $${++paramCount}
    `;
    values.push(limit, offset);

    const dataResult = await this.db.query(dataQuery, values);

    return {
      transactions: dataResult.rows,
      total
    };
  }
}