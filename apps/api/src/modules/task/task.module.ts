import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskService } from './task.service.tsx';
import { Task } from '../../entities/Task';
import { TaskExecution } from '../../entities/TaskExecution';

@Module({
  imports: [TypeOrmModule.forFeature([Task, TaskExecution])],
  providers: [TaskService],
  exports: [TaskService]
})
export class TaskModule {}
