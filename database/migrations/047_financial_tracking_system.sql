-- =====================================================
-- FINANCIAL TRACKING SYSTEM FOR OPERATORS MANAGEMENT  
-- Migration 047: Financial tracking, commissions, and boundary fees
-- Implements comprehensive financial management and commission calculation
-- =====================================================

-- =====================================================
-- ENUMS AND TYPES
-- =====================================================

-- Transaction types for financial tracking
CREATE TYPE financial_transaction_type AS ENUM (
    'commission_earned',     -- Commission from completed trips
    'boundary_fee',         -- Daily boundary fee from drivers  
    'incentive_bonus',      -- Performance-based bonuses
    'penalty_deduction',    -- Penalties for violations
    'fuel_subsidy',        -- Fuel assistance payments
    'maintenance_subsidy',  -- Vehicle maintenance assistance
    'insurance_payment',    -- Insurance premiums
    'registration_fee',     -- Vehicle registration fees
    'adjustment',          -- Manual adjustments
    'refund',             -- Refunds and chargebacks
    'withdrawal',         -- Operator withdrawals
    'deposit'             -- Cash deposits/top-ups
);

-- Payment status types
CREATE TYPE payment_status AS ENUM (
    'pending',             -- Payment pending
    'processing',          -- Being processed
    'completed',           -- Successfully completed
    'failed',             -- Payment failed
    'cancelled',          -- Cancelled before processing
    'disputed',           -- Under dispute
    'refunded'            -- Refunded
);

-- Financial period types
CREATE TYPE financial_period_type AS ENUM (
    'daily',
    'weekly', 
    'monthly',
    'quarterly',
    'annual'
);

-- Commission calculation methods
CREATE TYPE commission_calculation_method AS ENUM (
    'percentage',          -- Percentage of trip fare
    'fixed_rate',         -- Fixed amount per trip
    'tiered',            -- Tiered based on volume
    'performance_based'   -- Based on performance score
);

-- =====================================================
-- FINANCIAL TRACKING TABLES
-- =====================================================

-- Operator financial transactions
CREATE TABLE operator_financial_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
    
    -- Transaction details
    transaction_type financial_transaction_type NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency CHAR(3) DEFAULT 'PHP',
    
    -- Transaction context
    reference_number VARCHAR(50) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    external_reference VARCHAR(100), -- External system reference
    
    -- Related entities
    booking_id UUID REFERENCES bookings(id), -- For trip-related transactions
    driver_id UUID REFERENCES drivers(id), -- For boundary fees
    region_id UUID REFERENCES regions(id),
    
    -- Commission calculation details (for commission transactions)
    base_fare DECIMAL(10,2),
    commission_rate DECIMAL(5,2), -- Percentage rate applied
    commission_tier commission_tier, -- Tier when commission was calculated
    calculation_method commission_calculation_method,
    calculation_details JSONB DEFAULT '{}',
    
    -- Payment information
    payment_status payment_status DEFAULT 'pending',
    payment_method VARCHAR(50),
    payment_processor VARCHAR(50),
    payment_reference VARCHAR(100),
    
    -- Financial metadata
    transaction_date DATE NOT NULL,
    due_date DATE,
    processed_at TIMESTAMP WITH TIME ZONE,
    settlement_date DATE,
    
    -- Reconciliation
    reconciled BOOLEAN DEFAULT FALSE,
    reconciled_at TIMESTAMP WITH TIME ZONE,
    reconciled_by UUID REFERENCES users(id),
    batch_id UUID, -- For batch processing
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(50) DEFAULT 'system',
    notes TEXT,
    
    -- Constraints
    CONSTRAINT fin_trans_amount_check CHECK (amount != 0),
    CONSTRAINT fin_trans_rate_check CHECK (commission_rate IS NULL OR (commission_rate >= 0 AND commission_rate <= 100))
);

-- Daily boundary fees from drivers to operators
CREATE TABLE operator_boundary_fees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    
    -- Fee details
    fee_date DATE NOT NULL,
    base_boundary_fee DECIMAL(8,2) NOT NULL,
    fuel_subsidy DECIMAL(8,2) DEFAULT 0.00,
    maintenance_allowance DECIMAL(8,2) DEFAULT 0.00,
    other_adjustments DECIMAL(8,2) DEFAULT 0.00,
    total_amount DECIMAL(8,2) NOT NULL,
    
    -- Vehicle information
    vehicle_plate_number VARCHAR(20) NOT NULL,
    service_type service_type NOT NULL,
    
    -- Performance-based adjustments
    driver_performance_score DECIMAL(5,2),
    performance_adjustment DECIMAL(8,2) DEFAULT 0.00,
    bonus_earned DECIMAL(8,2) DEFAULT 0.00,
    
    -- Payment tracking
    payment_status payment_status DEFAULT 'pending',
    payment_method VARCHAR(50),
    paid_at TIMESTAMP WITH TIME ZONE,
    
    -- Operational metrics
    trips_completed INTEGER DEFAULT 0,
    hours_worked DECIMAL(6,2) DEFAULT 0.00,
    distance_covered_km DECIMAL(10,2) DEFAULT 0.00,
    
    -- Revenue sharing (if applicable)
    driver_gross_earnings DECIMAL(10,2) DEFAULT 0.00,
    revenue_share_percentage DECIMAL(5,2),
    revenue_share_amount DECIMAL(8,2) DEFAULT 0.00,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(operator_id, driver_id, fee_date, vehicle_plate_number),
    
    -- Constraints
    CONSTRAINT boundary_fee_total_check CHECK (
        total_amount = base_boundary_fee + fuel_subsidy + maintenance_allowance + other_adjustments + performance_adjustment
    ),
    CONSTRAINT boundary_fee_score_check CHECK (
        driver_performance_score IS NULL OR (driver_performance_score >= 0 AND driver_performance_score <= 100)
    )
);

-- Commission rate configurations and history
CREATE TABLE commission_rate_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Commission tier configuration
    commission_tier commission_tier NOT NULL,
    rate_percentage DECIMAL(5,2) NOT NULL,
    
    -- Qualification requirements
    min_performance_score DECIMAL(5,2) NOT NULL,
    min_tenure_months INTEGER NOT NULL,
    min_payment_consistency DECIMAL(5,2) NOT NULL,
    min_utilization_percentile DECIMAL(5,2),
    
    -- Additional requirements
    additional_requirements JSONB DEFAULT '{}',
    
    -- Rate validity
    effective_from DATE NOT NULL,
    effective_until DATE,
    
    -- Regional variations (if any)
    region_id UUID REFERENCES regions(id), -- NULL for global rates
    operator_type_override operator_type, -- NULL for all types
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Constraints
    CONSTRAINT commission_rate_check CHECK (rate_percentage > 0 AND rate_percentage <= 100),
    CONSTRAINT commission_score_check CHECK (min_performance_score >= 0 AND min_performance_score <= 100),
    CONSTRAINT commission_consistency_check CHECK (min_payment_consistency >= 0 AND min_payment_consistency <= 100)
);

-- Financial summaries and analytics by period
CREATE TABLE operator_financial_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
    
    -- Period information
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    period_type financial_period_type NOT NULL,
    
    -- Revenue streams
    total_commissions_earned DECIMAL(15,2) DEFAULT 0.00,
    total_boundary_fees_collected DECIMAL(15,2) DEFAULT 0.00,
    total_incentive_bonuses DECIMAL(15,2) DEFAULT 0.00,
    total_subsidies_provided DECIMAL(15,2) DEFAULT 0.00,
    
    -- Deductions and costs
    total_penalties_deducted DECIMAL(15,2) DEFAULT 0.00,
    total_refunds_processed DECIMAL(15,2) DEFAULT 0.00,
    total_operational_costs DECIMAL(15,2) DEFAULT 0.00,
    
    -- Net calculations
    gross_revenue DECIMAL(15,2) DEFAULT 0.00,
    net_revenue DECIMAL(15,2) DEFAULT 0.00,
    profit_margin DECIMAL(5,2) DEFAULT 0.00,
    
    -- Volume metrics
    total_trips INTEGER DEFAULT 0,
    total_active_days INTEGER DEFAULT 0,
    average_daily_revenue DECIMAL(10,2) DEFAULT 0.00,
    
    -- Performance metrics
    average_commission_rate DECIMAL(5,2) DEFAULT 0.00,
    commission_tier_during_period commission_tier,
    performance_score_avg DECIMAL(5,2) DEFAULT 0.00,
    
    -- Payment metrics
    payments_on_time INTEGER DEFAULT 0,
    payments_late INTEGER DEFAULT 0,
    payment_consistency_rate DECIMAL(5,2) DEFAULT 0.00,
    
    -- Growth metrics
    revenue_growth_rate DECIMAL(5,2), -- Compared to previous period
    trip_volume_growth_rate DECIMAL(5,2),
    
    -- Metadata
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    recalculated_at TIMESTAMP WITH TIME ZONE,
    is_final BOOLEAN DEFAULT FALSE,
    
    UNIQUE(operator_id, period_start, period_type),
    
    -- Constraints
    CONSTRAINT fin_summary_period_check CHECK (period_end >= period_start),
    CONSTRAINT fin_summary_margin_check CHECK (profit_margin >= -100 AND profit_margin <= 100)
);

-- Payout and settlement tracking
CREATE TABLE operator_payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
    
    -- Payout details
    payout_reference VARCHAR(50) NOT NULL UNIQUE,
    payout_amount DECIMAL(15,2) NOT NULL,
    currency CHAR(3) DEFAULT 'PHP',
    
    -- Payout period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Breakdown of payout components
    commissions_amount DECIMAL(15,2) DEFAULT 0.00,
    bonuses_amount DECIMAL(15,2) DEFAULT 0.00,
    adjustments_amount DECIMAL(15,2) DEFAULT 0.00,
    
    -- Deductions
    penalties_deducted DECIMAL(15,2) DEFAULT 0.00,
    tax_withheld DECIMAL(15,2) DEFAULT 0.00,
    other_deductions DECIMAL(15,2) DEFAULT 0.00,
    
    -- Payment details
    payment_method VARCHAR(50) NOT NULL,
    bank_account_details JSONB,
    payment_processor VARCHAR(50),
    
    -- Status tracking
    status payment_status DEFAULT 'pending',
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    processed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    
    -- Approval workflow
    requested_by UUID REFERENCES users(id), -- Usually the operator
    approved_by UUID REFERENCES users(id), -- Finance team member
    processed_by UUID REFERENCES users(id), -- System or finance team
    
    -- External references
    bank_transaction_id VARCHAR(100),
    processor_transaction_id VARCHAR(100),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    
    -- Constraints
    CONSTRAINT payout_amount_positive CHECK (payout_amount > 0),
    CONSTRAINT payout_components_check CHECK (
        payout_amount = commissions_amount + bonuses_amount + adjustments_amount - penalties_deducted - tax_withheld - other_deductions
    )
);

-- Financial audit trail for operators
CREATE TABLE operator_financial_audit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
    
    -- Event details
    event_type VARCHAR(50) NOT NULL, -- commission_calculated, payment_processed, tier_changed, etc.
    event_category VARCHAR(50) NOT NULL, -- transaction, commission, payout, adjustment
    
    -- Financial context
    transaction_id UUID REFERENCES operator_financial_transactions(id),
    amount_before DECIMAL(15,2),
    amount_after DECIMAL(15,2),
    amount_changed DECIMAL(15,2),
    
    -- Performance context (for tier changes)
    score_before DECIMAL(5,2),
    score_after DECIMAL(5,2),
    tier_before commission_tier,
    tier_after commission_tier,
    
    -- User context
    user_id UUID REFERENCES users(id),
    session_id UUID,
    
    -- Change details
    old_values JSONB,
    new_values JSONB,
    change_reason TEXT,
    
    -- Request context
    ip_address INET,
    user_agent TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    region_id UUID REFERENCES regions(id)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Financial transactions
CREATE INDEX CONCURRENTLY idx_fin_trans_operator_date ON operator_financial_transactions(operator_id, transaction_date DESC);
CREATE INDEX CONCURRENTLY idx_fin_trans_type_status ON operator_financial_transactions(transaction_type, payment_status, transaction_date DESC);
CREATE INDEX CONCURRENTLY idx_fin_trans_booking ON operator_financial_transactions(booking_id) WHERE booking_id IS NOT NULL;
CREATE INDEX CONCURRENTLY idx_fin_trans_reference ON operator_financial_transactions(reference_number);
CREATE INDEX CONCURRENTLY idx_fin_trans_settlement ON operator_financial_transactions(settlement_date, reconciled) WHERE settlement_date IS NOT NULL;
CREATE INDEX CONCURRENTLY idx_fin_trans_batch ON operator_financial_transactions(batch_id) WHERE batch_id IS NOT NULL;

-- Boundary fees
CREATE INDEX CONCURRENTLY idx_boundary_fees_operator_date ON operator_boundary_fees(operator_id, fee_date DESC);
CREATE INDEX CONCURRENTLY idx_boundary_fees_driver_date ON operator_boundary_fees(driver_id, fee_date DESC);
CREATE INDEX CONCURRENTLY idx_boundary_fees_status ON operator_boundary_fees(payment_status, fee_date DESC);
CREATE INDEX CONCURRENTLY idx_boundary_fees_vehicle ON operator_boundary_fees(vehicle_plate_number, fee_date DESC);
CREATE INDEX CONCURRENTLY idx_boundary_fees_performance ON operator_boundary_fees(driver_performance_score DESC, fee_date DESC) WHERE driver_performance_score IS NOT NULL;

-- Commission configurations
CREATE INDEX CONCURRENTLY idx_commission_config_tier ON commission_rate_configs(commission_tier, effective_from DESC);
CREATE INDEX CONCURRENTLY idx_commission_config_dates ON commission_rate_configs(effective_from, effective_until) WHERE is_active = TRUE;
CREATE INDEX CONCURRENTLY idx_commission_config_region ON commission_rate_configs(region_id, effective_from DESC) WHERE region_id IS NOT NULL;

-- Financial summaries
CREATE INDEX CONCURRENTLY idx_fin_summary_operator_period ON operator_financial_summaries(operator_id, period_start DESC, period_type);
CREATE INDEX CONCURRENTLY idx_fin_summary_period_type ON operator_financial_summaries(period_type, period_start DESC);
CREATE INDEX CONCURRENTLY idx_fin_summary_revenue ON operator_financial_summaries(net_revenue DESC, period_start DESC);
CREATE INDEX CONCURRENTLY idx_fin_summary_growth ON operator_financial_summaries(revenue_growth_rate DESC, period_start DESC) WHERE revenue_growth_rate IS NOT NULL;

-- Payouts
CREATE INDEX CONCURRENTLY idx_payouts_operator ON operator_payouts(operator_id, requested_at DESC);
CREATE INDEX CONCURRENTLY idx_payouts_status ON operator_payouts(status, requested_at DESC);
CREATE INDEX CONCURRENTLY idx_payouts_period ON operator_payouts(period_start, period_end, operator_id);
CREATE INDEX CONCURRENTLY idx_payouts_reference ON operator_payouts(payout_reference);
CREATE INDEX CONCURRENTLY idx_payouts_approval ON operator_payouts(approved_by, approved_at DESC) WHERE approved_by IS NOT NULL;

-- Financial audit
CREATE INDEX CONCURRENTLY idx_fin_audit_operator ON operator_financial_audit(operator_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_fin_audit_event ON operator_financial_audit(event_type, event_category, created_at DESC);
CREATE INDEX CONCURRENTLY idx_fin_audit_transaction ON operator_financial_audit(transaction_id) WHERE transaction_id IS NOT NULL;
CREATE INDEX CONCURRENTLY idx_fin_audit_user ON operator_financial_audit(user_id, created_at DESC) WHERE user_id IS NOT NULL;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Apply updated_at triggers
CREATE TRIGGER tr_boundary_fees_updated_at BEFORE UPDATE ON operator_boundary_fees FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- INITIAL COMMISSION CONFIGURATION
-- =====================================================

-- Insert standard commission tier configurations
INSERT INTO commission_rate_configs (commission_tier, rate_percentage, min_performance_score, min_tenure_months, min_payment_consistency, min_utilization_percentile, effective_from, notes) VALUES

-- Tier 1: 1% commission (Entry level)
('tier_1', 1.00, 70.00, 6, 90.00, NULL, CURRENT_DATE, 
 'Entry tier: 70-79 performance score, 6+ months tenure, 90%+ payment consistency'),

-- Tier 2: 2% commission (Intermediate level)  
('tier_2', 2.00, 80.00, 12, 90.00, 50.00, CURRENT_DATE,
 'Intermediate tier: 80-89 performance score, 12+ months tenure, top 50% utilization'),

-- Tier 3: 3% commission (Premium level)
('tier_3', 3.00, 90.00, 18, 95.00, 25.00, CURRENT_DATE,
 'Premium tier: 90+ performance score, 18+ months tenure, top 25% metrics');

-- =====================================================
-- COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON TABLE operator_financial_transactions IS 'Complete financial transaction history for operators including commissions, fees, and adjustments';
COMMENT ON TABLE operator_boundary_fees IS 'Daily boundary fee collection from drivers to operators with performance adjustments';
COMMENT ON TABLE commission_rate_configs IS 'Commission tier rate configuration with qualification requirements';
COMMENT ON TABLE operator_financial_summaries IS 'Period-based financial summaries and performance analytics for operators';
COMMENT ON TABLE operator_payouts IS 'Payout processing and settlement tracking for operator earnings';
COMMENT ON TABLE operator_financial_audit IS 'Complete audit trail for all financial operations and changes';

COMMENT ON COLUMN operator_financial_transactions.commission_rate IS 'Commission percentage applied (1%, 2%, or 3% based on tier)';
COMMENT ON COLUMN operator_boundary_fees.total_amount IS 'Total boundary fee = base + fuel + maintenance + adjustments + performance bonus';
COMMENT ON COLUMN commission_rate_configs.min_utilization_percentile IS 'Required utilization percentile ranking (NULL for Tier 1)';
COMMENT ON COLUMN operator_financial_summaries.payment_consistency_rate IS 'Percentage of on-time payments for tier qualification';