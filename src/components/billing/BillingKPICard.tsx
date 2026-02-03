'use client';

import React from 'react';
import { Card, CardContent } from '@/components/xpress/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/components/xpress/utils';

export interface BillingKPICardProps {
  label: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  comparisonPeriod?: string;
  icon?: React.ReactNode;
  iconColor?: string;
  isLoading?: boolean;
  className?: string;
}

export const BillingKPICard: React.FC<BillingKPICardProps> = ({
  label,
  value,
  trend,
  comparisonPeriod,
  icon,
  iconColor = 'text-xpress-600',
  isLoading = false,
  className,
}) => {
  if (isLoading) {
    return (
      <Card variant="outlined" padding="md" className={cn('animate-pulse', className)}>
        <CardContent>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="h-4 bg-neutral-200 rounded w-24 mb-2"></div>
              <div className="h-8 bg-neutral-200 rounded w-32 mb-2"></div>
              <div className="h-3 bg-neutral-200 rounded w-20"></div>
            </div>
            <div className="h-10 w-10 bg-neutral-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="outlined" padding="md" className={className}>
      <CardContent>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-neutral-600 mb-1">{label}</p>
            <p className="text-3xl font-bold text-neutral-900 mb-2">{value}</p>

            {trend && (
              <div className="flex items-center gap-1">
                {trend.isPositive ? (
                  <TrendingUp className="h-4 w-4 text-success-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-danger-600" />
                )}
                <span
                  className={cn(
                    'text-sm font-medium',
                    trend.isPositive ? 'text-success-600' : 'text-danger-600'
                  )}
                >
                  {Math.abs(trend.value)}%
                </span>
                {comparisonPeriod && (
                  <span className="text-xs text-neutral-500 ml-1">
                    vs {comparisonPeriod}
                  </span>
                )}
              </div>
            )}
          </div>

          {icon && (
            <div
              className={cn(
                'flex items-center justify-center',
                'h-10 w-10 rounded-lg bg-neutral-100',
                iconColor
              )}
            >
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

BillingKPICard.displayName = 'BillingKPICard';
