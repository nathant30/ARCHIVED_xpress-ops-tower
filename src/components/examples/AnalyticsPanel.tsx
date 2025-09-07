// src/components/examples/AnalyticsPanel.tsx
import React from 'react';
import { apiFetch, ApiError, RateLimitMeta } from '@/lib/api';
import { RateLimitBanner } from '@/components/RateLimitBanner';

interface AnalyticsData {
  totalRides: number;
  activeDrivers: number;
  revenue: number;
}

export default function AnalyticsPanel() {
  const [data, setData] = React.useState<AnalyticsData | null>(null);
  const [rate, setRate] = React.useState<RateLimitMeta | null>(null);
  const [error, setError] = React.useState<ApiError | null>(null);
  const [loading, setLoading] = React.useState(false);

  const load = async () => {
    setLoading(true); 
    setError(null);
    try {
      const { data, rate } = await apiFetch<AnalyticsData>('/api/analytics');
      setData(data);
      setRate(rate);
    } catch (e) {
      if (e instanceof ApiError) {
        setRate(e.rate || null);
        setError(e);
      } else {
        setError(new ApiError('Unexpected error', 500));
      }
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { 
    load(); 
  }, []);

  return (
    <div className="space-y-4 p-6 max-w-2xl">
      <h2 className="text-xl font-semibold">Analytics Dashboard</h2>
      
      {/* Rate limit banner */}
      {rate && <RateLimitBanner meta={rate} />}
      
      {/* Error banner (non-429 errors) */}
      {error && error.status !== 429 && (
        <div className="rounded-xl border border-red-300 bg-red-50 text-red-900 p-3 text-sm">
          <span className="font-medium">Error:</span> {error.message}
          {error.correlationId && (
            <> &middot; Ref: <code className="text-xs">{error.correlationId}</code></>
          )}
        </div>
      )}

      {/* Data display */}
      {data && !loading && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-900">{data.totalRides}</div>
            <div className="text-sm text-blue-700">Total Rides</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-900">{data.activeDrivers}</div>
            <div className="text-sm text-green-700">Active Drivers</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-900">${data.revenue}</div>
            <div className="text-sm text-purple-700">Revenue</div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={load}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-black text-white disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
        >
          {loading ? 'Loading…' : 'Refresh'}
        </button>
        
        {/* Test spam button for rate limiting demo */}
        <button
          onClick={() => {
            // Spam the API to trigger rate limiting
            Array.from({length: 10}, (_, i) => 
              setTimeout(() => load(), i * 100)
            );
          }}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-amber-500 text-white disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
        >
          Test Rate Limit
        </button>
      </div>

      {/* Rate limit info */}
      {rate && (
        <div className="text-xs text-gray-500 space-y-1">
          {rate.limit && <div>Rate Limit: {rate.remaining}/{rate.limit} requests remaining</div>}
          {rate.resetEpochMs && (
            <div>Resets: {new Date(rate.resetEpochMs).toLocaleTimeString()}</div>
          )}
        </div>
      )}
    </div>
  );
}