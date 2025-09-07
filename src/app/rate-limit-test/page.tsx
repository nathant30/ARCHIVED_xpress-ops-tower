// src/app/rate-limit-test/page.tsx
'use client';

import AnalyticsPanel from '@/components/examples/AnalyticsPanel';
import RequestForm from '@/components/examples/RequestForm';

export default function RateLimitTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Rate Limiting Test Page</h1>
          <p className="text-gray-600">
            Test the rate limiting middleware and UI components. Try the buttons to see 429 handling.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow">
            <AnalyticsPanel />
          </div>
          <div className="bg-white rounded-lg shadow">
            <RequestForm />
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Manual Test Instructions</h2>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex items-start gap-2">
              <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">1</span>
              <span>Click "Test Rate Limit" in Analytics Panel to spam requests and see 429 banner</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">2</span>
              <span>Fill out Request Form and click "Submit Request" twice to see idempotency (409)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">3</span>
              <span>Open browser console and run: <code className="bg-gray-100 px-1 rounded">Array.from({`{length:10}`}).forEach(()=>fetch('/api/analytics'))</code></span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">4</span>
              <span>Check Network tab for rate limit headers: retry-after, x-ratelimit-*, x-correlation-id</span>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">Expected Behavior:</h3>
          <ul className="space-y-1 text-sm text-blue-800">
            <li>• First 5 requests: ✅ 200 OK</li>
            <li>• Subsequent requests: ⚠️ 429 Too Many Requests</li>
            <li>• Yellow banner appears with countdown timer</li>
            <li>• Correlation ID shown for support tracing</li>
            <li>• POST requests with same idempotency key return 409 Conflict</li>
            <li>• Submit buttons disable during requests to prevent double-clicks</li>
          </ul>
        </div>
      </div>
    </div>
  );
}