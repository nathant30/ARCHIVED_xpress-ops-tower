import React, { useEffect, useState } from 'react';
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
import {
  getChartPalette,
  getGridConfig,
  getAxisConfig,
  getTooltipConfig,
  getColorByIndex,
  getAnimationDuration,
  formatChartNumber,
  formatChartDate,
  clearThemeCache,
} from '../utils/theme';

export interface BarDataPoint {
  [key: string]: string | number | Date;
}

export interface BarConfig {
  dataKey: string;
  name?: string;
  fill?: string;
  radius?: number;
  stackId?: string;
}

export interface XpBarChartProps {
  data: BarDataPoint[];
  bars: BarConfig[];
  width?: number | string;
  height?: number | string;
  xAxisKey: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
  tooltipFormatter?: (value: any, name: string) => [string | number, string];
  xAxisFormatter?: (value: any) => string;
  yAxisFormatter?: (value: any) => string;
  loading?: boolean;
  emptyMessage?: string;
  title?: string;
}

const XpBarChart: React.FC<XpBarChartProps> = ({
  data,
  bars,
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
  loading = false,
  emptyMessage = 'No data available',
  title,
}) => {
  const [themeKey, setThemeKey] = useState(0);

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
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

  if (loading || !data || data.length === 0) {
    return (
      <div style={{
        width, height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--xp-bg-card)',
        border: '1px solid var(--xp-border-default)',
        borderRadius: 'var(--xp-radius-md)',
      }}>
        <div style={{ color: 'var(--xp-text-muted)' }}>
          {loading ? 'Loading chart...' : emptyMessage}
        </div>
      </div>
    );
  }

  const gridConfig = getGridConfig();
  const axisConfig = getAxisConfig();
  const tooltipConfig = getTooltipConfig();
  const animationDuration = getAnimationDuration();

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
        <BarChart data={data} margin={margin}>
          {showGrid && <CartesianGrid {...gridConfig} />}
          <XAxis 
            dataKey={xAxisKey} 
            {...axisConfig}
            tickFormatter={xAxisFormatter}
          />
          <YAxis 
            {...axisConfig}
            tickFormatter={yAxisFormatter || ((value) => formatChartNumber(value))}
          />
          {showTooltip && (
            <Tooltip 
              {...tooltipConfig}
              formatter={tooltipFormatter || ((value, name) => [formatChartNumber(value), name])}
            />
          )}
          {showLegend && <Legend />}
          
          {bars.map((barConfig, index) => (
            <Bar
              key={barConfig.dataKey}
              dataKey={barConfig.dataKey}
              name={barConfig.name || barConfig.dataKey}
              fill={barConfig.fill || getColorByIndex(index)}
              radius={barConfig.radius || 6}
              stackId={barConfig.stackId}
              animationDuration={animationDuration}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default XpBarChart;