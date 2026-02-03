'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, Send } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/xpress/card';

const disputeSchema = z.object({
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(500, 'Reason must be less than 500 characters'),
  details: z.string().optional(),
});

type DisputeFormData = z.infer<typeof disputeSchema>;

export interface DisputeFormProps {
  entityType: 'payout' | 'settlement' | 'deduction';
  entityId: string;
  amount: number;
  onSubmit: (data: DisputeFormData) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

const DisputeForm: React.FC<DisputeFormProps> = ({
  entityType,
  entityId,
  amount,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DisputeFormData>({
    resolver: zodResolver(disputeSchema),
  });

  const formatCurrency = (value: number) => {
    return `₱${value.toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getEntityLabel = () => {
    switch (entityType) {
      case 'payout':
        return 'Payout';
      case 'settlement':
        return 'Settlement';
      case 'deduction':
        return 'Deduction';
      default:
        return 'Entity';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-danger-600" />
          <CardTitle>Dispute {getEntityLabel()}</CardTitle>
        </div>
        <p className="text-sm text-neutral-600 mt-2">
          Submit a dispute for this {entityType} of {formatCurrency(amount)}
        </p>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent>
          <div className="space-y-4">
            {/* Entity Info */}
            <div className="bg-neutral-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-neutral-700">
                  {getEntityLabel()} ID:
                </span>
                <span className="text-sm font-mono text-neutral-900">{entityId}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm font-medium text-neutral-700">Amount:</span>
                <span className="text-sm font-semibold text-neutral-900">
                  {formatCurrency(amount)}
                </span>
              </div>
            </div>

            {/* Reason */}
            <div>
              <label
                htmlFor="reason"
                className="block text-sm font-medium text-neutral-700 mb-2"
              >
                Reason for Dispute <span className="text-danger-600">*</span>
              </label>
              <textarea
                id="reason"
                {...register('reason')}
                rows={3}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-xpress-500 focus:border-xpress-500 text-sm"
                placeholder="Please explain why you are disputing this transaction..."
                disabled={isSubmitting}
              />
              {errors.reason && (
                <p className="mt-1 text-sm text-danger-600">{errors.reason.message}</p>
              )}
            </div>

            {/* Additional Details */}
            <div>
              <label
                htmlFor="details"
                className="block text-sm font-medium text-neutral-700 mb-2"
              >
                Additional Details (Optional)
              </label>
              <textarea
                id="details"
                {...register('details')}
                rows={4}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-xpress-500 focus:border-xpress-500 text-sm"
                placeholder="Provide any additional information that might help resolve this dispute..."
                disabled={isSubmitting}
              />
            </div>

            {/* Warning */}
            <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-warning-900 mb-1">
                    Important Notice
                  </h4>
                  <p className="text-sm text-warning-700">
                    Disputes will be reviewed by our operations team within 24-48 hours.
                    Please provide accurate information to expedite the resolution process.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <div className="flex gap-3 w-full justify-end">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-danger-600 rounded-lg hover:bg-danger-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-danger-500 disabled:opacity-50 flex items-center gap-2 transition-colors"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Dispute</span>
                </>
              )}
            </button>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
};

export default DisputeForm;
