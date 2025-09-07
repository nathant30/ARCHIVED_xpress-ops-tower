# 🐍🔗 ML Python Integration Guide

Perfect! Your Python FastAPI service and TypeScript ML infrastructure now work together seamlessly. Here's the complete integration setup.

## 🏗️ Hybrid Architecture

```
Mobile Apps → TypeScript Event API → Python FastAPI → Feature Processing
     ↓              ↓                      ↓                ↓
Event Queue → Feature Pipeline → Python Features → Combined ML Pipeline
     ↓              ↓                      ↓                ↓
Real-time ML → TypeScript Models → Python Models → Unified Inference
```

## 🚀 Quick Integration Test

### 1. Start Both Services

```bash
# Terminal 1: Start your Python FastAPI service
cd /path/to/your/python/service
python event_api.py
# Should start on http://localhost:8000

# Terminal 2: Start TypeScript ML infrastructure  
cd /Users/nathan/Desktop/claude/Projects/ops-tower
./scripts/start-ml-infrastructure.sh
npm run dev
# Should start on http://localhost:4000
```

### 2. Test Integration

```bash
# Test Python service health via TypeScript bridge
curl http://localhost:4000/api/ml/bridge/python?action=health

# Send events to both systems simultaneously
curl -X POST http://localhost:4000/api/ml/bridge/python \
  -H "Content-Type: application/json" \
  -d '{
    "action": "test_integration"
  }'
```

## 📡 Event Flow Integration

### TypeScript → Python Bridge

Your TypeScript events are automatically converted and sent to your Python service:

```typescript
// TypeScript event format
const tsEvent = {
  event_type: "ride_request_response",
  user_id: "driver_123",
  session_id: "session_456",
  driver_id: "driver_123",
  request_id: "req_789",
  response: "accepted",
  response_time: 3.2,
  // ... other fields
};

// Automatically converted to Python format:
const pythonEvent = {
  event_type: "ride_request_response",
  user_id: "driver_123", 
  session_id: "session_456",
  timestamp: "2025-01-10T16:45:30Z",
  app_version: "1.0.0",
  device_type: "android",
  location: {"lat": 14.5995, "lng": 120.9842},
  data: {
    "response": "accepted",
    "response_time": 3.2,
    "request_id": "req_789"
  }
};
```

### 5-Stream Processing Pipeline

When events come into `/api/ml/events/ingest`, they're processed through **5 parallel streams**:

1. **TypeScript Feature Pipeline** → Real-time ML features
2. **Event Storage & Indexing** → Redis time-series storage  
3. **Real-time Aggregations** → Dashboard metrics
4. **ML Model Inference** → Fraud detection, demand prediction
5. **Python FastAPI Bridge** → Your Python feature extraction ✨

## 🎯 API Integration Points

### Main Event Ingestion
```bash
# Send events - automatically processed by both systems
POST http://localhost:4000/api/ml/events/ingest
{
  "events": [...],
  "source": "driver_app"
}
```

### Python Bridge Control
```bash
# Check Python service health
GET http://localhost:4000/api/ml/bridge/python?action=health

# Get Python-computed features  
GET http://localhost:4000/api/ml/bridge/python?action=features&user_id=driver_123

# Send events only to Python
POST http://localhost:4000/api/ml/bridge/python
{
  "action": "send_batch",
  "events": [...]
}

# Hybrid processing (both systems)
POST http://localhost:4000/api/ml/bridge/python  
{
  "action": "hybrid_process",
  "events": [...]
}
```

## 🔧 Configuration

### Environment Variables

Add to your `.env` file:
```env
# Python FastAPI Integration
PYTHON_EVENT_API_URL=http://localhost:8000
PYTHON_SERVICE_TIMEOUT=5000
ENABLE_PYTHON_BRIDGE=true

# Feature Store Integration  
HYBRID_FEATURE_MODE=true
FEATURE_SYNC_INTERVAL=300
```

### Python Service Configuration

Ensure your Python service is configured for production:

```python
# In your event_api.py
import os

# Configuration
REDIS_HOST = os.getenv('REDIS_HOST', 'localhost')
REDIS_PORT = int(os.getenv('REDIS_PORT', 6379))
API_HOST = os.getenv('API_HOST', '0.0.0.0')  
API_PORT = int(os.getenv('API_PORT', 8000))

# For production, also add:
CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:4000').split(',')

from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
```

## 📊 Combined Feature Store

Your features from both systems are automatically combined:

```typescript
// Get features from both TypeScript and Python
const combinedFeatures = await fetch(
  '/api/ml/bridge/python?action=features&user_id=driver_123'
);

// Response structure:
{
  "python_features": {
    "user_id": "driver_123",
    "features": {
      "response_time": 3.2,
      "acceptance_rate": 0.85,
      "recent_rejections": 2,
      // ... Python-computed features
    }
  },
  "combined_features": {
    "python_features": { /* Python features */ },
    "typescript_features": { /* TypeScript features */ }, 
    "combined": { /* Merged feature set */ }
  }
}
```

## 🔄 Data Synchronization

### Redis Shared Storage

Both systems use the same Redis instance:

```python
# Python side - your existing Redis client
redis_client = redis.Redis(host='localhost', port=6379, db=0)

# TypeScript side - same Redis  
const redis = new Redis({ host: 'localhost', port: 6379 });
```

### Feature Store Sync

Features are automatically cross-synchronized:

- **Python writes** → `features:{user_id}` → **TypeScript reads**
- **TypeScript writes** → `ml:serving:features:{user_id}` → **Python reads**  

## 🚨 Monitoring & Health Checks

### System Health Dashboard

Visit `http://localhost:4000/nexus` to see:

- **Python Service Status**: Online/Offline, response times
- **Event Processing**: Both TypeScript and Python throughput
- **Feature Freshness**: Cross-system feature synchronization
- **Error Rates**: Failed Python bridge calls

### Automated Health Monitoring

The bridge automatically:
- **Health checks Python service** every 30 seconds
- **Logs failures** and automatically retries
- **Gracefully degrades** if Python service is down
- **Resumes processing** when Python service recovers

## 🧪 Testing Integration

### Sample Test Flow

```bash
# 1. Test Python service directly
curl http://localhost:8000/health
curl -X POST http://localhost:8000/events \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "ui_interaction",
    "user_id": "test_user",
    "session_id": "test_session", 
    "timestamp": "2025-01-10T16:45:30Z",
    "app_version": "1.0.0",
    "device_type": "ios",
    "data": {"screen": "home", "element": "book_button"}
  }'

# 2. Test hybrid integration
curl -X POST http://localhost:4000/api/ml/bridge/python \
  -H "Content-Type: application/json" \
  -d '{"action": "test_integration"}'

# 3. Check combined features
curl "http://localhost:4000/api/ml/bridge/python?action=features&user_id=test_user"
```

## 🐛 Troubleshooting

### Common Issues

1. **Python service not found**
   ```bash
   # Check if Python service is running
   curl http://localhost:8000/health
   
   # Check TypeScript bridge logs
   tail -f logs/ml/nexus-ai.log
   ```

2. **Redis connection issues**
   ```bash
   # Both services should use same Redis
   redis-cli ping
   redis-cli keys "features:*"
   redis-cli keys "ml:*"
   ```

3. **CORS errors** (if accessing from browser)
   ```python
   # Add to your Python event_api.py
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["http://localhost:4000"],
       allow_methods=["GET", "POST"],
       allow_headers=["*"],
   )
   ```

### Debug Commands

```bash
# Check bridge health
curl http://localhost:4000/api/ml/bridge/python?action=health

# Monitor Redis activity
redis-cli monitor

# Check Python service logs
python event_api.py --log-level debug

# Test TypeScript ML pipeline
curl http://localhost:4000/api/ml/events/ingest?check=health
```

## 🚀 Production Deployment

### Docker Compose Integration

```yaml
# Add to your docker-compose.ml.yml
services:
  python-event-api:
    build: 
      context: ./python-service
      dockerfile: Dockerfile
    container_name: xpress-python-events
    ports:
      - "8000:8000"
    environment:
      - REDIS_HOST=redis
      - REDIS_PORT=6379  
    depends_on:
      - redis
    networks:
      - ml_network

  # Your existing TypeScript services...
  event_processor:
    environment:
      - PYTHON_EVENT_API_URL=http://python-event-api:8000
```

### Production Configuration

```bash
# Production environment variables
export PYTHON_EVENT_API_URL=http://python-event-api:8000
export REDIS_HOST=redis-cluster-endpoint
export ENABLE_PYTHON_BRIDGE=true
export HYBRID_FEATURE_MODE=true
```

## 🎉 Benefits of Integration

1. **🚀 Dual Processing Power**: Events processed by both TypeScript (real-time) and Python (ML-heavy)

2. **🔄 Feature Synchronization**: Features computed in Python are available to TypeScript models instantly

3. **⚡ Performance**: TypeScript handles high-throughput, Python handles complex ML computations

4. **🛡️ Fault Tolerance**: System continues if either service fails

5. **📊 Unified Monitoring**: Single dashboard shows health of both systems

6. **🔧 Easy Migration**: Gradually move features between systems as needed

**Your Python FastAPI service is now fully integrated with Nexus AI!** 🎯

Both systems work together seamlessly, providing the best of both worlds: TypeScript's speed and Python's ML ecosystem richness.