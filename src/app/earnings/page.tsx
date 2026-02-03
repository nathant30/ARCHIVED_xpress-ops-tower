'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  Calendar,
  TrendingUp,
  Users,
  Wallet,
  Clock,
  ArrowRight,
} from 'lucide-react';
import {
  EarningsKPICard,
  EarningsTrendChart,
  type EarningsTrendData,
} from '@/components/earnings';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/xpress/card';

const EarningsPage = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: DollarSign },
    { id: 'breakdown', name: 'Breakdown', icon: Calendar, href: '/earnings/breakdown' },
    { id: 'payouts', name: 'Payouts', icon: Wallet, href: '/earnings/payouts' },
    { id: 'settlements', name: 'Settlements', icon: TrendingUp, href: '/earnings/settlements' },
    { id: 'deductions', name: 'Deductions', icon: Users, href: '/earnings/deductions' },
  ];

  // Mock data - will be replaced with real API calls
  const mockEarningsTrend: EarningsTrendData[] = [
    { date: '2026-01-27', amount: 2650, trips: 12 },
    { date: '2026-01-28', amount: 3100, trips: 15 },
    { date: '2026-01-29', amount: 2890, trips: 13 },
    { date: '2026-01-30', amount: 3450, trips: 17 },
    { date: '2026-01-31', amount: 3200, trips: 14 },
    { date: '2026-02-01', amount: 2980, trips: 13 },
    { date: '2026-02-02', amount: 3350, trips: 16 },
  ];

  return (
    <div className="space-y-8">
      {/* Sub-navigation tabs */}
      <div className="border-b border-gray-100">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            if (tab.href) {
              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </Link>
              );
            }

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Dashboard Content */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <EarningsKPICard
              title="Today's Earnings"
              value="₱3,350"
              subtitle="From 16 trips"
              icon={DollarSign}
              variant="success"
              trend={{ value: 12.5, label: 'vs yesterday' }}
            />
            <EarningsKPICard
              title="This Week"
              value="₱21,620"
              subtitle="Total earnings"
              icon={Calendar}
              variant="info"
              trend={{ value: 8.3, label: 'vs last week' }}
            />
            <EarningsKPICard
              title="Pending Payout"
              value="₱18,450"
              subtitle="Ready for payout"
              icon={Wallet}
              variant="warning"
            />
            <EarningsKPICard
              title="Next Payout"
              value="Feb 7"
              subtitle="In 5 days"
              icon={Clock}
              variant="default"
            />
          </div>

          {/* Earnings Trend Chart */}
          <EarningsTrendChart
            data={mockEarningsTrend}
            title="Last 7 Days Earnings"
            chartType="area"
            showTrips={true}
          />

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card hover={true}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>View Detailed Breakdown</span>
                  <ArrowRight className="w-5 h-5 text-xpress-600" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-600 mb-4">
                  See detailed breakdown of your earnings including trip revenue, tips, bonuses,
                  and deductions.
                </p>
                <Link
                  href="/earnings/breakdown"
                  className="inline-flex items-center gap-2 text-sm font-medium text-xpress-600 hover:text-xpress-700"
                >
                  View Breakdown
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </CardContent>
            </Card>

            <Card hover={true}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Payout History</span>
                  <ArrowRight className="w-5 h-5 text-xpress-600" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-600 mb-4">
                  Track all your past payouts, download receipts, and manage payment methods.
                </p>
                <Link
                  href="/earnings/payouts"
                  className="inline-flex items-center gap-2 text-sm font-medium text-xpress-600 hover:text-xpress-700"
                >
                  View Payouts
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity Summary */}
          <Card>
            <CardHeader>
              <CardTitle>This Month Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm font-medium text-neutral-600 mb-1">Total Trips</p>
                  <p className="text-2xl font-bold text-neutral-900">87 trips</p>
                  <p className="text-xs text-neutral-500 mt-1">Average: 2.9 trips/day</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-600 mb-1">Gross Earnings</p>
                  <p className="text-2xl font-bold text-success-600">₱45,230</p>
                  <p className="text-xs text-neutral-500 mt-1">Before deductions</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-600 mb-1">Net Earnings</p>
                  <p className="text-2xl font-bold text-xpress-600">₱36,184</p>
                  <p className="text-xs text-neutral-500 mt-1">After deductions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default EarningsPage;
