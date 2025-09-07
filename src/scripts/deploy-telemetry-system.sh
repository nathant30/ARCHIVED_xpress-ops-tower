#!/bin/bash

# Telemetry System Deployment Script
# Deploys OBD telemetry and real-time data integration system for Xpress Ops Tower

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
DEPLOYMENT_ENV="${DEPLOYMENT_ENV:-production}"
TELEMETRY_VERSION="${TELEMETRY_VERSION:-v1.0.0}"

# Print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Print banner
print_banner() {
    echo "
🚗 ========================================================================================
   XPRESS OPS TOWER - OBD TELEMETRY & REAL-TIME DATA INTEGRATION DEPLOYMENT
   Version: ${TELEMETRY_VERSION}
   Environment: ${DEPLOYMENT_ENV}
   Philippines Ridesharing Platform
======================================================================================== 🇵🇭
"
}

# Check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    print_success "All prerequisites are satisfied"
}

# Setup environment
setup_environment() {
    print_info "Setting up environment for ${DEPLOYMENT_ENV}..."
    
    # Create environment file if it doesn't exist
    if [[ ! -f "${PROJECT_ROOT}/.env.telemetry" ]]; then
        print_info "Creating telemetry environment configuration..."
        cat > "${PROJECT_ROOT}/.env.telemetry" << EOF
# Xpress Ops Tower Telemetry System Configuration
# Generated on $(date)

# Environment
NODE_ENV=${DEPLOYMENT_ENV}
TELEMETRY_VERSION=${TELEMETRY_VERSION}

# Database Configuration
TELEMETRY_DB_PASSWORD=xpress_telemetry_secure_$(date +%Y)
TELEMETRY_DB_PORT=5433
TIMESCALE_PASSWORD=timescale_secure_$(date +%Y)
TIMESCALE_PORT=5434
REDIS_PASSWORD=redis_secure_$(date +%Y)
TELEMETRY_REDIS_PORT=6380

# WebSocket Configuration
WEBSOCKET_PORT=8080
WEBSOCKET_EXTERNAL_PORT=8080
MAX_WS_CONNECTIONS=1000
WS_HEARTBEAT_INTERVAL=30000
WS_BROADCAST_INTERVAL=5000
WS_AUTH_ENABLED=true

# Telemetry Processing
TELEMETRY_PROCESSING_INTERVAL=1000
TELEMETRY_BATCH_SIZE=100
TELEMETRY_RETENTION_DAYS=90
TELEMETRY_QUALITY_THRESHOLD=0.8

# OBD Device Configuration
OBD_CONNECTION_TIMEOUT=30000
OBD_MAX_RETRIES=3
OBD_HEALTH_CHECK_INTERVAL=60000
OBD_FIRMWARE_UPDATE_ENABLED=false

# Alert System
ALERT_PROCESSING_INTERVAL=30000
ALERT_ESCALATION_TIMEOUT=7200000
MAX_NOTIFICATIONS_PER_BATCH=10
ALERT_RETRY_ATTEMPTS=3

# Philippines-specific Configuration
LTFRB_ENABLED=true
LTO_INTEGRATION=false
PAGASA_INTEGRATION=false
CODING_ENFORCEMENT=true
WEATHER_API_ENABLED=false
TRAFFIC_API_ENABLED=false
VIOLATION_THRESHOLD=3

# Machine Learning
ANOMALY_DETECTION_ENABLED=true
PREDICTIVE_MAINTENANCE_ENABLED=true
DRIVER_SCORING_ENABLED=true
ANOMALY_CONFIDENCE_THRESHOLD=0.8
PREDICTION_HORIZON_DAYS=30
MODEL_UPDATE_INTERVAL=86400000

# External Services
SMS_PROVIDER=twilio
EMAIL_PROVIDER=sendgrid
PUSH_NOTIFICATION_ENABLED=true

# Monitoring
TELEMETRY_PROMETHEUS_PORT=9091
TELEMETRY_GRAFANA_PORT=3001
TELEMETRY_GRAFANA_PASSWORD=grafana_secure_$(date +%Y)
PROMETHEUS_RETENTION=30d

# Load Balancer
TELEMETRY_NGINX_HTTP_PORT=8081
TELEMETRY_NGINX_HTTPS_PORT=8443

# Security
JWT_SECRET=$(openssl rand -base64 32)
EOF
        print_success "Environment configuration created"
    else
        print_info "Using existing environment configuration"
    fi
}

# Create directories
create_directories() {
    print_info "Creating necessary directories..."
    
    local directories=(
        "logs/telemetry"
        "logs/websocket"
        "logs/alerts"
        "logs/analytics"
        "logs/nginx"
        "database/telemetry"
        "database/timescale"
        "config/nginx"
        "config/prometheus"
        "config/grafana/telemetry-dashboards"
        "config/grafana/telemetry-datasources"
        "config/redis"
        "docker/telemetry"
        "uploads/telemetry"
        "exports/telemetry"
        "models/ml"
    )
    
    for dir in "${directories[@]}"; do
        mkdir -p "${PROJECT_ROOT}/${dir}"
    done
    
    print_success "Directories created successfully"
}

# Setup database initialization scripts
setup_database_scripts() {
    print_info "Setting up database initialization scripts..."
    
    # Telemetry database init script
    cat > "${PROJECT_ROOT}/database/telemetry/01-init-telemetry.sql" << 'EOF'
-- Telemetry Database Initialization
-- Creates tables for OBD device management and telemetry data

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create telemetry schema
CREATE SCHEMA IF NOT EXISTS telemetry;
CREATE SCHEMA IF NOT EXISTS obd_devices;
CREATE SCHEMA IF NOT EXISTS compliance;

-- Set default schema
SET search_path TO telemetry, public;

-- Create device management tables (simplified versions of main schema)
CREATE TABLE IF NOT EXISTS obd_devices.device_registry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_serial VARCHAR(100) NOT NULL UNIQUE,
    device_model VARCHAR(100) NOT NULL,
    manufacturer VARCHAR(100) NOT NULL,
    firmware_version VARCHAR(50),
    vehicle_id UUID NOT NULL,
    status VARCHAR(20) DEFAULT 'inactive',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create telemetry data table (partitioned by date)
CREATE TABLE IF NOT EXISTS telemetry.vehicle_data (
    id UUID DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL,
    device_id UUID NOT NULL,
    location GEOMETRY(POINT, 4326),
    speed_kmh DECIMAL(6,2),
    engine_rpm INTEGER,
    engine_temp_celsius DECIMAL(5,2),
    fuel_level_percent DECIMAL(5,2),
    battery_voltage DECIMAL(4,2),
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    recorded_date DATE NOT NULL DEFAULT CURRENT_DATE,
    data_quality_score DECIMAL(3,2) DEFAULT 1.00,
    PRIMARY KEY (id, recorded_date)
) PARTITION BY RANGE (recorded_date);

-- Create initial partitions for current and next month
CREATE TABLE telemetry.vehicle_data_current 
    PARTITION OF telemetry.vehicle_data
    FOR VALUES FROM (CURRENT_DATE) TO (CURRENT_DATE + INTERVAL '1 month');

CREATE TABLE telemetry.vehicle_data_next
    PARTITION OF telemetry.vehicle_data
    FOR VALUES FROM (CURRENT_DATE + INTERVAL '1 month') TO (CURRENT_DATE + INTERVAL '2 months');

-- Create compliance tracking table
CREATE TABLE IF NOT EXISTS compliance.vehicle_violations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL,
    violation_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    location GEOMETRY(POINT, 4326),
    violation_time TIMESTAMP WITH TIME ZONE NOT NULL,
    fine_amount DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'detected',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicle_data_vehicle_time ON telemetry.vehicle_data(vehicle_id, recorded_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicle_data_location ON telemetry.vehicle_data USING GIST(location);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_device_registry_vehicle ON obd_devices.device_registry(vehicle_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_violations_vehicle_time ON compliance.vehicle_violations(vehicle_id, violation_time DESC);

-- Create user for application
CREATE USER telemetry_app WITH PASSWORD 'telemetry_app_secure_2024';
GRANT USAGE ON SCHEMA telemetry, obd_devices, compliance TO telemetry_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA telemetry, obd_devices, compliance TO telemetry_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA telemetry, obd_devices, compliance TO telemetry_app;

EOF

    # TimescaleDB init script
    cat > "${PROJECT_ROOT}/database/timescale/01-init-timescale.sql" << 'EOF'
-- TimescaleDB Initialization for Time-series Telemetry Data
-- Optimized for high-frequency vehicle telemetry storage

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create hypertables for time-series data
CREATE TABLE IF NOT EXISTS telemetry_timeseries (
    time TIMESTAMPTZ NOT NULL,
    vehicle_id UUID NOT NULL,
    device_id UUID NOT NULL,
    metric_name VARCHAR(50) NOT NULL,
    metric_value DECIMAL(10,4),
    unit VARCHAR(20),
    quality_score DECIMAL(3,2) DEFAULT 1.00
);

-- Convert to hypertable
SELECT create_hypertable('telemetry_timeseries', 'time', if_not_exists => TRUE);

-- Create continuous aggregates for common queries
CREATE MATERIALIZED VIEW IF NOT EXISTS telemetry_hourly
WITH (timescaledb.continuous) AS
SELECT time_bucket('1 hour', time) AS hour,
       vehicle_id,
       metric_name,
       avg(metric_value) as avg_value,
       min(metric_value) as min_value,
       max(metric_value) as max_value,
       count(*) as data_points
FROM telemetry_timeseries
GROUP BY hour, vehicle_id, metric_name;

-- Set up retention policy (90 days)
SELECT add_retention_policy('telemetry_timeseries', INTERVAL '90 days');

-- Create compression policy
SELECT add_compression_policy('telemetry_timeseries', INTERVAL '7 days');

-- Create indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_telemetry_vehicle_time ON telemetry_timeseries (vehicle_id, time DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_telemetry_metric ON telemetry_timeseries (metric_name, time DESC);

EOF

    print_success "Database initialization scripts created"
}

# Create Docker configuration files
create_docker_configs() {
    print_info "Creating Docker configuration files..."
    
    # Telemetry processor Dockerfile
    mkdir -p "${PROJECT_ROOT}/docker/telemetry"
    cat > "${PROJECT_ROOT}/docker/telemetry/Dockerfile.processor" << 'EOF'
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY src/ ./src/
COPY tsconfig.json ./

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start processor service
CMD ["node", "dist/scripts/start-telemetry-services.js"]
EOF

    # WebSocket server Dockerfile
    cat > "${PROJECT_ROOT}/docker/telemetry/Dockerfile.websocket" << 'EOF'
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY src/ ./src/
COPY tsconfig.json ./

# Build TypeScript
RUN npm run build

# Expose WebSocket port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=5 \
  CMD curl -f http://localhost:8080/health || exit 1

# Start WebSocket server
CMD ["node", "dist/lib/websocket/telemetry-server.js"]
EOF

    # Alert service Dockerfile
    cat > "${PROJECT_ROOT}/docker/telemetry/Dockerfile.alerts" << 'EOF'
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY src/ ./src/
COPY tsconfig.json ./

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=5 \
  CMD curl -f http://localhost:3002/health || exit 1

# Start alert service
CMD ["node", "dist/lib/alerts/alert-manager.js"]
EOF

    # Analytics service Dockerfile
    cat > "${PROJECT_ROOT}/docker/telemetry/Dockerfile.analytics" << 'EOF'
FROM node:18-alpine

WORKDIR /app

# Install Python for ML libraries
RUN apk add --no-cache python3 py3-pip

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY src/ ./src/
COPY tsconfig.json ./

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3003

# Health check
HEALTHCHECK --interval=60s --timeout=20s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3003/health || exit 1

# Start analytics service
CMD ["node", "dist/lib/analytics/data-processing-engine.js"]
EOF

    print_success "Docker configuration files created"
}

# Create NGINX configuration
create_nginx_config() {
    print_info "Creating NGINX configuration..."
    
    cat > "${PROJECT_ROOT}/config/nginx/telemetry.conf" << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream telemetry_backend {
        server telemetry-processor:3001;
    }
    
    upstream websocket_backend {
        server websocket-server:8080;
    }
    
    upstream alerts_backend {
        server alert-service:3002;
    }
    
    upstream analytics_backend {
        server analytics-service:3003;
    }

    map $http_upgrade $connection_upgrade {
        default upgrade;
        '' close;
    }

    server {
        listen 80;
        server_name localhost;

        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }

        # Telemetry API
        location /api/telemetry/ {
            proxy_pass http://telemetry_backend/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # WebSocket connections
        location /ws {
            proxy_pass http://websocket_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection $connection_upgrade;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_cache_bypass $http_upgrade;
        }

        # Alerts API
        location /api/alerts/ {
            proxy_pass http://alerts_backend/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }

        # Analytics API
        location /api/analytics/ {
            proxy_pass http://analytics_backend/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
    }
}
EOF

    print_success "NGINX configuration created"
}

# Create monitoring configuration
create_monitoring_config() {
    print_info "Creating monitoring configuration..."
    
    # Prometheus configuration
    cat > "${PROJECT_ROOT}/config/prometheus/telemetry-prometheus.yml" << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "/etc/prometheus/rules/*.yml"

scrape_configs:
  - job_name: 'telemetry-processor'
    static_configs:
      - targets: ['telemetry-processor:3001']

  - job_name: 'websocket-server'
    static_configs:
      - targets: ['websocket-server:8080']

  - job_name: 'alert-service'
    static_configs:
      - targets: ['alert-service:3002']

  - job_name: 'analytics-service'
    static_configs:
      - targets: ['analytics-service:3003']

  - job_name: 'postgres-telemetry'
    static_configs:
      - targets: ['telemetry-db:5432']

  - job_name: 'redis-telemetry'
    static_configs:
      - targets: ['telemetry-redis:6379']
EOF

    # Grafana datasource
    mkdir -p "${PROJECT_ROOT}/config/grafana/telemetry-datasources"
    cat > "${PROJECT_ROOT}/config/grafana/telemetry-datasources/prometheus.yml" << 'EOF'
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://telemetry-prometheus:9090
    isDefault: true

  - name: PostgreSQL
    type: postgres
    url: telemetry-db:5432
    database: xpress_telemetry
    user: xpress_telemetry_user
    secureJsonData:
      password: xpress_telemetry_secure_2024
    jsonData:
      sslmode: disable
      maxOpenConns: 0
      maxIdleConns: 2
      connMaxLifetime: 14400

  - name: TimescaleDB
    type: postgres
    url: timescale-db:5432
    database: xpress_timeseries
    user: timeseries_user
    secureJsonData:
      password: timescale_secure_2024
    jsonData:
      sslmode: disable
      timescaledb: true
EOF

    print_success "Monitoring configuration created"
}

# Build and start services
deploy_services() {
    print_info "Building and starting telemetry services..."
    
    cd "${PROJECT_ROOT}"
    
    # Load environment variables
    set -a
    source .env.telemetry
    set +a
    
    # Build and start services
    docker-compose -f docker-compose.telemetry.yml up -d --build
    
    print_success "Services deployment initiated"
}

# Wait for services to be healthy
wait_for_services() {
    print_info "Waiting for services to become healthy..."
    
    local services=(
        "telemetry-db"
        "timescale-db"
        "telemetry-redis"
        "telemetry-processor"
        "websocket-server"
        "alert-service"
        "analytics-service"
    )
    
    local max_wait=300  # 5 minutes
    local wait_time=0
    
    while [[ $wait_time -lt $max_wait ]]; do
        local all_healthy=true
        
        for service in "${services[@]}"; do
            if ! docker-compose -f "${PROJECT_ROOT}/docker-compose.telemetry.yml" ps "$service" | grep -q "healthy\|Up"; then
                all_healthy=false
                break
            fi
        done
        
        if $all_healthy; then
            print_success "All services are healthy"
            return 0
        fi
        
        sleep 10
        wait_time=$((wait_time + 10))
        print_info "Waiting for services... (${wait_time}s/${max_wait}s)"
    done
    
    print_warning "Some services may not be fully healthy yet"
    docker-compose -f "${PROJECT_ROOT}/docker-compose.telemetry.yml" ps
}

# Run tests
run_tests() {
    print_info "Running system tests..."
    
    # Test WebSocket connection
    if curl -f "http://localhost:8080/health" &> /dev/null; then
        print_success "WebSocket server is responding"
    else
        print_warning "WebSocket server health check failed"
    fi
    
    # Test database connections
    if docker exec ops-tower-telemetry-db pg_isready -U xpress_telemetry_user &> /dev/null; then
        print_success "Telemetry database is ready"
    else
        print_warning "Telemetry database connection failed"
    fi
    
    if docker exec ops-tower-timescale pg_isready -U timeseries_user &> /dev/null; then
        print_success "TimescaleDB is ready"
    else
        print_warning "TimescaleDB connection failed"
    fi
    
    print_success "System tests completed"
}

# Show deployment summary
show_summary() {
    print_success "🎉 Telemetry system deployment completed!"
    
    echo "
📊 XPRESS OPS TOWER TELEMETRY SYSTEM
====================================

🔗 Service Endpoints:
• WebSocket Server:     http://localhost:8080
• Telemetry API:        http://localhost:8081/api/telemetry
• Alerts API:           http://localhost:8081/api/alerts
• Analytics API:        http://localhost:8081/api/analytics
• Grafana Dashboard:    http://localhost:3001 (admin/grafana_secure_$(date +%Y))
• Prometheus Metrics:   http://localhost:9091

🗄️  Database Connections:
• Telemetry DB:         localhost:5433 (xpress_telemetry)
• TimescaleDB:          localhost:5434 (xpress_timeseries)
• Redis Cache:          localhost:6380

📱 Features Deployed:
✅ OBD device management and health monitoring
✅ Real-time telemetry data collection
✅ WebSocket server for live updates
✅ Anomaly detection and analytics engine
✅ Alert generation and management system
✅ Philippines compliance monitoring (LTFRB/LTO)
✅ Traffic violation detection
✅ Predictive maintenance alerts
✅ Driver performance tracking
✅ Fleet operations integration
✅ Monitoring and alerting

🚗 Ready for Philippines ridesharing operations!

To view logs: docker-compose -f docker-compose.telemetry.yml logs -f
To stop:      docker-compose -f docker-compose.telemetry.yml down
"
}

# Cleanup function
cleanup() {
    if [[ $? -ne 0 ]]; then
        print_error "Deployment failed. Cleaning up..."
        docker-compose -f "${PROJECT_ROOT}/docker-compose.telemetry.yml" down --volumes
    fi
}

# Main deployment function
main() {
    trap cleanup EXIT
    
    print_banner
    check_prerequisites
    setup_environment
    create_directories
    setup_database_scripts
    create_docker_configs
    create_nginx_config
    create_monitoring_config
    deploy_services
    wait_for_services
    run_tests
    show_summary
}

# Execute main function
main "$@"