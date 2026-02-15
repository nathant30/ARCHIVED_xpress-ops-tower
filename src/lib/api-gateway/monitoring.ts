// API Gateway Monitoring & Logging Infrastructure
// Comprehensive observability for API performance, errors, and business metrics

import { Redis } from 'ioredis';
import { EventEmitter } from 'events';

// Monitoring Event Types
export interface ApiMetricEvent {
  type: 'request' | 'error' | 'rateLimit' | 'authentication';
  timestamp: number;
  requestId: string;
  endpoint: string;
  method: string;
  statusCode?: number;
  duration?: number;
  apiKeyId?: string;
  userId?: string;
  error?: string;
  userAgent?: string;
  ip?: string;
  responseSize?: number;
}

// Aggregated Metrics
export interface ApiMetrics {
  requests: {
    total: number;
    successful: number;
    failed: number;
    ratelimited: number;
  };
  performance: {
    averageResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    slowestEndpoint: string;
    fastestEndpoint: string;
  };
  errors: {
    total: number;
    by4xx: number;
    by5xx: number;
    topErrors: Array<{ error: string; count: number }>;
  };
  endpoints: Array<{
    path: string;
    method: string;
    count: number;
    averageResponseTime: number;
    errorRate: number;
  }>;
  apiKeys: Array<{
    keyId: string;
    requests: number;
    errorRate: number;
    lastUsed: Date;
  }>;
  geographic: Array<{
    country: string;
    requests: number;
  }>;
}

// Alert Configuration
export interface AlertRule {
  id: string;
  name: string;
  type: 'threshold' | 'anomaly' | 'error_rate';
  metric: string;
  threshold?: number;
  timeWindow: number; // minutes
  condition: 'greater_than' | 'less_than' | 'equals';
  enabled: boolean;
  channels: ('email' | 'slack' | 'webhook')[];
  metadata: Record<string, any>;
}

// Alert Instance
export interface Alert {
  id: string;
  ruleId: string;
  triggered: Date;
  resolved?: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  value: number;
  threshold: number;
  metadata: Record<string, any>;
}

export class ApiMonitoring extends EventEmitter {
  private redis: Redis;
  private metricsBuffer: ApiMetricEvent[] = [];
  private bufferSize: number;
  private flushInterval: number;
  private flushTimer?: NodeJS.Timeout;
  private alertRules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, Alert> = new Map();

  constructor(
    redis: Redis, 
    options: { 
      bufferSize?: number; 
      flushInterval?: number; 
    } = {}
  ) {
    super();
    this.redis = redis;
    this.bufferSize = options.bufferSize || 100;
    this.flushInterval = options.flushInterval || 10000; // 10 seconds
    
    this.startFlushTimer();
    this.loadAlertRules();
  }

  /**
   * Record API metric event
   */
  recordEvent(event: ApiMetricEvent): void {
    this.metricsBuffer.push(event);

    // Emit event for real-time processing
    this.emit('metric', event);

    // Check alerts in real-time for critical metrics
    this.checkAlerts(event);

    // Flush buffer if full
    if (this.metricsBuffer.length >= this.bufferSize) {
      this.flush();
    }
  }

  /**
   * Get current metrics for time period
   */
  async getMetrics(options: {
    startTime?: Date;
    endTime?: Date;
    granularity?: 'minute' | 'hour' | 'day';
  } = {}): Promise<ApiMetrics> {
    const {
      startTime = new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
      endTime = new Date(),
      granularity = 'hour'
    } = options;

    try {
      const [
        requestMetrics,
        performanceMetrics,
        errorMetrics,
        endpointMetrics,
        apiKeyMetrics,
        geoMetrics
      ] = await Promise.all([
        this.getRequestMetrics(startTime, endTime),
        this.getPerformanceMetrics(startTime, endTime),
        this.getErrorMetrics(startTime, endTime),
        this.getEndpointMetrics(startTime, endTime),
        this.getApiKeyMetrics(startTime, endTime),
        this.getGeographicMetrics(startTime, endTime)
      ]);

      return {
        requests: requestMetrics,
        performance: performanceMetrics,
        errors: errorMetrics,
        endpoints: endpointMetrics,
        apiKeys: apiKeyMetrics,
        geographic: geoMetrics,
      };
    } catch (error) {
      console.error('Error getting metrics:', error);
      throw error;
    }
  }

  /**
   * Get real-time metrics (last 5 minutes)
   */
  async getRealTimeMetrics(): Promise<{
    requestsPerSecond: number;
    averageResponseTime: number;
    errorRate: number;
    activeApiKeys: number;
    topEndpoints: Array<{ endpoint: string; rps: number }>;
  }> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const now = new Date();

    try {
      const pipeline = this.redis.pipeline();

      // Get recent events
      pipeline.zrangebyscore(
        'api_events',
        fiveMinutesAgo.getTime(),
        now.getTime(),
        'WITHSCORES'
      );

      const results = await pipeline.exec();
      const events = results?.[0]?.[1] as string[] || [];

      let totalRequests = 0;
      let totalErrors = 0;
      let totalResponseTime = 0;
      let responseTimeCount = 0;
      const apiKeys = new Set<string>();
      const endpoints = new Map<string, number>();

      // Process events
      for (let i = 0; i < events.length; i += 2) {
        const eventData = JSON.parse(events[i]);
        
        totalRequests++;
        
        if (eventData.apiKeyId) {
          apiKeys.add(eventData.apiKeyId);
        }

        if (eventData.duration) {
          totalResponseTime += eventData.duration;
          responseTimeCount++;
        }

        if (eventData.statusCode && eventData.statusCode >= 400) {
          totalErrors++;
        }

        // Track endpoint usage
        const endpointKey = `${eventData.method} ${eventData.endpoint}`;
        endpoints.set(endpointKey, (endpoints.get(endpointKey) || 0) + 1);
      }

      // Calculate RPS for top endpoints
      const topEndpoints = Array.from(endpoints.entries())
        .map(([endpoint, count]) => ({
          endpoint,
          rps: count / (5 * 60), // 5 minutes in seconds
        }))
        .sort((a, b) => b.rps - a.rps)
        .slice(0, 5);

      return {
        requestsPerSecond: totalRequests / (5 * 60),
        averageResponseTime: responseTimeCount > 0 ? totalResponseTime / responseTimeCount : 0,
        errorRate: totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0,
        activeApiKeys: apiKeys.size,
        topEndpoints,
      };
    } catch (error) {
      console.error('Error getting real-time metrics:', error);
      return {
        requestsPerSecond: 0,
        averageResponseTime: 0,
        errorRate: 0,
        activeApiKeys: 0,
        topEndpoints: [],
      };
    }
  }

  /**
   * Create alert rule
   */
  async createAlertRule(rule: Omit<AlertRule, 'id'>): Promise<string> {
    const ruleId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const alertRule: AlertRule = { id: ruleId, ...rule };
    
    this.alertRules.set(ruleId, alertRule);
    
    try {
      await this.redis.hset('alert_rules', ruleId, JSON.stringify(alertRule));
      return ruleId;
    } catch (error) {
      console.error('Error creating alert rule:', error);
      throw error;
    }
  }

  /**
   * Get all alert rules
   */
  async getAlertRules(): Promise<AlertRule[]> {
    return Array.from(this.alertRules.values());
  }

  /**
   * Get active alerts
   */
  async getActiveAlerts(): Promise<Alert[]> {
    return Array.from(this.activeAlerts.values()).filter(alert => !alert.resolved);
  }

  /**
   * Get system health status
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'down';
    uptime: number;
    redis: boolean;
    metrics: {
      requestsPerSecond: number;
      errorRate: number;
      averageResponseTime: number;
    };
    alerts: number;
  }> {
    try {
      // Check Redis connectivity
      let redisHealthy = true;
      try {
        await this.redis.ping();
      } catch {
        redisHealthy = false;
      }

      // Get current metrics
      const realTimeMetrics = await this.getRealTimeMetrics();
      const activeAlertsCount = Array.from(this.activeAlerts.values()).filter(a => !a.resolved).length;

      // Determine overall status
      let status: 'healthy' | 'degraded' | 'down' = 'healthy';
      if (!redisHealthy) {
        status = 'down';
      } else if (realTimeMetrics.errorRate > 5 || activeAlertsCount > 0) {
        status = 'degraded';
      }

      return {
        status,
        uptime: process.uptime(),
        redis: redisHealthy,
        metrics: {
          requestsPerSecond: realTimeMetrics.requestsPerSecond,
          errorRate: realTimeMetrics.errorRate,
          averageResponseTime: realTimeMetrics.averageResponseTime,
        },
        alerts: activeAlertsCount,
      };
    } catch (error) {
      console.error('Error getting health status:', error);
      return {
        status: 'down',
        uptime: process.uptime(),
        redis: false,
        metrics: {
          requestsPerSecond: 0,
          errorRate: 0,
          averageResponseTime: 0,
        },
        alerts: 0,
      };
    }
  }

  /**
   * Generate performance report
   */
  async generatePerformanceReport(
    startTime: Date,
    endTime: Date
  ): Promise<{
    summary: {
      totalRequests: number;
      averageResponseTime: number;
      errorRate: number;
      uptime: number;
    };
    trends: Array<{
      timestamp: Date;
      requests: number;
      responseTime: number;
      errors: number;
    }>;
    topEndpoints: Array<{
      endpoint: string;
      requests: number;
      averageResponseTime: number;
      errorRate: number;
    }>;
    recommendations: string[];
  }> {
    try {
      const metrics = await this.getMetrics({ startTime, endTime });
      
      // Calculate summary
      const summary = {
        totalRequests: metrics.requests.total,
        averageResponseTime: metrics.performance.averageResponseTime,
        errorRate: metrics.requests.total > 0 
          ? (metrics.requests.failed / metrics.requests.total) * 100 
          : 0,
        uptime: process.uptime(),
      };

      // Get hourly trends
      const trends = await this.getHourlyTrends(startTime, endTime);

      // Top endpoints
      const topEndpoints = metrics.endpoints
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Generate recommendations
      const recommendations = this.generateRecommendations(metrics, summary);

      return {
        summary,
        trends,
        topEndpoints,
        recommendations,
      };
    } catch (error) {
      console.error('Error generating performance report:', error);
      throw error;
    }
  }

  /**
   * Private: Flush metrics buffer to Redis
   */
  private async flush(): Promise<void> {
    if (this.metricsBuffer.length === 0) return;

    try {
      const pipeline = this.redis.pipeline();
      const now = Date.now();

      // Store events in Redis sorted set for time-series queries
      this.metricsBuffer.forEach(event => {
        pipeline.zadd('api_events', event.timestamp, JSON.stringify(event));
        
        // Create time-based aggregations
        const hourKey = `metrics:hour:${Math.floor(event.timestamp / (60 * 60 * 1000))}`;
        const dayKey = `metrics:day:${Math.floor(event.timestamp / (24 * 60 * 60 * 1000))}`;
        
        // Increment counters
        pipeline.hincrby(hourKey, 'requests', 1);
        pipeline.hincrby(dayKey, 'requests', 1);
        
        if (event.duration) {
          pipeline.hincrby(hourKey, 'total_duration', event.duration);
          pipeline.hincrby(dayKey, 'total_duration', event.duration);
        }
        
        if (event.statusCode && event.statusCode >= 400) {
          pipeline.hincrby(hourKey, 'errors', 1);
          pipeline.hincrby(dayKey, 'errors', 1);
        }

        // Set expiration
        pipeline.expire(hourKey, 24 * 60 * 60); // 24 hours
        pipeline.expire(dayKey, 30 * 24 * 60 * 60); // 30 days
      });

      // Clean up old events (keep last 7 days)
      const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
      pipeline.zremrangebyscore('api_events', 0, sevenDaysAgo);

      await pipeline.exec();
      
      console.log(`Flushed ${this.metricsBuffer.length} metrics to Redis`);
      this.metricsBuffer = [];
    } catch (error) {
      console.error('Error flushing metrics:', error);
    }
  }

  /**
   * Private: Start flush timer
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  /**
   * Private: Load alert rules from Redis
   */
  private async loadAlertRules(): Promise<void> {
    try {
      const rules = await this.redis.hgetall('alert_rules');
      Object.entries(rules).forEach(([id, ruleJson]) => {
        const rule = JSON.parse(ruleJson);
        this.alertRules.set(id, rule);
      });
    } catch (error) {
      console.error('Error loading alert rules:', error);
    }
  }

  /**
   * Private: Check alerts for incoming events
   */
  private checkAlerts(event: ApiMetricEvent): void {
    this.alertRules.forEach(rule => {
      if (!rule.enabled) return;

      try {
        const shouldAlert = this.evaluateAlertRule(rule, event);
        if (shouldAlert) {
          this.triggerAlert(rule, event);
        }
      } catch (error) {
        console.error(`Error evaluating alert rule ${rule.id}:`, error);
      }
    });
  }

  /**
   * Private: Evaluate alert rule against event
   */
  private evaluateAlertRule(rule: AlertRule, event: ApiMetricEvent): boolean {
    // Simplified alert evaluation - expand based on needs
    switch (rule.type) {
      case 'threshold':
        if (rule.metric === 'response_time' && event.duration) {
          return rule.condition === 'greater_than' && event.duration > (rule.threshold || 1000);
        }
        if (rule.metric === 'error_rate' && event.statusCode && event.statusCode >= 400) {
          return true; // Simplified - would need more complex calculation
        }
        break;
      
      case 'error_rate':
        return event.statusCode !== undefined && event.statusCode >= 400;
    }
    
    return false;
  }

  /**
   * Private: Trigger alert
   */
  private async triggerAlert(rule: AlertRule, event: ApiMetricEvent): Promise<void> {
    const alertId = `${rule.id}_${Date.now()}`;
    const alert: Alert = {
      id: alertId,
      ruleId: rule.id,
      triggered: new Date(),
      severity: this.calculateSeverity(rule, event),
      message: `Alert: ${rule.name} - ${rule.metric} condition met`,
      value: event.duration || event.statusCode || 0,
      threshold: rule.threshold || 0,
      metadata: {
        endpoint: event.endpoint,
        requestId: event.requestId,
        ...rule.metadata,
      },
    };

    this.activeAlerts.set(alertId, alert);
    
    try {
      await this.redis.hset('active_alerts', alertId, JSON.stringify(alert));
      this.emit('alert', alert);
    } catch (error) {
      console.error('Error storing alert:', error);
    }
  }

  /**
   * Private: Calculate alert severity
   */
  private calculateSeverity(rule: AlertRule, event: ApiMetricEvent): Alert['severity'] {
    // Simplified severity calculation
    if (event.statusCode && event.statusCode >= 500) return 'critical';
    if (event.duration && event.duration > 5000) return 'high';
    if (event.statusCode && event.statusCode >= 400) return 'medium';
    return 'low';
  }

  /**
   * Private: Get request metrics
   */
  private async getRequestMetrics(startTime: Date, endTime: Date): Promise<ApiMetrics['requests']> {
    // Implementation would query Redis for aggregated request data
    return {
      total: 0,
      successful: 0,
      failed: 0,
      rateimited: 0,
    };
  }

  /**
   * Private: Get performance metrics
   */
  private async getPerformanceMetrics(startTime: Date, endTime: Date): Promise<ApiMetrics['performance']> {
    // Implementation would calculate performance metrics from Redis
    return {
      averageResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      slowestEndpoint: '',
      fastestEndpoint: '',
    };
  }

  /**
   * Private: Get error metrics
   */
  private async getErrorMetrics(startTime: Date, endTime: Date): Promise<ApiMetrics['errors']> {
    // Implementation would analyze error data from Redis
    return {
      total: 0,
      by4xx: 0,
      by5xx: 0,
      topErrors: [],
    };
  }

  /**
   * Private: Get endpoint metrics
   */
  private async getEndpointMetrics(startTime: Date, endTime: Date): Promise<ApiMetrics['endpoints']> {
    // Implementation would aggregate endpoint data
    return [];
  }

  /**
   * Private: Get API key metrics
   */
  private async getApiKeyMetrics(startTime: Date, endTime: Date): Promise<ApiMetrics['apiKeys']> {
    // Implementation would get API key usage data
    return [];
  }

  /**
   * Private: Get geographic metrics
   */
  private async getGeographicMetrics(startTime: Date, endTime: Date): Promise<ApiMetrics['geographic']> {
    // Implementation would analyze geographic distribution
    return [];
  }

  /**
   * Private: Get hourly trends
   */
  private async getHourlyTrends(startTime: Date, endTime: Date): Promise<Array<{
    timestamp: Date;
    requests: number;
    responseTime: number;
    errors: number;
  }>> {
    // Implementation would return hourly trend data
    return [];
  }

  /**
   * Private: Generate performance recommendations
   */
  private generateRecommendations(metrics: ApiMetrics, summary: any): string[] {
    const recommendations: string[] = [];

    if (summary.errorRate > 5) {
      recommendations.push('High error rate detected. Review failing endpoints and implement better error handling.');
    }

    if (summary.averageResponseTime > 1000) {
      recommendations.push('Average response time is high. Consider implementing caching or optimizing database queries.');
    }

    if (metrics.requests.ratelimited > metrics.requests.total * 0.1) {
      recommendations.push('High rate limiting activity. Consider adjusting rate limits or implementing request queuing.');
    }

    return recommendations;
  }

  /**
   * Cleanup and shutdown
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush(); // Final flush
    this.removeAllListeners();
  }
}