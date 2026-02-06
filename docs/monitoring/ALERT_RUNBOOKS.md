# Alert Runbooks

## Overview

This document provides detailed runbooks for each alert rule configured in the
monitoring system. Follow these procedures when alerts are triggered.

---

## High Error Rate

**Alert ID**: `high-error-rate` **Severity**: Critical **Threshold**: Error
rate > 5% **Duration**: 5 minutes

### Symptoms

- Alert: "High error rate detected"
- Error rate exceeds 5% of total requests
- Multiple error traces in Sentry

### Investigation

1. **Check Error Dashboard**

   ```bash
   # Open Grafana
   # Navigate to "API Performance Metrics" dashboard
   # Review "Error Rate" panel
   ```

2. **Review Error Logs**

   ```bash
   # Check recent errors
   kubectl logs -f deployment/api-gateway -n production | grep ERROR | tail -50

   # Or from log files
   grep "ERROR" /var/log/app/$(date +%Y-%m-%d)-error.log | tail -50
   ```

3. **Check Sentry**
   - Open Sentry dashboard
   - Review recent errors by frequency
   - Identify common error patterns
   - Check affected endpoints

4. **Review Recent Deployments**

   ```bash
   # Check deployment history
   kubectl rollout history deployment/api-gateway -n production

   # Check current version
   kubectl get deployment api-gateway -n production -o jsonpath='{.spec.template.spec.containers[0].image}'
   ```

5. **Check Dependencies**
   - Database connectivity
   - Redis connectivity
   - External API availability

### Common Causes

1. **Bad Deployment**
   - Syntax errors
   - Missing environment variables
   - Breaking API changes

2. **Database Issues**
   - Connection pool exhausted
   - Slow queries
   - Database down

3. **External API Failures**
   - Third-party API down
   - Rate limiting
   - Network issues

### Resolution

**If caused by recent deployment:**

```bash
# Rollback to previous version
kubectl rollout undo deployment/api-gateway -n production

# Monitor rollback
kubectl rollout status deployment/api-gateway -n production

# Verify error rate decreased
curl https://api.example.com/metrics | grep http_request_errors_total
```

**If caused by database issues:**

```bash
# Check database connections
psql -h $DB_HOST -U $DB_USER -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';"

# Kill long-running queries if needed
psql -h $DB_HOST -U $DB_USER -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'active' AND query_start < NOW() - INTERVAL '5 minutes';"

# Increase connection pool (if applicable)
kubectl set env deployment/api-gateway DB_POOL_SIZE=30 -n production
```

**If caused by external API:**

```bash
# Check external API status
curl -I https://external-api.example.com/health

# Enable circuit breaker (if implemented)
kubectl set env deployment/api-gateway CIRCUIT_BREAKER_ENABLED=true -n production
```

### Prevention

- Implement comprehensive tests before deployment
- Use canary deployments
- Add circuit breakers for external APIs
- Monitor database connection pool
- Set up staging environment that mirrors production

---

## Slow Response Time

**Alert ID**: `slow-response-time` **Severity**: Warning **Threshold**: P95
response time > 2s **Duration**: 5 minutes

### Symptoms

- Alert: "Slow response time detected"
- P95 latency exceeds 2 seconds
- User complaints about slow page loads

### Investigation

1. **Check Latency Dashboard**

   ```bash
   # Open Grafana
   # Navigate to "API Performance Metrics" dashboard
   # Review "API Response Time" panel
   ```

2. **Identify Slow Endpoints**

   ```bash
   # Query Prometheus for slowest endpoints
   curl 'http://prometheus:9090/api/v1/query?query=topk(5, histogram_quantile(0.95, rate(http_request_duration_ms_bucket[5m])))'
   ```

3. **Check Database Performance**

   ```bash
   # Check slow queries
   psql -h $DB_HOST -U $DB_USER -c "SELECT query, mean_exec_time, calls FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"
   ```

4. **Review Slow Query Logs**

   ```bash
   # Check application logs for slow queries
   kubectl logs -f deployment/api-gateway -n production | grep "Slow query detected"
   ```

5. **Check System Resources**

   ```bash
   # CPU usage
   kubectl top nodes
   kubectl top pods -n production

   # Memory usage
   kubectl top pods -n production --containers
   ```

### Common Causes

1. **Slow Database Queries**
   - Missing indexes
   - N+1 queries
   - Large table scans
   - Complex joins

2. **Cache Misses**
   - Cache cleared
   - Cache expired
   - New data not cached

3. **High Load**
   - Traffic spike
   - Resource exhaustion
   - Too many concurrent requests

4. **External API Latency**
   - Third-party API slow
   - Network latency
   - Timeout issues

### Resolution

**If caused by slow queries:**

```sql
-- Add missing indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_agents_user_id ON agents(user_id);

-- Analyze query plan
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'user@example.com';
```

**If caused by cache misses:**

```bash
# Check cache hit rate
redis-cli -h $REDIS_HOST info stats | grep hit_rate

# Increase cache TTL (if applicable)
kubectl set env deployment/api-gateway CACHE_TTL=3600 -n production

# Warm up cache
curl -X POST https://api.example.com/admin/cache/warm
```

**If caused by high load:**

```bash
# Scale up replicas
kubectl scale deployment/api-gateway --replicas=5 -n production

# Increase resources
kubectl set resources deployment/api-gateway -c api-gateway --limits=cpu=2000m,memory=2Gi -n production
```

### Prevention

- Add database indexes proactively
- Implement query result caching
- Use connection pooling
- Implement pagination
- Add CDN for static assets
- Use horizontal pod autoscaling

---

## High Memory Usage

**Alert ID**: `high-memory-usage` **Severity**: Critical **Threshold**: Memory
usage > 90% **Duration**: 5 minutes

### Symptoms

- Alert: "High memory usage detected"
- Memory usage exceeds 90%
- Potential OOM kills

### Investigation

1. **Check Memory Dashboard**

   ```bash
   # Check current memory usage
   kubectl top pods -n production
   ```

2. **Get Heap Dump** (Node.js)

   ```bash
   # Generate heap snapshot
   kubectl exec -it deployment/api-gateway -n production -- node --expose-gc --heapsnapshot-signal=SIGUSR2 dist/main.js &
   kill -SIGUSR2 $(pgrep node)

   # Download heap snapshot
   kubectl cp production/api-gateway-xxx:/app/heapdump.heapsnapshot ./heapdump.heapsnapshot
   ```

3. **Check Memory Metrics**

   ```bash
   # Query Prometheus
   curl 'http://prometheus:9090/api/v1/query?query=process_resident_memory_bytes'
   ```

4. **Review Recent Changes**
   ```bash
   # Check deployment history
   kubectl rollout history deployment/api-gateway -n production
   ```

### Common Causes

1. **Memory Leaks**
   - Event listener leaks
   - Closure leaks
   - Global variable accumulation

2. **Large Payloads**
   - Large response bodies
   - File uploads
   - Unbounded arrays

3. **Cache Growth**
   - In-memory cache too large
   - No cache eviction policy
   - TTL too long

4. **Too Many Connections**
   - Connection leaks
   - WebSocket connections
   - Database connections

### Resolution

**Immediate:**

```bash
# Restart pods (rolling restart)
kubectl rollout restart deployment/api-gateway -n production

# Or force delete specific pod
kubectl delete pod api-gateway-xxx -n production
```

**Short-term:**

```bash
# Increase memory limits
kubectl set resources deployment/api-gateway -c api-gateway --limits=memory=4Gi -n production

# Scale horizontally
kubectl scale deployment/api-gateway --replicas=5 -n production
```

**Long-term:**

- Fix memory leaks
- Implement streaming for large responses
- Add cache size limits
- Clean up event listeners
- Implement pagination

### Prevention

- Regular memory profiling
- Implement cache eviction policies
- Set memory limits on caches
- Use streaming for large payloads
- Monitor memory trends
- Automated memory leak detection

---

## Database Connection Pool Exhausted

**Alert ID**: `database-connection-pool-exhausted` **Severity**: Critical
**Threshold**: Pool utilization > 90% **Duration**: 1 minute

### Symptoms

- Alert: "Database connection pool near exhaustion"
- Connection pool utilization > 90%
- Database timeout errors

### Investigation

1. **Check Connection Pool Metrics**

   ```bash
   curl https://api.example.com/metrics | grep database_connection_pool
   ```

2. **Check Active Connections**

   ```bash
   # PostgreSQL
   psql -h $DB_HOST -U $DB_USER -c "SELECT count(*) as active FROM pg_stat_activity WHERE state = 'active';"
   psql -h $DB_HOST -U $DB_USER -c "SELECT count(*) as idle FROM pg_stat_activity WHERE state = 'idle';"
   ```

3. **Check Long-Running Queries**

   ```bash
   psql -h $DB_HOST -U $DB_USER -c "SELECT pid, now() - query_start as duration, query FROM pg_stat_activity WHERE state = 'active' ORDER BY duration DESC LIMIT 10;"
   ```

4. **Review Application Logs**
   ```bash
   kubectl logs -f deployment/api-gateway -n production | grep "database"
   ```

### Common Causes

1. **Connection Leaks**
   - Not releasing connections
   - Exception handling issues
   - Missing finally blocks

2. **Long-Running Transactions**
   - Slow queries
   - Large transactions
   - Lock contention

3. **Pool Too Small**
   - Insufficient pool size
   - High concurrent requests
   - Traffic spike

### Resolution

**Immediate:**

```bash
# Kill long-running queries
psql -h $DB_HOST -U $DB_USER -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'active' AND query_start < NOW() - INTERVAL '5 minutes';"

# Increase pool size
kubectl set env deployment/api-gateway DB_POOL_MAX=50 -n production
kubectl rollout restart deployment/api-gateway -n production
```

**Long-term:**

- Fix connection leaks
- Add query timeouts
- Optimize slow queries
- Implement read replicas
- Use connection pooling middleware

### Prevention

- Monitor connection pool metrics
- Set connection timeout
- Implement query timeouts
- Use transactions properly
- Regular connection leak audits
- Load testing with connection monitoring

---

## Service Down

**Alert ID**: `service-down` **Severity**: Critical **Threshold**: Service
health check fails **Duration**: 1 minute

### Symptoms

- Alert: "Service is down"
- Health checks failing
- 503 errors

### Investigation

1. **Check Service Status**

   ```bash
   # Kubernetes
   kubectl get pods -n production
   kubectl describe pod api-gateway-xxx -n production

   # Check events
   kubectl get events -n production --sort-by='.lastTimestamp'
   ```

2. **Check Logs**

   ```bash
   # Recent logs
   kubectl logs deployment/api-gateway -n production --tail=100

   # Previous pod logs (if crashed)
   kubectl logs api-gateway-xxx -n production --previous
   ```

3. **Check Health Endpoint**

   ```bash
   curl https://api.example.com/health
   ```

4. **Check Dependencies**

   ```bash
   # Database
   psql -h $DB_HOST -U $DB_USER -c "SELECT 1;"

   # Redis
   redis-cli -h $REDIS_HOST ping
   ```

### Common Causes

1. **Application Crash**
   - Unhandled exception
   - OOM kill
   - Segmentation fault

2. **Dependency Failure**
   - Database down
   - Redis down
   - External API down

3. **Resource Exhaustion**
   - Out of memory
   - CPU throttling
   - Disk space full

4. **Bad Deployment**
   - Syntax error
   - Missing dependency
   - Configuration error

### Resolution

```bash
# Check pod status
kubectl get pods -n production

# If CrashLoopBackOff, check logs
kubectl logs api-gateway-xxx -n production --previous

# Restart deployment
kubectl rollout restart deployment/api-gateway -n production

# If recent deployment, rollback
kubectl rollout undo deployment/api-gateway -n production

# Check rollout status
kubectl rollout status deployment/api-gateway -n production
```

### Prevention

- Comprehensive health checks
- Proper error handling
- Resource limits and requests
- Staging environment testing
- Gradual rollouts
- Automated rollback on failures

---

## General Tips

1. **Always check recent deployments first** - Most issues are caused by recent
   changes
2. **Use correlation IDs** - Track requests across services
3. **Check dependencies** - Database, Redis, external APIs
4. **Monitor trends** - Look for gradual degradation
5. **Document findings** - Update runbooks with new learnings
6. **Communicate** - Keep stakeholders informed
7. **Test fixes in staging** - If time permits
8. **Monitor after resolution** - Ensure issue doesn't recur

## Useful Queries

### Prometheus

```promql
# Error rate by endpoint
rate(http_request_errors_total[5m]) / rate(http_requests_total[5m]) * 100

# P95 latency by endpoint
histogram_quantile(0.95, rate(http_request_duration_ms_bucket[5m]))

# Memory usage percentage
(process_resident_memory_bytes / 1024 / 1024 / 1024) / 4 * 100

# Database connection pool utilization
database_connection_pool{state="active"} / database_connection_pool{state="total"} * 100

# Request rate
rate(http_requests_total[5m])
```

### Database (PostgreSQL)

```sql
-- Active connections
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';

-- Long-running queries
SELECT pid, now() - query_start as duration, query
FROM pg_stat_activity
WHERE state = 'active'
ORDER BY duration DESC;

-- Slow queries from pg_stat_statements
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Lock contention
SELECT * FROM pg_locks WHERE NOT granted;

-- Table sizes
SELECT schemaname, tablename,
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Redis

```bash
# Memory usage
redis-cli info memory

# Connected clients
redis-cli info clients

# Hit rate
redis-cli info stats | grep keyspace

# Slow log
redis-cli slowlog get 10
```
