import { Module } from "@nestjs/common";
import { TaskService } from './task.service.tsx';
import { DatabaseService } from '../database/database.service.tsx';

@Module({
  providers: [TaskService, DatabaseService],
  exports: [TaskService],
})
export class TaskModule {}
