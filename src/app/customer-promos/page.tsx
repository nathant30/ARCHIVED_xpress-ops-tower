'use client';

/**
 * Customer Promos Management Page
 * Promotional campaign management with usage tracking
 * Built by Agent 14 - Remaining UI Modules Developer
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  Tag,
  Percent,
  Calendar,
  Users,
  TrendingUp,
  Plus,
  Search,
  Filter,
  ToggleLeft,
  ToggleRight,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { useRouter } from 'next/navigation';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface Promo {
  id: string;
  code: string;
  name: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  status: 'active' | 'scheduled' | 'expired';
  validFrom: string;
  validTo: string;
  usageCount: number;
  usageLimit?: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  description?: string;
}

// Mock promos data
const MOCK_PROMOS: Promo[] = [
  {
    id: 'PROMO-001',
    code: 'WELCOME20',
    name: 'New User Welcome',
    discountType: 'percentage',
    discountValue: 20,
    status: 'active',
    validFrom: '2026-01-01',
    validTo: '2026-12-31',
    usageCount: 1245,
    usageLimit: 5000,
    minOrderAmount: 100,
    maxDiscount: 100,
    description: 'Welcome discount for new customers',
  },
  {
    id: 'PROMO-002',
    code: 'FEB2026',
    name: 'February Special',
    discountType: 'percentage',
    discountValue: 15,
    status: 'active',
    validFrom: '2026-02-01',
    validTo: '2026-02-28',
    usageCount: 567,
    usageLimit: 2000,
    minOrderAmount: 150,
    description: 'Monthly special promotion',
  },
  {
    id: 'PROMO-003',
    code: 'FLASH50',
    name: 'Flash Sale',
    discountType: 'fixed',
    discountValue: 50,
    status: 'active',
    validFrom: '2026-02-03',
    validTo: '2026-02-05',
    usageCount: 89,
    usageLimit: 500,
    minOrderAmount: 200,
    description: '3-day flash sale',
  },
  {
    id: 'PROMO-004',
    code: 'WEEKEND25',
    name: 'Weekend Special',
    discountType: 'percentage',
    discountValue: 25,
    status: 'scheduled',
    validFrom: '2026-02-08',
    validTo: '2026-02-09',
    usageCount: 0,
    usageLimit: 1000,
    minOrderAmount: 100,
    description: 'Weekend only discount',
  },
  {
    id: 'PROMO-005',
    code: 'JAN2026',
    name: 'January Special',
    discountType: 'percentage',
    discountValue: 10,
    status: 'expired',
    validFrom: '2026-01-01',
    validTo: '2026-01-31',
    usageCount: 2134,
    usageLimit: 3000,
    minOrderAmount: 100,
    description: 'January monthly promotion',
  },
  {
    id: 'PROMO-006',
    code: 'LOYALTY30',
    name: 'Loyalty Reward',
    discountType: 'percentage',
    discountValue: 30,
    status: 'active',
    validFrom: '2026-01-15',
    validTo: '2026-03-15',
    usageCount: 345,
    usageLimit: 1000,
    minOrderAmount: 300,
    maxDiscount: 200,
    description: 'Reward for loyal customers',
  },
];

// Mock usage stats for chart
const USAGE_STATS = [
  { date: '2026-01-28', WELCOME20: 45, FEB2026: 0, FLASH50: 0 },
  { date: '2026-01-29', WELCOME20: 52, FEB2026: 0, FLASH50: 0 },
  { date: '2026-01-30', WELCOME20: 48, FEB2026: 0, FLASH50: 0 },
  { date: '2026-01-31', WELCOME20: 61, FEB2026: 0, FLASH50: 0 },
  { date: '2026-02-01', WELCOME20: 43, FEB2026: 78, FLASH50: 0 },
  { date: '2026-02-02', WELCOME20: 55, FEB2026: 89, FLASH50: 0 },
  { date: '2026-02-03', WELCOME20: 47, FEB2026: 72, FLASH50: 89 },
];

const CustomerPromosPage = () => {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | Promo['status']>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (!isFeatureEnabled('customerPromos')) {
      router.push('/dashboard');
    }
  }, [router]);

  useEffect(() => {
    if (!isClient) return;
    setPromos(MOCK_PROMOS);
  }, [isClient]);

  // Filter promos
  const filteredPromos = useMemo(() => {
    return promos.filter(promo => {
      const matchesStatus = statusFilter === 'all' || promo.status === statusFilter;
      const matchesSearch = searchTerm === '' ||
        promo.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        promo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        promo.id.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesStatus && matchesSearch;
    });
  }, [promos, statusFilter, searchTerm]);

  // Calculate stats
  const stats = useMemo(() => {
    return {
      totalPromos: promos.length,
      active: promos.filter(p => p.status === 'active').length,
      scheduled: promos.filter(p => p.status === 'scheduled').length,
      expired: promos.filter(p => p.status === 'expired').length,
      totalUsage: promos.reduce((sum, p) => sum + p.usageCount, 0),
    };
  }, [promos]);

  const clearFilters = () => {
    setStatusFilter('all');
    setSearchTerm('');
  };

  const getStatusBadge = (status: Promo['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700 border-green-300">Active</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-300">Scheduled</Badge>;
      case 'expired':
        return <Badge className="bg-gray-100 text-gray-700 border-gray-300">Expired</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const togglePromoStatus = (promoId: string) => {
    // In a real app, this would call an API
    console.log('Toggle promo status:', promoId);
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
            <Tag className="h-8 w-8 text-purple-600" />
            Customer Promos
          </h1>
          <p className="text-gray-600 mt-1">
            Manage promotional campaigns and discounts • {promos.length} total promos
          </p>
        </div>

        <Button
          onClick={() => setShowCreateModal(true)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Promo
        </Button>
      </div>

      {/* Stats KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Promos</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.totalPromos}</h3>
              </div>
              <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Tag className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <h3 className="text-3xl font-bold text-green-600 mt-2">{stats.active}</h3>
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
                <p className="text-sm font-medium text-gray-600">Scheduled</p>
                <h3 className="text-3xl font-bold text-blue-600 mt-2">{stats.scheduled}</h3>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Expired</p>
                <h3 className="text-3xl font-bold text-gray-600 mt-2">{stats.expired}</h3>
              </div>
              <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <XCircle className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Usage</p>
                <h3 className="text-3xl font-bold text-purple-600 mt-2">{stats.totalUsage.toLocaleString()}</h3>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Statistics Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Statistics (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={USAGE_STATS}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis dataKey="date" stroke="#666" fontSize={12} />
              <YAxis stroke="#666" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e5e5',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="WELCOME20" fill="#6366f1" name="WELCOME20" />
              <Bar dataKey="FEB2026" fill="#10b981" name="FEB2026" />
              <Bar dataKey="FLASH50" fill="#f59e0b" name="FLASH50" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by code, name, or ID..."
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
                <option value="scheduled">Scheduled</option>
                <option value="expired">Expired</option>
              </select>

              {(statusFilter !== 'all' || searchTerm !== '') && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Promos List */}
      <Card>
        <CardHeader>
          <CardTitle>Promotional Campaigns ({filteredPromos.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPromos.length === 0 ? (
            <div className="text-center py-12">
              <Tag className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No promos found</h3>
              <p className="text-gray-600">Try adjusting your filters or create a new promo</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPromos.map((promo) => (
                <Card key={promo.id} className="border-2 hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-lg text-gray-900">{promo.code}</h3>
                          <p className="text-sm text-gray-600">{promo.name}</p>
                        </div>
                        {getStatusBadge(promo.status)}
                      </div>

                      {/* Discount */}
                      <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
                        <Percent className="h-5 w-5 text-purple-600" />
                        <div>
                          <p className="text-2xl font-bold text-purple-600">
                            {promo.discountType === 'percentage' ? `${promo.discountValue}%` : `₱${promo.discountValue}`}
                          </p>
                          <p className="text-xs text-gray-600">
                            {promo.discountType === 'percentage' ? 'Percentage Discount' : 'Fixed Discount'}
                          </p>
                        </div>
                      </div>

                      {/* Validity */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>Valid: {formatDate(promo.validFrom)} - {formatDate(promo.validTo)}</span>
                        </div>
                      </div>

                      {/* Usage */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">Usage</span>
                          <span className="text-sm font-semibold text-gray-900">
                            {promo.usageCount}{promo.usageLimit ? `/${promo.usageLimit}` : ''}
                          </span>
                        </div>
                        {promo.usageLimit && (
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-purple-600 h-2 rounded-full transition-all"
                              style={{ width: `${Math.min((promo.usageCount / promo.usageLimit) * 100, 100)}%` }}
                            ></div>
                          </div>
                        )}
                      </div>

                      {/* Conditions */}
                      {(promo.minOrderAmount || promo.maxDiscount) && (
                        <div className="text-xs text-gray-600 space-y-1 p-2 bg-gray-50 rounded">
                          {promo.minOrderAmount && (
                            <p>Min order: ₱{promo.minOrderAmount}</p>
                          )}
                          {promo.maxDiscount && (
                            <p>Max discount: ₱{promo.maxDiscount}</p>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => togglePromoStatus(promo.id)}
                        >
                          {promo.status === 'active' ? (
                            <>
                              <ToggleRight className="h-4 w-4 mr-1" />
                              Disable
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="h-4 w-4 mr-1" />
                              Enable
                            </>
                          )}
                        </Button>
                        <Button variant="default" size="sm" className="flex-1">
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Promo Modal Placeholder */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4">
            <CardHeader>
              <CardTitle>Create New Promo</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Promo creation form would go here...</p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setShowCreateModal(false)}>
                  Create
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CustomerPromosPage;
