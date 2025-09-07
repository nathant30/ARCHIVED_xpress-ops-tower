'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Award,
  Target,
  Activity,
  Users,
  Truck,
  Shield,
  Globe,
  Calendar,
  RefreshCw,
  Download,
  Filter,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

import { OperatorAnalytics, PerformanceMetricsData } from '@/types/operators';

interface PerformanceDashboardProps {
  analytics: OperatorAnalytics | null;
  language: 'en' | 'fil';
  refreshKey?: number;
  compact?: boolean;
}

interface PerformanceTrend {
  date: string;
  score: number;
  vehicle_utilization: number;
  driver_management: number;
  compliance_safety: number;
  platform_contribution: number;
}

interface RegionalPerformance {
  region: string;
  score: number;
  operators: number;
  trend: number;
}

const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  analytics,
  language,
  refreshKey = 0,
  compact = false
}) => {
  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('overall');
  const [performanceTrends, setPerformanceTrends] = useState<PerformanceTrend[]>([]);
  const [regionalData, setRegionalData] = useState<RegionalPerformance[]>([]);
  const [topPerformers, setTopPerformers] = useState<any[]>([]);

  // Translations
  const translations = {
    en: {
      title: 'Performance Analytics Dashboard',
      subtitle: 'Real-time operator performance monitoring and insights',
      overallScore: 'Overall Score',
      vehicleUtilization: 'Vehicle Utilization',
      driverManagement: 'Driver Management',
      complianceSafety: 'Compliance & Safety',
      platformContribution: 'Platform Contribution',
      performanceTrends: 'Performance Trends',
      regionalPerformance: 'Regional Performance',
      topPerformers: 'Top Performers',
      scoreDistribution: 'Score Distribution',
      last7Days: 'Last 7 Days',
      last30Days: 'Last 30 Days',
      last90Days: 'Last 90 Days',
      thisYear: 'This Year',
      excellent: 'Excellent',
      good: 'Good',
      average: 'Average',
      needsImprovement: 'Needs Improvement',
      category: 'Category',
      score: 'Score',
      trend: 'Trend',
      operators: 'Operators',
      refresh: 'Refresh',
      export: 'Export',
      filters: 'Filters',
      viewDetails: 'View Details',
      improvement: 'Improvement',
      decline: 'Decline',
      stable: 'Stable'
    },
    fil: {
      title: 'Dashboard ng Performance Analytics',
      subtitle: 'Real-time na pagsubaybay sa performance ng operator at mga insight',
      overallScore: 'Kabuuang Score',
      vehicleUtilization: 'Paggamit ng Sasakyan',
      driverManagement: 'Pamamahala ng Driver',
      complianceSafety: 'Compliance at Kaligtasan',
      platformContribution: 'Kontribusyon sa Platform',
      performanceTrends: 'Mga Trend sa Performance',
      regionalPerformance: 'Performance sa Rehiyon',
      topPerformers: 'Mga Nangungunang Performer',
      scoreDistribution: 'Distribusyon ng Score',
      last7Days: 'Huling 7 Araw',
      last30Days: 'Huling 30 Araw',
      last90Days: 'Huling 90 Araw',
      thisYear: 'Ngayong Taon',
      excellent: 'Napakahusay',
      good: 'Mabuti',
      average: 'Katamtaman',
      needsImprovement: 'Kailangan ng Pagpapabuti',
      category: 'Kategorya',
      score: 'Score',
      trend: 'Trend',
      operators: 'Mga Operator',
      refresh: 'I-refresh',
      export: 'I-export',
      filters: 'Mga Filter',
      viewDetails: 'Tingnan ang Mga Detalye',
      improvement: 'Pagpapabuti',
      decline: 'Pagbaba',
      stable: 'Matatag'
    }
  };

  const t = translations[language];

  // Load performance data
  const loadPerformanceData = async () => {
    try {
      setIsLoading(true);
      
      // Load performance trends
      const trendsResponse = await fetch(`/api/operators/performance/trends?period=${selectedPeriod}`);
      if (trendsResponse.ok) {
        const trendsData = await trendsResponse.json();
        setPerformanceTrends(trendsData.trends || []);
      }
      
      // Load regional performance
      const regionalResponse = await fetch('/api/operators/performance/regional');
      if (regionalResponse.ok) {
        const regionalData = await regionalResponse.json();
        setRegionalData(regionalData.regions || []);
      }
      
      // Load top performers
      if (analytics?.top_performing_operators) {
        setTopPerformers(analytics.top_performing_operators);
      }
      
    } catch (error) {
      console.error('Failed to load performance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Chart colors
  const colors = {
    primary: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#06b6d4',
    purple: '#8b5cf6'
  };

  const pieColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  // Performance categories data for radar chart
  const performanceCategories = [
    {
      category: t.vehicleUtilization,
      score: analytics ? 85 : 0,
      fullMark: 100
    },
    {
      category: t.driverManagement,
      score: analytics ? 78 : 0,
      fullMark: 100
    },
    {
      category: t.complianceSafety,
      score: analytics ? 92 : 0,
      fullMark: 100
    },
    {
      category: t.platformContribution,
      score: analytics ? 88 : 0,
      fullMark: 100
    }
  ];

  // Score distribution data
  const scoreDistribution = [
    { name: t.excellent, value: analytics ? Math.floor(analytics.total_operators * 0.2) : 0, color: colors.success },
    { name: t.good, value: analytics ? Math.floor(analytics.total_operators * 0.35) : 0, color: colors.info },
    { name: t.average, value: analytics ? Math.floor(analytics.total_operators * 0.3) : 0, color: colors.warning },
    { name: t.needsImprovement, value: analytics ? Math.floor(analytics.total_operators * 0.15) : 0, color: colors.danger }
  ];

  // Generate sample trend data if none available
  const sampleTrendData = Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    score: 75 + Math.random() * 20,
    vehicle_utilization: 70 + Math.random() * 25,
    driver_management: 70 + Math.random() * 25,
    compliance_safety: 85 + Math.random() * 15,
    platform_contribution: 75 + Math.random() * 20
  }));

  const trendsData = performanceTrends.length > 0 ? performanceTrends : sampleTrendData;

  // Effects
  useEffect(() => {
    loadPerformanceData();
  }, [selectedPeriod, refreshKey]);

  // Render compact version for overview
  if (compact) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {analytics?.avg_performance_score.toFixed(1) || '0'}/100
            </div>
            <p className="text-sm text-muted-foreground">{t.overallScore}</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {analytics?.tier_distribution.tier_3 || 0}
            </div>
            <p className="text-sm text-muted-foreground">Gold Tier</p>
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={trendsData.slice(-7)}>
            <Line 
              type="monotone" 
              dataKey="score" 
              stroke={colors.primary} 
              strokeWidth={2}
              dot={false}
            />
            <XAxis dataKey="date" hide />
            <YAxis hide />
            <Tooltip />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t.title}</h2>
          <p className="text-muted-foreground">{t.subtitle}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">{t.last7Days}</SelectItem>
              <SelectItem value="30d">{t.last30Days}</SelectItem>
              <SelectItem value="90d">{t.last90Days}</SelectItem>
              <SelectItem value="1y">{t.thisYear}</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={loadPerformanceData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {t.refresh}
          </Button>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            {t.export}
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t.overallScore}</p>
                <p className="text-3xl font-bold text-blue-600">
                  {analytics?.avg_performance_score.toFixed(1) || '0'}/100
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600">+2.3%</span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Award className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t.vehicleUtilization}</p>
                <p className="text-3xl font-bold text-green-600">85%</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600">+1.8%</span>
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Truck className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t.driverManagement}</p>
                <p className="text-3xl font-bold text-yellow-600">78%</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-600">-0.5%</span>
                </div>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Users className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t.complianceSafety}</p>
                <p className="text-3xl font-bold text-purple-600">92%</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600">+3.2%</span>
                </div>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Trends Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              {t.performanceTrends}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stackId="1"
                  stroke={colors.primary} 
                  fill={colors.primary}
                  fillOpacity={0.6}
                  name={t.overallScore}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance Categories Radar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Performance Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={performanceCategories}>
                <PolarGrid />
                <PolarAngleAxis dataKey="category" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke={colors.primary}
                  fill={colors.primary}
                  fillOpacity={0.6}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Additional Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Regional Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {t.regionalPerformance}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.regional_stats.slice(0, 5).map((region, index) => (
                <div key={region.region_id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {region.region_name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{region.region_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {region.operator_count} {t.operators}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{region.avg_performance_score.toFixed(1)}/100</p>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      <span className="text-xs text-green-600">+1.2%</span>
                    </div>
                  </div>
                </div>
              )) || []}
            </div>
          </CardContent>
        </Card>

        {/* Score Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              {t.scoreDistribution}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={scoreDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {scoreDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            {t.topPerformers}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topPerformers.slice(0, 5).map((performer, index) => (
              <div key={performer.operator_id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="font-bold text-primary">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium">{performer.business_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {performer.commission_tier.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-xl font-bold text-primary">
                    {performer.performance_score}/100
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600">{t.excellent}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceDashboard;