import { NextRequest, NextResponse } from 'next/server';
import { MatchingService } from '@/lib/services/MatchingService';
import { AcceptRideRequest } from '@/types/matching';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { 
      request_id, 
      driver_id, 
      estimated_arrival_time, 
      current_location,
      notes
    } = body;

    if (!request_id || !driver_id || !estimated_arrival_time || !current_location) {
      return NextResponse.json(
        { error: 'request_id, driver_id, estimated_arrival_time, and current_location are required' },
        { status: 400 }
      );
    }

    if (!current_location.latitude || !current_location.longitude) {
      return NextResponse.json(
        { error: 'current_location must include latitude and longitude' },
        { status: 400 }
      );
    }

    // Validate coordinates
    const lat = parseFloat(current_location.latitude);
    const lng = parseFloat(current_location.longitude);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json(
        { error: 'Invalid coordinate values in current_location' },
        { status: 400 }
      );
    }

    // Validate estimated arrival time
    const eta = parseInt(estimated_arrival_time);
    if (isNaN(eta) || eta < 60 || eta > 3600) {
      return NextResponse.json(
        { error: 'estimated_arrival_time must be between 60 and 3600 seconds' },
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

    // Validate notes length if provided
    if (notes && notes.length > 500) {
      return NextResponse.json(
        { error: 'Notes cannot exceed 500 characters' },
        { status: 400 }
      );
    }

    const acceptRideRequest: AcceptRideRequest = {
      request_id,
      driver_id,
      estimated_arrival_time: eta,
      current_location: {
        latitude: lat,
        longitude: lng
      },
      notes
    };

    const matchingService = new MatchingService();
    const result = await matchingService.acceptRide(acceptRideRequest);

    // Log the acceptance for monitoring
    console.log(`Driver ${driver_id} accepted ride request ${request_id} with ETA ${eta} seconds`);

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Ride request accepted successfully',
      next_steps: [
        'Navigate to pickup location',
        'Contact customer if needed',
        'Update ride status when arriving'
      ],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Accept ride API error:', error);
    
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

    if (error.message.includes('already accepted')) {
      return NextResponse.json(
        { 
          error: 'Request already accepted',
          message: 'This ride request has already been accepted by another driver',
          timestamp: new Date().toISOString()
        },
        { status: 409 }
      );
    }

    if (error.message.includes('Driver not available')) {
      return NextResponse.json(
        { 
          error: 'Driver not available',
          message: 'Driver must be online and available to accept rides',
          timestamp: new Date().toISOString()
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to accept ride',
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
    const status = searchParams.get('status') || 'active';

    if (!driverId) {
      return NextResponse.json(
        { error: 'driver_id parameter is required' },
        { status: 400 }
      );
    }

    const validStatuses = ['active', 'completed', 'cancelled', 'all'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Mock response for driver's accepted rides
    const acceptedRides = [
      {
        request_id: 'req_1693920000_abc12345',
        ride_id: 'ride_1693920060_def67890',
        customer_name: 'Juan Cruz',
        pickup_location: {
          address: 'SM Mall of Asia, Pasay City',
          latitude: 14.5378,
          longitude: 120.9818
        },
        destination_location: {
          address: 'Bonifacio Global City, Taguig',
          latitude: 14.5514,
          longitude: 121.0496
        },
        estimated_arrival_time: 480,
        accepted_at: '2025-09-06T01:45:00Z',
        status: 'en_route_to_pickup',
        fare_estimate: {
          base_fare: 85,
          surge_multiplier: 1.2,
          estimated_total: 102,
          currency: 'PHP'
        },
        customer_contact: {
          phone: '+63917*******',
          pickup_instructions: 'Near the main entrance'
        }
      }
    ];

    const filteredRides = status === 'all' ? acceptedRides : 
                         acceptedRides.filter(ride => ride.status === status);

    return NextResponse.json({
      success: true,
      data: {
        driver_id: driverId,
        accepted_rides: filteredRides,
        total_rides: filteredRides.length,
        status_filter: status
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get accepted rides API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get accepted rides',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}