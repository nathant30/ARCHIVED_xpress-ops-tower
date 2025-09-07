import { NextRequest, NextResponse } from 'next/server';
import { AnalyticsService } from '@/lib/services/AnalyticsService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const driverId = searchParams.get('driver_id');
    const regionFilter = searchParams.get('region_filter')?.split(',');
    const performanceMetric = searchParams.get('performance_metric'); // earnings, rating, efficiency
    const limit = parseInt(searchParams.get('limit') || '100');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'start_date and end_date parameters are required' },
        { status: 400 }
      );
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    if (end <= start) {
      return NextResponse.json(
        { error: 'end_date must be after start_date' },
        { status: 400 }
      );
    }

    if (limit > 1000) {
      return NextResponse.json(
        { error: 'Limit cannot exceed 1000' },
        { status: 400 }
      );
    }

    const dateRange = {
      start_date: startDate,
      end_date: endDate
    };

    const analyticsService = new AnalyticsService();
    const driverPerformance = await analyticsService.getDriverPerformance(dateRange);

    // Filter by specific driver if requested
    let filteredData = driverPerformance;
    if (driverId) {
      filteredData = {
        ...driverPerformance,
        top_performers: {
          by_earnings: driverPerformance.top_performers.by_earnings.filter(d => d.driver_id === driverId),
          by_rating: driverPerformance.top_performers.by_rating.filter(d => d.driver_id === driverId),
          by_efficiency: driverPerformance.top_performers.by_efficiency.filter(d => d.driver_id === driverId)
        }
      };
    }

    // Sort by performance metric if specified
    if (performanceMetric && ['earnings', 'rating', 'efficiency'].includes(performanceMetric)) {
      const sortKey = performanceMetric === 'earnings' ? 'by_earnings' : 
                     performanceMetric === 'rating' ? 'by_rating' : 'by_efficiency';
      
      filteredData.top_performers[sortKey] = filteredData.top_performers[sortKey].slice(0, limit);
    }

    return NextResponse.json({
      success: true,
      data: filteredData,
      query_parameters: {
        date_range: dateRange,
        driver_id: driverId,
        region_filter: regionFilter,
        performance_metric: performanceMetric,
        limit
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Driver performance analytics API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get driver performance analytics',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      date_range, 
      driver_ids, 
      performance_metrics, 
      comparison_period,
      aggregation_level 
    } = body;

    if (!date_range || !date_range.start_date || !date_range.end_date) {
      return NextResponse.json(
        { error: 'date_range with start_date and end_date is required' },
        { status: 400 }
      );
    }

    if (driver_ids && Array.isArray(driver_ids) && driver_ids.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 driver IDs allowed per request' },
        { status: 400 }
      );
    }

    const validMetrics = ['earnings', 'rating', 'efficiency', 'completion_rate', 'acceptance_rate'];
    if (performance_metrics && Array.isArray(performance_metrics)) {
      const invalidMetrics = performance_metrics.filter(m => !validMetrics.includes(m));
      if (invalidMetrics.length > 0) {
        return NextResponse.json(
          { error: `Invalid performance metrics: ${invalidMetrics.join(', ')}` },
          { status: 400 }
        );
      }
    }

    const analyticsService = new AnalyticsService();
    const driverPerformance = await analyticsService.getDriverPerformance(date_range);

    // Apply filters based on request parameters
    let filteredData = driverPerformance;
    
    if (driver_ids && Array.isArray(driver_ids)) {
      filteredData = {
        ...driverPerformance,
        top_performers: {
          by_earnings: driverPerformance.top_performers.by_earnings.filter(d => driver_ids.includes(d.driver_id)),
          by_rating: driverPerformance.top_performers.by_rating.filter(d => driver_ids.includes(d.driver_id)),
          by_efficiency: driverPerformance.top_performers.by_efficiency.filter(d => driver_ids.includes(d.driver_id))
        }
      };
    }

    return NextResponse.json({
      success: true,
      data: filteredData,
      query_parameters: {
        date_range,
        driver_ids,
        performance_metrics,
        comparison_period,
        aggregation_level
      },
      metadata: {
        total_drivers_analyzed: filteredData.overview.total_drivers,
        active_drivers: filteredData.overview.active_drivers,
        data_quality: 'high',
        last_updated: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Driver performance analytics API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get driver performance analytics',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}