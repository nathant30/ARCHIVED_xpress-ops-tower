import { NextRequest, NextResponse } from 'next/server';
import { AnalyticsService } from '@/lib/services/AnalyticsService';
import { ReportGenerationRequest } from '@/types/mapping';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { 
      report_type, 
      report_format, 
      parameters, 
      delivery_options 
    } = body;

    if (!report_type || !report_format || !parameters) {
      return NextResponse.json(
        { error: 'report_type, report_format, and parameters are required' },
        { status: 400 }
      );
    }

    const validReportTypes = ['revenue', 'driver_performance', 'demand_forecasting', 'operational', 'compliance'];
    if (!validReportTypes.includes(report_type)) {
      return NextResponse.json(
        { error: `Invalid report_type. Must be one of: ${validReportTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const validFormats = ['pdf', 'excel', 'csv', 'json'];
    if (!validFormats.includes(report_format)) {
      return NextResponse.json(
        { error: `Invalid report_format. Must be one of: ${validFormats.join(', ')}` },
        { status: 400 }
      );
    }

    if (!parameters.date_range || !parameters.date_range.start_date || !parameters.date_range.end_date) {
      return NextResponse.json(
        { error: 'parameters.date_range with start_date and end_date is required' },
        { status: 400 }
      );
    }

    // Validate date range
    const startDate = new Date(parameters.date_range.start_date);
    const endDate = new Date(parameters.date_range.end_date);
    const maxRange = 365 * 24 * 60 * 60 * 1000; // 1 year

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format in date_range' },
        { status: 400 }
      );
    }

    if (endDate <= startDate) {
      return NextResponse.json(
        { error: 'end_date must be after start_date' },
        { status: 400 }
      );
    }

    if (endDate.getTime() - startDate.getTime() > maxRange) {
      return NextResponse.json(
        { error: 'Date range cannot exceed 1 year' },
        { status: 400 }
      );
    }

    const reportRequest: ReportGenerationRequest = {
      report_type,
      report_format,
      parameters: {
        ...parameters,
        grouping: parameters.grouping || 'day',
        include_charts: parameters.include_charts !== false,
        include_raw_data: parameters.include_raw_data === true
      },
      delivery_options
    };

    const analyticsService = new AnalyticsService();
    const reportResponse = await analyticsService.generateReport(reportRequest);

    return NextResponse.json({
      success: true,
      data: reportResponse,
      message: 'Report generation initiated successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Report generation API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate report',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}