'use client';

import React from 'react';
import { cn } from '@/components/xpress/utils';
import { AlertTriangle } from 'lucide-react';

export interface CreditLimitIndicatorProps {
  creditLimit: number;
  outstandingBalance: number;
  className?: string;
  showWarning?: boolean;
  warningThreshold?: number; // Percentage threshold for warning (default 80%)
}

export const CreditLimitIndicator: React.FC<CreditLimitIndicatorProps> = ({
  creditLimit,
  outstandingBalance,
  className,
  showWarning = true,
  warningThreshold = 80,
}) => {
  const availableCredit = creditLimit - outstandingBalance;
  const usedPercentage = (outstandingBalance / creditLimit) * 100;
  const isNearLimit = usedPercentage >= warningThreshold;
  const isOverLimit = outstandingBalance > creditLimit;

  const getProgressColor = () => {
    if (isOverLimit) return 'bg-danger-600';
    if (isNearLimit) return 'bg-warning-500';
    return 'bg-success-500';
  };

  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="font-medium text-neutral-700">Credit Usage</span>
          {showWarning && (isNearLimit || isOverLimit) && (
            <AlertTriangle
              className={cn(
                'h-4 w-4',
                isOverLimit ? 'text-danger-600' : 'text-warning-600'
              )}
            />
          )}
        </div>
        <span className="text-neutral-600">
          {formatCurrency(outstandingBalance)} / {formatCurrency(creditLimit)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 bg-neutral-200 rounded-full overflow-hidden">
        <div
          className={cn(
            'absolute left-0 top-0 h-full transition-all duration-300',
            getProgressColor()
          )}
          style={{ width: `${Math.min(usedPercentage, 100)}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs">
        <span
          className={cn(
            'font-medium',
            isOverLimit ? 'text-danger-600' : isNearLimit ? 'text-warning-600' : 'text-success-600'
          )}
        >
          {usedPercentage.toFixed(1)}% used
        </span>
        <span className="text-neutral-600">
          {formatCurrency(availableCredit)} available
        </span>
      </div>

      {isOverLimit && (
        <div className="mt-2 p-2 bg-danger-50 border border-danger-200 rounded-lg">
          <p className="text-xs text-danger-800 font-medium">
            Account has exceeded credit limit by {formatCurrency(outstandingBalance - creditLimit)}
          </p>
        </div>
      )}
    </div>
  );
};

CreditLimitIndicator.displayName = 'CreditLimitIndicator';
