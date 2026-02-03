'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, Calendar as CalendarIcon } from 'lucide-react';
import {
  EarningsBreakdownCard,
  type EarningsBreakdown,
} from '@/components/earnings';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/xpress/card';
import { Badge } from '@/components/xpress/badge';

const EarningsBreakdownPage = () => {
  const [dateRange, setDateRange] = useState('this_week');

  // Mock data - will be replaced with real API calls
  const mockBreakdown: EarningsBreakdown = {
    tripRevenue: {
      baseFare: 1500,
      distance: 800,
      time: 200,
      total: 2500,
    },
    tips: 300,
    bonuses: 500,
    surgeEarnings: 200,
    referralBonuses: 0,
    grossEarnings: 3500,
    deductions: {
      platformFee: 700,
      bondDeductions: 100,
      promoRedemptions: 50,
      otherAdjustments: 0,
      total: 850,
    },
    netEarnings: 2650,
    period: {
      start: '2026-01-27',
      end: '2026-02-02',
    },
  };

  const handleExport = () => {
    // TODO: Implement CSV export
    console.log('Exporting earnings breakdown...');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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
            <h1 className="text-2xl font-bold text-neutral-900">Earnings Breakdown</h1>
            <p className="text-sm text-neutral-600">
              Detailed view of your earnings and deductions
            </p>
          </div>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-xpress-600 text-white rounded-lg hover:bg-xpress-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <CalendarIcon className="w-5 h-5 text-neutral-500" />
            <div className="flex gap-2">
              {[
                { id: 'today', label: 'Today' },
                { id: 'this_week', label: 'This Week' },
                { id: 'this_month', label: 'This Month' },
                { id: 'last_month', label: 'Last Month' },
                { id: 'custom', label: 'Custom Range' },
              ].map((range) => (
                <button
                  key={range.id}
                  onClick={() => setDateRange(range.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    dateRange === range.id
                      ? 'bg-xpress-600 text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Period Info */}
      <div className="flex items-center gap-2">
        <Badge variant="info" size="md">
          {formatDate(mockBreakdown.period.start)} - {formatDate(mockBreakdown.period.end)}
        </Badge>
      </div>

      {/* Breakdown Card */}
      <EarningsBreakdownCard breakdown={mockBreakdown} />

      {/* Category Breakdown Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Earnings by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-neutral-700">Trip Revenue</span>
                <span className="text-sm font-semibold text-neutral-900">
                  {((mockBreakdown.tripRevenue.total / mockBreakdown.grossEarnings) * 100).toFixed(
                    1
                  )}
                  %
                </span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-3">
                <div
                  className="bg-success-500 h-3 rounded-full"
                  style={{
                    width: `${(mockBreakdown.tripRevenue.total / mockBreakdown.grossEarnings) * 100}%`,
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-neutral-700">Tips</span>
                <span className="text-sm font-semibold text-neutral-900">
                  {((mockBreakdown.tips / mockBreakdown.grossEarnings) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-3">
                <div
                  className="bg-info-500 h-3 rounded-full"
                  style={{
                    width: `${(mockBreakdown.tips / mockBreakdown.grossEarnings) * 100}%`,
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-neutral-700">Bonuses</span>
                <span className="text-sm font-semibold text-neutral-900">
                  {((mockBreakdown.bonuses / mockBreakdown.grossEarnings) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-3">
                <div
                  className="bg-warning-500 h-3 rounded-full"
                  style={{
                    width: `${(mockBreakdown.bonuses / mockBreakdown.grossEarnings) * 100}%`,
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-neutral-700">Surge Pricing</span>
                <span className="text-sm font-semibold text-neutral-900">
                  {((mockBreakdown.surgeEarnings / mockBreakdown.grossEarnings) * 100).toFixed(1)}
                  %
                </span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-3">
                <div
                  className="bg-xpress-500 h-3 rounded-full"
                  style={{
                    width: `${(mockBreakdown.surgeEarnings / mockBreakdown.grossEarnings) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EarningsBreakdownPage;
