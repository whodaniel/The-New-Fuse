# Railway Cron Jobs Configuration

# TNF Self-Improvement Loop

## Overview

This document describes the Railway cron job setup for the TNF self-improvement
loop. These jobs run automatically on Railway to keep the system
self-sustaining.

---

## Cron Job Definitions

### 1. Hourly Health Check

**Schedule**: `0 * * * *` (Every hour at minute 0)

**Endpoint**: `POST /api/self-improvement/health-check`

**Tasks**:

- Check all service health endpoints
- Verify agent connectivity
- Monitor Redis pub/sub health
- Update system status dashboard

```json
{
  "name": "hourly-health-check",
  "schedule": "0 * * * *",
  "endpoint": "/api/self-improvement/health-check",
  "timeout": 60000
}
```

### 2. Daily Optimization Analysis

**Schedule**: `0 3 * * *` (Every day at 3:00 AM UTC)

**Endpoint**: `POST /api/self-improvement/optimize`

**Tasks**:

- Analyze agent performance metrics
- Review message throughput
- Identify bottlenecks
- Generate optimization recommendations

```json
{
  "name": "daily-optimization",
  "schedule": "0 3 * * *",
  "endpoint": "/api/self-improvement/optimize",
  "timeout": 300000
}
```

### 3. Weekly System Review

**Schedule**: `0 4 * * 0` (Every Sunday at 4:00 AM UTC)

**Endpoint**: `POST /api/self-improvement/deep-review`

**Tasks**:

- Full system health audit
- Performance trend analysis
- Resource usage optimization
- Configuration drift detection
- Generate weekly report

```json
{
  "name": "weekly-deep-review",
  "schedule": "0 4 * * 0",
  "endpoint": "/api/self-improvement/deep-review",
  "timeout": 600000
}
```

---

## Railway Configuration

### railway.toml (Add to your API service)

```toml
[build]
builder = "nixpacks"

[deploy]
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3

# Cron Jobs for Self-Improvement Loop
[[cron]]
name = "hourly-health-check"
schedule = "0 * * * *"
path = "/api/self-improvement/health-check"
method = "POST"

[[cron]]
name = "daily-optimization"
schedule = "0 3 * * *"
path = "/api/self-improvement/optimize"
method = "POST"

[[cron]]
name = "weekly-deep-review"
schedule = "0 4 * * 0"
path = "/api/self-improvement/deep-review"
method = "POST"
```

---

## API Endpoints Implementation

These endpoints should be added to your API service:

### /api/self-improvement/health-check

```typescript
app.post('/api/self-improvement/health-check', async (req, res) => {
  const results = {
    timestamp: new Date().toISOString(),
    checks: {},
  };

  // Check services
  results.checks.relay = await checkService('http://localhost:3001/health');
  results.checks.redis = await checkRedis();
  results.checks.database = await checkDatabase();

  // Broadcast status to agents
  await broadcastToRelay({
    type: 'SYSTEM_HEALTH_UPDATE',
    payload: results,
  });

  res.json(results);
});
```

### /api/self-improvement/optimize

```typescript
app.post('/api/self-improvement/optimize', async (req, res) => {
  const analysis = {
    timestamp: new Date().toISOString(),
    metrics: {},
    recommendations: [],
  };

  // Analyze performance
  analysis.metrics = await gatherPerformanceMetrics();

  // Generate recommendations
  if (analysis.metrics.avgResponseTime > 1000) {
    analysis.recommendations.push('Consider scaling relay server');
  }

  if (analysis.metrics.memoryUsage > 0.8) {
    analysis.recommendations.push('Memory usage high - investigate leaks');
  }

  // Store for trending
  await storeAnalysis(analysis);

  res.json(analysis);
});
```

### /api/self-improvement/deep-review

```typescript
app.post('/api/self-improvement/deep-review', async (req, res) => {
  const review = {
    timestamp: new Date().toISOString(),
    period: 'weekly',
    sections: {},
  };

  // Comprehensive review
  review.sections.healthHistory = await getHealthHistory(7);
  review.sections.performanceTrends = await getPerformanceTrends(7);
  review.sections.agentActivity = await getAgentActivity(7);
  review.sections.errorAnalysis = await analyzeErrors(7);

  // Generate report
  review.report = generateWeeklyReport(review.sections);

  // Send notification
  await sendReportNotification(review);

  res.json(review);
});
```

---

## Setting Up on Railway

1. **Via Railway Dashboard**:
   - Go to your project settings
   - Navigate to "Cron" section
   - Add each cron job with the schedules above

2. **Via Railway CLI**:

   ```bash
   railway cron add hourly-health-check --schedule="0 * * * *" --path="/api/self-improvement/health-check"
   railway cron add daily-optimization --schedule="0 3 * * *" --path="/api/self-improvement/optimize"
   railway cron add weekly-deep-review --schedule="0 4 * * 0" --path="/api/self-improvement/deep-review"
   ```

3. **Via railway.toml** (recommended): Add the [[cron]] sections shown above to
   your railway.toml

---

## Monitoring

View cron job execution in Railway:

1. Go to your project dashboard
2. Click on "Cron" in the sidebar
3. See execution history, logs, and status

---

## Integration with TNF Ecosystem

The self-improvement loop integrates with:

- **Local Relay**: Broadcasts health updates to all agents
- **Redis Pub/Sub**: Publishes to `tnf:self-improvement` channel
- **Cloud Sandbox**: Can trigger browser-based tests
- **Chrome Extension**: Receives health updates in UI

This creates a continuously self-monitoring and self-improving system!
