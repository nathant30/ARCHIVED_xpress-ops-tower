/**
 * Environment Setup for Vehicle Management Tests
 * Sets up environment variables and test configuration
 */

// Database configuration
process.env.DATABASE_URL = process.env.DATABASE_URL || 'sqlite::memory:';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6380';

// Authentication
process.env.JWT_ACCESS_SECRET = 'test-vehicle-management-secret-key-12345';
process.env.JWT_REFRESH_SECRET = 'test-vehicle-refresh-secret-key-67890';

// API Keys and external services
process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'mock-google-maps-api-key';
process.env.LTFRB_API_KEY = 'mock-ltfrb-api-key';
process.env.LTO_API_KEY = 'mock-lto-api-key';

// Test configuration
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';
process.env.TEST_TIMEOUT = '30000';

// Vehicle management specific configuration
process.env.OBD_SIMULATION_MODE = 'true';
process.env.WEBSOCKET_TEST_MODE = 'true';
process.env.TELEMETRY_MOCK_MODE = 'true';

// Philippines specific settings
process.env.PHILIPPINES_REGION = 'NCR';
process.env.LTFRB_API_MODE = 'mock';
process.env.LTO_API_MODE = 'mock';
process.env.INSURANCE_API_MODE = 'mock';

// Performance test settings
process.env.PERFORMANCE_TEST_MODE = process.env.PERFORMANCE_TEST_MODE || 'false';
process.env.FLEET_SIZE = process.env.FLEET_SIZE || '1000';
process.env.MAX_CONCURRENT_TESTS = '5';

// Security test settings
process.env.SECURITY_TEST_MODE = process.env.SECURITY_TEST_MODE || 'false';
process.env.RBAC_STRICT_MODE = 'true';
process.env.AUDIT_LOGGING_ENABLED = 'true';

// Disable certain features in test mode
process.env.DISABLE_RATE_LIMITING = 'true';
process.env.DISABLE_EMAIL_NOTIFICATIONS = 'true';
process.env.DISABLE_SMS_NOTIFICATIONS = 'true';
process.env.DISABLE_EXTERNAL_API_CALLS = 'true';

// Time zone for consistent test results
process.env.TZ = 'Asia/Manila';

export {};