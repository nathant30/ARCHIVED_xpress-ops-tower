# 🎯 UAT Environment Guide

## Environment Hierarchy

**Dev** → **Staging** → **UAT** → **Production**

- **Dev**: Engineers iterate. Anything goes.
- **Staging**: CI proves the build (contracts, load, drift). Internal only.
- **UAT**: Product/ops validate features with realistic data. Selective public surface.
- **Production**: Parked (for now).

## UAT Environment Setup

### Configuration Files
- `.env.uat` - UAT-specific environment variables
- `.env.staging` - Staging environment configuration
- `audit/uat_public.txt` - UAT public endpoint allowlist

### Current UAT Allowlist (3 endpoints)
```
GET /api/analytics
GET /api/bookings
POST /api/rides/request
```

## Environment Guards

### Guard Commands
- `npm run parked-guard` - Parked mode (0 public endpoints)
- `npm run guard:uat` - UAT mode (allowlist-controlled)
- `npm run guard:staging` - Staging mode (internal only)

### Guard Behavior by Environment
- **Parked**: Blocks ANY public endpoints
- **UAT**: Allows only allowlisted public endpoints
- **Staging**: Blocks ALL public endpoints (internal CI only)
- **Live**: Allows all properly promoted public endpoints

## UAT Workflow

### 1. Promote Endpoints for UAT Testing
```bash
# Promote UAT-approved endpoints to public
npm run promote-uat

# Verify promotion
npm run guard:uat
```

### 2. Deploy to UAT Environment
```bash
# Set UAT environment
export RELEASE_STATE=uat

# Start UAT server
npm run dev
```

### 3. Run UAT Testing
- Business flows end-to-end with realistic data
- Public schema stability (compat guard stays green)
- Idempotency on all public mutations
- Rate limits behave with testers
- Monitoring sees test errors & latency

### 4. Park After Testing
```bash
# Emergency park all public endpoints
npm run demote-all-public

# Verify parked state
npm run parked-guard
```

## CI/CD Integration

### UAT Deployment Pipeline
- **Workflow**: `.github/workflows/deploy-uat.yml`
- **Branch**: `release/uat`
- **Manual promotion**: Workflow dispatch with promotion option

### Validation Steps
1. Drift detection and filtering
2. UAT environment guard validation
3. Public API schema compatibility
4. Contract testing
5. UAT allowlist verification
6. Build UAT release candidate

## UAT Infrastructure Requirements

### Database
- Separate PostgreSQL instance: `xpress_uat`
- Sanitized fixtures (no real PII)
- Connection: `postgresql://postgres:postgres@localhost:5433/xpress_uat`

### DNS & Ingress
- Point `api-uat.xpressops.com` → UAT ingress
- SSL certificate for UAT domain
- Load balancer configuration

### Authentication
- UAT test identities (OKTA/Keycloak tenant)
- Static JWT signer for testing
- Relaxed rate limits for testers

### Monitoring
- UAT-specific Datadog/New Relic configuration
- Prometheus endpoint: `http://prometheus-uat:9090`
- Error tracking and latency monitoring

## UAT Validation Checklist

### Business Validation
- [ ] End-to-end business flows work
- [ ] Realistic data scenarios tested
- [ ] User acceptance criteria met
- [ ] Performance within acceptable limits

### Technical Validation
- [ ] Public schema compatibility maintained
- [ ] Idempotency works on all mutations  
- [ ] Rate limits function correctly
- [ ] Monitoring captures all events
- [ ] Error handling graceful

### Security Validation
- [ ] JWT authentication working
- [ ] No unauthorized endpoint exposure
- [ ] PII sanitization effective
- [ ] Access controls enforced

## Emergency Procedures

### Instant Demotion
```bash
# Emergency park all public endpoints
npm run demote-all-public
```

### Guard Failure Response
1. Check `audit/uat_public.txt` allowlist
2. Verify endpoint promotion was authorized
3. Update allowlist or demote unauthorized endpoints
4. Re-run guard validation

### Incident Response
- UAT issues don't affect production (parked)
- Emergency breakers available for instant shutdown
- Full audit trail of all promotions/demotions
- Automated alerting for unauthorized changes

## Environment State Transitions

```
[PARKED] ──promote-uat──→ [UAT] ──demote-all──→ [PARKED]
    ↑                      ↓
    └──────emergency────────┘
```

The system maintains production readiness while providing safe UAT testing capabilities.