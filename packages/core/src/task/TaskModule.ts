import { Module } from '@nestjs/common';
import { DatabaseModule } from '@the-new-fuse/database';
import { TaskExecutor } from './TaskExecutor';
import { TaskManager } from './TaskManager';
import { TaskQueue } from './TaskQueue';
import { TaskService } from './TaskService';
import { TaskScheduler } from './TaskScheduler';
@Module({
  // Implementation needed
}
  imports: [DatabaseModule],
  providers: [
    TaskExecutor,
    TaskManager,
    TaskQueue,
    TaskService,
    TaskScheduler,
  ],
  exports: [TaskExecutor, TaskManager, TaskService, TaskScheduler],
})
export class TaskModule {}