import { NextRequest, NextResponse } from 'next/server';
import { MappingService } from '@/lib/services/MappingService';
import { RouteOptimizationRequest } from '@/types/mapping';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { origin, destination, waypoints, optimize_waypoints, avoid, travel_mode, traffic_model, departure_time, arrival_time, alternatives } = body;

    if (!origin || !destination) {
      return NextResponse.json(
        { error: 'Origin and destination are required' },
        { status: 400 }
      );
    }

    if (!origin.latitude || !origin.longitude || !destination.latitude || !destination.longitude) {
      return NextResponse.json(
        { error: 'Origin and destination must include valid latitude and longitude' },
        { status: 400 }
      );
    }

    const routeRequest: RouteOptimizationRequest = {
      origin: {
        latitude: parseFloat(origin.latitude),
        longitude: parseFloat(origin.longitude)
      },
      destination: {
        latitude: parseFloat(destination.latitude),
        longitude: parseFloat(destination.longitude)
      },
      waypoints: waypoints?.map((wp: any) => ({
        latitude: parseFloat(wp.latitude),
        longitude: parseFloat(wp.longitude),
        stopover: wp.stopover !== false
      })),
      optimize_waypoints,
      avoid,
      travel_mode: travel_mode || 'DRIVING',
      traffic_model: traffic_model || 'best_guess',
      departure_time,
      arrival_time,
      alternatives: alternatives !== false
    };

    const mappingService = new MappingService();
    const result = await mappingService.optimizeRoute(routeRequest);

    return NextResponse.json({
      success: true,
      data: result,
      optimization_summary: {
        routes_found: result.routes?.length || 0,
        waypoints_optimized: optimize_waypoints,
        travel_mode: travel_mode || 'DRIVING',
        traffic_considered: traffic_model !== undefined
      },
      timestamp: new Date().toISOString(),
      provider: result.provider || 'unknown'
    });

  } catch (error) {
    console.error('Route optimization API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to optimize route',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}