'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/xpress/card';
import { Button } from '@/components/xpress/button';
import { Badge } from '@/components/xpress/badge';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  AlertCircle,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';

const mockStats = {
  totalProcessed: 1250000,
  totalAmount: 52500000,
  successRate: 98.5,
  avgTransactionValue: 42000,
  failedCount: 15,
  refundedCount: 8,
  pendingCount: 23,
};

const mockRecentTransactions = [
  {
    id: '1',
    transactionId: 'TXN-2024-001',
    amount: 1500,
    status: 'completed' as const,
    paymentMethod: 'gcash',
    description: 'Ride fare payment',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    transactionId: 'TXN-2024-002',
    amount: 2300,
    status: 'pending' as const,
    paymentMethod: 'paymaya',
    description: 'Booking payment',
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    transactionId: 'TXN-2024-003',
    amount: 890,
    status: 'failed' as const,
    paymentMethod: 'card',
    description: 'Payment failed - insufficient funds',
    createdAt: new Date().toISOString(),
  },
];

const mockMethodDistribution = [
  { method: 'GCash', count: 520, percentage: 41.6 },
  { method: 'PayMaya', count: 380, percentage: 30.4 },
  { method: 'Card', count: 290, percentage: 23.2 },
  { method: 'Cash', count: 60, percentage: 4.8 },
];

const PaymentsDashboard = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const formatAmount = (value: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'failed':
        return <Badge variant="danger">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Payments Dashboard</h1>
          <p className="text-sm text-neutral-600 mt-1">
            Manage payments, transactions, and refunds
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={handleRefresh}
          leftIcon={<RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />}
        >
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="elevated">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-xpress-50 rounded-lg">
                <DollarSign className="h-6 w-6 text-xpress-600" />
              </div>
              <TrendingUp className="h-5 w-5 text-success-600" />
            </div>
            <div className="text-sm text-neutral-600 mb-1">Total Processed</div>
            <div className="text-2xl font-semibold text-neutral-900">
              {formatAmount(mockStats.totalAmount)}
            </div>
            <div className="text-xs text-neutral-500 mt-1">
              {mockStats.totalProcessed.toLocaleString()} transactions
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-success-50 rounded-lg">
                <TrendingUp className="h-6 w-6 text-success-600" />
              </div>
            </div>
            <div className="text-sm text-neutral-600 mb-1">Success Rate</div>
            <div className="text-2xl font-semibold text-success-900">
              {mockStats.successRate}%
            </div>
            <div className="text-xs text-neutral-500 mt-1">Last 30 days</div>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-info-50 rounded-lg">
                <CreditCard className="h-6 w-6 text-info-600" />
              </div>
            </div>
            <div className="text-sm text-neutral-600 mb-1">Avg Transaction</div>
            <div className="text-2xl font-semibold text-neutral-900">
              {formatAmount(mockStats.avgTransactionValue)}
            </div>
            <div className="text-xs text-neutral-500 mt-1">Per transaction</div>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-danger-50 rounded-lg">
                <AlertCircle className="h-6 w-6 text-danger-600" />
              </div>
            </div>
            <div className="text-sm text-neutral-600 mb-1">Failed Payments</div>
            <div className="text-2xl font-semibold text-danger-900">
              {mockStats.failedCount}
            </div>
            <div className="text-xs text-neutral-500 mt-1">Requires attention</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card variant="outlined">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Transactions</CardTitle>
                <Link href="/payments/transactions">
                  <Button variant="tertiary" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockRecentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between pb-4 border-b border-neutral-200 last:border-0 last:pb-0"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-mono text-neutral-900">
                          {transaction.transactionId}
                        </span>
                        {getStatusBadge(transaction.status)}
                      </div>
                      <p className="text-xs text-neutral-600">{transaction.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-neutral-900">
                        {formatAmount(transaction.amount)}
                      </div>
                      <p className="text-xs text-neutral-500 capitalize">
                        {transaction.paymentMethod}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card variant="outlined">
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockMethodDistribution.map((method, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-neutral-700">{method.method}</span>
                      <span className="text-sm font-semibold text-neutral-900">
                        {method.percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-neutral-200 rounded-full h-2">
                      <div
                        className="bg-xpress-600 h-2 rounded-full"
                        style={{ width: `${method.percentage}%` }}
                      />
                    </div>
                    <div className="text-xs text-neutral-500 mt-1">
                      {method.count} transactions
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/payments/methods" className="block">
          <Card hover variant="outlined" className="h-full">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 bg-xpress-50 rounded-lg">
                <CreditCard className="h-6 w-6 text-xpress-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-neutral-900 mb-1">Payment Methods</h3>
                <p className="text-sm text-neutral-600">Manage payment methods</p>
              </div>
              <ArrowRight className="h-5 w-5 text-neutral-400" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/payments/refunds" className="block">
          <Card hover variant="outlined" className="h-full">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 bg-warning-50 rounded-lg">
                <RefreshCw className="h-6 w-6 text-warning-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-neutral-900 mb-1">Refunds</h3>
                <p className="text-sm text-neutral-600">Process refund requests</p>
              </div>
              <ArrowRight className="h-5 w-5 text-neutral-400" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/payments/reconciliation" className="block">
          <Card hover variant="outlined" className="h-full">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 bg-info-50 rounded-lg">
                <AlertCircle className="h-6 w-6 text-info-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-neutral-900 mb-1">Reconciliation</h3>
                <p className="text-sm text-neutral-600">Review and reconcile</p>
              </div>
              <ArrowRight className="h-5 w-5 text-neutral-400" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
};

export default PaymentsDashboard;
