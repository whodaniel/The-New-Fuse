import { EventEmitter } from 'events';

export interface ScheduledTask {
  id: string;
  name: string;
  schedule: string; // cron format
  handler: () => Promise<void>;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

export class TaskScheduler extends EventEmitter {
  private tasks: Map<string, ScheduledTask> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  registerTask(task: ScheduledTask): void {
    this.tasks.set(task.id, task);
    if (task.enabled) {
      this.scheduleTask(task);
    }
    this.emit('task:registered', task);
  }

  unregisterTask(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (task) {
      this.cancelTask(taskId);
      this.tasks.delete(taskId);
      this.emit('task:unregistered', task);
    }
  }

  private scheduleTask(task: ScheduledTask): void {
    // Simple interval-based scheduling (simplified from cron)
    const intervalMs = this.parseSchedule(task.schedule);

    const interval = setInterval(async () => {
      try {
        task.lastRun = new Date();
        this.emit('task:started', task);
        await task.handler();
        task.nextRun = new Date(Date.now() + intervalMs);
        this.emit('task:completed', task);
      } catch (error) {
        this.emit('task:failed', task, error);
      }
    }, intervalMs);

    this.intervals.set(task.id, interval);
  }

  private cancelTask(taskId: string): void {
    const interval = this.intervals.get(taskId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(taskId);
    }
  }

  private parseSchedule(schedule: string): number {
    // Simplified schedule parser - returns milliseconds
    // In production, use a proper cron parser
    const match = schedule.match(/(\d+)([smhd])/);
    if (!match) return 60000; // default 1 minute

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return 60000;
    }
  }

  enableTask(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.enabled = true;
      this.scheduleTask(task);
    }
  }

  disableTask(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.enabled = false;
      this.cancelTask(taskId);
    }
  }

  getTasks(): ScheduledTask[] {
    return Array.from(this.tasks.values());
  }

  getTask(taskId: string): ScheduledTask | undefined {
    return this.tasks.get(taskId);
  }
}
