import { NextRequest, NextResponse } from 'next/server';

// GET /api/billing/dashboard/kpis - Get billing KPIs
export async function GET(request: NextRequest) {
  try {
    // TODO: Connect to backend billing module for real KPI data
    return NextResponse.json({
      success: true,
      data: {
        totalBilled: 0,
        outstanding: 0,
        overdue: 0,
        collected: 0,
      },
      message: 'KPIs retrieved successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch KPIs',
          details: error,
        },
      },
      { status: 500 }
    );
  }
}
