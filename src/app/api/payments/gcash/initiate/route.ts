import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    return NextResponse.json({
      success: true,
      data: {
        redirectUrl: 'https://gcash.com/payment/mock',
        transactionId: `TXN-GCASH-${Date.now()}`,
        ...body,
      },
      message: 'GCash payment initiated successfully',
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initiate GCash payment',
      },
      { status: 400 }
    );
  }
}
