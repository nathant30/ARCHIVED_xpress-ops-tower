# Xpress Ops Tower - Comprehensive Monitoring System

## Overview

This monitoring system provides production-ready monitoring, alerting, and observability for the Xpress Ops Tower application. It includes metrics collection, error tracking, security monitoring, business analytics, and comprehensive alerting capabilities.

## Features

### 🔍 **Core Monitoring Infrastructure**
- **Metrics Collection**: Real-time collection of performance, business, and system metrics
- **Error Tracking**: Comprehensive error logging with categorization and trends
- **Database Monitoring**: Query performance tracking and connection pool monitoring
- **Health Checks**: Multi-layered health monitoring with detailed service status

### 🛡️ **Security Monitoring**
- **Threat Detection**: Real-time detection of brute force attacks, SQL injection, XSS
- **Rate Limiting**: Configurable rate limiting with automatic IP blocking
- **Suspicious Activity Tracking**: Pattern-based detection of malicious behavior
- **Security Event Logging**: Comprehensive audit trail of security-related events

### 📊 **Business Metrics**
- **Driver Analytics**: Active drivers, utilization rates, earnings tracking
- **Booking Analytics**: Creation, completion, cancellation rates and patterns  
- **Revenue Tracking**: Real-time revenue metrics with regional breakdowns
- **Customer Satisfaction**: Rating tracking and satisfaction metrics
- **Fraud Detection**: Risk scoring and fraud pattern detection

### 🚨 **Alerting System**
- **Multi-channel Alerts**: Email, Slack, SMS, and webhook notifications
- **Configurable Conditions**: Flexible alert conditions with thresholds and time windows
- **Alert Management**: Acknowledge, resolve, and manage alert lifecycle
- **Escalation Support**: Severity-based routing and escalation paths

### 📈 **Dashboard & Analytics**
- **Real-time Dashboard**: Comprehensive system overview with KPIs
- **Time-series Data**: Historical trends and performance analysis
- **Regional Analytics**: Performance comparison across regions
- **Custom Metrics**: Support for application-specific metrics

## Quick Start

### 1. Import the Monitoring System

```typescript
import { MonitoringSystem } from './lib/monitoring';

// Initialize the monitoring system (auto-called)
// MonitoringSystem.initialize();
```

### 2. Add Monitoring to API Routes

```typescript
import { createMonitoringMiddleware } from './lib/monitoring';

const monitoringMiddleware = createMonitoringMiddleware({
  trackPerformance: true,
  trackErrors: true,
  trackSecurity: true,
  slowQueryThreshold: 2000
});

// Use in your API routes
app.use(monitoringMiddleware);
```

### 3. Track Business Events

```typescript
import { businessMetricsTracker } from './lib/monitoring';

// Track booking creation
businessMetricsTracker.trackBookingMetric('CREATED', bookingId, 1, {
  region_id: 'manila',
  vehicle_type: 'sedan',
  estimated_fare: 150
});

// Track driver activity
businessMetricsTracker.trackDriverMetric('ONLINE', driverId, 1, {
  region_id: 'manila'
});
```

### 4. Handle Errors

```typescript
import { MonitoringSystem } from './lib/monitoring';

try {
  // Your code here
} catch (error) {
  const errorId = MonitoringSystem.trackError(error, {
    component: 'BookingService',
    action: 'createBooking',
    userId: 'user123'
  });
}
```

## API Endpoints

### Health Check
```
GET /api/monitoring/health
GET /api/monitoring/health?detailed=true
```

### Metrics
```
GET /api/monitoring/metrics
GET /api/monitoring/metrics?metric=http_requests_total&timeRange=24h
GET /api/monitoring/metrics?format=prometheus
POST /api/monitoring/metrics (custom metrics)
```

### Dashboard
```
GET /api/monitoring/dashboard
GET /api/monitoring/dashboard?timeRange=7d&details=true
GET /api/monitoring/dashboard?category=business
```

### Alerts
```
GET /api/monitoring/alerts
POST /api/monitoring/alerts
GET /api/monitoring/alerts/{id}
PUT /api/monitoring/alerts/{id}
DELETE /api/monitoring/alerts/{id}
```

## Configuration

### Environment Variables

```bash
# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=xpress_ops_tower
DATABASE_USER=xpress_user
DATABASE_PASSWORD=secure_password

# SMTP Configuration (for email alerts)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=alerts@company.com
SMTP_PASS=app_password
FROM_EMAIL=alerts@company.com

# Slack Configuration
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
SLACK_DEFAULT_CHANNEL=#alerts

# Twilio Configuration (for SMS alerts)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM_NUMBER=+1234567890

# Monitoring Configuration
NODE_ENV=production
USE_MOCK_DB=false
```

### Alert Configuration

```typescript
import { errorTracker } from './lib/monitoring';

// Create a performance alert
const alertId = errorTracker.registerAlert({
  name: 'High Response Time',
  description: 'API response time is above threshold',
  type: 'PERFORMANCE',
  severity: 'HIGH',
  conditions: [
    {
      metric: 'http_request_duration',
      operator: 'GT',
      threshold: 5000, // 5 seconds
      timeWindow: 15, // minutes
      aggregation: 'AVG'
    }
  ],
  actions: [
    {
      type: 'EMAIL',
      target: 'ops@company.com',
      enabled: true
    },
    {
      type: 'SLACK',
      target: '#alerts',
      enabled: true
    }
  ]
});
```

## Advanced Usage

### Custom Metrics

```typescript
import { metricsCollector } from './lib/monitoring';

// Record custom business metrics
metricsCollector.recordMetric('custom_kpi', 123.45, 'gauge', {
  department: 'operations',
  region: 'manila'
});

// Record performance metrics
metricsCollector.recordPerformanceMetric({
  endpoint: '/api/bookings',
  duration: 1234,
  success: true,
  statusCode: 200,
  userId: 'user123',
  region: 'manila'
});
```

### Security Monitoring

```typescript
import { securityMonitor } from './lib/monitoring';

// Check if request should be blocked
const blockCheck = securityMonitor.shouldBlockRequest({
  ipAddress: '192.168.1.1',
  endpoint: '/api/auth/login',
  method: 'POST',
  userAgent: 'Mozilla/5.0...',
  body: JSON.stringify(loginData)
});

if (blockCheck.blocked) {
  // Handle blocked request
  return res.status(429).json({ error: 'Rate limit exceeded' });
}

// Track authentication failures
securityMonitor.trackAuthFailure('192.168.1.1', 'user@example.com', {
  endpoint: '/api/auth/login',
  reason: 'invalid_password'
});
```

### Database Monitoring

```typescript
import { databaseMonitor } from './lib/monitoring';

// Get database performance report
const performance = databaseMonitor.getPerformanceSummary(60); // last 60 minutes
const slowQueries = databaseMonitor.getSlowQueriesReport(60);
const activeQueries = databaseMonitor.getActiveQueries();
```

### Business Analytics

```typescript
import { businessMetricsTracker } from './lib/monitoring';

// Get current KPIs
const kpis = businessMetricsTracker.getCurrentKPIs();

// Get business metrics summary
const summary = businessMetricsTracker.getBusinessMetricsSummary(24); // last 24 hours

// Get regional performance
const regionalData = businessMetricsTracker.getRegionalPerformance(24);
```

## Monitoring Best Practices

### 1. **Structured Logging**
- Always include context (userId, requestId, component, action)
- Use consistent log levels (DEBUG, INFO, WARN, ERROR, FATAL)
- Include performance metrics in logs

### 2. **Error Handling**
- Track all errors through the monitoring system
- Include relevant context and metadata
- Categorize errors for better analysis

### 3. **Performance Monitoring**
- Set appropriate thresholds for alerts
- Monitor both response time and throughput
- Track database query performance

### 4. **Security Monitoring**
- Monitor authentication failures
- Track suspicious patterns
- Set up alerts for security events

### 5. **Business Metrics**
- Track key business KPIs
- Monitor regional performance differences
- Set up alerts for business-critical thresholds

## Dashboard Examples

### System Health Dashboard
```typescript
const healthData = await fetch('/api/monitoring/dashboard?category=system');
// Returns: database health, system metrics, performance data
```

### Business Intelligence Dashboard
```typescript
const businessData = await fetch('/api/monitoring/dashboard?category=business&timeRange=7d');
// Returns: KPIs, regional performance, business metrics summary
```

### Security Dashboard
```typescript
const securityData = await fetch('/api/monitoring/dashboard?category=security&details=true');
// Returns: threats, events, attack patterns, blocked IPs
```

## Alerting Examples

### Critical System Alert
- **Trigger**: Database connection failures > 5 in 5 minutes
- **Actions**: Email to ops team, Slack notification, SMS to on-call engineer
- **Escalation**: Auto-escalate to management if not acknowledged in 15 minutes

### Business Performance Alert  
- **Trigger**: Active drivers < 50 for 10 minutes
- **Actions**: Email to operations manager, Slack to #operations
- **Context**: Regional breakdown, time-of-day analysis

### Security Alert
- **Trigger**: Brute force attack detected (5+ failed logins from same IP)
- **Actions**: Auto-block IP, email security team, Slack to #security
- **Follow-up**: Generate incident report, update threat intelligence

## Performance Considerations

### Metrics Collection
- Metrics are stored in-memory with configurable retention (default: 24 hours)
- Automatic cleanup of old metrics to prevent memory leaks
- Sampling for high-volume metrics to reduce overhead

### Database Impact
- Query monitoring adds minimal overhead (<1ms per query)
- Connection pool monitoring is lightweight
- Slow query detection uses configurable thresholds

### Alert Processing
- Alert evaluation runs every 30 seconds (configurable)
- Rate limiting prevents alert storms
- Automatic grouping of related alerts

## Troubleshooting

### Common Issues

1. **High Memory Usage**
   - Check metrics retention settings
   - Verify cleanup intervals are running
   - Monitor metrics collection frequency

2. **Missing Metrics**
   - Verify monitoring middleware is properly configured
   - Check for errors in metric collection
   - Ensure proper initialization

3. **Alerts Not Firing**
   - Check alert conditions and thresholds
   - Verify notification handlers are configured
   - Check alert evaluation intervals

4. **Performance Impact**
   - Monitor overhead of metrics collection
   - Adjust sampling rates if needed
   - Check database monitoring overhead

### Debug Mode

```bash
# Enable debug logging
NODE_ENV=development DEBUG=monitoring:* npm start
```

### Health Check Endpoints

- `/api/monitoring/health` - Basic health check
- `/api/monitoring/health?detailed=true` - Comprehensive health report
- `/api/monitoring/metrics` - System metrics overview

## Support and Maintenance

### Regular Tasks
- Review and update alert thresholds
- Clean up resolved alerts and old metrics
- Monitor system performance impact
- Update security patterns and rules

### Monitoring the Monitoring System
- Track monitoring system performance
- Monitor alert delivery success rates
- Review false positive rates
- Analyze metric collection efficiency

### Scaling Considerations
- For high-volume applications, consider external metrics storage (e.g., InfluxDB, Prometheus)
- Implement distributed tracing for microservices
- Use sampling for high-frequency metrics
- Consider separate monitoring infrastructure for production

---

For questions, issues, or contributions, please refer to the development team or create an issue in the project repository.