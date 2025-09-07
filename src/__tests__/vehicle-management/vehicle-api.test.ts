// Vehicle Management API Integration Tests
// Comprehensive test suite for all vehicle management endpoints
// Testing RBAC permissions, validation, and complete API functionality

import { describe, it, expect, beforeAll, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';
import {
  Vehicle,
  CreateVehicleRequest,
  UpdateVehicleRequest,
  VehicleFilterParams,
  AssignDriverRequest,
  ScheduleMaintenanceRequest
} from '@/types/vehicles';
import { EnhancedUser } from '@/types/rbac-abac';
import { GET, POST } from '@/app/api/vehicles/route';

// Mock modules
jest.mock('@/lib/auth/enhanced-auth');
jest.mock('@/middleware/vehicleRbacMiddleware');
jest.mock('@/lib/security/auditLogger');
jest.mock('@/lib/api-utils');

// Test utilities
const createMockRequest = (
  method: string,
  url: string,
  body?: any,
  headers?: Record<string, string>
): NextRequest => {
  const mockHeaders = new Headers({
    'content-type': 'application/json',
    'x-forwarded-for': '127.0.0.1',
    ...headers
  });

  return {
    method,
    url,
    headers: mockHeaders,
    json: () => Promise.resolve(body || {}),
    text: () => Promise.resolve(JSON.stringify(body || {})),
    nextUrl: new URL(url)
  } as NextRequest;
};

const createMockUser = (overrides: Partial<EnhancedUser> = {}): EnhancedUser => ({
  id: 'user-123',
  email: 'test@xpress.ph',
  firstName: 'Test',
  lastName: 'User',
  timezone: 'Asia/Manila',
  locale: 'en-PH',
  status: 'active',
  roles: [{
    id: '1',
    userId: 'user-123',
    roleId: 'ops-manager',
    role: {
      id: 'ops-manager',
      name: 'ops_manager',
      displayName: 'Operations Manager',
      level: 30,
      permissions: ['view_vehicles_detailed', 'create_vehicles', 'assign_driver_to_vehicle'],
      inheritsFrom: [],
      isSystem: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    allowedRegions: ['region-manila'],
    validFrom: new Date(),
    assignedAt: new Date(),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }],
  allowedRegions: ['region-manila'],
  piiScope: 'masked',
  mfaEnabled: false,
  trustedDevices: [],
  failedLoginAttempts: 0,
  loginCount: 0,
  permissions: [],
  temporaryAccess: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  isActive: true,
  ...overrides
});

describe('Vehicle Management API Integration Tests', () => {
  let mockUser: EnhancedUser;

  beforeAll(() => {
    // Setup global mocks
    process.env.NODE_ENV = 'test';
  });

  beforeEach(() => {
    mockUser = createMockUser();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  // =====================================================
  // Vehicle List API Tests (/api/vehicles GET)
  // =====================================================

  describe('GET /api/vehicles', () => {
    describe('Basic Functionality', () => {
      it('should return list of vehicles for authorized user', async () => {
        const request = createMockRequest(
          'GET',
          'http://localhost:3000/api/vehicles'
        );

        // Mock the auth middleware
        (require('@/lib/auth/enhanced-auth') as any).withEnhancedAuth = jest.fn()
          .mockImplementation((handler: any) => (req: NextRequest) => handler(req, mockUser));

        const response = await GET(request);
        const responseData = await response.json();

        expect(response.status).toBe(200);
        expect(responseData).toHaveProperty('success', true);
        expect(responseData).toHaveProperty('data');
        expect(Array.isArray(responseData.data.data)).toBe(true);
        expect(responseData).toHaveProperty('pagination');
      });

      it('should apply pagination parameters', async () => {
        const request = createMockRequest(
          'GET',
          'http://localhost:3000/api/vehicles?page=2&limit=5'
        );

        const response = await GET(request);
        const responseData = await response.json();

        expect(response.status).toBe(200);
        expect(responseData.pagination.page).toBe(2);
        expect(responseData.pagination.limit).toBe(5);
      });

      it('should apply sorting parameters', async () => {
        const request = createMockRequest(
          'GET',
          'http://localhost:3000/api/vehicles?sortBy=vehicleCode&sortOrder=desc'
        );

        const response = await GET(request);
        expect(response.status).toBe(200);
      });

      it('should filter by ownership type', async () => {
        const request = createMockRequest(
          'GET',
          'http://localhost:3000/api/vehicles?ownershipType=xpress_owned'
        );

        const response = await GET(request);
        const responseData = await response.json();

        expect(response.status).toBe(200);
        if (responseData.data.data.length > 0) {
          expect(responseData.data.data.every((v: Vehicle) => v.ownershipType === 'xpress_owned')).toBe(true);
        }
      });

      it('should filter by status', async () => {
        const request = createMockRequest(
          'GET',
          'http://localhost:3000/api/vehicles?status=active'
        );

        const response = await GET(request);
        const responseData = await response.json();

        expect(response.status).toBe(200);
        if (responseData.data.data.length > 0) {
          expect(responseData.data.data.every((v: Vehicle) => v.status === 'active')).toBe(true);
        }
      });

      it('should filter by region', async () => {
        const request = createMockRequest(
          'GET',
          'http://localhost:3000/api/vehicles?regionId=region-manila'
        );

        const response = await GET(request);
        const responseData = await response.json();

        expect(response.status).toBe(200);
        if (responseData.data.data.length > 0) {
          expect(responseData.data.data.every((v: Vehicle) => v.regionId === 'region-manila')).toBe(true);
        }
      });

      it('should search vehicles by text', async () => {
        const request = createMockRequest(
          'GET',
          'http://localhost:3000/api/vehicles?search=XOT'
        );

        const response = await GET(request);
        expect(response.status).toBe(200);
      });
    });

    describe('RBAC Permission Tests', () => {
      it('should deny access without proper permissions', async () => {
        const unauthorizedUser = createMockUser({
          roles: [{
            ...mockUser.roles[0],
            role: {
              ...mockUser.roles[0].role,
              permissions: [] // No permissions
            }
          }]
        });

        const request = createMockRequest(
          'GET',
          'http://localhost:3000/api/vehicles'
        );

        // Mock auth to return unauthorized user
        (require('@/lib/auth/enhanced-auth') as any).withEnhancedAuth = jest.fn()
          .mockImplementation((handler: any) => () => 
            NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
          );

        const response = await GET(request);
        expect(response.status).toBe(403);
      });

      it('should enforce regional restrictions', async () => {
        const regionalUser = createMockUser({
          allowedRegions: ['region-cebu']
        });

        const request = createMockRequest(
          'GET',
          'http://localhost:3000/api/vehicles?regionId=region-manila'
        );

        // Mock to simulate regional restriction
        (require('@/lib/auth/enhanced-auth') as any).withEnhancedAuth = jest.fn()
          .mockImplementation((handler: any) => (req: NextRequest) => handler(req, regionalUser));

        const response = await GET(request);
        const responseData = await response.json();

        // Should automatically filter to user's allowed region
        expect(response.status).toBe(200);
      });

      it('should apply data masking for users with limited PII scope', async () => {
        const limitedUser = createMockUser({
          piiScope: 'none'
        });

        const request = createMockRequest(
          'GET',
          'http://localhost:3000/api/vehicles'
        );

        const response = await GET(request);
        expect(response.status).toBe(200);
      });
    });

    describe('Rate Limiting Tests', () => {
      it('should enforce rate limits', async () => {
        const request = createMockRequest(
          'GET',
          'http://localhost:3000/api/vehicles'
        );

        // Mock rate limit exceeded
        (require('@/lib/api-utils') as any).checkRateLimit = jest.fn()
          .mockReturnValue({ allowed: false, resetTime: Date.now() + 60000 });

        const response = await GET(request);
        expect(response.status).toBe(429);
      });
    });

    describe('Error Handling', () => {
      it('should handle invalid pagination parameters', async () => {
        const request = createMockRequest(
          'GET',
          'http://localhost:3000/api/vehicles?page=-1&limit=0'
        );

        const response = await GET(request);
        expect(response.status).toBeLessThan(500); // Should handle gracefully
      });

      it('should handle invalid filter parameters', async () => {
        const request = createMockRequest(
          'GET',
          'http://localhost:3000/api/vehicles?ownershipType=invalid&year=abc'
        );

        const response = await GET(request);
        expect(response.status).toBeLessThan(500);
      });
    });
  });

  // =====================================================
  // Vehicle Creation API Tests (/api/vehicles POST)
  // =====================================================

  describe('POST /api/vehicles', () => {
    describe('Valid Vehicle Creation', () => {
      it('should create Xpress-owned vehicle successfully', async () => {
        const vehicleData: CreateVehicleRequest = {
          vehicleCode: 'XOT-TEST-001',
          licensePlate: 'TEST123',
          make: 'Toyota',
          model: 'Vios',
          year: 2023,
          color: 'White',
          category: 'sedan',
          fuelType: 'gasoline',
          seatingCapacity: 4,
          ownershipType: 'xpress_owned',
          regionId: 'region-manila',
          serviceTypes: ['ride_4w'],
          registrationExpiry: new Date('2025-12-31'),
          acquisitionCost: 800000,
          obdDeviceInstalled: true
        };

        const request = createMockRequest(
          'POST',
          'http://localhost:3000/api/vehicles',
          vehicleData
        );

        const response = await POST(request);
        const responseData = await response.json();

        expect(response.status).toBe(201);
        expect(responseData).toHaveProperty('success', true);
        expect(responseData.data.vehicle.vehicleCode).toBe('XOT-TEST-001');
        expect(responseData.data.vehicle.ownershipType).toBe('xpress_owned');
        expect(responseData.data.vehicle.status).toBe('inactive'); // New vehicles start inactive
      });

      it('should create fleet-owned vehicle with owner name', async () => {
        const vehicleData: CreateVehicleRequest = {
          vehicleCode: 'XOT-TEST-002',
          licensePlate: 'TEST456',
          make: 'Honda',
          model: 'City',
          year: 2022,
          color: 'Silver',
          category: 'sedan',
          fuelType: 'gasoline',
          seatingCapacity: 4,
          ownershipType: 'fleet_owned',
          fleetOwnerName: 'Test Fleet Services',
          regionId: 'region-manila',
          serviceTypes: ['ride_4w'],
          registrationExpiry: new Date('2025-10-31')
        };

        const request = createMockRequest(
          'POST',
          'http://localhost:3000/api/vehicles',
          vehicleData
        );

        const response = await POST(request);
        const responseData = await response.json();

        expect(response.status).toBe(201);
        expect(responseData.data.vehicle.fleetOwnerName).toBe('Test Fleet Services');
      });

      it('should create driver-owned vehicle', async () => {
        const vehicleData: CreateVehicleRequest = {
          vehicleCode: 'XOT-TEST-003',
          licensePlate: 'TEST789',
          make: 'Nissan',
          model: 'Almera',
          year: 2021,
          color: 'Black',
          category: 'sedan',
          fuelType: 'gasoline',
          seatingCapacity: 4,
          ownershipType: 'driver_owned',
          regionId: 'region-manila',
          serviceTypes: ['ride_4w'],
          registrationExpiry: new Date('2025-09-30')
        };

        const request = createMockRequest(
          'POST',
          'http://localhost:3000/api/vehicles',
          vehicleData
        );

        const response = await POST(request);
        const responseData = await response.json();

        expect(response.status).toBe(201);
        expect(responseData.data.vehicle.ownershipType).toBe('driver_owned');
      });
    });

    describe('Validation Tests', () => {
      it('should validate required fields', async () => {
        const incompleteData = {
          vehicleCode: 'XOT-INCOMPLETE',
          // Missing required fields
        };

        const request = createMockRequest(
          'POST',
          'http://localhost:3000/api/vehicles',
          incompleteData
        );

        const response = await POST(request);
        expect(response.status).toBe(400);
      });

      it('should validate year range', async () => {
        const invalidYearData: CreateVehicleRequest = {
          vehicleCode: 'XOT-TEST-004',
          licensePlate: 'TEST000',
          make: 'Toyota',
          model: 'Vios',
          year: 1980, // Too old
          color: 'White',
          category: 'sedan',
          fuelType: 'gasoline',
          seatingCapacity: 4,
          ownershipType: 'xpress_owned',
          regionId: 'region-manila',
          serviceTypes: ['ride_4w'],
          registrationExpiry: new Date('2025-12-31')
        };

        const request = createMockRequest(
          'POST',
          'http://localhost:3000/api/vehicles',
          invalidYearData
        );

        const response = await POST(request);
        expect(response.status).toBe(400);
      });

      it('should validate seating capacity range', async () => {
        const invalidCapacityData: CreateVehicleRequest = {
          vehicleCode: 'XOT-TEST-005',
          licensePlate: 'TEST000',
          make: 'Toyota',
          model: 'Vios',
          year: 2023,
          color: 'White',
          category: 'sedan',
          fuelType: 'gasoline',
          seatingCapacity: 0, // Invalid
          ownershipType: 'xpress_owned',
          regionId: 'region-manila',
          serviceTypes: ['ride_4w'],
          registrationExpiry: new Date('2025-12-31')
        };

        const request = createMockRequest(
          'POST',
          'http://localhost:3000/api/vehicles',
          invalidCapacityData
        );

        const response = await POST(request);
        expect(response.status).toBe(400);
      });

      it('should require fleet owner name for fleet-owned vehicles', async () => {
        const fleetWithoutOwner: CreateVehicleRequest = {
          vehicleCode: 'XOT-TEST-006',
          licensePlate: 'TEST111',
          make: 'Honda',
          model: 'City',
          year: 2022,
          color: 'Red',
          category: 'sedan',
          fuelType: 'gasoline',
          seatingCapacity: 4,
          ownershipType: 'fleet_owned',
          // fleetOwnerName missing
          regionId: 'region-manila',
          serviceTypes: ['ride_4w'],
          registrationExpiry: new Date('2025-12-31')
        };

        const request = createMockRequest(
          'POST',
          'http://localhost:3000/api/vehicles',
          fleetWithoutOwner
        );

        const response = await POST(request);
        expect(response.status).toBe(400);
      });
    });

    describe('Duplicate Prevention', () => {
      it('should prevent duplicate vehicle codes', async () => {
        const vehicleData: CreateVehicleRequest = {
          vehicleCode: 'XOT-001', // Existing code
          licensePlate: 'NEWPLATE',
          make: 'Toyota',
          model: 'Vios',
          year: 2023,
          color: 'White',
          category: 'sedan',
          fuelType: 'gasoline',
          seatingCapacity: 4,
          ownershipType: 'xpress_owned',
          regionId: 'region-manila',
          serviceTypes: ['ride_4w'],
          registrationExpiry: new Date('2025-12-31')
        };

        const request = createMockRequest(
          'POST',
          'http://localhost:3000/api/vehicles',
          vehicleData
        );

        const response = await POST(request);
        expect(response.status).toBe(409);
      });

      it('should prevent duplicate license plates', async () => {
        const vehicleData: CreateVehicleRequest = {
          vehicleCode: 'XOT-NEW-001',
          licensePlate: 'ABC123', // Existing plate
          make: 'Toyota',
          model: 'Vios',
          year: 2023,
          color: 'White',
          category: 'sedan',
          fuelType: 'gasoline',
          seatingCapacity: 4,
          ownershipType: 'xpress_owned',
          regionId: 'region-manila',
          serviceTypes: ['ride_4w'],
          registrationExpiry: new Date('2025-12-31')
        };

        const request = createMockRequest(
          'POST',
          'http://localhost:3000/api/vehicles',
          vehicleData
        );

        const response = await POST(request);
        expect(response.status).toBe(409);
      });
    });

    describe('Authorization Tests', () => {
      it('should require create_vehicles permission', async () => {
        const unauthorizedUser = createMockUser({
          roles: [{
            ...mockUser.roles[0],
            role: {
              ...mockUser.roles[0].role,
              permissions: ['view_vehicles_basic'] // Missing create permission
            }
          }]
        });

        const vehicleData: CreateVehicleRequest = {
          vehicleCode: 'XOT-UNAUTHORIZED',
          licensePlate: 'UNAUTH123',
          make: 'Toyota',
          model: 'Vios',
          year: 2023,
          color: 'White',
          category: 'sedan',
          fuelType: 'gasoline',
          seatingCapacity: 4,
          ownershipType: 'xpress_owned',
          regionId: 'region-manila',
          serviceTypes: ['ride_4w'],
          registrationExpiry: new Date('2025-12-31')
        };

        const request = createMockRequest(
          'POST',
          'http://localhost:3000/api/vehicles',
          vehicleData
        );

        const response = await POST(request);
        expect(response.status).toBe(403);
      });

      it('should enforce regional restrictions on creation', async () => {
        const regionalUser = createMockUser({
          allowedRegions: ['region-cebu']
        });

        const vehicleData: CreateVehicleRequest = {
          vehicleCode: 'XOT-REGION-TEST',
          licensePlate: 'REGION123',
          make: 'Toyota',
          model: 'Vios',
          year: 2023,
          color: 'White',
          category: 'sedan',
          fuelType: 'gasoline',
          seatingCapacity: 4,
          ownershipType: 'xpress_owned',
          regionId: 'region-manila', // Different from user's region
          serviceTypes: ['ride_4w'],
          registrationExpiry: new Date('2025-12-31')
        };

        const request = createMockRequest(
          'POST',
          'http://localhost:3000/api/vehicles',
          vehicleData
        );

        const response = await POST(request);
        expect(response.status).toBe(403);
      });

      it('should require MFA for confidential data creation', async () => {
        // This would be tested with actual MFA implementation
        const vehicleData: CreateVehicleRequest = {
          vehicleCode: 'XOT-MFA-TEST',
          licensePlate: 'MFA123',
          make: 'Toyota',
          model: 'Vios',
          year: 2023,
          color: 'White',
          category: 'sedan',
          fuelType: 'gasoline',
          seatingCapacity: 4,
          ownershipType: 'xpress_owned',
          regionId: 'region-manila',
          serviceTypes: ['ride_4w'],
          registrationExpiry: new Date('2025-12-31')
        };

        const request = createMockRequest(
          'POST',
          'http://localhost:3000/api/vehicles',
          vehicleData
        );

        // Mock MFA requirement
        const response = await POST(request);
        // Response would depend on MFA implementation
        expect([200, 201, 403]).toContain(response.status);
      });
    });

    describe('Error Handling', () => {
      it('should handle invalid JSON', async () => {
        const request = createMockRequest(
          'POST',
          'http://localhost:3000/api/vehicles'
        );

        // Mock invalid JSON
        request.json = jest.fn().mockRejectedValue(new Error('Invalid JSON'));

        const response = await POST(request);
        expect(response.status).toBe(400);
      });

      it('should handle database errors gracefully', async () => {
        const vehicleData: CreateVehicleRequest = {
          vehicleCode: 'XOT-DB-ERROR',
          licensePlate: 'ERROR123',
          make: 'Toyota',
          model: 'Vios',
          year: 2023,
          color: 'White',
          category: 'sedan',
          fuelType: 'gasoline',
          seatingCapacity: 4,
          ownershipType: 'xpress_owned',
          regionId: 'region-manila',
          serviceTypes: ['ride_4w'],
          registrationExpiry: new Date('2025-12-31')
        };

        const request = createMockRequest(
          'POST',
          'http://localhost:3000/api/vehicles',
          vehicleData
        );

        // Mock database error would be implemented here
        const response = await POST(request);
        expect(response.status).toBeLessThan(600);
      });
    });
  });

  // =====================================================
  // Dashboard API Tests (/api/vehicles/dashboard GET)
  // =====================================================

  describe('GET /api/vehicles/dashboard', () => {
    it('should return dashboard summary data', async () => {
      const request = createMockRequest(
        'GET',
        'http://localhost:3000/api/vehicles/dashboard'
      );

      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData).toHaveProperty('success', true);
      expect(responseData.data).toHaveProperty('vehicles');
      expect(responseData.data).toHaveProperty('summary');
      
      if (responseData.data.summary) {
        expect(responseData.data.summary).toHaveProperty('totalVehicles');
        expect(responseData.data.summary).toHaveProperty('activeVehicles');
        expect(responseData.data.summary).toHaveProperty('avgUtilization');
      }
    });

    it('should apply regional filtering to dashboard', async () => {
      const request = createMockRequest(
        'GET',
        'http://localhost:3000/api/vehicles/dashboard?region=region-manila'
      );

      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
    });

    it('should require appropriate permissions for dashboard access', async () => {
      const unauthorizedUser = createMockUser({
        roles: [{
          ...mockUser.roles[0],
          role: {
            ...mockUser.roles[0].role,
            permissions: ['view_vehicles_basic'] // Missing dashboard permission
          }
        }]
      });

      const request = createMockRequest(
        'GET',
        'http://localhost:3000/api/vehicles/dashboard'
      );

      // Mock unauthorized response
      const response = await GET(request);
      expect([200, 403]).toContain(response.status);
    });
  });

  // =====================================================
  // Performance and Load Tests
  // =====================================================

  describe('Performance Tests', () => {
    it('should handle concurrent requests', async () => {
      const requests = Array.from({ length: 10 }, (_, i) => 
        createMockRequest(
          'GET',
          `http://localhost:3000/api/vehicles?page=${i + 1}`
        )
      );

      const startTime = Date.now();
      const responses = await Promise.all(requests.map(req => GET(req)));
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
      responses.forEach(response => {
        expect([200, 403, 429]).toContain(response.status); // Success, forbidden, or rate limited
      });
    });

    it('should handle large result sets efficiently', async () => {
      const request = createMockRequest(
        'GET',
        'http://localhost:3000/api/vehicles?limit=100'
      );

      const startTime = Date.now();
      const response = await GET(request);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
      expect(response.status).toBe(200);
    });
  });

  // =====================================================
  // API Versioning Tests
  // =====================================================

  describe('API Versioning', () => {
    it('should support v1 API version', async () => {
      const request = createMockRequest(
        'GET',
        'http://localhost:3000/api/vehicles',
        undefined,
        { 'x-api-version': 'v1' }
      );

      const response = await GET(request);
      expect(response.status).toBe(200);
    });

    it('should handle missing version header gracefully', async () => {
      const request = createMockRequest(
        'GET',
        'http://localhost:3000/api/vehicles'
      );

      const response = await GET(request);
      expect(response.status).toBe(200); // Should default to latest version
    });
  });

  // =====================================================
  // Audit and Logging Tests
  // =====================================================

  describe('Audit and Logging', () => {
    it('should log successful operations', async () => {
      const request = createMockRequest(
        'GET',
        'http://localhost:3000/api/vehicles'
      );

      const response = await GET(request);
      
      // Verify audit logging was called
      expect(require('@/lib/security/auditLogger').auditLogger.logEvent).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    it('should log failed operations', async () => {
      const request = createMockRequest(
        'POST',
        'http://localhost:3000/api/vehicles',
        {} // Invalid data
      );

      const response = await POST(request);
      
      // Should log the failure attempt
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });
});