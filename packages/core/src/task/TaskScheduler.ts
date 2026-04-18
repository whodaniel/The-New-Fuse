import { Injectable, Logger } from '@nestjs/common';
// @ts-ignore
import { Cron, CronExpression } from '@nestjs/schedule';
import { TaskService } from './TaskService.js';
import { Task } from './TaskTypes.js';

@Injectable()
export class TaskScheduler {
  private readonly logger = new Logger(TaskScheduler.name);

  constructor(private readonly taskService: TaskService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    this.logger.debug('Called when the current second is 1');
    
  }
}
