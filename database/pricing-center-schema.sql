-- Express Ops Tower Pricing Center - Enhanced Database Schema
-- Based on PRD Version 1.0 - September 2025

-- ============================================================================
-- CORE PRICING TABLES
-- ============================================================================

-- Enhanced Pricing Rules with LTFRB Compliance
CREATE TABLE IF NOT EXISTS pricing_rules_v2 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_type VARCHAR(50) NOT NULL CHECK (service_type IN ('tnvs_standard', 'tnvs_premium', 'taxi_regular', 'taxi_premium', 'mc_taxi')),
    base_fare DECIMAL(10,2) NOT NULL CHECK (base_fare >= 0),
    per_km_rate DECIMAL(10,2) NOT NULL CHECK (per_km_rate >= 0),
    per_minute_rate DECIMAL(10,2) NOT NULL CHECK (per_minute_rate >= 0),
    surge_cap DECIMAL(3,1) NOT NULL CHECK (surge_cap >= 1.0 AND surge_cap <= 10.0),
    ltfrb_approved BOOLEAN DEFAULT false,
    ltfrb_approval_date DATE,
    ltfrb_reference_number VARCHAR(100),
    geographic_scope JSONB NOT NULL, -- City, region, or specific areas
    effective_date TIMESTAMP WITH TIME ZONE NOT NULL,
    expiry_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'suspended', 'expired')),
    created_by UUID NOT NULL,
    approved_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Real-time Pricing Decisions Log
CREATE TABLE IF NOT EXISTS pricing_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id VARCHAR(100) UNIQUE NOT NULL,
    service_type VARCHAR(50) NOT NULL,
    pickup_location POINT NOT NULL,
    dropoff_location POINT NOT NULL,
    pickup_address TEXT,
    dropoff_address TEXT,
    estimated_distance_km DECIMAL(8,2),
    estimated_duration_min INTEGER,
    base_fare DECIMAL(10,2) NOT NULL,
    distance_fare DECIMAL(10,2) NOT NULL DEFAULT 0,
    time_fare DECIMAL(10,2) NOT NULL DEFAULT 0,
    surge_multiplier DECIMAL(3,2) NOT NULL DEFAULT 1.0,
    surge_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_fare DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'PHP',
    factors JSONB, -- Weather, events, traffic, POI factors
    regulatory_compliance JSONB, -- LTFRB compliance data
    decision_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    used_at TIMESTAMP WITH TIME ZONE,
    trip_id UUID, -- Link to actual trip if booked
    
    -- Indexes for performance
    INDEX idx_pricing_decisions_timestamp (decision_timestamp),
    INDEX idx_pricing_decisions_location (pickup_location),
    INDEX idx_pricing_decisions_service_type (service_type),
    INDEX idx_pricing_decisions_quote_id (quote_id),
    INDEX idx_pricing_decisions_trip_id (trip_id)
);

-- Executive Overrides System
CREATE TABLE IF NOT EXISTS executive_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    override_type VARCHAR(50) NOT NULL CHECK (override_type IN ('surge_disable', 'surge_cap', 'fare_adjustment', 'service_suspend', 'emergency_control')),
    approver_id UUID NOT NULL,
    approver_level INTEGER NOT NULL CHECK (approver_level BETWEEN 1 AND 4),
    approver_name VARCHAR(255) NOT NULL,
    geographic_scope JSONB NOT NULL,
    service_types TEXT[] NOT NULL,
    parameters JSONB NOT NULL, -- Override-specific parameters
    reason TEXT NOT NULL,
    justification TEXT,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
    impact_assessment JSONB, -- Expected revenue/customer impact
    actual_impact JSONB, -- Measured impact after execution
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure proper approval hierarchy
    CHECK (
        (approver_level = 1 AND parameters->>'price_adjustment_pct'::numeric <= 20) OR
        (approver_level = 2 AND parameters->>'price_adjustment_pct'::numeric <= 50) OR
        (approver_level >= 3)
    )
);

-- ============================================================================
-- SURGE PRICING SYSTEM
-- ============================================================================

-- Surge Zones (H3 Hexagon-based)
CREATE TABLE IF NOT EXISTS surge_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    h3_cell_id VARCHAR(20) NOT NULL UNIQUE,
    h3_resolution INTEGER NOT NULL DEFAULT 8,
    zone_name VARCHAR(255),
    center_point POINT NOT NULL,
    polygon POLYGON,
    base_demand_score DECIMAL(5,2) DEFAULT 1.0,
    poi_multiplier DECIMAL(3,2) DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_surge_zones_h3 (h3_cell_id),
    INDEX idx_surge_zones_location (center_point)
);

-- Real-time Surge State
CREATE TABLE IF NOT EXISTS surge_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    h3_cell_id VARCHAR(20) NOT NULL,
    service_type VARCHAR(50) NOT NULL,
    current_multiplier DECIMAL(3,2) NOT NULL DEFAULT 1.0,
    supply_count INTEGER NOT NULL DEFAULT 0,
    demand_count INTEGER NOT NULL DEFAULT 0,
    supply_demand_ratio DECIMAL(5,2),
    active_trips INTEGER NOT NULL DEFAULT 0,
    completed_trips_1h INTEGER NOT NULL DEFAULT 0,
    weather_factor DECIMAL(3,2) DEFAULT 1.0,
    event_factor DECIMAL(3,2) DEFAULT 1.0,
    traffic_factor DECIMAL(3,2) DEFAULT 1.0,
    poi_factor DECIMAL(3,2) DEFAULT 1.0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '5 minutes',
    
    -- Ensure data freshness
    UNIQUE(h3_cell_id, service_type, timestamp),
    INDEX idx_surge_state_cell_service (h3_cell_id, service_type),
    INDEX idx_surge_state_timestamp (timestamp)
);

-- Surge Rules Engine
CREATE TABLE IF NOT EXISTS surge_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name VARCHAR(255) NOT NULL,
    service_type VARCHAR(50) NOT NULL,
    priority INTEGER NOT NULL DEFAULT 100,
    conditions JSONB NOT NULL, -- Complex rule conditions
    actions JSONB NOT NULL, -- Surge multiplier, caps, etc.
    geographic_scope JSONB, -- Where rule applies
    time_restrictions JSONB, -- When rule applies
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'testing')),
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- EXTERNAL DATA INTEGRATION
-- ============================================================================

-- Points of Interest
CREATE TABLE IF NOT EXISTS points_of_interest (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL, -- mall, airport, hospital, school, office, entertainment
    subcategory VARCHAR(100),
    location POINT NOT NULL,
    address TEXT,
    demand_multiplier DECIMAL(3,2) DEFAULT 1.0,
    influence_radius_km DECIMAL(5,2) DEFAULT 1.0,
    operating_hours JSONB, -- Daily operating schedule
    peak_hours JSONB, -- Peak demand periods
    special_events JSONB, -- Regular special events
    active BOOLEAN DEFAULT true,
    data_source VARCHAR(100), -- Google, OSM, manual, etc.
    last_verified TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_poi_location (location),
    INDEX idx_poi_category (category),
    INDEX idx_poi_active (active)
);

-- Events Data
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    event_type VARCHAR(50) NOT NULL, -- concert, sports, festival, conference, etc.
    venue_name VARCHAR(255),
    venue_location POINT NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    expected_attendance INTEGER,
    actual_attendance INTEGER,
    demand_impact_radius_km DECIMAL(5,2) DEFAULT 2.0,
    pricing_multiplier DECIMAL(3,2) DEFAULT 1.2,
    pre_event_hours INTEGER DEFAULT 2,
    post_event_hours INTEGER DEFAULT 3,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'ongoing', 'completed', 'cancelled')),
    data_source VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_events_time (start_time, end_time),
    INDEX idx_events_location (venue_location),
    INDEX idx_events_status (status)
);

-- Weather Data
CREATE TABLE IF NOT EXISTS weather_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_name VARCHAR(255) NOT NULL,
    location_point POINT NOT NULL,
    weather_condition VARCHAR(50) NOT NULL, -- sunny, cloudy, rainy, stormy, typhoon
    temperature_celsius DECIMAL(4,1),
    humidity_percent INTEGER,
    rainfall_mm DECIMAL(6,2),
    wind_speed_kph DECIMAL(5,1),
    visibility_km DECIMAL(4,1),
    weather_alert_level INTEGER DEFAULT 0, -- 0=none, 1=yellow, 2=orange, 3=red
    pricing_impact_multiplier DECIMAL(3,2) DEFAULT 1.0,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    data_source VARCHAR(50) DEFAULT 'PAGASA',
    
    INDEX idx_weather_location_time (location_point, timestamp),
    INDEX idx_weather_condition (weather_condition)
);

-- Traffic Data
CREATE TABLE IF NOT EXISTS traffic_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    area_name VARCHAR(255) NOT NULL,
    area_polygon POLYGON NOT NULL,
    traffic_level INTEGER NOT NULL CHECK (traffic_level BETWEEN 1 AND 5), -- 1=light, 5=heavy
    average_speed_kph DECIMAL(5,1),
    congestion_factor DECIMAL(3,2) DEFAULT 1.0,
    pricing_impact_multiplier DECIMAL(3,2) DEFAULT 1.0,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    data_source VARCHAR(50), -- MMDA, Google, Waze, etc.
    
    INDEX idx_traffic_area_time (area_polygon, timestamp),
    INDEX idx_traffic_level (traffic_level)
);

-- ============================================================================
-- FRAUD DETECTION SYSTEM
-- ============================================================================

-- Fraud Detection Rules
CREATE TABLE IF NOT EXISTS fraud_detection_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name VARCHAR(255) NOT NULL,
    rule_type VARCHAR(50) NOT NULL, -- ghost_trip, location_spoofing, price_manipulation, etc.
    detection_logic JSONB NOT NULL,
    threshold_params JSONB NOT NULL,
    action VARCHAR(50) NOT NULL, -- flag, block, investigate, alert
    severity INTEGER NOT NULL CHECK (severity BETWEEN 1 AND 5),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'testing')),
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fraud Incidents
CREATE TABLE IF NOT EXISTS fraud_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_type VARCHAR(50) NOT NULL,
    rule_id UUID REFERENCES fraud_detection_rules(id),
    severity INTEGER NOT NULL,
    user_id UUID,
    driver_id UUID,
    trip_id UUID,
    pricing_decision_id UUID REFERENCES pricing_decisions(id),
    evidence JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'false_positive')),
    assigned_to UUID,
    resolution JSONB,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    INDEX idx_fraud_incidents_type (incident_type),
    INDEX idx_fraud_incidents_status (status),
    INDEX idx_fraud_incidents_detected (detected_at)
);

-- ============================================================================
-- REGULATORY COMPLIANCE
-- ============================================================================

-- LTFRB Compliance Log
CREATE TABLE IF NOT EXISTS ltfrb_compliance_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    compliance_type VARCHAR(50) NOT NULL, -- fare_check, report_submission, audit_response
    service_type VARCHAR(50) NOT NULL,
    compliance_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('compliant', 'non_compliant', 'pending', 'requires_attention')),
    details JSONB,
    violations JSONB,
    corrective_actions JSONB,
    ltfrb_reference VARCHAR(100),
    submitted_by UUID,
    reviewed_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_ltfrb_compliance_date (compliance_date),
    INDEX idx_ltfrb_compliance_status (status)
);

-- Regulatory Filings
CREATE TABLE IF NOT EXISTS regulatory_filings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filing_type VARCHAR(50) NOT NULL, -- fare_application, compliance_report, incident_report
    regulatory_body VARCHAR(50) NOT NULL, -- LTFRB, DOTr, LGU
    filing_reference VARCHAR(100) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    filing_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL,
    documents JSONB, -- Document references and metadata
    responses JSONB, -- Regulatory responses
    deadline_date DATE,
    assigned_to UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ANALYTICS AND REPORTING
-- ============================================================================

-- Pricing Performance Metrics
CREATE TABLE IF NOT EXISTS pricing_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_date DATE NOT NULL,
    service_type VARCHAR(50) NOT NULL,
    geographic_scope VARCHAR(100) NOT NULL,
    total_trips INTEGER NOT NULL DEFAULT 0,
    total_revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
    avg_fare DECIMAL(10,2) NOT NULL DEFAULT 0,
    avg_surge_multiplier DECIMAL(3,2) NOT NULL DEFAULT 1.0,
    surge_trip_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
    customer_satisfaction_score DECIMAL(3,2),
    driver_satisfaction_score DECIMAL(3,2),
    compliance_score DECIMAL(5,2) DEFAULT 100.0,
    fraud_incident_count INTEGER DEFAULT 0,
    executive_override_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(metric_date, service_type, geographic_scope),
    INDEX idx_performance_date_service (metric_date, service_type)
);

-- A/B Testing Framework
CREATE TABLE IF NOT EXISTS pricing_experiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_name VARCHAR(255) NOT NULL,
    experiment_type VARCHAR(50) NOT NULL, -- surge_algorithm, fare_structure, ui_display
    hypothesis TEXT NOT NULL,
    control_config JSONB NOT NULL,
    treatment_config JSONB NOT NULL,
    target_population JSONB NOT NULL, -- Geographic, demographic filters
    success_metrics TEXT[] NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),
    results JSONB,
    conclusions TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SYSTEM CONFIGURATION
-- ============================================================================

-- Feature Flags
CREATE TABLE IF NOT EXISTS pricing_feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flag_name VARCHAR(100) NOT NULL UNIQUE,
    flag_type VARCHAR(50) NOT NULL, -- boolean, string, number, json
    flag_value JSONB NOT NULL,
    description TEXT,
    target_audience JSONB, -- Which users/services see this flag
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System Configuration
CREATE TABLE IF NOT EXISTS pricing_system_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value JSONB NOT NULL,
    config_type VARCHAR(50) NOT NULL, -- pricing, surge, fraud, compliance, etc.
    description TEXT,
    validation_rules JSONB,
    last_modified_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- AUDIT AND MONITORING
-- ============================================================================

-- Comprehensive Audit Log
CREATE TABLE IF NOT EXISTS pricing_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_type VARCHAR(50) NOT NULL, -- CREATE, UPDATE, DELETE, OVERRIDE, etc.
    entity_type VARCHAR(50) NOT NULL, -- pricing_rule, surge_state, override, etc.
    entity_id UUID NOT NULL,
    user_id UUID NOT NULL,
    user_role VARCHAR(50),
    changes JSONB, -- Before/after state
    metadata JSONB, -- Additional context
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_audit_timestamp (timestamp),
    INDEX idx_audit_user (user_id),
    INDEX idx_audit_entity (entity_type, entity_id)
);

-- System Health Monitoring
CREATE TABLE IF NOT EXISTS pricing_system_health (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    component_name VARCHAR(100) NOT NULL, -- api_gateway, pricing_engine, surge_calculator, etc.
    health_status VARCHAR(20) NOT NULL CHECK (health_status IN ('healthy', 'degraded', 'unhealthy', 'critical')),
    response_time_ms INTEGER,
    error_rate_percent DECIMAL(5,2),
    throughput_rpm INTEGER, -- Requests per minute
    last_error TEXT,
    metrics JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_health_component_time (component_name, timestamp),
    INDEX idx_health_status (health_status)
);

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Active Pricing Rules View
CREATE OR REPLACE VIEW active_pricing_rules AS
SELECT 
    pr.*,
    pr.effective_date <= NOW() AND (pr.expiry_date IS NULL OR pr.expiry_date > NOW()) AS is_currently_active
FROM pricing_rules_v2 pr
WHERE pr.status = 'active'
AND pr.ltfrb_approved = true;

-- Current Surge Status View
CREATE OR REPLACE VIEW current_surge_status AS
SELECT 
    ss.*,
    sz.zone_name,
    sz.center_point,
    CASE 
        WHEN ss.current_multiplier > 1.0 THEN 'active'
        ELSE 'inactive'
    END AS surge_status
FROM surge_state ss
JOIN surge_zones sz ON ss.h3_cell_id = sz.h3_cell_id
WHERE ss.expires_at > NOW();

-- Executive Overrides Dashboard View
CREATE OR REPLACE VIEW executive_overrides_dashboard AS
SELECT 
    eo.*,
    CASE 
        WHEN eo.end_time IS NULL OR eo.end_time > NOW() THEN 'active'
        ELSE 'expired'
    END AS current_status,
    EXTRACT(EPOCH FROM (COALESCE(eo.end_time, NOW()) - eo.start_time))/3600 AS duration_hours
FROM executive_overrides eo
WHERE eo.status = 'active'
ORDER BY eo.created_at DESC;

-- Pricing Performance Summary View
CREATE OR REPLACE VIEW pricing_performance_summary AS
SELECT 
    ppm.service_type,
    ppm.geographic_scope,
    AVG(ppm.total_revenue) AS avg_daily_revenue,
    AVG(ppm.avg_fare) AS avg_fare,
    AVG(ppm.avg_surge_multiplier) AS avg_surge_multiplier,
    AVG(ppm.surge_trip_percentage) AS avg_surge_percentage,
    AVG(ppm.customer_satisfaction_score) AS avg_customer_satisfaction,
    AVG(ppm.compliance_score) AS avg_compliance_score,
    COUNT(*) AS days_tracked
FROM pricing_performance_metrics ppm
WHERE ppm.metric_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY ppm.service_type, ppm.geographic_scope;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Additional performance indexes
CREATE INDEX IF NOT EXISTS idx_pricing_decisions_factors ON pricing_decisions USING GIN (factors);
CREATE INDEX IF NOT EXISTS idx_executive_overrides_geographic ON executive_overrides USING GIN (geographic_scope);
CREATE INDEX IF NOT EXISTS idx_surge_state_factors ON surge_state (weather_factor, event_factor, traffic_factor, poi_factor);
CREATE INDEX IF NOT EXISTS idx_events_time_location ON events (start_time, end_time, venue_location);
CREATE INDEX IF NOT EXISTS idx_weather_timestamp ON weather_data (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_traffic_timestamp ON traffic_data (timestamp DESC);

-- ============================================================================
-- INITIAL CONFIGURATION DATA
-- ============================================================================

-- Insert default system configuration
INSERT INTO pricing_system_config (config_key, config_value, config_type, description, last_modified_by) 
VALUES 
    ('surge_calculation_interval', '300', 'surge', 'Seconds between surge calculations', gen_random_uuid()),
    ('max_surge_multiplier', '5.0', 'surge', 'Maximum allowed surge multiplier', gen_random_uuid()),
    ('pricing_api_timeout_ms', '100', 'pricing', 'Maximum API response time in milliseconds', gen_random_uuid()),
    ('fraud_detection_enabled', 'true', 'fraud', 'Enable fraud detection system', gen_random_uuid()),
    ('ltfrb_compliance_check', 'true', 'compliance', 'Enable LTFRB compliance checking', gen_random_uuid())
ON CONFLICT (config_key) DO NOTHING;

-- Insert default feature flags
INSERT INTO pricing_feature_flags (flag_name, flag_type, flag_value, description, created_by)
VALUES 
    ('dynamic_surge_enabled', 'boolean', 'true', 'Enable dynamic surge pricing', gen_random_uuid()),
    ('executive_override_enabled', 'boolean', 'true', 'Enable executive override system', gen_random_uuid()),
    ('fraud_detection_active', 'boolean', 'true', 'Activate fraud detection', gen_random_uuid()),
    ('experimental_pricing', 'boolean', 'false', 'Enable experimental pricing features', gen_random_uuid())
ON CONFLICT (flag_name) DO NOTHING;

-- Insert default fraud detection rules
INSERT INTO fraud_detection_rules (rule_name, rule_type, detection_logic, threshold_params, action, severity, created_by)
VALUES 
    ('Ghost Trip Detection', 'ghost_trip', '{"min_distance": 0.1, "max_speed": 200}', '{"suspicious_threshold": 5}', 'flag', 4, gen_random_uuid()),
    ('Location Spoofing', 'location_spoofing', '{"gps_accuracy": 100, "jump_distance": 1000}', '{"max_jumps": 3}', 'block', 5, gen_random_uuid()),
    ('Surge Manipulation', 'surge_manipulation', '{"rapid_requests": 10, "time_window": 300}', '{"threshold": 15}', 'investigate', 3, gen_random_uuid())
ON CONFLICT DO NOTHING;

COMMIT;