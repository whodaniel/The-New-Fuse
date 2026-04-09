#!/bin/bash

echo "📊 Grafana Dashboard Status"
echo "========================="

# Get Grafana API key from Kubernetes secret
GRAFANA_API_KEY="$(kubectl get secret grafana-api-key -n monitoring -o jsonpath='{.data.api-key}' | base64 -d)"

# Check Grafana health
echo "System Health:"
curl -s -H "Authorization: Bearer $GRAFANA_API_KEY" http://grafana:3000/api/health

# Check datasource health
echo "Datasource Status:"
curl -s -H "Authorization: Bearer $GRAFANA_API_KEY" http://grafana:3000/api/datasources/health

# List active users
echo "Active Users:"
curl -s -H "Authorization: Bearer $GRAFANA_API_KEY" http://grafana:3000/api/admin/stats | jq '.activeUsers'

# Check dashboard status
echo "Dashboard Status:"
curl -s -H "Authorization: Bearer $GRAFANA_API_KEY" http://grafana:3000/api/search | jq '.[] | {title: .title, url: .url}'

# Alert rules status
echo "Alert Rules Status:"
curl -s -H "Authorization: Bearer $GRAFANA_API_KEY" http://grafana:3000/api/alert-rules | jq '.[] | {name: .name, state: .state}'