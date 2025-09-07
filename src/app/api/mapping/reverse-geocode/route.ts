import { NextRequest, NextResponse } from 'next/server';
import { MappingService } from '@/lib/services/MappingService';
import { ReverseGeocodeRequest } from '@/types/mapping';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latitude = parseFloat(searchParams.get('latitude') || '');
    const longitude = parseFloat(searchParams.get('longitude') || '');

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { error: 'Valid latitude and longitude parameters are required' },
        { status: 400 }
      );
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return NextResponse.json(
        { error: 'Invalid coordinate values' },
        { status: 400 }
      );
    }

    const reverseGeocodeRequest: ReverseGeocodeRequest = {
      latitude,
      longitude,
      result_type: searchParams.get('result_type')?.split(','),
      location_type: searchParams.get('location_type')?.split(',')
    };

    const mappingService = new MappingService();
    const result = await mappingService.reverseGeocode(reverseGeocodeRequest);

    return NextResponse.json({
      success: true,
      data: result,
      coordinates: { latitude, longitude },
      timestamp: new Date().toISOString(),
      provider: result.provider || 'unknown'
    });

  } catch (error) {
    console.error('Reverse geocoding API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to reverse geocode coordinates',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}