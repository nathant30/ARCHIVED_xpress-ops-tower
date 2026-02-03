'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/xpress/card';
import { Badge } from '@/components/xpress/badge';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';

interface ReconciliationSummary {
  date: string;
  totalTransactions: number;
  reconciledCount: number;
  pendingCount: number;
  discrepancyCount: number;
  expectedTotal: number;
  actualTotal: number;
  difference: number;
}

interface ReconciliationSummaryCardProps {
  summary: ReconciliationSummary;
}

const formatAmount = (value: number, currency: string = 'PHP') => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency,
  }).format(value);
};

const formatPercentage = (value: number) => {
  return `${value.toFixed(1)}%`;
};

export const ReconciliationSummaryCard: React.FC<ReconciliationSummaryCardProps> = ({
  summary,
}) => {
  const reconciliationRate =
    summary.totalTransactions > 0
      ? (summary.reconciledCount / summary.totalTransactions) * 100
      : 0;

  const hasDifference = Math.abs(summary.difference) > 0.01;

  return (
    <Card variant="elevated">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Reconciliation Summary</CardTitle>
            <p className="text-sm text-neutral-600 mt-1">{summary.date}</p>
          </div>
          {hasDifference ? (
            <Badge variant="warning" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              Discrepancies Found
            </Badge>
          ) : (
            <Badge variant="success" className="gap-1">
              <CheckCircle className="h-3 w-3" />
              Reconciled
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-neutral-50 rounded-lg p-4">
              <div className="text-xs text-neutral-600 uppercase mb-1">Total</div>
              <div className="text-2xl font-semibold text-neutral-900">
                {summary.totalTransactions}
              </div>
              <div className="text-xs text-neutral-500 mt-1">Transactions</div>
            </div>

            <div className="bg-success-50 rounded-lg p-4">
              <div className="text-xs text-success-700 uppercase mb-1">Reconciled</div>
              <div className="text-2xl font-semibold text-success-900">
                {summary.reconciledCount}
              </div>
              <div className="text-xs text-success-600 mt-1">
                {formatPercentage(reconciliationRate)}
              </div>
            </div>

            <div className="bg-warning-50 rounded-lg p-4">
              <div className="text-xs text-warning-700 uppercase mb-1">Pending</div>
              <div className="text-2xl font-semibold text-warning-900">
                {summary.pendingCount}
              </div>
              <div className="text-xs text-warning-600 mt-1">To Review</div>
            </div>

            <div className="bg-danger-50 rounded-lg p-4">
              <div className="text-xs text-danger-700 uppercase mb-1">Discrepancies</div>
              <div className="text-2xl font-semibold text-danger-900">
                {summary.discrepancyCount}
              </div>
              <div className="text-xs text-danger-600 mt-1">Requires Action</div>
            </div>
          </div>

          <div className="border-t border-neutral-200 pt-4">
            <h4 className="text-sm font-medium text-neutral-700 mb-3">
              Financial Summary
            </h4>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Expected Total</span>
                <span className="text-sm font-semibold text-neutral-900">
                  {formatAmount(summary.expectedTotal)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Actual Total</span>
                <span className="text-sm font-semibold text-neutral-900">
                  {formatAmount(summary.actualTotal)}
                </span>
              </div>

              <div className="border-t border-neutral-200 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-neutral-700">Difference</span>
                  <div className="flex items-center gap-2">
                    {summary.difference > 0 ? (
                      <TrendingUp className="h-4 w-4 text-success-600" />
                    ) : summary.difference < 0 ? (
                      <TrendingDown className="h-4 w-4 text-danger-600" />
                    ) : null}
                    <span
                      className={`text-sm font-semibold ${
                        Math.abs(summary.difference) > 0.01
                          ? summary.difference > 0
                            ? 'text-success-600'
                            : 'text-danger-600'
                          : 'text-neutral-900'
                      }`}
                    >
                      {formatAmount(Math.abs(summary.difference))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {hasDifference && (
            <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-warning-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-warning-900 mb-1">
                    Action Required
                  </h4>
                  <p className="text-sm text-warning-700">
                    {summary.difference > 0
                      ? 'System shows more funds than expected. Please investigate the overage.'
                      : 'System shows less funds than expected. Please investigate the shortage.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {!hasDifference && summary.pendingCount === 0 && (
            <div className="bg-success-50 border border-success-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-success-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-success-900 mb-1">
                    All Clear
                  </h4>
                  <p className="text-sm text-success-700">
                    All transactions have been reconciled successfully. No discrepancies found.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
