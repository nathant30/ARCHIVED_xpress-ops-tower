// Telemetry Data Collector - Real-time data ingestion and validation
// Handles OBD data collection, validation, and storage

import { VehicleTelemetryData, VehicleDiagnosticEvent } from '@/types/vehicles';
import OBDDeviceManager from '@/lib/obd/device-manager';
import { auditLogger, AuditEventType, SecurityLevel } from '@/lib/security/auditLogger';

export interface RawTelemetryData {
  deviceId: string;
  vehicleId: string;
  driverId?: string;
  timestamp: Date;
  
  // Location data
  latitude?: number;
  longitude?: number;
  speed?: number;
  heading?: number;
  altitude?: number;
  gpsAccuracy?: number;
  
  // Engine data
  engineRpm?: number;
  engineLoad?: number;
  throttlePosition?: number;
  engineTemp?: number;
  coolantTemp?: number;
  
  // Fuel data
  fuelLevel?: number;
  fuelConsumption?: number;
  fuelTrim?: number;
  
  // Electrical data
  batteryVoltage?: number;
  alternatorVoltage?: number;
  
  // Additional OBD data
  oilPressure?: number;
  intakeAirTemp?: number;
  massAirFlow?: number;
  manifoldPressure?: number;
  
  // Diagnostic codes
  dtcCodes?: string[];
  
  // Environmental
  ambientTemp?: number;
  humidity?: number;
  barometricPressure?: number;
  
  // Data quality
  signalStrength?: number;
  dataSource: 'obd' | 'mobile' | 'telematics' | 'manual';
}

export interface TelemetryValidationResult {
  isValid: boolean;
  qualityScore: number;
  validatedData: VehicleTelemetryData | null;
  errors: string[];
  warnings: string[];
}

export interface DataCollectionMetrics {
  totalDataPoints: number;
  validDataPoints: number;
  invalidDataPoints: number;
  averageQualityScore: number;
  deviceCount: number;
  connectedDevices: number;
  disconnectedDevices: number;
  errorCount: number;
  lastCollectionAt: Date;
}

export class TelemetryDataCollector {
  private static instance: TelemetryDataCollector;
  private deviceManager: OBDDeviceManager;
  private dataBuffer: Map<string, RawTelemetryData[]> = new Map();
  private validationRules: Map<string, (value: any) => boolean> = new Map();
  private collectionMetrics: DataCollectionMetrics;
  private isCollecting: boolean = false;

  private constructor() {
    this.deviceManager = OBDDeviceManager.getInstance();
    this.initializeValidationRules();
    this.initializeMetrics();
    this.startDataCollection();
  }

  public static getInstance(): TelemetryDataCollector {
    if (!TelemetryDataCollector.instance) {
      TelemetryDataCollector.instance = new TelemetryDataCollector();
    }
    return TelemetryDataCollector.instance;
  }

  // Main data collection methods
  async collectTelemetryData(rawData: RawTelemetryData): Promise<TelemetryValidationResult> {
    try {
      // Validate the device is registered and active
      const device = await this.deviceManager.getDevice(rawData.deviceId);
      if (!device || !device.isActive) {
        return {
          isValid: false,
          qualityScore: 0,
          validatedData: null,
          errors: [`Device ${rawData.deviceId} not found or inactive`],
          warnings: []
        };
      }

      // Validate and transform raw data
      const validationResult = await this.validateTelemetryData(rawData);
      
      if (validationResult.isValid && validationResult.validatedData) {
        // Store validated data
        await this.storeTelemetryData(validationResult.validatedData);
        
        // Update device health metrics
        await this.updateDeviceMetrics(rawData.deviceId, validationResult.qualityScore);
        
        // Check for diagnostic events
        await this.processDiagnosticData(validationResult.validatedData);
        
        // Update collection metrics
        this.updateCollectionMetrics(true, validationResult.qualityScore);
      } else {
        this.updateCollectionMetrics(false, validationResult.qualityScore);
      }

      return validationResult;
    } catch (error) {
      await auditLogger.logEvent(
        AuditEventType.SYSTEM_ERROR,
        SecurityLevel.HIGH,
        'FAILURE',
        {
          action: 'telemetry_data_collection_error',
          deviceId: rawData.deviceId,
          vehicleId: rawData.vehicleId,
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        {
          userId: 'system',
          resource: 'telemetry',
          action: 'collect',
          ipAddress: 'internal'
        }
      );

      throw error;
    }
  }

  async batchCollectTelemetryData(rawDataArray: RawTelemetryData[]): Promise<TelemetryValidationResult[]> {
    const results: TelemetryValidationResult[] = [];
    
    for (const rawData of rawDataArray) {
      try {
        const result = await this.collectTelemetryData(rawData);
        results.push(result);
      } catch (error) {
        results.push({
          isValid: false,
          qualityScore: 0,
          validatedData: null,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
          warnings: []
        });
      }
    }

    return results;
  }

  // Data validation methods
  private async validateTelemetryData(rawData: RawTelemetryData): Promise<TelemetryValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let qualityScore = 100;

    // Required field validation
    if (!rawData.deviceId) {
      errors.push('Device ID is required');
      qualityScore -= 50;
    }
    
    if (!rawData.vehicleId) {
      errors.push('Vehicle ID is required');
      qualityScore -= 50;
    }

    if (!rawData.timestamp) {
      errors.push('Timestamp is required');
      qualityScore -= 30;
    } else {
      // Check timestamp validity (not too far in future or past)
      const now = new Date();
      const timeDiff = Math.abs(now.getTime() - rawData.timestamp.getTime());
      const maxTimeDiff = 5 * 60 * 1000; // 5 minutes

      if (timeDiff > maxTimeDiff) {
        warnings.push('Timestamp is outside acceptable range');
        qualityScore -= 10;
      }
    }

    // Location data validation
    if (rawData.latitude !== undefined) {
      if (!this.validateLatitude(rawData.latitude)) {
        warnings.push('Invalid latitude value');
        qualityScore -= 5;
      }
    }

    if (rawData.longitude !== undefined) {
      if (!this.validateLongitude(rawData.longitude)) {
        warnings.push('Invalid longitude value');
        qualityScore -= 5;
      }
    }

    if (rawData.speed !== undefined) {
      if (!this.validateSpeed(rawData.speed)) {
        warnings.push('Invalid speed value');
        qualityScore -= 3;
      }
    }

    // Engine data validation
    if (rawData.engineRpm !== undefined) {
      if (!this.validateEngineRpm(rawData.engineRpm)) {
        warnings.push('Invalid engine RPM value');
        qualityScore -= 3;
      }
    }

    if (rawData.engineTemp !== undefined) {
      if (!this.validateEngineTemp(rawData.engineTemp)) {
        warnings.push('Invalid engine temperature value');
        qualityScore -= 3;
      }
    }

    if (rawData.fuelLevel !== undefined) {
      if (!this.validateFuelLevel(rawData.fuelLevel)) {
        warnings.push('Invalid fuel level value');
        qualityScore -= 3;
      }
    }

    if (rawData.batteryVoltage !== undefined) {
      if (!this.validateBatteryVoltage(rawData.batteryVoltage)) {
        warnings.push('Invalid battery voltage value');
        qualityScore -= 3;
      }
    }

    // Create validated telemetry data if no critical errors
    if (errors.length === 0) {
      const validatedData: VehicleTelemetryData = {
        id: `telem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        vehicleId: rawData.vehicleId,
        deviceId: rawData.deviceId,
        driverId: rawData.driverId,
        
        // Location
        location: (rawData.latitude !== undefined && rawData.longitude !== undefined) ? {
          latitude: rawData.latitude,
          longitude: rawData.longitude
        } : undefined,
        speedKmh: rawData.speed,
        heading: rawData.heading,
        altitudeMeters: rawData.altitude,
        gpsAccuracyMeters: rawData.gpsAccuracy,
        
        // Engine performance
        engineRpm: rawData.engineRpm,
        engineLoadPercent: rawData.engineLoad,
        throttlePositionPercent: rawData.throttlePosition,
        engineTemperatureCelsius: rawData.engineTemp,
        coolantTemperatureCelsius: rawData.coolantTemp,
        
        // Fuel
        fuelLevelPercent: rawData.fuelLevel,
        instantaneousFuelConsumptionLph: rawData.fuelConsumption,
        fuelTrimPercent: rawData.fuelTrim,
        
        // Vehicle diagnostics
        batteryVoltage: rawData.batteryVoltage,
        oilPressureKpa: rawData.oilPressure,
        intakeAirTemperatureCelsius: rawData.intakeAirTemp,
        massAirFlowGps: rawData.massAirFlow,
        
        // Driving behavior (calculated from historical data)
        harshAccelerationCount: 0,
        harshBrakingCount: 0,
        harshCorneringCount: 0,
        idleTimeMinutes: 0,
        
        // Environmental
        ambientTemperatureCelsius: rawData.ambientTemp,
        humidityPercent: rawData.humidity,
        barometricPressureKpa: rawData.barometricPressure,
        
        // Diagnostic codes
        activeDtcCodes: rawData.dtcCodes?.filter(code => code.startsWith('P') || code.startsWith('B') || code.startsWith('C') || code.startsWith('U')) || [],
        pendingDtcCodes: [],
        
        // Data quality
        dataQualityScore: Math.max(0, Math.min(1, qualityScore / 100)),
        dataSource: rawData.dataSource,
        
        // Timing
        recordedAt: rawData.timestamp,
        receivedAt: new Date(),
        recordedDate: new Date(rawData.timestamp.toDateString())
      };

      return {
        isValid: true,
        qualityScore: Math.max(0, qualityScore),
        validatedData,
        errors,
        warnings
      };
    }

    return {
      isValid: false,
      qualityScore: Math.max(0, qualityScore),
      validatedData: null,
      errors,
      warnings
    };
  }

  // Validation rule methods
  private initializeValidationRules(): void {
    this.validationRules.set('latitude', this.validateLatitude);
    this.validationRules.set('longitude', this.validateLongitude);
    this.validationRules.set('speed', this.validateSpeed);
    this.validationRules.set('engineRpm', this.validateEngineRpm);
    this.validationRules.set('engineTemp', this.validateEngineTemp);
    this.validationRules.set('fuelLevel', this.validateFuelLevel);
    this.validationRules.set('batteryVoltage', this.validateBatteryVoltage);
  }

  private validateLatitude(lat: number): boolean {
    return lat >= -90 && lat <= 90;
  }

  private validateLongitude(lng: number): boolean {
    return lng >= -180 && lng <= 180;
  }

  private validateSpeed(speed: number): boolean {
    return speed >= 0 && speed <= 300; // km/h
  }

  private validateEngineRpm(rpm: number): boolean {
    return rpm >= 0 && rpm <= 8000;
  }

  private validateEngineTemp(temp: number): boolean {
    return temp >= -40 && temp <= 200; // Celsius
  }

  private validateFuelLevel(level: number): boolean {
    return level >= 0 && level <= 100; // percentage
  }

  private validateBatteryVoltage(voltage: number): boolean {
    return voltage >= 8 && voltage <= 16; // volts
  }

  // Data storage and processing
  private async storeTelemetryData(data: VehicleTelemetryData): Promise<void> {
    // In a real implementation, this would store to database
    // For now, we'll simulate storage and add to buffer for processing
    
    const vehicleBuffer = this.dataBuffer.get(data.vehicleId) || [];
    vehicleBuffer.push({
      deviceId: data.deviceId,
      vehicleId: data.vehicleId,
      timestamp: data.recordedAt,
      latitude: data.location?.latitude,
      longitude: data.location?.longitude,
      speed: data.speedKmh,
      engineRpm: data.engineRpm,
      fuelLevel: data.fuelLevelPercent,
      batteryVoltage: data.batteryVoltage,
      dataSource: data.dataSource
    });

    // Keep only last 1000 data points per vehicle
    if (vehicleBuffer.length > 1000) {
      vehicleBuffer.splice(0, vehicleBuffer.length - 1000);
    }

    this.dataBuffer.set(data.vehicleId, vehicleBuffer);
  }

  private async processDiagnosticData(data: VehicleTelemetryData): Promise<void> {
    // Check for diagnostic trouble codes
    if (data.activeDtcCodes.length > 0) {
      for (const dtcCode of data.activeDtcCodes) {
        await this.createDiagnosticEvent(data, dtcCode);
      }
    }

    // Check for parameter-based alerts
    await this.checkParameterAlerts(data);
  }

  private async createDiagnosticEvent(data: VehicleTelemetryData, dtcCode: string): Promise<void> {
    const diagnosticEvent: VehicleDiagnosticEvent = {
      id: `diag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      vehicleId: data.vehicleId,
      deviceId: data.deviceId,
      eventCode: dtcCode,
      eventType: 'dtc',
      severity: this.getDtcSeverity(dtcCode),
      eventDescription: this.getDtcDescription(dtcCode),
      location: data.location,
      driverId: data.driverId,
      diagnosticData: {
        engineRpm: data.engineRpm,
        engineTemp: data.engineTemperatureCelsius,
        fuelLevel: data.fuelLevelPercent,
        batteryVoltage: data.batteryVoltage
      },
      recommendedAction: this.getDtcRecommendedAction(dtcCode),
      affectsSafety: this.isDtcSafetyCritical(dtcCode),
      affectsPerformance: true,
      status: 'active',
      maintenanceRequired: this.isDtcMaintenanceRequired(dtcCode),
      firstOccurredAt: data.recordedAt,
      lastOccurredAt: data.recordedAt,
      occurrenceCount: 1,
      createdAt: new Date()
    };

    // Log diagnostic event
    await auditLogger.logEvent(
      AuditEventType.SYSTEM_ALERT,
      SecurityLevel.MEDIUM,
      'WARNING',
      {
        action: 'diagnostic_event_detected',
        vehicleId: data.vehicleId,
        dtcCode,
        severity: diagnosticEvent.severity,
        affectsSafety: diagnosticEvent.affectsSafety
      },
      {
        userId: 'system',
        resource: 'diagnostic',
        action: 'detect',
        ipAddress: 'internal'
      }
    );
  }

  private async checkParameterAlerts(data: VehicleTelemetryData): Promise<void> {
    const alerts: string[] = [];

    // Check engine temperature
    if (data.engineTemperatureCelsius && data.engineTemperatureCelsius > 105) {
      alerts.push('High engine temperature detected');
    }

    // Check battery voltage
    if (data.batteryVoltage && data.batteryVoltage < 11.5) {
      alerts.push('Low battery voltage detected');
    }

    // Check fuel level
    if (data.fuelLevelPercent && data.fuelLevelPercent < 10) {
      alerts.push('Low fuel level detected');
    }

    // Check oil pressure
    if (data.oilPressureKpa && data.oilPressureKpa < 200) {
      alerts.push('Low oil pressure detected');
    }

    // Log parameter alerts
    for (const alert of alerts) {
      await auditLogger.logEvent(
        AuditEventType.SYSTEM_ALERT,
        SecurityLevel.LOW,
        'WARNING',
        {
          action: 'parameter_alert',
          vehicleId: data.vehicleId,
          alert,
          telemetryData: {
            engineTemp: data.engineTemperatureCelsius,
            batteryVoltage: data.batteryVoltage,
            fuelLevel: data.fuelLevelPercent,
            oilPressure: data.oilPressureKpa
          }
        },
        {
          userId: 'system',
          resource: 'telemetry',
          action: 'alert',
          ipAddress: 'internal'
        }
      );
    }
  }

  // Utility methods for diagnostic codes
  private getDtcSeverity(dtcCode: string): 'info' | 'warning' | 'error' | 'critical' {
    // P0xxx codes are powertrain related
    if (dtcCode.startsWith('P0')) {
      const codeNum = parseInt(dtcCode.substring(2));
      if (codeNum < 100) return 'critical'; // Generic powertrain codes
      if (codeNum < 300) return 'error';    // Fuel/air metering codes
      if (codeNum < 400) return 'warning';  // Ignition system codes
      return 'info';
    }
    
    // B0xxx codes are body related
    if (dtcCode.startsWith('B0')) return 'warning';
    
    // C0xxx codes are chassis related
    if (dtcCode.startsWith('C0')) return 'error';
    
    // U0xxx codes are network related
    if (dtcCode.startsWith('U0')) return 'info';
    
    return 'warning';
  }

  private getDtcDescription(dtcCode: string): string {
    const descriptions: Record<string, string> = {
      'P0171': 'System Too Lean (Bank 1)',
      'P0172': 'System Too Rich (Bank 1)',
      'P0300': 'Random/Multiple Cylinder Misfire Detected',
      'P0420': 'Catalyst System Efficiency Below Threshold',
      'P0442': 'Evaporative Emission Control System Leak Detected (small leak)',
      'P0171': 'System too lean (Bank 1)',
      'P0128': 'Coolant Thermostat (Coolant Temperature Below Thermostat Regulating Temperature)'
    };
    
    return descriptions[dtcCode] || `Diagnostic trouble code: ${dtcCode}`;
  }

  private getDtcRecommendedAction(dtcCode: string): string {
    const actions: Record<string, string> = {
      'P0171': 'Check for vacuum leaks, clean MAF sensor, check fuel pressure',
      'P0172': 'Check for dirty air filter, faulty fuel injectors, or oxygen sensor',
      'P0300': 'Check spark plugs, ignition coils, and fuel system',
      'P0420': 'Inspect catalytic converter and oxygen sensors',
      'P0442': 'Check fuel cap and evaporative emission system for leaks',
      'P0128': 'Check coolant level and thermostat operation'
    };
    
    return actions[dtcCode] || 'Have vehicle diagnosed by qualified technician';
  }

  private isDtcSafetyCritical(dtcCode: string): boolean {
    const safetyCritical = ['P0300', 'P0301', 'P0302', 'P0303', 'P0304', 'P0305', 'P0306', 'P0307', 'P0308'];
    return safetyCritical.includes(dtcCode);
  }

  private isDtcMaintenanceRequired(dtcCode: string): boolean {
    // Most DTC codes require some form of maintenance
    return true;
  }

  // Metrics and monitoring
  private async updateDeviceMetrics(deviceId: string, qualityScore: number): Promise<void> {
    await this.deviceManager.updateDeviceHealth(deviceId, {
      dataQuality: qualityScore,
      diagnosticsCount: this.collectionMetrics.totalDataPoints + 1,
      lastConnectionAt: new Date()
    });
  }

  private updateCollectionMetrics(isValid: boolean, qualityScore: number): void {
    this.collectionMetrics.totalDataPoints++;
    if (isValid) {
      this.collectionMetrics.validDataPoints++;
    } else {
      this.collectionMetrics.invalidDataPoints++;
    }
    
    // Update average quality score
    this.collectionMetrics.averageQualityScore = 
      (this.collectionMetrics.averageQualityScore * (this.collectionMetrics.totalDataPoints - 1) + qualityScore) / 
      this.collectionMetrics.totalDataPoints;
    
    this.collectionMetrics.lastCollectionAt = new Date();
  }

  private initializeMetrics(): void {
    this.collectionMetrics = {
      totalDataPoints: 0,
      validDataPoints: 0,
      invalidDataPoints: 0,
      averageQualityScore: 0,
      deviceCount: 0,
      connectedDevices: 0,
      disconnectedDevices: 0,
      errorCount: 0,
      lastCollectionAt: new Date()
    };
  }

  private startDataCollection(): void {
    if (this.isCollecting) return;
    
    this.isCollecting = true;
    console.log('Telemetry data collection service started');
  }

  // Public getters for metrics
  getCollectionMetrics(): DataCollectionMetrics {
    return { ...this.collectionMetrics };
  }

  getBufferedData(vehicleId: string): RawTelemetryData[] {
    return this.dataBuffer.get(vehicleId) || [];
  }

  clearBuffer(vehicleId: string): void {
    this.dataBuffer.delete(vehicleId);
  }
}

export default TelemetryDataCollector;