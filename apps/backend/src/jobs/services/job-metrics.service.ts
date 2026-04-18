import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { JobCounts, Queue } from 'bull';
import { QueueName } from '../constants/queue-names.js';

/**
 * Job metrics tracking interface
 */
export interface QueueMetrics {
  queueName: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
  total: number;
}

/**
 * Job statistics interface
 */
export interface JobStatistics {
  queues: QueueMetrics[];
  overall: {
    totalJobs: number;
    activeJobs: number;
    completedJobs: number;
    failedJobs: number;
    successRate: number;
  };
  timestamp: string;
}

/**
 * Job metrics service
 * Tracks and reports metrics for all job queues
 */
@Injectable()
export class JobMetricsService {
  private readonly logger = new Logger(JobMetricsService.name);

  constructor(
    @InjectQueue(QueueName.EMAIL) private emailQueue: Queue,
    @InjectQueue(QueueName.AGENT_EXECUTION) private agentQueue: Queue,
    @InjectQueue(QueueName.REPORT_GENERATION) private reportQueue: Queue,
    @InjectQueue(QueueName.DATA_SYNC) private dataSyncQueue: Queue,
    @InjectQueue(QueueName.CLEANUP) private cleanupQueue: Queue
  ) {}

  /**
   * Get metrics for a specific queue
   */
  async getQueueMetrics(queueName: QueueName): Promise<QueueMetrics> {
    const queue = this.getQueue(queueName);
    const counts = await queue.getJobCounts();
    const paused = 'paused' in counts ? (counts as JobCounts & { paused?: number }).paused || 0 : 0;

    return {
      queueName,
      waiting: counts.waiting || 0,
      active: counts.active || 0,
      completed: counts.completed || 0,
      failed: counts.failed || 0,
      delayed: counts.delayed || 0,
      paused,
      total:
        (counts.waiting || 0) +
        (counts.active || 0) +
        (counts.completed || 0) +
        (counts.failed || 0) +
        (counts.delayed || 0),
    };
  }

  /**
   * Get metrics for all queues
   */
  async getAllQueueMetrics(): Promise<QueueMetrics[]> {
    const queues = [
      QueueName.EMAIL,
      QueueName.AGENT_EXECUTION,
      QueueName.REPORT_GENERATION,
      QueueName.DATA_SYNC,
      QueueName.CLEANUP,
    ];

    const metrics = await Promise.all(queues.map((queueName) => this.getQueueMetrics(queueName)));

    return metrics;
  }

  /**
   * Get overall job statistics
   */
  async getJobStatistics(): Promise<JobStatistics> {
    const queueMetrics = await this.getAllQueueMetrics();

    const overall = queueMetrics.reduce(
      (acc, metrics) => ({
        totalJobs: acc.totalJobs + metrics.total,
        activeJobs: acc.activeJobs + metrics.active,
        completedJobs: acc.completedJobs + metrics.completed,
        failedJobs: acc.failedJobs + metrics.failed,
        successRate: 0, // Will calculate below
      }),
      {
        totalJobs: 0,
        activeJobs: 0,
        completedJobs: 0,
        failedJobs: 0,
        successRate: 0,
      }
    );

    // Calculate success rate
    const totalProcessed = overall.completedJobs + overall.failedJobs;
    overall.successRate = totalProcessed > 0 ? (overall.completedJobs / totalProcessed) * 100 : 0;

    return {
      queues: queueMetrics,
      overall,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get failed jobs for a queue
   */
  async getFailedJobs(queueName: QueueName, limit = 10) {
    const queue = this.getQueue(queueName);
    const failedJobs = await queue.getFailed(0, limit - 1);

    return failedJobs.map((job) => ({
      id: job.id,
      name: job.name,
      data: job.data,
      failedReason: job.failedReason,
      stacktrace: job.stacktrace,
      attemptsMade: job.attemptsMade,
      timestamp: job.timestamp,
    }));
  }

  /**
   * Get active jobs for a queue
   */
  async getActiveJobs(queueName: QueueName, limit = 10) {
    const queue = this.getQueue(queueName);
    const activeJobs = await queue.getActive(0, limit - 1);

    return activeJobs.map((job) => ({
      id: job.id,
      name: job.name,
      data: job.data,
      progress: job.progress(),
      timestamp: job.timestamp,
    }));
  }

  /**
   * Get completed jobs for a queue
   */
  async getCompletedJobs(queueName: QueueName, limit = 10) {
    const queue = this.getQueue(queueName);
    const completedJobs = await queue.getCompleted(0, limit - 1);

    return completedJobs.map((job) => ({
      id: job.id,
      name: job.name,
      data: job.data,
      returnvalue: job.returnvalue,
      finishedOn: job.finishedOn,
      processedOn: job.processedOn,
    }));
  }

  /**
   * Pause a queue
   */
  async pauseQueue(queueName: QueueName): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.pause();
    this.logger.log(`Queue ${queueName} paused`);
  }

  /**
   * Resume a queue
   */
  async resumeQueue(queueName: QueueName): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.resume();
    this.logger.log(`Queue ${queueName} resumed`);
  }

  /**
   * Clean old jobs from a queue
   */
  async cleanQueue(
    queueName: QueueName,
    grace: number = 24 * 3600 * 1000,
    status: 'completed' | 'failed' = 'completed'
  ): Promise<number> {
    const queue = this.getQueue(queueName);
    const cleaned = await queue.clean(grace, status);
    this.logger.log(`Cleaned ${cleaned.length} ${status} jobs from ${queueName}`);
    return cleaned.length;
  }

  /**
   * Empty a queue (remove all jobs)
   */
  async emptyQueue(queueName: QueueName): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.empty();
    this.logger.warn(`Queue ${queueName} emptied`);
  }

  /**
   * Get queue health status
   */
  async getQueueHealth(queueName: QueueName): Promise<{
    healthy: boolean;
    issues: string[];
  }> {
    const metrics = await this.getQueueMetrics(queueName);
    const issues: string[] = [];

    // Check for high failure rate
    const totalProcessed = metrics.completed + metrics.failed;
    if (totalProcessed > 0) {
      const failureRate = (metrics.failed / totalProcessed) * 100;
      if (failureRate > 10) {
        issues.push(`High failure rate: ${failureRate.toFixed(2)}%`);
      }
    }

    // Check for stuck jobs
    if (metrics.active > 50) {
      issues.push(`High number of active jobs: ${metrics.active}`);
    }

    // Check for queue backlog
    if (metrics.waiting > 1000) {
      issues.push(`Large queue backlog: ${metrics.waiting} waiting jobs`);
    }

    return {
      healthy: issues.length === 0,
      issues,
    };
  }

  /**
   * Get queue instance by name
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
}
