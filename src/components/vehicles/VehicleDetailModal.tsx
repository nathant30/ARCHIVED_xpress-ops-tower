'use client';

import React, { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { 
  Car, 
  Users, 
  Wrench, 
  Activity, 
  MapPin, 
  Fuel, 
  Calendar, 
  DollarSign, 
  AlertTriangle, 
  Shield, 
  Settings,
  Battery,
  Gauge,
  TrendingUp,
  CheckCircle,
  XCircle,
  Edit2,
  MoreHorizontal,
  FileText,
  Zap,
  Leaf,
  Navigation,
  X,
  RefreshCw
} from 'lucide-react';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/xpress/card';
import { Button } from '@/components/xpress/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { StatusBadge } from '@/components/xpress/table';

import type { 
  Vehicle, 
  VehicleOwnershipType,
  VehicleDriverAssignment,
  VehicleMaintenance,
  MaintenanceAlert,
  VehicleOBDDevice,
  VehicleTelemetryData,
  LTFRBCompliance,
  ComplianceAlert
} from '@/types/vehicles';

// Extended vehicle interface with detailed information
interface VehicleDetailData extends Vehicle {
  currentAssignment?: VehicleDriverAssignment;
  recentMaintenanceHistory: VehicleMaintenance[];
  activeAlerts: MaintenanceAlert[];
  complianceStatus: LTFRBCompliance;
  obdStatus?: VehicleOBDDevice;
  realtimeTelemetry?: VehicleTelemetryData;
  performanceMetrics: {
    dailyTrips: number;
    weeklyTrips: number;
    monthlyTrips: number;
    dailyRevenue: number;
    weeklyRevenue: number;
    monthlyRevenue: number;
    fuelEfficiencyTrend: number[];
    utilizationTrend: number[];
  };
}

interface VehicleDetailModalProps {
  vehicleId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (vehicleId: string) => void;
}

const VehicleDetailModal: React.FC<VehicleDetailModalProps> = memo(({
  vehicleId,
  isOpen,
  onClose,
  onEdit
}) => {
  const [vehicle, setVehicle] = useState<VehicleDetailData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showMobileTabMenu, setShowMobileTabMenu] = useState(false);

  // Load vehicle details
  useEffect(() => {
    if (vehicleId && isOpen) {
      fetchVehicleDetails();
    }
  }, [vehicleId, isOpen]);

  const fetchVehicleDetails = async () => {
    if (!vehicleId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/vehicles/${vehicleId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('This vehicle could not be found. It may have been removed or you may not have permission to view it.');
          return;
        } else if (response.status === 403) {
          setError('You don\'t have permission to view the details of this vehicle.');
          return;
        } else if (response.status >= 500) {
          setError('There\'s a temporary problem with our servers. Please try again in a few minutes.');
          return;
        }
      }
      
      const data = await response.json();
      
      if (data.success) {
        setVehicle(data.data.vehicle);
      } else {
        const errorMessages: Record<string, string> = {
          'VEHICLE_NOT_FOUND': 'This vehicle could not be found. It may have been removed or archived.',
          'INSUFFICIENT_PERMISSIONS': 'You don\'t have permission to view detailed information for this vehicle.',
          'REGION_ACCESS_DENIED': 'This vehicle is in a region you don\'t have access to.',
          'VEHICLE_DECOMMISSIONED': 'This vehicle has been decommissioned and is no longer in service.'
        };
        
        const friendlyMessage = errorMessages[data.code] || data.message || 
          'Unable to load vehicle details. Please try again.';
          
        setError(friendlyMessage);
      }
    } catch (error) {
      console.error('Failed to fetch vehicle details:', error);
      
      let errorMessage = 'Unable to load vehicle details. ';
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage += 'Please check your internet connection and try again.';
      } else if (error instanceof Error && error.message.includes('timeout')) {
        errorMessage += 'The request timed out. Please try refreshing the page.';
      } else {
        errorMessage += 'An unexpected error occurred. Please try again or contact support.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getOwnershipTypeInfo = (type: VehicleOwnershipType) => {
    const info = {
      xpress_owned: {
        label: 'Xpress Owned',
        description: 'Owned and operated by Xpress',
        color: 'bg-blue-100 text-blue-800',
        icon: <Car className="w-4 h-4" />
      },
      fleet_owned: {
        label: 'Fleet Owned',
        description: 'Third-party fleet operator',
        color: 'bg-purple-100 text-purple-800',
        icon: <Users className="w-4 h-4" />
      },
      operator_owned: {
        label: 'Operator Owned',
        description: 'Independent operator vehicle',
        color: 'bg-green-100 text-green-800',
        icon: <Shield className="w-4 h-4" />
      },
      driver_owned: {
        label: 'Driver Owned',
        description: 'Driver-owned vehicle',
        color: 'bg-amber-100 text-amber-800',
        icon: <Users className="w-4 h-4" />
      }
    };
    return info[type];
  };

  const renderOverviewTab = () => {
    if (!vehicle) return null;

    const ownershipInfo = getOwnershipTypeInfo(vehicle.ownershipType);

    return (
      <div className="space-y-6">
        {/* Vehicle Basic Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="w-5 h-5" />
                Vehicle Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Vehicle Code</label>
                  <p className="text-lg font-semibold text-gray-900">{vehicle.vehicleCode}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">License Plate</label>
                  <p className="text-lg font-semibold text-gray-900">{vehicle.licensePlate}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Make & Model</label>
                  <p className="text-gray-900">{vehicle.year} {vehicle.make} {vehicle.model}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Category</label>
                  <p className="text-gray-900 capitalize">{vehicle.category.replace('_', ' ')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Color</label>
                  <p className="text-gray-900">{vehicle.color}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Seating Capacity</label>
                  <p className="text-gray-900">{vehicle.seatingCapacity} passengers</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {ownershipInfo.icon}
                Ownership & Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Ownership Type</label>
                <div className="mt-1">
                  <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${ownershipInfo.color}`}>
                    {ownershipInfo.icon}
                    {ownershipInfo.label}
                  </span>
                  <p className="text-sm text-gray-600 mt-1">{ownershipInfo.description}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Current Status</label>
                  <div className="mt-1">
                    <StatusBadge 
                      status={vehicle.status.replace('_', ' ').toUpperCase()} 
                      variant={vehicle.status === 'active' ? 'success' : 'warning'}
                      aria-label={`Vehicle operational status: ${vehicle.status.replace('_', ' ')}`}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Condition Rating</label>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusBadge 
                      status={vehicle.conditionRating.toUpperCase()}
                      variant={vehicle.conditionRating === 'excellent' ? 'success' : 'warning'}
                      aria-label={`Vehicle physical condition: ${vehicle.conditionRating} (${vehicle.conditionScore} out of 100)`}
                    />
                    <span className="text-sm text-gray-600">({vehicle.conditionScore}/100)</span>
                  </div>
                </div>
              </div>

              {vehicle.fleetOwnerName && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Fleet Owner</label>
                  <p className="text-gray-900">{vehicle.fleetOwnerName}</p>
                </div>
              )}

              {vehicle.operatorOwnerName && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Operator Owner</label>
                  <p className="text-gray-900">{vehicle.operatorOwnerName}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Current Assignment & Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {vehicle.currentAssignment && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Current Assignment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{vehicle.currentAssignment.driverName}</p>
                    <p className="text-sm text-gray-600">Driver ID: {vehicle.currentAssignment.driverId}</p>
                  </div>
                  <StatusBadge 
                    status={vehicle.currentAssignment.assignmentType.toUpperCase()}
                    variant="default"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="text-gray-700">Valid From</label>
                    <p>{new Date(vehicle.currentAssignment.validFrom).toLocaleDateString()}</p>
                  </div>
                  {vehicle.currentAssignment.validUntil && (
                    <div>
                      <label className="text-gray-700">Valid Until</label>
                      <p>{new Date(vehicle.currentAssignment.validUntil).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Performance Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{vehicle.totalTrips}</p>
                  <p className="text-gray-600">Total Trips</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{vehicle.averageRating.toFixed(1)}</p>
                  <p className="text-gray-600">Avg Rating</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-600">{vehicle.utilizationRate.toFixed(1)}%</p>
                  <p className="text-gray-600">Utilization</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{vehicle.availabilityScore.toFixed(1)}%</p>
                  <p className="text-gray-600">Availability</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fuel & Environmental */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fuel className="w-5 h-5" />
                Fuel & Efficiency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Fuel Type</span>
                  <span className="font-medium capitalize">{vehicle.fuelType.replace('_', ' ')}</span>
                </div>
                {vehicle.fuelEfficiencyKmpl && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Efficiency</span>
                    <span className="font-medium">{vehicle.fuelEfficiencyKmpl} km/L</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Distance</span>
                  <span className="font-medium">{vehicle.totalDistanceKm.toLocaleString()} km</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Leaf className="w-5 h-5" />
                Environmental
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Carbon Emissions</span>
                  <span className="font-medium">{vehicle.carbonEmissionsKg} kg CO₂</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Daily Operating Hours</span>
                  <span className="font-medium">{vehicle.dailyOperatingHours} hours</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Financial
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {vehicle.acquisitionCost && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Acquisition Cost</span>
                    <span className="font-medium">₱{vehicle.acquisitionCost.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Maintenance Cost</span>
                  <span className="font-medium">₱{vehicle.totalMaintenanceCost.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderMaintenanceTab = () => {
    if (!vehicle) return null;

    return (
      <div className="space-y-6">
        {/* Maintenance Status Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="w-5 h-5" />
                Maintenance Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {vehicle.lastMaintenanceDate && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Last Service</span>
                    <span className="font-medium">
                      {new Date(vehicle.lastMaintenanceDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {vehicle.nextMaintenanceDue && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Next Service</span>
                    <span className="font-medium">
                      {new Date(vehicle.nextMaintenanceDue).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Active Alerts</span>
                  <span className={`font-medium ${vehicle.maintenanceAlertsCount > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                    {vehicle.maintenanceAlertsCount}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Maintenance Costs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Lifetime</span>
                  <span className="font-medium">₱{vehicle.totalMaintenanceCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Per Kilometer</span>
                  <span className="font-medium">
                    ₱{(vehicle.totalMaintenanceCost / vehicle.totalDistanceKm).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="primary" size="sm" fullWidth>
                  Schedule Maintenance
                </Button>
                <Button variant="secondary" size="sm" fullWidth>
                  View History
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Maintenance History */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Maintenance History</CardTitle>
          </CardHeader>
          <CardContent>
            {vehicle.recentMaintenanceHistory && vehicle.recentMaintenanceHistory.length > 0 ? (
              <div className="space-y-4">
                {vehicle.recentMaintenanceHistory.map((maintenance, index) => (
                  <div key={maintenance.id || index} className="border-l-4 border-blue-200 pl-4 py-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">{maintenance.maintenanceType}</h4>
                        <p className="text-sm text-gray-600">{maintenance.description}</p>
                        <p className="text-xs text-gray-500">
                          {maintenance.serviceProvider || 'N/A'} • 
                          {maintenance.completedDate ? new Date(maintenance.completedDate).toLocaleDateString() : 'Scheduled'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">₱{maintenance.totalCost?.toLocaleString() || '0'}</p>
                        <StatusBadge 
                          status={maintenance.status?.toUpperCase() || 'UNKNOWN'}
                          variant={maintenance.status === 'completed' ? 'success' : 'warning'}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No recent maintenance history available</p>
            )}
          </CardContent>
        </Card>

        {/* Active Alerts */}
        {vehicle.activeAlerts && vehicle.activeAlerts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Active Maintenance Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {vehicle.activeAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-amber-900">{alert.alertTitle}</h4>
                      <p className="text-sm text-amber-700">{alert.alertDescription}</p>
                    </div>
                    <StatusBadge 
                      status={alert.urgencyLevel.toUpperCase()}
                      variant={alert.urgencyLevel === 'critical' ? 'error' : 'warning'}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderTelematicsTab = () => {
    if (!vehicle) return null;

    return (
      <div className="space-y-6">
        {/* OBD Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Battery className="w-5 h-5" />
                OBD Device Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {vehicle.obdDeviceInstalled ? (
                <>
                  {vehicle.obdStatus && (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Device Status</span>
                        <StatusBadge 
                          status={vehicle.obdStatus.status.toUpperCase()}
                          variant={vehicle.obdStatus.status === 'connected' ? 'success' : 'warning'}
                        />
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Device Serial</span>
                        <span className="font-medium">{vehicle.obdStatus.deviceSerial}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Last Connection</span>
                        <span className="font-medium">
                          {vehicle.obdStatus.lastConnectionAt ? 
                            new Date(vehicle.obdStatus.lastConnectionAt).toLocaleString() : 'Never'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Data Quality</span>
                        <span className="font-medium">{vehicle.obdStatus.dataAccuracyRate?.toFixed(1) || 0}%</span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <Battery className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No OBD device installed</p>
                  <Button variant="primary" size="sm" className="mt-3">
                    Install OBD Device
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {vehicle.realtimeTelemetry && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Live Telemetry
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {vehicle.realtimeTelemetry.speedKmh || 0}
                    </p>
                    <p className="text-sm text-gray-600">km/h</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {vehicle.realtimeTelemetry.fuelLevelPercent || 0}%
                    </p>
                    <p className="text-sm text-gray-600">Fuel Level</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-amber-600">
                      {vehicle.realtimeTelemetry.engineTemperatureCelsius || 0}°C
                    </p>
                    <p className="text-sm text-gray-600">Engine Temp</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {vehicle.realtimeTelemetry.engineRpm || 0}
                    </p>
                    <p className="text-sm text-gray-600">RPM</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Driving Behavior Analysis */}
        {vehicle.realtimeTelemetry && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="w-5 h-5" />
                Driving Behavior Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <h4 className="font-medium text-red-900">Harsh Events</h4>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-red-700">
                      Acceleration: {vehicle.realtimeTelemetry.harshAccelerationCount}
                    </p>
                    <p className="text-sm text-red-700">
                      Braking: {vehicle.realtimeTelemetry.harshBrakingCount}
                    </p>
                    <p className="text-sm text-red-700">
                      Cornering: {vehicle.realtimeTelemetry.harshCorneringCount}
                    </p>
                  </div>
                </div>
                <div className="text-center p-4 bg-amber-50 rounded-lg">
                  <h4 className="font-medium text-amber-900">Idle Time</h4>
                  <p className="text-2xl font-bold text-amber-600 mt-2">
                    {vehicle.realtimeTelemetry.idleTimeMinutes}
                  </p>
                  <p className="text-sm text-amber-700">minutes today</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900">Location</h4>
                  {vehicle.realtimeTelemetry.location ? (
                    <div className="mt-2">
                      <p className="text-sm text-blue-700">
                        {vehicle.realtimeTelemetry.location.latitude.toFixed(4)}°N
                      </p>
                      <p className="text-sm text-blue-700">
                        {vehicle.realtimeTelemetry.location.longitude.toFixed(4)}°E
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-blue-700 mt-2">Location not available</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderComplianceTab = () => {
    if (!vehicle || !vehicle.complianceStatus) return null;

    const compliance = vehicle.complianceStatus;

    return (
      <div className="space-y-6">
        {/* Compliance Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Compliance Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-medium">Overall Status</span>
              <StatusBadge 
                status={compliance.overallComplianceStatus.toUpperCase()}
                variant={compliance.overallComplianceStatus === 'compliant' ? 'success' : 'error'}
              />
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  compliance.complianceScore >= 80 ? 'bg-green-500' :
                  compliance.complianceScore >= 60 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${compliance.complianceScore}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Compliance Score: {compliance.complianceScore}/100
            </p>
          </CardContent>
        </Card>

        {/* LTFRB Franchise */}
        <Card>
          <CardHeader>
            <CardTitle>LTFRB Franchise</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Franchise Number</label>
                <p className="font-medium">{compliance.franchiseNumber}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Franchise Type</label>
                <p className="font-medium">{compliance.franchiseType}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Issue Date</label>
                <p>{new Date(compliance.franchiseIssuedDate).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Expiry Date</label>
                <div className="flex items-center gap-2">
                  <p>{new Date(compliance.franchiseExpiryDate).toLocaleDateString()}</p>
                  <StatusBadge 
                    status={compliance.franchiseStatus.toUpperCase()}
                    variant={compliance.franchiseStatus === 'active' ? 'success' : 'error'}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Registration */}
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Registration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Registration Number</label>
                <p className="font-medium">{compliance.registrationNumber}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Registration Type</label>
                <p className="font-medium">{compliance.registrationType}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Registration Expiry</label>
                <p>{new Date(compliance.registrationExpiryDate).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">OR/CR Expiry</label>
                <p>{new Date(compliance.orCrExpiryDate).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Insurance */}
        <Card>
          <CardHeader>
            <CardTitle>Insurance Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {compliance.compulsoryInsurancePolicy && (
                <>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Compulsory Insurance</label>
                    <p className="font-medium">{compliance.compulsoryInsurancePolicy}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Compulsory Expiry</label>
                    <p>{new Date(compliance.compulsoryInsuranceExpiry).toLocaleDateString()}</p>
                  </div>
                </>
              )}
              {compliance.comprehensiveInsurancePolicy && (
                <>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Comprehensive Insurance</label>
                    <p className="font-medium">{compliance.comprehensiveInsurancePolicy}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Comprehensive Expiry</label>
                    <p>{new Date(compliance.comprehensiveInsuranceExpiry!).toLocaleDateString()}</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Inspections */}
        <Card>
          <CardHeader>
            <CardTitle>Inspections & Certifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {compliance.lastInspectionDate && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Last Inspection</label>
                    <div className="flex items-center gap-2">
                      <p>{new Date(compliance.lastInspectionDate).toLocaleDateString()}</p>
                      {compliance.lastInspectionResult && (
                        <StatusBadge 
                          status={compliance.lastInspectionResult.toUpperCase()}
                          variant={compliance.lastInspectionResult === 'passed' ? 'success' : 'error'}
                        />
                      )}
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-700">Next Inspection Due</label>
                  <p>{new Date(compliance.nextInspectionDueDate).toLocaleDateString()}</p>
                </div>
              </div>
              
              {compliance.emissionsTestResult && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Emissions Test</label>
                    <div className="flex items-center gap-2">
                      <StatusBadge 
                        status={compliance.emissionsTestResult.toUpperCase()}
                        variant={compliance.emissionsTestResult === 'passed' ? 'success' : 'error'}
                      />
                      {compliance.emissionsTestDate && (
                        <span className="text-sm text-gray-600">
                          ({new Date(compliance.emissionsTestDate).toLocaleDateString()})
                        </span>
                      )}
                    </div>
                  </div>
                  {compliance.emissionsCertificateNumber && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Certificate Number</label>
                      <p>{compliance.emissionsCertificateNumber}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to Load Vehicle</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="flex justify-center gap-3">
              <Button 
                variant="secondary" 
                onClick={onClose}
                leftIcon={<X className="w-4 h-4" />}
              >
                Close
              </Button>
              <Button 
                variant="primary" 
                onClick={fetchVehicleDetails}
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                Try Again
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!vehicle) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <div className="text-center py-8">
            <Car className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Vehicle not found</p>
            <Button 
              variant="secondary" 
              onClick={onClose}
              className="mt-4"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
        role="dialog"
        aria-labelledby="vehicle-detail-title"
        aria-describedby="vehicle-detail-description"
      >
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle 
              id="vehicle-detail-title"
              className="flex items-center gap-3"
              aria-label={`Vehicle details for ${vehicle.vehicleCode} with license plate ${vehicle.licensePlate}`}
            >
              <Car className="w-6 h-6 text-blue-600" aria-hidden="true" />
              <div>
                <span className="text-xl font-bold">{vehicle.vehicleCode}</span>
                <span className="text-lg text-gray-600 ml-2">• {vehicle.licensePlate}</span>
              </div>
            </DialogTitle>
            <div className="flex items-center gap-2" role="toolbar" aria-label="Vehicle actions">
              {onEdit && (
                <Button 
                  variant="secondary" 
                  size="sm"
                  leftIcon={<Edit2 className="w-4 h-4" aria-hidden="true" />}
                  onClick={() => onEdit(vehicle.id)}
                  aria-label={`Edit vehicle ${vehicle.vehicleCode}`}
                >
                  Edit
                </Button>
              )}
              <Button 
                variant="secondary" 
                size="sm"
                aria-label="More vehicle actions"
                aria-haspopup="menu"
              >
                <MoreHorizontal className="w-4 h-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
          <div id="vehicle-detail-description" className="sr-only">
            Detailed view of vehicle {vehicle.vehicleCode}, including overview, maintenance, telematics, and compliance information
          </div>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex-shrink-0">
          {/* Desktop Tab Navigation */}
          <div 
            className="hidden sm:flex space-x-1 bg-gray-100 p-1 rounded-lg"
            role="tablist"
            aria-label="Vehicle detail sections"
          >
            {[
              { id: 'overview', label: 'Overview', icon: Car },
              { id: 'maintenance', label: 'Maintenance', icon: Wrench },
              { id: 'telematics', label: 'Telematics', icon: Activity },
              { id: 'compliance', label: 'Compliance', icon: Shield }
            ].map((tab) => (
              <button
                key={tab.id}
                id={`${tab.id}-tab`}
                role="tab"
                tabIndex={activeTab === tab.id ? 0 : -1}
                aria-selected={activeTab === tab.id}
                aria-controls={`${tab.id}-panel`}
                onClick={() => setActiveTab(tab.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActiveTab(tab.id);
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 justify-center ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                aria-label={`View ${tab.label} section for vehicle ${vehicle.vehicleCode}`}
              >
                <tab.icon className="w-4 h-4" aria-hidden="true" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Mobile Tab Navigation - Collapsible */}
          <div className="sm:hidden">
            <div className="relative">
              <button
                onClick={() => setShowMobileTabMenu(!showMobileTabMenu)}
                className="w-full flex items-center justify-between px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium"
                aria-expanded={showMobileTabMenu}
                aria-haspopup="menu"
                aria-label={`Current section: ${(() => {
                  const currentTab = [
                    { id: 'overview', label: 'Overview', icon: Car },
                    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
                    { id: 'telematics', label: 'Telematics', icon: Activity },
                    { id: 'compliance', label: 'Compliance', icon: Shield }
                  ].find(tab => tab.id === activeTab);
                  return currentTab?.label || 'Overview';
                })()}. Tap to show all sections`}
              >
                <div className="flex items-center gap-2">
                  {(() => {
                    const currentTab = [
                      { id: 'overview', label: 'Overview', icon: Car },
                      { id: 'maintenance', label: 'Maintenance', icon: Wrench },
                      { id: 'telematics', label: 'Telematics', icon: Activity },
                      { id: 'compliance', label: 'Compliance', icon: Shield }
                    ].find(tab => tab.id === activeTab);
                    const IconComponent = currentTab?.icon || Car;
                    return (
                      <>
                        <IconComponent className="w-4 h-4 text-blue-600" aria-hidden="true" />
                        <span className="text-gray-900">{currentTab?.label}</span>
                      </>
                    );
                  })()}
                </div>
                <div 
                  className={`transform transition-transform ${showMobileTabMenu ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Mobile Tab Menu */}
              {showMobileTabMenu && (
                <div 
                  className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border border-gray-200 rounded-md shadow-lg"
                  role="menu"
                  aria-label="Vehicle detail sections"
                >
                  {[
                    { id: 'overview', label: 'Overview', icon: Car },
                    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
                    { id: 'telematics', label: 'Telematics', icon: Activity },
                    { id: 'compliance', label: 'Compliance', icon: Shield }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      role="menuitem"
                      onClick={() => {
                        setActiveTab(tab.id);
                        setShowMobileTabMenu(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      } ${tab.id !== 'compliance' ? 'border-b border-gray-100' : ''}`}
                      aria-current={activeTab === tab.id ? 'page' : undefined}
                      aria-label={`View ${tab.label} section for vehicle ${vehicle.vehicleCode}`}
                    >
                      <tab.icon className="w-4 h-4" aria-hidden="true" />
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          <div
            role="tabpanel"
            id="overview-panel"
            aria-labelledby="overview-tab"
            hidden={activeTab !== 'overview'}
          >
            {activeTab === 'overview' && renderOverviewTab()}
          </div>
          <div
            role="tabpanel"
            id="maintenance-panel"
            aria-labelledby="maintenance-tab"
            hidden={activeTab !== 'maintenance'}
          >
            {activeTab === 'maintenance' && renderMaintenanceTab()}
          </div>
          <div
            role="tabpanel"
            id="telematics-panel"
            aria-labelledby="telematics-tab"
            hidden={activeTab !== 'telematics'}
          >
            {activeTab === 'telematics' && renderTelematicsTab()}
          </div>
          <div
            role="tabpanel"
            id="compliance-panel"
            aria-labelledby="compliance-tab"
            hidden={activeTab !== 'compliance'}
          >
            {activeTab === 'compliance' && renderComplianceTab()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});

// Display name for better debugging with React DevTools  
VehicleDetailModal.displayName = 'VehicleDetailModal';

export default VehicleDetailModal;