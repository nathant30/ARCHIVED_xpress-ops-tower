'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/xpress/card';
import { Button } from '@/components/xpress/button';
import { InvoiceStatusBadge } from '@/components/billing/InvoiceStatusBadge';
import {
  ArrowLeft,
  Download,
  Mail,
  Printer,
  Check,
  XCircle,
  FileText,
  DollarSign,
  Clock,
  Building2,
} from 'lucide-react';
import { billingApi } from '@/lib/api-client';
import type { Invoice, PaymentHistory, InvoiceActivity } from '@/types/billing';
import { useRouter, useParams } from 'next/navigation';

export default function InvoiceDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [activities, setActivities] = useState<InvoiceActivity[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (invoiceId) {
      fetchInvoiceDetails();
    }
  }, [invoiceId]);

  const fetchInvoiceDetails = async () => {
    try {
      setLoading(true);
      const response = await billingApi.invoices.getById(invoiceId);

      if (response.success && response.data) {
        setInvoice(response.data as Invoice);
        // Mock payment history and activities for now
        setPaymentHistory([]);
        setActivities([]);
      }
    } catch (error) {
      console.error('Failed to fetch invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvoice = async () => {
    try {
      setActionLoading(true);
      await billingApi.invoices.send(invoiceId);
      alert('Invoice sent successfully');
      fetchInvoiceDetails();
    } catch (error) {
      console.error('Failed to send invoice:', error);
      alert('Failed to send invoice');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkPaid = async () => {
    try {
      setActionLoading(true);
      await billingApi.invoices.markPaid(invoiceId, {
        amount: invoice?.totalAmount || 0,
        paymentDate: new Date().toISOString(),
        paymentMethod: 'bank_transfer',
      });
      alert('Invoice marked as paid');
      fetchInvoiceDetails();
    } catch (error) {
      console.error('Failed to mark invoice as paid:', error);
      alert('Failed to mark invoice as paid');
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-PH', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'Asia/Manila',
    }).format(date);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-neutral-200 rounded w-64"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-96 bg-neutral-200 rounded"></div>
            </div>
            <div className="h-64 bg-neutral-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-6">
        <Card variant="outlined" padding="lg">
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">Invoice Not Found</h2>
            <p className="text-neutral-600 mb-6">The invoice you're looking for doesn't exist.</p>
            <Button variant="primary" onClick={() => router.push('/billing/invoices')}>
              Back to Invoices
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
        <div className="flex items-center gap-4">
          <Button
            variant="tertiary"
            size="sm"
            onClick={() => router.push('/billing/invoices')}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Back
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold text-neutral-900">{invoice.invoiceNumber}</h1>
              <InvoiceStatusBadge status={invoice.status} />
            </div>
            <p className="text-neutral-600">{invoice.corporateAccountName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="tertiary"
            size="md"
            onClick={() => window.print()}
            leftIcon={<Printer className="h-4 w-4" />}
          >
            Print
          </Button>
          <Button
            variant="tertiary"
            size="md"
            leftIcon={<Download className="h-4 w-4" />}
          >
            Download PDF
          </Button>
          {invoice.status === 'draft' && (
            <Button
              variant="primary"
              size="md"
              onClick={handleSendInvoice}
              disabled={actionLoading}
              leftIcon={<Mail className="h-4 w-4" />}
            >
              Send Invoice
            </Button>
          )}
          {invoice.status === 'sent' && (
            <Button
              variant="success"
              size="md"
              onClick={handleMarkPaid}
              disabled={actionLoading}
              leftIcon={<Check className="h-4 w-4" />}
            >
              Mark as Paid
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Invoice Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Information */}
          <Card variant="outlined" padding="md">
            <CardHeader className="mb-4">
              <CardTitle>Invoice Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-neutral-600 mb-1">Issue Date</p>
                  <p className="font-medium text-neutral-900">{formatDate(invoice.issueDate)}</p>
                </div>
                <div>
                  <p className="text-neutral-600 mb-1">Due Date</p>
                  <p className="font-medium text-neutral-900">{formatDate(invoice.dueDate)}</p>
                </div>
                <div>
                  <p className="text-neutral-600 mb-1">Billing Period</p>
                  <p className="font-medium text-neutral-900">
                    {formatDate(invoice.billingPeriodStart)} - {formatDate(invoice.billingPeriodEnd)}
                  </p>
                </div>
                {invoice.paidDate && (
                  <div>
                    <p className="text-neutral-600 mb-1">Paid Date</p>
                    <p className="font-medium text-neutral-900">{formatDate(invoice.paidDate)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card variant="outlined" padding="none">
            <CardHeader className="p-6 pb-4">
              <CardTitle>Line Items</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-50 border-y border-neutral-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-neutral-700">
                        Description
                      </th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-neutral-700">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-neutral-700">
                        Unit Price
                      </th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-neutral-700">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {invoice.lineItems.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-neutral-900">{item.description}</p>
                            {item.category && (
                              <p className="text-xs text-neutral-500 mt-1 capitalize">
                                {item.category}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right text-neutral-700">{item.quantity}</td>
                        <td className="px-6 py-4 text-right text-neutral-700">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-neutral-900">
                          {formatCurrency(item.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="border-t border-neutral-200 p-6 bg-neutral-50">
                <div className="max-w-sm ml-auto space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-600">Subtotal</span>
                    <span className="font-medium text-neutral-900">
                      {formatCurrency(invoice.subtotal)}
                    </span>
                  </div>
                  {invoice.discountAmount > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-600">Discount</span>
                      <span className="font-medium text-success-600">
                        -{formatCurrency(invoice.discountAmount)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-600">Tax</span>
                    <span className="font-medium text-neutral-900">
                      {formatCurrency(invoice.taxAmount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-lg font-bold pt-2 border-t border-neutral-300">
                    <span className="text-neutral-900">Total</span>
                    <span className="text-neutral-900">{formatCurrency(invoice.totalAmount)}</span>
                  </div>
                  {invoice.amountPaid > 0 && (
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-neutral-600">Amount Paid</span>
                        <span className="font-medium text-success-600">
                          -{formatCurrency(invoice.amountPaid)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-lg font-bold text-danger-600">
                        <span>Amount Due</span>
                        <span>{formatCurrency(invoice.amountDue)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment History */}
          {paymentHistory.length > 0 && (
            <Card variant="outlined" padding="md">
              <CardHeader className="mb-4">
                <CardTitle>Payment History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {paymentHistory.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                      <div>
                        <p className="font-medium text-neutral-900">{formatCurrency(payment.amount)}</p>
                        <p className="text-sm text-neutral-600">{formatDate(payment.paymentDate)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-neutral-600 capitalize">{payment.paymentMethod}</p>
                        {payment.referenceNumber && (
                          <p className="text-xs text-neutral-500">Ref: {payment.referenceNumber}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card variant="outlined" padding="md">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-xpress-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-xpress-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-neutral-600">Total Amount</p>
                  <p className="text-lg font-bold text-neutral-900">
                    {formatCurrency(invoice.totalAmount)}
                  </p>
                </div>
              </div>

              {invoice.amountDue > 0 && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-danger-100 rounded-lg">
                    <Clock className="h-5 w-5 text-danger-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-neutral-600">Amount Due</p>
                    <p className="text-lg font-bold text-danger-600">
                      {formatCurrency(invoice.amountDue)}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="p-2 bg-neutral-100 rounded-lg">
                  <Building2 className="h-5 w-5 text-neutral-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-neutral-600">Account</p>
                  <p className="text-sm font-medium text-neutral-900">
                    {invoice.corporateAccountName}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Activity Timeline */}
          <Card variant="outlined" padding="md">
            <CardHeader className="mb-4">
              <CardTitle className="text-base">Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <p className="text-sm text-neutral-600">No activity recorded yet</p>
              ) : (
                <div className="space-y-3">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex gap-3">
                      <div className="w-2 h-2 mt-1.5 bg-xpress-500 rounded-full flex-shrink-0"></div>
                      <div className="flex-1">
                        <p className="text-sm text-neutral-900">{activity.description}</p>
                        <p className="text-xs text-neutral-500 mt-1">
                          {formatDate(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {invoice.notes && (
            <Card variant="outlined" padding="md">
              <CardHeader className="mb-3">
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-700 whitespace-pre-wrap">{invoice.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
