import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@the-new-fuse/database';
import { TaskExecutor, Task, TaskStatusType } from './TaskExecutor';

@Injectable()
export class TaskManager {
  private readonly logger = new Logger(TaskManager.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly taskExecutor: TaskExecutor,
  ) {}

  async createTask(taskData: any): Promise<Task> {
    const task = await this.prisma.task.create({
      data: {
        type: taskData.type,
        data: taskData.data,
        status: 'PENDING',
      },
    });
    return task as Task;
  }
}
