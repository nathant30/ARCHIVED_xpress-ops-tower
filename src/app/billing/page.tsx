'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/xpress/card';
import { Button } from '@/components/xpress/button';
import { BillingKPICard } from '@/components/billing/BillingKPICard';
import { InvoiceStatusBadge } from '@/components/billing/InvoiceStatusBadge';
import {
  DollarSign,
  FileText,
  AlertTriangle,
  TrendingUp,
  Plus,
  Building2,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import { billingApi } from '@/lib/api-client';
import type { RecentInvoice, UpcomingInvoiceDue, RevenueChartData } from '@/types/billing';
import { useRouter } from 'next/navigation';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function BillingDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({
    totalBilled: 0,
    outstanding: 0,
    overdue: 0,
    collected: 0,
  });
  const [recentInvoices, setRecentInvoices] = useState<RecentInvoice[]>([]);
  const [upcomingDue, setUpcomingDue] = useState<UpcomingInvoiceDue[]>([]);
  const [overdueAccounts, setOverdueAccounts] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueChartData[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all dashboard data in parallel
      const [kpisRes, recentRes, upcomingRes, overdueRes, revenueRes] = await Promise.all([
        billingApi.dashboard.getKPIs().catch(() => ({ success: true, data: null })),
        billingApi.dashboard.getRecentInvoices(10).catch(() => ({ success: true, data: [] })),
        billingApi.dashboard.getUpcomingDue(30).catch(() => ({ success: true, data: [] })),
        billingApi.dashboard.getOverdueAccounts().catch(() => ({ success: true, data: [] })),
        billingApi.dashboard.getRevenueChart({ period: 'monthly', months: 6 }).catch(() => ({
          success: true,
          data: [],
        })),
      ]);

      if (kpisRes.success && kpisRes.data) {
        setKpis(kpisRes.data);
      }

      if (recentRes.success && recentRes.data) {
        setRecentInvoices(recentRes.data);
      }

      if (upcomingRes.success && upcomingRes.data) {
        setUpcomingDue(upcomingRes.data);
      }

      if (overdueRes.success && overdueRes.data) {
        setOverdueAccounts(overdueRes.data);
      }

      if (revenueRes.success && revenueRes.data) {
        setRevenueData(revenueRes.data);
      }
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
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'Asia/Manila',
    }).format(date);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Billing Dashboard</h1>
          <p className="text-neutral-600 mt-1">
            Monitor invoicing, accounts, and revenue for corporate clients
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="tertiary"
            size="md"
            onClick={() => router.push('/billing/accounts')}
            leftIcon={<Building2 className="h-4 w-4" />}
          >
            Manage Accounts
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => router.push('/billing/invoices/create')}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Generate Invoice
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <BillingKPICard
          label="Total Billed (MTD)"
          value={formatCurrency(kpis.totalBilled)}
          icon={<DollarSign className="h-5 w-5" />}
          iconColor="text-xpress-600"
          isLoading={loading}
        />
        <BillingKPICard
          label="Outstanding"
          value={formatCurrency(kpis.outstanding)}
          icon={<FileText className="h-5 w-5" />}
          iconColor="text-warning-600"
          isLoading={loading}
        />
        <BillingKPICard
          label="Overdue"
          value={formatCurrency(kpis.overdue)}
          icon={<AlertTriangle className="h-5 w-5" />}
          iconColor="text-danger-600"
          isLoading={loading}
        />
        <BillingKPICard
          label="Collected (MTD)"
          value={formatCurrency(kpis.collected)}
          icon={<TrendingUp className="h-5 w-5" />}
          iconColor="text-success-600"
          isLoading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Invoices */}
        <div className="lg:col-span-2">
          <Card variant="outlined" padding="none">
            <CardHeader className="p-6 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle>Recent Invoices</CardTitle>
                <Button
                  variant="tertiary"
                  size="sm"
                  onClick={() => router.push('/billing/invoices')}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="animate-pulse flex items-center justify-between py-3">
                      <div className="flex-1">
                        <div className="h-4 bg-neutral-200 rounded w-32 mb-2"></div>
                        <div className="h-3 bg-neutral-200 rounded w-48"></div>
                      </div>
                      <div className="h-6 bg-neutral-200 rounded w-20"></div>
                    </div>
                  ))}
                </div>
              ) : recentInvoices.length === 0 ? (
                <div className="p-12 text-center">
                  <FileText className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                  <p className="text-neutral-600">No recent invoices</p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-200">
                  {recentInvoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="p-4 hover:bg-neutral-50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/billing/invoices/${invoice.id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-semibold text-neutral-900">
                              {invoice.invoiceNumber}
                            </span>
                            <InvoiceStatusBadge status={invoice.status} size="sm" />
                          </div>
                          <p className="text-sm text-neutral-600">{invoice.accountName}</p>
                          <p className="text-xs text-neutral-500 mt-1">
                            Due: {formatDate(invoice.dueDate)}
                            {invoice.daysOverdue && invoice.daysOverdue > 0 && (
                              <span className="text-danger-600 font-medium ml-2">
                                {invoice.daysOverdue} days overdue
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-neutral-900">
                            {formatCurrency(invoice.totalAmount)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Due & Overdue Alerts */}
        <div className="space-y-6">
          {/* Overdue Accounts Alert */}
          {!loading && overdueAccounts.length > 0 && (
            <Card variant="outlined" padding="md" className="border-danger-200 bg-danger-50">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-danger-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-danger-900 mb-1">
                    {overdueAccounts.length} Overdue Account{overdueAccounts.length !== 1 && 's'}
                  </h3>
                  <p className="text-sm text-danger-700 mb-3">
                    Total overdue amount:{' '}
                    {formatCurrency(
                      overdueAccounts.reduce((sum, acc) => sum + (acc.overdueAmount || 0), 0)
                    )}
                  </p>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => router.push('/billing/invoices?status=overdue')}
                  >
                    Review Overdue
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Upcoming Due Invoices */}
          <Card variant="outlined" padding="none">
            <CardHeader className="p-4">
              <CardTitle className="text-base">Upcoming Due (30 days)</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-3 bg-neutral-200 rounded w-full mb-2"></div>
                      <div className="h-4 bg-neutral-200 rounded w-24"></div>
                    </div>
                  ))}
                </div>
              ) : upcomingDue.length === 0 ? (
                <div className="p-8 text-center">
                  <Calendar className="h-8 w-8 text-neutral-300 mx-auto mb-2" />
                  <p className="text-sm text-neutral-600">No upcoming due invoices</p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-200">
                  {upcomingDue.slice(0, 5).map((invoice) => (
                    <div
                      key={invoice.id}
                      className="p-3 hover:bg-neutral-50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/billing/invoices/${invoice.id}`)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-neutral-900">
                          {invoice.invoiceNumber}
                        </span>
                        <span className="text-sm font-semibold text-neutral-900">
                          {formatCurrency(invoice.amount)}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-600 mb-1">{invoice.accountName}</p>
                      <p className="text-xs text-warning-600 font-medium">
                        Due in {invoice.daysUntilDue} days ({formatDate(invoice.dueDate)})
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Revenue Chart */}
      <Card variant="outlined" padding="md">
        <CardHeader className="mb-4">
          <CardTitle>Revenue Trend (Last 6 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-80 flex items-center justify-center">
              <div className="animate-pulse text-neutral-400">Loading chart data...</div>
            </div>
          ) : revenueData.length === 0 ? (
            <div className="h-80 flex items-center justify-center">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                <p className="text-neutral-600">No revenue data available</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="period" stroke="#666" fontSize={12} />
                <YAxis
                  stroke="#666"
                  fontSize={12}
                  tickFormatter={(value) => `₱${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: any) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e5e5',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="billed" fill="#6366f1" name="Billed" radius={[4, 4, 0, 0]} />
                <Bar dataKey="collected" fill="#10b981" name="Collected" radius={[4, 4, 0, 0]} />
                <Bar dataKey="outstanding" fill="#f59e0b" name="Outstanding" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
