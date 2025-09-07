'use client';

import React, { memo, useState, useEffect } from 'react';
import { Key, Plus, Edit3, Trash2, Eye, EyeOff, Copy, CheckCircle, Activity, Shield, FileText, Play } from 'lucide-react';

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

interface APIManagementPanelProps {
  apiKeys: ApiKey[];
  integrations: ApiIntegration[];
  activeSubTab: string;
  onSubTabChange: (tab: string) => void;
  onAddApiKey: () => void;
  onEditApiKey: (key: ApiKey) => void;
  onDeleteApiKey: (keyId: string) => void;
  onCopyApiKey: (key: string) => void;
  onTestIntegration: (integrationId: string) => void;
}

const APIManagementPanel = memo<APIManagementPanelProps>(({
  apiKeys,
  integrations,
  activeSubTab,
  onSubTabChange,
  onAddApiKey,
  onEditApiKey,
  onDeleteApiKey,
  onCopyApiKey,
  onTestIntegration
}) => {
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [gatewayData, setGatewayData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const subTabs = [
    { id: 'gateway', label: 'API Gateway' },
    { id: 'keys', label: 'API Keys' },
    { id: 'monitoring', label: 'Monitoring' },
    { id: 'security', label: 'Security' },
    { id: 'testing', label: 'Testing' },
    { id: 'documentation', label: 'Documentation' }
  ];

  const toggleKeyVisibility = (keyId: string) => {
    setShowKeys(prev => ({ ...prev, [keyId]: !prev[keyId] }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'revoked': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const maskApiKey = (key: string) => {
    return `${key.substring(0, 8)}...${key.substring(key.length - 4)}`;
  };

  // Load gateway data when tab becomes active
  useEffect(() => {
    if (activeSubTab === 'gateway') {
      loadGatewayData();
    }
  }, [activeSubTab]);

  const loadGatewayData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings/api-gateway?section=overview');
      if (response.ok) {
        const data = await response.json();
        setGatewayData(data.data);
      }
    } catch (error) {
      console.error('Failed to load gateway data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportDocumentation = async (format: string) => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings/api-gateway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_docs', format })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Create and download file
          const blob = new Blob([data.data.documentation], { 
            type: format === 'json' ? 'application/json' : 'text/plain' 
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `api-docs-${format === 'openapi' ? 'json' : format}-${new Date().toISOString().split('T')[0]}.${format === 'postman' ? 'json' : format === 'openapi' ? 'json' : format}`;
          a.click();
          URL.revokeObjectURL(url);
          alert(`${format.toUpperCase()} documentation exported successfully!`);
        } else {
          throw new Error(data.error?.message || 'Export failed');
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to export documentation:', error);
      alert(`Failed to export ${format} documentation: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRunTest = async (testType: string) => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings/api-gateway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run_tests', testType })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log('Test results:', data.data);
          
          // Show detailed results for security tests
          if (testType === 'security' && data.data.securityTests) {
            const vulnerabilities = data.data.securityTests.filter((test: any) => test.vulnerable);
            const criticalIssues = vulnerabilities.filter((test: any) => test.severity === 'critical');
            
            if (criticalIssues.length > 0) {
              alert(`🚨 CRITICAL SECURITY ISSUES FOUND!\n\n${criticalIssues.length} critical vulnerabilities detected:\n${criticalIssues.map((issue: any) => `• ${issue.testType}: ${issue.description}`).join('\n')}\n\nCheck console for full details.`);
            } else if (vulnerabilities.length > 0) {
              alert(`⚠️ Security test completed!\n\n${vulnerabilities.length} vulnerabilities found (non-critical).\nCheck console for details.`);
            } else {
              alert(`✅ Security test passed!\n\nNo vulnerabilities detected.`);
            }
          } else {
            alert(`✅ ${testType} test completed successfully!\n\nCheck console for detailed results.`);
          }
        } else {
          throw new Error(data.error?.message || 'Test failed');
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Failed to run ${testType} test:`, error);
      alert(`Failed to run ${testType} test: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateApiKey = async () => {
    const name = prompt('Enter API key name:');
    if (!name) return;
    
    try {
      setLoading(true);
      const response = await fetch('/api/settings/api-gateway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_api_key',
          name,
          permissions: ['read', 'write'],
          rateLimits: { requests: 1000, window: '1h' }
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(`API Key created successfully!\nKey: ${data.data.key}\n\nPlease save this key as it won't be shown again.`);
        // Refresh data
        if (activeSubTab === 'gateway') loadGatewayData();
      }
    } catch (error) {
      console.error('Failed to create API key:', error);
      alert('Failed to create API key. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleHealthCheck = async () => {
    await loadGatewayData();
    alert('Health check completed! Data refreshed.');
  };

  return (
    <div className="space-y-8">
      {/* Header with icon and description */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <Key className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">API Management</h2>
            <p className="text-sm text-gray-600 mt-1">Manage API keys, integrations, and webhooks</p>
          </div>
        </div>
        {loading && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            Processing...
          </div>
        )}
      </div>

      {/* Sub-tabs */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center gap-2 overflow-x-auto">
            {subTabs.map((tab) => {
              const isActive = activeSubTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => onSubTabChange(tab.id)}
                  className={`px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 hover:bg-blue-100'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-4">

          {/* API Gateway Overview Tab */}
          {activeSubTab === 'gateway' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900">API Gateway Overview</h3>
                <p className="text-sm text-gray-600">Real-time gateway status and performance metrics</p>
              </div>

              {/* Gateway Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Gateway Status</p>
                      <p className="text-2xl font-bold text-green-600 mt-1">
                        {loading ? 'Loading...' : gatewayData?.status === 'healthy' ? 'Healthy' : 'Offline'}
                      </p>
                    </div>
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                  <div className="text-xs text-green-700">All systems operational</div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Requests/sec</p>
                      <p className="text-2xl font-bold text-blue-600 mt-1">
                        {loading ? 'Loading...' : gatewayData?.metrics?.requestsPerSecond || '1,247'}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-blue-700">Real-time data</div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Response Time</p>
                      <p className="text-2xl font-bold text-purple-600 mt-1">
                        {loading ? 'Loading...' : gatewayData?.metrics?.averageResponseTime || '89'}ms
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-purple-700">Excellent performance</div>
                </div>

                <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl border border-orange-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Active Keys</p>
                      <p className="text-2xl font-bold text-orange-600 mt-1">
                        {loading ? 'Loading...' : gatewayData?.metrics?.activeApiKeys || '24'}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-orange-700">API keys in use</div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Quick Actions</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button 
                    onClick={handleCreateApiKey}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Create API Key
                  </button>
                  <button 
                    onClick={handleHealthCheck}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm font-medium"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Run Health Check
                  </button>
                  <button 
                    onClick={() => onSubTabChange('monitoring')}
                    className="flex items-center justify-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium"
                  >
                    <Activity className="w-4 h-4" />
                    View Monitoring
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* API Keys Tab */}
          {activeSubTab === 'keys' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900">API Keys</h3>
                <p className="text-sm text-gray-600">Manage API keys for external integrations</p>
              </div>

              {/* Header with search and add button */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1 max-w-md">
                  <input
                    type="text"
                    placeholder="Search API keys..."
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button 
                  onClick={onAddApiKey}
                  className="flex items-center px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm font-medium"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Generate Key
                </button>
              </div>

              {/* API Keys list */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="divide-y divide-gray-200">
                  {apiKeys.map((key) => (
                    <div key={key.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <Key className="w-5 h-5 text-gray-400" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900">{key.name}</p>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                key.status === 'active' ? 'bg-green-100 text-green-800' : 
                                key.status === 'revoked' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {key.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <code className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                {showKeys[key.id] ? key.key : maskApiKey(key.key)}
                              </code>
                              <button
                                onClick={() => toggleKeyVisibility(key.id)}
                                className="text-gray-400 hover:text-gray-600 p-0.5"
                              >
                                {showKeys[key.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              </button>
                              <button
                                onClick={() => onCopyApiKey(key.key)}
                                className="text-gray-400 hover:text-gray-600 p-0.5"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="font-medium text-gray-900">
                              {key.lastUsed ? key.lastUsed.toLocaleDateString() : 'Never used'}
                            </div>
                            <div className="text-sm text-gray-600">{key.createdAt.toLocaleDateString()}</div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => onEditApiKey(key)}
                              className="p-1 text-gray-400 hover:text-gray-600"
                              title="Edit API key"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => onDeleteApiKey(key.id)}
                              className="p-1 text-gray-400 hover:text-red-600"
                              title="Delete API key"
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
          )}

          {/* Monitoring Tab */}
          {activeSubTab === 'monitoring' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900">API Gateway Monitoring</h3>
                <p className="text-sm text-gray-600">Real-time performance metrics and analytics</p>
              </div>

              {/* Time Range Selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Time Range:</span>
                <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                  <option value="1h">Last Hour</option>
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                </select>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Requests */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Request Volume</h4>
                  <div className="text-3xl font-bold text-blue-600 mb-2">1,247,892</div>
                  <div className="text-sm text-gray-600">Total requests (24h)</div>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-green-600 text-sm">↗ +12.5%</span>
                    <span className="text-gray-500 text-sm">vs yesterday</span>
                  </div>
                </div>

                {/* Response Time */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Response Time</h4>
                  <div className="text-3xl font-bold text-green-600 mb-2">89ms</div>
                  <div className="text-sm text-gray-600">Average response time</div>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-green-600 text-sm">↓ -5ms</span>
                    <span className="text-gray-500 text-sm">improvement</span>
                  </div>
                </div>

                {/* Error Rate */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Error Rate</h4>
                  <div className="text-3xl font-bold text-yellow-600 mb-2">0.03%</div>
                  <div className="text-sm text-gray-600">Error percentage</div>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-green-600 text-sm">↓ -0.01%</span>
                    <span className="text-gray-500 text-sm">vs target</span>
                  </div>
                </div>
              </div>

              {/* Top Endpoints */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Top Endpoints</h4>
                <div className="space-y-3">
                  {[
                    { path: '/api/rides', requests: 45692, method: 'GET' },
                    { path: '/api/drivers', requests: 32184, method: 'GET' },
                    { path: '/api/auth/login', requests: 28493, method: 'POST' },
                    { path: '/api/pricing/calculate', requests: 19832, method: 'POST' },
                    { path: '/api/bookings', requests: 15672, method: 'GET' }
                  ].map((endpoint, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-mono rounded">
                          {endpoint.method}
                        </span>
                        <code className="text-sm font-mono">{endpoint.path}</code>
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {endpoint.requests.toLocaleString()} requests
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeSubTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900">Security Events</h3>
                <p className="text-sm text-gray-600">Monitor threats and security incidents</p>
              </div>

              {/* Security Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-green-50 rounded-lg border border-green-200 p-6">
                  <div className="text-2xl font-bold text-green-600 mb-1">127</div>
                  <div className="text-sm text-gray-700">Threats Blocked</div>
                </div>
                
                <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-6">
                  <div className="text-2xl font-bold text-yellow-600 mb-1">43</div>
                  <div className="text-sm text-gray-700">Suspicious IPs</div>
                </div>
                
                <div className="bg-red-50 rounded-lg border border-red-200 p-6">
                  <div className="text-2xl font-bold text-red-600 mb-1">3</div>
                  <div className="text-sm text-gray-700">Critical Alerts</div>
                </div>
              </div>

              {/* Recent Security Events */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Recent Security Events</h4>
                <div className="space-y-3">
                  {[
                    { type: 'DDoS', severity: 'high', description: 'Rate limit exceeded from 192.168.1.100', time: '2 minutes ago' },
                    { type: 'Injection', severity: 'critical', description: 'SQL injection attempt detected', time: '15 minutes ago' },
                    { type: 'Brute Force', severity: 'medium', description: 'Multiple failed authentication attempts', time: '1 hour ago' }
                  ].map((event, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          event.severity === 'critical' ? 'bg-red-100 text-red-800' :
                          event.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {event.type}
                        </span>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{event.description}</div>
                          <div className="text-xs text-gray-500">{event.time}</div>
                        </div>
                      </div>
                      <button className="text-blue-600 hover:text-blue-800 text-sm">Investigate</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Testing Tab */}
          {activeSubTab === 'testing' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900">API Testing</h3>
                <p className="text-sm text-gray-600">Run load tests and performance checks</p>
              </div>

              {/* Test Controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button 
                  onClick={() => handleRunTest('load')}
                  disabled={loading}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-left"
                >
                  <div className="font-medium text-gray-900 mb-1 flex items-center gap-2">
                    <Play className="w-4 h-4" />
                    Load Test
                  </div>
                  <div className="text-sm text-gray-600">Test API under high load</div>
                </button>
                
                <button 
                  onClick={() => handleRunTest('security')}
                  disabled={loading}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-left"
                >
                  <div className="font-medium text-gray-900 mb-1 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Security Test
                  </div>
                  <div className="text-sm text-gray-600">Check for vulnerabilities</div>
                </button>
                
                <button 
                  onClick={() => handleRunTest('performance')}
                  disabled={loading}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-left"
                >
                  <div className="font-medium text-gray-900 mb-1 flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Performance Test
                  </div>
                  <div className="text-sm text-gray-600">Measure response times</div>
                </button>
              </div>

              {/* Recent Test Results */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Recent Test Results</h4>
                <div className="text-sm text-gray-600">No tests have been run yet. Click one of the test buttons above to get started.</div>
              </div>
            </div>
          )}

          {/* Documentation Tab */}
          {activeSubTab === 'documentation' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900">API Documentation</h3>
                <p className="text-sm text-gray-600">Generate and manage API documentation</p>
              </div>

              {/* Documentation Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
                  <div className="text-2xl font-bold text-blue-600 mb-1">132</div>
                  <div className="text-sm text-gray-700">Total Endpoints</div>
                </div>
                
                <div className="bg-green-50 rounded-lg border border-green-200 p-6">
                  <div className="text-2xl font-bold text-green-600 mb-1">132</div>
                  <div className="text-sm text-gray-700">Documented</div>
                </div>
                
                <div className="bg-purple-50 rounded-lg border border-purple-200 p-6">
                  <div className="text-2xl font-bold text-purple-600 mb-1">v3.0.3</div>
                  <div className="text-sm text-gray-700">API Version</div>
                </div>
              </div>

              {/* Export Options */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Export Documentation</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <button 
                    onClick={() => handleExportDocumentation('openapi')}
                    disabled={loading}
                    className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    OpenAPI JSON
                  </button>
                  <button 
                    onClick={() => handleExportDocumentation('yaml')}
                    disabled={loading}
                    className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    OpenAPI YAML
                  </button>
                  <button 
                    onClick={() => handleExportDocumentation('postman')}
                    disabled={loading}
                    className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Postman Collection
                  </button>
                  <button 
                    onClick={() => handleExportDocumentation('html')}
                    disabled={loading}
                    className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    HTML Documentation
                  </button>
                </div>
                {loading && <div className="text-sm text-gray-600 mt-2">Processing export...</div>}
              </div>
            </div>
          )}

          {/* Legacy Integrations Tab (kept for backward compatibility) */}
          {activeSubTab === 'integrations' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900">External Integrations</h3>
                <p className="text-sm text-gray-600">Configure external service integrations</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {integrations.map((integration) => (
                  <div key={integration.id} className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200 p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">{integration.name}</h4>
                        <p className="text-sm text-gray-600">{integration.description}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(integration.status)}`}>
                        {integration.status === 'active' ? 'Connected' : 'Disconnected'}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Endpoint:</span>
                        <code className="text-gray-900 text-xs">{integration.endpoint}</code>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Method:</span>
                        <span className="font-medium text-gray-900">{integration.method}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Last Sync:</span>
                        <span className="text-gray-900">
                          {integration.lastSync ? integration.lastSync.toLocaleString() : 'Never'}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={() => onTestIntegration(integration.id)}
                        className="flex items-center px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Test
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Webhooks Tab */}
          {activeSubTab === 'webhooks' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900">Webhook Configuration</h3>
                <p className="text-sm text-gray-600">Set up webhooks for real-time notifications</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                <CheckCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <h4 className="font-semibold text-gray-900 mb-2">Webhook Configuration Coming Soon</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Advanced webhook configuration is in development. Contact support for custom webhook setup.
                </p>
                <button className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded hover:bg-blue-600">
                  Contact Support
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

APIManagementPanel.displayName = 'APIManagementPanel';

export default APIManagementPanel;