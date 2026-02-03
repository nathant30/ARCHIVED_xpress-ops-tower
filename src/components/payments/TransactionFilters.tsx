'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/xpress/button';
import { Card, CardContent } from '@/components/xpress/card';
import { Search, X, Filter } from 'lucide-react';
import type { PaymentMethodType, PaymentStatus } from '@/types/payment';

export interface TransactionFilterValues {
  search?: string;
  status?: PaymentStatus | 'all';
  paymentMethod?: PaymentMethodType | 'all';
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
}

interface TransactionFiltersProps {
  onFilter: (filters: TransactionFilterValues) => void;
  onReset: () => void;
  initialValues?: TransactionFilterValues;
}

export const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  onFilter,
  onReset,
  initialValues,
}) => {
  const { register, handleSubmit, reset } = useForm<TransactionFilterValues>({
    defaultValues: initialValues || {
      search: '',
      status: 'all',
      paymentMethod: 'all',
      dateFrom: '',
      dateTo: '',
    },
  });

  const handleReset = () => {
    reset({
      search: '',
      status: 'all',
      paymentMethod: 'all',
      dateFrom: '',
      dateTo: '',
    });
    onReset();
  };

  return (
    <Card variant="outlined" padding="md">
      <CardContent>
        <form onSubmit={handleSubmit(onFilter)} className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-neutral-600" />
            <h3 className="text-lg font-semibold text-neutral-900">Filters</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-neutral-700 mb-2">
                Search
              </label>
              <div className="relative">
                <input
                  {...register('search')}
                  id="search"
                  type="text"
                  placeholder="Transaction ID or reference"
                  className="w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-xpress-500 focus:border-transparent"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-neutral-400" />
              </div>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-neutral-700 mb-2">
                Status
              </label>
              <select
                {...register('status')}
                id="status"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-xpress-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label htmlFor="paymentMethod" className="block text-sm font-medium text-neutral-700 mb-2">
                Payment Method
              </label>
              <select
                {...register('paymentMethod')}
                id="paymentMethod"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-xpress-500 focus:border-transparent"
              >
                <option value="all">All Methods</option>
                <option value="gcash">GCash</option>
                <option value="paymaya">PayMaya</option>
                <option value="card">Card</option>
                <option value="cash">Cash</option>
              </select>
            </div>

            <div>
              <label htmlFor="dateFrom" className="block text-sm font-medium text-neutral-700 mb-2">
                Date From
              </label>
              <input
                {...register('dateFrom')}
                id="dateFrom"
                type="date"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-xpress-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="dateTo" className="block text-sm font-medium text-neutral-700 mb-2">
                Date To
              </label>
              <input
                {...register('dateTo')}
                id="dateTo"
                type="date"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-xpress-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="amountMin" className="block text-sm font-medium text-neutral-700 mb-2">
                  Min Amount
                </label>
                <input
                  {...register('amountMin', { valueAsNumber: true })}
                  id="amountMin"
                  type="number"
                  placeholder="0"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-xpress-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="amountMax" className="block text-sm font-medium text-neutral-700 mb-2">
                  Max Amount
                </label>
                <input
                  {...register('amountMax', { valueAsNumber: true })}
                  id="amountMax"
                  type="number"
                  placeholder="Any"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-xpress-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-4">
            <Button type="submit" leftIcon={<Filter className="h-4 w-4" />}>
              Apply Filters
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleReset}
              leftIcon={<X className="h-4 w-4" />}
            >
              Reset
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
