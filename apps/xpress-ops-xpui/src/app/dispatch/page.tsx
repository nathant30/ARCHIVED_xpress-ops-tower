'use client';

import React, { useState, useEffect } from 'react';
import { Radio, Route, BarChart3, History } from 'lucide-react';

const DispatchPage = () => {
  const [activeTab, setActiveTab] = useState('manual-assignment');
  const [loading, setLoading] = useState(false);

  const tabs = [
    { id: 'manual-assignment', name: 'Manual Assignment', icon: Radio },
    { id: 'route-planning', name: 'Route Planning', icon: Route },
    { id: 'load-balancing', name: 'Load Balancing', icon: BarChart3 },
    { id: 'history', name: 'History', icon: History }
  ];

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: 'var(--xp-bg-page)',
      fontFamily: 'var(--xp-font-family-base)'
    }}>
      <header style={{
        backgroundColor: 'var(--xp-bg-card)',
        borderBottom: '1px solid var(--xp-border-default)',
        padding: 'var(--xp-spacing-6)',
        boxShadow: 'var(--xp-elevation-1)'
      }}>
        <h1 style={{
          fontSize: 'var(--xp-font-size-h1)',
          fontWeight: 'var(--xp-font-weight-bold)',
          color: 'var(--xp-text-primary)',
          margin: 0,
          lineHeight: 'var(--xp-line-height-tight)'
        }}>Dispatch Control Center</h1>
        <p style={{
          fontSize: 'var(--xp-font-size-body)',
          color: 'var(--xp-text-secondary)',
          margin: 'var(--xp-spacing-1) 0 0 0'
        }}>Manage ride assignments, routes, and load balancing</p>
      </header>

      <div style={{ padding: 'var(--xp-spacing-6)' }}>
        <div style={{ marginBottom: 'var(--xp-spacing-8)' }}>
          {/* Sub-navigation tabs */}
          <div style={{ borderBottom: '1px solid var(--xp-border-default)' }}>
            <nav style={{ 
              marginBottom: '-1px', 
              display: 'flex', 
              gap: 'var(--xp-spacing-8)' 
            }}>
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--xp-spacing-2)',
                      padding: 'var(--xp-spacing-4) var(--xp-spacing-1)',
                      borderBottom: '2px solid',
                      borderBottomColor: activeTab === tab.id ? 'var(--xp-brand-primary)' : 'transparent',
                      color: activeTab === tab.id ? 'var(--xp-brand-primary)' : 'var(--xp-text-secondary)',
                      fontWeight: 'var(--xp-font-weight-medium)',
                      fontSize: 'var(--xp-font-size-body)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all var(--xp-duration-base) var(--xp-easing-standard)'
                    }}
                    onMouseEnter={(e) => {
                      if (activeTab !== tab.id) {
                        e.currentTarget.style.color = 'var(--xp-text-primary)';
                        e.currentTarget.style.borderBottomColor = 'var(--xp-border-default)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeTab !== tab.id) {
                        e.currentTarget.style.color = 'var(--xp-text-secondary)';
                        e.currentTarget.style.borderBottomColor = 'transparent';
                      }
                    }}
                  >
                    <Icon style={{ width: '16px', height: '16px' }} />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'manual-assignment' && (
          <div style={{
            backgroundColor: 'var(--xp-bg-card)',
            borderRadius: 'var(--xp-radius-lg)px',
            boxShadow: 'var(--xp-elevation-2)',
            border: '1px solid var(--xp-border-default)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: 'var(--xp-spacing-6)',
              borderBottom: '1px solid var(--xp-border-default)'
            }}>
              <h3 style={{
                fontSize: 'var(--xp-font-size-h3)',
                fontWeight: 'var(--xp-font-weight-semibold)',
                color: 'var(--xp-text-primary)',
                margin: 0,
                marginBottom: 'var(--xp-spacing-1)'
              }}>Manual Ride Assignment</h3>
              <p style={{
                fontSize: 'var(--xp-font-size-body)',
                color: 'var(--xp-text-secondary)',
                margin: 0
              }}>Manually assign drivers to specific ride requests</p>
            </div>
            <div style={{ padding: 'var(--xp-spacing-6)' }}>
              <div style={{
                textAlign: 'center',
                padding: 'var(--xp-spacing-8) 0',
                color: 'var(--xp-text-muted)'
              }}>
                <Radio style={{
                  width: '32px',
                  height: '32px',
                  margin: '0 auto var(--xp-spacing-2)',
                  display: 'block',
                  color: 'var(--xp-text-muted)'
                }} />
                <p style={{
                  fontSize: 'var(--xp-font-size-body)',
                  margin: 0,
                  marginBottom: 'var(--xp-spacing-1)'
                }}>Manual dispatch control system</p>
                <p style={{
                  fontSize: 'var(--xp-font-size-caption)',
                  margin: 0
                }}>Override automatic assignment for priority rides</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'route-planning' && (
          <div style={{
            backgroundColor: 'var(--xp-bg-card)',
            borderRadius: 'var(--xp-radius-lg)px',
            boxShadow: 'var(--xp-elevation-2)',
            border: '1px solid var(--xp-border-default)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: 'var(--xp-spacing-6)',
              borderBottom: '1px solid var(--xp-border-default)'
            }}>
              <h3 style={{
                fontSize: 'var(--xp-font-size-h3)',
                fontWeight: 'var(--xp-font-weight-semibold)',
                color: 'var(--xp-text-primary)',
                margin: 0,
                marginBottom: 'var(--xp-spacing-1)'
              }}>Route Optimization</h3>
              <p style={{
                fontSize: 'var(--xp-font-size-body)',
                color: 'var(--xp-text-secondary)',
                margin: 0
              }}>Optimize driver routes and reduce travel time</p>
            </div>
            <div style={{ padding: 'var(--xp-spacing-6)' }}>
              <div style={{
                textAlign: 'center',
                padding: 'var(--xp-spacing-8) 0',
                color: 'var(--xp-text-muted)'
              }}>
                <Route style={{
                  width: '32px',
                  height: '32px',
                  margin: '0 auto var(--xp-spacing-2)',
                  display: 'block',
                  color: 'var(--xp-text-muted)'
                }} />
                <p style={{
                  fontSize: 'var(--xp-font-size-body)',
                  margin: 0,
                  marginBottom: 'var(--xp-spacing-1)'
                }}>Advanced route planning system</p>
                <p style={{
                  fontSize: 'var(--xp-font-size-caption)',
                  margin: 0
                }}>AI-powered route optimization and traffic analysis</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'load-balancing' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--xp-spacing-6)' }}>
            {/* Load Distribution Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 'var(--xp-spacing-6)'
            }}>
              <div style={{
                backgroundColor: 'var(--xp-bg-card)',
                borderRadius: 'var(--xp-radius-lg)px',
                padding: 'var(--xp-spacing-6)',
                boxShadow: 'var(--xp-elevation-2)',
                border: '1px solid var(--xp-border-default)'
              }}>
                <h3 style={{
                  fontSize: 'var(--xp-font-size-caption)',
                  fontWeight: 'var(--xp-font-weight-medium)',
                  color: 'var(--xp-text-secondary)',
                  margin: 0,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: 'var(--xp-spacing-2)'
                }}>High Demand Areas</h3>
                <p style={{
                  fontSize: 'calc(var(--xp-font-size-h1) * 1.2)',
                  fontWeight: 'var(--xp-font-weight-bold)',
                  color: 'var(--xp-status-critical)',
                  margin: 0,
                  marginBottom: 'var(--xp-spacing-1)'
                }}>5</p>
                <p style={{
                  fontSize: 'var(--xp-font-size-caption)',
                  color: 'var(--xp-text-muted)',
                  margin: 0
                }}>Need more drivers</p>
              </div>
              <div style={{
                backgroundColor: 'var(--xp-bg-card)',
                borderRadius: 'var(--xp-radius-lg)px',
                padding: 'var(--xp-spacing-6)',
                boxShadow: 'var(--xp-elevation-2)',
                border: '1px solid var(--xp-border-default)'
              }}>
                <h3 style={{
                  fontSize: 'var(--xp-font-size-caption)',
                  fontWeight: 'var(--xp-font-weight-medium)',
                  color: 'var(--xp-text-secondary)',
                  margin: 0,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: 'var(--xp-spacing-2)'
                }}>Balanced Areas</h3>
                <p style={{
                  fontSize: 'calc(var(--xp-font-size-h1) * 1.2)',
                  fontWeight: 'var(--xp-font-weight-bold)',
                  color: 'var(--xp-status-success)',
                  margin: 0,
                  marginBottom: 'var(--xp-spacing-1)'
                }}>12</p>
                <p style={{
                  fontSize: 'var(--xp-font-size-caption)',
                  color: 'var(--xp-text-muted)',
                  margin: 0
                }}>Optimal coverage</p>
              </div>
              <div style={{
                backgroundColor: 'var(--xp-bg-card)',
                borderRadius: 'var(--xp-radius-lg)px',
                padding: 'var(--xp-spacing-6)',
                boxShadow: 'var(--xp-elevation-2)',
                border: '1px solid var(--xp-border-default)'
              }}>
                <h3 style={{
                  fontSize: 'var(--xp-font-size-caption)',
                  fontWeight: 'var(--xp-font-weight-medium)',
                  color: 'var(--xp-text-secondary)',
                  margin: 0,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: 'var(--xp-spacing-2)'
                }}>Low Demand Areas</h3>
                <p style={{
                  fontSize: 'calc(var(--xp-font-size-h1) * 1.2)',
                  fontWeight: 'var(--xp-font-weight-bold)',
                  color: 'var(--xp-status-info)',
                  margin: 0,
                  marginBottom: 'var(--xp-spacing-1)'
                }}>8</p>
                <p style={{
                  fontSize: 'var(--xp-font-size-caption)',
                  color: 'var(--xp-text-muted)',
                  margin: 0
                }}>Excess drivers</p>
              </div>
              <div style={{
                backgroundColor: 'var(--xp-bg-card)',
                borderRadius: 'var(--xp-radius-lg)px',
                padding: 'var(--xp-spacing-6)',
                boxShadow: 'var(--xp-elevation-2)',
                border: '1px solid var(--xp-border-default)'
              }}>
                <h3 style={{
                  fontSize: 'var(--xp-font-size-caption)',
                  fontWeight: 'var(--xp-font-weight-medium)',
                  color: 'var(--xp-text-secondary)',
                  margin: 0,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: 'var(--xp-spacing-2)'
                }}>Distribution Score</h3>
                <p style={{
                  fontSize: 'calc(var(--xp-font-size-h1) * 1.2)',
                  fontWeight: 'var(--xp-font-weight-bold)',
                  color: 'var(--xp-brand-primary)',
                  margin: 0,
                  marginBottom: 'var(--xp-spacing-1)'
                }}>78%</p>
                <p style={{
                  fontSize: 'var(--xp-font-size-caption)',
                  color: 'var(--xp-text-muted)',
                  margin: 0
                }}>Overall efficiency</p>
              </div>
            </div>

            {/* Load Balancing Interface */}
            <div style={{
              backgroundColor: 'var(--xp-bg-card)',
              borderRadius: 'var(--xp-radius-lg)px',
              boxShadow: 'var(--xp-elevation-2)',
              border: '1px solid var(--xp-border-default)',
              overflow: 'hidden'
            }}>
              <div style={{
                padding: 'var(--xp-spacing-6)',
                borderBottom: '1px solid var(--xp-border-default)'
              }}>
                <h3 style={{
                  fontSize: 'var(--xp-font-size-h3)',
                  fontWeight: 'var(--xp-font-weight-semibold)',
                  color: 'var(--xp-text-primary)',
                  margin: 0,
                  marginBottom: 'var(--xp-spacing-1)'
                }}>Driver Distribution Control</h3>
                <p style={{
                  fontSize: 'var(--xp-font-size-body)',
                  color: 'var(--xp-text-secondary)',
                  margin: 0
                }}>Monitor and adjust driver allocation across service areas</p>
              </div>
              <div style={{ padding: 'var(--xp-spacing-6)' }}>
                <div style={{
                  textAlign: 'center',
                  padding: 'var(--xp-spacing-8) 0',
                  color: 'var(--xp-text-muted)'
                }}>
                  <BarChart3 style={{
                    width: '32px',
                    height: '32px',
                    margin: '0 auto var(--xp-spacing-2)',
                    display: 'block',
                    color: 'var(--xp-text-muted)'
                  }} />
                  <p style={{
                    fontSize: 'var(--xp-font-size-body)',
                    margin: 0,
                    marginBottom: 'var(--xp-spacing-1)'
                  }}>Real-time load balancing dashboard</p>
                  <p style={{
                    fontSize: 'var(--xp-font-size-caption)',
                    margin: 0
                  }}>Smart driver reallocation and demand prediction</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div style={{
            backgroundColor: 'var(--xp-bg-card)',
            borderRadius: 'var(--xp-radius-lg)px',
            boxShadow: 'var(--xp-elevation-2)',
            border: '1px solid var(--xp-border-default)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: 'var(--xp-spacing-6)',
              borderBottom: '1px solid var(--xp-border-default)'
            }}>
              <h3 style={{
                fontSize: 'var(--xp-font-size-h3)',
                fontWeight: 'var(--xp-font-weight-semibold)',
                color: 'var(--xp-text-primary)',
                margin: 0,
                marginBottom: 'var(--xp-spacing-1)'
              }}>Dispatch History</h3>
              <p style={{
                fontSize: 'var(--xp-font-size-body)',
                color: 'var(--xp-text-secondary)',
                margin: 0
              }}>Historical dispatch decisions and performance analytics</p>
            </div>
            <div style={{ padding: 'var(--xp-spacing-6)' }}>
              <div style={{
                textAlign: 'center',
                padding: 'var(--xp-spacing-8) 0',
                color: 'var(--xp-text-muted)'
              }}>
                <History style={{
                  width: '32px',
                  height: '32px',
                  margin: '0 auto var(--xp-spacing-2)',
                  display: 'block',
                  color: 'var(--xp-text-muted)'
                }} />
                <p style={{
                  fontSize: 'var(--xp-font-size-body)',
                  margin: 0,
                  marginBottom: 'var(--xp-spacing-1)'
                }}>Dispatch operation history</p>
                <p style={{
                  fontSize: 'var(--xp-font-size-caption)',
                  margin: 0
                }}>Analysis of past assignments and outcomes</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DispatchPage;