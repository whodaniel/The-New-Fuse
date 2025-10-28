import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import Redis from 'ioredis'; // Assuming ioredis is used for Redis connection

// Interface for a Redis health alert
export interface RedisAlert {
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: Date;
  details?: Record<string, any>;
}

@Injectable()
export class RedisMonitorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisMonitorService.name);
  private monitorInterval: NodeJS.Timeout | null = null;
  private redis: Redis;

  // Configuration
  private readonly checkIntervalMs = 30000; // 30 seconds
  private readonly memoryThresholdMb = 500; // 500 MB
  private readonly fragmentationThreshold = 1.5;
  private readonly blockedClientsThreshold = 5;

  constructor(private readonly eventEmitter: EventEmitter2) {
    // In a real app, Redis connection details would come from a config service
    // and the Redis instance would likely be injected.
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
    });

    this.redis.on('error', (err) => this.logger.error('Redis Error', err));
  }

  onModuleInit() {
    this.logger.log('Starting Redis monitor...');
    this.monitorInterval = setInterval(() => this.checkRedisHealth(), this.checkIntervalMs);
  }

  onModuleDestroy() {
    this.logger.log('Stopping Redis monitor...');
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
    }
    this.redis.disconnect();
  }

  async checkRedisHealth() {
    try {
      const info = await this.redis.info();
      const stats = this.parseRedisInfo(info);
      const alerts = this.analyzeStats(stats);

      if (alerts.length > 0) {
        alerts.forEach(alert => {
          this.eventEmitter.emit('redis.alert', alert);
          this.logger.warn(`Redis Alert: ${alert.message}`);
        });
      }
    } catch (error) {
      const alert: RedisAlert = {
        severity: 'critical',
        message: 'Failed to connect to Redis or retrieve info.',
        timestamp: new Date(),
        details: { error: error.message },
      };
      this.eventEmitter.emit('redis.alert', alert);
      this.logger.error(alert.message, error.stack);
    }
  }

  private parseRedisInfo(info: string): Record<string, any> {
    const lines = info.split('\r\n');
    const stats: Record<string, any> = {};
    lines.forEach(line => {
      if (line && !line.startsWith('#')) {
        const parts = line.split(':');
        const key = parts[0];
        const value = parts[1];
        if (!isNaN(Number(value))) {
          stats[key] = Number(value);
        } else {
          stats[key] = value;
        }
      }
    });
    return stats;
  }

  private analyzeStats(stats: Record<string, any>): RedisAlert[] {
    const alerts: RedisAlert[] = [];

    // 1. Check Memory Usage
    const usedMemoryMb = stats.used_memory / (1024 * 1024);
    if (usedMemoryMb > this.memoryThresholdMb) {
      alerts.push({
        severity: 'warning',
        message: `Redis memory usage (${usedMemoryMb.toFixed(2)} MB) exceeds threshold (${this.memoryThresholdMb} MB).`,
        timestamp: new Date(),
        details: { usedMemoryMb, threshold: this.memoryThresholdMb },
      });
    }

    // 2. Check Memory Fragmentation
    if (stats.mem_fragmentation_ratio > this.fragmentationThreshold) {
      alerts.push({
        severity: 'warning',
        message: `Redis memory fragmentation ratio (${stats.mem_fragmentation_ratio}) is high.`,
        timestamp: new Date(),
        details: { ratio: stats.mem_fragmentation_ratio, threshold: this.fragmentationThreshold },
      });
    }

    // 3. Check for Blocked Clients
    if (stats.blocked_clients > this.blockedClientsThreshold) {
      alerts.push({
        severity: 'critical',
        message: `High number of blocked Redis clients: ${stats.blocked_clients}.`,
        timestamp: new Date(),
        details: { blockedClients: stats.blocked_clients, threshold: this.blockedClientsThreshold },
      });
    }

    return alerts;
  }
}
