'use client';

import React from 'react';
import { Modal, ModalFooter } from '@/components/ui/modal';
import { Badge } from '@/components/xpress/badge';
import { Button } from '@/components/xpress/button';
import { Copy, Download } from 'lucide-react';
import type { Transaction, PaymentStatus } from '@/types/payment';
import { format } from 'date-fns';

interface TransactionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

const getStatusBadge = (status: PaymentStatus) => {
  switch (status) {
    case 'completed':
      return <Badge variant="success">Completed</Badge>;
    case 'pending':
      return <Badge variant="warning">Pending</Badge>;
    case 'processing':
      return <Badge variant="info">Processing</Badge>;
    case 'failed':
      return <Badge variant="danger">Failed</Badge>;
    case 'refunded':
      return <Badge variant="secondary">Refunded</Badge>;
    case 'cancelled':
      return <Badge variant="secondary">Cancelled</Badge>;
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

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
};

export const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({
  isOpen,
  onClose,
  transaction,
}) => {
  if (!transaction) return null;

  const handleDownloadReceipt = () => {
    console.log('Download receipt for transaction:', transaction.id);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Transaction Details"
      size="lg"
    >
      <div className="space-y-6">
        <div className="flex items-start justify-between pb-4 border-b border-neutral-200">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-2xl font-semibold text-neutral-900">
                {formatAmount(transaction.amount, transaction.currency)}
              </h3>
              {getStatusBadge(transaction.status)}
            </div>
            <p className="text-sm text-neutral-600">{transaction.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <h4 className="text-xs font-medium text-neutral-500 uppercase mb-2">
              Transaction ID
            </h4>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-neutral-900">
                {transaction.transactionId}
              </span>
              <button
                onClick={() => copyToClipboard(transaction.transactionId)}
                className="text-neutral-500 hover:text-neutral-700"
                title="Copy to clipboard"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-medium text-neutral-500 uppercase mb-2">
              Reference Number
            </h4>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-neutral-900">
                {transaction.referenceNumber}
              </span>
              <button
                onClick={() => copyToClipboard(transaction.referenceNumber)}
                className="text-neutral-500 hover:text-neutral-700"
                title="Copy to clipboard"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-medium text-neutral-500 uppercase mb-2">
              Payment Method
            </h4>
            <span className="text-sm text-neutral-900 capitalize">
              {transaction.paymentMethod}
            </span>
          </div>

          <div>
            <h4 className="text-xs font-medium text-neutral-500 uppercase mb-2">
              User ID
            </h4>
            <span className="text-sm font-mono text-neutral-900">
              {transaction.userId}
            </span>
          </div>

          {transaction.bookingId && (
            <div>
              <h4 className="text-xs font-medium text-neutral-500 uppercase mb-2">
                Booking ID
              </h4>
              <span className="text-sm font-mono text-neutral-900">
                {transaction.bookingId}
              </span>
            </div>
          )}

          <div>
            <h4 className="text-xs font-medium text-neutral-500 uppercase mb-2">
              Created At
            </h4>
            <span className="text-sm text-neutral-900">
              {format(new Date(transaction.createdAt), 'MMM dd, yyyy hh:mm a')}
            </span>
          </div>

          {transaction.completedAt && (
            <div>
              <h4 className="text-xs font-medium text-neutral-500 uppercase mb-2">
                Completed At
              </h4>
              <span className="text-sm text-neutral-900">
                {format(new Date(transaction.completedAt), 'MMM dd, yyyy hh:mm a')}
              </span>
            </div>
          )}

          {transaction.failureReason && (
            <div className="col-span-2">
              <h4 className="text-xs font-medium text-neutral-500 uppercase mb-2">
                Failure Reason
              </h4>
              <div className="bg-danger-50 border border-danger-200 rounded-lg p-3">
                <p className="text-sm text-danger-800">{transaction.failureReason}</p>
              </div>
            </div>
          )}
        </div>

        {transaction.metadata && Object.keys(transaction.metadata).length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-neutral-500 uppercase mb-2">
              Additional Information
            </h4>
            <div className="bg-neutral-50 rounded-lg p-4">
              <pre className="text-xs text-neutral-700 overflow-x-auto">
                {JSON.stringify(transaction.metadata, null, 2)}
              </pre>
            </div>
          </div>
        )}

        <ModalFooter>
          <Button
            variant="secondary"
            onClick={handleDownloadReceipt}
            leftIcon={<Download className="h-4 w-4" />}
          >
            Download Receipt
          </Button>
          <Button onClick={onClose}>Close</Button>
        </ModalFooter>
      </div>
    </Modal>
  );
};
