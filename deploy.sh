#!/bin/bash

# RBAC+ABAC Production Deployment Script
# Deploys the complete authorization system

set -e

echo "🚀 Starting RBAC+ABAC Production Deployment"
echo "==========================================="

# Configuration
DEPLOYMENT_ENV=${1:-production}
PORT=${PORT:-4001}
JWT_SECRET=${JWT_SECRET:-$(openssl rand -hex 32 2>/dev/null || echo "change-this-in-production-$(date +%s)")}

echo "📋 Deployment Configuration:"
echo "   Environment: $DEPLOYMENT_ENV"
echo "   Port: $PORT"
echo "   JWT Secret: ${JWT_SECRET:0:8}..."
echo ""

# Create deployment directory
DEPLOY_DIR="./deployment-$(date +%Y%m%d-%H%M%S)"
echo "📁 Creating deployment directory: $DEPLOY_DIR"
mkdir -p $DEPLOY_DIR

# Copy essential files
echo "📦 Copying production files..."
cp production-api-server.js $DEPLOY_DIR/
cp -r database/ $DEPLOY_DIR/
cp package*.json $DEPLOY_DIR/
cp production-authz.db $DEPLOY_DIR/ 2>/dev/null || echo "   ⚠️  Database will be created"

# Copy monitoring configuration
cp -r monitoring/ $DEPLOY_DIR/ 2>/dev/null || echo "   ⚠️  Monitoring configs not found"
cp -r docs/ $DEPLOY_DIR/ 2>/dev/null || echo "   ⚠️  Documentation not found"

cd $DEPLOY_DIR

# Install dependencies
echo "📦 Installing production dependencies..."
npm install --production

# Set up database if not exists
if [ ! -f "production-authz.db" ]; then
    echo "🗄️  Setting up production database..."
    sqlite3 production-authz.db < database/setup-rbac-sqlite.sql
    echo "✅ Database created successfully"
else
    echo "✅ Using existing database"
fi

# Create environment file
echo "⚙️  Creating environment configuration..."
cat > .env << EOF
NODE_ENV=$DEPLOYMENT_ENV
PORT=$PORT
JWT_SECRET=$JWT_SECRET
DATABASE_PATH=./production-authz.db
LOG_LEVEL=info
RBAC_ENGINE_ENABLED=true
AUDIT_LOGGING=true
SECURITY_HEADERS=true
EOF

# Create systemd service file (for Linux systems)
echo "🛠️  Creating systemd service file..."
cat > xpress-ops-tower.service << EOF
[Unit]
Description=Xpress Ops Tower RBAC+ABAC Service
After=network.target

[Service]
Type=simple
User=xpress
WorkingDirectory=$(pwd)
ExecStart=/usr/bin/node production-api-server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=$DEPLOYMENT_ENV
Environment=PORT=$PORT
EnvironmentFile=$(pwd)/.env

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$(pwd)

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=xpress-ops-tower

[Install]
WantedBy=multi-user.target
EOF

# Create startup script
echo "🚀 Creating startup script..."
cat > start.sh << 'EOF'
#!/bin/bash

# Xpress Ops Tower Startup Script
echo "🚀 Starting Xpress Ops Tower RBAC+ABAC System..."

# Load environment
if [ -f .env ]; then
    export $(cat .env | xargs)
fi

# Pre-flight checks
echo "🔍 Running pre-flight checks..."

# Check database
if [ ! -f "$DATABASE_PATH" ]; then
    echo "❌ Database not found at $DATABASE_PATH"
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found"
    exit 1
fi

# Check port availability
if lsof -i :$PORT &> /dev/null; then
    echo "⚠️  Port $PORT is already in use"
    echo "   Attempting to stop existing process..."
    pkill -f "production-api-server.js" || true
    sleep 2
fi

# Start the service
echo "✅ Starting API server on port $PORT..."
node production-api-server.js &
SERVER_PID=$!

# Wait for startup
echo "⏳ Waiting for server startup..."
sleep 3

# Health check
if curl -f http://localhost:$PORT/healthz &> /dev/null; then
    echo "✅ Server started successfully!"
    echo "🌐 API available at: http://localhost:$PORT"
    echo "🏥 Health check: http://localhost:$PORT/healthz"
    echo "📊 Process ID: $SERVER_PID"
    
    # Save PID for later management
    echo $SERVER_PID > xpress-ops-tower.pid
    
    echo ""
    echo "🎉 RBAC+ABAC System is now running in production!"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Test authentication: curl -X POST http://localhost:$PORT/api/v1/auth/login"
    echo "   2. Import Grafana dashboards from monitoring/ directory"
    echo "   3. Configure Prometheus alerts"
    echo "   4. Set up log rotation and monitoring"
    echo ""
    echo "🔧 Management commands:"
    echo "   Stop: ./stop.sh"
    echo "   Restart: ./restart.sh"
    echo "   Logs: tail -f /var/log/xpress-ops-tower.log"
    
else
    echo "❌ Server failed to start or health check failed"
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi
EOF

# Create stop script
cat > stop.sh << 'EOF'
#!/bin/bash
echo "🛑 Stopping Xpress Ops Tower RBAC+ABAC System..."

if [ -f xpress-ops-tower.pid ]; then
    PID=$(cat xpress-ops-tower.pid)
    if kill -0 $PID 2>/dev/null; then
        kill $PID
        echo "✅ Server stopped (PID: $PID)"
        rm xpress-ops-tower.pid
    else
        echo "⚠️  Process $PID not found"
        rm xpress-ops-tower.pid
    fi
else
    echo "⚠️  PID file not found, attempting to find process..."
    pkill -f "production-api-server.js" && echo "✅ Process terminated"
fi
EOF

# Create restart script  
cat > restart.sh << 'EOF'
#!/bin/bash
echo "🔄 Restarting Xpress Ops Tower RBAC+ABAC System..."
./stop.sh
sleep 2
./start.sh
EOF

# Make scripts executable
chmod +x start.sh stop.sh restart.sh

# Create monitoring setup script
cat > setup-monitoring.sh << 'EOF'
#!/bin/bash
echo "📊 Setting up monitoring infrastructure..."

# Check if monitoring directory exists
if [ ! -d "monitoring" ]; then
    echo "⚠️  Monitoring configuration not found"
    echo "   Please copy the monitoring/ directory to this deployment"
    exit 1
fi

echo "✅ Monitoring setup completed"
echo "   Grafana dashboards: monitoring/grafana/"
echo "   Prometheus alerts: monitoring/prometheus/"
echo ""
echo "📋 Manual setup required:"
echo "   1. Import Grafana dashboard: monitoring/grafana/expansion-operations-dashboard.json"
echo "   2. Configure Prometheus with: monitoring/prometheus/expansion-alerts.yml"
echo "   3. Set up alerting channels (Slack, PagerDuty, etc.)"
EOF

chmod +x setup-monitoring.sh

echo ""
echo "✅ Deployment preparation complete!"
echo ""
echo "📁 Deployment directory: $DEPLOY_DIR"
echo "📋 Files created:"
echo "   - production-api-server.js (API server)"
echo "   - production-authz.db (database)"
echo "   - .env (environment configuration)"
echo "   - start.sh (startup script)"
echo "   - stop.sh (stop script)"
echo "   - restart.sh (restart script)"
echo "   - xpress-ops-tower.service (systemd service)"
echo "   - setup-monitoring.sh (monitoring setup)"
echo ""
echo "🚀 To deploy:"
echo "   cd $DEPLOY_DIR"
echo "   ./start.sh"
echo ""
echo "🔧 For system service (Linux):"
echo "   sudo cp xpress-ops-tower.service /etc/systemd/system/"
echo "   sudo systemctl enable xpress-ops-tower"
echo "   sudo systemctl start xpress-ops-tower"
echo ""
echo "📊 For monitoring:"
echo "   ./setup-monitoring.sh"
echo ""

# Start the deployment immediately
echo "🚀 Starting deployment now..."
cd $DEPLOY_DIR
./start.sh

echo ""
echo "🎉 RBAC+ABAC System deployed and running!"
echo "🌐 Access at: http://localhost:$PORT"