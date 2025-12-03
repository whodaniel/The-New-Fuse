import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Queue } from 'bull';
import { JOB_ATTEMPTS, JOB_BACKOFF, JobPriority, QueueName } from '../constants/queue-names';
import {
  CleanupJobData,
  DataSyncJobData,
  ReportGenerationJobData,
} from '../interfaces/job-data.interface';

/**
 * Job scheduler service
 * Handles scheduling of recurring jobs
 */
@Injectable()
export class JobSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(JobSchedulerService.name);

  constructor(
    @InjectQueue(QueueName.CLEANUP) private cleanupQueue: Queue,
    @InjectQueue(QueueName.DATA_SYNC) private dataSyncQueue: Queue,
    @InjectQueue(QueueName.REPORT_GENERATION) private reportQueue: Queue
  ) {}

  async onModuleInit() {
    this.logger.log('Job scheduler initialized');
    // Initialize any startup jobs here
  }

  /**
   * Schedule daily cleanup of old sessions
   * Runs every day at 2:00 AM
   */
  @Cron('0 2 * * *', {
    name: 'cleanup-old-sessions',
    timeZone: 'UTC',
  })
  async scheduleSessionCleanup() {
    this.logger.log('Scheduling daily session cleanup');

    const jobData: CleanupJobData = {
      cleanupType: 'old_sessions',
      olderThan: 7, // 7 days
      batchSize: 100,
      timestamp: Date.now(),
    };

    await this.cleanupQueue.add('cleanup', jobData, {
      priority: JobPriority.NORMAL,
      attempts: JOB_ATTEMPTS.CLEANUP,
      backoff: {
        type: 'exponential',
        delay: JOB_BACKOFF.CLEANUP,
      },
    });

    this.logger.log('Session cleanup job scheduled');
  }

  /**
   * Schedule cleanup of temporary files
   * Runs every day at 3:00 AM
   */
  @Cron('0 3 * * *', {
    name: 'cleanup-temp-files',
    timeZone: 'UTC',
  })
  async scheduleTempFilesCleanup() {
    this.logger.log('Scheduling temp files cleanup');

    const jobData: CleanupJobData = {
      cleanupType: 'temp_files',
      olderThan: 1, // 1 day
      batchSize: 100,
      timestamp: Date.now(),
    };

    await this.cleanupQueue.add('cleanup', jobData, {
      priority: JobPriority.LOW,
      attempts: JOB_ATTEMPTS.CLEANUP,
      backoff: {
        type: 'exponential',
        delay: JOB_BACKOFF.CLEANUP,
      },
    });

    this.logger.log('Temp files cleanup job scheduled');
  }

  /**
   * Schedule cleanup of expired tokens
   * Runs every 6 hours
   */
  @Cron(CronExpression.EVERY_6_HOURS, {
    name: 'cleanup-expired-tokens',
  })
  async scheduleTokenCleanup() {
    this.logger.log('Scheduling expired tokens cleanup');

    const jobData: CleanupJobData = {
      cleanupType: 'expired_tokens',
      batchSize: 100,
      timestamp: Date.now(),
    };

    await this.cleanupQueue.add('cleanup', jobData, {
      priority: JobPriority.NORMAL,
      attempts: JOB_ATTEMPTS.CLEANUP,
      backoff: {
        type: 'exponential',
        delay: JOB_BACKOFF.CLEANUP,
      },
    });

    this.logger.log('Token cleanup job scheduled');
  }

  /**
   * Schedule cleanup of old logs
   * Runs every Sunday at 4:00 AM
   */
  @Cron('0 4 * * 0', {
    name: 'cleanup-old-logs',
    timeZone: 'UTC',
  })
  async scheduleLogCleanup() {
    this.logger.log('Scheduling old logs cleanup');

    const jobData: CleanupJobData = {
      cleanupType: 'old_logs',
      olderThan: 30, // 30 days
      batchSize: 500,
      timestamp: Date.now(),
    };

    await this.cleanupQueue.add('cleanup', jobData, {
      priority: JobPriority.LOW,
      attempts: JOB_ATTEMPTS.CLEANUP,
      backoff: {
        type: 'exponential',
        delay: JOB_BACKOFF.CLEANUP,
      },
    });

    this.logger.log('Log cleanup job scheduled');
  }

  /**
   * Schedule daily data synchronization
   * Runs every day at 1:00 AM
   */
  @Cron('0 1 * * *', {
    name: 'daily-data-sync',
    timeZone: 'UTC',
  })
  async scheduleDailyDataSync() {
    this.logger.log('Scheduling daily data synchronization');

    const jobData: DataSyncJobData = {
      source: 'database',
      destination: 'cache',
      syncType: 'full',
      timestamp: Date.now(),
    };

    await this.dataSyncQueue.add('sync-data', jobData, {
      priority: JobPriority.NORMAL,
      attempts: JOB_ATTEMPTS.DATA_SYNC,
      backoff: {
        type: 'exponential',
        delay: JOB_BACKOFF.DATA_SYNC,
      },
    });

    this.logger.log('Daily data sync job scheduled');
  }

  /**
   * Schedule incremental data sync
   * Runs every hour
   */
  @Cron(CronExpression.EVERY_HOUR, {
    name: 'hourly-incremental-sync',
  })
  async scheduleIncrementalSync() {
    this.logger.log('Scheduling incremental data sync');

    const lastHour = new Date();
    lastHour.setHours(lastHour.getHours() - 1);

    const jobData: DataSyncJobData & { lastSyncTime: string } = {
      source: 'database',
      destination: 'cache',
      syncType: 'incremental',
      lastSyncTime: lastHour.toISOString(),
      timestamp: Date.now(),
    };

    await this.dataSyncQueue.add('incremental-sync', jobData, {
      priority: JobPriority.NORMAL,
      attempts: JOB_ATTEMPTS.DATA_SYNC,
      backoff: {
        type: 'exponential',
        delay: JOB_BACKOFF.DATA_SYNC,
      },
    });

    this.logger.log('Incremental sync job scheduled');
  }

  /**
   * Schedule weekly performance report
   * Runs every Monday at 9:00 AM
   */
  @Cron('0 9 * * 1', {
    name: 'weekly-performance-report',
    timeZone: 'UTC',
  })
  async scheduleWeeklyReport() {
    this.logger.log('Scheduling weekly performance report');

    // Get admin emails (you should fetch these from database)
    const adminEmails = ['admin@thenewfuse.com'];

    for (const email of adminEmails) {
      const jobData: ReportGenerationJobData = {
        reportType: 'system-metrics',
        userId: 'system',
        parameters: {
          period: 'weekly',
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString(),
        },
        format: 'pdf',
        emailOnComplete: true,
        email,
        timestamp: Date.now(),
      };

      await this.reportQueue.add('scheduled-report', jobData, {
        priority: JobPriority.NORMAL,
        attempts: JOB_ATTEMPTS.REPORT_GENERATION,
        backoff: {
          type: 'exponential',
          delay: JOB_BACKOFF.REPORT_GENERATION,
        },
      });
    }

    this.logger.log('Weekly performance report scheduled');
  }

  /**
   * Schedule monthly user activity report
   * Runs on the 1st of every month at 8:00 AM
   */
  @Cron('0 8 1 * *', {
    name: 'monthly-user-activity-report',
    timeZone: 'UTC',
  })
  async scheduleMonthlyUserReport() {
    this.logger.log('Scheduling monthly user activity report');

    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const jobData: ReportGenerationJobData = {
      reportType: 'user-activity',
      userId: 'system',
      parameters: {
        period: 'monthly',
        month: lastMonth.getMonth() + 1,
        year: lastMonth.getFullYear(),
      },
      format: 'json',
      timestamp: Date.now(),
    };

    await this.reportQueue.add('scheduled-report', jobData, {
      priority: JobPriority.NORMAL,
      attempts: JOB_ATTEMPTS.REPORT_GENERATION,
      backoff: {
        type: 'exponential',
        delay: JOB_BACKOFF.REPORT_GENERATION,
      },
    });

    this.logger.log('Monthly user activity report scheduled');
  }

  /**
   * Health check - runs every 30 minutes (reduced from 5 to minimize Redis load)
   */
  @Cron(CronExpression.EVERY_30_MINUTES, {
    name: 'job-health-check',
  })
  async performHealthCheck() {
    this.logger.debug('Performing job queue health check');

    // Check queue health and log warnings
    // This could be extended to send alerts if issues are detected
    try {
      const cleanupCounts = await this.cleanupQueue.getJobCounts();
      const dataSyncCounts = await this.dataSyncQueue.getJobCounts();
      const reportCounts = await this.reportQueue.getJobCounts();

      this.logger.debug('Queue health check completed', {
        cleanup: cleanupCounts,
        dataSync: dataSyncCounts,
        reports: reportCounts,
      });
    } catch (error) {
      // Enhanced error handling for Redis connection issues
      if (
        error.message?.includes('MaxRetriesPerRequestError') ||
        error.message?.includes('ECONNREFUSED') ||
        error.message?.includes('Connection is closed')
      ) {
        this.logger.warn(
          'Redis connection issue during health check - this is non-fatal and will be retried',
          {
            error: error.message,
            timestamp: new Date().toISOString(),
          }
        );
      } else {
        this.logger.error('Health check failed', error);
      }
    }
  }

  /**
   * Manually schedule a job
   */
  async scheduleJob(
    queueName: QueueName,
    jobName: string,
    data: any,
    options?: {
      priority?: JobPriority;
      delay?: number;
      repeatCron?: string;
    }
  ) {
    let queue: Queue;

    switch (queueName) {
      case QueueName.CLEANUP:
        queue = this.cleanupQueue;
        break;
      case QueueName.DATA_SYNC:
        queue = this.dataSyncQueue;
        break;
      case QueueName.REPORT_GENERATION:
        queue = this.reportQueue;
        break;
      default:
        throw new Error(`Unsupported queue for scheduling: ${queueName}`);
    }

    const job = await queue.add(jobName, data, {
      priority: options?.priority || JobPriority.NORMAL,
      delay: options?.delay,
      repeat: options?.repeatCron ? { cron: options.repeatCron } : undefined,
      attempts: JOB_ATTEMPTS[queueName.toUpperCase().replace('-', '_')],
      backoff: {
        type: 'exponential',
        delay: JOB_BACKOFF[queueName.toUpperCase().replace('-', '_')],
      },
    });

    this.logger.log(`Job ${jobName} scheduled on ${queueName} with ID ${job.id}`);

    return job;
  }
}
