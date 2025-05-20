import { Injectable } from '@nestjs/common';
import { RedisService } from '../cache/redis.service.js';
import { DatabaseService } from '../database/database.service.js';
import { MetricsService } from '../metrics/metrics.service.js';

interface ServiceHealth {
  status: 'healthy' | 'unhealthy';
  latency?: number;
  error?: string;
}

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
    api: ServiceHealth;
  };
  metrics: Record<string, number>;
}

@Injectable()
export class HealthService {
  constructor(
    private readonly redis: RedisService,
    private readonly db: DatabaseService,
    private readonly metrics: MetricsService,
  ) {}

  async checkHealth(): Promise<HealthStatus> {
    const [dbHealth, redisHealth, apiHealth] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkAPI()
    ]);

    return {
      status: this.getOverallStatus([dbHealth, redisHealth, apiHealth]),
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealth,
        redis: redisHealth,
        api: apiHealth,
      },
      metrics: await this.metrics.getSystemMetrics()
    };
  }

  private async checkDatabase(): Promise<ServiceHealth> {
    try {
      const start = Date.now();
      await this.db.query('SELECT 1');
      return { status: 'healthy', latency: Date.now() - start };
    } catch(error) {
      return { status: 'unhealthy', error: error.message };
    }
  }

  private async checkRedis(): Promise<ServiceHealth> {
    try {
      const start = Date.now();
      await this.redis.ping();
      return {
        status: 'healthy',
        latency: Date.now() - start
      };
    } catch(error) {
      return { status: 'unhealthy', error: error.message };
    }
  }

  private async checkAPI(): Promise<ServiceHealth> {
    try {
      const start = Date.now();
      // Implement API health check
      return {
        status: 'healthy',
        latency: Date.now() - start
      };
    } catch(error) {
      return { status: 'unhealthy', error: error.message };
    }
  }

  private getOverallStatus(services: ServiceHealth[]): 'healthy' | 'degraded' | 'unhealthy' {
    const unhealthyCount = services.filter(s => s.status === 'unhealthy').length;

    if (unhealthyCount === 0) {
      return 'healthy';
    } else if (unhealthyCount < services.length) {
      return 'degraded';
    } else {
      return 'unhealthy';
    }
  }
}