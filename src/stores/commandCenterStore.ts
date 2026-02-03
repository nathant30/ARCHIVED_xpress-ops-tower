/**
 * Command Center Zustand Store
 * Real-time state management for Command Center dashboard
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Types
export interface KPIMetrics {
  activeRides: number;
  availableDrivers: number;
  activeIncidents: number;
  fleetUtilization: number;
}

export interface VehicleLocation {
  id: string;
  driverId: string;
  latitude: number;
  longitude: number;
  status: 'available' | 'on_trip' | 'offline' | 'maintenance';
  speed: number;
  bearing: number;
  timestamp: string;
}

export interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  timestamp: string;
  resolved: boolean;
  incidentId?: string;
}

export interface ActivityEvent {
  id: string;
  type: 'ride_started' | 'ride_completed' | 'driver_online' | 'driver_offline' | 'incident_created' | 'incident_resolved';
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

interface CommandCenterState {
  // KPIs
  kpis: KPIMetrics | null;
  kpisLastUpdated: string | null;

  // Vehicle locations
  vehicles: VehicleLocation[];
  vehiclesLastUpdated: string | null;

  // Alerts
  alerts: Alert[];
  alertsLastUpdated: string | null;

  // Activity feed
  activities: ActivityEvent[];
  activitiesLastUpdated: string | null;

  // WebSocket connection state
  connected: boolean;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';

  // UI state
  godMode: boolean;
  soundEnabled: boolean;
  autoRefresh: boolean;
  refreshInterval: number; // seconds

  // Actions
  setKPIs: (kpis: KPIMetrics) => void;
  setVehicles: (vehicles: VehicleLocation[]) => void;
  updateVehicleLocation: (vehicleId: string, location: Partial<VehicleLocation>) => void;
  setAlerts: (alerts: Alert[]) => void;
  addAlert: (alert: Alert) => void;
  resolveAlert: (alertId: string) => void;
  setActivities: (activities: ActivityEvent[]) => void;
  addActivity: (activity: ActivityEvent) => void;
  setConnectionState: (connected: boolean, quality?: 'excellent' | 'good' | 'poor' | 'disconnected') => void;
  toggleGodMode: () => void;
  toggleSound: () => void;
  toggleAutoRefresh: () => void;
  setRefreshInterval: (seconds: number) => void;
  reset: () => void;
}

const initialState = {
  kpis: null,
  kpisLastUpdated: null,
  vehicles: [],
  vehiclesLastUpdated: null,
  alerts: [],
  alertsLastUpdated: null,
  activities: [],
  activitiesLastUpdated: null,
  connected: false,
  connectionQuality: 'disconnected' as const,
  godMode: false,
  soundEnabled: true,
  autoRefresh: true,
  refreshInterval: 10,
};

export const useCommandCenterStore = create<CommandCenterState>()(
  devtools(
    (set) => ({
      ...initialState,

      setKPIs: (kpis) => set({
        kpis,
        kpisLastUpdated: new Date().toISOString()
      }, false, 'setKPIs'),

      setVehicles: (vehicles) => set({
        vehicles,
        vehiclesLastUpdated: new Date().toISOString()
      }, false, 'setVehicles'),

      updateVehicleLocation: (vehicleId, location) => set((state) => ({
        vehicles: state.vehicles.map(v =>
          v.id === vehicleId ? { ...v, ...location, timestamp: new Date().toISOString() } : v
        ),
        vehiclesLastUpdated: new Date().toISOString()
      }), false, 'updateVehicleLocation'),

      setAlerts: (alerts) => set({
        alerts,
        alertsLastUpdated: new Date().toISOString()
      }, false, 'setAlerts'),

      addAlert: (alert) => set((state) => ({
        alerts: [alert, ...state.alerts].slice(0, 50), // Keep last 50 alerts
        alertsLastUpdated: new Date().toISOString()
      }), false, 'addAlert'),

      resolveAlert: (alertId) => set((state) => ({
        alerts: state.alerts.map(a =>
          a.id === alertId ? { ...a, resolved: true } : a
        ),
        alertsLastUpdated: new Date().toISOString()
      }), false, 'resolveAlert'),

      setActivities: (activities) => set({
        activities,
        activitiesLastUpdated: new Date().toISOString()
      }, false, 'setActivities'),

      addActivity: (activity) => set((state) => ({
        activities: [activity, ...state.activities].slice(0, 50), // Keep last 50 activities
        activitiesLastUpdated: new Date().toISOString()
      }), false, 'addActivity'),

      setConnectionState: (connected, quality) => set({
        connected,
        connectionQuality: quality || (connected ? 'good' : 'disconnected')
      }, false, 'setConnectionState'),

      toggleGodMode: () => set((state) => ({
        godMode: !state.godMode
      }), false, 'toggleGodMode'),

      toggleSound: () => set((state) => ({
        soundEnabled: !state.soundEnabled
      }), false, 'toggleSound'),

      toggleAutoRefresh: () => set((state) => ({
        autoRefresh: !state.autoRefresh
      }), false, 'toggleAutoRefresh'),

      setRefreshInterval: (seconds) => set({
        refreshInterval: seconds
      }, false, 'setRefreshInterval'),

      reset: () => set(initialState, false, 'reset'),
    }),
    { name: 'CommandCenterStore' }
  )
);
