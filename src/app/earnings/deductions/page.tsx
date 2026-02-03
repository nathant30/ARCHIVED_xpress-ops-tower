'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Filter } from 'lucide-react';
import { DeductionsTable, DisputeForm, type Deduction } from '@/components/earnings';
import { Card, CardContent } from '@/components/xpress/card';

const DeductionsPage = () => {
  const [typeFilter, setTypeFilter] = useState('all');
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [selectedDeduction, setSelectedDeduction] = useState<Deduction | null>(null);

  // Mock data - will be replaced with real API calls
  const mockDeductions: Deduction[] = [
    {
      id: 'DD-001',
      driverId: 'DRV-123',
      type: 'commission',
      amount: 700,
      reason: 'Platform commission (20%)',
      deductionDate: '2026-02-02',
      createdAt: '2026-02-02',
      canDispute: false,
    },
    {
      id: 'DD-002',
      driverId: 'DRV-123',
      type: 'bond',
      amount: 100,
      reason: 'Bond deduction for traffic violation',
      relatedIncidentId: 'INC-456',
      deductionDate: '2026-02-02',
      createdAt: '2026-02-02',
      canDispute: true,
    },
    {
      id: 'DD-003',
      driverId: 'DRV-123',
      type: 'promo',
      amount: 50,
      reason: 'Promo code redemption: RIDE50',
      relatedTripId: 'TRP-789',
      deductionDate: '2026-02-02',
      createdAt: '2026-02-02',
      canDispute: false,
    },
    {
      id: 'DD-004',
      driverId: 'DRV-123',
      type: 'commission',
      amount: 720,
      reason: 'Platform commission (20%)',
      deductionDate: '2026-02-01',
      createdAt: '2026-02-01',
      canDispute: false,
    },
    {
      id: 'DD-005',
      driverId: 'DRV-123',
      type: 'adjustment',
      amount: 150,
      reason: 'Fare adjustment - customer complaint',
      relatedTripId: 'TRP-456',
      deductionDate: '2026-01-31',
      createdAt: '2026-01-31',
      canDispute: true,
    },
  ];

  const handleViewDetails = (deduction: Deduction) => {
    console.log('Viewing deduction details:', deduction);
    // TODO: Open modal with deduction details
  };

  const handleDispute = (deduction: Deduction) => {
    setSelectedDeduction(deduction);
    setShowDisputeForm(true);
  };

  const handleDisputeSubmit = async (data: { reason: string; details?: string | undefined }) => {
    console.log('Submitting dispute:', data);
    // TODO: Submit dispute to API
    setShowDisputeForm(false);
    setSelectedDeduction(null);
  };

  const filteredDeductions = mockDeductions.filter((deduction) => {
    return typeFilter === 'all' || deduction.type === typeFilter;
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
            <h1 className="text-2xl font-bold text-neutral-900">Deductions History</h1>
            <p className="text-sm text-neutral-600">
              View all deductions and dispute if needed
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
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-xpress-500 focus:border-xpress-500"
            >
              <option value="all">All Types</option>
              <option value="commission">Platform Commission</option>
              <option value="bond">Bond Deduction</option>
              <option value="promo">Promo Redemption</option>
              <option value="adjustment">Adjustment</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Dispute Form */}
      {showDisputeForm && selectedDeduction && (
        <DisputeForm
          entityType="deduction"
          entityId={selectedDeduction.id}
          amount={selectedDeduction.amount}
          onSubmit={handleDisputeSubmit}
          onCancel={() => {
            setShowDisputeForm(false);
            setSelectedDeduction(null);
          }}
        />
      )}

      {/* Deductions Table */}
      <DeductionsTable
        deductions={filteredDeductions}
        onViewDetails={handleViewDetails}
        onDispute={handleDispute}
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="py-6">
            <p className="text-sm font-medium text-neutral-600">Total Deductions</p>
            <p className="text-2xl font-bold text-danger-600 mt-1">
              ₱
              {mockDeductions
                .reduce((sum, deduction) => sum + deduction.amount, 0)
                .toLocaleString('en-PH', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-6">
            <p className="text-sm font-medium text-neutral-600">Commission</p>
            <p className="text-2xl font-bold text-info-600 mt-1">
              ₱
              {mockDeductions
                .filter((d) => d.type === 'commission')
                .reduce((sum, deduction) => sum + deduction.amount, 0)
                .toLocaleString('en-PH', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-6">
            <p className="text-sm font-medium text-neutral-600">Bond Deductions</p>
            <p className="text-2xl font-bold text-danger-600 mt-1">
              ₱
              {mockDeductions
                .filter((d) => d.type === 'bond')
                .reduce((sum, deduction) => sum + deduction.amount, 0)
                .toLocaleString('en-PH', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-6">
            <p className="text-sm font-medium text-neutral-600">Adjustments</p>
            <p className="text-2xl font-bold text-warning-600 mt-1">
              ₱
              {mockDeductions
                .filter((d) => d.type === 'adjustment')
                .reduce((sum, deduction) => sum + deduction.amount, 0)
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

export default DeductionsPage;
