// =====================================================
// JEST CONFIGURATION FOR OPERATORS MANAGEMENT TESTING
// Specialized Jest configuration for operators management test suite
// =====================================================

const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
});

// Operators-specific Jest configuration
const operatorsJestConfig = {
  // Test environment setup
  testEnvironment: 'node',
  setupFilesAfterEnv: [
    '<rootDir>/jest.operators.setup.js'
  ],
  
  // Module name mapping
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@/styles/(.*)$': '<rootDir>/src/styles/$1',
  },
  
  // Test path patterns
  testMatch: [
    '<rootDir>/__tests__/operators/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/__tests__/operators/**/*.spec.{js,jsx,ts,tsx}',
  ],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/build/',
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/app/api/operators/**/*.{js,ts,tsx}',
    'src/lib/services/OperatorService.{js,ts}',
    'src/lib/services/PerformanceService.{js,ts}',
    'src/lib/services/FinancialService.{js,ts}',
    'src/lib/services/AnalyticsService.{js,ts}',
    'src/types/operators.{js,ts}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
  ],
  
  // Coverage thresholds specific to operators management
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    // Specific thresholds for critical components
    'src/lib/services/OperatorService.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    'src/lib/services/PerformanceService.ts': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    'src/lib/services/FinancialService.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    'src/app/api/operators/**/*.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  
  // Coverage reporters
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json',
    'json-summary'
  ],
  
  // Coverage directory
  coverageDirectory: '<rootDir>/coverage/operators',
  
  // Test timeout
  testTimeout: 30000, // 30 seconds for integration tests
  
  // Global setup and teardown
  globalSetup: '<rootDir>/__tests__/operators/helpers/globalSetup.js',
  globalTeardown: '<rootDir>/__tests__/operators/helpers/globalTeardown.js',
  
  // Test projects for different test types
  projects: [
    // Unit Tests
    {
      displayName: 'Unit Tests',
      testMatch: [
        '<rootDir>/__tests__/operators/unit/**/*.test.{js,ts,tsx}'
      ],
      testEnvironment: 'node',
      setupFilesAfterEnv: [
        '<rootDir>/__tests__/operators/helpers/unitTestSetup.js'
      ],
      testTimeout: 10000,
    },
    
    // Integration Tests
    {
      displayName: 'Integration Tests',
      testMatch: [
        '<rootDir>/__tests__/operators/integration/**/*.test.{js,ts,tsx}'
      ],
      testEnvironment: 'node',
      setupFilesAfterEnv: [
        '<rootDir>/__tests__/operators/helpers/integrationTestSetup.js'
      ],
      testTimeout: 60000, // 1 minute for integration tests
    },
    
    // E2E Tests
    {
      displayName: 'E2E Tests',
      testMatch: [
        '<rootDir>/__tests__/operators/e2e/**/*.test.{js,ts,tsx}'
      ],
      testEnvironment: 'node',
      setupFilesAfterEnv: [
        '<rootDir>/__tests__/operators/helpers/e2eTestSetup.js'
      ],
      testTimeout: 120000, // 2 minutes for E2E tests
    },
    
    // Performance Tests
    {
      displayName: 'Performance Tests',
      testMatch: [
        '<rootDir>/__tests__/operators/performance/**/*.test.{js,ts,tsx}'
      ],
      testEnvironment: 'node',
      setupFilesAfterEnv: [
        '<rootDir>/__tests__/operators/helpers/performanceTestSetup.js'
      ],
      testTimeout: 600000, // 10 minutes for performance tests
    },
    
    // Security Tests
    {
      displayName: 'Security Tests',
      testMatch: [
        '<rootDir>/__tests__/operators/security/**/*.test.{js,ts,tsx}'
      ],
      testEnvironment: 'node',
      setupFilesAfterEnv: [
        '<rootDir>/__tests__/operators/helpers/securityTestSetup.js'
      ],
      testTimeout: 120000, // 2 minutes for security tests
    },
    
    // Compliance Tests
    {
      displayName: 'Compliance Tests',
      testMatch: [
        '<rootDir>/__tests__/operators/compliance/**/*.test.{js,ts,tsx}'
      ],
      testEnvironment: 'node',
      setupFilesAfterEnv: [
        '<rootDir>/__tests__/operators/helpers/complianceTestSetup.js'
      ],
      testTimeout: 300000, // 5 minutes for compliance tests
    },
  ],
  
  // Transform configuration
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  
  // Module file extensions
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json'
  ],
  
  // Verbose output for debugging
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Error handling
  bail: false, // Continue running tests even if some fail
  
  // Max worker configuration for CI/CD
  maxWorkers: process.env.CI ? 2 : '50%',
  
  // Cache directory
  cacheDirectory: '<rootDir>/.jest-cache/operators',
  
  // Watch plugins for development
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
  
  // Reporter configuration
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: '<rootDir>/test-results/operators',
        filename: 'operators-test-report.html',
        expand: true,
        hideIcon: false,
      }
    ],
    [
      'jest-junit',
      {
        outputDirectory: '<rootDir>/test-results/operators',
        outputName: 'operators-junit.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: true,
      }
    ],
  ],
  
  // Error handling
  errorOnDeprecated: true,
  
  // Detect open handles (useful for debugging)
  detectOpenHandles: process.env.NODE_ENV === 'test',
  
  // Force exit after tests complete
  forceExit: process.env.CI === 'true',
  
  // Notification configuration
  notify: process.env.NODE_ENV !== 'ci',
  notifyMode: 'failure-change',
  
  // Snapshot configuration
  updateSnapshot: process.env.UPDATE_SNAPSHOTS === 'true',
  
  // Test result processor
  testResultsProcessor: '<rootDir>/__tests__/operators/helpers/testResultsProcessor.js',
  
  // Globals
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
    // Test environment variables
    TEST_DATABASE_URL: process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/test_operators',
    TEST_REDIS_URL: process.env.TEST_REDIS_URL || 'redis://localhost:6379/1',
    TEST_API_BASE_URL: process.env.TEST_API_BASE_URL || 'http://localhost:4000',
  },
};

// Custom test scripts mapping
const testScripts = {
  // Unit tests
  'test:operators:unit': 'jest --config=jest.operators.config.js --selectProjects="Unit Tests"',
  'test:operators:unit:watch': 'jest --config=jest.operators.config.js --selectProjects="Unit Tests" --watch',
  'test:operators:unit:coverage': 'jest --config=jest.operators.config.js --selectProjects="Unit Tests" --coverage',
  
  // Integration tests
  'test:operators:integration': 'jest --config=jest.operators.config.js --selectProjects="Integration Tests"',
  'test:operators:integration:watch': 'jest --config=jest.operators.config.js --selectProjects="Integration Tests" --watch',
  
  // E2E tests
  'test:operators:e2e': 'jest --config=jest.operators.config.js --selectProjects="E2E Tests"',
  
  // Performance tests
  'test:operators:performance': 'jest --config=jest.operators.config.js --selectProjects="Performance Tests"',
  
  // Security tests
  'test:operators:security': 'jest --config=jest.operators.config.js --selectProjects="Security Tests"',
  
  // Compliance tests
  'test:operators:compliance': 'jest --config=jest.operators.config.js --selectProjects="Compliance Tests"',
  
  // All operators tests
  'test:operators:all': 'jest --config=jest.operators.config.js',
  'test:operators:all:coverage': 'jest --config=jest.operators.config.js --coverage',
  
  // CI/CD specific tests
  'test:operators:ci': 'jest --config=jest.operators.config.js --ci --coverage --watchAll=false --passWithNoTests',
  
  // Debug tests
  'test:operators:debug': 'jest --config=jest.operators.config.js --runInBand --verbose --no-cache',
};

// Environment-specific overrides
if (process.env.NODE_ENV === 'ci') {
  operatorsJestConfig.ci = true;
  operatorsJestConfig.watchAll = false;
  operatorsJestConfig.passWithNoTests = true;
  operatorsJestConfig.maxWorkers = 2;
  operatorsJestConfig.coverage = true;
}

if (process.env.NODE_ENV === 'development') {
  operatorsJestConfig.watch = true;
  operatorsJestConfig.verbose = false;
  operatorsJestConfig.notify = true;
}

module.exports = createJestConfig(operatorsJestConfig);