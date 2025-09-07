# Nexus AI - ML Infrastructure Foundation

## 🚀 Overview

Nexus AI is a production-ready ML infrastructure foundation for XPress Ops Tower, providing real-time event streaming, feature engineering, model training, and serving capabilities optimized for ride-hailing operations in the Philippines.

## 🏗️ Architecture

```
Driver/Passenger Apps → Event API → Feature Pipeline → ML Dashboard
                           ↓              ↓               ↓
                     Message Queue → Feature Store → Model Training
                           ↓              ↓               ↓
                   Event Processing → Real-time ML → Model Serving
```

## 📁 Components

### 1. Event Streaming (`/src/lib/ml/events/`)
- **Event Schemas**: TypeScript implementations of Python event types
- **Event Ingestion API**: High-throughput `/api/ml/events/ingest` endpoint
- **Stream Processing**: Real-time pattern detection and aggregations

### 2. Feature Engineering (`/src/lib/ml/features/`)
- **Feature Pipeline**: Real-time feature extraction from events
- **Driver Behavior Features**: Acceptance rates, response times, location patterns
- **Passenger Engagement Features**: Session duration, UI interactions, booking patterns
- **Contextual Features**: Weather, traffic, regional demand, holidays
- **Risk Signal Features**: Fraud detection, anomaly scoring

### 3. Feature Store (`/src/lib/ml/store/`)
- **Online Serving**: Sub-100ms feature retrieval for real-time inference
- **Offline Storage**: Historical features for model training
- **Feature Groups**: Organized by business domain (driver, passenger, contextual, risk)
- **Data Quality**: Monitoring, validation, and alerting

### 4. Model Training (`/src/lib/ml/training/`)
- **Training Pipeline**: Automated model training with hyperparameter optimization
- **Model Versioning**: Track model performance and deployments
- **A/B Testing**: Built-in experimentation framework
- **Auto-deployment**: Performance-based automatic deployment

### 5. ML Dashboard (`/src/app/nexus/`)
- **Real-time Metrics**: Events/sec, model performance, data freshness
- **Model Management**: Training status, deployment, performance monitoring
- **Feature Monitoring**: Data quality, freshness scores, issue tracking
- **Alert System**: Model drift, data quality issues, performance degradation

## 🚦 Quick Start

### Prerequisites
- Node.js 18+
- Redis (for event queue and feature cache)
- Docker (optional, for containerized deployment)

### 1. Start ML Infrastructure
```bash
# Start all ML services
./scripts/start-ml-infrastructure.sh

# Or using Docker Compose
docker-compose -f docker-compose.ml.yml up -d
```

### 2. Access Nexus Dashboard
```
http://localhost:4000/nexus
```

### 3. Send Events
```bash
curl -X POST http://localhost:4000/api/ml/events/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "events": [{
      "event_type": "driver_location_update",
      "user_id": "driver_123",
      "session_id": "session_456",
      "driver_id": "driver_123",
      "app_version": "1.0.0",
      "device_type": "android",
      "location": {"lat": 14.5995, "lng": 120.9842},
      "speed": 45.2,
      "heading": 180,
      "accuracy": 10
    }],
    "source": "driver_app",
    "batch_id": "batch_001"
  }'
```

## 📊 API Endpoints

### Event Ingestion
- `POST /api/ml/events/ingest` - Ingest event batches
- `GET /api/ml/events/ingest?check=health` - Health check
- `GET /api/ml/events/ingest?check=metrics` - Processing metrics

### AI Management
- `GET /api/ai/status` - Overall AI system status
- `GET /api/ai/status?component=training` - Training pipeline status
- `GET /api/ai/status?component=serving` - Model serving status
- `GET /api/ai/status?component=monitoring` - Monitoring status

### Feature Store (Internal APIs)
- Feature retrieval for model inference
- Feature quality monitoring
- Feature lineage tracking

## 🎯 ML Models Supported

### 1. Fraud Detection
- **Features**: Driver behavior, risk signals, contextual data
- **Target**: Binary fraud classification
- **Accuracy**: >94% (Philippine market optimized)

### 2. Demand Prediction
- **Features**: Passenger engagement, contextual, regional data
- **Target**: Demand level prediction
- **Use case**: Dynamic pricing, driver dispatch

### 3. Route Optimization
- **Features**: Traffic patterns, historical routes, real-time conditions
- **Target**: Optimal route suggestions
- **Integration**: Maps API, traffic data

### 4. Surge Pricing
- **Features**: Supply/demand ratios, event proximity, weather
- **Target**: Dynamic pricing multipliers
- **Compliance**: LTFRB regulation adherence

## 🌏 Philippines-Specific Optimizations

### Regional Features
- **Metro Manila**: EDSA traffic patterns, MRT/LRT integration
- **Cebu**: Island geography considerations
- **Davao**: Regional demand patterns
- **Provincial**: Holiday and festival adjustments

### Payment Integration
- **GCash**: Transaction pattern analysis
- **PayMaya**: Fraud detection optimization
- **Cash payments**: Risk scoring models

### Regulatory Compliance
- **LTFRB Integration**: Fare calculation compliance
- **Data Privacy**: DPA-compliant data handling
- **Regional Permits**: Territory-based operations

## 🔧 Configuration

### Environment Variables
```bash
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# Feature Store
FEATURE_STORE_RETENTION_DAYS=30
FEATURE_STORE_CACHE_TTL=3600

# ML Training
MAX_CONCURRENT_TRAINING_JOBS=2
MODEL_STORAGE_PATH=./data/models

# Monitoring
SLACK_WEBHOOK_URL=your_webhook_url
ALERT_THRESHOLDS_JSON={"accuracy_drop": 0.05}
```

### Feature Groups Configuration
```typescript
// Driver Behavior Features
const driverFeatures = {
  refresh_interval: 300, // 5 minutes
  retention_days: 30,
  features: [
    'acceptance_rate_1h',
    'avg_response_time_1h',
    'locations_per_hour',
    // ... more features
  ]
};
```

## 📈 Monitoring & Alerts

### Real-time Metrics
- **Event Processing**: 500-2000 events/second
- **Feature Computation**: <50ms average latency
- **Model Serving**: <100ms inference time
- **Data Freshness**: >95% features fresh within 5 minutes

### Alert Types
- **Model Drift**: Performance degradation detection
- **Data Quality**: Missing values, outliers, schema changes
- **Performance**: High latency, low throughput
- **System Health**: Service failures, resource exhaustion

### Dashboard Views
- **Overview**: System health, key metrics
- **Models**: Training status, performance, deployments
- **Features**: Quality scores, freshness, lineage
- **Pipeline**: Data flow, processing stages
- **Alerts**: Active issues, historical incidents

## 🔄 Data Pipeline Flow

```
1. Apps → Event Ingestion API (batch processing)
2. Event Queue → Stream Processing (real-time aggregations)
3. Feature Pipeline → Feature Extraction (ML-ready features)
4. Feature Store → Online/Offline Storage (serving & training)
5. Model Training → Automated retraining (performance monitoring)
6. Model Serving → Real-time Inference (sub-100ms)
7. Results → Business Logic Integration (fraud alerts, pricing)
```

## 🚀 Deployment

### Development
```bash
npm run dev
./scripts/start-ml-infrastructure.sh
```

### Production
```bash
docker-compose -f docker-compose.ml.yml up -d
```

### Kubernetes (Advanced)
```bash
kubectl apply -f k8s/ml-infrastructure/
```

## 🛠️ Troubleshooting

### Common Issues

1. **High Memory Usage**
   - Adjust Redis `maxmemory` settings
   - Reduce feature retention periods
   - Scale feature store horizontally

2. **Event Processing Lag**
   - Increase worker concurrency
   - Optimize feature extraction logic
   - Monitor Redis queue lengths

3. **Model Training Failures**
   - Check data quality in training pipeline
   - Verify feature availability
   - Review hyperparameter settings

### Debug Commands
```bash
# Check service health
curl http://localhost:4000/api/ml/events/ingest?check=health

# Monitor Redis queues
redis-cli llen ml:inference:queue

# View recent logs
tail -f logs/ml/nexus-ai.log
```

## 📚 Integration Examples

### Driver App Integration
```javascript
// Send driver location update
const locationEvent = {
  event_type: 'driver_location_update',
  user_id: driverId,
  session_id: sessionId,
  driver_id: driverId,
  location: currentLocation,
  speed: currentSpeed,
  // ... other fields
};

await fetch('/api/ml/events/ingest', {
  method: 'POST',
  body: JSON.stringify({
    events: [locationEvent],
    source: 'driver_app'
  })
});
```

### Fraud Detection Integration
```javascript
// Real-time fraud check
const fraudScore = await fetch('/api/ai/inference/fraud', {
  method: 'POST',
  body: JSON.stringify({
    user_id: passengerId,
    transaction_data: bookingDetails
  })
});

if (fraudScore.risk_level === 'high') {
  // Trigger fraud prevention workflow
}
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/nexus-enhancement`
3. Add ML components following existing patterns
4. Test with sample data: `npm run test:ml`
5. Submit pull request with performance metrics

## 📄 License

This ML infrastructure is part of XPress Ops Tower. See main LICENSE file.

---

**Nexus AI** - Powering intelligent ride-hailing operations in the Philippines 🇵🇭