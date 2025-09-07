// Vehicle Database Access Control
// Row-level security and query filtering for vehicle operations based on RBAC

import { vehicleRBACEngine } from '@/lib/auth/vehicle-rbac-engine';
import { vehicleAuditLogger } from '@/lib/security/vehicleAuditLogger';
import {
  VehiclePermission,
  VehicleDataClass,
  VehicleRBACContext
} from '@/types/vehicle-rbac';
import { VehicleOwnershipType } from '@/types/vehicles';
import type { EnhancedUser } from '@/types/rbac-abac';

/**
 * Database query filter for vehicle access control
 */
export interface VehicleQueryFilter {
  whereClause: string;
  parameters: Record<string, any>;
  allowedFields: string[];
  maskedFields: string[];
  requiresJoin?: string[];
}

/**
 * Vehicle database access policy
 */
export interface VehicleAccessPolicy {
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  regionRestrictions: string[];
  ownershipRestrictions: VehicleOwnershipType[];
  dataClassRestrictions: VehicleDataClass[];
  fieldRestrictions: {
    allowed: string[];
    masked: string[];
    forbidden: string[];
  };
  requiresMFA: boolean;
  auditRequired: boolean;
}

/**
 * Vehicle Database Access Control Service
 * Implements row-level security and field-level access control for vehicle data
 */
export class VehicleAccessControl {
  private policyCache = new Map<string, { policy: VehicleAccessPolicy; timestamp: number }>();
  private readonly POLICY_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get database access policy for a user
   */
  async getAccessPolicy(
    user: EnhancedUser,
    context: Partial<VehicleRBACContext> = {}
  ): Promise<VehicleAccessPolicy> {
    const cacheKey = this.generatePolicyCacheKey(user, context);
    
    // Check cache
    const cached = this.policyCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < this.POLICY_CACHE_TTL) {
      return cached.policy;
    }

    // Generate policy
    const policy = await this.generateAccessPolicy(user, context);
    
    // Cache policy
    this.policyCache.set(cacheKey, {
      policy,
      timestamp: Date.now()
    });

    return policy;
  }

  /**
   * Generate SQL query filter for vehicle access
   */
  async generateQueryFilter(
    user: EnhancedUser,
    operation: 'read' | 'write' | 'delete',
    context: Partial<VehicleRBACContext> = {}
  ): Promise<VehicleQueryFilter> {
    const policy = await this.getAccessPolicy(user, context);
    
    if (!this.canPerformOperation(policy, operation)) {
      throw new Error(`User ${user.id} does not have ${operation} access to vehicle data`);
    }

    const whereConditions: string[] = [];
    const parameters: Record<string, any> = {};

    // Regional restrictions
    if (policy.regionRestrictions.length > 0 && !policy.regionRestrictions.includes('*')) {
      whereConditions.push('region_id IN (:regionIds)');
      parameters.regionIds = policy.regionRestrictions;
    }

    // Ownership type restrictions
    if (policy.ownershipRestrictions.length > 0) {
      whereConditions.push('ownership_type IN (:ownershipTypes)');
      parameters.ownershipTypes = policy.ownershipRestrictions;
    }

    // Data classification restrictions
    if (policy.dataClassRestrictions.length > 0) {
      whereConditions.push('data_classification IN (:dataClasses)');
      parameters.dataClasses = policy.dataClassRestrictions;
    }

    // User-specific restrictions based on role
    const userRole = user.roles?.[0]?.role?.name;
    if (userRole === 'ground_ops') {
      // Ground ops can only see active vehicles
      whereConditions.push('status IN (:allowedStatuses)');
      parameters.allowedStatuses = ['active', 'in_service'];
    }

    if (userRole === 'driver' || userRole === 'operator') {
      // Drivers/operators can only see their assigned vehicles
      whereConditions.push('assigned_user_id = :userId');
      parameters.userId = user.id;
    }

    // Soft delete filter (always apply)
    whereConditions.push('is_active = true');

    const whereClause = whereConditions.length > 0 
      ? whereConditions.join(' AND ') 
      : '1=1';

    return {
      whereClause,
      parameters,
      allowedFields: policy.fieldRestrictions.allowed,
      maskedFields: policy.fieldRestrictions.masked,
      requiresJoin: this.getRequiredJoins(user, policy)
    };
  }

  /**
   * Filter query results based on access policy
   */
  async filterQueryResults<T extends Record<string, any>>(
    user: EnhancedUser,
    results: T[],
    context: Partial<VehicleRBACContext> = {}
  ): Promise<T[]> {
    const policy = await this.getAccessPolicy(user, context);
    
    if (!policy.canRead) {
      return [];
    }

    return results.map(result => this.filterResultFields(result, policy));
  }

  /**
   * Validate write operation access
   */
  async validateWriteAccess(
    user: EnhancedUser,
    vehicleData: Record<string, any>,
    operation: 'create' | 'update' | 'delete',
    context: Partial<VehicleRBACContext> = {}
  ): Promise<{
    allowed: boolean;
    reason?: string;
    requiresMFA: boolean;
    auditRequired: boolean;
    restrictions: string[];
  }> {
    const policy = await this.getAccessPolicy(user, {
      ...context,
      vehicleId: vehicleData.id,
      ownershipType: vehicleData.ownership_type,
      regionId: vehicleData.region_id
    });

    if (!policy.canWrite && operation !== 'delete') {
      return {
        allowed: false,
        reason: 'User does not have write access to vehicle data',
        requiresMFA: false,
        auditRequired: true,
        restrictions: []
      };
    }

    if (!policy.canDelete && operation === 'delete') {
      return {
        allowed: false,
        reason: 'User does not have delete access to vehicle data',
        requiresMFA: false,
        auditRequired: true,
        restrictions: []
      };
    }

    // Check regional restrictions
    if (vehicleData.region_id && 
        policy.regionRestrictions.length > 0 && 
        !policy.regionRestrictions.includes('*') &&
        !policy.regionRestrictions.includes(vehicleData.region_id)) {
      return {
        allowed: false,
        reason: `Access denied to region ${vehicleData.region_id}`,
        requiresMFA: false,
        auditRequired: true,
        restrictions: ['region_access']
      };
    }

    // Check ownership restrictions
    if (vehicleData.ownership_type && 
        policy.ownershipRestrictions.length > 0 &&
        !policy.ownershipRestrictions.includes(vehicleData.ownership_type)) {
      return {
        allowed: false,
        reason: `Access denied for ownership type ${vehicleData.ownership_type}`,
        requiresMFA: false,
        auditRequired: true,
        restrictions: ['ownership_access']
      };
    }

    // Check field-level restrictions
    const forbiddenFields = Object.keys(vehicleData).filter(field => 
      policy.fieldRestrictions.forbidden.includes(field)
    );

    if (forbiddenFields.length > 0) {
      return {
        allowed: false,
        reason: `Access denied to fields: ${forbiddenFields.join(', ')}`,
        requiresMFA: false,
        auditRequired: true,
        restrictions: ['field_access']
      };
    }

    return {
      allowed: true,
      requiresMFA: policy.requiresMFA,
      auditRequired: policy.auditRequired,
      restrictions: []
    };
  }

  /**
   * Apply row-level security to database connection
   */
  async applyRowLevelSecurity(
    user: EnhancedUser,
    dbConnection: any, // Database connection object
    context: Partial<VehicleRBACContext> = {}
  ): Promise<void> {
    const policy = await this.getAccessPolicy(user, context);
    
    // Set session variables for RLS policies
    await dbConnection.query('SET session.user_id = $1', [user.id]);
    await dbConnection.query('SET session.user_role = $1', [user.roles?.[0]?.role?.name || 'unknown']);
    await dbConnection.query('SET session.allowed_regions = $1', [policy.regionRestrictions.join(',')]);
    await dbConnection.query('SET session.ownership_restrictions = $1', [policy.ownershipRestrictions.join(',')]);
    await dbConnection.query('SET session.pii_scope = $1', [user.piiScope || 'none']);

    // Enable RLS for vehicle tables
    await dbConnection.query(`
      ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
      ALTER TABLE vehicle_assignments ENABLE ROW LEVEL SECURITY;
      ALTER TABLE vehicle_maintenance ENABLE ROW LEVEL SECURITY;
      ALTER TABLE vehicle_telemetry ENABLE ROW LEVEL SECURITY;
    `);
  }

  /**
   * Create database RLS policies
   */
  async createRLSPolicies(dbConnection: any): Promise<void> {
    // Vehicle read policy
    await dbConnection.query(`
      CREATE POLICY vehicle_read_policy ON vehicles FOR SELECT
      USING (
        -- Executives can see all vehicles
        current_setting('session.user_role') = 'executive' OR
        
        -- Regional access check
        (region_id = ANY(string_to_array(current_setting('session.allowed_regions'), ','))) OR
        current_setting('session.allowed_regions') = '*' OR
        
        -- Cross-region override for support roles
        (current_setting('session.user_role') IN ('support', 'risk_investigator') 
         AND current_setting('session.case_id', true) IS NOT NULL)
      );
    `);

    // Vehicle write policy
    await dbConnection.query(`
      CREATE POLICY vehicle_write_policy ON vehicles FOR UPDATE
      USING (
        -- Executives and regional managers can update vehicles in their regions
        (current_setting('session.user_role') IN ('executive', 'regional_manager', 'ops_manager') AND
         (region_id = ANY(string_to_array(current_setting('session.allowed_regions'), ',')) OR
          current_setting('session.allowed_regions') = '*'))
      );
    `);

    // Vehicle create policy
    await dbConnection.query(`
      CREATE POLICY vehicle_create_policy ON vehicles FOR INSERT
      WITH CHECK (
        -- Only certain roles can create vehicles
        current_setting('session.user_role') IN ('executive', 'regional_manager', 'fleet_admin') AND
        (region_id = ANY(string_to_array(current_setting('session.allowed_regions'), ',')) OR
         current_setting('session.allowed_regions') = '*')
      );
    `);

    // Vehicle delete policy (soft delete only)
    await dbConnection.query(`
      CREATE POLICY vehicle_delete_policy ON vehicles FOR UPDATE
      USING (
        -- Only executives can decommission vehicles
        current_setting('session.user_role') = 'executive' AND
        updated_column = 'is_active' AND
        new_value = false
      );
    `);

    // PII access policy for sensitive fields
    await dbConnection.query(`
      CREATE POLICY vehicle_pii_policy ON vehicles FOR SELECT
      USING (
        -- Full PII scope can see all fields
        current_setting('session.pii_scope') = 'full' OR
        
        -- Masked PII scope excludes sensitive fields
        (current_setting('session.pii_scope') = 'masked' AND
         NOT accessing_sensitive_fields()) OR
         
        -- No PII scope excludes all PII fields
        (current_setting('session.pii_scope') = 'none' AND
         NOT accessing_pii_fields())
      );
    `);
  }

  /**
   * Private helper methods
   */
  private async generateAccessPolicy(
    user: EnhancedUser,
    context: Partial<VehicleRBACContext>
  ): Promise<VehicleAccessPolicy> {
    const userRole = user.roles?.[0]?.role?.name || 'unknown';
    const userRegions = user.allowedRegions || [];
    const userPIIScope = user.piiScope || 'none';

    // Base policy based on role
    let canRead = false;
    let canWrite = false;
    let canDelete = false;
    let regionRestrictions = userRegions;
    let ownershipRestrictions: VehicleOwnershipType[] = [];
    let dataClassRestrictions: VehicleDataClass[] = [];
    let requiresMFA = false;

    switch (userRole) {
      case 'executive':
        canRead = canWrite = canDelete = true;
        regionRestrictions = ['*'];
        ownershipRestrictions = ['xpress_owned', 'fleet_owned', 'operator_owned', 'driver_owned'];
        dataClassRestrictions = ['public', 'internal', 'confidential', 'restricted'];
        requiresMFA = true;
        break;

      case 'regional_manager':
        canRead = canWrite = true;
        canDelete = false;
        ownershipRestrictions = ['xpress_owned', 'fleet_owned', 'operator_owned'];
        dataClassRestrictions = ['public', 'internal', 'confidential'];
        requiresMFA = true;
        break;

      case 'ops_manager':
        canRead = canWrite = true;
        canDelete = false;
        ownershipRestrictions = ['xpress_owned', 'fleet_owned'];
        dataClassRestrictions = ['public', 'internal', 'confidential'];
        break;

      case 'support':
        canRead = true;
        canWrite = false;
        canDelete = false;
        ownershipRestrictions = ['xpress_owned', 'fleet_owned', 'operator_owned', 'driver_owned'];
        dataClassRestrictions = ['public', 'internal'];
        break;

      case 'risk_investigator':
        canRead = true;
        canWrite = false;
        canDelete = false;
        regionRestrictions = ['*']; // Can access any region for investigations
        ownershipRestrictions = ['xpress_owned', 'fleet_owned', 'operator_owned', 'driver_owned'];
        dataClassRestrictions = ['public', 'internal', 'confidential', 'restricted'];
        requiresMFA = true;
        break;

      case 'ground_ops':
        canRead = true;
        canWrite = false;
        canDelete = false;
        ownershipRestrictions = ['xpress_owned', 'fleet_owned'];
        dataClassRestrictions = ['public', 'internal'];
        break;

      case 'analyst':
        canRead = true;
        canWrite = false;
        canDelete = false;
        ownershipRestrictions = ['xpress_owned', 'fleet_owned', 'operator_owned'];
        dataClassRestrictions = ['public', 'internal'];
        break;

      default:
        // Minimal access for unknown roles
        canRead = false;
        canWrite = false;
        canDelete = false;
        ownershipRestrictions = [];
        dataClassRestrictions = [];
    }

    // Field restrictions based on PII scope and role
    const fieldRestrictions = this.generateFieldRestrictions(userRole, userPIIScope, canWrite);

    return {
      canRead,
      canWrite,
      canDelete,
      regionRestrictions,
      ownershipRestrictions,
      dataClassRestrictions,
      fieldRestrictions,
      requiresMFA,
      auditRequired: true // All vehicle operations require audit
    };
  }

  private generateFieldRestrictions(
    role: string,
    piiScope: string,
    canWrite: boolean
  ): VehicleAccessPolicy['fieldRestrictions'] {
    const baseFields = [
      'id', 'vehicle_code', 'license_plate', 'make', 'model', 'year', 
      'color', 'category', 'fuel_type', 'seating_capacity', 'ownership_type',
      'status', 'condition_rating', 'region_id', 'created_at', 'updated_at'
    ];

    const operationalFields = [
      'total_distance_km', 'total_trips', 'average_rating', 'utilization_rate',
      'availability_score', 'service_types', 'max_trip_distance_km'
    ];

    const maintenanceFields = [
      'total_maintenance_cost', 'maintenance_alerts_count', 'last_maintenance_date',
      'next_maintenance_due', 'condition_score'
    ];

    const financialFields = [
      'purchase_price', 'current_value', 'depreciation_rate', 'insurance_cost',
      'loan_details', 'monthly_payment'
    ];

    const piiFields = [
      'vin', 'engine_number', 'registration_number', 'owner_contact_info',
      'insurance_policy_number', 'driver_personal_info'
    ];

    const restrictedFields = [
      'tracking_device_id', 'obd_device_data', 'gps_tracking_history',
      'security_logs', 'audit_trail'
    ];

    let allowed = [...baseFields];
    let masked: string[] = [];
    let forbidden: string[] = [];

    // Add fields based on role
    if (['ops_manager', 'regional_manager', 'executive'].includes(role)) {
      allowed.push(...operationalFields, ...maintenanceFields);
    }

    if (['finance_ops', 'regional_manager', 'executive'].includes(role)) {
      allowed.push(...financialFields);
    }

    if (['risk_investigator', 'executive'].includes(role)) {
      allowed.push(...restrictedFields);
    }

    // Handle PII based on scope
    switch (piiScope) {
      case 'full':
        allowed.push(...piiFields);
        break;
      case 'masked':
        allowed.push(...piiFields);
        masked.push(...piiFields);
        break;
      case 'none':
      default:
        forbidden.push(...piiFields);
        break;
    }

    // Restrict write access to certain fields
    if (!canWrite) {
      forbidden.push('created_at', 'updated_at', 'id');
    }

    return {
      allowed: [...new Set(allowed)],
      masked: [...new Set(masked)],
      forbidden: [...new Set(forbidden)]
    };
  }

  private canPerformOperation(policy: VehicleAccessPolicy, operation: 'read' | 'write' | 'delete'): boolean {
    switch (operation) {
      case 'read':
        return policy.canRead;
      case 'write':
        return policy.canWrite;
      case 'delete':
        return policy.canDelete;
      default:
        return false;
    }
  }

  private filterResultFields<T extends Record<string, any>>(
    result: T,
    policy: VehicleAccessPolicy
  ): T {
    const filtered = { ...result };

    // Remove forbidden fields
    for (const field of policy.fieldRestrictions.forbidden) {
      delete filtered[field];
    }

    // Mask sensitive fields
    for (const field of policy.fieldRestrictions.masked) {
      if (field in filtered && filtered[field] !== null) {
        const value = String(filtered[field]);
        if (value.length > 4) {
          filtered[field] = value.substring(0, 2) + '*'.repeat(value.length - 4) + value.substring(value.length - 2);
        } else {
          filtered[field] = '*'.repeat(value.length);
        }
      }
    }

    return filtered;
  }

  private getRequiredJoins(user: EnhancedUser, policy: VehicleAccessPolicy): string[] {
    const joins: string[] = [];

    // Join with user assignments for ownership checks
    if (['driver', 'operator'].includes(user.roles?.[0]?.role?.name || '')) {
      joins.push('vehicle_assignments');
    }

    // Join with regional data for cross-region checks
    if (policy.regionRestrictions.length > 0 && !policy.regionRestrictions.includes('*')) {
      joins.push('regions');
    }

    return joins;
  }

  private generatePolicyCacheKey(user: EnhancedUser, context: Partial<VehicleRBACContext>): string {
    const keyData = {
      userId: user.id,
      role: user.roles?.[0]?.role?.name,
      regions: user.allowedRegions?.sort(),
      piiScope: user.piiScope,
      contextRegion: context.regionId,
      contextOwnership: context.ownershipType,
      contextDataClass: context.dataClass
    };

    return Buffer.from(JSON.stringify(keyData)).toString('base64');
  }
}

// Export singleton instance
export const vehicleAccessControl = new VehicleAccessControl();