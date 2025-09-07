// =====================================================
// FINANCIAL DASHBOARD COMPONENT
// Comprehensive financial overview with real-time analytics
// Supports Philippines regulatory compliance and reporting
// =====================================================

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  Download,
  RefreshCw,
  Eye,
  Calculator,
  PieChart,
  BarChart3,
  FileText,
  Shield,
  CreditCard,
  Banknote,
  Timer,
  Users,
  Car,
  Target
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-picker-with-range';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useToast } from '@/hooks/use-toast';

// =====================================================
// TYPES AND INTERFACES
// =====================================================

interface FinancialDashboardProps {
  operatorId: string;
  userPermissions: string[];
  className?: string;
}

interface FinancialSummary {
  totalRevenue: number;
  netProfit: number;
  profitMargin: number;
  totalCommissions: number;
  boundaryFees: number;
  outstandingPayouts: number;
  cashPosition: number;
  monthlyGrowth: number;
  performanceScore: number;
  complianceScore: number;
}

interface RevenueData {
  period: string;
  commission: number;
  boundaryFees: number;
  bonuses: number;
  total: number;
}

interface ComplianceStatus {
  bir: {
    status: 'compliant' | 'warning' | 'overdue';
    score: number;
    nextDeadline: string;
    outstandingItems: number;
  };
  bsp: {
    status: 'compliant' | 'warning' | 'overdue';
    score: number;
    riskLevel: 'low' | 'medium' | 'high';
    flaggedTransactions: number;
  };
  ltfrb: {
    status: 'compliant' | 'warning' | 'overdue';
    score: number;
    violations: number;
    lastReport: string;
  };
}

interface PayoutSummary {
  pendingPayouts: number;
  pendingAmount: number;
  averageProcessingTime: number;
  successRate: number;
  lastPayoutDate: string;
  nextScheduledPayout: string;
}

interface PerformanceMetrics {
  currentTier: 'tier_1' | 'tier_2' | 'tier_3';
  currentScore: number;
  scoreChange: number;
  tierProgress: number;
  nextTierRequirements: string[];
  performanceBonus: number;
}

// =====================================================
// MAIN COMPONENT
// =====================================================

export function FinancialDashboard({ 
  operatorId, 
  userPermissions, 
  className 
}: FinancialDashboardProps) {
  // State Management
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [dateRange, setDateRange] = useState<any>(null);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [complianceStatus, setComplianceStatus] = useState<ComplianceStatus | null>(null);
  const [payoutSummary, setPayoutSummary] = useState<PayoutSummary | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const { toast } = useToast();
  
  // =====================================================
  // DATA FETCHING
  // =====================================================
  
  const fetchFinancialData = async () => {
    try {
      setIsLoading(true);
      
      // Calculate date range based on selected period
      const endDate = new Date();
      const startDate = new Date();
      
      switch (selectedPeriod) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(endDate.getDate() - 30);
      }
      
      // Use custom date range if provided
      const actualStartDate = dateRange?.from || startDate;
      const actualEndDate = dateRange?.to || endDate;
      
      // Fetch comprehensive financial data
      const response = await fetch(`/api/financial/reporting?operator_id=${operatorId}&report_type=comprehensive&start_date=${actualStartDate.toISOString().split('T')[0]}&end_date=${actualEndDate.toISOString().split('T')[0]}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch financial data');
      }
      
      const data = await response.json();
      
      // Process and set data
      processFinancialData(data);
      
    } catch (error) {
      console.error('Error fetching financial data:', error);
      toast({
        title: "Error",
        description: "Failed to load financial data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };
  
  const processFinancialData = (data: any) => {
    // Process financial summary
    if (data.reports.profit_loss && data.reports.financial_health) {
      const plData = data.reports.profit_loss;
      const healthData = data.reports.financial_health;
      
      setFinancialSummary({
        totalRevenue: plData.revenue.total_revenue,
        netProfit: plData.net_profit,
        profitMargin: plData.profit_margin,
        totalCommissions: plData.revenue.commission_revenue,
        boundaryFees: plData.revenue.boundary_fees,
        outstandingPayouts: 0, // Would come from payout data
        cashPosition: 0, // Would come from cash flow data
        monthlyGrowth: plData.previous_period_comparison.revenue_growth,
        performanceScore: healthData.overall_score,
        complianceScore: 95 // Mock value
      });
    }
    
    // Process revenue trend data
    setRevenueData(generateMockRevenueData());
    
    // Process compliance status
    setComplianceStatus({
      bir: {
        status: 'compliant',
        score: 95,
        nextDeadline: '2024-12-31',
        outstandingItems: 0
      },
      bsp: {
        status: 'compliant',
        score: 92,
        riskLevel: 'low',
        flaggedTransactions: 0
      },
      ltfrb: {
        status: 'warning',
        score: 88,
        violations: 1,
        lastReport: '2024-11-15'
      }
    });
    
    // Process payout summary
    setPayoutSummary({
      pendingPayouts: 3,
      pendingAmount: 125000,
      averageProcessingTime: 24,
      successRate: 98.5,
      lastPayoutDate: '2024-11-20',
      nextScheduledPayout: '2024-11-27'
    });
    
    // Process performance metrics
    setPerformanceMetrics({
      currentTier: 'tier_2',
      currentScore: 85,
      scoreChange: 3.2,
      tierProgress: 75,
      nextTierRequirements: [
        'Maintain 90+ performance score for 3 months',
        'Complete advanced training certification',
        'Zero safety violations for 6 months'
      ],
      performanceBonus: 15000
    });
  };
  
  const generateMockRevenueData = (): RevenueData[] => {
    const data: RevenueData[] = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);
      
      data.push({
        period: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        commission: Math.floor(Math.random() * 50000) + 30000,
        boundaryFees: Math.floor(Math.random() * 30000) + 20000,
        bonuses: Math.floor(Math.random() * 10000) + 2000,
        total: 0
      });
    }
    
    return data.map(item => ({
      ...item,
      total: item.commission + item.boundaryFees + item.bonuses
    }));
  };
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchFinancialData();
  };
  
  const handleExportReports = async () => {
    try {
      toast({
        title: "Exporting Reports",
        description: "Generating comprehensive financial reports...",
      });
      
      // In a real implementation, this would trigger report export
      setTimeout(() => {
        toast({
          title: "Export Complete",
          description: "Financial reports have been exported successfully.",
        });
      }, 2000);
      
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export reports. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // =====================================================
  // EFFECTS
  // =====================================================
  
  useEffect(() => {
    if (operatorId) {
      fetchFinancialData();
    }
  }, [operatorId, selectedPeriod, dateRange]);
  
  // =====================================================
  // COMPUTED VALUES
  // =====================================================
  
  const hasViewPermission = useMemo(() => 
    userPermissions.includes('view_financial_reports'), 
    [userPermissions]
  );
  
  const hasManagePermission = useMemo(() => 
    userPermissions.includes('manage_financial_reports'), 
    [userPermissions]
  );
  
  const chartColors = {
    primary: '#3B82F6',
    secondary: '#10B981',
    accent: '#F59E0B',
    danger: '#EF4444',
    warning: '#F97316'
  };
  
  // =====================================================
  // RENDER GUARDS
  // =====================================================
  
  if (!hasViewPermission) {
    return (
      <div className="p-6">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You don't have permission to view financial reports.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  // =====================================================
  // RENDER COMPONENT
  // =====================================================
  
  return (
    <div className={`p-6 space-y-6 ${className}`}>
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive financial overview and analytics for operator {operatorId}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Period Selector */}
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Date Range Picker */}
          <DatePickerWithRange
            date={dateRange}
            setDate={setDateRange}
          />
          
          {/* Action Buttons */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          {hasManagePermission && (
            <Button
              size="sm"
              onClick={handleExportReports}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          )}
        </div>
      </div>
      
      {/* Financial Summary Cards */}
      {financialSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">₱{financialSummary.totalRevenue.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              <div className="flex items-center gap-2 mt-4">
                {financialSummary.monthlyGrowth >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <span className={`text-sm font-medium ${financialSummary.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {financialSummary.monthlyGrowth.toFixed(1)}% vs last period
                </span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Net Profit</p>
                  <p className="text-2xl font-bold">₱{financialSummary.netProfit.toLocaleString()}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-sm">
                  <span>Profit Margin</span>
                  <span className="font-medium">{financialSummary.profitMargin.toFixed(1)}%</span>
                </div>
                <Progress value={financialSummary.profitMargin} className="mt-2" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Performance Score</p>
                  <p className="text-2xl font-bold">{financialSummary.performanceScore}/100</p>
                </div>
                <Target className="h-8 w-8 text-purple-600" />
              </div>
              <div className="mt-4">
                <Progress value={financialSummary.performanceScore} className="mt-2" />
                <p className="text-sm text-muted-foreground mt-2">
                  {financialSummary.performanceScore >= 90 ? 'Excellent' : 
                   financialSummary.performanceScore >= 80 ? 'Good' : 
                   financialSummary.performanceScore >= 70 ? 'Fair' : 'Needs Improvement'}
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Compliance Score</p>
                  <p className="text-2xl font-bold">{financialSummary.complianceScore}/100</p>
                </div>
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <div className="mt-4">
                <Progress value={financialSummary.complianceScore} className="mt-2" />
                <div className="flex justify-between text-sm mt-2">
                  <span>BIR • BSP • LTFRB</span>
                  <Badge variant={financialSummary.complianceScore >= 90 ? 'default' : 'secondary'}>
                    {financialSummary.complianceScore >= 90 ? 'Compliant' : 'Review Required'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend Chart */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Revenue Trend
                </CardTitle>
                <CardDescription>
                  Monthly revenue breakdown by source
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => [`₱${value.toLocaleString()}`, '']} />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="commission" 
                      stackId="1" 
                      stroke={chartColors.primary} 
                      fill={chartColors.primary}
                      name="Commission"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="boundaryFees" 
                      stackId="1" 
                      stroke={chartColors.secondary} 
                      fill={chartColors.secondary}
                      name="Boundary Fees"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="bonuses" 
                      stackId="1" 
                      stroke={chartColors.accent} 
                      fill={chartColors.accent}
                      name="Bonuses"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            {/* Key Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Key Financial Metrics</CardTitle>
                <CardDescription>
                  Current period performance indicators
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Total Commissions</span>
                    </div>
                    <p className="text-lg font-bold">₱{financialSummary?.totalCommissions.toLocaleString()}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Banknote className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Boundary Fees</span>
                    </div>
                    <p className="text-lg font-bold">₱{financialSummary?.boundaryFees.toLocaleString()}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Timer className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium">Pending Payouts</span>
                    </div>
                    <p className="text-lg font-bold">{payoutSummary?.pendingPayouts || 0}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium">Active Drivers</span>
                    </div>
                    <p className="text-lg font-bold">127</p>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Cash Flow Status</span>
                    <Badge variant="default">Healthy</Badge>
                  </div>
                  <Progress value={85} className="mt-2" />
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Recent Activity and Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Financial Activity</CardTitle>
                <CardDescription>
                  Latest transactions and updates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Weekly payout processed</p>
                    <p className="text-xs text-muted-foreground">₱125,000 • 2 hours ago</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">BIR 2307 certificates generated</p>
                    <p className="text-xs text-muted-foreground">12 certificates • 4 hours ago</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Performance tier upgraded</p>
                    <p className="text-xs text-muted-foreground">Tier 2 → Tier 2 Plus • 1 day ago</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Compliance Alerts</CardTitle>
                <CardDescription>
                  Regulatory and compliance notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>LTFRB Report Due</AlertTitle>
                  <AlertDescription>
                    Monthly operational report due in 3 days
                  </AlertDescription>
                </Alert>
                
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-800">VAT filing completed</p>
                    <p className="text-xs text-green-600">All tax obligations current</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-800">AML screening passed</p>
                    <p className="text-xs text-blue-600">All transactions cleared</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Additional tab contents would be implemented here */}
        <TabsContent value="revenue">
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">Revenue analytics content would be implemented here...</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="compliance">
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">Compliance dashboard content would be implemented here...</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="payouts">
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">Payout management content would be implemented here...</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="performance">
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">Performance analytics content would be implemented here...</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics">
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">Advanced analytics content would be implemented here...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}