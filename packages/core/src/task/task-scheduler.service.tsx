import { Injectable } from '@nestjs/common';
import { RedisService } from '../services/redis.service.js';
import { ConfigService } from '@nestjs/config';
import { Task, TaskStatusType } from '@the-new-fuse/types';

@Injectable()
export class TaskSchedulerService {
  private maxConcurrentTasks: number;

  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService
  ) {
    this.maxConcurrentTasks = this.configService.get('task.maxConcurrent', 10);
  }

  async scheduleTask(task: Task): Promise<void> {
    if (!task.id) {
      throw new Error('TaskValidationError');
    }

    if (task.dependencies?.some(dep => dep.status === TaskStatusType.PENDING)) {
      throw new Error('TaskDependencyError');
    }

    const runningTasks = await this.redisService.getRunningTaskIds();
    if (runningTasks.length >= this.maxConcurrentTasks) {
      return;
    }

    await this.redisService.scheduleTaskOptimization();
  }
}