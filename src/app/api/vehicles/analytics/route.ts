// /api/vehicles/analytics - Vehicle Analytics and Performance API
// Fleet-wide performance metrics, utilization analysis, and business intelligence

import { NextRequest } from 'next/server';
import { 
  createApiResponse, 
  createApiError,
  createValidationError,
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
  PerformanceAnalyticsQuery,
  VehicleReportRequest 
} from '@/types/vehicles';

// Mock analytics service
class VehicleAnalyticsService {
  private static fleetData = {
    totalVehicles: 150,
    activeVehicles: 142,
    regions: ['region-manila', 'region-cebu', 'region-davao'],
    ownershipTypes: ['xpress_owned', 'fleet_owned', 'operator_owned', 'driver_owned']
  };

  static getFleetOverview(regionId?: string) {
    const baseMetrics = {
      totalVehicles: regionId ? 50 : 150,
      activeVehicles: regionId ? 47 : 142,
      vehiclesInService: regionId ? 35 : 105,
      vehiclesInMaintenance: regionId ? 3 : 12,
      vehiclesInactive: regionId ? 5 : 20,
      
      // Performance metrics (last 30 days)
      averageUtilization: 74.2,
      averageFuelEfficiency: 15.8,
      totalTrips: regionId ? 15420 : 46260,
      totalDistance: regionId ? 245600 : 736800,
      totalRevenue: regionId ? 3854000 : 11562000,
      
      // Maintenance metrics
      scheduledMaintenance: regionId ? 8 : 24,
      overdueMaintenance: regionId ? 2 : 7,
      averageMaintenanceCost: regionId ? 8500 : 25500,
      
      // Compliance metrics
      compliantVehicles: regionId ? 45 : 135,
      vehiclesWithWarnings: regionId ? 4 : 12,
      nonCompliantVehicles: regionId ? 1 : 3,
      
      // Environmental metrics
      totalCarbonEmissions: regionId ? 18500 : 55500,
      averageEcoScore: 72.5,
      electricVehicles: regionId ? 2 : 8,
      
      calculatedAt: new Date()
    };

    return baseMetrics;
  }

  static getOwnershipAnalysis(regionId?: string) {
    const ownershipData = [
      {
        type: 'xpress_owned',
        count: regionId ? 15 : 45,
        percentage: 30,
        avgUtilization: 82.5,
        avgRevenue: 89500,
        avgMaintenanceCost: 7200,
        profitMargin: 24.5
      },
      {
        type: 'fleet_owned',
        count: regionId ? 20 : 60,
        percentage: 40,
        avgUtilization: 78.2,
        avgRevenue: 76500,
        avgMaintenanceCost: 5800,
        profitMargin: 18.3
      },
      {
        type: 'operator_owned',
        count: regionId ? 12 : 36,
        percentage: 24,
        avgUtilization: 69.8,
        avgRevenue: 65200,
        avgMaintenanceCost: 4500,
        profitMargin: 15.2
      },
      {
        type: 'driver_owned',
        count: regionId ? 3 : 9,
        percentage: 6,
        avgUtilization: 55.1,
        avgRevenue: 48900,
        avgMaintenanceCost: 3200,
        profitMargin: 12.8
      }
    ];

    return {
      breakdown: ownershipData,
      insights: {
        mostProfitable: 'xpress_owned',
        highestUtilization: 'xpress_owned',
        lowestMaintenanceCost: 'driver_owned',
        recommendations: [
          'Consider expanding Xpress-owned fleet for higher profitability',
          'Provide maintenance support programs for driver-owned vehicles',
          'Optimize fleet-owned vehicle deployment for better utilization'
        ]
      }
    };
  }

  static getPerformanceTrends(dateRange: { start: Date; end: Date }, regionId?: string) {
    const days = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
    const trends = [];

    for (let i = 0; i < Math.min(days, 30); i++) {
      const date = new Date(dateRange.start.getTime() + i * 24 * 60 * 60 * 1000);
      trends.push({
        date,
        activeVehicles: 140 + Math.floor(Math.random() * 10) - 5,
        totalTrips: 1500 + Math.floor(Math.random() * 200) - 100,
        avgUtilization: 70 + Math.random() * 20,
        totalRevenue: 380000 + Math.floor(Math.random() * 40000) - 20000,
        fuelEfficiency: 15 + Math.random() * 3,
        ecoScore: 70 + Math.random() * 15,
        maintenanceEvents: Math.floor(Math.random() * 5),
        complianceScore: 90 + Math.random() * 10
      });
    }

    return {
      period: { start: dateRange.start, end: dateRange.end },
      dataPoints: trends,
      summary: {
        avgDailyTrips: trends.reduce((sum, t) => sum + t.totalTrips, 0) / trends.length,
        avgUtilization: trends.reduce((sum, t) => sum + t.avgUtilization, 0) / trends.length,
        totalRevenue: trends.reduce((sum, t) => sum + t.totalRevenue, 0),
        avgFuelEfficiency: trends.reduce((sum, t) => sum + t.fuelEfficiency, 0) / trends.length,
        utilizationTrend: this.calculateTrend(trends.map(t => t.avgUtilization)),
        revenueTrend: this.calculateTrend(trends.map(t => t.totalRevenue))
      }
    };
  }

  static getTopPerformers(metric: string = 'utilization', limit: number = 10, regionId?: string) {
    const mockVehicles = [];
    
    for (let i = 1; i <= limit; i++) {
      mockVehicles.push({
        vehicleId: `veh-${String(i).padStart(3, '0')}`,
        vehicleCode: `XOT-${String(i).padStart(3, '0')}`,
        licensePlate: `ABC${String(i).padStart(3, '0')}`,
        make: ['Toyota', 'Honda', 'Suzuki'][i % 3],
        model: ['Vios', 'City', 'Ertiga'][i % 3],
        ownershipType: ['xpress_owned', 'fleet_owned', 'operator_owned'][i % 3],
        regionId: regionId || ['region-manila', 'region-cebu'][i % 2],
        
        // Performance metrics (last 30 days)
        utilization: 95 - i * 2 + Math.random() * 5,
        totalTrips: 180 - i * 3 + Math.floor(Math.random() * 20),
        revenue: 92000 - i * 1500 + Math.floor(Math.random() * 5000),
        fuelEfficiency: 18 - i * 0.2 + Math.random(),
        ecoScore: 88 - i + Math.random() * 3,
        customerRating: 4.9 - i * 0.05 + Math.random() * 0.1,
        reliabilityScore: 96 - i + Math.random() * 2,
        
        driverInfo: {
          driverId: `driver-${String(i).padStart(3, '0')}`,
          driverName: `Driver ${i}`,
          rating: 4.8 - i * 0.03 + Math.random() * 0.1
        }
      });
    }

    // Sort by the requested metric
    const sortKey = metric === 'revenue' ? 'revenue' : 
                   metric === 'efficiency' ? 'fuelEfficiency' : 
                   metric === 'trips' ? 'totalTrips' : 'utilization';
    
    mockVehicles.sort((a, b) => (b as any)[sortKey] - (a as any)[sortKey]);

    return {
      metric,
      period: 'Last 30 days',
      topPerformers: mockVehicles,
      benchmarks: {
        fleetAverage: mockVehicles.reduce((sum, v) => sum + (v as any)[sortKey], 0) / mockVehicles.length,
        industryAverage: mockVehicles[Math.floor(mockVehicles.length * 0.7)][sortKey as keyof typeof mockVehicles[0]],
        topPercentile: mockVehicles[0][sortKey as keyof typeof mockVehicles[0]]
      }
    };
  }

  static getUtilizationAnalysis(regionId?: string) {
    const hourlyUtilization = [];
    for (let hour = 0; hour < 24; hour++) {
      const baseUtilization = hour >= 6 && hour <= 22 ? 70 : 20; // Higher during day
      const peakBoost = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19) ? 20 : 0;
      hourlyUtilization.push({
        hour,
        utilization: baseUtilization + peakBoost + Math.random() * 10
      });
    }

    const dayOfWeekUtilization = [
      { day: 'Monday', utilization: 72.5 },
      { day: 'Tuesday', utilization: 74.1 },
      { day: 'Wednesday', utilization: 76.8 },
      { day: 'Thursday', utilization: 78.2 },
      { day: 'Friday', utilization: 82.3 },
      { day: 'Saturday', utilization: 85.7 },
      { day: 'Sunday', utilization: 68.9 }
    ];

    const geographicUtilization = regionId ? [{
      region: regionId,
      utilization: 75.2,
      activeVehicles: 47,
      avgTripsPerVehicle: 12.5
    }] : [
      { region: 'region-manila', utilization: 78.5, activeVehicles: 85, avgTripsPerVehicle: 14.2 },
      { region: 'region-cebu', utilization: 72.1, activeVehicles: 35, avgTripsPerVehicle: 11.8 },
      { region: 'region-davao', utilization: 69.8, activeVehicles: 22, avgTripsPerVehicle: 10.5 }
    ];

    return {
      hourlyPattern: hourlyUtilization,
      dayOfWeekPattern: dayOfWeekUtilization,
      geographicDistribution: geographicUtilization,
      insights: {
        peakHours: ['08:00-09:00', '18:00-19:00'],
        bestDay: 'Saturday',
        highestUtilizationRegion: 'region-manila',
        recommendations: [
          'Deploy more vehicles during peak hours (8-9 AM, 6-7 PM)',
          'Consider dynamic pricing during low utilization periods',
          'Optimize weekend deployment strategies'
        ]
      }
    };
  }

  static getCostAnalysis(dateRange: { start: Date; end: Date }, regionId?: string) {
    const costCategories = [
      {
        category: 'Fuel',
        amount: regionId ? 285000 : 855000,
        percentage: 45.2,
        trend: '+2.3%',
        perVehicle: regionId ? 5700 : 5700,
        costPerKm: 3.85
      },
      {
        category: 'Maintenance',
        amount: regionId ? 142500 : 427500,
        percentage: 22.6,
        trend: '+1.1%',
        perVehicle: regionId ? 2850 : 2850,
        costPerKm: 1.92
      },
      {
        category: 'Insurance',
        amount: regionId ? 95000 : 285000,
        percentage: 15.1,
        trend: '+0.5%',
        perVehicle: regionId ? 1900 : 1900,
        costPerKm: 1.28
      },
      {
        category: 'Registration & Compliance',
        amount: regionId ? 47500 : 142500,
        percentage: 7.5,
        trend: '+3.2%',
        perVehicle: regionId ? 950 : 950,
        costPerKm: 0.64
      },
      {
        category: 'Driver Payments',
        amount: regionId ? 380000 : 1140000,
        percentage: 60.2,
        trend: '+1.8%',
        perVehicle: regionId ? 7600 : 7600,
        costPerKm: 5.12
      }
    ];

    const totalCosts = costCategories.reduce((sum, cat) => sum + cat.amount, 0);
    const totalRevenue = regionId ? 1250000 : 3750000;
    const profitMargin = ((totalRevenue - totalCosts) / totalRevenue) * 100;

    return {
      period: dateRange,
      totalCosts,
      totalRevenue,
      profitMargin: Math.round(profitMargin * 10) / 10,
      costCategories,
      costPerKm: costCategories.reduce((sum, cat) => sum + cat.costPerKm, 0),
      revenuePerKm: regionId ? 5.08 : 5.08,
      profitPerKm: regionId ? 1.23 : 1.23,
      insights: {
        highestCostCategory: 'Driver Payments',
        costOptimizationOpportunities: [
          'Implement fuel-efficient driving training programs',
          'Negotiate better bulk insurance rates',
          'Optimize maintenance scheduling to reduce costs'
        ],
        benchmarkComparison: {
          industryAverage: {
            costPerKm: 4.75,
            profitMargin: 18.5
          },
          performance: 'Above Average'
        }
      }
    };
  }

  static getEnvironmentalMetrics(dateRange: { start: Date; end: Date }, regionId?: string) {
    const baseEmissions = regionId ? 18500 : 55500;
    const baseDistance = regionId ? 245600 : 736800;
    
    return {
      period: dateRange,
      totalEmissions: {
        co2Kg: baseEmissions,
        co2PerKm: Math.round((baseEmissions / baseDistance) * 1000) / 1000,
        co2PerTrip: Math.round((baseEmissions / (regionId ? 15420 : 46260)) * 100) / 100
      },
      emissionSources: [
        { source: 'Fuel Combustion', percentage: 85.2, amount: Math.round(baseEmissions * 0.852) },
        { source: 'Maintenance Activities', percentage: 8.7, amount: Math.round(baseEmissions * 0.087) },
        { source: 'Vehicle Manufacturing (Allocated)', percentage: 6.1, amount: Math.round(baseEmissions * 0.061) }
      ],
      fleetComposition: {
        gasoline: { count: regionId ? 42 : 126, percentage: 84 },
        diesel: { count: regionId ? 5 : 15, percentage: 10 },
        hybrid: { count: regionId ? 2 : 6, percentage: 4 },
        electric: { count: regionId ? 1 : 3, percentage: 2 }
      },
      ecoScoreDistribution: [
        { range: '90-100', count: regionId ? 8 : 24, percentage: 16 },
        { range: '80-89', count: regionId ? 18 : 54, percentage: 36 },
        { range: '70-79', count: regionId ? 15 : 45, percentage: 30 },
        { range: '60-69', count: regionId ? 7 : 21, percentage: 14 },
        { range: '0-59', count: regionId ? 2 : 6, percentage: 4 }
      ],
      carbonOffset: {
        purchasedOffsets: Math.round(baseEmissions * 0.15),
        offsetCost: Math.round(baseEmissions * 0.15 * 12.5),
        netEmissions: Math.round(baseEmissions * 0.85)
      },
      recommendations: [
        'Increase hybrid/electric vehicle adoption to reduce emissions',
        'Implement eco-driving training programs',
        'Consider carbon offset programs for fleet neutrality',
        'Optimize route planning to reduce unnecessary mileage'
      ]
    };
  }

  static generateCustomReport(request: VehicleReportRequest) {
    const { reportType, dateRange, vehicleIds, format } = request;
    
    const reportData: any = {
      reportId: `rpt-${Date.now()}`,
      reportType,
      dateRange,
      generatedAt: new Date(),
      format: format || 'json'
    };

    switch (reportType) {
      case 'performance':
        reportData.data = {
          overview: this.getFleetOverview(),
          trends: this.getPerformanceTrends(dateRange),
          topPerformers: this.getTopPerformers('utilization', 10)
        };
        break;
      
      case 'utilization':
        reportData.data = this.getUtilizationAnalysis();
        break;
      
      case 'maintenance':
        reportData.data = {
          totalMaintenanceEvents: 156,
          totalMaintenanceCost: 425000,
          averageCostPerVehicle: 2833,
          mostCommonIssues: ['Oil Change', 'Tire Replacement', 'Brake Service'],
          costTrends: this.generateMaintenanceTrends(dateRange)
        };
        break;
      
      case 'carbon_footprint':
        reportData.data = this.getEnvironmentalMetrics(dateRange);
        break;
      
      default:
        reportData.data = this.getFleetOverview();
    }

    return reportData;
  }

  private static generateMaintenanceTrends(dateRange: { start: Date; end: Date }) {
    const trends = [];
    const days = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
    
    for (let i = 0; i < Math.min(days, 30); i++) {
      const date = new Date(dateRange.start.getTime() + i * 24 * 60 * 60 * 1000);
      trends.push({
        date,
        maintenanceEvents: Math.floor(Math.random() * 8) + 2,
        totalCost: Math.floor(Math.random() * 15000) + 5000,
        emergencyRepairs: Math.floor(Math.random() * 3),
        scheduledMaintenance: Math.floor(Math.random() * 6) + 1
      });
    }
    
    return trends;
  }

  private static calculateTrend(values: number[]): string {
    if (values.length < 2) return '0%';
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    const change = ((secondAvg - firstAvg) / firstAvg) * 100;
    return `${change > 0 ? '+' : ''}${Math.round(change * 10) / 10}%`;
  }
}

// GET /api/vehicles/analytics - Fleet analytics overview
const getAnalyticsV1 = withEnhancedAuth({
  requiredPermissions: ['view_vehicle_analytics'],
  dataClass: 'internal'
})(async (request: NextRequest, user) => {
  const queryParams = parseQueryParams(request);
  
  // Apply regional filtering
  const userRegions = user.allowedRegions || [];
  let regionFilter = queryParams.region as string;
  
  if (userRegions.length > 0 && userRegions[0] !== '*') {
    if (!regionFilter || !userRegions.includes(regionFilter)) {
      regionFilter = userRegions[0];
    }
  }

  const analyticsType = queryParams.type as string || 'overview';
  
  let analyticsData: any;
  
  switch (analyticsType) {
    case 'overview':
      analyticsData = {
        fleetOverview: VehicleAnalyticsService.getFleetOverview(regionFilter),
        ownershipAnalysis: VehicleAnalyticsService.getOwnershipAnalysis(regionFilter),
        topPerformers: VehicleAnalyticsService.getTopPerformers('utilization', 5, regionFilter)
      };
      break;
    
    case 'performance':
      const dateRange = {
        start: queryParams.startDate ? new Date(queryParams.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: queryParams.endDate ? new Date(queryParams.endDate as string) : new Date()
      };
      analyticsData = VehicleAnalyticsService.getPerformanceTrends(dateRange, regionFilter);
      break;
    
    case 'utilization':
      analyticsData = VehicleAnalyticsService.getUtilizationAnalysis(regionFilter);
      break;
    
    case 'cost':
      const costDateRange = {
        start: queryParams.startDate ? new Date(queryParams.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: queryParams.endDate ? new Date(queryParams.endDate as string) : new Date()
      };
      analyticsData = VehicleAnalyticsService.getCostAnalysis(costDateRange, regionFilter);
      break;
    
    case 'environmental':
      const envDateRange = {
        start: queryParams.startDate ? new Date(queryParams.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: queryParams.endDate ? new Date(queryParams.endDate as string) : new Date()
      };
      analyticsData = VehicleAnalyticsService.getEnvironmentalMetrics(envDateRange, regionFilter);
      break;
    
    default:
      return createApiError(
        `Unknown analytics type: ${analyticsType}`,
        'INVALID_ANALYTICS_TYPE',
        400,
        { supportedTypes: ['overview', 'performance', 'utilization', 'cost', 'environmental'] },
        '/api/vehicles/analytics',
        'GET'
      );
  }

  return createVersionedResponse({
    analyticsType,
    region: regionFilter,
    data: analyticsData,
    metadata: {
      generatedAt: new Date(),
      dataFreshness: '< 5 minutes',
      coverage: regionFilter ? 'Regional' : 'Fleet-wide'
    }
  }, 'v1');
});

// POST /api/vehicles/analytics/report - Generate custom analytics report
const postAnalyticsReportV1 = withEnhancedAuth({
  requiredPermissions: ['view_vehicle_analytics', 'generate_reports'],
  dataClass: 'internal'
})(async (request: NextRequest, user) => {
  let body: VehicleReportRequest;
  
  try {
    body = await request.json() as VehicleReportRequest;
  } catch (error) {
    return createApiError(
      'Invalid JSON in request body',
      'INVALID_JSON',
      400,
      undefined,
      '/api/vehicles/analytics/report',
      'POST'
    );
  }

  // Validate required fields
  const requiredFields = ['reportType', 'dateRange'];
  const validationErrors = validateRequiredFields(body, requiredFields);

  if (!['performance', 'maintenance', 'compliance', 'utilization', 'carbon_footprint'].includes(body.reportType)) {
    validationErrors.push({
      field: 'reportType',
      message: 'Report type must be one of: performance, maintenance, compliance, utilization, carbon_footprint',
      code: 'INVALID_REPORT_TYPE'
    });
  }

  if (validationErrors.length > 0) {
    return createValidationError(validationErrors, '/api/vehicles/analytics/report', 'POST');
  }

  // Validate date range
  if (!body.dateRange.start || !body.dateRange.end) {
    return createApiError(
      'Date range must include start and end dates',
      'INVALID_DATE_RANGE',
      400,
      undefined,
      '/api/vehicles/analytics/report',
      'POST'
    );
  }

  const startDate = new Date(body.dateRange.start);
  const endDate = new Date(body.dateRange.end);
  
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return createApiError(
      'Invalid date format in date range',
      'INVALID_DATE_FORMAT',
      400,
      undefined,
      '/api/vehicles/analytics/report',
      'POST'
    );
  }

  if (startDate >= endDate) {
    return createApiError(
      'Start date must be before end date',
      'INVALID_DATE_RANGE',
      400,
      undefined,
      '/api/vehicles/analytics/report',
      'POST'
    );
  }

  // Generate the report
  const report = VehicleAnalyticsService.generateCustomReport({
    ...body,
    dateRange: { start: startDate, end: endDate }
  });

  // Audit report generation
  await auditLogger.logEvent(
    AuditEventType.REPORT_GENERATION,
    SecurityLevel.LOW,
    'SUCCESS',
    { 
      reportType: body.reportType,
      dateRange: { start: startDate, end: endDate },
      vehicleIds: body.vehicleIds,
      format: body.format || 'json'
    },
    { 
      userId: user.id,
      resource: 'analytics',
      action: 'generate_report',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
    }
  );

  return createVersionedResponse({ report }, 'v1');
});

// GET /api/vehicles/analytics/top-performers - Get top performing vehicles
const getTopPerformersV1 = withEnhancedAuth({
  requiredPermissions: ['view_vehicle_analytics'],
  dataClass: 'internal'
})(async (request: NextRequest, user) => {
  const queryParams = parseQueryParams(request);
  
  const metric = queryParams.metric as string || 'utilization';
  const limit = Math.min(50, Math.max(1, Number(queryParams.limit) || 10));
  
  // Apply regional filtering
  const userRegions = user.allowedRegions || [];
  let regionFilter = queryParams.region as string;
  
  if (userRegions.length > 0 && userRegions[0] !== '*') {
    if (!regionFilter || !userRegions.includes(regionFilter)) {
      regionFilter = userRegions[0];
    }
  }

  if (!['utilization', 'revenue', 'efficiency', 'trips', 'rating'].includes(metric)) {
    return createApiError(
      `Invalid metric: ${metric}`,
      'INVALID_METRIC',
      400,
      { supportedMetrics: ['utilization', 'revenue', 'efficiency', 'trips', 'rating'] },
      '/api/vehicles/analytics/top-performers',
      'GET'
    );
  }

  const topPerformers = VehicleAnalyticsService.getTopPerformers(metric, limit, regionFilter);

  return createVersionedResponse(topPerformers, 'v1');
});

export const GET = versionedApiRoute({
  v1: async (request: NextRequest) => {
    const url = new URL(request.url);
    if (url.pathname.endsWith('/top-performers')) {
      return getTopPerformersV1(request);
    }
    return getAnalyticsV1(request);
  }
});

export const POST = versionedApiRoute({
  v1: postAnalyticsReportV1
});

// OPTIONS handler for CORS
export const OPTIONS = handleOptionsRequest;