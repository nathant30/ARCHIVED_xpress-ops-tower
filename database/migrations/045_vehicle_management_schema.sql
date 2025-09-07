-- =====================================================
-- VEHICLE MANAGEMENT COMPREHENSIVE SCHEMA v1.0
-- Xpress Ops Tower Platform - Philippines Operations
-- Migration 045: Complete vehicle lifecycle management
-- Supports 4 ownership models with differentiated data access
-- =====================================================

-- Migration metadata
INSERT INTO schema_migrations (version, description, executed_at) VALUES 
('045', 'Comprehensive vehicle management system for multi-ownership models', NOW());

-- =====================================================
-- VEHICLE MANAGEMENT ENUMS
-- =====================================================

-- Vehicle ownership model types for Philippines market
CREATE TYPE vehicle_ownership_type AS ENUM (
    'xpress_owned',      -- Full Xpress ownership, complete data access
    'fleet_owned',       -- External fleet management, optional OBD
    'operator_owned',    -- Individual operators (1-3 vehicles), basic + optional OBD
    'driver_owned'       -- Driver owns vehicle, minimal tracking
);

-- Vehicle operational status
CREATE TYPE vehicle_status AS ENUM (
    'active',            -- Available for service
    'in_service',        -- Currently in use
    'maintenance',       -- Under maintenance/repair
    'inspection',        -- Safety/regulatory inspection
    'inactive',          -- Temporarily out of service
    'decommissioned',    -- Permanently removed from service
    'impounded'          -- Vehicle impounded by authorities
);

-- Vehicle condition ratings
CREATE TYPE vehicle_condition AS ENUM (
    'excellent',         -- 90-100% condition
    'good',             -- 75-89% condition
    'fair',             -- 60-74% condition
    'poor',             -- 40-59% condition
    'critical'          -- Below 40% condition
);

-- Maintenance priority levels
CREATE TYPE maintenance_priority AS ENUM (
    'routine',          -- Scheduled maintenance
    'minor',            -- Minor issues, can wait
    'major',            -- Major issues, schedule soon
    'urgent',           -- Urgent repair needed
    'critical'          -- Safety critical, immediate attention
);

-- OBD connection status
CREATE TYPE obd_status AS ENUM (
    'connected',        -- Active OBD connection
    'disconnected',     -- OBD device disconnected
    'error',            -- OBD device error
    'not_installed',    -- No OBD device
    'maintenance'       -- OBD under maintenance
);

-- Fuel/energy types for Philippines market
CREATE TYPE fuel_type AS ENUM (
    'gasoline',         -- Regular gasoline
    'diesel',           -- Diesel fuel
    'lpg',              -- Liquefied Petroleum Gas
    'electric',         -- Electric vehicle
    'hybrid_gas',       -- Hybrid with gasoline
    'hybrid_diesel'     -- Hybrid with diesel
);

-- Vehicle category types
CREATE TYPE vehicle_category AS ENUM (
    'sedan',            -- 4-door sedan
    'hatchback',        -- Hatchback car
    'suv',              -- Sport Utility Vehicle
    'mpv',              -- Multi-Purpose Vehicle
    'van',              -- Commercial van
    'motorcycle',       -- Motorcycle/scooter
    'tricycle',         -- Motorized tricycle
    'jeepney',          -- Traditional jeepney
    'e_jeepney',        -- Electric jeepney
    'bus'               -- Bus for group transport
);

-- =====================================================
-- CORE VEHICLE TABLES
-- =====================================================

-- Master vehicle registry with ownership-based data structure
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic vehicle identification
    vehicle_code VARCHAR(20) NOT NULL UNIQUE, -- Internal tracking code
    license_plate VARCHAR(15) NOT NULL UNIQUE,
    vin VARCHAR(17), -- Vehicle Identification Number (when available)
    
    -- Vehicle specifications
    make VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL CHECK (year >= 1990 AND year <= EXTRACT(YEAR FROM NOW()) + 2),
    color VARCHAR(30) NOT NULL,
    category vehicle_category NOT NULL,
    fuel_type fuel_type NOT NULL,
    
    -- Engine and capacity details
    engine_displacement INTEGER, -- cc displacement
    seating_capacity INTEGER NOT NULL CHECK (seating_capacity >= 1 AND seating_capacity <= 50),
    cargo_capacity_kg INTEGER, -- Cargo capacity in kg
    
    -- Ownership model (determines data availability)
    ownership_type vehicle_ownership_type NOT NULL,
    fleet_owner_name VARCHAR(200), -- For fleet_owned vehicles
    operator_owner_name VARCHAR(200), -- For operator_owned vehicles
    
    -- Status and condition
    status vehicle_status DEFAULT 'inactive',
    condition_rating vehicle_condition DEFAULT 'good',
    condition_score DECIMAL(5,2) DEFAULT 75.00 CHECK (condition_score >= 0 AND condition_score <= 100),
    
    -- Regional assignment
    region_id UUID NOT NULL REFERENCES regions(id),
    primary_service_area GEOMETRY(POLYGON, 4326), -- Primary operating area
    
    -- Financial information (varies by ownership type)
    acquisition_cost DECIMAL(12,2), -- Only for xpress_owned
    current_market_value DECIMAL(12,2),
    monthly_depreciation DECIMAL(10,2),
    insurance_value DECIMAL(12,2),
    
    -- Registration and compliance (Philippines-specific)
    or_number VARCHAR(50), -- Official Receipt number
    cr_number VARCHAR(50), -- Certificate of Registration number  
    registration_expiry DATE NOT NULL,
    ltfrb_franchise_number VARCHAR(50), -- LTFRB franchise for commercial vehicles
    ltfrb_franchise_expiry DATE,
    
    -- Insurance information
    insurance_provider VARCHAR(100),
    insurance_policy_number VARCHAR(100),
    insurance_expiry DATE,
    insurance_coverage_amount DECIMAL(12,2),
    
    -- OBD and telematics capability
    obd_device_installed BOOLEAN DEFAULT FALSE,
    obd_device_serial VARCHAR(100),
    telematics_provider VARCHAR(50), -- Provider name (e.g., "Fleet Complete", "Geotab")
    telematics_plan VARCHAR(50),
    
    -- Service capabilities based on vehicle type
    service_types service_type[] NOT NULL, -- From core schema enum
    max_trip_distance_km INTEGER DEFAULT 100, -- Maximum single trip distance
    
    -- Maintenance tracking
    last_maintenance_date DATE,
    next_maintenance_due DATE,
    total_maintenance_cost DECIMAL(12,2) DEFAULT 0.00,
    maintenance_alerts_count INTEGER DEFAULT 0,
    
    -- Performance metrics
    total_distance_km DECIMAL(10,2) DEFAULT 0.00,
    total_trips INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 5.00 CHECK (average_rating >= 1.00 AND average_rating <= 5.00),
    fuel_efficiency_kmpl DECIMAL(6,2), -- km per liter
    carbon_emissions_kg DECIMAL(10,2) DEFAULT 0.00, -- Total carbon emissions
    
    -- Availability and utilization
    daily_operating_hours INTEGER DEFAULT 12, -- Hours per day vehicle operates
    utilization_rate DECIMAL(5,2) DEFAULT 0.00, -- Percentage of time in use
    availability_score DECIMAL(5,2) DEFAULT 100.00, -- Overall availability rating
    
    -- Emergency and safety
    emergency_contacts JSONB DEFAULT '[]', -- Emergency contact information
    safety_features JSONB DEFAULT '{}', -- Safety equipment and features
    accident_count INTEGER DEFAULT 0,
    
    -- Audit and tracking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Data availability constraints based on ownership type
    CONSTRAINT vehicles_ownership_data_constraints CHECK (
        CASE 
            WHEN ownership_type = 'xpress_owned' THEN 
                acquisition_cost IS NOT NULL AND obd_device_installed = TRUE
            WHEN ownership_type = 'fleet_owned' THEN 
                fleet_owner_name IS NOT NULL
            WHEN ownership_type = 'operator_owned' THEN 
                operator_owner_name IS NOT NULL
            ELSE TRUE
        END
    )
);

-- Vehicle-Driver assignment relationship
CREATE TABLE vehicle_driver_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Core assignment relationship
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    
    -- Assignment details
    assignment_type VARCHAR(20) NOT NULL CHECK (assignment_type IN ('primary', 'secondary', 'temporary')),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES users(id),
    
    -- Validity period
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE, -- NULL means indefinite
    
    -- Assignment terms (for non-Xpress owned vehicles)
    daily_rental_fee DECIMAL(8,2), -- Daily rental fee to driver
    fuel_responsibility VARCHAR(20) DEFAULT 'driver' CHECK (fuel_responsibility IN ('driver', 'owner', 'shared')),
    maintenance_responsibility VARCHAR(20) DEFAULT 'owner' CHECK (maintenance_responsibility IN ('driver', 'owner', 'shared')),
    
    -- Performance tracking for this assignment
    total_trips_assigned INTEGER DEFAULT 0,
    total_distance_assigned DECIMAL(10,2) DEFAULT 0.00,
    total_earnings_assigned DECIMAL(12,2) DEFAULT 0.00,
    average_rating_assigned DECIMAL(3,2) DEFAULT 5.00,
    
    -- Status and metadata
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure no overlapping active assignments for same vehicle
    UNIQUE(vehicle_id, assignment_type, valid_from) DEFERRABLE INITIALLY DEFERRED
);

-- =====================================================
-- MAINTENANCE AND SERVICE MANAGEMENT
-- =====================================================

-- Vehicle maintenance schedules and history
CREATE TABLE vehicle_maintenance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Vehicle and maintenance identification
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    maintenance_code VARCHAR(20) NOT NULL UNIQUE, -- Internal tracking code
    work_order_number VARCHAR(30), -- External service center work order
    
    -- Maintenance classification
    maintenance_type VARCHAR(50) NOT NULL, -- 'oil_change', 'tire_rotation', 'brake_service', etc.
    priority maintenance_priority NOT NULL,
    is_scheduled BOOLEAN DEFAULT TRUE, -- FALSE for emergency repairs
    
    -- Service provider information
    service_provider VARCHAR(200), -- Service center/mechanic name
    service_location VARCHAR(500), -- Where maintenance was performed
    service_contact VARCHAR(100), -- Contact information
    
    -- Scheduling and timing
    scheduled_date DATE NOT NULL,
    scheduled_start_time TIME,
    actual_start_time TIMESTAMP WITH TIME ZONE,
    actual_completion_time TIMESTAMP WITH TIME ZONE,
    estimated_duration_hours DECIMAL(4,2), -- Estimated time needed
    actual_duration_hours DECIMAL(4,2), -- Actual time taken
    
    -- Vehicle status during maintenance
    pre_maintenance_odometer_km DECIMAL(10,2),
    post_maintenance_odometer_km DECIMAL(10,2),
    pre_maintenance_condition vehicle_condition,
    post_maintenance_condition vehicle_condition,
    
    -- Maintenance details and parts
    description TEXT NOT NULL,
    work_performed TEXT, -- Detailed work description
    parts_replaced JSONB DEFAULT '[]', -- Array of parts with details
    labor_hours DECIMAL(6,2) DEFAULT 0.00,
    
    -- Cost breakdown (available for all ownership types)
    parts_cost DECIMAL(10,2) DEFAULT 0.00,
    labor_cost DECIMAL(10,2) DEFAULT 0.00,
    other_costs DECIMAL(10,2) DEFAULT 0.00,
    total_cost DECIMAL(10,2) GENERATED ALWAYS AS (parts_cost + labor_cost + other_costs) STORED,
    
    -- Payment and approval
    cost_approved_by UUID REFERENCES users(id),
    paid_by VARCHAR(20) DEFAULT 'owner' CHECK (paid_by IN ('xpress', 'owner', 'driver', 'insurance')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'approved', 'paid', 'rejected')),
    
    -- Quality and follow-up
    quality_rating DECIMAL(3,2) CHECK (quality_rating >= 1.00 AND quality_rating <= 5.00),
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    follow_up_notes TEXT,
    
    -- Documentation
    photos JSONB DEFAULT '[]', -- Before/after photos
    receipts JSONB DEFAULT '[]', -- Receipt images/documents
    warranty_info JSONB DEFAULT '{}', -- Warranty details for work performed
    
    -- Next maintenance scheduling
    next_maintenance_type VARCHAR(50),
    next_maintenance_due_date DATE,
    next_maintenance_due_km DECIMAL(10,2),
    
    -- Compliance and safety
    affects_safety BOOLEAN DEFAULT FALSE,
    affects_compliance BOOLEAN DEFAULT FALSE, -- LTFRB compliance impact
    inspection_passed BOOLEAN,
    inspector_notes TEXT,
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'deferred')),
    cancellation_reason TEXT,
    
    -- Audit information
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Maintenance alerts and notifications
CREATE TABLE maintenance_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Vehicle and alert details
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL, -- 'due_maintenance', 'overdue', 'odometer_based', etc.
    alert_source VARCHAR(20) DEFAULT 'system' CHECK (alert_source IN ('system', 'obd', 'manual', 'telematics')),
    
    -- Alert criteria and triggers
    trigger_condition VARCHAR(100) NOT NULL, -- What triggered the alert
    trigger_value VARCHAR(50), -- Specific value that triggered alert
    current_value VARCHAR(50), -- Current reading
    threshold_value VARCHAR(50), -- Threshold that was crossed
    
    -- Alert messaging
    alert_title VARCHAR(200) NOT NULL,
    alert_description TEXT NOT NULL,
    recommended_action TEXT,
    urgency_level maintenance_priority NOT NULL,
    
    -- Recipients and notification
    notify_driver BOOLEAN DEFAULT TRUE,
    notify_owner BOOLEAN DEFAULT TRUE,
    notify_ops_team BOOLEAN DEFAULT FALSE,
    notification_channels TEXT[] DEFAULT ARRAY['app', 'sms'], -- app, sms, email
    
    -- Alert lifecycle
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'dismissed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledged_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    
    -- Follow-up and escalation
    escalation_level INTEGER DEFAULT 0, -- Number of escalations
    last_escalation_at TIMESTAMP WITH TIME ZONE,
    auto_dismiss_at TIMESTAMP WITH TIME ZONE -- Auto-dismiss time for non-critical alerts
);

-- =====================================================
-- TELEMATICS AND OBD DATA STRUCTURE
-- =====================================================

-- OBD device management and connectivity
CREATE TABLE vehicle_obd_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Device identification
    device_serial VARCHAR(100) NOT NULL UNIQUE,
    device_model VARCHAR(100) NOT NULL,
    manufacturer VARCHAR(100) NOT NULL,
    firmware_version VARCHAR(50),
    
    -- Vehicle assignment
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    installed_date DATE NOT NULL,
    installed_by VARCHAR(200),
    
    -- Device specifications
    supported_protocols TEXT[] DEFAULT '{}', -- OBD protocols supported
    cellular_carrier VARCHAR(50), -- For cellular OBD devices
    data_plan VARCHAR(50),
    monthly_data_cost DECIMAL(8,2),
    
    -- Connection and status
    status obd_status DEFAULT 'not_installed',
    last_connection_at TIMESTAMP WITH TIME ZONE,
    connection_frequency INTEGER DEFAULT 30, -- Seconds between updates
    
    -- Data collection settings
    collect_engine_data BOOLEAN DEFAULT TRUE,
    collect_gps_data BOOLEAN DEFAULT TRUE,
    collect_diagnostic_data BOOLEAN DEFAULT TRUE,
    collect_fuel_data BOOLEAN DEFAULT TRUE,
    data_retention_days INTEGER DEFAULT 90,
    
    -- Performance metrics
    total_data_points BIGINT DEFAULT 0,
    data_accuracy_rate DECIMAL(5,2) DEFAULT 100.00,
    uptime_percentage DECIMAL(5,2) DEFAULT 100.00,
    
    -- Maintenance and support
    last_maintenance_date DATE,
    warranty_expiry_date DATE,
    support_contact VARCHAR(200),
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Real-time OBD telemetry data (partitioned by date for performance)
CREATE TABLE vehicle_telemetry_data (
    id UUID DEFAULT uuid_generate_v4(),
    
    -- Vehicle and device identification
    vehicle_id UUID NOT NULL,
    device_id UUID NOT NULL,
    driver_id UUID, -- Current driver (may be NULL)
    
    -- Location data (from OBD GPS or mobile)
    location GEOMETRY(POINT, 4326),
    speed_kmh DECIMAL(6,2) CHECK (speed_kmh >= 0),
    heading INTEGER CHECK (heading >= 0 AND heading <= 360),
    altitude_meters DECIMAL(8,2),
    gps_accuracy_meters DECIMAL(6,2),
    
    -- Engine performance data
    engine_rpm INTEGER CHECK (engine_rpm >= 0 AND engine_rpm <= 10000),
    engine_load_percent DECIMAL(5,2) CHECK (engine_load_percent >= 0 AND engine_load_percent <= 100),
    throttle_position_percent DECIMAL(5,2) CHECK (throttle_position_percent >= 0 AND throttle_position_percent <= 100),
    engine_temperature_celsius DECIMAL(5,2),
    coolant_temperature_celsius DECIMAL(5,2),
    
    -- Fuel and efficiency data
    fuel_level_percent DECIMAL(5,2) CHECK (fuel_level_percent >= 0 AND fuel_level_percent <= 100),
    instantaneous_fuel_consumption_lph DECIMAL(8,4), -- Liters per hour
    fuel_trim_percent DECIMAL(6,2),
    
    -- Vehicle diagnostics
    battery_voltage DECIMAL(4,2),
    oil_pressure_kpa DECIMAL(6,2),
    intake_air_temperature_celsius DECIMAL(5,2),
    mass_air_flow_gps DECIMAL(8,2), -- Grams per second
    
    -- Driving behavior metrics
    harsh_acceleration_count INTEGER DEFAULT 0,
    harsh_braking_count INTEGER DEFAULT 0,
    harsh_cornering_count INTEGER DEFAULT 0,
    idle_time_minutes DECIMAL(8,2) DEFAULT 0,
    
    -- Environmental data
    ambient_temperature_celsius DECIMAL(5,2),
    humidity_percent DECIMAL(5,2),
    barometric_pressure_kpa DECIMAL(6,2),
    
    -- Diagnostic trouble codes (DTCs)
    active_dtc_codes TEXT[], -- Active diagnostic trouble codes
    pending_dtc_codes TEXT[], -- Pending diagnostic trouble codes
    
    -- Data quality and source
    data_quality_score DECIMAL(3,2) DEFAULT 1.00 CHECK (data_quality_score >= 0 AND data_quality_score <= 1.00),
    data_source VARCHAR(20) DEFAULT 'obd' CHECK (data_source IN ('obd', 'mobile', 'telematics', 'manual')),
    
    -- Timing information
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    recorded_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Partitioning key
    PRIMARY KEY (id, recorded_date)
) PARTITION BY RANGE (recorded_date);

-- Create current month partition for telemetry data
CREATE TABLE vehicle_telemetry_data_current 
    PARTITION OF vehicle_telemetry_data
    FOR VALUES FROM (CURRENT_DATE) TO (CURRENT_DATE + INTERVAL '1 month');

-- Create next month partition for telemetry data  
CREATE TABLE vehicle_telemetry_data_next
    PARTITION OF vehicle_telemetry_data
    FOR VALUES FROM (CURRENT_DATE + INTERVAL '1 month') TO (CURRENT_DATE + INTERVAL '2 months');

-- Vehicle diagnostic events and alerts from OBD
CREATE TABLE vehicle_diagnostic_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Event identification
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    device_id UUID REFERENCES vehicle_obd_devices(id),
    event_code VARCHAR(20) NOT NULL, -- DTC code or custom event code
    
    -- Event details
    event_type VARCHAR(50) NOT NULL, -- 'dtc', 'maintenance_alert', 'performance_alert'
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    event_description TEXT NOT NULL,
    
    -- Location and context when event occurred
    location GEOMETRY(POINT, 4326),
    odometer_km DECIMAL(10,2),
    driver_id UUID REFERENCES drivers(id),
    trip_id UUID, -- Reference to active trip if applicable
    
    -- Technical details
    diagnostic_data JSONB DEFAULT '{}', -- Raw diagnostic data
    recommended_action TEXT,
    affects_safety BOOLEAN DEFAULT FALSE,
    affects_performance BOOLEAN DEFAULT FALSE,
    
    -- Event status and resolution
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'investigating', 'resolved', 'false_positive')),
    acknowledged_by UUID REFERENCES users(id),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    
    -- Related maintenance
    maintenance_required BOOLEAN DEFAULT FALSE,
    related_maintenance_id UUID REFERENCES vehicle_maintenance(id),
    
    -- Timestamps
    first_occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    occurrence_count INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PERFORMANCE METRICS AND ANALYTICS
-- =====================================================

-- Daily vehicle performance aggregations
CREATE TABLE vehicle_performance_daily (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Vehicle and date identification
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    performance_date DATE NOT NULL,
    driver_id UUID REFERENCES drivers(id), -- Primary driver for the day
    
    -- Trip and utilization metrics
    total_trips INTEGER DEFAULT 0,
    completed_trips INTEGER DEFAULT 0,
    cancelled_trips INTEGER DEFAULT 0,
    trip_completion_rate DECIMAL(5,2) DEFAULT 0.00,
    
    -- Time utilization
    total_online_minutes INTEGER DEFAULT 0,
    total_driving_minutes INTEGER DEFAULT 0,
    total_idle_minutes INTEGER DEFAULT 0,
    utilization_rate DECIMAL(5,2) DEFAULT 0.00, -- driving/online time
    
    -- Distance and efficiency
    total_distance_km DECIMAL(10,2) DEFAULT 0.00,
    billable_distance_km DECIMAL(10,2) DEFAULT 0.00,
    empty_distance_km DECIMAL(10,2) DEFAULT 0.00,
    distance_efficiency DECIMAL(5,2) DEFAULT 0.00, -- billable/total distance
    
    -- Fuel consumption and efficiency
    fuel_consumed_liters DECIMAL(8,2) DEFAULT 0.00,
    fuel_efficiency_kmpl DECIMAL(6,2) DEFAULT 0.00,
    fuel_cost_php DECIMAL(10,2) DEFAULT 0.00,
    
    -- Financial performance
    gross_revenue_php DECIMAL(12,2) DEFAULT 0.00,
    net_revenue_php DECIMAL(12,2) DEFAULT 0.00,
    driver_earnings_php DECIMAL(12,2) DEFAULT 0.00,
    vehicle_expenses_php DECIMAL(10,2) DEFAULT 0.00,
    
    -- Quality metrics
    average_trip_rating DECIMAL(3,2),
    customer_complaints INTEGER DEFAULT 0,
    safety_incidents INTEGER DEFAULT 0,
    vehicle_issues INTEGER DEFAULT 0,
    
    -- Environmental metrics
    carbon_emissions_kg DECIMAL(8,2) DEFAULT 0.00,
    eco_score DECIMAL(5,2) DEFAULT 0.00, -- Environmental performance score
    
    -- Maintenance and reliability
    maintenance_alerts_count INTEGER DEFAULT 0,
    diagnostic_events_count INTEGER DEFAULT 0,
    breakdown_incidents INTEGER DEFAULT 0,
    reliability_score DECIMAL(5,2) DEFAULT 100.00,
    
    -- OBD and telematics data quality
    obd_data_points INTEGER DEFAULT 0,
    obd_connection_uptime_percent DECIMAL(5,2) DEFAULT 0.00,
    data_quality_score DECIMAL(5,2) DEFAULT 0.00,
    
    -- Regional performance
    region_id UUID REFERENCES regions(id),
    top_service_areas JSONB DEFAULT '[]', -- Geographic areas with most activity
    
    -- Calculated metrics
    cost_per_kilometer DECIMAL(8,4) DEFAULT 0.00,
    revenue_per_kilometer DECIMAL(8,4) DEFAULT 0.00,
    profitability_score DECIMAL(5,2) DEFAULT 0.00,
    
    -- Audit information
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    calculation_source VARCHAR(20) DEFAULT 'system' CHECK (calculation_source IN ('system', 'manual', 'imported')),
    
    -- Ensure unique daily records per vehicle
    UNIQUE(vehicle_id, performance_date)
);

-- Vehicle utilization and availability tracking
CREATE TABLE vehicle_availability_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Vehicle identification
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    
    -- Availability period
    available_from TIMESTAMP WITH TIME ZONE NOT NULL,
    available_until TIMESTAMP WITH TIME ZONE,
    total_available_minutes INTEGER,
    
    -- Availability type and reason
    availability_type VARCHAR(20) NOT NULL CHECK (availability_type IN ('active', 'maintenance', 'offline', 'repair', 'inspection')),
    unavailability_reason VARCHAR(100), -- Specific reason when not available
    
    -- Location during availability period
    location GEOMETRY(POINT, 4326),
    region_id UUID REFERENCES regions(id),
    service_area_name VARCHAR(100),
    
    -- Driver assignment during period
    assigned_driver_id UUID REFERENCES drivers(id),
    
    -- Performance during availability period
    trips_completed INTEGER DEFAULT 0,
    revenue_generated DECIMAL(10,2) DEFAULT 0.00,
    distance_covered_km DECIMAL(10,2) DEFAULT 0.00,
    
    -- System tracking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    logged_by VARCHAR(20) DEFAULT 'system' CHECK (logged_by IN ('system', 'driver', 'operator', 'admin'))
);

-- Vehicle carbon footprint and environmental impact
CREATE TABLE vehicle_carbon_footprint (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Vehicle and time period
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    calculation_period VARCHAR(20) NOT NULL CHECK (calculation_period IN ('daily', 'weekly', 'monthly', 'yearly')),
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,
    
    -- Carbon emission sources
    fuel_combustion_kg DECIMAL(10,2) DEFAULT 0.00, -- Direct emissions from fuel
    electricity_consumption_kg DECIMAL(10,2) DEFAULT 0.00, -- For electric vehicles
    maintenance_emissions_kg DECIMAL(8,2) DEFAULT 0.00, -- Manufacturing and maintenance
    total_emissions_kg DECIMAL(10,2) GENERATED ALWAYS AS (fuel_combustion_kg + electricity_consumption_kg + maintenance_emissions_kg) STORED,
    
    -- Activity data
    total_distance_km DECIMAL(10,2) NOT NULL,
    fuel_consumed_liters DECIMAL(8,2) DEFAULT 0.00,
    electricity_consumed_kwh DECIMAL(8,2) DEFAULT 0.00,
    
    -- Efficiency metrics
    emissions_per_km DECIMAL(8,4) GENERATED ALWAYS AS (
        CASE WHEN total_distance_km > 0 THEN total_emissions_kg / total_distance_km ELSE 0 END
    ) STORED,
    emissions_per_trip DECIMAL(8,4),
    
    -- Comparative analysis
    industry_average_emissions_kg DECIMAL(10,2), -- Benchmark comparison
    emissions_reduction_percentage DECIMAL(5,2), -- Vs industry average
    
    -- Carbon offset information
    carbon_offset_purchased BOOLEAN DEFAULT FALSE,
    offset_amount_kg DECIMAL(10,2) DEFAULT 0.00,
    offset_cost_php DECIMAL(8,2) DEFAULT 0.00,
    offset_provider VARCHAR(100),
    
    -- Environmental certifications
    environmental_certifications TEXT[] DEFAULT '{}',
    sustainability_score DECIMAL(5,2) DEFAULT 0.00,
    
    -- Calculation metadata
    calculation_method VARCHAR(50) DEFAULT 'standard',
    emission_factors JSONB DEFAULT '{}', -- Factors used in calculation
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    calculated_by VARCHAR(100) DEFAULT 'system',
    
    -- Ensure unique period calculations per vehicle
    UNIQUE(vehicle_id, calculation_period, period_start_date)
);

-- =====================================================
-- LTFRB COMPLIANCE AND REGULATORY TRACKING
-- =====================================================

-- LTFRB compliance and regulatory requirements tracking
CREATE TABLE ltfrb_compliance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Vehicle identification
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    
    -- LTFRB franchise information
    franchise_number VARCHAR(50) NOT NULL,
    franchise_type VARCHAR(30) NOT NULL, -- 'PUV', 'TNVS', 'Delivery', etc.
    franchise_route VARCHAR(200), -- Authorized route
    franchise_issued_date DATE NOT NULL,
    franchise_expiry_date DATE NOT NULL,
    franchise_status VARCHAR(20) DEFAULT 'active' CHECK (franchise_status IN ('active', 'suspended', 'expired', 'revoked')),
    
    -- Vehicle registration compliance
    registration_number VARCHAR(50) NOT NULL,
    registration_type VARCHAR(30) NOT NULL, -- 'Private', 'Commercial', 'Government'
    registration_expiry_date DATE NOT NULL,
    or_cr_expiry_date DATE NOT NULL,
    
    -- Inspection requirements
    last_inspection_date DATE,
    last_inspection_result VARCHAR(20) CHECK (last_inspection_result IN ('passed', 'failed', 'conditional')),
    next_inspection_due_date DATE NOT NULL,
    inspection_center VARCHAR(200),
    inspection_certificate_number VARCHAR(50),
    
    -- Safety and emissions compliance
    roadworthiness_certificate VARCHAR(50),
    roadworthiness_expiry DATE,
    emissions_test_result VARCHAR(20) CHECK (emissions_test_result IN ('passed', 'failed', 'pending')),
    emissions_test_date DATE,
    emissions_certificate_number VARCHAR(50),
    
    -- Insurance compliance
    compulsory_insurance_policy VARCHAR(50), -- CTPL
    compulsory_insurance_expiry DATE NOT NULL,
    comprehensive_insurance_policy VARCHAR(50),
    comprehensive_insurance_expiry DATE,
    
    -- Driver authorization (for TNVS and PUV)
    authorized_drivers UUID[] DEFAULT '{}', -- Array of driver IDs
    driver_authorization_expiry DATE,
    
    -- Compliance status tracking
    overall_compliance_status VARCHAR(20) DEFAULT 'compliant' CHECK (overall_compliance_status IN ('compliant', 'warning', 'non_compliant', 'suspended')),
    compliance_score DECIMAL(5,2) DEFAULT 100.00 CHECK (compliance_score >= 0 AND compliance_score <= 100),
    
    -- Non-compliance issues
    active_violations TEXT[] DEFAULT '{}', -- Current violations
    violation_history JSONB DEFAULT '[]', -- Historical violations
    penalty_points INTEGER DEFAULT 0,
    total_fines_php DECIMAL(10,2) DEFAULT 0.00,
    
    -- Renewal and notification tracking
    renewal_reminder_sent BOOLEAN DEFAULT FALSE,
    renewal_reminder_date DATE,
    auto_renewal_enabled BOOLEAN DEFAULT FALSE,
    
    -- Authority contact information
    ltfrb_office VARCHAR(100), -- Supervising LTFRB office
    lto_office VARCHAR(100), -- LTO office for registration
    
    -- Document storage
    documents JSONB DEFAULT '{}', -- Links to stored compliance documents
    
    -- Audit information
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES users(id),
    
    -- Ensure unique franchise per vehicle
    UNIQUE(vehicle_id, franchise_number)
);

-- Compliance alerts and notifications
CREATE TABLE compliance_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Vehicle and compliance reference
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    compliance_id UUID NOT NULL REFERENCES ltfrb_compliance(id) ON DELETE CASCADE,
    
    -- Alert details
    alert_type VARCHAR(50) NOT NULL, -- 'expiry_warning', 'inspection_due', 'violation_notice'
    alert_category VARCHAR(20) NOT NULL CHECK (alert_category IN ('franchise', 'registration', 'inspection', 'insurance', 'violation')),
    alert_priority maintenance_priority NOT NULL,
    
    -- Alert content
    alert_title VARCHAR(200) NOT NULL,
    alert_message TEXT NOT NULL,
    recommended_action TEXT,
    consequences_if_ignored TEXT,
    
    -- Timing and escalation
    days_until_due INTEGER, -- Days until compliance deadline
    alert_level INTEGER DEFAULT 1, -- Escalation level
    escalation_schedule JSONB DEFAULT '[]', -- When to send follow-ups
    
    -- Recipients
    notify_driver BOOLEAN DEFAULT TRUE,
    notify_vehicle_owner BOOLEAN DEFAULT TRUE,
    notify_fleet_manager BOOLEAN DEFAULT FALSE,
    notify_compliance_team BOOLEAN DEFAULT TRUE,
    
    -- Alert status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'expired')),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledged_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_method VARCHAR(100),
    
    -- System tracking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_sent_at TIMESTAMP WITH TIME ZONE,
    send_count INTEGER DEFAULT 0,
    auto_dismiss_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- COMPREHENSIVE INDEXES FOR QUERY OPTIMIZATION
-- =====================================================

-- Vehicle master table indexes
CREATE INDEX CONCURRENTLY idx_vehicles_ownership_status ON vehicles(ownership_type, status, region_id);
CREATE INDEX CONCURRENTLY idx_vehicles_license_plate ON vehicles(license_plate) WHERE is_active = TRUE;
CREATE INDEX CONCURRENTLY idx_vehicles_service_area ON vehicles USING GIST(primary_service_area) WHERE primary_service_area IS NOT NULL;
CREATE INDEX CONCURRENTLY idx_vehicles_region_active ON vehicles(region_id, is_active, status);
CREATE INDEX CONCURRENTLY idx_vehicles_next_maintenance ON vehicles(next_maintenance_due) WHERE next_maintenance_due IS NOT NULL;
CREATE INDEX CONCURRENTLY idx_vehicles_registration_expiry ON vehicles(registration_expiry) WHERE registration_expiry > CURRENT_DATE - INTERVAL '1 year';

-- Driver assignment indexes
CREATE INDEX CONCURRENTLY idx_vehicle_assignments_vehicle_active ON vehicle_driver_assignments(vehicle_id, is_active, valid_until);
CREATE INDEX CONCURRENTLY idx_vehicle_assignments_driver_active ON vehicle_driver_assignments(driver_id, is_active, assignment_type);
CREATE INDEX CONCURRENTLY idx_vehicle_assignments_validity ON vehicle_driver_assignments(valid_from, valid_until) WHERE is_active = TRUE;

-- Maintenance indexes
CREATE INDEX CONCURRENTLY idx_maintenance_vehicle_date ON vehicle_maintenance(vehicle_id, scheduled_date DESC);
CREATE INDEX CONCURRENTLY idx_maintenance_priority_status ON vehicle_maintenance(priority, status) WHERE status IN ('scheduled', 'in_progress');
CREATE INDEX CONCURRENTLY idx_maintenance_cost_approval ON vehicle_maintenance(payment_status, cost_approved_by) WHERE total_cost > 0;
CREATE INDEX CONCURRENTLY idx_maintenance_alerts_vehicle_status ON maintenance_alerts(vehicle_id, status, urgency_level);

-- OBD and telemetry indexes
CREATE INDEX CONCURRENTLY idx_obd_devices_vehicle_status ON vehicle_obd_devices(vehicle_id, status, last_connection_at);
CREATE INDEX CONCURRENTLY idx_telemetry_vehicle_time ON vehicle_telemetry_data(vehicle_id, recorded_at DESC);
CREATE INDEX CONCURRENTLY idx_telemetry_location ON vehicle_telemetry_data USING GIST(location) WHERE location IS NOT NULL;
CREATE INDEX CONCURRENTLY idx_telemetry_driver_session ON vehicle_telemetry_data(driver_id, recorded_at DESC) WHERE driver_id IS NOT NULL;

-- Diagnostic events indexes
CREATE INDEX CONCURRENTLY idx_diagnostic_events_vehicle_status ON vehicle_diagnostic_events(vehicle_id, status, severity);
CREATE INDEX CONCURRENTLY idx_diagnostic_events_code_time ON vehicle_diagnostic_events(event_code, first_occurred_at DESC);
CREATE INDEX CONCURRENTLY idx_diagnostic_events_safety_critical ON vehicle_diagnostic_events(affects_safety, affects_performance) WHERE affects_safety = TRUE OR affects_performance = TRUE;

-- Performance analytics indexes
CREATE INDEX CONCURRENTLY idx_performance_daily_vehicle_date ON vehicle_performance_daily(vehicle_id, performance_date DESC);
CREATE INDEX CONCURRENTLY idx_performance_daily_region_date ON vehicle_performance_daily(region_id, performance_date DESC);
CREATE INDEX CONCURRENTLY idx_performance_daily_efficiency ON vehicle_performance_daily(fuel_efficiency_kmpl DESC, utilization_rate DESC);

-- Availability tracking indexes
CREATE INDEX CONCURRENTLY idx_availability_vehicle_period ON vehicle_availability_log(vehicle_id, available_from DESC, available_until);
CREATE INDEX CONCURRENTLY idx_availability_type_region ON vehicle_availability_log(availability_type, region_id, available_from DESC);

-- Carbon footprint indexes
CREATE INDEX CONCURRENTLY idx_carbon_footprint_vehicle_period ON vehicle_carbon_footprint(vehicle_id, calculation_period, period_start_date DESC);
CREATE INDEX CONCURRENTLY idx_carbon_emissions_comparison ON vehicle_carbon_footprint(emissions_per_km, sustainability_score DESC);

-- LTFRB compliance indexes
CREATE INDEX CONCURRENTLY idx_ltfrb_compliance_vehicle_status ON ltfrb_compliance(vehicle_id, overall_compliance_status, franchise_expiry_date);
CREATE INDEX CONCURRENTLY idx_ltfrb_franchise_expiry ON ltfrb_compliance(franchise_expiry_date, franchise_status) WHERE franchise_status = 'active';
CREATE INDEX CONCURRENTLY idx_ltfrb_inspection_due ON ltfrb_compliance(next_inspection_due_date, overall_compliance_status) WHERE next_inspection_due_date > CURRENT_DATE;
CREATE INDEX CONCURRENTLY idx_compliance_alerts_vehicle_priority ON compliance_alerts(vehicle_id, alert_priority, status) WHERE status = 'active';

-- =====================================================
-- VIEWS FOR DASHBOARD AND OPERATIONS
-- =====================================================

-- Vehicle dashboard with real-time status
CREATE VIEW v_vehicle_dashboard AS
SELECT 
    v.id,
    v.vehicle_code,
    v.license_plate,
    v.make,
    v.model,
    v.year,
    v.ownership_type,
    v.status,
    v.condition_rating,
    v.region_id,
    r.name as region_name,
    
    -- Current assignment
    vda.driver_id as current_driver_id,
    CONCAT(d.first_name, ' ', d.last_name) as current_driver_name,
    vda.assignment_type,
    
    -- Performance metrics (last 30 days)
    COALESCE(SUM(vpd.total_trips), 0) as total_trips_30d,
    COALESCE(AVG(vpd.utilization_rate), 0) as avg_utilization_30d,
    COALESCE(AVG(vpd.fuel_efficiency_kmpl), 0) as avg_fuel_efficiency_30d,
    COALESCE(SUM(vpd.gross_revenue_php), 0) as total_revenue_30d,
    
    -- Maintenance status
    v.next_maintenance_due,
    CASE 
        WHEN v.next_maintenance_due <= CURRENT_DATE THEN 'overdue'
        WHEN v.next_maintenance_due <= CURRENT_DATE + INTERVAL '7 days' THEN 'due_soon'
        ELSE 'current'
    END as maintenance_status,
    
    -- Active alerts count
    COALESCE(alert_counts.maintenance_alerts, 0) as active_maintenance_alerts,
    COALESCE(alert_counts.compliance_alerts, 0) as active_compliance_alerts,
    
    -- OBD status
    obd.status as obd_status,
    obd.last_connection_at as obd_last_connection,
    
    -- Compliance status
    lc.overall_compliance_status,
    lc.franchise_expiry_date,
    
    -- Last activity
    v.updated_at as last_updated
    
FROM vehicles v
JOIN regions r ON v.region_id = r.id
LEFT JOIN vehicle_driver_assignments vda ON v.id = vda.vehicle_id 
    AND vda.is_active = TRUE AND vda.assignment_type = 'primary'
    AND (vda.valid_until IS NULL OR vda.valid_until > NOW())
LEFT JOIN drivers d ON vda.driver_id = d.id
LEFT JOIN vehicle_performance_daily vpd ON v.id = vpd.vehicle_id 
    AND vpd.performance_date >= CURRENT_DATE - INTERVAL '30 days'
LEFT JOIN vehicle_obd_devices obd ON v.id = obd.vehicle_id AND obd.is_active = TRUE
LEFT JOIN ltfrb_compliance lc ON v.id = lc.vehicle_id
LEFT JOIN (
    SELECT 
        vehicle_id,
        COUNT(*) FILTER (WHERE alert_type LIKE '%maintenance%') as maintenance_alerts,
        COUNT(*) FILTER (WHERE alert_type LIKE '%compliance%') as compliance_alerts
    FROM (
        SELECT vehicle_id, 'maintenance' as alert_type FROM maintenance_alerts WHERE status = 'active'
        UNION ALL
        SELECT vehicle_id, 'compliance' as alert_type FROM compliance_alerts WHERE status = 'active'
    ) all_alerts
    GROUP BY vehicle_id
) alert_counts ON v.id = alert_counts.vehicle_id
WHERE v.is_active = TRUE
GROUP BY v.id, v.vehicle_code, v.license_plate, v.make, v.model, v.year, v.ownership_type, 
         v.status, v.condition_rating, v.region_id, r.name, vda.driver_id, d.first_name, 
         d.last_name, vda.assignment_type, v.next_maintenance_due, alert_counts.maintenance_alerts,
         alert_counts.compliance_alerts, obd.status, obd.last_connection_at, 
         lc.overall_compliance_status, lc.franchise_expiry_date, v.updated_at;

-- Vehicle maintenance summary view
CREATE VIEW v_maintenance_summary AS
SELECT 
    v.id as vehicle_id,
    v.vehicle_code,
    v.license_plate,
    v.make,
    v.model,
    
    -- Maintenance schedule status
    v.next_maintenance_due,
    CASE 
        WHEN v.next_maintenance_due <= CURRENT_DATE THEN 'overdue'
        WHEN v.next_maintenance_due <= CURRENT_DATE + INTERVAL '7 days' THEN 'due_soon'
        WHEN v.next_maintenance_due <= CURRENT_DATE + INTERVAL '30 days' THEN 'upcoming'
        ELSE 'current'
    END as maintenance_status,
    
    -- Recent maintenance history (last 6 months)
    COUNT(vm.id) as maintenance_count_6m,
    SUM(vm.total_cost) as maintenance_cost_6m,
    AVG(vm.total_cost) as avg_maintenance_cost,
    
    -- Last maintenance details
    MAX(vm.actual_completion_time) as last_maintenance_date,
    maintenance_latest.maintenance_type as last_maintenance_type,
    maintenance_latest.total_cost as last_maintenance_cost,
    
    -- Active alerts
    COUNT(ma.id) as active_alerts,
    MAX(ma.urgency_level::text) as highest_alert_priority,
    
    -- Cost analysis
    CASE 
        WHEN COUNT(vm.id) > 0 THEN SUM(vm.total_cost) / COUNT(vm.id)
        ELSE 0
    END as avg_cost_per_service,
    
    v.total_maintenance_cost as lifetime_maintenance_cost
    
FROM vehicles v
LEFT JOIN vehicle_maintenance vm ON v.id = vm.vehicle_id 
    AND vm.actual_completion_time >= NOW() - INTERVAL '6 months'
    AND vm.status = 'completed'
LEFT JOIN maintenance_alerts ma ON v.id = ma.vehicle_id AND ma.status = 'active'
LEFT JOIN LATERAL (
    SELECT maintenance_type, total_cost
    FROM vehicle_maintenance
    WHERE vehicle_id = v.id AND status = 'completed'
    ORDER BY actual_completion_time DESC
    LIMIT 1
) maintenance_latest ON TRUE
WHERE v.is_active = TRUE
GROUP BY v.id, v.vehicle_code, v.license_plate, v.make, v.model, v.next_maintenance_due,
         v.total_maintenance_cost, maintenance_latest.maintenance_type, maintenance_latest.total_cost;

-- =====================================================
-- TRIGGERS AND AUTOMATION FUNCTIONS
-- =====================================================

-- Function to update vehicle performance when telemetry data is inserted
CREATE OR REPLACE FUNCTION update_vehicle_performance_from_telemetry()
RETURNS TRIGGER AS $$
DECLARE
    daily_record_exists BOOLEAN;
BEGIN
    -- Check if daily performance record exists for this vehicle and date
    SELECT EXISTS(
        SELECT 1 FROM vehicle_performance_daily 
        WHERE vehicle_id = NEW.vehicle_id 
        AND performance_date = NEW.recorded_date
    ) INTO daily_record_exists;
    
    -- Create or update daily performance record
    INSERT INTO vehicle_performance_daily (vehicle_id, performance_date, driver_id)
    VALUES (NEW.vehicle_id, NEW.recorded_date, NEW.driver_id)
    ON CONFLICT (vehicle_id, performance_date) DO UPDATE SET
        obd_data_points = vehicle_performance_daily.obd_data_points + 1,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for telemetry performance updates
CREATE TRIGGER tr_telemetry_performance_update
    AFTER INSERT ON vehicle_telemetry_data
    FOR EACH ROW
    EXECUTE FUNCTION update_vehicle_performance_from_telemetry();

-- Function to automatically create maintenance alerts based on conditions
CREATE OR REPLACE FUNCTION check_maintenance_alerts()
RETURNS TRIGGER AS $$
BEGIN
    -- Check for overdue maintenance
    IF NEW.next_maintenance_due <= CURRENT_DATE AND OLD.next_maintenance_due > CURRENT_DATE THEN
        INSERT INTO maintenance_alerts (
            vehicle_id, alert_type, alert_title, alert_description, 
            urgency_level, recommended_action
        ) VALUES (
            NEW.id, 
            'overdue_maintenance',
            'Vehicle Maintenance Overdue',
            'Vehicle ' || NEW.vehicle_code || ' has overdue maintenance scheduled for ' || NEW.next_maintenance_due,
            'urgent',
            'Schedule maintenance immediately to avoid service disruption'
        );
    END IF;
    
    -- Check for low condition rating
    IF NEW.condition_score < 60.0 AND (OLD.condition_score >= 60.0 OR OLD.condition_score IS NULL) THEN
        INSERT INTO maintenance_alerts (
            vehicle_id, alert_type, alert_title, alert_description,
            urgency_level, recommended_action
        ) VALUES (
            NEW.id,
            'low_condition_score', 
            'Vehicle Condition Critical',
            'Vehicle ' || NEW.vehicle_code || ' condition score has dropped to ' || NEW.condition_score || '%',
            'major',
            'Inspect vehicle and address condition issues'
        );
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for automatic maintenance alerts
CREATE TRIGGER tr_vehicle_maintenance_alerts
    AFTER UPDATE ON vehicles
    FOR EACH ROW
    EXECUTE FUNCTION check_maintenance_alerts();

-- Function to update vehicle availability log when status changes
CREATE OR REPLACE FUNCTION log_vehicle_availability()
RETURNS TRIGGER AS $$
BEGIN
    -- Close previous availability period when status changes
    IF OLD.status != NEW.status THEN
        UPDATE vehicle_availability_log 
        SET available_until = NOW(),
            total_available_minutes = EXTRACT(EPOCH FROM (NOW() - available_from))/60
        WHERE vehicle_id = NEW.id 
        AND available_until IS NULL;
        
        -- Start new availability period
        INSERT INTO vehicle_availability_log (
            vehicle_id, availability_type, available_from
        ) VALUES (
            NEW.id,
            CASE 
                WHEN NEW.status = 'active' THEN 'active'
                WHEN NEW.status = 'maintenance' THEN 'maintenance'
                WHEN NEW.status = 'inspection' THEN 'inspection'
                ELSE 'offline'
            END,
            NOW()
        );
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for vehicle availability logging
CREATE TRIGGER tr_vehicle_availability_log
    AFTER UPDATE ON vehicles
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION log_vehicle_availability();

-- =====================================================
-- DATA CLEANUP AND MAINTENANCE FUNCTIONS
-- =====================================================

-- Function to cleanup old telemetry data (keep only specified retention period)
CREATE OR REPLACE FUNCTION cleanup_old_telemetry_data(retention_days INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
    cutoff_date DATE;
BEGIN
    cutoff_date := CURRENT_DATE - retention_days;
    
    -- Delete old telemetry data
    DELETE FROM vehicle_telemetry_data 
    WHERE recorded_date < cutoff_date;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log cleanup activity
    INSERT INTO system_logs (level, message, metadata, created_at)
    VALUES ('INFO', 'Telemetry data cleanup completed', 
            jsonb_build_object(
                'deletedRecords', deleted_count,
                'cutoffDate', cutoff_date,
                'retentionDays', retention_days
            ), NOW());
    
    RETURN deleted_count;
END;
$$ language 'plpgsql';

-- Function to archive old maintenance records
CREATE OR REPLACE FUNCTION archive_old_maintenance_records(archive_after_months INTEGER DEFAULT 24)
RETURNS INTEGER AS $$
DECLARE
    archived_count INTEGER;
BEGIN
    -- Create archive table if it doesn't exist
    CREATE TABLE IF NOT EXISTS vehicle_maintenance_archive (LIKE vehicle_maintenance INCLUDING ALL);
    
    -- Move old maintenance records to archive
    WITH moved_records AS (
        DELETE FROM vehicle_maintenance 
        WHERE status = 'completed' 
        AND actual_completion_time < NOW() - (archive_after_months || ' months')::INTERVAL
        RETURNING *
    )
    INSERT INTO vehicle_maintenance_archive SELECT * FROM moved_records;
    
    GET DIAGNOSTICS archived_count = ROW_COUNT;
    
    -- Log archival activity
    INSERT INTO system_logs (level, message, metadata, created_at)
    VALUES ('INFO', 'Maintenance records archival completed', 
            jsonb_build_object('archivedRecords', archived_count), NOW());
    
    RETURN archived_count;
END;
$$ language 'plpgsql';

-- =====================================================
-- INITIAL DATA AND CONFIGURATION
-- =====================================================

-- Insert sample vehicle data for testing (remove in production)
INSERT INTO vehicles (
    vehicle_code, license_plate, make, model, year, color, category, fuel_type,
    ownership_type, seating_capacity, region_id, service_types, status,
    registration_expiry, insurance_expiry
) VALUES 
('XOT-001', 'ABC123', 'Toyota', 'Vios', 2020, 'White', 'sedan', 'gasoline',
 'xpress_owned', 4, (SELECT id FROM regions WHERE code = 'MMD' LIMIT 1), 
 ARRAY['ride_4w']::service_type[], 'active', '2025-12-31', '2025-06-30'),

('XOT-002', 'DEF456', 'Honda', 'City', 2021, 'Silver', 'sedan', 'gasoline',
 'fleet_owned', 4, (SELECT id FROM regions WHERE code = 'CEB' LIMIT 1),
 ARRAY['ride_4w']::service_type[], 'active', '2025-11-30', '2025-08-15'),

('XOT-003', 'GHI789', 'Suzuki', 'Ertiga', 2019, 'Black', 'mpv', 'gasoline',
 'operator_owned', 7, (SELECT id FROM regions WHERE code = 'DAV' LIMIT 1),
 ARRAY['ride_4w']::service_type[], 'active', '2025-10-15', '2025-09-30')
ON CONFLICT (vehicle_code) DO NOTHING;

-- =====================================================
-- COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON TABLE vehicles IS 'Master vehicle registry supporting 4 ownership models with differentiated data access';
COMMENT ON TABLE vehicle_driver_assignments IS 'Driver-vehicle assignments with rental terms and performance tracking';
COMMENT ON TABLE vehicle_maintenance IS 'Comprehensive maintenance tracking with cost management and quality control';
COMMENT ON TABLE maintenance_alerts IS 'Automated maintenance alerts and notifications system';
COMMENT ON TABLE vehicle_obd_devices IS 'OBD device management and connectivity tracking';
COMMENT ON TABLE vehicle_telemetry_data IS 'Real-time vehicle telemetry data partitioned by date for performance';
COMMENT ON TABLE vehicle_diagnostic_events IS 'Vehicle diagnostic events and alerts from OBD systems';
COMMENT ON TABLE vehicle_performance_daily IS 'Daily vehicle performance metrics and analytics';
COMMENT ON TABLE vehicle_availability_log IS 'Vehicle availability and utilization tracking';
COMMENT ON TABLE vehicle_carbon_footprint IS 'Environmental impact and carbon emissions tracking';
COMMENT ON TABLE ltfrb_compliance IS 'LTFRB compliance and regulatory requirements for Philippines operations';
COMMENT ON TABLE compliance_alerts IS 'Compliance alerts and regulatory notifications';

COMMENT ON COLUMN vehicles.ownership_type IS 'Determines data availability: xpress_owned (full), fleet_owned (optional OBD), operator_owned (basic+OBD), driver_owned (minimal)';
COMMENT ON COLUMN vehicles.condition_score IS 'Overall vehicle condition score (0-100%) calculated from multiple factors';
COMMENT ON COLUMN vehicle_telemetry_data.recorded_date IS 'Partition key for performance optimization';
COMMENT ON COLUMN ltfrb_compliance.franchise_number IS 'LTFRB franchise number required for commercial vehicle operation in Philippines';

-- Update migration record
UPDATE schema_migrations 
SET executed_at = NOW()
WHERE version = '045';

-- Log successful migration
INSERT INTO system_logs (level, message, metadata, created_at)
VALUES ('INFO', 'Vehicle management comprehensive schema migration completed', 
        jsonb_build_object(
            'migration', '045',
            'tablesCreated', 12,
            'viewsCreated', 2,
            'indexesCreated', 25,
            'triggersCreated', 3
        ), NOW());

COMMIT;