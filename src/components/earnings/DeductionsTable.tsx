'use client';

import React from 'react';
import { AlertCircle, FileText } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/xpress/card';
import { Badge } from '@/components/xpress/badge';
import type { Deduction } from './types';

export interface DeductionsTableProps {
  deductions: Deduction[];
  onViewDetails?: (deduction: Deduction) => void;
  onDispute?: (deduction: Deduction) => void;
  isLoading?: boolean;
}

const DeductionsTable: React.FC<DeductionsTableProps> = ({
  deductions,
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

  const getDeductionTypeLabel = (type: string) => {
    switch (type) {
      case 'commission':
        return 'Platform Commission';
      case 'bond':
        return 'Bond Deduction';
      case 'promo':
        return 'Promo Redemption';
      case 'adjustment':
        return 'Adjustment';
      default:
        return type;
    }
  };

  const getDeductionTypeVariant = (type: string) => {
    switch (type) {
      case 'commission':
        return 'info';
      case 'bond':
        return 'danger';
      case 'promo':
        return 'warning';
      case 'adjustment':
        return 'default';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Deductions</CardTitle>
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

  if (deductions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Deductions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-neutral-500">No deductions found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deductions</CardTitle>
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
                  Type
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">
                  Reason
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-neutral-700">
                  Amount
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-neutral-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {deductions.map((deduction) => (
                <tr
                  key={deduction.id}
                  className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
                >
                  <td className="py-3 px-4 text-sm text-neutral-900">
                    {formatDate(deduction.deductionDate)}
                  </td>
                  <td className="py-3 px-4">
                    <Badge
                      variant={getDeductionTypeVariant(deduction.type)}
                      size="sm"
                    >
                      {getDeductionTypeLabel(deduction.type)}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-sm text-neutral-700">
                    {deduction.reason}
                  </td>
                  <td className="py-3 px-4 text-sm font-semibold text-danger-600 text-right">
                    -{formatCurrency(deduction.amount)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      {onViewDetails && (
                        <button
                          onClick={() => onViewDetails(deduction)}
                          className="p-1.5 text-neutral-600 hover:text-xpress-600 hover:bg-xpress-50 rounded transition-colors"
                          title="View details"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      )}
                      {onDispute && deduction.canDispute && (
                        <button
                          onClick={() => onDispute(deduction)}
                          className="p-1.5 text-neutral-600 hover:text-danger-600 hover:bg-danger-50 rounded transition-colors"
                          title="Dispute deduction"
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

export default DeductionsTable;
