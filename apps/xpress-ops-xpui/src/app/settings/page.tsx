'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Settings, 
  Database, 
  Shield, 
  Bell, 
  Users, 
  Key, 
  FileText,
  Activity
} from 'lucide-react';

// Import our extracted components
import SystemHealthPanel from '@/components/settings/SystemHealthPanel';
import UserManagementPanel from '@/components/settings/UserManagementPanel';
import APIManagementPanel from '@/components/settings/APIManagementPanel';
import SecurityPanel from '@/components/settings/SecurityPanel';
import NotificationsPanel from '@/components/settings/NotificationsPanel';
import AuditPanel from '@/components/settings/AuditPanel';
import { RegionAccessDrawer } from '@/components/RegionAccessDrawer';

// Import production logger
import logger from '@/lib/security/productionLogger';
import { PermissionGate, useRBAC } from '@/hooks/useRBAC';
import RoleEditModal from '@/components/settings/RoleEditModal';

// Types
interface SystemService {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'degraded';
  uptime: number;
  responseTime: number;
  lastCheck: Date;
}

interface SystemHealthMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  requests: number;
  errors: number;
  uptime: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive' | 'suspended';
  lastLogin: Date;
  createdAt: Date;
}

interface UserRole {
  id: string;
  name: string;
  permissions: string[];
  description: string;
  userCount: number;
}

interface ApiKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  createdAt: Date;
  lastUsed: Date | null;
  status: 'active' | 'inactive' | 'revoked';
}

interface ApiIntegration {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  status: 'active' | 'inactive';
  lastSync: Date | null;
}

interface SecurityConfig {
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  passwordMinLength: number;
  passwordRequireSpecialChars: boolean;
  loginAttemptLimit: number;
  ipWhitelistEnabled: boolean;
  auditLoggingEnabled: boolean;
}

interface SecurityEvent {
  id: string;
  type: 'login_failure' | 'password_change' | 'permission_change' | 'suspicious_activity';
  description: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high';
  user: string;
  ipAddress: string;
}

interface NotificationSetting {
  id: string;
  category: string;
  email: boolean;
  push: boolean;
  sms: boolean;
  inApp: boolean;
  description: string;
}

interface NotificationTemplate {
  id: string;
  name: string;
  type: 'email' | 'push' | 'sms';
  subject: string;
  content: string;
  variables: string[];
  active: boolean;
}

interface AuditLog {
  id: string;
  timestamp: Date;
  user: string;
  action: string;
  resource: string;
  ipAddress: string;
  userAgent: string;
  status: 'success' | 'failure' | 'warning';
  details: string;
}

interface AuditExport {
  id: string;
  name: string;
  generatedAt: Date;
  status: 'completed' | 'processing' | 'failed';
  size: string;
  type: 'csv' | 'json' | 'pdf';
  downloadUrl?: string;
}

const SettingsPage = () => {
  // Main tab state
  const [activeTab, setActiveTab] = useState('system');
  const [loading, setLoading] = useState(false);
  const [expandedService, setExpandedService] = useState<string | null>(null);

  // Sub-tab states for each main tab
  const [activeSystemSubTab, setActiveSystemSubTab] = useState('health');
  const [activeUserSubTab, setActiveUserSubTab] = useState('users');
  const [activeApiSubTab, setActiveApiSubTab] = useState('xpress-api');
  const [activeSecuritySubTab, setActiveSecuritySubTab] = useState('settings');
  const [activeNotificationsSubTab, setActiveNotificationsSubTab] = useState('preferences');
  const [activeAuditSubTab, setActiveAuditSubTab] = useState('logs');

  // System Health state
  const [systemHealth, setSystemHealth] = useState<SystemHealthMetrics | null>({
    cpu: 45,
    memory: 68,
    disk: 23,
    network: 12,
    requests: 1247,
    errors: 3,
    uptime: 99.8
  });

  const [systemServices] = useState<SystemService[]>([
    {
      id: '1',
      name: 'Database Service',
      status: 'online',
      uptime: 99.9,
      responseTime: 23,
      lastCheck: new Date()
    },
    {
      id: '2',
      name: 'API Gateway',
      status: 'online',
      uptime: 99.7,
      responseTime: 45,
      lastCheck: new Date()
    },
    {
      id: '3',
      name: 'Real-time Service',
      status: 'degraded',
      uptime: 97.2,
      responseTime: 156,
      lastCheck: new Date()
    }
  ]);

  // User Management state
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [regionAccessDrawerOpen, setRegionAccessDrawerOpen] = useState(false);

  // Fetch RBAC data on component mount
  useEffect(() => {
    const fetchRBACData = async () => {
      try {
        setLoading(true);
        
        // Mock current user role for super_admin visibility restriction
        // In production, this would come from user context/auth
        const currentUserRole = 'iam_admin'; // TODO: Replace with actual user role from auth context
        
        // Fetch roles with user role context for security filtering
        const rolesResponse = await fetch('/api/rbac/roles/public');
        if (rolesResponse.ok) {
          const rolesData = await rolesResponse.json();
          // Convert RBAC roles to UserRole format
          let convertedRoles = rolesData.roles.map((role: any) => ({
            id: role.id,
            name: role.name,
            permissions: role.permissions || [],
            description: role.description || role.name,
            userCount: role.userCount || 0
          }));
          
          // SECURITY: Double-check that super_admin is filtered on frontend too
          if (currentUserRole !== 'super_admin') {
            convertedRoles = convertedRoles.filter((role: any) => role.name !== 'super_admin');
          }
          
          setRoles(convertedRoles);
        }
        
        // Fetch users
        const usersResponse = await fetch('/api/rbac/users');
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          setUsers(usersData.data.users);
        }
        
      } catch (error) {
        logger.error('Failed to fetch RBAC data', { error });
      } finally {
        setLoading(false);
      }
    };

    fetchRBACData();
  }, []);

  // API Management state
  const [apiKeys] = useState<ApiKey[]>([
    {
      id: '1',
      name: 'Production API Key',
      key: 'xpr_live_1234567890abcdefghijklmnopqrstuvwxyz',
      permissions: ['read', 'write'],
      createdAt: new Date('2024-01-01'),
      lastUsed: new Date(),
      status: 'active'
    },
    {
      id: '2',
      name: 'Development API Key',
      key: 'xpr_test_abcdefghijklmnopqrstuvwxyz1234567890',
      permissions: ['read'],
      createdAt: new Date('2024-02-15'),
      lastUsed: new Date(Date.now() - 3600000),
      status: 'active'
    }
  ]);

  const [integrations] = useState<ApiIntegration[]>([
    {
      id: '1',
      name: 'Payment Gateway',
      description: 'Process payments and refunds',
      endpoint: '/api/payments',
      method: 'POST',
      status: 'active',
      lastSync: new Date()
    },
    {
      id: '2',
      name: 'SMS Service',
      description: 'Send SMS notifications',
      endpoint: '/api/sms',
      method: 'POST',
      status: 'active',
      lastSync: new Date(Date.now() - 1800000)
    }
  ]);

  // Security state
  const [securityConfig] = useState<SecurityConfig>({
    twoFactorEnabled: true,
    sessionTimeout: 480,
    passwordMinLength: 8,
    passwordRequireSpecialChars: true,
    loginAttemptLimit: 5,
    ipWhitelistEnabled: false,
    auditLoggingEnabled: true
  });

  const [securityEvents] = useState<SecurityEvent[]>([
    {
      id: '1',
      type: 'login_failure',
      description: 'Multiple failed login attempts detected',
      timestamp: new Date(),
      severity: 'high',
      user: 'unknown',
      ipAddress: '192.168.1.100'
    },
    {
      id: '2',
      type: 'password_change',
      description: 'User password changed successfully',
      timestamp: new Date(Date.now() - 3600000),
      severity: 'low',
      user: 'admin@xpress.ops',
      ipAddress: '192.168.1.10'
    }
  ]);

  // Notifications state
  const [notificationSettings] = useState<NotificationSetting[]>([
    {
      id: '1',
      category: 'System Alerts',
      description: 'Critical system notifications',
      email: true,
      push: true,
      sms: false,
      inApp: true
    },
    {
      id: '2',
      category: 'User Activity',
      description: 'User login and activity notifications',
      email: false,
      push: true,
      sms: false,
      inApp: true
    }
  ]);

  const [templates] = useState<NotificationTemplate[]>([
    {
      id: '1',
      name: 'System Alert Template',
      type: 'email',
      subject: 'System Alert: {{alert_type}}',
      content: 'Alert details: {{details}}',
      variables: ['alert_type', 'details', 'timestamp'],
      active: true
    }
  ]);

  // Audit state
  const [auditLogs] = useState<AuditLog[]>([
    {
      id: '1',
      timestamp: new Date(),
      user: 'admin@xpress.ops',
      action: 'user_login',
      resource: '/auth/login',
      ipAddress: '192.168.1.10',
      userAgent: 'Mozilla/5.0...',
      status: 'success',
      details: 'User login successful'
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 1800000),
      user: 'ops@xpress.ops',
      action: 'settings_update',
      resource: '/settings/notifications',
      ipAddress: '192.168.1.15',
      userAgent: 'Mozilla/5.0...',
      status: 'success',
      details: 'Notification settings updated'
    }
  ]);

  const [auditExports] = useState<AuditExport[]>([
    {
      id: '1',
      name: 'Monthly Audit Report - December 2024',
      generatedAt: new Date('2024-12-31'),
      status: 'completed',
      size: '2.4 MB',
      type: 'pdf',
      downloadUrl: '/exports/audit-december-2024.pdf'
    }
  ]);

  // Tab configuration
  const tabs = [
    { id: 'system', label: 'System Health', icon: Database },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'api', label: 'API Management', icon: Key },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'monitoring', label: 'Monitoring', icon: Activity },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'audit', label: 'Audit & Compliance', icon: FileText }
  ];

  // Event handlers
  const handleRefreshSystemHealth = useCallback(async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSystemHealth(prevHealth => prevHealth ? {
        ...prevHealth,
        cpu: Math.floor(Math.random() * 100),
        memory: Math.floor(Math.random() * 100),
        requests: Math.floor(Math.random() * 2000) + 1000
      } : null);
      logger.info('System health refreshed successfully');
    } catch (error) {
      logger.error('Failed to refresh system health', { error });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRestartService = useCallback(async (serviceId: string) => {
    logger.info('Service restart requested', { serviceId });
    // Implementation would go here
  }, []);

  const handleAddUser = useCallback(() => {
    logger.info('Add user modal requested');
    // Implementation would go here
  }, []);

  const handleEditUser = useCallback((user: User) => {
    logger.info('Edit user regional access requested', { userId: user.id });
    setSelectedUserId(user.id);
    setRegionAccessDrawerOpen(true);
  }, []);

  const handleDeleteUser = useCallback((userId: string) => {
    logger.info('Delete user requested', { userId });
    // Show confirmation dialog for user deletion
    const confirmed = window.confirm(
      `Are you sure you want to delete this user? This action cannot be undone and will remove all their access.`
    );
    
    if (confirmed) {
      logger.warn('User deletion confirmed but not implemented', { userId });
      alert(`User deletion confirmed but requires backend implementation. User ID: ${userId}`);
    }
  }, []);

  const handleAddRole = useCallback(() => {
    logger.info('Add role modal requested');
    // Implementation would go here
  }, []);

  const handleEditRole = useCallback((role: UserRole) => {
    logger.info('Edit role requested', { roleId: role.id });
    // Open inline edit modal instead of redirecting
    setSelectedRole(role);
    setIsEditingRole(true);
  }, []);

  const handleSaveRole = useCallback(async (updatedRole: UserRole) => {
    logger.info('Save role requested', { roleId: updatedRole.id });
    try {
      // TODO: Implement API call to save role
      // For now, just update local state
      setRoles(prevRoles => 
        prevRoles.map(role => 
          role.id === updatedRole.id ? updatedRole : role
        )
      );
      setIsEditingRole(false);
      setSelectedRole(null);
      logger.info('Role saved successfully', { roleId: updatedRole.id });
    } catch (error) {
      logger.error('Failed to save role', { error, roleId: updatedRole.id });
    }
  }, []);

  const handleCloseRoleModal = useCallback(() => {
    setIsEditingRole(false);
    setSelectedRole(null);
  }, []);

  const handleDeleteRole = useCallback((roleId: string) => {
    logger.info('Delete role requested', { roleId });
    // Show confirmation dialog for role deletion
    const confirmed = window.confirm(
      `Are you sure you want to delete this role? This action cannot be undone and will affect all users with this role.`
    );
    
    if (confirmed) {
      logger.warn('Role deletion confirmed but not implemented', { roleId });
      alert(`Role deletion confirmed but requires backend implementation. Role ID: ${roleId}`);
    }
  }, []);

  const handleAddApiKey = useCallback(() => {
    logger.info('Add API key modal requested');
    // Implementation would go here
  }, []);

  const handleEditApiKey = useCallback((key: ApiKey) => {
    logger.info('Edit API key requested', { keyId: key.id });
    // Implementation would go here
  }, []);

  const handleDeleteApiKey = useCallback((keyId: string) => {
    logger.info('Delete API key requested', { keyId });
    // Implementation would go here
  }, []);

  const handleCopyApiKey = useCallback(async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      logger.info('API key copied to clipboard');
    } catch (error) {
      logger.error('Failed to copy API key', { error });
    }
  }, []);

  const handleTestIntegration = useCallback((integrationId: string) => {
    logger.info('Test integration requested', { integrationId });
    // Implementation would go here
  }, []);

  const handleUpdateSecurityConfig = useCallback((config: SecurityConfig) => {
    logger.info('Security config updated', { config: Object.keys(config) });
    // Implementation would go here
  }, []);

  const handleAcknowledgeEvent = useCallback((eventId: string) => {
    logger.info('Security event acknowledged', { eventId });
    // Implementation would go here
  }, []);

  const handleRunSecurityScan = useCallback(() => {
    logger.info('Security scan initiated');
    // Implementation would go here
  }, []);

  const handleUpdateNotificationSetting = useCallback((setting: NotificationSetting) => {
    logger.info('Notification setting updated', { settingId: setting.id });
    // Implementation would go here
  }, []);

  const handleSendTestNotification = useCallback((type: 'email' | 'push' | 'sms') => {
    logger.info('Test notification sent', { type });
    // Implementation would go here
  }, []);

  const handleSaveTemplate = useCallback((template: NotificationTemplate) => {
    logger.info('Template saved', { templateId: template.id });
    // Implementation would go here
  }, []);

  const handleDeleteTemplate = useCallback((templateId: string) => {
    logger.info('Template deleted', { templateId });
    // Implementation would go here
  }, []);

  const handleExportAuditLogs = useCallback((format: 'csv' | 'json' | 'pdf', dateRange?: { start: Date; end: Date }) => {
    logger.info('Audit logs export requested', { format, dateRange });
    // Implementation would go here
  }, []);

  const handleDownloadExport = useCallback((exportId: string) => {
    logger.info('Export download requested', { exportId });
    // Implementation would go here
  }, []);

  const handleDeleteExport = useCallback((exportId: string) => {
    logger.info('Export deletion requested', { exportId });
    // Implementation would go here
  }, []);

  const handleViewLogDetails = useCallback((logId: string) => {
    logger.info('Log details requested', { logId });
    // Implementation would go here
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'system':
        return (
          <SystemHealthPanel
            systemHealth={systemHealth}
            systemServices={systemServices}
            loading={loading}
            onRefreshHealth={handleRefreshSystemHealth}
            onRestartService={handleRestartService}
          />
        );

      case 'users':
        return (
          <UserManagementPanel
            users={users}
            roles={roles}
            activeSubTab={activeUserSubTab}
            loading={loading}
            onSubTabChange={setActiveUserSubTab}
            onAddUser={handleAddUser}
            onEditUser={handleEditUser}
            onDeleteUser={handleDeleteUser}
            onAddRole={handleAddRole}
            onEditRole={handleEditRole}
            onDeleteRole={handleDeleteRole}
          />
        );

      case 'api':
        return (
          <APIManagementPanel
            apiKeys={apiKeys}
            integrations={integrations}
            activeSubTab={activeApiSubTab}
            onSubTabChange={setActiveApiSubTab}
            onAddApiKey={handleAddApiKey}
            onEditApiKey={handleEditApiKey}
            onDeleteApiKey={handleDeleteApiKey}
            onCopyApiKey={handleCopyApiKey}
            onTestIntegration={handleTestIntegration}
          />
        );

      case 'security':
        return (
          <SecurityPanel
            securityConfig={securityConfig}
            securityEvents={securityEvents}
            activeSubTab={activeSecuritySubTab}
            loading={loading}
            onSubTabChange={setActiveSecuritySubTab}
            onUpdateSecurityConfig={handleUpdateSecurityConfig}
            onAcknowledgeEvent={handleAcknowledgeEvent}
            onRunSecurityScan={handleRunSecurityScan}
          />
        );

      case 'monitoring':
        return (
          <div style={{
            padding: 'var(--xp-spacing-6)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--xp-spacing-6)'
          }}>
            <div>
              <h3 style={{
                fontSize: 'var(--xp-text-lg)',
                fontWeight: 'var(--xp-font-weight-semibold)',
                color: 'var(--xp-text-primary)',
                marginBottom: 'var(--xp-spacing-2)'
              }}>System Monitoring</h3>
              <p style={{
                fontSize: 'var(--xp-text-sm)',
                color: 'var(--xp-text-secondary)',
                marginBottom: 'var(--xp-spacing-6)'
              }}>Real-time metrics and performance monitoring</p>
            </div>
            
            {/* Performance Metrics */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 'var(--xp-spacing-6)',
              marginBottom: 'var(--xp-spacing-6)'
            }}>
              <div style={{
                backgroundColor: 'var(--xp-bg-elevated)',
                borderRadius: 'var(--xp-radius-lg)px',
                boxShadow: 'var(--xp-elevation-1)',
                border: `1px solid var(--xp-border-default)`,
                padding: 'var(--xp-spacing-6)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <p style={{
                      fontSize: 'var(--xp-text-sm)',
                      fontWeight: 'var(--xp-font-weight-medium)',
                      color: 'var(--xp-text-secondary)'
                    }}>CPU Usage</p>
                    <p style={{
                      fontSize: 'var(--xp-text-2xl)',
                      fontWeight: 'var(--xp-font-weight-bold)',
                      color: 'var(--xp-text-primary)'
                    }}>23%</p>
                  </div>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    backgroundColor: 'var(--xp-status-info-bg)',
                    borderRadius: 'var(--xp-radius-lg)px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Activity style={{
                      width: '24px',
                      height: '24px',
                      color: 'var(--xp-status-info)'
                    }} />
                  </div>
                </div>
                <div style={{
                  marginTop: 'var(--xp-spacing-4)',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: 'var(--xp-text-sm)'
                }}>
                  <span style={{ color: 'var(--xp-status-success)' }}>Normal</span>
                </div>
              </div>
              
              <div style={{
                backgroundColor: 'var(--xp-bg-elevated)',
                borderRadius: 'var(--xp-radius-lg)px',
                boxShadow: 'var(--xp-elevation-1)',
                border: `1px solid var(--xp-border-default)`,
                padding: 'var(--xp-spacing-6)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <p style={{
                      fontSize: 'var(--xp-text-sm)',
                      fontWeight: 'var(--xp-font-weight-medium)',
                      color: 'var(--xp-text-secondary)'
                    }}>Memory</p>
                    <p style={{
                      fontSize: 'var(--xp-text-2xl)',
                      fontWeight: 'var(--xp-font-weight-bold)',
                      color: 'var(--xp-text-primary)'
                    }}>67%</p>
                  </div>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    backgroundColor: 'var(--xp-status-warning-bg)',
                    borderRadius: 'var(--xp-radius-lg)px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Database style={{
                      width: '24px',
                      height: '24px',
                      color: 'var(--xp-status-warning)'
                    }} />
                  </div>
                </div>
                <div style={{
                  marginTop: 'var(--xp-spacing-4)',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: 'var(--xp-text-sm)'
                }}>
                  <span style={{ color: 'var(--xp-status-warning)' }}>Moderate</span>
                </div>
              </div>
              
              <div style={{
                backgroundColor: 'var(--xp-bg-elevated)',
                borderRadius: 'var(--xp-radius-lg)px',
                boxShadow: 'var(--xp-elevation-1)',
                border: `1px solid var(--xp-border-default)`,
                padding: 'var(--xp-spacing-6)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <p style={{
                      fontSize: 'var(--xp-text-sm)',
                      fontWeight: 'var(--xp-font-weight-medium)',
                      color: 'var(--xp-text-secondary)'
                    }}>Active Users</p>
                    <p style={{
                      fontSize: 'var(--xp-text-2xl)',
                      fontWeight: 'var(--xp-font-weight-bold)',
                      color: 'var(--xp-text-primary)'
                    }}>1,247</p>
                  </div>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    backgroundColor: 'var(--xp-status-success-bg)',
                    borderRadius: 'var(--xp-radius-lg)px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Users style={{
                      width: '24px',
                      height: '24px',
                      color: 'var(--xp-status-success)'
                    }} />
                  </div>
                </div>
                <div style={{
                  marginTop: 'var(--xp-spacing-4)',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: 'var(--xp-text-sm)'
                }}>
                  <span style={{ color: 'var(--xp-status-success)' }}>+12% vs yesterday</span>
                </div>
              </div>
              
              <div style={{
                backgroundColor: 'var(--xp-bg-elevated)',
                borderRadius: 'var(--xp-radius-lg)px',
                boxShadow: 'var(--xp-elevation-1)',
                border: `1px solid var(--xp-border-default)`,
                padding: 'var(--xp-spacing-6)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <p style={{
                      fontSize: 'var(--xp-text-sm)',
                      fontWeight: 'var(--xp-font-weight-medium)',
                      color: 'var(--xp-text-secondary)'
                    }}>Response Time</p>
                    <p style={{
                      fontSize: 'var(--xp-text-2xl)',
                      fontWeight: 'var(--xp-font-weight-bold)',
                      color: 'var(--xp-text-primary)'
                    }}>89ms</p>
                  </div>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    backgroundColor: 'var(--xp-status-success-bg)',
                    borderRadius: 'var(--xp-radius-lg)px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Activity style={{
                      width: '24px',
                      height: '24px',
                      color: 'var(--xp-status-success)'
                    }} />
                  </div>
                </div>
                <div style={{
                  marginTop: 'var(--xp-spacing-4)',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: 'var(--xp-text-sm)'
                }}>
                  <span style={{ color: 'var(--xp-status-success)' }}>Excellent</span>
                </div>
              </div>
            </div>
            
            {/* System Status */}
            <div style={{
              backgroundColor: 'var(--xp-bg-elevated)',
              borderRadius: 'var(--xp-radius-lg)px',
              boxShadow: 'var(--xp-elevation-1)',
              border: `1px solid var(--xp-border-default)`,
              padding: 'var(--xp-spacing-6)'
            }}>
              <h4 style={{
                fontWeight: 'var(--xp-font-weight-medium)',
                color: 'var(--xp-text-primary)',
                marginBottom: 'var(--xp-spacing-4)'
              }}>Service Status</h4>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--xp-spacing-3)'
              }}>
                <div>
                  <button 
                    onClick={() => setExpandedService(expandedService === 'api' ? null : 'api')}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 'var(--xp-spacing-3)',
                      backgroundColor: 'var(--xp-status-success-bg)',
                      borderRadius: 'var(--xp-radius-lg)px',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'background-color 200ms ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--xp-bg-elevated)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--xp-status-success-bg)';
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--xp-spacing-3)'
                    }}>
                      <div style={{
                        width: '12px',
                        height: '12px',
                        backgroundColor: 'var(--xp-status-success)',
                        borderRadius: '50%'
                      }}></div>
                      <span style={{
                        fontWeight: 'var(--xp-font-weight-medium)',
                        color: 'var(--xp-text-primary)'
                      }}>API Server</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--xp-spacing-2)'
                    }}>
                      <span style={{
                        fontSize: 'var(--xp-text-sm)',
                        color: 'var(--xp-status-success)',
                        backgroundColor: 'var(--xp-status-success-bg)',
                        padding: 'var(--xp-spacing-1) var(--xp-spacing-2)',
                        borderRadius: 'var(--xp-radius-md)px'
                      }}>Online</span>
                      <span style={{
                        color: 'var(--xp-text-tertiary)',
                        fontSize: 'var(--xp-text-sm)'
                      }}>View logs →</span>
                    </div>
                  </button>
                  {expandedService === 'api' && (
                    <div style={{
                      marginTop: 'var(--xp-spacing-2)',
                      padding: 'var(--xp-spacing-4)',
                      backgroundColor: 'var(--xp-bg-page)',
                      borderRadius: 'var(--xp-radius-lg)px',
                      borderLeft: `4px solid var(--xp-status-success)`
                    }}>
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--xp-spacing-2)',
                        fontSize: 'var(--xp-text-sm)'
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between'
                        }}>
                          <span style={{ color: 'var(--xp-text-secondary)' }}>Uptime:</span>
                          <span style={{ fontWeight: 'var(--xp-font-weight-medium)' }}>99.9% (24h)</span>
                        </div>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between'
                        }}>
                          <span style={{ color: 'var(--xp-text-secondary)' }}>Requests/min:</span>
                          <span style={{ fontWeight: 'var(--xp-font-weight-medium)' }}>1,247</span>
                        </div>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between'
                        }}>
                          <span style={{ color: 'var(--xp-text-secondary)' }}>Error rate:</span>
                          <span style={{
                            fontWeight: 'var(--xp-font-weight-medium)',
                            color: 'var(--xp-status-success)'
                          }}>0.03%</span>
                        </div>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between'
                        }}>
                          <span style={{ color: 'var(--xp-text-secondary)' }}>Last restart:</span>
                          <span style={{ fontWeight: 'var(--xp-font-weight-medium)' }}>2 hours ago</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div>
                  <button 
                    onClick={() => setExpandedService(expandedService === 'database' ? null : 'database')}
                    className="w-full flex items-center justify-between p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-medium text-gray-900">Database</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded">Connected</span>
                      <span className="text-gray-400 group-hover:text-gray-600 text-sm">View metrics →</span>
                    </div>
                  </button>
                  {expandedService === 'database' && (
                    <div className="mt-2 p-4 bg-gray-50 rounded-lg border-l-4 border-green-500">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Connections:</span>
                          <span className="font-medium">23/100</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Queries/sec:</span>
                          <span className="font-medium">156</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Storage used:</span>
                          <span className="font-medium">2.3GB / 10GB</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Avg query time:</span>
                          <span className="font-medium text-green-600">12ms</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div>
                  <button 
                    onClick={() => setExpandedService(expandedService === 'websocket' ? null : 'websocket')}
                    className="w-full flex items-center justify-between p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-medium text-gray-900">WebSocket</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded">Active</span>
                      <span className="text-gray-400 group-hover:text-gray-600 text-sm">View connections →</span>
                    </div>
                  </button>
                  {expandedService === 'websocket' && (
                    <div className="mt-2 p-4 bg-gray-50 rounded-lg border-l-4 border-green-500">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Active connections:</span>
                          <span className="font-medium">892</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Messages/min:</span>
                          <span className="font-medium">3,451</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Data transferred:</span>
                          <span className="font-medium">45.2MB</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Avg latency:</span>
                          <span className="font-medium text-green-600">23ms</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div>
                  <button 
                    onClick={() => setExpandedService(expandedService === 'jobs' ? null : 'jobs')}
                    className="w-full flex items-center justify-between p-3 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="font-medium text-gray-900">Background Jobs</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-yellow-600 bg-yellow-100 px-2 py-1 rounded">Delayed</span>
                      <span className="text-gray-400 group-hover:text-gray-600 text-sm">View queue →</span>
                    </div>
                  </button>
                  {expandedService === 'jobs' && (
                    <div className="mt-2 p-4 bg-gray-50 rounded-lg border-l-4 border-yellow-500">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Queue size:</span>
                          <span className="font-medium text-yellow-600">47 pending</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Failed jobs:</span>
                          <span className="font-medium text-red-600">3</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Processed today:</span>
                          <span className="font-medium">1,892</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Avg processing time:</span>
                          <span className="font-medium">2.3s</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <NotificationsPanel
            notificationSettings={notificationSettings}
            templates={templates}
            activeSubTab={activeNotificationsSubTab}
            loading={loading}
            onSubTabChange={setActiveNotificationsSubTab}
            onUpdateNotificationSetting={handleUpdateNotificationSetting}
            onSendTestNotification={handleSendTestNotification}
            onSaveTemplate={handleSaveTemplate}
            onDeleteTemplate={handleDeleteTemplate}
          />
        );

      case 'audit':
        return (
          <AuditPanel
            auditLogs={auditLogs}
            auditExports={auditExports}
            activeSubTab={activeAuditSubTab}
            loading={loading}
            onSubTabChange={setActiveAuditSubTab}
            onExportAuditLogs={handleExportAuditLogs}
            onDownloadExport={handleDownloadExport}
            onDeleteExport={handleDeleteExport}
            onViewLogDetails={handleViewLogDetails}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--xp-bg-page)',
      fontFamily: 'var(--xp-font-family-base)'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: 'var(--xp-spacing-4)'
      }}>

        {/* Admin Header */}
        <header style={{
          marginBottom: 'var(--xp-spacing-6)',
          paddingBottom: 'var(--xp-spacing-4)',
          borderBottom: `1px solid var(--xp-border-default)`
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <h1 style={{
                fontSize: 'var(--xp-text-2xl)',
                fontWeight: 'var(--xp-font-weight-bold)',
                color: 'var(--xp-text-primary)',
                marginBottom: 'var(--xp-spacing-2)'
              }}>
                System Administration
              </h1>
              <p style={{
                color: 'var(--xp-text-secondary)',
                fontSize: 'var(--xp-text-base)'
              }}>
                Manage users, roles, security, and system configuration
              </p>
            </div>
          </div>
        </header>

        {/* Admin Navigation Tabs */}
        <nav style={{
          marginBottom: 'var(--xp-spacing-6)',
          padding: 'var(--xp-spacing-2) 0'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--xp-spacing-1)',
            overflowX: 'auto',
            paddingBottom: 'var(--xp-spacing-2)'
          }}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--xp-spacing-2)',
                    padding: `var(--xp-spacing-3) var(--xp-spacing-4)`,
                    height: '48px',
                    borderRadius: 'var(--xp-radius-lg)px',
                    fontSize: 'var(--xp-text-sm)',
                    fontWeight: 'var(--xp-font-weight-medium)',
                    whiteSpace: 'nowrap',
                    transition: 'all 200ms ease',
                    backgroundColor: isActive ? 'var(--xp-button-primary-bg)' : 'transparent',
                    color: isActive ? 'var(--xp-button-primary-text)' : 'var(--xp-text-secondary)',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: isActive ? 'var(--xp-elevation-2)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'var(--xp-bg-elevated)';
                      e.currentTarget.style.color = 'var(--xp-text-primary)';
                      e.currentTarget.style.boxShadow = 'var(--xp-elevation-1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'var(--xp-text-secondary)';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  <Icon style={{
                    width: '16px',
                    height: '16px'
                  }} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Admin Content Panel */}
        <div style={{
          backgroundColor: 'var(--xp-bg-card)',
          borderRadius: 'var(--xp-radius-lg)px',
          boxShadow: 'var(--xp-elevation-2)',
          border: `1px solid var(--xp-border-default)`
        }}>
          {renderTabContent()}
        </div>
      </div>

      {/* Role Edit Modal */}
      <RoleEditModal
        isOpen={isEditingRole}
        role={selectedRole}
        onClose={handleCloseRoleModal}
        onSave={handleSaveRole}
      />

      {/* Regional Access Drawer */}
      {selectedUserId && (
        <RegionAccessDrawer
          userId={selectedUserId}
          open={regionAccessDrawerOpen}
          onClose={() => {
            setRegionAccessDrawerOpen(false);
            setSelectedUserId(null);
          }}
          canEdit={true}
        />
      )}
    </div>
  );
};

export default SettingsPage;