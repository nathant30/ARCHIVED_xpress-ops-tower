'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DollarSign,
  FileText,
  AlertTriangle,
  TrendingUp,
  Plus,
  Search,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

interface Transaction {
  id: string;
  date: string;
  description: string;
  reference: string;
  type: 'debit' | 'credit';
  amount: number;
  category: string;
}

interface PendingApproval {
  id: string;
  type: 'invoice' | 'payment' | 'expense';
  description: string;
  amount: number;
  submittedBy: string;
  submittedAt: string;
}

export default function FinanceDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [quickStats, setQuickStats] = useState({
    cashBalance: 2847500,
    accountsReceivable: 485300,
    accountsPayable: 298400,
    netIncome: 547200,
  });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock recent transactions
      setRecentTransactions([
        {
          id: 'TXN-001',
          date: new Date().toISOString(),
          description: 'Ride Revenue - Metro Manila',
          reference: 'REV-2024-001',
          type: 'credit',
          amount: 45600,
          category: 'Revenue',
        },
        {
          id: 'TXN-002',
          date: new Date().toISOString(),
          description: 'Driver Payout - Batch #42',
          reference: 'PAY-2024-042',
          type: 'debit',
          amount: 28400,
          category: 'Driver Payouts',
        },
        {
          id: 'TXN-003',
          date: new Date().toISOString(),
          description: 'Fuel Subsidy Payment',
          reference: 'EXP-2024-089',
          type: 'debit',
          amount: 12500,
          category: 'Operating Expenses',
        },
        {
          id: 'TXN-004',
          date: new Date().toISOString(),
          description: 'Corporate Client Payment - ABC Corp',
          reference: 'INV-2024-123',
          type: 'credit',
          amount: 125000,
          category: 'Accounts Receivable',
        },
        {
          id: 'TXN-005',
          date: new Date().toISOString(),
          description: 'Office Rent Payment',
          reference: 'EXP-2024-090',
          type: 'debit',
          amount: 45000,
          category: 'Operating Expenses',
        },
      ]);

      // Mock pending approvals
      setPendingApprovals([
        {
          id: 'APR-001',
          type: 'invoice',
          description: 'Invoice for XYZ Corporation - Monthly Services',
          amount: 85000,
          submittedBy: 'John Doe',
          submittedAt: new Date().toISOString(),
        },
        {
          id: 'APR-002',
          type: 'expense',
          description: 'Vehicle Maintenance Expenses',
          amount: 15400,
          submittedBy: 'Jane Smith',
          submittedAt: new Date().toISOString(),
        },
        {
          id: 'APR-003',
          type: 'payment',
          description: 'Vendor Payment - Tech Solutions Inc.',
          amount: 42000,
          submittedBy: 'Mike Johnson',
          submittedAt: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  };

  const getApprovalTypeColor = (type: string) => {
    switch (type) {
      case 'invoice':
        return 'bg-blue-100 text-blue-700';
      case 'payment':
        return 'bg-green-100 text-green-700';
      case 'expense':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Finance Dashboard</h1>
          <p className="text-neutral-600 mt-1">
            Manage accounting, invoices, and financial reports
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/finance/ledger')}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            View Ledger
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/finance/reports')}
            className="flex items-center gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            Reports
          </Button>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-green-100">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-neutral-600">Cash Balance</p>
              <p className="text-2xl font-bold text-neutral-900">
                {formatCurrency(quickStats.cashBalance)}
              </p>
            </div>
            <p className="text-xs text-neutral-500 mt-2">Current available</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-blue-100">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-neutral-600">Accounts Receivable</p>
              <p className="text-2xl font-bold text-neutral-900">
                {formatCurrency(quickStats.accountsReceivable)}
              </p>
            </div>
            <p className="text-xs text-neutral-500 mt-2">Outstanding invoices</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-orange-100">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-neutral-600">Accounts Payable</p>
              <p className="text-2xl font-bold text-neutral-900">
                {formatCurrency(quickStats.accountsPayable)}
              </p>
            </div>
            <p className="text-xs text-neutral-500 mt-2">Amount due</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-purple-100">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-neutral-600">Net Income (MTD)</p>
              <p className="text-2xl font-bold text-neutral-900">
                {formatCurrency(quickStats.netIncome)}
              </p>
            </div>
            <p className="text-xs text-neutral-500 mt-2">Month to date</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <Card className="lg:col-span-2">
          <CardHeader className="border-b border-neutral-200">
            <div className="flex items-center justify-between">
              <CardTitle>Recent Transactions</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/finance/ledger')}
                className="flex items-center gap-1"
              >
                View All
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-neutral-100">
              {recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="p-4 hover:bg-neutral-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-neutral-900">
                          {transaction.description}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            transaction.type === 'credit'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {transaction.type === 'credit' ? 'Credit' : 'Debit'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-neutral-500">
                        <span>{transaction.reference}</span>
                        <span>•</span>
                        <span>{transaction.category}</span>
                        <span>•</span>
                        <span>{formatDate(transaction.date)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-lg font-bold ${
                          transaction.type === 'credit'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {transaction.type === 'credit' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card>
          <CardHeader className="border-b border-neutral-200">
            <CardTitle>Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-neutral-100">
              {pendingApprovals.map((approval) => (
                <div
                  key={approval.id}
                  className="p-4 hover:bg-neutral-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getApprovalTypeColor(
                            approval.type
                          )}`}
                        >
                          {approval.type.charAt(0).toUpperCase() + approval.type.slice(1)}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-neutral-900 mb-1">
                        {approval.description}
                      </p>
                      <p className="text-lg font-bold text-neutral-900 mb-2">
                        {formatCurrency(approval.amount)}
                      </p>
                      <p className="text-xs text-neutral-500">
                        By {approval.submittedBy} • {formatDate(approval.submittedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-auto flex flex-col items-start p-4 gap-2"
              onClick={() => console.log('New Invoice')}
            >
              <FileText className="h-6 w-6 text-blue-600" />
              <div className="text-left">
                <p className="font-semibold text-neutral-900">New Invoice</p>
                <p className="text-xs text-neutral-600">Create and send invoice</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto flex flex-col items-start p-4 gap-2"
              onClick={() => console.log('New Payment')}
            >
              <DollarSign className="h-6 w-6 text-green-600" />
              <div className="text-left">
                <p className="font-semibold text-neutral-900">Record Payment</p>
                <p className="text-xs text-neutral-600">Log incoming payment</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto flex flex-col items-start p-4 gap-2"
              onClick={() => router.push('/finance/reports')}
            >
              <TrendingUp className="h-6 w-6 text-purple-600" />
              <div className="text-left">
                <p className="font-semibold text-neutral-900">Run Report</p>
                <p className="text-xs text-neutral-600">Generate financial report</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
