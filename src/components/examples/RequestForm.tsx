// src/components/examples/RequestForm.tsx
import React from 'react';
import { apiFetch, ApiError, RateLimitMeta } from '@/lib/api';
import { RateLimitBanner } from '@/components/RateLimitBanner';

interface RequestData {
  requestType: string;
  reason: string;
}

export default function RequestForm() {
  const [formData, setFormData] = React.useState<RequestData>({
    requestType: 'temporary-access',
    reason: ''
  });
  const [rate, setRate] = React.useState<RateLimitMeta | null>(null);
  const [error, setError] = React.useState<ApiError | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Generate idempotency key once per form session
  const [idempotencyKey] = React.useState(() => crypto.randomUUID());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      const { data, rate } = await apiFetch('/api/admin/approval/request', {
        method: 'POST',
        body: formData,
        idempotencyKey, // Same key = idempotent
      });
      
      setRate(rate);
      setSuccess('Request submitted successfully!');
      
      // Reset form on success
      setFormData({ requestType: 'temporary-access', reason: '' });
      
    } catch (e) {
      if (e instanceof ApiError) {
        setRate(e.rate || null);
        setError(e);
        
        // Handle idempotency replay
        if (e.status === 409) {
          setSuccess('Request already submitted (duplicate detected)');
        }
      } else {
        setError(new ApiError('Unexpected error', 500));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 p-6 max-w-lg">
      <h2 className="text-xl font-semibold">Submit Admin Request</h2>
      
      {/* Rate limit banner */}
      {rate && <RateLimitBanner meta={rate} />}
      
      {/* Success message */}
      {success && (
        <div className="rounded-xl border border-green-300 bg-green-50 text-green-900 p-3 text-sm">
          <span>✅</span> {success}
        </div>
      )}
      
      {/* Error banner (non-429 errors) */}
      {error && error.status !== 429 && (
        <div className="rounded-xl border border-red-300 bg-red-50 text-red-900 p-3 text-sm">
          <span className="font-medium">Error:</span> {error.message}
          {error.correlationId && (
            <> &middot; Ref: <code className="text-xs">{error.correlationId}</code></>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Request Type
          </label>
          <select
            value={formData.requestType}
            onChange={(e) => setFormData(prev => ({ ...prev, requestType: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded-lg text-sm"
            required
          >
            <option value="temporary-access">Temporary Access</option>
            <option value="permission-escalation">Permission Escalation</option>
            <option value="data-export">Data Export</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reason
          </label>
          <textarea
            value={formData.reason}
            onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded-lg text-sm"
            rows={3}
            placeholder="Explain why you need this access..."
            required
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg bg-black text-white disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {isSubmitting ? 'Submitting…' : 'Submit Request'}
          </button>
          
          {/* Test duplicate button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg bg-gray-500 text-white disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            Test Duplicate
          </button>
        </div>
      </form>

      {/* Debug info */}
      <div className="text-xs text-gray-500 space-y-1">
        <div>Idempotency Key: <code>{idempotencyKey.slice(0, 8)}...</code></div>
        {rate && rate.limit && (
          <div>Rate Limit: {rate.remaining}/{rate.limit} requests remaining</div>
        )}
      </div>
    </div>
  );
}