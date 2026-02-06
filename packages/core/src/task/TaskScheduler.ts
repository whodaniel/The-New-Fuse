import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TaskService } from './TaskService';
import { Task } from './TaskTypes';

@Injectable()
export class TaskScheduler {
  private readonly logger = new Logger(TaskScheduler.name);

  constructor(private readonly taskService: TaskService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    this.logger.debug('Called when the current second is 1');
  }
}
