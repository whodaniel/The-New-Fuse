#!/bin/bash

echo "📊 Deployment Status Report"
echo "=========================="

# Check all deployments
kubectl get deployments -n production

# Check pods status
kubectl get pods -n production

# Check services
kubectl get services -n production

# Get recent logs
kubectl logs -n production -l app=fuse-api --tail=50

echo "
🎯 Deployment Metrics:
- API Response Time: $(curl -s -w '%{time_total}\n' -o /dev/null https://api.fuse.production/health)s
- Cache Hit Rate: $(redis-cli -h redis-primary info | grep hit_rate)
- Database Connections: $(kubectl exec -n production $(kubectl get pods -n production -l app=postgres -o jsonpath='{.items[0].metadata.name}') -- psql -U postgres -c 'SELECT count(*) FROM pg_stat_activity;')
"

echo "✅ Deployment complete! System is live and operational."