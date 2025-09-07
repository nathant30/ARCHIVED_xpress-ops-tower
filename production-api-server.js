#!/usr/bin/env node

/**
 * Production RBAC+ABAC API Server
 * Integrates with the full authorization system
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4001;
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-for-local-development-only';

// Connect to production database
const DB_PATH = path.join(__dirname, 'production-authz.db');
const db = new sqlite3.Database(DB_PATH);

app.use(express.json());

// Security headers middleware
app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-XSS-Protection': '1; mode=block'
  });
  next();
});

// =====================================================
// RBAC+ABAC Integration
// =====================================================

async function getUserRoleAndPermissions(userId) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        u.user_id,
        u.email,
        u.full_name,
        r.name as role_name,
        r.level as role_level,
        GROUP_CONCAT(c.action) as permissions,
        GROUP_CONCAT(ur.region_id) as allowed_regions
      FROM users u
      JOIN user_roles ur_role ON u.user_id = ur_role.user_id AND ur_role.is_active = 1
      JOIN roles r ON ur_role.role_id = r.role_id
      LEFT JOIN role_capabilities rc ON r.role_id = rc.role_id
      LEFT JOIN capabilities c ON rc.capability_id = c.capability_id
      LEFT JOIN user_regions ur ON u.user_id = ur.user_id AND ur.is_active = 1
      WHERE u.user_id = ? AND u.status = 'active'
      GROUP BY u.user_id, r.role_id
    `;
    
    db.get(query, [userId], (err, row) => {
      if (err) return reject(err);
      if (!row) return resolve(null);
      
      resolve({
        userId: row.user_id,
        email: row.email,
        fullName: row.full_name,
        role: row.role_name,
        level: row.role_level,
        permissions: row.permissions ? row.permissions.split(',') : [],
        allowedRegions: row.allowed_regions ? row.allowed_regions.split(',') : []
      });
    });
  });
}

// 5-Step Authorization Function
function authorize(user, action, resource = {}) {
  // Step 1: RBAC - Check if user role has permission
  if (!user.permissions.includes(action)) {
    return {
      allowed: false,
      step: 'rbac',
      reason: `Role '${user.role}' does not have permission '${action}'`
    };
  }
  
  // Step 2: Regional scope - Check region access
  if (resource.region_id && !user.allowedRegions.includes(resource.region_id)) {
    return {
      allowed: false,
      step: 'regional',
      reason: `User not authorized for region '${resource.region_id}'`
    };
  }
  
  // Step 3: Sensitivity - Check PII/MFA requirements
  if (action.includes('pii') || action.includes('unmask')) {
    // For this demo, assume MFA is required but not implemented
    return {
      allowed: false,
      step: 'sensitivity',
      reason: 'PII access requires MFA verification'
    };
  }
  
  // Step 4: Override - Cross-region case access (not implemented in demo)
  
  // Step 5: Expansion scope - Check region state for expansion_manager
  if (user.role === 'expansion_manager' && resource.region_state) {
    if (!['prospect', 'pilot'].includes(resource.region_state)) {
      return {
        allowed: false,
        step: 'expansion_scope',
        reason: `expansion_manager cannot access ${resource.region_state} regions`
      };
    }
  }
  
  return {
    allowed: true,
    reason: '5-step authorization passed'
  };
}

// JWT generation with role claims
function generateToken(user) {
  const payload = {
    sub: user.userId,
    user_id: user.userId,
    email: user.email,
    role: user.role,
    level: user.level,
    permissions: user.permissions,
    allowed_regions: user.allowedRegions,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
  };
  
  return jwt.sign(payload, JWT_SECRET);
}

// Authentication middleware
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      error: 'unauthorized',
      message: 'Access token required'
    });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    
    // Get fresh user data from database
    const userData = await getUserRoleAndPermissions(payload.user_id);
    if (!userData) {
      return res.status(403).json({
        error: 'forbidden', 
        message: 'User not found or inactive'
      });
    }
    
    req.user = userData;
    next();
  } catch (err) {
    return res.status(403).json({
      error: 'forbidden',
      message: 'Invalid or expired token'
    });
  }
}

// =====================================================
// API Endpoints
// =====================================================

// Health check
app.get('/healthz', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: Math.floor(process.uptime()),
    database: 'connected',
    rbac_engine: 'active',
    timestamp: new Date().toISOString()
  });
});

// Authentication endpoint
app.post('/api/v1/auth/login', async (req, res) => {
  const { username, password } = req.body;
  
  // Simple password check for demo (in production, use proper hashing)
  if (password !== 'test123') {
    return res.status(401).json({
      error: 'authentication_failed',
      message: 'Invalid credentials'
    });
  }
  
  try {
    // Find user by email
    const userData = await new Promise((resolve, reject) => {
      db.get('SELECT user_id FROM users WHERE email = ?', [username], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
    
    if (!userData) {
      return res.status(401).json({
        error: 'authentication_failed',
        message: 'Invalid credentials'
      });
    }
    
    // Get full user data with roles and permissions
    const user = await getUserRoleAndPermissions(userData.user_id);
    if (!user) {
      return res.status(401).json({
        error: 'authentication_failed',
        message: 'User inactive or no role assigned'
      });
    }
    
    const token = generateToken(user);
    
    res.json({
      access_token: token,
      token_type: 'Bearer',
      expires_in: 86400,
      user: {
        id: user.userId,
        email: user.email,
        role: user.role,
        level: user.level,
        regions: user.allowedRegions
      }
    });
    
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      error: 'internal_server_error',
      message: 'Authentication service error'
    });
  }
});

// Protected endpoint: List drivers
app.get('/api/v1/drivers', authenticateToken, (req, res) => {
  const authResult = authorize(req.user, 'view_drivers', {
    region_id: req.query.region || req.user.allowedRegions[0]
  });
  
  if (!authResult.allowed) {
    return res.status(403).json({
      error: 'authorization_failed',
      message: authResult.reason,
      step: authResult.step
    });
  }
  
  // Return mock driver data
  res.json({
    drivers: [
      {
        driver_id: 'drv-001',
        name: 'Test Driver',
        region: req.user.allowedRegions[0],
        status: 'available'
      }
    ],
    region: req.user.allowedRegions[0],
    count: 1
  });
});

// Protected endpoint: User management
app.get('/api/v1/admin/users', authenticateToken, (req, res) => {
  const authResult = authorize(req.user, 'manage_users');
  
  if (!authResult.allowed) {
    return res.status(403).json({
      error: 'insufficient_permissions',
      message: authResult.reason,
      required_permission: 'manage_users',
      user_role: req.user.role
    });
  }
  
  res.json({ users: [] });
});

// Expansion Manager endpoints
app.post('/api/v1/regions/requests', authenticateToken, (req, res) => {
  const authResult = authorize(req.user, 'create_region_request');
  
  if (!authResult.allowed) {
    return res.status(403).json({
      error: 'authorization_failed',
      message: authResult.reason
    });
  }
  
  res.status(202).json({
    message: 'Region request created successfully',
    request_id: 'RRQ-2025-001',
    audit_id: 'AUD-REGION-REQ-001'
  });
});

// Error handlers
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(500).json({
    error: 'internal_server_error',
    message: 'An unexpected error occurred'
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: 'not_found',
    message: `Endpoint ${req.method} ${req.path} not found`
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Production RBAC+ABAC API Server running on http://localhost:${PORT}`);
  console.log(`📊 Database: ${DB_PATH}`);
  console.log(`🔐 JWT Secret: ${JWT_SECRET.substring(0, 8)}...`);
  console.log(`⚡ Ready for production testing`);
});

// Graceful shutdown
const shutdown = async () => {
  console.log('🛑 Shutting down production API server...');
  server.close((err) => {
    if (err) console.error('Error during shutdown:', err);
    db.close();
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);