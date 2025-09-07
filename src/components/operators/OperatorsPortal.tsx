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
  Eye,
  ChevronRight
} from 'lucide-react';

const OperatorsPortal = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('operators');

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
    router.push(`/operators/${operatorId}/fleet`);
  };

  const OperatorsOverview = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Operators Overview</h2>
          <p className="text-gray-600 mt-1">Comprehensive operator management dashboard</p>
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
                    <button
                      onClick={() => handleViewFleet(operator.id)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Fleet</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const PerformanceTab = () => {
    const [selectedMetric, setSelectedMetric] = useState('performance');
    const [selectedOperator, setSelectedOperator] = useState('all');
    
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Performance Analytics Dashboard</h2>
            <p className="text-gray-600 mt-1">Advanced operator performance analysis and optimization tools</p>
          </div>
          <div className="flex items-center space-x-4">
            <select 
              value={selectedOperator}
              onChange={(e) => setSelectedOperator(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Operators</option>
              {operators.map(op => (
                <option key={op.id} value={op.id}>{op.name}</option>
              ))}
            </select>
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="30d">Last 30 days</option>
              <option value="7d">Last 7 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Export Report
            </button>
          </div>
        </div>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Performance</p>
                <p className="text-3xl font-bold text-gray-900">
                  {Math.round(operators.reduce((sum, o) => sum + o.performanceScore, 0) / operators.length)}
                </p>
                <p className="text-sm text-green-600 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +5.2% vs last period
                </p>
              </div>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <BarChart3 className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Fleet Utilization</p>
                <p className="text-3xl font-bold text-gray-900">
                  {Math.round(operators.reduce((sum, o) => sum + o.utilization, 0) / operators.length)}%
                </p>
                <p className="text-sm text-green-600 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +2.8% vs last period
                </p>
              </div>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Car className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900">
                  ₱{Math.round(operators.reduce((sum, o) => sum + o.monthlyEarnings, 0) / 1000)}K
                </p>
                <p className="text-sm text-green-600 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +18.2% vs last period
                </p>
              </div>
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Customer Rating</p>
                <p className="text-3xl font-bold text-gray-900">
                  {(operators.reduce((sum, o) => sum + o.rating, 0) / operators.length).toFixed(1)}
                </p>
                <p className="text-sm text-green-600 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +0.15 vs last period
                </p>
              </div>
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                <Star className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Performance Analysis Tools */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Performance Benchmarking</h3>
              <div className="flex space-x-2">
                <button 
                  onClick={() => setSelectedMetric('performance')}
                  className={`px-3 py-1 rounded text-sm ${selectedMetric === 'performance' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  Performance
                </button>
                <button 
                  onClick={() => setSelectedMetric('utilization')}
                  className={`px-3 py-1 rounded text-sm ${selectedMetric === 'utilization' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  Utilization
                </button>
                <button 
                  onClick={() => setSelectedMetric('revenue')}
                  className={`px-3 py-1 rounded text-sm ${selectedMetric === 'revenue' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  Revenue
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              {operators.sort((a, b) => {
                if (selectedMetric === 'performance') return b.performanceScore - a.performanceScore;
                if (selectedMetric === 'utilization') return b.utilization - a.utilization;
                return b.monthlyEarnings - a.monthlyEarnings;
              }).map((operator, index) => {
                const value = selectedMetric === 'performance' ? operator.performanceScore :
                           selectedMetric === 'utilization' ? operator.utilization :
                           operator.monthlyEarnings;
                const maxValue = selectedMetric === 'performance' ? 100 :
                               selectedMetric === 'utilization' ? 100 :
                               Math.max(...operators.map(o => o.monthlyEarnings));
                const percentage = selectedMetric === 'revenue' ? (value / maxValue) * 100 : value;
                
                return (
                  <div key={operator.id} className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                          index < 3 ? 'bg-yellow-500' : 'bg-gray-400'
                        }`}>
                          {index + 1}
                        </div>
                        <span className="font-medium text-gray-900">{operator.name}</span>
                      </div>
                      <span className="font-semibold text-gray-900">
                        {selectedMetric === 'revenue' ? `₱${value.toLocaleString()}` : value}
                        {selectedMetric !== 'revenue' && '%'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          index === 0 ? 'bg-green-500' :
                          index === 1 ? 'bg-blue-500' :
                          index === 2 ? 'bg-yellow-500' : 'bg-gray-400'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Insights</h3>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <h4 className="font-medium text-green-800">Top Performer</h4>
                </div>
                <p className="text-sm text-green-700">
                  {operators.sort((a, b) => b.performanceScore - a.performanceScore)[0].name} leads with {operators.sort((a, b) => b.performanceScore - a.performanceScore)[0].performanceScore}% performance score.
                </p>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-2 mb-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  <h4 className="font-medium text-blue-800">Fleet Optimization</h4>
                </div>
                <p className="text-sm text-blue-700">
                  Average utilization is {Math.round(operators.reduce((sum, o) => sum + o.utilization, 0) / operators.length)}%. 
                  Consider redistributing vehicles to improve efficiency.
                </p>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Star className="w-5 h-5 text-yellow-600" />
                  <h4 className="font-medium text-yellow-800">Quality Focus</h4>
                </div>
                <p className="text-sm text-yellow-700">
                  {operators.filter(o => o.performanceScore < 70).length} operators need performance improvement support.
                </p>
              </div>

              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-3">Recommended Actions</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">Review low-performing operator contracts</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">Implement driver training programs</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">Optimize vehicle distribution</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Metrics Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Advanced Performance Metrics</h3>
            <div className="flex space-x-2">
              <button className="text-sm text-blue-600 hover:text-blue-800">Export CSV</button>
              <button className="text-sm text-blue-600 hover:text-blue-800">Schedule Report</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">OPERATOR</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">PERFORMANCE</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">EFFICIENCY</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">QUALITY</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">REVENUE</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">TREND</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {operators.map((operator) => (
                  <tr key={operator.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                          {operator.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{operator.name}</p>
                          <p className="text-sm text-gray-600">{operator.type} • {operator.vehicleCount} vehicles</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <span className={`font-bold text-lg ${
                          operator.performanceScore >= 90 ? 'text-green-600' :
                          operator.performanceScore >= 70 ? 'text-blue-600' :
                          operator.performanceScore >= 50 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {operator.performanceScore}
                        </span>
                        <div className="w-20 bg-gray-200 rounded-full h-3">
                          <div 
                            className={`h-3 rounded-full ${
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
                      <div className="text-center">
                        <span className="font-bold text-gray-900">{operator.utilization}%</span>
                        <div className="text-xs text-gray-500 mt-1">Utilization</div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-1">
                        <span className="font-bold text-gray-900">{operator.rating}</span>
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-xs text-gray-500">({Math.floor(Math.random() * 500 + 100)} reviews)</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <span className="font-bold text-green-600">₱{operator.monthlyEarnings.toLocaleString()}</span>
                        <div className="text-xs text-gray-500">Monthly</div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-medium text-green-600">+{Math.floor(Math.random() * 15 + 5)}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewFleet(operator.id)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                        >
                          Analyze
                        </button>
                        <button className="border border-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-50 transition-colors">
                          Report
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
  };

  const CommissionTiersTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Commission Tiers Management</h2>
          <p className="text-gray-600 mt-1">Manage commission rates and tier assignments</p>
        </div>
        <button 
          onClick={() => alert('Create New Tier functionality would open here')}
          className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Create New Tier
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((tier) => {
          const tierOperators = operators.filter(o => o.commissionTier === tier);
          const totalRevenue = tierOperators.reduce((sum, o) => sum + o.monthlyEarnings, 0);
          
          return (
            <div key={tier} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${
                    tier === 1 ? 'bg-green-500' : tier === 2 ? 'bg-blue-500' : 'bg-purple-500'
                  }`}>
                    {tier}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Tier {tier}</h3>
                    <p className="text-sm text-gray-600">{tier}% Commission Rate</p>
                  </div>
                </div>
                <button 
                  onClick={() => alert(`Edit Tier ${tier} functionality would open here`)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Operators</span>
                  <span className="font-medium text-gray-900">{tierOperators.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Revenue</span>
                  <span className="font-medium text-green-600">₱{totalRevenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Commission Earned</span>
                  <span className="font-medium text-blue-600">₱{Math.round(totalRevenue * (tier / 100)).toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Operators in this tier:</h4>
                <div className="space-y-1">
                  {tierOperators.slice(0, 3).map((operator) => (
                    <div key={operator.id} className="text-sm text-gray-600">
                      {operator.name}
                    </div>
                  ))}
                  {tierOperators.length > 3 && (
                    <div className="text-sm text-gray-500">+{tierOperators.length - 3} more</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Tier Assignment Management</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 font-medium text-gray-700">OPERATOR</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">CURRENT TIER</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">COMMISSION RATE</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">MONTHLY REVENUE</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">COMMISSION EARNED</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {operators.map((operator) => (
                <tr key={operator.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                        {operator.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{operator.name}</p>
                        <p className="text-sm text-gray-600">{operator.type}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      operator.commissionTier === 3 ? 'bg-purple-100 text-purple-700' :
                      operator.commissionTier === 2 ? 'bg-blue-100 text-blue-700' : 
                      operator.commissionTier === 1 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {operator.commissionTier > 0 ? `Tier ${operator.commissionTier}` : 'Pending'}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-medium text-gray-900">{operator.commissionRate}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-medium text-green-600">₱{operator.monthlyEarnings.toLocaleString()}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-medium text-blue-600">
                      ₱{Math.round(operator.monthlyEarnings * (operator.commissionTier / 100)).toLocaleString()}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <select 
                        className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        defaultValue={operator.commissionTier}
                        onChange={(e) => alert(`Change ${operator.name} to Tier ${e.target.value} functionality would be implemented here`)}
                      >
                        <option value={0}>Pending</option>
                        <option value={1}>Tier 1</option>
                        <option value={2}>Tier 2</option>
                        <option value={3}>Tier 3</option>
                      </select>
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
        return <PerformanceTab />;
      case 'tiers':
        return <CommissionTiersTab />;
      default:
        return <OperatorsList />;
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