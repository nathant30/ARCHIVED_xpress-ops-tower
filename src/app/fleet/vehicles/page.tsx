'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Search,
  Filter,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Edit,
  Wrench,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

interface Vehicle {
  id: string;
  plateNumber: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  type: 'Motorcycle' | 'Car' | 'SUV' | 'Taxi';
  status: 'Available' | 'In Service' | 'In Maintenance' | 'Offline';
  mileage: number;
  lastService: string;
  depotName: string;
}

export default function VehiclesList() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedDepot, setSelectedDepot] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Mock vehicles data
  const vehicles: Vehicle[] = Array.from({ length: 142 }, (_, i) => {
    const types: Vehicle['type'][] = ['Motorcycle', 'Car', 'SUV', 'Taxi'];
    const statuses: Vehicle['status'][] = ['Available', 'In Service', 'In Maintenance', 'Offline'];
    const makes = {
      Motorcycle: ['Honda', 'Yamaha', 'Suzuki'],
      Car: ['Toyota', 'Honda', 'Hyundai'],
      SUV: ['Toyota', 'Mitsubishi', 'Suzuki'],
      Taxi: ['Toyota', 'Hyundai'],
    };
    const models = {
      Honda: ['Beat', 'Click', 'Vios'],
      Yamaha: ['Mio', 'Aerox'],
      Suzuki: ['Raider', 'Ertiga', 'Jimny'],
      Toyota: ['Vios', 'Innova', 'Fortuner', 'Wigo'],
      Hyundai: ['Accent', 'Tucson', 'Reina'],
      Mitsubishi: ['Montero', 'Xpander'],
    };

    const type = types[i % types.length];
    const makesForType = makes[type];
    const make = makesForType[i % makesForType.length];
    const model = models[make as keyof typeof models][0];

    return {
      id: `VEH-${String(i + 1).padStart(4, '0')}`,
      plateNumber: `ABC-${String(1000 + i).slice(-4)}`,
      vin: `JHM${Math.random().toString(36).substring(2, 15).toUpperCase()}`,
      make,
      model,
      year: 2018 + (i % 7),
      type,
      status: statuses[i % statuses.length],
      mileage: Math.floor(Math.random() * 100000) + 10000,
      lastService: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      depotName: ['Metro Manila Hub', 'Cebu Hub', 'Davao Hub'][i % 3],
    };
  });

  // Filter vehicles
  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch =
      vehicle.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.vin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${vehicle.make} ${vehicle.model}`.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      selectedStatus === 'all' || vehicle.status === selectedStatus;

    const matchesType = selectedType === 'all' || vehicle.type === selectedType;

    const matchesDepot =
      selectedDepot === 'all' || vehicle.depotName === selectedDepot;

    return matchesSearch && matchesStatus && matchesType && matchesDepot;
  });

  // Pagination
  const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentVehicles = filteredVehicles.slice(startIndex, endIndex);

  const getStatusColor = (status: Vehicle['status']) => {
    switch (status) {
      case 'Available':
        return 'bg-green-100 text-green-700';
      case 'In Service':
        return 'bg-blue-100 text-blue-700';
      case 'In Maintenance':
        return 'bg-orange-100 text-orange-700';
      case 'Offline':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
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

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">All Vehicles</h1>
          <p className="text-neutral-600 mt-1">
            {filteredVehicles.length} vehicles in fleet
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/fleet')}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Fleet
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

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search by plate number, VIN, or make/model..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="Available">Available</option>
              <option value="In Service">In Service</option>
              <option value="In Maintenance">In Maintenance</option>
              <option value="Offline">Offline</option>
            </select>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="Motorcycle">Motorcycle</option>
              <option value="Car">Car</option>
              <option value="SUV">SUV</option>
              <option value="Taxi">Taxi</option>
            </select>

            {/* Depot Filter */}
            <select
              value={selectedDepot}
              onChange={(e) => setSelectedDepot(e.target.value)}
              className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Depots</option>
              <option value="Metro Manila Hub">Metro Manila Hub</option>
              <option value="Cebu Hub">Cebu Hub</option>
              <option value="Davao Hub">Davao Hub</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Vehicles Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-700">Vehicle</th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-700">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-700">Status</th>
                  <th className="text-right py-3 px-4 font-semibold text-neutral-700">Mileage</th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-700">
                    Last Service
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-700">Depot</th>
                  <th className="text-center py-3 px-4 font-semibold text-neutral-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {currentVehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="hover:bg-neutral-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getVehicleTypeIcon(vehicle.type)}</span>
                        <div>
                          <p className="font-semibold text-neutral-900">{vehicle.plateNumber}</p>
                          <p className="text-xs text-neutral-600">
                            {vehicle.make} {vehicle.model} ({vehicle.year})
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-neutral-700">{vehicle.type}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          vehicle.status
                        )}`}
                      >
                        {vehicle.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-neutral-900">
                      {vehicle.mileage.toLocaleString()} km
                    </td>
                    <td className="py-3 px-4 text-neutral-600">
                      {formatDate(vehicle.lastService)}
                    </td>
                    <td className="py-3 px-4 text-neutral-700">{vehicle.depotName}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/fleet/vehicles/${vehicle.id}`)}
                          className="h-8 w-8 p-0"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => console.log('Schedule maintenance', vehicle.id)}
                          className="h-8 w-8 p-0"
                          title="Schedule Maintenance"
                        >
                          <Wrench className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-200">
            <div className="text-sm text-neutral-600">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredVehicles.length)} of{' '}
              {filteredVehicles.length} vehicles
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-neutral-700 px-3">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
