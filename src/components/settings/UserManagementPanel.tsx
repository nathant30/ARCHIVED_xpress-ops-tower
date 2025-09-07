'use client';

import React, { memo, useState } from 'react';
import { 
  Users, 
  Plus, 
  Edit3, 
  Trash2, 
  Shield, 
  Mail,
  Clock,
  CheckCircle,
  X,
  ExternalLink
} from 'lucide-react';

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

interface UserManagementPanelProps {
  users: User[];
  roles: UserRole[];
  activeSubTab: string;
  loading: boolean;
  onSubTabChange: (tab: string) => void;
  onAddUser: () => void;
  onEditUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onAddRole: () => void;
  onEditRole: (role: UserRole) => void;
  onDeleteRole: (roleId: string) => void;
}

const UserManagementPanel = memo<UserManagementPanelProps>(({
  users,
  roles,
  activeSubTab,
  loading,
  onSubTabChange,
  onAddUser,
  onEditUser,
  onDeleteUser,
  onAddRole,
  onEditRole,
  onDeleteRole
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const subTabs = [
    { id: 'users', label: 'Users', icon: Users },
    { id: 'roles', label: 'Roles', icon: Shield },
    { id: 'sso', label: 'Single Sign-On', icon: CheckCircle }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderUsersTab = () => (
    <div className="space-y-4">
      {/* Header with search and add button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          />
        </div>
        <button 
          onClick={onAddUser}
          className="flex items-center px-4 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-200 text-sm font-medium shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </button>
      </div>

      {/* Users list */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="divide-y divide-gray-200">
          {filteredUsers.map((user) => (
            <div key={user.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-medium text-gray-600">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(user.status)}`}>
                        {user.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-medium text-gray-900">{user.role}</div>
                    <div className="text-sm text-gray-600">{user.lastLogin ? user.lastLogin.toLocaleDateString() : 'Never'}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => onEditUser(user)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="Edit user"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onDeleteUser(user.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                      title="Delete user"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderRolesTab = () => (
    <div className="space-y-4">
      {/* Header with search and add button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search roles..."
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          />
        </div>
        <button 
          onClick={onAddRole}
          className="flex items-center px-4 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-200 text-sm font-medium shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Role
        </button>
      </div>

      {/* Roles list */}
      {roles.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-900 mb-2">No roles found</h3>
          <p className="text-sm text-gray-600 mb-4">Get started by creating a new role with specific permissions.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="divide-y divide-gray-200">
            {roles.map((role) => (
              <div key={role.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <Shield className="w-5 h-5 text-gray-400" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{role.name}</p>
                        <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                          {role.userCount} users
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{role.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-medium text-gray-900">{role.permissions.length} permissions</div>
                      <div className="text-sm text-gray-600">Level {(role as any).level || 'N/A'}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => onEditRole(role)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="Edit role"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onDeleteRole(role.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                        title="Delete role"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderSSOTab = () => (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900">Single Sign-On Configuration</h3>
      
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="divide-y divide-gray-200">
          <div className="p-4 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">Google SSO</p>
                  <p className="text-sm text-gray-600">Allow users to sign in with Google</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded text-sm font-medium bg-green-100 text-green-800">
                Enabled
              </span>
            </div>
          </div>
          
          <div className="p-4 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <X className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">Microsoft AD</p>
                  <p className="text-sm text-gray-600">Active Directory integration</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded text-sm font-medium bg-gray-100 text-gray-600">
                Disabled
              </span>
            </div>
          </div>
          
          <div className="p-4 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-gray-900">SAML 2.0</p>
                  <p className="text-sm text-gray-600">Enterprise SAML integration</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded text-sm font-medium bg-yellow-100 text-yellow-800">
                Configured
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header with icon and description */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
            <p className="text-sm text-gray-600 mt-1">Manage users, roles, and authentication settings</p>
          </div>
        </div>
      </div>

      {/* Sub-tabs */}
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

        {/* Tab Content */}
        <div className="p-4">
          {activeSubTab === 'users' && renderUsersTab()}
          {activeSubTab === 'roles' && renderRolesTab()}
          {activeSubTab === 'sso' && renderSSOTab()}
        </div>
      </div>
    </div>
  );
});

UserManagementPanel.displayName = 'UserManagementPanel';

export default UserManagementPanel;