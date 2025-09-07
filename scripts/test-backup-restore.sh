#!/bin/bash
# Backup restore test - prove your backups actually work
set -e

DB_NAME="xpress"
DB_USER="xpress_user"
DB_HOST="localhost"
TEST_DB="xpress_restore_test"
BACKUP_DIR="./database/backups"

echo "🧪 Testing backup restore functionality..."

# Create a backup
echo "📦 Creating fresh backup..."
./scripts/backup-db.sh

# Find the latest backup
LATEST_BACKUP=$(ls -t $BACKUP_DIR/backup_*.sql | head -1)
echo "📄 Using backup: $LATEST_BACKUP"

# Create test database
echo "🏗️  Creating test database: $TEST_DB"
createdb -h $DB_HOST -U $DB_USER $TEST_DB

# Restore backup to test database
echo "🔄 Restoring backup to test database..."
psql -h $DB_HOST -U $DB_USER -d $TEST_DB < "$LATEST_BACKUP"

# Run sanity queries
echo "🔍 Running sanity queries..."

# Test 1: Check schema exists
TABLES=$(psql -h $DB_HOST -U $DB_USER -d $TEST_DB -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
echo "   Tables found: $TABLES"

# Test 2: Check if API events table exists and has structure
API_EVENTS=$(psql -h $DB_HOST -U $DB_USER -d $TEST_DB -t -c "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'ApiEvent';" 2>/dev/null || echo "0")
echo "   ApiEvent columns: $API_EVENTS"

# Test 3: Try to insert test data
psql -h $DB_HOST -U $DB_USER -d $TEST_DB -c "INSERT INTO \"ApiEvent\" (id, method, path, operation, \"createdAt\") VALUES ('test-123', 'GET', '/api/test', 'test', NOW());" 2>/dev/null && echo "   ✅ Insert test: PASSED" || echo "   ❌ Insert test: FAILED"

# Test 4: Try to query test data
TEST_COUNT=$(psql -h $DB_HOST -U $DB_USER -d $TEST_DB -t -c "SELECT COUNT(*) FROM \"ApiEvent\" WHERE id = 'test-123';" 2>/dev/null || echo "0")
echo "   Test records found: $TEST_COUNT"

# Cleanup test database
echo "🧹 Cleaning up test database..."
dropdb -h $DB_HOST -U $DB_USER $TEST_DB

if [ "$API_EVENTS" -gt 0 ] && [ "$TEST_COUNT" -gt 0 ]; then
    echo "✅ BACKUP RESTORE TEST: PASSED - Your backups are working!"
    exit 0
else
    echo "❌ BACKUP RESTORE TEST: FAILED - Backups are not restoring properly"
    exit 1
fi