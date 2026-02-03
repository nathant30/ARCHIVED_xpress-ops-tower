'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DollarSign,
  Car,
  Users,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import {
  LineChart,
  Line,
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
  ResponsiveContainer,
} from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

interface KPIData {
  label: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down';
  icon: React.ReactNode;
  color: string;
}

interface DateRange {
  startDate: Date;
  endDate: Date;
  label: string;
}

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(false);
  const [selectedRange, setSelectedRange] = useState<string>('month');
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: subDays(new Date(), 30),
    endDate: new Date(),
    label: 'Last 30 Days',
  });

  // Date range presets
  const dateRangePresets = [
    { id: 'today', label: 'Today', days: 0 },
    { id: 'week', label: 'Last 7 Days', days: 7 },
    { id: 'month', label: 'Last 30 Days', days: 30 },
    { id: 'quarter', label: 'Last 90 Days', days: 90 },
  ];

  const handleRangeChange = (rangeId: string) => {
    setSelectedRange(rangeId);
    const preset = dateRangePresets.find((p) => p.id === rangeId);
    if (preset) {
      setDateRange({
        startDate: preset.days === 0 ? startOfDay(new Date()) : subDays(new Date(), preset.days),
        endDate: endOfDay(new Date()),
        label: preset.label,
      });
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLoading(false);
  };

  const handleExportCSV = () => {
    // TODO: Implement CSV export
    console.log('Exporting CSV...');
  };

  // Mock KPI data
  const kpis: KPIData[] = [
    {
      label: 'Total Revenue',
      value: '₱2,847,500',
      change: 15.3,
      trend: 'up',
      icon: <DollarSign className="h-5 w-5" />,
      color: 'text-green-600',
    },
    {
      label: 'Total Rides',
      value: '18,942',
      change: 12.7,
      trend: 'up',
      icon: <Car className="h-5 w-5" />,
      color: 'text-blue-600',
    },
    {
      label: 'Active Drivers',
      value: '1,247',
      change: 8.5,
      trend: 'up',
      icon: <Users className="h-5 w-5" />,
      color: 'text-purple-600',
    },
    {
      label: 'Fleet Utilization',
      value: '78.3%',
      change: 5.2,
      trend: 'up',
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'text-orange-600',
    },
  ];

  // Mock revenue chart data
  const revenueData = Array.from({ length: 30 }, (_, i) => ({
    date: format(subDays(new Date(), 29 - i), 'MMM dd'),
    revenue: Math.floor(Math.random() * 50000) + 70000,
  }));

  // Mock rides chart data
  const ridesData = Array.from({ length: 30 }, (_, i) => ({
    date: format(subDays(new Date(), 29 - i), 'MMM dd'),
    rides: Math.floor(Math.random() * 300) + 500,
  }));

  // Mock driver performance data
  const driverPerformance = Array.from({ length: 20 }, (_, i) => ({
    id: `DRV-${String(i + 1).padStart(4, '0')}`,
    name: `Driver ${i + 1}`,
    rides: Math.floor(Math.random() * 200) + 100,
    revenue: Math.floor(Math.random() * 50000) + 30000,
    rating: (Math.random() * 0.5 + 4.5).toFixed(2),
  }));

  // Mock fleet utilization data
  const fleetUtilization = [
    { name: 'Motorcycle', value: 542, color: '#3b82f6' },
    { name: 'Car', value: 398, color: '#10b981' },
    { name: 'SUV', value: 189, color: '#f59e0b' },
    { name: 'Taxi', value: 118, color: '#ef4444' },
  ];

  const formatCurrency = (value: number) => {
    return `₱${value.toLocaleString('en-PH')}`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Analytics Dashboard</h1>
          <p className="text-neutral-600 mt-1">
            Comprehensive metrics and insights for {dateRange.label.toLowerCase()}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Date Range Picker */}
      <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-neutral-200 w-fit">
        {dateRangePresets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handleRangeChange(preset.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedRange === preset.id
                ? 'bg-blue-600 text-white'
                : 'text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg bg-opacity-10 ${kpi.color}`}>{kpi.icon}</div>
                <div className="flex items-center gap-1 text-sm">
                  {kpi.trend === 'up' ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <span
                    className={`font-semibold ${
                      kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {kpi.change}%
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-neutral-600">{kpi.label}</p>
                <p className="text-2xl font-bold text-neutral-900">{kpi.value}</p>
              </div>
              <p className="text-xs text-neutral-500 mt-2">vs. previous period</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row 1: Revenue and Rides */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis
                  dataKey="date"
                  stroke="#666"
                  fontSize={12}
                  tickFormatter={(value) => value.split(' ')[0]}
                />
                <YAxis
                  stroke="#666"
                  fontSize={12}
                  tickFormatter={(value) => `₱${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: any) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e5e5',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  name="Revenue"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Rides Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Rides Completed (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ridesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis
                  dataKey="date"
                  stroke="#666"
                  fontSize={12}
                  tickFormatter={(value) => value.split(' ')[0]}
                />
                <YAxis stroke="#666" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e5e5',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="rides" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Rides" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2: Driver Performance and Fleet Utilization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Driver Performance Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Top 20 Drivers by Rides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="text-left py-3 px-2 font-semibold text-neutral-700">Driver ID</th>
                    <th className="text-left py-3 px-2 font-semibold text-neutral-700">Name</th>
                    <th className="text-right py-3 px-2 font-semibold text-neutral-700">Rides</th>
                    <th className="text-right py-3 px-2 font-semibold text-neutral-700">Revenue</th>
                    <th className="text-right py-3 px-2 font-semibold text-neutral-700">Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {driverPerformance.map((driver, index) => (
                    <tr key={driver.id} className="hover:bg-neutral-50">
                      <td className="py-3 px-2 text-neutral-600">{driver.id}</td>
                      <td className="py-3 px-2 font-medium text-neutral-900">{driver.name}</td>
                      <td className="py-3 px-2 text-right text-neutral-900 font-semibold">
                        {driver.rides}
                      </td>
                      <td className="py-3 px-2 text-right text-neutral-900">
                        {formatCurrency(driver.revenue)}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                          ⭐ {driver.rating}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Fleet Utilization Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Fleet Utilization by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={fleetUtilization}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {fleetUtilization.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {fleetUtilization.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-neutral-700">{item.name}</span>
                  </div>
                  <span className="font-semibold text-neutral-900">{item.value} rides</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
