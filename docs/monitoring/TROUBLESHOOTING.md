# Troubleshooting Guide

## Common Issues

### High API Latency
1. Check database query performance:
```sql
SELECT * FROM pg_stat_activity WHERE state = 'active';
```
2. Monitor Redis connection pool:
```bash
redis-cli INFO | grep connected_clients
```
3. Review API logs:
```bash
kubectl logs -l app=fuse-api -n production --tail=100
```

### Memory Leaks
1. Check container metrics:
```bash
kubectl top pods -n production
```
2. Review heap dumps:
```bash
node --heapsnapshot
```

### Database Connection Issues
1. Check connection pool status:
```sql
SELECT * FROM pg_stat_activity;
```
2. Verify network connectivity:
```bash
nc -zv database.host 5432
```

## Recovery Procedures

### Service Recovery
1. Scale down/up service:
```bash
kubectl scale deployment fuse-api --replicas=0 -n production
kubectl scale deployment fuse-api --replicas=3 -n production
```

### Database Recovery
1. Failover to replica:
```bash
kubectl exec -it postgres-operator-pod -n production -- patronictl failover
```