'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/xpress/badge';
import { Button } from '@/components/xpress/button';
import { ChevronLeft, ChevronRight, Eye, Download } from 'lucide-react';
import type { Transaction, PaymentStatus } from '@/types/payment';
import { format } from 'date-fns';

interface TransactionTableProps {
  transactions: Transaction[];
  onViewDetails?: (transactionId: string) => void;
  onExport?: () => void;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

const getStatusBadge = (status: PaymentStatus) => {
  switch (status) {
    case 'completed':
      return <Badge variant="success">Completed</Badge>;
    case 'pending':
      return <Badge variant="warning">Pending</Badge>;
    case 'processing':
      return <Badge variant="info">Processing</Badge>;
    case 'failed':
      return <Badge variant="danger">Failed</Badge>;
    case 'refunded':
      return <Badge variant="secondary">Refunded</Badge>;
    case 'cancelled':
      return <Badge variant="secondary">Cancelled</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const formatAmount = (value: number, currency: string = 'PHP') => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency,
  }).format(value);
};

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  onViewDetails,
  onExport,
  page = 1,
  totalPages = 1,
  onPageChange,
}) => {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(transactions.map((t) => t.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedRows(newSelected);
  };

  const isAllSelected = transactions.length > 0 && selectedRows.size === transactions.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-neutral-600">
          Showing {transactions.length} transactions
          {totalPages > 1 && ` (Page ${page} of ${totalPages})`}
        </div>
        {onExport && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onExport}
            leftIcon={<Download className="h-4 w-4" />}
          >
            Export CSV
          </Button>
        )}
      </div>

      <div className="border border-neutral-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-neutral-300 text-xpress-600 focus:ring-xpress-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                  Transaction ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                  Payment Method
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-neutral-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-neutral-600">
                    No transactions found
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="hover:bg-neutral-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(transaction.id)}
                        onChange={(e) => handleSelectRow(transaction.id, e.target.checked)}
                        className="rounded border-neutral-300 text-xpress-600 focus:ring-xpress-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-mono text-neutral-900">
                        {transaction.transactionId}
                      </div>
                      <div className="text-xs text-neutral-500 font-mono">
                        Ref: {transaction.referenceNumber}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-900">
                      {format(new Date(transaction.createdAt), 'MMM dd, yyyy')}
                      <br />
                      <span className="text-xs text-neutral-500">
                        {format(new Date(transaction.createdAt), 'hh:mm a')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-neutral-900">
                      {formatAmount(transaction.amount, transaction.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-neutral-900 capitalize">
                        {transaction.paymentMethod}
                      </span>
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(transaction.status)}</td>
                    <td className="px-4 py-3 text-sm text-neutral-600 max-w-xs truncate">
                      {transaction.description}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {onViewDetails && (
                        <Button
                          variant="tertiary"
                          size="sm"
                          onClick={() => onViewDetails(transaction.id)}
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            leftIcon={<ChevronLeft className="h-4 w-4" />}
          >
            Previous
          </Button>

          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = page <= 3 ? i + 1 : page - 2 + i;
              if (pageNum > totalPages) return null;

              return (
                <Button
                  key={pageNum}
                  variant={pageNum === page ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => onPageChange(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            rightIcon={<ChevronRight className="h-4 w-4" />}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};
