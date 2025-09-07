'use client';

import React, { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { 
  Activity, 
  Car, 
  Battery, 
  Gauge, 
  Fuel, 
  MapPin, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Zap,
  Navigation,
  Thermometer,
  Wifi,
  WifiOff
} from 'lucide-react';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/xpress/card';
import { StatusBadge } from '@/components/xpress/table';

import type { 
  VehicleTelemetryData, 
  OBDStatus,
  VehicleStatus 
} from '@/types/vehicles';

interface RealTimeVehicleStatusProps {
  vehicleId: string;
  vehicleCode: string;
  currentStatus: VehicleStatus;
  obdInstalled: boolean;
  className?: string;
}

interface VehicleLiveData {
  telemetry: VehicleTelemetryData | null;
  obdStatus: OBDStatus;
  lastUpdated: Date;
  isConnected: boolean;
}

const RealTimeVehicleStatus: React.FC<RealTimeVehicleStatusProps> = memo(({
  vehicleId,
  vehicleCode,
  currentStatus,
  obdInstalled,
  className
}) => {
  const [liveData, setLiveData] = useState<VehicleLiveData>({
    telemetry: null,
    obdStatus: 'not_installed',
    lastUpdated: new Date(),
    isConnected: false
  });
  
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');

  // Import the enhanced WebSocket hook
  const { 
    isConnected: wsConnected, 
    isConnecting: wsConnecting, 
    error: wsError, 
    lastMessage, 
    reconnectAttempts,
    connect,
    disconnect,
    reconnect,
    sendMessage
  } = useWebSocket(
    obdInstalled ? `/api/websocket/vehicles/${vehicleId}/telemetry` : undefined,
    {
      maxReconnectAttempts: 10,
      initialReconnectDelay: 1000,
      maxReconnectDelay: 30000,
      reconnectBackoffMultiplier: 1.5,
      autoReconnect: true
    }
  );

  // Real-time data updates from WebSocket
  useEffect(() => {
    if (!obdInstalled) return;

    // Update connection status based on WebSocket state
    if (wsConnecting) {
      setConnectionStatus('connecting');
    } else if (wsConnected) {
      setConnectionStatus('connected');
      setLiveData(prev => ({
        ...prev,
        isConnected: true,
        obdStatus: 'connected'
      }));
    } else {
      setConnectionStatus('disconnected');
      setLiveData(prev => ({
        ...prev,
        isConnected: false,
        obdStatus: wsError ? 'error' : 'disconnected'
      }));
    }
  }, [wsConnected, wsConnecting, wsError, obdInstalled]);

  // Memoized WebSocket message handler to prevent unnecessary re-renders
  const processWebSocketMessage = useCallback(() => {
    if (!lastMessage || !obdInstalled) return;

    try {
      const messageData = JSON.parse(lastMessage);
      
      if (messageData.type === 'telemetry' && messageData.vehicleId === vehicleId) {
        const telemetryData = messageData.data;
        
        setLiveData(prev => ({
          ...prev,
          telemetry: telemetryData,
          lastUpdated: new Date()
        }));
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }, [lastMessage, vehicleId, obdInstalled]);

  // Process incoming WebSocket messages with optimized dependency
  useEffect(() => {
    processWebSocketMessage();
  }, [processWebSocketMessage]);

  // Fallback mock data when WebSocket is not available or for demo purposes
  useEffect(() => {
    if (!obdInstalled) return;

    let intervalId: NodeJS.Timeout;

    // Use mock data if WebSocket is not connected (for demo/development)
    if (!wsConnected && !wsConnecting) {
      intervalId = setInterval(() => {
        const mockTelemetry: VehicleTelemetryData = {
          id: `telemetry-${Date.now()}`,
          vehicleId,
          deviceId: `obd-${vehicleId}`,
          location: {
            latitude: 14.5995 + (Math.random() - 0.5) * 0.01, // Manila area
            longitude: 120.9842 + (Math.random() - 0.5) * 0.01
          },
          speedKmh: Math.random() * 80,
          engineRpm: 800 + Math.random() * 2000,
          fuelLevelPercent: 30 + Math.random() * 70,
          engineTemperatureCelsius: 80 + Math.random() * 20,
          batteryVoltage: 12.0 + Math.random() * 2,
          harshAccelerationCount: Math.floor(Math.random() * 3),
          harshBrakingCount: Math.floor(Math.random() * 2),
          harshCorneringCount: Math.floor(Math.random() * 2),
          idleTimeMinutes: Math.floor(Math.random() * 30),
          activeDtcCodes: Math.random() > 0.9 ? ['P0420', 'P0171'] : [],
          pendingDtcCodes: [],
          dataQualityScore: 85 + Math.random() * 15,
          dataSource: 'obd',
          recordedAt: new Date(),
          receivedAt: new Date(),
          recordedDate: new Date(),
          heading: Math.random() * 360,
          altitudeMeters: 50 + Math.random() * 100
        };

        setLiveData(prev => ({
          ...prev,
          telemetry: mockTelemetry,
          lastUpdated: new Date()
        }));
      }, 5000); // Update every 5 seconds
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [vehicleId, obdInstalled, wsConnected, wsConnecting]);

  // Connection status indicator
  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="w-4 h-4 text-green-600" />;
      case 'connecting':
        return <Activity className="w-4 h-4 text-amber-600 animate-pulse" />;
      case 'disconnected':
        return <WifiOff className="w-4 h-4 text-red-600" />;
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Live';
      case 'connecting':
        return reconnectAttempts > 0 ? `Reconnecting... (${reconnectAttempts}/10)` : 'Connecting...';
      case 'disconnected':
        return wsError ? 'Connection Error' : 'Offline';
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-green-600';
      case 'connecting':
        return 'text-amber-600';
      case 'disconnected':
        return 'text-red-600';
    }
  };

  // Format time ago
  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  // Memoized status calculations to prevent unnecessary recalculations on every render
  const fuelLevelStatus = useMemo(() => {
    const level = liveData.telemetry?.fuelLevelPercent || 0;
    if (level < 20) return { color: 'text-red-600', bg: 'bg-red-100', status: 'Low' };
    if (level < 50) return { color: 'text-amber-600', bg: 'bg-amber-100', status: 'Medium' };
    return { color: 'text-green-600', bg: 'bg-green-100', status: 'Good' };
  }, [liveData.telemetry?.fuelLevelPercent]);

  const engineTemperatureStatus = useMemo(() => {
    const temp = liveData.telemetry?.engineTemperatureCelsius || 0;
    if (temp > 110) return { color: 'text-red-600', bg: 'bg-red-100', status: 'High' };
    if (temp > 100) return { color: 'text-amber-600', bg: 'bg-amber-100', status: 'Warm' };
    return { color: 'text-green-600', bg: 'bg-green-100', status: 'Normal' };
  }, [liveData.telemetry?.engineTemperatureCelsius]);

  if (!obdInstalled) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="w-5 h-5" />
            Vehicle Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Battery className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-2">No OBD device installed</p>
            <p className="text-sm text-gray-400">
              Install an OBD device to see real-time telemetry data
            </p>
            <div className="mt-4">
              <StatusBadge 
                status={currentStatus.replace('_', ' ').toUpperCase()}
                variant={currentStatus === 'active' ? 'success' : 'warning'}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Connection Status Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Car className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{vehicleCode}</h3>
                <div className="flex items-center gap-2 text-sm">
                  {getConnectionStatusIcon()}
                  <span className={getConnectionStatusColor()}>
                    {getConnectionStatusText()}
                  </span>
                  {liveData.isConnected && (
                    <span className="text-gray-500">
                      • Updated {getTimeAgo(liveData.lastUpdated)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <StatusBadge 
              status={currentStatus.replace('_', ' ').toUpperCase()}
              variant={currentStatus === 'active' ? 'success' : 'warning'}
            />
          </div>
        </CardContent>
      </Card>

      {/* Real-time Telemetry Data */}
      {liveData.telemetry && connectionStatus === 'connected' && (
        <>
          {/* Key Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Live Telemetry
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Speed */}
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <Gauge className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-600">
                    {liveData.telemetry.speedKmh?.toFixed(0) || 0}
                  </p>
                  <p className="text-sm text-blue-700">km/h</p>
                </div>

                {/* RPM */}
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <Zap className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-purple-600">
                    {liveData.telemetry.engineRpm?.toFixed(0) || 0}
                  </p>
                  <p className="text-sm text-purple-700">RPM</p>
                </div>

                {/* Fuel Level */}
                <div className={`text-center p-3 rounded-lg ${fuelLevelStatus.bg}`}>
                  <Fuel className={`w-6 h-6 mx-auto mb-2 ${fuelLevelStatus.color}`} />
                  <p className={`text-2xl font-bold ${fuelLevelStatus.color}`}>
                    {liveData.telemetry.fuelLevelPercent?.toFixed(0) || 0}%
                  </p>
                  <p className={`text-sm ${fuelLevelStatus.color}`}>
                    {fuelLevelStatus.status}
                  </p>
                </div>

                {/* Engine Temperature */}
                <div className={`text-center p-3 rounded-lg ${engineTemperatureStatus.bg}`}>
                  <Thermometer className={`w-6 h-6 mx-auto mb-2 ${engineTemperatureStatus.color}`} />
                  <p className={`text-2xl font-bold ${engineTemperatureStatus.color}`}>
                    {liveData.telemetry.engineTemperatureCelsius?.toFixed(0) || 0}°C
                  </p>
                  <p className={`text-sm ${engineTemperatureStatus.color}`}>
                    {engineTemperatureStatus.status}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location & Driving Behavior */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                {liveData.telemetry.location ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Latitude:</span>
                      <span className="font-medium">{liveData.telemetry.location.latitude.toFixed(6)}°</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Longitude:</span>
                      <span className="font-medium">{liveData.telemetry.location.longitude.toFixed(6)}°</span>
                    </div>
                    {liveData.telemetry.heading && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Heading:</span>
                        <span className="font-medium">{liveData.telemetry.heading.toFixed(0)}°</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Last Update:</span>
                      <span className="font-medium">{getTimeAgo(liveData.telemetry.recordedAt)}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">Location not available</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="w-5 h-5" />
                  Driving Behavior
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Harsh Acceleration:</span>
                    <div className="flex items-center gap-2">
                      {liveData.telemetry.harshAccelerationCount > 0 && (
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                      )}
                      <span className={`font-medium ${liveData.telemetry.harshAccelerationCount > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                        {liveData.telemetry.harshAccelerationCount}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Harsh Braking:</span>
                    <div className="flex items-center gap-2">
                      {liveData.telemetry.harshBrakingCount > 0 && (
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                      )}
                      <span className={`font-medium ${liveData.telemetry.harshBrakingCount > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                        {liveData.telemetry.harshBrakingCount}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Harsh Cornering:</span>
                    <div className="flex items-center gap-2">
                      {liveData.telemetry.harshCorneringCount > 0 && (
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                      )}
                      <span className={`font-medium ${liveData.telemetry.harshCorneringCount > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                        {liveData.telemetry.harshCorneringCount}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Idle Time:</span>
                    <span className="font-medium text-gray-900">
                      {liveData.telemetry.idleTimeMinutes} min
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Diagnostics & Alerts */}
          {(liveData.telemetry.activeDtcCodes.length > 0 || liveData.telemetry.pendingDtcCodes.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  Diagnostic Codes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {liveData.telemetry.activeDtcCodes.length > 0 && (
                    <div>
                      <h4 className="font-medium text-red-900 mb-2">Active Codes</h4>
                      <div className="flex flex-wrap gap-2">
                        {liveData.telemetry.activeDtcCodes.map((code, index) => (
                          <StatusBadge key={index} status={code} variant="error" />
                        ))}
                      </div>
                    </div>
                  )}
                  {liveData.telemetry.pendingDtcCodes.length > 0 && (
                    <div>
                      <h4 className="font-medium text-amber-900 mb-2">Pending Codes</h4>
                      <div className="flex flex-wrap gap-2">
                        {liveData.telemetry.pendingDtcCodes.map((code, index) => (
                          <StatusBadge key={index} status={code} variant="warning" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Data Quality */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Data Quality
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Quality Score:</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        liveData.telemetry.dataQualityScore >= 90 ? 'bg-green-500' :
                        liveData.telemetry.dataQualityScore >= 70 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${liveData.telemetry.dataQualityScore}%` }}
                    />
                  </div>
                  <span className="font-medium text-sm">
                    {liveData.telemetry.dataQualityScore.toFixed(1)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Connection Issues */}
      {connectionStatus === 'disconnected' && wsError && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-red-600">
                <XCircle className="w-5 h-5" />
                <div>
                  <p className="font-medium">Unable to connect to vehicle telemetry system</p>
                  <p className="text-sm text-gray-600 mt-1">{wsError}</p>
                  {reconnectAttempts >= 10 && (
                    <p className="text-sm text-gray-600">Maximum reconnection attempts reached</p>
                  )}
                </div>
              </div>
              <button
                onClick={reconnect}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Retry Connection
              </button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
});

// Display name for better debugging with React DevTools
RealTimeVehicleStatus.displayName = 'RealTimeVehicleStatus';

export default RealTimeVehicleStatus;