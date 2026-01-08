import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { QueueName } from './constants/queue-names';
import { getBullConfig, QUEUE_SETTINGS } from './jobs.config';

// Processors
import { AgentExecutionProcessor } from './processors/agent-execution.processor';
import { CleanupProcessor } from './processors/cleanup.processor';
import { DataSyncProcessor } from './processors/data-sync.processor';
import { EmailProcessor } from './processors/email.processor';
import { ReportGenerationProcessor } from './processors/report-generation.processor';

// Services
import { GracefulShutdownService } from './services/graceful-shutdown.service';
import { JobMetricsService } from './services/job-metrics.service';
import { JobQueueService } from './services/job-queue.service';
import { JobSchedulerService } from './services/job-scheduler.service';

// Controller
import { JobsMonitoringController } from './jobs-monitoring.controller';

// Import email service
import { SystemMetricsModule } from '../modules/system-metrics/system-metrics.module';
import { EmailService } from '../services/email.service';

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
