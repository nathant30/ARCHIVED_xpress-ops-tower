import { NextRequest, NextResponse } from 'next/server';
import { MatchingService } from '@/lib/services/MatchingService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('request_id');

    if (!requestId) {
      return NextResponse.json(
        { error: 'request_id parameter is required' },
        { status: 400 }
      );
    }

    // Validate request_id format
    if (!requestId.match(/^req_\d+_[a-z0-9]{8}$/)) {
      return NextResponse.json(
        { error: 'Invalid request_id format' },
        { status: 400 }
      );
    }

    const matchingService = new MatchingService();
    const queueStatus = await matchingService.getQueueStatus(requestId);

    // Add helpful interpretation of the status
    const statusInterpretation = {
      'pending': 'Request received and being processed',
      'matching': 'Searching for available drivers',
      'matched': 'Driver found and assigned',
      'expired': 'Request timed out without finding a driver',
      'cancelled': 'Request was cancelled by customer'
    };

    const phaseInterpretation = {
      'initial': 'Initial processing and validation',
      'broadcast': 'Broadcasting to available drivers',
      'negotiation': 'Waiting for driver responses',
      'assignment': 'Assigning driver and creating ride',
      'timeout': 'Handling timeout or retry logic'
    };

    return NextResponse.json({
      success: true,
      data: queueStatus,
      interpretation: {
        status_meaning: statusInterpretation[queueStatus.status as keyof typeof statusInterpretation] || 'Unknown status',
        phase_meaning: phaseInterpretation[queueStatus.current_phase as keyof typeof phaseInterpretation] || 'Unknown phase',
        progress_percentage: calculateProgressPercentage(queueStatus.current_phase, queueStatus.drivers_responded, queueStatus.drivers_contacted)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Queue status API error:', error);
    
    // Handle specific error types
    if (error.message.includes('Request not found')) {
      return NextResponse.json(
        { 
          error: 'Request not found in queue',
          message: 'The ride request may not exist or has been removed from the queue',
          timestamp: new Date().toISOString()
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to get queue status',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { request_id, action, priority_boost } = body;

    if (!request_id || !action) {
      return NextResponse.json(
        { error: 'request_id and action are required' },
        { status: 400 }
      );
    }

    const validActions = ['priority_boost', 'expand_radius', 'retry', 'cancel'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      );
    }

    if (priority_boost && (priority_boost < 1 || priority_boost > 50)) {
      return NextResponse.json(
        { error: 'priority_boost must be between 1 and 50' },
        { status: 400 }
      );
    }

    // Mock queue management actions
    const actionResults = {
      'priority_boost': {
        success: true,
        message: `Priority increased by ${priority_boost || 10} points`,
        new_queue_position: Math.max(1, Math.floor(Math.random() * 3)),
        estimated_improvement: '30-60 seconds faster matching'
      },
      'expand_radius': {
        success: true,
        message: 'Search radius expanded to find more drivers',
        new_radius: '7.5 km',
        additional_drivers_found: Math.floor(Math.random() * 8) + 2
      },
      'retry': {
        success: true,
        message: 'Matching process restarted with fresh driver pool',
        new_attempt_number: Math.floor(Math.random() * 3) + 2,
        drivers_contacted: Math.floor(Math.random() * 12) + 3
      },
      'cancel': {
        success: true,
        message: 'Ride request cancelled and removed from queue',
        refund_status: 'processing',
        cancellation_fee: 0
      }
    };

    const result = actionResults[action as keyof typeof actionResults];

    // Log the queue action
    console.log(`Queue action ${action} performed for request ${request_id}`);

    return NextResponse.json({
      success: true,
      data: {
        request_id,
        action_performed: action,
        result,
        performed_at: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Queue action API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to perform queue action',
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
    const reason = searchParams.get('reason') || 'customer_request';

    if (!requestId) {
      return NextResponse.json(
        { error: 'request_id parameter is required' },
        { status: 400 }
      );
    }

    const validReasons = ['customer_request', 'timeout', 'no_drivers', 'system_error'];
    if (!validReasons.includes(reason)) {
      return NextResponse.json(
        { error: `Invalid reason. Must be one of: ${validReasons.join(', ')}` },
        { status: 400 }
      );
    }

    // Mock removal from queue
    const removalResult = {
      request_id: requestId,
      removed_at: new Date().toISOString(),
      reason,
      was_in_queue: true,
      queue_position_freed: Math.floor(Math.random() * 10) + 1,
      drivers_notified: Math.floor(Math.random() * 5) + 1
    };

    // Handle different removal reasons
    let additionalInfo = {};
    switch (reason) {
      case 'customer_request':
        additionalInfo = {
          cancellation_fee: 0,
          refund_amount: 0,
          notification_sent: true
        };
        break;
      case 'timeout':
        additionalInfo = {
          timeout_duration: '10 minutes',
          retry_suggested: true,
          alternative_options: ['Expand radius', 'Try later', 'Different vehicle type']
        };
        break;
      case 'no_drivers':
        additionalInfo = {
          drivers_contacted: 15,
          drivers_available_nearby: 0,
          suggested_wait_time: '15-30 minutes'
        };
        break;
      case 'system_error':
        additionalInfo = {
          error_logged: true,
          automatic_retry: true,
          support_ticket_created: true
        };
        break;
    }

    console.log(`Request ${requestId} removed from queue due to: ${reason}`);

    return NextResponse.json({
      success: true,
      data: {
        ...removalResult,
        ...additionalInfo
      },
      message: `Request removed from queue successfully`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Remove from queue API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to remove from queue',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Helper function to calculate progress percentage
function calculateProgressPercentage(phase: string, responded: number, contacted: number): number {
  const phaseWeights = {
    'initial': 10,
    'broadcast': 40,
    'negotiation': 70,
    'assignment': 95,
    'timeout': 100
  };
  
  const baseProgress = phaseWeights[phase as keyof typeof phaseWeights] || 0;
  
  if (phase === 'negotiation' && contacted > 0) {
    const responseRate = responded / contacted;
    return Math.min(95, baseProgress + (responseRate * 25));
  }
  
  return baseProgress;
}