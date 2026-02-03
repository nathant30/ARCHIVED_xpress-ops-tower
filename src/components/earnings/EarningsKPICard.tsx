'use client';

import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/xpress/card';
import { cn } from '@/components/xpress/utils';

export interface EarningsKPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  isLoading?: boolean;
}

const EarningsKPICard: React.FC<EarningsKPICardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  isLoading = false,
}) => {
  const variantColors = {
    default: 'text-neutral-600',
    success: 'text-success-600',
    warning: 'text-warning-600',
    danger: 'text-danger-600',
    info: 'text-info-600',
  };

  const bgColors = {
    default: 'bg-neutral-50',
    success: 'bg-success-50',
    warning: 'bg-warning-50',
    danger: 'bg-danger-50',
    info: 'bg-info-50',
  };

  if (isLoading) {
    return (
      <Card padding="md">
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
            <div className="h-8 bg-neutral-200 rounded w-3/4"></div>
            <div className="h-3 bg-neutral-200 rounded w-1/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card padding="md" variant="default" hover={false}>
      <CardContent>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-neutral-600">{title}</p>
            <div className="mt-2 flex items-baseline">
              <p className={cn('text-3xl font-bold', variantColors[variant])}>
                {value}
              </p>
            </div>
            {subtitle && (
              <p className="mt-1 text-xs text-neutral-500">{subtitle}</p>
            )}
            {trend && (
              <div className="mt-2 flex items-center gap-1">
                {trend.value >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-success-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-danger-600" />
                )}
                <span
                  className={cn(
                    'text-sm font-medium',
                    trend.value >= 0 ? 'text-success-600' : 'text-danger-600'
                  )}
                >
                  {Math.abs(trend.value)}%
                </span>
                <span className="text-sm text-neutral-500">{trend.label}</span>
              </div>
            )}
          </div>
          {Icon && (
            <div className={cn('p-3 rounded-lg', bgColors[variant])}>
              <Icon className={cn('w-6 h-6', variantColors[variant])} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EarningsKPICard;
