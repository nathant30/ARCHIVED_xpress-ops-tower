// API Key Management Service
// Handles creation, validation, rotation, and lifecycle management of API keys

import { randomBytes, createHash } from 'crypto';
import { Redis } from 'ioredis';
import { z } from 'zod';
import { ApiKey, ApiKeySchema } from './core';

// API Key Creation Request
export const CreateApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  permissions: z.array(z.string()).min(1),
  rateLimits: z.object({
    requests: z.number().min(1).max(10000),
    windowMs: z.number().min(1000).max(3600000), // 1 second to 1 hour
  }).optional(),
  metadata: z.record(z.string()).optional(),
  expiresIn: z.number().optional(), // days from now
});

export type CreateApiKeyRequest = z.infer<typeof CreateApiKeySchema>;

// API Key Update Request
export const UpdateApiKeySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  permissions: z.array(z.string()).optional(),
  rateLimits: z.object({
    requests: z.number().min(1).max(10000),
    windowMs: z.number().min(1000).max(3600000),
  }).optional(),
  metadata: z.record(z.string()).optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

export type UpdateApiKeyRequest = z.infer<typeof UpdateApiKeySchema>;

// API Key Analytics
export interface ApiKeyAnalytics {
  keyId: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  lastUsed: Date | null;
  rateLimitHits: number;
  topEndpoints: Array<{
    endpoint: string;
    count: number;
  }>;
  dailyUsage: Array<{
    date: string;
    requests: number;
  }>;
}

export class ApiKeyService {
  private redis: Redis;
  private keyPrefix = 'api_key:';
  private metaPrefix = 'api_key_meta:';
  private analyticsPrefix = 'api_key_analytics:';

  constructor(redis: Redis) {
    this.redis = redis;
  }

  /**
   * Generate a secure API key
   */
  private generateApiKey(): string {
    const prefix = 'xops'; // Xpress Ops prefix
    const timestamp = Date.now().toString(36);
    const randomPart = randomBytes(24).toString('hex');
    return `${prefix}_${timestamp}_${randomPart}`;
  }

  /**
   * Generate API key ID
   */
  private generateKeyId(): string {
    return randomBytes(12).toString('hex');
  }

  /**
   * Create a new API key
   */
  async createApiKey(request: CreateApiKeyRequest, createdBy: string): Promise<{
    apiKey: ApiKey;
    key: string;
  }> {
    // Validate request
    const validatedRequest = CreateApiKeySchema.parse(request);

    const keyId = this.generateKeyId();
    const key = this.generateApiKey();
    const now = new Date();

    // Calculate expiration date
    const expiresAt = validatedRequest.expiresIn 
      ? new Date(now.getTime() + validatedRequest.expiresIn * 24 * 60 * 60 * 1000)
      : undefined;

    // Create API key object
    const apiKey: ApiKey = {
      id: keyId,
      name: validatedRequest.name,
      key: this.hashKey(key), // Store hashed version
      permissions: validatedRequest.permissions,
      rateLimits: validatedRequest.rateLimits || {
        requests: 1000,
        windowMs: 60000, // 1 minute
      },
      status: 'active',
      metadata: {
        ...validatedRequest.metadata,
        createdBy,
      },
      createdAt: now,
      updatedAt: now,
      expiresAt,
    };

    // Store in Redis with TTL if expires
    const ttl = expiresAt ? Math.floor((expiresAt.getTime() - now.getTime()) / 1000) : undefined;
    
    await this.redis.pipeline()
      .setex(`${this.keyPrefix}${key}`, ttl || 86400 * 365, JSON.stringify(apiKey)) // Default 1 year TTL
      .setex(`${this.metaPrefix}${keyId}`, ttl || 86400 * 365, JSON.stringify(apiKey))
      .sadd('api_keys:active', keyId)
      .exec();

    // Initialize analytics
    await this.initializeAnalytics(keyId);

    return { apiKey, key };
  }

  /**
   * Validate API key
   */
  async validateApiKey(key: string): Promise<ApiKey | null> {
    try {
      const data = await this.redis.get(`${this.keyPrefix}${key}`);
      if (!data) return null;

      const apiKey = JSON.parse(data);
      
      // Update last used timestamp
      await this.updateLastUsed(apiKey.id);
      
      return apiKey;
    } catch (error) {
      console.error('API key validation error:', error);
      return null;
    }
  }

  /**
   * Get API key by ID (without the actual key)
   */
  async getApiKeyById(keyId: string): Promise<Omit<ApiKey, 'key'> | null> {
    try {
      const data = await this.redis.get(`${this.metaPrefix}${keyId}`);
      if (!data) return null;

      const apiKey = JSON.parse(data);
      // Remove the actual key from response
      const { key, ...apiKeyWithoutKey } = apiKey;
      return apiKeyWithoutKey;
    } catch (error) {
      console.error('Get API key error:', error);
      return null;
    }
  }

  /**
   * List API keys (paginated)
   */
  async listApiKeys(options: {
    status?: 'active' | 'inactive' | 'revoked';
    limit?: number;
    offset?: number;
  } = {}): Promise<{
    keys: Omit<ApiKey, 'key'>[];
    total: number;
    hasMore: boolean;
  }> {
    const { status = 'active', limit = 50, offset = 0 } = options;
    
    try {
      // Get key IDs by status
      const keyIds = await this.redis.smembers(`api_keys:${status}`);
      const total = keyIds.length;
      
      // Apply pagination
      const paginatedKeyIds = keyIds.slice(offset, offset + limit);
      
      // Get key details
      const pipeline = this.redis.pipeline();
      paginatedKeyIds.forEach(keyId => {
        pipeline.get(`${this.metaPrefix}${keyId}`);
      });
      
      const results = await pipeline.exec();
      const keys = results
        ?.map(([err, result]) => {
          if (err || !result) return null;
          const apiKey = JSON.parse(result as string);
          const { key, ...apiKeyWithoutKey } = apiKey;
          return apiKeyWithoutKey;
        })
        .filter((key): key is Omit<ApiKey, 'key'> => key !== null) || [];

      return {
        keys,
        total,
        hasMore: offset + limit < total,
      };
    } catch (error) {
      console.error('List API keys error:', error);
      return { keys: [], total: 0, hasMore: false };
    }
  }

  /**
   * Update API key
   */
  async updateApiKey(keyId: string, updates: UpdateApiKeyRequest): Promise<boolean> {
    try {
      const existingKey = await this.getApiKeyById(keyId);
      if (!existingKey) return false;

      // Merge updates
      const updatedKey = {
        ...existingKey,
        ...updates,
        updatedAt: new Date(),
      };

      // Validate updated key
      ApiKeySchema.parse({ ...updatedKey, key: 'dummy' });

      // Update in Redis
      const originalKeyData = await this.redis.get(`${this.metaPrefix}${keyId}`);
      if (!originalKeyData) return false;

      const originalKey = JSON.parse(originalKeyData);
      const updatedKeyWithOriginalKey = { ...updatedKey, key: originalKey.key };

      await this.redis.pipeline()
        .set(`${this.metaPrefix}${keyId}`, JSON.stringify(updatedKeyWithOriginalKey))
        .set(`${this.keyPrefix}${originalKey.key}`, JSON.stringify(updatedKeyWithOriginalKey))
        .exec();

      // Update status sets if status changed
      if (updates.status && updates.status !== existingKey.status) {
        await this.redis.pipeline()
          .srem(`api_keys:${existingKey.status}`, keyId)
          .sadd(`api_keys:${updates.status}`, keyId)
          .exec();
      }

      return true;
    } catch (error) {
      console.error('Update API key error:', error);
      return false;
    }
  }

  /**
   * Revoke API key
   */
  async revokeApiKey(keyId: string, revokedBy: string): Promise<boolean> {
    try {
      const existingKey = await this.redis.get(`${this.metaPrefix}${keyId}`);
      if (!existingKey) return false;

      const apiKey = JSON.parse(existingKey);
      apiKey.status = 'revoked';
      apiKey.updatedAt = new Date();
      apiKey.metadata = {
        ...apiKey.metadata,
        revokedBy,
        revokedAt: new Date().toISOString(),
      };

      await this.redis.pipeline()
        .set(`${this.metaPrefix}${keyId}`, JSON.stringify(apiKey))
        .set(`${this.keyPrefix}${apiKey.key}`, JSON.stringify(apiKey))
        .srem('api_keys:active', keyId)
        .srem('api_keys:inactive', keyId)
        .sadd('api_keys:revoked', keyId)
        .exec();

      return true;
    } catch (error) {
      console.error('Revoke API key error:', error);
      return false;
    }
  }

  /**
   * Rotate API key
   */
  async rotateApiKey(keyId: string, rotatedBy: string): Promise<{
    newKey: string;
    apiKey: ApiKey;
  } | null> {
    try {
      const existingKeyData = await this.redis.get(`${this.metaPrefix}${keyId}`);
      if (!existingKeyData) return null;

      const existingKey = JSON.parse(existingKeyData);
      const newKey = this.generateApiKey();
      const now = new Date();

      // Create updated API key with new key
      const updatedApiKey = {
        ...existingKey,
        key: this.hashKey(newKey),
        updatedAt: now,
        metadata: {
          ...existingKey.metadata,
          rotatedBy,
          rotatedAt: now.toISOString(),
          previousKeyHash: existingKey.key,
        },
      };

      // Store new key and remove old key
      const ttl = existingKey.expiresAt 
        ? Math.floor((new Date(existingKey.expiresAt).getTime() - now.getTime()) / 1000)
        : 86400 * 365;

      await this.redis.pipeline()
        .del(`${this.keyPrefix}${existingKey.key}`) // Remove old key
        .setex(`${this.keyPrefix}${newKey}`, ttl, JSON.stringify(updatedApiKey))
        .setex(`${this.metaPrefix}${keyId}`, ttl, JSON.stringify(updatedApiKey))
        .exec();

      return { newKey, apiKey: updatedApiKey };
    } catch (error) {
      console.error('Rotate API key error:', error);
      return null;
    }
  }

  /**
   * Get API key analytics
   */
  async getApiKeyAnalytics(keyId: string, days = 30): Promise<ApiKeyAnalytics | null> {
    try {
      const pipeline = this.redis.pipeline();
      
      // Get basic stats
      pipeline.hgetall(`${this.analyticsPrefix}${keyId}:stats`);
      
      // Get daily usage for last N days
      const dailyKeys = [];
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split('T')[0];
        dailyKeys.push(dateKey);
        pipeline.get(`${this.analyticsPrefix}${keyId}:daily:${dateKey}`);
      }
      
      // Get top endpoints
      pipeline.zrevrange(`${this.analyticsPrefix}${keyId}:endpoints`, 0, 9, 'WITHSCORES');
      
      const results = await pipeline.exec();
      if (!results) return null;

      const stats = results[0]?.[1] as Record<string, string> || {};
      const endpointsData = results[results.length - 1]?.[1] as string[] || [];
      
      // Process endpoints data
      const topEndpoints = [];
      for (let i = 0; i < endpointsData.length; i += 2) {
        topEndpoints.push({
          endpoint: endpointsData[i],
          count: parseInt(endpointsData[i + 1] || '0'),
        });
      }

      // Process daily usage
      const dailyUsage = [];
      for (let i = 0; i < days; i++) {
        const result = results[1 + i]?.[1] as string | null;
        dailyUsage.push({
          date: dailyKeys[i],
          requests: parseInt(result || '0'),
        });
      }

      return {
        keyId,
        totalRequests: parseInt(stats.totalRequests || '0'),
        successfulRequests: parseInt(stats.successfulRequests || '0'),
        failedRequests: parseInt(stats.failedRequests || '0'),
        averageResponseTime: parseFloat(stats.averageResponseTime || '0'),
        lastUsed: stats.lastUsed ? new Date(stats.lastUsed) : null,
        rateLimitHits: parseInt(stats.rateLimitHits || '0'),
        topEndpoints,
        dailyUsage: dailyUsage.reverse(), // Most recent first
      };
    } catch (error) {
      console.error('Get API key analytics error:', error);
      return null;
    }
  }

  /**
   * Record API usage for analytics
   */
  async recordUsage(keyId: string, endpoint: string, responseTime: number, success: boolean): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const pipeline = this.redis.pipeline();

      // Update stats
      pipeline.hincrby(`${this.analyticsPrefix}${keyId}:stats`, 'totalRequests', 1);
      
      if (success) {
        pipeline.hincrby(`${this.analyticsPrefix}${keyId}:stats`, 'successfulRequests', 1);
      } else {
        pipeline.hincrby(`${this.analyticsPrefix}${keyId}:stats`, 'failedRequests', 1);
      }

      // Update daily usage
      pipeline.incr(`${this.analyticsPrefix}${keyId}:daily:${today}`);
      pipeline.expire(`${this.analyticsPrefix}${keyId}:daily:${today}`, 86400 * 90); // 90 days

      // Update endpoint usage
      pipeline.zincrby(`${this.analyticsPrefix}${keyId}:endpoints`, 1, endpoint);

      // Update average response time (simplified)
      pipeline.hset(`${this.analyticsPrefix}${keyId}:stats`, 'averageResponseTime', responseTime);

      await pipeline.exec();
    } catch (error) {
      console.error('Record usage error:', error);
    }
  }

  /**
   * Record rate limit hit
   */
  async recordRateLimitHit(keyId: string): Promise<void> {
    try {
      await this.redis.hincrby(`${this.analyticsPrefix}${keyId}:stats`, 'rateLimitHits', 1);
    } catch (error) {
      console.error('Record rate limit hit error:', error);
    }
  }

  /**
   * Clean up expired keys
   */
  async cleanupExpiredKeys(): Promise<number> {
    try {
      const allSets = ['api_keys:active', 'api_keys:inactive', 'api_keys:revoked'];
      let cleanedCount = 0;

      for (const set of allSets) {
        const keyIds = await this.redis.smembers(set);
        
        for (const keyId of keyIds) {
          const keyData = await this.redis.get(`${this.metaPrefix}${keyId}`);
          if (!keyData) {
            // Key doesn't exist, remove from set
            await this.redis.srem(set, keyId);
            cleanedCount++;
            continue;
          }

          const apiKey = JSON.parse(keyData);
          if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
            // Key expired, clean up
            await this.redis.pipeline()
              .del(`${this.keyPrefix}${apiKey.key}`)
              .del(`${this.metaPrefix}${keyId}`)
              .srem(set, keyId)
              .exec();
            cleanedCount++;
          }
        }
      }

      return cleanedCount;
    } catch (error) {
      console.error('Cleanup expired keys error:', error);
      return 0;
    }
  }

  /**
   * Hash API key for storage
   */
  private hashKey(key: string): string {
    return createHash('sha256').update(key).digest('hex');
  }

  /**
   * Update last used timestamp
   */
  private async updateLastUsed(keyId: string): Promise<void> {
    try {
      await this.redis.hset(
        `${this.analyticsPrefix}${keyId}:stats`, 
        'lastUsed', 
        new Date().toISOString()
      );
    } catch (error) {
      // Non-critical error, don't throw
      console.error('Update last used error:', error);
    }
  }

  /**
   * Initialize analytics for new key
   */
  private async initializeAnalytics(keyId: string): Promise<void> {
    try {
      const initialStats = {
        totalRequests: '0',
        successfulRequests: '0',
        failedRequests: '0',
        averageResponseTime: '0',
        rateLimitHits: '0',
        lastUsed: new Date().toISOString(),
      };

      await this.redis.hmset(`${this.analyticsPrefix}${keyId}:stats`, initialStats);
    } catch (error) {
      console.error('Initialize analytics error:', error);
    }
  }
}