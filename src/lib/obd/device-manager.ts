// OBD Device Manager - Device Registration and Health Monitoring
// Handles OBD device lifecycle, connectivity, and health monitoring

import { VehicleOBDDevice, OBDStatus } from '@/types/vehicles';
import { auditLogger, AuditEventType, SecurityLevel } from '@/lib/security/auditLogger';

export interface DeviceRegistrationRequest {
  deviceSerial: string;
  deviceModel: string;
  manufacturer: string;
  firmwareVersion?: string;
  vehicleId: string;
  installedDate: Date;
  installedBy?: string;
  supportedProtocols: string[];
  cellularCarrier?: string;
  dataPlan?: string;
  monthlyDataCost?: number;
  dataRetentionDays?: number;
}

export interface DeviceHealthStatus {
  deviceId: string;
  status: OBDStatus;
  lastConnectionAt?: Date;
  connectionUptime: number; // percentage
  dataQuality: number; // percentage
  signalStrength: number; // percentage
  batteryLevel?: number;
  cellularSignal?: number;
  diagnosticsCount: number;
  errorCount: number;
  lastErrorAt?: Date;
  lastErrorCode?: string;
}

export interface DeviceConfiguration {
  deviceId: string;
  collectEngineData: boolean;
  collectGpsData: boolean;
  collectDiagnosticData: boolean;
  collectFuelData: boolean;
  connectionFrequency: number; // seconds
  dataRetentionDays: number;
  alertThresholds: {
    engineTempMax: number;
    oilPressureMin: number;
    batteryVoltageMin: number;
    fuelLevelMin: number;
    coolantTempMax: number;
  };
}

export interface DeviceFirmwareUpdate {
  deviceId: string;
  currentVersion: string;
  targetVersion: string;
  updateStatus: 'pending' | 'downloading' | 'installing' | 'completed' | 'failed';
  updateStartedAt?: Date;
  updateCompletedAt?: Date;
  errorMessage?: string;
  rollbackAvailable: boolean;
}

export class OBDDeviceManager {
  private static instance: OBDDeviceManager;
  private devices: Map<string, VehicleOBDDevice> = new Map();
  private healthMonitor: Map<string, DeviceHealthStatus> = new Map();
  private configurations: Map<string, DeviceConfiguration> = new Map();
  private firmwareUpdates: Map<string, DeviceFirmwareUpdate> = new Map();

  private constructor() {
    this.initializeHealthMonitoring();
    this.loadDeviceConfigurations();
  }

  public static getInstance(): OBDDeviceManager {
    if (!OBDDeviceManager.instance) {
      OBDDeviceManager.instance = new OBDDeviceManager();
    }
    return OBDDeviceManager.instance;
  }

  // Device Registration and Management
  async registerDevice(request: DeviceRegistrationRequest): Promise<VehicleOBDDevice> {
    try {
      // Validate device serial uniqueness
      const existingDevice = await this.getDeviceBySerial(request.deviceSerial);
      if (existingDevice) {
        throw new Error(`Device with serial ${request.deviceSerial} already exists`);
      }

      // Create new device record
      const device: VehicleOBDDevice = {
        id: `obd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        deviceSerial: request.deviceSerial,
        deviceModel: request.deviceModel,
        manufacturer: request.manufacturer,
        firmwareVersion: request.firmwareVersion,
        vehicleId: request.vehicleId,
        installedDate: request.installedDate,
        installedBy: request.installedBy,
        supportedProtocols: request.supportedProtocols,
        cellularCarrier: request.cellularCarrier,
        dataPlan: request.dataPlan,
        monthlyDataCost: request.monthlyDataCost,
        status: 'not_installed',
        connectionFrequency: 30, // Default 30 seconds
        collectEngineData: true,
        collectGpsData: true,
        collectDiagnosticData: true,
        collectFuelData: true,
        dataRetentionDays: request.dataRetentionDays || 90,
        totalDataPoints: 0,
        dataAccuracyRate: 100.00,
        uptimePercentage: 0.00,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      };

      // Store device
      this.devices.set(device.id, device);

      // Initialize health monitoring
      this.initializeDeviceHealth(device.id);

      // Initialize default configuration
      this.initializeDeviceConfiguration(device.id, request.vehicleId);

      // Log device registration
      await auditLogger.logEvent(
        AuditEventType.SYSTEM_EVENT,
        SecurityLevel.MEDIUM,
        'SUCCESS',
        {
          action: 'obd_device_registration',
          deviceSerial: request.deviceSerial,
          vehicleId: request.vehicleId,
          manufacturer: request.manufacturer,
          model: request.deviceModel
        },
        {
          userId: 'system',
          resource: 'obd_device',
          action: 'register',
          ipAddress: 'internal'
        }
      );

      return device;
    } catch (error) {
      await auditLogger.logEvent(
        AuditEventType.SYSTEM_EVENT,
        SecurityLevel.HIGH,
        'FAILURE',
        {
          action: 'obd_device_registration_failed',
          deviceSerial: request.deviceSerial,
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        {
          userId: 'system',
          resource: 'obd_device',
          action: 'register',
          ipAddress: 'internal'
        }
      );
      throw error;
    }
  }

  async activateDevice(deviceId: string): Promise<boolean> {
    try {
      const device = this.devices.get(deviceId);
      if (!device) {
        throw new Error(`Device ${deviceId} not found`);
      }

      // Update device status
      device.status = 'connected';
      device.lastConnectionAt = new Date();
      device.updatedAt = new Date();

      // Update health status
      const health = this.healthMonitor.get(deviceId);
      if (health) {
        health.status = 'connected';
        health.lastConnectionAt = new Date();
      }

      // Log activation
      await auditLogger.logEvent(
        AuditEventType.SYSTEM_EVENT,
        SecurityLevel.LOW,
        'SUCCESS',
        {
          action: 'obd_device_activation',
          deviceId,
          deviceSerial: device.deviceSerial,
          vehicleId: device.vehicleId
        },
        {
          userId: 'system',
          resource: 'obd_device',
          action: 'activate',
          ipAddress: 'internal'
        }
      );

      return true;
    } catch (error) {
      console.error('Device activation failed:', error);
      return false;
    }
  }

  async deactivateDevice(deviceId: string, reason?: string): Promise<boolean> {
    try {
      const device = this.devices.get(deviceId);
      if (!device) {
        throw new Error(`Device ${deviceId} not found`);
      }

      // Update device status
      device.status = 'disconnected';
      device.updatedAt = new Date();

      // Update health status
      const health = this.healthMonitor.get(deviceId);
      if (health) {
        health.status = 'disconnected';
      }

      // Log deactivation
      await auditLogger.logEvent(
        AuditEventType.SYSTEM_EVENT,
        SecurityLevel.LOW,
        'SUCCESS',
        {
          action: 'obd_device_deactivation',
          deviceId,
          deviceSerial: device.deviceSerial,
          reason: reason || 'Manual deactivation'
        },
        {
          userId: 'system',
          resource: 'obd_device',
          action: 'deactivate',
          ipAddress: 'internal'
        }
      );

      return true;
    } catch (error) {
      console.error('Device deactivation failed:', error);
      return false;
    }
  }

  // Device Health Monitoring
  async updateDeviceHealth(deviceId: string, healthData: Partial<DeviceHealthStatus>): Promise<void> {
    const currentHealth = this.healthMonitor.get(deviceId);
    if (!currentHealth) {
      return;
    }

    // Update health metrics
    Object.assign(currentHealth, healthData, {
      lastUpdatedAt: new Date()
    });

    // Check for health alerts
    await this.checkHealthAlerts(deviceId, currentHealth);

    // Update device uptime percentage
    const device = this.devices.get(deviceId);
    if (device && healthData.connectionUptime !== undefined) {
      device.uptimePercentage = healthData.connectionUptime;
    }
  }

  async getDeviceHealth(deviceId: string): Promise<DeviceHealthStatus | null> {
    return this.healthMonitor.get(deviceId) || null;
  }

  async getAllDeviceHealth(): Promise<DeviceHealthStatus[]> {
    return Array.from(this.healthMonitor.values());
  }

  // Device Configuration Management
  async updateDeviceConfiguration(deviceId: string, config: Partial<DeviceConfiguration>): Promise<boolean> {
    try {
      const currentConfig = this.configurations.get(deviceId);
      if (!currentConfig) {
        throw new Error(`Configuration for device ${deviceId} not found`);
      }

      // Update configuration
      Object.assign(currentConfig, config);

      // Update device record
      const device = this.devices.get(deviceId);
      if (device) {
        device.collectEngineData = currentConfig.collectEngineData;
        device.collectGpsData = currentConfig.collectGpsData;
        device.collectDiagnosticData = currentConfig.collectDiagnosticData;
        device.collectFuelData = currentConfig.collectFuelData;
        device.connectionFrequency = currentConfig.connectionFrequency;
        device.dataRetentionDays = currentConfig.dataRetentionDays;
        device.updatedAt = new Date();
      }

      // Log configuration update
      await auditLogger.logEvent(
        AuditEventType.SYSTEM_EVENT,
        SecurityLevel.LOW,
        'SUCCESS',
        {
          action: 'obd_device_configuration_update',
          deviceId,
          configChanges: config
        },
        {
          userId: 'system',
          resource: 'obd_device',
          action: 'configure',
          ipAddress: 'internal'
        }
      );

      return true;
    } catch (error) {
      console.error('Configuration update failed:', error);
      return false;
    }
  }

  async getDeviceConfiguration(deviceId: string): Promise<DeviceConfiguration | null> {
    return this.configurations.get(deviceId) || null;
  }

  // Firmware Management
  async initiatefirmware Update(deviceId: string, targetVersion: string): Promise<boolean> {
    try {
      const device = this.devices.get(deviceId);
      if (!device) {
        throw new Error(`Device ${deviceId} not found`);
      }

      const firmwareUpdate: DeviceFirmwareUpdate = {
        deviceId,
        currentVersion: device.firmwareVersion || '1.0.0',
        targetVersion,
        updateStatus: 'pending',
        rollbackAvailable: true
      };

      this.firmwareUpdates.set(deviceId, firmwareUpdate);

      // Log firmware update initiation
      await auditLogger.logEvent(
        AuditEventType.SYSTEM_EVENT,
        SecurityLevel.MEDIUM,
        'SUCCESS',
        {
          action: 'obd_firmware_update_initiated',
          deviceId,
          currentVersion: firmwareUpdate.currentVersion,
          targetVersion
        },
        {
          userId: 'system',
          resource: 'obd_device',
          action: 'firmware_update',
          ipAddress: 'internal'
        }
      );

      // Simulate firmware update process
      this.simulateFirmwareUpdate(deviceId);

      return true;
    } catch (error) {
      console.error('Firmware update initiation failed:', error);
      return false;
    }
  }

  async getFirmwareUpdateStatus(deviceId: string): Promise<DeviceFirmwareUpdate | null> {
    return this.firmwareUpdates.get(deviceId) || null;
  }

  // Device Query Methods
  async getDevice(deviceId: string): Promise<VehicleOBDDevice | null> {
    return this.devices.get(deviceId) || null;
  }

  async getDeviceBySerial(deviceSerial: string): Promise<VehicleOBDDevice | null> {
    for (const device of this.devices.values()) {
      if (device.deviceSerial === deviceSerial) {
        return device;
      }
    }
    return null;
  }

  async getDevicesByVehicle(vehicleId: string): Promise<VehicleOBDDevice[]> {
    return Array.from(this.devices.values()).filter(device => device.vehicleId === vehicleId);
  }

  async getDevicesByStatus(status: OBDStatus): Promise<VehicleOBDDevice[]> {
    return Array.from(this.devices.values()).filter(device => device.status === status);
  }

  async getAllDevices(): Promise<VehicleOBDDevice[]> {
    return Array.from(this.devices.values());
  }

  // Private Helper Methods
  private initializeHealthMonitoring(): void {
    // Start health monitoring interval
    setInterval(() => {
      this.performHealthChecks();
    }, 60000); // Check every minute
  }

  private loadDeviceConfigurations(): void {
    // Load configurations from database or config files
    // This is a mock implementation
  }

  private initializeDeviceHealth(deviceId: string): void {
    const healthStatus: DeviceHealthStatus = {
      deviceId,
      status: 'not_installed',
      connectionUptime: 0,
      dataQuality: 100,
      signalStrength: 0,
      diagnosticsCount: 0,
      errorCount: 0
    };

    this.healthMonitor.set(deviceId, healthStatus);
  }

  private initializeDeviceConfiguration(deviceId: string, vehicleId: string): void {
    const config: DeviceConfiguration = {
      deviceId,
      collectEngineData: true,
      collectGpsData: true,
      collectDiagnosticData: true,
      collectFuelData: true,
      connectionFrequency: 30,
      dataRetentionDays: 90,
      alertThresholds: {
        engineTempMax: 105, // °C
        oilPressureMin: 200, // kPa
        batteryVoltageMin: 11.5, // V
        fuelLevelMin: 10, // %
        coolantTempMax: 100 // °C
      }
    };

    this.configurations.set(deviceId, config);
  }

  private async performHealthChecks(): Promise<void> {
    for (const [deviceId, health] of this.healthMonitor.entries()) {
      // Check connection timeout
      if (health.lastConnectionAt) {
        const timeSinceLastConnection = Date.now() - health.lastConnectionAt.getTime();
        const timeoutMs = 5 * 60 * 1000; // 5 minutes

        if (timeSinceLastConnection > timeoutMs && health.status === 'connected') {
          health.status = 'disconnected';
          
          // Update device status
          const device = this.devices.get(deviceId);
          if (device) {
            device.status = 'disconnected';
            device.updatedAt = new Date();
          }
        }
      }

      // Calculate uptime percentage
      if (health.lastConnectionAt) {
        const totalTime = Date.now() - (this.devices.get(deviceId)?.createdAt.getTime() || Date.now());
        const connectedTime = totalTime; // Simplified calculation
        health.connectionUptime = Math.min(100, (connectedTime / totalTime) * 100);
      }
    }
  }

  private async checkHealthAlerts(deviceId: string, health: DeviceHealthStatus): Promise<void> {
    const config = this.configurations.get(deviceId);
    if (!config) return;

    // Check for critical health conditions
    if (health.status === 'error' || health.dataQuality < 70 || health.connectionUptime < 80) {
      await auditLogger.logEvent(
        AuditEventType.SYSTEM_ALERT,
        SecurityLevel.HIGH,
        'WARNING',
        {
          action: 'obd_device_health_alert',
          deviceId,
          status: health.status,
          dataQuality: health.dataQuality,
          connectionUptime: health.connectionUptime,
          errorCount: health.errorCount
        },
        {
          userId: 'system',
          resource: 'obd_device',
          action: 'health_check',
          ipAddress: 'internal'
        }
      );
    }
  }

  private async simulateFirmwareUpdate(deviceId: string): Promise<void> {
    const update = this.firmwareUpdates.get(deviceId);
    if (!update) return;

    // Simulate download phase
    setTimeout(() => {
      update.updateStatus = 'downloading';
      update.updateStartedAt = new Date();
    }, 1000);

    // Simulate installation phase
    setTimeout(() => {
      update.updateStatus = 'installing';
    }, 5000);

    // Simulate completion
    setTimeout(async () => {
      update.updateStatus = 'completed';
      update.updateCompletedAt = new Date();

      // Update device firmware version
      const device = this.devices.get(deviceId);
      if (device) {
        device.firmwareVersion = update.targetVersion;
        device.updatedAt = new Date();
      }

      // Log completion
      await auditLogger.logEvent(
        AuditEventType.SYSTEM_EVENT,
        SecurityLevel.LOW,
        'SUCCESS',
        {
          action: 'obd_firmware_update_completed',
          deviceId,
          newVersion: update.targetVersion
        },
        {
          userId: 'system',
          resource: 'obd_device',
          action: 'firmware_update',
          ipAddress: 'internal'
        }
      );
    }, 10000);
  }
}

export default OBDDeviceManager;