'use client';

import React from 'react';
import { DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/xpress/card';
import type { EarningsBreakdown } from './types';

export interface EarningsBreakdownCardProps {
  breakdown: EarningsBreakdown;
  isLoading?: boolean;
}

const EarningsBreakdownCard: React.FC<EarningsBreakdownCardProps> = ({
  breakdown,
  isLoading = false,
}) => {
  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Earnings Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 bg-neutral-200 rounded w-1/3"></div>
                <div className="h-4 bg-neutral-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Earnings Breakdown</CardTitle>
        <p className="text-sm text-neutral-600">
          {new Date(breakdown.period.start).toLocaleDateString('en-PH')} -{' '}
          {new Date(breakdown.period.end).toLocaleDateString('en-PH')}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Trip Revenue */}
          <div className="border-b border-neutral-200 pb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-success-600" />
                <span className="font-medium text-neutral-900">Trip Revenue</span>
              </div>
              <span className="font-semibold text-success-600">
                {formatCurrency(breakdown.tripRevenue.total)}
              </span>
            </div>
            <div className="ml-6 space-y-1 text-sm">
              <div className="flex justify-between text-neutral-600">
                <span>Base Fare</span>
                <span>{formatCurrency(breakdown.tripRevenue.baseFare)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Distance</span>
                <span>{formatCurrency(breakdown.tripRevenue.distance)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Time</span>
                <span>{formatCurrency(breakdown.tripRevenue.time)}</span>
              </div>
            </div>
          </div>

          {/* Additional Earnings */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">Tips</span>
              <span className="font-medium text-neutral-900">
                {formatCurrency(breakdown.tips)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">Bonuses & Incentives</span>
              <span className="font-medium text-neutral-900">
                {formatCurrency(breakdown.bonuses)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">Surge Pricing</span>
              <span className="font-medium text-neutral-900">
                {formatCurrency(breakdown.surgeEarnings)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">Referral Bonuses</span>
              <span className="font-medium text-neutral-900">
                {formatCurrency(breakdown.referralBonuses)}
              </span>
            </div>
          </div>

          {/* Gross Earnings */}
          <div className="border-t border-neutral-200 pt-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-info-600" />
                <span className="font-semibold text-neutral-900">Gross Earnings</span>
              </div>
              <span className="font-bold text-info-600">
                {formatCurrency(breakdown.grossEarnings)}
              </span>
            </div>
          </div>

          {/* Deductions */}
          <div className="border-t border-neutral-200 pt-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-danger-600" />
                <span className="font-medium text-neutral-900">Deductions</span>
              </div>
              <span className="font-semibold text-danger-600">
                -{formatCurrency(breakdown.deductions.total)}
              </span>
            </div>
            <div className="ml-6 space-y-1 text-sm">
              <div className="flex justify-between text-neutral-600">
                <span>Platform Fee</span>
                <span>-{formatCurrency(breakdown.deductions.platformFee)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Bond Deductions</span>
                <span>-{formatCurrency(breakdown.deductions.bondDeductions)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Promo Redemptions</span>
                <span>-{formatCurrency(breakdown.deductions.promoRedemptions)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Other Adjustments</span>
                <span>-{formatCurrency(breakdown.deductions.otherAdjustments)}</span>
              </div>
            </div>
          </div>

          {/* Net Earnings */}
          <div className="border-t-2 border-neutral-300 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-neutral-900">Net Earnings</span>
              <span className="text-2xl font-bold text-xpress-600">
                {formatCurrency(breakdown.netEarnings)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EarningsBreakdownCard;
