import { Injectable, OnModuleInit } from '@nestjs/common';
import { Logger } from '@the-new-fuse/utils';
import { DatabaseService } from '@the-new-fuse/database';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { parse as parseCron } from 'cron-parser';
import { RedisService } from '@the-new-fuse/database';

interface Schedule {
  id: string;
  name: string;
  description: string;
  type: 'one-time' | 'recurring';
  taskTemplate: {
    type: string;
    name: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    metadata: Record<string, unknown>;
  };
  timing: {
    startAt?: Date;
    endAt?: Date;
    cron?: string;
    interval?: number;
  };
  enabled: boolean;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  lastRun?: Date;
  nextRun?: Date;
}

interface ScheduleExecution {
  id: string;
  scheduleId: string;
  taskId: string;
  status: 'pending' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  error?: string;
  metadata: Record<string, unknown>;
}

@Injectable()
export class SchedulerService extends EventEmitter implements OnModuleInit {
  private logger: Logger;
  private redisService: RedisService;
  private db: DatabaseService;
  private schedules: Map<string, Schedule>;
  private readonly checkInterval: number;
  private readonly lookAheadWindow: number;

  constructor(redisService: RedisService, databaseService: DatabaseService) {
    super();
    this.logger = new Logger(SchedulerService.name);
    this.redisService = redisService;
    this.db = databaseService;
    this.schedules = new Map<string, Schedule>();
    this.checkInterval = 60; // seconds
    this.lookAheadWindow = 300; // seconds
  }

  async onModuleInit(): Promise<any> {
    await this.loadSchedules();
    this.startScheduler();
    return;
  }

  private async loadSchedules(): Promise<void> {
    try {
      const schedules = await this.db.schedules.findMany({
        where: { enabled: true }
      });

      for (const schedule of schedules) {
        this.schedules.set(schedule.id, {
          ...schedule,
          taskTemplate: JSON.parse(schedule.taskTemplate),
          timing: JSON.parse(schedule.timing),
          metadata: JSON.parse(schedule.metadata)
        });
      }

      this.logger.info(`Loaded ${schedules.length} schedules`);
    } catch (error: unknown) {
      this.logger.error('Failed to load schedules:', error instanceof Error ? error : new Error(String(error)));
    }
  }

  async createSchedule(data: {
    name: string;
    description: string;
    type: 'one-time' | 'recurring';
    taskTemplate: {
      type: string;
      name: string;
      description: string;
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      metadata?: Record<string, unknown>;
    };
    timing: {
      startAt?: Date;
      endAt?: Date;
      cron?: string;
      interval?: number;
    };
    metadata?: Record<string, unknown>;
  }): Promise<Schedule> {
    try {
      // Validate timing
      if (data.type === 'recurring' && !(data.timing.cron || data.timing.interval)) {
        throw new Error('Recurring schedule must have either cron or interval');
      }

      if (data.timing.cron) {
        // Validate cron expression
        parseCron(data.timing.cron);
      }

      // Create schedule
      const schedule: Schedule = {
        id: uuidv4(),
        name: data.name,
        description: data.description,
        type: data.type,
        taskTemplate: {
          ...data.taskTemplate,
          priority: data.taskTemplate.priority || 'medium',
          metadata: data.taskTemplate.metadata || {}
        },
        timing: data.timing,
        enabled: true,
        metadata: data.metadata || {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Calculate next run
      schedule.nextRun = this.calculateNextRun(schedule);

      // Store schedule
      await this.db.schedules.create({
        data: {
          ...schedule,
          taskTemplate: JSON.stringify(schedule.taskTemplate),
          timing: JSON.stringify(schedule.timing),
          metadata: JSON.stringify(schedule.metadata)
        }
      });

      // Cache schedule
      this.schedules.set(schedule.id, schedule);

      // Emit event
      this.emit('scheduleCreated', {
        scheduleId: schedule.id,
        name: schedule.name,
        type: schedule.type
      });

      return schedule;

    } catch (error: unknown) {
      this.logger.error('Failed to create schedule:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  private calculateNextRun(schedule: Schedule): Date | undefined {
    if (!schedule.enabled) {
      return undefined;
    }

    if (schedule.type === 'one-time') {
      return schedule.timing.startAt || new Date();
    }

    if (schedule.timing.cron) {
      try {
        const interval = parseCron(schedule.timing.cron);
        return interval.next().toDate();
      } catch (error: unknown) {
        this.logger.error(`Invalid cron expression for schedule ${schedule.id}:`, error instanceof Error ? error : new Error(String(error)));
        return undefined;
      }
    } else if (schedule.timing.interval) {
      const lastRun = schedule.lastRun || new Date();
      return new Date(lastRun.getTime() + schedule.timing.interval * 1000);
    }

    return undefined;
  }

  private startScheduler(): void {
    setInterval(async () => {
      await this.processSchedules();
    }, this.checkInterval * 1000);
    
    this.logger.info(`Scheduler started with interval ${this.checkInterval}s`);
  }

  private async processSchedules(): Promise<void> {
    try {
      const now = new Date();
      const endWindow = new Date(now.getTime() + this.lookAheadWindow * 1000);

      for (const schedule of this.schedules.values()) {
        if (!schedule.enabled || !schedule.nextRun) continue;

        if (schedule.nextRun <= endWindow) {
          schedule.nextRun = this.calculateNextRun(schedule);
          await this.updateSchedule(schedule.id, { lastRun: now });
          await this.createScheduledTask(schedule);
        }
      }
    } catch (error) {
      this.logger.error('Scheduler iteration failed:', error instanceof Error ? error : new Error(String(error)));
    }
  }

  private async createScheduledTask(schedule: Schedule): Promise<void> {
    try {
      const execution: ScheduleExecution = {
        id: uuidv4(),
        scheduleId: schedule.id,
        taskId: '', // Will be set after task creation
        status: 'pending',
        startTime: new Date(),
        metadata: {}
      };

      // Create task
      const task = await this.db.tasks.create({
        data: {
          id: uuidv4(),
          type: schedule.taskTemplate.type,
          name: schedule.taskTemplate.name,
          description: schedule.taskTemplate.description,
          priority: schedule.taskTemplate.priority,
          metadata: {
            ...schedule.taskTemplate.metadata,
            scheduleId: schedule.id,
            executionId: execution.id
          }
        }
      });

      execution.taskId = task.id;

      // Store execution record
      await this.db.scheduleExecutions.create({
        data: {
          ...execution,
          metadata: JSON.stringify(execution.metadata)
        }
      });

      // Emit event
      this.emit('taskScheduled', {
        scheduleId: schedule.id,
        taskId: task.id,
        executionId: execution.id
      });

    } catch (error: unknown) {
      this.logger.error(`Failed to create scheduled task for schedule ${schedule.id}:`, error instanceof Error ? error : new Error(String(error)));
    }
  }

  async updateSchedule(
    scheduleId: string,
    updates: Partial<Schedule>
  ): Promise<Schedule> {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) {
      throw new Error(`Schedule ${scheduleId} not found`);
    }

    // Merge updates with existing schedule
    const updatedSchedule = {
      ...schedule,
      ...updates,
      updatedAt: new Date()
    };

    // Recalculate next run if relevant fields changed
    if (updates.enabled !== undefined || 
        updates.timing !== undefined || 
        updates.type !== undefined) {
      updatedSchedule.nextRun = this.calculateNextRun(updatedSchedule);
    }

    // Update database
    await this.db.schedules.update({
      where: { id: scheduleId },
      data: {
        ...updatedSchedule,
        taskTemplate: JSON.stringify(updatedSchedule.taskTemplate),
        timing: JSON.stringify(updatedSchedule.timing),
        metadata: JSON.stringify(updatedSchedule.metadata)
      }
    });

    // Update cache
    this.schedules.set(scheduleId, updatedSchedule);

    // Emit event
    this.emit('scheduleUpdated', {
      scheduleId,
      updates: Object.keys(updates)
    });

    return updatedSchedule;
  }

  async deleteSchedule(scheduleId: string): Promise<void> {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) {
      throw new Error(`Schedule ${scheduleId} not found`);
    }

    // Remove from database
    await this.db.schedules.delete({
      where: { id: scheduleId }
    });

    // Remove from cache
    this.schedules.delete(scheduleId);

    // Emit event
    this.emit('scheduleDeleted', {
      scheduleId,
      name: schedule.name
    });
  }

  async getSchedules(
    options: {
      type?: string;
      enabled?: boolean;
      startTime?: Date;
      endTime?: Date;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<Schedule[]> {
    return this.db.schedules.findMany({
      where: {
        type: options.type,
        enabled: options.enabled,
        createdAt: {
          gte: options.startTime,
          lte: options.endTime
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: options.offset,
      take: options.limit
    });
  }

  async getScheduleExecutions(
    scheduleId: string,
    options: {
      status?: string;
      startTime?: Date;
      endTime?: Date;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<ScheduleExecution[]> {
    return this.db.scheduleExecutions.findMany({
      where: {
        scheduleId,
        status: options.status,
        startTime: {
          gte: options.startTime,
          lte: options.endTime
        }
      },
      orderBy: { startTime: 'desc' },
      skip: options.offset,
      take: options.limit
    });
  }

  async cleanupExecutions(
    options: {
      olderThan?: Date;
      status?: string;
    } = {}
  ): Promise<void> {
    // Clear old executions
    await this.db.scheduleExecutions.deleteMany({
      where: {
        startTime: options.olderThan
          ? { lt: options.olderThan }
          : undefined,
        status: options.status
      }
    });
  }
}
