# Load Testing Suite

This directory contains comprehensive load testing scripts for the Fuse backend API.

## Prerequisites

### k6 Installation

```bash
# macOS
brew install k6

# Linux
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Docker
docker pull grafana/k6
```

### Artillery Installation

```bash
npm install -g artillery
```

## Test Types

### 1. Load Test (k6-load-test.js)
Simulates realistic user traffic with gradual load increase.

**Run:**
```bash
k6 run k6-load-test.js

# With custom configuration
BASE_URL=http://localhost:3001 \
TEST_EMAIL=admin@example.com \
TEST_PASSWORD=yourpassword \
k6 run k6-load-test.js
```

**Stages:**
- Ramp up to 50 users (2 min)
- Sustained 50 users (5 min)
- Ramp up to 100 users (2 min)
- Sustained 100 users (5 min)
- Ramp up to 200 users (2 min)
- Sustained 200 users (5 min)
- Ramp down (2 min)

### 2. Stress Test (stress-test.js)
Pushes the system beyond normal capacity to find breaking points.

**Run:**
```bash
k6 run stress-test.js
```

**Stages:**
- 100 users (2 min)
- 200 users (5 min)
- 300 users (2 min)
- 400 users (5 min)
- 500 users (5 min)
- Recovery (10 min)

### 3. Spike Test (spike-test.js)
Tests system behavior during sudden traffic spikes.

**Run:**
```bash
k6 run spike-test.js
```

**Stages:**
- Normal: 50 users (1 min)
- Spike: 1000 users (30 sec)
- Sustained spike: 1000 users (3 min)
- Return to normal: 50 users (30 sec)
- Recovery: 50 users (2 min)

### 4. Artillery Test (artillery-config.yml)
Comprehensive scenario-based load testing.

**Run:**
```bash
artillery run artillery-config.yml

# With HTML report
artillery run --output report.json artillery-config.yml
artillery report report.json
```

## Performance Thresholds

### Response Time Targets
- **p95 (95th percentile)**: < 500ms
- **p99 (99th percentile)**: < 1000ms
- **Average**: < 300ms

### Error Rate Targets
- **Normal load**: < 1%
- **Stress test**: < 5%
- **Spike test**: < 5%

### Throughput Targets
- **Minimum**: 100 requests/second
- **Target**: 500 requests/second
- **Maximum capacity**: 1000+ requests/second

## Test Scenarios

### User Scenarios (Weighted)
1. **Get Users List** (40%) - Read-heavy operation
2. **Get Agents List** (30%) - Read with filtering
3. **Get Chat History** (15%) - Paginated read
4. **Create Agent** (10%) - Write operation
5. **Update Agent** (5%) - Update operation

## Interpreting Results

### Key Metrics

1. **http_req_duration**: Request duration
   - Target: p95 < 500ms, p99 < 1000ms

2. **http_req_failed**: Failed requests rate
   - Target: < 1%

3. **http_reqs**: Total number of requests
   - Measure throughput

4. **data_received/sent**: Network traffic
   - Monitor bandwidth usage

### Success Criteria

✅ **Pass**: All thresholds met
- p95 < 500ms
- p99 < 1000ms
- Error rate < 1%
- No timeouts

⚠️ **Warning**: Some thresholds exceeded
- p95 < 1000ms
- Error rate < 5%
- Occasional timeouts

❌ **Fail**: Critical thresholds exceeded
- p95 > 1000ms
- Error rate > 5%
- Frequent errors/timeouts

## Example Results

```
checks.........................: 99.50% ✓ 29850 ✗ 150
data_received..................: 45 MB  150 kB/s
data_sent......................: 3.2 MB 11 kB/s
http_req_blocked...............: avg=1.2ms  min=1µs   med=3µs   max=500ms p(90)=5µs   p(95)=6µs
http_req_connecting............: avg=450µs  min=0s    med=0s    max=200ms p(90)=0s    p(95)=0s
http_req_duration..............: avg=120ms  min=50ms  med=100ms max=2s    p(90)=250ms p(95)=350ms
http_req_failed................: 0.50%  ✓ 150   ✗ 29850
http_req_receiving.............: avg=1.5ms  min=20µs  med=100µs max=100ms p(90)=5ms   p(95)=10ms
http_req_sending...............: avg=45µs   min=7µs   med=25µs  max=50ms  p(90)=100µs p(95)=150µs
http_req_waiting...............: avg=118ms  min=45ms  med=98ms  max=1.9s  p(90)=245ms p(95)=345ms
http_reqs......................: 30000  100/s
iteration_duration.............: avg=1.2s   min=1s    med=1.1s  max=3s    p(90)=1.3s  p(95)=1.5s
iterations.....................: 30000  100/s
vus............................: 100    min=0   max=200
vus_max........................: 200    min=200 max=200
```

## Optimization Recommendations

Based on test results:

1. **If p95 > 500ms:**
   - Check database query performance
   - Review indexes
   - Optimize N+1 queries
   - Consider caching

2. **If error rate > 1%:**
   - Check application logs
   - Review connection pool settings
   - Monitor resource usage (CPU, memory)
   - Check rate limiting

3. **If throughput < target:**
   - Scale horizontally (add instances)
   - Optimize connection pooling
   - Review worker thread count
   - Consider CDN for static assets

## Continuous Integration

Add to CI/CD pipeline:

```yaml
# .github/workflows/performance.yml
name: Performance Tests

on:
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * 0' # Weekly

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run k6 load test
        uses: grafana/k6-action@v0.2.0
        with:
          filename: apps/backend/tests/load/k6-load-test.js
          cloud: false
```

## Monitoring During Tests

1. **System Metrics:**
   - CPU usage
   - Memory usage
   - Network I/O
   - Disk I/O

2. **Application Metrics:**
   - Request rate
   - Error rate
   - Response times
   - Database connections

3. **Database Metrics:**
   - Active connections
   - Query duration
   - Lock wait time
   - Cache hit ratio

## Best Practices

1. **Before Testing:**
   - Use production-like environment
   - Warm up the system
   - Clear caches if testing cold start
   - Monitor system resources

2. **During Testing:**
   - Monitor system health
   - Watch for errors in logs
   - Track resource utilization
   - Note any anomalies

3. **After Testing:**
   - Analyze results
   - Compare with baselines
   - Document findings
   - Plan optimizations
