#!/usr/bin/env node
import fs from "fs";

console.log("🔒 Applying production hardening...\n");

// 1. Create middleware for security headers
const securityMiddleware = `// Security middleware for production
import helmet from "helmet";
import cors from "cors";

export function applySecurityMiddleware(app) {
  // Security headers
  app.use(helmet({ 
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }));
  
  // CORS with proper origins
  app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ["http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true
  }));
  
  // Strong ETags
  app.set("etag", "strong");
  
  // Request correlation ID
  app.use((req, res, next) => {
    req.correlationId = req.headers['x-correlation-id'] || 
                       require('crypto').randomUUID();
    res.set('X-Correlation-ID', req.correlationId);
    next();
  });
}`;

fs.writeFileSync('src/middleware/security.js', securityMiddleware);
console.log("✅ Created security middleware: src/middleware/security.js");

// 2. Create idempotency middleware
const idempotencyMiddleware = `// Idempotency middleware for mutations
import { prisma } from '@/lib/prisma';

export function requireIdempotency(req, res, next) {
  if (!['POST', 'PUT', 'PATCH'].includes(req.method)) return next();
  
  const key = req.header("Idempotency-Key");
  if (!key) {
    return res.status(400).json({
      type: "https://tools.ietf.org/html/rfc7231#section-6.5.1",
      title: "Missing Idempotency Key",
      status: 400,
      detail: "Idempotency-Key header required for mutation operations"
    });
  }
  
  // Store key for downstream processing
  req.idempotencyKey = key;
  next();
}`;

fs.writeFileSync('src/middleware/idempotency.js', idempotencyMiddleware);
console.log("✅ Created idempotency middleware: src/middleware/idempotency.js");

// 3. Create unified error handler
const errorHandler = `// Unified error handler with RFC 7807 format
export function handleError(err, req, res, next) {
  const correlationId = req.correlationId;
  
  // Log error with correlation ID
  console.error(\`[\${correlationId}] Error:\`, err);
  
  // Determine error type and status
  let status = 500;
  let type = "about:blank";
  let title = "Internal Server Error";
  let detail = "An unexpected error occurred";
  
  if (err.name === 'ValidationError') {
    status = 400;
    type = "https://tools.ietf.org/html/rfc7231#section-6.5.1";
    title = "Validation Failed";
    detail = err.message;
  } else if (err.name === 'UnauthorizedError') {
    status = 401;
    type = "https://tools.ietf.org/html/rfc7235#section-3.1";
    title = "Unauthorized";
    detail = "Invalid or missing authentication";
  }
  
  // RFC 7807 Problem Details format
  res.status(status).json({
    type,
    title, 
    status,
    detail,
    instance: req.originalUrl,
    correlationId
  });
}`;

fs.writeFileSync('src/middleware/errorHandler.js', errorHandler);
console.log("✅ Created error handler: src/middleware/errorHandler.js");

// 4. Create Docker setup for PostgreSQL
const dockerCompose = `# Production-grade PostgreSQL setup
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: xpress
      POSTGRES_USER: xpress_user
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD}
      PGDATA: /var/lib/postgresql/data/pgdata
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/backups:/backups
    ports:
      - "5432:5432"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U xpress_user -d xpress"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:`;

fs.writeFileSync('docker-compose.prod.yml', dockerCompose);
console.log("✅ Created production Docker Compose: docker-compose.prod.yml");

// 5. Create backup script
const backupScript = `#!/bin/bash
# PostgreSQL backup script
set -e

DB_NAME="xpress"
DB_USER="xpress_user" 
BACKUP_DIR="./database/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

echo "Creating backup: $BACKUP_DIR/backup_$TIMESTAMP.sql"
pg_dump -h localhost -U $DB_USER -d $DB_NAME > "$BACKUP_DIR/backup_$TIMESTAMP.sql"

# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.sql" -type f -mtime +7 -delete

echo "Backup completed: $(ls -la $BACKUP_DIR/backup_$TIMESTAMP.sql)"`;

fs.writeFileSync('scripts/backup-db.sh', backupScript);
fs.chmodSync('scripts/backup-db.sh', '755');
console.log("✅ Created backup script: scripts/backup-db.sh");

// 6. Create environment template
const envTemplate = `# Production Environment Template
DATABASE_URL="postgresql://xpress_user:password@localhost:5432/xpress?schema=public"
POSTGRES_PASSWORD="your-secure-password-here"

# JWT Configuration  
JWT_SECRET="your-256-bit-secret-here"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# CORS
ALLOWED_ORIGINS="https://your-app.com,https://app.your-domain.com"

# Rate Limiting
RATE_LIMIT_WINDOW_MS="900000"  # 15 minutes
RATE_LIMIT_MAX_REQUESTS="100"

# Monitoring
SENTRY_DSN="your-sentry-dsn-here"
LOG_LEVEL="info"

# Server
PORT="4000"
NODE_ENV="production"`;

fs.writeFileSync('.env.production.template', envTemplate);
console.log("✅ Created environment template: .env.production.template");

console.log(`
🎯 Production hardening complete!

Next steps:
1. Install security packages: npm install helmet cors
2. Copy .env.production.template to .env.production and fill values  
3. Start PostgreSQL: docker-compose -f docker-compose.prod.yml up -d
4. Migrate database: DATABASE_URL=postgresql://... npx prisma migrate deploy
5. Set up daily backups: crontab -e → 0 2 * * * /path/to/scripts/backup-db.sh
6. Configure monitoring dashboards and alerts

🚀 Run production gate before deploy: npm run gate:production
`);