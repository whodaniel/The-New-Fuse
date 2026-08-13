import { Controller, Get } from '@nestjs/common';

interface ServiceStatus {
  name: string;
  status: 'running' | 'stopped' | 'error';
  port?: number;
  type: string;
  health: 'healthy' | 'warning' | 'error';
  uptime?: number;
}

interface SystemMetrics {
  timestamp: string;
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
    usagePercent: number;
  };
  cpu: {
    usage: number;
  };
  api: {
    requestsPerMinute: number;
    requestsPerSecond: number;
    avgResponseTime: number;
    averageResponseTimeMs: number;
    errorRate: number;
    totalRequests: number;
  };
  memoryUsage: number;
  avgResponseTime: number;
  requestsPerSecond: number;
  platform: string;
  version: string;
}

interface SystemTool {
  name: string;
  type: string;
  status: 'active' | 'inactive' | 'error';
  version?: string;
}

@Controller('api')
export class SystemController {
  @Get('services/status')
  async getServicesStatus(): Promise<ServiceStatus[]> {
    const services: ServiceStatus[] = [
      {
        name: 'Frontend App',
        status: (await this.checkPortStatus(3000)) ? 'running' : 'stopped',
        port: 3000,
        type: 'web',
        health: (await this.checkPortStatus(3000)) ? 'healthy' : 'error',
      },
      {
        name: 'Backend API',
        status: 'running',
        port: 3004,
        type: 'api',
        health: 'healthy',
        uptime: process.uptime() * 1000,
      },
      {
        name: 'Browser Hub HTTP Server',
        status: (await this.checkPortStatus(8080)) ? 'running' : 'stopped',
        port: 8080,
        type: 'http',
        health: (await this.checkPortStatus(8080)) ? 'healthy' : 'error',
      },
      {
        name: 'PostgreSQL Database',
        status:
          (await this.checkDockerContainer('tnf-postgres-dev')) ||
          (await this.checkPortStatus(5433))
            ? 'running'
            : 'stopped',
        port: 5433,
        type: 'database',
        health:
          (await this.checkDockerContainer('tnf-postgres-dev')) ||
          (await this.checkPortStatus(5433))
            ? 'healthy'
            : 'error',
      },
      {
        name: 'Redis Cache',
        status:
          (await this.checkDockerContainer('tnf-redis-dev')) || (await this.checkPortStatus(6380))
            ? 'running'
            : 'stopped',
        port: 6380,
        type: 'cache',
        health:
          (await this.checkDockerContainer('tnf-redis-dev')) || (await this.checkPortStatus(6380))
            ? 'healthy'
            : 'error',
      },
    ];

    return services;
  }

  @Get('system/metrics')
  async getSystemMetrics(): Promise<SystemMetrics> {
    const memUsage = process.memoryUsage();
    const usagePercent = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100);
    const avgResponseTimeMs = 0;
    const requestsPerMinute = 0;
    const requestsPerSecond = 0;

    return {
      timestamp: new Date().toISOString(),
      uptime: process.uptime() * 1000,
      memory: {
        used: memUsage.heapUsed,
        total: memUsage.heapTotal,
        percentage: usagePercent,
        usagePercent,
      },
      cpu: {
        usage: process.cpuUsage().system / 1000000, // Convert to percentage
      },
      api: {
        requestsPerMinute,
        requestsPerSecond,
        avgResponseTime: avgResponseTimeMs,
        averageResponseTimeMs: avgResponseTimeMs,
        errorRate: 0,
        totalRequests: 0,
      },
      memoryUsage: usagePercent,
      avgResponseTime: avgResponseTimeMs,
      requestsPerSecond,
      platform: process.platform,
      version: process.version,
    };
  }

  @Get('system/tools')
  async getSystemTools(): Promise<SystemTool[]> {
    const tools: SystemTool[] = [
      {
        name: 'Chrome Browser',
        type: 'browser',
        status: 'active',
      },
      {
        name: 'Node.js Runtime',
        type: 'runtime',
        status: 'active',
        version: process.version,
      },
      {
        name: 'Terminal Integration',
        type: 'shell',
        status: 'active',
      },
      {
        name: 'Workflow Builder',
        type: 'automation',
        status: 'active',
      },
    ];

    return tools;
  }

  private async checkPortStatus(port: number): Promise<boolean> {
    try {
      const axios = require('axios');
      await axios.get(`http://localhost:${port}`, { timeout: 1000 });
      return true;
    } catch {
      return false;
    }
  }

  private async checkDockerContainer(containerName: string): Promise<boolean> {
    try {
      const { execSync } = require('child_process');
      const result = execSync(
        `docker ps --filter "name=${containerName}" --format "table {{.Status}}"`,
        { encoding: 'utf8', timeout: 2000 }
      );
      return result.includes('Up ');
    } catch {
      return false;
    }
  }
}
