'use client';

import React from 'react';
import { Download, AlertCircle, Eye } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/xpress/card';
import PayoutStatusBadge from './PayoutStatusBadge';
import type { DriverPayout } from './types';

export interface PayoutHistoryTableProps {
  payouts: DriverPayout[];
  onViewDetails?: (payout: DriverPayout) => void;
  onDownloadReceipt?: (payoutId: string) => void;
  onDispute?: (payout: DriverPayout) => void;
  isLoading?: boolean;
}

const PayoutHistoryTable: React.FC<PayoutHistoryTableProps> = ({
  payouts,
  onViewDetails,
  onDownloadReceipt,
  onDispute,
  isLoading = false,
}) => {
  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getPayoutMethodLabel = (method: string) => {
    switch (method) {
      case 'gcash':
        return 'GCash';
      case 'bank_transfer':
        return 'Bank Transfer';
      case 'cash':
        return 'Cash';
      default:
        return method;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-neutral-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (payouts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-neutral-500">No payout history available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payout History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">
                  Date
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">
                  Amount
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">
                  Method
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">
                  Reference
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-neutral-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((payout) => (
                <tr
                  key={payout.id}
                  className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
                >
                  <td className="py-3 px-4 text-sm text-neutral-900">
                    {formatDate(payout.payoutDate)}
                  </td>
                  <td className="py-3 px-4 text-sm font-semibold text-neutral-900">
                    {formatCurrency(payout.amount)}
                  </td>
                  <td className="py-3 px-4 text-sm text-neutral-700">
                    {getPayoutMethodLabel(payout.payoutMethod)}
                  </td>
                  <td className="py-3 px-4">
                    <PayoutStatusBadge status={payout.status} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-sm text-neutral-600 font-mono">
                    {payout.payoutReference || '-'}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      {onViewDetails && (
                        <button
                          onClick={() => onViewDetails(payout)}
                          className="p-1.5 text-neutral-600 hover:text-xpress-600 hover:bg-xpress-50 rounded transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      {onDownloadReceipt && payout.status === 'completed' && (
                        <button
                          onClick={() => onDownloadReceipt(payout.id)}
                          className="p-1.5 text-neutral-600 hover:text-success-600 hover:bg-success-50 rounded transition-colors"
                          title="Download receipt"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                      {onDispute && payout.status === 'failed' && (
                        <button
                          onClick={() => onDispute(payout)}
                          className="p-1.5 text-neutral-600 hover:text-danger-600 hover:bg-danger-50 rounded transition-colors"
                          title="Dispute payout"
                        >
                          <AlertCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default PayoutHistoryTable;
