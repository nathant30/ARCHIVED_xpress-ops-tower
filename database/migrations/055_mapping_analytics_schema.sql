-- Migration: 055_mapping_analytics_schema.sql
-- Description: Create mapping services and advanced analytics tables
-- Created: 2025-09-05

-- Mapping service cache and optimization
CREATE TABLE mapping_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key VARCHAR(255) UNIQUE NOT NULL,
  cache_type VARCHAR(50) NOT NULL CHECK (cache_type IN ('geocode', 'reverse_geocode', 'route', 'eta', 'traffic')),
  request_data JSONB NOT NULL,
  response_data JSONB NOT NULL,
  provider VARCHAR(50) NOT NULL,
  accuracy_score DECIMAL(3,2),
  usage_count INTEGER DEFAULT 1,
  last_used TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Route optimization history
CREATE TABLE route_optimizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  optimization_id VARCHAR(100) UNIQUE NOT NULL,
  origin_location JSONB NOT NULL,
  destination_location JSONB NOT NULL,
  waypoints JSONB DEFAULT '[]',
  vehicle_type VARCHAR(50),
  optimization_goals JSONB DEFAULT '{"minimize": "time"}',
  provider VARCHAR(50) NOT NULL,
  original_route JSONB,
  optimized_route JSONB,
  distance_original_meters INTEGER,
  distance_optimized_meters INTEGER,
  time_original_seconds INTEGER,
  time_optimized_seconds INTEGER,
  savings_meters INTEGER DEFAULT 0,
  savings_seconds INTEGER DEFAULT 0,
  efficiency_improvement DECIMAL(5,2) DEFAULT 0,
  traffic_considered BOOLEAN DEFAULT false,
  real_time_updates BOOLEAN DEFAULT false,
  cost_estimate DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Traffic data and patterns
CREATE TABLE traffic_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_point GEOMETRY(POINT, 4326) NOT NULL,
  road_segment_id VARCHAR(100),
  traffic_level VARCHAR(20) NOT NULL CHECK (traffic_level IN ('free_flow', 'light', 'moderate', 'heavy', 'stop_and_go')),
  speed_kmh INTEGER,
  delay_seconds INTEGER DEFAULT 0,
  incident_type VARCHAR(50),
  incident_severity VARCHAR(20),
  weather_impact VARCHAR(50),
  construction_impact BOOLEAN DEFAULT false,
  event_impact VARCHAR(100),
  provider VARCHAR(50) NOT NULL,
  confidence_score DECIMAL(3,2) DEFAULT 1.0,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  valid_until TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '15 minutes'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Advanced analytics aggregations
CREATE TABLE analytics_dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_name VARCHAR(100) NOT NULL,
  dashboard_type VARCHAR(50) NOT NULL CHECK (dashboard_type IN ('executive', 'operations', 'financial', 'driver', 'customer')),
  user_id UUID REFERENCES users(id),
  region_filter JSONB DEFAULT '[]',
  date_range JSONB NOT NULL,
  widgets JSONB NOT NULL DEFAULT '[]',
  refresh_interval INTEGER DEFAULT 300, -- seconds
  is_public BOOLEAN DEFAULT false,
  permissions JSONB DEFAULT '[]',
  last_generated TIMESTAMP WITH TIME ZONE,
  cache_data JSONB,
  performance_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Report generation and scheduling
CREATE TABLE analytics_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id VARCHAR(100) UNIQUE NOT NULL,
  report_name VARCHAR(255) NOT NULL,
  report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('revenue', 'driver_performance', 'demand_forecasting', 'operational', 'compliance')),
  report_format VARCHAR(20) NOT NULL CHECK (report_format IN ('pdf', 'excel', 'csv', 'json')),
  parameters JSONB NOT NULL DEFAULT '{}',
  filters JSONB DEFAULT '{}',
  generated_by UUID NOT NULL REFERENCES users(id),
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed', 'cancelled')),
  file_path TEXT,
  file_size INTEGER,
  generation_started_at TIMESTAMP WITH TIME ZONE,
  generation_completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  download_count INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  scheduled_delivery JSONB,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Revenue analytics aggregations
CREATE TABLE revenue_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  region_id UUID REFERENCES regions(id),
  time_bucket VARCHAR(20) NOT NULL CHECK (time_bucket IN ('hour', 'day', 'week', 'month')),
  total_rides INTEGER DEFAULT 0,
  completed_rides INTEGER DEFAULT 0,
  cancelled_rides INTEGER DEFAULT 0,
  gross_revenue DECIMAL(12,2) DEFAULT 0,
  net_revenue DECIMAL(12,2) DEFAULT 0,
  driver_earnings DECIMAL(12,2) DEFAULT 0,
  platform_commission DECIMAL(12,2) DEFAULT 0,
  operator_commission DECIMAL(12,2) DEFAULT 0,
  processing_fees DECIMAL(10,2) DEFAULT 0,
  surge_revenue DECIMAL(10,2) DEFAULT 0,
  tip_revenue DECIMAL(10,2) DEFAULT 0,
  refund_amount DECIMAL(10,2) DEFAULT 0,
  average_fare DECIMAL(8,2) DEFAULT 0,
  average_distance_km DECIMAL(6,2) DEFAULT 0,
  average_duration_minutes DECIMAL(6,2) DEFAULT 0,
  unique_customers INTEGER DEFAULT 0,
  unique_drivers INTEGER DEFAULT 0,
  customer_acquisition_cost DECIMAL(8,2) DEFAULT 0,
  customer_lifetime_value DECIMAL(8,2) DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(date, region_id, time_bucket)
);

-- Driver performance analytics
CREATE TABLE driver_performance_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id),
  analysis_date DATE NOT NULL,
  period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly')),
  
  -- Ride metrics
  total_rides INTEGER DEFAULT 0,
  completed_rides INTEGER DEFAULT 0,
  cancelled_rides INTEGER DEFAULT 0,
  completion_rate DECIMAL(5,2) DEFAULT 0,
  cancellation_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Earnings metrics
  gross_earnings DECIMAL(10,2) DEFAULT 0,
  net_earnings DECIMAL(10,2) DEFAULT 0,
  average_earnings_per_ride DECIMAL(8,2) DEFAULT 0,
  total_tips DECIMAL(8,2) DEFAULT 0,
  surge_earnings DECIMAL(8,2) DEFAULT 0,
  
  -- Time and efficiency metrics
  online_hours DECIMAL(6,2) DEFAULT 0,
  driving_hours DECIMAL(6,2) DEFAULT 0,
  idle_hours DECIMAL(6,2) DEFAULT 0,
  utilization_rate DECIMAL(5,2) DEFAULT 0,
  earnings_per_hour DECIMAL(8,2) DEFAULT 0,
  
  -- Quality metrics
  average_rating DECIMAL(3,2) DEFAULT 0,
  five_star_rides INTEGER DEFAULT 0,
  customer_complaints INTEGER DEFAULT 0,
  compliments_received INTEGER DEFAULT 0,
  
  -- Matching metrics
  requests_received INTEGER DEFAULT 0,
  requests_accepted INTEGER DEFAULT 0,
  acceptance_rate DECIMAL(5,2) DEFAULT 0,
  average_response_time_seconds DECIMAL(8,2) DEFAULT 0,
  
  -- Geographic metrics
  total_distance_km DECIMAL(8,2) DEFAULT 0,
  average_trip_distance_km DECIMAL(6,2) DEFAULT 0,
  preferred_zones JSONB DEFAULT '[]',
  
  -- Ranking and percentiles
  earnings_percentile INTEGER,
  rating_percentile INTEGER,
  efficiency_percentile INTEGER,
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(driver_id, analysis_date, period_type)
);

-- Demand forecasting data
CREATE TABLE demand_forecasting (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  forecast_id VARCHAR(100) UNIQUE NOT NULL,
  region_id UUID REFERENCES regions(id),
  zone_id UUID,
  forecast_date DATE NOT NULL,
  forecast_hour INTEGER CHECK (forecast_hour >= 0 AND forecast_hour <= 23),
  
  -- Historical baseline
  historical_rides_avg DECIMAL(8,2) DEFAULT 0,
  historical_rides_std DECIMAL(8,2) DEFAULT 0,
  seasonal_factor DECIMAL(4,3) DEFAULT 1.0,
  
  -- Prediction models
  linear_prediction DECIMAL(8,2) DEFAULT 0,
  ml_prediction DECIMAL(8,2) DEFAULT 0,
  ensemble_prediction DECIMAL(8,2) DEFAULT 0,
  confidence_interval_low DECIMAL(8,2) DEFAULT 0,
  confidence_interval_high DECIMAL(8,2) DEFAULT 0,
  prediction_confidence DECIMAL(3,2) DEFAULT 0,
  
  -- External factors
  weather_impact DECIMAL(4,3) DEFAULT 1.0,
  event_impact DECIMAL(4,3) DEFAULT 1.0,
  holiday_impact DECIMAL(4,3) DEFAULT 1.0,
  
  -- Supply metrics
  predicted_driver_supply INTEGER DEFAULT 0,
  supply_demand_ratio DECIMAL(4,2) DEFAULT 0,
  surge_probability DECIMAL(3,2) DEFAULT 0,
  recommended_surge_multiplier DECIMAL(3,2) DEFAULT 1.0,
  
  -- Accuracy tracking
  actual_rides INTEGER,
  prediction_error DECIMAL(8,2),
  absolute_error DECIMAL(8,2),
  
  model_version VARCHAR(20) DEFAULT 'v1.0',
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  valid_for TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(region_id, zone_id, forecast_date, forecast_hour)
);

-- Performance indexes
CREATE INDEX idx_mapping_cache_key ON mapping_cache(cache_key);
CREATE INDEX idx_mapping_cache_type_expires ON mapping_cache(cache_type, expires_at) WHERE expires_at > CURRENT_TIMESTAMP;
CREATE INDEX idx_mapping_cache_usage ON mapping_cache(usage_count DESC, last_used DESC);

CREATE INDEX idx_route_optimizations_created ON route_optimizations(created_at DESC);
CREATE INDEX idx_route_optimizations_provider ON route_optimizations(provider);
CREATE INDEX idx_route_optimizations_efficiency ON route_optimizations(efficiency_improvement DESC) WHERE efficiency_improvement > 0;

CREATE INDEX idx_traffic_data_location ON traffic_data USING GIST(location_point);
CREATE INDEX idx_traffic_data_valid_period ON traffic_data(valid_from, valid_until);
CREATE INDEX idx_traffic_data_level ON traffic_data(traffic_level, created_at DESC);

CREATE INDEX idx_analytics_dashboards_type ON analytics_dashboards(dashboard_type, user_id);
CREATE INDEX idx_analytics_dashboards_public ON analytics_dashboards(is_public) WHERE is_public = true;

CREATE INDEX idx_analytics_reports_type_status ON analytics_reports(report_type, status);
CREATE INDEX idx_analytics_reports_generated_by ON analytics_reports(generated_by, created_at DESC);
CREATE INDEX idx_analytics_reports_expires ON analytics_reports(expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX idx_revenue_analytics_date_region ON revenue_analytics(date DESC, region_id);
CREATE INDEX idx_revenue_analytics_time_bucket ON revenue_analytics(time_bucket, date DESC);
CREATE INDEX idx_revenue_analytics_gross_revenue ON revenue_analytics(gross_revenue DESC);

CREATE INDEX idx_driver_performance_driver_date ON driver_performance_analytics(driver_id, analysis_date DESC);
CREATE INDEX idx_driver_performance_period ON driver_performance_analytics(period_type, analysis_date DESC);
CREATE INDEX idx_driver_performance_earnings ON driver_performance_analytics(gross_earnings DESC);
CREATE INDEX idx_driver_performance_rating ON driver_performance_analytics(average_rating DESC);

CREATE INDEX idx_demand_forecasting_region_date ON demand_forecasting(region_id, forecast_date, forecast_hour);
CREATE INDEX idx_demand_forecasting_generated ON demand_forecasting(generated_at DESC);
CREATE INDEX idx_demand_forecasting_accuracy ON demand_forecasting(prediction_error) WHERE actual_rides IS NOT NULL;

-- Triggers
CREATE TRIGGER update_analytics_dashboards_updated_at BEFORE UPDATE ON analytics_dashboards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_analytics_reports_updated_at BEFORE UPDATE ON analytics_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_revenue_analytics_updated_at BEFORE UPDATE ON revenue_analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_driver_performance_updated_at BEFORE UPDATE ON driver_performance_analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Generate report ID function
CREATE OR REPLACE FUNCTION generate_report_id() RETURNS TEXT AS $$
BEGIN
    RETURN 'RPT' || LPAD(nextval('report_id_seq')::TEXT, 8, '0');
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE report_id_seq START 10000001;

CREATE OR REPLACE FUNCTION set_report_id() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.report_id IS NULL THEN
        NEW.report_id := generate_report_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_report_id_trigger 
    BEFORE INSERT ON analytics_reports 
    FOR EACH ROW 
    EXECUTE FUNCTION set_report_id();

-- Functions for analytics aggregation
CREATE OR REPLACE FUNCTION update_revenue_analytics(p_date DATE, p_region_id UUID DEFAULT NULL) RETURNS VOID AS $$
BEGIN
  INSERT INTO revenue_analytics (
    date, region_id, time_bucket, total_rides, completed_rides, cancelled_rides,
    gross_revenue, net_revenue, driver_earnings, platform_commission,
    processing_fees, average_fare, unique_customers, unique_drivers
  )
  SELECT 
    p_date,
    COALESCE(p_region_id, r.region_id),
    'day',
    COUNT(r.id),
    COUNT(CASE WHEN r.status = 'completed' THEN 1 END),
    COUNT(CASE WHEN r.status = 'cancelled' THEN 1 END),
    COALESCE(SUM(pt.amount), 0),
    COALESCE(SUM(pt.net_amount), 0),
    COALESCE(SUM(de.final_earnings), 0),
    COALESCE(SUM(de.platform_commission), 0),
    COALESCE(SUM(pt.processing_fee), 0),
    COALESCE(AVG(pt.amount), 0),
    COUNT(DISTINCT r.customer_id),
    COUNT(DISTINCT r.driver_id)
  FROM rides r
  LEFT JOIN payment_transactions pt ON r.id = pt.ride_id
  LEFT JOIN driver_earnings de ON pt.id = de.transaction_id
  WHERE DATE(r.created_at) = p_date
    AND (p_region_id IS NULL OR r.region_id = p_region_id)
  GROUP BY COALESCE(p_region_id, r.region_id)
  ON CONFLICT (date, region_id, time_bucket) 
  DO UPDATE SET
    total_rides = EXCLUDED.total_rides,
    completed_rides = EXCLUDED.completed_rides,
    cancelled_rides = EXCLUDED.cancelled_rides,
    gross_revenue = EXCLUDED.gross_revenue,
    net_revenue = EXCLUDED.net_revenue,
    driver_earnings = EXCLUDED.driver_earnings,
    platform_commission = EXCLUDED.platform_commission,
    processing_fees = EXCLUDED.processing_fees,
    average_fare = EXCLUDED.average_fare,
    unique_customers = EXCLUDED.unique_customers,
    unique_drivers = EXCLUDED.unique_drivers,
    updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cleanup_expired_cache() RETURNS INTEGER AS $$
DECLARE
  cleaned_count INTEGER;
BEGIN
  DELETE FROM mapping_cache WHERE expires_at < CURRENT_TIMESTAMP;
  GET DIAGNOSTICS cleaned_count = ROW_COUNT;
  
  DELETE FROM traffic_data WHERE valid_until < CURRENT_TIMESTAMP;
  
  RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql;

-- Sample data
INSERT INTO analytics_dashboards (dashboard_name, dashboard_type, date_range, widgets) VALUES
('Executive Overview', 'executive', '{"period": "last_30_days"}', '[{"type": "revenue_chart"}, {"type": "rides_summary"}, {"type": "driver_metrics"}]'),
('Operations Center', 'operations', '{"period": "today"}', '[{"type": "live_rides"}, {"type": "driver_availability"}, {"type": "surge_heatmap"}]'),
('Financial Dashboard', 'financial', '{"period": "current_month"}', '[{"type": "revenue_breakdown"}, {"type": "commission_analysis"}, {"type": "payout_summary"}]');

-- Comments
COMMENT ON TABLE mapping_cache IS 'Cache for mapping API responses to reduce external API calls';
COMMENT ON TABLE route_optimizations IS 'History of route optimizations and their effectiveness';
COMMENT ON TABLE traffic_data IS 'Real-time and historical traffic information';
COMMENT ON TABLE analytics_dashboards IS 'User-customizable dashboard configurations';
COMMENT ON TABLE analytics_reports IS 'Generated reports and their metadata';
COMMENT ON TABLE revenue_analytics IS 'Aggregated revenue metrics by time periods';
COMMENT ON TABLE driver_performance_analytics IS 'Comprehensive driver performance metrics';
COMMENT ON TABLE demand_forecasting IS 'ML-driven demand predictions and accuracy tracking';