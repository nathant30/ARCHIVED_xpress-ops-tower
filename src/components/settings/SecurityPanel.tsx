'use client';

import React, { memo, useState } from 'react';
import { 
  Shield, 
  Key, 
  Lock, 
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  Settings,
  Users,
  Activity
} from 'lucide-react';

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

interface SecurityPanelProps {
  securityConfig: SecurityConfig;
  securityEvents: SecurityEvent[];
  activeSubTab: string;
  loading: boolean;
  onSubTabChange: (tab: string) => void;
  onUpdateSecurityConfig: (config: SecurityConfig) => void;
  onAcknowledgeEvent: (eventId: string) => void;
  onRunSecurityScan: () => void;
}

const SecurityPanel = memo<SecurityPanelProps>(({
  securityConfig,
  securityEvents,
  activeSubTab,
  loading,
  onSubTabChange,
  onUpdateSecurityConfig,
  onAcknowledgeEvent,
  onRunSecurityScan
}) => {
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [localConfig, setLocalConfig] = useState<SecurityConfig>(securityConfig);

  const subTabs = [
    { id: 'settings', label: 'Security Settings', icon: Settings },
    { id: 'events', label: 'Security Events', icon: Activity },
    { id: 'permissions', label: 'Permissions', icon: Users }
  ];


  const handleConfigChange = (key: keyof SecurityConfig, value: any) => {
    const updatedConfig = { ...localConfig, [key]: value };
    setLocalConfig(updatedConfig);
    onUpdateSecurityConfig(updatedConfig);
  };

  const renderSecuritySettings = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Authentication & Access</h3>
          <p className="text-sm text-gray-600">Configure login and access security</p>
        </div>
        <button
          onClick={onRunSecurityScan}
          className="flex items-center px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          <Shield className="w-4 h-4 mr-2" />
          Security Scan
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="divide-y divide-gray-200">
          <div className="p-4 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
                <p className="text-sm text-gray-600">Require 2FA for all user accounts</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localConfig.twoFactorEnabled}
                  onChange={(e) => handleConfigChange('twoFactorEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Timeout (minutes)
                </label>
                <input
                  type="number"
                  value={localConfig.sessionTimeout}
                  onChange={(e) => handleConfigChange('sessionTimeout', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="5"
                  max="480"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Failed Login Attempt Limit
                </label>
                <input
                  type="number"
                  value={localConfig.loginAttemptLimit}
                  onChange={(e) => handleConfigChange('loginAttemptLimit', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="3"
                  max="10"
                />
              </div>
            </div>
          </div>

          <div className="p-4 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Advanced Security Settings</h4>
                <p className="text-sm text-gray-600">Additional security configurations</p>
              </div>
              <button
                onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                {showAdvancedSettings ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {showAdvancedSettings && (
            <div className="p-4 bg-gray-50">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">IP Whitelist Protection</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localConfig.ipWhitelistEnabled}
                      onChange={(e) => handleConfigChange('ipWhitelistEnabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Enhanced Audit Logging</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localConfig.auditLoggingEnabled}
                      onChange={(e) => handleConfigChange('auditLoggingEnabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderSecurityEvents = () => (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-gray-900">Recent Security Events</h3>
        <p className="text-sm text-gray-600">Monitor and respond to security incidents</p>
      </div>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-600" />
          <span className="text-sm font-medium text-yellow-800">
            {securityEvents.filter(e => e.severity === 'high').length} high priority events require attention
          </span>
        </div>
      </div>

      {/* Security Events list */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="divide-y divide-gray-200">
          {securityEvents.map((event) => (
            <div key={event.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <AlertTriangle className={`w-5 h-5 ${
                    event.severity === 'high' ? 'text-red-600' : 
                    event.severity === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                  }`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{event.description}</p>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        event.severity === 'high' ? 'bg-red-100 text-red-800' : 
                        event.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {event.severity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {event.user} • {event.ipAddress} • {event.timestamp.toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-medium text-gray-900 capitalize">{event.type.replace('_', ' ')}</div>
                    <div className="text-sm text-gray-600">{event.timestamp.toLocaleDateString()}</div>
                  </div>
                  <button
                    onClick={() => onAcknowledgeEvent(event.id)}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Acknowledge
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPermissions = () => (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-gray-900">Permission Overview</h3>
        <p className="text-sm text-gray-600">Quick view of system permissions and user roles</p>
      </div>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600" />
          <div>
            <p className="text-sm font-medium text-yellow-800 mb-1">
              Advanced permission management is available in the User Management section.
            </p>
            <p className="text-xs text-yellow-700">
              Navigate to User Management → Roles for detailed permission configuration.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Quick Permission Overview</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200 p-4 text-center">
            <Shield className="w-8 h-8 text-green-600 mx-auto mb-3" />
            <div className="text-2xl font-bold text-gray-900 mb-1">12</div>
            <div className="text-sm font-medium text-gray-700">Admin Users</div>
            <div className="text-xs text-gray-600 mt-1">Full system access</div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200 p-4 text-center">
            <Users className="w-8 h-8 text-blue-600 mx-auto mb-3" />
            <div className="text-2xl font-bold text-gray-900 mb-1">47</div>
            <div className="text-sm font-medium text-gray-700">Standard Users</div>
            <div className="text-xs text-gray-600 mt-1">Regular operations</div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200 p-4 text-center">
            <Eye className="w-8 h-8 text-purple-600 mx-auto mb-3" />
            <div className="text-2xl font-bold text-gray-900 mb-1">8</div>
            <div className="text-sm font-medium text-gray-700">View-Only Users</div>
            <div className="text-xs text-gray-600 mt-1">Read-only access</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          {subTabs.map((tab) => {
            const isActive = activeSubTab === tab.id;
            const Icon = tab.icon;
            
            return (
              <button
                key={tab.id}
                onClick={() => onSubTabChange(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:bg-blue-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4">
        {activeSubTab === 'settings' && renderSecuritySettings()}
        {activeSubTab === 'events' && renderSecurityEvents()}
        {activeSubTab === 'permissions' && renderPermissions()}
      </div>
    </div>
  );
});

SecurityPanel.displayName = 'SecurityPanel';

export default SecurityPanel;