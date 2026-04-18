import { EventEmitter } from 'events';

import type { AgentPool } from '../core/AgentPool';
import type { TaskQueue } from '../core/TaskQueue';
import type { AgentInfo, Task } from '../core/types';
import type { Coordinator } from '../orchestration/Coordinator';
import type { MetricsCollector } from './MetricsCollector';

/**
 * Agent activity event
 */
export interface ActivityEvent {
  type: 'task' | 'agent' | 'system';
  action: string;
  timestamp: Date;
  data: any;
  severity?: 'info' | 'warning' | 'error' | 'critical';
}

/**
 * System health status
 */
export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'critical' | 'offline';
  coordinator: 'running' | 'stopped' | 'error';
  agentPool: {
    total: number;
    healthy: number;
    unhealthy: number;
  };
  taskQueue: {
    depth: number;
    processing: number;
    backlog: number;
  };
  performance: {
    successRate: number;
    throughput: number;
    averageLatency: number;
  };
  alerts: string[];
  timestamp: Date;
}

/**
 * Activity monitor for real-time coordination tracking
 */
export class ActivityMonitor extends EventEmitter {
  private coordinator: Coordinator;
  private agentPool: AgentPool;
  private taskQueue: TaskQueue;
  private metricsCollector: MetricsCollector;
  private activityLog: ActivityEvent[] = [];
  private maxLogSize: number;
  private monitoringInterval?: NodeJS.Timeout;
  private isMonitoring: boolean = false;
  private alerts: Map<string, Date> = new Map();

  constructor(
    coordinator: Coordinator,
    agentPool: AgentPool,
    taskQueue: TaskQueue,
    metricsCollector: MetricsCollector,
    maxLogSize: number = 1000
  ) {
    super();
    this.coordinator = coordinator;
    this.agentPool = agentPool;
    this.taskQueue = taskQueue;
    this.metricsCollector = metricsCollector;
    this.maxLogSize = maxLogSize;

    this.setupEventListeners();
  }

  /**
   * Setup event listeners for activity tracking
   */
  private setupEventListeners(): void {
    // Coordinator events
    this.coordinator.on('task:submitted', (task: Task) => {
      this.logActivity({
        type: 'task',
        action: 'submitted',
        timestamp: new Date(),
        data: { taskId: task.id, type: task.type, priority: task.priority },
      });
    });

    this.coordinator.on('task:assigned', (task: Task, assignment: any) => {
      this.logActivity({
        type: 'task',
        action: 'assigned',
        timestamp: new Date(),
        data: {
          taskId: task.id,
          agentId: assignment.agentId,
        },
      });
    });

    this.coordinator.on('task:completed', (task: Task) => {
      this.logActivity({
        type: 'task',
        action: 'completed',
        timestamp: new Date(),
        data: { 
          taskId: task.id, 
          duration: (task.completedAt && task.startedAt) 
            ? task.completedAt.getTime() - task.startedAt.getTime() 
            : 0
        },
      });
    });

    this.coordinator.on('task:failed', (task: Task, error: Error) => {
      this.logActivity({
        type: 'task',
        action: 'failed',
        timestamp: new Date(),
        data: { taskId: task.id, error: error.message },
        severity: 'error',
      });
    });

    // Agent pool events
    this.agentPool.on('agent:registered', (agent: AgentInfo) => {
      this.logActivity({
        type: 'agent',
        action: 'registered',
        timestamp: new Date(),
        data: { agentId: agent.id, name: agent.name, capabilities: agent.capabilities },
      });
    });

    this.agentPool.on('agent:unregistered', (agent: AgentInfo) => {
      this.logActivity({
        type: 'agent',
        action: 'unregistered',
        timestamp: new Date(),
        data: { agentId: agent.id, name: agent.name },
        severity: 'warning',
      });
    });

    this.agentPool.on('agent:heartbeat:timeout', (agent: AgentInfo) => {
      this.logActivity({
        type: 'agent',
        action: 'heartbeat-timeout',
        timestamp: new Date(),
        data: { agentId: agent.id, name: agent.name },
        severity: 'error',
      });

      this.raiseAlert(`Agent ${agent.id} heartbeat timeout`);
    });

    // System events
    this.coordinator.on('coordinator:started', () => {
      this.logActivity({
        type: 'system',
        action: 'coordinator-started',
        timestamp: new Date(),
        data: {},
      });
    });

    this.coordinator.on('coordinator:stopped', () => {
      this.logActivity({
        type: 'system',
        action: 'coordinator-stopped',
        timestamp: new Date(),
        data: {},
        severity: 'warning',
      });
    });
  }

  /**
   * Start monitoring
   */
  start(intervalMs: number = 5000): void {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;

    this.monitoringInterval = setInterval(() => {
      void this.checkSystemHealth().catch((error) => {
        console.error('System health check failed:', error);
      });
    }, intervalMs);

    this.emit('monitoring:started');
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    this.emit('monitoring:stopped');
  }

  /**
   * Log activity event
   */
  private logActivity(event: ActivityEvent): void {
    this.activityLog.push(event);

    // Trim log if it exceeds max size
    if (this.activityLog.length > this.maxLogSize) {
      this.activityLog.shift();
    }

    this.emit('activity:logged', event);

    // Emit specific event types
    if (event.severity === 'error' || event.severity === 'critical') {
      this.emit('activity:error', event);
    }
  }

  /**
   * Check system health
   */
  private async checkSystemHealth(): Promise<void> {
    const health = await this.getSystemHealth();

    this.emit('health:checked', health);

    // Raise alerts for degraded or critical states
    if (health.status === 'degraded') {
      this.raiseAlert('System health degraded');
    } else if (health.status === 'critical') {
      this.raiseAlert('System health critical', 'critical');
    }
  }

  /**
   * Get current system health
   */
  async getSystemHealth(): Promise<SystemHealth> {
    const agents = this.agentPool.getAllAgents();
    const poolStats = this.agentPool.getStatistics();
    const queueStats = await this.taskQueue.getStatistics();
    const metrics = this.metricsCollector.getCurrentMetrics(
      agents,
      await this.taskQueue.getQueueDepth()
    );

    const totalQueued = queueStats.reduce((sum, stat) => sum + stat.waiting, 0);
    const totalActive = queueStats.reduce((sum, stat) => sum + stat.active, 0);

    // Determine health status
    let status: SystemHealth['status'] = 'healthy';

    if (poolStats.offlineAgents > poolStats.totalAgents * 0.5) {
      status = 'critical'; // More than 50% agents offline
    } else if (metrics.successRate < 0.7) {
      status = 'degraded'; // Success rate below 70%
    } else if (totalQueued > 1000) {
      status = 'degraded'; // Large backlog
    } else if (poolStats.offlineAgents > 0) {
      status = 'degraded'; // Some agents offline
    }

    const alerts = Array.from(this.alerts.keys());

    return {
      status,
      coordinator: this.isMonitoring ? 'running' : 'stopped',
      agentPool: {
        total: poolStats.totalAgents,
        healthy: poolStats.idleAgents + poolStats.busyAgents,
        unhealthy: poolStats.offlineAgents,
      },
      taskQueue: {
        depth: totalQueued,
        processing: totalActive,
        backlog: totalQueued > 100 ? totalQueued - 100 : 0,
      },
      performance: {
        successRate: metrics.successRate,
        throughput: metrics.tasksPerSecond,
        averageLatency: metrics.averageExecutionTime,
      },
      alerts,
      timestamp: new Date(),
    };
  }

  /**
   * Raise an alert
   */
  private raiseAlert(message: string, severity: 'warning' | 'critical' = 'warning'): void {
    this.alerts.set(message, new Date());

    this.logActivity({
      type: 'system',
      action: 'alert',
      timestamp: new Date(),
      data: { message, severity },
      severity,
    });

    this.emit('alert:raised', { message, severity });
  }

  /**
   * Clear an alert
   */
  clearAlert(message: string): void {
    this.alerts.delete(message);
    this.emit('alert:cleared', message);
  }

  /**
   * Clear all alerts
   */
  clearAllAlerts(): void {
    this.alerts.clear();
    this.emit('alerts:cleared');
  }

  /**
   * Get recent activity
   */
  getRecentActivity(count: number = 50): ActivityEvent[] {
    return this.activityLog.slice(-count);
  }

  /**
   * Get activity by type
   */
  getActivityByType(type: ActivityEvent['type'], count: number = 50): ActivityEvent[] {
    return this.activityLog.filter((event) => event.type === type).slice(-count);
  }

  /**
   * Get activity by severity
   */
  getActivityBySeverity(severity: ActivityEvent['severity'], count: number = 50): ActivityEvent[] {
    return this.activityLog.filter((event) => event.severity === severity).slice(-count);
  }

  /**
   * Get activity in time range
   */
  getActivityInRange(startDate: Date, endDate: Date): ActivityEvent[] {
    return this.activityLog.filter(
      (event) => event.timestamp >= startDate && event.timestamp <= endDate
    );
  }

  /**
   * Get all alerts
   */
  getActiveAlerts(): Array<{ message: string; timestamp: Date }> {
    return Array.from(this.alerts.entries()).map(([message, timestamp]) => ({
      message,
      timestamp,
    }));
  }

  /**
   * Get dashboard data
   */
  async getDashboardData(): Promise<{
    health: SystemHealth;
    recentActivity: ActivityEvent[];
    metrics: any;
    alerts: Array<{ message: string; timestamp: Date }>;
  }> {
    const health = await this.getSystemHealth();
    const recentActivity = this.getRecentActivity(20);
    const agents = this.agentPool.getAllAgents();
    const queueDepth = await this.taskQueue.getQueueDepth();
    const metrics = this.metricsCollector.getCurrentMetrics(agents, queueDepth);
    const alerts = this.getActiveAlerts();

    return {
      health,
      recentActivity,
      metrics,
      alerts,
    };
  }

  /**
   * Export activity log
   */
  exportActivityLog(): ActivityEvent[] {
    return [...this.activityLog];
  }

  /**
   * Clear activity log
   */
  clearActivityLog(): void {
    this.activityLog = [];
    this.emit('activity:log:cleared');
  }
}
