import { NextRequest, NextResponse } from 'next/server';
import { MappingService } from '@/lib/services/MappingService';
import { ETACalculationRequest } from '@/types/mapping';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const originsParam = searchParams.get('origins');
    const destinationsParam = searchParams.get('destinations');

    if (!originsParam || !destinationsParam) {
      return NextResponse.json(
        { error: 'Origins and destinations parameters are required' },
        { status: 400 }
      );
    }

    let origins, destinations;
    try {
      origins = JSON.parse(originsParam);
      destinations = JSON.parse(destinationsParam);
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON format for origins or destinations' },
        { status: 400 }
      );
    }

    if (!Array.isArray(origins) || !Array.isArray(destinations)) {
      return NextResponse.json(
        { error: 'Origins and destinations must be arrays' },
        { status: 400 }
      );
    }

    if (origins.length === 0 || destinations.length === 0) {
      return NextResponse.json(
        { error: 'At least one origin and destination are required' },
        { status: 400 }
      );
    }

    if (origins.length > 25 || destinations.length > 25) {
      return NextResponse.json(
        { error: 'Maximum 25 origins and destinations allowed' },
        { status: 400 }
      );
    }

    const etaRequest: ETACalculationRequest = {
      origins: origins.map((origin: any) => ({
        latitude: parseFloat(origin.latitude),
        longitude: parseFloat(origin.longitude)
      })),
      destinations: destinations.map((dest: any) => ({
        latitude: parseFloat(dest.latitude),
        longitude: parseFloat(dest.longitude)
      })),
      travel_mode: (searchParams.get('travel_mode') as any) || 'driving',
      avoid: searchParams.get('avoid')?.split(','),
      traffic_model: (searchParams.get('traffic_model') as any) || 'best_guess',
      departure_time: searchParams.get('departure_time') || undefined,
      arrival_time: searchParams.get('arrival_time') || undefined
    };

    const mappingService = new MappingService();
    const result = await mappingService.calculateETA(etaRequest);

    return NextResponse.json({
      success: true,
      data: result,
      calculation_summary: {
        origins_count: origins.length,
        destinations_count: destinations.length,
        total_combinations: origins.length * destinations.length,
        travel_mode: etaRequest.travel_mode,
        traffic_considered: !!etaRequest.traffic_model
      },
      timestamp: new Date().toISOString(),
      provider: result.provider || 'unknown'
    });

  } catch (error) {
    console.error('ETA calculation API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to calculate ETA',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}