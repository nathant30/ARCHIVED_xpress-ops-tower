'use client';

import React, { memo } from 'react';
import { 
  Activity, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Database,
  Monitor,
  TrendingUp
} from 'lucide-react';

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

interface SystemHealthPanelProps {
  systemHealth: SystemHealthMetrics | null;
  systemServices: SystemService[];
  loading: boolean;
  onRefreshHealth: () => void;
  onRestartService: (serviceId: string) => void;
}

const SystemHealthPanel = memo<SystemHealthPanelProps>(({
  systemHealth,
  systemServices,
  loading,
  onRefreshHealth,
  onRestartService
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600';
      case 'offline': return 'text-red-600';
      case 'degraded': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-50 border-green-200';
      case 'offline': return 'bg-red-50 border-red-200';
      case 'degraded': return 'bg-yellow-50 border-yellow-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getMetricColor = (value: number, threshold: number = 80) => {
    if (value >= threshold) return 'text-red-600';
    if (value >= threshold * 0.7) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2">Loading system health...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#EB1D25] rounded-lg flex items-center justify-center">
            <Monitor className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">System Health</h2>
            <p className="text-sm text-gray-600 mt-1">Monitor system performance and service status</p>
          </div>
        </div>
        <button
          onClick={onRefreshHealth}
          disabled={loading}
          className="flex items-center px-4 py-2.5 text-sm font-medium bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Status
        </button>
      </div>

      {/* System Metrics */}
      {systemHealth && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200 p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">CPU Usage</p>
                <p className={`text-2xl font-semibold ${getMetricColor(systemHealth.cpu)}`}>{systemHealth.cpu}%</p>
              </div>
              <Activity className="w-5 h-5 text-gray-400" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200 p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Memory Usage</p>
                <p className={`text-2xl font-semibold ${getMetricColor(systemHealth.memory)}`}>{systemHealth.memory}%</p>
              </div>
              <Database className="w-5 h-5 text-gray-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200 p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Disk Usage</p>
                <p className={`text-2xl font-semibold ${getMetricColor(systemHealth.disk)}`}>{systemHealth.disk}%</p>
              </div>
              <Database className="w-5 h-5 text-gray-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200 p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Requests</p>
                <p className="text-2xl font-semibold text-gray-900">{systemHealth.requests.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        </div>
      )}

      {/* System Services */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">System Services</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {systemServices.map((service) => (
            <div key={service.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  {service.status === 'online' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : service.status === 'degraded' ? (
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900">{service.name}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <p className="text-sm text-gray-600">
                        {service.uptime}% uptime
                      </p>
                      <p className="text-sm text-gray-600">
                        {service.responseTime}ms response
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                    service.status === 'online' 
                      ? 'bg-green-100 text-green-800' 
                      : service.status === 'degraded'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {service.status}
                  </span>
                  
                  {service.status !== 'online' && (
                    <button
                      onClick={() => onRestartService(service.id)}
                      className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50"
                    >
                      Restart
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

SystemHealthPanel.displayName = 'SystemHealthPanel';

export default SystemHealthPanel;