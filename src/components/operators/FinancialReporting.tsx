'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Wallet,
  Receipt,
  Target,
  Calendar,
  RefreshCw,
  Download,
  Filter,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  Banknote,
  PieChart as PieChartIcon
} from 'lucide-react';

import { OperatorAnalytics } from '@/types/operators';

interface FinancialReportingProps {
  analytics: OperatorAnalytics | null;
  language: 'en' | 'fil';
  refreshKey?: number;
  compact?: boolean;
}

interface RevenueData {
  period: string;
  commission: number;
  boundary_fees: number;
  incentives: number;
  total_revenue: number;
  growth_rate: number;
}

interface PayoutData {
  operator_id: string;
  business_name: string;
  total_earnings: number;
  commissions: number;
  bonuses: number;
  deductions: number;
  net_payout: number;
  status: string;
  due_date: string;
}

const FinancialReporting: React.FC<FinancialReportingProps> = ({
  analytics,
  language,
  refreshKey = 0,
  compact = false
}) => {
  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [payoutData, setPayoutData] = useState<PayoutData[]>([]);
  const [commissionBreakdown, setCommissionBreakdown] = useState<any[]>([]);

  // Translations
  const translations = {
    en: {
      title: 'Financial Reporting & Analytics',
      subtitle: 'Comprehensive financial oversight and commission management',
      totalRevenue: 'Total Revenue',
      totalCommissions: 'Total Commissions',
      totalBoundaryFees: 'Boundary Fees',
      totalIncentives: 'Incentives Paid',
      revenueGrowth: 'Revenue Growth',
      avgRevenue: 'Avg Revenue/Operator',
      revenueBreakdown: 'Revenue Breakdown',
      commissionTrends: 'Commission Trends',
      payoutSummary: 'Payout Summary',
      tierDistribution: 'Commission Tier Distribution',
      last7Days: 'Last 7 Days',
      last30Days: 'Last 30 Days',
      last90Days: 'Last 90 Days',
      thisYear: 'This Year',
      commissions: 'Commissions',
      boundaryFees: 'Boundary Fees',
      incentives: 'Incentives',
      deductions: 'Deductions',
      netPayout: 'Net Payout',
      pending: 'Pending',
      completed: 'Completed',
      processing: 'Processing',
      failed: 'Failed',
      refresh: 'Refresh',
      export: 'Export Report',
      viewDetails: 'View Details',
      generateReport: 'Generate Report',
      payoutStatus: 'Payout Status',
      dueDate: 'Due Date',
      businessName: 'Business Name',
      amount: 'Amount',
      status: 'Status',
      actions: 'Actions',
      totalOperatorEarnings: 'Total Operator Earnings',
      platformRevenue: 'Platform Revenue',
      payoutsPending: 'Payouts Pending',
      complianceRate: 'Compliance Rate'
    },
    fil: {
      title: 'Financial Reporting at Analytics',
      subtitle: 'Komprehensibong pagsubaybay sa pananalapi at pamamahala ng komisyon',
      totalRevenue: 'Kabuuang Kita',
      totalCommissions: 'Kabuuang Komisyon',
      totalBoundaryFees: 'Boundary Fees',
      totalIncentives: 'Mga Incentive na Nabayad',
      revenueGrowth: 'Pagtaas ng Kita',
      avgRevenue: 'Average na Kita/Operator',
      revenueBreakdown: 'Breakdown ng Kita',
      commissionTrends: 'Mga Trend sa Komisyon',
      payoutSummary: 'Buod ng Payout',
      tierDistribution: 'Distribusyon ng Commission Tier',
      last7Days: 'Huling 7 Araw',
      last30Days: 'Huling 30 Araw',
      last90Days: 'Huling 90 Araw',
      thisYear: 'Ngayong Taon',
      commissions: 'Mga Komisyon',
      boundaryFees: 'Boundary Fees',
      incentives: 'Mga Incentive',
      deductions: 'Mga Bawas',
      netPayout: 'Net Payout',
      pending: 'Naghihintay',
      completed: 'Tapos na',
      processing: 'Ginagawa',
      failed: 'Nabigo',
      refresh: 'I-refresh',
      export: 'I-export ang Report',
      viewDetails: 'Tingnan ang mga Detalye',
      generateReport: 'Gumawa ng Report',
      payoutStatus: 'Status ng Payout',
      dueDate: 'Due Date',
      businessName: 'Pangalan ng Negosyo',
      amount: 'Halaga',
      status: 'Status',
      actions: 'Mga Aksyon',
      totalOperatorEarnings: 'Kabuuang Kita ng mga Operator',
      platformRevenue: 'Kita ng Platform',
      payoutsPending: 'Mga Payout na Naghihintay',
      complianceRate: 'Compliance Rate'
    }
  };

  const t = translations[language];

  // Load financial data
  const loadFinancialData = async () => {
    try {
      setIsLoading(true);
      
      // Load revenue trends
      const revenueResponse = await fetch(`/api/operators/financial/revenue?period=${selectedPeriod}`);
      if (revenueResponse.ok) {
        const revenueData = await revenueResponse.json();
        setRevenueData(revenueData.trends || generateSampleRevenueData());
      } else {
        setRevenueData(generateSampleRevenueData());
      }
      
      // Load payout data
      const payoutResponse = await fetch('/api/operators/financial/payouts');
      if (payoutResponse.ok) {
        const payoutData = await payoutResponse.json();
        setPayoutData(payoutData.payouts || generateSamplePayoutData());
      } else {
        setPayoutData(generateSamplePayoutData());
      }
      
      // Load commission breakdown
      const commissionResponse = await fetch('/api/operators/financial/commission-breakdown');
      if (commissionResponse.ok) {
        const commissionData = await commissionResponse.json();
        setCommissionBreakdown(commissionData.breakdown || generateSampleCommissionData());
      } else {
        setCommissionBreakdown(generateSampleCommissionData());
      }
      
    } catch (error) {
      console.error('Failed to load financial data:', error);
      // Fallback to sample data
      setRevenueData(generateSampleRevenueData());
      setPayoutData(generateSamplePayoutData());
      setCommissionBreakdown(generateSampleCommissionData());
    } finally {
      setIsLoading(false);
    }
  };

  // Generate sample data
  const generateSampleRevenueData = (): RevenueData[] => {
    return Array.from({ length: 30 }, (_, i) => {
      const baseCommission = 150000 + Math.random() * 50000;
      const boundaryFees = 80000 + Math.random() * 30000;
      const incentives = 25000 + Math.random() * 15000;
      return {
        period: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        commission: baseCommission,
        boundary_fees: boundaryFees,
        incentives: incentives,
        total_revenue: baseCommission + boundaryFees + incentives,
        growth_rate: (Math.random() - 0.5) * 10
      };
    });
  };

  const generateSamplePayoutData = (): PayoutData[] => {
    const operators = [
      'Metro Manila Transport Co.',
      'Cebu Fleet Solutions',
      'Davao Ride Network',
      'Baguio Mountain Express',
      'Iloilo City Transport'
    ];
    
    return operators.map((name, i) => ({
      operator_id: `OP${String(i + 1).padStart(3, '0')}`,
      business_name: name,
      total_earnings: 85000 + Math.random() * 40000,
      commissions: 60000 + Math.random() * 25000,
      bonuses: 15000 + Math.random() * 10000,
      deductions: 5000 + Math.random() * 3000,
      net_payout: 70000 + Math.random() * 30000,
      status: ['pending', 'completed', 'processing'][Math.floor(Math.random() * 3)],
      due_date: new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString()
    }));
  };

  const generateSampleCommissionData = () => {
    return [
      { name: 'Tier 1 (Bronze)', value: 45, color: '#cd7f32' },
      { name: 'Tier 2 (Silver)', value: 35, color: '#c0c0c0' },
      { name: 'Tier 3 (Gold)', value: 20, color: '#ffd700' }
    ];
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

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat(language === 'fil' ? 'tl-PH' : 'en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Calculate financial metrics
  const totalRevenue = revenueData.reduce((sum, item) => sum + item.total_revenue, 0);
  const totalCommissions = revenueData.reduce((sum, item) => sum + item.commission, 0);
  const totalBoundaryFees = revenueData.reduce((sum, item) => sum + item.boundary_fees, 0);
  const totalIncentives = revenueData.reduce((sum, item) => sum + item.incentives, 0);
  const avgGrowthRate = revenueData.length > 0 
    ? revenueData.reduce((sum, item) => sum + item.growth_rate, 0) / revenueData.length 
    : 0;

  // Effects
  useEffect(() => {
    loadFinancialData();
  }, [selectedPeriod, refreshKey]);

  // Status color mapping
  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      processing: 'bg-blue-100 text-blue-800',
      failed: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  // Render compact version
  if (compact) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(analytics?.total_commissions_paid || 0)}
            </div>
            <p className="text-sm text-muted-foreground">{t.totalCommissions}</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(analytics?.avg_monthly_revenue_per_operator || 0)}
            </div>
            <p className="text-sm text-muted-foreground">{t.avgRevenue}</p>
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={revenueData.slice(-7)}>
            <Area 
              type="monotone" 
              dataKey="total_revenue" 
              stroke={colors.success} 
              fill={colors.success}
              fillOpacity={0.6}
            />
            <XAxis dataKey="period" hide />
            <YAxis hide />
            <Tooltip formatter={(value) => formatCurrency(value as number)} />
          </AreaChart>
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
            onClick={loadFinancialData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {t.refresh}
          </Button>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            {t.export}
          </Button>
          
          <Button size="sm">
            <FileText className="h-4 w-4 mr-2" />
            {t.generateReport}
          </Button>
        </div>
      </div>

      {/* Key Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t.totalRevenue}</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalRevenue)}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  {avgGrowthRate > 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`text-sm ${avgGrowthRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {avgGrowthRate > 0 ? '+' : ''}{avgGrowthRate.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t.totalCommissions}</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(totalCommissions)}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {((totalCommissions / totalRevenue) * 100).toFixed(1)}% of revenue
                  </span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Receipt className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t.totalBoundaryFees}</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {formatCurrency(totalBoundaryFees)}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {payoutData.filter(p => p.status === 'pending').length} pending
                  </span>
                </div>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Wallet className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t.totalIncentives}</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(totalIncentives)}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {analytics?.active_operators || 0} recipients
                  </span>
                </div>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t.revenueBreakdown}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis tickFormatter={(value) => `₱${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="commission"
                  stackId="1"
                  stroke={colors.primary}
                  fill={colors.primary}
                  name={t.commissions}
                />
                <Area
                  type="monotone"
                  dataKey="boundary_fees"
                  stackId="1"
                  stroke={colors.success}
                  fill={colors.success}
                  name={t.boundaryFees}
                />
                <Area
                  type="monotone"
                  dataKey="incentives"
                  stackId="1"
                  stroke={colors.warning}
                  fill={colors.warning}
                  name={t.incentives}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Commission Tier Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              {t.tierDistribution}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={commissionBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {commissionBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Payout Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {t.payoutSummary}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {payoutData.map((payout, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Banknote className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{payout.business_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {t.dueDate}: {new Date(payout.due_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-bold text-lg">{formatCurrency(payout.net_payout)}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Earnings: {formatCurrency(payout.total_earnings)}</span>
                      <span>•</span>
                      <span>Deductions: {formatCurrency(payout.deductions)}</span>
                    </div>
                  </div>
                  
                  <Badge className={getStatusColor(payout.status)}>
                    {t[payout.status as keyof typeof t] || payout.status}
                  </Badge>
                  
                  <Button size="sm" variant="outline">
                    {t.viewDetails}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialReporting;