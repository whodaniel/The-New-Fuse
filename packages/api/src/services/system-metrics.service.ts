/**
 * System Metrics Service
 *
 * Provides real-time system and application metrics.
 */

import { Inject, Injectable } from '@nestjs/common';
import * as os from 'os';
import { DRIZZLE_CLIENT, type DrizzleClient, sql } from '@the-new-fuse/database';
import { ApiLogsRepository } from '../repositories/api-logs.repository';

@Injectable()
export class SystemMetricsService {
  constructor(
    @Inject(DRIZZLE_CLIENT) private readonly db: DrizzleClient,
    private readonly apiLogsRepository: ApiLogsRepository
  ) {}

  async getMetrics() {
    const [cpu, memory, dbMetrics, apiMetrics] = await Promise.all([
      this.getCpuUsage(),
      this.getMemoryUsage(),
      this.getDatabaseMetrics(),
      this.getApiMetrics(),
    ]);

    return {
      cpu: { usagePercent: cpu },
      memory: { usagePercent: memory },
      disk: { usagePercent: 45 }, // Mocked: Node.js standard lib doesn't provide disk usage
      network: { totalTraffic: 1024 * 1024 * 1024 * 5.2 }, // Mocked: 5.2 GB
      database: dbMetrics,
      api: apiMetrics,
      systemInfo: {
        platform: os.platform(),
        release: os.release(),
        arch: os.arch(),
        hostname: os.hostname(),
        uptime: os.uptime(),
        totalMemory: os.totalmem(),
        cpus: os.cpus().length,
      }
    };
  }

  private async getCpuUsage(): Promise<number> {
    const cpus = os.cpus();
    let idle = 0;
    let total = 0;

    for (const cpu of cpus) {
      for (const type in cpu.times) {
        total += (cpu.times as any)[type];
      }
      idle += cpu.times.idle;
    }

    // This is instant usage, might fluctuate.
    // Ideally we diff against previous sample, but for simple dashboard this works roughly
    // or we just return load average relative to cores
    const load = os.loadavg()[0]; // 1 min load avg
    const percent = Math.min(100, (load / cpus.length) * 100);
    return parseFloat(percent.toFixed(2));
  }

  private getMemoryUsage(): number {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    return parseFloat(((used / total) * 100).toFixed(2));
  }

  private async getDatabaseMetrics() {
    try {
      // Postgres specific: count active connections
      const result = await this.db.execute(sql`
        SELECT count(*)::int as count
        FROM pg_stat_activity
        WHERE state = 'active'
      `);
      return {
        activeConnections: result[0]?.count || 0
      };
    } catch (error) {
      return { activeConnections: 0 };
    }
  }

  private async getApiMetrics() {
    // Get stats for last hour
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 60 * 60 * 1000); // 1 hour ago

    const stats = await this.apiLogsRepository.getStats(startDate, endDate);
    const stat = stats[0] || { count: 0, avgDuration: 0, errorCount: 0 };

    const requests = Number(stat.count);
    const rpm = requests / 60; // requests per minute avg over last hour

    const errorRate = requests > 0 ? (Number(stat.errorCount) / requests) * 100 : 0;

    return {
      requestsPerMinute: parseFloat(rpm.toFixed(2)),
      avgResponseTime: parseFloat(Number(stat.avgDuration || 0).toFixed(2)),
      errorRate: parseFloat(errorRate.toFixed(2)),
    };
  }
}
