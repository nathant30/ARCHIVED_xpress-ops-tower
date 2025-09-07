import { NextRequest, NextResponse } from 'next/server';
import { MappingService } from '@/lib/services/MappingService';
import { TrafficDataRequest } from '@/types/mapping';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { locations, traffic_types, include_historical } = body;

    if (!locations || !Array.isArray(locations) || locations.length === 0) {
      return NextResponse.json(
        { error: 'At least one location is required' },
        { status: 400 }
      );
    }

    if (locations.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 locations allowed per request' },
        { status: 400 }
      );
    }

    for (const location of locations) {
      if (!location.latitude || !location.longitude) {
        return NextResponse.json(
          { error: 'All locations must include valid latitude and longitude' },
          { status: 400 }
        );
      }

      const lat = parseFloat(location.latitude);
      const lng = parseFloat(location.longitude);
      
      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return NextResponse.json(
          { error: 'Invalid coordinate values in locations' },
          { status: 400 }
        );
      }
    }

    const trafficRequest: TrafficDataRequest = {
      locations: locations.map((loc: any) => ({
        latitude: parseFloat(loc.latitude),
        longitude: parseFloat(loc.longitude),
        radius: loc.radius ? parseInt(loc.radius) : undefined
      })),
      traffic_types: traffic_types || ['flow', 'incidents'],
      include_historical: include_historical === true
    };

    const mappingService = new MappingService();
    const result = await mappingService.getTrafficData(trafficRequest);

    const summary = {
      locations_analyzed: locations.length,
      traffic_types_requested: trafficRequest.traffic_types,
      includes_historical_data: include_historical === true,
      data_points_returned: result.traffic_data?.length || 0,
      coverage_area: result.coverage_area,
      provider: result.provider || 'unknown'
    };

    return NextResponse.json({
      success: true,
      data: result,
      summary,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Traffic data API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve traffic data',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }

}

// GET method for simple traffic queries
export async function GET(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url);
      const latitude = parseFloat(searchParams.get('latitude') || '');
      const longitude = parseFloat(searchParams.get('longitude') || '');
      const radius = parseInt(searchParams.get('radius') || '1000');

      if (isNaN(latitude) || isNaN(longitude)) {
        return NextResponse.json(
          { error: 'Valid latitude and longitude parameters are required' },
          { status: 400 }
        );
      }

      const trafficRequest: TrafficDataRequest = {
        locations: [{ latitude, longitude, radius }],
        traffic_types: ['flow', 'incidents'],
        include_historical: searchParams.get('include_historical') === 'true'
      };

      const mappingService = new MappingService();
      const result = await mappingService.getTrafficData(trafficRequest);

      return NextResponse.json({
        success: true,
        data: result,
        location: { latitude, longitude, radius },
        timestamp: new Date().toISOString(),
        provider: result.provider || 'unknown'
      });

    } catch (error) {
      console.error('Traffic data API error:', error);
      return NextResponse.json(
        { 
          error: 'Failed to retrieve traffic data',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
}