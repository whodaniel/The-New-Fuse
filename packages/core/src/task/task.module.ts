import { Module } from '@nestjs/common';
import { TaskService } from './TaskService.js';

@Module({
  providers: [TaskService],
  exports: [TaskService],
})
export class TaskModule {}
