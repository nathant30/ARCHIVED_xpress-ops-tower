'use client';

/**
 * Ground Ops - Depot Details Page
 * Vehicle Readiness Pipeline with visual state machine
 * Built by Agent 10 - Critical Frontend UI Developer
 */

import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Car,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  Wrench,
  ChevronRight,
  Image as ImageIcon,
  Fuel,
  Camera,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useGroundOpsStore, Vehicle, VehicleReadinessState } from '@/stores/groundOpsStore';
import { useRouter } from 'next/navigation';

// Mock vehicles in different states
const MOCK_VEHICLES: Vehicle[] = [
  // IDLE
  { id: 'V-101', code: 'V-101', type: '4W_CAR', state: 'IDLE', depotId: 'depot-1', licensePlate: 'ABC-123', lastUpdated: new Date().toISOString(), stateEnteredAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), photos: [] },
  { id: 'V-102', code: 'V-102', type: '2W', state: 'IDLE', depotId: 'depot-1', licensePlate: 'ABC-124', lastUpdated: new Date().toISOString(), stateEnteredAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(), photos: [] },
  { id: 'V-103', code: 'V-103', type: '4W_SUV', state: 'IDLE', depotId: 'depot-1', licensePlate: 'ABC-125', lastUpdated: new Date().toISOString(), stateEnteredAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(), photos: [] },

  // CLEANING
  { id: 'V-098', code: 'V-098', type: '4W_CAR', state: 'CLEANING', depotId: 'depot-1', licensePlate: 'ABC-126', lastUpdated: new Date().toISOString(), stateEnteredAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(), photos: [], assignedTo: 'Maria Garcia' },
  { id: 'V-099', code: 'V-099', type: '2W', state: 'CLEANING', depotId: 'depot-1', licensePlate: 'ABC-127', lastUpdated: new Date().toISOString(), stateEnteredAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(), photos: [], assignedTo: 'Juan Santos' },

  // INSPECTED
  { id: 'V-105', code: 'V-105', type: '4W_CAR', state: 'INSPECTED', depotId: 'depot-1', licensePlate: 'ABC-128', lastUpdated: new Date().toISOString(), stateEnteredAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(), photos: ['photo1.jpg', 'photo2.jpg'] },

  // FUELED
  { id: 'V-096', code: 'V-096', type: '4W_CAR', state: 'FUELED', depotId: 'depot-1', licensePlate: 'ABC-129', lastUpdated: new Date().toISOString(), stateEnteredAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), photos: ['photo1.jpg'], fuelLevel: 85 },
  { id: 'V-097', code: 'V-097', type: '2W', state: 'FUELED', depotId: 'depot-1', licensePlate: 'ABC-130', lastUpdated: new Date().toISOString(), stateEnteredAt: new Date(Date.now() - 7 * 60 * 1000).toISOString(), photos: ['photo1.jpg'], fuelLevel: 75 },

  // SAFE
  { id: 'V-094', code: 'V-094', type: '4W_CAR', state: 'SAFE', depotId: 'depot-1', licensePlate: 'ABC-131', lastUpdated: new Date().toISOString(), stateEnteredAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(), photos: ['photo1.jpg'], fuelLevel: 90, dashcamWorking: true, gpsAccuracy: 5 },
  { id: 'V-095', code: 'V-095', type: '4W_SUV', state: 'SAFE', depotId: 'depot-1', licensePlate: 'ABC-132', lastUpdated: new Date().toISOString(), stateEnteredAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(), photos: ['photo1.jpg'], fuelLevel: 80, dashcamWorking: true, gpsAccuracy: 7 },

  // AVAILABLE
  ...Array.from({ length: 12 }, (_, i) => ({
    id: `V-${String(70 + i * 2).padStart(3, '0')}`,
    code: `V-${String(70 + i * 2).padStart(3, '0')}`,
    type: ['2W', '4W_CAR', '4W_SUV'][i % 3] as '2W' | '4W_CAR' | '4W_SUV',
    state: 'AVAILABLE' as VehicleReadinessState,
    depotId: 'depot-1',
    licensePlate: `AVL-${i + 1}`,
    lastUpdated: new Date().toISOString(),
    stateEnteredAt: new Date(Date.now() - (i + 10) * 60 * 1000).toISOString(),
    photos: ['photo1.jpg'],
    fuelLevel: 85 + Math.random() * 15,
    dashcamWorking: true,
    gpsAccuracy: 5,
  })),

  // NEEDS_MAINTENANCE
  { id: 'V-108', code: 'V-108', type: '4W_CAR', state: 'NEEDS_MAINTENANCE', depotId: 'depot-1', licensePlate: 'MNT-001', lastUpdated: new Date().toISOString(), stateEnteredAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(), photos: [] },
  { id: 'V-109', code: 'V-109', type: '2W', state: 'NEEDS_MAINTENANCE', depotId: 'depot-1', licensePlate: 'MNT-002', lastUpdated: new Date().toISOString(), stateEnteredAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(), photos: [] },

  // IN_MAINTENANCE
  { id: 'V-110', code: 'V-110', type: '4W_CAR', state: 'IN_MAINTENANCE', depotId: 'depot-1', licensePlate: 'MNT-003', lastUpdated: new Date().toISOString(), stateEnteredAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), photos: [] },
  { id: 'V-112', code: 'V-112', type: '4W_SUV', state: 'IN_MAINTENANCE', depotId: 'depot-1', licensePlate: 'MNT-004', lastUpdated: new Date().toISOString(), stateEnteredAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), photos: [] },
  { id: 'V-114', code: 'V-114', type: '2W', state: 'IN_MAINTENANCE', depotId: 'depot-1', licensePlate: 'MNT-005', lastUpdated: new Date().toISOString(), stateEnteredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), photos: [] },

  // MAINTENANCE_COMPLETE
  { id: 'V-115', code: 'V-115', type: '4W_CAR', state: 'MAINTENANCE_COMPLETE', depotId: 'depot-1', licensePlate: 'MNT-006', lastUpdated: new Date().toISOString(), stateEnteredAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), photos: [] },
];

// State configuration for visual pipeline
const STATE_CONFIG = {
  IDLE: { label: 'Idle', color: 'bg-gray-100 text-gray-700 border-gray-300', icon: Car },
  CLEANING: { label: 'Cleaning', color: 'bg-blue-100 text-blue-700 border-blue-300', icon: Users },
  INSPECTED: { label: 'Inspected', color: 'bg-purple-100 text-purple-700 border-purple-300', icon: CheckCircle },
  FUELED: { label: 'Fueled', color: 'bg-green-100 text-green-700 border-green-300', icon: Fuel },
  SAFE: { label: 'Safe', color: 'bg-teal-100 text-teal-700 border-teal-300', icon: Camera },
  AVAILABLE: { label: 'Available', color: 'bg-emerald-100 text-emerald-700 border-emerald-300', icon: CheckCircle },
  NEEDS_MAINTENANCE: { label: 'Needs Maintenance', color: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: AlertTriangle },
  IN_MAINTENANCE: { label: 'In Maintenance', color: 'bg-orange-100 text-orange-700 border-orange-300', icon: Wrench },
  MAINTENANCE_COMPLETE: { label: 'Maintenance Complete', color: 'bg-lime-100 text-lime-700 border-lime-300', icon: CheckCircle },
};

const DepotDetailsPage = ({ params }: { params: { id: string } }) => {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const { selectedDepot, vehiclesByState, setVehiclesByState, selectVehicle } = useGroundOpsStore();

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load vehicles by state
  useEffect(() => {
    if (!isClient) return;

    const groupedVehicles: Record<VehicleReadinessState, Vehicle[]> = {
      IDLE: [],
      CLEANING: [],
      INSPECTED: [],
      FUELED: [],
      SAFE: [],
      AVAILABLE: [],
      ON_TRIP: [],
      NEEDS_MAINTENANCE: [],
      IN_MAINTENANCE: [],
      MAINTENANCE_COMPLETE: [],
    };

    MOCK_VEHICLES.filter(v => v.depotId === params.id).forEach(vehicle => {
      groupedVehicles[vehicle.state].push(vehicle);
    });

    setVehiclesByState(groupedVehicles);
  }, [isClient, params.id, setVehiclesByState]);

  // Calculate time in state
  const getTimeInState = (vehicle: Vehicle): string => {
    const entered = new Date(vehicle.stateEnteredAt);
    const now = new Date();
    const diffMs = now.getTime() - entered.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d`;
  };

  // Get color based on time limit
  const getTimeColor = (vehicle: Vehicle, state: VehicleReadinessState): string => {
    const entered = new Date(vehicle.stateEnteredAt);
    const now = new Date();
    const diffMins = Math.floor((now.getTime() - entered.getTime()) / 60000);

    const limits: Record<string, number> = {
      IDLE: 30,
      CLEANING: 30,
      INSPECTED: 15,
      FUELED: 10,
      SAFE: 10,
    };

    const limit = limits[state];
    if (!limit) return 'text-gray-600';

    if (diffMins > limit) return 'text-red-600 font-bold';
    if (diffMins > limit * 0.8) return 'text-yellow-600 font-semibold';
    return 'text-green-600';
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
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {selectedDepot?.name || 'Depot Details'}
            </h1>
            <p className="text-gray-600 mt-1">
              Vehicle Readiness Pipeline • {selectedDepot?.vehicleCount || 0} vehicles
            </p>
          </div>
        </div>
      </div>

      {/* Vehicle Readiness Pipeline - Normal Flow */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Readiness Pipeline</CardTitle>
          <p className="text-sm text-gray-600">
            Vehicles must pass through all states in order before becoming available
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {['IDLE', 'CLEANING', 'INSPECTED', 'FUELED', 'SAFE', 'AVAILABLE'].map((stateName, idx) => {
              const state = stateName as VehicleReadinessState;
              const vehicles = vehiclesByState[state] || [];
              const config = STATE_CONFIG[state];
              const Icon = config.icon;

              return (
                <React.Fragment key={state}>
                  <div className="relative">
                    {/* State Card */}
                    <div className={`border-2 rounded-lg p-4 ${config.color}`}>
                      <div className="flex items-center justify-between mb-3">
                        <Icon className="h-5 w-5" />
                        <Badge variant="secondary" className="text-xs">
                          {vehicles.length}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-sm mb-3">{config.label}</h3>

                      {/* Vehicle List */}
                      <div className="space-y-1.5 max-h-64 overflow-y-auto">
                        {vehicles.length === 0 ? (
                          <div className="text-xs text-gray-500 italic">No vehicles</div>
                        ) : (
                          vehicles.map((vehicle) => (
                            <div
                              key={vehicle.id}
                              className="bg-white rounded p-2 cursor-pointer hover:shadow-md transition-shadow"
                              onClick={() => selectVehicle(vehicle)}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-xs font-semibold">{vehicle.code}</span>
                                <Badge variant="outline" className="text-xs">
                                  {vehicle.type}
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between mt-1">
                                <span className={`text-xs ${getTimeColor(vehicle, state)}`}>
                                  <Clock className="h-3 w-3 inline mr-1" />
                                  {getTimeInState(vehicle)}
                                </span>
                                {vehicle.assignedTo && (
                                  <span className="text-xs text-gray-600 truncate max-w-[80px]">
                                    {vehicle.assignedTo}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Arrow to next state */}
                    {idx < 5 && (
                      <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                        <ChevronRight className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Maintenance Track */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Maintenance Track
          </CardTitle>
          <p className="text-sm text-gray-600">
            Vehicles requiring repair before returning to service
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['NEEDS_MAINTENANCE', 'IN_MAINTENANCE', 'MAINTENANCE_COMPLETE'].map((stateName) => {
              const state = stateName as VehicleReadinessState;
              const vehicles = vehiclesByState[state] || [];
              const config = STATE_CONFIG[state];
              const Icon = config.icon;

              return (
                <div key={state} className={`border-2 rounded-lg p-4 ${config.color}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5" />
                      <h3 className="font-semibold text-sm">{config.label}</h3>
                    </div>
                    <Badge variant="secondary">{vehicles.length}</Badge>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {vehicles.length === 0 ? (
                      <div className="text-xs text-gray-500 italic">No vehicles</div>
                    ) : (
                      vehicles.map((vehicle) => (
                        <div
                          key={vehicle.id}
                          className="bg-white rounded p-3 cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => selectVehicle(vehicle)}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono text-sm font-semibold">{vehicle.code}</span>
                            <Badge variant="outline" className="text-xs">{vehicle.type}</Badge>
                          </div>
                          <div className="text-xs text-gray-600">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {getTimeInState(vehicle)} in state
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Avg Cycle Time</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">42 min</p>
            <p className="text-xs text-green-600 mt-1">Target: 60 min</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Bottleneck State</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">Cleaning</p>
            <p className="text-xs text-yellow-600 mt-1">18 min avg</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Override Rate</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">1.2%</p>
            <p className="text-xs text-green-600 mt-1">Target: &lt; 2%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Available Fleet %</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">71%</p>
            <p className="text-xs text-yellow-600 mt-1">Target: &gt; 80%</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DepotDetailsPage;
