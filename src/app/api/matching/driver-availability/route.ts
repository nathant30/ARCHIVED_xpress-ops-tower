import { NextRequest, NextResponse } from 'next/server';
import { MatchingService } from '@/lib/services/MatchingService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const regionId = searchParams.get('region_id');
    const radius = parseInt(searchParams.get('radius') || '0');
    const latitude = parseFloat(searchParams.get('latitude') || '0');
    const longitude = parseFloat(searchParams.get('longitude') || '0');
    const vehicleType = searchParams.get('vehicle_type');
    const minRating = parseFloat(searchParams.get('min_rating') || '0');
    const includeOffline = searchParams.get('include_offline') === 'true';

    // Validate coordinates if provided
    if ((latitude !== 0 || longitude !== 0)) {
      if (isNaN(latitude) || isNaN(longitude)) {
        return NextResponse.json(
          { error: 'Invalid latitude or longitude values' },
          { status: 400 }
        );
      }

      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return NextResponse.json(
          { error: 'Coordinate values out of valid range' },
          { status: 400 }
        );
      }
    }

    if (radius < 0 || radius > 50000) {
      return NextResponse.json(
        { error: 'Radius must be between 0 and 50000 meters' },
        { status: 400 }
      );
    }

    if (minRating < 0 || minRating > 5) {
      return NextResponse.json(
        { error: 'min_rating must be between 0 and 5' },
        { status: 400 }
      );
    }

    const validVehicleTypes = ['standard', 'premium', 'suv', 'van', 'motorcycle'];
    if (vehicleType && !validVehicleTypes.includes(vehicleType)) {
      return NextResponse.json(
        { error: `Invalid vehicle_type. Must be one of: ${validVehicleTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const matchingService = new MatchingService();
    const availability = await matchingService.getDriverAvailability(regionId || undefined, radius);

    // Apply additional filters
    let filteredDrivers = availability.drivers;

    if (vehicleType) {
      // In production, would filter by actual vehicle type from database
      filteredDrivers = filteredDrivers.filter(driver => 
        driver.vehicle_info.toLowerCase().includes(vehicleType.toLowerCase()) || vehicleType === 'standard'
      );
    }

    if (minRating > 0) {
      filteredDrivers = filteredDrivers.filter(driver => driver.rating >= minRating);
    }

    if (!includeOffline) {
      filteredDrivers = filteredDrivers.filter(driver => driver.status === 'online');
    }

    // Calculate distance from reference point if coordinates provided
    if (latitude !== 0 && longitude !== 0) {
      filteredDrivers = filteredDrivers.map(driver => {
        const driverLat = driver.location.latitude;
        const driverLng = driver.location.longitude;
        
        // Haversine formula for distance calculation
        const R = 6371000; // Earth's radius in meters
        const φ1 = latitude * Math.PI / 180;
        const φ2 = driverLat * Math.PI / 180;
        const Δφ = (driverLat - latitude) * Math.PI / 180;
        const Δλ = (driverLng - longitude) * Math.PI / 180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return {
          ...driver,
          distance_meters: Math.round(R * c)
        };
      });

      // Filter by radius if specified
      if (radius > 0) {
        filteredDrivers = filteredDrivers.filter(driver => driver.distance_meters <= radius);
      }

      // Sort by distance
      filteredDrivers.sort((a, b) => a.distance_meters - b.distance_meters);
    }

    const filteredAvailability = {
      ...availability,
      drivers: filteredDrivers,
      total_online: filteredDrivers.filter(d => d.status === 'online').length,
      total_available: filteredDrivers.length,
      summary: {
        average_distance: filteredDrivers.reduce((sum, d) => sum + d.distance_meters, 0) / filteredDrivers.length || 0,
        average_rating: filteredDrivers.reduce((sum, d) => sum + d.rating, 0) / filteredDrivers.length || 0,
        response_time_estimate: filteredDrivers.length > 0 ? `${Math.max(1, Math.ceil(5 / Math.sqrt(filteredDrivers.length)))} minutes` : 'N/A'
      }
    };

    return NextResponse.json({
      success: true,
      data: filteredAvailability,
      filters_applied: {
        region_id: regionId,
        radius: radius > 0 ? radius : null,
        reference_point: latitude !== 0 && longitude !== 0 ? { latitude, longitude } : null,
        vehicle_type: vehicleType,
        min_rating: minRating > 0 ? minRating : null,
        include_offline: includeOffline
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Driver availability API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get driver availability',
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
    const { 
      driver_id, 
      status, 
      location, 
      vehicle_capacity, 
      accepts_long_distance, 
      accepts_shared_rides,
      preferred_zone_id 
    } = body;

    if (!driver_id || !status || !location) {
      return NextResponse.json(
        { error: 'driver_id, status, and location are required' },
        { status: 400 }
      );
    }

    if (!location.latitude || !location.longitude) {
      return NextResponse.json(
        { error: 'location must include latitude and longitude' },
        { status: 400 }
      );
    }

    const validStatuses = ['online', 'offline', 'busy', 'break', 'maintenance'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate coordinates
    const lat = parseFloat(location.latitude);
    const lng = parseFloat(location.longitude);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json(
        { error: 'Invalid coordinate values' },
        { status: 400 }
      );
    }

    if (vehicle_capacity && (vehicle_capacity < 1 || vehicle_capacity > 12)) {
      return NextResponse.json(
        { error: 'vehicle_capacity must be between 1 and 12' },
        { status: 400 }
      );
    }

    // Update driver availability (mock implementation)
    const availabilityUpdate = {
      driver_id,
      status,
      location: { latitude: lat, longitude: lng },
      vehicle_capacity: vehicle_capacity || 4,
      accepts_long_distance: accepts_long_distance !== false,
      accepts_shared_rides: accepts_shared_rides !== false,
      preferred_zone_id,
      last_ping: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // In production, would update the database
    console.log('Updating driver availability:', availabilityUpdate);

    return NextResponse.json({
      success: true,
      data: {
        driver_id,
        status: 'updated',
        message: `Driver ${driver_id} availability updated to ${status}`,
        last_ping: availabilityUpdate.last_ping
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Update driver availability API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update driver availability',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}