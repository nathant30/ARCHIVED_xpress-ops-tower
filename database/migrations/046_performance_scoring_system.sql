-- =====================================================
-- PERFORMANCE SCORING SYSTEM FOR OPERATORS MANAGEMENT
-- Migration 046: Performance metrics and scoring tables
-- Implements comprehensive 100-point scoring system with commission tiers
-- =====================================================

-- =====================================================
-- ENUMS AND TYPES
-- =====================================================

-- Performance metric categories
CREATE TYPE performance_metric_type AS ENUM (
    'vehicle_utilization',   -- 30 points max
    'driver_management',     -- 25 points max  
    'compliance_safety',     -- 25 points max
    'platform_contribution' -- 20 points max
);

-- Scoring frequency types
CREATE TYPE scoring_frequency AS ENUM (
    'daily',
    'weekly', 
    'monthly',
    'quarterly'
);

-- Commission tier qualification status
CREATE TYPE tier_qualification_status AS ENUM (
    'qualified',
    'under_review',
    'disqualified',
    'probationary'
);

-- =====================================================
-- PERFORMANCE SCORING TABLES
-- =====================================================

-- Performance metrics configuration and weights
CREATE TABLE performance_metrics_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Metric identification
    metric_name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Categorization
    metric_type performance_metric_type NOT NULL,
    category_weight DECIMAL(5,2) NOT NULL, -- Percentage weight within category
    max_points DECIMAL(5,2) NOT NULL, -- Maximum points for this metric
    
    -- Calculation parameters
    calculation_formula TEXT, -- SQL expression or formula description
    threshold_values JSONB NOT NULL, -- Thresholds for scoring bands
    is_percentage BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT perf_config_weight_check CHECK (category_weight > 0 AND category_weight <= 100),
    CONSTRAINT perf_config_points_check CHECK (max_points > 0 AND max_points <= 100)
);

-- Historical performance scores by operator and period
CREATE TABLE operator_performance_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
    
    -- Scoring period
    scoring_period DATE NOT NULL, -- Date of the scoring period (daily/weekly/monthly)
    scoring_frequency scoring_frequency NOT NULL,
    
    -- Individual metric scores (0-100 scale)
    vehicle_utilization_score DECIMAL(5,2) DEFAULT 0.00,
    driver_management_score DECIMAL(5,2) DEFAULT 0.00,
    compliance_safety_score DECIMAL(5,2) DEFAULT 0.00,
    platform_contribution_score DECIMAL(5,2) DEFAULT 0.00,
    
    -- Calculated total score (weighted average)
    total_score DECIMAL(5,2) DEFAULT 0.00,
    
    -- Commission tier determination
    commission_tier commission_tier DEFAULT 'tier_1',
    tier_qualification_status tier_qualification_status DEFAULT 'under_review',
    tier_calculation_notes TEXT,
    
    -- Supporting metrics for scoring
    metrics_data JSONB DEFAULT '{}', -- Raw data used for calculations
    
    -- Performance indicators
    improvement_trend DECIMAL(5,2), -- Compared to previous period
    peer_ranking INTEGER, -- Ranking among similar operators
    peer_percentile DECIMAL(5,2), -- Percentile among peers
    
    -- Metadata
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    calculated_by VARCHAR(50) DEFAULT 'system', -- system, manual, audit
    is_final BOOLEAN DEFAULT FALSE, -- True when score is finalized
    
    UNIQUE(operator_id, scoring_period, scoring_frequency),
    
    -- Constraints
    CONSTRAINT perf_scores_range CHECK (
        vehicle_utilization_score >= 0 AND vehicle_utilization_score <= 100 AND
        driver_management_score >= 0 AND driver_management_score <= 100 AND
        compliance_safety_score >= 0 AND compliance_safety_score <= 100 AND
        platform_contribution_score >= 0 AND platform_contribution_score <= 100 AND
        total_score >= 0 AND total_score <= 100
    )
);

-- Detailed performance metrics breakdown
CREATE TABLE operator_performance_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    performance_score_id UUID NOT NULL REFERENCES operator_performance_scores(id) ON DELETE CASCADE,
    
    -- Metric identification
    metric_name VARCHAR(100) NOT NULL,
    metric_type performance_metric_type NOT NULL,
    
    -- Raw values and calculations
    raw_value DECIMAL(15,4), -- Raw metric value
    normalized_value DECIMAL(15,4), -- Normalized to 0-1 scale
    weighted_score DECIMAL(5,2), -- Final weighted score for this metric
    max_possible_score DECIMAL(5,2), -- Maximum points for this metric
    
    -- Context and calculation details
    calculation_method VARCHAR(100),
    calculation_parameters JSONB DEFAULT '{}',
    benchmarks JSONB DEFAULT '{}', -- Industry/peer benchmarks
    
    -- Performance bands
    performance_band VARCHAR(20), -- excellent, good, average, poor
    band_threshold_met BOOLEAN,
    
    -- Metadata
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Commission tier qualification tracking
CREATE TABLE commission_tier_qualifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
    
    -- Target commission tier
    target_tier commission_tier NOT NULL,
    qualification_status tier_qualification_status DEFAULT 'under_review',
    
    -- Qualification requirements tracking
    score_requirement DECIMAL(5,2) NOT NULL, -- Required performance score
    current_score DECIMAL(5,2), -- Current performance score
    score_qualified BOOLEAN DEFAULT FALSE,
    
    tenure_requirement INTEGER NOT NULL, -- Required months of operation
    current_tenure INTEGER, -- Current months since partnership start
    tenure_qualified BOOLEAN DEFAULT FALSE,
    
    payment_consistency_requirement DECIMAL(5,2), -- Required payment consistency %
    current_payment_consistency DECIMAL(5,2),
    payment_qualified BOOLEAN DEFAULT FALSE,
    
    utilization_requirement DECIMAL(5,2), -- Required utilization percentile
    current_utilization_percentile DECIMAL(5,2),
    utilization_qualified BOOLEAN DEFAULT FALSE,
    
    -- Additional requirements (tier-specific)
    additional_requirements JSONB DEFAULT '{}',
    requirements_status JSONB DEFAULT '{}',
    
    -- Qualification timeline
    evaluation_date DATE NOT NULL,
    qualification_date DATE,
    next_evaluation_date DATE,
    probation_end_date DATE,
    
    -- Notes and reasons
    qualification_notes TEXT,
    disqualification_reasons TEXT[],
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(operator_id, target_tier, evaluation_date)
);

-- Performance-based incentives and penalties
CREATE TABLE operator_performance_incentives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
    
    -- Incentive details
    incentive_type VARCHAR(50) NOT NULL, -- commission_bonus, fee_reduction, priority_access
    incentive_name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Triggering performance criteria
    trigger_score_min DECIMAL(5,2),
    trigger_score_max DECIMAL(5,2),
    trigger_tier commission_tier,
    trigger_metric_type performance_metric_type,
    trigger_conditions JSONB DEFAULT '{}',
    
    -- Incentive value
    incentive_value DECIMAL(12,2), -- Monetary value or percentage
    incentive_unit VARCHAR(20), -- amount, percentage, points
    application_method VARCHAR(50), -- per_trip, monthly_bonus, fee_waiver
    
    -- Validity period
    valid_from DATE NOT NULL,
    valid_until DATE,
    max_applications INTEGER, -- Maximum times this incentive can be applied
    applications_used INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    auto_apply BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    
    CONSTRAINT incentives_score_range CHECK (
        (trigger_score_min IS NULL OR trigger_score_min >= 0) AND
        (trigger_score_max IS NULL OR trigger_score_max <= 100) AND
        (trigger_score_min IS NULL OR trigger_score_max IS NULL OR trigger_score_min <= trigger_score_max)
    )
);

-- Performance improvement plans and interventions
CREATE TABLE operator_improvement_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
    
    -- Plan details
    plan_name VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium', -- high, medium, low
    
    -- Triggering performance issues
    trigger_score DECIMAL(5,2), -- Score that triggered the plan
    focus_areas performance_metric_type[], -- Areas needing improvement
    specific_metrics TEXT[], -- Specific metrics to improve
    
    -- Improvement targets
    target_score DECIMAL(5,2) NOT NULL, -- Target performance score
    target_metrics JSONB DEFAULT '{}', -- Specific metric targets
    timeline_days INTEGER NOT NULL, -- Days to achieve targets
    
    -- Plan execution
    action_items JSONB NOT NULL, -- Detailed action items with deadlines
    assigned_manager UUID REFERENCES users(id), -- Account manager responsible
    check_in_frequency VARCHAR(20) DEFAULT 'weekly', -- daily, weekly, bi-weekly
    
    -- Progress tracking
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    milestones_completed INTEGER DEFAULT 0,
    total_milestones INTEGER NOT NULL,
    current_score DECIMAL(5,2),
    
    -- Status and timeline
    status VARCHAR(20) DEFAULT 'active', -- active, on_hold, completed, cancelled
    start_date DATE NOT NULL,
    target_completion_date DATE NOT NULL,
    actual_completion_date DATE,
    
    -- Results
    final_score DECIMAL(5,2),
    success_achieved BOOLEAN,
    completion_notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    
    CONSTRAINT improvement_progress_check CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    CONSTRAINT improvement_target_check CHECK (target_score > trigger_score),
    CONSTRAINT improvement_dates_check CHECK (target_completion_date > start_date)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Performance configuration
CREATE INDEX CONCURRENTLY idx_perf_config_type ON performance_metrics_config(metric_type, is_active);
CREATE INDEX CONCURRENTLY idx_perf_config_name ON performance_metrics_config(metric_name) WHERE is_active = TRUE;

-- Performance scores
CREATE INDEX CONCURRENTLY idx_perf_scores_operator_period ON operator_performance_scores(operator_id, scoring_period DESC);
CREATE INDEX CONCURRENTLY idx_perf_scores_frequency ON operator_performance_scores(scoring_frequency, scoring_period DESC);
CREATE INDEX CONCURRENTLY idx_perf_scores_total_score ON operator_performance_scores(total_score DESC, scoring_period DESC);
CREATE INDEX CONCURRENTLY idx_perf_scores_tier ON operator_performance_scores(commission_tier, total_score DESC);
CREATE INDEX CONCURRENTLY idx_perf_scores_ranking ON operator_performance_scores(peer_ranking, peer_percentile DESC) WHERE peer_ranking IS NOT NULL;

-- Performance details
CREATE INDEX CONCURRENTLY idx_perf_details_score ON operator_performance_details(performance_score_id, metric_type);
CREATE INDEX CONCURRENTLY idx_perf_details_metric ON operator_performance_details(metric_name, weighted_score DESC);

-- Commission tier qualifications
CREATE INDEX CONCURRENTLY idx_tier_quals_operator ON commission_tier_qualifications(operator_id, target_tier, evaluation_date DESC);
CREATE INDEX CONCURRENTLY idx_tier_quals_status ON commission_tier_qualifications(qualification_status, next_evaluation_date);
CREATE INDEX CONCURRENTLY idx_tier_quals_tier ON commission_tier_qualifications(target_tier, qualification_status, current_score DESC);

-- Performance incentives
CREATE INDEX CONCURRENTLY idx_perf_incentives_operator ON operator_performance_incentives(operator_id, is_active);
CREATE INDEX CONCURRENTLY idx_perf_incentives_type ON operator_performance_incentives(incentive_type, trigger_tier);
CREATE INDEX CONCURRENTLY idx_perf_incentives_dates ON operator_performance_incentives(valid_from, valid_until) WHERE is_active = TRUE;

-- Improvement plans
CREATE INDEX CONCURRENTLY idx_improvement_operator ON operator_improvement_plans(operator_id, status, start_date DESC);
CREATE INDEX CONCURRENTLY idx_improvement_manager ON operator_improvement_plans(assigned_manager, status) WHERE assigned_manager IS NOT NULL;
CREATE INDEX CONCURRENTLY idx_improvement_completion ON operator_improvement_plans(target_completion_date, status) WHERE status = 'active';

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Apply updated_at triggers
CREATE TRIGGER tr_perf_config_updated_at BEFORE UPDATE ON performance_metrics_config FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_tier_quals_updated_at BEFORE UPDATE ON commission_tier_qualifications FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_improvement_plans_updated_at BEFORE UPDATE ON operator_improvement_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- INITIAL PERFORMANCE CONFIGURATION
-- =====================================================

-- Insert standard performance metrics configuration
INSERT INTO performance_metrics_config (metric_name, display_name, description, metric_type, category_weight, max_points, threshold_values) VALUES

-- Vehicle Utilization Metrics (30 points total)
('daily_vehicle_utilization', 'Daily Vehicle Utilization Rate', 'Average daily utilization rate across all vehicles', 'vehicle_utilization', 40.0, 12.0, 
 '{"excellent": {"min": 85, "points": 12}, "good": {"min": 70, "points": 9}, "average": {"min": 50, "points": 6}, "poor": {"min": 0, "points": 0}}'),

('peak_hour_availability', 'Peak Hour Availability', 'Vehicle availability during high-demand periods', 'vehicle_utilization', 30.0, 9.0,
 '{"excellent": {"min": 95, "points": 9}, "good": {"min": 85, "points": 6.5}, "average": {"min": 70, "points": 4}, "poor": {"min": 0, "points": 0}}'),

('fleet_efficiency_ratio', 'Fleet Efficiency Ratio', 'Revenue per vehicle vs. market average', 'vehicle_utilization', 30.0, 9.0,
 '{"excellent": {"min": 120, "points": 9}, "good": {"min": 100, "points": 6.5}, "average": {"min": 80, "points": 4}, "poor": {"min": 0, "points": 0}}'),

-- Driver Management Metrics (25 points total)  
('driver_retention_rate', 'Driver Retention Rate', '12-month driver retention percentage', 'driver_management', 35.0, 8.75,
 '{"excellent": {"min": 90, "points": 8.75}, "good": {"min": 80, "points": 6.5}, "average": {"min": 60, "points": 4}, "poor": {"min": 0, "points": 0}}'),

('driver_performance_avg', 'Average Driver Performance', 'Weighted average of all driver performance scores', 'driver_management', 35.0, 8.75,
 '{"excellent": {"min": 85, "points": 8.75}, "good": {"min": 75, "points": 6.5}, "average": {"min": 60, "points": 4}, "poor": {"min": 0, "points": 0}}'),

('training_completion_rate', 'Training Completion Rate', 'Driver training and certification completion rate', 'driver_management', 30.0, 7.5,
 '{"excellent": {"min": 95, "points": 7.5}, "good": {"min": 85, "points": 5.5}, "average": {"min": 70, "points": 3}, "poor": {"min": 0, "points": 0}}'),

-- Compliance & Safety Metrics (25 points total)
('safety_incident_rate', 'Safety Incident Rate', 'Safety incidents per 1000 trips (inverted score)', 'compliance_safety', 40.0, 10.0,
 '{"excellent": {"max": 0.5, "points": 10}, "good": {"max": 1.0, "points": 7.5}, "average": {"max": 2.0, "points": 5}, "poor": {"max": 999, "points": 0}}'),

('regulatory_compliance', 'Regulatory Compliance Rate', 'Compliance with LTO, LTFRB, and local regulations', 'compliance_safety', 35.0, 8.75,
 '{"excellent": {"min": 98, "points": 8.75}, "good": {"min": 95, "points": 6.5}, "average": {"min": 90, "points": 4}, "poor": {"min": 0, "points": 0}}'),

('vehicle_maintenance_score', 'Vehicle Maintenance Score', 'Timely maintenance and inspection compliance', 'compliance_safety', 25.0, 6.25,
 '{"excellent": {"min": 95, "points": 6.25}, "good": {"min": 85, "points": 4.5}, "average": {"min": 70, "points": 2.5}, "poor": {"min": 0, "points": 0}}'),

-- Platform Contribution Metrics (20 points total)
('customer_satisfaction', 'Customer Satisfaction Rating', 'Average customer rating for operator drivers', 'platform_contribution', 40.0, 8.0,
 '{"excellent": {"min": 4.8, "points": 8}, "good": {"min": 4.5, "points": 6}, "average": {"min": 4.0, "points": 4}, "poor": {"min": 0, "points": 0}}'),

('service_area_coverage', 'Service Area Coverage', 'Geographic coverage and availability', 'platform_contribution', 30.0, 6.0,
 '{"excellent": {"min": 90, "points": 6}, "good": {"min": 75, "points": 4.5}, "average": {"min": 50, "points": 2.5}, "poor": {"min": 0, "points": 0}}'),

('technology_adoption', 'Technology Adoption Rate', 'Use of platform features and tools', 'platform_contribution', 30.0, 6.0,
 '{"excellent": {"min": 85, "points": 6}, "good": {"min": 70, "points": 4.5}, "average": {"min": 50, "points": 2.5}, "poor": {"min": 0, "points": 0}}');

-- =====================================================
-- COMMENTS AND DOCUMENTATION  
-- =====================================================

COMMENT ON TABLE performance_metrics_config IS 'Configuration for performance scoring metrics with weights and thresholds';
COMMENT ON TABLE operator_performance_scores IS 'Historical performance scores by operator with commission tier determination';
COMMENT ON TABLE operator_performance_details IS 'Detailed breakdown of individual performance metrics';
COMMENT ON TABLE commission_tier_qualifications IS 'Tracking of commission tier qualification requirements and status';
COMMENT ON TABLE operator_performance_incentives IS 'Performance-based incentives and bonuses for operators';
COMMENT ON TABLE operator_improvement_plans IS 'Structured improvement plans for underperforming operators';

COMMENT ON COLUMN operator_performance_scores.vehicle_utilization_score IS 'Vehicle Utilization score (max 30 points): daily utilization, peak availability, efficiency ratio';
COMMENT ON COLUMN operator_performance_scores.driver_management_score IS 'Driver Management score (max 25 points): retention, performance, training';
COMMENT ON COLUMN operator_performance_scores.compliance_safety_score IS 'Compliance & Safety score (max 25 points): incidents, regulations, maintenance';
COMMENT ON COLUMN operator_performance_scores.platform_contribution_score IS 'Platform Contribution score (max 20 points): satisfaction, coverage, technology adoption';