'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/xpress/card';
import { Badge } from '@/components/xpress/badge';
import { Button } from '@/components/xpress/button';
import { ReconciliationSummaryCard } from '@/components/payments/ReconciliationSummaryCard';
import { CheckCircle, Download, AlertTriangle } from 'lucide-react';
import type { ReconciliationItem } from '@/types/payment';
import { format } from 'date-fns';

const mockSummary = {
  date: format(new Date(), 'MMMM dd, yyyy'),
  totalTransactions: 1250,
  reconciledCount: 1200,
  pendingCount: 35,
  discrepancyCount: 15,
  expectedTotal: 52500000,
  actualTotal: 52498500,
  difference: -1500,
};

const mockReconciliationItems: ReconciliationItem[] = [
  {
    id: '1',
    date: new Date().toISOString(),
    transactionId: 'TXN-2024-001',
    expectedAmount: 1500,
    actualAmount: 1500,
    difference: 0,
    status: 'reconciled',
    paymentMethod: 'gcash',
    reconciledBy: 'admin123',
    reconciledAt: new Date().toISOString(),
  },
  {
    id: '2',
    date: new Date().toISOString(),
    transactionId: 'TXN-2024-002',
    expectedAmount: 2300,
    actualAmount: 2250,
    difference: -50,
    status: 'discrepancy',
    paymentMethod: 'paymaya',
    notes: 'Service fee discrepancy',
  },
  {
    id: '3',
    date: new Date().toISOString(),
    transactionId: 'TXN-2024-003',
    expectedAmount: 890,
    actualAmount: 890,
    difference: 0,
    status: 'pending',
    paymentMethod: 'card',
  },
  {
    id: '4',
    date: new Date().toISOString(),
    transactionId: 'TXN-2024-004',
    expectedAmount: 1200,
    actualAmount: 1225,
    difference: 25,
    status: 'discrepancy',
    paymentMethod: 'gcash',
    notes: 'Overpayment detected',
  },
];

const ReconciliationPage = () => {
  const [items, setItems] = useState<ReconciliationItem[]>(mockReconciliationItems);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'discrepancy' | 'reconciled'>('all');

  const handleReconcile = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: 'reconciled' as const,
              reconciledBy: 'admin123',
              reconciledAt: new Date().toISOString(),
            }
          : item
      )
    );
  };

  const handleExportReport = () => {
    console.log('Exporting reconciliation report');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'reconciled':
        return <Badge variant="success">Reconciled</Badge>;
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'discrepancy':
        return <Badge variant="danger">Discrepancy</Badge>;
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

  const filteredItems =
    selectedStatus === 'all'
      ? items
      : items.filter((item) => item.status === selectedStatus);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Payment Reconciliation</h1>
          <p className="text-sm text-neutral-600 mt-1">
            Review and reconcile payment transactions
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={handleExportReport}
          leftIcon={<Download className="h-4 w-4" />}
        >
          Export Report
        </Button>
      </div>

      <ReconciliationSummaryCard summary={mockSummary} />

      <Card variant="outlined">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Reconciliation Items</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={selectedStatus === 'all' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setSelectedStatus('all')}
              >
                All
              </Button>
              <Button
                variant={selectedStatus === 'pending' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setSelectedStatus('pending')}
              >
                Pending
              </Button>
              <Button
                variant={selectedStatus === 'discrepancy' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setSelectedStatus('discrepancy')}
              >
                Discrepancies
              </Button>
              <Button
                variant={selectedStatus === 'reconciled' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setSelectedStatus('reconciled')}
              >
                Reconciled
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                    Transaction ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                    Payment Method
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-neutral-700 uppercase tracking-wider">
                    Expected
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-neutral-700 uppercase tracking-wider">
                    Actual
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-neutral-700 uppercase tracking-wider">
                    Difference
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-neutral-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-neutral-600">
                      No reconciliation items found
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-sm font-mono text-neutral-900">
                          {item.transactionId}
                        </span>
                        {item.notes && (
                          <p className="text-xs text-neutral-600 mt-1">{item.notes}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-neutral-900 capitalize">
                          {item.paymentMethod}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-neutral-900">
                        {formatAmount(item.expectedAmount)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-neutral-900">
                        {formatAmount(item.actualAmount)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`text-sm font-semibold ${
                            item.difference === 0
                              ? 'text-neutral-900'
                              : item.difference > 0
                              ? 'text-success-600'
                              : 'text-danger-600'
                          }`}
                        >
                          {item.difference === 0
                            ? '—'
                            : formatAmount(Math.abs(item.difference))}
                        </span>
                        {item.difference !== 0 && (
                          <span className="ml-1 text-xs">
                            {item.difference > 0 ? '▲' : '▼'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(item.status)}</td>
                      <td className="px-4 py-3 text-right">
                        {item.status === 'pending' || item.status === 'discrepancy' ? (
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleReconcile(item.id)}
                            leftIcon={<CheckCircle className="h-4 w-4" />}
                          >
                            Reconcile
                          </Button>
                        ) : (
                          <span className="text-xs text-neutral-500">
                            {item.reconciledBy && `By: ${item.reconciledBy}`}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filteredItems.some((item) => item.status === 'discrepancy') && (
            <div className="mt-6 bg-warning-50 border border-warning-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-warning-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-warning-900 mb-1">
                    Discrepancies Detected
                  </h4>
                  <p className="text-sm text-warning-700">
                    Please review all transactions with discrepancies before reconciling.
                    Contact support if you need assistance.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReconciliationPage;
