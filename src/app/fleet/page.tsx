'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Car,
  Wrench,
  AlertTriangle,
  TrendingUp,
  Plus,
  ChevronRight,
  MapPin,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface VehicleMaintenanceDue {
  id: string;
  plateNumber: string;
  make: string;
  model: string;
  type: string;
  dueDate: string;
  maintenanceType: string;
  mileage: number;
}

export default function FleetDashboard() {
  const router = useRouter();

  // Mock fleet overview data
  const fleetOverview = {
    totalVehicles: 142,
    availableNow: 89,
    inService: 45,
    inMaintenance: 8,
  };

  // Mock maintenance due vehicles
  const maintenanceDue: VehicleMaintenanceDue[] = [
    {
      id: '1',
      plateNumber: 'ABC-1234',
      make: 'Honda',
      model: 'Beat',
      type: 'Motorcycle',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      maintenanceType: 'Oil Change',
      mileage: 14500,
    },
    {
      id: '2',
      plateNumber: 'XYZ-5678',
      make: 'Toyota',
      model: 'Vios',
      type: 'Car',
      dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
      maintenanceType: 'Preventive Maintenance',
      mileage: 48200,
    },
    {
      id: '3',
      plateNumber: 'DEF-9012',
      make: 'Suzuki',
      model: 'Ertiga',
      type: 'SUV',
      dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
      maintenanceType: 'Tire Rotation',
      mileage: 32100,
    },
  ];

  // Mock utilization data (last 7 days)
  const utilizationData = [
    { day: 'Mon', motorcycles: 45, cars: 28, suvs: 15, taxis: 10 },
    { day: 'Tue', motorcycles: 48, cars: 30, suvs: 16, taxis: 11 },
    { day: 'Wed', motorcycles: 52, cars: 32, suvs: 18, taxis: 12 },
    { day: 'Thu', motorcycles: 50, cars: 31, suvs: 17, taxis: 11 },
    { day: 'Fri', motorcycles: 55, cars: 35, suvs: 20, taxis: 13 },
    { day: 'Sat', motorcycles: 58, cars: 38, suvs: 22, taxis: 14 },
    { day: 'Sun', motorcycles: 54, cars: 35, suvs: 19, taxis: 12 },
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return `in ${diffDays} days`;
  };

  const getVehicleTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'motorcycle':
        return '🏍️';
      case 'car':
        return '🚗';
      case 'suv':
        return '🚙';
      case 'taxi':
        return '🚖';
      default:
        return '🚗';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Fleet Management</h1>
          <p className="text-neutral-600 mt-1">
            Monitor and manage your entire vehicle fleet
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/fleet/vehicles')}
            className="flex items-center gap-2"
          >
            <Car className="h-4 w-4" />
            All Vehicles
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => router.push('/fleet/add-vehicle')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4" />
            Add Vehicle
          </Button>
        </div>
      </div>

      {/* Fleet Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-blue-100">
                <Car className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-neutral-600">Total Vehicles</p>
              <p className="text-3xl font-bold text-neutral-900">
                {fleetOverview.totalVehicles}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-green-100">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-neutral-600">Available Now</p>
              <p className="text-3xl font-bold text-neutral-900">
                {fleetOverview.availableNow}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-orange-100">
                <MapPin className="h-5 w-5 text-orange-600" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-neutral-600">In Service</p>
              <p className="text-3xl font-bold text-neutral-900">
                {fleetOverview.inService}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-red-100">
                <Wrench className="h-5 w-5 text-red-600" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-neutral-600">In Maintenance</p>
              <p className="text-3xl font-bold text-neutral-900">
                {fleetOverview.inMaintenance}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Utilization Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="border-b border-neutral-200">
            <CardTitle>Fleet Utilization (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={utilizationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="day" stroke="#666" fontSize={12} />
                <YAxis stroke="#666" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e5e5',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="motorcycles" fill="#3b82f6" name="Motorcycles" />
                <Bar dataKey="cars" fill="#10b981" name="Cars" />
                <Bar dataKey="suvs" fill="#f59e0b" name="SUVs" />
                <Bar dataKey="taxis" fill="#ef4444" name="Taxis" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Maintenance Due */}
        <Card>
          <CardHeader className="border-b border-neutral-200">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Maintenance Due (7 Days)
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-neutral-100">
              {maintenanceDue.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className="p-4 hover:bg-neutral-50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/fleet/vehicles/${vehicle.id}`)}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{getVehicleTypeIcon(vehicle.type)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-neutral-900">
                          {vehicle.plateNumber}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-600 mb-1">
                        {vehicle.make} {vehicle.model}
                      </p>
                      <p className="text-xs text-orange-600 font-medium mb-1">
                        {vehicle.maintenanceType} • {formatDate(vehicle.dueDate)}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {vehicle.mileage.toLocaleString()} km
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-neutral-200">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/maintenance')}
                className="w-full flex items-center justify-center gap-2"
              >
                View All Maintenance
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fleet Status Map Placeholder */}
      <Card>
        <CardHeader className="border-b border-neutral-200">
          <CardTitle>Fleet Status Map</CardTitle>
        </CardHeader>
        <CardContent className="p-12">
          <div className="text-center">
            <div className="text-6xl mb-4">🗺️</div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">
              Interactive Fleet Map
            </h3>
            <p className="text-neutral-600 mb-4">
              Real-time vehicle locations with status indicators
            </p>
            <div className="flex items-center justify-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>In Service</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span>Maintenance</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                <span>Offline</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
