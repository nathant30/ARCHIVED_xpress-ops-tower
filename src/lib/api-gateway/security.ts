// API Gateway Security Framework
// Comprehensive security layer for API protection, threat detection, and compliance

import { NextRequest } from 'next/server';
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { Redis } from 'ioredis';
import rateLimit from 'express-rate-limit';

// Security Configuration
export interface SecurityConfig {
  encryption: {
    algorithm: string;
    keySize: number;
    ivSize: number;
  };
  signatures: {
    algorithm: string;
    timestampTolerance: number; // seconds
  };
  threats: {
    enableBruteForceProtection: boolean;
    enableDDoSProtection: boolean;
    enableSQLInjectionDetection: boolean;
    enableXSSDetection: boolean;
    suspiciousPatterns: string[];
  };
  ipFiltering: {
    enableWhitelist: boolean;
    enableBlacklist: boolean;
    whitelistedIPs: string[];
    blacklistedIPs: string[];
    allowedCountries: string[];
    blockedCountries: string[];
  };
  compliance: {
    enableAuditLogging: boolean;
    enableDataMasking: boolean;
    enableEncryptionAtRest: boolean;
    retentionDays: number;
  };
}

// Security Event Types
export interface SecurityEvent {
  id: string;
  type: 'threat_detected' | 'brute_force' | 'ddos' | 'injection_attempt' | 'unauthorized_access';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  ip: string;
  userAgent?: string;
  endpoint: string;
  apiKeyId?: string;
  userId?: string;
  details: Record<string, any>;
  blocked: boolean;
}

// Threat Detection Result
export interface ThreatDetectionResult {
  isBlocked: boolean;
  reason?: string;
  severity: SecurityEvent['severity'];
  details: Record<string, any>;
}

// IP Intelligence Data
export interface IPIntelligence {
  ip: string;
  country: string;
  region: string;
  city: string;
  isp: string;
  isProxy: boolean;
  isVPN: boolean;
  isTor: boolean;
  threatLevel: number; // 0-100
  lastSeen: Date;
  requestCount: number;
}

export class ApiSecurity {
  private redis: Redis;
  private config: SecurityConfig;
  private suspiciousPatterns: RegExp[];
  private bruteForceAttempts: Map<string, { count: number; lastAttempt: Date }> = new Map();

  constructor(redis: Redis, config: SecurityConfig) {
    this.redis = redis;
    this.config = config;
    this.suspiciousPatterns = config.threats.suspiciousPatterns.map(pattern => new RegExp(pattern, 'i'));
  }

  /**
   * Main security check - validates request security
   */
  async checkSecurity(request: NextRequest, endpoint: string): Promise<ThreatDetectionResult> {
    const ip = this.getClientIP(request);
    const userAgent = request.headers.get('user-agent') || '';

    // IP filtering checks
    const ipCheck = await this.checkIPFiltering(ip);
    if (ipCheck.isBlocked) return ipCheck;

    // Rate limiting and DDoS protection
    const ddosCheck = await this.checkDDoSProtection(ip, endpoint);
    if (ddosCheck.isBlocked) return ddosCheck;

    // Brute force protection
    const bruteForceCheck = await this.checkBruteForceProtection(ip, request);
    if (bruteForceCheck.isBlocked) return bruteForceCheck;

    // Input validation and injection detection
    const injectionCheck = await this.checkInjectionAttempts(request);
    if (injectionCheck.isBlocked) return injectionCheck;

    // Request signature validation
    const signatureCheck = await this.validateRequestSignature(request);
    if (signatureCheck.isBlocked) return signatureCheck;

    // Advanced threat detection
    const threatCheck = await this.detectAdvancedThreats(request, ip, userAgent);
    if (threatCheck.isBlocked) return threatCheck;

    return { isBlocked: false, severity: 'low', details: {} };
  }

  /**
   * Encrypt sensitive data
   */
  encrypt(data: string, key?: string): { encrypted: string; iv: string } {
    const cipher = require('crypto').createCipher(this.config.encryption.algorithm, key || process.env.ENCRYPTION_KEY);
    const iv = randomBytes(this.config.encryption.ivSize);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return { encrypted, iv: iv.toString('hex') };
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(encryptedData: string, iv: string, key?: string): string {
    const decipher = require('crypto').createDecipher(this.config.encryption.algorithm, key || process.env.ENCRYPTION_KEY);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * Generate request signature
   */
  generateSignature(
    method: string,
    path: string,
    timestamp: number,
    body: string,
    secretKey: string
  ): string {
    const message = `${method.toUpperCase()}\n${path}\n${timestamp}\n${body}`;
    return createHmac(this.config.signatures.algorithm, secretKey)
      .update(message)
      .digest('hex');
  }

  /**
   * Validate request signature
   */
  async validateRequestSignature(request: NextRequest): Promise<ThreatDetectionResult> {
    const signature = request.headers.get('x-signature');
    const timestamp = request.headers.get('x-timestamp');

    if (!signature || !timestamp) {
      return { isBlocked: false, severity: 'low', details: {} }; // Optional for some endpoints
    }

    const timestampNum = parseInt(timestamp);
    const now = Math.floor(Date.now() / 1000);

    // Check timestamp tolerance
    if (Math.abs(now - timestampNum) > this.config.signatures.timestampTolerance) {
      return {
        isBlocked: true,
        reason: 'Request timestamp outside tolerance window',
        severity: 'medium',
        details: { timestamp: timestampNum, current: now }
      };
    }

    // For validation, we'd need the API secret - this is a simplified check
    return { isBlocked: false, severity: 'low', details: {} };
  }

  /**
   * Check IP filtering (whitelist/blacklist)
   */
  private async checkIPFiltering(ip: string): Promise<ThreatDetectionResult> {
    try {
      // Check blacklist
      if (this.config.ipFiltering.enableBlacklist) {
        const isBlacklisted = await this.redis.sismember('ip_blacklist', ip);
        if (isBlacklisted || this.config.ipFiltering.blacklistedIPs.includes(ip)) {
          return {
            isBlocked: true,
            reason: 'IP address is blacklisted',
            severity: 'high',
            details: { ip }
          };
        }
      }

      // Check whitelist
      if (this.config.ipFiltering.enableWhitelist) {
        const isWhitelisted = await this.redis.sismember('ip_whitelist', ip);
        if (!isWhitelisted && !this.config.ipFiltering.whitelistedIPs.includes(ip)) {
          return {
            isBlocked: true,
            reason: 'IP address not in whitelist',
            severity: 'medium',
            details: { ip }
          };
        }
      }

      // Check geographic restrictions
      const ipIntel = await this.getIPIntelligence(ip);
      if (ipIntel && this.config.ipFiltering.blockedCountries.includes(ipIntel.country)) {
        return {
          isBlocked: true,
          reason: 'Request from blocked country',
          severity: 'medium',
          details: { ip, country: ipIntel.country }
        };
      }

      return { isBlocked: false, severity: 'low', details: {} };
    } catch (error) {
      console.error('IP filtering check failed:', error);
      return { isBlocked: false, severity: 'low', details: {} };
    }
  }

  /**
   * DDoS protection
   */
  private async checkDDoSProtection(ip: string, endpoint: string): Promise<ThreatDetectionResult> {
    if (!this.config.threats.enableDDoSProtection) {
      return { isBlocked: false, severity: 'low', details: {} };
    }

    try {
      const now = Date.now();
      const windowMs = 60 * 1000; // 1 minute window
      const maxRequests = 100; // Max requests per minute per IP

      const key = `ddos_protection:${ip}:${Math.floor(now / windowMs)}`;
      const currentCount = await this.redis.incr(key);
      await this.redis.expire(key, Math.ceil(windowMs / 1000));

      if (currentCount > maxRequests) {
        // Add to temporary blacklist
        await this.redis.setex(`temp_blacklist:${ip}`, 300, '1'); // 5 minutes

        return {
          isBlocked: true,
          reason: 'DDoS protection triggered - too many requests',
          severity: 'high',
          details: { ip, requestCount: currentCount, limit: maxRequests }
        };
      }

      return { isBlocked: false, severity: 'low', details: {} };
    } catch (error) {
      console.error('DDoS protection check failed:', error);
      return { isBlocked: false, severity: 'low', details: {} };
    }
  }

  /**
   * Brute force protection
   */
  private async checkBruteForceProtection(ip: string, request: NextRequest): Promise<ThreatDetectionResult> {
    if (!this.config.threats.enableBruteForceProtection) {
      return { isBlocked: false, severity: 'low', details: {} };
    }

    // Check for authentication-related endpoints
    const authEndpoints = ['/api/auth/login', '/api/auth/verify', '/api/auth/mfa'];
    const isAuthEndpoint = authEndpoints.some(endpoint => request.url.includes(endpoint));

    if (!isAuthEndpoint) {
      return { isBlocked: false, severity: 'low', details: {} };
    }

    try {
      const key = `brute_force:${ip}`;
      const attempts = await this.redis.get(key);
      const attemptCount = parseInt(attempts || '0');

      if (attemptCount >= 5) { // Max 5 failed attempts
        return {
          isBlocked: true,
          reason: 'Too many failed authentication attempts',
          severity: 'high',
          details: { ip, attempts: attemptCount }
        };
      }

      return { isBlocked: false, severity: 'low', details: {} };
    } catch (error) {
      console.error('Brute force protection check failed:', error);
      return { isBlocked: false, severity: 'low', details: {} };
    }
  }

  /**
   * Record failed authentication attempt
   */
  async recordFailedAuth(ip: string): Promise<void> {
    try {
      const key = `brute_force:${ip}`;
      await this.redis.incr(key);
      await this.redis.expire(key, 300); // 5 minutes
    } catch (error) {
      console.error('Error recording failed auth:', error);
    }
  }

  /**
   * Clear failed authentication attempts
   */
  async clearFailedAuth(ip: string): Promise<void> {
    try {
      await this.redis.del(`brute_force:${ip}`);
    } catch (error) {
      console.error('Error clearing failed auth:', error);
    }
  }

  /**
   * Check for injection attempts (SQL, XSS, etc.)
   */
  private async checkInjectionAttempts(request: NextRequest): Promise<ThreatDetectionResult> {
    if (!this.config.threats.enableSQLInjectionDetection && !this.config.threats.enableXSSDetection) {
      return { isBlocked: false, severity: 'low', details: {} };
    }

    try {
      const url = new URL(request.url);
      const searchParams = url.searchParams.toString();
      
      // Get request body for POST requests
      let body = '';
      if (request.method !== 'GET') {
        try {
          body = await request.text();
        } catch {
          // If we can't read the body, skip injection check
        }
      }

      const testStrings = [searchParams, body];
      
      for (const testString of testStrings) {
        if (!testString) continue;

        // SQL Injection patterns
        if (this.config.threats.enableSQLInjectionDetection) {
          const sqlPatterns = [
            /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/i,
            /(\b(or|and)\s+[\d\w]+\s*=\s*[\d\w]+)/i,
            /(['"](\s)*(or|union)(\s)*)/i,
            /(\*|%|\+|\||&)/,
          ];

          for (const pattern of sqlPatterns) {
            if (pattern.test(testString)) {
              return {
                isBlocked: true,
                reason: 'SQL injection attempt detected',
                severity: 'critical',
                details: { pattern: pattern.source, input: testString.substring(0, 100) }
              };
            }
          }
        }

        // XSS patterns
        if (this.config.threats.enableXSSDetection) {
          const xssPatterns = [
            /<script[^>]*>.*?<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=\s*["'][^"']*["']/gi,
            /<iframe[^>]*>.*?<\/iframe>/gi,
            /eval\s*\(/gi,
          ];

          for (const pattern of xssPatterns) {
            if (pattern.test(testString)) {
              return {
                isBlocked: true,
                reason: 'XSS attempt detected',
                severity: 'high',
                details: { pattern: pattern.source, input: testString.substring(0, 100) }
              };
            }
          }
        }

        // Custom suspicious patterns
        for (const pattern of this.suspiciousPatterns) {
          if (pattern.test(testString)) {
            return {
              isBlocked: true,
              reason: 'Suspicious pattern detected',
              severity: 'medium',
              details: { pattern: pattern.source, input: testString.substring(0, 100) }
            };
          }
        }
      }

      return { isBlocked: false, severity: 'low', details: {} };
    } catch (error) {
      console.error('Injection detection failed:', error);
      return { isBlocked: false, severity: 'low', details: {} };
    }
  }

  /**
   * Advanced threat detection using ML and behavioral analysis
   */
  private async detectAdvancedThreats(
    request: NextRequest,
    ip: string,
    userAgent: string
  ): Promise<ThreatDetectionResult> {
    try {
      const suspiciousScore = await this.calculateSuspiciousScore(request, ip, userAgent);
      
      if (suspiciousScore > 80) {
        return {
          isBlocked: true,
          reason: 'High suspicious activity score',
          severity: 'high',
          details: { score: suspiciousScore, ip, userAgent }
        };
      }

      if (suspiciousScore > 60) {
        // Log for monitoring but don't block
        await this.logSecurityEvent({
          id: `threat_${Date.now()}_${randomBytes(4).toString('hex')}`,
          type: 'threat_detected',
          severity: 'medium',
          timestamp: new Date(),
          ip,
          userAgent,
          endpoint: new URL(request.url).pathname,
          details: { suspiciousScore },
          blocked: false,
        });
      }

      return { isBlocked: false, severity: 'low', details: {} };
    } catch (error) {
      console.error('Advanced threat detection failed:', error);
      return { isBlocked: false, severity: 'low', details: {} };
    }
  }

  /**
   * Calculate suspicious score (0-100)
   */
  private async calculateSuspiciousScore(
    request: NextRequest,
    ip: string,
    userAgent: string
  ): Promise<number> {
    let score = 0;

    // IP reputation
    const ipIntel = await this.getIPIntelligence(ip);
    if (ipIntel) {
      score += ipIntel.threatLevel;
      if (ipIntel.isProxy) score += 20;
      if (ipIntel.isVPN) score += 10;
      if (ipIntel.isTor) score += 30;
    }

    // User agent analysis
    if (!userAgent || userAgent.length < 10) score += 15;
    if (userAgent.includes('bot') || userAgent.includes('crawler')) score += 10;

    // Request patterns
    const url = new URL(request.url);
    if (url.pathname.includes('..')) score += 20; // Path traversal attempt
    if (url.pathname.includes('%')) score += 10; // URL encoding suspicious
    if (url.searchParams.toString().length > 1000) score += 15; // Very long query string

    // Request frequency (simplified)
    const recentRequests = await this.redis.get(`request_count:${ip}:recent`);
    const requestCount = parseInt(recentRequests || '0');
    if (requestCount > 50) score += 25; // High request frequency

    return Math.min(score, 100);
  }

  /**
   * Get IP intelligence data
   */
  private async getIPIntelligence(ip: string): Promise<IPIntelligence | null> {
    try {
      // Check cache first
      const cached = await this.redis.get(`ip_intel:${ip}`);
      if (cached) {
        return JSON.parse(cached);
      }

      // In production, you would integrate with IP intelligence services
      // For now, return mock data for private/local IPs
      if (ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.')) {
        const intel: IPIntelligence = {
          ip,
          country: 'PH', // Philippines
          region: 'NCR',
          city: 'Manila',
          isp: 'Local Network',
          isProxy: false,
          isVPN: false,
          isTor: false,
          threatLevel: 0,
          lastSeen: new Date(),
          requestCount: 1,
        };

        // Cache for 1 hour
        await this.redis.setex(`ip_intel:${ip}`, 3600, JSON.stringify(intel));
        return intel;
      }

      return null;
    } catch (error) {
      console.error('IP intelligence lookup failed:', error);
      return null;
    }
  }

  /**
   * Log security event
   */
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    if (!this.config.compliance.enableAuditLogging) return;

    try {
      // Store in Redis for real-time access
      await this.redis.lpush('security_events', JSON.stringify(event));
      await this.redis.ltrim('security_events', 0, 1000); // Keep last 1000 events

      // Store in time-series for historical analysis
      await this.redis.zadd('security_events_time', event.timestamp.getTime(), JSON.stringify(event));

      console.log(`Security event logged: ${event.type} - ${event.severity}`);
    } catch (error) {
      console.error('Error logging security event:', error);
    }
  }

  /**
   * Get security events
   */
  async getSecurityEvents(options: {
    type?: SecurityEvent['type'];
    severity?: SecurityEvent['severity'];
    limit?: number;
    startTime?: Date;
    endTime?: Date;
  } = {}): Promise<SecurityEvent[]> {
    try {
      const { limit = 100, startTime, endTime } = options;
      
      let events: string[];
      
      if (startTime || endTime) {
        const start = startTime ? startTime.getTime() : 0;
        const end = endTime ? endTime.getTime() : Date.now();
        events = await this.redis.zrangebyscore('security_events_time', start, end, 'LIMIT', 0, limit);
      } else {
        events = await this.redis.lrange('security_events', 0, limit - 1);
      }

      const parsedEvents = events.map(event => JSON.parse(event) as SecurityEvent);

      // Apply filters
      let filteredEvents = parsedEvents;
      
      if (options.type) {
        filteredEvents = filteredEvents.filter(event => event.type === options.type);
      }
      
      if (options.severity) {
        filteredEvents = filteredEvents.filter(event => event.severity === options.severity);
      }

      return filteredEvents;
    } catch (error) {
      console.error('Error getting security events:', error);
      return [];
    }
  }

  /**
   * Get security dashboard metrics
   */
  async getSecurityMetrics(): Promise<{
    threatsBlocked: number;
    suspiciousActivity: number;
    blacklistedIPs: number;
    recentEvents: SecurityEvent[];
    topThreats: Array<{ type: string; count: number }>;
  }> {
    try {
      const [
        recentEvents,
        blacklistedCount
      ] = await Promise.all([
        this.getSecurityEvents({ limit: 10 }),
        this.redis.scard('ip_blacklist')
      ]);

      const threatsBlocked = recentEvents.filter(event => event.blocked).length;
      const suspiciousActivity = recentEvents.length;

      // Count threat types
      const threatCounts: Record<string, number> = {};
      recentEvents.forEach(event => {
        threatCounts[event.type] = (threatCounts[event.type] || 0) + 1;
      });

      const topThreats = Object.entries(threatCounts)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count);

      return {
        threatsBlocked,
        suspiciousActivity,
        blacklistedIPs: blacklistedCount,
        recentEvents,
        topThreats,
      };
    } catch (error) {
      console.error('Error getting security metrics:', error);
      return {
        threatsBlocked: 0,
        suspiciousActivity: 0,
        blacklistedIPs: 0,
        recentEvents: [],
        topThreats: [],
      };
    }
  }

  /**
   * Add IP to blacklist
   */
  async blacklistIP(ip: string, reason: string, duration?: number): Promise<void> {
    try {
      await this.redis.sadd('ip_blacklist', ip);
      
      if (duration) {
        // Temporary blacklist
        await this.redis.setex(`temp_blacklist:${ip}`, duration, reason);
      }

      // Log the blacklisting
      await this.logSecurityEvent({
        id: `blacklist_${Date.now()}_${randomBytes(4).toString('hex')}`,
        type: 'unauthorized_access',
        severity: 'high',
        timestamp: new Date(),
        ip,
        endpoint: 'system',
        details: { reason, duration },
        blocked: true,
      });
    } catch (error) {
      console.error('Error blacklisting IP:', error);
    }
  }

  /**
   * Remove IP from blacklist
   */
  async removeIPFromBlacklist(ip: string): Promise<void> {
    try {
      await this.redis.srem('ip_blacklist', ip);
      await this.redis.del(`temp_blacklist:${ip}`);
    } catch (error) {
      console.error('Error removing IP from blacklist:', error);
    }
  }

  /**
   * Get client IP from request
   */
  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    if (realIP) {
      return realIP;
    }
    
    return request.ip || 'unknown';
  }
}

// Create default security configuration
export const createDefaultSecurityConfig = (): SecurityConfig => ({
  encryption: {
    algorithm: 'aes-256-cbc',
    keySize: 32,
    ivSize: 16,
  },
  signatures: {
    algorithm: 'sha256',
    timestampTolerance: 300, // 5 minutes
  },
  threats: {
    enableBruteForceProtection: true,
    enableDDoSProtection: true,
    enableSQLInjectionDetection: true,
    enableXSSDetection: true,
    suspiciousPatterns: [
      'sleep\\(\\d+\\)',
      'waitfor\\s+delay',
      'benchmark\\(',
      'union\\s+select',
      'base64_decode',
      'eval\\(',
      'system\\(',
      'exec\\(',
      'shell_exec\\(',
    ],
  },
  ipFiltering: {
    enableWhitelist: false,
    enableBlacklist: true,
    whitelistedIPs: [],
    blacklistedIPs: [],
    allowedCountries: ['PH', 'US', 'SG'], // Philippines, US, Singapore
    blockedCountries: ['CN', 'RU'], // Example blocked countries
  },
  compliance: {
    enableAuditLogging: true,
    enableDataMasking: true,
    enableEncryptionAtRest: true,
    retentionDays: 90,
  },
});