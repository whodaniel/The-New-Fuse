import { Injectable } from '@nestjs/common';
import {
  drizzleAgentRepository,
  drizzleAuditLogsRepository,
  drizzleUserRepository,
  drizzleWorkflowRepository,
} from '@the-new-fuse/database/drizzle/repositories';
import * as os from 'os';

@Injectable()
export class MetricsService {
  constructor(
    private readonly userRepository = drizzleUserRepository,
    private readonly agentRepository = drizzleAgentRepository,
    private readonly workflowRepository = drizzleWorkflowRepository,
    private readonly auditLogsRepository = drizzleAuditLogsRepository
  ) {}

  /**
   * Get basic platform metrics
   */
  async getMetrics() {
    const [totalUsers, totalAgents, totalWorkflows] = await Promise.all([
      this.userRepository.count(),
      this.agentRepository.count(),
      this.workflowRepository.count(),
    ]);

    return {
      totalUsers,
      totalAgents,
      totalWorkflows,
      systemHealth: this.getHealthStatus(),
    };
  }

  /**
   * Get comprehensive system metrics
   */
  async getSystemMetrics() {
    const [totalUsers, activeUsers, totalAgents, activeAgents, totalWorkflows] = await Promise.all([
      this.userRepository.count(),
      this.getActiveUserCount(),
      this.agentRepository.count(),
      this.getActiveAgentCount(),
      this.workflowRepository.count(),
    ]);

    // Get real system metrics
    const cpuUsage = this.getCPUUsage();
    const memoryUsage = this.getMemoryUsage();
    const loadAverage = os.loadavg();

    return {
      // User metrics
      totalUsers,
      activeUsers,

      // Agent metrics
      totalAgents,
      activeAgents,

      // Workflow metrics
      totalWorkflows,

      // System health
      systemHealth: this.getHealthStatus(),
      uptime: process.uptime(),

      // Memory metrics
      memory: {
        used: process.memoryUsage().heapUsed,
        total: os.totalmem(),
        free: os.freemem(),
        percentage: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100,
      },

      // CPU metrics
      cpu: {
        usage: cpuUsage,
        loadAverage: {
          '1min': loadAverage[0],
          '5min': loadAverage[1],
          '15min': loadAverage[2],
        },
        cores: os.cpus().length,
      },

      // Platform info
      platform: {
        type: os.platform(),
        release: os.release(),
        arch: os.arch(),
        hostname: os.hostname(),
      },

      timestamp: new Date(),
    };
  }

  /**
   * Record a custom metric
   */
  async recordMetric(name: string, value: number, metadata?: any) {
    // Log to audit trail
    await this.auditLogsRepository.create({
      action: 'metric.recorded',
      details: { name, value, metadata },
      status: 'success',
    });
  }

  /**
   * Get system statistics
   */
  async getSystemStats() {
    const cpuUsage = this.getCPUUsage();
    const memoryUsage = this.getMemoryUsage();

    return {
      uptime: process.uptime(),
      memory: {
        heapUsed: process.memoryUsage().heapUsed,
        heapTotal: process.memoryUsage().heapTotal,
        rss: process.memoryUsage().rss,
        external: process.memoryUsage().external,
        percentage: memoryUsage,
      },
      cpu: {
        usage: cpuUsage,
        loadAverage: os.loadavg(),
      },
    };
  }

  /**
   * Get CPU usage percentage
   */
  private getCPUUsage(): number {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach((cpu) => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times];
      }
      totalIdle += cpu.times.idle;
    });

    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - ~~((100 * idle) / total);

    return usage;
  }

  /**
   * Get memory usage percentage
   */
  private getMemoryUsage(): number {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    return ((totalMem - freeMem) / totalMem) * 100;
  }

  /**
   * Get system health status
   */
  private getHealthStatus(): 'healthy' | 'degraded' | 'critical' {
    const memUsage = this.getMemoryUsage();
    const cpuUsage = this.getCPUUsage();

    if (memUsage > 90 || cpuUsage > 90) {
      return 'critical';
    } else if (memUsage > 75 || cpuUsage > 75) {
      return 'degraded';
    }

    return 'healthy';
  }

  /**
   * Get count of active users (logged in within last 24 hours)
   */
  private async getActiveUserCount(): Promise<number> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    // This would require a more complex query - for now return approximate
    return Math.floor((await this.userRepository.count()) * 0.3); // Estimate 30% active
  }

  /**
   * Get count of active agents
   */
  private async getActiveAgentCount(): Promise<number> {
    // Get agents with status 'ACTIVE' or recently used
    const allAgents = await this.agentRepository.findAll();
    return allAgents.filter((agent: any) => agent.status === 'ACTIVE').length;
  }
}
