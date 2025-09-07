# Rate Limiting & Middleware Guide

## Overview
Edge middleware with sliding window rate limiter (5 req / 30s) per IP+path, plus idempotency protection and security headers.

## Environment Variables

### Production
```bash
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=30000
RATE_LIMIT_MAX=5
RELEASE_STATE=production
```

### UAT
```bash
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=30000
RATE_LIMIT_MAX=5
RELEASE_STATE=uat
```

## Post-Deploy Smoke Test
```bash
scripts/smoke-test.sh https://your-app.com
```

**Expected Results:**
- Connectivity: `200|401|404` (≠ 000)
- Burst: Mix of ~5×200 + many 429s
- Headers: `retry-after`, `x-ratelimit-*`, `x-correlation-id`

## Horizontal Scaling (Optional)

For multiple instances, swap in-memory store for Redis/Upstash:

```typescript
// rateStore.ts
import { Redis } from '@upstash/redis';

export const makeRedisStore = (redis = Redis.fromEnv()) => {
  const key = (ip: string, path: string) => `rl:${ip}:${path}`;
  return {
    async incr(ip: string, path: string, windowSec: number) {
      const k = key(ip, path);
      const tx = redis.multi();
      tx.incr(k);
      tx.expire(k, windowSec, { nx: true });
      const [count] = (await tx.exec()) as [number, unknown];
      const ttl = await redis.ttl(k);
      return { count: Number(count), ttl: Math.max(Number(ttl), 0) };
    },
  };
};
```

Use in middleware:
```typescript
const { count, ttl } = await store.incr(ip, req.nextUrl.pathname, windowSec);
if (count > max) return rateLimited(ttl, max);
```

## Rollback
Toggle `RATE_LIMIT_ENABLED=false` to disable without deploy.

## Monitoring
- Watch 429 rate in logs
- Track correlation IDs for request tracing
- Monitor latency impact (~1-2ms overhead)