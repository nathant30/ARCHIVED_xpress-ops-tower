-- =====================================================
-- VEHICLE MANAGEMENT SQLITE SCHEMA v1.0
-- Xpress Ops Tower Platform - SQLite Compatible Version
-- Migration 045: Complete vehicle lifecycle management
-- Supports 4 ownership models with differentiated data access
-- =====================================================

-- Ensure regions table exists
CREATE TABLE IF NOT EXISTS regions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE
);

-- Insert default regions if they don't exist
INSERT OR IGNORE INTO regions (id, name, code) VALUES 
('region-manila', 'Metro Manila', 'MMD'),
('region-cebu', 'Cebu', 'CEB'),
('region-davao', 'Davao', 'DAV');

-- Master vehicle registry with ownership-based data structure
CREATE TABLE IF NOT EXISTS vehicles (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    
    -- Basic vehicle identification
    vehicle_code TEXT NOT NULL UNIQUE, -- Internal tracking code
    license_plate TEXT NOT NULL UNIQUE,
    vin TEXT, -- Vehicle Identification Number (when available)
    
    -- Vehicle specifications
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER NOT NULL CHECK (year >= 1990 AND year <= 2026),
    color TEXT NOT NULL,
    category TEXT NOT NULL, -- 'sedan', 'hatchback', 'suv', 'mpv', 'van', 'motorcycle', etc.
    fuel_type TEXT NOT NULL, -- 'gasoline', 'diesel', 'lpg', 'electric', 'hybrid_gas', 'hybrid_diesel'
    
    -- Engine and capacity details
    engine_displacement INTEGER, -- cc displacement
    seating_capacity INTEGER NOT NULL CHECK (seating_capacity >= 1 AND seating_capacity <= 50),
    cargo_capacity_kg INTEGER, -- Cargo capacity in kg
    
    -- Ownership model (determines data availability)
    ownership_type TEXT NOT NULL, -- 'xpress_owned', 'fleet_owned', 'operator_owned', 'driver_owned'
    fleet_owner_name TEXT, -- For fleet_owned vehicles
    operator_owner_name TEXT, -- For operator_owned vehicles
    
    -- Status and condition
    status TEXT DEFAULT 'inactive', -- 'active', 'in_service', 'maintenance', 'inspection', 'inactive', 'decommissioned', 'impounded'
    condition_rating TEXT DEFAULT 'good', -- 'excellent', 'good', 'fair', 'poor', 'critical'
    condition_score DECIMAL(5,2) DEFAULT 75.00 CHECK (condition_score >= 0 AND condition_score <= 100),
    
    -- Regional assignment
    region_id TEXT NOT NULL REFERENCES regions(id),
    
    -- Financial information (varies by ownership type)
    acquisition_cost DECIMAL(12,2), -- Only for xpress_owned
    current_market_value DECIMAL(12,2),
    monthly_depreciation DECIMAL(10,2),
    insurance_value DECIMAL(12,2),
    
    -- Registration and compliance (Philippines-specific)
    or_number TEXT, -- Official Receipt number
    cr_number TEXT, -- Certificate of Registration number  
    registration_expiry TEXT NOT NULL, -- ISO date string
    ltfrb_franchise_number TEXT, -- LTFRB franchise for commercial vehicles
    ltfrb_franchise_expiry TEXT, -- ISO date string
    
    -- Insurance information
    insurance_provider TEXT,
    insurance_policy_number TEXT,
    insurance_expiry TEXT, -- ISO date string
    insurance_coverage_amount DECIMAL(12,2),
    
    -- OBD and telematics capability
    obd_device_installed INTEGER DEFAULT 0, -- 0 or 1 (boolean)
    obd_device_serial TEXT,
    telematics_provider TEXT, -- Provider name (e.g., "Fleet Complete", "Geotab")
    telematics_plan TEXT,
    
    -- Service capabilities based on vehicle type
    service_types TEXT NOT NULL, -- JSON array of service types
    max_trip_distance_km INTEGER DEFAULT 100, -- Maximum single trip distance
    
    -- Maintenance tracking
    last_maintenance_date TEXT, -- ISO date string
    next_maintenance_due TEXT, -- ISO date string
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
    emergency_contacts TEXT DEFAULT '[]', -- JSON array of emergency contact information
    safety_features TEXT DEFAULT '{}', -- JSON object of safety equipment and features
    accident_count INTEGER DEFAULT 0,
    
    -- Audit and tracking
    created_at TEXT DEFAULT '2024-09-06 10:00:00',
    updated_at TEXT DEFAULT '2024-09-06 10:00:00',
    created_by TEXT,
    updated_by TEXT,
    is_active INTEGER DEFAULT 1 -- 0 or 1 (boolean)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_vehicles_ownership_status ON vehicles(ownership_type, status, region_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_license_plate ON vehicles(license_plate) WHERE is_active = 1;
CREATE INDEX IF NOT EXISTS idx_vehicles_region_active ON vehicles(region_id, is_active, status);
CREATE INDEX IF NOT EXISTS idx_vehicles_next_maintenance ON vehicles(next_maintenance_due) WHERE next_maintenance_due IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vehicles_registration_expiry ON vehicles(registration_expiry);

-- Insert sample vehicle data for testing
INSERT OR IGNORE INTO vehicles (
    vehicle_code, license_plate, make, model, year, color, category, fuel_type,
    ownership_type, seating_capacity, region_id, service_types, status,
    registration_expiry, insurance_expiry, next_maintenance_due
) VALUES 
('XOT-001', 'ABC123', 'Toyota', 'Vios', 2020, 'White', 'sedan', 'gasoline',
 'xpress_owned', 4, 'region-manila', 
 '["ride_4w"]', 'active', '2025-12-31', '2025-06-30', '2024-10-15'),

('XOT-002', 'DEF456', 'Honda', 'City', 2021, 'Silver', 'sedan', 'gasoline',
 'fleet_owned', 4, 'region-cebu',
 '["ride_4w"]', 'active', '2025-11-30', '2025-08-15', '2024-11-01'),

('XOT-003', 'GHI789', 'Suzuki', 'Ertiga', 2019, 'Black', 'mpv', 'gasoline',
 'operator_owned', 7, 'region-davao',
 '["ride_4w"]', 'active', '2025-10-15', '2025-09-30', '2024-09-30'),

('XOT-004', 'JKL012', 'Mitsubishi', 'Mirage', 2022, 'Blue', 'hatchback', 'gasoline',
 'driver_owned', 4, 'region-manila',
 '["ride_4w"]', 'maintenance', '2025-08-20', '2025-07-10', '2024-10-01'),

('XOT-005', 'MNO345', 'Toyota', 'Innova', 2018, 'Gray', 'mpv', 'diesel',
 'fleet_owned', 8, 'region-cebu',
 '["ride_4w", "delivery"]', 'in_service', '2025-09-15', '2025-05-30', '2024-12-15');

-- Create a simplified dashboard view for SQLite
CREATE VIEW IF NOT EXISTS v_vehicle_dashboard AS
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
    
    -- Mock current assignment (no driver assignments table yet)
    NULL as current_driver_id,
    NULL as current_driver_name,
    'primary' as assignment_type,
    
    -- Mock performance metrics (30 days)
    25 as total_trips_30d,
    75.0 as avg_utilization_30d,
    v.fuel_efficiency_kmpl as avg_fuel_efficiency_30d,
    35000.0 as total_revenue_30d,
    
    -- Maintenance status
    v.next_maintenance_due,
    'current' as maintenance_status,
    
    -- Mock alert counts
    v.maintenance_alerts_count as active_maintenance_alerts,
    0 as active_compliance_alerts,
    
    -- Mock OBD status
    CASE WHEN v.obd_device_installed = 1 THEN 'connected' ELSE 'not_installed' END as obd_status,
    '2024-09-06 08:00:00' as obd_last_connection,
    
    -- Mock compliance status
    'compliant' as overall_compliance_status,
    v.ltfrb_franchise_expiry as franchise_expiry_date,
    
    -- Last activity
    v.updated_at as last_updated
    
FROM vehicles v
JOIN regions r ON v.region_id = r.id
WHERE v.is_active = 1;