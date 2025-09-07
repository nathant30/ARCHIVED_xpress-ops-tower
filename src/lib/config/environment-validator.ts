/**
 * Environment Configuration Validator for Xpress Ops Tower
 * Provides robust environment variable validation with sensible defaults,
 * type checking, and runtime error prevention for incomplete environments.
 */

export enum EnvironmentType {
  DEVELOPMENT = 'development',
  STAGING = 'staging', 
  PRODUCTION = 'production',
  TEST = 'test'
}

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
  connectionTimeout: number;
  maxConnections: number;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  database: number;
  keyPrefix: string;
  connectTimeout: number;
  retryDelayOnFailover: number;
}

export interface SecurityConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  bcryptRounds: number;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  corsOrigin: string[];
  encryptionKey: string;
}

export interface TelemetryConfig {
  websocketPort: number;
  websocketPath: string;
  heartbeatInterval: number;
  reconnectAttempts: number;
  dataRetentionDays: number;
  bufferSize: number;
}

export interface PhilippinesConfig {
  ltfrbApiUrl: string;
  ltoApiUrl: string;
  ltfrbApiKey?: string;
  ltoApiKey?: string;
  complianceCheckInterval: number;
  trafficRulesVersion: string;
}

export interface LoggingConfig {
  level: string;
  format: 'json' | 'text';
  destination: 'console' | 'file' | 'elasticsearch';
  retentionDays: number;
  structuredLogging: boolean;
}

export interface EnvironmentConfig {
  nodeEnv: EnvironmentType;
  port: number;
  host: string;
  apiVersion: string;
  appName: string;
  database: DatabaseConfig;
  redis: RedisConfig;
  security: SecurityConfig;
  telemetry: TelemetryConfig;
  philippines: PhilippinesConfig;
  logging: LoggingConfig;
  debug: boolean;
  metricsEnabled: boolean;
  healthCheckEnabled: boolean;
}

/**
 * Default configuration values for different environments
 */
const defaultConfigs: Record<EnvironmentType, Partial<EnvironmentConfig>> = {
  [EnvironmentType.DEVELOPMENT]: {
    port: 3000,
    host: 'localhost',
    debug: true,
    metricsEnabled: true,
    healthCheckEnabled: true,
    database: {
      host: 'localhost',
      port: 5432,
      database: 'xpress_ops_dev',
      ssl: false,
      connectionTimeout: 60000,
      maxConnections: 20
    },
    redis: {
      host: 'localhost',
      port: 6379,
      database: 0,
      keyPrefix: 'xpress:dev:',
      connectTimeout: 10000,
      retryDelayOnFailover: 100
    },
    security: {
      jwtExpiresIn: '24h',
      bcryptRounds: 10,
      rateLimitWindowMs: 900000, // 15 minutes
      rateLimitMaxRequests: 100,
      corsOrigin: ['http://localhost:3000', 'http://localhost:3001']
    },
    telemetry: {
      websocketPort: 3001,
      websocketPath: '/ws/telemetry',
      heartbeatInterval: 30000,
      reconnectAttempts: 5,
      dataRetentionDays: 7,
      bufferSize: 1000
    },
    philippines: {
      ltfrbApiUrl: 'https://api.ltfrb.gov.ph/sandbox',
      ltoApiUrl: 'https://api.lto.gov.ph/sandbox',
      complianceCheckInterval: 3600000, // 1 hour
      trafficRulesVersion: '2024.1'
    },
    logging: {
      level: 'debug',
      format: 'text',
      destination: 'console',
      retentionDays: 7,
      structuredLogging: true
    }
  },
  [EnvironmentType.STAGING]: {
    port: 3000,
    host: '0.0.0.0',
    debug: false,
    metricsEnabled: true,
    healthCheckEnabled: true,
    database: {
      ssl: true,
      connectionTimeout: 30000,
      maxConnections: 50
    },
    security: {
      bcryptRounds: 12,
      rateLimitWindowMs: 900000,
      rateLimitMaxRequests: 500
    },
    telemetry: {
      dataRetentionDays: 30,
      bufferSize: 5000
    },
    philippines: {
      ltfrbApiUrl: 'https://api.ltfrb.gov.ph/staging',
      ltoApiUrl: 'https://api.lto.gov.ph/staging',
      complianceCheckInterval: 1800000 // 30 minutes
    },
    logging: {
      level: 'info',
      format: 'json',
      destination: 'elasticsearch',
      retentionDays: 30
    }
  },
  [EnvironmentType.PRODUCTION]: {
    port: 3000,
    host: '0.0.0.0',
    debug: false,
    metricsEnabled: true,
    healthCheckEnabled: true,
    database: {
      ssl: true,
      connectionTimeout: 30000,
      maxConnections: 100
    },
    security: {
      bcryptRounds: 14,
      rateLimitWindowMs: 900000,
      rateLimitMaxRequests: 1000
    },
    telemetry: {
      dataRetentionDays: 90,
      bufferSize: 10000
    },
    philippines: {
      ltfrbApiUrl: 'https://api.ltfrb.gov.ph/v1',
      ltoApiUrl: 'https://api.lto.gov.ph/v1',
      complianceCheckInterval: 900000 // 15 minutes
    },
    logging: {
      level: 'warn',
      format: 'json',
      destination: 'elasticsearch',
      retentionDays: 90
    }
  },
  [EnvironmentType.TEST]: {
    port: 3002,
    host: 'localhost',
    debug: true,
    metricsEnabled: false,
    healthCheckEnabled: false,
    database: {
      host: 'localhost',
      port: 5433,
      database: 'xpress_ops_test',
      ssl: false,
      connectionTimeout: 10000,
      maxConnections: 10
    },
    redis: {
      database: 1,
      keyPrefix: 'xpress:test:'
    },
    telemetry: {
      dataRetentionDays: 1,
      bufferSize: 100
    },
    logging: {
      level: 'error',
      format: 'text',
      destination: 'console',
      retentionDays: 1
    }
  }
};

export interface ValidationError {
  variable: string;
  message: string;
  severity: 'error' | 'warning';
  suggestion?: string;
}

/**
 * Environment validator with comprehensive error handling and defaults
 */
export class EnvironmentValidator {
  private errors: ValidationError[] = [];
  private warnings: ValidationError[] = [];

  /**
   * Validates a required environment variable
   */
  private validateRequired(name: string, value: string | undefined, type: 'string' | 'number' | 'boolean' = 'string'): any {
    if (!value) {
      this.errors.push({
        variable: name,
        message: `Required environment variable ${name} is not defined`,
        severity: 'error',
        suggestion: `Set ${name} in your environment or .env file`
      });
      return undefined;
    }

    return this.parseValue(name, value, type);
  }

  /**
   * Validates an optional environment variable with default
   */
  private validateOptional<T>(name: string, value: string | undefined, defaultValue: T, type: 'string' | 'number' | 'boolean' = 'string'): T {
    if (!value) {
      this.warnings.push({
        variable: name,
        message: `Optional environment variable ${name} not set, using default: ${defaultValue}`,
        severity: 'warning',
        suggestion: `Consider setting ${name} for production environments`
      });
      return defaultValue;
    }

    const parsed = this.parseValue(name, value, type);
    return parsed !== undefined ? parsed : defaultValue;
  }

  /**
   * Parses and validates a value based on type
   */
  private parseValue(name: string, value: string, type: 'string' | 'number' | 'boolean'): any {
    switch (type) {
      case 'number':
        const num = Number(value);
        if (isNaN(num)) {
          this.errors.push({
            variable: name,
            message: `${name} must be a valid number, got: ${value}`,
            severity: 'error'
          });
          return undefined;
        }
        return num;
      
      case 'boolean':
        const bool = value.toLowerCase();
        if (!['true', 'false', '1', '0'].includes(bool)) {
          this.errors.push({
            variable: name,
            message: `${name} must be a boolean (true/false/1/0), got: ${value}`,
            severity: 'error'
          });
          return undefined;
        }
        return bool === 'true' || bool === '1';
      
      case 'string':
      default:
        return value;
    }
  }

  /**
   * Validates array environment variable (comma-separated)
   */
  private validateArray(name: string, value: string | undefined, defaultValue: string[]): string[] {
    if (!value) {
      return defaultValue;
    }
    
    return value.split(',').map(item => item.trim()).filter(item => item.length > 0);
  }

  /**
   * Main validation function
   */
  public validateEnvironment(): EnvironmentConfig {
    this.errors = [];
    this.warnings = [];

    const nodeEnv = (process.env.NODE_ENV as EnvironmentType) || EnvironmentType.DEVELOPMENT;
    const defaults = defaultConfigs[nodeEnv];

    const config: EnvironmentConfig = {
      nodeEnv,
      port: this.validateOptional('PORT', process.env.PORT, defaults.port!, 'number'),
      host: this.validateOptional('HOST', process.env.HOST, defaults.host!),
      apiVersion: this.validateOptional('API_VERSION', process.env.API_VERSION, 'v1'),
      appName: this.validateOptional('APP_NAME', process.env.APP_NAME, 'Xpress Ops Tower'),
      
      database: {
        host: this.validateOptional('DATABASE_HOST', process.env.DATABASE_HOST, defaults.database!.host!),
        port: this.validateOptional('DATABASE_PORT', process.env.DATABASE_PORT, defaults.database!.port!, 'number'),
        database: this.validateOptional('DATABASE_NAME', process.env.DATABASE_NAME, defaults.database!.database!),
        username: this.validateRequired('DATABASE_USERNAME', process.env.DATABASE_USERNAME),
        password: this.validateRequired('DATABASE_PASSWORD', process.env.DATABASE_PASSWORD),
        ssl: this.validateOptional('DATABASE_SSL', process.env.DATABASE_SSL, defaults.database!.ssl!, 'boolean'),
        connectionTimeout: this.validateOptional('DATABASE_CONNECTION_TIMEOUT', process.env.DATABASE_CONNECTION_TIMEOUT, defaults.database!.connectionTimeout!, 'number'),
        maxConnections: this.validateOptional('DATABASE_MAX_CONNECTIONS', process.env.DATABASE_MAX_CONNECTIONS, defaults.database!.maxConnections!, 'number')
      },

      redis: {
        host: this.validateOptional('REDIS_HOST', process.env.REDIS_HOST, defaults.redis!.host!),
        port: this.validateOptional('REDIS_PORT', process.env.REDIS_PORT, defaults.redis!.port!, 'number'),
        password: process.env.REDIS_PASSWORD,
        database: this.validateOptional('REDIS_DATABASE', process.env.REDIS_DATABASE, defaults.redis!.database!, 'number'),
        keyPrefix: this.validateOptional('REDIS_KEY_PREFIX', process.env.REDIS_KEY_PREFIX, defaults.redis!.keyPrefix!),
        connectTimeout: this.validateOptional('REDIS_CONNECT_TIMEOUT', process.env.REDIS_CONNECT_TIMEOUT, defaults.redis!.connectTimeout!, 'number'),
        retryDelayOnFailover: this.validateOptional('REDIS_RETRY_DELAY', process.env.REDIS_RETRY_DELAY, defaults.redis!.retryDelayOnFailover!, 'number')
      },

      security: {
        jwtSecret: this.validateRequired('JWT_SECRET', process.env.JWT_SECRET),
        jwtExpiresIn: this.validateOptional('JWT_EXPIRES_IN', process.env.JWT_EXPIRES_IN, defaults.security!.jwtExpiresIn!),
        bcryptRounds: this.validateOptional('BCRYPT_ROUNDS', process.env.BCRYPT_ROUNDS, defaults.security!.bcryptRounds!, 'number'),
        rateLimitWindowMs: this.validateOptional('RATE_LIMIT_WINDOW_MS', process.env.RATE_LIMIT_WINDOW_MS, defaults.security!.rateLimitWindowMs!, 'number'),
        rateLimitMaxRequests: this.validateOptional('RATE_LIMIT_MAX_REQUESTS', process.env.RATE_LIMIT_MAX_REQUESTS, defaults.security!.rateLimitMaxRequests!, 'number'),
        corsOrigin: this.validateArray('CORS_ORIGIN', process.env.CORS_ORIGIN, defaults.security!.corsOrigin!),
        encryptionKey: this.validateRequired('ENCRYPTION_KEY', process.env.ENCRYPTION_KEY)
      },

      telemetry: {
        websocketPort: this.validateOptional('WEBSOCKET_PORT', process.env.WEBSOCKET_PORT, defaults.telemetry!.websocketPort!, 'number'),
        websocketPath: this.validateOptional('WEBSOCKET_PATH', process.env.WEBSOCKET_PATH, defaults.telemetry!.websocketPath!),
        heartbeatInterval: this.validateOptional('WEBSOCKET_HEARTBEAT_INTERVAL', process.env.WEBSOCKET_HEARTBEAT_INTERVAL, defaults.telemetry!.heartbeatInterval!, 'number'),
        reconnectAttempts: this.validateOptional('WEBSOCKET_RECONNECT_ATTEMPTS', process.env.WEBSOCKET_RECONNECT_ATTEMPTS, defaults.telemetry!.reconnectAttempts!, 'number'),
        dataRetentionDays: this.validateOptional('TELEMETRY_RETENTION_DAYS', process.env.TELEMETRY_RETENTION_DAYS, defaults.telemetry!.dataRetentionDays!, 'number'),
        bufferSize: this.validateOptional('TELEMETRY_BUFFER_SIZE', process.env.TELEMETRY_BUFFER_SIZE, defaults.telemetry!.bufferSize!, 'number')
      },

      philippines: {
        ltfrbApiUrl: this.validateOptional('LTFRB_API_URL', process.env.LTFRB_API_URL, defaults.philippines!.ltfrbApiUrl!),
        ltoApiUrl: this.validateOptional('LTO_API_URL', process.env.LTO_API_URL, defaults.philippines!.ltoApiUrl!),
        ltfrbApiKey: process.env.LTFRB_API_KEY,
        ltoApiKey: process.env.LTO_API_KEY,
        complianceCheckInterval: this.validateOptional('COMPLIANCE_CHECK_INTERVAL', process.env.COMPLIANCE_CHECK_INTERVAL, defaults.philippines!.complianceCheckInterval!, 'number'),
        trafficRulesVersion: this.validateOptional('TRAFFIC_RULES_VERSION', process.env.TRAFFIC_RULES_VERSION, defaults.philippines!.trafficRulesVersion!)
      },

      logging: {
        level: this.validateOptional('LOG_LEVEL', process.env.LOG_LEVEL, defaults.logging!.level!),
        format: this.validateOptional('LOG_FORMAT', process.env.LOG_FORMAT, defaults.logging!.format!) as 'json' | 'text',
        destination: this.validateOptional('LOG_DESTINATION', process.env.LOG_DESTINATION, defaults.logging!.destination!) as 'console' | 'file' | 'elasticsearch',
        retentionDays: this.validateOptional('LOG_RETENTION_DAYS', process.env.LOG_RETENTION_DAYS, defaults.logging!.retentionDays!, 'number'),
        structuredLogging: this.validateOptional('STRUCTURED_LOGGING', process.env.STRUCTURED_LOGGING, defaults.logging!.structuredLogging!, 'boolean')
      },

      debug: this.validateOptional('DEBUG', process.env.DEBUG, defaults.debug!, 'boolean'),
      metricsEnabled: this.validateOptional('METRICS_ENABLED', process.env.METRICS_ENABLED, defaults.metricsEnabled!, 'boolean'),
      healthCheckEnabled: this.validateOptional('HEALTH_CHECK_ENABLED', process.env.HEALTH_CHECK_ENABLED, defaults.healthCheckEnabled!, 'boolean')
    };

    return config;
  }

  /**
   * Returns validation errors (blocking)
   */
  public getErrors(): ValidationError[] {
    return this.errors;
  }

  /**
   * Returns validation warnings (non-blocking)
   */
  public getWarnings(): ValidationError[] {
    return this.warnings;
  }

  /**
   * Checks if validation passed (no errors)
   */
  public isValid(): boolean {
    return this.errors.length === 0;
  }

  /**
   * Prints formatted validation report
   */
  public printReport(): void {
    if (this.errors.length > 0) {
      console.error('❌ Environment Validation Errors:');
      this.errors.forEach(error => {
        console.error(`   ${error.variable}: ${error.message}`);
        if (error.suggestion) {
          console.error(`   💡 Suggestion: ${error.suggestion}`);
        }
      });
      console.error('');
    }

    if (this.warnings.length > 0) {
      console.warn('⚠️  Environment Validation Warnings:');
      this.warnings.forEach(warning => {
        console.warn(`   ${warning.variable}: ${warning.message}`);
        if (warning.suggestion) {
          console.warn(`   💡 Suggestion: ${warning.suggestion}`);
        }
      });
      console.warn('');
    }

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('✅ Environment validation passed with no issues');
    }
  }
}

// Singleton instance
let cachedConfig: EnvironmentConfig | null = null;
const validator = new EnvironmentValidator();

/**
 * Gets validated environment configuration with caching
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  cachedConfig = validator.validateEnvironment();
  
  // Print validation report in non-production environments
  if (cachedConfig.nodeEnv !== EnvironmentType.PRODUCTION) {
    validator.printReport();
  }

  // Throw on validation errors
  if (!validator.isValid()) {
    throw new Error(`Environment validation failed with ${validator.getErrors().length} error(s). See console for details.`);
  }

  return cachedConfig;
}

/**
 * Validates environment without caching (for testing)
 */
export function validateEnvironmentFresh(): { config: EnvironmentConfig; errors: ValidationError[]; warnings: ValidationError[] } {
  const freshValidator = new EnvironmentValidator();
  const config = freshValidator.validateEnvironment();
  
  return {
    config,
    errors: freshValidator.getErrors(),
    warnings: freshValidator.getWarnings()
  };
}

export default { getEnvironmentConfig, validateEnvironmentFresh, EnvironmentValidator };