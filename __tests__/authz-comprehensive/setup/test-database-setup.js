// SQLite Test Database Setup for AuthZ Testing
// Simulates SQL Server RLS/DDM functionality for comprehensive testing

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class TestDatabaseSetup {
  constructor() {
    this.dbPath = path.join(__dirname, '../temp', 'authz-test.db');
    this.db = null;
  }

  async initialize() {
    // Create temp directory if it doesn't exist
    const tempDir = path.dirname(this.dbPath);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Remove existing database
    if (fs.existsSync(this.dbPath)) {
      fs.unlinkSync(this.dbPath);
    }

    this.db = new sqlite3.Database(this.dbPath);
    
    console.log('🗄️  Setting up test database at:', this.dbPath);
    await this.createTables();
    await this.seedTestData();
    await this.setupPolicies();
    console.log('✅ Test database setup complete');
  }

  async createTables() {
    return new Promise((resolve, reject) => {
      const createTableSQL = `
        -- Users table
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          is_active INTEGER DEFAULT 1
        );

        -- User roles junction table
        CREATE TABLE IF NOT EXISTS user_roles (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          role_name TEXT NOT NULL,
          region_id TEXT,
          assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          is_active INTEGER DEFAULT 1,
          valid_until DATETIME,
          FOREIGN KEY (user_id) REFERENCES users(id)
        );

        -- Drivers table (with PII)
        CREATE TABLE IF NOT EXISTS drivers (
          driver_id TEXT PRIMARY KEY,
          region_id TEXT NOT NULL,
          phone_number TEXT NOT NULL,
          email TEXT NOT NULL,
          license_number TEXT NOT NULL,
          vehicle_info TEXT,
          status TEXT DEFAULT 'active',
          rating REAL DEFAULT 5.0,
          last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Passengers table (with PII)
        CREATE TABLE IF NOT EXISTS passengers (
          passenger_id TEXT PRIMARY KEY,
          region_id TEXT NOT NULL,
          phone_number TEXT NOT NULL,
          email TEXT,
          payment_details TEXT,
          preferences TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Trips table
        CREATE TABLE IF NOT EXISTS trips (
          trip_id TEXT PRIMARY KEY,
          driver_id TEXT NOT NULL,
          passenger_id TEXT NOT NULL,
          region_id TEXT NOT NULL,
          pickup_location_hash TEXT,
          dropoff_location_hash TEXT,
          pickup_timestamp DATETIME,
          dropoff_timestamp DATETIME,
          fare_amount REAL,
          trip_duration_minutes INTEGER,
          status TEXT DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (driver_id) REFERENCES drivers(driver_id),
          FOREIGN KEY (passenger_id) REFERENCES passengers(passenger_id)
        );

        -- Financial reports table (sensitive data)
        CREATE TABLE IF NOT EXISTS financial_reports (
          report_id TEXT PRIMARY KEY,
          region_id TEXT NOT NULL,
          report_type TEXT NOT NULL,
          data JSON NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- System configurations table (admin only)
        CREATE TABLE IF NOT EXISTS system_configurations (
          config_id TEXT PRIMARY KEY,
          config_type TEXT NOT NULL,
          config_value TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- PII access logs (audit table)
        CREATE TABLE IF NOT EXISTS pii_access_logs (
          log_id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          data_subject_id TEXT NOT NULL,
          access_type TEXT NOT NULL,
          justification TEXT,
          access_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          mfa_method TEXT
        );

        -- Session context table (simulates SQL Server session context)
        CREATE TABLE IF NOT EXISTS session_context (
          session_id TEXT PRIMARY KEY,
          user_id TEXT,
          user_role TEXT,
          user_region TEXT,
          pii_scope TEXT DEFAULT 'none',
          mfa_present INTEGER DEFAULT 0,
          case_id TEXT,
          emergency_mode INTEGER DEFAULT 0,
          emergency_justification TEXT,
          current_time TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Indexes for performance
        CREATE INDEX IF NOT EXISTS idx_drivers_region ON drivers(region_id);
        CREATE INDEX IF NOT EXISTS idx_passengers_region ON passengers(region_id);
        CREATE INDEX IF NOT EXISTS idx_trips_region ON trips(region_id);
        CREATE INDEX IF NOT EXISTS idx_trips_driver ON trips(driver_id);
        CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
        CREATE INDEX IF NOT EXISTS idx_pii_logs_user ON pii_access_logs(user_id);
        CREATE INDEX IF NOT EXISTS idx_pii_logs_timestamp ON pii_access_logs(access_timestamp);
      `;

      this.db.exec(createTableSQL, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async seedTestData() {
    return new Promise((resolve, reject) => {
      const seedSQL = `
        -- Insert test users
        INSERT OR REPLACE INTO users (id, email, password_hash, is_active) VALUES
        ('usr-ground-ops-001', 'ground.ops.manila@xpress.test', '$2b$10$hash1', 1),
        ('usr-ground-ops-002', 'ground.ops.cebu@xpress.test', '$2b$10$hash2', 1),
        ('usr-ground-ops-003', 'ground.ops.davao@xpress.test', '$2b$10$hash3', 1),
        ('usr-support-001', 'support.team@xpress.test', '$2b$10$hash4', 1),
        ('usr-analyst-001', 'data.analyst@xpress.test', '$2b$10$hash5', 1),
        ('usr-ops-manager-001', 'ops.manager.manila@xpress.test', '$2b$10$hash6', 1),
        ('usr-risk-investigator-001', 'risk.investigator@xpress.test', '$2b$10$hash7', 1),
        ('usr-regional-manager-001', 'regional.manager.ncr@xpress.test', '$2b$10$hash8', 1),
        ('usr-compliance-officer-001', 'compliance.officer@xpress.test', '$2b$10$hash9', 1),
        ('usr-iam-admin-001', 'iam.admin@xpress.test', '$2b$10$hash10', 1),
        ('usr-app-admin-001', 'app.admin@xpress.test', '$2b$10$hash11', 1),
        ('usr-night-ops-001', 'night.ops@xpress.test', '$2b$10$hash12', 1);

        -- Insert user role assignments
        INSERT OR REPLACE INTO user_roles (id, user_id, role_name, region_id, is_active) VALUES
        ('role-001', 'usr-ground-ops-001', 'ground_ops', 'ph-ncr-manila', 1),
        ('role-002', 'usr-ground-ops-002', 'ground_ops', 'ph-vis-cebu', 1),
        ('role-003', 'usr-ground-ops-003', 'ground_ops', 'ph-min-davao', 1),
        ('role-004', 'usr-support-001', 'support', 'ph-ncr-manila', 1),
        ('role-005', 'usr-analyst-001', 'analyst', 'ph-ncr-manila', 1),
        ('role-006', 'usr-ops-manager-001', 'ops_manager', 'ph-ncr-manila', 1),
        ('role-007', 'usr-risk-investigator-001', 'risk_investigator', 'ph-vis-cebu', 1),
        ('role-008', 'usr-regional-manager-001', 'regional_manager', 'ph-ncr-manila', 1),
        ('role-009', 'usr-compliance-officer-001', 'compliance_officer', NULL, 1),
        ('role-010', 'usr-iam-admin-001', 'iam_admin', NULL, 1),
        ('role-011', 'usr-app-admin-001', 'app_admin', NULL, 1),
        ('role-012', 'usr-night-ops-001', 'night_ops', 'ph-ncr-manila', 1);

        -- Insert test drivers (across all regions)
        INSERT OR REPLACE INTO drivers (driver_id, region_id, phone_number, email, license_number, status, rating) VALUES
        ('drv-manila-001', 'ph-ncr-manila', '+639171234567', 'driver1@manila.xpress.ph', 'N03-12-123456', 'active', 4.8),
        ('drv-manila-002', 'ph-ncr-manila', '+639171234568', 'driver2@manila.xpress.ph', 'N03-12-123457', 'available', 4.9),
        ('drv-manila-003', 'ph-ncr-manila', '+639171234569', 'driver3@manila.xpress.ph', 'N03-12-123458', 'active', 4.7),
        ('drv-cebu-001', 'ph-vis-cebu', '+639321234567', 'driver1@cebu.xpress.ph', 'R07-12-234567', 'active', 4.6),
        ('drv-cebu-002', 'ph-vis-cebu', '+639321234568', 'driver2@cebu.xpress.ph', 'R07-12-234568', 'available', 4.8),
        ('drv-davao-001', 'ph-min-davao', '+639821234567', 'driver1@davao.xpress.ph', 'R11-12-345678', 'active', 4.9),
        ('drv-davao-002', 'ph-min-davao', '+639821234568', 'driver2@davao.xpress.ph', 'R11-12-345679', 'available', 4.5);

        -- Insert test passengers
        INSERT OR REPLACE INTO passengers (passenger_id, region_id, phone_number, email, payment_details) VALUES
        ('pax-manila-001', 'ph-ncr-manila', '+639171111111', 'passenger1@manila.com', '****-****-****-1234'),
        ('pax-manila-002', 'ph-ncr-manila', '+639171111112', 'passenger2@manila.com', '****-****-****-5678'),
        ('pax-cebu-001', 'ph-vis-cebu', '+639322222222', 'passenger1@cebu.com', '****-****-****-9012'),
        ('pax-davao-001', 'ph-min-davao', '+639823333333', 'passenger1@davao.com', '****-****-****-3456');

        -- Insert test trips
        INSERT OR REPLACE INTO trips (trip_id, driver_id, passenger_id, region_id, status, fare_amount, trip_duration_minutes) VALUES
        ('trip-001', 'drv-manila-001', 'pax-manila-001', 'ph-ncr-manila', 'completed', 150.00, 25),
        ('trip-002', 'drv-manila-002', 'pax-manila-002', 'ph-ncr-manila', 'active', 200.00, 0),
        ('trip-003', 'drv-cebu-001', 'pax-cebu-001', 'ph-vis-cebu', 'completed', 180.00, 30),
        ('trip-004', 'drv-davao-001', 'pax-davao-001', 'ph-min-davao', 'active', 120.00, 0);

        -- Insert financial reports (sensitive data)
        INSERT OR REPLACE INTO financial_reports (report_id, region_id, report_type, data) VALUES
        ('fin-001', 'ph-ncr-manila', 'daily_revenue', '{"revenue": 25000, "trips": 100}'),
        ('fin-002', 'ph-vis-cebu', 'daily_revenue', '{"revenue": 15000, "trips": 60}'),
        ('fin-003', 'ph-min-davao', 'daily_revenue', '{"revenue": 12000, "trips": 45}');

        -- Insert system configurations
        INSERT OR REPLACE INTO system_configurations (config_id, config_type, config_value) VALUES
        ('cfg-001', 'emergency_protocols', '{"enabled": true, "contacts": ["emergency@xpress.ph"]}'),
        ('cfg-002', 'feature_flags', '{"new_ui": true, "beta_features": false}');
      `;

      this.db.exec(seedSQL, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async setupPolicies() {
    // Create views that simulate RLS policies
    return new Promise((resolve, reject) => {
      const policySQL = `
        -- Create views that simulate Row-Level Security policies
        CREATE VIEW IF NOT EXISTS v_drivers_filtered AS
        SELECT d.*,
               CASE 
                 WHEN (SELECT pii_scope FROM session_context WHERE session_id = 'current') = 'none' 
                 THEN '+639****' || SUBSTR(d.phone_number, -4)
                 WHEN (SELECT pii_scope FROM session_context WHERE session_id = 'current') = 'masked'
                 THEN '+639****' || SUBSTR(d.phone_number, -4)
                 WHEN (SELECT pii_scope FROM session_context WHERE session_id = 'current') = 'full' 
                   AND (SELECT mfa_present FROM session_context WHERE session_id = 'current') = 1
                 THEN d.phone_number
                 ELSE '+639*******'
               END as masked_phone,
               CASE 
                 WHEN (SELECT pii_scope FROM session_context WHERE session_id = 'current') = 'none'
                 THEN SUBSTR(d.email, 1, 2) || '***@' || SUBSTR(d.email, INSTR(d.email, '@') + 1)
                 WHEN (SELECT pii_scope FROM session_context WHERE session_id = 'current') = 'masked'
                 THEN SUBSTR(d.email, 1, 3) || '***@***.' || SUBSTR(d.email, -3)
                 WHEN (SELECT pii_scope FROM session_context WHERE session_id = 'current') = 'full'
                   AND (SELECT mfa_present FROM session_context WHERE session_id = 'current') = 1
                 THEN d.email
                 ELSE '***@***.***'
               END as masked_email
        FROM drivers d
        WHERE d.region_id = (SELECT user_region FROM session_context WHERE session_id = 'current')
           OR (SELECT user_region FROM session_context WHERE session_id = 'current') IS NULL
           OR (SELECT case_id FROM session_context WHERE session_id = 'current') IS NOT NULL;

        -- Create performance metrics table
        CREATE TABLE IF NOT EXISTS performance_metrics (
          metric_id TEXT PRIMARY KEY,
          operation_type TEXT NOT NULL,
          start_time DATETIME NOT NULL,
          end_time DATETIME NOT NULL,
          duration_ms INTEGER,
          rows_processed INTEGER,
          user_context TEXT,
          region_id TEXT,
          success_flag INTEGER DEFAULT 1,
          error_message TEXT
        );
      `;

      this.db.exec(policySQL, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // Helper method to set session context (simulates SQL Server session context)
  async setSessionContext(userId, roleName, regionId, options = {}) {
    return new Promise((resolve, reject) => {
      const insertSQL = `
        INSERT OR REPLACE INTO session_context (
          session_id, user_id, user_role, user_region, pii_scope, 
          mfa_present, case_id, emergency_mode, emergency_justification, current_time
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      this.db.run(insertSQL, [
        'current',
        userId,
        roleName,
        regionId,
        options.piiScope || 'none',
        options.mfaPresent || 0,
        options.caseId || null,
        options.emergencyMode || 0,
        options.emergencyJustification || null,
        options.currentTime || new Date().toISOString()
      ], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // Helper method to clear session context
  async clearSessionContext() {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM session_context WHERE session_id = ?', ['current'], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // Get database connection
  getConnection() {
    return this.db;
  }

  // Clean up resources
  async cleanup() {
    return new Promise((resolve) => {
      if (this.db) {
        this.db.close(() => {
          if (fs.existsSync(this.dbPath)) {
            fs.unlinkSync(this.dbPath);
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = TestDatabaseSetup;

// If run directly, initialize the database
if (require.main === module) {
  const setup = new TestDatabaseSetup();
  setup.initialize()
    .then(() => {
      console.log('✅ Test database setup completed successfully');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Test database setup failed:', err);
      process.exit(1);
    });
}