-- Migration: 054_driver_matching_schema.sql
-- Description: Create driver matching and real-time systems tables
-- Created: 2025-09-05

-- Driver availability and real-time status
CREATE TABLE driver_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL CHECK (status IN ('online', 'offline', 'busy', 'break', 'maintenance')),
  location_latitude DECIMAL(10, 8) NOT NULL,
  location_longitude DECIMAL(11, 8) NOT NULL,
  heading INTEGER CHECK (heading >= 0 AND heading < 360),
  speed INTEGER DEFAULT 0,
  accuracy_meters INTEGER DEFAULT 0,
  battery_level INTEGER CHECK (battery_level >= 0 AND battery_level <= 100),
  last_ping TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  available_since TIMESTAMP WITH TIME ZONE,
  total_online_duration INTEGER DEFAULT 0, -- seconds
  preferred_zone_id UUID,
  accepts_long_distance BOOLEAN DEFAULT true,
  accepts_shared_rides BOOLEAN DEFAULT true,
  vehicle_capacity INTEGER DEFAULT 4,
  current_destination JSONB,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ride matching requests and queue
CREATE TABLE ride_matching_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  ride_id UUID REFERENCES rides(id),
  pickup_location JSONB NOT NULL,
  destination_location JSONB NOT NULL,
  vehicle_type VARCHAR(50) NOT NULL,
  passenger_count INTEGER DEFAULT 1 CHECK (passenger_count > 0),
  preferred_driver_id UUID REFERENCES drivers(id),
  avoid_driver_ids JSONB DEFAULT '[]',
  special_requirements JSONB DEFAULT '{}',
  max_pickup_distance INTEGER DEFAULT 5000, -- meters
  max_wait_time INTEGER DEFAULT 600, -- seconds
  surge_acceptance BOOLEAN DEFAULT true,
  price_sensitivity VARCHAR(20) DEFAULT 'normal' CHECK (price_sensitivity IN ('low', 'normal', 'high')),
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'matching', 'matched', 'expired', 'cancelled')),
  priority_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '10 minutes'),
  matched_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Driver matching algorithm results and scoring
CREATE TABLE driver_matching_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES ride_matching_requests(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES drivers(id),
  score DECIMAL(5,2) NOT NULL,
  distance_meters INTEGER NOT NULL,
  eta_seconds INTEGER NOT NULL,
  driver_rating DECIMAL(3,2),
  acceptance_rate DECIMAL(5,2),
  completion_rate DECIMAL(5,2),
  response_time_avg INTEGER, -- average seconds to respond
  surge_multiplier DECIMAL(3,2) DEFAULT 1.0,
  pricing_estimate DECIMAL(10,2),
  match_quality VARCHAR(20) NOT NULL CHECK (match_quality IN ('excellent', 'good', 'fair', 'poor')),
  rejection_reasons JSONB DEFAULT '[]',
  algorithm_version VARCHAR(20) NOT NULL DEFAULT 'v1.0',
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Driver responses to ride requests
CREATE TABLE driver_ride_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES ride_matching_requests(id),
  driver_id UUID NOT NULL REFERENCES drivers(id),
  response VARCHAR(20) NOT NULL CHECK (response IN ('accepted', 'rejected', 'timeout', 'cancelled')),
  response_time_seconds INTEGER,
  rejection_reason VARCHAR(100),
  rejection_category VARCHAR(50),
  driver_location JSONB,
  estimated_arrival_time INTEGER, -- seconds
  response_metadata JSONB DEFAULT '{}',
  responded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(request_id, driver_id)
);

-- Real-time matching queue and coordination
CREATE TABLE matching_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES ride_matching_requests(id),
  queue_position INTEGER NOT NULL,
  current_phase VARCHAR(50) NOT NULL CHECK (current_phase IN ('initial', 'broadcast', 'negotiation', 'assignment', 'timeout')),
  drivers_contacted INTEGER DEFAULT 0,
  drivers_responded INTEGER DEFAULT 0,
  best_match_driver_id UUID REFERENCES drivers(id),
  best_match_score DECIMAL(5,2),
  timeout_attempts INTEGER DEFAULT 0,
  last_broadcast_at TIMESTAMP WITH TIME ZONE,
  assignment_deadline TIMESTAMP WITH TIME ZONE,
  algorithm_config JSONB DEFAULT '{}',
  processing_log JSONB DEFAULT '[]',
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Driver performance metrics for matching algorithm
CREATE TABLE driver_matching_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_requests_received INTEGER DEFAULT 0,
  total_requests_accepted INTEGER DEFAULT 0,
  total_requests_rejected INTEGER DEFAULT 0,
  total_timeouts INTEGER DEFAULT 0,
  acceptance_rate DECIMAL(5,2) DEFAULT 0,
  avg_response_time_seconds DECIMAL(8,2) DEFAULT 0,
  total_completed_rides INTEGER DEFAULT 0,
  completion_rate DECIMAL(5,2) DEFAULT 0,
  avg_customer_rating DECIMAL(3,2) DEFAULT 0,
  total_cancellations INTEGER DEFAULT 0,
  cancellation_rate DECIMAL(5,2) DEFAULT 0,
  peak_hours_availability INTEGER DEFAULT 0, -- hours available during peak times
  off_peak_hours_availability INTEGER DEFAULT 0,
  total_earnings DECIMAL(10,2) DEFAULT 0,
  efficiency_score DECIMAL(5,2) DEFAULT 0, -- earnings per online hour
  reliability_score DECIMAL(5,2) DEFAULT 0, -- consistency metrics
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(driver_id, date)
);

-- Geographic zones for optimized matching
CREATE TABLE matching_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  region_id UUID REFERENCES regions(id),
  boundary_polygon GEOMETRY(POLYGON, 4326) NOT NULL,
  zone_type VARCHAR(50) NOT NULL CHECK (zone_type IN ('city_center', 'residential', 'commercial', 'industrial', 'airport', 'mall', 'hospital')),
  demand_multiplier DECIMAL(3,2) DEFAULT 1.0,
  supply_target INTEGER DEFAULT 10, -- target number of active drivers
  surge_threshold_ratio DECIMAL(3,2) DEFAULT 2.0, -- demand/supply ratio to trigger surge
  max_pickup_radius INTEGER DEFAULT 3000, -- meters
  priority_level INTEGER DEFAULT 0,
  special_requirements JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Performance indexes for high-volume operations
CREATE INDEX idx_driver_availability_status ON driver_availability(status) WHERE status IN ('online', 'available');
CREATE INDEX idx_driver_availability_location ON driver_availability USING GIST(ST_Point(location_longitude, location_latitude)) WHERE status = 'online';
CREATE INDEX idx_driver_availability_last_ping ON driver_availability(last_ping DESC) WHERE status = 'online';
CREATE INDEX idx_driver_availability_driver_id ON driver_availability(driver_id);

CREATE INDEX idx_ride_matching_requests_status ON ride_matching_requests(status) WHERE status IN ('pending', 'matching');
CREATE INDEX idx_ride_matching_requests_created ON ride_matching_requests(created_at DESC) WHERE status = 'pending';
CREATE INDEX idx_ride_matching_requests_expires ON ride_matching_requests(expires_at ASC) WHERE status IN ('pending', 'matching');
CREATE INDEX idx_ride_matching_requests_customer ON ride_matching_requests(customer_id);
CREATE INDEX idx_ride_matching_requests_pickup_location ON ride_matching_requests USING GIST(ST_GeomFromGeoJSON(pickup_location->>'geometry'));

CREATE INDEX idx_driver_matching_candidates_request ON driver_matching_candidates(request_id);
CREATE INDEX idx_driver_matching_candidates_score ON driver_matching_candidates(request_id, score DESC);
CREATE INDEX idx_driver_matching_candidates_driver ON driver_matching_candidates(driver_id);

CREATE INDEX idx_driver_ride_responses_request ON driver_ride_responses(request_id);
CREATE INDEX idx_driver_ride_responses_driver ON driver_ride_responses(driver_id);
CREATE INDEX idx_driver_ride_responses_response ON driver_ride_responses(response);
CREATE INDEX idx_driver_ride_responses_responded_at ON driver_ride_responses(responded_at DESC);

CREATE INDEX idx_matching_queue_status ON matching_queue(status) WHERE status = 'active';
CREATE INDEX idx_matching_queue_created ON matching_queue(created_at ASC) WHERE status = 'active';
CREATE INDEX idx_matching_queue_request ON matching_queue(request_id);

CREATE INDEX idx_driver_performance_driver_date ON driver_matching_performance(driver_id, date DESC);
CREATE INDEX idx_driver_performance_acceptance ON driver_matching_performance(acceptance_rate DESC) WHERE acceptance_rate > 0;
CREATE INDEX idx_driver_performance_efficiency ON driver_matching_performance(efficiency_score DESC) WHERE efficiency_score > 0;

CREATE INDEX idx_matching_zones_boundary ON matching_zones USING GIST(boundary_polygon) WHERE is_active = true;
CREATE INDEX idx_matching_zones_region ON matching_zones(region_id) WHERE is_active = true;

-- Triggers for updated_at timestamps
CREATE TRIGGER update_driver_availability_updated_at BEFORE UPDATE ON driver_availability FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ride_matching_requests_updated_at BEFORE UPDATE ON ride_matching_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_matching_queue_updated_at BEFORE UPDATE ON matching_queue FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_matching_zones_updated_at BEFORE UPDATE ON matching_zones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate driver matching score
CREATE OR REPLACE FUNCTION calculate_driver_matching_score(
  p_driver_id UUID,
  p_request_id UUID,
  p_distance_meters INTEGER,
  p_eta_seconds INTEGER
) RETURNS DECIMAL(5,2) AS $$
DECLARE
  driver_rating DECIMAL(3,2);
  acceptance_rate DECIMAL(5,2);
  completion_rate DECIMAL(5,2);
  distance_score DECIMAL(5,2);
  time_score DECIMAL(5,2);
  performance_score DECIMAL(5,2);
  final_score DECIMAL(5,2);
BEGIN
  -- Get driver performance metrics
  SELECT 
    COALESCE(d.rating, 3.0),
    COALESCE(dmp.acceptance_rate, 50.0),
    COALESCE(dmp.completion_rate, 90.0)
  INTO driver_rating, acceptance_rate, completion_rate
  FROM drivers d
  LEFT JOIN driver_matching_performance dmp ON d.id = dmp.driver_id AND dmp.date = CURRENT_DATE
  WHERE d.id = p_driver_id;

  -- Distance score (closer is better, max 5km considered)
  distance_score := GREATEST(0, 100 - (p_distance_meters::DECIMAL / 50)); -- 50m = 1 point penalty

  -- Time score (faster ETA is better, max 20 min considered)
  time_score := GREATEST(0, 100 - (p_eta_seconds::DECIMAL / 12)); -- 12s = 1 point penalty

  -- Performance score (rating + acceptance + completion rates)
  performance_score := (driver_rating * 20) + (acceptance_rate * 0.3) + (completion_rate * 0.2);

  -- Weighted final score
  final_score := (distance_score * 0.4) + (time_score * 0.3) + (performance_score * 0.3);

  RETURN LEAST(100.00, GREATEST(0.00, final_score));
END;
$$ LANGUAGE plpgsql;

-- Function to update driver performance metrics
CREATE OR REPLACE FUNCTION update_driver_performance_metrics(p_driver_id UUID) RETURNS VOID AS $$
DECLARE
  perf_record RECORD;
BEGIN
  -- Calculate today's performance metrics
  SELECT 
    COUNT(*) as total_requests,
    COUNT(CASE WHEN response = 'accepted' THEN 1 END) as accepted,
    COUNT(CASE WHEN response = 'rejected' THEN 1 END) as rejected,
    COUNT(CASE WHEN response = 'timeout' THEN 1 END) as timeouts,
    AVG(CASE WHEN response_time_seconds IS NOT NULL THEN response_time_seconds END) as avg_response_time
  INTO perf_record
  FROM driver_ride_responses
  WHERE driver_id = p_driver_id 
    AND responded_at >= CURRENT_DATE
    AND responded_at < CURRENT_DATE + INTERVAL '1 day';

  -- Insert or update performance record
  INSERT INTO driver_matching_performance (
    driver_id, date, total_requests_received, total_requests_accepted,
    total_requests_rejected, total_timeouts, acceptance_rate, avg_response_time_seconds
  ) VALUES (
    p_driver_id, 
    CURRENT_DATE,
    perf_record.total_requests,
    perf_record.accepted,
    perf_record.rejected,
    perf_record.timeouts,
    CASE WHEN perf_record.total_requests > 0 
         THEN (perf_record.accepted::DECIMAL / perf_record.total_requests * 100)
         ELSE 0 END,
    perf_record.avg_response_time
  )
  ON CONFLICT (driver_id, date) 
  DO UPDATE SET
    total_requests_received = EXCLUDED.total_requests_received,
    total_requests_accepted = EXCLUDED.total_requests_accepted,
    total_requests_rejected = EXCLUDED.total_requests_rejected,
    total_timeouts = EXCLUDED.total_timeouts,
    acceptance_rate = EXCLUDED.acceptance_rate,
    avg_response_time_seconds = EXCLUDED.avg_response_time_seconds,
    updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup expired matching requests
CREATE OR REPLACE FUNCTION cleanup_expired_matching_requests() RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  -- Update expired requests
  UPDATE ride_matching_requests 
  SET status = 'expired', updated_at = CURRENT_TIMESTAMP
  WHERE status IN ('pending', 'matching') 
    AND expires_at < CURRENT_TIMESTAMP;
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  
  -- Cleanup related queue entries
  UPDATE matching_queue 
  SET status = 'failed', updated_at = CURRENT_TIMESTAMP
  WHERE request_id IN (
    SELECT id FROM ride_matching_requests WHERE status = 'expired'
  ) AND status = 'active';
  
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- Sample data for testing
INSERT INTO matching_zones (name, boundary_polygon, zone_type, demand_multiplier) VALUES
('Makati CBD', ST_GeomFromText('POLYGON((121.0155 14.5547, 121.0280 14.5547, 121.0280 14.5650, 121.0155 14.5650, 121.0155 14.5547))', 4326), 'city_center', 1.5),
('BGC', ST_GeomFromText('POLYGON((121.0430 14.5490, 121.0580 14.5490, 121.0580 14.5590, 121.0430 14.5590, 121.0430 14.5490))', 4326), 'commercial', 1.3),
('NAIA Airport', ST_GeomFromText('POLYGON((120.9890 14.5020, 121.0100 14.5020, 121.0100 14.5180, 120.9890 14.5180, 120.9890 14.5020))', 4326), 'airport', 1.8),
('Ortigas Center', ST_GeomFromText('POLYGON((121.0520 14.5840, 121.0720 14.5840, 121.0720 14.5980, 121.0520 14.5980, 121.0520 14.5840))', 4326), 'commercial', 1.2);

-- Comments
COMMENT ON TABLE driver_availability IS 'Real-time driver availability and location tracking';
COMMENT ON TABLE ride_matching_requests IS 'Customer ride requests waiting for driver matching';
COMMENT ON TABLE driver_matching_candidates IS 'Algorithm-generated driver candidates for each request';
COMMENT ON TABLE driver_ride_responses IS 'Driver responses to ride requests (accept/reject)';
COMMENT ON TABLE matching_queue IS 'Real-time queue management for ride matching process';
COMMENT ON TABLE driver_matching_performance IS 'Daily performance metrics for matching algorithm optimization';
COMMENT ON TABLE matching_zones IS 'Geographic zones with different matching rules and parameters';