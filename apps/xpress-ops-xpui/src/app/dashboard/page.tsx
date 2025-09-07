'use client';

import React, { useState } from 'react';
import { 
  Activity, 
  Users, 
  Car, 
  Clock, 
  DollarSign,
  TrendingUp,
  Shield,
  AlertTriangle,
  CheckCircle,
  ArrowUpRight,
  Settings,
  Search,
  Bell,
  MapPin,
  Filter,
  MoreVertical,
  RefreshCw,
  Download,
  Eye,
  Zap
} from 'lucide-react';

const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: 'var(--xp-bg-page)',
      fontFamily: 'var(--xp-font-family-base)'
    }}>
      {/* Modern Header */}
      <header style={{
        backgroundColor: 'var(--xp-bg-card)',
        borderBottom: '1px solid var(--xp-border-default)',
        padding: 'var(--xp-spacing-6) var(--xp-spacing-8)',
        boxShadow: 'var(--xp-elevation-1)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--xp-spacing-6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--xp-spacing-4)' }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: 'var(--xp-brand-primary)',
                borderRadius: `${16}px`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--xp-elevation-2)'
              }}>
                <Zap style={{ width: '28px', height: '28px', color: 'white' }} />
              </div>
              <div>
                <h1 style={{
                  fontSize: 'var(--xp-font-size-h1)',
                  fontWeight: 'var(--xp-font-weight-bold)',
                  color: 'var(--xp-text-primary)',
                  margin: 0,
                  lineHeight: 'var(--xp-line-height-tight)'
                }}>
                  Xpress Ops Tower
                </h1>
                <p style={{
                  fontSize: 'var(--xp-font-size-body)',
                  color: 'var(--xp-brand-primary)',
                  fontWeight: 'var(--xp-font-weight-medium)',
                  margin: 0
                }}>
                  New UI • Real-time Operations
                </p>
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--xp-spacing-6)' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--xp-spacing-3)',
              backgroundColor: 'var(--xp-chip-bg-success)',
              padding: 'var(--xp-spacing-2) var(--xp-spacing-4)',
              borderRadius: `${999}px`,
              border: `1px solid rgba(34, 197, 94, 0.2)`
            }}>
              <div style={{
                width: '12px',
                height: '12px',
                backgroundColor: 'var(--xp-status-success)',
                borderRadius: '50%',
                animation: 'pulse 2s infinite'
              }}></div>
              <span style={{
                fontSize: 'var(--xp-font-size-body)',
                fontWeight: 'var(--xp-font-weight-semibold)',
                color: 'var(--xp-status-success)'
              }}>
                System Online
              </span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--xp-spacing-2)' }}>
              {[
                { Icon: Search, color: 'var(--xp-text-secondary)' },
                { Icon: Bell, color: 'var(--xp-status-critical)', badge: true },
                { Icon: Settings, color: 'var(--xp-text-secondary)' }
              ].map(({ Icon, color, badge }, index) => (
                <button
                  key={index}
                  style={{
                    padding: 'var(--xp-spacing-3)',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: `${12}px`,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    transition: 'all var(--xp-duration-fast) var(--xp-easing-standard)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--xp-color-gray-100)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Icon style={{ width: '20px', height: '20px', color }} />
                  {badge && (
                    <div style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      width: '16px',
                      height: '16px',
                      backgroundColor: 'var(--xp-status-critical)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      fontWeight: 'var(--xp-font-weight-bold)',
                      color: 'white',
                      boxShadow: 'var(--xp-elevation-1)'
                    }}>
                      3
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div style={{
        backgroundColor: 'var(--xp-bg-card)',
        borderBottom: '1px solid var(--xp-border-default)'
      }}>
        <div style={{ padding: `0 var(--xp-spacing-8)` }}>
          <nav style={{ display: 'flex' }}>
            {[
              { id: 'overview', name: 'Overview', icon: Activity },
              { id: 'live-ops', name: 'Live Operations', icon: MapPin },
              { id: 'performance', name: 'Performance', icon: TrendingUp },
              { id: 'bookings', name: 'Bookings', icon: Car },
              { id: 'safety', name: 'Safety', icon: Shield, count: 2 },
              { id: 'fraud', name: 'Fraud Detection', icon: AlertTriangle, count: 7 }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--xp-spacing-2)',
                  padding: 'var(--xp-spacing-4) var(--xp-spacing-6)',
                  border: 'none',
                  backgroundColor: 'transparent',
                  fontSize: 'var(--xp-font-size-body)',
                  fontWeight: 'var(--xp-font-weight-medium)',
                  color: activeTab === tab.id ? 'var(--xp-brand-primary)' : 'var(--xp-text-secondary)',
                  borderBottom: `2px solid ${activeTab === tab.id ? 'var(--xp-brand-primary)' : 'transparent'}`,
                  cursor: 'pointer',
                  transition: 'all var(--xp-duration-fast) var(--xp-easing-standard)'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.color = 'var(--xp-text-primary)';
                    e.currentTarget.style.borderBottomColor = 'var(--xp-color-gray-300)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.color = 'var(--xp-text-secondary)';
                    e.currentTarget.style.borderBottomColor = 'transparent';
                  }
                }}
              >
                <tab.icon style={{ width: '16px', height: '16px' }} />
                <span>{tab.name}</span>
                {tab.count && (
                  <span style={{
                    backgroundColor: 'var(--xp-status-critical)',
                    color: 'white',
                    fontSize: '10px',
                    fontWeight: 'var(--xp-font-weight-bold)',
                    padding: '2px 6px',
                    borderRadius: `${999}px`,
                    minWidth: '16px',
                    textAlign: 'center'
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main style={{ padding: 'var(--xp-spacing-8)' }}>
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--xp-spacing-8)' }}>
            {/* KPI Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 'var(--xp-spacing-6)'
            }}>
              {[
                { 
                  label: 'Active Drivers', 
                  value: '89', 
                  subtext: 'of 142 total',
                  trend: '+12.5%', 
                  icon: Users, 
                  color: 'var(--xp-status-success)'
                },
                { 
                  label: 'Active Rides', 
                  value: '67', 
                  subtext: 'in progress',
                  trend: '+8.5%', 
                  icon: Car, 
                  color: 'var(--xp-status-info)'
                },
                { 
                  label: 'Avg Wait Time', 
                  value: '3.2m', 
                  subtext: 'pickup time',
                  trend: '-8%', 
                  icon: Clock, 
                  color: 'var(--xp-status-warning)'
                },
                { 
                  label: 'Revenue Today', 
                  value: '₱127.4K', 
                  subtext: 'gross earnings',
                  trend: '+12.8%', 
                  icon: DollarSign, 
                  color: 'var(--xp-status-success)'
                },
                { 
                  label: 'Completed Trips', 
                  value: '1,247', 
                  subtext: 'today',
                  trend: '+15.2%', 
                  icon: CheckCircle, 
                  color: 'var(--xp-brand-primary)'
                }
              ].map((kpi, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor: 'var(--xp-bg-card)',
                    border: '1px solid var(--xp-border-default)',
                    borderRadius: `${12}px`,
                    padding: `${20}px`,
                    boxShadow: 'var(--xp-card-shadow)',
                    transition: 'all var(--xp-duration-fast) var(--xp-easing-standard)',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = 'var(--xp-elevation-2)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'var(--xp-card-shadow)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    justifyContent: 'space-between',
                    marginBottom: 'var(--xp-spacing-4)'
                  }}>
                    <div style={{
                      padding: 'var(--xp-spacing-3)',
                      backgroundColor: kpi.color,
                      borderRadius: `${16}px`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <kpi.icon style={{ width: '24px', height: '24px', color: 'white' }} />
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--xp-spacing-1)',
                      color: 'var(--xp-status-success)',
                      fontSize: 'var(--xp-font-size-caption)',
                      fontWeight: 'var(--xp-font-weight-medium)'
                    }}>
                      <ArrowUpRight style={{ width: '12px', height: '12px' }} />
                      <span>{kpi.trend}</span>
                    </div>
                  </div>
                  <div style={{
                    fontSize: 'var(--xp-font-size-h1)',
                    fontWeight: 'var(--xp-font-weight-bold)',
                    color: 'var(--xp-text-primary)',
                    marginBottom: 'var(--xp-spacing-2)'
                  }}>
                    {kpi.value}
                  </div>
                  <div style={{
                    fontSize: 'var(--xp-font-size-body)',
                    fontWeight: 'var(--xp-font-weight-semibold)',
                    color: 'var(--xp-text-primary)',
                    marginBottom: 'var(--xp-spacing-1)'
                  }}>
                    {kpi.label}
                  </div>
                  <div style={{
                    fontSize: 'var(--xp-font-size-caption)',
                    color: 'var(--xp-text-muted)'
                  }}>
                    {kpi.subtext}
                  </div>
                </div>
              ))}
            </div>

            {/* Performance Table */}
            <div style={{
              backgroundColor: 'var(--xp-bg-card)',
              border: '1px solid var(--xp-border-default)',
              borderRadius: `${12}px`,
              overflow: 'hidden',
              boxShadow: 'var(--xp-card-shadow)'
            }}>
              <div style={{
                padding: 'var(--xp-spacing-6) var(--xp-spacing-6)',
                borderBottom: '1px solid var(--xp-border-default)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <h3 style={{
                    fontSize: 'var(--xp-font-size-h3)',
                    fontWeight: 'var(--xp-font-weight-semibold)',
                    color: 'var(--xp-text-primary)',
                    margin: 0,
                    marginBottom: 'var(--xp-spacing-2)'
                  }}>
                    Live Service Performance
                  </h3>
                  <p style={{
                    fontSize: 'var(--xp-font-size-body)',
                    color: 'var(--xp-text-secondary)',
                    margin: 0
                  }}>
                    Real-time metrics across all vehicle types
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--xp-spacing-3)' }}>
                  {[
                    { Icon: Filter, label: 'Filter' },
                    { Icon: RefreshCw, label: 'Refresh' }
                  ].map(({ Icon, label }, index) => (
                    <button
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--xp-spacing-2)',
                        padding: 'var(--xp-spacing-2) var(--xp-spacing-4)',
                        fontSize: 'var(--xp-font-size-body)',
                        fontWeight: 'var(--xp-font-weight-medium)',
                        color: 'var(--xp-text-secondary)',
                        backgroundColor: 'var(--xp-bg-elevated)',
                        border: '1px solid var(--xp-border-default)',
                        borderRadius: `${8}px`,
                        cursor: 'pointer',
                        transition: 'all var(--xp-duration-fast) var(--xp-easing-standard)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--xp-color-gray-100)';
                        e.currentTarget.style.color = 'var(--xp-text-primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--xp-bg-elevated)';
                        e.currentTarget.style.color = 'var(--xp-text-secondary)';
                      }}
                    >
                      <Icon style={{ width: '16px', height: '16px' }} />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: 'var(--xp-font-size-body)' }}>
                  <thead style={{ backgroundColor: 'var(--xp-color-gray-50)' }}>
                    <tr>
                      {['Service Type', 'Available', 'Total', 'Active Rides', 'Utilization', 'Revenue', 'Actions'].map((header, index) => (
                        <th
                          key={index}
                          style={{
                            padding: 'var(--xp-spacing-4) var(--xp-spacing-6)',
                            textAlign: index === 0 ? 'left' : 'center',
                            fontSize: 'var(--xp-font-size-caption)',
                            fontWeight: 'var(--xp-font-weight-semibold)',
                            color: 'var(--xp-text-secondary)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { service: '🏍️ Motorcycle', available: 35, total: 58, active: 28, util: 60.3, revenue: '₱38.5K' },
                      { service: '🚗 Car', available: 28, total: 45, active: 21, util: 62.2, revenue: '₱48.9K' },
                      { service: '🚙 SUV', available: 15, total: 23, active: 12, util: 54.1, revenue: '₱28.7K' },
                      { service: '🚖 Taxi', available: 11, total: 16, active: 6, util: 48.5, revenue: '₱11.3K' }
                    ].map((row, index) => (
                      <tr
                        key={index}
                        style={{
                          borderBottom: '1px solid var(--xp-border-default)',
                          transition: 'background-color var(--xp-duration-fast) var(--xp-easing-standard)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--xp-table-row-hover)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <td style={{ padding: 'var(--xp-spacing-4) var(--xp-spacing-6)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--xp-spacing-3)' }}>
                            <span style={{ fontSize: '20px' }}>{row.service.split(' ')[0]}</span>
                            <div>
                              <div style={{
                                fontWeight: 'var(--xp-font-weight-semibold)',
                                color: 'var(--xp-text-primary)'
                              }}>
                                {row.service.substring(2)}
                              </div>
                              <div style={{
                                fontSize: 'var(--xp-font-size-caption)',
                                color: 'var(--xp-text-muted)'
                              }}>
                                {row.total} total vehicles
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: 'var(--xp-spacing-4) var(--xp-spacing-6)', textAlign: 'center' }}>
                          <div style={{
                            fontSize: '20px',
                            fontWeight: 'var(--xp-font-weight-bold)',
                            color: 'var(--xp-status-success)'
                          }}>
                            {row.available}
                          </div>
                        </td>
                        <td style={{ padding: 'var(--xp-spacing-4) var(--xp-spacing-6)', textAlign: 'center' }}>
                          <div style={{
                            fontSize: '16px',
                            color: 'var(--xp-text-secondary)'
                          }}>
                            {row.total}
                          </div>
                        </td>
                        <td style={{ padding: 'var(--xp-spacing-4) var(--xp-spacing-6)', textAlign: 'center' }}>
                          <div style={{
                            fontSize: '20px',
                            fontWeight: 'var(--xp-font-weight-bold)',
                            color: 'var(--xp-status-info)'
                          }}>
                            {row.active}
                          </div>
                        </td>
                        <td style={{ padding: 'var(--xp-spacing-4) var(--xp-spacing-6)', textAlign: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--xp-spacing-2)' }}>
                            <div style={{
                              width: '64px',
                              height: '8px',
                              backgroundColor: 'var(--xp-color-gray-200)',
                              borderRadius: '4px',
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                width: `${row.util}%`,
                                height: '100%',
                                backgroundColor: 'var(--xp-status-info)',
                                borderRadius: '4px',
                                transition: 'width var(--xp-duration-base) var(--xp-easing-standard)'
                              }}></div>
                            </div>
                            <span style={{
                              fontSize: 'var(--xp-font-size-caption)',
                              fontWeight: 'var(--xp-font-weight-semibold)',
                              color: 'var(--xp-text-secondary)'
                            }}>
                              {row.util}%
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: 'var(--xp-spacing-4) var(--xp-spacing-6)', textAlign: 'center' }}>
                          <div style={{
                            fontSize: '18px',
                            fontWeight: 'var(--xp-font-weight-bold)',
                            color: 'var(--xp-text-primary)'
                          }}>
                            {row.revenue}
                          </div>
                        </td>
                        <td style={{ padding: 'var(--xp-spacing-4) var(--xp-spacing-6)', textAlign: 'center' }}>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--xp-spacing-2)' }}>
                            {[Eye, MoreVertical].map((Icon, iconIndex) => (
                              <button
                                key={iconIndex}
                                style={{
                                  padding: 'var(--xp-spacing-2)',
                                  backgroundColor: 'transparent',
                                  border: 'none',
                                  borderRadius: `${8}px`,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'all var(--xp-duration-fast) var(--xp-easing-standard)'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = 'var(--xp-color-gray-100)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                              >
                                <Icon style={{ 
                                  width: '16px', 
                                  height: '16px', 
                                  color: 'var(--xp-text-muted)' 
                                }} />
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div style={{
                padding: 'var(--xp-spacing-3) var(--xp-spacing-6)',
                backgroundColor: 'var(--xp-color-gray-50)',
                borderTop: '1px solid var(--xp-border-default)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--xp-spacing-4)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--xp-spacing-2)' }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      backgroundColor: 'var(--xp-status-success)',
                      borderRadius: '50%',
                      animation: 'pulse 2s infinite'
                    }}></div>
                    <span style={{
                      fontSize: 'var(--xp-font-size-caption)',
                      fontWeight: 'var(--xp-font-weight-semibold)',
                      color: 'var(--xp-status-success)'
                    }}>
                      Live data streaming
                    </span>
                  </div>
                  <div style={{
                    fontSize: 'var(--xp-font-size-caption)',
                    color: 'var(--xp-text-muted)'
                  }}>
                    Last updated: just now
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--xp-spacing-3)' }}>
                  {[
                    { Icon: Download, label: 'Export', color: 'var(--xp-brand-primary)' },
                    { Icon: TrendingUp, label: 'Analytics', color: 'var(--xp-text-secondary)' }
                  ].map(({ Icon, label, color }, index) => (
                    <button
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--xp-spacing-2)',
                        padding: 'var(--xp-spacing-2) var(--xp-spacing-4)',
                        fontSize: 'var(--xp-font-size-caption)',
                        fontWeight: 'var(--xp-font-weight-semibold)',
                        color: 'white',
                        backgroundColor: color,
                        border: 'none',
                        borderRadius: `${8}px`,
                        cursor: 'pointer',
                        transition: 'all var(--xp-duration-fast) var(--xp-easing-standard)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = 'var(--xp-elevation-1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <Icon style={{ width: '14px', height: '14px' }} />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Other tabs - placeholder content */}
        {activeTab !== 'overview' && (
          <div style={{
            backgroundColor: 'var(--xp-bg-card)',
            border: '1px solid var(--xp-border-default)',
            borderRadius: `${12}px`,
            padding: 'var(--xp-spacing-12)',
            textAlign: 'center',
            boxShadow: 'var(--xp-card-shadow)'
          }}>
            <div style={{ maxWidth: '400px', margin: '0 auto' }}>
              <div style={{
                width: '80px',
                height: '80px',
                backgroundColor: 'var(--xp-brand-primary)',
                borderRadius: `${20}px`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto var(--xp-spacing-6) auto',
                boxShadow: 'var(--xp-elevation-2)'
              }}>
                {activeTab === 'live-ops' && <MapPin style={{ width: '40px', height: '40px', color: 'white' }} />}
                {activeTab === 'performance' && <TrendingUp style={{ width: '40px', height: '40px', color: 'white' }} />}
                {activeTab === 'bookings' && <Car style={{ width: '40px', height: '40px', color: 'white' }} />}
                {activeTab === 'safety' && <Shield style={{ width: '40px', height: '40px', color: 'white' }} />}
                {activeTab === 'fraud' && <AlertTriangle style={{ width: '40px', height: '40px', color: 'white' }} />}
              </div>
              
              <h3 style={{
                fontSize: 'var(--xp-font-size-h2)',
                fontWeight: 'var(--xp-font-weight-semibold)',
                color: 'var(--xp-text-primary)',
                margin: '0 0 var(--xp-spacing-4) 0'
              }}>
                {activeTab === 'live-ops' && 'Live Operations Center'}
                {activeTab === 'performance' && 'Performance Analytics'}
                {activeTab === 'bookings' && 'Booking Management'}
                {activeTab === 'safety' && 'Safety & Emergency Response'}
                {activeTab === 'fraud' && 'Fraud Detection System'}
              </h3>
              
              <p style={{
                fontSize: 'var(--xp-font-size-body)',
                color: 'var(--xp-text-secondary)',
                margin: '0 0 var(--xp-spacing-6) 0',
                lineHeight: 'var(--xp-line-height-relaxed)'
              }}>
                {activeTab === 'live-ops' && 'Real-time map view and driver dispatch management'}
                {activeTab === 'performance' && 'Detailed analytics and KPI tracking across all services'}
                {activeTab === 'bookings' && 'Advanced booking management and trip monitoring'}
                {activeTab === 'safety' && `${2} active SOS alerts requiring immediate attention`}
                {activeTab === 'fraud' && `${7} suspicious activities detected and under investigation`}
              </p>
              
              <button style={{
                backgroundColor: 'var(--xp-button-primary-bg)',
                color: 'var(--xp-button-primary-text)',
                border: 'none',
                borderRadius: `${8}px`,
                padding: `0 ${16}px`,
                height: `${40}px`,
                fontSize: 'var(--xp-font-size-body)',
                fontWeight: 'var(--xp-font-weight-semibold)',
                cursor: 'pointer',
                transition: 'all var(--xp-duration-fast) var(--xp-easing-standard)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--xp-button-primary-hover)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'var(--xp-elevation-2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--xp-button-primary-bg)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                {(activeTab === 'safety' || activeTab === 'fraud') ? 'View Alerts' : 'Coming Soon'}
              </button>
            </div>
          </div>
        )}
      </main>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
};

export default DashboardPage;