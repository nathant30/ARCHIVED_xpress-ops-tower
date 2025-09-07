// API Gateway Core Infrastructure
// Centralized API management with authentication, rate limiting, and monitoring

import { NextRequest, NextResponse } from 'next/server';
import { Redis } from 'ioredis';
import { sign, verify } from 'jsonwebtoken';
import { createHash, randomBytes } from 'crypto';
import { z } from 'zod';

// Configuration
export interface ApiGatewayConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  rateLimiting: {
    windowMs: number;
    maxRequests: number;
    keyGenerator: (req: NextRequest) => string;
  };
  security: {
    enableCors: boolean;
    allowedOrigins: string[];
    enableApiKeyAuth: boolean;
    enableJwtAuth: boolean;
  };
  monitoring: {
    enableMetrics: boolean;
    enableLogging: boolean;
    slowQueryThreshold: number;
  };
}

// API Key Schema
export const ApiKeySchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  key: z.string().min(32),
  permissions: z.array(z.string()),
  rateLimits: z.object({
    requests: z.number().min(1),
    windowMs: z.number().min(1000),
  }),
  status: z.enum(['active', 'inactive', 'revoked']),
  metadata: z.record(z.string()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  expiresAt: z.date().optional(),
});

export type ApiKey = z.infer<typeof ApiKeySchema>;

// Rate Limiting Record
export interface RateLimitRecord {
  count: number;
  resetTime: number;
  windowStart: number;
}

// API Request Context
export interface ApiRequestContext {
  requestId: string;
  apiKey?: ApiKey;
  user?: {
    id: string;
    role: string;
    permissions: string[];
  };
  rateLimitInfo: {
    remaining: number;
    resetTime: number;
    limit: number;
  };
  startTime: number;
  endpoint: string;
  method: string;
}

export class ApiGateway {
  private redis: Redis;
  private config: ApiGatewayConfig;
  private metrics: Map<string, any> = new Map();

  constructor(config: ApiGatewayConfig) {
    this.config = config;
    this.redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
  }

  /**
   * Main gateway middleware - processes all API requests
   */
  async processRequest(
    request: NextRequest,
    endpoint: string,
    handler: (ctx: ApiRequestContext) => Promise<NextResponse>
  ): Promise<NextResponse> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      // Create request context
      const context: ApiRequestContext = {
        requestId,
        startTime,
        endpoint,
        method: request.method,
        rateLimitInfo: { remaining: 0, resetTime: 0, limit: 0 },
      };

      // Security checks
      const securityResult = await this.performSecurityChecks(request, context);
      if (securityResult.error) {
        return this.createErrorResponse(securityResult.error, 401, requestId);
      }
      context.apiKey = securityResult.apiKey;
      context.user = securityResult.user;

      // Rate limiting
      const rateLimitResult = await this.checkRateLimit(request, context);
      if (rateLimitResult.exceeded) {
        return this.createErrorResponse(
          'Rate limit exceeded',
          429,
          requestId,
          {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
          }
        );
      }
      context.rateLimitInfo = rateLimitResult;

      // Add rate limit headers to context for response
      const response = await handler(context);
      
      // Add standard headers
      response.headers.set('X-Request-ID', requestId);
      response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
      response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
      response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());

      // Log successful request
      await this.logRequest(request, context, response, Date.now() - startTime);

      return response;

    } catch (error) {
      const duration = Date.now() - startTime;
      await this.logError(requestId, endpoint, error, duration);
      return this.createErrorResponse('Internal server error', 500, requestId);
    }
  }

  /**
   * Perform security checks (API key, JWT, permissions)
   */
  private async performSecurityChecks(
    request: NextRequest,
    context: ApiRequestContext
  ): Promise<{
    error?: string;
    apiKey?: ApiKey;
    user?: any;
  }> {
    // Extract API key from header
    const apiKeyHeader = request.headers.get('X-API-Key');
    const authHeader = request.headers.get('Authorization');

    if (this.config.security.enableApiKeyAuth && apiKeyHeader) {
      const apiKey = await this.validateApiKey(apiKeyHeader);
      if (!apiKey) {
        return { error: 'Invalid API key' };
      }
      if (apiKey.status !== 'active') {
        return { error: 'API key is not active' };
      }
      if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
        return { error: 'API key has expired' };
      }
      
      // Check permissions for endpoint
      const hasPermission = this.checkEndpointPermission(context.endpoint, apiKey.permissions);
      if (!hasPermission) {
        return { error: 'Insufficient permissions' };
      }

      return { apiKey };
    }

    if (this.config.security.enableJwtAuth && authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const user = await this.validateJwtToken(token);
      if (!user) {
        return { error: 'Invalid or expired token' };
      }
      return { user };
    }

    // Check if endpoint requires authentication
    if (this.isProtectedEndpoint(context.endpoint)) {
      return { error: 'Authentication required' };
    }

    return {}; // No authentication required for this endpoint
  }

  /**
   * Check rate limits for the request
   */
  private async checkRateLimit(
    request: NextRequest,
    context: ApiRequestContext
  ): Promise<{
    exceeded: boolean;
    remaining: number;
    resetTime: number;
    limit: number;
  }> {
    const key = this.generateRateLimitKey(request, context);
    
    // Get rate limit configuration
    const rateLimitConfig = context.apiKey?.rateLimits || this.config.rateLimiting;
    const windowMs = rateLimitConfig.windowMs;
    const maxRequests = context.apiKey?.rateLimits?.requests || this.config.rateLimiting.maxRequests;

    const now = Date.now();
    const windowStart = Math.floor(now / windowMs) * windowMs;
    const resetTime = windowStart + windowMs;

    try {
      // Use Redis for distributed rate limiting
      const pipeline = this.redis.pipeline();
      const rateLimitKey = `rate_limit:${key}:${windowStart}`;

      pipeline.incr(rateLimitKey);
      pipeline.expire(rateLimitKey, Math.ceil(windowMs / 1000));
      
      const results = await pipeline.exec();
      const currentCount = results?.[0]?.[1] as number || 0;

      const remaining = Math.max(0, maxRequests - currentCount);
      const exceeded = currentCount > maxRequests;

      return {
        exceeded,
        remaining,
        resetTime,
        limit: maxRequests,
      };

    } catch (error) {
      // Fallback to in-memory rate limiting if Redis fails
      console.error('Redis rate limiting failed:', error);
      return {
        exceeded: false,
        remaining: maxRequests,
        resetTime,
        limit: maxRequests,
      };
    }
  }

  /**
   * Validate API key against database/cache
   */
  private async validateApiKey(apiKey: string): Promise<ApiKey | null> {
    try {
      // First check Redis cache
      const cachedKey = await this.redis.get(`api_key:${apiKey}`);
      if (cachedKey) {
        return JSON.parse(cachedKey);
      }

      // If not in cache, would query database here
      // For now, return null - implement database integration
      return null;

    } catch (error) {
      console.error('API key validation failed:', error);
      return null;
    }
  }

  /**
   * Validate JWT token
   */
  private async validateJwtToken(token: string): Promise<any | null> {
    try {
      const decoded = verify(token, this.config.jwt.secret) as any;
      return decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${randomBytes(8).toString('hex')}`;
  }

  /**
   * Generate rate limit key
   */
  private generateRateLimitKey(request: NextRequest, context: ApiRequestContext): string {
    if (context.apiKey) {
      return `api_key:${context.apiKey.id}`;
    }
    if (context.user) {
      return `user:${context.user.id}`;
    }
    return this.config.rateLimiting.keyGenerator(request);
  }

  /**
   * Check if endpoint is protected
   */
  private isProtectedEndpoint(endpoint: string): boolean {
    const publicEndpoints = ['/api/health', '/api/status', '/api/auth/login'];
    return !publicEndpoints.includes(endpoint);
  }

  /**
   * Check endpoint permissions
   */
  private checkEndpointPermission(endpoint: string, permissions: string[]): boolean {
    // Implement endpoint-to-permission mapping
    const endpointPermissions: Record<string, string[]> = {
      '/api/pricing': ['pricing:read', 'pricing:write'],
      '/api/drivers': ['drivers:read'],
      '/api/rides': ['rides:read', 'rides:write'],
      '/api/analytics': ['analytics:read'],
    };

    const requiredPermissions = endpointPermissions[endpoint] || [];
    return requiredPermissions.every(perm => permissions.includes(perm));
  }

  /**
   * Log successful request
   */
  private async logRequest(
    request: NextRequest,
    context: ApiRequestContext,
    response: NextResponse,
    duration: number
  ): Promise<void> {
    if (!this.config.monitoring.enableLogging) return;

    const logEntry = {
      requestId: context.requestId,
      method: request.method,
      endpoint: context.endpoint,
      statusCode: response.status,
      duration,
      userAgent: request.headers.get('user-agent'),
      apiKeyId: context.apiKey?.id,
      userId: context.user?.id,
      timestamp: new Date().toISOString(),
      rateLimitRemaining: context.rateLimitInfo.remaining,
    };

    try {
      // Store in Redis for log aggregation
      await this.redis.lpush('api_logs', JSON.stringify(logEntry));
      await this.redis.ltrim('api_logs', 0, 10000); // Keep last 10k logs

      // Update metrics
      this.updateMetrics(context.endpoint, duration, response.status);

    } catch (error) {
      console.error('Failed to log request:', error);
    }
  }

  /**
   * Log error
   */
  private async logError(
    requestId: string,
    endpoint: string,
    error: any,
    duration: number
  ): Promise<void> {
    const errorEntry = {
      requestId,
      endpoint,
      error: error.message || error,
      stack: error.stack,
      duration,
      timestamp: new Date().toISOString(),
    };

    try {
      await this.redis.lpush('api_errors', JSON.stringify(errorEntry));
      await this.redis.ltrim('api_errors', 0, 1000); // Keep last 1k errors
    } catch (redisError) {
      console.error('Failed to log error to Redis:', redisError);
    }

    console.error(`API Error [${requestId}]:`, error);
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(endpoint: string, duration: number, statusCode: number): void {
    if (!this.config.monitoring.enableMetrics) return;

    const key = `${endpoint}:${statusCode}`;
    const current = this.metrics.get(key) || { count: 0, totalDuration: 0, avgDuration: 0 };
    
    current.count += 1;
    current.totalDuration += duration;
    current.avgDuration = current.totalDuration / current.count;
    
    this.metrics.set(key, current);

    // Log slow queries
    if (duration > this.config.monitoring.slowQueryThreshold) {
      console.warn(`Slow API call: ${endpoint} took ${duration}ms`);
    }
  }

  /**
   * Create error response
   */
  private createErrorResponse(
    message: string,
    status: number,
    requestId: string,
    additionalHeaders?: Record<string, string>
  ): NextResponse {
    const response = NextResponse.json(
      {
        success: false,
        error: { code: `E${status}`, message },
        timestamp: new Date().toISOString(),
        requestId,
      },
      { status }
    );

    response.headers.set('X-Request-ID', requestId);
    
    if (additionalHeaders) {
      Object.entries(additionalHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
    }

    return response;
  }

  /**
   * Get current metrics
   */
  getMetrics(): Record<string, any> {
    return Object.fromEntries(this.metrics);
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; redis: boolean; uptime: number }> {
    let redisHealthy = true;
    try {
      await this.redis.ping();
    } catch {
      redisHealthy = false;
    }

    return {
      status: redisHealthy ? 'healthy' : 'degraded',
      redis: redisHealthy,
      uptime: process.uptime(),
    };
  }
}

// Create default configuration
export const createDefaultConfig = (): ApiGatewayConfig => ({
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: '24h',
  },
  rateLimiting: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 1000, // 1000 requests per minute
    keyGenerator: (req) => {
      const forwarded = req.headers.get('x-forwarded-for');
      const ip = forwarded ? forwarded.split(',')[0] : req.ip || 'unknown';
      return `ip:${ip}`;
    },
  },
  security: {
    enableCors: true,
    allowedOrigins: ['http://localhost:3000', 'http://localhost:4000'],
    enableApiKeyAuth: true,
    enableJwtAuth: true,
  },
  monitoring: {
    enableMetrics: true,
    enableLogging: true,
    slowQueryThreshold: 1000, // 1 second
  },
});

// Singleton instance
let gatewayInstance: ApiGateway | null = null;

export const getApiGateway = (): ApiGateway => {
  if (!gatewayInstance) {
    gatewayInstance = new ApiGateway(createDefaultConfig());
  }
  return gatewayInstance;
};