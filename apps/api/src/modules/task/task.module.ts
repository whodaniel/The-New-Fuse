import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from '@the-new-fuse/database';
import { Task } from '../../entities/Task';
import { TaskExecution } from '../../entities/TaskExecution';
import { TaskService } from './task.service';

@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([Task, TaskExecution])
  ],
  providers: [TaskService],
  exports: [TaskService]
})
export class TaskModule {}
