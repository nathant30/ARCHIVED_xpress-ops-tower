'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import LiveMap from '@/components/LiveMap';
import LiveRidesPanel from '@/components/features/LiveRidesPanel';
import SubNavigationTabs from '@/components/ui/SubNavigationTabs';

interface DashboardData {
  drivers: any[];
  bookings: any[];
  alerts: any[];
  locations?: {
    drivers: any[];
    bookings: any[];
    alerts: any[];
  };
}

const LiveRidesPage = () => {
  const [activeTab, setActiveTab] = useState('active');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const getTabCount = (tabId: string) => {
    if (!dashboardData) return 0;
    
    switch (tabId) {
      case 'active':
        return dashboardData.bookings?.filter(b => b.status === 'in_progress' || b.status === 'assigned').length || 0;
      case 'pending':
        return dashboardData.bookings?.filter(b => b.status === 'pending' || b.status === 'requested').length || 0;
      case 'completed':
        return dashboardData.bookings?.filter(b => b.status === 'completed').length || 0;
      case 'emergency':
        return dashboardData.alerts?.filter(a => a.priority === 'critical').length || 0;
      default:
        return 0;
    }
  };

  const tabs = [
    { 
      id: 'active', 
      name: 'Active', 
      icon: MapPin,
      count: getTabCount('active'),
      color: 'blue' as const
    },
    { 
      id: 'pending', 
      name: 'Pending', 
      icon: Clock,
      count: getTabCount('pending'),
      color: 'yellow' as const
    },
    { 
      id: 'completed', 
      name: 'Completed', 
      icon: CheckCircle,
      count: getTabCount('completed'),
      color: 'green' as const
    },
    { 
      id: 'emergency', 
      name: 'Emergency', 
      icon: AlertTriangle,
      count: getTabCount('emergency'),
      color: 'red' as const
    }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [driversRes, bookingsRes, alertsRes, locationsRes] = await Promise.all([
          fetch('/api/drivers'),
          fetch('/api/bookings'),
          fetch('/api/alerts'),
          fetch('/api/locations')
        ]);

        const [drivers, bookings, alerts, locations] = await Promise.all([
          driversRes.json(),
          bookingsRes.json(),
          alertsRes.json(),
          locationsRes.json()
        ]);

        setDashboardData({
          drivers: drivers.data || [],
          bookings: bookings.data || [],
          alerts: alerts.data || [],
          locations: locations.data || { drivers: [], bookings: [], alerts: [] }
        });

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Auto-refresh every 10 seconds for live rides
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !dashboardData) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: 'var(--xp-bg-page)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--xp-font-family-base)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '2px solid var(--xp-brand-primary)',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto var(--xp-spacing-4)'
          }}></div>
          <p style={{
            color: 'var(--xp-text-secondary)',
            fontSize: 'var(--xp-font-size-body)',
            margin: 0
          }}>Loading Live Rides...</p>
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

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
        }}>Live Rides Dashboard</h1>
        <p style={{
          fontSize: 'var(--xp-font-size-body)',
          color: 'var(--xp-text-secondary)',
          margin: 'var(--xp-spacing-1) 0 0 0'
        }}>Real-time monitoring of active, pending, and completed rides</p>
      </header>

      <div style={{ padding: 'var(--xp-spacing-6)' }}>
        <div style={{ marginBottom: 'var(--xp-spacing-8)' }}>
          {/* Sub-navigation tabs */}
          <SubNavigationTabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>

        {/* Tab Content */}
        {activeTab === 'active' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: 'var(--xp-spacing-8)'
          }}>
            {/* Desktop: 2-column layout, Mobile: 1-column */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: 'var(--xp-spacing-8)'
            }}>
              {/* Left Column - Live Map */}
              <div style={{
                gridColumn: 'span 2',
                minHeight: '600px'
              }}>
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
                      fontSize: 'var(--xp-font-size-h2)',
                      fontWeight: 'var(--xp-font-weight-semibold)',
                      color: 'var(--xp-text-primary)',
                      margin: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--xp-spacing-3)',
                      marginBottom: 'var(--xp-spacing-2)'
                    }}>
                      <MapPin style={{ 
                        width: '24px', 
                        height: '24px', 
                        color: 'var(--xp-brand-primary)' 
                      }} />
                      Live Fleet Map
                    </h3>
                    <p style={{
                      fontSize: 'var(--xp-font-size-body)',
                      color: 'var(--xp-text-secondary)',
                      margin: 0
                    }}>Real-time tracking of active rides and available drivers</p>
                  </div>
                  <div style={{ height: '600px' }}>
                    <LiveMap 
                      drivers={dashboardData?.locations?.drivers || []}
                      alerts={dashboardData?.locations?.alerts || []}
                      bookings={dashboardData?.locations?.bookings || []}
                      className="h-full"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column - Active Rides Panel */}
              <div>
                <LiveRidesPanel
                  maxRides={12}
                  onTripSelect={(trip) => {}}
                  onEmergencyAlert={(tripId) => {}}
                  className="h-[700px]"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pending' && (
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
              }}>Pending Ride Requests</h3>
              <p style={{
                fontSize: 'var(--xp-font-size-body)',
                color: 'var(--xp-text-secondary)',
                margin: 0
              }}>Ride requests awaiting driver assignment</p>
            </div>
            <div style={{ padding: 'var(--xp-spacing-6)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--xp-spacing-4)' }}>
                {dashboardData?.bookings?.filter(b => b.status === 'pending' || b.status === 'requested').map((booking, index) => (
                  <div key={booking.id || index} style={{
                    border: '1px solid var(--xp-border-default)',
                    borderRadius: 'var(--xp-radius-lg)px',
                    padding: 'var(--xp-spacing-4)',
                    transition: 'background-color var(--xp-duration-base) var(--xp-easing-standard)',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--xp-table-row-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: 'var(--xp-spacing-2)'
                    }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{
                          fontWeight: 'var(--xp-font-weight-medium)',
                          fontSize: 'var(--xp-font-size-body)',
                          color: 'var(--xp-text-primary)',
                          margin: 0,
                          marginBottom: 'var(--xp-spacing-1)'
                        }}>Booking #{booking.bookingReference || booking.booking_reference || 'N/A'}</h4>
                        <p style={{
                          fontSize: 'var(--xp-font-size-caption)',
                          color: 'var(--xp-text-secondary)',
                          margin: 0,
                          marginBottom: '2px'
                        }}>{booking.pickupAddress || booking.pickup_address || 'Pickup location not specified'}</p>
                        <p style={{
                          fontSize: 'var(--xp-font-size-caption)',
                          color: 'var(--xp-text-secondary)',
                          margin: 0
                        }}>→ {booking.dropoffAddress || booking.dropoff_address || 'Dropoff location not specified'}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{
                          padding: 'var(--xp-spacing-1) var(--xp-spacing-3)',
                          borderRadius: 'var(--xp-radius-pill)px',
                          fontSize: 'var(--xp-font-size-caption)',
                          fontWeight: 'var(--xp-font-weight-medium)',
                          backgroundColor: 'var(--xp-chip-bg-warning)',
                          color: 'var(--xp-status-warning)'
                        }}>
                          {booking.status ? booking.status.replace('_', ' ') : 'Pending'}
                        </span>
                        <p style={{
                          fontSize: 'var(--xp-font-size-caption)',
                          color: 'var(--xp-text-muted)',
                          margin: 'var(--xp-spacing-1) 0 0 0'
                        }}>
                          Waiting: {Math.floor(Math.random() * 5) + 1}m
                        </p>
                      </div>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--xp-spacing-4)',
                      fontSize: 'var(--xp-font-size-caption)',
                      color: 'var(--xp-text-muted)'
                    }}>
                      <span>Service: {booking.serviceType?.replace('_', ' ') || booking.service_type?.replace('_', ' ') || 'Unknown'}</span>
                      <span>Customer: {booking.customerInfo?.name || booking.customer_name || 'Unknown'}</span>
                      <span>Fare: ₱{booking.totalFare || booking.total_fare || '0.00'}</span>
                    </div>
                  </div>
                ))}
                {(!dashboardData?.bookings?.filter(b => b.status === 'pending' || b.status === 'requested').length) && (
                  <div style={{
                    textAlign: 'center',
                    padding: 'var(--xp-spacing-8) 0',
                    color: 'var(--xp-text-muted)'
                  }}>
                    <Clock style={{
                      width: '32px',
                      height: '32px',
                      margin: '0 auto var(--xp-spacing-2)',
                      display: 'block',
                      color: 'var(--xp-text-muted)'
                    }} />
                    <p style={{
                      fontSize: 'var(--xp-font-size-body)',
                      margin: 0
                    }}>No pending ride requests</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'completed' && (
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
              }}>Completed Rides</h3>
              <p style={{
                fontSize: 'var(--xp-font-size-body)',
                color: 'var(--xp-text-secondary)',
                margin: 0
              }}>Recently completed ride trips</p>
            </div>
            <div style={{ padding: 'var(--xp-spacing-6)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--xp-spacing-4)' }}>
                {dashboardData?.bookings?.filter(b => b.status === 'completed').map((booking, index) => (
                  <div key={booking.id || index} style={{
                    border: '1px solid var(--xp-border-default)',
                    borderRadius: 'var(--xp-radius-lg)px',
                    padding: 'var(--xp-spacing-4)',
                    transition: 'background-color var(--xp-duration-base) var(--xp-easing-standard)',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--xp-table-row-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: 'var(--xp-spacing-2)'
                    }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{
                          fontWeight: 'var(--xp-font-weight-medium)',
                          fontSize: 'var(--xp-font-size-body)',
                          color: 'var(--xp-text-primary)',
                          margin: 0,
                          marginBottom: 'var(--xp-spacing-1)'
                        }}>Booking #{booking.bookingReference || booking.booking_reference || 'N/A'}</h4>
                        <p style={{
                          fontSize: 'var(--xp-font-size-caption)',
                          color: 'var(--xp-text-secondary)',
                          margin: 0,
                          marginBottom: '2px'
                        }}>{booking.pickupAddress || booking.pickup_address || 'Pickup location not specified'}</p>
                        <p style={{
                          fontSize: 'var(--xp-font-size-caption)',
                          color: 'var(--xp-text-secondary)',
                          margin: 0
                        }}>→ {booking.dropoffAddress || booking.dropoff_address || 'Dropoff location not specified'}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{
                          padding: 'var(--xp-spacing-1) var(--xp-spacing-3)',
                          borderRadius: 'var(--xp-radius-pill)px',
                          fontSize: 'var(--xp-font-size-caption)',
                          fontWeight: 'var(--xp-font-weight-medium)',
                          backgroundColor: 'var(--xp-chip-bg-success)',
                          color: 'var(--xp-status-success)'
                        }}>
                          Completed
                        </span>
                        <p style={{
                          fontSize: 'var(--xp-font-size-caption)',
                          color: 'var(--xp-text-muted)',
                          margin: 'var(--xp-spacing-1) 0 0 0'
                        }}>
                          {booking.createdAt ? new Date(booking.createdAt).toLocaleTimeString() : 'Recently'}
                        </p>
                      </div>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--xp-spacing-4)',
                      fontSize: 'var(--xp-font-size-caption)',
                      color: 'var(--xp-text-muted)'
                    }}>
                      <span>Service: {booking.serviceType?.replace('_', ' ') || booking.service_type?.replace('_', ' ') || 'Unknown'}</span>
                      <span>Total: ₱{booking.totalFare || booking.total_fare || '0.00'}</span>
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--xp-spacing-1)'
                      }}>
                        <span style={{ color: 'var(--xp-color-amber-500)' }}>⭐</span>
                        {Math.random() > 0.5 ? '5.0' : '4.8'}
                      </span>
                    </div>
                  </div>
                ))}
                {(!dashboardData?.bookings?.filter(b => b.status === 'completed').length) && (
                  <div style={{
                    textAlign: 'center',
                    padding: 'var(--xp-spacing-8) 0',
                    color: 'var(--xp-text-muted)'
                  }}>
                    <CheckCircle style={{
                      width: '32px',
                      height: '32px',
                      margin: '0 auto var(--xp-spacing-2)',
                      display: 'block',
                      color: 'var(--xp-text-muted)'
                    }} />
                    <p style={{
                      fontSize: 'var(--xp-font-size-body)',
                      margin: 0
                    }}>No completed rides available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'emergency' && (
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
              }}>Emergency Situations</h3>
              <p style={{
                fontSize: 'var(--xp-font-size-body)',
                color: 'var(--xp-text-secondary)',
                margin: 0
              }}>Active emergency alerts and critical incidents</p>
            </div>
            <div style={{ padding: 'var(--xp-spacing-6)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--xp-spacing-4)' }}>
                {dashboardData?.alerts?.filter(a => a.priority === 'critical').map((alert, index) => (
                  <div key={index} style={{
                    borderLeft: '4px solid var(--xp-status-critical)',
                    backgroundColor: 'var(--xp-chip-bg-critical)',
                    borderRadius: 'var(--xp-radius-lg)px',
                    padding: 'var(--xp-spacing-4)'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start'
                    }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{
                          fontWeight: 'var(--xp-font-weight-medium)',
                          fontSize: 'var(--xp-font-size-body)',
                          color: 'var(--xp-status-critical)',
                          margin: 0,
                          marginBottom: 'var(--xp-spacing-1)'
                        }}>{alert.title}</h4>
                        <p style={{
                          fontSize: 'var(--xp-font-size-caption)',
                          color: 'var(--xp-status-critical)',
                          margin: 0,
                          marginBottom: 'var(--xp-spacing-2)',
                          opacity: 0.8
                        }}>{alert.description}</p>
                        <p style={{
                          fontSize: 'var(--xp-font-size-caption)',
                          color: 'var(--xp-status-critical)',
                          margin: 0,
                          opacity: 0.7
                        }}>
                          Location: {alert.address || 'Unknown'}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{
                          padding: 'var(--xp-spacing-1) var(--xp-spacing-3)',
                          borderRadius: 'var(--xp-radius-pill)px',
                          fontSize: 'var(--xp-font-size-caption)',
                          fontWeight: 'var(--xp-font-weight-medium)',
                          backgroundColor: 'var(--xp-status-critical)',
                          color: 'var(--xp-bg-card)'
                        }}>
                          CRITICAL
                        </span>
                        <p style={{
                          fontSize: 'var(--xp-font-size-caption)',
                          color: 'var(--xp-status-critical)',
                          margin: 'var(--xp-spacing-1) 0 0 0',
                          opacity: 0.7
                        }}>{alert.status}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {(!dashboardData?.alerts?.filter(a => a.priority === 'critical').length) && (
                  <div style={{
                    textAlign: 'center',
                    padding: 'var(--xp-spacing-8) 0',
                    color: 'var(--xp-text-muted)'
                  }}>
                    <AlertTriangle style={{
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
                    }}>No active emergency alerts</p>
                    <p style={{
                      fontSize: 'var(--xp-font-size-caption)',
                      color: 'var(--xp-status-success)',
                      margin: 0
                    }}>All rides operating normally</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveRidesPage;