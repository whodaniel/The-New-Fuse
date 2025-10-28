import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface DirectorMetrics {
  directorId: string;
  tasksAssigned: number;
  tasksCompleted: number;
  tasksFailed: number;
  averageCompletionTime: number;
  successRate: number;
  timestamp: Date;
}

export interface TaskAnalytics {
  taskId: string;
  directorId: string;
  workerId?: string;
  status: 'assigned' | 'in_progress' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  processingTime?: number;
}

@Injectable()
export class DirectorAnalyticsService {
  private readonly logger = new Logger(DirectorAnalyticsService.name);
  private taskHistory: TaskAnalytics[] = [];

  constructor(private eventEmitter: EventEmitter2) {}

  async trackTask(analytics: TaskAnalytics): Promise<void> {
    try {
      this.taskHistory.push(analytics);
      this.eventEmitter.emit('analytics.task.tracked', analytics);

      if (this.taskHistory.length > 10000) {
        this.taskHistory.shift();
      }
    } catch (error) {
      this.logger.error('Failed to track task', error);
    }
  }

  async getDirectorMetrics(directorId: string): Promise<DirectorMetrics> {
    const directorTasks = this.taskHistory.filter(t => t.directorId === directorId);

    const completed = directorTasks.filter(t => t.status === 'completed').length;
    const failed = directorTasks.filter(t => t.status === 'failed').length;

    const completedTasks = directorTasks.filter(
      t => t.status === 'completed' && t.processingTime
    );

    const avgTime = completedTasks.length > 0
      ? completedTasks.reduce((sum, t) => sum + (t.processingTime || 0), 0) / completedTasks.length
      : 0;

    const successRate = directorTasks.length > 0
      ? (completed / directorTasks.length) * 100
      : 100;

    return {
      directorId,
      tasksAssigned: directorTasks.length,
      tasksCompleted: completed,
      tasksFailed: failed,
      averageCompletionTime: avgTime,
      successRate,
      timestamp: new Date()
    };
  }

  async getAllDirectorMetrics(): Promise<DirectorMetrics[]> {
    const directorIds = [...new Set(this.taskHistory.map(t => t.directorId))];
    return Promise.all(directorIds.map(id => this.getDirectorMetrics(id)));
  }

  async clearHistory(): Promise<void> {
    this.taskHistory = [];
    this.logger.info('Analytics history cleared');
  }
}
