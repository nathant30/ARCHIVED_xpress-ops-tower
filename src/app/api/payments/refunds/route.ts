import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: [],
    message: 'Refunds retrieved successfully',
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    return NextResponse.json({
      success: true,
      data: {
        id: `rfn_${Date.now()}`,
        refundId: `RFN-${Date.now()}`,
        ...body,
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
      message: 'Refund request created successfully',
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create refund request',
      },
      { status: 400 }
    );
  }
}
