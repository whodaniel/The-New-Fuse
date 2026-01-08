import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import { promisify } from 'util';
import { SystemMetricsResponseDto } from './dto/system-metrics.dto';

const execAsync = promisify(exec);

@Injectable()
export class SystemMetricsService {
  private readonly logger = new Logger(SystemMetricsService.name);
  private startTime: number = Date.now();

  async getMetrics(): Promise<SystemMetricsResponseDto & { disk?: any; network?: any }> {
    this.logger.log('Fetching system metrics');

    const memory = this.getMemoryMetrics();
    const cpu = this.getCpuMetrics();
    const disk = await this.getDiskMetrics();
    const network = await this.getNetworkMetrics();
    const database = await this.getDatabaseMetrics();
    const api = this.getApiMetrics();
    const services = await this.getServicesHealth();

    // Determine overall status based on services
    const hasUnhealthy = services.some((s) => s.status === 'unhealthy');
    const hasDegraded = services.some((s) => s.status === 'degraded');
    const overallStatus = hasUnhealthy ? 'unhealthy' : hasDegraded ? 'degraded' : 'healthy';

    return {
      status: overallStatus,
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      timestamp: new Date(),
      memory,
      cpu,
      disk,
      network,
      database,
      api,
      services,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };
  }

  private getMemoryMetrics() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const usagePercent = (usedMemory / totalMemory) * 100;

    return {
      total: totalMemory,
      used: usedMemory,
      free: freeMemory,
      usagePercent: parseFloat(usagePercent.toFixed(2)),
    };
  }

  private getCpuMetrics() {
    const cpus = os.cpus();
    const loadAvg = os.loadavg()[0];

    // Calculate average CPU usage
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
    const usagePercent = ((total - idle) / total) * 100;

    return {
      cores: cpus.length,
      usagePercent: parseFloat(usagePercent.toFixed(2)),
      loadAverage: parseFloat(loadAvg.toFixed(2)),
    };
  }

  private async getDiskMetrics() {
    try {
      if (os.platform() !== 'win32') {
        const { stdout } = await execAsync('df -k /');
        const lines = stdout.trim().split('\n');
        if (lines.length > 1) {
          const parts = lines[1].split(/\s+/);
          // Filesystem 1K-blocks Used Available Use% Mounted on
          // parts[1] = total, parts[2] = used, parts[3] = available, parts[4] = use%
          const total = parseInt(parts[1], 10) * 1024; // bytes
          const used = parseInt(parts[2], 10) * 1024; // bytes
          const usagePercent = (used / total) * 100;

          return {
            total,
            used,
            free: total - used,
            usagePercent: parseFloat(usagePercent.toFixed(2)),
          };
        }
      }
    } catch (error) {
      this.logger.warn(`Failed to get disk metrics: ${error.message}`);
    }

    return {
      total: 0,
      used: 0,
      free: 0,
      usagePercent: 0,
    };
  }

  private async getNetworkMetrics() {
    try {
      if (os.platform() === 'linux') {
        const data = await fs.promises.readFile('/proc/net/dev', 'utf8');
        const lines = data.split('\n');
        let totalRx = 0;
        let totalTx = 0;

        // Skip header lines
        for (let i = 2; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const parts = line.split(/\s+/);
          // interface: rx_bytes ... tx_bytes ...
          // parts[0] is interface name (e.g. eth0:)
          // parts[1] is rx_bytes
          // parts[9] is tx_bytes (index depends on splitting)

          // Handle potential "eth0:" vs "eth0 :"
          let rxIndex = 1;
          if (parts[0].endsWith(':')) {
            rxIndex = 1;
          } else {
            // If interface name is separate from colon or no colon
            rxIndex = 1; // Actually usually if space, it splits.
            // Let's assume standard format: "eth0: 123 ..." -> ["eth0:", "123", ...]
          }

          const rx = parseInt(parts[1], 10);
          const tx = parseInt(parts[9], 10); // Usually 9th field after interface

          if (!isNaN(rx)) totalRx += rx;
          if (!isNaN(tx)) totalTx += tx;
        }

        return {
          bytesReceived: totalRx,
          bytesSent: totalTx,
          totalTraffic: totalRx + totalTx,
        };
      }
    } catch (error) {
      this.logger.warn(`Failed to get network metrics: ${error.message}`);
    }

    return {
      bytesReceived: 0,
      bytesSent: 0,
      totalTraffic: 0,
    };
  }

  private async getDatabaseMetrics() {
    // Mock database metrics - replace with actual database queries
    return {
      status: 'connected',
      activeConnections: Math.floor(Math.random() * 20) + 5,
      totalQueries: 15234,
      avgQueryTime: parseFloat((Math.random() * 50 + 10).toFixed(1)),
    };
  }

  private getApiMetrics() {
    // Mock API metrics - in production, integrate with actual monitoring
    return {
      totalRequests: 100000,
      requestsPerMinute: Math.floor(Math.random() * 100) + 100,
      avgResponseTime: parseFloat((Math.random() * 100 + 50).toFixed(1)),
      errorRate: parseFloat((Math.random() * 2).toFixed(2)),
      statusCodeDistribution: {
        '200': 95000,
        '201': 3000,
        '400': 1500,
        '500': 500,
      },
    };
  }

  private async getServicesHealth() {
    // Mock service health checks - replace with actual health check implementations
    const services: Array<{
      name: string;
      status: 'healthy' | 'degraded' | 'unhealthy';
      responseTime: number;
      lastCheck: Date;
      message: string;
    }> = [
      {
        name: 'database',
        status: 'healthy',
        responseTime: 5,
        lastCheck: new Date(),
        message: 'Database connection stable',
      },
      {
        name: 'redis',
        status: 'healthy',
        responseTime: 2,
        lastCheck: new Date(),
        message: 'Cache service operational',
      },
      {
        name: 'storage',
        status: 'healthy',
        responseTime: 15,
        lastCheck: new Date(),
        message: 'File storage accessible',
      },
      {
        name: 'email',
        status: 'healthy',
        responseTime: 25,
        lastCheck: new Date(),
        message: 'Email service connected',
      },
    ];

    return services;
  }

  async getHealthCheck() {
    const metrics = await this.getMetrics();
    return {
      status: metrics.status,
      timestamp: metrics.timestamp,
      uptime: metrics.uptime,
    };
  }
}
