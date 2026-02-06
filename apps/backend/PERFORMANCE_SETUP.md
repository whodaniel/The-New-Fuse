# Performance Optimization Setup Guide

Quick guide to enable all performance optimizations for the Fuse backend API.

## Quick Start (5 minutes)

### 1. Apply Database Indexes

```bash
# Navigate to database package
cd /home/user/fuse/packages/database

# Apply performance indexes
psql $DATABASE_URL -f drizzle/migrations/add_performance_indexes.sql

# Verify indexes were created
psql $DATABASE_URL -c "\d users"
```

### 2. Configure Environment Variables

```bash
# Copy performance configuration template
cp apps/backend/.env.performance apps/backend/.env.local

# Edit configuration (use your preferred editor)
nano apps/backend/.env.local

# Minimum required settings:
# - DATABASE_URL
# - REDIS_HOST
# - REDIS_PORT
```

### 3. Install Dependencies

```bash
cd apps/backend

# Install production dependencies
npm install

# Ensure prom-client is installed
npm install prom-client
```

### 4. Update AppModule

Add the performance modules to your main application module:

```typescript
// apps/backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PerformanceMetricsModule } from './monitoring/performance-metrics.module';
import { PerformanceInterceptor } from './interceptors/performance.interceptor';
import { ETagInterceptor } from './interceptors/etag.interceptor';
import { CacheInterceptor } from './interceptors/cache.interceptor';

@Module({
  imports: [
    // ... existing imports
    PerformanceMetricsModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: PerformanceInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ETagInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
  ],
})
export class AppModule {}
```

### 5. Verify Setup

```bash
# Start the backend
npm run start:dev

# Test endpoints
curl http://localhost:3001/metrics              # Should return Prometheus metrics
curl http://localhost:3001/metrics/json         # Should return JSON metrics
curl http://localhost:3001/users?page=1&limit=50  # Test pagination
```

## Detailed Setup

### Database Optimization

#### 1. Verify Indexes

```sql
-- Check if indexes exist
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('users', 'agents', 'messages', 'tasks')
ORDER BY tablename, indexname;
```

#### 2. Analyze Query Performance

```sql
-- Enable query timing
\timing on

-- Test query performance
EXPLAIN ANALYZE
SELECT * FROM users WHERE email = 'test@example.com';

-- Should use index: idx_users_email
```

#### 3. Monitor Connection Pool

```typescript
// In your service
const metrics = await drizzle.$metrics.json();
console.log('Connection pool:', metrics);
```

### Redis Optimization

#### 1. Test Redis Connection

```bash
redis-cli ping
# Should return: PONG

redis-cli info stats
# Check connected_clients and total_commands_processed
```

#### 2. Enable Redis Persistence

```bash
# Edit redis.conf
save 900 1
save 300 10
save 60 10000

# Restart Redis
sudo systemctl restart redis
```

#### 3. Monitor Redis Performance

```bash
redis-cli info stats
redis-cli slowlog get 10
```

### Load Testing Setup

#### 1. Install k6

```bash
# macOS
brew install k6

# Linux
curl https://github.com/grafana/k6/releases/download/v0.45.0/k6-v0.45.0-linux-amd64.tar.gz -L | tar xvz
sudo mv k6-v0.45.0-linux-amd64/k6 /usr/local/bin
```

#### 2. Run Initial Load Test

```bash
cd apps/backend/tests/load

# Set test credentials
export BASE_URL=http://localhost:3001
export TEST_EMAIL=admin@example.com
export TEST_PASSWORD=your-password

# Run load test
k6 run k6-load-test.js
```

#### 3. Analyze Results

```bash
# Results are printed to console
# Look for:
# - http_req_duration: p95 and p99 should be < 500ms and < 1000ms
# - http_req_failed: should be < 1%
# - checks: should be > 95%
```

### Monitoring Setup

#### 1. Start Prometheus

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'fuse-backend'
    static_configs:
      - targets: ['localhost:3001']
    metrics_path: '/metrics'
```

```bash
# Start Prometheus
docker run -p 9090:9090 -v $(pwd)/prometheus.yml:/etc/prometheus/prometheus.yml prom/prometheus
```

#### 2. Access Prometheus UI

```
http://localhost:9090
```

Query examples:

```promql
# Average request duration
rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])

# Request rate
rate(http_requests_total[5m])

# Error rate
rate(http_request_errors_total[5m]) / rate(http_requests_total[5m])
```

#### 3. Setup Grafana (Optional)

```bash
# Start Grafana
docker run -d -p 3000:3000 grafana/grafana

# Access Grafana
# http://localhost:3000 (admin/admin)

# Add Prometheus data source
# - URL: http://localhost:9090
# - Access: Server (default)
```

## Verification Checklist

### Database

- [ ] All indexes applied and verified
- [ ] Connection pooling configured
- [ ] Slow query logging enabled
- [ ] Query performance acceptable (< 100ms for indexed queries)

### Redis

- [ ] Redis connection successful
- [ ] Auto-pipelining enabled
- [ ] Connection pool working
- [ ] Cache hit ratio > 70%

### API

- [ ] Compression working (check response headers)
- [ ] ETag support working (304 responses)
- [ ] Pagination working on all list endpoints
- [ ] Metrics endpoint accessible

### Monitoring

- [ ] Prometheus scraping metrics
- [ ] Slow requests being logged
- [ ] Performance metrics being recorded
- [ ] Error tracking working

### Load Testing

- [ ] k6 installed and working
- [ ] Load tests passing (p95 < 500ms)
- [ ] Error rate < 1%
- [ ] System stable under load

## Performance Targets

After setup, you should see:

### Response Times

- **p50 (median)**: < 150ms
- **p95**: < 500ms
- **p99**: < 1000ms

### Throughput

- **Minimum**: 500 requests/second
- **Target**: 1000+ requests/second

### Error Rate

- **Maximum**: < 1%

### Cache Performance

- **Hit Ratio**: > 70%
- **Cache Response Time**: < 10ms

### Database

- **Query Time (indexed)**: < 50ms
- **Query Time (complex)**: < 200ms
- **Connection Pool Usage**: < 80%

## Troubleshooting

### Issue: Slow Response Times

```bash
# Check slow query logs
grep "Slow query" logs/*.log

# Check database indexes
psql $DATABASE_URL -c "\d users"

# Monitor database connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"
```

### Issue: High Error Rate

```bash
# Check application logs
tail -f logs/error.log

# Check Redis connection
redis-cli ping

# Monitor system resources
htop
```

### Issue: Low Cache Hit Ratio

```bash
# Check Redis stats
redis-cli info stats

# Check cache configuration
grep CACHE .env.local

# Monitor cache keys
redis-cli keys "cache:*"
```

### Issue: Database Connection Errors

```bash
# Check connection pool
psql $DATABASE_URL -c "SELECT max_connections FROM pg_settings;"

# Check active connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';"

# Adjust connection limit
# Edit .env.local: DATABASE_URL with ?connection_limit=20
```

## Next Steps

1. **Run baseline load test** to establish performance metrics
2. **Set up monitoring dashboards** in Grafana
3. **Configure alerting** for performance degradation
4. **Schedule regular load tests** (weekly/monthly)
5. **Review and optimize** based on metrics

## Support

For issues or questions:

- Check the main [PERFORMANCE_OPTIMIZATION.md](./PERFORMANCE_OPTIMIZATION.md)
- Review load test results in `/tests/load/`
- Check monitoring metrics at `/metrics`
- Review application logs

## Advanced Configuration

See [PERFORMANCE_OPTIMIZATION.md](./PERFORMANCE_OPTIMIZATION.md) for:

- Advanced caching strategies
- Database read replica setup
- Horizontal scaling configuration
- Custom metric collection
- APM integration
