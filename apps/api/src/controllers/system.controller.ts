/**
 * System Controller - System health and metrics
 */

import { Request, Response } from 'express';
import { Logger } from '@nestjs/common';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

export class SystemController {
  private logger = new Logger(SystemController.name);

  // GET /api/system/health
  async getHealth(req: Request, res: Response): Promise<void> {
    try {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.version,
        environment: process.env.NODE_ENV || 'development',
        services: {
          api: 'online',
          database: await this.checkDatabaseHealth(),
          filesystem: await this.checkFilesystemHealth(),
          memory: this.getMemoryStatus()
        }
      };

      res.json(health);
    } catch (error) {
      this.logger.error('Health check failed:', error);
      res.status(500).json({
        status: 'unhealthy',
        error: 'Health check failed'
      });
    }
  }

  // GET /api/system/metrics
  async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = {
        timestamp: new Date().toISOString(),
        system: {
          platform: os.platform(),
          arch: os.arch(),
          hostname: os.hostname(),
          uptime: os.uptime(),
          loadavg: os.loadavg()
        },
        process: {
          pid: process.pid,
          uptime: process.uptime(),
          version: process.version,
          memoryUsage: process.memoryUsage(),
          cpuUsage: process.cpuUsage()
        },
        memory: {
          total: os.totalmem(),
          free: os.freemem(),
          used: os.totalmem() - os.freemem(),
          usage: Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100)
        },
        cpu: {
          count: os.cpus().length,
          model: os.cpus()[0]?.model || 'Unknown',
          usage: await this.getCPUUsage()
        },
        disk: await this.getDiskUsage()
      };

      res.json(metrics);
    } catch (error) {
      this.logger.error('Failed to get system metrics:', error);
      res.status(500).json({ error: 'Failed to get system metrics' });
    }
  }

  // GET /api/system/status
  async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = {
        api: 'online',
        database: await this.checkDatabaseHealth(),
        websocket: 'unknown', // Will be updated by WebSocket controller
        workflows: await this.checkWorkflowEngineHealth(),
        agents: await this.checkAgentSystemHealth(),
        mcp: await this.checkMCPHealth(),
        timestamp: new Date().toISOString()
      };

      res.json(status);
    } catch (error) {
      this.logger.error('Failed to get system status:', error);
      res.status(500).json({ error: 'Failed to get system status' });
    }
  }

  // POST /api/system/restart
  async restart(req: Request, res: Response): Promise<void> {
    try {
      this.logger.warn('System restart requested');
      
      res.json({ 
        message: 'System restart initiated',
        timestamp: new Date().toISOString()
      });

      // Graceful shutdown and restart
      setTimeout(() => {
        process.exit(0);
      }, 1000);
    } catch (error) {
      this.logger.error('Failed to restart system:', error);
      res.status(500).json({ error: 'Failed to restart system' });
    }
  }

  // GET /api/system/logs
  async getLogs(req: Request, res: Response): Promise<void> {
    try {
      const { lines = 100, level = 'all' } = req.query;
      
      // This would typically read from log files
      // For now, return a mock response
      const logs = {
        timestamp: new Date().toISOString(),
        level: level,
        lines: Number(lines),
        entries: [
          {
            timestamp: new Date().toISOString(),
            level: 'info',
            message: 'System health check completed',
            service: 'system'
          },
          {
            timestamp: new Date(Date.now() - 60000).toISOString(),
            level: 'info',
            message: 'Workflow engine started',
            service: 'workflow'
          },
          {
            timestamp: new Date(Date.now() - 120000).toISOString(),
            level: 'info',
            message: 'API server started',
            service: 'api'
          }
        ]
      };

      res.json(logs);
    } catch (error) {
      this.logger.error('Failed to get system logs:', error);
      res.status(500).json({ error: 'Failed to get system logs' });
    }
  }

  private async checkDatabaseHealth(): Promise<string> {
    try {
      // This would check database connectivity
      // For now, return online
      return 'online';
    } catch (error) {
      return 'offline';
    }
  }

  private async checkFilesystemHealth(): Promise<string> {
    try {
      const testFile = path.join(os.tmpdir(), 'health-check.tmp');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      return 'online';
    } catch (error) {
      return 'offline';
    }
  }

  private getMemoryStatus(): string {
    const usage = (os.totalmem() - os.freemem()) / os.totalmem();
    if (usage > 0.9) return 'critical';
    if (usage > 0.8) return 'warning';
    return 'normal';
  }

  private async getCPUUsage(): Promise<number> {
    return new Promise((resolve) => {
      const startUsage = process.cpuUsage();
      const startTime = process.hrtime();

      setTimeout(() => {
        const currentUsage = process.cpuUsage(startUsage);
        const currentTime = process.hrtime(startTime);
        
        const totalTime = currentTime[0] * 1000000 + currentTime[1] / 1000;
        const totalUsage = currentUsage.user + currentUsage.system;
        
        const cpuPercent = Math.round((totalUsage / totalTime) * 100);
        resolve(Math.min(cpuPercent, 100));
      }, 100);
    });
  }

  private async getDiskUsage(): Promise<any> {
    try {
      const stats = fs.statSync(process.cwd());
      return {
        path: process.cwd(),
        available: 'unknown', // Would need platform-specific implementation
        used: 'unknown',
        total: 'unknown'
      };
    } catch (error) {
      return {
        error: 'Unable to get disk usage'
      };
    }
  }

  private async checkWorkflowEngineHealth(): Promise<string> {
    try {
      // This would check workflow engine status
      return 'online';
    } catch (error) {
      return 'offline';
    }
  }

  private async checkAgentSystemHealth(): Promise<string> {
    try {
      // This would check agent system status
      return 'online';
    } catch (error) {
      return 'offline';
    }
  }

  private async checkMCPHealth(): Promise<string> {
    try {
      // This would check MCP server status
      return 'partial';
    } catch (error) {
      return 'offline';
    }
  }
}