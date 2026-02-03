import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get('date');

  return NextResponse.json({
    success: true,
    data: {
      summary: {
        date: date || new Date().toISOString(),
        totalTransactions: 0,
        reconciledCount: 0,
        pendingCount: 0,
        discrepancyCount: 0,
        expectedTotal: 0,
        actualTotal: 0,
        difference: 0,
      },
      items: [],
    },
    message: 'Reconciliation data retrieved successfully',
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    return NextResponse.json({
      success: true,
      data: {
        ...body,
        reconciledAt: new Date().toISOString(),
        status: 'reconciled',
      },
      message: 'Transaction reconciled successfully',
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reconcile transaction',
      },
      { status: 400 }
    );
  }
}
