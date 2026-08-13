/**
 * System Bridge - System-level communication and monitoring
 *
 * Provides bridge functionality for system-level operations:
 * - Process management
 * - System metrics collection
 * - Resource monitoring
 * - Health checks
 * - Environment management
 */

import { BaseBridge, MessageType, Priority } from './index.js';

// ============================================================
// SYSTEM TYPES
// ============================================================

export interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  uptime: number;
  loadAverage: number[];
  processCount: number;
}

export interface ProcessInfo {
  pid: number;
  name: string;
  memory: number;
  cpu: number;
  status: 'running' | 'sleeping' | 'stopped' | 'zombie';
  startTime: Date;
}

export interface HealthCheck {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency?: number;
  message?: string;
  lastCheck: Date;
}

export interface SystemEvent {
  type: 'startup' | 'shutdown' | 'warning' | 'error' | 'info';
  source: string;
  message: string;
  timestamp: Date;
  data?: Record<string, unknown>;
}

// ============================================================
// SYSTEM BRIDGE
// ============================================================

export class SystemBridge extends BaseBridge {
  private healthChecks: Map<string, () => Promise<HealthCheck>> = new Map();
  private metricsInterval: ReturnType<typeof setInterval> | null = null;
  private eventLog: SystemEvent[] = [];
  private maxEventLogSize = 1000;
  private metricsCollectionInterval = 10000;

  constructor() {
    super('system-bridge');
    this.registerDefaultHealthChecks();
  }

  async connect(): Promise<void> {
    this.emit('connecting');

    // Start metrics collection
    this.startMetricsCollection();

    // Log startup event
    this.logEvent({
      type: 'startup',
      source: 'system-bridge',
      message: 'System bridge connected',
      timestamp: new Date(),
    });

    this.isConnected = true;
    this.emit('connected');
  }

  async disconnect(): Promise<void> {
    this.stopMetricsCollection();

    this.logEvent({
      type: 'shutdown',
      source: 'system-bridge',
      message: 'System bridge disconnecting',
      timestamp: new Date(),
    });

    this.isConnected = false;
    this.emit('disconnected');
  }

  async sendMessage(
    message: Record<string, unknown>,
    messageType: MessageType = MessageType.COMMAND,
    priority: Priority = Priority.MEDIUM
  ): Promise<void> {
    const action = message.action as string;

    switch (action) {
      case 'get-metrics':
        const metrics = await this.collectMetrics();
        this.emit('metrics', metrics);
        break;
      case 'health-check':
        const health = await this.runHealthChecks();
        this.emit('health', health);
        break;
      case 'get-events':
        this.emit('events', this.getRecentEvents(message.count as number));
        break;
      default:
        this.emit('message', { action, message });
    }
  }

  // ============================================================
  // METRICS COLLECTION
  // ============================================================

  /**
   * Collect system metrics
   */
  async collectMetrics(): Promise<SystemMetrics> {
    const startTime = Date.now();

    // Simulate metrics collection (in production, use os module or system calls)
    const metrics: SystemMetrics = {
      cpu: {
        usage: Math.random() * 100,
        cores: 8,
      },
      memory: {
        total: 16 * 1024 * 1024 * 1024, // 16GB
        used: Math.random() * 8 * 1024 * 1024 * 1024,
        free: 8 * 1024 * 1024 * 1024,
        percentage: Math.random() * 100,
      },
      uptime: process.uptime(),
      loadAverage: [Math.random() * 4, Math.random() * 4, Math.random() * 4],
      processCount: 100 + Math.floor(Math.random() * 50),
    };

    // Calculate free memory
    metrics.memory.free = metrics.memory.total - metrics.memory.used;
    metrics.memory.percentage = (metrics.memory.used / metrics.memory.total) * 100;

    this.emit('metrics:collected', {
      metrics,
      duration: Date.now() - startTime,
    });

    return metrics;
  }

  /**
   * Start periodic metrics collection
   */
  startMetricsCollection(): void {
    if (this.metricsInterval) {
      return;
    }

    this.metricsInterval = setInterval(async () => {
      try {
        const metrics = await this.collectMetrics();
        this.emit('metrics:periodic', metrics);
      } catch (error) {
        this.emit('error', error);
      }
    }, this.metricsCollectionInterval);
  }

  /**
   * Stop periodic metrics collection
   */
  stopMetricsCollection(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
  }

  // ============================================================
  // HEALTH CHECKS
  // ============================================================

  /**
   * Register a health check
   */
  registerHealthCheck(name: string, check: () => Promise<HealthCheck>): void {
    this.healthChecks.set(name, check);
    this.emit('healthcheck:registered', { name });
  }

  /**
   * Unregister a health check
   */
  unregisterHealthCheck(name: string): void {
    this.healthChecks.delete(name);
    this.emit('healthcheck:unregistered', { name });
  }

  /**
   * Run all health checks
   */
  async runHealthChecks(): Promise<Map<string, HealthCheck>> {
    const results = new Map<string, HealthCheck>();

    for (const [name, check] of this.healthChecks) {
      try {
        const result = await check();
        results.set(name, result);
      } catch (error) {
        results.set(name, {
          name,
          status: 'unhealthy',
          message: error instanceof Error ? error.message : String(error),
          lastCheck: new Date(),
        });
      }
    }

    this.emit('healthchecks:complete', results);
    return results;
  }

  /**
   * Register default health checks
   */
  private registerDefaultHealthChecks(): void {
    // Process health check
    this.registerHealthCheck('process', async () => ({
      name: 'process',
      status: 'healthy',
      message: `PID: ${process.pid}, Uptime: ${process.uptime()}s`,
      lastCheck: new Date(),
    }));

    // Memory health check
    this.registerHealthCheck('memory', async () => {
      const used = process.memoryUsage();
      const heapUsagePercent = (used.heapUsed / used.heapTotal) * 100;

      return {
        name: 'memory',
        status: heapUsagePercent > 90 ? 'degraded' : 'healthy',
        message: `Heap: ${Math.round(heapUsagePercent)}% used`,
        lastCheck: new Date(),
      };
    });

    // Event loop health check
    this.registerHealthCheck('event-loop', async () => {
      const start = Date.now();
      await new Promise((resolve) => setImmediate(resolve));
      const latency = Date.now() - start;

      return {
        name: 'event-loop',
        status: latency > 100 ? 'degraded' : 'healthy',
        latency,
        message: `Event loop latency: ${latency}ms`,
        lastCheck: new Date(),
      };
    });
  }

  // ============================================================
  // EVENT LOGGING
  // ============================================================

  /**
   * Log a system event
   */
  logEvent(event: SystemEvent): void {
    this.eventLog.push(event);

    // Trim log if too large
    if (this.eventLog.length > this.maxEventLogSize) {
      this.eventLog = this.eventLog.slice(-this.maxEventLogSize / 2);
    }

    this.emit('event', event);
  }

  /**
   * Get recent events
   */
  getRecentEvents(count = 100): SystemEvent[] {
    return this.eventLog.slice(-count);
  }

  /**
   * Get events by type
   */
  getEventsByType(type: SystemEvent['type']): SystemEvent[] {
    return this.eventLog.filter((e) => e.type === type);
  }

  /**
   * Clear event log
   */
  clearEventLog(): void {
    this.eventLog = [];
    this.emit('events:cleared');
  }

  // ============================================================
  // PROCESS MANAGEMENT
  // ============================================================

  /**
   * Get current process info
   */
  getProcessInfo(): ProcessInfo {
    const memUsage = process.memoryUsage();

    return {
      pid: process.pid,
      name: process.title,
      memory: memUsage.heapUsed,
      cpu: 0, // Would need to calculate over time
      status: 'running',
      startTime: new Date(Date.now() - process.uptime() * 1000),
    };
  }

  /**
   * Get environment info
   */
  getEnvironmentInfo(): Record<string, string | undefined> {
    return {
      NODE_ENV: process.env.NODE_ENV,
      NODE_VERSION: process.version,
      PLATFORM: process.platform,
      ARCH: process.arch,
    };
  }

  // ============================================================
  // STATISTICS
  // ============================================================

  getStatistics(): {
    connected: boolean;
    healthChecks: number;
    eventLogSize: number;
    uptime: number;
    processInfo: ProcessInfo;
  } {
    return {
      connected: this.isConnected,
      healthChecks: this.healthChecks.size,
      eventLogSize: this.eventLog.length,
      uptime: process.uptime(),
      processInfo: this.getProcessInfo(),
    };
  }
}

export default SystemBridge;
