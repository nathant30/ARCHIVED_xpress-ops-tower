'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/xpress/card';
import { Button } from '@/components/xpress/button';
import { Badge } from '@/components/xpress/badge';
import { Smartphone, AlertCircle, CheckCircle, Loader2, ExternalLink } from 'lucide-react';
import type { GCashPaymentRequest, PaymentCallback } from '@/types/payment';

interface GCashIntegrationProps {
  amount: number;
  description: string;
  referenceNumber: string;
  onSuccess: (callback: PaymentCallback) => void;
  onFailure: (callback: PaymentCallback) => void;
  onCancel: () => void;
}

type PaymentState = 'idle' | 'processing' | 'success' | 'failed' | 'cancelled';

export const GCashIntegration: React.FC<GCashIntegrationProps> = ({
  amount,
  description,
  referenceNumber,
  onSuccess,
  onFailure,
  onCancel,
}) => {
  const [paymentState, setPaymentState] = useState<PaymentState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (paymentState === 'processing') {
      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === 'gcash-payment-callback') {
          const callback: PaymentCallback = event.data.payload;

          if (callback.status === 'success') {
            setPaymentState('success');
            onSuccess(callback);
          } else {
            setPaymentState('failed');
            setError('Payment failed. Please try again.');
            onFailure(callback);
          }
        }
      };

      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, [paymentState, onSuccess, onFailure]);

  const handlePayment = async () => {
    setPaymentState('processing');
    setError(null);

    try {
      const paymentRequest: GCashPaymentRequest = {
        amount,
        description,
        referenceNumber,
        successUrl: `${window.location.origin}/payments/callback?status=success`,
        failureUrl: `${window.location.origin}/payments/callback?status=failed`,
      };

      const response = await fetch('/api/payments/gcash/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentRequest),
      });

      if (!response.ok) {
        throw new Error('Failed to initiate GCash payment');
      }

      const { redirectUrl } = await response.json();

      window.open(redirectUrl, '_blank', 'width=600,height=800');
    } catch (err) {
      setPaymentState('failed');
      setError(err instanceof Error ? err.message : 'Failed to process payment');
    }
  };

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    handlePayment();
  };

  const handleCancelPayment = () => {
    setPaymentState('cancelled');
    onCancel();
  };

  const formatAmount = (value: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(value);
  };

  return (
    <Card variant="outlined" className="w-full">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Smartphone className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <CardTitle>GCash Payment</CardTitle>
            <p className="text-sm text-neutral-600 mt-1">
              Pay securely with your GCash account
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <div className="bg-neutral-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-600">Amount</span>
              <span className="text-lg font-semibold text-neutral-900">
                {formatAmount(amount)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-600">Description</span>
              <span className="text-sm text-neutral-900">{description}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-600">Reference</span>
              <span className="text-sm font-mono text-neutral-900">{referenceNumber}</span>
            </div>
          </div>

          {paymentState === 'idle' && (
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  You will be redirected to GCash to complete your payment securely.
                </p>
              </div>
              <Button
                fullWidth
                onClick={handlePayment}
                leftIcon={<Smartphone className="h-5 w-5" />}
                rightIcon={<ExternalLink className="h-4 w-4" />}
              >
                Pay with GCash
              </Button>
              <Button fullWidth variant="secondary" onClick={handleCancelPayment}>
                Cancel
              </Button>
            </div>
          )}

          {paymentState === 'processing' && (
            <div className="space-y-3">
              <div className="flex flex-col items-center justify-center py-6">
                <Loader2 className="h-12 w-12 text-xpress-600 animate-spin mb-4" />
                <p className="text-neutral-900 font-medium mb-2">Processing Payment</p>
                <p className="text-sm text-neutral-600 text-center">
                  Complete the payment in the GCash window.
                  <br />
                  Do not close this page.
                </p>
              </div>
              <Button fullWidth variant="secondary" onClick={handleCancelPayment}>
                Cancel Payment
              </Button>
            </div>
          )}

          {paymentState === 'success' && (
            <div className="space-y-3">
              <div className="flex flex-col items-center justify-center py-6">
                <div className="p-3 bg-success-50 rounded-full mb-4">
                  <CheckCircle className="h-12 w-12 text-success-600" />
                </div>
                <Badge variant="success" className="mb-2">Payment Successful</Badge>
                <p className="text-sm text-neutral-600 text-center">
                  Your payment has been processed successfully.
                </p>
              </div>
            </div>
          )}

          {paymentState === 'failed' && (
            <div className="space-y-3">
              <div className="flex flex-col items-center justify-center py-6">
                <div className="p-3 bg-danger-50 rounded-full mb-4">
                  <AlertCircle className="h-12 w-12 text-danger-600" />
                </div>
                <Badge variant="danger" className="mb-2">Payment Failed</Badge>
                <p className="text-sm text-neutral-600 text-center mb-4">
                  {error || 'An error occurred while processing your payment.'}
                </p>
              </div>
              <Button fullWidth onClick={handleRetry} variant="primary">
                Try Again
              </Button>
              <Button fullWidth variant="secondary" onClick={handleCancelPayment}>
                Cancel
              </Button>
            </div>
          )}

          {retryCount > 0 && (
            <p className="text-xs text-neutral-500 text-center">
              Retry attempt {retryCount}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
