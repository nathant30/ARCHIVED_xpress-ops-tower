'use client';

import React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
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
  ResponsiveContainer
} from 'recharts';

interface PerformanceDataPoint {
  date: string;
  score: number;
  vehicle_utilization?: number;
  driver_management?: number;
  compliance_safety?: number;
  platform_contribution?: number;
}

interface PerformanceChartProps {
  data: PerformanceDataPoint[];
  type?: 'line' | 'area' | 'radar';
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  colors?: {
    primary?: string;
    secondary?: string;
    tertiary?: string;
    quaternary?: string;
  };
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({
  data,
  type = 'line',
  height = 300,
  showGrid = true,
  showLegend = true,
  colors = {
    primary: '#3b82f6',
    secondary: '#10b981',
    tertiary: '#f59e0b',
    quaternary: '#ef4444'
  }
}) => {
  // Custom tooltip for better formatting
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 mb-2">
            {type === 'radar' ? 'Category' : 'Date'}: {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div 
                className="w-3 h-3 rounded"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600">{entry.name}:</span>
              <span className="font-medium">{entry.value.toFixed(1)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Render line chart
  if (type === 'line') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => new Date(value).toLocaleDateString()}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            domain={[0, 100]}
          />
          <Tooltip content={<CustomTooltip />} />
          {showLegend && <Legend />}
          
          <Line
            type="monotone"
            dataKey="score"
            stroke={colors.primary}
            strokeWidth={2}
            dot={{ fill: colors.primary, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
            name="Overall Score"
          />
          
          {data[0]?.vehicle_utilization !== undefined && (
            <Line
              type="monotone"
              dataKey="vehicle_utilization"
              stroke={colors.secondary}
              strokeWidth={1.5}
              dot={{ fill: colors.secondary, strokeWidth: 2, r: 3 }}
              name="Vehicle Utilization"
            />
          )}
          
          {data[0]?.driver_management !== undefined && (
            <Line
              type="monotone"
              dataKey="driver_management"
              stroke={colors.tertiary}
              strokeWidth={1.5}
              dot={{ fill: colors.tertiary, strokeWidth: 2, r: 3 }}
              name="Driver Management"
            />
          )}
          
          {data[0]?.compliance_safety !== undefined && (
            <Line
              type="monotone"
              dataKey="compliance_safety"
              stroke={colors.quaternary}
              strokeWidth={1.5}
              dot={{ fill: colors.quaternary, strokeWidth: 2, r: 3 }}
              name="Compliance & Safety"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  // Render area chart
  if (type === 'area') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => new Date(value).toLocaleDateString()}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            domain={[0, 100]}
          />
          <Tooltip content={<CustomTooltip />} />
          {showLegend && <Legend />}
          
          <Area
            type="monotone"
            dataKey="score"
            stackId="1"
            stroke={colors.primary}
            fill={colors.primary}
            fillOpacity={0.6}
            name="Overall Score"
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  // Render radar chart for performance categories
  if (type === 'radar') {
    // Transform data for radar chart
    const radarData = [
      { category: 'Vehicle Utilization', score: data[data.length - 1]?.vehicle_utilization || 0, fullMark: 100 },
      { category: 'Driver Management', score: data[data.length - 1]?.driver_management || 0, fullMark: 100 },
      { category: 'Compliance & Safety', score: data[data.length - 1]?.compliance_safety || 0, fullMark: 100 },
      { category: 'Platform Contribution', score: data[data.length - 1]?.platform_contribution || 0, fullMark: 100 }
    ];

    return (
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart data={radarData}>
          <PolarGrid />
          <PolarAngleAxis 
            dataKey="category" 
            tick={{ fontSize: 12 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fontSize: 10 }}
          />
          <Radar
            name="Performance Score"
            dataKey="score"
            stroke={colors.primary}
            fill={colors.primary}
            fillOpacity={0.4}
            strokeWidth={2}
          />
          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
    );
  }

  return null;
};

export default PerformanceChart;