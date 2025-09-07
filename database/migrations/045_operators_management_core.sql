-- =====================================================
-- OPERATORS MANAGEMENT SYSTEM - CORE SCHEMA
-- Migration 045: Core operator management tables
-- Supports TNVS (max 3), General (max 10), Fleet (unlimited) operators
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUMS AND TYPES
-- =====================================================

-- Operator type classifications
CREATE TYPE operator_type AS ENUM (
    'tnvs',              -- Transport Network Vehicle Service (max 3 vehicles)
    'general',           -- General operator (max 10 vehicles)  
    'fleet'              -- Fleet operator (unlimited vehicles)
);

-- Operator status types
CREATE TYPE operator_status AS ENUM (
    'active',            -- Actively operating
    'inactive',          -- Temporarily inactive
    'suspended',         -- Administratively suspended
    'pending_approval',  -- Awaiting regulatory approval
    'under_review',      -- Under compliance review
    'decommissioned'     -- Permanently deactivated
);

-- Performance tier levels (affects commission rates)
CREATE TYPE commission_tier AS ENUM (
    'tier_1',            -- 1% commission (70-79 score, 6+ months)
    'tier_2',            -- 2% commission (80-89 score, 12+ months)
    'tier_3'             -- 3% commission (90+ score, 18+ months)
);

-- Location types for multi-location operators
CREATE TYPE location_type AS ENUM (
    'headquarters',      -- Main office/headquarters
    'branch',           -- Branch office
    'garage',           -- Vehicle maintenance facility
    'terminal'          -- Passenger terminal/hub
);

-- =====================================================
-- CORE OPERATOR TABLES
-- =====================================================

-- Main operators table
CREATE TABLE operators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic operator information
    operator_code VARCHAR(20) NOT NULL UNIQUE, -- TNVS001, GEN042, FLT015, etc.
    business_name VARCHAR(200) NOT NULL,
    legal_name VARCHAR(200) NOT NULL,
    trade_name VARCHAR(200),
    
    -- Operator classification
    operator_type operator_type NOT NULL,
    status operator_status DEFAULT 'pending_approval',
    
    -- Contact information
    primary_contact JSONB NOT NULL, -- {name, phone, email, position}
    business_address JSONB NOT NULL, -- Full address with coordinates
    mailing_address JSONB, -- If different from business address
    
    -- Regulatory information
    business_registration_number VARCHAR(50) NOT NULL,
    tin VARCHAR(20),
    sec_registration VARCHAR(50),
    ltfrb_authority_number VARCHAR(50), -- For TNVS operators
    lto_accreditation VARCHAR(50),
    
    -- Regional operations
    primary_region_id UUID NOT NULL REFERENCES regions(id),
    allowed_regions UUID[] DEFAULT '{}', -- Additional regions where operator can work
    
    -- Vehicle limits based on operator type
    max_vehicles INTEGER NOT NULL,
    current_vehicle_count INTEGER DEFAULT 0,
    
    -- Performance metrics
    performance_score DECIMAL(5,2) DEFAULT 0.00, -- 0-100 points
    commission_tier commission_tier DEFAULT 'tier_1',
    tier_qualification_date DATE,
    
    -- Financial information
    wallet_balance DECIMAL(12,2) DEFAULT 0.00,
    earnings_today DECIMAL(12,2) DEFAULT 0.00,
    earnings_week DECIMAL(12,2) DEFAULT 0.00,
    earnings_month DECIMAL(12,2) DEFAULT 0.00,
    total_commissions_earned DECIMAL(15,2) DEFAULT 0.00,
    
    -- Insurance and compliance
    insurance_details JSONB DEFAULT '{}', -- Policy numbers, coverage, expiry
    certifications JSONB DEFAULT '[]', -- Various certifications and their expiry dates
    compliance_documents JSONB DEFAULT '{}', -- Document references and expiry dates
    
    -- Operational settings
    operational_hours JSONB DEFAULT '{"start": "05:00", "end": "23:00"}',
    service_areas JSONB DEFAULT '[]', -- Specific service area restrictions
    special_permissions JSONB DEFAULT '{}', -- Airport access, special routes, etc.
    
    -- Partnership information
    user_id UUID REFERENCES users(id), -- Link to user account for login
    assigned_account_manager UUID REFERENCES users(id),
    partnership_start_date DATE NOT NULL,
    partnership_end_date DATE, -- For contract renewals
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Constraints
    CONSTRAINT operators_score_range CHECK (performance_score >= 0.00 AND performance_score <= 100.00),
    CONSTRAINT operators_vehicle_limits CHECK (
        (operator_type = 'tnvs' AND max_vehicles <= 3) OR
        (operator_type = 'general' AND max_vehicles <= 10) OR
        (operator_type = 'fleet' AND max_vehicles >= 0)
    ),
    CONSTRAINT operators_vehicle_count_check CHECK (current_vehicle_count <= max_vehicles),
    CONSTRAINT operators_partnership_dates CHECK (
        partnership_end_date IS NULL OR partnership_end_date > partnership_start_date
    )
);

-- Operator locations for multi-location operators
CREATE TABLE operator_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
    
    -- Location details
    location_type location_type NOT NULL,
    name VARCHAR(100) NOT NULL,
    address JSONB NOT NULL, -- Full address with coordinates
    contact_info JSONB DEFAULT '{}', -- Local contact information
    
    -- Geospatial data
    location GEOMETRY(POINT, 4326),
    coverage_area GEOMETRY(POLYGON, 4326), -- Service coverage from this location
    
    -- Operational information
    operating_hours JSONB DEFAULT '{"start": "05:00", "end": "23:00"}',
    capacity_vehicles INTEGER DEFAULT 0, -- How many vehicles can operate from here
    current_vehicles INTEGER DEFAULT 0,
    
    -- Regional compliance
    region_id UUID NOT NULL REFERENCES regions(id),
    local_permits JSONB DEFAULT '{}', -- Location-specific permits
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    activated_at TIMESTAMP WITH TIME ZONE,
    deactivated_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT op_locations_capacity CHECK (current_vehicles <= capacity_vehicles)
);

-- Operator-Driver relationships (fleet management)
CREATE TABLE operator_drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    
    -- Assignment details
    assignment_type VARCHAR(20) DEFAULT 'employed', -- employed, contracted, partner
    employment_status VARCHAR(20) DEFAULT 'active', -- active, suspended, terminated
    
    -- Contract information
    contract_start_date DATE NOT NULL,
    contract_end_date DATE, -- NULL for permanent employment
    contract_details JSONB DEFAULT '{}',
    
    -- Performance tracking
    driver_performance_score DECIMAL(5,2) DEFAULT 0.00,
    disciplinary_records JSONB DEFAULT '[]',
    incentive_eligibility BOOLEAN DEFAULT TRUE,
    
    -- Location assignment (for multi-location operators)
    assigned_location_id UUID REFERENCES operator_locations(id),
    home_base_location GEOMETRY(POINT, 4326),
    
    -- Metadata
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Constraints
    UNIQUE(operator_id, driver_id, contract_start_date),
    CONSTRAINT op_drivers_score_range CHECK (driver_performance_score >= 0.00 AND driver_performance_score <= 100.00),
    CONSTRAINT op_drivers_contract_dates CHECK (
        contract_end_date IS NULL OR contract_end_date > contract_start_date
    )
);

-- Operator-Vehicle relationships
CREATE TABLE operator_vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
    
    -- Vehicle identification (referencing existing driver vehicle_info or separate vehicles table)
    vehicle_plate_number VARCHAR(20) NOT NULL,
    vehicle_info JSONB NOT NULL, -- Make, model, year, color, etc.
    
    -- Vehicle classification
    service_type service_type NOT NULL, -- From existing enum: ride_4w, ride_2w, etc.
    vehicle_category VARCHAR(50), -- sedan, suv, motorcycle, van, etc.
    seating_capacity INTEGER,
    
    -- Registration and compliance
    or_number VARCHAR(50), -- Official Receipt number
    cr_number VARCHAR(50), -- Certificate of Registration number
    ltfrb_registration VARCHAR(50), -- LTFRB vehicle registration
    insurance_policy JSONB DEFAULT '{}',
    
    -- Vehicle status and assignment
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, maintenance, retired
    assigned_driver_id UUID REFERENCES drivers(id),
    assigned_location_id UUID REFERENCES operator_locations(id),
    
    -- Maintenance and inspection
    last_maintenance_date DATE,
    next_maintenance_due DATE,
    last_inspection_date DATE,
    next_inspection_due DATE,
    maintenance_records JSONB DEFAULT '[]',
    
    -- Financial information
    acquisition_cost DECIMAL(12,2),
    acquisition_date DATE,
    depreciation_rate DECIMAL(5,2),
    current_value DECIMAL(12,2),
    
    -- Metadata
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    registered_by UUID REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    
    CONSTRAINT op_vehicles_capacity CHECK (seating_capacity > 0)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Operator lookups and filtering
CREATE INDEX CONCURRENTLY idx_operators_code ON operators(operator_code) WHERE is_active = TRUE;
CREATE INDEX CONCURRENTLY idx_operators_type_status ON operators(operator_type, status);
CREATE INDEX CONCURRENTLY idx_operators_region ON operators(primary_region_id, status);
CREATE INDEX CONCURRENTLY idx_operators_regions ON operators USING GIN(allowed_regions);
CREATE INDEX CONCURRENTLY idx_operators_score_tier ON operators(performance_score DESC, commission_tier);
CREATE INDEX CONCURRENTLY idx_operators_user ON operators(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX CONCURRENTLY idx_operators_manager ON operators(assigned_account_manager) WHERE assigned_account_manager IS NOT NULL;

-- Operator locations
CREATE INDEX CONCURRENTLY idx_op_locations_operator ON operator_locations(operator_id, is_active);
CREATE INDEX CONCURRENTLY idx_op_locations_region ON operator_locations(region_id, location_type);
CREATE INDEX CONCURRENTLY idx_op_locations_spatial ON operator_locations USING GIST(location) WHERE is_active = TRUE;
CREATE INDEX CONCURRENTLY idx_op_locations_coverage ON operator_locations USING GIST(coverage_area) WHERE coverage_area IS NOT NULL;

-- Fleet management relationships
CREATE INDEX CONCURRENTLY idx_op_drivers_operator ON operator_drivers(operator_id, is_active, employment_status);
CREATE INDEX CONCURRENTLY idx_op_drivers_driver ON operator_drivers(driver_id, is_active);
CREATE INDEX CONCURRENTLY idx_op_drivers_location ON operator_drivers(assigned_location_id) WHERE assigned_location_id IS NOT NULL;
CREATE INDEX CONCURRENTLY idx_op_drivers_score ON operator_drivers(operator_id, driver_performance_score DESC);

CREATE INDEX CONCURRENTLY idx_op_vehicles_operator ON operator_vehicles(operator_id, is_active, status);
CREATE INDEX CONCURRENTLY idx_op_vehicles_plate ON operator_vehicles(vehicle_plate_number) WHERE is_active = TRUE;
CREATE INDEX CONCURRENTLY idx_op_vehicles_driver ON operator_vehicles(assigned_driver_id) WHERE assigned_driver_id IS NOT NULL;
CREATE INDEX CONCURRENTLY idx_op_vehicles_location ON operator_vehicles(assigned_location_id) WHERE assigned_location_id IS NOT NULL;
CREATE INDEX CONCURRENTLY idx_op_vehicles_service ON operator_vehicles(service_type, vehicle_category, status);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Apply updated_at triggers
CREATE TRIGGER tr_operators_updated_at BEFORE UPDATE ON operators FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_operator_locations_updated_at BEFORE UPDATE ON operator_locations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_operator_drivers_updated_at BEFORE UPDATE ON operator_drivers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_operator_vehicles_updated_at BEFORE UPDATE ON operator_vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- INITIAL FUNCTIONS
-- =====================================================

-- Function to update operator vehicle count when vehicles are added/removed
CREATE OR REPLACE FUNCTION update_operator_vehicle_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.is_active = TRUE THEN
        UPDATE operators 
        SET current_vehicle_count = current_vehicle_count + 1 
        WHERE id = NEW.operator_id;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Vehicle activated
        IF OLD.is_active = FALSE AND NEW.is_active = TRUE THEN
            UPDATE operators 
            SET current_vehicle_count = current_vehicle_count + 1 
            WHERE id = NEW.operator_id;
        -- Vehicle deactivated
        ELSIF OLD.is_active = TRUE AND NEW.is_active = FALSE THEN
            UPDATE operators 
            SET current_vehicle_count = current_vehicle_count - 1 
            WHERE id = NEW.operator_id;
        END IF;
    ELSIF TG_OP = 'DELETE' AND OLD.is_active = TRUE THEN
        UPDATE operators 
        SET current_vehicle_count = current_vehicle_count - 1 
        WHERE id = OLD.operator_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Apply vehicle count trigger
CREATE TRIGGER tr_update_vehicle_count 
    AFTER INSERT OR UPDATE OR DELETE ON operator_vehicles 
    FOR EACH ROW EXECUTE FUNCTION update_operator_vehicle_count();

-- Function to validate operator type vehicle limits
CREATE OR REPLACE FUNCTION validate_operator_vehicle_limit()
RETURNS TRIGGER AS $$
DECLARE
    op_type operator_type;
    max_allowed INTEGER;
    current_count INTEGER;
BEGIN
    SELECT operator_type, max_vehicles INTO op_type, max_allowed
    FROM operators WHERE id = NEW.operator_id;
    
    SELECT COUNT(*) INTO current_count
    FROM operator_vehicles WHERE operator_id = NEW.operator_id AND is_active = TRUE;
    
    -- Check limits for TNVS and General operators
    IF (op_type = 'tnvs' AND current_count >= 3) OR 
       (op_type = 'general' AND current_count >= 10) THEN
        RAISE EXCEPTION 'Operator % has reached maximum vehicle limit of % for type %', 
            NEW.operator_id, max_allowed, op_type;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply vehicle limit validation trigger
CREATE TRIGGER tr_validate_vehicle_limit 
    BEFORE INSERT ON operator_vehicles 
    FOR EACH ROW EXECUTE FUNCTION validate_operator_vehicle_limit();

-- =====================================================
-- COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON TABLE operators IS 'Core operator management table supporting TNVS, General, and Fleet operator types';
COMMENT ON TABLE operator_locations IS 'Multi-location support for larger operators with branch offices and terminals';
COMMENT ON TABLE operator_drivers IS 'Fleet management linking operators to their employed/contracted drivers';
COMMENT ON TABLE operator_vehicles IS 'Vehicle fleet management with compliance and maintenance tracking';

COMMENT ON COLUMN operators.performance_score IS 'Calculated score (0-100) based on utilization, compliance, safety, and platform contribution';
COMMENT ON COLUMN operators.commission_tier IS 'Commission tier (1%, 2%, 3%) based on performance and tenure requirements';
COMMENT ON COLUMN operators.max_vehicles IS 'Vehicle limit: TNVS=3, General=10, Fleet=unlimited';
COMMENT ON COLUMN operator_drivers.assignment_type IS 'Employment relationship: employed (W-2), contracted (1099), partner (revenue share)';
COMMENT ON COLUMN operator_vehicles.vehicle_info IS 'Complete vehicle details: make, model, year, color, VIN, engine, etc.';