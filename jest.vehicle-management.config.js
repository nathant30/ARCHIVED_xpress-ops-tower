/**
 * Jest Configuration for Vehicle Management Tests
 * Specialized configuration for comprehensive vehicle management testing
 */

const baseConfig = require('./jest.config.js');

module.exports = {
  ...baseConfig,
  
  // Test identification and discovery
  displayName: 'Vehicle Management Tests',
  testMatch: [
    '<rootDir>/src/__tests__/vehicle-management/**/*.test.{ts,tsx,js,jsx}',
  ],
  
  // Coverage configuration specific to vehicle management
  collectCoverageFrom: [
    'src/app/api/**/vehicles/**/*.{ts,tsx}',
    'src/app/vehicles/**/*.{ts,tsx}',
    'src/components/**/vehicle/**/*.{ts,tsx}',
    'src/lib/vehicle/**/*.{ts,tsx}',
    'src/services/vehicle/**/*.{ts,tsx}',
    'src/types/vehicle.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/__tests__/**',
    '!**/__fixtures__/**',
    '!**/__mocks__/**',
  ],
  
  coverageDirectory: '<rootDir>/coverage/vehicle-management',
  
  // Coverage thresholds for vehicle management
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    // Specific thresholds for critical components
    'src/lib/vehicle/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    'src/app/api/**/vehicles/': {
      branches: 88,
      functions: 88,
      lines: 88,
      statements: 88,
    },
  },
  
  // Test environment setup
  setupFilesAfterEnv: [
    '<rootDir>/src/__tests__/vehicle-management/__fixtures__/setup-tests.ts',
  ],
  
  // Module name mapping for vehicle management
  moduleNameMapping: {
    ...baseConfig.moduleNameMapping,
    '^@/vehicle/(.*)$': '<rootDir>/src/lib/vehicle/$1',
    '^@/vehicle-fixtures/(.*)$': '<rootDir>/src/__tests__/vehicle-management/__fixtures__/$1',
  },
  
  // Test environment variables
  setupFiles: [
    '<rootDir>/src/__tests__/vehicle-management/__fixtures__/setup-env.ts',
  ],
  
  // Global test configuration
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    },
  },
  
  // Test timeouts for different test types
  testTimeout: 30000, // Default 30 seconds
  
  // Custom test runners for different test types
  projects: [
    {
      displayName: 'Unit Tests',
      testMatch: [
        '<rootDir>/src/__tests__/vehicle-management/vehicle-service.test.ts',
      ],
      testEnvironment: 'node',
      setupFilesAfterEnv: [
        '<rootDir>/src/__tests__/vehicle-management/__fixtures__/setup-unit-tests.ts',
      ],
    },
    {
      displayName: 'API Integration Tests',
      testMatch: [
        '<rootDir>/src/__tests__/vehicle-management/vehicle-api.test.ts',
      ],
      testEnvironment: 'node',
      testTimeout: 45000,
      setupFilesAfterEnv: [
        '<rootDir>/src/__tests__/vehicle-management/__fixtures__/setup-integration-tests.ts',
      ],
    },
    {
      displayName: 'Component Tests',
      testMatch: [
        '<rootDir>/src/__tests__/vehicle-management/vehicle-components.test.tsx',
      ],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: [
        '<rootDir>/src/__tests__/vehicle-management/__fixtures__/setup-component-tests.ts',
      ],
      moduleNameMapping: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
          '<rootDir>/src/__tests__/vehicle-management/__mocks__/fileMock.js',
      },
    },
    {
      displayName: 'Telemetry Integration Tests',
      testMatch: [
        '<rootDir>/src/__tests__/vehicle-management/vehicle-telemetry-integration.test.ts',
      ],
      testEnvironment: 'node',
      testTimeout: 60000,
      setupFilesAfterEnv: [
        '<rootDir>/src/__tests__/vehicle-management/__fixtures__/setup-telemetry-tests.ts',
      ],
    },
    {
      displayName: 'Security Tests',
      testMatch: [
        '<rootDir>/src/__tests__/vehicle-management/vehicle-security.test.ts',
      ],
      testEnvironment: 'node',
      testTimeout: 90000,
      setupFilesAfterEnv: [
        '<rootDir>/src/__tests__/vehicle-management/__fixtures__/setup-security-tests.ts',
      ],
    },
    {
      displayName: 'Performance Tests',
      testMatch: [
        '<rootDir>/src/__tests__/vehicle-management/vehicle-performance.test.ts',
      ],
      testEnvironment: 'node',
      testTimeout: 300000, // 5 minutes for performance tests
      setupFilesAfterEnv: [
        '<rootDir>/src/__tests__/vehicle-management/__fixtures__/setup-performance-tests.ts',
      ],
    },
    {
      displayName: 'Philippines Compliance Tests',
      testMatch: [
        '<rootDir>/src/__tests__/vehicle-management/philippines-compliance.test.ts',
      ],
      testEnvironment: 'node',
      testTimeout: 120000, // 2 minutes for compliance tests
      setupFilesAfterEnv: [
        '<rootDir>/src/__tests__/vehicle-management/__fixtures__/setup-compliance-tests.ts',
      ],
    },
  ],
  
  // Reporters for different CI environments
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: '<rootDir>/test-results/vehicle-management/',
        outputName: 'junit.xml',
        suiteName: 'Vehicle Management Tests',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: true,
      },
    ],
    [
      'jest-html-reporters',
      {
        publicPath: '<rootDir>/test-results/vehicle-management/html-report',
        filename: 'vehicle-test-report.html',
        expand: true,
        hideIcon: false,
        pageTitle: 'Vehicle Management Test Report',
      },
    ],
  ],
  
  // Cache configuration
  cacheDirectory: '<rootDir>/.jest-cache/vehicle-management',
  
  // Watch mode configuration
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
  
  // Error handling
  bail: false, // Continue running tests even if some fail
  verbose: true,
  
  // Mock configuration
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  
  // Transform configuration
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
        isolatedModules: true,
      },
    ],
    '^.+\\.(js|jsx)$': [
      'babel-jest',
      {
        presets: ['next/babel'],
      },
    ],
  },
  
  // Additional Jest configuration for vehicle management
  maxWorkers: process.env.CI ? 2 : '50%',
  
  // Snapshot configuration
  snapshotSerializers: [
    '@emotion/jest/serializer',
  ],
  
  // Module file extensions
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json',
    'node',
  ],
  
  // Test result processor
  testResultsProcessor: 'jest-sonar-reporter',
};