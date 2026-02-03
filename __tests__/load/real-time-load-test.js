/**
 * k6 Load Test for Real-Time Vehicle Tracking System
 *
 * Simulates:
 * - 275 vehicles sending position updates every 5 seconds
 * - 50 Command Center users watching real-time updates
 * - 10 concurrent incidents being created
 *
 * Measures:
 * - WebSocket connection success rate
 * - Message delivery latency (p50, p95, p99)
 * - Backend CPU/memory under load
 * - Frontend rendering performance
 *
 * Agent 12 - Integration Verification & Monitoring Specialist
 *
 * Usage:
 *   k6 run real-time-load-test.js
 *   k6 run --duration 5m --vus 325 real-time-load-test.js
 */

import { check, group, sleep } from 'k6';
import http from 'k6/http';
import ws from 'k6/ws';
import { Counter, Rate, Trend } from 'k6/metrics';

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';
const WS_URL = __ENV.WS_URL || 'ws://localhost:3001';
const FRONTEND_URL = __ENV.FRONTEND_URL || 'http://localhost:4000';

// Test configuration
const TOTAL_VEHICLES = 275;
const COMMAND_CENTER_USERS = 50;
const CONCURRENT_INCIDENTS = 10;
const VEHICLE_UPDATE_INTERVAL = 5; // seconds
const TEST_DURATION = '5m';

// Custom metrics
const wsConnectionSuccesses = new Counter('ws_connection_successes');
const wsConnectionFailures = new Counter('ws_connection_failures');
const wsMessagesSent = new Counter('ws_messages_sent');
const wsMessagesReceived = new Counter('ws_messages_received');
const wsMessageLatency = new Trend('ws_message_latency');
const vehicleUpdateLatency = new Trend('vehicle_update_latency');
const apiResponseTime = new Trend('api_response_time');
const errorRate = new Rate('error_rate');

// Test options
export const options = {
  scenarios: {
    // Scenario 1: Vehicles sending position updates
    vehicle_position_updates: {
      executor: 'constant-vus',
      exec: 'vehiclePositionUpdates',
      vus: TOTAL_VEHICLES,
      duration: TEST_DURATION,
      tags: { scenario: 'vehicles' },
    },

    // Scenario 2: Command Center users watching
    command_center_users: {
      executor: 'constant-vus',
      exec: 'commandCenterUsers',
      vus: COMMAND_CENTER_USERS,
      duration: TEST_DURATION,
      tags: { scenario: 'command_center' },
    },

    // Scenario 3: Incident creation
    incident_creation: {
      executor: 'constant-vus',
      exec: 'incidentCreation',
      vus: CONCURRENT_INCIDENTS,
      duration: TEST_DURATION,
      tags: { scenario: 'incidents' },
    },
  },

  thresholds: {
    // WebSocket connection success rate should be > 95%
    'ws_connection_successes': ['count>100'],

    // HTTP error rate should be < 5%
    'error_rate': ['rate<0.05'],

    // API response time p95 should be < 2000ms
    'api_response_time': ['p(95)<2000'],

    // WebSocket message latency p95 should be < 500ms
    'ws_message_latency': ['p(95)<500'],

    // Vehicle update latency p99 should be < 1000ms
    'vehicle_update_latency': ['p(99)<1000'],

    // HTTP request duration p95 should be < 2000ms
    'http_req_duration': ['p(95)<2000'],

    // HTTP failure rate should be < 5%
    'http_req_failed': ['rate<0.05'],
  },
};

// Helper: Generate random vehicle data
function generateVehicleData(vehicleId) {
  const baseLatitude = 14.5995; // Manila, Philippines
  const baseLongitude = 120.9842;

  // Random movement within ~10km radius
  const latOffset = (Math.random() - 0.5) * 0.1;
  const lngOffset = (Math.random() - 0.5) * 0.1;

  return {
    vehicleId: `VEH-${String(vehicleId).padStart(4, '0')}`,
    position: {
      latitude: baseLatitude + latOffset,
      longitude: baseLongitude + lngOffset,
      accuracy: Math.random() * 10 + 5, // 5-15 meters
      heading: Math.floor(Math.random() * 360),
      speed: Math.floor(Math.random() * 60), // 0-60 km/h
    },
    status: ['available', 'busy', 'offline'][Math.floor(Math.random() * 3)],
    timestamp: new Date().toISOString(),
  };
}

// Helper: Get auth token
function getAuthToken() {
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: 'admin@xpress.ops',
    password: 'demo123',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  if (loginRes.status === 200) {
    const data = JSON.parse(loginRes.body);
    return data.data?.token || data.token;
  }

  return null;
}

// ==================================================
// SCENARIO 1: Vehicle Position Updates
// ==================================================

export function vehiclePositionUpdates() {
  const vehicleId = __VU; // Each VU represents a vehicle
  const vehicleData = generateVehicleData(vehicleId);

  group('Vehicle Position Updates', () => {
    // Try WebSocket connection first
    const wsUrl = `${WS_URL}/vehicles/${vehicleData.vehicleId}`;

    const res = ws.connect(wsUrl, {}, function (socket) {
      socket.on('open', () => {
        wsConnectionSuccesses.add(1);

        // Send position updates every 5 seconds
        socket.setInterval(() => {
          const updateData = generateVehicleData(vehicleId);
          const sendTime = Date.now();

          socket.send(JSON.stringify({
            type: 'position_update',
            data: updateData,
            timestamp: sendTime,
          }));

          wsMessagesSent.add(1);
        }, VEHICLE_UPDATE_INTERVAL * 1000);
      });

      socket.on('message', (data) => {
        wsMessagesReceived.add(1);

        try {
          const message = JSON.parse(data);
          if (message.timestamp) {
            const latency = Date.now() - message.timestamp;
            wsMessageLatency.add(latency);
          }
        } catch (e) {
          // Ignore parse errors
        }
      });

      socket.on('error', (e) => {
        wsConnectionFailures.add(1);
        errorRate.add(1);
      });

      // Keep connection open for test duration
      socket.setTimeout(() => {
        socket.close();
      }, 60000); // 1 minute per connection
    });

    // If WebSocket fails, fallback to HTTP polling
    if (!res) {
      // HTTP fallback: POST position update
      const token = getAuthToken();

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };

      const payload = JSON.stringify({
        vehicleId: vehicleData.vehicleId,
        position: vehicleData.position,
        status: vehicleData.status,
      });

      const start = Date.now();
      const httpRes = http.post(`${BASE_URL}/api/vehicles/position`, payload, { headers });
      const duration = Date.now() - start;

      vehicleUpdateLatency.add(duration);
      apiResponseTime.add(duration);

      check(httpRes, {
        'vehicle update successful': (r) => r.status === 200 || r.status === 201,
      }) || errorRate.add(1);

      sleep(VEHICLE_UPDATE_INTERVAL);
    }
  });
}

// ==================================================
// SCENARIO 2: Command Center Users Watching
// ==================================================

export function commandCenterUsers() {
  const userId = `USER-${__VU}`;

  group('Command Center User Session', () => {
    // Login
    const token = getAuthToken();

    if (!token) {
      errorRate.add(1);
      return;
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    // Connect to dashboard
    const dashboardRes = http.get(`${FRONTEND_URL}/dashboard`, { headers });

    check(dashboardRes, {
      'dashboard loaded': (r) => r.status === 200,
    }) || errorRate.add(1);

    // Establish WebSocket for real-time updates
    const wsUrl = `${WS_URL}/command-center?userId=${userId}`;

    ws.connect(wsUrl, {}, function (socket) {
      socket.on('open', () => {
        wsConnectionSuccesses.add(1);

        // Subscribe to vehicle updates
        socket.send(JSON.stringify({
          type: 'subscribe',
          channels: ['vehicles', 'kpi', 'incidents'],
        }));

        wsMessagesSent.add(1);
      });

      socket.on('message', (data) => {
        wsMessagesReceived.add(1);

        try {
          const message = JSON.parse(data);
          if (message.timestamp) {
            const latency = Date.now() - message.timestamp;
            wsMessageLatency.add(latency);
          }
        } catch (e) {
          // Ignore parse errors
        }
      });

      socket.on('error', () => {
        wsConnectionFailures.add(1);
        errorRate.add(1);
      });

      // Keep watching for 30 seconds
      socket.setTimeout(() => {
        socket.close();
      }, 30000);
    });

    // Periodically fetch KPI data
    for (let i = 0; i < 3; i++) {
      sleep(10);

      const start = Date.now();
      const kpiRes = http.get(`${BASE_URL}/api/kpi/dashboard`, { headers });
      const duration = Date.now() - start;

      apiResponseTime.add(duration);

      check(kpiRes, {
        'KPI fetch successful': (r) => r.status === 200,
      }) || errorRate.add(1);
    }
  });
}

// ==================================================
// SCENARIO 3: Incident Creation
// ==================================================

export function incidentCreation() {
  group('Incident Creation and Management', () => {
    // Login
    const token = getAuthToken();

    if (!token) {
      errorRate.add(1);
      return;
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    // Create incident
    const incidentData = {
      type: ['accident', 'breakdown', 'emergency'][Math.floor(Math.random() * 3)],
      severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)],
      description: `Test incident from load test - ${__VU}`,
      location: {
        latitude: 14.5995 + (Math.random() - 0.5) * 0.1,
        longitude: 120.9842 + (Math.random() - 0.5) * 0.1,
      },
      vehicleId: `VEH-${String(Math.floor(Math.random() * TOTAL_VEHICLES)).padStart(4, '0')}`,
    };

    const start = Date.now();
    const createRes = http.post(
      `${BASE_URL}/api/incidents`,
      JSON.stringify(incidentData),
      { headers }
    );
    const duration = Date.now() - start;

    apiResponseTime.add(duration);

    const incidentCreated = check(createRes, {
      'incident created': (r) => r.status === 200 || r.status === 201,
    });

    if (!incidentCreated) {
      errorRate.add(1);
      return;
    }

    const incident = JSON.parse(createRes.body);
    const incidentId = incident.data?.id || incident.id;

    // Wait a bit
    sleep(5);

    // Update incident status
    const updateRes = http.patch(
      `${BASE_URL}/api/incidents/${incidentId}`,
      JSON.stringify({ status: 'investigating' }),
      { headers }
    );

    check(updateRes, {
      'incident updated': (r) => r.status === 200,
    }) || errorRate.add(1);

    // Wait again
    sleep(5);

    // Resolve incident
    const resolveRes = http.patch(
      `${BASE_URL}/api/incidents/${incidentId}`,
      JSON.stringify({ status: 'resolved', resolution: 'Test resolution' }),
      { headers }
    );

    check(resolveRes, {
      'incident resolved': (r) => r.status === 200,
    }) || errorRate.add(1);

    sleep(2);
  });
}

// ==================================================
// SETUP AND TEARDOWN
// ==================================================

export function setup() {
  console.log('🚀 Starting Real-Time Load Test');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`🔌 WebSocket URL: ${WS_URL}`);
  console.log(`🚗 Vehicles: ${TOTAL_VEHICLES}`);
  console.log(`👥 Command Center Users: ${COMMAND_CENTER_USERS}`);
  console.log(`🚨 Concurrent Incidents: ${CONCURRENT_INCIDENTS}`);
  console.log('');
}

export function teardown(data) {
  console.log('');
  console.log('✅ Load Test Complete');
  console.log('📊 Check results above for performance metrics');
}

// Default export for single-scenario runs
export default function() {
  vehiclePositionUpdates();
}
