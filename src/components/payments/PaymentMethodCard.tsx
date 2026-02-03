'use client';

import React from 'react';
import { Card, CardContent } from '@/components/xpress/card';
import { Badge } from '@/components/xpress/badge';
import { Button } from '@/components/xpress/button';
import { CreditCard, Smartphone, Wallet, Trash2, Edit, Star, Check } from 'lucide-react';
import type { PaymentMethod } from '@/types/payment';

interface PaymentMethodCardProps {
  paymentMethod: PaymentMethod;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onSetDefault?: (id: string) => void;
}

const getPaymentMethodIcon = (type: string) => {
  switch (type) {
    case 'gcash':
      return <Smartphone className="h-6 w-6 text-blue-600" />;
    case 'paymaya':
      return <Smartphone className="h-6 w-6 text-green-600" />;
    case 'card':
      return <CreditCard className="h-6 w-6 text-purple-600" />;
    case 'cash':
      return <Wallet className="h-6 w-6 text-gray-600" />;
    default:
      return <CreditCard className="h-6 w-6 text-gray-600" />;
  }
};

const getVerificationBadge = (status: string) => {
  switch (status) {
    case 'verified':
      return (
        <Badge variant="success" className="gap-1">
          <Check className="h-3 w-3" />
          Verified
        </Badge>
      );
    case 'pending':
      return <Badge variant="warning">Pending</Badge>;
    case 'failed':
      return <Badge variant="danger">Failed</Badge>;
    default:
      return <Badge variant="secondary">Unverified</Badge>;
  }
};

export const PaymentMethodCard: React.FC<PaymentMethodCardProps> = ({
  paymentMethod,
  onEdit,
  onDelete,
  onSetDefault,
}) => {
  const displayName = () => {
    if (paymentMethod.type === 'card') {
      return `${paymentMethod.cardBrand || 'Card'} •••• ${paymentMethod.cardLast4}`;
    }
    if (paymentMethod.type === 'gcash' || paymentMethod.type === 'paymaya') {
      return `${paymentMethod.name} - ${paymentMethod.phoneNumber}`;
    }
    return paymentMethod.name;
  };

  return (
    <Card
      variant="outlined"
      padding="md"
      className={paymentMethod.isDefault ? 'border-xpress-500 border-2' : ''}
    >
      <CardContent>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            <div className="mt-1">{getPaymentMethodIcon(paymentMethod.type)}</div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-neutral-900">{displayName()}</h3>
                {paymentMethod.isDefault && (
                  <Badge variant="info" className="gap-1">
                    <Star className="h-3 w-3 fill-current" />
                    Default
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-neutral-600 capitalize">
                  {paymentMethod.type}
                </span>
                {getVerificationBadge(paymentMethod.verificationStatus)}
              </div>

              {paymentMethod.type === 'card' && paymentMethod.expiryDate && (
                <p className="text-sm text-neutral-600">
                  Expires: {paymentMethod.expiryDate}
                </p>
              )}

              {paymentMethod.accountNumber && (
                <p className="text-sm text-neutral-600">
                  Account: •••• {paymentMethod.accountNumber.slice(-4)}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!paymentMethod.isDefault && onSetDefault && (
              <Button
                variant="tertiary"
                size="sm"
                onClick={() => onSetDefault(paymentMethod.id)}
                title="Set as default"
              >
                <Star className="h-4 w-4" />
              </Button>
            )}

            {onEdit && (
              <Button
                variant="tertiary"
                size="sm"
                onClick={() => onEdit(paymentMethod.id)}
                title="Edit"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}

            {onDelete && !paymentMethod.isDefault && (
              <Button
                variant="tertiary"
                size="sm"
                onClick={() => onDelete(paymentMethod.id)}
                title="Delete"
                className="text-danger-600 hover:text-danger-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
