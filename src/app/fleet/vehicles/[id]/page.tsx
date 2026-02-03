'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  ChevronLeft,
  Edit,
  Wrench,
  FileText,
  AlertTriangle,
  TrendingUp,
  Download,
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { format } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function VehicleDetails() {
  const router = useRouter();
  const params = useParams();
  const vehicleId = params.id as string;
  const [activeTab, setActiveTab] = useState('overview');

  // Mock vehicle data
  const vehicle = {
    id: vehicleId,
    plateNumber: 'ABC-1234',
    vin: 'JHMZF1D41FS123456',
    make: 'Honda',
    model: 'Beat',
    year: 2022,
    type: 'Motorcycle',
    status: 'Available',
    color: 'Black',
    mileage: 14500,
    fuelType: 'Gasoline',
    engineNumber: 'ENG123456',
    chassisNumber: 'CHS789012',
    registrationExpiry: '2025-12-31',
    insuranceExpiry: '2025-06-30',
    depotName: 'Metro Manila Hub',
    purchaseDate: '2022-01-15',
    purchasePrice: 75000,
    currentDriver: 'Juan Dela Cruz',
    lastService: '2024-01-15',
    nextServiceDue: '2024-04-15',
  };

  // Mock service history
  const serviceHistory = [
    {
      id: '1',
      date: '2024-01-15',
      type: 'Oil Change',
      description: 'Regular oil change and filter replacement',
      mileage: 14000,
      cost: 1200,
      provider: 'In-house',
      status: 'Completed',
    },
    {
      id: '2',
      date: '2023-10-20',
      type: 'Preventive Maintenance',
      description: 'Full inspection and tune-up',
      mileage: 12500,
      cost: 3500,
      provider: 'Honda Service Center',
      status: 'Completed',
    },
    {
      id: '3',
      date: '2023-07-10',
      type: 'Tire Replacement',
      description: 'Front and rear tire replacement',
      mileage: 11000,
      cost: 4800,
      provider: 'External vendor',
      status: 'Completed',
    },
  ];

  // Mock trip history
  const tripHistory = [
    {
      id: '1',
      date: '2024-02-03',
      startLocation: 'Makati City',
      endLocation: 'Quezon City',
      distance: 12.5,
      duration: 35,
      revenue: 185,
    },
    {
      id: '2',
      date: '2024-02-03',
      startLocation: 'Quezon City',
      endLocation: 'Pasig City',
      distance: 8.2,
      duration: 22,
      revenue: 125,
    },
    {
      id: '3',
      date: '2024-02-02',
      startLocation: 'Manila',
      endLocation: 'Mandaluyong',
      distance: 6.1,
      duration: 18,
      revenue: 95,
    },
  ];

  // Mock fuel consumption data
  const fuelConsumptionData = Array.from({ length: 30 }, (_, i) => ({
    date: format(new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000), 'MMM dd'),
    consumption: Math.random() * 2 + 1.5,
  }));

  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available':
        return 'bg-green-100 text-green-700';
      case 'In Service':
        return 'bg-blue-100 text-blue-700';
      case 'In Maintenance':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-neutral-900">{vehicle.plateNumber}</h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(vehicle.status)}`}>
              {vehicle.status}
            </span>
          </div>
          <p className="text-neutral-600 mt-1">
            {vehicle.make} {vehicle.model} ({vehicle.year}) • {vehicle.type}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/fleet/vehicles')}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Vehicles
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => console.log('Edit vehicle')}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => router.push('/maintenance/schedule')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Wrench className="h-4 w-4" />
            Schedule Service
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="border-b border-neutral-200 w-full justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="service-history">Service History</TabsTrigger>
          <TabsTrigger value="trip-history">Trip History</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Vehicle Info */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader className="border-b border-neutral-200">
                <CardTitle>Vehicle Information</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-neutral-600 mb-1">Plate Number</p>
                    <p className="font-semibold text-neutral-900">{vehicle.plateNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600 mb-1">VIN</p>
                    <p className="font-semibold text-neutral-900">{vehicle.vin}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600 mb-1">Make / Model</p>
                    <p className="font-semibold text-neutral-900">{vehicle.make} {vehicle.model}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600 mb-1">Year</p>
                    <p className="font-semibold text-neutral-900">{vehicle.year}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600 mb-1">Type</p>
                    <p className="font-semibold text-neutral-900">{vehicle.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600 mb-1">Color</p>
                    <p className="font-semibold text-neutral-900">{vehicle.color}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600 mb-1">Fuel Type</p>
                    <p className="font-semibold text-neutral-900">{vehicle.fuelType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600 mb-1">Current Mileage</p>
                    <p className="font-semibold text-neutral-900">{vehicle.mileage.toLocaleString()} km</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600 mb-1">Depot</p>
                    <p className="font-semibold text-neutral-900">{vehicle.depotName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600 mb-1">Current Driver</p>
                    <p className="font-semibold text-neutral-900">{vehicle.currentDriver || 'Not assigned'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600 mb-1">Purchase Date</p>
                    <p className="font-semibold text-neutral-900">{formatDate(vehicle.purchaseDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600 mb-1">Purchase Price</p>
                    <p className="font-semibold text-neutral-900">{formatCurrency(vehicle.purchasePrice)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              {/* Documents Status */}
              <Card>
                <CardHeader className="border-b border-neutral-200">
                  <CardTitle>Documents Status</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <p className="text-sm text-neutral-600 mb-1">Registration</p>
                    <p className="text-sm font-semibold text-green-600">Valid until {formatDate(vehicle.registrationExpiry)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600 mb-1">Insurance</p>
                    <p className="text-sm font-semibold text-green-600">Valid until {formatDate(vehicle.insuranceExpiry)}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Maintenance Status */}
              <Card>
                <CardHeader className="border-b border-neutral-200">
                  <CardTitle>Maintenance Status</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <p className="text-sm text-neutral-600 mb-1">Last Service</p>
                    <p className="text-sm font-semibold text-neutral-900">{formatDate(vehicle.lastService)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600 mb-1">Next Service Due</p>
                    <p className="text-sm font-semibold text-orange-600">{formatDate(vehicle.nextServiceDue)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Fuel Consumption Chart */}
          <Card>
            <CardHeader className="border-b border-neutral-200">
              <CardTitle>Fuel Consumption (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={fuelConsumptionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="date" stroke="#666" fontSize={12} />
                  <YAxis stroke="#666" fontSize={12} label={{ value: 'L/100km', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="consumption" stroke="#3b82f6" strokeWidth={2} name="Consumption" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Service History Tab */}
        <TabsContent value="service-history">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-neutral-700">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-neutral-700">Type</th>
                      <th className="text-left py-3 px-4 font-semibold text-neutral-700">Description</th>
                      <th className="text-right py-3 px-4 font-semibold text-neutral-700">Mileage</th>
                      <th className="text-right py-3 px-4 font-semibold text-neutral-700">Cost</th>
                      <th className="text-left py-3 px-4 font-semibold text-neutral-700">Provider</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {serviceHistory.map((service) => (
                      <tr key={service.id} className="hover:bg-neutral-50">
                        <td className="py-3 px-4 text-neutral-700">{formatDate(service.date)}</td>
                        <td className="py-3 px-4 font-medium text-neutral-900">{service.type}</td>
                        <td className="py-3 px-4 text-neutral-600">{service.description}</td>
                        <td className="py-3 px-4 text-right text-neutral-900">{service.mileage.toLocaleString()} km</td>
                        <td className="py-3 px-4 text-right font-semibold text-neutral-900">{formatCurrency(service.cost)}</td>
                        <td className="py-3 px-4 text-neutral-700">{service.provider}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trip History Tab */}
        <TabsContent value="trip-history">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-neutral-700">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-neutral-700">From</th>
                      <th className="text-left py-3 px-4 font-semibold text-neutral-700">To</th>
                      <th className="text-right py-3 px-4 font-semibold text-neutral-700">Distance</th>
                      <th className="text-right py-3 px-4 font-semibold text-neutral-700">Duration</th>
                      <th className="text-right py-3 px-4 font-semibold text-neutral-700">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {tripHistory.map((trip) => (
                      <tr key={trip.id} className="hover:bg-neutral-50">
                        <td className="py-3 px-4 text-neutral-700">{formatDate(trip.date)}</td>
                        <td className="py-3 px-4 text-neutral-900">{trip.startLocation}</td>
                        <td className="py-3 px-4 text-neutral-900">{trip.endLocation}</td>
                        <td className="py-3 px-4 text-right text-neutral-700">{trip.distance} km</td>
                        <td className="py-3 px-4 text-right text-neutral-700">{trip.duration} min</td>
                        <td className="py-3 px-4 text-right font-semibold text-green-600">{formatCurrency(trip.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">Document Management</h3>
                <p className="text-neutral-600">Upload and manage vehicle documents (registration, insurance, inspection certificates)</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
