import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { getBullConfig, QUEUE_SETTINGS } from './jobs.config';
import { QueueName } from './constants/queue-names';

// Processors
import { EmailProcessor } from './processors/email.processor';
import { AgentExecutionProcessor } from './processors/agent-execution.processor';
import { ReportGenerationProcessor } from './processors/report-generation.processor';
import { DataSyncProcessor } from './processors/data-sync.processor';
import { CleanupProcessor } from './processors/cleanup.processor';

// Services
import { JobMetricsService } from './services/job-metrics.service';
import { JobSchedulerService } from './services/job-scheduler.service';
import { GracefulShutdownService } from './services/graceful-shutdown.service';
import { JobQueueService } from './services/job-queue.service';

// Controller
import { JobsMonitoringController } from './jobs-monitoring.controller';

// Import email service
import { EmailService } from '../services/email.service';

/**
 * Jobs module
 * Handles all background job processing using Bull
 */
@Module({
  imports: [
    // Import config module
    ConfigModule,

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
      },
    ),
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
