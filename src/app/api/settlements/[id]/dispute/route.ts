import { NextRequest, NextResponse } from 'next/server';

// POST /api/settlements/:id/dispute
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
      id: 'DISP-002',
      disputedEntityType: 'settlement',
      disputedEntityId: id,
      disputedAmount: 2650,
      reason: body.reason,
      details: body.details,
      status: 'pending',
      raisedBy: 'DRV-123',
      raisedAt: new Date().toISOString(),
    };

    return NextResponse.json(mockDispute, { status: 201 });
  } catch (error) {
    console.error('Error creating settlement dispute:', error);
    return NextResponse.json(
      { error: 'Failed to create settlement dispute' },
      { status: 500 }
    );
  }
}
