'use client';

import React from 'react';
import { TrendingUp, AlertTriangle, Target, Zap } from 'lucide-react';
import type { AiInsight } from '@/types/map';

interface InsightPinProps {
  insight: AiInsight;
  onClick: (insight: AiInsight) => void;
  onFocus: (insight: AiInsight) => void;
  onBlur: () => void;
  isHighlighted?: boolean;
}

export default function InsightPin({ 
  insight, 
  onClick, 
  onFocus, 
  onBlur,
  isHighlighted = false 
}: InsightPinProps) {
  const getInsightIcon = () => {
    switch (insight.type) {
      case 'surge':
        return <TrendingUp className="w-4 h-4" />;
      case 'supply_gap':
        return <AlertTriangle className="w-4 h-4" />;
      case 'optimized_route':
        return <Target className="w-4 h-4" />;
      default:
        return <Zap className="w-4 h-4" />;
    }
  };

  const getInsightColor = () => {
    switch (insight.type) {
      case 'surge':
        return 'bg-blue-600 border-blue-700';
      case 'supply_gap':
        return 'bg-orange-600 border-orange-700';
      case 'optimized_route':
        return 'bg-green-600 border-green-700';
      default:
        return 'bg-purple-600 border-purple-700';
    }
  };

  const getConfidenceColor = () => {
    if (insight.confidence >= 0.8) return 'text-green-600';
    if (insight.confidence >= 0.6) return 'text-amber-600';
    return 'text-red-600';
  };

  const handleClick = () => {
    onClick(insight);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(insight);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        onFocus={() => onFocus(insight)}
        onBlur={onBlur}
        onKeyDown={handleKeyDown}
        className={`
          relative ${getInsightColor()} text-white rounded-full p-3 shadow-lg
          transform transition-all duration-200 hover:scale-110 focus:scale-110
          focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2
          ${isHighlighted ? 'scale-110 ring-2 ring-white ring-offset-2 animate-pulse' : ''}
        `}
        aria-label={`AI Insight: ${insight.title} - ${Math.round(insight.confidence * 100)}% confidence`}
      >
        {getInsightIcon()}
        
        {/* Confidence indicator */}
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center">
          <span className={`text-xs font-bold ${getConfidenceColor()}`}>
            {Math.round(insight.confidence * 100)}
          </span>
        </div>
        
        {/* Pulse animation for high confidence insights */}
        {insight.confidence >= 0.8 && (
          <div className="absolute inset-0 bg-white rounded-full opacity-30 animate-ping"></div>
        )}
        
        {/* ETA indicator if available */}
        {insight.etaMins && (
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
            <div className="bg-slate-900 text-white text-xs px-2 py-0.5 rounded-full font-medium">
              {insight.etaMins}m
            </div>
          </div>
        )}
      </button>
      
      {/* Tooltip on hover */}
      <div className={`
        absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2
        opacity-0 group-hover:opacity-100 transition-opacity duration-200
        pointer-events-none z-10
      `}>
        <div className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-xl border border-slate-700 min-w-max">
          <div className="font-semibold text-sm">{insight.title}</div>
          <div className="text-xs text-slate-300 mt-1">
            Type: {insight.type.replace('_', ' ')}
          </div>
          <div className="text-xs text-slate-300">
            Confidence: {Math.round(insight.confidence * 100)}%
          </div>
          {insight.etaMins && (
            <div className="text-xs text-slate-300">
              Time to impact: {insight.etaMins} minutes
            </div>
          )}
        </div>
      </div>
    </div>
  );
}