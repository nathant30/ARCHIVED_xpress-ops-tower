// Vehicle RBAC Middleware
// Enhanced authentication middleware specifically for vehicle operations
// Integrates with existing enhanced-auth system while adding vehicle-specific controls

import { NextRequest } from 'next/server';
import { vehicleRBACEngine } from '@/lib/auth/vehicle-rbac-engine';
import { 
  createApiError, 
  createValidationError,
  createNotFoundError
} from '@/lib/api-utils';
import {
  VehiclePermission,
  VehicleDataClass,
  VehicleRBACContext,
  VehiclePermissionRequirement
} from '@/types/vehicle-rbac';
import { VehicleOwnershipType } from '@/types/vehicles';
import type { EnhancedUser } from '@/types/rbac-abac';

/**
 * Vehicle RBAC middleware configuration
 */
export interface VehicleAuthConfig {
  requiredPermissions: VehiclePermission[];
  dataClass: VehicleDataClass;
  ownershipTypeRestrictions?: VehicleOwnershipType[];
  requireMFA?: boolean;
  requireRegionalAccess?: boolean;
  auditRequired?: boolean;
  allowCrossRegion?: boolean;
}

/**
 * Vehicle operation context extracted from request
 */
interface VehicleRequestContext {
  vehicleId?: string;
  vehicleCode?: string;
  regionId?: string;
  ownershipType?: VehicleOwnershipType;
  operationType: 'read' | 'write' | 'delete' | 'assign' | 'approve';
  caseId?: string;
}

/**
 * Enhanced auth wrapper specifically for vehicle operations
 * Extends the existing enhanced-auth system with vehicle-specific RBAC
 */
export function withVehicleAuth(config: VehicleAuthConfig) {
  return function<T extends any[]>(
    handler: (request: NextRequest, user: EnhancedUser, context: VehicleRequestContext, ...args: T) => Promise<Response>
  ) {
    return async (request: NextRequest, ...args: T): Promise<Response> => {
      try {
        // Step 1: Extract user from request (assuming enhanced-auth has already validated)
        const user = await extractUserFromRequest(request);
        if (!user) {
          return createApiError(
            'Authentication required',
            'AUTH_REQUIRED',
            401,
            undefined,
            request.url,
            request.method
          );
        }

        // Step 2: Extract vehicle context from request
        const vehicleContext = await extractVehicleContext(request);
        if (!vehicleContext.regionId && config.requireRegionalAccess) {
          return createValidationError(
            [{ field: 'regionId', message: 'Region ID required for vehicle operations', code: 'REGION_REQUIRED' }],
            request.url,
            request.method
          );
        }

        // Step 3: Validate required permissions
        const permissionValidation = await validateVehiclePermissions(
          user, 
          config.requiredPermissions, 
          vehicleContext, 
          config
        );

        if (!permissionValidation.allowed) {
          return createApiError(
            permissionValidation.reason,
            'VEHICLE_ACCESS_DENIED',
            403,
            {
              requiredPermissions: config.requiredPermissions,
              userRole: user.roles?.[0]?.role?.name,
              missingPermissions: permissionValidation.missingPermissions
            },
            request.url,
            request.method
          );
        }

        // Step 4: Handle MFA requirements
        if (permissionValidation.requiresMFA && !await verifyMFAForRequest(request, user)) {
          return createApiError(
            'MFA verification required for this vehicle operation',
            'MFA_REQUIRED',
            403,
            {
              mfaChallenge: true,
              operation: config.requiredPermissions[0]
            },
            request.url,
            request.method
          );
        }

        // Step 5: Apply data masking if needed
        if (permissionValidation.maskedFields && permissionValidation.maskedFields.length > 0) {
          // Add masked fields to request context for response filtering
          (request as any).__maskedFields = permissionValidation.maskedFields;
        }

        // Step 6: Execute handler with enhanced context
        return await handler(request, user, vehicleContext, ...args);

      } catch (error) {
        console.error('Vehicle RBAC middleware error:', error);
        return createApiError(
          'Internal server error during vehicle access validation',
          'VEHICLE_AUTH_ERROR',
          500,
          undefined,
          request.url,
          request.method
        );
      }
    };
  };
}

/**
 * Extract user from request (integration with existing auth system)
 */
async function extractUserFromRequest(request: NextRequest): Promise<EnhancedUser | null> {
  // This would integrate with your existing JWT/session authentication
  // For now, we'll assume the user is available from the enhanced-auth system
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;

  try {
    // Parse JWT token and extract user information
    // This is a placeholder - integrate with your actual auth system
    const token = authHeader.replace('Bearer ', '');
    
    // Mock user extraction - replace with actual implementation
    return {
      id: 'user-123',
      email: 'user@example.com',
      roles: [{
        role: { name: 'ops_manager' },
        isActive: true,
        assignedAt: new Date(),
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }],
      allowedRegions: ['region-manila'],
      piiScope: 'masked'
    } as EnhancedUser;
  } catch (error) {
    return null;
  }
}

/**
 * Extract vehicle operation context from request
 */
async function extractVehicleContext(request: NextRequest): Promise<VehicleRequestContext> {
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/').filter(Boolean);
  
  // Extract vehicle ID from URL path
  let vehicleId: string | undefined;
  let vehicleCode: string | undefined;
  
  // Pattern: /api/vehicles/[id] or /api/vehicles/[id]/...
  if (pathSegments.includes('vehicles') && pathSegments.length > 2) {
    const vehicleIndex = pathSegments.indexOf('vehicles');
    vehicleId = pathSegments[vehicleIndex + 1];
  }

  // Extract region from query params or body
  let regionId = url.searchParams.get('regionId') || url.searchParams.get('region');
  let ownershipType = url.searchParams.get('ownershipType') as VehicleOwnershipType;
  const caseId = url.searchParams.get('caseId');

  // For POST/PUT requests, also check body
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    try {
      const body = await request.clone().json();
      regionId = regionId || body.regionId || body.region;
      ownershipType = ownershipType || body.ownershipType;
    } catch (error) {
      // Body parsing failed, continue with URL params
    }
  }

  // Determine operation type from HTTP method and path
  let operationType: VehicleRequestContext['operationType'] = 'read';
  if (request.method === 'POST') {
    operationType = 'write';
  } else if (request.method === 'PUT' || request.method === 'PATCH') {
    operationType = 'write';
  } else if (request.method === 'DELETE') {
    operationType = 'delete';
  } else if (pathSegments.includes('assignments')) {
    operationType = 'assign';
  } else if (pathSegments.includes('approve')) {
    operationType = 'approve';
  }

  return {
    vehicleId,
    vehicleCode,
    regionId: regionId || undefined,
    ownershipType,
    operationType,
    caseId: caseId || undefined
  };
}

/**
 * Validate vehicle permissions using the vehicle RBAC engine
 */
async function validateVehiclePermissions(
  user: EnhancedUser,
  requiredPermissions: VehiclePermission[],
  vehicleContext: VehicleRequestContext,
  config: VehicleAuthConfig
): Promise<{
  allowed: boolean;
  reason: string;
  requiresMFA: boolean;
  maskedFields?: string[];
  missingPermissions?: VehiclePermission[];
}> {
  const missingPermissions: VehiclePermission[] = [];
  let globalRequiresMFA = false;
  let globalMaskedFields: string[] = [];

  // Validate each required permission
  for (const permission of requiredPermissions) {
    const rbacContext: VehicleRBACContext = {
      vehicleId: vehicleContext.vehicleId,
      vehicleCode: vehicleContext.vehicleCode,
      regionId: vehicleContext.regionId || 'unknown',
      ownershipType: vehicleContext.ownershipType || 'xpress_owned',
      dataClass: config.dataClass,
      operationType: vehicleContext.operationType,
      containsPII: config.dataClass === 'confidential' || config.dataClass === 'restricted',
      caseId: vehicleContext.caseId
    };

    const decision = await vehicleRBACEngine.evaluateVehicleAccess(
      user,
      rbacContext,
      permission
    );

    if (!decision.allowed) {
      missingPermissions.push(permission);
    }

    if (decision.requiresMFA) {
      globalRequiresMFA = true;
    }

    if (decision.maskedFields) {
      globalMaskedFields.push(...decision.maskedFields);
    }
  }

  // Check ownership type restrictions
  if (config.ownershipTypeRestrictions && vehicleContext.ownershipType) {
    if (!config.ownershipTypeRestrictions.includes(vehicleContext.ownershipType)) {
      return {
        allowed: false,
        reason: `Access denied for ownership type: ${vehicleContext.ownershipType}`,
        requiresMFA: false,
        missingPermissions: requiredPermissions
      };
    }
  }

  if (missingPermissions.length > 0) {
    return {
      allowed: false,
      reason: `Missing required vehicle permissions: ${missingPermissions.join(', ')}`,
      requiresMFA: false,
      missingPermissions
    };
  }

  return {
    allowed: true,
    reason: 'All vehicle permissions validated successfully',
    requiresMFA: globalRequiresMFA || config.requireMFA || false,
    maskedFields: [...new Set(globalMaskedFields)]
  };
}

/**
 * Verify MFA for vehicle request
 */
async function verifyMFAForRequest(
  request: NextRequest,
  user: EnhancedUser
): Promise<boolean> {
  // Check for MFA verification in headers or session
  const mfaToken = request.headers.get('x-mfa-token');
  const mfaVerified = request.headers.get('x-mfa-verified');

  if (!mfaToken && !mfaVerified) {
    return false;
  }

  // Verify MFA token or session
  // This would integrate with your MFA system
  // For now, we'll check if the header exists and is not expired
  if (mfaVerified) {
    const verifiedAt = parseInt(mfaVerified);
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    
    return (now - verifiedAt) < fiveMinutes;
  }

  return false;
}

/**
 * Utility function to create vehicle-specific auth config
 */
export function createVehicleAuthConfig(
  permissions: VehiclePermission[],
  dataClass: VehicleDataClass = 'internal',
  options: Partial<Omit<VehicleAuthConfig, 'requiredPermissions' | 'dataClass'>> = {}
): VehicleAuthConfig {
  return {
    requiredPermissions: permissions,
    dataClass,
    requireRegionalAccess: true,
    auditRequired: true,
    ...options
  };
}

/**
 * Predefined vehicle auth configurations for common operations
 */
export const VehicleAuthConfigs = {
  // Basic vehicle viewing
  viewBasic: createVehicleAuthConfig(['view_vehicles_basic'], 'internal'),
  
  // Detailed vehicle viewing
  viewDetailed: createVehicleAuthConfig(['view_vehicles_detailed'], 'internal'),
  
  // Vehicle management operations
  manage: createVehicleAuthConfig(
    ['view_vehicles_detailed', 'update_vehicle_details'],
    'confidential',
    { requireMFA: true }
  ),
  
  // Financial vehicle operations
  financial: createVehicleAuthConfig(
    ['approve_vehicle_purchases', 'manage_vehicle_financing'],
    'restricted',
    { requireMFA: true, auditRequired: true }
  ),
  
  // Vehicle assignments
  assign: createVehicleAuthConfig(
    ['assign_driver_to_vehicle', 'approve_vehicle_assignments'],
    'internal'
  ),
  
  // Maintenance operations
  maintenance: createVehicleAuthConfig(
    ['schedule_vehicle_maintenance', 'view_vehicle_maintenance_history'],
    'internal'
  ),
  
  // Analytics and reporting
  analytics: createVehicleAuthConfig(
    ['view_vehicle_analytics', 'generate_vehicle_performance_reports'],
    'internal'
  ),
  
  // Investigation operations
  investigate: createVehicleAuthConfig(
    ['investigate_vehicle_incidents', 'access_vehicle_security_logs'],
    'restricted',
    { requireMFA: true, allowCrossRegion: true }
  )
};

/**
 * Response data masking utility
 */
export function maskVehicleData<T extends Record<string, any>>(
  data: T,
  maskedFields: string[]
): T {
  if (!maskedFields || maskedFields.length === 0) {
    return data;
  }

  const masked = { ...data };
  
  for (const field of maskedFields) {
    if (field in masked) {
      if (typeof masked[field] === 'string') {
        // Mask string values
        const value = masked[field] as string;
        if (value.length > 4) {
          masked[field] = value.substring(0, 2) + '*'.repeat(value.length - 4) + value.substring(value.length - 2);
        } else {
          masked[field] = '*'.repeat(value.length);
        }
      } else {
        // For non-string values, replace with placeholder
        masked[field] = '[MASKED]';
      }
    }
  }

  return masked;
}

/**
 * Batch permission validation for multiple vehicle operations
 */
export async function validateBatchVehiclePermissions(
  user: EnhancedUser,
  operations: Array<{
    vehicleId: string;
    permissions: VehiclePermission[];
    context: Partial<VehicleRBACContext>;
  }>
): Promise<Array<{
  vehicleId: string;
  allowed: boolean;
  reason: string;
  requiresMFA: boolean;
}>> {
  const results = [];

  for (const operation of operations) {
    const context: VehicleRBACContext = {
      regionId: 'unknown',
      ownershipType: 'xpress_owned',
      dataClass: 'internal',
      operationType: 'read',
      containsPII: false,
      ...operation.context,
      vehicleId: operation.vehicleId
    };

    let allAllowed = true;
    let requiresMFA = false;
    let reasons: string[] = [];

    for (const permission of operation.permissions) {
      const decision = await vehicleRBACEngine.evaluateVehicleAccess(
        user,
        context,
        permission
      );

      if (!decision.allowed) {
        allAllowed = false;
        reasons.push(decision.reason);
      }

      if (decision.requiresMFA) {
        requiresMFA = true;
      }
    }

    results.push({
      vehicleId: operation.vehicleId,
      allowed: allAllowed,
      reason: allAllowed ? 'All permissions granted' : reasons.join('; '),
      requiresMFA
    });
  }

  return results;
}