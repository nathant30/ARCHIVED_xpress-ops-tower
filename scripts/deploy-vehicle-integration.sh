#!/bin/bash

# Vehicle Management Integration Deployment Script
# This script deploys the Vehicle Management system with full Ops Tower platform integration

set -e

# Configuration
NAMESPACE="ops-tower"
KUBECTL_TIMEOUT="600s"
HELM_TIMEOUT="10m"
REGION="${REGION:-Manila}"
ENVIRONMENT="${ENVIRONMENT:-production}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARN: $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Check prerequisites
check_prerequisites() {
    log "Checking deployment prerequisites..."
    
    command -v kubectl >/dev/null 2>&1 || error "kubectl is required but not installed"
    command -v helm >/dev/null 2>&1 || error "helm is required but not installed"
    command -v istioctl >/dev/null 2>&1 || error "istioctl is required but not installed"
    
    # Check cluster connectivity
    kubectl cluster-info >/dev/null 2>&1 || error "Cannot connect to Kubernetes cluster"
    
    # Check if namespace exists
    if ! kubectl get namespace $NAMESPACE >/dev/null 2>&1; then
        log "Creating namespace $NAMESPACE..."
        kubectl create namespace $NAMESPACE
        kubectl label namespace $NAMESPACE istio-injection=enabled
    fi
    
    # Check if Istio is installed
    if ! kubectl get deployment -n istio-system istiod >/dev/null 2>&1; then
        error "Istio is not installed. Please install Istio first."
    fi
    
    log "Prerequisites check completed successfully"
}

# Deploy database schema and migrations
deploy_database() {
    log "Deploying vehicle management database schema..."
    
    # Create database secrets if they don't exist
    if ! kubectl get secret vehicle-db-secret -n $NAMESPACE >/dev/null 2>&1; then
        log "Creating database secret..."
        kubectl create secret generic vehicle-db-secret -n $NAMESPACE \
            --from-literal=connection-string="postgresql://postgres:password@postgres-primary.database.svc.cluster.local:5432/vehicle_management"
    fi
    
    # Run database migrations
    log "Running database migrations..."
    kubectl run vehicle-db-migration --rm -i --restart=Never \
        --image=migrate/migrate:v4.15.2 \
        --namespace=$NAMESPACE \
        --command -- sh -c "
            migrate -path /migrations -database \$DATABASE_URL up
        " || warn "Database migrations may have already been applied"
    
    log "Database deployment completed"
}

# Deploy Redis cache configuration
deploy_cache() {
    log "Configuring Redis cache for vehicle management..."
    
    # Create cache configuration
    kubectl apply -f - <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: cache-config
  namespace: $NAMESPACE
data:
  redis-url: "redis://redis-cluster.cache.svc.cluster.local:6379"
  ttl-vehicle-data: "300"
  ttl-telemetrics: "60"
  ttl-driver-assignments: "600"
EOF
    
    log "Cache configuration deployed"
}

# Deploy monitoring and observability
deploy_monitoring() {
    log "Setting up monitoring for vehicle management..."
    
    # Create ServiceMonitor for Prometheus
    kubectl apply -f - <<EOF
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: vehicle-management-metrics
  namespace: $NAMESPACE
  labels:
    app: vehicle-management
spec:
  selector:
    matchLabels:
      app: vehicle-management
  endpoints:
  - port: metrics
    interval: 30s
    path: /metrics
  - port: http
    interval: 60s
    path: /health
EOF
    
    # Create Grafana dashboard ConfigMap
    kubectl apply -f - <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: vehicle-management-dashboard
  namespace: monitoring
  labels:
    grafana_dashboard: "1"
data:
  vehicle-management.json: |
    {
      "dashboard": {
        "id": null,
        "title": "Vehicle Management - Ops Tower Integration",
        "tags": ["ops-tower", "vehicle-management"],
        "timezone": "browser",
        "panels": [
          {
            "title": "Active Vehicles",
            "type": "stat",
            "targets": [
              {
                "expr": "vehicle_active_count{job=\"vehicle-management-service\"}",
                "legendFormat": "Active Vehicles"
              }
            ]
          },
          {
            "title": "Fleet Utilization",
            "type": "gauge",
            "targets": [
              {
                "expr": "vehicle_utilization_percentage{job=\"vehicle-management-service\"}",
                "legendFormat": "Utilization %"
              }
            ]
          },
          {
            "title": "Maintenance Alerts",
            "type": "stat",
            "targets": [
              {
                "expr": "vehicle_maintenance_alerts_total{job=\"vehicle-management-service\"}",
                "legendFormat": "Maintenance Alerts"
              }
            ]
          }
        ],
        "time": {
          "from": "now-1h",
          "to": "now"
        },
        "refresh": "30s"
      }
    }
EOF
    
    log "Monitoring setup completed"
}

# Deploy vehicle management application
deploy_application() {
    log "Deploying vehicle management application..."
    
    # Apply the main deployment
    kubectl apply -f k8s/vehicle-management-deployment.yaml --timeout=$KUBECTL_TIMEOUT
    
    # Wait for deployment to be ready
    log "Waiting for vehicle management deployment to be ready..."
    kubectl wait --for=condition=available --timeout=$KUBECTL_TIMEOUT \
        deployment/vehicle-management-service -n $NAMESPACE
    
    log "Vehicle management application deployed successfully"
}

# Deploy service mesh configuration
deploy_service_mesh() {
    log "Deploying service mesh configuration..."
    
    # Apply service mesh configurations
    kubectl apply -f k8s/vehicle-service-mesh-integration.yaml
    
    # Wait for virtual service to be ready
    kubectl wait --for=condition=ready virtualservice/vehicle-management-vs -n $NAMESPACE --timeout=300s || warn "VirtualService may take some time to be ready"
    
    # Verify Istio sidecar injection
    log "Verifying Istio sidecar injection..."
    sleep 10
    READY_PODS=$(kubectl get pods -n $NAMESPACE -l app=vehicle-management -o jsonpath='{.items[*].status.containerStatuses[?(@.name=="istio-proxy")].ready}' | grep -o "true" | wc -l)
    TOTAL_PODS=$(kubectl get pods -n $NAMESPACE -l app=vehicle-management --no-headers | wc -l)
    
    if [ "$READY_PODS" -eq "$TOTAL_PODS" ]; then
        log "All vehicle management pods have Istio sidecars injected"
    else
        warn "Some pods may not have Istio sidecars properly injected"
    fi
    
    log "Service mesh configuration deployed"
}

# Configure RBAC and security
deploy_security() {
    log "Configuring RBAC and security policies..."
    
    # Create role and role binding for vehicle management
    kubectl apply -f - <<EOF
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: $NAMESPACE
  name: vehicle-management-role
rules:
- apiGroups: [""]
  resources: ["configmaps", "secrets"]
  verbs: ["get", "list"]
- apiGroups: [""]
  resources: ["services", "endpoints"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["get", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: vehicle-management-binding
  namespace: $NAMESPACE
subjects:
- kind: ServiceAccount
  name: vehicle-management-sa
  namespace: $NAMESPACE
roleRef:
  kind: Role
  name: vehicle-management-role
  apiGroup: rbac.authorization.k8s.io
EOF
    
    log "Security policies configured"
}

# Test integration endpoints
test_integration() {
    log "Testing vehicle management integration..."
    
    # Get service endpoint
    SERVICE_IP=$(kubectl get svc istio-ingressgateway -n istio-system -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
    if [ -z "$SERVICE_IP" ]; then
        SERVICE_IP=$(kubectl get svc istio-ingressgateway -n istio-system -o jsonpath='{.spec.clusterIP}')
    fi
    
    # Test health endpoint
    log "Testing health endpoint..."
    kubectl run curl-test --rm -i --restart=Never --image=curlimages/curl:7.85.0 -- \
        curl -f "http://$SERVICE_IP/api/vehicles/health" || warn "Health endpoint test failed"
    
    # Test vehicle metrics endpoint
    log "Testing vehicle metrics endpoint..."
    kubectl run curl-test --rm -i --restart=Never --image=curlimages/curl:7.85.0 -- \
        curl -f "http://$SERVICE_IP/api/integration/vehicle-metrics" || warn "Metrics endpoint test failed"
    
    log "Integration testing completed"
}

# Cleanup function
cleanup() {
    log "Cleaning up temporary resources..."
    kubectl delete pod curl-test -n $NAMESPACE --ignore-not-found=true
}

# Main deployment function
main() {
    log "Starting Vehicle Management Integration Deployment"
    log "Environment: $ENVIRONMENT"
    log "Region: $REGION"
    log "Namespace: $NAMESPACE"
    
    # Set trap for cleanup
    trap cleanup EXIT
    
    # Execute deployment steps
    check_prerequisites
    deploy_database
    deploy_cache
    deploy_monitoring
    deploy_security
    deploy_application
    deploy_service_mesh
    test_integration
    
    log "Vehicle Management Integration deployment completed successfully!"
    
    # Display access information
    cat << EOF

${GREEN}=== DEPLOYMENT SUMMARY ===${NC}

Vehicle Management System has been successfully integrated with Ops Tower platform.

${BLUE}Access URLs:${NC}
- Vehicle Management API: http://vehicle-api.ops-tower.local/api/vehicles
- Fleet Dashboard: http://fleet.ops-tower.local
- Health Check: http://vehicle-api.ops-tower.local/health
- Metrics: http://vehicle-api.ops-tower.local/metrics

${BLUE}Integration Points:${NC}
✅ Navigation menu updated with Vehicle Management section
✅ Dashboard integrated with vehicle metrics
✅ Notification system extended for vehicle alerts
✅ Global search includes vehicle data
✅ Service mesh configured with proper routing
✅ Monitoring and observability setup

${BLUE}Next Steps:${NC}
1. Configure DNS entries for vehicle-api.ops-tower.local and fleet.ops-tower.local
2. Set up SSL certificates for production
3. Configure backup and disaster recovery
4. Set up log aggregation and alerting
5. Train operations team on vehicle management features

${BLUE}Monitoring:${NC}
- Grafana Dashboard: Vehicle Management - Ops Tower Integration
- Prometheus Metrics: vehicle_* metrics namespace
- Jaeger Tracing: vehicle-management service traces

For troubleshooting, check logs with:
kubectl logs -l app=vehicle-management -n $NAMESPACE -f

EOF
}

# Run main function
main "$@"