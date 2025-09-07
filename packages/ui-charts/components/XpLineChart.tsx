import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  getChartPalette,
  getGridConfig,
  getAxisConfig,
  getTooltipConfig,
  getColorByIndex,
  getSemanticColors,
  getAnimationDuration,
  formatChartNumber,
  formatChartDate,
  clearThemeCache,
} from '../utils/theme';

export interface LineDataPoint {
  [key: string]: string | number | Date;
}

export interface LineConfig {
  dataKey: string;
  name?: string;
  color?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  connectNulls?: boolean;
  dot?: boolean;
}

export interface XpLineChartProps {
  /** Chart data array */
  data: LineDataPoint[];
  /** Configuration for each line */
  lines: LineConfig[];
  /** Width of the chart container */
  width?: number | string;
  /** Height of the chart container */
  height?: number | string;
  /** X-axis data key */
  xAxisKey: string;
  /** X-axis label */
  xAxisLabel?: string;
  /** Y-axis label */
  yAxisLabel?: string;
  /** Whether to show grid lines */
  showGrid?: boolean;
  /** Whether to show legend */
  showLegend?: boolean;
  /** Whether to show tooltip */
  showTooltip?: boolean;
  /** Chart margin */
  margin?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  /** Custom tooltip formatter */
  tooltipFormatter?: (value: any, name: string, props: any) => [string | number, string];
  /** Custom X-axis tick formatter */
  xAxisFormatter?: (value: any) => string;
  /** Custom Y-axis tick formatter */
  yAxisFormatter?: (value: any) => string;
  /** Reference lines */
  referenceLines?: Array<{
    y?: number;
    x?: string | number;
    label?: string;
    color?: string;
    strokeDasharray?: string;
  }>;
  /** Whether the chart should be smooth curves */
  smooth?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Chart title */
  title?: string;
}

const XpLineChart: React.FC<XpLineChartProps> = ({
  data,
  lines,
  width = '100%',
  height = 400,
  xAxisKey,
  xAxisLabel,
  yAxisLabel,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  margin = { top: 20, right: 30, left: 20, bottom: 20 },
  tooltipFormatter,
  xAxisFormatter,
  yAxisFormatter,
  referenceLines = [],
  smooth = true,
  loading = false,
  emptyMessage = 'No data available',
  title,
}) => {
  const [themeKey, setThemeKey] = useState(0);

  // Listen for theme changes and clear cache
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'data-theme'
        ) {
          clearThemeCache();
          setThemeKey(prev => prev + 1);
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => observer.disconnect();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          width,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--xp-bg-card)',
          border: '1px solid var(--xp-border-default)',
          borderRadius: 'var(--xp-radius-md)',
        }}
      >
        <div style={{ color: 'var(--xp-text-muted)' }}>
          Loading chart...
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div
        style={{
          width,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--xp-bg-card)',
          border: '1px solid var(--xp-border-default)',
          borderRadius: 'var(--xp-radius-md)',
        }}
      >
        <div style={{ color: 'var(--xp-text-muted)' }}>
          {emptyMessage}
        </div>
      </div>
    );
  }

  const palette = getChartPalette();
  const gridConfig = getGridConfig();
  const axisConfig = getAxisConfig();
  const tooltipConfig = getTooltipConfig();
  const semanticColors = getSemanticColors();
  const animationDuration = getAnimationDuration();

  const defaultTooltipFormatter = (value: any, name: string) => {
    if (typeof value === 'number') {
      return [formatChartNumber(value), name];
    }
    return [value, name];
  };

  const defaultXAxisFormatter = (value: any) => {
    if (value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)))) {
      return formatChartDate(value);
    }
    return String(value);
  };

  const defaultYAxisFormatter = (value: any) => {
    if (typeof value === 'number') {
      return formatChartNumber(value);
    }
    return String(value);
  };

  return (
    <div>
      {title && (
        <h3 style={{
          margin: '0 0 16px 0',
          fontSize: 'var(--xp-font-size-h3)',
          fontWeight: '600',
          color: 'var(--xp-text-primary)',
        }}>
          {title}
        </h3>
      )}
      
      <ResponsiveContainer width={width} height={height}>
        <LineChart data={data} margin={margin}>
          {showGrid && (
            <CartesianGrid
              strokeDasharray={gridConfig.strokeDasharray}
              stroke={gridConfig.stroke}
              strokeOpacity={gridConfig.strokeOpacity}
            />
          )}
          
          <XAxis
            dataKey={xAxisKey}
            {...axisConfig}
            label={xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -10 } : undefined}
            tickFormatter={xAxisFormatter || defaultXAxisFormatter}
          />
          
          <YAxis
            {...axisConfig}
            label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
            tickFormatter={yAxisFormatter || defaultYAxisFormatter}
          />
          
          {showTooltip && (
            <Tooltip
              {...tooltipConfig}
              formatter={tooltipFormatter || defaultTooltipFormatter}
              labelFormatter={(label) => {
                if (label instanceof Date || (typeof label === 'string' && !isNaN(Date.parse(label)))) {
                  return formatChartDate(label, 'datetime');
                }
                return String(label);
              }}
            />
          )}
          
          {showLegend && <Legend />}
          
          {referenceLines.map((refLine, index) => (
            <ReferenceLine
              key={index}
              y={refLine.y}
              x={refLine.x}
              stroke={refLine.color || semanticColors.primary}
              strokeDasharray={refLine.strokeDasharray || '5 5'}
              label={refLine.label}
            />
          ))}
          
          {lines.map((lineConfig, index) => (
            <Line
              key={lineConfig.dataKey}
              type={smooth ? 'monotone' : 'linear'}
              dataKey={lineConfig.dataKey}
              name={lineConfig.name || lineConfig.dataKey}
              stroke={lineConfig.color || getColorByIndex(index)}
              strokeWidth={lineConfig.strokeWidth || 2.5}
              strokeDasharray={lineConfig.strokeDasharray}
              connectNulls={lineConfig.connectNulls ?? false}
              dot={lineConfig.dot ?? false}
              animationDuration={animationDuration}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default XpLineChart;