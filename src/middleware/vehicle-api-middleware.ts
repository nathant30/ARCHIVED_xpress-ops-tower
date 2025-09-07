// Vehicle Management API Middleware
// Performance optimization, caching, rate limiting, and monitoring for vehicle endpoints

import { NextRequest, NextResponse } from 'next/server';
import { 
  checkRateLimit,
  createApiError,
  logApiRequest 
} from '@/lib/api-utils';
import { logger } from '@/lib/security/productionLogger';

// Cache configuration for different endpoint types
const CACHE_CONFIG = {
  // Vehicle list endpoints - medium cache duration
  'vehicles_list': {
    ttl: 300, // 5 minutes
    key: (req: NextRequest) => `vehicles:list:${new URL(req.url).search}`
  },
  
  // Individual vehicle details - longer cache
  'vehicle_detail': {
    ttl: 600, // 10 minutes
    key: (req: NextRequest, vehicleId: string) => `vehicle:${vehicleId}:detail`
  },
  
  // Analytics data - longer cache due to computation cost
  'analytics': {
    ttl: 1800, // 30 minutes
    key: (req: NextRequest) => `analytics:${new URL(req.url).search}`
  },
  
  // Telemetry data - very short cache due to real-time nature
  'telemetry': {
    ttl: 30, // 30 seconds
    key: (req: NextRequest, vehicleId: string) => `telemetry:${vehicleId}:${Date.now().toString().slice(0, -4)}0000` // Round to nearest 10 seconds
  },
  
  // Compliance data - medium cache
  'compliance': {
    ttl: 900, // 15 minutes
    key: (req: NextRequest, vehicleId: string) => `compliance:${vehicleId}`
  },
  
  // Maintenance data - medium cache
  'maintenance': {
    ttl: 600, // 10 minutes
    key: (req: NextRequest, vehicleId: string) => `maintenance:${vehicleId}:list`
  }
};

// Rate limiting configuration by endpoint type
const RATE_LIMITS = {
  // Standard CRUD operations
  'crud': {
    requests: 100,
    window: 60 * 1000, // 1 minute
    keyPrefix: 'crud'
  },
  
  // Telemetry endpoints (vehicle-specific limits)
  'telemetry': {
    requests: 100,
    window: 60 * 1000, // 1 minute
    keyPrefix: 'telemetry'
  },

  // Live telemetry endpoints (more restrictive)
  'telemetry_live': {
    requests: 60,
    window: 60 * 1000, // 1 minute
    keyPrefix: 'telemetry-live'
  },
  
  // Analytics endpoints (lower limit due to computation cost)
  'analytics': {
    requests: 20,
    window: 60 * 1000, // 1 minute
    keyPrefix: 'analytics'
  },
  
  // Bulk operations (very low limit)
  'bulk': {
    requests: 5,
    window: 60 * 1000, // 1 minute
    keyPrefix: 'bulk'
  },
  
  // Report generation (low limit)
  'reports': {
    requests: 10,
    window: 60 * 1000, // 1 minute
    keyPrefix: 'reports'
  }
};

// In-memory cache for demonstration (in production use Redis)
class SimpleCache {
  private cache = new Map<string, { data: any; expires: number }>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  set(key: string, data: any, ttlSeconds: number): void {
    const expires = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { data, expires });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  flush(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expires) {
        this.cache.delete(key);
      }
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      memoryUsage: process.memoryUsage()
    };
  }
}

const cache = new SimpleCache();

// Performance monitoring
class PerformanceMonitor {
  private static metrics = new Map<string, {
    requests: number;
    totalTime: number;
    avgTime: number;
    minTime: number;
    maxTime: number;
    errors: number;
    cacheHits: number;
    cacheMisses: number;
  }>();

  static recordRequest(endpoint: string, duration: number, error: boolean = false, cacheHit: boolean = false) {
    const existing = this.metrics.get(endpoint) || {
      requests: 0,
      totalTime: 0,
      avgTime: 0,
      minTime: Infinity,
      maxTime: 0,
      errors: 0,
      cacheHits: 0,
      cacheMisses: 0
    };

    existing.requests++;
    existing.totalTime += duration;
    existing.avgTime = existing.totalTime / existing.requests;
    existing.minTime = Math.min(existing.minTime, duration);
    existing.maxTime = Math.max(existing.maxTime, duration);
    
    if (error) existing.errors++;
    if (cacheHit) existing.cacheHits++;
    else existing.cacheMisses++;

    this.metrics.set(endpoint, existing);

    // Log slow requests
    if (duration > 2000) { // > 2 seconds
      logger.warn('Slow API request', {
        endpoint,
        duration,
        cacheHit,
        error
      });
    }
  }

  static getMetrics(): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [endpoint, metrics] of this.metrics.entries()) {
      result[endpoint] = {
        ...metrics,
        cacheHitRate: metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses) * 100,
        errorRate: metrics.errors / metrics.requests * 100
      };
    }
    return result;
  }

  static resetMetrics(): void {
    this.metrics.clear();
  }
}

// Middleware functions
export class VehicleAPIMiddleware {
  
  // Rate limiting middleware
  static rateLimit(endpointType: keyof typeof RATE_LIMITS, vehicleId?: string) {
    return async (request: NextRequest, userId: string): Promise<NextResponse | null> => {
      const config = RATE_LIMITS[endpointType];
      const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
      
      // For telemetry endpoints, include vehicleId in the rate limit key for per-vehicle limits
      const rateLimitKey = vehicleId && (endpointType === 'telemetry' || endpointType === 'telemetry_live') 
        ? `${config.keyPrefix}-${vehicleId}-${userId}-${clientIP}`
        : `${config.keyPrefix}-${userId}-${clientIP}`;
      
      const rateLimit = checkRateLimit(rateLimitKey, config.requests, config.window);
      
      if (!rateLimit.allowed) {
        logger.warn('Rate limit exceeded', {
          userId,
          clientIP,
          endpoint: request.url,
          endpointType,
          vehicleId
        });

        const errorMessage = vehicleId && (endpointType === 'telemetry' || endpointType === 'telemetry_live')
          ? `Rate limit exceeded for ${endpointType} operations on vehicle ${vehicleId}`
          : `Rate limit exceeded for ${endpointType} operations`;

        return createApiError(
          errorMessage,
          'RATE_LIMIT_EXCEEDED',
          429,
          { 
            resetTime: rateLimit.resetTime,
            remaining: rateLimit.remaining,
            limit: config.requests,
            windowMs: config.window,
            vehicleId
          },
          new URL(request.url).pathname,
          request.method
        );
      }

      return null; // No rate limiting applied
    };
  }

  // Caching middleware
  static cache(cacheType: keyof typeof CACHE_CONFIG) {
    return {
      // Get cached response
      get: (request: NextRequest, vehicleId?: string): any => {
        const config = CACHE_CONFIG[cacheType];
        const cacheKey = vehicleId ? 
          config.key(request, vehicleId) : 
          config.key(request);
        
        const cached = cache.get(cacheKey);
        
        if (cached) {
          logger.debug('Cache hit', { cacheKey, cacheType });
          return cached;
        }
        
        logger.debug('Cache miss', { cacheKey, cacheType });
        return null;
      },

      // Set cached response
      set: (request: NextRequest, data: any, vehicleId?: string): void => {
        const config = CACHE_CONFIG[cacheType];
        const cacheKey = vehicleId ? 
          config.key(request, vehicleId) : 
          config.key(request);
        
        cache.set(cacheKey, data, config.ttl);
        logger.debug('Cache set', { cacheKey, cacheType, ttl: config.ttl });
      },

      // Invalidate cache
      invalidate: (pattern: string): void => {
        // Simple pattern matching for cache invalidation
        // In production, use more sophisticated pattern matching
        if (pattern.includes('*')) {
          const prefix = pattern.replace('*', '');
          // Implementation would vary based on cache system
          logger.info('Cache pattern invalidation', { pattern });
        } else {
          cache.delete(pattern);
          logger.debug('Cache invalidation', { key: pattern });
        }
      }
    };
  }

  // Performance monitoring middleware
  static monitor(endpointName: string) {
    return {
      start: (): { startTime: number } => {
        return { startTime: Date.now() };
      },

      end: (context: { startTime: number }, error: boolean = false, cacheHit: boolean = false): void => {
        const duration = Date.now() - context.startTime;
        PerformanceMonitor.recordRequest(endpointName, duration, error, cacheHit);
      }
    };
  }

  // Request validation middleware
  static validateRequest(validationRules: {
    maxBodySize?: number;
    requiredHeaders?: string[];
    allowedMethods?: string[];
  }) {
    return async (request: NextRequest): Promise<NextResponse | null> => {
      // Method validation
      if (validationRules.allowedMethods && 
          !validationRules.allowedMethods.includes(request.method)) {
        return createApiError(
          `Method ${request.method} not allowed`,
          'METHOD_NOT_ALLOWED',
          405,
          { allowedMethods: validationRules.allowedMethods },
          new URL(request.url).pathname,
          request.method
        );
      }

      // Header validation
      if (validationRules.requiredHeaders) {
        const missingHeaders = validationRules.requiredHeaders.filter(
          header => !request.headers.get(header)
        );
        
        if (missingHeaders.length > 0) {
          return createApiError(
            'Required headers missing',
            'MISSING_REQUIRED_HEADERS',
            400,
            { missingHeaders },
            new URL(request.url).pathname,
            request.method
          );
        }
      }

      // Body size validation
      if (validationRules.maxBodySize && 
          ['POST', 'PUT', 'PATCH'].includes(request.method)) {
        const contentLength = request.headers.get('content-length');
        if (contentLength && parseInt(contentLength) > validationRules.maxBodySize) {
          return createApiError(
            'Request body too large',
            'BODY_TOO_LARGE',
            413,
            { maxSize: validationRules.maxBodySize, actualSize: contentLength },
            new URL(request.url).pathname,
            request.method
          );
        }
      }

      return null; // Validation passed
    };
  }

  // Response compression middleware
  static compress() {
    return (response: NextResponse): NextResponse => {
      // Add compression headers (actual compression would be handled by CDN/proxy)
      response.headers.set('Vary', 'Accept-Encoding');
      return response;
    };
  }

  // Security headers middleware
  static securityHeaders() {
    return (response: NextResponse): NextResponse => {
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('X-Frame-Options', 'DENY');
      response.headers.set('X-XSS-Protection', '1; mode=block');
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      response.headers.set('Content-Security-Policy', "default-src 'self'");
      
      // Cache control for API responses
      if (response.status === 200) {
        response.headers.set('Cache-Control', 'private, max-age=300'); // 5 minutes
      } else if (response.status >= 400) {
        response.headers.set('Cache-Control', 'private, no-cache, no-store');
      }
      
      return response;
    };
  }

  // Request/Response logging middleware
  static logging(endpointName: string) {
    return {
      logRequest: (request: NextRequest, userId?: string): void => {
        const logData = {
          endpoint: endpointName,
          method: request.method,
          url: request.url,
          userAgent: request.headers.get('user-agent'),
          clientIP: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
          userId,
          timestamp: new Date().toISOString()
        };

        logger.info('API Request', logData);
      },

      logResponse: (request: NextRequest, response: NextResponse, duration: number, userId?: string): void => {
        const logData = {
          endpoint: endpointName,
          method: request.method,
          url: request.url,
          status: response.status,
          duration,
          userId,
          timestamp: new Date().toISOString()
        };

        if (response.status >= 400) {
          logger.error('API Error Response', logData);
        } else if (duration > 1000) {
          logger.warn('Slow API Response', logData);
        } else {
          logger.info('API Response', logData);
        }
      }
    };
  }

  // Health check and metrics endpoint
  static getHealthMetrics() {
    return {
      cache: {
        ...cache.getStats(),
        config: Object.keys(CACHE_CONFIG).reduce((acc, key) => {
          acc[key] = { ttl: CACHE_CONFIG[key as keyof typeof CACHE_CONFIG].ttl };
          return acc;
        }, {} as Record<string, any>)
      },
      performance: PerformanceMonitor.getMetrics(),
      rateLimits: Object.keys(RATE_LIMITS).reduce((acc, key) => {
        acc[key] = {
          requests: RATE_LIMITS[key as keyof typeof RATE_LIMITS].requests,
          windowMs: RATE_LIMITS[key as keyof typeof RATE_LIMITS].window
        };
        return acc;
      }, {} as Record<string, any>),
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
      }
    };
  }

  // Cache management utilities
  static cacheManagement = {
    // Invalidate vehicle-related cache entries
    invalidateVehicleCache: (vehicleId: string): void => {
      cache.delete(`vehicle:${vehicleId}:detail`);
      cache.delete(`telemetry:${vehicleId}:*`);
      cache.delete(`compliance:${vehicleId}`);
      cache.delete(`maintenance:${vehicleId}:list`);
      
      // Invalidate list caches (would need more sophisticated pattern matching in production)
      logger.info('Vehicle cache invalidated', { vehicleId });
    },

    // Invalidate analytics cache
    invalidateAnalyticsCache: (): void => {
      // In production, would use pattern matching to delete analytics:* keys
      logger.info('Analytics cache invalidated');
    },

    // Clear all cache
    clearAllCache: (): void => {
      cache.flush();
      logger.info('All cache cleared');
    },

    // Get cache statistics
    getCacheStats: () => cache.getStats()
  };

  // Request timeout middleware
  static timeout(timeoutMs: number = 30000) {
    return async <T>(promise: Promise<T>): Promise<T> => {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Request timeout after ${timeoutMs}ms`));
        }, timeoutMs);
      });

      return Promise.race([promise, timeoutPromise]);
    };
  }
}

// Utility function to combine multiple middleware
export function combineMiddleware(...middlewares: Array<(req: NextRequest) => Promise<NextResponse | null>>) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    for (const middleware of middlewares) {
      const result = await middleware(request);
      if (result) {
        return result; // Middleware returned a response (usually an error)
      }
    }
    return null; // All middleware passed
  };
}

// Export cache instance for direct access
export { cache, PerformanceMonitor };