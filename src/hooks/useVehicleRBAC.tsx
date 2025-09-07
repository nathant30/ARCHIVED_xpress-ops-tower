// Vehicle RBAC React Hooks - Development Version
// Simplified version that always allows access for development purposes

import { useState, useEffect } from 'react';

// Development mode interfaces
export interface VehiclePermission {
  [key: string]: any;
}

export interface VehicleDataClass {
  [key: string]: any;
}

export interface UseVehicleRBACConfig {
  vehicleId?: string;
  regionId?: string;
  ownershipType?: string;
  requireMFA?: boolean;
}

export interface VehiclePermissionCheck {
  allowed: boolean;
  loading: boolean;
  error?: string;
  reason?: string;
  requiresMFA: boolean;
  maskedFields: string[];
  ownershipAccessLevel: 'none' | 'basic' | 'detailed' | 'financial' | 'full';
}

/**
 * Main vehicle RBAC hook - Development version
 * Always allows access for development purposes
 */
export function useVehicleRBAC(
  permission: VehiclePermission | VehiclePermission[],
  config: UseVehicleRBACConfig = {}
) {
  const [loading, setLoading] = useState(true);

  // Simulate brief loading then allow access
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return {
    allowed: true, // Always allow in development
    loading,
    error: undefined,
    reason: 'Development mode - access granted',
    requiresMFA: false,
    maskedFields: [],
    ownershipAccessLevel: 'full' as const,
    refresh: () => {},
    user: null
  };
}

/**
 * Hook for checking vehicle permissions - Development version
 */
export function useVehiclePermissions(permissions?: VehiclePermission[]) {
  return {
    hasPermission: () => true,
    canView: () => true,
    canEdit: () => true,
    canDelete: () => true,
    canManage: () => true,
    loading: false,
    effectivePermissions: permissions || []
  };
}