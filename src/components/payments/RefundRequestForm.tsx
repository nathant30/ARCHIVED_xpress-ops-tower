'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/xpress/card';
import { Button } from '@/components/xpress/button';
import { AlertCircle } from 'lucide-react';

const refundSchema = z.object({
  transactionId: z.string().min(1, 'Transaction ID is required'),
  amount: z.number().positive('Amount must be positive'),
  reason: z.enum([
    'duplicate_payment',
    'service_not_received',
    'incorrect_amount',
    'customer_request',
    'fraud',
    'other',
  ]),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  attachments: z.array(z.string()).optional(),
});

type RefundFormData = z.infer<typeof refundSchema>;

interface RefundRequestFormProps {
  transactionId?: string;
  maxAmount?: number;
  onSubmit: (data: RefundFormData) => Promise<void>;
}

const refundReasons = [
  { value: 'duplicate_payment', label: 'Duplicate Payment' },
  { value: 'service_not_received', label: 'Service Not Received' },
  { value: 'incorrect_amount', label: 'Incorrect Amount' },
  { value: 'customer_request', label: 'Customer Request' },
  { value: 'fraud', label: 'Fraud' },
  { value: 'other', label: 'Other' },
];

export const RefundRequestForm: React.FC<RefundRequestFormProps> = ({
  transactionId = '',
  maxAmount,
  onSubmit,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RefundFormData>({
    resolver: zodResolver(refundSchema),
    defaultValues: {
      transactionId,
      amount: maxAmount || 0,
      reason: 'customer_request',
      description: '',
    },
  });

  const selectedReason = watch('reason');

  const handleFormSubmit = async (data: RefundFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await onSubmit(data);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Failed to submit refund request'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card variant="outlined">
      <CardHeader>
        <CardTitle>Request Refund</CardTitle>
        <p className="text-sm text-neutral-600 mt-1">
          Fill out the form below to request a refund for a transaction
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {submitError && (
            <div className="bg-danger-50 border border-danger-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-danger-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-danger-900 mb-1">
                  Failed to Submit Request
                </h4>
                <p className="text-sm text-danger-700">{submitError}</p>
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="transactionId"
              className="block text-sm font-medium text-neutral-700 mb-2"
            >
              Transaction ID
            </label>
            <input
              {...register('transactionId')}
              id="transactionId"
              type="text"
              placeholder="TXN-XXXXXXXX"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-xpress-500 focus:border-transparent font-mono"
              disabled={!!transactionId}
            />
            {errors.transactionId && (
              <p className="mt-1 text-sm text-danger-600">{errors.transactionId.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-neutral-700 mb-2">
              Refund Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-neutral-500">₱</span>
              <input
                {...register('amount', { valueAsNumber: true })}
                id="amount"
                type="number"
                step="0.01"
                min="0"
                max={maxAmount}
                placeholder="0.00"
                className="w-full pl-8 pr-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-xpress-500 focus:border-transparent"
              />
            </div>
            {maxAmount && (
              <p className="mt-1 text-xs text-neutral-600">
                Maximum refund amount: ₱{maxAmount.toFixed(2)}
              </p>
            )}
            {errors.amount && (
              <p className="mt-1 text-sm text-danger-600">{errors.amount.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-neutral-700 mb-2">
              Refund Reason
            </label>
            <select
              {...register('reason')}
              id="reason"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-xpress-500 focus:border-transparent"
            >
              {refundReasons.map((reason) => (
                <option key={reason.value} value={reason.value}>
                  {reason.label}
                </option>
              ))}
            </select>
            {errors.reason && (
              <p className="mt-1 text-sm text-danger-600">{errors.reason.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-neutral-700 mb-2"
            >
              Description
            </label>
            <textarea
              {...register('description')}
              id="description"
              rows={4}
              placeholder="Provide details about why you're requesting a refund..."
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-xpress-500 focus:border-transparent resize-none"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-danger-600">{errors.description.message}</p>
            )}
          </div>

          {selectedReason === 'fraud' && (
            <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-warning-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-warning-900 mb-1">
                    Fraud Alert
                  </h4>
                  <p className="text-sm text-warning-700">
                    This refund request will be flagged for immediate review by the fraud team.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-4">
            <Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
              Submit Refund Request
            </Button>
            <Button type="button" variant="secondary" disabled={isSubmitting}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
