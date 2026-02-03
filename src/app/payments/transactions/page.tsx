'use client';

import React, { useState } from 'react';
import { TransactionTable } from '@/components/payments/TransactionTable';
import { TransactionFilters, type TransactionFilterValues } from '@/components/payments/TransactionFilters';
import { TransactionDetailsModal } from '@/components/payments/TransactionDetailsModal';
import type { Transaction } from '@/types/payment';

const mockTransactions: Transaction[] = [
  {
    id: '1',
    transactionId: 'TXN-2024-001',
    referenceNumber: 'REF-001',
    amount: 1500,
    currency: 'PHP',
    status: 'completed',
    paymentMethod: 'gcash',
    paymentMethodId: 'pm1',
    description: 'Ride fare payment - Manila to Quezon City',
    userId: 'user123',
    bookingId: 'booking456',
    createdAt: new Date('2024-01-15T10:30:00').toISOString(),
    updatedAt: new Date('2024-01-15T10:30:30').toISOString(),
    completedAt: new Date('2024-01-15T10:30:30').toISOString(),
  },
  {
    id: '2',
    transactionId: 'TXN-2024-002',
    referenceNumber: 'REF-002',
    amount: 2300,
    currency: 'PHP',
    status: 'pending',
    paymentMethod: 'paymaya',
    paymentMethodId: 'pm2',
    description: 'Booking payment - Airport transfer',
    userId: 'user456',
    bookingId: 'booking789',
    createdAt: new Date('2024-01-15T11:00:00').toISOString(),
    updatedAt: new Date('2024-01-15T11:00:00').toISOString(),
  },
  {
    id: '3',
    transactionId: 'TXN-2024-003',
    referenceNumber: 'REF-003',
    amount: 890,
    currency: 'PHP',
    status: 'failed',
    paymentMethod: 'card',
    paymentMethodId: 'pm3',
    description: 'Ride fare payment',
    userId: 'user789',
    failureReason: 'Insufficient funds',
    createdAt: new Date('2024-01-15T11:30:00').toISOString(),
    updatedAt: new Date('2024-01-15T11:30:10').toISOString(),
  },
  {
    id: '4',
    transactionId: 'TXN-2024-004',
    referenceNumber: 'REF-004',
    amount: 1200,
    currency: 'PHP',
    status: 'refunded',
    paymentMethod: 'gcash',
    paymentMethodId: 'pm1',
    description: 'Ride fare payment - Refunded due to cancellation',
    userId: 'user123',
    bookingId: 'booking101',
    createdAt: new Date('2024-01-14T15:00:00').toISOString(),
    updatedAt: new Date('2024-01-14T16:00:00').toISOString(),
    completedAt: new Date('2024-01-14T15:00:30').toISOString(),
  },
  {
    id: '5',
    transactionId: 'TXN-2024-005',
    referenceNumber: 'REF-005',
    amount: 3500,
    currency: 'PHP',
    status: 'completed',
    paymentMethod: 'paymaya',
    paymentMethodId: 'pm2',
    description: 'Premium ride - Makati to BGC',
    userId: 'user222',
    bookingId: 'booking202',
    createdAt: new Date('2024-01-14T09:00:00').toISOString(),
    updatedAt: new Date('2024-01-14T09:00:45').toISOString(),
    completedAt: new Date('2024-01-14T09:00:45').toISOString(),
  },
];

const TransactionsPage = () => {
  const [transactions] = useState<Transaction[]>(mockTransactions);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>(mockTransactions);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [page, setPage] = useState(1);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const handleFilter = (filters: TransactionFilterValues) => {
    let filtered = [...transactions];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.transactionId.toLowerCase().includes(searchLower) ||
          t.referenceNumber.toLowerCase().includes(searchLower)
      );
    }

    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter((t) => t.status === filters.status);
    }

    if (filters.paymentMethod && filters.paymentMethod !== 'all') {
      filtered = filtered.filter((t) => t.paymentMethod === filters.paymentMethod);
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(
        (t) => new Date(t.createdAt) >= new Date(filters.dateFrom!)
      );
    }

    if (filters.dateTo) {
      filtered = filtered.filter(
        (t) => new Date(t.createdAt) <= new Date(filters.dateTo!)
      );
    }

    if (filters.amountMin !== undefined && filters.amountMin > 0) {
      filtered = filtered.filter((t) => t.amount >= filters.amountMin!);
    }

    if (filters.amountMax !== undefined && filters.amountMax > 0) {
      filtered = filtered.filter((t) => t.amount <= filters.amountMax!);
    }

    setFilteredTransactions(filtered);
    setPage(1);
  };

  const handleReset = () => {
    setFilteredTransactions(transactions);
    setPage(1);
  };

  const handleViewDetails = (transactionId: string) => {
    const transaction = transactions.find((t) => t.id === transactionId);
    if (transaction) {
      setSelectedTransaction(transaction);
      setIsDetailsModalOpen(true);
    }
  };

  const handleExport = () => {
    console.log('Exporting transactions to CSV');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Transaction History</h1>
        <p className="text-sm text-neutral-600 mt-1">
          View and search all payment transactions
        </p>
      </div>

      <TransactionFilters onFilter={handleFilter} onReset={handleReset} />

      <TransactionTable
        transactions={filteredTransactions}
        onViewDetails={handleViewDetails}
        onExport={handleExport}
        page={page}
        totalPages={Math.ceil(filteredTransactions.length / 10)}
        onPageChange={setPage}
      />

      <TransactionDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        transaction={selectedTransaction}
      />
    </div>
  );
};

export default TransactionsPage;
