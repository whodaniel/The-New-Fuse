# Background Job Processing System

A robust background job processing system for The New Fuse backend built with Bull (Redis-based queue) and NestJS.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Queue Types](#queue-types)
- [Job Processors](#job-processors)
- [Usage Examples](#usage-examples)
- [Monitoring](#monitoring)
- [Scheduled Jobs](#scheduled-jobs)
- [Configuration](#configuration)
- [API Endpoints](#api-endpoints)

## Overview

This job processing system provides:

- **Redis-based job queues** using Bull
- **Priority-based job execution** (Critical, High, Normal, Low)
- **Automatic retry logic** with exponential backoff
- **Job monitoring and metrics**
- **Scheduled/recurring jobs** using cron expressions
- **Graceful shutdown** handling
- **Real-time job tracking** with progress updates

## Architecture

```
jobs/
├── constants/
│   └── queue-names.ts          # Queue names, priorities, retry configs
├── interfaces/
│   └── job-data.interface.ts   # Job data type definitions
├── processors/
│   ├── email.processor.ts      # Email job processor
│   ├── agent-execution.processor.ts
│   ├── report-generation.processor.ts
│   ├── data-sync.processor.ts
│   └── cleanup.processor.ts
├── services/
│   ├── job-queue.service.ts    # Main API for adding jobs
│   ├── job-metrics.service.ts  # Metrics and monitoring
│   ├── job-scheduler.service.ts # Cron job scheduling
│   └── graceful-shutdown.service.ts
├── jobs-monitoring.controller.ts
├── jobs.config.ts              # Bull configuration
└── jobs.module.ts
```

## Queue Types

### 1. Email Queue
- **Purpose**: Send emails (welcome, notifications, etc.)
- **Rate Limit**: 100 jobs/minute
- **Retry Attempts**: 3
- **Backoff**: 5 seconds

### 2. Agent Execution Queue
- **Purpose**: Run long-running agent tasks
- **Rate Limit**: 10 jobs/minute
- **Retry Attempts**: 2
- **Backoff**: 10 seconds
- **Timeout**: 5 minutes (configurable)

### 3. Report Generation Queue
- **Purpose**: Generate reports (PDF, CSV, JSON, XLSX)
- **Rate Limit**: 5 jobs/minute
- **Retry Attempts**: 3
- **Backoff**: 15 seconds
- **Timeout**: 10 minutes

### 4. Data Sync Queue
- **Purpose**: Synchronize data between systems
- **Rate Limit**: 2 jobs/minute
- **Retry Attempts**: 5
- **Backoff**: 30 seconds
- **Timeout**: 30 minutes

### 5. Cleanup Queue
- **Purpose**: Clean up old data, sessions, temp files
- **Rate Limit**: 1 job/minute
- **Retry Attempts**: 2
- **Backoff**: 60 seconds
- **Timeout**: 1 hour

## Job Processors

### Email Processor

**Supported Jobs:**
- `send-email` - Generic email sending
- `welcome-email` - Welcome email for new users
- `notification-email` - Notification emails

### Agent Execution Processor

**Supported Jobs:**
- `execute-agent` - Execute a single agent
- `batch-execute-agents` - Execute multiple agents in batch

### Report Generation Processor

**Supported Jobs:**
- `generate-report` - Generate reports (user-activity, agent-performance, system-metrics, revenue)
- `scheduled-report` - Scheduled report generation

### Data Sync Processor

**Supported Jobs:**
- `sync-data` - Full or incremental data synchronization
- `incremental-sync` - Incremental sync with timestamp tracking

### Cleanup Processor

**Supported Jobs:**
- `cleanup` - Clean up old data (sessions, temp files, tokens, logs)

## Usage Examples

### Sending an Email

```typescript
import { JobQueueService } from './jobs/services/job-queue.service';
import { JobPriority } from './jobs/constants/queue-names';

@Injectable()
export class UserService {
  constructor(private jobQueue: JobQueueService) {}

  async createUser(userData: CreateUserDto) {
    // ... create user logic

    // Send welcome email
    await this.jobQueue.sendWelcomeEmail({
      userId: user.id,
      email: user.email,
      name: user.name,
    }, JobPriority.HIGH);
  }
}
```

### Executing an Agent

```typescript
await this.jobQueue.executeAgent({
  agentId: 'agent-123',
  userId: 'user-456',
  task: 'Process data analysis',
  parameters: {
    dataset: 'sales-2024',
    analysisType: 'trend',
  },
  timeout: 600000, // 10 minutes
}, JobPriority.NORMAL);
```

### Generating a Report

```typescript
await this.jobQueue.generateReport({
  reportType: 'user-activity',
  userId: 'admin',
  parameters: {
    startDate: '2024-01-01',
    endDate: '2024-12-31',
  },
  format: 'pdf',
  emailOnComplete: true,
  email: 'admin@thenewfuse.com',
}, JobPriority.NORMAL);
```

### Syncing Data

```typescript
await this.jobQueue.syncData({
  source: 'database',
  destination: 'cache',
  syncType: 'incremental',
  entityType: 'users',
  filters: {
    modifiedAfter: lastSyncTime,
  },
}, JobPriority.NORMAL);
```

### Running Cleanup

```typescript
await this.jobQueue.cleanup({
  cleanupType: 'old_sessions',
  olderThan: 7, // days
  batchSize: 100,
}, JobPriority.LOW);
```

## Monitoring

### Getting Job Statistics

```typescript
import { JobMetricsService } from './jobs/services/job-metrics.service';

@Injectable()
export class DashboardService {
  constructor(private metrics: JobMetricsService) {}

  async getJobStats() {
    const stats = await this.metrics.getJobStatistics();
    return stats;
  }
}
```

### Checking Queue Health

```typescript
const health = await this.metrics.getQueueHealth(QueueName.EMAIL);
console.log('Queue healthy:', health.healthy);
console.log('Issues:', health.issues);
```

## Scheduled Jobs

The system automatically runs these scheduled jobs:

### Daily Jobs
- **2:00 AM UTC** - Cleanup old sessions (7 days)
- **3:00 AM UTC** - Cleanup temp files (1 day)
- **1:00 AM UTC** - Daily data synchronization

### Periodic Jobs
- **Every 6 hours** - Cleanup expired tokens
- **Every hour** - Incremental data sync
- **Every 5 minutes** - Job queue health check

### Weekly Jobs
- **Monday 9:00 AM UTC** - Weekly performance report

### Monthly Jobs
- **1st of month, 8:00 AM UTC** - Monthly user activity report
- **Sunday 4:00 AM UTC** - Cleanup old logs (30 days)

## Configuration

### Environment Variables

```bash
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_DB=0

# Email Configuration (for email jobs)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@thenewfuse.com
```

### Queue Settings

Customize queue settings in `/jobs/jobs.config.ts`:

```typescript
export const QUEUE_SETTINGS = {
  [QueueName.EMAIL]: {
    limiter: {
      max: 100, // Max jobs per duration
      duration: 60000, // 1 minute
    },
    settings: {
      lockDuration: 30000,
      lockRenewTime: 15000,
      stalledInterval: 30000,
      maxStalledCount: 2,
    },
  },
  // ... other queues
};
```

## API Endpoints

### Get Overall Statistics
```
GET /api/jobs/stats
```

Response:
```json
{
  "queues": [...],
  "overall": {
    "totalJobs": 1500,
    "activeJobs": 5,
    "completedJobs": 1450,
    "failedJobs": 45,
    "successRate": 96.99
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Get Queue Metrics
```
GET /api/jobs/queues/:queueName
```

### Get Failed Jobs
```
GET /api/jobs/queues/:queueName/failed?limit=10
```

### Get Active Jobs
```
GET /api/jobs/queues/:queueName/active?limit=10
```

### Get Queue Health
```
GET /api/jobs/queues/:queueName/health
```

### Pause a Queue
```
POST /api/jobs/queues/:queueName/pause
```

### Resume a Queue
```
POST /api/jobs/queues/:queueName/resume
```

### Clean Old Jobs
```
POST /api/jobs/queues/:queueName/clean?grace=86400000&status=completed
```

### Get Dashboard Data
```
GET /api/jobs/dashboard
```

## Job Priorities

Jobs can be assigned priorities:

- **CRITICAL (1)** - Highest priority, processed first
- **HIGH (2)** - High priority
- **NORMAL (3)** - Default priority
- **LOW (4)** - Lowest priority

Example:
```typescript
await this.jobQueue.sendEmail(data, JobPriority.CRITICAL);
```

## Retry Logic

All jobs have automatic retry with exponential backoff:

```typescript
{
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 5000, // 5 seconds
  }
}
```

Failed jobs are retried:
- 1st retry: after 5 seconds
- 2nd retry: after 10 seconds
- 3rd retry: after 20 seconds

## Graceful Shutdown

The system handles graceful shutdown automatically:

1. On SIGTERM/SIGINT signal
2. Pauses all queues (no new jobs accepted)
3. Waits for active jobs to complete (max 30 seconds)
4. Closes all queue connections
5. Exits cleanly

## Best Practices

1. **Use appropriate priorities** - Don't overuse CRITICAL priority
2. **Set reasonable timeouts** - Especially for long-running tasks
3. **Monitor queue health** - Check the health endpoints regularly
4. **Clean old jobs** - Use the cleanup endpoints to remove old completed jobs
5. **Handle failures gracefully** - Implement proper error handling in processors
6. **Use idempotent jobs** - Jobs should be safe to retry
7. **Log important events** - All processors log key events

## Troubleshooting

### High Failure Rate
Check failed jobs endpoint to see error messages:
```
GET /api/jobs/queues/email/failed?limit=100
```

### Queue Backlog
Check waiting jobs and increase worker concurrency or rate limits.

### Stuck Jobs
The system automatically detects and recovers stalled jobs. Check logs for details.

### Redis Connection Issues
Verify Redis is running and credentials are correct in environment variables.

## Future Enhancements

- [ ] Bull Board UI integration for visual monitoring
- [ ] Webhook notifications for job failures
- [ ] Job result persistence to database
- [ ] Advanced retry strategies
- [ ] Job dependencies and workflows
- [ ] Distributed job execution across multiple workers
