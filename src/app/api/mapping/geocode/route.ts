import { NextRequest, NextResponse } from 'next/server';
import { MappingService } from '@/lib/services/MappingService';
import { GeocodeRequest } from '@/types/mapping';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        { error: 'Address parameter is required' },
        { status: 400 }
      );
    }

    const geocodeRequest: GeocodeRequest = {
      address,
      region: searchParams.get('region') || undefined,
      bounds: searchParams.get('bounds') ? JSON.parse(searchParams.get('bounds')!) : undefined,
      components: searchParams.get('components') ? JSON.parse(searchParams.get('components')!) : undefined
    };

    const mappingService = new MappingService();
    const result = await mappingService.geocode(geocodeRequest);

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
      provider: result.provider || 'unknown'
    });

  } catch (error) {
    console.error('Geocoding API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to geocode address',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}