/**
 * Task Module - Migrated to Drizzle ORM
 * Provides task management capabilities using Drizzle database service
 */
import { Module } from '@nestjs/common';
// @ts-ignore
// @ts-ignore
import { DatabaseModule } from '@the-new-fuse/database';
import { UnifiedLedgerModule } from '../unified-ledger/unified-ledger.module.js';
import { TaskHealthMonitorService } from './task-health-monitor.service.js';
import { TaskController } from './task.controller.js';
import { TaskService } from './task.service.js';

@Module({
  imports: [
    DatabaseModule, // Provides DatabaseService with Drizzle repositories
    UnifiedLedgerModule,
  ],
  controllers: [TaskController],
  providers: [TaskService, TaskHealthMonitorService],
  exports: [TaskService],
})
export class TaskModule {}
