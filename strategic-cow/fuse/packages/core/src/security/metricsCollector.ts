import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { performance } from 'perf_hooks';
import * as os from 'os';

@Injectable()
export class MetricsCollectorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MetricsCollectorService.name);
  private readonly redis: Redis;
  private collectionInterval: NodeJS.Timeout | null = null;
  private readonly retentionPeriod = 86400; // 24 hours in seconds

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
    });
  }

  onModuleInit() {
    this.start();
  }

  onModuleDestroy() {
    this.stop();
  }

  start() {
    if (this.collectionInterval) {
      throw new Error('Metrics collection already started');
    }
    this.collectionInterval = setInterval(() => this.collectMetrics(), 5000);
    this.logger.log('Metrics collection started');
  }

  stop() {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
      this.logger.log('Metrics collection stopped');
    }
  }

  private async collectMetrics() {
    try {
      const metrics = {
        timestamp: new Date().toISOString(),
        cpuUsage: this.getCpuUsage(),
        memoryUsage: this.getMemoryUsage(),
        eventLoopLag: await this.getEventLoopLag(),
      };

      const key = `metrics:${metrics.timestamp}`;
      await this.redis.setex(key, this.retentionPeriod, JSON.stringify(metrics));
    } catch (error) {
      this.logger.error('Error collecting metrics', error);
    }
  }

  private getCpuUsage() {
    const cpus = os.cpus();
    const total = cpus.reduce((acc, cpu) => {
      acc.total += cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.idle + cpu.times.irq;
      acc.idle += cpu.times.idle;
      return acc;
    }, { total: 0, idle: 0 });

    return {
      total: total.total,
      idle: total.idle,
      usage: 1 - total.idle / total.total,
    };
  }

  private getMemoryUsage() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    return {
      total: totalMemory,
      free: freeMemory,
      used: totalMemory - freeMemory,
    };
  }

  private getEventLoopLag(): Promise<number> {
    return new Promise((resolve) => {
      const start = performance.now();
      setTimeout(() => {
        resolve(performance.now() - start);
      });
    });
  }
}
