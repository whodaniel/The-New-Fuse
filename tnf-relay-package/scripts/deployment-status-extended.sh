#!/bin/bash

echo "📊 Extended Deployment Status Report"
echo "=================================="

# Basic deployment status
echo "🚀 Deployment Status:"
kubectl get deployments -n production
echo "---"

# Pod health
echo "🔄 Pod Status:"
kubectl get pods -n production
echo "---"

# Prometheus Alerts
echo "⚠️ Active Alerts:"
curl -s http://prometheus:9090/api/v1/alerts | jq '.data.alerts[] | select(.state=="firing") | {name: .labels.alertname, severity: .labels.severity, description: .annotations.description}'

# Alert Manager Status
echo "🚨 AlertManager Groups:"
curl -s http://alertmanager:9093/api/v2/alerts | jq '.[].labels'

# Grafana Dashboard Status
echo "📈 Grafana Dashboard Health:"
GRAFANA_API_KEY="$(kubectl get secret grafana-api-key -n monitoring -o jsonpath='{.data.api-key}' | base64 -d)"
curl -H "Authorization: Bearer $GRAFANA_API_KEY" http://grafana:3000/api/health

# Key Metrics
echo "🎯 Key Performance Metrics:"
echo "System:"
kubectl top pods -n production

echo "Application:"
curl -s -X POST http://prometheus:9090/api/v1/query --data-urlencode 'query=rate(http_requests_total[5m])' | jq '.data.result[0].value[1] as $total | "Request Rate: \($total) req/s"'
curl -s -X POST http://prometheus:9090/api/v1/query --data-urlencode 'query=rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])' | jq '.data.result[0].value[1] as $rate | "Error Rate: \($rate * 100)%"'
curl -s -X POST http://prometheus:9090/api/v1/query --data-urlencode 'query=histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))' | jq '.data.result[0].value[1] as $latency | "P95 Latency: \($latency)s"'

echo "Infrastructure:"
echo "- Cache Hit Rate: $(redis-cli -h redis-primary info | grep hit_rate)"
echo "- Database Connections: $(kubectl exec -n production $(kubectl get pods -n production -l app=postgres -o jsonpath='{.items[0].metadata.name}') -- psql -U postgres -c 'SELECT count(*) FROM pg_stat_activity;')"
echo "- Memory Usage: $(kubectl exec -n production $(kubectl get pods -n production -l app=fuse-api -o jsonpath='{.items[0].metadata.name}') -- cat /sys/fs/cgroup/memory/memory.usage_in_bytes | numfmt --to=iec)"

# Critical Service Health
echo "🏥 Service Health Status:"
services=("api" "frontend" "gdesigner" "cache" "database")
for service in "${services[@]}"; do
    status=$(kubectl get pods -n production -l app=$service -o jsonpath='{.items[0].status.phase}')
    ready=$(kubectl get pods -n production -l app=$service -o jsonpath='{.items[0].status.containerStatuses[0].ready}')
    echo "- $service: Status=$status, Ready=$ready"
done

# Resource Quotas
echo "📊 Resource Quotas:"
kubectl get resourcequota -n production

# Recent Events
echo "📜 Recent Events:"
kubectl get events -n production --sort-by='.lastTimestamp' | tail -n 10

# Monitoring Stack Health
echo "🔍 Monitoring Stack Health:"
echo "- Prometheus Targets:"
curl -s http://prometheus:9090/api/v1/targets | jq '.data.activeTargets[] | {job: .labels.job, health: .health}'

echo "- AlertManager Status:"
curl -s http://alertmanager:9093/api/v2/status | jq '.clusterStatus'

echo "- Grafana Datasources:"
curl -H "Authorization: Bearer $GRAFANA_API_KEY" http://grafana:3000/api/datasources/health

# Final Status Summary
echo "📋 Status Summary:"
TOTAL_PODS=$(kubectl get pods -n production --no-headers | wc -l)
RUNNING_PODS=$(kubectl get pods -n production --field-selector status.phase=Running --no-headers | wc -l)
ERROR_RATE=$(curl -s -X POST http://prometheus:9090/api/v1/query --data-urlencode 'query=rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])' | jq '.data.result[0].value[1]')
ALERTS_FIRING=$(curl -s http://prometheus:9090/api/v1/alerts | jq '.data.alerts[] | select(.state=="firing")' | wc -l)

echo "- Total Pods: $TOTAL_PODS"
echo "- Running Pods: $RUNNING_PODS"
echo "- Error Rate: ${ERROR_RATE}%"
echo "- Active Alerts: $ALERTS_FIRING"

if [ $RUNNING_PODS -eq $TOTAL_PODS ] && [ $(echo "$ERROR_RATE < 0.05" | bc -l) -eq 1 ] && [ $ALERTS_FIRING -eq 0 ]; then
    echo "✅ System is healthy and operating normally"
else
    echo "⚠️ System requires attention - check details above"
fi