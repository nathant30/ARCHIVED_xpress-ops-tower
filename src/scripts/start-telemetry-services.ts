#!/usr/bin/env node

// Telemetry Services Startup Script
// Initializes and starts all OBD telemetry and real-time data services

import OBDDeviceManager from '../lib/obd/device-manager';
import TelemetryDataCollector from '../lib/telemetry/data-collector';
import DataProcessingEngine from '../lib/analytics/data-processing-engine';
import AlertManager from '../lib/alerts/alert-manager';
import TelemetryWebSocketServer from '../lib/websocket/telemetry-server';
import PhilippinesComplianceManager from '../lib/philippines/traffic-compliance';
import VehicleIntegrationService from '../lib/integration/vehicle-integration-service';
import { auditLogger, AuditEventType, SecurityLevel } from '../lib/security/auditLogger';

interface ServiceStatus {
  name: string;
  status: 'starting' | 'running' | 'error' | 'stopped';
  startTime?: Date;
  error?: string;
}

interface SystemConfiguration {
  websocket: {
    port: number;
    maxConnections: number;
    heartbeatInterval: number;
    broadcastInterval: number;
  };
  telemetry: {
    processingInterval: number;
    batchSize: number;
    dataRetentionDays: number;
    qualityThreshold: number;
  };
  obd: {
    connectionTimeout: number;
    maxRetries: number;
    healthCheckInterval: number;
    firmwareUpdateEnabled: boolean;
  };
  alerts: {
    processingInterval: number;
    escalationTimeout: number;
    maxNotificationsPerBatch: number;
    retryAttempts: number;
  };
  compliance: {
    checkInterval: number;
    weatherApiEnabled: boolean;
    trafficApiEnabled: boolean;
    violationThreshold: number;
  };
  philippines: {
    ltfrbEnabled: boolean;
    ltoIntegration: boolean;
    pagsaIntegration: boolean;
    codingEnforcement: boolean;
  };
}

class TelemetryServiceManager {
  private services: Map<string, ServiceStatus> = new Map();
  private config: SystemConfiguration;
  private shutdownHandlers: (() => Promise<void>)[] = [];

  constructor() {
    this.config = this.loadConfiguration();
    this.initializeServiceTracking();
    this.setupSignalHandlers();
  }

  async startServices(): Promise<void> {
    console.log('🚀 Starting Xpress Ops Tower Telemetry Services');
    console.log('=====================================\n');

    try {
      // Start services in dependency order
      await this.startService('OBD Device Manager', () => this.initializeOBDManager());
      await this.startService('Telemetry Data Collector', () => this.initializeTelemetryCollector());
      await this.startService('Data Processing Engine', () => this.initializeDataProcessor());
      await this.startService('Alert Manager', () => this.initializeAlertManager());
      await this.startService('Philippines Compliance Manager', () => this.initializeComplianceManager());
      await this.startService('WebSocket Server', () => this.initializeWebSocketServer());
      await this.startService('Vehicle Integration Service', () => this.initializeIntegrationService());

      // Log successful startup
      await auditLogger.logEvent(
        AuditEventType.SYSTEM_EVENT,
        SecurityLevel.LOW,
        'SUCCESS',
        {
          action: 'telemetry_services_started',
          services: Array.from(this.services.keys()),
          config: this.config
        },
        {
          userId: 'system',
          resource: 'telemetry_services',
          action: 'startup',
          ipAddress: 'localhost'
        }
      );

      this.printServiceStatus();
      this.startHealthChecks();

      console.log('\n✅ All telemetry services started successfully!');
      console.log('📊 Real-time vehicle monitoring is now active');
      console.log('🔍 Anomaly detection and analytics running');
      console.log('⚠️  Alert system monitoring fleet operations');
      console.log('🇵🇭 Philippines compliance monitoring active');
      console.log('\nServices are running. Press Ctrl+C to shutdown gracefully.\n');

    } catch (error) {
      console.error('❌ Failed to start telemetry services:', error);
      await this.handleStartupFailure(error as Error);
      process.exit(1);
    }
  }

  private async startService(serviceName: string, initializer: () => Promise<any>): Promise<void> {
    this.updateServiceStatus(serviceName, 'starting');
    
    try {
      const startTime = Date.now();
      await initializer();
      const duration = Date.now() - startTime;
      
      this.updateServiceStatus(serviceName, 'running', new Date());
      console.log(`✅ ${serviceName} started successfully (${duration}ms)`);
      
    } catch (error) {
      this.updateServiceStatus(serviceName, 'error', undefined, (error as Error).message);
      console.error(`❌ Failed to start ${serviceName}:`, error);
      throw error;
    }
  }

  private async initializeOBDManager(): Promise<void> {
    const obdManager = OBDDeviceManager.getInstance();
    
    // Add cleanup handler
    this.shutdownHandlers.push(async () => {
      console.log('🔌 Shutting down OBD Device Manager...');
      // OBD manager cleanup would go here
    });
  }

  private async initializeTelemetryCollector(): Promise<void> {
    const telemetryCollector = TelemetryDataCollector.getInstance();
    
    // Add cleanup handler
    this.shutdownHandlers.push(async () => {
      console.log('📡 Shutting down Telemetry Data Collector...');
      // Telemetry collector cleanup would go here
    });
  }

  private async initializeDataProcessor(): Promise<void> {
    const dataProcessor = DataProcessingEngine.getInstance();
    
    // Add cleanup handler
    this.shutdownHandlers.push(async () => {
      console.log('⚙️  Shutting down Data Processing Engine...');
      // Data processor cleanup would go here
    });
  }

  private async initializeAlertManager(): Promise<void> {
    const alertManager = AlertManager.getInstance();
    
    // Add cleanup handler
    this.shutdownHandlers.push(async () => {
      console.log('⚠️  Shutting down Alert Manager...');
      // Alert manager cleanup would go here
    });
  }

  private async initializeComplianceManager(): Promise<void> {
    const complianceManager = PhilippinesComplianceManager.getInstance();
    
    // Add cleanup handler
    this.shutdownHandlers.push(async () => {
      console.log('🇵🇭 Shutting down Philippines Compliance Manager...');
      // Compliance manager cleanup would go here
    });
  }

  private async initializeWebSocketServer(): Promise<void> {
    const websocketServer = new TelemetryWebSocketServer(this.config.websocket.port);
    
    // Add cleanup handler
    this.shutdownHandlers.push(async () => {
      console.log('🌐 Shutting down WebSocket Server...');
      websocketServer.close();
    });
  }

  private async initializeIntegrationService(): Promise<void> {
    const integrationService = VehicleIntegrationService.getInstance();
    
    // Add cleanup handler
    this.shutdownHandlers.push(async () => {
      console.log('🔗 Shutting down Vehicle Integration Service...');
      integrationService.cleanup();
    });
  }

  private loadConfiguration(): SystemConfiguration {
    // Load configuration from environment variables or config file
    return {
      websocket: {
        port: parseInt(process.env.WEBSOCKET_PORT || '8080'),
        maxConnections: parseInt(process.env.MAX_WS_CONNECTIONS || '1000'),
        heartbeatInterval: parseInt(process.env.WS_HEARTBEAT_INTERVAL || '30000'),
        broadcastInterval: parseInt(process.env.WS_BROADCAST_INTERVAL || '5000')
      },
      telemetry: {
        processingInterval: parseInt(process.env.TELEMETRY_PROCESSING_INTERVAL || '1000'),
        batchSize: parseInt(process.env.TELEMETRY_BATCH_SIZE || '100'),
        dataRetentionDays: parseInt(process.env.TELEMETRY_RETENTION_DAYS || '90'),
        qualityThreshold: parseFloat(process.env.TELEMETRY_QUALITY_THRESHOLD || '0.8')
      },
      obd: {
        connectionTimeout: parseInt(process.env.OBD_CONNECTION_TIMEOUT || '30000'),
        maxRetries: parseInt(process.env.OBD_MAX_RETRIES || '3'),
        healthCheckInterval: parseInt(process.env.OBD_HEALTH_CHECK_INTERVAL || '60000'),
        firmwareUpdateEnabled: process.env.OBD_FIRMWARE_UPDATE_ENABLED === 'true'
      },
      alerts: {
        processingInterval: parseInt(process.env.ALERT_PROCESSING_INTERVAL || '30000'),
        escalationTimeout: parseInt(process.env.ALERT_ESCALATION_TIMEOUT || '7200000'), // 2 hours
        maxNotificationsPerBatch: parseInt(process.env.MAX_NOTIFICATIONS_PER_BATCH || '10'),
        retryAttempts: parseInt(process.env.ALERT_RETRY_ATTEMPTS || '3')
      },
      compliance: {
        checkInterval: parseInt(process.env.COMPLIANCE_CHECK_INTERVAL || '3600000'), // 1 hour
        weatherApiEnabled: process.env.WEATHER_API_ENABLED === 'true',
        trafficApiEnabled: process.env.TRAFFIC_API_ENABLED === 'true',
        violationThreshold: parseInt(process.env.VIOLATION_THRESHOLD || '3')
      },
      philippines: {
        ltfrbEnabled: process.env.LTFRB_ENABLED !== 'false',
        ltoIntegration: process.env.LTO_INTEGRATION === 'true',
        pagsaIntegration: process.env.PAGASA_INTEGRATION === 'true',
        codingEnforcement: process.env.CODING_ENFORCEMENT !== 'false'
      }
    };
  }

  private initializeServiceTracking(): void {
    const serviceNames = [
      'OBD Device Manager',
      'Telemetry Data Collector',
      'Data Processing Engine',
      'Alert Manager',
      'Philippines Compliance Manager',
      'WebSocket Server',
      'Vehicle Integration Service'
    ];

    for (const name of serviceNames) {
      this.services.set(name, { name, status: 'stopped' });
    }
  }

  private updateServiceStatus(name: string, status: ServiceStatus['status'], startTime?: Date, error?: string): void {
    this.services.set(name, { name, status, startTime, error });
  }

  private printServiceStatus(): void {
    console.log('\n📋 Service Status Summary:');
    console.log('==========================');
    
    for (const [name, status] of this.services.entries()) {
      const statusIcon = status.status === 'running' ? '🟢' : 
                        status.status === 'starting' ? '🟡' : 
                        status.status === 'error' ? '🔴' : '⚪';
      
      const uptimeText = status.startTime ? 
        `(${Math.floor((Date.now() - status.startTime.getTime()) / 1000)}s)` : '';
      
      console.log(`${statusIcon} ${name}: ${status.status.toUpperCase()} ${uptimeText}`);
      
      if (status.error) {
        console.log(`   ❗ Error: ${status.error}`);
      }
    }

    console.log('\n⚙️  Configuration:');
    console.log('==================');
    console.log(`WebSocket Port: ${this.config.websocket.port}`);
    console.log(`Telemetry Batch Size: ${this.config.telemetry.batchSize}`);
    console.log(`Data Retention: ${this.config.telemetry.dataRetentionDays} days`);
    console.log(`LTFRB Compliance: ${this.config.philippines.ltfrbEnabled ? 'Enabled' : 'Disabled'}`);
    console.log(`Weather Integration: ${this.config.compliance.weatherApiEnabled ? 'Enabled' : 'Disabled'}`);
  }

  private startHealthChecks(): void {
    setInterval(() => {
      this.performHealthCheck();
    }, 60000); // Every minute
  }

  private async performHealthCheck(): Promise<void> {
    try {
      // Check service health
      const integrationService = VehicleIntegrationService.getInstance();
      const status = await integrationService.getIntegrationStatus();
      
      console.log(`🩺 Health Check: ${status.activeIntegrations}/${status.totalVehicles} vehicles active`);
      
      // Log health metrics
      await auditLogger.logEvent(
        AuditEventType.SYSTEM_EVENT,
        SecurityLevel.LOW,
        'INFO',
        {
          action: 'health_check',
          integrationStatus: status,
          timestamp: new Date()
        },
        {
          userId: 'system',
          resource: 'health_check',
          action: 'check',
          ipAddress: 'localhost'
        }
      );
      
    } catch (error) {
      console.error('❌ Health check failed:', error);
    }
  }

  private setupSignalHandlers(): void {
    process.on('SIGINT', this.gracefulShutdown.bind(this));
    process.on('SIGTERM', this.gracefulShutdown.bind(this));
    process.on('uncaughtException', this.handleUncaughtException.bind(this));
    process.on('unhandledRejection', this.handleUnhandledRejection.bind(this));
  }

  private async gracefulShutdown(signal: string): Promise<void> {
    console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
    
    try {
      // Log shutdown initiation
      await auditLogger.logEvent(
        AuditEventType.SYSTEM_EVENT,
        SecurityLevel.LOW,
        'INFO',
        {
          action: 'telemetry_services_shutdown_initiated',
          signal,
          services: Array.from(this.services.keys())
        },
        {
          userId: 'system',
          resource: 'telemetry_services',
          action: 'shutdown',
          ipAddress: 'localhost'
        }
      );

      // Execute shutdown handlers in reverse order
      for (let i = this.shutdownHandlers.length - 1; i >= 0; i--) {
        await this.shutdownHandlers[i]();
      }

      console.log('✅ All telemetry services shut down gracefully');
      process.exit(0);
      
    } catch (error) {
      console.error('❌ Error during graceful shutdown:', error);
      process.exit(1);
    }
  }

  private async handleUncaughtException(error: Error): Promise<void> {
    console.error('❌ Uncaught Exception:', error);
    
    await auditLogger.logEvent(
      AuditEventType.SYSTEM_ERROR,
      SecurityLevel.CRITICAL,
      'FAILURE',
      {
        action: 'uncaught_exception',
        error: error.message,
        stack: error.stack
      },
      {
        userId: 'system',
        resource: 'telemetry_services',
        action: 'error',
        ipAddress: 'localhost'
      }
    );

    await this.gracefulShutdown('UNCAUGHT_EXCEPTION');
  }

  private async handleUnhandledRejection(reason: any, promise: Promise<any>): Promise<void> {
    console.error('❌ Unhandled Promise Rejection:', reason);
    
    await auditLogger.logEvent(
      AuditEventType.SYSTEM_ERROR,
      SecurityLevel.HIGH,
      'FAILURE',
      {
        action: 'unhandled_promise_rejection',
        reason: reason?.toString(),
        promise: promise?.toString()
      },
      {
        userId: 'system',
        resource: 'telemetry_services',
        action: 'error',
        ipAddress: 'localhost'
      }
    );
  }

  private async handleStartupFailure(error: Error): Promise<void> {
    await auditLogger.logEvent(
      AuditEventType.SYSTEM_ERROR,
      SecurityLevel.CRITICAL,
      'FAILURE',
      {
        action: 'telemetry_services_startup_failed',
        error: error.message,
        services: Array.from(this.services.entries()).map(([name, status]) => ({
          name,
          status: status.status,
          error: status.error
        }))
      },
      {
        userId: 'system',
        resource: 'telemetry_services',
        action: 'startup_failure',
        ipAddress: 'localhost'
      }
    );
  }
}

// Main execution
async function main(): Promise<void> {
  const serviceManager = new TelemetryServiceManager();
  await serviceManager.startServices();
}

// Execute if run directly
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Failed to start telemetry services:', error);
    process.exit(1);
  });
}

export default TelemetryServiceManager;