'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Filter } from 'lucide-react';
import {
  SettlementRecordTable,
  DisputeForm,
  type Settlement,
} from '@/components/earnings';
import { Card, CardContent } from '@/components/xpress/card';

const SettlementsPage = () => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null);

  // Mock data - will be replaced with real API calls
  const mockSettlements: Settlement[] = [
    {
      id: 'ST-001',
      driverId: 'DRV-123',
      settlementDate: '2026-02-02',
      status: 'completed',
      totalRevenue: 3500,
      totalDeductions: 850,
      netAmount: 2650,
      tripCount: 16,
      createdAt: '2026-02-02',
      updatedAt: '2026-02-02',
    },
    {
      id: 'ST-002',
      driverId: 'DRV-123',
      settlementDate: '2026-02-01',
      status: 'completed',
      totalRevenue: 2980,
      totalDeductions: 720,
      netAmount: 2260,
      tripCount: 13,
      createdAt: '2026-02-01',
      updatedAt: '2026-02-01',
    },
    {
      id: 'ST-003',
      driverId: 'DRV-123',
      settlementDate: '2026-01-31',
      status: 'completed',
      totalRevenue: 3200,
      totalDeductions: 780,
      netAmount: 2420,
      tripCount: 14,
      createdAt: '2026-01-31',
      updatedAt: '2026-01-31',
    },
    {
      id: 'ST-004',
      driverId: 'DRV-123',
      settlementDate: '2026-01-30',
      status: 'completed',
      totalRevenue: 3450,
      totalDeductions: 840,
      netAmount: 2610,
      tripCount: 17,
      createdAt: '2026-01-30',
      updatedAt: '2026-01-30',
    },
    {
      id: 'ST-005',
      driverId: 'DRV-123',
      settlementDate: '2026-02-03',
      status: 'pending',
      totalRevenue: 1250,
      totalDeductions: 300,
      netAmount: 950,
      tripCount: 6,
      createdAt: '2026-02-03',
      updatedAt: '2026-02-03',
    },
  ];

  const handleViewDetails = (settlement: Settlement) => {
    console.log('Viewing settlement details:', settlement);
    // TODO: Navigate to settlement details page or open modal
  };

  const handleDispute = (settlement: Settlement) => {
    setSelectedSettlement(settlement);
    setShowDisputeForm(true);
  };

  const handleDisputeSubmit = async (data: { reason: string; details?: string | undefined }) => {
    console.log('Submitting dispute:', data);
    // TODO: Submit dispute to API
    setShowDisputeForm(false);
    setSelectedSettlement(null);
  };

  const filteredSettlements = mockSettlements.filter((settlement) => {
    return statusFilter === 'all' || settlement.status === statusFilter;
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
            <h1 className="text-2xl font-bold text-neutral-900">Settlement Records</h1>
            <p className="text-sm text-neutral-600">
              Daily settlement records with trip details
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-neutral-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-xpress-500 focus:border-xpress-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Dispute Form */}
      {showDisputeForm && selectedSettlement && (
        <DisputeForm
          entityType="settlement"
          entityId={selectedSettlement.id}
          amount={selectedSettlement.netAmount}
          onSubmit={handleDisputeSubmit}
          onCancel={() => {
            setShowDisputeForm(false);
            setSelectedSettlement(null);
          }}
        />
      )}

      {/* Settlement Records Table */}
      <SettlementRecordTable
        settlements={filteredSettlements}
        onViewDetails={handleViewDetails}
        onDispute={handleDispute}
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="py-6">
            <p className="text-sm font-medium text-neutral-600">Total Settlements</p>
            <p className="text-2xl font-bold text-neutral-900 mt-1">
              {mockSettlements.length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-6">
            <p className="text-sm font-medium text-neutral-600">Total Revenue</p>
            <p className="text-2xl font-bold text-success-600 mt-1">
              ₱
              {mockSettlements
                .reduce((sum, settlement) => sum + settlement.totalRevenue, 0)
                .toLocaleString('en-PH', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-6">
            <p className="text-sm font-medium text-neutral-600">Total Deductions</p>
            <p className="text-2xl font-bold text-danger-600 mt-1">
              ₱
              {mockSettlements
                .reduce((sum, settlement) => sum + settlement.totalDeductions, 0)
                .toLocaleString('en-PH', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-6">
            <p className="text-sm font-medium text-neutral-600">Net Amount</p>
            <p className="text-2xl font-bold text-xpress-600 mt-1">
              ₱
              {mockSettlements
                .reduce((sum, settlement) => sum + settlement.netAmount, 0)
                .toLocaleString('en-PH', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettlementsPage;
