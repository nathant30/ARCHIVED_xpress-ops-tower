import { NextRequest, NextResponse } from 'next/server';
import { AnalyticsService } from '@/lib/services/AnalyticsService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const regionFilter = searchParams.get('region_filter')?.split(',');

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

    const maxRange = 365 * 24 * 60 * 60 * 1000; // 1 year
    if (end.getTime() - start.getTime() > maxRange) {
      return NextResponse.json(
        { error: 'Date range cannot exceed 1 year' },
        { status: 400 }
      );
    }

    const dateRange = {
      start_date: startDate,
      end_date: endDate
    };

    const analyticsService = new AnalyticsService();
    const revenueAnalytics = await analyticsService.getRevenueAnalytics(dateRange, regionFilter);

    return NextResponse.json({
      success: true,
      data: revenueAnalytics,
      query_parameters: {
        date_range: dateRange,
        region_filter: regionFilter,
        data_points: revenueAnalytics.breakdown.by_time.length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Revenue analytics API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get revenue analytics',
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
    const { date_range, region_filter, metrics, comparison_period } = body;

    if (!date_range || !date_range.start_date || !date_range.end_date) {
      return NextResponse.json(
        { error: 'date_range with start_date and end_date is required' },
        { status: 400 }
      );
    }

    const analyticsService = new AnalyticsService();
    const revenueAnalytics = await analyticsService.getRevenueAnalytics(date_range, region_filter);

    // Apply metric filtering if specified
    let filteredData = revenueAnalytics;
    if (metrics && Array.isArray(metrics)) {
      // Filter response to include only requested metrics
      filteredData = {
        ...revenueAnalytics,
        breakdown: {
          ...revenueAnalytics.breakdown,
          by_time: revenueAnalytics.breakdown.by_time.map(item => {
            const filtered: any = { period: item.period };
            if (metrics.includes('gross_revenue')) filtered.gross_revenue = item.gross_revenue;
            if (metrics.includes('net_revenue')) filtered.net_revenue = item.net_revenue;
            if (metrics.includes('ride_count')) filtered.ride_count = item.ride_count;
            if (metrics.includes('average_fare')) filtered.average_fare = item.average_fare;
            return filtered;
          })
        }
      };
    }

    return NextResponse.json({
      success: true,
      data: filteredData,
      query_parameters: {
        date_range,
        region_filter,
        metrics_requested: metrics,
        comparison_period
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Revenue analytics API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get revenue analytics',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}