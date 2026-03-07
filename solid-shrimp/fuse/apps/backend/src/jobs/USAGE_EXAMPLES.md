# Job System Usage Examples

This document provides practical examples of how to use the background job processing system in your services and controllers.

## Table of Contents

1. [Email Jobs](#email-jobs)
2. [Agent Execution Jobs](#agent-execution-jobs)
3. [Report Generation Jobs](#report-generation-jobs)
4. [Data Synchronization Jobs](#data-synchronization-jobs)
5. [Cleanup Jobs](#cleanup-jobs)
6. [Advanced Usage](#advanced-usage)
7. [Monitoring Jobs](#monitoring-jobs)

## Email Jobs

### Example 1: Send Welcome Email on User Registration

```typescript
// users/users.service.ts
import { Injectable } from '@nestjs/common';
import { JobQueueService } from '../jobs/services/job-queue.service';
import { JobPriority } from '../jobs/constants/queue-names';

@Injectable()
export class UsersService {
  constructor(private readonly jobQueue: JobQueueService) {}

  async registerUser(email: string, name: string, password: string) {
    // Create user in database
    const user = await this.createUser(email, name, password);

    // Queue welcome email (high priority)
    await this.jobQueue.sendWelcomeEmail(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        timestamp: Date.now(),
      },
      JobPriority.HIGH,
    );

    return user;
  }
}
```

### Example 2: Send Notification Email

```typescript
// notifications/notifications.service.ts
import { Injectable } from '@nestjs/common';
import { JobQueueService } from '../jobs/services/job-queue.service';
import { JobPriority } from '../jobs/constants/queue-names';

@Injectable()
export class NotificationsService {
  constructor(private readonly jobQueue: JobQueueService) {}

  async notifyUserAboutAgentCompletion(userId: string, agentId: string, result: any) {
    const user = await this.getUserById(userId);

    await this.jobQueue.sendNotificationEmail(
      {
        userId,
        email: user.email,
        notificationType: 'agent-completion',
        data: {
          agentId,
          completedAt: new Date().toISOString(),
          result,
        },
        timestamp: Date.now(),
      },
      JobPriority.NORMAL,
    );
  }
}
```

### Example 3: Send Custom Email

```typescript
await this.jobQueue.sendEmail(
  {
    to: 'user@example.com',
    subject: 'Password Reset Request',
    html: `
      <h1>Password Reset</h1>
      <p>Click the link below to reset your password:</p>
      <a href="${resetLink}">Reset Password</a>
    `,
    timestamp: Date.now(),
  },
  JobPriority.HIGH,
);
```

## Agent Execution Jobs

### Example 1: Execute Agent from API Controller

```typescript
// agents/agents.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { JobQueueService } from '../jobs/services/job-queue.service';
import { JobPriority } from '../jobs/constants/queue-names';

@Controller('agents')
export class AgentsController {
  constructor(private readonly jobQueue: JobQueueService) {}

  @Post('execute')
  async executeAgent(@Body() dto: ExecuteAgentDto) {
    // Queue agent execution
    const job = await this.jobQueue.executeAgent(
      {
        agentId: dto.agentId,
        userId: dto.userId,
        task: dto.task,
        parameters: dto.parameters,
        timeout: 300000, // 5 minutes
        timestamp: Date.now(),
      },
      JobPriority.NORMAL,
    );

    return {
      jobId: job.id,
      message: 'Agent execution queued',
      estimatedCompletion: new Date(Date.now() + 60000).toISOString(),
    };
  }
}
```

### Example 2: Batch Agent Execution

```typescript
async executeBatchAnalysis(datasetId: string, userId: string) {
  const agents = [
    {
      agentId: 'trend-analyzer',
      userId,
      task: 'Analyze trends',
      parameters: { datasetId },
    },
    {
      agentId: 'anomaly-detector',
      userId,
      task: 'Detect anomalies',
      parameters: { datasetId },
    },
    {
      agentId: 'forecaster',
      userId,
      task: 'Generate forecast',
      parameters: { datasetId },
    },
  ];

  const job = await this.jobQueue.executeBatchAgents(agents, JobPriority.HIGH);

  return {
    jobId: job.id,
    agentCount: agents.length,
  };
}
```

### Example 3: Critical Priority Agent Execution

```typescript
// For time-sensitive operations
await this.jobQueue.executeAgent(
  {
    agentId: 'fraud-detector',
    userId,
    task: 'Analyze transaction',
    parameters: {
      transactionId,
      amount,
      timestamp: Date.now(),
    },
    priority: JobPriority.CRITICAL,
  },
  JobPriority.CRITICAL,
);
```

## Report Generation Jobs

### Example 1: Generate Monthly Report

```typescript
// reports/reports.service.ts
import { Injectable } from '@nestjs/common';
import { JobQueueService } from '../jobs/services/job-queue.service';
import { JobPriority } from '../jobs/constants/queue-names';

@Injectable()
export class ReportsService {
  constructor(private readonly jobQueue: JobQueueService) {}

  async generateMonthlyReport(userId: string, month: number, year: number) {
    const job = await this.jobQueue.generateReport(
      {
        reportType: 'user-activity',
        userId,
        parameters: {
          period: 'monthly',
          month,
          year,
        },
        format: 'pdf',
        emailOnComplete: true,
        email: await this.getUserEmail(userId),
        timestamp: Date.now(),
      },
      JobPriority.NORMAL,
    );

    return {
      jobId: job.id,
      message: 'Report generation queued',
    };
  }
}
```

### Example 2: On-Demand CSV Export

```typescript
@Get('export/users')
async exportUsers(@Query('format') format: string) {
  const job = await this.jobQueue.generateReport(
    {
      reportType: 'user-activity',
      userId: 'admin',
      parameters: {
        allUsers: true,
        includeInactive: false,
      },
      format: format as 'csv' | 'xlsx',
      timestamp: Date.now(),
    },
    JobPriority.NORMAL,
  );

  return {
    jobId: job.id,
    pollUrl: `/api/jobs/queues/report-generation/active`,
  };
}
```

### Example 3: Scheduled Weekly Report

```typescript
// This would typically be in a scheduled service
async scheduleWeeklyReports() {
  const adminUsers = await this.getAdminUsers();

  for (const admin of adminUsers) {
    await this.jobQueue.generateReport(
      {
        reportType: 'system-metrics',
        userId: admin.id,
        parameters: {
          period: 'weekly',
          startDate: this.getWeekStartDate(),
          endDate: new Date().toISOString(),
        },
        format: 'pdf',
        emailOnComplete: true,
        email: admin.email,
        timestamp: Date.now(),
      },
      JobPriority.NORMAL,
    );
  }
}
```

## Data Synchronization Jobs

### Example 1: Cache Warmup After Deployment

```typescript
// deployment/deployment.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { JobQueueService } from '../jobs/services/job-queue.service';
import { JobPriority } from '../jobs/constants/queue-names';

@Injectable()
export class DeploymentService implements OnModuleInit {
  constructor(private readonly jobQueue: JobQueueService) {}

  async onModuleInit() {
    // Warm up cache on startup
    await this.jobQueue.syncData(
      {
        source: 'database',
        destination: 'cache',
        syncType: 'full',
        timestamp: Date.now(),
      },
      JobPriority.HIGH,
    );
  }
}
```

### Example 2: Periodic Incremental Sync

```typescript
// This is handled automatically by JobSchedulerService,
// but you can trigger manually:
async triggerIncrementalSync() {
  const lastSyncTime = await this.getLastSyncTime();

  await this.jobQueue.syncData(
    {
      source: 'database',
      destination: 'cache',
      syncType: 'incremental',
      filters: {
        modifiedAfter: lastSyncTime,
      },
      timestamp: Date.now(),
    },
    JobPriority.NORMAL,
  );
}
```

### Example 3: Sync Specific Entity Type

```typescript
async syncUserProfiles() {
  await this.jobQueue.syncData(
    {
      source: 'database',
      destination: 'redis',
      syncType: 'full',
      entityType: 'user_profiles',
      filters: {
        active: true,
      },
      timestamp: Date.now(),
    },
    JobPriority.NORMAL,
  );
}
```

## Cleanup Jobs

### Example 1: Manual Cleanup Trigger

```typescript
// admin/admin.controller.ts
import { Controller, Post } from '@nestjs/common';
import { JobQueueService } from '../jobs/services/job-queue.service';

@Controller('admin/maintenance')
export class MaintenanceController {
  constructor(private readonly jobQueue: JobQueueService) {}

  @Post('cleanup/sessions')
  async cleanupOldSessions() {
    const job = await this.jobQueue.cleanup({
      cleanupType: 'old_sessions',
      olderThan: 7, // days
      batchSize: 100,
      timestamp: Date.now(),
    });

    return {
      jobId: job.id,
      message: 'Cleanup job queued',
    };
  }

  @Post('cleanup/temp-files')
  async cleanupTempFiles() {
    const job = await this.jobQueue.cleanup({
      cleanupType: 'temp_files',
      olderThan: 1,
      batchSize: 100,
      timestamp: Date.now(),
    });

    return { jobId: job.id };
  }
}
```

## Advanced Usage

### Example 1: Delayed Job Execution

```typescript
import { QueueName } from '../jobs/constants/queue-names';

// Send reminder email 24 hours later
await this.jobQueue.addDelayedJob(
  QueueName.EMAIL,
  'send-email',
  {
    to: user.email,
    subject: 'Reminder: Complete your profile',
    html: reminderEmailTemplate,
  },
  24 * 60 * 60 * 1000, // 24 hours in milliseconds
  JobPriority.NORMAL,
);
```

### Example 2: Job Result Tracking

```typescript
// Queue a job and track its progress
const job = await this.jobQueue.executeAgent({
  agentId: 'data-processor',
  userId,
  task: 'Process large dataset',
  parameters: { datasetId },
});

// Poll for job completion (in a real app, use websockets)
const checkJobStatus = async () => {
  const jobStatus = await this.jobQueue.getJob(
    QueueName.AGENT_EXECUTION,
    job.id.toString(),
  );

  if (jobStatus) {
    const state = await jobStatus.getState();
    const progress = jobStatus.progress();

    return {
      state,
      progress,
      data: await jobStatus.returnvalue,
    };
  }
};
```

### Example 3: Retry Failed Job

```typescript
// In an admin controller
@Post('jobs/:queueName/:jobId/retry')
async retryJob(
  @Param('queueName') queueName: QueueName,
  @Param('jobId') jobId: string,
) {
  await this.jobQueue.retryJob(queueName, jobId);
  return { message: 'Job queued for retry' };
}
```

### Example 4: Remove Job

```typescript
// Cancel a queued job
await this.jobQueue.removeJob(QueueName.EMAIL, jobId);
```

## Monitoring Jobs

### Example 1: Dashboard Service

```typescript
// dashboard/dashboard.service.ts
import { Injectable } from '@nestjs/common';
import { JobMetricsService } from '../jobs/services/job-metrics.service';

@Injectable()
export class DashboardService {
  constructor(private readonly metrics: JobMetricsService) {}

  async getJobsDashboard() {
    const stats = await this.metrics.getJobStatistics();

    return {
      overview: stats.overall,
      queues: stats.queues.map((queue) => ({
        name: queue.queueName,
        waiting: queue.waiting,
        active: queue.active,
        completed: queue.completed,
        failed: queue.failed,
        health: queue.failed / (queue.completed + queue.failed || 1) < 0.1,
      })),
    };
  }
}
```

### Example 2: Health Check Endpoint

```typescript
@Get('health/jobs')
async checkJobsHealth() {
  const queues = [
    QueueName.EMAIL,
    QueueName.AGENT_EXECUTION,
    QueueName.REPORT_GENERATION,
  ];

  const healthChecks = await Promise.all(
    queues.map(async (queueName) => {
      const health = await this.metrics.getQueueHealth(queueName);
      return {
        queue: queueName,
        healthy: health.healthy,
        issues: health.issues,
      };
    }),
  );

  const allHealthy = healthChecks.every((check) => check.healthy);

  return {
    status: allHealthy ? 'healthy' : 'degraded',
    checks: healthChecks,
  };
}
```

### Example 3: Alert on High Failure Rate

```typescript
async monitorJobFailures() {
  const stats = await this.metrics.getJobStatistics();

  for (const queue of stats.queues) {
    const totalProcessed = queue.completed + queue.failed;
    if (totalProcessed > 0) {
      const failureRate = (queue.failed / totalProcessed) * 100;

      if (failureRate > 10) {
        // Send alert
        await this.sendAlert({
          level: 'warning',
          message: `High failure rate in ${queue.queueName}: ${failureRate.toFixed(2)}%`,
          queueName: queue.queueName,
          failureRate,
        });
      }
    }
  }
}
```

## Best Practices

### 1. Error Handling

```typescript
try {
  await this.jobQueue.executeAgent(data);
} catch (error) {
  this.logger.error('Failed to queue agent execution', error);
  // Handle error appropriately
  throw new InternalServerErrorException('Failed to queue job');
}
```

### 2. Job Data Validation

```typescript
import { IsString, IsNotEmpty, ValidateNested } from 'class-validator';

class ExecuteAgentDto {
  @IsString()
  @IsNotEmpty()
  agentId: string;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @ValidateNested()
  parameters: Record<string, any>;
}
```

### 3. Logging

```typescript
async processOrder(orderId: string) {
  this.logger.log(`Queueing order processing for ${orderId}`);

  const job = await this.jobQueue.executeAgent({
    agentId: 'order-processor',
    userId: 'system',
    task: 'Process order',
    parameters: { orderId },
  });

  this.logger.log(`Order processing queued with job ID ${job.id}`);

  return job.id;
}
```

### 4. Use Appropriate Priorities

```typescript
// Critical: Security-related, fraud detection, payment processing
JobPriority.CRITICAL

// High: Welcome emails, important notifications, user-facing operations
JobPriority.HIGH

// Normal: Regular notifications, reports, standard operations
JobPriority.NORMAL

// Low: Cleanup tasks, analytics, non-urgent operations
JobPriority.LOW
```

## Testing

### Example Unit Test

```typescript
import { Test } from '@nestjs/testing';
import { JobQueueService } from '../jobs/services/job-queue.service';

describe('UsersService', () => {
  let service: UsersService;
  let jobQueue: JobQueueService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: JobQueueService,
          useValue: {
            sendWelcomeEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(UsersService);
    jobQueue = module.get(JobQueueService);
  });

  it('should queue welcome email on user registration', async () => {
    await service.registerUser('test@example.com', 'Test User', 'password');

    expect(jobQueue.sendWelcomeEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'test@example.com',
        name: 'Test User',
      }),
      expect.any(Number),
    );
  });
});
```
