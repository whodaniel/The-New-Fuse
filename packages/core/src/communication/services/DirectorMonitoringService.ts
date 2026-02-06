import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface DirectorStatus {
  directorId: string;
  status: 'active' | 'idle' | 'busy' | 'offline';
  currentTasks: number;
  capacity: number;
  lastHeartbeat: Date;
}

export interface DirectorHealth {
  directorId: string;
  healthy: boolean;
  issues: string[];
  uptime: number;
  responseTime: number;
}

@Injectable()
export class DirectorMonitoringService {
  private readonly logger = new Logger(DirectorMonitoringService.name);
  private directorStatuses = new Map<string, DirectorStatus>();

  constructor(private eventEmitter: EventEmitter2) {}

  async updateDirectorStatus(status: DirectorStatus): Promise<void> {
    try {
      this.directorStatuses.set(status.directorId, status);
      this.eventEmitter.emit('director.status.updated', status);
    } catch (error) {
      this.logger.error('Failed to update director status', error);
    }
  }

  async getDirectorStatus(directorId: string): Promise<DirectorStatus | undefined> {
    return this.directorStatuses.get(directorId);
  }

  async getAllDirectorStatuses(): Promise<DirectorStatus[]> {
    return Array.from(this.directorStatuses.values());
  }

  async checkDirectorHealth(directorId: string): Promise<DirectorHealth> {
    const status = this.directorStatuses.get(directorId);
    const issues: string[] = [];

    if (!status) {
      return {
        directorId,
        healthy: false,
        issues: ['Director not found'],
        uptime: 0,
        responseTime: 0,
      };
    }

    const timeSinceHeartbeat = Date.now() - status.lastHeartbeat.getTime();
    if (timeSinceHeartbeat > 60000) {
      issues.push('No heartbeat received in over 1 minute');
    }

    if (status.currentTasks >= status.capacity) {
      issues.push('Director at maximum capacity');
    }

    return {
      directorId,
      healthy: issues.length === 0,
      issues,
      uptime: Date.now() - status.lastHeartbeat.getTime(),
      responseTime: Math.random() * 100,
    };
  }
}
