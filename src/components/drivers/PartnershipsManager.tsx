'use client';

import React, { useState } from 'react';
import { 
  Award, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Edit, 
  Plus, 
  Search, 
  Filter,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart3,
  Star,
  Calendar,
  Clock,
  X,
  Eye,
  ChevronDown,
  MessageCircle
} from 'lucide-react';

interface PartnershipTier {
  id: string;
  name: string;
  serviceType: 'tnvs' | 'mototaxi' | 'taxi';
  type: 'individual' | 'fleet' | 'premium';
  commissionRate: number;
  additionalDiscount?: number;
  requirements: {
    minRating?: number;
    minTrips?: number;
    minMonths?: number;
    specialCriteria?: string[];
  };
  benefits: string[];
  driverCount: number;
  averageRevenue: number;
  satisfactionScore: number;
  status: 'active' | 'inactive' | 'pending';
}

interface PerformanceMetric {
  tierId: string;
  tierName: string;
  driverCount: number;
  totalRevenue: number;
  avgTripsPerDriver: number;
  retentionRate: number;
  promotionRate: number;
  avgRating: number;
  growth: number;
}

const PartnershipsManager = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTier, setSelectedTier] = useState<PartnershipTier | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'overview' | 'edit' | 'history' | 'notifications'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedServiceType, setSelectedServiceType] = useState<'all' | 'tnvs' | 'mototaxi' | 'taxi'>('all');
  const [userRole, setUserRole] = useState<'admin' | 'viewer'>('admin'); // Mock admin role
  const [driversSearchTerm, setDriversSearchTerm] = useState('');
  const [expandedNotifications, setExpandedNotifications] = useState<Set<string>>(new Set());

  // Mock partnership tiers data
  const partnershipTiers: PartnershipTier[] = [
    {
      id: '1',
      name: 'Advanced',
      serviceType: 'tnvs',
      type: 'individual',
      commissionRate: 15,
      requirements: {
        minRating: 4.8,
        minTrips: 1000,
        minMonths: 6,
        specialCriteria: ['Fraud-free record', 'Customer service training completed']
      },
      benefits: [
        'Lowest commission rate (15%)',
        'Priority customer support',
        'Fast payment processing (same day)',
        'Exclusive bonus campaigns',
        'Premium insurance coverage'
      ],
      driverCount: 734,
      averageRevenue: 45000,
      satisfactionScore: 9.2,
      status: 'active'
    },
    {
      id: '2',
      name: 'Professional',
      serviceType: 'tnvs',
      type: 'individual',
      commissionRate: 18,
      requirements: {
        minRating: 4.5,
        minTrips: 500,
        minMonths: 3
      },
      benefits: [
        'Competitive commission rate (18%)',
        'Standard customer support',
        'Regular payment processing (next day)',
        'Access to training programs'
      ],
      driverCount: 512,
      averageRevenue: 38000,
      satisfactionScore: 8.7,
      status: 'active'
    },
    {
      id: '3',
      name: 'Standard',
      serviceType: 'mototaxi',
      type: 'individual',
      commissionRate: 20,
      requirements: {
        minRating: 4.0,
        minTrips: 100,
        minMonths: 1
      },
      benefits: [
        'Standard commission rate (20%)',
        'Basic customer support',
        'Standard payment processing (2-3 days)'
      ],
      driverCount: 187,
      averageRevenue: 28000,
      satisfactionScore: 7.8,
      status: 'active'
    },
    {
      id: '4',
      name: 'Premium Fleet',
      serviceType: 'mototaxi',
      type: 'fleet',
      commissionRate: 13,
      additionalDiscount: 2,
      requirements: {
        minRating: 4.6,
        specialCriteria: ['Fleet size 10+ vehicles', 'Fleet management system integration']
      },
      benefits: [
        'Lowest fleet commission (13%)',
        'Bulk payment processing',
        'Dedicated fleet support',
        'Custom reporting dashboard',
        'Vehicle maintenance partnerships'
      ],
      driverCount: 298,
      averageRevenue: 520000,
      satisfactionScore: 9.0,
      status: 'active'
    },
    {
      id: '5',
      name: 'Taxi Salary',
      serviceType: 'taxi',
      type: 'individual',
      commissionRate: 0,
      requirements: {
        specialCriteria: ['Valid taxi franchise', 'LTFRB compliance certificate']
      },
      benefits: [
        'Fixed salary structure',
        'No commission fees',
        'Government subsidy eligibility',
        'Taxi-specific insurance',
        'Regulatory compliance support'
      ],
      driverCount: 116,
      averageRevenue: 25000,
      satisfactionScore: 8.3,
      status: 'active'
    }
  ];

  // Mock performance metrics
  const performanceMetrics: PerformanceMetric[] = [
    {
      tierId: '1',
      tierName: 'Advanced',
      driverCount: 734,
      totalRevenue: 33030000,
      avgTripsPerDriver: 287,
      retentionRate: 96.2,
      promotionRate: 8.5,
      avgRating: 4.83,
      growth: 12.3
    },
    {
      tierId: '2',
      tierName: 'Professional',
      driverCount: 512,
      totalRevenue: 19456000,
      avgTripsPerDriver: 234,
      retentionRate: 89.7,
      promotionRate: 15.2,
      avgRating: 4.61,
      growth: 8.7
    }
  ];

  const filteredTiers = partnershipTiers.filter(tier => {
    const matchesSearch = tier.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesServiceType = selectedServiceType === 'all' || tier.serviceType === selectedServiceType;
    return matchesSearch && matchesServiceType;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'individual': return 'bg-blue-100 text-blue-800';
      case 'fleet': return 'bg-purple-100 text-purple-800';
      case 'premium': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getServiceTypeColor = (serviceType: string) => {
    switch (serviceType) {
      case 'tnvs': return 'bg-indigo-100 text-indigo-800';
      case 'mototaxi': return 'bg-yellow-100 text-yellow-800';
      case 'taxi': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600';
      case 'inactive': return 'text-red-600';
      case 'pending': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return CheckCircle;
      case 'inactive': return XCircle;
      case 'pending': return AlertTriangle;
      default: return AlertTriangle;
    }
  };

  const toggleNotification = (notificationId: string) => {
    const newExpanded = new Set(expandedNotifications);
    if (newExpanded.has(notificationId)) {
      newExpanded.delete(notificationId);
    } else {
      newExpanded.add(notificationId);
    }
    setExpandedNotifications(newExpanded);
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <Award className="w-8 h-8 text-blue-600" />
            <span className="text-sm bg-blue-200 text-blue-800 px-2 py-1 rounded-full font-medium">+12.3%</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">5</h3>
          <p className="text-blue-700 font-medium">Active Commission Profiles</p>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 text-green-600" />
            <span className="text-sm bg-green-200 text-green-800 px-2 py-1 rounded-full font-medium">1,847</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">₱2.4M</h3>
          <p className="text-green-700 font-medium">Total Fleet Revenue</p>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
          <div className="flex items-center justify-between mb-4">
            <BarChart3 className="w-8 h-8 text-purple-600" />
            <span className="text-sm bg-purple-200 text-purple-800 px-2 py-1 rounded-full font-medium">4.73</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">17.2%</h3>
          <p className="text-purple-700 font-medium">Average Commission</p>
        </div>

        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg p-6 border border-yellow-200">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-8 h-8 text-yellow-600" />
            <span className="text-sm bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full font-medium">92.5%</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">127</h3>
          <p className="text-yellow-700 font-medium">Eligible for Promotion</p>
        </div>
      </div>

      {/* Performance by Tier */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance by Commission Profile</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Tier</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Drivers</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Revenue</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Avg Trips</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Retention</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Rating</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Growth</th>
              </tr>
            </thead>
            <tbody>
              {performanceMetrics.map((metric) => (
                <tr key={metric.tierId} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{metric.tierName}</td>
                  <td className="py-3 px-4 text-gray-700">{metric.driverCount.toLocaleString()}</td>
                  <td className="py-3 px-4 font-medium text-gray-900">₱{(metric.totalRevenue / 1000000).toFixed(1)}M</td>
                  <td className="py-3 px-4 text-gray-700">{metric.avgTripsPerDriver}</td>
                  <td className="py-3 px-4">
                    <span className="text-green-600 font-medium">{metric.retentionRate}%</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="text-gray-700">{metric.avgRating}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-green-600 font-medium">+{metric.growth}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderTiersTab = () => (
    <div className="space-y-6">
      {/* Header with search and filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search commission profiles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Commission Profile</span>
        </button>
      </div>

      {/* Commission Profiles List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="divide-y divide-gray-200">
          {filteredTiers.map((tier) => {
            const StatusIcon = getStatusIcon(tier.status);
            
            return (
              <div key={tier.id} className="p-4 hover:bg-gray-50 cursor-pointer" 
                   onClick={() => {
                     setSelectedTier(tier);
                     setIsModalOpen(true);
                     setModalTab('overview');
                   }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Award className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{tier.name}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getServiceTypeColor(tier.serviceType)}`}>
                          {tier.serviceType.toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(tier.type)}`}>
                          {tier.type}
                        </span>
                        <StatusIcon className={`w-4 h-4 ${getStatusColor(tier.status)}`} />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">{tier.driverCount}</div>
                      <div className="text-xs text-gray-600">Drivers</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">{tier.commissionRate}%</div>
                      <div className="text-xs text-gray-600">Commission</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">₱{(tier.averageRevenue / 1000).toFixed(0)}K</div>
                      <div className="text-xs text-gray-600">Avg Revenue</div>
                    </div>
                    <Eye className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderDriversTab = () => {
    // Mock driver data with commission profile assignments
    const driversData = [
      {
        id: 1,
        name: 'Maria Santos',
        driverId: 'DR-1001',
        serviceType: selectedServiceType === 'all' ? 'tnvs' : selectedServiceType,
        commissionProfile: 'Premium Individual',
        commissionRate: 15,
        profileType: 'individual',
        status: 'Active',
        totalRides: 2850,
        monthlyRevenue: 85000,
        rating: 4.9,
        joinDate: '2023-01-15',
        phoneNumber: '+63 917 123 4567',
        location: 'Makati City'
      },
      {
        id: 2,
        name: 'Juan Dela Cruz',
        driverId: 'DR-1002',
        serviceType: selectedServiceType === 'all' ? 'mototaxi' : selectedServiceType,
        commissionProfile: 'Fleet Standard',
        commissionRate: 12,
        profileType: 'fleet',
        status: 'Active',
        totalRides: 1650,
        monthlyRevenue: 52000,
        rating: 4.7,
        joinDate: '2023-03-20',
        phoneNumber: '+63 918 234 5678',
        location: 'Quezon City'
      },
      {
        id: 3,
        name: 'Ana Rodriguez',
        driverId: 'DR-1003',
        serviceType: selectedServiceType === 'all' ? 'taxi' : selectedServiceType,
        commissionProfile: 'Individual Basic',
        commissionRate: 10,
        profileType: 'individual',
        status: 'Active',
        totalRides: 820,
        monthlyRevenue: 28000,
        rating: 4.5,
        joinDate: '2023-06-10',
        phoneNumber: '+63 919 345 6789',
        location: 'Pasig City'
      },
      {
        id: 4,
        name: 'Carlos Mendoza',
        driverId: 'DR-1004',
        serviceType: selectedServiceType === 'all' ? 'tnvs' : selectedServiceType,
        commissionProfile: 'Premium Fleet',
        commissionRate: 18,
        profileType: 'premium',
        status: 'Active',
        totalRides: 3200,
        monthlyRevenue: 125000,
        rating: 4.8,
        joinDate: '2022-12-05',
        phoneNumber: '+63 920 456 7890',
        location: 'Manila'
      }
    ];

    const getProfileColor = (profileType: string) => {
      switch (profileType) {
        case 'premium': return 'bg-purple-100 text-purple-800';
        case 'fleet': return 'bg-blue-100 text-blue-800';
        case 'individual': return 'bg-green-100 text-green-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'Active': return 'bg-green-100 text-green-800';
        case 'Inactive': return 'bg-red-100 text-red-800';
        case 'Suspended': return 'bg-yellow-100 text-yellow-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    const getServiceTypeColor = (serviceType: string) => {
      switch (serviceType) {
        case 'tnvs': return 'bg-blue-100 text-blue-800';
        case 'mototaxi': return 'bg-green-100 text-green-800';
        case 'taxi': return 'bg-yellow-100 text-yellow-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Drivers by Commission Profile</h3>
            <p className="text-gray-600">View and manage drivers assigned to each commission profile</p>
          </div>
          <div className="text-sm text-gray-500">
            Total: {driversData.filter(driver => 
              driver.name.toLowerCase().includes(driversSearchTerm.toLowerCase()) ||
              driver.driverId.toLowerCase().includes(driversSearchTerm.toLowerCase())
            ).length} drivers
          </div>
        </div>

        {/* Search */}
        <div className="flex justify-between items-center">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search drivers by name or ID..."
              value={driversSearchTerm}
              onChange={(e) => setDriversSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
            />
          </div>
        </div>

        {/* Drivers Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Driver
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Commission Profile
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Commission Rate
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Rides
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monthly Revenue
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {driversData.filter(driver => 
                  driver.name.toLowerCase().includes(driversSearchTerm.toLowerCase()) ||
                  driver.driverId.toLowerCase().includes(driversSearchTerm.toLowerCase())
                ).map((driver) => (
                  <tr key={driver.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                            <span className="text-xs font-medium text-white">
                              {driver.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{driver.name}</div>
                          <div className="text-sm text-gray-500">{driver.driverId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{driver.commissionProfile}</div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getProfileColor(driver.profileType)}`}>
                          {driver.profileType}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getServiceTypeColor(driver.serviceType)}`}>
                        {driver.serviceType.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {driver.commissionRate}%
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(driver.status)}`}>
                        {driver.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {driver.totalRides.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₱{driver.monthlyRevenue.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm text-gray-900">{driver.rating}</span>
                        <Star className="w-4 h-4 text-yellow-400 ml-1" fill="currentColor" />
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {driver.location}
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Commission Profile Management</h2>
          <p className="text-gray-600 mt-1">Manage driver commission profiles, rates, and requirements by service type</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Service Type:</label>
            <select
              value={selectedServiceType}
              onChange={(e) => setSelectedServiceType(e.target.value as 'all' | 'tnvs' | 'mototaxi' | 'taxi')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Services</option>
              <option value="tnvs">TNVS</option>
              <option value="mototaxi">Mototaxi</option>
              <option value="taxi">Taxi</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('tiers')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'tiers'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Commission Profiles
          </button>
          <button
            onClick={() => setActiveTab('drivers')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'drivers'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Drivers
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'tiers' && renderTiersTab()}
      {activeTab === 'drivers' && renderDriversTab()}

      {/* Commission Profile Detail Modal */}
      {isModalOpen && selectedTier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white rounded-lg w-[80vw] h-[70vh] mx-4 flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{selectedTier.name}</h3>
                  <p className="text-sm text-gray-600">{selectedTier.serviceType.toUpperCase()} - {selectedTier.type} commission profile</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                <button
                  onClick={() => setModalTab('overview')}
                  className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                    modalTab === 'overview'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Eye className="w-4 h-4 inline mr-2" />
                  Overview
                </button>
                {userRole === 'admin' && (
                  <button
                    onClick={() => setModalTab('edit')}
                    className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                      modalTab === 'edit'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Edit className="w-4 h-4 inline mr-2" />
                    Edit Details
                  </button>
                )}
                <button
                  onClick={() => setModalTab('history')}
                  className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                    modalTab === 'history'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Clock className="w-4 h-4 inline mr-2" />
                  Change History
                </button>
                <button
                  onClick={() => setModalTab('notifications')}
                  className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                    modalTab === 'notifications'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <MessageCircle className="w-4 h-4 inline mr-2" />
                  Notifications
                </button>
              </nav>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {modalTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">{selectedTier.driverCount}</div>
                      <div className="text-sm text-gray-600">Active Drivers</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">{selectedTier.commissionRate}%</div>
                      <div className="text-sm text-gray-600">Commission Rate</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">₱{(selectedTier.averageRevenue / 1000).toFixed(0)}K</div>
                      <div className="text-sm text-gray-600">Average Revenue</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Description & Insights</h4>
                    <p className="text-gray-700">
                      {selectedTier.serviceType === 'tnvs' && 
                        `The ${selectedTier.name} tier is designed for ${selectedTier.serviceType.toUpperCase()} (Transportation Network Vehicle Service) drivers who provide premium ride-hailing services. This tier focuses on competitive commission rates, enhanced customer support, and premium vehicle standards to ensure exceptional passenger experiences.`
                      }
                      {selectedTier.serviceType === 'mototaxi' && 
                        `The ${selectedTier.name} tier caters to motorcycle taxi operators, providing specialized benefits for two-wheeled transportation services. This tier includes safety gear support, fuel discounts, and motorcycle-specific insurance coverage to ensure safe and efficient operations.`
                      }
                      {selectedTier.serviceType === 'taxi' && 
                        `The ${selectedTier.name} tier is specifically designed for traditional taxi operators with proper LTFRB licensing and government compliance. This tier provides regulatory support, government subsidy access, and specialized taxi insurance coverage.`
                      }
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Key Benefits</h4>
                      <ul className="space-y-2">
                        {selectedTier.benefits.slice(0, 5).map((benefit, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700 text-sm">{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Requirements</h4>
                      <ul className="space-y-2">
                        {selectedTier.requirements.minRating && (
                          <li className="flex items-start space-x-2">
                            <Star className="w-4 h-4 text-yellow-500 mt-0.5" />
                            <span className="text-gray-700 text-sm">Minimum {selectedTier.requirements.minRating} star rating</span>
                          </li>
                        )}
                        {selectedTier.requirements.minTrips && (
                          <li className="flex items-start space-x-2">
                            <Users className="w-4 h-4 text-blue-500 mt-0.5" />
                            <span className="text-gray-700 text-sm">{selectedTier.requirements.minTrips}+ completed trips</span>
                          </li>
                        )}
                        {selectedTier.requirements.minMonths && (
                          <li className="flex items-start space-x-2">
                            <Clock className="w-4 h-4 text-purple-500 mt-0.5" />
                            <span className="text-gray-700 text-sm">{selectedTier.requirements.minMonths} months experience</span>
                          </li>
                        )}
                        {selectedTier.requirements.specialCriteria?.map((criteria, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                            <span className="text-gray-700 text-sm">{criteria}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {modalTab === 'edit' && userRole === 'admin' && (
                <div className="space-y-6">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      <p className="text-sm text-yellow-800">Changes require approval and will affect {selectedTier.driverCount} drivers.</p>
                    </div>
                  </div>

                  <form className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-4">Commission Settings</h4>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Commission Rate (%)</label>
                            <input
                              type="number"
                              min="5"
                              max="25"
                              step="0.1"
                              defaultValue={selectedTier.commissionRate}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Additional Discount (%)</label>
                            <input
                              type="number"
                              min="0"
                              max="10"
                              step="0.1"
                              defaultValue={selectedTier.additionalDiscount || 0}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Effective Date</label>
                            <input
                              type="date"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 mb-4">Requirements</h4>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Rating</label>
                            <input
                              type="number"
                              min="1"
                              max="5"
                              step="0.1"
                              defaultValue={selectedTier.requirements?.minRating || ''}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Trips</label>
                            <input
                              type="number"
                              min="0"
                              defaultValue={selectedTier.requirements?.minTrips || ''}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Experience (months)</label>
                            <input
                              type="number"
                              min="0"
                              defaultValue={selectedTier.requirements?.minMonths || ''}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Change</label>
                      <textarea
                        rows={4}
                        placeholder="Explain the reason for these changes..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Submit for Approval
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {modalTab === 'history' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-gray-900">Change History</h4>
                    <span className="text-sm text-gray-500">Last 30 days</span>
                  </div>

                  <div className="space-y-4">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-sm font-medium text-gray-900">Commission Rate Updated</span>
                          <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Implemented</span>
                        </div>
                        <span className="text-sm text-gray-500">2 days ago</span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>• Commission rate: 18% → 16%</p>
                        <p>• Reason: Market competition adjustment</p>
                        <p>• Affected drivers: 734</p>
                        <p>• Modified by: Admin User</p>
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-sm font-medium text-gray-900">Requirements Updated</span>
                          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Approved</span>
                        </div>
                        <span className="text-sm text-gray-500">1 week ago</span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>• Minimum rating: 4.5 → 4.3</p>
                        <p>• Reason: Improve driver retention</p>
                        <p>• Affected drivers: 245</p>
                        <p>• Modified by: Operations Manager</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {modalTab === 'notifications' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-gray-900">Driver Notifications</h4>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                      Send Notification
                    </button>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h5 className="font-medium text-blue-900 mb-2">Recent Commission Update</h5>
                    <div className="text-sm text-blue-800 space-y-1">
                      <p>• Sent to: {selectedTier.driverCount} drivers</p>
                      <p>• Delivery status: 98% delivered</p>
                      <p>• Read rate: 87%</p>
                      <p>• Sent: 2 days ago</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-50" onClick={() => toggleNotification('commission-update-1')}>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-gray-900">Commission Rate Update Notice</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">Delivered</span>
                          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedNotifications.has('commission-update-1') ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {expandedNotifications.has('commission-update-1') 
                          ? `Important update to your commission structure! After conducting a comprehensive market analysis and reviewing driver feedback, we've implemented a new optimized commission rate of 16% for your tier. This adjustment reflects current market conditions and aims to provide better value for our valued partners. The new rate is effective immediately and applies to all future trips. We appreciate your continued partnership and commitment to providing excellent service to our customers.`
                          : `Your commission profile has been updated. New rate: 16%`
                        }
                      </p>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>734 recipients</span>
                        <span>2 days ago</span>
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-50" onClick={() => toggleNotification('premium-welcome-1')}>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-gray-900">Welcome to Premium Tier</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">Delivered</span>
                          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedNotifications.has('premium-welcome-1') ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {expandedNotifications.has('premium-welcome-1') 
                          ? `Welcome to our exclusive Premium Commission Tier! Your exceptional performance and dedication have earned you access to our most advantageous commission structure. As a premium partner, you'll enjoy reduced commission rates, priority support, exclusive promotional opportunities, and access to high-value trip requests. This tier represents our appreciation for your consistent quality service and professionalism. Thank you for being an integral part of our success!`
                          : `Congratulations on achieving our premium commission tier!`
                        }
                      </p>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>45 recipients</span>
                        <span>1 week ago</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {modalTab === 'specs' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900">Tier Details</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Commission Rate:</span>
                          <span className="font-medium">{selectedTier.commissionRate}%</span>
                        </div>
                        {selectedTier.additionalDiscount && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Additional Discount:</span>
                            <span className="font-medium">{selectedTier.additionalDiscount}%</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedTier.status)} ${selectedTier.status === 'active' ? 'text-green-700' : selectedTier.status === 'pending' ? 'text-yellow-700' : 'text-red-700'}`}>
                            {selectedTier.status}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Average Revenue:</span>
                          <span className="font-medium">₱{(selectedTier.averageRevenue / 1000).toFixed(1)}K</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Satisfaction Score:</span>
                          <span className="font-medium">{selectedTier.satisfactionScore}/10</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900">Performance Metrics</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Active Drivers:</span>
                          <span className="font-medium">{selectedTier.driverCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Retention Rate:</span>
                          <span className="font-medium text-green-600">92%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Growth Rate:</span>
                          <span className="font-medium text-green-600">+15%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Avg Trips/Driver:</span>
                          <span className="font-medium">245</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">All Requirements</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <ul className="space-y-2">
                        {selectedTier.requirements.minRating && (
                          <li className="text-sm text-gray-700">• Minimum rating: {selectedTier.requirements.minRating} stars</li>
                        )}
                        {selectedTier.requirements.minTrips && (
                          <li className="text-sm text-gray-700">• Minimum trips: {selectedTier.requirements.minTrips}</li>
                        )}
                        {selectedTier.requirements.minMonths && (
                          <li className="text-sm text-gray-700">• Minimum experience: {selectedTier.requirements.minMonths} months</li>
                        )}
                        {selectedTier.requirements.specialCriteria?.map((criteria, index) => (
                          <li key={index} className="text-sm text-gray-700">• {criteria}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Complete Benefits List</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <ul className="grid grid-cols-2 gap-2">
                        {selectedTier.benefits.map((benefit, index) => (
                          <li key={index} className="text-sm text-gray-700 flex items-start space-x-2">
                            <CheckCircle className="w-3 h-3 text-green-500 mt-1 flex-shrink-0" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnershipsManager;