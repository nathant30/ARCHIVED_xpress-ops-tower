"use client";

import React, { useState, useEffect } from 'react';
import { 
  User, 
  Users, 
  Car, 
  MapPin, 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Award,
  Star,
  Search,
  Filter,
  Plus,
  ChevronRight,
  Phone,
  Mail,
  Calendar,
  Shield,
  AlertTriangle,
  CheckCircle,
  Eye,
  MoreHorizontal,
  X,
  MessageSquare
} from 'lucide-react';

const OperatorsPortal = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedOperator, setSelectedOperator] = useState(null);
  const [showFleetModal, setShowFleetModal] = useState(false);
  const [showFinancialModal, setShowFinancialModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [modalOperator, setModalOperator] = useState(null);

  // Mock operators data
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
      activeDrivers: 3,
      performanceScore: 92,
      commissionTier: 3,
      commissionRate: '3%',
      monthlyEarnings: 85600,
      totalEarnings: 450000,
      rating: 4.8,
      utilization: 88,
      hasOBD: true
    },
    {
      id: 'OP002',
      name: 'Carlos Fleet Services',
      type: 'General',
      email: 'carlos@fleetservices.com',
      phone: '+639181234567',
      joinDate: '20/03/2023',
      status: 'active',
      location: 'Quezon City',
      vehicleCount: 7,
      maxVehicles: 10,
      activeDrivers: 12,
      performanceScore: 78,
      commissionTier: 1,
      commissionRate: '1%',
      monthlyEarnings: 125000,
      totalEarnings: 890000,
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
      email: 'green@transport.com',
      phone: '+639201234567',
      joinDate: '15/08/2023',
      status: 'warning',
      location: 'Pasig City',
      vehicleCount: 2,
      maxVehicles: 3,
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
      name: 'City Movers Inc',
      type: 'General',
      email: 'info@citymovers.com',
      phone: '+639211234567',
      joinDate: '25/09/2023',
      status: 'inactive',
      location: 'Manila',
      vehicleCount: 0,
      maxVehicles: 10,
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

  const getOperatorTypeBadge = (type) => {
    const configs = {
      TNVS: { label: 'TNVS', color: 'bg-blue-100 text-blue-700' },
      General: { label: 'General', color: 'bg-green-100 text-green-700' },
      Fleet: { label: 'Fleet', color: 'bg-purple-100 text-purple-700' }
    };
    return configs[type] || configs.General;
  };

  const getStatusConfig = (status) => {
    const configs = {
      active: { color: 'bg-green-100 text-green-700', label: 'Active' },
      warning: { color: 'bg-yellow-100 text-yellow-700', label: 'Warning' },
      inactive: { color: 'bg-gray-100 text-gray-700', label: 'Inactive' },
      suspended: { color: 'bg-red-100 text-red-700', label: 'Suspended' }
    };
    return configs[status] || configs.inactive;
  };

  const getCommissionTierBadge = (tier) => {
    if (tier === 0) return { label: 'No Commission', color: 'bg-gray-100 text-gray-700' };
    
    const colors = {
      1: 'bg-green-100 text-green-700',
      2: 'bg-blue-100 text-blue-700', 
      3: 'bg-purple-100 text-purple-700'
    };
    
    return { label: `Tier ${tier}`, color: colors[tier] || colors[1] };
  };

  const getPerformanceColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const OperatorModal = ({ operator, onClose }) => {
    if (!operator) return null;

    const typeBadge = getOperatorTypeBadge(operator.type);
    const statusConfig = getStatusConfig(operator.status);
    const commissionBadge = getCommissionTierBadge(operator.commissionTier);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-8 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
                  {operator.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">{operator.name}</h2>
                  <p className="text-gray-600 text-lg mb-3">{operator.email}</p>
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${typeBadge.color}`}>
                      {typeBadge.label} Operator
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>
                      {statusConfig.label}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${commissionBadge.color}`}>
                      {commissionBadge.label}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-3xl font-light"
              >
                ×
              </button>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Operator Details */}
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-gray-50 rounded-2xl p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Operator Information</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">Contact Phone</p>
                      <p className="text-base font-medium">{operator.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">Primary Location</p>
                      <p className="text-base font-medium">{operator.location}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">Join Date</p>
                      <p className="text-base font-medium">{operator.joinDate}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">Operator Type</p>
                      <p className="text-base font-medium">{operator.type} Operator</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-2xl p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Fleet Overview</h3>
                  <div className="grid grid-cols-3 gap-6">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-blue-600 mb-2">{operator.vehicleCount}</p>
                      <p className="text-sm font-medium text-gray-600">Active Vehicles</p>
                      <p className="text-xs text-gray-500">
                        of {operator.maxVehicles === 'Unlimited' ? '∞' : operator.maxVehicles} max
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-green-600 mb-2">{operator.activeDrivers}</p>
                      <p className="text-sm font-medium text-gray-600">Active Drivers</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-purple-600 mb-2">{operator.utilization}%</p>
                      <p className="text-sm font-medium text-gray-600">Fleet Utilization</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-2xl p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Financial Performance</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">Monthly Earnings</p>
                      <p className="text-2xl font-bold text-green-600">₱{operator.monthlyEarnings.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">Total Earnings</p>
                      <p className="text-2xl font-bold text-gray-900">₱{operator.totalEarnings.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">Commission Rate</p>
                      <p className="text-lg font-bold text-purple-600">{operator.commissionRate}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">Commission Tier</p>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${commissionBadge.color}`}>
                        {commissionBadge.label}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Sidebar */}
              <div className="space-y-6">
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Performance Score</h3>
                  
                  <div className="text-center mb-6">
                    <div className={`text-4xl font-bold ${getPerformanceColor(operator.performanceScore)} mb-2`}>
                      {operator.performanceScore}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                      <div 
                        className={`h-3 rounded-full ${
                          operator.performanceScore >= 90 ? 'bg-green-500' : 
                          operator.performanceScore >= 70 ? 'bg-blue-500' : 
                          operator.performanceScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${operator.performanceScore}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-600">
                      {operator.performanceScore >= 90 ? 'Excellent' : 
                       operator.performanceScore >= 70 ? 'Good' : 
                       operator.performanceScore >= 50 ? 'Needs Improvement' : 'Critical'}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Driver Rating</span>
                      <div className="flex items-center space-x-1">
                        <span className="font-medium">{operator.rating}</span>
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Fleet Utilization</span>
                      <span className="font-medium">{operator.utilization}%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <button 
                      onClick={() => {
                        setModalOperator(operator);
                        setShowFleetModal(true);
                      }}
                      className="w-full bg-white text-purple-700 border border-purple-200 py-3 rounded-lg hover:bg-purple-50 font-medium transition-colors"
                    >
                      View Fleet Details
                    </button>
                    <button 
                      onClick={() => {
                        setModalOperator(operator);
                        setShowFinancialModal(true);
                      }}
                      className="w-full bg-white text-purple-700 border border-purple-200 py-3 rounded-lg hover:bg-purple-50 font-medium transition-colors"
                    >
                      Financial Reports
                    </button>
                    <button 
                      onClick={() => {
                        setModalOperator(operator);
                        setShowContactModal(true);
                      }}
                      className="w-full bg-white text-purple-700 border border-purple-200 py-3 rounded-lg hover:bg-purple-50 font-medium transition-colors"
                    >
                      Contact Operator
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const filteredOperators = operators.filter(operator => {
    const matchesSearch = operator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         operator.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         operator.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'tnvs' && operator.type === 'TNVS') ||
                         (filterType === 'general' && operator.type === 'General') ||
                         (filterType === 'fleet' && operator.type === 'Fleet') ||
                         (filterType === 'active' && operator.status === 'active');

    return matchesSearch && matchesFilter;
  });

  // Fleet Details Modal Component
  const FleetDetailsModal = () => {
    if (!modalOperator) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Car className="w-7 h-7 text-blue-600" />
                Fleet Details - {modalOperator.name}
              </h2>
              <button
                onClick={() => setShowFleetModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-blue-50 rounded-xl p-6 text-center">
                <Car className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <h3 className="text-2xl font-bold text-blue-900">{modalOperator.vehicleCount}</h3>
                <p className="text-blue-600">Active Vehicles</p>
                <p className="text-sm text-blue-500 mt-1">of {modalOperator.maxVehicles} max</p>
              </div>
              <div className="bg-green-50 rounded-xl p-6 text-center">
                <Users className="w-8 h-8 text-green-600 mx-auto mb-3" />
                <h3 className="text-2xl font-bold text-green-900">{modalOperator.driverCount || modalOperator.activeDrivers}</h3>
                <p className="text-green-600">Active Drivers</p>
                <p className="text-sm text-green-500 mt-1">Driver-to-vehicle ratio</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-6 text-center">
                <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                <h3 className="text-2xl font-bold text-purple-900">{modalOperator.utilization}%</h3>
                <p className="text-purple-600">Fleet Utilization</p>
                <p className="text-sm text-purple-500 mt-1">Daily average</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Fleet Overview</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Operator Type</span>
                    <span className="font-semibold text-blue-600">{modalOperator.type}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Primary Location</span>
                    <span className="font-semibold">{modalOperator.location}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Join Date</span>
                    <span className="font-semibold">{modalOperator.joinDate}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">OBD Equipped</span>
                    <span className={`font-semibold ${modalOperator.hasOBD ? 'text-green-600' : 'text-gray-500'}`}>
                      {modalOperator.hasOBD ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-green-700">Performance Score</span>
                      <span className="text-2xl font-bold text-green-900">{modalOperator.performanceScore}</span>
                    </div>
                    <div className="w-full bg-green-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${modalOperator.performanceScore}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Driver Rating</span>
                    <div className="flex items-center gap-1">
                      <span className="font-semibold">{modalOperator.rating}</span>
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Commission Tier</span>
                    <span className="font-semibold text-purple-600">Tier {modalOperator.commissionTier}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end space-x-3">
              <button
                onClick={() => setShowFleetModal(false)}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Manage Fleet
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Financial Reports Modal Component
  const FinancialReportsModal = () => {
    if (!modalOperator) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <DollarSign className="w-7 h-7 text-green-600" />
                Financial Reports - {modalOperator.name}
              </h2>
              <button
                onClick={() => setShowFinancialModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-green-50 rounded-xl p-6 text-center">
                <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-3" />
                <h3 className="text-2xl font-bold text-green-900">₱{modalOperator.monthlyEarnings.toLocaleString()}</h3>
                <p className="text-green-600">Monthly Earnings</p>
                <p className="text-sm text-green-500 mt-1">Current month</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-6 text-center">
                <DollarSign className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <h3 className="text-2xl font-bold text-blue-900">₱{modalOperator.totalEarnings.toLocaleString()}</h3>
                <p className="text-blue-600">Total Earnings</p>
                <p className="text-sm text-blue-500 mt-1">All time</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-6 text-center">
                <Target className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                <h3 className="text-2xl font-bold text-purple-900">{modalOperator.commissionRate}</h3>
                <p className="text-purple-600">Commission Rate</p>
                <p className="text-sm text-purple-500 mt-1">Tier {modalOperator.commissionTier}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Breakdown</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Gross Revenue</span>
                    <span className="font-semibold text-green-600">₱{(modalOperator.monthlyEarnings * 1.15).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Platform Commission</span>
                    <span className="font-semibold text-red-600">-₱{(modalOperator.monthlyEarnings * 0.15).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border border-green-200">
                    <span className="text-green-700 font-medium">Net Earnings</span>
                    <span className="font-bold text-green-900">₱{modalOperator.monthlyEarnings.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">BIR Compliance</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Withholding Tax (2%)</span>
                    <span className="font-semibold">₱{(modalOperator.monthlyEarnings * 0.02).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">VAT Status</span>
                    <span className="font-semibold text-blue-600">VAT Registered</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                    <span className="text-blue-700">2307 Certificate</span>
                    <span className="font-semibold text-blue-900">Available</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Commission Tier Progress</h3>
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-medium">Current: Tier {modalOperator.commissionTier}</span>
                  <span className="text-purple-600 font-semibold">{modalOperator.commissionRate} commission</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-purple-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${(modalOperator.commissionTier / 3) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm text-gray-600 mt-2">
                  <span>Tier 1 (1%)</span>
                  <span>Tier 2 (2%)</span>
                  <span>Tier 3 (3%)</span>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end space-x-3">
              <button
                onClick={() => setShowFinancialModal(false)}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
              <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                Download Report
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Contact Operator Modal Component
  const ContactOperatorModal = () => {
    if (!modalOperator) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Phone className="w-7 h-7 text-blue-600" />
                Contact - {modalOperator.name}
              </h2>
              <button
                onClick={() => setShowContactModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 gap-6 mb-6">
              <div className="bg-blue-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">Contact Information</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Phone Number</p>
                      <p className="font-semibold text-gray-900">{modalOperator.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Email Address</p>
                      <p className="font-semibold text-gray-900">{modalOperator.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Primary Location</p>
                      <p className="font-semibold text-gray-900">{modalOperator.location}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-4">
                <button className="flex items-center justify-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
                  <Phone className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-700">Call Now</span>
                </button>
                <button className="flex items-center justify-center gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-700">Send Email</span>
                </button>
                <button className="flex items-center justify-center gap-2 p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors">
                  <MessageSquare className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-purple-700">Send Message</span>
                </button>
                <button className="flex items-center justify-center gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <span className="font-medium text-yellow-700">Report Issue</span>
                </button>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Send Message</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter message subject..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                  <textarea
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Type your message here..."
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowContactModal(false)}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Send Message
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Operators Management</h1>
              <p className="text-gray-600">Manage TNVS, General, and Fleet operators across your platform</p>
            </div>
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center space-x-2 font-medium">
              <Plus className="w-5 h-5" />
              <span>Add Operator</span>
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-blue-50 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Total Operators</p>
                  <p className="text-3xl font-bold text-blue-900">{operators.length}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-green-50 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Active Operators</p>
                  <p className="text-3xl font-bold text-green-900">
                    {operators.filter(o => o.status === 'active').length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div className="bg-purple-50 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">Total Vehicles</p>
                  <p className="text-3xl font-bold text-purple-900">
                    {operators.reduce((sum, o) => sum + o.vehicleCount, 0)}
                  </p>
                </div>
                <Car className="w-8 h-8 text-purple-600" />
              </div>
            </div>
            <div className="bg-yellow-50 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-600 text-sm font-medium">Avg Performance</p>
                  <p className="text-3xl font-bold text-yellow-900">
                    {Math.round(operators.reduce((sum, o) => sum + o.performanceScore, 0) / operators.length)}
                  </p>
                </div>
                <Target className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center justify-between space-x-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search operators..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex space-x-3">
              {[
                { key: 'all', label: 'All Operators' },
                { key: 'tnvs', label: 'TNVS' },
                { key: 'general', label: 'General' },
                { key: 'fleet', label: 'Fleet' },
                { key: 'active', label: 'Active Only' }
              ].map(filter => (
                <button
                  key={filter.key}
                  onClick={() => setFilterType(filter.key)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterType === filter.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Operators List */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">OPERATOR</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">TYPE</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">STATUS</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">FLEET SIZE</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">PERFORMANCE</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">MONTHLY EARNINGS</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">COMMISSION</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">LOCATION</th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredOperators.map((operator) => {
                  const typeBadge = getOperatorTypeBadge(operator.type);
                  const statusConfig = getStatusConfig(operator.status);
                  const commissionBadge = getCommissionTierBadge(operator.commissionTier);

                  return (
                    <tr 
                      key={operator.id} 
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => setSelectedOperator(operator)}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                            {operator.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{operator.name}</p>
                            <p className="text-sm text-gray-600">{operator.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${typeBadge.color}`}>
                            {typeBadge.label}
                          </span>
                          {operator.hasOBD && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                              OBD
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <p className="font-medium text-gray-900">
                          {operator.vehicleCount} vehicles
                        </p>
                        <p className="text-sm text-gray-600">
                          {operator.activeDrivers} drivers
                        </p>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <span className={`font-medium ${getPerformanceColor(operator.performanceScore)}`}>
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
                        <p className="font-medium text-green-600">₱{operator.monthlyEarnings.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">{operator.utilization}% utilization</p>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${commissionBadge.color}`}>
                          {commissionBadge.label}
                        </span>
                        <p className="text-sm text-gray-600 mt-1">{operator.commissionRate}</p>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-gray-900">{operator.location}</p>
                        <div className="flex items-center space-x-1 mt-1">
                          <span className="font-medium text-yellow-600">{operator.rating}</span>
                          <Star className="w-3 h-3 text-yellow-400 fill-current" />
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <button className="text-gray-400 hover:text-gray-600">
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {filteredOperators.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No operators found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>

      {/* Professional Modals */}
      {showFleetModal && <FleetDetailsModal />}
      {showFinancialModal && <FinancialReportsModal />}
      {showContactModal && <ContactOperatorModal />}

      {/* Operator Detail Modal */}
      <OperatorModal 
        operator={selectedOperator} 
        onClose={() => setSelectedOperator(null)} 
      />
    </div>
  );
};

export default OperatorsPortal;