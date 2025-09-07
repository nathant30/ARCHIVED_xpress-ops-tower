// Vehicle-Specific Audit Logger
// Enhanced audit logging for vehicle operations with comprehensive security tracking

import { auditLogger, AuditEventType, SecurityLevel } from './auditLogger';
import {
  VehicleRBACEventType,
  VehicleRBACauditLog,
  VehiclePermission,
  VehicleRBACContext,
  VehicleRBACDecision
} from '@/types/vehicle-rbac';
import { VehicleOwnershipType } from '@/types/vehicles';
import type { EnhancedUser } from '@/types/rbac-abac';

/**
 * Vehicle audit event metadata
 */
export interface VehicleAuditMetadata {
  vehicleId?: string;
  vehicleCode?: string;
  licensePlate?: string;
  ownershipType: VehicleOwnershipType;
  regionId: string;
  operationType: 'read' | 'write' | 'delete' | 'assign' | 'approve';
  dataClass: string;
  containsPII: boolean;
  maskedFields?: string[];
  accessLevel?: string;
  mfaRequired?: boolean;
  crossRegionAccess?: boolean;
  caseId?: string;
  approvalRequired?: boolean;
  financialImpact?: number;
  maintenanceCost?: number;
  previousValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress: string;
  userAgent?: string;
  sessionId?: string;
  requestId?: string;
  evaluationTimeMs?: number;
}

/**
 * Vehicle audit context for user actions
 */
export interface VehicleAuditContext {
  userId: string;
  userRole: string;
  userRegions: string[];
  userPIIScope: string;
  resource: 'vehicle' | 'vehicle_fleet' | 'vehicle_maintenance' | 'vehicle_assignment';
  action: string;
  ipAddress: string;
  sessionId?: string;
  requestId?: string;
  timestamp?: Date;
}

/**
 * Enhanced Vehicle Audit Logger
 * Provides specialized audit logging for vehicle operations
 */
export class VehicleAuditLogger {
  private logBuffer: VehicleRBACauditLog[] = [];
  private readonly BUFFER_SIZE = 100;
  private readonly FLUSH_INTERVAL = 30000; // 30 seconds
  
  constructor() {
    // Periodically flush the buffer
    setInterval(() => {
      this.flushBuffer();
    }, this.FLUSH_INTERVAL);
  }

  /**
   * Log vehicle permission decision
   */
  async logPermissionDecision(
    user: EnhancedUser,
    context: VehicleRBACContext,
    permission: VehiclePermission,
    decision: VehicleRBACDecision,
    auditContext: VehicleAuditContext,
    evaluationTimeMs?: number
  ): Promise<void> {
    const eventType = decision.allowed 
      ? VehicleRBACEventType.PERMISSION_GRANTED 
      : VehicleRBACEventType.PERMISSION_DENIED;

    // Create vehicle-specific audit log entry
    const vehicleAuditLog: VehicleRBACauditLog = {
      eventType,
      userId: user.id,
      vehicleId: context.vehicleId || 'unknown',
      permission,
      context,
      decision,
      timestamp: new Date(),
      ipAddress: auditContext.ipAddress,
      userAgent: auditContext.userAgent,
      sessionId: auditContext.sessionId || 'unknown',
      requestId: auditContext.requestId || 'unknown'
    };

    // Add to buffer for batch processing
    this.logBuffer.push(vehicleAuditLog);

    // Also log to main audit system
    const securityLevel = this.determineSecurityLevel(context, permission, decision);
    const metadata = this.buildAuditMetadata(context, decision, auditContext, evaluationTimeMs);

    await auditLogger.logEvent(
      decision.allowed ? AuditEventType.PERMISSION_GRANTED : AuditEventType.PERMISSION_DENIED,
      securityLevel,
      decision.allowed ? 'SUCCESS' : 'FAILURE',
      metadata,
      auditContext,
      user.id
    );

    // Log additional events based on decision characteristics
    await this.logAdditionalEvents(user, context, permission, decision, auditContext);

    // Flush buffer if it's getting full
    if (this.logBuffer.length >= this.BUFFER_SIZE) {
      await this.flushBuffer();
    }
  }

  /**
   * Log vehicle data access with detailed field tracking
   */
  async logVehicleDataAccess(
    user: EnhancedUser,
    vehicleContext: {
      vehicleId?: string;
      vehicleCode?: string;
      licensePlate?: string;
      ownershipType: VehicleOwnershipType;
      regionId: string;
    },
    accessedFields: string[],
    maskedFields: string[],
    auditContext: VehicleAuditContext
  ): Promise<void> {
    const metadata: VehicleAuditMetadata = {
      ...vehicleContext,
      operationType: 'read',
      dataClass: 'internal',
      containsPII: maskedFields.length > 0,
      maskedFields,
      accessLevel: this.determineAccessLevel(accessedFields, maskedFields),
      ipAddress: auditContext.ipAddress,
      userAgent: auditContext.userAgent,
      sessionId: auditContext.sessionId,
      requestId: auditContext.requestId
    };

    await auditLogger.logEvent(
      AuditEventType.DATA_ACCESS,
      maskedFields.length > 0 ? SecurityLevel.MEDIUM : SecurityLevel.LOW,
      'SUCCESS',
      metadata,
      auditContext,
      user.id
    );

    // Log PII access if applicable
    if (maskedFields.length > 0) {
      await this.logPIIAccess(user, vehicleContext, maskedFields, auditContext);
    }
  }

  /**
   * Log vehicle modification with before/after values
   */
  async logVehicleModification(
    user: EnhancedUser,
    vehicleContext: {
      vehicleId: string;
      vehicleCode?: string;
      ownershipType: VehicleOwnershipType;
      regionId: string;
    },
    modification: {
      operation: 'create' | 'update' | 'delete' | 'assign' | 'decommission';
      previousValues?: Record<string, any>;
      newValues?: Record<string, any>;
      financialImpact?: number;
    },
    auditContext: VehicleAuditContext
  ): Promise<void> {
    const metadata: VehicleAuditMetadata = {
      ...vehicleContext,
      operationType: modification.operation === 'create' ? 'write' : 
                    modification.operation === 'delete' ? 'delete' :
                    modification.operation === 'assign' ? 'assign' : 'write',
      dataClass: 'confidential',
      containsPII: false,
      previousValues: modification.previousValues,
      newValues: modification.newValues,
      financialImpact: modification.financialImpact,
      ipAddress: auditContext.ipAddress,
      userAgent: auditContext.userAgent,
      sessionId: auditContext.sessionId,
      requestId: auditContext.requestId
    };

    const eventType = modification.operation === 'create' ? AuditEventType.RESOURCE_CREATION :
                     modification.operation === 'delete' ? AuditEventType.RESOURCE_DELETION :
                     AuditEventType.RESOURCE_MODIFICATION;

    const securityLevel = modification.financialImpact && modification.financialImpact > 10000 
      ? SecurityLevel.HIGH 
      : SecurityLevel.MEDIUM;

    await auditLogger.logEvent(
      eventType,
      securityLevel,
      'SUCCESS',
      metadata,
      auditContext,
      user.id
    );
  }

  /**
   * Log vehicle financial operations
   */
  async logVehicleFinancialOperation(
    user: EnhancedUser,
    vehicleContext: {
      vehicleId?: string;
      vehicleCode?: string;
      ownershipType: VehicleOwnershipType;
      regionId: string;
    },
    operation: {
      type: 'purchase' | 'maintenance' | 'insurance' | 'depreciation' | 'budget_allocation';
      amount: number;
      currency: string;
      approvalRequired: boolean;
      approved?: boolean;
      approver?: string;
    },
    auditContext: VehicleAuditContext
  ): Promise<void> {
    const metadata: VehicleAuditMetadata = {
      ...vehicleContext,
      operationType: 'approve',
      dataClass: 'restricted',
      containsPII: false,
      financialImpact: operation.amount,
      approvalRequired: operation.approvalRequired,
      ipAddress: auditContext.ipAddress,
      userAgent: auditContext.userAgent,
      sessionId: auditContext.sessionId,
      requestId: auditContext.requestId
    };

    const securityLevel = operation.amount > 50000 ? SecurityLevel.HIGH : 
                         operation.amount > 10000 ? SecurityLevel.MEDIUM : 
                         SecurityLevel.LOW;

    await auditLogger.logEvent(
      AuditEventType.FINANCIAL_TRANSACTION,
      securityLevel,
      operation.approved === false ? 'FAILURE' : 'SUCCESS',
      {
        ...metadata,
        operation: operation.type,
        amount: operation.amount,
        currency: operation.currency,
        approved: operation.approved,
        approver: operation.approver
      },
      auditContext,
      user.id
    );
  }

  /**
   * Log MFA challenge for vehicle operations
   */
  async logVehicleMFAChallenge(
    user: EnhancedUser,
    vehicleId: string,
    operation: VehiclePermission,
    success: boolean,
    auditContext: VehicleAuditContext
  ): Promise<void> {
    const metadata = {
      vehicleId,
      operation,
      mfaRequired: true,
      mfaSuccess: success,
      ipAddress: auditContext.ipAddress,
      sessionId: auditContext.sessionId
    };

    await auditLogger.logEvent(
      AuditEventType.MFA_CHALLENGE,
      SecurityLevel.HIGH,
      success ? 'SUCCESS' : 'FAILURE',
      metadata,
      auditContext,
      user.id
    );
  }

  /**
   * Log cross-region vehicle access
   */
  async logCrossRegionAccess(
    user: EnhancedUser,
    vehicleContext: {
      vehicleId?: string;
      regionId: string;
      ownershipType: VehicleOwnershipType;
    },
    override: {
      caseId?: string;
      reason: string;
      approved: boolean;
      approver?: string;
    },
    auditContext: VehicleAuditContext
  ): Promise<void> {
    const metadata: VehicleAuditMetadata = {
      ...vehicleContext,
      operationType: 'read',
      dataClass: 'internal',
      containsPII: false,
      crossRegionAccess: true,
      caseId: override.caseId,
      ipAddress: auditContext.ipAddress,
      sessionId: auditContext.sessionId
    };

    await auditLogger.logEvent(
      AuditEventType.CROSS_REGION_ACCESS,
      SecurityLevel.HIGH,
      override.approved ? 'SUCCESS' : 'FAILURE',
      {
        ...metadata,
        reason: override.reason,
        approved: override.approved,
        approver: override.approver,
        caseId: override.caseId
      },
      auditContext,
      user.id
    );
  }

  /**
   * Log bulk vehicle operations
   */
  async logBulkVehicleOperation(
    user: EnhancedUser,
    operation: {
      type: 'bulk_update' | 'bulk_assignment' | 'bulk_maintenance';
      vehicleCount: number;
      regionId: string;
      filters: Record<string, any>;
      changes: Record<string, any>;
    },
    auditContext: VehicleAuditContext
  ): Promise<void> {
    const metadata = {
      operationType: 'write' as const,
      dataClass: 'confidential',
      containsPII: false,
      regionId: operation.regionId,
      ownershipType: 'xpress_owned' as VehicleOwnershipType,
      bulkOperation: true,
      vehicleCount: operation.vehicleCount,
      filters: operation.filters,
      changes: operation.changes,
      ipAddress: auditContext.ipAddress,
      sessionId: auditContext.sessionId
    };

    await auditLogger.logEvent(
      AuditEventType.BULK_OPERATION,
      SecurityLevel.HIGH,
      'SUCCESS',
      metadata,
      auditContext,
      user.id
    );
  }

  /**
   * Generate compliance report for vehicle access
   */
  async generateComplianceReport(
    dateRange: { start: Date; end: Date },
    filters: {
      userId?: string;
      vehicleId?: string;
      regionId?: string;
      ownershipType?: VehicleOwnershipType;
      eventTypes?: VehicleRBACEventType[];
    } = {}
  ): Promise<{
    summary: {
      totalEvents: number;
      permissionsGranted: number;
      permissionsDenied: number;
      mfaChallenges: number;
      crossRegionAccess: number;
      financialOperations: number;
      piiAccess: number;
    };
    violations: Array<{
      timestamp: Date;
      userId: string;
      violation: string;
      severity: 'low' | 'medium' | 'high';
      details: any;
    }>;
    trends: Array<{
      date: string;
      eventCount: number;
      denialRate: number;
    }>;
  }> {
    // This would typically query a database
    // For now, we'll return a mock structure
    return {
      summary: {
        totalEvents: 0,
        permissionsGranted: 0,
        permissionsDenied: 0,
        mfaChallenges: 0,
        crossRegionAccess: 0,
        financialOperations: 0,
        piiAccess: 0
      },
      violations: [],
      trends: []
    };
  }

  /**
   * Private helper methods
   */
  private determineSecurityLevel(
    context: VehicleRBACContext,
    permission: VehiclePermission,
    decision: VehicleRBACDecision
  ): SecurityLevel {
    // High security for financial operations
    if (permission.includes('approve_') && permission.includes('vehicle')) {
      return SecurityLevel.HIGH;
    }

    // High security for restricted data
    if (context.dataClass === 'restricted') {
      return SecurityLevel.HIGH;
    }

    // High security for MFA requirements
    if (decision.requiresMFA) {
      return SecurityLevel.HIGH;
    }

    // Medium security for detailed access
    if (permission.includes('detailed') || context.containsPII) {
      return SecurityLevel.MEDIUM;
    }

    return SecurityLevel.LOW;
  }

  private buildAuditMetadata(
    context: VehicleRBACContext,
    decision: VehicleRBACDecision,
    auditContext: VehicleAuditContext,
    evaluationTimeMs?: number
  ): VehicleAuditMetadata {
    return {
      vehicleId: context.vehicleId,
      ownershipType: context.ownershipType,
      regionId: context.regionId,
      operationType: context.operationType,
      dataClass: context.dataClass,
      containsPII: context.containsPII,
      maskedFields: decision.maskedFields,
      accessLevel: decision.ownershipAccessLevel,
      mfaRequired: decision.requiresMFA,
      crossRegionAccess: !!context.caseId,
      caseId: context.caseId,
      ipAddress: auditContext.ipAddress,
      userAgent: auditContext.userAgent,
      sessionId: auditContext.sessionId,
      requestId: auditContext.requestId,
      evaluationTimeMs
    };
  }

  private async logAdditionalEvents(
    user: EnhancedUser,
    context: VehicleRBACContext,
    permission: VehiclePermission,
    decision: VehicleRBACDecision,
    auditContext: VehicleAuditContext
  ): Promise<void> {
    // Log MFA requirement
    if (decision.requiresMFA) {
      await auditLogger.logEvent(
        AuditEventType.MFA_REQUIRED,
        SecurityLevel.HIGH,
        'INFO',
        {
          vehicleId: context.vehicleId,
          permission,
          reason: 'MFA required for vehicle operation'
        },
        auditContext,
        user.id
      );
    }

    // Log cross-region access
    if (context.caseId) {
      await auditLogger.logEvent(
        AuditEventType.CROSS_REGION_ACCESS,
        SecurityLevel.HIGH,
        decision.allowed ? 'SUCCESS' : 'FAILURE',
        {
          vehicleId: context.vehicleId,
          fromRegion: user.allowedRegions?.[0],
          toRegion: context.regionId,
          caseId: context.caseId
        },
        auditContext,
        user.id
      );
    }

    // Log PII access
    if (context.containsPII && decision.allowed) {
      await auditLogger.logEvent(
        AuditEventType.PII_ACCESS,
        SecurityLevel.MEDIUM,
        'SUCCESS',
        {
          vehicleId: context.vehicleId,
          dataClass: context.dataClass,
          maskedFields: decision.maskedFields,
          piiScope: user.piiScope
        },
        auditContext,
        user.id
      );
    }
  }

  private async logPIIAccess(
    user: EnhancedUser,
    vehicleContext: any,
    maskedFields: string[],
    auditContext: VehicleAuditContext
  ): Promise<void> {
    await auditLogger.logEvent(
      AuditEventType.PII_ACCESS,
      SecurityLevel.MEDIUM,
      'SUCCESS',
      {
        ...vehicleContext,
        maskedFields,
        piiScope: user.piiScope,
        dataClassification: 'PII'
      },
      auditContext,
      user.id
    );
  }

  private determineAccessLevel(accessedFields: string[], maskedFields: string[]): string {
    if (maskedFields.length === 0) return 'full';
    if (maskedFields.length < accessedFields.length / 2) return 'partial';
    return 'masked';
  }

  private async flushBuffer(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    try {
      // In a real implementation, this would write to a database or external service
      console.log(`Flushing ${this.logBuffer.length} vehicle audit logs`);
      
      // Process the buffer
      const logs = [...this.logBuffer];
      this.logBuffer.length = 0;
      
      // Here you would send logs to your audit storage system
      // For now, we'll just log the count
      console.log(`Processed ${logs.length} vehicle audit entries`);
    } catch (error) {
      console.error('Failed to flush vehicle audit buffer:', error);
      // In case of error, restore the logs to the buffer
      this.logBuffer.unshift(...this.logBuffer);
    }
  }
}

// Export singleton instance
export const vehicleAuditLogger = new VehicleAuditLogger();