'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/xpress/card';
import { Button } from '@/components/xpress/button';
import { Badge } from '@/components/xpress/badge';
import {
  Plus,
  Trash2,
  Save,
  Eye,
  ArrowLeft,
  Calculator,
  Building2,
  Calendar,
  FileText,
} from 'lucide-react';
import { billingApi } from '@/lib/api-client';
import type { CorporateAccount, InvoiceLineItem, CreateInvoiceRequest } from '@/types/billing';
import { useRouter } from 'next/navigation';

interface LineItemInput extends Omit<InvoiceLineItem, 'id' | 'amount' | 'taxAmount'> {
  id?: string;
}

export default function CreateInvoicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<CorporateAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  // Form state
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [billingPeriodStart, setBillingPeriodStart] = useState('');
  const [billingPeriodEnd, setBillingPeriodEnd] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [lineItems, setLineItems] = useState<LineItemInput[]>([
    {
      description: '',
      quantity: 1,
      unitPrice: 0,
      taxRate: 12, // Default 12% VAT in Philippines
      category: 'ride',
    },
  ]);

  // Preview state
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchAccounts();
    setDefaultDates();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoadingAccounts(true);
      const response = await billingApi.accounts.getAll({
        status: ['active'],
        limit: 100,
      });

      if (response.success && response.data) {
        setAccounts(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const setDefaultDates = () => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const dueDateDefault = new Date(now.getFullYear(), now.getMonth() + 1, 15); // 15th of next month

    setBillingPeriodStart(firstDayOfMonth.toISOString().split('T')[0]);
    setBillingPeriodEnd(lastDayOfMonth.toISOString().split('T')[0]);
    setDueDate(dueDateDefault.toISOString().split('T')[0]);
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        description: '',
        quantity: 1,
        unitPrice: 0,
        taxRate: 12,
        category: 'ride',
      },
    ]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const updateLineItem = (index: number, field: keyof LineItemInput, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  const calculateLineItemTotal = (item: LineItemInput) => {
    const amount = item.quantity * item.unitPrice;
    const taxAmount = amount * (item.taxRate / 100);
    return { amount, taxAmount, total: amount + taxAmount };
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let totalTax = 0;

    lineItems.forEach((item) => {
      const { amount, taxAmount } = calculateLineItemTotal(item);
      subtotal += amount;
      totalTax += taxAmount;
    });

    const total = subtotal + totalTax;

    return {
      subtotal,
      taxAmount: totalTax,
      discountAmount: 0,
      totalAmount: total,
    };
  };

  const handleSubmit = async (asDraft: boolean = false) => {
    // Validate form
    if (!selectedAccountId) {
      alert('Please select a corporate account');
      return;
    }

    if (!billingPeriodStart || !billingPeriodEnd || !dueDate) {
      alert('Please fill in all date fields');
      return;
    }

    if (lineItems.some((item) => !item.description || item.unitPrice <= 0)) {
      alert('Please complete all line items');
      return;
    }

    try {
      setLoading(true);

      const invoiceData: CreateInvoiceRequest = {
        corporateAccountId: selectedAccountId,
        billingPeriodStart,
        billingPeriodEnd,
        dueDate,
        lineItems: lineItems.map((item) => {
          const { amount, taxAmount } = calculateLineItemTotal(item);
          return {
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount,
            taxRate: item.taxRate,
            taxAmount,
            category: item.category,
            tripId: item.tripId,
            metadata: item.metadata,
          };
        }),
        notes: notes || undefined,
      };

      const response = await billingApi.invoices.create(invoiceData);

      if (response.success && response.data) {
        alert(`Invoice ${asDraft ? 'saved as draft' : 'created'} successfully!`);
        router.push(`/billing/invoices/${response.data.id}`);
      }
    } catch (error) {
      console.error('Failed to create invoice:', error);
      alert('Failed to create invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'Asia/Manila',
    }).format(date);
  };

  const totals = calculateTotals();
  const selectedAccount = accounts.find((acc) => acc.id === selectedAccountId);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="tertiary"
            size="md"
            onClick={() => router.push('/billing/invoices')}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Generate Invoice</h1>
            <p className="text-neutral-600 mt-1">Create new invoice for corporate account</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="md"
            onClick={() => setShowPreview(!showPreview)}
            leftIcon={<Eye className="h-4 w-4" />}
          >
            {showPreview ? 'Hide' : 'Show'} Preview
          </Button>
          <Button
            variant="tertiary"
            size="md"
            onClick={() => handleSubmit(true)}
            disabled={loading}
            leftIcon={<Save className="h-4 w-4" />}
          >
            Save as Draft
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => handleSubmit(false)}
            disabled={loading}
            leftIcon={<FileText className="h-4 w-4" />}
          >
            {loading ? 'Creating...' : 'Generate Invoice'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Account Selection */}
          <Card variant="outlined" padding="md">
            <CardHeader className="mb-4">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Corporate Account
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Select Account *
                  </label>
                  {loadingAccounts ? (
                    <div className="animate-pulse h-10 bg-neutral-200 rounded-lg"></div>
                  ) : (
                    <select
                      value={selectedAccountId}
                      onChange={(e) => setSelectedAccountId(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-xpress-500"
                      required
                    >
                      <option value="">Select an account...</option>
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.companyName} - {account.accountNumber || account.id}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {selectedAccount && (
                  <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-neutral-600">Contact:</span>
                        <span className="ml-2 text-neutral-900 font-medium">
                          {selectedAccount.contactPerson}
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-600">Email:</span>
                        <span className="ml-2 text-neutral-900 font-medium">
                          {selectedAccount.contactEmail}
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-600">Credit Limit:</span>
                        <span className="ml-2 text-neutral-900 font-medium">
                          {formatCurrency(selectedAccount.creditLimit)}
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-600">Outstanding:</span>
                        <span className="ml-2 text-neutral-900 font-medium">
                          {formatCurrency(selectedAccount.outstandingBalance)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Billing Period & Dates */}
          <Card variant="outlined" padding="md">
            <CardHeader className="mb-4">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Billing Period & Due Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Period Start *
                  </label>
                  <input
                    type="date"
                    value={billingPeriodStart}
                    onChange={(e) => setBillingPeriodStart(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-xpress-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Period End *
                  </label>
                  <input
                    type="date"
                    value={billingPeriodEnd}
                    onChange={(e) => setBillingPeriodEnd(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-xpress-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-xpress-500"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card variant="outlined" padding="md">
            <CardHeader className="mb-4">
              <div className="flex items-center justify-between">
                <CardTitle>Line Items</CardTitle>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={addLineItem}
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lineItems.map((item, index) => (
                  <div
                    key={index}
                    className="p-4 border border-neutral-200 rounded-lg space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Description *
                          </label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) =>
                              updateLineItem(index, 'description', e.target.value)
                            }
                            placeholder="e.g., Ride services for January 2026"
                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-xpress-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Category
                          </label>
                          <select
                            value={item.category}
                            onChange={(e) => updateLineItem(index, 'category', e.target.value)}
                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-xpress-500"
                          >
                            <option value="ride">Ride</option>
                            <option value="surcharge">Surcharge</option>
                            <option value="discount">Discount</option>
                            <option value="fee">Fee</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Quantity *
                          </label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)
                            }
                            min="0"
                            step="0.01"
                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-xpress-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Unit Price (₱) *
                          </label>
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) =>
                              updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)
                            }
                            min="0"
                            step="0.01"
                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-xpress-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Tax Rate (%)
                          </label>
                          <input
                            type="number"
                            value={item.taxRate}
                            onChange={(e) =>
                              updateLineItem(index, 'taxRate', parseFloat(e.target.value) || 0)
                            }
                            min="0"
                            max="100"
                            step="0.01"
                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-xpress-500"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Button
                          variant="tertiary"
                          size="sm"
                          onClick={() => removeLineItem(index)}
                          disabled={lineItems.length === 1}
                        >
                          <Trash2 className="h-4 w-4 text-danger-600" />
                        </Button>
                        <div className="text-right">
                          <div className="text-xs text-neutral-600 mb-1">Amount</div>
                          <div className="font-semibold text-neutral-900">
                            {formatCurrency(calculateLineItemTotal(item).total)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card variant="outlined" padding="md">
            <CardHeader className="mb-4">
              <CardTitle>Notes & Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes or payment instructions..."
                rows={4}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-xpress-500 resize-none"
              />
            </CardContent>
          </Card>
        </div>

        {/* Summary & Preview Sidebar */}
        <div className="space-y-6">
          {/* Totals Summary */}
          <Card variant="outlined" padding="md" className="sticky top-6">
            <CardHeader className="mb-4">
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Invoice Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600">Subtotal</span>
                  <span className="font-medium text-neutral-900">
                    {formatCurrency(totals.subtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600">Tax (VAT)</span>
                  <span className="font-medium text-neutral-900">
                    {formatCurrency(totals.taxAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600">Discount</span>
                  <span className="font-medium text-neutral-900">
                    {formatCurrency(totals.discountAmount)}
                  </span>
                </div>
                <div className="pt-3 border-t border-neutral-200">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold text-neutral-900">Total Amount</span>
                    <span className="text-xl font-bold text-xpress-600">
                      {formatCurrency(totals.totalAmount)}
                    </span>
                  </div>
                </div>

                {selectedAccount && (
                  <div className="pt-3 border-t border-neutral-200 space-y-2">
                    <div className="text-xs text-neutral-600">Impact on Account</div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-600">Current Outstanding</span>
                      <span className="font-medium text-neutral-900">
                        {formatCurrency(selectedAccount.outstandingBalance)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-600">New Outstanding</span>
                      <span className="font-bold text-warning-600">
                        {formatCurrency(
                          selectedAccount.outstandingBalance + totals.totalAmount
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-600">Available Credit</span>
                      <span className="font-medium text-neutral-900">
                        {formatCurrency(
                          selectedAccount.creditLimit -
                            selectedAccount.outstandingBalance -
                            totals.totalAmount
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Preview Card */}
          {showPreview && selectedAccount && (
            <Card variant="outlined" padding="md">
              <CardHeader className="mb-4">
                <CardTitle>Invoice Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm">
                  <div>
                    <div className="font-semibold text-neutral-900 mb-1">Bill To:</div>
                    <div className="text-neutral-700">{selectedAccount.companyName}</div>
                    <div className="text-neutral-600">{selectedAccount.contactPerson}</div>
                    <div className="text-neutral-600">{selectedAccount.contactEmail}</div>
                  </div>

                  <div className="pt-3 border-t border-neutral-200">
                    <div className="font-semibold text-neutral-900 mb-2">Billing Period:</div>
                    <div className="text-neutral-700">
                      {formatDate(billingPeriodStart)} - {formatDate(billingPeriodEnd)}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-neutral-200">
                    <div className="font-semibold text-neutral-900 mb-2">Due Date:</div>
                    <div className="text-neutral-700">{formatDate(dueDate)}</div>
                  </div>

                  <div className="pt-3 border-t border-neutral-200">
                    <div className="font-semibold text-neutral-900 mb-2">Line Items:</div>
                    <div className="space-y-2">
                      {lineItems.map((item, index) => (
                        <div key={index} className="text-neutral-700">
                          <div className="font-medium">{item.description || 'Untitled'}</div>
                          <div className="text-xs text-neutral-600">
                            {item.quantity} × {formatCurrency(item.unitPrice)} ={' '}
                            {formatCurrency(calculateLineItemTotal(item).total)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
