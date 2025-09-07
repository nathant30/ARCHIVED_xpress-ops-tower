/**
 * Global Test Setup for Vehicle Management Tests
 * Configures Jest environment and global mocks
 */

import '@testing-library/jest-dom';
import 'jest-extended';

// Global test environment setup
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test-secret-vehicle-management';
process.env.LOG_LEVEL = 'error';

// Mock fetch globally
global.fetch = jest.fn();

// Mock WebSocket
class MockWebSocket {
  constructor(public url: string) {}
  send = jest.fn();
  close = jest.fn();
  addEventListener = jest.fn();
  removeEventListener = jest.fn();
}
global.WebSocket = MockWebSocket as any;

// Mock Google Maps API
global.google = {
  maps: {
    Map: jest.fn(),
    Marker: jest.fn(),
    InfoWindow: jest.fn(),
    LatLng: jest.fn(),
    LatLngBounds: jest.fn(),
    event: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
      clearListeners: jest.fn(),
    },
    geometry: {
      spherical: {
        computeDistanceBetween: jest.fn().mockReturnValue(1000),
        interpolate: jest.fn(),
      },
    },
  },
} as any;

// Mock console methods for cleaner test output
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Global test cleanup
afterEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
  
  // Reset fetch mock
  if (global.fetch) {
    (global.fetch as jest.Mock).mockReset();
  }
});

// Global error handling for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Extend Jest matchers for vehicle management specific assertions
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidVehicle(): R;
      toHaveValidLTFRBNumber(): R;
      toHaveValidPlateNumber(): R;
      toBeValidOwnershipModel(): R;
    }
  }
}

expect.extend({
  toBeValidVehicle(received) {
    const requiredFields = ['id', 'plateNumber', 'make', 'model', 'year', 'ownershipModel'];
    const hasAllFields = requiredFields.every(field => received.hasOwnProperty(field));
    
    if (hasAllFields) {
      return {
        message: () => `expected ${JSON.stringify(received)} not to be a valid vehicle`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${JSON.stringify(received)} to be a valid vehicle with fields: ${requiredFields.join(', ')}`,
        pass: false,
      };
    }
  },
  
  toHaveValidLTFRBNumber(received) {
    // LTFRB format: YYYY-RRRRR-NNNNN (Year-Region-Number)
    const ltfrbPattern = /^\d{4}-\d{5}-\d{5}$/;
    const isValid = ltfrbPattern.test(received);
    
    if (isValid) {
      return {
        message: () => `expected ${received} not to be a valid LTFRB number`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid LTFRB number (format: YYYY-RRRRR-NNNNN)`,
        pass: false,
      };
    }
  },
  
  toHaveValidPlateNumber(received) {
    // Philippines plate number formats
    const platePatterns = [
      /^[A-Z]{3}-\d{4}$/, // ABC-1234
      /^[A-Z]{2}-\d{5}$/, // AB-12345
      /^\d{3}-[A-Z]{3}$/, // 123-ABC
    ];
    const isValid = platePatterns.some(pattern => pattern.test(received));
    
    if (isValid) {
      return {
        message: () => `expected ${received} not to be a valid Philippines plate number`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid Philippines plate number`,
        pass: false,
      };
    }
  },
  
  toBeValidOwnershipModel(received) {
    const validModels = ['xpress_owned', 'fleet_owned', 'operator_owned', 'driver_owned'];
    const isValid = validModels.includes(received);
    
    if (isValid) {
      return {
        message: () => `expected ${received} not to be a valid ownership model`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be one of: ${validModels.join(', ')}`,
        pass: false,
      };
    }
  },
});

export {};