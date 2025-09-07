// Payment system types
export interface PaymentMethod {
  id: string;
  name: string;
  type: 'gcash' | 'maya' | 'card' | 'cash' | 'bank_transfer';
  provider: string;
  provider_config: Record<string, any>;
  is_active: boolean;
  supported_currencies: string[];
  processing_fee_percentage: number;
  processing_fee_fixed: number;
  created_at: string;
  updated_at: string;
}

export interface CustomerPaymentMethod {
  id: string;
  customer_id: string;
  payment_method_id: string;
  provider_payment_method_id?: string;
  display_name?: string;
  is_default: boolean;
  metadata: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaymentTransaction {
  id: string;
  transaction_id: string;
  ride_id?: string;
  customer_id: string;
  driver_id?: string;
  payment_method_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  payment_intent_id?: string;
  provider_transaction_id?: string;
  provider_response?: Record<string, any>;
  failure_reason?: string;
  processing_fee: number;
  net_amount: number;
  metadata: Record<string, any>;
  processed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface DriverEarnings {
  id: string;
  driver_id: string;
  transaction_id: string;
  ride_id?: string;
  gross_amount: number;
  platform_commission_rate: number;
  platform_commission: number;
  operator_commission_rate: number;
  operator_commission: number;
  net_earnings: number;
  incentives: number;
  surge_bonus: number;
  tips: number;
  adjustments: number;
  final_earnings: number;
  earnings_date: string;
  status: 'pending' | 'confirmed' | 'paid';
  created_at: string;
  updated_at: string;
}

export interface DriverPayout {
  id: string;
  payout_id: string;
  driver_id: string;
  amount: number;
  currency: string;
  payout_method: 'bank_transfer' | 'gcash' | 'maya' | 'cash';
  bank_account_details?: Record<string, any>;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  provider_payout_id?: string;
  provider_response?: Record<string, any>;
  failure_reason?: string;
  scheduled_date?: string;
  processed_at?: string;
  earnings_period_start: string;
  earnings_period_end: string;
  total_rides: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface PaymentRefund {
  id: string;
  refund_id: string;
  original_transaction_id: string;
  amount: number;
  currency: string;
  reason: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  provider_refund_id?: string;
  provider_response?: Record<string, any>;
  requested_by: string;
  approved_by?: string;
  processed_at?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Request/Response types
export interface ProcessPaymentRequest {
  ride_id?: string;
  customer_id: string;
  driver_id?: string;
  payment_method_id: string;
  amount: number;
  currency?: string;
  metadata?: Record<string, any>;
}

export interface ProcessPaymentResponse {
  transaction_id: string;
  status: string;
  amount: number;
  currency: string;
  payment_intent_id?: string;
  provider_response?: Record<string, any>;
  processing_fee: number;
  net_amount: number;
  estimated_completion?: string;
}

export interface RefundRequest {
  transaction_id: string;
  amount?: number; // If not provided, full refund
  reason: string;
  metadata?: Record<string, any>;
}

export interface RefundResponse {
  refund_id: string;
  status: string;
  amount: number;
  currency: string;
  estimated_completion?: string;
  provider_refund_id?: string;
}

export interface PayoutRequest {
  driver_id: string;
  amount: number;
  payout_method: 'bank_transfer' | 'gcash' | 'maya' | 'cash';
  bank_account_details?: Record<string, any>;
  earnings_period_start: string;
  earnings_period_end: string;
  metadata?: Record<string, any>;
}

export interface PayoutResponse {
  payout_id: string;
  status: string;
  amount: number;
  currency: string;
  estimated_completion?: string;
  provider_payout_id?: string;
}

export interface DriverEarningsResponse {
  driver_id: string;
  period_start: string;
  period_end: string;
  total_earnings: number;
  total_rides: number;
  average_earnings_per_ride: number;
  earnings_breakdown: {
    gross_amount: number;
    platform_commission: number;
    operator_commission: number;
    net_earnings: number;
    incentives: number;
    surge_bonus: number;
    tips: number;
    adjustments: number;
    final_earnings: number;
  };
  daily_breakdown: Array<{
    date: string;
    rides: number;
    earnings: number;
  }>;
  payout_status: 'pending' | 'scheduled' | 'completed';
  next_payout_date?: string;
}

export interface PaymentWebhookPayload {
  event_type: string;
  provider: string;
  transaction_id?: string;
  payout_id?: string;
  refund_id?: string;
  status: string;
  amount?: number;
  currency?: string;
  timestamp: string;
  signature: string;
  data: Record<string, any>;
}