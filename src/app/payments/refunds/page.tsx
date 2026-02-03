'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/xpress/card';
import { Badge } from '@/components/xpress/badge';
import { Button } from '@/components/xpress/button';
import { RefundRequestForm } from '@/components/payments/RefundRequestForm';
import { RefundStatusTracker } from '@/components/payments/RefundStatusTracker';
import { Eye } from 'lucide-react';
import type { Refund } from '@/types/payment';
import { format } from 'date-fns';

const mockRefunds: Refund[] = [
  {
    id: '1',
    refundId: 'RFN-2024-001',
    transactionId: 'TXN-2024-001',
    amount: 1500,
    currency: 'PHP',
    reason: 'Customer requested cancellation',
    status: 'processed',
    requestedBy: 'user123',
    approvedBy: 'admin456',
    processedBy: 'system',
    createdAt: new Date('2024-01-10T10:00:00').toISOString(),
    approvedAt: new Date('2024-01-11T09:00:00').toISOString(),
    processedAt: new Date('2024-01-12T14:30:00').toISOString(),
  },
  {
    id: '2',
    refundId: 'RFN-2024-002',
    transactionId: 'TXN-2024-002',
    amount: 2300,
    currency: 'PHP',
    reason: 'Duplicate payment',
    status: 'approved',
    requestedBy: 'user456',
    approvedBy: 'admin789',
    createdAt: new Date('2024-01-14T11:00:00').toISOString(),
    approvedAt: new Date('2024-01-14T15:00:00').toISOString(),
  },
  {
    id: '3',
    refundId: 'RFN-2024-003',
    transactionId: 'TXN-2024-003',
    amount: 890,
    currency: 'PHP',
    reason: 'Service not provided',
    status: 'pending',
    requestedBy: 'user789',
    createdAt: new Date('2024-01-15T08:00:00').toISOString(),
  },
];

const RefundsPage = () => {
  const [refunds] = useState<Refund[]>(mockRefunds);
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
  const [showTracker, setShowTracker] = useState(false);

  const handleSubmitRefund = async (data: unknown) => {
    console.log('Submitting refund request:', data);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  };

  const handleViewRefund = (refund: Refund) => {
    setSelectedRefund(refund);
    setShowTracker(true);
  };

  const getStatusBadge = (status: string) => {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Refund Processing</h1>
        <p className="text-sm text-neutral-600 mt-1">
          Request and track payment refunds
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <RefundRequestForm onSubmit={handleSubmitRefund} />

          <Card variant="outlined">
            <CardHeader>
              <CardTitle>Refund History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {refunds.length === 0 ? (
                  <p className="text-center text-neutral-600 py-8">No refunds found</p>
                ) : (
                  refunds.map((refund) => (
                    <div
                      key={refund.id}
                      className="border border-neutral-200 rounded-lg p-4 hover:border-neutral-300 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-mono font-semibold text-neutral-900">
                              {refund.refundId}
                            </span>
                            {getStatusBadge(refund.status)}
                          </div>
                          <p className="text-xs text-neutral-600 font-mono">
                            Transaction: {refund.transactionId}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-neutral-900">
                            {formatAmount(refund.amount, refund.currency)}
                          </div>
                          <Button
                            variant="tertiary"
                            size="sm"
                            onClick={() => handleViewRefund(refund)}
                            leftIcon={<Eye className="h-4 w-4" />}
                            className="mt-1"
                          >
                            Track
                          </Button>
                        </div>
                      </div>

                      <div className="bg-neutral-50 rounded-lg p-3 space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-neutral-600">Reason</span>
                          <span className="text-neutral-900">{refund.reason}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-neutral-600">Requested</span>
                          <span className="text-neutral-900">
                            {format(new Date(refund.createdAt), 'MMM dd, yyyy hh:mm a')}
                          </span>
                        </div>
                        {refund.approvedAt && (
                          <div className="flex justify-between text-xs">
                            <span className="text-neutral-600">Approved</span>
                            <span className="text-neutral-900">
                              {format(new Date(refund.approvedAt), 'MMM dd, yyyy hh:mm a')}
                            </span>
                          </div>
                        )}
                        {refund.processedAt && (
                          <div className="flex justify-between text-xs">
                            <span className="text-neutral-600">Processed</span>
                            <span className="text-neutral-900">
                              {format(new Date(refund.processedAt), 'MMM dd, yyyy hh:mm a')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          {showTracker && selectedRefund ? (
            <RefundStatusTracker refund={selectedRefund} />
          ) : (
            <Card variant="outlined">
              <CardContent className="text-center py-12">
                <p className="text-neutral-600 mb-2">No refund selected</p>
                <p className="text-sm text-neutral-500">
                  Click &quot;Track&quot; on a refund to view its status
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default RefundsPage;
