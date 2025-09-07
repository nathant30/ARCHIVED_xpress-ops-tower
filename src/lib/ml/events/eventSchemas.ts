// XPress ML Pipeline - Event Schemas TypeScript Implementation
// Core event types for real-time ML feature engineering

export interface Location {
  lat: number;
  lng: number;
}

export interface BaseEventData {
  event_id: string;
  user_id: string;
  session_id: string;
  timestamp: string; // ISO string
  app_version: string;
  device_type: string;
  location?: Location;
}

export interface DriverEventData extends BaseEventData {
  driver_id: string;
  vehicle_id?: string;
  driver_status: 'offline' | 'online' | 'busy' | 'heading_to_pickup';
}

export interface PassengerEventData extends BaseEventData {
  passenger_id: string;
}

// Driver Behavior Events
export interface RideRequestReceived extends DriverEventData {
  event_type: 'ride_request_received';
  request_id: string;
  pickup_location: Location;
  dropoff_location: Location;
  estimated_duration: number; // minutes
  estimated_distance: number; // km
  surge_multiplier: number;
}

export interface RideRequestResponse extends DriverEventData {
  event_type: 'ride_request_response';
  request_id: string;
  response: 'accepted' | 'rejected' | 'timeout';
  response_time: number; // seconds
  rejection_reason?: string;
}

export interface DriverLocationUpdate extends DriverEventData {
  event_type: 'driver_location_update';
  speed: number; // km/h
  heading: number; // degrees
  accuracy: number; // meters
}

// Passenger UI Events
export interface AppOpen extends PassengerEventData {
  event_type: 'app_open';
  is_cold_start: boolean;
}

export interface RideBookingStarted extends PassengerEventData {
  event_type: 'ride_booking_started';
  pickup_location: Location;
  dropoff_location: Location;
}

export interface UIInteraction extends PassengerEventData {
  event_type: 'ui_interaction';
  element: string; // button_name, screen_name, etc
  action: string; // tap, scroll, swipe
  screen: string; // home, booking, trip, profile
  duration: number; // time spent on screen
}

export interface SearchLocation extends PassengerEventData {
  event_type: 'search_location';
  query: string;
  search_type: 'pickup' | 'dropoff';
  results_count: number;
  selected_result_index?: number;
}

// System Events
export interface MatchingEvent extends BaseEventData {
  event_type: 'matching_event';
  request_id: string;
  driver_id: string;
  passenger_id: string;
  match_score: number;
  match_factors: Record<string, number>; // {"distance": 0.8, "rating": 0.9}
}

// Union type for all events
export type MLEvent = 
  | RideRequestReceived 
  | RideRequestResponse 
  | DriverLocationUpdate
  | AppOpen 
  | RideBookingStarted 
  | UIInteraction 
  | SearchLocation 
  | MatchingEvent;

// Event validation schemas
export const EventTypes = {
  RIDE_REQUEST_RECEIVED: 'ride_request_received',
  RIDE_REQUEST_RESPONSE: 'ride_request_response',
  DRIVER_LOCATION_UPDATE: 'driver_location_update',
  APP_OPEN: 'app_open',
  RIDE_BOOKING_STARTED: 'ride_booking_started',
  UI_INTERACTION: 'ui_interaction',
  SEARCH_LOCATION: 'search_location',
  MATCHING_EVENT: 'matching_event'
} as const;

// Event factory for creating events with proper IDs and timestamps
export class EventFactory {
  static createEvent<T extends MLEvent>(
    eventData: Omit<T, 'event_id' | 'timestamp'> & Partial<Pick<T, 'event_id' | 'timestamp'>>
  ): T {
    return {
      ...eventData,
      event_id: eventData.event_id || crypto.randomUUID(),
      timestamp: eventData.timestamp || new Date().toISOString(),
    } as T;
  }

  // Helper method to create driver location update
  static createDriverLocationUpdate(data: {
    user_id: string;
    session_id: string;
    app_version: string;
    device_type: string;
    driver_id: string;
    location: Location;
    speed: number;
    heading: number;
    accuracy: number;
    driver_status?: DriverEventData['driver_status'];
    vehicle_id?: string;
  }): DriverLocationUpdate {
    return this.createEvent<DriverLocationUpdate>({
      event_type: 'driver_location_update',
      driver_status: 'online',
      ...data,
    });
  }

  // Helper method to create ride request response
  static createRideRequestResponse(data: {
    user_id: string;
    session_id: string;
    app_version: string;
    device_type: string;
    driver_id: string;
    request_id: string;
    response: 'accepted' | 'rejected' | 'timeout';
    response_time: number;
    location?: Location;
    rejection_reason?: string;
    driver_status?: DriverEventData['driver_status'];
    vehicle_id?: string;
  }): RideRequestResponse {
    return this.createEvent<RideRequestResponse>({
      event_type: 'ride_request_response',
      driver_status: 'online',
      ...data,
    });
  }

  // Helper method to create UI interaction
  static createUIInteraction(data: {
    user_id: string;
    session_id: string;
    app_version: string;
    device_type: string;
    passenger_id: string;
    element: string;
    action: string;
    screen: string;
    duration: number;
    location?: Location;
  }): UIInteraction {
    return this.createEvent<UIInteraction>({
      event_type: 'ui_interaction',
      ...data,
    });
  }
}

// Event validation utilities
export function isValidEvent(event: any): event is MLEvent {
  return event && 
    typeof event.event_id === 'string' &&
    typeof event.user_id === 'string' &&
    typeof event.session_id === 'string' &&
    typeof event.timestamp === 'string' &&
    typeof event.app_version === 'string' &&
    typeof event.device_type === 'string' &&
    Object.values(EventTypes).includes(event.event_type);
}

export function getEventSchema(eventType: string): any {
  switch (eventType) {
    case EventTypes.RIDE_REQUEST_RECEIVED:
      return {
        required: ['request_id', 'pickup_location', 'dropoff_location', 'estimated_duration', 'estimated_distance', 'surge_multiplier'],
        properties: {
          request_id: { type: 'string' },
          pickup_location: { type: 'object', properties: { lat: { type: 'number' }, lng: { type: 'number' } } },
          dropoff_location: { type: 'object', properties: { lat: { type: 'number' }, lng: { type: 'number' } } },
          estimated_duration: { type: 'number' },
          estimated_distance: { type: 'number' },
          surge_multiplier: { type: 'number' }
        }
      };
    case EventTypes.RIDE_REQUEST_RESPONSE:
      return {
        required: ['request_id', 'response', 'response_time'],
        properties: {
          request_id: { type: 'string' },
          response: { type: 'string', enum: ['accepted', 'rejected', 'timeout'] },
          response_time: { type: 'number' },
          rejection_reason: { type: 'string' }
        }
      };
    case EventTypes.UI_INTERACTION:
      return {
        required: ['element', 'action', 'screen', 'duration'],
        properties: {
          element: { type: 'string' },
          action: { type: 'string' },
          screen: { type: 'string' },
          duration: { type: 'number' }
        }
      };
    default:
      return {};
  }
}