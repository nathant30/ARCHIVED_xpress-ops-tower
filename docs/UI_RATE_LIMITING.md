# UI Rate Limiting Integration

## Overview
Complete UI implementation for graceful rate limiting with 429 handling, idempotency, and correlation ID tracking.

## Components Created

### 1. API Client (`src/lib/api.ts`)
- **TypeScript fetch wrapper** with rate limit header parsing
- **Automatic idempotency keys** for unsafe methods (POST/PUT/PATCH/DELETE)
- **Structured error handling** with `ApiError` class
- **Rate limit metadata** extraction from headers

### 2. RateLimitBanner (`src/components/RateLimitBanner.tsx`)  
- **Amber warning banner** with countdown timer
- **Correlation ID display** for support tracing
- **Auto-hide** when not rate limited

### 3. Example Components
- **AnalyticsPanel** - GET requests with rate limit testing
- **RequestForm** - POST requests with idempotency demonstration
- **RateLimitTestPage** - Complete test page at `/rate-limit-test`

### 4. React Query Integration (`src/lib/queryClient.ts`)
- **Safe retry defaults** - never auto-retry on 429
- **Exponential backoff** for network errors
- **Custom hooks** for API integration

## Usage Examples

### Basic API Call
```typescript
import { apiFetch } from '@/lib/api';

const { data, rate } = await apiFetch('/api/analytics');
console.log('Remaining:', rate.remaining, '/', rate.limit);
```

### POST with Idempotency
```typescript
const key = crypto.randomUUID();
const result = await apiFetch('/api/admin/approval/request', {
  method: 'POST',
  body: { requestType: 'test', reason: 'UAT testing' },
  idempotencyKey: key, // Same key = same result
});
```

### React Component Integration
```tsx
import { RateLimitBanner } from '@/components/RateLimitBanner';

function MyComponent() {
  const [rate, setRate] = useState(null);
  const [error, setError] = useState(null);

  return (
    <>
      {rate && <RateLimitBanner meta={rate} />}
      {error && error.status !== 429 && (
        <div className="error">
          {error.message} 
          {error.correlationId && ` (${error.correlationId})`}
        </div>
      )}
    </>
  );
}
```

## Testing Instructions

### Manual UI Testing
1. Visit `/rate-limit-test` in your app
2. Click "Test Rate Limit" button in Analytics Panel
3. Observe yellow banner with countdown timer
4. Fill out Request Form and submit twice (see idempotency handling)

### Console Testing
```javascript
// Spam API to trigger rate limiting
Array.from({length:10}).forEach(()=>fetch('/api/analytics'))

// Check headers in Network tab
// Look for: retry-after, x-ratelimit-limit, x-ratelimit-remaining, x-correlation-id
```

### Expected Results
- **First 5 requests**: ✅ 200 OK
- **Subsequent requests**: ⚠️ 429 Too Many Requests  
- **UI shows**: Yellow banner with "Try again in Xs"
- **Headers present**: All rate limit headers + correlation ID
- **Idempotency**: Second POST with same key = 409 Conflict

## Integration Checklist

- ✅ **API Client**: Handles 429s gracefully with metadata
- ✅ **UI Components**: Banner shows countdown + correlation ID
- ✅ **Submit Protection**: Buttons disable during requests
- ✅ **Idempotency**: POST/PUT/PATCH/DELETE get automatic keys
- ✅ **React Query**: No auto-retry on 429 errors
- ✅ **Error Handling**: Correlation IDs for support tracing
- ✅ **Test Page**: Complete demo at `/rate-limit-test`

## Production Deployment

1. **Import the API client** in your existing components:
   ```typescript
   import { apiFetch, ApiError } from '@/lib/api';
   import { RateLimitBanner } from '@/components/RateLimitBanner';
   ```

2. **Replace fetch calls** with `apiFetch` for automatic rate limit handling

3. **Add RateLimitBanner** to components that make API calls

4. **Update React Query** configuration:
   ```typescript
   import { queryClient } from '@/lib/queryClient';
   // Use this in your QueryClientProvider
   ```

5. **Test thoroughly** with the `/rate-limit-test` page

## Monitoring

- **Watch 429 rates** in application logs
- **Track correlation IDs** for user support requests  
- **Monitor UI error rates** for rate limit impact
- **Adjust limits** via `RATE_LIMIT_MAX` environment variable