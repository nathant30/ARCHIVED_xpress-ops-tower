// src/components/RateLimitBanner.tsx
import React from 'react';
import { RateLimitMeta } from '@/lib/api';

function fmt(sec?: number) {
  if (!sec || sec <= 0) return 'a few seconds';
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s ? `${m}m ${s}s` : `${m}m`;
}

export const RateLimitBanner: React.FC<{ meta: RateLimitMeta }> = ({ meta }) => {
  if (meta?.retryAfterSec == null && meta?.remaining !== 0) return null;

  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 text-amber-900 p-3 text-sm flex items-center gap-2">
      <span>⚠️</span>
      <span>
        You hit the rate limit. {meta.retryAfterSec ? `Try again in ${fmt(meta.retryAfterSec)}.` : 'Please wait a moment and retry.'}
        {meta.correlationId && (
          <> &middot; Ref: <code className="text-xs">{meta.correlationId}</code></>
        )}
      </span>
    </div>
  );
};