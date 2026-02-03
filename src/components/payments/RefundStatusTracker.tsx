'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/xpress/card';
import { Badge } from '@/components/xpress/badge';
import { CheckCircle, Circle, XCircle, Clock } from 'lucide-react';
import type { Refund, RefundStatus } from '@/types/payment';
import { format } from 'date-fns';

interface RefundStatusTrackerProps {
  refund: Refund;
}

const getStatusIcon = (status: RefundStatus, currentStatus: RefundStatus) => {
  const statusOrder = ['pending', 'approved', 'processed'];
  const currentIndex = statusOrder.indexOf(currentStatus);
  const stepIndex = statusOrder.indexOf(status);

  if (currentStatus === 'rejected' && status === 'approved') {
    return <XCircle className="h-6 w-6 text-danger-600" />;
  }

  if (currentStatus === 'failed' && status === 'processed') {
    return <XCircle className="h-6 w-6 text-danger-600" />;
  }

  if (stepIndex < currentIndex || (stepIndex === currentIndex && currentStatus !== 'pending')) {
    return <CheckCircle className="h-6 w-6 text-success-600" />;
  }

  if (stepIndex === currentIndex) {
    return <Clock className="h-6 w-6 text-warning-600" />;
  }

  return <Circle className="h-6 w-6 text-neutral-300" />;
};

const getStatusBadge = (status: RefundStatus) => {
  switch (status) {
    case 'pending':
      return <Badge variant="warning">Pending</Badge>;
    case 'approved':
      return <Badge variant="info">Approved</Badge>;
    case 'rejected':
      return <Badge variant="danger">Rejected</Badge>;
    case 'processed':
      return <Badge variant="success">Processed</Badge>;
    case 'failed':
      return <Badge variant="danger">Failed</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const formatAmount = (value: number, currency: string = 'PHP') => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency,
  }).format(value);
};

export const RefundStatusTracker: React.FC<RefundStatusTrackerProps> = ({ refund }) => {
  const steps = [
    {
      status: 'pending' as RefundStatus,
      label: 'Request Submitted',
      timestamp: refund.createdAt,
    },
    {
      status: 'approved' as RefundStatus,
      label: 'Approved',
      timestamp: refund.approvedAt,
      approver: refund.approvedBy,
    },
    {
      status: 'processed' as RefundStatus,
      label: 'Refund Processed',
      timestamp: refund.processedAt,
      processor: refund.processedBy,
    },
  ];

  return (
    <Card variant="outlined">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Refund Status</CardTitle>
            <p className="text-sm text-neutral-600 mt-1">
              Track the progress of your refund request
            </p>
          </div>
          {getStatusBadge(refund.status)}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          <div className="bg-neutral-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-600">Refund ID</span>
              <span className="text-sm font-mono text-neutral-900">{refund.refundId}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-600">Amount</span>
              <span className="text-lg font-semibold text-neutral-900">
                {formatAmount(refund.amount, refund.currency)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-600">Reason</span>
              <span className="text-sm text-neutral-900">{refund.reason}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-600">Transaction ID</span>
              <span className="text-sm font-mono text-neutral-900">
                {refund.transactionId}
              </span>
            </div>
          </div>

          <div className="relative">
            {steps.map((step, index) => {
              const isLast = index === steps.length - 1;
              const isActive =
                refund.status === step.status ||
                (refund.status === 'rejected' && step.status === 'approved') ||
                (refund.status === 'failed' && step.status === 'processed');

              return (
                <div key={step.status} className="relative">
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className="flex-shrink-0">
                        {getStatusIcon(step.status, refund.status)}
                      </div>
                      {!isLast && (
                        <div className="w-0.5 h-16 bg-neutral-200 my-2" />
                      )}
                    </div>

                    <div className="flex-1 pb-8">
                      <h4 className="text-sm font-medium text-neutral-900 mb-1">
                        {step.label}
                      </h4>

                      {step.timestamp && (
                        <p className="text-xs text-neutral-600">
                          {format(new Date(step.timestamp), 'MMM dd, yyyy hh:mm a')}
                        </p>
                      )}

                      {step.approver && (
                        <p className="text-xs text-neutral-600 mt-1">
                          Approved by: {step.approver}
                        </p>
                      )}

                      {step.processor && (
                        <p className="text-xs text-neutral-600 mt-1">
                          Processed by: {step.processor}
                        </p>
                      )}

                      {isActive && refund.status === 'rejected' && refund.rejectionReason && (
                        <div className="mt-2 bg-danger-50 border border-danger-200 rounded-lg p-3">
                          <p className="text-xs font-medium text-danger-900 mb-1">
                            Rejection Reason
                          </p>
                          <p className="text-xs text-danger-700">{refund.rejectionReason}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {refund.status === 'pending' && (
            <div className="bg-info-50 border border-info-200 rounded-lg p-4">
              <p className="text-sm text-info-800">
                Your refund request is being reviewed. This usually takes 1-3 business days.
              </p>
            </div>
          )}

          {refund.status === 'approved' && (
            <div className="bg-success-50 border border-success-200 rounded-lg p-4">
              <p className="text-sm text-success-800">
                Your refund has been approved and will be processed within 5-7 business days.
              </p>
            </div>
          )}

          {refund.status === 'processed' && (
            <div className="bg-success-50 border border-success-200 rounded-lg p-4">
              <p className="text-sm text-success-800">
                Your refund has been processed successfully. The amount should appear in your
                account within 1-3 business days.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
