import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CentralizedLoggingService } from '../logging/centralized-logging.service.js';
import { PerformanceMonitoringService } from './performance-monitoring.service.js';
import * as os from 'os';
import * as process from 'process';
import * as fs from 'fs';
import * as util from 'util';

const readFile = util.promisify(fs.readFile);
const fsStats = util.promisify(fs.stat);

export interface SystemResourceMetrics {
  timestamp: Date;
  cpu: {
    usage: number;
    loadAvg: number[];
    cores: number;
  };
  memory: {
    total: number;
    free: number;
    used: number;
    usagePercent: number;
  };
  disk: {
    total: number;
    free: number;
    used: number;
    usagePercent: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    packetsIn: number;
    packetsOut: number;
  };
  process: {
    uptime: number;
    memoryUsage: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
    };
    cpuUsage: {
      user: number;
      system: number;
    };
  };
}

export interface ResourceThreshold {
  resource: string;
  warning: number;
  critical: number;
  unit: string;
}

export interface SystemResourceConfig {
  enabled: boolean;
  collectionIntervalMs: number;
  retentionHours: number;
  alertingEnabled: boolean;
  thresholds: ResourceThreshold[];
}

@Injectable()
export class SystemResourceMonitorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger: any;
  private config: SystemResourceConfig;
  private collectionInterval: NodeJS.Timeout;
  private metrics: SystemResourceMetrics[] = [];
  private lastNetworkStats: { bytesIn: number; bytesOut: number; packetsIn: number; packetsOut: number } | null = null;
  private lastCpuInfo: { user: number; system: number; idle: number } | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly loggingService: CentralizedLoggingService,
    private readonly performanceMonitor: PerformanceMonitoringService,
    private readonly eventEmitter: EventEmitter2
  ) {
    this.logger = this.loggingService.createLogger('SystemResourceMonitor');
  }

  async onModuleInit() {
    // Load configuration
    this.config = {
      enabled: this.configService.get<boolean>('monitoring.systemResources.enabled', true),
      collectionIntervalMs: this.configService.get<number>('monitoring.systemResources.collectionIntervalMs', 60000), // 1 minute
      retentionHours: this.configService.get<number>('monitoring.systemResources.retentionHours', 24),
      alertingEnabled: this.configService.get<boolean>('monitoring.systemResources.alertingEnabled', true),
      thresholds: this.configService.get<ResourceThreshold[]>('monitoring.systemResources.thresholds', [
        { resource: 'cpu.usage', warning: 70, critical: 90, unit: '%' },
        { resource: 'memory.usagePercent', warning: 80, critical: 95, unit: '%' },
        { resource: 'disk.usagePercent', warning: 80, critical: 95, unit: '%' }
      ])
    };

    if (!this.config.enabled) {
      this.logger.info('System resource monitoring is disabled');
      return;
    }

    // Start collection interval
    this.collectionInterval = setInterval(() => this.collectMetrics(), this.config.collectionIntervalMs);
    
    // Collect initial metrics
    await this.collectMetrics();
    
    this.logger.info('System resource monitor initialized', {
      metadata: {
        collectionIntervalMs: this.config.collectionIntervalMs,
        retentionHours: this.config.retentionHours
      }
    });
  }

  async onModuleDestroy() {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
    }
  }

  /**
   * Get the latest system resource metrics
   */
  getLatestMetrics(): SystemResourceMetrics | null {
    if (this.metrics.length === 0) {
      return null;
    }
    
    return this.metrics[this.metrics.length - 1];
  }

  /**
   * Get historical metrics for a specific time range
   */
  getHistoricalMetrics(
    startTime: Date,
    endTime: Date = new Date()
  ): SystemResourceMetrics[] {
    return this.metrics.filter(m => 
      m.timestamp >= startTime && m.timestamp <= endTime
    );
  }

  /**
   * Get average metrics for a specific time range
   */
  getAverageMetrics(
    startTime: Date,
    endTime: Date = new Date()
  ): Partial<SystemResourceMetrics> | null {
    const metrics = this.getHistoricalMetrics(startTime, endTime);
    
    if (metrics.length === 0) {
      return null;
    }
    
    const avgCpuUsage = metrics.reduce((sum, m) => sum + m.cpu.usage, 0) / metrics.length;
    const avgMemoryUsage = metrics.reduce((sum, m) => sum + m.memory.usagePercent, 0) / metrics.length;
    const avgDiskUsage = metrics.reduce((sum, m) => sum + m.disk.usagePercent, 0) / metrics.length;
    
    return {
      timestamp: new Date(),
      cpu: {
        usage: avgCpuUsage,
        loadAvg: [
          metrics.reduce((sum, m) => sum + m.cpu.loadAvg[0], 0) / metrics.length,
          metrics.reduce((sum, m) => sum + m.cpu.loadAvg[1], 0) / metrics.length,
          metrics.reduce((sum, m) => sum + m.cpu.loadAvg[2], 0) / metrics.length
        ],
        cores: metrics[0].cpu.cores
      },
      memory: {
        total: metrics[0].memory.total,
        free: metrics[0].memory.free,
        used: metrics[0].memory.used,
        usagePercent: avgMemoryUsage
      },
      disk: {
        total: metrics[0].disk.total,
        free: metrics[0].disk.free,
        used: metrics[0].disk.used,
        usagePercent: avgDiskUsage
      }
    };
  }

  /**
   * Check if any resource is above warning or critical thresholds
   */
  checkResourceThresholds(): { resource: string; level: 'warning' | 'critical'; value: number; threshold: number; unit: string }[] {
    const latestMetrics = this.getLatestMetrics();
    
    if (!latestMetrics) {
      return [];
    }
    
    const alerts = [];
    
    for (const threshold of this.config.thresholds) {
      const value = this.getResourceValue(latestMetrics, threshold.resource);
      
      if (value === null) {
        continue;
      }
      
      if (value >= threshold.critical) {
        alerts.push({
          resource: threshold.resource,
          level: 'critical',
          value,
          threshold: threshold.critical,
          unit: threshold.unit
        });
      } else if (value >= threshold.warning) {
        alerts.push({
          resource: threshold.resource,
          level: 'warning',
          value,
          threshold: threshold.warning,
          unit: threshold.unit
        });
      }
    }
    
    return alerts;
  }

  /**
   * Manually trigger metrics collection
   */
  async collectMetrics(): Promise<SystemResourceMetrics> {
    try {
      // Collect CPU metrics
      const cpuUsage = await this.getCpuUsage();
      const loadAvg = os.loadavg();
      const cpuCores = os.cpus().length;
      
      // Collect memory metrics
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;
      const memoryUsagePercent = (usedMemory / totalMemory) * 100;
      
      // Collect disk metrics
      const diskMetrics = await this.getDiskUsage();
      
      // Collect network metrics
      const networkMetrics = await this.getNetworkUsage();
      
      // Collect process metrics
      const processUptime = process.uptime();
      const processMemoryUsage = process.memoryUsage();
      const processCpuUsage = process.cpuUsage();
      
      // Create metrics object
      const metrics: SystemResourceMetrics = {
        timestamp: new Date(),
        cpu: {
          usage: cpuUsage,
          loadAvg,
          cores: cpuCores
        },
        memory: {
          total: totalMemory,
          free: freeMemory,
          used: usedMemory,
          usagePercent: memoryUsagePercent
        },
        disk: diskMetrics,
        network: networkMetrics,
        process: {
          uptime: processUptime,
          memoryUsage: {
            rss: processMemoryUsage.rss,
            heapTotal: processMemoryUsage.heapTotal,
            heapUsed: processMemoryUsage.heapUsed,
            external: processMemoryUsage.external
          },
          cpuUsage: {
            user: processCpuUsage.user,
            system: processCpuUsage.system
          }
        }
      };
      
      // Add to metrics history
      this.metrics.push(metrics);
      
      // Prune old metrics
      this.pruneOldMetrics();
      
      // Record in performance monitoring
      this.recordMetricsInPerformanceMonitor(metrics);
      
      // Check thresholds and alert if necessary
      if (this.config.alertingEnabled) {
        this.checkAndAlertThresholds(metrics);
      }
      
      // Emit event
      this.eventEmitter.emit('monitoring.systemMetrics', metrics);
      
      return metrics;
    } catch (error) {
      this.logger.error('Failed to collect system resource metrics', { error });
      throw error;
    }
  }

  /**
   * Private methods
   */

  private async getCpuUsage(): Promise<number> {
    try {
      // Read CPU info from /proc/stat on Linux
      if (process.platform === 'linux') {
        const stat = await readFile('/proc/stat', 'utf8');
        const cpuLine = stat.split('\n')[0];
        const cpuValues = cpuLine.split(/\s+/).slice(1, 5).map(Number);
        
        const user = cpuValues[0];
        const nice = cpuValues[1];
        const system = cpuValues[2];
        const idle = cpuValues[3];
        
        if (this.lastCpuInfo === null) {
          this.lastCpuInfo = { user, system, idle };
          return 0;
        }
        
        const userDiff = user - this.lastCpuInfo.user;
        const systemDiff = system - this.lastCpuInfo.system;
        const idleDiff = idle - this.lastCpuInfo.idle;
        const totalDiff = userDiff + systemDiff + idleDiff;
        
        this.lastCpuInfo = { user, system, idle };
        
        return totalDiff === 0 ? 0 : ((userDiff + systemDiff) / totalDiff) * 100;
      }
      
      // Fallback for other platforms
      const cpus = os.cpus();
      let totalIdle = 0;
      let totalTick = 0;
      
      for (const cpu of cpus) {
        for (const type in cpu.times) {
          totalTick += cpu.times[type as keyof typeof cpu.times];
        }
        totalIdle += cpu.times.idle;
      }
      
      return 100 - (totalIdle / totalTick) * 100;
    } catch (error) {
      this.logger.error('Failed to get CPU usage', { error });
      return 0;
    }
  }

  private async getDiskUsage(): Promise<{ total: number; free: number; used: number; usagePercent: number }> {
    try {
      // Get disk usage for the current directory
      const stats = await fsStats('.');
      
      // This is a simplified approach - in a real system, you'd use a library like diskusage
      // or exec df -k command to get actual disk usage
      
      // Fallback to a default value for now
      const total = 1000 * 1024 * 1024 * 1024; // 1TB
      const free = 500 * 1024 * 1024 * 1024; // 500GB
      const used = total - free;
      const usagePercent = (used / total) * 100;
      
      return { total, free, used, usagePercent };
    } catch (error) {
      this.logger.error('Failed to get disk usage', { error });
      return { total: 0, free: 0, used: 0, usagePercent: 0 };
    }
  }

  private async getNetworkUsage(): Promise<{ bytesIn: number; bytesOut: number; packetsIn: number; packetsOut: number }> {
    try {
      // Read network stats from /proc/net/dev on Linux
      if (process.platform === 'linux') {
        const netDev = await readFile('/proc/net/dev', 'utf8');
        const lines = netDev.split('\n').slice(2); // Skip header lines
        
        let bytesIn = 0;
        let bytesOut = 0;
        let packetsIn = 0;
        let packetsOut = 0;
        
        for (const line of lines) {
          if (!line.trim()) continue;
          
          const parts = line.trim().split(/\s+/);
          if (parts.length < 10) continue;
          
          // Skip loopback interface
          if (parts[0].includes('lo:')) continue;
          
          bytesIn += parseInt(parts[1], 10);
          packetsIn += parseInt(parts[2], 10);
          bytesOut += parseInt(parts[9], 10);
          packetsOut += parseInt(parts[10], 10);
        }
        
        if (this.lastNetworkStats === null) {
          this.lastNetworkStats = { bytesIn, bytesOut, packetsIn, packetsOut };
          return { bytesIn: 0, bytesOut: 0, packetsIn: 0, packetsOut: 0 };
        }
        
        const result = {
          bytesIn: bytesIn - this.lastNetworkStats.bytesIn,
          bytesOut: bytesOut - this.lastNetworkStats.bytesOut,
          packetsIn: packetsIn - this.lastNetworkStats.packetsIn,
          packetsOut: packetsOut - this.lastNetworkStats.packetsOut
        };
        
        this.lastNetworkStats = { bytesIn, bytesOut, packetsIn, packetsOut };
        
        return result;
      }
      
      // Fallback for other platforms
      return { bytesIn: 0, bytesOut: 0, packetsIn: 0, packetsOut: 0 };
    } catch (error) {
      this.logger.error('Failed to get network usage', { error });
      return { bytesIn: 0, bytesOut: 0, packetsIn: 0, packetsOut: 0 };
    }
  }

  private pruneOldMetrics(): void {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - this.config.retentionHours);
    
    this.metrics = this.metrics.filter(m => m.timestamp >= cutoff);
  }

  private recordMetricsInPerformanceMonitor(metrics: SystemResourceMetrics): void {
    // Record CPU usage
    this.performanceMonitor.recordResourceUsage({
      resource: 'system.cpu.usage',
      usage: metrics.cpu.usage,
      capacity: 100,
      tags: { unit: '%' }
    });
    
    // Record memory usage
    this.performanceMonitor.recordResourceUsage({
      resource: 'system.memory.usage',
      usage: metrics.memory.used,
      capacity: metrics.memory.total,
      tags: { unit: 'bytes' }
    });
    
    // Record disk usage
    this.performanceMonitor.recordResourceUsage({
      resource: 'system.disk.usage',
      usage: metrics.disk.used,
      capacity: metrics.disk.total,
      tags: { unit: 'bytes' }
    });
    
    // Record process memory usage
    this.performanceMonitor.recordResourceUsage({
      resource: 'process.memory.rss',
      usage: metrics.process.memoryUsage.rss,
      tags: { unit: 'bytes' }
    });
    
    this.performanceMonitor.recordResourceUsage({
      resource: 'process.memory.heapUsed',
      usage: metrics.process.memoryUsage.heapUsed,
      capacity: metrics.process.memoryUsage.heapTotal,
      tags: { unit: 'bytes' }
    });
  }

  private checkAndAlertThresholds(metrics: SystemResourceMetrics): void {
    const alerts = this.checkResourceThresholds();
    
    for (const alert of alerts) {
      const logLevel = alert.level === 'critical' ? 'error' : 'warn';
      
      this.logger[logLevel](`Resource ${alert.resource} is above ${alert.level} threshold`, {
        metadata: {
          resource: alert.resource,
          value: alert.value,
          threshold: alert.threshold,
          unit: alert.unit
        }
      });
      
      // Emit alert event
      this.eventEmitter.emit('monitoring.resourceAlert', {
        timestamp: new Date(),
        resource: alert.resource,
        level: alert.level,
        value: alert.value,
        threshold: alert.threshold,
        unit: alert.unit
      });
    }
  }

  private getResourceValue(metrics: SystemResourceMetrics, resourcePath: string): number | null {
    const parts = resourcePath.split('.');
    let current: any = metrics;
    
    for (const part of parts) {
      if (current === undefined || current === null) {
        return null;
      }
      
      current = current[part];
    }
    
    return typeof current === 'number' ? current : null;
  }
}
