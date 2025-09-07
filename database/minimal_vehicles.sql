-- Minimal vehicles table for immediate testing
CREATE TABLE vehicles (
    id TEXT PRIMARY KEY,
    vehicle_code TEXT NOT NULL UNIQUE,
    license_plate TEXT NOT NULL UNIQUE,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER NOT NULL,
    color TEXT NOT NULL,
    category TEXT NOT NULL,
    fuel_type TEXT NOT NULL,
    ownership_type TEXT NOT NULL,
    seating_capacity INTEGER NOT NULL,
    region_id TEXT NOT NULL,
    service_types TEXT NOT NULL,
    status TEXT DEFAULT 'inactive',
    condition_rating TEXT DEFAULT 'good',
    condition_score DECIMAL(5,2) DEFAULT 75.00,
    registration_expiry TEXT NOT NULL,
    insurance_expiry TEXT,
    next_maintenance_due TEXT,
    obd_device_installed INTEGER DEFAULT 0,
    maintenance_alerts_count INTEGER DEFAULT 0,
    fuel_efficiency_kmpl DECIMAL(6,2),
    total_trips INTEGER DEFAULT 0,
    total_distance_km DECIMAL(10,2) DEFAULT 0.00,
    average_rating DECIMAL(3,2) DEFAULT 5.00,
    utilization_rate DECIMAL(5,2) DEFAULT 0.00,
    availability_score DECIMAL(5,2) DEFAULT 100.00,
    ltfrb_franchise_expiry TEXT,
    created_at TEXT DEFAULT '2024-09-06 10:00:00',
    updated_at TEXT DEFAULT '2024-09-06 10:00:00',
    is_active INTEGER DEFAULT 1
);

-- Insert sample vehicle data
INSERT INTO vehicles (
    id, vehicle_code, license_plate, make, model, year, color, category, fuel_type,
    ownership_type, seating_capacity, region_id, service_types, status,
    registration_expiry, insurance_expiry, next_maintenance_due, fuel_efficiency_kmpl
) VALUES 
('vehicle-001', 'XOT-001', 'ABC123', 'Toyota', 'Vios', 2020, 'White', 'sedan', 'gasoline',
 'xpress_owned', 4, 'region-manila', '["ride_4w"]', 'active', '2025-12-31', '2025-06-30', '2024-10-15', 15.2),

('vehicle-002', 'XOT-002', 'DEF456', 'Honda', 'City', 2021, 'Silver', 'sedan', 'gasoline',
 'fleet_owned', 4, 'region-cebu', '["ride_4w"]', 'active', '2025-11-30', '2025-08-15', '2024-11-01', 14.8),

('vehicle-003', 'XOT-003', 'GHI789', 'Suzuki', 'Ertiga', 2019, 'Black', 'mpv', 'gasoline',
 'operator_owned', 7, 'region-davao', '["ride_4w"]', 'active', '2025-10-15', '2025-09-30', '2024-09-30', 13.5),

('vehicle-004', 'XOT-004', 'JKL012', 'Mitsubishi', 'Mirage', 2022, 'Blue', 'hatchback', 'gasoline',
 'driver_owned', 4, 'region-manila', '["ride_4w"]', 'maintenance', '2025-08-20', '2025-07-10', '2024-10-01', 16.1),

('vehicle-005', 'XOT-005', 'MNO345', 'Toyota', 'Innova', 2018, 'Gray', 'mpv', 'diesel',
 'fleet_owned', 8, 'region-cebu', '["ride_4w", "delivery"]', 'in_service', '2025-09-15', '2025-05-30', '2024-12-15', 12.3);

-- Create dashboard view
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
    
    -- Mock current assignment
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
    
    -- Alert counts
    v.maintenance_alerts_count as active_maintenance_alerts,
    0 as active_compliance_alerts,
    
    -- OBD status
    CASE WHEN v.obd_device_installed = 1 THEN 'connected' ELSE 'not_installed' END as obd_status,
    '2024-09-06 08:00:00' as obd_last_connection,
    
    -- Compliance status
    'compliant' as overall_compliance_status,
    v.ltfrb_franchise_expiry as franchise_expiry_date,
    
    -- Last activity
    v.updated_at as last_updated
    
FROM vehicles v
JOIN regions r ON v.region_id = r.id
WHERE v.is_active = 1;