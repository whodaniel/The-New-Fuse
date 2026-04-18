import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { QueueName } from './constants/queue-names.js';
import { getBullConfig, QUEUE_SETTINGS } from './jobs.config.js';

// Processors
import { AgentExecutionProcessor } from './processors/agent-execution.processor.js';
import { CleanupProcessor } from './processors/cleanup.processor.js';
import { DataSyncProcessor } from './processors/data-sync.processor.js';
import { EmailProcessor } from './processors/email.processor.js';
import { ReportGenerationProcessor } from './processors/report-generation.processor.js';

// Services
import { GracefulShutdownService } from './services/graceful-shutdown.service.js';
import { JobMetricsService } from './services/job-metrics.service.js';
import { JobQueueService } from './services/job-queue.service.js';
import { JobSchedulerService } from './services/job-scheduler.service.js';

// Controller
import { JobsMonitoringController } from './jobs-monitoring.controller.js';

// Import email service
import { SystemMetricsModule } from '../modules/system-metrics/system-metrics.module.js';
import { EmailService } from '../services/email.service.js';
import { CacheModule } from '../cache/cache.module.js';

/**
 * Jobs module
 * Handles all background job processing using Bull
 */
@Module({
  imports: [
    // Import config module
    ConfigModule,

    // Import system metrics module
    SystemMetricsModule,

    // Import schedule module for cron jobs
    ScheduleModule.forRoot(),

    // Configure Bull with Redis
    BullModule.forRoot(getBullConfig()),

    // Register all queues
    BullModule.registerQueue(
      {
        name: QueueName.EMAIL,
        ...QUEUE_SETTINGS[QueueName.EMAIL],
      },
      {
        name: QueueName.AGENT_EXECUTION,
        ...QUEUE_SETTINGS[QueueName.AGENT_EXECUTION],
      },
      {
        name: QueueName.REPORT_GENERATION,
        ...QUEUE_SETTINGS[QueueName.REPORT_GENERATION],
      },
      {
        name: QueueName.DATA_SYNC,
        ...QUEUE_SETTINGS[QueueName.DATA_SYNC],
      },
      {
        name: QueueName.CLEANUP,
        ...QUEUE_SETTINGS[QueueName.CLEANUP],
      }
    ),
    // Import CacheModule for DataSyncProcessor
    CacheModule,
  ],
  controllers: [JobsMonitoringController],
  providers: [
    // Email service dependency
    EmailService,

    // Processors
    EmailProcessor,
    AgentExecutionProcessor,
    ReportGenerationProcessor,
    DataSyncProcessor,
    CleanupProcessor,

    // Services
    JobMetricsService,
    JobSchedulerService,
    GracefulShutdownService,
    JobQueueService,
  ],
  exports: [
    // Export services for use in other modules
    JobQueueService,
    JobMetricsService,
    JobSchedulerService,
  ],
})
export class JobsModule {}
