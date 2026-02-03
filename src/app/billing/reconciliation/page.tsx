'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/xpress/card';
import { Button } from '@/components/xpress/button';
import { Badge } from '@/components/xpress/badge';
import {
  Check,
  X,
  AlertTriangle,
  DollarSign,
  FileText,
  TrendingUp,
  Search,
  Filter,
  Download,
  Calendar,
  CheckCircle,
} from 'lucide-react';
import { billingApi } from '@/lib/api-client';
import type {
  UnreconciledTransaction,
  ReconciliationStats,
  ReconciliationStatus,
} from '@/types/billing';

export default function ReconciliationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<UnreconciledTransaction[]>([]);
  const [stats, setStats] = useState<ReconciliationStats>({
    unreconciledCount: 0,
    unreconciledAmount: 0,
    discrepancyCount: 0,
    discrepancyAmount: 0,
    reconciledToday: 0,
    pendingReview: 0,
  });

  // Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReconciliationStatus[]>([]);
  const [accountFilter, setAccountFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Reconciliation modal
  const [selectedTransaction, setSelectedTransaction] = useState<UnreconciledTransaction | null>(
    null
  );
  const [showReconcileModal, setShowReconcileModal] = useState(false);
  const [reconcileInvoiceId, setReconcileInvoiceId] = useState('');
  const [reconcileNotes, setReconcileNotes] = useState('');

  // Discrepancy modal
  const [showDiscrepancyModal, setShowDiscrepancyModal] = useState(false);
  const [discrepancyReason, setDiscrepancyReason] = useState('');
  const [discrepancyNotes, setDiscrepancyNotes] = useState('');

  useEffect(() => {
    fetchStats();
    fetchTransactions();
    setDefaultDates();
  }, []);

  const setDefaultDates = () => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    setDateFrom(firstDayOfMonth.toISOString().split('T')[0]);
    setDateTo(now.toISOString().split('T')[0]);
  };

  const fetchStats = async () => {
    try {
      const response = await billingApi.reconciliation.getStats();
      if (response.success && response.data) {
        setStats(response.data as ReconciliationStats);
      }
    } catch (error) {
      console.error('Failed to fetch reconciliation stats:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);

      const params: any = {
        limit: 100,
      };

      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      if (statusFilter.length > 0) params.status = statusFilter;
      if (accountFilter) params.accountId = accountFilter;

      const response = await billingApi.reconciliation.getUnreconciled(params);

      if (response.success && response.data) {
        setTransactions(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch unreconciled transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReconcile = async () => {
    if (!selectedTransaction) return;

    try {
      await billingApi.reconciliation.reconcile(selectedTransaction.id, {
        invoiceId: reconcileInvoiceId || undefined,
        notes: reconcileNotes || undefined,
      });

      alert('Transaction reconciled successfully!');
      setShowReconcileModal(false);
      setSelectedTransaction(null);
      setReconcileInvoiceId('');
      setReconcileNotes('');
      fetchStats();
      fetchTransactions();
    } catch (error) {
      console.error('Failed to reconcile transaction:', error);
      alert('Failed to reconcile transaction. Please try again.');
    }
  };

  const handleMarkDiscrepancy = async () => {
    if (!selectedTransaction) return;

    if (!discrepancyReason) {
      alert('Please provide a reason for the discrepancy');
      return;
    }

    try {
      await billingApi.reconciliation.markDiscrepancy(selectedTransaction.id, {
        reason: discrepancyReason,
        notes: discrepancyNotes || undefined,
      });

      alert('Transaction marked as discrepancy!');
      setShowDiscrepancyModal(false);
      setSelectedTransaction(null);
      setDiscrepancyReason('');
      setDiscrepancyNotes('');
      fetchStats();
      fetchTransactions();
    } catch (error) {
      console.error('Failed to mark discrepancy:', error);
      alert('Failed to mark discrepancy. Please try again.');
    }
  };

  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'Asia/Manila',
    }).format(date);
  };

  const getStatusBadge = (status: ReconciliationStatus) => {
    const config = {
      pending: { variant: 'warning' as const, label: 'Pending' },
      reconciled: { variant: 'success' as const, label: 'Reconciled' },
      discrepancy: { variant: 'danger' as const, label: 'Discrepancy' },
      disputed: { variant: 'solid-danger' as const, label: 'Disputed' },
    };

    const { variant, label } = config[status] || config.pending;
    return <Badge variant={variant}>{label}</Badge>;
  };

  const statusOptions: ReconciliationStatus[] = ['pending', 'reconciled', 'discrepancy', 'disputed'];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Payment Reconciliation</h1>
          <p className="text-neutral-600 mt-1">
            Match payments with invoices and resolve discrepancies
          </p>
        </div>

        <Button
          variant="secondary"
          size="md"
          onClick={() =>
            billingApi.reconciliation
              .exportReport({ dateFrom, dateTo, format: 'xlsx' })
              .then(() => alert('Export started'))
          }
          leftIcon={<Download className="h-4 w-4" />}
        >
          Export Report
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="outlined" padding="md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-warning-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-warning-600" />
            </div>
            <div>
              <div className="text-sm text-neutral-600">Unreconciled</div>
              <div className="text-2xl font-bold text-neutral-900">{stats.unreconciledCount}</div>
              <div className="text-xs text-neutral-600 mt-1">
                {formatCurrency(stats.unreconciledAmount)}
              </div>
            </div>
          </div>
        </Card>

        <Card variant="outlined" padding="md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-danger-100 rounded-lg">
              <X className="h-5 w-5 text-danger-600" />
            </div>
            <div>
              <div className="text-sm text-neutral-600">Discrepancies</div>
              <div className="text-2xl font-bold text-neutral-900">{stats.discrepancyCount}</div>
              <div className="text-xs text-neutral-600 mt-1">
                {formatCurrency(stats.discrepancyAmount)}
              </div>
            </div>
          </div>
        </Card>

        <Card variant="outlined" padding="md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-success-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-success-600" />
            </div>
            <div>
              <div className="text-sm text-neutral-600">Reconciled Today</div>
              <div className="text-2xl font-bold text-neutral-900">{stats.reconciledToday}</div>
            </div>
          </div>
        </Card>

        <Card variant="outlined" padding="md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-info-100 rounded-lg">
              <FileText className="h-5 w-5 text-info-600" />
            </div>
            <div>
              <div className="text-sm text-neutral-600">Pending Review</div>
              <div className="text-2xl font-bold text-neutral-900">{stats.pendingReview}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card variant="outlined" padding="md">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setShowFilters(!showFilters)}
              leftIcon={<Filter className="h-4 w-4" />}
            >
              {showFilters ? 'Hide' : 'Show'} Filters
            </Button>
            <Button variant="primary" size="md" onClick={fetchTransactions}>
              Apply Filters
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-neutral-200">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Date From
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-xpress-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Date To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-xpress-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Status</label>
                <div className="space-y-2">
                  {statusOptions.map((status) => (
                    <label key={status} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={statusFilter.includes(status)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setStatusFilter([...statusFilter, status]);
                          } else {
                            setStatusFilter(statusFilter.filter((s) => s !== status));
                          }
                        }}
                        className="rounded border-neutral-300 text-xpress-600 focus:ring-xpress-500"
                      />
                      {getStatusBadge(status)}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-end">
                <Button
                  variant="tertiary"
                  size="md"
                  onClick={() => {
                    setDateFrom('');
                    setDateTo('');
                    setStatusFilter([]);
                    setAccountFilter('');
                    setDefaultDates();
                    fetchTransactions();
                  }}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Transactions Table */}
      <Card variant="outlined" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">
                  Transaction ID
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">
                  Account
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">
                  Expected
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">
                  Actual
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">
                  Difference
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-4">
                      <div className="h-4 bg-neutral-200 rounded w-20"></div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 bg-neutral-200 rounded w-24"></div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 bg-neutral-200 rounded w-32"></div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 bg-neutral-200 rounded w-20"></div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 bg-neutral-200 rounded w-20"></div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 bg-neutral-200 rounded w-20"></div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-6 bg-neutral-200 rounded w-16"></div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-8 bg-neutral-200 rounded w-20"></div>
                    </td>
                  </tr>
                ))
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <CheckCircle className="h-12 w-12 text-success-300 mx-auto mb-3" />
                    <p className="text-neutral-900 font-semibold mb-1">All caught up!</p>
                    <p className="text-neutral-600">No unreconciled transactions found</p>
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-4">
                      <span className="text-sm text-neutral-700">{formatDate(transaction.date)}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-medium text-neutral-900">
                        {transaction.transactionId}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <div className="text-sm font-medium text-neutral-900">
                          {transaction.accountName}
                        </div>
                        {transaction.invoiceId && (
                          <div className="text-xs text-neutral-600">
                            Invoice: {transaction.invoiceId}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-semibold text-neutral-900">
                        {formatCurrency(transaction.expectedAmount)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-semibold text-neutral-900">
                        {formatCurrency(transaction.actualAmount)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`text-sm font-bold ${
                          transaction.difference === 0
                            ? 'text-success-600'
                            : 'text-danger-600'
                        }`}
                      >
                        {transaction.difference > 0 ? '+' : ''}
                        {formatCurrency(transaction.difference)}
                      </span>
                    </td>
                    <td className="px-4 py-4">{getStatusBadge(transaction.status)}</td>
                    <td className="px-4 py-4">
                      {transaction.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setSelectedTransaction(transaction);
                              setShowReconcileModal(true);
                            }}
                            leftIcon={<Check className="h-4 w-4" />}
                          >
                            Reconcile
                          </Button>
                          <Button
                            variant="tertiary"
                            size="sm"
                            onClick={() => {
                              setSelectedTransaction(transaction);
                              setShowDiscrepancyModal(true);
                            }}
                          >
                            <X className="h-4 w-4 text-danger-600" />
                          </Button>
                        </div>
                      )}
                      {transaction.status === 'reconciled' && (
                        <div className="text-xs text-neutral-600">
                          {transaction.reconciledBy && (
                            <div>By: {transaction.reconciledBy}</div>
                          )}
                          {transaction.reconciledAt && (
                            <div>{formatDate(transaction.reconciledAt)}</div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Reconcile Modal */}
      {showReconcileModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card variant="elevated" padding="none" className="max-w-lg w-full">
            <CardHeader className="p-6 pb-4 border-b border-neutral-200">
              <CardTitle>Reconcile Transaction</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <div className="text-sm text-neutral-600 mb-2">Transaction ID</div>
                <div className="font-semibold text-neutral-900">
                  {selectedTransaction.transactionId}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-neutral-600 mb-1">Expected Amount</div>
                  <div className="font-semibold text-neutral-900">
                    {formatCurrency(selectedTransaction.expectedAmount)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-neutral-600 mb-1">Actual Amount</div>
                  <div className="font-semibold text-neutral-900">
                    {formatCurrency(selectedTransaction.actualAmount)}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Link to Invoice (Optional)
                </label>
                <input
                  type="text"
                  value={reconcileInvoiceId}
                  onChange={(e) => setReconcileInvoiceId(e.target.value)}
                  placeholder="Enter invoice ID..."
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-xpress-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Notes</label>
                <textarea
                  value={reconcileNotes}
                  onChange={(e) => setReconcileNotes(e.target.value)}
                  placeholder="Add any notes about this reconciliation..."
                  rows={3}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-xpress-500 resize-none"
                />
              </div>
            </CardContent>
            <div className="p-6 pt-4 border-t border-neutral-200 flex items-center justify-end gap-3">
              <Button
                variant="tertiary"
                size="md"
                onClick={() => {
                  setShowReconcileModal(false);
                  setSelectedTransaction(null);
                  setReconcileInvoiceId('');
                  setReconcileNotes('');
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" size="md" onClick={handleReconcile}>
                Reconcile
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Discrepancy Modal */}
      {showDiscrepancyModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card variant="elevated" padding="none" className="max-w-lg w-full">
            <CardHeader className="p-6 pb-4 border-b border-neutral-200">
              <CardTitle className="text-danger-600">Mark as Discrepancy</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <div className="text-sm text-neutral-600 mb-2">Transaction ID</div>
                <div className="font-semibold text-neutral-900">
                  {selectedTransaction.transactionId}
                </div>
              </div>

              <div className="p-3 bg-danger-50 border border-danger-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-danger-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-danger-900 mb-1">Amount Mismatch</div>
                    <div className="text-sm text-danger-700">
                      Difference: {formatCurrency(Math.abs(selectedTransaction.difference))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Reason for Discrepancy *
                </label>
                <select
                  value={discrepancyReason}
                  onChange={(e) => setDiscrepancyReason(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-xpress-500"
                  required
                >
                  <option value="">Select a reason...</option>
                  <option value="partial_payment">Partial Payment</option>
                  <option value="overpayment">Overpayment</option>
                  <option value="wrong_amount">Wrong Amount Received</option>
                  <option value="bank_fees">Bank Fees Applied</option>
                  <option value="currency_conversion">Currency Conversion Issue</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  value={discrepancyNotes}
                  onChange={(e) => setDiscrepancyNotes(e.target.value)}
                  placeholder="Provide additional details about the discrepancy..."
                  rows={3}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-xpress-500 resize-none"
                />
              </div>
            </CardContent>
            <div className="p-6 pt-4 border-t border-neutral-200 flex items-center justify-end gap-3">
              <Button
                variant="tertiary"
                size="md"
                onClick={() => {
                  setShowDiscrepancyModal(false);
                  setSelectedTransaction(null);
                  setDiscrepancyReason('');
                  setDiscrepancyNotes('');
                }}
              >
                Cancel
              </Button>
              <Button variant="danger" size="md" onClick={handleMarkDiscrepancy}>
                Mark as Discrepancy
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// Fix: Add missing import
import { useRouter } from 'next/navigation';
