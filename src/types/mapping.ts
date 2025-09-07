// Mapping services types
export interface GeocodeRequest {
  address: string;
  region?: string;
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  components?: {
    country?: string;
    administrative_area?: string;
    locality?: string;
  };
}

export interface GeocodeResponse {
  results: Array<{
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
      location_type: 'ROOFTOP' | 'RANGE_INTERPOLATED' | 'GEOMETRIC_CENTER' | 'APPROXIMATE';
      viewport: {
        northeast: { lat: number; lng: number };
        southwest: { lat: number; lng: number };
      };
    };
    place_id: string;
    types: string[];
    address_components: Array<{
      long_name: string;
      short_name: string;
      types: string[];
    }>;
  }>;
  status: 'OK' | 'ZERO_RESULTS' | 'OVER_DAILY_LIMIT' | 'OVER_QUERY_LIMIT' | 'REQUEST_DENIED' | 'INVALID_REQUEST';
}

export interface ReverseGeocodeRequest {
  latitude: number;
  longitude: number;
  result_type?: string[];
  location_type?: string[];
}

export interface RouteOptimizationRequest {
  origin: {
    latitude: number;
    longitude: number;
  };
  destination: {
    latitude: number;
    longitude: number;
  };
  waypoints?: Array<{
    latitude: number;
    longitude: number;
    stopover?: boolean;
  }>;
  optimize_waypoints?: boolean;
  avoid?: ('tolls' | 'highways' | 'ferries' | 'indoor')[];
  travel_mode?: 'DRIVING' | 'WALKING' | 'BICYCLING' | 'TRANSIT';
  traffic_model?: 'best_guess' | 'pessimistic' | 'optimistic';
  departure_time?: string;
  arrival_time?: string;
  alternatives?: boolean;
}

export interface RouteOptimizationResponse {
  routes: Array<{
    summary: string;
    legs: Array<{
      distance: {
        text: string;
        value: number;
      };
      duration: {
        text: string;
        value: number;
      };
      duration_in_traffic?: {
        text: string;
        value: number;
      };
      start_address: string;
      end_address: string;
      start_location: {
        lat: number;
        lng: number;
      };
      end_location: {
        lat: number;
        lng: number;
      };
      steps: Array<{
        distance: { text: string; value: number };
        duration: { text: string; value: number };
        end_location: { lat: number; lng: number };
        html_instructions: string;
        polyline: { points: string };
        start_location: { lat: number; lng: number };
        travel_mode: string;
      }>;
    }>;
    overview_polyline: {
      points: string;
    };
    bounds: {
      northeast: { lat: number; lng: number };
      southwest: { lat: number; lng: number };
    };
    copyrights: string;
    warnings: string[];
    waypoint_order?: number[];
  }>;
  status: 'OK' | 'NOT_FOUND' | 'ZERO_RESULTS' | 'MAX_WAYPOINTS_EXCEEDED' | 'INVALID_REQUEST' | 'OVER_DAILY_LIMIT' | 'OVER_QUERY_LIMIT' | 'REQUEST_DENIED';
  geocoded_waypoints?: Array<{
    geocoder_status: string;
    place_id: string;
    types: string[];
  }>;
}

export interface ETACalculationRequest {
  origins: Array<{
    latitude: number;
    longitude: number;
  }>;
  destinations: Array<{
    latitude: number;
    longitude: number;
  }>;
  travel_mode?: 'driving' | 'walking' | 'bicycling' | 'transit';
  avoid?: string[];
  traffic_model?: 'best_guess' | 'pessimistic' | 'optimistic';
  departure_time?: string;
  arrival_time?: string;
}

export interface ETACalculationResponse {
  destination_addresses: string[];
  origin_addresses: string[];
  rows: Array<{
    elements: Array<{
      distance?: {
        text: string;
        value: number;
      };
      duration?: {
        text: string;
        value: number;
      };
      duration_in_traffic?: {
        text: string;
        value: number;
      };
      fare?: {
        currency: string;
        text: string;
        value: number;
      };
      status: 'OK' | 'NOT_FOUND' | 'ZERO_RESULTS' | 'MAX_ROUTE_LENGTH_EXCEEDED';
    }>;
  }>;
  status: 'OK' | 'INVALID_REQUEST' | 'MAX_ELEMENTS_EXCEEDED' | 'OVER_DAILY_LIMIT' | 'OVER_QUERY_LIMIT' | 'REQUEST_DENIED';
}

export interface TrafficDataRequest {
  locations: Array<{
    latitude: number;
    longitude: number;
    radius?: number;
  }>;
  traffic_types?: ('incidents' | 'construction' | 'flow' | 'weather')[];
  include_historical?: boolean;
}

export interface TrafficDataResponse {
  traffic_data: Array<{
    location: {
      latitude: number;
      longitude: number;
    };
    traffic_level: 'free_flow' | 'light' | 'moderate' | 'heavy' | 'stop_and_go';
    speed_kmh?: number;
    delay_seconds?: number;
    incidents: Array<{
      type: 'accident' | 'construction' | 'road_closure' | 'weather' | 'event';
      severity: 'minor' | 'moderate' | 'major' | 'severe';
      description: string;
      start_time?: string;
      estimated_end_time?: string;
      affected_lanes?: number;
    }>;
    flow_data: {
      current_speed: number;
      free_flow_speed: number;
      congestion_ratio: number;
    };
    weather_impact?: {
      condition: string;
      visibility_km: number;
      temperature_c: number;
      precipitation_mm: number;
    };
  }>;
  timestamp: string;
  provider: string;
  coverage_area: {
    northeast: { lat: number; lng: number };
    southwest: { lat: number; lng: number };
  };
}

// Analytics types
export interface DashboardRequest {
  dashboard_type: 'executive' | 'operations' | 'financial' | 'driver' | 'customer';
  date_range: {
    start_date: string;
    end_date: string;
    period: 'hour' | 'day' | 'week' | 'month';
  };
  region_filter?: string[];
  widgets?: string[];
  refresh_interval?: number;
}

export interface DashboardResponse {
  dashboard_id: string;
  widgets: Array<{
    widget_id: string;
    widget_type: string;
    title: string;
    data: any;
    last_updated: string;
    performance_ms: number;
  }>;
  metadata: {
    generated_at: string;
    data_freshness: string;
    next_refresh: string;
    filters_applied: Record<string, any>;
  };
  performance: {
    total_query_time: number;
    cache_hit_rate: number;
    data_points: number;
  };
}

export interface ReportGenerationRequest {
  report_type: 'revenue' | 'driver_performance' | 'demand_forecasting' | 'operational' | 'compliance';
  report_format: 'pdf' | 'excel' | 'csv' | 'json';
  parameters: {
    date_range: {
      start_date: string;
      end_date: string;
    };
    region_filter?: string[];
    driver_filter?: string[];
    metrics?: string[];
    grouping?: 'hour' | 'day' | 'week' | 'month';
    include_charts?: boolean;
    include_raw_data?: boolean;
  };
  delivery_options?: {
    email_to?: string[];
    schedule?: {
      frequency: 'daily' | 'weekly' | 'monthly';
      time: string;
      timezone: string;
    };
  };
}

export interface ReportGenerationResponse {
  report_id: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  estimated_completion_time: string;
  download_url?: string;
  file_size?: number;
  expires_at?: string;
  metadata: {
    generated_by: string;
    parameters: Record<string, any>;
    data_range_covered: {
      start: string;
      end: string;
      record_count: number;
    };
  };
}

export interface RevenueAnalyticsResponse {
  summary: {
    total_revenue: number;
    net_revenue: number;
    growth_rate: number;
    period_comparison: {
      previous_period_revenue: number;
      change_percentage: number;
      change_amount: number;
    };
  };
  breakdown: {
    by_time: Array<{
      period: string;
      gross_revenue: number;
      net_revenue: number;
      ride_count: number;
      average_fare: number;
    }>;
    by_region: Array<{
      region_name: string;
      revenue: number;
      percentage: number;
      growth_rate: number;
    }>;
    by_payment_method: Array<{
      method: string;
      revenue: number;
      percentage: number;
      transaction_count: number;
    }>;
  };
  trends: {
    daily_pattern: number[];
    weekly_pattern: number[];
    seasonal_trends: Array<{
      month: string;
      revenue: number;
      rides: number;
    }>;
  };
  forecasting: {
    next_month_prediction: number;
    confidence_interval: {
      lower: number;
      upper: number;
    };
    factors: string[];
  };
}

export interface DriverPerformanceResponse {
  overview: {
    total_drivers: number;
    active_drivers: number;
    average_rating: number;
    total_rides_completed: number;
    total_earnings: number;
  };
  performance_distribution: {
    rating_distribution: Array<{
      rating_range: string;
      driver_count: number;
      percentage: number;
    }>;
    earnings_distribution: Array<{
      earnings_range: string;
      driver_count: number;
      percentage: number;
    }>;
    efficiency_distribution: Array<{
      efficiency_range: string;
      driver_count: number;
      percentage: number;
    }>;
  };
  top_performers: {
    by_earnings: Array<{
      driver_id: string;
      driver_name: string;
      earnings: number;
      rides_completed: number;
      efficiency_score: number;
    }>;
    by_rating: Array<{
      driver_id: string;
      driver_name: string;
      rating: number;
      total_ratings: number;
      rides_completed: number;
    }>;
    by_efficiency: Array<{
      driver_id: string;
      driver_name: string;
      efficiency_score: number;
      earnings_per_hour: number;
      utilization_rate: number;
    }>;
  };
  trends: {
    average_earnings_trend: number[];
    average_rating_trend: number[];
    driver_retention_rate: number;
    new_driver_onboarding: number[];
  };
  insights: {
    key_metrics: Array<{
      metric: string;
      value: number;
      trend: 'up' | 'down' | 'stable';
      insight: string;
    }>;
    recommendations: string[];
  };
}

export interface DemandForecastingResponse {
  forecast_summary: {
    period: string;
    total_predicted_demand: number;
    confidence_score: number;
    model_accuracy: number;
    last_updated: string;
  };
  hourly_forecast: Array<{
    hour: number;
    predicted_rides: number;
    confidence_interval: {
      lower: number;
      upper: number;
    };
    historical_average: number;
    factors: Array<{
      factor: string;
      impact: number;
      description: string;
    }>;
  }>;
  regional_forecast: Array<{
    region_name: string;
    predicted_demand: number;
    supply_recommendation: number;
    surge_probability: number;
    peak_hours: number[];
  }>;
  external_factors: {
    weather_impact: {
      condition: string;
      impact_multiplier: number;
      affected_regions: string[];
    };
    events_impact: Array<{
      event_name: string;
      location: string;
      impact_multiplier: number;
      time_window: {
        start: string;
        end: string;
      };
    }>;
    seasonal_trends: {
      current_season_multiplier: number;
      holiday_adjustments: Record<string, number>;
    };
  };
  recommendations: {
    driver_positioning: Array<{
      region: string;
      recommended_drivers: number;
      optimal_zones: string[];
      incentive_suggestions: string[];
    }>;
    pricing_strategy: Array<{
      region: string;
      time_window: string;
      recommended_surge_multiplier: number;
      confidence: number;
    }>;
  };
}