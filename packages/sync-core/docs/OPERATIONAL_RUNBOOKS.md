# Multi-Tenant Chokidar Sync Operational Runbooks

## Overview

This document provides operational runbooks for managing the Multi-Tenant Chokidar Synchronization System using existing The New Fuse monitoring and alerting infrastructure.

## Runbook Index

1. [Sync Service Down](#sync-service-down)
2. [High Sync Latency](#high-sync-latency)
3. [Sync Conflicts Accumulating](#sync-conflicts-accumulating)
4. [File Synchronization Failures](#file-synchronization-failures)
5. [Master Clock Drift](#master-clock-drift)
6. [Redis Connectivity Issues](#redis-connectivity-issues)
7. [Database Performance Issues](#database-performance-issues)
8. [Memory/CPU Resource Exhaustion](#memorycpu-resource-exhaustion)
9. [Network Connectivity Problems](#network-connectivity-problems)
10. [Tenant Isolation Violations](#tenant-isolation-violations)

---

## Sync Service Down

### Alert Trigger
```yaml
alert: SyncServiceDown
expr: up{job="sync-service"} == 0
for: 1m
severity: critical
```

### Immediate Actions (0-5 minutes)

#### Step 1: Verify Alert Accuracy
```bash
# Check if sync service pods are actually down
kubectl get pods -n tnf-production -l app=sync-service

# Check service endpoints
kubectl get endpoints sync-service -n tnf-production

# Verify Prometheus is scraping correctly
curl http://prometheus:9090/api/v1/targets | jq '.data.activeTargets[] | select(.job=="sync-service")'
```

#### Step 2: Check Service Health
```bash
# If pods are running, check health endpoint directly
kubectl exec -it $(kubectl get pods -n tnf-production -l app=sync-service -o jsonpath='{.items[0].metadata.name}') -- curl localhost:8080/health

# Check service logs for errors
kubectl logs -f deployment/sync-service -n tnf-production --tail=100
```

#### Step 3: Immediate Recovery
```bash
# Restart sync service deployment
kubectl rollout restart deployment/sync-service -n tnf-production

# Monitor rollout status
kubectl rollout status deployment/sync-service -n tnf-production --timeout=300s
```

### Investigation Actions (5-15 minutes)

#### Step 4: Root Cause Analysis
```bash
# Check recent events
kubectl get events -n tnf-production --sort-by='.lastTimestamp' | grep sync-service

# Check resource usage
kubectl top pods -n tnf-production -l app=sync-service

# Check node health
kubectl get nodes
kubectl describe node $(kubectl get pods -n tnf-production -l app=sync-service -o jsonpath='{.items[0].spec.nodeName}')
```

#### Step 5: Dependency Check
```bash
# Verify Redis connectivity using existing Redis monitoring
redis-cli -h $REDIS_HOST ping

# Check database connectivity using existing database monitoring
npx prisma db pull --preview-feature

# Verify WebSocket service health using existing monitoring
curl http://websocket-service:8080/health
```

### Resolution Actions (15+ minutes)

#### Step 6: Service Recovery
```bash
# If restart didn't work, check configuration
kubectl get configmap sync-config -n tnf-production -o yaml

# Check secrets
kubectl get secret sync-secrets -n tnf-production -o yaml

# Scale up if needed
kubectl scale deployment sync-service --replicas=3 -n tnf-production
```

#### Step 7: Validate Recovery
```bash
# Verify service is healthy
curl http://sync-service:8080/health

# Check metrics are being collected
curl http://sync-service:8081/metrics | grep sync_

# Test sync functionality
curl -X POST http://sync-service:8080/test/health-check
```

### Escalation Criteria
- Service doesn't recover after restart (15 minutes)
- Multiple dependency failures detected
- Resource exhaustion on multiple nodes
- Database connectivity issues persist

### Post-Incident Actions
- Review logs for root cause
- Update monitoring thresholds if needed
- Document lessons learned
- Update runbook based on findings

---

## High Sync Latency

### Alert Trigger
```yaml
alert: HighSyncLatency
expr: histogram_quantile(0.95, sync_operation_duration_seconds) > 5
for: 5m
severity: warning
```

### Immediate Actions (0-5 minutes)

#### Step 1: Assess Impact
```bash
# Check current sync latency metrics using existing Prometheus
curl "http://prometheus:9090/api/v1/query?query=histogram_quantile(0.95,sync_operation_duration_seconds)"

# Check sync operation rate
curl "http://prometheus:9090/api/v1/query?query=rate(sync_operations_total[5m])"

# Identify affected operations
kubectl logs deployment/sync-service -n tnf-production | grep "slow operation" | tail -20
```

#### Step 2: Check System Resources
```bash
# Check sync service resource usage using existing monitoring
kubectl top pods -n tnf-production -l app=sync-service

# Check Redis performance using existing Redis monitoring
redis-cli --latency-history -h $REDIS_HOST

# Check database performance using existing database monitoring
psql $DATABASE_URL -c "SELECT query, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"
```

### Investigation Actions (5-15 minutes)

#### Step 3: Identify Bottlenecks
```bash
# Check for Redis bottlenecks using existing Redis tools
redis-cli info stats | grep -E "(instantaneous_ops_per_sec|used_memory_human)"

# Check database connection pool using existing database monitoring
psql $DATABASE_URL -c "SELECT count(*) as active_connections FROM pg_stat_activity WHERE state = 'active';"

# Check file system performance
kubectl exec -it $(kubectl get pods -n tnf-production -l app=sync-service -o jsonpath='{.items[0].metadata.name}') -- iostat -x 1 3
```

### Resolution Actions (15+ minutes)

#### Step 4: Performance Tuning
```bash
# Increase batch size if operations are small
kubectl patch configmap sync-config -n tnf-production --patch '{"data":{"sync.batchSize":"200"}}'

# Increase debounce time if file changes are frequent
kubectl patch configmap sync-config -n tnf-production --patch '{"data":{"sync.fileWatch.debounceMs":"2000"}}'

# Scale up sync service if needed
kubectl scale deployment sync-service --replicas=4 -n tnf-production
```

### Escalation Criteria
- Latency continues to increase despite tuning
- Resource exhaustion detected
- Database performance degradation affects other services
- Multiple sync operations timing out

---

## General Escalation Procedures

### Level 1: Automated Recovery (0-5 minutes)
- Health checks trigger automatic restarts
- Auto-scaling responds to resource pressure
- Circuit breakers prevent cascade failures
- Retry mechanisms handle transient issues

### Level 2: On-Call Response (5-15 minutes)
- On-call engineer receives alert via existing PagerDuty/OpsGenie
- Follow appropriate runbook based on alert type
- Engage additional team members if needed
- Document actions taken in incident management system

### Level 3: Expert Escalation (15+ minutes)
- Engage sync system development team
- Contact infrastructure team for cluster issues
- Involve security team for security incidents
- Escalate to management for business impact

## Contact Information

### Primary Contacts
- **Sync Team Lead**: sync-lead@tnf.com
- **Infrastructure Team**: infrastructure@tnf.com
- **Security Team**: security@tnf.com
- **Database Team**: database@tnf.com

### Emergency Contacts
- **On-Call Engineer**: Use existing PagerDuty escalation
- **Engineering Manager**: Use existing escalation procedures
- **CTO**: For critical business impact incidents
- **Security Officer**: For security incidents