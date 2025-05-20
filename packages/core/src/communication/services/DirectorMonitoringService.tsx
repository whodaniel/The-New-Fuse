import { Injectable } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service.js';
import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

interface TaskAssignment {
  taskId: string;
  assignedTo: string;
  assignedBy: string;
  taskType: string;
  status: 'assigned' | 'started' | 'completed' | 'failed';
  timestamp: string;
  duration?: number;
}

interface DirectorMetrics {
  activeDirectors: string[];
  taskDistribution: Record<string, number>;
  workerUtilization: Record<string, number>;
  avgTaskCompletionTime: number;
  taskSuccessRate: Record<string, number>;
  delegationPatterns: Record<string, number>;
}

@Injectable()
export class DirectorMonitoringService {
  private readonly logger = new Logger(DirectorMonitoringService.name);
  private readonly DIRECTOR_KEY = 'ai:director:metrics';
  private readonly TASK_KEY = 'ai:director:tasks';
  private readonly WORKER_KEY = 'ai:director:workers';

  constructor(
    private readonly redisService: RedisService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  async recordTaskAssignment(assignment: TaskAssignment) {
    try {
      // Store task assignment
      await this.redisService.hset(
        `${this.TASK_KEY}:${assignment.taskId}`,
        assignment
      );

      // Update worker metrics
      await this.updateWorkerMetrics(assignment);

      // Update director metrics
      await this.updateDirectorMetrics(assignment);

      // Analyze delegation patterns
      await this.analyzeDelegationPatterns(assignment);

      // Emit monitoring event
      this.eventEmitter.emit('director.task_assigned', assignment);
    } catch (error) {
      this.logger.error('Failed to record task assignment:', error);
      throw error;
    }
  }

  async updateTaskStatus(taskId: string, status: TaskAssignment['status'], duration?: number) {
    const task = await this.redisService.hgetall(`${this.TASK_KEY}:${taskId}`);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    await this.redisService.hset(`${this.TASK_KEY}:${taskId}`, {
      ...task,
      status,
      duration
    });

    // Update success rates
    if (status === 'completed' || status === 'failed') {
      await this.updateSuccessRates(task.assignedBy, task.assignedTo, status);
    }

    this.eventEmitter.emit('director.task_updated', {
      taskId,
      status,
      duration,
      task
    });
  }

  private async updateWorkerMetrics(assignment: TaskAssignment) {
    const workerKey = `${this.WORKER_KEY}:${assignment.assignedTo}`;

    // Update task count
    await this.redisService.hincrby(workerKey, 'total_tasks', 1);
    await this.redisService.hincrby(workerKey, `type:${assignment.taskType}`, 1);

    // Track current load
    await this.redisService.sadd(
      `${this.WORKER_KEY}:active`,
      assignment.assignedTo
    );
  }

  private async updateDirectorMetrics(assignment: TaskAssignment) {
    const directorKey = `${this.DIRECTOR_KEY}:${assignment.assignedBy}`;

    // Update assignment count
    await this.redisService.hincrby(directorKey, 'total_assignments', 1);
    await this.redisService.hincrby(directorKey, `type:${assignment.taskType}`, 1);

    // Track active directors
    await this.redisService.sadd(
      `${this.DIRECTOR_KEY}:active`,
      assignment.assignedBy
    );
  }

  private async updateSuccessRates(directorId: string, workerId: string, status: string) {
    const isSuccess = status === 'completed';
    
    // Update director success rate
    const directorKey = `${this.DIRECTOR_KEY}:${directorId}`;
    await this.redisService.hincrby(directorKey, 'total_completed', 1);
    if (isSuccess) {
      await this.redisService.hincrby(directorKey, 'successful', 1);
    }

    // Update worker success rate
    const workerKey = `${this.WORKER_KEY}:${workerId}`;
    await this.redisService.hincrby(workerKey, 'total_completed', 1);
    if (isSuccess) {
      await this.redisService.hincrby(workerKey, 'successful', 1);
    }
  }

  private async analyzeDelegationPatterns(assignment: TaskAssignment) {
    // Track director-worker pairs
    const pairKey = `${this.DIRECTOR_KEY}:pairs`;
    const pair = `${assignment.assignedBy}:${assignment.assignedTo}`;
    await this.redisService.hincrby(pairKey, pair, 1);

    // Analyze load balancing
    const workerLoad = await this.getWorkerLoad(assignment.assignedTo);
    if (workerLoad > 10) { // Threshold for high load
      this.eventEmitter.emit('director.high_worker_load', {
        workerId: assignment.assignedTo,
        load: workerLoad
      });
    }

    // Check for potential bottlenecks
    const delegationPatterns = await this.getDelegationPatterns();
    const bottlenecks = this.identifyBottlenecks(delegationPatterns);
    if (bottlenecks.length > 0) {
      this.eventEmitter.emit('director.bottleneck_detected', {
        bottlenecks
      });
    }
  }

  private async getWorkerLoad(workerId: string): Promise<number> {
    const tasks = await this.redisService.hget(
      `${this.WORKER_KEY}:${workerId}`,
      'total_tasks'
    );
    return parseInt(tasks || '0');
  }

  private async getDelegationPatterns(): Promise<Record<string, number>> {
    const pairs = await this.redisService.hgetall(`${this.DIRECTOR_KEY}:pairs`);
    return Object.entries(pairs).reduce((acc, [pair, count]) => ({
      ...acc,
      [pair]: parseInt(count)
    }), {});
  }

  private identifyBottlenecks(patterns: Record<string, number>): string[] {
    const workerLoads: Record<string, number> = {};
    
    // Calculate total load per worker
    Object.entries(patterns).forEach(([pair, count]) => {
      const [, workerId] = pair.split(':');
      workerLoads[workerId] = (workerLoads[workerId] || 0) + count;
    });

    // Identify overloaded workers (>25% of total tasks)
    const totalTasks = Object.values(workerLoads).reduce((a, b) => a + b, 0);
    const threshold = totalTasks * 0.25;

    return Object.entries(workerLoads)
      .filter(([, load]) => load > threshold)
      .map(([workerId]) => workerId);
  }

  async getMetrics(): Promise<DirectorMetrics> {
    const [
      activeDirectors,
      taskDistribution,
      workerUtilization,
      avgTaskCompletionTime,
      taskSuccessRate,
      delegationPatterns
    ] = await Promise.all([
      this.getActiveDirectors(),
      this.getTaskDistribution(),
      this.getWorkerUtilization(),
      this.calculateAvgTaskCompletionTime(),
      this.getTaskSuccessRates(),
      this.getDelegationPatterns()
    ]);

    return {
      activeDirectors,
      taskDistribution,
      workerUtilization,
      avgTaskCompletionTime,
      taskSuccessRate,
      delegationPatterns
    };
  }

  private async getActiveDirectors(): Promise<string[]> {
    return this.redisService.smembers(`${this.DIRECTOR_KEY}:active`);
  }

  private async getTaskDistribution(): Promise<Record<string, number>> {
    const distribution: Record<string, number> = {};
    const directors = await this.getActiveDirectors();

    for (const director of directors) {
      const tasks = await this.redisService.hgetall(
        `${this.DIRECTOR_KEY}:${director}`
      );
      Object.entries(tasks)
        .filter(([k]) => k.startsWith('type:'))
        .forEach(([type, count]) => {
          const taskType = type.replace('type:', '');
          distribution[taskType] = (distribution[taskType] || 0) + parseInt(count);
        });
    }

    return distribution;
  }

  private async getWorkerUtilization(): Promise<Record<string, number>> {
    const workers = await this.redisService.smembers(`${this.WORKER_KEY}:active`);
    const utilization: Record<string, number> = {};

    for (const worker of workers) {
      const load = await this.getWorkerLoad(worker);
      utilization[worker] = load;
    }

    return utilization;
  }

  private async calculateAvgTaskCompletionTime(): Promise<number> {
    const tasks = await this.redisService.keys(`${this.TASK_KEY}:*`);
    let totalTime = 0;
    let completedTasks = 0;

    for (const taskKey of tasks) {
      const task = await this.redisService.hgetall(taskKey);
      if (task.status === 'completed' && task.duration) {
        totalTime += parseInt(task.duration);
        completedTasks++;
      }
    }

    return completedTasks ? totalTime / completedTasks : 0;
  }

  private async getTaskSuccessRates(): Promise<Record<string, number>> {
    const directors = await this.getActiveDirectors();
    const rates: Record<string, number> = {};

    for (const director of directors) {
      const metrics = await this.redisService.hgetall(
        `${this.DIRECTOR_KEY}:${director}`
      );
      
      const total = parseInt(metrics.total_completed || '0');
      const successful = parseInt(metrics.successful || '0');
      
      rates[director] = total ? successful / total : 1;
    }

    return rates;
  }

  async cleanup(olderThan: number = 30 * 24 * 60 * 60 * 1000) { // 30 days
    const cutoff = Date.now() - olderThan;
    
    const tasks = await this.redisService.keys(`${this.TASK_KEY}:*`);
    for (const taskKey of tasks) {
      const task = await this.redisService.hgetall(taskKey);
      if (new Date(task.timestamp).getTime() < cutoff) {
        await this.redisService.del(taskKey);
      }
    }

    // Reset metrics for inactive directors/workers
    const activeDirectors = await this.getActiveDirectors();
    for (const director of activeDirectors) {
      const lastActive = await this.redisService.hget(
        `${this.DIRECTOR_KEY}:${director}`,
        'last_active'
      );
      
      if (parseInt(lastActive || '0') < cutoff) {
        await this.redisService.srem(`${this.DIRECTOR_KEY}:active`, director);
      }
    }
  }
}