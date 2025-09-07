# Code Reality Report
Generated: 2025-09-07T05:19:52.939Z

## Summary
- Routes detected: **19**
- High maturity (≥4): **0**
- Low maturity (≤1): **16**

## Top endpoints by maturity
| Method | Path | Score | Auth | RBAC | Validation | DB | ExtCalls | Tests | File |
|-------:|------|------:|:----:|:----:|:----------:|:--:|:--------:|:-----:|------|
| GET | `/api/drivers` | 3 | ✅ | ✅ | ✅ |  |  | ✅ | src/middleware/accessContext.ts |
| PATCH | `/api/drivers/{id}` | 3 | ✅ | ✅ | ✅ |  |  | ✅ | src/middleware/accessContext.ts |
| POST | `/api/regions/{id}/assign-rm` | 3 | ✅ | ✅ | ✅ |  |  | ✅ | src/middleware/accessContext.ts |
| GET | `/api/alerts` | 1 | ✅ |  |  |  |  |  | src/generated/stub-routes.ts |
| GET | `/api/analytics` | 1 | ✅ |  |  |  |  |  | src/generated/stub-routes.ts |
| GET | `/api/auth/mfa/challenge` | 1 | ✅ |  |  |  |  |  | src/generated/stub-routes.ts |
| GET | `/api/auth/mfa/verify` | 1 | ✅ |  |  |  |  |  | src/generated/stub-routes.ts |
| GET | `/api/bookings` | 1 | ✅ |  |  |  |  |  | src/generated/stub-routes.ts |
| GET | `/api/drivers/{param}/status` | 1 | ✅ |  |  |  |  |  | src/generated/stub-routes.ts |
| GET | `/api/metrics` | 1 | ✅ |  |  |  |  |  | src/generated/stub-routes.ts |
| GET | `/api/pricing/events` | 1 | ✅ |  |  |  |  |  | src/generated/stub-routes.ts |
| GET | `/api/pricing/profiles` | 1 | ✅ |  |  |  |  |  | src/generated/stub-routes.ts |
| GET | `/api/pricing/profiles/{param}` | 1 | ✅ |  |  |  |  |  | src/generated/stub-routes.ts |
| GET | `/api/pricing/profiles/{param}/components` | 1 | ✅ |  |  |  |  |  | src/generated/stub-routes.ts |
| GET | `/api/pricing/profiles/{param}/preview` | 1 | ✅ |  |  |  |  |  | src/generated/stub-routes.ts |
| GET | `/api/pricing/taxi-fares` | 1 | ✅ |  |  |  |  |  | src/generated/stub-routes.ts |
| GET | `/api/pricing/tnvs-fares` | 1 | ✅ |  |  |  |  |  | src/generated/stub-routes.ts |
| GET | `/api/pricing/tolls` | 1 | ✅ |  |  |  |  |  | src/generated/stub-routes.ts |
| POST | `/api/rides/request` | 1 | ✅ |  |  |  |  |  | src/lib/fraud/rideFlowIntegration.ts |

## Capability Map (by code presence)
- DB: prisma(5), knex(0), typeorm(0)
- Jobs: bull/bullmq(0), agenda(0), cron(3)
- Integrations: stripe(3), twilio(16), sendgrid(13), s3(2), googleapis(5), redis(58)
- Security/Observability: helmet(0), cors(0), rateLimit(20), sentry(0), otel(1)