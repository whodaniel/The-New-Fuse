import { Module } from '@nestjs/common';
import { DatabaseModule } from '@the-new-fuse/database';
import { TaskService } from './task.service';

@Module({
  imports: [DatabaseModule],
  providers: [TaskService],
  exports: [TaskService]
})
export class TaskModule {}
