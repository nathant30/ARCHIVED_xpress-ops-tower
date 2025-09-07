#!/bin/bash
# PostgreSQL backup script
set -e

DB_NAME="xpress"
DB_USER="xpress_user" 
BACKUP_DIR="./database/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

echo "Creating backup: $BACKUP_DIR/backup_$TIMESTAMP.sql"
pg_dump -h localhost -U $DB_USER -d $DB_NAME > "$BACKUP_DIR/backup_$TIMESTAMP.sql"

# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.sql" -type f -mtime +7 -delete

echo "Backup completed: $(ls -la $BACKUP_DIR/backup_$TIMESTAMP.sql)"