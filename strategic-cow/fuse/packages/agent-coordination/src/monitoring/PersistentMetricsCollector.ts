import { Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { AgentTask, TaskStatus } from '../types/coordination.types';

export interface AgentMetrics {
  tasksCompleted: number;
  tasksFailed: number;
  averageExecutionTime: number;
  successRate: number;
  lastActive: number;
}

export interface SystemMetrics {
  totalTasksCreated: number;
  totalTasksCompleted: number;
  totalTasksFailed: number;
  activeAgents: number;
  averageExecutionTime: number;
  tasksPerMinute: number;
}

export class PersistentMetricsCollector {
  private readonly logger = new Logger(PersistentMetricsCollector.name);
  private readonly keyPrefix: string;

  constructor(
    private readonly redis: Redis,
    keyPrefix: string = 'agent-coord:metrics:'
  ) {
    this.keyPrefix = keyPrefix;
  }

  /**
   * Record task creation
   */
  async recordTaskCreated(task: AgentTask): Promise<void> {
    const pipe = this.redis.pipeline();
    const timestamp = Date.now();

    // Increment total tasks created
    pipe.incr(`${this.keyPrefix}tasks:created`);

    // Add to recent tasks list (keep last 1000)
    const taskData = JSON.stringify({
      id: task.id,
      type: task.type,
      priority: task.priority,
      timestamp,
      status: 'created'
    });
    pipe.lpush(`${this.keyPrefix}tasks:recent`, taskData);
    pipe.ltrim(`${this.keyPrefix}tasks:recent`, 0, 999);

    // Record throughput (tasks per minute bucket)
    const minuteBucket = Math.floor(timestamp / 60000);
    pipe.incr(`${this.keyPrefix}throughput:${minuteBucket}`);
    pipe.expire(`${this.keyPrefix}throughput:${minuteBucket}`, 3600); // Keep for 1 hour

    await pipe.exec();
  }

  /**
   * Record task completion
   */
  async recordTaskCompleted(task: AgentTask, duration: number): Promise<void> {
    const pipe = this.redis.pipeline();
    const timestamp = Date.now();

    // Increment total tasks completed
    pipe.incr(`${this.keyPrefix}tasks:completed`);

    // Update agent metrics if assigned
    if (task.assignedTo) {
      const agentKey = `${this.keyPrefix}agent:${task.assignedTo}`;
      pipe.hincrby(agentKey, 'completed', 1);

      // Update running average execution time for agent
      // We store total time and count to calculate average on read or update incrementally
      pipe.hincrby(agentKey, 'totalTime', Math.round(duration));
      pipe.hset(agentKey, 'lastActive', timestamp);
    }

    // Update global average execution time
    pipe.incr(`${this.keyPrefix}execution:count`);
    pipe.incrby(`${this.keyPrefix}execution:totalTime`, Math.round(duration));

    await pipe.exec();
  }

  /**
   * Record task failure
   */
  async recordTaskFailed(task: AgentTask, error: string): Promise<void> {
    const pipe = this.redis.pipeline();
    const timestamp = Date.now();

    // Increment total tasks failed
    pipe.incr(`${this.keyPrefix}tasks:failed`);

    // Update agent metrics if assigned
    if (task.assignedTo) {
      const agentKey = `${this.keyPrefix}agent:${task.assignedTo}`;
      pipe.hincrby(agentKey, 'failed', 1);
      pipe.hset(agentKey, 'lastActive', timestamp);
    }

    await pipe.exec();
  }

  /**
   * Get system-wide metrics
   */
  async getSystemMetrics(): Promise<SystemMetrics> {
    const [
      created,
      completed,
      failed,
      execCount,
      execTotalTime
    ] = await Promise.all([
      this.redis.get(`${this.keyPrefix}tasks:created`),
      this.redis.get(`${this.keyPrefix}tasks:completed`),
      this.redis.get(`${this.keyPrefix}tasks:failed`),
      this.redis.get(`${this.keyPrefix}execution:count`),
      this.redis.get(`${this.keyPrefix}execution:totalTime`)
    ]);

    // Calculate tasks per minute (last 5 minutes average)
    const currentMinute = Math.floor(Date.now() / 60000);
    const tpmKeys = [];
    for (let i = 0; i < 5; i++) {
      tpmKeys.push(`${this.keyPrefix}throughput:${currentMinute - i}`);
    }

    const tpmValues = await this.redis.mget(...tpmKeys);
    const totalTpm = tpmValues.reduce((sum, val) => sum + (parseInt(val || '0', 10)), 0);
    const avgTpm = totalTpm / 5;

    // Get active agents count (scan for agent keys updated recently)
    // This is an approximation or could be fetched from PresenceTracker
    const activeAgents = 0; // We will rely on PresenceTracker for this value in the coordinator

    const totalExecCount = parseInt(execCount || '0', 10);
    const totalExecTime = parseInt(execTotalTime || '0', 10);
    const avgExecTime = totalExecCount > 0 ? totalExecTime / totalExecCount : 0;

    return {
      totalTasksCreated: parseInt(created || '0', 10),
      totalTasksCompleted: parseInt(completed || '0', 10),
      totalTasksFailed: parseInt(failed || '0', 10),
      activeAgents, // Placeholder, should be filled by coordinator
      averageExecutionTime: avgExecTime,
      tasksPerMinute: avgTpm
    };
  }

  /**
   * Get metrics for a specific agent
   */
  async getAgentMetrics(agentId: string): Promise<AgentMetrics | null> {
    const key = `${this.keyPrefix}agent:${agentId}`;
    const data = await this.redis.hgetall(key);

    if (!data || Object.keys(data).length === 0) {
      return null;
    }

    const completed = parseInt(data.completed || '0', 10);
    const failed = parseInt(data.failed || '0', 10);
    const totalTime = parseInt(data.totalTime || '0', 10);
    const lastActive = parseInt(data.lastActive || '0', 10);

    const total = completed + failed;
    const successRate = total > 0 ? completed / total : 0;
    const avgTime = completed > 0 ? totalTime / completed : 0;

    return {
      tasksCompleted: completed,
      tasksFailed: failed,
      averageExecutionTime: avgTime,
      successRate,
      lastActive
    };
  }

  /**
   * Reset all metrics
   */
  async clearMetrics(): Promise<void> {
    const keys = await this.redis.keys(`${this.keyPrefix}*`);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
