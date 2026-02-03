import { NextRequest, NextResponse } from 'next/server';

// GET /api/earnings/payouts
export async function GET(request: NextRequest) {
  try {
    // TODO: Integrate with backend Payment module API
    // TODO: Add authentication and authorization
    // TODO: Get pagination, filters from query params
    // TODO: Get actual driver ID from session/token

    const mockPayouts = [
      {
        id: 'PO-001',
        driverId: 'DRV-123',
        amount: 18450,
        status: 'completed',
        payoutMethod: 'gcash',
        payoutDate: '2026-02-01',
        payoutReference: 'GC20260201-001',
        processedDate: '2026-02-01',
        createdAt: '2026-01-31',
        updatedAt: '2026-02-01',
      },
      {
        id: 'PO-002',
        driverId: 'DRV-123',
        amount: 21300,
        status: 'processing',
        payoutMethod: 'bank_transfer',
        payoutDate: '2026-01-25',
        payoutReference: 'BT20260125-002',
        createdAt: '2026-01-24',
        updatedAt: '2026-01-25',
      },
    ];

    return NextResponse.json({
      data: mockPayouts,
      pagination: {
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      },
    });
  } catch (error) {
    console.error('Error fetching payouts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payouts' },
      { status: 500 }
    );
  }
}
