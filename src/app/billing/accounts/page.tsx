'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/xpress/card';
import { Button } from '@/components/xpress/button';
import { Badge } from '@/components/xpress/badge';
import { AccountStatusBadge } from '@/components/billing/AccountStatusBadge';
import { CreditLimitIndicator } from '@/components/billing/CreditLimitIndicator';
import {
  Plus,
  Search,
  Filter,
  Building2,
  Mail,
  Phone,
  FileText,
  TrendingUp,
  AlertTriangle,
  Eye,
} from 'lucide-react';
import { billingApi } from '@/lib/api-client';
import type { CorporateAccount, CorporateAccountStatus, PaginatedAccounts } from '@/types/billing';
import { useRouter } from 'next/navigation';

export default function CorporateAccountsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<CorporateAccount[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<CorporateAccountStatus[]>([]);
  const [hasOutstanding, setHasOutstanding] = useState<boolean | undefined>(undefined);
  const [showFilters, setShowFilters] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalAccounts: 0,
    activeAccounts: 0,
    totalCreditLimit: 0,
    totalOutstanding: 0,
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async (page = 1) => {
    try {
      setLoading(true);

      const params: any = {
        page,
        limit: pagination.limit,
        sortBy: 'companyName',
        sortOrder: 'asc' as const,
      };

      if (searchTerm) params.search = searchTerm;
      if (statusFilter.length > 0) params.status = statusFilter;
      if (hasOutstanding !== undefined) params.hasOutstanding = hasOutstanding;

      const response = await billingApi.accounts.getAll(params);

      if (response.success && response.data) {
        const data = response.data as PaginatedAccounts;
        setAccounts(data.data);
        setPagination(data.pagination);

        // Calculate stats
        const totalCreditLimit = data.data.reduce((sum, acc) => sum + acc.creditLimit, 0);
        const totalOutstanding = data.data.reduce((sum, acc) => sum + acc.outstandingBalance, 0);
        const activeAccounts = data.data.filter((acc) => acc.status === 'active').length;

        setStats({
          totalAccounts: data.pagination.total,
          activeAccounts,
          totalCreditLimit,
          totalOutstanding,
        });
      }
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchAccounts(1);
  };

  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const statusOptions: CorporateAccountStatus[] = ['active', 'suspended', 'terminated'];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Corporate Accounts</h1>
          <p className="text-neutral-600 mt-1">Manage B2B corporate accounts and credit limits</p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => alert('Create account modal would open here')}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          New Account
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="outlined" padding="md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-xpress-100 rounded-lg">
              <Building2 className="h-5 w-5 text-xpress-600" />
            </div>
            <div>
              <div className="text-sm text-neutral-600">Total Accounts</div>
              <div className="text-2xl font-bold text-neutral-900">{stats.totalAccounts}</div>
            </div>
          </div>
        </Card>

        <Card variant="outlined" padding="md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-success-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-success-600" />
            </div>
            <div>
              <div className="text-sm text-neutral-600">Active Accounts</div>
              <div className="text-2xl font-bold text-neutral-900">{stats.activeAccounts}</div>
            </div>
          </div>
        </Card>

        <Card variant="outlined" padding="md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-info-100 rounded-lg">
              <FileText className="h-5 w-5 text-info-600" />
            </div>
            <div>
              <div className="text-sm text-neutral-600">Total Credit Limit</div>
              <div className="text-xl font-bold text-neutral-900">
                {formatCurrency(stats.totalCreditLimit)}
              </div>
            </div>
          </div>
        </Card>

        <Card variant="outlined" padding="md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-warning-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-warning-600" />
            </div>
            <div>
              <div className="text-sm text-neutral-600">Total Outstanding</div>
              <div className="text-xl font-bold text-neutral-900">
                {formatCurrency(stats.totalOutstanding)}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card variant="outlined" padding="md">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search by company name, contact, or account number..."
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
                      <AccountStatusBadge status={status} size="sm" />
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Outstanding Balance
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="outstanding"
                      checked={hasOutstanding === undefined}
                      onChange={() => setHasOutstanding(undefined)}
                      className="border-neutral-300 text-xpress-600 focus:ring-xpress-500"
                    />
                    <span className="text-sm text-neutral-700">All</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="outstanding"
                      checked={hasOutstanding === true}
                      onChange={() => setHasOutstanding(true)}
                      className="border-neutral-300 text-xpress-600 focus:ring-xpress-500"
                    />
                    <span className="text-sm text-neutral-700">With Outstanding</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="outstanding"
                      checked={hasOutstanding === false}
                      onChange={() => setHasOutstanding(false)}
                      className="border-neutral-300 text-xpress-600 focus:ring-xpress-500"
                    />
                    <span className="text-sm text-neutral-700">No Outstanding</span>
                  </label>
                </div>
              </div>

              <div className="md:col-span-2 flex items-end">
                <Button
                  variant="tertiary"
                  size="md"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter([]);
                    setHasOutstanding(undefined);
                    fetchAccounts(1);
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

      {/* Accounts Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} variant="outlined" padding="md" className="animate-pulse">
              <div className="space-y-3">
                <div className="h-6 bg-neutral-200 rounded w-3/4"></div>
                <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
                <div className="h-16 bg-neutral-200 rounded"></div>
                <div className="h-4 bg-neutral-200 rounded w-full"></div>
              </div>
            </Card>
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <Card variant="outlined" padding="lg">
          <div className="text-center py-12">
            <Building2 className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">No accounts found</h3>
            <p className="text-neutral-600 mb-4">
              Get started by creating your first corporate account.
            </p>
            <Button
              variant="primary"
              size="md"
              onClick={() => alert('Create account modal would open here')}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Create Account
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((account) => (
              <Card
                key={account.id}
                variant="outlined"
                padding="md"
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/billing/accounts/${account.id}`)}
              >
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-neutral-900 mb-1">
                        {account.companyName}
                      </h3>
                      <div className="text-sm text-neutral-600">
                        {account.accountNumber || `ACC-${account.id.slice(0, 8)}`}
                      </div>
                    </div>
                    <AccountStatusBadge status={account.status} size="sm" />
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-neutral-600">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{account.contactEmail}</span>
                    </div>
                    <div className="flex items-center gap-2 text-neutral-600">
                      <Phone className="h-4 w-4" />
                      <span>{account.contactPhone}</span>
                    </div>
                  </div>

                  {/* Credit Limit Indicator */}
                  <div className="pt-3 border-t border-neutral-200">
                    <CreditLimitIndicator
                      creditLimit={account.creditLimit}
                      outstandingBalance={account.outstandingBalance}
                      showWarning={true}
                    />
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-neutral-200">
                    <div>
                      <div className="text-xs text-neutral-600 mb-1">Authorized Bookers</div>
                      <div className="font-semibold text-neutral-900">
                        {account.authorizedBookers?.length || 0}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-neutral-600 mb-1">Currency</div>
                      <div className="font-semibold text-neutral-900">{account.currency}</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-neutral-200">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/billing/accounts/${account.id}`);
                      }}
                      leftIcon={<Eye className="h-4 w-4" />}
                      className="flex-1"
                    >
                      View Details
                    </Button>
                    <Button
                      variant="tertiary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/billing/invoices/create?accountId=${account.id}`);
                      }}
                      leftIcon={<FileText className="h-4 w-4" />}
                      className="flex-1"
                    >
                      New Invoice
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <div className="text-sm text-neutral-600">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} accounts
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => fetchAccounts(pagination.page - 1)}
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
                        onClick={() => fetchAccounts(page)}
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => fetchAccounts(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
