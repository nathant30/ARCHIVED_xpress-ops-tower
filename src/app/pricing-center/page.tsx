/**
 * Xpress Ops Tower - Pricing Center Executive Dashboard
 * Next.js 15+ Server Component with Client Components
 * Based on PRD v1.0 - September 2025
 */

import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  AlertTriangle, 
  Shield, 
  Activity, 
  DollarSign, 
  Users, 
  MapPin,
  BarChart3,
  Settings,
  Bell,
  Play,
  Pause,
  RefreshCw,
  Eye,
  FileText,
  Zap,
  Car
} from 'lucide-react';

// Client Components (these will be moved to separate files)
import { RealTimePricingMap } from './components/RealTimePricingMap';
import { ExecutiveOverridePanel } from './components/ExecutiveOverridePanel';
import { ComplianceDashboard } from './components/ComplianceDashboard';
import { SimulationEngine } from './components/SimulationEngine';
import { PricingAnalytics } from './components/PricingAnalytics';
import { PricingProfilesManager } from './components/PricingProfilesManager';

// ============================================================================
// SERVER COMPONENT - MAIN PAGE
// ============================================================================

export default async function PricingCenterPage() {
  // Fetch server-side data
  const [
    dashboardMetrics,
    activeOverrides,
    complianceStatus,
    surgeZones,
    recentAlerts
  ] = await Promise.all([
    fetchDashboardMetrics(),
    fetchActiveOverrides(),
    fetchComplianceStatus(),
    fetchActiveSurgeZones(),
    fetchRecentAlerts()
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Xpress Ops Tower
              </h1>
              <p className="text-slate-600 dark:text-slate-300">
                Pricing Center • Executive Control Dashboard
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* System Status Indicator */}
              <div className="flex items-center space-x-2">
                <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  System Operational
                </span>
              </div>
              
              {/* Real-time Clock */}
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {new Date().toLocaleString('en-PH', {
                  timeZone: 'Asia/Manila',
                  hour12: true,
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </div>
              
              {/* Notification Bell */}
              <Button variant="outline" size="sm" className="relative">
                <Bell className="h-4 w-4" />
                {recentAlerts.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs">
                    {recentAlerts.length}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        {/* Key Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <MetricCard
            title="Revenue Today"
            value={`₱${dashboardMetrics.revenue_today.toLocaleString()}`}
            change={`+${dashboardMetrics.revenue_change_pct}%`}
            changeType="positive"
            icon={<DollarSign className="h-6 w-6 text-green-600" />}
          />
          
          <MetricCard
            title="Active Trips"
            value={dashboardMetrics.active_trips.toLocaleString()}
            change={`${dashboardMetrics.active_trips_change > 0 ? '+' : ''}${dashboardMetrics.active_trips_change}`}
            changeType={dashboardMetrics.active_trips_change > 0 ? "positive" : "negative"}
            icon={<Car className="h-6 w-6 text-blue-600" />}
          />
          
          <MetricCard
            title="Avg Fare"
            value={`₱${dashboardMetrics.avg_fare.toFixed(2)}`}
            change={`${dashboardMetrics.avg_fare_change_pct > 0 ? '+' : ''}${dashboardMetrics.avg_fare_change_pct}%`}
            changeType={dashboardMetrics.avg_fare_change_pct > 0 ? "positive" : "negative"}
            icon={<BarChart3 className="h-6 w-6 text-purple-600" />}
          />
          
          <MetricCard
            title="Surge Active"
            value={`${surgeZones.active_count}/${surgeZones.total_count}`}
            subtitle="zones"
            icon={<Zap className="h-6 w-6 text-orange-600" />}
            status={surgeZones.active_count > 10 ? "warning" : "normal"}
          />
          
          <MetricCard
            title="Compliance"
            value={`${complianceStatus.score}%`}
            change={complianceStatus.trend}
            changeType={complianceStatus.score >= 95 ? "positive" : "negative"}
            icon={<Shield className="h-6 w-6 text-green-600" />}
          />
          
          <MetricCard
            title="Active Overrides"
            value={activeOverrides.count.toString()}
            subtitle={activeOverrides.count > 0 ? "requiring attention" : "all clear"}
            icon={<Settings className="h-6 w-6 text-red-600" />}
            status={activeOverrides.count > 0 ? "attention" : "normal"}
          />
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-7 mb-8">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="pricing-map" className="flex items-center space-x-2">
              <MapPin className="h-4 w-4" />
              <span>Live Pricing</span>
            </TabsTrigger>
            <TabsTrigger value="profiles" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Pricing Profiles</span>
            </TabsTrigger>
            <TabsTrigger value="overrides" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Executive Controls</span>
            </TabsTrigger>
            <TabsTrigger value="compliance" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Compliance</span>
            </TabsTrigger>
            <TabsTrigger value="simulation" className="flex items-center space-x-2">
              <Play className="h-4 w-4" />
              <span>Simulation</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Analytics</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Performance Chart */}
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Revenue Performance
                    <Button variant="ghost" size="sm">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<div className="h-64 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />}>
                    <RevenueChart data={dashboardMetrics.revenue_trend} />
                  </Suspense>
                </CardContent>
              </Card>

              {/* Market Heat Map */}
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Market Activity Heat Map</CardTitle>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<div className="h-64 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />}>
                    <MarketHeatMap zones={surgeZones.zones} />
                  </Suspense>
                </CardContent>
              </Card>
            </div>

            {/* Service Performance Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {dashboardMetrics.service_performance.map((service) => (
                <ServicePerformanceCard 
                  key={service.service_type}
                  service={service}
                />
              ))}
            </div>

            {/* Recent Activity & Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RecentActivityCard activities={dashboardMetrics.recent_activities} />
              <AlertsCard alerts={recentAlerts} />
            </div>
          </TabsContent>

          {/* Live Pricing Map Tab */}
          <TabsContent value="pricing-map" className="space-y-6">
            <Card className="h-[calc(100vh-16rem)]">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Real-Time Pricing Map
                  <div className="flex items-center space-x-2">
                    <Badge variant={surgeZones.active_count > 0 ? "destructive" : "secondary"}>
                      {surgeZones.active_count} Active Surge Zones
                    </Badge>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Fullscreen
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Suspense fallback={<div className="h-full bg-slate-100 dark:bg-slate-800 animate-pulse" />}>
                  <RealTimePricingMap initialData={surgeZones} />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pricing Profiles Tab */}
          <TabsContent value="profiles" className="space-y-6">
            <Suspense fallback={<div className="h-96 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />}>
              <PricingProfilesManager />
            </Suspense>
          </TabsContent>

          {/* Executive Controls Tab */}
          <TabsContent value="overrides" className="space-y-6">
            <Suspense fallback={<div className="h-96 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />}>
              <ExecutiveOverridePanel initialOverrides={activeOverrides} />
            </Suspense>
          </TabsContent>

          {/* Compliance Tab */}
          <TabsContent value="compliance" className="space-y-6">
            <Suspense fallback={<div className="h-96 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />}>
              <ComplianceDashboard initialStatus={complianceStatus} />
            </Suspense>
          </TabsContent>

          {/* Simulation Tab */}
          <TabsContent value="simulation" className="space-y-6">
            <Suspense fallback={<div className="h-96 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />}>
              <SimulationEngine />
            </Suspense>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Suspense fallback={<div className="h-96 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />}>
              <PricingAnalytics />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ============================================================================
// REUSABLE COMPONENTS
// ============================================================================

function MetricCard({ 
  title, 
  value, 
  change, 
  changeType, 
  subtitle,
  icon,
  status = "normal"
}: {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative";
  subtitle?: string;
  icon: React.ReactNode;
  status?: "normal" | "warning" | "attention";
}) {
  const statusColors = {
    normal: "border-slate-200 dark:border-slate-700",
    warning: "border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/20",
    attention: "border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-950/20"
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</div>
        <div className="ml-4">{icon}</div>
      </div>
      <div className="text-xl font-bold text-gray-900 mb-2">{value}</div>
      <div className="flex items-center justify-between">
        {change && (
          <div className={`flex items-center gap-1 text-xs font-medium ${
            changeType === "positive" 
              ? "text-emerald-600" 
              : "text-red-500"
          }`}>
            {changeType === "positive" ? 
              <TrendingUp className="w-3 h-3" /> : 
              <TrendingUp className="w-3 h-3 transform rotate-180" />
            }
            <span>{change}</span>
          </div>
        )}
        {subtitle && (
          <p className="text-xs text-gray-500">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

function ServicePerformanceCard({ service }: { service: any }) {
  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${getServiceColor(service.service_type)}`}>
            <Car className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 dark:text-white capitalize">
              {service.service_type.replace('_', ' ')}
            </p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">
              ₱{service.avg_fare.toFixed(0)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {service.trip_count} trips
            </p>
          </div>
          <div className="text-right">
            <Badge variant={service.surge_active ? "destructive" : "secondary"}>
              {service.surge_multiplier}x
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RecentActivityCard({ activities }: { activities: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Recent Activity
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.slice(0, 5).map((activity, index) => (
          <div key={index} className="flex items-center space-x-3 text-sm">
            <div className={`h-2 w-2 rounded-full ${getActivityColor(activity.type)}`} />
            <span className="flex-1">{activity.description}</span>
            <span className="text-slate-500 text-xs">{activity.time}</span>
          </div>
        ))}
        <Button variant="outline" size="sm" className="w-full mt-4">
          View All Activity
        </Button>
      </CardContent>
    </Card>
  );
}

function AlertsCard({ alerts }: { alerts: any[] }) {
  return (
    <Card className="border-orange-200 dark:border-orange-700">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-orange-800 dark:text-orange-200">
          <span className="flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2" />
            System Alerts
          </span>
          <Badge variant="destructive">{alerts.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.slice(0, 4).map((alert, index) => (
          <div key={index} className="flex items-start space-x-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
            <AlertTriangle className={`h-4 w-4 mt-0.5 ${getSeverityColor(alert.severity)}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {alert.title}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                {alert.description}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                {alert.timestamp}
              </p>
            </div>
          </div>
        ))}
        {alerts.length > 4 && (
          <Button variant="outline" size="sm" className="w-full">
            View {alerts.length - 4} More Alerts
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Mock chart components (would be replaced with actual chart library)
function RevenueChart({ data }: { data: any[] }) {
  return (
    <div className="h-64 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded">
      <div className="text-center">
        <BarChart3 className="h-12 w-12 text-slate-400 mx-auto mb-2" />
        <p className="text-slate-600 dark:text-slate-400">Revenue Chart Placeholder</p>
        <p className="text-xs text-slate-500">Chart library integration needed</p>
      </div>
    </div>
  );
}

function MarketHeatMap({ zones }: { zones: any[] }) {
  return (
    <div className="h-64 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded">
      <div className="text-center">
        <MapPin className="h-12 w-12 text-slate-400 mx-auto mb-2" />
        <p className="text-slate-600 dark:text-slate-400">Heat Map Placeholder</p>
        <p className="text-xs text-slate-500">Map integration needed</p>
      </div>
    </div>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getServiceColor(serviceType: string): string {
  const colors = {
    tnvs_standard: "bg-blue-500",
    tnvs_premium: "bg-purple-500",
    taxi_regular: "bg-yellow-500",
    taxi_premium: "bg-orange-500",
    mc_taxi: "bg-green-500"
  };
  return colors[serviceType as keyof typeof colors] || "bg-gray-500";
}

function getActivityColor(type: string): string {
  const colors = {
    override: "bg-red-500",
    surge_activation: "bg-orange-500",
    compliance: "bg-green-500",
    pricing_update: "bg-blue-500",
    alert: "bg-yellow-500"
  };
  return colors[type as keyof typeof colors] || "bg-gray-500";
}

function getSeverityColor(severity: string): string {
  const colors = {
    low: "text-green-500",
    medium: "text-yellow-500",
    high: "text-orange-500",
    critical: "text-red-500"
  };
  return colors[severity as keyof typeof colors] || "text-gray-500";
}

// ============================================================================
// SERVER-SIDE DATA FETCHING
// ============================================================================

async function fetchDashboardMetrics() {
  // In production, this would fetch from database/APIs
  return {
    revenue_today: 2847569,
    revenue_change_pct: 12.5,
    active_trips: 1247,
    active_trips_change: 45,
    avg_fare: 285.75,
    avg_fare_change_pct: -2.3,
    revenue_trend: [],
    recent_activities: [
      { type: 'surge_activation', description: 'Surge activated in Makati CBD', time: '2 min ago' },
      { type: 'override', description: 'Executive override applied to BGC area', time: '15 min ago' },
      { type: 'compliance', description: 'Daily compliance report submitted to LTFRB', time: '1 hour ago' },
      { type: 'pricing_update', description: 'Base fare updated for TNVS Premium', time: '2 hours ago' },
      { type: 'alert', description: 'High demand detected near NAIA Terminal 3', time: '3 hours ago' }
    ],
    service_performance: [
      {
        service_type: 'tnvs_standard',
        avg_fare: 285.50,
        trip_count: 567,
        surge_active: false,
        surge_multiplier: 1.0
      },
      {
        service_type: 'tnvs_premium',
        avg_fare: 445.75,
        trip_count: 234,
        surge_active: true,
        surge_multiplier: 1.5
      },
      {
        service_type: 'taxi_regular',
        avg_fare: 195.25,
        trip_count: 334,
        surge_active: false,
        surge_multiplier: 1.0
      },
      {
        service_type: 'taxi_premium',
        avg_fare: 275.80,
        trip_count: 78,
        surge_active: true,
        surge_multiplier: 1.2
      },
      {
        service_type: 'mc_taxi',
        avg_fare: 125.40,
        trip_count: 445,
        surge_active: false,
        surge_multiplier: 1.0
      }
    ]
  };
}

async function fetchActiveOverrides() {
  return {
    count: 2,
    overrides: []
  };
}

async function fetchComplianceStatus() {
  return {
    score: 97.2,
    trend: '+0.5%'
  };
}

async function fetchActiveSurgeZones() {
  return {
    active_count: 3,
    total_count: 25,
    zones: []
  };
}

async function fetchRecentAlerts() {
  return [
    {
      severity: 'medium',
      title: 'High Demand Detected',
      description: 'Unusual demand spike in Ortigas area',
      timestamp: '5 minutes ago'
    },
    {
      severity: 'low',
      title: 'Compliance Check',
      description: 'Daily LTFRB report due in 2 hours',
      timestamp: '1 hour ago'
    }
  ];
}