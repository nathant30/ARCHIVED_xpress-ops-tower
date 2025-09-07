'use client';

import React, { useState } from 'react';
import { 
  Car, 
  Users, 
  BarChart3, 
  Award, 
  Home,
  ArrowLeft,
  MapPin,
  Calendar,
  DollarSign,
  TrendingUp,
  Star,
  Shield,
  AlertTriangle
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

const OperatorFleetPage = () => {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const operatorId = params.operatorId as string;

  // Mock operator data - in real app, fetch from API
  const operator = {
    id: operatorId,
    name: 'Maria Santos',
    type: 'TNVS',
    email: 'maria.santos@email.com',
    phone: '+639171234567',
    location: 'Makati City',
    joinDate: '15/01/2023',
    status: 'active',
    vehicleCount: 3,
    maxVehicles: 3,
    activeDrivers: 3,
    performanceScore: 92,
    rating: 4.8,
    utilization: 88
  };

  // Mock fleet data
  const vehicles = [
    {
      id: 'VH001',
      licensePlate: 'ABC-1234',
      make: 'Toyota',
      model: 'Vios',
      year: 2020,
      color: 'White',
      status: 'active',
      driver: 'Juan Dela Cruz',
      rating: 4.9,
      trips: 1245,
      earnings: 85600,
      lastTrip: '2 hours ago'
    },
    {
      id: 'VH002', 
      licensePlate: 'DEF-5678',
      make: 'Honda',
      model: 'City',
      year: 2019,
      color: 'Silver',
      status: 'active',
      driver: 'Pedro Garcia',
      rating: 4.7,
      trips: 987,
      earnings: 67800,
      lastTrip: '45 minutes ago'
    },
    {
      id: 'VH003',
      licensePlate: 'GHI-9012',
      make: 'Nissan',
      model: 'Almera',
      year: 2021,
      color: 'Black',
      status: 'maintenance',
      driver: 'Carlos Rivera',
      rating: 4.8,
      trips: 756,
      earnings: 52400,
      lastTrip: '3 days ago'
    }
  ];

  const drivers = [
    {
      id: 'DR001',
      name: 'Juan Dela Cruz',
      email: 'juan@email.com',
      phone: '+639181234567',
      vehicle: 'ABC-1234 (Toyota Vios)',
      rating: 4.9,
      trips: 1245,
      earnings: 85600,
      joinDate: '20/01/2023',
      status: 'active'
    },
    {
      id: 'DR002',
      name: 'Pedro Garcia',
      email: 'pedro@email.com', 
      phone: '+639191234567',
      vehicle: 'DEF-5678 (Honda City)',
      rating: 4.7,
      trips: 987,
      earnings: 67800,
      joinDate: '25/01/2023',
      status: 'active'
    },
    {
      id: 'DR003',
      name: 'Carlos Rivera',
      email: 'carlos@email.com',
      phone: '+639201234567', 
      vehicle: 'GHI-9012 (Nissan Almera)',
      rating: 4.8,
      trips: 756,
      earnings: 52400,
      joinDate: '10/02/2023',
      status: 'inactive'
    }
  ];

  const tabs = [
    { id: 'overview', label: 'Fleet Overview', icon: Home },
    { id: 'vehicles', label: 'Vehicles', icon: Car },
    { id: 'drivers', label: 'Drivers', icon: Users },
    { id: 'performance', label: 'Performance', icon: BarChart3 },
    { id: 'earnings', label: 'Earnings', icon: DollarSign }
  ];

  const FleetOverviewTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Fleet Overview</h2>
          <p className="text-gray-600 mt-1">Complete fleet management for {operator.name}</p>
        </div>
        <div className="flex items-center space-x-4">
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="24h" selected>Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-blue-500 p-2 rounded-lg">
              <Car className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center space-x-1 text-green-600">
              <TrendingUp className="w-3 h-3" />
              <span className="text-sm font-medium">100%</span>
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">{vehicles.filter(v => v.status === 'active').length}</h3>
            <p className="text-gray-600 text-sm">Active Vehicles</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-green-500 p-2 rounded-lg">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center space-x-1 text-green-600">
              <TrendingUp className="w-3 h-3" />
              <span className="text-sm font-medium">+5.2%</span>
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">{drivers.filter(d => d.status === 'active').length}</h3>
            <p className="text-gray-600 text-sm">Active Drivers</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-yellow-500 p-2 rounded-lg">
              <Star className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center space-x-1 text-green-600">
              <TrendingUp className="w-3 h-3" />
              <span className="text-sm font-medium">+0.1</span>
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">{operator.rating}</h3>
            <p className="text-gray-600 text-sm">Average Rating</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-purple-500 p-2 rounded-lg">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center space-x-1 text-green-600">
              <TrendingUp className="w-3 h-3" />
              <span className="text-sm font-medium">+2.1%</span>
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">{operator.utilization}%</h3>
            <p className="text-gray-600 text-sm">Fleet Utilization</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-green-600 p-2 rounded-lg">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center space-x-1 text-green-600">
              <TrendingUp className="w-3 h-3" />
              <span className="text-sm font-medium">+18.2%</span>
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">₱{vehicles.reduce((sum, v) => sum + v.earnings, 0).toLocaleString()}</h3>
            <p className="text-gray-600 text-sm">Total Earnings</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-orange-500 p-2 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center space-x-1 text-red-600">
              <TrendingUp className="w-3 h-3" />
              <span className="text-sm font-medium">1</span>
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">{vehicles.filter(v => v.status === 'maintenance').length}</h3>
            <p className="text-gray-600 text-sm">In Maintenance</p>
          </div>
        </div>
      </div>
    </div>
  );

  const VehiclesTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Fleet Vehicles</h2>
          <p className="text-gray-600 mt-1">Manage and monitor all vehicles in the fleet</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          Add Vehicle
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-4 px-6 font-medium text-gray-700">VEHICLE</th>
              <th className="text-left py-4 px-6 font-medium text-gray-700">DRIVER</th>
              <th className="text-left py-4 px-6 font-medium text-gray-700">STATUS</th>
              <th className="text-left py-4 px-6 font-medium text-gray-700">PERFORMANCE</th>
              <th className="text-left py-4 px-6 font-medium text-gray-700">EARNINGS</th>
              <th className="text-left py-4 px-6 font-medium text-gray-700">LAST TRIP</th>
              <th className="w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {vehicles.map((vehicle) => (
              <tr key={vehicle.id} className="hover:bg-gray-50 cursor-pointer transition-colors">
                <td className="py-4 px-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                      <Car className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{vehicle.licensePlate}</p>
                      <p className="text-sm text-gray-600">{vehicle.year} {vehicle.make} {vehicle.model}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div>
                    <p className="font-medium text-gray-900">{vehicle.driver}</p>
                    <p className="text-sm text-gray-600">{vehicle.trips} trips</p>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    vehicle.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {vehicle.status === 'active' ? 'Active' : 'Maintenance'}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">{vehicle.rating}</span>
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  </div>
                </td>
                <td className="py-4 px-6">
                  <p className="font-medium text-green-600">₱{vehicle.earnings.toLocaleString()}</p>
                </td>
                <td className="py-4 px-6">
                  <p className="text-sm text-gray-600">{vehicle.lastTrip}</p>
                </td>
                <td className="py-4 px-6">
                  <button className="text-gray-400 hover:text-gray-600">
                    <Award className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const DriversTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Fleet Drivers</h2>
          <p className="text-gray-600 mt-1">Manage driver assignments and performance</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          Add Driver
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-4 px-6 font-medium text-gray-700">DRIVER</th>
              <th className="text-left py-4 px-6 font-medium text-gray-700">VEHICLE</th>
              <th className="text-left py-4 px-6 font-medium text-gray-700">STATUS</th>
              <th className="text-left py-4 px-6 font-medium text-gray-700">RATING</th>
              <th className="text-left py-4 px-6 font-medium text-gray-700">TRIPS</th>
              <th className="text-left py-4 px-6 font-medium text-gray-700">EARNINGS</th>
              <th className="w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {drivers.map((driver) => (
              <tr key={driver.id} className="hover:bg-gray-50 cursor-pointer transition-colors">
                <td className="py-4 px-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                      {driver.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{driver.name}</p>
                      <p className="text-sm text-gray-600">{driver.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <p className="font-medium text-gray-900">{driver.vehicle}</p>
                </td>
                <td className="py-4 px-6">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    driver.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {driver.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">{driver.rating}</span>
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  </div>
                </td>
                <td className="py-4 px-6">
                  <p className="font-medium text-gray-900">{driver.trips}</p>
                </td>
                <td className="py-4 px-6">
                  <p className="font-medium text-green-600">₱{driver.earnings.toLocaleString()}</p>
                </td>
                <td className="py-4 px-6">
                  <button className="text-gray-400 hover:text-gray-600">
                    <Award className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <FleetOverviewTab />;
      case 'vehicles':
        return <VehiclesTab />;
      case 'drivers':
        return <DriversTab />;
      case 'performance':
        return <div className="text-center py-8"><BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" /><p className="text-gray-600">Performance analytics coming soon</p></div>;
      case 'earnings':
        return <div className="text-center py-8"><DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" /><p className="text-gray-600">Earnings reports coming soon</p></div>;
      default:
        return <FleetOverviewTab />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="w-8 h-8 bg-[#EB1D25] rounded-lg flex items-center justify-center">
              <Car className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Fleet Management - {operator.name}</h1>
              <p className="text-sm text-gray-600 mt-1">{operator.type} Operator • {operator.location}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Navigation Tabs */}
        <div className="mb-6">
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 hover:bg-blue-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="p-8">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperatorFleetPage;