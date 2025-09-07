#!/bin/bash

# Switch Xpress Ops Tower to PostgreSQL
echo "🔄 Switching to PostgreSQL configuration..."

# Check if PostgreSQL is installed
if ! command -v postgres &> /dev/null; then
    echo "❌ PostgreSQL not found. Installing with Homebrew..."
    brew install postgresql@15 postgis
    echo "✅ PostgreSQL installed"
fi

# Start PostgreSQL service
echo "🚀 Starting PostgreSQL service..."
brew services start postgresql@15

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to start..."
sleep 3

# Create database and user
echo "🗄️  Setting up database and user..."
createdb xpress_ops_tower 2>/dev/null || echo "Database already exists"

# Set PostgreSQL environment
echo "⚙️  Switching environment configuration..."
cp .env.postgresql .env

echo "✅ Successfully switched to PostgreSQL!"
echo ""
echo "📝 Next steps:"
echo "   1. Run: npm run db:migrate  (apply schema)"
echo "   2. Run: npm run db:seed     (seed data)"  
echo "   3. Run: npm run dev         (start server)"
echo ""
echo "🌐 Database connection:"
echo "   Host: localhost:5432"
echo "   Database: xpress_ops_tower"
echo "   User: $USER"