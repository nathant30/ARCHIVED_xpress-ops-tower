/**
 * Structured JSON Logger for Xpress Ops Tower
 * Provides consistent logging format across all services with proper JSON structure,
 * correlation IDs, timestamps, and contextual metadata for better log analysis.
 */

export enum LogLevel {
  TRACE = 'trace',
  DEBUG = 'debug', 
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

export enum LogCategory {
  SYSTEM = 'system',
  INTEGRATION = 'integration',
  COMPLIANCE = 'compliance',
  VEHICLE = 'vehicle',
  TELEMETRY = 'telemetry',
  MAINTENANCE = 'maintenance',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  API = 'api',
  DATABASE = 'database'
}

export interface LogContext {
  userId?: string;
  vehicleId?: string;
  driverId?: string;
  sessionId?: string;
  requestId?: string;
  correlationId?: string;
  ipAddress?: string;
  userAgent?: string;
  region?: string;
  operationType?: string;
  duration?: number;
  [key: string]: any;
}

export interface LogMetadata {
  category: LogCategory;
  service: string;
  version?: string;
  environment?: string;
  hostname?: string;
  pid?: number;
}

export interface StructuredLogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  category: LogCategory;
  service: string;
  context?: LogContext;
  metadata?: LogMetadata;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string | number;
  };
  performance?: {
    duration: number;
    operation: string;
    status: 'success' | 'failure' | 'timeout';
  };
  compliance?: {
    rule: string;
    status: 'compliant' | 'violation' | 'warning';
    severity: 'low' | 'medium' | 'high' | 'critical';
  };
  telemetry?: {
    vehicleCount: number;
    dataPoints: number;
    anomalies: number;
    alerts: number;
  };
}

class StructuredLogger {
  private static instance: StructuredLogger;
  private defaultMetadata: LogMetadata;

  private constructor() {
    this.defaultMetadata = {
      category: LogCategory.SYSTEM,
      service: 'ops-tower',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      hostname: process.env.HOSTNAME || 'localhost',
      pid: process.pid
    };
  }

  public static getInstance(): StructuredLogger {
    if (!StructuredLogger.instance) {
      StructuredLogger.instance = new StructuredLogger();
    }
    return StructuredLogger.instance;
  }

  /**
   * Creates a structured log entry with consistent format
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    category: LogCategory,
    service: string,
    options: {
      context?: LogContext;
      error?: Error;
      performance?: StructuredLogEntry['performance'];
      compliance?: StructuredLogEntry['compliance'];
      telemetry?: StructuredLogEntry['telemetry'];
      metadata?: Partial<LogMetadata>;
    } = {}
  ): StructuredLogEntry {
    const entry: StructuredLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      category,
      service,
      metadata: {
        ...this.defaultMetadata,
        category,
        service,
        ...options.metadata
      }
    };

    if (options.context) {
      entry.context = options.context;
    }

    if (options.error) {
      entry.error = {
        name: options.error.name,
        message: options.error.message,
        stack: options.error.stack,
        code: (options.error as any).code
      };
    }

    if (options.performance) {
      entry.performance = options.performance;
    }

    if (options.compliance) {
      entry.compliance = options.compliance;
    }

    if (options.telemetry) {
      entry.telemetry = options.telemetry;
    }

    return entry;
  }

  /**
   * Outputs the log entry to appropriate destination
   */
  private output(entry: StructuredLogEntry): void {
    const logString = JSON.stringify(entry);
    
    // In production, you might want to send to different destinations
    // based on log level (e.g., errors to alerting system)
    switch (entry.level) {
      case LogLevel.FATAL:
      case LogLevel.ERROR:
        console.error(logString);
        break;
      case LogLevel.WARN:
        console.warn(logString);
        break;
      case LogLevel.TRACE:
      case LogLevel.DEBUG:
        if (process.env.NODE_ENV === 'development') {
          console.debug(logString);
        }
        break;
      default:
        console.log(logString);
    }
  }

  // Convenience methods for different log levels
  trace(message: string, category: LogCategory, service: string, options?: Parameters<typeof this.createLogEntry>[4]) {
    this.output(this.createLogEntry(LogLevel.TRACE, message, category, service, options));
  }

  debug(message: string, category: LogCategory, service: string, options?: Parameters<typeof this.createLogEntry>[4]) {
    this.output(this.createLogEntry(LogLevel.DEBUG, message, category, service, options));
  }

  info(message: string, category: LogCategory, service: string, options?: Parameters<typeof this.createLogEntry>[4]) {
    this.output(this.createLogEntry(LogLevel.INFO, message, category, service, options));
  }

  warn(message: string, category: LogCategory, service: string, options?: Parameters<typeof this.createLogEntry>[4]) {
    this.output(this.createLogEntry(LogLevel.WARN, message, category, service, options));
  }

  error(message: string, category: LogCategory, service: string, options?: Parameters<typeof this.createLogEntry>[4]) {
    this.output(this.createLogEntry(LogLevel.ERROR, message, category, service, options));
  }

  fatal(message: string, category: LogCategory, service: string, options?: Parameters<typeof this.createLogEntry>[4]) {
    this.output(this.createLogEntry(LogLevel.FATAL, message, category, service, options));
  }

  // Specialized logging methods for common use cases
  
  /**
   * Log compliance-related events with structured compliance metadata
   */
  compliance(
    message: string, 
    service: string, 
    rule: string,
    status: 'compliant' | 'violation' | 'warning',
    severity: 'low' | 'medium' | 'high' | 'critical',
    context?: LogContext
  ) {
    this.info(message, LogCategory.COMPLIANCE, service, {
      context,
      compliance: { rule, status, severity }
    });
  }

  /**
   * Log performance metrics with timing information
   */
  performance(
    message: string,
    service: string,
    operation: string,
    duration: number,
    status: 'success' | 'failure' | 'timeout',
    context?: LogContext
  ) {
    this.info(message, LogCategory.PERFORMANCE, service, {
      context,
      performance: { operation, duration, status }
    });
  }

  /**
   * Log telemetry processing with vehicle metrics
   */
  telemetry(
    message: string,
    service: string,
    vehicleCount: number,
    dataPoints: number,
    anomalies: number = 0,
    alerts: number = 0,
    context?: LogContext
  ) {
    this.info(message, LogCategory.TELEMETRY, service, {
      context,
      telemetry: { vehicleCount, dataPoints, anomalies, alerts }
    });
  }

  /**
   * Log integration events with system information
   */
  integration(
    message: string,
    level: LogLevel,
    service: string,
    context?: LogContext,
    error?: Error
  ) {
    this.output(this.createLogEntry(level, message, LogCategory.INTEGRATION, service, { context, error }));
  }

  /**
   * Log vehicle-specific events
   */
  vehicle(
    message: string,
    level: LogLevel,
    service: string,
    vehicleId: string,
    operationType?: string,
    context?: LogContext,
    error?: Error
  ) {
    const vehicleContext = {
      ...context,
      vehicleId,
      operationType
    };
    
    this.output(this.createLogEntry(level, message, LogCategory.VEHICLE, service, {
      context: vehicleContext,
      error
    }));
  }
}

// Export singleton instance
export const logger = StructuredLogger.getInstance();

// Export helper functions for backwards compatibility
export const structuredLog = {
  info: (message: string, category: LogCategory, service: string, context?: LogContext) => 
    logger.info(message, category, service, { context }),
    
  error: (message: string, category: LogCategory, service: string, context?: LogContext, error?: Error) => 
    logger.error(message, category, service, { context, error }),
    
  warn: (message: string, category: LogCategory, service: string, context?: LogContext) => 
    logger.warn(message, category, service, { context }),
    
  debug: (message: string, category: LogCategory, service: string, context?: LogContext) => 
    logger.debug(message, category, service, { context })
};

export default logger;