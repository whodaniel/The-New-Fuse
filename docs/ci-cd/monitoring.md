# Monitoring & Alerting

Guide for monitoring CI/CD pipeline health and setting up alerts.

## Table of Contents

- [Overview](#overview)
- [Metrics to Monitor](#metrics-to-monitor)
- [GitHub Actions Monitoring](#github-actions-monitoring)
- [Railway Monitoring](#railway-monitoring)
- [Application Monitoring](#application-monitoring)
- [Alerting Setup](#alerting-setup)
- [Dashboards](#dashboards)
- [Incident Response](#incident-response)

## Overview

Effective monitoring ensures:

- Quick detection of issues
- Fast incident response
- Continuous improvement
- System reliability

## Metrics to Monitor

### CI/CD Health Metrics

#### Build Success Rate

- **Metric**: Percentage of successful builds
- **Target**: >95%
- **Alert**: <90% in last 24 hours
- **Action**: Investigate failing builds

#### Deployment Frequency

- **Metric**: Deployments per day/week
- **Target**: Multiple per day
- **Alert**: No deployments in 7 days
- **Action**: Check if team is blocked

#### Deployment Success Rate

- **Metric**: Percentage of successful deployments
- **Target**: >95%
- **Alert**: <90% in last week
- **Action**: Review deployment process

#### Mean Time to Recovery (MTTR)

- **Metric**: Time from failure to recovery
- **Target**: <30 minutes
- **Alert**: >1 hour average
- **Action**: Improve rollback procedures

#### Change Failure Rate

- **Metric**: Percentage of changes causing incidents
- **Target**: <5%
- **Alert**: >10% in last month
- **Action**: Improve testing/review

### Workflow Metrics

#### Test Suite Duration

- **Metric**: Time to run all tests
- **Target**: <20 minutes
- **Alert**: >30 minutes
- **Action**: Optimize tests or parallelize

#### Build Duration

- **Metric**: Time to build all packages/apps
- **Target**: <20 minutes
- **Alert**: >30 minutes
- **Action**: Optimize builds or cache

#### Queue Time

- **Metric**: Time waiting for runner
- **Target**: <2 minutes
- **Alert**: >10 minutes
- **Action**: Add runners or optimize workflows

#### Cache Hit Rate

- **Metric**: Percentage of cache hits
- **Target**: >80%
- **Alert**: <50%
- **Action**: Review cache strategy

## GitHub Actions Monitoring

### Built-in Monitoring

#### Workflow Status

```bash
# List recent runs
gh run list --limit 50

# Check status
gh run list --status completed
gh run list --status failed

# View specific workflow
gh run list --workflow=test.yml
```

#### Workflow Analytics

- Go to: Repository → Insights → Actions
- View:
  - Workflow runs over time
  - Success/failure rates
  - Duration trends
  - Popular workflows

### Custom Metrics

#### Track Build Times

Add to workflows:

```yaml
- name: Start timer
  id: start
  run: echo "::set-output name=start::$(date +%s)"

- name: Build
  run: pnpm run build

- name: Report duration
  run: |
    END=$(date +%s)
    DURATION=$((END - ${{ steps.start.outputs.start }}))
    echo "Build took ${DURATION}s"
    echo "build_duration=$DURATION" >> $GITHUB_OUTPUT
```

#### Report to Monitoring Service

```yaml
- name: Send metrics
  run: |
    curl -X POST https://monitoring.example.com/metrics \
      -d "workflow=${{ github.workflow }}" \
      -d "status=${{ job.status }}" \
      -d "duration=${{ steps.build.outputs.duration }}"
```

### Workflow Insights

Track these in GitHub Actions insights:

1. **Run frequency**: How often each workflow runs
2. **Success rate**: Percentage of successful runs
3. **Average duration**: Time to complete
4. **Failure patterns**: Common failure points

## Railway Monitoring

### Railway Dashboard

Monitor in Railway dashboard:

#### Service Health

- CPU usage
- Memory usage
- Network traffic
- Response times
- Error rates

#### Deployment Status

- Active deployments
- Deployment history
- Build logs
- Runtime logs

### Railway CLI Monitoring

```bash
# Service status
railway status --service=api-gateway

# Resource usage
railway metrics --service=api-gateway

# Logs (real-time)
railway logs --service=api-gateway --tail 100 --follow

# Deployments
railway deployments --service=api-gateway
```

### Key Metrics

#### CPU Usage

- **Target**: <70% average
- **Alert**: >90% sustained
- **Action**: Scale up or optimize

#### Memory Usage

- **Target**: <80% of allocated
- **Alert**: >90% sustained
- **Action**: Increase memory or fix leaks

#### Response Time

- **Target**: p95 <500ms
- **Alert**: p95 >1000ms
- **Action**: Performance optimization

#### Error Rate

- **Target**: <0.1%
- **Alert**: >1%
- **Action**: Investigate errors

## Application Monitoring

### Recommended Tools

#### Error Tracking: Sentry

```typescript
// apps/frontend/src/main.tsx
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

**Monitor**:

- Unhandled errors
- Failed API calls
- Performance issues
- User sessions

#### APM: New Relic / Datadog

```typescript
// apps/api/src/main.ts
import newrelic from 'newrelic';

// Automatic instrumentation
```

**Monitor**:

- API response times
- Database queries
- External service calls
- Transaction traces

#### Logs: LogTail / Papertrail

```bash
# Configure in Railway
railway variables set LOG_DRAIN_URL=<logtail-url>
```

**Monitor**:

- Application logs
- Error logs
- Access logs
- Audit logs

### Custom Metrics

#### Health Check Endpoint

```typescript
// apps/api/src/health/health.controller.ts
@Get('health')
async getHealth(): Promise<HealthStatus> {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: await this.checkDatabase(),
    redis: await this.checkRedis(),
  };
}
```

#### Metrics Endpoint

```typescript
@Get('metrics')
async getMetrics(): Promise<Metrics> {
  return {
    requests: this.requestCount,
    errors: this.errorCount,
    avgResponseTime: this.avgResponseTime,
    activeConnections: this.activeConnections,
  };
}
```

## Alerting Setup

### GitHub Actions Alerts

#### Workflow Failure Notifications

Add to workflows:

```yaml
- name: Notify on failure
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: 'Workflow ${{ github.workflow }} failed!'
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

#### Email Notifications

Configure in GitHub:

1. Settings → Notifications
2. Actions → Email notifications
3. Select: "Send notifications for failed workflows"

### Slack Notifications

#### Setup Incoming Webhook

1. Go to Slack App Directory
2. Search for "Incoming Webhooks"
3. Add to workspace
4. Create webhook for #deployments channel
5. Copy webhook URL
6. Add to GitHub Secrets as `SLACK_WEBHOOK`

#### Notification Template

```yaml
- name: Slack notification
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    author_name: GitHub Actions
    fields: repo,message,commit,author,action,eventName,ref,workflow
    text: |
      Deployment ${{ job.status }}
      Environment: ${{ env.ENVIRONMENT }}
      Service: ${{ matrix.service }}
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

### Railway Alerts

#### Setup in Railway

1. Project Settings → Notifications
2. Add Slack webhook
3. Configure alerts:
   - Deployment success/failure
   - Service down
   - High resource usage
   - Build failures

### PagerDuty Integration

For critical alerts:

```yaml
- name: Create PagerDuty incident
  if: failure() && github.ref == 'refs/heads/main'
  run: |
    curl -X POST https://events.pagerduty.com/v2/enqueue \
      -H 'Content-Type: application/json' \
      -d '{
        "routing_key": "${{ secrets.PAGERDUTY_KEY }}",
        "event_action": "trigger",
        "payload": {
          "summary": "Production deployment failed",
          "severity": "critical",
          "source": "github-actions"
        }
      }'
```

## Dashboards

### GitHub Actions Dashboard

Create custom dashboard:

**Tools**:

- Grafana + GitHub Actions Exporter
- Custom web dashboard
- Slack bot with slash commands

**Metrics to display**:

- Success rate by workflow
- Average duration
- Queue time
- Failure trends

### Railway Dashboard

Use Railway's built-in dashboard:

**Key views**:

- Service overview (all services)
- Resource usage graphs
- Deployment timeline
- Error rate graphs

### Application Dashboard

**Recommended**: Grafana + Prometheus

**Panels**:

1. **Request Rate**: Requests per second
2. **Error Rate**: Errors per second
3. **Response Time**: p50, p95, p99
4. **Database**: Query count, duration
5. **Cache**: Hit rate, miss rate
6. **Queue**: Length, processing time

### Example Grafana Query

```promql
# Request rate
rate(http_requests_total[5m])

# Error rate
rate(http_requests_total{status=~"5.."}[5m])

# Response time p95
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

## Incident Response

### Alert Levels

#### P0 - Critical

- **Examples**: Production down, data loss
- **Response**: Immediate (24/7)
- **Notification**: PagerDuty + Slack
- **SLA**: 15 minutes to acknowledge

#### P1 - High

- **Examples**: Feature broken, high error rate
- **Response**: Within 1 hour (business hours)
- **Notification**: Slack + Email
- **SLA**: 1 hour to acknowledge

#### P2 - Medium

- **Examples**: Slow performance, minor bugs
- **Response**: Within 4 hours
- **Notification**: Slack
- **SLA**: 4 hours to acknowledge

#### P3 - Low

- **Examples**: Cosmetic issues, enhancements
- **Response**: Next business day
- **Notification**: Ticket
- **SLA**: 24 hours to acknowledge

### Incident Response Process

1. **Acknowledge**: Confirm alert received
2. **Assess**: Determine severity and impact
3. **Notify**: Alert stakeholders
4. **Mitigate**: Quick fix or rollback
5. **Investigate**: Find root cause
6. **Resolve**: Permanent fix
7. **Document**: Post-mortem report
8. **Improve**: Update runbooks

### On-Call Rotation

**Setup**:

1. Define on-call schedule
2. Configure PagerDuty rotation
3. Document escalation path
4. Regular rotation (weekly)

**Responsibilities**:

- Monitor alerts
- Respond to incidents
- Triage issues
- Escalate if needed

## Monitoring Checklist

- [ ] GitHub Actions insights enabled
- [ ] Workflow failure notifications setup
- [ ] Railway monitoring configured
- [ ] Slack webhook integrated
- [ ] Health check endpoints implemented
- [ ] Error tracking (Sentry) setup
- [ ] APM (New Relic/Datadog) configured
- [ ] Log aggregation setup
- [ ] Custom dashboards created
- [ ] Alert rules configured
- [ ] On-call rotation defined
- [ ] Incident response process documented

## Best Practices

### DO

- Monitor proactively
- Set realistic thresholds
- Review metrics regularly
- Document incidents
- Improve based on data
- Test alerting

### DON'T

- Alert on everything
- Ignore alerts
- Set and forget
- Skip post-mortems
- Blame individuals
- Over-complicate

## Resources

- [GitHub Actions Monitoring](https://docs.github.com/en/actions/monitoring-and-troubleshooting-workflows)
- [Railway Metrics](https://docs.railway.app/reference/metrics)
- [Sentry Documentation](https://docs.sentry.io)
- [Grafana Documentation](https://grafana.com/docs/)
- [PagerDuty Integration](https://support.pagerduty.com)
