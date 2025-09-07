'use client';

import React, { useState } from 'react';
import { BarChart3, DollarSign, Activity, Settings } from 'lucide-react';

const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState('operations');

  const tabs = [
    { id: 'operations', name: 'Operations', icon: Activity },
    { id: 'financial', name: 'Financial', icon: DollarSign },
    { id: 'performance', name: 'Performance', icon: BarChart3 },
    { id: 'custom', name: 'Custom', icon: Settings }
  ];

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
          Analytics Reports
        </h1>
        <p style={{
          color: 'var(--xp-text-secondary)',
          fontSize: 'var(--xp-text-base)'
        }}>
          Comprehensive analytics and performance insights
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
      {activeTab === 'operations' && (
        <div style={{
          backgroundColor: 'var(--xp-bg-card)',
          borderRadius: 'var(--xp-radius-lg)px',
          boxShadow: 'var(--xp-elevation-2)',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: 'var(--xp-spacing-6)',
            borderBottom: `1px solid var(--xp-border-default)`
          }}>
            <h3 style={{
              fontSize: 'var(--xp-text-lg)',
              fontWeight: 'var(--xp-font-weight-semibold)',
              color: 'var(--xp-text-primary)',
              marginBottom: 'var(--xp-spacing-2)'
            }}>
              Operations Reports
            </h3>
            <p style={{
              color: 'var(--xp-text-secondary)',
              fontSize: 'var(--xp-text-base)'
            }}>
              Detailed operational analytics and performance metrics
            </p>
          </div>
          <div style={{ padding: 'var(--xp-spacing-6)' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 'var(--xp-spacing-6)'
            }}>
              <div style={{
                textAlign: 'center',
                backgroundColor: 'var(--xp-bg-elevated)',
                padding: 'var(--xp-spacing-4)',
                borderRadius: 'var(--xp-radius-md)px',
                boxShadow: 'var(--xp-elevation-1)'
              }}>
                <div style={{
                  fontSize: 'var(--xp-text-3xl)',
                  fontWeight: 'var(--xp-font-weight-bold)',
                  color: 'var(--xp-status-success)',
                  marginBottom: 'var(--xp-spacing-2)'
                }}>
                  95.2%
                </div>
                <p style={{
                  color: 'var(--xp-text-secondary)',
                  fontSize: 'var(--xp-text-sm)'
                }}>
                  Trip Completion Rate
                </p>
              </div>
              <div style={{
                textAlign: 'center',
                backgroundColor: 'var(--xp-bg-elevated)',
                padding: 'var(--xp-spacing-4)',
                borderRadius: 'var(--xp-radius-md)px',
                boxShadow: 'var(--xp-elevation-1)'
              }}>
                <div style={{
                  fontSize: 'var(--xp-text-3xl)',
                  fontWeight: 'var(--xp-font-weight-bold)',
                  color: 'var(--xp-status-info)',
                  marginBottom: 'var(--xp-spacing-2)'
                }}>
                  2.1m
                </div>
                <p style={{
                  color: 'var(--xp-text-secondary)',
                  fontSize: 'var(--xp-text-sm)'
                }}>
                  Avg Response Time
                </p>
              </div>
              <div style={{
                textAlign: 'center',
                backgroundColor: 'var(--xp-bg-elevated)',
                padding: 'var(--xp-spacing-4)',
                borderRadius: 'var(--xp-radius-md)px',
                boxShadow: 'var(--xp-elevation-1)'
              }}>
                <div style={{
                  fontSize: 'var(--xp-text-3xl)',
                  fontWeight: 'var(--xp-font-weight-bold)',
                  color: 'var(--xp-chart-palette-1)',
                  marginBottom: 'var(--xp-spacing-2)'
                }}>
                  4.7⭐
                </div>
                <p style={{
                  color: 'var(--xp-text-secondary)',
                  fontSize: 'var(--xp-text-sm)'
                }}>
                  Service Rating
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'financial' && (
        <div style={{
          backgroundColor: 'var(--xp-bg-card)',
          borderRadius: 'var(--xp-radius-lg)px',
          boxShadow: 'var(--xp-elevation-2)',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: 'var(--xp-spacing-6)',
            borderBottom: `1px solid var(--xp-border-default)`
          }}>
            <h3 style={{
              fontSize: 'var(--xp-text-lg)',
              fontWeight: 'var(--xp-font-weight-semibold)',
              color: 'var(--xp-text-primary)',
              marginBottom: 'var(--xp-spacing-2)'
            }}>
              Financial Reports
            </h3>
            <p style={{
              color: 'var(--xp-text-secondary)',
              fontSize: 'var(--xp-text-base)'
            }}>
              Revenue analysis and financial performance tracking
            </p>
          </div>
          <div style={{ padding: 'var(--xp-spacing-6)' }}>
            <div style={{
              textAlign: 'center',
              padding: 'var(--xp-spacing-8)',
              color: 'var(--xp-text-secondary)'
            }}>
              <DollarSign 
                size={32} 
                style={{
                  margin: '0 auto var(--xp-spacing-2)',
                  color: 'var(--xp-text-tertiary)'
                }} 
              />
              <p style={{
                fontSize: 'var(--xp-text-base)',
                marginBottom: 'var(--xp-spacing-1)'
              }}>
                Financial analytics dashboard
              </p>
              <p style={{
                fontSize: 'var(--xp-text-sm)',
                color: 'var(--xp-text-tertiary)'
              }}>
                Revenue tracking and financial insights
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'performance' && (
        <div style={{
          backgroundColor: 'var(--xp-bg-card)',
          borderRadius: 'var(--xp-radius-lg)px',
          boxShadow: 'var(--xp-elevation-2)',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: 'var(--xp-spacing-6)',
            borderBottom: `1px solid var(--xp-border-default)`
          }}>
            <h3 style={{
              fontSize: 'var(--xp-text-lg)',
              fontWeight: 'var(--xp-font-weight-semibold)',
              color: 'var(--xp-text-primary)',
              marginBottom: 'var(--xp-spacing-2)'
            }}>
              Performance Analytics
            </h3>
            <p style={{
              color: 'var(--xp-text-secondary)',
              fontSize: 'var(--xp-text-base)'
            }}>
              Driver and system performance metrics
            </p>
          </div>
          <div style={{ padding: 'var(--xp-spacing-6)' }}>
            <div style={{
              textAlign: 'center',
              padding: 'var(--xp-spacing-8)',
              color: 'var(--xp-text-secondary)'
            }}>
              <BarChart3 
                size={32} 
                style={{
                  margin: '0 auto var(--xp-spacing-2)',
                  color: 'var(--xp-text-tertiary)'
                }} 
              />
              <p style={{
                fontSize: 'var(--xp-text-base)',
                marginBottom: 'var(--xp-spacing-1)'
              }}>
                Performance metrics dashboard
              </p>
              <p style={{
                fontSize: 'var(--xp-text-sm)',
                color: 'var(--xp-text-tertiary)'
              }}>
                Comprehensive performance analytics
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'custom' && (
        <div style={{
          backgroundColor: 'var(--xp-bg-card)',
          borderRadius: 'var(--xp-radius-lg)px',
          boxShadow: 'var(--xp-elevation-2)',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: 'var(--xp-spacing-6)',
            borderBottom: `1px solid var(--xp-border-default)`
          }}>
            <h3 style={{
              fontSize: 'var(--xp-text-lg)',
              fontWeight: 'var(--xp-font-weight-semibold)',
              color: 'var(--xp-text-primary)',
              marginBottom: 'var(--xp-spacing-2)'
            }}>
              Custom Reports
            </h3>
            <p style={{
              color: 'var(--xp-text-secondary)',
              fontSize: 'var(--xp-text-base)'
            }}>
              Build and customize your own reports
            </p>
          </div>
          <div style={{ padding: 'var(--xp-spacing-6)' }}>
            <div style={{
              textAlign: 'center',
              padding: 'var(--xp-spacing-8)',
              color: 'var(--xp-text-secondary)'
            }}>
              <Settings 
                size={32} 
                style={{
                  margin: '0 auto var(--xp-spacing-2)',
                  color: 'var(--xp-text-tertiary)'
                }} 
              />
              <p style={{
                fontSize: 'var(--xp-text-base)',
                marginBottom: 'var(--xp-spacing-1)'
              }}>
                Custom report builder
              </p>
              <p style={{
                fontSize: 'var(--xp-text-sm)',
                color: 'var(--xp-text-tertiary)'
              }}>
                Create tailored analytics and reports
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;