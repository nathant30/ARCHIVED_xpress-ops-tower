// Middleware to monitor and alert on 501 stub hits
// Helps track real user impact of unimplemented endpoints

import { NextRequest, NextResponse } from 'next/server';

export function stubMonitoringMiddleware(request: NextRequest) {
  // Skip monitoring for non-API routes
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

// Hook to track 501 responses (call this from stub route handlers)
export function trackStubHit(route: string, userAgent?: string) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level: 'WARN',
    event: 'STUB_HIT',
    route,
    userAgent: userAgent || 'unknown',
    message: `User hit unimplemented endpoint: ${route}`
  };

  // Log to console (replace with your monitoring solution)
  console.warn('[STUB_HIT]', JSON.stringify(logEntry));

  // TODO: Send to your monitoring service
  // Examples:
  // - Datadog: datadog.increment('api.stub.hit', 1, [`route:${route}`])
  // - Prometheus: stubHitCounter.labels(route).inc()
  // - Custom webhook: fetch('/internal/metrics/stub-hit', { method: 'POST', body: JSON.stringify(logEntry) })
}

// Enhanced stub handler with monitoring
export function createStubHandler(route: string) {
  return async function stubHandler(request: NextRequest) {
    // Track the hit
    trackStubHit(route, request.headers.get('user-agent') || undefined);

    // Return proper 501 with helpful message
    return NextResponse.json(
      {
        error: "Not implemented",
        route,
        message: "This endpoint is under development. Please check back soon.",
        status: "stub",
        timestamp: new Date().toISOString()
      },
      { status: 501 }
    );
  };
}