import { Module } from '@nestjs/common';
import { TaskService } from './TaskService';

@Module({
  providers: [TaskService],
  exports: [TaskService],
})
export class TaskModule {}
