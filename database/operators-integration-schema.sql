-- =====================================================
-- OPERATORS INTEGRATION DATABASE SCHEMA
-- Comprehensive integration tables connecting operators system with existing components
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- OPERATORS CORE TABLES (Enhanced from existing)
-- =====================================================

-- Main operators table with enhanced integration fields
CREATE TABLE IF NOT EXISTS operators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic Information
    operator_code VARCHAR(50) UNIQUE NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255) NOT NULL,
    trade_name VARCHAR(255),
    
    -- Classification
    operator_type VARCHAR(20) NOT NULL CHECK (operator_type IN ('tnvs', 'general', 'fleet')),
    status VARCHAR(30) NOT NULL DEFAULT 'pending_approval' 
        CHECK (status IN ('active', 'inactive', 'suspended', 'pending_approval', 'under_review', 'decommissioned')),
    
    -- Contact Information
    primary_contact JSONB NOT NULL,
    business_address JSONB NOT NULL,
    mailing_address JSONB,
    
    -- Regulatory Information
    business_registration_number VARCHAR(100) NOT NULL,
    tin VARCHAR(50),
    sec_registration VARCHAR(100),
    ltfrb_authority_number VARCHAR(100),
    lto_accreditation VARCHAR(100),
    
    -- Regional Operations
    primary_region_id UUID NOT NULL REFERENCES regions(id),
    allowed_regions UUID[] NOT NULL DEFAULT '{}',
    
    -- Vehicle Limits
    max_vehicles INTEGER NOT NULL DEFAULT 0,
    current_vehicle_count INTEGER NOT NULL DEFAULT 0,
    
    -- Performance Metrics
    performance_score NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    commission_tier VARCHAR(20) NOT NULL DEFAULT 'tier_3'
        CHECK (commission_tier IN ('tier_1', 'tier_2', 'tier_3')),
    tier_qualification_date TIMESTAMP WITH TIME ZONE,
    
    -- Financial Information
    wallet_balance NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    earnings_today NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    earnings_week NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    earnings_month NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    total_commissions_earned NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    
    -- Insurance and Compliance
    insurance_details JSONB,
    certifications JSONB DEFAULT '[]'::jsonb,
    compliance_documents JSONB DEFAULT '{}'::jsonb,
    regulatory_status JSONB DEFAULT '{}'::jsonb,
    regulatory_last_updated TIMESTAMP WITH TIME ZONE,
    
    -- Operational Settings
    operational_hours JSONB DEFAULT '{"start": "06:00", "end": "22:00"}'::jsonb,
    service_areas JSONB DEFAULT '[]'::jsonb,
    special_permissions JSONB DEFAULT '{}'::jsonb,
    
    -- User Integration (Foreign Key to existing users table)
    user_id UUID REFERENCES users(id),
    assigned_account_manager UUID REFERENCES users(id),
    partnership_start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    partnership_end_date DATE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Indexes
    INDEX idx_operators_status (status),
    INDEX idx_operators_region (primary_region_id),
    INDEX idx_operators_tier (commission_tier),
    INDEX idx_operators_user (user_id),
    INDEX idx_operators_performance (performance_score),
    INDEX idx_operators_business_reg (business_registration_number)
);

-- Operator locations (branches, garages, terminals)
CREATE TABLE IF NOT EXISTS operator_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
    
    -- Location Details
    location_type VARCHAR(20) NOT NULL CHECK (location_type IN ('headquarters', 'branch', 'garage', 'terminal')),
    name VARCHAR(255) NOT NULL,
    address JSONB NOT NULL,
    contact_info JSONB,
    
    -- Geospatial Data
    location POINT NOT NULL,
    coverage_area POLYGON, -- Service area boundary
    
    -- Operational Information
    operating_hours JSONB DEFAULT '{"start": "06:00", "end": "22:00"}'::jsonb,
    capacity_vehicles INTEGER DEFAULT 0,
    current_vehicles INTEGER DEFAULT 0,
    
    -- Regional Compliance
    region_id UUID NOT NULL REFERENCES regions(id),
    local_permits JSONB DEFAULT '{}'::jsonb,
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    activated_at TIMESTAMP WITH TIME ZONE,
    deactivated_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_operator_locations_operator (operator_id),
    INDEX idx_operator_locations_region (region_id),
    INDEX idx_operator_locations_type (location_type),
    INDEX idx_operator_locations_point (location)
);

-- =====================================================
-- VEHICLE INTEGRATION
-- =====================================================

-- Extend existing vehicles table with operator integration
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS operator_id UUID REFERENCES operators(id);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS operator_assigned_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS operator_assignment_type VARCHAR(20) DEFAULT 'owned' 
    CHECK (operator_assignment_type IN ('owned', 'leased', 'partnership'));

-- Operator-Vehicle relationship table
CREATE TABLE IF NOT EXISTS operator_vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
    
    -- Vehicle Identification
    vehicle_plate_number VARCHAR(20) NOT NULL,
    vehicle_info JSONB NOT NULL,
    
    -- Vehicle Classification
    service_type VARCHAR(50) NOT NULL,
    vehicle_category VARCHAR(50) NOT NULL,
    seating_capacity INTEGER NOT NULL DEFAULT 4,
    
    -- Registration and Compliance
    or_number VARCHAR(100),
    cr_number VARCHAR(100),
    ltfrb_registration VARCHAR(100),
    insurance_policy JSONB,
    
    -- Vehicle Status and Assignment
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'inactive', 'maintenance', 'suspended')),
    assigned_driver_id UUID REFERENCES drivers(id),
    assigned_location_id UUID REFERENCES operator_locations(id),
    
    -- Maintenance and Inspection
    last_maintenance_date DATE,
    next_maintenance_due DATE,
    last_inspection_date DATE,
    next_inspection_due DATE,
    maintenance_records JSONB DEFAULT '[]'::jsonb,
    
    -- Financial Information
    acquisition_cost NUMERIC(15,2),
    acquisition_date DATE,
    depreciation_rate NUMERIC(5,2),
    current_value NUMERIC(15,2),
    
    -- Metadata
    registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    registered_by UUID REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Constraints
    UNIQUE(operator_id, vehicle_plate_number),
    
    -- Indexes
    INDEX idx_operator_vehicles_operator (operator_id),
    INDEX idx_operator_vehicles_driver (assigned_driver_id),
    INDEX idx_operator_vehicles_plate (vehicle_plate_number),
    INDEX idx_operator_vehicles_status (status)
);

-- =====================================================
-- DRIVER INTEGRATION
-- =====================================================

-- Extend existing drivers table with operator integration
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS operator_id UUID REFERENCES operators(id);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS operator_assigned_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS employment_status VARCHAR(20) DEFAULT 'contractor'
    CHECK (employment_status IN ('employee', 'contractor', 'partner', 'freelance'));

-- Operator-Driver relationship table
CREATE TABLE IF NOT EXISTS operator_drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    
    -- Assignment Details
    assignment_type VARCHAR(20) NOT NULL DEFAULT 'permanent'
        CHECK (assignment_type IN ('permanent', 'temporary', 'pool', 'on_demand')),
    employment_status VARCHAR(20) NOT NULL DEFAULT 'contractor'
        CHECK (employment_status IN ('employee', 'contractor', 'partner', 'freelance')),
    
    -- Contract Information
    contract_start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    contract_end_date DATE,
    contract_details JSONB DEFAULT '{}'::jsonb,
    
    -- Performance Tracking
    driver_performance_score NUMERIC(5,2) DEFAULT 0.00,
    disciplinary_records JSONB DEFAULT '[]'::jsonb,
    incentive_eligibility BOOLEAN DEFAULT true,
    
    -- Location Assignment
    assigned_location_id UUID REFERENCES operator_locations(id),
    home_base_location POINT,
    
    -- Metadata
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    assigned_by UUID REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Constraints
    UNIQUE(operator_id, driver_id),
    
    -- Indexes
    INDEX idx_operator_drivers_operator (operator_id),
    INDEX idx_operator_drivers_driver (driver_id),
    INDEX idx_operator_drivers_location (assigned_location_id),
    INDEX idx_operator_drivers_performance (driver_performance_score)
);

-- =====================================================
-- TRIP INTEGRATION
-- =====================================================

-- Extend existing trips/bookings table with operator integration
ALTER TABLE trips ADD COLUMN IF NOT EXISTS operator_id UUID REFERENCES operators(id);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS operator_commission_rate NUMERIC(5,2);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS operator_commission_amount NUMERIC(10,2);

-- Commission calculations for trips
CREATE TABLE IF NOT EXISTS commission_calculations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID NOT NULL REFERENCES operators(id),
    trip_id UUID NOT NULL REFERENCES trips(id),
    
    -- Calculation Details
    gross_fare NUMERIC(10,2) NOT NULL,
    commission_amount NUMERIC(10,2) NOT NULL,
    commission_rate NUMERIC(5,2) NOT NULL,
    net_to_driver NUMERIC(10,2) NOT NULL,
    
    -- Calculation Context
    commission_tier VARCHAR(20) NOT NULL,
    calculation_method VARCHAR(20) NOT NULL DEFAULT 'percentage',
    calculation_parameters JSONB,
    
    -- Metadata
    calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    calculated_by VARCHAR(50) DEFAULT 'system',
    
    -- Constraints
    UNIQUE(operator_id, trip_id),
    
    -- Indexes
    INDEX idx_commission_calcs_operator (operator_id),
    INDEX idx_commission_calcs_trip (trip_id),
    INDEX idx_commission_calcs_date (calculated_at)
);

-- =====================================================
-- PERFORMANCE SCORING INTEGRATION
-- =====================================================

-- Performance metric configurations
CREATE TABLE IF NOT EXISTS performance_metric_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Metric Identification
    metric_name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Categorization
    metric_type VARCHAR(50) NOT NULL 
        CHECK (metric_type IN ('vehicle_utilization', 'driver_management', 'compliance_safety', 'platform_contribution')),
    category_weight NUMERIC(5,2) NOT NULL,
    max_points INTEGER NOT NULL,
    
    -- Calculation Parameters
    calculation_formula TEXT,
    threshold_values JSONB,
    is_percentage BOOLEAN DEFAULT false,
    
    -- Metadata
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_perf_metrics_type (metric_type),
    INDEX idx_perf_metrics_active (is_active)
);

-- Operator performance scores
CREATE TABLE IF NOT EXISTS operator_performance_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
    
    -- Scoring Period
    scoring_period VARCHAR(20) NOT NULL, -- e.g., "2024-09", "2024-W37"
    scoring_frequency VARCHAR(20) NOT NULL 
        CHECK (scoring_frequency IN ('daily', 'weekly', 'monthly', 'quarterly')),
    
    -- Individual Metric Scores
    vehicle_utilization_score NUMERIC(5,2) DEFAULT 0.00,
    driver_management_score NUMERIC(5,2) DEFAULT 0.00,
    compliance_safety_score NUMERIC(5,2) DEFAULT 0.00,
    platform_contribution_score NUMERIC(5,2) DEFAULT 0.00,
    
    -- Calculated Total Score
    total_score NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    
    -- Commission Tier Determination
    commission_tier VARCHAR(20) NOT NULL DEFAULT 'tier_3',
    tier_qualification_status VARCHAR(20) NOT NULL DEFAULT 'under_review'
        CHECK (tier_qualification_status IN ('qualified', 'under_review', 'disqualified', 'probationary')),
    tier_calculation_notes TEXT,
    
    -- Supporting Metrics
    metrics_data JSONB DEFAULT '{}'::jsonb,
    
    -- Performance Indicators
    improvement_trend NUMERIC(5,2),
    peer_ranking INTEGER,
    peer_percentile NUMERIC(5,2),
    
    -- Metadata
    calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    calculated_by UUID NOT NULL REFERENCES users(id),
    is_final BOOLEAN NOT NULL DEFAULT false,
    
    -- Constraints
    UNIQUE(operator_id, scoring_period, scoring_frequency),
    
    -- Indexes
    INDEX idx_perf_scores_operator (operator_id),
    INDEX idx_perf_scores_period (scoring_period),
    INDEX idx_perf_scores_tier (commission_tier),
    INDEX idx_perf_scores_total (total_score)
);

-- Performance score details
CREATE TABLE IF NOT EXISTS operator_performance_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    performance_score_id UUID NOT NULL REFERENCES operator_performance_scores(id) ON DELETE CASCADE,
    
    -- Metric Identification
    metric_name VARCHAR(100) NOT NULL,
    metric_type VARCHAR(50) NOT NULL,
    
    -- Raw Values and Calculations
    raw_value NUMERIC(15,4),
    normalized_value NUMERIC(15,4),
    weighted_score NUMERIC(5,2) NOT NULL,
    max_possible_score NUMERIC(5,2) NOT NULL,
    
    -- Context and Calculation Details
    calculation_method VARCHAR(100) NOT NULL,
    calculation_parameters JSONB,
    benchmarks JSONB,
    
    -- Performance Bands
    performance_band VARCHAR(20) NOT NULL,
    band_threshold_met BOOLEAN NOT NULL DEFAULT false,
    
    -- Metadata
    calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_perf_details_score (performance_score_id),
    INDEX idx_perf_details_metric (metric_name),
    INDEX idx_perf_details_type (metric_type)
);

-- Commission tier qualifications
CREATE TABLE IF NOT EXISTS commission_tier_qualifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
    
    -- Target Commission Tier
    target_tier VARCHAR(20) NOT NULL 
        CHECK (target_tier IN ('tier_1', 'tier_2', 'tier_3')),
    qualification_status VARCHAR(20) NOT NULL 
        CHECK (qualification_status IN ('qualified', 'under_review', 'disqualified', 'probationary')),
    
    -- Qualification Requirements Tracking
    score_requirement NUMERIC(5,2) NOT NULL,
    current_score NUMERIC(5,2),
    score_qualified BOOLEAN DEFAULT false,
    
    tenure_requirement INTEGER NOT NULL, -- in days
    current_tenure INTEGER,
    tenure_qualified BOOLEAN DEFAULT false,
    
    payment_consistency_requirement NUMERIC(5,2) NOT NULL,
    current_payment_consistency NUMERIC(5,2),
    payment_qualified BOOLEAN DEFAULT false,
    
    utilization_requirement NUMERIC(5,2),
    current_utilization_percentile NUMERIC(5,2),
    utilization_qualified BOOLEAN DEFAULT false,
    
    -- Additional Requirements
    additional_requirements JSONB DEFAULT '{}'::jsonb,
    requirements_status JSONB DEFAULT '{}'::jsonb,
    
    -- Timeline
    evaluation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    qualification_date DATE,
    next_evaluation_date DATE,
    probation_end_date DATE,
    
    -- Notes
    qualification_notes TEXT,
    disqualification_reasons TEXT[],
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(operator_id, target_tier, evaluation_date),
    
    -- Indexes
    INDEX idx_tier_quals_operator (operator_id),
    INDEX idx_tier_quals_tier (target_tier),
    INDEX idx_tier_quals_status (qualification_status),
    INDEX idx_tier_quals_eval_date (evaluation_date)
);

-- =====================================================
-- FINANCIAL INTEGRATION
-- =====================================================

-- Operator financial transactions (enhanced from existing)
CREATE TABLE IF NOT EXISTS operator_financial_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
    
    -- Transaction Details
    transaction_type VARCHAR(50) NOT NULL 
        CHECK (transaction_type IN ('commission_earned', 'boundary_fee', 'incentive_bonus', 'penalty_deduction', 
                                   'fuel_subsidy', 'maintenance_subsidy', 'insurance_payment', 'registration_fee', 
                                   'adjustment', 'refund', 'withdrawal', 'deposit')),
    amount NUMERIC(15,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'PHP',
    
    -- Transaction Context
    reference_number VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    external_reference VARCHAR(100),
    
    -- Related Entities
    booking_id UUID REFERENCES trips(id),
    driver_id UUID REFERENCES drivers(id),
    region_id UUID REFERENCES regions(id),
    
    -- Commission Calculation Details
    base_fare NUMERIC(10,2),
    commission_rate NUMERIC(5,2),
    commission_tier VARCHAR(20),
    calculation_method VARCHAR(20) 
        CHECK (calculation_method IN ('percentage', 'fixed_rate', 'tiered', 'performance_based')),
    calculation_details JSONB,
    
    -- Payment Information
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'disputed', 'refunded')),
    payment_method VARCHAR(50),
    payment_processor VARCHAR(50),
    payment_reference VARCHAR(100),
    
    -- Financial Metadata
    transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    due_date DATE,
    processed_at TIMESTAMP WITH TIME ZONE,
    settlement_date DATE,
    
    -- Reconciliation
    reconciled BOOLEAN NOT NULL DEFAULT false,
    reconciled_at TIMESTAMP WITH TIME ZONE,
    reconciled_by UUID REFERENCES users(id),
    batch_id UUID,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES users(id),
    notes TEXT,
    
    -- Indexes
    INDEX idx_fin_trans_operator (operator_id),
    INDEX idx_fin_trans_type (transaction_type),
    INDEX idx_fin_trans_status (payment_status),
    INDEX idx_fin_trans_date (transaction_date),
    INDEX idx_fin_trans_booking (booking_id),
    INDEX idx_fin_trans_reference (reference_number)
);

-- Operator boundary fees
CREATE TABLE IF NOT EXISTS operator_boundary_fees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES drivers(id),
    
    -- Fee Details
    fee_date DATE NOT NULL DEFAULT CURRENT_DATE,
    base_boundary_fee NUMERIC(10,2) NOT NULL,
    fuel_subsidy NUMERIC(10,2) DEFAULT 0.00,
    maintenance_allowance NUMERIC(10,2) DEFAULT 0.00,
    other_adjustments NUMERIC(10,2) DEFAULT 0.00,
    total_amount NUMERIC(10,2) NOT NULL,
    
    -- Vehicle Information
    vehicle_plate_number VARCHAR(20) NOT NULL,
    service_type VARCHAR(50) NOT NULL,
    
    -- Performance-based Adjustments
    driver_performance_score NUMERIC(5,2),
    performance_adjustment NUMERIC(10,2) DEFAULT 0.00,
    bonus_earned NUMERIC(10,2) DEFAULT 0.00,
    
    -- Payment Tracking
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'disputed', 'refunded')),
    payment_method VARCHAR(50),
    paid_at TIMESTAMP WITH TIME ZONE,
    
    -- Operational Metrics
    trips_completed INTEGER DEFAULT 0,
    hours_worked NUMERIC(5,2) DEFAULT 0.00,
    distance_covered_km NUMERIC(8,2) DEFAULT 0.00,
    
    -- Revenue Sharing
    driver_gross_earnings NUMERIC(10,2) DEFAULT 0.00,
    revenue_share_percentage NUMERIC(5,2),
    revenue_share_amount NUMERIC(10,2) DEFAULT 0.00,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(operator_id, driver_id, fee_date),
    
    -- Indexes
    INDEX idx_boundary_fees_operator (operator_id),
    INDEX idx_boundary_fees_driver (driver_id),
    INDEX idx_boundary_fees_date (fee_date),
    INDEX idx_boundary_fees_status (payment_status)
);

-- Commission rate configurations
CREATE TABLE IF NOT EXISTS commission_rate_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Commission Tier Configuration
    commission_tier VARCHAR(20) NOT NULL 
        CHECK (commission_tier IN ('tier_1', 'tier_2', 'tier_3')),
    rate_percentage NUMERIC(5,2) NOT NULL CHECK (rate_percentage >= 0 AND rate_percentage <= 100),
    
    -- Qualification Requirements
    min_performance_score NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    min_tenure_months INTEGER NOT NULL DEFAULT 0,
    min_payment_consistency NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    min_utilization_percentile NUMERIC(5,2),
    
    -- Additional Requirements
    additional_requirements JSONB DEFAULT '{}'::jsonb,
    
    -- Rate Validity
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_until DATE,
    
    -- Regional Variations
    region_id UUID REFERENCES regions(id),
    operator_type_override VARCHAR(20) 
        CHECK (operator_type_override IN ('tnvs', 'general', 'fleet')),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Indexes
    INDEX idx_commission_rates_tier (commission_tier),
    INDEX idx_commission_rates_effective (effective_from, effective_until),
    INDEX idx_commission_rates_region (region_id),
    INDEX idx_commission_rates_active (is_active)
);

-- Operator financial summaries
CREATE TABLE IF NOT EXISTS operator_financial_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
    
    -- Period Information
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    period_type VARCHAR(20) NOT NULL 
        CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'annual')),
    
    -- Revenue Streams
    total_commissions_earned NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    total_boundary_fees_collected NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    total_incentive_bonuses NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    total_subsidies_provided NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    
    -- Deductions and Costs
    total_penalties_deducted NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    total_refunds_processed NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    total_operational_costs NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    
    -- Net Calculations
    gross_revenue NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    net_revenue NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    profit_margin NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    
    -- Volume Metrics
    total_trips INTEGER NOT NULL DEFAULT 0,
    total_active_days INTEGER NOT NULL DEFAULT 0,
    average_daily_revenue NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    
    -- Performance Metrics
    average_commission_rate NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    commission_tier_during_period VARCHAR(20) NOT NULL DEFAULT 'tier_3',
    performance_score_avg NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    
    -- Payment Metrics
    payments_on_time INTEGER NOT NULL DEFAULT 0,
    payments_late INTEGER NOT NULL DEFAULT 0,
    payment_consistency_rate NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    
    -- Growth Metrics
    revenue_growth_rate NUMERIC(8,4),
    trip_volume_growth_rate NUMERIC(8,4),
    
    -- Metadata
    calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    recalculated_at TIMESTAMP WITH TIME ZONE,
    is_final BOOLEAN NOT NULL DEFAULT false,
    
    -- Constraints
    UNIQUE(operator_id, period_start, period_end, period_type),
    
    -- Indexes
    INDEX idx_fin_summaries_operator (operator_id),
    INDEX idx_fin_summaries_period (period_start, period_end),
    INDEX idx_fin_summaries_type (period_type),
    INDEX idx_fin_summaries_calculated (calculated_at)
);

-- =====================================================
-- FRAUD DETECTION INTEGRATION
-- =====================================================

-- Fraud screening results for operators
CREATE TABLE IF NOT EXISTS fraud_screening_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
    
    -- Screening Context
    screening_trigger VARCHAR(50) NOT NULL,
    transaction_data JSONB,
    
    -- Fraud Assessment
    risk_score NUMERIC(5,2) NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
    risk_level VARCHAR(20) NOT NULL 
        CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    risk_factors TEXT[],
    
    -- Decision
    decision VARCHAR(20) NOT NULL 
        CHECK (decision IN ('approve', 'review', 'deny')),
    decision_reason TEXT,
    
    -- ML Model Results
    ml_model_version VARCHAR(20),
    ml_confidence_score NUMERIC(5,2),
    ml_features_used TEXT[],
    
    -- Review Information
    requires_manual_review BOOLEAN DEFAULT false,
    review_priority VARCHAR(20) DEFAULT 'medium'
        CHECK (review_priority IN ('low', 'medium', 'high', 'urgent')),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES users(id),
    review_decision VARCHAR(20),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Indexes
    INDEX idx_fraud_screening_operator (operator_id),
    INDEX idx_fraud_screening_risk (risk_level),
    INDEX idx_fraud_screening_decision (decision),
    INDEX idx_fraud_screening_date (created_at),
    INDEX idx_fraud_screening_review (requires_manual_review)
);

-- Fraud alerts for operators
CREATE TABLE IF NOT EXISTS fraud_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
    
    -- Alert Details
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL 
        CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'investigating', 'resolved', 'false_positive')),
    
    -- Alert Content
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    fraud_score NUMERIC(5,2) NOT NULL,
    confidence NUMERIC(5,2) NOT NULL,
    
    -- Evidence
    evidence JSONB DEFAULT '[]'::jsonb,
    pattern_matches JSONB DEFAULT '[]'::jsonb,
    
    -- Investigation
    assigned_to UUID REFERENCES users(id),
    investigation_notes TEXT,
    resolution_notes TEXT,
    action_taken VARCHAR(100),
    
    -- Timeline
    detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_fraud_alerts_operator (operator_id),
    INDEX idx_fraud_alerts_type (alert_type),
    INDEX idx_fraud_alerts_severity (severity),
    INDEX idx_fraud_alerts_status (status),
    INDEX idx_fraud_alerts_detected (detected_at)
);

-- =====================================================
-- NOTIFICATION INTEGRATION
-- =====================================================

-- Operator notifications
CREATE TABLE IF NOT EXISTS operator_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
    
    -- Notification Details
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'medium'
        CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- Delivery
    channels TEXT[] NOT NULL,
    delivery_status JSONB DEFAULT '{}'::jsonb,
    
    -- Action
    action_required BOOLEAN DEFAULT false,
    action_url VARCHAR(500),
    action_taken_at TIMESTAMP WITH TIME ZONE,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'unread'
        CHECK (status IN ('unread', 'read', 'archived', 'dismissed')),
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Indexes
    INDEX idx_operator_notifications_operator (operator_id),
    INDEX idx_operator_notifications_type (type),
    INDEX idx_operator_notifications_priority (priority),
    INDEX idx_operator_notifications_status (status),
    INDEX idx_operator_notifications_created (created_at)
);

-- Operator notification preferences
CREATE TABLE IF NOT EXISTS operator_notification_preferences (
    operator_id UUID PRIMARY KEY REFERENCES operators(id) ON DELETE CASCADE,
    
    -- Channel Preferences
    channels JSONB NOT NULL DEFAULT '["email", "in_app"]'::jsonb,
    
    -- Type Preferences
    tier_change_notifications BOOLEAN DEFAULT true,
    performance_alerts BOOLEAN DEFAULT true,
    payment_notifications BOOLEAN DEFAULT true,
    compliance_reminders BOOLEAN DEFAULT true,
    system_maintenance BOOLEAN DEFAULT true,
    
    -- Timing Preferences
    quiet_hours_enabled BOOLEAN DEFAULT false,
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    timezone VARCHAR(50) DEFAULT 'Asia/Manila',
    
    -- Frequency Preferences
    daily_digest BOOLEAN DEFAULT false,
    weekly_summary BOOLEAN DEFAULT true,
    instant_critical BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =====================================================
-- COMPLIANCE & REGULATORY INTEGRATION
-- =====================================================

-- Compliance violations
CREATE TABLE IF NOT EXISTS compliance_violations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
    
    -- Violation Details
    violation_type VARCHAR(50) NOT NULL,
    violation_code VARCHAR(20),
    description TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL 
        CHECK (severity IN ('minor', 'major', 'critical')),
    
    -- Regulatory Context
    regulatory_body VARCHAR(50) NOT NULL, -- LTFRB, BIR, BSP, etc.
    regulatory_reference VARCHAR(100),
    regulation_section TEXT,
    
    -- Discovery
    discovered_by VARCHAR(50) NOT NULL, -- system, audit, report, inspection
    discovered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    discovery_details JSONB,
    
    -- Resolution
    status VARCHAR(20) NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'investigating', 'resolved', 'appealing', 'dismissed')),
    resolution_required_by DATE,
    resolution_steps TEXT[],
    resolution_notes TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id),
    
    -- Financial Impact
    fine_amount NUMERIC(15,2),
    fine_paid_at TIMESTAMP WITH TIME ZONE,
    appeal_filed BOOLEAN DEFAULT false,
    appeal_deadline DATE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_compliance_violations_operator (operator_id),
    INDEX idx_compliance_violations_type (violation_type),
    INDEX idx_compliance_violations_severity (severity),
    INDEX idx_compliance_violations_status (status),
    INDEX idx_compliance_violations_body (regulatory_body),
    INDEX idx_compliance_violations_discovered (discovered_at)
);

-- Regulatory reports
CREATE TABLE IF NOT EXISTS regulatory_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
    
    -- Report Details
    report_type VARCHAR(50) NOT NULL, -- ltfrb, bir, bsp, dpa
    report_period VARCHAR(50) NOT NULL,
    report_data JSONB NOT NULL,
    
    -- Submission
    required_by DATE NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE,
    submission_method VARCHAR(20) DEFAULT 'online'
        CHECK (submission_method IN ('online', 'physical', 'email', 'api')),
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'submitted', 'acknowledged', 'approved', 'rejected')),
    acknowledgment_number VARCHAR(100),
    acknowledgment_date DATE,
    
    -- Compliance
    compliance_issues JSONB DEFAULT '[]'::jsonb,
    corrections_required BOOLEAN DEFAULT false,
    correction_deadline DATE,
    
    -- Metadata
    generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    generated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_regulatory_reports_operator (operator_id),
    INDEX idx_regulatory_reports_type (report_type),
    INDEX idx_regulatory_reports_period (report_period),
    INDEX idx_regulatory_reports_status (status),
    INDEX idx_regulatory_reports_due (required_by)
);

-- =====================================================
-- EVENT TRACKING & WEBSOCKET INTEGRATION
-- =====================================================

-- Operator events for real-time updates
CREATE TABLE IF NOT EXISTS operator_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
    
    -- Event Details
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB NOT NULL,
    event_source VARCHAR(50) NOT NULL DEFAULT 'system',
    
    -- Context
    user_id UUID REFERENCES users(id),
    session_id VARCHAR(100),
    request_id VARCHAR(100),
    
    -- Processing
    processed BOOLEAN DEFAULT false,
    broadcast_sent BOOLEAN DEFAULT false,
    notification_sent BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Indexes
    INDEX idx_operator_events_operator (operator_id),
    INDEX idx_operator_events_type (event_type),
    INDEX idx_operator_events_created (created_at),
    INDEX idx_operator_events_processed (processed)
);

-- Event subscriptions for WebSocket
CREATE TABLE IF NOT EXISTS operator_event_subscriptions (
    operator_id UUID PRIMARY KEY REFERENCES operators(id) ON DELETE CASCADE,
    event_types TEXT[] NOT NULL DEFAULT '{}',
    websocket_connections JSONB DEFAULT '[]'::jsonb,
    
    -- Subscription Status
    is_active BOOLEAN DEFAULT true,
    last_activity TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =====================================================
-- ANALYTICS & REPORTING TABLES
-- =====================================================

-- Operator analytics summaries
CREATE TABLE IF NOT EXISTS operator_analytics_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
    
    -- Time Period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    period_type VARCHAR(20) NOT NULL,
    
    -- Financial Analytics
    total_revenue NUMERIC(15,2) DEFAULT 0.00,
    total_commissions NUMERIC(15,2) DEFAULT 0.00,
    average_commission_rate NUMERIC(5,2) DEFAULT 0.00,
    revenue_growth NUMERIC(8,4) DEFAULT 0.00,
    
    -- Performance Analytics
    performance_score NUMERIC(5,2) DEFAULT 0.00,
    performance_trend NUMERIC(8,4) DEFAULT 0.00,
    tier_progression JSONB DEFAULT '[]'::jsonb,
    
    -- Operational Analytics
    active_vehicles INTEGER DEFAULT 0,
    active_drivers INTEGER DEFAULT 0,
    trip_volume INTEGER DEFAULT 0,
    utilization_rate NUMERIC(5,2) DEFAULT 0.00,
    
    -- Quality Analytics
    customer_satisfaction NUMERIC(3,2) DEFAULT 0.00,
    driver_retention_rate NUMERIC(5,2) DEFAULT 0.00,
    safety_incidents INTEGER DEFAULT 0,
    compliance_score NUMERIC(5,2) DEFAULT 0.00,
    
    -- Comparative Analytics
    peer_ranking INTEGER,
    percentile_ranking NUMERIC(5,2),
    market_share NUMERIC(8,4),
    
    -- Metadata
    calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    calculation_version VARCHAR(20) DEFAULT '1.0',
    
    -- Constraints
    UNIQUE(operator_id, period_start, period_end, period_type),
    
    -- Indexes
    INDEX idx_analytics_operator (operator_id),
    INDEX idx_analytics_period (period_start, period_end),
    INDEX idx_analytics_type (period_type)
);

-- =====================================================
-- TRIGGERS FOR DATA CONSISTENCY
-- =====================================================

-- Update operator performance score when performance scores change
CREATE OR REPLACE FUNCTION update_operator_performance_score()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE operators 
    SET performance_score = NEW.total_score,
        commission_tier = NEW.commission_tier,
        tier_qualification_date = CASE 
            WHEN OLD.commission_tier != NEW.commission_tier THEN NOW()
            ELSE tier_qualification_date
        END,
        updated_at = NOW()
    WHERE id = NEW.operator_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_operator_performance_score
    AFTER INSERT OR UPDATE ON operator_performance_scores
    FOR EACH ROW EXECUTE FUNCTION update_operator_performance_score();

-- Update operator financial totals when transactions change
CREATE OR REPLACE FUNCTION update_operator_financial_totals()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE operators 
        SET wallet_balance = wallet_balance + NEW.amount,
            total_commissions_earned = CASE 
                WHEN NEW.transaction_type = 'commission_earned' THEN total_commissions_earned + NEW.amount
                ELSE total_commissions_earned
            END,
            updated_at = NOW()
        WHERE id = NEW.operator_id;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE operators 
        SET wallet_balance = wallet_balance - OLD.amount,
            total_commissions_earned = CASE 
                WHEN OLD.transaction_type = 'commission_earned' THEN total_commissions_earned - OLD.amount
                ELSE total_commissions_earned
            END,
            updated_at = NOW()
        WHERE id = OLD.operator_id;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_operator_financial_totals
    AFTER INSERT OR DELETE ON operator_financial_transactions
    FOR EACH ROW EXECUTE FUNCTION update_operator_financial_totals();

-- Update vehicle count when operator vehicles change
CREATE OR REPLACE FUNCTION update_operator_vehicle_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE operators 
        SET current_vehicle_count = (
            SELECT COUNT(*) FROM operator_vehicles 
            WHERE operator_id = NEW.operator_id AND is_active = true
        ),
        updated_at = NOW()
        WHERE id = NEW.operator_id;
        
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.is_active != NEW.is_active THEN
            UPDATE operators 
            SET current_vehicle_count = (
                SELECT COUNT(*) FROM operator_vehicles 
                WHERE operator_id = NEW.operator_id AND is_active = true
            ),
            updated_at = NOW()
            WHERE id = NEW.operator_id;
        END IF;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE operators 
        SET current_vehicle_count = (
            SELECT COUNT(*) FROM operator_vehicles 
            WHERE operator_id = OLD.operator_id AND is_active = true
        ),
        updated_at = NOW()
        WHERE id = OLD.operator_id;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_operator_vehicle_count
    AFTER INSERT OR UPDATE OR DELETE ON operator_vehicles
    FOR EACH ROW EXECUTE FUNCTION update_operator_vehicle_count();

-- =====================================================
-- INITIAL DATA SEEDING
-- =====================================================

-- Insert default commission rate configurations
INSERT INTO commission_rate_config (commission_tier, rate_percentage, min_performance_score, min_tenure_months, min_payment_consistency) 
VALUES 
    ('tier_1', 10.00, 90.00, 12, 95.00),
    ('tier_2', 12.50, 75.00, 6, 85.00),
    ('tier_3', 15.00, 0.00, 0, 0.00)
ON CONFLICT DO NOTHING;

-- Insert default performance metric configurations
INSERT INTO performance_metric_configs (metric_name, display_name, metric_type, category_weight, max_points, is_active)
VALUES 
    ('daily_vehicle_utilization', 'Daily Vehicle Utilization', 'vehicle_utilization', 30.00, 30, true),
    ('peak_hour_availability', 'Peak Hour Availability', 'vehicle_utilization', 20.00, 20, true),
    ('driver_retention_rate', 'Driver Retention Rate', 'driver_management', 25.00, 25, true),
    ('safety_incident_rate', 'Safety Incident Rate', 'compliance_safety', 25.00, 25, true),
    ('customer_satisfaction', 'Customer Satisfaction', 'platform_contribution', 20.00, 20, true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- =====================================================

-- Composite indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_operators_region_status ON operators(primary_region_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_operators_tier_score ON operators(commission_tier, performance_score);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fin_trans_operator_date ON operator_financial_transactions(operator_id, transaction_date DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_perf_scores_operator_period ON operator_performance_scores(operator_id, scoring_period DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_boundary_fees_operator_date ON operator_boundary_fees(operator_id, fee_date DESC);

-- Partial indexes for active records
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_operators_active ON operators(id) WHERE is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_operator_vehicles_active ON operator_vehicles(operator_id, vehicle_plate_number) WHERE is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_operator_drivers_active ON operator_drivers(operator_id, driver_id) WHERE is_active = true;

-- GIN indexes for JSONB columns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_operators_contact_gin ON operators USING GIN(primary_contact);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_operators_compliance_gin ON operators USING GIN(compliance_documents);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_perf_scores_data_gin ON operator_performance_scores USING GIN(metrics_data);

COMMENT ON SCHEMA public IS 'Xpress Ops Tower - Operators Integration Schema v1.0';