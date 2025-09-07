// src/lib/apiHelpers.ts
import { apiFetch } from './api';

// Example API calls using our rate-limited client

export async function requestRide(input: { 
  pickup: { lat: number, lng: number }, 
  dropoff: { lat: number, lng: number } 
}) {
  // Generate once and re-use on retry UI flows for idempotency
  const key = crypto.randomUUID();
  return apiFetch('/api/rides/request', {
    method: 'POST',
    body: input,
    idempotencyKey: key,
  });
}

export async function getAnalytics() {
  return apiFetch('/api/analytics', {
    method: 'GET'
  });
}

export async function submitAdminRequest(data: {
  requestType: string;
  reason: string;
}, idempotencyKey?: string) {
  return apiFetch('/api/admin/approval/request', {
    method: 'POST',
    body: data,
    idempotencyKey,
  });
}

// Test utility for demonstrating rate limiting
export function spamRequests(endpoint: string, count: number = 10) {
  console.log(`🧪 Spamming ${endpoint} with ${count} requests...`);
  
  const promises = Array.from({length: count}, (_, i) => 
    fetch(endpoint)
      .then(res => ({ status: res.status, index: i }))
      .catch(err => ({ status: 'ERROR', index: i, error: err.message }))
  );
  
  return Promise.all(promises).then(results => {
    const statusCounts = results.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {} as Record<string | number, number>);
    
    console.log('📊 Results:', statusCounts);
    return results;
  });
}