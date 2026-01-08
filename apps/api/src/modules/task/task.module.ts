/**
 * Task Module - Migrated to Drizzle ORM
 * Provides task management capabilities using Drizzle database service
 */
import { Module } from '@nestjs/common';
import { DatabaseModule } from '@the-new-fuse/database';
import { TaskService } from './task.service';

@Module({
  imports: [
    DatabaseModule, // Provides DatabaseService with Drizzle repositories
  ],
  providers: [TaskService],
  exports: [TaskService],
})
export class TaskModule {}
