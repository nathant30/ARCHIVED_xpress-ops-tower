# Frontend API Usage Analysis

Generated: $(date)

## Summary
Based on manual inspection of frontend code, found **11+ API endpoints** being called:

## API Paths Called by Frontend
```
/api/analytics
/api/drivers
/api/drivers/{id}/status  
/api/auth/mfa/challenge
/api/auth/mfa/verify
/api/pricing/events
/api/pricing/profiles
/api/pricing/tnvs-fares
/api/pricing/taxi-fares
/api/pricing/tolls
/api/pricing/profiles/{id}
/api/pricing/profiles/{id}/preview
/api/pricing/profiles/{id}/components
/api/alerts
/api/metrics
/api/bookings
```

## Alignment Check (Frontend ↔ OpenAPI)

**🚨 MAJOR FINDING**: Your OpenAPI only documents 4 routes:
- `/api/drivers` (GET)
- `/api/drivers/{id}` (PATCH)  
- `/api/regions/{id}/assign-rm` (POST)
- `/api/rides/request` (POST)

But your frontend calls **11+ different endpoints** including:
- **Pricing APIs**: `/api/pricing/*` (multiple endpoints)
- **Analytics**: `/api/analytics`
- **Authentication**: `/api/auth/mfa/*`
- **Alerts**: `/api/alerts`
- **Metrics**: `/api/metrics`
- **Bookings**: `/api/bookings`

## 🚨 Critical Issue: Massive Documentation Gap

Your real API surface is **3x larger** than documented:
- **Documented in OpenAPI**: 4 routes
- **Actually used by frontend**: 11+ routes
- **Coverage**: ~36%

## Sample API Call Patterns

### Direct fetch() calls:
- `src/hooks/useAnalytics.ts:85` - `const response = await fetch(\`/api/analytics?\${params.toString()}\`, {`
- `src/hooks/useDrivers.ts:85` - `const response = await fetch(\`/api/drivers?\${params.toString()}\`, {`
- `src/hooks/useDrivers.ts:112` - `const response = await fetch(\`/api/drivers/\${driverId}/status\`, {`
- `src/app/pricing/page.tsx:154` - `fetch('/api/pricing/profiles')`
- `src/hooks/useRBAC.tsx:361` - `const response = await fetch('/api/auth/mfa/challenge', {`

## Recommendations

1. **Immediate**: Run your comprehensive drift detector to find all missing routes
2. **Document**: Add all missing APIs to OpenAPI specification  
3. **Validate**: Use contract testing to ensure frontend calls match schemas
4. **Monitor**: Set up CI to catch future drift between FE usage and API docs