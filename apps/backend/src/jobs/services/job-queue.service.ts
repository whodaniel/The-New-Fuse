import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue, JobOptions } from 'bull';
import { QueueName, JobPriority, JOB_ATTEMPTS, JOB_BACKOFF } from '../constants/queue-names.js';
import {
  EmailJobData,
  WelcomeEmailJobData,
  NotificationEmailJobData,
  AgentExecutionJobData,
  ReportGenerationJobData,
  DataSyncJobData,
  CleanupJobData,
} from '../interfaces/job-data.interface.js';

/**
 * Job queue service
 * Provides a high-level API for adding jobs to queues
 */
@Injectable()
export class JobQueueService {
  private readonly logger = new Logger(JobQueueService.name);

  constructor(
    @InjectQueue(QueueName.EMAIL) private emailQueue: Queue,
    @InjectQueue(QueueName.AGENT_EXECUTION) private agentQueue: Queue,
    @InjectQueue(QueueName.REPORT_GENERATION) private reportQueue: Queue,
    @InjectQueue(QueueName.DATA_SYNC) private dataSyncQueue: Queue,
    @InjectQueue(QueueName.CLEANUP) private cleanupQueue: Queue,
  ) {}

  /**
   * Add an email job to the queue
   */
  async sendEmail(data: EmailJobData, priority: JobPriority = JobPriority.NORMAL) {
    const job = await this.emailQueue.add('send-email', data, {
      priority,
      attempts: JOB_ATTEMPTS.EMAIL,
      backoff: {
        type: 'exponential',
        delay: JOB_BACKOFF.EMAIL,
      },
    });

    this.logger.log(`Email job added to queue: ${job.id}`);
    return job;
  }

  /**
   * Add a welcome email job
   */
  async sendWelcomeEmail(data: WelcomeEmailJobData, priority: JobPriority = JobPriority.HIGH) {
    const job = await this.emailQueue.add('welcome-email', data, {
      priority,
      attempts: JOB_ATTEMPTS.EMAIL,
      backoff: {
        type: 'exponential',
        delay: JOB_BACKOFF.EMAIL,
      },
    });

    this.logger.log(`Welcome email job added for user ${data.userId}: ${job.id}`);
    return job;
  }

  /**
   * Add a notification email job
   */
  async sendNotificationEmail(
    data: NotificationEmailJobData,
    priority: JobPriority = JobPriority.NORMAL,
  ) {
    const job = await this.emailQueue.add('notification-email', data, {
      priority,
      attempts: JOB_ATTEMPTS.EMAIL,
      backoff: {
        type: 'exponential',
        delay: JOB_BACKOFF.EMAIL,
      },
    });

    this.logger.log(`Notification email job added: ${job.id}`);
    return job;
  }

  /**
   * Execute an agent in the background
   */
  async executeAgent(
    data: AgentExecutionJobData,
    priority: JobPriority = JobPriority.NORMAL,
  ) {
    const job = await this.agentQueue.add('execute-agent', data, {
      priority,
      attempts: JOB_ATTEMPTS.AGENT_EXECUTION,
      backoff: {
        type: 'exponential',
        delay: JOB_BACKOFF.AGENT_EXECUTION,
      },
      timeout: data.timeout || 300000, // 5 minutes default
    });

    this.logger.log(`Agent execution job added for agent ${data.agentId}: ${job.id}`);
    return job;
  }

  /**
   * Execute multiple agents in batch
   */
  async executeBatchAgents(
    agents: AgentExecutionJobData[],
    priority: JobPriority = JobPriority.NORMAL,
  ) {
    const job = await this.agentQueue.add('batch-execute-agents', { agents }, {
      priority,
      attempts: JOB_ATTEMPTS.AGENT_EXECUTION,
      backoff: {
        type: 'exponential',
        delay: JOB_BACKOFF.AGENT_EXECUTION,
      },
    });

    this.logger.log(`Batch agent execution job added with ${agents.length} agents: ${job.id}`);
    return job;
  }

  /**
   * Generate a report
   */
  async generateReport(
    data: ReportGenerationJobData,
    priority: JobPriority = JobPriority.NORMAL,
  ) {
    const job = await this.reportQueue.add('generate-report', data, {
      priority,
      attempts: JOB_ATTEMPTS.REPORT_GENERATION,
      backoff: {
        type: 'exponential',
        delay: JOB_BACKOFF.REPORT_GENERATION,
      },
    });

    this.logger.log(`Report generation job added for type ${data.reportType}: ${job.id}`);
    return job;
  }

  /**
   * Synchronize data
   */
  async syncData(data: DataSyncJobData, priority: JobPriority = JobPriority.NORMAL) {
    const job = await this.dataSyncQueue.add('sync-data', data, {
      priority,
      attempts: JOB_ATTEMPTS.DATA_SYNC,
      backoff: {
        type: 'exponential',
        delay: JOB_BACKOFF.DATA_SYNC,
      },
    });

    this.logger.log(
      `Data sync job added from ${data.source} to ${data.destination}: ${job.id}`,
    );
    return job;
  }

  /**
   * Run cleanup task
   */
  async cleanup(data: CleanupJobData, priority: JobPriority = JobPriority.LOW) {
    const job = await this.cleanupQueue.add('cleanup', data, {
      priority,
      attempts: JOB_ATTEMPTS.CLEANUP,
      backoff: {
        type: 'exponential',
        delay: JOB_BACKOFF.CLEANUP,
      },
    });

    this.logger.log(`Cleanup job added for type ${data.cleanupType}: ${job.id}`);
    return job;
  }

  /**
   * Add a delayed job
   */
  async addDelayedJob(
    queueName: QueueName,
    jobName: string,
    data: any,
    delay: number,
    priority: JobPriority = JobPriority.NORMAL,
  ) {
    const queue = this.getQueue(queueName);
    const job = await queue.add(jobName, data, {
      delay,
      priority,
      attempts: this.getAttemptsForQueue(queueName),
      backoff: {
        type: 'exponential',
        delay: this.getBackoffForQueue(queueName),
      },
    });

    this.logger.log(
      `Delayed job added to ${queueName} (delay: ${delay}ms): ${job.id}`,
    );
    return job;
  }

  /**
   * Get job by ID
   */
  async getJob(queueName: QueueName, jobId: string) {
    const queue = this.getQueue(queueName);
    return queue.getJob(jobId);
  }

  /**
   * Remove a job
   */
  async removeJob(queueName: QueueName, jobId: string) {
    const job = await this.getJob(queueName, jobId);
    if (job) {
      await job.remove();
      this.logger.log(`Job ${jobId} removed from ${queueName}`);
    }
  }

  /**
   * Retry a failed job
   */
  async retryJob(queueName: QueueName, jobId: string) {
    const job = await this.getJob(queueName, jobId);
    if (job) {
      await job.retry();
      this.logger.log(`Job ${jobId} in ${queueName} queued for retry`);
    }
  }

  /**
   * Get queue by name
   */
  private getQueue(queueName: QueueName): Queue {
    switch (queueName) {
      case QueueName.EMAIL:
        return this.emailQueue;
      case QueueName.AGENT_EXECUTION:
        return this.agentQueue;
      case QueueName.REPORT_GENERATION:
        return this.reportQueue;
      case QueueName.DATA_SYNC:
        return this.dataSyncQueue;
      case QueueName.CLEANUP:
        return this.cleanupQueue;
      default:
        throw new Error(`Unknown queue: ${queueName}`);
    }
  }

  /**
   * Get attempts for queue
   */
  private getAttemptsForQueue(queueName: QueueName): number {
    const key = queueName.toUpperCase().replace('-', '_') as keyof typeof JOB_ATTEMPTS;
    return JOB_ATTEMPTS[key] || 3;
  }

  /**
   * Get backoff for queue
   */
  private getBackoffForQueue(queueName: QueueName): number {
    const key = queueName.toUpperCase().replace('-', '_') as keyof typeof JOB_BACKOFF;
    return JOB_BACKOFF[key] || 5000;
  }
}
