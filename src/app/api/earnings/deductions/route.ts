import { NextRequest, NextResponse } from 'next/server';

// GET /api/earnings/deductions
export async function GET(request: NextRequest) {
  try {
    // TODO: Integrate with backend Payment module API
    // TODO: Add authentication and authorization
    // TODO: Get pagination, filters from query params
    // TODO: Get actual driver ID from session/token

    const mockDeductions = [
      {
        id: 'DD-001',
        driverId: 'DRV-123',
        type: 'commission',
        amount: 700,
        reason: 'Platform commission (20%)',
        deductionDate: '2026-02-02',
        createdAt: '2026-02-02',
        canDispute: false,
      },
      {
        id: 'DD-002',
        driverId: 'DRV-123',
        type: 'bond',
        amount: 100,
        reason: 'Bond deduction for traffic violation',
        relatedIncidentId: 'INC-456',
        deductionDate: '2026-02-02',
        createdAt: '2026-02-02',
        canDispute: true,
      },
    ];

    return NextResponse.json({
      data: mockDeductions,
      pagination: {
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      },
    });
  } catch (error) {
    console.error('Error fetching deductions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deductions' },
      { status: 500 }
    );
  }
}
