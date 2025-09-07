'use client';

import { useState, useEffect } from 'react';
import { Shield, CheckCircle, AlertTriangle, XCircle, Clock, TrendingUp, FileText, AlertCircle } from 'lucide-react';

interface ComplianceData {
  overall_score: number;
  status: 'compliant' | 'warning' | 'violation';
  daily_checks: {
    fare_compliance: {
      status: 'pass' | 'fail' | 'warning';
      checked_fares: number;
      violations: number;
      last_check: string;
    };
    surge_compliance: {
      status: 'pass' | 'fail' | 'warning';
      max_surge_today: number;
      ltfrb_limit: number;
      last_check: string;
    };
    reporting: {
      status: 'pass' | 'fail' | 'warning';
      last_report_sent: string;
      next_report_due: string;
    };
  };
  recent_violations: Array<{
    id: string;
    type: 'fare_excess' | 'surge_cap' | 'unreported';
    severity: 'low' | 'medium' | 'high';
    description: string;
    timestamp: string;
    resolved: boolean;
  }>;
  ltfrb_limits: {
    base_fare_max: number;
    surge_cap_max: number;
    reporting_frequency: string;
  };
}

export function ComplianceDashboard({ initialStatus }: { initialStatus: any }) {
  const [complianceData, setComplianceData] = useState<ComplianceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComplianceData = async () => {
      try {
        // Simulate compliance data for demonstration
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const data: ComplianceData = {
          overall_score: 98.7,
          status: 'compliant',
          daily_checks: {
            fare_compliance: {
              status: 'pass',
              checked_fares: 18420,
              violations: 2,
              last_check: '2 minutes ago'
            },
            surge_compliance: {
              status: 'warning',
              max_surge_today: 2.8,
              ltfrb_limit: 3.0,
              last_check: '5 minutes ago'
            },
            reporting: {
              status: 'pass',
              last_report_sent: '23:58 yesterday',
              next_report_due: '23:59 today'
            }
          },
          recent_violations: [
            {
              id: 'V001',
              type: 'fare_excess',
              severity: 'low',
              description: 'Base fare exceeded by ₱3.50 for TNVS Standard in Makati CBD',
              timestamp: '2 hours ago',
              resolved: true
            },
            {
              id: 'V002',
              type: 'surge_cap',
              severity: 'medium',
              description: 'Surge multiplier reached 2.9x during Typhoon alert (approaching 3.0x limit)',
              timestamp: '4 hours ago',
              resolved: false
            }
          ],
          ltfrb_limits: {
            base_fare_max: 150.0,
            surge_cap_max: 3.0,
            reporting_frequency: 'Daily'
          }
        };
        
        setComplianceData(data);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch compliance data:', error);
        setLoading(false);
      }
    };

    fetchComplianceData();
    const interval = setInterval(fetchComplianceData, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading Compliance Status...</p>
        </div>
      </div>
    );
  }

  if (!complianceData) {
    return (
      <div className="h-96 flex items-center justify-center bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-2" />
          <p className="text-slate-600 dark:text-slate-400">Failed to load compliance data</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
      case 'compliant':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'fail':
      case 'violation':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      default:
        return 'text-slate-600 bg-slate-100 dark:bg-slate-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
      case 'compliant':
        return <CheckCircle className="h-5 w-5" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />;
      case 'fail':
      case 'violation':
        return <XCircle className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Regulatory Compliance Dashboard</h3>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">Real-time LTFRB compliance monitoring and reporting</p>
      </div>
      
      <div className="p-6 space-y-6">
        {/* Overall Compliance Score */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/10 dark:to-blue-900/10 rounded-lg">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${getStatusColor(complianceData.status)}`}>
              {getStatusIcon(complianceData.status)}
            </div>
            <div>
              <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Overall Compliance Score</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">Based on fare limits, surge caps, and reporting requirements</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-green-600">{complianceData.overall_score}%</div>
            <div className="text-sm text-slate-600 dark:text-slate-400 uppercase tracking-wide">
              {complianceData.status}
            </div>
          </div>
        </div>

        {/* Daily Compliance Checks */}
        <div>
          <h4 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Daily Compliance Checks</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Fare Compliance */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-medium text-slate-900 dark:text-white">Fare Compliance</h5>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(complianceData.daily_checks.fare_compliance.status)}`}>
                  {getStatusIcon(complianceData.daily_checks.fare_compliance.status)}
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Checked Fares:</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {complianceData.daily_checks.fare_compliance.checked_fares.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Violations:</span>
                  <span className={`font-medium ${complianceData.daily_checks.fare_compliance.violations > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {complianceData.daily_checks.fare_compliance.violations}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Last Check:</span>
                  <span className="text-xs text-slate-500">{complianceData.daily_checks.fare_compliance.last_check}</span>
                </div>
              </div>
            </div>

            {/* Surge Compliance */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-medium text-slate-900 dark:text-white">Surge Compliance</h5>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(complianceData.daily_checks.surge_compliance.status)}`}>
                  {getStatusIcon(complianceData.daily_checks.surge_compliance.status)}
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Max Surge Today:</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {complianceData.daily_checks.surge_compliance.max_surge_today}x
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">LTFRB Limit:</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {complianceData.daily_checks.surge_compliance.ltfrb_limit}x
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Last Check:</span>
                  <span className="text-xs text-slate-500">{complianceData.daily_checks.surge_compliance.last_check}</span>
                </div>
              </div>
            </div>

            {/* Reporting Compliance */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-medium text-slate-900 dark:text-white">Reporting</h5>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(complianceData.daily_checks.reporting.status)}`}>
                  {getStatusIcon(complianceData.daily_checks.reporting.status)}
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Last Report:</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {complianceData.daily_checks.reporting.last_report_sent}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Next Due:</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {complianceData.daily_checks.reporting.next_report_due}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Violations */}
        <div>
          <h4 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Recent Violations</h4>
          {complianceData.recent_violations.length === 0 ? (
            <div className="text-center py-6 text-green-600 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="h-8 w-8 mx-auto mb-2" />
              <p className="font-medium">No violations today</p>
              <p className="text-sm text-green-600/80">All systems operating within LTFRB limits</p>
            </div>
          ) : (
            <div className="space-y-3">
              {complianceData.recent_violations.map((violation) => (
                <div key={violation.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          violation.severity === 'high' ? 'bg-red-100 text-red-700' :
                          violation.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {violation.severity.toUpperCase()}
                        </span>
                        <span className="text-sm text-slate-600 dark:text-slate-400">#{violation.id}</span>
                        <span className="text-sm text-slate-500">{violation.timestamp}</span>
                      </div>
                      <p className="text-sm text-slate-900 dark:text-white mb-1">{violation.description}</p>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-slate-600 dark:text-slate-400">Type: {violation.type.replace('_', ' ')}</span>
                        <span className={`font-medium ${violation.resolved ? 'text-green-600' : 'text-red-600'}`}>
                          {violation.resolved ? 'Resolved' : 'Active'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* LTFRB Limits Reference */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
          <h4 className="text-lg font-medium text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            LTFRB Regulatory Limits
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-slate-600 dark:text-slate-400">Base Fare Maximum:</span>
              <p className="font-medium text-slate-900 dark:text-white">₱{complianceData.ltfrb_limits.base_fare_max}</p>
            </div>
            <div>
              <span className="text-slate-600 dark:text-slate-400">Surge Cap Maximum:</span>
              <p className="font-medium text-slate-900 dark:text-white">{complianceData.ltfrb_limits.surge_cap_max}x</p>
            </div>
            <div>
              <span className="text-slate-600 dark:text-slate-400">Reporting Frequency:</span>
              <p className="font-medium text-slate-900 dark:text-white">{complianceData.ltfrb_limits.reporting_frequency}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}