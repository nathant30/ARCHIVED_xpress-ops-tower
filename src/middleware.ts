// Next.js Middleware - Security & Rate Limiting Integration
import { NextRequest, NextResponse } from 'next/server';

type Counter = { count: number; reset: number };
const buckets = new Map<string, Counter>();         // per-IP+path window counter
type Seen = { until: number };
const idem = new Map<string, Seen>();               // simple idempotency TTL cache

// Environment variables are resolved at runtime in production
function getEnv() {
  return {
    enabled:
      process.env.RATE_LIMIT_ENABLED === 'true' ||
      process.env.RELEASE_STATE === 'uat' ||
      process.env.RELEASE_STATE === 'production',
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? '60000'),
    max: Number(process.env.RATE_LIMIT_MAX ?? '5'),
    idemTtlMs: Number(process.env.IDEMPOTENCY_TTL_MS ?? '900000'), // 15m
  };
}

function keyFor(req: NextRequest) {
  // Production IP detection behind proxy
  const ip =
    req.ip ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown';
  return `${ip}:${req.nextUrl.pathname}`;
}

function applySecurityHeaders(response: NextResponse) {
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
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Correlation-ID, Idempotency-Key');
  
  return response;
}

export function middleware(req: NextRequest) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 200 });
    return applySecurityHeaders(response);
  }

  const env = getEnv();
  
  // Dev mode escape hatch - force rate limiting with header
  const enabledFromEnv = env.enabled;
  const forceInDev = 
    process.env.NODE_ENV !== 'production' &&
    req.headers.get('x-force-rl') === '1';
  const rateLimitEnabled = enabledFromEnv || forceInDev;

  // Idempotency for unsafe methods (API routes only)
  if (req.nextUrl.pathname.startsWith('/api/') && ['POST','PUT','PATCH','DELETE'].includes(req.method)) {
    const idemKey = req.headers.get('idempotency-key');
    if (idemKey) {
      const now = Date.now();
      const seen = idem.get(idemKey);
      if (seen && seen.until > now) {
        const response = NextResponse.json(
          { error: 'Idempotency replay' },
          { status: 409, headers: { 'Idempotency-Replay': 'true' } }
        );
        return applySecurityHeaders(response);
      }
      idem.set(idemKey, { until: now + env.idemTtlMs });
    }
  }

  // Rate limiting for API routes
  if (req.nextUrl.pathname.startsWith('/api/') && rateLimitEnabled) {
    const now = Date.now();
    const k = keyFor(req);
    const win = env.windowMs;
    const max = env.max;

    const rec = buckets.get(k);
    
    if (!rec || rec.reset <= now) {
      buckets.set(k, { count: 1, reset: now + win });
    } else {
      rec.count += 1;
      if (rec.count > max) {
        const retryIn = Math.ceil((rec.reset - now) / 1000);
        const response = new NextResponse('Too Many Requests', {
          status: 429,
          headers: {
            'Retry-After': String(retryIn),
            'X-RateLimit-Limit': String(max),
            'X-RateLimit-Remaining': String(Math.max(0, max - rec.count)),
            'X-RateLimit-Reset': String(Math.floor(rec.reset / 1000)),
          },
        });
        return applySecurityHeaders(response);
      }
    }
  }

  // Continue with security headers
  const response = NextResponse.next();
  
  // Add correlation ID
  const correlationId = req.headers.get('x-correlation-id') || crypto.randomUUID();
  response.headers.set('X-Correlation-ID', correlationId);
  
  // Debug headers (only in non-production)
  if (process.env.NODE_ENV !== 'production') {
    response.headers.set('X-Debug-Middleware', 'active');
    response.headers.set('X-Debug-Rate-Limit', `enabled:${rateLimitEnabled},max:${env.max}`);
  }
  
  return applySecurityHeaders(response);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}