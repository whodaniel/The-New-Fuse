import { Module } from "@nestjs/common";
import { TaskService } from './task.service.js';
import { DatabaseService } from '../database/database.service.js';

@Module({
  providers: [TaskService, DatabaseService],
  exports: [TaskService],
})
export class TaskModule {}
