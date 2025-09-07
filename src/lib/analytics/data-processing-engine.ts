// Data Processing Engine - Anomaly Detection and Real-time Analytics
// Processes telemetry data for anomaly detection, performance analysis, and predictive maintenance

import { VehicleTelemetryData, VehicleDiagnosticEvent, VehiclePerformanceDaily } from '@/types/vehicles';
import TelemetryDataCollector, { RawTelemetryData } from '@/lib/telemetry/data-collector';
import { auditLogger, AuditEventType, SecurityLevel } from '@/lib/security/auditLogger';

export interface AnomalyDetectionResult {
  vehicleId: string;
  anomalyType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  description: string;
  detectedValue: number;
  expectedRange: [number, number];
  recommendations: string[];
  timestamp: Date;
  affectsSafety: boolean;
  affectsPerformance: boolean;
  requiresImmediateAction: boolean;
}

export interface VehiclePerformanceMetrics {
  vehicleId: string;
  calculationPeriod: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'monthly';
  timeRange: {
    start: Date;
    end: Date;
  };
  
  // Operational metrics
  totalDistance: number;
  totalTime: number;
  averageSpeed: number;
  maxSpeed: number;
  totalTrips: number;
  
  // Efficiency metrics
  fuelEfficiency: number;
  averageFuelConsumption: number;
  idleTimePercentage: number;
  utilizationRate: number;
  
  // Performance scores
  drivingScore: number;
  ecoScore: number;
  safetyScore: number;
  reliabilityScore: number;
  
  // Engine health metrics
  averageEngineTemp: number;
  maxEngineTemp: number;
  averageEngineLoad: number;
  
  // Maintenance indicators
  oilPressureAverage: number;
  batteryHealthScore: number;
  dtcCodeCount: number;
  maintenanceAlerts: number;
  
  // Comparative analysis
  fleetPercentile: number;
  regionPercentile: number;
  improvementSuggestions: string[];
}

export interface PredictiveMaintenanceAlert {
  vehicleId: string;
  componentType: string;
  predictedFailureDate: Date;
  confidence: number;
  currentCondition: number; // percentage
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  symptoms: string[];
  recommendedActions: string[];
  estimatedCost: number;
  daysUntilFailure: number;
  mileageUntilFailure?: number;
}

export interface DataQualityMetrics {
  vehicleId: string;
  deviceId: string;
  overallScore: number;
  completeness: number;
  accuracy: number;
  consistency: number;
  timeliness: number;
  dataPointsAnalyzed: number;
  anomalousDataPoints: number;
  missingDataSessions: number;
  lastQualityCheck: Date;
}

export class DataProcessingEngine {
  private static instance: DataProcessingEngine;
  private telemetryCollector: TelemetryDataCollector;
  private processingQueue: Map<string, VehicleTelemetryData[]> = new Map();
  private historicalData: Map<string, VehicleTelemetryData[]> = new Map();
  private anomalyBaselines: Map<string, any> = new Map();
  private performanceMetrics: Map<string, VehiclePerformanceMetrics> = new Map();
  private processingInterval: NodeJS.Timeout | null = null;

  // Anomaly detection thresholds
  private anomalyThresholds = {
    engine: {
      temperatureMax: 110, // °C
      temperatureMin: 70,
      rpmMax: 6000,
      loadMax: 90 // %
    },
    fuel: {
      consumptionMax: 15, // L/h
      levelDropRate: 20, // %/hour
      efficiencyMin: 8 // km/L
    },
    electrical: {
      batteryVoltageMin: 11.5, // V
      batteryVoltageMax: 14.8,
      alternatorMin: 13.0
    },
    driving: {
      speedMax: 120, // km/h
      harshEventsPerHour: 5,
      idleTimeMax: 30 // % of total time
    },
    gps: {
      accuracyMax: 10, // meters
      speedChangeMax: 50 // km/h per second
    }
  };

  private constructor() {
    this.telemetryCollector = TelemetryDataCollector.getInstance();
    this.initializeBaselines();
    this.startProcessing();
  }

  public static getInstance(): DataProcessingEngine {
    if (!DataProcessingEngine.instance) {
      DataProcessingEngine.instance = new DataProcessingEngine();
    }
    return DataProcessingEngine.instance;
  }

  // Main processing methods
  async processTelemetryData(data: VehicleTelemetryData): Promise<void> {
    try {
      // Add to processing queue
      const vehicleQueue = this.processingQueue.get(data.vehicleId) || [];
      vehicleQueue.push(data);
      
      // Keep only last 1000 data points for processing
      if (vehicleQueue.length > 1000) {
        vehicleQueue.shift();
      }
      
      this.processingQueue.set(data.vehicleId, vehicleQueue);

      // Store in historical data
      this.storeHistoricalData(data);

      // Process anomaly detection
      const anomalies = await this.detectAnomalies(data);
      
      // Process performance metrics
      await this.updatePerformanceMetrics(data);
      
      // Check for predictive maintenance alerts
      const maintenanceAlerts = await this.checkPredictiveMaintenance(data);
      
      // Process data quality metrics
      await this.updateDataQualityMetrics(data);

      // Broadcast anomalies and alerts
      if (anomalies.length > 0) {
        await this.broadcastAnomalies(anomalies);
      }

      if (maintenanceAlerts.length > 0) {
        await this.broadcastMaintenanceAlerts(maintenanceAlerts);
      }

    } catch (error) {
      await auditLogger.logEvent(
        AuditEventType.SYSTEM_ERROR,
        SecurityLevel.MEDIUM,
        'FAILURE',
        {
          action: 'telemetry_processing_error',
          vehicleId: data.vehicleId,
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        {
          userId: 'system',
          resource: 'data_processing',
          action: 'process',
          ipAddress: 'internal'
        }
      );
      throw error;
    }
  }

  // Anomaly detection methods
  async detectAnomalies(data: VehicleTelemetryData): Promise<AnomalyDetectionResult[]> {
    const anomalies: AnomalyDetectionResult[] = [];

    // Engine temperature anomaly detection
    if (data.engineTemperatureCelsius !== undefined) {
      const tempAnomaly = this.detectEngineTemperatureAnomaly(data);
      if (tempAnomaly) anomalies.push(tempAnomaly);
    }

    // Fuel consumption anomaly detection
    if (data.instantaneousFuelConsumptionLph !== undefined) {
      const fuelAnomaly = this.detectFuelConsumptionAnomaly(data);
      if (fuelAnomaly) anomalies.push(fuelAnomaly);
    }

    // Battery voltage anomaly detection
    if (data.batteryVoltage !== undefined) {
      const batteryAnomaly = this.detectBatteryVoltageAnomaly(data);
      if (batteryAnomaly) anomalies.push(batteryAnomaly);
    }

    // Speed anomaly detection
    if (data.speedKmh !== undefined) {
      const speedAnomaly = this.detectSpeedAnomaly(data);
      if (speedAnomaly) anomalies.push(speedAnomaly);
    }

    // Oil pressure anomaly detection
    if (data.oilPressureKpa !== undefined) {
      const oilAnomaly = this.detectOilPressureAnomaly(data);
      if (oilAnomaly) anomalies.push(oilAnomaly);
    }

    // GPS data quality anomaly
    if (data.location && data.gpsAccuracyMeters !== undefined) {
      const gpsAnomaly = this.detectGPSAnomaly(data);
      if (gpsAnomaly) anomalies.push(gpsAnomaly);
    }

    // Driving behavior anomalies
    const behaviorAnomaly = this.detectDrivingBehaviorAnomaly(data);
    if (behaviorAnomaly) anomalies.push(behaviorAnomaly);

    return anomalies;
  }

  private detectEngineTemperatureAnomaly(data: VehicleTelemetryData): AnomalyDetectionResult | null {
    const temp = data.engineTemperatureCelsius!;
    const thresholds = this.anomalyThresholds.engine;

    if (temp > thresholds.temperatureMax) {
      return {
        vehicleId: data.vehicleId,
        anomalyType: 'engine_overheating',
        severity: temp > 115 ? 'critical' : 'high',
        confidence: 0.95,
        description: `Engine temperature (${temp}°C) exceeds safe operating limit`,
        detectedValue: temp,
        expectedRange: [thresholds.temperatureMin, thresholds.temperatureMax],
        recommendations: [
          'Stop vehicle immediately if temperature exceeds 115°C',
          'Check coolant levels',
          'Inspect cooling system',
          'Check for blocked radiator'
        ],
        timestamp: data.recordedAt,
        affectsSafety: true,
        affectsPerformance: true,
        requiresImmediateAction: temp > 115
      };
    }

    if (temp < thresholds.temperatureMin && data.engineRpm && data.engineRpm > 1000) {
      return {
        vehicleId: data.vehicleId,
        anomalyType: 'engine_running_cold',
        severity: 'medium',
        confidence: 0.80,
        description: `Engine temperature (${temp}°C) unusually low for operating conditions`,
        detectedValue: temp,
        expectedRange: [thresholds.temperatureMin, thresholds.temperatureMax],
        recommendations: [
          'Check thermostat operation',
          'Inspect temperature sensor',
          'Allow proper engine warm-up'
        ],
        timestamp: data.recordedAt,
        affectsSafety: false,
        affectsPerformance: true,
        requiresImmediateAction: false
      };
    }

    return null;
  }

  private detectFuelConsumptionAnomaly(data: VehicleTelemetryData): AnomalyDetectionResult | null {
    const consumption = data.instantaneousFuelConsumptionLph!;
    const threshold = this.anomalyThresholds.fuel.consumptionMax;

    if (consumption > threshold) {
      return {
        vehicleId: data.vehicleId,
        anomalyType: 'excessive_fuel_consumption',
        severity: consumption > threshold * 1.5 ? 'high' : 'medium',
        confidence: 0.85,
        description: `Fuel consumption (${consumption} L/h) is unusually high`,
        detectedValue: consumption,
        expectedRange: [2, threshold],
        recommendations: [
          'Check driving patterns for aggressive acceleration',
          'Inspect air filter',
          'Check engine tuning',
          'Verify tire pressure'
        ],
        timestamp: data.recordedAt,
        affectsSafety: false,
        affectsPerformance: true,
        requiresImmediateAction: false
      };
    }

    return null;
  }

  private detectBatteryVoltageAnomaly(data: VehicleTelemetryData): AnomalyDetectionResult | null {
    const voltage = data.batteryVoltage!;
    const thresholds = this.anomalyThresholds.electrical;

    if (voltage < thresholds.batteryVoltageMin) {
      return {
        vehicleId: data.vehicleId,
        anomalyType: 'low_battery_voltage',
        severity: voltage < 11.0 ? 'critical' : 'high',
        confidence: 0.95,
        description: `Battery voltage (${voltage}V) is below safe operating level`,
        detectedValue: voltage,
        expectedRange: [thresholds.batteryVoltageMin, thresholds.batteryVoltageMax],
        recommendations: [
          'Check battery condition',
          'Inspect alternator charging system',
          'Test electrical load',
          'Consider battery replacement'
        ],
        timestamp: data.recordedAt,
        affectsSafety: true,
        affectsPerformance: true,
        requiresImmediateAction: voltage < 11.0
      };
    }

    if (voltage > thresholds.batteryVoltageMax) {
      return {
        vehicleId: data.vehicleId,
        anomalyType: 'high_battery_voltage',
        severity: 'medium',
        confidence: 0.85,
        description: `Battery voltage (${voltage}V) is above normal operating range`,
        detectedValue: voltage,
        expectedRange: [thresholds.batteryVoltageMin, thresholds.batteryVoltageMax],
        recommendations: [
          'Check alternator voltage regulation',
          'Inspect charging system',
          'Test voltage regulator'
        ],
        timestamp: data.recordedAt,
        affectsSafety: false,
        affectsPerformance: true,
        requiresImmediateAction: false
      };
    }

    return null;
  }

  private detectSpeedAnomaly(data: VehicleTelemetryData): AnomalyDetectionResult | null {
    const speed = data.speedKmh!;
    const threshold = this.anomalyThresholds.driving.speedMax;

    if (speed > threshold) {
      return {
        vehicleId: data.vehicleId,
        anomalyType: 'excessive_speed',
        severity: speed > threshold * 1.2 ? 'critical' : 'high',
        confidence: 0.98,
        description: `Vehicle speed (${speed} km/h) exceeds safe operating limit`,
        detectedValue: speed,
        expectedRange: [0, threshold],
        recommendations: [
          'Reduce speed immediately',
          'Review driver behavior',
          'Implement speed monitoring',
          'Provide driver training'
        ],
        timestamp: data.recordedAt,
        affectsSafety: true,
        affectsPerformance: false,
        requiresImmediateAction: true
      };
    }

    return null;
  }

  private detectOilPressureAnomaly(data: VehicleTelemetryData): AnomalyDetectionResult | null {
    const pressure = data.oilPressureKpa!;
    const minPressure = 200; // kPa

    if (pressure < minPressure && data.engineRpm && data.engineRpm > 1000) {
      return {
        vehicleId: data.vehicleId,
        anomalyType: 'low_oil_pressure',
        severity: pressure < 150 ? 'critical' : 'high',
        confidence: 0.95,
        description: `Oil pressure (${pressure} kPa) is below safe operating level`,
        detectedValue: pressure,
        expectedRange: [minPressure, 500],
        recommendations: [
          'Stop engine immediately if pressure below 150 kPa',
          'Check oil level',
          'Inspect oil pump',
          'Check for oil leaks',
          'Replace oil filter'
        ],
        timestamp: data.recordedAt,
        affectsSafety: true,
        affectsPerformance: true,
        requiresImmediateAction: pressure < 150
      };
    }

    return null;
  }

  private detectGPSAnomaly(data: VehicleTelemetryData): AnomalyDetectionResult | null {
    const accuracy = data.gpsAccuracyMeters!;
    const threshold = this.anomalyThresholds.gps.accuracyMax;

    if (accuracy > threshold) {
      return {
        vehicleId: data.vehicleId,
        anomalyType: 'poor_gps_signal',
        severity: accuracy > threshold * 2 ? 'medium' : 'low',
        confidence: 0.75,
        description: `GPS accuracy (${accuracy}m) is below acceptable threshold`,
        detectedValue: accuracy,
        expectedRange: [0, threshold],
        recommendations: [
          'Check GPS antenna connection',
          'Verify clear sky view',
          'Restart GPS receiver',
          'Update GPS firmware'
        ],
        timestamp: data.recordedAt,
        affectsSafety: false,
        affectsPerformance: false,
        requiresImmediateAction: false
      };
    }

    return null;
  }

  private detectDrivingBehaviorAnomaly(data: VehicleTelemetryData): AnomalyDetectionResult | null {
    const totalHarshEvents = data.harshAccelerationCount + data.harshBrakingCount + data.harshCorneringCount;
    
    if (totalHarshEvents > 0) {
      return {
        vehicleId: data.vehicleId,
        anomalyType: 'aggressive_driving',
        severity: totalHarshEvents > 3 ? 'high' : 'medium',
        confidence: 0.85,
        description: `Aggressive driving behavior detected (${totalHarshEvents} harsh events)`,
        detectedValue: totalHarshEvents,
        expectedRange: [0, 1],
        recommendations: [
          'Provide driver training on smooth driving techniques',
          'Monitor driver behavior patterns',
          'Implement driver scoring system',
          'Consider driver coaching sessions'
        ],
        timestamp: data.recordedAt,
        affectsSafety: true,
        affectsPerformance: true,
        requiresImmediateAction: false
      };
    }

    return null;
  }

  // Performance metrics calculation
  async updatePerformanceMetrics(data: VehicleTelemetryData): Promise<void> {
    const vehicleQueue = this.processingQueue.get(data.vehicleId) || [];
    if (vehicleQueue.length < 10) return; // Need enough data points

    const metrics = this.calculatePerformanceMetrics(data.vehicleId, vehicleQueue);
    this.performanceMetrics.set(data.vehicleId, metrics);
  }

  private calculatePerformanceMetrics(vehicleId: string, dataPoints: VehicleTelemetryData[]): VehiclePerformanceMetrics {
    const validSpeeds = dataPoints.filter(d => d.speedKmh !== undefined).map(d => d.speedKmh!);
    const validFuelConsumption = dataPoints.filter(d => d.instantaneousFuelConsumptionLph !== undefined).map(d => d.instantaneousFuelConsumptionLph!);
    const validEngineTemp = dataPoints.filter(d => d.engineTemperatureCelsius !== undefined).map(d => d.engineTemperatureCelsius!);
    const validEngineLoad = dataPoints.filter(d => d.engineLoadPercent !== undefined).map(d => d.engineLoadPercent!);
    const validOilPressure = dataPoints.filter(d => d.oilPressureKpa !== undefined).map(d => d.oilPressureKpa!);
    const validBatteryVoltage = dataPoints.filter(d => d.batteryVoltage !== undefined).map(d => d.batteryVoltage!);

    // Calculate averages
    const averageSpeed = validSpeeds.length > 0 ? validSpeeds.reduce((a, b) => a + b, 0) / validSpeeds.length : 0;
    const maxSpeed = validSpeeds.length > 0 ? Math.max(...validSpeeds) : 0;
    const averageFuelConsumption = validFuelConsumption.length > 0 ? validFuelConsumption.reduce((a, b) => a + b, 0) / validFuelConsumption.length : 0;
    const averageEngineTemp = validEngineTemp.length > 0 ? validEngineTemp.reduce((a, b) => a + b, 0) / validEngineTemp.length : 0;
    const maxEngineTemp = validEngineTemp.length > 0 ? Math.max(...validEngineTemp) : 0;
    const averageEngineLoad = validEngineLoad.length > 0 ? validEngineLoad.reduce((a, b) => a + b, 0) / validEngineLoad.length : 0;
    const averageOilPressure = validOilPressure.length > 0 ? validOilPressure.reduce((a, b) => a + b, 0) / validOilPressure.length : 0;
    const averageBatteryVoltage = validBatteryVoltage.length > 0 ? validBatteryVoltage.reduce((a, b) => a + b, 0) / validBatteryVoltage.length : 0;

    // Calculate scores
    const drivingScore = this.calculateDrivingScore(dataPoints);
    const ecoScore = this.calculateEcoScore(averageSpeed, averageFuelConsumption);
    const safetyScore = this.calculateSafetyScore(dataPoints);
    const reliabilityScore = this.calculateReliabilityScore(averageEngineTemp, averageOilPressure, averageBatteryVoltage);

    // Calculate time range
    const timeRange = {
      start: dataPoints[0].recordedAt,
      end: dataPoints[dataPoints.length - 1].recordedAt
    };

    const totalTime = (timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60); // hours

    return {
      vehicleId,
      calculationPeriod: 'realtime',
      timeRange,
      totalDistance: averageSpeed * totalTime, // Approximate
      totalTime,
      averageSpeed,
      maxSpeed,
      totalTrips: 0, // Would need trip calculation logic
      fuelEfficiency: averageSpeed > 0 && averageFuelConsumption > 0 ? averageSpeed / averageFuelConsumption : 0,
      averageFuelConsumption,
      idleTimePercentage: this.calculateIdleTimePercentage(dataPoints),
      utilizationRate: this.calculateUtilizationRate(dataPoints),
      drivingScore,
      ecoScore,
      safetyScore,
      reliabilityScore,
      averageEngineTemp,
      maxEngineTemp,
      averageEngineLoad,
      oilPressureAverage: averageOilPressure,
      batteryHealthScore: this.calculateBatteryHealthScore(averageBatteryVoltage),
      dtcCodeCount: this.countDTCCodes(dataPoints),
      maintenanceAlerts: 0, // Would be populated from alerts system
      fleetPercentile: 50, // Would be calculated against fleet data
      regionPercentile: 50, // Would be calculated against regional data
      improvementSuggestions: this.generateImprovementSuggestions(drivingScore, ecoScore, safetyScore)
    };
  }

  // Score calculation methods
  private calculateDrivingScore(dataPoints: VehicleTelemetryData[]): number {
    let score = 100;
    let harshEvents = 0;

    for (const point of dataPoints) {
      harshEvents += point.harshAccelerationCount + point.harshBrakingCount + point.harshCorneringCount;
    }

    // Deduct points for harsh events
    score -= Math.min(50, harshEvents * 2);

    return Math.max(0, score);
  }

  private calculateEcoScore(averageSpeed: number, averageFuelConsumption: number): number {
    let score = 100;

    // Optimal speed range is 50-70 km/h
    if (averageSpeed > 0) {
      const speedEfficiency = Math.max(0, 100 - Math.abs(averageSpeed - 60) * 2);
      score = (score + speedEfficiency) / 2;
    }

    // Lower fuel consumption is better
    if (averageFuelConsumption > 0) {
      const consumptionScore = Math.max(0, 100 - (averageFuelConsumption - 8) * 10);
      score = (score + consumptionScore) / 2;
    }

    return Math.max(0, Math.min(100, score));
  }

  private calculateSafetyScore(dataPoints: VehicleTelemetryData[]): number {
    let score = 100;
    let safetyEvents = 0;

    for (const point of dataPoints) {
      // Count safety-related issues
      if (point.speedKmh && point.speedKmh > 120) safetyEvents++;
      if (point.engineTemperatureCelsius && point.engineTemperatureCelsius > 105) safetyEvents++;
      if (point.batteryVoltage && point.batteryVoltage < 11.5) safetyEvents++;
      if (point.oilPressureKpa && point.oilPressureKpa < 200) safetyEvents++;
      
      safetyEvents += point.harshAccelerationCount + point.harshBrakingCount + point.harshCorneringCount;
    }

    // Deduct points for safety events
    score -= Math.min(80, safetyEvents * 5);

    return Math.max(0, score);
  }

  private calculateReliabilityScore(avgEngineTemp: number, avgOilPressure: number, avgBatteryVoltage: number): number {
    let score = 100;

    // Engine temperature reliability
    if (avgEngineTemp > 0) {
      if (avgEngineTemp > 100) score -= 20;
      else if (avgEngineTemp > 95) score -= 10;
    }

    // Oil pressure reliability
    if (avgOilPressure > 0) {
      if (avgOilPressure < 250) score -= 15;
    }

    // Battery voltage reliability
    if (avgBatteryVoltage > 0) {
      if (avgBatteryVoltage < 12.0) score -= 15;
      else if (avgBatteryVoltage > 14.5) score -= 10;
    }

    return Math.max(0, score);
  }

  private calculateIdleTimePercentage(dataPoints: VehicleTelemetryData[]): number {
    const totalIdleTime = dataPoints.reduce((sum, point) => sum + point.idleTimeMinutes, 0);
    const totalTime = dataPoints.length * 5; // Assuming 5-minute intervals
    return totalTime > 0 ? (totalIdleTime / totalTime) * 100 : 0;
  }

  private calculateUtilizationRate(dataPoints: VehicleTelemetryData[]): number {
    const movingPoints = dataPoints.filter(point => point.speedKmh && point.speedKmh > 5).length;
    return dataPoints.length > 0 ? (movingPoints / dataPoints.length) * 100 : 0;
  }

  private calculateBatteryHealthScore(avgVoltage: number): number {
    if (avgVoltage >= 12.6) return 100;
    if (avgVoltage >= 12.4) return 80;
    if (avgVoltage >= 12.0) return 60;
    if (avgVoltage >= 11.5) return 40;
    return 20;
  }

  private countDTCCodes(dataPoints: VehicleTelemetryData[]): number {
    const allCodes = new Set<string>();
    for (const point of dataPoints) {
      point.activeDtcCodes.forEach(code => allCodes.add(code));
    }
    return allCodes.size;
  }

  private generateImprovementSuggestions(drivingScore: number, ecoScore: number, safetyScore: number): string[] {
    const suggestions: string[] = [];

    if (drivingScore < 70) {
      suggestions.push('Focus on smooth acceleration and braking techniques');
      suggestions.push('Consider driver behavior training');
    }

    if (ecoScore < 70) {
      suggestions.push('Optimize driving speed for fuel efficiency');
      suggestions.push('Reduce excessive idling');
      suggestions.push('Plan routes to minimize stop-and-go traffic');
    }

    if (safetyScore < 70) {
      suggestions.push('Implement speed monitoring and alerts');
      suggestions.push('Schedule immediate vehicle inspection');
      suggestions.push('Provide safety training for drivers');
    }

    return suggestions;
  }

  // Predictive maintenance methods
  async checkPredictiveMaintenance(data: VehicleTelemetryData): Promise<PredictiveMaintenanceAlert[]> {
    const alerts: PredictiveMaintenanceAlert[] = [];
    const vehicleQueue = this.processingQueue.get(data.vehicleId) || [];

    // Engine analysis
    const engineAlert = this.analyzEngineHealth(data.vehicleId, vehicleQueue);
    if (engineAlert) alerts.push(engineAlert);

    // Battery analysis
    const batteryAlert = this.analyzeBatteryHealth(data.vehicleId, vehicleQueue);
    if (batteryAlert) alerts.push(batteryAlert);

    // Oil system analysis
    const oilAlert = this.analyzeOilSystemHealth(data.vehicleId, vehicleQueue);
    if (oilAlert) alerts.push(oilAlert);

    return alerts;
  }

  private analyzEngineHealth(vehicleId: string, dataPoints: VehicleTelemetryData[]): PredictiveMaintenanceAlert | null {
    const recentTemps = dataPoints.slice(-50).filter(d => d.engineTemperatureCelsius !== undefined).map(d => d.engineTemperatureCelsius!);
    
    if (recentTemps.length < 10) return null;

    const avgTemp = recentTemps.reduce((a, b) => a + b, 0) / recentTemps.length;
    const trend = this.calculateTrend(recentTemps);

    // If temperature is trending upward and above normal
    if (avgTemp > 95 && trend > 0.5) {
      const daysUntilFailure = Math.max(1, Math.round((105 - avgTemp) / trend * 30)); // Rough estimation

      return {
        vehicleId,
        componentType: 'engine_cooling_system',
        predictedFailureDate: new Date(Date.now() + daysUntilFailure * 24 * 60 * 60 * 1000),
        confidence: 0.75,
        currentCondition: Math.max(0, 100 - (avgTemp - 85) * 2),
        riskLevel: avgTemp > 100 ? 'high' : 'medium',
        symptoms: [
          'Rising engine temperature trend',
          `Current average temperature: ${avgTemp.toFixed(1)}°C`,
          'Potential cooling system degradation'
        ],
        recommendedActions: [
          'Schedule cooling system inspection',
          'Check coolant levels and condition',
          'Inspect radiator and hoses',
          'Test thermostat operation'
        ],
        estimatedCost: 5000, // PHP
        daysUntilFailure
      };
    }

    return null;
  }

  private analyzeBatteryHealth(vehicleId: string, dataPoints: VehicleTelemetryData[]): PredictiveMaintenanceAlert | null {
    const recentVoltages = dataPoints.slice(-50).filter(d => d.batteryVoltage !== undefined).map(d => d.batteryVoltage!);
    
    if (recentVoltages.length < 10) return null;

    const avgVoltage = recentVoltages.reduce((a, b) => a + b, 0) / recentVoltages.length;
    const minVoltage = Math.min(...recentVoltages);

    // Battery degradation analysis
    if (avgVoltage < 12.4 || minVoltage < 11.8) {
      const condition = Math.max(0, (avgVoltage - 10.5) / (12.8 - 10.5) * 100);
      const daysUntilFailure = Math.max(1, Math.round((12.0 - avgVoltage) * 90)); // Rough estimation

      return {
        vehicleId,
        componentType: 'battery',
        predictedFailureDate: new Date(Date.now() + daysUntilFailure * 24 * 60 * 60 * 1000),
        confidence: 0.80,
        currentCondition: condition,
        riskLevel: avgVoltage < 12.0 ? 'high' : 'medium',
        symptoms: [
          'Declining battery voltage',
          `Current average voltage: ${avgVoltage.toFixed(1)}V`,
          `Minimum recorded voltage: ${minVoltage.toFixed(1)}V`
        ],
        recommendedActions: [
          'Test battery capacity',
          'Check charging system',
          'Clean battery terminals',
          'Consider battery replacement'
        ],
        estimatedCost: 3500, // PHP
        daysUntilFailure
      };
    }

    return null;
  }

  private analyzeOilSystemHealth(vehicleId: string, dataPoints: VehicleTelemetryData[]): PredictiveMaintenanceAlert | null {
    const recentPressures = dataPoints.slice(-50).filter(d => d.oilPressureKpa !== undefined).map(d => d.oilPressureKpa!);
    
    if (recentPressures.length < 10) return null;

    const avgPressure = recentPressures.reduce((a, b) => a + b, 0) / recentPressures.length;
    const trend = this.calculateTrend(recentPressures);

    // Oil pressure declining trend
    if (avgPressure < 300 && trend < -2) {
      const daysUntilFailure = Math.max(1, Math.round((250 - avgPressure) / Math.abs(trend) * 7));

      return {
        vehicleId,
        componentType: 'oil_system',
        predictedFailureDate: new Date(Date.now() + daysUntilFailure * 24 * 60 * 60 * 1000),
        confidence: 0.70,
        currentCondition: Math.max(0, (avgPressure - 150) / (400 - 150) * 100),
        riskLevel: avgPressure < 250 ? 'critical' : 'high',
        symptoms: [
          'Declining oil pressure trend',
          `Current average pressure: ${avgPressure.toFixed(0)} kPa`,
          'Potential oil system wear'
        ],
        recommendedActions: [
          'Check oil level immediately',
          'Inspect oil pump',
          'Check for oil leaks',
          'Schedule oil system service'
        ],
        estimatedCost: 8000, // PHP
        daysUntilFailure
      };
    }

    return null;
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;

    const n = values.length;
    const sumX = (n * (n + 1)) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, y, i) => sum + (i + 1) * y, 0);
    const sumXX = (n * (n + 1) * (2 * n + 1)) / 6;

    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }

  // Broadcasting and notification methods
  private async broadcastAnomalies(anomalies: AnomalyDetectionResult[]): Promise<void> {
    for (const anomaly of anomalies) {
      await auditLogger.logEvent(
        AuditEventType.SYSTEM_ALERT,
        anomaly.severity === 'critical' ? SecurityLevel.HIGH : SecurityLevel.MEDIUM,
        'WARNING',
        {
          action: 'anomaly_detected',
          vehicleId: anomaly.vehicleId,
          anomalyType: anomaly.anomalyType,
          severity: anomaly.severity,
          confidence: anomaly.confidence,
          affectsSafety: anomaly.affectsSafety,
          requiresImmediateAction: anomaly.requiresImmediateAction
        },
        {
          userId: 'system',
          resource: 'anomaly_detection',
          action: 'detect',
          ipAddress: 'internal'
        }
      );
    }
  }

  private async broadcastMaintenanceAlerts(alerts: PredictiveMaintenanceAlert[]): Promise<void> {
    for (const alert of alerts) {
      await auditLogger.logEvent(
        AuditEventType.SYSTEM_ALERT,
        alert.riskLevel === 'critical' ? SecurityLevel.HIGH : SecurityLevel.MEDIUM,
        'WARNING',
        {
          action: 'predictive_maintenance_alert',
          vehicleId: alert.vehicleId,
          componentType: alert.componentType,
          riskLevel: alert.riskLevel,
          daysUntilFailure: alert.daysUntilFailure,
          confidence: alert.confidence
        },
        {
          userId: 'system',
          resource: 'predictive_maintenance',
          action: 'alert',
          ipAddress: 'internal'
        }
      );
    }
  }

  // Helper methods
  private initializeBaselines(): void {
    // Initialize baseline data for anomaly detection
    // In a real implementation, this would load historical baselines
  }

  private storeHistoricalData(data: VehicleTelemetryData): void {
    const vehicleHistory = this.historicalData.get(data.vehicleId) || [];
    vehicleHistory.push(data);
    
    // Keep only last 10000 data points
    if (vehicleHistory.length > 10000) {
      vehicleHistory.shift();
    }
    
    this.historicalData.set(data.vehicleId, vehicleHistory);
  }

  private async updateDataQualityMetrics(data: VehicleTelemetryData): Promise<void> {
    // Calculate data quality metrics
    const qualityScore = this.calculateDataQuality(data);
    
    // Store quality metrics (in real implementation, this would go to database)
    console.log(`Data quality for ${data.vehicleId}: ${qualityScore.toFixed(2)}%`);
  }

  private calculateDataQuality(data: VehicleTelemetryData): number {
    let qualityScore = 100;
    let totalFields = 0;
    let validFields = 0;

    // Check completeness
    const fields = [
      'speedKmh', 'engineRpm', 'engineTemperatureCelsius', 'fuelLevelPercent',
      'batteryVoltage', 'location', 'gpsAccuracyMeters'
    ];

    for (const field of fields) {
      totalFields++;
      if ((data as any)[field] !== undefined && (data as any)[field] !== null) {
        validFields++;
      }
    }

    const completeness = (validFields / totalFields) * 100;
    qualityScore = (qualityScore + completeness) / 2;

    return Math.max(0, qualityScore);
  }

  private startProcessing(): void {
    this.processingInterval = setInterval(() => {
      this.performBatchProcessing();
    }, 60000); // Process every minute

    console.log('Data processing engine started');
  }

  private async performBatchProcessing(): Promise<void> {
    // Process any accumulated data that needs batch processing
    // This could include calculating daily/hourly summaries
    console.log(`Processing ${this.processingQueue.size} vehicles with queued data`);
  }

  // Public getters
  public getPerformanceMetrics(vehicleId: string): VehiclePerformanceMetrics | null {
    return this.performanceMetrics.get(vehicleId) || null;
  }

  public getAllPerformanceMetrics(): Map<string, VehiclePerformanceMetrics> {
    return new Map(this.performanceMetrics);
  }

  public getHistoricalData(vehicleId: string): VehicleTelemetryData[] {
    return this.historicalData.get(vehicleId) || [];
  }
}

export default DataProcessingEngine;