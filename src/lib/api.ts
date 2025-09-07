// src/lib/api.ts
export type ApiOptions = {
  method?: 'GET'|'POST'|'PUT'|'PATCH'|'DELETE';
  body?: unknown;
  token?: string;                   // your JWT if required
  idempotencyKey?: string;          // pass one, or we'll generate for unsafe methods
  signal?: AbortSignal;
};

export type RateLimitMeta = {
  limit?: number;
  remaining?: number;
  resetEpochMs?: number;  // server gives seconds; we store ms
  retryAfterSec?: number;
  correlationId?: string | null;
};

export class ApiError extends Error {
  status: number;
  rate?: RateLimitMeta;
  correlationId?: string | null;
  constructor(msg: string, status: number, rate?: RateLimitMeta) {
    super(msg);
    this.name = 'ApiError';
    this.status = status;
    this.rate = rate;
    this.correlationId = rate?.correlationId ?? null;
  }
}

const isUnsafe = (m: string) => ['POST','PUT','PATCH','DELETE'].includes(m);

function parseRateHeaders(h: Headers): RateLimitMeta {
  const limit = num(h.get('x-ratelimit-limit'));
  const remaining = num(h.get('x-ratelimit-remaining'));
  const resetSec = num(h.get('x-ratelimit-reset'));
  const retryAfterSec = num(h.get('retry-after'));
  const correlationId = h.get('x-correlation-id');
  return {
    limit,
    remaining,
    resetEpochMs: resetSec ? resetSec * 1000 : undefined,
    retryAfterSec,
    correlationId
  };
}

function num(v: string | null): number | undefined {
  if (!v) return;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export async function apiFetch<T=unknown>(
  path: string,
  opts: ApiOptions = {}
): Promise<{ data: T; rate: RateLimitMeta }> {
  const method = (opts.method ?? 'GET').toUpperCase() as ApiOptions['method'];
  const headers: Record<string, string> = { 'Accept': 'application/json' };

  if (opts.token) headers['Authorization'] = `Bearer ${opts.token}`;
  if (opts.body != null) headers['Content-Type'] = 'application/json';

  // Idempotency for unsafe methods
  if (isUnsafe(method)) {
    headers['Idempotency-Key'] =
      opts.idempotencyKey ?? (globalThis.crypto?.randomUUID?.() ?? String(Date.now()));
  }

  // Optional: dev header to confirm middleware is running
  if (process.env.NODE_ENV === 'development') {
    headers['x-force-rl'] = '1'; // harmless in prod
  }

  const res = await fetch(path, {
    method,
    headers,
    body: opts.body != null ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal
  });

  const rate = parseRateHeaders(res.headers);

  // Happy path
  if (res.ok) {
    const data = (res.status === 204 ? (undefined as unknown as T) : (await res.json()));
    return { data, rate };
  }

  // Error path
  let msg = `HTTP ${res.status}`;
  try {
    const txt = await res.text();
    msg = txt || msg;
  } catch { /* ignore */ }

  throw new ApiError(msg, res.status, rate);
}