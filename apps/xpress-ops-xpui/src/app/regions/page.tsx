'use client';

import React, { useState } from 'react';
import { 
  MapPin, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Activity, 
  AlertCircle,
  CheckCircle,
  Brain,
  BarChart3,
  Eye,
  Filter,
  Search,
  Grid,
  List,
  ChevronRight,
  Target,
  Building,
  Award
} from 'lucide-react';

export default function RegionsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [searchTerm, setSearchTerm] = useState('');

  const tabs = [
    { id: 'overview', name: 'Overview', icon: MapPin },
    { id: 'performance', name: 'Performance', icon: BarChart3 },
    { id: 'analytics', name: 'Analytics', icon: Activity },
    { id: 'insights', name: 'AI Insights', icon: Brain }
  ];

  // Sample regions data
  const regions = [
    {
      id: 'NCR',
      name: 'Metro Manila',
      status: 'active',
      tier: 1,
      population: '13.4M',
      revenue: 2250000,
      growth: 15.2,
      marketShare: 42,
      aiHealthScore: 95,
      activeDrivers: 8500,
      dailyTrips: 45000,
      expansion_manager: 'Maria Santos'
    },
    {
      id: 'CEB',
      name: 'Cebu Metro',
      status: 'active',
      tier: 2,
      population: '2.8M',
      revenue: 1420000,
      growth: 25.8,
      marketShare: 28,
      aiHealthScore: 85,
      activeDrivers: 3200,
      dailyTrips: 18500,
      expansion_manager: 'Juan Alvarez'
    },
    {
      id: 'DAV',
      name: 'Davao Region',
      status: 'pilot',
      tier: 3,
      population: '1.8M',
      revenue: 485000,
      growth: 45.2,
      marketShare: 12,
      aiHealthScore: 72,
      activeDrivers: 850,
      dailyTrips: 6500,
      expansion_manager: 'Anna Reyes'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'var(--xp-status-success)';
      case 'pilot': return 'var(--xp-status-warning)';
      case 'paused': return 'var(--xp-status-critical)';
      default: return 'var(--xp-text-secondary)';
    }
  };

  const getTierBadge = (tier: number) => {
    const colors = {
      1: 'var(--xp-chart-palette-1)',
      2: 'var(--xp-chart-palette-2)',
      3: 'var(--xp-chart-palette-3)'
    };
    return colors[tier as keyof typeof colors] || 'var(--xp-text-secondary)';
  };

  const filteredRegions = regions.filter(region =>
    region.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    region.expansion_manager.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--xp-spacing-4)'
        }}>
          <div>
            <h1 style={{
              fontSize: 'var(--xp-text-2xl)',
              fontWeight: 'var(--xp-font-weight-bold)',
              color: 'var(--xp-text-primary)',
              marginBottom: 'var(--xp-spacing-2)'
            }}>
              Regional Analytics
            </h1>
            <p style={{
              color: 'var(--xp-text-secondary)',
              fontSize: 'var(--xp-text-base)'
            }}>
              Comprehensive regional performance and expansion analytics
            </p>
          </div>
          
          {/* Controls */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--xp-spacing-3)',
            flexWrap: 'wrap'
          }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search 
                size={16} 
                style={{
                  color: 'var(--xp-text-tertiary)',
                  position: 'absolute',
                  left: 'var(--xp-spacing-3)',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none'
                }} 
              />
              <input
                type="text"
                placeholder="Search regions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  paddingLeft: 'calc(var(--xp-spacing-3) * 2 + 16px)',
                  paddingRight: 'var(--xp-spacing-4)',
                  paddingTop: 'var(--xp-spacing-2)',
                  paddingBottom: 'var(--xp-spacing-2)',
                  border: `1px solid var(--xp-border-default)`,
                  borderRadius: 'var(--xp-radius-md)px',
                  fontSize: 'var(--xp-text-sm)',
                  backgroundColor: 'var(--xp-input-bg)',
                  color: 'var(--xp-text-primary)',
                  outline: 'none',
                  minWidth: '200px'
                }}
              />
            </div>

            {/* View Toggle */}
            <div style={{
              display: 'flex',
              backgroundColor: 'var(--xp-bg-elevated)',
              border: `1px solid var(--xp-border-default)`,
              borderRadius: 'var(--xp-radius-md)px',
              overflow: 'hidden'
            }}>
              <button
                onClick={() => setViewMode('grid')}
                style={{
                  padding: 'var(--xp-spacing-2)',
                  backgroundColor: viewMode === 'grid' ? 'var(--xp-primary)' : 'transparent',
                  color: viewMode === 'grid' ? 'white' : 'var(--xp-text-secondary)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'all 0.2s ease'
                }}
              >
                <Grid size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                style={{
                  padding: 'var(--xp-spacing-2)',
                  backgroundColor: viewMode === 'list' ? 'var(--xp-primary)' : 'transparent',
                  color: viewMode === 'list' ? 'white' : 'var(--xp-text-secondary)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'all 0.2s ease'
                }}
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 'var(--xp-spacing-4)',
        marginBottom: 'var(--xp-spacing-6)'
      }}>
        <div style={{
          backgroundColor: 'var(--xp-bg-card)',
          borderRadius: 'var(--xp-radius-lg)px',
          padding: 'var(--xp-spacing-4)',
          boxShadow: 'var(--xp-elevation-1)',
          border: `1px solid var(--xp-border-default)`
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--xp-spacing-2)',
            marginBottom: 'var(--xp-spacing-2)'
          }}>
            <MapPin size={20} style={{ color: 'var(--xp-chart-palette-1)' }} />
            <span style={{
              fontSize: 'var(--xp-text-sm)',
              color: 'var(--xp-text-secondary)',
              fontWeight: 'var(--xp-font-weight-medium)'
            }}>
              Total Regions
            </span>
          </div>
          <div style={{
            fontSize: 'var(--xp-text-2xl)',
            fontWeight: 'var(--xp-font-weight-bold)',
            color: 'var(--xp-chart-palette-1)'
          }}>
            {regions.length}
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--xp-bg-card)',
          borderRadius: 'var(--xp-radius-lg)px',
          padding: 'var(--xp-spacing-4)',
          boxShadow: 'var(--xp-elevation-1)',
          border: `1px solid var(--xp-border-default)`
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--xp-spacing-2)',
            marginBottom: 'var(--xp-spacing-2)'
          }}>
            <DollarSign size={20} style={{ color: 'var(--xp-status-success)' }} />
            <span style={{
              fontSize: 'var(--xp-text-sm)',
              color: 'var(--xp-text-secondary)',
              fontWeight: 'var(--xp-font-weight-medium)'
            }}>
              Total Revenue
            </span>
          </div>
          <div style={{
            fontSize: 'var(--xp-text-2xl)',
            fontWeight: 'var(--xp-font-weight-bold)',
            color: 'var(--xp-status-success)'
          }}>
            ₱{(regions.reduce((sum, r) => sum + r.revenue, 0) / 1000000).toFixed(1)}M
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--xp-bg-card)',
          borderRadius: 'var(--xp-radius-lg)px',
          padding: 'var(--xp-spacing-4)',
          boxShadow: 'var(--xp-elevation-1)',
          border: `1px solid var(--xp-border-default)`
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--xp-spacing-2)',
            marginBottom: 'var(--xp-spacing-2)'
          }}>
            <Users size={20} style={{ color: 'var(--xp-chart-palette-2)' }} />
            <span style={{
              fontSize: 'var(--xp-text-sm)',
              color: 'var(--xp-text-secondary)',
              fontWeight: 'var(--xp-font-weight-medium)'
            }}>
              Active Drivers
            </span>
          </div>
          <div style={{
            fontSize: 'var(--xp-text-2xl)',
            fontWeight: 'var(--xp-font-weight-bold)',
            color: 'var(--xp-chart-palette-2)'
          }}>
            {regions.reduce((sum, r) => sum + r.activeDrivers, 0).toLocaleString()}
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--xp-bg-card)',
          borderRadius: 'var(--xp-radius-lg)px',
          padding: 'var(--xp-spacing-4)',
          boxShadow: 'var(--xp-elevation-1)',
          border: `1px solid var(--xp-border-default)`
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--xp-spacing-2)',
            marginBottom: 'var(--xp-spacing-2)'
          }}>
            <Activity size={20} style={{ color: 'var(--xp-chart-palette-3)' }} />
            <span style={{
              fontSize: 'var(--xp-text-sm)',
              color: 'var(--xp-text-secondary)',
              fontWeight: 'var(--xp-font-weight-medium)'
            }}>
              Daily Trips
            </span>
          </div>
          <div style={{
            fontSize: 'var(--xp-text-2xl)',
            fontWeight: 'var(--xp-font-weight-bold)',
            color: 'var(--xp-chart-palette-3)'
          }}>
            {regions.reduce((sum, r) => sum + r.dailyTrips, 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Regions Grid/List */}
      <div style={{
        backgroundColor: 'var(--xp-bg-card)',
        borderRadius: 'var(--xp-radius-lg)px',
        boxShadow: 'var(--xp-elevation-2)',
        padding: 'var(--xp-spacing-6)',
        border: `1px solid var(--xp-border-default)`
      }}>
        <h3 style={{
          fontSize: 'var(--xp-text-lg)',
          fontWeight: 'var(--xp-font-weight-semibold)',
          color: 'var(--xp-text-primary)',
          marginBottom: 'var(--xp-spacing-4)'
        }}>
          Regional Performance
        </h3>

        {viewMode === 'grid' ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: 'var(--xp-spacing-4)'
          }}>
            {filteredRegions.map(region => (
              <div
                key={region.id}
                style={{
                  backgroundColor: 'var(--xp-bg-elevated)',
                  borderRadius: 'var(--xp-radius-md)px',
                  padding: 'var(--xp-spacing-4)',
                  border: `1px solid var(--xp-border-default)`,
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = 'var(--xp-elevation-3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Region Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 'var(--xp-spacing-3)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--xp-spacing-2)'
                  }}>
                    <div style={{
                      padding: 'var(--xp-spacing-2)',
                      backgroundColor: `${getTierBadge(region.tier)}20`,
                      borderRadius: 'var(--xp-radius-sm)px'
                    }}>
                      <MapPin size={16} style={{ color: getTierBadge(region.tier) }} />
                    </div>
                    <div>
                      <h4 style={{
                        fontSize: 'var(--xp-text-base)',
                        fontWeight: 'var(--xp-font-weight-semibold)',
                        color: 'var(--xp-text-primary)',
                        marginBottom: '2px'
                      }}>
                        {region.name}
                      </h4>
                      <p style={{
                        fontSize: 'var(--xp-text-xs)',
                        color: 'var(--xp-text-secondary)'
                      }}>
                        {region.population} • Tier {region.tier}
                      </p>
                    </div>
                  </div>
                  <div style={{
                    backgroundColor: `${getStatusColor(region.status)}20`,
                    color: getStatusColor(region.status),
                    padding: '4px 8px',
                    borderRadius: 'var(--xp-radius-sm)px',
                    fontSize: 'var(--xp-text-xs)',
                    fontWeight: 'var(--xp-font-weight-medium)',
                    textTransform: 'uppercase'
                  }}>
                    {region.status}
                  </div>
                </div>

                {/* Metrics */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 'var(--xp-spacing-3)',
                  marginBottom: 'var(--xp-spacing-3)'
                }}>
                  <div>
                    <div style={{
                      fontSize: 'var(--xp-text-lg)',
                      fontWeight: 'var(--xp-font-weight-bold)',
                      color: 'var(--xp-status-success)'
                    }}>
                      ₱{(region.revenue / 1000000).toFixed(1)}M
                    </div>
                    <div style={{
                      fontSize: 'var(--xp-text-xs)',
                      color: 'var(--xp-text-secondary)'
                    }}>
                      Revenue
                    </div>
                  </div>
                  <div>
                    <div style={{
                      fontSize: 'var(--xp-text-lg)',
                      fontWeight: 'var(--xp-font-weight-bold)',
                      color: region.growth > 20 ? 'var(--xp-status-success)' : 'var(--xp-chart-palette-2)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      +{region.growth}%
                      <TrendingUp size={14} />
                    </div>
                    <div style={{
                      fontSize: 'var(--xp-text-xs)',
                      color: 'var(--xp-text-secondary)'
                    }}>
                      Growth
                    </div>
                  </div>
                  <div>
                    <div style={{
                      fontSize: 'var(--xp-text-lg)',
                      fontWeight: 'var(--xp-font-weight-bold)',
                      color: 'var(--xp-chart-palette-3)'
                    }}>
                      {region.marketShare}%
                    </div>
                    <div style={{
                      fontSize: 'var(--xp-text-xs)',
                      color: 'var(--xp-text-secondary)'
                    }}>
                      Market Share
                    </div>
                  </div>
                  <div>
                    <div style={{
                      fontSize: 'var(--xp-text-lg)',
                      fontWeight: 'var(--xp-font-weight-bold)',
                      color: region.aiHealthScore > 90 ? 'var(--xp-status-success)' : 
                             region.aiHealthScore > 75 ? 'var(--xp-status-warning)' : 'var(--xp-status-critical)'
                    }}>
                      {region.aiHealthScore}
                    </div>
                    <div style={{
                      fontSize: 'var(--xp-text-xs)',
                      color: 'var(--xp-text-secondary)'
                    }}>
                      AI Health Score
                    </div>
                  </div>
                </div>

                {/* Manager */}
                <div style={{
                  paddingTop: 'var(--xp-spacing-3)',
                  borderTop: `1px solid var(--xp-border-default)`,
                  fontSize: 'var(--xp-text-sm)',
                  color: 'var(--xp-text-secondary)'
                }}>
                  Manager: <span style={{ color: 'var(--xp-text-primary)', fontWeight: 'var(--xp-font-weight-medium)' }}>
                    {region.expansion_manager}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--xp-spacing-2)'
          }}>
            {/* Table Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr',
              gap: 'var(--xp-spacing-4)',
              padding: 'var(--xp-spacing-3)',
              backgroundColor: 'var(--xp-bg-elevated)',
              borderRadius: 'var(--xp-radius-sm)px',
              fontSize: 'var(--xp-text-sm)',
              fontWeight: 'var(--xp-font-weight-semibold)',
              color: 'var(--xp-text-secondary)'
            }}>
              <div>Region</div>
              <div>Status</div>
              <div>Revenue</div>
              <div>Growth</div>
              <div>Market Share</div>
              <div>AI Score</div>
            </div>

            {/* Table Rows */}
            {filteredRegions.map(region => (
              <div
                key={region.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr',
                  gap: 'var(--xp-spacing-4)',
                  padding: 'var(--xp-spacing-3)',
                  borderRadius: 'var(--xp-radius-sm)px',
                  border: `1px solid var(--xp-border-default)`,
                  alignItems: 'center',
                  fontSize: 'var(--xp-text-sm)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--xp-table-row-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--xp-spacing-2)'
                }}>
                  <MapPin size={16} style={{ color: getTierBadge(region.tier) }} />
                  <div>
                    <div style={{
                      fontWeight: 'var(--xp-font-weight-medium)',
                      color: 'var(--xp-text-primary)'
                    }}>
                      {region.name}
                    </div>
                    <div style={{
                      fontSize: 'var(--xp-text-xs)',
                      color: 'var(--xp-text-secondary)'
                    }}>
                      {region.population}
                    </div>
                  </div>
                </div>
                <div style={{
                  backgroundColor: `${getStatusColor(region.status)}20`,
                  color: getStatusColor(region.status),
                  padding: '2px 6px',
                  borderRadius: 'var(--xp-radius-sm)px',
                  fontSize: 'var(--xp-text-xs)',
                  fontWeight: 'var(--xp-font-weight-medium)',
                  textTransform: 'uppercase',
                  textAlign: 'center'
                }}>
                  {region.status}
                </div>
                <div style={{
                  fontWeight: 'var(--xp-font-weight-semibold)',
                  color: 'var(--xp-status-success)'
                }}>
                  ₱{(region.revenue / 1000000).toFixed(1)}M
                </div>
                <div style={{
                  fontWeight: 'var(--xp-font-weight-semibold)',
                  color: region.growth > 20 ? 'var(--xp-status-success)' : 'var(--xp-chart-palette-2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  +{region.growth}%
                  <TrendingUp size={12} />
                </div>
                <div style={{
                  fontWeight: 'var(--xp-font-weight-semibold)',
                  color: 'var(--xp-chart-palette-3)'
                }}>
                  {region.marketShare}%
                </div>
                <div style={{
                  fontWeight: 'var(--xp-font-weight-semibold)',
                  color: region.aiHealthScore > 90 ? 'var(--xp-status-success)' : 
                         region.aiHealthScore > 75 ? 'var(--xp-status-warning)' : 'var(--xp-status-critical)'
                }}>
                  {region.aiHealthScore}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}