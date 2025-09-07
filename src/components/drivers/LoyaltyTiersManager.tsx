'use client';

import React, { useState } from 'react';
import { 
  Star, 
  Users, 
  TrendingUp, 
  Gift, 
  Clock, 
  Award, 
  Plus, 
  Edit, 
  MoreHorizontal,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Zap,
  Shield,
  DollarSign,
  Phone,
  Calendar,
  Target,
  Crown,
  TrendingDown,
  Eye,
  X,
  MessageCircle,
  AlertTriangle,
  Search
} from 'lucide-react';

interface LoyaltyTier {
  id: string;
  name: string;
  level: number;
  serviceType: 'mototaxi' | 'tnvs' | 'taxi';
  color: string;
  icon: React.ElementType;
  requirements: {
    minMonths: number;
    minTrips: number;
    minRating?: number;
    additionalCriteria?: string[];
  };
  bonusMultiplier: number;
  pointsRecoveryRate: number;
  xpressBenefits: string[];
  partnerBenefits: string[];
  driverCount: number;
  avgMonthlyRevenue: number;
  promotionRate: number;
  retentionRate: number;
  advancementRate: number;
}

interface LoyaltyMetric {
  tierName: string;
  currentDrivers: number;
  newPromotions: number;
  demotions: number;
  avgTimeToAdvance: number;
  benefitUtilization: number;
  satisfactionScore: number;
  revenueImpact: number;
}

const LoyaltyTiersManager = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedServiceType, setSelectedServiceType] = useState<'mototaxi' | 'tnvs' | 'taxi'>('tnvs');
  const [selectedTier, setSelectedTier] = useState<LoyaltyTier | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'overview' | 'edit' | 'history' | 'notifications'>('overview');
  const [userRole, setUserRole] = useState<'admin' | 'viewer'>('admin'); // Mock admin role
  const [driversSearchTerm, setDriversSearchTerm] = useState('');
  const [expandedNotifications, setExpandedNotifications] = useState<Set<string>>(new Set());

  const toggleNotification = (notificationId: string) => {
    setExpandedNotifications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(notificationId)) {
        newSet.delete(notificationId);
      } else {
        newSet.add(notificationId);
      }
      return newSet;
    });
  };

  // Mock loyalty tiers data - service-specific
  const loyaltyTiers: LoyaltyTier[] = [
    // TNVS Tiers
    {
      id: 'tnvs-4',
      name: 'Platinum',
      level: 4,
      serviceType: 'tnvs',
      color: 'from-purple-500 to-pink-500',
      icon: Crown,
      requirements: {
        minMonths: 12,
        minTrips: 3000,
        minRating: 4.8,
        additionalCriteria: ['Zero major violations', 'Premium vehicle standards']
      },
      bonusMultiplier: 2.0,
      pointsRecoveryRate: 2.0,
      xpressBenefits: ['VIP support hotline', 'Same-day payment', 'Premium insurance'],
      partnerBenefits: ['40% fuel discount', '25% maintenance discount', 'Free insurance'],
      driverCount: 98,
      avgMonthlyRevenue: 75000,
      promotionRate: 2.1,
      retentionRate: 98.5,
      advancementRate: 15.2
    },
    {
      id: 'tnvs-3',
      name: 'Gold',
      level: 3,
      serviceType: 'tnvs',
      color: 'from-yellow-400 to-yellow-600',
      icon: Star,
      requirements: {
        minMonths: 6,
        minTrips: 1500,
        minRating: 4.6
      },
      bonusMultiplier: 1.5,
      pointsRecoveryRate: 1.5,
      xpressBenefits: ['Priority support', 'Next-day payment', 'Enhanced reports'],
      partnerBenefits: ['30% fuel discount', '20% maintenance discount'],
      driverCount: 267,
      avgMonthlyRevenue: 58000,
      promotionRate: 8.7,
      retentionRate: 94.2,
      advancementRate: 22.8
    },
    {
      id: 'tnvs-2',
      name: 'Silver',
      level: 2,
      serviceType: 'tnvs',
      color: 'from-gray-300 to-gray-500',
      icon: Award,
      requirements: {
        minMonths: 3,
        minTrips: 500,
        minRating: 4.3
      },
      bonusMultiplier: 1.25,
      pointsRecoveryRate: 1.25,
      xpressBenefits: ['Standard support', 'Weekly payment'],
      partnerBenefits: ['20% fuel discount', '15% maintenance discount'],
      driverCount: 423,
      avgMonthlyRevenue: 42000,
      promotionRate: 18.5,
      retentionRate: 87.3,
      advancementRate: 31.2
    },
    {
      id: 'tnvs-1',
      name: 'Bronze',
      level: 1,
      serviceType: 'tnvs',
      color: 'from-orange-400 to-red-500',
      icon: Users,
      requirements: {
        minMonths: 0,
        minTrips: 0,
        minRating: 4.0
      },
      bonusMultiplier: 1.0,
      pointsRecoveryRate: 1.0,
      xpressBenefits: ['Basic support', 'Standard payment'],
      partnerBenefits: ['10% fuel discount', '10% maintenance discount'],
      driverCount: 312,
      avgMonthlyRevenue: 32000,
      promotionRate: 35.2,
      retentionRate: 78.9,
      advancementRate: 45.1
    },

    // Mototaxi Tiers
    {
      id: 'mototaxi-4',
      name: 'Elite Rider',
      level: 4,
      serviceType: 'mototaxi',
      color: 'from-green-500 to-teal-500',
      icon: Crown,
      requirements: {
        minMonths: 8,
        minTrips: 2000,
        minRating: 4.7,
        additionalCriteria: ['Safety certified', 'Zero accidents']
      },
      bonusMultiplier: 1.8,
      pointsRecoveryRate: 1.8,
      xpressBenefits: ['24/7 priority support', 'Daily payment', 'Safety gear'],
      partnerBenefits: ['35% fuel discount', 'Free maintenance', 'Healthcare discounts'],
      driverCount: 89,
      avgMonthlyRevenue: 35000,
      promotionRate: 3.2,
      retentionRate: 96.8,
      advancementRate: 18.5
    },
    {
      id: 'mototaxi-3',
      name: 'Pro Rider',
      level: 3,
      serviceType: 'mototaxi',
      color: 'from-blue-400 to-blue-600',
      icon: Star,
      requirements: {
        minMonths: 4,
        minTrips: 800,
        minRating: 4.4
      },
      bonusMultiplier: 1.4,
      pointsRecoveryRate: 1.4,
      xpressBenefits: ['Priority support', 'Next-day payment'],
      partnerBenefits: ['25% fuel discount', 'Maintenance discounts'],
      driverCount: 234,
      avgMonthlyRevenue: 28000,
      promotionRate: 12.4,
      retentionRate: 91.5,
      advancementRate: 26.7
    },
    {
      id: 'mototaxi-2',
      name: 'Skilled Rider',
      level: 2,
      serviceType: 'mototaxi',
      color: 'from-indigo-300 to-indigo-500',
      icon: Award,
      requirements: {
        minMonths: 2,
        minTrips: 200,
        minRating: 4.2
      },
      bonusMultiplier: 1.2,
      pointsRecoveryRate: 1.2,
      xpressBenefits: ['Standard support', 'Bi-weekly payment'],
      partnerBenefits: ['15% fuel discount', 'Basic maintenance'],
      driverCount: 445,
      avgMonthlyRevenue: 22000,
      promotionRate: 22.1,
      retentionRate: 84.2,
      advancementRate: 38.9
    },
    {
      id: 'mototaxi-1',
      name: 'New Rider',
      level: 1,
      serviceType: 'mototaxi',
      color: 'from-gray-400 to-gray-600',
      icon: Users,
      requirements: {
        minMonths: 0,
        minTrips: 0,
        minRating: 4.0
      },
      bonusMultiplier: 1.0,
      pointsRecoveryRate: 1.0,
      xpressBenefits: ['Basic support', 'Weekly payment'],
      partnerBenefits: ['10% fuel discount', 'Basic info'],
      driverCount: 378,
      avgMonthlyRevenue: 18000,
      promotionRate: 42.3,
      retentionRate: 76.4,
      advancementRate: 52.1
    },

    // Taxi Tiers
    {
      id: 'taxi-4',
      name: 'Master Operator',
      level: 4,
      serviceType: 'taxi',
      color: 'from-yellow-500 to-orange-500',
      icon: Crown,
      requirements: {
        minMonths: 24,
        minTrips: 5000,
        minRating: 4.8,
        additionalCriteria: ['LTFRB certified', 'Franchise owner']
      },
      bonusMultiplier: 1.5,
      pointsRecoveryRate: 2.0,
      xpressBenefits: ['Dedicated support', 'Government assistance'],
      partnerBenefits: ['Government subsidies', 'Franchise support'],
      driverCount: 34,
      avgMonthlyRevenue: 45000,
      promotionRate: 1.8,
      retentionRate: 97.1,
      advancementRate: 8.2
    },
    {
      id: 'taxi-3',
      name: 'Senior Driver',
      level: 3,
      serviceType: 'taxi',
      color: 'from-orange-400 to-red-500',
      icon: Star,
      requirements: {
        minMonths: 12,
        minTrips: 2500,
        minRating: 4.5
      },
      bonusMultiplier: 1.3,
      pointsRecoveryRate: 1.5,
      xpressBenefits: ['Priority taxi support', 'Training programs'],
      partnerBenefits: ['Maintenance partnerships', 'Insurance discounts'],
      driverCount: 52,
      avgMonthlyRevenue: 38000,
      promotionRate: 5.7,
      retentionRate: 92.3,
      advancementRate: 15.4
    },
    {
      id: 'taxi-2',
      name: 'Licensed Driver',
      level: 2,
      serviceType: 'taxi',
      color: 'from-red-400 to-pink-500',
      icon: Award,
      requirements: {
        minMonths: 6,
        minTrips: 1000,
        minRating: 4.2
      },
      bonusMultiplier: 1.15,
      pointsRecoveryRate: 1.25,
      xpressBenefits: ['Standard taxi support', 'Compliance help'],
      partnerBenefits: ['Basic insurance', 'Service directories'],
      driverCount: 78,
      avgMonthlyRevenue: 32000,
      promotionRate: 12.8,
      retentionRate: 86.5,
      advancementRate: 23.6
    },
    {
      id: 'taxi-1',
      name: 'Trainee Driver',
      level: 1,
      serviceType: 'taxi',
      color: 'from-pink-400 to-rose-500',
      icon: Users,
      requirements: {
        minMonths: 0,
        minTrips: 0,
        minRating: 4.0
      },
      bonusMultiplier: 1.0,
      pointsRecoveryRate: 1.0,
      xpressBenefits: ['New driver support', 'Regulatory guidance'],
      partnerBenefits: ['Orientation', 'Basic info'],
      driverCount: 67,
      avgMonthlyRevenue: 25000,
      promotionRate: 28.4,
      retentionRate: 79.1,
      advancementRate: 41.8
    }
  ];

  // Mock metrics data - service-specific
  const loyaltyMetrics: LoyaltyMetric[] = [
    { tierName: 'Platinum', currentDrivers: 98, newPromotions: 8, demotions: 1, avgTimeToAdvance: 14.2, benefitUtilization: 87.3, satisfactionScore: 9.4, revenueImpact: 28.5 },
    { tierName: 'Gold', currentDrivers: 267, newPromotions: 22, demotions: 5, avgTimeToAdvance: 8.7, benefitUtilization: 76.8, satisfactionScore: 8.9, revenueImpact: 22.1 },
    { tierName: 'Silver', currentDrivers: 423, newPromotions: 56, demotions: 14, avgTimeToAdvance: 4.2, benefitUtilization: 65.4, satisfactionScore: 8.1, revenueImpact: 15.7 },
    { tierName: 'Bronze', currentDrivers: 312, newPromotions: 78, demotions: 28, avgTimeToAdvance: 2.8, benefitUtilization: 45.2, satisfactionScore: 7.3, revenueImpact: 8.2 },
    { tierName: 'Elite Rider', currentDrivers: 89, newPromotions: 6, demotions: 1, avgTimeToAdvance: 10.5, benefitUtilization: 82.1, satisfactionScore: 9.1, revenueImpact: 25.3 },
    { tierName: 'Pro Rider', currentDrivers: 234, newPromotions: 18, demotions: 4, avgTimeToAdvance: 6.2, benefitUtilization: 71.4, satisfactionScore: 8.5, revenueImpact: 18.9 },
    { tierName: 'Skilled Rider', currentDrivers: 445, newPromotions: 67, demotions: 19, avgTimeToAdvance: 3.1, benefitUtilization: 58.7, satisfactionScore: 7.8, revenueImpact: 12.4 },
    { tierName: 'New Rider', currentDrivers: 378, newPromotions: 89, demotions: 34, avgTimeToAdvance: 1.8, benefitUtilization: 38.9, satisfactionScore: 6.9, revenueImpact: 6.1 },
    { tierName: 'Master Operator', currentDrivers: 34, newPromotions: 2, demotions: 0, avgTimeToAdvance: 18.7, benefitUtilization: 91.2, satisfactionScore: 9.6, revenueImpact: 32.1 },
    { tierName: 'Senior Driver', currentDrivers: 52, newPromotions: 4, demotions: 1, avgTimeToAdvance: 12.3, benefitUtilization: 78.9, satisfactionScore: 8.8, revenueImpact: 24.7 },
    { tierName: 'Licensed Driver', currentDrivers: 78, newPromotions: 8, demotions: 3, avgTimeToAdvance: 7.8, benefitUtilization: 63.2, satisfactionScore: 8.0, revenueImpact: 16.8 },
    { tierName: 'Trainee Driver', currentDrivers: 67, newPromotions: 12, demotions: 8, avgTimeToAdvance: 4.2, benefitUtilization: 42.6, satisfactionScore: 7.1, revenueImpact: 9.3 }
  ];

  // Filter tiers by selected service type
  const filteredTiers = loyaltyTiers.filter(tier => tier.serviceType === selectedServiceType);
  const filteredMetrics = loyaltyMetrics.filter(metric => {
    return filteredTiers.some(tier => tier.name === metric.tierName);
  });

  const getServiceTypeLabel = (serviceType: string) => {
    switch (serviceType) {
      case 'tnvs': return 'TNVS';
      case 'mototaxi': return 'Mototaxi';
      case 'taxi': return 'Taxi';
      default: return serviceType;
    }
  };

  const formatCurrency = (amount: number) => {
    return `₱${(amount / 1000).toFixed(0)}K`;
  };

  const getServiceTypeColor = (serviceType: string) => {
    switch (serviceType) {
      case 'tnvs': return 'bg-indigo-100 text-indigo-800';
      case 'mototaxi': return 'bg-yellow-100 text-yellow-800';
      case 'taxi': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderOverviewTab = () => {
    const totalDrivers = filteredTiers.reduce((sum, tier) => sum + tier.driverCount, 0);
    const avgRevenue = totalDrivers > 0 ? filteredTiers.reduce((sum, tier) => sum + (tier.avgMonthlyRevenue * tier.driverCount), 0) / totalDrivers : 0;
    const avgSatisfaction = filteredMetrics.length > 0 ? filteredMetrics.reduce((sum, metric) => sum + metric.satisfactionScore, 0) / filteredMetrics.length : 0;
    
    return (
      <div className="space-y-6">
        {/* Service Type Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {getServiceTypeLabel(selectedServiceType)} Loyalty Program
              </h3>
              <p className="text-gray-600 text-sm">
                Service-specific tier structure and benefits for {selectedServiceType} drivers
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-900">{filteredTiers.length}</div>
              <div className="text-sm text-blue-700">Active Tiers</div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
            <div className="flex items-center justify-between mb-4">
              <Crown className="w-8 h-8 text-purple-600" />
              <span className="text-sm bg-purple-200 text-purple-800 px-2 py-1 rounded-full font-medium">{filteredTiers.length} Tiers</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{totalDrivers.toLocaleString()}</h3>
            <p className="text-purple-700 font-medium">{getServiceTypeLabel(selectedServiceType)} Drivers</p>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8 text-green-600" />
              <span className="text-sm bg-green-200 text-green-800 px-2 py-1 rounded-full font-medium">+15.2%</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{filteredMetrics.reduce((sum, m) => sum + m.newPromotions, 0)}</h3>
            <p className="text-green-700 font-medium">Monthly Promotions</p>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="w-8 h-8 text-blue-600" />
              <span className="text-sm bg-blue-200 text-blue-800 px-2 py-1 rounded-full font-medium">{formatCurrency(avgRevenue)}</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">₱{((totalDrivers * avgRevenue) / 1000000).toFixed(1)}M</h3>
            <p className="text-blue-700 font-medium">Total Revenue</p>
          </div>

          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg p-6 border border-yellow-200">
            <div className="flex items-center justify-between mb-4">
              <Star className="w-8 h-8 text-yellow-600" />
              <span className="text-sm bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full font-medium">{avgSatisfaction.toFixed(1)}</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{filteredMetrics.length > 0 ? ((filteredMetrics.reduce((sum, m) => sum + m.benefitUtilization, 0) / filteredMetrics.length)).toFixed(1) : '0.0'}%</h3>
            <p className="text-yellow-700 font-medium">Benefit Utilization</p>
          </div>
        </div>

        {/* Tier Performance Comparison */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Loyalty Tier Performance</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Tier</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Drivers</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Promotions</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Benefit Usage</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Satisfaction</th>
                </tr>
              </thead>
              <tbody>
                {filteredMetrics.map((metric) => {
                  const tier = filteredTiers.find(t => t.name === metric.tierName);
                  const Icon = tier?.icon || Star;
                  
                  return (
                    <tr key={metric.tierName} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${tier?.color || 'from-gray-400 to-gray-600'} flex items-center justify-center`}>
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <span className="font-medium text-gray-900">{metric.tierName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-700">{metric.currentDrivers}</td>
                      <td className="py-3 px-4">
                        <span className="text-green-600 font-medium">{metric.newPromotions}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-blue-600 font-medium">{metric.benefitUtilization}%</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="text-gray-700">{metric.satisfactionScore}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderTiersTab = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{getServiceTypeLabel(selectedServiceType)} Loyalty Tier Configuration</h3>
          <p className="text-gray-600">Manage tier requirements, benefits, and multipliers for {selectedServiceType} drivers</p>
        </div>
        
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add Custom Tier</span>
        </button>
      </div>

      {/* Loyalty Tiers - Compact List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="divide-y divide-gray-200">
          {filteredTiers.slice().reverse().map((tier) => {
            const Icon = tier.icon;
            
            return (
              <div 
                key={tier.id} 
                className="p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => {
                  setSelectedTier(tier);
                  setIsModalOpen(true);
                  setModalTab('overview');
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${tier.color} flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{tier.name}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getServiceTypeColor(tier.serviceType)}`}>
                          {tier.serviceType.toUpperCase()}
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Level {tier.level}
                        </span>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">{tier.driverCount}</div>
                      <div className="text-xs text-gray-600">Drivers</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">{tier.bonusMultiplier}x</div>
                      <div className="text-xs text-gray-600">Bonus Multiplier</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">₱{(tier.avgMonthlyRevenue / 1000).toFixed(0)}K</div>
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
    // Mock driver data with loyalty tier assignments
    const driversData = [
      {
        id: 1,
        name: 'Maria Santos',
        driverId: 'DR-1001',
        serviceType: selectedServiceType,
        loyaltyTier: 'Diamond',
        tierLevel: 4,
        status: 'Active',
        totalRides: 2850,
        rating: 4.9,
        joinDate: '2023-01-15',
        monthlyRides: 185,
        phoneNumber: '+63 917 123 4567',
        location: 'Makati City'
      },
      {
        id: 2,
        name: 'Juan Dela Cruz',
        driverId: 'DR-1002',
        serviceType: selectedServiceType,
        loyaltyTier: 'Gold',
        tierLevel: 3,
        status: 'Active',
        totalRides: 1650,
        rating: 4.7,
        joinDate: '2023-03-20',
        monthlyRides: 125,
        phoneNumber: '+63 918 234 5678',
        location: 'Quezon City'
      },
      {
        id: 3,
        name: 'Ana Rodriguez',
        driverId: 'DR-1003',
        serviceType: selectedServiceType,
        loyaltyTier: 'Silver',
        tierLevel: 2,
        status: 'Active',
        totalRides: 820,
        rating: 4.5,
        joinDate: '2023-06-10',
        monthlyRides: 85,
        phoneNumber: '+63 919 345 6789',
        location: 'Pasig City'
      },
      {
        id: 4,
        name: 'Carlos Mendoza',
        driverId: 'DR-1004',
        serviceType: selectedServiceType,
        loyaltyTier: 'Bronze',
        tierLevel: 1,
        status: 'Active',
        totalRides: 350,
        rating: 4.3,
        joinDate: '2023-08-15',
        monthlyRides: 45,
        phoneNumber: '+63 920 456 7890',
        location: 'Manila'
      }
    ];

    const getTierColor = (tier: string) => {
      switch (tier) {
        case 'Diamond': return 'bg-purple-100 text-purple-800';
        case 'Gold': return 'bg-yellow-100 text-yellow-800';
        case 'Silver': return 'bg-gray-100 text-gray-800';
        case 'Bronze': return 'bg-orange-100 text-orange-800';
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

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{getServiceTypeLabel(selectedServiceType)} Drivers by Loyalty Tier</h3>
            <p className="text-gray-600">View and manage drivers assigned to each loyalty tier</p>
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
                    Loyalty Tier
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Rides
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monthly Rides
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Join Date
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
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTierColor(driver.loyaltyTier)}`}>
                        {driver.loyaltyTier} (Level {driver.tierLevel})
                      </span>
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
                      {driver.monthlyRides}
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
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(driver.joinDate).toLocaleDateString()}
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
          <h2 className="text-2xl font-bold text-gray-900">Loyalty Tier Management</h2>
          <p className="text-gray-600 mt-1">Manage driver loyalty programs, benefits, and advancement requirements</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Service Type:</label>
            <select
              value={selectedServiceType}
              onChange={(e) => setSelectedServiceType(e.target.value as 'mototaxi' | 'tnvs' | 'taxi')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
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
            Loyalty Tiers
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

      {/* Loyalty Tier Detail Modal */}
      {isModalOpen && selectedTier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white rounded-lg w-[80vw] h-[70vh] mx-4 flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${selectedTier.color} flex items-center justify-center`}>
                  {React.createElement(selectedTier.icon, { className: "w-5 h-5 text-white" })}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{selectedTier.name}</h3>
                  <p className="text-sm text-gray-600">{selectedTier.serviceType.toUpperCase()} - Level {selectedTier.level} loyalty tier</p>
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
                      <div className="text-2xl font-bold text-gray-900">{selectedTier.bonusMultiplier}x</div>
                      <div className="text-sm text-gray-600">Bonus Multiplier</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">₱{(selectedTier.avgMonthlyRevenue / 1000).toFixed(0)}K</div>
                      <div className="text-sm text-gray-600">Average Revenue</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Tier Description & Insights</h4>
                    <p className="text-gray-700">
                      {selectedTier.serviceType === 'tnvs' && 
                        `The ${selectedTier.name} tier is designed for ${selectedTier.serviceType.toUpperCase()} drivers who have demonstrated consistent performance and service quality. This tier provides enhanced earning opportunities with ${selectedTier.bonusMultiplier}x bonus multipliers and premium platform benefits.`
                      }
                      {selectedTier.serviceType === 'mototaxi' && 
                        `The ${selectedTier.name} tier caters to motorcycle taxi operators with proven safety records and customer satisfaction. This tier includes specialized benefits for two-wheeled transportation services with enhanced safety support and fuel partnerships.`
                      }
                      {selectedTier.serviceType === 'taxi' && 
                        `The ${selectedTier.name} tier is designed for traditional taxi operators with proper licensing and regulatory compliance. This tier provides government-backed benefits and specialized support for licensed taxi operations.`
                      }
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Xpress Benefits</h4>
                      <ul className="space-y-2">
                        {selectedTier.xpressBenefits.slice(0, 5).map((benefit, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700 text-sm">{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Partner Benefits</h4>
                      <ul className="space-y-2">
                        {selectedTier.partnerBenefits.slice(0, 5).map((benefit, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <Gift className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700 text-sm">{benefit}</span>
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
                      <p className="text-sm text-yellow-800">Changes require approval and will affect drivers in this loyalty tier.</p>
                    </div>
                  </div>

                  <form className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-4">Advancement Requirements</h4>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Time Required (months)</label>
                            <input
                              type="number"
                              min="0"
                              defaultValue={selectedTier.requirements?.minMonths || 3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Trips Required</label>
                            <input
                              type="number"
                              min="0"
                              defaultValue={selectedTier.requirements?.minTrips || 500}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Rating Required</label>
                            <input
                              type="number"
                              min="1"
                              max="5"
                              step="0.1"
                              defaultValue={selectedTier.requirements?.minRating || 4.5}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 mb-4">Tier Benefits</h4>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bonus Multiplier</label>
                            <input
                              type="number"
                              min="1"
                              max="5"
                              step="0.1"
                              defaultValue={selectedTier.bonusMultiplier || 1.5}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Priority Support Level</label>
                            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                              <option>Standard</option>
                              <option>Priority</option>
                              <option>Premium</option>
                            </select>
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
                          <span className="text-sm font-medium text-gray-900">Advancement Requirements Updated</span>
                          <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Implemented</span>
                        </div>
                        <span className="text-sm text-gray-500">3 days ago</span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>• Required rating: 4.7 → 4.5</p>
                        <p>• Required trips: 600 → 500</p>
                        <p>• Reason: Improve tier accessibility</p>
                        <p>• Affected drivers: 342</p>
                        <p>• Modified by: Loyalty Manager</p>
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-sm font-medium text-gray-900">Bonus Multiplier Increased</span>
                          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Approved</span>
                        </div>
                        <span className="text-sm text-gray-500">1 week ago</span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>• Bonus multiplier: 1.3x → 1.5x</p>
                        <p>• Reason: Competitive adjustment</p>
                        <p>• Affected drivers: 156</p>
                        <p>• Modified by: Operations Director</p>
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

                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h5 className="font-medium text-purple-900 mb-2">Recent Tier Update</h5>
                    <div className="text-sm text-purple-800 space-y-1">
                      <p>• Sent to: {selectedTier.driverCount} drivers in {selectedTier.name}</p>
                      <p>• Delivery status: 99% delivered</p>
                      <p>• Read rate: 92%</p>
                      <p>• Sent: 3 days ago</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-50" onClick={() => toggleNotification('loyalty-req-1')}>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-gray-900">Loyalty Requirements Updated</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">Delivered</span>
                          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedNotifications.has('loyalty-req-1') ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {expandedNotifications.has('loyalty-req-1') 
                          ? `Great news! We've made it easier to achieve ${selectedTier.name} status. Based on driver feedback and market analysis, we've reduced the minimum required trips from 600 to 500, and the minimum rating from 4.7 to 4.5. These changes will help more drivers advance to higher loyalty tiers while maintaining service quality standards. The updated requirements are now active and all eligible drivers have been automatically upgraded.`
                          : `Great news! We've made it easier to achieve ${selectedTier.name} status.`
                        }
                      </p>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>342 recipients</span>
                        <span>3 days ago</span>
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-50" onClick={() => toggleNotification('loyalty-congrats-1')}>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-gray-900">Congratulations on {selectedTier.name}!</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">Delivered</span>
                          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedNotifications.has('loyalty-congrats-1') ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {expandedNotifications.has('loyalty-congrats-1') 
                          ? `Congratulations! You've successfully achieved ${selectedTier.name} status through your dedication and excellent service. This milestone unlocks exclusive benefits including priority dispatch, enhanced earning opportunities, and access to premium features. Your commitment to providing quality rides and maintaining high ratings has earned you this recognition. We're proud to have you as part of our elite driver community. Keep up the fantastic work and enjoy your upgraded benefits!`
                          : `You've achieved ${selectedTier.name} status! Enjoy enhanced benefits and rewards.`
                        }
                      </p>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>28 recipients</span>
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
                          <span className="text-gray-600">Level:</span>
                          <span className="font-medium">{selectedTier.level}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Bonus Multiplier:</span>
                          <span className="font-medium">{selectedTier.bonusMultiplier}x</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Points Recovery Rate:</span>
                          <span className="font-medium">{selectedTier.pointsRecoveryRate}x</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Average Revenue:</span>
                          <span className="font-medium">₱{(selectedTier.avgMonthlyRevenue / 1000).toFixed(1)}K</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Promotion Rate:</span>
                          <span className="font-medium text-green-600">{selectedTier.promotionRate}%</span>
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
                          <span className="font-medium text-green-600">{selectedTier.retentionRate}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Advancement Rate:</span>
                          <span className="font-medium text-blue-600">{selectedTier.advancementRate}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Satisfaction Score:</span>
                          <span className="font-medium">{selectedTier.satisfactionScore}/10</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Requirements</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <ul className="space-y-2">
                        <li className="text-sm text-gray-700">• Minimum experience: {selectedTier.requirements.minMonths} months</li>
                        <li className="text-sm text-gray-700">• Minimum trips: {selectedTier.requirements.minTrips.toLocaleString()}</li>
                        {selectedTier.requirements.minRating && (
                          <li className="text-sm text-gray-700">• Minimum rating: {selectedTier.requirements.minRating} stars</li>
                        )}
                        {selectedTier.requirements.additionalCriteria?.map((criteria, index) => (
                          <li key={index} className="text-sm text-gray-700">• {criteria}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Complete Benefits List</h4>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">Xpress Benefits</h5>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <ul className="space-y-1">
                            {selectedTier.xpressBenefits.map((benefit, index) => (
                              <li key={index} className="text-sm text-gray-700 flex items-start space-x-2">
                                <CheckCircle className="w-3 h-3 text-green-500 mt-1 flex-shrink-0" />
                                <span>{benefit}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">Partner Benefits</h5>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <ul className="space-y-1">
                            {selectedTier.partnerBenefits.map((benefit, index) => (
                              <li key={index} className="text-sm text-gray-700 flex items-start space-x-2">
                                <Gift className="w-3 h-3 text-orange-500 mt-1 flex-shrink-0" />
                                <span>{benefit}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
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

export default LoyaltyTiersManager;