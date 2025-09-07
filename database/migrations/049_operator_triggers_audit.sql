-- =====================================================
-- OPERATOR MANAGEMENT TRIGGERS AND AUDIT SYSTEM
-- Migration 049: Comprehensive audit logging and automated triggers
-- Implements real-time audit trails and business rule enforcement
-- =====================================================

-- =====================================================
-- AUDIT TRIGGER FUNCTIONS
-- =====================================================

-- Generic audit trigger function for operator management
CREATE OR REPLACE FUNCTION audit_operator_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_old_values JSONB;
    v_new_values JSONB;
    v_changed_fields TEXT[] := '{}';
    v_event_type VARCHAR(50);
    v_event_category VARCHAR(50) := 'operator_management';
BEGIN
    -- Determine operation type
    IF TG_OP = 'INSERT' THEN
        v_event_type := 'created';
        v_new_values := to_jsonb(NEW);
        v_old_values := NULL;
    ELSIF TG_OP = 'UPDATE' THEN
        v_event_type := 'updated';
        v_old_values := to_jsonb(OLD);
        v_new_values := to_jsonb(NEW);
        
        -- Find changed fields
        v_changed_fields := array_agg(key)
        FROM jsonb_each(v_old_values) old
        JOIN jsonb_each(v_new_values) new ON old.key = new.key
        WHERE old.value != new.value;
        
    ELSIF TG_OP = 'DELETE' THEN
        v_event_type := 'deleted';
        v_old_values := to_jsonb(OLD);
        v_new_values := NULL;
    END IF;
    
    -- Insert audit record
    INSERT INTO operator_financial_audit (
        event_type, event_category,
        operator_id, 
        old_values, new_values,
        created_at
    ) VALUES (
        v_event_type, v_event_category,
        COALESCE(NEW.operator_id, OLD.operator_id),
        v_old_values, v_new_values,
        NOW()
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Audit trigger for performance score changes
CREATE OR REPLACE FUNCTION audit_performance_score_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_score_changed BOOLEAN := FALSE;
    v_tier_changed BOOLEAN := FALSE;
BEGIN
    IF TG_OP = 'UPDATE' THEN
        -- Check if performance score changed significantly (>1 point)
        IF ABS(OLD.performance_score - NEW.performance_score) > 1.00 THEN
            v_score_changed := TRUE;
        END IF;
        
        -- Check if commission tier changed
        IF OLD.commission_tier != NEW.commission_tier THEN
            v_tier_changed := TRUE;
        END IF;
        
        -- Log significant changes
        IF v_score_changed OR v_tier_changed THEN
            INSERT INTO operator_financial_audit (
                operator_id, event_type, event_category,
                score_before, score_after,
                tier_before, tier_after,
                change_reason
            ) VALUES (
                NEW.id, 'performance_updated', 'scoring',
                OLD.performance_score, NEW.performance_score,
                OLD.commission_tier, NEW.commission_tier,
                CASE 
                    WHEN v_tier_changed THEN 'Commission tier changed due to performance update'
                    ELSE 'Performance score updated'
                END
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Audit trigger for financial transactions
CREATE OR REPLACE FUNCTION audit_financial_transactions()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO operator_financial_audit (
            operator_id, transaction_id, event_type, event_category,
            amount_after, amount_changed,
            change_reason
        ) VALUES (
            NEW.operator_id, NEW.id, 'transaction_created', 'financial',
            NEW.amount, NEW.amount,
            CONCAT('New ', NEW.transaction_type, ' transaction: ', NEW.description)
        );
        
    ELSIF TG_OP = 'UPDATE' THEN
        -- Log payment status changes
        IF OLD.payment_status != NEW.payment_status THEN
            INSERT INTO operator_financial_audit (
                operator_id, transaction_id, event_type, event_category,
                old_values, new_values,
                change_reason
            ) VALUES (
                NEW.operator_id, NEW.id, 'payment_status_changed', 'financial',
                jsonb_build_object('payment_status', OLD.payment_status),
                jsonb_build_object('payment_status', NEW.payment_status),
                CONCAT('Payment status changed from ', OLD.payment_status, ' to ', NEW.payment_status)
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- BUSINESS RULE ENFORCEMENT TRIGGERS
-- =====================================================

-- Trigger to enforce vehicle limits and update performance scores
CREATE OR REPLACE FUNCTION enforce_vehicle_management_rules()
RETURNS TRIGGER AS $$
DECLARE
    v_operator_type operator_type;
    v_current_count INTEGER;
    v_max_allowed INTEGER;
    v_performance_impact DECIMAL(5,2) := 0.00;
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        -- Get operator info
        SELECT operator_type, max_vehicles, current_vehicle_count
        INTO v_operator_type, v_max_allowed, v_current_count
        FROM operators WHERE id = NEW.operator_id;
        
        -- Check vehicle limits during INSERT
        IF TG_OP = 'INSERT' AND NEW.is_active = TRUE THEN
            IF (v_operator_type = 'tnvs' AND v_current_count >= 3) OR
               (v_operator_type = 'general' AND v_current_count >= 10) THEN
                RAISE EXCEPTION 'Operator has reached maximum vehicle limit of % for type %', 
                    v_max_allowed, v_operator_type;
            END IF;
        END IF;
        
        -- Update operator performance if vehicle utilization changed
        IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
            -- Trigger performance recalculation (async job would be better in production)
            PERFORM calculate_operator_performance_score(NEW.operator_id, CURRENT_DATE);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically process commission calculations
CREATE OR REPLACE FUNCTION auto_process_commission_calculation()
RETURNS TRIGGER AS $$
DECLARE
    v_operator_id UUID;
    v_commission_tier commission_tier;
    v_commission_amount DECIMAL(8,2);
    v_transaction_id UUID;
BEGIN
    -- Only process for completed bookings with assigned drivers
    IF NEW.status = 'completed' AND NEW.driver_id IS NOT NULL AND NEW.total_fare IS NOT NULL THEN
        -- Find the operator for this driver
        SELECT od.operator_id, o.commission_tier
        INTO v_operator_id, v_commission_tier
        FROM operator_drivers od
        JOIN operators o ON od.operator_id = o.id
        WHERE od.driver_id = NEW.driver_id
        AND od.is_active = TRUE
        AND od.employment_status = 'active'
        LIMIT 1;
        
        -- If driver belongs to an operator, calculate commission
        IF v_operator_id IS NOT NULL THEN
            v_commission_amount := calculate_commission_amount(
                NEW.total_fare, 
                v_commission_tier, 
                v_operator_id
            );
            
            -- Create commission transaction
            INSERT INTO operator_financial_transactions (
                operator_id, booking_id, transaction_type,
                amount, base_fare, commission_rate, commission_tier,
                description, reference_number, transaction_date,
                calculation_method, payment_status
            ) VALUES (
                v_operator_id, NEW.id, 'commission_earned',
                v_commission_amount, NEW.total_fare, 
                CASE v_commission_tier 
                    WHEN 'tier_1' THEN 1.00
                    WHEN 'tier_2' THEN 2.00  
                    WHEN 'tier_3' THEN 3.00
                    ELSE 1.00
                END,
                v_commission_tier,
                CONCAT('Commission for booking ', NEW.booking_reference),
                CONCAT('COMM-', NEW.booking_reference, '-', EXTRACT(EPOCH FROM NOW())::bigint),
                NEW.completed_at::date,
                'percentage', 'completed'
            ) RETURNING id INTO v_transaction_id;
            
            -- Update operator earnings
            UPDATE operators 
            SET 
                earnings_today = earnings_today + 
                    CASE WHEN NEW.completed_at::date = CURRENT_DATE THEN v_commission_amount ELSE 0 END,
                earnings_week = earnings_week + 
                    CASE WHEN NEW.completed_at >= DATE_TRUNC('week', CURRENT_DATE) THEN v_commission_amount ELSE 0 END,
                earnings_month = earnings_month + 
                    CASE WHEN NEW.completed_at >= DATE_TRUNC('month', CURRENT_DATE) THEN v_commission_amount ELSE 0 END,
                total_commissions_earned = total_commissions_earned + v_commission_amount,
                updated_at = NOW()
            WHERE id = v_operator_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic boundary fee processing
CREATE OR REPLACE FUNCTION auto_process_boundary_fees()
RETURNS TRIGGER AS $$
DECLARE
    v_operator_id UUID;
    v_vehicle_plate VARCHAR(20);
    v_fee_date DATE;
BEGIN
    -- Process boundary fees when driver goes offline after working
    IF TG_OP = 'UPDATE' AND OLD.status IN ('active', 'busy') AND NEW.status = 'offline' THEN
        -- Find operator for this driver
        SELECT od.operator_id INTO v_operator_id
        FROM operator_drivers od
        WHERE od.driver_id = NEW.id
        AND od.is_active = TRUE
        AND od.employment_status = 'active'
        LIMIT 1;
        
        IF v_operator_id IS NOT NULL THEN
            -- Get vehicle plate number
            SELECT ov.vehicle_plate_number INTO v_vehicle_plate
            FROM operator_vehicles ov
            WHERE ov.assigned_driver_id = NEW.id
            AND ov.is_active = TRUE
            LIMIT 1;
            
            v_fee_date := CURRENT_DATE;
            
            -- Process boundary fee if not already processed today
            IF NOT EXISTS (
                SELECT 1 FROM operator_boundary_fees 
                WHERE operator_id = v_operator_id 
                AND driver_id = NEW.id 
                AND fee_date = v_fee_date
            ) THEN
                PERFORM process_boundary_fee_calculation(
                    v_operator_id, NEW.id, v_fee_date, v_vehicle_plate
                );
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to maintain driver performance scores within operator context
CREATE OR REPLACE FUNCTION update_operator_driver_performance()
RETURNS TRIGGER AS $$
DECLARE
    v_operator_id UUID;
    v_new_performance_score DECIMAL(5,2);
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.rating != NEW.rating THEN
        -- Find operators for this driver
        FOR v_operator_id IN 
            SELECT od.operator_id 
            FROM operator_drivers od 
            WHERE od.driver_id = NEW.id AND od.is_active = TRUE
        LOOP
            -- Calculate new performance score based on rating and other factors
            v_new_performance_score := NEW.rating * 20.0; -- Convert 5-star to 100-point scale
            
            -- Add completion rate bonus
            IF NEW.completion_rate > 0 THEN
                v_new_performance_score := v_new_performance_score + (NEW.completion_rate / 100.0 * 20.0);
            END IF;
            
            -- Update operator-driver performance score
            UPDATE operator_drivers 
            SET 
                driver_performance_score = LEAST(100.00, v_new_performance_score),
                updated_at = NOW()
            WHERE operator_id = v_operator_id AND driver_id = NEW.id;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- AUTOMATED MAINTENANCE TRIGGERS
-- =====================================================

-- Trigger to clean up expired temporary access and data
CREATE OR REPLACE FUNCTION cleanup_expired_operator_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Clean up expired performance incentives
    UPDATE operator_performance_incentives 
    SET is_active = FALSE
    WHERE valid_until < CURRENT_DATE AND is_active = TRUE;
    
    -- Mark expired improvement plans as cancelled if not completed
    UPDATE operator_improvement_plans 
    SET status = 'cancelled'
    WHERE target_completion_date < CURRENT_DATE 
    AND status = 'active' 
    AND actual_completion_date IS NULL;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CREATE TRIGGERS
-- =====================================================

-- Audit triggers for core operator tables
CREATE TRIGGER tr_audit_operators
    AFTER INSERT OR UPDATE OR DELETE ON operators
    FOR EACH ROW EXECUTE FUNCTION audit_operator_changes();

CREATE TRIGGER tr_audit_operator_locations  
    AFTER INSERT OR UPDATE OR DELETE ON operator_locations
    FOR EACH ROW EXECUTE FUNCTION audit_operator_changes();

CREATE TRIGGER tr_audit_operator_drivers
    AFTER INSERT OR UPDATE OR DELETE ON operator_drivers
    FOR EACH ROW EXECUTE FUNCTION audit_operator_changes();

CREATE TRIGGER tr_audit_operator_vehicles
    AFTER INSERT OR UPDATE OR DELETE ON operator_vehicles
    FOR EACH ROW EXECUTE FUNCTION audit_operator_changes();

-- Performance and scoring audit triggers
CREATE TRIGGER tr_audit_performance_scores
    AFTER UPDATE ON operators
    FOR EACH ROW EXECUTE FUNCTION audit_performance_score_changes();

-- Financial audit triggers
CREATE TRIGGER tr_audit_financial_transactions
    AFTER INSERT OR UPDATE ON operator_financial_transactions
    FOR EACH ROW EXECUTE FUNCTION audit_financial_transactions();

-- Business rule enforcement triggers
CREATE TRIGGER tr_enforce_vehicle_rules
    BEFORE INSERT OR UPDATE ON operator_vehicles
    FOR EACH ROW EXECUTE FUNCTION enforce_vehicle_management_rules();

-- Automatic commission processing
CREATE TRIGGER tr_auto_commission_calculation
    AFTER UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION auto_process_commission_calculation();

-- Automatic boundary fee processing  
CREATE TRIGGER tr_auto_boundary_fees
    AFTER UPDATE ON drivers
    FOR EACH ROW EXECUTE FUNCTION auto_process_boundary_fees();

-- Driver performance score updates
CREATE TRIGGER tr_update_operator_driver_performance
    AFTER UPDATE ON drivers
    FOR EACH ROW EXECUTE FUNCTION update_operator_driver_performance();

-- =====================================================
-- SCHEDULED MAINTENANCE FUNCTIONS
-- =====================================================

-- Function to run daily maintenance tasks
CREATE OR REPLACE FUNCTION run_daily_operator_maintenance()
RETURNS TEXT AS $$
DECLARE
    v_results TEXT := '';
    v_scores_processed INTEGER;
    v_tiers_updated INTEGER;
    v_expired_cleaned INTEGER;
BEGIN
    -- Calculate performance scores for all operators
    SELECT batch_calculate_performance_scores() INTO v_scores_processed;
    v_results := v_results || 'Performance scores calculated: ' || v_scores_processed || E'\n';
    
    -- Update commission tiers based on new scores
    SELECT COUNT(*) INTO v_tiers_updated
    FROM operators o
    WHERE update_operator_commission_tier(o.id, CURRENT_DATE) = TRUE;
    v_results := v_results || 'Commission tiers updated: ' || v_tiers_updated || E'\n';
    
    -- Clean up expired data
    UPDATE operator_performance_incentives 
    SET is_active = FALSE
    WHERE valid_until < CURRENT_DATE AND is_active = TRUE;
    
    GET DIAGNOSTICS v_expired_cleaned = ROW_COUNT;
    v_results := v_results || 'Expired incentives cleaned: ' || v_expired_cleaned || E'\n';
    
    -- Update operator financial summaries (daily)
    INSERT INTO operator_financial_summaries (
        operator_id, period_start, period_end, period_type,
        total_commissions_earned, total_boundary_fees_collected,
        gross_revenue, net_revenue, total_trips
    )
    SELECT 
        otr.operator_id,
        CURRENT_DATE - 1,
        CURRENT_DATE - 1,
        'daily',
        COALESCE(SUM(otr.amount) FILTER (WHERE otr.transaction_type = 'commission_earned'), 0),
        COALESCE(SUM(obf.total_amount), 0),
        COALESCE(SUM(otr.amount) FILTER (WHERE otr.transaction_type IN ('commission_earned', 'incentive_bonus')), 0),
        COALESCE(SUM(otr.amount), 0),
        COUNT(DISTINCT b.id)
    FROM operator_financial_transactions otr
    LEFT JOIN operator_boundary_fees obf ON otr.operator_id = obf.operator_id 
        AND obf.fee_date = CURRENT_DATE - 1
    LEFT JOIN bookings b ON otr.booking_id = b.id
    WHERE otr.transaction_date = CURRENT_DATE - 1
    GROUP BY otr.operator_id
    ON CONFLICT (operator_id, period_start, period_type) DO UPDATE SET
        total_commissions_earned = EXCLUDED.total_commissions_earned,
        total_boundary_fees_collected = EXCLUDED.total_boundary_fees_collected,
        gross_revenue = EXCLUDED.gross_revenue,
        net_revenue = EXCLUDED.net_revenue,
        total_trips = EXCLUDED.total_trips,
        recalculated_at = NOW();
    
    v_results := v_results || 'Daily financial summaries updated' || E'\n';
    
    RETURN v_results;
END;
$$ LANGUAGE plpgsql;

-- Function to run weekly maintenance tasks
CREATE OR REPLACE FUNCTION run_weekly_operator_maintenance()
RETURNS TEXT AS $$
DECLARE
    v_results TEXT := '';
    v_improvement_plans INTEGER;
BEGIN
    -- Create improvement plans for underperforming operators
    INSERT INTO operator_improvement_plans (
        operator_id, plan_name, description, priority,
        trigger_score, focus_areas, target_score, timeline_days,
        action_items, total_milestones, start_date, target_completion_date
    )
    SELECT 
        o.id,
        'Performance Improvement Plan - Week ' || EXTRACT(WEEK FROM CURRENT_DATE),
        'Automated improvement plan for operators scoring below 70 points',
        CASE WHEN o.performance_score < 50 THEN 'high' ELSE 'medium' END,
        o.performance_score,
        ARRAY['vehicle_utilization', 'driver_management']::performance_metric_type[],
        GREATEST(75.00, o.performance_score + 10.00),
        30,
        '{"items": ["Review vehicle utilization patterns", "Conduct driver performance reviews", "Update maintenance schedules", "Review service area coverage"]}'::jsonb,
        4,
        CURRENT_DATE,
        CURRENT_DATE + 30
    FROM operators o
    WHERE o.is_active = TRUE
    AND o.status = 'active'  
    AND o.performance_score < 70.00
    AND NOT EXISTS (
        SELECT 1 FROM operator_improvement_plans oip 
        WHERE oip.operator_id = o.id 
        AND oip.status = 'active'
    );
    
    GET DIAGNOSTICS v_improvement_plans = ROW_COUNT;
    v_results := v_results || 'Improvement plans created: ' || v_improvement_plans || E'\n';
    
    RETURN v_results;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON FUNCTION audit_operator_changes IS 'Generic audit trigger for tracking all changes to operator management tables';
COMMENT ON FUNCTION audit_performance_score_changes IS 'Specialized audit trigger for performance score and commission tier changes';
COMMENT ON FUNCTION audit_financial_transactions IS 'Audit trigger for financial transaction changes and payment status updates';
COMMENT ON FUNCTION enforce_vehicle_management_rules IS 'Business rule enforcement for vehicle limits and performance impact';
COMMENT ON FUNCTION auto_process_commission_calculation IS 'Automatically calculates and records commission when bookings are completed';
COMMENT ON FUNCTION auto_process_boundary_fees IS 'Automatically processes daily boundary fees when drivers go offline';
COMMENT ON FUNCTION update_operator_driver_performance IS 'Updates operator-specific driver performance scores based on driver rating changes';
COMMENT ON FUNCTION run_daily_operator_maintenance IS 'Runs daily maintenance: score calculations, tier updates, data cleanup';
COMMENT ON FUNCTION run_weekly_operator_maintenance IS 'Runs weekly maintenance: improvement plan creation, performance reviews';