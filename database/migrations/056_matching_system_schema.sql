-- Migration: 056_matching_system_schema.sql
-- Description: Create real-time driver matching system tables
-- Created: 2025-09-06

-- Driver availability tracking
CREATE TABLE driver_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'busy', 'break', 'maintenance')),
  location_latitude DECIMAL(10, 8) NOT NULL,
  location_longitude DECIMAL(11, 8) NOT NULL,
  location_point GEOMETRY(POINT, 4326) GENERATED ALWAYS AS (ST_Point(location_longitude, location_latitude)) STORED,
  heading INTEGER CHECK (heading >= 0 AND heading <= 360),
  speed DECIMAL(5, 2) DEFAULT 0 CHECK (speed >= 0),
  accuracy_meters INTEGER DEFAULT 10,
  battery_level INTEGER CHECK (battery_level >= 0 AND battery_level <= 100),
  last_ping TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  available_since TIMESTAMP WITH TIME ZONE,
  total_online_duration INTEGER DEFAULT 0, -- seconds
  preferred_zone_id UUID,
  accepts_long_distance BOOLEAN DEFAULT true,
  accepts_shared_rides BOOLEAN DEFAULT true,
  vehicle_capacity INTEGER DEFAULT 4 CHECK (vehicle_capacity > 0),
  current_destination JSONB,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(driver_id)
);

-- Ride matching requests
CREATE TABLE ride_matching_requests (
  id VARCHAR(50) PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id),
  ride_id UUID REFERENCES rides(id),
  pickup_location JSONB NOT NULL,
  destination_location JSONB NOT NULL,
  vehicle_type VARCHAR(50) NOT NULL DEFAULT 'standard',
  passenger_count INTEGER DEFAULT 1 CHECK (passenger_count > 0),
  preferred_driver_id UUID REFERENCES drivers(id),
  avoid_driver_ids UUID[] DEFAULT '{}',
  special_requirements JSONB DEFAULT '{}',
  max_pickup_distance INTEGER DEFAULT 5000, -- meters
  max_wait_time INTEGER DEFAULT 300, -- seconds
  surge_acceptance BOOLEAN DEFAULT false,
  price_sensitivity VARCHAR(20) DEFAULT 'normal' CHECK (price_sensitivity IN ('low', 'normal', 'high')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'matching', 'matched', 'expired', 'cancelled')),
  priority_score INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  matched_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Driver matching candidates
CREATE TABLE driver_matching_candidates (
  id VARCHAR(50) PRIMARY KEY,
  request_id VARCHAR(50) NOT NULL REFERENCES ride_matching_requests(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES drivers(id),
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  distance_meters INTEGER NOT NULL CHECK (distance_meters >= 0),
  eta_seconds INTEGER NOT NULL CHECK (eta_seconds >= 0),
  driver_rating DECIMAL(3, 2) CHECK (driver_rating >= 0 AND driver_rating <= 5),
  acceptance_rate DECIMAL(3, 2) CHECK (acceptance_rate >= 0 AND acceptance_rate <= 1),
  completion_rate DECIMAL(3, 2) CHECK (completion_rate >= 0 AND completion_rate <= 1),
  response_time_avg INTEGER, -- seconds
  surge_multiplier DECIMAL(3, 2) DEFAULT 1.0 CHECK (surge_multiplier >= 1.0),
  pricing_estimate DECIMAL(10, 2),
  match_quality VARCHAR(20) NOT NULL CHECK (match_quality IN ('excellent', 'good', 'fair', 'poor')),
  rejection_reasons TEXT[] DEFAULT '{}',
  algorithm_version VARCHAR(20) NOT NULL DEFAULT 'v3.2',
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(request_id, driver_id)
);

-- Driver ride responses
CREATE TABLE driver_ride_responses (
  id VARCHAR(50) PRIMARY KEY,
  request_id VARCHAR(50) NOT NULL REFERENCES ride_matching_requests(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES drivers(id),
  response VARCHAR(20) NOT NULL CHECK (response IN ('accepted', 'rejected', 'timeout', 'cancelled')),
  response_time_seconds INTEGER CHECK (response_time_seconds >= 0),
  rejection_reason VARCHAR(100),
  rejection_category VARCHAR(50),
  driver_location JSONB,
  estimated_arrival_time INTEGER, -- seconds
  response_metadata JSONB DEFAULT '{}',
  responded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(request_id, driver_id)
);

-- Matching queue management
CREATE TABLE matching_queue (
  id VARCHAR(50) PRIMARY KEY,
  request_id VARCHAR(50) NOT NULL REFERENCES ride_matching_requests(id) ON DELETE CASCADE,
  queue_position INTEGER NOT NULL DEFAULT 1,
  current_phase VARCHAR(20) NOT NULL DEFAULT 'initial' CHECK (current_phase IN ('initial', 'broadcast', 'negotiation', 'assignment', 'timeout')),
  drivers_contacted INTEGER DEFAULT 0,
  drivers_responded INTEGER DEFAULT 0,
  best_match_driver_id UUID REFERENCES drivers(id),
  best_match_score INTEGER,
  timeout_attempts INTEGER DEFAULT 0,
  last_broadcast_at TIMESTAMP WITH TIME ZONE,
  assignment_deadline TIMESTAMP WITH TIME ZONE,
  algorithm_config JSONB NOT NULL DEFAULT '{}',
  processing_log JSONB[] DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(request_id)
);

-- Driver matching performance metrics
CREATE TABLE driver_matching_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_requests_received INTEGER DEFAULT 0,
  total_requests_accepted INTEGER DEFAULT 0,
  total_requests_rejected INTEGER DEFAULT 0,
  total_timeouts INTEGER DEFAULT 0,
  acceptance_rate DECIMAL(5, 4) DEFAULT 0 CHECK (acceptance_rate >= 0 AND acceptance_rate <= 1),
  avg_response_time_seconds DECIMAL(8, 2) DEFAULT 0 CHECK (avg_response_time_seconds >= 0),
  total_completed_rides INTEGER DEFAULT 0,
  completion_rate DECIMAL(5, 4) DEFAULT 0 CHECK (completion_rate >= 0 AND completion_rate <= 1),
  avg_customer_rating DECIMAL(3, 2) CHECK (avg_customer_rating >= 0 AND avg_customer_rating <= 5),
  total_cancellations INTEGER DEFAULT 0,
  cancellation_rate DECIMAL(5, 4) DEFAULT 0 CHECK (cancellation_rate >= 0 AND cancellation_rate <= 1),
  peak_hours_availability DECIMAL(5, 2) DEFAULT 0, -- hours
  off_peak_hours_availability DECIMAL(5, 2) DEFAULT 0, -- hours
  total_earnings DECIMAL(12, 2) DEFAULT 0,
  efficiency_score DECIMAL(5, 2) DEFAULT 0 CHECK (efficiency_score >= 0 AND efficiency_score <= 100),
  reliability_score DECIMAL(5, 2) DEFAULT 0 CHECK (reliability_score >= 0 AND reliability_score <= 100),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(driver_id, date)
);

-- Performance indexes
CREATE INDEX idx_driver_availability_driver_id ON driver_availability(driver_id);
CREATE INDEX idx_driver_availability_status ON driver_availability(status) WHERE status IN ('online', 'available');
CREATE INDEX idx_driver_availability_location ON driver_availability USING GIST(location_point);
CREATE INDEX idx_driver_availability_last_ping ON driver_availability(last_ping DESC) WHERE status = 'online';
CREATE INDEX idx_driver_availability_zone ON driver_availability(preferred_zone_id) WHERE preferred_zone_id IS NOT NULL;

CREATE INDEX idx_ride_matching_requests_customer ON ride_matching_requests(customer_id);
CREATE INDEX idx_ride_matching_requests_status ON ride_matching_requests(status, created_at DESC);
CREATE INDEX idx_ride_matching_requests_expires ON ride_matching_requests(expires_at) WHERE status IN ('pending', 'matching');
CREATE INDEX idx_ride_matching_requests_priority ON ride_matching_requests(priority_score DESC, created_at);

CREATE INDEX idx_driver_matching_candidates_request ON driver_matching_candidates(request_id);
CREATE INDEX idx_driver_matching_candidates_driver ON driver_matching_candidates(driver_id);
CREATE INDEX idx_driver_matching_candidates_score ON driver_matching_candidates(request_id, score DESC);

CREATE INDEX idx_driver_ride_responses_request ON driver_ride_responses(request_id);
CREATE INDEX idx_driver_ride_responses_driver ON driver_ride_responses(driver_id, responded_at DESC);
CREATE INDEX idx_driver_ride_responses_response ON driver_ride_responses(response, responded_at DESC);

CREATE INDEX idx_matching_queue_status ON matching_queue(status, created_at DESC);
CREATE INDEX idx_matching_queue_phase ON matching_queue(current_phase, assignment_deadline) WHERE status = 'active';
CREATE INDEX idx_matching_queue_deadline ON matching_queue(assignment_deadline) WHERE status = 'active';

CREATE INDEX idx_driver_matching_performance_driver_date ON driver_matching_performance(driver_id, date DESC);
CREATE INDEX idx_driver_matching_performance_acceptance_rate ON driver_matching_performance(acceptance_rate DESC, date DESC);
CREATE INDEX idx_driver_matching_performance_efficiency ON driver_matching_performance(efficiency_score DESC, date DESC);

-- Triggers
CREATE TRIGGER update_driver_availability_updated_at BEFORE UPDATE ON driver_availability FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ride_matching_requests_updated_at BEFORE UPDATE ON ride_matching_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_matching_queue_updated_at BEFORE UPDATE ON matching_queue FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_driver_matching_performance_updated_at BEFORE UPDATE ON driver_matching_performance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-update location point when coordinates change
CREATE OR REPLACE FUNCTION update_driver_location_point() RETURNS TRIGGER AS $$
BEGIN
    NEW.location_point := ST_Point(NEW.location_longitude, NEW.location_latitude);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Functions for matching operations
CREATE OR REPLACE FUNCTION update_driver_online_duration() RETURNS TRIGGER AS $$
BEGIN
    -- Update total online duration when driver goes offline
    IF OLD.status = 'online' AND NEW.status != 'online' AND OLD.available_since IS NOT NULL THEN
        NEW.total_online_duration := COALESCE(OLD.total_online_duration, 0) + 
            EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - OLD.available_since))::INTEGER;
        NEW.available_since := NULL;
    END IF;
    
    -- Set available_since when driver comes online
    IF OLD.status != 'online' AND NEW.status = 'online' THEN
        NEW.available_since := CURRENT_TIMESTAMP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_driver_online_duration 
    BEFORE UPDATE ON driver_availability 
    FOR EACH ROW 
    EXECUTE FUNCTION update_driver_online_duration();

-- Cleanup expired matching requests
CREATE OR REPLACE FUNCTION cleanup_expired_matching_requests() RETURNS INTEGER AS $$
DECLARE
    cleaned_count INTEGER;
BEGIN
    -- Mark expired requests as expired
    UPDATE ride_matching_requests 
    SET status = 'expired', updated_at = CURRENT_TIMESTAMP
    WHERE status IN ('pending', 'matching') 
      AND expires_at < CURRENT_TIMESTAMP;
    
    GET DIAGNOSTICS cleaned_count = ROW_COUNT;
    
    -- Update matching queue for expired requests
    UPDATE matching_queue 
    SET status = 'failed', updated_at = CURRENT_TIMESTAMP
    WHERE status = 'active' 
      AND request_id IN (
        SELECT id FROM ride_matching_requests 
        WHERE status = 'expired'
      );
    
    RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql;

-- Calculate driver matching score
CREATE OR REPLACE FUNCTION calculate_matching_score(
    p_distance_meters INTEGER,
    p_driver_rating DECIMAL,
    p_acceptance_rate DECIMAL,
    p_completion_rate DECIMAL
) RETURNS INTEGER AS $$
DECLARE
    distance_score INTEGER;
    rating_score INTEGER;
    acceptance_score INTEGER;
    completion_score INTEGER;
    final_score INTEGER;
BEGIN
    -- Distance score (closer is better, max 5km)
    distance_score := GREATEST(0, 100 - (p_distance_meters / 50));
    
    -- Rating score (out of 5, scaled to 100)
    rating_score := COALESCE(p_driver_rating, 4.0) * 20;
    
    -- Acceptance rate score
    acceptance_score := COALESCE(p_acceptance_rate, 0.8) * 100;
    
    -- Completion rate score
    completion_score := COALESCE(p_completion_rate, 0.9) * 100;
    
    -- Weighted final score
    final_score := 
        distance_score * 0.4 +
        rating_score * 0.3 +
        acceptance_score * 0.2 +
        completion_score * 0.1;
    
    RETURN LEAST(100, GREATEST(0, final_score::INTEGER));
END;
$$ LANGUAGE plpgsql;

-- Sample data
INSERT INTO driver_availability (driver_id, status, location_latitude, location_longitude, vehicle_capacity) 
SELECT 
    d.id,
    (ARRAY['online', 'offline', 'busy'])[(RANDOM() * 3)::INT + 1],
    14.5995 + (RANDOM() - 0.5) * 0.1, -- Manila area
    120.9842 + (RANDOM() - 0.5) * 0.1,
    4
FROM drivers d
LIMIT 50;

-- Update some drivers to be online
UPDATE driver_availability 
SET status = 'online', last_ping = CURRENT_TIMESTAMP, available_since = CURRENT_TIMESTAMP
WHERE id IN (
    SELECT id FROM driver_availability ORDER BY RANDOM() LIMIT 15
);

-- Comments
COMMENT ON TABLE driver_availability IS 'Real-time driver availability and location tracking';
COMMENT ON TABLE ride_matching_requests IS 'Customer requests for ride matching';
COMMENT ON TABLE driver_matching_candidates IS 'Scored driver candidates for each matching request';
COMMENT ON TABLE driver_ride_responses IS 'Driver responses to ride requests (accept/reject)';
COMMENT ON TABLE matching_queue IS 'Queue management for ride matching process';
COMMENT ON TABLE driver_matching_performance IS 'Historical driver matching performance metrics';

COMMENT ON COLUMN driver_availability.location_point IS 'PostGIS point geometry for spatial queries';
COMMENT ON COLUMN driver_availability.total_online_duration IS 'Total seconds driver has been online';
COMMENT ON COLUMN ride_matching_requests.priority_score IS 'Priority score for queue ordering (higher = more priority)';
COMMENT ON COLUMN driver_matching_candidates.score IS 'Calculated matching score (0-100, higher = better match)';
COMMENT ON COLUMN matching_queue.processing_log IS 'Array of processing events and timestamps';
COMMENT ON COLUMN driver_matching_performance.efficiency_score IS 'Overall efficiency score combining multiple metrics';