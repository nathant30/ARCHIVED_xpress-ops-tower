'use client';

import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface LegendState {
  optimal: number;
  moderate: number; 
  high: number;
  low: number;
}

interface LegendProps {
  visible: boolean;
  onVisibilityToggle: () => void;
  currentZoom: number;
  hoveredZone?: {
    name: string;
    eta: number;
    supplyGap: number;
    activeTrips: number;
    demand: string;
  } | null;
  legendData?: LegendState;
  onLegendHover?: (zone: string | null) => void;
}

export default function Legend({ 
  visible, 
  onVisibilityToggle, 
  currentZoom,
  hoveredZone,
  legendData,
  onLegendHover 
}: LegendProps) {
  const zoomLevelName = currentZoom <= 11 ? 'City' : currentZoom <= 13 ? 'District' : 'Street';
  
  const legendItems = [
    {
      id: 'optimal',
      color: 'bg-green-400',
      label: 'Optimal (ETA <5min)',
      count: legendData?.optimal || 0,
      hoverZone: 'BGC Financial District'
    },
    {
      id: 'moderate', 
      color: 'bg-yellow-400',
      label: 'Moderate (5-8min)',
      count: legendData?.moderate || 0,
      hoverZone: 'Makati CBD'
    },
    {
      id: 'high',
      color: 'bg-red-400', 
      label: 'High Demand (>8min)',
      count: legendData?.high || 0,
      hoverZone: 'Ortigas Center'
    },
    {
      id: 'low',
      color: 'bg-blue-400',
      label: 'Low Activity',
      count: legendData?.low || 0,
      hoverZone: 'Quezon City'
    }
  ];

  if (!visible) {
    return (
      <div className="absolute bottom-6 left-6">
        <button
          onClick={onVisibilityToggle}
          className="bg-white rounded-xl shadow-lg p-3 border border-slate-200 hover:shadow-xl transition-all"
          aria-label="Show map legend"
        >
          <Eye className="w-5 h-5 text-slate-600" />
        </button>
      </div>
    );
  }

  return (
    <div className="absolute bottom-6 left-6 bg-white rounded-xl shadow-lg border border-slate-200 max-w-sm transition-all duration-200">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <span>Heatmap Legend - {zoomLevelName}</span>
            {hoveredZone && (
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            )}
          </h4>
          <button
            onClick={onVisibilityToggle}
            className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded transition-all"
            aria-label="Hide map legend"
          >
            <EyeOff className="w-4 h-4" />
          </button>
        </div>
        
        {hoveredZone ? (
          // Dynamic zone details on hover
          <div className="space-y-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-sm font-semibold text-blue-900">{hoveredZone.name}</div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="text-slate-600">ETA</div>
                <div className="font-bold text-green-700">{hoveredZone.eta} min</div>
              </div>
              <div>
                <div className="text-slate-600">Supply Gap</div>
                <div className="font-bold text-orange-700">{hoveredZone.supplyGap} drivers</div>
              </div>
              <div>
                <div className="text-slate-600">Active Trips</div>
                <div className="font-bold text-blue-700">{hoveredZone.activeTrips}</div>
              </div>
              <div>
                <div className="text-slate-600">Demand</div>
                <div className="font-bold text-red-700">{hoveredZone.demand}</div>
              </div>
            </div>
            <div className="text-xs text-slate-500 border-t border-blue-200 pt-2">
              Hover over zones for live details
            </div>
          </div>
        ) : (
          // Static legend when not hovering
          <div className="space-y-2">
            {legendItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between space-x-2 cursor-pointer hover:bg-slate-50 p-1 rounded transition-colors"
                onMouseEnter={() => onLegendHover?.(item.hoverZone)}
                onMouseLeave={() => onLegendHover?.(null)}
              >
                <div className="flex items-center space-x-2">
                  <div className={`w-4 h-4 ${item.color} rounded flex-shrink-0`}></div>
                  <span className="text-xs text-slate-700">{item.label}</span>
                </div>
                <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                  {item.count}
                </span>
              </div>
            ))}
            
            <div 
              className="text-xs text-slate-500 border-t border-slate-200 pt-2 cursor-pointer hover:text-slate-700 transition-colors"
              onMouseLeave={() => onLegendHover?.(null)}
            >
              Click zones for drill-down details
            </div>
          </div>
        )}
        
        {/* Performance indicator */}
        <div className="mt-3 pt-2 border-t border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Zoom: {currentZoom}x</span>
            <div className="flex items-center space-x-1">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              <span>Live</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}