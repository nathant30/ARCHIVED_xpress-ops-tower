'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, Filter } from 'lucide-react';
import {
  PayoutHistoryTable,
  DisputeForm,
  type DriverPayout,
} from '@/components/earnings';
import { Card, CardContent } from '@/components/xpress/card';

const PayoutsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<DriverPayout | null>(null);

  // Mock data - will be replaced with real API calls
  const mockPayouts: DriverPayout[] = [
    {
      id: 'PO-001',
      driverId: 'DRV-123',
      amount: 18450,
      status: 'completed',
      payoutMethod: 'gcash',
      payoutDate: '2026-02-01',
      payoutReference: 'GC20260201-001',
      processedDate: '2026-02-01',
      createdAt: '2026-01-31',
      updatedAt: '2026-02-01',
    },
    {
      id: 'PO-002',
      driverId: 'DRV-123',
      amount: 21300,
      status: 'processing',
      payoutMethod: 'bank_transfer',
      payoutDate: '2026-01-25',
      payoutReference: 'BT20260125-002',
      createdAt: '2026-01-24',
      updatedAt: '2026-01-25',
    },
    {
      id: 'PO-003',
      driverId: 'DRV-123',
      amount: 16780,
      status: 'completed',
      payoutMethod: 'gcash',
      payoutDate: '2026-01-18',
      payoutReference: 'GC20260118-003',
      processedDate: '2026-01-18',
      createdAt: '2026-01-17',
      updatedAt: '2026-01-18',
    },
    {
      id: 'PO-004',
      driverId: 'DRV-123',
      amount: 19250,
      status: 'pending',
      payoutMethod: 'gcash',
      payoutDate: '2026-02-08',
      createdAt: '2026-02-02',
      updatedAt: '2026-02-02',
    },
  ];

  const handleViewDetails = (payout: DriverPayout) => {
    console.log('Viewing payout details:', payout);
    // TODO: Open modal with payout details
  };

  const handleDownloadReceipt = (payoutId: string) => {
    console.log('Downloading receipt for payout:', payoutId);
    // TODO: Implement receipt download
  };

  const handleDispute = (payout: DriverPayout) => {
    setSelectedPayout(payout);
    setShowDisputeForm(true);
  };

  const handleDisputeSubmit = async (data: { reason: string; details?: string | undefined }) => {
    console.log('Submitting dispute:', data);
    // TODO: Submit dispute to API
    setShowDisputeForm(false);
    setSelectedPayout(null);
  };

  const filteredPayouts = mockPayouts.filter((payout) => {
    const matchesSearch =
      searchQuery === '' ||
      payout.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payout.payoutReference?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || payout.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/earnings"
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Payout History</h1>
            <p className="text-sm text-neutral-600">View and manage your payout records</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search by payout ID or reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-xpress-500 focus:border-xpress-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-neutral-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-xpress-500 focus:border-xpress-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dispute Form */}
      {showDisputeForm && selectedPayout && (
        <DisputeForm
          entityType="payout"
          entityId={selectedPayout.id}
          amount={selectedPayout.amount}
          onSubmit={handleDisputeSubmit}
          onCancel={() => {
            setShowDisputeForm(false);
            setSelectedPayout(null);
          }}
        />
      )}

      {/* Payout History Table */}
      <PayoutHistoryTable
        payouts={filteredPayouts}
        onViewDetails={handleViewDetails}
        onDownloadReceipt={handleDownloadReceipt}
        onDispute={handleDispute}
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="py-6">
            <p className="text-sm font-medium text-neutral-600">Total Payouts</p>
            <p className="text-2xl font-bold text-neutral-900 mt-1">
              ₱
              {mockPayouts
                .reduce((sum, payout) => sum + payout.amount, 0)
                .toLocaleString('en-PH', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-6">
            <p className="text-sm font-medium text-neutral-600">Completed</p>
            <p className="text-2xl font-bold text-success-600 mt-1">
              {mockPayouts.filter((p) => p.status === 'completed').length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-6">
            <p className="text-sm font-medium text-neutral-600">Pending</p>
            <p className="text-2xl font-bold text-warning-600 mt-1">
              {mockPayouts.filter((p) => p.status === 'pending').length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-6">
            <p className="text-sm font-medium text-neutral-600">Processing</p>
            <p className="text-2xl font-bold text-info-600 mt-1">
              {mockPayouts.filter((p) => p.status === 'processing').length}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PayoutsPage;
