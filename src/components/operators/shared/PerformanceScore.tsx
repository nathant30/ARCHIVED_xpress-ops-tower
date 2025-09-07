'use client';

import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PerformanceScoreProps {
  score: number;
  maxScore?: number;
  previousScore?: number;
  size?: 'sm' | 'md' | 'lg';
  showTrend?: boolean;
  showBadge?: boolean;
  className?: string;
}

const PerformanceScore: React.FC<PerformanceScoreProps> = ({
  score,
  maxScore = 100,
  previousScore,
  size = 'md',
  showTrend = false,
  showBadge = true,
  className = ''
}) => {
  // Calculate percentage
  const percentage = Math.min((score / maxScore) * 100, 100);
  
  // Determine score category and color
  const getScoreCategory = (score: number) => {
    if (score >= 85) return { label: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-100', progressColor: 'bg-green-500' };
    if (score >= 75) return { label: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-100', progressColor: 'bg-blue-500' };
    if (score >= 65) return { label: 'Fair', color: 'text-yellow-600', bgColor: 'bg-yellow-100', progressColor: 'bg-yellow-500' };
    return { label: 'Needs Improvement', color: 'text-red-600', bgColor: 'bg-red-100', progressColor: 'bg-red-500' };
  };

  const category = getScoreCategory(score);
  
  // Calculate trend if previous score is provided
  const trend = previousScore !== undefined ? score - previousScore : 0;
  const trendPercentage = previousScore !== undefined && previousScore > 0 
    ? ((score - previousScore) / previousScore) * 100 
    : 0;

  // Size configurations
  const sizeConfig = {
    sm: {
      text: 'text-lg',
      subtext: 'text-xs',
      height: 'h-2',
      icon: 'h-3 w-3',
      padding: 'p-2'
    },
    md: {
      text: 'text-2xl',
      subtext: 'text-sm',
      height: 'h-3',
      icon: 'h-4 w-4',
      padding: 'p-3'
    },
    lg: {
      text: 'text-3xl',
      subtext: 'text-base',
      height: 'h-4',
      icon: 'h-5 w-5',
      padding: 'p-4'
    }
  };

  const config = sizeConfig[size];

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Score Display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`font-bold ${config.text} ${category.color}`}>
            {score.toFixed(1)}
          </span>
          <span className={`${config.subtext} text-muted-foreground`}>
            / {maxScore}
          </span>
        </div>
        
        {showTrend && previousScore !== undefined && (
          <div className="flex items-center gap-1">
            {trend > 0 && (
              <>
                <TrendingUp className={`${config.icon} text-green-500`} />
                <span className="text-green-600 text-xs font-medium">
                  +{trendPercentage.toFixed(1)}%
                </span>
              </>
            )}
            {trend < 0 && (
              <>
                <TrendingDown className={`${config.icon} text-red-500`} />
                <span className="text-red-600 text-xs font-medium">
                  {trendPercentage.toFixed(1)}%
                </span>
              </>
            )}
            {trend === 0 && (
              <>
                <Minus className={`${config.icon} text-gray-500`} />
                <span className="text-gray-600 text-xs font-medium">
                  0%
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <Progress 
          value={percentage} 
          className={`w-full ${config.height}`}
        />
        <div className="flex justify-between items-center">
          {showBadge && (
            <Badge 
              variant="outline" 
              className={`${category.bgColor} ${category.color} border-0 ${config.subtext}`}
            >
              {category.label}
            </Badge>
          )}
          <span className={`${config.subtext} text-muted-foreground`}>
            {percentage.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default PerformanceScore;