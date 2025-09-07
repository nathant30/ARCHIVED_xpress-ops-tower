# 🚀 GO-LIVE CARD (Single Pass)

## 0) Final Preflight (5 min)

### Secrets & Config Check
```bash
# Verify all critical secrets present
test -n "$JWT_SECRET" && test -n "$DATABASE_URL" && echo "✅ secrets OK" || echo "❌ MISSING SECRETS"
test -n "$POSTGRES_PASSWORD" && echo "✅ DB password OK" || echo "❌ MISSING DB PASSWORD"
```

### Gate & Compatibility
```bash
npm run -s gate:production
```
**Expected**: 3 passed, 0 critical failures

### Sanity Counts
```bash
# Zero ghost routes
comm -3 audit/code_routes_full.txt audit/spec_routes_full.txt
# Expected: no output

# Public API count = 9
node -e 'const s=require("./docs/api/openapi.json");let c=0;for(const p in s.paths)for(const m in s.paths[p]){if((s.paths[p][m]["x-visibility"]||"internal")==="public")c++}console.log({public:c})'
# Expected: { public: 9 }
```

**STOP**: If any preflight fails, do not proceed to cutover.

---

## 1) Cutover Sequence

### T-30: Pre-deploy Validation
```bash
npm run cutover t-30
```
**Wait for**: Gates PASSED + 60s load test < 250ms avg

### T-10: Database Preparation  
```bash
npm run cutover t-10
```
**Wait for**: Migrate deployed + backup/restore test PASSED

### T-0: Canary Deployment
```bash
npm run cutover t0
```
**Action**: Start canary rollout (5% traffic)
**Monitor**: p95/5xx for 10 minutes before full rollout

### T+60: Health Finalization
```bash
npm run cutover t60
```
**Verify**: All systems operational + deployment report generated

---

## 2) Live Monitors (Page if Any Trip)

### Performance SLO Breaches
- **p95 latency > 250ms** (sustained 5+ minutes)
- **5xx rate > 0.5%** (sustained 2+ minutes)

### Security & Auth
- **Auth failure spike** (>100 failures/minute - JWT/clock issues)
- **Public endpoint 401 bypass** (unauthenticated access succeeding)

### Infrastructure
- **DB pool saturation** (>80% connections used)
- **Slow queries > budget** (>1s execution time)
- **Backup job failure** or restore test failure

---

## 3) Hot-Glass Breakers (Emergency Use)

### Instant Endpoint Demotion
```bash
# If a public endpoint goes sideways
npm run emergency:demote /api/analytics
```

### Freeze Public Surface
```bash
# Stop accidental exposure of new endpoints
node scripts/emergency-breakers.mjs freeze-surface
```

### Emergency Sanity Check
```bash
# Verify system integrity
node scripts/emergency-breakers.mjs sanity-check
```

---

## 4) Rollback Plan (Pre-baked)

### Application Rollback
```bash
# Revert to last healthy commit
git revert -m 1 $(git rev-parse --short HEAD)
# Redeploy previous healthy image
```

### Database Rollback
```bash
# Test restore capability first
./scripts/test-backup-restore.sh
# If DB issues: restore from latest backup to new instance
```

### Traffic Rollback
- Reduce canary to 0% traffic
- Route all traffic to previous stable version
- Monitor for 10 minutes before declaring rollback complete

---

## 5) Definition of "Done" ✅

### Technical Validation
- [ ] `npm run gate:production` → **GREEN** (3 passed, 0 critical failures)
- [ ] **Public endpoints = 9**, none using GenericObject
- [ ] **Zero ghost routes** (code routes = spec routes)
- [ ] **Schema compatibility** enforced (additive-only)

### Performance Validation  
- [ ] **30-min soak test** at ≥3× expected RPS
- [ ] **Zero 5xx errors** during load test
- [ ] **p95 latency ≤ 250ms** under full load
- [ ] **Database responsive** during peak load

### Operational Validation
- [ ] **Sentry receiving** real production errors
- [ ] **Dashboards live** (p95, 5xx, auth failures, DB metrics)
- [ ] **Alerts configured** (SLO breaches, error spikes)
- [ ] **Daily backup created** and **restore tested successfully**

### Security Validation
- [ ] **All public endpoints** return 401/403 without valid JWT
- [ ] **CORS configured** with proper origin allowlist
- [ ] **Rate limiting active** (429 responses on burst)
- [ ] **No PII in logs** (verified with sample log review)

---

## 📊 Success Metrics (24hr Post-Deploy)

- **Error Budget**: 5xx rate ≤ 0.5% (allows ~432 errors/day at 100k req/day)
- **Performance**: p95 ≤ 250ms, p99 ≤ 500ms
- **Availability**: >99.9% uptime (≤8.6 minutes downtime/day)
- **Security**: Zero successful unauthenticated requests to public endpoints

---

## 🔄 Day-1 Operations Drumbeat

### Immediate (Hour 1)
- [ ] Verify Sentry events flowing from production
- [ ] Check DB connection pool usage (should be <50%)
- [ ] Monitor API response times and error rates

### Daily (Week 1)
- [ ] Review overnight logs for errors or anomalies
- [ ] Verify backup job completed successfully  
- [ ] Replace 1 GenericObject schema with proper domain type
- [ ] Monitor baseline→implemented route usage

### Weekly
- [ ] Run full security smoke tests
- [ ] Review and update alerting thresholds based on actual traffic
- [ ] Load test with 110% of peak observed traffic

---

**🎯 GO/NO-GO DECISION**

**GREEN = GO** 🟢: All preflight checks pass + cutover sequence completes + "Done" criteria met
**RED = NO-GO** 🔴: Any preflight fails + performance/security validation fails + rollback criteria triggered

**Current Status**: Ready for T-30 initiation
**Next Action**: Run preflight checks, then execute cutover sequence