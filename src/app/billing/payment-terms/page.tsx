'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/xpress/card';
import { Button } from '@/components/xpress/button';
import { Badge } from '@/components/xpress/badge';
import {
  Plus,
  Edit,
  Trash2,
  Star,
  Calendar,
  DollarSign,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';
import { billingApi } from '@/lib/api-client';
import type { PaymentTerms, PaginatedPaymentTerms } from '@/types/billing';

export default function PaymentTermsPage() {
  const [loading, setLoading] = useState(true);
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerms[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTerm, setEditingTerm] = useState<PaymentTerms | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    dueDays: 30,
    gracePeriodDays: 7,
    lateFeeType: 'percentage' as 'percentage' | 'fixed',
    lateFeeAmount: 5,
    lateFeeCapPercentage: 10,
    earlyPaymentDiscountDays: 0,
    earlyPaymentDiscountPercentage: 0,
    isDefault: false,
  });

  useEffect(() => {
    fetchPaymentTerms();
  }, []);

  const fetchPaymentTerms = async () => {
    try {
      setLoading(true);
      const response = await billingApi.paymentTerms.getAll({ limit: 100 });

      if (response.success && response.data) {
        const data = response.data as PaginatedPaymentTerms;
        setPaymentTerms(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch payment terms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingTerm) {
        // Update existing term
        await billingApi.paymentTerms.update(editingTerm.id, formData);
        alert('Payment terms updated successfully!');
      } else {
        // Create new term
        await billingApi.paymentTerms.create(formData);
        alert('Payment terms created successfully!');
      }

      setShowCreateModal(false);
      setEditingTerm(null);
      resetForm();
      fetchPaymentTerms();
    } catch (error) {
      console.error('Failed to save payment terms:', error);
      alert('Failed to save payment terms. Please try again.');
    }
  };

  const handleEdit = (term: PaymentTerms) => {
    setEditingTerm(term);
    setFormData({
      name: term.name,
      description: term.description || '',
      dueDays: term.dueDays,
      gracePeriodDays: term.gracePeriodDays,
      lateFeeType: term.lateFeeType,
      lateFeeAmount: term.lateFeeAmount,
      lateFeeCapPercentage: term.lateFeeCapPercentage || 0,
      earlyPaymentDiscountDays: term.earlyPaymentDiscountDays || 0,
      earlyPaymentDiscountPercentage: term.earlyPaymentDiscountPercentage || 0,
      isDefault: term.isDefault,
    });
    setShowCreateModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete these payment terms?')) return;

    try {
      await billingApi.paymentTerms.delete(id);
      alert('Payment terms deleted successfully!');
      fetchPaymentTerms();
    } catch (error) {
      console.error('Failed to delete payment terms:', error);
      alert('Failed to delete payment terms. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      dueDays: 30,
      gracePeriodDays: 7,
      lateFeeType: 'percentage',
      lateFeeAmount: 5,
      lateFeeCapPercentage: 10,
      earlyPaymentDiscountDays: 0,
      earlyPaymentDiscountPercentage: 0,
      isDefault: false,
    });
  };

  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Payment Terms</h1>
          <p className="text-neutral-600 mt-1">
            Manage payment terms templates for corporate accounts
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => {
            setEditingTerm(null);
            resetForm();
            setShowCreateModal(true);
          }}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          New Payment Terms
        </Button>
      </div>

      {/* Payment Terms Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} variant="outlined" padding="md" className="animate-pulse">
              <div className="space-y-3">
                <div className="h-6 bg-neutral-200 rounded w-3/4"></div>
                <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
                <div className="h-24 bg-neutral-200 rounded"></div>
              </div>
            </Card>
          ))}
        </div>
      ) : paymentTerms.length === 0 ? (
        <Card variant="outlined" padding="lg">
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              No payment terms created yet
            </h3>
            <p className="text-neutral-600 mb-4">
              Get started by creating your first payment terms template.
            </p>
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setEditingTerm(null);
                resetForm();
                setShowCreateModal(true);
              }}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Create Payment Terms
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paymentTerms.map((term) => (
            <Card
              key={term.id}
              variant="outlined"
              padding="md"
              className="hover:shadow-md transition-shadow"
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-neutral-900">{term.name}</h3>
                      {term.isDefault && (
                        <Badge variant="primary" size="sm" leftIcon={<Star className="h-3 w-3" />}>
                          Default
                        </Badge>
                      )}
                    </div>
                    {term.description && (
                      <p className="text-sm text-neutral-600">{term.description}</p>
                    )}
                  </div>
                  {!term.isActive && (
                    <Badge variant="secondary" size="sm">
                      Inactive
                    </Badge>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-3 pt-3 border-t border-neutral-200">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-neutral-500" />
                    <span className="text-neutral-600">Due in:</span>
                    <span className="font-semibold text-neutral-900">
                      {term.dueDays} days (Net {term.dueDays})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-neutral-500" />
                    <span className="text-neutral-600">Grace period:</span>
                    <span className="font-semibold text-neutral-900">
                      {term.gracePeriodDays} days
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-neutral-500" />
                    <span className="text-neutral-600">Late fee:</span>
                    <span className="font-semibold text-danger-600">
                      {term.lateFeeType === 'percentage'
                        ? `${term.lateFeeAmount}%`
                        : formatCurrency(term.lateFeeAmount)}
                    </span>
                  </div>

                  {term.lateFeeCapPercentage && term.lateFeeCapPercentage > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-neutral-600 ml-6">Cap:</span>
                      <span className="font-medium text-neutral-900">
                        {term.lateFeeCapPercentage}% of invoice
                      </span>
                    </div>
                  )}

                  {term.earlyPaymentDiscountPercentage &&
                    term.earlyPaymentDiscountPercentage > 0 && (
                      <>
                        <div className="pt-2 border-t border-neutral-200"></div>
                        <div className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-success-500" />
                          <span className="text-neutral-600">Early payment discount:</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm ml-6">
                          <span className="font-semibold text-success-600">
                            {term.earlyPaymentDiscountPercentage}%
                          </span>
                          <span className="text-neutral-600">
                            if paid within {term.earlyPaymentDiscountDays} days
                          </span>
                        </div>
                      </>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-neutral-200">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleEdit(term)}
                    leftIcon={<Edit className="h-4 w-4" />}
                    className="flex-1"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="tertiary"
                    size="sm"
                    onClick={() => handleDelete(term.id)}
                    disabled={term.isDefault}
                    className="flex-1"
                  >
                    <Trash2 className="h-4 w-4 text-danger-600" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card variant="elevated" padding="none" className="max-w-2xl w-full max-h-[90vh] overflow-auto">
            <form onSubmit={handleSubmit}>
              <CardHeader className="p-6 pb-4 border-b border-neutral-200">
                <CardTitle>
                  {editingTerm ? 'Edit Payment Terms' : 'Create Payment Terms'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Net 30"
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-xpress-500"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Optional description..."
                      rows={2}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-xpress-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Due Days *
                    </label>
                    <input
                      type="number"
                      value={formData.dueDays}
                      onChange={(e) =>
                        setFormData({ ...formData, dueDays: parseInt(e.target.value) || 0 })
                      }
                      min="0"
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-xpress-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Grace Period (Days) *
                    </label>
                    <input
                      type="number"
                      value={formData.gracePeriodDays}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          gracePeriodDays: parseInt(e.target.value) || 0,
                        })
                      }
                      min="0"
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-xpress-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Late Fee Type *
                    </label>
                    <select
                      value={formData.lateFeeType}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          lateFeeType: e.target.value as 'percentage' | 'fixed',
                        })
                      }
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-xpress-500"
                      required
                    >
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed Amount</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Late Fee Amount * {formData.lateFeeType === 'percentage' ? '(%)' : '(₱)'}
                    </label>
                    <input
                      type="number"
                      value={formData.lateFeeAmount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          lateFeeAmount: parseFloat(e.target.value) || 0,
                        })
                      }
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-xpress-500"
                      required
                    />
                  </div>

                  {formData.lateFeeType === 'percentage' && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Late Fee Cap (% of invoice)
                      </label>
                      <input
                        type="number"
                        value={formData.lateFeeCapPercentage}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            lateFeeCapPercentage: parseFloat(e.target.value) || 0,
                          })
                        }
                        min="0"
                        max="100"
                        step="0.01"
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-xpress-500"
                      />
                    </div>
                  )}

                  <div className="md:col-span-2 pt-4 border-t border-neutral-200">
                    <h4 className="font-medium text-neutral-900 mb-3">
                      Early Payment Discount (Optional)
                    </h4>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Discount Days
                    </label>
                    <input
                      type="number"
                      value={formData.earlyPaymentDiscountDays}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          earlyPaymentDiscountDays: parseInt(e.target.value) || 0,
                        })
                      }
                      min="0"
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-xpress-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Discount Percentage (%)
                    </label>
                    <input
                      type="number"
                      value={formData.earlyPaymentDiscountPercentage}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          earlyPaymentDiscountPercentage: parseFloat(e.target.value) || 0,
                        })
                      }
                      min="0"
                      max="100"
                      step="0.01"
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-xpress-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.isDefault}
                        onChange={(e) =>
                          setFormData({ ...formData, isDefault: e.target.checked })
                        }
                        className="rounded border-neutral-300 text-xpress-600 focus:ring-xpress-500"
                      />
                      <span className="text-sm font-medium text-neutral-700">
                        Set as default payment terms
                      </span>
                    </label>
                  </div>
                </div>
              </CardContent>
              <div className="p-6 pt-4 border-t border-neutral-200 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="tertiary"
                  size="md"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingTerm(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="md">
                  {editingTerm ? 'Update' : 'Create'} Payment Terms
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
