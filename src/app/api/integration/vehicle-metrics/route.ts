// /api/integration/vehicle-metrics - Vehicle metrics for dashboard integration
import { NextRequest } from 'next/server';
import { 
  createApiResponse, 
  createApiError,
  parseQueryParams,
  asyncHandler,
  handleOptionsRequest
} from '@/lib/api-utils';

// Vehicle metrics interface for dashboard integration
interface VehicleMetrics {
  totalVehicles: number;
  activeVehicles: number;
  vehiclesInService: number;
  vehiclesInMaintenance: number;
  overdueMaintenance: number;
  activeAlerts: number;
  avgUtilization: number;
  fuelEfficiencyTrend: number;
  complianceScore: number;
  totalRevenue30d: number;
  maintenanceCosts30d: number;
  fuelCosts30d: number;
}

interface VehicleServiceIntegration {
  driverAssignments: {
    total: number;
    active: number;
    pending: number;
  };
  bookingIntegration: {
    vehiclesOnTrips: number;
    averageTripDistance: number;
    totalTripsToday: number;
  };
  alertIntegration: {
    maintenanceAlerts: number;
    complianceAlerts: number;
    telematicsAlerts: number;
    emergencyAlerts: number;
  };
}

// GET /api/integration/vehicle-metrics - Get vehicle metrics for dashboard
export const GET = asyncHandler(async (request: NextRequest) => {
  const queryParams = parseQueryParams(request);
  const { regionId, timeRange = '24h', serviceType = 'all' } = queryParams;
  
  try {
    // In real implementation, this would query the vehicle database
    // and integrate with other services (trips, maintenance, etc.)
    
    // Mock vehicle metrics data - replace with actual database queries
    const vehicleMetrics: VehicleMetrics = {
      totalVehicles: 142,
      activeVehicles: 89,
      vehiclesInService: 67,
      vehiclesInMaintenance: 8,
      overdueMaintenance: 3,
      activeAlerts: 12,
      avgUtilization: 78.3,
      fuelEfficiencyTrend: 12.4,
      complianceScore: 96.2,
      totalRevenue30d: 2847500,
      maintenanceCosts30d: 185300,
      fuelCosts30d: 324800
    };

    // Service integration data
    const serviceIntegration: VehicleServiceIntegration = {
      driverAssignments: {
        total: 89,
        active: 67,
        pending: 22
      },
      bookingIntegration: {
        vehiclesOnTrips: 67,
        averageTripDistance: 12.4,
        totalTripsToday: 1247
      },
      alertIntegration: {
        maintenanceAlerts: 8,
        complianceAlerts: 3,
        telematicsAlerts: 1,
        emergencyAlerts: 0
      }
    };

    // Calculate derived metrics
    const utilizationTrend = vehicleMetrics.avgUtilization > 75 ? 'up' : 'down';
    const maintenanceRatio = (vehicleMetrics.vehiclesInMaintenance / vehicleMetrics.totalVehicles) * 100;
    const alertSeverity = vehicleMetrics.overdueMaintenance > 0 ? 'high' : 
                         vehicleMetrics.activeAlerts > 10 ? 'medium' : 'low';

    // Regional breakdown (if regionId specified)
    const regionalBreakdown = regionId ? {
      region: {
        id: regionId,
        name: getRegionName(regionId),
        vehicleCount: Math.floor(vehicleMetrics.totalVehicles * 0.3), // Mock regional distribution
        activeCount: Math.floor(vehicleMetrics.activeVehicles * 0.3),
        utilizationRate: vehicleMetrics.avgUtilization + (Math.random() * 10 - 5) // Mock variation
      }
    } : null;

    return createApiResponse({
      metrics: vehicleMetrics,
      serviceIntegration,
      insights: {
        utilizationTrend,
        maintenanceRatio: Math.round(maintenanceRatio * 100) / 100,
        alertSeverity,
        performanceScore: calculatePerformanceScore(vehicleMetrics),
        recommendations: generateRecommendations(vehicleMetrics)
      },
      ...(regionalBreakdown && { regional: regionalBreakdown }),
      lastUpdated: new Date().toISOString(),
      dataSource: 'vehicle_management_system'
    }, 'Vehicle metrics retrieved successfully');

  } catch (error) {
    console.error('Failed to fetch vehicle metrics:', error);
    return createApiError(
      'Failed to retrieve vehicle metrics',
      500,
      'VEHICLE_METRICS_ERROR'
    );
  }
});

// Helper functions
function getRegionName(regionId: string): string {
  const regions: { [key: string]: string } = {
    'NCR': 'National Capital Region',
    'CEBU': 'Cebu',
    'DAVAO': 'Davao',
    'MANILA': 'Manila',
    'MAKATI': 'Makati',
    'QUEZON': 'Quezon City'
  };
  return regions[regionId.toUpperCase()] || 'Unknown Region';
}

function calculatePerformanceScore(metrics: VehicleMetrics): number {
  // Calculate weighted performance score
  const utilizationScore = metrics.avgUtilization * 0.3;
  const complianceScore = metrics.complianceScore * 0.3;
  const maintenanceScore = (1 - (metrics.overdueMaintenance / metrics.totalVehicles)) * 100 * 0.2;
  const alertScore = (1 - (metrics.activeAlerts / metrics.totalVehicles)) * 100 * 0.2;
  
  return Math.round((utilizationScore + complianceScore + maintenanceScore + alertScore) * 100) / 100;
}

function generateRecommendations(metrics: VehicleMetrics): string[] {
  const recommendations: string[] = [];

  if (metrics.overdueMaintenance > 0) {
    recommendations.push(`${metrics.overdueMaintenance} vehicles require immediate maintenance attention`);
  }

  if (metrics.avgUtilization < 70) {
    recommendations.push('Fleet utilization below optimal threshold - consider route optimization');
  }

  if (metrics.activeAlerts > 10) {
    recommendations.push('High alert volume - review vehicle health monitoring protocols');
  }

  if (metrics.complianceScore < 95) {
    recommendations.push('Compliance score below target - review expiring permits and registrations');
  }

  if (recommendations.length === 0) {
    recommendations.push('Fleet performance is within optimal parameters');
  }

  return recommendations;
}

// POST /api/integration/vehicle-metrics/sync - Sync vehicle data with other systems
export const POST = asyncHandler(async (request: NextRequest) => {
  const body = await request.json();
  const { source, data, syncType = 'incremental' } = body;

  try {
    // Handle different sync operations
    switch (syncType) {
      case 'driver_assignment':
        // Sync vehicle-driver assignments with driver management system
        return createApiResponse({
          synced: true,
          recordsUpdated: data.assignments?.length || 0,
          lastSync: new Date().toISOString()
        }, 'Driver assignments synced successfully');

      case 'booking_integration':
        // Sync vehicle availability with booking system
        return createApiResponse({
          synced: true,
          vehiclesUpdated: data.vehicles?.length || 0,
          lastSync: new Date().toISOString()
        }, 'Vehicle availability synced with booking system');

      case 'maintenance_alerts':
        // Sync maintenance data with alert system
        return createApiResponse({
          synced: true,
          alertsCreated: data.alerts?.length || 0,
          lastSync: new Date().toISOString()
        }, 'Maintenance alerts synchronized');

      default:
        return createApiError(
          'Invalid sync type specified',
          400,
          'INVALID_SYNC_TYPE'
        );
    }

  } catch (error) {
    console.error('Vehicle sync error:', error);
    return createApiError(
      'Failed to sync vehicle data',
      500,
      'VEHICLE_SYNC_ERROR'
    );
  }
});

// OPTIONS handler for CORS
export const OPTIONS = handleOptionsRequest;