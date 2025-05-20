import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskService } from './task.service.js';
import { Task } from '../../entities/Task.js';
import { TaskExecution } from '../../entities/TaskExecution.js';

@Module({
  imports: [TypeOrmModule.forFeature([Task, TaskExecution])],
  providers: [TaskService],
  exports: [TaskService]
})
export class TaskModule {}
