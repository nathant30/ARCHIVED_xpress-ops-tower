-- Basic Schema for PostgreSQL without complex PostGIS features
-- This provides the essential tables for regional access functionality

-- Create basic regions table (simplified from PostGIS version)
CREATE TABLE IF NOT EXISTS regions (
    id VARCHAR(10) PRIMARY KEY,
    region_id VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    region_state VARCHAR(20) DEFAULT 'active',
    country_code CHAR(2) DEFAULT 'PH',
    timezone VARCHAR(50) DEFAULT 'Asia/Manila',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create users table 
CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create regional user access table
CREATE TABLE IF NOT EXISTS regional_user_access (
    user_id VARCHAR(50) NOT NULL,
    region_id VARCHAR(10) NOT NULL,
    access_level VARCHAR(10) NOT NULL CHECK (access_level IN ('read', 'write', 'manage')),
    granted_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, region_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (region_id) REFERENCES regions(region_id)
);

-- Create region access overrides table
CREATE TABLE IF NOT EXISTS region_access_overrides (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    region_id VARCHAR(10) NOT NULL,
    access_level VARCHAR(10) NOT NULL CHECK (access_level IN ('read', 'write', 'manage')),
    starts_at TIMESTAMP NOT NULL,
    ends_at TIMESTAMP NOT NULL,
    reason TEXT NOT NULL,
    created_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (region_id) REFERENCES regions(region_id)
);

-- Create regional capabilities table
CREATE TABLE IF NOT EXISTS regional_capabilities (
    id SERIAL PRIMARY KEY,
    role_key VARCHAR(50) NOT NULL,
    capability VARCHAR(100) NOT NULL,
    UNIQUE(role_key, capability)
);

-- Insert sample regions
INSERT INTO regions (id, region_id, name, region_state) VALUES
  ('NCR', 'NCR', 'NCR', 'active'),
  ('BTN', 'BTN', 'Bataan', 'active'),
  ('PMP', 'PMP', 'Pampanga', 'pilot'),
  ('BUL', 'BUL', 'Bulacan', 'pilot'),
  ('CAV', 'CAV', 'Cavite', 'active'),
  ('LAG', 'LAG', 'Laguna', 'pilot'),
  ('BORA', 'BORA', 'Boracay', 'active')
ON CONFLICT (region_id) DO NOTHING;

-- Insert sample users
INSERT INTO users (user_id, email, full_name, role) VALUES
  ('usr-super-admin-001', 'admin@xpress.test', 'Super Administrator', 'super_admin'),
  ('usr-exp-mgr-002', 'expansion.manager@xpress.test', 'Test Expansion Manager', 'expansion_manager'),
  ('usr-ground-ops-003', 'ground.ops.manila@xpress.test', 'Test Ground Ops', 'ground_ops')
ON CONFLICT (user_id) DO NOTHING;

-- Insert sample regional access
INSERT INTO regional_user_access (user_id, region_id, access_level) VALUES 
  ('usr-super-admin-001', 'NCR', 'manage'),
  ('usr-super-admin-001', 'BTN', 'write'),
  ('usr-super-admin-001', 'BORA', 'manage'),
  ('usr-exp-mgr-002', 'PMP', 'manage'),
  ('usr-exp-mgr-002', 'BUL', 'write'),
  ('usr-ground-ops-003', 'CAV', 'write'),
  ('usr-ground-ops-003', 'LAG', 'read')
ON CONFLICT (user_id, region_id) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_regions_state ON regions(region_state);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_regional_access_user ON regional_user_access(user_id);
CREATE INDEX IF NOT EXISTS idx_regional_access_region ON regional_user_access(region_id);
CREATE INDEX IF NOT EXISTS idx_overrides_user ON region_access_overrides(user_id);
CREATE INDEX IF NOT EXISTS idx_overrides_expires ON region_access_overrides(ends_at);

-- Insert sample capabilities
INSERT INTO regional_capabilities (role_key, capability) VALUES
  ('super_admin', 'regions:manage'),
  ('super_admin', 'users:manage'),
  ('super_admin', 'system:admin'),
  ('expansion_manager', 'regions:expand'),
  ('expansion_manager', 'regions:analyze'),
  ('ground_ops', 'operations:monitor'),
  ('ground_ops', 'incidents:handle')
ON CONFLICT (role_key, capability) DO NOTHING;