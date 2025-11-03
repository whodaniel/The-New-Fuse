import { Injectable, Logger } from '@nestjs/common';
import { performance } from 'perf_hooks';
import * as os from 'os';

interface ResourceLimits {
  maxConcurrentTasks: number;
  maxCpuUsage: number; // Percentage
  maxMemoryUsage: number; // MB
}

@Injectable()
export class TaskResourceManager {
  private readonly logger = new Logger(TaskResourceManager.name);
  private activeTasks = 0;
  private limits: ResourceLimits = {
    maxConcurrentTasks: 10,
    maxCpuUsage: 80,
    maxMemoryUsage: os.totalmem() / 1024 / 1024 * 0.8, // 80% of total memory
  };

  constructor() {
    this.logger.log(`Initialized with limits:`, this.limits);
  }

  canStartTask(estimatedCpu: number = 0, estimatedMemoryMB: number = 0): boolean {
    if (this.activeTasks >= this.limits.maxConcurrentTasks) {
      this.logger.warn('Cannot start new task: Maximum concurrent tasks reached.');
      return false;
    }

    const currentCpuUsage = this.getCpuUsage();
    if (currentCpuUsage + estimatedCpu > this.limits.maxCpuUsage) {
      this.logger.warn('Cannot start new task: CPU usage limit would be exceeded.');
      return false;
    }

    const freeMemoryMB = this.getFreeMemoryMB();
    if (freeMemoryMB - estimatedMemoryMB < 100) { // Keep a 100MB buffer
      this.logger.warn('Cannot start new task: Memory usage limit would be exceeded.');
      return false;
    }

    return true;
  }

  acquireTaskSlot(): boolean {
    if (this.canStartTask()) {
      this.activeTasks++;
      this.logger.log(`Task slot acquired. Active tasks: ${this.activeTasks}`);
      return true;
    }
    return false;
  }

  releaseTaskSlot(): void {
    if (this.activeTasks > 0) {
      this.activeTasks--;
      this.logger.log(`Task slot released. Active tasks: ${this.activeTasks}`);
    }
  }

  updateLimits(newLimits: Partial<ResourceLimits>): void {
    this.limits = { ...this.limits, ...newLimits };
    this.logger.log('Resource limits updated:', this.limits);
  }

  private getCpuUsage(): number {
    const cpus = os.cpus();
    let totalIdle = 0, totalTick = 0;
    for (const cpu of cpus) {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    }
    return 100 * (1 - totalIdle / totalTick);
  }

  private getFreeMemoryMB(): number {
    return os.freemem() / 1024 / 1024;
  }
}
