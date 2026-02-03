'use client';

import React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/xpress/card';
import type { EarningsTrendData } from './types';

export interface EarningsTrendChartProps {
  data: EarningsTrendData[];
  title?: string;
  chartType?: 'line' | 'area';
  showTrips?: boolean;
  isLoading?: boolean;
}

const EarningsTrendChart: React.FC<EarningsTrendChartProps> = ({
  data,
  title = 'Earnings Trend',
  chartType = 'area',
  showTrips = false,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="animate-pulse text-neutral-400">Loading chart...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-neutral-400">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (value: number) => {
    return `₱${value.toLocaleString('en-PH', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  {showTrips && (
                    <linearGradient id="colorTrips" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  )}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  tickFormatter={formatCurrency}
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    name === 'amount' ? formatCurrency(value) : value,
                    name === 'amount' ? 'Earnings' : 'Trips',
                  ]}
                  labelFormatter={formatDate}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '8px 12px',
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="amount"
                  name="Earnings"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#colorEarnings)"
                />
                {showTrips && (
                  <Area
                    type="monotone"
                    dataKey="trips"
                    name="Trips"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#colorTrips)"
                  />
                )}
              </AreaChart>
            ) : (
              <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  tickFormatter={formatCurrency}
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    name === 'amount' ? formatCurrency(value) : value,
                    name === 'amount' ? 'Earnings' : 'Trips',
                  ]}
                  labelFormatter={formatDate}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '8px 12px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="amount"
                  name="Earnings"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                {showTrips && (
                  <Line
                    type="monotone"
                    dataKey="trips"
                    name="Trips"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                )}
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default EarningsTrendChart;
