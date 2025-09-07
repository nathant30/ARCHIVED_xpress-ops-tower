-- Initialize Xpress Ops Tower PostgreSQL Database
-- This script runs automatically when the container starts

\echo 'Starting Xpress Ops Tower database initialization...'

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

\echo 'Extensions created successfully'

-- Create schema migrations tracking table first
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(20) PRIMARY KEY,
    description TEXT NOT NULL,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    rollback_sql TEXT
);

\echo 'Schema migrations table created'

-- Source the core schema
\i /docker-entrypoint-initdb.d/02-core-schema.sql

\echo 'Database initialization completed successfully'