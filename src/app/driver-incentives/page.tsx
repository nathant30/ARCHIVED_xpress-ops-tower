'use client';

/**
 * Driver Incentives Page
 * Campaign management and leaderboards for driver incentives
 * Built by Agent 14 - Remaining UI Modules Developer
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  Trophy,
  DollarSign,
  Users,
  TrendingUp,
  Plus,
  Search,
  Filter,
  Calendar,
  Target,
  Award,
  Gift,
  UserPlus,
  CheckCircle,
  Clock,
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

interface Campaign {
  id: string;
  name: string;
  type: 'bonus' | 'referral' | 'quest';
  status: 'active' | 'scheduled' | 'completed' | 'cancelled';
  startDate: string;
  endDate: string;
  payoutAmount: number;
  payoutType: 'fixed' | 'variable';
  participants: number;
  completions: number;
  totalPayout: number;
  description?: string;
  requirements?: string;
}

interface LeaderboardEntry {
  rank: number;
  driverId: string;
  driverName: string;
  points: number;
  earnings: number;
}

// Mock campaigns data
const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: 'CAMP-001',
    name: 'February Peak Hours Bonus',
    type: 'bonus',
    status: 'active',
    startDate: '2026-02-01',
    endDate: '2026-02-28',
    payoutAmount: 500,
    payoutType: 'fixed',
    participants: 234,
    completions: 89,
    totalPayout: 44500,
    description: 'Complete 100 rides during peak hours (7-9 AM, 5-7 PM)',
    requirements: '100 rides during peak hours, maintain 4.5+ rating',
  },
  {
    id: 'CAMP-002',
    name: 'New Driver Referral Program',
    type: 'referral',
    status: 'active',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    payoutAmount: 1000,
    payoutType: 'fixed',
    participants: 156,
    completions: 34,
    totalPayout: 34000,
    description: 'Refer a new driver and earn ₱1000 when they complete 50 rides',
    requirements: 'Referred driver must complete 50 rides within 60 days',
  },
  {
    id: 'CAMP-003',
    name: 'Weekend Warrior Quest',
    type: 'quest',
    status: 'active',
    startDate: '2026-02-01',
    endDate: '2026-02-28',
    payoutAmount: 300,
    payoutType: 'variable',
    participants: 189,
    completions: 67,
    totalPayout: 20100,
    description: 'Complete at least 20 rides every weekend',
    requirements: 'Minimum 20 rides on Saturday and Sunday combined',
  },
  {
    id: 'CAMP-004',
    name: 'Top Performer Monthly Challenge',
    type: 'bonus',
    status: 'active',
    startDate: '2026-02-01',
    endDate: '2026-02-28',
    payoutAmount: 5000,
    payoutType: 'variable',
    participants: 312,
    completions: 0,
    totalPayout: 0,
    description: 'Top 20 drivers with highest ratings and rides',
    requirements: 'Minimum 150 rides, 4.8+ rating',
  },
  {
    id: 'CAMP-005',
    name: 'March Early Bird Special',
    type: 'bonus',
    status: 'scheduled',
    startDate: '2026-03-01',
    endDate: '2026-03-31',
    payoutAmount: 400,
    payoutType: 'fixed',
    participants: 0,
    completions: 0,
    totalPayout: 0,
    description: 'Complete 10 rides before 9 AM daily',
    requirements: 'Minimum 10 morning rides per day',
  },
  {
    id: 'CAMP-006',
    name: 'January New Year Bonus',
    type: 'bonus',
    status: 'completed',
    startDate: '2026-01-01',
    endDate: '2026-01-31',
    payoutAmount: 800,
    payoutType: 'fixed',
    participants: 278,
    completions: 145,
    totalPayout: 116000,
    description: 'Complete 120 rides in January',
    requirements: 'Minimum 120 rides in January',
  },
];

// Mock leaderboard data
const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, driverId: 'D-0234', driverName: 'Juan dela Cruz', points: 2450, earnings: 8500 },
  { rank: 2, driverId: 'D-0445', driverName: 'Maria Santos', points: 2380, earnings: 8200 },
  { rank: 3, driverId: 'D-0789', driverName: 'Pedro Reyes', points: 2310, earnings: 7900 },
  { rank: 4, driverId: 'D-1023', driverName: 'Ana Garcia', points: 2245, earnings: 7600 },
  { rank: 5, driverId: 'D-1156', driverName: 'Carlos Mendoza', points: 2180, earnings: 7300 },
  { rank: 6, driverId: 'D-1289', driverName: 'Rosa Flores', points: 2120, earnings: 7000 },
  { rank: 7, driverId: 'D-1334', driverName: 'Miguel Torres', points: 2055, earnings: 6700 },
  { rank: 8, driverId: 'D-1456', driverName: 'Sofia Cruz', points: 1990, earnings: 6400 },
  { rank: 9, driverId: 'D-1578', driverName: 'Luis Ramirez', points: 1925, earnings: 6100 },
  { rank: 10, driverId: 'D-1690', driverName: 'Carmen Lopez', points: 1860, earnings: 5800 },
];

// Mock performance data
const PERFORMANCE_DATA = [
  { campaign: 'Peak Hours', participants: 234, completions: 89, payout: 44500 },
  { campaign: 'Referral', participants: 156, completions: 34, payout: 34000 },
  { campaign: 'Weekend Quest', participants: 189, completions: 67, payout: 20100 },
  { campaign: 'Top Performer', participants: 312, completions: 0, payout: 0 },
];

const DriverIncentivesPage = () => {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [typeFilter, setTypeFilter] = useState<'all' | Campaign['type']>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | Campaign['status']>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (!isFeatureEnabled('driverIncentives')) {
      router.push('/dashboard');
    }
  }, [router]);

  useEffect(() => {
    if (!isClient) return;
    setCampaigns(MOCK_CAMPAIGNS);
    setLeaderboard(MOCK_LEADERBOARD);
  }, [isClient]);

  // Filter campaigns
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(campaign => {
      const matchesType = typeFilter === 'all' || campaign.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
      const matchesSearch = searchTerm === '' ||
        campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.id.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesType && matchesStatus && matchesSearch;
    });
  }, [campaigns, typeFilter, statusFilter, searchTerm]);

  // Calculate stats
  const stats = useMemo(() => {
    return {
      totalCampaigns: campaigns.length,
      active: campaigns.filter(c => c.status === 'active').length,
      scheduled: campaigns.filter(c => c.status === 'scheduled').length,
      totalParticipants: campaigns.reduce((sum, c) => sum + c.participants, 0),
      totalPayout: campaigns.reduce((sum, c) => sum + c.totalPayout, 0),
    };
  }, [campaigns]);

  const clearFilters = () => {
    setTypeFilter('all');
    setStatusFilter('all');
    setSearchTerm('');
  };

  const getTypeBadge = (type: Campaign['type']) => {
    switch (type) {
      case 'bonus':
        return <Badge className="bg-green-100 text-green-700 border-green-300">Bonus</Badge>;
      case 'referral':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-300">Referral</Badge>;
      case 'quest':
        return <Badge className="bg-purple-100 text-purple-700 border-purple-300">Quest</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const getStatusBadge = (status: Campaign['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700 border-green-300">Active</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-300">Scheduled</Badge>;
      case 'completed':
        return <Badge className="bg-gray-100 text-gray-700 border-gray-300">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-700 border-red-300">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: Campaign['type']) => {
    switch (type) {
      case 'bonus':
        return DollarSign;
      case 'referral':
        return UserPlus;
      case 'quest':
        return Target;
      default:
        return Gift;
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
            <Trophy className="h-8 w-8 text-yellow-600" />
            Driver Incentives
          </h1>
          <p className="text-gray-600 mt-1">
            Manage incentive campaigns and track driver performance • {campaigns.length} total campaigns
          </p>
        </div>

        <Button
          onClick={() => setShowCreateModal(true)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Campaign
        </Button>
      </div>

      {/* Stats KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Campaigns</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.totalCampaigns}</h3>
              </div>
              <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Trophy className="h-6 w-6 text-gray-600" />
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
                <p className="text-sm font-medium text-gray-600">Participants</p>
                <h3 className="text-3xl font-bold text-purple-600 mt-2">{stats.totalParticipants}</h3>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Payout</p>
                <h3 className="text-2xl font-bold text-yellow-600 mt-2">{formatCurrency(stats.totalPayout)}</h3>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={PERFORMANCE_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis dataKey="campaign" stroke="#666" fontSize={12} />
              <YAxis stroke="#666" fontSize={12} />
              <Tooltip
                formatter={(value: any, name: string) => {
                  if (name === 'payout') return formatCurrency(value);
                  return value;
                }}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e5e5',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="participants" fill="#6366f1" name="Participants" />
              <Bar dataKey="completions" fill="#10b981" name="Completions" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Campaigns List */}
        <div className="lg:col-span-2">
          {/* Filters */}
          <Card className="mb-4">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search campaigns..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Filter className="h-4 w-4 text-gray-600" />

                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Types</option>
                    <option value="bonus">Bonus</option>
                    <option value="referral">Referral</option>
                    <option value="quest">Quest</option>
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                  </select>

                  {(typeFilter !== 'all' || statusFilter !== 'all' || searchTerm !== '') && (
                    <Button variant="outline" size="sm" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Campaigns */}
          <Card>
            <CardHeader>
              <CardTitle>Campaigns ({filteredCampaigns.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredCampaigns.length === 0 ? (
                <div className="text-center py-12">
                  <Trophy className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No campaigns found</h3>
                  <p className="text-gray-600">Try adjusting your filters or create a new campaign</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredCampaigns.map((campaign) => {
                    const Icon = getTypeIcon(campaign.type);
                    const completionRate = campaign.participants > 0
                      ? (campaign.completions / campaign.participants) * 100
                      : 0;

                    return (
                      <Card key={campaign.id} className="border-2 hover:shadow-lg transition-shadow">
                        <CardContent className="pt-6">
                          <div className="space-y-4">
                            {/* Header */}
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3">
                                <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <Icon className="h-6 w-6 text-yellow-600" />
                                </div>
                                <div>
                                  <h3 className="font-bold text-lg text-gray-900">{campaign.name}</h3>
                                  <p className="text-sm text-gray-600">{campaign.description}</p>
                                </div>
                              </div>
                              <div className="flex flex-col gap-2 items-end">
                                {getStatusBadge(campaign.status)}
                                {getTypeBadge(campaign.type)}
                              </div>
                            </div>

                            {/* Dates and Payout */}
                            <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
                              <div>
                                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>Duration</span>
                                </div>
                                <p className="text-sm font-semibold text-gray-900">
                                  {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
                                </p>
                              </div>
                              <div>
                                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                  <DollarSign className="h-4 w-4" />
                                  <span>Payout</span>
                                </div>
                                <p className="text-sm font-semibold text-gray-900">
                                  {formatCurrency(campaign.payoutAmount)} ({campaign.payoutType})
                                </p>
                              </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-4">
                              <div className="text-center">
                                <p className="text-2xl font-bold text-purple-600">{campaign.participants}</p>
                                <p className="text-xs text-gray-600">Participants</p>
                              </div>
                              <div className="text-center">
                                <p className="text-2xl font-bold text-green-600">{campaign.completions}</p>
                                <p className="text-xs text-gray-600">Completions</p>
                              </div>
                              <div className="text-center">
                                <p className="text-2xl font-bold text-yellow-600">{completionRate.toFixed(0)}%</p>
                                <p className="text-xs text-gray-600">Rate</p>
                              </div>
                            </div>

                            {/* Total Payout */}
                            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                              <span className="text-sm font-medium text-gray-900">Total Payout</span>
                              <span className="text-lg font-bold text-yellow-600">{formatCurrency(campaign.totalPayout)}</span>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 pt-2">
                              <Button variant="outline" size="sm" className="flex-1">
                                View Details
                              </Button>
                              <Button variant="default" size="sm" className="flex-1">
                                Edit
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Leaderboard */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-600" />
                Top Performers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaderboard.map((entry) => (
                  <div
                    key={entry.driverId}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                      entry.rank <= 3
                        ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300'
                        : 'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${
                      entry.rank === 1 ? 'bg-yellow-400 text-white' :
                      entry.rank === 2 ? 'bg-gray-300 text-white' :
                      entry.rank === 3 ? 'bg-orange-400 text-white' :
                      'bg-gray-200 text-gray-700'
                    }`}>
                      {entry.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{entry.driverName}</p>
                      <p className="text-xs text-gray-500">{entry.driverId}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{entry.points}</p>
                      <p className="text-xs text-gray-600">{formatCurrency(entry.earnings)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Campaign Modal Placeholder */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4">
            <CardHeader>
              <CardTitle>Create New Campaign</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Multi-step campaign creation form would go here...</p>
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

export default DriverIncentivesPage;
