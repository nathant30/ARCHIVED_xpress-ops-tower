# XpressOps Monitoring & Observability Setup Guide

**Agent 12 - Integration Verification & Monitoring Specialist**

This document provides comprehensive instructions for setting up production monitoring and observability for the XpressOps platform.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Grafana Dashboards](#grafana-dashboards)
5. [Alert Rules](#alert-rules)
6. [Metrics Collection](#metrics-collection)
7. [Integration Setup](#integration-setup)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The XpressOps monitoring system provides real-time visibility into:
- **Frontend Performance**: Page load times, error rates, API calls, WebSocket connections
- **Backend API**: Request rates, response times, database performance, ECS health
- **Real-Time System**: WebSocket connections, message latency, vehicle tracking, alert delivery

### Key Metrics

| Category | Metrics | Target |
|----------|---------|--------|
| Frontend | Error rate | < 10/min |
| Frontend | Page load (p95) | < 2s |
| Frontend | API success rate | > 95% |
| Backend | Response time (p95) | < 2s |
| Backend | Error rate (5xx) | < 1% |
| Backend | DB connection pool | < 80% |
| Real-Time | WebSocket latency (p95) | < 500ms |
| Real-Time | Connection failures | < 5/min |
| Real-Time | Vehicle updates | > 100/min |

---

## Architecture

```
┌─────────────────┐
│   Frontend      │ ──▶ CloudWatch Logs ──▶ Prometheus
│   (Browser)     │
└─────────────────┘

┌─────────────────┐
│   Backend API   │ ──▶ CloudWatch ──▶ Prometheus
│   (ECS)         │
└─────────────────┘

┌─────────────────┐
│   SignalR Hub   │ ──▶ Custom Metrics ──▶ Prometheus
│   (WebSocket)   │
└─────────────────┘

                    ┌──────────────┐
                    │  Prometheus  │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │   Grafana    │ ──▶ Alerts ──▶ Slack/PagerDuty
                    └──────────────┘
```

---

## Prerequisites

### Required Tools

1. **Grafana** (v10.0+)
   ```bash
   # Install via Docker
   docker run -d -p 3000:3000 --name=grafana grafana/grafana
   ```

2. **Prometheus** (v2.45+)
   ```bash
   # Install via Docker
   docker run -d -p 9090:9090 --name=prometheus prom/prometheus
   ```

3. **CloudWatch Exporter** (for AWS metrics)
   ```bash
   docker run -d -p 9106:9106 prom/cloudwatch-exporter
   ```

### AWS Permissions

Required IAM permissions for CloudWatch metrics:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudwatch:GetMetricStatistics",
        "cloudwatch:ListMetrics",
        "ecs:DescribeServices",
        "ecs:DescribeTasks"
      ],
      "Resource": "*"
    }
  ]
}
```

---

## Grafana Dashboards

### 1. Frontend Monitoring Dashboard

**File**: `monitoring/grafana-dashboards/frontend-dashboard.json`

**Panels**:
- Error Rate (errors/min)
- Page Load Time (p50, p95, p99)
- API Call Success Rate
- WebSocket Connection Status
- Browser Errors by Type
- Active User Sessions
- JavaScript Heap Size
- API Response Time by Endpoint

**Import Steps**:
1. Open Grafana → Dashboards → Import
2. Upload `frontend-dashboard.json`
3. Select Prometheus data source
4. Click "Import"

### 2. Backend API Monitoring Dashboard

**File**: `monitoring/grafana-dashboards/backend-dashboard.json`

**Panels**:
- Request Rate (requests/sec)
- Response Time (p50, p95, p99)
- Error Rate (5xx, 4xx)
- CPU & Memory Usage
- Database Query Time
- Database Connection Pool
- ECS Service Health
- Top 10 Slowest Endpoints

**Import Steps**: Same as Frontend Dashboard

### 3. Real-Time System Dashboard

**File**: `monitoring/grafana-dashboards/real-time-dashboard.json`

**Panels**:
- Active WebSocket Connections
- WebSocket Message Rate
- WebSocket Latency (p50, p95, p99)
- Connection Failures
- Fleet Location Update Frequency
- KPI Update Frequency
- Alert Delivery Time
- Active Vehicles Tracked
- Vehicle Position Update Lag

**Import Steps**: Same as Frontend Dashboard

---

## Alert Rules

### Configuration File

**File**: `monitoring/alert-rules.yaml`

### Alert Severity Levels

| Severity | Response Time | Notification |
|----------|---------------|--------------|
| **Critical** | Immediate | Slack + PagerDuty |
| **Warning** | 5 minutes | Slack |
| **Info** | N/A | Slack (digest) |

### Critical Alerts

1. **HighFrontendErrorRate** - > 10 errors/min
2. **WebSocketConnectionFailures** - > 5 failures/min
3. **HighServerErrorRate** - > 1% of requests
4. **ECSServiceUnhealthy** - Service not meeting desired count
5. **NoActiveVehicles** - < 10 vehicles tracked

### Setting Up Alerts

1. **Import Alert Rules** to Prometheus:
   ```bash
   # Copy rules file
   cp monitoring/alert-rules.yaml /etc/prometheus/rules/

   # Update prometheus.yml
   rule_files:
     - "/etc/prometheus/rules/alert-rules.yaml"

   # Reload Prometheus
   curl -X POST http://localhost:9090/-/reload
   ```

2. **Configure Notification Channels** in Grafana:
   - Navigate to: Alerting → Notification channels
   - Add Slack webhook
   - Add PagerDuty integration key
   - Add email SMTP settings

---

## Metrics Collection

### Frontend Metrics

**Implementation**: Add to frontend application

```typescript
// Example: Browser error tracking
window.addEventListener('error', (event) => {
  sendMetric('frontend_errors_total', {
    error_type: event.error?.name || 'unknown',
    message: event.message,
  });
});

// Example: Page load tracking
window.addEventListener('load', () => {
  const loadTime = performance.now();
  sendMetric('frontend_page_load_duration', loadTime);
});

// Example: WebSocket connection status
socket.on('connect', () => {
  sendMetric('frontend_websocket_connected', 1);
});
socket.on('disconnect', () => {
  sendMetric('frontend_websocket_connected', 0);
});
```

**Send to CloudWatch**:
```typescript
import { CloudWatchClient, PutMetricDataCommand } from "@aws-sdk/client-cloudwatch";

async function sendMetric(name: string, value: number, dimensions: Record<string, string> = {}) {
  const client = new CloudWatchClient({ region: 'us-east-1' });

  const command = new PutMetricDataCommand({
    Namespace: 'XpressOps/Frontend',
    MetricData: [{
      MetricName: name,
      Value: value,
      Dimensions: Object.entries(dimensions).map(([Name, Value]) => ({ Name, Value })),
      Timestamp: new Date(),
    }],
  });

  await client.send(command);
}
```

### Backend Metrics

**Already Implemented**: Backend API exports Prometheus metrics at `/metrics` endpoint

**Verify**:
```bash
curl http://localhost:3001/metrics
```

### Real-Time Metrics

**SignalR Hub**: Add custom metrics for WebSocket operations

```csharp
// Example: Track connection count
_metrics.RecordConnectionCount(_connections.Count);

// Example: Track message latency
var stopwatch = Stopwatch.StartNew();
await SendMessageAsync(message);
_metrics.RecordMessageLatency(stopwatch.ElapsedMilliseconds);

// Example: Track vehicle updates
_metrics.IncrementVehicleUpdates();
```

---

## Integration Setup

### 1. Slack Integration

1. Create Slack App: https://api.slack.com/apps
2. Enable Incoming Webhooks
3. Get Webhook URL
4. Add to Grafana:
   - Alerting → Notification channels → Add channel
   - Type: Slack
   - Webhook URL: `https://hooks.slack.com/services/YOUR/WEBHOOK/URL`
   - Channel: `#alerts-production`

### 2. PagerDuty Integration

1. Create PagerDuty Service
2. Add Prometheus Integration
3. Get Integration Key
4. Add to Grafana:
   - Alerting → Notification channels → Add channel
   - Type: PagerDuty
   - Integration Key: `YOUR_INTEGRATION_KEY`

### 3. Email Notifications

Configure SMTP in Grafana:

**File**: `/etc/grafana/grafana.ini`

```ini
[smtp]
enabled = true
host = smtp.gmail.com:587
user = your-email@gmail.com
password = your-app-password
from_address = grafana@xpressops.com
from_name = XpressOps Monitoring
```

---

## Troubleshooting

### Dashboard Not Showing Data

**Check**:
1. Prometheus is scraping metrics:
   ```bash
   curl http://localhost:9090/api/v1/targets
   ```

2. Metrics exist in Prometheus:
   ```bash
   curl http://localhost:9090/api/v1/query?query=frontend_errors_total
   ```

3. Grafana data source is configured correctly:
   - Settings → Data Sources → Prometheus
   - Test connection

### Alerts Not Firing

**Check**:
1. Alert rules are loaded:
   ```bash
   curl http://localhost:9090/api/v1/rules
   ```

2. Alert manager is running:
   ```bash
   curl http://localhost:9093/-/healthy
   ```

3. Notification channels are configured in Grafana

### High CPU Usage on Prometheus

**Solutions**:
1. Reduce scrape frequency:
   ```yaml
   scrape_interval: 30s  # Increase from 15s
   ```

2. Increase storage retention:
   ```bash
   --storage.tsdb.retention.time=15d
   ```

3. Enable remote write to reduce local storage

### Missing Vehicle Updates

**Check**:
1. SignalR hub is running:
   ```bash
   curl http://localhost:3001/health
   ```

2. Vehicles are sending updates:
   ```bash
   # Check CloudWatch logs for vehicle updates
   aws logs tail /aws/ecs/xpressops --follow
   ```

3. WebSocket connections are active:
   ```promql
   signalr_connections_active
   ```

---

## Performance Baseline

See `PERFORMANCE-BASELINE.md` for expected performance metrics and load test results.

---

## Support

- **Documentation**: https://wiki.xpressops.com/monitoring
- **Runbooks**: https://wiki.xpressops.com/runbooks
- **Support**: ops-team@xpressops.com
- **Slack**: #monitoring-support

---

**Last Updated**: 2026-02-03
**Maintained By**: Agent 12 - Integration Verification & Monitoring Specialist
