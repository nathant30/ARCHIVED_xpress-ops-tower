# Enhanced User Management Implementation Guide
**RBAC + ABAC System for Xpress Ops Tower**

## Overview

This guide details the implementation of a comprehensive Role-Based Access Control (RBAC) + Attribute-Based Access Control (ABAC) system for Xpress Ops Tower, based on the Xpress Policy Bundle v2025-08-31.

## 🎯 System Architecture

### Core Components

1. **Database Schema** (`database/migrations/006_enhanced_user_management.sql`)
   - Enhanced user management tables with ABAC attributes
   - Role hierarchy and permission system
   - Temporary access and escalation management
   - Comprehensive audit logging

2. **Type Definitions** (`src/types/rbac-abac.ts`)
   - Complete TypeScript interfaces for all system components
   - Xpress role definitions with permission mappings
   - ABAC context and decision types

3. **Policy Engine** (`src/lib/auth/rbac-engine.ts`)
   - 4-step policy evaluation (RBAC → Region → Sensitivity → Override)
   - Caching for performance
   - Cross-region override path for support/risk roles

4. **Authentication Middleware** (`src/lib/auth/enhanced-auth.ts`)
   - Request-level policy enforcement
   - Automated audit logging
   - Security header management

5. **API Endpoints**
   - User management (`src/app/api/auth/enhanced/users/route.ts`)
   - Role assignment (`src/app/api/auth/enhanced/roles/route.ts`)
   - Temporary access (`src/app/api/auth/enhanced/temporary-access/route.ts`)

6. **UI Components**
   - User management dashboard (`src/components/enhanced-auth/UserManagementDashboard.tsx`)
   - Enhanced authentication hooks (`src/hooks/useEnhancedAuth.tsx`)

## 🚀 Implementation Steps

### Step 1: Database Migration

Run the enhanced user management migration:

```bash
# Apply the migration
npm run db:migrate 006_enhanced_user_management.sql
```

This creates:
- Enhanced `users` table with ABAC attributes
- `roles` and `user_roles` tables with regional constraints
- `permissions` registry
- `user_sessions` with detailed tracking
- `temporary_access` for escalation cases
- Comprehensive audit logging

### Step 2: Install Dependencies

The system uses existing dependencies. Ensure these are available:

```bash
npm install jsonwebtoken jwt-decode
```

### Step 3: Environment Configuration

Update your environment variables:

```bash
# JWT Configuration
JWT_SECRET=your-256-bit-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key

# Session Configuration
SESSION_DURATION_HOURS=8
SESSION_WARNING_MINUTES=10

# MFA Configuration
MFA_ISSUER="Xpress Ops Tower"
MFA_BACKUP_CODES_COUNT=10

# Security
BCRYPT_ROUNDS=12
```

### Step 4: Replace Authentication System

#### 4.1 Update Authentication Context

Replace existing `useAuth` with `useEnhancedAuth`:

```tsx
// In your root layout or app component
import { EnhancedAuthProvider } from '@/hooks/useEnhancedAuth';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <EnhancedAuthProvider>
          {children}
        </EnhancedAuthProvider>
      </body>
    </html>
  );
}
```

#### 4.2 Update Component Usage

```tsx
// Old way
import { useAuth } from '@/hooks/useAuth';

// New way
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth';

function MyComponent() {
  const { user, hasPermission, canAccessRegion } = useEnhancedAuth();
  
  if (!hasPermission('view_live_map')) {
    return <div>Access denied</div>;
  }
  
  return <div>Protected content</div>;
}
```

#### 4.3 Update API Routes

Replace existing auth middleware:

```tsx
// Old way
import { withAuth } from '@/lib/auth';

// New way
import { withEnhancedAuth, requirePermission } from '@/lib/auth/enhanced-auth';

// Basic authentication
export const GET = withEnhancedAuth()(async (req, user) => {
  // Handler code
});

// Permission-based
export const POST = requirePermission('manage_users')(async (req, user) => {
  // Handler code
});

// Regional restrictions
export const PUT = withEnhancedAuth({
  requiredPermissions: ['assign_driver'],
  allowedRegions: ['ncr-manila', 'cebu'],
  dataClass: 'internal'
})(async (req, user) => {
  // Handler code
});
```

## 🔑 Role and Permission System

### Xpress Roles

Based on the policy bundle, the system includes 13 roles:

| Role | Level | Key Permissions |
|------|-------|----------------|
| `ground_ops` | 10 | Basic operations, driver assignment |
| `ops_monitor` | 20 | View-only operations monitoring |
| `ops_manager` | 30 | Full operational management |
| `regional_manager` | 40 | Regional oversight + temp access approval |
| `support` | 25 | Customer support, case management |
| `risk_investigator` | 35 | Fraud investigation, PII unmasking |
| `finance_ops` | 30 | Financial operations |
| `hr_ops` | 30 | HR management |
| `executive` | 60 | High-level dashboards |
| `analyst` | 25 | Data analysis, reporting |
| `auditor` | 50 | System auditing |
| `iam_admin` | 80 | User and access management |
| `app_admin` | 90 | System configuration |

### Permission Examples

```tsx
// Check single permission
if (hasPermission('assign_driver')) {
  // Allow driver assignment
}

// Check multiple permissions (any)
if (hasAnyPermission(['case_open', 'escalate_to_risk'])) {
  // Allow support actions
}

// Check role hierarchy
if (hasRole('regional_manager')) {
  // Allow regional management
}

// Check regional access
if (canAccessRegion('ncr-manila')) {
  // Allow Manila operations
}

// Check PII access
if (canUnmaskPII('confidential')) {
  // Show unmasked data
} else {
  // Show masked data
}
```

## 🌐 ABAC Attributes

### User Token Attributes
- `allowedRegions`: Array of region UUIDs
- `piiScope`: 'none' | 'masked' | 'full'
- `domain`: 'fraud' | 'safety' | 'compliance' (optional)
- `escalation`: Case-based temporary permissions

### Resource Attributes
- `regionId`: Target region
- `dataClass`: 'public' | 'internal' | 'confidential' | 'restricted'
- `containsPII`: Boolean flag
- `action`: Required capability

### Context Attributes
- `channel`: 'ui' | 'api' | 'batch'
- `mfaPresent`: Boolean MFA verification status
- `ipASN`: Network context
- `timestamp`: Request time

## 🔐 Security Features

### Multi-Factor Authentication

```tsx
// Enable MFA for user
const { qrCode, backupCodes } = await enableMFA();

// Verify MFA code
await verifyMFA(code);

// Check MFA status
const { mfaRequired } = useEnhancedAuth();
```

### Temporary Access/Escalation

```tsx
// Request temporary PII access for support case
await requestTemporaryAccess({
  permissions: ['unmask_pii_with_mfa'],
  regions: ['ncr-manila'],
  piiScopeOverride: 'full',
  caseId: 'CASE-2025-001',
  escalationType: 'support',
  justification: 'Customer complaint investigation',
  expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000) // 4 hours
});

// Get active temporary access
const temporaryAccess = getActiveTemporaryAccess();
```

### Session Management

```tsx
// Check session expiry
if (isSessionExpiringSoon()) {
  // Warn user about session expiry
}

// Extend session
await extendSession();
```

## 📊 User Management Interface

### Using the Dashboard Component

```tsx
import { UserManagementDashboard } from '@/components/enhanced-auth/UserManagementDashboard';

function AdminPage() {
  return (
    <div>
      <h1>Administration</h1>
      <UserManagementDashboard />
    </div>
  );
}
```

### Features
- **User listing** with filtering and search
- **Role-based actions** (edit, suspend based on hierarchy)
- **Status management** (active, suspended, locked)
- **Regional filtering** (users see only their regions)
- **PII masking** based on viewer's permissions

## 🔍 Policy Evaluation

### 4-Step Evaluation Process

1. **RBAC Check**: Does user's role allow the action?
2. **Regional Check**: Can user access the target region?
3. **Sensitivity Check**: Does PII scope allow data access?
4. **Override Check**: Any cross-region or escalation paths?

### Example Policy Decisions

```typescript
// Support user accessing Manila data from Cebu office
const result = await rbacEngine.evaluatePolicy({
  user: {
    roles: ['support'],
    allowedRegions: ['cebu'],
    piiScope: 'masked',
    escalation: {
      caseId: 'CASE-2025-001',
      expiresAt: futureDate
    }
  },
  resource: {
    regionId: 'ncr-manila',
    dataClass: 'confidential',
    containsPII: true
  },
  action: 'case_open',
  context: {
    mfaPresent: true,
    channel: 'ui'
  }
});

// Result: ALLOW with cross-region override + enhanced auditing
```

## 🔧 Testing

Run the test suite to verify the implementation:

```bash
# Run RBAC engine tests
npm test __tests__/rbac-abac/rbac-engine.test.ts

# Run all auth-related tests
npm test -- --testPathPattern=rbac-abac
```

## 📝 Audit and Compliance

### Automatic Audit Logging

All actions are automatically logged:

```sql
-- View recent user management actions
SELECT 
    event_type,
    user_id,
    target_user_id,
    success,
    mfa_verified,
    created_at
FROM user_management_audit 
ORDER BY created_at DESC 
LIMIT 100;
```

### Compliance Features

- **Data Privacy Act 2012**: PII masking and access controls
- **BSP Regulations**: Financial data protection
- **Dual Control**: Critical operations require multiple approvals
- **Retention Policies**: Configurable data retention periods

## 🚀 Production Deployment

### 1. Database Setup

```bash
# Run all migrations including enhanced user management
npm run db:migrate

# Seed initial roles and permissions
npm run db:seed
```

### 2. Environment Hardening

```bash
# Set production JWT secrets (256-bit minimum)
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)

# Configure session security
SESSION_SECURE_COOKIES=true
SESSION_SAME_SITE=strict

# Enable security headers
SECURITY_HEADERS_ENABLED=true
```

### 3. Performance Optimization

The system includes several performance optimizations:

- **Policy caching**: 5-minute TTL for policy decisions
- **Database indexing**: Optimized for user/permission queries  
- **Session management**: Efficient session validation
- **Lazy loading**: UI components load permissions on demand

### 4. Monitoring

Set up monitoring for:

- **Authentication failures**: Failed login attempts
- **Authorization denials**: Blocked access attempts
- **Session anomalies**: Unusual session patterns
- **Temporary access**: Escalation request patterns
- **Policy performance**: Decision latency metrics

## 🔄 Migration from Existing System

### Data Migration

```sql
-- Migrate existing users to enhanced schema
INSERT INTO users (
    id, email, first_name, last_name, status,
    allowed_regions, pii_scope, mfa_enabled,
    created_at, updated_at
)
SELECT 
    id, email, first_name, last_name,
    CASE WHEN is_active THEN 'active'::user_status 
         ELSE 'inactive'::user_status END,
    ARRAY[]::uuid[], -- Start with no regional restrictions
    'masked'::pii_scope, -- Conservative PII access
    mfa_enabled,
    created_at, updated_at
FROM legacy_users;

-- Map existing roles to new system
INSERT INTO user_roles (user_id, role_id, assigned_at, is_active)
SELECT 
    u.id,
    r.id,
    NOW(),
    true
FROM legacy_users u
JOIN roles r ON r.name = 
    CASE u.role
        WHEN 'admin' THEN 'app_admin'
        WHEN 'dispatcher' THEN 'ops_manager'
        WHEN 'analyst' THEN 'analyst'
        WHEN 'safety_monitor' THEN 'ops_monitor'
        ELSE 'ground_ops'
    END;
```

### Gradual Rollout

1. **Phase 1**: Deploy new schema and API endpoints
2. **Phase 2**: Migrate user data and roles
3. **Phase 3**: Replace authentication in non-critical pages
4. **Phase 4**: Replace authentication in critical operations
5. **Phase 5**: Remove legacy authentication system

## 📞 Support and Troubleshooting

### Common Issues

**Q: Users can't access resources they previously could**
A: Check regional restrictions in `user_roles.allowed_regions`. Legacy users may need region assignments.

**Q: Temporary access requests aren't working**
A: Verify the requesting user has appropriate escalation roles (`support`, `risk_investigator`) and case ID format.

**Q: Performance issues with policy evaluation**
A: Monitor cache hit rates. Consider increasing cache TTL for stable environments.

**Q: MFA enforcement not working**
A: Check `requiresMFA` flags in permission definitions and policy evaluation context.

### Debug Commands

```bash
# Check user effective permissions
node -e "
const rbac = require('./lib/auth/rbac-engine');
const user = await fetchUser('user-id');
console.log('Permissions:', rbac.validateUserPermissions(user));
console.log('Regions:', rbac.getEffectiveRegions(user));
console.log('PII Scope:', rbac.getEffectivePIIScope(user));
"

# Test policy evaluation
node -e "
const rbac = require('./lib/auth/rbac-engine');
const result = await rbac.evaluatePolicy({
  user: { roles: ['ops_manager'], allowedRegions: ['cebu'], piiScope: 'masked' },
  resource: { regionId: 'ncr-manila', dataClass: 'internal', containsPII: false },
  action: 'assign_driver',
  context: { channel: 'ui', mfaPresent: false }
});
console.log('Decision:', result.decision);
console.log('Reason:', result.reasons[0]);
"
```

---

## ✅ Implementation Complete

Your Xpress Ops Tower now has a production-ready RBAC + ABAC user management system with:

- ✅ **13 Xpress roles** with hierarchical permissions
- ✅ **Regional access control** for Philippines operations  
- ✅ **PII masking and unmasking** with MFA requirements
- ✅ **Temporary access escalation** for support/risk scenarios
- ✅ **Comprehensive audit logging** for compliance
- ✅ **Policy caching** for performance
- ✅ **UI components** for user management
- ✅ **Cross-region override** paths for emergency cases
- ✅ **Test coverage** for critical functionality

The system is designed to scale with your operations while maintaining security and compliance with Philippine regulations.