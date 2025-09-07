// Vehicle Management RBAC Engine
// Specialized RBAC engine for vehicle operations with ownership-based access control
// Integrates with the main RBAC system while providing vehicle-specific logic

import { rbacEngine } from './rbac-engine';
import { roleAllows } from './allowed-actions';
import { auditLogger, AuditEventType, SecurityLevel } from '../security/auditLogger';
import {
  VehiclePermission,
  VehicleDataClass,
  VehicleRBACContext,
  VehicleRBACDecision,
  VehiclePermissionRequirement,
  VehicleAccessCondition,
  VehicleRBACEventType,
  VehicleRBACauditLog,
  VehicleOwnershipAccessMatrix,
  VEHICLE_OWNERSHIP_ACCESS_MATRIX,
  DEFAULT_VEHICLE_RBAC_CONFIG
} from '@/types/vehicle-rbac';
import { VehicleOwnershipType } from '@/types/vehicles';
import type { EnhancedUser } from '@/types/rbac-abac';

/**
 * Vehicle RBAC Engine - Specialized access control for vehicle operations
 */
export class VehicleRBACEngine {
  private cache = new Map<string, { result: VehicleRBACDecision; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private config = DEFAULT_VEHICLE_RBAC_CONFIG;

  /**
   * Main vehicle access evaluation
   */
  async evaluateVehicleAccess(
    user: EnhancedUser,
    context: VehicleRBACContext,
    permission: VehiclePermission
  ): Promise<VehicleRBACDecision> {
    const startTime = Date.now();
    
    // Generate cache key
    const cacheKey = this.generateCacheKey(user, context, permission);
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
      return cached.result;
    }

    // Perform evaluation
    const decision = await this.performVehicleEvaluation(user, context, permission);
    
    // Cache result
    this.cache.set(cacheKey, {
      result: decision,
      timestamp: Date.now()
    });

    // Audit the decision
    await this.auditVehicleAccess(user, context, permission, decision, startTime);

    // Clean up old cache entries
    this.cleanupCache();

    return decision;
  }

  /**
   * Core vehicle RBAC evaluation logic
   */
  private async performVehicleEvaluation(
    user: EnhancedUser,
    context: VehicleRBACContext,
    permission: VehiclePermission
  ): Promise<VehicleRBACDecision> {
    const conditions: VehicleAccessCondition[] = [];
    let requiresMFA = false;
    let auditRequired = true; // All vehicle operations are audited
    let maskedFields: string[] = [];

    // Step 1: Basic permission check using main RBAC system
    const hasBasicPermission = await this.checkBasicPermission(user, permission);
    if (!hasBasicPermission.allowed) {
      return {
        allowed: false,
        reason: hasBasicPermission.reason,
        requiresMFA: false,
        auditRequired: true,
        ownershipAccessLevel: 'none',
        conditions: []
      };
    }

    // Step 2: Regional access validation
    const regionalCheck = this.validateRegionalAccess(user, context);
    if (!regionalCheck.allowed) {
      return {
        allowed: false,
        reason: regionalCheck.reason,
        requiresMFA: false,
        auditRequired: true,
        ownershipAccessLevel: 'none',
        conditions: []
      };
    }

    // Step 3: Ownership-based access control
    const ownershipCheck = this.validateOwnershipAccess(user, context, permission);
    if (!ownershipCheck.allowed) {
      return {
        allowed: false,
        reason: ownershipCheck.reason,
        requiresMFA: false,
        auditRequired: true,
        ownershipAccessLevel: 'none',
        conditions: []
      };
    }

    // Step 4: Data classification and sensitivity checks
    const sensitivityCheck = this.validateDataSensitivity(user, context, permission);
    if (!sensitivityCheck.allowed) {
      return {
        allowed: false,
        reason: sensitivityCheck.reason,
        requiresMFA: sensitivityCheck.requiresMFA,
        auditRequired: true,
        ownershipAccessLevel: ownershipCheck.accessLevel,
        conditions: sensitivityCheck.conditions
      };
    }

    // Step 5: MFA requirements
    requiresMFA = this.shouldRequireMFA(context, permission, user);

    // Step 6: Field masking based on user privileges and data class
    maskedFields = this.getMaskedFields(user, context, permission);

    // Step 7: Additional conditions based on operation type
    const operationConditions = this.getOperationConditions(context, permission, user);
    conditions.push(...operationConditions);

    return {
      allowed: true,
      reason: `Vehicle access granted for ${permission} on ${context.ownershipType} vehicle in ${context.regionId}`,
      maskedFields,
      requiresMFA,
      auditRequired,
      ownershipAccessLevel: ownershipCheck.accessLevel,
      conditions
    };
  }

  /**
   * Check basic permission using main RBAC system
   */
  private async checkBasicPermission(
    user: EnhancedUser,
    permission: VehiclePermission
  ): Promise<{ allowed: boolean; reason: string }> {
    // Get user's primary role
    const primaryRole = user.roles?.[0]?.role?.name;
    if (!primaryRole) {
      return {
        allowed: false,
        reason: 'User has no assigned roles'
      };
    }

    // Check if role allows this vehicle permission
    const allowed = roleAllows(primaryRole as any, permission);
    
    return {
      allowed,
      reason: allowed 
        ? `Role ${primaryRole} allows ${permission}`
        : `Role ${primaryRole} does not allow ${permission}`
    };
  }

  /**
   * Validate regional access for vehicle operations
   */
  private validateRegionalAccess(
    user: EnhancedUser,
    context: VehicleRBACContext
  ): { allowed: boolean; reason: string } {
    const userRegions = user.allowedRegions || [];
    
    // Global access (executives, auditors)
    if (userRegions.length === 0 || userRegions.includes('*')) {
      return {
        allowed: true,
        reason: 'Global regional access'
      };
    }

    // Check specific region access
    if (userRegions.includes(context.regionId)) {
      return {
        allowed: true,
        reason: `Access granted to region ${context.regionId}`
      };
    }

    // Cross-region override for support and risk investigators
    const userRole = user.roles?.[0]?.role?.name;
    if (userRole && ['support', 'risk_investigator'].includes(userRole)) {
      if (context.caseId) {
        return {
          allowed: true,
          reason: `Cross-region override granted for case ${context.caseId}`
        };
      }
    }

    return {
      allowed: false,
      reason: `Access denied to region ${context.regionId}. User regions: ${userRegions.join(', ')}`
    };
  }

  /**
   * Validate ownership-based access
   */
  private validateOwnershipAccess(
    user: EnhancedUser,
    context: VehicleRBACContext,
    permission: VehiclePermission
  ): { allowed: boolean; reason: string; accessLevel: 'none' | 'basic' | 'detailed' | 'financial' | 'full' } {
    const userRole = user.roles?.[0]?.role?.name;
    const ownershipMatrix = VEHICLE_OWNERSHIP_ACCESS_MATRIX[context.ownershipType];

    if (!userRole || !ownershipMatrix) {
      return {
        allowed: false,
        reason: 'Invalid user role or ownership type',
        accessLevel: 'none'
      };
    }

    // Check permission against ownership matrix
    if (ownershipMatrix.basic.includes(permission)) {
      return {
        allowed: true,
        reason: `Basic access granted for ${context.ownershipType} vehicles`,
        accessLevel: 'basic'
      };
    }

    if (ownershipMatrix.detailed.includes(permission)) {
      // Detailed access requires ops_manager or higher
      if (['ops_manager', 'regional_manager', 'executive'].includes(userRole)) {
        return {
          allowed: true,
          reason: `Detailed access granted for ${context.ownershipType} vehicles`,
          accessLevel: 'detailed'
        };
      }
    }

    if (ownershipMatrix.financial.includes(permission)) {
      // Financial access requires finance_ops, regional_manager, or executive
      if (['finance_ops', 'regional_manager', 'executive'].includes(userRole)) {
        return {
          allowed: true,
          reason: `Financial access granted for ${context.ownershipType} vehicles`,
          accessLevel: 'financial'
        };
      }
    }

    if (ownershipMatrix.restricted.includes(permission)) {
      // Restricted access requires executive or specific approval
      if (['executive', 'risk_investigator'].includes(userRole)) {
        return {
          allowed: true,
          reason: `Restricted access granted for ${context.ownershipType} vehicles`,
          accessLevel: 'full'
        };
      }
    }

    return {
      allowed: false,
      reason: `Insufficient ownership privileges for ${permission} on ${context.ownershipType} vehicles`,
      accessLevel: 'none'
    };
  }

  /**
   * Validate data sensitivity and classification
   */
  private validateDataSensitivity(
    user: EnhancedUser,
    context: VehicleRBACContext,
    permission: VehiclePermission
  ): { 
    allowed: boolean; 
    reason: string; 
    requiresMFA: boolean;
    conditions: VehicleAccessCondition[];
  } {
    const conditions: VehicleAccessCondition[] = [];
    let requiresMFA = false;

    // PII data handling
    if (context.containsPII) {
      const userPIIScope = user.piiScope || 'none';
      
      if (userPIIScope === 'none') {
        return {
          allowed: false,
          reason: 'No PII access permissions for vehicle data',
          requiresMFA: false,
          conditions: []
        };
      }

      if (context.dataClass === 'restricted' && userPIIScope !== 'full') {
        return {
          allowed: false,
          reason: 'Full PII scope required for restricted vehicle data',
          requiresMFA: true,
          conditions: []
        };
      }

      // MFA required for full PII access on confidential+ data
      if (userPIIScope === 'full' && ['confidential', 'restricted'].includes(context.dataClass)) {
        requiresMFA = true;
        conditions.push({
          type: 'mfa_required',
          description: 'MFA required for PII access to vehicle data'
        });
      }
    }

    // Financial data classification
    if (context.dataClass === 'confidential' || context.dataClass === 'restricted') {
      const userRole = user.roles?.[0]?.role?.name;
      const financialRoles = ['finance_ops', 'regional_manager', 'executive', 'analyst'];
      
      if (!financialRoles.includes(userRole || '')) {
        return {
          allowed: false,
          reason: 'Insufficient role for confidential vehicle data access',
          requiresMFA: false,
          conditions: []
        };
      }

      if (context.dataClass === 'restricted') {
        requiresMFA = true;
        conditions.push({
          type: 'mfa_required',
          description: 'MFA required for restricted vehicle data access'
        });
      }
    }

    return {
      allowed: true,
      reason: 'Data sensitivity validation passed',
      requiresMFA,
      conditions
    };
  }

  /**
   * Determine if MFA should be required
   */
  private shouldRequireMFA(
    context: VehicleRBACContext,
    permission: VehiclePermission,
    user: EnhancedUser
  ): boolean {
    // Always require MFA for financial operations
    const financialPermissions: VehiclePermission[] = [
      'approve_vehicle_purchases',
      'manage_vehicle_financing',
      'process_vehicle_insurance_claims',
      'approve_strategic_vehicle_investments'
    ];

    if (financialPermissions.includes(permission)) {
      return true;
    }

    // MFA for restricted data access
    if (context.dataClass === 'restricted') {
      return true;
    }

    // MFA for cross-region override
    if (context.caseId && !user.allowedRegions?.includes(context.regionId)) {
      return true;
    }

    // MFA for vehicle decommissioning
    if (permission === 'approve_vehicle_decommissioning') {
      return true;
    }

    return false;
  }

  /**
   * Get fields that should be masked based on user access level
   */
  private getMaskedFields(
    user: EnhancedUser,
    context: VehicleRBACContext,
    permission: VehiclePermission
  ): string[] {
    const userPIIScope = user.piiScope || 'none';
    const userRole = user.roles?.[0]?.role?.name;

    // No masking for executives with full PII scope
    if (userRole === 'executive' && userPIIScope === 'full') {
      return [];
    }

    const baseMaskedFields = ['vin', 'engine_number', 'registration_number'];
    const financialMaskedFields = ['purchase_price', 'insurance_policy_number', 'loan_details'];
    const personalMaskedFields = ['owner_contact', 'driver_personal_info'];

    let maskedFields = [...baseMaskedFields];

    // Add financial fields if no financial access
    if (!['finance_ops', 'regional_manager', 'executive'].includes(userRole || '')) {
      maskedFields.push(...financialMaskedFields);
    }

    // Add personal fields based on PII scope
    if (userPIIScope === 'none' || userPIIScope === 'masked') {
      maskedFields.push(...personalMaskedFields);
    }

    return maskedFields;
  }

  /**
   * Get operation-specific conditions
   */
  private getOperationConditions(
    context: VehicleRBACContext,
    permission: VehiclePermission,
    user: EnhancedUser
  ): VehicleAccessCondition[] {
    const conditions: VehicleAccessCondition[] = [];

    // Time-limited access for investigations
    if (permission === 'investigate_vehicle_incidents' && context.caseId) {
      conditions.push({
        type: 'time_limited',
        description: 'Investigation access valid for 7 days',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        metadata: { caseId: context.caseId }
      });
    }

    // Supervisor approval for major financial operations
    const majorFinancialOps: VehiclePermission[] = [
      'approve_strategic_vehicle_investments',
      'approve_major_vehicle_partnerships',
      'approve_vehicle_expansion_plans'
    ];

    if (majorFinancialOps.includes(permission)) {
      const userRole = user.roles?.[0]?.role?.name;
      if (userRole !== 'executive') {
        conditions.push({
          type: 'supervisor_approval',
          description: 'Executive approval required for major financial operations'
        });
      }
    }

    return conditions;
  }

  /**
   * Audit vehicle access decision
   */
  private async auditVehicleAccess(
    user: EnhancedUser,
    context: VehicleRBACContext,
    permission: VehiclePermission,
    decision: VehicleRBACDecision,
    evaluationStartTime: number
  ): Promise<void> {
    const eventType = decision.allowed 
      ? VehicleRBACEventType.PERMISSION_GRANTED 
      : VehicleRBACEventType.PERMISSION_DENIED;

    const auditLog: VehicleRBACauditLog = {
      eventType,
      userId: user.id,
      vehicleId: context.vehicleId || 'unknown',
      permission,
      context,
      decision,
      timestamp: new Date(),
      ipAddress: 'unknown', // Would be passed from request context
      sessionId: 'unknown', // Would be passed from session
      requestId: 'unknown'  // Would be passed from request
    };

    // Log to main audit system
    await auditLogger.logEvent(
      decision.allowed ? AuditEventType.PERMISSION_GRANTED : AuditEventType.PERMISSION_DENIED,
      SecurityLevel.MEDIUM,
      decision.allowed ? 'SUCCESS' : 'FAILURE',
      {
        resource: 'vehicle',
        vehicleId: context.vehicleId,
        permission,
        ownershipType: context.ownershipType,
        regionId: context.regionId,
        dataClass: context.dataClass,
        decision: decision.allowed ? 'ALLOW' : 'DENY',
        reason: decision.reason,
        evaluationTimeMs: Date.now() - evaluationStartTime
      },
      {
        userId: user.id,
        resource: 'vehicle',
        action: permission,
        ipAddress: 'unknown'
      }
    );

    // Specific logging for sensitive operations
    if (decision.requiresMFA) {
      await auditLogger.logEvent(
        AuditEventType.MFA_REQUIRED,
        SecurityLevel.HIGH,
        'INFO',
        {
          resource: 'vehicle',
          vehicleId: context.vehicleId,
          permission,
          reason: 'MFA required for vehicle operation'
        },
        {
          userId: user.id,
          resource: 'vehicle',
          action: permission,
          ipAddress: 'unknown'
        }
      );
    }
  }

  /**
   * Generate cache key for decision caching
   */
  private generateCacheKey(
    user: EnhancedUser,
    context: VehicleRBACContext,
    permission: VehiclePermission
  ): string {
    const keyData = {
      userId: user.id,
      permission,
      regionId: context.regionId,
      ownershipType: context.ownershipType,
      dataClass: context.dataClass,
      containsPII: context.containsPII,
      userRole: user.roles?.[0]?.role?.name,
      userPIIScope: user.piiScope,
      userRegions: user.allowedRegions?.sort()
    };

    return Buffer.from(JSON.stringify(keyData)).toString('base64');
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Validate vehicle permissions for a user
   */
  public async validateVehiclePermissions(
    user: EnhancedUser,
    requiredPermissions: VehiclePermission[]
  ): Promise<{ valid: boolean; missingPermissions: VehiclePermission[] }> {
    const missingPermissions: VehiclePermission[] = [];

    for (const permission of requiredPermissions) {
      const hasPermission = await this.checkBasicPermission(user, permission);
      if (!hasPermission.allowed) {
        missingPermissions.push(permission);
      }
    }

    return {
      valid: missingPermissions.length === 0,
      missingPermissions
    };
  }

  /**
   * Get effective vehicle permissions for a user
   */
  public getEffectiveVehiclePermissions(user: EnhancedUser): VehiclePermission[] {
    const userRole = user.roles?.[0]?.role?.name;
    if (!userRole) return [];

    // This would typically be loaded from the allowed-actions.json
    // For now, we'll return a subset based on common patterns
    const rolePermissions: Record<string, VehiclePermission[]> = {
      ground_ops: [
        'view_vehicles_basic',
        'assign_driver_to_vehicle',
        'update_vehicle_status_basic'
      ],
      ops_manager: [
        'view_vehicles_detailed',
        'update_vehicle_details',
        'schedule_vehicle_maintenance',
        'approve_vehicle_assignments',
        'view_vehicle_telemetry_detailed'
      ],
      regional_manager: [
        'manage_regional_vehicles',
        'approve_vehicle_registrations',
        'manage_vehicle_fleet_budget',
        'approve_major_vehicle_maintenance'
      ],
      executive: [
        'approve_strategic_vehicle_investments',
        'view_global_fleet_analytics',
        'approve_vehicle_expansion_plans'
      ]
    };

    return rolePermissions[userRole] || [];
  }
}

// Export singleton instance
export const vehicleRBACEngine = new VehicleRBACEngine();