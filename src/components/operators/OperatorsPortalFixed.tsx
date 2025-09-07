'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  BarChart3, 
  Award, 
  Home,
  Car,
  TrendingUp,
  Star,
  DollarSign,
  MapPin,
  Phone,
  Mail,
  Eye,
  ChevronRight,
  Plus
} from 'lucide-react';

const OperatorsPortal = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');

  // Complete operators data with all missing info
  const operators = [
    {
      id: 'OP001',
      name: 'Maria Santos',
      type: 'TNVS',
      email: 'maria.santos@email.com',
      phone: '+639171234567',
      joinDate: '15/01/2023',
      status: 'active',
      location: 'Makati City',
      vehicleCount: 3,
      maxVehicles: 3,
      driverCount: 3,
      activeDrivers: 3,
      performanceScore: 92,
      commissionTier: 3,
      commissionRate: '3%',
      monthlyEarnings: 85600,
      totalEarnings: 425000,
      rating: 4.8,
      utilization: 88,
      hasOBD: true
    },
    {
      id: 'OP002',
      name: 'Carlos Fleet Services',
      type: 'General',
      email: 'operations@carlosfleet.com',
      phone: '+639181234567',
      joinDate: '22/12/2022',
      status: 'active',
      location: 'Quezon City',
      vehicleCount: 7,
      maxVehicles: 10,
      driverCount: 12,
      activeDrivers: 12,
      performanceScore: 78,
      commissionTier: 1,
      commissionRate: '1%',
      monthlyEarnings: 125000,
      totalEarnings: 1250000,
      rating: 4.5,
      utilization: 72,
      hasOBD: false
    },
    {
      id: 'OP003',
      name: 'Metro Fleet Solutions',
      type: 'Fleet',
      email: 'operations@metrofleet.com',
      phone: '+639191234567',
      joinDate: '10/06/2023',
      status: 'active',
      location: 'BGC',
      vehicleCount: 45,
      maxVehicles: 'Unlimited',
      driverCount: 120,
      activeDrivers: 120,
      performanceScore: 95,
      commissionTier: 3,
      commissionRate: '3%',
      monthlyEarnings: 850000,
      totalEarnings: 3200000,
      rating: 4.9,
      utilization: 94,
      hasOBD: true
    },
    {
      id: 'OP004',
      name: 'Green Transport Co',
      type: 'TNVS',
      email: 'support@greentransport.com',
      phone: '+639201234567',
      joinDate: '05/03/2023',
      status: 'warning',
      location: 'Pasig City',
      vehicleCount: 2,
      maxVehicles: 3,
      driverCount: 2,
      activeDrivers: 2,
      performanceScore: 65,
      commissionTier: 1,
      commissionRate: '1%',
      monthlyEarnings: 45000,
      totalEarnings: 180000,
      rating: 4.2,
      utilization: 58,
      hasOBD: false
    },
    {
      id: 'OP005',
      name: 'Express Ride Network',
      type: 'Fleet',
      email: 'admin@expressride.ph',
      phone: '+639211234567',
      joinDate: '18/08/2023',
      status: 'pending',
      location: 'Mandaluyong',
      vehicleCount: 0,
      maxVehicles: 'Unlimited',
      driverCount: 0,
      activeDrivers: 0,
      performanceScore: 0,
      commissionTier: 0,
      commissionRate: '0%',
      monthlyEarnings: 0,
      totalEarnings: 25000,
      rating: 4.0,
      utilization: 0,
      hasOBD: false
    }
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'operators', label: 'Operators List', icon: Users },
    { id: 'performance', label: 'Performance', icon: BarChart3 },
    { id: 'tiers', label: 'Commission Tiers', icon: Award }
  ];

  const handleViewFleet = (operatorId: string) => {
    console.log(`Navigating to fleet for operator: ${operatorId}`);
    router.push(`/operators/${operatorId}/fleet`);
  };

  const OperatorsOverview = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Operators Overview</h2>
          <p className="text-gray-600 mt-1">Comprehensive operator management dashboard</p>
        </div>
        <div className="flex items-center space-x-4">
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-blue-500 p-2 rounded-lg">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center space-x-1 text-green-600">
              <TrendingUp className="w-3 h-3" />
              <span className="text-sm font-medium">+12.3%</span>
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">{operators.length}</h3>
            <p className="text-gray-600 text-sm">Total Operators</p>
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
            <h3 className="text-2xl font-bold text-gray-900">{operators.filter(o => o.status === 'active').length}</h3>
            <p className="text-gray-600 text-sm">Active Operators</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-purple-500 p-2 rounded-lg">
              <Car className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center space-x-1 text-green-600">
              <TrendingUp className="w-3 h-3" />
              <span className="text-sm font-medium">+18.2%</span>
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">{operators.reduce((sum, o) => sum + o.vehicleCount, 0)}</h3>
            <p className="text-gray-600 text-sm">Total Vehicles</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-yellow-500 p-2 rounded-lg">
              <Star className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center space-x-1 text-green-600">
              <TrendingUp className="w-3 h-3" />
              <span className="text-sm font-medium">+0.05</span>
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">
              {(operators.reduce((sum, o) => sum + o.rating, 0) / operators.length).toFixed(1)}
            </h3>
            <p className="text-gray-600 text-sm">Average Rating</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-green-600 p-2 rounded-lg">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center space-x-1 text-green-600">
              <TrendingUp className="w-3 h-3" />
              <span className="text-sm font-medium">+24.8%</span>
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">
              ₱{Math.round(operators.reduce((sum, o) => sum + o.monthlyEarnings, 0) / 1000)}K
            </h3>
            <p className="text-gray-600 text-sm">Total Revenue</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-indigo-500 p-2 rounded-lg">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center space-x-1 text-green-600">
              <TrendingUp className="w-3 h-3" />
              <span className="text-sm font-medium">+2.1%</span>
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">
              {Math.round(operators.reduce((sum, o) => sum + o.performanceScore, 0) / operators.length)}
            </h3>
            <p className="text-gray-600 text-sm">Avg Performance</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Operator Type Distribution</h3>
            <button 
              onClick={() => setActiveTab('operators')}
              className="text-blue-600 hover:text-blue-800 flex items-center space-x-1 text-xs"
            >
              <span>Manage</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {['TNVS', 'General', 'Fleet'].map((type) => {
              const count = operators.filter(o => o.type === type).length;
              const percentage = operators.length > 0 ? ((count / operators.length) * 100).toFixed(1) : '0';
              const color = type === 'TNVS' ? 'bg-blue-500' : type === 'General' ? 'bg-green-500' : 'bg-purple-500';
              
              return (
                <div key={type} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded ${color}`}></div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{type} Operators</div>
                      <div className="text-sm text-gray-600">{type === 'TNVS' ? '≤3 vehicles' : type === 'General' ? '≤10 vehicles' : 'Unlimited'}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">{count}</div>
                    <div className="text-sm text-gray-600">{percentage}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Commission Tiers</h3>
            <button 
              onClick={() => setActiveTab('tiers')}
              className="text-blue-600 hover:text-blue-800 flex items-center space-x-1 text-xs"
            >
              <span>Manage</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map((tier) => {
              const count = operators.filter(o => o.commissionTier === tier).length;
              const percentage = operators.length > 0 ? ((count / operators.length) * 100).toFixed(1) : '0';
              const color = tier === 1 ? 'bg-green-500' : tier === 2 ? 'bg-blue-500' : 'bg-purple-500';
              
              return (
                <div key={tier} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded ${color}`}></div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">Tier {tier}</div>
                      <div className="text-sm text-gray-600">{tier}% commission</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">{count}</div>
                    <div className="text-sm text-gray-600">{percentage}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  const OperatorsList = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Operators List</h2>
          <p className="text-gray-600 mt-1">Manage and monitor all operators</p>
        </div>
        <button 
          onClick={() => alert('Add Operator functionality would open here')}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center space-x-2 font-medium transition-colors"
        >
          <Users className="w-5 h-5" />
          <span>Add Operator</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 font-medium text-gray-700">OPERATOR</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">TYPE</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">STATUS</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">FLEET SIZE</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">PERFORMANCE</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">EARNINGS</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">COMMISSION</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {operators.map((operator) => (
                <tr key={operator.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                        {operator.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{operator.name}</p>
                        <p className="text-sm text-gray-600">{operator.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        operator.type === 'TNVS' ? 'bg-blue-100 text-blue-700' :
                        operator.type === 'General' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {operator.type}
                      </span>
                      {operator.hasOBD && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">OBD</span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      operator.status === 'active' ? 'bg-green-100 text-green-700' :
                      operator.status === 'warning' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {operator.status === 'active' ? 'Active' : operator.status === 'warning' ? 'Warning' : 'Pending'}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-medium text-gray-900">{operator.vehicleCount} vehicles</p>
                      <p className="text-sm text-gray-600">{operator.driverCount} drivers</p>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <span className={`font-medium ${
                        operator.performanceScore >= 90 ? 'text-green-600' :
                        operator.performanceScore >= 70 ? 'text-blue-600' :
                        operator.performanceScore >= 50 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {operator.performanceScore}
                      </span>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            operator.performanceScore >= 90 ? 'bg-green-500' :
                            operator.performanceScore >= 70 ? 'bg-blue-500' :
                            operator.performanceScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${operator.performanceScore}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-medium text-green-600">₱{operator.monthlyEarnings.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">{operator.utilization}% utilization</p>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        operator.commissionTier === 3 ? 'bg-purple-100 text-purple-700' :
                        operator.commissionTier === 2 ? 'bg-blue-100 text-blue-700' : 
                        operator.commissionTier === 1 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {operator.commissionTier > 0 ? `Tier ${operator.commissionTier}` : 'Pending'}
                      </span>
                      <p className="text-sm text-gray-600 mt-1">{operator.commissionRate}</p>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleViewFleet(operator.id);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title={`View ${operator.name}'s Fleet`}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          alert(`More actions for ${operator.name} would appear here`);
                        }}
                        className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OperatorsOverview />;
      case 'operators':
        return <OperatorsList />;
      case 'performance':
        return (
          <div className="text-center py-8">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Performance analytics coming soon</p>
            <button className="mt-4 text-blue-600 hover:text-blue-800 font-medium">
              Configure Analytics
            </button>
          </div>
        );
      case 'tiers':
        return (
          <div className="text-center py-8">
            <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Commission tiers management coming soon</p>
            <button className="mt-4 text-blue-600 hover:text-blue-800 font-medium">
              Manage Tiers
            </button>
          </div>
        );
      default:
        return <OperatorsOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#EB1D25] rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Operators Management</h1>
              <p className="text-sm text-gray-600 mt-1">Comprehensive operator oversight and fleet management</p>
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

export default OperatorsPortal;