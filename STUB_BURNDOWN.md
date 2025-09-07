# 🔥 Stub Burndown Plan

## Overview
**15 API endpoints** need implementation to replace 501 stubs with real functionality.

## By Domain

### 🏷️ Pricing System (8 endpoints) 
**Owner**: Pricing/Surge module team  
**Priority**: High (affects revenue calculations)

```bash
src/app/api/pricing/profiles/route.ts         # List pricing profiles
src/app/api/pricing/profiles/[param]/route.ts # Get specific profile
src/app/api/pricing/profiles/[param]/components/route.ts # Profile components
src/app/api/pricing/profiles/[param]/preview/route.ts   # Preview pricing
src/app/api/pricing/taxi-fares/route.ts       # Taxi fare rules
src/app/api/pricing/tnvs-fares/route.ts       # TNVS fare rules  
src/app/api/pricing/tolls/route.ts            # Toll pricing data
src/app/api/pricing/events/route.ts           # Pricing events/logs
```

**Minimal DB schema needed**:
- `pricing_profiles` (id, name, rules, region_id)
- `fare_rules` (type, base_fare, per_km, surge_multiplier)
- `toll_rates` (origin, destination, rate)

### 🔐 Authentication MFA (2 endpoints)
**Owner**: Auth team  
**Priority**: High (security feature)

```bash
src/app/api/auth/mfa/challenge/route.ts       # Generate MFA challenge
src/app/api/auth/mfa/verify/route.ts          # Verify MFA response
```

**Implementation**: TOTP (RFC 6238) with QR codes, rate limiting

### 📊 Analytics & Metrics (5 endpoints)
**Owner**: Analytics team  
**Priority**: Medium (dashboard features)

```bash
src/app/api/analytics/route.ts                # Dashboard analytics
src/app/api/metrics/route.ts                  # System metrics  
src/app/api/alerts/route.ts                   # Alert management
src/app/api/bookings/route.ts                 # Booking data
src/app/api/drivers/[param]/status/route.ts   # Driver status updates
```

**Implementation**: Pre-aggregated counters or BI proxy with caching

## Implementation Process

### For each endpoint:

1. **Replace stub** with real logic in `src/app/api/*/route.ts`
2. **Update OpenAPI** `x-status` from `"stub"` → `"implemented"`  
3. **Add test case** (happy path validation)
4. **Verify contract** test passes with real schemas

### Available Commands:

```bash
npm run stubs:generate     # Regenerate stubs (if needed)
npm run drift:check        # Verify backend-docs alignment  
npm run contract:test      # Test API contracts
npm run guard:fe-openapi   # Prevent undocumented calls
```

## Success Metrics

- [ ] **0/15 stubs remaining** (all return real data)
- [ ] **Contract tests passing** (schemas validate)
- [ ] **Frontend working** (no 501 errors)
- [ ] **OpenAPI accurate** (all marked "implemented")

## Next Steps

1. **Assign owners** for each domain (pricing, auth, analytics)
2. **Create feature flags** for gradual rollout
3. **Start with read-only endpoints** (safer to deploy)
4. **Build comprehensive schemas** beyond stub GenericObjects

---

**Current Status**: 🟡 Production stable (501s), ready for implementation