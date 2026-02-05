'use client';

/**
 * Identity Verification (KYC Review) List Page
 * Shows all pending KYC verifications with filtering and priority queue
 * Built by Agent 13 - Identity Verification UI Developer
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  Shield,
  Clock,
  FileCheck,
  Search,
  Filter,
  ChevronRight,
  User,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { useRouter } from 'next/navigation';

// Types
type VerificationStatus = 'pending' | 'in_review' | 'approved' | 'rejected' | 'more_info_needed';

interface Verification {
  id: string;
  driverId: string;
  driverName: string;
  submittedDate: string;
  status: VerificationStatus;
  documentCount: number;
  assignedTo?: string;
  isVIP: boolean;
  priority: number;
}

// Mock data
const MOCK_VERIFICATIONS: Verification[] = [
  {
    id: 'VER-2026-001',
    driverId: 'D-0234',
    driverName: 'Juan dela Cruz',
    submittedDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
    documentCount: 5,
    isVIP: true,
    priority: 1,
  },
  {
    id: 'VER-2026-002',
    driverId: 'D-0445',
    driverName: 'Maria Santos',
    submittedDate: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    status: 'in_review',
    documentCount: 4,
    assignedTo: 'Sarah Chen',
    isVIP: false,
    priority: 2,
  },
  {
    id: 'VER-2026-003',
    driverId: 'D-0789',
    driverName: 'Pedro Reyes',
    submittedDate: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
    documentCount: 6,
    isVIP: false,
    priority: 3,
  },
  {
    id: 'VER-2026-004',
    driverId: 'D-1234',
    driverName: 'Ana Garcia',
    submittedDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    status: 'more_info_needed',
    documentCount: 3,
    assignedTo: 'Mike Torres',
    isVIP: false,
    priority: 4,
  },
  {
    id: 'VER-2026-005',
    driverId: 'D-5678',
    driverName: 'Carlos Mendoza',
    submittedDate: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    status: 'approved',
    documentCount: 5,
    assignedTo: 'Sarah Chen',
    isVIP: false,
    priority: 5,
  },
  {
    id: 'VER-2026-006',
    driverId: 'D-9012',
    driverName: 'Luis Ramirez',
    submittedDate: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    status: 'rejected',
    documentCount: 2,
    assignedTo: 'Mike Torres',
    isVIP: false,
    priority: 6,
  },
];

const IdentityVerificationListPage = () => {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<string>('all');

  useEffect(() => {
    setIsClient(true);
    if (!isFeatureEnabled('identityVerification')) {
      router.push('/dashboard');
    }
  }, [router]);

  useEffect(() => {
    if (!isClient) return;
    setVerifications(MOCK_VERIFICATIONS);
  }, [isClient]);

  // Get status badge variant and color
  const getStatusBadge = (status: VerificationStatus) => {
    switch (status) {
      case 'pending':
        return { variant: 'secondary' as const, color: 'bg-gray-100 text-gray-800', icon: Clock };
      case 'in_review':
        return { variant: 'default' as const, color: 'bg-blue-100 text-blue-800', icon: FileCheck };
      case 'approved':
        return { variant: 'default' as const, color: 'bg-green-100 text-green-800', icon: CheckCircle };
      case 'rejected':
        return { variant: 'destructive' as const, color: 'bg-red-100 text-red-800', icon: XCircle };
      case 'more_info_needed':
        return { variant: 'default' as const, color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle };
      default:
        return { variant: 'secondary' as const, color: 'bg-gray-100 text-gray-800', icon: Clock };
    }
  };

  // Filter verifications
  const filteredVerifications = useMemo(() => {
    return verifications.filter(verification => {
      const matchesStatus = statusFilter === 'all' || verification.status === statusFilter;
      const matchesSearch = searchTerm === '' ||
        verification.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        verification.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        verification.driverId.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesDate = true;
      if (dateRange !== 'all') {
        const submittedDate = new Date(verification.submittedDate);
        const now = new Date();
        const diffHours = (now.getTime() - submittedDate.getTime()) / (1000 * 60 * 60);

        switch (dateRange) {
          case 'today':
            matchesDate = diffHours < 24;
            break;
          case 'week':
            matchesDate = diffHours < 24 * 7;
            break;
          case 'month':
            matchesDate = diffHours < 24 * 30;
            break;
        }
      }

      return matchesStatus && matchesSearch && matchesDate;
    });
  }, [verifications, statusFilter, searchTerm, dateRange]);

  // Sort by priority (oldest first, VIP first)
  const sortedVerifications = useMemo(() => {
    return [...filteredVerifications].sort((a, b) => {
      if (a.isVIP !== b.isVIP) return a.isVIP ? -1 : 1;
      return a.priority - b.priority;
    });
  }, [filteredVerifications]);

  // Count by status
  const statusCounts = useMemo(() => {
    return {
      pending: verifications.filter(v => v.status === 'pending').length,
      in_review: verifications.filter(v => v.status === 'in_review').length,
      approved: verifications.filter(v => v.status === 'approved').length,
      rejected: verifications.filter(v => v.status === 'rejected').length,
      more_info_needed: verifications.filter(v => v.status === 'more_info_needed').length,
    };
  }, [verifications]);

  const handleVerificationClick = (verification: Verification) => {
    router.push(`/identity-verification/review/${verification.id}`);
  };

  const handleAutoAssign = (verificationId: string) => {
    setVerifications(prev =>
      prev.map(v =>
        v.id === verificationId
          ? { ...v, status: 'in_review' as VerificationStatus, assignedTo: 'Current User' }
          : v
      )
    );
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setSearchTerm('');
    setDateRange('all');
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
            Identity Verification (KYC Review)
          </h1>
          <p className="text-gray-600 mt-1">
            Review and verify driver documents • {verifications.length} total submissions
          </p>
        </div>
      </div>

      {/* Status KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="cursor-pointer hover:shadow-lg" onClick={() => setStatusFilter('pending')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <h3 className="text-3xl font-bold text-gray-600 mt-2">{statusCounts.pending}</h3>
              </div>
              <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg" onClick={() => setStatusFilter('in_review')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Review</p>
                <h3 className="text-3xl font-bold text-blue-600 mt-2">{statusCounts.in_review}</h3>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileCheck className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg" onClick={() => setStatusFilter('approved')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <h3 className="text-3xl font-bold text-green-600 mt-2">{statusCounts.approved}</h3>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg" onClick={() => setStatusFilter('rejected')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <h3 className="text-3xl font-bold text-red-600 mt-2">{statusCounts.rejected}</h3>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg" onClick={() => setStatusFilter('more_info_needed')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">More Info</p>
                <h3 className="text-3xl font-bold text-yellow-600 mt-2">{statusCounts.more_info_needed}</h3>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by ID, driver name, or driver ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-4 w-4 text-gray-600" />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_review">In Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="more_info_needed">More Info Needed</option>
              </select>

              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>

              {(statusFilter !== 'all' || searchTerm !== '' || dateRange !== 'all') && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verifications Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Pending Verifications ({sortedVerifications.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sortedVerifications.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No verifications found</h3>
                <p className="text-gray-600">Try adjusting your filters</p>
              </div>
            ) : (
              sortedVerifications.map((verification) => {
                const statusInfo = getStatusBadge(verification.status);
                const StatusIcon = statusInfo.icon;

                return (
                  <div
                    key={verification.id}
                    onClick={() => handleVerificationClick(verification)}
                    className={`p-4 border-2 rounded-lg hover:border-blue-400 hover:shadow-md transition-all cursor-pointer ${
                      verification.isVIP ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      {/* Left: Icon and Details */}
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0 ${statusInfo.color}`}>
                          <StatusIcon className="h-6 w-6" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-mono font-semibold text-gray-900">{verification.id}</span>
                            {verification.isVIP && (
                              <Badge className="bg-yellow-500 text-white">VIP</Badge>
                            )}
                            <Badge className={statusInfo.color}>
                              {verification.status.replace(/_/g, ' ').toUpperCase()}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-2 mb-2">
                            <User className="h-4 w-4 text-gray-600" />
                            <h3 className="font-semibold text-gray-900">{verification.driverName}</h3>
                            <span className="text-sm text-gray-600">({verification.driverId})</span>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>Submitted: {new Date(verification.submittedDate).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <FileCheck className="h-3 w-3" />
                              <span>{verification.documentCount} documents</span>
                            </div>
                            {verification.assignedTo && (
                              <span>Assigned: {verification.assignedTo}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex flex-col items-end gap-2">
                        {verification.status === 'pending' && !verification.assignedTo && (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAutoAssign(verification.id);
                            }}
                          >
                            Assign to Me
                          </Button>
                        )}
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IdentityVerificationListPage;
