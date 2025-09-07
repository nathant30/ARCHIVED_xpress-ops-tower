// Customer system types
export interface Customer {
  id: string;
  user_id: string;
  customer_number: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  phone?: string;
  email?: string;
  profile_picture_url?: string;
  preferred_language: string;
  emergency_contact?: Record<string, any>;
  status: 'active' | 'suspended' | 'banned' | 'deleted';
  verification_status: 'unverified' | 'pending' | 'verified' | 'rejected';
  verification_documents: Record<string, any>;
  preferences: Record<string, any>;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CustomerAddress {
  id: string;
  customer_id: string;
  address_type: 'home' | 'work' | 'other';
  label?: string;
  street_address: string;
  city: string;
  state_province?: string;
  postal_code?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerSupportTicket {
  id: string;
  ticket_number: string;
  customer_id: string;
  ride_id?: string;
  category: string;
  subcategory?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'escalated';
  subject: string;
  description: string;
  attachments: any[];
  assigned_to?: string;
  resolution?: string;
  satisfaction_rating?: number;
  satisfaction_feedback?: string;
  resolved_at?: string;
  escalated_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SupportTicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_type: 'customer' | 'support_agent' | 'system';
  message: string;
  attachments: any[];
  is_internal: boolean;
  created_at: string;
}

export interface CustomerRideRating {
  id: string;
  customer_id: string;
  ride_id: string;
  driver_id: string;
  overall_rating: number;
  driver_rating?: number;
  vehicle_rating?: number;
  punctuality_rating?: number;
  cleanliness_rating?: number;
  feedback?: string;
  compliments: string[];
  complaints: string[];
  would_recommend?: boolean;
  tip_amount: number;
  created_at: string;
}

export interface CustomerPromotion {
  id: string;
  customer_id: string;
  promotion_code: string;
  promotion_name: string;
  promotion_type: 'percentage' | 'fixed_amount' | 'free_ride' | 'cashback';
  discount_value: number;
  minimum_fare: number;
  maximum_discount?: number;
  usage_limit: number;
  used_count: number;
  valid_from: string;
  valid_until: string;
  applicable_regions: string[];
  applicable_vehicle_types: string[];
  terms_conditions?: string;
  status: 'active' | 'expired' | 'used' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface CustomerLoyaltyPoints {
  id: string;
  customer_id: string;
  transaction_type: 'earned' | 'redeemed' | 'expired' | 'adjusted';
  points: number;
  ride_id?: string;
  promotion_id?: string;
  description: string;
  expires_at?: string;
  created_at: string;
}

export interface CustomerReferral {
  id: string;
  referrer_customer_id: string;
  referred_customer_id?: string;
  referral_code: string;
  referred_email?: string;
  referred_phone?: string;
  status: 'pending' | 'completed' | 'expired' | 'cancelled';
  referrer_reward: number;
  referred_reward: number;
  completed_at?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

// Request/Response types
export interface RegisterCustomerRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  password: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  preferred_language?: string;
  emergency_contact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  referral_code?: string;
}

export interface RegisterCustomerResponse {
  customer_id: string;
  customer_number: string;
  user_id: string;
  status: string;
  verification_required: boolean;
  welcome_promotion?: CustomerPromotion;
}

export interface CustomerProfileResponse {
  customer: Customer;
  addresses: CustomerAddress[];
  loyalty_points: number;
  ride_stats: {
    total_rides: number;
    average_rating: number;
    lifetime_spending: number;
    favorite_destinations: string[];
  };
  active_promotions: CustomerPromotion[];
  verification_status: {
    email_verified: boolean;
    phone_verified: boolean;
    identity_verified: boolean;
    required_documents: string[];
  };
}

export interface CreateSupportTicketRequest {
  customer_id: string;
  ride_id?: string;
  category: string;
  subcategory?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  subject: string;
  description: string;
  attachments?: any[];
}

export interface CreateSupportTicketResponse {
  ticket_id: string;
  ticket_number: string;
  status: string;
  estimated_resolution_time: string;
  support_channels: {
    chat_available: boolean;
    phone_available: boolean;
    email_response_time: string;
  };
}

export interface CustomerRideHistoryResponse {
  rides: Array<{
    ride_id: string;
    date: string;
    pickup_address: string;
    destination_address: string;
    driver_name: string;
    vehicle_info: string;
    fare: number;
    status: string;
    rating_given?: number;
    can_rate: boolean;
    can_repeat: boolean;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  summary: {
    total_rides: number;
    total_spent: number;
    average_rating_given: number;
    favorite_pickup_location: string;
    favorite_destination: string;
  };
}

export interface RateRideRequest {
  ride_id: string;
  customer_id: string;
  overall_rating: number;
  driver_rating?: number;
  vehicle_rating?: number;
  punctuality_rating?: number;
  cleanliness_rating?: number;
  feedback?: string;
  compliments?: string[];
  complaints?: string[];
  would_recommend?: boolean;
  tip_amount?: number;
}

export interface RateRideResponse {
  rating_id: string;
  points_earned: number;
  thank_you_message: string;
  driver_notified: boolean;
}

export interface CustomerPromotionsResponse {
  active_promotions: CustomerPromotion[];
  expired_promotions: CustomerPromotion[];
  used_promotions: CustomerPromotion[];
  available_referral_rewards: {
    referral_code: string;
    referrer_reward: number;
    referred_reward: number;
    pending_referrals: number;
    completed_referrals: number;
  };
}

export interface CustomerSummary {
  id: string;
  customer_number: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  status: string;
  verification_status: string;
  created_at: string;
  total_rides: number;
  average_rating: number;
  loyalty_points: number;
  support_tickets: number;
}