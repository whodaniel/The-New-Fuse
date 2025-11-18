import { EventEmitter } from 'events';
import { PerformanceMetrics, Task, TaskStatus, AgentInfo } from '../core/types';

/**
 * Detailed metrics for a time period
 */
export interface DetailedMetrics {
  period: {
    start: Date;
    end: Date;
  };
  tasks: {
    total: number;
    completed: number;
    failed: number;
    pending: number;
    inProgress: number;
    cancelled: number;
  };
  performance: {
    successRate: number;
    failureRate: number;
    averageExecutionTime: number;
    minExecutionTime: number;
    maxExecutionTime: number;
    p50ExecutionTime: number;
    p95ExecutionTime: number;
    p99ExecutionTime: number;
  };
  throughput: {
    tasksPerSecond: number;
    tasksPerMinute: number;
    tasksPerHour: number;
  };
  agents: {
    total: number;
    active: number;
    idle: number;
    offline: number;
    averageLoad: number;
    utilizationRate: number;
  };
  queue: {
    depth: number;
    averageWaitTime: number;
  };
}

/**
 * Task execution record
 */
interface TaskExecution {
  taskId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: TaskStatus;
  agentId?: string;
}

/**
 * Metrics collector for monitoring coordination system
 */
export class MetricsCollector extends EventEmitter {
  private taskExecutions: Map<string, TaskExecution> = new Map();
  private completedExecutions: TaskExecution[] = [];
  private startTime: Date;
  private maxHistorySize: number;

  constructor(maxHistorySize: number = 10000) {
    super();
    this.startTime = new Date();
    this.maxHistorySize = maxHistorySize;
  }

  /**
   * Record task started
   */
  recordTaskStarted(task: Task, agentId?: string): void {
    const execution: TaskExecution = {
      taskId: task.id,
      startTime: new Date(),
      status: TaskStatus.IN_PROGRESS,
      agentId,
    };

    this.taskExecutions.set(task.id, execution);
    this.emit('metrics:task:started', execution);
  }

  /**
   * Record task completed
   */
  recordTaskCompleted(taskId: string): void {
    const execution = this.taskExecutions.get(taskId);
    if (!execution) return;

    execution.endTime = new Date();
    execution.duration =
      execution.endTime.getTime() - execution.startTime.getTime();
    execution.status = TaskStatus.COMPLETED;

    this.taskExecutions.delete(taskId);
    this.addToHistory(execution);

    this.emit('metrics:task:completed', execution);
  }

  /**
   * Record task failed
   */
  recordTaskFailed(taskId: string): void {
    const execution = this.taskExecutions.get(taskId);
    if (!execution) return;

    execution.endTime = new Date();
    execution.duration =
      execution.endTime.getTime() - execution.startTime.getTime();
    execution.status = TaskStatus.FAILED;

    this.taskExecutions.delete(taskId);
    this.addToHistory(execution);

    this.emit('metrics:task:failed', execution);
  }

  /**
   * Add execution to history (with size limit)
   */
  private addToHistory(execution: TaskExecution): void {
    this.completedExecutions.push(execution);

    // Trim history if it exceeds max size
    if (this.completedExecutions.length > this.maxHistorySize) {
      this.completedExecutions.shift();
    }
  }

  /**
   * Get current performance metrics
   */
  getCurrentMetrics(
    activeAgents: AgentInfo[],
    queueDepth: number
  ): PerformanceMetrics {
    const now = new Date();
    const totalTasks = this.completedExecutions.length;
    const successfulTasks = this.completedExecutions.filter(
      (e) => e.status === TaskStatus.COMPLETED
    ).length;

    const successRate = totalTasks > 0 ? successfulTasks / totalTasks : 0;

    const executionTimes = this.completedExecutions
      .filter((e) => e.duration !== undefined)
      .map((e) => e.duration!);

    const averageExecutionTime =
      executionTimes.length > 0
        ? executionTimes.reduce((sum, time) => sum + time, 0) /
          executionTimes.length
        : 0;

    // Calculate tasks per second (last minute)
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    const recentTasks = this.completedExecutions.filter(
      (e) => e.endTime && e.endTime >= oneMinuteAgo
    );
    const tasksPerSecond = recentTasks.length / 60;

    return {
      totalTasksProcessed: totalTasks,
      successRate,
      averageExecutionTime,
      tasksPerSecond,
      activeAgents: activeAgents.length,
      queueDepth,
      timestamp: now,
    };
  }

  /**
   * Get detailed metrics for a time period
   */
  getDetailedMetrics(
    startDate: Date,
    endDate: Date,
    agents: AgentInfo[]
  ): DetailedMetrics {
    const periodExecutions = this.completedExecutions.filter(
      (e) =>
        e.endTime &&
        e.endTime >= startDate &&
        e.endTime <= endDate
    );

    const completed = periodExecutions.filter(
      (e) => e.status === TaskStatus.COMPLETED
    ).length;
    const failed = periodExecutions.filter(
      (e) => e.status === TaskStatus.FAILED
    ).length;

    const executionTimes = periodExecutions
      .filter((e) => e.duration !== undefined)
      .map((e) => e.duration!)
      .sort((a, b) => a - b);

    const avgExecTime =
      executionTimes.length > 0
        ? executionTimes.reduce((sum, t) => sum + t, 0) / executionTimes.length
        : 0;

    const periodDuration =
      (endDate.getTime() - startDate.getTime()) / 1000; // seconds

    const totalLoad = agents.reduce((sum, agent) => sum + agent.currentLoad, 0);
    const totalCapacity = agents.reduce(
      (sum, agent) => sum + agent.maxConcurrentTasks,
      0
    );

    return {
      period: {
        start: startDate,
        end: endDate,
      },
      tasks: {
        total: periodExecutions.length,
        completed,
        failed,
        pending: 0, // Would need access to task queue
        inProgress: this.taskExecutions.size,
        cancelled: 0,
      },
      performance: {
        successRate: periodExecutions.length > 0 ? completed / periodExecutions.length : 0,
        failureRate: periodExecutions.length > 0 ? failed / periodExecutions.length : 0,
        averageExecutionTime: avgExecTime,
        minExecutionTime: executionTimes.length > 0 ? executionTimes[0] : 0,
        maxExecutionTime:
          executionTimes.length > 0
            ? executionTimes[executionTimes.length - 1]
            : 0,
        p50ExecutionTime: this.percentile(executionTimes, 0.5),
        p95ExecutionTime: this.percentile(executionTimes, 0.95),
        p99ExecutionTime: this.percentile(executionTimes, 0.99),
      },
      throughput: {
        tasksPerSecond: periodDuration > 0 ? periodExecutions.length / periodDuration : 0,
        tasksPerMinute: periodDuration > 0 ? (periodExecutions.length / periodDuration) * 60 : 0,
        tasksPerHour: periodDuration > 0 ? (periodExecutions.length / periodDuration) * 3600 : 0,
      },
      agents: {
        total: agents.length,
        active: agents.filter((a) => a.status === 'busy').length,
        idle: agents.filter((a) => a.status === 'idle').length,
        offline: agents.filter((a) => a.status === 'offline').length,
        averageLoad: agents.length > 0 ? totalLoad / agents.length : 0,
        utilizationRate: totalCapacity > 0 ? totalLoad / totalCapacity : 0,
      },
      queue: {
        depth: 0, // Would need access to task queue
        averageWaitTime: 0, // Would need to track wait times
      },
    };
  }

  /**
   * Calculate percentile of execution times
   */
  private percentile(sortedValues: number[], p: number): number {
    if (sortedValues.length === 0) return 0;

    const index = Math.ceil(sortedValues.length * p) - 1;
    return sortedValues[Math.max(0, index)];
  }

  /**
   * Get metrics by agent
   */
  getAgentMetrics(agentId: string): {
    tasksCompleted: number;
    tasksFailed: number;
    averageExecutionTime: number;
    successRate: number;
  } {
    const agentExecutions = this.completedExecutions.filter(
      (e) => e.agentId === agentId
    );

    const completed = agentExecutions.filter(
      (e) => e.status === TaskStatus.COMPLETED
    ).length;
    const failed = agentExecutions.filter(
      (e) => e.status === TaskStatus.FAILED
    ).length;

    const executionTimes = agentExecutions
      .filter((e) => e.duration !== undefined)
      .map((e) => e.duration!);

    const avgExecTime =
      executionTimes.length > 0
        ? executionTimes.reduce((sum, t) => sum + t, 0) / executionTimes.length
        : 0;

    return {
      tasksCompleted: completed,
      tasksFailed: failed,
      averageExecutionTime: avgExecTime,
      successRate: agentExecutions.length > 0 ? completed / agentExecutions.length : 0,
    };
  }

  /**
   * Get metrics summary
   */
  getSummary(): {
    uptime: number;
    totalTasksProcessed: number;
    currentlyProcessing: number;
    overallSuccessRate: number;
  } {
    const now = new Date();
    const uptime = now.getTime() - this.startTime.getTime();

    const completed = this.completedExecutions.filter(
      (e) => e.status === TaskStatus.COMPLETED
    ).length;

    return {
      uptime,
      totalTasksProcessed: this.completedExecutions.length,
      currentlyProcessing: this.taskExecutions.size,
      overallSuccessRate:
        this.completedExecutions.length > 0
          ? completed / this.completedExecutions.length
          : 0,
    };
  }

  /**
   * Export metrics to JSON
   */
  exportMetrics(): {
    startTime: Date;
    completedExecutions: TaskExecution[];
    activeExecutions: TaskExecution[];
    summary: any;
  } {
    return {
      startTime: this.startTime,
      completedExecutions: this.completedExecutions,
      activeExecutions: Array.from(this.taskExecutions.values()),
      summary: this.getSummary(),
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.taskExecutions.clear();
    this.completedExecutions = [];
    this.startTime = new Date();
    this.emit('metrics:cleared');
  }

  /**
   * Get recent execution history
   */
  getRecentHistory(count: number = 100): TaskExecution[] {
    return this.completedExecutions.slice(-count);
  }
}
