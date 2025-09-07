# DevOps Specification - Xpress Ops Tower

## Overview

This document outlines the complete DevOps strategy, implementation, and operational procedures for the Xpress Ops Tower platform. It covers CI/CD pipelines, infrastructure automation, monitoring, security practices, and operational excellence for production-grade ridesharing operations in the Philippines.

## DevOps Architecture Overview

### Core DevOps Components

```mermaid
graph TB
    subgraph "Development Lifecycle"
        A[Source Code Management]
        B[Code Quality Gates]
        C[Automated Testing]
        D[Security Scanning]
    end
    
    subgraph "Build & Deploy Pipeline"
        E[Continuous Integration]
        F[Artifact Management]
        G[Environment Provisioning]
        H[Continuous Deployment]
    end
    
    subgraph "Infrastructure Management"
        I[Infrastructure as Code]
        J[Configuration Management]
        K[Container Orchestration]
        L[Service Mesh]
    end
    
    subgraph "Operations & Monitoring"
        M[Application Monitoring]
        N[Infrastructure Monitoring]
        O[Log Management]
        P[Alerting & Incident Response]
    end
    
    A --> E
    B --> F
    C --> G
    D --> H
    
    E --> I
    F --> J
    G --> K
    H --> L
    
    I --> M
    J --> N
    K --> O
    L --> P
```

## 1. Source Code Management & Version Control

### 1.1 Git Strategy

#### Repository Structure
```
ops-tower/
├── apps/
│   ├── web-dashboard/          # Next.js frontend
│   ├── mobile-driver/          # React Native driver app
│   ├── mobile-passenger/       # React Native passenger app
│   └── admin-portal/           # Admin management portal
├── services/
│   ├── user-service/           # User management microservice
│   ├── trip-service/           # Trip management microservice
│   ├── payment-service/        # Payment processing service
│   ├── ai-fraud-service/       # AI fraud detection service
│   └── notification-service/   # Communication service
├── infrastructure/
│   ├── terraform/              # Infrastructure as Code
│   ├── kubernetes/             # K8s manifests
│   ├── helm-charts/           # Helm packages
│   └── scripts/               # Automation scripts
├── shared/
│   ├── types/                 # Shared TypeScript types
│   ├── utils/                 # Common utilities
│   ├── configs/               # Shared configurations
│   └── schemas/               # API schemas
└── .github/
    ├── workflows/             # GitHub Actions
    └── templates/             # PR/Issue templates
```

#### Branching Strategy
```yaml
branching_strategy:
  main_branch: main
  development_branch: develop
  feature_branches: feature/*
  release_branches: release/*
  hotfix_branches: hotfix/*
  
  protection_rules:
    main:
      - require_pull_request_reviews: 2
      - dismiss_stale_reviews: true
      - require_status_checks: true
      - require_up_to_date_branches: true
      - restrict_pushes: true
      
    develop:
      - require_pull_request_reviews: 1
      - require_status_checks: true
      - allow_force_pushes: false
```

### 1.2 Code Quality Gates

#### Pre-commit Hooks
```yaml
pre_commit_config:
  repos:
    - repo: https://github.com/pre-commit/pre-commit-hooks
      hooks:
        - id: trailing-whitespace
        - id: end-of-file-fixer
        - id: check-yaml
        - id: check-json
        
    - repo: https://github.com/psf/black
      hooks:
        - id: black
          language_version: python3.9
          
    - repo: https://github.com/pycqa/isort
      hooks:
        - id: isort
          args: ["--profile", "black"]
          
    - repo: local
      hooks:
        - id: eslint
          name: eslint
          entry: npm run lint
          language: node
          files: \.(js|ts|tsx)$
```

#### Code Review Requirements
```yaml
code_review_process:
  required_reviewers:
    critical_changes: 2_senior_engineers
    security_changes: security_team_member
    infrastructure_changes: devops_team_member
    database_changes: dba_approval
    
  automated_checks:
    - unit_test_coverage: >80%
    - integration_test_pass: required
    - security_scan_pass: required
    - performance_benchmark: required
    - documentation_updated: required
    
  review_criteria:
    - code_quality
    - security_considerations
    - performance_impact
    - scalability_implications
    - maintainability
    - test_coverage
```

## 2. Continuous Integration Pipeline

### 2.1 GitHub Actions Workflows

#### Main CI Pipeline
```yaml
# .github/workflows/ci.yml
name: Continuous Integration

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  NODE_VERSION: '18'
  PYTHON_VERSION: '3.9'
  GO_VERSION: '1.21'

jobs:
  code-quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run linting
        run: npm run lint
        
      - name: Run type checking
        run: npm run type-check
        
      - name: Check code formatting
        run: npm run format:check

  unit-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: [user-service, trip-service, payment-service, ai-fraud-service]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          
      - name: Install dependencies
        run: npm ci
        working-directory: services/${{ matrix.service }}
        
      - name: Run unit tests
        run: npm run test:unit -- --coverage
        working-directory: services/${{ matrix.service }}
        
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: services/${{ matrix.service }}/coverage/lcov.info
          flags: ${{ matrix.service }}

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
          
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
          
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run database migrations
        run: npm run migrate:test
        env:
          DATABASE_URL: postgres://postgres:postgres@localhost:5432/testdb
          
      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgres://postgres:postgres@localhost:5432/testdb
          REDIS_URL: redis://localhost:6379

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Semgrep security scan
        uses: returntocorp/semgrep-action@v1
        with:
          config: >-
            p/security-audit
            p/secrets
            p/owasp-top-ten
            
      - name: Run npm audit
        run: npm audit --audit-level=moderate
        
      - name: Run Docker security scan
        uses: aquasec/trivy-action@master
        with:
          scan-type: 'fs'
          format: 'sarif'
          output: 'trivy-results.sarif'
          
      - name: Upload security scan results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'

  build-and-push:
    runs-on: ubuntu-latest
    needs: [code-quality, unit-tests, integration-tests, security-scan]
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop'
    
    strategy:
      matrix:
        service: [user-service, trip-service, payment-service, ai-fraud-service]
        
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
        
      - name: Login to ECR
        uses: aws-actions/amazon-ecr-login@v1
        
      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: services/${{ matrix.service }}
          platforms: linux/amd64,linux/arm64
          push: true
          tags: |
            ${{ secrets.ECR_REGISTRY }}/ops-tower-${{ matrix.service }}:${{ github.sha }}
            ${{ secrets.ECR_REGISTRY }}/ops-tower-${{ matrix.service }}:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

### 2.2 Testing Strategy

#### Test Pyramid Implementation
```yaml
testing_strategy:
  unit_tests:
    coverage_threshold: 80%
    frameworks:
      - jest (JavaScript/TypeScript)
      - pytest (Python)
      - go test (Go)
    focus:
      - business_logic
      - utility_functions
      - data_transformations
      - validation_rules
      
  integration_tests:
    coverage_threshold: 60%
    frameworks:
      - supertest (API testing)
      - testcontainers (database testing)
      - cypress (component testing)
    focus:
      - api_endpoints
      - database_operations
      - external_integrations
      - service_interactions
      
  e2e_tests:
    coverage_threshold: 30%
    frameworks:
      - playwright (web testing)
      - detox (mobile testing)
      - k6 (performance testing)
    focus:
      - user_workflows
      - critical_business_paths
      - cross_platform_compatibility
      - performance_benchmarks
```

#### Test Configuration
```typescript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/types/**/*'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{ts,tsx}'
  ]
};
```

## 3. Container Strategy

### 3.1 Docker Configuration

#### Multi-stage Build Example
```dockerfile
# services/user-service/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM node:18-alpine AS development
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

FROM builder AS production-builder
COPY . .
RUN npm run build && npm prune --production

FROM node:18-alpine AS production
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

WORKDIR /app
COPY --from=production-builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=production-builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=production-builder --chown=nextjs:nodejs /app/package.json ./package.json

USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "dist/index.js"]
```

#### Docker Compose for Development
```yaml
# docker-compose.yml
version: '3.8'

services:
  user-service:
    build:
      context: ./services/user-service
      target: development
    ports:
      - "3001:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgres://postgres:password@postgres:5432/ops_tower
      - REDIS_URL=redis://redis:6379
    volumes:
      - ./services/user-service:/app
      - /app/node_modules
    depends_on:
      - postgres
      - redis
      
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: ops_tower
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### 3.2 Container Security

#### Security Hardening
```dockerfile
# Security best practices in Dockerfile
FROM node:18-alpine

# Create non-root user
RUN addgroup -g 1001 -S appuser && \
    adduser -S appuser -u 1001 -G appuser

# Install security updates
RUN apk update && apk upgrade && \
    apk add --no-cache dumb-init && \
    rm -rf /var/cache/apk/*

# Set up application directory
WORKDIR /app
RUN chown -R appuser:appuser /app

# Copy and install dependencies as non-root
USER appuser
COPY --chown=appuser:appuser package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY --chown=appuser:appuser . .

# Security configurations
ENV NODE_ENV=production
ENV NPM_CONFIG_LOGLEVEL=warn

# Remove unnecessary packages
RUN npm prune --production

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "index.js"]
```

## 4. Infrastructure as Code

### 4.1 Terraform Configuration

#### AWS Infrastructure
```hcl
# infrastructure/terraform/main.tf
terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.20"
    }
  }
  
  backend "s3" {
    bucket         = "ops-tower-terraform-state"
    key            = "infrastructure/terraform.tfstate"
    region         = "ap-southeast-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "ops-tower"
      Environment = var.environment
      ManagedBy   = "terraform"
      Owner       = "devops-team"
    }
  }
}

# VPC Configuration
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  
  name = "ops-tower-${var.environment}"
  cidr = var.vpc_cidr
  
  azs             = var.availability_zones
  private_subnets = var.private_subnets
  public_subnets  = var.public_subnets
  
  enable_nat_gateway     = true
  enable_vpn_gateway     = false
  enable_dns_hostnames   = true
  enable_dns_support     = true
  
  tags = {
    Environment = var.environment
  }
}

# EKS Cluster
module "eks" {
  source = "terraform-aws-modules/eks/aws"
  
  cluster_name    = "ops-tower-${var.environment}"
  cluster_version = "1.27"
  
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets
  
  cluster_endpoint_private_access = true
  cluster_endpoint_public_access  = true
  
  node_groups = {
    main = {
      desired_capacity = var.node_group_desired_capacity
      max_capacity     = var.node_group_max_capacity
      min_capacity     = var.node_group_min_capacity
      
      instance_types = var.node_instance_types
      
      k8s_labels = {
        Environment = var.environment
        NodeGroup   = "main"
      }
    }
    
    gpu = {
      desired_capacity = 2
      max_capacity     = 10
      min_capacity     = 0
      
      instance_types = ["g4dn.xlarge"]
      
      k8s_labels = {
        Environment = var.environment
        NodeGroup   = "gpu"
        WorkloadType = "ai-ml"
      }
      
      taints = {
        dedicated = {
          key    = "ai-workload"
          value  = "true"
          effect = "NO_SCHEDULE"
        }
      }
    }
  }
}

# RDS Database
resource "aws_db_instance" "main" {
  identifier = "ops-tower-${var.environment}"
  
  engine         = "postgres"
  engine_version = "14.9"
  instance_class = var.db_instance_class
  
  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage
  
  db_name  = var.db_name
  username = var.db_username
  password = var.db_password
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  
  backup_retention_period = var.db_backup_retention_period
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  deletion_protection = var.environment == "production"
  skip_final_snapshot = var.environment != "production"
  
  performance_insights_enabled = true
  monitoring_interval         = 60
  monitoring_role_arn        = aws_iam_role.rds_monitoring.arn
  
  tags = {
    Name        = "ops-tower-${var.environment}"
    Environment = var.environment
  }
}

# ElastiCache Redis
resource "aws_elasticache_replication_group" "main" {
  replication_group_id = "ops-tower-${var.environment}"
  description         = "Redis cluster for Ops Tower ${var.environment}"
  
  port               = 6379
  parameter_group_name = "default.redis7"
  
  num_cache_clusters = var.redis_num_cache_nodes
  node_type         = var.redis_node_type
  
  subnet_group_name  = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.redis.id]
  
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  
  automatic_failover_enabled = var.redis_num_cache_nodes > 1
  multi_az_enabled          = var.redis_num_cache_nodes > 1
  
  tags = {
    Name        = "ops-tower-${var.environment}"
    Environment = var.environment
  }
}
```

#### Environment Variables
```hcl
# infrastructure/terraform/variables.tf
variable "environment" {
  description = "Environment name"
  type        = string
  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "Environment must be development, staging, or production."
  }
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-southeast-1"
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones"
  type        = list(string)
  default     = ["ap-southeast-1a", "ap-southeast-1b", "ap-southeast-1c"]
}

variable "private_subnets" {
  description = "Private subnet CIDR blocks"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "public_subnets" {
  description = "Public subnet CIDR blocks"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
}
```

### 4.2 Kubernetes Manifests

#### Service Deployment
```yaml
# infrastructure/kubernetes/user-service.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
  namespace: ops-tower
  labels:
    app: user-service
    version: v1
spec:
  replicas: 3
  selector:
    matchLabels:
      app: user-service
      version: v1
  template:
    metadata:
      labels:
        app: user-service
        version: v1
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "3000"
        prometheus.io/path: "/metrics"
    spec:
      serviceAccountName: user-service
      containers:
      - name: user-service
        image: ops-tower/user-service:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-credentials
              key: url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-credentials
              key: url
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
        securityContext:
          allowPrivilegeEscalation: false
          runAsNonRoot: true
          runAsUser: 1001
          capabilities:
            drop:
            - ALL

---
apiVersion: v1
kind: Service
metadata:
  name: user-service
  namespace: ops-tower
  labels:
    app: user-service
spec:
  selector:
    app: user-service
  ports:
  - name: http
    port: 80
    targetPort: 3000
  type: ClusterIP

---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: user-service-hpa
  namespace: ops-tower
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: user-service
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

## 5. Continuous Deployment

### 5.1 GitOps with ArgoCD

#### ArgoCD Application
```yaml
# infrastructure/gitops/user-service-app.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: user-service
  namespace: argocd
spec:
  project: ops-tower
  source:
    repoURL: https://github.com/xpress/ops-tower
    targetRevision: HEAD
    path: infrastructure/kubernetes/user-service
  destination:
    server: https://kubernetes.default.svc
    namespace: ops-tower
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
    - CreateNamespace=true
  revisionHistoryLimit: 10
```

#### Progressive Delivery with Rollouts
```yaml
# infrastructure/kubernetes/user-service-rollout.yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: user-service
  namespace: ops-tower
spec:
  replicas: 5
  strategy:
    canary:
      canaryService: user-service-canary
      stableService: user-service-stable
      trafficRouting:
        istio:
          virtualService:
            name: user-service-vs
            routes:
            - primary
      steps:
      - setWeight: 20
      - pause: {duration: 10m}
      - setWeight: 40
      - pause: {duration: 10m}
      - setWeight: 60
      - pause: {duration: 10m}
      - setWeight: 80
      - pause: {duration: 10m}
      analysis:
        templates:
        - templateName: success-rate
        args:
        - name: service-name
          value: user-service
  selector:
    matchLabels:
      app: user-service
  template:
    metadata:
      labels:
        app: user-service
    spec:
      containers:
      - name: user-service
        image: ops-tower/user-service:latest
        ports:
        - containerPort: 3000
```

### 5.2 Deployment Environments

#### Environment Promotion Strategy
```yaml
environments:
  development:
    auto_deploy: true
    branch: develop
    cluster: dev-cluster
    namespace: ops-tower-dev
    replicas: 1
    resources:
      cpu: 100m
      memory: 256Mi
    
  staging:
    auto_deploy: false
    branch: main
    cluster: staging-cluster
    namespace: ops-tower-staging
    replicas: 2
    resources:
      cpu: 200m
      memory: 512Mi
    approval_required: true
    
  production:
    auto_deploy: false
    branch: main
    cluster: prod-cluster
    namespace: ops-tower-prod
    replicas: 5
    resources:
      cpu: 500m
      memory: 1Gi
    approval_required: true
    deployment_strategy: blue_green
```

## 6. Monitoring & Observability

### 6.1 Application Monitoring

#### Prometheus Configuration
```yaml
# infrastructure/monitoring/prometheus-config.yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "ops-tower-rules.yml"

scrape_configs:
  - job_name: 'ops-tower-services'
    kubernetes_sd_configs:
    - role: endpoints
      namespaces:
        names:
        - ops-tower
    relabel_configs:
    - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_scrape]
      action: keep
      regex: true
    - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_path]
      action: replace
      target_label: __metrics_path__
      regex: (.+)
    - source_labels: [__address__, __meta_kubernetes_service_annotation_prometheus_io_port]
      action: replace
      regex: ([^:]+)(?::\d+)?;(\d+)
      replacement: $1:$2
      target_label: __address__

  - job_name: 'kubernetes-apiservers'
    kubernetes_sd_configs:
    - role: endpoints
    scheme: https
    tls_config:
      ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
    bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
    relabel_configs:
    - source_labels: [__meta_kubernetes_namespace, __meta_kubernetes_service_name, __meta_kubernetes_endpoint_port_name]
      action: keep
      regex: default;kubernetes;https

alerting:
  alertmanagers:
  - static_configs:
    - targets:
      - alertmanager:9093
```

#### Grafana Dashboards
```json
{
  "dashboard": {
    "id": null,
    "title": "Ops Tower - Service Overview",
    "tags": ["ops-tower", "microservices"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total[5m])) by (service)",
            "legendFormat": "{{service}}"
          }
        ],
        "yAxes": [
          {
            "label": "requests/sec"
          }
        ]
      },
      {
        "id": 2,
        "title": "Response Time P95",
        "type": "graph", 
        "targets": [
          {
            "expr": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service))",
            "legendFormat": "{{service}}"
          }
        ],
        "yAxes": [
          {
            "label": "seconds"
          }
        ]
      },
      {
        "id": 3,
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total{status=~\"5..\"}[5m])) by (service) / sum(rate(http_requests_total[5m])) by (service)",
            "legendFormat": "{{service}}"
          }
        ],
        "yAxes": [
          {
            "label": "error rate",
            "max": 1,
            "min": 0
          }
        ]
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "5s"
  }
}
```

### 6.2 Logging Strategy

#### ELK Stack Configuration
```yaml
# infrastructure/logging/elasticsearch.yaml
apiVersion: elasticsearch.k8s.elastic.co/v1
kind: Elasticsearch
metadata:
  name: ops-tower-es
  namespace: elastic-system
spec:
  version: 8.9.0
  nodeSets:
  - name: default
    count: 3
    config:
      node.store.allow_mmap: false
      xpack.security.enabled: true
      xpack.security.transport.ssl.enabled: true
      xpack.security.transport.ssl.verification_mode: certificate
      xpack.security.transport.ssl.client_authentication: required
      xpack.security.transport.ssl.keystore.path: /usr/share/elasticsearch/config/certs/elastic-certificates.p12
      xpack.security.transport.ssl.truststore.path: /usr/share/elasticsearch/config/certs/elastic-certificates.p12
    podTemplate:
      spec:
        containers:
        - name: elasticsearch
          resources:
            limits:
              memory: 4Gi
              cpu: 2
            requests:
              memory: 4Gi
              cpu: 1
    volumeClaimTemplates:
    - metadata:
        name: elasticsearch-data
      spec:
        accessModes:
        - ReadWriteOnce
        resources:
          requests:
            storage: 100Gi
        storageClassName: gp3

---
apiVersion: kibana.k8s.elastic.co/v1
kind: Kibana
metadata:
  name: ops-tower-kibana
  namespace: elastic-system
spec:
  version: 8.9.0
  count: 1
  elasticsearchRef:
    name: ops-tower-es
  config:
    xpack.fleet.agents.elasticsearch.hosts: ["https://ops-tower-es-es-http.elastic-system.svc:9200"]
    xpack.fleet.agents.fleet_server.hosts: ["https://fleet-server-agent-http.elastic-system.svc:8220"]
  podTemplate:
    spec:
      containers:
      - name: kibana
        resources:
          limits:
            memory: 2Gi
            cpu: 1
          requests:
            memory: 2Gi
            cpu: 0.5
```

### 6.3 Alerting Rules

#### Prometheus Alert Rules
```yaml
# infrastructure/monitoring/ops-tower-rules.yml
groups:
  - name: ops-tower.rules
    rules:
    - alert: ServiceDown
      expr: up == 0
      for: 1m
      labels:
        severity: critical
      annotations:
        summary: "Service {{ $labels.instance }} is down"
        description: "Service {{ $labels.instance }} has been down for more than 1 minute."
        
    - alert: HighErrorRate
      expr: |
        (
          sum(rate(http_requests_total{status=~"5.."}[5m])) by (service)
          /
          sum(rate(http_requests_total[5m])) by (service)
        ) > 0.05
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "High error rate for {{ $labels.service }}"
        description: "Error rate for {{ $labels.service }} is {{ $value | humanizePercentage }}."
        
    - alert: HighLatency
      expr: histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service)) > 0.5
      for: 10m
      labels:
        severity: warning
      annotations:
        summary: "High latency for {{ $labels.service }}"
        description: "95th percentile latency for {{ $labels.service }} is {{ $value }}s."
        
    - alert: DatabaseConnectionHigh
      expr: |
        (
          sum(database_connections_active) by (instance)
          /
          sum(database_connections_max) by (instance)
        ) > 0.8
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "High database connection usage"
        description: "Database connection usage is {{ $value | humanizePercentage }} on {{ $labels.instance }}."
        
    - alert: PodCrashLooping
      expr: increase(kube_pod_container_status_restarts_total[1h]) > 5
      for: 5m
      labels:
        severity: critical
      annotations:
        summary: "Pod {{ $labels.pod }} is crash looping"
        description: "Pod {{ $labels.pod }} in namespace {{ $labels.namespace }} is restarting frequently."
```

## 7. Security & Compliance

### 7.1 Security Scanning

#### Container Security Scanning
```yaml
# .github/workflows/security-scan.yml
name: Security Scan

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM

jobs:
  container-scan:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: [user-service, trip-service, payment-service, ai-fraud-service]
        
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Build Docker image
        run: |
          docker build -t ${{ matrix.service }}:latest ./services/${{ matrix.service }}
          
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ matrix.service }}:latest
          format: 'sarif'
          output: 'trivy-results-${{ matrix.service }}.sarif'
          
      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v2
        if: always()
        with:
          sarif_file: 'trivy-results-${{ matrix.service }}.sarif'
          
      - name: Run Snyk security scan
        uses: snyk/actions/docker@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          image: ${{ matrix.service }}:latest
          args: --severity-threshold=high
```

### 7.2 Secrets Management

#### HashiCorp Vault Integration
```yaml
# infrastructure/security/vault-config.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: vault
  namespace: vault
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: vault-server-binding
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: system:auth-delegator
subjects:
- kind: ServiceAccount
  name: vault
  namespace: vault
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: vault-config
  namespace: vault
data:
  vault.hcl: |
    ui = true
    
    listener "tcp" {
      address = "0.0.0.0:8200"
      tls_disable = false
      tls_cert_file = "/vault/tls/tls.crt"
      tls_key_file = "/vault/tls/tls.key"
    }
    
    storage "postgresql" {
      connection_url = "postgres://vault:password@postgres:5432/vault?sslmode=require"
      table = "vault_kv_store"
      max_parallel = "128"
    }
    
    seal "awskms" {
      region = "ap-southeast-1"
      kms_key_id = "alias/vault-unseal-key"
    }
    
    api_addr = "https://vault.ops-tower.internal:8200"
    cluster_addr = "https://vault.ops-tower.internal:8201"
```

### 7.3 Network Security

#### Network Policies
```yaml
# infrastructure/security/network-policies.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: ops-tower-network-policy
  namespace: ops-tower
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: istio-system
    - namespaceSelector:
        matchLabels:
          name: ops-tower
    ports:
    - protocol: TCP
      port: 3000
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: ops-tower
    ports:
    - protocol: TCP
      port: 3000
  - to: []
    ports:
    - protocol: TCP
      port: 443
    - protocol: TCP
      port: 5432
    - protocol: TCP
      port: 6379
```

## 8. Disaster Recovery & Business Continuity

### 8.1 Backup Strategy

#### Database Backup Configuration
```yaml
# infrastructure/backup/database-backup.yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: postgres-backup
  namespace: ops-tower
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: postgres-backup
            image: postgres:14
            env:
            - name: PGPASSWORD
              valueFrom:
                secretKeyRef:
                  name: postgres-credentials
                  key: password
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: postgres-credentials
                  key: url
            command:
            - /bin/bash
            - -c
            - |
              DATE=$(date +%Y%m%d_%H%M%S)
              pg_dump $DATABASE_URL > /backup/ops_tower_$DATE.sql
              aws s3 cp /backup/ops_tower_$DATE.sql s3://ops-tower-backups/database/
              find /backup -name "*.sql" -mtime +7 -delete
            volumeMounts:
            - name: backup-storage
              mountPath: /backup
          volumes:
          - name: backup-storage
            emptyDir: {}
          restartPolicy: OnFailure
```

### 8.2 Disaster Recovery Plan

#### Recovery Procedures
```yaml
disaster_recovery:
  rto: 4_hours  # Recovery Time Objective
  rpo: 1_hour   # Recovery Point Objective
  
  procedures:
    level_1_incident:  # Service degradation
      detection: automated_alerts
      escalation: on_call_engineer
      response_time: 15_minutes
      
    level_2_incident:  # Service outage
      detection: automated_alerts + monitoring
      escalation: incident_commander + engineering_team
      response_time: 5_minutes
      
    level_3_incident:  # Data center failure
      detection: infrastructure_monitoring
      escalation: all_hands + management
      response_time: immediate
      
  runbooks:
    database_failover:
      - promote_read_replica
      - update_connection_strings
      - restart_application_services
      - verify_data_consistency
      
    application_rollback:
      - identify_last_known_good_version
      - execute_rollback_deployment
      - verify_service_health
      - communicate_status
```

---

**Document Version**: 1.0  
**Last Updated**: 2025-09-02  
**Next Review**: 2025-12-02  
**Owner**: DevOps & Platform Team  
**Classification**: Internal Use Only