'use client';

import React, { useState } from 'react';
import { 
  Users, 
  BarChart3, 
  Award, 
  Star,
  Home
} from 'lucide-react';
import EnhancedDriverTable from '@/components/features/EnhancedDriverTable';
import DriversOverview from '@/components/drivers/DriversOverview';
import PartnershipsManager from '@/components/drivers/PartnershipsManager';
import LoyaltyTiersManager from '@/components/drivers/LoyaltyTiersManager';

const DriversPage = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // Tab configuration matching the Settings pattern
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'drivers', label: 'Driver List', icon: Users },
    { id: 'partnerships', label: 'Commission Profiles', icon: Award },
    { id: 'loyalty', label: 'Loyalty Tiers', icon: Star }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <DriversOverview />;
      
      case 'drivers':
        return (
          <div className="space-y-4">
            <EnhancedDriverTable />
          </div>
        );
      
      case 'partnerships':
        return <PartnershipsManager />;
      
      case 'loyalty':
        return <LoyaltyTiersManager />;
      
      default:
        return <DriversOverview />;
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
              <h1 className="text-2xl font-semibold text-gray-900">Driver Management</h1>
              <p className="text-sm text-gray-600 mt-1">Comprehensive fleet operations and driver oversight</p>
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

export default DriversPage;