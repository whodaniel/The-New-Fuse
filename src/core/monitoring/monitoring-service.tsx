import { injectable, inject } from 'inversify';
import TYPES from '../di/types.js';
import { Logger } from 'winston';
import { MetricsCollector } from '../metrics/metrics-collector.js';
import { ConfigService } from '../config/config-service.js';
import { EventBus } from '../events/event-bus.js';
import os from 'os';

interface SystemMetrics {
  cpu: number;
  memory: {
    total: number;
    free: number;
    used: number;
  };
  uptime: number;
}

@injectable()
export class MonitoringService {
  private metricsInterval: NodeJS.Timer | null = null;
  private readonly METRICS_INTERVAL = 60000; // 1 minute

  constructor(
    @inject(TYPES.LoggingService) private logger: Logger,
    @inject(TYPES.MetricsCollector) private metrics: MetricsCollector,
    @inject(TYPES.ConfigService) private config: ConfigService,
    @inject(TYPES.EventBus) private eventBus: EventBus,
  ) {}

  public async start(): Promise<void> {
    this.logger.info('Starting monitoring service');

    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }

    // Create system metrics
    this.metrics.createGauge('system_cpu_usage', 'CPU usage percentage');

    this.metricsInterval = setInterval(async () => {
      try {
        const systemMetrics = await this.collectSystemMetrics();
        this.updateMetrics(systemMetrics);
        await this.checkHealthMetrics(systemMetrics);
      } catch (error) {
        this.logger.error('Metrics collection error', { error });
      }
    }, this.METRICS_INTERVAL);
  }

  private updateMetrics(metrics: SystemMetrics): void {
    this.metrics.setGauge('system_cpu_usage', metrics.cpu);
    this.metrics.setGauge('system_memory_total', metrics.memory.total);
    this.metrics.setGauge('system_memory_free', metrics.memory.free);
    this.metrics.setGauge('system_memory_used', metrics.memory.used);
    this.metrics.setGauge('system_uptime', metrics.uptime);
  }

  private async collectSystemMetrics(): Promise<SystemMetrics> {
    const cpus = os.cpus();
    
    const totalCpu = cpus.reduce((acc, cpu) => {
      const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
      return acc + (cpu.times.user + cpu.times.nice + cpu.times.sys) / total;
    }, 0) / cpus.length;

    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();

    return {
      cpu: totalCpu * 100,
      memory: {
        total: totalMemory,
        free: freeMemory,
        used: totalMemory - freeMemory
      },
      uptime: os.uptime()
    };
  }

  private async checkHealthMetrics(metrics: SystemMetrics): Promise<void> {
    const thresholds = this.config.get('monitoring.thresholds', {
      cpuWarning: 80,
      cpuCritical: 90,
      memoryWarning: 85,
      memoryCritical: 95
    });

    // Check CPU usage
    if (metrics.cpu >= thresholds.cpuCritical) {
      await this.emitAlert('critical', 'CPU usage critical', metrics.cpu);
    } else if (metrics.cpu >= thresholds.cpuWarning) {
      await this.emitAlert('warning', 'CPU usage high', metrics.cpu);
    }

    // Check memory usage
    const memoryUsagePercent = (metrics.memory.used / metrics.memory.total) * 100;
    if (memoryUsagePercent >= thresholds.memoryCritical) {
      await this.emitAlert('critical', 'Memory usage critical', memoryUsagePercent);
    } else if (memoryUsagePercent >= thresholds.memoryWarning) {
      await this.emitAlert('warning', 'Memory usage high', memoryUsagePercent);
    }
  }

  private async emitAlert(level: 'warning' | 'critical', message: string, value: number): Promise<void> {
    const alert = {
      timestamp: new Date(),
      level,
      message,
      value
    };

    await this.eventBus.emit('monitoring.alert', alert);
    this.logger.warn(`System alert: ${message}`, alert);
  }

  private subscribeToEvents(): void {
    // Track error events
    this.eventBus.subscribe('system.error', async (event) => {
      this.metrics.incrementCounter('system_errors_total', {
        type: event.payload.type
      });
    });

    // Track warning events
    this.eventBus.subscribe('system.warning', async (event) => {
      this.metrics.incrementCounter('system_warnings_total', {
        type: event.payload.type
      });
    });

    // Track performance events
    this.eventBus.subscribe('system.performance', async (event) => {
      const { metric, value, tags } = event.payload;
      this.metrics.recordValue(metric, value, tags);
    });
  }

  public async stop(): Promise<void> {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
    this.logger.info('Monitoring service stopped');
  }
}
