'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, User, TrendingUp, Wallet } from 'lucide-react';
import {
  EarningsKPICard,
  EarningsTrendChart,
  PayoutHistoryTable,
  type DriverEarningsProfile,
  type DriverPayout,
} from '@/components/earnings';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/xpress/card';
import { Badge } from '@/components/xpress/badge';

interface PageProps {
  params: Promise<{ id: string }>;
}

const DriverEarningsProfilePage = ({ params }: PageProps) => {
  const { id: driverId } = use(params);

  // Mock data - will be replaced with real API calls
  const mockProfile: DriverEarningsProfile = {
    driverId: driverId,
    driverName: 'Juan Dela Cruz',
    lifetimeEarnings: 245680,
    averageDailyEarnings: 2850,
    averageWeeklyEarnings: 19950,
    totalPayouts: 189420,
    totalDeductions: 56260,
    currentBalance: 18450,
    lastPayoutDate: '2026-02-01',
    nextPayoutDate: '2026-02-08',
    earningsTrend: [
      { date: '2026-01-27', amount: 2650, trips: 12 },
      { date: '2026-01-28', amount: 3100, trips: 15 },
      { date: '2026-01-29', amount: 2890, trips: 13 },
      { date: '2026-01-30', amount: 3450, trips: 17 },
      { date: '2026-01-31', amount: 3200, trips: 14 },
      { date: '2026-02-01', amount: 2980, trips: 13 },
      { date: '2026-02-02', amount: 3350, trips: 16 },
    ],
    performanceMetrics: {
      totalTrips: 487,
      completionRate: 96.5,
      averageRating: 4.8,
      acceptanceRate: 89.2,
    },
  };

  const mockPayouts: DriverPayout[] = [
    {
      id: 'PO-001',
      driverId: driverId,
      driverName: mockProfile.driverName,
      amount: 18450,
      status: 'completed',
      payoutMethod: 'gcash',
      payoutDate: '2026-02-01',
      payoutReference: 'GC20260201-001',
      processedDate: '2026-02-01',
      createdAt: '2026-01-31',
      updatedAt: '2026-02-01',
    },
    {
      id: 'PO-002',
      driverId: driverId,
      driverName: mockProfile.driverName,
      amount: 21300,
      status: 'completed',
      payoutMethod: 'bank_transfer',
      payoutDate: '2026-01-25',
      payoutReference: 'BT20260125-002',
      processedDate: '2026-01-25',
      createdAt: '2026-01-24',
      updatedAt: '2026-01-25',
    },
  ];

  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/earnings"
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">
              {mockProfile.driverName}
            </h1>
            <p className="text-sm text-neutral-600">Driver ID: {driverId}</p>
          </div>
        </div>
        <Badge variant="success" size="lg">
          <User className="w-4 h-4" />
          <span>Active Driver</span>
        </Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <EarningsKPICard
          title="Lifetime Earnings"
          value={formatCurrency(mockProfile.lifetimeEarnings)}
          subtitle="Total earnings to date"
          icon={TrendingUp}
          variant="success"
        />
        <EarningsKPICard
          title="Average Daily"
          value={formatCurrency(mockProfile.averageDailyEarnings)}
          subtitle="Per day average"
          icon={Wallet}
          variant="info"
        />
        <EarningsKPICard
          title="Current Balance"
          value={formatCurrency(mockProfile.currentBalance)}
          subtitle="Pending payout"
          icon={Wallet}
          variant="warning"
        />
        <EarningsKPICard
          title="Total Payouts"
          value={formatCurrency(mockProfile.totalPayouts)}
          subtitle="All time payouts"
          icon={Wallet}
          variant="default"
        />
      </div>

      {/* Earnings Trend */}
      <EarningsTrendChart
        data={mockProfile.earningsTrend}
        title="Last 7 Days Earnings"
        chartType="area"
        showTrips={true}
      />

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm font-medium text-neutral-600 mb-1">Total Trips</p>
              <p className="text-2xl font-bold text-neutral-900">
                {mockProfile.performanceMetrics.totalTrips}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-600 mb-1">Completion Rate</p>
              <p className="text-2xl font-bold text-success-600">
                {mockProfile.performanceMetrics.completionRate}%
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-600 mb-1">Average Rating</p>
              <p className="text-2xl font-bold text-warning-600">
                {mockProfile.performanceMetrics.averageRating}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-600 mb-1">Acceptance Rate</p>
              <p className="text-2xl font-bold text-info-600">
                {mockProfile.performanceMetrics.acceptanceRate}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Earnings vs Deductions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Earnings Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-600">Total Earnings</span>
                <span className="text-lg font-bold text-success-600">
                  {formatCurrency(mockProfile.lifetimeEarnings)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-600">Total Deductions</span>
                <span className="text-lg font-bold text-danger-600">
                  -{formatCurrency(mockProfile.totalDeductions)}
                </span>
              </div>
              <div className="border-t pt-4 flex justify-between items-center">
                <span className="text-base font-semibold text-neutral-900">
                  Net Earnings
                </span>
                <span className="text-xl font-bold text-xpress-600">
                  {formatCurrency(
                    mockProfile.lifetimeEarnings - mockProfile.totalDeductions
                  )}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payout Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-neutral-600 mb-1">Last Payout</p>
                <p className="text-lg font-semibold text-neutral-900">
                  {mockProfile.lastPayoutDate
                    ? new Date(mockProfile.lastPayoutDate).toLocaleDateString('en-PH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'No payouts yet'}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-600 mb-1">Next Payout</p>
                <p className="text-lg font-semibold text-neutral-900">
                  {mockProfile.nextPayoutDate
                    ? new Date(mockProfile.nextPayoutDate).toLocaleDateString('en-PH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'Not scheduled'}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-600 mb-1">Current Balance</p>
                <p className="text-xl font-bold text-xpress-600">
                  {formatCurrency(mockProfile.currentBalance)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Payouts */}
      <PayoutHistoryTable payouts={mockPayouts} />
    </div>
  );
};

export default DriverEarningsProfilePage;
