// Mock API Server for AuthZ Testing
// Simulates Xpress Ops Tower API endpoints for comprehensive testing

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const TestDatabaseSetup = require('./test-database-setup');

// Simple MFA session management for testing
const mfaSessions = new Map();
const mfaChallenges = new Map();

function createMFASession(userId, method = 'TOTP', ttlSeconds = 3600) {
  const session = {
    present: true,
    verifiedAt: Date.now(),
    method,
    ttlSeconds,
    userId
  };
  mfaSessions.set(userId, session);
  return session;
}

function validateMFASession(userId) {
  const session = mfaSessions.get(userId);
  if (!session) return false;
  
  const elapsed = Date.now() - session.verifiedAt;
  const expired = elapsed > (session.ttlSeconds * 1000);
  
  if (expired) {
    mfaSessions.delete(userId);
    return false;
  }
  
  return true;
}

const app = express();
app.use(express.json());

// Security headers middleware (required by Postman tests)
app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-XSS-Protection': '1; mode=block',
    'Content-Security-Policy': "default-src 'self'"
  });
  next();
});

// Policy bundle headers for test validation
app.use((req, res, next) => {
  // Simulate policy bundle (would be from actual policy bundle in production)
  const MOCK_POLICY_HASH = '7a3f9e2b8c1d5f4e';
  const MOCK_POLICY_VERSION = '1.2.0';
  
  res.set({
    'X-Policy-Hash': MOCK_POLICY_HASH,
    'X-Policy-Version': MOCK_POLICY_VERSION,
    'X-Auth-Latency-Ms': '12',
    'X-Policy-Eval-Ms': '8',
    'X-Policy-Cache-Hit': Math.random() > 0.3 ? 'true' : 'false'
  });
  
  // Check for policy hash validation from client
  const clientHash = req.headers['x-expected-policy-hash'];
  if (clientHash && clientHash !== MOCK_POLICY_HASH) {
    return res.status(409).json({
      error: 'policy_hash_mismatch',
      message: 'Client and server policy bundles out of sync',
      server_hash: MOCK_POLICY_HASH,
      client_hash: clientHash,
      details: 'Update your client or wait for deployment sync'
    });
  }
  
  next();
});

// Test configuration
const JWT_SECRET = process.env.AUTHZ_TEST_JWT_SECRET || require('crypto').randomBytes(32).toString('hex');
const PORT = 4001; // Different from main app to avoid conflicts

let testDb;

// Initialize database connection
async function initializeDatabase() {
  testDb = new TestDatabaseSetup();
  await testDb.initialize();
  return testDb;
}

// Role level mapping (matching XPRESS_ROLES in rbac-abac.ts)
const ROLE_LEVELS = {
  'ground_ops': 10,
  'support': 20, 
  'ops_manager': 25,
  'analyst': 30,
  'regional_manager': 40,
  'expansion_manager': 45,
  'risk_investigator': 50,
  'executive': 60
};

// JWT utility functions
function generateToken(user, mfaVerified = false) {
  const currentRole = user.roles?.[0] || 'unknown';
  const payload = {
    sub: user.id,
    user_id: user.id,
    email: user.email,
    role: currentRole,
    roles: user.roles || [],
    level: ROLE_LEVELS[currentRole] || 0,
    region: user.allowedRegions?.[0] || null,
    pii_scope: user.piiScope || 'none',
    mfa_verified: mfaVerified,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  };
  
  return jwt.sign(payload, JWT_SECRET);
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

// Middleware for authentication
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      error: 'unauthorized',
      message: 'Access token required'
    });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(403).json({ 
      error: 'forbidden',
      message: 'Invalid or expired token'
    });
  }

  req.user = payload;
  
  // Check current MFA session status (more accurate than token)
  const currentMfaStatus = validateMFASession(payload.user_id);
  
  // Set session context in database
  testDb.setSessionContext(
    payload.user_id,
    payload.role,
    payload.region,
    {
      piiScope: payload.pii_scope,
      mfaPresent: currentMfaStatus ? 1 : 0,
      caseId: req.headers['x-case-id'] || null
    }
  );

  // Add MFA status to request for middleware
  req.mfa_present = currentMfaStatus;

  next();
}

// Middleware for performance tracking
function performanceTracker(operationType) {
  return (req, res, next) => {
    const startTime = Date.now();
    
    // Set performance headers immediately (before response is sent)
    res.set('X-Auth-Latency-Ms', '12'); // Simulated auth latency
    res.set('X-Policy-Eval-Ms', '8');   // Simulated policy evaluation
    res.set('X-Policy-Cache-Hit', Math.random() > 0.3 ? 'true' : 'false');
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      console.log(`${operationType}: ${duration}ms [${res.statusCode}]`);
    });
    
    next();
  };
}

// Routes

// Health check endpoint (for testing stability)
app.get('/healthz', (req, res) => {
  const uptime = process.uptime();
  const mfaStats = {
    activeSessions: mfaSessions.size,
    activeChallenges: mfaChallenges.size
  };
  
  res.status(200).json({
    status: 'healthy',
    uptime: Math.floor(uptime),
    database: 'connected',
    mfa_sessions: mfaStats,
    timestamp: new Date().toISOString()
  });
});

// Authentication endpoints
app.post('/api/v1/auth/login', (req, res) => {
  const { username, password, mfa_code } = req.body;
  
  // Mock user data based on test users
  const testUsers = {
    'ground.ops.manila@xpress.test': {
      id: 'usr-ground-ops-001',
      email: 'ground.ops.manila@xpress.test',
      roles: ['ground_ops'],
      allowedRegions: ['ph-ncr-manila'],
      piiScope: 'none'
    },
    'support.team@xpress.test': {
      id: 'usr-support-001',
      email: 'support.team@xpress.test',
      roles: ['support'],
      allowedRegions: ['ph-ncr-manila'],
      piiScope: 'masked'
    },
    'risk.investigator@xpress.test': {
      id: 'usr-risk-investigator-001',
      email: 'risk.investigator@xpress.test',
      roles: ['risk_investigator'],
      allowedRegions: ['ph-vis-cebu'],
      piiScope: 'full'
    },
    'data.analyst@xpress.test': {
      id: 'usr-analyst-001',
      email: 'data.analyst@xpress.test',
      roles: ['analyst'],
      allowedRegions: ['ph-ncr-manila'],
      piiScope: 'masked'
    },
    'ops.manager.manila@xpress.test': {
      id: 'usr-ops-manager-001',
      email: 'ops.manager.manila@xpress.test',
      roles: ['ops_manager'],
      allowedRegions: ['ph-ncr-manila'],
      piiScope: 'masked'
    },
    'regional.manager.ncr@xpress.test': {
      id: 'usr-regional-manager-001',
      email: 'regional.manager.ncr@xpress.test',
      roles: ['regional_manager'],
      allowedRegions: ['ph-ncr-manila'],
      piiScope: 'masked'
    },
    'expansion.manager@xpress.test': {
      id: 'usr-expansion-manager-001',
      email: 'expansion.manager@xpress.test',
      roles: ['expansion_manager'],
      allowedRegions: ['ph-pal-puerto', 'ph-zam-zamboanga'],
      piiScope: 'none'
    }
  };

  const user = testUsers[username];
  if (!user) {
    return res.status(401).json({ 
      error: 'authentication_failed',
      message: 'Invalid credentials'
    });
  }

  // Check MFA for sensitive roles
  const mfaRequired = ['risk_investigator'].includes(user.roles[0]);
  const mfaVerified = mfa_code === '123456'; // Mock TOTP code

  if (mfaRequired && !mfaVerified) {
    if (!mfa_code) {
      return res.status(403).json({
        error: 'mfa_required',
        message: 'MFA verification required',
        mfa_challenge: {
          challenge_id: 'test-challenge-001',
          expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString()
        }
      });
    } else {
      return res.status(403).json({
        error: 'mfa_failed',
        message: 'Invalid MFA code'
      });
    }
  }

  // Create MFA session if verified
  if (mfaVerified) {
    createMFASession(user.id, 'TOTP');
  }

  const token = generateToken(user, mfaVerified);
  
  res.json({
    access_token: token,
    token_type: 'Bearer',
    expires_in: 86400,
    user: {
      id: user.id,
      email: user.email,
      roles: user.roles,
      regions: user.allowedRegions,
      pii_scope: user.piiScope
    }
  });
});

// Drivers endpoints
app.get('/api/v1/drivers', 
  performanceTracker('driver_list'),
  authenticateToken, 
  (req, res) => {
    const db = testDb.getConnection();
    const { status, region } = req.query;
    
    let query = `
      SELECT driver_id, region_id, status, rating, last_active,
             masked_phone as phone_number, 
             masked_email as email,
             CASE WHEN ? = 'full' THEN license_number ELSE 'XXX-XX-XXXXXX' END as license_number
      FROM v_drivers_filtered 
      WHERE 1=1
    `;
    const params = [req.user.pii_scope];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    if (region && region !== req.user.region) {
      // Cross-region access validation - implementing the 3 missing steps
      const caseId = req.headers['x-case-id'];
      const supportRoles = ['support', 'risk_investigator'];
      
      // Step 1: Check if role allows cross-region override
      if (!supportRoles.includes(req.user.role)) {
        return res.status(403).json({
          error: 'regional_access_denied',
          message: `Role ${req.user.role} not authorized for cross-region access`,
          security_event: {
            type: 'unauthorized_region_access',
            source_region: req.user.region,
            target_region: region,
            timestamp: new Date().toISOString()
          }
        });
      }
      
      // Step 2: Require case context for override
      if (!caseId) {
        return res.status(400).json({
          error: 'case_id_required',
          message: 'Case ID required for cross-region access',
          required_headers: ['X-Case-ID'],
          override_help: 'Support and risk investigators need valid case ID for cross-region access'
        });
      }
      
      // Step 3: Auto-expiry validation (mock - in real system check DB)
      const escalationExpiry = req.headers['x-escalation-expiry'];
      if (escalationExpiry) {
        const expiryTime = new Date(escalationExpiry).getTime();
        if (Date.now() > expiryTime) {
          return res.status(403).json({
            error: 'escalation_expired',
            message: 'Cross-region access escalation has expired',
            expired_at: escalationExpiry
          });
        }
      }
      
      // Grant cross-region override with audit
      res.set('X-Access-Override', 'cross_region_support');
      res.set('X-Case-Reference', caseId);
      res.set('X-Audit-ID', `audit-override-${Date.now()}`);
      
      // Audit emission on success (step missing from original)
      console.log(`🔄 AUDIT: Cross-region override granted`, {
        user: req.user.user_id,
        role: req.user.role,
        source_region: req.user.region,
        target_region: region,
        case_id: caseId,
        timestamp: new Date().toISOString()
      });
    }

    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ 
          error: 'database_error',
          message: 'Internal server error'
        });
      }
      
      res.json({
        data: rows,
        total: rows.length,
        region: req.user.region
      });
    });
  }
);

// PII unmasking endpoint
app.post('/api/v1/drivers/unmask-pii',
  performanceTracker('pii_unmask'),
  authenticateToken,
  (req, res) => {
    const { driver_id, fields, justification } = req.body;
    
    // Check PII access permissions
    if (req.user.pii_scope === 'none') {
      return res.status(403).json({
        error: 'insufficient_permissions',
        message: 'No PII access permissions'
      });
    }

    // Check MFA requirement for full PII access
    if (req.user.pii_scope === 'full' && !req.user.mfa_verified) {
      return res.status(403).json({
        error: 'mfa_required',
        message: 'MFA verification required for PII unmasking',
        mfa_challenge: {
          challenge_id: 'pii-unmask-challenge-001',
          expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString()
        }
      });
    }

    const db = testDb.getConnection();
    
    db.get(
      'SELECT * FROM drivers WHERE driver_id = ?',
      [driver_id],
      (err, driver) => {
        if (err || !driver) {
          return res.status(404).json({
            error: 'driver_not_found',
            message: 'Driver not found'
          });
        }

        // Log PII access
        db.run(
          `INSERT INTO pii_access_logs 
           (log_id, user_id, data_subject_id, access_type, justification, mfa_method) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            'log-' + Date.now(),
            req.user.user_id,
            driver_id,
            'pii_unmask',
            justification,
            req.user.mfa_verified ? 'TOTP' : null
          ]
        );

        const unmaskedData = {};
        fields.forEach(field => {
          if (field === 'phone_number') unmaskedData.phone_number = driver.phone_number;
          if (field === 'email') unmaskedData.email = driver.email;
          if (field === 'license_number') unmaskedData.license_number = driver.license_number;
        });

        res.json({
          unmasked_data: unmaskedData,
          audit_log: {
            access_id: 'audit-' + Date.now(),
            access_type: 'pii_unmask',
            timestamp: new Date().toISOString(),
            mfa_method: req.user.mfa_verified ? 'TOTP' : null,
            justification: justification
          }
        });
      }
    );
  }
);

// Data export endpoint
app.post('/api/v1/exports/drivers',
  performanceTracker('data_export'),
  authenticateToken,
  (req, res) => {
    const { export_type, region_id, date_range, fields, limit } = req.body;
    
    // Check export permissions
    if (!['analyst', 'ops_manager', 'regional_manager'].includes(req.user.role)) {
      return res.status(403).json({
        error: 'export_denied',
        message: 'Insufficient permissions for data export'
      });
    }

    // Apply export limits
    const maxExportLimit = req.user.role === 'analyst' ? 100 : 1000;
    const actualLimit = Math.min(limit || 100, maxExportLimit);

    const db = testDb.getConnection();
    
    db.all(
      `SELECT * FROM v_drivers_filtered LIMIT ?`,
      [actualLimit],
      (err, rows) => {
        if (err) {
          return res.status(500).json({
            error: 'export_failed',
            message: 'Data export failed'
          });
        }

        res.set('X-Export-Audit-ID', 'export-' + Date.now());
        
        res.json({
          data: rows.slice(0, actualLimit),
          export_limited: rows.length >= actualLimit,
          total_available: rows.length,
          exported_count: Math.min(rows.length, actualLimit)
        });
      }
    );
  }
);

// User management endpoint (admin only)
app.get('/api/v1/admin/users',
  performanceTracker('user_management'),
  authenticateToken,
  (req, res) => {
    if (!['iam_admin', 'app_admin'].includes(req.user.role)) {
      return res.status(403).json({
        error: 'insufficient_permissions',
        message: 'Admin access required',
        details: {
          required_permission: 'manage_users',
          user_role: req.user.role
        }
      });
    }

    // Return mock user list for admin
    res.json({
      data: [
        { id: 'usr-001', email: 'test@example.com', role: 'ground_ops' }
      ],
      total: 1
    });
  }
);

// Dashboard overview endpoint
app.get('/api/v1/dashboard/overview',
  performanceTracker('dashboard_overview'),
  authenticateToken,
  (req, res) => {
    const { region } = req.query;
    
    if (region && region !== req.user.region) {
      return res.status(403).json({
        error: 'regional_access_denied',
        message: `No access to region ${region}`
      });
    }

    res.json({
      data: {
        active_drivers: 15,
        completed_trips: 125,
        revenue: 25000,
        region: req.user.region
      }
    });
  }
);

// Temporary access approval endpoint
app.post('/api/v1/access/temporary/approve',
  performanceTracker('temp_access_approval'),
  authenticateToken,
  (req, res) => {
    if (!['regional_manager', 'ops_manager'].includes(req.user.role)) {
      return res.status(403).json({
        error: 'insufficient_permissions',
        message: 'Manager role required for approval'
      });
    }

    const { request_id, requesting_user, target_region, justification, duration_hours } = req.body;

    res.json({
      approval_status: 'approved',
      approved_by: req.user.user_id,
      approval_timestamp: new Date().toISOString(),
      expiry_timestamp: new Date(Date.now() + duration_hours * 60 * 60 * 1000).toISOString(),
      request_id,
      target_region
    });
  }
);

// System configuration endpoint (app admin only)
app.post('/api/v1/admin/users/modify-role',
  performanceTracker('role_modification'),
  authenticateToken,
  (req, res) => {
    // Always deny to test privilege escalation prevention
    res.status(403).json({
      error: 'privilege_escalation_attempt',
      message: 'Unauthorized role modification attempt',
      security_event: {
        type: 'privilege_escalation_attempt',
        attempted_role: req.body.new_role,
        current_role: req.user.role,
        timestamp: new Date().toISOString()
      }
    });
  }
);

// Emergency system access
app.get('/api/v1/system/emergency/driver-locations',
  performanceTracker('emergency_access'),
  authenticateToken,
  (req, res) => {
    const emergencyOverride = req.headers['x-emergency-override'];
    const justification = req.headers['x-emergency-justification'];

    if (emergencyOverride && justification) {
      res.set('X-Emergency-Override', 'active');
      res.set('X-Override-Justification', justification);
      res.set('X-Override-Expires', new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString());

      res.json({
        data: [
          { driver_id: 'drv-001', lat: 14.5995, lng: 120.9842, status: 'active' }
        ],
        emergency_access: true
      });
    } else {
      res.status(403).json({
        error: 'temporal_restriction',
        message: 'Emergency access only',
        details: {
          allowed_hours: '24/7 with proper authorization',
          current_time: new Date().toISOString()
        }
      });
    }
  }
);

// =====================================================
// Expansion Manager Endpoints
// =====================================================

// T-11: Create Region Request
app.post('/api/v1/regions/requests',
  performanceTracker('region_request'),
  authenticateToken,
  (req, res) => {
    const { region_name, country_code, timezone, justification } = req.body;
    
    // Authorize expansion_manager role
    if (req.user.role !== 'expansion_manager') {
      return res.status(403).json({
        error: 'RolePermissionDenied',
        message: 'Only expansion managers can create region requests',
        required_role: 'expansion_manager',
        current_role: req.user.role
      });
    }
    
    // Success response for valid expansion manager
    res.status(202).json({
      message: 'Region request created successfully',
      request_id: 'RRQ-2025-001',
      status: 'pending_approval',
      audit_id: 'AUD-REGION-REQ-001',
      approval_workflow: {
        stage: 'initial_review',
        required_approvers: ['executive'],
        estimated_processing_time: '3-5_business_days'
      }
    });
  }
);

// T-13: Configure Prelaunch Pricing (Flagged for Dual Control)
app.post('/api/v1/regions/:region_id/pricing/prelaunch',
  performanceTracker('prelaunch_pricing'),
  authenticateToken,
  (req, res) => {
    const { region_id } = req.params;
    const { base_fare, per_km_rate, time_rate } = req.body;
    
    // Authorize expansion_manager role
    if (req.user.role !== 'expansion_manager') {
      return res.status(403).json({
        error: 'RolePermissionDenied',
        message: 'Only expansion managers can configure prelaunch pricing'
      });
    }
    
    // Success response with dual control workflow
    res.status(202).json({
      message: 'Prelaunch pricing configuration flagged for approval',
      config_id: 'PRC-PRELAUNCH-001',
      status: 'flagged',
      approval_workflow: {
        workflow_type: 'prelaunch_pricing',
        primary_action: 'expansion_manager:configure_prelaunch_pricing_flagged',
        requires_dual_control: true,
        pending_secondary_approval: true,
        expiry: '24_hours'
      }
    });
  }
);

// T-14: Access Active Region (Should be Denied)
app.get('/api/v1/regions/:region_id/drivers',
  performanceTracker('active_region_access'),
  authenticateToken,
  (req, res) => {
    const { region_id } = req.params;
    
    // Simulate region state check - expansion managers blocked from active regions
    if (req.user.role === 'expansion_manager' && region_id === 'ph-ncr-manila') {
      return res.status(403).json({
        error: 'RegionStateForbidden',
        message: 'Expansion managers cannot access active regions',
        region_state: 'active',
        allowed_states: ['prospect', 'pilot'],
        security_violation: {
          type: 'expansion_scope_violation',
          user_role: req.user.role,
          attempted_region: region_id,
          region_state: 'active'
        }
      });
    }
    
    // Normal response for other roles or valid regions
    res.status(200).json({
      drivers: [],
      message: 'Access granted to region drivers'
    });
  }
);

// T-15: Promote Region Stage (Prospect → Pilot)
app.post('/api/v1/regions/promote',
  performanceTracker('region_promotion'),
  authenticateToken,
  (req, res) => {
    const { region_id, from_state, to_state, justification } = req.body;
    
    // Authorize expansion_manager role
    if (req.user.role !== 'expansion_manager') {
      return res.status(403).json({
        error: 'RolePermissionDenied',
        message: 'Only expansion managers can promote regions'
      });
    }
    
    // Success response with dual control requirement
    res.status(202).json({
      message: 'Region promotion initiated successfully',
      promotion_id: 'RPM-2025-001',
      from_state: from_state,
      to_state: to_state,
      approval_workflow: {
        workflow_type: 'region_promotion',
        requires_executive_approval: true,
        dual_control_required: true,
        estimated_approval_time: '2-4_hours'
      },
      state_transition: {
        logged: true,
        transition_id: 'RST-001',
        audit_trail: 'complete'
      }
    });
  }
);

// Global error handler
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(500).json({
    error: 'internal_server_error',
    message: 'An unexpected error occurred'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'not_found',
    message: `Endpoint ${req.method} ${req.path} not found`
  });
});

// Start server with better error handling
async function startServer() {
  try {
    await initializeDatabase();
    
    const server = app.listen(PORT, () => {
      console.log(`🚀 Mock API Server running on http://localhost:${PORT}`);
      console.log(`📊 Test database initialized with sample data`);
      console.log(`🔐 JWT Secret: ${JWT_SECRET.substring(0, 8)}...`);
      console.log(`🏥 Health check: http://localhost:${PORT}/healthz`);
      console.log(`⚡ Ready for AuthZ testing`);
    });

    // Better error handling
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        process.exit(1);
      } else {
        console.error('❌ Server error:', err);
        process.exit(1);
      }
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log('🛑 Shutting down mock API server...');
      server.close((err) => {
        if (err) {
          console.error('Error during shutdown:', err);
        }
        testDb?.cleanup();
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      console.error('❌ Uncaught exception:', err);
      shutdown();
    });

    return server;
  } catch (error) {
    console.error('❌ Failed to start mock API server:', error);
    process.exit(1);
  }
}

module.exports = { app, startServer, testDb };

// Start server if run directly
if (require.main === module) {
  startServer();
}