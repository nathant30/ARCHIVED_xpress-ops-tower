import { NextRequest, NextResponse } from 'next/server';
import { MatchingService } from '@/lib/services/MatchingService';
import { RejectRideRequest } from '@/types/matching';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { 
      request_id, 
      driver_id, 
      rejection_reason, 
      rejection_category 
    } = body;

    if (!request_id || !driver_id || !rejection_reason) {
      return NextResponse.json(
        { error: 'request_id, driver_id, and rejection_reason are required' },
        { status: 400 }
      );
    }

    // Validate request_id format
    if (!request_id.match(/^req_\d+_[a-z0-9]{8}$/)) {
      return NextResponse.json(
        { error: 'Invalid request_id format' },
        { status: 400 }
      );
    }

    // Validate rejection reason length
    if (rejection_reason.length < 3 || rejection_reason.length > 200) {
      return NextResponse.json(
        { error: 'rejection_reason must be between 3 and 200 characters' },
        { status: 400 }
      );
    }

    // Validate rejection category if provided
    const validCategories = [
      'too_far', 'traffic', 'break_time', 'vehicle_issue', 'personal_emergency',
      'unsafe_area', 'customer_issue', 'payment_concern', 'other'
    ];
    
    if (rejection_category && !validCategories.includes(rejection_category)) {
      return NextResponse.json(
        { error: `Invalid rejection_category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }

    const rejectRideRequest: RejectRideRequest = {
      request_id,
      driver_id,
      rejection_reason,
      rejection_category
    };

    const matchingService = new MatchingService();
    const result = await matchingService.rejectRide(rejectRideRequest);

    // Log the rejection for analysis
    console.log(`Driver ${driver_id} rejected ride request ${request_id}: ${rejection_reason} (${rejection_category || 'unspecified'})`);

    // Provide helpful response based on rejection category
    const categoryAdvice = {
      'too_far': 'Consider adjusting your maximum pickup distance in settings',
      'traffic': 'Traffic conditions are factored into future matching',
      'break_time': 'You can set break mode to pause ride requests',
      'vehicle_issue': 'Please resolve vehicle issues before going back online',
      'personal_emergency': 'Stay safe! You can go offline anytime',
      'unsafe_area': 'Your safety is priority. These areas will be noted',
      'customer_issue': 'Customer feedback has been recorded for review',
      'payment_concern': 'Payment issues can be reported to support',
      'other': 'Thank you for the feedback'
    };

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Ride request rejected successfully',
      advice: categoryAdvice[rejection_category as keyof typeof categoryAdvice] || 'Thank you for the feedback',
      impact_info: {
        acceptance_rate_note: 'Occasional rejections are normal and expected',
        next_request_info: result.impact.next_request_delay > 0 ? 
          `Next request in ${result.impact.next_request_delay} seconds` : 
          'You can receive new requests immediately'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Reject ride API error:', error);
    
    // Handle specific error types
    if (error.message.includes('Request not found')) {
      return NextResponse.json(
        { 
          error: 'Request not found',
          message: 'The ride request may have expired or been cancelled',
          timestamp: new Date().toISOString()
        },
        { status: 404 }
      );
    }

    if (error.message.includes('already responded')) {
      return NextResponse.json(
        { 
          error: 'Request already responded to',
          message: 'You have already responded to this ride request',
          timestamp: new Date().toISOString()
        },
        { status: 409 }
      );
    }

    if (error.message.includes('Request expired')) {
      return NextResponse.json(
        { 
          error: 'Request expired',
          message: 'This ride request has expired and is no longer active',
          timestamp: new Date().toISOString()
        },
        { status: 410 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to reject ride',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get('driver_id');
    const timeframe = searchParams.get('timeframe') || 'today';

    if (!driverId) {
      return NextResponse.json(
        { error: 'driver_id parameter is required' },
        { status: 400 }
      );
    }

    const validTimeframes = ['today', 'week', 'month', 'all'];
    if (!validTimeframes.includes(timeframe)) {
      return NextResponse.json(
        { error: `Invalid timeframe. Must be one of: ${validTimeframes.join(', ')}` },
        { status: 400 }
      );
    }

    // Mock rejection history and statistics
    const rejectionHistory = [
      {
        request_id: 'req_1693919500_xyz98765',
        rejected_at: '2025-09-06T01:35:00Z',
        rejection_reason: 'Too far from pickup location',
        rejection_category: 'too_far',
        pickup_distance: 8.5,
        impact: {
          acceptance_rate_change: -0.02,
          next_request_delay: 60
        }
      },
      {
        request_id: 'req_1693918800_abc54321',
        rejected_at: '2025-09-06T01:20:00Z',
        rejection_reason: 'Heavy traffic on route',
        rejection_category: 'traffic',
        pickup_distance: 3.2,
        impact: {
          acceptance_rate_change: -0.01,
          next_request_delay: 30
        }
      }
    ];

    const rejectionStats = {
      total_rejections: rejectionHistory.length,
      most_common_reasons: [
        { category: 'too_far', count: 1, percentage: 50 },
        { category: 'traffic', count: 1, percentage: 50 }
      ],
      average_pickup_distance: 5.85,
      current_acceptance_rate: 0.84,
      recommendations: [
        'Consider adjusting maximum pickup distance to reduce rejections',
        'Use traffic-aware routing to better assess pickup times'
      ]
    };

    return NextResponse.json({
      success: true,
      data: {
        driver_id: driverId,
        timeframe,
        rejection_history: rejectionHistory,
        statistics: rejectionStats
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get rejection history API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get rejection history',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('request_id');
    const driverId = searchParams.get('driver_id');

    if (!requestId || !driverId) {
      return NextResponse.json(
        { error: 'request_id and driver_id parameters are required' },
        { status: 400 }
      );
    }

    // Cancel/withdraw a rejection (if still possible)
    // This would only work within a very short time window after rejection
    
    console.log(`Attempting to cancel rejection for request ${requestId} by driver ${driverId}`);

    // Mock cancellation logic
    const canCancel = Math.random() > 0.7; // 30% chance it's too late to cancel

    if (!canCancel) {
      return NextResponse.json(
        { 
          error: 'Cannot cancel rejection',
          message: 'The rejection window has closed. The request may have been reassigned.',
          timestamp: new Date().toISOString()
        },
        { status: 410 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        request_id: requestId,
        driver_id: driverId,
        status: 'rejection_cancelled',
        message: 'Rejection cancelled successfully. You may now accept this request if still available.'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Cancel rejection API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to cancel rejection',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}