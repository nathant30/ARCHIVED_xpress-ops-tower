-- Migration: 052_payment_system_schema.sql
-- Description: Create payment processing system tables
-- Created: 2025-09-05

-- Payment Methods
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('gcash', 'maya', 'card', 'cash', 'bank_transfer')),
  provider VARCHAR(100) NOT NULL,
  provider_config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  supported_currencies TEXT[] NOT NULL DEFAULT ARRAY['PHP'],
  processing_fee_percentage DECIMAL(5,4) DEFAULT 0,
  processing_fee_fixed DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Customer Payment Methods
CREATE TABLE customer_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  payment_method_id UUID NOT NULL REFERENCES payment_methods(id),
  provider_payment_method_id VARCHAR(255),
  display_name VARCHAR(100),
  is_default BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payment Transactions
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id VARCHAR(100) UNIQUE NOT NULL,
  ride_id UUID REFERENCES rides(id),
  customer_id UUID NOT NULL,
  driver_id UUID,
  payment_method_id UUID NOT NULL REFERENCES payment_methods(id),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'PHP',
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded')),
  payment_intent_id VARCHAR(255),
  provider_transaction_id VARCHAR(255),
  provider_response JSONB,
  failure_reason TEXT,
  processing_fee DECIMAL(10,2) DEFAULT 0,
  net_amount DECIMAL(10,2) NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Driver Earnings
CREATE TABLE driver_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL,
  transaction_id UUID NOT NULL REFERENCES payment_transactions(id),
  ride_id UUID REFERENCES rides(id),
  gross_amount DECIMAL(10,2) NOT NULL,
  platform_commission_rate DECIMAL(5,4) NOT NULL,
  platform_commission DECIMAL(10,2) NOT NULL,
  operator_commission_rate DECIMAL(5,4) DEFAULT 0,
  operator_commission DECIMAL(10,2) DEFAULT 0,
  net_earnings DECIMAL(10,2) NOT NULL,
  incentives DECIMAL(10,2) DEFAULT 0,
  surge_bonus DECIMAL(10,2) DEFAULT 0,
  tips DECIMAL(10,2) DEFAULT 0,
  adjustments DECIMAL(10,2) DEFAULT 0,
  final_earnings DECIMAL(10,2) NOT NULL,
  earnings_date DATE NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'confirmed', 'paid')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Driver Payouts
CREATE TABLE driver_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_id VARCHAR(100) UNIQUE NOT NULL,
  driver_id UUID NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'PHP',
  payout_method VARCHAR(50) NOT NULL CHECK (payout_method IN ('bank_transfer', 'gcash', 'maya', 'cash')),
  bank_account_details JSONB,
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  provider_payout_id VARCHAR(255),
  provider_response JSONB,
  failure_reason TEXT,
  scheduled_date DATE,
  processed_at TIMESTAMP WITH TIME ZONE,
  earnings_period_start DATE NOT NULL,
  earnings_period_end DATE NOT NULL,
  total_rides INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payment Refunds
CREATE TABLE payment_refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  refund_id VARCHAR(100) UNIQUE NOT NULL,
  original_transaction_id UUID NOT NULL REFERENCES payment_transactions(id),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'PHP',
  reason VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  provider_refund_id VARCHAR(255),
  provider_response JSONB,
  requested_by UUID NOT NULL,
  approved_by UUID,
  processed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payment Webhooks
CREATE TABLE payment_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id VARCHAR(100) UNIQUE NOT NULL,
  provider VARCHAR(100) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  signature VARCHAR(500),
  processed BOOLEAN NOT NULL DEFAULT false,
  processing_attempts INTEGER NOT NULL DEFAULT 0,
  last_processing_attempt TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  related_transaction_id UUID REFERENCES payment_transactions(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_payment_transactions_customer_id ON payment_transactions(customer_id);
CREATE INDEX idx_payment_transactions_driver_id ON payment_transactions(driver_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_payment_transactions_created_at ON payment_transactions(created_at DESC);
CREATE INDEX idx_payment_transactions_ride_id ON payment_transactions(ride_id);

CREATE INDEX idx_driver_earnings_driver_id ON driver_earnings(driver_id);
CREATE INDEX idx_driver_earnings_earnings_date ON driver_earnings(earnings_date DESC);
CREATE INDEX idx_driver_earnings_status ON driver_earnings(status);

CREATE INDEX idx_driver_payouts_driver_id ON driver_payouts(driver_id);
CREATE INDEX idx_driver_payouts_status ON driver_payouts(status);
CREATE INDEX idx_driver_payouts_scheduled_date ON driver_payouts(scheduled_date);

CREATE INDEX idx_payment_refunds_original_transaction ON payment_refunds(original_transaction_id);
CREATE INDEX idx_payment_refunds_status ON payment_refunds(status);

CREATE INDEX idx_payment_webhooks_provider ON payment_webhooks(provider);
CREATE INDEX idx_payment_webhooks_processed ON payment_webhooks(processed);
CREATE INDEX idx_payment_webhooks_created_at ON payment_webhooks(created_at DESC);

CREATE INDEX idx_customer_payment_methods_customer ON customer_payment_methods(customer_id);
CREATE INDEX idx_customer_payment_methods_active ON customer_payment_methods(is_active);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON payment_methods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_payment_methods_updated_at BEFORE UPDATE ON customer_payment_methods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_transactions_updated_at BEFORE UPDATE ON payment_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_driver_earnings_updated_at BEFORE UPDATE ON driver_earnings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_driver_payouts_updated_at BEFORE UPDATE ON driver_payouts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_refunds_updated_at BEFORE UPDATE ON payment_refunds FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default payment methods
INSERT INTO payment_methods (name, type, provider, provider_config, processing_fee_percentage, processing_fee_fixed) VALUES
('GCash', 'gcash', 'gcash', '{"api_version": "v1", "sandbox": true}', 0.025, 0.00),
('Maya', 'maya', 'maya', '{"api_version": "v1", "sandbox": true}', 0.035, 0.00),
('Credit Card', 'card', 'stripe', '{"api_version": "2023-10-16", "sandbox": true}', 0.034, 15.00),
('Cash', 'cash', 'manual', '{}', 0.000, 0.00),
('Bank Transfer', 'bank_transfer', 'instapay', '{"api_version": "v1", "sandbox": true}', 0.015, 10.00);

-- Comments
COMMENT ON TABLE payment_methods IS 'Available payment methods and their configuration';
COMMENT ON TABLE customer_payment_methods IS 'Customer saved payment methods';
COMMENT ON TABLE payment_transactions IS 'All payment transactions for rides';
COMMENT ON TABLE driver_earnings IS 'Driver earnings breakdown per transaction';
COMMENT ON TABLE driver_payouts IS 'Driver payout batches and their status';
COMMENT ON TABLE payment_refunds IS 'Payment refunds and their processing status';
COMMENT ON TABLE payment_webhooks IS 'Incoming payment provider webhooks';