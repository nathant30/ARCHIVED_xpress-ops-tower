'use client';

/**
 * Bonds Management Page
 * Driver bond management and refund processing
 * Built by Agent 14 - Remaining UI Modules Developer
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  DollarSign,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  Calendar,
  User,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { useRouter } from 'next/navigation';

interface Bond {
  id: string;
  driverId: string;
  driverName: string;
  bondAmount: number;
  status: 'active' | 'released' | 'forfeited';
  depositDate: string;
  refundStatus: 'not_applicable' | 'pending' | 'processing' | 'completed' | 'rejected';
  releaseDate?: string;
  forfeitReason?: string;
  notes?: string;
}

// Mock bonds data
const MOCK_BONDS: Bond[] = [
  {
    id: 'BND-001',
    driverId: 'D-0234',
    driverName: 'Juan dela Cruz',
    bondAmount: 5000,
    status: 'active',
    depositDate: '2026-01-15',
    refundStatus: 'not_applicable',
    notes: 'Initial deposit upon onboarding',
  },
  {
    id: 'BND-002',
    driverId: 'D-0445',
    driverName: 'Maria Santos',
    bondAmount: 5000,
    status: 'released',
    depositDate: '2025-12-10',
    refundStatus: 'completed',
    releaseDate: '2026-01-25',
    notes: 'Driver resigned in good standing',
  },
  {
    id: 'BND-003',
    driverId: 'D-0789',
    driverName: 'Pedro Reyes',
    bondAmount: 5000,
    status: 'active',
    depositDate: '2026-01-20',
    refundStatus: 'not_applicable',
  },
  {
    id: 'BND-004',
    driverId: 'D-1023',
    driverName: 'Ana Garcia',
    bondAmount: 5000,
    status: 'forfeited',
    depositDate: '2025-11-05',
    refundStatus: 'rejected',
    releaseDate: '2026-01-10',
    forfeitReason: 'Vehicle damage exceeding insurance coverage',
    notes: 'Incident ID: INC-2026-045',
  },
  {
    id: 'BND-005',
    driverId: 'D-1156',
    driverName: 'Carlos Mendoza',
    bondAmount: 5000,
    status: 'released',
    depositDate: '2025-10-15',
    refundStatus: 'pending',
    releaseDate: '2026-01-28',
    notes: 'Processing refund via bank transfer',
  },
  {
    id: 'BND-006',
    driverId: 'D-1289',
    driverName: 'Rosa Flores',
    bondAmount: 5000,
    status: 'active',
    depositDate: '2026-02-01',
    refundStatus: 'not_applicable',
  },
  {
    id: 'BND-007',
    driverId: 'D-1334',
    driverName: 'Miguel Torres',
    bondAmount: 5000,
    status: 'released',
    depositDate: '2025-09-20',
    refundStatus: 'processing',
    releaseDate: '2026-02-02',
    notes: 'Refund initiated, awaiting bank confirmation',
  },
];

const BondsManagementPage = () => {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [bonds, setBonds] = useState<Bond[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | Bond['status']>('all');
  const [refundStatusFilter, setRefundStatusFilter] = useState<'all' | Bond['refundStatus']>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    setIsClient(true);
    if (!isFeatureEnabled('bonds')) {
      router.push('/dashboard');
    }
  }, [router]);

  useEffect(() => {
    if (!isClient) return;
    setBonds(MOCK_BONDS);
  }, [isClient]);

  // Filter bonds
  const filteredBonds = useMemo(() => {
    return bonds.filter(bond => {
      const matchesStatus = statusFilter === 'all' || bond.status === statusFilter;
      const matchesRefundStatus = refundStatusFilter === 'all' || bond.refundStatus === refundStatusFilter;
      const matchesSearch = searchTerm === '' ||
        bond.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bond.driverId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bond.id.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesDateRange = true;
      if (dateRange.start) {
        matchesDateRange = matchesDateRange && bond.depositDate >= dateRange.start;
      }
      if (dateRange.end) {
        matchesDateRange = matchesDateRange && bond.depositDate <= dateRange.end;
      }

      return matchesStatus && matchesRefundStatus && matchesSearch && matchesDateRange;
    });
  }, [bonds, statusFilter, refundStatusFilter, searchTerm, dateRange]);

  // Calculate stats
  const stats = useMemo(() => {
    return {
      totalBonds: bonds.length,
      active: bonds.filter(b => b.status === 'active').length,
      released: bonds.filter(b => b.status === 'released').length,
      forfeited: bonds.filter(b => b.status === 'forfeited').length,
      totalAmount: bonds.filter(b => b.status === 'active').reduce((sum, b) => sum + b.bondAmount, 0),
      pendingRefunds: bonds.filter(b => b.refundStatus === 'pending' || b.refundStatus === 'processing').length,
    };
  }, [bonds]);

  const clearFilters = () => {
    setStatusFilter('all');
    setRefundStatusFilter('all');
    setSearchTerm('');
    setDateRange({ start: '', end: '' });
  };

  const getStatusBadge = (status: Bond['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700 border-green-300">Active</Badge>;
      case 'released':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-300">Released</Badge>;
      case 'forfeited':
        return <Badge className="bg-red-100 text-red-700 border-red-300">Forfeited</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRefundStatusBadge = (status: Bond['refundStatus']) => {
    switch (status) {
      case 'not_applicable':
        return <Badge variant="outline">N/A</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">Pending</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-300">Processing</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-700 border-green-300">Completed</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700 border-red-300">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Shield className="h-8 w-8 text-blue-600" />
            Bonds Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage driver bonds and refund processing • {bonds.length} total bonds
          </p>
        </div>
      </div>

      {/* Stats KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Bonds</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-2">{stats.totalBonds}</h3>
              </div>
              <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <h3 className="text-2xl font-bold text-green-600 mt-2">{stats.active}</h3>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Released</p>
                <h3 className="text-2xl font-bold text-blue-600 mt-2">{stats.released}</h3>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Forfeited</p>
                <h3 className="text-2xl font-bold text-red-600 mt-2">{stats.forfeited}</h3>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Amount</p>
                <h3 className="text-xl font-bold text-gray-900 mt-2">{formatCurrency(stats.totalAmount)}</h3>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Refunds</p>
                <h3 className="text-2xl font-bold text-yellow-600 mt-2">{stats.pendingRefunds}</h3>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by driver name, ID, or bond ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="h-4 w-4 text-gray-600" />

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="released">Released</option>
                  <option value="forfeited">Forfeited</option>
                </select>

                <select
                  value={refundStatusFilter}
                  onChange={(e) => setRefundStatusFilter(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Refund Status</option>
                  <option value="not_applicable">N/A</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                </select>

                {(statusFilter !== 'all' || refundStatusFilter !== 'all' || searchTerm !== '' || dateRange.start || dateRange.end) && (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-600" />
              <span className="text-sm text-gray-600">Date Range:</span>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-600">to</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bonds Table */}
      <Card>
        <CardHeader>
          <CardTitle>Driver Bonds ({filteredBonds.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredBonds.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No bonds found</h3>
              <p className="text-gray-600">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Bond ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Driver</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Bond Amount</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Deposit Date</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Refund Status</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBonds.map((bond) => (
                    <tr key={bond.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <span className="font-mono font-semibold text-gray-900">{bond.id}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">{bond.driverName}</p>
                            <p className="text-xs text-gray-500">{bond.driverId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="font-semibold text-gray-900">{formatCurrency(bond.bondAmount)}</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        {getStatusBadge(bond.status)}
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="text-sm text-gray-900">{formatDate(bond.depositDate)}</p>
                          {bond.releaseDate && (
                            <p className="text-xs text-gray-500">Released: {formatDate(bond.releaseDate)}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        {getRefundStatusBadge(bond.refundStatus)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="outline" size="sm" className="gap-2">
                            <Eye className="h-3 w-3" />
                            View
                          </Button>
                          {bond.status === 'released' && bond.refundStatus === 'pending' && (
                            <Button variant="default" size="sm" className="gap-2">
                              <RefreshCw className="h-3 w-3" />
                              Process
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BondsManagementPage;
