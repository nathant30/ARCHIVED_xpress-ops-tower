// Vehicle Permission Gate Components
// React components for declarative vehicle access control in the UI

import React from 'react';
import { AlertTriangle, Lock, Shield, Eye, EyeOff } from 'lucide-react';
import { useVehicleRBAC, useVehiclePermissions, UseVehicleRBACConfig } from '@/hooks/useVehicleRBAC';
import { VehiclePermission } from '@/types/vehicle-rbac';
import { Button } from '@/components/xpress/button';
import { Card, CardContent } from '@/components/xpress/card';

/**
 * Base Vehicle Permission Gate Component
 * Controls visibility and access based on vehicle-specific permissions
 */
export interface VehiclePermissionGateProps {
  permissions: VehiclePermission | VehiclePermission[];
  config?: UseVehicleRBACConfig;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAll?: boolean;
  showLoading?: boolean;
  showError?: boolean;
  onAccessDenied?: (reason: string) => void;
  onMFARequired?: () => void;
}

export function VehiclePermissionGate({
  permissions,
  config = {},
  children,
  fallback,
  requireAll = true,
  showLoading = true,
  showError = true,
  onAccessDenied,
  onMFARequired
}: VehiclePermissionGateProps) {
  const permissionArray = Array.isArray(permissions) ? permissions : [permissions];
  const { allowed, loading, error, reason, requiresMFA } = useVehicleRBAC(permissionArray, config);

  // Handle loading state
  if (loading && showLoading) {
    return (
      <div className="flex items-center space-x-2 p-2">
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
        <span className="text-sm text-gray-500">Checking permissions...</span>
      </div>
    );
  }

  // Handle error state
  if (error && showError) {
    return (
      <div className="flex items-center space-x-2 p-2 text-red-600 bg-red-50 rounded-lg">
        <AlertTriangle className="w-4 h-4" />
        <span className="text-sm">Permission check failed: {error}</span>
      </div>
    );
  }

  // Handle MFA requirement
  if (requiresMFA && onMFARequired) {
    onMFARequired();
  }

  // Handle access denied
  if (!allowed) {
    if (onAccessDenied && reason) {
      onAccessDenied(reason);
    }
    
    if (fallback !== undefined) {
      return <>{fallback}</>;
    }
    
    return null;
  }

  return <>{children}</>;
}

/**
 * Vehicle Action Button with Permission Control
 * Button component that automatically handles vehicle permissions
 */
export interface VehicleActionButtonProps {
  permissions: VehiclePermission | VehiclePermission[];
  config?: UseVehicleRBACConfig;
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  showPermissionIcon?: boolean;
  onMFARequired?: () => void;
}

export function VehicleActionButton({
  permissions,
  config = {},
  onClick,
  children,
  variant = 'secondary',
  size = 'md',
  className = '',
  disabled = false,
  showPermissionIcon = true,
  onMFARequired
}: VehicleActionButtonProps) {
  const permissionArray = Array.isArray(permissions) ? permissions : [permissions];
  const { allowed, loading, requiresMFA, ownershipAccessLevel } = useVehicleRBAC(permissionArray, config);

  const handleClick = () => {
    if (!allowed) return;
    
    if (requiresMFA && onMFARequired) {
      onMFARequired();
      return;
    }
    
    onClick();
  };

  const getPermissionIcon = () => {
    if (!showPermissionIcon) return null;
    
    if (loading) {
      return <div className="animate-spin rounded-full h-3 w-3 border border-current border-t-transparent" />;
    }
    
    if (!allowed) {
      return <Lock className="w-3 h-3" />;
    }
    
    if (requiresMFA) {
      return <Shield className="w-3 h-3" />;
    }
    
    return null;
  };

  const isDisabled = disabled || loading || !allowed;

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      disabled={isDisabled}
      onClick={handleClick}
      leftIcon={getPermissionIcon()}
      title={!allowed ? 'Insufficient permissions' : requiresMFA ? 'MFA required' : undefined}
    >
      {children}
    </Button>
  );
}

/**
 * Vehicle Data Display with Masking
 * Automatically masks sensitive vehicle data based on user permissions
 */
export interface VehicleDataDisplayProps {
  data: Record<string, any>;
  config?: UseVehicleRBACConfig;
  fields: Array<{
    key: string;
    label: string;
    sensitive?: boolean;
    formatter?: (value: any) => string;
  }>;
  className?: string;
  showMaskedIndicator?: boolean;
}

export function VehicleDataDisplay({
  data,
  config = {},
  fields,
  className = '',
  showMaskedIndicator = true
}: VehicleDataDisplayProps) {
  const { maskedFields, ownershipAccessLevel } = useVehicleRBAC('view_vehicles_detailed', config);

  const isFieldMasked = (fieldKey: string) => {
    return maskedFields.includes(fieldKey);
  };

  const formatValue = (field: typeof fields[0], value: any) => {
    if (isFieldMasked(field.key)) {
      if (typeof value === 'string' && value.length > 4) {
        return value.substring(0, 2) + '*'.repeat(value.length - 4) + value.substring(value.length - 2);
      }
      return '[MASKED]';
    }
    
    return field.formatter ? field.formatter(value) : value?.toString() || '-';
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {fields.map((field) => (
        <div key={field.key} className="flex justify-between items-center py-1">
          <span className="text-sm font-medium text-gray-600">{field.label}:</span>
          <div className="flex items-center space-x-1">
            <span className="text-sm text-gray-900">
              {formatValue(field, data[field.key])}
            </span>
            {showMaskedIndicator && isFieldMasked(field.key) && (
              <EyeOff className="w-3 h-3 text-gray-400" title="Data masked" />
            )}
          </div>
        </div>
      ))}
      
      {showMaskedIndicator && maskedFields.length > 0 && (
        <div className="flex items-center space-x-2 mt-3 p-2 bg-yellow-50 rounded-lg">
          <EyeOff className="w-4 h-4 text-yellow-600" />
          <span className="text-xs text-yellow-700">
            Some data is masked based on your access level ({ownershipAccessLevel})
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Vehicle Access Level Indicator
 * Shows the user's current access level for vehicle operations
 */
export interface VehicleAccessLevelProps {
  config?: UseVehicleRBACConfig;
  showDetails?: boolean;
  className?: string;
}

export function VehicleAccessLevel({
  config = {},
  showDetails = false,
  className = ''
}: VehicleAccessLevelProps) {
  const { ownershipAccessLevel, loading } = useVehicleRBAC('view_vehicles_basic', config);

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-6 w-24 rounded"></div>;
  }

  const getAccessLevelConfig = () => {
    switch (ownershipAccessLevel) {
      case 'full':
        return {
          label: 'Full Access',
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: <Shield className="w-3 h-3" />,
          description: 'Complete access to all vehicle data and operations'
        };
      case 'financial':
        return {
          label: 'Financial Access',
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: <Shield className="w-3 h-3" />,
          description: 'Access to financial data and budget operations'
        };
      case 'detailed':
        return {
          label: 'Detailed Access',
          color: 'bg-purple-100 text-purple-800 border-purple-200',
          icon: <Eye className="w-3 h-3" />,
          description: 'Access to detailed vehicle information and operations'
        };
      case 'basic':
        return {
          label: 'Basic Access',
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <Eye className="w-3 h-3" />,
          description: 'Basic vehicle information and limited operations'
        };
      default:
        return {
          label: 'No Access',
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: <Lock className="w-3 h-3" />,
          description: 'No access to vehicle operations'
        };
    }
  };

  const accessConfig = getAccessLevelConfig();

  return (
    <div className={className}>
      <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${accessConfig.color}`}>
        {accessConfig.icon}
        <span>{accessConfig.label}</span>
      </div>
      
      {showDetails && (
        <p className="text-xs text-gray-500 mt-1">{accessConfig.description}</p>
      )}
    </div>
  );
}

/**
 * Vehicle Permission Summary Card
 * Displays a summary of user's vehicle permissions
 */
export interface VehiclePermissionSummaryProps {
  permissions: VehiclePermission[];
  config?: UseVehicleRBACConfig;
  className?: string;
}

export function VehiclePermissionSummary({
  permissions,
  config = {},
  className = ''
}: VehiclePermissionSummaryProps) {
  const { permissions: userPermissions, loading } = useVehiclePermissions(permissions);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const grantedCount = userPermissions.length;
  const totalCount = permissions.length;
  const grantedPercentage = totalCount > 0 ? Math.round((grantedCount / totalCount) * 100) : 0;

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Vehicle Permissions</h3>
            <span className="text-xs text-gray-500">{grantedCount}/{totalCount}</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${grantedPercentage}%` }}
            ></div>
          </div>
          
          <div className="space-y-1">
            {permissions.map((permission) => {
              const isGranted = userPermissions.includes(permission);
              return (
                <div key={permission} className="flex items-center space-x-2 text-xs">
                  <div className={`w-2 h-2 rounded-full ${isGranted ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className={isGranted ? 'text-gray-700' : 'text-gray-400'}>
                    {permission.replace(/_/g, ' ')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Vehicle MFA Challenge Component
 * Handles MFA requirements for vehicle operations
 */
export interface VehicleMFAChallengeProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  operation: string;
  vehicleId?: string;
}

export function VehicleMFAChallenge({
  isOpen,
  onClose,
  onSuccess,
  operation,
  vehicleId
}: VehicleMFAChallengeProps) {
  if (!isOpen) return null;

  const handleMFASuccess = () => {
    // Here you would integrate with your MFA system
    // For now, we'll simulate success
    setTimeout(() => {
      onSuccess();
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 mx-auto bg-yellow-100 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-yellow-600" />
            </div>
            
            <div>
              <h2 className="text-lg font-semibold text-gray-900">MFA Required</h2>
              <p className="text-sm text-gray-600 mt-1">
                Multi-factor authentication is required for this vehicle operation.
              </p>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-lg text-left">
              <div className="text-xs font-medium text-gray-700">Operation:</div>
              <div className="text-sm text-gray-900">{operation}</div>
              {vehicleId && (
                <>
                  <div className="text-xs font-medium text-gray-700 mt-2">Vehicle ID:</div>
                  <div className="text-sm text-gray-900">{vehicleId}</div>
                </>
              )}
            </div>
            
            <div className="flex space-x-2">
              <Button variant="secondary" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button variant="primary" onClick={handleMFASuccess} className="flex-1">
                Verify MFA
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * HOC for wrapping components with vehicle permission checks
 */
export function withVehiclePermissions<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredPermissions: VehiclePermission[],
  config: UseVehicleRBACConfig = {}
) {
  return function VehiclePermissionWrapper(props: P) {
    const { allowed, loading, error } = useVehicleRBAC(requiredPermissions, config);

    if (loading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center p-8 text-red-600">
          <AlertTriangle className="w-5 h-5 mr-2" />
          Permission check failed: {error}
        </div>
      );
    }

    if (!allowed) {
      return (
        <div className="flex items-center justify-center p-8 text-gray-500">
          <Lock className="w-5 h-5 mr-2" />
          Insufficient permissions to view this content
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
}