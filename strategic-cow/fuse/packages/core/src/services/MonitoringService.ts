import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface MonitoringEvent {
  type: string;
  timestamp: Date;
  data: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    database: boolean;
    cache: boolean;
    external_apis: boolean;
    memory: boolean;
    cpu: boolean;
  };
  timestamp: Date;
}

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);
  private events: MonitoringEvent[] = [];
  private readonly maxEvents = 10000;

  constructor(private eventEmitter: EventEmitter2) {}

  recordEvent(type: string, data: any, severity: MonitoringEvent['severity'] = 'low'): void {
    const event: MonitoringEvent = {
      type,
      timestamp: new Date(),
      data,
      severity
    };

    this.events.push(event);

    // Keep only the most recent events
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }

    // Emit event for real-time processing
    this.eventEmitter.emit('monitoring.event', event);

    // Log critical events
    if (severity === 'critical') {
      this.logger.error(`Critical monitoring event: ${type}`, data);
    }
  }

  getEvents(type?: string, limit?: number): MonitoringEvent[] {
    let filteredEvents = type 
      ? this.events.filter(event => event.type === type)
      : this.events;

    if (limit) {
      filteredEvents = filteredEvents.slice(-limit);
    }

    return filteredEvents;
  }

  async getSystemHealth(): Promise<SystemHealth> {
    const checks = {
      database: await this.checkDatabase(),
      cache: await this.checkCache(),
      external_apis: await this.checkExternalAPIs(),
      memory: await this.checkMemory(),
      cpu: await this.checkCPU()
    };

    const healthyChecks = Object.values(checks).filter(Boolean).length;
    const totalChecks = Object.keys(checks).length;

    let status: SystemHealth['status'];
    if (healthyChecks === totalChecks) {
      status = 'healthy';
    } else if (healthyChecks >= totalChecks * 0.7) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    const health: SystemHealth = {
      status,
      checks,
      timestamp: new Date()
    };

    this.recordEvent('system.health_check', health, status === 'unhealthy' ? 'critical' : 'low');

    return health;
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      // Mock database check
      return true;
    } catch (error) {
      this.logger.error('Database health check failed', error);
      return false;
    }
  }

  private async checkCache(): Promise<boolean> {
    try {
      // Mock cache check
      return true;
    } catch (error) {
      this.logger.error('Cache health check failed', error);
      return false;
    }
  }

  private async checkExternalAPIs(): Promise<boolean> {
    try {
      // Mock external API check
      return true;
    } catch (error) {
      this.logger.error('External APIs health check failed', error);
      return false;
    }
  }

  private async checkMemory(): Promise<boolean> {
    try {
      const memUsage = process.memoryUsage();
      const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
      const heapTotalMB = memUsage.heapTotal / 1024 / 1024;
      
      // Consider unhealthy if using more than 80% of heap
      return (heapUsedMB / heapTotalMB) < 0.8;
    } catch (error) {
      this.logger.error('Memory health check failed', error);
      return false;
    }
  }

  private async checkCPU(): Promise<boolean> {
    try {
      // Mock CPU check - in real implementation, would check CPU usage
      return true;
    } catch (error) {
      this.logger.error('CPU health check failed', error);
      return false;
    }
  }

  getEventsSummary(): { total: number; bySeverity: Record<string, number>; byType: Record<string, number> } {
    const bySeverity: Record<string, number> = {};
    const byType: Record<string, number> = {};

    for (const event of this.events) {
      bySeverity[event.severity] = (bySeverity[event.severity] || 0) + 1;
      byType[event.type] = (byType[event.type] || 0) + 1;
    }

    return {
      total: this.events.length,
      bySeverity,
      byType
    };
  }

  clearEvents(olderThan?: Date): void {
    if (olderThan) {
      this.events = this.events.filter(event => event.timestamp > olderThan);
    } else {
      this.events = [];
    }
  }
}