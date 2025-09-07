import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import {
  getChartPalette,
  getTooltipConfig,
  getColorByIndex,
  getAnimationDuration,
  formatChartNumber,
  clearThemeCache,
} from '../utils/theme';

export interface DonutDataPoint {
  name: string;
  value: number;
  color?: string;
}

export interface XpDonutChartProps {
  data: DonutDataPoint[];
  width?: number | string;
  height?: number | string;
  innerRadius?: number;
  outerRadius?: number;
  showTooltip?: boolean;
  showLegend?: boolean;
  tooltipFormatter?: (value: any, name: string) => [string | number, string];
  loading?: boolean;
  emptyMessage?: string;
  title?: string;
  centerText?: React.ReactNode;
}

const XpDonutChart: React.FC<XpDonutChartProps> = ({
  data,
  width = '100%',
  height = 400,
  innerRadius = 60,
  outerRadius = 120,
  showTooltip = true,
  showLegend = true,
  tooltipFormatter,
  loading = false,
  emptyMessage = 'No data available',
  title,
  centerText,
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

  const tooltipConfig = getTooltipConfig();
  const animationDuration = getAnimationDuration();
  const total = data.reduce((sum, item) => sum + item.value, 0);

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
      
      <div style={{ position: 'relative' }}>
        <ResponsiveContainer width={width} height={height}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={2}
              dataKey="value"
              animationDuration={animationDuration}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color || getColorByIndex(index)} 
                />
              ))}
            </Pie>
            
            {showTooltip && (
              <Tooltip
                {...tooltipConfig}
                formatter={tooltipFormatter || ((value, name) => [
                  `${formatChartNumber(value)} (${((value / total) * 100).toFixed(1)}%)`,
                  name
                ])}
              />
            )}
            
            {showLegend && <Legend />}
          </PieChart>
        </ResponsiveContainer>
        
        {centerText && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: 'var(--xp-text-primary)',
            fontSize: 'var(--xp-font-size-body)',
          }}>
            {centerText}
          </div>
        )}
      </div>
    </div>
  );
};

export default XpDonutChart;