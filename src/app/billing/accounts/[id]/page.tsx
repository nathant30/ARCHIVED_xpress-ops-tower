'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/xpress/card';
import { Button } from '@/components/xpress/button';
import { Badge } from '@/components/xpress/badge';
import { AccountStatusBadge } from '@/components/billing/AccountStatusBadge';
import { CreditLimitIndicator } from '@/components/billing/CreditLimitIndicator';
import { InvoiceStatusBadge } from '@/components/billing/InvoiceStatusBadge';
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  Users,
  CreditCard,
  Calendar,
  Edit,
  Plus,
  Download,
  TrendingUp,
  DollarSign,
} from 'lucide-react';
import { billingApi } from '@/lib/api-client';
import type {
  CorporateAccount,
  Invoice,
  Subscription,
  AuthorizedBooker,
} from '@/types/billing';
import { useRouter, useParams } from 'next/navigation';

export default function AccountDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const accountId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<CorporateAccount | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [outstandingInvoices, setOutstandingInvoices] = useState<Invoice[]>([]);
  const [billingHistory, setBillingHistory] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);

  useEffect(() => {
    if (accountId) {
      fetchAccountDetails();
      fetchOutstandingInvoices();
      fetchBillingHistory();
    }
  }, [accountId]);

  const fetchAccountDetails = async () => {
    try {
      setLoading(true);
      const response = await billingApi.accounts.getById(accountId);

      if (response.success && response.data) {
        setAccount(response.data as CorporateAccount);

        // Fetch subscription if exists
        if (response.data.subscriptionId) {
          const subResponse = await billingApi.subscriptions.getById(
            response.data.subscriptionId
          );
          if (subResponse.success && subResponse.data) {
            setSubscription(subResponse.data as Subscription);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch account details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOutstandingInvoices = async () => {
    try {
      const response = await billingApi.accounts.getOutstandingInvoices(accountId);
      if (response.success && response.data) {
        setOutstandingInvoices(response.data as Invoice[]);
      }
    } catch (error) {
      console.error('Failed to fetch outstanding invoices:', error);
    }
  };

  const fetchBillingHistory = async () => {
    try {
      setLoadingInvoices(true);
      const response = await billingApi.accounts.getBillingHistory(accountId, {
        limit: 10,
      });

      if (response.success && response.data) {
        setBillingHistory(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch billing history:', error);
    } finally {
      setLoadingInvoices(false);
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

  const formatAddress = (address: any) => {
    if (!address) return 'N/A';
    return `${address.street}, ${address.city}, ${address.province} ${address.postalCode}`;
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-neutral-200 rounded w-1/4"></div>
          <div className="h-64 bg-neutral-200 rounded"></div>
          <div className="h-96 bg-neutral-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="p-6">
        <Card variant="outlined" padding="lg">
          <div className="text-center py-12">
            <Building2 className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">Account not found</h3>
            <p className="text-neutral-600 mb-4">The requested account could not be found.</p>
            <Button variant="primary" size="md" onClick={() => router.push('/billing/accounts')}>
              Back to Accounts
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="tertiary"
            size="md"
            onClick={() => router.push('/billing/accounts')}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Back
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-neutral-900">{account.companyName}</h1>
              <AccountStatusBadge status={account.status} />
            </div>
            <p className="text-neutral-600 mt-1">
              Account #{account.accountNumber || account.id.slice(0, 8)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="md"
            onClick={() => alert('Edit account functionality would go here')}
            leftIcon={<Edit className="h-4 w-4" />}
          >
            Edit Account
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() =>
              router.push(`/billing/invoices/create?accountId=${account.id}`)
            }
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Generate Invoice
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Account Information */}
          <Card variant="outlined" padding="md">
            <CardHeader className="mb-4">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-neutral-600">Company Name</label>
                  <p className="text-neutral-900 font-semibold mt-1">{account.companyName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-600">
                    Registration Number
                  </label>
                  <p className="text-neutral-900 mt-1">
                    {account.registrationNumber || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-600">Tax ID (TIN)</label>
                  <p className="text-neutral-900 mt-1">{account.taxId || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-600">Currency</label>
                  <p className="text-neutral-900 mt-1">{account.currency}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-neutral-600 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Billing Address
                  </label>
                  <p className="text-neutral-900 mt-1">
                    {formatAddress(account.billingAddress)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card variant="outlined" padding="md">
            <CardHeader className="mb-4">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-neutral-600">Contact Person</label>
                  <p className="text-neutral-900 font-semibold mt-1">
                    {account.contactPerson}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-600 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </label>
                  <p className="text-neutral-900 mt-1">{account.contactEmail}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-600 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone
                  </label>
                  <p className="text-neutral-900 mt-1">{account.contactPhone}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Details */}
          {subscription && (
            <Card variant="outlined" padding="md">
              <CardHeader className="mb-4">
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Subscription Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-neutral-600">Plan Name</label>
                    <p className="text-neutral-900 font-semibold mt-1">{subscription.planName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-600">Plan Type</label>
                    <p className="text-neutral-900 mt-1 capitalize">
                      {subscription.planType}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-600">
                      Price Per Ride
                    </label>
                    <p className="text-neutral-900 font-semibold mt-1">
                      {formatCurrency(subscription.pricePerRide)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-600">Status</label>
                    <div className="mt-1">
                      <Badge
                        variant={
                          subscription.status === 'active' ? 'success' : 'secondary'
                        }
                      >
                        {subscription.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-600">Start Date</label>
                    <p className="text-neutral-900 mt-1">
                      {formatDate(subscription.startDate)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-600">
                      Next Billing Date
                    </label>
                    <p className="text-neutral-900 mt-1">
                      {formatDate(subscription.nextBillingDate)}
                    </p>
                  </div>
                  {subscription.monthlyMinimum && (
                    <div>
                      <label className="text-sm font-medium text-neutral-600">
                        Monthly Minimum
                      </label>
                      <p className="text-neutral-900 font-semibold mt-1">
                        {formatCurrency(subscription.monthlyMinimum)}
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-neutral-600">Auto Renew</label>
                    <p className="text-neutral-900 mt-1">
                      {subscription.autoRenew ? 'Yes' : 'No'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Authorized Bookers */}
          <Card variant="outlined" padding="md">
            <CardHeader className="mb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Authorized Bookers ({account.authorizedBookers?.length || 0})
                </CardTitle>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => alert('Add booker functionality would go here')}
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  Add Booker
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!account.authorizedBookers || account.authorizedBookers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                  <p className="text-neutral-600">No authorized bookers yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {account.authorizedBookers.map((booker: AuthorizedBooker) => (
                    <div
                      key={booker.id}
                      className="flex items-center justify-between p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-neutral-900">{booker.name}</span>
                          {!booker.isActive && (
                            <Badge variant="secondary" size="sm">
                              Inactive
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-neutral-600 mt-1">{booker.email}</div>
                        <div className="text-sm text-neutral-600">{booker.phone}</div>
                      </div>
                      <div className="text-sm text-neutral-600">
                        <div className="font-medium">{booker.role}</div>
                        <div className="text-xs">Added {formatDate(booker.addedDate)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Billing History */}
          <Card variant="outlined" padding="md">
            <CardHeader className="mb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Recent Billing History
                </CardTitle>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    router.push(`/billing/invoices?accountId=${account.id}`)
                  }
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingInvoices ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="animate-pulse h-16 bg-neutral-200 rounded"></div>
                  ))}
                </div>
              ) : billingHistory.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                  <p className="text-neutral-600">No billing history yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {billingHistory.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 cursor-pointer"
                      onClick={() => router.push(`/billing/invoices/${invoice.id}`)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-semibold text-neutral-900">
                            {invoice.invoiceNumber}
                          </span>
                          <InvoiceStatusBadge status={invoice.status} size="sm" />
                        </div>
                        <div className="text-sm text-neutral-600">
                          {formatDate(invoice.issueDate)} - Due: {formatDate(invoice.dueDate)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-neutral-900">
                          {formatCurrency(invoice.totalAmount)}
                        </div>
                        {invoice.amountDue > 0 && (
                          <div className="text-sm text-warning-600">
                            Due: {formatCurrency(invoice.amountDue)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Credit Limit Card */}
          <Card variant="outlined" padding="md">
            <CardHeader className="mb-4">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Credit Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CreditLimitIndicator
                creditLimit={account.creditLimit}
                outstandingBalance={account.outstandingBalance}
                showWarning={true}
              />
            </CardContent>
          </Card>

          {/* Financial Summary */}
          <Card variant="outlined" padding="md">
            <CardHeader className="mb-4">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Financial Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Credit Limit</span>
                  <span className="font-semibold text-neutral-900">
                    {formatCurrency(account.creditLimit)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Outstanding Balance</span>
                  <span className="font-semibold text-warning-600">
                    {formatCurrency(account.outstandingBalance)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Available Credit</span>
                  <span className="font-semibold text-success-600">
                    {formatCurrency(account.availableCredit)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Outstanding Invoices */}
          {outstandingInvoices.length > 0 && (
            <Card variant="outlined" padding="md" className="border-warning-200 bg-warning-50">
              <CardHeader className="mb-4">
                <CardTitle className="text-warning-900">
                  Outstanding Invoices ({outstandingInvoices.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {outstandingInvoices.slice(0, 5).map((invoice) => (
                    <div
                      key={invoice.id}
                      className="p-2 bg-white border border-warning-200 rounded-lg cursor-pointer hover:border-warning-300"
                      onClick={() => router.push(`/billing/invoices/${invoice.id}`)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-neutral-900">
                          {invoice.invoiceNumber}
                        </span>
                        <InvoiceStatusBadge status={invoice.status} size="sm" />
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-neutral-600">
                          Due: {formatDate(invoice.dueDate)}
                        </span>
                        <span className="font-semibold text-warning-900">
                          {formatCurrency(invoice.amountDue)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card variant="outlined" padding="md">
            <CardHeader className="mb-4">
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button
                  variant="secondary"
                  size="md"
                  className="w-full"
                  onClick={() =>
                    router.push(`/billing/invoices/create?accountId=${account.id}`)
                  }
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  Generate Invoice
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  className="w-full"
                  onClick={() => router.push(`/billing/invoices?accountId=${account.id}`)}
                  leftIcon={<FileText className="h-4 w-4" />}
                >
                  View All Invoices
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  className="w-full"
                  onClick={() => alert('Export functionality would go here')}
                  leftIcon={<Download className="h-4 w-4" />}
                >
                  Export Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
