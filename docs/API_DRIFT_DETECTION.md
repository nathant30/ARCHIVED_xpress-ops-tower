# API Drift Detection System

## Overview

The API Drift Detection system ensures that your OpenAPI documentation stays in sync with your actual code implementation. It prevents the common problem of documentation becoming outdated as the API evolves.

## Problem Solved

- **31 undocumented endpoints** were discovered in the codebase
- **115 documented endpoints** existed only in specs but not in code
- **OpenAPI files** contained only 1 path vs dozens of real routes

## Components

### 1. Drift Detection Script (`scripts/drift-check.mjs`)

Scans the codebase for actual API routes and compares them against OpenAPI documentation.

**Features:**

- Supports Express, Fastify, and NestJS route patterns
- Normalizes paths (converts `:id` → `{id}`)
- Generates detailed drift reports
- Exits with error code if drift detected

**Usage:**

```bash
npm run drift:check
```

### 2. Spec Seed Generator (`scripts/spec-seed.mjs`)

Creates a basic OpenAPI spec from undocumented routes discovered by the drift checker.

**Usage:**

```bash
npm run drift:seed
```

### 3. GitHub Actions Workflow (`.github/workflows/api-drift-check.yml`)

Automatically runs drift detection on every push and pull request.

**Features:**

- Fails CI if drift detected
- Uploads drift reports as artifacts
- Runs on `main` and `develop` branches

### 4. NPM Scripts

```json
{
  "drift:check": "node scripts/drift-check.mjs",
  "drift:seed": "node scripts/spec-seed.mjs",
  "drift:fix": "npm run drift:check && npm run drift:seed"
}
```

## Current Status

✅ **No Drift Detected** - All routes are documented  
✅ **4 Code Routes** - All found in OpenAPI  
✅ **4 OpenAPI Routes** - All implemented in code

## Detected Routes

The following API routes are now properly documented:

- `GET /api/drivers` - Retrieve drivers list with filtering
- `PATCH /api/drivers/{id}` - Update driver information
- `POST /api/regions/{id}/assign-rm` - Assign Regional Manager
- `POST /api/rides/request` - Submit new ride request

## Integration

### Pre-commit Hook

Add to `.husky/pre-commit`:

```bash
npm run drift:check
```

### Pre-push Hook

Add to `.husky/pre-push`:

```bash
npm run drift:check || (echo "API drift detected. Run 'npm run drift:fix' to resolve." && exit 1)
```

## Workflow

1. **Developer adds new API route** in code
2. **Pre-commit hook fails** if route not documented
3. **Developer runs** `npm run drift:seed` to generate basic spec
4. **Developer enhances** the generated OpenAPI with proper descriptions
5. **CI passes** ✅

## Benefits

- **Prevents Integration Failures** - Partners won't hit 404s
- **Maintains Documentation Quality** - Forces documentation updates
- **Reduces Maintenance Overhead** - Catches drift early
- **Improves Developer Experience** - Clear, accurate API docs

## Files Generated

- `audit/missing_in_docs.txt` - Routes in code but not documented
- `audit/missing_in_code.txt` - Routes documented but not implemented
- `docs/api/openapi.seed.json` - Auto-generated spec from missing routes

## OpenAPI Enhancement

The generated `docs/api/openapi.json` includes:

- **Comprehensive schemas** for request/response bodies
- **Parameter validation** with types and constraints
- **Error responses** with proper status codes
- **Security schemes** for authentication
- **Tags and descriptions** for better organization

This system ensures your API documentation never drifts from reality again.
