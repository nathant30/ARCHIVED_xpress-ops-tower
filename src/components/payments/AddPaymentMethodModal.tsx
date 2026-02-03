'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal, ModalFooter } from '@/components/ui/modal';
import { Button } from '@/components/xpress/button';
import { CreditCard, Smartphone } from 'lucide-react';
import type { PaymentMethodType } from '@/types/payment';

const paymentMethodSchema = z.object({
  type: z.enum(['gcash', 'paymaya', 'card']),
  name: z.string().min(1, 'Name is required'),
  phoneNumber: z.string().optional(),
  accountNumber: z.string().optional(),
  cardNumber: z.string().optional(),
  cardBrand: z.string().optional(),
  expiryMonth: z.string().optional(),
  expiryYear: z.string().optional(),
  cvv: z.string().optional(),
  isDefault: z.boolean().default(false),
}).refine((data) => {
  if (data.type === 'gcash' || data.type === 'paymaya') {
    return data.phoneNumber && /^09\d{9}$/.test(data.phoneNumber);
  }
  return true;
}, {
  message: 'Valid Philippine phone number is required (09XXXXXXXXX)',
  path: ['phoneNumber'],
}).refine((data) => {
  if (data.type === 'card') {
    return data.cardNumber && data.expiryMonth && data.expiryYear && data.cvv;
  }
  return true;
}, {
  message: 'All card details are required',
  path: ['cardNumber'],
});

type PaymentMethodFormData = z.infer<typeof paymentMethodSchema>;

interface AddPaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PaymentMethodFormData) => Promise<void>;
}

export const AddPaymentMethodModal: React.FC<AddPaymentMethodModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [selectedType, setSelectedType] = useState<PaymentMethodType>('gcash');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<PaymentMethodFormData>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: {
      type: 'gcash',
      isDefault: false,
    },
  });

  const handleClose = () => {
    reset();
    setSelectedType('gcash');
    onClose();
  };

  const handleFormSubmit = async (data: PaymentMethodFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      handleClose();
    } catch (error) {
      console.error('Failed to add payment method:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTypeSelect = (type: PaymentMethodType) => {
    setSelectedType(type);
    setValue('type', type);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Payment Method"
      description="Add a new payment method for faster checkout"
      size="md"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-3">
            Payment Method Type
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => handleTypeSelect('gcash')}
              className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-all ${
                selectedType === 'gcash'
                  ? 'border-xpress-500 bg-xpress-50'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <Smartphone className="h-6 w-6 text-blue-600" />
              <span className="text-sm font-medium">GCash</span>
            </button>

            <button
              type="button"
              onClick={() => handleTypeSelect('paymaya')}
              className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-all ${
                selectedType === 'paymaya'
                  ? 'border-xpress-500 bg-xpress-50'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <Smartphone className="h-6 w-6 text-green-600" />
              <span className="text-sm font-medium">PayMaya</span>
            </button>

            <button
              type="button"
              onClick={() => handleTypeSelect('card')}
              className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-all ${
                selectedType === 'card'
                  ? 'border-xpress-500 bg-xpress-50'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <CreditCard className="h-6 w-6 text-purple-600" />
              <span className="text-sm font-medium">Card</span>
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-2">
            Display Name
          </label>
          <input
            {...register('name')}
            id="name"
            type="text"
            placeholder="e.g., My GCash, Personal Card"
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-xpress-500 focus:border-transparent"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-danger-600">{errors.name.message}</p>
          )}
        </div>

        {(selectedType === 'gcash' || selectedType === 'paymaya') && (
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-neutral-700 mb-2">
              Phone Number
            </label>
            <input
              {...register('phoneNumber')}
              id="phoneNumber"
              type="tel"
              placeholder="09XXXXXXXXX"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-xpress-500 focus:border-transparent"
            />
            {errors.phoneNumber && (
              <p className="mt-1 text-sm text-danger-600">{errors.phoneNumber.message}</p>
            )}
          </div>
        )}

        {selectedType === 'card' && (
          <>
            <div>
              <label htmlFor="cardNumber" className="block text-sm font-medium text-neutral-700 mb-2">
                Card Number
              </label>
              <input
                {...register('cardNumber')}
                id="cardNumber"
                type="text"
                placeholder="1234 5678 9012 3456"
                maxLength={19}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-xpress-500 focus:border-transparent"
              />
              {errors.cardNumber && (
                <p className="mt-1 text-sm text-danger-600">{errors.cardNumber.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="expiryMonth" className="block text-sm font-medium text-neutral-700 mb-2">
                  Expiry Month
                </label>
                <input
                  {...register('expiryMonth')}
                  id="expiryMonth"
                  type="text"
                  placeholder="MM"
                  maxLength={2}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-xpress-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="expiryYear" className="block text-sm font-medium text-neutral-700 mb-2">
                  Expiry Year
                </label>
                <input
                  {...register('expiryYear')}
                  id="expiryYear"
                  type="text"
                  placeholder="YY"
                  maxLength={2}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-xpress-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label htmlFor="cvv" className="block text-sm font-medium text-neutral-700 mb-2">
                CVV
              </label>
              <input
                {...register('cvv')}
                id="cvv"
                type="text"
                placeholder="123"
                maxLength={4}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-xpress-500 focus:border-transparent"
              />
            </div>
          </>
        )}

        <div className="flex items-center">
          <input
            {...register('isDefault')}
            id="isDefault"
            type="checkbox"
            className="h-4 w-4 text-xpress-600 focus:ring-xpress-500 border-neutral-300 rounded"
          />
          <label htmlFor="isDefault" className="ml-2 block text-sm text-neutral-700">
            Set as default payment method
          </label>
        </div>

        <ModalFooter>
          <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Add Payment Method
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};
