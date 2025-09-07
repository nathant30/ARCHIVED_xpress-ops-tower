'use client';

import React, { useState } from 'react';
import { DollarSign, Calendar, TrendingUp, Users } from 'lucide-react';

const EarningsPage = () => {
  const [activeTab, setActiveTab] = useState('today');

  const tabs = [
    { id: 'today', name: 'Today', icon: DollarSign },
    { id: 'weekly', name: 'Weekly', icon: Calendar },
    { id: 'monthly', name: 'Monthly', icon: TrendingUp },
    { id: 'driver-payouts', name: 'Driver Payouts', icon: Users }
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
          Earnings Analytics
        </h1>
        <p style={{
          color: 'var(--xp-text-secondary)',
          fontSize: 'var(--xp-text-base)'
        }}>
          Revenue tracking and financial performance insights
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
      {activeTab === 'today' && (
        <div>
          {/* KPI Cards Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 'var(--xp-spacing-4)',
            marginBottom: 'var(--xp-spacing-6)'
          }}>
            <div style={{
              backgroundColor: 'var(--xp-bg-card)',
              borderRadius: 'var(--xp-radius-lg)px',
              padding: 'var(--xp-spacing-6)',
              boxShadow: 'var(--xp-elevation-1)',
              border: `1px solid var(--xp-border-default)`
            }}>
              <h3 style={{
                fontSize: 'var(--xp-text-sm)',
                fontWeight: 'var(--xp-font-weight-medium)',
                color: 'var(--xp-text-secondary)',
                marginBottom: 'var(--xp-spacing-2)'
              }}>
                Total Revenue
              </h3>
              <p style={{
                fontSize: 'var(--xp-text-2xl)',
                fontWeight: 'var(--xp-font-weight-bold)',
                color: 'var(--xp-status-success)',
                marginBottom: 'var(--xp-spacing-1)'
              }}>
                ₱127,450
              </p>
              <p style={{
                fontSize: 'var(--xp-text-xs)',
                color: 'var(--xp-text-secondary)'
              }}>
                Today's earnings
              </p>
            </div>
            <div style={{
              backgroundColor: 'var(--xp-bg-card)',
              borderRadius: 'var(--xp-radius-lg)px',
              padding: 'var(--xp-spacing-6)',
              boxShadow: 'var(--xp-elevation-1)',
              border: `1px solid var(--xp-border-default)`
            }}>
              <h3 style={{
                fontSize: 'var(--xp-text-sm)',
                fontWeight: 'var(--xp-font-weight-medium)',
                color: 'var(--xp-text-secondary)',
                marginBottom: 'var(--xp-spacing-2)'
              }}>
                Platform Commission
              </h3>
              <p style={{
                fontSize: 'var(--xp-text-2xl)',
                fontWeight: 'var(--xp-font-weight-bold)',
                color: 'var(--xp-chart-palette-2)',
                marginBottom: 'var(--xp-spacing-1)'
              }}>
                ₱31,862
              </p>
              <p style={{
                fontSize: 'var(--xp-text-xs)',
                color: 'var(--xp-text-secondary)'
              }}>
                25% commission
              </p>
            </div>
            <div style={{
              backgroundColor: 'var(--xp-bg-card)',
              borderRadius: 'var(--xp-radius-lg)px',
              padding: 'var(--xp-spacing-6)',
              boxShadow: 'var(--xp-elevation-1)',
              border: `1px solid var(--xp-border-default)`
            }}>
              <h3 style={{
                fontSize: 'var(--xp-text-sm)',
                fontWeight: 'var(--xp-font-weight-medium)',
                color: 'var(--xp-text-secondary)',
                marginBottom: 'var(--xp-spacing-2)'
              }}>
                Driver Earnings
              </h3>
              <p style={{
                fontSize: 'var(--xp-text-2xl)',
                fontWeight: 'var(--xp-font-weight-bold)',
                color: 'var(--xp-chart-palette-3)',
                marginBottom: 'var(--xp-spacing-1)'
              }}>
                ₱95,588
              </p>
              <p style={{
                fontSize: 'var(--xp-text-xs)',
                color: 'var(--xp-text-secondary)'
              }}>
                75% to drivers
              </p>
            </div>
            <div style={{
              backgroundColor: 'var(--xp-bg-card)',
              borderRadius: 'var(--xp-radius-lg)px',
              padding: 'var(--xp-spacing-6)',
              boxShadow: 'var(--xp-elevation-1)',
              border: `1px solid var(--xp-border-default)`
            }}>
              <h3 style={{
                fontSize: 'var(--xp-text-sm)',
                fontWeight: 'var(--xp-font-weight-medium)',
                color: 'var(--xp-text-secondary)',
                marginBottom: 'var(--xp-spacing-2)'
              }}>
                Surge Premium
              </h3>
              <p style={{
                fontSize: 'var(--xp-text-2xl)',
                fontWeight: 'var(--xp-font-weight-bold)',
                color: 'var(--xp-status-warning)',
                marginBottom: 'var(--xp-spacing-1)'
              }}>
                ₱28,750
              </p>
              <p style={{
                fontSize: 'var(--xp-text-xs)',
                color: 'var(--xp-text-secondary)'
              }}>
                Peak hour earnings
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'weekly' && (
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
              Weekly Earnings Overview
            </h3>
            <p style={{
              color: 'var(--xp-text-secondary)',
              fontSize: 'var(--xp-text-base)'
            }}>
              7-day earnings breakdown and trends
            </p>
          </div>
          <div style={{ padding: 'var(--xp-spacing-6)' }}>
            <div style={{
              textAlign: 'center',
              padding: 'var(--xp-spacing-8)',
              color: 'var(--xp-text-secondary)'
            }}>
              <Calendar 
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
                Weekly earnings analytics
              </p>
              <p style={{
                fontSize: 'var(--xp-text-sm)',
                color: 'var(--xp-text-tertiary)'
              }}>
                Revenue trends and performance metrics
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'monthly' && (
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
              Monthly Revenue Analytics
            </h3>
            <p style={{
              color: 'var(--xp-text-secondary)',
              fontSize: 'var(--xp-text-base)'
            }}>
              Monthly performance and growth analysis
            </p>
          </div>
          <div style={{ padding: 'var(--xp-spacing-6)' }}>
            <div style={{
              textAlign: 'center',
              padding: 'var(--xp-spacing-8)',
              color: 'var(--xp-text-secondary)'
            }}>
              <TrendingUp 
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
                Monthly financial dashboard
              </p>
              <p style={{
                fontSize: 'var(--xp-text-sm)',
                color: 'var(--xp-text-tertiary)'
              }}>
                Revenue growth and forecasting
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'driver-payouts' && (
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
              Driver Payment Management
            </h3>
            <p style={{
              color: 'var(--xp-text-secondary)',
              fontSize: 'var(--xp-text-base)'
            }}>
              Process and manage driver earnings and payouts
            </p>
          </div>
          <div style={{ padding: 'var(--xp-spacing-6)' }}>
            <div style={{
              textAlign: 'center',
              padding: 'var(--xp-spacing-8)',
              color: 'var(--xp-text-secondary)'
            }}>
              <Users 
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
                Driver payout system
              </p>
              <p style={{
                fontSize: 'var(--xp-text-sm)',
                color: 'var(--xp-text-tertiary)'
              }}>
                Earnings distribution and payment processing
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EarningsPage;