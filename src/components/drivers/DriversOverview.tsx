'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  AlertTriangle, 
  Award,
  Zap,
  MapPin,
  Activity,
  Brain,
  Shield,
  Calendar,
  ArrowRight,
  Star,
  TrendingDown,
  ChevronRight
} from 'lucide-react';

interface FleetStatistic {
  title: string;
  value: string | number;
  change: string;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: React.ElementType;
  color: string;
}

interface AIInsight {
  id: string;
  type: 'recommendation' | 'alert' | 'prediction';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  action?: string;
}

const DriversOverview = () => {
  const router = useRouter();
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  const [selectedRegion, setSelectedRegion] = useState('NCR'); // Default to NCR, should sync with sidebar

  // Mock regional data
  const regionalData = {
    'NCR': {
      drivers: 892,
      avgRating: 4.8,
      revenue: 1200000,
      completionRate: 94.7,
      riskAlerts: 12,
      newPartnerships: 23,
      partnerships: {
        'Individual - Advanced': { count: 356, percentage: 39.9 },
        'Individual - Professional': { count: 267, percentage: 29.9 },
        'Fleet - Premium': { count: 143, percentage: 16.0 },
        'Individual - Standard': { count: 89, percentage: 10.0 },
        'Taxi - Salary': { count: 37, percentage: 4.1 }
      },
      loyalty: {
        'Platinum': { count: 89, percentage: 10.0 },
        'Gold': { count: 201, percentage: 22.5 },
        'Silver': { count: 334, percentage: 37.4 },
        'Bronze': { count: 268, percentage: 30.0 }
      }
    },
    'Cavite': {
      drivers: 234,
      avgRating: 4.6,
      revenue: 320000,
      completionRate: 92.1,
      riskAlerts: 8,
      newPartnerships: 12,
      partnerships: {
        'Individual - Professional': { count: 98, percentage: 41.9 },
        'Individual - Advanced': { count: 75, percentage: 32.1 },
        'Individual - Standard': { count: 45, percentage: 19.2 },
        'Fleet - Premium': { count: 12, percentage: 5.1 },
        'Taxi - Salary': { count: 4, percentage: 1.7 }
      },
      loyalty: {
        'Gold': { count: 47, percentage: 20.1 },
        'Silver': { count: 94, percentage: 40.2 },
        'Bronze': { count: 78, percentage: 33.3 },
        'Platinum': { count: 15, percentage: 6.4 }
      }
    },
    'Bataan': {
      drivers: 187,
      avgRating: 4.7,
      revenue: 280000,
      completionRate: 93.5,
      riskAlerts: 3,
      newPartnerships: 8,
      partnerships: {
        'Individual - Advanced': { count: 82, percentage: 43.9 },
        'Individual - Professional': { count: 67, percentage: 35.8 },
        'Individual - Standard': { count: 28, percentage: 15.0 },
        'Fleet - Premium': { count: 8, percentage: 4.3 },
        'Taxi - Salary': { count: 2, percentage: 1.1 }
      },
      loyalty: {
        'Platinum': { count: 18, percentage: 9.6 },
        'Gold': { count: 52, percentage: 27.8 },
        'Silver': { count: 67, percentage: 35.8 },
        'Bronze': { count: 50, percentage: 26.7 }
      }
    },
    'Boracay': {
      drivers: 156,
      avgRating: 4.9,
      revenue: 450000,
      completionRate: 96.2,
      riskAlerts: 2,
      newPartnerships: 5,
      partnerships: {
        'Individual - Advanced': { count: 78, percentage: 50.0 },
        'Fleet - Premium': { count: 45, percentage: 28.8 },
        'Individual - Professional': { count: 23, percentage: 14.7 },
        'Individual - Standard': { count: 8, percentage: 5.1 },
        'Taxi - Salary': { count: 2, percentage: 1.3 }
      },
      loyalty: {
        'Platinum': { count: 31, percentage: 19.9 },
        'Gold': { count: 47, percentage: 30.1 },
        'Silver': { count: 54, percentage: 34.6 },
        'Bronze': { count: 24, percentage: 15.4 }
      }
    }
  };

  // Get current region data or aggregate all if 'All' selected
  const getCurrentRegionData = () => {
    if (selectedRegion === 'All') {
      // Aggregate all regions
      const allRegions = Object.values(regionalData);
      return {
        drivers: allRegions.reduce((sum, r) => sum + r.drivers, 0),
        avgRating: allRegions.reduce((sum, r) => sum + (r.avgRating * r.drivers), 0) / allRegions.reduce((sum, r) => sum + r.drivers, 0),
        revenue: allRegions.reduce((sum, r) => sum + r.revenue, 0),
        completionRate: allRegions.reduce((sum, r) => sum + (r.completionRate * r.drivers), 0) / allRegions.reduce((sum, r) => sum + r.drivers, 0),
        riskAlerts: allRegions.reduce((sum, r) => sum + r.riskAlerts, 0),
        newPartnerships: allRegions.reduce((sum, r) => sum + r.newPartnerships, 0),
        partnerships: aggregatePartnerships(allRegions),
        loyalty: aggregateLoyalty(allRegions)
      };
    }
    return regionalData[selectedRegion as keyof typeof regionalData] || regionalData.NCR;
  };

  const aggregatePartnerships = (regions: any[]) => {
    const aggregated: any = {};
    regions.forEach(region => {
      Object.entries(region.partnerships).forEach(([key, value]: [string, any]) => {
        if (!aggregated[key]) aggregated[key] = { count: 0, percentage: 0 };
        aggregated[key].count += value.count;
      });
    });
    const totalDrivers = Object.values(aggregated).reduce((sum: number, p: any) => sum + p.count, 0);
    Object.keys(aggregated).forEach(key => {
      aggregated[key].percentage = (aggregated[key].count / totalDrivers) * 100;
    });
    return aggregated;
  };

  const aggregateLoyalty = (regions: any[]) => {
    const aggregated: any = {};
    regions.forEach(region => {
      Object.entries(region.loyalty).forEach(([key, value]: [string, any]) => {
        if (!aggregated[key]) aggregated[key] = { count: 0, percentage: 0 };
        aggregated[key].count += value.count;
      });
    });
    const totalDrivers = Object.values(aggregated).reduce((sum: number, p: any) => sum + p.count, 0);
    Object.keys(aggregated).forEach(key => {
      aggregated[key].percentage = (aggregated[key].count / totalDrivers) * 100;
    });
    return aggregated;
  };

  const currentData = getCurrentRegionData();

  // Dynamic fleet statistics based on selected region
  const fleetStats: FleetStatistic[] = [
    {
      title: 'Active Drivers',
      value: currentData.drivers,
      change: '+12.3%',
      changeType: 'increase',
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: 'Average Rating',
      value: currentData.avgRating.toFixed(2),
      change: '+0.05',
      changeType: 'increase',
      icon: Star,
      color: 'bg-yellow-500'
    },
    {
      title: 'Fleet Revenue',
      value: `₱${(currentData.revenue / 1000000).toFixed(1)}M`,
      change: '+18.2%',
      changeType: 'increase',
      icon: DollarSign,
      color: 'bg-green-500'
    },
    {
      title: 'Completion Rate',
      value: `${currentData.completionRate.toFixed(1)}%`,
      change: '+2.1%',
      changeType: 'increase',
      icon: TrendingUp,
      color: 'bg-purple-500'
    },
    {
      title: 'Risk Alerts',
      value: currentData.riskAlerts,
      change: '-15.8%',
      changeType: 'decrease',
      icon: AlertTriangle,
      color: 'bg-red-500'
    },
    {
      title: 'New Profiles',
      value: currentData.newPartnerships,
      change: '+8.9%',
      changeType: 'increase',
      icon: Award,
      color: 'bg-indigo-500'
    }
  ];

  // Convert current region commission profile data to display format
  const partnershipData = Object.entries(currentData.partnerships).map(([type, data]: [string, any]) => ({
    type,
    count: data.count,
    percentage: data.percentage,
    color: getPartnershipColor(type),
    commission: getCommissionRate(type)
  })).sort((a, b) => b.count - a.count);

  // Convert current region loyalty data to display format
  const loyaltyData = Object.entries(currentData.loyalty).map(([tier, data]: [string, any]) => ({
    tier,
    count: data.count,
    percentage: data.percentage,
    multiplier: getLoyaltyMultiplier(tier),
    color: getLoyaltyColor(tier),
    benefits: getLoyaltyBenefits(tier)
  })).sort((a, b) => b.count - a.count);

  function getPartnershipColor(type: string) {
    const colors: { [key: string]: string } = {
      'Individual - Advanced': 'bg-blue-500',
      'Individual - Professional': 'bg-green-500',
      'Fleet - Premium': 'bg-purple-500',
      'Individual - Standard': 'bg-yellow-500',
      'Taxi - Salary': 'bg-orange-500'
    };
    return colors[type] || 'bg-gray-500';
  }

  function getCommissionRate(type: string) {
    const rates: { [key: string]: string } = {
      'Individual - Advanced': '15%',
      'Individual - Professional': '18%',
      'Fleet - Premium': '13%',
      'Individual - Standard': '20%',
      'Taxi - Salary': 'Fixed'
    };
    return rates[type] || '20%';
  }

  function getLoyaltyColor(tier: string) {
    const colors: { [key: string]: string } = {
      'Platinum': 'bg-purple-600',
      'Gold': 'bg-yellow-500',
      'Silver': 'bg-gray-400',
      'Bronze': 'bg-orange-600'
    };
    return colors[tier] || 'bg-gray-500';
  }

  function getLoyaltyMultiplier(tier: string) {
    const multipliers: { [key: string]: string } = {
      'Platinum': '2x',
      'Gold': '1.5x',
      'Silver': '1.25x',
      'Bronze': '1x'
    };
    return multipliers[tier] || '1x';
  }

  function getLoyaltyBenefits(tier: string) {
    const benefits: { [key: string]: string } = {
      'Platinum': 'Premium Support',
      'Gold': 'Fast Payments',
      'Silver': 'Priority Queue',
      'Bronze': 'Basic'
    };
    return benefits[tier] || 'Basic';
  }

  // Mock AI insights
  const aiInsights: AIInsight[] = [
    {
      id: '1',
      type: 'recommendation',
      title: 'Commission Profile Optimization',
      description: '127 drivers qualify for Advanced tier promotion based on performance metrics',
      confidence: 87,
      impact: 'high',
      action: 'Review promotions'
    },
    {
      id: '2',
      type: 'alert',
      title: 'High Demerit Points Alert',
      description: '15 drivers approaching operational suspension threshold',
      confidence: 95,
      impact: 'high',
      action: 'Assign training'
    },
    {
      id: '3',
      type: 'prediction',
      title: 'Weekend Demand Surge',
      description: 'Predicted 23% increase in ride demand this weekend',
      confidence: 78,
      impact: 'medium',
      action: 'Optimize incentives'
    }
  ];

  const getChangeIcon = (changeType: string) => {
    return changeType === 'increase' ? TrendingUp : changeType === 'decrease' ? TrendingDown : Activity;
  };

  const getChangeColor = (changeType: string) => {
    return changeType === 'increase' ? 'text-green-600' : changeType === 'decrease' ? 'text-red-600' : 'text-gray-600';
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      case 'low': return 'border-green-200 bg-green-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with region and timeframe selectors */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Fleet Overview</h2>
          <p className="text-gray-600 mt-1">Comprehensive driver management dashboard</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
        </div>
      </div>

      {/* Fleet Statistics Grid - Compact Layout */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {fleetStats.map((stat, index) => {
          const Icon = stat.icon;
          const ChangeIcon = getChangeIcon(stat.changeType);
          
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className={`${stat.color} p-2 rounded-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className={`flex items-center space-x-1 ${getChangeColor(stat.changeType)}`}>
                  <ChangeIcon className="w-3 h-3" />
                  <span className="text-sm font-medium">{stat.change}</span>
                </div>
              </div>
              
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                <p className="text-gray-600 text-sm">{stat.title}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Commission Profile & Loyalty Distribution - Compact Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Commission Profile Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Commission Profile Distribution</h3>
            <button
              onClick={() => {/* Navigate to partnerships tab */}}
              className="text-blue-600 hover:text-blue-800 flex items-center space-x-1 text-xs"
            >
              <span>Manage</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          
          <div className="space-y-2">
            {partnershipData.map((partnership, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded ${partnership.color}`}></div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{partnership.type}</div>
                    <div className="text-sm text-gray-600">{partnership.commission}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">{partnership.count}</div>
                  <div className="text-sm text-gray-600">{partnership.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Loyalty Tier Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Loyalty Tiers</h3>
            <button
              onClick={() => {/* Navigate to loyalty tab */}}
              className="text-blue-600 hover:text-blue-800 flex items-center space-x-1 text-xs"
            >
              <span>Manage</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          
          <div className="space-y-2">
            {loyaltyData.map((tier, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded ${tier.color}`}></div>
                  <div>
                    <div className="flex items-center space-x-1">
                      <span className="text-sm font-medium text-gray-900">{tier.tier}</span>
                      <span className="text-sm bg-gray-200 px-1.5 py-0.5 rounded">{tier.multiplier}</span>
                    </div>
                    <div className="text-sm text-gray-600 truncate max-w-[120px]">{tier.benefits}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">{tier.count}</div>
                  <div className="text-sm text-gray-600">{tier.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>


      {/* Nexus AI Insights - Compact */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Nexus AI Fleet Insights</h3>
          </div>
          <button
            onClick={() => router.push('/ai-expansions')}
            className="text-purple-600 hover:text-purple-800 flex items-center space-x-1 text-sm"
          >
            <span>View All</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {aiInsights.map((insight) => (
            <div
              key={insight.id}
              className={`border rounded-lg p-3 ${getImpactColor(insight.impact)}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-1">
                  {insight.type === 'recommendation' && <Zap className="w-3 h-3 text-blue-600" />}
                  {insight.type === 'alert' && <AlertTriangle className="w-3 h-3 text-red-600" />}
                  {insight.type === 'prediction' && <TrendingUp className="w-3 h-3 text-purple-600" />}
                  <span className="text-sm font-medium uppercase tracking-wide text-gray-600">
                    {insight.type}
                  </span>
                </div>
                <span className="text-sm bg-white px-2 py-1 rounded font-medium">
                  {insight.confidence}%
                </span>
              </div>
              
              <h4 className="font-semibold text-gray-900 mb-2">{insight.title}</h4>
              <p className="text-sm text-gray-700 mb-3">{insight.description}</p>
              
              {insight.action && (
                <button 
                  onClick={() => {
                    if (insight.title === 'Commission Profile Optimization') {
                      // Navigate to partnerships tab within drivers page
                      window.dispatchEvent(new CustomEvent('navigate-to-tab', { detail: 'partnerships' }));
                    } else if (insight.title === 'High Demerit Points Alert') {
                      router.push('/fraud-protect');
                    } else if (insight.title === 'Weekend Demand Surge') {
                      // Navigate to pricing or dashboard
                      router.push('/dashboard');
                    }
                  }}
                  className="text-sm bg-white border border-gray-300 px-3 py-1 rounded hover:bg-gray-50 transition-colors"
                >
                  {insight.action}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions - Compact */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => {/* Navigate to drivers tab */}}
            className="flex flex-col items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
          >
            <Users className="w-6 h-6 text-blue-600 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium">Driver List</span>
          </button>
          
          <button
            onClick={() => {/* Navigate to partnerships tab */}}
            className="flex flex-col items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
          >
            <Award className="w-6 h-6 text-green-600 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium">Commission Profiles</span>
          </button>
          
          <button
            onClick={() => {/* Navigate to loyalty tab */}}
            className="flex flex-col items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
          >
            <Star className="w-6 h-6 text-yellow-600 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium">Loyalty Tiers</span>
          </button>
          
          <button
            onClick={() => router.push('/fraud-protect')}
            className="flex flex-col items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
          >
            <Shield className="w-6 h-6 text-red-600 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium">Risk Alerts</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DriversOverview;