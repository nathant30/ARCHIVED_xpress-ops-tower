import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = searchParams.get('page') || '1';
  const limit = searchParams.get('limit') || '10';

  return NextResponse.json({
    success: true,
    data: [],
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: 0,
      totalPages: 0,
    },
    message: 'Transactions retrieved successfully',
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    return NextResponse.json({
      success: true,
      data: {
        id: `txn_${Date.now()}`,
        transactionId: `TXN-${Date.now()}`,
        ...body,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      message: 'Transaction created successfully',
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create transaction',
      },
      { status: 400 }
    );
  }
}
