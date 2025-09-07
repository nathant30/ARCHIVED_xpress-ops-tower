// Driver matching and real-time system types
export interface DriverAvailability {
  id: string;
  driver_id: string;
  status: 'online' | 'offline' | 'busy' | 'break' | 'maintenance';
  location_latitude: number;
  location_longitude: number;
  heading?: number;
  speed: number;
  accuracy_meters: number;
  battery_level?: number;
  last_ping: string;
  available_since?: string;
  total_online_duration: number;
  preferred_zone_id?: string;
  accepts_long_distance: boolean;
  accepts_shared_rides: boolean;
  vehicle_capacity: number;
  current_destination?: Record<string, any>;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface RideMatchingRequest {
  id: string;
  customer_id: string;
  ride_id?: string;
  pickup_location: {
    latitude: number;
    longitude: number;
    address: string;
    geometry?: any;
  };
  destination_location: {
    latitude: number;
    longitude: number;
    address: string;
    geometry?: any;
  };
  vehicle_type: string;
  passenger_count: number;
  preferred_driver_id?: string;
  avoid_driver_ids: string[];
  special_requirements: Record<string, any>;
  max_pickup_distance: number;
  max_wait_time: number;
  surge_acceptance: boolean;
  price_sensitivity: 'low' | 'normal' | 'high';
  status: 'pending' | 'matching' | 'matched' | 'expired' | 'cancelled';
  priority_score: number;
  created_at: string;
  expires_at: string;
  matched_at?: string;
  updated_at: string;
}

export interface DriverMatchingCandidate {
  id: string;
  request_id: string;
  driver_id: string;
  score: number;
  distance_meters: number;
  eta_seconds: number;
  driver_rating?: number;
  acceptance_rate?: number;
  completion_rate?: number;
  response_time_avg?: number;
  surge_multiplier: number;
  pricing_estimate?: number;
  match_quality: 'excellent' | 'good' | 'fair' | 'poor';
  rejection_reasons: string[];
  algorithm_version: string;
  calculated_at: string;
}

export interface DriverRideResponse {
  id: string;
  request_id: string;
  driver_id: string;
  response: 'accepted' | 'rejected' | 'timeout' | 'cancelled';
  response_time_seconds?: number;
  rejection_reason?: string;
  rejection_category?: string;
  driver_location?: Record<string, any>;
  estimated_arrival_time?: number;
  response_metadata: Record<string, any>;
  responded_at: string;
}

export interface MatchingQueue {
  id: string;
  request_id: string;
  queue_position: number;
  current_phase: 'initial' | 'broadcast' | 'negotiation' | 'assignment' | 'timeout';
  drivers_contacted: number;
  drivers_responded: number;
  best_match_driver_id?: string;
  best_match_score?: number;
  timeout_attempts: number;
  last_broadcast_at?: string;
  assignment_deadline?: string;
  algorithm_config: Record<string, any>;
  processing_log: any[];
  status: 'active' | 'paused' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface DriverMatchingPerformance {
  id: string;
  driver_id: string;
  date: string;
  total_requests_received: number;
  total_requests_accepted: number;
  total_requests_rejected: number;
  total_timeouts: number;
  acceptance_rate: number;
  avg_response_time_seconds: number;
  total_completed_rides: number;
  completion_rate: number;
  avg_customer_rating: number;
  total_cancellations: number;
  cancellation_rate: number;
  peak_hours_availability: number;
  off_peak_hours_availability: number;
  total_earnings: number;
  efficiency_score: number;
  reliability_score: number;
  updated_at: string;
}

// Request/Response types
export interface FindDriverRequest {
  customer_id: string;
  pickup_location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  destination_location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  vehicle_type: string;
  passenger_count?: number;
  preferred_driver_id?: string;
  avoid_driver_ids?: string[];
  special_requirements?: Record<string, any>;
  max_pickup_distance?: number;
  max_wait_time?: number;
  surge_acceptance?: boolean;
  price_sensitivity?: 'low' | 'normal' | 'high';
}

export interface FindDriverResponse {
  request_id: string;
  status: string;
  queue_position: number;
  estimated_match_time: string;
  candidates_found: number;
  best_match?: {
    driver_id: string;
    driver_name: string;
    vehicle_info: string;
    rating: number;
    distance_meters: number;
    eta_seconds: number;
    score: number;
  };
  pricing_estimate: {
    base_fare: number;
    surge_multiplier: number;
    estimated_total: number;
    currency: string;
  };
}

export interface DriverAvailabilityResponse {
  drivers: Array<{
    driver_id: string;
    driver_name: string;
    vehicle_info: string;
    location: {
      latitude: number;
      longitude: number;
    };
    status: string;
    distance_meters: number;
    rating: number;
    acceptance_rate: number;
    last_ping: string;
  }>;
  total_online: number;
  total_available: number;
  zone_coverage: Record<string, number>;
  summary: {
    average_distance: number;
    average_rating: number;
    response_time_estimate: string;
  };
}

export interface AcceptRideRequest {
  request_id: string;
  driver_id: string;
  estimated_arrival_time: number;
  current_location: {
    latitude: number;
    longitude: number;
  };
  notes?: string;
}

export interface AcceptRideResponse {
  response_id: string;
  status: string;
  ride_id?: string;
  customer_contact: {
    phone?: string;
    pickup_instructions?: string;
  };
  navigation: {
    pickup_coordinates: {
      latitude: number;
      longitude: number;
    };
    estimated_route: any;
    traffic_alerts: string[];
  };
  earnings_estimate: {
    base_fare: number;
    commission_rate: number;
    estimated_earnings: number;
  };
}

export interface RejectRideRequest {
  request_id: string;
  driver_id: string;
  rejection_reason: string;
  rejection_category?: string;
}

export interface RejectRideResponse {
  response_id: string;
  status: string;
  impact: {
    acceptance_rate_change: number;
    next_request_delay: number;
  };
  feedback_requested: boolean;
}

export interface QueueStatusResponse {
  request_id: string;
  status: string;
  queue_position: number;
  current_phase: string;
  drivers_contacted: number;
  drivers_responded: number;
  responses: Array<{
    driver_id: string;
    response: string;
    response_time: number;
    rejection_reason?: string;
  }>;
  next_action: {
    action: string;
    estimated_time: string;
  };
  timeout_info: {
    remaining_time: number;
    max_attempts: number;
    current_attempt: number;
  };
}

export interface MatchingAlgorithmConfig {
  version: string;
  weights: {
    distance: number;
    time: number;
    rating: number;
    acceptance_rate: number;
    completion_rate: number;
  };
  thresholds: {
    max_distance_meters: number;
    max_eta_seconds: number;
    min_driver_rating: number;
    min_acceptance_rate: number;
  };
  surge_factors: {
    demand_threshold: number;
    max_multiplier: number;
    zone_specific: boolean;
  };
}