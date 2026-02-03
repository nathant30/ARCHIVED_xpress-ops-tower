import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    return NextResponse.json({
      success: true,
      data: {
        redirectUrl: 'https://paymaya.com/payment/mock',
        transactionId: `TXN-PAYMAYA-${Date.now()}`,
        ...body,
      },
      message: 'PayMaya payment initiated successfully',
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initiate PayMaya payment',
      },
      { status: 400 }
    );
  }
}
