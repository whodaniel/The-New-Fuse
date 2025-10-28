import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
export interface SecurityAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

@Injectable()
export class SystemMonitor {
  private readonly logger = new Logger(SystemMonitor.name);
  constructor(private eventEmitter: EventEmitter2) {}

  async getSystemHealth(): Promise<any> {
    return {
      status: 'healthy',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
    };
  }

  async getSecurityAlerts(): Promise<any[]> {
    return [];
  }

  async createAlert(alert: Partial<SecurityAlert>): Promise<SecurityAlert> {
    const newAlert: SecurityAlert = {
      id: Date.now().toString(),
      timestamp: new Date(),
      ...alert,
    } as SecurityAlert;
    this.eventEmitter.emit('security.alert', newAlert);
    return newAlert;
  }
}
