'use client';

import React, { memo, useState } from 'react';
import { 
  FileText, 
  Download, 
  Calendar,
  Filter,
  Search,
  Eye,
  Clock,
  User,
  Activity,
  Shield,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

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

interface AuditPanelProps {
  auditLogs: AuditLog[];
  auditExports: AuditExport[];
  activeSubTab: string;
  loading: boolean;
  onSubTabChange: (tab: string) => void;
  onExportAuditLogs: (format: 'csv' | 'json' | 'pdf', dateRange?: { start: Date; end: Date }) => void;
  onDownloadExport: (exportId: string) => void;
  onDeleteExport: (exportId: string) => void;
  onViewLogDetails: (logId: string) => void;
}

const AuditPanel = memo<AuditPanelProps>(({
  auditLogs,
  auditExports,
  activeSubTab,
  loading,
  onSubTabChange,
  onExportAuditLogs,
  onDownloadExport,
  onDeleteExport,
  onViewLogDetails
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failure' | 'warning'>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'pdf'>('csv');

  const subTabs = [
    { id: 'logs', label: 'Audit Logs', icon: Activity },
    { id: 'exports', label: 'Data Exports', icon: Download },
    { id: 'compliance', label: 'Compliance', icon: Shield }
  ];


  const getExportStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'processing': return 'text-blue-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = searchQuery === '' || 
      log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleExport = () => {
    const range = dateRange.start && dateRange.end 
      ? { start: new Date(dateRange.start), end: new Date(dateRange.end) }
      : undefined;
    onExportAuditLogs(exportFormat, range);
  };

  const renderLogsTab = () => (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-gray-900">System Audit Logs</h3>
        <p className="text-sm text-gray-600">Monitor all system activities and user actions</p>
      </div>
      
      {/* Header with search and filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center space-x-3">
          <input
            type="text"
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-w-md"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
            <option value="warning">Warning</option>
          </select>
        </div>
      </div>

      {/* Audit Logs list */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="divide-y divide-gray-200">
          {filteredLogs.map((log) => (
            <div key={log.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  {log.status === 'success' ? <CheckCircle className="w-5 h-5 text-green-600" /> : 
                   log.status === 'failure' ? <AlertTriangle className="w-5 h-5 text-red-600" /> : 
                   log.status === 'warning' ? <AlertTriangle className="w-5 h-5 text-yellow-600" /> : 
                   <Clock className="w-5 h-5 text-blue-600" />}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{log.action}</p>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        log.status === 'success' ? 'bg-green-100 text-green-800' : 
                        log.status === 'failure' ? 'bg-red-100 text-red-800' : 
                        log.status === 'warning' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {log.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {log.user} • {log.resource} • {log.ipAddress}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-medium text-gray-900">{log.timestamp.toLocaleDateString()}</div>
                    <div className="text-sm text-gray-600">{log.timestamp.toLocaleTimeString()}</div>
                  </div>
                  <button
                    onClick={() => onViewLogDetails(log.id)}
                    className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderExportsTab = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900">Export Audit Data</h3>
            <p className="text-sm text-gray-600">Generate reports and export audit logs</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as any)}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="csv">CSV Format</option>
              <option value="json">JSON Format</option>
              <option value="pdf">PDF Report</option>
            </select>
            
            <button
              onClick={handleExport}
              className="flex items-center px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              <Download className="w-4 h-4 mr-2" />
              Generate Export
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Recent Exports</h3>
        
        <div className="divide-y divide-gray-200">
          {auditExports.map((exportItem) => (
            <div key={exportItem.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
              <div className="flex items-center space-x-3">
                <FileText className="w-6 h-6 text-blue-600" />
                <div>
                  <h4 className="font-medium text-gray-900">{exportItem.name}</h4>
                  <div className="text-sm text-gray-600">
                    <span>Generated: {exportItem.generatedAt.toLocaleString()}</span>
                    <span className="mx-2">•</span>
                    <span>Size: {exportItem.size}</span>
                    <span className="mx-2">•</span>
                    <span className="uppercase">{exportItem.type}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className={`text-sm font-medium ${getExportStatusColor(exportItem.status)}`}>
                  {exportItem.status.charAt(0).toUpperCase() + exportItem.status.slice(1)}
                </span>
                
                {exportItem.status === 'completed' && exportItem.downloadUrl && (
                  <button
                    onClick={() => onDownloadExport(exportItem.id)}
                    className="flex items-center px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Download
                  </button>
                )}
                
                <button
                  onClick={() => onDeleteExport(exportItem.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderComplianceTab = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <Shield className="w-6 h-6 text-green-600" />
              <div>
                <h3 className="font-semibold text-gray-900">NPC Compliance</h3>
                <p className="text-sm text-gray-600">Data Privacy Act</p>
              </div>
            </div>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div className="space-y-1 text-sm text-gray-600">
            <p>Status: Compliant</p>
            <p>Last Audit: Dec 15, 2024</p>
            <p>Next Review: Mar 15, 2025</p>
            <p>Privacy Records: 1,247</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <FileText className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="font-semibold text-gray-900">LTFRB Compliance</h3>
                <p className="text-sm text-gray-600">Transport Regulations</p>
              </div>
            </div>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div className="space-y-1 text-sm text-gray-600">
            <p>Status: Active</p>
            <p>License: Valid until 2025</p>
            <p>Trip Records: 45,892</p>
            <p>Driver Compliance: 98.5%</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <User className="w-6 h-6 text-purple-600" />
              <div>
                <h3 className="font-semibold text-gray-900">DOLE Compliance</h3>
                <p className="text-sm text-gray-600">Labor Standards</p>
              </div>
            </div>
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
          </div>
          <div className="space-y-1 text-sm text-gray-600">
            <p>Status: Under Review</p>
            <p>Employee Records: 156</p>
            <p>Working Hours: Monitored</p>
            <p>Benefits: Up to date</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Compliance Checklist</h3>
        
        <div className="divide-y divide-gray-200">
          <div className="flex items-center justify-between p-3 hover:bg-gray-50">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <div>
                <h4 className="font-medium text-gray-900">Data Encryption</h4>
                <p className="text-sm text-gray-600">All sensitive data properly encrypted</p>
              </div>
            </div>
            <span className="text-sm text-green-600 font-medium">Compliant</span>
          </div>

          <div className="flex items-center justify-between p-3 hover:bg-gray-50">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <div>
                <h4 className="font-medium text-gray-900">Audit Logging</h4>
                <p className="text-sm text-gray-600">Comprehensive logging enabled</p>
              </div>
            </div>
            <span className="text-sm text-green-600 font-medium">Active</span>
          </div>

          <div className="flex items-center justify-between p-3 hover:bg-gray-50">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <div>
                <h4 className="font-medium text-gray-900">Backup Verification</h4>
                <p className="text-sm text-gray-600">Monthly backup integrity check due</p>
              </div>
            </div>
            <span className="text-sm text-yellow-600 font-medium">Pending</span>
          </div>

          <div className="flex items-center justify-between p-3 hover:bg-gray-50">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <div>
                <h4 className="font-medium text-gray-900">Access Controls</h4>
                <p className="text-sm text-gray-600">Role-based permissions implemented</p>
              </div>
            </div>
            <span className="text-sm text-green-600 font-medium">Verified</span>
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
        {activeSubTab === 'logs' && renderLogsTab()}
        {activeSubTab === 'exports' && renderExportsTab()}
        {activeSubTab === 'compliance' && renderComplianceTab()}
      </div>
    </div>
  );
});

AuditPanel.displayName = 'AuditPanel';

export default AuditPanel;