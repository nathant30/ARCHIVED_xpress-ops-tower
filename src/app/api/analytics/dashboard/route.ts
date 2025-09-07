import { NextRequest, NextResponse } from 'next/server';
import { AnalyticsService } from '@/lib/services/AnalyticsService';
import { DashboardRequest } from '@/types/mapping';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { dashboard_type, date_range, region_filter, widgets, refresh_interval } = body;

    if (!dashboard_type || !date_range) {
      return NextResponse.json(
        { error: 'dashboard_type and date_range are required' },
        { status: 400 }
      );
    }

    const validDashboardTypes = ['executive', 'operations', 'financial', 'driver', 'customer'];
    if (!validDashboardTypes.includes(dashboard_type)) {
      return NextResponse.json(
        { error: `Invalid dashboard_type. Must be one of: ${validDashboardTypes.join(', ')}` },
        { status: 400 }
      );
    }

    if (!date_range.start_date || !date_range.end_date || !date_range.period) {
      return NextResponse.json(
        { error: 'date_range must include start_date, end_date, and period' },
        { status: 400 }
      );
    }

    const validPeriods = ['hour', 'day', 'week', 'month'];
    if (!validPeriods.includes(date_range.period)) {
      return NextResponse.json(
        { error: `Invalid period. Must be one of: ${validPeriods.join(', ')}` },
        { status: 400 }
      );
    }

    const dashboardRequest: DashboardRequest = {
      dashboard_type,
      date_range,
      region_filter,
      widgets,
      refresh_interval
    };

    const analyticsService = new AnalyticsService();
    const dashboard = await analyticsService.createDashboard(dashboardRequest);

    return NextResponse.json({
      success: true,
      data: dashboard,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create dashboard',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dashboardType = searchParams.get('dashboard_type');
    
    if (!dashboardType) {
      return NextResponse.json(
        { error: 'dashboard_type parameter is required' },
        { status: 400 }
      );
    }

    // Quick dashboard with default settings
    const dashboardRequest: DashboardRequest = {
      dashboard_type: dashboardType as any,
      date_range: {
        start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        period: 'day'
      },
      region_filter: searchParams.get('region_filter')?.split(','),
      refresh_interval: parseInt(searchParams.get('refresh_interval') || '300')
    };

    const analyticsService = new AnalyticsService();
    const dashboard = await analyticsService.createDashboard(dashboardRequest);

    return NextResponse.json({
      success: true,
      data: dashboard,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get dashboard',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}