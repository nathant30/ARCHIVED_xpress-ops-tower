// Complete API endpoints data for documentation
export interface APIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  title: string;
  description: string;
  tags: string[];
  requestBody?: any;
  responses: Record<string, any>;
  parameters?: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  security?: string[];
}

export interface APICategory {
  name: string;
  description: string;
  endpoints: APIEndpoint[];
  icon: string;
  priority: number;
}

export const allApiEndpoints: APICategory[] = [
  {
    name: "Authentication & Authorization",
    description: "JWT-based authentication, MFA, RBAC, session management, and security controls",
    icon: "🔐",
    priority: 1,
    endpoints: [
      {
        method: "POST",
        path: "/api/auth/login",
        title: "User Login",
        description: "Authenticate user with email/phone and password",
        tags: ["Authentication", "Core"],
        requestBody: {
          email: "user@example.com",
          password: "securepassword",
          remember_me: true
        },
        responses: {
          200: {
            success: true,
            data: {
              user_id: "user_123",
              access_token: "jwt_token_here",
              refresh_token: "refresh_token_here",
              expires_in: 3600
            }
          }
        }
      },
      {
        method: "POST",
        path: "/api/auth/logout",
        title: "User Logout", 
        description: "Invalidate user session and tokens",
        tags: ["Authentication"],
        responses: {
          200: { success: true, message: "Logged out successfully" }
        }
      },
      {
        method: "POST",
        path: "/api/auth/refresh",
        title: "Refresh Token",
        description: "Get new access token using refresh token",
        tags: ["Authentication"],
        requestBody: { refresh_token: "refresh_token_here" },
        responses: {
          200: { success: true, data: { access_token: "new_jwt_token", expires_in: 3600 }}
        }
      },
      {
        method: "POST",
        path: "/api/auth/validate",
        title: "Validate Token",
        description: "Validate access token and return user information",
        tags: ["Authentication"],
        responses: {
          200: { valid: true, user: { id: "user_123", role: "driver", permissions: ["rides:read"] }}
        }
      },
      {
        method: "POST",
        path: "/api/auth/mfa/enable",
        title: "Enable MFA",
        description: "Enable multi-factor authentication for user",
        tags: ["Authentication", "MFA"],
        responses: {
          200: { success: true, qr_code: "data:image/png;base64,..." }
        }
      },
      {
        method: "POST", 
        path: "/api/auth/mfa/verify",
        title: "Verify MFA",
        description: "Verify MFA token during authentication",
        tags: ["Authentication", "MFA"],
        requestBody: { token: "123456" },
        responses: {
          200: { success: true, message: "MFA verified" }
        }
      },
      {
        method: "POST",
        path: "/api/auth/mfa/challenge",
        title: "MFA Challenge",
        description: "Request MFA challenge for login",
        tags: ["Authentication", "MFA"],
        responses: {
          200: { challenge_required: true, methods: ["totp", "sms"] }
        }
      },
      {
        method: "GET",
        path: "/api/auth/profile",
        title: "Get Auth Profile",
        description: "Get authenticated user profile information",
        tags: ["Authentication", "Profile"],
        responses: {
          200: { 
            user: { 
              id: "user_123", 
              email: "user@example.com", 
              role: "driver",
              mfa_enabled: true,
              last_login: "2025-09-06T10:30:00Z"
            }
          }
        }
      },
      {
        method: "GET",
        path: "/api/auth/rbac",
        title: "Get RBAC Permissions",
        description: "Get role-based access control permissions for user",
        tags: ["Authentication", "RBAC"],
        responses: {
          200: {
            roles: ["driver"],
            permissions: ["rides:read", "profile:write", "earnings:read"]
          }
        }
      },
      {
        method: "GET",
        path: "/api/auth/client-ip",
        title: "Get Client IP",
        description: "Get client IP address for security logging",
        tags: ["Authentication", "Security"],
        responses: {
          200: { ip_address: "192.168.1.100", country: "Philippines" }
        }
      },
      {
        method: "POST",
        path: "/api/auth/enhanced/login",
        title: "Enhanced Login",
        description: "Advanced login with additional security checks",
        tags: ["Authentication", "Enhanced"],
        requestBody: {
          credentials: "encrypted_credentials",
          device_fingerprint: "device_hash"
        },
        responses: {
          200: { success: true, session_token: "enhanced_session_token" }
        }
      },
      {
        method: "GET",
        path: "/api/auth/enhanced/roles",
        title: "Enhanced Role Management",
        description: "Advanced role management for enhanced authentication",
        tags: ["Authentication", "Roles"],
        responses: {
          200: {
            roles: [
              { id: "role_1", name: "driver", permissions: ["rides:read"] },
              { id: "role_2", name: "admin", permissions: ["*"] }
            ]
          }
        }
      },
      {
        method: "POST",
        path: "/api/auth/enhanced/temporary-access",
        title: "Temporary Access",
        description: "Grant temporary access tokens for specific operations",
        tags: ["Authentication", "Temporary"],
        requestBody: { 
          operation: "emergency_ride",
          duration: 3600,
          reason: "Driver emergency access"
        },
        responses: {
          200: { 
            temporary_token: "temp_token_123",
            expires_at: "2025-09-06T11:30:00Z"
          }
        }
      },
      {
        method: "GET",
        path: "/api/auth/enhanced/users",
        title: "Enhanced User Management",
        description: "Advanced user management with enhanced security",
        tags: ["Authentication", "Users"],
        parameters: [
          { name: "role", type: "string", required: false, description: "Filter by user role" },
          { name: "status", type: "string", required: false, description: "Filter by account status" }
        ],
        responses: {
          200: {
            users: [
              { 
                id: "user_123",
                email: "driver@example.com",
                role: "driver",
                status: "active",
                last_login: "2025-09-06T10:30:00Z"
              }
            ]
          }
        }
      }
    ]
  },
  {
    name: "Driver Management",
    description: "Driver profiles, status tracking, performance metrics, and availability management",
    icon: "🚗",
    priority: 2,
    endpoints: [
      {
        method: "GET",
        path: "/api/drivers",
        title: "List Drivers",
        description: "Get paginated list of all drivers with filters",
        tags: ["Drivers", "List"],
        parameters: [
          { name: "status", type: "string", required: false, description: "Filter by driver status" },
          { name: "region", type: "string", required: false, description: "Filter by region" },
          { name: "vehicle_type", type: "string", required: false, description: "Filter by vehicle type" },
          { name: "limit", type: "number", required: false, description: "Results per page" },
          { name: "offset", type: "number", required: false, description: "Pagination offset" }
        ],
        responses: {
          200: {
            drivers: [
              {
                id: "driver_123",
                name: "Juan Santos",
                status: "online",
                vehicle: { type: "sedan", plate: "ABC-1234" },
                rating: 4.8,
                location: { lat: 14.5995, lng: 120.9842 }
              }
            ],
            total: 1250,
            page: 1
          }
        }
      },
      {
        method: "GET",
        path: "/api/drivers/[id]",
        title: "Get Driver Details",
        description: "Get detailed information for specific driver",
        tags: ["Drivers", "Details"],
        parameters: [
          { name: "id", type: "string", required: true, description: "Driver identifier" }
        ],
        responses: {
          200: {
            id: "driver_123",
            name: "Juan Santos",
            email: "juan.santos@example.com",
            phone: "+63917123456",
            status: "online",
            vehicle: {
              type: "sedan",
              make: "Toyota",
              model: "Vios",
              year: 2020,
              plate: "ABC-1234"
            },
            rating: 4.8,
            total_rides: 1250,
            earnings: { today: 2500, week: 15000, month: 65000 }
          }
        }
      },
      {
        method: "GET",
        path: "/api/drivers/[id]/performance",
        title: "Driver Performance",
        description: "Get performance metrics for specific driver",
        tags: ["Drivers", "Performance"],
        parameters: [
          { name: "id", type: "string", required: true, description: "Driver identifier" },
          { name: "period", type: "string", required: false, description: "Time period: day, week, month" }
        ],
        responses: {
          200: {
            driver_id: "driver_123",
            period: "week",
            metrics: {
              total_rides: 45,
              total_earnings: 15000,
              average_rating: 4.8,
              acceptance_rate: 0.92,
              cancellation_rate: 0.03,
              online_hours: 48
            }
          }
        }
      },
      {
        method: "PUT",
        path: "/api/drivers/[id]/status",
        title: "Update Driver Status",
        description: "Update driver availability status",
        tags: ["Drivers", "Status"],
        parameters: [
          { name: "id", type: "string", required: true, description: "Driver identifier" }
        ],
        requestBody: {
          status: "online",
          location: { lat: 14.5995, lng: 120.9842 }
        },
        responses: {
          200: {
            success: true,
            driver_id: "driver_123",
            new_status: "online",
            updated_at: "2025-09-06T10:30:00Z"
          }
        }
      },
      {
        method: "GET",
        path: "/api/drivers/available",
        title: "Available Drivers",
        description: "Get list of currently available drivers in area",
        tags: ["Drivers", "Available"],
        parameters: [
          { name: "lat", type: "number", required: true, description: "Latitude" },
          { name: "lng", type: "number", required: true, description: "Longitude" },
          { name: "radius", type: "number", required: false, description: "Search radius in meters" },
          { name: "vehicle_type", type: "string", required: false, description: "Filter by vehicle type" }
        ],
        responses: {
          200: {
            available_drivers: [
              {
                id: "driver_123",
                name: "Juan Santos",
                distance: 450,
                eta: 3,
                rating: 4.8,
                vehicle: { type: "sedan", plate: "ABC-1234" }
              }
            ]
          }
        }
      },
      {
        method: "GET",
        path: "/api/drivers/rbac",
        title: "Driver RBAC Permissions",
        description: "Get role-based access permissions for drivers",
        tags: ["Drivers", "RBAC"],
        responses: {
          200: {
            driver_permissions: [
              "rides:accept",
              "rides:complete",
              "earnings:view",
              "profile:update"
            ]
          }
        }
      }
    ]
  },
  {
    name: "Live Mapping & Navigation",
    description: "Real-time mapping, geocoding, route optimization, traffic data, and ETA calculations",
    icon: "🗺️",
    priority: 3,
    endpoints: [
      {
        method: "POST",
        path: "/api/mapping/geocode",
        title: "Geocode Address",
        description: "Convert address to coordinates",
        tags: ["Mapping", "Geocoding"],
        requestBody: {
          address: "SM Mall of Asia, Pasay City",
          region: "PH"
        },
        responses: {
          200: {
            results: [
              {
                formatted_address: "SM Mall of Asia, Seaside Blvd, Pasay, Metro Manila",
                geometry: { lat: 14.5367, lng: 120.9815 },
                place_id: "ChIJ..."
              }
            ]
          }
        }
      },
      {
        method: "POST",
        path: "/api/mapping/reverse-geocode",
        title: "Reverse Geocode",
        description: "Convert coordinates to address",
        tags: ["Mapping", "Geocoding"],
        requestBody: {
          lat: 14.5367,
          lng: 120.9815
        },
        responses: {
          200: {
            formatted_address: "SM Mall of Asia, Seaside Blvd, Pasay, Metro Manila",
            components: [
              { type: "establishment", value: "SM Mall of Asia" },
              { type: "locality", value: "Pasay" }
            ]
          }
        }
      },
      {
        method: "POST",
        path: "/api/mapping/route-optimization",
        title: "Route Optimization",
        description: "Calculate optimized route between multiple points",
        tags: ["Mapping", "Optimization"],
        requestBody: {
          origin: { lat: 14.5995, lng: 120.9842 },
          destination: { lat: 14.5367, lng: 120.9815 },
          waypoints: [{ lat: 14.5547, lng: 120.9909 }],
          optimize: true
        },
        responses: {
          200: {
            routes: [
              {
                distance: 15.2,
                duration: 18,
                polyline: "encoded_polyline_string",
                steps: ["Head north on Rizal Avenue", "Turn right onto EDSA"]
              }
            ]
          }
        }
      },
      {
        method: "POST",
        path: "/api/mapping/eta-calculation",
        title: "ETA Calculation",
        description: "Calculate estimated time of arrival",
        tags: ["Mapping", "ETA"],
        requestBody: {
          origin: { lat: 14.5995, lng: 120.9842 },
          destination: { lat: 14.5367, lng: 120.9815 },
          departure_time: "now"
        },
        responses: {
          200: {
            eta: 18,
            distance: 15.2,
            traffic_conditions: "moderate",
            updated_at: "2025-09-06T10:30:00Z"
          }
        }
      },
      {
        method: "GET",
        path: "/api/mapping/traffic-data",
        title: "Traffic Data",
        description: "Get real-time traffic information for area",
        tags: ["Mapping", "Traffic"],
        parameters: [
          { name: "bounds", type: "string", required: true, description: "JSON bounds for area" },
          { name: "zoom_level", type: "number", required: false, description: "Map zoom level" }
        ],
        responses: {
          200: {
            traffic_data: [
              {
                road: "EDSA",
                segment: "Cubao to Ortigas",
                condition: "heavy",
                speed: 15,
                incidents: ["accident at km 12"]
              }
            ]
          }
        }
      }
    ]
  },
  {
    name: "Real-time Driver Matching",
    description: "Intelligent driver-passenger matching, queue management, and ride assignment",
    icon: "🎯", 
    priority: 4,
    endpoints: [
      {
        method: "POST",
        path: "/api/matching/find-driver",
        title: "Find Driver",
        description: "Find and assign driver for ride request",
        tags: ["Matching", "Core"],
        requestBody: {
          pickup_location: { lat: 14.5995, lng: 120.9842 },
          destination: { lat: 14.5367, lng: 120.9815 },
          vehicle_type: "sedan",
          passenger_count: 2
        },
        responses: {
          200: {
            match_found: true,
            driver: {
              id: "driver_123",
              name: "Juan Santos",
              eta: 3,
              vehicle: { type: "sedan", plate: "ABC-1234" }
            },
            ride_id: "ride_456"
          }
        }
      },
      {
        method: "GET",
        path: "/api/matching/driver-availability",
        title: "Driver Availability",
        description: "Check driver availability in specific area",
        tags: ["Matching", "Availability"],
        parameters: [
          { name: "lat", type: "number", required: true, description: "Latitude" },
          { name: "lng", type: "number", required: true, description: "Longitude" },
          { name: "radius", type: "number", required: false, description: "Search radius" }
        ],
        responses: {
          200: {
            available_count: 12,
            average_eta: 4.5,
            surge_multiplier: 1.0
          }
        }
      },
      {
        method: "POST",
        path: "/api/matching/accept-ride",
        title: "Accept Ride",
        description: "Driver accepts assigned ride",
        tags: ["Matching", "Accept"],
        requestBody: {
          ride_id: "ride_456",
          driver_id: "driver_123"
        },
        responses: {
          200: {
            success: true,
            ride_id: "ride_456",
            status: "driver_assigned",
            pickup_eta: 3
          }
        }
      },
      {
        method: "POST",
        path: "/api/matching/reject-ride", 
        title: "Reject Ride",
        description: "Driver rejects assigned ride",
        tags: ["Matching", "Reject"],
        requestBody: {
          ride_id: "ride_456",
          driver_id: "driver_123",
          reason: "too_far"
        },
        responses: {
          200: {
            success: true,
            ride_id: "ride_456",
            status: "finding_driver"
          }
        }
      },
      {
        method: "GET",
        path: "/api/matching/queue-status",
        title: "Queue Status",
        description: "Get current matching queue status",
        tags: ["Matching", "Queue"],
        responses: {
          200: {
            pending_requests: 25,
            average_wait_time: 3.2,
            active_drivers: 145
          }
        }
      }
    ]
  },
  {
    name: "Payment Processing", 
    description: "Payment processing, refunds, driver earnings, and transaction management",
    icon: "💳",
    priority: 5,
    endpoints: [
      {
        method: "POST",
        path: "/api/payment/process",
        title: "Process Payment",
        description: "Process ride payment through various gateways",
        tags: ["Payment", "Process"],
        requestBody: {
          ride_id: "ride_123",
          amount: 150.00,
          currency: "PHP",
          payment_method: "gcash",
          customer_id: "cust_456"
        },
        responses: {
          200: {
            success: true,
            transaction_id: "txn_789",
            status: "completed",
            amount_charged: 150.00
          }
        }
      },
      {
        method: "POST",
        path: "/api/payment/refund",
        title: "Process Refund",
        description: "Process refund for cancelled or disputed rides",
        tags: ["Payment", "Refund"],
        requestBody: {
          transaction_id: "txn_789",
          amount: 150.00,
          reason: "ride_cancelled"
        },
        responses: {
          200: {
            success: true,
            refund_id: "ref_123",
            status: "processed",
            refund_amount: 150.00
          }
        }
      },
      {
        method: "GET",
        path: "/api/payment/transactions",
        title: "Get Transactions",
        description: "Retrieve payment transaction history",
        tags: ["Payment", "History"],
        parameters: [
          { name: "customer_id", type: "string", required: false, description: "Filter by customer" },
          { name: "status", type: "string", required: false, description: "Filter by status" },
          { name: "start_date", type: "string", required: false, description: "Start date filter" },
          { name: "limit", type: "number", required: false, description: "Results limit" }
        ],
        responses: {
          200: {
            transactions: [
              {
                id: "txn_789",
                ride_id: "ride_123",
                amount: 150.00,
                status: "completed",
                created_at: "2025-09-06T10:30:00Z"
              }
            ]
          }
        }
      },
      {
        method: "GET",
        path: "/api/payment/methods",
        title: "Payment Methods",
        description: "Get available payment methods for region",
        tags: ["Payment", "Methods"],
        parameters: [
          { name: "region", type: "string", required: false, description: "Region code" }
        ],
        responses: {
          200: {
            methods: [
              { id: "gcash", name: "GCash", type: "wallet", available: true },
              { id: "maya", name: "Maya", type: "wallet", available: true },
              { id: "cash", name: "Cash", type: "cash", available: true }
            ]
          }
        }
      },
      {
        method: "GET",
        path: "/api/payment/driver-earnings/[driverId]",
        title: "Driver Earnings",
        description: "Get driver earnings breakdown",
        tags: ["Payment", "Earnings"],
        parameters: [
          { name: "driverId", type: "string", required: true, description: "Driver identifier" },
          { name: "period", type: "string", required: false, description: "Time period" }
        ],
        responses: {
          200: {
            driver_id: "driver_123",
            period: "week",
            earnings: {
              gross: 15000,
              commission: 3000,
              net: 12000,
              rides_count: 45
            }
          }
        }
      },
      {
        method: "POST",
        path: "/api/payment/payout",
        title: "Driver Payout",
        description: "Process driver payout to bank account",
        tags: ["Payment", "Payout"],
        requestBody: {
          driver_id: "driver_123",
          amount: 12000,
          account_details: {
            bank: "BDO",
            account_number: "1234567890"
          }
        },
        responses: {
          200: {
            success: true,
            payout_id: "payout_456",
            status: "processing",
            estimated_arrival: "2025-09-07T10:30:00Z"
          }
        }
      },
      {
        method: "POST",
        path: "/api/payment/webhook",
        title: "Payment Webhook",
        description: "Handle payment gateway webhooks",
        tags: ["Payment", "Webhook"],
        requestBody: {
          event_type: "payment.completed",
          transaction_id: "txn_789",
          status: "completed"
        },
        responses: {
          200: { success: true, message: "Webhook processed" }
        }
      }
    ]
  },
  {
    name: "AI & ML Systems",
    description: "Machine learning models, AI integration, demand prediction, and intelligent optimization",
    icon: "🤖",
    priority: 6,
    endpoints: [
      {
        method: "GET",
        path: "/api/ai/status",
        title: "AI System Status",
        description: "Get status of AI/ML services and models",
        tags: ["AI", "Status"],
        responses: {
          200: {
            services: {
              demand_prediction: { status: "active", accuracy: 0.89 },
              surge_optimization: { status: "active", efficiency: 0.92 },
              route_prediction: { status: "active", response_time: "45ms" }
            },
            last_updated: "2025-09-06T10:30:00Z"
          }
        }
      },
      {
        method: "POST",
        path: "/api/ml/events/ingest",
        title: "ML Event Ingestion",
        description: "Ingest events for machine learning model training",
        tags: ["ML", "Data"],
        requestBody: {
          event_type: "ride_completed",
          data: {
            ride_id: "ride_123",
            duration: 18,
            distance: 12.5,
            surge_multiplier: 1.2
          },
          timestamp: "2025-09-06T10:30:00Z"
        },
        responses: {
          200: {
            success: true,
            event_id: "event_789",
            processed_at: "2025-09-06T10:30:05Z"
          }
        }
      },
      {
        method: "POST",
        path: "/api/ml/bridge/python",
        title: "Python ML Bridge",
        description: "Bridge to Python ML services for model inference",
        tags: ["ML", "Bridge"],
        requestBody: {
          model: "demand_prediction",
          input_data: {
            location: { lat: 14.5995, lng: 120.9842 },
            time: "2025-09-06T18:00:00Z",
            weather: "clear"
          }
        },
        responses: {
          200: {
            prediction: {
              demand_level: "high",
              confidence: 0.87,
              surge_recommendation: 1.4
            }
          }
        }
      }
    ]
  },
  {
    name: "Regional Operations",
    description: "Region management, localization, regulatory compliance, and geographic boundaries",
    icon: "🌏",
    priority: 7,
    endpoints: [
      {
        method: "GET",
        path: "/api/regions/[region_id]/analytics",
        title: "Regional Analytics",
        description: "Get analytics data for specific region",
        tags: ["Regions", "Analytics"],
        parameters: [
          { name: "region_id", type: "string", required: true, description: "Region identifier" },
          { name: "period", type: "string", required: false, description: "Time period" }
        ],
        responses: {
          200: {
            region_id: "metro_manila",
            metrics: {
              total_rides: 12500,
              active_drivers: 850,
              revenue: 1875000,
              average_rating: 4.7
            }
          }
        }
      },
      {
        method: "GET",
        path: "/api/v1/regions",
        title: "List Regions",
        description: "Get list of all operational regions",
        tags: ["Regions", "List"],
        responses: {
          200: {
            regions: [
              {
                id: "metro_manila",
                name: "Metro Manila",
                country: "Philippines",
                active: true,
                boundaries: {
                  northeast: { lat: 14.7648, lng: 121.1192 },
                  southwest: { lat: 14.4078, lng: 120.8193 }
                }
              }
            ]
          }
        }
      }
    ]
  },
  {
    name: "Safety & Fraud Detection",
    description: "Fraud detection algorithms, safety monitoring, and risk assessment systems",
    icon: "🛡️",
    priority: 8,
    endpoints: [
      {
        method: "POST",
        path: "/api/fraud/check",
        title: "Fraud Check",
        description: "Check transaction or user for potential fraud",
        tags: ["Fraud", "Security"],
        requestBody: {
          user_id: "user_123",
          transaction_data: {
            amount: 150.00,
            location: { lat: 14.5995, lng: 120.9842 },
            payment_method: "gcash"
          }
        },
        responses: {
          200: {
            risk_score: 0.15,
            risk_level: "low",
            flags: [],
            recommendation: "approve"
          }
        }
      },
      {
        method: "POST",
        path: "/api/fraud/training-data",
        title: "Fraud Training Data",
        description: "Submit data for fraud detection model training",
        tags: ["Fraud", "ML"],
        requestBody: {
          incident_type: "fake_booking",
          features: {
            user_age_days: 1,
            booking_frequency: 10,
            payment_method: "new_card"
          },
          label: "fraud"
        },
        responses: {
          200: {
            success: true,
            data_id: "training_456",
            status: "queued_for_training"
          }
        }
      }
    ]
  },
  {
    name: "Vehicle Management",
    description: "Vehicle registration, maintenance, compliance, telemetry, and fleet management",
    icon: "🚙",
    priority: 9,
    endpoints: [
      {
        method: "GET",
        path: "/api/vehicles",
        title: "List Vehicles",
        description: "Get paginated list of all vehicles",
        tags: ["Vehicles", "List"],
        parameters: [
          { name: "status", type: "string", required: false, description: "Filter by status" },
          { name: "type", type: "string", required: false, description: "Filter by vehicle type" }
        ],
        responses: {
          200: {
            vehicles: [
              {
                id: "vehicle_123",
                plate: "ABC-1234",
                make: "Toyota",
                model: "Vios",
                year: 2020,
                status: "active"
              }
            ]
          }
        }
      },
      {
        method: "GET",
        path: "/api/vehicles/[id]",
        title: "Get Vehicle Details",
        description: "Get detailed information for specific vehicle",
        tags: ["Vehicles", "Details"],
        parameters: [
          { name: "id", type: "string", required: true, description: "Vehicle identifier" }
        ],
        responses: {
          200: {
            id: "vehicle_123",
            plate: "ABC-1234",
            make: "Toyota",
            model: "Vios",
            year: 2020,
            status: "active",
            driver: {
              id: "driver_123",
              name: "Juan Santos"
            },
            maintenance: {
              last_service: "2025-08-15T00:00:00Z",
              next_service: "2025-11-15T00:00:00Z"
            }
          }
        }
      },
      {
        method: "GET",
        path: "/api/vehicles/[id]/maintenance",
        title: "Vehicle Maintenance",
        description: "Get maintenance history for vehicle",
        tags: ["Vehicles", "Maintenance"],
        parameters: [
          { name: "id", type: "string", required: true, description: "Vehicle identifier" }
        ],
        responses: {
          200: {
            vehicle_id: "vehicle_123",
            maintenance_records: [
              {
                id: "maint_456",
                type: "regular_service",
                date: "2025-08-15T00:00:00Z",
                cost: 5000,
                description: "Oil change, brake check"
              }
            ]
          }
        }
      },
      {
        method: "POST",
        path: "/api/vehicles/[id]/maintenance",
        title: "Add Maintenance Record",
        description: "Add new maintenance record for vehicle",
        tags: ["Vehicles", "Maintenance"],
        parameters: [
          { name: "id", type: "string", required: true, description: "Vehicle identifier" }
        ],
        requestBody: {
          type: "repair",
          description: "Engine repair",
          cost: 15000,
          service_date: "2025-09-06T00:00:00Z"
        },
        responses: {
          201: {
            success: true,
            maintenance_id: "maint_789",
            vehicle_id: "vehicle_123"
          }
        }
      },
      {
        method: "GET",
        path: "/api/vehicles/[id]/maintenance/[maintenanceId]",
        title: "Get Maintenance Record",
        description: "Get specific maintenance record details",
        tags: ["Vehicles", "Maintenance"],
        parameters: [
          { name: "id", type: "string", required: true, description: "Vehicle identifier" },
          { name: "maintenanceId", type: "string", required: true, description: "Maintenance record ID" }
        ],
        responses: {
          200: {
            id: "maint_789",
            vehicle_id: "vehicle_123",
            type: "repair",
            description: "Engine repair",
            cost: 15000,
            service_date: "2025-09-06T00:00:00Z"
          }
        }
      },
      {
        method: "GET",
        path: "/api/vehicles/[id]/compliance",
        title: "Vehicle Compliance",
        description: "Check vehicle regulatory compliance status",
        tags: ["Vehicles", "Compliance"],
        parameters: [
          { name: "id", type: "string", required: true, description: "Vehicle identifier" }
        ],
        responses: {
          200: {
            vehicle_id: "vehicle_123",
            compliance_status: "compliant",
            checks: {
              registration: { status: "valid", expires: "2026-03-15" },
              insurance: { status: "valid", expires: "2025-12-31" },
              inspection: { status: "valid", expires: "2025-10-30" }
            }
          }
        }
      },
      {
        method: "GET",
        path: "/api/vehicles/[id]/telemetry",
        title: "Vehicle Telemetry",
        description: "Get real-time telemetry data from vehicle",
        tags: ["Vehicles", "Telemetry"],
        parameters: [
          { name: "id", type: "string", required: true, description: "Vehicle identifier" }
        ],
        responses: {
          200: {
            vehicle_id: "vehicle_123",
            timestamp: "2025-09-06T10:30:00Z",
            location: { lat: 14.5995, lng: 120.9842 },
            speed: 45,
            fuel_level: 0.75,
            engine_status: "running"
          }
        }
      },
      {
        method: "GET",
        path: "/api/vehicles/[id]/assignments",
        title: "Vehicle Assignments",
        description: "Get driver assignment history for vehicle",
        tags: ["Vehicles", "Assignments"],
        parameters: [
          { name: "id", type: "string", required: true, description: "Vehicle identifier" }
        ],
        responses: {
          200: {
            vehicle_id: "vehicle_123",
            current_driver: {
              id: "driver_123",
              name: "Juan Santos",
              assigned_since: "2025-09-01T00:00:00Z"
            },
            assignment_history: [
              {
                driver_id: "driver_456",
                driver_name: "Maria Cruz",
                start_date: "2025-08-01T00:00:00Z",
                end_date: "2025-08-31T23:59:59Z"
              }
            ]
          }
        }
      },
      {
        method: "POST",
        path: "/api/vehicles/assignments/bulk",
        title: "Bulk Vehicle Assignments",
        description: "Assign multiple vehicles to drivers in bulk",
        tags: ["Vehicles", "Assignments", "Bulk"],
        requestBody: {
          assignments: [
            { vehicle_id: "vehicle_123", driver_id: "driver_123" },
            { vehicle_id: "vehicle_456", driver_id: "driver_456" }
          ]
        },
        responses: {
          200: {
            success: true,
            assignments_created: 2,
            failed_assignments: []
          }
        }
      },
      {
        method: "GET",
        path: "/api/vehicles/analytics",
        title: "Vehicle Analytics",
        description: "Get fleet analytics and performance metrics",
        tags: ["Vehicles", "Analytics"],
        parameters: [
          { name: "period", type: "string", required: false, description: "Time period" }
        ],
        responses: {
          200: {
            fleet_metrics: {
              total_vehicles: 1200,
              active_vehicles: 980,
              utilization_rate: 0.82,
              average_daily_revenue: 2500
            }
          }
        }
      }
    ]
  },
  {
    name: "Dynamic Pricing & Surge",
    description: "Surge pricing algorithms, zone management, fare calculations, and pricing optimization",
    icon: "📈",
    priority: 10,
    endpoints: [
      {
        method: "GET",
        path: "/api/surge/status",
        title: "Surge Status",
        description: "Get current surge pricing status for all zones",
        tags: ["Surge", "Status"],
        responses: {
          200: {
            surge_zones: [
              {
                zone_id: "makati_cbd",
                surge_multiplier: 1.4,
                status: "active",
                reason: "high_demand"
              }
            ],
            last_updated: "2025-09-06T10:30:00Z"
          }
        }
      },
      {
        method: "GET",
        path: "/api/surge/lookup",
        title: "Surge Lookup",
        description: "Get surge multiplier for specific location",
        tags: ["Surge", "Lookup"],
        parameters: [
          { name: "lat", type: "number", required: true, description: "Latitude" },
          { name: "lng", type: "number", required: true, description: "Longitude" }
        ],
        responses: {
          200: {
            location: { lat: 14.5995, lng: 120.9842 },
            zone_id: "makati_cbd", 
            surge_multiplier: 1.4,
            expires_at: "2025-09-06T11:00:00Z"
          }
        }
      },
      {
        method: "GET",
        path: "/api/surge/heatmap",
        title: "Surge Heatmap",
        description: "Get surge heatmap data for visualization",
        tags: ["Surge", "Heatmap"],
        parameters: [
          { name: "bounds", type: "string", required: true, description: "JSON bounds for area" }
        ],
        responses: {
          200: {
            heatmap_data: [
              {
                lat: 14.5995,
                lng: 120.9842,
                intensity: 0.8,
                surge_multiplier: 1.4
              }
            ]
          }
        }
      },
      {
        method: "GET",
        path: "/api/surge/profiles",
        title: "Surge Profiles",
        description: "Get configured surge pricing profiles",
        tags: ["Surge", "Profiles"],
        responses: {
          200: {
            profiles: [
              {
                id: "profile_1",
                name: "Business Hours",
                rules: [
                  { condition: "demand > 80%", multiplier: 1.2 },
                  { condition: "demand > 90%", multiplier: 1.5 }
                ]
              }
            ]
          }
        }
      },
      {
        method: "GET",
        path: "/api/surge/profiles/[id]",
        title: "Get Surge Profile",
        description: "Get specific surge pricing profile details",
        tags: ["Surge", "Profiles"],
        parameters: [
          { name: "id", type: "string", required: true, description: "Profile identifier" }
        ],
        responses: {
          200: {
            id: "profile_1",
            name: "Business Hours",
            active: true,
            rules: [
              { condition: "demand > 80%", multiplier: 1.2 },
              { condition: "demand > 90%", multiplier: 1.5 }
            ]
          }
        }
      },
      {
        method: "POST",
        path: "/api/surge/profiles/[id]/activate",
        title: "Activate Surge Profile",
        description: "Activate specific surge pricing profile",
        tags: ["Surge", "Profiles"],
        parameters: [
          { name: "id", type: "string", required: true, description: "Profile identifier" }
        ],
        responses: {
          200: {
            success: true,
            profile_id: "profile_1",
            status: "activated"
          }
        }
      },
      {
        method: "GET",
        path: "/api/surge/schedules",
        title: "Surge Schedules",
        description: "Get scheduled surge pricing events",
        tags: ["Surge", "Schedules"],
        responses: {
          200: {
            schedules: [
              {
                id: "schedule_1",
                name: "Rush Hour Morning",
                start_time: "07:00",
                end_time: "09:00",
                days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
                multiplier: 1.3
              }
            ]
          }
        }
      },
      {
        method: "POST",
        path: "/api/surge/schedules/[id]/activate",
        title: "Activate Surge Schedule", 
        description: "Activate scheduled surge pricing event",
        tags: ["Surge", "Schedules"],
        parameters: [
          { name: "id", type: "string", required: true, description: "Schedule identifier" }
        ],
        responses: {
          200: {
            success: true,
            schedule_id: "schedule_1",
            status: "activated"
          }
        }
      },
      {
        method: "GET",
        path: "/api/surge/signals",
        title: "Surge Signals",
        description: "Get real-time demand signals for surge calculations",
        tags: ["Surge", "Signals"],
        responses: {
          200: {
            signals: {
              total_requests: 150,
              available_drivers: 45,
              supply_demand_ratio: 0.3,
              prediction: {
                next_hour_demand: "high",
                recommended_multiplier: 1.4
              }
            }
          }
        }
      },
      {
        method: "GET",
        path: "/api/surge/hex-state",
        title: "Hexagon Surge State",
        description: "Get surge state data organized by hexagonal grid",
        tags: ["Surge", "Hexagon"],
        parameters: [
          { name: "resolution", type: "number", required: false, description: "H3 hexagon resolution" }
        ],
        responses: {
          200: {
            hexagons: [
              {
                hex_id: "871f1dd2fffffff",
                surge_multiplier: 1.4,
                demand_level: "high",
                driver_count: 12
              }
            ]
          }
        }
      },
      {
        method: "GET",
        path: "/api/surge/overrides",
        title: "Surge Overrides",
        description: "Get manual surge pricing overrides",
        tags: ["Surge", "Overrides"],
        responses: {
          200: {
            overrides: [
              {
                zone_id: "airport",
                multiplier: 2.0,
                reason: "special_event",
                expires_at: "2025-09-06T20:00:00Z"
              }
            ]
          }
        }
      },
      {
        method: "GET",
        path: "/api/surge/audit",
        title: "Surge Audit Log",
        description: "Get audit trail of surge pricing changes",
        tags: ["Surge", "Audit"],
        parameters: [
          { name: "start_date", type: "string", required: false, description: "Start date filter" },
          { name: "end_date", type: "string", required: false, description: "End date filter" }
        ],
        responses: {
          200: {
            audit_logs: [
              {
                timestamp: "2025-09-06T10:30:00Z",
                action: "surge_activated",
                zone_id: "makati_cbd",
                old_multiplier: 1.0,
                new_multiplier: 1.4,
                reason: "demand_threshold_exceeded"
              }
            ]
          }
        }
      },
      {
        method: "POST",
        path: "/api/surge/validate",
        title: "Validate Surge Config",
        description: "Validate surge pricing configuration before applying",
        tags: ["Surge", "Validation"],
        requestBody: {
          profile_id: "profile_1",
          test_scenarios: [
            { demand_level: 0.8, expected_multiplier: 1.2 },
            { demand_level: 0.95, expected_multiplier: 1.5 }
          ]
        },
        responses: {
          200: {
            validation_result: "passed",
            test_results: [
              { scenario: 1, result: "passed", actual_multiplier: 1.2 },
              { scenario: 2, result: "passed", actual_multiplier: 1.5 }
            ]
          }
        }
      }
    ]
  },
  {
    name: "RBAC & Permissions",
    description: "Role-based access control, user permissions, and authorization management",
    icon: "🔑",
    priority: 11,
    endpoints: [
      {
        method: "GET",
        path: "/api/rbac/roles",
        title: "List Roles",
        description: "Get all available roles in the system",
        tags: ["RBAC", "Roles"],
        responses: {
          200: {
            roles: [
              {
                id: "role_driver",
                name: "Driver",
                description: "Standard driver role",
                permissions: ["rides:read", "rides:accept", "profile:update"],
                active: true
              }
            ]
          }
        }
      },
      {
        method: "GET",
        path: "/api/rbac/roles/[id]",
        title: "Get Role Details",
        description: "Get detailed information for specific role",
        tags: ["RBAC", "Roles"],
        parameters: [
          { name: "id", type: "string", required: true, description: "Role identifier" }
        ],
        responses: {
          200: {
            id: "role_driver",
            name: "Driver",
            description: "Standard driver role",
            permissions: ["rides:read", "rides:accept", "profile:update"],
            users_count: 1250,
            created_at: "2025-01-01T00:00:00Z"
          }
        }
      },
      {
        method: "POST",
        path: "/api/rbac/roles/[id]/approve",
        title: "Approve Role Change",
        description: "Approve pending role change request",
        tags: ["RBAC", "Approval"],
        parameters: [
          { name: "id", type: "string", required: true, description: "Role change request ID" }
        ],
        requestBody: {
          approver_id: "admin_123",
          notes: "Approved for promotion"
        },
        responses: {
          200: {
            success: true,
            role_change_id: "change_456",
            status: "approved"
          }
        }
      },
      {
        method: "POST",
        path: "/api/rbac/roles/[id]/rollback",
        title: "Rollback Role Changes",
        description: "Rollback recent role changes",
        tags: ["RBAC", "Rollback"],
        parameters: [
          { name: "id", type: "string", required: true, description: "Role identifier" }
        ],
        requestBody: {
          rollback_to_version: 5,
          reason: "Security concern"
        },
        responses: {
          200: {
            success: true,
            rollback_id: "rollback_789",
            restored_version: 5
          }
        }
      },
      {
        method: "GET",
        path: "/api/rbac/roles/[id]/users",
        title: "Users in Role",
        description: "Get users assigned to specific role",
        tags: ["RBAC", "Users"],
        parameters: [
          { name: "id", type: "string", required: true, description: "Role identifier" }
        ],
        responses: {
          200: {
            role_id: "role_driver",
            users: [
              {
                id: "user_123",
                name: "Juan Santos",
                email: "juan@example.com",
                assigned_date: "2025-01-15T00:00:00Z"
              }
            ],
            total: 1250
          }
        }
      },
      {
        method: "GET",
        path: "/api/rbac/roles/[id]/versions",
        title: "Role Version History",
        description: "Get version history for role changes",
        tags: ["RBAC", "Versions"],
        parameters: [
          { name: "id", type: "string", required: true, description: "Role identifier" }
        ],
        responses: {
          200: {
            role_id: "role_driver",
            versions: [
              {
                version: 6,
                changes: ["Added rides:cancel permission"],
                changed_by: "admin_456",
                changed_at: "2025-09-01T00:00:00Z"
              }
            ]
          }
        }
      },
      {
        method: "POST",
        path: "/api/rbac/roles/import",
        title: "Import Roles",
        description: "Import roles from external source",
        tags: ["RBAC", "Import"],
        requestBody: {
          source: "ldap",
          roles_data: [
            {
              name: "Manager",
              permissions: ["*"]
            }
          ]
        },
        responses: {
          200: {
            success: true,
            imported_roles: 1,
            failed_imports: []
          }
        }
      },
      {
        method: "GET",
        path: "/api/rbac/roles/pending",
        title: "Pending Role Changes",
        description: "Get pending role change requests",
        tags: ["RBAC", "Pending"],
        responses: {
          200: {
            pending_requests: [
              {
                id: "request_123",
                user_id: "user_456",
                requested_role: "admin",
                current_role: "driver",
                requested_by: "user_456",
                requested_at: "2025-09-06T10:00:00Z"
              }
            ]
          }
        }
      },
      {
        method: "GET",
        path: "/api/rbac/roles/public",
        title: "Public Roles",
        description: "Get publicly available roles for self-registration",
        tags: ["RBAC", "Public"],
        responses: {
          200: {
            public_roles: [
              {
                id: "role_customer",
                name: "Customer",
                description: "Standard customer role",
                auto_assign: true
              }
            ]
          }
        }
      },
      {
        method: "GET",
        path: "/api/rbac/users",
        title: "RBAC Users",
        description: "Get users with their role assignments",
        tags: ["RBAC", "Users"],
        parameters: [
          { name: "role", type: "string", required: false, description: "Filter by role" },
          { name: "status", type: "string", required: false, description: "Filter by status" }
        ],
        responses: {
          200: {
            users: [
              {
                id: "user_123",
                name: "Juan Santos",
                email: "juan@example.com",
                roles: ["driver"],
                status: "active",
                last_login: "2025-09-06T10:30:00Z"
              }
            ]
          }
        }
      }
    ]
  },
  {
    name: "Analytics & Business Intelligence",
    description: "Advanced analytics, reporting, demand forecasting, and business intelligence",
    icon: "📊",
    priority: 12,
    endpoints: [
      {
        method: "GET",
        path: "/api/analytics",
        title: "Analytics Overview",
        description: "Get high-level analytics overview",
        tags: ["Analytics", "Overview"],
        responses: {
          200: {
            overview: {
              total_rides_today: 1250,
              active_drivers: 320,
              total_revenue_today: 187500,
              average_rating: 4.7,
              peak_hours: ["07:00-09:00", "17:00-19:00"]
            }
          }
        }
      },
      {
        method: "GET",
        path: "/api/analytics/dashboard",
        title: "Analytics Dashboard",
        description: "Get comprehensive dashboard analytics data",
        tags: ["Analytics", "Dashboard"],
        parameters: [
          { name: "period", type: "string", required: false, description: "Time period: hour, day, week, month" }
        ],
        responses: {
          200: {
            dashboard: {
              rides: {
                total: 1250,
                completed: 1180,
                cancelled: 70,
                completion_rate: 0.944
              },
              revenue: {
                gross: 187500,
                net: 150000,
                commission: 37500
              },
              drivers: {
                active: 320,
                online: 145,
                utilization_rate: 0.78
              }
            }
          }
        }
      },
      {
        method: "GET",
        path: "/api/analytics/demand-forecasting",
        title: "Demand Forecasting",
        description: "Get demand forecasting analytics",
        tags: ["Analytics", "Forecasting"],
        parameters: [
          { name: "location", type: "string", required: false, description: "Location filter" },
          { name: "hours_ahead", type: "number", required: false, description: "Hours to forecast" }
        ],
        responses: {
          200: {
            forecast: {
              location: "metro_manila",
              predictions: [
                {
                  hour: "18:00",
                  predicted_demand: "high",
                  confidence: 0.89,
                  recommended_surge: 1.4
                }
              ],
              accuracy: 0.87
            }
          }
        }
      },
      {
        method: "GET",
        path: "/api/analytics/driver-performance",
        title: "Driver Performance Analytics",
        description: "Get comprehensive driver performance analytics",
        tags: ["Analytics", "Performance"],
        parameters: [
          { name: "driver_id", type: "string", required: false, description: "Specific driver filter" },
          { name: "period", type: "string", required: false, description: "Time period" },
          { name: "limit", type: "number", required: false, description: "Top N performers" }
        ],
        responses: {
          200: {
            performance: {
              top_performers: [
                {
                  driver_id: "driver_123",
                  name: "Juan Santos",
                  metrics: {
                    total_rides: 45,
                    rating: 4.9,
                    earnings: 15000,
                    efficiency_score: 0.92
                  }
                }
              ],
              averages: {
                rides_per_driver: 28,
                average_rating: 4.7,
                earnings_per_driver: 12500
              }
            }
          }
        }
      },
      {
        method: "POST",
        path: "/api/analytics/reports/generate",
        title: "Generate Custom Report",
        description: "Generate custom analytics report",
        tags: ["Analytics", "Reports"],
        requestBody: {
          report_type: "driver_performance",
          filters: {
            start_date: "2025-09-01",
            end_date: "2025-09-06",
            region: "metro_manila"
          },
          format: "pdf"
        },
        responses: {
          200: {
            report_id: "report_789",
            status: "generating",
            estimated_completion: "2025-09-06T10:35:00Z",
            download_url: null
          }
        }
      },
      {
        method: "GET",
        path: "/api/analytics/revenue",
        title: "Revenue Analytics",
        description: "Get detailed revenue analytics and breakdowns",
        tags: ["Analytics", "Revenue"],
        parameters: [
          { name: "period", type: "string", required: false, description: "Time period" },
          { name: "breakdown", type: "string", required: false, description: "Breakdown type: region, driver, vehicle_type" }
        ],
        responses: {
          200: {
            revenue: {
              total: 187500,
              breakdown: {
                by_region: [
                  { region: "metro_manila", revenue: 150000, percentage: 0.8 },
                  { region: "cebu", revenue: 37500, percentage: 0.2 }
                ]
              },
              trends: {
                daily_average: 26786,
                growth_rate: 0.12
              }
            }
          }
        }
      }
    ]
  },
  {
    name: "Ride Management & Bookings",
    description: "Ride lifecycle management, booking system, and trip coordination",
    icon: "🚘",
    priority: 13,
    endpoints: [
      {
        method: "GET",
        path: "/api/rides",
        title: "List Rides",
        description: "Get paginated list of rides with filters",
        tags: ["Rides", "List"],
        parameters: [
          { name: "status", type: "string", required: false, description: "Filter by ride status" },
          { name: "driver_id", type: "string", required: false, description: "Filter by driver" },
          { name: "customer_id", type: "string", required: false, description: "Filter by customer" },
          { name: "start_date", type: "string", required: false, description: "Start date filter" }
        ],
        responses: {
          200: {
            rides: [
              {
                id: "ride_123",
                customer: { id: "cust_456", name: "Maria Cruz" },
                driver: { id: "driver_789", name: "Juan Santos" },
                status: "completed",
                pickup: { lat: 14.5995, lng: 120.9842, address: "Makati CBD" },
                destination: { lat: 14.5367, lng: 120.9815, address: "SM MOA" },
                fare: 150.00,
                created_at: "2025-09-06T10:00:00Z"
              }
            ],
            total: 1250
          }
        }
      },
      {
        method: "GET",
        path: "/api/rides/[id]",
        title: "Get Ride Details",
        description: "Get detailed information for specific ride",
        tags: ["Rides", "Details"],
        parameters: [
          { name: "id", type: "string", required: true, description: "Ride identifier" }
        ],
        responses: {
          200: {
            id: "ride_123",
            customer: { id: "cust_456", name: "Maria Cruz", phone: "+639171234567" },
            driver: { id: "driver_789", name: "Juan Santos", vehicle: "ABC-1234" },
            status: "completed",
            pickup: {
              lat: 14.5995,
              lng: 120.9842,
              address: "Greenbelt Mall, Makati",
              scheduled_time: "2025-09-06T10:00:00Z",
              actual_time: "2025-09-06T10:02:00Z"
            },
            destination: {
              lat: 14.5367,
              lng: 120.9815,
              address: "SM Mall of Asia, Pasay"
            },
            route: {
              distance: 12.5,
              duration: 18,
              polyline: "encoded_polyline_data"
            },
            fare: {
              base: 100.00,
              surge_multiplier: 1.2,
              total: 150.00,
              currency: "PHP"
            },
            timestamps: {
              requested: "2025-09-06T10:00:00Z",
              accepted: "2025-09-06T10:01:00Z",
              picked_up: "2025-09-06T10:05:00Z",
              completed: "2025-09-06T10:23:00Z"
            }
          }
        }
      },
      {
        method: "POST",
        path: "/api/rides/[id]/assign",
        title: "Assign Driver to Ride",
        description: "Manually assign driver to ride request",
        tags: ["Rides", "Assignment"],
        parameters: [
          { name: "id", type: "string", required: true, description: "Ride identifier" }
        ],
        requestBody: {
          driver_id: "driver_789",
          override_automatic: true,
          reason: "Customer preference"
        },
        responses: {
          200: {
            success: true,
            ride_id: "ride_123",
            driver_id: "driver_789",
            estimated_pickup: "2025-09-06T10:05:00Z"
          }
        }
      },
      {
        method: "PUT",
        path: "/api/rides/[id]/status",
        title: "Update Ride Status",
        description: "Update the status of a ride",
        tags: ["Rides", "Status"],
        parameters: [
          { name: "id", type: "string", required: true, description: "Ride identifier" }
        ],
        requestBody: {
          status: "picked_up",
          location: { lat: 14.5995, lng: 120.9842 },
          timestamp: "2025-09-06T10:05:00Z"
        },
        responses: {
          200: {
            success: true,
            ride_id: "ride_123",
            new_status: "picked_up",
            updated_at: "2025-09-06T10:05:00Z"
          }
        }
      },
      {
        method: "GET",
        path: "/api/rides/[id]/tracking",
        title: "Real-time Ride Tracking",
        description: "Get real-time tracking data for ongoing ride",
        tags: ["Rides", "Tracking"],
        parameters: [
          { name: "id", type: "string", required: true, description: "Ride identifier" }
        ],
        responses: {
          200: {
            ride_id: "ride_123",
            status: "en_route",
            driver_location: { lat: 14.5789, lng: 120.9756 },
            eta: 3,
            route_progress: 0.65,
            distance_remaining: 4.2
          }
        }
      },
      {
        method: "GET",
        path: "/api/rides/active",
        title: "Active Rides",
        description: "Get all currently active rides",
        tags: ["Rides", "Active"],
        parameters: [
          { name: "region", type: "string", required: false, description: "Filter by region" }
        ],
        responses: {
          200: {
            active_rides: [
              {
                id: "ride_123",
                status: "en_route",
                driver: "Juan Santos",
                customer: "Maria Cruz",
                eta: 3,
                progress: 0.65
              }
            ],
            total_active: 45
          }
        }
      },
      {
        method: "POST",
        path: "/api/bookings",
        title: "Create Booking",
        description: "Create a new ride booking",
        tags: ["Bookings", "Create"],
        requestBody: {
          customer_id: "cust_456",
          pickup: {
            lat: 14.5995,
            lng: 120.9842,
            address: "Greenbelt Mall, Makati"
          },
          destination: {
            lat: 14.5367,
            lng: 120.9815,
            address: "SM Mall of Asia, Pasay"
          },
          vehicle_type: "sedan",
          scheduled_time: "now",
          payment_method: "gcash"
        },
        responses: {
          201: {
            success: true,
            booking_id: "booking_789",
            ride_id: "ride_123",
            estimated_fare: 150.00,
            estimated_pickup_time: "2025-09-06T10:05:00Z"
          }
        }
      },
      {
        method: "GET",
        path: "/api/bookings/[id]",
        title: "Get Booking Details",
        description: "Get details for specific booking",
        tags: ["Bookings", "Details"],
        parameters: [
          { name: "id", type: "string", required: true, description: "Booking identifier" }
        ],
        responses: {
          200: {
            id: "booking_789",
            customer: { id: "cust_456", name: "Maria Cruz" },
            pickup: { lat: 14.5995, lng: 120.9842, address: "Greenbelt Mall" },
            destination: { lat: 14.5367, lng: 120.9815, address: "SM MOA" },
            status: "confirmed",
            ride_id: "ride_123",
            estimated_fare: 150.00,
            scheduled_time: "2025-09-06T10:00:00Z"
          }
        }
      }
    ]
  }
];

// Helper functions for endpoint management
export const getEndpointsByCategory = (categoryName: string): APIEndpoint[] => {
  const category = allApiEndpoints.find(cat => cat.name === categoryName);
  return category ? category.endpoints : [];
};

export const getEndpointByPath = (path: string): APIEndpoint | undefined => {
  for (const category of allApiEndpoints) {
    const endpoint = category.endpoints.find(ep => ep.path === path);
    if (endpoint) return endpoint;
  }
  return undefined;
};

export const getAllEndpoints = (): APIEndpoint[] => {
  return allApiEndpoints.flatMap(category => category.endpoints);
};

export const getEndpointStats = () => {
  const totalEndpoints = getAllEndpoints().length;
  const totalCategories = allApiEndpoints.length;
  const methodCounts = getAllEndpoints().reduce((acc, endpoint) => {
    acc[endpoint.method] = (acc[endpoint.method] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalEndpoints,
    totalCategories,
    methodCounts
  };
};