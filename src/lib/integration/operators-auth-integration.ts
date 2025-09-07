// =====================================================
// OPERATORS AUTHENTICATION & AUTHORIZATION INTEGRATION
// Seamlessly integrates operator authentication with existing RBAC system
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { authManager, AuthPayload, UserRole, Permission } from '@/lib/auth';
import { database } from '@/lib/database';
import { logger } from '@/lib/security/productionLogger';
import { auditLogger, AuditEventType, SecurityLevel } from '@/lib/security/auditLogger';
import { v4 as uuidv4 } from 'uuid';
import type { Operator } from '@/types/operators';

// =====================================================
// OPERATOR-SPECIFIC AUTHENTICATION TYPES
// =====================================================

export interface OperatorAuthContext {
  operator: Operator;
  user: AuthPayload;
  permissions: OperatorPermission[];
  regionalAccess: string[];
  operatorRole: OperatorRole;
  sessionContext: OperatorSessionContext;
}

export interface OperatorPermission extends Permission {
  operatorSpecific: boolean;
  vehicleScope?: string[];
  driverScope?: string[];
  regionScope?: string[];
  tierRestrictions?: string[];
}

export type OperatorRole = 
  | 'operator_owner'      // Full control over operator business
  | 'operator_manager'    // Operational management
  | 'operator_dispatcher' // Trip and driver management
  | 'operator_finance'    // Financial operations only
  | 'operator_viewer';    // Read-only access

export interface OperatorSessionContext {
  operatorId: string;
  businessName: string;
  operatorType: string;
  commissionTier: string;
  activeRegions: string[];
  vehicleCount: number;
  driverCount: number;
  complianceStatus: 'compliant' | 'warning' | 'non_compliant';
  sessionStartTime: Date;
  lastActivityTime: Date;
  deviceFingerprint?: string;
}

export interface OperatorLoginRequest {
  email: string;
  password: string;
  businessRegistrationNumber: string;
  deviceId?: string;
  mfaCode?: string;
  rememberDevice?: boolean;
}

export interface OperatorAuthResult {
  success: boolean;
  operator?: Operator;
  authContext?: OperatorAuthContext;
  tokens?: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
  error?: string;
  mfaRequired?: boolean;
  complianceWarnings?: string[];
}

// =====================================================
// OPERATOR PERMISSION DEFINITIONS
// =====================================================

const OPERATOR_PERMISSIONS: Record<OperatorRole, OperatorPermission[]> = {
  operator_owner: [
    // Full business control
    { id: 'operator:manage', name: 'Manage Operator', resource: 'operator', action: 'manage', operatorSpecific: true },
    { id: 'operator:settings', name: 'Operator Settings', resource: 'operator', action: 'configure', operatorSpecific: true },
    { id: 'operator:users', name: 'Manage Users', resource: 'users', action: 'manage', operatorSpecific: true },
    
    // Financial operations
    { id: 'financials:read', name: 'View Financials', resource: 'financials', action: 'read', operatorSpecific: true },
    { id: 'financials:manage', name: 'Manage Financials', resource: 'financials', action: 'manage', operatorSpecific: true },
    { id: 'payouts:request', name: 'Request Payouts', resource: 'payouts', action: 'request', operatorSpecific: true },
    { id: 'payouts:approve', name: 'Approve Payouts', resource: 'payouts', action: 'approve', operatorSpecific: true },
    
    // Vehicle and driver management
    { id: 'vehicles:read', name: 'View Vehicles', resource: 'vehicles', action: 'read', operatorSpecific: true },
    { id: 'vehicles:manage', name: 'Manage Vehicles', resource: 'vehicles', action: 'manage', operatorSpecific: true },
    { id: 'drivers:read', name: 'View Drivers', resource: 'drivers', action: 'read', operatorSpecific: true },
    { id: 'drivers:manage', name: 'Manage Drivers', resource: 'drivers', action: 'manage', operatorSpecific: true },
    
    // Trip and booking operations
    { id: 'trips:read', name: 'View Trips', resource: 'trips', action: 'read', operatorSpecific: true },
    { id: 'bookings:manage', name: 'Manage Bookings', resource: 'bookings', action: 'manage', operatorSpecific: true },
    
    // Performance and analytics
    { id: 'performance:read', name: 'View Performance', resource: 'performance', action: 'read', operatorSpecific: true },
    { id: 'analytics:read', name: 'View Analytics', resource: 'analytics', action: 'read', operatorSpecific: true },
    { id: 'analytics:export', name: 'Export Analytics', resource: 'analytics', action: 'export', operatorSpecific: true },
    
    // Compliance and reporting
    { id: 'compliance:read', name: 'View Compliance', resource: 'compliance', action: 'read', operatorSpecific: true },
    { id: 'compliance:manage', name: 'Manage Compliance', resource: 'compliance', action: 'manage', operatorSpecific: true },
    { id: 'reports:generate', name: 'Generate Reports', resource: 'reports', action: 'generate', operatorSpecific: true }
  ],
  
  operator_manager: [
    // Operational management
    { id: 'operator:read', name: 'View Operator Info', resource: 'operator', action: 'read', operatorSpecific: true },
    { id: 'operator:update', name: 'Update Operator Info', resource: 'operator', action: 'update', operatorSpecific: true },
    
    // Financial viewing
    { id: 'financials:read', name: 'View Financials', resource: 'financials', action: 'read', operatorSpecific: true },
    { id: 'payouts:read', name: 'View Payouts', resource: 'payouts', action: 'read', operatorSpecific: true },
    
    // Vehicle and driver operations
    { id: 'vehicles:read', name: 'View Vehicles', resource: 'vehicles', action: 'read', operatorSpecific: true },
    { id: 'vehicles:assign', name: 'Assign Vehicles', resource: 'vehicles', action: 'assign', operatorSpecific: true },
    { id: 'drivers:read', name: 'View Drivers', resource: 'drivers', action: 'read', operatorSpecific: true },
    { id: 'drivers:manage', name: 'Manage Drivers', resource: 'drivers', action: 'manage', operatorSpecific: true },
    
    // Trip operations
    { id: 'trips:read', name: 'View Trips', resource: 'trips', action: 'read', operatorSpecific: true },
    { id: 'bookings:read', name: 'View Bookings', resource: 'bookings', action: 'read', operatorSpecific: true },
    { id: 'bookings:assign', name: 'Assign Bookings', resource: 'bookings', action: 'assign', operatorSpecific: true },
    
    // Performance monitoring
    { id: 'performance:read', name: 'View Performance', resource: 'performance', action: 'read', operatorSpecific: true },
    { id: 'analytics:read', name: 'View Analytics', resource: 'analytics', action: 'read', operatorSpecific: true },
    
    // Basic compliance
    { id: 'compliance:read', name: 'View Compliance', resource: 'compliance', action: 'read', operatorSpecific: true }
  ],
  
  operator_dispatcher: [
    // Driver and trip management
    { id: 'drivers:read', name: 'View Drivers', resource: 'drivers', action: 'read', operatorSpecific: true },
    { id: 'drivers:assign', name: 'Assign Drivers', resource: 'drivers', action: 'assign', operatorSpecific: true },
    { id: 'vehicles:read', name: 'View Vehicles', resource: 'vehicles', action: 'read', operatorSpecific: true },
    
    // Trip operations
    { id: 'trips:read', name: 'View Trips', resource: 'trips', action: 'read', operatorSpecific: true },
    { id: 'bookings:read', name: 'View Bookings', resource: 'bookings', action: 'read', operatorSpecific: true },
    { id: 'bookings:assign', name: 'Assign Bookings', resource: 'bookings', action: 'assign', operatorSpecific: true },
    { id: 'bookings:cancel', name: 'Cancel Bookings', resource: 'bookings', action: 'cancel', operatorSpecific: true },
    
    // Location and routing
    { id: 'locations:read', name: 'View Locations', resource: 'locations', action: 'read', operatorSpecific: true },
    
    // Basic reporting
    { id: 'reports:basic', name: 'Basic Reports', resource: 'reports', action: 'basic', operatorSpecific: true }
  ],
  
  operator_finance: [
    // Financial operations
    { id: 'financials:read', name: 'View Financials', resource: 'financials', action: 'read', operatorSpecific: true },
    { id: 'payouts:read', name: 'View Payouts', resource: 'payouts', action: 'read', operatorSpecific: true },
    { id: 'payouts:request', name: 'Request Payouts', resource: 'payouts', action: 'request', operatorSpecific: true },
    
    // Transaction management
    { id: 'transactions:read', name: 'View Transactions', resource: 'transactions', action: 'read', operatorSpecific: true },
    { id: 'transactions:reconcile', name: 'Reconcile Transactions', resource: 'transactions', action: 'reconcile', operatorSpecific: true },
    
    // Boundary fees
    { id: 'boundary_fees:read', name: 'View Boundary Fees', resource: 'boundary_fees', action: 'read', operatorSpecific: true },
    { id: 'boundary_fees:process', name: 'Process Boundary Fees', resource: 'boundary_fees', action: 'process', operatorSpecific: true },
    
    // Financial reports
    { id: 'reports:financial', name: 'Financial Reports', resource: 'reports', action: 'financial', operatorSpecific: true },
    
    // Compliance viewing
    { id: 'compliance:read', name: 'View Compliance', resource: 'compliance', action: 'read', operatorSpecific: true }
  ],
  
  operator_viewer: [
    // Read-only access
    { id: 'operator:read', name: 'View Operator Info', resource: 'operator', action: 'read', operatorSpecific: true },
    { id: 'vehicles:read', name: 'View Vehicles', resource: 'vehicles', action: 'read', operatorSpecific: true },
    { id: 'drivers:read', name: 'View Drivers', resource: 'drivers', action: 'read', operatorSpecific: true },
    { id: 'trips:read', name: 'View Trips', resource: 'trips', action: 'read', operatorSpecific: true },
    { id: 'performance:read', name: 'View Performance', resource: 'performance', action: 'read', operatorSpecific: true },
    { id: 'analytics:read', name: 'View Analytics', resource: 'analytics', action: 'read', operatorSpecific: true }
  ]
};

// =====================================================
// OPERATOR AUTHENTICATION SERVICE
// =====================================================

export class OperatorAuthService {
  
  /**
   * Authenticate operator with enhanced security and compliance checks
   */
  async authenticateOperator(loginRequest: OperatorLoginRequest): Promise<OperatorAuthResult> {
    try {
      logger.info('Operator authentication attempt', { 
        email: loginRequest.email, 
        businessReg: loginRequest.businessRegistrationNumber?.substring(0, 4) + '***'
      });
      
      // 1. Get operator by business registration and email
      const operatorResult = await database.query(
        `SELECT o.*, u.id as user_id, u.password_hash, u.mfa_enabled, u.status as user_status,
                u.failed_login_attempts, u.locked_until
         FROM operators o
         JOIN users u ON o.user_id = u.id
         WHERE o.business_registration_number = $1 AND u.email = $2 AND o.is_active = true`,
        [loginRequest.businessRegistrationNumber, loginRequest.email],
        { operation: 'operator_auth_lookup' }
      );
      
      if (operatorResult.rows.length === 0) {
        auditLogger.logEvent(
          AuditEventType.AUTHENTICATION,
          SecurityLevel.HIGH,
          'FAILURE',
          {
            reason: 'operator_not_found',
            email: loginRequest.email,
            businessRegistration: loginRequest.businessRegistrationNumber
          }
        );
        
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }
      
      const operatorData = operatorResult.rows[0];
      
      // 2. Check account lockout
      if (operatorData.locked_until && new Date(operatorData.locked_until) > new Date()) {
        auditLogger.logEvent(
          AuditEventType.AUTHENTICATION,
          SecurityLevel.HIGH,
          'FAILURE',
          {
            reason: 'account_locked',
            operatorId: operatorData.id,
            lockedUntil: operatorData.locked_until
          }
        );
        
        return {
          success: false,
          error: 'Account temporarily locked'
        };
      }
      
      // 3. Check user status
      if (operatorData.user_status !== 'active') {
        return {
          success: false,
          error: 'Account is not active'
        };
      }
      
      // 4. Check operator status
      if (operatorData.status !== 'active') {
        const complianceWarnings = await this.getComplianceWarnings(operatorData.id);
        return {
          success: false,
          error: `Operator status: ${operatorData.status}`,
          complianceWarnings
        };
      }
      
      // 5. Verify password
      const passwordValid = await authManager.verifyPassword(loginRequest.password, operatorData.password_hash);
      if (!passwordValid) {
        // Increment failed attempts
        await this.incrementFailedAttempts(operatorData.user_id);
        
        auditLogger.logEvent(
          AuditEventType.AUTHENTICATION,
          SecurityLevel.HIGH,
          'FAILURE',
          {
            reason: 'invalid_password',
            operatorId: operatorData.id,
            userId: operatorData.user_id
          }
        );
        
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }
      
      // 6. Check MFA if enabled
      if (operatorData.mfa_enabled) {
        if (!loginRequest.mfaCode) {
          return {
            success: false,
            mfaRequired: true,
            error: 'MFA code required'
          };
        }
        
        const mfaValid = await this.verifyMFA(operatorData.user_id, loginRequest.mfaCode);
        if (!mfaValid) {
          auditLogger.logEvent(
            AuditEventType.AUTHENTICATION,
            SecurityLevel.HIGH,
            'FAILURE',
            {
              reason: 'invalid_mfa',
              operatorId: operatorData.id,
              userId: operatorData.user_id
            }
          );
          
          return {
            success: false,
            error: 'Invalid MFA code'
          };
        }
      }
      
      // 7. Create operator context
      const operator: Operator = this.mapDatabaseToOperator(operatorData);
      const operatorRole = this.determineOperatorRole(operatorData);
      const permissions = OPERATOR_PERMISSIONS[operatorRole];
      
      // 8. Create session context
      const sessionContext: OperatorSessionContext = {
        operatorId: operator.id,
        businessName: operator.business_name,
        operatorType: operator.operator_type,
        commissionTier: operator.commission_tier,
        activeRegions: operator.allowed_regions,
        vehicleCount: operator.current_vehicle_count,
        driverCount: await this.getDriverCount(operator.id),
        complianceStatus: await this.getComplianceStatus(operator.id),
        sessionStartTime: new Date(),
        lastActivityTime: new Date(),
        deviceFingerprint: loginRequest.deviceId
      };
      
      // 9. Generate JWT tokens with operator context
      const tokens = await authManager.generateTokens({
        userId: operatorData.user_id,
        userType: 'operator',
        role: this.mapOperatorRoleToUserRole(operatorRole),
        regionId: operator.primary_region_id,
        sessionId: uuidv4(),
        deviceId: loginRequest.deviceId
      });
      
      // 10. Create auth context
      const authContext: OperatorAuthContext = {
        operator,
        user: await authManager.verifyToken(tokens.accessToken)!,
        permissions,
        regionalAccess: operator.allowed_regions,
        operatorRole,
        sessionContext
      };
      
      // 11. Store session context
      await this.storeSessionContext(authContext.user.sessionId, sessionContext);
      
      // 12. Reset failed attempts and update last login
      await this.resetFailedAttempts(operatorData.user_id);
      await this.updateLastLogin(operatorData.user_id, operator.id);
      
      // 13. Check compliance warnings
      const complianceWarnings = await this.getComplianceWarnings(operator.id);
      
      auditLogger.logEvent(
        AuditEventType.AUTHENTICATION,
        SecurityLevel.LOW,
        'SUCCESS',
        {
          operatorId: operator.id,
          userId: operatorData.user_id,
          operatorRole,
          sessionId: authContext.user.sessionId,
          deviceId: loginRequest.deviceId
        }
      );
      
      return {
        success: true,
        operator,
        authContext,
        tokens,
        complianceWarnings: complianceWarnings.length > 0 ? complianceWarnings : undefined
      };
      
    } catch (error) {
      logger.error('Operator authentication failed', { error, loginRequest: { ...loginRequest, password: '***' } });
      return {
        success: false,
        error: 'Authentication failed'
      };
    }
  }
  
  /**
   * Check if operator has specific permission
   */
  async hasPermission(authContext: OperatorAuthContext, permission: string, resourceId?: string): Promise<boolean> {
    try {
      // Check if permission exists in operator's permissions
      const hasBasicPermission = authContext.permissions.some(p => p.id === permission);
      if (!hasBasicPermission) {
        return false;
      }
      
      // If resource ID is provided, check resource-specific access
      if (resourceId) {
        const permissionConfig = authContext.permissions.find(p => p.id === permission);
        if (permissionConfig) {
          // Check vehicle scope
          if (permissionConfig.vehicleScope && resourceId.startsWith('vehicle_')) {
            const vehicleId = resourceId.replace('vehicle_', '');
            return permissionConfig.vehicleScope.includes(vehicleId);
          }
          
          // Check driver scope
          if (permissionConfig.driverScope && resourceId.startsWith('driver_')) {
            const driverId = resourceId.replace('driver_', '');
            return permissionConfig.driverScope.includes(driverId);
          }
          
          // Check region scope
          if (permissionConfig.regionScope && resourceId.startsWith('region_')) {
            const regionId = resourceId.replace('region_', '');
            return permissionConfig.regionScope.includes(regionId);
          }
        }
      }
      
      return true;
      
    } catch (error) {
      logger.error('Permission check failed', { error, operatorId: authContext.operator.id, permission });
      return false;
    }
  }
  
  /**
   * Check regional access for operator
   */
  async hasRegionalAccess(authContext: OperatorAuthContext, regionId: string): Promise<boolean> {
    return authContext.regionalAccess.includes(regionId);
  }
  
  /**
   * Get operator context from session
   */
  async getOperatorContext(sessionId: string): Promise<OperatorAuthContext | null> {
    try {
      const sessionResult = await database.query(
        `SELECT session_context FROM operator_sessions WHERE session_id = $1 AND expires_at > NOW()`,
        [sessionId]
      );
      
      if (sessionResult.rows.length === 0) {
        return null;
      }
      
      const sessionData = sessionResult.rows[0].session_context;
      
      // Get fresh operator data
      const operatorResult = await database.query(
        'SELECT * FROM operators WHERE id = $1 AND is_active = true',
        [sessionData.operatorId]
      );
      
      if (operatorResult.rows.length === 0) {
        return null;
      }
      
      const operator = this.mapDatabaseToOperator(operatorResult.rows[0]);
      const operatorRole = this.determineOperatorRole(operatorResult.rows[0]);
      const permissions = OPERATOR_PERMISSIONS[operatorRole];
      
      // Verify JWT token to get user context
      const user = await authManager.verifyToken(sessionId);
      if (!user) {
        return null;
      }
      
      return {
        operator,
        user,
        permissions,
        regionalAccess: operator.allowed_regions,
        operatorRole,
        sessionContext: sessionData
      };
      
    } catch (error) {
      logger.error('Get operator context failed', { error, sessionId });
      return null;
    }
  }
  
  /**
   * Update operator permissions dynamically
   */
  async updateOperatorPermissions(operatorId: string, newRole: OperatorRole): Promise<void> {
    try {
      // Update operator role in database
      await database.query(
        'UPDATE operators SET operator_role = $1, updated_at = NOW() WHERE id = $2',
        [newRole, operatorId],
        { operation: 'update_operator_role' }
      );
      
      // Update user permissions
      const newPermissions = OPERATOR_PERMISSIONS[newRole];
      const permissionIds = newPermissions.map(p => p.id);
      
      await database.query(
        `UPDATE users SET permissions = $1, updated_at = NOW() 
         WHERE id = (SELECT user_id FROM operators WHERE id = $2)`,
        [JSON.stringify(permissionIds), operatorId],
        { operation: 'update_user_permissions' }
      );
      
      auditLogger.logEvent(
        AuditEventType.USER_MANAGEMENT,
        SecurityLevel.MEDIUM,
        'SUCCESS',
        {
          action: 'operator_role_updated',
          operatorId,
          newRole,
          permissionCount: permissionIds.length
        }
      );
      
    } catch (error) {
      logger.error('Update operator permissions failed', { error, operatorId, newRole });
      throw error;
    }
  }
  
  /**
   * Invalidate operator session
   */
  async logoutOperator(sessionId: string): Promise<void> {
    try {
      // Invalidate session in auth manager
      await authManager.logout(sessionId);
      
      // Remove session context
      await database.query(
        'DELETE FROM operator_sessions WHERE session_id = $1',
        [sessionId]
      );
      
      auditLogger.logEvent(
        AuditEventType.AUTHENTICATION,
        SecurityLevel.LOW,
        'SUCCESS',
        {
          action: 'operator_logout',
          sessionId
        }
      );
      
    } catch (error) {
      logger.error('Operator logout failed', { error, sessionId });
      throw error;
    }
  }
  
  // =====================================================
  // PRIVATE HELPER METHODS
  // =====================================================
  
  private async verifyMFA(userId: string, mfaCode: string): Promise<boolean> {
    // Mock MFA verification - in real implementation, this would verify TOTP, SMS, etc.
    logger.debug('Verifying MFA code', { userId });
    return mfaCode.length === 6 && /^\d+$/.test(mfaCode);
  }
  
  private async incrementFailedAttempts(userId: string): Promise<void> {
    await database.query(
      `UPDATE users SET 
        failed_login_attempts = failed_login_attempts + 1,
        locked_until = CASE 
          WHEN failed_login_attempts >= 4 THEN NOW() + INTERVAL '30 minutes'
          ELSE NULL
        END,
        updated_at = NOW()
       WHERE id = $1`,
      [userId]
    );
  }
  
  private async resetFailedAttempts(userId: string): Promise<void> {
    await database.query(
      'UPDATE users SET failed_login_attempts = 0, locked_until = NULL, updated_at = NOW() WHERE id = $1',
      [userId]
    );
  }
  
  private async updateLastLogin(userId: string, operatorId: string): Promise<void> {
    await database.query(
      'UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1',
      [userId]
    );
    
    await database.query(
      'UPDATE operators SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1',
      [operatorId]
    );
  }
  
  private async getDriverCount(operatorId: string): Promise<number> {
    const result = await database.query(
      'SELECT COUNT(*) as count FROM operator_drivers WHERE operator_id = $1 AND is_active = true',
      [operatorId]
    );
    return parseInt(result.rows[0]?.count || '0');
  }
  
  private async getComplianceStatus(operatorId: string): Promise<'compliant' | 'warning' | 'non_compliant'> {
    // Check for active violations
    const violationsResult = await database.query(
      `SELECT severity, COUNT(*) as count
       FROM compliance_violations 
       WHERE operator_id = $1 AND status = 'open'
       GROUP BY severity`,
      [operatorId]
    );
    
    const violations = violationsResult.rows;
    const criticalCount = parseInt(violations.find(v => v.severity === 'critical')?.count || '0');
    const majorCount = parseInt(violations.find(v => v.severity === 'major')?.count || '0');
    
    if (criticalCount > 0) return 'non_compliant';
    if (majorCount > 0) return 'warning';
    return 'compliant';
  }
  
  private async getComplianceWarnings(operatorId: string): Promise<string[]> {
    const warnings: string[] = [];
    
    // Check for compliance violations
    const violationsResult = await database.query(
      `SELECT violation_type, description, severity
       FROM compliance_violations 
       WHERE operator_id = $1 AND status = 'open'
       ORDER BY severity DESC, created_at DESC
       LIMIT 5`,
      [operatorId]
    );
    
    violationsResult.rows.forEach(violation => {
      warnings.push(`${violation.severity.toUpperCase()}: ${violation.description}`);
    });
    
    // Check for expired documents
    const operatorResult = await database.query(
      'SELECT certifications FROM operators WHERE id = $1',
      [operatorId]
    );
    
    if (operatorResult.rows.length > 0) {
      const certifications = operatorResult.rows[0].certifications || [];
      const expired = certifications.filter((cert: any) => 
        cert.expiry_date && new Date(cert.expiry_date) < new Date()
      );
      
      if (expired.length > 0) {
        warnings.push(`${expired.length} certification(s) have expired`);
      }
    }
    
    return warnings;
  }
  
  private async storeSessionContext(sessionId: string, context: OperatorSessionContext): Promise<void> {
    await database.query(
      `INSERT INTO operator_sessions (session_id, operator_id, session_context, created_at, expires_at)
       VALUES ($1, $2, $3, NOW(), NOW() + INTERVAL '24 hours')
       ON CONFLICT (session_id) DO UPDATE SET
         session_context = $3, updated_at = NOW()`,
      [sessionId, context.operatorId, JSON.stringify(context)]
    );
  }
  
  private determineOperatorRole(operatorData: any): OperatorRole {
    // In real implementation, this would be stored in the database
    // For now, determine based on operator type and user role
    
    if (operatorData.operator_type === 'fleet') {
      return 'operator_owner';
    } else if (operatorData.operator_type === 'tnvs') {
      return 'operator_manager';
    } else {
      return 'operator_dispatcher';
    }
  }
  
  private mapOperatorRoleToUserRole(operatorRole: OperatorRole): UserRole {
    const mapping: Record<OperatorRole, UserRole> = {
      operator_owner: 'regional_manager',
      operator_manager: 'dispatcher',
      operator_dispatcher: 'dispatcher',
      operator_finance: 'analyst',
      operator_viewer: 'analyst'
    };
    
    return mapping[operatorRole];
  }
  
  private mapDatabaseToOperator(dbRow: any): Operator {
    return {
      id: dbRow.id,
      operator_code: dbRow.operator_code,
      business_name: dbRow.business_name,
      legal_name: dbRow.legal_name,
      trade_name: dbRow.trade_name,
      operator_type: dbRow.operator_type,
      status: dbRow.status,
      primary_contact: dbRow.primary_contact,
      business_address: dbRow.business_address,
      mailing_address: dbRow.mailing_address,
      business_registration_number: dbRow.business_registration_number,
      tin: dbRow.tin,
      sec_registration: dbRow.sec_registration,
      ltfrb_authority_number: dbRow.ltfrb_authority_number,
      lto_accreditation: dbRow.lto_accreditation,
      primary_region_id: dbRow.primary_region_id,
      allowed_regions: dbRow.allowed_regions || [],
      max_vehicles: dbRow.max_vehicles,
      current_vehicle_count: dbRow.current_vehicle_count,
      performance_score: parseFloat(dbRow.performance_score || '0'),
      commission_tier: dbRow.commission_tier,
      tier_qualification_date: dbRow.tier_qualification_date,
      wallet_balance: parseFloat(dbRow.wallet_balance || '0'),
      earnings_today: parseFloat(dbRow.earnings_today || '0'),
      earnings_week: parseFloat(dbRow.earnings_week || '0'),
      earnings_month: parseFloat(dbRow.earnings_month || '0'),
      total_commissions_earned: parseFloat(dbRow.total_commissions_earned || '0'),
      insurance_details: dbRow.insurance_details,
      certifications: dbRow.certifications || [],
      compliance_documents: dbRow.compliance_documents || {},
      operational_hours: dbRow.operational_hours || { start: '06:00', end: '22:00' },
      service_areas: dbRow.service_areas || [],
      special_permissions: dbRow.special_permissions || {},
      user_id: dbRow.user_id,
      assigned_account_manager: dbRow.assigned_account_manager,
      partnership_start_date: dbRow.partnership_start_date,
      partnership_end_date: dbRow.partnership_end_date,
      created_at: dbRow.created_at,
      updated_at: dbRow.updated_at,
      created_by: dbRow.created_by,
      is_active: dbRow.is_active
    };
  }
}

// =====================================================
// MIDDLEWARE FUNCTIONS
// =====================================================

/**
 * Middleware to authenticate and authorize operator requests
 */
export function withOperatorAuth(
  handler: (req: NextRequest, authContext: OperatorAuthContext) => Promise<NextResponse>,
  requiredPermissions: string[] = []
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      // Extract JWT token
      const authHeader = req.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { success: false, error: 'Missing authorization header' },
          { status: 401 }
        );
      }
      
      const token = authHeader.substring(7);
      
      // Verify token and get user context
      const user = await authManager.verifyToken(token);
      if (!user || user.userType !== 'operator') {
        return NextResponse.json(
          { success: false, error: 'Invalid token or not an operator' },
          { status: 401 }
        );
      }
      
      // Get operator context
      const operatorAuthService = new OperatorAuthService();
      const authContext = await operatorAuthService.getOperatorContext(user.sessionId);
      if (!authContext) {
        return NextResponse.json(
          { success: false, error: 'Operator context not found' },
          { status: 401 }
        );
      }
      
      // Check required permissions
      for (const permission of requiredPermissions) {
        const hasPermission = await operatorAuthService.hasPermission(authContext, permission);
        if (!hasPermission) {
          return NextResponse.json(
            { success: false, error: `Missing permission: ${permission}` },
            { status: 403 }
          );
        }
      }
      
      // Update last activity
      authContext.sessionContext.lastActivityTime = new Date();
      
      return handler(req, authContext);
      
    } catch (error) {
      logger.error('Operator auth middleware error', { error });
      return NextResponse.json(
        { success: false, error: 'Authentication failed' },
        { status: 500 }
      );
    }
  };
}

/**
 * Middleware for regional access control
 */
export function withOperatorRegionalAccess(
  handler: (req: NextRequest, authContext: OperatorAuthContext) => Promise<NextResponse>,
  getRegionIdFromRequest: (req: NextRequest) => string | undefined
) {
  return withOperatorAuth(async (req: NextRequest, authContext: OperatorAuthContext) => {
    const regionId = getRegionIdFromRequest(req);
    
    if (regionId) {
      const operatorAuthService = new OperatorAuthService();
      const hasAccess = await operatorAuthService.hasRegionalAccess(authContext, regionId);
      if (!hasAccess) {
        return NextResponse.json(
          { success: false, error: 'Access denied for this region' },
          { status: 403 }
        );
      }
    }
    
    return handler(req, authContext);
  });
}

// =====================================================
// EXPORT SINGLETON INSTANCE
// =====================================================

export const operatorAuthService = new OperatorAuthService();