import { NextRequest, NextResponse } from 'next/server';

// GET /api/earnings/payouts/:id
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // TODO: Integrate with backend Payment module API
    // TODO: Add authentication and authorization
    // TODO: Verify user has access to this payout

    const mockPayout = {
      id,
      driverId: 'DRV-123',
      amount: 18450,
      status: 'completed',
      payoutMethod: 'gcash',
      payoutDate: '2026-02-01',
      payoutReference: 'GC20260201-001',
      processedDate: '2026-02-01',
      createdAt: '2026-01-31',
      updatedAt: '2026-02-01',
    };

    return NextResponse.json(mockPayout);
  } catch (error) {
    console.error('Error fetching payout details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payout details' },
      { status: 500 }
    );
  }
}
