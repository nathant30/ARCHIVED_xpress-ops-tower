'use client';

import React, { useState } from 'react';
import { 
  Activity, 
  Server, 
  Database, 
  AlertCircle, 
  CheckCircle, 
  TrendingUp, 
  TrendingDown,
  Clock,
  Cpu,
  HardDrive,
  Wifi,
  Users,
  BarChart3
} from 'lucide-react';

export default function MonitoringPage() {
  const [activeTab, setActiveTab] = useState('system');

  const tabs = [
    { id: 'system', name: 'System Health', icon: Activity },
    { id: 'performance', name: 'Performance', icon: BarChart3 },
    { id: 'infrastructure', name: 'Infrastructure', icon: Server },
    { id: 'alerts', name: 'Alerts', icon: AlertCircle }
  ];

  const systemMetrics = [
    { label: 'CPU Usage', value: '68%', status: 'warning', icon: Cpu },
    { label: 'Memory Usage', value: '84%', status: 'critical', icon: HardDrive },
    { label: 'Disk Usage', value: '45%', status: 'success', icon: Database },
    { label: 'Network I/O', value: '234 MB/s', status: 'info', icon: Wifi },
    { label: 'Active Users', value: '12,450', status: 'success', icon: Users },
    { label: 'Response Time', value: '125ms', status: 'success', icon: Clock }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'var(--xp-status-success)';
      case 'warning': return 'var(--xp-status-warning)';
      case 'critical': return 'var(--xp-status-critical)';
      case 'info': return 'var(--xp-status-info)';
      default: return 'var(--xp-text-secondary)';
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: 'var(--xp-bg-page)',
      fontFamily: 'var(--xp-font-family-base)',
      padding: 'var(--xp-spacing-6)'
    }}>
      {/* Header */}
      <header style={{
        marginBottom: 'var(--xp-spacing-6)',
        paddingBottom: 'var(--xp-spacing-4)',
        borderBottom: `1px solid var(--xp-border-default)`
      }}>
        <h1 style={{
          fontSize: 'var(--xp-text-2xl)',
          fontWeight: 'var(--xp-font-weight-bold)',
          color: 'var(--xp-text-primary)',
          marginBottom: 'var(--xp-spacing-2)'
        }}>
          System Monitoring
        </h1>
        <p style={{
          color: 'var(--xp-text-secondary)',
          fontSize: 'var(--xp-text-base)'
        }}>
          Real-time system health and performance monitoring
        </p>
      </header>

      {/* Sub-navigation tabs */}
      <div style={{ 
        borderBottom: `1px solid var(--xp-border-default)`,
        marginBottom: 'var(--xp-spacing-6)'
      }}>
        <nav style={{ 
          display: 'flex',
          gap: 'var(--xp-spacing-8)',
          marginBottom: '-1px'
        }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--xp-spacing-2)',
                  padding: `var(--xp-spacing-4) var(--xp-spacing-1)`,
                  borderBottom: isActive ? '2px solid var(--xp-primary)' : '2px solid transparent',
                  fontWeight: 'var(--xp-font-weight-medium)',
                  fontSize: 'var(--xp-text-sm)',
                  color: isActive ? 'var(--xp-primary)' : 'var(--xp-text-secondary)',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'var(--xp-text-primary)';
                    e.currentTarget.style.borderBottomColor = 'var(--xp-border-hover)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'var(--xp-text-secondary)';
                    e.currentTarget.style.borderBottomColor = 'transparent';
                  }
                }}
              >
                <Icon size={16} />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'system' && (
        <div>
          {/* System Status Overview */}
          <div style={{
            backgroundColor: 'var(--xp-bg-card)',
            borderRadius: 'var(--xp-radius-lg)px',
            boxShadow: 'var(--xp-elevation-2)',
            padding: 'var(--xp-spacing-6)',
            marginBottom: 'var(--xp-spacing-6)'
          }}>
            <h3 style={{
              fontSize: 'var(--xp-text-lg)',
              fontWeight: 'var(--xp-font-weight-semibold)',
              color: 'var(--xp-text-primary)',
              marginBottom: 'var(--xp-spacing-4)'
            }}>
              System Health Overview
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 'var(--xp-spacing-4)'
            }}>
              {systemMetrics.map((metric, index) => {
                const Icon = metric.icon;
                return (
                  <div
                    key={index}
                    style={{
                      backgroundColor: 'var(--xp-bg-elevated)',
                      padding: 'var(--xp-spacing-4)',
                      borderRadius: 'var(--xp-radius-md)px',
                      boxShadow: 'var(--xp-elevation-1)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--xp-spacing-3)'
                    }}
                  >
                    <div style={{
                      padding: 'var(--xp-spacing-2)',
                      borderRadius: 'var(--xp-radius-sm)px',
                      backgroundColor: `${getStatusColor(metric.status)}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Icon 
                        size={20} 
                        style={{ color: getStatusColor(metric.status) }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{
                        fontSize: 'var(--xp-text-sm)',
                        color: 'var(--xp-text-secondary)',
                        marginBottom: 'var(--xp-spacing-1)'
                      }}>
                        {metric.label}
                      </p>
                      <p style={{
                        fontSize: 'var(--xp-text-lg)',
                        fontWeight: 'var(--xp-font-weight-semibold)',
                        color: getStatusColor(metric.status)
                      }}>
                        {metric.value}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chart Section */}
          <div style={{
            backgroundColor: 'var(--xp-bg-card)',
            borderRadius: 'var(--xp-radius-lg)px',
            boxShadow: 'var(--xp-elevation-2)',
            padding: 'var(--xp-spacing-6)'
          }}>
            <h3 style={{
              fontSize: 'var(--xp-text-lg)',
              fontWeight: 'var(--xp-font-weight-semibold)',
              color: 'var(--xp-text-primary)',
              marginBottom: 'var(--xp-spacing-4)'
            }}>
              Performance Trends
            </h3>
            <div style={{
              textAlign: 'center',
              padding: 'var(--xp-spacing-8)',
              color: 'var(--xp-text-secondary)'
            }}>
              <BarChart3 
                size={48} 
                style={{
                  margin: '0 auto var(--xp-spacing-4)',
                  color: 'var(--xp-text-tertiary)'
                }} 
              />
              <p style={{
                fontSize: 'var(--xp-text-base)',
                marginBottom: 'var(--xp-spacing-1)'
              }}>
                Real-time Performance Charts
              </p>
              <p style={{
                fontSize: 'var(--xp-text-sm)',
                color: 'var(--xp-text-tertiary)'
              }}>
                Interactive charts and monitoring dashboards coming soon
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Other tabs placeholder */}
      {activeTab !== 'system' && (
        <div style={{
          backgroundColor: 'var(--xp-bg-card)',
          borderRadius: 'var(--xp-radius-lg)px',
          boxShadow: 'var(--xp-elevation-2)',
          padding: 'var(--xp-spacing-6)'
        }}>
          <div style={{
            textAlign: 'center',
            padding: 'var(--xp-spacing-8)',
            color: 'var(--xp-text-secondary)'
          }}>
            <div style={{
              padding: 'var(--xp-spacing-4)',
              borderRadius: 'var(--xp-radius-full)px',
              backgroundColor: 'var(--xp-bg-elevated)',
              width: '64px',
              height: '64px',
              margin: '0 auto var(--xp-spacing-4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {activeTab === 'performance' && <BarChart3 size={32} style={{ color: 'var(--xp-chart-palette-1)' }} />}
              {activeTab === 'infrastructure' && <Server size={32} style={{ color: 'var(--xp-chart-palette-2)' }} />}
              {activeTab === 'alerts' && <AlertCircle size={32} style={{ color: 'var(--xp-status-warning)' }} />}
            </div>
            <h3 style={{
              fontSize: 'var(--xp-text-lg)',
              fontWeight: 'var(--xp-font-weight-medium)',
              color: 'var(--xp-text-primary)',
              marginBottom: 'var(--xp-spacing-2)'
            }}>
              {tabs.find(t => t.id === activeTab)?.name} Coming Soon
            </h3>
            <p style={{
              fontSize: 'var(--xp-text-sm)',
              color: 'var(--xp-text-tertiary)'
            }}>
              Advanced {activeTab.replace('_', ' ')} monitoring and analytics will be available here.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}