'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface RBACUser {
  id: string;
  email: string;
  role: string;
  level: string;
  regions: string[];
}

export function useRBAC() {
  const [user, setUser] = useState<RBACUser | null>(null);
  const [token, setToken] = useState<string>('');
  const router = useRouter();

  const login = (accessToken: string) => {
    setToken(accessToken);
    localStorage.setItem('rbac_token', accessToken);
  };

  const logout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('rbac_token');
    router.push('/rbac-login');
  };

  const hasPermission = (permission: string) => {
    // Simple permission check based on role
    if (!user) return false;
    
    const rolePermissions: { [key: string]: string[] } = {
      'executive': ['*'], // All permissions
      'expansion_manager': ['view_drivers', 'create_regions', 'manage_expansion'],
      'ground_ops': ['view_drivers', 'view_bookings'],
      'risk_investigator': ['view_drivers', 'investigate_fraud']
    };

    const userPermissions = rolePermissions[user.role] || [];
    return userPermissions.includes('*') || userPermissions.includes(permission);
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('rbac_token');
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  return {
    user,
    token,
    login,
    logout,
    hasPermission
  };
}