-- =====================================================
-- OPERATOR MANAGEMENT FUNCTIONS AND CALCULATIONS
-- Migration 048: Core functions for performance scoring and commission tier logic
-- Implements automated calculations and business rule enforcement
-- =====================================================

-- =====================================================
-- PERFORMANCE SCORE CALCULATION FUNCTIONS
-- =====================================================

-- Function to calculate vehicle utilization score (30 points max)
CREATE OR REPLACE FUNCTION calculate_vehicle_utilization_score(
    p_operator_id UUID,
    p_scoring_date DATE DEFAULT CURRENT_DATE
)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    v_daily_utilization DECIMAL(5,2) := 0.00;
    v_peak_availability DECIMAL(5,2) := 0.00;
    v_fleet_efficiency DECIMAL(5,2) := 0.00;
    v_total_score DECIMAL(5,2) := 0.00;
    v_vehicle_count INTEGER := 0;
    v_total_trips INTEGER := 0;
    v_total_hours DECIMAL(6,2) := 0.00;
BEGIN
    -- Get operator vehicle count
    SELECT current_vehicle_count INTO v_vehicle_count
    FROM operators WHERE id = p_operator_id;
    
    IF v_vehicle_count = 0 THEN
        RETURN 0.00;
    END IF;
    
    -- Calculate daily utilization (vehicles active vs total)
    SELECT 
        COALESCE(AVG(
            CASE 
                WHEN d.status IN ('active', 'busy') THEN 100.0 
                ELSE 0.0 
            END
        ), 0) INTO v_daily_utilization
    FROM operator_vehicles ov
    JOIN drivers d ON ov.assigned_driver_id = d.id
    WHERE ov.operator_id = p_operator_id 
    AND ov.is_active = TRUE
    AND d.created_at::date = p_scoring_date;
    
    -- Calculate peak hour availability (7-9 AM, 5-7 PM)
    SELECT 
        COALESCE(COUNT(*) * 100.0 / NULLIF(v_vehicle_count, 0), 0) INTO v_peak_availability
    FROM operator_vehicles ov
    JOIN drivers d ON ov.assigned_driver_id = d.id
    JOIN driver_locations dl ON d.id = dl.driver_id
    WHERE ov.operator_id = p_operator_id
    AND ov.is_active = TRUE
    AND dl.recorded_at::date = p_scoring_date
    AND (
        EXTRACT(HOUR FROM dl.recorded_at) BETWEEN 7 AND 9 OR
        EXTRACT(HOUR FROM dl.recorded_at) BETWEEN 17 AND 19
    )
    AND dl.is_available = TRUE;
    
    -- Calculate fleet efficiency (trips per vehicle vs market average)
    SELECT 
        COUNT(*) INTO v_total_trips
    FROM bookings b
    JOIN operator_drivers od ON b.driver_id = od.driver_id
    WHERE od.operator_id = p_operator_id
    AND b.created_at::date = p_scoring_date
    AND b.status = 'completed';
    
    -- Fleet efficiency ratio (assuming market average is 8 trips per vehicle per day)
    v_fleet_efficiency := LEAST(100.0, (v_total_trips::decimal / NULLIF(v_vehicle_count, 0) / 8.0) * 100.0);
    
    -- Apply category weights and calculate total score
    -- Daily utilization: 40% weight = 12 points max
    -- Peak availability: 30% weight = 9 points max  
    -- Fleet efficiency: 30% weight = 9 points max
    v_total_score := 
        (v_daily_utilization * 0.12) + 
        (v_peak_availability * 0.09) + 
        (v_fleet_efficiency * 0.09);
    
    RETURN GREATEST(0.00, LEAST(30.00, v_total_score));
END;
$$ LANGUAGE plpgsql;

-- Function to calculate driver management score (25 points max)
CREATE OR REPLACE FUNCTION calculate_driver_management_score(
    p_operator_id UUID,
    p_scoring_date DATE DEFAULT CURRENT_DATE
)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    v_retention_rate DECIMAL(5,2) := 0.00;
    v_avg_performance DECIMAL(5,2) := 0.00;
    v_training_completion DECIMAL(5,2) := 0.00;
    v_total_score DECIMAL(5,2) := 0.00;
    v_driver_count INTEGER := 0;
    v_retained_drivers INTEGER := 0;
BEGIN
    -- Get current active driver count
    SELECT COUNT(*) INTO v_driver_count
    FROM operator_drivers od
    WHERE od.operator_id = p_operator_id
    AND od.is_active = TRUE
    AND od.employment_status = 'active';
    
    IF v_driver_count = 0 THEN
        RETURN 0.00;
    END IF;
    
    -- Calculate 12-month retention rate
    SELECT COUNT(*) INTO v_retained_drivers
    FROM operator_drivers od
    WHERE od.operator_id = p_operator_id
    AND od.is_active = TRUE
    AND od.contract_start_date <= p_scoring_date - INTERVAL '12 months'
    AND (od.contract_end_date IS NULL OR od.contract_end_date > p_scoring_date);
    
    v_retention_rate := CASE 
        WHEN v_driver_count > 0 THEN (v_retained_drivers::decimal / v_driver_count) * 100.0
        ELSE 0.00
    END;
    
    -- Calculate average driver performance score
    SELECT COALESCE(AVG(od.driver_performance_score), 0.00) INTO v_avg_performance
    FROM operator_drivers od
    WHERE od.operator_id = p_operator_id
    AND od.is_active = TRUE
    AND od.employment_status = 'active';
    
    -- Calculate training completion rate (mock calculation - would integrate with training system)
    -- For now, assume 85% completion rate based on driver performance
    v_training_completion := GREATEST(0.00, v_avg_performance * 0.85);
    
    -- Apply category weights and calculate total score
    -- Retention rate: 35% weight = 8.75 points max
    -- Average performance: 35% weight = 8.75 points max
    -- Training completion: 30% weight = 7.5 points max
    v_total_score := 
        (LEAST(100.0, v_retention_rate) * 0.0875) +
        (LEAST(100.0, v_avg_performance) * 0.0875) +
        (LEAST(100.0, v_training_completion) * 0.075);
    
    RETURN GREATEST(0.00, LEAST(25.00, v_total_score));
END;
$$ LANGUAGE plpgsql;

-- Function to calculate compliance & safety score (25 points max)
CREATE OR REPLACE FUNCTION calculate_compliance_safety_score(
    p_operator_id UUID,
    p_scoring_date DATE DEFAULT CURRENT_DATE
)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    v_incident_rate DECIMAL(5,2) := 0.00;
    v_compliance_rate DECIMAL(5,2) := 0.00;
    v_maintenance_score DECIMAL(5,2) := 0.00;
    v_total_score DECIMAL(5,2) := 0.00;
    v_total_trips INTEGER := 0;
    v_safety_incidents INTEGER := 0;
    v_compliant_vehicles INTEGER := 0;
    v_total_vehicles INTEGER := 0;
BEGIN
    -- Get total trips for incident rate calculation
    SELECT COUNT(*) INTO v_total_trips
    FROM bookings b
    JOIN operator_drivers od ON b.driver_id = od.driver_id
    WHERE od.operator_id = p_operator_id
    AND b.created_at >= p_scoring_date - INTERVAL '30 days'
    AND b.status = 'completed';
    
    -- Get safety incidents in last 30 days
    SELECT COUNT(*) INTO v_safety_incidents
    FROM incidents i
    JOIN operator_drivers od ON i.driver_id = od.driver_id
    WHERE od.operator_id = p_operator_id
    AND i.created_at >= p_scoring_date - INTERVAL '30 days'
    AND i.priority IN ('critical', 'high')
    AND i.incident_type LIKE '%safety%';
    
    -- Calculate incident rate per 1000 trips (inverted score - lower is better)
    IF v_total_trips > 0 THEN
        v_incident_rate := (v_safety_incidents::decimal / v_total_trips) * 1000.0;
        -- Convert to score (excellent: <=0.5, good: <=1.0, average: <=2.0, poor: >2.0)
        v_incident_rate := CASE
            WHEN v_incident_rate <= 0.5 THEN 100.0
            WHEN v_incident_rate <= 1.0 THEN 75.0
            WHEN v_incident_rate <= 2.0 THEN 50.0
            ELSE 0.0
        END;
    ELSE
        v_incident_rate := 100.0; -- No trips = no incidents
    END IF;
    
    -- Calculate regulatory compliance rate
    SELECT 
        COUNT(*) FILTER (WHERE 
            ov.insurance_policy IS NOT NULL AND
            ov.or_number IS NOT NULL AND
            ov.cr_number IS NOT NULL AND
            ov.next_inspection_due >= CURRENT_DATE
        ),
        COUNT(*)
    INTO v_compliant_vehicles, v_total_vehicles
    FROM operator_vehicles ov
    WHERE ov.operator_id = p_operator_id
    AND ov.is_active = TRUE;
    
    v_compliance_rate := CASE
        WHEN v_total_vehicles > 0 THEN (v_compliant_vehicles::decimal / v_total_vehicles) * 100.0
        ELSE 100.0
    END;
    
    -- Calculate maintenance score (vehicles with up-to-date maintenance)
    SELECT 
        COUNT(*) FILTER (WHERE ov.next_maintenance_due >= CURRENT_DATE) * 100.0 / NULLIF(COUNT(*), 0)
    INTO v_maintenance_score
    FROM operator_vehicles ov
    WHERE ov.operator_id = p_operator_id
    AND ov.is_active = TRUE;
    
    v_maintenance_score := COALESCE(v_maintenance_score, 100.0);
    
    -- Apply category weights and calculate total score
    -- Safety incident rate: 40% weight = 10 points max
    -- Regulatory compliance: 35% weight = 8.75 points max
    -- Maintenance score: 25% weight = 6.25 points max
    v_total_score := 
        (v_incident_rate * 0.10) +
        (v_compliance_rate * 0.0875) +
        (v_maintenance_score * 0.0625);
    
    RETURN GREATEST(0.00, LEAST(25.00, v_total_score));
END;
$$ LANGUAGE plpgsql;

-- Function to calculate platform contribution score (20 points max)
CREATE OR REPLACE FUNCTION calculate_platform_contribution_score(
    p_operator_id UUID,
    p_scoring_date DATE DEFAULT CURRENT_DATE
)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    v_customer_satisfaction DECIMAL(5,2) := 0.00;
    v_service_coverage DECIMAL(5,2) := 0.00;
    v_technology_adoption DECIMAL(5,2) := 0.00;
    v_total_score DECIMAL(5,2) := 0.00;
    v_avg_rating DECIMAL(3,2) := 0.00;
    v_regions_covered INTEGER := 0;
    v_total_regions INTEGER := 0;
BEGIN
    -- Calculate average customer rating for operator's drivers
    SELECT COALESCE(AVG(b.customer_rating), 5.0) INTO v_avg_rating
    FROM bookings b
    JOIN operator_drivers od ON b.driver_id = od.driver_id
    WHERE od.operator_id = p_operator_id
    AND b.created_at >= p_scoring_date - INTERVAL '30 days'
    AND b.customer_rating IS NOT NULL
    AND b.status = 'completed';
    
    -- Convert rating to 0-100 scale (4.8-5.0 = excellent, etc.)
    v_customer_satisfaction := CASE
        WHEN v_avg_rating >= 4.8 THEN 100.0
        WHEN v_avg_rating >= 4.5 THEN 75.0
        WHEN v_avg_rating >= 4.0 THEN 50.0
        ELSE 25.0
    END;
    
    -- Calculate service area coverage
    SELECT 
        CARDINALITY(o.allowed_regions) + 1, -- +1 for primary region
        (SELECT COUNT(*) FROM regions WHERE is_active = TRUE)
    INTO v_regions_covered, v_total_regions
    FROM operators o
    WHERE o.id = p_operator_id;
    
    v_service_coverage := LEAST(100.0, (v_regions_covered::decimal / NULLIF(v_total_regions, 0)) * 100.0);
    
    -- Calculate technology adoption (mock calculation - would integrate with app usage metrics)
    -- For now, base on vehicle utilization and booking completion rate
    SELECT 
        COUNT(*) FILTER (WHERE b.status = 'completed') * 100.0 / NULLIF(COUNT(*), 0)
    INTO v_technology_adoption
    FROM bookings b
    JOIN operator_drivers od ON b.driver_id = od.driver_id
    WHERE od.operator_id = p_operator_id
    AND b.created_at >= p_scoring_date - INTERVAL '7 days';
    
    v_technology_adoption := COALESCE(v_technology_adoption, 75.0);
    
    -- Apply category weights and calculate total score
    -- Customer satisfaction: 40% weight = 8 points max
    -- Service coverage: 30% weight = 6 points max
    -- Technology adoption: 30% weight = 6 points max
    v_total_score := 
        (v_customer_satisfaction * 0.08) +
        (v_service_coverage * 0.06) +
        (v_technology_adoption * 0.06);
    
    RETURN GREATEST(0.00, LEAST(20.00, v_total_score));
END;
$$ LANGUAGE plpgsql;

-- Master function to calculate overall performance score
CREATE OR REPLACE FUNCTION calculate_operator_performance_score(
    p_operator_id UUID,
    p_scoring_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
    vehicle_utilization_score DECIMAL(5,2),
    driver_management_score DECIMAL(5,2),
    compliance_safety_score DECIMAL(5,2),
    platform_contribution_score DECIMAL(5,2),
    total_score DECIMAL(5,2)
) AS $$
DECLARE
    v_vehicle_score DECIMAL(5,2);
    v_driver_score DECIMAL(5,2);
    v_compliance_score DECIMAL(5,2);
    v_platform_score DECIMAL(5,2);
    v_total DECIMAL(5,2);
BEGIN
    -- Calculate individual scores
    v_vehicle_score := calculate_vehicle_utilization_score(p_operator_id, p_scoring_date);
    v_driver_score := calculate_driver_management_score(p_operator_id, p_scoring_date);
    v_compliance_score := calculate_compliance_safety_score(p_operator_id, p_scoring_date);
    v_platform_score := calculate_platform_contribution_score(p_operator_id, p_scoring_date);
    
    -- Calculate total score (sum of weighted category scores)
    v_total := v_vehicle_score + v_driver_score + v_compliance_score + v_platform_score;
    
    RETURN QUERY SELECT 
        v_vehicle_score,
        v_driver_score,
        v_compliance_score,
        v_platform_score,
        v_total;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMISSION TIER CALCULATION FUNCTIONS
-- =====================================================

-- Function to determine commission tier eligibility
CREATE OR REPLACE FUNCTION determine_commission_tier(
    p_operator_id UUID,
    p_evaluation_date DATE DEFAULT CURRENT_DATE
)
RETURNS commission_tier AS $$
DECLARE
    v_performance_score DECIMAL(5,2);
    v_tenure_months INTEGER;
    v_payment_consistency DECIMAL(5,2);
    v_utilization_percentile DECIMAL(5,2);
    v_current_tier commission_tier;
BEGIN
    -- Get current performance score
    SELECT ops.total_score INTO v_performance_score
    FROM operator_performance_scores ops
    WHERE ops.operator_id = p_operator_id
    AND ops.scoring_period = p_evaluation_date
    AND ops.is_final = TRUE
    ORDER BY ops.calculated_at DESC
    LIMIT 1;
    
    -- If no score available, calculate it
    IF v_performance_score IS NULL THEN
        SELECT total_score INTO v_performance_score
        FROM calculate_operator_performance_score(p_operator_id, p_evaluation_date);
    END IF;
    
    -- Calculate tenure in months
    SELECT 
        EXTRACT(YEAR FROM AGE(p_evaluation_date, o.partnership_start_date)) * 12 +
        EXTRACT(MONTH FROM AGE(p_evaluation_date, o.partnership_start_date))
    INTO v_tenure_months
    FROM operators o
    WHERE o.id = p_operator_id;
    
    -- Calculate payment consistency (last 6 months)
    SELECT 
        COUNT(*) FILTER (WHERE obf.payment_status = 'completed' AND obf.paid_at <= obf.fee_date + INTERVAL '7 days') * 100.0 /
        NULLIF(COUNT(*), 0)
    INTO v_payment_consistency
    FROM operator_boundary_fees obf
    WHERE obf.operator_id = p_operator_id
    AND obf.fee_date >= p_evaluation_date - INTERVAL '6 months'
    AND obf.fee_date <= p_evaluation_date;
    
    -- Calculate utilization percentile (mock calculation)
    -- In reality, this would compare against all operators in the same region/type
    v_utilization_percentile := LEAST(100.0, v_performance_score * 1.2);
    
    -- Determine tier based on requirements
    -- Tier 3: 90+ score, 18+ months, 95%+ payment consistency, top 25% utilization
    IF v_performance_score >= 90.00 AND 
       v_tenure_months >= 18 AND 
       COALESCE(v_payment_consistency, 0) >= 95.00 AND 
       COALESCE(v_utilization_percentile, 0) >= 75.00 THEN
        RETURN 'tier_3';
    END IF;
    
    -- Tier 2: 80+ score, 12+ months, 90%+ payment consistency, top 50% utilization
    IF v_performance_score >= 80.00 AND 
       v_tenure_months >= 12 AND 
       COALESCE(v_payment_consistency, 0) >= 90.00 AND 
       COALESCE(v_utilization_percentile, 0) >= 50.00 THEN
        RETURN 'tier_2';
    END IF;
    
    -- Tier 1: 70+ score, 6+ months, 90%+ payment consistency
    IF v_performance_score >= 70.00 AND 
       v_tenure_months >= 6 AND 
       COALESCE(v_payment_consistency, 0) >= 90.00 THEN
        RETURN 'tier_1';
    END IF;
    
    -- Default to tier_1 if minimum requirements not met
    RETURN 'tier_1';
END;
$$ LANGUAGE plpgsql;

-- Function to calculate commission amount based on tier
CREATE OR REPLACE FUNCTION calculate_commission_amount(
    p_base_fare DECIMAL(10,2),
    p_commission_tier commission_tier,
    p_operator_id UUID DEFAULT NULL
)
RETURNS DECIMAL(8,2) AS $$
DECLARE
    v_commission_rate DECIMAL(5,2);
    v_commission_amount DECIMAL(8,2);
BEGIN
    -- Get commission rate for tier
    SELECT crc.rate_percentage INTO v_commission_rate
    FROM commission_rate_configs crc
    WHERE crc.commission_tier = p_commission_tier
    AND crc.effective_from <= CURRENT_DATE
    AND (crc.effective_until IS NULL OR crc.effective_until >= CURRENT_DATE)
    AND crc.is_active = TRUE
    ORDER BY crc.effective_from DESC
    LIMIT 1;
    
    -- Default rates if configuration not found
    IF v_commission_rate IS NULL THEN
        v_commission_rate := CASE p_commission_tier
            WHEN 'tier_1' THEN 1.00
            WHEN 'tier_2' THEN 2.00
            WHEN 'tier_3' THEN 3.00
            ELSE 1.00
        END;
    END IF;
    
    -- Calculate commission amount
    v_commission_amount := p_base_fare * (v_commission_rate / 100.0);
    
    RETURN ROUND(v_commission_amount, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to update operator commission tier
CREATE OR REPLACE FUNCTION update_operator_commission_tier(
    p_operator_id UUID,
    p_evaluation_date DATE DEFAULT CURRENT_DATE
)
RETURNS BOOLEAN AS $$
DECLARE
    v_new_tier commission_tier;
    v_current_tier commission_tier;
    v_tier_changed BOOLEAN := FALSE;
BEGIN
    -- Get current tier
    SELECT o.commission_tier INTO v_current_tier
    FROM operators o
    WHERE o.id = p_operator_id;
    
    -- Determine new tier
    v_new_tier := determine_commission_tier(p_operator_id, p_evaluation_date);
    
    -- Update if tier changed
    IF v_new_tier != v_current_tier THEN
        UPDATE operators 
        SET 
            commission_tier = v_new_tier,
            tier_qualification_date = p_evaluation_date,
            updated_at = NOW()
        WHERE id = p_operator_id;
        
        -- Log the tier change in audit table
        INSERT INTO operator_financial_audit (
            operator_id, event_type, event_category, 
            tier_before, tier_after, change_reason
        ) VALUES (
            p_operator_id, 'tier_changed', 'commission',
            v_current_tier, v_new_tier, 
            'Automated tier evaluation based on performance and tenure'
        );
        
        v_tier_changed := TRUE;
    END IF;
    
    RETURN v_tier_changed;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FINANCIAL CALCULATION FUNCTIONS
-- =====================================================

-- Function to process daily boundary fee calculation
CREATE OR REPLACE FUNCTION process_boundary_fee_calculation(
    p_operator_id UUID,
    p_driver_id UUID,
    p_fee_date DATE,
    p_vehicle_plate_number VARCHAR(20)
)
RETURNS UUID AS $$
DECLARE
    v_boundary_fee_id UUID;
    v_base_fee DECIMAL(8,2) := 500.00; -- Default base boundary fee
    v_performance_score DECIMAL(5,2);
    v_performance_adjustment DECIMAL(8,2) := 0.00;
    v_bonus_earned DECIMAL(8,2) := 0.00;
    v_total_amount DECIMAL(8,2);
    v_trips_completed INTEGER := 0;
    v_hours_worked DECIMAL(6,2) := 0.00;
    v_driver_earnings DECIMAL(10,2) := 0.00;
BEGIN
    -- Get driver performance score
    SELECT od.driver_performance_score INTO v_performance_score
    FROM operator_drivers od
    WHERE od.operator_id = p_operator_id 
    AND od.driver_id = p_driver_id
    AND od.is_active = TRUE;
    
    -- Get driver metrics for the day
    SELECT 
        COUNT(*) FILTER (WHERE b.status = 'completed'),
        SUM(EXTRACT(EPOCH FROM (b.completed_at - b.actual_pickup_time)) / 3600.0),
        SUM(COALESCE(b.total_fare, 0))
    INTO v_trips_completed, v_hours_worked, v_driver_earnings
    FROM bookings b
    WHERE b.driver_id = p_driver_id
    AND b.created_at::date = p_fee_date
    AND b.status IN ('completed', 'cancelled');
    
    -- Calculate performance adjustments
    IF v_performance_score IS NOT NULL THEN
        -- Performance bonus for high performers (>85 score)
        IF v_performance_score >= 85.0 THEN
            v_bonus_earned := 50.00;
        ELSIF v_performance_score >= 75.0 THEN
            v_bonus_earned := 25.00;
        END IF;
        
        -- Performance penalty for low performers (<60 score)
        IF v_performance_score < 60.0 THEN
            v_performance_adjustment := -100.00;
        ELSIF v_performance_score < 70.0 THEN
            v_performance_adjustment := -50.00;
        END IF;
    END IF;
    
    -- Calculate total boundary fee
    v_total_amount := v_base_fee + v_performance_adjustment + v_bonus_earned;
    
    -- Insert boundary fee record
    INSERT INTO operator_boundary_fees (
        operator_id, driver_id, fee_date, vehicle_plate_number,
        base_boundary_fee, performance_adjustment, bonus_earned, total_amount,
        driver_performance_score, trips_completed, hours_worked, 
        driver_gross_earnings, service_type
    ) VALUES (
        p_operator_id, p_driver_id, p_fee_date, p_vehicle_plate_number,
        v_base_fee, v_performance_adjustment, v_bonus_earned, v_total_amount,
        v_performance_score, v_trips_completed, v_hours_worked,
        v_driver_earnings, 'ride_4w' -- Default service type
    ) RETURNING id INTO v_boundary_fee_id;
    
    RETURN v_boundary_fee_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- BATCH PROCESSING FUNCTIONS
-- =====================================================

-- Function to calculate performance scores for all operators
CREATE OR REPLACE FUNCTION batch_calculate_performance_scores(
    p_scoring_date DATE DEFAULT CURRENT_DATE
)
RETURNS INTEGER AS $$
DECLARE
    v_operator_id UUID;
    v_scores RECORD;
    v_processed_count INTEGER := 0;
BEGIN
    -- Process each active operator
    FOR v_operator_id IN 
        SELECT id FROM operators WHERE is_active = TRUE AND status = 'active'
    LOOP
        -- Calculate scores
        SELECT * INTO v_scores 
        FROM calculate_operator_performance_score(v_operator_id, p_scoring_date);
        
        -- Insert or update performance score record
        INSERT INTO operator_performance_scores (
            operator_id, scoring_period, scoring_frequency,
            vehicle_utilization_score, driver_management_score,
            compliance_safety_score, platform_contribution_score,
            total_score, is_final
        ) VALUES (
            v_operator_id, p_scoring_date, 'daily',
            v_scores.vehicle_utilization_score,
            v_scores.driver_management_score,
            v_scores.compliance_safety_score,
            v_scores.platform_contribution_score,
            v_scores.total_score,
            TRUE
        )
        ON CONFLICT (operator_id, scoring_period, scoring_frequency)
        DO UPDATE SET
            vehicle_utilization_score = EXCLUDED.vehicle_utilization_score,
            driver_management_score = EXCLUDED.driver_management_score,
            compliance_safety_score = EXCLUDED.compliance_safety_score,
            platform_contribution_score = EXCLUDED.platform_contribution_score,
            total_score = EXCLUDED.total_score,
            calculated_at = NOW(),
            is_final = TRUE;
        
        -- Update operator's current performance score
        UPDATE operators 
        SET performance_score = v_scores.total_score
        WHERE id = v_operator_id;
        
        -- Update commission tier if needed
        PERFORM update_operator_commission_tier(v_operator_id, p_scoring_date);
        
        v_processed_count := v_processed_count + 1;
    END LOOP;
    
    RETURN v_processed_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON FUNCTION calculate_vehicle_utilization_score IS 'Calculate vehicle utilization score (30 points max): daily utilization, peak availability, fleet efficiency';
COMMENT ON FUNCTION calculate_driver_management_score IS 'Calculate driver management score (25 points max): retention, performance, training completion';
COMMENT ON FUNCTION calculate_compliance_safety_score IS 'Calculate compliance & safety score (25 points max): incident rate, regulatory compliance, maintenance';
COMMENT ON FUNCTION calculate_platform_contribution_score IS 'Calculate platform contribution score (20 points max): customer satisfaction, service coverage, technology adoption';
COMMENT ON FUNCTION calculate_operator_performance_score IS 'Master function to calculate complete operator performance score across all categories';
COMMENT ON FUNCTION determine_commission_tier IS 'Determine commission tier eligibility based on performance, tenure, and payment consistency';
COMMENT ON FUNCTION calculate_commission_amount IS 'Calculate commission amount based on base fare and operator tier (1%, 2%, or 3%)';
COMMENT ON FUNCTION process_boundary_fee_calculation IS 'Process daily boundary fee calculation with performance-based adjustments';
COMMENT ON FUNCTION batch_calculate_performance_scores IS 'Batch process performance score calculations for all active operators';