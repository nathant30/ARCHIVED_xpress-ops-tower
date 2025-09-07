#!/bin/bash

# Switch Xpress Ops Tower to SQLite
echo "🔄 Switching to SQLite configuration..."

# Create SQLite environment file
cat > .env.sqlite << EOF
# SQLite Configuration for Xpress Ops Tower
DATABASE_TYPE=sqlite
SQLITE_PATH=./database/xpress_ops_tower.db
SQLITE_DATABASE=xpress_ops_tower.db

# Performance Monitoring
SLOW_QUERY_THRESHOLD=1000

# Environment
NODE_ENV=development

# Security
JWT_SECRET=development-jwt-secret-change-in-production
API_KEY=dev-api-key-12345

# Application
PORT=4000
EOF

# Set SQLite environment
echo "⚙️  Switching environment configuration..."
cp .env.sqlite .env

echo "✅ Successfully switched to SQLite!"
echo ""
echo "📝 Database file: ./database/xpress_ops_tower.db"
echo "🌐 Ready to run: npm run dev"