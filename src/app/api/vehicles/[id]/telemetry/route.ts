// /api/vehicles/[id]/telemetry - Real-time Vehicle Telematics API
// OBD diagnostic data streaming, performance metrics, and behavioral analytics

import { NextRequest } from 'next/server';
import { 
  createApiResponse, 
  createApiError,
  createValidationError,
  createNotFoundError,
  parseQueryParams,
  parsePaginationParams,
  checkRateLimit,
  asyncHandler,
  handleOptionsRequest
} from '@/lib/api-utils';
import { withEnhancedAuth } from '@/lib/auth/enhanced-auth';
import { auditLogger, AuditEventType, SecurityLevel } from '@/lib/security/auditLogger';
import { versionedApiRoute, createVersionedResponse } from '@/middleware/apiVersioning';
import { 
  VehicleTelemetryData,
  VehicleDiagnosticEvent,
  TelemetryQuery 
} from '@/types/vehicles';

// Mock service for telemetry data
class VehicleTelemetryService {
  private static telemetryData: VehicleTelemetryData[] = [
    {
      id: 'telem-001',
      vehicleId: 'veh-001',
      deviceId: 'obd-001',
      driverId: 'driver-001',
      location: {
        latitude: 14.5995,
        longitude: 120.9842
      },
      speedKmh: 45.2,
      heading: 180,
      altitudeMeters: 15.5,
      gpsAccuracyMeters: 3.2,
      engineRpm: 1850,
      engineLoadPercent: 35.5,
      throttlePositionPercent: 28.0,
      engineTemperatureCelsius: 89.5,
      coolantTemperatureCelsius: 87.2,
      fuelLevelPercent: 75.8,
      instantaneousFuelConsumptionLph: 2.4,
      fuelTrimPercent: -2.1,
      batteryVoltage: 12.8,
      oilPressureKpa: 350.5,
      intakeAirTemperatureCelsius: 32.1,
      massAirFlowGps: 8.5,
      harshAccelerationCount: 0,
      harshBrakingCount: 0,
      harshCorneringCount: 0,
      idleTimeMinutes: 0,
      ambientTemperatureCelsius: 28.5,
      humidityPercent: 72.0,
      barometricPressureKpa: 101.2,
      activeDtcCodes: [],
      pendingDtcCodes: [],
      dataQualityScore: 0.98,
      dataSource: 'obd',
      recordedAt: new Date('2024-12-01T10:30:00Z'),
      receivedAt: new Date('2024-12-01T10:30:05Z'),
      recordedDate: new Date('2024-12-01')
    }
  ];

  private static diagnosticEvents: VehicleDiagnosticEvent[] = [
    {
      id: 'diag-001',
      vehicleId: 'veh-001',
      deviceId: 'obd-001',
      eventCode: 'P0171',
      eventType: 'dtc',
      severity: 'warning',
      eventDescription: 'System Too Lean (Bank 1)',
      location: {
        latitude: 14.5995,
        longitude: 120.9842
      },
      odometerKm: 15250,
      driverId: 'driver-001',
      diagnosticData: {
        fuelTrim: -15.2,
        oxygenSensorVoltage: 0.1,
        manifoldPressure: 25.5
      },
      recommendedAction: 'Check for vacuum leaks or faulty oxygen sensor',
      affectsSafety: false,
      affectsPerformance: true,
      status: 'active',
      maintenanceRequired: true,
      firstOccurredAt: new Date('2024-12-01T09:45:00Z'),
      lastOccurredAt: new Date('2024-12-01T09:45:00Z'),
      occurrenceCount: 1,
      createdAt: new Date('2024-12-01T09:45:00Z')
    }
  ];

  static getTelemetryData(
    vehicleId: string, 
    query: Partial<TelemetryQuery> = {}
  ): VehicleTelemetryData[] {
    let data = this.telemetryData.filter(t => t.vehicleId === vehicleId);

    // Apply filters
    if (query.startDate) {
      data = data.filter(t => t.recordedAt >= query.startDate!);
    }
    if (query.endDate) {
      data = data.filter(t => t.recordedAt <= query.endDate!);
    }
    if (query.driverId) {
      data = data.filter(t => t.driverId === query.driverId);
    }

    return data.sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime());
  }

  static getLatestTelemetry(vehicleId: string): VehicleTelemetryData | null {
    const data = this.telemetryData
      .filter(t => t.vehicleId === vehicleId)
      .sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime());
    
    return data[0] || null;
  }

  static getDiagnosticEvents(vehicleId: string, filters: any = {}): VehicleDiagnosticEvent[] {
    let events = this.diagnosticEvents.filter(e => e.vehicleId === vehicleId);

    if (filters.status) {
      events = events.filter(e => e.status === filters.status);
    }
    if (filters.severity) {
      events = events.filter(e => e.severity === filters.severity);
    }
    if (filters.eventType) {
      events = events.filter(e => e.eventType === filters.eventType);
    }

    return events.sort((a, b) => b.firstOccurredAt.getTime() - a.firstOccurredAt.getTime());
  }

  static generateMockRealTimeData(vehicleId: string): VehicleTelemetryData {
    const baseData = this.getLatestTelemetry(vehicleId);
    const now = new Date();
    
    return {
      id: `telem-${Date.now()}`,
      vehicleId,
      deviceId: baseData?.deviceId || 'obd-mock',
      driverId: baseData?.driverId,
      location: {
        latitude: 14.5995 + (Math.random() - 0.5) * 0.01,
        longitude: 120.9842 + (Math.random() - 0.5) * 0.01
      },
      speedKmh: Math.max(0, (baseData?.speedKmh || 40) + (Math.random() - 0.5) * 10),
      heading: Math.floor(Math.random() * 360),
      altitudeMeters: 15 + (Math.random() - 0.5) * 10,
      gpsAccuracyMeters: 2 + Math.random() * 3,
      engineRpm: 800 + Math.random() * 3000,
      engineLoadPercent: Math.random() * 80,
      throttlePositionPercent: Math.random() * 60,
      engineTemperatureCelsius: 85 + Math.random() * 10,
      coolantTemperatureCelsius: 82 + Math.random() * 10,
      fuelLevelPercent: Math.max(0, (baseData?.fuelLevelPercent || 75) - Math.random() * 0.1),
      instantaneousFuelConsumptionLph: 1 + Math.random() * 4,
      fuelTrimPercent: -5 + Math.random() * 10,
      batteryVoltage: 12.0 + Math.random() * 1.5,
      oilPressureKpa: 300 + Math.random() * 100,
      intakeAirTemperatureCelsius: 25 + Math.random() * 15,
      massAirFlowGps: 5 + Math.random() * 10,
      harshAccelerationCount: Math.floor(Math.random() * 3),
      harshBrakingCount: Math.floor(Math.random() * 2),
      harshCorneringCount: Math.floor(Math.random() * 2),
      idleTimeMinutes: Math.random() * 30,
      ambientTemperatureCelsius: 25 + Math.random() * 10,
      humidityPercent: 60 + Math.random() * 30,
      barometricPressureKpa: 100 + Math.random() * 3,
      activeDtcCodes: [],
      pendingDtcCodes: [],
      dataQualityScore: 0.95 + Math.random() * 0.05,
      dataSource: 'obd',
      recordedAt: now,
      receivedAt: new Date(now.getTime() + 1000),
      recordedDate: new Date(now.toDateString())
    };
  }

  static getTelemetryStatistics(vehicleId: string, hours = 24) {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    const recentData = this.telemetryData.filter(t => 
      t.vehicleId === vehicleId && t.recordedAt >= cutoffTime
    );

    if (recentData.length === 0) {
      return null;
    }

    const avgSpeed = recentData.reduce((sum, t) => sum + (t.speedKmh || 0), 0) / recentData.length;
    const maxSpeed = Math.max(...recentData.map(t => t.speedKmh || 0));
    const avgFuelConsumption = recentData.reduce((sum, t) => sum + (t.instantaneousFuelConsumptionLph || 0), 0) / recentData.length;
    const avgEngineTemp = recentData.reduce((sum, t) => sum + (t.engineTemperatureCelsius || 0), 0) / recentData.length;
    const totalHarshEvents = recentData.reduce((sum, t) => 
      sum + t.harshAccelerationCount + t.harshBrakingCount + t.harshCorneringCount, 0
    );
    const totalIdleTime = recentData.reduce((sum, t) => sum + t.idleTimeMinutes, 0);
    
    return {
      period: `Last ${hours} hours`,
      dataPoints: recentData.length,
      averageSpeed: Math.round(avgSpeed * 10) / 10,
      maximumSpeed: Math.round(maxSpeed * 10) / 10,
      averageFuelConsumption: Math.round(avgFuelConsumption * 10) / 10,
      averageEngineTemperature: Math.round(avgEngineTemp * 10) / 10,
      totalHarshEvents,
      totalIdleTimeMinutes: Math.round(totalIdleTime),
      dataQuality: Math.round((recentData.reduce((sum, t) => sum + t.dataQualityScore, 0) / recentData.length) * 100)
    };
  }

  static getOBDStatus(vehicleId: string) {
    const latestData = this.getLatestTelemetry(vehicleId);
    if (!latestData) {
      return {
        status: 'disconnected',
        lastConnection: null,
        dataQuality: 0,
        connectionUptime: 0
      };
    }

    const timeSinceLastData = Date.now() - latestData.recordedAt.getTime();
    const isConnected = timeSinceLastData < 5 * 60 * 1000; // 5 minutes

    return {
      status: isConnected ? 'connected' : 'disconnected',
      lastConnection: latestData.recordedAt,
      dataQuality: Math.round(latestData.dataQualityScore * 100),
      timeSinceLastDataMs: timeSinceLastData,
      deviceId: latestData.deviceId,
      signalStrength: 85 + Math.random() * 15 // Mock signal strength
    };
  }

  static getEcoScoreAnalysis(vehicleId: string) {
    const stats = this.getTelemetryStatistics(vehicleId, 24);
    if (!stats) {
      return { score: 0, factors: {}, recommendations: [] };
    }

    // Calculate eco score based on various factors
    let score = 100;
    const factors: Record<string, any> = {};
    const recommendations: string[] = [];

    // Speed efficiency (30% weight)
    const speedEfficiency = Math.max(0, 100 - Math.abs(stats.averageSpeed - 50) * 2); // Optimal around 50 km/h
    factors.speedEfficiency = Math.round(speedEfficiency);
    score -= (100 - speedEfficiency) * 0.3;

    if (stats.averageSpeed > 80) {
      recommendations.push('Reduce average speed to improve fuel efficiency');
    }

    // Fuel consumption (25% weight)
    const targetConsumption = 15; // km/l
    const actualEfficiency = 100 / (stats.averageFuelConsumption || 5); // Convert to km/l
    const fuelScore = Math.min(100, (actualEfficiency / targetConsumption) * 100);
    factors.fuelEfficiency = Math.round(fuelScore);
    score -= (100 - fuelScore) * 0.25;

    if (fuelScore < 70) {
      recommendations.push('Schedule engine tune-up to improve fuel efficiency');
    }

    // Driving behavior (25% weight)
    const harshEventsPerHour = stats.totalHarshEvents / 24;
    const behaviorScore = Math.max(0, 100 - harshEventsPerHour * 20);
    factors.drivingBehavior = Math.round(behaviorScore);
    score -= (100 - behaviorScore) * 0.25;

    if (harshEventsPerHour > 2) {
      recommendations.push('Train driver on smooth acceleration and braking techniques');
    }

    // Idle time (20% weight)
    const idlePercentage = (stats.totalIdleTimeMinutes / (24 * 60)) * 100;
    const idleScore = Math.max(0, 100 - idlePercentage * 5);
    factors.idleTimeManagement = Math.round(idleScore);
    score -= (100 - idleScore) * 0.2;

    if (idlePercentage > 15) {
      recommendations.push('Minimize idle time by turning off engine during long stops');
    }

    return {
      score: Math.max(0, Math.round(score)),
      factors,
      recommendations,
      period: stats.period,
      calculatedAt: new Date()
    };
  }
}

// GET /api/vehicles/[id]/telemetry - Get telemetry data for vehicle
const getTelemetryV1 = withEnhancedAuth({
  requiredPermissions: ['view_vehicle_telemetry'],
  dataClass: 'internal'
})(async (request: NextRequest, user, { params }: { params: { id: string } }) => {
  const vehicleId = params.id;
  const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
  
  // Rate limiting for telemetry endpoints (100 requests per minute per vehicle)
  const rateLimitKey = `telemetry-${vehicleId}-${user.id}-${clientIP}`;
  const rateLimit = checkRateLimit(rateLimitKey, 100, 60 * 1000); // 100 requests per minute per vehicle
  
  if (!rateLimit.allowed) {
    return createApiError(
      'Rate limit exceeded for telemetry data',
      'RATE_LIMIT_EXCEEDED',
      429,
      { resetTime: rateLimit.resetTime },
      `/api/vehicles/${vehicleId}/telemetry`,
      'GET'
    );
  }

  if (!vehicleId) {
    return createApiError(
      'Vehicle ID is required',
      'MISSING_VEHICLE_ID',
      400,
      undefined,
      `/api/vehicles/${vehicleId}/telemetry`,
      'GET'
    );
  }

  const queryParams = parseQueryParams(request);
  const paginationParams = parsePaginationParams(request);

  // Parse telemetry query parameters
  const telemetryQuery: Partial<TelemetryQuery> = {
    vehicleId,
    startDate: queryParams.startDate ? new Date(queryParams.startDate as string) : 
               new Date(Date.now() - 24 * 60 * 60 * 1000), // Default to last 24 hours
    endDate: queryParams.endDate ? new Date(queryParams.endDate as string) : new Date(),
    driverId: queryParams.driverId as string,
    dataTypes: queryParams.dataTypes as string[],
    includeLocation: queryParams.includeLocation !== false,
    includeDiagnostics: queryParams.includeDiagnostics !== false
  };

  // Get telemetry data
  const telemetryData = VehicleTelemetryService.getTelemetryData(vehicleId, telemetryQuery);
  
  // Apply pagination
  const paginatedData = telemetryData.slice(
    (paginationParams.page - 1) * paginationParams.limit,
    paginationParams.page * paginationParams.limit
  );

  // Get additional data if requested
  const statistics = queryParams.includeStats ? 
    VehicleTelemetryService.getTelemetryStatistics(vehicleId) : null;
    
  const obdStatus = queryParams.includeOBDStatus ? 
    VehicleTelemetryService.getOBDStatus(vehicleId) : null;

  const diagnostics = telemetryQuery.includeDiagnostics ? 
    VehicleTelemetryService.getDiagnosticEvents(vehicleId, { status: 'active' }) : null;

  const response: any = {
    telemetry: paginatedData,
    pagination: {
      page: paginationParams.page,
      limit: paginationParams.limit,
      total: telemetryData.length,
      pages: Math.ceil(telemetryData.length / paginationParams.limit)
    },
    query: telemetryQuery
  };

  if (statistics) response.statistics = statistics;
  if (obdStatus) response.obdStatus = obdStatus;
  if (diagnostics) response.activeDiagnostics = diagnostics;

  return createVersionedResponse(response, 'v1');
});

// GET /api/vehicles/[id]/telemetry/live - Get real-time telemetry data
const getLiveTelemetryV1 = withEnhancedAuth({
  requiredPermissions: ['view_vehicle_telemetry', 'view_live_data'],
  dataClass: 'restricted' // Live data is more sensitive
})(async (request: NextRequest, user, { params }: { params: { id: string } }) => {
  const vehicleId = params.id;
  const clientIP = request.headers.get('x-forwarded-for') || 'unknown';

  if (!vehicleId) {
    return createApiError(
      'Vehicle ID is required',
      'MISSING_VEHICLE_ID',
      400,
      undefined,
      `/api/vehicles/${vehicleId}/telemetry/live`,
      'GET'
    );
  }

  // Rate limiting for live telemetry (more restrictive: 60 requests per minute per vehicle)
  const rateLimitKey = `telemetry-live-${vehicleId}-${user.id}-${clientIP}`;
  const rateLimit = checkRateLimit(rateLimitKey, 60, 60 * 1000); // 60 requests per minute per vehicle
  
  if (!rateLimit.allowed) {
    return createApiError(
      'Rate limit exceeded for live telemetry data',
      'RATE_LIMIT_EXCEEDED',
      429,
      { resetTime: rateLimit.resetTime },
      `/api/vehicles/${vehicleId}/telemetry/live`,
      'GET'
    );
  }

  // Generate mock real-time data (in production, this would stream from OBD devices)
  const liveData = VehicleTelemetryService.generateMockRealTimeData(vehicleId);
  const obdStatus = VehicleTelemetryService.getOBDStatus(vehicleId);
  const activeDiagnostics = VehicleTelemetryService.getDiagnosticEvents(vehicleId, { 
    status: 'active',
    severity: ['warning', 'error', 'critical']
  });

  // Audit live telemetry access (more sensitive)
  await auditLogger.logEvent(
    AuditEventType.DATA_ACCESS,
    SecurityLevel.MEDIUM,
    'SUCCESS',
    { 
      resource: 'live_telemetry',
      vehicleId,
      dataSource: liveData.dataSource,
      action: 'view_live_data'
    },
    { 
      userId: user.id,
      resource: 'telemetry',
      action: 'view_live',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
    }
  );

  return createVersionedResponse({
    liveData,
    obdStatus,
    activeDiagnostics,
    timestamp: new Date(),
    dataAge: Date.now() - liveData.recordedAt.getTime()
  }, 'v1');
});

// GET /api/vehicles/[id]/telemetry/diagnostics - Get diagnostic events
const getDiagnosticsV1 = withEnhancedAuth({
  requiredPermissions: ['view_vehicle_diagnostics'],
  dataClass: 'internal'
})(async (request: NextRequest, user, { params }: { params: { id: string } }) => {
  const vehicleId = params.id;
  const queryParams = parseQueryParams(request);

  if (!vehicleId) {
    return createApiError(
      'Vehicle ID is required',
      'MISSING_VEHICLE_ID',
      400,
      undefined,
      `/api/vehicles/${vehicleId}/telemetry/diagnostics`,
      'GET'
    );
  }

  const diagnostics = VehicleTelemetryService.getDiagnosticEvents(vehicleId, queryParams);

  const summary = {
    totalEvents: diagnostics.length,
    activeEvents: diagnostics.filter(d => d.status === 'active').length,
    criticalEvents: diagnostics.filter(d => d.severity === 'critical').length,
    maintenanceRequired: diagnostics.filter(d => d.maintenanceRequired).length,
    safetyRelated: diagnostics.filter(d => d.affectsSafety).length
  };

  return createVersionedResponse({
    diagnostics,
    summary
  }, 'v1');
});

// GET /api/vehicles/[id]/telemetry/eco-score - Get eco-driving performance analysis
const getEcoScoreV1 = withEnhancedAuth({
  requiredPermissions: ['view_vehicle_analytics'],
  dataClass: 'internal'
})(async (request: NextRequest, user, { params }: { params: { id: string } }) => {
  const vehicleId = params.id;

  if (!vehicleId) {
    return createApiError(
      'Vehicle ID is required',
      'MISSING_VEHICLE_ID',
      400,
      undefined,
      `/api/vehicles/${vehicleId}/telemetry/eco-score`,
      'GET'
    );
  }

  const ecoAnalysis = VehicleTelemetryService.getEcoScoreAnalysis(vehicleId);
  const telemetryStats = VehicleTelemetryService.getTelemetryStatistics(vehicleId, 24);

  return createVersionedResponse({
    ecoScore: ecoAnalysis,
    telemetryStats,
    benchmarks: {
      industryAverage: 72,
      fleetAverage: 68,
      topPerformer: 89
    }
  }, 'v1');
});

export const GET = versionedApiRoute({
  v1: async (request: NextRequest, context) => {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    
    if (pathSegments.includes('live')) {
      return getLiveTelemetryV1(request, context);
    } else if (pathSegments.includes('diagnostics')) {
      return getDiagnosticsV1(request, context);
    } else if (pathSegments.includes('eco-score')) {
      return getEcoScoreV1(request, context);
    }
    
    return getTelemetryV1(request, context);
  }
});

// OPTIONS handler for CORS
export const OPTIONS = handleOptionsRequest;