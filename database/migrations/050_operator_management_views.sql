-- =====================================================
-- OPERATOR MANAGEMENT VIEWS
-- Migration 050: Comprehensive views for common operator management queries
-- Provides optimized, business-ready views for dashboard and reporting
-- =====================================================

-- =====================================================
-- CORE OPERATOR OVERVIEW VIEWS
-- =====================================================

-- Comprehensive operator overview with current performance and financial status
CREATE VIEW v_operators_overview AS
SELECT 
    o.id,
    o.operator_code,
    o.business_name,
    o.legal_name,
    o.operator_type,
    o.status,
    
    -- Contact and location
    o.primary_contact,
    o.business_address,
    r.name as primary_region_name,
    r.code as primary_region_code,
    CARDINALITY(o.allowed_regions) + 1 as regions_covered,
    
    -- Fleet information  
    o.current_vehicle_count,
    o.max_vehicles,
    ROUND((o.current_vehicle_count::decimal / NULLIF(o.max_vehicles, 0)) * 100, 2) as vehicle_utilization_percentage,
    
    -- Performance metrics
    o.performance_score,
    o.commission_tier,
    o.tier_qualification_date,
    
    -- Financial summary
    o.earnings_today,
    o.earnings_week,
    o.earnings_month,
    o.total_commissions_earned,
    o.wallet_balance,
    
    -- Operational status
    o.partnership_start_date,
    EXTRACT(MONTHS FROM AGE(CURRENT_DATE, o.partnership_start_date)) as partnership_months,
    o.operational_hours,
    
    -- Account management
    CONCAT(am.first_name, ' ', am.last_name) as account_manager_name,
    am.email as account_manager_email,
    
    -- User account info
    CONCAT(u.first_name, ' ', u.last_name) as operator_user_name,
    u.email as operator_email,
    u.last_login_at as last_operator_login,
    
    -- Metadata
    o.created_at,
    o.updated_at
    
FROM operators o
LEFT JOIN regions r ON o.primary_region_id = r.id
LEFT JOIN users am ON o.assigned_account_manager = am.id
LEFT JOIN users u ON o.user_id = u.id
WHERE o.is_active = TRUE;

-- Operator fleet management view with driver and vehicle details
CREATE VIEW v_operator_fleet_details AS
SELECT 
    o.id as operator_id,
    o.operator_code,
    o.business_name,
    o.operator_type,
    
    -- Driver details
    od.id as operator_driver_id,
    d.id as driver_id,
    d.driver_code,
    CONCAT(d.first_name, ' ', d.last_name) as driver_name,
    d.phone as driver_phone,
    d.email as driver_email,
    od.assignment_type,
    od.employment_status,
    od.contract_start_date,
    od.contract_end_date,
    od.driver_performance_score,
    
    -- Vehicle details
    ov.id as vehicle_id,
    ov.vehicle_plate_number,
    ov.vehicle_info,
    ov.service_type,
    ov.vehicle_category,
    ov.seating_capacity,
    ov.status as vehicle_status,
    ov.last_maintenance_date,
    ov.next_maintenance_due,
    
    -- Location assignment
    ol.name as assigned_location_name,
    ol.location_type,
    ol.address as location_address,
    
    -- Current status and activity
    d.status as driver_current_status,
    dl.location as current_driver_location,
    dl.recorded_at as last_location_update,
    
    -- Recent performance
    dpd.completed_trips as recent_completed_trips,
    dpd.average_rating as recent_average_rating,
    
FROM operators o
LEFT JOIN operator_drivers od ON o.id = od.operator_id AND od.is_active = TRUE
LEFT JOIN drivers d ON od.driver_id = d.id AND d.is_active = TRUE
LEFT JOIN operator_vehicles ov ON ov.assigned_driver_id = d.id AND ov.is_active = TRUE
LEFT JOIN operator_locations ol ON od.assigned_location_id = ol.id
LEFT JOIN driver_locations dl ON d.id = dl.driver_id 
    AND dl.recorded_at = (
        SELECT MAX(recorded_at) 
        FROM driver_locations dl2 
        WHERE dl2.driver_id = d.id
    )
LEFT JOIN driver_performance_daily dpd ON d.id = dpd.driver_id 
    AND dpd.performance_date = CURRENT_DATE
WHERE o.is_active = TRUE;

-- =====================================================
-- PERFORMANCE AND SCORING VIEWS
-- =====================================================

-- Current performance dashboard for operators
CREATE VIEW v_operator_performance_dashboard AS
SELECT 
    o.id as operator_id,
    o.operator_code,
    o.business_name,
    o.operator_type,
    o.status,
    
    -- Current performance scores
    ops.scoring_period,
    ops.vehicle_utilization_score,
    ops.driver_management_score,
    ops.compliance_safety_score,
    ops.platform_contribution_score,
    ops.total_score,
    
    -- Performance ranking
    ops.peer_ranking,
    ops.peer_percentile,
    ops.improvement_trend,
    
    -- Commission tier status
    o.commission_tier,
    ops.tier_qualification_status,
    
    -- Supporting metrics breakdown
    json_build_object(
        'vehicle_utilization', ops.metrics_data->'vehicle_utilization',
        'driver_management', ops.metrics_data->'driver_management',
        'compliance_safety', ops.metrics_data->'compliance_safety',
        'platform_contribution', ops.metrics_data->'platform_contribution'
    ) as detailed_metrics,
    
    -- Tier qualification progress
    ctq.score_requirement,
    ctq.score_qualified,
    ctq.tenure_requirement,
    ctq.tenure_qualified,
    ctq.payment_consistency_requirement,
    ctq.payment_qualified,
    ctq.utilization_requirement,
    ctq.utilization_qualified,
    ctq.next_evaluation_date,
    
    -- Performance trends (last 30 days)
    LAG(ops.total_score, 7) OVER (
        PARTITION BY o.id 
        ORDER BY ops.scoring_period
    ) as score_7_days_ago,
    LAG(ops.total_score, 30) OVER (
        PARTITION BY o.id 
        ORDER BY ops.scoring_period  
    ) as score_30_days_ago,
    
    ops.calculated_at as last_score_update
    
FROM operators o
LEFT JOIN operator_performance_scores ops ON o.id = ops.operator_id 
    AND ops.scoring_frequency = 'daily'
    AND ops.is_final = TRUE
    AND ops.scoring_period = (
        SELECT MAX(scoring_period) 
        FROM operator_performance_scores ops2 
        WHERE ops2.operator_id = o.id 
        AND ops2.is_final = TRUE
    )
LEFT JOIN commission_tier_qualifications ctq ON o.id = ctq.operator_id
    AND ctq.target_tier = o.commission_tier
    AND ctq.evaluation_date = (
        SELECT MAX(evaluation_date)
        FROM commission_tier_qualifications ctq2
        WHERE ctq2.operator_id = o.id
    )
WHERE o.is_active = TRUE;

-- Performance improvement tracking view
CREATE VIEW v_operator_improvement_tracking AS
SELECT 
    oip.id as plan_id,
    oip.operator_id,
    o.operator_code,
    o.business_name,
    
    -- Improvement plan details
    oip.plan_name,
    oip.priority,
    oip.status,
    oip.focus_areas,
    oip.trigger_score,
    oip.target_score,
    
    -- Progress tracking
    oip.progress_percentage,
    oip.milestones_completed,
    oip.total_milestones,
    oip.current_score,
    
    -- Timeline
    oip.start_date,
    oip.target_completion_date,
    oip.actual_completion_date,
    CURRENT_DATE - oip.start_date as days_in_progress,
    oip.target_completion_date - CURRENT_DATE as days_remaining,
    
    -- Results
    oip.success_achieved,
    oip.final_score,
    oip.trigger_score - oip.final_score as score_improvement,
    
    -- Assigned manager
    CONCAT(am.first_name, ' ', am.last_name) as assigned_manager_name,
    am.email as assigned_manager_email,
    
    -- Recent performance data
    ops.total_score as latest_performance_score,
    ops.scoring_period as latest_score_date,
    
    -- Action items status
    oip.action_items,
    
FROM operator_improvement_plans oip
JOIN operators o ON oip.operator_id = o.id
LEFT JOIN users am ON oip.assigned_manager = am.id
LEFT JOIN operator_performance_scores ops ON o.id = ops.operator_id
    AND ops.scoring_period = (
        SELECT MAX(scoring_period)
        FROM operator_performance_scores ops2
        WHERE ops2.operator_id = o.id
        AND ops2.is_final = TRUE
    )
WHERE oip.status IN ('active', 'on_hold', 'completed')
ORDER BY 
    CASE oip.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
    oip.target_completion_date ASC;

-- =====================================================
-- FINANCIAL VIEWS
-- =====================================================

-- Financial overview for operators with commission breakdowns
CREATE VIEW v_operator_financial_overview AS
SELECT 
    o.id as operator_id,
    o.operator_code,
    o.business_name,
    o.commission_tier,
    
    -- Current balances
    o.wallet_balance,
    o.earnings_today,
    o.earnings_week,
    o.earnings_month,
    o.total_commissions_earned,
    
    -- Commission rate information
    crc.rate_percentage as current_commission_rate,
    crc.effective_from as rate_effective_from,
    
    -- Recent transactions (last 30 days)
    recent.total_transactions,
    recent.commissions_earned,
    recent.boundary_fees_collected,
    recent.bonuses_received,
    recent.penalties_deducted,
    recent.net_earnings,
    
    -- Payment consistency
    payment_consistency.on_time_payments,
    payment_consistency.total_payments,
    payment_consistency.consistency_rate,
    
    -- Financial health indicators
    CASE 
        WHEN recent.net_earnings > 0 THEN 'profitable'
        WHEN recent.net_earnings = 0 THEN 'break_even'
        ELSE 'loss'
    END as financial_status,
    
    -- Growth metrics
    growth.revenue_growth_rate,
    growth.transaction_volume_growth,
    
    -- Last payout
    last_payout.payout_amount as last_payout_amount,
    last_payout.completed_at as last_payout_date,
    last_payout.status as last_payout_status
    
FROM operators o
LEFT JOIN commission_rate_configs crc ON o.commission_tier = crc.commission_tier
    AND crc.effective_from <= CURRENT_DATE
    AND (crc.effective_until IS NULL OR crc.effective_until >= CURRENT_DATE)
    AND crc.is_active = TRUE
LEFT JOIN (
    -- Recent transaction summary
    SELECT 
        operator_id,
        COUNT(*) as total_transactions,
        SUM(CASE WHEN transaction_type = 'commission_earned' THEN amount ELSE 0 END) as commissions_earned,
        SUM(CASE WHEN transaction_type = 'boundary_fee' THEN amount ELSE 0 END) as boundary_fees_collected,
        SUM(CASE WHEN transaction_type = 'incentive_bonus' THEN amount ELSE 0 END) as bonuses_received,
        SUM(CASE WHEN transaction_type = 'penalty_deduction' THEN ABS(amount) ELSE 0 END) as penalties_deducted,
        SUM(amount) as net_earnings
    FROM operator_financial_transactions
    WHERE transaction_date >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY operator_id
) recent ON o.id = recent.operator_id
LEFT JOIN (
    -- Payment consistency calculation
    SELECT 
        operator_id,
        COUNT(*) FILTER (WHERE payment_status = 'completed' 
            AND paid_at <= fee_date + INTERVAL '7 days') as on_time_payments,
        COUNT(*) as total_payments,
        COUNT(*) FILTER (WHERE payment_status = 'completed' 
            AND paid_at <= fee_date + INTERVAL '7 days') * 100.0 / 
            NULLIF(COUNT(*), 0) as consistency_rate
    FROM operator_boundary_fees
    WHERE fee_date >= CURRENT_DATE - INTERVAL '6 months'
    GROUP BY operator_id
) payment_consistency ON o.id = payment_consistency.operator_id
LEFT JOIN (
    -- Growth metrics
    SELECT 
        ofs1.operator_id,
        (ofs1.net_revenue - ofs2.net_revenue) * 100.0 / NULLIF(ABS(ofs2.net_revenue), 0) as revenue_growth_rate,
        (ofs1.total_trips - ofs2.total_trips) * 100.0 / NULLIF(ofs2.total_trips, 0) as transaction_volume_growth
    FROM operator_financial_summaries ofs1
    LEFT JOIN operator_financial_summaries ofs2 ON ofs1.operator_id = ofs2.operator_id
        AND ofs2.period_start = ofs1.period_start - INTERVAL '1 month'
        AND ofs2.period_type = 'monthly'
    WHERE ofs1.period_type = 'monthly'
    AND ofs1.period_start = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
) growth ON o.id = growth.operator_id
LEFT JOIN (
    -- Last payout information
    SELECT DISTINCT ON (operator_id)
        operator_id,
        payout_amount,
        completed_at,
        status
    FROM operator_payouts
    ORDER BY operator_id, completed_at DESC
) last_payout ON o.id = last_payout.operator_id
WHERE o.is_active = TRUE;

-- Boundary fees tracking view with driver performance breakdown
CREATE VIEW v_boundary_fees_tracking AS
SELECT 
    obf.id as boundary_fee_id,
    obf.fee_date,
    
    -- Operator information
    o.operator_code,
    o.business_name,
    
    -- Driver information
    d.driver_code,
    CONCAT(d.first_name, ' ', d.last_name) as driver_name,
    obf.driver_performance_score,
    
    -- Vehicle information
    obf.vehicle_plate_number,
    obf.service_type,
    
    -- Fee breakdown
    obf.base_boundary_fee,
    obf.fuel_subsidy,
    obf.maintenance_allowance,
    obf.performance_adjustment,
    obf.bonus_earned,
    obf.other_adjustments,
    obf.total_amount,
    
    -- Performance metrics for the day
    obf.trips_completed,
    obf.hours_worked,
    obf.distance_covered_km,
    obf.driver_gross_earnings,
    obf.revenue_share_percentage,
    obf.revenue_share_amount,
    
    -- Payment status
    obf.payment_status,
    obf.payment_method,
    obf.paid_at,
    
    -- Performance indicators
    CASE 
        WHEN obf.driver_performance_score >= 85 THEN 'excellent'
        WHEN obf.driver_performance_score >= 75 THEN 'good'
        WHEN obf.driver_performance_score >= 60 THEN 'average'
        ELSE 'needs_improvement'
    END as performance_category,
    
    CASE
        WHEN obf.trips_completed >= 8 THEN 'high_productivity'
        WHEN obf.trips_completed >= 5 THEN 'medium_productivity'
        ELSE 'low_productivity'
    END as productivity_level,
    
    -- Payment timeliness
    CASE
        WHEN obf.payment_status = 'completed' AND obf.paid_at <= obf.fee_date + INTERVAL '7 days' THEN 'on_time'
        WHEN obf.payment_status = 'completed' AND obf.paid_at > obf.fee_date + INTERVAL '7 days' THEN 'late'
        WHEN obf.payment_status = 'pending' AND CURRENT_DATE <= obf.fee_date + INTERVAL '7 days' THEN 'within_grace'
        ELSE 'overdue'
    END as payment_timeliness,
    
    obf.created_at
    
FROM operator_boundary_fees obf
JOIN operators o ON obf.operator_id = o.id
JOIN drivers d ON obf.driver_id = d.id
ORDER BY obf.fee_date DESC, o.operator_code;

-- =====================================================
-- OPERATIONAL VIEWS
-- =====================================================

-- Real-time operator fleet status
CREATE VIEW v_operator_fleet_status AS
SELECT 
    o.id as operator_id,
    o.operator_code,
    o.business_name,
    o.operator_type,
    o.current_vehicle_count,
    o.max_vehicles,
    
    -- Fleet availability status
    COUNT(d.id) FILTER (WHERE d.status = 'active') as drivers_active,
    COUNT(d.id) FILTER (WHERE d.status = 'busy') as drivers_busy,
    COUNT(d.id) FILTER (WHERE d.status = 'offline') as drivers_offline,
    COUNT(d.id) as total_drivers,
    
    -- Vehicle status
    COUNT(ov.id) FILTER (WHERE ov.status = 'active') as vehicles_active,
    COUNT(ov.id) FILTER (WHERE ov.status = 'maintenance') as vehicles_in_maintenance,
    COUNT(ov.id) FILTER (WHERE ov.status = 'inactive') as vehicles_inactive,
    
    -- Current utilization
    ROUND(
        COUNT(d.id) FILTER (WHERE d.status IN ('active', 'busy'))::decimal / 
        NULLIF(COUNT(d.id), 0) * 100, 2
    ) as fleet_utilization_percentage,
    
    -- Service coverage by type
    COUNT(ov.id) FILTER (WHERE ov.service_type = 'ride_4w') as vehicles_4w,
    COUNT(ov.id) FILTER (WHERE ov.service_type = 'ride_2w') as vehicles_2w,
    COUNT(ov.id) FILTER (WHERE ov.service_type IN ('send_delivery', 'eats_delivery', 'mart_delivery')) as vehicles_delivery,
    
    -- Regional distribution
    COUNT(DISTINCT od.assigned_location_id) as locations_covered,
    COUNT(DISTINCT dl.region_id) as regions_active,
    
    -- Performance indicators
    AVG(od.driver_performance_score) as avg_driver_performance,
    COUNT(*) FILTER (WHERE od.driver_performance_score >= 80) as high_performing_drivers,
    COUNT(*) FILTER (WHERE od.driver_performance_score < 60) as underperforming_drivers,
    
    -- Maintenance alerts
    COUNT(ov.id) FILTER (WHERE ov.next_maintenance_due <= CURRENT_DATE + INTERVAL '7 days') as maintenance_due_soon,
    COUNT(ov.id) FILTER (WHERE ov.next_maintenance_due <= CURRENT_DATE) as maintenance_overdue,
    COUNT(ov.id) FILTER (WHERE ov.next_inspection_due <= CURRENT_DATE + INTERVAL '7 days') as inspection_due_soon,
    
    -- Last updated
    MAX(dl.recorded_at) as last_location_update
    
FROM operators o
LEFT JOIN operator_drivers od ON o.id = od.operator_id AND od.is_active = TRUE
LEFT JOIN drivers d ON od.driver_id = d.id AND d.is_active = TRUE
LEFT JOIN operator_vehicles ov ON ov.operator_id = o.id AND ov.is_active = TRUE
LEFT JOIN driver_locations dl ON d.id = dl.driver_id 
    AND dl.recorded_at >= CURRENT_DATE
GROUP BY o.id, o.operator_code, o.business_name, o.operator_type, 
         o.current_vehicle_count, o.max_vehicles
HAVING o.is_active = TRUE;

-- =====================================================
-- ANALYTICS AND REPORTING VIEWS
-- =====================================================

-- Operator performance analytics with peer comparison
CREATE VIEW v_operator_performance_analytics AS
SELECT 
    o.id as operator_id,
    o.operator_code,
    o.business_name,
    o.operator_type,
    
    -- Current performance
    ops.total_score as current_score,
    ops.vehicle_utilization_score,
    ops.driver_management_score,
    ops.compliance_safety_score,
    ops.platform_contribution_score,
    
    -- Peer comparison (within same operator type and region)
    PERCENT_RANK() OVER (
        PARTITION BY o.operator_type, o.primary_region_id 
        ORDER BY ops.total_score
    ) * 100 as percentile_rank,
    
    ROW_NUMBER() OVER (
        PARTITION BY o.operator_type, o.primary_region_id 
        ORDER BY ops.total_score DESC
    ) as rank_in_type_region,
    
    COUNT(*) OVER (
        PARTITION BY o.operator_type, o.primary_region_id
    ) as total_peers,
    
    -- Performance trends
    AVG(ops_hist.total_score) OVER (
        PARTITION BY o.id 
        ORDER BY ops_hist.scoring_period 
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ) as score_7day_avg,
    
    AVG(ops_hist.total_score) OVER (
        PARTITION BY o.id 
        ORDER BY ops_hist.scoring_period 
        ROWS BETWEEN 29 PRECEDING AND CURRENT ROW
    ) as score_30day_avg,
    
    -- Improvement indicators
    ops.improvement_trend,
    CASE 
        WHEN ops.improvement_trend > 2 THEN 'improving'
        WHEN ops.improvement_trend < -2 THEN 'declining'
        ELSE 'stable'
    END as trend_status,
    
    -- Commission tier analysis
    o.commission_tier,
    determine_commission_tier(o.id, CURRENT_DATE) as qualified_tier,
    CASE 
        WHEN determine_commission_tier(o.id, CURRENT_DATE) > o.commission_tier THEN 'tier_upgrade_eligible'
        WHEN determine_commission_tier(o.id, CURRENT_DATE) < o.commission_tier THEN 'tier_at_risk'
        ELSE 'tier_maintained'
    END as tier_status
    
FROM operators o
JOIN operator_performance_scores ops ON o.id = ops.operator_id
    AND ops.scoring_period = CURRENT_DATE
    AND ops.scoring_frequency = 'daily'
    AND ops.is_final = TRUE
LEFT JOIN operator_performance_scores ops_hist ON o.id = ops_hist.operator_id
    AND ops_hist.scoring_frequency = 'daily'
    AND ops_hist.is_final = TRUE
    AND ops_hist.scoring_period >= CURRENT_DATE - INTERVAL '30 days'
WHERE o.is_active = TRUE
GROUP BY o.id, o.operator_code, o.business_name, o.operator_type, 
         o.primary_region_id, o.commission_tier, ops.total_score,
         ops.vehicle_utilization_score, ops.driver_management_score,
         ops.compliance_safety_score, ops.platform_contribution_score,
         ops.improvement_trend;

-- =====================================================
-- COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON VIEW v_operators_overview IS 'Comprehensive operator overview with performance, financial status, and fleet information';
COMMENT ON VIEW v_operator_fleet_details IS 'Detailed fleet management view showing drivers, vehicles, and assignments';
COMMENT ON VIEW v_operator_performance_dashboard IS 'Performance dashboard with current scores, rankings, and tier qualification status';
COMMENT ON VIEW v_operator_improvement_tracking IS 'Improvement plan tracking with progress and milestone completion';
COMMENT ON VIEW v_operator_financial_overview IS 'Financial overview with commission rates, earnings, and payment consistency';
COMMENT ON VIEW v_boundary_fees_tracking IS 'Boundary fee tracking with performance breakdown and payment status';
COMMENT ON VIEW v_operator_fleet_status IS 'Real-time fleet status with utilization, availability, and maintenance alerts';
COMMENT ON VIEW v_operator_performance_analytics IS 'Performance analytics with peer comparison and trend analysis';