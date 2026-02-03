'use client';

import React, { useState } from 'react';
import { Button } from '@/components/xpress/button';
import { Plus } from 'lucide-react';
import { PaymentMethodCard } from '@/components/payments/PaymentMethodCard';
import { AddPaymentMethodModal } from '@/components/payments/AddPaymentMethodModal';
import type { PaymentMethod } from '@/types/payment';

const mockPaymentMethods: PaymentMethod[] = [
  {
    id: '1',
    type: 'gcash',
    name: 'Personal GCash',
    phoneNumber: '09171234567',
    isDefault: true,
    verificationStatus: 'verified',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    type: 'paymaya',
    name: 'PayMaya Account',
    phoneNumber: '09189876543',
    isDefault: false,
    verificationStatus: 'verified',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    type: 'card',
    name: 'Visa Credit Card',
    cardLast4: '4242',
    cardBrand: 'Visa',
    expiryDate: '12/25',
    isDefault: false,
    verificationStatus: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const PaymentMethodsPage = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(mockPaymentMethods);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleAddPaymentMethod = async (data: unknown) => {
    console.log('Adding payment method:', data);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  };

  const handleEditPaymentMethod = (id: string) => {
    console.log('Editing payment method:', id);
  };

  const handleDeletePaymentMethod = (id: string) => {
    if (window.confirm('Are you sure you want to delete this payment method?')) {
      setPaymentMethods((prev) => prev.filter((pm) => pm.id !== id));
    }
  };

  const handleSetDefault = (id: string) => {
    setPaymentMethods((prev) =>
      prev.map((pm) => ({
        ...pm,
        isDefault: pm.id === id,
      }))
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Payment Methods</h1>
          <p className="text-sm text-neutral-600 mt-1">
            Manage your payment methods for faster checkout
          </p>
        </div>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Add Payment Method
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {paymentMethods.length === 0 ? (
          <div className="col-span-2 text-center py-12">
            <p className="text-neutral-600 mb-4">No payment methods added yet</p>
            <Button onClick={() => setIsAddModalOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>
              Add Your First Payment Method
            </Button>
          </div>
        ) : (
          paymentMethods.map((method) => (
            <PaymentMethodCard
              key={method.id}
              paymentMethod={method}
              onEdit={handleEditPaymentMethod}
              onDelete={handleDeletePaymentMethod}
              onSetDefault={handleSetDefault}
            />
          ))
        )}
      </div>

      <AddPaymentMethodModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddPaymentMethod}
      />
    </div>
  );
};

export default PaymentMethodsPage;
