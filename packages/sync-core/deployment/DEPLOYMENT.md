# Sync-Core Deployment Guide

Complete guide for deploying Sync-Core in various environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Local Development](#local-development)
- [Docker Deployment](#docker-deployment)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Production Best Practices](#production-best-practices)
- [Monitoring & Observability](#monitoring--observability)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required
- Node.js 18+
- PostgreSQL 14+
- Redis 6+

### Optional (for cloud deployment)
- Docker 20+
- Kubernetes 1.24+
- kubectl CLI
- Helm 3+ (optional)

## Local Development

### Using Docker Compose (Recommended)

1. **Create environment file**:
```bash
cd packages/sync-core
cp .env.example .env
```

2. **Configure environment variables**:
```bash
# Edit .env
DATABASE_URL=postgresql://tnf:tnf_password@postgres:5432/tnf
REDIS_URL=redis://redis:6379
POSTGRES_USER=tnf
POSTGRES_PASSWORD=tnf_password
POSTGRES_DB=tnf
```

3. **Start all services**:
```bash
docker-compose up -d
```

4. **View logs**:
```bash
docker-compose logs -f sync-core
```

5. **Stop services**:
```bash
docker-compose down
```

### Using pnpm (Native)

1. **Install dependencies**:
```bash
pnpm install
```

2. **Start PostgreSQL and Redis** (manually or via Docker):
```bash
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password postgres:15
docker run -d -p 6379:6379 redis:7-alpine
```

3. **Run migrations**:
```bash
pnpm prisma migrate deploy
```

4. **Start development server**:
```bash
pnpm --filter @the-new-fuse/sync-core dev
```

## Docker Deployment

### Build Image

```bash
# From repository root
docker build -t tnf-sync-core:latest -f packages/sync-core/Dockerfile .
```

### Run Container

```bash
docker run -d \
  --name tnf-sync-core \
  -p 3001:3001 \
  -p 9090:9090 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/db \
  -e REDIS_URL=redis://redis:6379 \
  -e NODE_ENV=production \
  tnf-sync-core:latest
```

### Push to Registry

```bash
# Tag image
docker tag tnf-sync-core:latest ghcr.io/whodaniel/tnf-sync-core:v1.0.0

# Login to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u whodaniel --password-stdin

# Push image
docker push ghcr.io/whodaniel/tnf-sync-core:v1.0.0
```

## Kubernetes Deployment

### Step 1: Create Namespace

```bash
kubectl create namespace the-new-fuse
```

### Step 2: Create Secrets

```bash
# Database credentials
kubectl create secret generic sync-core-secrets \
  --from-literal=database-url='postgresql://user:password@postgres-service:5432/tnf' \
  --namespace=the-new-fuse
```

### Step 3: Apply Configuration

```bash
cd packages/sync-core/deployment/k8s

# Apply in order
kubectl apply -f serviceaccount.yaml
kubectl apply -f configmap.yaml
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
kubectl apply -f hpa.yaml
kubectl apply -f ingress.yaml
```

### Step 4: Verify Deployment

```bash
# Check pod status
kubectl get pods -n the-new-fuse -l app=sync-core

# Check service
kubectl get svc -n the-new-fuse sync-core-service

# View logs
kubectl logs -n the-new-fuse -l app=sync-core --tail=100 -f
```

### Step 5: Access Service

**Port Forward (Development)**:
```bash
kubectl port-forward -n the-new-fuse svc/sync-core-service 3001:3001
```

**Ingress (Production)**:
Service will be available at: `https://sync.thenewfuse.com`

## Production Best Practices

### 1. Resource Limits

Ensure proper resource allocation in `deployment.yaml`:

```yaml
resources:
  requests:
    cpu: 500m
    memory: 512Mi
  limits:
    cpu: 2000m
    memory: 2Gi
```

### 2. Horizontal Pod Autoscaling

The HPA configuration scales based on CPU and memory:
- **Min replicas**: 3
- **Max replicas**: 10
- **CPU threshold**: 70%
- **Memory threshold**: 80%

### 3. High Availability

**Redis Cluster**:
```yaml
# Use Redis Sentinel or Cluster mode
REDIS_URL=redis-sentinel://sentinel:26379/mymaster
REDIS_CLUSTER_ENABLED=true
```

**PostgreSQL High Availability**:
- Use managed services (AWS RDS, GCP Cloud SQL, Azure Database)
- Configure connection pooling
- Enable read replicas for scaling

### 4. Security

**TLS/SSL**:
```yaml
# In ingress.yaml
tls:
  - hosts:
      - sync.thenewfuse.com
    secretName: sync-core-tls
```

**Network Policies**:
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: sync-core-network-policy
spec:
  podSelector:
    matchLabels:
      app: sync-core
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: frontend
      ports:
        - protocol: TCP
          port: 3001
```

### 5. Backup & Recovery

**Database Backups**:
```bash
# Automated daily backups
kubectl create cronjob sync-core-backup \
  --image=postgres:15 \
  --schedule="0 2 * * *" \
  -- /bin/sh -c "pg_dump $DATABASE_URL > /backup/sync-core-$(date +%Y%m%d).sql"
```

**Redis Persistence**:
```yaml
# In redis deployment
command: redis-server --appendonly yes --save 900 1 --save 300 10
```

## Monitoring & Observability

### Prometheus Integration

**ServiceMonitor**:
```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: sync-core-metrics
  namespace: the-new-fuse
spec:
  selector:
    matchLabels:
      app: sync-core
  endpoints:
    - port: metrics
      interval: 30s
      path: /metrics
```

### Key Metrics to Monitor

1. **Sync Operations**:
   - `sync_operations_total` - Total sync operations
   - `sync_operations_duration_seconds` - Sync latency
   - `sync_conflicts_total` - Conflict occurrences

2. **Resources**:
   - `nodejs_heap_size_used_bytes` - Memory usage
   - `process_cpu_user_seconds_total` - CPU usage
   - `redis_connected_clients` - Redis connections

3. **WebSocket**:
   - `websocket_connections_total` - Active connections
   - `websocket_messages_sent_total` - Messages delivered

### Grafana Dashboards

Import dashboard ID: `14058` (Node.js Application Dashboard)

Custom queries:
```promql
# Sync operation rate
rate(sync_operations_total[5m])

# Average sync latency
histogram_quantile(0.95, rate(sync_operations_duration_seconds_bucket[5m]))

# Conflict rate
rate(sync_conflicts_total[5m]) / rate(sync_operations_total[5m])
```

### Log Aggregation

**Fluentd/Fluent Bit**:
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluent-bit-config
data:
  fluent-bit.conf: |
    [INPUT]
        Name tail
        Path /var/log/containers/sync-core*.log
        Parser docker
        Tag sync-core.*

    [OUTPUT]
        Name es
        Match sync-core.*
        Host elasticsearch
        Port 9200
```

## Troubleshooting

### Common Issues

#### 1. Pods Not Starting

**Check logs**:
```bash
kubectl describe pod -n the-new-fuse <pod-name>
kubectl logs -n the-new-fuse <pod-name>
```

**Common causes**:
- Database connection issues
- Redis connection issues
- Missing secrets

#### 2. High Memory Usage

**Check metrics**:
```bash
kubectl top pod -n the-new-fuse -l app=sync-core
```

**Solutions**:
- Reduce `CACHE_SIZE_MB`
- Increase memory limits
- Enable Redis clustering

#### 3. WebSocket Connection Failures

**Check ingress configuration**:
```bash
kubectl get ingress -n the-new-fuse sync-core-ingress -o yaml
```

**Verify annotations**:
```yaml
nginx.ingress.kubernetes.io/websocket-services: sync-core-service
nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"
```

#### 4. High Sync Latency

**Check Redis performance**:
```bash
kubectl exec -n the-new-fuse redis-0 -- redis-cli INFO stats
```

**Solutions**:
- Enable Redis clustering
- Increase batch sizes
- Add read replicas

#### 5. Database Connection Pool Exhaustion

**Check active connections**:
```sql
SELECT count(*) FROM pg_stat_activity WHERE datname = 'tnf';
```

**Solutions**:
- Increase `MAX_CONNECTIONS`
- Implement connection pooling with PgBouncer
- Scale horizontally with more pods

### Health Check Endpoints

**Liveness Probe**: `GET /health`
- Returns 200 if service is running
- Returns 503 if critical failure

**Readiness Probe**: `GET /ready`
- Returns 200 if ready to accept traffic
- Returns 503 if initializing or unhealthy dependencies

**Example response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-06T12:00:00Z",
  "uptime": 3600,
  "checks": {
    "redis": "connected",
    "database": "connected",
    "websocket": "listening"
  }
}
```

## Performance Tuning

### Redis Optimization

```bash
# Increase max memory
kubectl set env deployment/redis -n the-new-fuse REDIS_MAXMEMORY=1gb

# Enable persistence
kubectl set env deployment/redis -n the-new-fuse REDIS_APPENDONLY=yes
```

### Database Optimization

```sql
-- Add indexes for sync queries
CREATE INDEX idx_sync_states_tenant ON sync_states(tenant_id, last_sync);
CREATE INDEX idx_sync_conflicts_unresolved ON sync_conflicts(resolved_at) WHERE resolved_at IS NULL;

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM sync_states WHERE tenant_id = 'tenant-123';
```

### Application Tuning

```yaml
# In configmap.yaml
data:
  sync-batch-size: "100"        # Increase for high throughput
  redis-pool-size: "20"         # More connections for concurrency
  debounce-file-changes-ms: "1000"  # Reduce for faster response
```

## Rollback Procedure

If deployment fails:

```bash
# View deployment history
kubectl rollout history deployment/sync-core -n the-new-fuse

# Rollback to previous version
kubectl rollout undo deployment/sync-core -n the-new-fuse

# Rollback to specific revision
kubectl rollout undo deployment/sync-core -n the-new-fuse --to-revision=2
```

## Scaling Guide

### Vertical Scaling (Increase Resources)

```bash
kubectl set resources deployment/sync-core -n the-new-fuse \
  --requests=cpu=1000m,memory=1Gi \
  --limits=cpu=4000m,memory=4Gi
```

### Horizontal Scaling (Add Pods)

```bash
# Manual scaling
kubectl scale deployment/sync-core -n the-new-fuse --replicas=5

# Automatic scaling (via HPA)
# Already configured in hpa.yaml
```

### Multi-Region Deployment

For global distribution:

```yaml
# Deploy in multiple regions
regions:
  - us-east-1
  - eu-west-1
  - ap-southeast-1

# Configure cross-region Redis
REDIS_SENTINEL_ENABLED=true
REDIS_SENTINEL_HOSTS=sentinel-us,sentinel-eu,sentinel-ap
```

## Cost Optimization

1. **Use spot instances** for non-critical replicas
2. **Enable HPA** to scale down during low usage
3. **Use managed services** for Redis/PostgreSQL
4. **Implement caching** to reduce database load
5. **Monitor resource utilization** and right-size

## Support

For issues or questions:
- GitHub Issues: https://github.com/whodaniel/fuse/issues
- Documentation: https://docs.thenewfuse.com
- Slack: #sync-core channel
