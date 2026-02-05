'use client';

/**
 * Trust Score Dashboard
 * Monitor driver trust scores and risk indicators
 * Built by Agent 14 - Remaining UI Modules Developer
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  Shield,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Users,
  Star,
  Activity,
  Filter,
  Search,
  Download,
  Eye,
  BarChart3,
  PieChart as PieChartIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { useRouter } from 'next/navigation';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface TrustScoreMetrics {
  totalDrivers: number;
  averageTrustScore: number;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
  flaggedToday: number;
  scoreImprovement: number;
}

interface DriverTrustScore {
  driverId: string;
  driverName: string;
  overallScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  components: {
    customerRating: number;
    completionRate: number;
    complianceScore: number;
    safetyScore: number;
    punctualityScore: number;
  };
  flags: TrustFlag[];
  trend: 'improving' | 'declining' | 'stable';
  lastUpdated: string;
}

interface TrustFlag {
  id: string;
  type: 'safety' | 'compliance' | 'behavior' | 'financial';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: string;
  resolved: boolean;
}

// Mock data
const MOCK_METRICS: TrustScoreMetrics = {
  totalDrivers: 1247,
  averageTrustScore: 87.3,
  highRisk: 34,
  mediumRisk: 156,
  lowRisk: 1057,
  flaggedToday: 12,
  scoreImprovement: 2.4,
};

const MOCK_DRIVERS: DriverTrustScore[] = [
  {
    driverId: 'DRV-001',
    driverName: 'Juan dela Cruz',
    overallScore: 62,
    riskLevel: 'high',
    components: {
      customerRating: 3.2,
      completionRate: 78,
      complianceScore: 65,
      safetyScore: 55,
      punctualityScore: 72,
    },
    flags: [
      {
        id: 'FLAG-001',
        type: 'safety',
        severity: 'high',
        description: 'Multiple speeding incidents reported',
        timestamp: '2026-02-05T10:30:00',
        resolved: false,
      },
      {
        id: 'FLAG-002',
        type: 'behavior',
        severity: 'medium',
        description: 'Customer complaints about aggressive driving',
        timestamp: '2026-02-04T15:20:00',
        resolved: false,
      },
    ],
    trend: 'declining',
    lastUpdated: '2026-02-05T14:30:00',
  },
  {
    driverId: 'DRV-002',
    driverName: 'Maria Santos',
    overallScore: 95,
    riskLevel: 'low',
    components: {
      customerRating: 4.9,
      completionRate: 98,
      complianceScore: 97,
      safetyScore: 96,
      punctualityScore: 94,
    },
    flags: [],
    trend: 'improving',
    lastUpdated: '2026-02-05T14:25:00',
  },
  {
    driverId: 'DRV-003',
    driverName: 'Pedro Reyes',
    overallScore: 88,
    riskLevel: 'low',
    components: {
      customerRating: 4.6,
      completionRate: 92,
      complianceScore: 89,
      safetyScore: 90,
      punctualityScore: 85,
    },
    flags: [],
    trend: 'stable',
    lastUpdated: '2026-02-05T14:20:00',
  },
  {
    driverId: 'DRV-004',
    driverName: 'Ana Garcia',
    overallScore: 76,
    riskLevel: 'medium',
    components: {
      customerRating: 4.1,
      completionRate: 85,
      complianceScore: 78,
      safetyScore: 72,
      punctualityScore: 80,
    },
    flags: [
      {
        id: 'FLAG-003',
        type: 'compliance',
        severity: 'medium',
        description: 'Late document submission',
        timestamp: '2026-02-03T09:15:00',
        resolved: true,
      },
    ],
    trend: 'improving',
    lastUpdated: '2026-02-05T14:15:00',
  },
  {
    driverId: 'DRV-005',
    driverName: 'Carlos Mendoza',
    overallScore: 91,
    riskLevel: 'low',
    components: {
      customerRating: 4.7,
      completionRate: 95,
      complianceScore: 92,
      safetyScore: 93,
      punctualityScore: 89,
    },
    flags: [],
    trend: 'stable',
    lastUpdated: '2026-02-05T14:10:00',
  },
  {
    driverId: 'DRV-006',
    driverName: 'Rosa Fernandez',
    overallScore: 68,
    riskLevel: 'high',
    components: {
      customerRating: 3.5,
      completionRate: 80,
      complianceScore: 70,
      safetyScore: 62,
      punctualityScore: 75,
    },
    flags: [
      {
        id: 'FLAG-004',
        type: 'financial',
        severity: 'high',
        description: 'Unusual refund patterns detected',
        timestamp: '2026-02-05T08:00:00',
        resolved: false,
      },
    ],
    trend: 'declining',
    lastUpdated: '2026-02-05T14:05:00',
  },
];

const SCORE_DISTRIBUTION_DATA = [
  { range: '0-20', count: 8 },
  { range: '21-40', count: 15 },
  { range: '41-60', count: 45 },
  { range: '61-80', count: 234 },
  { range: '81-100', count: 945 },
];

const TREND_DATA = [
  { month: 'Aug', avgScore: 84.2 },
  { month: 'Sep', avgScore: 85.1 },
  { month: 'Oct', avgScore: 85.8 },
  { month: 'Nov', avgScore: 86.4 },
  { month: 'Dec', avgScore: 86.9 },
  { month: 'Jan', avgScore: 87.3 },
];

const RISK_DISTRIBUTION_DATA = [
  { name: 'Low Risk', value: 1057, color: '#22c55e' },
  { name: 'Medium Risk', value: 156, color: '#f59e0b' },
  { name: 'High Risk', value: 34, color: '#ef4444' },
];

const TrustScorePage = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [showResolvedFlags, setShowResolvedFlags] = useState(false);
  const [metrics, setMetrics] = useState<TrustScoreMetrics>(MOCK_METRICS);
  const [drivers, setDrivers] = useState<DriverTrustScore[]>(MOCK_DRIVERS);

  // Check feature flag
  useEffect(() => {
    if (!isFeatureEnabled('trust-score')) {
      router.push('/dashboard');
    }
  }, [router]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics((prev) => ({
        ...prev,
        flaggedToday: prev.flaggedToday + Math.floor(Math.random() * 2),
      }));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Filter drivers
  const filteredDrivers = useMemo(() => {
    return drivers.filter((driver) => {
      const matchesSearch =
        driver.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.driverId.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRisk =
        riskFilter === 'all' || driver.riskLevel === riskFilter;

      return matchesSearch && matchesRisk;
    });
  }, [drivers, searchTerm, riskFilter]);

  const getRiskBadgeColor = (
    level: 'low' | 'medium' | 'high'
  ): 'default' | 'secondary' | 'destructive' => {
    switch (level) {
      case 'low':
        return 'default';
      case 'medium':
        return 'secondary';
      case 'high':
        return 'destructive';
    }
  };

  const getTrendIcon = (trend: 'improving' | 'declining' | 'stable') => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'stable':
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getFlagSeverityColor = (
    severity: 'low' | 'medium' | 'high' | 'critical'
  ) => {
    switch (severity) {
      case 'low':
        return 'bg-blue-100 text-blue-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-600" />
            Trust Score Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Monitor driver trust scores and risk indicators
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Trust Score
            </CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.averageTrustScore}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              +{metrics.scoreImprovement}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Drivers</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {metrics.highRisk}
            </div>
            <p className="text-xs text-muted-foreground">
              {((metrics.highRisk / metrics.totalDrivers) * 100).toFixed(1)}% of
              total drivers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Medium Risk Drivers
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {metrics.mediumRisk}
            </div>
            <p className="text-xs text-muted-foreground">
              {((metrics.mediumRisk / metrics.totalDrivers) * 100).toFixed(1)}% of
              total drivers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flagged Today</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.flaggedToday}</div>
            <p className="text-xs text-muted-foreground">
              Requires immediate attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Trust Score Trend (6 Months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={TREND_DATA}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[80, 90]} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="avgScore"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Average Score"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Risk Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Risk Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={RISK_DISTRIBUTION_DATA}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {RISK_DISTRIBUTION_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Score Distribution Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Trust Score Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={SCORE_DISTRIBUTION_DATA}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#3b82f6" name="Number of Drivers" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Driver Trust Scores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by driver name or ID..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-4 py-2 border rounded-lg"
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
            >
              <option value="all">All Risk Levels</option>
              <option value="low">Low Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="high">High Risk</option>
            </select>
            <Button
              variant={showResolvedFlags ? 'default' : 'outline'}
              onClick={() => setShowResolvedFlags(!showResolvedFlags)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {showResolvedFlags ? 'Hide Resolved' : 'Show Resolved'}
            </Button>
          </div>

          {/* Driver List */}
          <div className="space-y-4">
            {filteredDrivers.map((driver) => (
              <Card key={driver.driverId} className="border-l-4 border-l-blue-500">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">
                          {driver.driverName}
                        </h3>
                        <Badge variant={getRiskBadgeColor(driver.riskLevel)}>
                          {driver.riskLevel.toUpperCase()} RISK
                        </Badge>
                        {getTrendIcon(driver.trend)}
                      </div>
                      <p className="text-sm text-gray-500">{driver.driverId}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold">{driver.overallScore}</div>
                      <p className="text-xs text-gray-500">Trust Score</p>
                    </div>
                  </div>

                  {/* Component Scores */}
                  <div className="grid grid-cols-5 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Customer Rating</p>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="font-semibold">
                          {driver.components.customerRating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Completion</p>
                      <span className="font-semibold">
                        {driver.components.completionRate}%
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Compliance</p>
                      <span className="font-semibold">
                        {driver.components.complianceScore}%
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Safety</p>
                      <span className="font-semibold">
                        {driver.components.safetyScore}%
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Punctuality</p>
                      <span className="font-semibold">
                        {driver.components.punctualityScore}%
                      </span>
                    </div>
                  </div>

                  {/* Flags */}
                  {driver.flags.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        Active Flags ({driver.flags.filter((f) => !f.resolved).length})
                      </p>
                      <div className="space-y-2">
                        {driver.flags
                          .filter((flag) => showResolvedFlags || !flag.resolved)
                          .map((flag) => (
                            <div
                              key={flag.id}
                              className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                            >
                              {flag.resolved ? (
                                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                              )}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span
                                    className={`text-xs px-2 py-1 rounded ${getFlagSeverityColor(
                                      flag.severity
                                    )}`}
                                  >
                                    {flag.severity.toUpperCase()}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {flag.type}
                                  </span>
                                  {flag.resolved && (
                                    <Badge variant="outline" className="text-xs">
                                      Resolved
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm">{flag.description}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(flag.timestamp).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    {driver.flags.some((f) => !f.resolved) && (
                      <Button variant="outline" size="sm">
                        Resolve Flags
                      </Button>
                    )}
                  </div>

                  <p className="text-xs text-gray-400 mt-2">
                    Last updated: {new Date(driver.lastUpdated).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredDrivers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No drivers found matching your filters
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TrustScorePage;
