'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/xpress/card';
import { Button } from '@/components/xpress/button';
import { Badge } from '@/components/xpress/badge';
import { InvoiceStatusBadge } from '@/components/billing/InvoiceStatusBadge';
import {
  Plus,
  Search,
  Filter,
  Download,
  Mail,
  MoreVertical,
  Check,
  Send,
  XCircle,
  FileText,
  Calendar,
} from 'lucide-react';
import { billingApi } from '@/lib/api-client';
import type { Invoice, InvoiceStatus, PaginatedInvoices } from '@/types/billing';
import { useRouter, useSearchParams } from 'next/navigation';

function InvoicesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [accountFilter, setAccountFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Bulk actions
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  useEffect(() => {
    // Get initial status filter from URL if present
    const statusParam = searchParams.get('status');
    if (statusParam) {
      setStatusFilter([statusParam as InvoiceStatus]);
    }
    fetchInvoices();
  }, [searchParams]);

  const fetchInvoices = async (page = 1) => {
    try {
      setLoading(true);

      const params: any = {
        page,
        limit: pagination.limit,
        sortBy: 'issueDate',
        sortOrder: 'desc' as const,
      };

      if (searchTerm) params.search = searchTerm;
      if (statusFilter.length > 0) params.status = statusFilter;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      if (accountFilter) params.accountId = accountFilter;

      const response = await billingApi.invoices.getAll(params);

      if (response.success && response.data) {
        const data = response.data as PaginatedInvoices;
        setInvoices(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchInvoices(1);
  };

  const handleBulkAction = async (action: 'send' | 'mark_paid' | 'send_reminder') => {
    if (selectedInvoices.length === 0) return;

    try {
      setBulkActionLoading(true);
      await billingApi.invoices.bulk({
        invoiceIds: selectedInvoices,
        action,
      });
      setSelectedInvoices([]);
      fetchInvoices(pagination.page);
      alert(`Bulk ${action} completed successfully`);
    } catch (error) {
      console.error('Bulk action failed:', error);
      alert('Bulk action failed');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const toggleInvoiceSelection = (invoiceId: string) => {
    setSelectedInvoices((prev) =>
      prev.includes(invoiceId) ? prev.filter((id) => id !== invoiceId) : [...prev, invoiceId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedInvoices.length === invoices.length) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(invoices.map((inv) => inv.id));
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

  const statusOptions: InvoiceStatus[] = ['draft', 'sent', 'paid', 'overdue', 'void'];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Invoices</h1>
          <p className="text-neutral-600 mt-1">
            Manage and track all corporate invoices
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => router.push('/billing/invoices/create')}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Generate Invoice
        </Button>
      </div>

      {/* Filters and Search */}
      <Card variant="outlined" padding="md">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search by invoice number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-xpress-500"
              />
            </div>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setShowFilters(!showFilters)}
              leftIcon={<Filter className="h-4 w-4" />}
            >
              Filters
            </Button>
            <Button variant="primary" size="md" onClick={handleSearch}>
              Search
            </Button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-neutral-200">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Status
                </label>
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
                      <InvoiceStatusBadge status={status} size="sm" />
                    </label>
                  ))}
                </div>
              </div>

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
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Date To
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-xpress-500"
                />
              </div>

              <div className="flex items-end">
                <Button
                  variant="tertiary"
                  size="md"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter([]);
                    setDateFrom('');
                    setDateTo('');
                    setAccountFilter('');
                    fetchInvoices(1);
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

      {/* Bulk Actions */}
      {selectedInvoices.length > 0 && (
        <Card variant="outlined" padding="md" className="bg-xpress-50 border-xpress-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="primary">{selectedInvoices.length} selected</Badge>
              <span className="text-sm text-neutral-600">Bulk Actions:</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleBulkAction('send')}
                disabled={bulkActionLoading}
                leftIcon={<Send className="h-4 w-4" />}
              >
                Send
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleBulkAction('send_reminder')}
                disabled={bulkActionLoading}
                leftIcon={<Mail className="h-4 w-4" />}
              >
                Send Reminder
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleBulkAction('mark_paid')}
                disabled={bulkActionLoading}
                leftIcon={<Check className="h-4 w-4" />}
              >
                Mark Paid
              </Button>
              <Button
                variant="tertiary"
                size="sm"
                onClick={() => setSelectedInvoices([])}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Invoices Table */}
      <Card variant="outlined" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedInvoices.length === invoices.length && invoices.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-neutral-300 text-xpress-600 focus:ring-xpress-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">
                  Invoice #
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">
                  Account
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">
                  Issue Date
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">
                  Due Date
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">
                  Amount
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
                      <div className="h-4 w-4 bg-neutral-200 rounded"></div>
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
                      <div className="h-8 bg-neutral-200 rounded w-8"></div>
                    </td>
                  </tr>
                ))
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <FileText className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                    <p className="text-neutral-600">No invoices found</p>
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="hover:bg-neutral-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedInvoices.includes(invoice.id)}
                        onChange={() => toggleInvoiceSelection(invoice.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border-neutral-300 text-xpress-600 focus:ring-xpress-500"
                      />
                    </td>
                    <td
                      className="px-4 py-4"
                      onClick={() => router.push(`/billing/invoices/${invoice.id}`)}
                    >
                      <span className="font-semibold text-neutral-900">
                        {invoice.invoiceNumber}
                      </span>
                    </td>
                    <td
                      className="px-4 py-4"
                      onClick={() => router.push(`/billing/invoices/${invoice.id}`)}
                    >
                      <span className="text-neutral-700">{invoice.corporateAccountName}</span>
                    </td>
                    <td
                      className="px-4 py-4"
                      onClick={() => router.push(`/billing/invoices/${invoice.id}`)}
                    >
                      <span className="text-neutral-600">{formatDate(invoice.issueDate)}</span>
                    </td>
                    <td
                      className="px-4 py-4"
                      onClick={() => router.push(`/billing/invoices/${invoice.id}`)}
                    >
                      <span className="text-neutral-600">{formatDate(invoice.dueDate)}</span>
                    </td>
                    <td
                      className="px-4 py-4"
                      onClick={() => router.push(`/billing/invoices/${invoice.id}`)}
                    >
                      <span className="font-semibold text-neutral-900">
                        {formatCurrency(invoice.totalAmount)}
                      </span>
                    </td>
                    <td
                      className="px-4 py-4"
                      onClick={() => router.push(`/billing/invoices/${invoice.id}`)}
                    >
                      <InvoiceStatusBadge status={invoice.status} size="sm" />
                    </td>
                    <td className="px-4 py-4">
                      <Button
                        variant="tertiary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Show actions menu
                        }}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && invoices.length > 0 && (
          <div className="px-6 py-4 border-t border-neutral-200 flex items-center justify-between">
            <div className="text-sm text-neutral-600">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} invoices
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fetchInvoices(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      variant={pagination.page === page ? 'primary' : 'tertiary'}
                      size="sm"
                      onClick={() => fetchInvoices(page)}
                    >
                      {page}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fetchInvoices(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function InvoicesPage() {
  return (
    <Suspense fallback={
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-neutral-200 rounded w-64"></div>
          <div className="h-64 bg-neutral-200 rounded"></div>
        </div>
      </div>
    }>
      <InvoicesContent />
    </Suspense>
  );
}
