# Platform Truth Audit

Generated: $(date)
Repo: /Users/nathan/Desktop/claude/Projects/ops-tower

## Summary (Pass/Fail signals)
- Backend → OpenAPI **route drift**: `FAIL`
  - Undocumented live routes: 4
  - Spec-only ghost routes: 0
- Frontend → Backend **API usage listed**: 0 paths referenced by FE
- **Tests present**: 50
- **TypeScript config**: yes
- **CI workflows**: 2
  - Drift Guard: YES
  - Version Guard: YES
  - Pre-commit hooks (husky): FOUND
- **Deployability**
  - Dockerfiles: 0
  - docker-compose files: 5
  - K8s manifests: 1
- **Observability hooks** (sentry/datadog/otel) lines: 0
- **.env / secrets markers** (needs review): 50

## Details

### 1) Backend vs OpenAPI (routes)
**Code routes**: `audit/code_routes.txt`  
**Spec routes**: `audit/spec_routes.txt`

- **Missing in docs** (exists in code, not in OpenAPI):
```
GET( /api/drivers
PATCH( /api/drivers
POST( /api/regions
POST( /api/rides/request
```

- **Missing in code** (in OpenAPI, not in code):
```

```

### 2) Frontend scan
- Router & API usage: `audit/frontend_scan.txt`
- Referenced API paths:
```

```

### 3) DB/Migrations Tooling
Files:
```



```

### 4) Observability hooks
```

```

### 5) Secrets & env usage (review for leaks)
```

```

### 6) CI Workflows
- drift-guard.yml
- openapi-version-guard.yml