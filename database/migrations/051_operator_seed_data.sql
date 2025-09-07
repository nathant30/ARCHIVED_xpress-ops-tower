-- =====================================================
-- OPERATOR MANAGEMENT SEED DATA
-- Migration 051: Sample data for testing operator management system
-- Creates realistic test data for development and testing
-- =====================================================

-- =====================================================
-- SAMPLE OPERATORS
-- =====================================================

-- Insert sample operators representing different types and regions
INSERT INTO operators (
    operator_code, business_name, legal_name, trade_name, operator_type, status,
    primary_contact, business_address, primary_region_id, max_vehicles,
    business_registration_number, tin, ltfrb_authority_number,
    partnership_start_date, performance_score, commission_tier,
    earnings_today, earnings_week, earnings_month, total_commissions_earned
) VALUES 

-- TNVS Operators (max 3 vehicles)
('TNVS001', 'Metro Rideshare Co.', 'Metro Rideshare Corporation', 'MetroRide', 'tnvs', 'active',
 '{"name": "Juan dela Cruz", "phone": "+63917-123-4567", "email": "juan@metroride.ph", "position": "Operations Manager"}',
 '{"street": "123 EDSA Avenue", "barangay": "Greenhills", "city": "San Juan", "province": "Metro Manila", "postal_code": "1500", "coordinates": {"lat": 14.6021, "lng": 121.0354}}',
 (SELECT id FROM regions WHERE code = 'MM01' LIMIT 1), 3,
 'CN202301234567', '123-456-789-000', 'TNVS-MM-2023-001',
 '2023-01-15', 78.50, 'tier_1',
 2500.00, 15000.00, 52000.00, 125000.00),

('TNVS002', 'Cebu Express Transport', 'Cebu Express Transport Services Inc.', 'CebuXpress', 'tnvs', 'active',
 '{"name": "Maria Santos", "phone": "+63922-987-6543", "email": "maria@cebuxpress.ph", "position": "General Manager"}',
 '{"street": "456 Colon Street", "barangay": "Kalunasan", "city": "Cebu City", "province": "Cebu", "postal_code": "6000", "coordinates": {"lat": 10.3157, "lng": 123.8854}}',
 (SELECT id FROM regions WHERE code = 'CEB01' LIMIT 1), 3,
 'CN202301234568', '234-567-890-000', 'TNVS-CEB-2023-002',
 '2023-02-20', 82.25, 'tier_2',
 1800.00, 12600.00, 48000.00, 98000.00),

('TNVS003', 'Davao City Movers', 'Davao City Movers Corporation', 'DavaoMove', 'tnvs', 'active',
 '{"name": "Roberto Garcia", "phone": "+63905-111-2233", "email": "roberto@davaomove.ph", "position": "Owner-Operator"}',
 '{"street": "789 J.P. Laurel Avenue", "barangay": "Poblacion", "city": "Davao City", "province": "Davao del Sur", "postal_code": "8000", "coordinates": {"lat": 7.0731, "lng": 125.6128}}',
 (SELECT id FROM regions WHERE code = 'DAV01' LIMIT 1), 3,
 'CN202301234569', '345-678-901-000', 'TNVS-DAV-2023-003',
 '2023-03-10', 91.75, 'tier_3',
 3200.00, 22400.00, 67000.00, 156000.00),

-- General Operators (max 10 vehicles)
('GEN001', 'Northern Luzon Fleet Services', 'Northern Luzon Fleet Services Corporation', 'NorthFleet', 'general', 'active',
 '{"name": "Elena Rodriguez", "phone": "+63918-444-5555", "email": "elena@northfleet.ph", "position": "Fleet Manager"}',
 '{"street": "321 MacArthur Highway", "barangay": "San Fernando", "city": "San Fernando", "province": "Pampanga", "postal_code": "2000", "coordinates": {"lat": 15.0392, "lng": 120.6897}}',
 (SELECT id FROM regions WHERE code = 'PAM01' LIMIT 1), 10,
 'CN202301234570', '456-789-012-000', 'GEN-PAM-2023-001',
 '2022-06-15', 85.40, 'tier_2',
 5400.00, 37800.00, 142000.00, 420000.00),

('GEN002', 'Iloilo Provincial Transport', 'Iloilo Provincial Transport Inc.', 'IloiloTrans', 'general', 'active',
 '{"name": "Carlos Mendoza", "phone": "+63933-777-8888", "email": "carlos@iloilotrans.ph", "position": "Operations Director"}',
 '{"street": "654 Rizal Street", "barangay": "City Proper", "city": "Iloilo City", "province": "Iloilo", "postal_code": "5000", "coordinates": {"lat": 10.6958, "lng": 122.5649}}',
 (SELECT id FROM regions WHERE code = 'ILO01' LIMIT 1), 10,
 'CN202301234571', '567-890-123-000', 'GEN-ILO-2023-002',
 '2022-09-01', 76.80, 'tier_1',
 4200.00, 29400.00, 108000.00, 285000.00),

-- Fleet Operators (unlimited vehicles)
('FLT001', 'Manila Bay Logistics Fleet', 'Manila Bay Logistics and Transport Corporation', 'BayLogistics', 'fleet', 'active',
 '{"name": "Patricia Lim", "phone": "+63917-999-0000", "email": "patricia@baylogistics.ph", "position": "Chief Operations Officer"}',
 '{"street": "1234 Roxas Boulevard", "barangay": "Malate", "city": "Manila", "province": "Metro Manila", "postal_code": "1004", "coordinates": {"lat": 14.5764, "lng": 120.9828}}',
 (SELECT id FROM regions WHERE code = 'MM01' LIMIT 1), 50,
 'CN202301234572', '678-901-234-000', 'FLT-MM-2023-001',
 '2021-04-10', 88.90, 'tier_3',
 12500.00, 87500.00, 340000.00, 1250000.00),

('FLT002', 'Visayas Regional Fleet', 'Visayas Regional Fleet Corporation', 'VisFleet', 'fleet', 'active',
 '{"name": "Antonio Cruz", "phone": "+63922-333-4444", "email": "antonio@visfleet.ph", "position": "Regional Manager"}',
 '{"street": "2468 Capitol Site", "barangay": "Capitol Site", "city": "Cebu City", "province": "Cebu", "postal_code": "6000", "coordinates": {"lat": 10.2937, "lng": 123.9018}}',
 (SELECT id FROM regions WHERE code = 'CEB01' LIMIT 1), 35,
 'CN202301234573', '789-012-345-000', 'FLT-CEB-2023-002',
 '2021-08-20', 92.15, 'tier_3',
 9800.00, 68600.00, 275000.00, 890000.00);

-- =====================================================
-- OPERATOR LOCATIONS FOR MULTI-LOCATION OPERATORS
-- =====================================================

INSERT INTO operator_locations (
    operator_id, location_type, name, address, location, region_id,
    operating_hours, capacity_vehicles, current_vehicles
) VALUES

-- Locations for Manila Bay Logistics Fleet (FLT001)
((SELECT id FROM operators WHERE operator_code = 'FLT001'), 'headquarters', 'Manila Bay HQ',
 '{"street": "1234 Roxas Boulevard", "barangay": "Malate", "city": "Manila", "province": "Metro Manila", "postal_code": "1004"}',
 ST_GeomFromText('POINT(120.9828 14.5764)', 4326),
 (SELECT id FROM regions WHERE code = 'MM01' LIMIT 1),
 '{"start": "04:00", "end": "24:00"}', 25, 20),

((SELECT id FROM operators WHERE operator_code = 'FLT001'), 'branch', 'Quezon City Branch',
 '{"street": "5678 EDSA", "barangay": "Diliman", "city": "Quezon City", "province": "Metro Manila", "postal_code": "1101"}',
 ST_GeomFromText('POINT(121.0437 14.6507)', 4326),
 (SELECT id FROM regions WHERE code = 'MM01' LIMIT 1),
 '{"start": "05:00", "end": "23:00"}', 15, 12),

((SELECT id FROM operators WHERE operator_code = 'FLT001'), 'garage', 'Pasig Maintenance Facility',
 '{"street": "9012 C5 Road", "barangay": "Ugong", "city": "Pasig", "province": "Metro Manila", "postal_code": "1604"}',
 ST_GeomFromText('POINT(121.0655 14.5764)', 4326),
 (SELECT id FROM regions WHERE code = 'MM01' LIMIT 1),
 '{"start": "06:00", "end": "22:00"}', 20, 8),

-- Locations for Visayas Regional Fleet (FLT002)
((SELECT id FROM operators WHERE operator_code = 'FLT002'), 'headquarters', 'Cebu Main Office',
 '{"street": "2468 Capitol Site", "barangay": "Capitol Site", "city": "Cebu City", "province": "Cebu", "postal_code": "6000"}',
 ST_GeomFromText('POINT(123.9018 10.2937)', 4326),
 (SELECT id FROM regions WHERE code = 'CEB01' LIMIT 1),
 '{"start": "04:30", "end": "23:30"}', 20, 18),

((SELECT id FROM operators WHERE operator_code = 'FLT002'), 'branch', 'Lapu-Lapu Terminal',
 '{"street": "3579 Airport Road", "barangay": "Gun-ob", "city": "Lapu-Lapu", "province": "Cebu", "postal_code": "6015"}',
 ST_GeomFromText('POINT(124.0058 10.3103)', 4326),
 (SELECT id FROM regions WHERE code = 'CEB01' LIMIT 1),
 '{"start": "03:00", "end": "24:00"}', 15, 12);

-- =====================================================
-- SAMPLE PERFORMANCE SCORES HISTORY
-- =====================================================

-- Generate performance scores for the last 30 days
INSERT INTO operator_performance_scores (
    operator_id, scoring_period, scoring_frequency,
    vehicle_utilization_score, driver_management_score, 
    compliance_safety_score, platform_contribution_score,
    total_score, commission_tier, is_final
)
SELECT 
    o.id,
    generate_series(CURRENT_DATE - INTERVAL '29 days', CURRENT_DATE, INTERVAL '1 day')::date,
    'daily',
    -- Add some variation to scores over time
    o.performance_score * 0.3 + random() * 5 - 2.5, -- Vehicle utilization (30 points max)
    o.performance_score * 0.25 + random() * 3 - 1.5, -- Driver management (25 points max)
    o.performance_score * 0.25 + random() * 3 - 1.5, -- Compliance & safety (25 points max)
    o.performance_score * 0.2 + random() * 2 - 1, -- Platform contribution (20 points max)
    GREATEST(50.0, LEAST(100.0, o.performance_score + random() * 10 - 5)), -- Total with variation
    o.commission_tier,
    TRUE
FROM operators o
WHERE o.is_active = TRUE;

-- =====================================================
-- SAMPLE FINANCIAL TRANSACTIONS
-- =====================================================

-- Generate commission transactions for completed bookings
INSERT INTO operator_financial_transactions (
    operator_id, transaction_type, amount, reference_number, description,
    base_fare, commission_rate, commission_tier, calculation_method,
    transaction_date, payment_status
)
SELECT 
    od.operator_id,
    'commission_earned',
    b.total_fare * 
    CASE o.commission_tier 
        WHEN 'tier_1' THEN 0.01 
        WHEN 'tier_2' THEN 0.02 
        WHEN 'tier_3' THEN 0.03 
        ELSE 0.01 
    END,
    CONCAT('COMM-', b.booking_reference),
    CONCAT('Commission for booking ', b.booking_reference),
    b.total_fare,
    CASE o.commission_tier 
        WHEN 'tier_1' THEN 1.00 
        WHEN 'tier_2' THEN 2.00 
        WHEN 'tier_3' THEN 3.00 
        ELSE 1.00 
    END,
    o.commission_tier,
    'percentage',
    b.completed_at::date,
    'completed'
FROM bookings b
JOIN operator_drivers od ON b.driver_id = od.driver_id
JOIN operators o ON od.operator_id = o.id
WHERE b.status = 'completed'
AND b.total_fare IS NOT NULL
AND b.completed_at >= CURRENT_DATE - INTERVAL '30 days'
AND od.is_active = TRUE
LIMIT 500; -- Limit to prevent too much test data

-- Generate sample incentive bonuses
INSERT INTO operator_financial_transactions (
    operator_id, transaction_type, amount, reference_number, description,
    transaction_date, payment_status
)
SELECT 
    o.id,
    'incentive_bonus',
    CASE 
        WHEN o.performance_score >= 90 THEN 1000.00
        WHEN o.performance_score >= 85 THEN 500.00
        WHEN o.performance_score >= 80 THEN 250.00
        ELSE 0
    END,
    CONCAT('BONUS-', o.operator_code, '-', TO_CHAR(CURRENT_DATE, 'YYYYMMDD')),
    'Monthly performance bonus',
    DATE_TRUNC('month', CURRENT_DATE)::date,
    'completed'
FROM operators o
WHERE o.is_active = TRUE
AND o.performance_score >= 80;

-- =====================================================
-- SAMPLE BOUNDARY FEES
-- =====================================================

-- Generate boundary fees for active drivers
INSERT INTO operator_boundary_fees (
    operator_id, driver_id, fee_date, vehicle_plate_number,
    base_boundary_fee, fuel_subsidy, maintenance_allowance, 
    performance_adjustment, bonus_earned, total_amount,
    driver_performance_score, trips_completed, hours_worked,
    driver_gross_earnings, service_type, payment_status
)
SELECT 
    od.operator_id,
    od.driver_id,
    generate_series(CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE - INTERVAL '1 day', INTERVAL '1 day')::date,
    CONCAT('ABC-', LPAD((ROW_NUMBER() OVER ())::text, 4, '0')),
    500.00, -- Base boundary fee
    50.00,  -- Fuel subsidy
    25.00,  -- Maintenance allowance
    CASE 
        WHEN od.driver_performance_score >= 85 THEN 0.00
        WHEN od.driver_performance_score >= 75 THEN -25.00
        WHEN od.driver_performance_score < 60 THEN -100.00
        ELSE -50.00
    END,
    CASE WHEN od.driver_performance_score >= 85 THEN 50.00 ELSE 0.00 END,
    500.00 + 50.00 + 25.00 + 
    CASE 
        WHEN od.driver_performance_score >= 85 THEN 50.00
        WHEN od.driver_performance_score >= 75 THEN -25.00
        WHEN od.driver_performance_score < 60 THEN -100.00
        ELSE -50.00
    END,
    od.driver_performance_score,
    5 + (random() * 8)::int, -- 5-13 trips
    8.0 + (random() * 4.0),  -- 8-12 hours
    2500.00 + (random() * 1500.00), -- 2500-4000 earnings
    'ride_4w',
    CASE WHEN random() > 0.1 THEN 'completed' ELSE 'pending' END
FROM operator_drivers od
WHERE od.is_active = TRUE
AND od.employment_status = 'active'
LIMIT 200; -- Limit for testing

-- =====================================================
-- SAMPLE IMPROVEMENT PLANS
-- =====================================================

INSERT INTO operator_improvement_plans (
    operator_id, plan_name, description, priority, trigger_score,
    focus_areas, target_score, timeline_days, action_items,
    total_milestones, start_date, target_completion_date,
    assigned_manager, status
) 
SELECT 
    o.id,
    CONCAT('Performance Improvement - ', o.business_name),
    'Comprehensive improvement plan to boost performance score and operational efficiency',
    CASE WHEN o.performance_score < 65 THEN 'high' ELSE 'medium' END,
    o.performance_score,
    ARRAY['vehicle_utilization', 'driver_management']::performance_metric_type[],
    LEAST(90.0, o.performance_score + 15.0),
    45,
    '{"items": ["Review and optimize vehicle deployment schedules", "Implement driver training program", "Improve vehicle maintenance scheduling", "Enhance customer service protocols", "Review and update operational procedures"]}'::jsonb,
    5,
    CURRENT_DATE - INTERVAL '15 days',
    CURRENT_DATE + INTERVAL '30 days',
    (SELECT id FROM users WHERE email LIKE '%manager%' LIMIT 1),
    'active'
FROM operators o
WHERE o.is_active = TRUE
AND o.performance_score < 80
LIMIT 3;

-- =====================================================
-- UPDATE OPERATOR VEHICLE COUNTS
-- =====================================================

-- Update current vehicle counts based on sample data
UPDATE operators SET current_vehicle_count = (
    SELECT COUNT(*)
    FROM operator_vehicles ov
    WHERE ov.operator_id = operators.id
    AND ov.is_active = TRUE
);

-- =====================================================
-- COMMISSION TIER QUALIFICATIONS
-- =====================================================

INSERT INTO commission_tier_qualifications (
    operator_id, target_tier, qualification_status, score_requirement,
    current_score, score_qualified, tenure_requirement, current_tenure,
    tenure_qualified, payment_consistency_requirement, 
    current_payment_consistency, payment_qualified,
    utilization_requirement, current_utilization_percentile,
    utilization_qualified, evaluation_date, next_evaluation_date
)
SELECT 
    o.id,
    CASE 
        WHEN o.performance_score >= 90 AND partnership_months >= 18 THEN 'tier_3'
        WHEN o.performance_score >= 80 AND partnership_months >= 12 THEN 'tier_2'
        ELSE 'tier_1'
    END,
    'qualified',
    CASE 
        WHEN o.performance_score >= 90 THEN 90.00
        WHEN o.performance_score >= 80 THEN 80.00
        ELSE 70.00
    END,
    o.performance_score,
    TRUE,
    CASE 
        WHEN o.performance_score >= 90 THEN 18
        WHEN o.performance_score >= 80 THEN 12
        ELSE 6
    END,
    partnership_months,
    partnership_months >= CASE 
        WHEN o.performance_score >= 90 THEN 18
        WHEN o.performance_score >= 80 THEN 12
        ELSE 6
    END,
    95.00,
    92.5 + (random() * 7.5), -- Random consistency between 92.5-100%
    TRUE,
    75.00,
    50.0 + (random() * 50.0), -- Random percentile
    random() > 0.3, -- 70% qualified for utilization
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '3 months'
FROM (
    SELECT *,
           EXTRACT(MONTHS FROM AGE(CURRENT_DATE, partnership_start_date)) as partnership_months
    FROM operators
    WHERE is_active = TRUE
) o;

-- =====================================================
-- COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON TABLE operators IS 'Sample operators created: 3 TNVS, 2 General, 2 Fleet operators across different regions';
COMMENT ON TABLE operator_locations IS 'Multi-location facilities for fleet operators with headquarters, branches, and maintenance facilities';
COMMENT ON TABLE operator_performance_scores IS '30-day historical performance data with realistic score variations';
COMMENT ON TABLE operator_financial_transactions IS 'Commission transactions based on completed bookings with tier-based rates';
COMMENT ON TABLE operator_boundary_fees IS 'Daily boundary fee collection with performance-based adjustments';
COMMENT ON TABLE operator_improvement_plans IS 'Active improvement plans for underperforming operators';
COMMENT ON TABLE commission_tier_qualifications IS 'Current tier qualification status for all operators';