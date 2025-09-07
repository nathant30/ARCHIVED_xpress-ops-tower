// =====================================================
// TEST DATABASE HELPER
// Utilities for setting up and managing test databases
// =====================================================

import { Pool } from 'pg';
import { Redis } from 'ioredis';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { 
  Operator, 
  CreateOperatorRequest,
  OperatorType,
  OperatorStatus,
  CommissionTier 
} from '@/types/operators';

// Test database configuration
const TEST_CONFIG = {
  database: {
    host: process.env.TEST_DB_HOST || 'localhost',
    port: parseInt(process.env.TEST_DB_PORT || '5432'),
    database: process.env.TEST_DB_NAME || 'test_operators',
    user: process.env.TEST_DB_USER || 'test',
    password: process.env.TEST_DB_PASSWORD || 'test',
  },
  redis: {
    host: process.env.TEST_REDIS_HOST || 'localhost',
    port: parseInt(process.env.TEST_REDIS_PORT || '6379'),
    db: parseInt(process.env.TEST_REDIS_DB || '1'),
  },
  jwt: {
    secret: process.env.TEST_JWT_SECRET || 'test-secret-key',
    expiresIn: '24h',
  },
};

// Global test database pool
let testPool: Pool | null = null;
let testRedis: Redis | null = null;

// =====================================================
// DATABASE SETUP AND TEARDOWN
// =====================================================

export async function setupTestDatabase(): Promise<Pool> {
  if (testPool) {
    return testPool;
  }

  testPool = new Pool(TEST_CONFIG.database);

  try {
    // Test connection
    await testPool.query('SELECT 1');
    console.log('✅ Test database connected');

    // Run migrations
    await runTestMigrations();

    // Setup Redis connection
    testRedis = new Redis({
      host: TEST_CONFIG.redis.host,
      port: TEST_CONFIG.redis.port,
      db: TEST_CONFIG.redis.db,
    });

    console.log('✅ Test Redis connected');

    return testPool;
  } catch (error) {
    console.error('❌ Test database setup failed:', error);
    throw error;
  }
}

export async function cleanupTestDatabase(): Promise<void> {
  if (testPool) {
    await testPool.end();
    testPool = null;
    console.log('✅ Test database connection closed');
  }

  if (testRedis) {
    await testRedis.disconnect();
    testRedis = null;
    console.log('✅ Test Redis connection closed');
  }
}

export function getTestPool(): Pool {
  if (!testPool) {
    throw new Error('Test database not initialized. Call setupTestDatabase() first.');
  }
  return testPool;
}

export function getTestRedis(): Redis {
  if (!testRedis) {
    throw new Error('Test Redis not initialized. Call setupTestDatabase() first.');
  }
  return testRedis;
}

// =====================================================
// DATABASE MIGRATIONS FOR TESTING
// =====================================================

async function runTestMigrations(): Promise<void> {
  if (!testPool) throw new Error('Test pool not initialized');

  const migrations = [
    // Users table for authentication
    `
    CREATE TABLE IF NOT EXISTS test_users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'user',
      permissions JSONB DEFAULT '[]'::jsonb,
      allowed_regions JSONB DEFAULT '[]'::jsonb,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
    `,

    // Operators table
    `
    CREATE TABLE IF NOT EXISTS test_operators (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      operator_code VARCHAR(100) UNIQUE NOT NULL,
      business_name VARCHAR(255) NOT NULL,
      legal_name VARCHAR(255) NOT NULL,
      trade_name VARCHAR(255),
      operator_type VARCHAR(50) NOT NULL CHECK (operator_type IN ('tnvs', 'general', 'fleet')),
      status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending_approval', 'under_review', 'decommissioned')),
      primary_contact JSONB NOT NULL,
      business_address JSONB NOT NULL,
      mailing_address JSONB,
      business_registration_number VARCHAR(100) NOT NULL,
      tin VARCHAR(20),
      sec_registration VARCHAR(100),
      ltfrb_authority_number VARCHAR(100),
      lto_accreditation VARCHAR(100),
      primary_region_id VARCHAR(50) NOT NULL,
      allowed_regions JSONB DEFAULT '[]'::jsonb,
      max_vehicles INTEGER DEFAULT 3,
      current_vehicle_count INTEGER DEFAULT 0,
      performance_score DECIMAL(5,2) DEFAULT 0,
      commission_tier VARCHAR(20) DEFAULT 'tier_1' CHECK (commission_tier IN ('tier_1', 'tier_2', 'tier_3')),
      tier_qualification_date TIMESTAMP WITH TIME ZONE,
      wallet_balance DECIMAL(15,2) DEFAULT 0,
      earnings_today DECIMAL(15,2) DEFAULT 0,
      earnings_week DECIMAL(15,2) DEFAULT 0,
      earnings_month DECIMAL(15,2) DEFAULT 0,
      total_commissions_earned DECIMAL(15,2) DEFAULT 0,
      insurance_details JSONB DEFAULT '{}'::jsonb,
      certifications JSONB DEFAULT '[]'::jsonb,
      compliance_documents JSONB DEFAULT '{}'::jsonb,
      operational_hours JSONB DEFAULT '{"start": "06:00", "end": "22:00"}'::jsonb,
      service_areas JSONB DEFAULT '[]'::jsonb,
      special_permissions JSONB DEFAULT '{}'::jsonb,
      user_id UUID REFERENCES test_users(id),
      assigned_account_manager VARCHAR(100),
      partnership_start_date TIMESTAMP WITH TIME ZONE NOT NULL,
      partnership_end_date TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_by VARCHAR(100),
      is_active BOOLEAN DEFAULT true
    )
    `,

    // Performance scores table
    `
    CREATE TABLE IF NOT EXISTS test_operator_performance_scores (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      operator_id UUID REFERENCES test_operators(id) ON DELETE CASCADE,
      scoring_period VARCHAR(50) NOT NULL,
      scoring_frequency VARCHAR(20) CHECK (scoring_frequency IN ('daily', 'weekly', 'monthly', 'quarterly')),
      vehicle_utilization_score DECIMAL(5,2) DEFAULT 0,
      driver_management_score DECIMAL(5,2) DEFAULT 0,
      compliance_safety_score DECIMAL(5,2) DEFAULT 0,
      platform_contribution_score DECIMAL(5,2) DEFAULT 0,
      total_score DECIMAL(5,2) DEFAULT 0 CHECK (total_score >= 0 AND total_score <= 100),
      commission_tier VARCHAR(20) DEFAULT 'tier_1' CHECK (commission_tier IN ('tier_1', 'tier_2', 'tier_3')),
      tier_qualification_status VARCHAR(20) DEFAULT 'qualified',
      tier_calculation_notes TEXT,
      metrics_data JSONB DEFAULT '{}'::jsonb,
      improvement_trend DECIMAL(5,2),
      peer_ranking INTEGER,
      peer_percentile DECIMAL(5,2),
      calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      calculated_by VARCHAR(100),
      is_final BOOLEAN DEFAULT false,
      UNIQUE(operator_id, scoring_period, scoring_frequency)
    )
    `,

    // Financial transactions table
    `
    CREATE TABLE IF NOT EXISTS test_operator_financial_transactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      operator_id UUID REFERENCES test_operators(id) ON DELETE CASCADE,
      transaction_type VARCHAR(50) NOT NULL,
      amount DECIMAL(15,2) NOT NULL CHECK (amount >= 0 OR transaction_type IN ('penalty_deduction', 'adjustment', 'refund')),
      currency VARCHAR(10) DEFAULT 'PHP',
      reference_number VARCHAR(100) UNIQUE NOT NULL,
      description TEXT NOT NULL,
      external_reference VARCHAR(100),
      booking_id VARCHAR(100),
      driver_id VARCHAR(100),
      region_id VARCHAR(50),
      base_fare DECIMAL(15,2),
      commission_rate DECIMAL(5,2),
      commission_tier VARCHAR(20),
      calculation_method VARCHAR(50),
      calculation_details JSONB DEFAULT '{}'::jsonb,
      payment_status VARCHAR(50) DEFAULT 'pending',
      payment_method VARCHAR(50),
      payment_processor VARCHAR(100),
      payment_reference VARCHAR(100),
      transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      due_date TIMESTAMP WITH TIME ZONE,
      processed_at TIMESTAMP WITH TIME ZONE,
      settlement_date TIMESTAMP WITH TIME ZONE,
      reconciled BOOLEAN DEFAULT false,
      reconciled_at TIMESTAMP WITH TIME ZONE,
      reconciled_by VARCHAR(100),
      batch_id VARCHAR(100),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_by VARCHAR(100),
      notes TEXT
    )
    `,

    // Vehicles table
    `
    CREATE TABLE IF NOT EXISTS test_operator_vehicles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      operator_id UUID REFERENCES test_operators(id) ON DELETE CASCADE,
      vehicle_plate_number VARCHAR(20) UNIQUE NOT NULL,
      vehicle_info JSONB NOT NULL,
      service_type VARCHAR(50) NOT NULL,
      vehicle_category VARCHAR(50) NOT NULL,
      seating_capacity INTEGER DEFAULT 4,
      or_number VARCHAR(50),
      cr_number VARCHAR(50),
      ltfrb_registration VARCHAR(50),
      insurance_policy JSONB DEFAULT '{}'::jsonb,
      status VARCHAR(50) DEFAULT 'available',
      assigned_driver_id VARCHAR(100),
      assigned_location_id VARCHAR(100),
      last_maintenance_date TIMESTAMP WITH TIME ZONE,
      next_maintenance_due TIMESTAMP WITH TIME ZONE,
      last_inspection_date TIMESTAMP WITH TIME ZONE,
      next_inspection_due TIMESTAMP WITH TIME ZONE,
      maintenance_records JSONB DEFAULT '[]'::jsonb,
      acquisition_cost DECIMAL(15,2),
      acquisition_date TIMESTAMP WITH TIME ZONE,
      depreciation_rate DECIMAL(5,4),
      current_value DECIMAL(15,2),
      registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      registered_by VARCHAR(100),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      is_active BOOLEAN DEFAULT true
    )
    `,

    // Boundary fees table
    `
    CREATE TABLE IF NOT EXISTS test_operator_boundary_fees (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      operator_id UUID REFERENCES test_operators(id) ON DELETE CASCADE,
      driver_id VARCHAR(100) NOT NULL,
      fee_date DATE NOT NULL,
      base_boundary_fee DECIMAL(15,2) NOT NULL CHECK (base_boundary_fee >= 0),
      fuel_subsidy DECIMAL(15,2) DEFAULT 0 CHECK (fuel_subsidy >= 0),
      maintenance_allowance DECIMAL(15,2) DEFAULT 0 CHECK (maintenance_allowance >= 0),
      other_adjustments DECIMAL(15,2) DEFAULT 0,
      total_amount DECIMAL(15,2) NOT NULL CHECK (total_amount >= 0),
      vehicle_plate_number VARCHAR(20) NOT NULL,
      service_type VARCHAR(50) NOT NULL,
      driver_performance_score DECIMAL(5,2),
      performance_adjustment DECIMAL(15,2) DEFAULT 0,
      bonus_earned DECIMAL(15,2) DEFAULT 0 CHECK (bonus_earned >= 0),
      payment_status VARCHAR(50) DEFAULT 'pending',
      payment_method VARCHAR(50),
      paid_at TIMESTAMP WITH TIME ZONE,
      trips_completed INTEGER DEFAULT 0 CHECK (trips_completed >= 0),
      hours_worked DECIMAL(4,2) DEFAULT 0 CHECK (hours_worked >= 0),
      distance_covered_km DECIMAL(8,2) DEFAULT 0 CHECK (distance_covered_km >= 0),
      driver_gross_earnings DECIMAL(15,2) DEFAULT 0 CHECK (driver_gross_earnings >= 0),
      revenue_share_percentage DECIMAL(5,2),
      revenue_share_amount DECIMAL(15,2) DEFAULT 0 CHECK (revenue_share_amount >= 0),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(operator_id, driver_id, fee_date)
    )
    `,

    // Payouts table
    `
    CREATE TABLE IF NOT EXISTS test_operator_payouts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      operator_id UUID REFERENCES test_operators(id) ON DELETE CASCADE,
      payout_reference VARCHAR(100) UNIQUE NOT NULL,
      payout_amount DECIMAL(15,2) NOT NULL CHECK (payout_amount >= 0),
      currency VARCHAR(10) DEFAULT 'PHP',
      period_start TIMESTAMP WITH TIME ZONE NOT NULL,
      period_end TIMESTAMP WITH TIME ZONE NOT NULL,
      commissions_amount DECIMAL(15,2) DEFAULT 0 CHECK (commissions_amount >= 0),
      bonuses_amount DECIMAL(15,2) DEFAULT 0 CHECK (bonuses_amount >= 0),
      adjustments_amount DECIMAL(15,2) DEFAULT 0,
      penalties_deducted DECIMAL(15,2) DEFAULT 0 CHECK (penalties_deducted >= 0),
      tax_withheld DECIMAL(15,2) DEFAULT 0 CHECK (tax_withheld >= 0),
      other_deductions DECIMAL(15,2) DEFAULT 0 CHECK (other_deductions >= 0),
      payment_method VARCHAR(50) NOT NULL,
      bank_account_details JSONB,
      payment_processor VARCHAR(100),
      status VARCHAR(50) DEFAULT 'pending',
      requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      approved_at TIMESTAMP WITH TIME ZONE,
      processed_at TIMESTAMP WITH TIME ZONE,
      completed_at TIMESTAMP WITH TIME ZONE,
      failed_at TIMESTAMP WITH TIME ZONE,
      requested_by VARCHAR(100),
      approved_by VARCHAR(100),
      processed_by VARCHAR(100),
      bank_transaction_id VARCHAR(100),
      processor_transaction_id VARCHAR(100),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      notes TEXT
    )
    `,

    // Indexes for performance
    `
    CREATE INDEX IF NOT EXISTS idx_test_operators_operator_code ON test_operators(operator_code);
    CREATE INDEX IF NOT EXISTS idx_test_operators_operator_type ON test_operators(operator_type);
    CREATE INDEX IF NOT EXISTS idx_test_operators_status ON test_operators(status);
    CREATE INDEX IF NOT EXISTS idx_test_operators_region ON test_operators(primary_region_id);
    CREATE INDEX IF NOT EXISTS idx_test_operators_performance ON test_operators(performance_score);
    CREATE INDEX IF NOT EXISTS idx_test_operators_tier ON test_operators(commission_tier);
    CREATE INDEX IF NOT EXISTS idx_test_performance_scores_operator ON test_operator_performance_scores(operator_id);
    CREATE INDEX IF NOT EXISTS idx_test_performance_scores_period ON test_operator_performance_scores(scoring_period);
    CREATE INDEX IF NOT EXISTS idx_test_financial_transactions_operator ON test_operator_financial_transactions(operator_id);
    CREATE INDEX IF NOT EXISTS idx_test_financial_transactions_type ON test_operator_financial_transactions(transaction_type);
    CREATE INDEX IF NOT EXISTS idx_test_financial_transactions_date ON test_operator_financial_transactions(transaction_date);
    CREATE INDEX IF NOT EXISTS idx_test_vehicles_operator ON test_operator_vehicles(operator_id);
    CREATE INDEX IF NOT EXISTS idx_test_vehicles_plate ON test_operator_vehicles(vehicle_plate_number);
    CREATE INDEX IF NOT EXISTS idx_test_boundary_fees_operator ON test_operator_boundary_fees(operator_id);
    CREATE INDEX IF NOT EXISTS idx_test_boundary_fees_date ON test_operator_boundary_fees(fee_date);
    CREATE INDEX IF NOT EXISTS idx_test_payouts_operator ON test_operator_payouts(operator_id);
    CREATE INDEX IF NOT EXISTS idx_test_payouts_status ON test_operator_payouts(status);
    `,
  ];

  for (const migration of migrations) {
    try {
      await testPool.query(migration);
    } catch (error) {
      console.error('Migration failed:', migration.substring(0, 100) + '...');
      throw error;
    }
  }

  console.log('✅ Test database migrations completed');
}

// =====================================================
// TEST DATA CREATION HELPERS
// =====================================================

export interface TestUser {
  id: string;
  email: string;
  role: string;
  permissions: string[];
  allowedRegions: string[];
  authToken: string;
}

export async function createTestUser(userData: {
  email: string;
  password: string;
  role?: string;
  permissions?: string[];
  allowedRegions?: string[];
}): Promise<TestUser> {
  const pool = getTestPool();
  
  const passwordHash = await bcrypt.hash(userData.password, 10);
  const permissions = userData.permissions || [];
  const allowedRegions = userData.allowedRegions || [];
  
  const result = await pool.query(`
    INSERT INTO test_users (email, password_hash, role, permissions, allowed_regions)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, email, role, permissions, allowed_regions
  `, [
    userData.email,
    passwordHash,
    userData.role || 'user',
    JSON.stringify(permissions),
    JSON.stringify(allowedRegions)
  ]);
  
  const user = result.rows[0];
  
  // Generate JWT token
  const tokenPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    permissions: permissions,
    allowedRegions: allowedRegions,
  };
  
  const authToken = jwt.sign(tokenPayload, TEST_CONFIG.jwt.secret, {
    expiresIn: TEST_CONFIG.jwt.expiresIn,
  });
  
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    permissions: permissions,
    allowedRegions: allowedRegions,
    authToken: authToken,
  };
}

export async function createTestOperator(operatorData: {
  operator_code: string;
  business_name: string;
  operator_type: OperatorType;
  primary_region_id: string;
  legal_name?: string;
  status?: OperatorStatus;
  performance_score?: number;
  commission_tier?: CommissionTier;
  current_vehicle_count?: number;
  max_vehicles?: number;
  tin?: string;
}): Promise<{ id: string } & typeof operatorData> {
  const pool = getTestPool();
  
  const vehicleLimits = {
    tnvs: 3,
    general: 10,
    fleet: 50,
  };
  
  const data = {
    operator_code: operatorData.operator_code,
    business_name: operatorData.business_name,
    legal_name: operatorData.legal_name || `${operatorData.business_name} Corporation`,
    operator_type: operatorData.operator_type,
    status: operatorData.status || 'active',
    primary_contact: JSON.stringify({
      name: 'Test Contact',
      phone: '+639123456789',
      email: `contact@${operatorData.operator_code.toLowerCase()}.com`,
      position: 'Manager'
    }),
    business_address: JSON.stringify({
      street: '123 Test Street',
      city: 'Makati',
      province: 'Metro Manila',
      region: 'NCR',
      postal_code: '1226',
      country: 'Philippines'
    }),
    business_registration_number: `DTI-${operatorData.operator_code}`,
    tin: operatorData.tin || '123-456-789-000',
    primary_region_id: operatorData.primary_region_id,
    allowed_regions: JSON.stringify([operatorData.primary_region_id]),
    max_vehicles: operatorData.max_vehicles || vehicleLimits[operatorData.operator_type],
    current_vehicle_count: operatorData.current_vehicle_count || 0,
    performance_score: operatorData.performance_score || 0,
    commission_tier: operatorData.commission_tier || 'tier_1',
    partnership_start_date: new Date().toISOString(),
  };
  
  const result = await pool.query(`
    INSERT INTO test_operators (
      operator_code, business_name, legal_name, operator_type, status,
      primary_contact, business_address, business_registration_number, tin,
      primary_region_id, allowed_regions, max_vehicles, current_vehicle_count,
      performance_score, commission_tier, partnership_start_date,
      created_at, updated_at, is_active
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
      NOW(), NOW(), true
    ) RETURNING id
  `, Object.values(data));
  
  return {
    id: result.rows[0].id,
    ...operatorData,
  };
}

// =====================================================
// DATABASE CLEANUP HELPERS
// =====================================================

export async function clearTestData(): Promise<void> {
  const pool = getTestPool();
  
  const tables = [
    'test_operator_payouts',
    'test_operator_boundary_fees',
    'test_operator_vehicles',
    'test_operator_financial_transactions',
    'test_operator_performance_scores',
    'test_operators',
    'test_users',
  ];
  
  for (const table of tables) {
    await pool.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);
  }
  
  // Clear Redis test data
  const redis = getTestRedis();
  await redis.flushdb();
  
  console.log('✅ Test data cleared');
}

export async function seedTestData(): Promise<void> {
  // Create basic test users
  await createTestUser({
    email: 'admin@test.com',
    password: 'admin123',
    role: 'admin',
    permissions: ['manage_operators', 'view_operators', 'create_operator', 'delete_operator'],
    allowedRegions: ['ncr-001', 'region-4a', 'region-7'],
  });
  
  await createTestUser({
    email: 'user@test.com',
    password: 'user123',
    role: 'user',
    permissions: ['view_operators'],
    allowedRegions: ['ncr-001'],
  });
  
  // Create basic test operators
  await createTestOperator({
    operator_code: 'TEST-TNVS-001',
    business_name: 'Test TNVS Operator',
    operator_type: 'tnvs',
    primary_region_id: 'ncr-001',
  });
  
  await createTestOperator({
    operator_code: 'TEST-GENERAL-001',
    business_name: 'Test General Operator',
    operator_type: 'general',
    primary_region_id: 'region-4a',
  });
  
  console.log('✅ Test data seeded');
}

// =====================================================
// TRANSACTION HELPERS
// =====================================================

export async function withTransaction<T>(
  callback: (client: Pool) => Promise<T>
): Promise<T> {
  const pool = getTestPool();
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// =====================================================
// TEST UTILITIES
// =====================================================

export function generateTestOperatorCode(): string {
  return `TEST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function generateTestEmail(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`;
}

export function generateTestTIN(): string {
  const segments = [
    Math.floor(Math.random() * 900) + 100,
    Math.floor(Math.random() * 900) + 100,
    Math.floor(Math.random() * 900) + 100,
    '000'
  ];
  return segments.join('-');
}

export async function waitForCondition(
  condition: () => Promise<boolean>,
  timeout: number = 10000,
  interval: number = 100
): Promise<void> {
  const start = Date.now();
  
  while (Date.now() - start < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error(`Condition not met within ${timeout}ms`);
}