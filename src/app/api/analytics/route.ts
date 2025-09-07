import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  createApiResponse, 
  createApiError,
  asyncHandler
} from '@/lib/api-utils';

// GET /api/analytics - Fetch comprehensive analytics data
export const GET = asyncHandler(async (request: NextRequest) => {
  try {
    // Parse request data
    const query = Object.fromEntries(request.nextUrl.searchParams.entries());
    
    // Get query parameters
    const timeRange = query.timeRange || '24h';
    const regionId = query.regionId;
    const serviceType = query.serviceType;
    
    // Persist event log
    await prisma.apiEvent.create({
      data: {
        method: "GET",
        path: "/api/analytics", 
        operation: "get_api_analytics",
        params: {},
        query,
        body: {}
      }
    });

    // Generate realistic mock data based on time of day
    const now = new Date();
    const baseDrivers = 142;
    const baseBookings = 1247;
    const peakMultiplier = (now.getHours() >= 7 && now.getHours() <= 9) || 
                          (now.getHours() >= 17 && now.getHours() <= 19) ? 1.3 : 1.0;

    const analyticsData = {
      metrics: {
        totalDrivers: Math.floor(baseDrivers * peakMultiplier),
        activeDrivers: Math.floor(89 * peakMultiplier),
        busyDrivers: Math.floor(67 * peakMultiplier),
        offlineDrivers: Math.floor(53 * (2 - peakMultiplier)),
        totalBookings: Math.floor(baseBookings * peakMultiplier),
        activeBookings: Math.floor(67 * peakMultiplier),
        completedBookings: Math.floor(1180 * peakMultiplier),
        cancelledBookings: Math.floor(52 * peakMultiplier),
        driverUtilization: Math.round(62.7 * peakMultiplier * 100) / 100,
        bookingFulfillmentRate: 94.2,
        averageResponseTime: Math.round(185 * (2 - peakMultiplier)),
        averageRating: 4.6
      },
      rideshareKPIs: {
        averageWaitTime: Math.round(192 * (2 - peakMultiplier)), // in seconds
        averageDriverOnlineTime: 28800, // 8 hours
        demandSupplyRatio: Math.round(1.4 * peakMultiplier * 100) / 100,
        averageTripDuration: 1080, // 18 minutes
        totalRevenue: Math.floor(127450 * peakMultiplier),
        revenuePerDriver: Math.floor(898 * peakMultiplier),
        completionRate: 94.2,
        cancellationRate: 4.2
      },
      servicePerformance: [
        {
          service: 'Motorcycle',
          totalBookings: Math.floor(542 * peakMultiplier),
          completedBookings: Math.floor(512 * peakMultiplier),
          completionRate: 94.5,
          averageRating: 4.7,
          revenue: Math.floor(38500 * peakMultiplier)
        },
        {
          service: 'Car',
          totalBookings: Math.floor(398 * peakMultiplier),
          completedBookings: Math.floor(374 * peakMultiplier),
          completionRate: 93.9,
          averageRating: 4.6,
          revenue: Math.floor(48900 * peakMultiplier)
        },
        {
          service: 'SUV',
          totalBookings: Math.floor(189 * peakMultiplier),
          completedBookings: Math.floor(179 * peakMultiplier),
          completionRate: 94.7,
          averageRating: 4.8,
          revenue: Math.floor(28750 * peakMultiplier)
        },
        {
          service: 'Taxi',
          totalBookings: Math.floor(118 * peakMultiplier),
          completedBookings: Math.floor(115 * peakMultiplier),
          completionRate: 97.5,
          averageRating: 4.5,
          revenue: Math.floor(11300 * peakMultiplier)
        }
      ],
      alerts: {
        lowDriverUtilization: peakMultiplier < 1.1,
        highIncidentRate: false,
        lowFulfillmentRate: false,
        locationTrackingIssues: false,
        longWaitTimes: peakMultiplier > 1.2,
        lowDriverOnlineTime: false,
        surgeNeeded: peakMultiplier > 1.25
      },
      lastUpdated: new Date().toISOString()
    };

    return createApiResponse(
      analyticsData,
      'Analytics data retrieved successfully'
    );
    
  } catch (error) {
    console.error('Analytics API error:', error);
    return createApiError(
      'Failed to fetch analytics data',
      'ANALYTICS_ERROR',
      500,
      undefined,
      '/api/analytics',
      'GET'
    );
  }
});