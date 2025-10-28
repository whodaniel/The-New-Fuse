import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { performance } from 'perf_hooks';

// Interface for performance metrics
export interface PerformanceMetrics {
  timestamp: number;
  cpuUsage: NodeJS.CpuUsage;
  memoryUsage: NodeJS.MemoryUsage;
  eventLoopLag: number;
}

// Interface for performance alerts
export interface PerformanceAlert {
  metric: keyof PerformanceMetrics;
  value: any;
  threshold: number;
  message: string;
}

@Injectable()
export class PerformanceMonitorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PerformanceMonitorService.name);
  private monitorInterval: NodeJS.Timeout | null = null;
  private lastCpuUsage: NodeJS.CpuUsage;
  private lastSampleTime: number;

  // Configuration
  private readonly checkIntervalMs = 15000; // 15 seconds
  private readonly cpuThresholdPercent = 80; // 80%
  private readonly memoryThresholdMb = 500; // 500 MB
  private readonly eventLoopLagThresholdMs = 50; // 50 ms

  constructor(private readonly eventEmitter: EventEmitter2) {
    this.lastCpuUsage = process.cpuUsage();
    this.lastSampleTime = Date.now();
  }

  onModuleInit() {
    this.logger.log('Starting performance monitor...');
    this.monitorInterval = setInterval(() => this.collectMetrics(), this.checkIntervalMs);
  }

  onModuleDestroy() {
    this.logger.log('Stopping performance monitor...');
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
    }
  }

  collectMetrics() {
    try {
      const metrics: PerformanceMetrics = {
        timestamp: Date.now(),
        cpuUsage: this.getProcessorUsage(),
        memoryUsage: process.memoryUsage(),
        eventLoopLag: this.getEventLoopLag(),
      };

      this.checkForAnomalies(metrics);
      this.eventEmitter.emit('performance.metrics', metrics);
    } catch (error) {
      this.logger.error('Failed to collect performance metrics', error.stack);
    }
  }

  private getProcessorUsage(): NodeJS.CpuUsage {
    const now = Date.now();
    const elapsedTime = (now - this.lastSampleTime) * 1000; // time in microseconds
    const currentCpuUsage = process.cpuUsage(this.lastCpuUsage);

    this.lastCpuUsage = process.cpuUsage();
    this.lastSampleTime = now;

    return {
      user: currentCpuUsage.user / elapsedTime * 100,
      system: currentCpuUsage.system / elapsedTime * 100
    };
  }

  private getEventLoopLag(): number {
    const start = performance.now();
    // A simple way to measure event loop lag is to see how long a 0ms timeout takes.
    // This is not perfectly accurate but gives a good indication.
    setTimeout(() => {
      const lag = performance.now() - start;
      if (lag > this.eventLoopLagThresholdMs) {
        this.emitAlert('eventLoopLag', lag, this.eventLoopLagThresholdMs, 'High event loop lag detected.');
      }
    }, 0);
    // This method is async, so we return 0 here and emit the alert later.
    return 0;
  }

  private checkForAnomalies(metrics: PerformanceMetrics) {
    // Check CPU Usage
    const totalCpu = metrics.cpuUsage.user + metrics.cpuUsage.system;
    if (totalCpu > this.cpuThresholdPercent) {
      this.emitAlert('cpuUsage', totalCpu, this.cpuThresholdPercent, 'High CPU usage detected.');
    }

    // Check Memory Usage
    const memoryUsageMb = metrics.memoryUsage.rss / (1024 * 1024);
    if (memoryUsageMb > this.memoryThresholdMb) {
      this.emitAlert('memoryUsage', memoryUsageMb, this.memoryThresholdMb, 'High memory usage detected.');
    }
  }

  private emitAlert(metric: keyof PerformanceMetrics, value: any, threshold: number, message: string) {
    const alert: PerformanceAlert = { metric, value, threshold, message };
    this.eventEmitter.emit('performance.alert', alert);
    this.logger.warn(message, { metric, value, threshold });
  }
}
