import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params?: Record<string, string> } = {}) {
  try {
    // Parse request data
    const query = Object.fromEntries(request.nextUrl.searchParams.entries());
    const body = request.method !== 'GET' ? await request.json().catch(() => ({})) : {};
    
    // Persist event log
    const event = await prisma.apiEvent.create({
      data: {
        method: "GET",
        path: "/api/metrics", 
        operation: "get_api_metrics",
        params: params || {},
        query,
        body
      }
    });

    // Return baseline response
    return NextResponse.json({
      ok: true,
      data: {
        id: event.id,
        operation: "get_api_metrics",
        timestamp: event.createdAt
      }
    }, { status: 200 });
    
  } catch (error) {
    console.error('Baseline handler error:', error);
    return NextResponse.json({
      ok: false,
      error: "BaselineImplementationError",
      details: String(error?.message || error)
    }, { status: 500 });
  }
}