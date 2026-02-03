import { NextRequest, NextResponse } from 'next/server';

// POST /api/earnings/payouts/:id/dispute
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    // TODO: Integrate with backend Dispute module API
    // TODO: Add authentication and authorization
    // TODO: Validate request body
    // TODO: Create dispute record
    // TODO: Send notification to operations team

    const mockDispute = {
      id: 'DISP-001',
      disputedEntityType: 'payout',
      disputedEntityId: id,
      disputedAmount: 18450,
      reason: body.reason,
      details: body.details,
      status: 'pending',
      raisedBy: 'DRV-123',
      raisedAt: new Date().toISOString(),
    };

    return NextResponse.json(mockDispute, { status: 201 });
  } catch (error) {
    console.error('Error creating payout dispute:', error);
    return NextResponse.json(
      { error: 'Failed to create payout dispute' },
      { status: 500 }
    );
  }
}
