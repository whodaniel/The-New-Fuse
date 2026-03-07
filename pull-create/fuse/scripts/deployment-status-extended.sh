#!/bin/bash

# Extended Deployment Status Report
# This script provides a comprehensive status report for a given environment.

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${PURPLE}[REPORT]${NC} $1"
}

print_step() {
    echo -e "${CYAN}[STEP]${NC} $1"
}

# Configuration
ENVIRONMENT=${1:-production}

print_header "=== The New Fuse Extended Deployment Status Report ==="
print_status "Environment: $ENVIRONMENT"
print_header "===================================================="

# Check if kubectl is available
command -v kubectl >/dev/null 2>&1 || { print_error "kubectl not found. Please install it."; exit 1; }

# Basic deployment status
echo "🚀 Deployment Status:"
kubectl get deployments -n ${ENVIRONMENT}
echo "---"

# Pod health
echo "🔄 Pod Status:"
kubectl get pods -n ${ENVIRONMENT}
echo "---"

# Define monitoring service URLs based on environment
PROMETHEUS_URL="http://prometheus.${ENVIRONMENT}.svc.cluster.local:9090"
ALERTMANAGER_URL="http://alertmanager.${ENVIRONMENT}.svc.cluster.local:9093"
GRAFANA_URL="http://grafana.${ENVIRONMENT}.svc.cluster.local:3000"

# Prometheus Alerts
echo "⚠️ Active Alerts:"
curl -s ${PROMETHEUS_URL}/api/v1/alerts | jq '.data.alerts[] | select(.state=="firing") | {name: .labels.alertname, severity: .labels.severity, description: .annotations.description}'

# Alert Manager Status
echo "🚨 AlertManager Groups:"
curl -s ${ALERTMANAGER_URL}/api/v2/alerts | jq '.[].labels'

# Grafana Dashboard Status
echo "📈 Grafana Dashboard Health:"
# Assuming Grafana API key is stored as a Kubernetes secret in the monitoring namespace
GRAFANA_API_KEY="$(kubectl get secret grafana-api-key -n monitoring -o jsonpath='{.data.api-key}' | base64 -d)"
curl -H "Authorization: Bearer $GRAFANA_API_KEY" ${GRAFANA_URL}/api/health

# Key Metrics
echo "🎯 Key Performance Metrics:"
echo "System:"
kubectl top pods -n ${ENVIRONMENT}

echo "Application:"
curl -s -X POST ${PROMETHEUS_URL}/api/v1/query --data-urlencode 'query=rate(http_requests_total[5m])' | jq '.data.result[0].value[1] as $total | "Request Rate: \($total) req/s"'
curl -s -X POST ${PROMETHEUS_URL}/api/v1/query --data-urlencode 'query=rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])' | jq '.data.result[0].value[1] as $rate | "Error Rate: \($rate * 100)%"'
curl -s -X POST ${PROMETHEUS_URL}/api/v1/query --data-urlencode 'query=histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))' | jq '.data.result[0].value[1] as $latency | "P95 Latency: \($latency)s"'

echo "Infrastructure:"
echo "- Cache Hit Rate: $(kubectl exec -n ${ENVIRONMENT} $(kubectl get pods -n ${ENVIRONMENT} -l app=redis -o jsonpath='{.items[0].metadata.name}') -- redis-cli info | grep hit_rate)"
echo "- Database Connections: $(kubectl exec -n ${ENVIRONMENT} $(kubectl get pods -n ${ENVIRONMENT} -l app=postgres -o jsonpath='{.items[0].metadata.name}') -- psql -U postgres -c 'SELECT count(*) FROM pg_stat_activity;')"
echo "- Memory Usage: $(kubectl exec -n ${ENVIRONMENT} $(kubectl get pods -n ${ENVIRONMENT} -l app=fuse-api -o jsonpath='{.items[0].metadata.name}') -- cat /sys/fs/cgroup/memory/memory.usage_in_bytes | numfmt --to=iec)"

# Critical Service Health
echo "🏥 Service Health Status:"
services=("api" "frontend" "gdesigner" "cache" "database")
for service in "${services[@]}"; do
    status=$(kubectl get pods -n ${ENVIRONMENT} -l app=$service -o jsonpath='{.items[0].status.phase}')
    ready=$(kubectl get pods -n ${ENVIRONMENT} -l app=$service -o jsonpath='{.items[0].status.containerStatuses[0].ready}')
    echo "- $service: Status=$status, Ready=$ready"
done

# Resource Quotas
echo "📊 Resource Quotas:"
kubectl get resourcequota -n ${ENVIRONMENT}

# Recent Events
echo "📜 Recent Events:"
kubectl get events -n ${ENVIRONMENT} --sort-by='.lastTimestamp' | tail -n 10

# Monitoring Stack Health
echo "🔍 Monitoring Stack Health:"
echo "- Prometheus Targets:"
curl -s ${PROMETHEUS_URL}/api/v1/targets | jq '.data.activeTargets[] | {job: .labels.job, health: .health}'

echo "- AlertManager Status:"
curl -s ${ALERTMANAGER_URL}/api/v2/status | jq '.clusterStatus'

echo "- Grafana Datasources:"
curl -H "Authorization: Bearer $GRAFANA_API_KEY" ${GRAFANA_URL}/api/datasources/health

# Final Status Summary
echo "📋 Status Summary:"
TOTAL_PODS=$(kubectl get pods -n ${ENVIRONMENT} --no-headers | wc -l)
RUNNING_PODS=$(kubectl get pods -n ${ENVIRONMENT} --field-selector status.phase=Running --no-headers | wc -l)
ERROR_RATE=$(curl -s -X POST ${PROMETHEUS_URL}/api/v1/query --data-urlencode 'query=rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])' | jq '.data.result[0].value[1]')
ALERTS_FIRING=$(curl -s ${PROMETHEUS_URL}/api/v1/alerts | jq '.data.alerts[] | select(.state=="firing")' | wc -l)

echo "- Total Pods: $TOTAL_PODS"
echo "- Running Pods: $RUNNING_PODS"
echo "- Error Rate: ${ERROR_RATE}%"
echo "- Active Alerts: $ALERTS_FIRING"

if [ $RUNNING_PODS -eq $TOTAL_PODS ] && [ $(echo "$ERROR_RATE < 0.05" | bc -l) -eq 1 ] && [ $ALERTS_FIRING -eq 0 ]; then
    echo "✅ System is healthy and operating normally"
else
    echo "⚠️ System requires attention - check details above"
fi

# Usage instructions
cat << EOF

Usage: $0 <environment>

Arguments:
  environment  : The deployment environment (e.g., staging, production). Defaults to 'production'.

Examples:
  $0 staging
  $0 production
EOF
