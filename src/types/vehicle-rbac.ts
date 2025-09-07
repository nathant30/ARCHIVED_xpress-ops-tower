// Vehicle Management RBAC Types and Interfaces
// Comprehensive type definitions for vehicle-specific RBAC operations

import { VehicleOwnershipType } from './vehicles';

/**
 * Vehicle-specific permissions for granular access control
 */
export type VehiclePermission = 
  // Basic Vehicle Operations
  | 'view_vehicles_basic'
  | 'view_vehicles_detailed'
  | 'view_vehicles_support'
  | 'view_vehicle_dashboard'
  | 'view_vehicle_analytics'
  
  // Vehicle Management
  | 'create_vehicles'
  | 'update_vehicle_details'
  | 'delete_vehicles'
  | 'approve_vehicle_registrations'
  | 'approve_vehicle_decommissioning'
  | 'manage_regional_vehicles'
  | 'manage_vehicle_fleet_budget'
  
  // Vehicle Assignments and Operations
  | 'assign_driver_to_vehicle'
  | 'approve_vehicle_assignments'
  | 'update_vehicle_status_basic'
  | 'configure_vehicle_operational_params'
  
  // Maintenance and Compliance
  | 'schedule_vehicle_maintenance'
  | 'approve_major_vehicle_maintenance'
  | 'view_vehicle_maintenance_history'
  | 'manage_vehicle_compliance'
  | 'review_vehicle_compliance_violations'
  
  // Telemetry and Monitoring
  | 'view_vehicle_telemetry_basic'
  | 'view_vehicle_telemetry_detailed'
  | 'access_vehicle_tracking_history'
  | 'access_vehicle_security_logs'
  
  // Financial and Budget
  | 'approve_vehicle_purchases'
  | 'manage_vehicle_financing'
  | 'process_vehicle_insurance_claims'
  | 'approve_vehicle_maintenance_budgets'
  | 'view_vehicle_cost_analysis'
  | 'manage_vehicle_depreciation'
  | 'view_vehicle_financial_reports'
  
  // Reporting and Analytics
  | 'generate_vehicle_performance_reports'
  | 'create_vehicle_reports'
  | 'analyze_vehicle_utilization'
  | 'export_vehicle_data_anonymized'
  | 'create_fleet_efficiency_reports'
  | 'view_global_fleet_analytics'
  | 'access_executive_vehicle_reports'
  
  // Investigation and Security
  | 'investigate_vehicle_incidents'
  | 'access_vehicle_incident_reports'
  | 'update_vehicle_support_notes'
  | 'audit_vehicle_ownership_verification'
  
  // Expansion and Strategic
  | 'plan_vehicle_fleet_expansion'
  | 'evaluate_vehicle_partnership_opportunities'
  | 'configure_expansion_vehicle_requirements'
  | 'approve_strategic_vehicle_investments'
  | 'approve_vehicle_expansion_plans'
  | 'approve_major_vehicle_partnerships'
  | 'manage_vehicle_partnerships';

/**
 * Vehicle data classification levels
 */
export type VehicleDataClass = 
  | 'public'          // Basic vehicle info (make, model, year)
  | 'internal'        // Operational data (status, assignments)
  | 'confidential'    // Financial data, maintenance costs
  | 'restricted';     // PII, tracking data, investigation records

/**
 * Vehicle operation context for RBAC evaluation
 */
export interface VehicleRBACContext {
  vehicleId?: string;
  vehicleCode?: string;
  regionId: string;
  ownershipType: VehicleOwnershipType;
  dataClass: VehicleDataClass;
  operationType: 'read' | 'write' | 'delete' | 'assign' | 'approve';
  containsPII: boolean;
  requiresMFA?: boolean;
  caseId?: string; // For cross-region investigations
}

/**
 * Vehicle permission requirement specification
 */
export interface VehiclePermissionRequirement {
  permission: VehiclePermission;
  dataClass: VehicleDataClass;
  requiresMFA?: boolean;
  ownershipTypeRestrictions?: VehicleOwnershipType[];
  regionalRestriction?: boolean;
  auditRequired?: boolean;
}

/**
 * Vehicle RBAC policy decision result
 */
export interface VehicleRBACDecision {
  allowed: boolean;
  reason: string;
  maskedFields?: string[];
  requiresMFA: boolean;
  auditRequired: boolean;
  ownershipAccessLevel: 'none' | 'basic' | 'detailed' | 'financial' | 'full';
  conditions: VehicleAccessCondition[];
}

/**
 * Access conditions for vehicle operations
 */
export interface VehicleAccessCondition {
  type: 'ownership_verification' | 'regional_approval' | 'mfa_required' | 'time_limited' | 'supervisor_approval';
  description: string;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

/**
 * Vehicle ownership access matrix
 * Defines what data each role can access based on ownership type
 */
export type VehicleOwnershipAccessMatrix = {
  [K in VehicleOwnershipType]: {
    basic: VehiclePermission[];      // Basic operations allowed
    detailed: VehiclePermission[];   // Detailed operations allowed
    financial: VehiclePermission[];  // Financial operations allowed
    restricted: VehiclePermission[]; // Restricted operations (require special approval)
  };
}

/**
 * Vehicle regional access policy
 */
export interface VehicleRegionalAccessPolicy {
  regionId: string;
  allowedOperations: VehiclePermission[];
  crossRegionOverride: {
    enabled: boolean;
    requiredRoles: string[];
    requiresMFA: boolean;
    auditRequired: boolean;
  };
}

/**
 * Vehicle audit event types specific to RBAC
 */
export enum VehicleRBACEventType {
  PERMISSION_GRANTED = 'vehicle_permission_granted',
  PERMISSION_DENIED = 'vehicle_permission_denied',
  MFA_REQUIRED = 'vehicle_mfa_required',
  CROSS_REGION_ACCESS = 'vehicle_cross_region_access',
  OWNERSHIP_VERIFICATION = 'vehicle_ownership_verification',
  RESTRICTED_DATA_ACCESS = 'vehicle_restricted_data_access',
  FINANCIAL_DATA_ACCESS = 'vehicle_financial_data_access'
}

/**
 * Vehicle RBAC audit log entry
 */
export interface VehicleRBACauditLog {
  eventType: VehicleRBACEventType;
  userId: string;
  vehicleId: string;
  permission: VehiclePermission;
  context: VehicleRBACContext;
  decision: VehicleRBACDecision;
  timestamp: Date;
  ipAddress: string;
  userAgent?: string;
  sessionId: string;
  requestId: string;
}

/**
 * Vehicle permission validation result
 */
export interface VehiclePermissionValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
}

/**
 * Vehicle RBAC configuration
 */
export interface VehicleRBACConfig {
  enableOwnershipBasedAccess: boolean;
  enableRegionalRestrictions: boolean;
  enableMFAForFinancialData: boolean;
  enableCrossRegionOverride: boolean;
  auditAllVehicleAccess: boolean;
  maskedFieldsDefault: string[];
  sessionTimeoutMinutes: number;
  mfaTimeoutSeconds: number;
}

/**
 * Default vehicle RBAC configuration
 */
export const DEFAULT_VEHICLE_RBAC_CONFIG: VehicleRBACConfig = {
  enableOwnershipBasedAccess: true,
  enableRegionalRestrictions: true,
  enableMFAForFinancialData: true,
  enableCrossRegionOverride: true,
  auditAllVehicleAccess: true,
  maskedFieldsDefault: ['vin', 'engine_number', 'owner_contact', 'insurance_details'],
  sessionTimeoutMinutes: 480, // 8 hours
  mfaTimeoutSeconds: 300      // 5 minutes
};

/**
 * Vehicle ownership access matrix configuration
 */
export const VEHICLE_OWNERSHIP_ACCESS_MATRIX: VehicleOwnershipAccessMatrix = {
  xpress_owned: {
    basic: [
      'view_vehicles_detailed',
      'update_vehicle_details',
      'assign_driver_to_vehicle',
      'schedule_vehicle_maintenance',
      'view_vehicle_telemetry_detailed'
    ],
    detailed: [
      'manage_vehicle_compliance',
      'approve_vehicle_assignments',
      'view_vehicle_financial_reports',
      'create_vehicle_reports'
    ],
    financial: [
      'approve_vehicle_purchases',
      'manage_vehicle_financing',
      'view_vehicle_cost_analysis',
      'approve_vehicle_maintenance_budgets'
    ],
    restricted: [
      'approve_vehicle_decommissioning',
      'audit_vehicle_ownership_verification'
    ]
  },
  fleet_owned: {
    basic: [
      'view_vehicles_detailed',
      'assign_driver_to_vehicle',
      'view_vehicle_telemetry_basic',
      'schedule_vehicle_maintenance'
    ],
    detailed: [
      'view_vehicle_maintenance_history',
      'manage_vehicle_compliance',
      'create_vehicle_reports'
    ],
    financial: [
      'view_vehicle_cost_analysis'
    ],
    restricted: [
      'investigate_vehicle_incidents'
    ]
  },
  operator_owned: {
    basic: [
      'view_vehicles_basic',
      'assign_driver_to_vehicle',
      'view_vehicle_telemetry_basic'
    ],
    detailed: [
      'view_vehicle_maintenance_history',
      'update_vehicle_support_notes'
    ],
    financial: [],
    restricted: []
  },
  driver_owned: {
    basic: [
      'view_vehicles_basic',
      'view_vehicle_telemetry_basic'
    ],
    detailed: [
      'view_vehicle_maintenance_history'
    ],
    financial: [],
    restricted: []
  }
};