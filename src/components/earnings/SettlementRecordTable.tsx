'use client';

import React from 'react';
import { Eye, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/xpress/card';
import SettlementStatusBadge from './SettlementStatusBadge';
import type { Settlement } from './types';

export interface SettlementRecordTableProps {
  settlements: Settlement[];
  onViewDetails?: (settlement: Settlement) => void;
  onDispute?: (settlement: Settlement) => void;
  isLoading?: boolean;
}

const SettlementRecordTable: React.FC<SettlementRecordTableProps> = ({
  settlements,
  onViewDetails,
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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Settlement Records</CardTitle>
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

  if (settlements.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Settlement Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-neutral-500">No settlement records found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Settlement Records</CardTitle>
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
                  Trips
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-neutral-700">
                  Revenue
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-neutral-700">
                  Deductions
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-neutral-700">
                  Net Amount
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">
                  Status
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-neutral-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {settlements.map((settlement) => (
                <tr
                  key={settlement.id}
                  className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
                >
                  <td className="py-3 px-4 text-sm text-neutral-900">
                    {formatDate(settlement.settlementDate)}
                  </td>
                  <td className="py-3 px-4 text-sm text-neutral-700">
                    {settlement.tripCount} trips
                  </td>
                  <td className="py-3 px-4 text-sm font-medium text-success-600 text-right">
                    {formatCurrency(settlement.totalRevenue)}
                  </td>
                  <td className="py-3 px-4 text-sm font-medium text-danger-600 text-right">
                    -{formatCurrency(settlement.totalDeductions)}
                  </td>
                  <td className="py-3 px-4 text-sm font-semibold text-neutral-900 text-right">
                    {formatCurrency(settlement.netAmount)}
                  </td>
                  <td className="py-3 px-4">
                    <SettlementStatusBadge status={settlement.status} size="sm" />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      {onViewDetails && (
                        <button
                          onClick={() => onViewDetails(settlement)}
                          className="p-1.5 text-neutral-600 hover:text-xpress-600 hover:bg-xpress-50 rounded transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      {onDispute && (
                        <button
                          onClick={() => onDispute(settlement)}
                          className="p-1.5 text-neutral-600 hover:text-danger-600 hover:bg-danger-50 rounded transition-colors"
                          title="Dispute settlement"
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

export default SettlementRecordTable;
