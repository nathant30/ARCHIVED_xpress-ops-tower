'use client';

/**
 * Command Center Dashboard
 * Real-time operations dashboard with live map, KPIs, alerts, and activity feed
 * Built by Agent 10 - Critical Frontend UI Developer
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  Activity,
  Users,
  Car,
  Shield,
  AlertTriangle,
  Bell,
  Volume2,
  VolumeX,
  RefreshCw,
  Zap,
  MapPin,
  Clock,
  Eye,
  EyeOff,
  Radio,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCommandCenterStore } from '@/stores/commandCenterStore';
import { useWebSocketConnection } from '@/hooks/useWebSocketConnection';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { useRouter } from 'next/navigation';

// Mock data for development
const MOCK_KPIS = {
  activeRides: 67,
  availableDrivers: 89,
  activeIncidents: 2,
  fleetUtilization: 78,
};

const MOCK_VEHICLES = Array.from({ length: 275 }, (_, i) => ({
  id: `V-${String(i + 1).padStart(3, '0')}`,
  driverId: `D-${String(i + 1).padStart(4, '0')}`,
  latitude: 14.5995 + (Math.random() - 0.5) * 0.5,
  longitude: 120.9842 + (Math.random() - 0.5) * 0.5,
  status: ['available', 'on_trip', 'offline'][Math.floor(Math.random() * 3)] as 'available' | 'on_trip' | 'offline',
  speed: Math.random() * 60,
  bearing: Math.random() * 360,
  timestamp: new Date().toISOString(),
}));

const MOCK_ALERTS = [
  {
    id: 'ALT-001',
    type: 'critical' as const,
    title: 'SOS Alert - Driver Emergency',
    description: 'Driver D-0234 activated SOS button in District 3',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    resolved: false,
    incidentId: 'INC-2026-001',
  },
  {
    id: 'ALT-002',
    type: 'warning' as const,
    title: 'Fleet Utilization Below Target',
    description: 'Current utilization 78% (target: 85%)',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    resolved: false,
  },
];

const MOCK_ACTIVITIES = [
  {
    id: 'ACT-001',
    type: 'ride_completed' as const,
    title: 'Ride Completed',
    description: 'Driver D-0123 completed ride to Makati CBD',
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
  {
    id: 'ACT-002',
    type: 'driver_online' as const,
    title: 'Driver Online',
    description: 'Driver D-0456 came online in District 5',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: 'ACT-003',
    type: 'incident_created' as const,
    title: 'Incident Created',
    description: 'New incident INC-2026-001 - Driver SOS alert',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
];

const CommandCenterPage = () => {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  // Check feature flag
  useEffect(() => {
    setIsClient(true);
    if (!isFeatureEnabled('commandCenter')) {
      router.push('/dashboard');
    }
  }, [router]);

  // Zustand store
  const {
    kpis,
    vehicles,
    alerts,
    activities,
    connected,
    connectionQuality,
    godMode,
    soundEnabled,
    autoRefresh,
    setKPIs,
    setVehicles,
    setAlerts,
    setActivities,
    setConnectionState,
    toggleGodMode,
    toggleSound,
  } = useCommandCenterStore();

  // WebSocket connection
  const {
    connected: wsConnected,
    connectionQuality: wsQuality,
    on,
    emit,
  } = useWebSocketConnection({
    autoConnect: true,
    subscriptions: ['command-center'],
  });

  // Update connection state when WebSocket changes
  useEffect(() => {
    setConnectionState(wsConnected, wsQuality);
  }, [wsConnected, wsQuality, setConnectionState]);

  // Load initial data
  useEffect(() => {
    if (!isClient) return;

    // Load mock data for development
    setKPIs(MOCK_KPIS);
    setVehicles(MOCK_VEHICLES);
    setAlerts(MOCK_ALERTS);
    setActivities(MOCK_ACTIVITIES);
  }, [isClient, setKPIs, setVehicles, setAlerts, setActivities]);

  // Auto-refresh KPIs every 10 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Simulate KPI updates
      setKPIs({
        activeRides: MOCK_KPIS.activeRides + Math.floor(Math.random() * 10 - 5),
        availableDrivers: MOCK_KPIS.availableDrivers + Math.floor(Math.random() * 10 - 5),
        activeIncidents: MOCK_KPIS.activeIncidents,
        fleetUtilization: MOCK_KPIS.fleetUtilization + Math.floor(Math.random() * 4 - 2),
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [autoRefresh, setKPIs]);

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Radio className="h-8 w-8 text-blue-600" />
            Command Center
          </h1>
          <p className="text-gray-600 mt-1">
            Real-time operations dashboard • 275 vehicles monitored
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Connection Status */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
            connected
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}>
            <div className={`h-2 w-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-sm font-medium">
              {connected ? `Connected (${connectionQuality})` : 'Disconnected'}
            </span>
          </div>

          {/* Sound Toggle */}
          <Button
            variant={soundEnabled ? 'default' : 'outline'}
            size="icon"
            onClick={toggleSound}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>

          {/* God Mode Toggle */}
          <Button
            variant={godMode ? 'destructive' : 'outline'}
            size="sm"
            onClick={toggleGodMode}
            className="gap-2"
          >
            {godMode ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            God Mode {godMode ? 'ON' : 'OFF'}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Rides</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{kpis?.activeRides || 0}</h3>
                <p className="text-sm text-green-600 mt-1">↑ 8.3% from last hour</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Car className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Available Drivers</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{kpis?.availableDrivers || 0}</h3>
                <p className="text-sm text-green-600 mt-1">↑ 5.2% from last hour</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Incidents</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{kpis?.activeIncidents || 0}</h3>
                <p className="text-sm text-gray-600 mt-1">1 Critical, 1 High</p>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Fleet Utilization</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{kpis?.fleetUtilization || 0}%</h3>
                <p className="text-sm text-yellow-600 mt-1">Below target (85%)</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Activity className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Map */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Live Fleet Map (275 vehicles)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gradient-to-br from-blue-50 to-slate-100 rounded-lg p-12 text-center border-2 border-dashed border-gray-300">
            <div className="text-6xl mb-4">🗺️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Interactive Map</h3>
            <p className="text-gray-600 mb-4">
              Real-time vehicle tracking with Mapbox integration
            </p>
            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto text-sm">
              <div className="bg-white rounded-lg p-3">
                <div className="h-2 w-2 bg-green-500 rounded-full mx-auto mb-2"></div>
                <p className="font-medium text-gray-900">{vehicles.filter(v => v.status === 'available').length}</p>
                <p className="text-gray-600">Available</p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <div className="h-2 w-2 bg-blue-500 rounded-full mx-auto mb-2"></div>
                <p className="font-medium text-gray-900">{vehicles.filter(v => v.status === 'on_trip').length}</p>
                <p className="text-gray-600">On Trip</p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <div className="h-2 w-2 bg-gray-500 rounded-full mx-auto mb-2"></div>
                <p className="font-medium text-gray-900">{vehicles.filter(v => v.status === 'offline').length}</p>
                <p className="text-gray-600">Offline</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts and Activity Feed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Alerts Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Critical Alerts
              </span>
              <Badge variant="destructive">{alerts.filter(a => !a.resolved).length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No active alerts</p>
                </div>
              ) : (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg border-l-4 ${
                      alert.type === 'critical'
                        ? 'bg-red-50 border-red-500'
                        : alert.type === 'warning'
                        ? 'bg-yellow-50 border-yellow-500'
                        : 'bg-blue-50 border-blue-500'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant={
                              alert.type === 'critical'
                                ? 'destructive'
                                : alert.type === 'warning'
                                ? 'default'
                                : 'secondary'
                            }
                            className="text-xs"
                          >
                            {alert.type.toUpperCase()}
                          </Badge>
                          <span className="text-xs text-gray-600">{formatTime(alert.timestamp)}</span>
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-1">{alert.title}</h4>
                        <p className="text-sm text-gray-700">{alert.description}</p>
                      </div>
                      {!alert.resolved && (
                        <Button size="sm" variant="ghost">
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activities.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No recent activity</p>
                </div>
              ) : (
                activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        activity.type === 'ride_completed'
                          ? 'bg-green-100'
                          : activity.type === 'driver_online'
                          ? 'bg-blue-100'
                          : activity.type === 'incident_created'
                          ? 'bg-red-100'
                          : 'bg-gray-100'
                      }`}
                    >
                      {activity.type === 'ride_completed' && <Car className="h-4 w-4 text-green-600" />}
                      {activity.type === 'driver_online' && <Users className="h-4 w-4 text-blue-600" />}
                      {activity.type === 'incident_created' && <AlertTriangle className="h-4 w-4 text-red-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">{activity.title}</p>
                      <p className="text-sm text-gray-600">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatTime(activity.timestamp)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CommandCenterPage;
