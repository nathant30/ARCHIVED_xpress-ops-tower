import { NextRequest, NextResponse } from 'next/server';
import { MatchingService } from '@/lib/services/MatchingService';
import { FindDriverRequest } from '@/types/matching';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { 
      customer_id, 
      pickup_location, 
      destination_location, 
      vehicle_type, 
      passenger_count,
      preferred_driver_id,
      avoid_driver_ids,
      special_requirements,
      max_pickup_distance,
      max_wait_time,
      surge_acceptance,
      price_sensitivity
    } = body;

    if (!customer_id || !pickup_location || !destination_location) {
      return NextResponse.json(
        { error: 'customer_id, pickup_location, and destination_location are required' },
        { status: 400 }
      );
    }

    if (!pickup_location.latitude || !pickup_location.longitude || !pickup_location.address) {
      return NextResponse.json(
        { error: 'pickup_location must include latitude, longitude, and address' },
        { status: 400 }
      );
    }

    if (!destination_location.latitude || !destination_location.longitude || !destination_location.address) {
      return NextResponse.json(
        { error: 'destination_location must include latitude, longitude, and address' },
        { status: 400 }
      );
    }

    // Validate coordinates
    const pickupLat = parseFloat(pickup_location.latitude);
    const pickupLng = parseFloat(pickup_location.longitude);
    const destLat = parseFloat(destination_location.latitude);
    const destLng = parseFloat(destination_location.longitude);

    if (isNaN(pickupLat) || isNaN(pickupLng) || isNaN(destLat) || isNaN(destLng)) {
      return NextResponse.json(
        { error: 'Invalid coordinate values' },
        { status: 400 }
      );
    }

    if (pickupLat < -90 || pickupLat > 90 || pickupLng < -180 || pickupLng > 180 ||
        destLat < -90 || destLat > 90 || destLng < -180 || destLng > 180) {
      return NextResponse.json(
        { error: 'Coordinate values out of valid range' },
        { status: 400 }
      );
    }

    // Validate optional parameters
    if (passenger_count && (passenger_count < 1 || passenger_count > 8)) {
      return NextResponse.json(
        { error: 'passenger_count must be between 1 and 8' },
        { status: 400 }
      );
    }

    if (max_pickup_distance && (max_pickup_distance < 100 || max_pickup_distance > 50000)) {
      return NextResponse.json(
        { error: 'max_pickup_distance must be between 100 and 50000 meters' },
        { status: 400 }
      );
    }

    if (max_wait_time && (max_wait_time < 60 || max_wait_time > 1800)) {
      return NextResponse.json(
        { error: 'max_wait_time must be between 60 and 1800 seconds' },
        { status: 400 }
      );
    }

    const validVehicleTypes = ['standard', 'premium', 'suv', 'van', 'motorcycle'];
    if (vehicle_type && !validVehicleTypes.includes(vehicle_type)) {
      return NextResponse.json(
        { error: `Invalid vehicle_type. Must be one of: ${validVehicleTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const validPriceSensitivity = ['low', 'normal', 'high'];
    if (price_sensitivity && !validPriceSensitivity.includes(price_sensitivity)) {
      return NextResponse.json(
        { error: `Invalid price_sensitivity. Must be one of: ${validPriceSensitivity.join(', ')}` },
        { status: 400 }
      );
    }

    const findDriverRequest: FindDriverRequest = {
      customer_id,
      pickup_location: {
        latitude: pickupLat,
        longitude: pickupLng,
        address: pickup_location.address
      },
      destination_location: {
        latitude: destLat,
        longitude: destLng,
        address: destination_location.address
      },
      vehicle_type: vehicle_type || 'standard',
      passenger_count,
      preferred_driver_id,
      avoid_driver_ids,
      special_requirements,
      max_pickup_distance,
      max_wait_time,
      surge_acceptance,
      price_sensitivity
    };

    const matchingService = new MatchingService();
    const result = await matchingService.findDriver(findDriverRequest);

    return NextResponse.json({
      success: true,
      data: result,
      message: result.candidates_found > 0 ? 'Drivers found and matching initiated' : 'No available drivers found',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Find driver API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to find driver',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}