import { NextRequest, NextResponse } from 'next/server';

// GET /api/earnings/summary
export async function GET(request: NextRequest) {
  try {
    // TODO: Integrate with backend Payment module API
    // TODO: Add authentication and authorization
    // TODO: Get actual driver ID from session/token

    const mockSummary = {
      today: 3350,
      thisWeek: 21620,
      thisMonth: 45230,
      pendingPayout: 18450,
      nextPayoutDate: '2026-02-08',
    };

    return NextResponse.json(mockSummary);
  } catch (error) {
    console.error('Error fetching earnings summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch earnings summary' },
      { status: 500 }
    );
  }
}
