-- =====================================================
-- VEHICLE MANAGEMENT SAMPLE DATA SEEDING SCRIPT
-- For development and testing purposes
-- Creates realistic sample data for all ownership types
-- =====================================================

-- =====================================================
-- SAMPLE VEHICLES FOR EACH OWNERSHIP TYPE
-- =====================================================

-- Xpress Owned Vehicles (Full data access)
INSERT INTO vehicles (
    vehicle_code, license_plate, vin, make, model, year, color, category, fuel_type,
    ownership_type, seating_capacity, engine_displacement, region_id, service_types,
    status, condition_rating, condition_score, acquisition_cost, current_market_value,
    insurance_provider, insurance_policy_number, insurance_expiry, insurance_coverage_amount,
    registration_expiry, or_number, cr_number, ltfrb_franchise_number, ltfrb_franchise_expiry,
    obd_device_installed, telematics_provider, telematics_plan, service_types,
    max_trip_distance_km, daily_operating_hours, created_by
) VALUES 
-- Manila Region Xpress Owned Vehicles
('XPR-MNL-001', 'ABC1234', 'JTHBF5C26G5012345', 'Toyota', 'Vios', 2023, 'Pearl White', 'sedan', 'gasoline',
 'xpress_owned', 4, 1500, (SELECT id FROM regions WHERE code = 'MMD' LIMIT 1), 
 ARRAY['ride_4w']::service_type[], 'active', 'excellent', 95.50, 850000.00, 720000.00,
 'MAPFRE Insurance', 'MIC-2024-001234', '2025-08-15', 1200000.00,
 '2025-12-31', 'OR-2024-MNL-001', 'CR-2024-MNL-001', 'TNVS-MNL-001234', '2025-10-30',
 TRUE, 'Fleet Complete', 'Premium', ARRAY['ride_4w']::service_type[], 150, 14, 
 (SELECT id FROM users WHERE email = 'admin@xpress.ph' LIMIT 1)),

('XPR-MNL-002', 'DEF5678', 'JTHBF5C26G5012346', 'Honda', 'City', 2023, 'Meteorite Gray', 'sedan', 'gasoline',
 'xpress_owned', 4, 1500, (SELECT id FROM regions WHERE code = 'MMD' LIMIT 1),
 ARRAY['ride_4w']::service_type[], 'active', 'excellent', 92.75, 880000.00, 750000.00,
 'MAPFRE Insurance', 'MIC-2024-001235', '2025-09-20', 1200000.00,
 '2025-11-30', 'OR-2024-MNL-002', 'CR-2024-MNL-002', 'TNVS-MNL-001235', '2025-11-15',
 TRUE, 'Fleet Complete', 'Premium', ARRAY['ride_4w']::service_type[], 150, 14,
 (SELECT id FROM users WHERE email = 'admin@xpress.ph' LIMIT 1)),

('XPR-MNL-003', 'GHI9012', 'JMZGH12F561234567', 'Mazda', 'CX-5', 2022, 'Soul Red Crystal', 'suv', 'gasoline',
 'xpress_owned', 5, 2500, (SELECT id FROM regions WHERE code = 'MMD' LIMIT 1),
 ARRAY['ride_4w']::service_type[], 'active', 'good', 88.25, 1200000.00, 980000.00,
 'MAPFRE Insurance', 'MIC-2024-001236', '2025-07-10', 1800000.00,
 '2025-09-15', 'OR-2024-MNL-003', 'CR-2024-MNL-003', 'TNVS-MNL-001236', '2025-08-20',
 TRUE, 'Geotab', 'Pro Plus', ARRAY['ride_4w']::service_type[], 200, 16,
 (SELECT id FROM users WHERE email = 'admin@xpress.ph' LIMIT 1)),

-- Cebu Region Xpress Owned
('XPR-CEB-001', 'CEB1001', 'WVWZZZ3CZ9E012345', 'Volkswagen', 'Santana', 2023, 'Reflex Silver', 'sedan', 'gasoline',
 'xpress_owned', 4, 1400, (SELECT id FROM regions WHERE code = 'CEB' LIMIT 1),
 ARRAY['ride_4w']::service_type[], 'active', 'excellent', 94.00, 780000.00, 650000.00,
 'Malayan Insurance', 'MAL-CEB-2024-001', '2025-06-30', 1100000.00,
 '2025-12-15', 'OR-2024-CEB-001', 'CR-2024-CEB-001', 'TNVS-CEB-001001', '2025-09-30',
 TRUE, 'Fleet Complete', 'Standard', ARRAY['ride_4w']::service_type[], 120, 12,
 (SELECT id FROM users WHERE email = 'admin@xpress.ph' LIMIT 1)),

-- Fleet Owned Vehicles (External fleet management)
('FLT-MNL-001', 'FLT1111', 'KMH12345678901234', 'Hyundai', 'Accent', 2022, 'Polar White', 'sedan', 'gasoline',
 'fleet_owned', 4, 1400, (SELECT id FROM regions WHERE code = 'MMD' LIMIT 1),
 ARRAY['ride_4w']::service_type[], 'active', 'good', 85.50, NULL, 680000.00,
 'BPI-MS Insurance', 'BPI-2024-FLT-001', '2025-05-15', 950000.00,
 '2025-10-20', 'OR-2024-FLT-001', 'CR-2024-FLT-001', 'TNVS-MNL-FLT001', '2025-07-25',
 TRUE, 'AutoFleet Solutions', 'Basic', ARRAY['ride_4w']::service_type[], 100, 12, NULL),

('FLT-MNL-002', 'FLT2222', 'KMH12345678901235', 'Hyundai', 'Reina', 2021, 'Fiery Red', 'sedan', 'gasoline',
 'fleet_owned', 4, 1400, (SELECT id FROM regions WHERE code = 'MMD' LIMIT 1),
 ARRAY['ride_4w']::service_type[], 'maintenance', 'fair', 72.25, NULL, 590000.00,
 'BPI-MS Insurance', 'BPI-2024-FLT-002', '2025-04-10', 950000.00,
 '2025-08-30', 'OR-2024-FLT-002', 'CR-2024-FLT-002', 'TNVS-MNL-FLT002', '2025-06-15',
 FALSE, NULL, NULL, ARRAY['ride_4w']::service_type[], 100, 12, NULL),

-- Operator Owned Vehicles (Individual operators, 1-3 vehicles)
('OPR-MNL-001', 'OPR0001', 'MHFCB1234567890', 'Mitsubishi', 'Mirage', 2020, 'Lightning Blue', 'hatchback', 'gasoline',
 'operator_owned', 4, 1200, (SELECT id FROM regions WHERE code = 'MMD' LIMIT 1),
 ARRAY['ride_4w']::service_type[], 'active', 'good', 82.00, NULL, 520000.00,
 'Pioneer Insurance', 'PIO-2024-OPR-001', '2025-03-20', 800000.00,
 '2025-07-15', 'OR-2024-OPR-001', 'CR-2024-OPR-001', 'TNVS-MNL-OPR001', '2025-05-30',
 TRUE, 'Basic Telematics', 'Starter', ARRAY['ride_4w']::service_type[], 80, 10, NULL),

('OPR-CEB-001', 'OPR1001', 'MHFCB1234567891', 'Mitsubishi', 'Mirage G4', 2021, 'Sterling Silver', 'sedan', 'gasoline',
 'operator_owned', 4, 1200, (SELECT id FROM regions WHERE code = 'CEB' LIMIT 1),
 ARRAY['ride_4w']::service_type[], 'active', 'good', 79.50, NULL, 580000.00,
 'Stronghold Insurance', 'SHI-CEB-2024-001', '2025-02-28', 850000.00,
 '2025-06-10', 'OR-2024-CEB-001', 'CR-2024-CEB-001', 'TNVS-CEB-OPR001', '2025-04-15',
 FALSE, NULL, NULL, ARRAY['ride_4w']::service_type[], 90, 11, NULL),

('OPR-DAV-001', 'OPR2001', 'SUZUKIERTIGA12345', 'Suzuki', 'Ertiga', 2019, 'Pearl Arctic White', 'mpv', 'gasoline',
 'operator_owned', 7, 1500, (SELECT id FROM regions WHERE code = 'DAV' LIMIT 1),
 ARRAY['ride_4w']::service_type[], 'active', 'fair', 76.75, NULL, 650000.00,
 'UCPB General Insurance', 'UCPB-DAV-2024-001', '2025-01-15', 900000.00,
 '2025-05-20', 'OR-2024-DAV-001', 'CR-2024-DAV-001', 'TNVS-DAV-OPR001', '2025-03-10',
 TRUE, 'Simple Track', 'Economy', ARRAY['ride_4w']::service_type[], 120, 12, NULL),

-- Driver Owned Vehicles (Minimal tracking)
('DRV-MNL-001', 'DRV0001', NULL, 'Nissan', 'Almera', 2018, 'Brilliant Silver', 'sedan', 'gasoline',
 'driver_owned', 4, 1500, (SELECT id FROM regions WHERE code = 'MMD' LIMIT 1),
 ARRAY['ride_4w']::service_type[], 'active', 'fair', 74.00, NULL, 450000.00,
 'FGU Insurance', 'FGU-2024-DRV-001', '2025-01-30', 700000.00,
 '2025-04-25', 'OR-2024-DRV-001', 'CR-2024-DRV-001', 'TNVS-MNL-DRV001', '2025-02-20',
 FALSE, NULL, NULL, ARRAY['ride_4w']::service_type[], 60, 8, NULL),

('DRV-CEB-001', 'DRV1001', NULL, 'Toyota', 'Wigo', 2019, 'Orange Metallic', 'hatchback', 'gasoline',
 'driver_owned', 4, 1000, (SELECT id FROM regions WHERE code = 'CEB' LIMIT 1),
 ARRAY['ride_4w']::service_type[], 'active', 'good', 80.25, NULL, 480000.00,
 'Paramount Insurance', 'PAR-CEB-2024-001', '2024-12-15', 750000.00,
 '2025-03-30', 'OR-2024-CEB-001', 'CR-2024-CEB-001', 'TNVS-CEB-DRV001', '2025-01-25',
 FALSE, NULL, NULL, ARRAY['ride_4w']::service_type[], 70, 9, NULL)

ON CONFLICT (vehicle_code) DO NOTHING;

-- Update fleet_owner_name and operator_owner_name
UPDATE vehicles 
SET fleet_owner_name = 'Metro Manila Fleet Solutions Inc.'
WHERE ownership_type = 'fleet_owned' AND region_id = (SELECT id FROM regions WHERE code = 'MMD' LIMIT 1);

UPDATE vehicles 
SET operator_owner_name = CASE 
    WHEN vehicle_code = 'OPR-MNL-001' THEN 'Juan dela Cruz'
    WHEN vehicle_code = 'OPR-CEB-001' THEN 'Maria Santos'
    WHEN vehicle_code = 'OPR-DAV-001' THEN 'Jose Rizal'
    ELSE operator_owner_name
END
WHERE ownership_type = 'operator_owned';

-- =====================================================
-- SAMPLE OBD DEVICES FOR VEHICLES WITH TELEMATICS
-- =====================================================

INSERT INTO vehicle_obd_devices (
    device_serial, device_model, manufacturer, firmware_version,
    vehicle_id, installed_date, cellular_carrier, data_plan, monthly_data_cost,
    status, supported_protocols, collect_engine_data, collect_gps_data,
    collect_diagnostic_data, collect_fuel_data
) VALUES 
-- Xpress owned vehicles (all have OBD)
('FC-2024-001', 'GO9-Pro', 'Fleet Complete', '7.2.1.4',
 (SELECT id FROM vehicles WHERE vehicle_code = 'XPR-MNL-001'), '2024-01-15', 
 'Globe', 'Unlimited IoT', 899.00, 'connected', 
 ARRAY['J1939', 'OBD-II', 'CAN'], TRUE, TRUE, TRUE, TRUE),

('FC-2024-002', 'GO9-Pro', 'Fleet Complete', '7.2.1.4',
 (SELECT id FROM vehicles WHERE vehicle_code = 'XPR-MNL-002'), '2024-01-20',
 'Smart', 'Business IoT', 799.00, 'connected',
 ARRAY['J1939', 'OBD-II', 'CAN'], TRUE, TRUE, TRUE, TRUE),

('GT-2024-001', 'GO9-LTE', 'Geotab', '8.1.2.0',
 (SELECT id FROM vehicles WHERE vehicle_code = 'XPR-MNL-003'), '2024-02-01',
 'Globe', 'Premium IoT', 1299.00, 'connected',
 ARRAY['J1939', 'OBD-II', 'CAN', 'J1708'], TRUE, TRUE, TRUE, TRUE),

('FC-2024-003', 'GO8-Standard', 'Fleet Complete', '7.1.8.2',
 (SELECT id FROM vehicles WHERE vehicle_code = 'XPR-CEB-001'), '2024-01-25',
 'Globe', 'Standard IoT', 699.00, 'connected',
 ARRAY['OBD-II', 'CAN'], TRUE, TRUE, TRUE, TRUE),

-- Fleet owned vehicle with OBD
('AF-2024-001', 'TrackPro-Elite', 'AutoFleet Solutions', '2.4.1',
 (SELECT id FROM vehicles WHERE vehicle_code = 'FLT-MNL-001'), '2024-02-10',
 'Smart', 'Fleet Data Plus', 999.00, 'connected',
 ARRAY['OBD-II', 'CAN'], TRUE, TRUE, TRUE, TRUE),

-- Operator owned vehicles with optional OBD
('BT-2024-001', 'BasicTrack-Starter', 'Basic Telematics', '1.2.5',
 (SELECT id FROM vehicles WHERE vehicle_code = 'OPR-MNL-001'), '2024-03-01',
 'Smart', 'Basic IoT', 499.00, 'connected',
 ARRAY['OBD-II'], TRUE, TRUE, FALSE, TRUE),

('ST-2024-001', 'SimpleOBD-Economy', 'Simple Track', '3.1.0',
 (SELECT id FROM vehicles WHERE vehicle_code = 'OPR-DAV-001'), '2024-02-15',
 'Globe', 'Economy IoT', 399.00, 'connected',
 ARRAY['OBD-II'], FALSE, TRUE, FALSE, FALSE)

ON CONFLICT (device_serial) DO NOTHING;

-- =====================================================
-- SAMPLE DRIVER ASSIGNMENTS
-- =====================================================

-- Insert sample driver assignments for vehicles
INSERT INTO vehicle_driver_assignments (
    vehicle_id, driver_id, assignment_type, assigned_at, valid_from,
    daily_rental_fee, fuel_responsibility, maintenance_responsibility,
    assigned_by
) VALUES 
-- Xpress owned vehicles - no rental fees
((SELECT id FROM vehicles WHERE vehicle_code = 'XPR-MNL-001'), 
 (SELECT id FROM drivers WHERE email = 'driver1@example.com' LIMIT 1),
 'primary', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days',
 0.00, 'owner', 'owner', (SELECT id FROM users WHERE email = 'admin@xpress.ph' LIMIT 1)),

((SELECT id FROM vehicles WHERE vehicle_code = 'XPR-MNL-002'),
 (SELECT id FROM drivers WHERE email = 'driver2@example.com' LIMIT 1),
 'primary', NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days',
 0.00, 'owner', 'owner', (SELECT id FROM users WHERE email = 'admin@xpress.ph' LIMIT 1)),

-- Fleet owned vehicles - rental agreements
((SELECT id FROM vehicles WHERE vehicle_code = 'FLT-MNL-001'),
 (SELECT id FROM drivers WHERE email = 'driver3@example.com' LIMIT 1),
 'primary', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days',
 800.00, 'driver', 'owner', (SELECT id FROM users WHERE email = 'admin@xpress.ph' LIMIT 1)),

-- Operator owned vehicles - rental with shared responsibilities
((SELECT id FROM vehicles WHERE vehicle_code = 'OPR-MNL-001'),
 (SELECT id FROM drivers WHERE email = 'driver4@example.com' LIMIT 1),
 'primary', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days',
 600.00, 'driver', 'shared', (SELECT id FROM users WHERE email = 'admin@xpress.ph' LIMIT 1)),

((SELECT id FROM vehicles WHERE vehicle_code = 'OPR-CEB-001'),
 (SELECT id FROM drivers WHERE email = 'driver5@example.com' LIMIT 1),
 'primary', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days',
 550.00, 'driver', 'shared', (SELECT id FROM users WHERE email = 'admin@xpress.ph' LIMIT 1)),

-- Driver owned vehicles - driver owns and maintains
((SELECT id FROM vehicles WHERE vehicle_code = 'DRV-MNL-001'),
 (SELECT id FROM drivers WHERE email = 'driver6@example.com' LIMIT 1),
 'primary', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days',
 0.00, 'driver', 'driver', (SELECT id FROM users WHERE email = 'admin@xpress.ph' LIMIT 1))

ON CONFLICT DO NOTHING;

-- =====================================================
-- SAMPLE MAINTENANCE RECORDS
-- =====================================================

INSERT INTO vehicle_maintenance (
    vehicle_id, maintenance_code, work_order_number, maintenance_type, priority,
    service_provider, service_location, scheduled_date, actual_start_time,
    actual_completion_time, description, work_performed, parts_cost, labor_cost,
    other_costs, quality_rating, status, created_by
) VALUES 
-- Recent completed maintenance
((SELECT id FROM vehicles WHERE vehicle_code = 'XPR-MNL-001'),
 'MNT-2024-001', 'WO-TC-2024-0234', 'oil_change', 'routine',
 'Toyota Cubao Service Center', 'EDSA Cubao, Quezon City',
 '2024-03-15', '2024-03-15 08:00:00+08', '2024-03-15 09:30:00+08',
 'Regular 5000km oil change service', 'Engine oil and filter replacement, fluid level check',
 2800.00, 800.00, 150.00, 4.5, 'completed',
 (SELECT id FROM users WHERE email = 'admin@xpress.ph' LIMIT 1)),

((SELECT id FROM vehicles WHERE vehicle_code = 'XPR-MNL-002'),
 'MNT-2024-002', 'WO-HC-2024-0156', 'brake_service', 'minor',
 'Honda Cars Makati Service', 'Makati Avenue, Makati City',
 '2024-03-10', '2024-03-10 10:00:00+08', '2024-03-10 14:30:00+08',
 'Brake pad replacement and system check', 'Front brake pads replaced, brake fluid topped up',
 4200.00, 1800.00, 200.00, 4.8, 'completed',
 (SELECT id FROM users WHERE email = 'admin@xpress.ph' LIMIT 1)),

-- Scheduled upcoming maintenance
((SELECT id FROM vehicles WHERE vehicle_code = 'XPR-MNL-003'),
 'MNT-2024-003', 'WO-MZ-2024-0089', 'tire_rotation', 'routine',
 'Mazda Ortigas Service Center', 'Ortigas Avenue, Pasig City',
 CURRENT_DATE + 3, NULL, NULL,
 'Scheduled tire rotation and alignment check', NULL,
 0.00, 0.00, 0.00, NULL, 'scheduled',
 (SELECT id FROM users WHERE email = 'admin@xpress.ph' LIMIT 1)),

-- Fleet vehicle maintenance
((SELECT id FROM vehicles WHERE vehicle_code = 'FLT-MNL-001'),
 'MNT-2024-004', 'WO-HY-2024-0123', 'general_inspection', 'minor',
 'Hyundai Commonwealth Service', 'Commonwealth Avenue, Quezon City',
 '2024-03-08', '2024-03-08 09:00:00+08', '2024-03-08 11:45:00+08',
 'General vehicle inspection and preventive maintenance', 'Comprehensive vehicle inspection, minor adjustments',
 1500.00, 1200.00, 100.00, 4.2, 'completed',
 (SELECT id FROM users WHERE email = 'admin@xpress.ph' LIMIT 1)),

-- Operator vehicle maintenance
((SELECT id FROM vehicles WHERE vehicle_code = 'OPR-MNL-001'),
 'MNT-2024-005', 'WO-MI-2024-0067', 'oil_change', 'routine',
 'Mitsubishi Shaw Service Center', 'Shaw Boulevard, Mandaluyong City',
 '2024-02-28', '2024-02-28 14:00:00+08', '2024-02-28 15:30:00+08',
 'Routine oil change and filter replacement', 'Engine oil change, oil filter, air filter check',
 2200.00, 600.00, 50.00, 4.0, 'completed',
 (SELECT id FROM users WHERE email = 'admin@xpress.ph' LIMIT 1))

ON CONFLICT (maintenance_code) DO NOTHING;

-- =====================================================
-- SAMPLE MAINTENANCE ALERTS
-- =====================================================

INSERT INTO maintenance_alerts (
    vehicle_id, alert_type, alert_source, trigger_condition, current_value,
    threshold_value, alert_title, alert_description, recommended_action,
    urgency_level, notify_driver, notify_owner, notify_ops_team
) VALUES 
-- Overdue maintenance alert
((SELECT id FROM vehicles WHERE vehicle_code = 'FLT-MNL-002'),
 'overdue_maintenance', 'system', 'maintenance_due_date_passed', 
 (CURRENT_DATE)::text, (CURRENT_DATE - 5)::text,
 'Vehicle Maintenance Overdue',
 'Vehicle FLT-MNL-002 has maintenance overdue by 5 days. Last service was scheduled for ' || (CURRENT_DATE - 5),
 'Contact service center immediately to schedule maintenance',
 'urgent', TRUE, TRUE, TRUE),

-- High mileage alert
((SELECT id FROM vehicles WHERE vehicle_code = 'XPR-MNL-001'),
 'high_mileage', 'obd', 'odometer_reading', '48500', '50000',
 'High Mileage Alert',
 'Vehicle XPR-MNL-001 approaching major service interval at 50,000 km (currently at 48,500 km)',
 'Schedule major service within next 2 weeks',
 'minor', TRUE, FALSE, TRUE),

-- Engine diagnostic alert
((SELECT id FROM vehicles WHERE vehicle_code = 'OPR-DAV-001'),
 'engine_diagnostic', 'obd', 'diagnostic_trouble_code', 'P0171', 'any_dtc',
 'Engine Diagnostic Code',
 'Vehicle OPR-DAV-001 reporting diagnostic trouble code P0171 (System Too Lean Bank 1)',
 'Have engine diagnostics checked at authorized service center',
 'major', TRUE, TRUE, FALSE)

ON CONFLICT DO NOTHING;

-- =====================================================
-- SAMPLE PERFORMANCE DATA (LAST 30 DAYS)
-- =====================================================

-- Generate daily performance data for the last 30 days for active vehicles
DO $$
DECLARE
    vehicle_record RECORD;
    day_offset INTEGER;
    performance_date DATE;
    base_trips INTEGER;
    base_distance DECIMAL;
    base_revenue DECIMAL;
BEGIN
    -- Loop through active vehicles
    FOR vehicle_record IN 
        SELECT id, vehicle_code, ownership_type 
        FROM vehicles 
        WHERE status = 'active' 
        AND vehicle_code IN ('XPR-MNL-001', 'XPR-MNL-002', 'FLT-MNL-001', 'OPR-MNL-001', 'DRV-MNL-001')
    LOOP
        -- Generate 30 days of performance data
        FOR day_offset IN 1..30 LOOP
            performance_date := CURRENT_DATE - day_offset;
            
            -- Base performance varies by vehicle type and day of week
            base_trips := CASE 
                WHEN EXTRACT(DOW FROM performance_date) IN (0,6) THEN 8 + FLOOR(RANDOM() * 5)  -- Weekend
                ELSE 12 + FLOOR(RANDOM() * 8)  -- Weekday
            END;
            
            base_distance := base_trips * (15 + RANDOM() * 10); -- 15-25 km per trip average
            base_revenue := base_distance * (8.50 + RANDOM() * 3); -- PHP 8.50-11.50 per km
            
            INSERT INTO vehicle_performance_daily (
                vehicle_id, performance_date, 
                total_trips, completed_trips, cancelled_trips,
                total_online_minutes, total_driving_minutes, total_idle_minutes,
                total_distance_km, billable_distance_km, empty_distance_km,
                fuel_consumed_liters, fuel_efficiency_kmpl,
                gross_revenue_php, net_revenue_php,
                average_trip_rating, customer_complaints,
                carbon_emissions_kg, reliability_score,
                utilization_rate, distance_efficiency,
                cost_per_kilometer, revenue_per_kilometer
            ) VALUES (
                vehicle_record.id, performance_date,
                base_trips, base_trips - FLOOR(RANDOM() * 2), FLOOR(RANDOM() * 2),
                480 + FLOOR(RANDOM() * 120), -- 8-10 hours online
                base_trips * 25 + FLOOR(RANDOM() * 60), -- driving time
                60 + FLOOR(RANDOM() * 30), -- idle time
                base_distance, base_distance * 0.85, base_distance * 0.15,
                base_distance / (12 + RANDOM() * 6), -- fuel consumption
                12 + RANDOM() * 6, -- fuel efficiency 12-18 kmpl
                base_revenue, base_revenue * 0.75, -- net after fees
                4.2 + RANDOM() * 0.8, -- rating 4.2-5.0
                FLOOR(RANDOM() * 2), -- complaints
                base_distance * 0.12, -- carbon emissions
                85 + RANDOM() * 15, -- reliability 85-100%
                (base_trips * 25.0) / (480 + FLOOR(RANDOM() * 120)), -- utilization
                0.85, -- distance efficiency
                (base_revenue * 0.25) / base_distance, -- cost per km
                base_revenue / base_distance -- revenue per km
            )
            ON CONFLICT (vehicle_id, performance_date) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- =====================================================
-- SAMPLE LTFRB COMPLIANCE DATA
-- =====================================================

INSERT INTO ltfrb_compliance (
    vehicle_id, franchise_number, franchise_type, franchise_route,
    franchise_issued_date, franchise_expiry_date, franchise_status,
    registration_number, registration_type, registration_expiry_date,
    or_cr_expiry_date, last_inspection_date, last_inspection_result,
    next_inspection_due_date, inspection_center, inspection_certificate_number,
    roadworthiness_certificate, roadworthiness_expiry, emissions_test_result,
    emissions_test_date, emissions_certificate_number,
    compulsory_insurance_policy, compulsory_insurance_expiry,
    comprehensive_insurance_policy, comprehensive_insurance_expiry,
    overall_compliance_status, compliance_score
) VALUES 
-- Xpress owned vehicles - full compliance
((SELECT id FROM vehicles WHERE vehicle_code = 'XPR-MNL-001'),
 'TNVS-NCR-2024-001234', 'TNVS', 'Metro Manila Wide Coverage',
 '2024-01-15', '2025-01-15', 'active',
 'NCR-1234567890', 'Commercial', '2025-12-31', '2025-12-31',
 '2024-02-15', 'passed', '2024-08-15', 'LTO-NCR-East',
 'INSP-NCR-2024-001234', 'RWC-NCR-2024-001234', '2024-08-15',
 'passed', '2024-02-15', 'EMC-NCR-2024-001234',
 'CTPL-2024-MNL-001234', '2025-08-15', 'COMP-2024-MNL-001234', '2025-08-15',
 'compliant', 98.50),

((SELECT id FROM vehicles WHERE vehicle_code = 'XPR-MNL-002'),
 'TNVS-NCR-2024-001235', 'TNVS', 'Metro Manila Wide Coverage',
 '2024-01-20', '2025-01-20', 'active',
 'NCR-1234567891', 'Commercial', '2025-11-30', '2025-11-30',
 '2024-02-20', 'passed', '2024-08-20', 'LTO-NCR-West',
 'INSP-NCR-2024-001235', 'RWC-NCR-2024-001235', '2024-08-20',
 'passed', '2024-02-20', 'EMC-NCR-2024-001235',
 'CTPL-2024-MNL-001235', '2025-09-20', 'COMP-2024-MNL-001235', '2025-09-20',
 'compliant', 97.25),

-- Fleet owned vehicle - mostly compliant
((SELECT id FROM vehicles WHERE vehicle_code = 'FLT-MNL-001'),
 'TNVS-NCR-2024-FLT001', 'TNVS', 'Metro Manila Wide Coverage',
 '2024-02-01', '2025-02-01', 'active',
 'NCR-FLT001234567', 'Commercial', '2025-10-20', '2025-10-20',
 '2024-01-15', 'passed', '2024-07-15', 'LTO-NCR-South',
 'INSP-NCR-2024-FLT001', 'RWC-NCR-2024-FLT001', '2024-07-15',
 'passed', '2024-01-15', 'EMC-NCR-2024-FLT001',
 'CTPL-2024-FLT-001234', '2025-05-15', 'COMP-2024-FLT-001234', '2025-05-15',
 'warning', 89.75),

-- Operator owned - compliance issues
((SELECT id FROM vehicles WHERE vehicle_code = 'OPR-MNL-001'),
 'TNVS-NCR-2024-OPR001', 'TNVS', 'Metro Manila Wide Coverage',
 '2024-03-01', '2025-03-01', 'active',
 'NCR-OPR001234567', 'Commercial', '2025-07-15', '2025-07-15',
 '2024-01-10', 'conditional', '2024-07-10', 'LTO-NCR-North',
 'INSP-NCR-2024-OPR001', 'RWC-NCR-2024-OPR001', '2024-07-10',
 'pending', '2024-01-10', NULL,
 'CTPL-2024-OPR-001234', '2025-03-20', NULL, NULL,
 'warning', 76.50),

-- Driver owned - minimal compliance
((SELECT id FROM vehicles WHERE vehicle_code = 'DRV-MNL-001'),
 'TNVS-NCR-2024-DRV001', 'TNVS', 'Metro Manila Wide Coverage',
 '2024-01-30', '2025-01-30', 'active',
 'NCR-DRV001234567', 'Commercial', '2025-04-25', '2025-04-25',
 '2023-12-15', 'passed', '2024-06-15', 'LTO-NCR-Central',
 'INSP-NCR-2023-DRV001', NULL, NULL,
 'passed', '2023-12-15', 'EMC-NCR-2023-DRV001',
 'CTPL-2024-DRV-001234', '2025-01-30', NULL, NULL,
 'warning', 72.25)

ON CONFLICT (vehicle_id, franchise_number) DO NOTHING;

-- =====================================================
-- SAMPLE COMPLIANCE ALERTS
-- =====================================================

INSERT INTO compliance_alerts (
    vehicle_id, compliance_id, alert_type, alert_category, alert_priority,
    alert_title, alert_message, recommended_action, days_until_due
) VALUES 
-- Inspection due soon
((SELECT id FROM vehicles WHERE vehicle_code = 'OPR-MNL-001'),
 (SELECT id FROM ltfrb_compliance WHERE franchise_number = 'TNVS-NCR-2024-OPR001'),
 'inspection_due', 'inspection', 'major',
 'Vehicle Inspection Due Soon',
 'Vehicle OPR-MNL-001 inspection due on 2024-07-10. Please schedule inspection at authorized LTO center.',
 'Contact LTO-NCR-North to schedule vehicle inspection', 15),

-- Franchise renewal reminder
((SELECT id FROM vehicles WHERE vehicle_code = 'XPR-MNL-001'),
 (SELECT id FROM ltfrb_compliance WHERE franchise_number = 'TNVS-NCR-2024-001234'),
 'franchise_renewal', 'franchise', 'minor',
 'Franchise Renewal Reminder',
 'TNVS franchise for vehicle XPR-MNL-001 expires on 2025-01-15. Renewal process should begin 60 days prior.',
 'Begin franchise renewal process with LTFRB', 90),

-- Insurance expiry warning
((SELECT id FROM vehicles WHERE vehicle_code = 'FLT-MNL-001'),
 (SELECT id FROM ltfrb_compliance WHERE franchise_number = 'TNVS-NCR-2024-FLT001'),
 'insurance_expiry', 'insurance', 'urgent',
 'Insurance Expiry Warning',
 'Comprehensive insurance for vehicle FLT-MNL-001 expires on 2025-05-15. Renewal required for continued operation.',
 'Contact insurance provider to renew comprehensive coverage', 30)

ON CONFLICT DO NOTHING;

-- =====================================================
-- SAMPLE TELEMETRY DATA (LAST 24 HOURS FOR OBD-ENABLED VEHICLES)
-- =====================================================

-- Generate sample telemetry data for vehicles with OBD devices
DO $$
DECLARE
    vehicle_record RECORD;
    hour_offset INTEGER;
    sample_time TIMESTAMP WITH TIME ZONE;
    base_location_lat DECIMAL := 14.5995; -- Manila latitude
    base_location_lng DECIMAL := 120.9842; -- Manila longitude
BEGIN
    -- Loop through vehicles with OBD devices
    FOR vehicle_record IN 
        SELECT v.id, v.vehicle_code, obd.id as obd_device_id
        FROM vehicles v
        JOIN vehicle_obd_devices obd ON v.id = obd.vehicle_id
        WHERE obd.status = 'connected'
        AND v.vehicle_code IN ('XPR-MNL-001', 'XPR-MNL-002', 'FLT-MNL-001')
    LOOP
        -- Generate hourly telemetry data for last 24 hours
        FOR hour_offset IN 1..24 LOOP
            sample_time := NOW() - (hour_offset || ' hours')::INTERVAL;
            
            INSERT INTO vehicle_telemetry_data (
                vehicle_id, device_id, 
                location, speed_kmh, heading, altitude_meters,
                engine_rpm, engine_load_percent, throttle_position_percent,
                engine_temperature_celsius, fuel_level_percent,
                instantaneous_fuel_consumption_lph, battery_voltage,
                recorded_at, recorded_date
            ) VALUES (
                vehicle_record.id, vehicle_record.obd_device_id,
                ST_Point(
                    base_location_lng + (RANDOM() - 0.5) * 0.1, -- ±0.05 degrees
                    base_location_lat + (RANDOM() - 0.5) * 0.1,
                    4326
                ),
                20 + RANDOM() * 40, -- 20-60 kmh
                FLOOR(RANDOM() * 360), -- 0-359 degrees
                50 + RANDOM() * 100, -- 50-150 meters altitude
                1500 + FLOOR(RANDOM() * 2000), -- 1500-3500 RPM
                30 + RANDOM() * 40, -- 30-70% engine load
                20 + RANDOM() * 60, -- 20-80% throttle
                85 + RANDOM() * 20, -- 85-105°C engine temp
                50 + RANDOM() * 40, -- 50-90% fuel level
                8 + RANDOM() * 4, -- 8-12 L/hr fuel consumption
                12.5 + RANDOM() * 1.5, -- 12.5-14V battery
                sample_time,
                sample_time::DATE
            )
            ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- =====================================================
-- UPDATE VEHICLE STATISTICS BASED ON SAMPLE DATA
-- =====================================================

-- Update vehicle statistics based on generated data
UPDATE vehicles SET 
    total_distance_km = COALESCE((
        SELECT SUM(total_distance_km) 
        FROM vehicle_performance_daily 
        WHERE vehicle_id = vehicles.id
    ), 0),
    total_trips = COALESCE((
        SELECT SUM(total_trips)
        FROM vehicle_performance_daily 
        WHERE vehicle_id = vehicles.id
    ), 0),
    fuel_efficiency_kmpl = COALESCE((
        SELECT AVG(fuel_efficiency_kmpl)
        FROM vehicle_performance_daily 
        WHERE vehicle_id = vehicles.id
        AND fuel_efficiency_kmpl > 0
    ), 0),
    utilization_rate = COALESCE((
        SELECT AVG(utilization_rate)
        FROM vehicle_performance_daily 
        WHERE vehicle_id = vehicles.id
    ), 0),
    next_maintenance_due = CASE 
        WHEN ownership_type = 'xpress_owned' THEN 
            CURRENT_DATE + ((5000 - (total_distance_km % 5000)) / 150)::INTEGER  -- Every 5000km, ~150km/day
        WHEN ownership_type = 'fleet_owned' THEN 
            CURRENT_DATE + INTERVAL '2 months'
        WHEN ownership_type = 'operator_owned' THEN 
            CURRENT_DATE + INTERVAL '3 months' 
        ELSE 
            CURRENT_DATE + INTERVAL '6 months'
    END
WHERE vehicle_code LIKE 'XPR-%' OR vehicle_code LIKE 'FLT-%' OR vehicle_code LIKE 'OPR-%' OR vehicle_code LIKE 'DRV-%';

-- =====================================================
-- SAMPLE DATA SUMMARY LOG
-- =====================================================

INSERT INTO system_logs (level, message, metadata, created_at)
VALUES ('INFO', 'Vehicle management sample data seeding completed', 
        jsonb_build_object(
            'vehiclesCreated', (SELECT COUNT(*) FROM vehicles WHERE vehicle_code LIKE '%-%-%'),
            'driverAssignmentsCreated', (SELECT COUNT(*) FROM vehicle_driver_assignments),
            'maintenanceRecordsCreated', (SELECT COUNT(*) FROM vehicle_maintenance),
            'obdDevicesCreated', (SELECT COUNT(*) FROM vehicle_obd_devices),
            'performanceRecordsCreated', (SELECT COUNT(*) FROM vehicle_performance_daily),
            'complianceRecordsCreated', (SELECT COUNT(*) FROM ltfrb_compliance),
            'telemetryPointsCreated', (SELECT COUNT(*) FROM vehicle_telemetry_data)
        ), NOW())
ON CONFLICT DO NOTHING;

COMMIT;