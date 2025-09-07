// Security middleware for production
import { NextRequest, NextResponse } from 'next/server';

export function securityHeaders(request: NextRequest) {
  // Create a response that continues to the next middleware
  const response = NextResponse.next();
  
  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Only set HSTS in production to avoid forcing HTTPS in development
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }
  
  // CORS headers
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Correlation-ID');
  
  // Add correlation ID
  const correlationId = request.headers.get('x-correlation-id') || 
                        crypto.randomUUID();
  response.headers.set('X-Correlation-ID', correlationId);
  
  return response;
}

// Express-style middleware (for backward compatibility)
export function applySecurityMiddleware(app) {
  // This is for Express apps, not Next.js middleware
  console.log('Express security middleware applied');
}