# TNF Infrastructure Scalability Layer

This directory contains infrastructure configurations for million-user scale
deployments.

## Structure

```
infrastructure/
├── redis/                    # Redis caching layer for distributed caching
│   └── redis-deployment.yaml # Kubernetes deployment for Redis
│
├── hpa/                      # Horizontal Pod Autoscaler configurations
│   └── hpa-config.yaml       # Autoscaling policies for backend/frontend
│
├── load-balancer/            # Load balancer templates
│   └── nginx-load-balancer.conf  # Nginx configuration with health checks
│
└── terraform/                # Terraform infrastructure as code
```

## Quick Start

### 1. Redis Caching Layer

```bash
# Deploy Redis to Kubernetes
kubectl apply -f infrastructure/redis/redis-deployment.yaml

# Test connection
redis-cli -h $(kubectl get svc tnf-redis-service -o jsonpath='{.spec.clusterIP}') ping
```

### 2. Horizontal Pod Autoscaler

```bash
# Apply HPA configurations
kubectl apply -f infrastructure/hpa/hpa-config.yaml

# Check autoscaling status
kubectl get hpa
```

### 3. Load Balancer

```bash
# Copy nginx config to your ingress controller
cp infrastructure/load-balancer/nginx-load-balancer.conf /etc/nginx/conf.d/

# Reload nginx
nginx -s reload
```

## Redis Configuration

The Redis deployment includes:

- Persistent storage for cache durability
- LRU eviction policy for memory management
- Health checks via TCP readiness probe
- Connection limits for million-user scale

### Memory Management

For high-scale deployments, configure:

```yaml
maxmemory: 1gb
maxmemory-policy: allkeys-lru
```

### Sentinel for High Availability

Add Redis Sentinel configuration for HA:

```yaml
sentinel:
  master: tnf-redis
  nodes:
    - redis-node-1:26379
    - redis-node-2:26379
    - redis-node-3:26379
```

## HPA Best Practices

1. **Scale-to-Zero Prevention**: Set `minReplicas: 3` to prevent downtime
2. **Gradual Scaling**: Use stabilization windows to avoid rapid scaling
3. **Multi-Metric Scaling**: Both CPU and memory for balanced scaling

## Load Balancer Health Checks

The Nginx configuration includes:

- `/health` endpoint for liveness
- `/status` endpoint for readiness
- 30s connection timeout
- Sticky sessions for session affinity

## Scaling Guidelines

| Metric          | Threshold | Action              |
| --------------- | --------- | ------------------- |
| CPU Utilization | > 70%     | Scale up backend    |
| Memory Usage    | > 80%     | Scale up frontend   |
| Request Latency | > 500ms   | Check Redis cache   |
| Error Rate      | > 1%      | Check load balancer |

## Integration with TNF

The RedisCacheService at
`apps/tauri-desktop/src/services/cache/RedisCacheService.ts` provides:

- Automatic caching with TTL
- Rate limiting primitives
- Pipeline operations
- Pattern-based cleanup

## Verification

Run the infrastructure validation after deployment:

```bash
node scripts/infrastructure-scalability-validator.js
```

Expected output: `Overall Score: 90%` or higher
