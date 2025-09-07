'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, Users, AlertTriangle } from 'lucide-react';

interface AnalyticsData {
  revenue: {
    today: number;
    yesterday: number;
    change_pct: number;
  };
  trips: {
    total: number;
    avg_fare: number;
  };
  surge: {
    active_zones: number;
    avg_multiplier: number;
  };
  compliance: {
    score: number;
    violations: number;
  };
}

export function PricingAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Simulate analytics data for demonstration
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const data: AnalyticsData = {
          revenue: {
            today: 2847650,
            yesterday: 2654320,
            change_pct: 7.3
          },
          trips: {
            total: 18420,
            avg_fare: 154.70
          },
          surge: {
            active_zones: 12,
            avg_multiplier: 1.4
          },
          compliance: {
            score: 98.7,
            violations: 2
          }
        };
        
        setAnalyticsData(data);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
        setLoading(false);
      }
    };

    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading Analytics...</p>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="h-96 flex items-center justify-center bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-2" />
          <p className="text-slate-600 dark:text-slate-400">Failed to load analytics data</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Revenue Analytics</h3>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">Real-time pricing and revenue insights</p>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Revenue Card */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">Today's Revenue</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {formatCurrency(analyticsData.revenue.today)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div className="mt-2 flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-600 dark:text-green-400">+{analyticsData.revenue.change_pct}% vs yesterday</span>
            </div>
          </div>

          {/* Trips Card */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Trips</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {analyticsData.trips.total.toLocaleString()}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="mt-2">
              <span className="text-sm text-blue-600 dark:text-blue-400">
                Avg fare: {formatCurrency(analyticsData.trips.avg_fare)}
              </span>
            </div>
          </div>

          {/* Surge Card */}
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Active Surge Zones</p>
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                  {analyticsData.surge.active_zones}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="mt-2">
              <span className="text-sm text-orange-600 dark:text-orange-400">
                Avg multiplier: {analyticsData.surge.avg_multiplier}x
              </span>
            </div>
          </div>

          {/* Compliance Card */}
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Compliance Score</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {analyticsData.compliance.score}%
                </p>
              </div>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                analyticsData.compliance.score >= 95 ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
              }`}>
                <span className="text-sm font-bold">✓</span>
              </div>
            </div>
            <div className="mt-2">
              <span className="text-sm text-purple-600 dark:text-purple-400">
                {analyticsData.compliance.violations} violations today
              </span>
            </div>
          </div>
        </div>

        {/* Revenue Trend Chart Placeholder */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 h-48">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-slate-900 dark:text-white">Revenue Trend (24h)</h4>
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Revenue</span>
              <div className="w-3 h-3 bg-green-500 rounded-full ml-4"></div>
              <span>Trips</span>
            </div>
          </div>
          <div className="flex items-end justify-between h-32">
            {Array.from({ length: 24 }, (_, i) => {
              const height = Math.random() * 80 + 20;
              return (
                <div key={i} className="flex flex-col items-center gap-1" style={{ width: '3%' }}>
                  <div 
                    className="bg-blue-500 rounded-t"
                    style={{ height: `${height}%`, width: '100%' }}
                  ></div>
                  {i % 4 === 0 && (
                    <span className="text-xs text-slate-500">{i}:00</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}