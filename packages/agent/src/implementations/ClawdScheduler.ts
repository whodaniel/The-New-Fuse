import { EventEmitter } from 'events';

import Queue from 'bull';
import * as cron from 'node-cron';

import type { AgentExecutionJobData } from '@the-new-fuse/types';
import { JobPriority, JobQueueName } from '@the-new-fuse/types';

export interface SchedulerTask {
  id: string;
  cronExpression: string;
  handler: () => Promise<void>;
}

export interface ClawdSchedulerOptions {
  redisUrl?: string;
  nodeId?: string;
}

export class ClawdScheduler extends EventEmitter {
  private localTasks: Map<string, cron.ScheduledTask> = new Map();
  private executionQueue: Queue.Queue<AgentExecutionJobData> | null = null;
  private nodeId: string;

  constructor(options: ClawdSchedulerOptions = {}) {
    super();
    this.nodeId = options.nodeId || 'unknown-node';

    if (options.redisUrl) {
      try {
        this.executionQueue = new Queue<AgentExecutionJobData>(
          JobQueueName.AGENT_EXECUTION,
          options.redisUrl
        );
        // eslint-disable-next-line no-console
        console.log(
          '[ClawdScheduler] Connected to Distributed Queue:',
          JobQueueName.AGENT_EXECUTION
        );
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[ClawdScheduler] Failed to connect to Redis, using local mode only:', error);
      }
    }
  }

  /**
   * Schedule a skill execution
   * Supports both Distributed (Redis) and Local (Memory) modes
   */
  public async scheduleSkill(
    skillName: string,
    cronExpression: string,
    params: Record<string, any> = {},
    localHandler?: () => Promise<void>
  ) {
    const taskId = `${this.nodeId}-${skillName}-${cronExpression}`;

    // Validate cron expression
    if (!cron.validate(cronExpression)) {
      throw new Error(`Invalid cron expression for task ${taskId}: ${cronExpression}`);
    }

    if (this.executionQueue) {
      // Distributed Mode: Push to Bull
      // Note: Bull uses different cron syntax sometimes, but standard cron is usually supported.
      // We use 'repeat' option for recurring jobs.
      await this.executionQueue.add(
        'execute-agent',
        {
          agentId: this.nodeId,
          userId: 'system', // or from params
          task: skillName,
          parameters: { ...params, trigger: 'cron', expression: cronExpression },
          timestamp: Date.now(),
          metadata: { scheduler: 'clawd-distributed' },
        },
        {
          priority: JobPriority.NORMAL,
          repeat: { cron: cronExpression },
          jobId: taskId, // Ensure uniqueness/idempotency
          removeOnComplete: true, // Don't clog Redis
          removeOnFail: 100,
        }
      );
      this.emit('scheduled', { id: taskId, mode: 'distributed', expression: cronExpression });
    } else {
      // Local Mode: Use node-cron
      if (!localHandler) {
        throw new Error('Local handler required when Redis is not available');
      }
      this.scheduleLocal(taskId, cronExpression, localHandler);
    }
  }

  /**
   * Schedule a local-only task (legacy wrapper)
   */
  public scheduleLocal(id: string, expression: string, handler: () => Promise<void>) {
    // Stop existing if any
    this.unscheduleLocal(id);

    const task = cron.schedule(expression, async () => {
      try {
        await handler();
      } catch (error) {
        this.emit('error', { taskId: id, error });
      }
    });

    this.localTasks.set(id, task);
    this.emit('scheduled', { id, mode: 'local', expression });
  }

  /**
   * Remove a scheduled task
   */
  public async unschedule(id: string) {
    // Try remove local
    this.unscheduleLocal(id);

    // Try remove distributed
    if (this.executionQueue) {
      const jobs = await this.executionQueue.getRepeatableJobs();
      const job = jobs.find((j) => j.id === id);
      if (job) {
        await this.executionQueue.removeRepeatableByKey(job.key);
        this.emit('unscheduled', { id, mode: 'distributed' });
      }
    }
  }

  private unscheduleLocal(id: string) {
    const task = this.localTasks.get(id);
    if (task) {
      task.stop();
      this.localTasks.delete(id);
      this.emit('unscheduled', { id, mode: 'local' });
    }
  }

  /**
   * Stop all tasks
   */
  public async stopAll() {
    this.localTasks.forEach((t) => t.stop());
    this.localTasks.clear();

    if (this.executionQueue) {
      await this.executionQueue.close();
    }
  }
}
